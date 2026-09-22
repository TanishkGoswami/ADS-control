import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Users,
  Building2,
  BookOpenCheck,
  Scale,
  Bell,
  History,
  UserCog
  ,WalletCards
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../features/auth/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  adminOnly?: boolean;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Meta Assets', href: '/meta', icon: Layers, roles: ['ADMIN', 'ADS_MANAGER'] },
  { name: 'Meta Funding', href: '/meta-funding', icon: WalletCards, roles: ['ADMIN', 'FINANCE', 'ADS_MANAGER'] },
  { name: 'Clients & Wallets', href: '/clients', icon: Users, roles: ['ADMIN', 'FINANCE', 'ADS_MANAGER'] },
  { name: 'Team & Users', href: '/team', icon: UserCog, badge: 'Admin', adminOnly: true },
  { name: 'Vendors & Credit', href: '/vendors', icon: Building2, badge: 'Receivable', roles: ['ADMIN', 'FINANCE'] },
  { name: 'Financial Ledger', href: '/finance', icon: BookOpenCheck, roles: ['ADMIN', 'FINANCE'] },
  { name: 'Reconciliation', href: '/reconciliation', icon: Scale, roles: ['ADMIN', 'FINANCE'] },
  { name: 'Alert Center', href: '/alerts', icon: Bell },
  { name: 'Audit Trail', href: '/audit', icon: History, roles: ['ADMIN', 'FINANCE'] }
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Filter items based on user role
  const visibleNavItems = navItems.filter((item) => (!item.adminOnly || isAdmin) && (!item.roles || item.roles.includes(user?.role || '')));

  return (
    <aside className="w-[222px] bg-white border-r border-[#d9e0e8] hidden md:flex flex-col h-screen select-none relative z-20">
      <div className="h-12 px-3.5 border-b border-[#d9e0e8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-none bg-[#0064e0] flex items-center justify-center text-white font-bold text-xs">
            M
          </div>
          <span className="font-bold text-xs text-[#0a1317]">ADS CONTROL</span>
        </div>
        <span className="text-[10px] font-mono px-1 py-0.2 rounded-none bg-[#f1f4f7] text-[#475569] border border-[#d9e0e8]">
          {user?.role || 'OPERATOR'}
        </span>
      </div>

      <div className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8595a4]">
          {isAdmin ? 'Agency Operations' : user?.role === 'FINANCE' ? 'Finance & Treasury' : 'Media Buyer Workspace'}
        </div>
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-none text-xs font-medium transition-colors group',
                isActive
                  ? 'bg-[#1c1e21] text-white font-semibold'
                  : 'text-[#475569] hover:text-[#0a1317] hover:bg-[#f1f4f7]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <item.icon
                    className={cn(
                      'w-3.5 h-3.5 transition-colors shrink-0',
                      isActive ? 'text-white' : 'text-[#8595a4] group-hover:text-[#0a1317]'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-mono px-1 py-0.2 rounded-none border font-semibold shrink-0',
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-[#f1f4f7] text-[#475569] border-[#d9e0e8]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-2.5 border-t border-[#d9e0e8] bg-[#f5f6f7] text-[10px] font-mono text-[#64748b] space-y-0.5">
        <div className="flex items-center justify-between text-[#0a1317] font-sans font-semibold">
          <span>Role:</span>
          <span
            className={
              isAdmin
                ? 'text-purple-700 font-bold'
                : user?.role === 'FINANCE'
                ? 'text-emerald-700 font-bold'
                : 'text-blue-700 font-bold'
            }
          >
            {user?.role || 'ADS_MANAGER'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>User:</span>
          <span className="truncate max-w-[120px] text-[#0a1317]">{user?.name || 'Operator'}</span>
        </div>
      </div>
    </aside>
  );
};
