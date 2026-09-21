# Complete System Flows

## Overview

Ye document Ads Control system ke saare major operational aur financial flows ko ek single source of truth me define karta hai.

Covered flows:

```text
Meta Account Onboarding
Client Creation
Client Payment
Fund Allocation to Ad Account
Client Campaign Execution
Client Leftover Handling
Restricted Ad Account
Vendor Funding
Vendor Repayment
Vendor Overpayment
Refund and Financial Adjustment
```

Core principle:

> **Every flow must preserve source, owner, purpose, location, status and history of money without silent balance manipulation.**

---

# 1. Universal Flow Principles

Har financial flow ko ye questions answer karne chahiye:

```text
SOURCE
Money kahan se aaya?

OWNER
Money kis ka hai?

PURPOSE
Money kis kaam ke liye hai?

LOCATION
Money abhi logically/physically kahan hai?

STATUS
Available, allocated, locked, consumed, refunded etc.?

HISTORY
Yahan tak kaise aaya?
```

---

# 2. Universal Financial Rules

All flows must follow:

```text
Budget ≠ Payment

Payment ≠ Allocation

Allocation ≠ Spend

Meta Balance ≠ Client Wallet

Vendor Funding ≠ Revenue

Locked Fund ≠ Lost Fund

Vendor Payable ≠ Vendor Receivable

Client Wallet ≠ Client Receivable
```

---

# 3. Three Truths

System maintains:

```text
Meta Truth
External operational facts

Ledger Truth
Accounting / money movement

Business Truth
Ownership and purpose
```

Reconciliation connects them.

---

# 4. Financial Mutation Rule

No endpoint or UI should directly do:

```text
balance = balance - amount
```

Canonical amounts must derive from:

```text
Ledger
+
Fund Allocation
+
Posted Business Records
```

---

# 5. Transaction Rule

Financial posting:

```text
Validate
↓
Authorize
↓
Lock
↓
Calculate
↓
Create Business Record
↓
Create Ledger Transaction
↓
Create Ledger Entries
↓
Create Allocation Events
↓
Audit
↓
Outbox
↓
COMMIT
```

If any required step fails:

```text
ROLLBACK
```

---

# 6. Correction Rule

Posted transaction is never edited.

Correction:

```text
Wrong Transaction
↓
Reversal
↓
Correct Transaction
```

---

# FLOW A — META ACCOUNT ONBOARDING

# 7. Goal

Meta Connection ko safely connect karna aur accessible business assets ko internal canonical entities me synchronize karna.

---

# 8. Actor

Required actor:

```text
Admin
```

Required permission:

```text
META_CONNECTION_MANAGE
```

Recommended:

```text
MFA AAL2
```

---

# 9. Entry Point

```text
Settings
→ Meta Integrations
→ Add Connection
```

---

# 10. Authentication

System uses supported:

```text
OAuth / Access Token
```

Never:

```text
Facebook Password
```

---

# 11. Meta Connection Flow

```text
Admin Starts Connection
↓
Meta Authentication
↓
Credential Received
↓
Credential Validation
↓
Encrypt Credential
↓
Create Meta Connection
↓
Verify Permissions
↓
Discover Businesses
↓
Discover Ad Accounts
↓
Sync Status
↓
Sync Campaigns
↓
Sync Recent Spend
↓
Reconcile
↓
Connection Ready
```

---

# 12. Initial Connection State

Before verification:

```text
PENDING_VERIFICATION
```

Possible final health:

```text
ACTIVE

DEGRADED

AUTH_REQUIRED

PERMISSION_ERROR

SYNC_ERROR

DISABLED

UNKNOWN
```

---

# 13. Token Security

Store:

```text
Encrypted token

Key version

Auth mode

Token metadata
```

Never expose token in:

```text
Frontend

Logs

Queue payloads

Audit text
```

---

# 14. Permission Verification

V1 expected:

```text
ads_read
```

and if required for business discovery:

```text
business_management
```

Permission state:

```text
GRANTED

MISSING

DECLINED

EXPIRED

REVOKED

UNKNOWN
```

---

# 15. Permission ≠ Asset Access

Even if:

```text
ads_read = GRANTED
```

specific Ad Account may still be unavailable.

---

# 16. Business Discovery

Create/update canonical:

```text
BusinessPortfolio
```

using:

```text
organization_id
+
meta_business_id
```

Name is metadata only.

---

# 17. Ad Account Discovery

Canonical identity:

```text
organization_id
+
meta_ad_account_id
```

Never name.

---

# 18. Multiple Connections

Same Ad Account may be visible through multiple Meta Connections.

Therefore:

```text
MetaConnection
↔
AdAccount
```

must be a relationship.

Do not duplicate canonical Ad Account.

---

# 19. Relationship Type

Possible:

```text
OWNED

SHARED

CLIENT_ACCESS

DISCOVERED

UNKNOWN
```

This is not financial ownership.

---

# 20. Initial Ad Account Data

Fetch:

```text
Meta ID

Name

Currency

Timezone

Account Status

Disable Reason

Business

Spend Cap

Meta Balance Observation

Meta Amount Spent Observation
```

