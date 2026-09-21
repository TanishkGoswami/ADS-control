import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, CheckCircle2, RefreshCw, Download } from 'lucide-react';
import { fetchReconciliationSnapshots, runReconciliationApi } from '../../lib/api';
import { formatINR } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';

export const ReconciliationPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReconciliationSnapshots();
      setSnapshots(data);
    } catch (err) {
      console.warn('Failed to load snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleRunReconciliation = async () => {
    setIsRunning(true);
    try {
      await runReconciliationApi();
      await loadSnapshots();
    } catch (err: any) {
      alert('Reconciliation error: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportReconciliation = () => {
    exportToCSV(
      snapshots.map((s: any) => ({
        Account: s.adAccount?.name || s.account || s.adAccountId,
        MetaReported: Number(s.metaReportedBalanceMinor || 0) / 100,
        Ledger1100: Number(s.ledgerBalanceMinor || 0) / 100,
        LotsAllocated: Number(s.allocatedLotsSumMinor || 0) / 100,
        Variance: Number(s.varianceMinor || 0) / 100,
        Status: s.status
      })),
      'three_way_reconciliation_report'
    );
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#0064e0]" />
            <span>Three-Way Truth Reconciliation</span>
          </h1>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Automated verification comparing Meta API Facts, Ledger Accounts, and Fund Lot Allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReconciliation}
            disabled={snapshots.length === 0}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Export reconciliation report to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRunReconciliation}
            disabled={isRunning}
            className="meta-btn-buy flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Reconciling...' : 'Run Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* Comparison Rules Card */}
      <div className="p-3 rounded-none bg-white border border-[#d9e0e8] grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] space-y-0.5">
          <div className="text-[9px] uppercase font-mono font-bold text-[#0064e0]">Truth 1</div>
          <h4 className="font-bold text-[#0a1317] text-xs">Meta API Truth</h4>
          <p className="text-[#64748b] text-[10px] leading-tight">
            Live balance reported directly from Meta Marketing Graph.
          </p>
        </div>

        <div className="p-2.5 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] space-y-0.5">
          <div className="text-[9px] uppercase font-mono font-bold text-[#1876f2]">Truth 2</div>
          <h4 className="font-bold text-[#0a1317] text-xs">Ledger Truth</h4>
          <p className="text-[#64748b] text-[10px] leading-tight">
            Double-entry posted journal balance in Prepayment accounts.
          </p>
        </div>

        <div className="p-2.5 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] space-y-0.5">
          <div className="text-[9px] uppercase font-mono font-bold text-emerald-700">Truth 3</div>
          <h4 className="font-bold text-[#0a1317] text-xs">Lot Allocation Truth</h4>
          <p className="text-[#64748b] text-[10px] leading-tight">
            Active beneficial fund lot ownership for Clients & Vendors.
          </p>
        </div>
      </div>

      {/* Reconciliation Snapshot Table */}
      <div className="bg-white rounded-none border border-[#d9e0e8] overflow-hidden">
        <div className="p-2.5 border-b border-[#d9e0e8] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#0a1317] uppercase font-mono">Live Ad Account Comparison</h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-800 border border-emerald-200">
            Audit Engine Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f6f7] text-[#64748b] border-b border-[#d9e0e8] uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2 px-2.5">Ad Account</th>
                <th className="py-2 px-2.5 text-right">Meta API</th>
                <th className="py-2 px-2.5 text-right">Ledger (1100)</th>
                <th className="py-2 px-2.5 text-right">Lots Sum</th>
                <th className="py-2 px-2.5 text-right">Variance</th>
                <th className="py-2 px-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9e0e8] text-[#0a1317] font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#64748b] font-mono">
                    Loading reconciliation snapshots...
                  </td>
                </tr>
              ) : snapshots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#64748b] font-mono">
                    No reconciliation snapshots generated yet. Click "Run Reconciliation" to calculate 3-way variance.
                  </td>
                </tr>
              ) : (
                snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f5f6f7] transition-colors">
                    <td className="py-2 px-2.5 font-sans font-bold text-[#0a1317]">
                      {s.adAccount?.name || 'Managed Account'}
                      <div className="text-[10px] text-[#64748b] font-mono font-normal">{s.adAccount?.metaAdAccountId || s.adAccountId}</div>
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold">{formatINR(s.metaReportedBalanceMinor)}</td>
                    <td className="py-2 px-2.5 text-right font-bold">{formatINR(s.ledgerBalanceMinor)}</td>
                    <td className="py-2 px-2.5 text-right font-bold">{formatINR(s.allocatedLotsSumMinor)}</td>
                    <td className={`py-2 px-2.5 text-right font-bold ${BigInt(s.varianceMinor) === 0n ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {formatINR(s.varianceMinor)}
                    </td>
                    <td className="py-2 px-2.5 text-center font-sans">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-none font-semibold border ${
                        s.status === 'MATCHED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {s.status === 'MATCHED' ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
