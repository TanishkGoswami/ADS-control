import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { LedgerService } from '../ledger/ledger.service';
import { TransactionType, EntryType, toPaise, CreateClientInput, UpdateClientInput, RecordClientPaymentInput } from '@ads-control/shared';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly ledgerService: LedgerService
  ) {}

  async getClients(organizationId?: string, userId?: string, role?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `clients:list:${orgId}:${userId || 'ALL'}:${role || 'ALL'}`;

    return this.cache.wrap(cacheKey, async () => {
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
        const scopedJobs = accessibleAccountIds
          ? client.jobs
              .map((job) => ({
                ...job,
                allocations: job.allocations.filter((a) => accessibleAccountIds!.has(a.adAccountId))
              }))
              .filter((job) => job.allocations.length > 0 || client.jobs.length === 0)
          : client.jobs;

        const clientLots = lots.filter((lot) => lot.ownerId === client.id);
        const allocatedMinor = clientLots
          .filter((lot) => lot.status === 'ALLOCATED')
          .reduce((sum, lot) => sum + lot.currentAmountMinor, 0n);
        const lockedMinor = clientLots
          .filter((lot) => lot.status === 'LOCKED')
          .reduce((sum, lot) => sum + lot.currentAmountMinor, 0n);

        const totalAllocations = scopedJobs.reduce((sum, job) => sum + job.allocations.length, 0);

        return {
          id: client.id,
          clientReference: client.clientReference,
          name: client.name,
          companyName: client.companyName,
          email: client.email,
          phone: client.phone,
          status: client.status,
          walletBalanceMinor: client.wallet?.balanceMinor?.toString() || '0',
          allocatedBalanceMinor: allocatedMinor.toString(),
          lockedBalanceMinor: lockedMinor.toString(),
          allocationsCount: totalAllocations,
          jobsCount: scopedJobs.length,
          paymentsCount: client.payments.length,
          jobs: scopedJobs,
          payments: client.payments,
          wallet: client.wallet,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        };
      });

      if (role === 'ADS_MANAGER' && accessibleAccountIds) {
        return mappedClients.filter((client) => {
          if (client.allocationsCount > 0) return true;
          return true;
        });
      }

      return mappedClients;
    }, 60);
  }

  async createClient(organizationId: string | undefined, input: CreateClientInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const existing = await this.prisma.client.findFirst({ where: { organizationId: orgId, clientReference: input.clientReference } });
    if (existing) throw new BadRequestException('Client reference already exists. Use a different code.');
    const result = await this.prisma.client.create({
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

    await this.cache.delPattern('clients:*');
    await this.cache.delPattern('reports:*');
    return result;
  }

  async updateClient(organizationId: string | undefined, clientId: string, input: UpdateClientInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organizationId: orgId }
    });
    if (!client) throw new NotFoundException('Client not found');

    if (input.clientReference && input.clientReference !== client.clientReference) {
      const existing = await this.prisma.client.findFirst({
        where: { organizationId: orgId, clientReference: input.clientReference, id: { not: clientId } }
      });
      if (existing) throw new BadRequestException('Client reference already exists. Use a different code.');
    }

    const result = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.companyName !== undefined ? { companyName: input.companyName || null } : {}),
        ...(input.email !== undefined ? { email: input.email || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.clientReference !== undefined ? { clientReference: input.clientReference } : {}),
        ...(input.status !== undefined ? { status: input.status } : {})
      },
      include: {
        wallet: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        jobs: {
          include: {
            allocations: {
              include: {
                adAccount: true
              }
            }
          }
        }
      }
    });

    await this.cache.delPattern('clients:*');
    await this.cache.delPattern('reports:*');
    return result;
  }

  async deleteClient(organizationId: string | undefined, clientId: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organizationId: orgId }
    });
    if (!client) throw new NotFoundException('Client not found');

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Clean up associated fund lots & reservations if any exist for this client
      const lots = await tx.fundLot.findMany({
        where: { organizationId: orgId, ownerType: 'CLIENT', ownerId: clientId },
        select: { id: true }
      });

      if (lots.length > 0) {
        const lotIds = lots.map((l) => l.id);
        await tx.topupReservation.deleteMany({ where: { fundLotId: { in: lotIds } } });
        await tx.metaTopupEvent.deleteMany({
          where: { session: { fundLotId: { in: lotIds } } }
        });
        await tx.metaTopupSession.deleteMany({ where: { fundLotId: { in: lotIds } } });
        await tx.fundingRequest.deleteMany({ where: { fundLotId: { in: lotIds } } });
        await tx.fundLot.deleteMany({ where: { id: { in: lotIds } } });
      }

      // 2. Delete Client (Prisma cascades wallet, payments, jobs, allocations, leftoverBalances)
      await tx.client.delete({
        where: { id: clientId }
      });

      return { success: true, id: clientId };
    }, { timeout: 15000 });

    await this.cache.delPattern('clients:*');
    await this.cache.delPattern('reports:*');
    return result;
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

    const result = await this.prisma.$transaction(async (tx) => {
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

    await this.cache.delPattern('clients:*');
    await this.cache.delPattern('reports:*');
    return result;
  }
}
