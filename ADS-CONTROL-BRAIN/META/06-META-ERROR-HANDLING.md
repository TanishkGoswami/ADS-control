# Meta Error Handling

## Overview

Ye document define karta hai ki Meta Marketing API ke errors ko system me kaise capture, classify, retry, surface aur resolve kiya jayega.

Meta integration distributed external dependency hai.

Failures normal operating condition ka part hain.

System ko safely handle karna hoga:

```text
Authentication failures

Permission failures

Asset access failures

Invalid requests

Unsupported fields

Rate limiting

Temporary Meta failures

Network errors

Timeouts

Partial pagination failures

Async Insights failures

Malformed/unexpected responses

API-version incompatibilities
```

Core principle:

> **A Meta API failure must reduce confidence in external data, not corrupt internal business or financial truth.**

---

# 1. Error Handling Goals

Error-handling layer ko ensure karna hai:

```text
Correct error classification

Safe retries

No infinite retry loops

No duplicate sync side effects

Useful diagnostics

Credential redaction

Connection health updates

Freshness degradation

Alert generation

Recovery after transient failures
```

---

# 2. Meta Error ≠ Business Error

Meta API error ka meaning:

```text
External operation failed
```

It does not automatically mean:

```text
Client fund lost

Vendor payable changed

Ad Account restricted

Campaign deleted

Spend = 0
```

---

# 3. Error Layers

Errors ko at least these layers me separate karo:

```text
TRANSPORT ERROR

HTTP ERROR

META API ERROR

MAPPING ERROR

SYNC ERROR

BUSINESS RECONCILIATION ERROR
```

---

# 4. Transport Error

Examples:

```text
DNS failure

Connection refused

TLS failure

Socket reset

Timeout
```

No trustworthy Meta response received.

---

# 5. HTTP Error

Meta endpoint responds with non-success HTTP status.

Example:

```text
400

401

403

429

500
```

But HTTP status alone final classification ke liye enough nahi hai.

---

# 6. Meta Structured Error

Meta API responses can contain structured error information.

Meta's current official Python Business SDK `FacebookRequestError` parses fields including:

```text
message

code

error_subcode

type

is_transient
```

and retains:

```text
HTTP status

HTTP headers

response body
```

for failed requests.

---

# 7. Error Fields To Capture

Recommended normalized error record:

```text
http_status

meta_error_code

meta_error_subcode

meta_error_type

meta_error_message

is_transient

fbtrace_id / provider trace reference if present

request_category

endpoint_category

connection_id

asset_id

sync_run_id
```

---

# 8. Do Not Branch on Message Text

Bad:

```text
if message contains "permission"
```

because:

```text
Message wording may change

Localization may change

Different failures may share generic text
```

Prefer:

```text
Structured code

Subcode

HTTP status

is_transient

Request context
```

---

# 9. Preserve Human Message

Although message text should not drive core machine logic, preserve safe text for:

```text
Diagnostics

Admin UI

Support investigation
```

---

# 10. User-Facing Meta Error Text

Meta responses may contain fields such as:

```text
error_user_title

error_user_msg
```

in some error payloads.

These may be useful for diagnostics/user explanation, but should not become stable machine keys. Examples in Meta SDK issue traces show these fields alongside code, subcode and transient state.

---

# 11. Error Taxonomy

Recommended internal categories:

```text
AUTH_ERROR

PERMISSION_ERROR

ASSET_ACCESS_ERROR

RATE_LIMIT

INVALID_REQUEST

UNSUPPORTED_FIELD

RESOURCE_NOT_FOUND

TRANSIENT_META_ERROR

META_SERVER_ERROR

NETWORK_ERROR

TIMEOUT

RESPONSE_PARSE_ERROR

DATA_VALIDATION_ERROR

PAGINATION_ERROR

ASYNC_REPORT_ERROR

API_VERSION_ERROR

UNKNOWN_ERROR
```

---

# 12. AUTH_ERROR

Meaning:

> Connection credential/authentication is no longer valid enough for required API usage.

Possible triggers:

```text
Invalid/expired access authorization

Token rejected

Authentication-related API response

Reconnect required
```

---

# 13. AUTH_ERROR Response

System should generally:

```text
Stop normal dependent sync

Set MetaConnection = AUTH_REQUIRED

Create/update connection-level alert

Preserve existing data

Require reconnect/credential repair
```

---

# 14. Do Not Aggressively Retry Auth Error

If credential is invalid:

```text
Retrying every 10 seconds
```

will not fix it.

Treat as:

```text
NON_RETRYABLE
```

until auth state changes.

---

# 15. Connection-Level Auth Failure

If token fails globally:

Do not mark every child Ad Account:

```text
ACCESS_LOST
```

Correct:

```text
Connection AUTH_REQUIRED
```

---

# 16. PERMISSION_ERROR

Meaning:

> Authentication may be valid, but required API permission/capability is unavailable.

Examples:

```text
ads_read unavailable

business-management capability unavailable

Endpoint requires scope not granted
```

---

# 17. Permission Error Scope

Determine whether error is:

```text
Connection-wide
```

or:

```text
Feature-specific
```

---

# 18. Feature-Specific Permission Failure

Example:

```text
Insights works

Business Portfolio discovery fails
```

