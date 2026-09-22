import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpenCheck,
  ShieldCheck,
  Filter,
  Plus,
  RotateCcw,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Info
} from 'lucide-react';
import {
  fetchLedgerTransactions,
  fetchLedgerAccounts,
  postManualJournalTransactionApi,
  reverseTransactionApi
} from '../../lib/api';
import {
  formatINR,
  formatDateTime,
  FinancialLedgerTransactionDto,
  toPaise,
  TransactionType,
  EntryType
} from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';
import { InfoTooltip } from '../../components/InfoTooltip';
import { ConfirmDialog, NotificationModal } from '../../components/ModalDialog';

export const LedgerPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [reverseModalState, setReverseModalState] = useState<{
    isOpen: boolean;
    tx: FinancialLedgerTransactionDto | null;
    reason: string;
  }>({
    isOpen: false,
    tx: null,
    reason: ''
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

  // Manual Transaction Form State
  const [debitAccount, setDebitAccount] = useState<string>('1000-BANK');
  const [creditAccount, setCreditAccount] = useState<string>('2000-CLIENT-WALLETS');
  const [amountRupees, setAmountRupees] = useState<string>('10000');
  const [description, setDescription] = useState<string>('');
  const [postError, setPostError] = useState<string>('');

  // Queries (Cached with React Query for instant tab switching)
  const {
    data: transactions = [],
    isLoading: isTxLoading,
    isFetching: isTxFetching,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['ledger-transactions'],
    queryFn: () => fetchLedgerTransactions(),
    staleTime: 1000 * 60 * 3
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: () => fetchLedgerAccounts(),
    staleTime: 1000 * 60 * 10
  });

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        tx.transactionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.transactionType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'ALL' || tx.transactionType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, typeFilter]);

  // Selected Transaction
  const selectedTx = useMemo(() => {
    if (!transactions.length) return null;
    if (selectedTxId) {
      return transactions.find((t) => t.id === selectedTxId) || transactions[0];
    }
    return transactions[0];
  }, [transactions, selectedTxId]);

  // Mutations
  const postMutation = useMutation({
    mutationFn: postManualJournalTransactionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] });
      setShowPostModal(false);
      setDescription('');
      setPostError('');
      setNotification({
        isOpen: true,
        title: 'Entry Posted',
        message: 'Double-entry journal entry successfully recorded into the immutable ledger.',
        type: 'success'
      });
    },
    onError: (err: any) => {
      setPostError(err?.response?.data?.message || err.message || 'Error posting journal entry');
    }
  });

  const reverseMutation = useMutation({
    mutationFn: ({ txId, reason }: { txId: string; reason: string }) =>
      reverseTransactionApi(txId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] });
      setReverseModalState({ isOpen: false, tx: null, reason: '' });
      setNotification({
        isOpen: true,
        title: 'Transaction Reversed',
        message: 'Mirror correction entries have been posted to the ledger.',
        type: 'success'
      });
    },
    onError: (err: any) => {
      setNotification({
        isOpen: true,
        title: 'Reversal Failed',
        message: err?.response?.data?.message || err.message || 'Could not reverse transaction',
        type: 'error'
      });
    }
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debitAccount === creditAccount) {
      setPostError('Debit and Credit accounts must be distinct.');
      return;
    }
    const amt = parseFloat(amountRupees);
    if (!amt || amt <= 0) {
      setPostError('Please enter a valid positive amount.');
      return;
    }
    const amountMinor = toPaise(amt).toString();
    postMutation.mutate({
      transactionType: TransactionType.CORRECTION_REVERSAL,
      description: description || 'Manual journal adjustment entry',
      entries: [
        { accountCode: debitAccount, entryType: EntryType.DEBIT, amountMinor },
        { accountCode: creditAccount, entryType: EntryType.CREDIT, amountMinor }
      ]
    });
  };

  const handleExportLedger = () => {
    exportToCSV(
      filteredTransactions.map((tx) => ({
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

  const uniqueTypes = useMemo(() => {
    const set = new Set(transactions.map((t) => t.transactionType));
    return ['ALL', ...Array.from(set)];
  }, [transactions]);

  return (
    <div className="space-y-3 pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-[#0064e0]" />
              <span>Immutable Financial Ledger</span>
            </h1>
            <InfoTooltip
              title="Double-Entry Financial Ledger"
              text="An append-only double-entry financial ledger guaranteeing zero float loss and mathematical balance invariance."
              hinglishHelp="Yeh humara main financial ledger hai. Yahan har payment aur allocation ka record debit aur credit me 100% match hota hai taaki koi rupee miss na ho."
              side="bottom"
            />
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Strict double-entry journal ensuring zero float loss, immutable postings, and exact debit/credit invariance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Σ Debit == Σ Credit (100% Balanced)</span>
            <InfoTooltip
              title="Balance Invariant"
              text="Every single journal entry has equal Debit and Credit values. Unbalanced transactions are rejected automatically by the database."
              hinglishHelp="Koi bhi transaction tabhi post hota hai jab total Debit aur Credit bilkul barabar ho."
              side="bottom"
            />
          </div>

          <button
            onClick={() => refetchTransactions()}
            disabled={isTxFetching}
            className="px-2.5 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-medium text-[#0a1317] transition-colors flex items-center gap-1.5 shadow-xs"
            title="Refresh ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748b] ${isTxFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportLedger}
            disabled={filteredTransactions.length === 0}
            className="px-2.5 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-medium text-[#0a1317] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Export ledger entries to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setPostError('');
              setShowPostModal(true);
            }}
            className="px-3 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Entry</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left 2 Cols: Search, Filters & Transaction Stream */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e4e6eb] shadow-sm flex flex-col overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-3 border-b border-[#e4e6eb] bg-[#fafbfc] flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search Tx code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e4e6eb] rounded-lg text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-[#8595a4] shrink-0" />
              <div className="flex items-center gap-1">
                {uniqueTypes.slice(0, 4).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                      typeFilter === type
                        ? 'bg-[#0064e0] text-white font-semibold shadow-xs'
                        : 'text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5]'
                    }`}
                  >
                    {type === 'ALL'
                      ? 'All Types'
                      : type === 'CLIENT_PAYMENT'
                      ? 'Client Payments'
                      : type === 'CLIENT_CAMPAIGN_ALLOCATION'
                      ? 'Allocations'
                      : type === 'VENDOR_FUNDING_RECEIPT'
                      ? 'Vendor Funding'
                      : type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Stream Body */}
          <div className="p-3 flex-1 overflow-y-auto max-h-[560px] space-y-2">
            {isTxLoading ? (
              <div className="p-12 text-center text-xs text-[#657383]">
                <div className="w-6 h-6 border-2 border-[#0064e0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading double-entry journal stream...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#657383]">
                No journal transactions matched your filter.
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                const isReversal = tx.transactionType === TransactionType.CORRECTION_REVERSAL;

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/50 border-[#0064e0] shadow-xs'
                        : 'bg-white border-[#e4e6eb] hover:border-[#cbd5e1] hover:bg-[#fafbfc]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-bold text-[#0064e0] truncate">
                          {tx.transactionCode}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border shrink-0 ${
                            isReversal
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : tx.transactionType === 'CLIENT_PAYMENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : tx.transactionType === 'CLIENT_CAMPAIGN_ALLOCATION'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-[#f0f2f5] text-[#475569] border-[#e4e6eb]'
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#0a1317] shrink-0">
                        {formatINR(tx.totalAmountMinor)}
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] leading-snug line-clamp-2">
                      {tx.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#8595a4] font-mono pt-1.5 border-t border-[#f0f2f5]">
                      <span>Posted: {formatDateTime(tx.postedAt)}</span>
                      <span className="text-[#0064e0] font-semibold">
                        {tx.entries?.length || 0} Account Entries
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Transaction Inspection & Verification Drawer */}
        <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm p-4 space-y-3.5">
          {selectedTx ? (
            <>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#e4e6eb]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#0064e0] font-bold tracking-wider">
                      Audit Inspection
                    </span>
                    <InfoTooltip
                      title="Inspection Details"
                      text="Breakdown of the debits and credits posted for this specific transaction."
                      hinglishHelp="Is box me aap is transaction ke debit aur credit accounts ka exact split dekh sakte hain."
                      side="left"
                    />
                  </div>
                  <h2 className="text-xs font-bold font-mono text-[#0a1317] mt-0.5">
                    {selectedTx.transactionCode}
                  </h2>
                  <p className="text-xs text-[#64748b] mt-0.5 leading-snug">
                    {selectedTx.description}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setReverseModalState({
                      isOpen: true,
                      tx: selectedTx,
                      reason: ''
                    })
                  }
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                  title="Reverse transaction creating mirror entries"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reverse</span>
                </button>
              </div>

              {/* Meta Info Box */}
              <div className="p-2.5 rounded-lg bg-[#fafbfc] border border-[#e4e6eb] space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#64748b]">
                  <span>Type:</span>
                  <span className="text-[#0a1317] font-bold">{selectedTx.transactionType}</span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Currency:</span>
                  <span className="text-[#0a1317] font-semibold">{selectedTx.currencyCode}</span>
                </div>
                <div className="flex justify-between text-[#64748b]">
                  <span>Timestamp:</span>
                  <span className="text-[#0a1317]">{formatDateTime(selectedTx.postedAt)}</span>
                </div>
              </div>

              {/* Accounts Split Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0a1317]">Accounts Split</h3>
                  <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                </div>

                <div className="overflow-hidden border border-[#e4e6eb] rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#f8fafc] text-[#64748b] text-[10px] uppercase font-semibold border-b border-[#e4e6eb]">
                      <tr>
                        <th className="px-2.5 py-2">Account</th>
                        <th className="px-2.5 py-2 text-right">Debit (Dr)</th>
                        <th className="px-2.5 py-2 text-right">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f2f5] font-mono text-xs">
                      {selectedTx.entries?.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#fafbfc]">
                          <td className="px-2.5 py-2 font-semibold text-[#0a1317]">
                            <div>{entry.account?.accountCode || entry.accountId}</div>
                            <div className="text-[10px] text-[#8595a4] font-normal font-sans">
                              {entry.account?.name}
                            </div>
                          </td>
                          <td className="px-2.5 py-2 text-right text-emerald-700 font-bold">
                            {entry.entryType === 'DEBIT' ? formatINR(entry.amountMinor) : '—'}
                          </td>
                          <td className="px-2.5 py-2 text-right text-blue-700 font-bold">
                            {entry.entryType === 'CREDIT' ? formatINR(entry.amountMinor) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#8595a4]">
              Select a journal entry from the left list to inspect its double-entry postings.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Post Manual Entry */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0064e0]" />
                <h3 className="text-sm font-semibold text-[#0a1317]">Post Manual Journal Entry</h3>
              </div>
              <InfoTooltip
                title="Manual Journal Entry"
                text="Post a manual correction or adjustment between two financial accounts."
                hinglishHelp="Agar koi account correction ya bank adjustment manual record karna ho toh yahan se entry post karein."
                side="bottom"
              />
            </div>

            <form onSubmit={handlePostSubmit} className="p-4 space-y-3">
              {postError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{postError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Debit Account (Dr)
                </label>
                <select
                  value={debitAccount}
                  onChange={(e) => setDebitAccount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                >
                  <option value="1000-BANK">1000 - BANK (Company Main Account)</option>
                  <option value="1100-META-PREPAYMENT">1100 - META-PREPAYMENT (Ad Account Balance)</option>
                  <option value="2000-CLIENT-WALLETS">2000 - CLIENT-WALLETS (Client Deposits)</option>
                  <option value="2100-VENDOR-PAYABLE">2100 - VENDOR-PAYABLE (Vendor Credit Liability)</option>
                  <option value="4000-REVENUE">4000 - REVENUE (Agency Fee & Margin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Credit Account (Cr)
                </label>
                <select
                  value={creditAccount}
                  onChange={(e) => setCreditAccount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                >
                  <option value="2000-CLIENT-WALLETS">2000 - CLIENT-WALLETS (Client Deposits)</option>
                  <option value="1000-BANK">1000 - BANK (Company Main Account)</option>
                  <option value="1100-META-PREPAYMENT">1100 - META-PREPAYMENT (Ad Account Balance)</option>
                  <option value="2100-VENDOR-PAYABLE">2100 - VENDOR-PAYABLE (Vendor Credit Liability)</option>
                  <option value="4000-REVENUE">4000 - REVENUE (Agency Fee & Margin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Amount (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] font-mono focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Description / Narration
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Bank reconciliation discrepancy adjustment"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e4e6eb]">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postMutation.isPending}
                  className="px-4 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {postMutation.isPending ? 'Posting...' : 'Post Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reverse Confirmation */}
      {reverseModalState.isOpen && reverseModalState.tx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <RotateCcw className="w-4 h-4" />
                <h3 className="text-sm font-semibold text-[#0a1317]">
                  Reverse Transaction {reverseModalState.tx.transactionCode}
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-[#475569]">
                This will post mirror reverse entries into the ledger. Please enter the reason for this reversal:
              </p>

              <textarea
                required
                rows={3}
                value={reverseModalState.reason}
                onChange={(e) =>
                  setReverseModalState((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="e.g. Duplicate payment entry recorded in error"
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
              />

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e4e6eb]">
                <button
                  type="button"
                  onClick={() => setReverseModalState({ isOpen: false, tx: null, reason: '' })}
                  className="px-3.5 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reverseModalState.reason.trim() || reverseMutation.isPending}
                  onClick={() => {
                    if (reverseModalState.tx) {
                      reverseMutation.mutate({
                        txId: reverseModalState.tx.id,
                        reason: reverseModalState.reason
                      });
                    }
                  }}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {reverseMutation.isPending ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
