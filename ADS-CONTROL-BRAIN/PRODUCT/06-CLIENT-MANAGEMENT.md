# Client Management

## Overview

Client Management module system ke client-side operational aur financial lifecycle ko manage karega.

Client ko sirf contact record ke form me treat nahi karna.

System ko client ke saath ye sab track karna hai:

```text
Client Profile
↓
Payments
↓
Wallet
↓
Jobs
↓
Fund Allocations
↓
Ad Account Assignments
↓
Meta Campaign Mapping
↓
Spend
↓
Leftover
↓
Locked Funds
↓
Refunds
↓
Receivables
↓
Financial Settlement
```

Core principle:

> **Client ke har payment, allocation, spend aur remaining amount ka complete trace system me available hona chahiye.**

---

# 1. Client Module Scope

Client module cover karega:

```text
Client Creation

Client Profile

Client Status

Client Payments

Client Wallet

Client Jobs

Ad Account Assignments

Meta Campaign Mapping

Fund Allocations

Spend Attribution

Leftover Funds

Locked Funds

Refunds

Client Receivables

Financial Closure

Client Statement

Audit History
```

---

# 2. Client Entity

Every client ka canonical internal record hoga.

Example:

```text
Client ID:
CLI-0001

Name:
Client A

Status:
ACTIVE
```

Client name unique assume nahi karna.

Primary internal identity:

```text
client_id
```

---

# 3. Client Basic Fields

Recommended:

```text
Internal Client ID

Client Name

Company Name

Phone

Email

Status

Assigned Manager

Created At

Created By

Notes
```

Optional future:

```text
GST Details

Billing Address

External CRM ID

Tags
```

---

# 4. Client Status

Operational client statuses:

```text
ACTIVE

INACTIVE

ON_HOLD

BLOCKED

CLOSED
```

Operational status financial status se separate hoga.

---

# 5. Client Financial Status

Possible:

```text
OPEN

UNFUNDED

PARTIALLY_FUNDED

FUNDED

HAS_UNUSED_BALANCE

HAS_LOCKED_FUNDS

REFUND_PENDING

HAS_RECEIVABLE

CLOSURE_PENDING

SETTLED
```

Exact implementation derived states ke through ho sakta hai.

---

# 6. Client List

Recommended columns:

```text
Client Name

Status

Assigned Manager

Wallet Available

Allocated Funds

Locked Funds

Refund Pending

Outstanding / Receivable

Active Jobs

Last Activity
```

---

# 7. Client List Search

Search by:

```text
Client Name

Company Name

Phone

Email

Internal Client ID
```

---

# 8. Client Filters

Recommended:

```text
Status

Assigned Manager

Has Active Jobs

Has Wallet Balance

Has Leftover

Has Locked Funds

Refund Pending

Has Receivable

Financial Closure Pending
```

---

# 9. Create Client

Authorized user can create client.

Minimum required:

```text
Client Name
```

Recommended required:

```text
Client Name

Phone or Email

Assigned Manager

Status
```

depending on business workflow.

---

# 10. Duplicate Client Warning

Potential duplicate detection:

```text
Same Phone

Same Email

Same Company Name
```

System should warn.

Do not automatically merge.

---

# 11. Client Detail Screen

Recommended tabs:

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

Timeline

Audit
```

---

# 12. Client Overview

Top section:

```text
Client Name

Internal ID

Status

Assigned Manager

Created Date

Financial Status
```

Financial cards:

```text
Total Received

Available Wallet

Allocated

Spend

Unused Funds

Locked Funds

Refund Pending

Client Receivable
```

---

# 13. Client Wallet

Client Wallet is logical financial account.

It represents:

> Client-owned amount currently available for future valid allocation.

Wallet is not necessarily physical bank account.

---

# 14. Client Wallet Components

Recommended breakdown:

```text
Available

Reserved / Pending Allocation

Allocated

Locked

Refund Reserved

Total Client-Owned
```

Avoid one ambiguous balance.

---

# 15. Client Wallet Formula

Conceptually:

```text
Available Wallet
=
Confirmed Client Funds
+
Returned Leftovers
+
Valid Credits
-
Active Allocations
-
Refund Reservations
-
Other Valid Outflows
```

Actual balance ledger-derived hoga.

---

# 16. Wallet Cannot Be Manually Overwritten

Do not allow:

```text
Set Client Wallet = ₹50,000
```

Instead all changes transactions ke through.

---

# 17. Client Payment Screen

Features:

```text
Add Payment

