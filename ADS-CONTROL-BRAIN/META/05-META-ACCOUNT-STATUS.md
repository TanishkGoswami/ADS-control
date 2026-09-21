# Meta Account Status

## Overview

Ye document define karta hai ki Meta Ad Account ki operational health ko system me kaise retrieve, normalize, store, monitor aur business workflows ke saath connect kiya jayega.

Meta account status ka purpose sirf:

```text
ACTIVE / DISABLED
```

show karna nahi hai.

System ko distinguish karna hoga:

```text
Actual Meta restriction

Payment-related issue

Permission/access issue

Meta connection problem

Stale status

Unknown status

Internal archival
```

Core principle:

> **An unavailable Ad Account is not automatically restricted, and a restricted Ad Account does not automatically mean its remaining money has been lost. Account status describes operational usability; financial ownership and financial resolution are separate concerns.**

---

# 1. Status Architecture

Recommended status model:

```text
RAW META STATUS
+
RAW META REASON
+
ACCESS HEALTH
+
DATA FRESHNESS
↓
STATUS NORMALIZER
↓
INTERNAL NORMALIZED STATUS
+
CAN_RUN_ADS
+
STATUS REASON
+
CONFIDENCE
```

---

# 2. Why Raw and Normalized Status Must Be Separate

Meta may expose fields such as:

```text
account_status

disable_reason
```

on the Ad Account object. Meta's current generated Business SDK includes both fields.

These values belong to:

```text
External Meta Truth
```

The application should separately maintain:

```text
normalized_status
```

for stable internal business logic.

---

# 3. Never Store Only Normalized Status

Bad:

```text
normalized_status = RESTRICTED
```

with no source information.

Better:

```text
raw_account_status = ...

raw_disable_reason = ...

normalized_status = RESTRICTED

status_reason_code = ...

source = META_API
```

This makes future debugging possible.

---

# 4. Recommended Internal Statuses

V1:

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

These are internal application states.

They are not intended to duplicate Meta's exact enum names.

---

# 5. Status Dimensions

Do not collapse every account health concept into one field.

Recommended logical dimensions:

```text
META OPERATIONAL STATUS

ACCESS STATUS

FRESHNESS STATUS

INTERNAL LIFECYCLE STATUS
```

---

# 6. Meta Operational Status

Answers:

> According to latest valid Meta observation, can the advertising account operate normally?

Examples:

```text
ACTIVE

RESTRICTED

DISABLED

PAYMENT_ISSUE

UNKNOWN
```

---

# 7. Access Status

Answers:

> Can our integration currently access this account?

Recommended:

```text
ACCESS_OK

ACCESS_DENIED

ACCESS_LOST

ACCESS_UNKNOWN
```

---

# 8. Freshness Status

Answers:

> How current is our knowledge?

Recommended:

```text
FRESH

AGING

STALE

UNKNOWN
```

---

# 9. Internal Lifecycle Status

Answers:

> Does our organization still consider this account operationally in use?

Possible:

```text
ACTIVE

INACTIVE

ARCHIVED
```

This is independent of Meta.

---

# 10. Why Separate Dimensions Matter

Example:

```text
Meta Last Known:
ACTIVE

Access:
ACCESS_DENIED

Freshness:
STALE

Internal Lifecycle:
ACTIVE
```

It would be incorrect to flatten this to:

```text
RESTRICTED
```

---

# 11. ACTIVE

Internal normalized `ACTIVE` means:

```text
Latest valid Meta status indicates account is usable

No known blocking status exists

Access is sufficient for required status check

Status data is fresh enough
```

---

# 12. ACTIVE Does Not Guarantee Campaign Delivery

An account may be operationally active while:

```text
Campaign paused

Budget exhausted

Ad rejected

No campaign running

Billing threshold reached but not blocking
```

Account-level ACTIVE is not equivalent to:

```text
Ads are definitely delivering
```

---

# 13. RESTRICTED

Use `RESTRICTED` when valid Meta account-level information indicates the account is currently restricted/unusable due to a Meta enforcement or account-level restriction condition.

This should come from supported status/reason interpretation.

Do not derive it merely from:

```text
No Spend

Campaign Pause

API Timeout

Permission Error
```

---

# 14. DISABLED

Use when valid Meta source indicates account has been disabled/deactivated in a way distinct from the application's restriction classification.

