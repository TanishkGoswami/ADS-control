# Meta Sync Flow

## Overview

Ye document define karta hai ki Meta se data system ke andar reliably, repeatedly aur safely kaise synchronize hoga.

Sync layer ka purpose sirf API call karna nahi hai.

Isko ensure karna hai:

```text
Correct assets discovered hon

Duplicate entities create na hon

Pagination complete ho

Recent spend refresh hota rahe

Historical spend revisions capture hon

Status changes detect hon

Failed sync financial truth ko corrupt na kare

Old sync newer data overwrite na kare

Stale data clearly visible rahe

Reconciliation correct inputs use kare
```

Core principle:

> **Meta synchronization is eventually consistent and retryable. Financial posting is not. Meta sync failures may make external data stale, but they must never corrupt internal ledger, ownership or historical records.**

---

# 1. Sync Architecture

Recommended flow:

```text
Scheduler / User Trigger / Domain Event
                ↓
           Sync Dispatcher
                ↓
             BullMQ
                ↓
          Meta Sync Worker
                ↓
          Meta API Client
                ↓
        Pagination / Async Job
                ↓
             Mapper
                ↓
          Domain Upsert
                ↓
          PostgreSQL
                ↓
       Downstream Events
                ↓
   Alerts / Reconciliation
```

---

# 2. Sync Is Server-Side

Meta synchronization must run through:

```text
NestJS Backend
+
Queue Workers
```

not directly from browser.

Frontend should never:

```text
Call Meta API using raw token

Handle pagination

Poll async Insights report directly

Store Meta credentials
```

---

# 3. Main Sync Types

Recommended V1 sync types:

```text
TOKEN_HEALTH

PERMISSION_HEALTH

ASSET_DISCOVERY

BUSINESS_PORTFOLIOS

AD_ACCOUNTS

AD_ACCOUNT_STATUS

CAMPAIGNS

SPEND_RECENT

SPEND_BACKFILL

TARGETED_ACCOUNT_REFRESH

FULL_CONNECTION_SYNC
```

---

# 4. TOKEN_HEALTH

Purpose:

Verify connection can still authenticate.

Output:

```text
Connection Healthy

AUTH_REQUIRED

UNKNOWN
```

No financial data changes.

---

# 5. PERMISSION_HEALTH

Checks whether connection currently retains required Meta capabilities.

Possible outputs:

```text
HEALTHY

DEGRADED

BLOCKED

UNKNOWN
```

---

# 6. ASSET_DISCOVERY

Discovers currently accessible Meta hierarchy.

Conceptually:

```text
Meta Connection
↓
Business Portfolios
↓
Ad Accounts
```

Purpose:

```text
Discover new assets

Refresh relationships

Detect access changes

Update last_seen_at
```

---

# 7. AD_ACCOUNT_STATUS

Focused lightweight sync for operational health.

Retrieves only fields necessary for:

```text
Account status

Can-run-ads determination

Relevant metadata

Freshness
```

---

# 8. CAMPAIGNS

Sync current/relevant campaigns under accessible Ad Accounts.

Purpose:

```text
Campaign discovery

Status updates

Historical campaign mapping support

Spend attribution
```

---

# 9. SPEND_RECENT

Frequent Insights sync covering recent date range.

Example starting strategy:

```text
Today
+
Previous few days
```

because Meta may revise recent reporting.

---

# 10. SPEND_BACKFILL

Historical synchronization.

Used:

```text
During onboarding

When account imported

When missing history discovered

When reconciliation requires older period

After long sync outage
```

---

# 11. FULL_CONNECTION_SYNC

Orchestrated parent workflow:

```text
Connection Health
↓
Permissions
↓
Business Discovery
↓
Ad Accounts
↓
Statuses
↓
Campaigns
↓
Recent Spend
↓
Backfill if required
↓
Reconciliation
```

---

# 12. Sync Trigger Types

A sync can begin from:

```text
SCHEDULED

MANUAL

ONBOARDING

RECONNECT

RETRY

DOMAIN_EVENT

RECONCILIATION

BACKFILL
```

Store trigger type for audit/monitoring.

---

# 13. Scheduled Sync

Periodic jobs maintain freshness.

Examples:

```text
Account Status

Recent Spend

Asset Discovery

Permission Health
```

---

# 14. Manual Sync

Authorized user may click:

```text
Refresh Status

Refresh Spend

Sync Account

Sync Connection
```

Frontend should enqueue job.

Response:

```text
Sync Queued
```

with Sync Run reference.

---

# 15. Manual Sync Should Not Block HTTP

Avoid:

```text
Browser request waits 90 seconds for Meta
```

Recommended:

```text
POST /sync
→ 202 Accepted
→ Sync Run ID
```

Frontend observes progress separately.

---

# 16. Onboarding Sync

When new Meta connection added:

```text
Create Connection
↓
Validate Authentication
↓
Validate Permissions
↓
Create Sync Run
↓
Discover Business Portfolios
↓
Discover Ad Accounts
↓
Canonicalize Assets
↓
Save Relationships
↓
Fetch Account Metadata
↓
Fetch Account Status
↓
Fetch Campaigns
↓
Recent Spend
↓
Historical Backfill
↓
Initial Reconciliation
```

---

# 17. Connection Activation

Do not mark connection fully healthy merely because token was accepted.

Recommended activation requirement:

```text
Authentication valid
+
Required permissions valid
+
Required asset read test successful
```

---

# 18. Initial Historical Backfill