View Payments

Filter Payments

Open Payment Detail

Reverse Incorrect Payment
```

---

# 18. Add Client Payment

Fields:

```text
Client

Amount

Currency

Payment Date

Payment Method

Reference / UTR

Purpose

Proof

Notes
```

---

# 19. Client Payment Purpose

Possible classifications:

```text
ADS_FUND

SERVICE_FEE

RECEIVABLE_SETTLEMENT

ADVANCE

OTHER_APPROVED_PURPOSE
```

This prevents all received money from becoming ad wallet by default.

---

# 20. Client Payment Status

```text
DRAFT

PENDING

CONFIRMED

POSTED

FAILED

CANCELLED

REVERSED
```

Only valid posted/confirmed payment affects financial balances.

---

# 21. Client Payment Detail

Show:

```text
Payment ID

Amount

Purpose

Method

Reference

Status

Wallet Effect

Linked Job if any

Created By

Posted By

Attachments

Ledger Entries

Audit History
```

---

# 22. Partial Payments

Client can pay:

```text
₹5,000
+
₹5,000
+
₹10,000
```

Each receipt separate transaction.

Do not replace previous payment total.

---

# 23. Client Payment Allocation

Payment may remain:

```text
Available in Wallet
```

or be directly allocated to:

```text
Specific Job
```

but transaction chain must remain visible.

---

# 24. Client Job

Client Job represents internal business work/order.

Example:

```text
JOB-0001

Client:
Client A

Objective:
Lead Generation

Budget:
₹20,000
```

---

# 25. Client Job vs Meta Campaign

Important:

```text
Client Job
≠
Meta Campaign
```

One job may map to:

```text
One Meta Campaign
```

or:

```text
Multiple Meta Campaigns
```

---

# 26. Job Fields

Recommended:

```text
Job ID

Client ID

Job Name

Objective

Planned Budget

Start Date

End Date

Operational Status

Financial Status

Assigned Manager

Created By
```

---

# 27. Job Operational Status

```text
PLANNED

READY

ACTIVE

PAUSED

COMPLETED

CANCELLED
```

---

# 28. Job Financial Status

Possible:

```text
UNFUNDED

PARTIALLY_FUNDED

FUNDED

ACTIVE_ALLOCATION

PARTIALLY_SPENT

FULLY_SPENT

UNUSED_BALANCE

LOCKED_FUNDS

REFUND_PENDING

SETTLED
```

---

# 29. Client Job List

Columns:

```text
Job ID

Job Name

Budget

Funded

Allocated

Spend

Remaining

Ad Account

Operational Status

Financial Status
```

---

# 30. Create Client Job

Workflow:

```text
Select Client
↓
Enter Job Details
↓
Define Planned Budget
↓
Choose Dates
↓
Assign Manager
↓
Save
```

Funding can happen separately.

---

# 31. Job Budget Is Not Wallet Balance

Example:

```text
Job Budget:
₹20,000

Client Wallet:
₹10,000
```

System should show:

```text
Funding Gap:
₹10,000
```

---

# 32. Fund Job

Authorized user allocates client wallet funds.

Example:

```text
Client Wallet:
₹20,000
```

Allocate:

```text
JOB-001:
₹15,000
```

Result:

```text
Wallet Available:
₹5,000

Job Funded:
₹15,000
```

---

# 33. Partial Job Funding

Allowed:

```text
Budget:
₹20,000

Funded:
₹10,000
```

Financial status:

```text
PARTIALLY_FUNDED
```

---

# 34. Prevent Negative Wallet

If:

```text
Wallet:
₹5,000
```

allocation request:

```text
₹10,000
```

system must reject unless alternate funding source explicitly added.

---

# 35. Agency Funding for Client

If agency funds a client job:

```text
Agency Fund
↓
Client Job
```

this should not increase client wallet.

Instead system may create:

```text
Agency-Funded Client Allocation
```

and potentially:

```text
Client Receivable
```

depending on agreement.

---

# 36. Client Receivable from Agency Funding

Example:

```text
Agency funds:
₹5,000
```

for Client A.

If client owes this amount:

```text
Client Receivable:
₹5,000
```

Separate from wallet.

---

# 37. Ad Account Assignment

Job can be assigned to:

```text
Meta Connection
↓
Business Portfolio
↓
Ad Account
```

System stores actual Ad Account ID.

---

# 38. Assignment Record

Fields:

```text
Job ID

