# Data Sources

## Overview

System multiple data sources par depend karega.

Sabse important design rule:

> **Har data field ka source clearly known hona chahiye.**

System ko kabhi ye assume nahi karna chahiye ki:

```text id="ds001"
Meta ka data
=
Financial truth
```

ya:

```text id="ds002"
User-entered data
=
Automatically verified truth
```

Different data sources different type ki truth represent karte hain.

Core data layers:

```text id="ds003"
META DATA
+
INTERNAL BUSINESS DATA
+
FINANCIAL LEDGER DATA
+
USER INPUT
+
SYSTEM DERIVED DATA
+
ATTACHMENTS / EVIDENCE
```

---

# 1. Primary Data Source Categories

System ke major data sources:

```text id="ds004"
1. Meta Marketing API

2. Internal PostgreSQL Database

3. Internal Financial Ledger

4. Manual User Input

5. Uploaded Financial Proofs

6. System-Generated Events

7. Background Worker Results

8. Legacy / Migration Data

9. Future External Financial Integrations
```

---

# 2. Three Core Truths

System architecture me three primary truth layers hongi.

```text id="ds005"
META TRUTH
LEDGER TRUTH
BUSINESS TRUTH
```

---

# 3. Meta Truth

Meta Truth represents:

> Meta platform par currently ya historically kya operationally report ho raha hai.

Examples:

```text id="ds006"
Business Portfolios

Ad Accounts

Ad Account IDs

Account Status

Currency

Timezone

Campaigns

Campaign IDs

Spend

Meta Account Properties

Accessible Assets
```

Meta Truth financial ownership define nahi karta.

---

# 4. Ledger Truth

Ledger Truth represents:

> Internally recorded money movements.

Examples:

```text id="ds007"
Client Payment

Vendor Funding

Vendor Repayment

Client Refund

Agency Funding

Internal Transfer

Receivable

Adjustment

Reversal
```

Ledger determines internal financial position.

---

# 5. Business Truth

Business Truth represents:

> Money aur assets ka business meaning.

Examples:

```text id="ds008"
This fund belongs to Client A

This campaign belongs to Client B

This ₹10,000 is Vendor RAM funding

This ₹5,000 is agency temporary funding

This leftover must remain Client A-owned
```

Business Truth generally internal mappings aur approved workflows se aayega.

---

# 6. Reconciliation Layer

Reconciliation connects:

```text id="ds009"
Meta Truth
↕
Ledger Truth
↕
Business Truth
```

System differences ko hide nahi karega.

Mismatch create karega:

```text id="ds010"
RECONCILIATION_CASE
```

---

# 7. Meta Marketing API

Meta API external operational source hoga.

Main data domains:

```text id="ds011"
Connections

Business Assets

Ad Accounts

Campaigns

Account Status

Spend / Insights

Currency

Timezone

Selected Billing/Account Metadata
```

---

# 8. Meta Connection Data

Connection setup ke through system ko authenticated Meta access milega.

Internal record should store:

```text id="ds012"
Connection ID

Internal Name

Meta Context Identifier

Token Reference

Token Status

Permission State

Connected At

Last Sync
```

Secrets encrypted/secured honge.

---

# 9. Meta Business Portfolio Data

Meta se sync:

```text id="ds013"
Meta Business ID

Business Name

Accessible Assets

Relationship / Access Context where available
```

Canonical external identity:

```text id="ds014"
meta_business_id
```

---

# 10. Meta Ad Account Data

Meta API se expected fields:

```text id="ds015"
Meta Ad Account ID

Display Name

Account Status

Currency

Timezone

Business Relationship

Selected Account Metadata
```

Canonical external ID:

```text id="ds016"
meta_ad_account_id
```

---

# 11. Meta Campaign Data

Sync:

```text id="ds017"
Meta Campaign ID

Campaign Name

Ad Account ID

Campaign Status

Effective Status

Created Time

Updated Time
```

where required by product scope.

---

# 12. Meta Spend Data

Spend data primarily insights/reporting APIs se aayega.

Possible dimensions:

```text id="ds018"
Ad Account

Campaign

Date

Spend

Currency
```

This spend must later map to:

```text id="ds019"
Client

Job

Allocation
```

internally.

---

# 13. Meta Spend Is Operational Data

Important:

Meta spend value should not independently decide:

```text id="ds020"
Whose money was spent
```

