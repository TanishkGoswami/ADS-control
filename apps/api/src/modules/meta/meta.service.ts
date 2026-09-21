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
      if (userId) {
        const user = await this.prisma.userProfile.findUnique({ where: { id: userId } });
        if (user && user.role === 'ADS_MANAGER') {
          whereClause.userAccess = { some: { userId: userId } };
        } else if (userId !== 'ALL') {
          // Admin filtering by a specific manager
          whereClause.userAccess = { some: { userId: userId } };
        }
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
              user: { select: { id: true, name: true, email: true } }
            }
          },
          statusHistory: { orderBy: { detectedAt: 'desc' }, take: 10 },
          spendFacts: { orderBy: { spendDate: 'desc' }, take: 30 }
        }
      });
    }, 60);
  }

  private extractEffectiveBalanceMinor(acc: any, fallback: bigint = 0n): bigint {
    const displayString = acc.funding_source_details?.display_string || '';
    if (/available/i.test(displayString) || /prepaid/i.test(displayString) || /balance/i.test(displayString)) {
      const match = displayString.match(/([0-9,]+\.?[0-9]*)/);
      if (match) {
        const cleanNum = parseFloat(match[1].replace(/,/g, '')) || 0;
        return BigInt(Math.round(cleanNum * 100));
      }
    }
    if (acc.is_prepay_account && acc.spend_cap && acc.amount_spent) {
      const cap = BigInt(acc.spend_cap || '0');
      const spent = BigInt(acc.amount_spent || '0');
      if (cap > spent && cap < 10000000000n) {
        return cap - spent;
      }
    }
    if (/^\d+$/.test(String(acc.balance ?? '')) && BigInt(acc.balance) > 0n) {
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
      // 1. Resolve Meta Connection with stored access token
      let connection = targetConnectionId
        ? await this.prisma.metaConnection.findUnique({ where: { id: targetConnectionId } })
        : await this.prisma.metaConnection.findFirst({
            where: {
              organizationId: orgId,
              connectionStatus: 'CONNECTED',
              tokenSecretReference: { not: null },
              ...(userId ? { userId } : {})
            },
            orderBy: { updatedAt: 'desc' }
          });

      if (!connection || !connection.tokenSecretReference) {
        connection = await this.prisma.metaConnection.findFirst({
          where: {
            organizationId: orgId,
            connectionStatus: 'CONNECTED',
            tokenSecretReference: { not: null }
          },
          orderBy: { updatedAt: 'desc' }
        });
      }

      const token = connection?.tokenSecretReference || this.getAccessToken();

      if (!token || !connection) {
        throw new BadRequestException('No active Facebook Connection found. Please connect your Facebook account first using "Connect Facebook".');
      }

      await this.prisma.metaConnection.update({
        where: { id: connection.id },
        data: { lastSuccessfulSyncAt: new Date(), connectionStatus: 'CONNECTED' }
      });

      // 2. Fetch User Businesses / Portfolios
      let businesses: any[] = [];
      try {
        const bizUrl = `${this.baseUrl}/me/businesses?fields=id,name,verification_status&access_token=${token}`;
        const bizRes = await fetch(bizUrl);
        const bizJson = await bizRes.json();
        businesses = bizJson?.data || [];
      } catch (err: any) {
        this.logger.warn(`Could not fetch businesses directly: ${err?.message || err}`);
      }

      // Fallback if specific META_BUSINESS_ID is defined
      if (businesses.length === 0 && process.env.META_BUSINESS_ID) {
        businesses = [{ id: process.env.META_BUSINESS_ID, name: 'Getaipilot' }];
      }

      const portfolioMap = new Map<string, string>(); // metaBusinessId -> internal db uuid

      for (const b of businesses) {
        const portfolio = await this.prisma.businessPortfolio.upsert({
          where: {
            organizationId_metaBusinessId: {
              organizationId: orgId,
              metaBusinessId: b.id
            }
          },
          create: {
            organizationId: orgId,
            metaConnectionId: connection.id,
            metaBusinessId: b.id,
            name: b.name || `Business ${b.id}`,
            status: b.verification_status === 'verified' ? 'ACTIVE' : 'ACTIVE'
          },
          update: {
            name: b.name || undefined,
            metaConnectionId: connection.id,
            status: 'ACTIVE'
          }
        });
        portfolioMap.set(b.id, portfolio.id);

        if (userId) {
          await this.prisma.userPortfolioAccess.upsert({
            where: {
              userId_businessPortfolioId: {
                userId,
                businessPortfolioId: portfolio.id
              }
            },
            update: {},
            create: {
              organizationId: orgId,
              userId,
              businessPortfolioId: portfolio.id,
              accessRole: 'OWNER'
            }
          });
        }
      }

      // Default primary portfolio ID if accounts aren't explicitly assigned
      const primaryPortfolioId = portfolioMap.values().next().value || null;

      // 3. Fetch Ad Accounts from Meta with full billing and funding source details
      const adAccountsUrl = `${this.baseUrl}/me/adaccounts?fields=id,name,account_status,disable_reason,currency,balance,amount_spent,spend_cap,is_prepay_account,funding_source_details,timezone_name,business&limit=100&access_token=${token}`;
      const adAccountsRes = await fetch(adAccountsUrl);
      const adAccountsJson = await adAccountsRes.json();

      if (adAccountsJson.error) {
        throw new Error(`Meta API error: ${adAccountsJson.error.message}`);
      }

      const adAccountsData: any[] = adAccountsJson?.data || [];
      this.logger.log(`Received ${adAccountsData.length} ad accounts from Meta Graph API.`);

      let activeCount = 0;
      let restrictedCount = 0;
      let totalBalanceMinor = 0n;

      // Process ad accounts in fast parallel chunks of 20
      const chunkSize = 20;
      for (let i = 0; i < adAccountsData.length; i += chunkSize) {
        const chunk = adAccountsData.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (acc) => {
            // Meta account_status: 1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, 7 = PENDING_RISK_REVIEW, 101 = CLOSED
            const isMetaActive = acc.account_status === 1;
            const normalizedStatus = isMetaActive ? 'ACTIVE' : 'RESTRICTED';
            const canRunAds = isMetaActive;

            if (isMetaActive) activeCount++;
            else restrictedCount++;

            // Calculate accurate Available Balance (for ACTIVE) or Stuck Amount (for RESTRICTED)
            const effectiveBalanceMinor = this.extractEffectiveBalanceMinor(acc, 0n);
            totalBalanceMinor += effectiveBalanceMinor;

            const assignedPortfolioId = (acc.business && portfolioMap.get(acc.business.id)) || primaryPortfolioId;

            const adAccountRecord = await this.prisma.adAccount.upsert({
              where: {
                organizationId_metaAdAccountId: {
                  organizationId: orgId,
                  metaAdAccountId: acc.id
                }
              },
              create: {
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
              },
              update: {
                name: acc.name || undefined,
                businessPortfolioId: assignedPortfolioId,
                rawMetaStatus: String(acc.account_status),
                normalizedStatus,
                canRunAds,
                currentTrackedBalanceMinor: effectiveBalanceMinor,
                lastStatusSyncAt: new Date(),
                lastSpendSyncAt: new Date()
              }
            });

            // Link UserAdAccountAccess for this connecting user
            if (userId) {
              await this.prisma.userAdAccountAccess.upsert({
                where: {
                  userId_adAccountId: {
                    userId: userId,
                    adAccountId: adAccountRecord.id
                  }
                },
                update: {},
                create: {
                  organizationId: orgId,
                  userId: userId,
                  adAccountId: adAccountRecord.id,
                  accessRole: 'OWNER'
                }
              });
            }
          })
        );
      }

      // Background parallel fetch for active accounts insights (non-blocking)
      const activeMetaAccounts = adAccountsData.filter((a) => a.account_status === 1);
      Promise.allSettled(
        activeMetaAccounts.map(async (acc) => {
          try {
            const dbAcc = await this.prisma.adAccount.findUnique({
              where: {
                organizationId_metaAdAccountId: {
                  organizationId: orgId,
                  metaAdAccountId: acc.id
                }
              }
            });
            if (!dbAcc) return;

            // Fetch campaigns
            const campUrl = `${this.baseUrl}/${acc.id}/campaigns?fields=id,name,status,effective_status&limit=20&access_token=${token}`;
            const campRes = await fetch(campUrl);
            const campJson = await campRes.json();
            if (campJson?.data && Array.isArray(campJson.data)) {
              for (const c of campJson.data) {
                await this.prisma.metaCampaign.upsert({
                  where: {
                    organizationId_metaCampaignId: {
                      organizationId: orgId,
                      metaCampaignId: c.id
                    }
                  },
                  create: {
                    organizationId: orgId,
                    adAccountId: dbAcc.id,
                    metaCampaignId: c.id,
                    name: c.name,
                    rawStatus: c.status,
                    effectiveStatus: c.effective_status || c.status
                  },
                  update: {
                    name: c.name,
                    rawStatus: c.status,
                    effectiveStatus: c.effective_status || c.status
                  }
                });
              }
            }

            // Fetch daily spend facts (last 7 days)
            const insightsUrl = `${this.baseUrl}/${acc.id}/insights?date_preset=last_7d&time_increment=1&fields=spend,date_start,impressions,clicks&access_token=${token}`;
            const insRes = await fetch(insightsUrl);
            const insJson = await insRes.json();
            if (insJson?.data && Array.isArray(insJson.data)) {
              for (const ins of insJson.data) {
                if (ins.spend && ins.date_start) {
                  const spendRupees = parseFloat(ins.spend) || 0;
                  const spendMinor = BigInt(Math.round(spendRupees * 100));
                  const spendDate = new Date(ins.date_start);

                  const existingFact = await this.prisma.spendFact.findFirst({
                    where: {
                      adAccountId: dbAcc.id,
                      spendDate: spendDate
                    }
                  });

                  if (existingFact) {
                    await this.prisma.spendFact.update({
                      where: { id: existingFact.id },
                      data: { amountMinor: spendMinor, fetchedAt: new Date() }
                    });
                  } else {
                    await this.prisma.spendFact.create({
                      data: {
                        organizationId: orgId,
                        adAccountId: dbAcc.id,
                        spendDate,
                        amountMinor: spendMinor,
                        currencyCode: acc.currency || 'INR'
                      }
                    });
                  }
                }
              }
            }
          } catch (err: any) {
            // Non-critical background failure
          }
        })
      ).catch(() => {});

      // 5. Update Connection timestamp
      await this.prisma.metaConnection.update({
        where: { id: connection.id },
        data: {
          lastSuccessfulSyncAt: new Date(),
          connectionStatus: 'CONNECTED'
        }
      });

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
        message: `Synced ${adAccountsData.length} Meta ad accounts (${activeCount} Active, ${restrictedCount} Restricted) with live available & stuck balances.`,
        portfoliosCount: businesses.length,
        adAccountsCount: adAccountsData.length,
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