Ad Account ID

Assigned At

Unassigned At

Status

Assigned By

Reason
```

---

# 39. Multiple Ad Accounts

One job can use multiple accounts if required.

Example:

```text
JOB-001

AD1:
₹12,000 allocation

AD2:
₹8,000 allocation
```

---

# 40. Ad Account Change

If job moves:

```text
AD1
↓
AD2
```

do not overwrite old assignment.

Close old mapping and create new.

---

# 41. Meta Campaign Mapping

Each internal job should ideally map to Meta campaign(s).

Record:

```text
Job ID

Meta Campaign ID

Meta Campaign Name

Ad Account ID

Mapping Status

Mapped At
```

---

# 42. Campaign Mapping Purpose

Mapping enables:

```text
Spend Attribution

Client Reporting

Job Spend Tracking

Overspend Detection

Post-Completion Spend Detection
```

---

# 43. Unmapped Campaign Spend

If Meta campaign spend exists but no job mapping:

```text
UNATTRIBUTED_SPEND
```

System should flag.

---

# 44. Client Allocation Screen

Show:

```text
Source

Client Wallet / Agency / Other

Job

Ad Account

Amount

Status

Date
```

---

# 45. Allocation State

Possible:

```text
DRAFT

PENDING_APPROVAL

ACTIVE

PARTIALLY_CONSUMED

FULLY_CONSUMED

RETURNED

LOCKED

REVERSED
```

---

# 46. Allocation Is Not Spend

UI should clearly separate:

```text
Allocated:
₹10,000
```

from:

```text
Spent:
₹7,000
```

and:

```text
Remaining:
₹3,000
```

---

# 47. Spend Tab

Show:

```text
Date

Meta Campaign

Ad Account

Spend

Job

Attribution Status
```

---

# 48. Spend Summary

Client-level:

```text
Today

Yesterday

7 Days

30 Days

Lifetime / Selected Period
```

---

# 49. Job Spend

Formula:

```text
Job Spend
=
Sum of mapped campaign spend
```

subject to reconciliation rules.

---

# 50. Spend Attribution Status

Possible:

```text
ATTRIBUTED

PARTIALLY_ATTRIBUTED

UNATTRIBUTED

UNDER_REVIEW
```

---

# 51. Overspend Detection

Example:

```text
Allocated:
₹10,000

Spend:
₹10,500
```

Show:

```text
Overspend:
₹500
```

Create:

```text
FUNDING_GAP
```

---

# 52. Overspend Resolution

Possible:

```text
Additional Client Payment

Additional Client Wallet Allocation

Agency Funding

Approved Adjustment
```

Do not silently use another client's funds.

---

# 53. Job Completion

Operational completion action:

```text
Mark Job Completed
```

should trigger:

```text
Final/Recent Spend Sync Check

Remaining Fund Calculation

Leftover Detection

Open Financial Issue Check
```

---

# 54. Operational Completion vs Financial Settlement

Example:

```text
Operational:
COMPLETED

Financial:
UNUSED_BALANCE
```

This is valid.

---

# 55. Leftover Detection

Formula:

```text
Funded/Allocated
-
Valid Spend
-
Valid Charges
=
Unused Amount
```

If > 0:

create leftover state.

---

# 56. Leftovers Tab

Columns:

```text
Job

Ad Account

Original Allocation

Spend

Unused Amount

Location

Status

Age
```

---

# 57. Leftover Actions

Allowed actions:

```text
Return to Client Wallet

Allocate to Same Client's New Job

Initiate Refund

Request Cross-Client Transfer

Request Client-to-Agency Transfer

Mark Locked

Resolve via Approved Adjustment
```

---

# 58. Same Client Reallocation

Example:

```text
JOB-001 Leftover:
₹3,000
```

to:

```text
JOB-002
```

Owner remains Client A.

---

# 59. Cross-Client Transfer

High-risk action.

Must require:

```text
Source Client

Destination Client

Amount

Reason

