# Entity Model

## Overview

Ye document system ke conceptual data model ko define karta hai.

Iska purpose ye samajhna hai ki system me kaun-kaun se main entities hongi, har entity kya represent karegi, aur wo ek dusre se kaise related hongi.

Database tables ka exact structure next document me define hoga.

Core entity groups:

```text id="ent001"
ORGANIZATION & ACCESS

META ASSETS

CLIENT OPERATIONS

VENDORS

FINANCIAL LEDGER

FUND OWNERSHIP & ALLOCATION

RECONCILIATION

ALERTS & APPROVALS

AUDIT & ATTACHMENTS

SYNC & SYSTEM
```

---

# 1. Entity Design Principles

Entity model should follow:

```text id="ent002"
1. Every major real-world concept gets its own entity.

2. Stable IDs must be used for identity.

3. Display names must never be treated as unique identity.

4. Operational relationships and financial relationships must remain separate.

5. Historical mappings must be preserved.

6. Financial transactions must remain immutable after posting.

7. Derived balances should not become independent source-of-truth entities.

8. Unknown/unresolved states must be representable.

9. Multi-tenant isolation should be supported.

10. Every financial amount must be traceable to source records.
```

---

# 2. High-Level Entity Map

Conceptually:

```text id="ent003"
Organization
   │
   ├── Users / Roles / Permissions
   │
   ├── Meta Connections
   │      ↓
   │   Business Portfolios
   │      ↓
   │   Ad Accounts
   │      ↓
   │   Meta Campaigns
   │
   ├── Clients
   │      ↓
   │   Client Jobs
   │      ↓
   │   Campaign Mappings / Allocations
   │
   ├── Vendors
   │      ↓
   │   Vendor Funding Batches
   │      ↓
   │   Settlements / Receivables
   │
   └── Financial Ledger
          ↓
       Transactions
          ↓
       Ledger Entries
          ↓
       Fund Allocations / Lots
```

---

# 3. Organization

`Organization` system ka tenant/workspace entity hai.

Example:

```text id="ent004"
Metabull Universe
```

Even if V1 me single company ho, architecture me organization boundary rakhna recommended hai.

---

# 4. Organization Purpose

Organization owns:

```text id="ent005"
Users

Clients

Vendors

Meta Connections

Financial Ledger

Settings

Reports

Audit Records
```

---

# 5. Organization Identity

Primary:

```text id="ent006"
organization_id
```

Recommended:

```text id="ent007"
UUID
```

---

# 6. Organization Fields

Conceptual:

```text id="ent008"
Organization ID

Name

Slug

Default Currency

Timezone

Status

Created At
```

---

# 7. User

`User` represents internal system user.

Examples:

```text id="ent009"
Admin

Finance User

Ads Manager

Viewer
```

Authentication identity may live in Supabase Auth.

Application profile remains internal entity.

---

# 8. User Fields

Conceptual:

```text id="ent010"
User ID

Organization ID

Auth User ID

Name

Email

Status

Role

Created At

Last Login
```

---

# 9. Role

`Role` represents permission group.

Examples:

```text id="ent011"
ADMIN

FINANCE

ADS_MANAGER

VIEWER
```

---

# 10. Permission

`Permission` represents one allowed action.

Example:

```text id="ent012"
CREATE_VENDOR_SETTLEMENT
```

Role and permission should be many-to-many.

---

# 11. User Resource Scope

Represents:

> Kis user ko kis specific business resource tak access hai.

Example:

```text id="ent013"
Rahul
→ BP1
→ ADS_MANAGER
```

Possible scoped resources:

```text id="ent014"
Meta Connection

Business Portfolio

Ad Account

Client

Vendor

Team
```

---

# 12. Meta Connection

`MetaConnection` represents authenticated Meta access context.

Example:

```text id="ent015"
Ads Pro
```

It is not a Facebook password or personal profile storage entity.

---

# 13. Meta Connection Fields

Conceptual:

```text id="ent016"
Meta Connection ID

Organization ID

Internal Name

External Meta Context ID

Token Reference

Connection Status

Last Successful Sync

Created At
```

---

# 14. Business Portfolio

Represents Meta Business Portfolio / Business entity discovered through Meta.