Exact mapping should be maintained centrally because Meta raw codes/reasons can evolve.

---

# 15. PAYMENT_ISSUE

Use when a valid external account condition indicates billing/payment is the primary operational blocker.

This distinction is valuable because remediation differs from policy restriction.

---

# 16. ACCESS_LOST

Use when:

```text
Canonical Ad Account still exists internally

but

Integration can no longer access it
```

after sufficient verification.

This does not mean Meta account itself is restricted.

---

# 17. UNKNOWN

Use when:

```text
Source values cannot be interpreted safely

Required fields unavailable

Status check incomplete

Unexpected raw value received
```

Unknown is a valid state.

Do not force a confident classification.

---

# 18. STALE

`STALE` represents outdated knowledge.

Recommended implementation:

Keep:

```text
last_known_normalized_status
```

plus:

```text
freshness_status = STALE
```

rather than necessarily replacing operational status with STALE.

---

# 19. Recommended Current-State Model

Prefer fields conceptually like:

```text
normalized_status

access_status

freshness_status

internal_lifecycle_status

can_run_ads
```

instead of one giant status enum.

---

# 20. ARCHIVED

`ARCHIVED` is primarily internal lifecycle state.

It should not imply:

```text
Meta deleted account

Meta restricted account

No funds remain
```

---

# 21. Recommended Ad Account Status Fields

```text
raw_meta_account_status

raw_meta_disable_reason

normalized_status

status_reason_code

access_status

freshness_status

can_run_ads

status_confidence

status_source

last_status_sync_at

last_status_change_at
```

---

# 22. Raw Fields

Store Meta values in their original compatible representation.

Example:

```text
raw_meta_account_status TEXT

raw_meta_disable_reason TEXT
```

or typed values appropriate to response.

Do not reinterpret them permanently at ingestion.

---

# 23. Status Reason Code

Internal reason taxonomy can be stable.

Example:

```text
NONE

POLICY_RESTRICTION

PAYMENT_FAILURE

ACCOUNT_DISABLED

ACCESS_PERMISSION_REMOVED

CONNECTION_AUTH_FAILURE

DATA_STALE

UNRECOGNIZED_META_STATE

OTHER
```

---

# 24. Raw Reason vs Internal Reason

Keep:

```text
raw_meta_disable_reason
```

and:

```text
status_reason_code
```

separate.

---

# 25. Status Confidence

Recommended:

```text
HIGH

MEDIUM

LOW

UNKNOWN
```

Useful when status depends on incomplete signals.

---

# 26. HIGH Confidence

Examples:

```text
Fresh direct account response

Required status fields available

Known status mapper rule matched
```

---

# 27. LOW Confidence

Example:

Account unavailable during a partial connection issue.

Do not call this restriction with high confidence.

---

# 28. Status Source

Possible:

```text
META_API

SYSTEM_DERIVED

ADMIN_OVERRIDE

USER_REPORT

MIGRATION
```

---

# 29. META_API

Normal preferred source for Meta operational status.

---

# 30. SYSTEM_DERIVED

Examples:

```text
STALE

ACCESS_LOST after verified access checks
```

---

# 31. ADMIN_OVERRIDE

Should be rare and should not overwrite raw Meta truth.

Example:

```text
Internal lifecycle set to INACTIVE
```

not pretending Meta status changed.

---

# 32. USER_REPORT

If Ads Manager manually reports account problem before API confirms:

record as:

```text
reported issue
```

not authoritative Meta status.

---

# 33. Status Normalizer

Recommended backend component:

```text
MetaAdAccountStatusMapper
```

Input:

```text
raw Meta fields

access result

freshness information
```

Output:

```text
normalized_status

reason_code

can_run_ads

confidence
```

---

# 34. Centralized Mapping

Do not write:

```text
if status == X
```

throughout:

```text
Dashboard

Finance service

Alert service

Worker

Client service
```

All Meta raw-state interpretation belongs in one mapper.

---

# 35. Mapper Versioning

Recommended:

```text
META_ACCOUNT_STATUS_MAPPER_V1
```

Later:

```text
V2
```

if Meta semantics change.

---

# 36. Why Mapper Versioning Matters

Historical record may have been interpreted under:

```text
V1
```

while new logic uses:

```text
V2
```

This helps explain old status events.

---

# 37. Raw Meta Code Changes

If Meta introduces unknown value:

Correct:

```text
Store raw value

Map to UNKNOWN

Create diagnostic event

Continue safely
```

Incorrect:

```text
Crash sync

or

Assume RESTRICTED
```

---

# 38. Status Sync Request

Status worker should request only required account fields.

At minimum V1 status design should evaluate current availability of:

```text
id

account_status

disable_reason
```

plus any additional currently documented fields required by the final mapper.

Meta's generated Business SDK currently exposes `account_status` and `disable_reason` as Ad Account fields.

---

# 39. Current API Verification Requirement

Before implementing the final production mapper:

verify against the configured Meta API version:

```text
Field availability

Raw status values

Disable reason values

Access/error semantics
```

Do not hardcode mappings solely from old blog posts or screenshots.

---

# 40. `can_run_ads`

Recommended internal derived field:

```text
BOOLEAN NULL
```

Values:

```text
TRUE
FALSE
NULL
```

---

# 41. Why Nullable Boolean

`NULL` means:

```text
Cannot currently determine confidently
```

Different from:

```text
FALSE
```

---

# 42. ACTIVE Mapping

Generally:

```text
normalized_status = ACTIVE

can_run_ads = TRUE
```

if all required source conditions support that conclusion.

---

# 43. Restricted Mapping

Generally:

```text
normalized_status = RESTRICTED

can_run_ads = FALSE
```

---

# 44. Disabled Mapping

Generally:

```text
normalized_status = DISABLED

can_run_ads = FALSE
```

---

# 45. Payment Issue Mapping

Generally:

```text
normalized_status = PAYMENT_ISSUE

can_run_ads = FALSE
```

if payment condition is actually blocking account operation.

---

# 46. ACCESS_LOST Mapping

```text
normalized Meta last-known status:
may remain ACTIVE/RESTRICTED/etc.

access_status:
ACCESS_LOST

can_run_ads:
NULL
```

Prefer this richer model rather than overwriting operational status.

---

# 47. STALE Mapping

Example:

```text
last known status:
ACTIVE

freshness:
STALE

can_run_ads:
NULL or last-known value clearly labeled
```

For safety-critical operation, current `can_run_ads` should become uncertain when freshness exceeds threshold.

---

# 48. Freshness Threshold

Configurable.

Example starting point:

```text
FRESH:
0–10 minutes

AGING:
10–20 minutes

STALE:
20+ minutes
```

Exact values depend on sync cadence and operational need.

---

# 49. Freshness Is Domain-Specific

Status freshness can be:

```text
15 minutes
```

while spend freshness can be:

```text
60 minutes
```

Do not share one threshold.

---

# 50. `last_status_sync_at`

Update only on:

```text
successful trustworthy status observation
```

Not on failed attempt.

---

# 51. `last_status_attempt_at`

Separate optional field:

```text
last_status_attempt_at
```

Useful for debugging failures.

---

# 52. Last Success vs Last Attempt

Example:

```text
Last attempt:
15:10

Last success:
14:40
```

This means data is not fresh just because a worker ran at 15:10.

---

# 53. Status History

Use:

```text
ad_account_status_history
```

for meaningful changes.

---

# 54. Status History Fields

Recommended:

```text
id

ad_account_id

previous_status

new_status

raw_meta_status

raw_disable_reason

reason_code

can_run_ads

source_type

sync_run_id

detected_at

effective_at

mapper_version
```

---

# 55. When to Create Status History

Create when:

```text
Normalized operational status changes

Access state materially changes

Important restriction episode begins/ends
```

---

# 56. Do Not Create History Every Poll

Bad:

```text
15:00 ACTIVE
15:05 ACTIVE
15:10 ACTIVE
15:15 ACTIVE
```

as four status-history events.

Current freshness timestamps are enough.

---

# 57. Restriction Episode

Useful concept:

```text
RestrictionEpisode
```

or recovery case can represent one restriction lifecycle.

Example:

```text
ACTIVE
↓
RESTRICTED
↓
RESTRICTED
↓
ACTIVE
```

This is one restriction episode.

---

# 58. Restriction Episode Start

Triggered on:

```text
non-restricted
→ RESTRICTED
```

Create:

```text
status history

alert

recovery case
```

and initiate financial review.

---

# 59. Restriction Episode End

Triggered after:

```text
RESTRICTED
→ operationally restored
```

But financial recovery may remain open.

---

# 60. Re-Restriction

