import React, { useState, useEffect } from 'react';
import { Users, Plus, RotateCcw, CreditCard, UserPlus, Download, RefreshCw, Info, CheckCircle2, Circle, Layers, Receipt, Sliders } from 'lucide-react';
import {
  fetchClients,
  createClientApi,
  recordClientPaymentApi,
  allocateClientFundBatchApi,
  adjustAllocationApi,
  fetchMetaAdAccounts
} from '../../lib/api';
import { formatINR, ClientDto, AdAccountDto } from '@ads-control/shared';
import { exportToCSV } from '../../lib/export';
import { AccountMultiSelect } from './AccountMultiSelect';
import { useAuth } from '../auth/AuthContext';
import { InfoTooltip } from '../../components/InfoTooltip';

export const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showLeftoverModal, setShowLeftoverModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [adjustAction, setAdjustAction] = useState<'TOP_UP' | 'REFUND'>('TOP_UP');
  const [adjustAmountRupees, setAdjustAmountRupees] = useState<string>('');
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

  const effectiveUserId = user?.role === 'ADS_MANAGER' ? user?.id : undefined;

  const loadData = async (silent = false) => {
    if (!silent && clients.length === 0) {
      setIsLoading(true);
    }
    try {
      const [clientData, accountData] = await Promise.all([
        fetchClients(true),
        adAccounts.length === 0 ? fetchMetaAdAccounts(effectiveUserId) : Promise.resolve(adAccounts)
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
  }, [effectiveUserId]);

  const openAdjust = (alloc: any, action: 'TOP_UP' | 'REFUND') => {
    setSelectedAllocation(alloc);
    setAdjustAction(action);
    setAdjustAmountRupees('');
    setFormError('');
    setShowAdjustModal(true);
  };

  const handleAdjustAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    const amount = parseFloat(adjustAmountRupees);
    if (!amount || amount <= 0) return setFormError('Enter a valid amount');
    setFormError('');
    setIsSubmitting(true);
    try {
      await adjustAllocationApi(selectedAllocation.id, adjustAction, amount);
      setShowAdjustModal(false);
      setAdjustAmountRupees('');
      await loadData(true);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Failed to adjust allocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setFormError('');
    setIsSubmitting(true);

    const totalAmount = parseFloat(paymentAmount) || 0;
    const fee = parseFloat(serviceFee) || 0;
    const adsFundPaise = BigInt(Math.round((totalAmount - fee) * 100));

    try {
      // Optimistic instant UI update
      setSelectedClient((prev) => {
        if (!prev) return prev;
        const newBal = (BigInt(prev.walletBalanceMinor || 0) + adsFundPaise).toString();
        return { ...prev, walletBalanceMinor: newBal };
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id
            ? { ...c, walletBalanceMinor: (BigInt(c.walletBalanceMinor || 0) + adsFundPaise).toString() }
            : c
        )
      );
      setShowPaymentModal(false);
      setPaymentRef('');

      await recordClientPaymentApi({
        clientId: selectedClient.id,
        amountRupees: totalAmount,
        serviceFeeRupees: fee,
        paymentReference: paymentRef || `PAY-${Date.now().toString().slice(-4)}`
      });

      // Background silent refresh to sync actual state
      loadData(true);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Payment could not be recorded.');
      // Re-sync on failure
      loadData(true);
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

    const allocatedPaise = BigInt(Math.round(total * 100));

    try {
      // Optimistic instant update
      setSelectedClient((prev) => {
        if (!prev) return prev;
        const newBal = (BigInt(prev.walletBalanceMinor || 0) - allocatedPaise).toString();
        return { ...prev, walletBalanceMinor: newBal };
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id
            ? { ...c, walletBalanceMinor: (BigInt(c.walletBalanceMinor || 0) - allocatedPaise).toString() }
            : c
        )
      );
      setShowAllocateModal(false);
      setSelectedAccountIds([]);
      setAllocationAmounts({});
      setJobCode('');
      setJobTitle('');

      await allocateClientFundBatchApi({
        clientId: selectedClient.id,
        jobCode: jobCode.trim(),
        jobTitle: jobTitle.trim() || jobCode.trim(),
        allocations
      });

      loadData(true);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Allocation could not be completed.');
      loadData(true);
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
      const created = await createClientApi({
        name: newClientName,
        companyName: newCompanyName,
        email: newClientEmail,
        phone: newClientPhone,
        clientReference: newClientRef || `CLI-${Date.now().toString().slice(-4)}`
      });
      setShowOnboardModal(false);
      setNewClientName('');
      setNewCompanyName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientRef('');
      await loadData(true);
      if (created?.id) {
        setSelectedClient(created);
      }
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
            onClick={() => loadData(false)}
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
                    ['2', 'Payment recorded', Number(selectedClient.totalPaidMinor) > 0, 'Adds the advertising portion of a verified client receipt to the wallet.', 'Client payment record karne par wallet balance increase hota hai.'],
                    ['3', 'Job created', (selectedClient.jobsCount || 0) > 0, 'A job groups allocations under a campaign or billing reference.', 'Allocations ko group karne ke liye campaign job banti hai.'],
                    ['4', 'Accounts funded', (selectedClient.allocationsCount || 0) > 0, 'Creates traceable fund lots for each selected active ad account.', 'Ad accounts me traceable lots ke through balance transfer hota hai.']
                  ].map(([number, label, done, help, hinglish]) => (
                    <div key={String(number)} className={`flex items-center gap-2 px-2.5 py-2 border ${done ? 'border-emerald-200 bg-emerald-50' : 'border-[#d9e0e8] bg-[#f8fafc]'}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <Circle className="w-4 h-4 text-[#94a3b8] shrink-0" />}
                      <span className="text-[11px] font-semibold text-[#0a1317]">{number}. {label}</span>
                      <InfoTooltip title={String(label)} text={String(help)} hinglishHelp={String(hinglish)} side="top" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[11px] font-semibold text-[#64748b] flex items-center justify-between">
                    <span>Available wallet</span>
                    <InfoTooltip
                      title="Available Wallet Balance"
                      text="Client money available for new ad account allocations. Agency service fees are excluded."
                      hinglishHelp="Client ka usable balance jisse naye campaigns aur ad accounts fund kiye ja sakte hain."
                      side="top"
                    />
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                    {formatINR(selectedClient.walletBalanceMinor)}
                  </div>
                </div>

                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[11px] font-semibold text-[#64748b] flex items-center justify-between">
                    <span>Lifetime received</span>
                    <InfoTooltip
                      title="Lifetime Received"
                      text="Total advertising funds received from this client to date."
                      hinglishHelp="Is client se ab tak aaya hua total ad budget amount."
                      side="top"
                    />
                  </div>
                  <div className="text-base font-bold font-mono text-[#0a1317] mt-1">
                    {formatINR(selectedClient.totalPaidMinor)}
                  </div>
                </div>

                <div className="p-2.5 rounded-none bg-white border border-[#d9e0e8]">
                  <div className="text-[11px] font-semibold text-[#64748b] flex items-center justify-between">
                    <span>Locked funds</span>
                    <InfoTooltip
                      title="Locked Funds"
                      text="Funds held on disabled or restricted accounts pending resolution."
                      hinglishHelp="Restricted ya disabled accounts me atka hua amount jo unlock hone tak use nahi ho sakta."
                      side="top"
                    />
                  </div>
                  <div className="text-base font-bold font-mono text-rose-700 mt-1">
                    {formatINR(selectedClient.totalLockedMinor)}
                  </div>
                </div>
              </div>

              {/* Active Campaigns & Ad Account Allocations Breakdown */}
              <div className="border border-[#d9e0e8] bg-white rounded-[4px] overflow-hidden">
                <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0064e0]" />
                    <span className="text-xs font-bold text-[#0a1317]">
                      Campaign Jobs & Target Ad Accounts
                    </span>
                    <span className="text-[10px] bg-blue-50 text-[#0064e0] px-1.5 py-0.5 rounded font-mono font-semibold">
                      {selectedClient.jobs?.reduce((sum: number, j: any) => sum + (j.allocations?.length || 0), 0) || 0} Allocations
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={openAllocation}
                    disabled={Number(selectedClient.walletBalanceMinor) <= 0}
                    className="meta-btn-buy text-[11px] px-2 py-1"
                  >
                    + New Allocation
                  </button>
                </div>

                {(!selectedClient.jobs || selectedClient.jobs.length === 0 || selectedClient.jobs.every((j: any) => !j.allocations?.length)) ? (
                  <div className="p-6 text-center text-xs text-[#64748b] space-y-2">
                    <p>No ad account allocations found for this client yet.</p>
                    {Number(selectedClient.walletBalanceMinor) > 0 && (
                      <button
                        type="button"
                        onClick={openAllocation}
                        className="text-[#0064e0] font-semibold hover:underline text-xs"
                      >
                        Click here to allocate funds to target Ad Accounts →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-[#e2e8f0]">
                    {selectedClient.jobs.map((job: any) => (
                      <div key={job.id} className="p-3 space-y-2">
                        {/* Job Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] text-[#0064e0] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {job.jobCode}
                            </span>
                            <span className="font-bold text-xs text-[#0a1317]">{job.title}</span>
                          </div>
                          <span className="text-[10px] text-[#64748b]">
                            Budget: <strong className="font-mono text-[#0a1317]">{formatINR(job.plannedBudgetMinor)}</strong>
                          </span>
                        </div>

                        {/* Allocations Table */}
                        <div className="border border-[#e2e8f0] rounded overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                                <th className="p-2">Target Ad Account</th>
                                <th className="p-2 text-right">Allocated (₹)</th>
                                <th className="p-2 text-right">Spent (₹)</th>
                                <th className="p-2 text-right">Unspent (₹)</th>
                                <th className="p-2 text-center">Status</th>
                                <th className="p-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f1f5f9]">
                              {job.allocations.map((alloc: any) => {
                                const allocatedMinor = BigInt(alloc.allocatedMinor || 0);
                                const consumedMinor = BigInt(alloc.consumedMinor || 0);
                                const unspentMinor = allocatedMinor - consumedMinor;
                                const account = alloc.adAccount;

                                return (
                                  <tr key={alloc.id} className="hover:bg-[#fcfdfe]">
                                    <td className="p-2">
                                      <div className="font-semibold text-xs text-[#0a1317]">
                                        {account?.internalAlias || account?.name || 'Unknown Account'}
                                      </div>
                                      <div className="text-[10px] text-[#64748b] flex items-center gap-1 font-mono">
                                        <span>ending {account?.metaAdAccountId?.replace(/^act_/, '').slice(-4) || '----'}</span>
                                        {account?.businessPortfolio?.name && (
                                          <span>· {account.businessPortfolio.name}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-[#0a1317]">
                                      {formatINR(allocatedMinor)}
                                    </td>
                                    <td className="p-2 text-right font-mono text-[#64748b]">
                                      {formatINR(consumedMinor)}
                                    </td>
                                    <td className="p-2 text-right font-mono font-semibold text-emerald-700">
                                      {formatINR(unspentMinor)}
                                    </td>
                                    <td className="p-2 text-center">
                                      <span className="meta-badge-success text-[9px]">
                                        {alloc.status}
                                      </span>
                                    </td>
                                    <td className="p-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openAdjust(alloc, 'TOP_UP')}
                                          disabled={Number(selectedClient.walletBalanceMinor) <= 0}
                                          className="px-2 py-0.5 rounded bg-blue-50 text-[#0064e0] hover:bg-blue-100 text-[10px] font-semibold disabled:opacity-40"
                                          title="Add more funds from wallet to this allocation"
                                        >
                                          + Top-up
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openAdjust(alloc, 'REFUND')}
                                          disabled={unspentMinor <= 0n}
                                          className="px-2 py-0.5 rounded bg-white border border-[#d9e0e8] hover:bg-[#f1f5f9] text-[10px] text-[#475569] disabled:opacity-40"
                                          title="Reclaim unspent funds back into client wallet"
                                        >
                                          ↩ Refund
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Receipts History */}
              <div className="border border-[#d9e0e8] bg-white rounded-[4px] overflow-hidden">
                <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#0064e0]" />
                    <span className="text-xs font-bold text-[#0a1317]">
                      Payment Receipts & Revenue Split History
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b]">
                    {selectedClient.payments?.length || 0} Receipts
                  </span>
                </div>

                {(!selectedClient.payments || selectedClient.payments.length === 0) ? (
                  <div className="p-4 text-center text-xs text-[#64748b]">
                    No payment receipts recorded for this client yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                          <th className="p-2">Bank UTR / Reference</th>
                          <th className="p-2 text-right">Total Gross (₹)</th>
                          <th className="p-2 text-right">Ads Fund Credited (₹)</th>
                          <th className="p-2 text-right">Service Fee (₹)</th>
                          <th className="p-2 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {selectedClient.payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-[#fcfdfe]">
                            <td className="p-2 font-mono font-semibold text-[#0a1317]">
                              {p.paymentReference}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-[#0a1317]">
                              {formatINR(p.totalAmountMinor)}
                            </td>
                            <td className="p-2 text-right font-mono text-emerald-700 font-semibold">
                              {formatINR(p.adsFundMinor)}
                            </td>
                            <td className="p-2 text-right font-mono text-[#64748b]">
                              {formatINR(p.serviceFeeMinor)}
                            </td>
                            <td className="p-2 text-right text-[11px] text-[#64748b]">
                              {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allocate to Ad Account Modal */}
      {showAllocateModal && selectedClient && (() => {
        const availableRupees = Number(selectedClient.walletBalanceMinor) / 100;
        const totalAllocated = selectedAccountIds.reduce(
          (sum, id) => sum + (parseFloat(allocationAmounts[id]) || 0),
          0
        );
        const remainingRupees = availableRupees - totalAllocated;
        const isOverAllocated = totalAllocated > availableRupees;

        const handleSplitEvenly = () => {
          if (selectedAccountIds.length === 0 || availableRupees <= 0) return;
          const perAccount = (availableRupees / selectedAccountIds.length).toFixed(2);
          const newAmounts: Record<string, string> = {};
          selectedAccountIds.forEach((id) => {
            newAmounts[id] = perAccount;
          });
          setAllocationAmounts(newAmounts);
        };

        const handleSetAll = (amount: number) => {
          const newAmounts: Record<string, string> = {};
          selectedAccountIds.forEach((id) => {
            newAmounts[id] = amount.toString();
          });
          setAllocationAmounts(newAmounts);
        };

        const handleFillForAccount = (id: string) => {
          const currentForThis = parseFloat(allocationAmounts[id]) || 0;
          const maxPossible = Math.max(0, remainingRupees + currentForThis);
          setAllocationAmounts((prev) => ({
            ...prev,
            [id]: maxPossible.toFixed(2)
          }));
        };

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
            <form
              onSubmit={handleAllocate}
              className="bg-white w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[6px] border border-[#d9e0e8] shadow-2xl overflow-hidden"
            >
              {/* Sticky Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#d9e0e8] bg-[#f8fafc] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[4px] bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0064e0]">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#0a1317]">Allocate Campaign Budget</h2>
                    <p className="text-[10px] text-[#64748b]">
                      Distribute client unallocated wallet funds into Meta advertising accounts.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#94a3b8] hover:text-[#0a1317] hover:bg-[#e2e8f0] transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* 1. Client Wallet Overview Bar */}
                <div className="p-3 bg-[#f8fafc] border border-[#d9e0e8] rounded-[5px] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748b] block mb-0.5">
                      Client
                    </span>
                    <span className="font-bold text-xs text-[#0a1317] block truncate">
                      {selectedClient.name}
                    </span>
                    <span className="text-[10px] text-[#64748b] font-mono">
                      Ref: {selectedClient.clientReference}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748b] block mb-0.5">
                      Available Wallet Balance
                    </span>
                    <span className="font-bold text-sm text-[#0064e0] font-mono block">
                      {formatINR(selectedClient.walletBalanceMinor)}
                    </span>
                    <span className="text-[10px] text-[#64748b]">Unallocated funds</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748b] block mb-0.5">
                      Remaining After Allocation
                    </span>
                    <span
                      className={`font-bold text-sm font-mono block ${
                        isOverAllocated
                          ? 'text-rose-600'
                          : remainingRupees === 0
                          ? 'text-emerald-600'
                          : 'text-[#0a1317]'
                      }`}
                    >
                      ₹{remainingRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-[#64748b]">
                      {isOverAllocated
                        ? 'Exceeds wallet limit'
                        : remainingRupees === 0
                        ? '100% Allocated'
                        : 'Unused client credit'}
                    </span>
                  </div>
                </div>

                {/* Over-allocation Alert */}
                {isOverAllocated && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[4px] text-rose-700 text-xs flex items-center gap-2">
                    <span className="font-bold">⚠️ Warning:</span>
                    <span>
                      Total allocation of ₹{totalAllocated.toLocaleString('en-IN')} exceeds available wallet balance of ₹{availableRupees.toLocaleString('en-IN')}.
                    </span>
                  </div>
                )}

                {/* 2. Campaign / Job Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1 font-bold text-[#0a1317] mb-1 text-[11px]">
                      Campaign / Job Code *
                      <InfoTooltip
                        title="Campaign Job Code"
                        text="Unique internal tracking code. Reusing a code appends allocations to that job."
                        hinglishHelp="Is campaign ya job ka unique code. Agar same code daalenge toh naya allocation usi job me add hoga."
                        side="top"
                      />
                    </label>
                    <input
                      type="text"
                      required
                      value={jobCode}
                      onChange={(e) => setJobCode(e.target.value)}
                      className="w-full h-8 px-2.5 border border-[#cbd5e1] rounded-[4px] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] font-mono text-xs"
                      placeholder="JOB-2026-099"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0a1317] mb-1 text-[11px]">
                      Campaign / Job Name
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full h-8 px-2.5 border border-[#cbd5e1] rounded-[4px] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] text-xs"
                      placeholder="e.g. September Performance Campaign"
                    />
                  </div>
                </div>

                {/* 3. Ad Accounts Filter & Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1 font-bold text-[#0a1317] text-[11px]">
                      Select Target Ad Accounts *
                      <InfoTooltip
                        title="Target Ad Accounts"
                        text="Filter and select active accounts to receive funding. Inactive or restricted accounts are excluded."
                        hinglishHelp="Active ad accounts select karein jahan yeh budget send karna hai."
                        side="top"
                      />
                    </label>
                    <span className="text-[10px] text-[#64748b]">
                      {selectedAccountIds.length} of {adAccounts.length} selected
                    </span>
                  </div>

                  <AccountMultiSelect
                    accounts={adAccounts}
                    selectedIds={selectedAccountIds}
                    onChange={(ids) => {
                      setSelectedAccountIds(ids);
                      setAllocationAmounts((current) =>
                        Object.fromEntries(ids.map((id) => [id, current[id] || '']))
                      );
                    }}
                  />
                </div>

                {/* 4. Allocation Distribution Matrix */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <label className="block font-bold text-[#0a1317] text-[11px]">
                      Budget Distribution per Account
                    </label>

                    {/* Fast calculation tools */}
                    {selectedAccountIds.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <button
                          type="button"
                          onClick={handleSplitEvenly}
                          className="px-2 py-0.5 bg-blue-50 text-[#0064e0] border border-blue-200 rounded hover:bg-blue-100 transition-colors font-medium"
                          title="Split total available wallet balance equally across selected accounts"
                        >
                          ⚡ Split wallet evenly
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAll(10000)}
                          className="px-2 py-0.5 bg-white text-[#475569] border border-[#d9e0e8] rounded hover:bg-[#f1f5f9] transition-colors"
                        >
                          ₹10k each
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAll(25000)}
                          className="px-2 py-0.5 bg-white text-[#475569] border border-[#d9e0e8] rounded hover:bg-[#f1f5f9] transition-colors"
                        >
                          ₹25k each
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllocationAmounts({})}
                          className="px-2 py-0.5 text-[#dc2626] hover:bg-red-50 rounded transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border border-[#d9e0e8] rounded-[5px] divide-y divide-[#e2e8f0] bg-white overflow-hidden">
                    {selectedAccountIds.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-[#64748b] bg-[#f8fafc]">
                        No accounts selected. Pick one or more ad accounts from the selector above to set allocation amounts.
                      </div>
                    ) : (
                      selectedAccountIds.map((id) => {
                        const account = adAccounts.find((item) => item.id === id);
                        if (!account) return null;
                        const endingDigits = account.metaAdAccountId.replace(/^act_/, '').slice(-4);
                        const currentVal = parseFloat(allocationAmounts[id]) || 0;

                        return (
                          <div
                            key={id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 hover:bg-[#fcfdfe]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-[#0a1317]">
                                  {account.internalAlias || account.name}
                                </span>
                                <span className="text-[10px] font-mono text-[#64748b] bg-[#f1f5f9] px-1 py-0.5 rounded">
                                  ending {endingDigits}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#64748b] flex items-center gap-2 mt-0.5">
                                <span>Tracked balance: {formatINR(account.currentTrackedBalanceMinor)}</span>
                                {account.businessPortfolio?.name && (
                                  <span>· {account.businessPortfolio.name}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleFillForAccount(id)}
                                className="text-[10px] text-[#0064e0] hover:underline font-medium"
                                title="Fill with remaining wallet balance"
                              >
                                Max remaining
                              </button>
                              <div className="relative w-36">
                                <span className="absolute left-2.5 top-2 text-[#64748b] font-mono text-xs">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  value={allocationAmounts[id] || ''}
                                  onChange={(e) =>
                                    setAllocationAmounts((prev) => ({
                                      ...prev,
                                      [id]: e.target.value
                                    }))
                                  }
                                  className="w-full h-8 pl-6 pr-2 border border-[#cbd5e1] rounded-[4px] font-mono text-xs text-right focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0]"
                                  placeholder="0.00"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAccountIds((items) => items.filter((item) => item !== id))
                                }
                                className="w-6 h-6 rounded flex items-center justify-center text-[#94a3b8] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove account"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {selectedAccountIds.length > 0 && (
                      <div className="p-3 bg-[#f8fafc] border-t border-[#d9e0e8] flex items-center justify-between font-semibold text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[#0a1317]">Total Allocation:</span>
                          <span className="text-[11px] text-[#64748b] font-normal">
                            ({selectedAccountIds.length} account{selectedAccountIds.length === 1 ? '' : 's'})
                          </span>
                        </div>
                        <span
                          className={`font-mono text-sm ${
                            isOverAllocated ? 'text-rose-600' : 'text-[#0a1317]'
                          }`}
                        >
                          ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 rounded-[4px]"
                  >
                    {formError}
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#d9e0e8] bg-[#f8fafc] shrink-0">
                <div className="text-xs">
                  {selectedAccountIds.length > 0 && (
                    <span className="text-[#64748b]">
                      Allocating{' '}
                      <strong className="text-[#0a1317] font-mono">
                        ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-[#0a1317]">{selectedAccountIds.length}</strong> account
                      {selectedAccountIds.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAllocateModal(false)}
                    className="meta-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedAccountIds.length === 0 || isOverAllocated}
                    className="meta-btn-buy"
                  >
                    {isSubmitting
                      ? 'Allocating Funds...'
                      : `Allocate ₹${totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        );
      })()}

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

      {/* Adjust Allocation Modal (Top-up or Refund) */}
      {showAdjustModal && selectedAllocation && selectedClient && (() => {
        const walletAvailableRupees = Number(selectedClient.walletBalanceMinor) / 100;
        const allocatedRupees = Number(selectedAllocation.allocatedMinor) / 100;
        const consumedRupees = Number(selectedAllocation.consumedMinor) / 100;
        const unspentRupees = allocatedRupees - consumedRupees;
        const isTopUp = adjustAction === 'TOP_UP';

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 backdrop-blur-sm">
            <form
              onSubmit={handleAdjustAllocation}
              className="bg-white w-full max-w-sm rounded-[6px] p-4 border border-[#d9e0e8] shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#d9e0e8] pb-2">
                <div className="flex items-center gap-1.5 text-[#0a1317] font-bold text-xs">
                  <Sliders className="w-4 h-4 text-[#0064e0]" />
                  <span>{isTopUp ? 'Top-Up Ad Account Budget' : 'Refund Unspent Budget to Wallet'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="text-[#94a3b8] hover:text-[#0a1317] text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Account Context */}
                <div className="p-2 bg-[#f8fafc] border border-[#d9e0e8] rounded-[4px] space-y-1">
                  <div className="font-bold text-xs text-[#0a1317]">
                    {selectedAllocation.adAccount?.internalAlias || selectedAllocation.adAccount?.name}
                  </div>
                  <div className="text-[10px] text-[#64748b] flex justify-between">
                    <span>Current allocated: <strong>₹{allocatedRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    <span>Unspent: <strong className="text-emerald-700">₹{unspentRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    Client wallet available: <strong className="font-mono text-[#0064e0]">₹{walletAvailableRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                {/* Action Toggle */}
                <div className="flex border border-[#d9e0e8] rounded p-0.5 bg-[#f1f5f9]">
                  <button
                    type="button"
                    onClick={() => { setAdjustAction('TOP_UP'); setAdjustAmountRupees(''); setFormError(''); }}
                    className={`flex-1 py-1 text-center text-xs font-semibold rounded ${isTopUp ? 'bg-white text-[#0064e0] shadow-sm' : 'text-[#64748b]'}`}
                  >
                    + Top-Up from Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdjustAction('REFUND'); setAdjustAmountRupees(''); setFormError(''); }}
                    className={`flex-1 py-1 text-center text-xs font-semibold rounded ${!isTopUp ? 'bg-white text-rose-600 shadow-sm' : 'text-[#64748b]'}`}
                  >
                    ↩ Refund to Wallet
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-[#0a1317] mb-1 text-[11px]">
                    {isTopUp ? 'Amount to Add (₹)' : 'Amount to Refund (₹)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#64748b] font-mono">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      max={isTopUp ? walletAvailableRupees : unspentRupees}
                      value={adjustAmountRupees}
                      onChange={(e) => setAdjustAmountRupees(e.target.value)}
                      className="w-full h-8 pl-6 pr-2 border border-[#cbd5e1] rounded-[4px] font-mono text-xs focus:outline-none focus:border-[#0064e0]"
                      placeholder={isTopUp ? '5000' : `${unspentRupees}`}
                    />
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setAdjustAmountRupees(isTopUp ? walletAvailableRupees.toString() : unspentRupees.toString())}
                      className="text-[10px] text-[#0064e0] hover:underline"
                    >
                      {isTopUp ? 'Max available in wallet' : 'Max unspent amount'}
                    </button>
                  </div>
                </div>

                {formError && (
                  <div role="alert" className="border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 rounded">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d9e0e8]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="meta-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !adjustAmountRupees}
                  className="meta-btn-buy text-xs"
                >
                  {isSubmitting
                    ? 'Updating...'
                    : isTopUp
                    ? `Add ₹${parseFloat(adjustAmountRupees) || 0}`
                    : `Refund ₹${parseFloat(adjustAmountRupees) || 0}`}
                </button>
              </div>
            </form>
          </div>
        );
      })()}
    </div>
  );
};
