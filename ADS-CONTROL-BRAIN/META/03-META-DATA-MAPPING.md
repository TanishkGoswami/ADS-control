# Meta Data Mapping

## Overview

Ye document define karta hai ki Meta Marketing API se aane wale external objects aur fields ko internal canonical data model me kaise map kiya jayega.

Goal:

```text
Meta API Response
↓
Meta Adapter
↓
Normalized DTO
↓
Canonical Internal Entity
↓
Business Mapping / Reconciliation
```

Core principle:

> **Internal database schema Meta API response ka direct copy nahi hoga. Meta fields ko normalize karke stable internal model me map kiya jayega, while raw external identity and important source values preserve kiye jayenge.**

---

# 1. Why Mapping Layer Is Required

Meta APIs future me change ho sakte hain:

```text
Field naming

Field availability

Status values

Nested response shape

API version behavior
```

Internal business model ko in changes se isolate karna hai.

Therefore:

```text
Meta Response
≠
Database Entity
```

---

# 2. Mapping Architecture

Recommended flow:

```text
Meta API
↓
Raw Response DTO
↓
Meta Mapper / Adapter
↓
Normalized Internal DTO
↓
Domain Service
↓
Database
```

---

# 3. Mapping Responsibilities

Mapper should handle:

```text
External ID normalization

Nullable fields

Status normalization

Timestamp parsing

Currency normalization

Name handling

Nested business references

Unknown enum values

Provenance metadata
```

---

# 4. Mapper Must Not Handle

Meta mapper should not decide:

```text
Client ownership

Vendor liability

Client wallet

Agency fund ownership

Refund eligibility

Financial loss

Ledger adjustment
```

Those belong to business/finance layers.

---

# 5. External ID Rule

All Meta external IDs should be stored as:

```text
TEXT / STRING
```

Examples:

```text
meta_business_id

meta_ad_account_id

meta_campaign_id
```

Do not store as numeric database IDs.

---

# 6. Internal ID Rule

Every canonical internal entity also receives:

```text
UUID
```

Example:

```text
AdAccount.id
=
internal UUID

AdAccount.meta_ad_account_id
=
Meta external ID
```

---

# 7. Display Name Rule

Names are mutable.

Never use:

```text
name
```

as canonical identity.

Example:

```text
Scaling Account 1
```

can later become:

```text
Main Conversion Account
```

Same Meta ID:

```text
Same internal AdAccount
```

---

# 8. Source Provenance

Every externally synchronized entity should support fields such as:

```text
source_type = META_API

last_sync_run_id

fetched_at

source_updated_at
```

where applicable.

---

# 9. Meta Connection Mapping

Meta Connection is primarily internal.

It represents:

```text
Authenticated Meta access context
```

Not necessarily a direct Meta object copy.

Internal entity:

```text
MetaConnection
```

Fields:

```text
id
organization_id
internal_name
external_context_id
token_secret_reference
connection_status
permission_status
last_successful_sync_at
```

---

# 10. Connection External Context

Depending on auth setup, connection may have references such as:

```text
User ID

System User ID

Business context
```

Do not overload one generic Meta profile concept without documenting its meaning.

---

# 11. Business Portfolio Mapping

Internal entity:

```text
BusinessPortfolio
```

Primary external identity:

```text
meta_business_id
```

---

# 12. Business Portfolio Core Mapping

Conceptual:

| Meta Value        | Internal Field      |
| ----------------- | ------------------- |
| Business ID       | `meta_business_id`  |
| Business name     | `name`              |
| Source connection | relationship record |
| Seen timestamp    | `last_seen_at`      |
| Fetch timestamp   | `last_synced_at`    |

---

# 13. Connection ↔ Business Mapping

Do not store only:

```text
business_portfolios.meta_connection_id
```

if same business may be discoverable through multiple connections.

Use:

```text
meta_asset_relationships
```

Example:

```text
MC-001
→ BP-001
```

---

# 14. Business Relationship Mapping

Internal relationship should include:

```text
parent_type = META_CONNECTION

parent_id = MC-001

child_type = BUSINESS_PORTFOLIO

child_id = BP-001
```

---

# 15. Ad Account Mapping

Meta's current official Marketing API examples show Ad Account retrieval with fields such as `id`, `name`, `business`, `business_name`, `amount_spent`, `balance`, `currency`, `timezone_name` and `spend_cap`.