---

# 21. Meta Financial Fields

Fields like:

```text
balance

amount_spent
```

remain:

```text
EXTERNAL OBSERVATIONS
```

They are not internal wallet balances.

---

# 22. Status Mapping

Store:

```text
raw account status

raw disable reason
```

plus normalized:

```text
ACTIVE

RESTRICTED

DISABLED

PAYMENT_ISSUE

ACCESS_LOST

UNKNOWN
```

---

# 23. Unknown Raw Status

Unknown Meta value:

```text
UNKNOWN
```

Never crash or infer restriction.

---

# 24. Campaign Discovery

Create canonical campaigns using Meta campaign ID.

Campaign is not Client Job.

---

# 25. Client Mapping

After discovery:

```text
Meta Campaign
↔
Internal Client Job
```

must be explicitly mapped.

---

# 26. Initial Spend

Recommended recent window:

```text
30–90 days configurable
```

Recent spend first.

Historical backfill later.

---

# 27. Spend Pipeline

```text
Meta Insight
↓
SpendFact
↓
Campaign Mapping
↓
Client Job
↓
Spend Attribution
↓
Reconciliation
```

---

# 28. Unmapped Campaign

If no job mapping:

```text
UNATTRIBUTED SPEND
```

Never guess client from campaign name.

---

# 29. Onboarding Completion

Connection becomes operational when:

```text
Authentication valid

Required permission usable

At least expected asset access confirmed

Initial required sync completed
```

Historical backfill can continue asynchronously.

---

# 30. Onboarding Failure

If Meta returns temporary error:

```text
retain connection
+
retry
```

Do not delete imported data.

---

# 31. Disable Connection

Disable:

```text
Stops future scheduled sync
```

but preserves:

```text
Assets

History

Spend Facts

Audit

Relationships
```

---

# FLOW B — ADD CLIENT

# 32. Goal

Create internal Client entity independently from Meta assets.

---

# 33. Actor

Required:

```text
CLIENT_CREATE
```

---

# 34. Client Creation Flow

```text
Create Client
↓
Validate Details
↓
Check Duplicate
↓
Generate Internal ID
↓
Assign Team
↓
Create Client Record
↓
Audit
↓
Client ACTIVE
```

---

# 35. Client Identity

Internal UUID:

```text
Primary identity
```

Human reference:

```text
CLI-0001
```

Name is not primary identity.

---

# 36. Minimum Client Data

Recommended:

```text
Name

Status

Primary Contact optional

Assigned Team/Manager

Notes optional
```

Financial data starts separately.

---

# 37. Client Is Not Meta Account

Never model:

```text
Client = Ad Account
```

One Client can use many accounts.

One account can serve many clients.

---

# 38. Client Status

Possible:

```text
ACTIVE

INACTIVE

ARCHIVED
```

---

# 39. Archive

Client archive:

```text
Stops new normal operations
```

but does not remove:

```text
Payments

Ledger

Refunds

Jobs

Locked Funds

Receivables
```

---

# FLOW C — CLIENT JOB CREATION

# 40. Goal

Create internal business unit representing a specific client engagement/campaign purpose.

---

# 41. Flow

```text
Client
↓
Create Job
↓
Define Budget
↓
Define Date Range
↓
Assign Team
↓
Job ACTIVE
```

---

# 42. Budget Rule

Job budget:

```text
Planning Number
```

It does not create money.

Example:

```text
Budget ₹50,000
Payment ₹0
```

means:

```text
Client has not funded job yet.
```

---

# 43. Job Status

Suggested:

```text
DRAFT

ACTIVE

PAUSED

COMPLETED

CANCELLED
```

Financial settlement status remains separate.

---

# 44. Operational Closure

Job:

```text
COMPLETED
```

does not mean:

```text
Financially settled
```

Leftover/refund/receivable may remain.

---

# FLOW D — CLIENT PAYMENT

# 45. Goal

Record actual client money received.

---

# 46. Flow

```text
Client Pays
↓
Record Payment
↓
Validate Reference
↓
Determine Payment Purpose
↓
Begin Transaction
↓
Create Client Payment
↓
Post Ledger
↓
Create Fund Lot
↓
Place Ad-Fund Portion In Client Wallet
↓
Audit + Outbox
↓
COMMIT
```

---

# 47. Example

Client sends:

```text
₹25,000
```

Breakdown:

```text
Ad Fund: ₹20,000

Service Fee: ₹5,000
```

Only:

```text
₹20,000
```

becomes allocatable client-owned advertising funds.

---

# 48. Service Fee

Service fee must remain separate accounting treatment.

Never place fee inside:

```text
Client Ads Wallet
```

---

# 49. Payment Ledger Concept

Example simplified:

```text
Dr Bank / Cash

Cr Client Fund Liability
```

for ad-fund portion.

Exact chart of accounts defined by ledger model.

---

# 50. Fund Lot

Client payment generates:

```text
FundLot
```

with:

```text
source = CLIENT_PAYMENT

owner = CLIENT

location = CLIENT_WALLET

status = AVAILABLE
```

---

# 51. Payment Reference

Store:

```text
UTR / transaction reference
```

where available.

Use duplicate detection.

---

# 52. Duplicate Payment

Same valid external reference should not silently create second payment.

---

# 53. Payment Idempotency

Critical posting requires:

```text
Idempotency-Key
```

---

# 54. Partial Payment

Allowed.

Example:

```text
Job Budget ₹50,000

Client Paid ₹30,000
```

Available client funding:

```text
₹30,000
```

Budget remains:

```text
₹50,000
```

---

# 55. Remaining Budget

Difference does not automatically create client receivable unless business policy explicitly creates one.

---

# FLOW E — ADD FUNDS TO CLIENT JOB

# 56. Goal

Move client-owned available money into a job allocation.

---

# 57. Flow

```text
Client Wallet
↓
Select Job
↓
Enter Amount
↓
Validate Owner
↓
Check Available
↓
Lock Source Fund Lots
↓
Create Job Allocation
↓
Allocation Event
↓
Audit
↓
COMMIT
```

---

# 58. Ownership

Movement:

```text
Client Wallet
→ Client Job
```

does not change:

```text
OWNER = CLIENT
```

---

# 59. Example

Wallet:

```text
₹20,000
```

Allocate:

```text
₹15,000
```

Result:

```text
Wallet Available ₹5,000

Job Allocated ₹15,000
```

---

# 60. No Over-Allocation

Cannot allocate:

```text
₹25,000
```

from:

```text
₹20,000
```

---

# 61. Source Lot Lineage

Allocation should preserve which FundLot(s) funded it where practical.

---

# FLOW F — ADD FUND TO AD ACCOUNT

# 62. Goal

Represent internal logical allocation of money intended for use on a specific Meta Ad Account.

---

# 63. Important Distinction

This flow represents:

```text
Internal Fund Allocation
```

It is not necessarily the same as physically topping up Meta.

---

# 64. Flow

```text
Job Allocation / Client Wallet / Agency Pool
↓
Select Ad Account
↓
Validate Currency
↓
Validate Account State
↓
Validate Owner
↓
Lock Source Allocation
↓
Create Ad Account Allocation
↓
Audit
↓
COMMIT
```

---

# 65. Example

Client A Job:

```text
₹15,000
```

Allocate to AD1:

```text
₹12,000
```

Result:

```text
Job Unassigned ₹3,000

AD1 Client-A Allocation ₹12,000
```

---

# 66. Mixed Ownership

Same Ad Account may contain:

```text
Client A ₹10,000

Client B ₹5,000

Agency ₹3,000
```

System must preserve separate allocations.

---

# 67. Ad Account Does Not Become Owner

Location:

```text
AD_ACCOUNT
```

Owner remains:

```text
CLIENT / AGENCY
```

---

# 68. Currency Validation

Allocation currency should match intended account/business rules.

Unexpected currency mismatch:

```text
BLOCK / REVIEW
```

not auto-convert.

---

# 69. Restricted Account

Do not normally add new operational allocation to account currently:

```text
RESTRICTED
```

unless explicit recovery/admin workflow allows.

---

# FLOW G — RUN CLIENT CAMPAIGN

# 70. Goal

Map actual Meta spend back to internal Client Job and funding allocation.

---

# 71. Flow

```text
Client Job
↓
Campaign Mapping
↓
Meta Campaign Runs
↓
Meta Spend Sync
↓
SpendFact
↓
Historical Mapping Lookup
↓
Spend Attribution
↓
Consume Matching Fund Allocation
↓
Reconciliation
```

---

# 72. Client Job vs Campaign

One job can map to:

```text
Many campaigns
```

One campaign should have clear effective historical mapping.

---

# 73. Effective Dating

Mapping needs:

```text
effective_from

effective_to
```

because campaign assignment may change over time.

---

# 74. Historical Spend

Spend dated:

```text
September 10
```

must use mapping active on September 10.

Not today's mapping.

---

# 75. Spend Source

Spend comes from:

```text
Meta Insights
```

---

# 76. SpendFact

Represents:

```text
Meta-reported spend
```

---

# 77. Spend Attribution

Represents:

```text
Which owner/job/allocation consumed it
```

---

# 78. Spend Allocation

Example:

```text
AD1:

Client A Allocation ₹10,000

Agency Allocation ₹5,000
```

If mapped job belongs to Client A:

consume according to configured valid funding priority.

Do not randomly consume Client B funds.

---

# 79. FIFO

Default within same:

```text
Owner

Currency

Fund class
```

can use FIFO.

Mixed-owner allocation requires explicit attribution policy.

---

# 80. Overspend

If:

```text
Attributed Spend > Valid Allocated Funds
```

create:

```text
FUNDING_GAP
```

---

# 81. Funding Gap

Funding gap is not automatically:

```text
Agency money
```

unless an explicit agency funding event exists.

---

# 82. Unattributed Spend

If Meta spend exists without valid mapping:

```text
UNATTRIBUTED
```

