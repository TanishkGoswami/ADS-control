import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  UserPlus,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  fetchVendors,
  createVendorApi,
  recordVendorFundingBatchApi,
  recordVendorRepaymentApi
} from '../../lib/api';
import { formatINR, VendorDto } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';
import { InfoTooltip } from '../../components/InfoTooltip';
import { NotificationModal } from '../../components/ModalDialog';

export const VendorsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState<boolean>(false);

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

  // Onboard Vendor State
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [newVendorRef, setNewVendorRef] = useState<string>('');
  const [newVendorEmail, setNewVendorEmail] = useState<string>('');
  const [newVendorPhone, setNewVendorPhone] = useState<string>('');

  // Batch Form State
  const [batchCode, setBatchCode] = useState<string>('');
  const [batchPrincipal, setBatchPrincipal] = useState<string>('100000');

  // Repayment Form State
  const [repaymentAmount, setRepaymentAmount] = useState<string>('50000');
  const [repaymentRef, setRepaymentRef] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Queries (React Query Cached)
  const {
    data: vendors = [],
    isLoading,
    isFetching,
    refetch: refetchVendors
  } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => fetchVendors(),
    staleTime: 1000 * 60 * 3
  });

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vendorReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [vendors, searchQuery]);

  // Selected Vendor
  const selectedVendor = useMemo(() => {
    if (!vendors.length) return null;
    if (selectedVendorId) {
      return vendors.find((v) => v.id === selectedVendorId) || vendors[0];
    }
    return vendors[0];
  }, [vendors, selectedVendorId]);

  // Mutations
  const onboardMutation = useMutation({
    mutationFn: createVendorApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-list'] });
      setShowOnboardModal(false);
      setNewVendorName('');
      setNewVendorRef('');
      setNewVendorEmail('');
      setNewVendorPhone('');
      setFormError('');
      setNotification({
        isOpen: true,
        title: 'Vendor Created',
        message: 'New vendor successfully registered in the system.',
        type: 'success'
      });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Vendor could not be created.');
    }
  });

  const batchMutation = useMutation({
    mutationFn: recordVendorFundingBatchApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-list'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
      setShowBatchModal(false);
      setBatchCode('');
      setBatchPrincipal('100000');
      setFormError('');
      setNotification({
        isOpen: true,
        title: 'Funding Batch Recorded',
        message: 'Vendor funding batch recorded and credited to company bank.',
        type: 'success'
      });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Funding batch could not be created.');
    }
  });

  const repaymentMutation = useMutation({
    mutationFn: recordVendorRepaymentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-list'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
      setShowRepaymentModal(false);
      setRepaymentRef('');
      setFormError('');
      setNotification({
        isOpen: true,
        title: 'Repayment Recorded',
        message: 'Vendor repayment recorded successfully and liability reduced.',
        type: 'success'
      });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Repayment could not be recorded.');
    }
  });

  const handleExportVendors = () => {
    exportToCSV(
      filteredVendors.map((v) => ({
        VendorRef: v.vendorReference,
        Name: v.name,
        Email: v.email || '',
        Phone: v.phone || '',
        TotalPrincipal: Number(v.totalPrincipalFundedMinor || 0) / 100,
        TotalRepaid: Number(v.totalRepaidMinor || 0) / 100,
        BalanceDue: Number(v.currentBalanceDueMinor || 0) / 100
      })),
      'vendor_credit_report'
    );
  };

  return (
    <div className="space-y-4 pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0064e0]" />
              <span>Vendor Credit & Overpayment Control</span>
            </h1>
            <InfoTooltip
              title="Vendor Credit & Funding"
              text="Tracks vendor funding batches, credit repayments, and automatically prevents overpayment liabilities."
              hinglishHelp="Vendors se funding lene aur unhe wapas repay karne ka pura ledger record yahan manage hota hai."
              side="bottom"
            />
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Vendor funding batches, credit repayments, and automatic overpayment protection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetchVendors()}
            disabled={isFetching}
            className="px-2.5 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-medium text-[#0a1317] transition-colors flex items-center gap-1.5 shadow-xs"
            title="Refresh vendors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748b] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportVendors}
            disabled={filteredVendors.length === 0}
            className="px-2.5 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-medium text-[#0a1317] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Export vendor report to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setFormError('');
              setShowOnboardModal(true);
            }}
            className="px-3 py-1.5 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-semibold text-[#0a1317] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#0064e0]" />
            <span>Onboard Vendor</span>
          </button>

          <button
            onClick={() => {
              setFormError('');
              setShowBatchModal(true);
            }}
            className="px-3 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Batch</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left 1 Col: Active Vendors List */}
        <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-[#e4e6eb] bg-[#fafbfc]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search vendor name or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e4e6eb] rounded-lg text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
              />
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto max-h-[520px] space-y-2">
            <div className="text-[11px] font-bold text-[#8595a4] uppercase tracking-wider px-1">
              Active Vendors ({filteredVendors.length})
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#657383]">
                <div className="w-6 h-6 border-2 border-[#0064e0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading vendors...
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#657383]">
                No vendors found. Click "Onboard Vendor" to register a vendor.
              </div>
            ) : (
              filteredVendors.map((v) => {
                const isSelected = selectedVendor?.id === v.id;
                const balanceDue = BigInt(v.currentBalanceDueMinor || 0);

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVendorId(v.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/50 border-[#0064e0] shadow-xs'
                        : 'bg-white border-[#e4e6eb] hover:border-[#cbd5e1] hover:bg-[#fafbfc]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-[#0064e0] border border-blue-200 font-bold shrink-0">
                          {v.vendorReference}
                        </span>
                        <span className="font-semibold text-xs text-[#0a1317] truncate">
                          {v.name}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          balanceDue > 0n
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {balanceDue > 0n ? 'PAYABLE' : 'CLEARED'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#657383] truncate">
                      {v.email || v.phone || 'No contact specified'}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#f0f2f5] font-mono">
                      <span className="text-[#8595a4] text-[11px]">To Repay:</span>
                      <span className="font-bold text-[#0a1317]">
                        {formatINR(v.currentBalanceDueMinor || 0)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Cols: Vendor Overview, Stats & Batches Ledger */}
        <div className="lg:col-span-2 space-y-3">
          {selectedVendor ? (
            <>
              {/* Top Banner Card */}
              <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0064e0] border border-blue-200">
                      {selectedVendor.vendorReference}
                    </span>
                    <h2 className="text-base font-bold text-[#0a1317]">{selectedVendor.name}</h2>
                  </div>
                  <p className="text-xs text-[#657383] mt-1">
                    {selectedVendor.email || 'No email'} • {selectedVendor.phone || 'No phone'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFormError('');
                      setShowRepaymentModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Record Repayment</span>
                  </button>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#657383] uppercase tracking-wider">
                      Total Principal
                    </span>
                    <InfoTooltip
                      title="Total Principal Funded"
                      text="Cumulative funds received from this vendor across all batches."
                      hinglishHelp="Vendor se liya gaya total principal funding amount."
                      side="top"
                    />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#0a1317]">
                    {formatINR(selectedVendor.totalPrincipalFundedMinor || 0)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#657383] uppercase tracking-wider">
                      Total Repaid
                    </span>
                    <InfoTooltip
                      title="Total Repayments"
                      text="Total amount paid back to this vendor to date."
                      hinglishHelp="Vendor ko wapas pay kiya gaya total amount."
                      side="top"
                    />
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-700">
                    {formatINR(selectedVendor.totalRepaidMinor || 0)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#657383] uppercase tracking-wider">
                      Balance Due
                    </span>
                    <InfoTooltip
                      title="Current Balance Due"
                      text="Outstanding liability remaining to be repaid to the vendor."
                      hinglishHelp="Bacha hua amount jo vendor ko repay karna baaki hai."
                      side="top"
                      align="end"
                    />
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-700">
                    {formatINR(selectedVendor.currentBalanceDueMinor || 0)}
                  </div>
                </div>
              </div>

              {/* Funding Batches Table Card */}
              <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm overflow-hidden">
                <div className="p-3 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#0064e0]" />
                    <h3 className="text-xs font-bold text-[#0a1317] uppercase tracking-wider">
                      Vendor Funding Batches & Repayments
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#657383] font-mono">
                    {selectedVendor.fundingBatches?.length || 0} Batches Recorded
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] text-[#657383] font-semibold text-[11px] uppercase tracking-wider border-b border-[#e4e6eb]">
                      <tr>
                        <th className="px-4 py-3">Batch Code</th>
                        <th className="px-4 py-3 text-right">Principal</th>
                        <th className="px-4 py-3 text-right">Repaid</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f2f5] font-mono text-xs">
                      {!selectedVendor.fundingBatches || selectedVendor.fundingBatches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[#8595a4] font-sans">
                            No funding batches recorded for this vendor yet. Click "Record Batch" to fund.
                          </td>
                        </tr>
                      ) : (
                        selectedVendor.fundingBatches.map((b: any) => {
                          const outstanding = BigInt(b.principalAmountMinor) - BigInt(b.repaidAmountMinor || 0);
                          const isCleared = outstanding <= 0n;

                          return (
                            <tr key={b.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                              <td className="px-4 py-3 font-semibold text-[#0a1317]">
                                <div>{b.batchCode}</div>
                                <div className="text-[10px] text-[#8595a4] font-normal font-sans">
                                  {new Date(b.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-[#0a1317]">
                                {formatINR(b.principalAmountMinor)}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-700 font-bold">
                                {formatINR(b.repaidAmountMinor || 0)}
                              </td>
                              <td className="px-4 py-3 text-right text-amber-700 font-bold">
                                {formatINR(outstanding)}
                              </td>
                              <td className="px-4 py-3 text-center font-sans">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                    isCleared
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {isCleared ? 'CLEARED' : 'ACTIVE'}
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
            </>
          ) : (
            <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm p-12 text-center text-xs text-[#657383]">
              Select a vendor from the list to view balances, funding batches, and record repayments.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Onboard Vendor */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0064e0]" />
                <h3 className="text-sm font-semibold text-[#0a1317]">Onboard New Vendor</h3>
              </div>
              <InfoTooltip
                title="Vendor Onboarding"
                text="Register a funding partner / vendor from whom the agency receives credit lines."
                hinglishHelp="Naya vendor add karein jisse agency funding aur cards receive karti hai."
                side="bottom"
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onboardMutation.mutate({
                  name: newVendorName,
                  vendorReference: newVendorRef || `VEN-${Date.now().toString().slice(-4)}`,
                  email: newVendorEmail,
                  phone: newVendorPhone
                });
              }}
              className="p-4 space-y-3"
            >
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Funding"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Vendor Reference Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. VEN-01 (Auto-generated if empty)"
                  value={newVendorRef}
                  onChange={(e) => setNewVendorRef(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] font-mono focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="vendor@partners.com"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e4e6eb]">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="px-4 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {onboardMutation.isPending ? 'Onboarding...' : 'Onboard Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Funding Batch */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0064e0]" />
                <h3 className="text-sm font-semibold text-[#0a1317]">Record Vendor Funding Batch</h3>
              </div>
              <InfoTooltip
                title="Vendor Funding Batch"
                text="Records receipt of credit funds into the company bank ledger from the vendor."
                hinglishHelp="Vendor se receive hua fund record karein jisse bank balance aur vendor payable badhta hai."
                side="bottom"
                align="end"
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedVendor) return;
                batchMutation.mutate({
                  vendorId: selectedVendor.id,
                  batchCode: batchCode || `BATCH-${Date.now().toString().slice(-4)}`,
                  principalAmountRupees: parseFloat(batchPrincipal) || 0
                });
              }}
              className="p-4 space-y-3"
            >
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Selected Vendor
                </label>
                <div className="p-2 bg-[#f8fafc] border border-[#e4e6eb] rounded-lg text-xs font-semibold text-[#0a1317]">
                  {selectedVendor?.name} ({selectedVendor?.vendorReference})
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Batch Code / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-5805"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] font-mono focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Principal Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={batchPrincipal}
                  onChange={(e) => setBatchPrincipal(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] font-mono focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e4e6eb]">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchMutation.isPending}
                  className="px-4 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {batchMutation.isPending ? 'Recording...' : 'Record Funding Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Repayment */}
      {showRepaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#e4e6eb] bg-[#fafbfc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-[#0064e0]" />
                <h3 className="text-sm font-semibold text-[#0a1317]">Record Vendor Repayment</h3>
              </div>
              <InfoTooltip
                title="Vendor Repayment"
                text="Pay back the vendor reducing the current outstanding balance."
                hinglishHelp="Vendor ko repayment karein taaki unka Balance Due kam ho sake."
                side="bottom"
                align="end"
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedVendor) return;
                repaymentMutation.mutate({
                  vendorId: selectedVendor.id,
                  amountRupees: parseFloat(repaymentAmount) || 0,
                  paymentReference: repaymentRef || `REP-${Date.now().toString().slice(-4)}`
                });
              }}
              className="p-4 space-y-3"
            >
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Vendor
                </label>
                <div className="p-2 bg-[#f8fafc] border border-[#e4e6eb] rounded-lg text-xs font-semibold text-[#0a1317]">
                  {selectedVendor?.name} (Outstanding: {formatINR(selectedVendor?.currentBalanceDueMinor || 0)})
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Repayment Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] font-mono focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Payment Reference / Bank UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-AXIS-982736"
                  value={repaymentRef}
                  onChange={(e) => setRepaymentRef(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] font-mono focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e4e6eb]">
                <button
                  type="button"
                  onClick={() => setShowRepaymentModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={repaymentMutation.isPending}
                  className="px-4 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {repaymentMutation.isPending ? 'Recording...' : 'Record Repayment'}
                </button>
              </div>
            </form>
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
