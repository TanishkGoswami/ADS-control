# Queue and Workers

## Overview

Ye document Ads Control system ke asynchronous processing architecture ko define karta hai.

Background processing ki zarurat primarily in workloads ke liye hogi:

```text
Meta synchronization

Meta historical backfills

Reconciliation

Transactional outbox delivery

Large reports

Alerts

Notifications

Periodic monitoring

Cleanup and maintenance
```

Core principle:

> **Queues may deliver work more than once, workers may crash, Redis may restart, and external APIs may fail. Therefore every important background operation must be resumable, idempotent and recoverable from canonical PostgreSQL state.**

---

# 1. Queue Technology

Recommended:

```text
BullMQ
+
Redis
```

BullMQ handles:

```text
Queueing

Delayed jobs

Retries

Priorities

Worker concurrency

Scheduled execution

Failed-job tracking
```

---

# 2. Redis Role

Redis is used for:

```text
Queue state

Job coordination

Delayed jobs

Worker locks

Short-lived coordination
```

Redis is not canonical financial storage.

---

# 3. PostgreSQL Remains Canonical

If Redis completely disappears:

system must still retain:

```text
Ledger

Client funds

Vendor payable

Fund allocations

Reconciliation cases

Meta synchronized facts

Outbox events
```

in PostgreSQL.

---

# 4. Queue Architecture

Recommended logical queues:

```text
meta-sync

reconciliation

finance-events

outbox

alerts

reports

notifications

maintenance
```

---

# 5. Queue Separation

Different workloads have different characteristics.

Example:

```text
Meta Sync
=
External API dependent

Reconciliation
=
Database intensive

Reports
=
CPU / query intensive
```

Separating them improves control.

---

# 6. Initial Deployment

V1 may run:

```text
One Worker Container
```

consuming multiple queues.

Logical queues should still remain separate.

---

# 7. Future Worker Split

Later:

```text
worker-meta

worker-reconciliation

worker-reports

worker-notifications
```

can run independently.

---

# 8. Why Separate Worker Process

Do not run heavy background jobs inside NestJS HTTP process.

Benefits:

```text
API remains responsive

Worker can restart independently

Different concurrency

Different resource limits

Safer scaling
```

---

# 9. Worker Bootstrap

Conceptually:

```text
Worker Process Starts
↓
Validate Environment
↓
Connect PostgreSQL
↓
Connect Redis
↓
Register Queue Processors
↓
Start Health Monitoring
```

---

# 10. Job Design

Each job should represent:

```text
One logical operation
```

Examples:

```text
Sync one Ad Account recent spend

Reconcile one Client

Generate one report

Dispatch one Outbox Event
```

---

# 11. Avoid Giant Jobs

Bad:

```text
Sync every Meta account
+
all historical spend
+
all reconciliation
```

inside one job.

One failure would create unnecessary rework.

---

# 12. Avoid Excessive Tiny Jobs

Also avoid:

```text
One job per trivial database row
```

when batch processing is more efficient.

---

# 13. Recommended Job Granularity

Examples:

```text
One Meta Connection asset-discovery job

One Ad Account spend-sync job

One Vendor reconciliation job

One report-generation job
```

---

# 14. Job Payload

Keep payload small.

Recommended:

```text
organizationId

resourceId

syncRunId

jobType

dateRange if required

triggerType

requestId
```

---

# 15. Job Payload Must Not Contain

```text
Meta access token

Database password

Supabase secret key

Encryption key

Full financial state
```

Worker reloads canonical state securely.

---

# 16. Queue Payload Is Not Authority

Example job:

```text
{
  vendorId,
  settlementId
}
```

Worker must reload settlement from PostgreSQL.

Do not trust queue payload amount as final authority.

---

# 17. Job Validation

Every processor begins:

```text
Validate payload
↓
Load canonical entity
↓
Validate tenant
↓
Validate current state
↓
Execute operation
```

---

# 18. Job Idempotency

Critical rule:

> **Every worker must assume the same job may execute more than once.**

---

# 19. Meta Sync Idempotency

Repeated:

```text
SPEND_RECENT
```

must not create duplicate SpendFacts.

Use:

```text
Natural keys

Upsert

Observation ordering
```

---

# 20. Reconciliation Idempotency

Running same reconciliation twice:

```text
must update/reuse same mismatch episode
```

instead of creating duplicate cases.

---

# 21. Alert Idempotency

Same active condition:

```text
AD_ACCOUNT_RESTRICTED
```

should update same alert episode.

Not create new alert every poll.

---

