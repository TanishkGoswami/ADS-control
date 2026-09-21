# System Rules

## Overview

Ye document Ads Control system ke saare core business, financial, ledger, validation, approval aur audit rules ko ek single source of truth me define karta hai.

Covered rule groups:

```text
Golden Rules

Money Rules

Ledger Rules

Fund Ownership Rules

Client Rules

Vendor Rules

Meta Rules

Restricted Account Rules

Refund Rules

Reconciliation Rules

Validation Rules

Approval Rules

Audit Rules

Security Rules

Concurrency Rules

Data Integrity Rules
```

Core principle:

> **The system must never invent financial truth. Every amount must have a traceable source, owner, purpose, location, state and history.**

---

# 1. Golden Rule

The primary rule of the entire system is:

> **Money can never disappear. It can only change source, owner, purpose, location or status through an explicit recorded event.**

---

# 2. Six Questions Rule

For every rupee in the system, system must be able to answer:

```text
SOURCE
Where did the money come from?

OWNER
Who beneficially owns it?

PURPOSE
What is it intended for?

LOCATION
Where is it currently allocated/held?

STATUS
What can currently happen to it?

HISTORY
Which events brought it here?
```

If any answer is unknown:

```text
UNKNOWN
```

must be preserved explicitly.

---

# 3. Three Truths Rule

System maintains three separate truths:

```text
META TRUTH
External platform facts

LEDGER TRUTH
Accounting and money movement

BUSINESS TRUTH
Ownership and purpose
```

These must never be collapsed into one field.

---

# 4. Reconciliation Rule

Reconciliation exists to compare:

```text
Meta Truth
vs
Ledger Truth
vs
Business Truth
```

A mismatch must be surfaced.

It must never be hidden through silent adjustment.

---

# 5. Unknown Is Not Zero

```text
UNKNOWN
≠
0
```

Zero means verified zero.

Unknown means system does not currently know.

---

# 6. Stale Is Not Zero

If Meta/API data becomes stale:

retain:

```text
last known value
+
freshness state
```

Do not replace with:

```text
0
```

---

# 7. Error Is Not State

Examples:

```text
API timeout

HTTP 500

429

Network failure
```

do not prove:

```text
Account Restricted

Balance Zero

Spend Zero

Access Lost
```

---

# 8. Financial Authority

Canonical financial authority:

```text
PostgreSQL

Posted Ledger

Fund Allocation Model
```

Not:

```text
Frontend

Redis

Meta Balance

Spreadsheet

Cached Dashboard
```

---

# 9. Posted History Rule

Posted financial records are immutable.

Never directly edit:

```text
Posted Ledger Transaction

Posted Ledger Entry

Posted Vendor Settlement

Posted Refund
```

---

# 10. Correction Rule

Wrong financial event:

```text
Wrong Transaction
↓
Reversal
↓
Correct Transaction
```

Never:

```text
Edit old transaction
```

---

# 11. Deletion Rule

Historical financial records must not be hard-deleted.

Use:

```text
Reversal

Archive

Cancellation before posting

Superseding record
```

---

# 12. Atomicity Rule

Critical financial action must be:

```text
ALL OR NOTHING
```

Example:

```text
Client Payment
+
Ledger
+
Fund Lot
+
Audit
+
Outbox
```

must either all commit or all rollback.

---

# 13. Double-Entry Rule

For every posted ledger transaction:

```text
Total Debit
=
Total Credit
```

Always.

---

# 14. No Manual Balance Rule

Never expose:

```text
Edit Balance
```

as normal system operation.

Balances derive from records.

---

# 15. Money Storage Rule

Store monetary amounts as:

```text
BIGINT minor units
```

Example:

```text
₹20,000
=
2,000,000 paise
```

---

# 16. Floating Point Rule

Do not use floating-point canonical money calculations.

Avoid:

```text
FLOAT

DOUBLE

JavaScript floating Number money math
```

---

# 17. Currency Rule

Every monetary record must have explicit:

```text
Currency
```

or inherit from a strictly currency-specific financial account.

---

# 18. Cross-Currency Rule

Never silently combine:

```text
INR

USD
```

into one amount.

Conversion must be explicit.

---

# 19. Budget Rule

```text
Budget
≠
Money
```

Creating a job budget does not create financial funds.

---

# 20. Payment Rule

```text
Payment
≠
Allocation
```

Receiving client money does not automatically mean all of it is allocated to a campaign.

---

# 21. Allocation Rule

```text
Allocation
≠
Spend
```

Allocation means money is reserved/intended for use.

Spend requires external/internal consumption evidence.

---

# 22. Spend Rule

Meta spend is:

```text
External Observation
```

not a ledger transaction by itself.

---

# 23. Client Wallet Rule

Client wallet represents:

```text
Client-Owned Available Funds
```

even if physical cash sits in company bank.

---

# 24. Client Wallet Ownership Rule

