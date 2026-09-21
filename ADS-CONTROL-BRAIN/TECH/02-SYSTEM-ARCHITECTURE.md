# System Architecture

## Overview

Ye document Ads Control system ki complete high-level architecture define karta hai.

System ek:

```text
Financial Control
+
Meta Ads Operations
+
Fund Tracking
+
Vendor Settlement
+
Reconciliation
```

platform hai.

Architecture ka primary objective:

```text
Financial correctness

Strong traceability

Clear module boundaries

Failure isolation

Secure integrations

Scalable background processing

Simple production operations
```

Core principle:

> **The application may be eventually consistent with external systems such as Meta, but internal financial posting must always be transactionally consistent.**

---

# 1. Architecture Style

Recommended:

```text
MODULAR MONOLITH
+
SEPARATE BACKGROUND WORKERS
+
SINGLE CANONICAL POSTGRESQL DATABASE
```

---

# 2. Why Modular Monolith

System ke major domains closely related hain:

```text
Clients

Vendors

Ledger

Fund Allocations

Refunds

Reconciliation

Meta Spend
```

Inke beech strong transactional relationships hain.

Therefore V1 me microservices unnecessary complexity create karenge.

---

# 3. High-Level Architecture

```text
Users
  ↓
Browser
  ↓
Next.js Web Application
  ↓
NestJS API
  ↓
Domain Modules
  ↓
PostgreSQL
```

Background work:

```text
Scheduler / Domain Events
        ↓
       Redis
        ↓
      BullMQ
        ↓
      Workers
        ↓
PostgreSQL / Meta API / Storage
```

---

# 4. External Systems

Main external dependencies:

```text
Meta Marketing API

Supabase Auth

Supabase PostgreSQL

Supabase Storage

Supabase Realtime

Sentry
```

Optional:

```text
Cloudflare
```

---

# 5. Production Deployment View

```text
                Internet
                   │
                   ▼
             Cloudflare
               Optional
                   │
                   ▼
                 Nginx
          ┌────────┴────────┐
          ▼                 ▼
      Next.js Web       NestJS API
                              │
                  ┌───────────┼────────────┐
                  ▼           ▼            ▼
             PostgreSQL     Redis       Storage
                  │           │
                  │           ▼
                  │        BullMQ
                  │           │
                  │           ▼
                  │        Workers
                  │           │
                  └───────────┼───────────┐
                              ▼           ▼
                         Meta API     Reconciliation
```

---

# 6. Logical Layers

System ko six major layers me divide karein:

```text
1. Presentation Layer

2. API / Application Layer

3. Domain Layer

4. Persistence Layer

5. Async Processing Layer

6. External Integration Layer
```

---

# 7. Presentation Layer

Technology:

```text
Next.js
```

Responsibilities:

```text
User interface

Forms

Tables

Filters

Dashboard

Client-side interaction

Realtime UI refresh

Permissions-aware rendering
```

---

# 8. Presentation Layer Must Not

Frontend must not:

```text
Calculate canonical balances

Directly mutate ledger

Store Meta secrets

Decide financial approval

Bypass backend validation
```

---

# 9. API / Application Layer

Technology:

```text
NestJS
```

Responsibilities:

```text
Authentication verification

Authorization

Input validation

Use-case orchestration

Domain service calls

Database transaction boundaries

API response formatting
```

---

# 10. Domain Layer

Contains business logic.

Major domains:

```text
Meta

Clients

Vendors

Ledger

Funds

Approvals

Reconciliation

Alerts

Audit

Reports
```

---

# 11. Persistence Layer

Primary:

```text
PostgreSQL
```

Contains canonical:

```text
Business data

Financial data

Meta normalized data

Mappings

Audit

Reconciliation cases

Alerts

Approvals
```

---

# 12. Async Processing Layer

Technology:

```text
BullMQ
+
Redis
```

Used for:

```text
Meta synchronization

Spend backfill

Reconciliation

Report generation

Notifications

Snapshots

Periodic checks
```

---

# 13. External Integration Layer

Contains adapters for:

```text
Meta Marketing API

Supabase Storage

Future email

Future bank/payment systems
```

---

# 14. Core Rule

Domain modules should not call external systems directly everywhere.

Use adapters/services.

Example:

```text
Meta Domain
↓
MetaApiClient
↓
Meta API
```

---

# 15. Request Flow

Normal read:

```text
Browser
↓
Next.js
↓
NestJS
↓
Authorization
↓
Query Service
↓
PostgreSQL
↓
Response
```

---

# 16. Financial Write Flow

Example Client Payment:

```text
Browser
↓
POST /client-payments
↓
NestJS
↓
Validate User
↓
Validate Permission
↓
Validate Client
↓
Begin DB Transaction
↓
Create Payment
↓
Create Ledger Transaction
↓
Create Ledger Entries
↓
Create Fund Lot
↓
Write Audit / Outbox
↓
Commit
↓
Return Success
```

---

# 17. Financial Write Atomicity

All related records must succeed together.

Example:

```text
Client Payment
+
Ledger
+
Fund Lot
```

must never partially commit.

---

# 18. Failure Example

If fund lot creation fails:

```text
ROLLBACK
```

Payment must not remain posted without matching ledger/allocation state.

---

# 19. Vendor Settlement Flow

```text
Request
↓
Authorization
↓
Approval Check
↓
Begin Transaction
↓
Lock Vendor Financial State
↓
Calculate Open Payable
↓
Calculate Valid Repayment
↓
Calculate Excess
↓
Create Settlement
↓
Create Ledger Entries
↓
Allocate Funding Batches
↓
Create Vendor Receivable if needed
↓
Audit
↓
Outbox
↓
Commit
```

---

# 20. Vendor Settlement Concurrency

Before posting:

```text
SELECT ... FOR UPDATE
```

relevant vendor/batch records.

This prevents:

```text
Two users settling same payable simultaneously
```

---

# 21. Fund Allocation Flow

```text
Request allocation
↓
Check owner
↓
Check source availability
↓
Lock source allocations/lots
↓
Validate amount
↓
Create allocation event
↓
Update current derived allocation state
↓
Audit
↓
Commit
```

---

# 22. Ledger Architecture

Recommended:

```text
General Ledger
+
Fund Allocation Subledger
```

---

# 23. General Ledger Responsibility

Answers:

```text
What financial event occurred?

Which accounts were debited?

Which accounts were credited?

What liability/asset changed?
```

---

# 24. Fund Allocation Responsibility

Answers:

```text
Whose money?

Which source?

Which client/job?

Which Ad Account?

Available / locked / consumed?
```

---

# 25. Do Not Merge Them

A single giant table combining:

```text
Debit

Credit

Client

Campaign

Locked

Meta status
```

would create fragile coupling.

Keep financial accounting and operational allocation separate but linked.

---

# 26. Three Truth Architecture

System recognizes:

```text
META TRUTH

LEDGER TRUTH

BUSINESS TRUTH
```

---

# 27. Meta Truth

Source:

```text
Meta Marketing API
```

Examples:

```text
Account status

Campaign identity

Meta spend

Insights
```

---

# 28. Ledger Truth

Source:

```text
Posted Ledger Transactions
```

Examples:

```text
Client funds received

Vendor funding

Vendor repayment

Refund payment

Receivable
```

---

# 29. Business Truth

Source:

```text
Internal mappings

Fund allocations

Client jobs

Ownership transfers
```

Examples:

```text
Client A owns ₹10,000

Campaign X belongs to JOB-001

₹5,000 is locked
```

---

# 30. Reconciliation Layer

Connects all three truths.

```text
Meta
  ↘
   Reconciliation
  ↗
Ledger + Business
```

---

# 31. Reconciliation Is Separate Domain

Do not embed reconciliation logic directly in:

```text
Meta worker

Client service

Vendor controller
```

Use dedicated service/domain.

---

# 32. Reconciliation Inputs

```text
Spend Facts

Ledger Balances

Fund Allocations

Client Payments

Vendor Funding

Refunds

Locked Funds
```

---

# 33. Reconciliation Output

```text
Matched

Unresolved Difference

Reconciliation Case

Alert
```

---

# 34. Domain Module Map

Recommended backend modules:

```text
AuthModule

UsersModule

RolesModule

MetaModule

ClientsModule

VendorsModule

LedgerModule

FundsModule

FinanceModule

ApprovalsModule

ReconciliationModule

AlertsModule

AuditModule

ReportsModule

StorageModule

WorkersModule

HealthModule
```

---

# 35. Auth Module

Responsibilities:

```text
JWT validation

User identity

Session context
```

---

# 36. Users Module

```text
Profiles

Status

Organization membership

Assignments
```

---

# 37. Roles Module

```text
Roles

Permissions

Resource scopes

Financial visibility
```

---

# 38. Meta Module

Subdomains:

```text
Connections

Permissions

Portfolios

Ad Accounts

Campaigns

Insights

Sync

Errors
```

---

# 39. Clients Module

```text
Client Profile

Payments

Jobs

Campaign Mapping

Refunds

Receivables

Leftovers
```

---

# 40. Vendors Module

```text
Vendor Profile

Funding

Funding Batches

Settlements

Payables

Receivables

Recoveries
```

---

# 41. Ledger Module

Owns:

```text
Ledger Accounts

Transactions

Entries

Posting Rules

Reversal
```

---

# 42. Funds Module

Owns:

```text
Fund Lots

Fund Allocations

Allocation Events

Locked Funds

Ownership Transfers

Spend Attribution
```

---

# 43. Finance Module

Application-level orchestration across:

```text
Ledger

Clients

Vendors

Funds

Refunds

Receivables
```

---

# 44. Approval Module

Owns:

```text
Approval Requests

Approval Decisions

Thresholds

Maker-checker
```

---

# 45. Reconciliation Module

Owns:

```text
Rules

Runs

Cases

Expected vs observed

Resolution
```

---

# 46. Alerts Module

Owns:

```text
Alerts

Severity

Assignments

Lifecycle

Notifications
```

---

# 47. Audit Module

Owns immutable:

```text
Who

What

When

Before

After

Reason
```

---

# 48. Reports Module

Provides:

```text
Client Statements

Vendor Statements

Financial Reports

Meta Reports

Reconciliation Reports
```

---

# 49. Cross-Module Dependency Rule

Avoid circular domain dependencies.

Recommended high-level direction:

```text
Meta
↓
Funds / Reconciliation

Clients
↓
Finance / Funds

Vendors
↓
Finance / Ledger

Finance
↓
Ledger

Approvals
↓
Financial Commands
```

---

# 50. Ledger Is Foundational

Other modules may invoke Ledger posting.

Ledger should not depend heavily on:

```text
Clients

Vendors

Meta
```

---

# 51. Ledger Transaction Templates

Instead of clients constructing arbitrary entries:

```text
ClientPaymentPostingTemplate

VendorFundingPostingTemplate

VendorSettlementPostingTemplate

ClientRefundPostingTemplate
```

should generate entries.

---

# 52. Why Templates

Prevents frontend/domain callers from deciding:

```text
Debit account

Credit account
```

manually.

---

# 53. Command Architecture

Important financial operations modeled as commands.

Examples:

```text
RecordClientPayment

AllocateClientFunds

PostVendorFunding

PostVendorSettlement

CreateClientRefund

TransferOwnership

WriteOffLockedFund
```

---

# 54. Command Handler

Each command:

```text
Validate
↓
Authorize
↓
Load State
↓
Lock
↓
Apply Business Rules
↓
Persist
↓
Emit Outbox
```

---

# 55. Query Architecture

Reads can use optimized query services.

Examples:

```text
GetClientSummary

GetVendorStatement

GetDashboard

GetAccountTree
```

---

# 56. CQRS Level

Full CQRS framework not required.

Use conceptual separation:

```text
Commands = mutations

Queries = reads
```

inside modular monolith.

---

# 57. Transactional Outbox Architecture

Important domain events should be stored inside same DB transaction.

Example:

```text
Vendor Settlement Posted
↓
outbox_events row
```

---

# 58. Outbox Processor

Worker:

```text
Read pending outbox
↓
Publish/dispatch event
↓
Mark delivered
```

---

# 59. Why Outbox

Prevents:

```text
DB commit succeeds
but
queue publish fails
```

from losing downstream work.

---

# 60. Outbox Event Examples

```text
CLIENT_PAYMENT_POSTED

VENDOR_FUNDING_POSTED

VENDOR_SETTLEMENT_POSTED

AD_ACCOUNT_RESTRICTED

SPEND_FACT_UPDATED

CLIENT_REFUND_POSTED
```

---

# 61. Event Consumers

Examples:

```text
CLIENT_PAYMENT_POSTED
→ Reconciliation
→ Dashboard cache invalidation

AD_ACCOUNT_RESTRICTED
→ Alert
→ Recovery Case
→ Locked Fund workflow
```

---

# 62. Event Delivery Semantics

Treat as:

```text
AT-LEAST-ONCE
```

Therefore consumers must be idempotent.

---

# 63. Event Idempotency

Each outbox event has:

```text
event_id
```

Consumer records processed event where necessary.

---

# 64. Queue Architecture

Suggested queues:

```text
meta-sync

reconciliation

finance-events

alerts

reports

notifications
```

---

# 65. Queue Priority

```text
Critical account status

Financial reconciliation

Recent spend

Normal Meta sync

Reports

Historical backfill
```

---

# 66. Worker Architecture

Workers can initially run in one service image.

Logical workers:

```text
MetaWorker

ReconciliationWorker

ReportWorker

OutboxWorker

NotificationWorker
```

---

# 67. Worker Isolation

One worker failure should not crash API.

---

# 68. Worker Database Access

Workers use same domain services/database.

They do not bypass business rules.

---

# 69. Scheduler

Scheduler periodically creates jobs.