Internal entity:

```text
AdAccount
```

---

# 16. Ad Account Core Mapping

Conceptual:

| Meta Field              | Internal Field                   |
| ----------------------- | -------------------------------- |
| `id`                    | `meta_ad_account_id`             |
| `name`                  | `name`                           |
| `currency`              | `currency_code`                  |
| `timezone_name`         | `timezone_name`                  |
| status-related field(s) | `raw_meta_status`                |
| derived mapper output   | `normalized_status`              |
| derived mapper output   | `can_run_ads`                    |
| business reference      | relationship mapping             |
| fetch timestamp         | `last_status_sync_at` / metadata |

---

# 17. Ad Account ID Normalization

Meta Marketing API commonly addresses Ad Accounts through:

```text
act_{account_id}
```

style paths.

Internally choose one consistent representation.

Recommended:

```text
meta_ad_account_id
=
canonical Meta ID string
```

and separately construct API path as needed.

---

# 18. Do Not Mix ID Formats

Avoid having:

```text
123456789
```

in one table and:

```text
act_123456789
```

in another without normalization rules.

Create helper:

```text
normalizeMetaAdAccountId()
```

---

# 19. Ad Account Name

Map:

```text
Meta.name
→
AdAccount.name
```

Internal alias remains separate:

```text
AdAccount.internal_alias
```

Example:

```text
Meta Name:
Business Scaling Account 04

Internal Alias:
AD4
```

---

# 20. Ad Account Currency

Map:

```text
Meta.currency
→
AdAccount.currency_code
```

Example:

```text
INR
```

This currency is important for:

```text
Spend facts

Allocation validation

Reporting
```

---

# 21. Currency Change

If Meta account currency appears to change unexpectedly:

Do not silently rewrite historical spend currency.

Create review/reconciliation workflow.

Historical spend facts retain original currency context.

---

# 22. Ad Account Timezone

Map:

```text
Meta.timezone_name
→
AdAccount.timezone_name
```

Official Meta examples expose `timezone_name` on Ad Account details.

---

# 23. Why Timezone Matters

Timezone affects:

```text
Daily spend boundaries

Reporting dates

Late spend

Job reporting
```

Do not use server timezone to reinterpret Meta reporting dates.

---

# 24. Meta Business Reference on Ad Account

If Meta response provides business information:

Use it to help construct:

```text
BusinessPortfolio
↔
AdAccount
```

relationship.

Do not use business name as relationship key.

---

# 25. Ad Account `balance`

Meta examples expose a `balance` field.

Important:

> **Do not map Meta `balance` directly to internal financial balance.**

Store it only as an external observation if required.

---

# 26. Meta Balance Mapping

Possible internal observation:

```text
MetaAccountObservation
```

with:

```text
observation_type = META_BALANCE

value

currency

observed_at

source_sync_run_id
```

---

# 27. Meta Balance Is Not Client Wallet

Never map:

```text
Meta.balance
→ Client.wallet_balance
```

---

# 28. Meta Balance Is Not Agency Fund

Never map:

```text
Meta.balance
→ Agency available fund
```

---

# 29. Meta `amount_spent`

Meta's Ad Account example also exposes `amount_spent`.

This may be useful as:

```text
Account-level external observation
```

but not as primary daily spend fact when detailed Insights data is available.

---

# 30. Spend Source Preference

For historical/daily spend:

Prefer:

```text
Insights API
```

rather than cumulative account `amount_spent`.

---

# 31. Spend Cap

Meta Ad Account examples expose:

```text
spend_cap
```

where applicable.

Map only if product uses it operationally.

Do not interpret:

```text
spend_cap
=
available funds
```

---

# 32. Campaign Mapping

Meta's official Marketing API examples expose campaign fields including `id`, `account_id`, `name`, `status`, `effective_status`, `created_time` and `updated_time`.

Internal entity:

```text
MetaCampaign
```

---

# 33. Campaign Core Mapping

| Meta Field         | Internal Field          |
| ------------------ | ----------------------- |
| `id`               | `meta_campaign_id`      |
| `account_id`       | resolve `ad_account_id` |
| `name`             | `name`                  |
| `status`           | `raw_status`            |
| `effective_status` | `effective_status`      |
| `created_time`     | `meta_created_at`       |
| `updated_time`     | `meta_updated_at`       |
| fetch time         | `last_synced_at`        |

---

