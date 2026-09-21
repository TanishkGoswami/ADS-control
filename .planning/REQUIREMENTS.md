# System Requirements

## 1. Asset & Hierarchy Management
- **REQ-META-01**: Maintain Meta hierarchy: `MetaConnection` -> `BusinessPortfolio` -> `AdAccount` -> `MetaCampaign`.
- **REQ-META-02**: Store both raw Meta status and normalized internal status (`ACTIVE`, `RESTRICTED`, `DISABLED`, `PENDING_REVIEW`, `UNKNOWN`).
- **REQ-META-03**: Preserve asset relationship histories (ownership changes, portfolio movements) with date ranges.
- **REQ-META-04**: Sync campaign-level daily spend facts with source timestamps and idempotent deduplication.

## 2. Client Operations & Budgets
- **REQ-CLIENT-01**: Maintain Client profiles, contacts, agreements, and payment records.
- **REQ-CLIENT-02**: Separate client service fees from advertising funds (only ads funds enter client wallets).
- **REQ-CLIENT-03**: Support Client Jobs with budget envelopes, target dates, and explicit Ad Account allocations.
- **REQ-CLIENT-04**: Client Leftover Resolution: Unused funds remain client-owned and can be returned to wallet, allocated to a new job, or refunded upon approval.

## 3. Vendor Funding & Settlements
- **REQ-VENDOR-01**: Record Vendor funding as discrete funding batches (e.g. `RAM-RF-001`) with currency, principal amount, and repayment schedules.
- **REQ-VENDOR-02**: Track incoming client collections assigned for vendor repayment.
- **REQ-VENDOR-03**: Vendor Overpayment Protection: When repayments exceed batch balance, automatically record a `VendorReceivable` asset.

## 4. Financial Ledger & Fund Lot Tracking
- **REQ-LEDGER-01**: Double-entry bookkeeping engine (`sum(debit) == sum(credit)`) for all financial events.
- **REQ-LEDGER-02**: BigInt minor units (paise) for all monetary fields.
- **REQ-LEDGER-03**: Immutable posted transactions; corrections must execute through reversal transactions.
- **REQ-LEDGER-04**: Fund Lot lifecycle: Track every money lot with `SOURCE`, `OWNER`, `PURPOSE`, `LOCATION`, and `STATUS` (`AVAILABLE`, `ALLOCATED`, `SPENT`, `LOCKED`, `REFUND_PENDING`, `REFUNDED`).

## 5. Three-Way Truth Reconciliation
- **REQ-RECON-01**: Periodically compare Meta Truth (Meta API spend & balance) vs Ledger Truth (posted double-entry accounts) vs Business Truth (Fund Lot allocations).
- **REQ-RECON-02**: Detect Unattributed Spend, Missing Allocations, Balance Divergences, and Ambiguous Mappings.
- **REQ-RECON-03**: Generate immutable reconciliation snapshots and resolution workflows.

## 6. Alerts & Audit System
- **REQ-ALERT-01**: Rule-driven alert evaluation for `ACCOUNT_RESTRICTED`, `LOW_BALANCE`, `VENDOR_OVERPAYMENT`, `FUNDING_GAP`, `SYNC_FAILURE`.
- **REQ-ALERT-02**: Multi-channel alert dispatch (In-App notifications, Realtime push, optional Webhooks).
- **REQ-AUDIT-01**: Comprehensive audit logging recording actor, entity, action, before/after diffs, and timestamp.

## 7. User Interface & Frontend (React + TypeScript)
- **REQ-UI-01**: Executive Dashboard with real-time KPIs, Cashflow & Spend trends, and Account health summary.
- **REQ-UI-02**: Meta Hierarchy Explorer with interactive drilldown and ad-account level financial breakdowns.
- **REQ-UI-03**: Client Control Center with wallet balances, job management, and leftover resolution dialogs.
- **REQ-UI-04**: Vendor Hub with funding batches, settlement timeline, and receivable claims.
- **REQ-UI-05**: Ledger & Fund Lot Stream with rich filtering, date selectors, and export capabilities.
- **REQ-UI-06**: Reconciliation Workbench for reviewing and resolving 3-way discrepancies.

## 8. Meta Funding Capture
- **REQ-TOPUP-01**: Detect Meta billing amount, currency, QR presence, and Ad Account context without modifying Meta controls or payment behavior.
- **REQ-TOPUP-02**: Cross-check URL-derived account IDs against visible Meta page/modal context before automatic mapping.
- **REQ-TOPUP-03**: Map a top-up to either an approved Funding Request or an eligible direct Fund Lot with server-side tenant, permission, currency, and balance validation.
- **REQ-TOPUP-04**: Store idempotent top-up sessions and append-only event history; preserve detected and selected accounts separately.
- **REQ-TOPUP-05**: Treat Meta UI success as an observation requiring review; do not automatically post ledger entries in the pilot.
- **REQ-TOPUP-06**: Pair and revoke extension devices using short-lived, organization-bound credentials.
