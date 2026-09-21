# Reports

## Overview

Reports module system ke operational aur financial data ko structured, auditable aur decision-friendly format me present karega.

Reports ka purpose sirf tables export karna nahi hai.

Reports ko users ko ye answer karne me help karna chahiye:

```text id="rpt001"
Kitne Meta accounts active/restricted hain?

Kis Ad Account me kitna fund tracked hai?

Client ne kitna pay kiya aur kitna spend hua?

Kitna client balance unused ya locked hai?

Vendor se kitni funding aayi?

Vendor ko kitna repay hua?

Vendor ko kitna dena hai?

Vendor se kitna lena hai?

Agency free fund kitna hai?

Kaunse reconciliation mismatches unresolved hain?

Kis user ne kaunsa financial action kiya?
```

Core principle:

> **Every report number should be traceable back to the underlying transactions, allocations, Meta data or audit records from which it was calculated.**

---

# 1. Report Categories

Primary report categories:

```text id="rpt002"
META / ACCOUNT REPORTS

CLIENT REPORTS

VENDOR REPORTS

FINANCIAL REPORTS

FUND REPORTS

RECONCILIATION REPORTS

ALERT REPORTS

AUDIT REPORTS

MANAGEMENT REPORTS
```

---

# 2. Report Types

Reports can be:

```text id="rpt003"
CURRENT STATE

PERIOD BASED

TRANSACTIONAL

SNAPSHOT

AGING

EXCEPTION / ISSUE BASED
```

Each report must clearly state its type.

---

# 3. Current-State Reports

Examples:

```text id="rpt004"
Current Vendor Payable

Current Vendor Receivable

Current Client Wallet

Current Locked Funds

Current Account Status
```

These represent present position.

---

# 4. Period Reports

Examples:

```text id="rpt005"
Spend from 1 Sep to 30 Sep

Client Payments This Month

Vendor Funding This Month

Refunds This Month
```

Date range mandatory.

---

# 5. Snapshot Reports

Example:

```text id="rpt006"
Financial Position as of 31 Aug 2026
```

Useful for historical reconstruction.

---

# 6. Aging Reports

Examples:

```text id="rpt007"
Vendor Payable Aging

Vendor Receivable Aging

Client Leftover Aging

Locked Fund Aging

Refund Aging
```

---

# 7. Exception Reports

Show only problematic items.

Examples:

```text id="rpt008"
Restricted Accounts

Reconciliation Mismatches

Unattributed Spend

Unattributed Funds

Failed Transactions

Aged Refunds
```

---

# 8. Report Center

Main Reports screen should group:

```text id="rpt009"
Accounts

Clients

Vendors

Finance

Reconciliation

Audit
```

Each report card may show:

```text id="rpt010"
Report Name

Short Description

Last Generated / Current Data

Available Export Types
```

---

# 9. Common Report Filters

Most reports should support relevant filters:

```text id="rpt011"
Date Range

Meta Connection

Business Portfolio

Ad Account

Client

Vendor

Transaction Type

Status

Currency

Assigned Manager

Created By

Approved By
```

Not every report needs every filter.

---

# 10. Date Range Presets

Support:

```text id="rpt012"
Today

Yesterday

Last 7 Days

Last 30 Days

This Month

Last Month

This Quarter

Custom Range
```

---

# 11. As-of Date

Current-state historical reports may use:

```text id="rpt013"
As of:
31 Aug 2026 23:59
```

instead of date range.

---

# 12. Currency Filter

Multi-currency reports must:

```text id="rpt014"
Show currencies separately
```

unless configured reporting conversion exists.

Do not blindly aggregate INR + USD.

---

# 13. Meta Account Summary Report

Purpose:

Complete Meta asset overview.

Columns:

```text id="rpt015"
Meta Connection

Business Portfolio

Ad Account

Meta Ad Account ID

Status

Can Run Ads

Currency

Spend

Tracked Fund

Locked Fund

Last Sync
```

---

# 14. Account Status Report

Columns:

```text id="rpt016"
Ad Account

Portfolio

Connection

Current Status

Raw Meta Status

Can Run Ads

Last Status Change

Last Sync
```

Filters:

```text id="rpt017"
Active

Restricted

Disabled

Payment Issue

Unknown

Stale
```

---

# 15. Restricted Account Report

Purpose:

All current and/or historical restrictions.

Columns:

```text id="rpt018"
Ad Account

Portfolio

Connection

Restricted Since

Locked Amount

Affected Clients

Affected Jobs

Recovery Status

Assigned Recovery Owner

Age
```

---

# 16. Account Restriction History Report

Historical:

```text id="rpt019"
Ad Account

Restriction Start

Restored At

Duration

Locked Amount at Detection

Recovery Result
```

---

# 17. Low Balance Report

Columns:

```text id="rpt020"
Ad Account

Available Fund

Configured Threshold

Difference

Spend Today

Assigned Manager

Status
```

---

# 18. Account Spend Report

Columns:

```text id="rpt021"
Date

Connection

Portfolio

Ad Account

Spend

Mapped Client Spend

Unattributed Spend

Campaign Count
```

---

# 19. Account Financial Summary Report

Columns:

```text id="rpt022"
Ad Account

Client-Owned Fund

Agency-Owned Fund

Unattributed Fund

Locked Fund

Refund Pending

Total Tracked Position
```

Must avoid double counting.

---

# 20. Account Assignment Report

Shows:

```text id="rpt023"
Ad Account

Client

Job

Assignment Start

Assignment End

Current / Historical

Mapped Campaigns
```

---

# 21. Client Summary Report

Columns:

```text id="rpt024"
Client

Status

Total Payments

Available Wallet

Allocated Funds

Spend

Unused Funds

Locked Funds

Refund Pending

Receivable

Active Jobs
```

---

# 22. Client Payment Report

Columns:

```text id="rpt025"
Payment Date

Payment ID

Client

Amount

Currency

Purpose

Payment Method

Reference

Status

Created By
```

---

# 23. Client Wallet Report

Current-state report.

Columns:

```text id="rpt026"
Client

Available Wallet

Reserved

Allocated

Unused

Locked

Refund Reserved

Total Client-Owned
```

Definitions must avoid duplicate components.

---

# 24. Client Job Report

Columns:

```text id="rpt027"
Client

Job ID

Job Name

Budget

Funded

Allocated

Spend

Remaining

Operational Status

Financial Status

Ad Accounts
```

---

# 25. Client Spend Report

Columns:

```text id="rpt028"
Client

Job

Meta Campaign

Ad Account

Spend

Date

Attribution Status
```

---

# 26. Client Leftover Report

Purpose:

Track unresolved/available leftover amounts.

Columns:

```text id="rpt029"
Client

Job

Ad Account

Original Allocation

Spend

Leftover

Current Location

Status

Created Date

Age
```

---

# 27. Client Leftover Aging Report

Buckets:

```text id="rpt030"
0–7 Days

8–15 Days

16–30 Days

31+ Days
```

Columns:

```text id="rpt031"
Client

Job

Amount

Age

Status

Assigned Manager
```

---

# 28. Client Locked Fund Report

Columns:

```text id="rpt032"
Client

Ad Account

Job

Amount

Locked Since

Age

Restriction Status

Recovery Case

Expected Refund
```

---

# 29. Client Refund Report

Columns:

```text id="rpt033"
Refund ID

Client

Requested Amount

Approved Amount

Paid Amount

Pending Amount

Status

Requested Date

Paid Date

Reference

Processed By
```

---

# 30. Client Refund Aging Report

Buckets based on pending age.

Example:

```text id="rpt034"
0–3 Days

4–7 Days

8–15 Days

16+ Days
```

Configurable.

---

# 31. Client Receivable Report

Columns:

```text id="rpt035"
Client

Receivable ID

Original Amount

Paid

Outstanding

Reason

Created Date

Age

Status
```

---

# 32. Client Statement

Chronological client financial statement.

Columns:

```text id="rpt036"
Date

Transaction ID

Transaction Type

Reference

Debit / Outflow

Credit / Inflow

Running Position

Related Job

Related Ad Account
```

Business-readable labels should accompany accounting fields.

---

# 33. Client Financial Closure Report

Shows clients unable to financially close.

Columns:

```text id="rpt037"
Client

Available Wallet

Unused

Locked

Refund Pending

Receivable

Active Jobs

Open Reconciliation Cases

Closure Status
```

---

# 34. Vendor Summary Report

Columns:

```text id="rpt038"
Vendor

Status

Total Funding

Total Valid Repayment

Current Payable

Current Receivable

Pending Settlements

Open Funding Batches
```

---

# 35. Vendor Funding Report

Columns:

```text id="rpt039"
Vendor

Funding Transaction

Funding Batch

Received Date

Amount

Currency

Reference

Status

Outstanding Batch Amount
```

---

# 36. Vendor Funding Batch Report

Columns:

```text id="rpt040"
Vendor

Batch ID

Original Amount

Repaid

Outstanding

Opened Date

Age

Status
```

---

# 37. Vendor Payable Report

Current-state:

```text id="rpt041"
Vendor

Funding Batch

Original Funding

Valid Repayment

Outstanding Payable

Age

Last Settlement
```

---

# 38. Vendor Payable Aging Report

Buckets:

```text id="rpt042"
0–7 Days

8–15 Days

16–30 Days

31+ Days
```

Summary:

```text id="rpt043"
Bucket

Vendor Count

Outstanding Amount
```

Detailed drill-down available.

---

# 39. Vendor Settlement Report

Columns:

```text id="rpt044"
Settlement ID

Vendor

Payment Date

Payment Amount

Valid Repayment

Excess Payment

Source

Batch Allocation

Status

Created By

Approved By

Reference
```

---

# 40. Vendor Overpayment Report

Columns:

```text id="rpt045"
Vendor

Settlement ID

Payable Before

Payment Amount

Valid Repayment

Overpayment

Created Date

Status
```

---

# 41. Vendor Receivable Report

Columns:

```text id="rpt046"
Vendor

Receivable ID

Original Amount

Recovered

Outstanding

Origin Transaction

Reason

Created Date

Age

Status
```

---

# 42. Vendor Receivable Aging Report

Buckets:

```text id="rpt047"
0–7 Days

8–15 Days

16–30 Days

31+ Days
```

High-priority management report.

---

# 43. Vendor Recovery Report

Columns:

```text id="rpt048"
Vendor

Receivable ID

Recovery Date

Recovery Amount

Reference

Payment Method

Remaining Receivable
```

---

# 44. Vendor Statement

Chronological:

```text id="rpt049"
Date

Type

Funding

Repayment

Overpayment

Recovery

Adjustment

Running Payable

Running Receivable

Reference
```

Payable and receivable should remain separate.

---

# 45. Vendor Financial Closure Report

Columns:

```text id="rpt050"
Vendor

Current Payable

Current Receivable

Open Funding Batches

Pending Settlements

Open Reconciliation Cases

Closure Status
```

---

# 46. Agency Fund Report

Columns:

```text id="rpt051"
Date

Transaction

Opening / Addition

Allocation

Recovery

Vendor Settlement Use

Locked

Adjustment

Running Free Balance
```

---

# 47. Agency Fund Position Report

Current:

```text id="rpt052"
Agency Free Fund

Agency Allocated

Agency Locked

Agency Temporary Client Funding

Agency Recoverable
```

---

# 48. Fund Movement Report

Master transaction movement report.

Columns:

```text id="rpt053"
Date

Transaction ID

Type

Source

Destination

Owner Before

Owner After

Purpose

Amount

Currency

Status
```

---

# 49. Fund Ownership Report

Purpose:

Show who currently owns tracked money.

Columns:

```text id="rpt054"
Owner Type

Owner

Available

Allocated

Locked

Refund Pending

Total Owned
```

---

# 50. Fund Location Report

Purpose:

Show where money currently sits.

Possible locations:

```text id="rpt055"
Client Wallets

Agency Pool

Ad Accounts

Locked Funds

Refund Pending

Other Pools
```

Columns:

```text id="rpt056"
Location Type

Location

Client-Owned

Agency-Owned

Unattributed

Total
```

---

# 51. Fund Source Report

Shows where current or historical funds originated.

Columns:

```text id="rpt057"
Source Type

Source Entity

Original Amount

Consumed

Remaining

Current Locations
```

---

# 52. Fund Lineage Report

Advanced drill-down.

Example:

```text id="rpt058"
PAY-001 Client A ₹10,000
↓
Wallet
↓
JOB-001 ₹8,000
↓
AD1
↓
Spend ₹6,500
↓
Leftover ₹1,500
```

Useful for investigation.

---

# 53. Locked Fund Report

System-wide.

Columns:

```text id="rpt059"
Owner

Client / Agency

Ad Account

Portfolio

Connection

Amount

Locked Since

Age

Reason

Recovery Status
```

---

# 54. Locked Fund Aging Report

Buckets:

```text id="rpt060"
0–3 Days

4–7 Days

8–15 Days

16–30 Days

31+ Days
```

Configurable.

---

# 55. Refund Pending Report

Columns:

```text id="rpt061"
Client

Refund ID

Amount

Reserved

Paid

Remaining

Status

Age

Reason
```

---

# 56. Transaction Report

Full financial transaction report.

Columns:

```text id="rpt062"
Date

Transaction ID

Type

Entity

Source

Destination

Amount

Currency

Status

Reference

Created By

Approved By

Posted At
```

---

# 57. Reversal Report

Columns:

```text id="rpt063"
Original Transaction

Original Amount

Reversal Transaction

Reversal Date

Reason

Created By

Approved By
```

---

# 58. Manual Adjustment Report

Columns:

```text id="rpt064"
Adjustment ID

Entity

Amount

Reason

Created Date

Created By

Approved By

Status

Related Reconciliation Case
```

---

# 59. Write-Off Report

Columns:

```text id="rpt065"
Entity Type

Entity

Amount

Reason

Original Exposure

Approved By

Write-Off Date

Reference
```

---

# 60. Reconciliation Summary Report

Columns:

```text id="rpt066"
Case ID

Entity Type

Entity

Expected

Observed

Difference

Currency

Age

Status

Assigned User
```

---

# 61. Ad Account Reconciliation Report

Compare:

```text id="rpt067"
Internal Tracked Position

Meta / Derived Position

Difference

Unattributed Fund

Unattributed Spend

Last Sync
```

---

# 62. Client Reconciliation Report

Columns:

```text id="rpt068"
Client

Payments / Credits

Spend

Current Owned Funds

Refunds

Transfers

Expected Position

Difference

Status
```

---

# 63. Vendor Reconciliation Report

Columns:

```text id="rpt069"
Vendor

Funding

Valid Repayment

Expected Payable

Actual Payable

Expected Receivable

Actual Receivable

Difference

Status
```

---

# 64. Spend Attribution Report

Columns:

```text id="rpt070"
Ad Account

Meta Campaign

Spend

Mapped Client

Mapped Job

Attributed Amount

Unattributed Amount

Status
```

---

# 65. Unattributed Spend Report

Columns:

```text id="rpt071"
Date

Ad Account

Campaign

Total Spend

Unattributed Spend

Age

Assigned Reviewer

Case Status
```

---

# 66. Unattributed Fund Report

Columns:

```text id="rpt072"
Location

Amount

Currency

Detected Date

Known Source

Known Owner

Status

Reconciliation Case
```

---

# 67. Alert Report

Columns:

```text id="rpt073"
Alert ID

Type

Category

Severity

Entity

Amount Exposure

Created At

Age

Assigned To

Status

Resolved At
```

---

# 68. Alert Trend Report

Period metrics:

```text id="rpt074"
Restrictions Detected

Vendor Overpayments

Reconciliation Mismatches

Low Balance Alerts

Sync Failures

Average Resolution Time
```