# 34. Campaign → Ad Account Mapping

Meta:

```text
account_id
```

should resolve to canonical internal:

```text
AdAccount.id
```

Never store campaign against display-name matching.

---

# 35. Missing Parent Ad Account

If campaign arrives but corresponding Ad Account is absent:

Do not discard campaign silently.

Options:

```text
Create unresolved parent relationship

Queue Ad Account fetch

Mark sync partial/error
```

---

# 36. Campaign Name

Map:

```text
Meta.name
→
MetaCampaign.name
```

Name is mutable.

---

# 37. Campaign Status

Store both:

```text
raw_status
```

and:

```text
effective_status
```

where Meta supplies both.

Meta's campaign examples explicitly expose `status` and `effective_status`.

---

# 38. Status vs Effective Status

Do not assume both mean the same thing.

System should preserve both rather than overwriting one.

Business logic can decide which is relevant for:

```text
Active campaign detection

No-spend monitoring

Post-completion checks
```

---

# 39. Campaign Objective

Meta examples also expose:

```text
objective
```

and related campaign fields.

V1 may store objective optionally if useful for reporting.

---

# 40. Avoid Oversyncing Campaign Fields

Meta exposes many additional campaign fields.

V1 should not replicate all fields by default.

Recommended required set:

```text
id

account_id

name

status

effective_status

created_time

updated_time
```

Optional:

```text
objective
```

---

# 41. Campaign Internal Business Mapping

Meta Campaign does not contain internal:

```text
client_id

client_job_id
```

directly.

Use:

```text
ClientJobCampaignMapping
```

---

# 42. Never Add Client ID to Meta Campaign as Source Truth

Even if convenience cached relationship exists:

Canonical relationship remains mapping table with effective dates.

---

# 43. Insights Mapping

Meta's official Marketing API collection demonstrates Insights fields including:

```text
date_start

date_stop

account_id

campaign_id

campaign_name

spend
```

and supports granular reporting through parameters such as `level` and `time_increment`.

---

# 44. Recommended V1 Insights Fields

For financial-control use:

```text
date_start

date_stop

account_id

campaign_id

spend
```

Optionally:

```text
campaign_name
```

for diagnostics.

---

# 45. Insights Spend Mapping

Meta:

```text
spend
```

maps to internal:

```text
SpendFact.amount_minor
```

after controlled decimal-to-minor-unit conversion.

---

# 46. Spend Parsing

Meta monetary values may arrive in external serialized form.

Backend must parse using decimal-safe logic.

Never:

```text
parseFloat()
```

then multiply blindly in financial-critical code.

Use decimal library/string-safe conversion.

---

# 47. Example

External:

```text
"1250.50"
```

INR internal:

```text
125050
```

minor units.

---

# 48. Spend Currency

SpendFact currency should come from trusted account/report context.

Possible sources:

```text
AdAccount.currency

Insights account_currency where explicitly retrieved
```

Meta's Insights examples include `account_currency` in reporting examples.

---

# 49. Currency Consistency Check

Before storing spend:

```text
Insights currency
```

should match expected:

```text
AdAccount.currency
```

If mismatch:

```text
Do not silently convert
```

Create sync/reconciliation issue.

---

# 50. Spend Date Mapping

When:

```text
time_increment = 1
```

Insights can produce daily rows with `date_start` and `date_stop`.

Recommended:

```text
SpendFact.spend_date
=
date_start
```

when query grain is one day.

---

# 51. Date Range Validation

For daily facts:

Expected:

```text
date_start == date_stop
```

or equivalent single-day reporting period according to API behavior.

If not:

mapper should respect requested grain rather than assume daily.

---

# 52. Insight Level

Possible query levels include:

```text
account

campaign

adset

ad
```

depending on endpoint/report request.

V1 recommended financial attribution level:

```text
campaign
```

where possible.

---

# 53. Why Campaign-Level Spend

Internal mapping:

```text
Meta Campaign
→ Client Job
```

makes campaign-level spend a useful attribution grain.

---

# 54. Account-Level Fallback

If campaign-level insight unavailable or intentionally not retrieved:

Store:

```text
grain_type = ACCOUNT
```

rather than pretending a campaign exists.

---

# 55. SpendFact Grain

Recommended fields:

```text
grain_type

ad_account_id

meta_campaign_id nullable

spend_date

amount_minor

currency_code
```

---

# 56. Grain Types