If account restores and later restricts again:

Create:

```text
new restriction episode
```

not reopen old episode as if continuous.

---

# 61. Restriction Detection Flow

```text
Fetch status
↓
Validate fresh response
↓
Normalize
↓
Compare previous status
↓
New RESTRICTED?
↓
Create history
↓
Create/Update alert
↓
Create recovery case
↓
Evaluate current fund exposure
```

---

# 62. Restriction Does Not Directly Lock Money

Status module emits:

```text
ACCOUNT_RESTRICTED
```

Allocation/finance service calculates:

```text
remaining unspent tracked amounts
```

by owner.

---

# 63. Example

AD1 before restriction:

```text
Client A allocated:
₹5,000

Spent:
₹3,200
```

Restriction detected.

Finance/allocation result:

```text
Client A Locked:
₹1,800
```

Status service should not simply lock ₹5,000.

---

# 64. Multiple Owners

AD1:

```text
Client A remaining:
₹4,000

Agency remaining:
₹2,000
```

Restriction:

```text
Client A Locked:
₹4,000

Agency Locked:
₹2,000
```

Owner identity preserved.

---

# 65. Restricted Does Not Mean Money Lost

Correct state:

```text
Current availability:
0

Locked:
₹6,000
```

Not:

```text
Loss:
₹6,000
```

---

# 66. Restricted Does Not Cancel Vendor Liability

Example:

Vendor-origin operational money is locked.

Vendor payable remains according to ledger.

Ad Account restriction does not automatically reduce what company owes vendor.

---

# 67. Restriction Alert

Recommended:

```text
Type:
AD_ACCOUNT_RESTRICTED

Entity:
Ad Account

Severity:
based on locked exposure + account importance

Status:
OPEN
```

---

# 68. Alert Exposure Amount

After finance layer calculates:

```text
locked/exposed amount
```

alert may display financial exposure.

Status module itself should not invent it.

---

# 69. No-Fund Restriction

If account restricted with:

```text
₹0 tracked remaining funds
```

still create operational alert.

Financial exposure:

```text
₹0
```

---

# 70. Restriction and Active Campaigns

On restriction detection, system may identify:

```text
Active Client Jobs

Mapped Campaigns

Affected Clients
```

for operational review.

---

# 71. Job Status

Do not automatically set client job:

```text
COMPLETED
```

because account restricted.

Possible:

```text
PAUSED / NEEDS_REVIEW
```

according to workflow rules.

---

# 72. Replacement Account Flow

If JOB-001 needs continuity:

```text
Restricted AD1
↓
Assign AD2
↓
Use new valid funding source
```

Do not virtually move locked money from AD1 to AD2.

---

# 73. Why No Virtual Movement

Money locked on AD1 remains:

```text
Location:
AD1 / Locked
```

If agency funds AD2:

that is new separate source/allocation.

---

# 74. Restore Detection

When latest valid Meta status indicates restriction cleared:

```text
RESTRICTED → ACTIVE
```

create restore event.

---

# 75. Restore Does Not Equal Financial Recovery

After status restore:

```text
Locked Funds
```

remain locked internally until verified.

---

# 76. Restore Verification Flow

```text
Meta status ACTIVE
↓
Targeted status refresh
↓
Recent spend refresh
↓
Relevant external balance/billing observation where useful
↓
Internal allocation reconciliation
↓
Determine recoverable amount
↓
Unlock valid amount
```

---

# 77. Example

Locked:

```text
₹5,000
```

Account restores.

New spend discovered during restriction period:

```text
₹500
```

Valid unlock:

```text
₹4,500
```

not ₹5,000.

---

# 78. Late Spend After Restriction

Always possible external data catches up later.

Therefore restore verification should include recent spend refresh.

---

# 79. Partial Recovery

Locked:

```text
₹5,000
```

verified accessible/recoverable:

```text
₹4,000
```

Then:

```text
Unlocked:
₹4,000

Remaining Locked:
₹1,000
```

Do not force all-or-nothing.

---

# 80. Meta Refund After Restriction

If external refund is later detected:

```text
Meta Refund
↓
Reconciliation
↓
Owner Distribution
```

Locked-fund record is resolved only for matched recovered amount.

---

# 81. Permanent Restriction

If account never restores:

locked funds remain:

```text
LOCKED
```

until:

```text
Meta refund

Recovery

Approved write-off

Other explicit resolution
```