Configurable:

```text
30 Days

60 Days

90 Days
```

depending on project requirements.

Do not automatically download lifetime Insights for every account.

---

# 19. Backfill Configuration

Example:

```text
META_INITIAL_BACKFILL_DAYS=60
```

This should be configuration, not hardcoded domain rule.

---

# 20. Sync Run Entity

Every logical sync operation should have durable:

```text
SyncRun
```

Example fields:

```text
id

organization_id

meta_connection_id

sync_type

trigger_type

status

started_at

completed_at

records_processed

records_created

records_updated

error_count

is_complete

metadata
```

---

# 21. Sync Run Status

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

# 22. QUEUED

Job exists but processing has not started.

---

# 23. RUNNING

Worker actively processing.

---

# 24. SUCCESS

Requested sync scope completed successfully.

Important:

```text
SUCCESS
```

must mean required pagination/jobs also completed.

---

# 25. PARTIAL

Use when some data was retrieved but requested scope did not fully complete.

Example:

```text
Business pages completed

Ad Account page 1 completed

Ad Account page 2 failed
```

---

# 26. FAILED

No trustworthy complete result for required operation.

Previously stored data remains.

---

# 27. CANCELLED

Job intentionally stopped before completion.

Must not imply latest data is complete.

---

# 28. Sync Completeness

Use separate:

```text
is_complete
```

or:

```text
completeness_status
```

Possible:

```text
COMPLETE

PARTIAL

FAILED
```

This matters for missing-asset detection.

---

# 29. Why Completeness Matters

Suppose previous system knows:

```text
AD1
AD2
AD3
```

Current sync returns:

```text
AD1
AD2
```

If pagination failed before AD3 page:

system must not conclude:

```text
AD3 access lost
```

---

# 30. Missing Asset Detection Rule

Only evaluate missing assets after:

```text
Authentication valid

Permission valid

All requested pages processed

Sync COMPLETE
```

---

# 31. Missing Once Is Not Deletion

Even complete sync may require confirmation/grace policy before operational access-loss state.

Possible:

```text
Missing Episode 1
→ SUSPECTED_ACCESS_CHANGE

Confirmed in next valid discovery
→ ACCESS_LOST
```

depending on desired conservatism.

---

# 32. Asset Hard Delete

Never hard-delete previously synchronized Meta asset because it disappears.

Use:

```text
ACCESS_LOST

ARCHIVED

INACTIVE
```

with history.

---

# 33. Pagination

Meta collection endpoints can return paginated responses with continuation information such as `next`.

Sync worker must keep fetching until:

```text
No next page
```

or:

```text
Configured intentional boundary reached
```

---

# 34. Pagination Loop

Conceptual:

```text
Fetch Page
↓
Validate Response
↓
Map Records
↓
Upsert Chunk
↓
Record Progress
↓
Has Next?
├── YES → Fetch Next
└── NO  → Mark Complete
```

---

# 35. Never Assume First Page Is Full Result

Invalid:

```text
GET campaigns
↓
Process first 100
↓
SUCCESS
```

if more pages exist.

---

# 36. Pagination Progress

Sync metadata may track:

```text
pages_processed

records_processed

last_cursor

last_successful_page
```

for diagnostics.

---

# 37. Cursor Security

Do not expose sensitive continuation URL containing credentials.

Store only safe cursor/state where required.

---

# 38. Pagination Failure

If page N fails:

Previous pages may remain safely upserted.

Sync:

```text
PARTIAL
```

Do not perform missing-record/archive decisions.

---

# 39. Chunked Database Writes

Do not wait until thousands of records are in memory.

Use safe chunks:

```text
Fetch Page
→ Normalize
→ Upsert
→ Continue
```

---

# 40. Large Insights Queries

Large Insights datasets can use Meta asynchronous reporting jobs.

Recommended when:

```text
Long date range

High-granularity level

Many accounts/campaigns

Large breakdown result
```

---

# 41. Insights Sync Mode

Two possible modes:

```text
SYNC_INSIGHTS

ASYNC_INSIGHTS
```

Backend decides based on expected workload.

---

# 42. Synchronous Insights

Useful for:

```text
Small date window

Single account

Campaign-level recent spend

Manual small refresh
```

---

# 43. Async Insights

Recommended for:

```text
Large historical backfill

Heavy reporting

Large result set
```

Flow:

```text
Submit Insights Job
↓
Receive Report Job ID
↓
Persist Job ID
↓
Poll Status
↓
When Complete
Fetch Result
↓
Handle Pagination
↓
Normalize
↓
Upsert
```

---

# 44. Async Report Must Survive Worker Restart

Do not keep report ID only in process memory.

Persist:

```text
Meta Async Report ID

Sync Run ID

Status

Submitted At
```

so another worker can resume polling.

---

# 45. Async Polling

Use queue-delayed retries.

Avoid:

```text
while(true) {
  poll every second
}
```

Better:

```text
Poll
↓
Not ready
↓
Requeue after delay
```

---

# 46. Async Timeout

If report never completes within policy:

```text
Sync FAILED/PARTIAL
```

with diagnostic error.

Do not poll indefinitely.

---

# 47. Insights Date Grain

V1 preferred:

```text
time_increment = daily
```

conceptually, producing daily spend facts.

---

# 48. Recent Spend Window

Recommended configurable starting example:

```text
Today - 3 days
through
Today
```

or broader depending on observed Meta revisions.

Do not rely only on today.

---

# 49. Why Re-fetch Recent Days

