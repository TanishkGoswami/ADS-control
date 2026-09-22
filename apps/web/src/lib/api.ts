import axios from 'axios';
import { SWRCache } from './swr-cache';
import {
  DashboardMetricsDto,
  AdAccountDto,
  ClientDto,
  VendorDto,
  FinancialLedgerTransactionDto,
  AlertDto,
  CreateClientInput,
  RecordClientPaymentInput,
  CreateVendorInput,
  RecordVendorFundingBatchInput,
  RecordVendorRepaymentInput,
  LeftoverResolutionAction
} from '@ads-control/shared';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let handlingUnauthorized = false;
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !handlingUnauthorized && !String(error.config?.url || '').includes('/auth/login')) {
      handlingUnauthorized = true;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
      queueMicrotask(() => { handlingUnauthorized = false; });
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  organization: {
    id: string;
    name: string;
    slug: string;
    defaultCurrency: string;
  };
}

export const loginApi = async (input: { emailOrUsername: string; password?: string }): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/auth/login', input);
  return res.data;
};

export const getCurrentUserApi = async (): Promise<AuthUser> => {
  const res = await apiClient.get<AuthUser>('/auth/me');
  return res.data;
};

export type FundingActivityQuery = { page?: number; pageSize?: number; status?: string; reviewState?: string; search?: string; accountId?: string; source?: string; from?: string; to?: string; readyForReview?: 'true' };
export const fetchFundingEligibility = async () => (await apiClient.get('/meta-funding/eligibility')).data;
export const fetchFundingRequests = async () => (await apiClient.get('/meta-funding/requests')).data;
export const createFundingRequest = async (input: { fundLotId: string; targetAdAccountId?: string; amountMinor: string; currencyCode: 'INR'; purpose: string }) => (await apiClient.post('/meta-funding/requests', input)).data;
export const approveFundingRequest = async (id: string) => (await apiClient.post(`/meta-funding/requests/${id}/approve`)).data;
export const cancelFundingRequest = async (id: string, reason?: string) => (await apiClient.post(`/meta-funding/requests/${id}/cancel`, { reason })).data;
export const createExtensionPairing = async () => (await apiClient.post('/auth/extension/pairing')).data;
export const fetchExtensionDevices = async () => (await apiClient.get('/meta-funding/devices')).data;
export const revokeExtensionDevice = async (id: string) => (await apiClient.delete(`/meta-funding/devices/${id}`)).data;
export const fetchFundingActivity = async (query: FundingActivityQuery) => (await apiClient.get('/meta-funding/activity', { params: query })).data;
export const fetchFundingSession = async (id: string) => (await apiClient.get(`/meta-funding/sessions/${id}`)).data;
export const reviewFundingSession = async (id: string, decision: 'CONFIRM' | 'REJECT', reason?: string) => (await apiClient.patch(`/meta-funding/sessions/${id}/review`, { decision, reason })).data;

// Dashboard Metrics Query with Instant SWR Cache
export const fetchDashboardMetrics = async (userId?: string, forceRefresh = false): Promise<DashboardMetricsDto> => {
  const cacheKey = `dashboard-metrics:${userId || 'ALL'}`;
  return SWRCache.fetch(
    cacheKey,
    async () => {
      try {
        const res = await apiClient.get<DashboardMetricsDto>('/reports/dashboard-metrics', {
          params: userId && userId !== 'ALL' ? { userId } : {}
        });
        return res.data;
      } catch (err) {
        return {
          totalAdAccounts: 0,
          activeAdAccounts: 0,
          restrictedAdAccounts: 0,
          totalClientFundsMinor: '0',
          totalVendorPayablesMinor: '0',
          totalVendorReceivablesMinor: '0',
          totalLockedFundsMinor: '0',
          agencyFreePoolMinor: '0',
          todaySpendMinor: '0',
          unresolvedDiscrepanciesCount: 0,
          openAlertsCount: 0
        };
      }
    },
    { forceRefresh, ttl: 45000 }
  );
};

// Users & Team Management APIs
export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  assignedAccountsCount: number;
  connectedFacebookAccountsCount: number;
  assignedAccounts: Array<{
    id: string;
    metaAdAccountId: string;
    name: string;
    alias?: string;
    status: string;
    balanceINR: string;
    accessRole: string;
  }>;
  metaConnections: Array<{
    id: string;
    internalName: string;
    connectionStatus: string;
    lastSuccessfulSyncAt?: string;
  }>;
}

