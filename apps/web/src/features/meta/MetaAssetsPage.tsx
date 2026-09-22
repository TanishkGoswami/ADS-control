import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Download,
  Link2,
  UserCheck,
  Search,
  ChevronLeft,
  Filter,
  Users,
  Unlink,
  Trash2,
  X,
  SlidersHorizontal,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Building2,
  Target,
  ArrowRight,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  fetchMetaAdAccounts,
  triggerMetaSyncApi,
  handleAdAccountRestrictionApi,
  fetchMetaOAuthUrlApi,
  fetchMetaConnectionsApi,
  disconnectMetaConnectionApi,
  deleteMetaConnectionApi,
  fetchUsersApi,
  UserProfileDto
} from '../../lib/api';
import { formatINR, formatCurrency, formatDateTime } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';
import { useAuth } from '../auth/AuthContext';
import { useRealtimeEvent } from '../../lib/realtime';

export const MetaAssetsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isUserAdmin = currentUser?.role === 'ADMIN';

  const pageSize = 25;
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfileDto[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('ALL');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState<boolean>(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [connSearch, setConnSearch] = useState('');
  const [connFilter, setConnFilter] = useState<'ALL' | 'ACTIVE' | 'DISCONNECTED'>('ALL');
  const [expandedConnId, setExpandedConnId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [portfolioFilter, setPortfolioFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [syncProgress, setSyncProgress] = useState<{
    isOpen: boolean;
    percentage: number;
    currentStep: string;
    details: string;
    stats?: {
      portfolios: number;
      accounts: number;
      active: number;
      restricted: number;
      totalBalance: string;
    };
    isDone: boolean;
    error?: string;
  }>({
    isOpen: false,
    percentage: 0,
    currentStep: '',
    details: '',
    isDone: false
  });

  const effectiveUserId = isUserAdmin
    ? selectedManagerId !== 'ALL'
      ? selectedManagerId
      : undefined
    : currentUser?.id;

  const loadData = async (force = false) => {
    if (adAccounts.length === 0) {
      setIsLoading(true);
    }
    try {
      // 1. Fetch Ad Accounts (P0 - Instant Render)
      const accountsPromise = fetchMetaAdAccounts(effectiveUserId, force).then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAdAccounts(data);
          setIsLoading(false);
        }
      });

      // 2. Fetch Connections in parallel
      const connsPromise = fetchMetaConnectionsApi(effectiveUserId, force).then((data) => {
        if (Array.isArray(data)) setConnections(data);
      });

      // 3. Fetch Users for Admin dropdown in parallel
      const usersPromise = isUserAdmin
        ? fetchUsersApi().then((data) => {
            if (Array.isArray(data)) setTeamMembers(data);
          })
        : Promise.resolve();

      await Promise.allSettled([accountsPromise, connsPromise, usersPromise]);
    } catch (err) {
      console.error('Error loading meta assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData(false);
  }, [selectedManagerId, currentUser?.id]);

  // Real-time synchronization: when any manager syncs, refresh data silently
  useRealtimeEvent('META_ASSETS_UPDATED', () => {
    void loadData(true);
  });

  const handleConnectFacebook = async () => {
    try {
      const redirectUri = window.location.origin + '/auth/meta/callback';
      const { url } = await fetchMetaOAuthUrlApi(redirectUri, currentUser?.id);
      window.location.href = url;
    } catch (err: any) {
      setNotification({
        isOpen: true,
        title: 'Connection Error',
        message: err?.response?.data?.message || err.message,
        type: 'error'
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress({
      isOpen: true,
      percentage: 20,
      currentStep: 'Querying Meta Graph API v22.0...',
      details: 'Connecting to Meta servers',
      isDone: false
    });

    const timer1 = setTimeout(() => {
      setSyncProgress(prev => ({ ...prev, percentage: 60, currentStep: 'Processing 149 ad accounts in parallel...' }));
    }, 400);

    const timer2 = setTimeout(() => {
      setSyncProgress(prev => ({ ...prev, percentage: 85, currentStep: 'Updating live ledger & balances...' }));
    }, 900);

    try {
      await triggerMetaSyncApi(currentUser?.id);
      clearTimeout(timer1);
      clearTimeout(timer2);

      setSyncProgress({
        isOpen: true,
        percentage: 100,
        currentStep: 'Sync Complete!',
        details: 'All assets up to date',
        isDone: true
      });

      await loadData(true);

      setTimeout(() => {
        setSyncProgress((prev) => ({ ...prev, isOpen: false }));
      }, 500);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setSyncProgress({
        isOpen: true,
        percentage: 100,
        currentStep: 'Sync Failed',
        details: '',
        isDone: true,
        error: err?.response?.data?.message || err.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectConnection = (connectionId: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Disconnect Facebook Profile',
      message: `Are you sure you want to disconnect "${name}"? This will revoke linked ad account access and remove associated assets from your workspace.`,
      confirmLabel: 'Disconnect Profile',
      variant: 'danger',
      onConfirm: async () => {
        setDisconnectingId(connectionId);
        try {
          await disconnectMetaConnectionApi(connectionId, currentUser?.id);
          await loadData(true);
          setNotification({
            isOpen: true,
            title: 'Profile Disconnected',
            message: `Facebook profile "${name}" and its ad accounts have been cleanly removed from the workspace.`,
            type: 'success'
          });
        } catch (err: any) {
          setNotification({
            isOpen: true,
            title: 'Disconnect Failed',
            message: err?.response?.data?.message || err.message,
            type: 'error'
          });
        } finally {
          setDisconnectingId(null);
        }
      }
    });
  };

  const handleDeleteConnection = (connectionId: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Connection Record',
      message: `Permanently delete connection record "${name}" from the database? This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      variant: 'danger',
      onConfirm: async () => {
        setDisconnectingId(connectionId);
        try {
          await deleteMetaConnectionApi(connectionId);
          await loadData(true);
          setNotification({
            isOpen: true,
            title: 'Connection Deleted',
            message: `Connection record "${name}" has been permanently purged.`,
            type: 'success'
          });
        } catch (err: any) {
          setNotification({
            isOpen: true,
            title: 'Delete Failed',
            message: err?.response?.data?.message || err.message,
            type: 'error'
          });
        } finally {
          setDisconnectingId(null);
        }
      }
    });
  };

  const handleRestrict = (accountId: string, name?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Protect Restricted Ad Account',
      message: `Lock and preserve all active fund lots for "${name || accountId}" into the recovery ledger?`,
      confirmLabel: 'Protect & Lock Funds',
      variant: 'warning',
      onConfirm: async () => {
        setLockingId(accountId);
        try {
          await handleAdAccountRestrictionApi(accountId);
          await loadData(true);
          setNotification({
            isOpen: true,
            title: 'Funds Protected',
            message: 'Trapped funds have been locked into the recovery ledger successfully.',
            type: 'success'
          });
        } catch (err: any) {
          setNotification({
            isOpen: true,
            title: 'Protection Error',
            message: err?.response?.data?.message || err.message,
            type: 'error'
          });
        } finally {
          setLockingId(null);
        }
      }
    });
  };

  const toggleAccountExpand = (id: string) => {
    setExpandedAccounts((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExportCSV = () => {
    exportToCSV(
      adAccounts.map((acc) => ({
        Name: acc.name,
        MetaAdAccountId: acc.metaAdAccountId,
        Portfolio: acc.businessPortfolio?.name || 'Primary Portfolio',
        Status: acc.normalizedStatus,
        RawStatus: acc.rawMetaStatus,
        Currency: acc.currencyCode,
        TrackedBalanceINR: Number(acc.currentTrackedBalanceMinor) / 100,
        AllocatedFundsINR: Number(acc.allocatedFundsMinor || 0) / 100,
        LockedFundsINR: Number(acc.lockedFundsMinor || 0) / 100,
        LastSync: acc.lastStatusSyncAt
      })),
      'meta_ad_accounts_live'
    );
  };

  const portfolios = useMemo(
    () => Array.from(new Set(adAccounts.map((account) => account.businessPortfolio?.name).filter(Boolean))).sort(),
    [adAccounts]
  );
  const filteredAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return adAccounts.filter((account) => {
      const portfolio = account.businessPortfolio?.name || '';
      const matchesQuery = !term || [account.name, account.metaAdAccountId, portfolio]
        .some((value) => String(value || '').toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'ALL' || account.normalizedStatus === statusFilter;
      const matchesPortfolio = portfolioFilter === 'ALL' || portfolio === portfolioFilter;

      const matchesManager = selectedManagerId === 'ALL'
        || (account.userAccess && Array.isArray(account.userAccess) && account.userAccess.some((ua: any) => ua.userId === selectedManagerId || ua.user?.id === selectedManagerId))
        || (account.businessPortfolio?.metaConnection?.userId === selectedManagerId)
        || (account.businessPortfolio?.metaConnection?.user?.id === selectedManagerId);

      return matchesQuery && matchesStatus && matchesPortfolio && matchesManager;
    });
  }, [adAccounts, portfolioFilter, query, statusFilter, selectedManagerId]);

  const activeCount = useMemo(() => filteredAccounts.filter((a) => a.normalizedStatus === 'ACTIVE').length, [filteredAccounts]);
  const restrictedCount = useMemo(() => filteredAccounts.filter((a) => a.normalizedStatus === 'RESTRICTED').length, [filteredAccounts]);

  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const visibleAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);
  const trackedBalance = filteredAccounts.reduce(
    (total, account) => total + Number(account.currentTrackedBalanceMinor || 0),
    0
  );

  const totalConnProfiles = connections.length;

  const filteredConnections = useMemo(() => {
    const term = connSearch.trim().toLowerCase();
    return connections.filter((conn) => {
      const matchesTerm =
        !term ||
        conn.internalName?.toLowerCase().includes(term) ||
        conn.externalContextId?.toLowerCase().includes(term) ||
        conn.user?.name?.toLowerCase().includes(term) ||
        conn.businessPortfolios?.some((bp: any) => bp.name?.toLowerCase().includes(term));
      const matchesFilter =
        connFilter === 'ALL' ||
        (connFilter === 'ACTIVE' && conn.connectionStatus === 'CONNECTED') ||
        (connFilter === 'DISCONNECTED' && conn.connectionStatus !== 'CONNECTED');
      return matchesTerm && matchesFilter;
    });
  }, [connections, connSearch, connFilter]);

  const totalConnPortfolios = useMemo(() => {
    return connections.reduce((acc, c) => acc + (c.businessPortfolios?.length || 0), 0);
  }, [connections]);

  const totalConnAdAccounts = useMemo(() => {
    return connections.reduce(
      (acc, c) =>
        acc +
        (c.businessPortfolios?.reduce((sum: number, bp: any) => sum + (bp.adAccounts?.length || 0), 0) || 0),
      0
    );
  }, [connections]);

  const handleProtectRestrictedAccount = async (accountId: string, name: string) => {
    return handleRestrict(accountId);
  };

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div className="space-y-3.5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base font-semibold text-[#0f172a] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0064e0]" />
            <span>Meta assets</span>
            {!isUserAdmin && (
              <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-[5px] border border-blue-200/60">
                Assigned Accounts Only
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isUserAdmin && (
            <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] px-2.5 py-1 rounded-[5px] shadow-sm">
              <Filter className="w-3.5 h-3.5 text-[#64748b]" />
              <span className="text-[11px] font-semibold uppercase text-[#64748b]">Manager:</span>
              <select
                value={selectedManagerId}
                onChange={(e) => {
                  setSelectedManagerId(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-medium text-[#0f172a] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Managers ({teamMembers.length})</option>
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

          <button
            onClick={handleExportCSV}
            disabled={adAccounts.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-[#475569] bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 rounded-[5px] shadow-sm transition-all"
            title="Export Ad Accounts list to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsConnectionsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#0f172a] bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 rounded-[5px] shadow-sm transition-all"
            title="Manage connected Facebook profiles, accounts count, and disconnect access"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0064e0]" />
            <span>Manage Connections</span>
            <span className="font-mono text-[11px] bg-[#f1f5f9] text-[#334155] px-1.5 py-0.2 rounded-[4px] font-semibold border border-[#e2e8f0]">
              {connections.length}
            </span>
          </button>

          <button
            onClick={handleConnectFacebook}
            className="flex items-center gap-1.5 text-xs font-medium text-[#0064e0] bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/70 px-3 py-1.5 rounded-[5px] shadow-sm transition-all"
            title="Allow media buyers or clients to connect their Facebook account"
          >
            <Link2 className="w-3.5 h-3.5 text-[#0064e0]" />
            <span>Connect Facebook Profile</span>
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#0064e0] hover:bg-[#0052b8] px-3 py-1.5 rounded-[5px] shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Live Graph...' : 'Sync Meta Assets'}</span>
          </button>
        </div>
      </div>

      {/* Connected Facebook Profiles Quick Strip */}
      {connections.length > 0 && (
        <div className="py-2.5 px-3 bg-white rounded-[5px] border border-[#eaedf1] flex items-center justify-between gap-2.5 flex-wrap text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#64748b] font-medium">
              Connected Profiles ({connections.length}):
            </span>
            {connections.map((conn) => {
              const isConnected = conn.connectionStatus === 'CONNECTED';
              return (
                <div
                  key={conn.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#f8fafc] border border-[#eaedf1] rounded-[5px] text-[11px] text-[#0f172a]"
                >
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-400'}`} />
                  <span className="font-semibold">{conn.internalName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-[4px] font-medium ${
                    isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isConnected ? 'Active' : 'Disconnected'}
                  </span>
                  <button
                    onClick={() => handleDisconnectConnection(conn.id, conn.internalName)}
                    disabled={disconnectingId === conn.id}
                    className="text-[#94a3b8] hover:text-rose-600 ml-0.5 p-0.5 rounded transition-colors"
                    title="Disconnect this Facebook account"
                  >
                    <Unlink className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsConnectionsModalOpen(true)}
            className="text-xs font-semibold text-[#0064e0] hover:text-[#0052b8] flex items-center gap-1 transition-colors"
          >
            <span>Manage All ({connections.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Meta Connection Master Card */}
      <div className="rounded-[5px] bg-white border border-[#eaedf1] shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Top Connection Banner */}
        <div className="p-3.5 bg-[#f8fafc] border-b border-[#eaedf1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[5px] bg-[#0064e0] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-[#0f172a]">
                  {connections.length > 0 ? 'Meta Asset Control' : 'Meta Workspace'}
                </h2>
                {connections.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-[5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connected ({connections.length} Profiles)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-[5px] border border-slate-200">
                    {isUserAdmin ? 'Organization Central Hub' : 'No Facebook Account Linked Yet'}
                  </span>
                )}
                {portfolios.length > 0 && (
                  <span className="text-[11px] font-medium text-[#0f172a] bg-white px-2 py-0.5 rounded-[5px] border border-[#eaedf1]">
                    {portfolios.length === 1
                      ? `${portfolios[0]} Portfolio`
                      : portfolios.length <= 2
                      ? `${portfolios.join(' & ')} Portfolios`
                      : `${portfolios.length} Business Portfolios`}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#64748b] mt-0.5">
                {isUserAdmin ? 'Graph API v22.0 Master Control' : `Operator: ${currentUser?.name || 'Media Buyer'}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 text-xs text-[#475569] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#64748b]">Active:</span>
              <span className="font-semibold text-emerald-700">{activeCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[#64748b]">Restricted:</span>
              <span className="font-semibold text-rose-700">{restrictedCount}</span>
            </div>
            <div className="border-l border-[#e2e8f0] pl-3.5">
              <span className="text-[#64748b]">Total Accounts:</span>{' '}
              <span className="font-bold text-[#0f172a]">{adAccounts.length}</span>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col gap-2 border-b border-[#eaedf1] bg-white p-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search account, ID, or portfolio..."
              className="h-8 w-full rounded-[5px] border border-[#e2e8f0] bg-white pl-8 pr-3 text-xs outline-none focus:border-[#0064e0] transition-colors"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
            className="h-8 rounded-[5px] border border-[#e2e8f0] bg-white px-2.5 text-xs outline-none focus:border-[#0064e0] text-[#334155] font-medium cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RESTRICTED">Restricted</option>
          </select>
          <select
            value={portfolioFilter}
            onChange={(event) => { setPortfolioFilter(event.target.value); setPage(1); }}
            className="h-8 max-w-xs rounded-[5px] border border-[#e2e8f0] bg-white px-2.5 text-xs outline-none focus:border-[#0064e0] text-[#334155] font-medium cursor-pointer"
            aria-label="Filter by portfolio"
          >
            <option value="ALL">All Portfolios ({portfolios.length})</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio} value={portfolio}>{portfolio}</option>
            ))}
          </select>
          {(query || statusFilter !== 'ALL' || portfolioFilter !== 'ALL') && (
            <button
              onClick={() => { setQuery(''); setStatusFilter('ALL'); setPortfolioFilter('ALL'); setPage(1); }}
              className="text-xs text-[#0064e0] hover:underline font-medium ml-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#eaedf1] bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                <th className="py-3 px-3.5">Ad Account</th>
                <th className="py-3 px-3.5">Account ID</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Available Balance</th>
                <th className="py-3 px-3.5 text-right">Stuck / Trapped in Meta</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedf1]">
              {visibleAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94a3b8]">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0064e0]" />
                        <span>Loading ad accounts from database...</span>
                      </div>
                    ) : (
                      'No matching Meta Ad Accounts found.'
                    )}
                  </td>
                </tr>
              ) : (
                visibleAccounts.map((account) => {
                  const isExpanded = !!expandedAccounts[account.id];
                  const isRestricted = account.normalizedStatus === 'RESTRICTED';
                  const isLocking = lockingId === account.id;

                  return (
                    <React.Fragment key={account.id}>
                      <tr className={`hover:bg-[#f8fafc] transition-colors ${isExpanded ? 'bg-[#f8fafc]' : ''}`}>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => setExpandedAccounts((prev) => ({ ...prev, [account.id]: !prev[account.id] }))}
                              className="p-1 text-[#94a3b8] hover:text-[#0f172a] rounded-[4px] hover:bg-white transition-colors shrink-0"
                              aria-label={isExpanded ? 'Collapse account' : 'Expand account'}
                            >
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                            <div>
                              <div className="text-[14px] font-bold text-[#0f172a] leading-tight flex items-center gap-1.5">
                                <span>{account.name}</span>
                                {account.internalAlias && account.internalAlias !== account.name && (
                                  <span className="text-xs font-normal text-[#64748b]">({account.internalAlias})</span>
                                )}
                              </div>
                              <div className="text-xs text-[#64748b] flex items-center gap-2 mt-1">
                                <span>Portfolio: <strong className="text-[#334155] font-medium">{account.businessPortfolio?.name || 'Primary'}</strong></span>
                                <span>•</span>
                                <span>Currency: <strong className="text-[#334155] font-medium">{account.currencyCode || 'INR'}</strong></span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 font-mono text-xs text-[#475569]">
                          {account.metaAdAccountId}
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isRestricted ? 'bg-rose-500 ring-2 ring-rose-100' : 'bg-emerald-500 ring-2 ring-emerald-100'}`} />
                            <span className={`font-semibold text-xs ${isRestricted ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {isRestricted ? 'Restricted' : 'Active'}
                            </span>
                          </div>
                        </td>

                        {/* Available Balance: Only Active accounts have spendable available balance */}
                        <td className="py-3 px-3.5 text-right font-mono text-[13px]">
                          {isRestricted ? (
                            <span className="text-[#94a3b8] font-normal" title="Restricted accounts cannot spend funds in Meta">
                              ₹0.00
                            </span>
                          ) : (
                            <span className="font-bold text-[#0f172a]">
                              {formatCurrency(account.currentTrackedBalanceMinor, account.currencyCode)}
                            </span>
                          )}
                        </td>

                        {/* Stuck / Trapped in Meta: Shows trapped funds for restricted accounts */}
                        <td className="py-3 px-3.5 text-right font-mono text-[13px]">
                          {isRestricted ? (
                            <span className="text-rose-600 font-bold">
                              {formatCurrency(account.currentTrackedBalanceMinor, account.currencyCode)} <span className="text-[11px] font-medium">(Stuck)</span>
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] font-normal">
                              {Number(account.allocatedFundsMinor || 0) > 0
                                ? formatCurrency(account.allocatedFundsMinor, account.currencyCode)
                                : '—'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isRestricted && (
                              <button
                                onClick={() => handleProtectRestrictedAccount(account.id, account.name)}
                                disabled={isLocking}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[5px] shadow-sm flex items-center gap-1 transition-all"
                                title="Protect and move trapped balance to recovery ledger"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isLocking ? 'Locking...' : 'Protect Balance'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedAccounts((prev) => ({ ...prev, [account.id]: !prev[account.id] }))}
                              className="text-xs text-[#0064e0] hover:text-[#0052b8] hover:underline font-semibold px-2 py-1"
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Account Details & Flow Hierarchy Drawer */}
                      {isExpanded && (() => {
                        const rawActId = String(account.metaAdAccountId || '').replace(/^act_/, '');
                        const bizId = account.businessPortfolio?.metaBusinessId;
                        const adsManagerUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${rawActId}`;
                        const billingUrl = `https://business.facebook.com/ads/manager/billing_history/summary/?act=${rawActId}`;
                        const portfolioUrl = bizId
                          ? `https://business.facebook.com/settings/ad-accounts/${rawActId}?business_id=${bizId}`
                          : `https://business.facebook.com/settings/ad-accounts/${rawActId}`;
                        const connectionInfo = account.businessPortfolio?.metaConnection;
                        const assignedUser = account.userAccess?.[0]?.user || connectionInfo?.user;

                        return (
                          <tr className="bg-[#f8fafc]/90 border-b border-[#eaedf1]">
                            <td colSpan={6} className="p-4 space-y-3">
                              {/* 1. Visual Hierarchy & Flow Diagram */}
                              <div className="bg-white rounded-[5px] border border-[#eaedf1] p-3.5 shadow-sm space-y-2.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#f1f5f9]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                                      Asset Flow & Account Origin Pipeline
                                    </span>
                                    <span className="text-[10px] font-medium text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded-[4px] border border-[#eaedf1]">
                                      Facebook Profile ➔ Portfolio ➔ Ad Account
                                    </span>
                                  </div>

                                  {/* Quick External Links */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <a
                                      href={adsManagerUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#0064e0] hover:bg-[#0052b8] rounded-[5px] shadow-sm transition-all"
                                      title="Open this account directly in Facebook Ads Manager"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Open in Ads Manager</span>
                                    </a>

                                    <a
                                      href={billingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#334155] bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] rounded-[5px] shadow-sm transition-all"
                                      title="Open Billing & Payment methods in Meta"
                                    >
                                      <CreditCard className="w-3.5 h-3.5 text-[#64748b]" />
                                      <span>Billing & Invoices</span>
                                    </a>

                                    {portfolioUrl && (
                                      <a
                                        href={portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#334155] bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] rounded-[5px] shadow-sm transition-all"
                                        title="Open Business Settings for this portfolio"
                                      >
                                        <Building2 className="w-3.5 h-3.5 text-[#64748b]" />
                                        <span>Business Settings</span>
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Connected Node Pipeline */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-stretch">
                                  {/* Node 1: Facebook Profile */}
                                  <div className="p-3 bg-[#f8fafc] rounded-[5px] border border-[#eaedf1] flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-[5px] bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0064e0] shrink-0 mt-0.5">
                                      <UserCheck className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                                        1. Connected Facebook Profile
                                      </div>
                                      <div className="text-xs font-bold text-[#0f172a] truncate" title={connectionInfo?.internalName || 'Primary Master Connection'}>
                                        {connectionInfo?.internalName || 'Primary Master Connection'}
                                      </div>
                                      <div className="text-[11px] text-[#64748b] font-mono flex items-center gap-1.5">
                                        <span>FB ID: {connectionInfo?.externalContextId || 'Master'}</span>
                                      </div>
                                      {assignedUser && (
                                        <div className="text-[10px] font-medium text-[#0064e0] bg-blue-50/80 px-1.5 py-0.2 rounded w-fit border border-blue-200/50 mt-1">
                                          Assigned: {assignedUser.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Node 2: Business Portfolio */}
                                  <div className="p-3 bg-[#f8fafc] rounded-[5px] border border-[#eaedf1] flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-[5px] bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                                      <Building2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                                        2. Business Portfolio
                                      </div>
                                      <div className="text-xs font-bold text-[#0f172a] truncate" title={account.businessPortfolio?.name || 'Standalone Portfolio'}>
                                        {account.businessPortfolio?.name || 'Standalone Portfolio'}
                                      </div>
                                      <div className="text-[11px] text-[#64748b] font-mono">
                                        Meta Business ID: {bizId || 'Direct'}
                                      </div>
                                      {portfolioUrl && (
                                        <a
                                          href={portfolioUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-[#0064e0] hover:underline font-medium mt-1"
                                        >
                                          <span>Manage in Meta Business Suite</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* Node 3: Target Ad Account */}
                                  <div className="p-3 bg-[#f8fafc] rounded-[5px] border border-[#eaedf1] flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-[5px] bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                      <Target className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                                        3. Target Ad Account
                                      </div>
                                      <div className="text-xs font-bold text-[#0f172a] truncate" title={account.name}>
                                        {account.name}
                                      </div>
                                      <div className="text-[11px] text-[#64748b] font-mono">
                                        Account ID: {account.metaAdAccountId}
                                      </div>
                                      <a
                                        href={adsManagerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-[#0064e0] hover:underline font-medium mt-1"
                                      >
                                        <span>Direct Ads Manager Link</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Three Deep Dive Details Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                {/* Card A: Metadata & Graph API Status */}
                                <div className="bg-white p-3.5 rounded-[5px] border border-[#eaedf1] space-y-2">
                                  <span className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider block border-b border-[#f1f5f9] pb-1">
                                    Account Health & Graph Metadata
                                  </span>
                                  <div className="text-xs space-y-1.5 text-[#334155]">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Meta Delivery Status:</span>
                                      <span className={`font-semibold ${isRestricted ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {isRestricted ? 'Restricted / Disabled' : 'Active (Running)'} (Code: {account.rawMetaStatus || '1'})
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Ads Delivery Capability:</span>
                                      <span className="font-semibold text-[#0f172a]">{account.canRunAds ? 'Enabled' : 'Blocked by Meta'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Configured Timezone:</span>
                                      <span className="font-semibold text-[#0f172a]">{account.timezoneName || 'Asia/Kolkata'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Last Status Sync:</span>
                                      <span className="font-mono text-[11px] text-[#0f172a]">
                                        {account.lastStatusSyncAt ? formatDateTime(account.lastStatusSyncAt) : 'Live'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Card B: Financial Balances & Funding */}
                                <div className="bg-white p-3.5 rounded-[5px] border border-[#eaedf1] space-y-2">
                                  <span className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider block border-b border-[#f1f5f9] pb-1">
                                    Financials & Balance Breakdown
                                  </span>
                                  <div className="text-xs space-y-1.5 text-[#334155]">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Tracked Available Balance:</span>
                                      <span className="font-mono font-bold text-[#0f172a]">
                                        {formatCurrency(account.currentTrackedBalanceMinor, account.currencyCode)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Active Allocated Funds:</span>
                                      <span className="font-mono font-semibold text-[#0064e0]">
                                        {formatCurrency(account.allocatedFundsMinor || 0, account.currencyCode)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Locked / Recovery Funds:</span>
                                      <span className="font-mono font-semibold text-rose-600">
                                        {formatCurrency(account.lockedFundsMinor || 0, account.currencyCode)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#64748b]">Billing Currency:</span>
                                      <span className="font-bold text-[#0f172a]">{account.currencyCode || 'INR'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Card C: Assigned Team Access & Risk Protection */}
                                <div className="bg-white p-3.5 rounded-[5px] border border-[#eaedf1] space-y-2">
                                  <span className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider block border-b border-[#f1f5f9] pb-1">
                                    Team Access & Permissions
                                  </span>
                                  <div className="text-xs space-y-1.5 text-[#334155]">
                                    {account.userAccess && account.userAccess.length > 0 ? (
                                      account.userAccess.map((ua: any) => (
                                        <div key={ua.id} className="flex items-center justify-between p-1.5 bg-[#f8fafc] rounded-[4px] border border-[#eaedf1]">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <Users className="w-3.5 h-3.5 text-[#0064e0] shrink-0" />
                                            <span className="font-medium text-[#0f172a] truncate">{ua.user?.name || ua.user?.email}</span>
                                          </div>
                                          <span className="text-[10px] font-mono text-[#0064e0] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/50 shrink-0">
                                            {ua.accessRole}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-[#94a3b8] italic p-2 bg-[#f8fafc] rounded text-center">
                                        All Administrators have direct system access.
                                      </div>
                                    )}

                                    {isRestricted && (
                                      <div className="p-2 bg-rose-50 border border-rose-200/60 rounded-[4px] text-[11px] text-rose-800 space-y-1">
                                        <div className="font-bold flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                                          <span>Account Restriction Detected</span>
                                        </div>
                                        <p className="text-[10px] text-rose-700 leading-relaxed">
                                          Meta restricted ad delivery on this account. Funds are protected in the recovery ledger.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredAccounts.length > 0 && (
          <div className="p-3 bg-[#f8fafc] border-t border-[#eaedf1] flex items-center justify-between text-xs text-[#64748b]">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredAccounts.length)} of {filteredAccounts.length} ad accounts
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="h-8 px-2.5 rounded-[5px] border border-[#e2e8f0] bg-white text-[#334155] font-medium hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-16 text-center text-[#475569] font-medium">Page {page} of {pageCount}</span>
              <button
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page === pageCount}
                className="h-8 px-2.5 rounded-[5px] border border-[#e2e8f0] bg-white text-[#334155] font-medium hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connected Facebook Profiles & Asset Control Modal (Built for 10+ Multi-Account Management) */}
      {isConnectionsModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#eaedf1] max-w-3xl w-full rounded-[5px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#eaedf1] flex items-center justify-between bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0064e0]" />
                  <span>Facebook Profile Connections ({connections.length})</span>
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Manage all connected media buyer profiles, inspect business portfolios, and safely disconnect access.
                </p>
              </div>
              <button
                onClick={() => setIsConnectionsModalOpen(false)}
                className="p-1.5 text-[#94a3b8] hover:text-[#0f172a] rounded-[5px] hover:bg-[#f1f5f9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Metrics & Search/Filter Toolbar (For Scaling to 10+ Accounts) */}
            <div className="p-3.5 bg-[#f8fafc] border-b border-[#eaedf1] space-y-3">
              {/* Aggregate Metric Chips */}
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                <div className="px-2.5 py-1 bg-white border border-[#eaedf1] rounded-[5px] shadow-sm flex items-center gap-1.5">
                  <span className="text-[#64748b]">Connected Profiles:</span>
                  <span className="font-bold text-[#0f172a]">{totalConnProfiles}</span>
                </div>
                <div className="px-2.5 py-1 bg-white border border-[#eaedf1] rounded-[5px] shadow-sm flex items-center gap-1.5">
                  <span className="text-[#64748b]">Business Portfolios:</span>
                  <span className="font-bold text-[#0f172a]">{totalConnPortfolios}</span>
                </div>
                <div className="px-2.5 py-1 bg-white border border-[#eaedf1] rounded-[5px] shadow-sm flex items-center gap-1.5">
                  <span className="text-[#64748b]">Total Ad Accounts:</span>
                  <span className="font-bold text-[#0f172a]">{totalConnAdAccounts}</span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={connSearch}
                    onChange={(e) => setConnSearch(e.target.value)}
                    placeholder="Search profile name, FB ID, portfolio, or user..."
                    className="h-8 w-full rounded-[5px] border border-[#e2e8f0] bg-white pl-8 pr-3 text-xs outline-none focus:border-[#0064e0] transition-colors"
                  />
                  {connSearch && (
                    <button
                      onClick={() => setConnSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 border border-[#e2e8f0] rounded-[5px]">
                  {(['ALL', 'ACTIVE', 'DISCONNECTED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setConnFilter(filter)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors ${
                        connFilter === filter
                          ? 'bg-[#0064e0] text-white'
                          : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : 'Disconnected'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body - Profile Cards List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh] bg-[#f8fafc]/50">
              {filteredConnections.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#e2e8f0] bg-white rounded-[5px]">
                  <Link2 className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#0f172a]">
                    {connSearch || connFilter !== 'ALL' ? 'No profiles match your filter' : 'No Facebook Profiles Connected'}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-1">
                    {connSearch || connFilter !== 'ALL'
                      ? 'Try clearing your search keyword or filter.'
                      : 'Click "Connect Facebook Profile" below to authenticate your Meta accounts.'}
                  </p>
                </div>
              ) : (
                filteredConnections.map((conn) => {
                  const totalAccounts = conn.businessPortfolios?.reduce(
                    (sum: number, bp: any) => sum + (bp.adAccounts?.length || 0),
                    0
                  ) || 0;
                  const totalPortfolios = conn.businessPortfolios?.length || 0;
                  const isConnected = conn.connectionStatus === 'CONNECTED';
                  const isExpanded = expandedConnId === conn.id;

                  return (
                    <div
                      key={conn.id}
                      className="bg-white border border-[#eaedf1] rounded-[5px] hover:border-[#cbd5e1] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden"
                    >
                      <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#0f172a]">{conn.internalName}</span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              isConnected ? 'text-emerald-700' : 'text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {isConnected ? 'Active' : 'Disconnected'}
                            </span>
                            {conn.user && (
                              <span className="text-[10px] font-medium text-[#0064e0] bg-blue-50/80 px-2 py-0.5 rounded-[4px] border border-blue-200/50">
                                Assigned: {conn.user.name} ({conn.user.role})
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#64748b] flex items-center gap-2 flex-wrap font-mono">
                            <span className="font-semibold text-[#334155]">{totalPortfolios} Portfolios</span>
                            <span>•</span>
                            <span className="font-semibold text-[#334155]">{totalAccounts} Ad Accounts</span>
                            <span>•</span>
                            <span>
                              Synced: {conn.lastSuccessfulSyncAt ? new Date(conn.lastSuccessfulSyncAt).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {totalPortfolios > 0 && (
                            <button
                              onClick={() => setExpandedConnId(isExpanded ? null : conn.id)}
                              className="px-2.5 py-1 text-xs font-medium text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-[5px] flex items-center gap-1 transition-colors"
                              title="View portfolios and accounts breakdown for this profile"
                            >
                              <span>Portfolios</span>
                              {isExpanded ? <ChevronDown className="w-3 h-3 text-[#64748b]" /> : <ChevronRight className="w-3 h-3 text-[#64748b]" />}
                            </button>
                          )}

                          {isConnected ? (
                            <button
                              onClick={() => handleDisconnectConnection(conn.id, conn.internalName)}
                              disabled={disconnectingId === conn.id}
                              className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50/70 border border-rose-200/70 hover:bg-rose-100 rounded-[5px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              title="Disconnect this profile and revoke its account bindings"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                              <span>{disconnectingId === conn.id ? 'Disconnecting...' : 'Disconnect'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#94a3b8] italic">Disconnected</span>
                          )}

                          {isUserAdmin && (
                            <button
                              onClick={() => handleDeleteConnection(conn.id, conn.internalName)}
                              disabled={disconnectingId === conn.id}
                              className="p-1.5 text-[#94a3b8] hover:text-rose-600 hover:bg-rose-50 rounded-[5px] transition-colors"
                              title="Delete connection record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Portfolios Breakdown for this Facebook Profile */}
                      {isExpanded && conn.businessPortfolios && (
                        <div className="px-3 pb-3 pt-1 border-t border-[#f1f5f9] bg-[#f8fafc]/70">
                          <span className="text-[10px] font-semibold uppercase text-[#64748b] tracking-wider mb-1.5 block">
                            Portfolios & Accounts under {conn.internalName}:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {conn.businessPortfolios.map((bp: any) => (
                              <div
                                key={bp.id}
                                className="p-2 bg-white rounded-[4px] border border-[#eaedf1] flex items-center justify-between text-[11px]"
                              >
                                <span className="font-medium text-[#0f172a] truncate max-w-[200px]" title={bp.name}>
                                  {bp.name}
                                </span>
                                <span className="font-mono text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                  {bp.adAccounts?.length || 0} accounts
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#eaedf1] bg-white flex items-center justify-between gap-2">
              <button
                onClick={handleConnectFacebook}
                className="bg-[#0064e0] hover:bg-[#0052b8] text-white px-3.5 py-2 rounded-[5px] text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>+ Connect Another Facebook Profile</span>
              </button>

              <button
                onClick={() => setIsConnectionsModalOpen(false)}
                className="border border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#f8fafc] px-4 py-2 rounded-[5px] text-xs font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Custom Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#e2e8f0] max-w-md w-full rounded-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-full shrink-0 ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-blue-50 text-[#0064e0] border border-blue-200'
                }`}
              >
                {confirmDialog.variant === 'danger' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : confirmDialog.variant === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#0f172a]">{confirmDialog.title}</h4>
                <p className="text-xs text-[#64748b] leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#f1f5f9]">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-medium text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-[5px] transition-colors"
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  const onConfirm = confirmDialog.onConfirm;
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  await onConfirm();
                }}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-[5px] shadow-sm transition-all ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#0064e0] hover:bg-[#0052b8]'
                }`}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Notification / Toast Dialog */}
      {notification.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#e2e8f0] max-w-md w-full rounded-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full shrink-0 ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : notification.type === 'error'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-blue-50 text-[#0064e0] border border-blue-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0f172a]">{notification.title}</h4>
                <p className="text-xs text-[#64748b] leading-relaxed">{notification.message}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#f1f5f9]">
              <button
                onClick={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0064e0] hover:bg-[#0052b8] rounded-[5px] transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Minimal Bottom-Right Progress Toast */}
      {syncProgress.isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-white border border-[#d9e0e8] shadow-lg rounded-md p-3 space-y-2 animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center justify-between text-xs font-semibold text-[#0a1317]">
            <div className="flex items-center gap-2">
              {syncProgress.isDone ? (
                syncProgress.error ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#0064e0] animate-spin shrink-0" />
              )}
              <span>{syncProgress.isDone ? (syncProgress.error ? 'Sync Failed' : 'Sync Complete') : 'Syncing Meta Assets...'}</span>
            </div>
            <span className="font-mono text-[11px] text-[#0064e0] font-bold">{syncProgress.percentage}%</span>
          </div>

          <div className="w-full h-1.5 bg-[#f1f4f7] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                syncProgress.error
                  ? 'bg-rose-500'
                  : syncProgress.isDone
                  ? 'bg-emerald-500'
                  : 'bg-[#0064e0]'
              }`}
              style={{ width: `${syncProgress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