External reporting may update after initial observation.

Re-fetching recent dates allows:

```text
Late spend

Corrections

Attribution/report updates
```

to appear.

---

# 50. Spend Upsert

Spend fact natural key identifies same observation grain.

When new Meta observation arrives:

```text
Existing:
₹1,000

New:
₹1,050
```

update external SpendFact:

```text
₹1,050
```

with new provenance.

---

# 51. Spend Update Is Not Ledger Rewrite

If internal financial settlement was already based on ₹1,000:

difference:

```text
₹50
```

goes to:

```text
Reconciliation
```

Do not modify posted ledger silently.

---

# 52. Spend Sync Date Context

Use Meta account/report timezone semantics.

Do not generate spend date based on:

```text
Worker UTC date
```

alone.

---

# 53. Campaign Sync Scope

Possible strategies:

```text
All non-archived/recent campaigns

Campaigns updated recently

Campaigns related to active client jobs
```

V1 can start broader and optimize later.

---

# 54. Archived Campaign Preservation

If campaign no longer returned in active query:

do not delete.

Historical spend mapping may depend on it.

---

# 55. Targeted Campaign Fetch

If Insights row references unknown campaign:

queue:

```text
TARGETED_CAMPAIGN_FETCH
```

before declaring permanent unmapped external entity.

---

# 56. Unknown Ad Account Reference

If campaign/spend references unknown Ad Account:

queue targeted parent fetch.

If still unresolved:

create Sync Error / unresolved entity.

---

# 57. Full Asset Discovery

Recommended less frequent than status/spend.

Example initial operating strategy:

```text
A few times per day
or hourly depending on scale
```

because hierarchy usually changes less frequently.

---

# 58. Status Sync

Can run more frequently.

Starting example:

```text
Every ~5 minutes
```

for active/relevant accounts.

Exact cadence configurable.

---

# 59. Spend Sync

Starting example:

```text
Every ~15–30 minutes
```

depending on:

```text
Number of accounts

API capacity

Operational need

Queue load
```

---

# 60. Nightly Work

Recommended:

```text
Full/extended recent spend refresh

Asset verification

Reconciliation

Snapshots

Stale-data audit
```

---

# 61. Adaptive Sync Frequency

Not every account needs identical cadence forever.

Future:

```text
Active spend account → frequent

Inactive archived account → less frequent

Restricted account → status frequent, spend targeted

High-value account → priority
```

---

# 62. Scheduler Architecture

Recommended:

```text
One Scheduler
↓
Find Due Connections/Accounts
↓
Generate Queue Jobs
```

rather than individual OS cron per account.

---

# 63. Queue Job Granularity

Possible:

```text
Connection Asset Discovery Job

Ad Account Status Batch Job

Ad Account Spend Job

Campaign Sync Job

Backfill Job
```

---

# 64. Avoid Giant Monolithic Job

Bad:

```text
Sync all 500 accounts
in one worker job
```

One failure can block everything.

Use manageable units/batches.

---

# 65. Avoid Extremely Tiny Job Explosion

Also avoid:

```text
one HTTP request = one queue job
```

for every trivial page where overhead becomes huge.

Balance batching.

---

# 66. Job Priority

Recommended:

```text
CRITICAL

HIGH

NORMAL

LOW
```

Examples:

```text
Manual restricted-account refresh
→ HIGH

Scheduled active-account status
→ NORMAL

90-day historical backfill
→ LOW
```

---

# 67. Queue Deduplication

Avoid duplicate active work.

Key example:

```text
meta-sync:
connection-id:
sync-type:
scope
```

If same recent sync already running, new request may:

```text
Return existing Sync Run
```

or queue next only when necessary.

---

# 68. Manual Refresh Deduplication

User clicks button 10 times.

Expected:

```text
1 active sync
```

not 10 identical Meta requests.

---

# 69. Idempotent Upserts

Even if queue delivers job twice:

database result should remain correct.

Use canonical IDs and natural keys.

---

# 70. Retry Strategy

Retry only appropriate errors.

Recommended:

```text
Attempt
↓
Classify Error
↓
Retryable?
├── YES → Backoff + Retry
└── NO  → Fail / Require Action
```

---

# 71. Retryable Errors

Typically include classes like:

```text
NETWORK_ERROR

TRANSIENT_ERROR

Selected SERVER_ERROR

Selected RATE_LIMIT conditions
```

---

# 72. Non-Retryable Errors

Typically:

```text
Invalid request

Unsupported field

Confirmed permission failure

Confirmed invalid token

Malformed parameter
```

until configuration/auth changes.

---

# 73. Exponential Backoff

Conceptual:

```text
Retry 1
short delay

Retry 2
longer delay

Retry 3
longer delay
```

plus jitter.

Do not hammer Meta continuously.

---

# 74. Maximum Attempts

Every queue job needs bounded:

```text
max_attempts
```

After limit:

```text
FAILED
```

and alert where required.

---

# 75. Rate-Limit Handling

System should detect Meta usage/rate-limit responses and reduce pressure.

Actions:

```text
Delay low-priority jobs

Reduce concurrency

Backoff retries

Preserve queue

Prioritize critical refreshes
```

---

# 76. No Zeroing During Throttle

If rate-limited:

```text
Existing spend/status remains
```

with stale freshness if threshold exceeded.

---

# 77. Worker Concurrency

Configure separate limits for:

```text
Meta requests

Database writes

Backfills
```

Do not set concurrency solely based on VPS CPU.