Ownership attribution internal system karega.

---

# 14. Meta Account Status

Meta raw values store karne chahiye.

Alongside:

```text id="ds021"
raw_meta_status
```

system maintains:

```text id="ds022"
normalized_status
```

Examples:

```text id="ds023"
ACTIVE

RESTRICTED

DISABLED

PAYMENT_ISSUE

UNKNOWN
```

---

# 15. Meta Status Source Timestamp

Every status record should know:

```text id="ds024"
Fetched At

Source Sync ID

Meta Raw Value
```

so stale status identify kiya ja sake.

---

# 16. Meta Currency

Meta Ad Account currency authoritative for spend reporting context.

Store:

```text id="ds025"
currency_code
```

Example:

```text id="ds026"
INR
USD
AED
```

---

# 17. Meta Timezone

Ad Account timezone important hai for:

```text id="ds027"
Daily Spend

Date Boundaries

Reporting
```

Server timezone ko blindly use nahi karna.

---

# 18. Meta Data Freshness

Every Meta-derived domain ke liye freshness track honi chahiye.

Examples:

```text id="ds028"
account_status_synced_at

spend_synced_at

campaigns_synced_at

asset_details_synced_at
```

---

# 19. Meta Data Is Eventually Consistent

System assume kare:

```text id="ds029"
Meta data may arrive late

Historical spend may change

Current sync may temporarily fail

Recent insight values may be revised
```

Therefore recent periods can be re-synced.

---

# 20. Internal PostgreSQL Database

Internal DB system ka main application database hoga.

Recommended:

```text id="ds030"
Supabase PostgreSQL
```

It stores:

```text id="ds031"
Users

Roles

Permissions

Clients

Vendors

Jobs

Mappings

Financial Transactions

Ledger Entries

Allocations

Alerts

Reconciliation Cases

Audit Logs

Sync Metadata
```

---

# 21. Internal Business Data

Business-created records include:

```text id="ds032"
Clients

Vendors

Client Jobs

Client Managers

Vendor Finance Owners

Internal Ad Account Aliases

Tags

Notes

Business Classifications
```

These do not come from Meta.

---

# 22. Client Data Source

Client profile information primarily comes from:

```text id="ds033"
Manual Internal Entry
```

Future sources may include:

```text id="ds034"
CRM Integration

CSV Import

Client Portal
```

but canonical internal record remains in system DB.

---

# 23. Vendor Data Source

Vendor data primarily comes from:

```text id="ds035"
Manual Internal Entry

Finance Records

Funding Transactions
```

Future:

```text id="ds036"
Bank Integration

ERP Import
```

---

# 24. Client Job Data Source

Client Job is completely internal business entity.

Created by:

```text id="ds037"
Ads Manager

Admin

Authorized Operations User
```

It should not be auto-created from every Meta Campaign.

---

# 25. Client Job vs Meta Campaign Source

Client Job source:

```text id="ds038"
Internal Business System
```

Meta Campaign source:

```text id="ds039"
Meta API
```

Their relationship comes from:

```text id="ds040"
Internal Mapping Table
```

---

# 26. Financial Ledger Source

All financial balances should ultimately derive from:

```text id="ds041"
Posted Ledger Entries
```

The ledger itself is internal source of truth for money movement.

---

# 27. Ledger Transactions Source

Transactions may originate from:

```text id="ds042"
Manual Finance Entry

Approved Workflow

Automated Internal System Event

Migration Opening Balance

Future Bank Integration
```

but after posting, ledger record becomes canonical internal financial truth.

---

# 28. Client Payment Source

Initially:

```text id="ds043"
Manual Finance Entry
+
Payment Proof
```

Fields may include:

```text id="ds044"
Amount

Payment Date

Method

UTR

Purpose

Proof
```

Future:

```text id="ds045"
Bank Feed

Payment Gateway
```

---

# 29. Vendor Funding Source

Initially:

```text id="ds046"
Manual Finance Entry
+
Bank / UPI Reference
+
Proof
```

Posting creates vendor liability.

---

# 30. Vendor Repayment Source

Initially:

```text id="ds047"
Manual Finance Settlement Entry
+
Payment Reference
+
Proof
```

Later bank/payment integration may verify automatically.

---

# 31. Agency Funding Source

Agency/company fund entry may come from:

