# Account Management

## Overview

Account Management module system ke Meta asset layer ko control karega.

Primary hierarchy:

```text
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
```

Module ka goal:

> **Har connected Meta asset ko uniquely identify, sync, monitor aur historically track karna without losing hierarchy, status or financial context.**

---

# 1. Module Scope

Account Management me cover hoga:

```text
Meta Connections

Business Portfolios

Ad Accounts

Asset Relationships

Account Status

Account Sync

Account Search

Account Filters

Account Assignments

Account History

Account Archiving

Account Health
```

---

# 2. Core Account Hierarchy

System structure:

```text
Workspace / Company
      ↓
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
```

Meta Campaign, Ad Set aur Ad data operational sub-assets hain.

Client assignment separate relationship hai.

---

# 3. Meta Connection

Meta Connection represents authenticated Meta access context.

Example:

```text
Connection:
Ads Pro
```

A single connection may expose:

```text
BP1
BP2
BP3
```

and their Ad Accounts.

---

# 4. Meta Connection Fields

Recommended:

```text
Internal ID

Internal Name

Connection Status

Meta User / Context Identifier

Token Reference

Token Expiry / Health

Connected At

Last Successful Sync

Last Failed Sync

Created By

Status
```

Raw token UI/API me expose nahi karna.

---

# 5. Connection Status

Internal statuses:

```text
ACTIVE

AUTH_REQUIRED

PERMISSION_ERROR

DISABLED

SYNC_ERROR

UNKNOWN
```

---

# 6. Add Meta Connection

Authorized user can:

```text
Add Meta Connection
```

Process:

```text
Start Meta Authentication
↓
Receive Authorized Context
↓
Validate Permissions
↓
Create Internal Connection Record
↓
Discover Assets
↓
Initial Sync
```

---

# 7. Connection Naming

System should allow internal user-friendly name:

```text
Ads Pro
```

Meta-provided names/IDs separately stored.

Internal name can change without changing identity.

---

# 8. Duplicate Connection Detection

System should detect potential duplicate integrations using available Meta identifiers.

Do not create multiple logical connection records accidentally for same integration context unless intentionally allowed.

---

# 9. Connection Detail Screen

Tabs:

```text
Overview

Business Portfolios

Ad Accounts

Sync History

Errors

Permissions

Audit
```

---

# 10. Connection Overview

Show:

```text
Internal Name

Connection Status

Portfolio Count

Ad Account Count

Active Accounts

Restricted Accounts

Last Sync

Token Health

Open Issues
```

---

# 11. Connection Disable

Authorized user may disable connection.

Effect:

```text
Automatic sync stops
```

but:

```text
Existing historical data remains
```

Do not delete assets.

---

# 12. Connection Reconnect

If:

```text
AUTH_REQUIRED
```

authorized user can reconnect.

Existing canonical asset records should be reused.

Do not duplicate portfolios/accounts after reconnect.

---

# 13. Business Portfolio Discovery

After connection sync:

```text
Discover Business Portfolios
```

Each portfolio mapped to canonical internal record.

---

# 14. Business Portfolio Fields

Recommended:

```text
Internal ID

Meta Business ID

Name

Primary Meta Connection

Status

First Seen At

Last Seen At

Last Synced At

Archived At
```

---

# 15. Business Portfolio Identity

Canonical external key:

```text
meta_business_id
```

Names are labels only.

---

# 16. Portfolio List

Columns:

```text
Portfolio Name

Meta Business ID

Connection

Ad Accounts

Active Accounts

Restricted Accounts

Tracked Fund

Locked Fund

Last Sync

Status
```

---

# 17. Portfolio Search

Search:

```text
Name

Meta Business ID

Internal ID

Connection
```

---

# 18. Portfolio Filters

```text
Connection

Status

Has Restricted Accounts

Has Locked Funds

Has Sync Issues

Archived / Active
```

---

# 19. Portfolio Detail

Tabs:

```text
Overview

Ad Accounts

Financial Summary

Status Issues

History

Audit
```

---

# 20. Ad Account Discovery