# 22. Financial Worker Idempotency

If any worker can initiate financial posting:

must use:

```text
Canonical business record

Idempotency key

Database transaction

Locks
```

---

# 23. Queue Retry Must Never Repost Money

Example:

```text
Vendor settlement posted

Worker crashes before marking job complete
```

Retry must detect:

```text
Settlement already POSTED
```

and return success/no-op.

---

# 24. Job Identity

Useful deterministic job IDs:

```text
meta-status:{accountId}:{window}

reconcile-client:{clientId}:{reconciliationRunId}

outbox:{eventId}
```

where appropriate.

---

# 25. Deterministic Job ID

Can help prevent duplicate queued jobs.

But:

```text
Job ID dedup
```

does not replace:

```text
Business idempotency
```

---

# 26. Queue Deduplication

Example:

User clicks:

```text
Refresh Spend
```

10 times.

System should normally keep:

```text
1 active equivalent job
```

---

# 27. Dedup Scope

Define based on:

```text
Job type

Resource

Date range

Connection

Organization
```

---

# 28. Active vs Future Duplicate

Sometimes second job should be queued after current one.

Example:

```text
Current spend sync running

New targeted sync requested after important status change
```

Use domain-specific policy.

---

# 29. Job Status

Recommended business-facing states:

```text
QUEUED

RUNNING

SUCCESS

PARTIAL

FAILED

CANCELLED
```

BullMQ internal job state and business SyncRun state should remain separate.

---

# 30. BullMQ State Is Operational

BullMQ may say:

```text
completed
```

while domain operation may be:

```text
PARTIAL
```

Example:

worker completed successfully after discovering API pagination failure and recording partial sync.

---

# 31. Domain Status

Therefore authoritative user-facing sync status lives in:

```text
PostgreSQL SyncRun / ReportRequest / ReconciliationRun
```

not only BullMQ.

---

# 32. Worker Start

On job start:

update business run:

```text
RUNNING
```

where relevant.

---

# 33. Worker Completion

On successful domain operation:

```text
SUCCESS
```

---

# 34. Partial Completion

Worker may finish without throwing but domain result:

```text
PARTIAL
```

Example:

some Meta pages unavailable.

---

# 35. Job Failure

After retry exhaustion:

```text
FAILED
```

with normalized error.

---

# 36. Retry Architecture

Conceptual:

```text
Job fails
↓
Classify error
↓
Retryable?
├── YES
│   ↓
│ Backoff
│   ↓
│ Retry
└── NO
    ↓
Final Failure
```

---

# 37. Retryable Examples

```text
Network timeout

Temporary Meta failure

Selected 5xx

Temporary Redis-independent provider failure

Database deadlock
```

---

# 38. Non-Retryable Examples

```text
Invalid request

Missing required permission

Invalid token

Unsupported API field

Business validation failure
```

---

# 39. Retry Count

Configurable per job class.

Example:

```text
Meta transient:
4 attempts

Report query transient:
3 attempts

Invalid request:
0 retries
```

---

# 40. Backoff

Use:

```text
Exponential backoff
+
Jitter
```

to avoid retry storms.

---

# 41. Example Backoff

Conceptually:

```text
10 seconds

30 seconds

2 minutes

5 minutes
```

with randomized variance.

Exact values configurable.

---

# 42. Retry Policy Per Queue

Do not use one universal retry policy.

Meta:

```text
provider/network focused
```

Reports:

```text
DB/load focused
```

Notifications:

```text
provider delivery focused
```

---

# 43. Delayed Jobs

Useful for:

```text
Retry after rate limit

Async Meta report polling

Scheduled notification

Snoozed alert recheck
```

---

# 44. Do Not Busy Wait

Bad:

```text
while report pending:
    sleep(1)
```

inside worker.

Better:

```text
Check
↓
Not ready
↓
Requeue delayed poll
```

---

# 45. Async Meta Report

Flow:

```text
Submit Meta report
↓
Persist report ID
↓
Queue delayed poll
↓
Poll
↓
Still pending
↓
Queue another delayed poll
```

---

# 46. Persist External Job IDs

Do not keep:

```text
Meta report ID
```

only in worker memory.

Store in PostgreSQL.

---

# 47. Worker Crash Recovery

If worker crashes:

BullMQ retry/recovery runs job again.

Canonical state lets job determine what remains.

---

# 48. Process Crash After DB Commit

Critical case:

```text
DB committed
↓
Worker crashes
↓
Queue thinks job failed/stalled
↓
Job executes again
```

Idempotency must make second run safe.

---

