# Backend Architecture

## Overview

Ye document NestJS backend ki production architecture define karta hai.

Backend system ka central control layer hoga.

Frontend sirf request karega.

Backend decide karega:

```text
User authorized hai ya nahi

Action valid hai ya nahi

Approval required hai ya nahi

Current financial state kya hai

Transaction atomic kaise post hogi

Ledger entries kya hongi

Fund allocation kaise move hogi

Audit kya record hoga

Kaunsa async event dispatch hoga
```

Core principle:

> **All business-critical and financial mutations must pass through explicit backend use cases with server-side authorization, validation, database transactions and auditability.**

---

# 1. Backend Technology

Recommended:

```text
Node.js 24 LTS

NestJS 12

TypeScript

Prisma ORM 7

PostgreSQL

Redis

BullMQ
```

---

# 2. Backend Architecture Style

Use:

```text
MODULAR MONOLITH
```

with clear domain boundaries.

Do not build:

```text
One giant AppService
```

and do not prematurely split into microservices.

---

# 3. Backend High-Level Structure

```text
HTTP / Worker Trigger
        ↓
Controller / Job Processor
        ↓
Application Service / Command Handler
        ↓
Domain Rules
        ↓
Repository / Database
        ↓
PostgreSQL
```

With external dependencies:

```text
Application Service
        ↓
Adapter
        ↓
Meta / Storage / Other External API
```

---

# 4. Recommended Backend Folder

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── config/
├── common/
├── auth/
├── users/
├── roles/
├── meta/
├── clients/
├── vendors/
├── finance/
├── ledger/
├── funds/
├── approvals/
├── reconciliation/
├── alerts/
├── audit/
├── reports/
├── storage/
├── outbox/
├── health/
└── database/
```

---

# 5. Worker Application

Recommended separate app:

```text
apps/worker/src/
├── main.ts
├── worker.module.ts
├── processors/
├── schedulers/
└── bootstrap/
```

Shared domain code should come from shared packages/modules rather than copying business logic.

---

# 6. Shared Packages

Possible:

```text
packages/
├── domain-types/
├── shared/
├── config/
├── database/
└── contracts/
```

---

# 7. Module Boundary Rule

Each NestJS module should own a clear business capability.

Example:

```text
VendorsModule
```

owns:

```text
Vendor profiles

Funding batches

Vendor settlements

Vendor receivables
```

---

# 8. Controllers

Controllers should remain thin.

Controller responsibilities:

```text
Read HTTP request

Validate DTO shape

Get authenticated user context

Call application service

Return standardized response
```

---

# 9. Controller Must Not

Bad controller:

```text
Read vendor payable

Calculate excess

Create ledger entries

Update batches

Send alert
```

That belongs in domain/application service.

---

# 10. Application Services

Application service represents use case.

Examples:

```text
RecordClientPaymentService

PostVendorSettlementService

AllocateClientFundsService

CreateRefundService

ResolveReconciliationService
```

---

# 11. Use-Case-Oriented Naming

Prefer:

```text
PostVendorSettlement
```

over generic:

```text
VendorService.update()
```

for critical actions.

---

# 12. Domain Services

Domain services contain reusable business rules.

Examples:

```text
VendorPayableCalculator

FundAvailabilityService

SpendAttributionService

LedgerPostingService

ApprovalPolicyService
```

---

# 13. Repository Layer

Repositories encapsulate complex persistence where helpful.

Examples:

```text
VendorSettlementRepository

LedgerRepository

FundAllocationRepository

ReconciliationRepository
```

---

# 14. Do Not Over-Repository

Simple CRUD can use Prisma directly inside well-scoped service.

Do not create:

```text
ClientNameRepository

ClientEmailRepository
```

without reason.

---

# 15. Database Module

Central:

```text
DatabaseModule
```

provides:

```text
PrismaService

Transaction helpers

Raw SQL helpers

Lock helpers
```

---

# 16. PrismaService

One process-level Prisma client.

Do not instantiate Prisma client per HTTP request.

---

# 17. Transaction Context

Critical use cases need a shared transaction context.

Conceptually:

```text
prisma.$transaction(async tx => {
  ...
})
```

Every write inside same business transaction uses:

```text
tx
```

not root Prisma client.

---

# 18. Transaction Helper

Recommended utility:

```text
TransactionManager
```

Conceptually:

```text
transactionManager.run(async tx => {})
```

---

# 19. Financial Transaction Boundaries

One transaction should cover all canonical records required for same business event.

Example client payment:

```text
ClientPayment