Money in Client A wallet:

```text
OWNER = Client A
```

Company physical possession does not change beneficial ownership.

---

# 25. Service Fee Rule

Client payment can contain:

```text
Ads Fund

Service Fee
```

Only the Ads Fund portion enters client advertising-fund allocation.

---

# 26. Service Fee Separation

Never mix service fee into:

```text
Client Ads Wallet
```

---

# 27. Client Job Rule

```text
Client Job
≠
Meta Campaign
```

They must remain separate entities.

---

# 28. Job Mapping Rule

Client Job may map to:

```text
Multiple Meta Campaigns
```

---

# 29. Shared Account Rule

One Ad Account may serve:

```text
Multiple Clients

Multiple Jobs

Agency Funds
```

simultaneously.

---

# 30. Account Ownership Rule

Ad Account is:

```text
LOCATION
```

not beneficial owner of funds.

---

# 31. Mixed Ownership Rule

If same Ad Account contains:

```text
Client A ₹10,000

Client B ₹5,000

Agency ₹2,000
```

system must preserve three separate ownership records.

---

# 32. Silent Cross-Client Rule

Forbidden:

```text
Client A funds
→
Client B spend
```

without explicit approved ownership transfer.

---

# 33. Leftover Rule

Unused client funds remain:

```text
CLIENT OWNED
```

by default.

---

# 34. Leftover Default Destination

Safest default:

```text
Same Client Wallet
```

---

# 35. Allowed Leftover Actions

Leftover may be:

```text
Returned to same client wallet

Allocated to same client's new job

Refunded

Transferred through approved ownership transfer
```

---

# 36. Client Receivable Rule

Client receivable is separate from client wallet.

Never model:

```text
Wallet = -₹5,000
```

to represent money client owes company.

---

# 37. Agency Temporary Funding Rule

If agency funds client temporarily:

create explicit:

```text
Agency-Owned Fund Lot
```

---

# 38. Agency Funding Ownership

Agency temporary funding remains:

```text
OWNER = AGENCY
```

until legitimate ownership change/settlement.

---

# 39. Funding Gap Rule

If:

```text
Spend > Valid Allocated Funds
```

difference becomes:

```text
FUNDING_GAP
```

---

# 40. Funding Gap Ownership Rule

Do not automatically classify Funding Gap as:

```text
Agency Funding
```

without explicit funding event.

---

# 41. Spend Attribution Rule

Spend must be attributed only using valid:

```text
Campaign Mapping

Job Mapping

Owner Allocation

Date-Effective Relationship
```

---

# 42. Historical Mapping Rule

Historical spend uses mapping active on spend date.

Never use only current mapping.

---

# 43. Unattributed Spend Rule

If spend cannot be mapped:

```text
UNATTRIBUTED
```

---

# 44. Guessing Rule

Never guess client using:

```text
Campaign Name

Ad Account Name

Largest Client

Last Active Client
```

---

# 45. Ambiguous Mapping Rule

Overlapping valid mappings produce:

```text
AMBIGUOUS_MAPPING
```

and reconciliation case.

---

# 46. Spend Attribution Ceiling

```text
Attributed Spend
<=
Meta Spend
```

for same defined scope.

---

# 47. Fund Lot Rule

Every allocatable money source should create or reference a:

```text
FundLot
```

where practical.

---

# 48. Fund Lot Conservation Rule

For every Fund Lot:

```text
Original Amount
=
Available
+
Reserved
+
Allocated
+
Locked
+
Consumed
+
Refunded
+
Transferred
+
Written Off
```

according to the state model.

---

# 49. Active Bucket Rule

Active current buckets must be mutually exclusive.

Examples:

```text
AVAILABLE

RESERVED

ALLOCATED_AVAILABLE

LOCKED

REFUND_PENDING
```

Same rupee cannot exist in two active buckets simultaneously.

---

# 50. Terminal State Rule

Terminal allocation states include:

```text
CONSUMED

REFUNDED

TRANSFERRED

WRITTEN_OFF
```

---

# 51. Double Allocation Rule

Same money cannot be actively allocated twice.

---

# 52. Over-Allocation Rule

System must block:

```text
Allocation > Available Amount
```

---

# 53. Allocation Ownership Rule

Moving:

```text
Client Wallet
→
Job
→
Ad Account
```

does not change owner.

---

# 54. Ownership Transfer Rule

Ownership changes only through explicit:

```text
Ownership Transfer
```

event.

---

# 55. Ownership Transfer Approval Rule

Cross-owner transfer should require:

```text
Permission

Reason

Approval

Audit
```

according to policy.

---

# 56. Ownership Transfer History Rule

Original funding source must remain traceable after ownership transfer.

---

# 57. Meta Hierarchy Rule

Canonical external hierarchy:

```text
Meta Connection
→
Business Portfolio
→
Ad Account
→
Campaign
→
Ad Set
→
Ad
```

