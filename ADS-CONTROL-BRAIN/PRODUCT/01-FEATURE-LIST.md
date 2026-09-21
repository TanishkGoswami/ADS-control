# Feature List

## Overview

Ye document Meta Ads Operations & Financial Control System ke complete product feature set ko define karta hai.

Product ka primary focus:

```text
TRACK
CONTROL
RECONCILE
MONITOR
AUDIT
```

System ko sirf Meta Ad Accounts show nahi karne.

System ko Meta assets ke saath:

```text
Clients
Vendors
Funds
Allocations
Spend
Leftovers
Locked Funds
Repayments
Receivables
Refunds
Reconciliation
Alerts
```

manage karne hain.

---

# 1. Authentication

## 1.1 User Login

System users secure login kar saken.

Features:

```text
Email Login

Password Login

Session Management

Logout

Session Expiry
```

Future:

```text
2FA

SSO
```

---

# 2. User Management

Admin system users create/manage kar sake.

Features:

```text
Create User

Edit User

Activate User

Deactivate User

Assign Role

View Last Login
```

---

# 3. Role Management

Initial roles:

```text
ADMIN

FINANCE

ADS_MANAGER

VIEWER
```

Role ke according access control hoga.

---

# 4. Permission Management

Granular permissions support honi chahiye.

Examples:

```text
VIEW_META_ACCOUNTS

VIEW_FINANCIAL_DATA

CREATE_CLIENT_PAYMENT

CREATE_VENDOR_FUNDING

CREATE_SETTLEMENT

APPROVE_SETTLEMENT

CREATE_REFUND

APPROVE_ADJUSTMENT

VIEW_AUDIT_LOG

MANAGE_USERS
```

---

# 5. Main Dashboard

System ka main overview screen.

Top-level metrics:

```text
Total Meta Connections

Total Business Portfolios

Total Ad Accounts

Active Accounts

Restricted Accounts

Disabled Accounts

Payment Issue Accounts
```

Financial cards:

```text
Total Tracked Funds

Client-Owned Funds

Agency Free Funds

Locked Funds

Refund Pending

Vendor Payable

Vendor Receivable
```

Operational cards:

```text
Spend Today

Spend Yesterday

Active Client Jobs

Unresolved Leftovers

Open Reconciliation Cases

Critical Alerts
```

---

# 6. Dashboard Drill-Down

Every dashboard card clickable ho.

Example:

```text
Restricted Accounts: 5
```

click:

```text
List of those 5 accounts
```

Similarly:

```text
Vendor Receivable ₹50,000
```

click:

```text
Vendor-wise breakdown
```

---

# 7. Meta Connection Management

Features:

```text
Add Meta Connection

Edit Internal Name

Connect Token

View Connection Status

Disable Connection

Reconnect Connection

Manual Sync

View Last Sync

View Sync Errors
```

---

# 8. Meta Connection Detail

Display:

```text
Connection Name

Internal ID

Meta Context

Status

Business Portfolios

Ad Accounts

Last Successful Sync

Last Failed Sync

Sync Health
```

---

# 9. Business Portfolio Management

Features:

```text
Auto Discover Portfolios

View Portfolio

Search Portfolio

Filter Portfolio

Portfolio Status

Ad Account Count

Financial Summary

Locked Fund Summary
```

---

# 10. Business Portfolio Detail

Show:

```text
Portfolio Name

Meta Business ID

Parent Meta Connection

Total Ad Accounts

Active Accounts

Restricted Accounts

Total Tracked Fund

Locked Fund

Spend Today
```

---

# 11. Ad Account Management

Features:

```text
Auto Discover Ad Accounts

Search Accounts

Filter Accounts

View Account Status

View Spend

View Tracked Balance

View Locked Balance

View Client Allocations

View Agency Allocation

View Account History

Archive Account
```

---

# 12. Ad Account Detail

Tabs:

```text
Overview

Financials

Clients

Campaigns

Spend

Fund History

Locked Funds

Status History

Reconciliation

Audit
```

---

# 13. Account Tree

Visual hierarchy:

```text
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
```

Features:

```text
Expand / Collapse

Search

Filter

Status Badges

Financial Summary

Locked Fund Indicators
```

---

# 14. Account Search

Search by:

```text
Account Name

Meta Ad Account ID

Internal Account ID

Business Portfolio

Meta Connection

Assigned Client
```