Sync discovers accessible Ad Accounts.

System should canonicalize by:

```text
Meta Ad Account ID
```

Example:

```text
act_123456789
```

---

# 21. Ad Account Fields

Recommended business fields:

```text
Internal ID

Meta Ad Account ID

Name

Primary Business Portfolio

Meta Connection

Currency

Timezone

Raw Meta Status

Normalized Status

Can Run Ads

First Seen At

Last Seen At

Last Successful Sync

Archived At
```

---

# 22. Canonical Ad Account Rule

One actual Meta Ad Account:

```text
act_123456789
```

must correspond to one canonical internal Ad Account record.

Even if visible through multiple relationships.

---

# 23. Duplicate Names

Allowed:

```text
BP1 → AD1
BP2 → AD1
```

Identity remains unique by Meta ID.

UI should always display enough path context.

---

# 24. Full Account Path

Example:

```text
Ads Pro / BP1 / AD1
```

This path should appear in:

```text
Search Results

Transaction Detail

Client Allocation

Alerts

Reports
```

where useful.

---

# 25. Account List

Recommended columns:

```text
Ad Account

Meta ID

Portfolio

Connection

Status

Currency

Spend Today

Tracked Fund

Locked Fund

Assigned Clients

Last Sync
```

---

# 26. Account List Status Badges

Possible:

```text
ACTIVE

RESTRICTED

DISABLED

PAYMENT_ISSUE

UNKNOWN

STALE

ARCHIVED
```

Raw Meta status accessible in detail.

---

# 27. Ad Account Search

Search by:

```text
Display Name

Meta Ad Account ID

Internal ID

Portfolio

Connection

Client

Job
```

---

# 28. Ad Account Filters

```text
Status

Connection

Portfolio

Currency

Assigned Client

Has Locked Fund

Low Balance

Has Sync Error

Has Reconciliation Issue

Archived
```

---

# 29. Account Tree View

UI hierarchy:

```text
▼ Ads Pro
   ▼ BP1
      AD1
      AD2
      AD3
   ▼ BP2
      AD4
      AD5
```

Each node may show summary indicators.

---

# 30. Connection Tree Summary

Example:

```text
Ads Pro
2 Portfolios
8 Ad Accounts
2 Restricted
₹35,000 Locked
```

---

# 31. Portfolio Tree Summary

Example:

```text
BP1
4 Accounts
1 Restricted
₹10,000 Locked
```

---

# 32. Ad Account Tree Summary

Example:

```text
AD1
ACTIVE
₹20,000 tracked
₹5,000 spend today
```

---

# 33. Account Detail Screen

Recommended tabs:

```text
Overview

Financials

Clients

Jobs

Campaigns

Spend

Fund History

Status History

Reconciliation

Audit
```

---

# 34. Account Overview

Show:

```text
Name

Meta Ad Account ID

Path

Status

Can Run Ads

Currency

Timezone

Last Sync

Spend Today

Tracked Fund

Locked Fund

Assigned Clients

Open Alerts
```

---

# 35. Account Financial Summary

Breakdown:

```text
Client-Owned Funds

Agency-Owned Funds

Unattributed Funds

Locked Funds

Allocated Funds

Spend

Refund Pending
```

Never show only one ambiguous balance.

---

# 36. Account Client Breakdown

Example:

```text
Client A
₹5,000

Client B
₹3,000

Agency
₹2,000
```

Total:

```text
₹10,000
```

---

# 37. Account Job Assignments

Show:

```text
Client

Job

Start Date

End Date

Current Status

Allocated Amount

Spend
```

---

# 38. Client Assignment Is Separate

Ad Account’s Meta hierarchy must not change when client changes.

Example:

```text
AD1
```

used by:

```text
Client A
```

today and:

```text
Client B
```

later.

Only assignment history changes.

---

# 39. Account Assignment History

Track:

```text
Ad Account

Client

Job

Effective From

Effective To

Status

Created By
```

---

# 40. Multiple Active Client Assignments

System may allow if business operates shared accounts.

If allowed:

```text
AD1
├── Client A
├── Client B
└── Agency
```

Campaign-level spend attribution required.

---

# 41. Account Status Normalization

Store both:

```text
Raw Meta Status
```

and:

```text
Internal Normalized Status
```

This avoids losing Meta-specific detail while keeping product logic stable.

---

# 42. Can Run Ads Flag

Separate field:

```text
can_run_ads
```

Values:

```text
TRUE

FALSE

UNKNOWN
```

Useful because status labels alone may not perfectly represent operational usability.

---

# 43. Status History

Every status transition stored:

```text
Old Status

New Status

Raw Meta Status

Detected At

Effective At if known

Source
```

---

# 44. Status Timeline

Example:

```text
01 Sep
ACTIVE

10 Sep
PAYMENT_ISSUE

10 Sep
RESTRICTED

12 Sep
ACTIVE
```

---

# 45. Manual Status Report

Team may report issue before API sync.

Internal event:

```text
RESTRICTION_REPORTED
```

This does not overwrite authoritative Meta status silently.

---

# 46. Status Source

Possible:

```text
META_API

ADMIN_OVERRIDE

USER_REPORT

SYSTEM_DERIVED
```

---

# 47. Account Sync

Account data synchronized through background jobs.

Types:

```text
Asset Sync

Status Sync

Details Sync

Spend Sync

Campaign Sync

Financial/Reconciliation Sync
```

---

# 48. Manual Sync

Authorized user can request:

```text
Sync Now
```

Action should enqueue background job.

Do not keep HTTP request open for full large sync.

---

# 49. Sync Status

```text
PENDING

RUNNING

SUCCESS

PARTIAL

FAILED
```

---

# 50. Last Sync Information

Each account:

```text
Last Successful Sync

Last Attempted Sync

Sync Status

Last Error
```

---

# 51. Stale Account

If data exceeds configured freshness threshold:

```text
STALE
```

indicator.

Do not assume stale data equals zero or active.

---

# 52. Sync Failure

Example:

```text
AD1

Last Successful Sync:
45 minutes ago

Latest Attempt:
FAILED
```

Historical values remain visible with stale warning.

---

# 53. Missing From Sync

If account is not returned in one sync:

Do not immediately archive/delete.

Use:

```text
NOT_SEEN_IN_LATEST_SYNC
```

or internal observation counter.

---

# 54. Missing Asset Grace Period

After repeated confirmed absence/access loss:

Status may become:

```text
ACCESS_LOST
```

or:

```text
ARCHIVED
```

according to rule.

---

# 55. Account Access Relationship

Where relevant, track how portfolio/business accesses account.

Possible:

```text
OWNED

SHARED

CLIENT_ACCESS

UNKNOWN
```

This is not financial ownership.

---

# 56. Relationship History

If account moves/access changes:

```text
Previous Portfolio

New Portfolio

Relationship Type

Effective From

Effective To
```

history preserved.

---

# 57. Primary Portfolio

V1 may maintain:

```text
primary_business_portfolio_id
```

for simplified operational display.

But access relationship history should remain extensible.

---

# 58. Account Movement

Example:

```text
Old:
BP1 → AD1

New:
BP2 → AD1
```

Expected:

```text
Canonical AD1 remains same

Current primary mapping updated

Historical mapping retained
```

---

# 59. Account Name Change

Example:

```text
Old Name:
AD1

New Name:
Scaling 01
```

Internal canonical ID and Meta ID unchanged.

Historical labels may be snapshot where needed.

---

# 60. Internal Alias

System may support optional:

```text
Internal Alias
```

Example:

```text
Meta Name:
Business Advertising Account 993

Internal Alias:
Client Scaling 01
```

Alias should never replace Meta ID.

---

# 61. Account Purpose

Optional classification:

```text
PRIMARY

BACKUP

SCALING

TESTING

CLIENT_DEDICATED

SHARED

INTERNAL
```

---

# 62. Account Tags

Optional:

```text
High Spend

Backup

New

Priority

Testing
```

Tags are internal metadata.

---

# 63. Account Manager