Examples:

```text
Status every few minutes

Spend every 15–30 minutes

Nightly reconciliation
```

---

# 70. Scheduler Is Not Canonical State

If scheduler misses a run:

freshness logic identifies overdue entities and can recover later.

---

# 71. Meta Sync Architecture

```text
Scheduler
↓
Meta Sync Queue
↓
Worker
↓
Meta API
↓
Mapper
↓
Canonical Meta Tables
↓
Domain Event
↓
Attribution/Reconciliation
```

---

# 72. Meta Sync Cannot Directly Post Ledger

Important boundary:

```text
Meta API
X→ Ledger Mutation
```

Instead:

```text
Meta Fact
→ Business Attribution
→ Reconciliation
→ Controlled Financial Action if required
```

---

# 73. Spend Pipeline

```text
Meta Insights
↓
SpendFact
↓
Campaign Mapping
↓
Spend Attribution
↓
Fund Allocation Consumption
↓
Reconciliation
```

---

# 74. Spend Fact

Represents:

```text
What Meta reports
```

---

# 75. Spend Attribution

Represents:

```text
Whose job/fund consumed that spend
```

---

# 76. Unknown Spend

If no mapping:

```text
UNATTRIBUTED
```

not guessed.

---

# 77. Restriction Pipeline

```text
Meta Status Sync
↓
Status Changed
↓
AD_ACCOUNT_RESTRICTED Event
↓
Recovery Case
↓
Fund Exposure Calculation
↓
Locked Funds
↓
Alert
↓
Reconciliation
```

---

# 78. Restore Pipeline

```text
Meta ACTIVE
↓
Restore Event
↓
Recent Spend Sync
↓
Balance/Position Verification
↓
Reconciliation
↓
Unlock Valid Funds
```

---

# 79. Client Payment Pipeline

```text
Client Payment
↓
Ledger Transaction
↓
Client Liability
↓
Fund Lot
↓
Client Wallet Allocation
```

---

# 80. Client Allocation Pipeline

```text
Client Wallet
↓
Job Allocation
↓
Ad Account Allocation
↓
Spend
↓
Leftover
```

---

# 81. Vendor Funding Pipeline

```text
Vendor Funding
↓
Bank Asset
+
Vendor Payable
↓
Funding Batch
```

---

# 82. Vendor Repayment Pipeline

```text
Settlement Request
↓
Approval
↓
Payable Calculation
↓
Posting
↓
Batch Repayment Allocation
```

---

# 83. Vendor Overpayment Pipeline

```text
Payment
>
Open Payable
↓
Valid repayment
+
Vendor Receivable
```

---

# 84. Client Refund Pipeline

```text
Refund Request
↓
Approval
↓
Fund Reservation
↓
External Payment
↓
Ledger Posting
↓
Allocation Finalization
```

---

# 85. Pending Refund

Pending refund:

```text
reserved
```

not:

```text
paid
```

---

# 86. Approval Architecture

High-risk commands:

```text
Ownership Transfer

Vendor Settlement

Write-Off

Large Refund

Manual Adjustment
```

may require approval before posting.

---

# 87. Approval State

```text
DRAFT
↓
PENDING
↓
APPROVED
↓
POSTED
```

or:

```text
REJECTED
```

---

# 88. Maker-Checker

Requester cannot approve same high-risk transaction where configured.

Backend enforcement required.

---

# 89. Authorization Architecture

Four layers:

```text
Authentication

Permission

Resource Scope

Business Rule
```

---

# 90. Example

Finance user has:

```text
POST_VENDOR_SETTLEMENT
```

But request still checked for:

```text
Vendor scope

Amount limit

Approval requirement

Current payable
```

---

# 91. RLS

PostgreSQL RLS provides tenant isolation.

Every tenant-owned table includes:

```text
organization_id
```

---

# 92. Multi-Tenant Boundary

User from ORG-A cannot read/write ORG-B.

Enforced through:

```text
Backend authorization
+
RLS
```

---

# 93. Backend Service Role

Trusted backend may bypass certain end-user RLS using service credentials.

Therefore backend authorization becomes critical.

---

# 94. No Direct Client DB Writes

Browser should not directly mutate financial tables through Supabase client.

Recommended:

```text
Browser
→ NestJS
→ PostgreSQL
```

for all business/financial mutations.

---

# 95. Direct Supabase Client Use

Can be limited to:

```text
Auth

Controlled realtime subscriptions

Signed storage workflows
```

where safe.

---

# 96. Storage Architecture

```text
Frontend
↓
Backend authorization
↓
Signed upload/download
↓
Supabase Storage
```

---

# 97. Attachment Metadata

DB stores:

```text
Attachment ID

Entity

Storage Path

Uploaded By

Hash

Mime Type

Created At
```

---

# 98. File Validation

Uploads should validate:

```text
Size

Mime type

Extension

Entity permission
```

---

# 99. Realtime Architecture

Useful for:

```text
New Alert

Approval Completed

Sync Finished
```

---

# 100. Realtime Is Advisory

UI may receive event:

```text
"Vendor settlement posted"
```

Then refetch canonical state from API.

Do not trust event payload as full authoritative state.

---

# 101. Dashboard Architecture

Dashboard should use:

```text
Optimized aggregate endpoints
```

rather than hundreds of frontend queries.

---

# 102. Dashboard Query Service

Possible:

```text
DashboardQueryService
```

returns:

```text
Financial KPIs

Meta Health

Client Stats

Vendor Stats

Alerts

Approvals
```

---

# 103. Dashboard Data Source

Financial KPI:

```text
Ledger / allocation views
```

Meta operational KPI:

```text
Meta canonical tables
```

---

# 104. Materialized Views

Can be introduced for expensive dashboard reports.

Example:

```text
daily_client_financial_summary
```

---

# 105. Materialized View Is Derived

Never canonical.

Can always rebuild from source tables.

---

# 106. Cache

Redis can cache:

```text
Dashboard aggregates

Permission metadata

Short-lived queries
```

---

# 107. Cache Failure

If Redis cache unavailable:

API should query PostgreSQL where feasible.

Critical finance must still work.

---

# 108. Search Architecture

V1 PostgreSQL enough.

Search:

```text
Clients

Vendors

Accounts

Transactions
```

through indexed columns.

---

# 109. Global Search

Backend endpoint can combine result types:

```text
Client

Vendor

Ad Account

Transaction

Job
```

---

# 110. Reports Architecture

Small report:

```text
Synchronous API
```

Large report:

```text
Request
↓
Queue
↓
Worker
↓
CSV/XLSX
↓
Storage
↓
Signed URL
```

---

# 111. Snapshot Architecture

Daily financial snapshots useful for:

```text
Historical dashboards

Aging

Period close
```

but snapshots remain derived from canonical records.

---

# 112. Audit Architecture

Audit events stored in PostgreSQL.

Important categories:

```text
CREATE

UPDATE

POST

REVERSE

APPROVE

REJECT

ARCHIVE

LOGIN_SECURITY

META_CONNECTION
```

---

# 113. Financial Audit

Must include:

```text
Actor

Action

Entity

Reason

Transaction

Timestamp
```

---

# 114. Audit Immutability

Normal application user cannot edit/delete audit events.

---

# 115. Financial Record Immutability

Posted:

```text
Ledger Transaction

Ledger Entry
```

must not be editable.

---

# 116. Correction Architecture

```text
Wrong Posted Transaction
↓
Reversal
↓
Correct Transaction
```

---

# 117. No Balance Mutation API

There should be no endpoint:

```text
PATCH /clients/{id}/balance
```

---

# 118. Balance API

Only read:

```text
GET /clients/{id}/financial-summary
```

derived from canonical records.

---

# 119. Integration Failure Boundary

Meta failure:

```text
Meta features degraded
```

Core finance:

```text
still available
```

---

# 120. Redis Failure Boundary

Redis outage:

```text
Background jobs paused/degraded
```

But:

```text
PostgreSQL data remains safe
```

---

# 121. Realtime Failure Boundary

Realtime outage:

```text
UI stops auto-refreshing
```

Manual refresh/API still works.

---

# 122. Storage Failure Boundary

Cannot upload proof temporarily.

Existing financial records remain unaffected.

Posting policies can require proof before specific transaction if business rule says so.

---

# 123. Sentry Failure Boundary

Monitoring failure must not break business flow.

---

# 124. PostgreSQL Failure Boundary

Database unavailable:

```text
Financial writes must fail closed
```

Do not buffer financial postings in browser/Redis pretending success.

---

# 125. Fail Closed

If DB uncertain:

return:

```text
Transaction could not be confirmed
```

not:

```text
Success
```

---

# 126. Unknown Commit Outcome

Rare network failure after DB commit can create uncertainty.

Use idempotency key.

Client retries same request.

Backend returns existing committed result.

---

# 127. Idempotency Architecture

Important mutations carry:

```text
idempotency_key
```

Examples:

```text
Client Payment

Vendor Funding

Vendor Settlement

Refund

Ownership Transfer
```

---

# 128. Idempotency Table

Possible:

```text
idempotency_records
```

stores:

```text
organization_id

key

operation

request_hash

resource_id

status
```

---

# 129. Same Key Same Request

Return existing result.

---

# 130. Same Key Different Request