---

# 15. Account Filters

Filters:

```text
Active

Restricted

Disabled

Payment Issue

Low Balance

Has Locked Fund

Has Client Allocation

Has Reconciliation Issue

Currency

Portfolio

Connection
```

---

# 16. Client Management

Features:

```text
Create Client

Edit Client

View Client

Activate / Deactivate

Close Client

Search Client

Filter Client
```

---

# 17. Client Detail

Tabs:

```text
Overview

Payments

Wallet

Jobs

Allocations

Spend

Leftovers

Locked Funds

Refunds

Receivables

Ledger

Audit
```

---

# 18. Client Wallet

Show:

```text
Total Received

Available Balance

Allocated Balance

Unused Balance

Locked Balance

Refund Pending

Refunded

Outstanding / Receivable
```

---

# 19. Client Payment Management

Features:

```text
Add Client Payment

Partial Payment

Multiple Payments

Payment Reference

Payment Method

Payment Proof

Payment Status

Payment Reversal
```

---

# 20. Client Job Management

Features:

```text
Create Job

Define Budget

Assign Ad Account

Assign Meta Campaign

Set Start Date

Set End Date

Track Status

Track Spend

Track Remaining Fund
```

---

# 21. Client Job Status

Support:

```text
PLANNED

READY

ACTIVE

PAUSED

COMPLETED

CANCELLED
```

Financial status separately visible.

---

# 22. Client Job Detail

Show:

```text
Client

Budget

Funded Amount

Allocated Amount

Spend

Remaining

Assigned Ad Accounts

Mapped Campaigns

Operational Status

Financial Status
```

---

# 23. Client Allocation

Features:

```text
Allocate Client Wallet Fund

Allocate to Job

Allocate to Ad Account

Partial Allocation

Multiple Ad Account Allocation

Allocation History
```

---

# 24. Client Spend Attribution

System should support:

```text
Campaign-Level Spend Mapping

Account-Level Validation

Manual Attribution with Approval

Unattributed Spend Tracking
```

---

# 25. Client Leftover Management

Features:

```text
Detect Leftover

View Leftover

Return to Wallet

Allocate to Next Job

Refund

Transfer with Approval

Agency Conversion with Approval

Mark Locked

View Aging
```

---

# 26. Leftover Dashboard

Show:

```text
Total Leftover

Unresolved

In Wallet

Locked

Refund Pending

Transferred

Agency Converted
```

---

# 27. Client Locked Fund Management

Features:

```text
View Client Locked Amount

View Account Location

View Restriction Date

View Recovery Status

View Refund Status
```

---

# 28. Client Refund Management

Features:

```text
Create Refund Request

Partial Refund

Approve Refund

Process Refund

Add Reference

Upload Proof

Mark Failed

Retry

Reverse Incorrect Refund
```

---

# 29. Client Receivable Support

If company funds client on credit:

```text
Create Client Receivable

Track Outstanding

Receive Payment

Partial Settlement

Close Receivable
```

---

# 30. Vendor Management

Features:

```text
Create Vendor

Edit Vendor

View Vendor

Activate / Deactivate

Close Vendor

Search Vendor

Filter Vendor
```

---

# 31. Vendor Detail

Tabs:

```text
Overview

Funding Batches

Repayments

Payables

Receivables

Recoveries

Adjustments

Ledger

Attachments

Audit
```

---

# 32. Vendor Funding

Features:

```text
Add Vendor Funding

Create Funding Batch

Attach Reference

Upload Proof

Partial Receipt

Funding History

Reverse Incorrect Funding
```

---

# 33. Vendor Funding Batch Management

Show:

```text
Funding Batch ID

Original Amount

Repaid Amount

Outstanding

Status

Received Date

Age
```

---

# 34. Vendor Payable

System automatically calculate kare:

```text
Funding
-
Valid Repayment
-
Approved Adjustments
=
Current Payable
```

Features:

```text
View Payable

Batch Breakdown

Aging

Settlement History
```

---

# 35. Vendor Settlement

Features:

```text
Create Settlement

Choose Payment Source

Choose Vendor

Enter Amount

Add Payment Reference

Attach Proof

Submit for Approval

Post Settlement
```

---

# 36. Vendor Overpayment Detection

