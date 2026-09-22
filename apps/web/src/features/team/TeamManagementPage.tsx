import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsersApi,
  createUserApi,
  updateUserStatusApi,
  assignAdAccountsApi,
  deleteUserApi,
  fetchMetaAdAccounts,
  UserProfileDto
} from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useRealtimeEvent } from '../../lib/realtime';
import {
  UserPlus,
  Users,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Layers,
  Settings,
  X,
  Check,
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ModalDialog';

export const TeamManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADS_MANAGER' | 'FINANCE' | 'ADMIN'>('ALL');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<UserProfileDto | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'ADS_MANAGER' | 'FINANCE' | 'ADMIN'>('ADS_MANAGER');
  const [formError, setFormError] = useState('');

  // Queries
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsersApi()
  });

  const { data: allAdAccounts = [] } = useQuery({
    queryKey: ['meta-accounts-all'],
    queryFn: () => fetchMetaAdAccounts()
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to create user');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      updateUserStatusApi(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const assignAccountsMutation = useMutation({
    mutationFn: ({ userId, adAccountIds }: { userId: string; adAccountIds: string[] }) =>
      assignAdAccountsApi(userId, adAccountIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
      setSelectedUserForAssign(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUserApi(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['meta-accounts-all'] });
    }
  });

  // Real-time synchronization: refresh data instantly when any user is created/updated or Meta is synced
  useRealtimeEvent(['USERS_UPDATED', 'META_ASSETS_UPDATED'], () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['meta-accounts-all'] });
  });

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setFormError('All fields are required');
      return;
    }
    setFormError('');
    createUserMutation.mutate({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole
    });
  };

  const handleToggleStatus = (user: UserProfileDto) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const isSuspending = nextStatus === 'SUSPENDED';
    setConfirmDialog({
      isOpen: true,
      title: `${isSuspending ? 'Suspend' : 'Activate'} Team Member`,
      message: `Are you sure you want to ${isSuspending ? 'suspend' : 'activate'} access for "${user.name}" (${user.email})?`,
      variant: isSuspending ? 'danger' : 'info',
      onConfirm: () => {
        updateStatusMutation.mutate({ userId: user.id, status: nextStatus });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteUser = (user: UserProfileDto) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Team Member',
      message: `Are you sure you want to permanently delete "${user.name}" (${user.email})? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: () => {
        deleteUserMutation.mutate(user.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const isCurrentUserAdmin = currentUser?.role === 'ADMIN';

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const mediaBuyersCount = users.filter((u) => u.role === 'ADS_MANAGER').length;
  const financeCount = users.filter((u) => u.role === 'FINANCE').length;
  const adminsCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-4 pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#0a1317]">
              Team & Role Access
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 bg-[#f0f2f5] text-[#657383] rounded-full border border-[#e4e6eb]">
              {users.length} members
            </span>
          </div>
          <p className="text-xs text-[#657383] mt-0.5">
            Manage media buyer roles, finance officers, Facebook account bindings, and isolated scopes.
          </p>
        </div>

        {isCurrentUserAdmin && (
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Team Member</span>
          </button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0064e0] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#657383] uppercase tracking-wider">
              Media Buyers
            </div>
            <div className="text-lg font-bold text-[#0a1317] flex items-baseline gap-1.5 mt-0.5">
              <span>{mediaBuyersCount}</span>
              <span className="text-xs font-normal text-[#657383]">Active Operators</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#657383] uppercase tracking-wider">
              Finance Officers
            </div>
            <div className="text-lg font-bold text-[#0a1317] flex items-baseline gap-1.5 mt-0.5">
              <span>{financeCount}</span>
              <span className="text-xs font-normal text-[#657383]">Ledger & Treasury</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#657383] uppercase tracking-wider">
              Super Admins
            </div>
            <div className="text-lg font-bold text-[#0a1317] flex items-baseline gap-1.5 mt-0.5">
              <span>{adminsCount}</span>
              <span className="text-xs font-normal text-[#657383]">Global Visibility</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e4e6eb] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#657383] uppercase tracking-wider">
              Ad Accounts Pool
            </div>
            <div className="text-lg font-bold text-[#0a1317] flex items-baseline gap-1.5 mt-0.5">
              <span>{allAdAccounts.length}</span>
              <span className="text-xs font-normal text-[#657383]">Connected Assets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-[#e4e6eb] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#fafbfc]">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search member by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e4e6eb] rounded-lg text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-white border border-[#e4e6eb] rounded-lg p-0.5 text-xs font-medium">
              {(['ALL', 'ADS_MANAGER', 'FINANCE', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    roleFilter === r
                      ? 'bg-[#0064e0] text-white font-semibold shadow-xs'
                      : 'text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5]'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r === 'ADS_MANAGER' ? 'Ads Managers' : r === 'FINANCE' ? 'Finance' : 'Admins'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isUsersLoading ? (
          <div className="p-12 text-center text-xs text-[#657383]">
            <div className="w-6 h-6 border-2 border-[#0064e0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading team members...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#657383]">
            No team members matched your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#657383] font-semibold text-[11px] uppercase tracking-wider border-b border-[#e4e6eb]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ad Accounts Scope</th>
                  <th className="px-4 py-3">FB Connected</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const initials = u.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={u.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                      {/* Name & Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#f0f2f5] border border-[#e4e6eb] text-[#0a1317] font-semibold text-xs flex items-center justify-center shrink-0">
                            {initials || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#0a1317] flex items-center gap-1.5 truncate">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-blue-50 text-[#0064e0] border border-blue-200 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#657383] truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                            <Shield className="w-3 h-3" />
                            <span>Admin</span>
                          </span>
                        ) : u.role === 'FINANCE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Finance Controller</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-[#0064e0] border border-blue-200/60">
                            <Users className="w-3 h-3" />
                            <span>Ads Manager</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#0a1317] font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#657383] font-medium">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Ad Accounts Scope */}
                      <td className="px-4 py-3">
                        {u.role === 'ADMIN' ? (
                          <span className="text-xs font-medium text-purple-700 bg-purple-50/70 border border-purple-100 rounded-md px-2 py-0.5">
                            Global Access ({allAdAccounts.length} Accounts)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#0a1317] text-xs">
                              {u.assignedAccountsCount || 0} accounts
                            </span>
                            {u.assignedAccounts && u.assignedAccounts.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {u.assignedAccounts.slice(0, 2).map((acc) => (
                                  <span
                                    key={acc.id}
                                    className="text-[10px] px-1.5 py-0.5 bg-[#f0f2f5] border border-[#e4e6eb] text-[#475569] rounded truncate max-w-[110px]"
                                    title={acc.name}
                                  >
                                    {acc.name}
                                  </span>
                                ))}
                                {u.assignedAccounts.length > 2 && (
                                  <span className="text-[10px] text-[#657383] font-medium">
                                    +{u.assignedAccounts.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* FB Connected */}
                      <td className="px-4 py-3">
                        {u.connectedFacebookAccountsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Connected</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[#94a3b8]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isCurrentUserAdmin && !isCurrent && (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.role === 'ADS_MANAGER' && (
                              <button
                                onClick={() => setSelectedUserForAssign(u)}
                                className="px-2.5 py-1 bg-white hover:bg-[#f0f2f5] border border-[#e4e6eb] rounded-lg text-xs font-medium text-[#0a1317] transition-colors shadow-xs"
                              >
                                Manage Access
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 border rounded-lg text-xs font-medium transition-colors shadow-xs ${
                                u.status === 'ACTIVE'
                                  ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete user"
                              className="p-1 text-[#94a3b8] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Ads Manager */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#e4e6eb] w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e4e6eb] flex items-center justify-between bg-[#fafbfc]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0064e0] flex items-center justify-center border border-blue-100">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#0a1317]">
                    Add New Team Member
                  </h2>
                  <p className="text-[11px] text-[#657383]">
                    Create login credentials for media buyer or admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-[#657383] hover:text-[#0a1317] p-1 rounded-md hover:bg-[#f0f2f5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Media Buyer"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] placeholder-[#94a3b8] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Company Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rohit@metabull.internal"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] placeholder-[#94a3b8] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] placeholder-[#94a3b8] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0a1317]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a1317] mb-1">
                  Access Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-lg text-[#0a1317] focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] focus:outline-none transition-colors"
                >
                  <option value="ADS_MANAGER">Ads Manager (Media Buyer - Scoped View)</option>
                  <option value="FINANCE">Finance (Treasury, Ledger, Vendors & Reconciliation)</option>
                  <option value="ADMIN">Admin (Super Admin - Unlimited View)</option>
                </select>
                <p className="text-[11px] text-[#657383] mt-1">
                  Ads Managers only see their assigned & connected assets. Finance has full access to ledgers and treasury. Admins have global control.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e4e6eb]">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Ad Accounts to Ads Manager */}
      {selectedUserForAssign && (
        <AssignAccountsModal
          user={selectedUserForAssign}
          allAdAccounts={allAdAccounts}
          onClose={() => setSelectedUserForAssign(null)}
          onAssign={(adAccountIds) => {
            assignAccountsMutation.mutate({
              userId: selectedUserForAssign.id,
              adAccountIds
            });
          }}
          isSubmitting={assignAccountsMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

interface AssignAccountsModalProps {
  user: UserProfileDto;
  allAdAccounts: any[];
  onClose: () => void;
  onAssign: (adAccountIds: string[]) => void;
  isSubmitting: boolean;
}

const AssignAccountsModal: React.FC<AssignAccountsModalProps> = ({
  user,
  allAdAccounts,
  onClose,
  onAssign,
  isSubmitting
}) => {
  const initialSelected = new Set((user.assignedAccounts || []).map((a) => a.id));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelected);
  const [modalSearch, setModalSearch] = useState('');

  const toggleAccount = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredAccounts = useMemo(() => {
    if (!modalSearch.trim()) return allAdAccounts;
    const q = modalSearch.toLowerCase();
    return allAdAccounts.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.metaAdAccountId?.toLowerCase().includes(q) ||
        a.businessPortfolio?.name?.toLowerCase().includes(q)
    );
  }, [allAdAccounts, modalSearch]);

  const handleSelectAll = () => {
    if (selectedIds.size === allAdAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allAdAccounts.map((a) => a.id)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#e4e6eb] w-full max-w-lg rounded-xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#e4e6eb] flex items-center justify-between bg-[#fafbfc]">
          <div>
            <h2 className="text-sm font-semibold text-[#0a1317]">
              Manage Ad Account Access
            </h2>
            <p className="text-xs text-[#657383]">
              Assign ad accounts to <strong className="text-[#0a1317]">{user.name}</strong> ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#657383] hover:text-[#0a1317] p-1 rounded-md hover:bg-[#f0f2f5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Selection Bar */}
        <div className="p-3 border-b border-[#e4e6eb] bg-[#f8fafc] flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search ad account name or ID..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#e4e6eb] rounded-lg text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] transition-colors"
            />
          </div>

          <button
            onClick={handleSelectAll}
            className="text-xs font-semibold text-[#0064e0] hover:underline whitespace-nowrap"
          >
            {selectedIds.size === allAdAccounts.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Account List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#f0f2f5]">
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#657383]">
              No ad accounts found.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isChecked = selectedIds.has(acc.id);
              return (
                <label
                  key={acc.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isChecked ? 'bg-blue-50/50' : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAccount(acc.id)}
                      className="w-4 h-4 rounded text-[#0064e0] border-[#d1d5db] focus:ring-[#0064e0] cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#0a1317] truncate">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-[#657383] font-mono">
                        {acc.metaAdAccountId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                        acc.normalizedStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {acc.normalizedStatus}
                    </span>
                    <div className="text-[11px] font-medium text-[#0a1317] mt-0.5 font-mono">
                      ₹{(Number(acc.currentTrackedBalanceMinor || 0) / 100).toLocaleString('en-IN', {
                        minimumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-[#e4e6eb] flex items-center justify-between bg-[#fafbfc]">
          <span className="text-xs text-[#657383] font-medium">
            <strong className="text-[#0a1317]">{selectedIds.size}</strong> of {allAdAccounts.length} accounts selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-[#e4e6eb] text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onAssign(Array.from(selectedIds))}
              className="px-4 py-1.5 bg-[#0064e0] hover:bg-[#0052b8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
