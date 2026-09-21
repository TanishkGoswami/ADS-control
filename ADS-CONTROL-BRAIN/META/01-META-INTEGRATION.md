# Meta Integration

## Overview

Meta Integration system ka external advertising-platform integration layer hoga.

Iska primary purpose:

```text
Meta se operational data securely retrieve karna

Meta assets discover karna

Business Portfolios sync karna

Ad Accounts sync karna

Campaigns sync karna

Account status monitor karna

Spend / Insights retrieve karna

Permission / authentication health monitor karna

Internal entities ke saath Meta IDs map karna
```

V1 ka focus monitoring, accounting support aur reconciliation hai.

V1 ka primary purpose Meta Ads Manager ko completely replace karna nahi hai.

Core principle:

> **Meta Integration provides operational facts. It must never independently decide internal fund ownership, vendor liability, client balances or financial truth.**

---

# 1. Integration Boundary

System ke andar Meta integration ko ek independent bounded module treat kiya jayega.

Conceptually:

```text
Meta Platform
      ↓
Meta Integration Layer
      ↓
Normalized Meta Data
      ↓
Internal Business Mapping
      ↓
Financial / Reconciliation Layer
```

---

# 2. Meta Integration Responsibilities

Meta module responsible hoga:

```text
Authentication

Access Token Management

Business Asset Discovery

Ad Account Discovery

Campaign Discovery

Account Metadata Sync

Account Status Sync

Insights / Spend Sync

Pagination

Rate-Limit Handling

Retry Management

API Error Classification

Data Freshness

Sync Run Tracking

Meta-to-Internal ID Mapping
```

---

# 3. Meta Integration Is Not Responsible For

Meta module directly decide nahi karega:

```text
Client wallet balance

Vendor payable

Vendor receivable

Client fund ownership

Agency fund ownership

Refund approval

Client settlement

Vendor settlement

Ledger adjustment
```

Ye internal finance/business modules ka kaam hai.

---

# 4. Current API Version Strategy

Integration must always use explicit Meta API version.

Current project baseline:

```text
v26.0
```

as of September 2026.

But application code me API version central configuration ke through controlled honi chahiye.

Example:

```text
META_GRAPH_API_VERSION=v26.0
```

Hardcoded across dozens of files nahi.

Meta regularly releases versioned Graph/Marketing API changes, so upgrade process controlled hona chahiye.

---

# 5. Never Use Unversioned Calls

Avoid:

```text
https://graph.facebook.com/...
```

without explicit project version strategy.

Prefer conceptually:

```text
https://graph.facebook.com/{configured-version}/...
```

This provides predictable API behavior.

---

# 6. API Version Registry

Backend config:

```text
Meta API Version

Configured At

Upgrade Status

Last Compatibility Test
```

could later be tracked.

---

# 7. Version Upgrade Process

Before API version upgrade:

```text
Read Meta changelog

Review affected endpoints

Review removed/deprecated fields

Run integration tests

Test staging Meta assets

Verify permissions

Verify insights fields

Deploy

Monitor errors
```

---

# 8. Meta App

Integration requires a Meta App configured for the required Marketing API use cases.

Meta's official Marketing API resources require a Meta developer app, access token, appropriate permissions and access to relevant ad accounts.

Internal representation:

```text
Meta App
→ Authentication
→ Meta Connections
→ Accessible Business Assets
```

---

# 9. Meta Connection

Internal `MetaConnection` represents one authenticated Meta access context.

Example:

```text
Ads Pro

Ads Backup
```

A connection is not simply an Ad Account.

One connection can expose:

```text
Multiple Business Portfolios

Multiple Ad Accounts

Multiple Campaigns
```

---

# 10. Meta Connection Must Not Store Facebook Password

System must never request/store:

```text
Facebook Email Password

Facebook Profile Password
```

Authentication should use Meta-supported authorization/token flows.

---

# 11. Access Token Types

Meta Marketing API supports access-token-based API usage, including user and system-user based flows depending on the integration model.

System architecture should allow token metadata without exposing raw credentials.

---

# 12. Recommended Credential Architecture

Store:

```text
Token Secret
```

inside:

```text
Encrypted secret storage / backend-controlled encrypted storage
```

Database application record stores:

```text
Secret Reference

Token Type

Token Status

Last Validated At
```

---

# 13. Never Send Access Token to Frontend

Frontend:

```text
Browser
```

should never receive raw Meta access token.

Correct:

```text
Frontend
↓
NestJS Backend
↓
Meta API
```

---

# 14. Never Put Tokens in Logs

Avoid logging:

```text
access_token

authorization header

token query parameter
```

Logging middleware must redact them.

---

# 15. System User Integration

For server-to-server automated use cases involving Business-managed assets, Meta supports system users designed for software/server actions on managed business assets.

Where appropriate, this can be preferable for stable backend automation.

---

# 16. User Authentication Context

Some scenarios may require real user authorization.