System automatically detect kare:

```text
Payment > Vendor Payable
```

Then split:

```text
Valid Repayment

Excess Payment
```

---

# 37. Vendor Receivable

Features:

```text
Create Automatically from Overpayment

View Open Receivable

Partial Recovery

Full Recovery

Offset Against New Funding

Write-Off with Approval
```

---

# 38. Vendor Receivable Aging

Display:

```text
0–7 Days

8–15 Days

16–30 Days

31+ Days
```

---

# 39. Vendor Settlement Approval

Support approval flow:

```text
DRAFT

PENDING_APPROVAL

APPROVED

PAYMENT_PENDING

POSTED
```

---

# 40. Vendor Batch Settlement

Features:

```text
FIFO Settlement

Manual Batch Allocation

Batch Override Reason

Partial Settlement
```

---

# 41. Agency Fund Management

Features:

```text
Add Agency Fund

View Agency Balance

Allocate Agency Fund

Use for Client Campaign

Temporary Client Funding

Vendor Settlement Funding

Agency Recovery
```

---

# 42. Agency Fund Detail

Show:

```text
Opening Balance

Fund Additions

Allocations

Recoveries

Current Free Balance

Locked Agency Fund
```

---

# 43. Financial Ledger

Core module.

Features:

```text
View Ledger Accounts

View Transactions

View Ledger Entries

Filter Transactions

Search Transaction

Transaction Detail

Transaction Reversal

Financial Drill-Down
```

---

# 44. Transaction Types

Support:

```text
CLIENT_PAYMENT

CLIENT_ALLOCATION

AD_ACCOUNT_TOPUP

AD_SPEND

LEFTOVER_RETURN

CLIENT_REFUND

CLIENT_TRANSFER

AGENCY_FUNDING

AGENCY_ALLOCATION

VENDOR_FUNDING

VENDOR_REPAYMENT

VENDOR_OVERPAYMENT

VENDOR_RECOVERY

META_REFUND

LOCK_FUNDS

UNLOCK_FUNDS

MANUAL_ADJUSTMENT

REVERSAL

WRITE_OFF
```

---

# 45. Transaction Detail

Show:

```text
Transaction ID

Type

Amount

Source

Destination

Owner Before

Owner After

Purpose

Status

Reference

Created By

Approved By

Attachments

Ledger Entries

Audit History
```

---

# 46. Transaction Reversal

Features:

```text
Select Posted Transaction

Enter Reversal Reason

Request Approval

Create Reversal

Link Original and Reversal
```

---

# 47. No Direct Posted Transaction Edit

UI should not allow direct amount changes after posting.

Correction flow:

```text
Reverse
+
Recreate Correct Transaction
```

---

# 48. Fund Transfer

Features:

```text
Source Selection

Destination Selection

Amount

Reason

Ownership Change Flag

Approval

Reference

Proof
```

---

# 49. Internal Transfers

Possible:

```text
Client Wallet → Job

Job → Ad Account

Ad Account → Client Wallet

Agency Pool → Job

Agency Pool → Ad Account

Client → Agency

Agency → Client

Other Approved Internal Transfer
```

---

# 50. Restricted Account Monitoring

Features:

```text
Detect Restriction

Create Restriction Event

Lock Affected Fund

Identify Affected Clients

Create Recovery Case

Track Recovery
```

---

# 51. Restricted Account Detail

Show:

```text
Restriction Date

Previous Status

Current Status

Locked Fund

Client Breakdown

Agency Breakdown

Affected Jobs

Recovery Owner

Recovery Status
```

---

# 52. Recovery Case Management

Features:

```text
Create Recovery Case

Assign Team Member

Add Notes

Mark Under Review

Mark Restored

Mark Refund Pending

Mark Partially Recovered

Mark Recovered

Request Write-Off
```

---

# 53. Locked Fund Management

System-wide view:

```text
Total Locked

Client Locked

Agency Locked

By Ad Account

By Portfolio

By Age
```

---

# 54. Unlock Fund

When account restored:

```text
Verify Status

Verify Balance

Reconcile

Unlock Valid Amount
```

---

# 55. Meta Refund Management

Features:

```text
Record Meta Refund

Match to Locked Fund

Allocate Original Ownership

Partial Refund Handling

Create Reconciliation Case
```

---

# 56. Reconciliation Engine