Identity:

```text id="ent017"
meta_business_id
```

plus internal UUID.

---

# 15. Business Portfolio Relationship

Conceptually:

```text id="ent018"
Meta Connection
→
Business Portfolio
```

But a portfolio may later be visible through multiple contexts.

Therefore relationship should not rely only on one parent column if broader access history is needed.

---

# 16. Meta Asset Relationship

Recommended separate entity:

```text id="ent019"
MetaAssetRelationship
```

Purpose:

Track relationships such as:

```text id="ent020"
Connection → Business Portfolio

Business Portfolio → Ad Account

Owned

Shared

Client Access

Unknown
```

---

# 17. Meta Asset Relationship Fields

Conceptual:

```text id="ent021"
Relationship ID

Organization ID

Parent Entity Type

Parent Entity ID

Child Entity Type

Child Entity ID

Relationship Type

Effective From

Effective To

Is Current

Source
```

---

# 18. Ad Account

`AdAccount` represents one canonical Meta Ad Account.

Canonical external identity:

```text id="ent022"
meta_ad_account_id
```

Example:

```text id="ent023"
act_123456789
```

---

# 19. Ad Account Fields

Conceptual:

```text id="ent024"
Ad Account ID

Organization ID

Meta Ad Account ID

Name

Internal Alias

Currency

Timezone

Raw Status

Normalized Status

Can Run Ads

First Seen At

Last Seen At

Archived At
```

---

# 20. Ad Account Identity Rule

One Meta Ad Account ID:

```text id="ent025"
=
One canonical internal Ad Account entity
```

even if visible through multiple relationships.

---

# 21. Ad Account Status History

Separate entity:

```text id="ent026"
AdAccountStatusHistory
```

Purpose:

Preserve every meaningful status change.

---

# 22. Status History Fields

```text id="ent027"
Status History ID

Ad Account ID

Previous Status

New Status

Raw Meta Status

Source

Detected At

Effective At

Sync Run ID
```

---

# 23. Meta Campaign

`MetaCampaign` represents Meta campaign asset.

Canonical external identity:

```text id="ent028"
meta_campaign_id
```

---

# 24. Meta Campaign Fields

Conceptual:

```text id="ent029"
Campaign ID

Organization ID

Meta Campaign ID

Ad Account ID

Campaign Name

Raw Status

Effective Status

Created Time

Updated Time

Last Synced At
```

---

# 25. Spend Fact

Recommended separate analytical entity:

```text id="ent030"
SpendFact
```

Represents Meta-reported spend at a defined grain.

Example grain:

```text id="ent031"
Ad Account
+
Campaign
+
Date
+
Currency
```

---

# 26. Spend Fact Fields

Conceptual:

```text id="ent032"
Spend Fact ID

Organization ID

Ad Account ID

Meta Campaign ID

Spend Date

Amount

Currency

Source Sync Run ID

Fetched At
```

---

# 27. Client

`Client` represents business customer.

Identity:

```text id="ent033"
client_id
```

Example human ref:

```text id="ent034"
CLI-0001
```

---

# 28. Client Fields

Conceptual:

```text id="ent035"
Client ID

Organization ID

Client Reference

Name

Company Name

Phone

Email

Operational Status

Financial Status

Assigned Manager

Created At

Closed At
```

---

# 29. Client Job

`ClientJob` represents internal advertising work/order.

It is not the same as Meta Campaign.

---

# 30. Client Job Fields

Conceptual:

```text id="ent036"
Job ID

Organization ID

Client ID

Job Reference

Job Name

Objective

Planned Budget

Currency

Start Date

End Date

Operational Status

Financial Status

Assigned Manager
```

---

# 31. Client Job ↔ Meta Campaign Mapping

Separate entity:

```text id="ent037"
ClientJobCampaignMapping
```

Purpose:

Explicitly map business job to Meta campaign.

---

# 32. Campaign Mapping Fields

```text id="ent038"
Mapping ID

Client Job ID

Meta Campaign ID

Ad Account ID

Effective From

Effective To

Status

Mapped By
```

---

# 33. Job ↔ Ad Account Assignment

Separate entity:

```text id="ent039"
ClientJobAdAccountAssignment
```

This preserves account movement history.

---

# 34. Assignment Fields

```text id="ent040"
Assignment ID

Client Job ID

Ad Account ID

Effective From

Effective To

Status

Assigned By

Reason
```

---

# 35. Client Payment

`ClientPayment` represents external payment received from client.

This may be modeled as a specialized business record linked to a general ledger transaction.

---

# 36. Client Payment Fields

Conceptual:

```text id="ent041"
Client Payment ID

Organization ID

Client ID

Ledger Transaction ID

Amount

Currency

Purpose

Payment Date

Payment Method

Reference

Status

Proof Attachment
```

---

# 37. Client Wallet

Conceptually client wallet is a logical financial account.

Recommended implementation:

```text id="ent042"
Ledger Account
```

not an independently editable balance entity.

A client may have:

```text id="ent043"
Client Wallet Ledger Account
```

---

# 38. Client Receivable

`ClientReceivable` represents amount client owes company.

Examples:

```text id="ent044"
Agency-funded spend

Payment reversal after spend

Client credit
```

---

# 39. Client Receivable Fields

```text id="ent045"
Receivable ID

Client ID

Origin Transaction ID

Original Amount

Recovered Amount

Outstanding Amount

Currency

Reason

Status

Created At
```

---

# 40. Client Leftover

Recommended conceptual entity:

```text id="ent046"
ClientLeftover
```

Represents unresolved unused client-owned funds associated with completed/changed allocation.

---

# 41. Client Leftover Fields

```text id="ent047"
Leftover ID

Client ID

Client Job ID

Ad Account ID

Origin Allocation ID

Amount

Currency

Current Status

Current Location

Created At

Resolved At
```

---

# 42. Client Refund

`ClientRefund` represents refund workflow.

Linked to financial transaction after posting.

---

# 43. Client Refund Fields

```text id="ent048"
Refund ID

Client ID

Requested Amount

Approved Amount

Paid Amount

Currency

Status

Source Fund Reference

Ledger Transaction ID

Requested At

Completed At
```

---

# 44. Vendor

`Vendor` represents external funding/credit provider.

Example:

```text id="ent049"
RAM
```

---

# 45. Vendor Fields

Conceptual:

```text id="ent050"
Vendor ID

Organization ID

Vendor Reference

Name

Company Name

Phone

Email

Operational Status

Financial Status

Assigned Finance Owner

Created At

Closed At
```

---

# 46. Vendor Funding

`VendorFunding` represents actual funding receipt from vendor.

Linked to:

```text id="ent051"
Vendor

Funding Batch

Ledger Transaction
```

---

# 47. Vendor Funding Batch

`VendorFundingBatch` groups one logical vendor funding obligation.

Example:

```text id="ent052"
RAM-RF-001
```

---

# 48. Vendor Funding Batch Fields

```text id="ent053"
Funding Batch ID

Vendor ID

Batch Reference

Original Amount

Currency

Received Amount

Repaid Amount

Outstanding Amount

Status

Opened At

Settled At
```

Amounts may be derived/cached.

---

# 49. Vendor Settlement

`VendorSettlement` represents outbound repayment workflow.

---

# 50. Vendor Settlement Fields

Conceptual:

```text id="ent054"
Settlement ID

Vendor ID

Payment Amount

Currency

Payable Before

Valid Repayment

Excess Amount

Status

Payment Date

Reference

Ledger Transaction ID

Created By

Approved By
```

---

# 51. Vendor Settlement Batch Allocation

Separate entity:

```text id="ent055"
VendorSettlementBatchAllocation
```

Purpose:

Map settlement repayment amount to vendor funding batches.

---

# 52. Settlement Batch Allocation Fields

```text id="ent056"
Allocation ID

Settlement ID

Funding Batch ID

Applied Amount

Allocation Method

Created At
```

Allocation method:

```text id="ent057"
FIFO

MANUAL
```

---

# 53. Vendor Receivable

`VendorReceivable` represents recoverable amount due from vendor.

Typically created from overpayment.

---

# 54. Vendor Receivable Fields

