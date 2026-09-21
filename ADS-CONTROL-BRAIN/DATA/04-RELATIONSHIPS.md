# Relationships

## Overview

Ye document system ke core entity relationships define karta hai.

Database me sirf tables banana enough nahi hai. Correct relationships decide karenge ki:

```text
Ek Meta Ad Account kis Portfolio ke through accessible hai?

Ek Client Job kin Ad Accounts par run hua?

Ek Meta Campaign kis Client Job se belong karta hai?

Ek Client Payment kis fund allocation me use hua?

Vendor funding kis settlement se repay hui?

Locked fund kis original allocation ka part tha?

Ek financial transaction kis business event se linked hai?
```

Core principle:

> **Relationships must preserve business meaning and history. Current state dikhane ke liye historical relationships overwrite nahi kiye jayenge.**

---

# 1. Relationship Types

System me primarily ye relationship patterns use honge:

```text
ONE-TO-ONE

ONE-TO-MANY

MANY-TO-MANY

TEMPORAL RELATIONSHIP

FINANCIAL LINEAGE RELATIONSHIP

POLYMORPHIC SUPPORT RELATIONSHIP
```

---

# 2. One-to-One

Example:

```text
Client Payment
→
Posted Ledger Transaction
```

Ek posted Client Payment usually ek financial transaction se linked hoga.

However schema ko future corrections/reversals ke liye flexible rakhna chahiye.

---

# 3. One-to-Many

Example:

```text
Client
→
Many Client Jobs
```

or:

```text
Vendor
→
Many Funding Batches
```

---

# 4. Many-to-Many

Example:

```text
Client Job
↔
Meta Campaign
```

Ek job multiple campaigns use kar sakta hai.

A campaign mapping historically different jobs se change bhi ho sakti hai.

Therefore junction entity required hai.

---

# 5. Temporal Relationship

Temporal relationship ke paas:

```text
effective_from

effective_to
```

fields hote hain.

Example:

```text
JOB-001
→ AD1
1 Sep – 10 Sep

JOB-001
→ AD2
10 Sep onwards
```

Old relationship delete nahi hogi.

---

# 6. Organization → User

Relationship:

```text
Organization
1
↓
N
Users
```

One organization can have many users.

Every user application profile belongs to one organization in initial model.

---

# 7. Organization → Client

```text
Organization
1
↓
N
Clients
```

Every client belongs to exactly one organization/tenant.

---

# 8. Organization → Vendor

```text
Organization
1
↓
N
Vendors
```

---

# 9. Organization → Meta Connection

```text
Organization
1
↓
N
Meta Connections
```

---

# 10. Organization → Ledger Account

```text
Organization
1
↓
N
Ledger Accounts
```

Financial accounts never cross tenant boundaries.

---

# 11. Organization → Ledger Transaction

```text
Organization
1
↓
N
Ledger Transactions
```

---

# 12. User ↔ Role

Recommended:

```text
User
N
↕
N
Role
```

via:

```text
user_roles
```

Even if initially each user has one role, many-to-many design allows future expansion.

---

# 13. Role ↔ Permission

```text
Role
N
↕
N
Permission
```

through:

```text
role_permissions
```

---

# 14. User → Resource Scope

```text
User
1
↓
N
Resource Scopes
```

Example:

```text
Rahul
→ BP1
→ BP2
```

---

# 15. Meta Connection ↔ Business Portfolio

At first glance:

```text
Meta Connection
1
↓
N
Business Portfolios
```

But actual access can be more complex.

A portfolio could potentially be visible through multiple connection contexts.

Recommended:

```text
Meta Connection
N
↕
N
Business Portfolio
```

through:

```text
meta_asset_relationships
```

---

# 16. Business Portfolio ↔ Ad Account

A simple implementation may assume:

```text
Business Portfolio
1
↓
N
Ad Accounts
```

But real access may include:

```text
Owned

Shared

Client Access

Moved

Historical Access
```

Therefore recommended:

```text
Business Portfolio
N
↕
N
Ad Account
```

through temporal relationship records.

---

# 17. Canonical Ad Account

Important rule:

Multiple relationship rows do not create multiple Ad Account records.

Example:

```text
BP1 → AD1

BP2 → AD1
```

still:

```text
AdAccount AD1
=
One canonical record
```

---

# 18. Meta Asset Relationship

Recommended relationship entity:

```text
meta_asset_relationships
```

Supports:

```text
Connection → Portfolio

Portfolio → Ad Account
```

with:

```text
relationship_type

effective_from

effective_to

is_current
```

---

# 19. Portfolio Relationship History

Example:

```text
1 Sep
BP1 → AD1

10 Sep
BP1 → AD1 ends

10 Sep
BP2 → AD1 starts
```

Historical financial reports can still determine old hierarchy.

---

# 20. Ad Account → Status History

```text
Ad Account
1
↓
N
Status History Records
```

Every meaningful status change creates a new history record.

---

# 21. Ad Account → Meta Campaign

```text
Ad Account
1
↓
N
Meta Campaigns
```

Every campaign belongs to one Meta Ad Account.

---

# 22. Meta Campaign → Spend Fact

Conceptually:

```text
Meta Campaign
1
↓
N
Spend Facts
```

Usually one record per:

```text
Campaign
+
Date
+
Grain
```

---

# 23. Ad Account → Account-Level Spend Fact

Some spend facts may be account-level without campaign dimension.

Therefore `SpendFact` can relate directly to:

```text
Ad Account
```

with campaign nullable or grain-specific.

---

# 24. Client → Client Job

```text
Client
1
↓
N
Client Jobs
```

A job belongs to one client.

---

# 25. Client Job ↔ Ad Account

This is a temporal many-to-many relationship.

```text
Client Job
N
↕
N
Ad Account
```

through:

```text
client_job_ad_account_assignments
```

---

# 26. Why Job ↔ Ad Account Is Many-to-Many

One job may run on:

```text
AD1
AD2
AD3
```

And one Ad Account may run jobs for:

```text
Client A

Client B

Client C
```

either simultaneously or over time.

---

# 27. Client Job ↔ Meta Campaign

Relationship:

```text
Client Job
N
↕
N
Meta Campaign
```

through:

```text
client_job_campaign_mappings
```

---

# 28. Campaign Mapping Rule

Prefer business rule:

> A Meta Campaign should only belong to one active Client Job at one point in time.

Historical reassignment can occur.

Example:

```text
1 Sep – 10 Sep
Campaign X → JOB-A

11 Sep onward
Campaign X → JOB-B
```

---

# 29. Campaign Mapping Conflict

Invalid overlapping case:

```text
Campaign X
→ Client A Job

AND

Campaign X
→ Client B Job
```

for same effective time unless explicitly designed for split attribution.

System should block or require manual split model.

---

# 30. Client → Client Payment

```text
Client
1
↓
N
Client Payments
```

---

# 31. Client Payment → Ledger Transaction

Usually:

```text
Client Payment
1
→
1 Ledger Transaction
```

after posting.

Before posting:

```text
ledger_transaction_id = NULL
```

may be allowed.

---

# 32. Client Payment → Fund Lot

Once posted, payment may create:

```text
1 or more Fund Lots
```

Example:

₹20,000 payment split:

```text
₹15,000 Ads Fund

₹5,000 Service Fee
```

could produce different financial classifications/lots.

---

# 33. Client → Wallet Ledger Account

Conceptually:

```text
Client
1
→
1 Wallet Ledger Account per Currency
```

Example:

```text
Client A
→ CLIENT_A_WALLET_INR
```

If future USD:

```text
Client A
→ CLIENT_A_WALLET_USD
```

---

# 34. Client → Client Receivable

```text
Client
1
↓
N
Client Receivables
```

A client may have multiple receivable cases.

---

# 35. Client Receivable → Settlement

```text
Client Receivable
1
↓
N
Client Receivable Settlements
```

Partial repayment supported.

---

# 36. Client Job → Leftover

```text
Client Job
1
↓
N
Client Leftover Records
```

Usually one leftover can be enough, but multiple records may exist across Ad Accounts or allocations.

---

# 37. Client Leftover → Origin Allocation

Each leftover should ideally reference:

```text
Fund Allocation
```

that created the unused amount.

This preserves lineage.

---

# 38. Client Leftover → Resolution Transaction

When resolved:

```text
Leftover
→ Ledger Transaction
```

Examples:

```text
Return to wallet

Refund

Ownership transfer
```

---

# 39. Client → Refund

```text
Client
1
↓
N
Client Refunds
```

---

# 40. Client Refund → Approval Request

If approval required:

```text
Client Refund
1
→
Approval Request
```

or approval request points to refund.

---

# 41. Client Refund → Ledger Transaction

After actual refund posting:

```text
Client Refund
→ Ledger Transaction
```

---

# 42. Vendor → Funding Batch

```text
Vendor
1
↓
N
Funding Batches
```

---

# 43. Funding Batch → Vendor Funding

A batch may be funded through one or multiple actual receipts.

Therefore:

```text
Vendor Funding Batch
1
↓
N
Vendor Fundings
```

---

# 44. Vendor Funding → Ledger Transaction

```text
Vendor Funding
1
→
1 Posted Ledger Transaction
```

for finalized funding receipt.

---

# 45. Vendor → Settlement

```text
Vendor
1
↓
N
Vendor Settlements
```

---

# 46. Vendor Settlement ↔ Funding Batch

Many-to-many.

One settlement can repay multiple funding batches.

One funding batch can be repaid through multiple settlements.

Therefore:

```text
Vendor Settlement
N
↕
N
Funding Batch
```

via:

```text
vendor_settlement_batch_allocations
```

---

# 47. Settlement Batch Allocation Example

Open:

```text
RF-001 = ₹30,000
RF-002 = ₹50,000
```

Settlement:

```text
SET-001 = ₹40,000
```

relations:

```text
SET-001 → RF-001 ₹30,000

SET-001 → RF-002 ₹10,000
```

---

# 48. Vendor Settlement → Ledger Transaction

One successfully posted settlement typically links to:

```text
1 Ledger Transaction
```

Potentially containing multiple debit/credit entries.

---

# 49. Vendor Settlement → Vendor Receivable

If overpayment occurs:

```text
Vendor Settlement
1
→
0 or 1 Vendor Receivable
```

in common case.

Example:

```text
Payable ₹20k
Payment ₹30k
```

creates:

```text
Receivable ₹10k
```

---

# 50. Vendor → Vendor Receivable

```text
Vendor
1
↓
N
Vendor Receivables
```

---

# 51. Vendor Receivable → Recovery

```text
Vendor Receivable
1
↓
N
Vendor Recoveries
```

Partial recovery allowed.

---

# 52. Vendor Recovery → Ledger Transaction

Each posted recovery:

```text
Vendor Recovery
→ Ledger Transaction
```

---

# 53. Vendor Receivable → Future Funding Offset

Offset relationship should be explicit.

Could be represented through:

```text
Ledger Transaction
+
Receivable reference
+
New Funding reference
```

Do not simply reduce new funding record.

---

# 54. Ledger Transaction → Ledger Entries

```text
Ledger Transaction
1
↓
2..N
Ledger Entries
```

At least two entries normally required for double-entry.

---

# 55. Ledger Entry → Ledger Account

```text
Ledger Account
1
↓
N
Ledger Entries
```

---

# 56. Ledger Transaction → Reversal

A posted transaction may have:

```text
0 or 1 active reversal transaction
```

Conceptual:

```text
Original Transaction
→ Reversal Transaction
```

---

# 57. Reversal Chain

Avoid repeated ambiguous reversal loops.

Example:

```text
TXN-001 Original

TXN-002 reverses TXN-001
```

If correction wrong again, create new explicit transaction rather than mutating chain.

---

# 58. Ledger Transaction → Business Record

Possible links:

```text
Client Payment

Vendor Funding

Vendor Settlement

Client Refund

Vendor Recovery

Ownership Transfer

Manual Adjustment
```

Business record explains context.

Ledger transaction explains financial effect.

---

# 59. Fund Lot → Origin Transaction

```text
Ledger Transaction
1
↓
N
Fund Lots
```

A transaction can create one or multiple source lots.

---

# 60. Fund Lot → Allocation

```text
Fund Lot
1
↓
N
Fund Allocations
```

---

# 61. Fund Allocation → Client Job

When purpose is client job:

```text
Fund Allocation
→ Client Job
```

---

# 62. Fund Allocation → Ad Account

When location is Ad Account:

```text
Fund Allocation
→ Ad Account
```

