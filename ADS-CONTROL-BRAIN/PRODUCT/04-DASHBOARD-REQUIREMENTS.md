# Dashboard Requirements

## Overview

Dashboard system ka primary command center hoga.

User login karte hi dashboard ko ye answer karna chahiye:

```text id="dsh001"
Meta assets ka current health kya hai?

Kitne Ad Accounts active/restricted hain?

Kitna fund tracked hai?

Kitna client-owned hai?

Kitna agency-owned hai?

Kitna amount locked hai?

Vendors ko kitna dena hai?

Vendors se kitna lena hai?

Kaunse financial issues unresolved hain?

Kaunse alerts immediate attention require karte hain?
```

Dashboard ka purpose sirf attractive charts show karna nahi hai.

Primary purpose:

```text id="dsh002"
VISIBILITY
+
ACTIONABILITY
+
FINANCIAL CONTROL
+
RISK DETECTION
```

---

# 1. Dashboard Principles

Dashboard should follow:

```text id="dsh003"
1. Important data first

2. Critical issues clearly visible

3. Every summary should drill down

4. Meta data freshness visible

5. Financial data should come from ledger/allocations

6. No double counting

7. Role-based visibility

8. Fast loading

9. Clear status hierarchy

10. No ambiguous balance terminology
```

---

# 2. Dashboard Sections

Recommended desktop dashboard:

```text id="dsh004"
Header
↓
Critical Alerts
↓
Primary KPI Cards
↓
Meta Account Health
↓
Financial Position
↓
Client Operations
↓
Vendor Position
↓
Spend Overview
↓
Reconciliation
↓
Recent Activity
```

---

# 3. Dashboard Header

Header should contain:

```text id="dsh005"
Dashboard Title

Current Workspace / Company

Global Date Filter

Last Meta Sync

Global Search

Notifications

User Profile
```

---

# 4. Current Workspace

If future multi-company support exists:

```text id="dsh006"
Workspace:
Company A
```

User should always know which organization's data they are viewing.

---

# 5. Date Filter

Dashboard should support:

```text id="dsh007"
Today

Yesterday

Last 7 Days

Last 30 Days

This Month

Last Month

Custom Range
```

Not every KPI should obey date filter.

For example:

```text id="dsh008"
Current Vendor Payable
```

is current-state data.

Whereas:

```text id="dsh009"
Spend
```

is date-range data.

UI should make this distinction clear.

---

# 6. Last Sync Indicator

Header:

```text id="dsh010"
Meta Last Synced:
2 minutes ago
```

Possible health:

```text id="dsh011"
Healthy

Delayed

Stale

Failed
```

If stale:

```text id="dsh012"
STALE DATA
```

badge should be visible.

---

# 7. Primary KPI Row

Recommended first row:

```text id="dsh013"
Total Ad Accounts

Active Accounts

Restricted Accounts

Locked Funds

Critical Alerts
```

These are operational priority metrics.

---

# 8. Total Meta Connections

Card:

```text id="dsh014"
Meta Connections
8
```

Supporting:

```text id="dsh015"
Healthy: 7
Auth Required: 1
```

Click:

```text id="dsh016"
Meta Connections List
```

---

# 9. Total Business Portfolios

Card:

```text id="dsh017"
Business Portfolios
24
```

Supporting:

```text id="dsh018"
Across 8 connections
```

---

# 10. Total Ad Accounts

Card:

```text id="dsh019"
Ad Accounts
118
```

Supporting:

```text id="dsh020"
Active 102
Issues 16
```

Click opens account list.

---

# 11. Active Accounts

Definition:

```text id="dsh021"
Accounts currently normalized as operationally active
```

Card:

```text id="dsh022"
Active
102
```

Do not derive solely from account existence.

---

# 12. Restricted Accounts

Card:

```text id="dsh023"
Restricted
8
```

Supporting:

```text id="dsh024"
₹85,000 locked
```

Click opens filtered restricted account view.

---

# 13. Disabled Accounts

Separate if business needs distinction:

```text id="dsh025"
Disabled
4
```

---

# 14. Payment Issue Accounts

Card or sub-metric:

```text id="dsh026"
Payment Issues
3
```

Click filtered list.

---

# 15. Unknown / Stale Accounts

Important:

```text id="dsh027"
Status Unknown
2
```

This should not be merged into Active or Restricted.