LedgerTransaction

LedgerEntries

FundLot

AuditEvent

OutboxEvent
```

---

# 20. Do Not Include Meta API Call Inside Ledger Transaction

Bad:

```text
BEGIN

Call Meta API
wait 15 sec

Post ledger

COMMIT
```

This keeps DB locks open unnecessarily.

---

# 21. External Calls and DB Transactions

Preferred:

```text
External verification if needed
↓
Begin short DB transaction
↓
Post canonical state
↓
Commit
```

Or:

```text
Commit internal request
↓
Outbox
↓
External async action
```

depending on workflow.

---

# 22. Database Locks

Use DB-level locks for race-sensitive workflows.

Examples:

```text
Vendor settlement

Client refund

Fund allocation

Ownership transfer

Sequence generation
```

---

# 23. Row Lock Example

Conceptually:

```text
SELECT ...
FROM vendor_funding_batches
WHERE vendor_id = ?
FOR UPDATE;
```

---

# 24. Why Application Mutex Is Not Enough

Multiple:

```text
API replicas

Worker replicas
```

may run.

In-memory lock protects only one process.

DB lock protects shared canonical state.

---

# 25. Advisory Locks

PostgreSQL advisory locks may be useful for logical resources.

Example:

```text
vendor:{vendor_id}
```

Use carefully.

Row locks preferred where rows naturally represent state.

---

# 26. Lock Ordering

Always acquire locks in deterministic order to reduce deadlock risk.

Example:

```text
Vendor

Funding Batches oldest first

Ledger accounts
```

---

# 27. Deadlock Handling

Database deadlock can occur.

Backend should:

```text
Rollback

Classify transient DB conflict

Retry complete transaction safely
```

with limited attempts.

---

# 28. Financial Command Pattern

Recommended command structure:

```text
Command DTO
↓
Command Handler
↓
Authorization
↓
Domain Validation
↓
Transaction
↓
Ledger / Allocation
↓
Audit + Outbox
```

---

# 29. Example Command

```text
PostVendorSettlementCommand
```

contains:

```text
organizationId

vendorId

settlementId

actorId

idempotencyKey
```

Not arbitrary debit/credit instructions.

---

# 30. Backend Generates Accounting Entries

Frontend should send:

```text
Settlement ₹30,000
```

Backend determines:

```text
Payable repayment ₹20,000

Vendor receivable ₹10,000
```

---

# 31. Ledger Posting Service

Central component:

```text
LedgerPostingService
```

Responsibilities:

```text
Validate transaction type

Build entries from approved template

Check debit = credit

Post transaction

Enforce immutable state
```

---

# 32. Ledger Templates

Examples:

```text
ClientPaymentLedgerTemplate

VendorFundingLedgerTemplate

VendorRepaymentLedgerTemplate

ClientRefundLedgerTemplate

VendorOverpaymentLedgerTemplate
```

---

# 33. No Arbitrary Journal API in Normal UI

Do not expose:

```text
POST /ledger
{
  debit: ...,
  credit: ...
}
```

to regular users.

---

# 34. Manual Journal

If future admin adjustment exists:

```text
MANUAL_ADJUSTMENT
```

requires:

```text
Special permission

Reason

Approval

Audit
```

---

# 35. Idempotency Layer

Critical financial mutations require idempotency.

Examples:

```text
Client payment

Vendor funding

Vendor settlement

Refund

Ownership transfer
```

---

# 36. Idempotency Header

Possible HTTP convention:

```text
Idempotency-Key
```

---

# 37. Idempotency Record

Table:

```text
idempotency_records
```

Fields:

```text
organization_id

operation_type

idempotency_key

request_hash

resource_id

status

created_at
```

---

# 38. Idempotency Flow

```text
Receive request
↓
Find key
├── none → continue
└── exists
      ↓
   Same request?
   ├── YES → return existing result
   └── NO → reject conflict