Connection may become:

```text
DEGRADED
```

not fully blocked.

---

# 19. Critical Permission Failure

If core spend sync requires permission and it is missing:

```text
SPEND sync should stop

Spend freshness should age

Alert should open
```

---

# 20. ASSET_ACCESS_ERROR

Meaning:

Connection works generally but specific asset cannot be accessed.

Example:

```text
AD1 readable

AD2 denied
```

---

# 21. Asset Access Failure Flow

```text
Confirm connection healthy
↓
Confirm failure is asset-specific
↓
Retry if potentially transient
↓
Direct targeted verification
↓
If confirmed:
ACCESS_LOST / ACCESS_DENIED
```

---

# 22. One Failure Is Not Access Lost

A single:

```text
403

timeout

temporary error
```

should not immediately mark asset permanently inaccessible.

---

# 23. RATE_LIMIT

Meaning:

Meta is applying usage/backpressure limits to requests.

Rate limit is:

```text
Scheduling / throughput problem
```

not:

```text
Financial inconsistency
```

---

# 24. Rate-Limit Response

Recommended actions:

```text
Reduce concurrency

Delay retries

Pause low-priority jobs

Preserve high-priority capacity

Keep existing values

Allow freshness to age naturally
```

---

# 25. Capture Response Headers

Meta Business SDK response objects preserve HTTP headers, so backend adapter should retain relevant safe response-header metadata for diagnostics and usage control when Meta supplies it.

---

# 26. Rate Limit Does Not Mean Zero Data

If spend request is throttled:

Correct:

```text
Last known spend:
₹50,000

Freshness:
STALE
```

Incorrect:

```text
Spend:
₹0
```

---

# 27. INVALID_REQUEST

Meaning:

Request itself is invalid.

Examples:

```text
Invalid parameter

Invalid date range

Malformed ID

Invalid field combination

Bad query structure
```

---

# 28. Invalid Request Retry Policy

Normally:

```text
NON_RETRYABLE
```

until request/configuration/code changes.

---

# 29. Error Code 100-Type Scenarios

Meta errors commonly use structured code/subcode combinations for invalid parameter scenarios, as seen in Meta SDK examples/issues.

System should not generalize:

```text
code 100 = one exact problem
```

because subcodes/context matter.

---

# 30. UNSUPPORTED_FIELD

Typical after:

```text
API upgrade

Field deprecation

Wrong object endpoint

Wrong field combination
```

---

# 31. Unsupported Field Handling

```text
Mark sync failed for affected domain

Do not retry indefinitely

Create developer/admin alert

Preserve last valid data

Flag API compatibility issue
```

---

# 32. RESOURCE_NOT_FOUND

Possible causes:

```text
Wrong ID

Asset removed

Asset access removed

Wrong endpoint

Stale relationship
```

Do not immediately conclude asset deletion.

---

# 33. Resource Not Found Verification

Before status transition:

```text
Verify connection health

Verify direct asset access

Run complete asset discovery

Check relationship/access
```

---

# 34. TRANSIENT_META_ERROR

Meta error response may explicitly indicate:

```text
is_transient = true
```

The current official Python Business SDK exposes this property, and SDK logic itself retries certain transient upload failures.

---

# 35. Transient Error Policy

Usually:

```text
RETRY
```

with:

```text
Bounded exponential backoff

Jitter

Attempt limit
```

---

# 36. `is_transient` Is Strong Signal

If Meta explicitly says:

```text
is_transient = true
```

treat as retry candidate unless local context says otherwise.

---

# 37. `is_transient = false`

Usually indicates retrying same unchanged request is unlikely to help.

But final classification should still consider:

```text
Error code

Subcode

Request type

Known integration rules
```

---

# 38. META_SERVER_ERROR

Examples:

```text
Meta-side unexpected failure

5xx response
```

Usually retryable within limits.

---

# 39. Server Error Does Not Change Business State

Example:

```text
GET /insights → 500
```

must not produce:

```text
Spend = 0

Ad Account = restricted
```

---

# 40. NETWORK_ERROR

No valid Meta response received.

Examples:

```text
DNS issue

Connection reset

Network unreachable
```

Retryable generally.

---

# 41. TIMEOUT

Request exceeded configured timeout.

Result:

```text
Outcome unknown
```

for write operations.

For read-only V1:

```text
No data update

Retry safely
```

---

# 42. Timeout and Future Write APIs

If future Meta write operation times out:

Do not blindly repeat.

First determine whether operation may have succeeded remotely.

This is especially important for:

```text
Campaign creation

Budget change

Pause/resume
```

---

# 43. RESPONSE_PARSE_ERROR

Meta response received but application cannot parse expected format.

Possible causes:

```text
Unexpected JSON

Provider response change

SDK/parser problem

HTML/proxy response

Malformed body
```

---

# 44. Parse Error Policy

```text
Capture safe raw-response metadata

Do not write guessed data

Mark sync failed/partial

Alert development if recurring
```

---

# 45. DATA_VALIDATION_ERROR

Response parsed but violates internal expectations.

Examples:

```text
Missing required external ID

Invalid currency

Invalid spend value

Impossible date grain
```

---

# 46. Validation Failure

Never substitute:

```text
0

UNKNOWN CLIENT

Agency ownership
```

unless that fallback is explicitly semantically correct.

---

# 47. PAGINATION_ERROR

Occurs when:

```text
Page 1 succeeds

Page 2 succeeds

Page 3 fails
```

Collection sync becomes:

```text
PARTIAL
```

---

# 48. Partial Pagination Rule

Previously stored entities not returned due incomplete pagination must remain.

No deletion/access-loss inference.

---

# 49. Pagination Retry

Possible strategy:

```text
Retry failed page/cursor
```

when safe.

If exhausted:

```text
SyncRun PARTIAL
```

---

# 50. ASYNC_REPORT_ERROR

Applies to Meta Insights asynchronous jobs.

Possible:

```text
Report submission fails

Report processing fails

Polling repeatedly fails

Report expires/unavailable

Result retrieval fails
```

---

# 51. Async Report Submission Failure

Classify original Meta error normally.

No report ID means:

```text
New report can be retried
```

according to error policy.

---

# 52. Async Report Poll Failure

Persist report ID.

Retry polling instead of submitting duplicate reports unnecessarily.

---

# 53. Async Report Final Failure

Sync:

```text
FAILED
```

or:

```text
PARTIAL
```

depending on already-completed ranges.

---

# 54. API_VERSION_ERROR

Possible signs:

```text
Unsupported field

Endpoint behavior changed

Version unsupported/deprecated

Enum/value incompatibility
```

---

# 55. API Version Error Response

```text
Stop repeated identical failures

Create engineering alert

Preserve previous Meta state

Run compatibility investigation
```

---

# 56. UNKNOWN_ERROR

Use when no trusted classification rule matches.

Correct:

```text
UNKNOWN_ERROR
```

is better than incorrect:

```text
AUTH_ERROR
```

---

# 57. Error Normalizer

Recommended central component:

```text
MetaErrorMapper
```

Input:

```text
HTTP Status

Headers

Response Body

Exception

Request Context
```

Output:

```text
category

retryability

severity_hint

connection_impact

asset_impact

normalized_code

diagnostic_metadata
```

---

# 58. Error Classification Order

Recommended conceptual order:

```text
1. Transport failure?

2. Structured Meta error available?

3. Authentication-specific?

4. Permission/access-specific?

5. Rate limit?

6. Transient flag?

7. Server-side/5xx?

8. Invalid request?

9. Resource/access issue?

10. Unknown
```

---

# 59. Do Not Use HTTP Status Alone

Example:

Meta may return useful structured API error details even inside generic HTTP failure.

Always inspect:

```text
HTTP status
+
Meta error body
```

---

# 60. Error Code + Subcode

Store both separately.

Recommended machine key:

```text
meta_error_code
+
meta_error_subcode
```

where present.

---

# 61. Error Catalog

Maintain internal versioned catalog:

```text
MetaErrorRule
```

Conceptually:

```text
code

subcode

category

retry_policy

connection_effect

asset_effect

notes

last_verified_api_version
```

---

# 62. Do Not Hardcode Massive Unverified Catalog

Only add mappings that are:

```text
Currently documented

Observed and verified

Covered by tests
```

Unknown codes go through generic safe handling.

---

# 63. Error Rule Version

Example:

```text
META_ERROR_RULESET_V1
```

Useful when Meta changes API behavior.

---

# 64. Retryability

Recommended normalized states:

```text
RETRYABLE

NON_RETRYABLE

RETRY_AFTER_AUTH

RETRY_AFTER_PERMISSION

RETRY_AFTER_CONFIG_FIX

UNKNOWN
```

---

# 65. RETRYABLE

Examples:

```text
Network error

Timeout on read

Transient Meta error

Selected server failures

Rate-limit condition after delay
```

---

# 66. NON_RETRYABLE

Examples:

```text
Malformed request

Unsupported field

Bad internal parameter

Known impossible operation
```

---

# 67. RETRY_AFTER_AUTH

Do not auto-loop.

Resume after:

```text
Reconnect

Credential replacement
```

---

# 68. RETRY_AFTER_PERMISSION

Resume after:

```text
Permission restored

Asset assignment restored
```

---

# 69. RETRY_AFTER_CONFIG_FIX

Example:

```text
Field removed in API v26

Developer changes requested fields
```

---

# 70. Exponential Backoff

Recommended conceptual delays:

```text
Attempt 1 → short

Attempt 2 → longer

Attempt 3 → longer

Attempt 4 → capped
```

Actual values configurable.

---

# 71. Add Jitter

Without jitter:

many failed workers may retry simultaneously.

With jitter:

```text
retry_delay
=
backoff
+
randomized small variance
```

---

# 72. Retry Limits

Example starting policy:

```text
Network/Transient:
3–5 attempts

Invalid request:
0 automatic retries

Auth:
0 repeated normal retries

Permission:
0 repeated normal retries
```

Exact numbers configurable.

---

# 73. Retry Does Not Mutate Same Sync History Invisibly

Track:

```text
attempt_count
```

and failure history.

---

# 74. Job-Level Retry

BullMQ can perform technical retry.

Domain SyncRun should still retain:

```text
attempt count

last error

final status
```

---

# 75. Page-Level Retry

For paginated calls:

retry failed page rather than restart all previous pages if safe.

---

# 76. Whole-Sync Retry

If consistency/completeness requires:

create new retry run or resume failed run using checkpoint.

Avoid ambiguous hidden reset.

---

# 77. Retry Idempotency

All retryable read sync operations must support duplicate-safe:

```text
upsert
```

behavior.

---

# 78. Circuit Breaker

Use when repeated failures indicate systemic connection/provider problem.

States:

```text
CLOSED

OPEN

HALF_OPEN
```

---

# 79. CLOSED Circuit

Normal requests allowed.

---

# 80. OPEN Circuit

Normal requests paused temporarily.

Useful for:

```text
Repeated auth failures

Persistent Meta outage

Severe rate-limit pressure
```

---

# 81. HALF_OPEN

Allow small probe.

If succeeds:

```text
CLOSED
```

If fails:

```text
OPEN
```

---

# 82. Circuit Scope

Could be:

```text
Global Meta

App

Connection

Endpoint family
```

depending on failure.

---

# 83. Do Not Open Global Circuit for One Bad Ad Account

Scope failure narrowly.

---

# 84. Connection Circuit

Good for:

```text
Invalid token
```

affecting all assets under connection.

---

# 85. Endpoint Circuit

Possible for:

```text
Insights endpoint widespread 5xx
```

while status endpoint still works.

---

# 86. Rate-Limit Pressure Control

Scheduler can dynamically:

```text
Lower worker concurrency

Delay backfill

Reduce low-priority refreshes
```

---

# 87. Priority During Degradation

Recommended order:

```text
Critical manual refresh

Restricted-account status

Active-account status

Recent spend

Campaign sync

Asset discovery

Historical backfill
```

---

# 88. Backfill First to Pause

During rate pressure:

historical backfill should be throttled before operational status.

---

# 89. Freshness Degradation

Repeated sync error affects:

```text
freshness_status
```

not canonical financial balance.

---

# 90. Example

Last successful spend:

```text
12:00
₹30,000
```

Failures:

```text
12:15
12:30
12:45
```

At threshold:

```text
Spend:
₹30,000 last known

Freshness:
STALE
```

---

# 91. Freshness Recovery

Next success:

```text
13:00
```

sets:

```text
Freshness = FRESH
```

and resolves stale alert where appropriate.

---

# 92. Error Does Not Erase Last Success

Keep:

```text
last_attempt_at

last_failure_at

last_success_at
```

separate.

---

# 93. Consecutive Failure Count

Track per:

```text
Connection + Sync Domain

Account + Sync Domain
```

where useful.

---

# 94. Example

```text
status_consecutive_failures = 4

spend_consecutive_failures = 0
```

Meaning:

Spend works but account status endpoint is failing.

---

# 95. Reset Failure Count

On successful trustworthy sync:

```text
consecutive_failures = 0
```

---

# 96. Alert Threshold

Example:

```text
1 transient error
→ no alert / log only

3 consecutive failures
→ WARNING

Stale + critical account
→ HIGH
```

Configurable.

---

# 97. Error Alert Categories

Recommended:

```text
META_AUTH_REQUIRED

META_PERMISSION_ERROR

META_ASSET_ACCESS_ERROR

META_RATE_LIMIT_PRESSURE

META_SYNC_FAILED

META_SYNC_PARTIAL

META_DATA_STALE

META_API_COMPATIBILITY_ERROR
```

---

# 98. Alert Deduplication

Do not create:

```text
100 META_AUTH_REQUIRED alerts
```

for one broken connection.

Create one parent incident.

---

# 99. Parent-Child Error Incident

Connection auth error:

```text
Parent Alert:
MC-001 AUTH_REQUIRED

Affected Assets:
200
```

Better than 200 independent alerts.

---

# 100. Asset-Specific Alert

Use individual alert when:

```text
Only AD-002 access denied
```

while connection healthy.

---

# 101. Alert Resolution

When issue clears:

```text
Re-run successful

Health restored

Freshness restored
```

then resolve related active alert.

---

# 102. Preserve Historical Alert

Do not delete resolved error alert.

---

# 103. SyncError Record

Recommended fields:

```text
id

organization_id

sync_run_id

meta_connection_id

entity_type

entity_id

external_entity_id

endpoint_category

error_category

http_status

meta_error_code

meta_error_subcode

meta_error_type

safe_message

is_transient

retryable

attempt_no

provider_trace_id

created_at
```

---

# 104. `safe_message`

Sanitized error message suitable for storage.

No:

```text
Access tokens

App secret

Auth headers
```

---

# 105. Request Metadata

Safe metadata may include:

```text
HTTP method

API version

Endpoint category

Requested field names

Date range

Pagination page number
```

---

# 106. Request URL Logging

Avoid logging full URL if token can appear in query string.

Store normalized route:

```text
/{version}/{ad_account}/insights
```

not sensitive query.

---

# 107. Query Parameter Redaction

Redact:

```text
access_token

appsecret_proof

secret-like values
```

---

# 108. Authorization Header

Never persist.

---

# 109. Response Body Redaction

Most errors are safe operational metadata, but perform structured sanitization before storage/logging.

---

# 110. Logging Levels

Possible:

```text
DEBUG
INFO
WARN
ERROR
FATAL
```

---

# 111. Expected Retryable Failure

First network timeout:

```text
WARN
```

not necessarily ERROR/FATAL.

---

# 112. Final Exhausted Retry

```text
ERROR
```

---

# 113. Connection Auth Broken

```text
ERROR
```

plus user-action alert.

---

# 114. Financial Corruption Risk

If Meta error somehow exposes internal consistency issue:

```text
CRITICAL
```

But Meta request failure alone isn't financial corruption.

---

# 115. Structured Logs

Recommended:

```text
event = META_API_REQUEST_FAILED

connection_id

sync_run_id

error_category

meta_code

subcode

http_status

retryable

attempt
```

Avoid free-text-only logs.

---

# 116. Correlation ID

Every API call should have:

```text
request_id
```

and ideally:

```text
sync_run_id

queue_job_id
```

---

# 117. Provider Trace ID

If Meta response provides trace ID such as:

```text
fbtrace_id
```

store it safely for debugging/support.

Examples of Meta error payloads show `fbtrace_id` alongside structured error details.

---

# 118. Sentry

Unexpected application exceptions should be reported with:

```text
Organization internal ID

Connection internal ID

Sync Run ID

Endpoint category

Normalized error category
```

No secrets.

---

# 119. Expected Meta Errors vs Application Bugs

Do not send every expected permission error to engineering exception tracker as unhandled exception.

Use structured domain error handling.

Sentry primarily for:

```text
Unexpected code crash

Unhandled parser failure

DB transaction failure

Invariant violation
```

---

# 120. HTTP Timeout Configuration

Every Meta request needs timeout.

Separate possible:

```text
Connection timeout

Read timeout

Overall operation timeout
```

depending on HTTP client.

---

# 121. Never Infinite Wait

Worker must eventually:

```text
success

retry

fail
```

---

# 122. Request Cancellation

If worker/job cancelled:

abort HTTP request where supported.

Do not leave long useless connection.

---

# 123. Async Insights Poll Error

If polling endpoint transiently fails:

retry poll.

Do not submit duplicate async report immediately.

---

# 124. Async Insights Report Error

Store:

```text
report_run_id

report_status

last_poll_at

poll_attempts

last_error
```

---

# 125. Async Report Result Pagination Error

If report ready but result page fails:

retry result retrieval.

Report itself doesn't need to be regenerated immediately.

---

# 126. Error During Database Upsert

Meta call succeeds but DB write fails.

This is:

```text
INTERNAL_PERSISTENCE_ERROR
```

not Meta error.

---

# 127. Persistence Error Handling

```text
Rollback affected DB transaction

Retry safe chunk

Do not mark SyncRun SUCCESS
```

---

# 128. DB Failure Does Not Need Another Meta Call Immediately

If response can safely be retained/processed within current retry architecture, avoid wasting API capacity.

But implementation complexity may make safe re-fetch acceptable.

---

# 129. Mapper Error

Raw Meta response valid but mapper crashes.

Classification:

```text
MAPPING_ERROR
```

Engineering issue.

---

# 130. Mapping Error Safety

Do not partially write malformed entity.

Store error.

Preserve previous valid entity.

---

# 131. Unknown Enum Value

Not necessarily full failure.

Example:

```text
new Meta status value
```

Safe handling:

```text
Store raw value

Map normalized = UNKNOWN

Create compatibility warning
```

---

# 132. Missing Optional Field

Should not fail sync if field truly optional.

---

# 133. Missing Required Field

Example:

```text
Ad Account response without ID
```

cannot canonicalize safely.

Reject row and mark sync partial/error.

---

# 134. Batch/Collection Error Isolation

One malformed record should not necessarily discard 999 valid records.

Recommended:

```text
Record-level error isolation
```

where safe.

---

# 135. Critical Collection Failure

If failure means completeness cannot be established:

whole discovery run:

```text
PARTIAL
```

even if many records were saved.

---

# 136. Error and Missing Asset Detection

Never run missing-asset cleanup against:

```text
PARTIAL

FAILED
```

discovery.

---

# 137. Error and Relationship Closure

Same rule:

Do not close old:

```text
Portfolio → Ad Account
```

relationships based on incomplete sync.

---

# 138. Error and Campaign Archive

Incomplete campaign pagination must not archive unseen campaigns.

---

# 139. Error and Spend

Failed spend row/day should be:

```text
missing/unverified
```

not:

```text
₹0 spend
```

---

# 140. Zero vs Missing

Critical distinction:

```text
Meta successfully reports spend = 0
```

is verified zero.

```text
Spend API failed
```

is unknown.

---

# 141. Error and Status

Failed status fetch:

```text
last-known status retained
+
freshness ages
```

---

# 142. Error and Reconciliation

If required Meta data stale:

Reconciliation case may move to:

```text
WAITING_FOR_SYNC
```

---

# 143. Do Not Resolve Difference on API Failure

A missing observed value is not a match.

---

# 144. Error and Ledger

Meta error handler must never directly execute:

```text
Ledger adjustment

Write-off

Ownership transfer

Vendor settlement
```

---

# 145. Error and Locked Funds

Meta status request failure alone must not lock funds.

Lock workflow requires confirmed operational condition/business rule.