```text id="ent058"
Receivable ID

Vendor ID

Origin Settlement ID

Origin Transaction ID

Original Amount

Recovered Amount

Outstanding Amount

Currency

Reason

Status

Created At
```

---

# 55. Vendor Recovery

`VendorRecovery` represents vendor paying back a receivable.

Linked to:

```text id="ent059"
Vendor Receivable

Ledger Transaction
```

---

# 56. Financial Ledger Account

`LedgerAccount` represents a logical financial account.

Examples:

```text id="ent060"
Company Bank

Client A Wallet

Agency Fund

RAM Payable

RAM Receivable

Client A Receivable

Locked Funds
```

---

# 57. Ledger Account Fields

Conceptual:

```text id="ent061"
Ledger Account ID

Organization ID

Account Code

Account Name

Account Type

Entity Type

Entity ID

Currency

Status

Created At
```

---

# 58. Ledger Account Type

Possible:

```text id="ent062"
ASSET

LIABILITY

EQUITY

INCOME

EXPENSE

CLEARING

MEMO / CONTROL
```

Exact accounting classification to be finalized in ledger document.

---

# 59. Ledger Transaction

`LedgerTransaction` represents one business financial event.

Example:

```text id="ent063"
CLIENT_PAYMENT
₹20,000
```

---

# 60. Ledger Transaction Fields

```text id="ent064"
Transaction ID

Organization ID

Transaction Reference

Transaction Type

Business Date

Currency

Status

Amount

Idempotency Key

External Reference

Created By

Approved By

Posted At

Reversed Transaction ID
```

---

# 61. Ledger Entry

`LedgerEntry` is debit/credit line of one ledger transaction.

---

# 62. Ledger Entry Fields

```text id="ent065"
Ledger Entry ID

Transaction ID

Ledger Account ID

Debit Amount

Credit Amount

Currency

Sequence

Description
```

---

# 63. Ledger Balance Rule

For every posted transaction:

```text id="ent066"
SUM(Debit)
=
SUM(Credit)
```

---

# 64. Fund Lot

Recommended entity:

```text id="ent067"
FundLot
```

Purpose:

Track origin/lineage of funds where business needs exact source tracking.

Example:

```text id="ent068"
Client A PAY-001
₹20,000
```

creates a fund lot.

---

# 65. Fund Lot Fields

Conceptual:

```text id="ent069"
Fund Lot ID

Organization ID

Source Type

Source Entity ID

Origin Transaction ID

Original Amount

Remaining Amount

Currency

Owner Type

Owner ID

Created At
```

Remaining amount may be derived/cached.

---

# 66. Fund Allocation

`FundAllocation` maps money to a purpose/location.

Examples:

```text id="ent070"
Client Wallet → JOB-001

JOB-001 → AD1

Agency Pool → Client Job
```

---

# 67. Fund Allocation Fields

```text id="ent071"
Allocation ID

Fund Lot ID or Source Account

Owner Type

Owner ID

Purpose Type

Purpose ID

Location Type

Location ID

Amount

Currency

Status

Effective From

Effective To

Created By
```

---

# 68. Allocation Status

Possible:

```text id="ent072"
ACTIVE

PARTIALLY_CONSUMED

CONSUMED

RETURNED

LOCKED

REVERSED
```

---

# 69. Fund Ownership Transfer

Recommended dedicated entity/workflow:

```text id="ent073"
OwnershipTransfer
```

Used for:

```text id="ent074"
Client A → Client B

Client → Agency
```

because ownership change is high risk.

---

# 70. Ownership Transfer Fields

```text id="ent075"
Transfer ID

Source Owner Type

Source Owner ID

Destination Owner Type

Destination Owner ID

Amount

Currency

Reason

Status

Approval Request ID

Ledger Transaction ID
```

---

# 71. Locked Fund

Recommended logical entity:

```text id="ent076"
LockedFund
```

Represents a specific amount made unavailable due to restriction/issue.

---

# 72. Locked Fund Fields

```text id="ent077"
Locked Fund ID

Owner Type

Owner ID

Ad Account ID

Client Job ID

Origin Allocation ID

Amount

Currency

Lock Reason

Status

Locked At

Recovered Amount

Resolved At
```

---

# 73. Recovery Case