Internal financial ownership is separate.

---

# 58. External ID Rule

Canonical Meta identity uses:

```text
meta_business_id

meta_ad_account_id

meta_campaign_id
```

not names.

---

# 59. Name Rule

Names:

```text
can change

can duplicate
```

Never use names as stable identity.

---

# 60. Meta Connection Rule

Meta Connection represents:

```text
Authentication Context
```

not financial owner.

---

# 61. Multiple Access Paths Rule

Same Ad Account can be accessible through multiple Meta Connections.

Canonical Ad Account must not be duplicated.

---

# 62. Relationship History Rule

Meta access relationships must preserve:

```text
effective_from

effective_to
```

or equivalent history.

---

# 63. Meta Relationship Rule

Meta:

```text
OWNED

SHARED

CLIENT_ACCESS
```

relationship is not equivalent to money ownership.

---

# 64. Meta Credential Rule

Never store:

```text
Facebook Password
```

---

# 65. Meta Token Rule

Meta tokens must be:

```text
Encrypted at rest

Server-side only

Redacted from logs
```

---

# 66. Meta Scope Rule

Request only permissions actually required.

V1 should remain:

```text
read-first / read-only
```

---

# 67. Excess Permission Rule

Even if token has:

```text
ads_management
```

application must not perform write actions if feature disabled.

---

# 68. Meta Write Rule

V1:

```text
META_WRITE_ENABLED = false
```

---

# 69. Meta Balance Rule

Meta-reported:

```text
balance

amount_spent

spend_cap
```

must never automatically become:

```text
Client Wallet

Agency Fund

Ledger Account Balance
```

---

# 70. Meta API Failure Rule

API failure:

```text
retains last known value

ages freshness

records error
```

---

# 71. Partial Sync Rule

Partial sync must never cause:

```text
Asset Deletion

Balance Zeroing

Relationship Removal
```

---

# 72. Missing Asset Rule

Asset missing from incomplete sync:

```text
UNKNOWN
```

not deleted.

---

# 73. Full Discovery Rule

Relationship removal can only be considered after:

```text
Complete paginated discovery

Valid authentication

Valid permissions

No partial failure
```

---

# 74. Restriction Rule

Restriction changes:

```text
USABILITY
```

not ownership.

---

# 75. Restriction Trigger Rule

Only valid Meta status evidence should trigger financial lock workflow.

---

# 76. Restriction False Trigger Rule

Do not interpret:

```text
Timeout

429

500

Auth Failure

Stale Data
```

as restriction.

---

# 77. Lock Remaining Rule

When restriction occurs:

lock only:

```text
remaining unconsumed allocation
```

not already spent amount.

---

# 78. Restricted Example Rule

```text
Allocated ₹5,000
Spent ₹3,200
```

Restriction:

```text
Locked ₹1,800
```

---

# 79. Locked Ownership Rule

Locked funds retain original owner.

---

# 80. Locked Fund Rule

```text
LOCKED
≠
LOST
```

---

# 81. Vendor Liability During Restriction

Vendor payable remains even if vendor-funded liquidity becomes locked on Meta.

---

# 82. Replacement Account Rule

New account funding must use separate new allocation.

Never virtually move locked amount.

---

# 83. Restore Rule

Meta account becoming ACTIVE does not automatically unlock funds.

---

# 84. Unlock Rule

Unlock requires:

```text
Fresh status

Recent spend

Position reconciliation

Confirmed recoverable amount
```

---

# 85. Partial Recovery Rule

Only recovered/verified amount becomes available.

Remaining amount stays locked.

---

# 86. Permanent Loss Rule

Permanent unrecoverable amount requires explicit:

```text
Write-Off
```

---

# 87. Write-Off Rule

Write-off must require:

```text
Dedicated Permission

Reason

Evidence

Approval

Audit
```

---

# 88. Vendor Funding Rule

Vendor funding creates:

```text
Vendor Payable
```

not revenue.

---

# 89. Vendor Funding Batch Rule

Each distinct vendor funding event should normally create separate:

```text
Funding Batch
```

---

# 90. Gross Funding Rule

Original gross vendor funding history must never be silently reduced.

---

# 91. Vendor Payable Rule

```text
Vendor Payable >= 0
```

always.

---

# 92. Vendor Repayment Rule

Vendor repayment reduces:

```text
Vendor Payable
```

up to open payable amount.

---

# 93. Vendor Overpayment Rule

If:

```text
Payment > Payable
```

then:

```text
Valid Repayment = Payable

Excess = Vendor Receivable
```

---

# 94. Negative Payable Forbidden

Never model:

```text
Vendor Payable = -₹10,000
```

---

# 95. Vendor Receivable Rule

Overpayment becomes:

```text
Vendor Receivable
```

---

# 96. Payable/Receivable Visibility Rule