---

# 146. Error and Vendor Liability

No Meta API error modifies:

```text
Vendor Payable
```

---

# 147. Error and Client Wallet

No Meta API error directly reduces:

```text
Client Wallet
```

---

# 148. Graceful Degradation

During Meta outage users should still be able to:

```text
View ledger

Post client payments

Manage vendor financial records

View historical data

View last-known Meta status

View reconciliation
```

subject to workflow rules.

---

# 149. Disable Only Dependent Features

Example:

Meta outage should disable:

```text
Live Meta Refresh
```

not entire app.

---

# 150. UI Error Presentation

Normal user should see:

```text
Meta data could not be refreshed.
Last successful sync: 14:10.
```

not giant raw JSON stack trace.

---

# 151. Admin Error Detail

Admin can view:

```text
Error category

Code/subcode

HTTP status

Safe Meta message

Connection

Affected endpoint

Retry state

Trace ID
```

---

# 152. User Actionable Errors

Examples:

```text
Reconnect Meta account

Restore permission

Restore asset access
```

Provide explicit action.

---

# 153. Non-User-Actionable Errors

Example:

```text
Temporary Meta server error
```

UI:

```text
Automatic retry scheduled
```

No reconnect button needed.

---

# 154. Error State and Manual Retry

Manual retry available for:

```text
Failed sync

Partial sync

Temporary server/network issue
```

where safe.

---

# 155. Do Not Offer Retry for Invalid Credential Without Reconnect

Better:

```text
Reconnect Meta
```

---

# 156. Error State and Queue Dedup

Manual retry must not enqueue 10 duplicate jobs while automatic retry already active.

---

# 157. Retry Status UI

Show:

```text
Attempt 2 of 4

Next retry scheduled
```

where useful for admin.

---

# 158. Error Dashboard

Metrics:

```text
Connections with auth problems

Permission errors

Failed syncs

Partial syncs

Rate-limit pressure

Stale accounts

Top recurring error categories
```

---

# 159. Error Trend Report

Useful:

```text
Errors by day

Error category

Connection

Endpoint

API version
```

---

# 160. API-Version Regression Detection

If after version upgrade:

```text
UNSUPPORTED_FIELD errors spike
```

trigger compatibility alert.

---

# 161. Deployment Correlation

Record:

```text
application_version
```

with errors where practical.

Helps identify deployment regression.

---

# 162. Meta API Version

Every error record should know:

```text
meta_api_version
```

used for request.

---

# 163. SDK Version

If using Meta Business SDK:

record deployed SDK version at application observability level.

---

# 164. Error Fingerprint

Useful dedup key:

```text
connection

endpoint category

error code

subcode

asset

normalized category
```

---

# 165. Error Episode

Repeated identical error can form one incident episode.

Example:

```text
15 failures over 2 hours
```

rather than 15 dashboard incidents.

---

# 166. Error Episode Fields

```text
first_seen_at

last_seen_at

occurrence_count

status

latest_sync_run_id
```

---

# 167. Recovery Detection

When previously failing request succeeds:

```text
Close active error episode
```

and reset counters.

---

# 168. Error Auto-Resolution

Suitable for:

```text
Transient failure

Stale-data alert

Rate-limit incident
```

once healthy.

---

# 169. Auth Error Resolution

Resolve only after:

```text
Reconnect/credential restoration
+
Successful validation
```

---

# 170. Permission Error Resolution

Resolve after required capability test succeeds.

---

# 171. Asset Access Error Resolution

Resolve after asset becomes successfully accessible again.

---

# 172. False Positive

Admin may label diagnostic alert false positive, but underlying error records remain.

---

# 173. Error Data Retention

Retain enough history to analyze:

```text
Recurring connection problems

Meta API version migrations

Rate-limit trends

Asset access history
```

Retention duration configurable.

---

# 174. Sensitive Data Retention

Never retain secrets just because error occurred.

---

# 175. Test Cases — Authentication

Test:

```text
Valid token

Expired/invalid token

Reconnect success

Reconnect failure

Connection-wide auth loss
```

---

# 176. Test Cases — Permissions

```text
ads_read available

ads_read missing

business capability missing

Single asset permission removed

Permission restored
```

---

# 177. Test Cases — Transport

```text
DNS error

Connection reset

Timeout

Temporary network outage
```

---

# 178. Test Cases — Meta Server

```text
Transient Meta error

5xx

Transient flag true

Repeated temporary failure

Recovery
```

---

# 179. Test Cases — Request Validation

```text
Invalid field

Invalid date range

Malformed ID

Unsupported field after API upgrade
```

---

# 180. Test Cases — Rate Limit

```text
Single rate-limit event

Repeated rate pressure

Backfill throttling

Critical job priority

Recovery
```

---

# 181. Test Cases — Pagination

```text
Page 1 success / page 2 fail

Retry page 2 success

Permanent page failure

No missing-asset cleanup on partial run
```

---

# 182. Test Cases — Async Insights

```text
Submission fails

Report pending

Poll transient error

Report completes

Result pagination fails

Final report failure

Worker restarts mid-report
```

---

# 183. Test Cases — Parser

```text
Valid JSON

Invalid JSON

Missing error body

Unknown error structure

Unknown enum value
```