Reject:

```text
IDEMPOTENCY_KEY_CONFLICT
```

---

# 131. External Reference Deduplication

Also protect:

```text
UTR

Bank Reference

Meta Refund Reference
```

where appropriate.

---

# 132. Internal References

Human references generated centrally.

Examples:

```text
CLI-0001

VEN-0001

TXN-000001

REC-000001
```

---

# 133. Sequence Generation

Use DB-backed sequence/reference generator to avoid race conditions.

---

# 134. Data Access Architecture

Three access styles:

```text
Prisma ORM

Reviewed Raw SQL

Database Views/Functions
```

---

# 135. Prisma

Default.

---

# 136. Raw SQL

Use for:

```text
Locks

Complex financial queries

Database-specific optimization
```

---

# 137. DB Functions

Use when strong atomic server-side behavior is valuable.

---

# 138. Repository Pattern

Avoid unnecessary wrapper repositories for every Prisma call.

Use repositories where domain boundary benefits.

Examples:

```text
LedgerRepository

VendorSettlementRepository

FundAllocationRepository
```

---

# 139. Service Layer

Business rules in:

```text
Domain/Application Services
```

not controllers.

---

# 140. Controller Responsibility

Controller:

```text
Parse request

Call service

Return response
```

not calculate vendor payable.

---

# 141. DTO Responsibility

Validate:

```text
Shape

Required fields

Basic format
```

---

# 142. Domain Responsibility

Validate:

```text
Can this action happen?
```

Example:

```text
Can Client A transfer ₹10,000?
```

---

# 143. DB Responsibility

Final invariant:

```text
Can two requests violate this simultaneously?
```

---

# 144. API Error Architecture

Standard response:

```text
error_code

message

details

request_id
```

---

# 145. Financial Error Codes

Examples:

```text
INSUFFICIENT_AVAILABLE_FUNDS

APPROVAL_REQUIRED

PAYABLE_ALREADY_SETTLED

DUPLICATE_REFERENCE

OWNERSHIP_MISMATCH

FINANCIAL_PERIOD_CLOSED
```

---

# 146. Avoid Generic 500

Known business errors return appropriate controlled response.

---

# 147. Request Correlation

Every API request:

```text
request_id
```

propagates to:

```text
Logs

Audit

Worker Job

Outbox Event
```

where practical.

---

# 148. Meta Correlation

Meta sync also tracks:

```text
sync_run_id

request_id

provider trace
```

---

# 149. Observability Architecture

Three categories:

```text
Logs

Metrics

Errors/Tracing
```

---

# 150. Logs

Pino.

---

# 151. Errors

Sentry.

---

# 152. Metrics

Initially application counters.

Future:

```text
Prometheus/Grafana
```

---

# 153. Business Metrics

Examples:

```text
Open reconciliation cases

Locked fund total

Vendor payable

Vendor receivable
```

These are business reporting, not infrastructure metrics.

---

# 154. Infrastructure Metrics

```text
CPU

RAM

Queue depth

API latency

DB connections

Worker failures
```

---

# 155. Security Boundary

Public network should only expose:

```text
443
```

through Nginx/Cloudflare.

---

# 156. Internal Services

```text
Redis

Worker ports

API internal port

Web internal port
```

remain private.

---

# 157. Secret Boundary

Secrets accessible only server-side.

---

# 158. Meta Token

Encrypted at rest.

Resolved only when needed.

---

# 159. Encryption Key

Stored outside database record containing ciphertext.

---

# 160. Backups

Canonical PostgreSQL backup is highest priority.

Redis backup lower priority.

Storage metadata/data also requires retention strategy.

---

# 161. Disaster Recovery

Architecture should allow:

```text
Restore PostgreSQL

Restore/reconnect Redis jobs

Restart API/Workers

Resume sync

Reconcile external Meta state
```

---

# 162. Meta Data Recovery

Because Meta is external:

after outage/database restore:

```text
Resync recent statuses

Resync spend

Reconcile
```

---

# 163. Financial Data Recovery

Cannot rely on Meta to reconstruct:

```text
Vendor payable

Client ownership

Refund history
```

Therefore PostgreSQL backups critical.

---

# 164. Environment Separation

```text
Development

Staging

Production
```

each isolated.

---

# 165. Production Data

Never copied casually into development.

If needed for debugging:

```text
Sanitize/anonymize
```

---

# 166. Deployment Topology V1

Single VPS runs:

```text
Nginx

Web

API

Workers

Redis
```

Supabase external.

---

# 167. Horizontal Scaling Future

Possible:

```text
Multiple API containers

Multiple workers
```

Because:

```text
State lives outside process
```

---

# 168. Stateless API

