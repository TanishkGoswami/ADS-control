import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setError('Please enter your company email or username');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(emailOrUsername.trim(), password.trim());
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (roleIdentifier: string, defaultPass = 'demo123') => {
    setEmailOrUsername(roleIdentifier);
    setPassword(defaultPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#0a1317] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-[420px] bg-white border border-[#d9e0e8] rounded-[6px] shadow-sm p-6 space-y-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-[#d9e0e8] pb-4">
          <div className="w-8 h-8 rounded-[4px] bg-[#0064e0] text-white flex items-center justify-center font-bold text-xs tracking-wider font-mono shadow-sm">
            MB
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#0a1317] uppercase tracking-tight">
              MetaBull Universe
            </h1>
            <span className="text-[11px] text-[#64748b] block">
              In-House Ads & Financial Management
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-sm font-bold text-[#0a1317]">System Sign In</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Enter your credentials to access your ad accounts and ledger.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-2.5 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#334155]">
              Company Email / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#94a3b8]">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="e.g. admin@metabull.com or ads_manager_01"
                className="w-full pl-8 pr-3 py-2 bg-white border border-[#d9e0e8] rounded-[4px] text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#334155]">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#94a3b8]">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-9 py-2 bg-white border border-[#d9e0e8] rounded-[4px] text-xs text-[#0a1317] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#94a3b8] hover:text-[#475569] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-[#0064e0] hover:bg-[#0052b8] text-white rounded-[4px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer pt-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick One-Click Sign In Chips */}
        <div className="pt-3 border-t border-[#f1f4f7] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#64748b]">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#94a3b8]">
              Quick Sign In:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-left">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@metabull.com')}
              className="p-2 rounded-[4px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#0064e0]">Admin</div>
              <div className="text-[10px] text-[#64748b]">Full Ledger</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('ads_manager_01')}
              className="p-2 rounded-[4px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#0064e0]">Ads Lead</div>
              <div className="text-[10px] text-[#64748b]">Campaigns</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('finance_ops')}
              className="p-2 rounded-[4px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#0064e0]">Finance</div>
              <div className="text-[10px] text-[#64748b]">Reconciliation</div>
            </button>
          </div>
        </div>

        {/* Security & Legal Footer */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-[#94a3b8] font-mono border-t border-[#f1f4f7]">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Session</span>
          </div>
          <div className="flex items-center gap-2 font-sans">
            <Link to="/privacy" className="text-[#64748b] hover:text-[#0064e0] hover:underline">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="text-[#64748b] hover:text-[#0064e0] hover:underline">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