```

---

# 39. Request Hash

Hash normalized meaningful request body.

Avoid including volatile:

```text
request timestamp
```

unless business-relevant.

---

# 40. Idempotency + DB Transaction

Idempotency record and financial transaction should be coordinated transactionally.

This avoids:

```text
Transaction posted
but
Idempotency record missing
```

---

# 41. Authorization Pipeline

Recommended order:

```text
Authentication

Active user check

Permission check

Resource scope

Entity state

Financial visibility

Amount limit

Approval requirement

Maker-checker

Domain validation
```

---

# 42. Auth Guard

Nest:

```text
AuthGuard
```

validates Supabase JWT.

---

# 43. Permission Guard

Example metadata:

```text
@RequirePermission('VENDOR_SETTLEMENT_POST')
```

---

# 44. Resource Scope

Permission alone insufficient.

Example:

Finance user may only access:

```text
Vendor Group A
```

or selected clients/accounts.

---

# 45. Resource Authorization Service

Central:

```text
AuthorizationService
```

can answer:

```text
canAccessClient()

canAccessVendor()

canAccessAdAccount()

canPerformFinancialAction()
```

---

# 46. Do Not Trust Frontend Scope

Frontend hiding Client B is convenience.

Backend independently checks Client B access.

---

# 47. Approval Integration

High-risk action may create:

```text
ApprovalRequest
```

instead of posting immediately.

---

# 48. Approval-Aware Command

Example:

```text
RequestOwnershipTransfer
```

creates pending request.

Later:

```text
ApproveOwnershipTransfer
```

does not necessarily post.

Final:

```text
ExecuteOwnershipTransfer
```

posts after approved state.

---

# 49. Approval Snapshot

Approval request should snapshot material requested values.

Example:

```text
Amount

Source owner

Destination owner

Reason
```

---

# 50. Material Change Invalidates Approval

If pending transfer amount changes:

```text
₹50,000
→ ₹60,000
```

old approval should not remain valid.

---

# 51. Maker-Checker

Store:

```text
requested_by

approved_by
```

and enforce:

```text
requested_by != approved_by
```

where configured.

---

# 52. DTO Validation

Use Nest validation pipes/class-validator or chosen schema strategy.

Validate:

```text
Required values

Enums

UUID format

Amounts

Dates
```

---

# 53. Money DTO

Avoid:

```text
amount: number
```

for arbitrary decimal rupees in financial API.

Recommended either:

```text
amountMinor: string / integer-safe representation
```

or safe decimal string converted server-side.

---

# 54. JavaScript Safe Integer

BIGINT values may exceed JS safe integer eventually.

API serialization should define consistent strategy.

Recommended:

```text
amountMinor as string
```

at API boundary for absolute safety.

---

# 55. Example

```text
{
  "amountMinor": "2000000",
  "currency": "INR"
}
```

---

# 56. Backend Converts

Use:

```text
BigInt
```

internally where appropriate.

Never:

```text
Number(bigint)
```

without range check.

---

# 57. API Response Contracts

Use explicit DTOs.

Do not expose raw Prisma model directly everywhere.

---

# 58. Why Response DTO

Allows:

```text
Hide internal fields

Stable API

Rename database columns later

Permission-aware fields
```

---

# 59. Financial Visibility

Same endpoint may return less data based on role.

Example Ads Manager:

```text
Allocated amount

Spend
```

but not:

```text
Company bank

Vendor liability
```

---

# 60. Query Services

Read-heavy logic should be separated.

Examples:

```text
ClientQueryService

VendorQueryService

DashboardQueryService

LedgerQueryService
```

---

# 61. Query Services Can Use Optimized SQL

Not all reads need domain entity reconstruction.

For dashboard:

```text
Views

Raw SQL

Materialized views
```

acceptable.

---

# 62. Command and Query Separation

Conceptually:

```text
Commands:
Change state

Queries:
Read state
```

No need full CQRS framework.

---

# 63. Pagination

All potentially large list APIs need pagination.

Examples:

```text
Clients

Vendors

Ledger

Transactions

Alerts