---

# 63. Fund Allocation → Client

Ownership can point to:

```text
Client
```

while location points to:

```text
Ad Account
```

Example:

```text
Owner:
Client A

Location:
AD1

Purpose:
JOB-001
```

---

# 64. Fund Allocation → Agency

Agency-owned fund may have:

```text
Owner Type:
AGENCY
```

with no client owner.

If used for Client A job:

```text
Owner:
Agency

Purpose:
Client A JOB-001
```

This distinction is critical.

---

# 65. Ownership Transfer → Source Owner

Example:

```text
Client A
```

---

# 66. Ownership Transfer → Destination Owner

Example:

```text
Client B
```

or:

```text
Agency
```

---

# 67. Ownership Transfer → Approval

High-risk ownership transfer:

```text
OwnershipTransfer
→ ApprovalRequest
```

---

# 68. Ownership Transfer → Ledger Transaction

After approval/posting:

```text
OwnershipTransfer
→ LedgerTransaction
```

---

# 69. Ad Account → Locked Fund

```text
Ad Account
1
↓
N
Locked Funds
```

There may be separate locked fund records for different owners.

Example:

```text
AD1
├── Client A ₹5,000
├── Client B ₹3,000
└── Agency ₹2,000
```

---

# 70. Locked Fund → Owner

Owner can be:

```text
Client

Agency

Unattributed
```

---

# 71. Locked Fund → Origin Allocation

Where known:

```text
Locked Fund
→ Fund Allocation
```

This preserves where locked money came from.

---

# 72. Locked Fund → Recovery Case

Potential:

```text
Locked Fund
1
→
1 Recovery Case
```

or recovery case may cover multiple locked-fund records on same account.

Recommended flexible model:

```text
Recovery Case
1
↓
N
Locked Fund Links
```

if account-level case management is preferred.

---

# 73. Ad Account → Recovery Case

```text
Ad Account
1
↓
N
Recovery Cases
```

One per restriction episode is useful.

---

# 74. Meta Refund → Ad Account

```text
Ad Account
1
↓
N
Meta Refunds
```

---

# 75. Meta Refund ↔ Locked Fund

A refund may recover:

```text
One Locked Fund
```

or be distributed across:

```text
Multiple Locked Funds
```

Future robust model may use:

```text
meta_refund_allocations
```

instead of one `matched_locked_fund_id`.

---

# 76. Recommended Meta Refund Allocation Entity

For precise handling:

```text
MetaRefundAllocation
```

Fields:

```text
Meta Refund ID

Locked Fund ID

Amount
```

Relationship:

```text
Meta Refund
N
↕
N
Locked Fund
```

Useful for partial/multi-owner refunds.

---

# 77. Spend Fact → Spend Attribution

```text
Spend Fact
1
↓
N
Spend Attributions
```

---

# 78. Spend Attribution → Client

May point to:

```text
Client
```

---

# 79. Spend Attribution → Client Job

Prefer where possible:

```text
Spend Attribution
→ Client Job
```

---

# 80. Spend Attribution → Fund Allocation

If financial lineage is known:

```text
Spend Attribution
→ Fund Allocation
```

---

# 81. Spend Attribution Total Rule

For each Spend Fact:

```text
SUM(Attributed Amount)
<=
Spend Fact Amount
```

Difference:

```text
Unattributed Spend
```

---

# 82. Spend Mapping from Campaign

Typical automatic relationship chain:

```text
Spend Fact
→ Meta Campaign
→ Active Client Job Campaign Mapping
→ Client Job
→ Client
```

This can derive attribution candidate.

---

# 83. Reconciliation Case → Primary Entity

A case has one primary subject:

```text
Ad Account

Client

Vendor

Refund

Spend Attribution
```

---

# 84. Reconciliation Case → Related Entities

One case may involve many supporting records:

```text
Ledger Transaction

Spend Fact

Fund Allocation

Refund

Attachment
```

Use:

```text
reconciliation_case_links
```

---

# 85. Alert → Entity

Each alert points to primary entity.

Example:

```text
AD_ACCOUNT_RESTRICTED
→ AD1
```

---

# 86. Alert → Reconciliation Case

Optional:

```text
Alert
→ Reconciliation Case
```

Example:

```text
RECONCILIATION_MISMATCH alert
→ REC-001
```

---

# 87. Alert → Recovery Case

Example:

```text
LOCKED_FUND alert
→ RC-001
```

---

# 88. Alert Relationship Is Not Ownership

Alert is monitoring object only.

Deleting/resolving alert must not modify linked financial entity unless explicit business action occurs.

---

# 89. Approval Request → Business Entity

Approval request points to:

```text
Vendor Settlement

Refund

Ownership Transfer

Adjustment

Write-Off
```

---

# 90. Approval Request → Approval Decisions

```text
Approval Request
1
↓
N
Approval Decisions
```

Supports future multi-level approval.

---

# 91. Approval Request → Requester

```text
User
1
↓
N
Approval Requests
```

via `requested_by`.

---

# 92. Approval Decision → Approver

```text
User
1
↓
N
Approval Decisions
```

---

# 93. Maker-Checker Relationship

For configured actions:

```text
ApprovalRequest.requested_by
!=
ApprovalDecision.approver_user_id
```

---

# 94. Attachment → Entity

Generic support relationship:

```text
Attachment
→ Client Payment
```

or:

```text
Attachment
→ Vendor Settlement
```

or:

```text
Attachment
→ Reconciliation Case
```

This is polymorphic.

---

# 95. Note → Entity

Same:

```text
Note
→ Client

Note
→ Vendor

Note
→ Ad Account

Note
→ Reconciliation Case
```

---

# 96. Audit Event → Entity

Generic:

```text
Audit Event
→ Any Important Entity
```

---

# 97. Audit Event → Actor

Actor may be:

```text
User

System

Worker

Integration
```

---

# 98. Sync Run → Meta Connection

```text
Meta Connection
1
↓
N
Sync Runs
```

---

# 99. Sync Run → Sync Error

```text
Sync Run
1
↓
N
Sync Errors
```

---

# 100. Sync Run → Imported Data

Meta-imported records may reference:

```text
last_sync_run_id
```

or source sync ID.

Useful for lineage.

---

# 101. Current Relationship vs Historical Relationship

Do not design:

```text
ad_account.business_portfolio_id
```

as the only relationship if movement/history matters.

Better:

```text
Current convenience field
+
Historical relationship table
```

if performance requires.

---

# 102. Relationship Current Flag

Temporal relationship may include:

```text
is_current = true
```

for fast current-state queries.

But truth remains:

```text
effective_from / effective_to
```

---

# 103. Relationship End Rule

When replacing mapping:

Do not:

```text
UPDATE old parent_id
```

Instead:

```text
Old Relationship
effective_to = now

New Relationship
effective_from = now
```

---

# 104. Financial Relationships Must Be Explicit

Never infer financial owner solely because:

```text
Client Job uses AD1
```

AD1 may contain:

```text
Client A fund

Client B fund

Agency fund
```

Use allocations.

---

# 105. Meta Access Does Not Equal Fund Ownership

Example:

```text
BP1 owns/accesses AD1
```

does not mean:

```text
BP1 owns all money in AD1
```

Financial ownership model remains separate.

---

# 106. Client Usage Does Not Equal Account Ownership

Client A using AD1 does not mean:

```text
AD1 belongs to Client A
```

This distinction must remain throughout schema/UI.

---

# 107. Vendor Funding Does Not Equal Client Ownership

Example:

```text
RAM provided ₹1 lakh
```

That defines:

```text
Funding Source + Vendor Liability
```

not necessarily current fund business owner.

Funds may later represent:

```text
Agency-controlled operational funding
```

or other approved classification depending on business flow.

---

# 108. Source → Owner → Purpose → Location

These four relationships must not be collapsed.

Example:

```text
Source:
RAM Funding Batch RF-001

Owner:
Agency

Purpose:
Client A Job

Location:
AD1
```

Each answers different question.

---

# 109. Relationship Validity Rule

Before creating financial/operational relationship validate:

```text
Same organization?

Entity active enough for action?

Currency compatible?

Relationship period valid?

No forbidden overlap?

User authorized?
```

---

# 110. Same-Organization Constraint

Invalid:

```text
Organization A Client
→ Organization B Ad Account
```

Every critical cross-entity relation must be tenant-consistent.

---

# 111. Currency Relationship Rule

