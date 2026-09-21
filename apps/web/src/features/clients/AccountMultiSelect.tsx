import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { AdAccountDto } from '@ads-control/shared';

interface Props {
  accounts: AdAccountDto[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const AccountMultiSelect: React.FC<Props> = ({ accounts, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.canRunAds && account.normalizedStatus === 'ACTIVE'),
    [accounts]
  );
  const visibleAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return activeAccounts;
    return activeAccounts.filter((account) =>
      `${account.name} ${account.internalAlias || ''} ${account.metaAdAccountId}`.toLowerCase().includes(term)
    );
  }, [activeAccounts, query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full min-h-10 px-3 py-2 border border-[#cbd5e1] bg-white flex items-center justify-between gap-2 text-left focus:outline-none focus:border-[#0064e0]"
      >
        <span className={selectedIds.length ? 'text-[#0a1317] font-semibold' : 'text-[#64748b]'}>
          {selectedIds.length ? `${selectedIds.length} account${selectedIds.length === 1 ? '' : 's'} selected` : 'Search and select active accounts'}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#cbd5e1] shadow-xl">
          <div className="p-2 border-b border-[#e2e8f0]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#64748b]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or account ID"
                className="w-full h-9 pl-8 pr-8 border border-[#cbd5e1] text-xs focus:outline-none focus:border-[#0064e0]"
              />
              {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-2.5" aria-label="Clear search"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[#64748b]">Only active accounts can receive funds</span>
              <button type="button" className="text-[#0064e0] font-semibold" onClick={() => onChange(visibleAccounts.map((account) => account.id))}>Select visible</button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {visibleAccounts.map((account) => {
              const checked = selectedIds.includes(account.id);
              return (
                <button key={account.id} type="button" onClick={() => toggle(account.id)} className="w-full px-2 py-2 flex items-center gap-2 hover:bg-[#f1f5f9] text-left">
                  <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${checked ? 'bg-[#0064e0] border-[#0064e0] text-white' : 'border-[#94a3b8]'}`}>{checked && <Check className="w-3 h-3" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold truncate">{account.internalAlias || account.name}</span>
                    <span className="block text-[10px] text-[#64748b] truncate">{account.name} · ending {account.metaAdAccountId.replace(/^act_/, '').slice(-4)}</span>
                  </span>
                  <span className="text-[10px] text-emerald-700">Active</span>
                </button>
              );
            })}
            {!visibleAccounts.length && <div className="p-5 text-center text-xs text-[#64748b]">No active accounts match this search.</div>}
          </div>
        </div>
      )}
    </div>
  );
};