Reconciliation
```

---

# 64. Cursor vs Offset Pagination

Recommended:

```text
Cursor pagination
```

for large transaction/event streams.

Offset acceptable for smaller administrative lists.

---

# 65. Ledger Pagination

Prefer stable cursor based on:

```text
posted_at + id
```

rather than offset.

---

# 66. Filtering

Backend supports:

```text
Date range

Status

Client

Vendor

Ad Account

Currency

Transaction type
```

---

# 67. Sorting

Whitelist sortable fields.

Do not directly inject arbitrary user field into SQL.

---

# 68. Search

Sanitize and parameterize.

Use indexed search strategy.

---

# 69. Standard API Response

Possible:

```text
{
  "data": ...,
  "meta": {
    "requestId": "...",
    "nextCursor": "..."
  }
}
```

---

# 70. Standard Error Response

```text
{
  "error": {
    "code": "INSUFFICIENT_AVAILABLE_FUNDS",
    "message": "Requested amount exceeds available funds.",
    "requestId": "..."
  }
}
```

---

# 71. Business Errors

Create typed error hierarchy.

Examples:

```text
InsufficientFundsError

ApprovalRequiredError

OwnershipMismatchError

DuplicateReferenceError

SettlementConflictError
```

---

# 72. HTTP Mapping

Example:

```text
Validation → 400

Unauthenticated → 401

Unauthorized → 403

Not found → 404

Conflict → 409

Unprocessable domain state → 422
```

---

# 73. Financial Concurrency Conflict

Can return:

```text
409 CONFLICT
```

with code:

```text
FINANCIAL_STATE_CHANGED
```

User should refresh.

---

# 74. Global Exception Filter

Nest global filter:

```text
DomainError
↓
Safe API Error
```

Unknown error:

```text
500
```

with request ID.

---

# 75. No Stack Trace to User

Production API must not expose internal stack traces.

---

# 76. Audit Interceptor

Could automatically capture generic:

```text
actor

request ID

route

entity
```

but financial audit should be explicit in domain service.

---

# 77. Why Explicit Audit

Need business context:

```text
Vendor settlement overpayment created

Client ownership changed
```

which generic HTTP audit cannot fully understand.

---

# 78. Audit Event

Recommended fields:

```text
organization_id

actor_type

actor_id

action

entity_type

entity_id

reason

metadata

request_id

created_at
```

---

# 79. Actor Types

```text
USER

SYSTEM

WORKER

MIGRATION
```

---

# 80. Audit Before/After

For mutable non-financial configuration:

```text
before_json

after_json
```

can be useful.

For immutable finance:

refer to transaction IDs instead.

---

# 81. Outbox Module

Tables:

```text
outbox_events
```

Fields:

```text
id

organization_id

event_type

aggregate_type

aggregate_id

payload

status

created_at

processed_at

attempts
```

---

# 82. Outbox Insert

Same DB transaction as source event.

Example:

```text
Vendor settlement posts
+
VENDOR_SETTLEMENT_POSTED outbox
```

---

# 83. Outbox Dispatcher

Worker polls pending events.

Uses:

```text
FOR UPDATE SKIP LOCKED
```

or equivalent safe pattern for multiple workers.

---

# 84. Outbox Status

```text
PENDING

PROCESSING

DELIVERED

FAILED
```

---

# 85. Outbox Retry

Retry delivery.

Do not rerun source financial transaction.

---

# 86. Outbox Payload

Contains IDs and required metadata.

Do not store secrets.

---

# 87. Worker Processor Architecture

Example:

```text
@Processor('meta-sync')
```

Processor should:

```text
Validate payload

Load canonical DB entity

Check current eligibility

Call domain/integration service

Record run state
```

---

# 88. Queue Payload Is Untrusted Internal Input

Even internal queue messages should be validated.

Jobs may be stale.

---

# 89. Stale Job

Example:

Account sync queued.

Before execution:

```text
Connection disabled
```

Worker should skip safely.

---

# 90. Worker Idempotency

Job retry:

```text
same job
```

must not:

```text
duplicate SpendFact

duplicate alert

duplicate ledger transaction
```

---

# 91. Meta Worker

Should not contain:

```text
Client refund logic