External API capacity matters.

---

# 78. Per-Connection Concurrency

Avoid flooding one Meta connection with too many parallel expensive requests.

Possible control:

```text
Connection-level semaphore
```

---

# 79. Global Concurrency

Also maintain global outbound limit.

---

# 80. Circuit Breaker

Repeated connection-wide auth failures:

```text
Open Circuit
```

temporarily stop scheduled Meta work for that connection.

---

# 81. Circuit Breaker Example

```text
10 auth failures
↓
Connection AUTH_REQUIRED
↓
Pause normal sync
↓
Await reconnect
```

Avoid endless queue retries.

---

# 82. Auth Failure Handling

Confirmed invalid authorization:

```text
Connection → AUTH_REQUIRED

Dependent jobs → blocked/cancelled

Alert → META_AUTH_REQUIRED
```

Previously synchronized records remain.

---

# 83. Permission Failure

If permission missing globally:

```text
Connection → DEGRADED/BLOCKED
```

depending on capability impact.

---

# 84. Asset-Specific Access Failure

If:

```text
AD1 works

AD2 access denied
```

do not mark entire connection invalid automatically.

Update:

```text
AD2 access health
```

and investigate relationship/access.

---

# 85. Sync Error Entity

Store:

```text
sync_run_id

entity_type

external_entity_id

error_code

error_category

message

retryable

created_at
```

---

# 86. Error Redaction

Sync errors must never store:

```text
Access token

App secret

Authorization headers
```

---

# 87. Raw Meta Error

Preserve safe:

```text
error code

subcode

message

trace/reference
```

for debugging.

---

# 88. Data Freshness

Every independently synced data area tracks freshness.

Examples:

```text
Account Status Freshness

Campaign Freshness

Spend Freshness

Asset Discovery Freshness
```

---

# 89. Freshness Timestamps

Recommended:

```text
last_successful_asset_sync_at

last_successful_status_sync_at

last_successful_campaign_sync_at

last_successful_spend_sync_at
```

---

# 90. Freshness State

Derived:

```text
FRESH

AGING

STALE

UNKNOWN
```

---

# 91. Freshness Configuration

Example:

```text
Status stale after:
15 minutes

Spend stale after:
60 minutes
```

Values are business configuration.

---

# 92. Unknown vs Stale

`UNKNOWN`:

```text
No reliable observation exists
```

`STALE`:

```text
Reliable previous observation exists,
but it is too old
```

---

# 93. Last-Known Data Rule

When sync fails:

retain:

```text
Last Known Value
+
Last Successful Sync
+
Freshness State
```

Never replace with zero/null merely due failure.

---

# 94. Example

Before failure:

```text
Spend:
₹50,000

Last sync:
13:00
```

At 16:00 sync still failing.

Show:

```text
₹50,000
STALE
Last successful sync 13:00
```

not:

```text
₹0
```

---

# 95. Out-of-Order Worker Problem

Example:

```text
Sync A starts 10:00

Sync B starts 10:05

Sync B completes 10:06

Sync A completes 10:10
```

Sync A must not overwrite newer B state.

---

# 96. Ordering Metadata

Use:

```text
source_updated_at

fetched_at

sync_started_at

sync sequence
```

where appropriate.

---

# 97. Current-State Write Rule

Before update:

```text
Incoming observation newer than stored source observation?
```

If not:

skip current-state overwrite.

Historical/provenance data can still record run.

---

# 98. Spend Out-of-Order

If same SpendFact natural key:

Newer sync result should determine current external observation.

Older job completing later must not restore old amount.

---

# 99. Status Out-of-Order

Same principle for account status.

---

# 100. Relationship Out-of-Order

Hierarchy discovery is trickier.

Only complete valid runs should close previously current relationships.

---

# 101. Effective Relationship Update

If complete discovery confirms relationship change:

```text
Old relationship
effective_to = discovery time

New relationship
effective_from = discovery time
```

---

# 102. Partial Sync Must Not Close Relationship

Critical rule.

---

# 103. New Asset Discovery

When new external ID appears:

```text
Find canonical entity
↓
Not found
↓
Create canonical entity
↓
Create relationship
↓
Set first_seen_at
↓
Queue metadata/status/campaign sync
↓
Audit
```

---

# 104. Existing Asset Discovery

```text
Find canonical entity
↓
Update last_seen_at
↓
Patch returned metadata
↓
Refresh relationship
```

---

# 105. Renamed Asset

Same external ID, new name:

```text
Update mutable name
```

Do not create new entity.

---

# 106. Asset Relationship Change

Canonical entity unchanged.

Only relationship history changes.

---

# 107. Asset Access Lost

After validated rule:

```text
AdAccount.access_state
→ ACCESS_LOST
```

Historical:

```text
Spend

Mappings

Allocations

Ledger

Status History
```

remain.

---

# 108. Re-access

If account later becomes accessible again:

Reuse canonical entity.

Create new relationship/access episode.

Do not duplicate.

---

# 109. Status Change Processing

Flow:

```text
Fetch status
↓
Normalize
↓
Compare current normalized status
↓
Changed?
├── NO → Update freshness
└── YES
    ↓
Create Status History
    ↓
Update Current State
    ↓
Emit Domain Event
```

---

# 110. Restricted Event

If:

```text
ACTIVE → RESTRICTED
```

emit:

```text
META_AD_ACCOUNT_RESTRICTED
```

---

# 111. Restriction Downstream Flow

Event consumers may:

```text
Create/Update Alert

Create Restriction Episode

Inspect unspent allocations

Create Locked Fund records

Create Recovery Case

Notify Ads/Finance
```

Meta sync itself does not decide ownership.

---

# 112. Restore Event

If:

```text
RESTRICTED → ACTIVE
```

emit:

```text
META_AD_ACCOUNT_RESTORED
```

---

# 113. Restore Does Not Auto-Unlock

Downstream:

```text
Refresh spend/balance observations
↓
Reconcile
↓
Verify remaining fund
↓
Unlock valid amount
```

---

# 114. Status Unknown

If API fails:

do not create:

```text
ACTIVE → RESTRICTED
```

Instead:

```text
Freshness → STALE/UNKNOWN
```

---

# 115. Spend Sync Flow

Recommended:

```text
Select Ad Account
↓
Determine Date Window
↓
Choose Sync vs Async Insights
↓
Request Campaign-Level Daily Spend
↓
Handle Pagination
↓
Map Rows
↓
Resolve Account/Campaign IDs
↓
Upsert Spend Facts
↓
Record Changed Facts
↓
Queue Spend Attribution
↓
Queue Reconciliation
```

---

# 116. Spend Change Detection

Track whether incoming row:

```text
New

Unchanged

Changed
```

Only changed/new data needs downstream recalculation.

---

# 117. Spend Attribution Trigger

On SpendFact creation/change:

```text
SPEND_FACT_UPDATED
```

event.

Consumer:

```text
Spend Attribution Service
```

---

# 118. Attribution Recalculation Scope

Only affected:

```text
Campaign

Date

Account
```

rather than rebuilding all history.

---

# 119. Spend Attribution Result

Possible:

```text
FULLY_ATTRIBUTED

PARTIALLY_ATTRIBUTED

UNATTRIBUTED

AMBIGUOUS
```

---

# 120. Reconciliation Trigger

After attribution:

```text
Reconcile affected Client

Reconcile affected Job

Reconcile affected Ad Account
```

---

# 121. Late Spend Detection

If SpendFact date relates to job/campaign already operationally completed:

check:

```text
New spend appeared after previous finalization?
```

If yes:

```text
POST_COMPLETION_SPEND alert

Reconciliation case
```

---

# 122. Historical Spend Revision

If already-known date changes:

```text
Old ₹10,000
New ₹10,500
```

difference:

```text
₹500
```

must flow through attribution/reconciliation.

---

# 123. Full Financial Settlement Protection

If client job financially settled before revision:

do not silently reopen balances.

Set:

```text
FINANCIAL_CLOSURE_REVIEW
```

or equivalent reconciliation workflow.

---

# 124. Campaign Sync Flow

```text
Select Ad Account
↓
Fetch Campaign Collection
↓
Follow Pagination
↓
Normalize Campaigns
↓
Upsert Canonical Campaigns
↓
Update Last Seen
↓
Process Missing Only If Complete
↓
Emit Mapping Warnings
```

---

# 125. Unknown Campaign Spend

Insights may reveal campaign not yet in local campaign table.

Action:

```text
Create targeted campaign-fetch job
```

and hold attribution unresolved.

---

# 126. Asset Discovery Flow

Detailed:

```text
START
↓
Validate Connection
↓
Create Sync Run
↓
Fetch Business Portfolios
↓
Paginate Fully
↓
Upsert Businesses
↓
Fetch Accessible Ad Accounts
↓
Paginate Fully
↓
Upsert Accounts
↓
Upsert Relationships
↓
Mark Last Seen
↓
If Complete:
Evaluate Missing Existing Relationships
↓
SUCCESS
```

---

# 127. Full Connection Flow

Recommended orchestration:

```text
Parent Sync Run

├── Token Health
├── Permission Health
├── Asset Discovery
├── Account Metadata
├── Account Status
├── Campaigns
├── Recent Spend
└── Reconciliation
```

---

# 128. Parent vs Child Sync Runs

For observability:

```text
FULL_CONNECTION_SYNC
```

may create child runs/jobs.

Parent success requires required children success according to policy.

---

# 129. Partial Child Failure

Example:

```text
Asset Discovery SUCCESS

Status SUCCESS

Campaign SUCCESS

Spend FAILED
```

Parent:

```text
PARTIAL
```

and Spend freshness may become stale.

---

# 130. Dependency Handling

Do not run spend attribution before necessary campaign mapping data exists if it can be avoided.

But store external SpendFact first.

---

# 131. Queue Dependency

Possible:

```text
Campaign Sync
↓
Spend Sync
↓
Attribution
↓
Reconciliation
```

Or jobs can be independent with eventual retry.

---

# 132. Prefer Eventual Idempotent Dependencies

Avoid fragile giant workflow where one temporary error loses all downstream work.

Events/tasks should be retry-safe.

---

# 133. Sync Transactions

Do not put whole Meta sync in one DB transaction.

Use small atomic transactions per:

```text
Page

Chunk

Canonical entity batch

Relationship update
```

---

# 134. Why Not Giant Transaction

A 30-minute historical backfill should not hold huge DB transaction/locks.

---

# 135. Current-State Consistency

For each batch:

```text
Upsert data
+
Update provenance
```

atomically where reasonable.

---

# 136. Financial Isolation

Meta worker must not directly call:

```text
UPDATE ledger_entries
```

Meta changes flow through business/reconciliation services.

---

# 137. Redis Role

Redis/BullMQ provides:

```text
Queue

Delay

Retry

Dedup/lock support

Job status
```

Redis is not canonical Meta data storage.

---

# 138. Redis Loss

If Redis is lost:

Canonical synced data remains PostgreSQL.

Jobs can be regenerated from schedules/current freshness.

---

# 139. PostgreSQL Role

Stores:

```text
Canonical Meta entities

Spend facts

Relationships

Sync history

Errors

Freshness metadata
```

---

# 140. Sync Worker Crash

If worker dies mid-job:

queue retry should resume/re-run safely.

Idempotent upserts prevent duplicates.

---

# 141. Zombie RUNNING Sync

Need watchdog.

If:

```text
RUNNING
```

far beyond maximum execution duration with no active job:

mark:

```text
FAILED / ABANDONED
```

and retry if appropriate.

---

# 142. Sync Heartbeat

Long backfill may update:

```text
last_heartbeat_at
```

for monitoring.

---

# 143. Job Timeouts

Different jobs need different limits.

Example:

```text
Status sync → short

Historical backfill → long
```

Do not use one timeout universally.

---

# 144. Backfill Chunking

Large date range:

```text
90 days
```

can be divided:

```text
1–7 day chunks
or
larger logical periods
```

depending on volume/API behavior.

---

# 145. Backfill Priority

Historical backfill should not starve:

```text
Live status

Recent spend
```

Use lower queue priority/concurrency.

---

# 146. Backfill Resume

Track completed windows.

Example:

```text
1–7 Sep complete

8–14 Sep complete

15–21 Sep failed
```

Resume from failed range, not day 1.

---

# 147. Sync Checkpoint

Potential entity/metadata:

```text
sync_scope

start_date

end_date

last_completed_date

async_report_id
```

---

# 148. Reconnect Recovery

After connection restored:

```text
Validate auth
↓
Permission check
↓
Asset discovery
↓
Status refresh
↓
Recent spend extended backfill
↓
Campaign refresh
↓
Reconciliation
```

---

# 149. Extended Reconnect Backfill

If connection was unavailable 5 days:

recent spend range must cover outage period plus revision buffer.

---

# 150. Do Not Assume Missed Data Is Lost

Meta backfill should recover historical operational data where API allows.

---

# 151. Sync Gap Detection

System should identify:

```text
Last successful spend date/run
```

and detect missing expected periods.

---

# 152. Freshness-Based Scheduling

Scheduler may query:

```text
Which active account's status is stale/due?
```

instead of blindly syncing everything.

---

# 153. Priority Accounts

Future configuration:

```text
CRITICAL_ACCOUNT

HIGH_SPEND_ACCOUNT

PRIMARY_ACCOUNT
```

can receive more frequent status refresh.

---

# 154. Restricted Accounts

While recovery open:

status sync may remain frequent.

Spend sync can continue to catch late spend.

---

# 155. Archived Accounts

Reduce routine synchronization after confirmed archival unless historical reconciliation remains open.

---

# 156. Closed Financial Exposure

Even archived account may require:

```text
Refund / Recovery Monitoring
```

until financial closure.

---

# 157. Account Sync State

Recommended conceptual record:

```text
EntitySyncState
```

Fields:

```text
entity_type

entity_id

sync_domain

last_attempt_at

last_success_at

last_failure_at

freshness_status

consecutive_failures

last_sync_run_id
```

---

# 158. Why Separate Sync State

`AdAccount.updated_at` is not enough to answer:

```text
When was spend last successfully fetched?
```

---

# 159. Consecutive Failure Tracking

Useful for escalation:

```text
1 failure
→ Retry

3 failures
→ Warning

Persistent failure
→ High alert
```

threshold configurable.

---

# 160. Sync Alert Types

Recommended:

```text
META_AUTH_REQUIRED

META_PERMISSION_ERROR

META_SYNC_FAILED

META_SYNC_PARTIAL

META_DATA_STALE

META_RATE_LIMIT_PRESSURE

META_ASSET_ACCESS_LOST
```

---

# 161. Alert Deduplication

Same failing connection should have one active incident episode, not new alert every 5 minutes.

---

# 162. Recovery Alert

When healthy again:

```text
Resolve active sync-health alert
```

and retain history.

---

# 163. Sync Metrics

Track:

```text
Jobs queued

Jobs completed

Jobs failed

API calls

API latency

Records processed

Pages processed

Retries

Async report duration

Stale account count

Queue wait time
```

---

# 164. Connection Metrics

Per connection:

```text
Last successful asset discovery

Last successful status sync

Last successful spend sync

Failure rate

Consecutive failures
```

---

# 165. Sync Dashboard

Admin UI:

```text
Connection

Overall Health

Asset Freshness

Status Freshness

Spend Freshness

Queue State

Last Sync

Last Error
```

---

# 166. Sync Run Detail

Display:

```text
Sync Run ID

Type

Trigger

Connection

Scope

Started

Completed

Status

Completeness

Records

Pages

Errors

Child Jobs
```

---

# 167. Manual Retry

Admin can:

```text
Retry Failed Sync
```

This creates new run/reference.

Do not mutate original failed run into success invisibly.

---

# 168. Retry Relationship

Store:

```text
retry_of_sync_run_id
```

where useful.

---

# 169. Sync Audit

Important user actions:

```text
Manual Sync Requested

Connection Reconnected

Sync Cancelled

Backfill Requested
```

should create audit events.

---

# 170. Background System Events

Automated scheduled sync itself may be represented in SyncRun rather than general audit for every poll.

