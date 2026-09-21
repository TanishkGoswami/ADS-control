import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { DashboardMetricsDto, MoneyStatus } from '@ads-control/shared';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async getDashboardMetrics(organizationId?: string, userId?: string): Promise<DashboardMetricsDto> {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `reports:metrics:${orgId}:${userId || 'ALL'}`;

    return this.cache.wrap(cacheKey, async () => {
      let adAccountWhere: any = { organizationId: orgId };
      if (userId && userId !== 'ALL') {
        const user = await this.prisma.userProfile.findUnique({ where: { id: userId } });
        if (user && (user.role === 'ADS_MANAGER' || userId !== 'ALL')) {
          adAccountWhere.userAccess = { some: { userId: userId } };
        }
      }

    const [
      adAccounts,
      clients,
      vendors,
      lockedLots,
      alerts,
      reconciliationDiscrepancies,
      todaySpendFacts
    ] = await Promise.all([
      this.prisma.adAccount.findMany({ where: adAccountWhere, include: { fundLots: true } }),
      this.prisma.client.findMany({ where: { organizationId: orgId }, include: { wallet: true } }),
      this.prisma.vendor.findMany({ where: { organizationId: orgId }, include: { fundingBatches: true, receivables: true } }),
      this.prisma.fundLot.findMany({ where: { organizationId: orgId, status: MoneyStatus.LOCKED } }),
      this.prisma.alert.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      this.prisma.reconciliationSnapshot.count({ where: { organizationId: orgId, status: 'DISCREPANCY' } }),
      this.prisma.spendFact.findMany({
        where: {
          organizationId: orgId,
          ...(userId && userId !== 'ALL' ? { adAccount: { userAccess: { some: { userId } } } } : {}),
          spendDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    const totalAdAccounts = adAccounts.length;
    const activeAdAccounts = adAccounts.filter((a) => a.normalizedStatus === 'ACTIVE').length;
    const restrictedAdAccounts = adAccounts.filter((a) => a.normalizedStatus === 'RESTRICTED').length;

    const totalClientFundsMinor = clients.reduce(
      (sum, c) => sum + (c.wallet?.balanceMinor || 0n),
      0n
    );

    const totalVendorPayablesMinor = vendors.reduce((sum, v) => {
      const openBatchOutstanding = v.fundingBatches
        .filter((b) => b.status === 'OPEN')
        .reduce((bSum, b) => bSum + (b.principalAmountMinor - b.repaidAmountMinor), 0n);
      return sum + openBatchOutstanding;
    }, 0n);

    const totalVendorReceivablesMinor = vendors.reduce((sum, v) => {
      const openReceivables = v.receivables
        .filter((r) => r.status === 'OPEN')
        .reduce((rSum, r) => rSum + r.amountMinor, 0n);
      return sum + openReceivables;
    }, 0n);

    // Sum of beneficial client lots locked + unspent prepaid balance stuck in restricted/disabled Meta ad accounts
    const stuckInRestrictedAccountsMinor = adAccounts
      .filter((a) => a.normalizedStatus === 'RESTRICTED')
      .reduce((sum, a) => sum + (a.currentTrackedBalanceMinor || 0n), 0n);

    const lockedLotsMinor = lockedLots.reduce((sum, l) => sum + l.currentAmountMinor, 0n);
    const totalLockedFundsMinor = lockedLotsMinor + stuckInRestrictedAccountsMinor;

    // Available agency float across all active ad accounts
    const agencyFreePoolMinor = adAccounts
      .filter((a) => a.normalizedStatus === 'ACTIVE')
      .reduce((sum, a) => sum + (a.currentTrackedBalanceMinor || 0n), 0n);

    const todaySpendMinor = todaySpendFacts.reduce(
      (sum, f) => sum + (f.amountMinor || 0n),
      0n
    );

      return {
        totalAdAccounts,
        activeAdAccounts,
        restrictedAdAccounts,
        totalClientFundsMinor: totalClientFundsMinor.toString(),
        totalVendorPayablesMinor: totalVendorPayablesMinor.toString(),
        totalVendorReceivablesMinor: totalVendorReceivablesMinor.toString(),
        totalLockedFundsMinor: totalLockedFundsMinor.toString(),
        agencyFreePoolMinor: agencyFreePoolMinor.toString(),
        todaySpendMinor: todaySpendMinor.toString(),
        unresolvedDiscrepanciesCount: reconciliationDiscrepancies,
        openAlertsCount: alerts
      };
    }, 60);
  }
}
