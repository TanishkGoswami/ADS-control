# Alerts

## Overview

Alerts module system ka proactive monitoring layer hoga.

Iska purpose sirf notifications bhejna nahi hai.

Alert system ko continuously identify karna chahiye:

```text
Operational Problems

Financial Risks

Meta Sync Failures

Client Fund Issues

Vendor Settlement Issues

Reconciliation Mismatches

Pending Approvals

Aging Financial Items
```

Core principle:

> **An alert is a signal about a condition. Dismissing the signal must never automatically resolve the underlying business or financial issue.**

---

# 1. Alert Goals

Alerts ka objective:

```text
Problem jaldi identify karna

Right user ko notify karna

Financial exposure visible rakhna

Issue ko assign karna

Resolution track karna

Repeated issues avoid karna
```

---

# 2. Alert Categories

Primary categories:

```text
ACCOUNT

META_SYNC

CLIENT

VENDOR

FINANCIAL

RECONCILIATION

APPROVAL

SYSTEM
```

---

# 3. Alert Severity

Recommended levels:

```text
INFO

WARNING

HIGH

CRITICAL
```

Severity should be based on defined rules.

Not arbitrary UI color choice.

---

# 4. INFO

Use when:

```text
Attention useful hai
but immediate business risk low hai
```

Examples:

```text
Account restored

New vendor funding received

Meta sync recovered
```

---

# 5. WARNING

Use for:

```text
Issue exists
but immediate severe financial impact nahi
```

Examples:

```text
Low Balance

Data Becoming Stale

Unused Client Balance Aging
```

---

# 6. HIGH

Use for:

```text
Financial or operational impact significant hai
and action required hai
```

Examples:

```text
Vendor Receivable Open

Refund Pending Too Long

Account Restricted With Funds

Large Reconciliation Difference
```

---

# 7. CRITICAL

Use when:

```text
Immediate financial exposure
major operational outage
or serious control failure
```

Examples:

```text
Large Fund Locked

Multiple Accounts Restricted

Duplicate Financial Posting

Meta Connection Authentication Failure Across Many Accounts
```

Exact thresholds configurable honge.

---

# 8. Alert Lifecycle

Recommended lifecycle:

```text
OPEN
↓
ACKNOWLEDGED
↓
ASSIGNED
↓
IN_PROGRESS
↓
RESOLVED
↓
CLOSED
```

Optional:

```text
DISMISSED_NOTIFICATION
```

but underlying issue separate rahega.

---

# 9. Open Alert

Alert condition detect hone par:

```text
OPEN
```

state.

---

# 10. Acknowledge Alert

User can indicate:

```text
I have seen this issue.
```

State:

```text
ACKNOWLEDGED
```

Issue still unresolved.

---

# 11. Assign Alert

Alert can be assigned to:

```text
User

Team

Finance Owner

Ads Manager

Recovery Owner

Reconciliation Owner
```

---

# 12. In Progress

Assigned user actively working:

```text
IN_PROGRESS
```

---

# 13. Resolve Alert

Alert should move to resolved only when underlying condition is actually resolved or valid resolution recorded.

Example:

Vendor receivable alert resolves when:

```text
Receivable recovered

Offset

Approved write-off
```

not merely because user clicks dismiss.

---

# 14. Close Alert

Closed state can represent:

```text
Resolved condition confirmed
and no further follow-up required
```

---

# 15. Dismiss Notification

User may hide notification from personal feed.

This should not:

```text
Close Reconciliation Case

Delete Vendor Receivable

Clear Locked Fund

Mark Refund Completed
```

---

# 16. Alert Record Fields

Recommended:

```text
Alert ID

Alert Type

Category

Severity

Entity Type

Entity ID

Title

Description

Amount Exposure

Currency

Status

Assigned User

Created At

Acknowledged At

Resolved At

Closed At

Detection Source

Related Case ID
```

---

# 17. Alert Entity Types

Possible:

```text
META_CONNECTION

BUSINESS_PORTFOLIO

AD_ACCOUNT

CLIENT

CLIENT_JOB

VENDOR

VENDOR_FUNDING_BATCH

TRANSACTION

REFUND

RECONCILIATION_CASE

RECOVERY_CASE
```

---

# 18. Account Alerts

Primary account alert types:

```text
AD_ACCOUNT_RESTRICTED

AD_ACCOUNT_DISABLED

AD_ACCOUNT_PAYMENT_ISSUE

AD_ACCOUNT_LOW_BALANCE

AD_ACCOUNT_NO_SPEND

AD_ACCOUNT_POST_COMPLETION_SPEND

AD_ACCOUNT_STATUS_UNKNOWN

AD_ACCOUNT_DATA_STALE

AD_ACCOUNT_ACCESS_LOST
```

---

# 19. Ad Account Restricted

Trigger:

```text
Normalized status changes to RESTRICTED
```

Alert should include:

```text
Ad Account

Portfolio

Connection

Restriction Time

Tracked Funds

Locked Funds

Affected Clients

Affected Jobs
```

Severity depends on exposure.

---

# 20. Restriction With Zero Funds

Example:

```text
AD1 Restricted
Locked Fund ₹0
```

Still alert operationally.

Severity may be:

```text
WARNING / HIGH
```

depending on active campaigns.

---

# 21. Restriction With Large Funds

Example:

```text
AD1 Restricted
₹1,00,000 Locked
```

may become:

```text
CRITICAL
```

according to configured threshold.

---

# 22. Disabled Account

Alert:

```text
AD_ACCOUNT_DISABLED
```

Include active client impact.

---

# 23. Payment Issue

Trigger when normalized account condition indicates billing/payment problem.

Alert:

```text
AD_ACCOUNT_PAYMENT_ISSUE
```

Do not automatically classify all funds as locked unless actual usability rule says so.

---

# 24. Low Balance

Trigger:

```text
Available balance < configured threshold
```

Example:

```text
Available:
₹800

Threshold:
₹2,000
```

Alert:

```text
AD_ACCOUNT_LOW_BALANCE
```

---

# 25. Low Balance Must Use Available Funds

Do not include:

```text
Locked Funds
```

as usable balance.

---

# 26. No Spend Alert

Trigger if:

```text
Expected active job/account
+
No spend for configured period
```

Alert:

```text
AD_ACCOUNT_NO_SPEND
```

Need avoid false alert for intentionally paused jobs.

---

# 27. Post-Completion Spend

Trigger:

```text
Internal Job = COMPLETED
but mapped Meta Campaign still reports new spend
```

Alert:

```text
POST_COMPLETION_SPEND
```

Recommended severity:

```text
HIGH
```

or critical above threshold.

---

# 28. Status Unknown

Trigger:

```text
Account status cannot be reliably determined
```

Use:

```text
AD_ACCOUNT_STATUS_UNKNOWN
```

Do not incorrectly send restricted alert.

---

# 29. Meta Sync Alerts

Types:

```text
META_SYNC_FAILED

META_SYNC_PARTIAL

META_DATA_STALE

META_TOKEN_EXPIRED

META_AUTH_REQUIRED

META_PERMISSION_ERROR

META_RATE_LIMITED
```

---

# 30. Meta Sync Failed

Trigger after sync job failure.

Alert should include:

```text
Connection

Sync Type

Error Category

Last Successful Sync

Affected Assets
```

---

# 31. Meta Data Stale

Trigger based on freshness threshold.

Example:

```text
Expected freshness:
15 min

Current age:
45 min
```

Alert:

```text
META_DATA_STALE
```

---

# 32. Token Expired

Alert:

```text
META_TOKEN_EXPIRED
```

Route primarily to Admin/Integration owner.

---

# 33. Permission Error

If Meta permissions removed:

```text
META_PERMISSION_ERROR
```

Do not delete old data.

---

# 34. Client Alerts

Primary:

```text
CLIENT_UNDERFUNDED

CLIENT_OVESPEND

CLIENT_UNUSED_BALANCE

CLIENT_LEFTOVER_AGED

CLIENT_LOCKED_FUND

CLIENT_LOCKED_FUND_AGED

CLIENT_REFUND_PENDING

CLIENT_REFUND_AGED

CLIENT_RECEIVABLE_OPEN

CLIENT_RECEIVABLE_AGED

CLIENT_RECONCILIATION_MISMATCH

CLIENT_FINANCIAL_CLOSURE_PENDING
```

---

# 35. Client Underfunded

Trigger:

```text
Job Required Funding > Confirmed Available Funding
```

Example:

```text
Budget:
₹20,000

Funded:
₹12,000

Gap:
₹8,000
```

---

# 36. Client Overspend

Trigger:

```text
Recognized Spend > Allocation
```

Example:

```text
Allocation:
₹10,000

Spend:
₹10,500
```

Alert exposure:

```text
₹500
```

---

# 37. Client Unused Balance

When completed job has unresolved amount:

```text
CLIENT_UNUSED_BALANCE
```

Alert may begin as INFO/WARNING.

---

# 38. Client Leftover Aged

Example thresholds:

```text
7 Days → INFO

15 Days → WARNING

30 Days → HIGH
```

Configurable.

---

# 39. Client Locked Fund

Trigger when client-owned amount becomes locked.

Alert should include:

```text
Client

Amount

Ad Account

Job

Locked Since
```

---

# 40. Locked Fund Aging

If still locked after configured days:

```text
CLIENT_LOCKED_FUND_AGED
```

Severity escalates with:

```text
Age

Amount
```

---

# 41. Refund Pending

Trigger after approved/requested refund remains incomplete.

```text
CLIENT_REFUND_PENDING
```

---

# 42. Refund Aging

Example:

```text
Refund:
₹20,000

Pending:
10 days
```

Alert can become HIGH.

---

# 43. Client Receivable

If client owes company:

```text
CLIENT_RECEIVABLE_OPEN
```

Aging escalation separately.

---

# 44. Vendor Alerts

Primary:

```text
VENDOR_PAYABLE_OPEN

VENDOR_PAYABLE_AGED

VENDOR_SETTLEMENT_PENDING

VENDOR_PAYMENT_FAILED

VENDOR_OVERPAYMENT

VENDOR_RECEIVABLE_OPEN

VENDOR_RECEIVABLE_AGED

VENDOR_FUNDING_BATCH_AGED

VENDOR_RECONCILIATION_MISMATCH

VENDOR_FINANCIAL_CLOSURE_PENDING
```

---

# 45. Vendor Payable Aged

Example:

```text
RAM Payable:
₹80,000

Age:
20 days
```

Alert based on configured payment terms/threshold.

---

# 46. Vendor Overpayment

Trigger immediately when payment exceeds payable.

Example:

```text
Payable:
₹20,000

Payment:
₹30,000

Excess:
₹10,000
```

Alert:

```text
VENDOR_OVERPAYMENT
```

---

# 47. Vendor Receivable Open

Once excess posted:

```text
VENDOR_RECEIVABLE_OPEN
```

should remain until resolved.

---

# 48. Vendor Receivable Aging

This is particularly important because this was one of the major business problems.

Example:

```text
RAM owes us:
₹10,000

Open:
30 days
```

Alert should escalate rather than be forgotten.

---

# 49. Vendor Settlement Pending

Trigger if approved settlement is pending too long.

---

# 50. Vendor Payment Failed

Immediate alert:

```text
VENDOR_PAYMENT_FAILED
```

Payable remains open.

---

# 51. Financial Alerts

Primary:

```text
NEGATIVE_BALANCE_ATTEMPT

DUPLICATE_TRANSACTION_ATTEMPT

DUPLICATE_PAYMENT_REFERENCE

UNATTRIBUTED_FUND

UNATTRIBUTED_SPEND

LARGE_MANUAL_ADJUSTMENT

WRITE_OFF_PENDING

REVERSAL_PENDING

FUND_OWNERSHIP_MISMATCH

DOUBLE_ALLOCATION_ATTEMPT

FAILED_FINANCIAL_TRANSACTION
```