Integration architecture should not assume every business/asset can always be handled through one universal system-user token.

Auth mode should be represented explicitly.

---

# 17. Meta Connection Authentication Mode

Possible:

```text
USER_TOKEN

SYSTEM_USER_TOKEN

OTHER_SUPPORTED_META_FLOW
```

Do not infer from token string.

---

# 18. Permission Strategy

Request only permissions actually needed.

V1 system mainly needs:

```text
Asset discovery

Ad Account read access

Campaign read access

Insights / spend read access

Business asset relationship access where required
```

The exact permission set depends on API endpoints, asset ownership and app access level.

Meta's official Marketing API collection notes that permission requirements vary by API/use case, and distinguishes access to owned vs other people's ad accounts.

---

# 19. Read-First V1 Strategy

Because V1 is monitoring/accounting focused:

Prefer:

```text
READ-ONLY META INTEGRATION
```

where possible.

Do not request campaign-management permissions only because they may be useful later.

---

# 20. Future Write Operations

Future versions may support:

```text
Pause Campaign

Create Campaign

Edit Budget

Create Ads
```

but these should be separate scope/product expansion.

---

# 21. Meta Permission Health

For every Meta Connection track:

```text
Permissions Expected

Permissions Available

Permission Check Time

Missing Permissions

Access Level State
```

---

# 22. Connection Status

Internal normalized states:

```text
ACTIVE

AUTH_REQUIRED

PERMISSION_ERROR

DISABLED

SYNC_ERROR

UNKNOWN
```

---

# 23. ACTIVE

Means:

```text
Authentication valid

Required access usable

Recent required sync successful
```

according to configured health rules.

---

# 24. AUTH_REQUIRED

Use when:

```text
Token invalid

Authorization expired

User reconnect required

Authentication challenge prevents API use
```

---

# 25. PERMISSION_ERROR

Authentication may still be valid but required resource access is missing.

Do not classify this automatically as token expiration.

---

# 26. SYNC_ERROR

Authentication may be valid but a sync process repeatedly fails for another reason.

---

# 27. UNKNOWN

Use when system cannot confidently determine connection health.

Do not incorrectly classify unknown as active.

---

# 28. Meta Asset Discovery Flow

Conceptual:

```text
Authenticate Connection
↓
Discover Accessible Business Assets
↓
Discover Ad Accounts
↓
Canonicalize IDs
↓
Store Relationships
↓
Sync Account Metadata
↓
Sync Campaigns
↓
Sync Insights
```

---

# 29. Asset Discovery Must Be Repeatable

Discovery is not one-time onboarding only.

Relationships may change later:

```text
New Ad Account added

Account shared

Account removed

Portfolio relationship changed

Permission removed
```

Periodic discovery required.

---

# 30. Business Portfolio Discovery

For each discovered portfolio store:

```text
Internal UUID

Meta Business ID

Name

First Seen

Last Seen

Source Connection

Relationship Type
```

---

# 31. Business Portfolio Identity

Never identify portfolio solely by:

```text
Business Name
```

Canonical external identity:

```text
meta_business_id
```

---

# 32. Ad Account Discovery

For every accessible Ad Account retrieve only required fields.

Conceptual fields:

```text
Ad Account ID

Name

Currency

Timezone

Status-related fields

Business/access relationship fields where available
```

---

# 33. Canonical Ad Account Identity

External:

```text
meta_ad_account_id
```

Internal:

```text
UUID
```

Display name is not identity.

---

# 34. Meta Ad Account ID Format

Meta commonly represents Ad Account API paths using an `act_` prefixed account identifier in Marketing API requests. Meta's official Postman material demonstrates AdAccount access through `act_{account_id}` style endpoints.

Internally store normalized external identifier consistently.

---

# 35. Account Visible Through Multiple Paths

Example:

```text
Ads Pro → BP1 → AD1

Ads Backup → BP2 → AD1
```

Do not create two `AdAccount` records.

Correct:

```text
One canonical AD1
+
Multiple MetaAssetRelationships
```

---

# 36. Meta Asset Relationship Types

Internal normalized:

```text
OWNED

SHARED

CLIENT_ACCESS

DISCOVERED

UNKNOWN
```

Raw Meta access/task data may also be retained separately.

---

# 37. Relationship Is Not Financial Ownership

Example:

```text
BP1 owns AD1
```

does not mean:

```text
BP1 financially owns all tracked funds in AD1
```

Meta asset relationship and fund ownership remain separate.

---

# 38. Account Metadata Sync

Recommended metadata sync:

```text
Name

Currency

Timezone

Status

Configured Status-related fields

First/Last Seen
```

Avoid syncing dozens of unused fields.

---

# 39. Field Whitelisting

Backend should explicitly request required fields.

Benefits:

```text
Smaller responses

Lower parsing complexity

Reduced dependency on unused fields

Clear version upgrade impact
```

---

# 40. Raw + Normalized Status

Store:

```text
raw_meta_status
```

and:

```text
normalized_status
```

separately.

Never discard raw source state.

---

# 41. Internal Account Status

Recommended normalized status:

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

# 42. Status Normalization Function

Conceptually:

```text
normalizeMetaAccountStatus(rawMetaFields)
```

Output:

```text
normalized_status

can_run_ads

reason

confidence
```

where applicable.

---

# 43. Status Mapping Must Be Version-Controlled

Do not scatter conditions throughout frontend/backend.

Use centralized:

```text
MetaAccountStatusMapper
```

with tests.

---

# 44. Unknown Raw Status

If Meta returns unexpected status:

```text
normalized_status = UNKNOWN
```

and preserve:

```text
raw_meta_status
```

Generate monitoring event if required.

---

# 45. Do Not Assume API Failure Means Restricted

If:

```text
Meta request timeout
```

then:

```text
SYNC_ERROR / STATUS_UNKNOWN
```

not:

```text
RESTRICTED
```

---

# 46. Do Not Assume Missing Account Means Deleted

One sync may fail to return asset because of:

```text
Permission issue

Pagination failure

Partial response

Connection error

Temporary access issue
```

Do not immediately archive/delete.

---

# 47. Missing Asset Detection

Only consider missing after:

```text
Complete successful discovery run

Pagination completed

Authentication valid

Required scope valid
```

and preferably grace/confirmation logic.

---

# 48. Access Lost

If previously known account repeatedly disappears from complete valid syncs or API confirms lack of access:

Internal status may become:

```text
ACCESS_LOST
```

Preserve historical record.

---

# 49. Archive vs Access Lost

```text
ACCESS_LOST
```

means system currently cannot access.

```text
ARCHIVED
```

means internal operational lifecycle decision.

Do not automatically equate them.

---

# 50. Campaign Sync

For V1 sync required campaign fields such as:

```text
Campaign ID

Name

Ad Account ID

Status

Effective Status where used

Created Time

Updated Time
```

Meta's official Marketing API tooling exposes campaign/ad-object retrieval and insights capabilities, but V1 should keep its field set minimal.

---

# 51. Campaign Identity

Canonical:

```text
meta_campaign_id
```

not campaign name.

---

# 52. Renamed Campaign

If:

```text
"Alpha Leads"
```

becomes:

```text
"Alpha Leads Sept"
```

same campaign ID means same entity.

Update name.

Do not create duplicate.

---

# 53. Campaign Archive

If campaign disappears temporarily:

Do not hard delete.

Maintain:

```text
Last Seen

Status

Archived At if confirmed
```

---

# 54. Ad Set and Ad Scope

V1 financial system may not require full local replication of:

```text
Ad Sets

Ads

Creatives
```

unless needed for reporting/diagnostics.

Recommended V1 primary local grain:

```text
Ad Account

Campaign
```

---

# 55. Expand Only When Needed

Future:

```text
Ad Set-level Spend

Ad-level Spend

Creative Performance
```

can be added without changing core Client Job concept.

---

# 56. Insights API

Meta's Insights API provides a consistent interface for retrieving advertising statistics and supports grouping/breakdowns and asynchronous processing for large result sets.

V1 key metric:

```text
spend
```

Additional operational metrics may later include:

```text
impressions

clicks

reach
```

if useful.

---

# 57. Financial System Should Keep Insights Scope Small

Do not ingest thousands of unused Meta metrics simply because available.

For V1 primary need:

```text
Spend

Entity IDs

Date

Currency Context
```

---

# 58. Spend Grain

Recommended:

```text
Campaign
+
Ad Account
+
Date
+
Currency
```

This supports:

```text
Client Job mapping

Daily reconciliation

Historical remapping
```

---

# 59. Daily Spend Facts

Prefer storing:

```text
Daily Spend
```

rather than only cumulative lifetime value.

Example:

```text
2026-09-15 ₹2,000
2026-09-16 ₹3,000
2026-09-17 ₹1,500
```

---

# 60. Why Daily Grain

Supports:

```text
Historical attribution

Late spend detection

Job completion checks

Period reporting

Backfills

Reconciliation
```

---

# 61. Ad Account Timezone

Daily Meta reporting boundaries should respect:

```text
Ad Account Timezone
```

not blindly server timezone.

---

# 62. Internal Timestamp Storage

Store timestamps in:

```text
UTC / timezone-aware TIMESTAMPTZ
```

Display to users in desired timezone.

But spend date remains interpreted according to Meta account reporting context.

---

# 63. Insights Pagination / Large Results

Meta list-style APIs can paginate, and Insights also supports asynchronous jobs for larger result sets.

Backend must support both small synchronous and scalable retrieval strategies.

---

# 64. Never Assume One API Page Is Complete

Collection endpoint:

```text
Page 1
```

may not equal full result set.

Sync must follow pagination until complete or intentionally bounded.

---

# 65. Pagination Checkpoint