Optional assignment:

```text
Assigned Manager
```

This relationship does not change asset hierarchy.

---

# 64. Low Balance Threshold

Per-account config:

```text
Low Balance Threshold:
₹2,000
```

or global default.

---

# 65. Low Balance Alert

When eligible current available fund falls below threshold:

```text
LOW_BALANCE
```

alert.

Locked funds should not count as available.

---

# 66. Account Spend Monitoring

Show:

```text
Spend Today

Spend Yesterday

7-Day Spend

30-Day Spend

Average Spend
```

where synced.

---

# 67. No-Spend Detection

If expected active account/job shows no spend:

```text
NO_SPEND
```

alert based on configurable rule.

---

# 68. Post-Completion Spend Detection

If campaign/job marked completed but mapped Meta campaign continues spending:

```text
POST_COMPLETION_SPEND
```

critical/high alert.

---

# 69. Restricted Account Handling

When restriction confirmed:

```text
Account Status → RESTRICTED

Affected Funds → LOCKED where applicable

Active Jobs → Review Required

Recovery Case → Created
```

according to business rules.

---

# 70. Account Recovery

When restored:

```text
RESTRICTED
↓
ACTIVE
```

then:

```text
Verify Balance
↓
Run Reconciliation
↓
Unlock Valid Funds
```

---

# 71. Financial Lock Is Separate From Status

Do not automatically unlock just because status became ACTIVE.

Financial verification required.

---

# 72. Account Reconciliation

Account detail should compare:

```text
Meta Operational Values

Internal Ledger

Ownership Allocations

Spend Attribution
```

---

# 73. Reconciliation Status

Possible:

```text
MATCHED

MISMATCH

UNDER_REVIEW

WAITING_FOR_SYNC
```

---

# 74. Account Reconciliation Card

Example:

```text
Internal Tracked:
₹20,000

External/Derived:
₹19,500

Difference:
₹500

Status:
MISMATCH
```

---

# 75. Account Campaign Mapping

Display mapped:

```text
Meta Campaign ID

Campaign Name

Client

Internal Job

Status

Spend
```

---

# 76. Unmapped Campaigns

Meta campaigns without internal job mapping:

```text
UNMAPPED
```

list.

Useful for spend attribution cleanup.

---

# 77. Account Fund History

Timeline should show:

```text
Client Allocation

Agency Allocation

Spend

Lock

Unlock

Refund

Adjustment

Transfer
```

---

# 78. Account Financial Timeline

Example:

```text
10:00
Client A allocation +₹5,000

12:00
Spend -₹1,500

15:00
Client B allocation +₹3,000

22:00
Restriction detected

22:01
₹6,500 marked locked
```

---

# 79. Account History Preservation

Never hard-delete account financial/status history.

Even if account:

```text
ARCHIVED
```

history remains searchable.

---

# 80. Archive Ad Account

Archiving means:

```text
No longer actively used
```

not:

```text
Delete data
```

---

# 81. Archive Conditions

Before archive, check:

```text
Active Jobs

Available Funds

Locked Funds

Refund Pending

Open Reconciliation

Pending Transactions
```

---

# 82. Archive Warning

If open financial issues:

```text
Financial closure pending
```

Account may be operationally archived but financial state stays open.

---

# 83. Restore Archived Account

If access/account becomes active again:

Authorized user/system can:

```text
Restore / Reactivate Internal Record
```

Canonical ID remains same.

---

# 84. Hard Delete

Hard delete allowed only for records with:

```text
No financial history

No client assignment

No audit dependency

No synced canonical history
```

Prefer avoiding in production.

---

# 85. Manual Account Creation

If needed before Meta discovery:

```text
Create Placeholder Account
```

Status:

```text
PENDING_VERIFICATION
```

Must include expected Meta Ad Account ID.

---

# 86. Placeholder Matching

When sync later finds same Meta ID:

```text
Merge into canonical record
```

Do not create duplicate.

---

# 87. Unknown Account Ownership

If account relationship unclear:

```text
Access Type:
UNKNOWN
```