# 49. Stalled Job Handling

Operational monitoring should detect jobs that remain:

```text
RUNNING
```

without healthy worker activity.

---

# 50. Domain Watchdog

For domain runs, track:

```text
startedAt

lastHeartbeatAt
```

for long-running work.

---

# 51. Zombie Run

If SyncRun remains:

```text
RUNNING
```

after job permanently disappeared:

mark:

```text
FAILED / ABANDONED
```

according to policy.

---

# 52. Heartbeats

Long jobs such as:

```text
90-day backfill

Huge report
```

can periodically update heartbeat/progress.

---

# 53. Progress Tracking

Track meaningful progress:

```text
recordsProcessed

pagesProcessed

dateWindowsCompleted
```

instead of fake percentage.

---

# 54. Progress Percentage

Only show percentage when total work size is actually known.

---

# 55. Job Priority

Recommended levels:

```text
CRITICAL

HIGH

NORMAL

LOW
```

---

# 56. Priority Examples

Critical:

```text
Restricted account targeted status refresh
```

High:

```text
Recent spend for active high-exposure account
```

Normal:

```text
Routine Meta sync
```

Low:

```text
Historical backfill
```

---

# 57. Finance Priority

Reconciliation triggered by high-value mismatch may outrank report exports.

---

# 58. Backfill Priority

Historical backfills should not starve:

```text
Current status sync

Current spend

Financial reconciliation
```

---

# 59. Concurrency

Each worker type needs controlled:

```text
concurrency
```

---

# 60. Meta Worker Concurrency

Limited by:

```text
Meta API capacity

Connection-level limits

Rate pressure

VPS resources
```

---

# 61. Report Worker Concurrency

Limited by:

```text
Database load

Memory

CPU
```

---

# 62. Reconciliation Concurrency

Limited by:

```text
Database locking

Query cost
```

---

# 63. Finance Worker Concurrency

Keep conservative.

Financial correctness is more important than maximum throughput.

---

# 64. Global vs Queue Concurrency

Example:

```text
Meta worker:
10 concurrent

Reports:
2 concurrent

Reconciliation:
4 concurrent
```

values tuned after testing.

---

# 65. Per-Connection Limit

Meta jobs may also require:

```text
connection-level semaphore
```

to stop one Meta Connection flooding API capacity.

---

# 66. Distributed Semaphore

Can use Redis coordination for operational throughput.

But if Redis coordination fails:

financial correctness must still be protected by PostgreSQL.

---

# 67. Database Locks Remain Final Guard

Redis distributed lock:

```text
helps scheduling
```

PostgreSQL lock:

```text
protects canonical financial invariant
```

---

# 68. Scheduler Architecture

Scheduler should periodically determine:

```text
What work is due?
```

rather than maintaining separate OS cron per entity.

---

# 69. Scheduler Flow

```text
Scheduler tick
↓
Query due work
↓
Acquire scheduler lock
↓
Create/dedupe jobs
↓
Release lock
```

---

# 70. Distributed Scheduler Lock

Required if multiple application/worker replicas may run scheduler.

---

# 71. Scheduler Lock Failure

If lock unavailable:

skip current cycle.

Next cycle can recover.

---

# 72. Scheduler State

Important schedules should derive from PostgreSQL:

```text
last_success_at

next_due_at

freshness
```

rather than only Redis repeat metadata.

---

# 73. Why

If Redis is rebuilt:

scheduler can reconstruct work from DB.

---

# 74. Recurring Work

Examples:

```text
Meta status

Meta spend

Asset discovery

Nightly reconciliation

Alert aging
```

---

# 75. No Per-Account Cron Explosion

Bad:

```text
10,000 separate cron definitions
```

Preferred:

```text
One scheduler
↓
find due accounts
↓
batch/enqueue
```

---

# 76. Freshness-Based Scheduling

Example query:

```text
Find active accounts
where last_status_success_at < threshold
```

then enqueue.

---

# 77. Adaptive Scheduling

Future:

```text
Active high-spend account
→ frequent

Inactive account
→ slower

Restricted account
→ frequent status

Archived financially closed
→ stop
```

---

# 78. Transactional Outbox

Critical architecture component.

Financial transaction:

```text
Business Records
+
Ledger
+
Outbox Event
```

commit together.

---

# 79. Outbox Example

```text
Client Payment Posted
```

creates:

```text
CLIENT_PAYMENT_POSTED
```

outbox event in same DB transaction.

---

# 80. Why Outbox

Without outbox:

```text
DB commit succeeds

Redis unavailable

Queue publish fails

Downstream reconciliation never runs
```