```text id="ds048"
Opening Balance

Owner Capital

Company Internal Fund

Approved Transfer
```

Each addition requires transaction.

---

# 32. Refund Source

Client refund information initially comes from:

```text id="ds049"
Finance User

Payment Reference

Refund Proof

Approval Workflow
```

Future external bank verification can supplement.

---

# 33. User Input

Manual inputs remain necessary.

Examples:

```text id="ds050"
Client Name

Vendor Name

Payment Amount

Payment Reference

Funding Purpose

Ownership Classification

Transfer Reason

Adjustment Reason

Notes
```

---

# 34. User Input Is Not Automatically Verified

Each financial manual entry should capture:

```text id="ds051"
Created By

Created At

Submitted By

Approved By

Posted By

Reference

Evidence
```

where applicable.

---

# 35. User Input Confidence

For some migrated/manual records:

```text id="ds052"
VERIFIED

PARTIALLY_VERIFIED

UNVERIFIED
```

can be stored.

---

# 36. Uploaded Evidence

Financial evidence may include:

```text id="ds053"
Bank Screenshot

UPI Screenshot

UTR Proof

Statement

Invoice

Meta Billing Screenshot

Vendor Agreement

Refund Proof
```

---

# 37. Attachment Storage

Recommended source:

```text id="ds054"
Supabase Storage
```

Database stores:

```text id="ds055"
Attachment Metadata

Storage Path

Entity Type

Entity ID

Uploaded By

Uploaded At
```

---

# 38. Attachment Is Supporting Evidence

Uploaded proof does not independently change balance.

Example:

Uploading ₹10,000 screenshot should not create wallet balance automatically.

Financial transaction must still be posted.

---

# 39. System-Generated Data

System may derive data from existing records.

Examples:

```text id="ds056"
Current Payable

Current Receivable

Funding Gap

Leftover Amount

Alert Severity

Financial Status

Account Health
```

---

# 40. Derived Data Rule

Derived values should always be reproducible.

Example:

```text id="ds057"
Vendor Payable
=
Posted Funding
-
Posted Valid Repayment
-
Valid Adjustments
```

Do not store manually editable payable.

---

# 41. Cached Derived Data

For performance, system may cache:

```text id="ds058"
Dashboard Totals

Current Balances

Aging Buckets

Account Summary
```

But cache is not source of truth.

---

# 42. Cache Rebuild

System should be able to rebuild cached values from canonical data.

---

# 43. Background Worker Data

Workers perform:

```text id="ds059"
Meta Sync

Insights Sync

Status Sync

Reconciliation

Alert Evaluation

Snapshot Generation
```

Worker outputs must include:

```text id="ds060"
Job ID

Started At

Completed At

Status

Source Context
```

---

# 44. Sync Run Records

Every external sync should have:

```text id="ds061"
Sync Run ID

Connection

Sync Type

Started At

Finished At

Status

Records Processed

Error Count
```

---

# 45. Sync Source Traceability

Imported Meta records should optionally reference:

```text id="ds062"
Last Sync Run ID
```

for troubleshooting.

---

# 46. Snapshot Data

System may create snapshots:

```text id="ds063"
Daily Spend Snapshot

Account Status Snapshot

Daily Financial Position Snapshot

Vendor Position Snapshot
```

Snapshots aid reporting/performance.

---

# 47. Snapshot Is Not Ledger

Financial snapshot must never replace ledger history.

It is derived read optimization/historical reporting layer.

---

# 48. Legacy Data

Existing business may already have data in:

```text id="ds064"
Excel

Google Sheets

WhatsApp Messages

Bank Statements

Manual Notes

Old Software
```

Migration must explicitly distinguish legacy confidence.

---

# 49. Legacy Client Opening Balance

Example:

Known:

```text id="ds065"
Client A Wallet:
₹20,000
```

but old transactions unavailable.

Create:

```text id="ds066"
OPENING_BALANCE
```

with:

```text id="ds067"
As-of Date

Source

Evidence

Verification Status
```

---

# 50. Legacy Vendor Payable

Example:

```text id="ds068"
RAM Payable:
₹1,50,000
```

Create:

```text id="ds069"
OPENING_VENDOR_PAYABLE
```

instead of manually setting payable column.

---

# 51. Legacy Vendor Receivable

Similarly:

```text id="ds070"
OPENING_VENDOR_RECEIVABLE
```