---

# 16. Financial KPI Row

Recommended:

```text id="dsh028"
Client-Owned Funds

Agency Free Funds

Locked Funds

Vendor Payable

Vendor Receivable

Refund Pending
```

---

# 17. Client-Owned Funds

Definition:

```text id="dsh029"
All currently tracked funds whose business ownership belongs to clients
```

May include:

```text id="dsh030"
Available Wallet Funds

Allocated Funds

Unused Funds

Locked Funds
```

If card shows total ownership, breakdown must prevent confusion.

Example:

```text id="dsh031"
Client-Owned Funds
₹12,40,000

Available ₹4,20,000
Allocated ₹6,70,000
Locked ₹1,50,000
```

---

# 18. Agency Free Funds

Definition:

```text id="dsh032"
Company-owned amount currently available for valid allocation/use
```

Do not include:

```text id="dsh033"
Client unresolved leftovers

Vendor receivables

Locked agency funds

Pending transfers
```

Example:

```text id="dsh034"
Agency Free Fund
₹3,25,000
```

---

# 19. Locked Funds

Card:

```text id="dsh035"
Locked Funds
₹1,85,000
```

Breakdown:

```text id="dsh036"
Client:
₹1,20,000

Agency:
₹65,000
```

Click:

```text id="dsh037"
Locked Fund Report
```

---

# 20. Vendor Payable

Card:

```text id="dsh038"
Vendor Payable
₹8,50,000
```

Supporting:

```text id="dsh039"
5 Vendors
3 aged >15 days
```

Click vendor payable list.

---

# 21. Vendor Receivable

Card:

```text id="dsh040"
Vendor Receivable
₹45,000
```

Supporting:

```text id="dsh041"
2 Vendors
Oldest 27 days
```

This metric should be visually distinguishable from payable.

---

# 22. Refund Pending

Card:

```text id="dsh042"
Refund Pending
₹70,000
```

Supporting:

```text id="dsh043"
12 Requests
4 aged >7 days
```

---

# 23. Unresolved Leftovers

Card:

```text id="dsh044"
Unresolved Client Funds
₹1,10,000
```

This is important because unresolved leftover should not disappear into general balance.

---

# 24. Financial KPI Data Source

Dashboard financial values must come from:

```text id="dsh045"
Internal Ledger

Fund Allocations

Current Financial States
```

not from raw manually maintained balance columns.

---

# 25. Meta Account Health Section

Recommended table/card group:

```text id="dsh046"
Account Status
Count
Tracked Fund
Locked Fund
Spend Today
```

Example:

| Status        | Accounts | Tracked Fund | Locked Fund |
| ------------- | -------: | -----------: | ----------: |
| Active        |      102 |   ₹18,00,000 |          ₹0 |
| Restricted    |        8 |    ₹1,85,000 |   ₹1,85,000 |
| Disabled      |        4 |      ₹40,000 |     ₹35,000 |
| Unknown/Stale |        4 |      ₹75,000 |           — |

---

# 26. Account Health by Connection

Show:

```text id="dsh047"
Ads Pro
24 Accounts
2 Restricted
₹20,000 Locked
```

```text id="dsh048"
Ads Backup
18 Accounts
0 Restricted
Healthy
```

This helps identify which main connection has issues.

---

# 27. Account Health by Portfolio

Optional top-risk list:

```text id="dsh049"
BP1
12 Accounts
3 Restricted

BP7
8 Accounts
2 Payment Issues
```

---

# 28. Critical Account List

Show top actionable accounts:

```text id="dsh050"
AD1
RESTRICTED
₹20,000 Locked
3 Clients Affected

AD7
PAYMENT ISSUE
Spend Stopped

AD15
LOW BALANCE
₹850 Remaining
```

---

# 29. Client Operations Section

Recommended metrics:

```text id="dsh051"
Active Clients

Active Jobs

Client Spend

Unused Client Funds

Locked Client Funds

Client Refund Pending
```

---

# 30. Active Clients

Definition:

Clients with:

```text id="dsh052"
ACTIVE status
```

or optionally active jobs within selected period.

Label should clearly state metric definition.

---

# 31. Active Client Jobs

Card:

```text id="dsh053"
Active Jobs
48
```

Supporting:

```text id="dsh054"
6 require attention
```

---

# 32. Client Spend

