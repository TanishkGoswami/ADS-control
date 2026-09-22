import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { FundOwnerType, MoneyStatus, TransactionType, EntryType, LeftoverResolutionAction } from '@ads-control/shared';

@Injectable()
export class FundAllocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService
  ) {}

  async allocateClientFundBatch(
    organizationId: string,
    clientId: string,
    jobCode: string,
    jobTitle: string,
    allocations: Array<{ adAccountId: string; amountMinor: bigint }>
  ) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cleanJobCode = jobCode.trim();
    const uniqueAccountIds = new Set(allocations.map((item) => item.adAccountId));
    const totalMinor = allocations.reduce((sum, item) => sum + item.amountMinor, 0n);

    if (!cleanJobCode) throw new BadRequestException('Campaign job code is required');
    if (!allocations.length) throw new BadRequestException('Select at least one ad account');
    if (uniqueAccountIds.size !== allocations.length) throw new BadRequestException('Each ad account can only be selected once');
    if (allocations.some((item) => item.amountMinor <= 0n)) throw new BadRequestException('Every allocation amount must be greater than zero');

    return this.prisma.$transaction(async (tx) => {
      const [client, wallet, accounts] = await Promise.all([
        tx.client.findFirst({ where: { id: clientId, organizationId: orgId } }),
        tx.clientWallet.findFirst({ where: { clientId, organizationId: orgId } }),
        tx.adAccount.findMany({ where: { id: { in: [...uniqueAccountIds] }, organizationId: orgId } })
      ]);

      if (!client || !wallet) throw new NotFoundException('Client wallet not found');
      if (wallet.balanceMinor < totalMinor) throw new BadRequestException('The selected allocations exceed the available client wallet');
      if (accounts.length !== uniqueAccountIds.size) throw new BadRequestException('One or more ad accounts are unavailable');
      if (accounts.some((account) => !account.canRunAds || account.normalizedStatus !== 'ACTIVE')) {
        throw new BadRequestException('Restricted or inactive ad accounts cannot receive funds');
      }

      const job = await tx.clientJob.upsert({
        where: { organizationId_jobCode: { organizationId: orgId, jobCode: cleanJobCode } },
        create: {
          organizationId: orgId,
          clientId,
          jobCode: cleanJobCode,
          title: jobTitle.trim() || cleanJobCode,
          plannedBudgetMinor: totalMinor
        },
        update: { plannedBudgetMinor: { increment: totalMinor } }
      });

      if (job.clientId !== clientId) throw new BadRequestException('This job code belongs to another client');

      await tx.clientWallet.update({ where: { clientId }, data: { balanceMinor: { decrement: totalMinor } } });

      const results: unknown[] = [];
      for (const item of allocations) {
        const allocation = await tx.clientJobAllocation.create({
          data: {
            organizationId: orgId,
            clientJobId: job.id,
            adAccountId: item.adAccountId,
            allocatedMinor: item.amountMinor,
            status: 'ACTIVE'
          }
        });
        const fundLot = await tx.fundLot.create({
          data: {
            organizationId: orgId,
            lotCode: `LOT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ownerType: FundOwnerType.CLIENT,
            ownerId: clientId,
            initialAmountMinor: item.amountMinor,
            currentAmountMinor: item.amountMinor,
            status: MoneyStatus.ALLOCATED,
            locationAdAccountId: item.adAccountId,
            currencyCode: 'INR'
          }
        });
        results.push({ allocation, fundLot });
      }

      await this.ledgerService.postTransaction({
        organizationId: orgId,
        transactionType: TransactionType.CLIENT_CAMPAIGN_ALLOCATION,
        description: `Allocated client wallet funds to ${allocations.length} ad account${allocations.length === 1 ? '' : 's'} for ${cleanJobCode}`,
        referenceEntity: 'CLIENT_JOB',
        referenceId: job.id,
        entries: [
          { accountCode: '2000-CLIENT-WALLETS', entryType: EntryType.DEBIT, amountMinor: totalMinor },
          { accountCode: '1100-AD-ACCOUNT-PREPAY', entryType: EntryType.CREDIT, amountMinor: totalMinor }
        ]
      }, tx);

      return { job, allocations: results, totalMinor };
    }, { timeout: 15000 });
  }

  /**
   * Allocate funds from a Client's wallet to a target Ad Account for a Job.
   */
  async allocateClientFundToJob(
    organizationId: string | undefined,
    clientId: string,
    clientJobId: string,
    adAccountId: string,
    amountMinor: bigint
  ) {
    const orgId = await this.prisma.resolveOrgId(organizationId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Client Wallet Balance
      const wallet = await tx.clientWallet.findUnique({
        where: { clientId }
      });

      if (!wallet || wallet.balanceMinor < amountMinor) {
        throw new BadRequestException('Insufficient balance in client wallet');
      }

      // 2. Decrement Client Wallet
      await tx.clientWallet.update({
        where: { clientId },
        data: {
          balanceMinor: { decrement: amountMinor }
        }
      });

      // 3. Create or update Client Job Allocation
      const allocation = await tx.clientJobAllocation.create({
        data: {
          organizationId: orgId,
          clientJobId,
          adAccountId,
          allocatedMinor: amountMinor,
          status: 'ACTIVE'
        }
      });

      // 4. Create Fund Lot
      const lotCode = `LOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const fundLot = await tx.fundLot.create({
        data: {
          organizationId: orgId,
          lotCode,
          ownerType: FundOwnerType.CLIENT,
          ownerId: clientId,
          initialAmountMinor: amountMinor,
          currentAmountMinor: amountMinor,
          status: MoneyStatus.ALLOCATED,
          locationAdAccountId: adAccountId,
          currencyCode: 'INR'
        }
      });

      // 5. Post to Immutable Ledger
      await this.ledgerService.postTransaction({
        organizationId: orgId,
        transactionType: TransactionType.CLIENT_CAMPAIGN_ALLOCATION,
        description: `Allocated ₹${Number(amountMinor) / 100} from Client Wallet to Ad Account`,
        referenceEntity: 'CLIENT_JOB',
        referenceId: clientJobId,
        entries: [
          { accountCode: '2000-CLIENT-WALLETS', entryType: EntryType.DEBIT, amountMinor },
          { accountCode: '1100-AD-ACCOUNT-PREPAY', entryType: EntryType.CREDIT, amountMinor }
        ]
      }, tx);

      return { allocation, fundLot };
    });
  }

  /**
   * Resolve leftover funds when a campaign/job completes.
   */
  async resolveLeftoverFund(
    organizationId: string | undefined,
    leftoverId: string,
    action: LeftoverResolutionAction,
    targetJobId?: string
  ) {
    const orgId = await this.prisma.resolveOrgId(organizationId);

    const leftover = await this.prisma.clientLeftoverBalance.findUnique({
      where: { id: leftoverId },
      include: { client: true, clientJob: true }
    });

    if (!leftover) throw new NotFoundException('Leftover record not found');
    if (leftover.status === 'RESOLVED') throw new BadRequestException('Leftover is already resolved');

    return this.prisma.$transaction(async (tx) => {
      if (action === LeftoverResolutionAction.RETURN_TO_WALLET) {
        // Return to Client Wallet
        await tx.clientWallet.update({
          where: { clientId: leftover.clientId },
          data: { balanceMinor: { increment: leftover.amountMinor } }
        });

        // Ledger: Reverse Prepayment into Wallet liability
        await this.ledgerService.postTransaction({
          organizationId: orgId,
          transactionType: TransactionType.CLIENT_LEFTOVER_SWEEP,
          description: `Swept unspent ₹${Number(leftover.amountMinor) / 100} back to Client Wallet`,
          referenceEntity: 'CLIENT_JOB',
          referenceId: leftover.clientJobId,
          entries: [
            { accountCode: '1100-AD-ACCOUNT-PREPAY', entryType: EntryType.DEBIT, amountMinor: leftover.amountMinor },
            { accountCode: '2000-CLIENT-WALLETS', entryType: EntryType.CREDIT, amountMinor: leftover.amountMinor }
          ]
        });
      }

      await tx.clientLeftoverBalance.update({
        where: { id: leftoverId },
        data: {
          status: 'RESOLVED',
          resolutionAction: action,
          resolvedAt: new Date()
        }
      });

      return { success: true, action };
    });
  }

  /**
   * Lock all active fund lots associated with an Ad Account when restricted.
   */
  async handleAdAccountRestriction(organizationId: string | undefined, adAccountId: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark Ad Account as RESTRICTED
      await tx.adAccount.update({
        where: { id: adAccountId },
        data: {
          normalizedStatus: 'RESTRICTED',
          canRunAds: false
        }
      });

      // 2. Transition active allocated Fund Lots to LOCKED status
      const updatedLots = await tx.fundLot.updateMany({
        where: {
          locationAdAccountId: adAccountId,
          status: MoneyStatus.ALLOCATED
        },
        data: {
          status: MoneyStatus.LOCKED
        }
      });

      // 3. Create Alert
      await tx.alert.create({
        data: {
          organizationId: orgId,
          alertType: 'ACCOUNT_RESTRICTED',
          title: 'Ad Account Restricted & Funds Locked',
          description: `Ad Account ${adAccountId} restricted by Meta. Active fund lots locked with owner attribution preserved.`,
          severity: 'CRITICAL',
          status: 'OPEN',
          entityType: 'AD_ACCOUNT',
          entityId: adAccountId
        }
      });

      return { lockedLotsCount: updatedLots.count };
    });
  }

  /**
   * Adjust an existing allocation:
   * - TOP_UP: Add more funds from client wallet to the allocation and ad account
   * - REFUND: Sweep unconsumed allocation funds back to the client wallet
   */
  async adjustAllocation(
    organizationId: string | undefined,
    allocationId: string,
    action: 'TOP_UP' | 'REFUND',
    amountRupees: number
  ) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const amountMinor = BigInt(Math.round(amountRupees * 100));
    if (amountMinor <= 0n) throw new BadRequestException('Amount must be greater than 0');

    return this.prisma.$transaction(async (tx) => {
      const allocation = await tx.clientJobAllocation.findUnique({
        where: { id: allocationId },
        include: { clientJob: true, adAccount: true }
      });
      if (!allocation) throw new NotFoundException('Allocation not found');
      if (allocation.organizationId !== orgId) throw new BadRequestException('Organization mismatch');

      const clientId = allocation.clientJob.clientId;
      const wallet = await tx.clientWallet.findUnique({ where: { clientId } });
      if (!wallet) throw new NotFoundException('Client wallet not found');

      if (action === 'TOP_UP') {
        if (wallet.balanceMinor < amountMinor) {
          throw new BadRequestException('Insufficient client wallet balance for top up');
        }
        // 1. Deduct from client wallet
        await tx.clientWallet.update({
          where: { clientId },
          data: { balanceMinor: { decrement: amountMinor } }
        });
        // 2. Increment allocation & job budget
        await tx.clientJobAllocation.update({
          where: { id: allocationId },
          data: { allocatedMinor: { increment: amountMinor } }
        });
        await tx.clientJob.update({
          where: { id: allocation.clientJobId },
          data: { plannedBudgetMinor: { increment: amountMinor } }
        });
        // 3. Create fund lot
        await tx.fundLot.create({
          data: {
            organizationId: orgId,
            lotCode: `LOT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ownerType: FundOwnerType.CLIENT,
            ownerId: clientId,
            initialAmountMinor: amountMinor,
            currentAmountMinor: amountMinor,
            status: MoneyStatus.ALLOCATED,
            locationAdAccountId: allocation.adAccountId,
            currencyCode: 'INR'
          }
        });
        // 4. Ledger entry: Dr 2000-CLIENT-WALLETS, Cr 1100-AD-ACCOUNT-PREPAY
        await this.ledgerService.postTransaction({
          organizationId: orgId,
          transactionType: TransactionType.CLIENT_CAMPAIGN_ALLOCATION,
          description: `Top-up allocation on ${allocation.adAccount.name} for job ${allocation.clientJob.jobCode}`,
          referenceEntity: 'CLIENT_JOB',
          referenceId: allocation.clientJobId,
          entries: [
            { accountCode: '2000-CLIENT-WALLETS', entryType: EntryType.DEBIT, amountMinor: amountMinor },
            { accountCode: '1100-AD-ACCOUNT-PREPAY', entryType: EntryType.CREDIT, amountMinor: amountMinor }
          ]
        }, tx);
      } else if (action === 'REFUND') {
        const unconsumedMinor = allocation.allocatedMinor - allocation.consumedMinor;
        if (amountMinor > unconsumedMinor) {
          throw new BadRequestException(`Cannot refund more than unspent allocation amount (₹${Number(unconsumedMinor) / 100})`);
        }
        // 1. Increment client wallet
        await tx.clientWallet.update({
          where: { clientId },
          data: { balanceMinor: { increment: amountMinor } }
        });
        // 2. Decrement allocation & job budget
        await tx.clientJobAllocation.update({
          where: { id: allocationId },
          data: { allocatedMinor: { decrement: amountMinor } }
        });
        await tx.clientJob.update({
          where: { id: allocation.clientJobId },
          data: { plannedBudgetMinor: { decrement: amountMinor } }
        });
        // 3. Ledger entry: Dr 1100-AD-ACCOUNT-PREPAY, Cr 2000-CLIENT-WALLETS
        await this.ledgerService.postTransaction({
          organizationId: orgId,
          transactionType: TransactionType.CLIENT_LEFTOVER_SWEEP,
          description: `Refunded unspent allocation on ${allocation.adAccount.name} back to Client Wallet`,
          referenceEntity: 'CLIENT_JOB',
          referenceId: allocation.clientJobId,
          entries: [
            { accountCode: '1100-AD-ACCOUNT-PREPAY', entryType: EntryType.DEBIT, amountMinor: amountMinor },
            { accountCode: '2000-CLIENT-WALLETS', entryType: EntryType.CREDIT, amountMinor: amountMinor }
          ]
        }, tx);
      }

      return { success: true, action, amountRupees };
    }, { timeout: 15000 });
  }
}
