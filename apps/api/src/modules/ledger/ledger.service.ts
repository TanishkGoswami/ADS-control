import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { TransactionType, EntryType, assertLedgerBalanced, toPaise } from '@ads-control/shared';
import type { Prisma } from '@prisma/client';

export interface PostJournalEntryDto {
  accountCode: string;
  entryType: EntryType;
  amountMinor: bigint;
}

export interface PostTransactionDto {
  organizationId?: string;
  transactionType: TransactionType;
  description: string;
  referenceEntity?: string;
  referenceId?: string;
  currencyCode?: string;
  entries: PostJournalEntryDto[];
}

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  /**
   * Get Chart of Accounts with current balance
   */
  async getAccounts(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `ledger:accounts:${orgId}`;

    return this.cache.wrap(cacheKey, async () => {
      return this.prisma.financialAccount.findMany({
        where: { organizationId: orgId },
        orderBy: { accountCode: 'asc' }
      });
    }, 60);
  }

  /**
   * Post an immutable double-entry journal transaction.
   * Enforces:
   * 1. sum(debit) == sum(credit)
   * 2. BigInt minor units only
   * 3. Atomic database write
   */
  async postTransaction(dto: PostTransactionDto, transactionClient?: Prisma.TransactionClient) {
    const orgId = await this.prisma.resolveOrgId(dto.organizationId);

    const debits = dto.entries
      .filter((e) => e.entryType === EntryType.DEBIT)
      .map((e) => BigInt(e.amountMinor));
    const credits = dto.entries
      .filter((e) => e.entryType === EntryType.CREDIT)
      .map((e) => BigInt(e.amountMinor));

    // 1. Verify double-entry balance invariant
    try {
      assertLedgerBalanced(debits, credits);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }

    const totalAmount = debits.reduce((sum, val) => sum + val, 0n);

    const writeTransaction = async (tx: Prisma.TransactionClient) => {
      // Fetch account IDs for provided codes
      const accountCodes = [...new Set(dto.entries.map((e) => e.accountCode))];
      const accounts = await tx.financialAccount.findMany({
        where: { organizationId: orgId, accountCode: { in: accountCodes } }
      });

      if (accounts.length !== accountCodes.length) {
        throw new BadRequestException('One or more financial accounts in the transaction do not exist');
      }

      const accountIds = new Map(accounts.map((a) => [a.accountCode, a.id]));

      // 2. Create Header
      const transaction = await tx.financialLedgerTransaction.create({
        data: {
          organizationId: orgId,
          transactionCode: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          transactionType: dto.transactionType,
          description: dto.description,
          referenceEntity: dto.referenceEntity,
          referenceId: dto.referenceId,
          totalAmountMinor: totalAmount,
          currencyCode: dto.currencyCode || 'INR'
        }
      });

      // 3. Create Entries
      await tx.financialLedgerEntry.createMany({
        data: dto.entries.map((entry) => ({
          organizationId: orgId,
          transactionId: transaction.id,
          accountId: accountIds.get(entry.accountCode)!,
          entryType: entry.entryType,
          amountMinor: BigInt(entry.amountMinor),
          currencyCode: dto.currencyCode || 'INR'
        }))
      });

      return transaction;
    };

    const result = transactionClient
      ? await writeTransaction(transactionClient)
      : await this.prisma.$transaction(writeTransaction, { timeout: 15000 });

    await this.cache.delPattern('ledger:*');
    await this.cache.delPattern('reports:*');

    return result;
  }

  /**
   * Reverses a previously posted transaction creating exact mirror entries.
   */
  async reverseTransaction(organizationId: string | undefined, transactionId: string, reason: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const original = await this.prisma.financialLedgerTransaction.findUnique({
      where: { id: transactionId },
      include: { entries: { include: { account: true } } }
    });

    if (!original) throw new NotFoundException('Transaction not found');
    if (original.organizationId !== orgId) throw new BadRequestException('Organization mismatch');

    const reversalEntries: PostJournalEntryDto[] = original.entries.map((e) => ({
      accountCode: e.account.accountCode,
      entryType: e.entryType === 'DEBIT' ? EntryType.CREDIT : EntryType.DEBIT,
      amountMinor: e.amountMinor
    }));

    return this.postTransaction({
      organizationId: orgId,
      transactionType: TransactionType.CORRECTION_REVERSAL,
      description: `Reversal of ${original.transactionCode}: ${reason}`,
      referenceEntity: 'TRANSACTION',
      referenceId: original.id,
      currencyCode: original.currencyCode,
      entries: reversalEntries
    });
  }

  /**
   * Get all transactions for an organization
   */
  async getTransactions(organizationId?: string, limit = 50) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `ledger:transactions:${orgId}:${limit}`;

    return this.cache.wrap(cacheKey, async () => {
      return this.prisma.financialLedgerTransaction.findMany({
        where: { organizationId: orgId },
        orderBy: { postedAt: 'desc' },
        take: limit,
        include: {
          entries: {
            include: { account: true }
          }
        }
      });
    }, 60);
  }
}