---

# 82. Permanent Account Closure ≠ Automatic Write-Off

Operational decision:

```text
"We won't use AD1 again"
```

does not mean:

```text
Locked ₹10,000 disappears
```

---

# 83. Write-Off Flow

If unrecoverable:

```text
Recovery evidence

Reason

Approval

Write-off transaction

Audit
```

required.

---

# 84. Payment Issue

Payment-related blocker deserves separate workflow.

Possible downstream:

```text
Finance alert

Payment method review

Campaign risk warning
```

Not necessarily restriction/recovery case with locked prepaid funds.

---

# 85. Payment Issue and Locked Funds

Do not automatically create locked funds for every `PAYMENT_ISSUE`.

Whether money is inaccessible depends on actual account/funding context.

---

# 86. Disabled Account

When Meta source indicates disabled:

system should evaluate:

```text
Can account still be queried?

Are tracked funds remaining?

Are client jobs mapped?

Is recovery/refund required?
```

---

# 87. Access Lost

Access loss flow:

```text
Previously accessible account
↓
Validated repeated/direct access failure
↓
ACCESS_LOST
↓
Alert
↓
Stop normal dependent sync
↓
Preserve history
```

---

# 88. Access Lost Is Not Restriction

Do not automatically:

```text
Lock all account funds as Meta restriction
```

Instead:

```text
Status/financial verification required
```

because access loss may just mean Business Manager permissions changed.

---

# 89. Access Lost Financial State

Potential state:

```text
Funds:
UNVERIFIED / AT_RISK / STATUS_UNKNOWN
```

depending on model.

Do not declare loss.

---

# 90. Auth Failure

If Meta Connection token invalid:

All child accounts may appear inaccessible.

Correct:

```text
Connection AUTH_REQUIRED
```

not:

```text
200 accounts ACCESS_LOST
```

---

# 91. Connection-Wide Failure Detection

Before changing per-account access state:

determine whether failure affects:

```text
One account
```

or:

```text
Entire connection
```

---

# 92. Permission Error

Example:

Connection token works, but AD1 access removed.

Then:

```text
AD1 ACCESS_LOST
```

may be appropriate after confirmation.

---

# 93. API Timeout

Timeout means:

```text
STATUS UNKNOWN FOR THIS ATTEMPT
```

Do not change account state.

---

# 94. Rate Limit

Same:

```text
Last known status retained

Freshness ages
```

---

# 95. Partial Sync

Status from incomplete collection/discovery should not create destructive access-loss assumptions.

Direct per-account successful status observation can still be valid.

---

# 96. Status Unknown Handling

UI:

```text
Status unavailable

Last known:
ACTIVE

Last verified:
2 hours ago
```

This is better than:

```text
ACTIVE
```

with no warning.

---

# 97. Data Freshness and Alerts

Potential alert:

```text
META_ACCOUNT_STATUS_STALE
```

after configured threshold.

---

# 98. Stale Alert Severity

Depends on:

```text
Account importance

Active job count

Tracked financial exposure

Age
```

---

# 99. Primary Account

A stale primary/scaling account may be more urgent than archived backup.

---

# 100. Status History and Audit

Status history answers:

```text
What did Meta/system observe?
```

Audit log answers:

```text
Who changed internal configuration/workflow?
```

Keep both.

---

# 101. User Cannot Edit Raw Meta Status

Frontend should not allow:

```text
raw_meta_status = ACTIVE
```

manual update.

---

# 102. Internal Override

If needed:

Admin can change:

```text
internal lifecycle

operational note

manual review status
```

without rewriting raw Meta status.

---

# 103. Manual Status Report

Ads Manager may flag:

```text
"Account looks restricted in Ads Manager."
```

Store:

```text
User Report
```

and trigger targeted Meta refresh.

Do not immediately overwrite canonical Meta state.

---

# 104. Status Notes

Recovery case can hold notes such as:

```text
Appeal submitted

Payment updated

Meta support contacted
```

These are workflow notes.

---

# 105. Recovery Case

Recommended for significant restriction/access incidents.

Fields:

```text
case_reference

ad_account_id

restriction_episode_id

status

severity

assigned_user_id

locked_amount

currency

opened_at

resolved_at
```

---

# 106. Recovery Case Status

Possible:

```text
OPEN

UNDER_REVIEW

ACTION_REQUIRED

WAITING_FOR_META

PARTIALLY_RECOVERED

RECOVERED

WRITE_OFF_PENDING

RESOLVED

CLOSED
```

---

# 107. Account Status vs Recovery Case

Account may become:

```text
ACTIVE
```

while recovery case remains:

```text
UNDER_REVIEW
```

until money reconciles.

---

# 108. Financial Closure vs Operational Restoration

Operational:

```text
Account active again
```

Financial:

```text
All locked funds explained
```

Separate.

---

# 109. Recovery Case Closure

Require:

```text
No unresolved locked exposure
```

or explicit approved final resolution.

---

# 110. Restriction Aging

Track:

```text
time since restriction detected
```

Useful buckets:

```text
< 1 day

1–3 days

4–7 days

8–15 days

16–30 days

30+ days
```

---

# 111. Locked Fund Aging

More important financially than restriction duration alone.

Example:

Account may be permanently archived but old locked money still unresolved.

---

# 112. Aging Alerts

Potential:

```text
LOCKED_FUND_AGED
```

after thresholds.

---

# 113. Account Status Dashboard

Summary:

```text
Active Accounts

Restricted Accounts

Disabled Accounts

Payment Issues

Access Lost

Unknown

Stale Status
```

---

# 114. Avoid Double Counting

If an account is:

```text
last known ACTIVE
+
STALE
```

dashboard should not necessarily count it both as:

```text
ACTIVE
```

and confidently active total.

Define presentation clearly.

---

# 115. Recommended Dashboard Buckets

Could show:

```text
Verified Active

Known Restricted/Disabled

Status Unknown/Stale

Access Issues
```

---

# 116. Account Detail Status Card

Display:

```text
Current normalized status

Last known Meta status

Reason

Can Run Ads

Access Health

Freshness

Last Verified

Restriction Since

Recovery Case
```

---

# 117. Status Timeline

Example:

```text
01 Sep
ACTIVE

08 Sep 10:35
RESTRICTED

08 Sep 10:36
Recovery case opened

11 Sep 16:10
ACTIVE

11 Sep 16:15
Financial verification started

11 Sep 16:25
₹4,500 unlocked

₹500 remains unresolved
```

---

# 118. Status Filter

Account list filters:

```text
Active

Restricted

Disabled

Payment Issue

Access Lost

Unknown

Stale
```

---

# 119. Status Sort Priority

For operations, likely priority:

```text
Critical restricted exposure

Payment issue

Access lost

Stale

Active
```

but UI priority should be configurable and not treated as financial severity automatically.

---

# 120. Status Search

Can search by:

```text
Alias

Meta Account ID

Name

Portfolio

Client Assignment
```

---

# 121. Low Balance Is Not Status

Do not create:

```text
normalized_status = LOW_BALANCE
```

Low balance is an alert/financial condition.

---

# 122. No Spend Is Not Status

Likewise:

```text
NO_SPEND
```

is monitoring condition.

Account can remain ACTIVE.

---

# 123. Campaign Rejection Is Not Account Restriction

An individual campaign/ad issue must not automatically map to account-level RESTRICTED.

---

# 124. Account Restriction Is Not Campaign Pause

Different entity levels.

---

# 125. Status Hierarchy

Potential operational hierarchy:

```text
Connection Health

Ad Account Health

Campaign Health

Ad Set Health

Ad Health
```

Do not propagate child status upward without explicit rule.

---

# 126. Campaign Effective Status

Campaign-level:

```text
effective_status
```

is separate from account-level account status.

---

# 127. Account Active + Campaign Paused

Valid combination:

```text
Account:
ACTIVE

Campaign:
PAUSED
```

---

# 128. Account Restricted + Campaign Configured Active

Also possible internal observation:

```text
Campaign configured:
ACTIVE

Account:
RESTRICTED
```

Campaign cannot necessarily deliver despite configuration.

---

# 129. Account Status Reconciliation

Status itself generally comes from Meta operational truth.

But associated financial exposure needs reconciliation.

---

# 130. Restriction Reconciliation

Compare:

```text
Tracked pre-restriction allocation

Spend through relevant date

Refunds

Remaining amount

Locked amount
```

---

# 131. Difference Case

Example:

Expected remaining:

```text
₹5,000
```

Locked internally:

```text
₹4,500
```

Difference:

```text
₹500
```

