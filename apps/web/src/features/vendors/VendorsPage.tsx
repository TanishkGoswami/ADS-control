import React, { useState, useEffect } from 'react';
import { Building2, Plus, TrendingUp, DollarSign, AlertTriangle, UserPlus, Download, RefreshCw } from 'lucide-react';
import {
  fetchVendors,
  createVendorApi,
  recordVendorFundingBatchApi,
  recordVendorRepaymentApi
} from '../../lib/api';
import { formatINR, VendorDto } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState<boolean>(false);

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const data = await fetchVendors();
      setVendors(data);
      if (data && data.length > 0) {
        setSelectedVendor((prev) => (prev ? data.find((v) => v.id === prev.id) || data[0] : data[0]));
      } else {
        setSelectedVendor(null);
      }
    } catch (err) {
      console.warn('Failed to load vendors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleRecordBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await recordVendorFundingBatchApi({
        vendorId: selectedVendor.id,
        batchCode: batchCode || `BATCH-${Date.now().toString().slice(-4)}`,
        principalAmountRupees: parseFloat(batchPrincipal) || 0
      });
      await loadVendors();
      setShowBatchModal(false);
      setBatchCode('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Funding batch could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await recordVendorRepaymentApi({
        vendorId: selectedVendor.id,
        amountRupees: parseFloat(repaymentAmount) || 0,
        paymentReference: repaymentRef || `REP-${Date.now().toString().slice(-4)}`
      });
      await loadVendors();
      setShowRepaymentModal(false);
      setRepaymentRef('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Repayment could not be recorded.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await createVendorApi({
        name: newVendorName,
        vendorReference: newVendorRef || `VEN-${Date.now().toString().slice(-4)}`,
        email: newVendorEmail,
        phone: newVendorPhone
      });
      await loadVendors();
      setShowOnboardModal(false);
      setNewVendorName('');
      setNewVendorRef('');
      setNewVendorEmail('');
      setNewVendorPhone('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Vendor could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportVendors = () => {
    exportToCSV(
      vendors.map((v) => ({
        VendorRef: v.vendorReference,
        Name: v.name,
        Email: v.email,
        Phone: v.phone,
        TotalFunded: Number(v.totalFundedMinor) / 100,
        TotalRepaid: Number(v.totalRepaidMinor) / 100,
        OutstandingPayable: Number(v.outstandingPayableMinor) / 100,
        ReceivableAsset: Number(v.outstandingReceivableMinor) / 100,
        Status: v.status
      })),
      'vendors_ledger_report'
    );
  };

  const hasReceivable = selectedVendor ? BigInt(selectedVendor.outstandingReceivableMinor) > 0n : false;

  return (
    <div className="space-y-3 pb-8">
      {formError && <div role="alert" className="fixed right-4 top-16 z-[70] max-w-sm border border-rose-200 bg-white px-3 py-2 text-xs text-rose-700 shadow-lg"><div className="flex items-start justify-between gap-3"><span>{formError}</span><button type="button" onClick={() => setFormError('')} aria-label="Dismiss error">×</button></div></div>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0064e0]" />
            <span>Vendor Credit & Overpayment Control</span>
          </h1>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Vendor funding batches, credit repayments, and automatic overpayment receivables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVendors}
            disabled={isLoading}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Refresh vendors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportVendors}
            disabled={vendors.length === 0}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Export vendors list to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowOnboardModal(true)}
            className="meta-btn-secondary flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Onboard Vendor</span>
          </button>

          {selectedVendor && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="meta-btn-buy flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Vendors List & Selected Breakdown */}
      {isLoading ? (
        <div className="p-8 text-center bg-white border border-[#d9e0e8] rounded-none text-xs text-[#64748b] font-mono">
          Loading vendor credit lines & funding batches...
        </div>
      ) : vendors.length === 0 ? (
        <div className="p-8 text-center bg-white border border-[#d9e0e8] rounded-none space-y-3">
          <div className="text-xs font-bold text-[#0a1317]">No vendors recorded yet</div>
          <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
            Click "Onboard Vendor" above to register third-party lenders or agency capital sources.
          </p>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="meta-btn-buy text-xs"
          >
            + Onboard First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column: Vendor List */}
          <div className="rounded-none bg-white border border-[#d9e0e8] p-2.5 space-y-2">
            <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
              Active Vendors ({vendors.length})
            </div>

            <div className="space-y-1.5">
              {vendors.map((vendor) => {
                const isSelected = selectedVendor?.id === vendor.id;
                const isRec = BigInt(vendor.outstandingReceivableMinor) > 0n;
                return (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`p-2.5 rounded-none border transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#f1f4f7] border-[#0a1317]'
                        : 'bg-white border-[#d9e0e8] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#0064e0] font-bold">{vendor.vendorReference}</span>
                        <h4 className="text-xs font-bold text-[#0a1317]">{vendor.name}</h4>
                        <p className="text-[11px] text-[#64748b]">{vendor.phone || vendor.email}</p>
                      </div>
                      {isRec ? (
                        <span className="meta-badge-success">
                          RECEIVABLE
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-none bg-[#f1f4f7] text-[#475569] border border-[#d9e0e8]">
                          PAYABLE
                        </span>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#eef1f4] flex items-center justify-between text-[11px]">
                      <span className="text-[#94a3b8]">
                        {isRec ? 'Company Due:' : 'To Repay:'}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isRec ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isRec
                          ? formatINR(vendor.outstandingReceivableMinor)
                          : formatINR(vendor.outstandingPayableMinor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Vendor Ledger & Batches */}
          {selectedVendor && (
            <div className="lg:col-span-2 rounded-none bg-white border border-[#d9e0e8] p-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-none bg-[#f5f6f7] border border-[#d9e0e8]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-none bg-blue-50 text-[#0064e0] border border-blue-200">
                      {selectedVendor.vendorReference}
                    </span>
                    <h2 className="text-sm font-bold text-[#0a1317]">{selectedVendor.name}</h2>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5">
                    {selectedVendor.email || 'No email'} • {selectedVendor.phone || 'No phone'}
                  </p>
                </div>

                <button
                  onClick={() => setShowRepaymentModal(true)}
                  className="meta-btn-buy text-xs self-start sm:self-auto"
                >
                  Record Repayment
                </button>
              </div>

              {/* Overpayment Warning Banner */}
              {hasReceivable && (
                <div className="p-2.5 rounded-none bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold text-emerald-900 uppercase font-mono">
                      Overpayment Receivable Active
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                      Repayment exceeded batch principal by <span className="font-mono font-bold">{formatINR(selectedVendor.outstandingReceivableMinor)}</span>. Locked as open company asset.
                    </p>
                  </div>
                </div>
              )}

              {/* Stats Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">Total Principal</div>
                  <div className="text-base font-bold font-mono text-[#0a1317] mt-1">
                    {formatINR(selectedVendor.totalFundedMinor)}
                  </div>
                </div>
                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">Total Repaid</div>
                  <div className="text-base font-bold font-mono text-[#0064e0] mt-1">
                    {formatINR(selectedVendor.totalRepaidMinor)}
                  </div>
                </div>
                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">
                    {hasReceivable ? 'Receivable Asset' : 'Balance Due'}
                  </div>
                  <div
                    className={`text-base font-bold font-mono mt-1 ${
                      hasReceivable ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {hasReceivable
                      ? formatINR(selectedVendor.outstandingReceivableMinor)
                      : formatINR(selectedVendor.outstandingPayableMinor)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Funding Batch Modal */}
      {showBatchModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleRecordBatch}
            className="bg-white w-full max-w-sm rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <Plus className="w-4 h-4 text-[#0064e0]" />
                <span>Record Vendor Funding Batch</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Vendor</label>
                <div className="p-2 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] font-semibold text-[#0a1317]">
                  {selectedVendor.name}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Batch Code</label>
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="BATCH-RAM-2026-Q3"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Principal Capital (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={batchPrincipal}
                  onChange={(e) => setBatchPrincipal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="meta-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="meta-btn-buy"
              >
                {isSubmitting ? 'Posting...' : 'Create Batch & Post Dr/Cr'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Repayment Modal */}
      {showRepaymentModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleRecordRepayment}
            className="bg-white w-full max-w-sm rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <DollarSign className="w-4 h-4 text-[#0064e0]" />
                <span>Record Vendor Repayment</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRepaymentModal(false)}
                className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Vendor</label>
                <div className="p-2 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] font-semibold text-[#0a1317]">
                  {selectedVendor.name}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Repayment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Payment Reference / UTR</label>
                <input
                  type="text"
                  value={repaymentRef}
                  onChange={(e) => setRepaymentRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="UTR-ICICI-49382019"
                />
              </div>

              {parseFloat(repaymentAmount || '0') > (Number(selectedVendor.outstandingPayableMinor) / 100) && (
                <div className="p-2 rounded-none bg-amber-50 border border-amber-200 text-amber-900 text-[10px] leading-tight flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Overpayment Guard:</strong> Exceeds {formatINR(selectedVendor.outstandingPayableMinor)}. Excess creates <strong>Vendor Receivable Asset</strong>.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
              <button
                type="button"
                onClick={() => setShowRepaymentModal(false)}
                className="meta-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="meta-btn-buy"
              >
                {isSubmitting ? 'Posting...' : 'Post Repayment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onboard New Vendor Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleOnboardVendor}
            className="bg-white w-full max-w-sm rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <UserPlus className="w-4 h-4 text-[#0064e0]" />
                <span>Onboard New Vendor</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="e.g. Apex Liquidity Fund"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Vendor Code / Ref</label>
                <input
                  type="text"
                  value={newVendorRef}
                  onChange={(e) => setNewVendorRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="VEN-ALF"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Contact Email</label>
                <input
                  type="email"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="finance@apexliquidity.com"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Phone</label>
                <input
                  type="text"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="+91 99000 00000"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="meta-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="meta-btn-buy"
              >
                {isSubmitting ? 'Creating...' : 'Create Vendor Credit Line'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