Date-sensitive:

```text id="dsh055"
Client Attributed Spend
₹4,85,000
```

for selected range.

Supporting:

```text id="dsh056"
Unattributed Spend:
₹5,200
```

---

# 33. Underfunded Jobs

Show:

```text id="dsh057"
Underfunded Jobs
7
```

Click list:

```text id="dsh058"
Client
Job
Required
Available
Funding Gap
```

---

# 34. Client Leftover Aging

Example widget:

```text id="dsh059"
Unresolved Leftover

0–7 days      ₹40,000
8–15 days     ₹25,000
16–30 days    ₹15,000
31+ days      ₹30,000
```

---

# 35. Client Locked Fund List

Top cases:

```text id="dsh060"
Client A
₹20,000
AD1
Locked 12 days

Client B
₹15,000
AD5
Locked 25 days
```

---

# 36. Vendor Section

Recommended:

```text id="dsh061"
Total Active Vendors

Current Payable

Current Receivable

Pending Settlements

Aged Payables

Aged Receivables
```

---

# 37. Vendor Payable Aging

Widget:

```text id="dsh062"
Vendor Payable Aging

0–7 Days:
₹3,00,000

8–15 Days:
₹2,00,000

16–30 Days:
₹2,50,000

31+ Days:
₹1,00,000
```

---

# 38. Vendor Receivable Aging

Widget:

```text id="dsh063"
Vendor Receivables

0–7 Days:
₹15,000

8–15 Days:
₹10,000

16–30 Days:
₹5,000

31+ Days:
₹15,000
```

---

# 39. Vendor Attention List

Example:

```text id="dsh064"
RAM
Receivable ₹10,000
Open 27 days

SHYAM
Payable ₹80,000
Open 18 days

Vendor C
Settlement Pending ₹50,000
```

---

# 40. Spend Overview

Dashboard should show spend trend for selected date range.

Metrics:

```text id="dsh065"
Spend Today

Spend Yesterday

7-Day Spend

30-Day Spend

Average Daily Spend
```

---

# 41. Spend Data Hierarchy

Allow toggle:

```text id="dsh066"
Total Spend

By Meta Connection

By Business Portfolio

By Ad Account

By Client

By Job
```

---

# 42. Spend Today

Example:

```text id="dsh067"
Spend Today
₹2,85,000
```

Supporting:

```text id="dsh068"
Attributed:
₹2,80,000

Unattributed:
₹5,000
```

---

# 43. Spend Trend Chart

Recommended:

```text id="dsh069"
Daily spend line/bar chart
```

Chart should be simple and readable.

No excessive visual clutter.

---

# 44. Spend Spike Indicator

If spend exceeds configured pattern/threshold:

```text id="dsh070"
SPEND_SPIKE
```

show in alerts, not necessarily calculate speculative anomaly in V1.

Threshold-based initial implementation is safer.

---

# 45. No Spend Indicator

Accounts/jobs expected to spend but showing zero:

```text id="dsh071"
NO_SPEND
```

list.

Example:

```text id="dsh072"
AD4
Active
₹20,000 allocated
Spend today ₹0
```

---

# 46. Post-Completion Spend

Critical:

```text id="dsh073"
Completed Job Still Spending
```

should appear prominently.

---

# 47. Reconciliation Section

Metrics:

```text id="dsh074"
Open Cases

Total Difference Value

Critical Cases

Waiting for Sync

Oldest Case
```

---

# 48. Open Reconciliation Cases

Example:

```text id="dsh075"
Open Cases
14
```

Breakdown:

```text id="dsh076"
Meta vs Ledger: 6
Client: 4
Vendor: 2
Spend Attribution: 2
```

---

# 49. Reconciliation Exposure

Example:

```text id="dsh077"
Unresolved Difference
₹42,500
```

This should not necessarily be called a loss.

It is:

```text id="dsh078"
Unresolved Difference
```

until investigation determines cause.

---

# 50. Old Reconciliation Cases

Show:

```text id="dsh079"
Cases >7 Days
5
```

click to review.

---

# 51. Alerts Section

Dashboard should show highest priority open alerts.

Example:

```text id="dsh080"
CRITICAL
AD1 Restricted — ₹20,000 locked

HIGH
Vendor RAM — ₹10,000 receivable open 27 days

HIGH
Client A — Refund ₹15,000 pending 10 days

WARNING
Meta Connection Ads Backup — Sync failed
```