Vendor payable and vendor receivable remain separately visible.

---

# 97. Silent Netting Rule

Do not silently net:

```text
Vendor Receivable
```

against future vendor funding.

---

# 98. Explicit Offset Rule

Offset requires explicit transaction:

```text
New Gross Funding

Receivable Offset

Resulting Payable
```

all preserved separately.

---

# 99. Vendor Settlement FIFO Rule

Default repayment allocation:

```text
Oldest Open Funding Batch First
```

---

# 100. Manual Settlement Allocation Rule

Manual batch allocation requires:

```text
Permission

Reason

Audit
```

---

# 101. Vendor Settlement Pending Rule

Pending approved settlement does not reduce posted payable.

---

# 102. Vendor Settlement Atomicity Rule

Posting must:

```text
lock vendor

lock relevant batches

calculate payable

calculate excess

post ledger

update batches

create receivable if needed

commit together
```

---

# 103. Vendor Settlement Idempotency Rule

Settlement retry must not duplicate repayment.

---

# 104. Client Refund Rule

Refund only from valid:

```text
Client-Owned Refundable Funds
```

---

# 105. Refund Reservation Rule

Before external payment:

```text
AVAILABLE
→
REFUND_PENDING
```

---

# 106. Refund Pending Rule

```text
REFUND_PENDING
≠
REFUNDED
```

---

# 107. Refund Double-Use Rule

Reserved refund amount cannot be reallocated/spent.

---

# 108. Refund External Confirmation Rule

Refund final posting requires appropriate external confirmation/reference according to workflow.

---

# 109. Refund Failure Rule

Failed external refund:

```text
must not become REFUNDED
```

---

# 110. Refund Idempotency Rule

Same refund intent/reference must not produce duplicate financial effect.

---

# 111. Refund Over-Request Rule

Block:

```text
Requested Refund > Refundable Amount
```

---

# 112. Client Receivable Rule

If company funds client beyond received client funds and business agreement creates debt:

record:

```text
Client Receivable
```

separately.

---

# 113. Client Receivable Settlement Rule

Later client payment may explicitly settle receivable.

Do not silently alter historical agency funding.

---

# 114. Ledger Account Rule

Ledger should use defined logical accounts such as:

```text
Bank

Client Fund Liability

Vendor Payable

Vendor Receivable

Client Receivable

Agency Pool

Clearing
```

---

# 115. Ledger Transaction Rule

Every financial event gets:

```text
LedgerTransaction
```

with one or more:

```text
LedgerEntries
```

---

# 116. Ledger Entry Rule

Entry should include:

```text
Ledger Account

Debit/Credit Direction

Amount

Currency
```

---

# 117. Posting Template Rule

Business modules should use approved:

```text
Ledger Posting Templates
```

instead of constructing arbitrary debit/credit entries.

---

# 118. Raw Journal Rule

Normal users must not have raw:

```text
POST /ledger
```

journal creation authority.

---

# 119. Manual Journal Rule

If manual journal exists:

```text
Special Permission

Approval

Reason

Audit
```

required.

---

# 120. Ledger Immutability Rule

Posted entries cannot be updated or deleted.

---

# 121. Reversal Link Rule

Reversal must reference original transaction.

---

# 122. Duplicate Reference Rule

External payment references such as:

```text
UTR
```

should be duplicate-checked where business semantics require uniqueness.

---

# 123. External Reference Rule

External reference and API idempotency key are separate concepts.

---

# 124. Idempotency Rule

Critical financial mutations require idempotency.

---

# 125. Idempotency Scope Rule

Idempotency should consider:

```text
Organization

Operation

Idempotency Key
```

---

# 126. Same Key Rule

Same key + same request:

```text
Return existing result
```

---

# 127. Key Conflict Rule

Same key + different request:

```text
IDEMPOTENCY_KEY_CONFLICT
```

---

# 128. Idempotency Persistence Rule

Financial idempotency state belongs in PostgreSQL.

Not only Redis.

---

# 129. Concurrency Rule

Application-level pre-check alone is insufficient for money.

---

# 130. DB Lock Rule

Use PostgreSQL locking for:

```text
Fund Allocation

Vendor Settlement

Refund Reservation

Ownership Transfer

Receivable Offset
```

---

# 131. Redis Lock Rule

Redis locks may coordinate workers/schedulers.

They must not be final protection for financial invariants.

---

# 132. Lock Ordering Rule

Acquire DB locks in deterministic order to reduce deadlocks.

---

# 133. Deadlock Rule

Deadlock:

```text
Rollback complete transaction
```

then safely retry if operation is retryable/idempotent.

---

# 134. Frontend Rule

Frontend is not financial authority.

---

# 135. Frontend Balance Rule

Frontend displays backend-derived balances.

It does not create them.

---

# 136. Optimistic Money Rule

Avoid optimistic financial balance updates.

---

# 137. Permission UI Rule