Create reconciliation case.

---

# 132. Account Restored with Mismatched Amount

Do not unlock based only on status.

Example:

```text
Locked:
₹5,000

Verified recoverable:
₹4,700
```

Unlock:

```text
₹4,700
```

Difference:

```text
₹300 unresolved
```

---

# 133. Status Polling

Initial recommendation:

```text
~5-minute cadence
```

for operational accounts, subject to scale and API capacity.

---

# 134. Targeted Polling

Restricted/recovery cases may receive higher-priority status refresh.

---

# 135. Archived Polling

Archived accounts can use reduced polling or none after appropriate financial closure.

---

# 136. Access-Lost Polling

May periodically retry access at reduced cadence.

---

# 137. Auth-Blocked Connections

Do not repeatedly poll every account when parent Meta Connection is known invalid.

Wait for reconnect or periodic low-frequency connection health check.

---

# 138. Status Job Deduplication

One account should not have multiple identical status refresh jobs running simultaneously.

---

# 139. Out-of-Order Protection

Example:

```text
Sync A fetches RESTRICTED at 10:00

Sync B fetches ACTIVE at 10:05

B writes first

A finishes later
```

A must not restore RESTRICTED as current state if its observation is older.

---

# 140. Status Observation Timestamp

Prefer source/effective time where Meta provides appropriate trustworthy timestamp.

Otherwise use:

```text
fetched_at
```

with sync ordering.

---

# 141. Same Timestamp Conflicts

Use:

```text
sync sequence

request completion context

direct targeted refresh priority
```

according to deterministic rules.

---

# 142. Current-State Update Transaction

Within DB transaction:

```text
Lock account/current status row

Check incoming observation ordering

Compare state

Insert history if changed

Update current status

Commit
```

---

# 143. Domain Event After Commit

Emit status-change event only after DB state commits.

Avoid downstream lock-fund workflow running for transaction that later rolls back.

---

# 144. Duplicate Domain Event

Consumers must be idempotent.

Restriction event retry must not lock same funds twice.

---

# 145. Restriction Event ID

Use:

```text
status_history_id

or

restriction_episode_id
```

as idempotency source.

---

# 146. Example Restriction Event Payload

Conceptually:

```text
organizationId

adAccountId

previousStatus

newStatus

detectedAt

statusHistoryId

syncRunId
```

No raw access token.

---

# 147. Locked-Fund Service Idempotency

For same restriction episode:

```text
calculate existing locked records
```

before creating new ones.

---

# 148. Restriction During Existing Restriction

Repeated polls:

```text
RESTRICTED → RESTRICTED
```

must not create new locked-fund episode each time.

---

# 149. Restriction Amount Changes

Late spend may reduce locked amount after initial lock.

Handle via:

```text
reconciliation adjustment/event
```

not duplicate restriction episode.

---

# 150. Example

Initial:

```text
Locked:
₹2,000
```

Later Meta backfill adds spend:

```text
₹300
```

Then internal position may become:

```text
Locked:
₹1,700

Consumed:
+₹300
```

with history/reconciliation.

---

# 151. Status-Based Notification Routing

Restricted account:

```text
Ads Manager

Finance if fund exposure exists

Admin depending on severity
```

---

# 152. Payment Issue Notification

Prefer:

```text
Finance

Ads Manager
```

---

# 153. Access Lost Notification

Prefer:

```text
Admin / Meta connection owner

Ads Manager
```

Finance if material financial exposure exists.

---

# 154. Stale Status Notification

Usually operations/admin.

Escalate finance only where unresolved financial exposure depends on it.

---

# 155. Severity Calculation

Could consider:

```text
Normalized Status

Tracked Locked/At-Risk Amount

Active Client Jobs

Account Priority

Age
```

---

# 156. Severity Example

Restricted backup account:

```text
No active jobs

₹0 exposure
```

could be WARNING/HIGH operationally.

Restricted primary account:

```text
5 active jobs

₹2 lakh exposure
```

could be CRITICAL.

---

# 157. Severity Is Internal

Meta raw status does not dictate application alert severity.

---

# 158. Account Financial Status Summary

Account detail should separately show:

```text
Operational Status:
RESTRICTED

Client-Owned Locked:
₹50,000

Agency-Owned Locked:
₹10,000

Unattributed:
₹5,000
```

Do not display only:

```text
Balance ₹65,000
```

---