A fund allocation:

```text
INR source
→ USD account
```

should be blocked unless explicit FX workflow exists.

---

# 112. Client Job Currency

Recommended job currency should generally match funding/allocation currency.

If multiple currencies needed later, use explicit conversion model.

---

# 113. Ad Account Currency

Meta Ad Account currency is external operational currency.

Fund allocation to account should validate compatibility.

---

# 114. Relationship Deactivation

Many relationship entities use:

```text
status

effective_to
```

instead of deletion.

---

# 115. Relationship Audit

Important mapping changes should create audit events.

Examples:

```text
Client Job moved AD1 → AD2

Campaign remapped

Portfolio relationship changed

Fund owner changed
```

---

# 116. Relationship Duplication Protection

Prevent duplicate active rows such as:

```text
JOB-001 → AD1
```

twice with same active period.

Use uniqueness/application validation.

---

# 117. Overlapping Assignment Rule

Multiple Ad Accounts for same job:

```text
Allowed
```

Multiple jobs on same Ad Account:

```text
Allowed
```

provided spend attribution is supported.

---

# 118. Overlapping Campaign Mapping Rule

Recommended default:

```text
One Campaign
→ One Client Job
at a given time
```

unless explicit split attribution exists.

---

# 119. Allocation Relationship Rule

One fund lot can be split into many allocations.

Example:

```text
PAY-001 ₹10,000

→ JOB-001 ₹4,000
→ JOB-002 ₹3,000
→ Wallet Remaining ₹3,000
```

---

# 120. Allocation Consumption

Allocations may be partially consumed.

Example:

```text
Allocation:
₹10,000

Spend:
₹7,000

Remaining:
₹3,000
```

Consumption records/derived state must preserve original allocation.

---

# 121. Leftover Relationship

A leftover should reference:

```text
Original Allocation

Client

Job

Location
```

whenever known.

---

# 122. Locked Fund Relationship

Locked fund should reference:

```text
Owner

Ad Account

Original Allocation

Job
```

where known.

---

# 123. Refund Relationship

Refund should point back to source balance.

Example:

```text
Client Refund
→ Client Wallet
```

or:

```text
Client Refund
→ Recovered Locked Fund
```

This prevents refunding money twice.

---

# 124. Receivable Origin Relationship

Every receivable should ideally identify origin.

Vendor example:

```text
Receivable
→ Overpaid Settlement
```

Client example:

```text
Receivable
→ Agency-funded spend
```

---

# 125. Write-Off Relationship

Write-off should reference:

```text
Original Receivable / Locked Fund
+
Approval Request
+
Ledger Transaction
```

---

# 126. Reversal Relationship

Reversal should reference original transaction directly.

Reports should display pair together.

---

# 127. Duplicate Business Event Protection

Same business event should not create multiple ledger postings.

Use:

```text
Business Record ID
+
Idempotency Key
+
Transaction Link
```

---

# 128. Reporting Relationship Rule

Reports must decide whether to use:

```text
Current hierarchy
```

or:

```text
Hierarchy as of transaction/spend date
```

depending on report purpose.

---

# 129. Current Hierarchy Reporting

Example:

"Show all accounts currently under BP2"

Use:

```text
current relationships
```

---

# 130. Historical Hierarchy Reporting

Example:

"Which portfolio was AD1 under when spend happened on 5 Sep?"

Use:

```text
effective date relationship history
```

---

# 131. Current Client Assignment Reporting

For operational dashboard:

Use current active job-account assignments.

---

# 132. Historical Client Attribution

For past spend:

Use mapping effective at spend date.

Do not attribute historical spend using today's client mapping.

---

# 133. Relationship Snapshot Risk

Avoid storing only current foreign key for historically important relationships.

Otherwise past reports become wrong after reassignment.

---

# 134. Foreign Key Strategy

Core financial and business relationships should use explicit foreign keys.

Examples:

```text
client_jobs.client_id

vendor_fundings.vendor_id

vendor_settlements.vendor_id

ledger_entries.ledger_account_id
```

---

# 135. Polymorphic Relationship Use

Polymorphic `entity_type + entity_id` is acceptable for:

```text
Audit

Notes

Attachments

Alerts

Reconciliation supporting links
```

because these are support/control entities.