---

# 81. With Outbox

```text
DB commit succeeds

Outbox row remains PENDING

Redis returns later

Dispatcher sends event
```

---

# 82. Outbox Table

Recommended:

```text
id

organization_id

event_type

aggregate_type

aggregate_id

event_version

payload

status

attempt_count

created_at

processed_at

next_attempt_at

last_error
```

---

# 83. Outbox Status

```text
PENDING

PROCESSING

DELIVERED

FAILED
```

---

# 84. Outbox Claiming

Multiple dispatchers should safely claim events using:

```text
FOR UPDATE SKIP LOCKED
```

or equivalent PostgreSQL pattern.

---

# 85. Outbox Batch

Process controlled batch:

```text
50

100
```

etc., based on performance.

---

# 86. Outbox Delivery

Dispatcher can enqueue:

```text
BullMQ job
```

identified by:

```text
outbox event ID
```

---

# 87. Outbox Duplicate Delivery

Possible:

```text
Queue accepted job

Dispatcher crashes before marking DELIVERED
```

Event may be queued again.

Consumer idempotency handles it.

---

# 88. Event ID

Every outbox event carries globally unique:

```text
eventId
```

---

# 89. Consumer Deduplication

Where needed, consumers maintain:

```text
processed_event
```

record or derive idempotency from target state.

---

# 90. Example

`CLIENT_PAYMENT_POSTED`

reconciliation consumer can safely run same client reconciliation multiple times.

No financial duplication occurs.

---

# 91. Outbox Failure

After configured delivery attempts:

```text
FAILED
```

and alert operations/admin.

Do not delete silently.

---

# 92. Outbox Replay

Admin can safely:

```text
Retry Failed Event
```

because consumer is idempotent.

---

# 93. Event Categories

Possible:

```text
CLIENT_PAYMENT_POSTED

CLIENT_REFUND_POSTED

VENDOR_FUNDING_POSTED

VENDOR_SETTLEMENT_POSTED

OWNERSHIP_TRANSFER_POSTED

SPEND_FACT_UPDATED

AD_ACCOUNT_RESTRICTED

AD_ACCOUNT_RESTORED
```

---

# 94. Event Version

Include:

```text
eventVersion
```

for future payload evolution.

---

# 95. Event Payload

Keep minimal.

Example:

```text
{
  "clientId": "...",
  "paymentId": "..."
}
```

Consumer reloads detailed current state.

---

# 96. Do Not Put Sensitive Data in Events

Avoid:

```text
Bank credentials

Tokens

Secrets

Full evidence documents
```

---

# 97. Meta Queue

Recommended job types:

```text
META_TOKEN_HEALTH

META_PERMISSION_HEALTH

META_ASSET_DISCOVERY

META_ACCOUNT_STATUS

META_CAMPAIGN_SYNC

META_SPEND_RECENT

META_SPEND_BACKFILL

META_ASYNC_REPORT_POLL
```

---

# 98. Reconciliation Queue

Examples:

```text
RECONCILE_CLIENT

RECONCILE_VENDOR

RECONCILE_AD_ACCOUNT

RECONCILE_LOCKED_FUNDS

FULL_NIGHTLY_RECONCILIATION
```

---

# 99. Report Queue

Examples:

```text
CLIENT_STATEMENT

VENDOR_STATEMENT

LEDGER_EXPORT

RECONCILIATION_REPORT
```

---

# 100. Alerts Queue

Can process:

```text
Evaluate alert condition

Age alerts

Escalate severity

Auto-resolve condition-based alerts
```

---

# 101. Notifications Queue

Separate notifications from alert creation.

Examples:

```text
Email

Future WhatsApp

Future Slack

Push
```

---

# 102. Notification Failure

Must not rollback source business event.

---

# 103. Maintenance Queue

Examples:

```text
Projection rebuild

Retention cleanup

Snapshot generation

Integrity checks
```

---

# 104. Report Generation Flow

```text
ReportRequest created
↓
REPORT_GENERATE job
↓
Load authorized report scope
↓
Query DB
↓
Generate CSV/XLSX
↓
Upload Storage
↓
Update ReportRequest READY
↓
Notification
```

---

# 105. Report Job Authorization

Authorization is checked when request created.

Worker also verifies:

```text
Request still valid

Organization exists

Report request scope stored
```

---

# 106. Do Not Trust Current User Session in Worker

Worker operates as:

```text
SYSTEM
```

against previously authorized ReportRequest.

---

# 107. Report Snapshot Semantics