---

# 184. Test Cases — Financial Safety

When Meta fails verify:

```text
Client wallet unchanged

Vendor payable unchanged

Ledger unchanged

Locked fund unchanged unless separate confirmed workflow

Last-known Meta data preserved
```

---

# 185. Test Cases — Duplicate Retry

Same failed job delivered twice:

```text
No duplicate entity

No duplicate SpendFact

No duplicate status-history event

No duplicate financial event
```

---

# 186. Chaos Testing

Useful staging scenarios:

```text
Artificial timeout

Injected 500 response

Injected permission failure

Redis worker restart

DB transient failure

Partial pagination
```

---

# 187. V1 Error Handling Components

Recommended:

```text
MetaApiClient

MetaErrorMapper

MetaRetryPolicy

MetaRateController

MetaSyncErrorService

MetaConnectionHealthService

MetaCircuitBreaker

SyncRunService

AlertService
```

---

# 188. Error Classes in NestJS

Possible internal classes:

```text
MetaAuthError

MetaPermissionError

MetaAssetAccessError

MetaRateLimitError

MetaInvalidRequestError

MetaTransientError

MetaServerError

MetaNetworkError

MetaMappingError

MetaUnknownError
```

Exact class names implementation detail.

---

# 189. Domain Result Pattern

Instead of throwing raw SDK exceptions throughout app:

```text
MetaAdapter
↓
Normalized Meta Error
↓
Domain Service
```

---

# 190. SDK Independence

If project later replaces SDK with direct HTTP client:

business error handling should remain largely unchanged.

---

# 191. Recommended Error DTO

Conceptually:

```text
NormalizedMetaError {
  category
  httpStatus
  metaCode
  metaSubcode
  metaType
  message
  transient
  retryability
  providerTraceId
  endpointCategory
}
```

---

# 192. Error Mapper Must Never Contain Secrets

Input can contain sensitive request context.

Output DTO must be sanitized.

---

# 193. Error Policy Matrix

Conceptual:

| Category             |    Auto Retry | Connection State     | Data Effect       |
| -------------------- | ------------: | -------------------- | ----------------- |
| AUTH_ERROR           |            No | AUTH_REQUIRED        | Keep last known   |
| PERMISSION_ERROR     |    Usually No | DEGRADED/BLOCKED     | Keep last known   |
| ASSET_ACCESS_ERROR   |  Verify first | Asset-specific       | Keep history      |
| RATE_LIMIT           |  Yes, delayed | Usually unchanged    | Freshness may age |
| INVALID_REQUEST      |            No | Usually unchanged    | Sync fails        |
| TRANSIENT_META_ERROR |           Yes | unchanged initially  | Keep last known   |
| META_SERVER_ERROR    |           Yes | unchanged initially  | Keep last known   |
| NETWORK_ERROR        |           Yes | UNKNOWN if prolonged | Keep last known   |
| TIMEOUT              | Yes for reads | unchanged initially  | Keep last known   |
| API_VERSION_ERROR    |  No until fix | DEGRADED             | Keep last known   |

---

# 194. Retry Policy Must Be Endpoint-Aware

Read-only GET:

```text
Generally safe to retry
```

Future write request:

```text
May require remote-result verification first
```

---

# 195. V1 Advantage

Because V1 Meta integration is primarily read-only:

retry safety is simpler.

Still ensure:

```text
DB upserts are idempotent
```

---

# 196. Error and Full Connection Sync

If:

```text
Asset Discovery SUCCESS

Status SUCCESS

Campaign SUCCESS

Spend FAILED
```

parent run:

```text
PARTIAL
```

not:

```text
SUCCESS
```

---

# 197. Critical Child Definitions

Parent orchestration should define which children are:

```text
REQUIRED

OPTIONAL
```

for success.

---

# 198. Optional Child Failure

Example optional historical backfill fails after current sync succeeds.

Parent may be:

```text
PARTIAL
```

with current operational data still usable.

---

# 199. Connection Health Derivation

Possible inputs:

```text
Auth health

Permission health

Recent required sync success

Consecutive failure count

Data freshness
```

---

# 200. Connection Health Values

Recommended:

```text
HEALTHY

DEGRADED

AUTH_REQUIRED

BLOCKED

UNKNOWN

DISABLED
```

---

# 201. HEALTHY

Required operations succeeding.

---

# 202. DEGRADED

Core connection partially works but some domain is failing.

---

# 203. UNKNOWN

Cannot reliably assess because verification itself failed.

---

# 204. Global Meta Outage

If many unrelated connections fail similarly:

system should suspect provider-wide issue.

Do not mark each token invalid automatically.

---

# 205. Provider Incident Heuristic

Potential:

```text
High rate of 5xx/network failures
across many connections
```

→ global incident indicator.

---

# 206. Global Incident Response

```text
Throttle retries

Preserve queues

Mark Meta integration degraded

Show system banner

Keep finance available
```

---

# 207. Do Not Auto-Reconnect During Provider Outage

Reconnect won't fix Meta-wide server failure.

---

# 208. Error Handling During Deployment

Workers should finish or safely requeue jobs during graceful shutdown.

---

# 209. Graceful Shutdown

Worker receives termination:

```text
Stop accepting new jobs

Allow current small operation to finish

Release locks

Persist async state

Exit
```

---

# 210. Error During Shutdown

If operation interrupted:

queue retry later.

Idempotency prevents duplication.

---

# 211. Database Transaction Error

If upsert transaction deadlocks/fails transiently:

retry database operation according to DB policy.

Do not misclassify as Meta failure.

---

# 212. Separate Provider and Internal Errors

Recommended top-level source:

```text
META_PROVIDER

NETWORK

DATABASE

APPLICATION

QUEUE
```

---

# 213. Why Error Source Matters

Admin can distinguish:

```text
Meta is down
```

from:

```text
Our database is failing
```

---

# 214. Error Ownership Routing

```text
AUTH/PERMISSION
→ Admin / Integration Owner

ASSET ACCESS
→ Ads Manager + Admin

RATE LIMIT / API VERSION
→ Engineering/Admin

STALE SPEND
→ Ads Ops + Finance if relevant

INTERNAL DB ERROR
→ Engineering
```

---

# 215. Financial Team Notifications

Do not notify finance for every Meta timeout.

Notify when error causes material:

```text
Reconciliation delay

Locked-fund uncertainty

High-spend account stale data

Refund/recovery uncertainty
```

---

# 216. Admin Error Detail Page

Recommended sections:

```text
Summary

Normalized Classification

Meta Error Details

Request Context

Retry History

Connection Health

Affected Assets

Sync Runs

Related Alerts

Timeline
```

---

# 217. Safe Raw Body Access

Raw response view should be:

```text
Admin-only

Sanitized

Possibly retained for limited period
```

---

# 218. Error Export

Operational report can include:

```text
Timestamp

Connection

Asset

Category

Code

Subcode

HTTP Status

Retryable

Resolved At
```

No secrets.

---

# 219. Error Aging

Track unresolved error episode age.

Long-lived:

```text
AUTH_REQUIRED

PERMISSION_ERROR

ASSET_ACCESS_ERROR
```

should escalate.

---

# 220. Rate Limit Aging

Rate-limit alert may resolve automatically once healthy request throughput resumes.

---

# 221. Error Recovery Audit

When user fixes connection:

record:

```text
Reconnect requested

Permission restored

Connection validated

Sync resumed
```

---

# 222. No Manual "Mark Healthy"

Connection should not become HEALTHY only because admin clicks:

```text
Resolve
```

Require successful capability validation.

---

# 223. Manual Dismiss vs Technical Recovery

Dismiss notification:

```text
does not change connection health
```

---

# 224. Error Handling and Audit Trail

Important events:

```text
Auth failed

Connection disabled

Reconnect completed

Permission changed

Asset access lost

API compatibility issue detected
```

should remain auditable.

---

# 225. V1 Required Error Features

```text
Structured Meta error parsing

Central error taxonomy

HTTP status capture

Meta code/subcode capture

Transient flag support

Retry policy

Exponential backoff

Jitter

Attempt limits

Rate-pressure handling

Connection health updates

Asset-specific access handling

Pagination partial-state handling

Async report failure handling

Data freshness degradation

Alert deduplication

Secret redaction

Provider trace storage

SyncError records

Circuit breaker

Manual retry

Recovery detection
```

---

# 226. Future Error Features

Possible:

```text
Automated global-outage detection

Dynamic concurrency tuning

Historical error analytics

Automatic API upgrade compatibility checks

SLO/error-budget dashboards

Multi-region failover
```

---

# 227. Error Handling Integrity Rules

System must enforce:

```text
1. Raw Meta/HTTP errors must be normalized before business logic consumes them.

2. HTTP status alone must not determine final classification.

3. Meta code and error_subcode must be preserved when available.

4. is_transient should be used as a retry signal when Meta supplies it.

5. Human error message strings must not be the sole machine decision key.

6. Authentication failures must not be retried indefinitely.

7. Permission failures must not be treated as Meta restrictions.

8. Asset access failure must be distinguished from connection-wide auth failure.

9. Rate limiting must reduce request pressure, not zero stored data.

10. Invalid requests must not retry endlessly.

11. Transient errors must use bounded backoff with jitter.

12. Partial pagination must never trigger asset deletion/access-loss inference.

13. Failed spend sync must mean unknown/stale, not zero spend.

14. Failed status sync must preserve last-known status.

15. Meta errors must never directly modify ledger entries.

16. Meta errors must never directly alter client fund ownership.

17. Meta errors must never directly reduce vendor payable.

18. Restriction must not be inferred from timeout/network errors.

19. Secrets must never appear in logs, alerts or SyncError records.

20. Retries must remain idempotent.

21. Async report state must survive worker restart.

22. Provider-wide failures should not invalidate every connection credential.

23. Connection health must recover only after successful validation.

24. Error episodes and their resolution must remain auditable.

25. Internal application/database failures must remain distinguishable from Meta provider failures.
```

---

# 228. Meta Error Handling Golden Rule

> **A Meta failure is evidence that an external operation did not provide a trustworthy result—not evidence that internal money, ownership or history changed. Every error must therefore be classified, safely retried or escalated, preserve the last known valid data, expose uncertainty through freshness and alerts, and never silently alter the financial ledger or business truth.**