For long syncs track:

```text
Cursor / continuation state

Records processed

Current page

Last successful checkpoint
```

where implementation allows.

---

# 66. Partial Pagination Failure

If page 1 and 2 succeed, page 3 fails:

Sync status:

```text
PARTIAL / FAILED
```

Do not mark missing page-3 assets deleted.

---

# 67. Full Sync

Full asset sync:

```text
Connection
↓
Portfolios
↓
Ad Accounts
↓
Campaigns
```

typically onboarding/nightly/recovery use.

---

# 68. Incremental Sync

Frequent sync should focus on changing data:

```text
Statuses

Recent Spend

Campaign Status

Freshness
```

---

# 69. Suggested Sync Classes

Initial:

```text
ASSET_DISCOVERY

ACCOUNT_METADATA

ACCOUNT_STATUS

CAMPAIGNS

SPEND_RECENT

SPEND_BACKFILL

TOKEN_HEALTH
```

---

# 70. Sync Frequency Is Configuration

Do not put fixed intervals into domain logic.

Example configurable:

```text
ACCOUNT_STATUS_SYNC_MINUTES

SPEND_SYNC_MINUTES

ASSET_DISCOVERY_INTERVAL

BACKFILL_WINDOW_DAYS
```

---

# 71. Initial Practical Frequency

Possible starting operational defaults:

```text
Account status:
~5 minutes

Spend:
~15–30 minutes

Asset discovery:
hourly / few times daily

Full reconciliation:
nightly
```

Final values depend on:

```text
Account volume

API limits

Business urgency

Failure rate
```

---

# 72. Avoid Per-Account Cron Explosion

Bad:

```text
500 Ad Accounts
=
500 independent cron jobs
```

Better:

```text
Scheduled dispatcher
↓
Batched queue jobs
↓
Rate-aware workers
```

---

# 73. Queue Architecture

Conceptually:

```text
Scheduler
↓
BullMQ
↓
Meta Sync Worker
↓
Meta API
↓
Normalization
↓
PostgreSQL
```

---

# 74. Worker Responsibilities

Worker should:

```text
Load connection securely

Validate connection state

Build versioned request

Call Meta

Handle pagination

Normalize data

Upsert canonical records

Write sync metadata

Emit downstream events

Handle retryable errors
```

---

# 75. Sync Run

Every substantial sync gets:

```text
Sync Run ID
```

Track:

```text
Type

Connection

Started At

Completed At

Status

Records Processed

Created

Updated

Errors

Completeness
```

---

# 76. Sync Status

Recommended:

```text
QUEUED

RUNNING

SUCCESS

PARTIAL

FAILED

CANCELLED
```

---

# 77. Sync Completeness

Separate:

```text
is_complete
```

from generic success status where useful.

A partially retrieved dataset must never be interpreted as full truth.

---

# 78. Upsert Strategy

External entities should be upserted using:

```text
organization_id
+
canonical Meta external ID
```

not display names.

---

# 79. Idempotent Sync

Running same sync twice should not duplicate:

```text
Business Portfolio

Ad Account

Campaign

Spend Fact
```

---

# 80. Spend Upsert

Recommended natural grain:

```text
organization_id

ad_account_id

campaign_id

spend_date

currency
```

Update latest observation for that grain or maintain versioning if required.

---

# 81. Historical Spend Revision

Meta may revise recent reporting.

System should allow recent SpendFact values to update while maintaining:

```text
Updated At

Source Sync Run

Previous audit/version if necessary
```

---

# 82. Spend Fact Is External Observation

SpendFact is not ledger transaction itself.

It becomes input to:

```text
Spend Attribution

Reconciliation

Financial resolution
```

---

# 83. Meta Spend Must Not Directly Debit Client Wallet

Bad:

```text
Meta API says ₹5,000 spend
→ immediately subtract arbitrary Client A wallet
```

Correct:

```text
Meta Spend
↓
Campaign Mapping
↓
Client Job
↓
Valid Allocation
↓
Spend Attribution
↓
Reconciliation
```

---

# 84. Campaign Mapping Dependency

Before financial attribution:

```text
Meta Campaign
```

must be linked to:

```text
Client Job
```

where relevant.

---

# 85. Unmapped Campaign Spend

If campaign has spend but no client mapping:

Create:

```text
UNATTRIBUTED_SPEND
```

Do not guess client based on account name.

---

# 86. Shared Ad Account

An Ad Account can contain multiple client jobs.

Therefore:

```text
Ad Account ID
```

alone is insufficient for client spend attribution.

Campaign mapping is critical.

---

# 87. Late Spend

Campaign marked internally completed but Meta later reports new spend.

System:

```text
Store Meta spend
↓
Detect post-completion spend
↓
Create alert/reconciliation
```

Do not drop late spend.

---

# 88. Status Change Event

When normalized account status changes:

```text
ACTIVE → RESTRICTED
```

create:

```text
AdAccountStatusHistory
```