---

# 136. Avoid Polymorphic Core Money Links

Do not use generic relationship only for:

```text
Vendor Settlement → Vendor

Client Payment → Client
```

Use explicit FKs.

---

# 137. Cascade Delete Rule

Core historical relationships should use:

```text
ON DELETE RESTRICT
```

or equivalent.

Do not cascade financial history.

---

# 138. Closing Entity Relationships

Closing Client/Vendor/Ad Account does not delete child history.

Example:

```text
Client CLOSED
```

still has:

```text
Payments

Jobs

Ledger Transactions

Refunds
```

---

# 139. Restore Relationship

If archived entity restored:

existing canonical relationships/history should be reused.

Do not duplicate entity.

---

# 140. Relationship Diagram — Meta Layer

```text
Organization
   │
   └── Meta Connections
          │
          └── Meta Asset Relationships
                ├── Business Portfolios
                │      │
                │      └── Ad Accounts
                │
                └────────── Ad Accounts
                               │
                               ├── Status History
                               ├── Meta Campaigns
                               │      └── Spend Facts
                               └── Recovery Cases
```

---

# 141. Relationship Diagram — Client Layer

```text
Client
  │
  ├── Client Payments
  │      └── Ledger Transaction
  │
  ├── Client Jobs
  │      ├── Ad Account Assignments
  │      ├── Campaign Mappings
  │      ├── Fund Allocations
  │      └── Leftovers
  │
  ├── Refunds
  │      └── Ledger Transaction
  │
  └── Receivables
         └── Settlements
```

---

# 142. Relationship Diagram — Vendor Layer

```text
Vendor
  │
  ├── Funding Batches
  │      └── Vendor Fundings
  │             └── Ledger Transaction
  │
  ├── Vendor Settlements
  │      ├── Funding Batch Allocations
  │      └── Ledger Transaction
  │
  └── Vendor Receivables
         └── Vendor Recoveries
                └── Ledger Transaction
```

---

# 143. Relationship Diagram — Fund Layer

```text
Ledger Transaction
       │
       ↓
    Fund Lot
       │
       ↓
 Fund Allocation
   ├── Owner
   ├── Purpose
   └── Location
       │
       ├── Spend
       ├── Leftover
       ├── Locked Fund
       ├── Transfer
       └── Refund
```

---

# 144. Relationship Diagram — Control Layer

```text
Business / Financial Entity
     │
     ├── Alerts
     │
     ├── Approval Requests
     │      └── Approval Decisions
     │
     ├── Reconciliation Cases
     │      └── Related Entity Links
     │
     ├── Attachments
     ├── Notes
     └── Audit Events
```

---

# 145. Relationship Validation Questions

Before creating any new relationship, system/design should ask:

```text
Are both entities in same organization?

Is this relationship current or historical?

Can more than one relationship exist simultaneously?

Does this relationship affect financial ownership?

Does it need an effective date?

Does it need approval?

Can it be safely deleted?

Should old versions remain visible?

Will reporting need historical reconstruction?
```

---

# 146. Core Relationship Rules

```text
1. Meta hierarchy relationships must remain separate from client relationships.

2. Client relationships must remain separate from financial ownership.

3. Financial ownership must remain separate from physical/logical fund location.

4. One canonical Meta asset may have multiple access relationships.

5. Client Job ↔ Ad Account is many-to-many and historical.

6. Client Job ↔ Meta Campaign must be explicitly mapped.

7. Historical mappings must use effective dates.

8. Vendor Settlement ↔ Funding Batch is many-to-many.

9. Ledger Transaction → Ledger Entries is one-to-many and immutable after posting.

10. Fund source lineage must remain traceable through allocations.

11. Locked funds must preserve ownership and origin relationships.

12. Receivables must preserve the transaction that created them.

13. Ownership transfers must never be represented as simple metadata changes.

14. Critical relationships must remain organization-scoped.

15. Reports must use the correct current or historical relationship depending on context.
```

---

# 147. Relationship Golden Rule

> **A relationship should never erase the relationship that existed before it. Meta access can change, clients can move between Ad Accounts, campaigns can be remapped, funds can change location, and money can change owner only through explicit approved events. The system must preserve every important relationship well enough to reconstruct what was true at any point in time.**