---

# 171. Sync Security

Worker needs access to:

```text
Decrypted Meta credential
```

only during authorized backend operation.

---

# 172. Secret Lifetime

Avoid unnecessarily retaining decrypted token in process memory/logs.

---

# 173. Multi-Tenant Isolation

Every sync job contains:

```text
organization_id
```

and validates target MetaConnection belongs to same organization.

---

# 174. Never Trust Queue Payload Alone

Worker reloads connection/resource from DB and verifies tenant/status.

---

# 175. Disabled Connection

If job queued before connection disabled:

worker should detect:

```text
DISABLED
```

and cancel/skip normal sync.

---

# 176. Archived Ad Account

Targeted job should check whether sync is still appropriate.

---

# 177. Manual Forced Refresh

Admin may deliberately refresh archived/restricted account for investigation.

Record trigger/reason.

---

# 178. API Version in Sync Run

Recommended metadata:

```text
meta_api_version
```

so historical sync errors can be debugged after upgrade.

---

# 179. Mapper Version in Sync Run

Optional:

```text
mapper_version
```

especially around Meta API migrations.

---

# 180. API Upgrade Canary

Before switching all connections:

test new Meta API version on:

```text
Small controlled connection/account set
```

then expand.

---

# 181. Dual-Version Testing

During staging upgrade:

same known asset can be fetched through old/new version and normalized output compared.

Do not write both into production current state simultaneously unless designed.

---

# 182. Sync Integrity Checks

After asset discovery:

```text
No duplicate canonical external IDs

Relationships reference valid entities

Current relationships non-conflicting
```

---

# 183. Spend Integrity Checks

After spend sync:

```text
Amount parses correctly

Currency present

Account exists

Campaign relation valid or unresolved

No duplicate natural key
```

---

# 184. Status Integrity Checks

```text
Raw state preserved

Normalized state valid

Unexpected state → UNKNOWN

Older sync cannot overwrite newer
```

---

# 185. Campaign Integrity Checks

```text
Campaign external ID unique per organization

Parent account valid

Name nullable policy respected

Status safely normalized
```

---

# 186. Reconciliation Integration

Meta sync emits facts.

Reconciliation compares facts against:

```text
Ledger

Allocations

Mappings

Client positions

Locked funds
```

---

# 187. Reconciliation Timing

Do not run expensive full reconciliation after every single fetched row.

Batch affected entities.

Example:

```text
Spend Sync AA-001 complete
↓
Reconcile AA-001 + affected jobs/clients
```

---

# 188. Nightly Full Reconciliation

Acts as safety net if event-triggered reconciliation was missed.

---

# 189. Sync Failure Does Not Resolve Reconciliation

If Meta data stale:

existing reconciliation case may transition:

```text
WAITING_FOR_SYNC
```

not resolved.

---

# 190. Sync Recovery

When fresh Meta data returns:

re-run affected reconciliation cases.

---

# 191. Current-State Query Rule

UI current state should use:

```text
Latest valid stored observation
+
Freshness
```

not queue-job status alone.

---

# 192. Example: Successful Status Sync

```text
14:00 ACTIVE

14:05 ACTIVE
```

Result:

```text
Current ACTIVE

Fresh

No new status-history episode
```

---

# 193. Example: Restriction

```text
14:00 ACTIVE

14:05 RESTRICTED
```

Result:

```text
Current RESTRICTED

Status History created

Restriction event emitted

Alert/recovery workflow begins
```

---

# 194. Example: API Failure

```text
14:00 ACTIVE

14:05 timeout
```

Result:

```text
Last known ACTIVE

Sync failed

Freshness aging/stale according to threshold
```

Not:

```text
RESTRICTED
```

---

# 195. Example: Spend Revision

```text
Sep 16 initial:
₹8,000

Sep 17 refresh:
₹8,250
```

Result:

```text
SpendFact Sep 16:
₹8,250

Change:
+₹250

Attribution recalculated

Reconciliation triggered
```

---

# 196. Example: Pagination Failure

Known accounts:

```text
AD1
AD2
AD3
```

Discovery page 1 returns:

```text
AD1
AD2
```

Page 2 fails before AD3.

Result:

```text
Sync PARTIAL

AD3 retained

No access-loss conclusion
```

---

# 197. Example: Confirmed Access Loss

Two complete valid discovery runs no longer contain AD3 and direct check confirms inaccessible.

Result:

```text
AD3 → ACCESS_LOST

Canonical record retained

Financial/history records retained
```

---

# 198. Example: Reconnect

Connection unavailable:

```text
Sep 10–Sep 12
```

Reconnect Sep 13.

Flow:

```text
Auth validate

Asset discovery

Status refresh

Spend backfill Sep 10–13 + revision buffer

Campaign refresh

Reconciliation
```

---

# 199. API Endpoints Should Not Determine Workflow Directly

Domain-level sync types should call adapters.

Example:

```text
syncRecentSpend()
```

not scatter raw URL logic throughout business services.

---

# 200. Recommended Backend Services

```text
MetaSyncCoordinator

MetaConnectionHealthService

MetaAssetDiscoveryService

MetaAdAccountSyncService

MetaCampaignSyncService

MetaInsightsSyncService

MetaBackfillService

MetaSyncStateService
```

---

# 201. Recommended Worker Queues

Possible:

```text
meta-critical

meta-standard

meta-backfill
```

or one queue with priority.

Choice depends on implementation scale.

---