Hiding a button is UX.

Backend authorization is security.

---

# 138. Server Validation Rule

Every critical validation must run on backend even if frontend already validates it.

---

# 139. Authentication Rule

Every protected request must have verified authenticated identity.

---

# 140. JWT Rule

Never authorize from decoded-but-unverified JWT.

---

# 141. Tenant Rule

Every tenant-owned record must belong to:

```text
organization_id
```

or an unambiguous protected tenant relationship.

---

# 142. Cross-Tenant Rule

ORG-A user cannot access ORG-B data.

---

# 143. Cross-Tenant Existence Rule

Unauthorized tenant should not learn whether target UUID exists.

---

# 144. RLS Rule

Use RLS as:

```text
Defense in Depth
```

not sole business authorization.

---

# 145. Service Role Rule

Privileged Supabase credentials remain server-only.

---

# 146. Meta Secret Rule

Meta secret/token remain server-only.

---

# 147. RBAC Rule

Roles map to granular permissions.

Do not scatter:

```text
if role == admin
```

checks everywhere.

---

# 148. Resource Scope Rule

Permission does not automatically grant access to every resource.

---

# 149. Least Privilege Rule

User receives only permissions required for their work.

---

# 150. Deny-by-Default Rule

No explicit permission:

```text
DENY
```

---

# 151. Inactive User Rule

Valid authentication token does not override internally deactivated membership.

---

# 152. MFA Rule

Privileged users should use MFA.

---

# 153. Step-Up Rule

Sensitive operations may require:

```text
AAL2
```

or equivalent step-up authentication.

---

# 154. Step-Up Candidate Rule

Recommended for:

```text
Write-Off

Large Refund

Ownership Transfer

Vendor Settlement Approval

Role Escalation

Manual Adjustment
```

---

# 155. Approval Rule

Approval and execution are separate stages.

---

# 156. Approval Snapshot Rule

Approval binds to material values:

```text
Amount

Currency

Source

Destination

Entity

Reason
```

---

# 157. Approval Mutation Rule

Material change invalidates approval.

---

# 158. Maker-Checker Rule

Where configured:

```text
Requester
≠
Approver
```

---

# 159. Self-Approval Rule

System must block prohibited self-approval server-side.

---

# 160. Approval Does Not Bypass Validation

At execution time system must revalidate:

```text
Current State

Funds

Permissions

Entity Status

Locks
```

---

# 161. Approval Expiry Rule

Approval may expire according to business policy if current financial state can materially change.

---

# 162. High-Risk Permission Rule

High-risk actions use dedicated permissions.

Do not hide them under broad:

```text
ADMIN
```

alone.

---

# 163. Audit Rule

Every important action must answer:

```text
Who?

What?

When?

Why?

Which Entity?

Which Transaction?

Which Request?
```

---

# 164. Audit Actor Rule

Actors:

```text
USER

SYSTEM

WORKER

MIGRATION
```

---

# 165. Audit Immutability Rule

Normal application users cannot edit/delete audit records.

---

# 166. Audit Secret Rule

Audit must not store:

```text
Passwords

Tokens

Secret Keys
```

---

# 167. Audit Correlation Rule

High-risk audit records should include:

```text
request_id

business_record_id

ledger_transaction_id

approval_id
```

where relevant.

---

# 168. Security Audit Rule

Also audit:

```text
Role changes

Permission changes

Meta reconnect

Secret rotation metadata

Financial feature flags
```

---

# 169. Archive Rule

Operational entities should usually be:

```text
ARCHIVED / INACTIVE
```

rather than hard-deleted.

---

# 170. Archive History Rule

Archiving does not delete:

```text
Ledger

Payments

Allocations

Audit

Historical Mappings
```

---

# 171. Operational Closure Rule

Operational completion is separate from financial settlement.

---

# 172. Financial Closure Rule

Entity should not be financially closed with unresolved:

```text
Payable

Receivable

Refund

Locked Fund

Funding Gap

Reconciliation Case
```

unless business policy explicitly allows documented exceptions.

---

# 173. Reconciliation Case Rule

Mismatch creates/reuses:

```text
Reconciliation Case
```

---

# 174. Reconciliation Difference Rule

Recommended:

```text
difference = observed - expected
```

---

# 175. Mismatch Rule

Mismatch:

```text
≠
Loss
```

---

# 176. Reconciliation Status Rule

Suggested:

```text
OPEN

UNDER_REVIEW

WAITING_FOR_SYNC

WAITING_FOR_DOCUMENT

WAITING_FOR_EXTERNAL_CONFIRMATION

ADJUSTMENT_PENDING

RESOLVED

CLOSED
```

---

# 177. Reconciliation Resolution Rule

Case cannot be resolved simply by changing status.

Underlying issue must be:

```text
Fixed

Explained

Reversed

Adjusted

Confirmed
```

according to policy.

---