and emit domain event.

---

# 89. Restriction Domain Event

Conceptually:

```text
META_AD_ACCOUNT_RESTRICTED
```

Downstream modules can:

```text
Create Alert

Review Allocations

Create Recovery Case

Lock eligible remaining funds
```

---

# 90. Meta Module Should Not Directly Guess Locked Amount

Meta integration says:

```text
Account Restricted
```

Finance/allocation layer determines:

```text
Which allocations remain?

Whose money?

How much should be locked?
```

---

# 91. Restore Event

When:

```text
RESTRICTED → ACTIVE
```

emit:

```text
META_AD_ACCOUNT_RESTORED
```

But do not automatically unlock funds before reconciliation.

---

# 92. Recovered Account Verification

Downstream process checks:

```text
Status Fresh?

Spend Fresh?

Relevant financial observation available?

Funds reconcile?
```

then unlocks valid funds.

---

# 93. API Error Categories

Normalize errors into categories:

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

# 94. Why Error Normalization

Frontend/business logic should not depend on changing raw Meta error text.

Preserve raw error for diagnostics.

Use normalized category for workflow.

---

# 95. Authentication Error Handling

On confirmed auth failure:

```text
MetaConnection → AUTH_REQUIRED
```

Stop wasteful retries until appropriate.

Create alert.

---

# 96. Permission Error Handling

If only one asset becomes inaccessible:

Do not necessarily mark whole connection auth-required.

Potential:

```text
Asset ACCESS_LOST

Connection ACTIVE/DEGRADED
```

depending on scope.

---

# 97. Rate-Limit Handling

Rate limiting should be treated as operational backpressure.

System should:

```text
Pause/reduce request rate

Retry later

Apply backoff

Preserve pending work

Avoid marking accounts restricted
```

---

# 98. Rate Limit Is Not Financial Failure

If API calls are throttled:

```text
Meta data becomes delayed/stale
```

not zero.

---

# 99. Retryable Errors

Examples:

```text
Timeout

Temporary network issue

Server error

Selected rate-limit conditions
```

Use bounded exponential backoff + jitter.

---

# 100. Non-Retryable Errors

Examples:

```text
Invalid request field

Unsupported permission

Invalid asset ID

Confirmed authorization issue
```

should not retry infinitely.

---

# 101. Retry Budget

Every job should have:

```text
Maximum attempts

Backoff strategy

Final failure state
```

After exhausted retries:

```text
SyncRun FAILED

Alert if required
```

---

# 102. Circuit Breaker

If Meta connection repeatedly fails:

temporarily reduce/stop calls for that connection.

Avoid:

```text
Thousands of doomed requests
```

---

# 103. Connection Health

Derived from:

```text
Auth Validity

Permission Health

Last Successful Sync

Failure Rate

Freshness
```

---

# 104. Data Freshness

Each independently synced domain tracks:

```text
last_successful_status_sync

last_successful_spend_sync

last_successful_campaign_sync

last_successful_asset_sync
```

---

# 105. Do Not Use One Global Freshness Timestamp

Example:

Account metadata sync succeeds.

Spend sync fails.

Correct:

```text
Status Fresh

Spend Stale
```

Not:

```text
Everything Fresh
```

---

# 106. Freshness States

Possible:

```text
FRESH

AGING

STALE

UNKNOWN
```

Thresholds configurable by data domain.

---

# 107. Stale Data Display

UI should show:

```text
Last known spend: ₹10,000

Last synced: 2h ago

Status: STALE
```

not:

```text
Spend: ₹0
```

---

# 108. Meta API Client

Backend should centralize HTTP/API access.

Conceptual:

```text
MetaApiClient
```

Responsibilities:

```text
Base URL

API Version

Authentication

Timeouts

Request IDs

Redaction

Retries

Error parsing

Response metadata
```

---

# 109. Domain Services

Separate:

```text
MetaConnectionService

MetaAssetDiscoveryService

MetaAdAccountService

MetaCampaignService

MetaInsightsService

MetaSyncService
```

Do not put all Meta logic in one giant service.

---

# 110. Meta Adapter Pattern

Recommended:

```text
Meta API Response
↓
Adapter / Mapper
↓
Internal DTO
↓
Domain Upsert
```

This isolates Meta schema changes.

---

# 111. Example Meta DTO

Conceptual:

```text
MetaAdAccountDTO {
  externalId
  name
  currency
  timezone
  rawStatus
}
```

Internal DB entity remains independent.

---

# 112. Raw Response Storage

Do not store every raw response forever by default.

Store:

```text
Normalized business fields

Useful diagnostics

Selected raw payload for errors/debugging
```

Avoid unnecessary sensitive data/storage growth.

---

# 113. Request Logging

Safe log:

```text
Meta endpoint category

Connection ID

Request duration

HTTP result class

Meta request/trace reference if available

Record count
```

Do not log access tokens.

---

# 114. Correlation IDs