Nest API should not rely on process memory for:

```text
Session

Financial balance

Queue state
```

---

# 169. Sticky Sessions

Should not be required for API.

---

# 170. Worker Horizontal Scaling

BullMQ supports multiple workers.

DB locking/idempotency ensures correctness.

---

# 171. Web Horizontal Scaling

Next.js can scale independently later.

---

# 172. Database Scaling

Initially managed Supabase instance.

Later:

```text
Connection pooling

Index tuning

Read replicas
```

if needed.

---

# 173. Financial Write Scaling

Correctness > throughput.

Do not remove locks merely to increase transactions/sec.

---

# 174. Read Scaling

Can optimize independently through:

```text
Views

Caches

Indexes

Read models
```

---

# 175. Architecture Decision: No Microservices V1

Reasons:

```text
Strong transaction needs

Shared business state

Small operational footprint

Simpler debugging

Lower DevOps complexity
```

---

# 176. Architecture Decision: No Kafka V1

BullMQ + outbox sufficient.

Kafka only if future event volume/use cases justify.

---

# 177. Architecture Decision: No MongoDB

Domain is highly relational and transactional.

PostgreSQL fits better.

---

# 178. Architecture Decision: No Direct Meta-to-Finance Mutation

All Meta financial implications go through:

```text
Attribution

Reconciliation

Business workflow
```

---

# 179. Architecture Decision: No Editable Balances

Balances are derived.

---

# 180. Architecture Decision: Immutable Financial History

Posted records remain.

Corrections append.

---

# 181. Architecture Decision: Explicit Uncertainty

Unknown data stored as:

```text
UNKNOWN

UNATTRIBUTED

UNRESOLVED

STALE
```

rather than guessed.

---

# 182. Architecture Decision: External and Internal Identity Separate

Meta ID:

```text
external identity
```

UUID:

```text
internal identity
```

---

# 183. Architecture Decision: Client Job Separate from Meta Campaign

Because:

```text
One job can use many campaigns

One campaign mapping changes historically

Financial ownership belongs to internal business model
```

---

# 184. Architecture Decision: Financial Ownership Separate from Ad Account

An Ad Account can have:

```text
Client A

Client B

Agency
```

funds simultaneously.

---

# 185. Architecture Decision: Vendor Funding Separate from Ownership

Vendor:

```text
Funding Source / Creditor
```

not automatically beneficial fund owner.

---

# 186. Architecture Decision: Operational Closure Separate from Financial Closure

Client/Job/Account can stop operation while:

```text
Locked funds

Refund

Receivable

Reconciliation
```

remain open.

---

# 187. Critical Invariants

System architecture must preserve:

```text
Ledger debits = credits

No fund double allocation

No negative vendor payable

No silent client ownership transfer

No spend attribution above Meta spend

No posted record editing

No cross-tenant access
```

---

# 188. Failure Scenario — Meta Down

Expected:

```text
Meta data becomes stale

Sync alerts open

Core finance continues

No balance changes
```

---

# 189. Failure Scenario — Redis Down

Expected:

```text
Workers pause

Scheduled processing delayed

HTTP finance writes can still operate

Outbox remains in PostgreSQL
```

---

# 190. Failure Scenario — Worker Crash

Expected:

```text
Job retries

Idempotency prevents duplicate effect
```

---

# 191. Failure Scenario — API Crash During Settlement

If DB transaction not committed:

```text
Rollback
```

If committed but response lost:

```text
Client retries same idempotency key
↓
Existing result returned
```

---

# 192. Failure Scenario — Two Vendor Settlements

DB lock ensures:

```text
Only one calculates against same payable state at a time
```

Second sees updated payable.

---

# 193. Failure Scenario — Meta Spend Revised

```text
SpendFact changes

Attribution recalculates

Reconciliation case opens/updates

Ledger not silently edited
```

---

# 194. Failure Scenario — Client Payment Reversed

```text
Payment reversal transaction

Client liability adjusted

If funds already consumed:
Receivable/funding gap
```

---

# 195. Failure Scenario — Restricted Account

```text
Operational status changes

Remaining funds locked

Owner preserved

Recovery case open
```

---

# 196. Architecture Health Model

Overall application health should separately report:

```text
Core API

Database

Redis

Workers

Meta Integration

Storage
```

---

# 197. Do Not Show One Green/Red Health Only

Example:

```text
Core Finance: Healthy

Meta Integration: Degraded

Redis: Healthy
```

is more useful than:

```text
System: Down
```

---

# 198. Internal Event Flow Example

```text
Vendor Settlement Posted
↓
Outbox Event
↓
Outbox Worker
├── Update alerts
├── Trigger vendor reconciliation
├── Refresh dashboard
└── Send notification
```