# 178. Alert Rule

Alert means:

```text
Condition Requires Attention
```

---

# 179. Alert Acknowledge Rule

Acknowledging alert does not fix underlying condition.

---

# 180. Alert Resolution Rule

Condition-driven alerts should resolve only when condition is no longer true or valid resolution recorded.

---

# 181. Alert Dedup Rule

Repeated same condition should update same episode.

---

# 182. Reconciliation Dedup Rule

Same mismatch episode should not create unlimited duplicate cases.

---

# 183. Reconciliation Tolerance Rule

Core money ledgers generally use:

```text
0 minor-unit tolerance
```

unless explicit external rounding/timing rule exists.

---

# 184. Timing Difference Rule

Timing-related mismatch remains:

```text
OPEN / WAITING_FOR_SYNC
```

until resolved.

---

# 185. Clearing Rule

Unidentified money belongs in:

```text
CLEARING
```

until classification.

---

# 186. Clearing Ownership Rule

Do not guess owner of unidentified receipt.

---

# 187. Opening Balance Rule

Imported historical position must use explicit:

```text
OPENING_BALANCE
```

record.

---

# 188. Opening Verification Rule

Opening balance should be:

```text
VERIFIED
```

or:

```text
UNVERIFIED
```

---

# 189. Unknown Opening Owner Rule

Unknown owner remains:

```text
UNATTRIBUTED
```

---

# 190. Queue Rule

BullMQ/Redis coordinate asynchronous work.

They do not own business truth.

---

# 191. Queue Delivery Rule

Workers must assume:

```text
AT-LEAST-ONCE
```

delivery.

---

# 192. Worker Idempotency Rule

Repeating same job must be harmless.

---

# 193. Queue Payload Rule

Queue payload contains:

```text
IDs / references
```

not secrets or authoritative financial balance.

---

# 194. Worker Reload Rule

Worker reloads canonical current state before acting.

---

# 195. Outbox Rule

Important after-commit business events must use:

```text
Transactional Outbox
```

---

# 196. Outbox Atomicity Rule

Business transaction and corresponding outbox record commit together.

---

# 197. Outbox Retry Rule

Event delivery may retry without re-running source financial transaction.

---

# 198. Realtime Rule

Realtime is:

```text
UI invalidation signal
```

not financial truth.

---

# 199. Realtime Refetch Rule

After event:

```text
Frontend refetches API
```

for authoritative state.

---

# 200. Realtime Failure Rule

Realtime outage must not stop financial correctness.

---

# 201. Cache Rule

Caches are derived.

They must be rebuildable.

---

# 202. Cache Financial Rule

Never use cached balance as final authority for posting money.

---

# 203. Database Constraint Rule

Critical invariants must be backed by database constraints where practical.

---

# 204. Unique Constraint Rule

Use unique constraints for:

```text
Meta external IDs

Idempotency keys

Business references where required
```

---

# 205. Foreign Key Rule

Canonical relationships should use foreign keys where appropriate.

---

# 206. Check Constraint Rule

Examples:

```text
amount_minor > 0

valid state combinations
```

---

# 207. Multi-Tenant Constraint Rule

Unique keys should frequently include:

```text
organization_id
```

---

# 208. Data Source Rule

Every important imported fact should preserve provenance:

```text
source_type

sync_run_id

fetched_at
```

where relevant.

---

# 209. Sync Success Rule

Only successful observation updates:

```text
last_success_at
```

Failure updates:

```text
last_attempt_at

last_error
```

separately.

---

# 210. Freshness Rule

Freshness is domain-specific.

Example:

```text
Status Fresh

Spend Stale
```

is valid.

---

# 211. Out-of-Order Sync Rule

Older observation must not overwrite newer canonical external state.

---

# 212. Raw External Rule

Preserve raw Meta fields needed for diagnostics alongside normalized fields.

---

# 213. Unknown External Enum Rule

Unknown provider value maps to:

```text
UNKNOWN
```

not guessed known status.

---

# 214. Data Import Rule

Imported files/data must pass same:

```text
Validation

Tenant checks

Duplicate checks

Financial integrity
```

as UI entry.

---

# 215. Export Rule

Exports obey same permissions/resource scope as normal UI.

---

# 216. Export Audit Rule

Sensitive financial export should be auditable.

---

# 217. File Rule

Financial evidence files should be private.

---

# 218. Signed URL Rule

Sensitive file access uses:

```text
Short-lived signed URL
```

or backend-authorized proxy.

---

# 219. Posted Evidence Rule

Evidence attached to posted financial record should not be silently replaced/deleted.

Use version/supersede workflow.

---

# 220. Backup Rule

PostgreSQL financial state must be backed up.

---

# 221. Storage Backup Rule

Database backup does not replace Storage-object backup.

---

# 222. Redis Backup Rule

Redis backup is operational convenience.

It is not financial disaster-recovery authority.

