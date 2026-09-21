import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Chart of Accounts with current balance
   */
  async getAccounts(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    return this.prisma.financialAccount.findMany({
      where: { organizationId: orgId },
      orderBy: { accountCode: 'asc' }
    });
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

    const totalAmountMinor = debits.reduce((acc, d) => acc + d, 0n);
    const txCode = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const writeTransaction = async (tx: Prisma.TransactionClient) => {
      // Create Header
      const transaction = await tx.financialLedgerTransaction.create({
        data: {
          organizationId: orgId,
          transactionCode: txCode,
          transactionType: dto.transactionType,
          description: dto.description,
          referenceEntity: dto.referenceEntity,
          referenceId: dto.referenceId,
          totalAmountMinor: totalAmountMinor,
          currencyCode: dto.currencyCode || 'INR'
        }
      });

      const accountCodes = [...new Set(dto.entries.map((entry) => entry.accountCode))];
      const accounts = await tx.financialAccount.findMany({
        where: { organizationId: orgId, accountCode: { in: accountCodes } },
        select: { id: true, accountCode: true }
      });
      const accountIds = new Map(accounts.map((account) => [account.accountCode, account.id]));
      const missingCode = accountCodes.find((code) => !accountIds.has(code));
      if (missingCode) throw new NotFoundException(`Financial Account with code "${missingCode}" not found`);

      await tx.financialLedgerEntry.createMany({
        data: dto.entries.map((entry) => ({
          transactionId: transaction.id,
          accountId: accountIds.get(entry.accountCode)!,
          entryType: entry.entryType,
          amountMinor: BigInt(entry.amountMinor),
          currencyCode: dto.currencyCode || 'INR'
        }))
      });

      return transaction;
    };

    return transactionClient
      ? writeTransaction(transactionClient)
      : this.prisma.$transaction(writeTransaction, { timeout: 15000 });
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
  }
}
