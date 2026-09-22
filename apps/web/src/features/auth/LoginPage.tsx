import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  KeyRound,
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#eef2ff] font-sans antialiased selection:bg-[#0064e0] selection:text-white">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Ambient Glows */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-b from-[#38bdf8]/25 via-[#818cf8]/20 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-tl from-[#0064e0]/15 via-[#c084fc]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[30%] -left-[10%] w-[500px] h-[500px] bg-gradient-to-tr from-[#38bdf8]/20 to-transparent rounded-full blur-3xl" />

        {/* Ethereal Orbital Geometric Rings (matching reference image) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-white/50 pointer-events-none opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1050px] h-[1050px] rounded-full border border-white/40 pointer-events-none opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1350px] h-[1350px] rounded-full border border-white/30 pointer-events-none opacity-25" />
      </div>

      {/* Top Left Brand Header Pill */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 flex items-center gap-2.5 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0064e0] to-[#00a3ff] flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
          MB
        </div>
        <span className="text-xs font-bold text-[#0f172a] tracking-tight">
          MetaBull Universe
        </span>
        <span className="text-[10px] font-semibold text-[#0064e0] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
          Ads Control
        </span>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-[430px]">
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/90 rounded-[24px] shadow-[0_20px_50px_rgba(0,100,224,0.12),0_1px_3px_rgba(0,0,0,0.05)] p-7 sm:p-8 space-y-6">
          {/* Card Top Icon Emblem */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#f8fafc] to-white border border-white shadow-[0_8px_20px_rgba(0,100,224,0.15)] flex items-center justify-center text-[#0064e0]">
                <KeyRound className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0064e0] text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-2.5 h-2.5" />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
                Sign in with credentials
              </h1>
              <p className="text-xs text-[#64748b] mt-1 max-w-[300px] leading-relaxed">
                Access your real-time Meta ad accounts, cashflow ledger & campaign telemetry.
              </p>
            </div>
          </div>

          {/* Error Notification Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#334155]">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="name@metabull.com or username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-4 focus:ring-[#0064e0]/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#334155]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setError('Please contact your administrator to reset internal credentials.')}
                  className="text-[11px] text-[#0064e0] hover:underline font-medium"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0064e0] focus:ring-4 focus:ring-[#0064e0]/10 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0064e0] via-[#0072f5] to-[#0052cc] hover:from-[#0056c6] hover:to-[#0041a8] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick One-Click Sign In Roles */}
          <div className="pt-2 space-y-2.5">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#e2e8f0]/80 w-full" />
              <span className="bg-white/90 px-3 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider absolute">
                Quick Demo Access
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@metabull.com')}
                className="group p-2.5 rounded-xl bg-white/70 hover:bg-white border border-[#e2e8f0] hover:border-blue-300 hover:shadow-sm transition-all text-center cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0064e0] flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-[#0f172a] group-hover:text-[#0064e0]">Admin</div>
                <div className="text-[9px] text-[#64748b] leading-tight mt-0.5">Master View</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ads_manager_01')}
                className="group p-2.5 rounded-xl bg-white/70 hover:bg-white border border-[#e2e8f0] hover:border-blue-300 hover:shadow-sm transition-all text-center cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-[#0f172a] group-hover:text-[#0064e0]">Ads Lead</div>
                <div className="text-[9px] text-[#64748b] leading-tight mt-0.5">Campaigns</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('finance_ops')}
                className="group p-2.5 rounded-xl bg-white/70 hover:bg-white border border-[#e2e8f0] hover:border-blue-300 hover:shadow-sm transition-all text-center cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-[#0f172a] group-hover:text-[#0064e0]">Finance</div>
                <div className="text-[9px] text-[#64748b] leading-tight mt-0.5">Reconciliation</div>
              </button>
            </div>
          </div>

          {/* Security & Legal Footer */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#94a3b8] border-t border-[#f1f4f7]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit Encrypted</span>
            </div>
            <div className="flex items-center gap-2 font-sans">
              <Link to="/privacy" className="text-[#64748b] hover:text-[#0064e0] hover:underline transition-colors">Privacy</Link>
              <span>·</span>
              <Link to="/terms" className="text-[#64748b] hover:text-[#0064e0] hover:underline transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
