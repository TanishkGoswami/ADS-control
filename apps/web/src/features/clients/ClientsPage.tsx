import React, { useState, useEffect } from 'react';
import { Users, Plus, RotateCcw, CreditCard, UserPlus, Download, RefreshCw, Info, CheckCircle2, Circle } from 'lucide-react';
import {
  fetchClients,
  createClientApi,
  recordClientPaymentApi,
  allocateClientFundBatchApi,
  fetchMetaAdAccounts
} from '../../lib/api';
import { formatINR, ClientDto, AdAccountDto } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';
import { AccountMultiSelect } from './AccountMultiSelect';

const InfoTip: React.FC<{ label: string }> = ({ label }) => (
  <span className="relative group inline-flex align-middle">
    <button type="button" className="text-[#64748b] hover:text-[#0064e0] focus:text-[#0064e0]" aria-label={label}>
      <Info className="w-3.5 h-3.5" />
    </button>
    <span role="tooltip" className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-2 hidden w-56 -translate-x-1/2 border border-[#cbd5e1] bg-[#0a1317] px-2.5 py-2 text-[11px] font-normal leading-4 text-white shadow-lg group-hover:block group-focus-within:block">
      {label}
    </span>
  </span>
);

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showLeftoverModal, setShowLeftoverModal] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<string>('RETURN_TO_WALLET');

  // Onboard Client Form State
  const [newClientName, setNewClientName] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientRef, setNewClientRef] = useState<string>('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<string>('50000');
  const [serviceFee, setServiceFee] = useState<string>('5000');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Allocation Form State
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({});
  const [jobCode, setJobCode] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientData, accountData] = await Promise.all([
        fetchClients(),
        fetchMetaAdAccounts()
      ]);
      setClients(clientData);
      if (clientData && clientData.length > 0) {
        setSelectedClient((prev) => (prev ? clientData.find((c) => c.id === prev.id) || clientData[0] : clientData[0]));
      } else {
        setSelectedClient(null);
      }
      if (accountData && accountData.length > 0) {
        setAdAccounts(accountData);
      }
    } catch (err) {
      console.warn('Failed to load clients data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await recordClientPaymentApi({
        clientId: selectedClient.id,
        amountRupees: parseFloat(paymentAmount) || 0,
        serviceFeeRupees: parseFloat(serviceFee) || 0,
        paymentReference: paymentRef || `PAY-${Date.now().toString().slice(-4)}`
      });
      await loadData();
      setShowPaymentModal(false);
      setPaymentRef('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Payment could not be recorded.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setFormError('');
    const allocations = selectedAccountIds.map((adAccountId) => ({ adAccountId, amountRupees: Number(allocationAmounts[adAccountId] || 0) }));
    const total = allocations.reduce((sum, item) => sum + item.amountRupees, 0);
    if (!jobCode.trim()) return setFormError('Add a campaign or job code so this allocation can be tracked later.');
    if (!allocations.length) return setFormError('Select at least one active ad account.');
    if (allocations.some((item) => item.amountRupees <= 0)) return setFormError('Enter an amount greater than zero for every selected account.');
    if (total * 100 > Number(selectedClient.walletBalanceMinor)) return setFormError('Total allocation is higher than the available wallet balance.');
    setIsSubmitting(true);
    try {
      await allocateClientFundBatchApi({
        clientId: selectedClient.id,
        jobCode: jobCode.trim(),
        jobTitle: jobTitle.trim() || jobCode.trim(),
        allocations
      });
      await loadData();
      setShowAllocateModal(false);
      setSelectedAccountIds([]);
      setAllocationAmounts({});
      setJobCode('');
      setJobTitle('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Allocation could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAllocation = () => {
    setFormError('');
    setJobCode(`JOB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`);
    setShowAllocateModal(true);
  };

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await createClientApi({
        name: newClientName,
        companyName: newCompanyName,
        email: newClientEmail,
        phone: newClientPhone,
        clientReference: newClientRef || `CLI-${Date.now().toString().slice(-4)}`
      });
      await loadData();
      setShowOnboardModal(false);
      setNewClientName('');
      setNewCompanyName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientRef('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Client could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportClients = () => {
    exportToCSV(
      clients.map((c) => ({
        ClientRef: c.clientReference,
        Name: c.name,
        Company: c.companyName,
        Email: c.email,
        Phone: c.phone,
        WalletBalance: Number(c.walletBalanceMinor) / 100,
        Status: c.status,
        Created: c.createdAt
      })),
      'clients_roster'
    );
  };

  return (
    <div className="space-y-3 pb-8">
      {formError && !showAllocateModal && <div role="alert" className="fixed right-4 top-16 z-[70] max-w-sm border border-rose-200 bg-white px-3 py-2 text-xs text-rose-700 shadow-lg"><div className="flex items-start justify-between gap-3"><span>{formError}</span><button type="button" onClick={() => setFormError('')} aria-label="Dismiss error">×</button></div></div>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0a1317] tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0064e0]" />
            <span>Client Control & Budget Wallets</span>
          </h1>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Client payment receipts, advertising wallets, allocations, and leftover sweeps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Refresh clients list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportClients}
            disabled={clients.length === 0}
            className="meta-btn-ghost flex items-center gap-1.5"
            title="Export clients data to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowOnboardModal(true)}
            className="meta-btn-secondary flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Onboard Client</span>
          </button>

          {selectedClient && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="meta-btn-buy flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Client List & Detail View */}
      {isLoading ? (
        <div className="p-8 text-center bg-white border border-[#d9e0e8] rounded-none text-xs text-[#64748b] font-mono">
          Loading client accounts & wallets...
        </div>
      ) : clients.length === 0 ? (
        <div className="p-8 text-center bg-white border border-[#d9e0e8] rounded-none space-y-3">
          <div className="text-xs font-bold text-[#0a1317]">No clients onboarded yet</div>
          <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
            Click "Onboard Client" above to create your first client and assign prepaid wallets.
          </p>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="meta-btn-buy text-xs"
          >
            + Onboard First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column: Client List */}
          <div className="rounded-none bg-white border border-[#d9e0e8] p-2.5 space-y-2">
            <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
              Active Clients ({clients.length})
            </div>

            <div className="space-y-1.5">
              {clients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-2.5 rounded-none border transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#f1f4f7] border-[#0a1317]'
                        : 'bg-white border-[#d9e0e8] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#0064e0] font-bold">{client.clientReference}</span>
                        <h4 className="text-xs font-bold text-[#0a1317]">{client.name}</h4>
                        <p className="text-[11px] text-[#64748b]">{client.companyName || client.email}</p>
                      </div>
                      <span className="meta-badge-success">
                        {client.status}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#eef1f4] flex items-center justify-between text-[11px]">
                      <span className="text-[#94a3b8]">Wallet Available:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatINR(client.walletBalanceMinor)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Client Deep Dive */}
          {selectedClient && (
            <div className="lg:col-span-2 rounded-none bg-white border border-[#d9e0e8] p-3 space-y-3">
              {/* Client Overview Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-none bg-[#f5f6f7] border border-[#d9e0e8]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-none bg-blue-50 text-[#0064e0] border border-blue-200">
                      {selectedClient.clientReference}
                    </span>
                    <h2 className="text-sm font-bold text-[#0a1317]">{selectedClient.name}</h2>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5">
                    {selectedClient.email || 'No email'} • {selectedClient.phone || 'No phone'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLeftoverModal(true)}
                    className="meta-btn-secondary text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Sweep Leftovers</span>
                  </button>
                  <button
                    onClick={openAllocation}
                    disabled={Number(selectedClient.walletBalanceMinor) <= 0}
                    className="meta-btn-buy text-xs"
                    title={Number(selectedClient.walletBalanceMinor) <= 0 ? 'Record a client payment before allocating funds' : 'Create a tracked job and allocate its budget'}
                  >
                    + Allocate to Ad Account
                  </button>
                </div>
              </div>

              <div className="border border-[#d9e0e8] bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-bold text-[#0a1317]">Setup progress</span>
                  <span className="text-[11px] text-[#64748b]">
                    {Number(selectedClient.walletBalanceMinor) > 0 ? 'Wallet ready. Allocate the campaign budget next.' : 'Next: record the client payment.'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    ['1', 'Client added', true, 'Stores the client identity and creates an empty INR wallet.'],
                    ['2', 'Payment recorded', Number(selectedClient.totalPaidMinor) > 0, 'Adds the advertising portion of a verified client receipt to the wallet.'],
                    ['3', 'Job created', (selectedClient.jobsCount || 0) > 0, 'A job groups allocations under a campaign or billing reference. It is created during allocation.'],
                    ['4', 'Accounts funded', (selectedClient.allocationsCount || 0) > 0, 'Creates traceable fund lots for each selected active ad account.']
                  ].map(([number, label, done, help]) => (
                    <div key={String(number)} className={`flex items-center gap-2 px-2.5 py-2 border ${done ? 'border-emerald-200 bg-emerald-50' : 'border-[#d9e0e8] bg-[#f8fafc]'}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <Circle className="w-4 h-4 text-[#94a3b8] shrink-0" />}
                      <span className="text-[11px] font-semibold text-[#0a1317]">{number}. {label}</span>
                      <InfoTip label={String(help)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[11px] font-semibold text-[#64748b] flex items-center gap-1">Available wallet <InfoTip label="Client money available for new ad account allocations. Service fees are not included." /></div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                    {formatINR(selectedClient.walletBalanceMinor)}
                  </div>
                </div>

                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[11px] font-semibold text-[#64748b] flex items-center gap-1">Lifetime received <InfoTip label="Total advertising funds received from this client. This does not decrease after allocation." /></div>
                  <div className="text-base font-bold font-mono text-[#0a1317] mt-1">
                    {formatINR(selectedClient.totalPaidMinor)}
                  </div>
                </div>

                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[11px] font-semibold text-[#64748b] flex items-center gap-1">Locked funds <InfoTip label="Funds held on restricted accounts. These cannot be reallocated until they are resolved." /></div>
                  <div className="text-base font-bold font-mono text-rose-700 mt-1">
                    {formatINR(selectedClient.totalLockedMinor)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allocate to Ad Account Modal */}
      {showAllocateModal && selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleAllocate}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <Plus className="w-4 h-4 text-[#0064e0]" />
                <span>Allocate campaign budget</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Client</label>
                <div className="p-2 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] font-semibold text-[#0a1317]">
                  {selectedClient.name} (Available: {formatINR(selectedClient.walletBalanceMinor)})
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 font-bold text-[#0a1317] mb-1 text-[11px]">Ad accounts <InfoTip label="Search by name or ID, then select one or many active accounts. Restricted accounts are excluded." /></label>
                <AccountMultiSelect accounts={adAccounts} selectedIds={selectedAccountIds} onChange={(ids) => {
                  setSelectedAccountIds(ids);
                  setAllocationAmounts((current) => Object.fromEntries(ids.map((id) => [id, current[id] || ''])));
                }} />
              </div>

              <div>
                <label className="flex items-center gap-1 font-bold text-[#0a1317] mb-0.5 text-[11px]">Campaign / job code <InfoTip label="Your internal campaign or invoice reference. Reusing a code adds allocations to that job." /></label>
                <input
                  type="text"
                  value={jobCode}
                  onChange={(e) => setJobCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="JOB-2026-099"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Job name</label>
                <input type="text" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className="w-full px-2.5 py-1.5 border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs" placeholder="September lead campaign" />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Allocation Amount (₹)</label>
                <div className="border border-[#d9e0e8] divide-y divide-[#e2e8f0]">
                  {selectedAccountIds.map((id) => {
                    const account = adAccounts.find((item) => item.id === id);
                    if (!account) return null;
                    return <div key={id} className="grid grid-cols-[minmax(0,1fr)_140px_24px] items-center gap-2 p-2">
                      <div className="min-w-0"><div className="font-semibold truncate">{account.internalAlias || account.name}</div><div className="text-[10px] text-[#64748b]">ending {account.metaAdAccountId.replace(/^act_/, '').slice(-4)}</div></div>
                      <div className="relative"><span className="absolute left-2 top-2 text-[#64748b]">₹</span><input aria-label={`Amount for ${account.name}`} type="number" min="1" step="0.01" value={allocationAmounts[id] || ''} onChange={(event) => setAllocationAmounts((current) => ({ ...current, [id]: event.target.value }))} className="w-full h-8 pl-6 pr-2 border border-[#cbd5e1] font-mono text-right focus:outline-none focus:border-[#0064e0]" placeholder="0.00" /></div>
                      <button type="button" aria-label={`Remove ${account.name}`} onClick={() => setSelectedAccountIds((items) => items.filter((item) => item !== id))} className="text-[#64748b] hover:text-rose-600">×</button>
                    </div>;
                  })}
                  {!selectedAccountIds.length && <div className="p-3 text-center text-[#64748b]">Select accounts above to enter their allocation amounts.</div>}
                  {selectedAccountIds.length > 0 && <div className="p-2 flex justify-between bg-[#f8fafc] font-semibold"><span>Total allocation</span><span className="font-mono">₹{selectedAccountIds.reduce((sum, id) => sum + Number(allocationAmounts[id] || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                </div>
              </div>

              {formError && <div role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{formError}</div>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                className="meta-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="meta-btn-buy"
              >
                {isSubmitting ? 'Allocating...' : `Allocate to ${selectedAccountIds.length} account${selectedAccountIds.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Client Payment Modal */}
      {showPaymentModal && selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white w-full max-w-sm rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <CreditCard className="w-4 h-4 text-[#0064e0]" />
                <span>Record Client Payment</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Client</label>
                <div className="p-2 rounded-none bg-[#f5f6f7] border border-[#d9e0e8] font-semibold text-[#0a1317]">
                  {selectedClient.name} ({selectedClient.clientReference})
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Total Received (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Service Fee (₹) [Agency Revenue]</label>
                <input
                  type="number"
                  min="0"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Bank UTR Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="UTR-HDFC-99281726"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="meta-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="meta-btn-buy"
              >
                {isSubmitting ? 'Posting...' : 'Post to Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onboard New Client Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleOnboardClient}
            className="bg-white w-full max-w-sm rounded-none p-4 border border-[#d9e0e8] shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
              <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                <UserPlus className="w-4 h-4 text-[#0064e0]" />
                <span>Onboard New Client</span>
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
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="e.g. Zenith Media Labs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Company / Business Name</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="e.g. Zenith Enterprises Pvt Ltd"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Client Code / Reference</label>
                <input
                  type="text"
                  value={newClientRef}
                  onChange={(e) => setNewClientRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] font-mono text-xs"
                  placeholder="CLI-003"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Billing Email</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="accounts@zenithmedia.com"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0a1317] mb-0.5 text-[11px]">Phone</label>
                <input
                  type="text"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-none border border-[#d9e0e8] focus:outline-none focus:border-[#0064e0] text-xs"
                  placeholder="+91 98765 00000"
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
                {isSubmitting ? 'Creating...' : 'Create Client Wallet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
