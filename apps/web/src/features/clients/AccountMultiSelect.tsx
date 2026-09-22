import React, { useMemo, useState } from 'react';
import { Check, Search, X, CheckSquare, Square, Building2, Wallet } from 'lucide-react';
import type { AdAccountDto } from '@ads-control/shared';
import { formatINR } from '@ads-control/shared';

interface Props {
  accounts: AdAccountDto[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

type FilterTab = 'all' | 'selected' | 'with_balance' | 'zero_balance';

export const AccountMultiSelect: React.FC<Props> = ({ accounts, selectedIds, onChange }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('ALL');

  // Filter only accounts that can run ads and are active
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.canRunAds && account.normalizedStatus === 'ACTIVE'),
    [accounts]
  );

  // Extract unique portfolios
  const portfolios = useMemo(() => {
    const map = new Map<string, string>();
    activeAccounts.forEach((acc) => {
      if (acc.businessPortfolio?.id && acc.businessPortfolio?.name) {
        map.set(acc.businessPortfolio.id, acc.businessPortfolio.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [activeAccounts]);

  // Apply search query, filter tabs, and portfolio filter
  const filteredAccounts = useMemo(() => {
    let list = activeAccounts;

    // Portfolio filter
    if (selectedPortfolio !== 'ALL') {
      list = list.filter((acc) => acc.businessPortfolio?.id === selectedPortfolio);
    }

    // Tab filter
    if (activeTab === 'selected') {
      list = list.filter((acc) => selectedIds.includes(acc.id));
    } else if (activeTab === 'with_balance') {
      list = list.filter((acc) => BigInt(acc.currentTrackedBalanceMinor || 0) > 0n);
    } else if (activeTab === 'zero_balance') {
      list = list.filter((acc) => BigInt(acc.currentTrackedBalanceMinor || 0) <= 0n);
    }

    // Search query filter
    const term = query.trim().toLowerCase();
    if (!term) return list;

    return list.filter((account) => {
      const name = account.name.toLowerCase();
      const alias = (account.internalAlias || '').toLowerCase();
      const metaId = account.metaAdAccountId.toLowerCase();
      const rawMetaId = metaId.replace(/^act_/, '');
      const portfolioName = (account.businessPortfolio?.name || '').toLowerCase();
      return (
        name.includes(term) ||
        alias.includes(term) ||
        metaId.includes(term) ||
        rawMetaId.includes(term) ||
        portfolioName.includes(term)
      );
    });
  }, [activeAccounts, activeTab, selectedPortfolio, query, selectedIds]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredAccounts.map((a) => a.id);
    const newSelected = Array.from(new Set([...selectedIds, ...filteredIds]));
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const allFilteredSelected =
    filteredAccounts.length > 0 && filteredAccounts.every((acc) => selectedIds.includes(acc.id));

  return (
    <div className="border border-[#d9e0e8] bg-white rounded-[5px] overflow-hidden flex flex-col">
      {/* Search & Top Action Bar */}
      <div className="p-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] space-y-2">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#64748b]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, alias, account ID, or ending digits..."
              className="w-full h-8 pl-8 pr-8 border border-[#cbd5e1] rounded-[4px] bg-white text-xs text-[#0a1317] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-2 text-[#94a3b8] hover:text-[#0a1317]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Portfolio Filter Dropdown if multiple */}
          {portfolios.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#64748b]" />
              <select
                value={selectedPortfolio}
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                className="h-8 px-2 border border-[#cbd5e1] rounded-[4px] bg-white text-xs text-[#0a1317] focus:outline-none focus:border-[#0064e0]"
              >
                <option value="ALL">All Portfolios ({activeAccounts.length})</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Pills & Bulk Selection Actions */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#1c1e21] text-white'
                  : 'bg-white text-[#475569] border border-[#d9e0e8] hover:bg-[#f1f5f9]'
              }`}
            >
              All Active ({activeAccounts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('selected')}
              className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors ${
                activeTab === 'selected'
                  ? 'bg-[#0064e0] text-white'
                  : 'bg-white text-[#475569] border border-[#d9e0e8] hover:bg-[#f1f5f9]'
              }`}
            >
              Selected ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('with_balance')}
              className={`hidden sm:inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors ${
                activeTab === 'with_balance'
                  ? 'bg-[#1c1e21] text-white'
                  : 'bg-white text-[#475569] border border-[#d9e0e8] hover:bg-[#f1f5f9]'
              }`}
            >
              With Balance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('zero_balance')}
              className={`hidden sm:inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors ${
                activeTab === 'zero_balance'
                  ? 'bg-[#1c1e21] text-white'
                  : 'bg-white text-[#475569] border border-[#d9e0e8] hover:bg-[#f1f5f9]'
              }`}
            >
              Zero Balance
            </button>
          </div>

          <div className="flex items-center gap-2">
            {filteredAccounts.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={allFilteredSelected}
                className="text-[11px] text-[#0064e0] hover:text-[#0457cb] font-semibold disabled:opacity-40 disabled:pointer-events-none"
              >
                {allFilteredSelected ? 'All visible selected' : `Select visible (${filteredAccounts.length})`}
              </button>
            )}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-[#dc2626] hover:text-red-700 font-semibold"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account List Items */}
      <div className="max-h-56 overflow-y-auto divide-y divide-[#f1f5f9] p-1">
        {filteredAccounts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748b]">
            No ad accounts found matching your filter criteria.
          </div>
        ) : (
          filteredAccounts.map((account) => {
            const isSelected = selectedIds.includes(account.id);
            const balancePaise = BigInt(account.currentTrackedBalanceMinor || 0);
            const endingDigits = account.metaAdAccountId.replace(/^act_/, '').slice(-4);

            return (
              <div
                key={account.id}
                onClick={() => toggle(account.id)}
                className={`group flex items-center justify-between gap-3 p-2 rounded-[4px] cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50/70 border border-blue-200'
                    : 'hover:bg-[#f8fafc] border border-transparent'
                }`}
              >
                {/* Checkbox & Account Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(account.id);
                    }}
                    className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#0064e0] border-[#0064e0] text-white'
                        : 'border-[#94a3b8] bg-white group-hover:border-[#64748b]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-[#0a1317] truncate">
                        {account.internalAlias || account.name}
                      </span>
                      {account.internalAlias &&
                        account.internalAlias.trim().toLowerCase() !== account.name.trim().toLowerCase() && (
                        <span className="text-[10px] text-[#64748b] bg-[#f1f5f9] px-1 py-0.2 rounded">
                          {account.name}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded">
                        ending {endingDigits}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#64748b]">
                      {account.businessPortfolio?.name && (
                        <span>{account.businessPortfolio.name} ·</span>
                      )}
                      <span className="text-emerald-700 font-medium">Active</span>
                    </div>
                  </div>
                </div>

                {/* Balance & Selection Indicator */}
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono font-semibold text-[#0a1317] flex items-center justify-end gap-1">
                    <Wallet className="w-3 h-3 text-[#64748b]" />
                    <span>{formatINR(balancePaise)}</span>
                  </div>
                  <span className="text-[9px] text-[#64748b] uppercase tracking-wider">Current balance</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
        <span>
          Showing {filteredAccounts.length} of {activeAccounts.length} active ad accounts
        </span>
        <span className="font-semibold text-[#0a1317]">
          {selectedIds.length} account{selectedIds.length === 1 ? '' : 's'} selected
        </span>
      </div>
    </div>
  );
};
