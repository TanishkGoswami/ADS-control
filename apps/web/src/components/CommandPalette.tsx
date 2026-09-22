import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Layers,
  Users,
  Building2,
  BookOpenCheck,
  Scale,
  Bell,
  History,
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';

import { useAuth } from '../features/auth/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSync?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onTriggerSync
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawNavigationItems = [
    { name: 'Executive Dashboard', path: '/', icon: LayoutDashboard, category: 'Navigation', roles: ['ADMIN', 'FINANCE', 'ADS_MANAGER'] },
    { name: 'Meta Assets & Portfolios', path: '/meta', icon: Layers, category: 'Navigation', roles: ['ADMIN', 'ADS_MANAGER'] },
    { name: 'Client Control & Wallets', path: '/clients', icon: Users, category: 'Navigation', roles: ['ADMIN', 'FINANCE', 'ADS_MANAGER'] },
    { name: 'Vendor Credit & Overpayment', path: '/vendors', icon: Building2, category: 'Navigation', roles: ['ADMIN', 'FINANCE'] },
    { name: 'Immutable Financial Ledger', path: '/finance', icon: BookOpenCheck, category: 'Navigation', roles: ['ADMIN', 'FINANCE'] },
    { name: 'Three-Way Reconciliation', path: '/reconciliation', icon: Scale, category: 'Navigation', roles: ['ADMIN', 'FINANCE'] },
    { name: 'Incident & Alert Command', path: '/alerts', icon: Bell, category: 'Navigation', roles: ['ADMIN', 'FINANCE', 'ADS_MANAGER'] },
    { name: 'Audit Trail & Event Stream', path: '/audit', icon: History, category: 'Navigation', roles: ['ADMIN', 'FINANCE'] }
  ];

  const navigationItems = rawNavigationItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  const actionItems = [
    {
      name: 'Sync Meta Marketing Graph',
      action: () => {
        onTriggerSync?.();
        onClose();
      },
      icon: RefreshCw,
      category: 'Actions'
    },
    {
      name: 'Jump to Post Journal Entry',
      action: () => {
        navigate('/finance');
        onClose();
      },
      icon: Plus,
      category: 'Actions'
    },
    {
      name: 'Jump to Record Client Payment',
      action: () => {
        navigate('/clients');
        onClose();
      },
      icon: Plus,
      category: 'Actions'
    },
    {
      name: 'Run Three-Way Truth Reconciliation',
      action: () => {
        navigate('/reconciliation');
        onClose();
      },
      icon: Scale,
      category: 'Actions'
    }
  ];

  const filteredNav = navigationItems.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actionItems.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/35 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-none border border-[#d9e0e8] shadow-xl overflow-hidden animate-in fade-in duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3 border-b border-[#d9e0e8] flex items-center gap-2 bg-[#f5f6f7]">
          <Search className="w-4 h-4 text-[#64748b] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or action... (Esc to close)"
            className="w-full bg-transparent text-xs text-[#0a1317] placeholder:text-[#94a3b8] focus:outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-[#8595a4] bg-white border border-[#d9e0e8] rounded-none">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 divide-y divide-[#eef1f4]">
          {/* Nav items */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider font-bold text-[#94a3b8]">
                Navigation
              </div>
              {filteredNav.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-none hover:bg-[#f1f4f7] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#0064e0]" />
                    <span className="text-xs font-medium text-[#0a1317]">{item.name}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Action items */}
          {filteredActions.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider font-bold text-[#94a3b8]">
                Quick Actions
              </div>
              {filteredActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="w-full flex items-center justify-between p-2 rounded-none hover:bg-[#f1f4f7] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <action.icon className="w-3.5 h-3.5 text-[#0064e0]" />
                    <span className="text-xs font-medium text-[#0a1317]">{action.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#0064e0] font-bold">Action</span>
                </button>
              ))}
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <div className="p-6 text-center text-xs text-[#94a3b8]">
              No matching commands or pages found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2 border-t border-[#d9e0e8] bg-[#f5f6f7] flex items-center justify-between text-[10px] text-[#64748b] font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation & Actions</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 bg-white border border-[#d9e0e8]">↵</kbd> to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
