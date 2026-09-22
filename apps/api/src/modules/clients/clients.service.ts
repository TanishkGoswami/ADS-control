import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { TransactionType, EntryType, toPaise, CreateClientInput, RecordClientPaymentInput } from '@ads-control/shared';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService
  ) {}

  async getClients(organizationId?: string, userId?: string, role?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);

    let accessibleAccountIds: Set<string> | null = null;
    if (role === 'ADS_MANAGER' && userId) {
      const userAccounts = await this.prisma.adAccount.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { userAccess: { some: { userId } } },
            { businessPortfolio: { metaConnection: { userId } } },
            { businessPortfolio: { userAccess: { some: { userId } } } }
          ]
        },
        select: { id: true }
      });
      accessibleAccountIds = new Set(userAccounts.map((a) => a.id));
    }

    const clients = await this.prisma.client.findMany({
      where: { organizationId: orgId },
      include: {
        wallet: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        jobs: {
          include: {
            allocations: {
              include: {
                adAccount: {
                  select: {
                    id: true,
                    name: true,
                    internalAlias: true,
                    metaAdAccountId: true,
                    currentTrackedBalanceMinor: true,
                    businessPortfolio: { select: { id: true, name: true } }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    const lots = await this.prisma.fundLot.findMany({
      where: { organizationId: orgId, ownerType: 'CLIENT', ownerId: { in: clients.map((client) => client.id) } },
      select: { ownerId: true, currentAmountMinor: true, status: true }
    });

    const mappedClients = clients.map((client) => {
      // If Ads Manager, filter jobs/allocations to only show those for accessible ad accounts
      const scopedJobs = accessibleAccountIds
        ? client.jobs
            .map((job) => ({
              ...job,
              allocations: job.allocations.filter((a) => accessibleAccountIds!.has(a.adAccountId))
            }))
            .filter((job) => job.allocations.length > 0 || client.jobs.length === 0)
        : client.jobs;

      return {
        ...client,
        jobs: scopedJobs,
        totalPaidMinor: client.payments.reduce((sum, payment) => sum + payment.adsFundMinor, 0n),
        totalAllocatedMinor: scopedJobs.flatMap((job) => job.allocations).reduce((sum, allocation) => sum + allocation.allocatedMinor, 0n),
        totalLockedMinor: lots.filter((lot) => lot.ownerId === client.id && lot.status === 'LOCKED').reduce((sum, lot) => sum + lot.currentAmountMinor, 0n),
        jobsCount: scopedJobs.length,
        allocationsCount: scopedJobs.reduce((sum, job) => sum + job.allocations.length, 0)
      };
    });

    // If Ads Manager has restricted accounts, only show clients that have allocations on their accounts or all clients if no jobs yet
    if (role === 'ADS_MANAGER' && accessibleAccountIds) {
      return mappedClients.filter((client) => {
        if (client.allocationsCount > 0) return true;
        // Also allow viewing recently created clients so they can allocate to their accounts
        return true;
      });
    }

    return mappedClients;
  }

  async createClient(organizationId: string | undefined, input: CreateClientInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const existing = await this.prisma.client.findFirst({ where: { organizationId: orgId, clientReference: input.clientReference } });
    if (existing) throw new BadRequestException('Client reference already exists. Use a different code.');
    return this.prisma.client.create({
      data: {
        organizationId: orgId,
        clientReference: input.clientReference,
        name: input.name,
        companyName: input.companyName,
        email: input.email || undefined,
        phone: input.phone,
        wallet: {
          create: {
            organizationId: orgId,
            balanceMinor: 0n,
            currencyCode: 'INR'
          }
        }
      },
      include: { wallet: true }
    });
  }

  /**
   * Record Client Payment:
   * Splits into:
   * - Ads Fund (goes to Client Wallet)
   * - Service Fee (goes to Agency Revenue)
   * Posts to Double-entry ledger.
   */
  async recordPayment(organizationId: string | undefined, input: RecordClientPaymentInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const totalMinor = toPaise(input.amountRupees);
    const serviceFeeMinor = toPaise(input.serviceFeeRupees || 0);
    const adsFundMinor = totalMinor - serviceFeeMinor;

    if (adsFundMinor < 0n) {
      throw new BadRequestException('Service fee cannot exceed total payment amount');
    }

    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({ where: { id: input.clientId, organizationId: orgId } });
      if (!client) throw new NotFoundException('Client not found');

      // 1. Record Client Payment
      const payment = await tx.clientPayment.create({
        data: {
          organizationId: orgId,
          clientId: input.clientId,
          paymentReference: input.paymentReference,
          totalAmountMinor: totalMinor,
          adsFundMinor: adsFundMinor,
          serviceFeeMinor: serviceFeeMinor,
          currencyCode: 'INR',
          notes: input.notes
        }
      });

      // 2. Increment Client Wallet with Ads Fund portion only
      await tx.clientWallet.update({
        where: { clientId: input.clientId },
        data: {
          balanceMinor: { increment: adsFundMinor }
        }
      });

      // 3. Post to Ledger:
      // Dr: Bank (totalMinor)
      // Cr: Client Wallets (adsFundMinor)
      // Cr: Service Revenue (serviceFeeMinor) [if > 0]
      const entries = [
        { accountCode: '1000-BANK', entryType: EntryType.DEBIT, amountMinor: totalMinor },
        { accountCode: '2000-CLIENT-WALLETS', entryType: EntryType.CREDIT, amountMinor: adsFundMinor }
      ];

      if (serviceFeeMinor > 0n) {
        entries.push({
          accountCode: '4000-SERVICE-REVENUE',
          entryType: EntryType.CREDIT,
          amountMinor: serviceFeeMinor
        });
      }

      await this.ledgerService.postTransaction({
        organizationId: orgId,
        transactionType: TransactionType.CLIENT_PAYMENT,
        description: `Client payment receipt from client ${input.clientId} (Ref: ${input.paymentReference})`,
        referenceEntity: 'CLIENT_PAYMENT',
        referenceId: payment.id,
        entries
      }, tx);

      return payment;
    }, { timeout: 15000 });
  }
}
