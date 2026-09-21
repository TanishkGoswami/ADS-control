import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

export interface EvaluateAlertsResult {
  totalScanned: number;
  newAlertsCreated: number;
  alertsUpdated: number;
  autoResolved: number;
  activeOpenAlerts: number;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService
  ) {}

  /**
   * List all alerts with optional severity and status filters
   */
  async getAlerts(organizationId?: string, status?: string, severity?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    return this.prisma.alert.findMany({
      where: {
        organizationId: orgId,
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(severity && severity !== 'ALL' ? { severity } : {})
      },
      orderBy: [
        { severity: 'asc' }, // CRITICAL first
        { updatedAt: 'desc' }
      ]
    });
  }

  /**
   * Automated Alert Evaluation Engine
   * Scans Restricted accounts with funds, Low balance accounts, Disconnected connections, and Reconciliation variances
   */
  async evaluateAlerts(organizationId?: string): Promise<EvaluateAlertsResult> {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    this.logger.log(`Running Alert Evaluation Engine for organization: ${orgId}`);

    let newAlertsCreated = 0;
    let alertsUpdated = 0;
    let autoResolved = 0;

    // 1. Fetch all ad accounts with portfolios and fund lots
    const adAccounts = await this.prisma.adAccount.findMany({
      where: { organizationId: orgId },
      include: {
        businessPortfolio: true,
        fundLots: { where: { status: { in: ['AVAILABLE', 'ALLOCATED'] } } }
      }
    });

    // 2. Fetch all Meta connections
    const metaConnections = await this.prisma.metaConnection.findMany({
      where: { organizationId: orgId }
    });

    // 3. Fetch all active reconciliation snapshots
    const reconSnapshots = await this.prisma.reconciliationSnapshot.findMany({
      where: { organizationId: orgId, status: { not: 'MATCHED' } }
    });

    // Track active entity alert keys to auto-resolve cleared alerts
    const activeIncidentKeys = new Set<string>();

    // -------------------------------------------------------------
    // RULE 1: Restricted Ad Accounts with Active or Stuck Funds (CRITICAL)
    // -------------------------------------------------------------
    const restrictedAccountsWithFunds = adAccounts.filter(
      (acc) =>
        acc.normalizedStatus === 'RESTRICTED' &&
        (BigInt(acc.currentTrackedBalanceMinor || 0) > 0n || acc.fundLots.length > 0)
    );

    for (const acc of restrictedAccountsWithFunds) {
      const incidentKey = `RESTRICTED_ACCOUNT_WITH_FUNDS:${acc.id}`;
      activeIncidentKeys.add(incidentKey);

      const balanceRupees = (Number(acc.currentTrackedBalanceMinor || 0) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2
      });

      const existing = await this.prisma.alert.findFirst({
        where: {
          organizationId: orgId,
          alertType: 'RESTRICTED_ACCOUNT_WITH_FUNDS',
          entityId: acc.id,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        }
      });

      const title = `Restricted Account with Stuck Balance: ${acc.name}`;
      const description = `Ad Account ${acc.metaAdAccountId} (${acc.businessPortfolio?.name || 'Portfolio'}) is Restricted by Meta with ₹${balanceRupees} available/stuck balance and ${acc.fundLots.length} active lots. Immediate fund reclamation recommended.`;

      if (existing) {
        await this.prisma.alert.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            severity: 'CRITICAL',
            metadataJson: {
              adAccountId: acc.id,
              metaAdAccountId: acc.metaAdAccountId,
              portfolioName: acc.businessPortfolio?.name,
              balanceINR: balanceRupees,
              fundLotsCount: acc.fundLots.length
            },
            updatedAt: new Date()
          }
        });
        alertsUpdated++;
      } else {
        await this.prisma.alert.create({
          data: {
            organizationId: orgId,
            alertType: 'RESTRICTED_ACCOUNT_WITH_FUNDS',
            title,
            description,
            severity: 'CRITICAL',
            status: 'OPEN',
            entityType: 'AD_ACCOUNT',
            entityId: acc.id,
            metadataJson: {
              adAccountId: acc.id,
              metaAdAccountId: acc.metaAdAccountId,
              portfolioName: acc.businessPortfolio?.name,
              balanceINR: balanceRupees,
              fundLotsCount: acc.fundLots.length
            }
          }
        });
        newAlertsCreated++;
      }
    }

    // -------------------------------------------------------------
    // RULE 2: Low Available Balance on Active Accounts (WARNING)
    // Threshold: < ₹500.00 (< 50,000 paise)
    // -------------------------------------------------------------
    const LOW_BALANCE_THRESHOLD_PAISE = 50000n; // ₹500
    const lowBalanceActiveAccounts = adAccounts.filter(
      (acc) =>
        acc.normalizedStatus === 'ACTIVE' &&
        acc.canRunAds &&
        BigInt(acc.currentTrackedBalanceMinor || 0) < LOW_BALANCE_THRESHOLD_PAISE
    );

    for (const acc of lowBalanceActiveAccounts) {
      const incidentKey = `LOW_BALANCE:${acc.id}`;
      activeIncidentKeys.add(incidentKey);

      const balanceRupees = (Number(acc.currentTrackedBalanceMinor || 0) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2
      });

      const existing = await this.prisma.alert.findFirst({
        where: {
          organizationId: orgId,
          alertType: 'LOW_BALANCE',
          entityId: acc.id,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        }
      });

      const title = `Low Balance Warning: ${acc.name} (₹${balanceRupees})`;
      const description = `Active ad account ${acc.metaAdAccountId} has dropped below the ₹500 threshold (Current: ₹${balanceRupees}). Allocate funds to prevent campaign delivery pauses.`;

      if (existing) {
        await this.prisma.alert.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            severity: 'WARNING',
            metadataJson: {
              adAccountId: acc.id,
              metaAdAccountId: acc.metaAdAccountId,
              portfolioName: acc.businessPortfolio?.name,
              balanceINR: balanceRupees
            },
            updatedAt: new Date()
          }
        });
        alertsUpdated++;
      } else {
        await this.prisma.alert.create({
          data: {
            organizationId: orgId,
            alertType: 'LOW_BALANCE',
            title,
            description,
            severity: 'WARNING',
            status: 'OPEN',
            entityType: 'AD_ACCOUNT',
            entityId: acc.id,
            metadataJson: {
              adAccountId: acc.id,
              metaAdAccountId: acc.metaAdAccountId,
              portfolioName: acc.businessPortfolio?.name,
              balanceINR: balanceRupees
            }
          }
        });
        newAlertsCreated++;
      }
    }

    // -------------------------------------------------------------
    // RULE 3: Disconnected / Expired Facebook Connection (WARNING)
    // -------------------------------------------------------------
    const disconnectedConnections = metaConnections.filter(
      (c) => c.connectionStatus === 'DISCONNECTED'
    );

    for (const conn of disconnectedConnections) {
      const incidentKey = `META_CONNECTION_DISCONNECTED:${conn.id}`;
      activeIncidentKeys.add(incidentKey);

      const existing = await this.prisma.alert.findFirst({
        where: {
          organizationId: orgId,
          alertType: 'META_CONNECTION_DISCONNECTED',
          entityId: conn.id,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        }
      });

      const title = `Facebook Profile Disconnected: ${conn.internalName}`;
      const description = `Meta access token is disconnected or expired for ${conn.internalName}. Re-connect Facebook to resume automated asset synchronization and balance tracking.`;

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            organizationId: orgId,
            alertType: 'META_CONNECTION_DISCONNECTED',
            title,
            description,
            severity: 'WARNING',
            status: 'OPEN',
            entityType: 'META_CONNECTION',
            entityId: conn.id,
            metadataJson: { connectionId: conn.id, internalName: conn.internalName }
          }
        });
        newAlertsCreated++;
      }
    }

    // -------------------------------------------------------------
    // RULE 4: Rejected / Disapproved Ads & Campaigns (CRITICAL)
    // -------------------------------------------------------------
    const rejectedCampaigns = await this.prisma.metaCampaign.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { effectiveStatus: { in: ['DISAPPROVED', 'WITH_ISSUES', 'REJECTED'] } },
          { rawStatus: { in: ['DISAPPROVED', 'WITH_ISSUES'] } }
        ]
      },
      include: {
        adAccount: {
          include: { businessPortfolio: true }
        }
      }
    });

    for (const camp of rejectedCampaigns) {
      const incidentKey = `AD_DISAPPROVED:${camp.id}`;
      activeIncidentKeys.add(incidentKey);

      const existing = await this.prisma.alert.findFirst({
        where: {
          organizationId: orgId,
          alertType: 'AD_DISAPPROVED',
          entityId: camp.id,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        }
      });

      const title = `Ad/Campaign Rejected: ${camp.name}`;
      const description = `Meta rejected campaign "${camp.name}" (${camp.metaCampaignId}) on account ${camp.adAccount?.name || 'Ad Account'} (${camp.adAccount?.metaAdAccountId || ''}) due to policy/compliance issues. Review creative and re-submit.`;

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            organizationId: orgId,
            alertType: 'AD_DISAPPROVED',
            title,
            description,
            severity: 'CRITICAL',
            status: 'OPEN',
            entityType: 'CAMPAIGN',
            entityId: camp.id,
            metadataJson: {
              campaignId: camp.id,
              metaCampaignId: camp.metaCampaignId,
              campaignName: camp.name,
              adAccountId: camp.adAccountId,
              adAccountName: camp.adAccount?.name,
              metaAdAccountId: camp.adAccount?.metaAdAccountId,
              portfolioName: camp.adAccount?.businessPortfolio?.name
            }
          }
        });
        newAlertsCreated++;
      }
    }

    // -------------------------------------------------------------
    // RULE 5: Disabled / Unpublished Facebook Pages (CRITICAL)
    // -------------------------------------------------------------
    for (const conn of metaConnections) {
      if (conn.connectionStatus === 'CONNECTED' && conn.tokenSecretReference) {
        try {
          const pagesRes = await fetch(
            `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,is_published,verification_status&access_token=${conn.tokenSecretReference}`
          );
          const pagesJson = await pagesRes.json();
          if (pagesJson?.data && Array.isArray(pagesJson.data)) {
            for (const page of pagesJson.data) {
              if (page.is_published === false) {
                const incidentKey = `PAGE_DISABLED:${page.id}`;
                activeIncidentKeys.add(incidentKey);

                const existing = await this.prisma.alert.findFirst({
                  where: {
                    organizationId: orgId,
                    alertType: 'PAGE_DISABLED',
                    entityId: page.id,
                    status: { in: ['OPEN', 'ACKNOWLEDGED'] }
                  }
                });

                const title = `Facebook Page Disabled/Unpublished: ${page.name}`;
                const description = `Facebook Page "${page.name}" (Page ID: ${page.id}) under connection "${conn.internalName}" has been disabled or unpublished by Meta. All ads pointing to this page will fail delivery.`;

                if (!existing) {
                  await this.prisma.alert.create({
                    data: {
                      organizationId: orgId,
                      alertType: 'PAGE_DISABLED',
                      title,
                      description,
                      severity: 'CRITICAL',
                      status: 'OPEN',
                      entityType: 'PAGE',
                      entityId: page.id,
                      metadataJson: {
                        pageId: page.id,
                        pageName: page.name,
                        connectionId: conn.id,
                        connectionName: conn.internalName
                      }
                    }
                  });
                  newAlertsCreated++;
                }
              }
            }
          }
        } catch (err: any) {
          this.logger.warn(`Could not verify FB pages for ${conn.internalName}: ${err?.message || err}`);
        }
      }
    }

    // -------------------------------------------------------------
    // RULE 6: Auto-Resolve Cleared Alerts
    // If an alert was condition-driven (e.g. LOW_BALANCE or RESTRICTED_ACCOUNT)
    // and the condition is now resolved, mark it RESOLVED automatically
    // -------------------------------------------------------------
    const openAlerts = await this.prisma.alert.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] }
      }
    });

    for (const alert of openAlerts) {
      const alertKey = `${alert.alertType}:${alert.entityId}`;
      if (
        !activeIncidentKeys.has(alertKey) &&
        ['RESTRICTED_ACCOUNT_WITH_FUNDS', 'LOW_BALANCE', 'META_CONNECTION_DISCONNECTED', 'AD_DISAPPROVED', 'PAGE_DISABLED'].includes(
          alert.alertType
        )
      ) {
        await this.prisma.alert.update({
          where: { id: alert.id },
          data: { status: 'RESOLVED', updatedAt: new Date() }
        });
        autoResolved++;
      }
    }

    // Count current active open alerts
    const activeOpenAlerts = await this.prisma.alert.count({
      where: { organizationId: orgId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } }
    });

    // Broadcast live event to all connected browsers
    if (newAlertsCreated > 0 || autoResolved > 0 || alertsUpdated > 0) {
      this.realtime.broadcast('ALERT_CREATED', {
        organizationId: orgId,
        activeOpenAlerts,
        timestamp: Date.now()
      });
      this.realtime.broadcast('DASHBOARD_UPDATED', { organizationId: orgId });
    }

    return {
      totalScanned: adAccounts.length + metaConnections.length + reconSnapshots.length,
      newAlertsCreated,
      alertsUpdated,
      autoResolved,
      activeOpenAlerts
    };
  }

  /**
   * Update Alert Status (OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED)
   */
  async updateAlertStatus(id: string, status: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException(`Alert with id ${id} not found`);

    const updated = await this.prisma.alert.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });

    this.realtime.broadcast('ALERT_UPDATED', {
      organizationId: alert.organizationId,
      alertId: id,
      status
    });
    this.realtime.broadcast('DASHBOARD_UPDATED', { organizationId: alert.organizationId });

    return updated;
  }

  /**
   * Bulk clear or delete resolved/dismissed alerts
   */
  async clearResolvedAlerts(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const result = await this.prisma.alert.deleteMany({
      where: {
        organizationId: orgId,
        status: { in: ['RESOLVED', 'DISMISSED'] }
      }
    });

    this.realtime.broadcast('ALERT_UPDATED', { organizationId: orgId });
    return { success: true, count: result.count, message: `Cleared ${result.count} resolved alerts.` };
  }
}