---

# 52. Negative Balance Attempt

If user attempts:

```text
Allocate ₹20,000
from available ₹10,000
```

transaction should be blocked.

Optional alert:

```text
NEGATIVE_BALANCE_ATTEMPT
```

for repeated/high-risk cases.

---

# 53. Duplicate Transaction Attempt

Idempotency prevents posting.

Alert/log useful when repeated duplicate requests detected.

---

# 54. Duplicate Payment Reference

Same UTR/reference reused unexpectedly.

Alert:

```text
DUPLICATE_PAYMENT_REFERENCE
```

May require review.

---

# 55. Unattributed Fund

Example:

```text
Ad Account Financial Position:
₹10,000

Known Ownership:
₹9,000

Unknown:
₹1,000
```

Alert:

```text
UNATTRIBUTED_FUND
```

---

# 56. Unattributed Spend

Example:

```text
Total Spend:
₹50,000

Mapped:
₹48,000

Unattributed:
₹2,000
```

Alert:

```text
UNATTRIBUTED_SPEND
```

---

# 57. Fund Ownership Mismatch

Example:

Client A fund appears to have been used against Client B without transfer record.

Alert:

```text
FUND_OWNERSHIP_MISMATCH
```

Recommended severity:

```text
HIGH
```

---

# 58. Double Allocation Attempt

Same available fund attempted to allocate twice.

Transaction should be blocked through ledger/concurrency logic.

Alert/log if needed.

---

# 59. Large Manual Adjustment

If manual adjustment amount exceeds threshold:

```text
LARGE_MANUAL_ADJUSTMENT
```

Create alert/approval request.

---

# 60. Reconciliation Alerts

Primary:

```text
AD_ACCOUNT_RECONCILIATION_MISMATCH

CLIENT_RECONCILIATION_MISMATCH

VENDOR_RECONCILIATION_MISMATCH

LOCKED_FUND_RECONCILIATION_MISMATCH

REFUND_RECONCILIATION_MISMATCH

SPEND_ATTRIBUTION_MISMATCH
```

---

# 61. Reconciliation Alert Data

Include:

```text
Expected Value

Observed Value

Difference

Currency

Entity

Age

Related Case
```

---

# 62. Reconciliation Severity

Can depend on:

```text
Difference Amount

Difference Percentage

Age

Entity Criticality
```

Avoid declaring financial loss until cause known.

---

# 63. Timing Difference

If known timing issue:

Alert can remain:

```text
WAITING_FOR_SYNC
```

with lower severity.

---

# 64. Approval Alerts

Types:

```text
APPROVAL_REQUIRED

APPROVAL_AGED

HIGH_VALUE_APPROVAL_REQUIRED

SELF_APPROVAL_BLOCKED
```

---

# 65. Approval Required

Route to users with required approval permission.

Alert/request should include:

```text
Transaction Type

Amount

Creator

Entity

Reason

Financial Impact
```

---

# 66. Approval Aging

If request remains pending longer than threshold:

```text
APPROVAL_AGED
```

---

# 67. Alert Deduplication

Same condition should not create hundreds of identical open alerts.

Example:

Account remains restricted through 20 sync cycles.

Expected:

```text
One Active Restriction Alert
```

with updated metadata.

Not 20 separate identical alerts.

---

# 68. Alert Deduplication Key

Conceptually:

```text
Alert Type
+
Entity ID
+
Condition Instance
```

Example:

```text
AD_ACCOUNT_RESTRICTED + AA-001 + current restriction episode
```

---

# 69. New Restriction Episode

If account:

```text
Restricted
→ Restored
→ Restricted again
```

second restriction should create new alert/event episode.

---

# 70. Alert Auto-Resolution

Some alerts can auto-resolve when condition clears.

Examples:

```text
LOW_BALANCE
```

can resolve when balance rises above threshold.

```text
META_DATA_STALE
```

can resolve after successful sync.

---