Vendor payable logic
```

---

# 92. Finance Worker

Should not make direct arbitrary Meta mutations.

---

# 93. Scheduler Module

Possible:

```text
SchedulerService
```

periodically determines due work.

---

# 94. Scheduler Lock

When multiple API/worker instances run:

use:

```text
Redis lock
```

or DB advisory lock.

Only one scheduler dispatches same cycle.

---

# 95. Distributed Lock Failure

Scheduled work should be recoverable next cycle.

Do not make scheduler lock permanent.

---

# 96. Reconciliation Service

API and workers can both invoke same:

```text
ReconciliationService
```

through application-level methods.

---

# 97. Reconciliation Run

Large reconciliation happens async.

Small post-transaction integrity check can run synchronously.

---

# 98. Synchronous Integrity Check

Example vendor settlement after posting:

```text
Vendor payable not negative

Settlement allocation totals correct

Ledger balanced
```

before commit where possible.

---

# 99. Asynchronous Reconciliation

Broader:

```text
Vendor ledger vs batches

Client funds

Spend attribution
```

after commit via outbox/queue.

---

# 100. Alert Service

Should receive facts:

```text
Account restricted

Reconciliation mismatch

Vendor receivable aged
```

and apply alert rules.

---

# 101. Alerts Should Not Be Created Directly Everywhere

Prefer:

```text
AlertService.createOrUpdateEpisode()
```

for dedup/lifecycle.

---

# 102. Alert Fingerprint

Conceptually:

```text
type

entity

condition key
```

---

# 103. Report Service

Small:

```text
Query directly
```

Large:

```text
Create ReportRequest
↓
Queue
↓
Generate
↓
Storage
```

---

# 104. Export Authorization

User's resource scope applies to exports too.

Do not let restricted user export all clients.

---

# 105. Storage Service

Central adapter:

```text
StorageService
```

handles:

```text
Upload

Signed download URL

Delete allowed draft attachment
```

---

# 106. Financial Attachment Delete

If proof linked to posted transaction:

do not hard-delete normally.

May mark:

```text
superseded
```

with history.

---

# 107. Meta Adapter

Separate package/service:

```text
MetaApiClient
```

Responsibilities:

```text
Version

Auth

Timeout

Retry metadata

Pagination primitives

Error normalization
```

---

# 108. Meta Domain Service

Uses MetaApiClient.

Responsibilities:

```text
Fetch accounts

Fetch campaigns

Fetch insights

Normalize data
```

---

# 109. Do Not Let Controllers Call Meta SDK Directly

Keep provider isolation.

---

# 110. Configuration Module

Central:

```text
ConfigModule
```

validates env at startup.

---

# 111. Required Env Validation

Example:

```text
DATABASE_URL

REDIS_URL

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

META_APP_ID

META_APP_SECRET
```

---

# 112. Fail Fast on Missing Critical Config

Production API should refuse startup if:

```text
DATABASE_URL
```

missing.

---

# 113. Optional Config

Example:

```text
SENTRY_DSN
```

may allow startup depending on policy.

---

# 114. Environment Schema

Use:

```text
Zod
```

or equivalent to validate environment configuration.

---

# 115. Secrets Redaction

Logger should redact keys matching:

```text
authorization

access_token

service_role

app_secret

password
```

---

# 116. Request Logging

Log:

```text
request_id

route

method

status

duration

user_id

organization_id
```

---

# 117. Avoid Logging Request Body Globally

Financial endpoints may contain sensitive info.

Use selective structured audit instead.

---

# 118. Database Query Logging

Production should not log every SQL query with sensitive parameters.

Enable slow-query diagnostics selectively.

---

# 119. Performance Timing

Track:

```text
API duration

DB duration

Meta call duration

Queue wait time
```

---

# 120. Health Module

Endpoints:

```text
/health/live

/health/ready
```

---

# 121. Ready Check

Required:

```text
PostgreSQL reachable

Redis reachable if worker functionality considered required
```

---

# 122. Meta Is Not Core Readiness

Meta outage should show integration degradation separately.

---

# 123. API Versioning

REST version prefix:

```text
/api/v1
```

---

# 124. Backward Compatibility

Do not break existing frontend/mobile API unexpectedly.

Breaking changes:

```text
/v2
```

or migration strategy.

---

# 125. Database Version vs API Version

Independent.

Do not expose DB schema directly as API contract.

---

# 126. Naming Convention

Database:

```text
snake_case
```

TypeScript:

```text
camelCase
```

Mapper handles conversion.

---

# 127. Enum Strategy

Critical domain enums should be explicit.

Examples:

```text
TransactionType