Core feature.

Compare:

```text
Meta Data

Internal Ledger

Business Allocations
```

---

# 57. Reconciliation Cases

Features:

```text
Create Case

Assign Owner

Add Notes

Investigate

Link Missing Transaction

Create Adjustment

Mark Timing Difference

Resolve

Close
```

---

# 58. Reconciliation Status

Support:

```text
OPEN

UNDER_REVIEW

WAITING_FOR_SYNC

RESOLVED

CLOSED
```

---

# 59. Ad Account Reconciliation

Compare:

```text
Tracked Balance

Meta Balance-Related Value

Client Allocations

Agency Allocation

Locked Fund
```

---

# 60. Client Reconciliation

Compare:

```text
Client Payments

Spend

Wallet

Locked Fund

Refunds

Transfers

Receivables
```

---

# 61. Vendor Reconciliation

Compare:

```text
Funding

Repayments

Payable

Receivable

Recoveries

Adjustments
```

---

# 62. Reconciliation Difference

Display:

```text
Expected

Observed

Difference

Tolerance

Severity
```

---

# 63. Alert Center

Central alerts screen.

Categories:

```text
Account

Financial

Client

Vendor

Sync

Reconciliation

Approval
```

---

# 64. Account Alerts

Examples:

```text
AD_ACCOUNT_RESTRICTED

AD_ACCOUNT_DISABLED

PAYMENT_ISSUE

LOW_BALANCE

STATUS_STALE
```

---

# 65. Financial Alerts

Examples:

```text
NEGATIVE_BALANCE_ATTEMPT

DUPLICATE_TRANSACTION

LARGE_ADJUSTMENT

UNATTRIBUTED_FUND

UNATTRIBUTED_SPEND
```

---

# 66. Client Alerts

Examples:

```text
CLIENT_UNDERFUNDED

CLIENT_UNUSED_BALANCE

CLIENT_LOCKED_FUND

CLIENT_REFUND_PENDING

CLIENT_FINANCIAL_CLOSURE_PENDING
```

---

# 67. Vendor Alerts

Examples:

```text
VENDOR_OVERPAYMENT

VENDOR_PAYABLE_DUE

VENDOR_RECEIVABLE_OPEN

VENDOR_RECEIVABLE_AGED

VENDOR_SETTLEMENT_PENDING
```

---

# 68. Sync Alerts

Examples:

```text
META_SYNC_FAILED

TOKEN_EXPIRED

PERMISSION_ERROR

DATA_STALE
```

---

# 69. Alert Severity

Support:

```text
INFO

WARNING

HIGH

CRITICAL
```

---

# 70. Alert Workflow

Features:

```text
Open

Acknowledge

Assign

Resolve

Dismiss Notification
```

Important:

Alert dismiss hone se underlying financial issue close nahi hoga.

---

# 71. Approval Center

Central screen for pending approvals.

Examples:

```text
Vendor Settlement

Vendor Overpayment

Cross-Client Transfer

Agency Conversion

Refund

Write-Off

Manual Adjustment

Reversal
```

---

# 72. Approval Detail

Show:

```text
Request Type

Entity

Amount

Reason

Created By

Current Balance

Impact After Approval

Supporting Proof
```

---

# 73. Maker-Checker

Optional:

```text
Creator cannot approve own sensitive request
```

for configured transaction types.

---

# 74. Activity / Audit Log

Features:

```text
Search

Filter by User

Filter by Entity

Filter by Action

Filter by Date

View Before/After

View Related Transaction
```

---

# 75. Audit Events

Examples:

```text
User Login

Client Created

Vendor Created

Payment Added

Allocation Created

Account Restricted

Settlement Created

Approval Granted

Transaction Reversed

Refund Completed
```

---

# 76. Attachments

Support:

```text
Payment Screenshot

UTR Proof

Bank Receipt

Invoice

Meta Screenshot

Agreement

Other Supporting File
```

---

# 77. Attachment Permissions

Sensitive documents should respect role permissions.

---

# 78. Meta Sync Engine

Features:

```text
Auto Sync

Manual Sync

Incremental Sync

Full Sync

Retry Failed Sync

View Sync History
```

---

# 79. Meta Sync Data

Sync:

```text
Business Portfolios

Ad Accounts

Account Status

Currency

Timezone

Spend

Campaigns

Balance-Related Fields

Funding Metadata Where Available
```