Report should record:

```text
generatedAt

requestedAt

filters
```

and whether data is:

```text
current-at-generation
```

or period-based.

---

# 108. Reconciliation Job Flow

```text
Load scope
↓
Acquire appropriate lock if required
↓
Compute expected state
↓
Compute observed state
↓
Find/create/update reconciliation case
↓
Persist result
↓
Emit alerts if needed
```

---

# 109. Reconciliation Locking

Avoid two jobs independently creating duplicate cases for same mismatch episode.

Use:

```text
Unique fingerprint

Row lock

Idempotent upsert
```

---

# 110. Reconciliation Fingerprint

Example:

```text
type
+
entity
+
currency
+
episode
```

---

# 111. Meta Job Flow

```text
Load connection
↓
Check enabled/auth state
↓
Call Meta
↓
Normalize
↓
Upsert
↓
Update SyncRun
↓
Emit changed-fact event
```

---

# 112. Stale Job Validation

Example:

`META_SPEND_RECENT` queued.

Before run:

connection becomes:

```text
DISABLED
```

Worker should:

```text
SKIP / CANCEL
```

not call Meta.

---

# 113. Cancelled Jobs

Business run records reason:

```text
CONNECTION_DISABLED

RESOURCE_ARCHIVED

SUPERSEDED
```

where relevant.

---

# 114. User Cancellation

Large report/backfill may support:

```text
Cancel
```

if operation can safely stop.

---

# 115. Cancellation Is Cooperative

Worker checks cancellation flag between chunks.

Do not abruptly terminate during atomic DB transaction.

---

# 116. Financial Posting Cancellation

Once financial DB transaction begins/post commits:

do not expose arbitrary job cancellation.

---

# 117. Backfill Chunking

Example:

```text
90-day range
```

split into:

```text
7-day windows
```

or suitable dynamic range.

---

# 118. Parent Backfill

Parent run:

```text
Sep 1 – Nov 30
```

child jobs:

```text
Sep 1–7

Sep 8–14

...
```

---

# 119. Parent Status

Derived from child status.

Possible:

```text
SUCCESS

PARTIAL

FAILED
```

---

# 120. Backfill Resume

If child window fails:

retry only missing window.

---

# 121. Date Window Idempotency

Spend facts upsert naturally.

Repeating window safe.

---

# 122. Queue Fairness

One huge client/backfill should not monopolize all workers.

Use:

```text
priorities

per-connection concurrency

chunking
```

---

# 123. Queue Starvation

Monitor low-priority queue age.

Low jobs should eventually execute.

---

# 124. Worker Resource Limits

Docker can limit:

```text
CPU

Memory
```

for worker container.

---

# 125. Memory Safety

Large reports/backfills should stream/chunk.

Avoid loading:

```text
5 million rows
```

into memory simultaneously.

---

# 126. Streaming Exports

Prefer:

```text
DB cursor/chunk
↓
stream writer
```

for large CSV/XLSX where supported.

---

# 127. Database Connection Control

Each worker process consumes DB connections.

Worker scale must respect Supabase/PostgreSQL connection capacity.

---

# 128. Worker Prisma Client

One process-level client.

Do not create Prisma client per job.

---

# 129. Redis Connection Control

BullMQ queues/workers create Redis connections.

Reuse/configure intentionally.

---

# 130. Redis Persistence

Production Redis should use persistent volume and suitable persistence configuration.

However PostgreSQL remains recovery authority.

---

# 131. Redis Failure

Expected:

```text
API still reads/writes PostgreSQL

New async dispatch may pause

Workers stop

Outbox remains pending
```

---

# 132. Redis Recovery

After Redis returns:

```text
Outbox dispatcher resumes

Schedulers inspect overdue DB state

Missing jobs recreated
```

---

# 133. No Financial Data Loss From Redis

This is architectural requirement.

---

# 134. Queue Recovery From DB

Examples:

```text
Pending Outbox
→ requeue

Stale Meta Accounts
→ requeue sync

Queued ReportRequest without job
→ requeue

Open reconciliation needing refresh
→ requeue
```

---

# 135. Reconciler Job Recovery

If queue disappeared:

nightly scheduler creates new reconciliation runs/tasks.

---

# 136. Report Recovery

ReportRequest:

```text
QUEUED
```

but BullMQ job missing.

Watchdog can re-enqueue.

---

# 137. Job Watchdog

Periodic process checks:

```text
Business records expecting job
but no recent progress
```

and repairs.

---

# 138. Example

```text
ReportRequest PROCESSING

lastHeartbeat 2h ago
```