Do not infer ownership.

---

# 88. Unknown Portfolio Mapping

If account discovered but parent unresolved:

```text
Portfolio:
UNRESOLVED
```

Create internal alert.

---

# 89. Orphan Account Queue

Dedicated filtered view:

```text
Accounts with unresolved portfolio/access mapping
```

---

# 90. Duplicate Detection

System should guard against:

```text
Duplicate Meta Ad Account ID

Duplicate Meta Business ID

Duplicate Sync Event
```

---

# 91. Idempotent Asset Upsert

Sync should use canonical external IDs.

Example:

```text
act_123
```

existing?

```text
YES → UPDATE
NO → CREATE
```

---

# 92. Financial Aggregation

Connection/portfolio account totals derived from canonical accounts.

Do not double-count account if it appears through multiple access relationships.

---

# 93. Connection Aggregate

Example:

```text
Ads Pro

Ad Accounts:
20

Tracked Fund:
₹5,00,000

Locked:
₹50,000
```

---

# 94. Portfolio Aggregate

Example:

```text
BP1

Accounts:
6

Tracked:
₹1,20,000

Locked:
₹10,000
```

---

# 95. Aggregation by Currency

If multiple currencies:

```text
INR ₹1,20,000
USD $800
```

show separately unless conversion configured.

---

# 96. Account Quick Actions

Role-based:

```text
Sync Now

Open Client Assignments

View Financials

Report Issue

Create Recovery Case

Assign Manager

Archive
```

---

# 97. Sensitive Actions

Actions such as:

```text
Archive

Manual Status Override

Manual Financial Adjustment
```

require permissions and audit logs.

---

# 98. Audit Events

Track:

```text
Connection Added

Connection Disabled

Connection Reconnected

Portfolio Discovered

Ad Account Discovered

Account Renamed

Status Changed

Portfolio Mapping Changed

Manager Assigned

Account Archived

Account Restored

Manual Sync Triggered
```

---

# 99. Account Metadata Edit

Users may edit internal fields:

```text
Alias

Purpose

Tags

Manager

Notes

Low Balance Threshold
```

Do not manually edit Meta authoritative fields unless correction mechanism explicitly exists.

---

# 100. Raw Meta Data

Optional advanced/debug view:

```text
Latest Raw Meta Response / Selected Fields
```

Admin/developer access only.

Avoid exposing tokens/secrets.

---

# 101. Account Notes

Users can add operational notes:

```text
Account under review

Use only for Client X

Backup account

Payment issue contacted
```

Notes should have author/time.

---

# 102. Account Attachments

Optional:

```text
Screenshots

Meta Support Responses

Restriction Proof

Billing Proof
```

linked to account/recovery case.

---

# 103. Account Activity Timeline

Unified timeline:

```text
Sync

Status Change

Client Assignment

Financial Allocation

Restriction

Recovery

Notes
```

with permission filtering.

---

# 104. Account Management Permissions

Typical permissions involved:

```text
VIEW_AD_ACCOUNT

VIEW_AD_ACCOUNT_FINANCIALS

EDIT_AD_ACCOUNT_INTERNAL_METADATA

ASSIGN_AD_ACCOUNT_MANAGER

TRIGGER_META_SYNC

REPORT_ACCOUNT_RESTRICTION

ARCHIVE_AD_ACCOUNT
```

---

# 105. Ads Manager Experience

Ads Manager should quickly answer:

```text
Which accounts can run?

Which accounts are restricted?

Which accounts have low balance?

Which client/job is on which account?

Which account needs reassignment?
```

---

# 106. Finance Experience

Finance should quickly answer:

```text
How much fund is in this account?

Whose money is it?

How much is locked?

Any reconciliation difference?

Any refund pending?
```

---

# 107. Admin Experience

Admin should see:

```text
Connection health

Account access health

Status history

Financial exposure

Audit history

High-risk issues
```

---

# 108. Account List Performance

System may contain hundreds/thousands of accounts.

Need:

```text
Pagination / Virtualization

Indexed Search

Server-Side Filters

Cached Aggregates
```