Approval
```

and preserve lineage.

---

# 60. Client-to-Agency Conversion

Requires explicit ownership transfer.

Do not offer as one-click normal action without approval.

---

# 61. Locked Funds Tab

Show:

```text
Amount

Ad Account

Job

Locked Since

Restriction Status

Recovery Case

Expected Refund

Age
```

---

# 62. Client Locked Fund Summary

Example:

```text
Client A

Total Owned:
₹25,000

Available:
₹10,000

Allocated:
₹10,000

Locked:
₹5,000
```

---

# 63. Locked Funds Are Not Available

Client wallet screen must not combine locked money into usable wallet balance.

---

# 64. Client Refund

Refund can originate from:

```text
Wallet

Unused Job Balance

Recovered Locked Fund

Other Valid Client-Owned Balance
```

---

# 65. Refund Request

Fields:

```text
Client

Amount

Source Balance

Reason

Payment Method

Reference

Notes

Approval Requirement
```

---

# 66. Refund Status

```text
DRAFT

PENDING_APPROVAL

APPROVED

PAYMENT_PENDING

PARTIALLY_REFUNDED

REFUNDED

FAILED

CANCELLED

REVERSED
```

---

# 67. Refund Reservation

Once approved/requested according to policy:

amount may be reserved so it cannot simultaneously be allocated to another job.

---

# 68. Partial Refund

Example:

```text
Refund Requested:
₹5,000

Completed:
₹3,000

Remaining:
₹2,000
```

Status:

```text
PARTIALLY_REFUNDED
```

---

# 69. Failed Refund

If transfer fails:

```text
FAILED
```

Financial amount should remain correctly classified and not disappear.

---

# 70. Refund Proof

Support:

```text
UTR

Screenshot

Bank Reference

Processed Date

Processed By
```

---

# 71. Client Receivable

Used when:

> Client owes money to company.

Examples:

```text
Agency-funded client spend

Client underpayment

Payment reversal after spend

Approved credit service
```

---

# 72. Client Receivable Tab

Show:

```text
Receivable ID

Original Amount

Recovered

Outstanding

Reason

Created Date

Age

Status
```

---

# 73. Client Receivable Status

```text
OPEN

PARTIALLY_PAID

PAID

ADJUSTED

WRITTEN_OFF
```

---

# 74. Client Payment Against Receivable

Example:

```text
Receivable:
₹5,000

Client Pays:
₹7,000
```

Apply:

```text
₹5,000 → Receivable settlement

₹2,000 → Client Wallet / other purpose
```

according to explicit allocation.

---

# 75. Client Statement

Client statement should show chronological financial events.

Example:

```text
01 Sep
Payment +₹20,000

02 Sep
JOB-001 Allocation ₹15,000

05 Sep
Ad Spend ₹5,000

10 Sep
Ad Spend ₹7,000

12 Sep
Unused ₹3,000 returned to wallet

15 Sep
Refund ₹2,000
```

---

# 76. Statement Filters

```text
Date Range

Transaction Type

Job

Ad Account

Status
```

---

# 77. Client Ledger

Advanced finance view:

```text
Ledger Account

Debits

Credits

Running Balance

Transaction Reference
```

Only roles with financial permission.

---

# 78. Client Timeline

Unified operational timeline:

```text
Client Created

Payment Received

Job Created

Ad Account Assigned

Campaign Mapped

Spend Updated

Restriction

Leftover Created

Refund Initiated

Refund Completed
```

---

# 79. Client Audit

Track:

```text
Who created client

Who edited profile

Who added payment

Who allocated funds

Who requested transfer

Who approved refund

Who closed job

Who closed client
```

---

# 80. Client Notes

Notes may include:

```text
Special billing arrangement

Campaign instruction

Payment commitment

Operational note
```

Notes should include author/time.

---

# 81. Client Attachments

Possible:

```text
Payment Proof

Agreement

Invoice

Refund Proof

Other Document
```

---

# 82. Assigned Client Manager

Each client can optionally have:

```text
Primary Manager

Secondary Team
```

Used for filtering, permissions and alerts.

---

# 83. Client Alerts

Possible:

```text
CLIENT_PAYMENT_PENDING

CLIENT_UNDERFUNDED

CLIENT_OVESPEND

CLIENT_UNUSED_BALANCE

CLIENT_LEFTOVER_AGED

CLIENT_LOCKED_FUND