# 159. Account Closure Check

Before internal archive/financial close, review:

```text
Open allocations

Locked funds

Refund pending

Reconciliation cases

Active jobs

Unattributed spend

Recovery case
```

---

# 160. Operational Archive Allowed with Financial Exposure

May archive operational use while still keeping:

```text
financial_status = OPEN
```

---

# 161. Financial Closure

Only after:

```text
No unresolved owned funds

No material reconciliation

No unresolved recovery/refund
```

according to business rules.

---

# 162. Status Migration

Legacy accounts without verified Meta status should import as:

```text
UNKNOWN
```

or explicit imported last-known status with:

```text
source = MIGRATION
confidence = LOW
```

---

# 163. Do Not Mark Migrated Accounts ACTIVE by Default

If not verified, unknown is safer.

---

# 164. Testing Matrix

Must test:

```text
Active account

Restricted account

Disabled account

Payment issue

Unknown raw value

API timeout

Rate limit

Token invalid

Permission lost

Single-account access lost

Connection-wide auth lost

Restricted → Active

Active → Restricted

Restricted → Active → Restricted

Stale last-known active

Out-of-order sync

Duplicate status event
```

---

# 165. Financial Status Tests

Also:

```text
Restriction before spend

Restriction after partial spend

Mixed-owner account restriction

Restriction with zero funds

Restore with same amount

Restore with late spend

Partial refund

Partial recovery

Permanent unrecovered amount
```

---

# 166. Status Mapper Unit Tests

Fixture-driven:

```text
Raw input
→ Expected normalized status
→ Reason
→ can_run_ads
→ Confidence
```

---

# 167. Unknown Fixture Test

Every unsupported raw value should produce:

```text
UNKNOWN
```

not throw uncaught exception.

---

# 168. Current API Contract Test

Against controlled real/test Meta asset, periodically verify requested status fields remain accepted under configured API version.

---

# 169. Mapper Upgrade Test

When API version changes:

compare:

```text
Old mapper output

New API fixture

Expected new mapper output
```

before production rollout.

---

# 170. V1 Required Status Features

```text
Raw status preservation

Raw reason preservation

Normalized status

Access state

Freshness state

Nullable can_run_ads

Status history

Restriction detection

Restore detection

Stale detection

Access-loss detection

Alerts

Recovery-case integration

Locked-fund workflow trigger

Out-of-order protection

Idempotent events
```

---

# 171. Future Features

Possible:

```text
Automated support-case tracking

Appeal tracking

Meta issue classification analytics

Restriction rate dashboard

Predictive risk indicators

Automatic backup-account suggestions
```

These should not autonomously make financial decisions.

---

# 172. Status Integrity Rules

System must enforce:

```text
1. Raw Meta status and internal normalized status must remain separate.

2. Raw Meta reason data should be preserved when available.

3. Exact raw Meta codes must be interpreted through a centralized versioned mapper.

4. Unknown raw states must map safely to UNKNOWN.

5. API timeout must never equal RESTRICTED.

6. Rate limit must never equal RESTRICTED.

7. Connection auth failure must not mark every Ad Account restricted.

8. Asset access loss and Meta restriction must remain separate concepts.

9. Stale status must be visibly different from verified current status.

10. Zero and unknown must never be conflated.

11. Restriction must not automatically create financial loss.

12. Restriction must not change fund ownership.

13. Restriction must not reduce vendor liability automatically.

14. Only remaining unconsumed allocations should become locked where business rules support it.

15. Mixed-owner locked funds must retain owner-level breakdown.

16. Restore must not automatically unlock all funds.

17. Recent spend and financial position must be reconciled before unlocking.

18. Partial recovery must remain partially unresolved.

19. Permanent unrecovered amounts require explicit approved resolution.

20. Repeated restricted polls must not create duplicate restriction episodes.

21. Status changes must be historically traceable.

22. Older observations must not overwrite newer current state.

23. Archived operational accounts may still have open financial exposure.

24. Account financial closure and operational status must remain separate.
```

---

# 173. Meta Account Status Golden Rule

> **Meta account status tells us whether an advertising asset appears operationally usable; it does not tell us who owns the money inside the business model or whether that money is lost. Every restriction, access problem and restoration must therefore preserve the raw Meta evidence, the internal normalized state, freshness, history and the separate financial exposure until reconciliation provides a traceable resolution.**
