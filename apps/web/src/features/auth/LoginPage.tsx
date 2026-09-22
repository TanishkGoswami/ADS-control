import React, { useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Wallet
} from 'lucide-react';
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#f5f6f7] font-sans antialiased text-[#0f172a]">
      {/* Top Left Brand Header */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 flex items-center gap-3 bg-white px-4 py-2 rounded-[5px] border border-[#eaedf1]">
        <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
        <span className="text-sm font-bold text-[#0f172a] tracking-tight">
          MetaBull Universe
        </span>
        <span className="text-xs font-semibold text-[#0064e0] bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200/60">
          Ads Control
        </span>
      </div>

      {/* Main Login Card (Matching project style: rounded-[5px], no heavy shadow, clean border) */}
      <div className="w-full max-w-[420px] bg-white border border-[#eaedf1] rounded-[5px] p-6 sm:p-7 space-y-5">
        {/* Card Header with Prominent Logo */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="We Are Agency Logo"
            className="h-16 w-auto object-contain mb-3"
          />
          <h1 className="text-base font-bold text-[#0f172a] tracking-tight">
            Sign in with credentials
          </h1>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="p-2.5 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#334155]">
              Email or Username
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
                placeholder="name@metabull.com or username"
                className="w-full pl-8 pr-3 py-2 bg-white border border-[#eaedf1] rounded-[5px] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
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
                className="w-full pl-8 pr-8 py-2 bg-white border border-[#eaedf1] rounded-[5px] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-1 focus:ring-[#0064e0] transition-colors"
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
            className="w-full py-2 px-4 bg-[#0064e0] hover:bg-[#0052b8] text-white rounded-[5px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick One-Click Sign In Roles */}
        <div className="pt-2 border-t border-[#f1f4f7] space-y-2">
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider text-center">
            Quick Demo Access
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@metabull.com')}
              className="p-2 rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#eaedf1] transition-colors text-center cursor-pointer"
            >
              <div className="w-5 h-5 rounded-[4px] bg-blue-50 text-[#0064e0] flex items-center justify-center mx-auto mb-1">
                <Zap className="w-3 h-3" />
              </div>
              <div className="text-[11px] font-bold text-[#0f172a]">Admin</div>
              <div className="text-[9px] text-[#64748b]">Master View</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('ads_manager_01')}
              className="p-2 rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#eaedf1] transition-colors text-center cursor-pointer"
            >
              <div className="w-5 h-5 rounded-[4px] bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-3 h-3" />
              </div>
              <div className="text-[11px] font-bold text-[#0f172a]">Ads Lead</div>
              <div className="text-[9px] text-[#64748b]">Campaigns</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('finance_ops')}
              className="p-2 rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#eaedf1] transition-colors text-center cursor-pointer"
            >
              <div className="w-5 h-5 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                <Wallet className="w-3 h-3" />
              </div>
              <div className="text-[11px] font-bold text-[#0f172a]">Finance</div>
              <div className="text-[9px] text-[#64748b]">Reconciliation</div>
            </button>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="pt-2 flex items-center justify-center text-[11px] text-[#94a3b8] border-t border-[#f1f4f7]">
          <div className="flex items-center gap-2 font-sans">
            <Link to="/privacy" className="text-[#64748b] hover:text-[#0064e0] hover:underline transition-colors">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="text-[#64748b] hover:text-[#0064e0] hover:underline transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
