import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Building,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Layers,
  RefreshCw,
  Filter,
  BookOpenCheck,
  Scale,
  Building2,
  ArrowRight,
  CheckCircle2,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  UserCheck,
  X
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { LiveAlertQueue } from './LiveAlertQueue';
import {
  fetchDashboardMetrics,
  fetchMetaAdAccounts,
  fetchAlerts,
  triggerMetaSyncApi,
  fetchUsersApi,
  fetchLedgerTransactions,
  fetchReconciliationSnapshots
} from '../../lib/api';
import {
  formatINR,
  formatCurrency,
  formatDateTime
} from '@ads-control/shared';
import { useAuth } from '../auth/AuthContext';
import { useRealtimeEvent } from '../../lib/realtime';

export const DashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedManagerId, setSelectedManagerId] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESTRICTED'>('ALL');

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
      // Seamlessly refresh active dashboard caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-meta-accounts'] })
      ]);
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered Ad Accounts
  const filteredAccounts = useMemo(() => {
    return adAccounts.filter((account) => {
      const matchesSearch =
        !accountSearch ||
        account.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        account.metaAdAccountId.toLowerCase().includes(accountSearch.toLowerCase()) ||
        (account.internalAlias && account.internalAlias.toLowerCase().includes(accountSearch.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && account.normalizedStatus === 'ACTIVE') ||
        (statusFilter === 'RESTRICTED' && account.normalizedStatus === 'RESTRICTED');

      return matchesSearch && matchesStatus;
    });
  }, [adAccounts, accountSearch, statusFilter]);

  // Compute Reconciliation Stats for Finance
  const matchedCount = reconciliationSnapshots.filter((s: any) => s.status === 'MATCHED').length;
  const discrepancyCount = reconciliationSnapshots.filter((s: any) => s.status === 'DISCREPANCY').length;

  return (
    <div className="space-y-4 pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-[#1c1e21] tracking-tight">
              {isUserFinance
                ? 'Finance & Treasury Control Center'
                : 'Meta Ads Financial & Operations Control'}
            </h1>
            {isUserFinance ? (
              <span className="meta-badge-success text-[10px] font-mono">
                Finance Officer: {currentUser?.name}
              </span>
            ) : !isUserAdmin ? (
              <span className="meta-badge-blue text-[10px] font-mono">
                Media Buyer: {currentUser?.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-[5px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[10px] font-semibold font-mono">
                Super Admin
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Admin Ads Manager Filter (Only for Admin) */}
          {isUserAdmin && (
            <div className="flex items-center gap-1.5 bg-white border border-[#d7dce2] px-2.5 py-1 rounded-[5px] shadow-xs">
              <Filter className="w-3.5 h-3.5 text-[#5d6c7b]" />
              <span className="text-[10px] font-mono uppercase text-[#5d6c7b] font-semibold">View As:</span>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="text-xs font-semibold text-[#1c1e21] bg-transparent focus:outline-none cursor-pointer"
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

          <div className="bg-white border border-[#d7dce2] px-3 py-1 text-right rounded-[5px] shadow-xs">
            <div className="text-[9.5px] font-mono uppercase text-[#5d6c7b] font-semibold">Agency Float</div>
            <div className="text-xs font-bold font-mono text-[#0064e0]">
              {formatINR(metrics.agencyFreePoolMinor)}
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing || isMetricsFetching}
            className="meta-btn-secondary min-h-8 px-2.5"
            title="Trigger Meta Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0064e0] ${isSyncing || isMetricsFetching ? 'animate-spin' : ''}`} />
            <span className="ml-1.5 text-xs font-semibold">Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Client Wallets"
          value={formatINR(metrics.totalClientFundsMinor)}
          icon={Wallet}
          glow="blue"
          infoTooltip="Total liquid client wallet balances ready for ad account allocation."
        />
        <StatCard
          title="Vendor Outstanding"
          value={formatINR(metrics.totalVendorPayablesMinor)}
          icon={Building}
          glow="amber"
          infoTooltip="Total outstanding credit batches owed to funding vendors."
        />
        <StatCard
          title="Vendor Receivables"
          value={formatINR(metrics.totalVendorReceivablesMinor)}
          icon={TrendingUp}
          glow="emerald"
          infoTooltip="Overpayment credits due back to the agency from funding partners."
        />
        <StatCard
          title="Locked in Restricted"
          value={formatINR(metrics.totalLockedFundsMinor)}
          icon={ShieldAlert}
          glow="rose"
          infoTooltip="Client fund lots currently held on disabled or restricted Meta ad accounts."
        />
      </div>

      {/* Role-Specific Main Section */}
      {isUserFinance ? (
        /* ================= FINANCE DASHBOARD VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left 2 Cols: Financial Ledger Stream & Reconciliation Health */}
          <div className="lg:col-span-2 space-y-3">
            {/* Recent Ledger Transactions */}
            <div className="meta-card overflow-hidden">
              <div className="p-3 border-b border-[#e4e7eb] bg-[#f8fafc] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-[#0064e0]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1c1e21]">
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
                  <div className="p-8 text-center text-xs text-[#5d6c7b]">
                    No ledger transactions recorded yet.
                  </div>
                ) : (
                  recentTransactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 hover:bg-[#f8fafc] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0064e0]">
                            {tx.transactionCode}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f1f4f7] text-[#475569] border border-[#d7dce2] font-semibold">
                            {tx.transactionType}
                          </span>
                        </div>
                        <p className="text-[#475569] text-xs truncate max-w-md">
                          {tx.description}
                        </p>
                        <div className="text-[10px] text-[#8a94a1] font-mono">
                          Posted: {formatDateTime(tx.postedAt)}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="font-bold text-[#1c1e21] text-sm">
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
              <div className="meta-card p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#0064e0]" />
                    <span className="text-xs font-bold text-[#1c1e21]">
                      3-Way Reconciliation
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5d6c7b] mt-1">
                    Meta vs Ledger vs Lot Ownership audit.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="meta-badge-success text-[10px] font-mono">
                      {matchedCount} Matched
                    </span>
                    {discrepancyCount > 0 && (
                      <span className="meta-badge-warning text-[10px] font-mono">
                        {discrepancyCount} Variance
                      </span>
                    )}
                  </div>
                </div>
                <NavLink
                  to="/reconciliation"
                  className="meta-btn-buy"
                >
                  Audit Status
                </NavLink>
              </div>

              <div className="meta-card p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0064e0]" />
                    <span className="text-xs font-bold text-[#1c1e21]">
                      Vendor Credit Lines
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5d6c7b] mt-1">
                    Outstanding: {formatINR(metrics.totalVendorPayablesMinor)}
                  </p>
                  <div className="mt-2 text-xs font-mono text-[#475569]">
                    Overpayment asset: {formatINR(metrics.totalVendorReceivablesMinor)}
                  </div>
                </div>
                <NavLink
                  to="/vendors"
                  className="meta-btn-secondary"
                >
                  Manage Credit
                </NavLink>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Live Financial Alert Queue */}
          <LiveAlertQueue
            alerts={alerts}
            title="Treasury Risk & Alerts"
            isFinanceView={true}
          />
        </div>
      ) : (
        /* ================= MEDIA BUYER / ADMIN VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Ad Accounts Portfolio Table Card */}
          <div className="lg:col-span-2 overflow-hidden meta-card flex flex-col">
            {/* Header & Controls */}
            <div className="p-3 border-b border-[#e4e7eb] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0064e0]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1c1e21]">
                  Ad Accounts Portfolio ({adAccounts.length})
                </h2>
                <span className="meta-badge-blue text-[10px] font-mono">
                  {metrics.activeAdAccounts} Active / {metrics.restrictedAdAccounts} Restricted
                </span>
              </div>

              {/* Search & Status Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-48 sm:w-60">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a94a1]" />
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    placeholder="Search account or ID..."
                    className="h-8 w-full pl-8 pr-7 text-xs bg-white border border-[#d7dce2] rounded-[5px] text-[#1c1e21] placeholder-[#8a94a1] focus:outline-none focus:ring-1 focus:ring-[#0064e0] focus:border-[#0064e0] transition-colors"
                  />
                  {accountSearch && (
                    <button
                      type="button"
                      onClick={() => setAccountSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a94a1] hover:text-[#1c1e21] p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-[#f1f4f7] p-0.5 rounded-[5px] border border-[#d7dce2] h-8">
                  {(['ALL', 'ACTIVE', 'RESTRICTED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`h-7 px-2.5 text-[11px] font-semibold rounded-[4px] transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'bg-white text-[#1c1e21] shadow-xs'
                          : 'text-[#5d6c7b] hover:text-[#1c1e21]'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Restricted'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Body */}
            <div className="max-h-[540px] overflow-y-auto divide-y divide-[#f0f2f5]">
              {filteredAccounts.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#5d6c7b]">
                  {accountSearch || statusFilter !== 'ALL'
                    ? 'No ad accounts match the selected filters.'
                    : selectedManagerId !== 'ALL'
                    ? 'No ad accounts assigned to this manager yet. Use Team & Users to assign.'
                    : 'No ad accounts synced yet. Click "Sync" to import your accounts.'}
                </div>
              ) : (
                filteredAccounts.map((account) => {
                  const assignedUsers = ((account as any).userAccess || []).filter((ua: any) => {
                    const role = ua.user?.role?.toUpperCase();
                    const name = (ua.user?.name || '').toLowerCase();
                    const email = (ua.user?.email || '').toLowerCase();
                    return role !== 'ADMIN' && role !== 'FINANCE' && !name.includes('admin') && !email.startsWith('admin');
                  });
                  const isRestricted = account.normalizedStatus === 'RESTRICTED';

                  return (
                    <div
                      key={account.id}
                      className="p-3 hover:bg-[#f8fafc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left Side: Account Info */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                            isRestricted ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#1c1e21] truncate max-w-xs">{account.name}</span>
                            <span className="text-[10px] font-mono text-[#5d6c7b] bg-[#f1f4f7] px-1.5 py-0.2 rounded border border-[#e4e7eb]">
                              {account.metaAdAccountId}
                            </span>
                            {account.internalAlias &&
                              account.internalAlias.trim().toLowerCase() !== account.name.trim().toLowerCase() && (
                                <span className="text-[10px] text-[#5d6c7b] italic font-medium">
                                  ({account.internalAlias})
                                </span>
                              )}
                          </div>

                          {/* Assigned Team Members */}
                          {assignedUsers.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-[#8a94a1] font-medium flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-[#5d6c7b]" />
                                Access:
                              </span>
                              {assignedUsers.map((ua: any) => (
                                <span
                                  key={ua.id || ua.userId}
                                  className="text-[9.5px] font-mono px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-medium"
                                >
                                  {ua.user?.name || 'Assigned'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Balances & Status */}
                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        <div className="text-right font-mono">
                          <div
                            className={`text-[9.5px] uppercase font-bold tracking-tight ${
                              isRestricted ? 'text-rose-700' : 'text-[#5d6c7b]'
                            }`}
                          >
                            {isRestricted ? 'Stuck Balance' : 'Available Balance'}
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              isRestricted ? 'text-rose-700' : 'text-[#1c1e21]'
                            }`}
                          >
                            {formatCurrency(account.currentTrackedBalanceMinor, account.currencyCode)}
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-[9.5px] text-[#5d6c7b] uppercase font-bold tracking-tight">Allocated</div>
                          <div className="text-sm font-bold text-[#0064e0]">
                            {formatCurrency(account.allocatedFundsMinor, account.currencyCode)}
                          </div>
                        </div>

                        <span
                          className={
                            isRestricted
                              ? 'meta-badge-critical text-[10px] font-mono'
                              : 'meta-badge-success text-[10px] font-mono'
                          }
                        >
                          {account.normalizedStatus}
                        </span>

                        <NavLink
                          to="/meta"
                          className="p-1 text-[#5d6c7b] hover:text-[#0064e0] hover:bg-[#f1f4f7] rounded transition-colors"
                          title="View in Meta Assets"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </NavLink>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Alert Queue Card */}
          <LiveAlertQueue alerts={alerts} title="Live Alert Queue" />
        </div>
      )}
    </div>
  );
};