# 71. Financial Alert Auto-Resolution

Be more conservative.

Example:

```text
VENDOR_RECEIVABLE_OPEN
```

resolve only after financial receivable becomes zero through valid transaction.

---

# 72. Restriction Alert Resolution

Resolve when:

```text
Account restored
```

but related:

```text
Locked Fund Alert
```

may remain until funds are reconciled/unlocked.

Operational resolution and financial resolution separate.

---

# 73. Alert Escalation

Severity can increase over time.

Example:

Vendor Receivable:

```text
Day 1 → WARNING

Day 15 → HIGH

Day 30 → CRITICAL Review
```

Thresholds configurable.

---

# 74. Amount-Based Escalation

Example:

```text
Locked ₹500
```

may be lower severity than:

```text
Locked ₹5,00,000
```

Use configured value thresholds.

---

# 75. Combined Escalation

Potential score based only on explicit factors:

```text
Severity Base

Age

Amount

Operational Impact
```

No opaque AI scoring required in V1.

---

# 76. Alert Assignment

Alerts can auto-assign based on entity ownership.

Example:

```text
Ad Account Restriction
→ Assigned Ads Manager
```

```text
Vendor Receivable
→ Assigned Finance Owner
```

```text
Meta Token Expired
→ Admin
```

---

# 77. Alert Routing

Recommended:

```text
ACCOUNT
→ Ads Manager + Admin

CLIENT_FINANCIAL
→ Finance + Client Manager

VENDOR
→ Finance + Admin where high risk

META_SYNC
→ Admin / Integration Owner

RECONCILIATION
→ Finance

APPROVAL
→ Authorized Approvers
```

---

# 78. Role-Based Alert Visibility

User only sees alerts for entities/data they are permitted to view.

Ads Manager should not automatically see sensitive vendor receivables.

---

# 79. Personal Alert Inbox

Each user can have:

```text
Assigned to Me

Watching

Unassigned Relevant

Resolved
```

views.

---

# 80. Alert Center

Main screen filters:

```text
Status

Severity

Category

Alert Type

Assigned User

Entity

Date

Age

Amount Range
```

---

# 81. Alert List Columns

Recommended:

```text
Severity

Alert

Entity

Amount Exposure

Age

Assigned To

Status

Created At

Last Updated
```

---

# 82. Alert Detail

Should show:

```text
Alert Type

Description

Current Condition

Entity Details

Financial Exposure

Timeline

Assigned User

Related Transactions

Related Recovery/Reconciliation Case

Resolution Requirements
```

---

# 83. Alert Action Buttons

Context-based:

```text
Acknowledge

Assign

Open Entity

Open Reconciliation Case

Open Recovery Case

Request Approval

Resolve
```

---

# 84. Alert Timeline

Track:

```text
Created

Acknowledged

Assigned

Severity Changed

Condition Updated

Resolved

Closed
```

---

# 85. Alert Notes

Users may add:

```text
Investigation Notes

Follow-Up Notes

Resolution Notes
```

with author/time.

---

# 86. Resolution Reason

Resolving alert should require reason for non-auto-resolved financial alerts.

Examples:

```text
Fund recovered

Refund completed

Account restored

Settlement posted

Mismatch corrected

False positive
```

---

# 87. False Positive

If alert condition was incorrect:

```text
Resolution Type:
FALSE_POSITIVE
```

Record why.

Do not delete alert history.

---

# 88. Snooze

Optional feature:

```text
Snooze Until
```

for alerts where no immediate action possible.

Example:

Waiting for Meta review.

Snooze hides repeated notification but does not resolve condition.

---

# 89. Snooze Restrictions

Critical financial alerts should have maximum snooze limit or elevated permission.

---

# 90. Notification Channels

V1:

```text
IN_APP
```

Future:

```text
EMAIL

WHATSAPP

SLACK

PUSH
```

---

# 91. Notification vs Alert

Important:

```text
Alert
=
Persistent system condition record
```

```text
Notification
=
Message delivered to user about alert
```