for known outstanding recoverable.

---

# 52. Legacy Ad Account Fund

If known fund amount exists but source incomplete:

```text id="ds071"
OPENING_AD_ACCOUNT_POSITION
```

with ownership split.

Example:

```text id="ds072"
Client A:
₹10,000

Agency:
₹5,000

Unknown:
₹5,000
```

---

# 53. Unknown Legacy Source

Do not fabricate source.

Use:

```text id="ds073"
SOURCE_UNKNOWN
```

---

# 54. Unknown Legacy Owner

Use:

```text id="ds074"
OWNER_UNATTRIBUTED
```

until reviewed.

---

# 55. Data Source Priority

When fields conflict, source authority depends on field type.

Example:

Ad Account name:

```text id="ds075"
Meta API
```

is authoritative external name.

Internal alias:

```text id="ds076"
Internal DB
```

is authoritative internal label.

---

# 56. Account ID Authority

Meta ID:

```text id="ds077"
Meta API
```

Canonical internal UUID:

```text id="ds078"
Internal DB
```

Both retained.

---

# 57. Client Ownership Authority

Meta does not define internal client ownership.

Authority:

```text id="ds079"
Internal Approved Business Mapping
```

---

# 58. Financial Balance Authority

Authority:

```text id="ds080"
Internal Ledger
```

not manually entered summary field.

---

# 59. Meta Spend Authority

For platform-reported ad spend:

```text id="ds081"
Meta Insights Data
```

is operational source.

Internal attribution may add business meaning.

---

# 60. Vendor Payable Authority

Authority:

```text id="ds082"
Ledger + Vendor Funding/Settlement Model
```

not vendor profile field.

---

# 61. Locked Fund Authority

Locked fund status derives from:

```text id="ds083"
Known Internal Allocation
+
Confirmed Operational Restriction
+
Financial Lock Transaction
```

not solely from Meta status.

---

# 62. Refund Authority

Internal financial truth:

```text id="ds084"
Posted Refund Transaction
```

Payment proof supports it.

Future bank feed can independently confirm.

---

# 63. Source-of-Truth Matrix

| Data                    | Primary Source              | Internal Canonical Storage    |
| ----------------------- | --------------------------- | ----------------------------- |
| Meta Connection         | Meta auth + internal setup  | PostgreSQL                    |
| Business Portfolio      | Meta API                    | PostgreSQL                    |
| Ad Account              | Meta API                    | PostgreSQL                    |
| Account Status          | Meta API + normalization    | PostgreSQL                    |
| Campaign                | Meta API                    | PostgreSQL                    |
| Spend                   | Meta Insights               | PostgreSQL snapshots/facts    |
| Client                  | Internal user               | PostgreSQL                    |
| Vendor                  | Internal user               | PostgreSQL                    |
| Client Job              | Internal user               | PostgreSQL                    |
| Client-Campaign Mapping | Internal user/system        | PostgreSQL                    |
| Client Payment          | Finance workflow            | Ledger                        |
| Vendor Funding          | Finance workflow            | Ledger                        |
| Vendor Repayment        | Finance workflow            | Ledger                        |
| Vendor Payable          | Derived                     | Ledger                        |
| Vendor Receivable       | Derived                     | Ledger                        |
| Client Wallet           | Derived                     | Ledger                        |
| Client Receivable       | Derived                     | Ledger                        |
| Agency Fund             | Derived                     | Ledger                        |
| Locked Fund             | Internal financial workflow | Ledger + allocation tables    |
| Alert                   | System rules                | PostgreSQL                    |
| Audit Log               | System                      | PostgreSQL                    |
| Attachments             | User uploads                | Storage + PostgreSQL metadata |

---

# 64. Authoritative vs Informational Data

Fields should be classified:

```text id="ds085"
AUTHORITATIVE

DERIVED

INFORMATIONAL

UNVERIFIED
```

---

# 65. Authoritative Data

Examples:

```text id="ds086"
Canonical Internal IDs

Posted Ledger Entries

Approved Client Mapping

Approved Vendor Settlement
```

---

# 66. Derived Data

Examples:

```text id="ds087"
Current Payable

Current Wallet Balance

Funding Gap

Aging

Dashboard Totals
```

---

# 67. Informational Data

Examples:

```text id="ds088"
Notes

Tags

Internal Labels
```

unless they drive business logic.

---