---

# 83. Ambiguous Mapping

Overlapping valid mappings:

```text
AMBIGUOUS_MAPPING
```

and reconciliation case.

---

# 84. Spend Revision

Meta can revise historical spend.

When SpendFact changes:

```text
Recalculate attribution

Update reconciliation

Do not rewrite ledger silently
```

---

# FLOW H — CLIENT LEFTOVER

# 85. Goal

Handle unused client-owned funds after campaign/job activity.

---

# 86. Definition

Leftover:

```text
Client-owned allocated funds
-
valid spend
-
refund reservations
-
locked funds
```

remaining after job operations.

---

# 87. Default Ownership

Leftover remains:

```text
CLIENT-OWNED
```

---

# 88. Flow

```text
Job Paused/Completed
↓
Sync Final Recent Spend
↓
Reconcile
↓
Calculate Valid Remaining
↓
Determine Leftover State
↓
Return / Reallocate / Refund
```

---

# 89. Allowed Leftover Destinations

```text
Return to Same Client Wallet

Allocate to New Job for Same Client

Refund to Same Client

Approved Ownership Transfer

Approved Cross-Client Transfer
```

---

# 90. Default Action

Safest default:

```text
Return to Same Client Wallet
```

---

# 91. Example

Payment:

```text
₹20,000
```

Spend:

```text
₹11,500
```

Refund:

```text
₹5,000
```

Remaining client-owned:

```text
₹3,500
```

---

# 92. Never Silent Cross-Client Use

Client A leftover cannot automatically fund:

```text
Client B
```

---

# 93. Same-Client New Job

Allowed explicit transfer:

```text
Client A Job 1
→
Client A Wallet
→
Client A Job 2
```

Lineage preserved.

---

# 94. Leftover on Restricted Account

If amount inaccessible due restriction:

status becomes:

```text
LOCKED
```

not wallet available.

---

# 95. Job Completion

Job cannot be considered financially settled while unresolved:

```text
Locked Funds

Refund Pending

Funding Gap

Unattributed Spend

Receivable
```

remain.

---

# FLOW I — ACCOUNT RESTRICTED

# 96. Goal

Handle Meta Ad Account restriction without changing fund ownership incorrectly.

---

# 97. Trigger

Valid Meta status observation:

```text
ACTIVE
→
RESTRICTED
```

---

# 98. API Failure Is Not Restriction

These are not enough:

```text
Timeout

500

429

Auth failure

Stale data
```

They create:

```text
UNKNOWN / STALE / ACCESS ISSUE
```

not restriction.

---

# 99. Restriction Flow

```text
Meta Status Sync
↓
Confirmed RESTRICTED
↓
Create Restriction Episode
↓
Identify Remaining Active Allocations
↓
Move Remaining Usable Allocation To LOCKED
↓
Preserve Owner
↓
Create Alert
↓
Create Recovery Case
↓
Reconcile
```

---

# 100. Example — No Spend

Client allocation:

```text
₹2,000
```

Restriction occurs before spend.

Result:

```text
Client-owned Locked Fund ₹2,000
```

---

# 101. Example — Partial Spend

Allocation:

```text
₹5,000
```

Spend:

```text
₹3,200
```

Restriction:

```text
Remaining ₹1,800
```

Result:

```text
Consumed ₹3,200

Locked ₹1,800
```

---

# 102. Ownership Preservation

Restriction changes:

```text
USABILITY
```

not:

```text
OWNERSHIP
```

---

# 103. Mixed Owners

If account holds:

```text
Client A ₹5,000

Agency ₹2,000
```

restriction produces:

```text
Client A Locked ₹5,000

Agency Locked ₹2,000
```

separately.

---

# 104. Vendor Liability

If money originally came from vendor credit:

restriction does not reduce vendor payable.

---

# 105. Replacement Account

If operations move to new account:

```text
New Account Funding
```

must be a separate financial allocation.

Do not pretend locked money moved.

---

# 106. Restore

Meta account becomes:

```text
ACTIVE
```

This alone does not unlock money.

---

# 107. Restore Flow

```text
Meta ACTIVE
↓
Targeted Status Refresh
↓
Recent Spend Refresh
↓
Position Reconciliation
↓
Confirm Recoverable Amount
↓
Unlock Confirmed Amount
```

---

# 108. Partial Recovery

Locked:

```text
₹10,000
```

Recovered:

```text
₹6,000
```

Result:

```text
Available/Recovered ₹6,000

Locked ₹4,000
```

---

# 109. Refund From Meta

If actual Meta refund is received:

```text
External Refund Observation
↓
Identify Original Ownership
↓
Ledger / Clearing
↓
Allocation Resolution
↓
Client/Agency disposition
```

---

# 110. Permanent Unrecoverable

Requires explicit:

```text
Write-Off
```

with:

```text
Permission

Approval

Reason

Evidence

Audit
```

---

# FLOW J — VENDOR FUNDING

# 111. Goal

Record funding or credit received from vendor/agency financier.

---

# 112. Core Accounting

Vendor funding is:

```text
LIABILITY
```

not revenue.

---

# 113. Flow

```text
Vendor Sends Funds / Credit
↓
Record Funding
↓
Verify Reference
↓
Begin Transaction
↓
Create Vendor Funding
↓
Create Funding Batch
↓
Post Ledger
↓
Increase Vendor Payable
↓
Audit + Outbox
↓
COMMIT
```

---

# 114. Example

Vendor Ram provides:

```text
₹1,00,000
```

Create:

```text
Funding Batch:
RAM-RF-001
```

Vendor Payable:

```text
₹1,00,000
```

---

# 115. Source vs Owner

Vendor may be:

```text
funding source / creditor
```

but is not automatically beneficial owner of money assigned later to a client.

---

# 116. Batch Data

Recommended:

```text
Batch Reference

Gross Amount

Currency

Funding Date

External Reference

Open Amount

Status
```

---

# 117. Gross History

Never reduce original funding history because later settlement occurs.

Example:

```text
RAM-RF-001 Gross ₹1,00,000
```

stays ₹1,00,000 historically.

---

# 118. New Funding

Every distinct funding event generally creates new batch.

---

# 119. Duplicate Funding

External reference/idempotency protects duplicate entry.

---

# FLOW K — VENDOR REPAYMENT

# 120. Goal

Record money paid back to vendor against existing payable.

---

# 121. Flow

```text
Create Settlement
↓
Enter Payment Amount
↓
Preview
↓
Approval if required
↓
Final Post
↓
Lock Vendor State
↓
Read Current Payable
↓
Calculate Valid Repayment
↓
Allocate Against Funding Batches
↓
Post Ledger
↓
Update Payable
↓
Audit + Outbox
↓
COMMIT
```

---

# 122. Example

Vendor Payable:

```text
₹1,00,000
```

Pay:

```text
₹40,000
```

Result:

```text
Payable ₹60,000
```

---

# 123. Second Repayment

Pay:

```text
₹60,000
```

Result:

```text
Payable ₹0
```

---

# 124. Batch Settlement

Default:

```text
FIFO
```

Oldest open funding batches settle first.

---

# 125. Manual Batch Selection

Can be allowed only with:

```text
Permission

Reason

Audit
```

---

# 126. Pending Settlement

Pending approval settlement does not reduce posted payable.

---

# 127. Atomicity

Must lock:

```text
Vendor financial state

Relevant batches
```

before calculation.

---

# 128. Concurrent Settlement

Two simultaneous ₹60,000 requests against ₹1,00,000 payable:

first posts.

Second recalculates against new payable.

No negative payable.

---

# 129. Settlement Idempotency

Critical.

Retry same request returns existing result.

---

# FLOW L — VENDOR OVERPAYMENT

# 130. Goal

Handle accidental payment beyond vendor payable without making payable negative.

---

# 131. Core Rule

```text
Vendor Payable >= 0
```

always.

---

# 132. Example

Current payable:

```text
₹0
```

Company accidentally sends:

```text
₹10,000
```

Correct result:

```text
Vendor Payable ₹0

Vendor Receivable ₹10,000
```

---

# 133. Overpayment Flow

```text
Settlement Payment
↓
Lock Vendor State
↓
Current Payable
↓
paymentAmount > payable?
├── NO
│   → normal repayment
└── YES
    ↓
Valid Repayment = Payable
Excess = Payment - Payable
↓
Payable becomes 0
↓
Create Vendor Receivable for Excess
↓
Ledger
↓
Audit
↓
COMMIT
```

---

# 134. Never Negative Payable

Bad:

```text
Vendor Payable = -₹10,000
```

Correct:

```text
Payable ₹0

Receivable ₹10,000
```

---

# 135. New Funding After Overpayment

Suppose:

```text
Vendor Receivable ₹10,000
```

Then vendor provides new funding:

```text
₹2,00,000
```

Gross new funding remains:

```text
₹2,00,000
```

---

# 136. No Silent Netting

Do not silently record:

```text
New Funding ₹1,90,000
```

because ₹10,000 receivable existed.

---

# 137. Explicit Offset

If approved:

```text
Gross New Funding ₹2,00,000

Offset Receivable ₹10,000

Net Open Payable ₹1,90,000

Receivable ₹0
```

---

# 138. Offset Flow

```text
Existing Vendor Receivable
+
New Vendor Funding
↓
Request Offset
↓
Approval
↓
Post Explicit Offset Transaction
↓
Reduce Receivable
↓
Reduce Payable
↓
Preserve Gross Funding History
```

---

# FLOW M — CLIENT REFUND

# 139. Goal

Return client-owned unconsumed funds safely.

---

# 140. Refund Eligibility

Refund amount must come from:

```text
Available Client-Owned Funds
```

or valid recoverable funds.

Not from:

```text
Other Client

Vendor Payable

Locked Unrecovered Amount

Unknown Amount
```

---

# 141. Refund Flow