---

# 52. Alert Ordering

Default:

```text id="dsh081"
Severity
↓
Age
↓
Amount Exposure
```

Exact sorting rules configurable.

---

# 53. Alert Counts

Header notification:

```text id="dsh082"
Critical 3

High 7

Warning 12
```

---

# 54. Alert Drill-Down

Clicking alert should open relevant entity/case, not generic alert page only.

Example:

```text id="dsh083"
Restricted Account Alert
→ AD1 Restricted Account Detail
```

---

# 55. Approval Section

Users with approval permission should see:

```text id="dsh084"
Pending Approvals
```

Examples:

```text id="dsh085"
Vendor Settlement
₹50,000

Cross-Client Transfer
₹3,000

Refund
₹20,000

Manual Adjustment
₹500
```

---

# 56. Approval Exposure

Card:

```text id="dsh086"
Pending Approval Value
₹2,40,000
```

with count.

---

# 57. Recent Activity

Timeline:

```text id="dsh087"
2 min ago
AD1 restricted

5 min ago
Client A payment ₹20,000 posted

10 min ago
RAM settlement ₹30,000 approved

15 min ago
Meta sync completed

20 min ago
Client B refund ₹5,000 completed
```

---

# 58. Recent Activity Permissions

User should only see events they are authorized to view.

Ads Manager should not automatically see sensitive vendor financial events.

---

# 59. Dashboard Role Variants

Dashboard content should change by role.

---

# 60. Admin Dashboard

Admin sees:

```text id="dsh088"
Full Meta Health

Full Financial Position

Client Position

Vendor Position

Approvals

Reconciliation

Critical Alerts

System Health
```

---

# 61. Finance Dashboard

Finance priority:

```text id="dsh089"
Client Funds

Vendor Payables

Vendor Receivables

Refunds

Leftovers

Locked Funds

Reconciliation

Pending Approvals
```

Operational campaign metrics secondary.

---

# 62. Ads Manager Dashboard

Ads Manager priority:

```text id="dsh090"
Active Accounts

Restricted Accounts

Payment Issues

Low Balance

Spend Today

No-Spend Accounts

Active Jobs

Affected Clients
```

Vendor/accounting detail limited.

---

# 63. Viewer Dashboard

Read-only configured metrics.

No quick actions that mutate data.

---

# 64. Dashboard Quick Actions

Role-based quick actions:

```text id="dsh091"
Add Client

Add Client Payment

Create Client Job

Add Vendor Funding

Create Vendor Settlement

Create Refund

Trigger Meta Sync
```

Only show actions user can actually execute.

---

# 65. Quick Action Permissions

Example:

Ads Manager sees:

```text id="dsh092"
Create Client Job
Trigger Meta Sync
```

Finance sees:

```text id="dsh093"
Add Client Payment
Add Vendor Funding
Create Settlement
```

Admin sees all permitted actions.

---

# 66. Financial Summary Equation Checks

Dashboard should validate internal consistency.

For example:

```text id="dsh094"
Client-Owned Total
```

must equal sum of its component states according to configured model.

If not:

```text id="dsh095"
DASHBOARD_RECONCILIATION_ERROR
```

or internal monitoring alert.

---

# 67. Avoid Misleading "Total Balance"

Do not show a single:

```text id="dsh096"
Total Balance
```

without definition.

Instead specify:

```text id="dsh097"
Client-Owned Funds

Agency Free Funds

Locked Funds

Vendor Payable

Vendor Receivable
```

because these values have different meanings.

---

# 68. Do Not Net Vendor Payable and Receivable by Default

Example:

```text id="dsh098"
Vendor Payable:
₹50,000

Vendor Receivable:
₹10,000
```

Dashboard should not only show:

```text id="dsh099"
Net Vendor Balance:
₹40,000
```

because it hides receivable risk.

Optional net exposure can be secondary.

---

# 69. Current vs Period Metrics

Dashboard should distinguish:

### Current-State Metrics

```text id="dsh100"
Current Payable

Current Receivable

Current Locked Funds

Current Wallet Funds
```

### Period Metrics

```text id="dsh101"
Spend This Month

Payments Received This Month

Refunds This Month

Vendor Repayments This Month
```

---

# 70. Client Payments Received