`RecoveryCase` manages operational/financial recovery of locked funds.

---

# 74. Recovery Case Fields

```text id="ent078"
Recovery Case ID

Ad Account ID

Locked Fund ID

Status

Assigned User

Opened At

Expected Recovery

Recovered Amount

Resolution Type

Closed At
```

---

# 75. Meta Refund

Can be represented as:

```text id="ent079"
MetaRefund
```

or business record linked to ledger transaction.

Useful if refund matching workflow is complex.

---

# 76. Meta Refund Fields

Conceptual:

```text id="ent080"
Meta Refund ID

Ad Account ID

Amount

Currency

Detected Date

Reference

Matched Locked Fund

Ledger Transaction ID

Status
```

---

# 77. Reconciliation Case

`ReconciliationCase` represents unresolved mismatch between truths.

---

# 78. Reconciliation Case Fields

```text id="ent081"
Case ID

Organization ID

Case Type

Entity Type

Entity ID

Expected Amount

Observed Amount

Difference

Currency

Reason Category

Status

Severity

Assigned User

Opened At

Resolved At
```

---

# 79. Reconciliation Evidence

Optional separate entity:

```text id="ent082"
ReconciliationEvidence
```

Can link:

```text id="ent083"
Transactions

Spend Facts

Attachments

Notes

Snapshots
```

to a reconciliation case.

---

# 80. Alert

`Alert` represents persistent monitored issue signal.

---

# 81. Alert Fields

```text id="ent084"
Alert ID

Organization ID

Alert Type

Category

Severity

Entity Type

Entity ID

Amount Exposure

Currency

Status

Assigned User

Created At

Resolved At

Related Case ID
```

---

# 82. Approval Request

`ApprovalRequest` represents controlled approval workflow.

Examples:

```text id="ent085"
Vendor Settlement

Refund

Write-Off

Cross-Client Transfer

Manual Adjustment
```

---

# 83. Approval Request Fields

```text id="ent086"
Approval Request ID

Organization ID

Action Type

Entity Type

Entity ID

Amount

Currency

Requested By

Status

Required Approval Level

Created At

Resolved At
```

---

# 84. Approval Decision

Recommended separate entity:

```text id="ent087"
ApprovalDecision
```

Supports multi-level approval later.

---

# 85. Approval Decision Fields

```text id="ent088"
Decision ID

Approval Request ID

Approver User ID

Decision

Reason

Decided At
```

---

# 86. Attachment

`Attachment` stores metadata for uploaded evidence.

Binary content lives in storage.

---

# 87. Attachment Fields

```text id="ent089"
Attachment ID

Organization ID

Entity Type

Entity ID

Storage Path

File Name

Mime Type

Uploaded By

Uploaded At

Visibility Level
```

---

# 88. Note

`Note` represents human contextual note.

Can attach to:

```text id="ent090"
Client

Vendor

Ad Account

Recovery Case

Reconciliation Case
```

---

# 89. Note Fields

```text id="ent091"
Note ID

Entity Type

Entity ID

Content

Created By

Created At

Updated At
```

Financial notes do not alter financial state.

---

# 90. Audit Event

`AuditEvent` records who changed what.

---

# 91. Audit Event Fields

```text id="ent092"
Audit Event ID

Organization ID

Actor Type

Actor ID

Action

Entity Type

Entity ID

Before Data

After Data

Metadata

Occurred At
```

---

# 92. Actor Type

Possible:

```text id="ent093"
USER

SYSTEM

WORKER

INTEGRATION
```

---

# 93. Sync Run

`SyncRun` tracks one external synchronization operation.

---

# 94. Sync Run Fields

```text id="ent094"
Sync Run ID

Organization ID

Meta Connection ID

Sync Type

Status

Started At

Completed At

Records Processed

Error Count
```

---

# 95. Sync Error

Recommended separate entity:

```text id="ent095"
SyncError
```

Fields:

```text id="ent096"
Sync Error ID

Sync Run ID

Entity Type

External Entity ID

Error Code

Error Category

Message

Retryable

Created At
```

---

# 96. Background Job Record

BullMQ/Redis handles runtime jobs.

Optional durable DB entity:

```text id="ent097"
BackgroundJobExecution
```