Failed notification must not remove alert.

---

# 92. Notification Preferences

Future user preferences:

```text
Alert Type

Minimum Severity

Channel

Enabled / Disabled
```

---

# 93. Critical Notification Override

Certain critical alerts may ignore personal muted preference according to company policy.

Example:

```text
Meta Connection auth failure
```

to Admin.

---

# 94. Alert Frequency Control

Prevent notification spam.

Example:

Restriction remains open.

Send:

```text
Initial notification

Escalation reminder

Daily reminder if needed
```

not every sync cycle.

---

# 95. Reminder Rules

Example configurable:

```text
WARNING → Every 24h

HIGH → Every 8h

CRITICAL → Every 2h
```

Actual automation frequencies can be configured later.

---

# 96. Alert Aging

Every alert should track:

```text
Age

Time Since Acknowledgement

Time Since Last Update
```

---

# 97. Alert SLA

Optional business feature:

```text
Critical:
Acknowledge within 30 min

High:
Within 2 hours
```

Can be introduced later.

---

# 98. Alert Metrics

Dashboard can show:

```text
Open Alerts

Critical Alerts

High Alerts

Unassigned Alerts

Aged Alerts

Resolved Today
```

---

# 99. Alert Trend Report

Future:

```text
Restrictions per month

Sync failures

Vendor overpayments

Reconciliation mismatches

Average resolution time
```

Useful to improve operations.

---

# 100. Alert Severity Example: Restricted Account

Scenario A:

```text
No active jobs
₹0 locked
```

Severity:

```text
WARNING
```

Scenario B:

```text
3 active jobs
₹50,000 locked
```

Severity:

```text
HIGH / CRITICAL based on threshold
```

---

# 101. Alert Severity Example: Vendor Receivable

Scenario:

```text
₹500
1 day old
```

Could be:

```text
WARNING
```

Scenario:

```text
₹1,00,000
30 days old
```

Could be:

```text
CRITICAL
```

based on configuration.

---

# 102. Alert Configuration

Settings can include:

```text
Low Balance Threshold

Locked Fund Amount Threshold

Leftover Aging Days

Refund Aging Days

Vendor Payable Aging Days

Vendor Receivable Aging Days

Reconciliation Difference Threshold

Data Stale Threshold
```

---

# 103. Global vs Entity Thresholds

Support:

```text
Global Default
```

plus optional:

```text
Per-Ad-Account

Per-Vendor

Per-Client
```

configuration.

---

# 104. Alert Rule Engine

V1 can use explicit deterministic rules.

Example:

```text
IF
ad_account.status = RESTRICTED
AND open restriction alert does not exist
THEN
create alert
```

No need for AI.

---

# 105. Scheduled Alert Evaluation

Some alerts evaluate periodically:

```text
Aging

Stale Data

Low Balance

Pending Refund

Vendor Receivable Aging
```

---

# 106. Event-Driven Alerts

Some should be immediate:

```text
Vendor Overpayment Posted

Ad Account Restricted

Payment Failed

Transaction Duplicate Attempt
```

---

# 107. Alert Idempotency

Repeated processing of same event must not duplicate alert.

---

# 108. Related Case Linking

Alerts may create/link:

```text
Recovery Case

Reconciliation Case

Approval Request
```

Example:

```text
AD_ACCOUNT_RESTRICTED
→ Recovery Case RC-001
```

---

# 109. Alert Does Not Replace Case

Alert is notification/control surface.

Detailed workflow may live in recovery/reconciliation case.

Do not duplicate business truth inconsistently.

---

# 110. Alert Data Freshness

For Meta-derived alerts, show:

```text
Detected At

Source Data Synced At
```

so users know freshness.

---

# 111. Stale Alert Source

If alert based on stale data:

mark:

```text
SOURCE_DATA_STALE
```

where useful.

---

# 112. Alert Security

Alert API should not expose hidden underlying financial data to unauthorized roles.

Example:

Ads Manager sees:

```text
Vendor-related alert not available
```

rather than hidden amount being sent and visually masked.