AllocationStatus

ReconciliationStatus
```

---

# 128. Enum Migration

Adding enum values must be backwards compatible where possible.

Unknown external Meta enum should not be PostgreSQL rigid enum if provider can change unpredictably.

---

# 129. External Raw Enums

Prefer:

```text
TEXT
```

for raw Meta values.

Normalized internal values can be controlled enum.

---

# 130. Soft Delete / Archive

Core entities:

```text
Client

Vendor

Meta Account
```

use status/archive timestamps.

Do not hard-delete if referenced.

---

# 131. Draft Hard Delete

Safe drafts with no downstream references may be hard-deleted where business policy allows.

---

# 132. Optimistic Concurrency

For normal editable records:

```text
version
```

or `updated_at` checks can prevent overwriting someone else's edit.

---

# 133. Pessimistic Concurrency

For money:

use DB row locks.

---

# 134. Do Not Use Optimistic Lock Alone for Money

Example:

Two refunds can still race.

Use transaction + row lock.

---

# 135. Financial State Projection

Balance projections can be cached in tables/views for speed.

Canonical ledger remains source.

---

# 136. Projection Repair

Provide admin/system command:

```text
RebuildClientFinancialSummary
```

from ledger/allocation.

---

# 137. Projection Drift

If cache differs:

```text
Recompute
```

not ledger adjustment.

---

# 138. Repositories and Tenant Guard

Every repository query must scope by:

```text
organization_id
```

unless intentionally system-global.

---

# 139. Never Query by Entity ID Alone

Bad:

```text
findUnique({ id })
```

without tenant check in multi-tenant context.

---

# 140. Recommended Tenant Loader

Example:

```text
getClientOrThrow({
  organizationId,
  clientId
})
```

---

# 141. Cross-Tenant UUID Guess

Must return:

```text
404 / forbidden
```

without leaking entity existence.

---

# 142. Internal System User

Workers operate as:

```text
SYSTEM
```

actor.

Audit still records automated activity.

---

# 143. Background User Context

Worker should not impersonate arbitrary user.

Store originating:

```text
requested_by_user_id
```

separately where relevant.

---

# 144. Example Report Job

Actor:

```text
SYSTEM
```

Requested by:

```text
USR-002
```

---

# 145. Approval Execution Actor

Audit can capture:

```text
Requested By

Approved By

Executed By System/User
```

---

# 146. File Upload Flow

```text
Request upload authorization
↓
Permission check
↓
Generate signed upload
↓
Upload
↓
Confirm metadata
```

or backend proxy upload.

---

# 147. File Security

Do not trust filename.

Generate internal object key.

---

# 148. File Hash

Optional:

```text
SHA-256
```

for evidence integrity/dedup.

---

# 149. API Rate Limits

Use route groups.

Examples:

```text
Login-related:
strict

Report export:
limited

Financial posting:
reasonable

Meta manual sync:
strict/deduped
```

---

# 150. Rate Limit Is Not Duplicate Protection

Still require idempotency.

---

# 151. Request Timeout

API endpoints should be short.

Long jobs become async.

---

# 152. Maximum Sync HTTP Duration

Manual sync endpoint should only enqueue.

Not call Meta until completion.

---

# 153. Transaction Timeout

Financial DB transactions should be short.

Do not perform:

```text
PDF generation

Meta API

Email sending
```

inside transaction.

---

# 154. After-Commit Side Effects

Use outbox for:

```text
Notifications

Reconciliation

Cache invalidation