for important job history.

---

# 97. Snapshot

Generic snapshot concept may be used for:

```text id="ent098"
Account Financial Snapshot

Vendor Position Snapshot

Client Position Snapshot
```

Snapshots are derived.

---

# 98. Financial Snapshot

Possible entity:

```text id="ent099"
FinancialSnapshot
```

Fields:

```text id="ent100"
Snapshot ID

Entity Type

Entity ID

Snapshot Date

Currency

Calculated Values

Generated At
```

---

# 99. Entity Relationship: Organization

Top-level:

```text id="ent101"
Organization
├── Users
├── Clients
├── Vendors
├── Meta Connections
├── Ledger Accounts
├── Transactions
├── Alerts
└── Audit Events
```

---

# 100. Entity Relationship: Meta

```text id="ent102"
Meta Connection
   ↓
Business Portfolio
   ↓
Ad Account
   ↓
Meta Campaign
   ↓
Spend Facts
```

with separate relationship history.

---

# 101. Entity Relationship: Client

```text id="ent103"
Client
   ↓
Client Job
   ├── Ad Account Assignment
   ├── Campaign Mapping
   ├── Fund Allocation
   ├── Spend Attribution
   └── Leftover
```

---

# 102. Entity Relationship: Vendor

```text id="ent104"
Vendor
   ↓
Funding Batch
   ↓
Vendor Funding
   ↓
Vendor Settlement
   ↓
Settlement Batch Allocation
```

Overpayment:

```text id="ent105"
Vendor Settlement
   ↓
Vendor Receivable
   ↓
Vendor Recovery
```

---

# 103. Entity Relationship: Financial

```text id="ent106"
Business Event
   ↓
Ledger Transaction
   ↓
Ledger Entries
   ↓
Ledger Accounts
```

---

# 104. Entity Relationship: Fund Lineage

```text id="ent107"
Source Transaction
   ↓
Fund Lot
   ↓
Fund Allocation
   ↓
Job / Ad Account / Other Location
   ↓
Spend / Return / Lock / Refund
```

---

# 105. Entity Relationship: Restriction

```text id="ent108"
Ad Account
   ↓
Status History
   ↓
Restriction Event
   ↓
Locked Fund
   ↓
Recovery Case
```

---

# 106. Entity Relationship: Reconciliation

```text id="ent109"
Meta Data
+
Ledger
+
Allocations
↓
Reconciliation Case
↓
Resolution / Adjustment
```

---

# 107. Entity Relationship: Approval

```text id="ent110"
Sensitive Business Action
↓
Approval Request
↓
Approval Decision
↓
Post Transaction / Apply Change
```

---

# 108. Entity Relationship: Audit

Almost every important entity action:

```text id="ent111"
Action
↓
Audit Event
```

---

# 109. Operational vs Financial Entities

Operational entities:

```text id="ent112"
Meta Connection

Portfolio

Ad Account

Campaign

Client Job

Assignment
```

Financial entities:

```text id="ent113"
Ledger Account

Transaction

Ledger Entry

Fund Lot

Allocation

Receivable

Refund

Settlement
```

Do not collapse these domains.

---

# 110. Canonical vs Derived Entities

Canonical:

```text id="ent114"
Client

Vendor

Ad Account

Transaction

Ledger Entry
```

Derived/summary:

```text id="ent115"
Current Balance

Financial Status

Dashboard Total

Aging Bucket
```

Derived values must be reproducible.

---

# 111. Current State vs History

For important changing concepts store:

```text id="ent116"
Current state on main entity
+
History entity
```

Example:

```text id="ent117"
AdAccount.normalized_status
```

and:

```text id="ent118"
AdAccountStatusHistory
```

---

# 112. Relationship History

Avoid overwriting:

```text id="ent119"
Current client/account mapping only
```

without preserving old relationship.

Use:

```text id="ent120"
effective_from

effective_to
```

---

# 113. Soft Deletion / Archival

Entities with business history should support:

```text id="ent121"
status

archived_at

closed_at
```

instead of physical deletion.

---

# 114. Hard Delete Candidates

Only low-risk unused records:

```text id="ent122"
Empty Draft

Duplicate Draft

Unused Temporary Record
```