Each request should include internal correlation context:

```text
request_id

sync_run_id

job_id

connection_id
```

Useful for debugging.

---

# 115. API Timeout

All outbound Meta calls need explicit timeout.

No worker should hang indefinitely.

---

# 116. Bulk/Batched Retrieval

Where supported and appropriate:

```text
Batch requests / wider account queries
```

can reduce network overhead.

But complexity should not compromise reliable pagination/retries.

---

# 117. Request Cost Awareness

Do not request:

```text
all campaigns
all metrics
all history
```

every five minutes.

Use incremental windows.

---

# 118. Spend Backfill Strategy

On onboarding:

```text
Historical backfill
```

for configured period.

Example:

```text
30 / 60 / 90 days
```

depending on business requirements.

Do not automatically import years of unused data.

---

# 119. Recent Spend Sync Strategy

Frequent:

```text
Today
+
Recent previous days
```

to catch revisions.

---

# 120. Historical Reconciliation Backfill

If a job/account issue discovered:

system should allow targeted sync:

```text
Ad Account

Campaign

Date Range
```

without full account re-import.

---

# 121. Manual Sync

Authorized user may request:

```text
Sync Account Now

Refresh Status

Refresh Spend

Refresh Campaigns
```

This should enqueue work.

Not make long API call directly in browser request if avoidable.

---

# 122. Manual Sync Rate Protection

Rapid button clicking must not generate duplicate expensive jobs.

Deduplicate:

```text
same connection
+
same sync type
+
same active time window
```

---

# 123. Sync Priority

Possible:

```text
HIGH:
Manual critical account refresh

NORMAL:
Scheduled status/spend

LOW:
Historical backfill
```

---

# 124. Account Onboarding Flow

```text
Create Meta Connection
↓
Validate Authentication
↓
Validate Required Permissions
↓
Discover Assets
↓
Canonicalize Portfolios
↓
Canonicalize Ad Accounts
↓
Save Relationships
↓
Sync Metadata
↓
Sync Campaigns
↓
Start Spend Backfill
↓
Run Initial Reconciliation
```

---

# 125. Reconnect Flow

When `AUTH_REQUIRED`:

```text
User/Admin Reauthorizes
↓
New Credential Stored
↓
Validate
↓
Refresh Permissions
↓
Asset Discovery
↓
Compare Access Changes
↓
Resume Sync
```

Do not create a brand-new duplicate connection unless intended.

---

# 126. Connection Disable

Internal user may disable connection.

Effect:

```text
Stop scheduled sync
```

Preserve:

```text
Assets

Spend history

Mappings

Financial history

Audit
```

---

# 127. Delete Connection

Hard deleting used connection should generally be forbidden.

Use:

```text
DISABLED / ARCHIVED
```

---

# 128. Asset Merge

If placeholder Ad Account existed before API verification:

```text
PENDING_VERIFICATION Account
```

and API later discovers matching Meta ID:

merge with canonical record carefully.

Do not duplicate financial history.

---

# 129. Orphan Meta Assets

If discovered account cannot be placed confidently in expected internal hierarchy:

mark:

```text
ORPHAN / UNRESOLVED RELATIONSHIP
```

rather than invent relation.

---

# 130. Meta Connection Security

Required controls:

```text
Encrypted tokens

Backend-only usage

Least privilege

Permission health checks

Audit connection changes

Secret rotation/reconnect support
```

---

# 131. Token Rotation

Architecture must support replacing token/credential without replacing all linked asset records.

Connection identity and credential are separate.

---

# 132. Permission Change Detection

Periodic or error-triggered check should detect:

```text
Permission removed

Asset task changed

Business access removed
```

Generate relevant issue.

---

# 133. Meta API App Review

If application accesses assets/data requiring reviewed permissions or advanced access, Meta app-review/business-access requirements may apply depending on use case. Meta's official API material distinguishes Standard and Advanced Access for different account-management scenarios.

Therefore permissions should be documented separately in:

```text
META/02-META-PERMISSIONS.md
```

---

# 134. Test Environment

Meta integration tests should separate:

```text
Unit Tests

Mock API Tests

Sandbox/Test Asset Tests where available

Controlled Real Asset Integration Tests
```

Do not use production ad accounts for destructive API tests.

---

# 135. V1 Read-Only Safety

V1 Meta API client should ideally not expose generic write methods like:

```text
POST campaign

DELETE ad
```

if application does not need them.

This reduces accidental operations.

---

# 136. Integration Feature Flag

Future write features can use:

```text
META_WRITE_OPERATIONS_ENABLED=false
```

default.

---

# 137. Webhooks

Where supported for relevant Meta products/events, webhooks may improve event detection.

But V1 should not assume webhooks cover every Marketing API change needed.

---

# 138. Webhook Principle

Webhook:

```text
Change Signal
```

not automatically complete canonical state.

Recommended:

```text
Webhook
↓
Validate event
↓
Queue targeted fetch
↓
Retrieve current state
↓
Normalize
```