---

# 199. External Event Flow Example

```text
Meta Status Changed
↓
Meta Domain Event
↓
Outbox/Queue
├── Alert
├── Recovery Case
└── Fund Exposure Evaluation
```

---

# 200. Future Webhook Architecture

If Meta webhook relevant:

```text
Meta Webhook
↓
Public Webhook Endpoint
↓
Signature Verification
↓
Persist Event
↓
Queue Targeted Fetch
↓
Canonical Meta Sync
```

Webhook itself is not canonical final state.

---

# 201. Webhook Security

Require:

```text
Verification

Replay protection where applicable

Idempotency

Rate limiting
```

---

# 202. Future Bank Integration

Architecture can later add:

```text
Bank Adapter
↓
Bank Transactions
↓
Reconciliation
```

without changing ledger core.

---

# 203. Future Google Ads

Add:

```text
GoogleAdsIntegration
```

that produces normalized:

```text
External Account

Campaign

Spend Fact
```

same reconciliation concepts.

---

# 204. Platform-Neutral Future

Long term:

```text
ExternalSpendFact
```

may become generalized abstraction.

V1 can remain Meta-specific.

---

# 205. Architecture Documentation Rule

Every new major module must document:

```text
Purpose

Owner

Inputs

Outputs

Dependencies

Transactions

Events

Failure behavior
```

---

# 206. Architecture Testing

Need:

```text
Unit tests

Integration tests

Concurrency tests

Queue retry tests

Meta failure tests

E2E tests
```

---

# 207. Architecture Test: Financial Atomicity

Inject failure midway through payment posting.

Expected:

```text
No partial ledger/payment/fund lot remains
```

---

# 208. Architecture Test: Outbox

Commit financial event.

Kill queue/Redis.

Expected:

```text
Financial transaction remains committed

Outbox pending

Event delivers after recovery
```

---

# 209. Architecture Test: Duplicate Queue Event

Deliver same event twice.

Expected:

```text
No duplicate financial side effect
```

---

# 210. Architecture Test: Tenant Isolation

User from ORG-A requests ORG-B record.

Expected:

```text
Denied
```

at backend/RLS.

---

# 211. Architecture Test: Stale Meta

Stop Meta sync.

Expected:

```text
Last-known value remains

Freshness becomes stale

No zeroing
```

---

# 212. V1 Architecture Components

Required:

```text
Next.js Web

NestJS API

PostgreSQL

Supabase Auth

Supabase Storage

Redis

BullMQ

Workers

Meta API Client

Transactional Outbox

RBAC

RLS

Audit

Alerts

Reconciliation
```

---

# 213. V1 Non-Required Components

Avoid:

```text
Kubernetes

Kafka

Microservices

Elasticsearch

Separate finance database

Separate Meta database

Event sourcing platform
```

---

# 214. Scaling Principle

Scale individual bottleneck.

Examples:

```text
More workers for Meta

Read model for reports

Bigger DB

More API replicas
```

Do not redesign entire system prematurely.

---

# 215. System Architecture Integrity Rules

System must enforce:

```text
1. PostgreSQL is the canonical source for internal business and financial truth.

2. Financial writes must occur through backend domain services.

3. Posted ledger records must be immutable.

4. Financial corrections must use reversal/new transactions.

5. Ledger and fund allocation must remain separate but linked.

6. Meta operational data must remain separate from internal financial truth.

7. Meta API failures must never directly change balances.

8. Client ownership must never be inferred from Ad Account hierarchy alone.

9. Vendor funding must not automatically become client ownership.

10. Important financial writes must be atomic.

11. Concurrency-sensitive operations must use database locking.

12. Idempotency must protect retryable financial mutations.

13. Background event delivery must assume at-least-once behavior.

14. Important domain events should use a transactional outbox.

15. Redis must not become canonical business storage.

16. Queue workers must remain idempotent.

17. Frontend must not possess financial-authority logic.

18. Tenant isolation must be enforced by backend and database policy.

19. Raw external credentials must remain server-only.

20. Operational closure and financial closure must remain separate.

21. Unknown or stale data must remain explicit.

22. External systems may fail without making internal finance incorrect.

23. Derived caches and views must remain rebuildable.

24. Every major financial action must be auditable.

25. The architecture must favor correctness and traceability over convenience.
```

---

# 216. System Architecture Golden Rule

> **The system must allow external systems, workers, queues, browsers and even individual services to fail without making the financial truth ambiguous. PostgreSQL protects canonical state, the ledger records financial meaning, fund allocation records ownership and usage, Meta supplies external operational facts, reconciliation connects the truths, and every asynchronous or retried operation must remain idempotent and auditable.**