```text
Client Requests Refund
↓
Calculate Refundable Amount
↓
Create Refund Request
↓
Reserve Funds
↓
Approval if required
↓
External Payment
↓
Confirm External Reference
↓
Post Ledger
↓
Finalize Allocation as REFUNDED
↓
Audit
↓
Reconcile
```

---

# 142. Refund Reservation

Before payment:

```text
AVAILABLE
→
REFUND_PENDING / RESERVED
```

This prevents same money being reallocated.

---

# 143. Reservation Is Not Payment

Pending refund should not be shown as:

```text
Refunded
```

until confirmed.

---

# 144. External Payment Failure

If payment fails:

```text
Refund remains failed/pending
```

and reservation can be released according to controlled workflow.

---

# 145. Successful Refund

After external confirmation:

```text
Reserved
→
REFUNDED
```

Ledger posts actual money movement.

---

# 146. Refund Idempotency

Same payment/reference cannot create duplicate refund.

---

# 147. Refund Exceeding Available

Block.

Example:

```text
Available ₹5,000

Request ₹7,000
```

Result:

```text
INSUFFICIENT_AVAILABLE_FUNDS
```

---

# FLOW N — FINANCIAL ADJUSTMENT

# 148. Goal

Correct exceptional financial records without editing history.

---

# 149. Adjustment Types

Possible:

```text
REVERSAL

MANUAL_ADJUSTMENT

OWNERSHIP_CORRECTION

OPENING_BALANCE_ADJUSTMENT

WRITE_OFF
```

---

# 150. Normal Mistake

Prefer:

```text
Reversal
+
Correct transaction
```

over manual adjustment.

---

# 151. Manual Adjustment

Should be rare.

Requires:

```text
Dedicated permission

Reason

Evidence

Approval

Audit
```

---

# 152. Adjustment Must Balance

Any ledger adjustment:

```text
Debits = Credits
```

---

# 153. Ownership Correction

If funds were assigned to wrong owner:

never directly update original allocation history.

Create explicit:

```text
Ownership Transfer / Correction Event
```

---

# 154. Opening Balance

When migrating/importing existing state:

use explicit:

```text
OPENING_BALANCE
```

transaction/fund lot.

---

# 155. Opening Balance Verification

Status:

```text
UNVERIFIED

VERIFIED
```

until supporting evidence checked.

---

# 156. Unknown Opening Owner

Use:

```text
UNATTRIBUTED
```

not arbitrary agency/client ownership.

---

# 157. Write-Off

Used only when amount is confirmed unrecoverable under business/accounting approval.

---

# 158. Write-Off Flow

```text
Identify Amount
↓
Confirm Recovery Exhausted
↓
Create Write-Off Request
↓
Attach Evidence
↓
Approval
↓
MFA / High-Risk Check
↓
Ledger Adjustment
↓
Allocation → WRITTEN_OFF
↓
Audit
↓
Reconciliation
```

---

# FLOW O — CLIENT RECEIVABLE / AGENCY TEMP FUNDING

# 159. Goal

Handle situation where agency temporarily funds client campaign beyond client payment.

---

# 160. Example

Job Budget:

```text
₹15,000
```

Client Paid:

```text
₹10,000
```

Agency explicitly funds:

```text
₹5,000
```

---

# 161. Correct State

Job funding:

```text
Client-Owned ₹10,000

Agency-Owned ₹5,000
```

Client Receivable:

```text
₹5,000
```

if business agreement says client owes agency.

---

# 162. Never Fake Wallet

Do not show:

```text
Client Wallet ₹15,000
```

when only ₹10,000 is client money.

---

# 163. Agency Funding Flow

```text
Create Agency Funding Event
↓
Create Agency-Owned Fund Lot
↓
Allocate to Client Job
↓
Create Client Receivable if applicable
↓
Ledger
↓
Audit
```

---

# 164. Client Later Pays Receivable

```text
Client Payment
↓
Apply Against Receivable
↓
Reduce Client Receivable
↓
Agency liquidity/accounting updated
```

Exact ledger treatment defined by accounting model.

---

# FLOW P — UNATTRIBUTED SPEND

# 165. Trigger

Meta reports:

```text
₹8,000 Spend
```

but only:

```text
₹7,500
```

can be attributed.

Difference:

```text
₹500
```

---

# 166. Flow

```text
Spend Sync
↓
Spend Fact
↓
Attribution Attempt
↓
₹500 Unattributed
↓
Create Reconciliation Case
↓
Investigate Mapping
↓
Correct Mapping if found
↓
Re-run Attribution
↓
Resolve Case
```

---

# 167. Never Guess

Do not assign ₹500 to:

```text
largest client

agency

last client
```

automatically.

---

# FLOW Q — UNIDENTIFIED RECEIPT

# 168. Goal

Handle money received but payer/client initially unknown.

---

# 169. Flow

```text
Money Observed
↓
Post To Clearing / Unidentified Receipt
↓
Investigate Reference
↓
Identify Client/Vendor
↓
Create Classification Transaction
↓
Move From Clearing
↓
Create Relevant Fund Lot / Liability
```

---

# 170. Do Not Guess Owner

Unidentified money stays:

```text
CLEARING
```

until identified.

---

# FLOW R — RECONCILIATION

# 171. Trigger

Can occur:

```text
After financial transaction

After Meta sync

Nightly

Manual

After recovery
```

---

# 172. Flow

```text
Load Expected Internal State
↓
Load Observed External/Internal State
↓
Compare
↓
Difference?
├── NO
│   → matched
└── YES
    ↓
Classify Reason
↓
Find/Create Reconciliation Case
↓
Assign Severity
↓
Investigate
↓
Correct Source Issue
↓
Re-run
↓
Resolve
```

---

# 173. Difference Formula

Recommended:

```text
difference = observed - expected
```

---

# 174. Difference Is Not Loss

Mismatch can be:

```text
Timing

Stale data

Mapping

Missing transaction

Meta revision

Pending refund

Unknown
```

---

# 175. Case Resolution

Cannot simply:

```text
status = RESOLVED
```

without valid resolution.

---

# 176. Valid Resolution

Examples:

```text
Mapping corrected

Missing transaction posted

Duplicate reversed

External confirmation received

Difference legitimately explained
```

---

# FLOW S — APPROVAL

# 177. Approval-Required Actions

Possible:

```text
Large Refund

Vendor Settlement

Cross-Client Transfer

Ownership Transfer

Manual Adjustment

Write-Off
```

---

# 178. Flow

```text
User Requests Action
↓
Create Approval Request
↓
Snapshot Material Values
↓
Approver Reviews
↓
Approve / Reject
↓
If Approved
  ↓
Execution Revalidates Current State
  ↓
Post
```

---

# 179. Approval Is Not Execution

Approved transaction still needs:

```text
current-state validation
```

before posting.

---

# 180. Maker-Checker

Requester and approver must differ where configured.

---

# 181. Material Change

Changing:

```text
Amount

Owner

Vendor

Client

Destination
```

invalidates previous approval.

---

# FLOW T — REVERSAL

# 182. Flow

```text
Select Posted Transaction
↓
Request Reversal
↓
Validate Reversible State
↓
Permission / Approval
↓
Create Reversal Transaction
↓
Create Opposite Ledger Entries
↓
Reverse Related Allocation Effect
↓
Link Original + Reversal
↓
Audit
↓
Reconcile
```

---

# 183. Original Record

Original remains:

```text
POSTED
```

with:

```text
reversed_by_transaction_id
```

or equivalent.

---

# 184. Reversal Cannot Delete History

Both original and reversal remain permanently visible.

---

# FLOW U — ARCHIVE / CLOSURE

# 185. Operational Archive

Can apply to:

```text
Client

Vendor

Ad Account

Job

Connection
```

---

# 186. Archive Does Not Delete Finance

Historical:

```text
Ledger

Payments

Funding

Allocations

Audit
```

remain.

---

# 187. Financial Closure

Financial closure requires no unresolved:

```text
Funds

Receivables

Payables

Refunds

Locked Amounts

Reconciliation Cases
```

according to entity-specific rules.

---

# 188. Operational Closure ≠ Financial Closure

This distinction must remain visible throughout system.

---

# FLOW V — SYSTEM FAILURE DURING FINANCIAL POST

# 189. Before Commit Failure

```text
ROLLBACK
```

No partial financial event.

---

# 190. After Commit / Response Lost

Frontend may not know result.

Flow:

```text
Network Failure
↓
Retry Same Idempotency Key
↓
Backend Finds Existing Result
↓
Return Existing Transaction
```

---

# 191. Never Blindly Submit New Key

When outcome is uncertain, first resolve existing idempotency state.

---

# FLOW W — REDIS / WORKER FAILURE

# 192. Redis Down

Financial transaction can still:

```text
COMMIT
+
write Outbox Event
```

---

# 193. Recovery

```text
Redis Returns
↓
Outbox Dispatcher Resumes
↓
Pending Events Queue
↓
Workers Continue
```

---

# 194. No Financial Truth In Redis

Loss of Redis must never change:

```text
Client Balance

Vendor Payable

Ledger
```

---

# FLOW X — META OUTAGE

# 195. Meta Unavailable

```text
Meta Sync Fails
↓
Last Known Data Preserved
↓
Freshness Ages
↓
STALE / UNKNOWN
↓
Alert
```

---

# 196. Do Not Zero Data

Never change:

```text
Spend → 0

Balance → 0

Status → ACTIVE
```

because API failed.

---

# 197. Finance Continues

Internal financial operations not requiring fresh Meta state can continue according to policy.

High-risk operation requiring fresh Meta verification may be blocked.

---

# FLOW Y — RECOVERY AFTER DATABASE RESTORE

# 198. Flow

```text
Restore DB
↓
Keep Financial Writes Disabled
↓
Verify Schema
↓
Verify Ledger
↓
Verify Allocations
↓
Verify Vendor Payables/Receivables
↓
Verify Client Funds
↓
Verify Storage Evidence
↓
Run Reconciliation
↓
Resync Recent Meta State
↓
Resume Outbox
↓
Resume Workers
↓
Enable Financial Writes
```

