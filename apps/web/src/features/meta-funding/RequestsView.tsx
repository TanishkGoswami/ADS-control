import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, X } from 'lucide-react';
import { approveFundingRequest, cancelFundingRequest, createFundingRequest, fetchFundingEligibility, fetchFundingRequests, fetchMetaAdAccounts } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

const money = (minor: string | number | bigint) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(Number(minor || 0) / 100);
const errorText = (error: any) => error?.response?.data?.message || error?.message || 'Request failed';

export const RequestsView: React.FC = () => {
  const { user } = useAuth();
  const canApprove = ['ADMIN', 'FINANCE'].includes(user?.role || '');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fundLotId:'', targetAdAccountId:'', amount:'', purpose:'' });
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
  const requests = useQuery({ queryKey:['funding-requests'], queryFn:fetchFundingRequests });
  const lots = useQuery({ queryKey:['funding-eligibility'], queryFn:fetchFundingEligibility });
  const accounts = useQuery({ queryKey:['meta-accounts'], queryFn:() => fetchMetaAdAccounts() });
  const refresh = () => Promise.all([qc.invalidateQueries({queryKey:['funding-requests']}), qc.invalidateQueries({queryKey:['funding-eligibility']})]);
  const create = useMutation({ mutationFn:() => createFundingRequest({ fundLotId:form.fundLotId, targetAdAccountId:form.targetAdAccountId || undefined, amountMinor:String(Math.round(Number(form.amount) * 100)), currencyCode:'INR', purpose:form.purpose }), onSuccess:async()=>{ await refresh(); setOpen(false); setForm({fundLotId:'',targetAdAccountId:'',amount:'',purpose:''}); } });
  const approve = useMutation({ mutationFn:approveFundingRequest, onSuccess:refresh });
  const cancel = useMutation({ mutationFn:(id:string)=>cancelFundingRequest(id, 'Cancelled by operator'), onSuccess:refresh });
  const eligible = lots.data || [];
  const selectedLot = eligible.find((lot:any)=>lot.id===form.fundLotId);
  const selectableAccounts = selectedLot?.locationAdAccountId ? (accounts.data||[]).filter((account:any)=>account.id===selectedLot.locationAdAccountId) : (accounts.data||[]);
  return <div className="funding-panel">
    <div className="funding-toolbar"><div className="mr-auto"><div className="font-semibold">Funding requests</div><div className="funding-muted">Reserve an approved source before opening the Meta payment flow.</div></div><button disabled={!eligible.length} title={!eligible.length?'An admin must allocate client funds before a request can be created':undefined} className="meta-btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>setOpen(true)}><Plus className="w-3.5 h-3.5"/>New request</button></div>
    {(requests.error || lots.error) && <div className="p-3 text-xs text-rose-700 bg-rose-50">{errorText(requests.error || lots.error)}</div>}
    {requests.isLoading ? <div className="funding-empty">Loading requests...</div> : !eligible.length&&!requests.data?.length ? <div className="funding-empty"><div className="font-semibold text-[#344054] mb-1">No allocated funding source</div><div>An admin must allocate client wallet funds to an Ad Account first. That allocation creates the auditable fund lot used here.</div></div> : !requests.data?.length ? <div className="funding-empty">No funding requests yet. Create one before opening the Meta payment QR.</div> : <div className="funding-table-wrap"><table className="funding-table"><thead><tr><th>Reference</th><th>Purpose</th><th>Fund lot</th><th>Target account</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{requests.data.map((r:any)=><tr key={r.id}><td><div className="font-semibold">{r.referenceCode}</div><div className="funding-muted">{new Date(r.createdAt).toLocaleString()}</div></td><td>{r.purpose}</td><td>{r.fundLot?.lotCode || r.fundLotId}</td><td>{r.targetAdAccount?.name || 'Any eligible account'}</td><td className="funding-number font-semibold">{money(r.amountMinor)}</td><td><span className={`funding-status ${r.status==='APPROVED'?'good':r.status==='CANCELLED'?'bad':'warn'}`}>{String(r.status).toLowerCase().replace('_',' ')}</span></td><td className="text-right whitespace-nowrap">{r.status==='DRAFT'&&canApprove&&<button title="Approve request" className="meta-btn-secondary mr-1" onClick={()=>approve.mutate(r.id)}><Check className="w-3.5 h-3.5"/></button>}{['DRAFT','APPROVED','READY'].includes(r.status)&&<button title="Cancel request" className="meta-btn-ghost" onClick={()=>cancel.mutate(r.id)}><X className="w-3.5 h-3.5"/></button>}</td></tr>)}</tbody></table></div>}
    {open&&<div className="funding-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><form className="funding-dialog" onSubmit={e=>{e.preventDefault();create.mutate()}}><div className="p-4 border-b border-[#e4e7eb] flex justify-between"><div><div className="font-semibold">Create funding request</div><div className="funding-muted">Amounts are reserved only after mapping.</div></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close"><X className="w-4 h-4"/></button></div><div className="p-4 grid gap-3">
      <label className="text-xs font-semibold">Fund lot<select required className="funding-input w-full mt-1" value={form.fundLotId} onChange={e=>{const lot=eligible.find((item:any)=>item.id===e.target.value);setForm({...form,fundLotId:e.target.value,targetAdAccountId:lot?.locationAdAccountId||''})}}><option value="">Select available source</option>{eligible.map((l:any)=><option key={l.id} value={l.id}>{l.lotCode} · {money(l.availableAmountMinor)} · {l.locationAdAccount?.name||'Unassigned pool'}</option>)}</select></label>
      <label className="text-xs font-semibold">Amount in INR<input required min="1" step="0.01" type="number" className="funding-input w-full mt-1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
      <label className="text-xs font-semibold">Target Ad Account<select disabled={Boolean(selectedLot?.locationAdAccountId)} className="funding-input w-full mt-1 disabled:bg-slate-100" value={form.targetAdAccountId} onChange={e=>setForm({...form,targetAdAccountId:e.target.value})}><option value="">Any eligible account</option>{selectableAccounts.map((a:any)=><option key={a.id} value={a.id}>{a.name} · {a.metaAdAccountId}</option>)}</select><span className="funding-muted block mt-1">Allocated client lots stay linked to their assigned Ad Account.</span></label>
      <label className="text-xs font-semibold">Purpose<textarea required maxLength={240} className="funding-input w-full mt-1 py-2 min-h-20" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}/></label>
      {create.error&&<div className="text-xs text-rose-700">{errorText(create.error)}</div>}
    </div><div className="p-3 border-t border-[#e4e7eb] flex justify-end gap-2"><button type="button" className="meta-btn-secondary" onClick={()=>setOpen(false)}>Cancel</button><button disabled={create.isPending} className="meta-btn-primary">{create.isPending?'Creating...':'Create request'}</button></div></form></div>}
  </div>;
};
