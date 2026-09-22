import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Search,
  Filter,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { fetchReconciliationSnapshots, runReconciliationApi } from '../../lib/api';
import { formatINR } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';
import { InfoTooltip } from '../../components/InfoTooltip';
import { NotificationModal } from '../../components/ModalDialog';

export const ReconciliationPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISCREPANCY' | 'MATCHED'>('ALL');

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

  // Queries (React Query Cached)
  const {
    data: snapshots = [],
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['reconciliation-snapshots'],
    queryFn: () => fetchReconciliationSnapshots(),
    staleTime: 1000 * 60 * 3
  });

  // Mutations
  const reconcileMutation = useMutation({
    mutationFn: runReconciliationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['meta-accounts-all'] });
      setNotification({
        isOpen: true,
        title: 'Reconciliation Completed',
        message: 'Three-way truth audit completed across all active Meta ad accounts.',
        type: 'success'
      });
    },
    onError: (err: any) => {
      setNotification({
        isOpen: true,
        title: 'Reconciliation Failed',
        message: err?.response?.data?.message || err.message || 'Error running 3-way reconciliation audit',
        type: 'error'
      });
    }
  });

  // Filtered Snapshots
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s: any) => {
      const accountName = (s.adAccount?.name || s.adAccountId || '').toLowerCase();
      const metaId = (s.adAccount?.metaAdAccountId || '').toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        accountName.includes(searchQuery.toLowerCase()) ||
        metaId.includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [snapshots, searchQuery, statusFilter]);

  // Statistics
  const matchedCount = snapshots.filter((s: any) => s.status === 'MATCHED').length;
  const discrepancyCount = snapshots.filter((s: any) => s.status === 'DISCREPANCY').length;
  const totalVarianceMinor = snapshots.reduce(
    (acc: bigint, s: any) => acc + (BigInt(s.varianceMinor || 0) < 0n ? -BigInt(s.varianceMinor || 0) : BigInt(s.varianceMinor || 0)),
    0n
  );

  const handleExportReconciliation = () => {
    exportToCSV(
      filteredSnapshots.map((s: any) => ({
        AccountName: s.adAccount?.name || s.adAccountId,
        MetaAdAccountId: s.adAccount?.metaAdAccountId || '',
        MetaReported: Number(s.metaReportedBalanceMinor || 0) / 100,
        LedgerBalance: Number(s.ledgerBalanceMinor || 0) / 100,
        LotsAllocated: Number(s.allocatedLotsSumMinor || 0) / 100,
        Variance: Number(s.varianceMinor || 0) / 100,
        Status: s.status
      })),
      'three_way_reconciliation_report'
    );
  };

  return (
    <div className="space-y-4 pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0064e0]" />
              <span>Three-Way Truth Reconciliation</span>
            </h1>
            <InfoTooltip
              title="Three-Way Truth Reconciliation"
              text="Cross-verifies Meta API live balance against the Double-Entry Ledger (Account 1100) and Active Client Fund Lots."
              hinglishHelp="Yeh 3-way check karta hai: Meta Graph API ka real balance, Ledger ka balance, aur client funds. Agar koi bina allocation ke direct card spend hua hai toh discrepancy dikhata hai."
              side="bottom"
            />
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Automated verification comparing Meta API Facts, Ledger Prepayment Accounts, and Client Fund Lot Allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportReconciliation}
            disabled={filteredSnapshots.length === 0}
            className="px-2.5 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-medium text-[#0a1317] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Export reconciliation report to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            className="px-3 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconcileMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{reconcileMutation.isPending ? 'Reconciling...' : 'Run Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* 3 Truth Explanation Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#e4e6eb] shadow-sm space-y-1 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#0064e0] uppercase tracking-wider">
              Truth Pillar 1
            </span>
            <InfoTooltip
              title="Meta API Truth"
              text="Live balance pulled straight from Meta Marketing Graph API."
              hinglishHelp="Meta ke servers par abhi live kitna balance dikh raha hai."
              side="left"
            />
          </div>
          <h4 className="font-bold text-xs text-[#0a1317]">Meta API Truth</h4>
          <p className="text-[11px] text-[#657383] leading-relaxed">
            Live balance reported directly from Facebook / Meta Marketing Graph.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#e4e6eb] shadow-sm space-y-1 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#1876f2] uppercase tracking-wider">
              Truth Pillar 2
            </span>
            <InfoTooltip
              title="Ledger Truth"
              text="The balance recorded in Account 1100-META-PREPAYMENT via double-entry journal postings."
              hinglishHelp="Humare internal accounting ledger me is account ka posted balance kitna hai."
              side="left"
            />
          </div>
          <h4 className="font-bold text-xs text-[#0a1317]">Ledger Truth (1100)</h4>
          <p className="text-[11px] text-[#657383] leading-relaxed">
            Double-entry posted journal balance in Prepayment accounts.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#e4e6eb] shadow-sm space-y-1 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
              Truth Pillar 3
            </span>
            <InfoTooltip
              title="Lot Allocation Truth"
              text="Beneficial ownership breakdown of money assigned to this ad account from client wallets."
              hinglishHelp="Clients ke wallet se is ad account par kitna active budget allocate hua hai."
              side="left"
            />
          </div>
          <h4 className="font-bold text-xs text-[#0a1317]">Lot Allocation Truth</h4>
          <p className="text-[11px] text-[#657383] leading-relaxed">
            Active beneficial fund lot ownership assigned for Clients & Vendors.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#657383]">
              Accounts Audited
            </span>
            <div className="text-base font-bold text-[#0a1317] mt-0.5">{snapshots.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0064e0] flex items-center justify-center font-bold text-xs">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              100% Matched
            </span>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{matchedCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Discrepancies
            </span>
            <div className="text-base font-bold text-amber-700 mt-0.5">{discrepancyCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#657383]">
              Total Variance
            </span>
            <div className="text-base font-bold font-mono text-[#0a1317] mt-0.5">
              {formatINR(totalVarianceMinor)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center font-bold text-xs">
            <Scale className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-[#e4e6eb] bg-[#fafbfc] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search ad account name or Meta ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e4e6eb] rounded-lg text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-white border border-[#e4e6eb] rounded-lg p-0.5 text-xs font-medium">
              {(['ALL', 'DISCREPANCY', 'MATCHED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-[#0064e0] text-white font-semibold shadow-xs'
                      : 'text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5]'
                  }`}
                >
                  {status === 'ALL'
                    ? 'All Accounts'
                    : status === 'DISCREPANCY'
                    ? 'Discrepancies'
                    : 'Matched'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#657383] font-semibold text-[11px] uppercase tracking-wider border-b border-[#e4e6eb]">
              <tr>
                <th className="px-4 py-3">Ad Account</th>
                <th className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    Meta API Truth
                    <InfoTooltip
                      title="Meta Reported Balance"
                      text="Live balance from Meta Graph API."
                      hinglishHelp="Meta par abhi kitna balance hai."
                      side="top"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    Ledger (1100)
                    <InfoTooltip
                      title="Ledger 1100 Prepayment"
                      text="Amount recorded in accounting ledger."
                      hinglishHelp="Ledger me kitna record hai."
                      side="top"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    Lots Sum
                    <InfoTooltip
                      title="Active Lots Sum"
                      text="Total amount allocated from client wallets to this account."
                      hinglishHelp="Client wallet se allocate hua total amount."
                      side="top"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    Variance
                    <InfoTooltip
                      title="Calculated Variance"
                      text="Difference between Meta Balance and Allocated Lots."
                      hinglishHelp="Difference: Meta Balance minus Allocated Lots."
                      side="top"
                    />
                  </span>
                </th>
                <th className="px-4 py-3 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#657383]">
                    <div className="w-6 h-6 border-2 border-[#0064e0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading reconciliation snapshots...
                  </td>
                </tr>
              ) : filteredSnapshots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#657383]">
                    No reconciliation records found. Click "Run Reconciliation" to audit all accounts.
                  </td>
                </tr>
              ) : (
                filteredSnapshots.map((s: any) => {
                  const isMatched = s.status === 'MATCHED';
                  return (
                    <tr key={s.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#0a1317]">
                          {s.adAccount?.name || 'Managed Ad Account'}
                        </div>
                        <div className="text-[11px] text-[#657383] font-mono">
                          {s.adAccount?.metaAdAccountId || s.adAccountId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#0a1317]">
                        {formatINR(s.metaReportedBalanceMinor)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#0a1317]">
                        {formatINR(s.ledgerBalanceMinor)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#0a1317]">
                        {formatINR(s.allocatedLotsSumMinor)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          isMatched ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {formatINR(s.varianceMinor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                            isMatched
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : 'bg-amber-50 text-amber-700 border-amber-200/60'
                          }`}
                        >
                          {isMatched ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{s.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Modal */}
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