Initial:

```text
ACCOUNT

CAMPAIGN
```

Future:

```text
ADSET

AD
```

---

# 57. Unique Spend Key

Campaign-level daily grain:

```text
organization_id
+
ad_account_id
+
campaign_id
+
spend_date
+
currency
+
grain_type
```

---

# 58. Account-Level Unique Key

Account-level:

```text
organization_id
+
ad_account_id
+
spend_date
+
currency
+
grain_type
```

---

# 59. Avoid Null Unique-Key Bugs

Because PostgreSQL null behavior can complicate uniqueness:

Use:

```text
grain_type
```

and deliberate indexes rather than relying on nullable `campaign_id` only.

---

# 60. Spend Revision Mapping

Same natural-key row can later receive updated:

```text
amount_minor
```

from newer valid Meta sync.

Store:

```text
updated_at

source_sync_run_id

fetched_at
```

---

# 61. Historical Value Audit

For high-control environments, optionally retain:

```text
SpendFactVersion
```

or audit old/new spend values.

V1 may rely on:

```text
audit/event log
```

if sufficient.

---

# 62. SpendFact Is Not Spend Attribution

Meta:

```text
SpendFact
```

answers:

```text
How much Meta says was spent?
```

Internal:

```text
SpendAttribution
```

answers:

```text
Whose job/fund consumed it?
```

Keep separate.

---

# 63. Spend Attribution Mapping

Conceptual chain:

```text
SpendFact
↓
MetaCampaign
↓
ClientJobCampaignMapping
↓
ClientJob
↓
FundAllocation
↓
SpendAttribution
```

---

# 64. Mapping Effective Date

When mapping spend on:

```text
2026-09-10
```

use campaign mapping effective on:

```text
2026-09-10
```

not current mapping.

---

# 65. Historical Mapping Example

```text
Campaign X
1–10 Sep → Client A

11 Sep onward → Client B
```

Spend:

```text
10 Sep → Client A

11 Sep → Client B
```

---

# 66. No Mapping

If no valid mapping for spend date:

```text
SpendAttribution.status
=
UNATTRIBUTED
```

and create review/reconciliation.

---

# 67. Multiple Active Mappings

If two client mappings overlap unexpectedly:

Do not select one arbitrarily.

Mark:

```text
AMBIGUOUS_MAPPING
```

and block automatic attribution.

---

# 68. Ad Set Mapping

Meta official Marketing API examples expose Ad Set fields including:

```text
id

account_id

campaign_id

name

status

effective_status

created_time
```

when ad-set detail is requested.

V1 may not persist Ad Sets unless required.

---

# 69. Future Ad Set Entity

Potential:

```text
MetaAdSet
```

Mapping:

```text
id → meta_adset_id

campaign_id → MetaCampaign

account_id → AdAccount

name → name

status → raw_status

effective_status → effective_status
```

---

# 70. Ads Mapping

Meta examples expose Ad fields such as:

```text
id

name

adset_id

campaign_id

status

effective_status

created_time

updated_time
```

for ad retrieval.

Not required for V1 unless ad-level reporting becomes necessary.

---

# 71. Do Not Add Unneeded Entities

V1 canonical model can remain:

```text
Business Portfolio

Ad Account

Campaign

Spend Fact
```

until product requires deeper hierarchy.

---

# 72. Account Status Mapping

Raw account status must be stored separately from normalized operational status.

Conceptual:

```text
Meta raw values
↓
MetaAccountStatusMapper
↓
Internal normalized status
```

---

# 73. Normalized Status Values

Internal:

```text
ACTIVE

RESTRICTED

DISABLED

PAYMENT_ISSUE

ACCESS_LOST

UNKNOWN

STALE

ARCHIVED
```

---

# 74. Status Mapper Inputs

Potential inputs:

```text
Raw account status

Disable reason if retrieved

API accessibility

Permission result

Data freshness

Other supported status fields
```

---

# 75. Status Mapper Output

Recommended DTO:

```text
normalizedStatus

canRunAds

reasonCode

sourceFields

confidence
```

---

# 76. Mapper Must Not Guess

If source fields are insufficient:

```text
normalizedStatus = UNKNOWN
```

rather than inferring restriction.

---

# 77. STALE Is Internal State

`STALE` generally describes:

```text
Our knowledge is outdated
```

not necessarily Meta's actual account state.

