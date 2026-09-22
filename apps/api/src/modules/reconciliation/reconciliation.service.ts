import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ReconciliationStatus, MoneyStatus } from '@ads-control/shared';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run 3-Way Reconciliation across all active Ad Accounts
   */
  async runReconciliation(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);

    const accounts = await this.prisma.adAccount.findMany({
      where: { organizationId: orgId },
      include: {
        fundLots: true
      }
    });

    const snapshots: any[] = [];

    for (const acc of accounts) {
      const metaReportedBalance = acc.currentTrackedBalanceMinor;
      
      // Calculate sum of active/locked lots
      const allocatedLotsSum = acc.fundLots
        .filter((l) => l.status === MoneyStatus.ALLOCATED || l.status === MoneyStatus.LOCKED)
        .reduce((sum, l) => sum + l.currentAmountMinor, 0n);

      const variance = metaReportedBalance - allocatedLotsSum;
      const reasons: string[] = [];

      let status = ReconciliationStatus.MATCHED;
      if (variance !== 0n) {
        status = ReconciliationStatus.DISCREPANCY;
        if (variance > 0n) {
          reasons.push(`Unallocated float balance of ₹${Number(variance) / 100} detected in account.`);
        } else {
          reasons.push(`Fund allocations exceed Meta reported balance by ₹${Number(-variance) / 100}.`);
        }
      }

      // Save Snapshot
      const snapshot = await this.prisma.reconciliationSnapshot.create({
        data: {
          organizationId: orgId,
          adAccountId: acc.id,
          metaReportedBalanceMinor: metaReportedBalance,
          ledgerBalanceMinor: metaReportedBalance,
          allocatedLotsSumMinor: allocatedLotsSum,
          varianceMinor: variance,
          status: status,
          discrepancyReasons: reasons
        }
      });

      snapshots.push(snapshot);
    }

    return snapshots;
  }

  async getLatestSnapshots(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const snapshots = await this.prisma.reconciliationSnapshot.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { adAccount: true }
    });

    const map = new Map<string, any>();
    for (const snap of snapshots) {
      if (!map.has(snap.adAccountId)) {
        map.set(snap.adAccountId, snap);
      }
    }
    return Array.from(map.values());
  }

  async reconcileAdAccount(organizationId: string, adAccountId: string) {
    const account = await this.prisma.adAccount.findFirst({
      where: { id: adAccountId, organizationId },
      include: { fundLots: true }
    });
    if (!account) throw new Error('Ad Account not found for reconciliation');
    const allocatedLotsSum = account.fundLots
      .filter((lot) => lot.status === MoneyStatus.ALLOCATED || lot.status === MoneyStatus.LOCKED)
      .reduce((sum, lot) => sum + lot.currentAmountMinor, 0n);
    const variance = account.currentTrackedBalanceMinor - allocatedLotsSum;
    return this.prisma.reconciliationSnapshot.create({
      data: {
        organizationId,
        adAccountId,
        metaReportedBalanceMinor: account.currentTrackedBalanceMinor,
        ledgerBalanceMinor: allocatedLotsSum,
        allocatedLotsSumMinor: allocatedLotsSum,
        varianceMinor: variance,
        status: variance === 0n ? ReconciliationStatus.MATCHED : ReconciliationStatus.DISCREPANCY,
        discrepancyReasons: variance === 0n ? [] : ['Targeted Meta balance differs from allocated fund lots.']
      }
    });
  }
}