export const fetchUsersApi = async (): Promise<UserProfileDto[]> => {
  try {
    const res = await apiClient.get<UserProfileDto[]>('/users');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
};

export const createUserApi = async (data: { name: string; email: string; password: string; role?: string }) => {
  const res = await apiClient.post<UserProfileDto>('/users', data);
  return res.data;
};

export const updateUserStatusApi = async (userId: string, status: string) => {
  const res = await apiClient.patch(`/users/${userId}/status`, { status });
  return res.data;
};

export const assignAdAccountsApi = async (userId: string, adAccountIds: string[], accessRole = 'OWNER') => {
  const res = await apiClient.post(`/users/${userId}/assign-accounts`, { adAccountIds, accessRole });
  return res.data;
};

export const removeAdAccountAccessApi = async (userId: string, adAccountId: string) => {
  const res = await apiClient.delete(`/users/${userId}/accounts/${adAccountId}`);
  return res.data;
};

export const deleteUserApi = async (userId: string) => {
  const res = await apiClient.delete(`/users/${userId}`);
  return res.data;
};

// Clients APIs with Instant SWR Cache
export const fetchClients = async (forceRefresh = false): Promise<ClientDto[]> => {
  return SWRCache.fetch(
    'clients:list',
    async () => {
      try {
        const res = await apiClient.get<any[]>('/clients');
        if (res.data && Array.isArray(res.data)) {
          return res.data.map((c) => ({
            id: c.id,
            organizationId: c.organizationId,
            clientReference: c.clientReference,
            name: c.name,
            companyName: c.companyName || '',
            email: c.email || '',
            phone: c.phone || '',
            status: c.status,
            walletBalanceMinor: c.wallet?.balanceMinor?.toString() || '0',
            totalPaidMinor: c.totalPaidMinor?.toString() || '0',
            totalAllocatedMinor: c.totalAllocatedMinor?.toString() || '0',
            totalSpentMinor: '0',
            totalLockedMinor: c.totalLockedMinor?.toString() || '0',
            jobsCount: c.jobsCount || 0,
            allocationsCount: c.allocationsCount || 0,
            jobs: c.jobs || [],
            payments: c.payments || [],
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
          }));
        }
        return [];
      } catch (err) {
        return [];
      }
    },
    { forceRefresh, ttl: 45000 }
  );
};

export const createClientApi = async (input: CreateClientInput) => {
  SWRCache.invalidate('clients');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/clients', { client: input });
  return res.data;
};

export const recordClientPaymentApi = async (input: RecordClientPaymentInput) => {
  SWRCache.invalidate('clients');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/clients/payments', { payment: input });
  return res.data;
};

export const allocateClientFundToJobApi = async (input: {
  clientId: string;
  clientJobId: string;
  adAccountId: string;
  amountRupees: number;
}) => {
  SWRCache.invalidate('clients');
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/allocations/allocate-job', input);
  return res.data;
};

export const allocateClientFundBatchApi = async (input: {
  clientId: string;
  jobCode: string;
  jobTitle?: string;
  allocations: Array<{ adAccountId: string; amountRupees: number }>;
}) => {
  SWRCache.invalidate('clients');
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/allocations/allocate-job-batch', input);
  return res.data;
};

export const adjustAllocationApi = async (
  allocationId: string,
  action: 'TOP_UP' | 'REFUND',
  amountRupees: number
) => {
  SWRCache.invalidate('clients');
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post(`/allocations/${allocationId}/adjust`, { action, amountRupees });
  return res.data;
};

export const resolveLeftoverApi = async (id: string, action: LeftoverResolutionAction, targetJobId?: string) => {
  SWRCache.invalidate('clients');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post(`/allocations/leftovers/${id}/resolve`, { action, targetJobId });
  return res.data;
};

export const handleAdAccountRestrictionApi = async (adAccountId: string) => {
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post(`/allocations/accounts/${adAccountId}/handle-restriction`, {});
  return res.data;
};

// Vendors APIs with Instant SWR Cache
export const fetchVendors = async (forceRefresh = false): Promise<VendorDto[]> => {
  return SWRCache.fetch(
    'vendors:list',
    async () => {
      try {
        const res = await apiClient.get<any[]>('/vendors');
        if (res.data && Array.isArray(res.data)) {
          return res.data.map((v) => {
            const totalFunded = v.fundingBatches?.reduce((acc: bigint, b: any) => acc + BigInt(b.principalAmountMinor), 0n) || 0n;
            const totalRepaid = v.fundingBatches?.reduce((acc: bigint, b: any) => acc + BigInt(b.repaidAmountMinor), 0n) || 0n;
            const outstandingPayable = totalFunded > totalRepaid ? totalFunded - totalRepaid : 0n;
            const totalReceivable = v.receivables?.reduce((acc: bigint, r: any) => acc + BigInt(r.amountMinor), 0n) || 0n;

            return {
              id: v.id,
              organizationId: v.organizationId,
              vendorReference: v.vendorReference,
              name: v.name,
              email: v.email || '',
              phone: v.phone || '',
              status: v.status,
              totalFundedMinor: totalFunded.toString(),
              totalRepaidMinor: totalRepaid.toString(),
              outstandingPayableMinor: outstandingPayable.toString(),
              outstandingReceivableMinor: totalReceivable.toString(),
              createdAt: v.createdAt,
              updatedAt: v.updatedAt
            };
          });
        }
        return [];
      } catch (err) {
        return [];
      }
    },
    { forceRefresh, ttl: 45000 }
  );
};

export const createVendorApi = async (input: CreateVendorInput) => {
  SWRCache.invalidate('vendors');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/vendors', input);
  return res.data;
};

export const recordVendorFundingBatchApi = async (input: RecordVendorFundingBatchInput) => {
  SWRCache.invalidate('vendors');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/vendors/batches', input);
  return res.data;
};

export const recordVendorRepaymentApi = async (input: RecordVendorRepaymentInput) => {
  SWRCache.invalidate('vendors');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/vendors/repayments', input);
  return res.data;
};

// Meta Marketing Graph APIs with Instant SWR Cache
export const fetchMetaAdAccounts = async (userId?: string, forceRefresh = false): Promise<AdAccountDto[]> => {
  const cacheKey = `meta-ad-accounts:${userId || 'ALL'}`;
  return SWRCache.fetch(
    cacheKey,
    async () => {
      try {
        const res = await apiClient.get<any[]>('/meta/accounts', {
          params: userId && userId !== 'ALL' ? { userId } : {}
        });
        if (res.data && Array.isArray(res.data)) {
          return res.data.map((a) => ({
            id: a.id,
            organizationId: a.organizationId,
            metaAdAccountId: a.metaAdAccountId,
            name: a.name,
            internalAlias: a.internalAlias || '',
            currencyCode: a.currencyCode,
            normalizedStatus: a.normalizedStatus,
            canRunAds: a.canRunAds,
            currentTrackedBalanceMinor: a.currentTrackedBalanceMinor?.toString() || '0',
            allocatedFundsMinor: a.fundLots?.filter((l: any) => l.status === 'ALLOCATED').reduce((sum: bigint, l: any) => sum + BigInt(l.currentAmountMinor), 0n).toString() || '0',
            lockedFundsMinor: a.fundLots?.filter((l: any) => l.status === 'LOCKED').reduce((sum: bigint, l: any) => sum + BigInt(l.currentAmountMinor), 0n).toString() || '0',
            availableAgencyBalanceMinor: '0',
            businessPortfolio: a.businessPortfolio,
            userAccess: a.userAccess || [],
            lastStatusSyncAt: a.lastStatusSyncAt,
            lastSpendSyncAt: a.lastSpendSyncAt,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
          }));
        }
        return [];
      } catch (err) {
        return [];
      }
    },
    { forceRefresh, ttl: 45000 }
  );
};

export const fetchAdAccountDetailsApi = async (id: string) => {
  try {
    const res = await apiClient.get(`/meta/accounts/${id}`);
    return res.data;
  } catch (err) {
    return null;
  }
};

export const triggerMetaSyncApi = async (userId?: string) => {
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/meta/sync', {}, {
    params: userId && userId !== 'ALL' ? { userId } : {}
  });
  return res.data;
};

