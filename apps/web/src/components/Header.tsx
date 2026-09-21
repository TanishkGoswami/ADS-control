import React from 'react';
import { Search, Plus, RefreshCw, LogOut, User } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

interface HeaderProps {
  onRefresh?: () => void;
  openNewPaymentModal?: () => void;
  openCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, openNewPaymentModal, openCommandPalette }) => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="min-h-12 border-b border-[#d9e0e8] bg-white px-3 sm:px-4 flex items-center justify-between gap-3 sticky top-0 z-10">
      <div className="flex items-center gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={openCommandPalette}
          className="relative w-full bg-[#f5f6f7] border border-[#d9e0e8] rounded-none pl-8 pr-2.5 py-1.5 text-xs text-left text-[#5d6c7b] hover:border-[#c5ced8] flex items-center justify-between transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#8595a4] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <span className="truncate">Quick search or command...</span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.2 text-[9px] font-mono text-[#64748b] bg-white border border-[#d9e0e8] rounded-none">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefresh}
          className="meta-btn-ghost flex items-center gap-1.5"
          title="Trigger sync from Meta & refresh balances"
        >
          <RefreshCw className="w-3 h-3 text-[#64748b]" />
          <span className="hidden sm:inline">Sync Meta</span>
        </button>

        <button
          onClick={openNewPaymentModal}
          className="meta-btn-buy flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Post Entry</span>
        </button>

        <div className="hidden sm:block h-4 w-px bg-[#d9e0e8] mx-0.5" />

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-6 h-6 rounded-none bg-[#0a1317] flex items-center justify-center text-white font-bold text-[10px] font-mono">
            {initials}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-[11px] font-bold text-[#0a1317] leading-tight">
              {user?.name || 'User'}
            </div>
            <div className="text-[9px] text-[#64748b] font-mono leading-tight">
              {user?.role || 'ADS_MANAGER'}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1 text-[#64748b] hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
