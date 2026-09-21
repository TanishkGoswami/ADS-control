import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Building,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Layers,
  RefreshCw,
  Users,
  Filter
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import {
  fetchDashboardMetrics,
  fetchMetaAdAccounts,
  fetchAlerts,
  triggerMetaSyncApi,
  fetchUsersApi,
  UserProfileDto
} from '../../lib/api';
import { formatINR, formatCurrency, DashboardMetricsDto, AdAccountDto, AlertDto } from '@ads-control/shared';
import { useAuth } from '../auth/AuthContext';
import { useRealtimeEvent } from '../../lib/realtime';

export const DashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetricsDto>({
    totalAdAccounts: 0,
    activeAdAccounts: 0,
    restrictedAdAccounts: 0,
    totalClientFundsMinor: '0',
    totalVendorPayablesMinor: '0',
    totalVendorReceivablesMinor: '0',
    totalLockedFundsMinor: '0',
    agencyFreePoolMinor: '0',
    todaySpendMinor: '0',
    unresolvedDiscrepanciesCount: 0,
    openAlertsCount: 0
  });
  const [adAccounts, setAdAccounts] = useState<AdAccountDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfileDto[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const isUserAdmin = currentUser?.role === 'ADMIN';
  const effectiveUserId = isUserAdmin ? selectedManagerId : currentUser?.id;

  const loadData = async (force = false) => {
    if (adAccounts.length === 0) {
      setIsLoading(true);
    }
    try {
      const [m, a, al, users] = await Promise.all([
        fetchDashboardMetrics(effectiveUserId, force),
        fetchMetaAdAccounts(effectiveUserId, force),
        fetchAlerts(),
        isUserAdmin ? fetchUsersApi() : Promise.resolve([])
      ]);
      setMetrics(m);
      setAdAccounts(a);
      setAlerts(al);
      if (users && users.length > 0) {
        setTeamMembers(users);
      }
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData(false);
  }, [selectedManagerId, currentUser?.id]);

  // Real-time synchronization across all tabs and users
  useRealtimeEvent(['DASHBOARD_UPDATED', 'META_ASSETS_UPDATED', 'LEDGER_UPDATED'], () => {
    void loadData(true);
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerMetaSyncApi(currentUser?.id);
      await loadData(true);
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#0a1317]">
              Meta Ads Financial & Operations Control
            </h1>
            {!isUserAdmin && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                Media Buyer: {currentUser?.name}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#64748b]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Live Meta Graph v22.0 Active
            </span>
            <span>PostgreSQL Connected</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Admin Ads Manager Filter */}
          {isUserAdmin && (
            <div className="flex items-center gap-1.5 bg-white border border-[#d9e0e8] px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-[#64748b]" />
              <span className="text-[10px] font-mono uppercase text-[#64748b] font-semibold">View As:</span>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="text-xs font-semibold text-[#0a1317] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Managers (Global View)</option>
                {teamMembers
                  .filter((u) => u.role === 'ADS_MANAGER')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.assignedAccountsCount} accounts)
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="bg-white border border-[#d9e0e8] px-2.5 py-1 text-right">
            <div className="text-[10px] font-mono uppercase text-[#64748b]">Agency Float</div>
            <div className="text-xs font-bold font-mono text-[#0064e0]">
              {formatINR(metrics.agencyFreePoolMinor)}
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 border border-[#d9e0e8] bg-white hover:bg-[#f1f4f7] text-[#0064e0] transition-colors"
            title="Trigger Meta Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 overflow-hidden border border-[#d9e0e8] bg-[#d9e0e8] gap-px sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Client Wallets"
          value={formatINR(metrics.totalClientFundsMinor)}
          subtitle="Available Funds"
          icon={Wallet}
          glow="blue"
          trend="Live database balance"
          trendPositive={true}
        />
        <StatCard
          title="Vendor Outstanding"
          value={formatINR(metrics.totalVendorPayablesMinor)}
          subtitle="Batches Pending"
          icon={Building}
          glow="amber"
          statusBadge="Live Balances"
          statusColor="bg-amber-50 text-amber-700 border-amber-200"
        />
        <StatCard
          title="Vendor Receivables"
          value={formatINR(metrics.totalVendorReceivablesMinor)}
          subtitle="Overpayment Asset"
          icon={TrendingUp}
          glow="emerald"
          statusBadge="Recoverable"
          statusColor="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <StatCard
          title="Locked in Restricted"
          value={formatINR(metrics.totalLockedFundsMinor)}
          subtitle="Protected Lots"
          icon={ShieldAlert}
          glow="rose"
          statusBadge={`${metrics.restrictedAdAccounts} Restricted`}
          statusColor="bg-rose-50 text-rose-700 border-rose-200"
        />
      </div>

      {/* Operational Highlights & Ad Accounts Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 overflow-hidden bg-white border border-[#d9e0e8]">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d9e0e8] bg-[#f8fafc]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0a1317] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0064e0]" />
              <span>Ad Accounts Portfolio ({adAccounts.length})</span>
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#f1f4f7] border border-[#d9e0e8] text-[#475569]">
              {metrics.activeAdAccounts} Active / {metrics.restrictedAdAccounts} Restricted
            </span>
          </div>

          <div className="max-h-[520px] overflow-y-auto divide-y divide-[#e2e8f0]">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-[#64748b] font-mono">
                Fetching accounts from Meta & database...
              </div>
            ) : adAccounts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748b]">
                {selectedManagerId !== 'ALL'
                  ? 'No ad accounts assigned to this manager yet. Use Team & Users to assign.'
                  : 'No ad accounts synced yet. Click "Sync Meta" to import your accounts.'}
              </div>
            ) : (
              adAccounts.map((account) => {
                const assignedUsers = (account as any).userAccess || [];
                return (
                  <div
                    key={account.id}
                    className="px-3 py-2.5 bg-white hover:bg-[#f8fafc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 mt-1 shrink-0 ${
                          account.normalizedStatus === 'ACTIVE'
                            ? 'bg-emerald-600'
                            : 'bg-rose-600'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#0a1317] truncate">{account.name}</span>
                          <span className="text-[10px] font-mono text-[#64748b]">({account.metaAdAccountId})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#64748b]">{account.internalAlias || account.currencyCode}</span>
                          {assignedUsers.length > 0 && (
                            <div className="flex gap-1">
                              {assignedUsers.map((ua: any) => (
                                <span
                                  key={ua.id || ua.userId}
                                  className="text-[9px] font-mono px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200"
                                >
                                  {ua.user?.name || 'Assigned'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                      <div className="text-right font-mono">
                        <div
                          className={`text-[9px] uppercase font-bold ${
                            account.normalizedStatus === 'RESTRICTED' ? 'text-rose-700' : 'text-[#64748b]'
                          }`}
                        >
                          {account.normalizedStatus === 'RESTRICTED' ? 'Stuck Amount' : 'Available Balance'}
                        </div>
                        <div
                          className={`font-semibold ${
                            account.normalizedStatus === 'RESTRICTED'
                              ? 'text-rose-700 bg-rose-50 px-1 border border-rose-200'
                              : 'text-[#0a1317]'
                          }`}
                        >
                          {formatCurrency(account.currentTrackedBalanceMinor, account.currencyCode)}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-[9px] text-[#64748b] uppercase font-bold">Allocated</div>
                        <div className="font-semibold text-[#0064e0]">
                          {formatCurrency(account.allocatedFundsMinor, account.currencyCode)}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 uppercase border font-semibold ${
                          account.normalizedStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {account.normalizedStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alert Queue */}
        <div className="bg-white border border-[#d9e0e8] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d9e0e8] bg-[#f8fafc]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0a1317] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Alert Queue</span>
            </h2>
            <span className="w-2 h-2 bg-emerald-600 animate-pulse" />
          </div>

          <div className="p-3 divide-y divide-[#e2e8f0] flex-1 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#64748b] font-mono">
                No active critical alerts. All ad accounts and wallets balanced.
              </div>
            ) : (
              alerts.map((al) => (
                <div key={al.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1">
                      {al.severity}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748b]">Real-time</span>
                  </div>
                  <div className="text-xs font-bold text-[#0a1317]">{al.title}</div>
                  <div className="text-[11px] text-[#475569]">{al.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