with permission and audit.

---

# 115. Financial Entity Immutability

After posting:

```text id="ent123"
LedgerTransaction

LedgerEntry
```

should not be directly updated in financial-impacting fields.

---

# 116. Transaction Linking

Business-specific records should link to ledger transactions.

Example:

```text id="ent124"
ClientPayment
→ ledger_transaction_id
```

```text id="ent125"
VendorFunding
→ ledger_transaction_id
```

```text id="ent126"
ClientRefund
→ ledger_transaction_id
```

---

# 117. Why Business Record + Ledger Transaction Both?

Because:

```text id="ent127"
Business Record
=
Workflow + domain context
```

while:

```text id="ent128"
Ledger Transaction
=
Financial posting
```

Example vendor settlement needs:

```text id="ent129"
Approval

Proof

Payable Before

Batch Allocation

Payment Status
```

plus financial ledger posting.

---

# 118. Human References

Entities may have human-readable IDs:

```text id="ent130"
CLI-0001

VEN-0001

JOB-0001

TXN-000001

SET-0001

REC-0001
```

But internal relational keys should remain UUIDs.

---

# 119. External References

Examples:

```text id="ent131"
Meta Ad Account ID

Meta Campaign ID

UTR

Bank Reference

External Payment ID
```

These should not replace internal UUIDs.

---

# 120. Currency Rule

All financial entities containing amounts must also know currency.

Never infer currency globally when entity may be multi-currency.

---

# 121. Amount Rule

Recommended storage:

```text id="ent132"
BIGINT minor units
```

Example:

```text id="ent133"
₹1,000.50
=
100050
```

---

# 122. Timestamp Rule

Store:

```text id="ent134"
created_at

updated_at
```

for mutable business entities.

Financial entities also may need:

```text id="ent135"
business_date

posted_at

effective_at
```

---

# 123. Actor Fields

Sensitive entities should store:

```text id="ent136"
created_by

approved_by

posted_by
```

where applicable.

---

# 124. Status Enums

Statuses should be domain-specific.

Avoid one universal:

```text id="ent137"
status
```

enum for everything.

Examples:

```text id="ent138"
Client Operational Status

Transaction Status

Refund Status

Settlement Status

Reconciliation Status
```

---

# 125. Unknown State Support

Entities should support:

```text id="ent139"
UNKNOWN

UNATTRIBUTED

UNRESOLVED

PENDING_REVIEW
```

where business meaning requires.

---

# 126. Duplicate Prevention

Unique constraints conceptually needed for:

```text id="ent140"
organization_id + meta_ad_account_id

organization_id + meta_business_id

organization_id + meta_campaign_id

idempotency_key

selected external payment references
```

---

# 127. Meta Relationship Duplication

Same Ad Account may have multiple relationship rows.

This is valid.

But canonical `AdAccount` stays one.

---

# 128. Client-to-Ad Account Direct Relationship

Avoid storing only:

```text id="ent141"
ad_account.client_id
```

because one account may serve multiple clients.

Use assignment/mapping entities.

---

# 129. Vendor Balance Field

Avoid relying on:

```text id="ent142"
vendor.balance
```

as source of truth.

Use ledger-derived payable/receivable.

---

# 130. Client Wallet Field

Avoid relying on:

```text id="ent143"
client.wallet_balance
```

as editable source.

Can store cached value only if reconstructable.

---

# 131. Ad Account Financial Balance Field

Same:

```text id="ent144"
ad_account.balance
```

must not become manually managed financial truth.

Use allocations + ledger + external reconciliation.

---

# 132. Receivable Separation

Need separate concepts:

```text id="ent145"
Client Receivable

Vendor Receivable
```

Even if both use common underlying receivable architecture.

Domain meaning differs.

---

# 133. Payable Separation

Vendor Payable is core.

Future may add:

```text id="ent146"
Other Supplier Payable

Employee Payable
```

but V1 vendor-focused.

---

# 134. Approval Polymorphism

ApprovalRequest may reference different entity types:

```text id="ent147"
Vendor Settlement

Refund

Transfer

Write-Off

Adjustment
```

Use controlled entity-type pattern or explicit relation structure.