Report triggers
```

---

# 155. Why Not `setTimeout` After Commit

Process may crash.

Outbox durable.

---

# 156. Notification Architecture

Notification consumer receives event.

Failure:

```text
Notification remains retryable
```

Financial transaction stays committed.

---

# 157. Reconciliation Architecture

Same.

Financial post should not rollback because reconciliation worker temporarily unavailable.

---

# 158. Domain Invariants

Each domain owns its invariants.

Ledger:

```text
Debit = Credit
```

Funds:

```text
No over-allocation
```

Vendor:

```text
Payable never negative
```

---

# 159. Cross-Domain Invariants

Application orchestration handles:

```text
Vendor settlement
=
Vendor state + Ledger + Receivable
```

---

# 160. Transaction Boundary by Use Case

Avoid generic transaction around entire HTTP request.

Only business operation writes belong together.

---

# 161. Read Transactions

Use standard read isolation where sufficient.

Financial write isolation/locking defined per flow.

---

# 162. Isolation Strategy

Do not blindly run every transaction at:

```text
SERIALIZABLE
```

because of overhead.

Use targeted:

```text
row locks + constraints
```

and stronger isolation where proven necessary.

---

# 163. Unique Constraints

Examples:

```text
organization + meta_ad_account_id

organization + payment_reference when applicable

idempotency key

transaction reference
```

---

# 164. Partial Unique Index

Useful for:

```text
one active mapping
```

or:

```text
one current relationship
```

where schema supports.

---

# 165. Check Constraints

Examples:

```text
amount_minor > 0

exactly one debit/credit direction
```

---

# 166. Ledger Balance Enforcement

Transaction posting service calculates.

Optional DB function can assert:

```text
SUM(debit) = SUM(credit)
```

before changing transaction to POSTED.

---

# 167. Posted Immutability

Can be enforced through:

```text
Application guards

DB trigger
```

for defense-in-depth.

---

# 168. Audit Immutability

Same approach.

---

# 169. Data Integrity Error

If DB constraint rejects financial mutation:

return controlled error.

Do not disable constraint to make request succeed.

---

# 170. Domain Event Naming

Use past tense:

```text
ClientPaymentPosted

VendorSettlementPosted

AdAccountRestricted

SpendFactUpdated
```

---

# 171. Command Naming

Imperative:

```text
PostClientPayment

CreateVendorFunding

AllocateFunds
```

---

# 172. Event Payload Version

Outbox event can include:

```text
event_version
```

to support future consumers.

---

# 173. Event Payload Minimalism

Prefer IDs.

Consumer reloads current canonical state when needed.

---

# 174. Do Not Put Huge Entity Snapshot in Every Event

Creates schema coupling.

---

# 175. Reprocessing Events

Admin/system should be able to replay failed outbox event safely.

---

# 176. Dead Letter Handling

After repeated outbox/queue failure:

```text
FAILED
```

with alert.

Do not silently discard.

---

# 177. Queue Dead-Letter Concept

BullMQ failed jobs retained for investigation/retry.

Retention configured.

---

# 178. Outbox Is More Important Than Queue History

Canonical pending work remains in PostgreSQL outbox.

---

# 179. API Documentation

Swagger path:

```text
/api/docs
```

restricted in production if required.

---

# 180. OpenAPI Security

Document JWT bearer auth.

Do not expose live secrets in Swagger examples.

---

# 181. API Contract Tests

Validate frontend-relevant DTOs against OpenAPI.

---

# 182. Unit Test Targets

```text
Domain calculators

Ledger templates

Authorization policies

Error mapping

Status mapping
```

---

# 183. Integration Test Targets

```text
Payment posting

Vendor settlement

Fund allocation

Refund

Approval

Outbox
```

---

# 184. Concurrency Test Targets

```text
Two vendor settlements

Two client allocations

Duplicate refund post

Same idempotency key
```

---

# 185. Worker Tests

```text
Retry same job

Worker crash

Partial sync

Out-of-order Meta sync
```

---

# 186. Contract Test Meta Adapter

Use fixtures for:

```text
Ad Accounts

Campaigns

Insights

Errors
```

---

# 187. Test DB

Use real PostgreSQL semantics.

SQLite is not acceptable substitute for financial integration tests.

---

# 188. Test Redis

Queue integration tests should use real Redis-compatible service.

---

# 189. Seed Data

Use documented sample dataset.

Cover:

```text
Vendor overpayment

Locked funds

Shared account

Unattributed spend
```

---

# 190. Backend Performance Priorities

Optimize:

```text
Large ledger queries

Dashboard aggregation

Spend ingestion