CLIENT_LOCKED_FUND_AGED

CLIENT_REFUND_PENDING

CLIENT_RECEIVABLE_AGED

CLIENT_RECONCILIATION_MISMATCH

CLIENT_FINANCIAL_CLOSURE_PENDING
```

---

# 84. Client Dashboard Card

Client detail top summary example:

```text
Client A

Available Wallet:
₹5,000

Allocated:
₹20,000

Spend:
₹17,000

Unused:
₹3,000

Locked:
₹2,000

Refund Pending:
₹0

Receivable:
₹5,000
```

---

# 85. Client Total Owned Fund

If shown, must clearly define components.

Example:

```text
Total Client-Owned:
₹10,000
```

Breakdown:

```text
Available ₹5,000
Unused ₹3,000
Locked ₹2,000
```

Avoid double counting amounts already represented in wallet.

---

# 86. Client Financial Reconciliation

System should compare:

```text
Payments
+
Other Valid Client Credits
```

against:

```text
Spend
+
Current Client-Owned Funds
+
Refunds
+
Ownership Transfers
+
Other Approved Settlements
```

---

# 87. Reconciliation Case

If difference:

```text
Expected:
₹20,000

Tracked:
₹19,500
```

create:

```text
CLIENT_RECONCILIATION_MISMATCH
₹500
```

---

# 88. Client Closure

Operational client closure:

```text
Status:
CLOSED
```

should not delete records.

---

# 89. Financial Closure Check

Before financially settled:

```text
Wallet Available = 0?

Unresolved Leftover = 0?

Locked Fund = 0?

Refund Pending = 0?

Client Receivable = 0?

Active Jobs = 0?

Open Reconciliation = 0?
```

---

# 90. Closure Pending

If any unresolved item:

```text
Financial Status:
CLOSURE_PENDING
```

---

# 91. Client Reopen

Closed client may later return.

Authorized user can:

```text
REOPEN
```

Same canonical Client ID retained.

---

# 92. Client Hard Delete

Do not hard delete if:

```text
Payment history exists

Job exists

Ledger exists

Refund exists

Audit dependency exists
```

Use inactive/closed.

---

# 93. Empty Client Deletion

A mistakenly created client with no financial/operational history may be deletable by authorized Admin if product policy allows.

Prefer audit entry even then.

---

# 94. Client Merge

Duplicate client merge is high-risk because financial records may exist.

V1 recommendation:

```text
Do not implement automatic merge.
```

Future controlled merge may require Admin workflow.

---

# 95. Client Job Cancellation

If no spend:

```text
Allocated amount
↓
Return to Client Wallet
```

if physically available.

---

# 96. Job Cancellation After Partial Spend

Example:

```text
Allocated:
₹10,000

Spend:
₹3,000
```

Remaining:

```text
₹7,000
```

becomes leftover/unresolved balance.

---

# 97. Job Restricted Mid-Campaign

If assigned account restricts:

```text
Job Operational State:
PAUSED / REASSIGNMENT_REQUIRED
```

depending on workflow.

Financial:

```text
Remaining physical amount → LOCKED
```

where applicable.

---

# 98. Job Reassignment

New Ad Account assignment does not move old locked balance.

New funding source must be recorded.

---

# 99. Client Temporary Agency Support

Client detail should show separately:

```text
Client-Owned Funds

Agency-Funded Exposure

Client Receivable
```

if applicable.

---

# 100. Client Payment Reversal

If bank reverses client payment:

```text
Original Payment
↓
PAYMENT_REVERSAL
```

If client already spent funds:

create:

```text
Client Receivable / Funding Gap
```

instead of negative unexplained wallet.

---

# 101. Late Meta Spend

If spend changes after financial settlement:

System should reopen or flag affected job reconciliation.

Do not silently alter historical refund/leftover transactions.

---

# 102. Post-Completion Spend

If job completed but campaign still spends:

Create:

```text
POST_COMPLETION_SPEND
```

alert.

Financial settlement should return to review.

---

# 103. Client Data Permissions

Examples:

```text
VIEW_CLIENT

CREATE_CLIENT

EDIT_CLIENT

VIEW_CLIENT_FINANCIALS

CREATE_CLIENT_PAYMENT

CREATE_CLIENT_JOB

ALLOCATE_CLIENT_FUND

CREATE_CLIENT_REFUND

