import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  ExternalLink,
  Trash2,
  CreditCard,
  Building2,
  FileX,
  FileWarning,
  Radio,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  fetchAlerts,
  evaluateAlertsApi,
  acknowledgeAlertApi,
  resolveAlertApi,
  clearResolvedAlertsApi,
  handleAdAccountRestrictionApi,
  fetchMetaOAuthUrlApi
} from '../../lib/api';
import { AlertDto, formatDateTime } from '@ads-control/shared';
import { useAuth } from '../auth/AuthContext';
import { useRealtimeEvent } from '../../lib/realtime';
import { ConfirmDialog, NotificationModal } from '../../components/ModalDialog';

export const AlertsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL_ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // 'ALL', 'OPEN', 'ACKNOWLEDGED'
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
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

  const loadAlerts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn('Failed to load alerts:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useRealtimeEvent(['ALERT_CREATED', 'ALERT_UPDATED', 'META_ASSETS_UPDATED', 'DASHBOARD_UPDATED'], () => {
    loadAlerts(true);
  });

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const result = await evaluateAlertsApi();
      await loadAlerts(true);
      setNotification({
        isOpen: true,
        title: 'Health Scan Complete',
        message: `Scanned all assets. Created ${result.newAlertsCreated} new alerts, auto-resolved ${result.autoResolved}.`,
        type: 'success'
      });
    } catch (err: any) {
      setNotification({
        isOpen: true,
        title: 'Scan Failed',
        message: err?.response?.data?.message || err.message || 'Health scan failed',
        type: 'error'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    setActionLoadingId(id);
    try {
      await acknowledgeAlertApi(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' as any } : a))
      );
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoadingId(id);
    try {
      await resolveAlertApi(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' as any } : a))
      );
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClearResolved = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Resolved Incidents',
      message: 'Are you sure you want to remove all resolved incidents?',
      variant: 'info',
      confirmLabel: 'Clear All',
      onConfirm: async () => {
        try {
          const res = await clearResolvedAlertsApi();
          await loadAlerts(true);
          setNotification({
            isOpen: true,
            title: 'Incidents Cleared',
            message: res.message || 'Resolved alerts cleared.',
            type: 'success'
          });
        } catch (err: any) {
          setNotification({
            isOpen: true,
            title: 'Action Failed',
            message: err?.response?.data?.message || err.message,
            type: 'error'
          });
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleReclaimFunds = (alertItem: AlertDto) => {
    const meta = (alertItem.metadataJson as any) || {};
    const adAccountId = alertItem.entityId || meta.adAccountId;
    if (!adAccountId) {
      navigate('/meta');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Reclaim Funds',
      message: `Lock active fund lots and return stuck balance for account ${meta.metaAdAccountId || ''} to client wallet?`,
      confirmLabel: 'Reclaim Now',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await handleAdAccountRestrictionApi(adAccountId);
          await resolveAlertApi(alertItem.id);
          await loadAlerts(true);
          setNotification({
            isOpen: true,
            title: 'Funds Reclaimed',
            message: 'Stuck funds successfully recovered.',
            type: 'success'
          });
        } catch (err: any) {
          setNotification({
            isOpen: true,
            title: 'Reclaim Failed',
            message: err?.response?.data?.message || err.message,
            type: 'error'
          });
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleReconnectFacebook = async (alertItem: AlertDto) => {
    try {
      const redirectUri = window.location.origin + '/auth/meta/callback';
      const { url } = await fetchMetaOAuthUrlApi(redirectUri, currentUser?.id);
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setNotification({
        isOpen: true,
        title: 'Connection Failed',
        message: err?.response?.data?.message || err.message || 'Failed to start OAuth',
        type: 'error'
      });
    }
  };

  // Counts
  const criticalAccountsCount = alerts.filter(
    (a) => a.alertType === 'RESTRICTED_ACCOUNT_WITH_FUNDS' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status)
  ).length;
  const lowBalanceCount = alerts.filter(
    (a) => a.alertType === 'LOW_BALANCE' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status)
  ).length;
  const adsRejectedCount = alerts.filter(
    (a) => a.alertType === 'AD_DISAPPROVED' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status)
  ).length;
  const pagesDisabledCount = alerts.filter(
    (a) => a.alertType === 'PAGE_DISABLED' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status)
  ).length;
  const disconnectedCount = alerts.filter(
    (a) => a.alertType === 'META_CONNECTION_DISCONNECTED' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status)
  ).length;
  const totalActiveCount = alerts.filter((a) => ['OPEN', 'ACKNOWLEDGED'].includes(a.status)).length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  // Filtered List
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Category Tab Filter
      let matchCategory = true;
      if (activeCategory === 'ALL_ACTIVE') {
        matchCategory = a.status === 'OPEN' || a.status === 'ACKNOWLEDGED';
      } else if (activeCategory === 'RESTRICTED') {
        matchCategory = a.alertType === 'RESTRICTED_ACCOUNT_WITH_FUNDS' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status);
      } else if (activeCategory === 'LOW_BALANCE') {
        matchCategory = a.alertType === 'LOW_BALANCE' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status);
      } else if (activeCategory === 'AD_REJECTED') {
        matchCategory = a.alertType === 'AD_DISAPPROVED' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status);
      } else if (activeCategory === 'PAGE_DISABLED') {
        matchCategory = a.alertType === 'PAGE_DISABLED' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status);
      } else if (activeCategory === 'DISCONNECTED') {
        matchCategory = a.alertType === 'META_CONNECTION_DISCONNECTED' && ['OPEN', 'ACKNOWLEDGED'].includes(a.status);
      } else if (activeCategory === 'RESOLVED') {
        matchCategory = a.status === 'RESOLVED';
      }

      // Status Filter
      let matchStatus = true;
      if (statusFilter === 'OPEN') matchStatus = a.status === 'OPEN';
      else if (statusFilter === 'ACKNOWLEDGED') matchStatus = a.status === 'ACKNOWLEDGED';

      // Search Filter
      const q = searchQuery.toLowerCase().trim();
      const meta = (a.metadataJson as any) || {};
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.alertType.toLowerCase().includes(q) ||
        (meta.metaAdAccountId && meta.metaAdAccountId.toLowerCase().includes(q)) ||
        (meta.portfolioName && meta.portfolioName.toLowerCase().includes(q)) ||
        (meta.campaignName && meta.campaignName.toLowerCase().includes(q)) ||
        (meta.pageName && meta.pageName.toLowerCase().includes(q));

      return matchCategory && matchStatus && matchSearch;
    });
  }, [alerts, activeCategory, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / pageSize) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAlerts.slice(start, start + pageSize);
  }, [filteredAlerts, page, pageSize]);

  return (
    <div className="space-y-3 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e4e6eb] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#0a1317]">
                Alerts &amp; Incidents
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {totalActiveCount} Active
              </span>
            </div>
            <p className="text-[11px] text-[#657383]">
              Automated alerts for restricted accounts, low balances, and rejected ads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {resolvedCount > 0 && (
            <button
              onClick={handleClearResolved}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#f0f2f5] text-[#657383] hover:text-[#0a1317] border border-[#e4e6eb] rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Resolved ({resolvedCount})</span>
            </button>
          )}

          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Scanning...' : 'Scan Health'}</span>
          </button>
        </div>
      </div>

      {/* Clean Category Filter Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#e4e6eb] overflow-x-auto shadow-xs text-xs font-medium">
        {[
          { id: 'ALL_ACTIVE', label: 'All Issues', count: totalActiveCount },
          { id: 'RESTRICTED', label: 'Restricted', count: criticalAccountsCount, dot: 'bg-rose-500' },
          { id: 'LOW_BALANCE', label: 'Low Balance', count: lowBalanceCount, dot: 'bg-amber-500' },
          { id: 'AD_REJECTED', label: 'Rejected Ads', count: adsRejectedCount, dot: 'bg-orange-500' },
          { id: 'PAGE_DISABLED', label: 'Disabled Pages', count: pagesDisabledCount, dot: 'bg-rose-500' },
          { id: 'DISCONNECTED', label: 'Disconnected', count: disconnectedCount, dot: 'bg-slate-400' },
          { id: 'RESOLVED', label: 'Resolved', count: resolvedCount, dot: 'bg-emerald-500' }
        ].map((tab) => {
          const isSelected = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#0064e0] text-white font-semibold shadow-xs'
                  : 'text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5]'
              }`}
            >
              {tab.dot && !isSelected && (
                <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              )}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : tab.count > 0
                    ? 'bg-[#f0f2f5] text-[#0a1317]'
                    : 'text-[#94a3b8]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-xs overflow-hidden">
        {/* Compact Search & Status Filter Row */}
        <div className="p-2.5 border-b border-[#e4e6eb] flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-[#fafbfc]">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search account, portfolio, or ad..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e4e6eb] rounded-lg text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs">
            {/* Status Selector */}
            {activeCategory !== 'RESOLVED' && (
              <div className="flex items-center bg-white border border-[#e4e6eb] rounded-lg p-0.5 text-xs">
                {[
                  { id: 'ALL', label: 'All Status' },
                  { id: 'OPEN', label: 'Open' },
                  { id: 'ACKNOWLEDGED', label: 'Acked' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setStatusFilter(s.id);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      statusFilter === s.id
                        ? 'bg-[#0a1317] text-white font-semibold'
                        : 'text-[#657383] hover:text-[#0a1317]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <span className="text-[#657383] text-[11px]">
              Total: <strong>{filteredAlerts.length}</strong>
            </span>
          </div>
        </div>

        {/* Minimalist Incident Table */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#657383]">
            <div className="w-5 h-5 border-2 border-[#0064e0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading incidents...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-[#0a1317]">
              No incidents found
            </div>
            <p className="text-[11px] text-[#657383]">
              All items in this category are operating smoothly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fafbfc] border-b border-[#e4e6eb] text-[#657383] text-[11px] font-semibold">
                  <th className="py-2.5 px-3 w-10">Type</th>
                  <th className="py-2.5 px-3">Asset / Target</th>
                  <th className="py-2.5 px-3">Issue &amp; Impact</th>
                  <th className="py-2.5 px-3">Detected</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {paginatedAlerts.map((alertItem) => {
                  const isRestricted = alertItem.alertType === 'RESTRICTED_ACCOUNT_WITH_FUNDS';
                  const isLowBalance = alertItem.alertType === 'LOW_BALANCE';
                  const isAdRejected = alertItem.alertType === 'AD_DISAPPROVED';
                  const isPageDisabled = alertItem.alertType === 'PAGE_DISABLED';
                  const isDisconnected = alertItem.alertType === 'META_CONNECTION_DISCONNECTED';
                  const isResolved = alertItem.status === 'RESOLVED';
                  const isAcked = alertItem.status === 'ACKNOWLEDGED';
                  const meta = (alertItem.metadataJson as any) || {};

                  return (
                    <tr
                      key={alertItem.id}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        isResolved ? 'opacity-60 bg-[#fafbfc]/40' : ''
                      }`}
                    >
                      {/* 1. Type Icon */}
                      <td className="py-2.5 px-3 align-top">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isRestricted || isPageDisabled
                              ? 'bg-rose-50 text-rose-600'
                              : isLowBalance
                              ? 'bg-amber-50 text-amber-600'
                              : isAdRejected
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-blue-50 text-[#0064e0]'
                          }`}
                        >
                          {isRestricted ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : isLowBalance ? (
                            <CreditCard className="w-4 h-4" />
                          ) : isAdRejected ? (
                            <FileX className="w-4 h-4" />
                          ) : isPageDisabled ? (
                            <FileWarning className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                      </td>

                      {/* 2. Asset & Hierarchy */}
                      <td className="py-2.5 px-3 align-top min-w-[180px]">
                        <div className="font-semibold text-[#0a1317] text-xs">
                          {meta.campaignName || meta.pageName || alertItem.title.replace(/^Low Balance Warning: |^Restricted Account with Stuck Balance: |^Ad\/Campaign Rejected: |^Facebook Page Disabled\/Unpublished: /g, '')}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#657383] mt-0.5">
                          {meta.portfolioName && (
                            <span className="truncate max-w-[120px]">{meta.portfolioName}</span>
                          )}
                          {meta.metaAdAccountId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-[#94a3b8]">{meta.metaAdAccountId}</span>
                            </>
                          )}
                          {meta.pageId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-[#94a3b8]">Page: {meta.pageId}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 3. Issue & Highlighted Balance */}
                      <td className="py-2.5 px-3 align-top min-w-[200px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Severity Pill */}
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                              isRestricted
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLowBalance
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : isAdRejected
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : isPageDisabled
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-blue-50 text-[#0064e0] border-blue-200'
                            }`}
                          >
                            {isRestricted
                              ? 'Restricted Account'
                              : isLowBalance
                              ? 'Low Balance (< ₹500)'
                              : isAdRejected
                              ? 'Ad Rejected'
                              : isPageDisabled
                              ? 'Page Disabled'
                              : 'Warning'}
                          </span>

                          {/* Impact amount if available */}
                          {meta.balanceINR && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isRestricted
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              ₹{meta.balanceINR} {isRestricted ? 'Stuck' : 'Left'}
                            </span>
                          )}

                          {/* Status */}
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                              isResolved
                                ? 'bg-emerald-50 text-emerald-700'
                                : isAcked
                                ? 'bg-blue-50 text-[#0064e0]'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isResolved ? 'Resolved' : isAcked ? 'Acked' : 'Open'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Detected Time */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap text-[11px] text-[#657383] font-mono">
                        {formatDateTime(alertItem.createdAt)}
                      </td>

                      {/* 5. 1-Click Action Buttons */}
                      <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Primary 1-Click Action */}
                          {isRestricted && !isResolved && (
                            <button
                              onClick={() => handleReclaimFunds(alertItem)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Reclaim</span>
                            </button>
                          )}

                          {isLowBalance && !isResolved && (
                            <button
                              onClick={() => navigate('/meta')}
                              className="px-2.5 py-1 bg-[#0064e0] hover:bg-[#0052b8] text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Add Funds</span>
                            </button>
                          )}

                          {isAdRejected && !isResolved && (
                            <button
                              onClick={() => navigate('/meta')}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Review Ad</span>
                            </button>
                          )}

                          {isPageDisabled && !isResolved && (
                            <button
                              onClick={() => navigate('/meta')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <span>Review Page</span>
                            </button>
                          )}

                          {isDisconnected && !isResolved && (
                            <button
                              onClick={() => handleReconnectFacebook(alertItem)}
                              className="px-2.5 py-1 bg-[#0064e0] hover:bg-[#0052b8] text-white rounded text-[11px] font-semibold shadow-2xs transition-colors"
                            >
                              <span>Reconnect</span>
                            </button>
                          )}

                          {/* Secondary Triage Actions */}
                          {!isResolved && (
                            <>
                              {!isAcked && (
                                <button
                                  onClick={() => handleAcknowledge(alertItem.id)}
                                  disabled={actionLoadingId === alertItem.id}
                                  title="Acknowledge incident"
                                  className="px-2 py-1 bg-white hover:bg-[#f0f2f5] text-[#657383] hover:text-[#0a1317] border border-[#e4e6eb] rounded text-[11px] font-medium transition-colors"
                                >
                                  Ack
                                </button>
                              )}

                              <button
                                onClick={() => handleResolve(alertItem.id)}
                                disabled={actionLoadingId === alertItem.id}
                                title="Mark incident resolved"
                                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-[#e4e6eb] hover:border-emerald-200 rounded text-[11px] font-medium transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Minimalist Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-2.5 border-t border-[#e4e6eb] flex items-center justify-between bg-[#fafbfc] text-xs text-[#657383]">
            <span>
              Showing <strong>{(page - 1) * pageSize + 1}</strong> – <strong>{Math.min(page * pageSize, filteredAlerts.length)}</strong> of <strong>{filteredAlerts.length}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 bg-white border border-[#e4e6eb] rounded text-[11px] font-medium text-[#0a1317] hover:bg-[#f0f2f5] disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
              <span className="px-2 text-[11px] font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 bg-white border border-[#e4e6eb] rounded text-[11px] font-medium text-[#0a1317] hover:bg-[#f0f2f5] disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation & Notification Modals */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