→ mark failed/stalled and allow retry.

---

# 139. Queue Metrics

Track:

```text
Waiting jobs

Active jobs

Failed jobs

Delayed jobs

Completed rate

Average queue wait

Execution duration

Retry count
```

---

# 140. Queue Age

Important:

```text
oldest waiting job age
```

can reveal backlog even if queue count modest.

---

# 141. Per-Queue Metrics

Separate:

```text
Meta

Reports

Reconciliation
```

because acceptable latency differs.

---

# 142. Domain Metrics

Examples:

```text
Accounts stale because sync backlog

Reconciliation cases waiting

Reports delayed
```

---

# 143. Worker Health

Worker health endpoint/process monitor should expose:

```text
Redis connected

DB connected

Processors started

Last successful job
```

---

# 144. No Job Completed Recently

May be normal if no workload.

Do not automatically mark worker unhealthy solely due inactivity.

---

# 145. Error Logging

Every failed job logs:

```text
jobId

queue

jobType

resourceId

organizationId

attempt

errorCategory

requestId
```

No secrets.

---

# 146. Job Stack Trace

Internal error tracker may capture stack trace.

User-facing UI should not.

---

# 147. Failed Job Retention

Keep enough failed-job history for troubleshooting.

Canonical long-term incident history belongs in PostgreSQL.

---

# 148. Completed Job Retention

BullMQ completed jobs can be pruned after operationally useful period.

Do not rely on them for permanent audit.

---

# 149. Dead-Letter Concept

After retry exhaustion:

```text
FAILED
```

jobs function as dead-letter workload.

System must provide:

```text
Inspect

Retry

Resolve
```

workflow.

---

# 150. Dead-Letter Dashboard

Admin Monitoring page can show:

```text
Queue

Job Type

Resource

Failure

Attempts

Last Error

Retry Action
```

---

# 151. Manual Retry

Creates:

```text
new attempt
```

against same canonical domain record.

Should not erase previous failure history.

---

# 152. Manual Retry Permission

Sensitive retry may require:

```text
SYSTEM_OPERATIONS
```

or appropriate permission.

---

# 153. Replaying Financial Job

Extra caution:

worker must detect source record already posted.

No double financial effect.

---

# 154. Rate Limit Coordination

Meta error signals can update shared:

```text
Meta rate-pressure state
```

in Redis/PostgreSQL.

Scheduler/worker lowers throughput.

---

# 155. Provider Circuit Breaker

Repeated failures can pause:

```text
specific connection

specific endpoint family

global Meta workloads
```

depending on scope.

---

# 156. Open Circuit

Jobs should not repeatedly hit provider.

Instead:

```text
delay/requeue
```

or mark blocked.

---

# 157. Half-Open Probe

One controlled request checks recovery.

---

# 158. API Outage

If Meta globally down:

pause backfills first.

Preserve critical status checks at low controlled rate if useful.

---

# 159. Queue Priority During Meta Degradation

Recommended:

```text
Restricted account checks

Connection health

Active current spend

Routine discovery

Historical backfill
```

---

# 160. Scheduled Nightly Work

Possible:

```text
Extended Meta spend refresh

Full reconciliation

Data integrity checks

Alert aging

Financial snapshots
```

---

# 161. Nightly Load

Do not schedule all heavy jobs exactly at same second.

Spread workload.

---

# 162. Job Jitter

Scheduled batch can randomize start within small safe window.

---

# 163. Timezone

Scheduler should explicitly define:

```text
UTC
```

or organization timezone depending job semantics.

---

# 164. Financial Daily Snapshot

If snapshot corresponds to business date:

organization timezone rules should be explicit.

---

# 165. Meta Daily Spend

Meta account timezone remains relevant.

Scheduler execution timezone does not change reporting date semantics.

---

# 166. Period Close Jobs

Future finance period-close operations must be controlled workflows, not casual recurring jobs.

---

# 167. Maintenance Jobs

Examples:

```text
Clean expired temp uploads

Archive old operational logs

Refresh materialized views

Detect stale SyncRuns
```

---

# 168. Maintenance Must Not Delete Financial History

Retention policy should distinguish:

```text
Temporary operational data
```

from:

```text
Canonical financial records
```

---

# 169. Data Integrity Worker

Optional periodic checks:

```text
Unbalanced ledger transaction

Over-allocated fund lot

Negative payable

Orphan references

Duplicate active mapping
```

---

# 170. Integrity Violation

If detected:

```text
CRITICAL alert
```

Do not auto-correct financial ledger silently.

