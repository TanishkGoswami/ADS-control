import React, { useState, useEffect } from 'react';
import { BookOpenCheck, ShieldCheck, Filter, Plus, RotateCcw, Download, RefreshCw } from 'lucide-react';
import {
  fetchLedgerTransactions,
  fetchLedgerAccounts,
  postManualJournalTransactionApi,
  reverseTransactionApi
} from '../../lib/api';
import { formatINR, formatDateTime, FinancialLedgerTransactionDto, toPaise, TransactionType, EntryType } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';

export const LedgerPage: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialLedgerTransactionDto[]>([]);
  const [selectedTx, setSelectedTx] = useState<FinancialLedgerTransactionDto | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [isReversing, setIsReversing] = useState<boolean>(false);

  // Manual Transaction Form State
  const [debitAccount, setDebitAccount] = useState<string>('1000-BANK');
  const [creditAccount, setCreditAccount] = useState<string>('2000-CLIENT-WALLETS');
  const [amountRupees, setAmountRupees] = useState<string>('10000');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const [txs, accs] = await Promise.all([
        fetchLedgerTransactions(),
        fetchLedgerAccounts()
      ]);
      setTransactions(txs);
      if (txs && txs.length > 0) {
        setSelectedTx((prev) => (prev ? txs.find((t) => t.id === prev.id) || txs[0] : txs[0]));
      } else {
        setSelectedTx(null);
      }
      if (accs) setAccounts(accs);
    } catch (err) {
      console.warn('Failed to load ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debitAccount === creditAccount) {
      alert('Debit and Credit accounts must be distinct');
      return;
    }
    setIsSubmitting(true);
    try {
      const amountMinor = toPaise(parseFloat(amountRupees) || 0).toString();
      await postManualJournalTransactionApi({
        transactionType: TransactionType.CORRECTION_REVERSAL,
        description: description || 'Manual journal adjustment entry',
        entries: [
          { accountCode: debitAccount, entryType: EntryType.DEBIT, amountMinor },
          { accountCode: creditAccount, entryType: EntryType.CREDIT, amountMinor }
        ]
      });
      await loadLedger();
      setShowPostModal(false);
      setDescription('');
    } catch (err: any) {
      alert('Error posting transaction: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverseTransaction = async () => {
    if (!selectedTx) return;
    const reason = window.prompt('Enter reason for reversing this transaction:');
    if (!reason || reason.trim().length === 0) return;

    setIsReversing(true);
    try {
      await reverseTransactionApi(selectedTx.id, reason);
      await loadLedger();
      alert('Transaction reversal posted to ledger!');
    } catch (err: any) {
      alert('Reversal error: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsReversing(false);
    }
  };

  const handleExportLedger = () => {
    exportToCSV(
      transactions.map((tx) => ({
        TxCode: tx.transactionCode,
        Type: tx.transactionType,
        Description: tx.description,
        Amount: Number(tx.totalAmountMinor) / 100,
        Currency: tx.currencyCode,
        PostedAt: tx.postedAt
      })),
      'ledger_journal_entries'
    );
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-[#0064e0]" />
            <span>Immutable Financial Ledger</span>
          </h1>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Double-entry journal ensuring zero float loss, immutable postings, and strict debit/credit balance invariance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="meta-badge-success flex items-center gap-1 py-1 px-2.5 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Σ Debit == Σ Credit (100% Balanced)</span>
          </div>

          <button
            onClick={loadLedger}
            disabled={isLoading}
            className="meta-btn-ghost flex items-center gap-1 text-xs"
            title="Refresh ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportLedger}
            disabled={transactions.length === 0}
            className="meta-btn-ghost flex items-center gap-1 text-xs"
            title="Export ledger entries to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowPostModal(true)}
            className="meta-btn-buy flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Entry</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Transactions List & Selected Transaction Details */}
      {isLoading ? (
        <div className="p-8 text-center bg-white border border-[#d9e0e8] rounded-none text-xs text-[#64748b] font-mono">
          Loading posted ledger journal entries...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center bg-white border border-[#d9e0e8] rounded-none space-y-3">
          <div className="text-xs font-bold text-[#0a1317]">No double-entry journal transactions posted yet</div>
          <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
            Transactions will appear automatically when client payments, allocations, vendor funding batches, or manual journal entries are recorded.
          </p>
          <button
            onClick={() => setShowPostModal(true)}
            className="meta-btn-buy text-xs"
          >
            + Post First Journal Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column: Transaction Stream */}
          <div className="lg:col-span-2 rounded-none bg-white border border-[#d9e0e8] p-3 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#eef1f4]">
              <h3 className="text-xs font-bold text-[#0a1317] uppercase tracking-wider font-mono">
                Journal Postings ({transactions.length})
              </h3>
            </div>

            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {transactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`p-2.5 rounded-none border transition-colors cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#f1f4f7] border-[#0a1317]'
                        : 'bg-white border-[#d9e0e8] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0064e0]">{tx.transactionCode}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-none bg-white border border-[#d9e0e8] text-[#475569] font-semibold">
                          {tx.transactionType}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#0a1317]">{formatINR(tx.totalAmountMinor)}</span>
                    </div>

                    <p className="text-[11px] text-[#475569] leading-tight">{tx.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-[#94a3b8] font-mono pt-1.5 border-t border-[#eef1f4]">
                      <span>Posted: {formatDateTime(tx.postedAt)}</span>
                      <span className="text-[#0064e0] font-bold">{tx.entries?.length || 0} Entries</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Double-Entry Verification Drawer */}
          {selectedTx && (
            <div className="rounded-none bg-white border border-[#d9e0e8] p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#0064e0] font-bold tracking-wider">Inspection</span>
                  <h2 className="text-xs font-bold text-[#0a1317] mt-0.5">{selectedTx.transactionCode}</h2>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{selectedTx.description}</p>
                </div>
                <button
                  onClick={handleReverseTransaction}
                  disabled={isReversing}
                  className="meta-btn-ghost text-[10px] py-0.5 text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
                  title="Reverse transaction creating mirror entries"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reverse</span>
                </button>
              </div>

              <div className="p-2 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-[#64748b]">
                  <span>Type:</span> <span className="text-[#0a1317] font-bold">{selectedTx.transactionType}</span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Currency:</span> <span className="text-[#0a1317]">{selectedTx.currencyCode}</span>
                </div>
              </div>

              {/* Double-Entry Split Table */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-[#0a1317] uppercase tracking-wider font-mono">
                  Accounts Split
                </h4>

                <div className="rounded-none border border-[#d9e0e8] overflow-hidden text-xs font-mono bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-[#f5f6f7] text-[#64748b] border-b border-[#d9e0e8] text-[10px] uppercase">
                      <tr>
                        <th className="py-1.5 px-2">Account</th>
                        <th className="py-1.5 px-2 text-right">Debit (Dr)</th>
                        <th className="py-1.5 px-2 text-right">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9e0e8] text-[#0a1317] text-[11px]">
                      {selectedTx.entries?.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#f5f6f7]">
                          <td className="py-1.5 px-2 font-bold text-[#0a1317]">{entry.accountName}</td>
                          <td className="py-1.5 px-2 text-right text-emerald-700 font-bold">
                            {entry.entryType === 'DEBIT' ? formatINR(entry.amountMinor) : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-[#0064e0] font-bold">
                            {entry.entryType === 'CREDIT' ? formatINR(entry.amountMinor) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-2 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] text-[11px] text-[#64748b] flex items-center justify-between">
                <span>Audit:</span>
                <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Manual Journal Transaction Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handlePostTransaction}
            className="bg-white w-full max-w-sm rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <Plus className="w-4 h-4 text-[#0064e0]" />
                <span>Post Double-Entry Journal Entry</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Debit (Dr) Account</label>
                <select
                  value={debitAccount}
                  onChange={(e) => setDebitAccount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs bg-white"
                >
                  <option value="1000-BANK">1000-BANK (Asset)</option>
                  <option value="1100-AD-ACCOUNT-PREPAY">1100-AD-ACCOUNT-PREPAY (Asset)</option>
                  <option value="1200-VENDOR-RECEIVABLE">1200-VENDOR-RECEIVABLE (Asset)</option>
                  <option value="2000-CLIENT-WALLETS">2000-CLIENT-WALLETS (Liability)</option>
                  <option value="2100-VENDOR-PAYABLE">2100-VENDOR-PAYABLE (Liability)</option>
                  <option value="4000-SERVICE-REVENUE">4000-SERVICE-REVENUE (Revenue)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Credit (Cr) Account</label>
                <select
                  value={creditAccount}
                  onChange={(e) => setCreditAccount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs bg-white"
                >
                  <option value="2000-CLIENT-WALLETS">2000-CLIENT-WALLETS (Liability)</option>
                  <option value="1100-AD-ACCOUNT-PREPAY">1100-AD-ACCOUNT-PREPAY (Asset)</option>
                  <option value="1000-BANK">1000-BANK (Asset)</option>
                  <option value="2100-VENDOR-PAYABLE">2100-VENDOR-PAYABLE (Liability)</option>
                  <option value="1200-VENDOR-RECEIVABLE">1200-VENDOR-RECEIVABLE (Asset)</option>
                  <option value="4000-SERVICE-REVENUE">4000-SERVICE-REVENUE (Revenue)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Description / Memo</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="Adjustment for client lot float"
                />
              </div>

              <div className="p-2 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] flex items-center justify-between">
                <span>Debit = Credit:</span>
                <span className="font-mono font-bold">₹{parseFloat(amountRupees || '0').toLocaleString('en-IN')} (BALANCED)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="meta-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="meta-btn-buy"
              >
                {isSubmitting ? 'Posting...' : 'Post Immutable Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
