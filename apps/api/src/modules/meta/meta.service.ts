import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);
  private readonly apiVersion = process.env.META_GRAPH_API_VERSION || 'v22.0';
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly realtime: RealtimeService,
    private readonly alerts: AlertsService
  ) {}

  private getAccessToken(): string {
    return process.env.META_ACCESS_TOKEN || '';
  }

  async getConnections(organizationId?: string, userId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `meta:connections:${orgId}:${userId || 'ALL'}`;

    return this.cache.wrap(cacheKey, async () => {
      let whereClause: any = { organizationId: orgId };
      if (userId) {
        const user = await this.prisma.userProfile.findUnique({ where: { id: userId } });
        if (user && user.role === 'ADS_MANAGER') {
          whereClause.userId = userId;
        }
      }

      return this.prisma.metaConnection.findMany({
        where: whereClause,
        include: {
          businessPortfolios: {
            include: {
              adAccounts: {
                include: { fundLots: true }
              }
            }
          },
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }, 60);
  }

  async disconnectConnection(connectionId: string, organizationId?: string, requestingUserId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);

    const conn = await this.prisma.metaConnection.findUnique({
      where: { id: connectionId },
      include: {
        businessPortfolios: {
          include: {
            adAccounts: true
          }
        }
      }
    });

    if (!conn) {
      await this.cache.delPattern('meta:*');
      await this.cache.delPattern('reports:*');
      return {
        success: true,
        message: 'Connection already removed or disconnected.',
        disconnectedAccountsCount: 0
      };
    }

    const portfolioIds = conn.businessPortfolios.map((bp) => bp.id);
    const adAccountIds = conn.businessPortfolios.flatMap((bp) => bp.adAccounts.map((a) => a.id));

    // 1. Clean up access mappings
    if (portfolioIds.length > 0) {
      await this.prisma.userPortfolioAccess.deleteMany({
        where: { businessPortfolioId: { in: portfolioIds } }
      });
    }
    if (adAccountIds.length > 0) {
      await this.prisma.userAdAccountAccess.deleteMany({
        where: { adAccountId: { in: adAccountIds } }
      });

      // 2. Unlink foreign references before removing ad accounts
      await this.prisma.fundLot.updateMany({
        where: { locationAdAccountId: { in: adAccountIds } },
        data: { locationAdAccountId: null }
      });
      await this.prisma.fundingRequest.updateMany({
        where: { targetAdAccountId: { in: adAccountIds } },
        data: { targetAdAccountId: null }
      });
      await this.prisma.metaTopupSession.deleteMany({
        where: {
          OR: [
            { detectedAdAccountId: { in: adAccountIds } },
            { selectedAdAccountId: { in: adAccountIds } }
          ]
        }
      });
      await this.prisma.reconciliationSnapshot.deleteMany({
        where: { adAccountId: { in: adAccountIds } }
      });
      await this.prisma.alert.deleteMany({
        where: {
          entityType: 'AD_ACCOUNT',
          entityId: { in: adAccountIds }
        }
      });

      // 3. Remove Ad Accounts
      await this.prisma.adAccount.deleteMany({
        where: { id: { in: adAccountIds } }
      });
    }

    // 4. Remove Business Portfolios
    if (portfolioIds.length > 0) {
      await this.prisma.businessPortfolio.deleteMany({
        where: { id: { in: portfolioIds } }
      });
    }

    // 5. Update connection status
    await this.prisma.metaConnection.update({
      where: { id: connectionId },
      data: {
        connectionStatus: 'DISCONNECTED',
        tokenSecretReference: null,
        userId: null
      }
    });

    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');
    this.realtime.broadcast('META_ASSETS_UPDATED', { organizationId: orgId, userId: requestingUserId, timestamp: Date.now() });
    this.realtime.broadcast('DASHBOARD_UPDATED', { organizationId: orgId, timestamp: Date.now() });
    this.realtime.broadcast('USERS_UPDATED', { organizationId: orgId, timestamp: Date.now() });

    return {
      success: true,
      message: `Connection "${conn.internalName}" disconnected and associated data removed successfully.`,
      disconnectedAccountsCount: adAccountIds.length
    };
  }

  async deleteConnection(connectionId: string, organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    await this.disconnectConnection(connectionId, orgId);
    await this.prisma.metaConnection.delete({
      where: { id: connectionId }
    });
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');
    this.realtime.broadcast('META_ASSETS_UPDATED', { organizationId: orgId, timestamp: Date.now() });
    this.realtime.broadcast('DASHBOARD_UPDATED', { organizationId: orgId, timestamp: Date.now() });
    this.realtime.broadcast('USERS_UPDATED', { organizationId: orgId, timestamp: Date.now() });
    return { success: true, message: 'Connection and associated data removed completely.' };
  }

  async getAdAccounts(organizationId?: string, userId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `meta:accounts:${orgId}:${userId || 'ALL'}`;

    return this.cache.wrap(cacheKey, async () => {
      // Only return accounts that belong to an actively CONNECTED Meta connection
      let whereClause: any = {
        organizationId: orgId,
        businessPortfolio: {
          metaConnection: {
            connectionStatus: 'CONNECTED'
          }
        }
      };
      if (userId && userId !== 'ALL') {
        whereClause.OR = [
          { userAccess: { some: { userId } } },
          { businessPortfolio: { metaConnection: { userId } } },
          { businessPortfolio: { userAccess: { some: { userId } } } }
        ];
      }

      return this.prisma.adAccount.findMany({
        where: whereClause,
        include: {
          businessPortfolio: {
            include: {
              metaConnection: {
                select: {
                  id: true,
                  internalName: true,
                  externalContextId: true,
                  user: { select: { id: true, name: true, email: true, role: true } }
                }
              }
            }
          },
          fundLots: {
            select: {
              id: true,
              lotCode: true,
              currentAmountMinor: true,
              initialAmountMinor: true,
              status: true
            }
          },
          userAccess: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }, 60);
  }

  async getAdAccountDetails(id: string) {
    const cacheKey = `meta:account:${id}`;
    return this.cache.wrap(cacheKey, async () => {
      return this.prisma.adAccount.findUnique({
        where: { id },
        include: {
          businessPortfolio: true,
          fundLots: true,
          userAccess: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } }
            }
          },
          statusHistory: { orderBy: { detectedAt: 'desc' }, take: 10 },
          spendFacts: { orderBy: { spendDate: 'desc' }, take: 30 }
        }
      });
    }, 60);
  }

  private extractEffectiveBalanceMinor(acc: any, fallback: bigint = 0n): bigint {
    // 1. Postpay accounts (Credit card / Auto threshold billing, is_prepay_account === false):
    // In Meta Graph API, 'balance' on postpay accounts represents unbilled spend due on threshold,
    // NOT available prepaid funds. Available prepaid funds is ₹0.00.
    if (acc.is_prepay_account === false) {
      return 0n;
    }

    // 2. Prepay accounts: parse display string from funding source details if explicitly present
    const displayString = acc.funding_source_details?.display_string || '';
    if (/available/i.test(displayString) || /prepaid/i.test(displayString) || /balance/i.test(displayString)) {
      const match = displayString.match(/([0-9,]+\.?[0-9]*)/);
      if (match) {
        const cleanNum = parseFloat(match[1].replace(/,/g, '')) || 0;
        return BigInt(Math.round(cleanNum * 100));
      }
    }

    // 3. Prepay accounts direct balance (Meta Graph API returns `balance` in currency offset / paise)
    if (acc.is_prepay_account && /^\d+$/.test(String(acc.balance ?? ''))) {
      return BigInt(acc.balance);
    }

    // 4. Fallback direct balance if present
    if (/^\d+$/.test(String(acc.balance ?? ''))) {
      return BigInt(acc.balance);
    }

    return fallback;
  }

  async refreshAdAccount(organizationId: string, adAccountId: string) {
    const account = await this.prisma.adAccount.findFirst({
      where: { id: adAccountId, organizationId },
      include: { businessPortfolio: { include: { metaConnection: true } } }
    });
    if (!account) throw new BadRequestException('Meta Ad Account not found');
    const token = account.businessPortfolio?.metaConnection.tokenSecretReference || this.getAccessToken();
    if (!token) throw new BadRequestException('Meta connection is unavailable');

    const actId = account.metaAdAccountId.startsWith('act_') ? account.metaAdAccountId : `act_${account.metaAdAccountId}`;
    const url = `${this.baseUrl}/${actId}?fields=id,name,currency,account_status,balance,amount_spent,spend_cap,is_prepay_account,funding_source_details&access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url);
    const payload = await response.json();
    if (!response.ok || payload?.error) {
      this.logger.warn(`Targeted Meta refresh failed for account ${account.id}: ${payload?.error?.message || response.statusText}`);
      throw new BadRequestException('Meta account refresh failed');
    }
    if (payload.currency && payload.currency !== 'INR') throw new BadRequestException('Only INR Ad Accounts are supported');
    const balanceMinor = this.extractEffectiveBalanceMinor(payload, account.currentTrackedBalanceMinor);
    const normalizedStatus = payload.account_status === 1 ? 'ACTIVE' : 'RESTRICTED';
    const updated = await this.prisma.adAccount.update({
      where: { id: account.id },
      data: {
        name: payload.name || account.name,
        currencyCode: payload.currency || account.currencyCode,
        rawMetaStatus: payload.account_status == null ? account.rawMetaStatus : String(payload.account_status),
        normalizedStatus,
        canRunAds: normalizedStatus === 'ACTIVE',
        currentTrackedBalanceMinor: balanceMinor,
        lastStatusSyncAt: new Date()
      }
    });
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');
    return { id: updated.id, metaAdAccountId: updated.metaAdAccountId, balanceMinor: updated.currentTrackedBalanceMinor.toString(), refreshedAt: updated.lastStatusSyncAt };
  }

  /**
   * Live Sync with Meta Graph API v22.0
   * Fetches Real Business Portfolios and Ad Accounts and associates with connecting user
   */
  async syncMetaAssets(organizationId?: string, userId?: string, targetConnectionId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    this.logger.log(`Starting live Meta Graph API asset synchronization (orgId: ${orgId}, user: ${userId || 'ALL'})...`);

    try {
      // 1. Resolve Meta Connections with stored access tokens
      let connections: any[] = [];
      if (targetConnectionId) {
        const c = await this.prisma.metaConnection.findUnique({ where: { id: targetConnectionId } });
        if (c) connections.push(c);
      } else {
        connections = await this.prisma.metaConnection.findMany({
          where: {
            organizationId: orgId,
            connectionStatus: 'CONNECTED',
            tokenSecretReference: { not: null },
            ...(userId ? { userId } : {})
          },
          orderBy: { updatedAt: 'desc' }
        });

        // Fallback: If no connections matched specific userId, fetch all org connections
        if (connections.length === 0) {
          connections = await this.prisma.metaConnection.findMany({
            where: {
              organizationId: orgId,
              connectionStatus: 'CONNECTED',
              tokenSecretReference: { not: null }
            },
            orderBy: { updatedAt: 'desc' }
          });
        }
      }

      if (connections.length === 0) {
        throw new BadRequestException('No active Facebook Connection found. Please connect your Facebook account first using "Connect Facebook".');
      }

      let totalPortfoliosCount = 0;
      let totalAccountsCount = 0;
      let activeCount = 0;
      let restrictedCount = 0;
      let totalBalanceMinor = 0n;

      // Pre-fetch existing portfolios and accounts in 2 fast queries (O(1) in-memory lookup)
      const [existingPortfolios, existingAccounts] = await Promise.all([
        this.prisma.businessPortfolio.findMany({ where: { organizationId: orgId } }),
        this.prisma.adAccount.findMany({ where: { organizationId: orgId } })
      ]);

      const portfolioByMetaId = new Map<string, any>(existingPortfolios.map(p => [p.metaBusinessId, p]));
      const accountByMetaId = new Map<string, any>(existingAccounts.map(a => [a.metaAdAccountId, a]));

      // 1. Parallel fetch businesses and accounts across all connections simultaneously
      await Promise.all(
        connections.map(async (connection) => {
          const token = connection.tokenSecretReference || this.getAccessToken();
          if (!token) return;

          // Fetch Businesses and Ad Accounts in parallel for this connection
          const [bizRes, adAccountsRes] = await Promise.all([
            fetch(`${this.baseUrl}/me/businesses?fields=id,name,verification_status&access_token=${token}`).then(r => r.json()).catch(() => ({ data: [] })),
            fetch(`${this.baseUrl}/me/adaccounts?fields=id,name,account_status,disable_reason,currency,balance,amount_spent,spend_cap,is_prepay_account,funding_source_details,timezone_name,business&limit=150&access_token=${token}`).then(r => r.json()).catch(() => ({ data: [] }))
          ]);

          let businesses: any[] = bizRes?.data || [];
          if (businesses.length === 0 && process.env.META_BUSINESS_ID) {
            businesses = [{ id: process.env.META_BUSINESS_ID, name: 'Getaipilot' }];
          }

          totalPortfoliosCount += businesses.length;
          const connPortfolioMap = new Map<string, string>();

          // Process portfolios in parallel
          await Promise.all(
            businesses.map(async (b) => {
              const existing = portfolioByMetaId.get(b.id);
              if (existing) {
                connPortfolioMap.set(b.id, existing.id);
              } else {
                const created = await this.prisma.businessPortfolio.create({
                  data: {
                    organizationId: orgId,
                    metaConnectionId: connection.id,
                    metaBusinessId: b.id,
                    name: b.name || `Business ${b.id}`,
                    status: 'ACTIVE'
                  }
                });
                portfolioByMetaId.set(b.id, created);
                connPortfolioMap.set(b.id, created.id);
              }
            })
          );

          const primaryPortfolioId = connPortfolioMap.values().next().value || existingPortfolios[0]?.id || null;
          const adAccountsData: any[] = adAccountsRes?.data || [];
          totalAccountsCount += adAccountsData.length;

          // Prepare DB operations and execute in atomic transaction batches (prevents DB connection pool starvation)
          const dbOps: any[] = [];
          for (const acc of adAccountsData) {
            const isMetaActive = acc.account_status === 1;
            const normalizedStatus = isMetaActive ? 'ACTIVE' : 'RESTRICTED';
            const canRunAds = isMetaActive;

            if (isMetaActive) activeCount++;
            else restrictedCount++;

            const effectiveBalanceMinor = this.extractEffectiveBalanceMinor(acc, 0n);
            totalBalanceMinor += effectiveBalanceMinor;

            const assignedPortfolioId = (acc.business && connPortfolioMap.get(acc.business.id)) || primaryPortfolioId;
            const existing = accountByMetaId.get(acc.id);

            if (existing) {
              dbOps.push(
                this.prisma.adAccount.update({
                  where: { id: existing.id },
                  data: {
                    name: acc.name || existing.name,
                    businessPortfolioId: assignedPortfolioId || existing.businessPortfolioId,
                    rawMetaStatus: String(acc.account_status),
                    normalizedStatus,
                    canRunAds,
                    currentTrackedBalanceMinor: effectiveBalanceMinor,
                    lastStatusSyncAt: new Date(),
                    lastSpendSyncAt: new Date()
                  }
                })
              );
            } else {
              dbOps.push(
                this.prisma.adAccount.create({
                  data: {
                    organizationId: orgId,
                    businessPortfolioId: assignedPortfolioId,
                    metaAdAccountId: acc.id,
                    name: acc.name || `Ad Account ${acc.id}`,
                    internalAlias: acc.name,
                    currencyCode: acc.currency || 'INR',
                    timezoneName: acc.timezone_name || 'Asia/Kolkata',
                    rawMetaStatus: String(acc.account_status),
                    normalizedStatus,
                    canRunAds,
                    currentTrackedBalanceMinor: effectiveBalanceMinor,
                    lastStatusSyncAt: new Date(),
                    lastSpendSyncAt: new Date()
                  }
                })
              );
            }
          }

          const batchSize = 25;
          for (let i = 0; i < dbOps.length; i += batchSize) {
            const batch = dbOps.slice(i, i + batchSize);
            await this.prisma.$transaction(batch);
          }

          // Update connection status
          await this.prisma.metaConnection.update({
            where: { id: connection.id },
            data: { lastSuccessfulSyncAt: new Date(), connectionStatus: 'CONNECTED' }
          }).catch(() => {});
        })
      );

      await this.cache.delPattern('meta:*');
      await this.cache.delPattern('reports:*');

      this.realtime.broadcast('META_ASSETS_UPDATED', {
        organizationId: orgId,
        userId,
        timestamp: Date.now()
      });
      this.realtime.broadcast('DASHBOARD_UPDATED', {
        organizationId: orgId,
        timestamp: Date.now()
      });

      // Auto-evaluate alerts in background
      this.alerts.evaluateAlerts(orgId).catch((err) => {
        this.logger.warn(`Alert evaluation background error: ${err?.message || err}`);
      });

      return {
        success: true,
        message: `Synced ${totalAccountsCount} Meta ad accounts (${activeCount} Active, ${restrictedCount} Restricted) across ${connections.length} connected profiles.`,
        portfoliosCount: totalPortfoliosCount,
        adAccountsCount: totalAccountsCount,
        activeCount,
        restrictedCount,
        totalBalanceINR: (Number(totalBalanceMinor) / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      };
    } catch (err: any) {
      this.logger.error(`Live Meta Sync Error: ${err?.message || err}`);
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(`Meta API Sync Failed: ${err?.message || err}`);
    }
  }

  /**
   * Generates Facebook Login for Business OAuth Dialog URL
   */
  getOAuthUrl(redirectUri: string, state?: string): { url: string } {
    const appId = process.env.META_APP_ID || '2122322675160174';
    const scope = 'ads_read,ads_management,business_management,public_profile';
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    const url = `https://www.facebook.com/${this.apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=code${stateParam}`;

    return { url };
  }

  /**
   * Exchanges OAuth authorization code for a Long-Lived User Access Token
   * and triggers automatic sync of all their Portfolios and Ad Accounts
   */
  async exchangeOAuthCode(code: string, redirectUri: string, organizationId?: string, userId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const appId = process.env.META_APP_ID || '2122322675160174';
    const appSecret = process.env.META_APP_SECRET || '70dcddc59dbc219d3076a7069f1ab488';

    this.logger.log(`Exchanging OAuth code for redirectUri: ${redirectUri}, user: ${userId || 'SYSTEM'}...`);

    // 1. Exchange code for Short-Lived Access Token
    const tokenUrl = `${this.baseUrl}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`;

    let tokenJson: any = null;
    try {
      const tokenRes = await fetch(tokenUrl);
      const rawText = await tokenRes.text();
      tokenJson = rawText ? JSON.parse(rawText) : null;
    } catch (err: any) {
      this.logger.error(`Failed to connect to Meta token endpoint: ${err?.message || err}`);
      throw new BadRequestException(`Unable to communicate with Facebook token servers: ${err?.message || err}`);
    }

    if (!tokenJson || tokenJson.error) {
      const msg = tokenJson?.error?.message || 'OAuth code exchange failed';
      this.logger.error(`OAuth code exchange error from Meta: ${msg}`);
      throw new BadRequestException(`Meta OAuth Error: ${msg}. If this code was already used or expired, please click "Connect Facebook Again" to obtain a fresh session.`);
    }

    const shortLivedToken = tokenJson.access_token;
    if (!shortLivedToken) {
      throw new BadRequestException('Meta API did not return an access_token in the response.');
    }

    // 2. Exchange for Long-Lived Token (valid for 60 days)
    let longLivedToken = shortLivedToken;
    try {
      const longTokenUrl = `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
      const longRes = await fetch(longTokenUrl);
      const longText = await longRes.text();
      const longJson = longText ? JSON.parse(longText) : null;
      if (longJson?.access_token) {
        longLivedToken = longJson.access_token;
        this.logger.log('Successfully acquired 60-day Long-Lived Meta Access Token.');
      }
    } catch (err) {
      this.logger.warn('Could not extend token to long-lived, falling back to short-lived token.');
    }

    // 3. Fetch User Profile (/me)
    let fbUserName = 'Facebook User';
    let fbUserId = `fb-${Date.now()}`;
    try {
      const meRes = await fetch(`${this.baseUrl}/me?fields=id,name,email&access_token=${longLivedToken}`);
      const meJson = await meRes.json();
      if (meJson?.name) fbUserName = meJson.name;
      if (meJson?.id) fbUserId = meJson.id;
    } catch (err) {
      this.logger.warn('Could not fetch /me user profile details.');
    }

    // 4. Create or update MetaConnection for this user (guarantee deduplication)
    const existingConnections = await this.prisma.metaConnection.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { externalContextId: fbUserId },
          ...(userId ? [{ userId }] : [])
        ]
      },
      include: {
        businessPortfolios: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    let connection: any = null;

    if (existingConnections.length > 0) {
      // Pick the connection with most portfolios, or the latest
      connection = existingConnections.reduce((prev, curr) =>
        (curr.businessPortfolios.length > prev.businessPortfolios.length) ? curr : prev
      );

      connection = await this.prisma.metaConnection.update({
        where: { id: connection.id },
        data: {
          internalName: `${fbUserName} (FB: ${fbUserId})`,
          externalContextId: fbUserId,
          tokenSecretReference: longLivedToken,
          connectionStatus: 'CONNECTED',
          userId: userId || connection.userId || null,
          lastSuccessfulSyncAt: new Date()
        }
      });

      // Clean up any extra duplicate connections that have 0 portfolios
      const duplicatesToDelete = existingConnections.filter(c => c.id !== connection.id && c.businessPortfolios.length === 0);
      for (const dup of duplicatesToDelete) {
        await this.prisma.metaConnection.delete({ where: { id: dup.id } }).catch(() => {});
      }
    } else {
      connection = await this.prisma.metaConnection.create({
        data: {
          organizationId: orgId,
          userId: userId || null,
          internalName: `${fbUserName} (FB: ${fbUserId})`,
          externalContextId: fbUserId,
          tokenSecretReference: longLivedToken,
          connectionStatus: 'CONNECTED',
          lastSuccessfulSyncAt: new Date()
        }
      });
    }

    // 5. Trigger live sync in non-blocking background task (instant response to user)
    process.env.META_ACCESS_TOKEN = longLivedToken;
    const targetConnId = connection.id;

    // Invalidate initial cache immediately
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');

    // Asynchronous background asset sync
    setImmediate(async () => {
      try {
        this.logger.log(`Background sync started for connection ${targetConnId}...`);
        await this.syncMetaAssets(orgId, userId, targetConnId);
        this.logger.log(`Background sync completed for connection ${targetConnId}.`);
        this.realtime.broadcast('USERS_UPDATED', { organizationId: orgId, userId, timestamp: Date.now() });
      } catch (syncErr: any) {
        this.logger.warn(`Background sync warning: ${syncErr?.message || syncErr}`);
      }
    });

    return {
      success: true,
      user: { id: fbUserId, name: fbUserName },
      connectionId: connection.id,
      message: 'Facebook Connected Successfully. Assets synchronizing in real time.'
    };
  }

  /**
   * Verify Webhook challenge from Meta
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.META_VERIFY_TOKEN || 'metabull_webhook_verify_2026';
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Meta Webhook Challenge Verified successfully.');
      return challenge;
    }
    return null;
  }

  /**
   * Handle incoming real-time Webhook events from Meta
   */
  async processWebhookEvent(payload: any) {
    this.logger.log(`Received Meta Webhook Event: ${JSON.stringify(payload)}`);
    // Triggers sync on ad_account events
    if (payload.object === 'ad_account' || payload.object === 'page' || payload.object === 'user') {
      await this.syncMetaAssets();
    }
    return { status: 'EVENT_RECEIVED' };
  }
}