Optional period card:

```text id="dsh102"
Client Payments Received
₹9,20,000
This Month
```

This is cash inflow, not revenue unless classified separately.

---

# 71. Vendor Funding Received

Optional:

```text id="dsh103"
Vendor Funding Received
₹5,00,000
This Month
```

Must not be shown as revenue.

---

# 72. Vendor Repayments

Optional:

```text id="dsh104"
Vendor Repayments
₹3,80,000
This Month
```

---

# 73. Refunds Completed

Optional:

```text id="dsh105"
Client Refunds
₹75,000
This Month
```

---

# 74. Fund Movement Summary

Possible widget:

```text id="dsh106"
Client Payments      +₹9.2L
Vendor Funding       +₹5.0L
Ad Spend             -₹8.4L
Vendor Repayment     -₹3.8L
Client Refunds       -₹0.75L
```

This is movement overview, not P&L.

---

# 75. No Profit/Loss Assumption

Dashboard should not present:

```text id="dsh107"
Profit
```

unless actual revenue/cost accounting model is implemented.

Client payment ≠ revenue.

Vendor funding ≠ revenue.

Ad spend ≠ necessarily business expense in P&L context.

---

# 76. Account Tree Snapshot

Dashboard may contain compact tree/list:

```text id="dsh108"
Ads Pro
24 Accounts
2 Restricted

Ads Backup
18 Accounts
Healthy
```

Full tree lives in dedicated screen.

---

# 77. Top Accounts by Spend

Widget:

```text id="dsh109"
AD1 ₹45,000
AD7 ₹32,000
AD3 ₹28,000
```

for selected period.

---

# 78. Top Clients by Spend

Widget:

```text id="dsh110"
Client A ₹50,000
Client B ₹35,000
Client C ₹30,000
```

This is descriptive, not performance ranking.

---

# 79. Highest Locked Amounts

Widget:

```text id="dsh111"
AD1 ₹25,000
AD5 ₹20,000
AD7 ₹15,000
```

Useful for risk prioritization.

---

# 80. Oldest Locked Funds

Widget:

```text id="dsh112"
AD4 ₹10,000 — 35 days
AD7 ₹15,000 — 21 days
```

---

# 81. Low Balance Accounts

Example:

```text id="dsh113"
AD8
₹500
Threshold ₹2,000

AD9
₹750
Threshold ₹1,500
```

---

# 82. Account Balance Threshold

Each account can use:

```text id="dsh114"
Global Default Threshold
```

or:

```text id="dsh115"
Custom Threshold
```

Dashboard uses configured value.

---

# 83. Pending Financial Actions

Widget:

```text id="dsh116"
Refunds Pending: 7

Settlements Pending: 4

Adjustments Pending: 2

Transfers Pending: 3
```

---

# 84. Dashboard Data Freshness

Every widget should know its source freshness.

Examples:

```text id="dsh117"
Meta Spend:
Synced 3 min ago

Ledger:
Real-time/current

Reconciliation:
Last run 10 min ago
```

---

# 85. Freshness Tooltip

On hover/click:

```text id="dsh118"
Source:
Meta Insights API

Last Successful Sync:
17 Sep 2026 14:32
```

---

# 86. Stale Widget Behavior

If Meta data stale:

Do not hide widget.

Show last known value with:

```text id="dsh119"
STALE
```

indicator.

---

# 87. Failed Data Source

Example:

Meta sync failed.

Dashboard:

```text id="dsh120"
Spend Today
₹2,85,000

Data may be outdated
Last successful sync: 45 min ago
```

Better than showing false zero.

---

# 88. Empty State

If no data:

```text id="dsh121"
No Meta Connections Yet
```

with relevant action:

```text id="dsh122"
Connect Meta Account
```

if user has permission.

---

# 89. Zero State vs Missing Data

Important distinction:

```text id="dsh123"
₹0
```

means known zero.

```text id="dsh124"
—
Unknown / Not Synced
```

means missing data.

Do not use zero for unknown.

---

# 90. Dashboard Filters

Global filters may include:

```text id="dsh125"
Date

Meta Connection

Business Portfolio

Ad Account

Client

Vendor

Currency
```

Not all widgets should apply all filters.

---

# 91. Filter State

Selected filters should be visibly displayed.

Example:

```text id="dsh126"
Connection: Ads Pro
Portfolio: BP1
Period: Today
```