---

# 199. External Side Effects

After PITR/restore:

do not assume external:

```text
Bank payment

Refund

Email

Meta action
```

also rolled back.

Verify separately.

---

# 200. Golden Flow State Model

Money can transition through:

```text
AVAILABLE
↓
RESERVED
↓
ALLOCATED_AVAILABLE
↓
CONSUMED
```

or:

```text
ALLOCATED_AVAILABLE
↓
LOCKED
↓
AVAILABLE / REFUNDED / WRITTEN_OFF
```

or:

```text
AVAILABLE
↓
REFUND_PENDING
↓
REFUNDED
```

---

# 201. Terminal Allocation States

Examples:

```text
CONSUMED

REFUNDED

TRANSFERRED

WRITTEN_OFF
```

---

# 202. Current Active Buckets

Must remain mutually exclusive:

```text
AVAILABLE

RESERVED

ALLOCATED_AVAILABLE

LOCKED

REFUND_PENDING
```

---

# 203. Ownership Transfer

Ownership changes only through explicit event.

Never by changing owner column silently.

---

# 204. Source Lineage

Ownership transfer does not erase:

```text
Original Fund Source
```

---

# 205. Financial Flow Audit

Every important flow should preserve:

```text
Actor

Request ID

Business Record

Ledger Transaction

Allocation Event

Reason

Approval

Timestamp
```

---

# 206. Idempotency Matrix

Must use idempotency for:

```text
Client Payment

Vendor Funding

Vendor Settlement

Client Refund

Ownership Transfer

Manual Adjustment

Write-Off
```

---

# 207. Concurrency Matrix

Must lock canonical DB state for:

```text
Fund Allocation

Refund Reservation

Vendor Settlement

Ownership Transfer

Receivable Offset
```

---

# 208. No Generic Balance Editing

Forbidden:

```text
Edit Client Balance

Edit Vendor Payable

Edit Locked Amount

Edit Wallet
```

---

# 209. User Interfaces Trigger Flows

UI action examples:

```text
Add Payment

Allocate Funds

Request Refund

Post Vendor Settlement

Resolve Reconciliation
```

not:

```text
Change Balance
```

---

# 210. Flow Status Visibility

Every long-running workflow should expose:

```text
Current Status

Created By

Created At

Last Updated

Next Required Action
```

---

# 211. Failure Status Visibility

Never silently fail.

Example:

```text
Refund Payment Failed

Meta Sync Partial

Settlement Approval Rejected
```

must remain visible.

---

# 212. Unknown State

If system cannot determine state:

```text
UNKNOWN
```

is valid.

Never guess.

---

# 213. Flow Integrity Rules

System must enforce:

```text
1. Money can never disappear without an explicit terminal financial event.

2. Money ownership can never change silently.

3. Source lineage must remain preserved.

4. Budget creation must not create funds.

5. Client payment must not automatically equal job allocation.

6. Job allocation must not automatically equal spend.

7. Meta-reported balance must not become internal wallet balance.

8. Client funds must not fund another client without explicit approved ownership transfer.

9. Restricted account status must preserve fund ownership.

10. Locked funds must not be treated as lost.

11. Restored Meta status must not automatically unlock funds.

12. Vendor funding must create liability rather than revenue.

13. Vendor payable must never become negative.

14. Vendor overpayment must create Vendor Receivable.

15. Gross vendor funding history must survive offsets and settlements.

16. Vendor payable and receivable must remain separately visible.

17. Client wallet and Client Receivable must remain separately visible.

18. Spend without mapping must remain unattributed.

19. Overspend without valid funding must create Funding Gap.

20. Pending refund must reserve funds before payment.

21. Refund reservation must not be presented as paid refund.

22. Posted financial records must remain immutable.

23. Corrections must use reversals or explicit adjustment events.

24. Every critical financial flow must be atomic.

25. Every retryable financial command must be idempotent.

26. Database locking must protect race-sensitive money flows.

27. Queue retries must never duplicate financial effects.

28. Meta failures must preserve last-known facts and mark freshness.

29. API failure must never be interpreted as account restriction.

30. Operational closure must remain separate from financial closure.

31. Reconciliation mismatch must remain visible until genuinely resolved.

32. Alert dismissal must not resolve underlying financial mismatch.

33. Unknown data must never become zero automatically.

34. External payment uncertainty must be confirmed before replay.

35. Financial write-offs must require explicit controlled workflow.

36. Opening balances must remain identifiable as opening balances.

37. Unverified opening ownership must remain unattributed.

38. Audit and transaction lineage must allow every amount to be reconstructed.

39. A user interface must invoke business flows, never direct balance editing.

40. Every flow must preserve source, owner, purpose, location, status and history.
```

---

# 214. Flows Golden Rule

> **At every point in every workflow, the system must be able to explain where the money came from, who owns it, what it was intended for, where it currently sits, what state it is in and every event that moved it there. If any of those answers are unknown, the system must preserve that uncertainty explicitly rather than inventing a balance, owner, mapping or financial conclusion.**