---

# 171. Projection Rebuild Job

Derived dashboard/cache data can be rebuilt.

Canonical ledger/allocation remain unchanged.

---

# 172. Projection Job Idempotency

Safe to rerun.

---

# 173. Notification Job

Payload:

```text
notificationId
```

Worker loads notification record.

---

# 174. Notification Status

```text
PENDING

SENT

FAILED
```

with attempts.

---

# 175. Notification Provider Failure

Retry according to provider error.

Do not duplicate user-facing notifications uncontrollably.

---

# 176. User Notification Dedup

Fingerprint event/recipient/channel.

---

# 177. Alert vs Notification

Alert is canonical operational condition.

Notification is delivery of information about condition.

---

# 178. Worker Security

Workers run trusted backend code.

But should follow least privilege.

Example Report Worker should not need Meta token.

---

# 179. Worker Environment Separation

Future Docker services:

```text
worker-meta
```

gets Meta secrets.

```text
worker-report
```

does not.

---

# 180. Queue Network

Redis should stay on private network.

---

# 181. Queue Input Exposure

No public user can directly publish BullMQ jobs.

Only backend/scheduler/outbox dispatcher.

---

# 182. User Request to Queue

Flow:

```text
Browser
↓
Authorized API
↓
Validate
↓
Create domain request
↓
Queue
```

Never browser → Redis directly.

---

# 183. Worker Tenant Isolation

Every job includes:

```text
organizationId
```

Worker verifies loaded resource belongs to same organization.

---

# 184. Internal Job ID Guess

Even if attacker somehow influences payload:

worker must not access cross-tenant resource without validation.

---

# 185. Graceful Shutdown

On SIGTERM:

```text
Stop accepting new jobs

Allow current safe jobs to finish

Persist state

Close BullMQ

Close Redis

Close DB
```

---

# 186. Long Job During Deployment

Jobs should be chunked/checkpointed enough that graceful shutdown does not require extremely long waits.

---

# 187. Deployment Retry

If job interrupted:

next worker can safely retry.

---

# 188. Job Checkpoints

Useful for:

```text
Backfill

Large export

Migration-like operation
```

---

# 189. Checkpoint Storage

Store in PostgreSQL domain run metadata.

Not only process memory.

---

# 190. Checkpoint Example

```text
lastCompletedDate = 2026-09-10
```

Backfill resumes from:

```text
2026-09-11
```

---

# 191. Queue Schema Version

Job payload may include:

```text
jobVersion
```

for future worker compatibility.

---

# 192. Deployment Compatibility

During rolling deployment:

old queued jobs may meet new worker code.

Worker should support current previous payload version during migration window.

---

# 193. Unknown Job Version

Do not guess.

Fail safely and alert.

---

# 194. Queue Naming Version

Avoid unnecessary:

```text
meta-sync-v1
meta-sync-v2
```

unless migration requires parallel contracts.

Payload version often sufficient.

---

# 195. Outbox Event Compatibility

Event version more important because events may remain pending across deploy.

---

# 196. Queue Tests

Must include:

```text
Normal execution

Transient failure retry

Permanent failure

Duplicate delivery

Worker crash after DB commit

Delayed job

Job cancellation

Redis restart

Outbox duplicate delivery
```

---

# 197. Meta Worker Tests

```text
Rate limit

Timeout

Auth error

Permission error

Pagination partial

Out-of-order sync
```

---

# 198. Reconciliation Worker Tests

```text
Same case twice

Difference resolved

Difference changes

Concurrent runs
```

---

# 199. Report Worker Tests

```text
Large export

Storage failure

Retry

Cancellation

Permission snapshot
```

---

# 200. Outbox Tests

Critical:

```text
Business transaction commits

Queue unavailable

Outbox remains pending

Queue returns

Event delivered once-or-more safely
```

---

# 201. Redis Loss Test

Destroy development Redis instance.

Expected after restart:

```text
Canonical financial data intact

Outbox reconstructs events

Scheduler reconstructs due jobs
```

---

# 202. Queue Monitoring UI

Admin Monitoring page:

```text
Queue Health

Waiting

Active

Failed

Oldest Waiting

Recent Failures
```

---

# 203. Domain Run Monitoring

More important user-facing:

```text
Meta Sync Runs

Reports

Reconciliation Runs
```

rather than raw BullMQ internals.

---

# 204. Operational Admin

Raw queue controls should be restricted.

---

# 205. Dangerous Queue Action

Do not expose generic:

```text
Retry every failed job
```

without filters/review.

Could cause load spike.