---

# 223. Restore Rule

After DB restore:

```text
Financial Writes Disabled
```

until integrity checks complete.

---

# 224. Post-Restore Rule

Must run:

```text
Ledger Checks

Fund Conservation

Vendor Checks

Client Checks

Reconciliation

Meta Resync
```

---

# 225. PITR Rule

PITR is disaster recovery.

Not normal accounting correction.

---

# 226. External Side-Effect Recovery Rule

After PITR/restore:

external payment or action may already have occurred.

Never blindly replay.

---

# 227. Deployment Rule

Production changes must be version-controlled.

---

# 228. Migration Rule

Database changes must use migrations.

---

# 229. Financial Migration Rule

Changes affecting ledger/funds/settlements require additional review.

---

# 230. Failed Migration Rule

Migration failure stops deployment.

---

# 231. Rollback Rule

Application rollback is preferred when schema remains compatible.

Do not blindly reverse financial DB migration.

---

# 232. Feature Flag Rule

Risky functionality should support controlled flags.

Examples:

```text
META_WRITE_ENABLED=false

CROSS_CLIENT_TRANSFER_ENABLED=false
```

---

# 233. Financial Kill Switch Rule

System should support:

```text
FINANCIAL_WRITES_ENABLED=false
```

for emergencies.

---

# 234. Fail-Closed Rule

If system cannot determine whether sensitive action is safe:

```text
DENY / BLOCK
```

---

# 235. Availability vs Correctness Rule

For financial writes:

```text
Correctness
>
Availability
```

---

# 236. Business Rule Precedence

When conflicting information exists:

do not automatically pick one truth.

Use reconciliation.

---

# 237. Manual Override Rule

Manual override must not erase original observation/history.

---

# 238. Override Audit Rule

Any override requires:

```text
Actor

Reason

Timestamp

Previous Value

New Value
```

where applicable.

---

# 239. No Silent Auto-Fix Rule

System should not silently mutate canonical finance to make reconciliation green.

---

# 240. AI Rule

AI may:

```text
Explain

Summarize

Suggest investigation
```

but must not autonomously decide financial truth in V1.

---

# 241. AI Posting Rule

AI cannot autonomously:

```text
Post Ledger Transaction

Transfer Ownership

Write-Off

Approve Refund

Settle Vendor
```

---

# 242. Reporting Rule

Reports derive from canonical records.

Reports are not themselves canonical financial records.

---

# 243. Snapshot Rule

Snapshots are derived.

They can be rebuilt.

---

# 244. Projection Rule

Cached/projected balance differences must be corrected by rebuilding projection.

Not by altering ledger.

---

# 245. Time Rule

Canonical timestamps use server/database time.

Do not trust browser clock.

---

# 246. Timezone Rule

Store system timestamps in UTC.

Use explicit business/account timezone for date semantics.

---

# 247. Meta Spend Date Rule

Meta daily spend respects Ad Account reporting timezone.

---

# 248. Human Reference Rule

Human IDs such as:

```text
CLI-0001
VEN-0001
```

are references.

Internal UUID remains canonical internal identity.

---

# 249. Status Rule

Do not overload one status field to represent:

```text
Operational State

Financial State

Sync State

Approval State
```

Use separate status dimensions.

---

# 250. State Transition Rule

Important entities should only move through defined valid state transitions.

---

# 251. Draft Rule

Draft records may be editable.

Posted records generally are not.

---

# 252. Pending Rule

Pending action must not alter posted financial truth unless explicit reservation model applies.

---

# 253. Reservation Rule

Reservation changes availability but not final financial ownership.

---

# 254. Reservation Release Rule

Cancelled/failed pending action should explicitly release reservation.

---

# 255. Validation Order Rule

Recommended financial action order:

```text
Authenticate

Authorize

Validate DTO

Validate Entity

Validate Business Rules

Acquire Locks

Revalidate Financial State

Post
```

---

# 256. Preview Rule

Preview is informational.

Final posting recalculates under current locked state.

---

# 257. Preview Reservation Rule

Preview does not reserve money unless explicitly documented.

---

# 258. State Changed Rule

If financial state changes after preview:

return:

```text
FINANCIAL_STATE_CHANGED
```

and require user review.

---

# 259. Business Reason Rule

High-risk operations require meaningful reason.

Examples:

```text
Reversal

Write-Off

Ownership Transfer

Manual Adjustment
```

---

# 260. Reason Is Not Approval Rule

Entering a reason does not replace approval.

---

# 261. Validation Error Rule

Distinguish:

```text
Invalid Input
```

from:

```text
Valid Input But Invalid Business State
```

---

# 262. Error Code Rule

Backend returns stable machine-readable error codes.

---

# 263. Secret Error Rule

Error response must never expose:

```text
SQL

Stack Trace

Credential

Token
```

---

# 264. Request Correlation Rule