# 68. Unverified Data

Examples:

```text id="ds089"
Imported Opening Balance

Manual Claim Without Proof

Unknown Source Transaction
```

should be clearly marked.

---

# 69. Data Freshness Classes

Recommended:

```text id="ds090"
REALTIME_INTERNAL

NEAR_REALTIME_EXTERNAL

PERIODIC_EXTERNAL

SNAPSHOT

STATIC
```

---

# 70. Real-Time Internal

Examples:

```text id="ds091"
Ledger Posting

Approval Status

Client Creation

Vendor Settlement
```

Immediately visible after commit.

---

# 71. Near Real-Time External

Examples:

```text id="ds092"
Ad Account Status
```

synced frequently.

---

# 72. Periodic External

Examples:

```text id="ds093"
Spend

Campaign Insights
```

depending on sync interval/API limits.

---

# 73. Static Data

Examples:

```text id="ds094"
Internal Client ID

Historical Transaction ID
```

should never change.

---

# 74. Data Staleness

System should calculate:

```text id="ds095"
NOW - last_successful_sync
```

and compare to configured threshold.

---

# 75. Stale Data Behavior

If source stale:

```text id="ds096"
Retain last known value

Mark STALE

Do not replace with zero

Create alert if threshold exceeded
```

---

# 76. Partial API Response

If Meta returns only partial assets:

System should not infer missing assets were deleted.

Use sync completeness flag.

---

# 77. Sync Completeness

Sync run can store:

```text id="ds097"
COMPLETE

PARTIAL

FAILED
```

Only complete runs should be used for certain missing-asset conclusions.

---

# 78. Out-of-Order Sync Protection

Each imported record should consider:

```text id="ds098"
source_updated_at

fetched_at

sync_run_started_at
```

Older sync must not overwrite newer state.

---

# 79. Duplicate Sync Protection

Sync operations must be idempotent based on canonical Meta IDs.

---

# 80. Webhook Data

If Meta/webhooks are used later:

Webhook event is:

```text id="ds099"
Change Signal
```

not automatically complete source data.

Recommended flow:

```text id="ds100"
Webhook
↓
Queue Sync
↓
Fetch Canonical Current Data
↓
Update Internal State
```

---

# 81. Manual Meta Override

If operational team manually reports issue:

store as:

```text id="ds101"
USER_REPORT
```

separate from:

```text id="ds102"
META_API_STATUS
```

Do not silently alter raw Meta source field.

---

# 82. Reconciliation Data Sources

Reconciliation engine reads:

```text id="ds103"
Meta facts

Ledger entries

Fund allocations

Client/job mappings

Vendor positions

Locked-fund records
```

---

# 83. Reconciliation Output

Creates:

```text id="ds104"
Difference

Reason Category

Severity

Case Status

Supporting References
```

---

# 84. Alert Data Sources

Alerts may originate from:

```text id="ds105"
Meta Sync Events

Ledger Transactions

Derived Financial State

Reconciliation Cases

Scheduled Aging Checks

Manual Reports
```

---

# 85. Audit Data Source

Audit records generated automatically by system.

Examples:

```text id="ds106"
User action

System action

Approval action

Permission change

Financial posting

Reversal
```

Users should not manually create fake audit records.

---

# 86. Authentication Data

Recommended source:

```text id="ds107"
Supabase Auth
```

System DB stores application profile/role references.

Do not store plaintext passwords.

---

# 87. Role/Permission Data

Internal DB:

```text id="ds108"
users

roles

permissions

role_permissions

user_resource_scopes
```

becomes authorization source.

---

# 88. Storage Source

Attachments:

```text id="ds109"
Supabase Storage
```

Metadata:

```text id="ds110"
PostgreSQL
```

---

# 89. Redis Data

Redis/BullMQ may contain:

```text id="ds111"
Queue Jobs

Job Locks

Temporary Cache

Rate Limit State
```

Redis must not become permanent financial source of truth.

---

# 90. Queue Job Loss

If Redis queue data is lost:

financial ledger must remain safe.

Workers can reconstruct/requeue sync jobs where possible.

---

# 91. Frontend State

Frontend memory/local state is never authoritative financial storage.

Do not rely on browser state for posted balances.

---

# 92. External Bank Data Future

Future integration may provide:

```text id="ds112"
Bank Transactions

Payment Confirmations

Refund Confirmations
```