---

# 206. Pause Queue

Operations can pause:

```text
historical backfill
```

during incident.

---

# 207. Queue Pause Must Not Lose Jobs

Jobs remain pending.

---

# 208. Financial Queue Pause

If finance-events queue paused:

outbox events accumulate.

Financial transactions already committed remain valid.

---

# 209. Reconciliation Lag

Dashboard should surface:

```text
Pending Reconciliation
```

if queue delayed.

---

# 210. Eventual Consistency UI

After payment posting:

canonical payment/ledger result can show immediately.

Dashboard aggregate may refresh seconds later.

UI should tolerate this.

---

# 211. Do Not Pretend Synchronous Everywhere

Background derived calculations may show:

```text
Updating...
```

where appropriate.

---

# 212. Synchronous vs Async Rule

Use synchronous when:

```text
User needs immediate confirmation

Operation is small

DB transaction is short
```

Use async when:

```text
External API

Large computation

Long report

Bulk operation
```

---

# 213. Financial Posting

Normally synchronous DB transaction.

---

# 214. Financial Reconciliation

Normally async after commit.

---

# 215. Meta Sync

Async.

---

# 216. Report

Large reports async.

---

# 217. Queue Configuration

Configuration examples:

```text
META_WORKER_CONCURRENCY

REPORT_WORKER_CONCURRENCY

RECONCILIATION_WORKER_CONCURRENCY

QUEUE_MAX_ATTEMPTS

QUEUE_BACKOFF
```

---

# 218. Config Validation

Worker must refuse startup on invalid critical queue config.

---

# 219. Environment-Specific Concurrency

Development:

```text
low
```

Production:

```text
tested values
```

---

# 220. Scaling Rule

Increase worker count/concurrency only after measuring:

```text
Queue age

DB load

Meta limits

CPU

Memory
```

---

# 221. Queue Architecture Decisions

V1:

```text
BullMQ + Redis

Separate worker process

Logical queue separation

Transactional outbox

Database-backed run states

Idempotent workers

Controlled retries

Scheduler from DB state

No Kafka
```

---

# 222. Why No Kafka

Current needs do not justify:

```text
Kafka cluster

Consumer groups

Partition management

Extra operational complexity
```

BullMQ + outbox sufficient.

---

# 223. Why No RabbitMQ

Same reasoning.

Current workload fits Redis/BullMQ ecosystem and Node stack.

---

# 224. Future Migration

If event volume or integration architecture becomes much larger:

outbox abstraction makes future event-bus migration easier.

---

# 225. Queue and Worker Integrity Rules

System must enforce:

```text
1. Redis must never become canonical financial storage.

2. Important jobs must be reconstructable from PostgreSQL state where practical.

3. Every worker must assume at-least-once job execution.

4. Critical worker actions must be idempotent.

5. A queue retry must never duplicate a financial posting.

6. Queue payloads must contain references, not secrets or authoritative financial balances.

7. Workers must reload canonical resource state before acting.

8. Every job must verify organization/resource ownership.

9. Financial correctness must rely on PostgreSQL locks and constraints, not Redis locks alone.

10. External transient errors may retry with bounded backoff and jitter.

11. Permanent auth/permission/config errors must not retry indefinitely.

12. Long-running operations must support progress/checkpoints where practical.

13. Large backfills must be chunked.

14. Historical backfills must not starve critical current operations.

15. Job priority must reflect business urgency.

16. Scheduled work must be recoverable after Redis loss.

17. Scheduler execution must be deduplicated across replicas.

18. User-facing domain run status must live in PostgreSQL, not only BullMQ.

19. Transactional outbox must protect important after-commit events.

20. Outbox delivery must itself be idempotent.

21. Failed outbox events must never be silently discarded.

22. Realtime/notification failures must not invalidate committed financial events.

23. Queue cancellation must never interrupt an atomic financial transaction halfway.

24. Workers must shut down gracefully.

25. Secrets must never be stored in queue payloads.

26. Dead-letter/failed jobs must remain inspectable and retryable.

27. Completed BullMQ history is not permanent audit history.

28. Report and sync workers must respect database/API capacity.

29. Unknown or stale jobs must fail safely rather than guess.

30. Queue architecture must favor recoverability over temporary throughput.
```

---

# 226. Queue and Workers Golden Rule

> **A background job is never trusted merely because it exists in Redis. The worker must always return to canonical PostgreSQL state, verify what still needs to happen, execute the smallest safe operation, and make duplicate delivery harmless. Redis coordinates work; PostgreSQL preserves truth.**
