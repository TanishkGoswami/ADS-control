import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Building,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Layers,
  RefreshCw,
  Users,
  Filter,
  BookOpenCheck,
  Scale,
  Building2,
  ArrowRight,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import {
  fetchDashboardMetrics,
  fetchMetaAdAccounts,
  fetchAlerts,
  triggerMetaSyncApi,
  fetchUsersApi,
  fetchLedgerTransactions,
  fetchReconciliationSnapshots,
  UserProfileDto
} from '../../lib/api';
import {
  formatINR,
  formatCurrency,
  formatDateTime,
  DashboardMetricsDto,
  AdAccountDto,
  AlertDto,
  FinancialLedgerTransactionDto
} from '@ads-control/shared';
import { useAuth } from '../auth/AuthContext';
import { useRealtimeEvent } from '../../lib/realtime';
import { InfoTooltip } from '../../components/InfoTooltip';

export const DashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedManagerId, setSelectedManagerId] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const isUserAdmin = currentUser?.role === 'ADMIN';
  const isUserFinance = currentUser?.role === 'FINANCE';
  const effectiveUserId = isUserAdmin ? selectedManagerId : currentUser?.id;

  // React Query with in-memory caching for instant (0ms) tab switches
  const {
    data: metrics = {
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
    },
    isFetching: isMetricsFetching
  } = useQuery({
    queryKey: ['dashboard-metrics', effectiveUserId],
    queryFn: () => fetchDashboardMetrics(effectiveUserId, false),
    staleTime: 1000 * 60 * 5
  });

  const { data: adAccounts = [] } = useQuery({
    queryKey: ['dashboard-meta-accounts', effectiveUserId],
    queryFn: () => fetchMetaAdAccounts(effectiveUserId, false),
    enabled: !isUserFinance,
    staleTime: 1000 * 60 * 5
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => fetchAlerts(),
    staleTime: 1000 * 60 * 3
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['dashboard-team-members'],
    queryFn: () => fetchUsersApi(),
    enabled: isUserAdmin,
    staleTime: 1000 * 60 * 10
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['ledger-transactions'],
    queryFn: () => fetchLedgerTransactions(),
    enabled: isUserFinance || isUserAdmin,
    staleTime: 1000 * 60 * 3
  });

  const { data: reconciliationSnapshots = [] } = useQuery({
    queryKey: ['reconciliation-snapshots'],
    queryFn: () => fetchReconciliationSnapshots(),
    enabled: isUserFinance || isUserAdmin,
    staleTime: 1000 * 60 * 3
  });

  // Real-time synchronization across all tabs and users without UI blocking
  useRealtimeEvent(['DASHBOARD_UPDATED', 'META_ASSETS_UPDATED', 'LEDGER_UPDATED'], () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['reconciliation-snapshots'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-meta-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerMetaSyncApi(currentUser?.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['reconciliation-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-meta-accounts'] })
      ]);
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Compute Reconciliation Stats for Finance
  const matchedCount = reconciliationSnapshots.filter((s: any) => s.status === 'MATCHED').length;
  const discrepancyCount = reconciliationSnapshots.filter((s: any) => s.status === 'DISCREPANCY').length;

  return (
    <div className="space-y-3 pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#0a1317]">
              {isUserFinance
                ? 'Finance & Treasury Control Center'
                : 'Meta Ads Financial & Operations Control'}
            </h1>
            {isUserFinance ? (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                Finance Officer: {currentUser?.name}
              </span>
            ) : !isUserAdmin ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                Media Buyer: {currentUser?.name}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                Super Admin
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#64748b]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Double-Entry Ledger Active
            </span>
            <span>•</span>
            <span>Real-time Treasury Sync</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Admin Ads Manager Filter (Only for Admin) */}
          {isUserAdmin && (
            <div className="flex items-center gap-1.5 bg-white border border-[#d9e0e8] px-2 py-1 rounded-lg">
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

          <div className="bg-white border border-[#d9e0e8] px-3 py-1 text-right rounded-lg shadow-xs">
            <div className="text-[10px] font-mono uppercase text-[#64748b] font-semibold">Agency Float</div>
            <div className="text-xs font-bold font-mono text-[#0064e0]">
              {formatINR(metrics.agencyFreePoolMinor)}
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing || isMetricsFetching}
            className="p-2 border border-[#d9e0e8] bg-white hover:bg-[#f1f4f7] text-[#0064e0] transition-colors rounded-lg shadow-xs"
            title="Trigger Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isMetricsFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Client Wallets"
          value={formatINR(metrics.totalClientFundsMinor)}
          subtitle="Available Funds"
          icon={Wallet}
          glow="blue"
          trend="Live database balance"
          trendPositive={true}
          infoTooltip="Total liquid client wallet balances ready for ad account allocation."
          hinglishHelp="Sabhi clients ke wallets me bacha hua available balance jo campaign me allocate ho sakta hai."
        />
        <StatCard
          title="Vendor Outstanding"
          value={formatINR(metrics.totalVendorPayablesMinor)}
          subtitle="Batches Pending"
          icon={Building}
          glow="amber"
          statusBadge="Live Balances"
          statusColor="bg-amber-50 text-amber-700 border-amber-200"
          infoTooltip="Total outstanding credit batches owed to funding vendors."
          hinglishHelp="Vendors ka total bacha hua loan / credit jo agency ko repay karna baaki hai."
        />
        <StatCard
          title="Vendor Receivables"
          value={formatINR(metrics.totalVendorReceivablesMinor)}
          subtitle="Overpayment Asset"
          icon={TrendingUp}
          glow="emerald"
          statusBadge="Recoverable"
          statusColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          infoTooltip="Overpayment credits due back to the agency from funding partners."
          hinglishHelp="Vendor ke paas extra bacha hua paisa jo agency wapas claim kar sakti hai."
        />
        <StatCard
          title="Locked in Restricted"
          value={formatINR(metrics.totalLockedFundsMinor)}
          subtitle="Protected Lots"
          icon={ShieldAlert}
          glow="rose"
          statusBadge={`${metrics.restrictedAdAccounts} Restricted`}
          statusColor="bg-rose-50 text-rose-700 border-rose-200"
          infoTooltip="Client fund lots currently held on disabled or restricted Meta ad accounts."
          hinglishHelp="Restricted ya ban hue accounts me atka hua budget jise safely reallocate kiya ja sakta hai."
        />
      </div>

      {/* Role-Specific Main Section */}
      {isUserFinance ? (
        /* ================= FINANCE DASHBOARD VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left 2 Cols: Financial Ledger Stream & Reconciliation Health */}
          <div className="lg:col-span-2 space-y-3">
            {/* Recent Ledger Transactions */}
            <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm overflow-hidden">
              <div className="p-3 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-[#0064e0]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0a1317]">
                    Recent Journal Postings & Cash Flow
                  </h2>
                </div>
                <NavLink
                  to="/finance"
                  className="text-xs font-semibold text-[#0064e0] hover:underline flex items-center gap-1"
                >
                  <span>Full Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>

              <div className="divide-y divide-[#f0f2f5] max-h-[380px] overflow-y-auto">
                {recentTransactions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748b]">
                    No ledger transactions recorded yet.
                  </div>
                ) : (
                  recentTransactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 hover:bg-[#fafbfc] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0064e0]">
                            {tx.transactionCode}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f0f2f5] text-[#475569] border border-[#e4e6eb] font-semibold">
                            {tx.transactionType}
                          </span>
                        </div>
                        <p className="text-[#475569] text-xs truncate max-w-md">
                          {tx.description}
                        </p>
                        <div className="text-[10px] text-[#94a3b8] font-mono">
                          Posted: {formatDateTime(tx.postedAt)}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="font-bold text-[#0a1317] text-sm">
                          {formatINR(tx.totalAmountMinor)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Balanced ({tx.entries?.length || 0} Dr/Cr)
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reconciliation Health Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#0064e0]" />
                    <span className="text-xs font-bold text-[#0a1317]">
                      3-Way Reconciliation
                    </span>
                  </div>
                  <p className="text-[11px] text-[#657383] mt-1">
                    Meta vs Ledger vs Lot Ownership audit.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {matchedCount} Matched
                    </span>
                    {discrepancyCount > 0 && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        {discrepancyCount} Variance
                      </span>
                    )}
                  </div>
                </div>
                <NavLink
                  to="/reconciliation"
                  className="px-3 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
                >
                  Audit Status
                </NavLink>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0064e0]" />
                    <span className="text-xs font-bold text-[#0a1317]">
                      Vendor Credit Lines
                    </span>
                  </div>
                  <p className="text-[11px] text-[#657383] mt-1">
                    Outstanding: {formatINR(metrics.totalVendorPayablesMinor)}
                  </p>
                  <div className="mt-2 text-xs font-mono text-[#475569]">
                    Overpayment asset: {formatINR(metrics.totalVendorReceivablesMinor)}
                  </div>
                </div>
                <NavLink
                  to="/vendors"
                  className="px-3 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] text-[#0a1317] text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
                >
                  Manage Credit
                </NavLink>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Live Financial Alert Queue */}
          <div className="bg-white border border-[#e4e6eb] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#e4e6eb] bg-[#fafbfc]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0a1317] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Treasury Risk & Alerts</span>
              </h2>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
            </div>

            <div className="p-3 divide-y divide-[#f0f2f5] flex-1 overflow-y-auto max-h-[480px]">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#64748b]">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  No critical treasury alerts. All ledgers and wallets are balanced.
                </div>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          al.severity === 'CRITICAL'
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {al.severity}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748b]">Real-time</span>
                    </div>
                    <div className="text-xs font-bold text-[#0a1317]">{al.title}</div>
                    <div className="text-[11px] text-[#475569] leading-snug">{al.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= MEDIA BUYER / ADMIN VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 overflow-hidden bg-white border border-[#d9e0e8] rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d9e0e8] bg-[#f8fafc]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0a1317] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0064e0]" />
                <span>Ad Accounts Portfolio ({adAccounts.length})</span>
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#f1f4f7] border border-[#d9e0e8] text-[#475569] rounded">
                {metrics.activeAdAccounts} Active / {metrics.restrictedAdAccounts} Restricted
              </span>
            </div>

            <div className="max-h-[520px] overflow-y-auto divide-y divide-[#e2e8f0]">
              {adAccounts.length === 0 ? (
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
                          className={`w-2 h-2 mt-1 rounded-full shrink-0 ${
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
                                    className="text-[9px] font-mono px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded"
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
                                ? 'text-rose-700 bg-rose-50 px-1 border border-rose-200 rounded'
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
                          className={`text-[10px] font-mono px-1.5 py-0.5 uppercase border font-semibold rounded ${
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
          <div className="bg-white border border-[#d9e0e8] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d9e0e8] bg-[#f8fafc]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0a1317] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Live Alert Queue</span>
              </h2>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
            </div>

            <div className="p-3 divide-y divide-[#e2e8f0] flex-1 overflow-y-auto max-h-[520px]">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748b] font-mono">
                  No active critical alerts. All ad accounts and wallets balanced.
                </div>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded">
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
      )}
    </div>
  );
};