Important actions should propagate:

```text
request_id
```

through:

```text
API

Audit

Outbox

Worker
```

where practical.

---

# 265. Security Logging Rule

Repeated unauthorized actions can be security alerts.

---

# 266. Data Minimization Rule

Store only information needed for legitimate system operation.

---

# 267. Production Data Rule

Do not casually copy production database into development.

---

# 268. Test Data Rule

Use synthetic or sanitized data for normal testing.

---

# 269. Financial Test Rule

Financial concurrency/integrity tests must use real PostgreSQL semantics.

---

# 270. SQLite Rule

Do not use SQLite as substitute for critical production financial integration tests.

---

# 271. Concurrency Test Rule

Must test:

```text
Two Settlements

Two Allocations

Duplicate Refund

Duplicate Payment

Concurrent Ownership Transfer
```

---

# 272. Recovery Test Rule

Backups must be restore-tested periodically.

---

# 273. RLS Test Rule

Tenant isolation must be tested at DB and API levels.

---

# 274. Realtime Test Rule

Missing/duplicate/out-of-order realtime messages must not corrupt state.

---

# 275. Queue Test Rule

Worker retries must never duplicate financial effects.

---

# 276. Financial Integrity Alerts

System should detect:

```text
Unbalanced Ledger

Negative Payable

Over-Allocation

Orphan Financial Records

Duplicate Active Allocation
```

---

# 277. Integrity Violation Rule

Detected invariant violation:

```text
CRITICAL
```

Do not silently auto-correct.

---

# 278. Financial Reporting Rule

Never label:

```text
Client Payment
```

as company revenue unless accounting definition explicitly says so.

---

# 279. Gross vs Net Rule

Preserve gross figures where needed.

Example:

```text
Gross Vendor Funding

Receivable Offset

Net Payable
```

all separately traceable.

---

# 280. Physical vs Logical Money Rule

Physical location can differ from beneficial ownership.

Example:

```text
Money physically in company bank

Owner logically Client A
```

Both must remain representable.

---

# 281. Source vs Owner Rule

Source and owner are separate.

Example:

```text
Source = Vendor Credit

Owner = Client A
```

can be valid depending on business event.

---

# 282. Purpose Rule

Purpose can change through explicit reallocation while owner stays same.

---

# 283. Location Rule

Logical location changes do not necessarily represent physical bank movement.

---

# 284. Status Rule

Status changes do not necessarily represent ownership changes.

Example:

```text
AVAILABLE
→
LOCKED
```

same owner.

---

# 285. History Rule

Every important state transition should be traceable through immutable events/history.

---

# 286. Rule Conflict Handling

If two rules appear to conflict:

apply priorities:

```text
Financial Integrity

Ownership Preservation

Auditability

Security

Business Configuration

Operational Convenience
```

---

# 287. System-Wide Golden Rules

```text
1. Money never disappears.

2. Unknown never becomes zero automatically.

3. Ownership never changes silently.

4. Posted financial history is immutable.

5. Corrections append history instead of rewriting it.

6. Debit must always equal credit.

7. Budget is not money.

8. Payment is not allocation.

9. Allocation is not spend.

10. Meta truth is not ledger truth.

11. Meta account ownership is not financial ownership.

12. Client funds remain client-owned until an explicit valid ownership change.

13. Locked funds are unavailable, not automatically lost.

14. Vendor funding is liability, not revenue.

15. Vendor payable can never be negative.

16. Vendor overpayment creates receivable.

17. Client receivable is separate from client wallet.

18. Unattributed spend remains unattributed until evidence resolves it.

19. Overspend creates funding gap unless an explicit valid funding event exists.

20. Pending actions must not masquerade as posted actions.

21. Financial commands must be atomic.

22. Financial retries must be idempotent.

23. Database locks protect money from concurrency races.

24. Redis never owns financial truth.

25. Realtime never owns financial truth.

26. Frontend never owns financial truth.

27. Meta API failures never erase known financial state.

28. Partial synchronization never deletes history.

29. Security fails closed.

30. Tenant boundaries are absolute.

31. Sensitive actions require explicit permissions.

32. High-risk actions may require approval and MFA.

33. Self-approval is blocked where maker-checker applies.

34. Audit records must explain high-risk actions.

35. Reconciliation exposes disagreement instead of hiding it.

36. Alerts do not replace reconciliation.

37. Archives do not delete history.

38. Operational closure is not financial closure.

39. Backups must be restorable, not merely created.

40. Every rupee must remain explainable from origin to final state.
```

---

# 288. Rules Golden Rule

> **The system must prefer explicit uncertainty over invented certainty, explicit ownership over inferred ownership, append-only history over silent correction, database-enforced integrity over UI assumptions, and reconciliation over hiding differences. At any moment, every amount must remain traceable from its source through every allocation, spend, lock, transfer, refund, settlement or write-off until its final state.**