export const fetchMetaConnectionsApi = async (userId?: string, forceRefresh = false) => {
  const cacheKey = `meta-connections:${userId || 'ALL'}`;
  return SWRCache.fetch(
    cacheKey,
    async () => {
      try {
        const res = await apiClient.get<any[]>('/meta/connections', {
          params: userId && userId !== 'ALL' ? { userId } : {}
        });
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
    { forceRefresh, ttl: 45000 }
  );
};

export const fetchMetaOAuthUrlApi = async (redirectUri?: string, state?: string) => {
  const res = await apiClient.get<{ url: string }>('/meta/oauth/url', {
    params: { redirectUri, state }
  });
  return res.data;
};

export const exchangeMetaOAuthCodeApi = async (code: string, redirectUri?: string, userId?: string) => {
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post('/meta/oauth/exchange', {}, {
    params: { code, redirectUri, userId }
  });
  return res.data;
};

export const disconnectMetaConnectionApi = async (connectionId: string, userId?: string) => {
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.post(`/meta/connections/${connectionId}/disconnect`, {}, {
    params: userId ? { userId } : {}
  });
  return res.data;
};

export const deleteMetaConnectionApi = async (connectionId: string) => {
  SWRCache.invalidate('meta');
  SWRCache.invalidate('dashboard');
  const res = await apiClient.delete(`/meta/connections/${connectionId}`);
  return res.data;
};

// Financial Double-Entry Ledger APIs
export const fetchLedgerAccounts = async () => {
  try {
    const res = await apiClient.get<any[]>('/finance/ledger/accounts');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
};

export const fetchLedgerTransactions = async (): Promise<FinancialLedgerTransactionDto[]> => {
  try {
    const res = await apiClient.get<any[]>('/finance/ledger/transactions');
    if (res.data && Array.isArray(res.data)) {
      return res.data.map((tx) => ({
        id: tx.id,
        organizationId: tx.organizationId,
        transactionCode: tx.transactionCode,
        transactionType: tx.transactionType,
        description: tx.description,
        totalAmountMinor: tx.totalAmountMinor?.toString() || '0',
        currencyCode: tx.currencyCode,
        postedAt: tx.postedAt,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        entries: tx.entries?.map((e: any) => ({
          id: e.id,
          transactionId: e.transactionId,
          accountId: e.accountId,
          accountName: e.account?.accountCode || 'ACCOUNT',
          entryType: e.entryType,
          amountMinor: e.amountMinor?.toString() || '0',
          currencyCode: e.currencyCode,
          createdAt: e.createdAt
        })) || []
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
};

export const postManualJournalTransactionApi = async (input: {
  transactionType: any;
  description: string;
  entries: { accountCode: string; entryType: any; amountMinor: string }[];
}) => {
  const res = await apiClient.post('/finance/ledger/transaction', input);
  return res.data;
};

export const reverseTransactionApi = async (id: string, reason: string) => {
  const res = await apiClient.post(`/finance/ledger/transaction/${id}/reverse`, { reason });
  return res.data;
};

// Reconciliation APIs
export const fetchReconciliationSnapshots = async () => {
  try {
    const res = await apiClient.get<any[]>('/reconciliation/snapshots');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
};

export const runReconciliationApi = async () => {
  const res = await apiClient.post('/reconciliation/run');
  return res.data;
};

// Alerts & Incidents APIs
export const fetchAlerts = async (severity?: string, status?: string): Promise<AlertDto[]> => {
  try {
    const res = await apiClient.get<any[]>('/alerts', {
      params: {
        ...(severity && severity !== 'ALL' ? { severity } : {}),
        ...(status && status !== 'ALL' ? { status } : {})
      }
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
};

export const evaluateAlertsApi = async () => {
  const res = await apiClient.post('/alerts/evaluate');
  return res.data;
};

export const updateAlertStatusApi = async (id: string, status: string) => {
  const res = await apiClient.patch(`/alerts/${id}/status`, { status });
  return res.data;
};

export const acknowledgeAlertApi = async (id: string) => {
  const res = await apiClient.post(`/alerts/${id}/acknowledge`);
  return res.data;
};

export const resolveAlertApi = async (id: string) => {
  const res = await apiClient.post(`/alerts/${id}/resolve`);
  return res.data;
};

export const clearResolvedAlertsApi = async () => {
  const res = await apiClient.post('/alerts/clear-resolved');
  return res.data;
};

// Audit Trail APIs
export interface AuditLogDto {
  id: string;
  organizationId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const fetchAuditLogsApi = async (limit = 100): Promise<AuditLogDto[]> => {
  try {
    const res = await apiClient.get<AuditLogDto[]>('/audit/logs', {
      params: { limit }
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
};
