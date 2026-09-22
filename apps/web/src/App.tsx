import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MetaAssetsPage } from './features/meta/MetaAssetsPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { VendorsPage } from './features/vendors/VendorsPage';
import { LedgerPage } from './features/finance/LedgerPage';
import { ReconciliationPage } from './features/reconciliation/ReconciliationPage';
import { AlertsPage } from './features/alerts/AlertsPage';
import { AuditPage } from './features/audit/AuditPage';
import { TeamManagementPage } from './features/team/TeamManagementPage';
import { MetaCallbackPage } from './features/meta/MetaCallbackPage';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { LegalPage } from './features/legal/LegalPage';
import { triggerMetaSyncApi } from './lib/api';

const MetaFundingPage = lazy(() => import('./features/meta-funding/MetaFundingPage').then((module) => ({ default: module.MetaFundingPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false
    }
  }
});

import { NotificationModal } from './components/ModalDialog';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotification, setSyncNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const isAdmin = user?.role === 'ADMIN';
  const isFinance = user?.role === 'FINANCE';
  const isAdsManager = user?.role === 'ADS_MANAGER';
  const canAccessFinance = isAdmin || isFinance;
  const canAccessMetaAssets = isAdmin || isAdsManager;
  const canManageFunding = isAdmin || isFinance || isAdsManager;
  const canManageClients = isAdmin || isFinance || isAdsManager;

  if (location.pathname.startsWith('/auth/meta/callback')) {
    return <MetaCallbackPage />;
  }

  if (location.pathname === '/privacy') {
    return <LegalPage type="privacy" />;
  }

  if (location.pathname === '/terms') {
    return <LegalPage type="terms" />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerMetaSyncApi(user?.id);
      window.location.reload();
    } catch (err: any) {
      setSyncNotification({
        isOpen: true,
        title: 'Sync Failed',
        message: err?.response?.data?.message || err.message || 'Could not synchronize Meta assets',
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f6f7] text-[#0a1317] overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f6f7]">
        <Header
          onRefresh={handleSync}
          openNewPaymentModal={() => setIsPaletteOpen(true)}
          openCommandPalette={() => setIsPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 max-w-[1260px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/meta" element={canAccessMetaAssets ? <MetaAssetsPage /> : <Navigate to="/" replace />} />
            <Route path="/meta-funding" element={canManageFunding ? <Suspense fallback={<div className="text-xs text-[#657383] py-8 text-center">Loading Meta funding...</div>}><MetaFundingPage /></Suspense> : <Navigate to="/" replace />} />
            <Route path="/team" element={isAdmin ? <TeamManagementPage /> : <Navigate to="/" replace />} />
            <Route path="/clients" element={canManageClients ? <ClientsPage /> : <Navigate to="/" replace />} />
            <Route path="/vendors" element={canAccessFinance ? <VendorsPage /> : <Navigate to="/" replace />} />
            <Route path="/finance" element={canAccessFinance ? <LedgerPage /> : <Navigate to="/" replace />} />
            <Route path="/reconciliation" element={canAccessFinance ? <ReconciliationPage /> : <Navigate to="/" replace />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/audit" element={canAccessFinance ? <AuditPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onTriggerSync={handleSync}
      />

      <NotificationModal
        isOpen={syncNotification.isOpen}
        title={syncNotification.title}
        message={syncNotification.message}
        type={syncNotification.type}
        onClose={() => setSyncNotification((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