---

# 80. Sync Status

Support:

```text
PENDING

RUNNING

SUCCESS

PARTIAL

FAILED

STALE
```

---

# 81. Sync History

Show:

```text
Sync ID

Connection

Type

Started At

Completed At

Records Processed

Errors

Status
```

---

# 82. Meta Token Health

Features:

```text
Token Status

Expiry Warning

Permission Error

Reconnect Action
```

---

# 83. Spend Sync

System should sync:

```text
Daily Account Spend

Campaign Spend

Recent Spend Updates
```

Recent days may be re-synced to handle reporting revisions.

---

# 84. Spend History

Ad Account level:

```text
Date

Spend

Campaign Count

Client Attribution

Unattributed Spend
```

---

# 85. Spend Chart

Dashboard can show:

```text
Today

7 Days

30 Days
```

trend.

---

# 86. Global Search

Search across:

```text
Client

Vendor

Ad Account

Business Portfolio

Meta Connection

Transaction

Settlement

Funding Batch

Job
```

---

# 87. Global Filters

Common:

```text
Date Range

Status

Owner

Connection

Portfolio

Ad Account

Client

Vendor

Currency
```

---

# 88. Reporting Module

V1 reports:

```text
Meta Account Summary

Ad Account Financial Summary

Client Statement

Client Fund Report

Client Leftover Report

Locked Fund Report

Vendor Statement

Vendor Payable Report

Vendor Receivable Report

Fund Movement Report

Reconciliation Report

Transaction Report
```

---

# 89. Client Statement Report

Show chronological:

```text
Payment

Allocation

Spend

Leftover

Refund

Transfer
```

---

# 90. Vendor Statement Report

Show:

```text
Funding

Repayment

Outstanding

Overpayment

Recovery

Adjustment
```

---

# 91. Locked Fund Report

Show:

```text
Ad Account

Client

Agency

Amount

Locked Since

Age

Recovery Status
```

---

# 92. Reconciliation Report

Show:

```text
Entity

Expected

Observed

Difference

Age

Status
```

---

# 93. Fund Movement Report

Show:

```text
Source

Destination

Owner

Purpose

Amount

Date

Transaction Type
```

---

# 94. Export

V1 can support:

```text
CSV

Excel
```

Future:

```text
PDF
```

for reports.

---

# 95. Notifications

Initial in-app notifications.

Future:

```text
WhatsApp

Email

Slack
```

---

# 96. Notification Preferences

Per alert type:

```text
Enabled

Disabled

Severity Threshold

Channel
```

future configurable.

---

# 97. Account Status History

Every account should maintain:

```text
Previous Status

New Status

Changed At

Source
```

---

# 98. Fund History

Every Ad Account should show:

```text
Top-Ups

Allocations

Spend

Locks

Unlocks

Refunds

Adjustments
```

---

# 99. Client History

Client timeline:

```text
Created

Payment Received

Job Created

Allocation

Spend

Leftover

Refund

Closure
```

---

# 100. Vendor History

Vendor timeline:

```text
Created

Funding

Repayment

Overpayment

Recovery

Adjustment

Settlement
```

---

# 101. Dashboard Quick Actions

Possible:

```text
Add Client

Add Client Payment

Add Vendor Funding

Create Vendor Settlement

Create Refund

Add Manual Transaction

Trigger Meta Sync
```

Role-based visibility.

---

# 102. Low Balance Monitoring

User can define:

```text
Default Low Balance Threshold

Per-Ad-Account Threshold
```

Example:

```text
Balance < ₹2,000
```

creates alert.

---

# 103. Spend Monitoring

Potential alerts:

```text
No Spend

Spend Spike

Unexpected Post-Completion Spend

Spend Above Allocation
```

---

# 104. Account Health View

Each Ad Account can show:

```text
Status

Last Sync

Spend Today

Fund

Locked Amount

Client Count

Open Issues
```

---

# 105. Data Freshness Indicator

Every Meta-derived screen should indicate:

```text
Last Synced At
```

If stale:

```text
STALE DATA
```

badge.

---

# 106. Financial Data Confidence

Migrated/legacy records may have:

```text
VERIFIED

PARTIALLY_VERIFIED

UNVERIFIED
```

indicator.

---