This is process quality reporting.

---

# 69. Approval Report

Columns:

```text id="rpt075"
Approval ID

Request Type

Entity

Amount

Requested By

Requested At

Approved / Rejected By

Decision Date

Status
```

---

# 70. Pending Approval Report

Current-state:

```text id="rpt076"
Request

Entity

Amount

Age

Creator

Required Approver

Status
```

---

# 71. Audit Activity Report

Columns:

```text id="rpt077"
Timestamp

User

Role

Action

Entity Type

Entity ID

Before State

After State

Result
```

Sensitive before/after data permission-controlled.

---

# 72. User Financial Activity Report

Shows financial actions by user.

Columns:

```text id="rpt078"
User

Payments Created

Settlements Created

Refunds Created

Approvals

Reversals

Adjustments
```

Detailed drill-down available.

---

# 73. Meta Sync Report

Columns:

```text id="rpt079"
Sync ID

Connection

Sync Type

Started

Completed

Status

Records Processed

Failures

Duration
```

---

# 74. Meta Data Freshness Report

Columns:

```text id="rpt080"
Connection

Portfolio

Ad Account

Status Last Synced

Spend Last Synced

Campaign Last Synced

Freshness Status
```

---

# 75. Management Summary Report

High-level management view.

Possible sections:

```text id="rpt081"
Meta Asset Health

Client Funds

Agency Funds

Locked Funds

Vendor Payables

Vendor Receivables

Refund Pending

Reconciliation Exposure

Critical Alerts
```

---

# 76. Daily Operations Report

Useful for daily team review.

Sections:

```text id="rpt082"
Accounts Restricted Today

Accounts Restored Today

Low Balance Accounts

No-Spend Accounts

Client Jobs Underfunded

Refunds Pending

Vendor Settlements Pending

New Reconciliation Issues
```

---

# 77. Daily Financial Movement Report

Period: one day.

Show:

```text id="rpt083"
Client Payments Received

Vendor Funding Received

Agency Funds Added

Ad Spend Recognized

Vendor Repayments

Client Refunds

Recoveries

Adjustments
```

---

# 78. Monthly Financial Control Report

Sections:

```text id="rpt084"
Opening Positions

Funds Received

Funds Allocated

Spend

Refunds

Vendor Funding

Vendor Repayments

Closing Payables

Closing Receivables

Closing Locked Funds

Reconciliation Exceptions
```

Not necessarily a profit-and-loss report.

---

# 79. Do Not Present P&L Without P&L Model

Client payment:

```text id="rpt085"
≠ Revenue automatically
```

Vendor funding:

```text id="rpt086"
≠ Revenue
```

Vendor repayment:

```text id="rpt087"
≠ Ad Expense
```

Reports must use accurate labels.

---

# 80. Report Drill-Down

Every aggregate should support investigation.

Example:

```text id="rpt088"
Vendor Payable:
₹8,50,000
```

click:

```text id="rpt089"
Vendor-wise breakdown
```

then:

```text id="rpt090"
Funding batch
```

then:

```text id="rpt091"
Funding and settlement transactions
```

---

# 81. Report Totals

Totals must be generated from the same filtered dataset.

Do not calculate header summary from one source and table from another inconsistent query.

---

# 82. Report Subtotals

Useful:

```text id="rpt092"
By Client

By Vendor

By Portfolio

By Currency

By Status
```

depending on report.

---

# 83. Report Sorting

Allow:

```text id="rpt093"
Date

Amount

Age

Status

Name

Severity
```

---

# 84. Report Pagination

Large datasets must use server-side pagination.

Do not load millions of transaction rows in browser.

---

# 85. Report Export

V1 export formats:

```text id="rpt094"
CSV

XLSX
```

Future:

```text id="rpt095"
PDF
```

---

# 86. Export Must Respect Filters

If user selects:

```text id="rpt096"
Vendor = RAM
Date = September
Status = Posted
```

export should contain exactly filtered data.

---

# 87. Export Must Respect Permissions

A user should never export financial data they cannot view in UI.

