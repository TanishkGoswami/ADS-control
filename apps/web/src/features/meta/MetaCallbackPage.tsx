import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, ShieldCheck, Check, Layers } from 'lucide-react';
import { exchangeMetaOAuthCodeApi, fetchMetaOAuthUrlApi } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

export const MetaCallbackPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resultData, setResultData] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const code = searchParams.get('code');
  const error = searchParams.get('error_description') || searchParams.get('error');
  const stateUserId = searchParams.get('state') || user?.id;

  // Ref guard to prevent double-execution in React 18 StrictMode
  const exchangeStartedRef = useRef(false);

  useEffect(() => {
    if (error) {
      setStatus('ERROR');
      setErrorMessage(error);
      return;
    }

    if (!code || code === 'null' || code === 'undefined') {
      setStatus('ERROR');
      setErrorMessage('No valid authorization code was returned from Facebook Login.');
      return;
    }

    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;

    const exchangeCode = async () => {
      try {
        const redirectUri = window.location.origin + '/auth/meta/callback';
        const res = await exchangeMetaOAuthCodeApi(code, redirectUri, stateUserId);
        setResultData(res);
        setStatus('SUCCESS');
        setTimeout(() => {
          navigate('/meta');
        }, 1800);
      } catch (err: any) {
        setStatus('ERROR');
        const detailedMsg = err?.response?.data?.message || err.message || 'OAuth exchange failed';
        setErrorMessage(detailedMsg);
      }
    };

    exchangeCode();
  }, [code, error, navigate, stateUserId]);

  const handleRetryAuth = async () => {
    try {
      setIsRetrying(true);
      const redirectUri = window.location.origin + '/auth/meta/callback';
      const { url } = await fetchMetaOAuthUrlApi(redirectUri, user?.id);
      window.location.href = url;
    } catch (e: any) {
      setIsRetrying(false);
      setErrorMessage(e?.response?.data?.message || e?.message || 'Failed to initialize Facebook OAuth');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f5f6f7] text-[#0a1317] font-sans select-none">
      <div className="w-full max-w-md bg-white border border-[#e4e6eb] rounded-xl shadow-sm p-6 space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 pb-2 border-b border-[#f0f2f5]">
          <div className="w-7 h-7 bg-[#0064e0] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
            M
          </div>
          <span className="text-sm font-semibold text-[#0a1317] tracking-tight">
            MetaBull ADS Control
          </span>
        </div>

        {/* LOADING STATE */}
        {status === 'LOADING' && (
          <div className="py-6 text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#0064e0] border-t-transparent animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[#0a1317] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0064e0]" />
                Connecting Facebook Account...
              </h2>
              <p className="text-xs text-[#657383] max-w-xs mx-auto leading-relaxed">
                Verifying token and syncing your Meta Business Portfolios & Ad Accounts.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'SUCCESS' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto rounded-full shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[#0a1317]">
                Connected Successfully!
              </h2>
              <p className="text-xs text-[#657383]">
                Connected as <strong className="text-[#0a1317] font-semibold">{resultData?.user?.name || 'Facebook User'}</strong>
              </p>
            </div>

            <div className="bg-[#f7f8fa] border border-[#e4e6eb] rounded-lg p-3 text-xs text-[#657383] space-y-1 text-left">
              <div className="flex items-center gap-2 text-[#0a1317] font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Portfolios & Ad Accounts mapped</span>
              </div>
              <div className="flex items-center gap-2 text-[#0a1317] font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live balance & ledger synchronized</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/meta')}
              className="w-full py-2 px-4 bg-[#0064e0] hover:bg-[#0052b8] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>Go to Meta Assets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'ERROR' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto rounded-full shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[#0a1317]">
                Connection Could Not Be Completed
              </h2>
              <p className="text-xs text-[#657383]">
                Meta authorization did not return a valid session.
              </p>
            </div>

            <div className="bg-rose-50/50 border border-rose-200/80 rounded-lg p-3 text-left">
              <p className="text-[11px] text-rose-700 leading-relaxed break-words font-mono">
                {errorMessage}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRetryAuth}
                disabled={isRetrying}
                className="flex-1 py-2 px-3 bg-[#0064e0] hover:bg-[#0052b8] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isRetrying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Try Connecting Again</span>
              </button>
              <button
                onClick={() => navigate('/meta')}
                className="py-2 px-3 bg-white hover:bg-[#f7f8fa] text-[#0a1317] border border-[#d1d5db] rounded-lg text-xs font-medium transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