Bank data can be reconciled against internal transactions.

---

# 93. Bank Data Does Not Replace Business Classification

Bank may say:

```text id="ds113"
₹20,000 received
```

Internal system still determines:

```text id="ds114"
Client A Ads Fund?

Service Fee?

Vendor Recovery?

Unknown Receipt?
```

---

# 94. Payment Gateway Future

Possible source:

```text id="ds115"
Gateway Payment ID

Amount

Status

Settlement ID

Refund Status
```

Internal ledger posting remains controlled.

---

# 95. Google Ads / Other Platforms Future

Future data sources:

```text id="ds116"
Google Ads API

YouTube Ads

Other Advertising Platforms
```

Should map into same internal concepts:

```text id="ds117"
Platform Account

Campaign

Spend

Status

Client Mapping

Financial Allocation
```

---

# 96. Data Lineage

Every important field/value should ideally answer:

```text id="ds118"
Where did this come from?

When was it fetched/created?

Who created it?

Was it manually entered?

Was it derived?

Which transaction/sync produced it?
```

---

# 97. Financial Lineage

For ₹10,000:

system should support trace:

```text id="ds119"
Client Payment PAY-001
↓
Client A Wallet
↓
Allocation ALLOC-001
↓
JOB-001
↓
AD1
↓
Spend
↓
Leftover / Settlement
```

---

# 98. Meta Data Lineage

For spend:

```text id="ds120"
Meta Campaign ID
↓
Ad Account
↓
Insights Date
↓
Sync Run
↓
Internal Spend Fact
↓
Client Job Mapping
```

---

# 99. Record Provenance Fields

Useful generic fields:

```text id="ds121"
source_type

source_system

source_external_id

source_timestamp

created_by

created_at

updated_at

last_sync_run_id
```

depending on entity.

---

# 100. Source Type Examples

```text id="ds122"
META_API

USER_INPUT

SYSTEM

MIGRATION

BANK_IMPORT

PAYMENT_GATEWAY
```

---

# 101. Data Validation at Ingestion

External/internal incoming data should validate:

```text id="ds123"
Required IDs

Currency

Amount

Timestamp

Duplicate Reference

Entity Existence

Status Values

Relationship Validity
```

---

# 102. Invalid External Data

If API returns unexpected data:

```text id="ds124"
Store error/raw diagnostic if safe

Reject invalid normalization

Create sync issue

Preserve last valid state
```

---

# 103. Invalid User Financial Data

Example:

```text id="ds125"
Negative payment amount
```

Reject before ledger posting.

---

# 104. Data Normalization

External values should normalize into internal enums.

Example:

```text id="ds126"
Meta Raw Status
↓
Internal Normalized Status
```

Raw value retained.

---

# 105. Naming Normalization

Names can change.

IDs should not.

Do not use normalized display names as foreign keys.

---

# 106. External IDs

Store as strings.

Examples:

```text id="ds127"
meta_business_id

meta_ad_account_id

meta_campaign_id
```

Avoid numeric assumptions.

---

# 107. Internal IDs

Recommended:

```text id="ds128"
UUID
```

for canonical records.

Human-readable reference can exist separately:

```text id="ds129"
CLI-0001

VEN-0001

JOB-0001
```

---

# 108. Timestamp Source

Store timestamps in database using timezone-aware format.

Internal standard preferably:

```text id="ds130"
UTC
```

UI converts appropriately.

Meta reporting dates respect Meta Ad Account timezone.

---

# 109. Business Date vs Created At

Financial record should distinguish:

```text id="ds131"
transaction_date
```

from:

```text id="ds132"
created_at
```

---

# 110. Source Timestamp vs Ingested Timestamp

For external data:

```text id="ds133"
source_updated_at
```

and:

```text id="ds134"
ingested_at
```

both useful.

---

# 111. Data Retention

Historical records should generally be retained for:

```text id="ds135"
Financial audit

Reconciliation

Historical reporting

Dispute resolution
```

Do not hard-delete important synced/financial records.

---

# 112. Raw API Payload Retention

Do not necessarily store every full Meta payload forever.

Recommended:

```text id="ds136"
Store normalized required fields

Store selective raw payload/errors where useful

Avoid unnecessary sensitive/token data
```

---

# 113. Sensitive Data

Sensitive:

```text id="ds137"
Meta Tokens

Bank Details

Payment Proofs

Personal Contact Data

Financial References
```

Need encryption/access controls as appropriate.

---

# 114. Token Storage

Meta token should be:

```text id="ds138"
Encrypted / Secret-managed
```

Never placed in:

```text id="ds139"
Frontend local storage

Logs

Analytics events

Plain DB text accessible to users
```

---

# 115. Data Access Control

Every source-backed record still passes through:

```text id="ds140"
Authentication

RBAC

Resource Scope

Tenant Isolation
```

---

# 116. Multi-Tenant Data

Future/initial architecture should include:

```text id="ds141"
organization_id
```

on relevant business records.

Every query scoped to tenant.

---

# 117. Meta Connection Tenant Ownership

A Meta Connection belongs to one organization/workspace.

Same external Ad Account appearing in different tenants should not break tenant isolation.

---

# 118. Source Conflict Handling

When conflicting data exists:

```text id="ds142"
Do not silently choose without rule.
```

Use field-specific authority.

Example:

Meta says:

```text id="ds143"
Account Name = X
```

internal alias:

```text id="ds144"
Account Alias = Scaling 01
```

Both valid because fields differ.

---

# 119. Financial Conflict Handling

If user claims vendor payable ₹50k but ledger derives ₹60k:

Ledger position remains canonical.

Create reconciliation/adjustment workflow.

Do not manually override ledger.

---

# 120. Meta vs Ledger Conflict

Example:

```text id="ds145"
Meta-derived tracked position:
₹9,500

Internal allocation:
₹10,000
```

Do not replace ledger/allocation.

Create:

```text id="ds146"
₹500 reconciliation difference
```

---

# 121. Source Health Monitoring

System should monitor:

```text id="ds147"
Meta connection health

Sync freshness

Worker health

Queue health

Database connectivity

Storage failures
```

---

# 122. Data Source Dashboard

Admin may see:

```text id="ds148"
Meta API:
Healthy

Ledger DB:
Healthy

Worker Queue:
Healthy

Last Reconciliation:
10 min ago
```

---

# 123. Data Availability Status

Per external source:

```text id="ds149"
AVAILABLE

DEGRADED

STALE

FAILED

AUTH_REQUIRED
```

---

# 124. V1 Data Sources

Required:

```text id="ds150"
Meta Marketing API

Supabase PostgreSQL

Supabase Auth

Supabase Storage

Manual Internal Entry

Redis / BullMQ

System-Derived Reconciliation and Alerts
```

---

# 125. V1 Manual Data Inputs

Initial manual inputs:

```text id="ds151"
Clients

Vendors

Client Payments

Vendor Funding

Vendor Repayments

Refunds

Agency Funding

Job Creation

Campaign Mapping

Adjustments

Opening Balances
```

---

# 126. V1 Automated Data Inputs

Automated:

```text id="ds152"
Meta Connections / Assets

Ad Accounts

Account Status

Campaigns

Spend

Sync Health

Derived Alerts

Reconciliation Differences
```

---

# 127. Future Data Sources

Potential:

```text id="ds153"
Bank API

Payment Gateway

Google Ads

CRM

Accounting Software

Invoice Platform

WhatsApp Notifications

ERP
```

---

# 128. Data Source Integrity Rules

System must enforce:

```text id="ds154"
1. Every important field must have a known source.

2. Meta is authoritative for Meta operational facts, not internal money ownership.

3. Ledger is authoritative for posted internal financial movement.

4. Internal mappings define business ownership and purpose.

5. Derived balances must be reproducible from canonical records.

6. Cached values must never become independent truth.

7. Stale external data must be clearly marked.

8. Failed sync must not replace known values with zero.

9. Partial sync must not cause mass deletion.

10. Names must not be used as canonical external identity.

11. Manual financial input must retain creator, reference and audit trail.

12. Migration data must preserve verification confidence.

13. Unknown data must remain explicitly unknown.

14. External events must be idempotently ingested.

15. Older sync data must not overwrite newer confirmed data.

16. Sensitive source credentials must never be exposed to frontend/users.
```

---

# 129. Data Source Golden Rule

> **The system must always know which source produced a piece of data and what that source is authoritative for. Meta tells us what happened on the advertising platform, the ledger tells us how money moved, and internal business mappings tell us whose money it was and why it was used. Reconciliation—not silent overwriting—connects these truths.**
