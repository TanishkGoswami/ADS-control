import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Filter,
  Sparkles,
  Layers,
  FileWarning,
  Radio
} from 'lucide-react';
import { AlertDto, formatDateTime } from '@ads-control/shared';
import { acknowledgeAlertApi } from '../../lib/api';

interface LiveAlertQueueProps {
  alerts: AlertDto[];
  title?: string;
  isFinanceView?: boolean;
}

/**
 * Computes human-friendly relative time and exact timestamp
 */
function getAlertTiming(dateInput?: string | Date | null) {
  if (!dateInput) return { relative: 'Recently', exact: '—' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { relative: 'Recently', exact: '—' };

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  let relative = 'Just now';
  if (diffSec >= 60 && diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relative = `${mins}m ago`;
  } else if (diffSec >= 3600 && diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    relative = `${hours}h ago`;
  } else if (diffSec >= 86400 && diffSec < 172800) {
    relative = 'Yesterday';
  } else if (diffSec >= 172800) {
    const days = Math.floor(diffSec / 86400);
    if (days < 30) {
      relative = `${days}d ago`;
    } else {
      relative = formatDateTime(d, { includeSeconds: false });
    }
  }

  const exact = formatDateTime(d, { includeTime: true, includeSeconds: false });
  return { relative, exact };
}

/**
 * Parses alert data into high-signal, clean, human-readable components
 */
function parseAlertDetails(alert: AlertDto) {
  const meta = (alert.metadataJson as any) || {};
  let accountName = '';
  let issueLabel = '';
  let isCritical = alert.severity === 'CRITICAL';
  let amountBadge = '';
  let badgeColor = '';
  let iconType: 'RESTRICTED' | 'LOW_BALANCE' | 'AD_REJECTED' | 'PAGE' | 'OTHER' = 'OTHER';

  if (alert.alertType === 'RESTRICTED_ACCOUNT_WITH_FUNDS') {
    issueLabel = 'Restricted Account';
    accountName = alert.title.replace(/^Restricted Account with Stuck Balance:\s*/i, '');
    if (meta.balanceINR) amountBadge = `₹${meta.balanceINR} Stuck`;
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    iconType = 'RESTRICTED';
    isCritical = true;
  } else if (alert.alertType === 'LOW_BALANCE') {
    issueLabel = 'Low Balance (< ₹500)';
    // Strip trailing parenthesis like "(₹136.23)" if present
    accountName = alert.title
      .replace(/^Low Balance Warning:\s*/i, '')
      .replace(/\s*\([^)]*\)$/, '');
    if (meta.balanceINR) amountBadge = `₹${meta.balanceINR} Left`;
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    iconType = 'LOW_BALANCE';
  } else if (alert.alertType === 'AD_DISAPPROVED') {
    issueLabel = 'Ad Rejected';
    accountName = meta.campaignName || alert.title.replace(/^Ad\/Campaign Rejected:\s*/i, '');
    badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
    iconType = 'AD_REJECTED';
    isCritical = true;
  } else if (alert.alertType === 'PAGE_DISABLED') {
    issueLabel = 'Page Disabled';
    accountName = meta.pageName || alert.title.replace(/^Facebook Page Disabled\/Unpublished:\s*/i, '');
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    iconType = 'PAGE';
    isCritical = true;
  } else if (alert.alertType === 'META_CONNECTION_DISCONNECTED') {
    issueLabel = 'FB Disconnected';
    accountName = meta.internalName || alert.title.replace(/^Facebook Profile Disconnected:\s*/i, '');
    badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  } else {
    issueLabel = alert.alertType.replace(/_/g, ' ');
    accountName = alert.title;
    badgeColor = isCritical ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200';
  }

  const accountId = meta.metaAdAccountId || meta.adAccountId || (alert.entityType === 'AD_ACCOUNT' ? alert.entityId : '');
  const portfolio = meta.portfolioName || '';

  return {
    accountName: accountName || 'Meta Asset',
    accountId,
    portfolio,
    issueLabel,
    amountBadge,
    badgeColor,
    isCritical,
    iconType
  };
}