---

# 109. Account Detail Performance

Do not load all:

```text
Transactions

Campaigns

Spend History
```

at once.

Use tabs/pagination.

---

# 110. Sync Frequency

Different data types may sync independently.

Initial configurable approach:

```text
Account Status:
Frequent

Spend:
Periodic

Asset Discovery:
Less Frequent

Full Reconciliation:
Scheduled
```

Exact intervals configured later based on Meta limits and business needs.

---

# 111. Manual Sync Rate Protection

Users should not spam:

```text
Sync Now
```

Use cooldown / queue deduplication.

---

# 112. Sync Job Deduplication

If account sync already queued/running:

new request can:

```text
Reuse Existing Job
```

or reject duplicate.

---

# 113. Account Data Freshness

Display per source:

```text
Status Synced At

Spend Synced At

Campaigns Synced At

Asset Details Synced At
```

because not all data necessarily has same freshness.

---

# 114. Error Handling

Account should support errors such as:

```text
Permission Lost

Token Expired

Rate Limited

Asset Not Accessible

Malformed Response

Temporary API Failure
```

Errors should not erase last known valid state.

---

# 115. Error Severity

Examples:

```text
INFO
Temporary rate limit

HIGH
Permission lost

CRITICAL
Connection authentication invalid across many accounts
```

---

# 116. Account Access Lost

If Meta access disappears:

```text
ACCESS_LOST
```

internal state.

Financial history remains.

---

# 117. Access Restored

If account becomes visible again:

Reuse canonical account.

Do not treat as new asset.

---

# 118. Account Financial Closure

Operational account state and financial state separate.

Example:

```text
Operational:
ARCHIVED

Financial:
OPEN
```

because ₹5,000 locked.

---

# 119. Financial Account Status

Possible:

```text
OPEN

CLOSURE_PENDING

CLOSED
```

---

# 120. Closure Requirements

Financial closure requires:

```text
Available Fund resolved

Locked Fund resolved

Refund Pending resolved

Client Allocations resolved

Reconciliation cases resolved

Pending financial actions resolved
```

---

# 121. Account Management Reports

Relevant:

```text
Account Status Report

Restricted Account Report

Low Balance Report

Locked Fund Report

Account Spend Report

Account Reconciliation Report

Account Assignment Report
```

---

# 122. V1 Must-Have

```text
Meta Connection List

Connection Detail

Portfolio Discovery

Portfolio List

Ad Account Discovery

Ad Account List

Account Tree

Search

Filters

Status Sync

Spend Summary

Client Assignments

Financial Summary

Restriction Indicators

Status History

Sync History

Archive
```

---

# 123. V1 Should-Have

```text
Account Manager Assignment

Tags

Purpose Classification

Low Balance Threshold

Recovery Case Shortcut

Detailed Account Timeline
```

---

# 124. Future Features

```text
Automated Account Selection

Risk Scoring

Cross-Platform Accounts

Performance-Based Routing

AI Issue Summaries

Automatic Reallocation Suggestions
```

Financial ownership changes should still remain controlled.

---

# 125. Account Management Integrity Rules

System must enforce:

```text
1. Meta Ad Account ID is canonical external identity.

2. Display names are never treated as unique IDs.

3. Same Ad Account must not be duplicated across access relationships.

4. Client assignment must remain separate from Meta hierarchy.

5. Financial ownership must remain separate from asset ownership/access.

6. Status history must be preserved.

7. Failed sync must not delete last known data.

8. Missing asset in one sync must not trigger immediate deletion.

9. Archived accounts retain financial and audit history.

10. Locked funds cannot be treated as available.

11. Account mapping changes must remain historically traceable.

12. Unknown data should remain unknown rather than guessed.

13. Aggregates must not double-count canonical accounts.

14. Every sensitive account action must be audited.
```

---

# 126. Account Management Golden Rule

> **Every Meta asset must have one stable internal identity, a traceable hierarchy, a visible current operational state and preserved history. Client usage, financial ownership and account access are separate relationships and must never be merged into one ambiguous account record.**