---

# 139. Webhook Idempotency

Same webhook may arrive multiple times.

Use event/dedup strategy.

---

# 140. Polling Still Required

For critical:

```text
Status

Spend

Asset discovery

Reconciliation
```

periodic polling may still be required even when some webhooks are used.

---

# 141. Meta Data Is External Observation

Database should clearly tag source:

```text
META_API
```

and timestamps.

---

# 142. Meta vs Business Truth Example

Meta:

```text
Campaign X spent ₹10,000
```

Internal mapping:

```text
Campaign X → Client A JOB-001
```

Allocation:

```text
Client A funded ₹8,000
```

Result:

```text
Spend ₹10,000

Attributed/covered ₹8,000

Funding Gap ₹2,000
```

Do not force them to match by editing Meta data.

---

# 143. Meta vs Ledger Example

Meta platform:

```text
Account operational spend = ₹50,000
```

Ledger/business records:

```text
Known allocated/recognized = ₹48,000
```

System:

```text
Difference ₹2,000
→ Reconciliation
```

---

# 144. Meta Data Never Deletes Ledger

If Meta access disappears:

```text
Ledger remains unchanged
```

because financial history is independent.

---

# 145. Meta Data Never Deletes Client Mapping History

If campaign removed:

historical mapping remains for historical spend.

---

# 146. API Upgrade Safety

Before changing configured version:

Run automated regression covering:

```text
Connection validation

Business discovery

Ad Account fetch

Campaign fetch

Insights/spend

Pagination

Error handling

Status mapping
```

---

# 147. Version Deprecation Monitoring

Admin/system should maintain:

```text
Current API Version

Known Deprecation / Upgrade Date

Upgrade Required Status
```

where practical.

---

# 148. Meta Integration Dashboard

Admin view may show:

```text
Connection

Status

Permissions

Portfolios

Ad Accounts

Last Asset Sync

Last Status Sync

Last Spend Sync

Recent Errors
```

---

# 149. Meta Connection Detail Tabs

Recommended:

```text
Overview

Assets

Permissions

Sync History

Errors

Audit
```

---

# 150. Ad Account Meta Detail

Display:

```text
Meta Ad Account ID

Name

Internal Alias

Portfolio Relationships

Currency

Timezone

Raw Status

Normalized Status

Last Status Sync

Last Spend Sync
```

Financial data comes from separate module.

---

# 151. Sync Error UI

Show:

```text
Sync Run

Connection

Type

Error Category

Affected Asset

Retryable?

First Seen

Last Seen
```

Do not expose secret/token content.

---

# 152. Meta Alert Integration

Meta layer can trigger:

```text
META_AUTH_REQUIRED

META_PERMISSION_ERROR

META_SYNC_FAILED

META_DATA_STALE

AD_ACCOUNT_RESTRICTED

AD_ACCOUNT_ACCESS_LOST
```

---

# 153. Alert Deduplication

Repeated sync failure should update active alert rather than create hundreds.

---

# 154. Connection-Wide Failure

If one connection breaks and affects 200 accounts:

Prefer:

```text
Parent Connection Alert
```

instead of 200 identical authentication alerts.

Affected accounts can be linked.

---

# 155. Account-Specific Failure

If only one Ad Account becomes restricted:

Create account-specific alert.

---

# 156. Metrics / Observability

Monitor:

```text
API request count

Success rate

Error rate

Rate-limit events

Latency

Records synced

Stale assets

Queue age

Retries
```

---

# 157. Sentry / Logging

Unexpected exceptions should include:

```text
Connection Internal ID

Sync Run ID

Job ID

Endpoint Category
```

Never token.

---

# 158. Health Checks

Meta integration health should answer:

```text
Can backend reach Meta?

Are workers processing?

Are connections authenticated?

Is data fresh?

Are API errors increasing?
```

---

# 159. Graceful Degradation

If Meta unavailable:

Internal application must still allow:

```text
View existing clients

View vendors

View ledger

View historical reports

View last known Meta data
```

with stale indicators.

---

# 160. Meta Outage Must Not Stop Finance

Vendor settlement/client payment workflows should not depend on live Meta API unless specific validation requires it.

---

# 161. Financial Posting Must Not Depend on UI Meta Status

Backend should use stored validated state plus business rules.

No financial transaction should trust a frontend-supplied:

```text
account_status = active
```

without server-side validation.

---

# 162. Meta IDs Are Strings

Store external IDs as:

```text
TEXT / VARCHAR
```

not integer assumptions.

---

# 163. Do Not Parse Meaning From IDs

Never infer:

```text
Portfolio

Client

Account Type
```

from Meta ID numeric patterns.

IDs are identifiers only.

---

# 164. Account Name Is Mutable

Safe:

```text
meta_ad_account_id = identity

name = mutable attribute
```

---

# 165. Internal Alias

Users can assign:

```text
AD1
AD2
Scaling-01
Backup-03
```

Alias is internal convenience.

Meta rename does not need to change internal alias.

---

# 166. Source Tracking

Every synced record should ideally know:

```text
source_type = META_API

last_sync_run_id

fetched_at
```

---

# 167. Data Conflict Handling

If internal user alias says:

```text
Scaling 01
```

and Meta name:

```text
New Campaign Account
```

keep both.

Do not treat conflict as error.

---

# 168. Meta Relationship Conflict

If two valid connections expose same account under different businesses:

Store both relationships.

Do not pick one arbitrarily.

---

# 169. Meta Status Conflict

If multiple observations disagree because timing differs:

Latest valid source observation wins current raw status.

History retains earlier state.

---

# 170. Out-of-Order Sync

Old worker completes after newer worker.

Backend must prevent older observation from overwriting newer state.

Use:

```text
source_updated_at

sync_started_at

fetched_at
```

ordering rules.

---

# 171. Sync Locks

Avoid two identical high-impact syncs writing same resource concurrently.

Can use:

```text
Redis distributed lock

DB advisory lock

Queue dedup
```

depending on case.

---

# 172. Full Sync Atomicity

Do not require entire large Meta sync in one huge DB transaction.

Prefer:

```text
Safe idempotent chunk upserts
+
Sync run completeness marker
```

---

# 173. Financial Atomicity Remains Separate

Meta syncing can be eventually consistent.

Ledger posting cannot.

Do not apply the same transaction model to both.

---

# 174. V1 Meta Integration Scope

Required:

```text
Meta Connection

Authentication health

Business Portfolio discovery

Ad Account discovery

Ad Account metadata

Ad Account status

Campaign discovery

Spend/Insights sync

Pagination

Sync history

Retry/error normalization

Freshness monitoring

Manual refresh

Alerts
```

---

# 175. V1 Out of Scope

Initially:

```text
Campaign creation

Ad Set creation

Ad creation

Creative upload

Automated budget changes

Automated campaign optimization

Autonomous pause/resume

Audience management
```

---

# 176. Future Scope

Possible:

```text
Campaign management

Ad Set management

Ads management

Budget controls

Rule-based pause/resume

Creative performance

Automated operational actions
```

These require additional Meta permissions, approval rules and safety boundaries.

---

# 177. Recommended Backend Folder Concept

```text
meta/
├── meta.module
├── connections/
├── auth/
├── businesses/
├── ad-accounts/
├── campaigns/
├── insights/
├── sync/
├── workers/
├── mappers/
├── errors/
└── events/
```

Exact code structure defined later in TECH docs.

---

# 178. Recommended Meta Domain Events

```text
META_CONNECTION_AUTH_FAILED

META_CONNECTION_RESTORED

META_PERMISSION_CHANGED

META_ASSET_DISCOVERED

META_ASSET_ACCESS_LOST

META_AD_ACCOUNT_STATUS_CHANGED

META_AD_ACCOUNT_RESTRICTED

META_AD_ACCOUNT_RESTORED

META_SPEND_UPDATED

META_SYNC_FAILED

META_SYNC_RECOVERED
```

---

# 179. Domain Events Do Not Directly Mutate Ledger

Example:

```text
META_AD_ACCOUNT_RESTRICTED
```

should invoke business workflow.

It must not directly:

```text
Delete balance

Create loss

Transfer owner
```

---

# 180. Meta Integration Integrity Rules

System must enforce:

```text
1. Meta credentials must never be exposed to frontend.

2. Facebook passwords must never be stored.

3. Every API request must use a controlled explicit API version.

4. External IDs, not names, determine Meta entity identity.

5. Same Meta Ad Account must not be duplicated because it appears through multiple connections or portfolios.

6. Meta hierarchy and financial ownership must remain separate.

7. Raw Meta status must be preserved alongside normalized status.

8. API failure must not be interpreted as account restriction.

9. Missing asset in incomplete sync must not be treated as deletion.

10. Stale Meta values must remain marked stale rather than replaced by zero.

11. Spend must be stored as external operational observation before internal attribution.

12. Meta spend must not directly modify arbitrary client balances.

13. Historical campaign/account mappings must be preserved.

14. Meta data must never overwrite posted ledger truth.

15. Meta status changes must be historically traceable.

16. Pagination must be fully handled before declaring asset discovery complete.

17. Sync jobs must be retry-safe and idempotent.

18. Older syncs must not overwrite newer source state.

19. External errors must be normalized without discarding raw diagnostics.

20. Meta outages must degrade monitoring, not corrupt internal financial data.
```

---

# 181. Meta Integration Golden Rule

> **Meta is an external operational system, not the internal financial source of truth. The integration must securely retrieve, normalize and preserve Meta facts while maintaining stable identities, freshness, history and error context. Those facts can trigger business workflows and reconciliation, but they must never silently determine whose money it is, erase internal history or rewrite the financial ledger.**