export const LiveAlertQueue: React.FC<LiveAlertQueueProps> = ({
  alerts = [],
  title = 'Live Alert Queue',
  isFinanceView = false
}) => {
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState<string>('ACTIVE_ALL');
  const [expandedAlertIds, setExpandedAlertIds] = useState<Record<string, boolean>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Groupings and Counts
  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'OPEN'), [alerts]);
  const reviewedAlerts = useMemo(
    () => alerts.filter((a) => a.status === 'ACKNOWLEDGED' || a.status === 'RESOLVED'),
    [alerts]
  );
  const activeRestrictedCount = useMemo(
    () => activeAlerts.filter((a) => a.alertType === 'RESTRICTED_ACCOUNT_WITH_FUNDS').length,
    [activeAlerts]
  );
  const activeLowBalanceCount = useMemo(
    () => activeAlerts.filter((a) => a.alertType === 'LOW_BALANCE').length,
    [activeAlerts]
  );

  // Chronological sorting: newest first
  const filteredSortedAlerts = useMemo(() => {
    let list: AlertDto[] = [];
    if (filterMode === 'ACTIVE_ALL') {
      list = [...activeAlerts];
    } else if (filterMode === 'RESTRICTED') {
      list = activeAlerts.filter((a) => a.alertType === 'RESTRICTED_ACCOUNT_WITH_FUNDS');
    } else if (filterMode === 'LOW_BALANCE') {
      list = activeAlerts.filter((a) => a.alertType === 'LOW_BALANCE');
    } else if (filterMode === 'REVIEWED') {
      list = [...reviewedAlerts];
    } else {
      list = [...alerts];
    }

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [alerts, activeAlerts, reviewedAlerts, filterMode]);

  // Toggle accordion expand/collapse
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAlertIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Acknowledge single alert (Tick action)
  const handleAcknowledgeAlert = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessingId(id);

    // Optimistic UI update
    queryClient.setQueryData<AlertDto[]>(['dashboard-alerts'], (old = []) =>
      old.map((item) =>
        item.id === id ? { ...item, status: 'ACKNOWLEDGED' as any } : item
      )
    );

    try {
      await acknowledgeAlertApi(id);
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk acknowledge all visible or active alerts
  const handleAcknowledgeAll = async () => {
    if (activeAlerts.length === 0) return;
    setIsBulkProcessing(true);

    queryClient.setQueryData<AlertDto[]>(['dashboard-alerts'], (old = []) =>
      old.map((item) =>
        item.status === 'OPEN' ? { ...item, status: 'ACKNOWLEDGED' as any } : item
      )
    );

    try {
      await Promise.all(activeAlerts.map((a) => acknowledgeAlertApi(a.id)));
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    } catch (err) {
      console.error('Failed to bulk acknowledge alerts:', err);
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="meta-card overflow-hidden flex flex-col h-full bg-white border border-[#d7dce2] rounded-lg shadow-xs">
      {/* Sleek Minimalist Header */}
      <div className="px-3 py-2.5 border-b border-[#e4e7eb] bg-[#f8fafc] flex items-center justify-between gap-2">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-3 h-3" />
          </div>
          <h2 className="text-xs font-bold text-[#1c1e21] tracking-tight">
            {title}
          </h2>
          <span
            className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full border ${
              activeAlerts.length > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {activeAlerts.length}
          </span>
        </div>

        {/* Right: Clean Filter Dropdown & Mark All Action */}
        <div className="flex items-center gap-2">
          {/* Dropdown Selector */}
          <div className="relative">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="h-7 pl-2 pr-6 text-[11px] font-semibold text-[#1c1e21] bg-white border border-[#d7dce2] rounded-[4px] shadow-2xs hover:border-[#b4bcc8] focus:outline-none focus:ring-1 focus:ring-[#0064e0] cursor-pointer appearance-none"
            >
              <option value="ACTIVE_ALL">Active Issues ({activeAlerts.length})</option>
              {activeRestrictedCount > 0 && (
                <option value="RESTRICTED">Restricted Accounts ({activeRestrictedCount})</option>
              )}
              {activeLowBalanceCount > 0 && (
                <option value="LOW_BALANCE">Low Balance ({activeLowBalanceCount})</option>
              )}
              <option value="REVIEWED">Reviewed ({reviewedAlerts.length})</option>
              <option value="ALL">All ({alerts.length})</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#5d6c7b] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mark All Reviewed (Tick) */}
          {activeAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              disabled={isBulkProcessing}
              className="h-7 px-2 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-[#d7dce2] hover:border-emerald-300 rounded-[4px] text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Mark all open alerts as reviewed (maine dekh liya)"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {isBulkProcessing ? 'Marking...' : 'Mark All'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Alert List Items */}
      <div className="p-2 divide-y divide-[#f0f2f5] flex-1 overflow-y-auto max-h-[500px]">
        {filteredSortedAlerts.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-2">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-[#1c1e21]">
              {filterMode === 'REVIEWED'
                ? 'No reviewed alerts yet'
                : 'All Clear — No active issues'}
            </div>
            <p className="text-[11px] text-[#5d6c7b] max-w-xs mx-auto">
              {filterMode === 'REVIEWED'
                ? 'Alerts you acknowledge with the tick button will be recorded here.'
                : 'No restricted accounts or balance warnings require attention right now.'}
            </p>
          </div>
        ) : (
          filteredSortedAlerts.map((al) => {
            const parsed = parseAlertDetails(al);
            const isAcknowledged = al.status === 'ACKNOWLEDGED' || al.status === 'RESOLVED';
            const timing = getAlertTiming(al.createdAt || al.updatedAt);
            const isExpanded = !!expandedAlertIds[al.id];

            return (
              <div
                key={al.id}
                className={`py-2 px-2.5 rounded-[5px] transition-all my-1 border ${
                  parsed.isCritical
                    ? 'border-l-[3px] border-l-rose-500 border-rose-100 bg-rose-50/20 hover:bg-rose-50/40'
                    : 'border-l-[3px] border-l-amber-500 border-amber-100 bg-amber-50/20 hover:bg-amber-50/40'
                } ${isAcknowledged ? 'opacity-70 bg-slate-50/70 border-l-slate-400' : ''}`}
              >
                {/* Main Compact Row */}
                <div className="flex items-center justify-between gap-2.5">
                  {/* Left: Icon + Account Name + Problem summary */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Line 1: Account Name & Portfolio Tag */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#1c1e21] truncate max-w-[180px] sm:max-w-xs">
                        {parsed.accountName}
                      </span>
                      {parsed.portfolio && (
                        <span className="text-[10px] font-medium text-[#5d6c7b] bg-white border border-[#d7dce2] px-1.5 py-0.2 rounded shadow-2xs">
                          {parsed.portfolio}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Issue Badge + Amount Pill */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10.5px]">
                      <span
                        className={`font-semibold px-1.5 py-0.2 rounded border text-[9.5px] ${parsed.badgeColor}`}
                      >
                        {parsed.issueLabel}
                      </span>

                      {parsed.amountBadge && (
                        <span
                          className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            parsed.isCritical
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {parsed.amountBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Time + Tick Button + Expand Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {/* Relative Time Badge */}
                    <span
                      className="text-[10px] font-mono text-[#5d6c7b] bg-white border border-[#d7dce2] px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap"
                      title={`Detected / Occurred: ${timing.exact}`}
                    >
                      {timing.relative}
                    </span>

                    {/* 1-Click Tick Button */}
                    {!isAcknowledged ? (
                      <button
                        type="button"
                        onClick={(e) => handleAcknowledgeAlert(al.id, e)}
                        disabled={processingId === al.id}
                        className="w-7 h-7 bg-white hover:bg-emerald-600 text-emerald-600 hover:text-white border border-[#d7dce2] hover:border-emerald-600 rounded flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                        title="Tick (Maine dekh liya) — Active queue se hatao"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    ) : (
                      <span
                        className="w-7 h-7 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded flex items-center justify-center"
                        title="Reviewed and acknowledged"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    )}

                    {/* Accordion / Dropdown Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(al.id, e)}
                      className="p-1 text-[#8a94a1] hover:text-[#1c1e21] hover:bg-white rounded transition-colors cursor-pointer"
                      title={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Dropdown / Collapsible Details (Only shown when expanded) */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-[#e4e7eb] text-xs space-y-2 bg-white/70 p-2 rounded">
                    {parsed.accountId && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-[#5d6c7b] font-medium">Meta Ad Account ID:</span>
                        <span className="font-mono text-[10.5px] font-semibold bg-white border border-[#d7dce2] px-1.5 py-0.2 rounded text-[#1c1e21] select-all">
                          {parsed.accountId}
                        </span>
                      </div>
                    )}
                    <p className="text-[#475569] text-[11px] leading-relaxed">
                      {al.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e4e7eb]/60">
                      <span className="text-[10px] font-mono text-[#8a94a1]">
                        Detected: {timing.exact}
                      </span>

                      <div className="flex items-center gap-2">
                        <NavLink
                          to={isFinanceView ? '/reconciliation' : '/meta'}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0064e0] hover:underline"
                        >
                          <span>{isFinanceView ? 'Reconciliation' : 'Open Account in Meta'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </NavLink>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer minimal info */}
      <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-[#e4e7eb] flex items-center justify-between text-[10px] text-[#5d6c7b]">
        <span className="font-mono">Chronological (Newest first)</span>
        <NavLink
          to="/alerts"
          className="text-[#0064e0] font-semibold hover:underline flex items-center gap-0.5"
        >
          <span>Alerts Hub</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </NavLink>
      </div>
    </div>
  );
};