Reconciliation
```

not basic Client CRUD prematurely.

---

# 191. N+1 Prevention

Use deliberate include/select/query patterns.

Monitor expensive Prisma queries.

---

# 192. Select Required Fields

Avoid fetching whole models including sensitive fields.

---

# 193. DB Query Timeout

Set reasonable statement/application timeouts for large reports.

Move huge workloads to async workers.

---

# 194. Financial Commands Should Stay Fast

Target:

```text
short DB transaction
```

not long report-like calculation.

---

# 195. Backend Deployment Units

Initial:

```text
API container

Worker container
```

same repository.

---

# 196. API Scaling

Can run multiple replicas later because stateless.

---

# 197. Worker Scaling

Increase workers by queue/domain.

---

# 198. Finance Worker Scaling

Be conservative.

Database locks protect correctness but excessive concurrency can create contention.

---

# 199. Meta Worker Scaling

Can scale more aggressively subject to API limits.

---

# 200. Health and Readiness

API readiness:

```text
DB reachable
```

Queue functionality can have separate status.

Worker readiness:

```text
DB + Redis
```

---

# 201. Graceful Shutdown

API:

```text
Stop accepting new requests

Finish active requests

Close DB client
```

Worker:

```text
Stop taking new jobs

Finish/abort safely

Release locks

Close Redis/DB
```

---

# 202. Deploy During Financial Post

Graceful shutdown reduces interruption.

Idempotency handles uncertain client retry.

---

# 203. Backend Security Boundaries

Public:

```text
Nest HTTP APIs
```

Private:

```text
Redis

Database credentials

Meta tokens

Worker internals
```

---

# 204. Internal Admin Endpoints

Sensitive endpoints:

```text
Rebuild projections

Retry outbox

Force reconciliation
```

require high-level permissions.

---

# 205. No Hidden Super Endpoint

Avoid generic:

```text
POST /admin/sql
```

or:

```text
PATCH /anything
```

in production.

---

# 206. Database Migration Access

Not exposed through application API.

Deployment pipeline only.

---

# 207. Backend Architecture Decision Summary

```text
NestJS modular monolith

Thin controllers

Use-case/application services

Explicit domain services

Prisma + reviewed SQL

PostgreSQL transactions

DB locking for money

Idempotency for critical writes

Transactional outbox

BullMQ workers

Central authorization

Central Meta adapter

Structured audit/errors
```

---

# 208. Backend Integrity Rules

System must enforce:

```text
1. Controllers must remain thin.

2. Financial rules must live server-side.

3. Frontend must never construct ledger entries.

4. All posted financial operations must use atomic PostgreSQL transactions.

5. Race-sensitive money operations must use database locking.

6. Critical mutations must support idempotency.

7. Same idempotency key with different request content must be rejected.

8. Posted ledger transactions must be immutable.

9. Financial correction must use reversal/new transaction.

10. Backend must derive ledger templates from transaction type.

11. Queue jobs must be treated as at-least-once delivery.

12. Workers must remain idempotent.

13. Queue payloads must contain references, not financial authority.

14. Important after-commit work must use transactional outbox.

15. External API calls must not sit inside long financial DB transactions.

16. Authentication and authorization must remain separate.

17. Resource scope must be checked server-side.

18. Maker-checker must be enforced server-side.

19. Tenant ID must scope all tenant-owned data queries.

20. Backend must never trust organization/user IDs from request body without auth context verification.

21. Raw external provider values must pass through adapters/mappers.

22. Unknown external values must remain explicit.

23. Sensitive secrets must never enter logs.

24. Large reads/reports must not block financial command endpoints.

25. Database constraints must backstop application validation.

26. Redis must not be trusted as canonical money state.

27. Application logs and audit logs must remain distinct.

28. A worker failure must not undo a committed financial transaction.

29. A notification failure must not make a financial post fail after commit.

30. Every critical financial use case must be independently testable with real PostgreSQL transaction semantics.
```

---

# 209. Backend Architecture Golden Rule

> **The backend is the authority that turns a user's intent into a valid business event. Every critical command must authenticate the actor, verify permission and current state, lock the required financial resources, apply deterministic domain rules, commit all canonical records atomically, preserve an audit trail, and only then hand asynchronous side effects to durable workers.**