Preserve last known Meta state separately if useful.

---

# 78. Example

Last known:

```text
Meta state:
ACTIVE

Fetched:
3 hours ago
```

Internal freshness:

```text
STALE
```

UI can display:

```text
Last known ACTIVE — data stale
```

rather than claiming currently active.

---

# 79. ACCESS_LOST

This is internal normalized access condition.

It may derive from repeated verified authorization/access failures.

Do not confuse with Meta business account deletion.

---

# 80. Status History Mapping

When normalized status changes:

```text
Previous Status

New Status

Raw Source

Detected At

Sync Run
```

create:

```text
AdAccountStatusHistory
```

---

# 81. No History on Every Poll

If:

```text
ACTIVE → ACTIVE
```

every five minutes:

Do not create unnecessary status-history row each time.

Update freshness/current observation.

---

# 82. Meaningful Change

Create history on:

```text
ACTIVE → RESTRICTED

RESTRICTED → ACTIVE

ACTIVE → ACCESS_LOST

UNKNOWN → ACTIVE
```

etc.

---

# 83. Business Portfolio Name Changes

Update:

```text
BusinessPortfolio.name
```

while internal ID/external Meta ID stay same.

Audit if needed.

---

# 84. Ad Account Name Changes

Same pattern.

---

# 85. Campaign Name Changes

Same pattern.

Historical reports may show:

```text
Current campaign name
```

or optionally historical name snapshots if required.

---

# 86. First Seen

When external asset first discovered:

```text
first_seen_at
```

set once.

---

# 87. Last Seen

Every complete valid discovery:

```text
last_seen_at
```

updated.

---

# 88. Last Synced

Field-specific sync timestamps preferred.

Example:

```text
last_status_sync_at

last_spend_sync_at
```

---

# 89. Do Not Use `updated_at` as Freshness

`updated_at` may change due internal alias edit.

It does not mean Meta status was freshly synced.

---

# 90. Relationship Mapping

External hierarchy may yield:

```text
Connection
→ Business
→ Ad Account
```

Internal canonical relationship record should contain:

```text
source_connection_id

relationship_type

effective_from

effective_to

is_current
```

---

# 91. Owned vs Shared Mapping

If external source can reliably distinguish:

```text
OWNED

SHARED

CLIENT_ACCESS
```

map accordingly.

Otherwise:

```text
UNKNOWN
```

or:

```text
DISCOVERED
```

Do not infer from naming.

---

# 92. Relationship Change

If Ad Account moves:

Old:

```text
BP1 → AD1
```

New:

```text
BP2 → AD1
```

mapping process:

```text
Close old relationship

Create new relationship
```

Do not update canonical AdAccount identity.

---

# 93. Multiple Valid Relationships

Same Ad Account may remain visible through:

```text
Multiple Meta connections
```

or access paths.

This is allowed.

---

# 94. Source Connection Mapping

Relationship record should preserve:

```text
Which Meta Connection discovered this path?
```

Useful for troubleshooting.

---

# 95. Preferred Sync Source

If same asset visible from multiple healthy connections:

System may choose a:

```text
preferred_sync_connection_id
```

as operational optimization.

But this must not alter canonical entity identity.

---

# 96. Duplicate Response Detection

If same Meta Campaign appears multiple times in discovery:

Upsert by:

```text
organization_id + meta_campaign_id
```

---

# 97. Conflicting Names

Two connection responses return different names for same account.

Use latest trustworthy observation.

Record conflict/debug metadata where required.

Do not duplicate account.

---

# 98. Out-of-Order Data

External mapper should carry:

```text
source_updated_at

fetched_at

sync_run_started_at
```

when available.

Domain upsert should reject stale overwrite where ordering can be established.

---

# 99. Null Field Mapping

Meta omitted field does not always mean:

```text
set internal field = null
```

Mapper/update policy should distinguish:

```text
Field explicitly returned null
```

vs:

```text
Field not requested/not returned
```

---

# 100. Patch vs Replace

Recommended sync updates:

```text
Patch only fields included in request/response
```

not full-record replacement.

This prevents accidental nulling.

---

# 101. API Field Set Tracking

Sync implementation should know:

```text
requested_fields
```

for each sync type.

Example:

```text
ACCOUNT_METADATA_V1
```

---

# 102. Mapping Version

Recommended mapper version identifiers:

```text
META_AD_ACCOUNT_MAPPER_V1

META_CAMPAIGN_MAPPER_V1

META_INSIGHTS_MAPPER_V1
```

Useful during API upgrades.

---

# 103. Mapping Errors

If parser encounters unexpected field:

Do not crash entire sync if safely isolatable.

Store:

```text
SyncError
```

with:

```text
entity

field

reason

raw safe context
```

---

# 104. Invalid Currency

If external currency missing/unsupported:

Do not create financial spend fact blindly.

Mark:

```text
SYNC_DATA_ERROR
```

or unresolved state.

---

# 105. Invalid Spend

If spend cannot be parsed safely:

Do not store zero.

Create error.

---

# 106. Missing Campaign ID in Campaign-Grain Report

Do not invent campaign.

Either:

```text
Reject row

or classify appropriate grain
```

according to query specification.

---

# 107. Meta Monetary Values

External Meta monetary fields should be treated according to their documented semantics.

Do not assume every amount field uses identical meaning.

Each mapped monetary field requires:

```text
Meaning

Currency

Scaling/parsing rule

Use case
```

---

# 108. Meta Account Balance Observation

Recommended field metadata:

```text
observation_type

raw_value

normalized_minor_value

currency

observed_at

source
```

if retained.

---

# 109. Account Spend Observation

Cumulative `amount_spent` may be stored for diagnostics/reconciliation.

Do not mix with daily `SpendFact` totals in one column.

---

# 110. Observation Types

Potential:

```text
META_BALANCE

META_AMOUNT_SPENT

META_SPEND_CAP
```

These are observations, not internal balances.

---

# 111. Internal vs External Naming

Use prefixes to avoid confusion.

Good:

```text
meta_balance_observed_minor
```

Bad:

```text
balance
```

where users may think it is internal money truth.

---

# 112. Business Mapping Layer

After Meta canonical data exists:

```text
MetaCampaign
↓
ClientJobCampaignMapping
```

is created internally.

Meta adapter should not create client relationships based on names.

---

# 113. No Name-Based Auto Mapping

Bad:

```text
Campaign name contains "Alpha"
→ Client Alpha
```

as authoritative logic.

Such heuristic can at most create:

```text
Mapping suggestion
```

requiring confirmation.

---

# 114. Client Mapping Metadata

Mapping should include:

```text
mapped_by

mapping_method

effective_from

effective_to
```

Possible methods:

```text
MANUAL

RULE_CONFIRMED

IMPORT

SYSTEM_CONFIRMED
```

---

# 115. Spend Attribution Mapping Method

Store:

```text
CAMPAIGN_MAPPING

MANUAL

SYSTEM_RULE

UNATTRIBUTED
```

---

# 116. Exact Attribution Flow

```text
SpendFact
↓
Campaign ID
↓
Campaign Mapping Effective on Spend Date
↓
Client Job
↓
Client
↓
Eligible Fund Allocations
↓
Spend Attribution
```

---

# 117. Mapping Failure States

Recommended:

```text
NO_CAMPAIGN_MAPPING

AMBIGUOUS_CAMPAIGN_MAPPING

NO_ELIGIBLE_ALLOCATION

INSUFFICIENT_ALLOCATION

CURRENCY_MISMATCH

UNKNOWN_OWNER
```

---

# 118. Mapping Failure Does Not Delete Spend

SpendFact remains stored.

Only business attribution remains unresolved.

---

# 119. Meta Data vs Ledger Data

Meta mapping tables must not directly update:

```text
ledger_accounts

ledger_entries

vendor_payable

client_wallet
```

without domain financial workflow.

---

# 120. Meta Refund Mapping

If future/available external Meta data provides refund observation:

Map it first to:

```text
MetaRefund
```

or:

```text
MetaRefundObservation
```

Then finance/reconciliation decides posting.

---

# 121. Meta Refund External ID

Where an external refund/reference exists:

store:

```text
external_reference
```

for deduplication/reconciliation.

---

# 122. Do Not Post Expected Refund

External indication:

```text
Refund pending
```

is not:

```text
Cash received
```

---

# 123. Account Restriction Mapping

External account status:

```text
restricted/unusable state
```

maps to normalized account status.

Downstream:

```text
Restriction Workflow
```

determines locked funds.

---

# 124. Account Restore Mapping

External restored state:

```text
normalized_status = ACTIVE
```

Downstream does not immediately set:

```text
locked_funds = 0
```

Reconciliation required.

---

# 125. Permission Mapping

Meta permission health can map to:

```text
MetaConnectionPermission
```

Fields:

```text
permission_name

permission_status

checked_at
```

---

# 126. Capability Mapping

Permission + asset access tests produce internal capabilities:

```text
CAN_DISCOVER_AD_ACCOUNTS

CAN_READ_CAMPAIGNS

CAN_READ_INSIGHTS
```

These are internal derived values, not raw Meta permission names.

---

# 127. Error Mapping

Raw Meta/API error:

```text
code

subcode

message

HTTP status
```

maps to internal:

```text
AUTH_ERROR

PERMISSION_ERROR

RATE_LIMIT

INVALID_REQUEST

RESOURCE_NOT_FOUND

TRANSIENT_ERROR

SERVER_ERROR

NETWORK_ERROR

UNKNOWN_ERROR
```

---

# 128. Preserve Raw Error Safely

Store enough diagnostic information.

Redact:

```text
Access token

Secrets

Sensitive request parameters
```

---

# 129. Error Mapping Should Be Centralized

Use:

```text
MetaErrorMapper
```

not repeated string matching in workers.

---

# 130. Sync Run Mapping

Every mapper operation should know:

```text
sync_run_id
```

so records can be traced to data ingestion episode.

---

# 131. Example Ad Account Mapping

External response conceptually:

```text
id: act_123456
name: Main Scaling
currency: INR
timezone_name: Asia/Kolkata
```

Internal:

```text
AdAccount {
  id: UUID
  meta_ad_account_id: "act_123456"
  name: "Main Scaling"
  currency_code: "INR"
  timezone_name: "Asia/Kolkata"
}
```

---

# 132. Example Campaign Mapping

External:

```text
id: 238500001
account_id: 123456
name: Alpha Leads
status: ACTIVE
effective_status: ACTIVE
```

Internal:

```text
MetaCampaign {
  meta_campaign_id: "238500001"
  ad_account_id: AA-001
  name: "Alpha Leads"
  raw_status: "ACTIVE"
  effective_status: "ACTIVE"
}
```

---

# 133. Example Spend Mapping

External:

```text
date_start: 2026-09-17

date_stop: 2026-09-17

account_id: 123456

campaign_id: 238500001

spend: "1250.50"
```

Internal:

```text
SpendFact {
  ad_account_id: AA-001
  campaign_id: CMP-001
  spend_date: 2026-09-17
  amount_minor: 125050
  currency_code: INR
  grain_type: CAMPAIGN
}
```

---

# 134. Example Business Attribution

Internal mapping:

```text
CMP-001
→ JOB-001
→ Client Alpha
```

Spend:

```text
₹1,250.50
```

eligible client allocation exists.

Create:

```text
SpendAttribution {
  spend_fact_id: SF-001
  client_id: CLI-001
  client_job_id: JOB-001
  attributed_amount_minor: 125050
}
```

---

# 135. Example Unattributed Spend

SpendFact:

```text
₹2,000
```

No campaign mapping.

Result:

```text
SpendFact stored

SpendAttribution:
UNATTRIBUTED ₹2,000

Reconciliation Case opened
```

---

# 136. Example Ambiguous Mapping

Campaign:

```text
CMP-001
```

has two overlapping mappings:

```text
JOB-A

JOB-B
```

Result:

```text
Automatic attribution blocked

AMBIGUOUS_MAPPING case
```

---

# 137. Example Stale Status

Current DB:

```text
Last known Meta status:
ACTIVE

Last synced:
3 hours ago
```

Internal display:

```text
Meta Status:
ACTIVE (last known)

Freshness:
STALE
```

Do not map:

```text
ACTIVE → RESTRICTED
```

because sync is stale.

---

# 138. Data Mapping Tables

Recommended conceptual mapping modules:

```text
MetaBusinessMapper

MetaAdAccountMapper

MetaCampaignMapper

MetaInsightsMapper

MetaPermissionMapper

MetaErrorMapper

MetaStatusMapper
```

---

# 139. Adapter Contract

Each mapper should return internal typed DTO.

Example:

```text
NormalizedMetaAdAccount
```

with only fields domain layer understands.

---

# 140. Raw Provider Isolation

Database/domain code should not access random raw response keys directly.

Bad:

```text
response.data[0].business.name
```

inside finance service.