---

# 92. Filter Persistence

Optional:

Remember user's latest dashboard filters during session.

Do not create confusing permanent defaults without explicit user preference.

---

# 93. Currency Handling

If multiple currencies:

Dashboard must not directly add currencies.

Example:

```text id="dsh127"
INR ₹5,00,000
USD $2,000
```

show separately unless reporting currency conversion enabled.

---

# 94. Reporting Currency

Future:

```text id="dsh128"
Reporting Currency:
INR
```

with explicit FX conversion rules.

---

# 95. Mobile/Responsive Dashboard

Desktop is primary operations interface.

Responsive layout should:

```text id="dsh129"
Stack KPI Cards

Allow Horizontal Table Scroll

Keep Critical Alerts Near Top

Preserve Search/Filters
```

---

# 96. Performance Requirement

Dashboard should not execute dozens of heavy real-time aggregate queries directly on every page load.

Use:

```text id="dsh130"
Optimized Queries

Indexes

Cached Aggregates

Summary Tables / Materialized Views if needed

Background Reconciliation
```

---

# 97. Dashboard API Strategy

Prefer dedicated dashboard endpoints.

Example:

```text id="dsh131"
GET /dashboard/overview

GET /dashboard/account-health

GET /dashboard/financial-summary

GET /dashboard/alerts

GET /dashboard/spend
```

instead of frontend manually combining many unrelated APIs.

Final API design comes later.

---

# 98. Snapshot vs Live Data

Some metrics can be calculated live:

```text id="dsh132"
Current Ledger Balances
```

Others may use latest snapshot:

```text id="dsh133"
Meta Account Status

Meta Spend
```

Source should remain clear.

---

# 99. Real-Time Updates

Useful real-time events:

```text id="dsh134"
New Critical Alert

Approval Status Changed

Financial Transaction Posted

Account Restriction Detected

Meta Sync Completed
```

Dashboard can update cards without full page refresh.

---

# 100. Dashboard Drill-Down Rule

Every summary metric should have a predictable detail destination.

Example:

```text id="dsh135"
Restricted Accounts
→ Ad Accounts filtered by Restricted
```

```text id="dsh136"
Vendor Receivable
→ Vendors filtered by Open Receivable
```

```text id="dsh137"
Locked Funds
→ Locked Fund Report
```

---

# 101. Metric Tooltip

Complex metrics should explain definition.

Example:

```text id="dsh138"
Agency Free Funds

Company-owned available funds that are not locked, allocated, pending refund or otherwise reserved.
```

This prevents user confusion.

---

# 102. Dashboard Alert Colors

Use consistent severity design:

```text id="dsh139"
Critical

High

Warning

Info
```

Do not overuse red for normal data.

---

# 103. Financial Color Semantics

Avoid assuming:

```text id="dsh140"
Green = money received = always good

Red = money paid = always bad
```

Financial meaning differs.

Colors should communicate:

```text id="dsh141"
Status
Risk
Attention
```

not simplistic profit/loss.

---

# 104. Dashboard Auditability

If user clicks a financial number, they should eventually be able to reach underlying transactions.

Example:

```text id="dsh142"
Vendor Payable ₹80,000
↓
Vendor
↓
Funding Batches
↓
Funding Transactions / Settlements
```

---

# 105. Management Summary

Optional top summary:

```text id="dsh143"
118 Ad Accounts
8 Restricted
₹1.85L Locked
₹8.50L Vendor Payable
₹45K Vendor Receivable
14 Reconciliation Cases
```

Concise operational snapshot.

---

# 106. Daily Operations View

Future/optional specialized view:

```text id="dsh144"
Accounts requiring fund

Accounts restricted today

Jobs underfunded

Refunds to process

Vendor settlements due

Reconciliation cases requiring action
```

---

# 107. Today's Attention Queue

Recommended dashboard block:

```text id="dsh145"
Needs Attention
```

Sorted list:

```text id="dsh146"
1. AD1 restricted — ₹20k locked
2. Client A refund pending 10 days
3. RAM receivable ₹10k open 27 days
4. BP2 Meta sync failed
5. JOB-101 underfunded by ₹5k
```

---

# 108. Attention Queue Rule

Queue should be based on explicit business conditions.

Do not use opaque AI prioritization in V1.

Priority rules can use:

```text id="dsh147"
Severity

Age

Amount

Operational Impact
```

---

# 109. Dashboard User Personalization

Future:

```text id="dsh148"
Saved Filters

Widget Arrangement

Favorite Portfolios
```

Not necessary for V1.

---

# 110. Dashboard Export

Dashboard itself does not need to act as complete report.

Detailed export should happen from report/detail screens.

Optional snapshot export later.

---

# 111. Dashboard Data Security

A user must never receive hidden unauthorized financial data in API payload even if frontend hides it.

Backend should return role-appropriate data only.

---

# 112. Dashboard for Restricted Scope User

If Ads Manager only has BP1 access:

Dashboard metrics should calculate only BP1-scope operational data where applicable.

Do not show global totals they cannot access.

---

# 113. Scope Label

If dashboard is scoped:

```text id="dsh149"
Viewing:
BP1 Only
```

should be visible.

---

# 114. Financial Totals and Scope

Finance users with global finance access may see all financial totals even if they do not manage Meta assets operationally.

Scope model must be explicit.

---

# 115. System Health

Admin-only optional section:

```text id="dsh150"
Meta Sync Health

Worker Queue Health

Failed Jobs

Last Reconciliation Run

Database/Service Health
```

Detailed technical monitoring may live elsewhere.

---

# 116. Dashboard Loading State

Use skeleton/loading indicators.

Do not initially show:

```text id="dsh151"
₹0
```

while actual value is still loading.

---

# 117. Error State

If one widget fails:

Dashboard should still load other widgets.

Example:

```text id="dsh152"
Vendor Summary unavailable
Retry
```

rather than entire dashboard failing.

---

# 118. Data Consistency Timestamp

For financial management views, optionally show:

```text id="dsh153"
Financial data current as of:
14:35
```

especially if using cached aggregates.

---

# 119. Dashboard Logging

System can capture:

```text id="dsh154"
Dashboard load failures

Slow queries

Widget API failures
```

for observability.

Not business audit events unless user action occurs.

---

# 120. Dashboard Success Criteria

Dashboard is successful if an authorized user can answer within seconds:

```text id="dsh155"
How many accounts are restricted?

How much money is locked?

Which clients are affected?

Which accounts have low balance?

How much do we owe vendors?

How much do vendors owe us?

Which refunds are pending?

Which leftovers are unresolved?

Where are reconciliation mismatches?

What needs action right now?
```

---

# 121. V1 Dashboard Must-Have

V1 minimum:

```text id="dsh156"
Meta Connection Count

Business Portfolio Count

Ad Account Count

Active / Restricted / Disabled Counts

Spend Today

Client-Owned Funds

Agency Free Funds

Locked Funds

Vendor Payable

Vendor Receivable

Unresolved Leftovers

Open Reconciliation Cases

Critical Alerts

Last Meta Sync

Recent Activity
```

---

# 122. V1 Should-Have

```text id="dsh157"
Spend Trend

Vendor Aging

Leftover Aging

Locked Fund Breakdown

Low Balance Accounts

Pending Approvals

Underfunded Jobs
```

---

# 123. Future Dashboard Enhancements

Potential:

```text id="dsh158"
Profitability

Cash Forecast

AI Anomaly Detection

Predictive Low-Balance Alerts

Client Performance Analytics

Vendor Funding Forecast

Cross-Platform Ads Overview
```

These should only be introduced after core financial truth is reliable.

---

# 124. Dashboard Integrity Rules

System must enforce:

```text id="dsh159"
1. Dashboard financial numbers must be ledger-backed.

2. Meta status/spend must show freshness.

3. Unknown data must not be shown as zero.

4. Different currencies must not be blindly aggregated.

5. Vendor payable and receivable must remain separate.

6. Locked funds must not be counted as available.

7. Client leftovers must not be counted as agency free funds.

8. Same Ad Account must not be double-counted.

9. Role and resource scope must affect dashboard visibility.

10. Every important summary should support drill-down.

11. Critical issues must remain visible until actually resolved.

12. Dashboard cards must not silently change business meaning based on filters.
```

---

# 125. Dashboard Golden Rule

> **The dashboard must show the current operational and financial truth of the business without hiding uncertainty, mixing ownership, double-counting money or presenting stale Meta data as current. Every important number should be understandable, traceable and actionable.**