Backend must enforce permission and scope.

---

# 88. Export Metadata

Generated report should ideally include:

```text id="rpt097"
Report Name

Generated At

Generated By

Filters Applied

Currency Context

Data As-of Time
```

---

# 89. Export Audit

Sensitive report exports may create audit event:

```text id="rpt098"
REPORT_EXPORTED
```

with user/report/filter metadata.

---

# 90. Report Data Freshness

Reports using Meta data should indicate:

```text id="rpt099"
Data Last Synced At
```

Financial ledger-based report can show:

```text id="rpt100"
Ledger Current As Of
```

---

# 91. Stale Meta Data

If source stale:

Report should not pretend data is current.

Example:

```text id="rpt101"
Spend data last synced 45 minutes ago.
```

---

# 92. Unknown vs Zero

Critical reporting rule:

```text id="rpt102"
0
=
Known zero
```

```text id="rpt103"
—
=
Unknown / unavailable
```

Never substitute one for the other.

---

# 93. Currency Reporting

If report contains multiple currencies:

Option 1:

```text id="rpt104"
Separate rows/totals by currency
```

Option 2 future:

```text id="rpt105"
Convert using explicit reporting FX rate
```

---

# 94. Report Snapshot Storage

High-value period-end reports may optionally store snapshot metadata.

Example:

```text id="rpt106"
Month-End Financial Position
```

This helps reproduce management reports later.

---

# 95. Dynamic vs Snapshot Report

Dynamic report:

```text id="rpt107"
Recalculates from latest underlying data
```

Snapshot report:

```text id="rpt108"
Preserves position at a defined point in time
```

UI should distinguish them.

---

# 96. Historical Restatement

If backdated financial transaction affects past report:

system may:

```text id="rpt109"
Restate Dynamic Report
```

while stored finalized snapshot may show:

```text id="rpt110"
Original Snapshot

Restated Version
```

future advanced feature.

---

# 97. Report Permissions

Possible:

```text id="rpt111"
VIEW_OPERATIONAL_REPORTS

VIEW_CLIENT_REPORTS

VIEW_VENDOR_REPORTS

VIEW_FINANCIAL_REPORTS

VIEW_RECONCILIATION_REPORTS

VIEW_AUDIT_REPORTS

EXPORT_REPORTS

EXPORT_FINANCIAL_REPORTS
```

---

# 98. Admin Report Access

Admin:

```text id="rpt112"
Full report access
```

subject to company configuration.

---

# 99. Finance Report Access

Finance:

```text id="rpt113"
Client Financial

Vendor Financial

Ledger

Fund Movement

Reconciliation

Refunds

Receivables
```

---

# 100. Ads Manager Report Access

Ads Manager:

```text id="rpt114"
Account Status

Spend

Client Job

Restricted Account

Low Balance

Operational Allocation
```

Sensitive vendor/ledger reports hidden by default.

---

# 101. Viewer Access

Read-only reports according to assigned permissions/resource scope.

---

# 102. Resource Scope in Reports

If user scope:

```text id="rpt115"
BP1 only
```

account report must not include BP2.

Backend query must enforce this.

---

# 103. Report Scheduling

Future feature:

```text id="rpt116"
Daily Report

Weekly Report

Monthly Report
```

delivered through email/other channels.

Not required for V1.

---

# 104. Saved Reports

Future:

```text id="rpt117"
Save Filter Combination

Save Custom View

Favorite Report
```

---

# 105. Custom Report Builder

Future, not V1:

```text id="rpt118"
Select Dimensions

Select Metrics

Select Filters

Save Report
```

Core predefined reports should come first.

---

# 106. Report Performance

Use:

```text id="rpt119"
Database Indexes

Aggregated Views

Materialized Views where useful

Pagination

Background Export for very large files
```

without compromising correctness.

---

# 107. Report Query Consistency

Complex report should run against a consistent data snapshot/transaction boundary where practical.

Avoid totals changing mid-generation.

---

# 108. Report Error State

If Meta data unavailable:

report should show:

```text id="rpt120"
Partial Data
```

and identify affected data source.

Do not silently drop rows.

---

# 109. Partial Report

Example:

```text id="rpt121"
Internal financial data complete

Meta spend for 3 accounts unavailable
```

Report should state limitation.

---

# 110. Reconciliation Report Integrity

Reconciliation report should preserve:

```text id="rpt122"
Expected

Observed

Difference
```

not only net total.

---

# 111. Payable/Receivable Integrity

Vendor summary must not hide:

```text id="rpt123"
Payable ₹50,000

Receivable ₹10,000
```

by only showing net ₹40,000.

Net can be secondary.

---

# 112. Client Fund Integrity

Client report must not count same ₹5,000 in:

```text id="rpt124"
Wallet

and

Ad Account Allocation
```

simultaneously if fund moved.

---

# 113. Locked Fund Integrity

Locked amount must not also be included in available balance.

---

# 114. Pending vs Posted Report Values

Reports must differentiate:

```text id="rpt125"
Pending

Approved

Posted
```

Example vendor settlement report should not treat pending payment as valid repayment.

---

# 115. Report Status Definitions

Each report should have data dictionary/tooltips for complex fields.

Example:

```text id="rpt126"
Current Payable:
Posted vendor funding liability minus posted valid repayments and approved posted adjustments.
```

---

# 116. Report Auditability

Every financial report row should ideally have:

```text id="rpt127"
View Source
```

drill-down to transaction/entity.

---

# 117. Report Naming Rules

Avoid ambiguous names like:

```text id="rpt128"
Balance Report
```

Prefer:

```text id="rpt129"
Client Wallet Report

Vendor Payable Report

Ad Account Tracked Fund Report
```

---

# 118. Management Report Principle

Management report should summarize without losing distinction between:

```text id="rpt130"
Assets

Liabilities

Client-Owned Funds

Company-Owned Funds

Unresolved Differences
```

---

# 119. V1 Must-Have Reports

```text id="rpt131"
Meta Account Summary

Account Status Report

Restricted Account Report

Account Spend Report

Client Summary

Client Payment Report

Client Job Report

Client Leftover Report

Client Locked Fund Report

Client Refund Report

Client Statement

Vendor Summary

Vendor Funding Report

Vendor Payable Report

Vendor Settlement Report

Vendor Receivable Report

Vendor Statement

Agency Fund Report

Fund Movement Report

Locked Fund Report

Transaction Report

Reconciliation Report
```

---

# 120. V1 Should-Have Reports

```text id="rpt132"
Payable Aging

Receivable Aging

Leftover Aging

Refund Aging

Low Balance Report

Unattributed Spend Report

Unattributed Fund Report

Approval Report

Audit Activity Report
```

---

# 121. Future Reports

Potential:

```text id="rpt133"
Profitability Report

Cash Flow Forecast

Client Profitability

Vendor Funding Forecast

Ad Account Utilization

AI Anomaly Report

Cross-Platform Spend Report

Budget Forecast Report
```

These require additional reliable business logic.

---

# 122. Report Integrity Rules

System must enforce:

```text id="rpt134"
1. Every financial report number must be derived from valid source data.

2. Report totals must match filtered report rows.

3. Unknown values must not be shown as zero.

4. Locked funds must not be counted as available.

5. Vendor payable and receivable must remain separate.

6. Client funds and agency funds must remain separate.

7. Pending transactions must remain distinct from posted transactions.

8. Different currencies cannot be blindly aggregated.

9. User permissions and resource scope must apply to reports and exports.

10. Meta-derived reports must show freshness.

11. Reports must support drill-down to underlying entities/transactions where practical.

12. Historical reports must preserve defined date/as-of context.

13. Reports must not silently convert financial flows into revenue/profit terminology.

14. Same fund must never be double-counted across locations.
```

---

# 123. Reports Golden Rule

> **A report is only useful if its numbers can be trusted. Every operational or financial figure shown by the system must have a clear definition, an identifiable data source, a known time context and a traceable path back to the records that produced it.**