# 107. Opening Balance Migration

Features:

```text
Add Opening Balance

Owner Breakdown

Location

As-of Date

Confidence Level

Notes
```

---

# 108. Legacy Data Import

Future/optional:

```text
CSV Import

Spreadsheet Import

Bulk Client Import

Bulk Vendor Import

Opening Balance Import
```

---

# 109. Bulk Actions

Future:

```text
Bulk Account Tag

Bulk Assign Manager

Bulk Sync

Bulk Alert Acknowledge
```

Financial bulk actions should be tightly controlled.

---

# 110. Notes

Entities can support notes:

```text
Client

Vendor

Ad Account

Reconciliation Case

Recovery Case
```

Notes do not replace structured data.

---

# 111. Tags

Optional operational tags:

```text
Primary

Backup

High Spend

New

Testing

Dedicated Client
```

---

# 112. Internal Account Purpose

Ad Account classification:

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

# 113. Assigned Team Member

Allow:

```text
Client Manager

Ad Account Manager

Recovery Owner

Reconciliation Owner
```

---

# 114. Financial Closing Checks

Before client/vendor/account financial closure:

System should check:

```text
Open Balance

Locked Fund

Pending Refund

Payable

Receivable

Reconciliation Issue

Pending Approval
```

---

# 115. Financial Closure Status

Support:

```text
OPEN

CLOSURE_PENDING

CLOSED
```

separate from operational status.

---

# 116. System Settings

Configuration:

```text
Low Balance Threshold

Approval Thresholds

Reconciliation Tolerance

Leftover Aging Threshold

Vendor Receivable Aging Threshold

Locked Fund Aging Threshold

Default Currency

Timezone
```

---

# 117. Meta Settings

Configuration:

```text
Sync Frequency

Connection Enable/Disable

Token Management

Spend Sync Window
```

---

# 118. Financial Settings

Configuration:

```text
Default Batch Settlement Policy

FIFO / Manual

Overpayment Policy

Allow with Approval / Block

Maker-Checker Rules

Refund Approval Threshold
```

---

# 119. Business Rules Configuration

Some rules should be configurable rather than hardcoded.

Examples:

```text
Can client leftover convert to agency?

Can cross-client transfer happen?

Who can approve it?

What amount needs admin approval?
```

---

# 120. V1 Must-Have Features

Highest-priority V1:

```text
Authentication

Meta Connection

Portfolio Sync

Ad Account Sync

Account Tree

Client Management

Client Payments

Client Jobs

Client Wallet

Vendor Management

Vendor Funding

Vendor Settlement

Vendor Receivable

Financial Ledger

Fund Allocation

Leftover Tracking

Restricted Fund Tracking

Reconciliation

Alerts

Audit Logs

Dashboard
```

---

# 121. V1 Should-Have Features

Important but can follow core:

```text
Reports

Approval Center

Attachments

Advanced Search

Aging Reports

Recovery Cases
```

---

# 122. V1 Could-Have Features

If time permits:

```text
CSV Export

Tags

Account Managers

Custom Thresholds

Bulk Operations
```

---

# 123. Out of Scope for Initial V1

Not primary:

```text
Meta Campaign Creation

Creative Upload

Ad Editing

Targeting Management

Full CRM

Payroll

GST Accounting

General ERP

Automated Bank Payments

Automatic Vendor Transfers
```

---

# 124. Future Features

Potential:

```text
Google Ads Integration

YouTube Ads Integration

Mobile App

WhatsApp Alerts

Bank Reconciliation

Payment Gateway Integration

Invoice Generation

Profitability Dashboard

AI Anomaly Detection

AI Financial Assistant

Fund Forecasting
```

---

# 125. Feature Design Principle

Every financial feature should answer:

```text
What changed?

How much?

From where?

To where?

Whose money?

Why?

Who did it?

Who approved it?

When?

Can it be reversed?
```

---

# 126. Feature Priority Principle

Priority order:

```text
Financial Correctness

Traceability

Security

Operational Clarity

Automation

Convenience
```

Financial correctness should never be sacrificed for faster UI workflows.

---

# 127. Product Golden Rule

> **Every feature in this product should either improve account visibility, fund traceability, financial control, reconciliation, monitoring or auditability. Features that do not support these core goals should not enter the initial product scope without a clear business reason.**