---

# 113. Alert Audit

Track:

```text
Who acknowledged

Who assigned

Who changed severity manually

Who resolved

Resolution reason

Timestamp
```

---

# 114. Manual Alert Creation

Authorized users may create manual alert/task when issue discovered manually.

Fields:

```text
Category

Entity

Severity

Description

Assigned User
```

Manual alert clearly marked:

```text
Source:
MANUAL
```

---

# 115. Manual Severity Override

Admin may change alert severity with reason.

Original system severity should remain in audit.

---

# 116. Alert Deletion

Production alerts should generally not be hard-deleted.

Use:

```text
RESOLVED

CLOSED

FALSE_POSITIVE
```

History retained.

---

# 117. System Alert

System infrastructure/business-process alerts:

```text
WORKER_JOB_FAILED

QUEUE_BACKLOG_HIGH

RECONCILIATION_JOB_FAILED

BACKGROUND_SYNC_DELAYED
```

May be Admin-only.

---

# 118. Alert Center Quick Views

Recommended:

```text
Critical

Needs My Attention

Financial

Account Issues

Vendor

Client

Sync Errors

Aged

Resolved
```

---

# 119. Dashboard Alert Widget

Show highest-priority 5–10 alerts.

Example:

```text
CRITICAL
AD1 restricted — ₹50,000 locked

HIGH
RAM receivable — ₹10,000 / 27 days

HIGH
Client A refund — ₹20,000 / 10 days

WARNING
Ads Backup sync stale — 45 min
```

---

# 120. V1 Must-Have Alert Types

```text
AD_ACCOUNT_RESTRICTED

AD_ACCOUNT_DISABLED

AD_ACCOUNT_LOW_BALANCE

META_SYNC_FAILED

META_AUTH_REQUIRED

META_DATA_STALE

CLIENT_UNDERFUNDED

CLIENT_OVESPEND

CLIENT_LEFTOVER_AGED

CLIENT_LOCKED_FUND

CLIENT_REFUND_PENDING

VENDOR_OVERPAYMENT

VENDOR_RECEIVABLE_OPEN

VENDOR_RECEIVABLE_AGED

VENDOR_PAYABLE_AGED

VENDOR_SETTLEMENT_PENDING

UNATTRIBUTED_SPEND

UNATTRIBUTED_FUND

RECONCILIATION_MISMATCH

APPROVAL_REQUIRED
```

---

# 121. V1 Should-Have

```text
No Spend Alert

Post-Completion Spend

Client Receivable Aging

Duplicate Reference Alert

Failed Financial Transaction

Access Lost

Approval Aging

Locked Fund Aging Escalation
```

---

# 122. Future Alert Features

Potential:

```text
Email Alerts

WhatsApp Alerts

Slack Alerts

Mobile Push

AI Alert Summaries

Anomaly Detection

Predictive Low-Balance Alerts

Escalation Policies

On-Call Rotations
```

AI should assist summarization/prioritization, not silently change financial truth.

---

# 123. Alert Integrity Rules

System must enforce:

```text
1. Alerts must be based on explicit conditions.

2. Same active condition must not create duplicate alert spam.

3. Dismissing notification must not resolve underlying issue.

4. Financial alerts resolve only when financial condition is actually resolved.

5. Restriction alerts and locked-fund alerts may have separate lifecycles.

6. Unknown data must not create false factual alerts.

7. Alert severity changes must be traceable.

8. Role/resource permissions must apply to alert visibility.

9. Alert history must not be silently deleted.

10. Alert resolution must reference actual resolution where relevant.

11. Failed notifications must not affect alert state.

12. Aging alerts should escalate based on configured thresholds.

13. Automated alerts must be idempotent.

14. Every critical alert should have a clear entity and action path.
```

---

# 124. Alert Golden Rule

> **The alert system must make important problems impossible to forget without making unresolved conditions disappear. An alert can be acknowledged, assigned, snoozed or resolved, but the underlying financial or operational issue must remain visible until the actual business condition is fixed.**