APPROVE_CLIENT_REFUND

VIEW_CLIENT_LEDGER
```

---

# 104. Ads Manager View

Ads Manager should focus on:

```text
Jobs

Ad Accounts

Campaign Mappings

Spend

Allocation

Locked Operational Impact
```

Sensitive finance details may be hidden.

---

# 105. Finance View

Finance should focus on:

```text
Payments

Wallet

Leftovers

Refunds

Receivables

Ledger

Reconciliation
```

---

# 106. Admin View

Admin sees:

```text
Complete Client Profile

Operational History

Financial History

Approvals

Audit

Sensitive Adjustments
```

---

# 107. Client Quick Actions

Role-based:

```text
Add Payment

Create Job

Allocate Fund

Initiate Refund

Create Receivable

Add Note

Close Client
```

---

# 108. Client List Bulk Actions

Future/limited:

```text
Assign Manager

Add Tag

Export
```

Avoid bulk financial transactions in V1.

---

# 109. Client Tags

Optional:

```text
High Spend

Priority

Credit Client

Prepaid

New Client

Paused
```

Tags must not replace structured financial states.

---

# 110. Client Reporting

Required reports:

```text
Client Statement

Client Payment Report

Client Spend Report

Client Wallet Report

Client Leftover Report

Client Locked Fund Report

Client Refund Report

Client Receivable Report
```

---

# 111. Client Statement Export

V1 can support:

```text
CSV

Excel
```

Future:

```text
PDF
```

---

# 112. Financial Data Freshness

Client payment/ledger data should be current immediately after posting.

Meta-derived spend should display:

```text
Last Synced At
```

---

# 113. Unknown Spend Data

If Meta spend unavailable:

Show:

```text
—
Data unavailable / stale
```

not:

```text
₹0
```

unless actual known zero.

---

# 114. Client Screen Performance

Client may have hundreds of transactions/jobs.

Use:

```text
Pagination

Date Filters

Lazy-loaded Tabs

Indexed Search
```

---

# 115. Client API Separation

Recommended logical APIs:

```text
/client

/client/:id/payments

/client/:id/wallet

/client/:id/jobs

/client/:id/allocations

/client/:id/leftovers

/client/:id/locked-funds

/client/:id/refunds

/client/:id/receivables

/client/:id/statement
```

Exact API design later document me define hoga.

---

# 116. Client Data Sources

Client module data comes from:

```text
Internal Database

Financial Ledger

Meta Campaign/Spend Sync

Account Status Sync

Approval System

Audit System
```

---

# 117. V1 Must-Have

```text
Client List

Create/Edit Client

Client Detail

Client Payments

Client Wallet

Client Jobs

Job Funding

Ad Account Assignment

Campaign Mapping

Spend View

Leftover Tracking

Locked Funds

Refunds

Client Statement

Financial Closure Check
```

---

# 118. V1 Should-Have

```text
Client Receivables

Manager Assignment

Attachments

Aging Views

Client Timeline

Advanced Filters
```

---

# 119. Future Features

Potential:

```text
Client Portal

Automated Statements

Invoice Integration

Payment Gateway Links

Credit Limits

Profitability

Client Notifications

CRM Integration
```

These should not compromise core ledger model.

---

# 120. Client Management Integrity Rules

System must enforce:

```text
1. Client identity must use stable internal ID.

2. Client payments and job budgets are separate concepts.

3. Wallet balances must be transaction-derived.

4. Client funds cannot be allocated beyond available balance without alternate funding.

5. Allocation does not equal spend.

6. Spend must be attributed to job/client where possible.

7. Unused client fund remains client-owned by default.

8. Cross-client transfers require explicit approval.

9. Client-to-agency ownership changes require explicit approval.

10. Locked funds cannot be shown as available.

11. Refunds must reserve and settle real client-owned balances.

12. Operational job completion does not equal financial settlement.

13. Posted client transactions cannot be silently edited.

14. Client closure cannot destroy financial history.

15. Financial mismatches must create reconciliation cases rather than hidden balance changes.
```

---

# 121. Client Management Golden Rule

> **The client module must always make it possible to answer: how much the client paid, how much is currently available, how much is allocated, where it is allocated, how much was spent, what remains, what is locked, what has been refunded, what the client owes, and whether every amount is financially resolved.**