# 202. Suggested Job Names

```text
meta.connection.health

meta.assets.discover

meta.account.status

meta.campaigns.sync

meta.spend.recent

meta.spend.backfill

meta.insights.async.poll

meta.reconciliation.trigger
```

---

# 203. Job Payload

Keep minimal:

```text
organizationId

connectionId

adAccountId if applicable

dateRange if applicable

syncRunId

triggerType
```

Do not put access token in queue payload.

---

# 204. Credential Loading

Worker:

```text
Queue Payload
↓
Load MetaConnection
↓
Resolve Secret Reference
↓
Decrypt/Retrieve Token
↓
Call Meta
```

---

# 205. Queue Persistence

BullMQ jobs should survive worker restarts according to Redis persistence configuration.

But canonical desired sync state should remain reconstructable from DB.

---

# 206. Scheduler Recovery

After service restart:

scheduler evaluates overdue/stale entities and queues missing jobs.

---

# 207. Duplicate Scheduler Runs

Use distributed scheduler lock so multiple application replicas do not enqueue identical global jobs.

---

# 208. Horizontal Scaling

Multiple workers may run later.

Therefore sync design must rely on:

```text
DB/Redis coordination

Idempotency

Canonical IDs

Locks
```

not single-process assumptions.

---

# 209. Sync Lock Scope

Possible key:

```text
connection + sync_type + resource + date_range
```

---

# 210. Lock Expiry

Distributed locks require safe TTL/recovery to avoid permanent stuck state after crash.

---

# 211. Financial Modules Remain Available During Sync Outage

If Meta fails, application still supports:

```text
Client payments

Vendor records

Ledger reports

Vendor settlements

Historical data
```

subject to each workflow's own requirements.

---

# 212. UI Stale Banner

When Meta freshness degraded:

```text
Meta data may be outdated.
Last successful sync: ...
```

Financial ledger display should not be marked stale merely because Meta is stale.

---

# 213. Sync Scope History

Store enough metadata to answer:

```text
Which date range did this spend sync cover?

Which Ad Accounts were requested?

Was pagination complete?

Was async reporting used?
```

---

# 214. Sync Request Hash

Optional:

Create hash from:

```text
Sync Type

Resource

Date Range

Fields

API Version
```

for debugging/deduplication.

---

# 215. Historical Sync Run Retention

Retain meaningful sync history for operational investigation.

Very verbose successful low-value logs may later use retention policy.

Financial/business records derived from them remain longer.

---

# 216. V1 Sync Cadence Starting Point

Initial operational configuration can start around:

```text
Token/permission health:
periodic + error-triggered

Account status:
~5 minutes

Recent spend:
~15–30 minutes

Campaign sync:
hourly / as needed

Asset discovery:
hourly or several times daily

Nightly:
extended spend refresh + reconciliation
```

These are configuration defaults, not guarantees.

---

# 217. Scale Adjustment

As Ad Account count grows:

reduce unnecessary calls through:

```text
Batching

Priority

Freshness scheduling

Incremental windows

Async Insights

Backfill throttling
```

---

# 218. V1 Required Sync Features

```text
Queue-based workers

SyncRun tracking

Pagination

Recent spend refresh

Historical backfill

Campaign sync

Status sync

Asset discovery

Idempotent upsert

Retry/backoff

Auth failure handling

Permission failure handling

Freshness tracking

Partial sync handling

Manual refresh

Out-of-order protection

Reconciliation triggers
```

---

# 219. Future Sync Features

Possible:

```text
Webhook-triggered targeted refresh

Adaptive scheduling

Multi-region workers

Automatic usage-budget control

Per-client sync priority

Ad Set/Ad-level ingestion

Additional ad platforms
```

---

# 220. Meta Sync Integrity Rules

System must enforce:

```text
1. Meta synchronization must run server-side.

2. Every significant sync must be traceable through SyncRun.

3. Collection endpoints must handle all pagination before declaring completeness.

4. Partial sync must never be treated as complete data.

5. Missing assets from incomplete sync must never be marked deleted/access-lost.

6. Same Meta external ID must upsert the same canonical entity.

7. Re-running a sync must not duplicate records.

8. Failed sync must preserve the last valid observation.

9. Stale data must remain marked stale rather than converted to zero.

10. Older sync results must not overwrite newer observations.

11. Account API failure must not be interpreted as restriction.

12. Status changes must produce history only on meaningful state transitions.

13. Restricted-account detection must not directly guess financial ownership.

14. Restored account status must not automatically unlock funds.

15. Meta spend changes must update external SpendFacts and trigger reconciliation, not rewrite posted ledger.

16. Historical spend backfills must be resumable and retry-safe.

17. Large Insights workloads should support asynchronous report jobs.

18. Async report IDs must survive worker/process restarts.

19. Retry loops must be bounded.

20. Confirmed auth failures must stop wasteful dependent retries.

21. Backfill work must not starve critical status/recent-spend synchronization.

22. Queue payloads must never contain raw Meta credentials.

23. Redis must not become canonical financial or Meta data storage.

24. Meta outages must degrade freshness, not internal financial correctness.

25. Every changed external fact should trigger only the minimum required downstream recalculation.
```

---

# 221. Meta Sync Golden Rule

> **A Meta sync is a repeatable observation process, not a one-time import. Every run must know what it attempted, whether it completed, what changed, how fresh the result is and what failed. Partial, stale or failed external data must remain visibly uncertain, while previously verified internal business and financial history stays intact.**