---

# 135. Attachment Polymorphism

Attachment may belong to:

```text id="ent148"
Payment

Settlement

Refund

Client

Vendor

Recovery Case
```

Need generic entity link or junction tables.

---

# 136. Note Polymorphism

Same approach for notes.

---

# 137. Audit Polymorphism

Audit event records:

```text id="ent149"
entity_type

entity_id
```

to cover many entity types.

---

# 138. Alert Polymorphism

Alert links to one primary subject entity and optionally related case.

---

# 139. Reconciliation Polymorphism

Reconciliation case may reference:

```text id="ent150"
Ad Account

Client

Vendor

Refund

Spend Attribution
```

---

# 140. Multi-Tenant Rule

All business entities must either directly contain:

```text id="ent151"
organization_id
```

or be transitively tenant-bound through a parent.

For security, direct organization ID on critical tables is often preferable.

---

# 141. RLS-Friendly Model

Entities should support simple row ownership rules.

Example:

```text id="ent152"
record.organization_id
=
current_user.organization_id
```

before finer permission logic.

---

# 142. Entity Lifecycle Rule

Every major entity should define:

```text id="ent153"
Create

Active Use

Update

Close / Archive

Restore where allowed
```

Financial records additionally:

```text id="ent154"
Draft

Approve

Post

Reverse
```

---

# 143. Core Entity Inventory

Recommended V1 core entities:

```text id="ent155"
Organization
User
Role
Permission
RolePermission
UserResourceScope

MetaConnection
BusinessPortfolio
AdAccount
MetaAssetRelationship
AdAccountStatusHistory
MetaCampaign
SpendFact
SyncRun
SyncError

Client
ClientJob
ClientPayment
ClientJobAdAccountAssignment
ClientJobCampaignMapping
ClientLeftover
ClientRefund
ClientReceivable

Vendor
VendorFunding
VendorFundingBatch
VendorSettlement
VendorSettlementBatchAllocation
VendorReceivable
VendorRecovery

LedgerAccount
LedgerTransaction
LedgerEntry
FundLot
FundAllocation
OwnershipTransfer
LockedFund
RecoveryCase
MetaRefund

ReconciliationCase
Alert
ApprovalRequest
ApprovalDecision

Attachment
Note
AuditEvent
```

---

# 144. Optional / Derived V1 Entities

Depending on implementation:

```text id="ent156"
FinancialSnapshot

SpendAttribution

AccountFinancialSnapshot

ClientFinancialSnapshot

VendorFinancialSnapshot

BackgroundJobExecution
```

---

# 145. Entity Model Golden Questions

For every new entity ask:

```text id="ent157"
What real-world concept does this represent?

What is its stable identity?

Who owns it?

What organization does it belong to?

What is its lifecycle?

Can it change?

Should changes have history?

Does it affect money?

Does it need approval?

Does it need audit?

Can it be archived?

Can it ever be deleted?
```

---

# 146. Entity Model Integrity Rules

System must enforce conceptually:

```text id="ent158"
1. One real Meta Ad Account maps to one canonical AdAccount entity.

2. Client assignment must use relationship entities, not direct ownership fields on Ad Account.

3. Meta asset hierarchy and financial ownership must remain separate.

4. Client Job and Meta Campaign must remain separate entities.

5. Every posted financial business event must link to ledger transaction(s).

6. Ledger transaction and ledger entries must remain immutable after posting.

7. Vendor funding batches must remain individually traceable.

8. Vendor overpayment must create receivable rather than negative payable.

9. Client leftover must preserve original ownership until explicitly resolved.

10. Locked fund must retain owner and source context.

11. Relationship history must not be overwritten.

12. Derived balances must remain reproducible.

13. Alerts, approvals and reconciliation cases must link back to actual entities.

14. Important user/system changes must produce audit records.

15. Every tenant-owned entity must remain organization-scoped.
```

---

# 147. Entity Model Golden Rule

> **The entity model must mirror the real business without collapsing different concepts into one record. Meta assets describe where advertising happens, clients and jobs describe why it happens, vendors describe external funding obligations, and the ledger describes how money moves. Relationships connect these entities while preserving identity, ownership, history and auditability.**