Correct:

```text
MetaAdapter
↓
Normalized DTO
```

---

# 141. Mapping Tests

Every mapper should have fixture-based tests.

Cases:

```text
Complete response

Optional field missing

Unexpected status

Null business

Renamed account

Currency mismatch

Invalid spend

Unknown error code
```

---

# 142. API Version Regression

When Meta API version changes:

Run mapping tests against new response fixtures.

Verify:

```text
Required fields still available

Status semantics valid

Spend parsing unchanged

Relationships remain valid
```

---

# 143. Field Deprecation

If Meta removes field:

Internal model should fail only affected feature.

Do not allow unrelated finance modules to crash.

---

# 144. Mapping Fallback

Fallback can be:

```text
UNKNOWN

NULL

UNRESOLVED
```

where semantically valid.

Never invent data.

---

# 145. V1 Required Meta Data

Minimum:

```text
Business Portfolio ID + Name

Ad Account ID

Ad Account Name

Currency

Timezone

Account Status Inputs

Campaign ID

Campaign Name

Campaign Account ID

Campaign Status

Campaign Effective Status

Spend

Spend Date

Spend Account ID

Spend Campaign ID
```

---

# 146. V1 Optional Meta Data

Useful:

```text
Campaign Objective

Account cumulative amount spent

Observed account balance

Spend cap

Campaign created/updated timestamps
```

Only if needed.

---

# 147. V1 Data We Should Not Mirror by Default

Avoid pulling/storing unnecessary:

```text
Full targeting specs

Full creatives

All ad-level objects

Audience definitions

Instagram profile details

Every performance metric
```

unless a product feature requires them.

---

# 148. Data Minimization

Benefits:

```text
Lower sync load

Less storage

Less privacy exposure

Simpler migrations

Fewer API-version dependencies
```

---

# 149. Mapping Documentation Requirement

For every new Meta field added, document:

```text
External Field

Internal Field

Purpose

Data Type

Nullable?

Authoritative For?

Historical?

Sensitive?

Used By Which Feature?
```

---

# 150. Source-of-Truth Classification

Example:

```text
MetaCampaign.name
```

Authority:

```text
Meta operational name
```

---

# 151. Internal Alias Authority

```text
AdAccount.internal_alias
```

Authority:

```text
Internal application
```

Meta sync must never overwrite it.

---

# 152. Meta Currency Authority

For Meta account reporting currency:

```text
Meta API
```

is source.

For financial transaction currency:

```text
Internal transaction
```

is source.

They should reconcile where related.

---

# 153. Spend Authority

For advertising spend observation:

```text
Meta Insights
```

is source.

For whose funds funded that spend:

```text
Internal allocation
```

is source.

---

# 154. Client Ownership Authority

Never Meta.

Authority:

```text
Internal Business Mapping
+
Fund Allocation
```

---

# 155. Vendor Source Authority

Never Meta.

Authority:

```text
Internal Vendor Funding Records
+
Ledger
```

---

# 156. Mapping Integrity Rules

System must enforce:

```text
1. Every Meta entity must retain its external stable ID.

2. Internal UUIDs and Meta IDs must remain separate.

3. Names must never be used as canonical identity.

4. Meta API responses must pass through a normalization layer.

5. Raw status and normalized status must remain separate.

6. Meta balance fields must never become internal wallet/accounting balances automatically.

7. Meta spend facts must remain separate from spend attribution.

8. Campaign-client relationships must come from internal mappings, not campaign names.

9. Historical spend must use historical effective mappings.

10. Missing/ambiguous mapping must remain unresolved instead of guessed.

11. Monetary values must use decimal-safe parsing before conversion to minor units.

12. Currency mismatches must not be silently converted.

13. Null/missing external fields must not accidentally erase unrelated internal data.

14. Same Meta external ID must map to one canonical tenant entity.

15. Relationship history must be preserved when hierarchy changes.

16. Stale data must remain marked stale.

17. Unknown raw values must map to explicit UNKNOWN states where required.

18. External Meta data must never directly rewrite posted ledger entries.
```

---

# 157. Meta Data Mapping Golden Rule

> **Meta data should enter the system as normalized external facts, not as business conclusions. Meta IDs identify advertising assets, Meta status describes platform state, and Meta Insights describe reported advertising activity. Internal mappings then determine the client, job, fund owner and financial meaning without ever destroying the original external context.**
