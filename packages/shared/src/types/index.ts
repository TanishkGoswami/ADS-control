import {
  MoneyStatus,
  FundOwnerType,
  TransactionType,
  AdAccountNormalizedStatus,
  AlertSeverity,
  AlertStatus,
  UserRole,
  LeftoverResolutionAction,
  ReconciliationStatus,
  EntryType
} from '../enums/index.js';
import type {
  FinancialReviewState,
  FundingRequestStatus,
  TopupConfidence,
  TopupFundingSourceType,
  TopupOperationalState,
  TopupReservationStatus
} from '../enums/index.js';

export interface BaseEntity {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrganizationDto extends BaseEntity {
  name: string;
  slug: string;
  defaultCurrency: string;
  timezone: string;
}

export interface UserProfileDto extends BaseEntity {
  organizationId: string;
  authUserId: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export type SessionKind = 'WEB' | 'EXTENSION';

export interface AuthPrincipal {
  userId: string;
  organizationId: string;
  role: string;
  sessionKind: SessionKind;
  deviceId?: string;
}

export interface ExtensionPairingClaim {
  code: string;
  deviceName: string;
  extensionVersion: string;
}

export interface MetaConnectionDto extends BaseEntity {
  organizationId: string;
  internalName: string;
  externalContextId?: string;
  connectionStatus: string;
  lastSuccessfulSyncAt?: string | Date;
  portfoliosCount?: number;
  adAccountsCount?: number;
}

export interface BusinessPortfolioDto extends BaseEntity {
  organizationId: string;
  metaBusinessId: string;
  name: string;
  status: string;
  adAccountsCount?: number;
}

export interface AdAccountDto extends BaseEntity {
  organizationId: string;
  businessPortfolioId?: string;
  metaAdAccountId: string;
  name: string;
  internalAlias?: string;
  currencyCode: string;
  timezoneName?: string;
  normalizedStatus: AdAccountNormalizedStatus;
  canRunAds: boolean;
  lowBalanceThresholdMinor?: string | bigint;
  currentTrackedBalanceMinor: string | bigint;
  allocatedFundsMinor: string | bigint;
  lockedFundsMinor: string | bigint;
  availableAgencyBalanceMinor: string | bigint;
  businessPortfolio?: { id: string; name: string; metaBusinessId?: string };
  userAccess?: any[];
  lastStatusSyncAt?: string | Date;
  lastSpendSyncAt?: string | Date;
}

export interface ClientDto extends BaseEntity {
  organizationId: string;
  clientReference: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  status: string;
  walletBalanceMinor: string | bigint;
  totalPaidMinor: string | bigint;
  totalAllocatedMinor: string | bigint;
  totalSpentMinor: string | bigint;
  totalLockedMinor: string | bigint;
  jobsCount?: number;
  allocationsCount?: number;
}

export interface ClientJobDto extends BaseEntity {
  organizationId: string;
  clientId: string;
  clientName?: string;
  jobCode: string;
  title: string;
  plannedBudgetMinor: string | bigint;
  actualSpendMinor: string | bigint;
  unusedBalanceMinor: string | bigint;
  status: string;
  targetAdAccountId?: string;
}

export interface VendorDto extends BaseEntity {
  organizationId: string;
  vendorReference: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  totalFundedMinor: string | bigint;
  totalRepaidMinor: string | bigint;
  outstandingPayableMinor: string | bigint;
  outstandingReceivableMinor: string | bigint;
}

export interface VendorFundingBatchDto extends BaseEntity {
  organizationId: string;
  vendorId: string;
  vendorName?: string;
  batchCode: string;
  principalAmountMinor: string | bigint;
  repaidAmountMinor: string | bigint;
  outstandingBalanceMinor: string | bigint;
  currencyCode: string;
  status: string;
  receivedDate: string | Date;
  repaymentDueDate?: string | Date;
}

export interface FundLotDto extends BaseEntity {
  organizationId: string;
  lotCode: string;
  ownerType: FundOwnerType;
  ownerId: string;
  ownerName?: string;
  initialAmountMinor: string | bigint;
  currentAmountMinor: string | bigint;
  status: MoneyStatus;
  locationAdAccountId?: string;
  adAccountName?: string;
  currencyCode: string;
}

export interface FinancialLedgerEntryDto {
  id: string;
  transactionId: string;
  accountId: string;
  accountName?: string;
  entryType: EntryType;
  amountMinor: string | bigint;
  currencyCode: string;
  createdAt: string | Date;
}

export interface FinancialLedgerTransactionDto extends BaseEntity {
  organizationId: string;
  transactionCode: string;
  transactionType: TransactionType;
  description: string;
  referenceEntity?: string;
  referenceId?: string;
  totalAmountMinor: string | bigint;
  currencyCode: string;
  postedAt: string | Date;
  entries?: FinancialLedgerEntryDto[];
}

export interface AlertDto extends BaseEntity {
  organizationId: string;
  alertType: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  entityType?: string;
  entityId?: string;
  metadataJson?: Record<string, any>;
}

export interface ReconciliationSnapshotDto extends BaseEntity {
  organizationId: string;
  adAccountId: string;
  adAccountName?: string;
  snapshotDate: string | Date;
  metaReportedBalanceMinor: string | bigint;
  ledgerBalanceMinor: string | bigint;
  allocatedLotsSumMinor: string | bigint;
  varianceMinor: string | bigint;
  status: ReconciliationStatus;
  discrepancyReasons?: string[];
}

export interface DashboardMetricsDto {
  totalAdAccounts: number;
  activeAdAccounts: number;
  restrictedAdAccounts: number;
  totalClientFundsMinor: string | bigint;
  totalVendorPayablesMinor: string | bigint;
  totalVendorReceivablesMinor: string | bigint;
  totalLockedFundsMinor: string | bigint;
  agencyFreePoolMinor: string | bigint;
  todaySpendMinor: string | bigint;
  unresolvedDiscrepanciesCount: number;
  openAlertsCount: number;
}

export type MinorUnitString = `${bigint}`;

export type TopupFundingSource =
  | { type: TopupFundingSourceType.FUNDING_REQUEST | 'FUNDING_REQUEST'; fundingRequestId: string }
  | { type: TopupFundingSourceType.FUND_LOT | 'FUND_LOT'; fundLotId: string };

export interface FundingRequestDto extends BaseEntity {
  organizationId: string;
  referenceCode: string;
  amountMinor: MinorUnitString;
  currencyCode: 'INR';
  purpose: string;
  fundLotId: string;
  targetAdAccountId?: string;
  status: FundingRequestStatus;
  approvedByUserId?: string;
  approvedAt?: string | Date;
  cancelledAt?: string | Date;
}

export interface MetaTopupSessionDto extends BaseEntity {
  organizationId: string;
  actorUserId: string;
  extensionDeviceId?: string;
  idempotencyKey: string;
  detectedAdAccountId?: string;
  selectedAdAccountId?: string;
  detectedMetaAccountId?: string;
  visibleMetaAccountId?: string;
  detectedAmountMinor?: MinorUnitString;
  selectedAmountMinor?: MinorUnitString;
  currencyCode: 'INR';
  fundingSource: TopupFundingSource;
  confidence: TopupConfidence;
  operationalState: TopupOperationalState;
  financialReviewState: FinancialReviewState;
  detectorVersion: string;
  expiresAt: string | Date;
}

export interface MetaTopupEventDto {
  id: string;
  organizationId: string;
  sessionId: string;
  sequence: number;
  eventType: string;
  idempotencyKey: string;
  actorUserId?: string;
  extensionDeviceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string | Date;
}

export interface TopupReservationDto extends BaseEntity {
  organizationId: string;
  sessionId: string;
  fundLotId: string;
  fundingRequestId?: string;
  amountMinor: MinorUnitString;
  currencyCode: 'INR';
  status: TopupReservationStatus;
  expiresAt: string | Date;
  releasedAt?: string | Date;
  confirmedAt?: string | Date;
}
