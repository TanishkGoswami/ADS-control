# Finance Management

## Overview

Finance Management module system ka central financial control layer hoga.

Is module ka purpose sirf balances dikhana nahi hai.

System ko complete money lifecycle manage karna hai:

```text
Money Received
      ↓
Classified
      ↓
Owned
      ↓
Allocated
      ↓
Moved
      ↓
Spent / Settled
      ↓
Locked / Refunded / Recovered
      ↓
Reconciled
      ↓
Financially Closed
```

Core principle:

> **Financial balances must be calculated from transactions, not manually maintained as editable numbers.**

System ka financial truth:

```text
Ledger
+
Allocations
+
Ownership
+
Reconciliation
```

par based hoga.

---

# 1. Finance Module Scope

Finance Management cover karega:

```text
Financial Dashboard

Ledger Accounts

Transactions

Double-Entry Ledger

Client Funds

Agency Funds

Vendor Funding

Vendor Payables

Vendor Receivables

Client Receivables

Fund Allocations

Internal Transfers

Locked Funds

Refunds

Settlements

Adjustments

Reversals

Write-Offs

Opening Balances

Reconciliation

Financial Closing

Financial Reports
```

---

# 2. Finance Principles

System must follow:

```text
1. No manual balance overwrite.

2. Every money movement creates a transaction.

3. Every posted transaction creates balanced ledger entries.

4. Ownership and location are separate concepts.

5. Allocation and spend are separate.

6. Pending transactions do not equal posted transactions.

7. Posted transactions are immutable.

8. Corrections happen through reversal + correct entry.

9. Client, agency and vendor-related money must remain distinguishable.

10. Uncertainty must remain visible until reconciled.
```

---

# 3. Three Financial Dimensions

Every relevant fund should ideally answer:

```text
SOURCE
Where did the money come from?

OWNER
Whose money is it?

LOCATION
Where is it currently held/allocated?
```

Additional:

```text
PURPOSE
Why is it being held?

STATUS
What state is it in?
```

---

# 4. Source Examples

Possible fund sources:

```text
CLIENT_PAYMENT

VENDOR_FUNDING

AGENCY_FUNDING

META_REFUND

VENDOR_RECOVERY

CLIENT_RECEIVABLE_PAYMENT

OPENING_BALANCE

OTHER_APPROVED_SOURCE
```

---

# 5. Owner Examples

Possible business owners:

```text
CLIENT

AGENCY

COMPANY

UNATTRIBUTED
```

Vendor funding source does not automatically mean vendor owns operational funds inside an Ad Account.

Vendor liability is tracked separately.

---

# 6. Fund Locations

Possible logical locations:

```text
COMPANY_BANK

CLIENT_WALLET

AGENCY_POOL

AD_ACCOUNT

CAMPAIGN_ALLOCATION

LOCKED_FUNDS

REFUND_PENDING

VENDOR

UNRESOLVED_POOL
```

---

# 7. Fund States

Possible:

```text
AVAILABLE

RESERVED

ALLOCATED

SPENT

LOCKED

REFUND_PENDING

REFUNDED

TRANSFER_PENDING

TRANSFERRED

RECEIVABLE

PAYABLE

ADJUSTED

WRITTEN_OFF

SETTLED
```

---

# 8. Financial Ledger

Ledger is financial source of truth.

Core components:

```text
Ledger Accounts

Ledger Transactions

Ledger Entries
```

---

# 9. Ledger Accounts

Examples:

```text
Company Bank

Client A Wallet

Client B Wallet

Agency Fund

AD1 Funds

Locked Funds

Refund Pending

RAM Payable

RAM Receivable

Client A Receivable
```

Actual ledger account design DATA documentation me detailed hoga.

---

# 10. Double-Entry Rule

Every posted transaction must satisfy:

```text
Total Debit
=
Total Credit
```

Example:

Client pays ₹10,000.

Conceptually:

```text
Debit:
Company Bank ₹10,000

Credit:
Client A Liability / Wallet ₹10,000
```

Exact account classification accounting model ke according finalize hogi.

---

# 11. Transaction

Transaction business event represent karta hai.

Example:

```text
Transaction:
Client Payment

Amount:
₹10,000

Client:
Client A

Reference:
UTR123
```

One transaction may create multiple ledger entries.

---

# 12. Transaction Status

Recommended:

```text
DRAFT

PENDING_APPROVAL

APPROVED

PROCESSING

POSTED

FAILED

CANCELLED

REVERSED
```

Only:

```text
POSTED
```

transactions final balances affect karenge.

---

# 13. Draft Transactions

Draft:

```text
Can be edited

Can be deleted according to permissions

Does not affect ledger
```

---

# 14. Pending Approval

Pending transaction:

```text
Does not affect final ledger balances
```

although optional reserved balances may exist.

---

# 15. Posted Transaction

Once posted:

```text
Amount cannot be directly edited

Source cannot be silently changed

Destination cannot be silently changed

Ledger entries become immutable
```

Correction through reversal.

---

# 16. Transaction Types

Recommended transaction types:

```text
CLIENT_PAYMENT

CLIENT_PAYMENT_REVERSAL

CLIENT_ALLOCATION

CLIENT_LEFTOVER_RETURN

CLIENT_REFUND

CLIENT_TRANSFER

CLIENT_RECEIVABLE_CREATED

CLIENT_RECEIVABLE_SETTLEMENT

AGENCY_FUNDING

AGENCY_ALLOCATION

AGENCY_RECOVERY

AD_ACCOUNT_TOPUP

AD_SPEND

LOCK_FUNDS

UNLOCK_FUNDS

META_REFUND

VENDOR_FUNDING

VENDOR_REPAYMENT

VENDOR_OVERPAYMENT

VENDOR_RECOVERY

VENDOR_RECEIVABLE_OFFSET

MANUAL_ADJUSTMENT

WRITE_OFF

REVERSAL

OPENING_BALANCE
```

---

# 17. Transaction Detail Screen

Show:

```text
Transaction ID

Type

Date

Amount

Currency

Source

Destination

Owner

Purpose

Status

Reference

Related Client

Related Vendor

Related Ad Account

Related Job

Created By

Approved By

Posted At

Attachments

Ledger Entries

Audit History
```

---

# 18. Transaction Search

Search by:

```text
Transaction ID

Reference

Client

Vendor

Ad Account

Job

Amount

Created By
```

---

# 19. Transaction Filters

```text
Date Range

Transaction Type

Status

Client

Vendor

Ad Account

Currency

Created By

Approved By
```

---

# 20. No Manual Balance Edit

UI must never offer:

```text
Edit Balance
```

for financial entities.

Instead:

```text
Create Transaction

Create Adjustment

Create Reversal
```

---

# 21. Balance Calculation

Conceptually:

```text
Balance
=
Sum of Posted Ledger Entries
```

not:

```text
Stored Editable Number
```

Cached balance fields may exist for performance but must be derivable/rebuildable.

---

# 22. Client Financial Position

Finance should show per client:

```text
Payments Received

Available Wallet

Allocated

Spend

Unused

Locked

Refund Pending

Refunded

Receivable
```

---

# 23. Vendor Financial Position

Per vendor:

```text
Funding Received

Valid Repayment

Current Payable

Current Receivable

Pending Settlement

Recovered Amount

Open Batches
```

---

# 24. Agency Financial Position

Agency view:

```text
Opening Agency Fund

Agency Additions

Current Free Fund

Allocated Agency Fund

Locked Agency Fund

Temporary Client Funding

Recoveries

Vendor Settlement Usage
```

---

# 25. Agency Free Fund

Agency Free Fund means:

> Company-owned money currently free for valid allocation.

It must exclude:

```text
Client-Owned Funds

Locked Agency Fund

Pending Refund Reservations

Allocated Agency Funds

Unresolved Unknown Funds
```

---

# 26. Agency Fund Addition

Authorized Finance/Admin can create:

```text
AGENCY_FUNDING
```

Fields:

```text
Amount

Date

Source

Reference

Currency

Proof

Notes
```

---

# 27. Agency Allocation

Agency funds can be allocated to:

```text
Client Job

Ad Account

Vendor Settlement

Temporary Funding Requirement

Internal Advertising
```

Every use requires explicit transaction.

---

# 28. Temporary Client Funding

Example:

Client fund locked:

```text
₹5,000
```

Agency funds replacement:

```text
₹5,000
```

System records:

```text
Client Locked:
₹5,000

Agency Exposure:
₹5,000
```

Do not merge.

---

# 29. Agency Recovery

If client later reimburses agency:

```text
Client Payment
↓
Agency Recovery
```

This should reduce agency exposure/client receivable as appropriate.

---

# 30. Client Wallet

Client wallet balance must come from ledger.

Possible inflows:

```text
Client Payment

Returned Leftover

Refund Reversal

Approved Credit
```

Possible outflows:

```text
Job Allocation

Refund

Ownership Transfer
```

---

# 31. Client-Owned Funds

Client-owned total may exist across multiple locations:

```text
Client Wallet

Active Job Allocation

Ad Account

Locked Fund

Refund Pending
```

Owner stays Client until valid ownership change.

---

# 32. Client Funds Example

Client A:

```text
Available Wallet:
₹3,000

AD1 Allocation:
₹5,000

Locked:
₹2,000
```

Total Client-Owned:

```text
₹10,000
```

provided there is no double counting.

---

# 33. Client Receivable

Client Receivable means:

> Client owes company.

Examples:

```text
Agency-funded spend

Payment reversal after spend

Credit arrangement

Overspend covered by company
```

---

# 34. Client Receivable vs Wallet

Never net invisibly.

Example:

```text
Client Wallet:
₹2,000

Client Receivable:
₹5,000
```

UI may optionally show net exposure, but underlying amounts stay separate.

---

# 35. Vendor Payable

Vendor funding creates liability.

Example:

```text
RAM Funding:
₹1,00,000
```

Vendor Payable:

```text
₹1,00,000
```

---

# 36. Vendor Repayment

Vendor repayment reduces payable.

Example:

```text
Current Payable:
₹50,000

Payment:
₹20,000

Remaining:
₹30,000
```

---

# 37. Vendor Overpayment

If payment exceeds payable:

```text
Payable:
₹20,000

Payment:
₹30,000
```

split:

```text
Repayment:
₹20,000

Vendor Receivable:
₹10,000
```

---

# 38. Vendor Receivable

Vendor Receivable means:

> Vendor owes company.

It must not be represented only as negative payable.

---

# 39. Fund Allocation

Allocation means:

> Money is reserved/assigned for a business purpose.

Allocation does not equal spend.

---

# 40. Allocation Example

```text
Client Wallet:
₹20,000

Job Allocation:
₹15,000
```

After:

```text
Wallet Free:
₹5,000

Allocated:
₹15,000
```

Total ownership unchanged.

---

# 41. Allocation to Ad Account

Example:

```text
Client A Job
↓
₹10,000
↓
AD1
```

Owner:

```text
Client A
```

Location:

```text
AD1
```

Purpose:

```text
JOB-001
```

---

# 42. Internal Fund Transfer

Internal transfer changes location and possibly purpose.

Examples:

```text
Client Wallet → Job

Job → Ad Account

Ad Account → Client Wallet

Agency Pool → Ad Account
```

Not expense/spend by itself.

---

# 43. Ownership Transfer

Ownership transfer is higher risk.

Examples:

```text
Client A → Agency

Client A → Client B
```

Requires explicit approval.

---

# 44. Internal Transfer Screen

Fields:

```text
Source

Destination

Amount

Owner Before

Owner After

Purpose

Reason

Reference

Approval Requirement
```

---

# 45. Locked Funds

Locked fund represents tracked money currently unavailable.

Examples:

```text
Restricted Ad Account

Refund blocked

Operational platform issue
```

---

# 46. Lock Transaction

When funds become locked:

```text
AVAILABLE
↓
LOCKED
```

Ownership remains.

---

# 47. Unlock Transaction

After verified recovery:

```text
LOCKED
↓
AVAILABLE
```

or other valid destination.

---

# 48. Locked Fund View

Show:

```text
Owner

Amount

Ad Account

Client

Job

Locked Since

Reason

Recovery Status

Age
```

---

# 49. Refund Management

Refund is actual external financial outflow to client.

Refund lifecycle:

```text
Requested
↓
Approved
↓
Reserved
↓
Payment Pending
↓
Posted
```

---

# 50. Refund Reservation

If ₹5,000 refund approved:

that amount should not remain freely allocatable elsewhere.

Use reserved/refund-pending state.

---

# 51. Refund Failure

If payment fails:

```text
REFUND_FAILED
```

Money must return to appropriate unresolved/available state according to ledger workflow.

---

# 52. Partial Refund

Example:

```text
Approved:
₹10,000

Paid:
₹6,000

Remaining:
₹4,000
```

System must support partial execution.

---

# 53. Meta Refund

Meta refund is financial event.

Example:

```text
AD1 locked:
₹10,000

Meta Refund:
₹10,000
```

System must restore original ownership distribution where known.

---

# 54. Partial Meta Refund

Expected:

```text
₹10,000
```

received:

```text
₹9,500
```

Difference:

```text
₹500
```

creates reconciliation issue.

---

# 55. Spend Posting

Meta spend may be imported from API.

Financial system must distinguish:

```text
Meta Operational Spend Data
```

from:

```text
Internal Financial Recognition
```

Spend attribution/reconciliation rules determine ledger impact.

---

# 56. Spend Attribution

Meta spend should map to:

```text
Ad Account

Meta Campaign

Client Job

Client / Agency Funding Allocation
```

where possible.

---

# 57. Unattributed Spend

If spend cannot be confidently assigned:

```text
UNATTRIBUTED_SPEND
```

rather than guessing owner.

---

# 58. Overspend

If spend exceeds allocation:

```text
Allocated:
₹10,000

Spend:
₹10,500
```

create:

```text
Funding Gap:
₹500
```

Need explicit resolution.

---

# 59. Reconciliation

Finance module must include reconciliation between:

```text
Meta Truth

Ledger Truth

Business Allocation Truth
```

---

# 60. Reconciliation Types

```text
AD_ACCOUNT_RECONCILIATION

CLIENT_RECONCILIATION

VENDOR_RECONCILIATION

SPEND_ATTRIBUTION_RECONCILIATION

LOCKED_FUND_RECONCILIATION

REFUND_RECONCILIATION
```

---

# 61. Reconciliation Case

Fields:

```text
Case ID

Entity Type

Entity ID

Expected Value

Observed Value

Difference

Currency

Reason Category

Status

Assigned User

Created At

Resolved At
```

---

# 62. Reconciliation Status

```text
OPEN

UNDER_REVIEW

WAITING_FOR_SYNC

WAITING_FOR_DOCUMENT

ADJUSTMENT_PENDING

RESOLVED

CLOSED
```

---

# 63. Reconciliation Difference

Difference does not automatically mean loss.

Possible:

```text
Timing Difference

Missing Transaction

Meta Reporting Delay

Incorrect Attribution

Refund/Credit

Manual Error

Unknown Cause
```

---

# 64. Reconciliation Resolution

Possible resolution:

```text
Missing Transaction Added

Mapping Corrected

Timing Difference Cleared

Adjustment Posted

Refund Matched

Write-Off Approved
```

---

# 65. Manual Adjustment

Manual adjustment should be exceptional.

Fields:

```text
Entity

Amount

Currency

Adjustment Type

Reason

Reference

Evidence

Created By

Approved By
```

---

# 66. Adjustment Is Not Balance Edit

Correct:

```text
Adjustment +₹500
```

Incorrect:

```text
Change Balance from ₹9,500 to ₹10,000
```

---

# 67. Reversal

Wrong posted transaction is corrected with reversal.

Example:

```text
Wrong Client Payment:
+₹10,000
```

Correct actual:

```text
₹1,000
```

Flow:

```text
Original +₹10,000
Reversal -₹10,000
Correct +₹1,000
```

---

# 68. Reversal Requirements

```text
Original Transaction

Reason

Created By

Approved By

Reversal Transaction ID
```

---

# 69. Full Reversal

Entire original financial effect reversed.

---

# 70. Partial Correction

Prefer:

```text
Explicit correcting transaction
```

or controlled partial reversal depending on ledger design.

Never silently modify original posted entries.

---

# 71. Write-Off

Write-off can resolve genuinely unrecoverable amount.

Examples:

```text
Vendor Receivable

Client Receivable

Locked Unrecoverable Fund

Other Approved Financial Exposure
```

---

# 72. Write-Off Workflow

```text
Write-Off Requested
↓
Evidence Added
↓
Approval
↓
Write-Off Transaction
↓
Exposure Closed
```

---

# 73. Write-Off Permissions

Write-off should be Admin/high-level Finance approval.

Maker-checker strongly recommended.

---

# 74. Financial Approval Center

Finance actions requiring approval:

```text
Large Vendor Settlement

Vendor Overpayment

Large Refund

Cross-Client Transfer

Client-to-Agency Transfer

Manual Adjustment

Write-Off

Reversal
```

---

# 75. Approval Thresholds

Configurable.

Example:

```text
Up to ₹10,000:
Finance

₹10,001–₹50,000:
Senior Approval

Above ₹50,000:
Admin
```

Exact business values later configured.

---

# 76. Pending Transactions

Finance screen should show:

```text
Draft

Awaiting Approval

Approved but Unposted

Payment Pending

Failed
```

separately from posted balances.

---

# 77. Transaction Reservation

Certain pending transactions may reserve funds.

Example:

Approved refund:

```text
₹10,000
```

may reduce:

```text
Available to Allocate
```

without yet reducing physical balance.

---

# 78. Available vs Reserved

Example:

```text
Wallet Total:
₹20,000

Refund Reserved:
₹5,000

Available:
₹15,000
```

---

# 79. Financial Dashboard

Main cards:

```text
Client-Owned Funds

Agency Free Funds

Locked Funds

Refund Pending

Vendor Payable

Vendor Receivable

Client Receivable

Unresolved Financial Difference
```

---

# 80. Finance Dashboard Alerts

```text
Large Locked Funds

Aged Client Leftovers

Aged Vendor Receivables

Aged Client Receivables

Pending Refunds

Pending Vendor Settlements

Reconciliation Mismatches

Failed Transactions
```

---

# 81. Finance Ledger Screen

Tabs:

```text
Transactions

Ledger Accounts

Ledger Entries

Pending

Reversals

Adjustments
```

---

# 82. Transactions Table

Columns:

```text
Date

Transaction ID

Type

Source

Destination

Entity

Amount

Currency

Status

Created By

Approved By
```

---

# 83. Ledger Account View

Example:

```text
Client A Wallet
```

show:

```text
Opening

Debits

Credits

Current Balance

Transactions
```

---

# 84. Running Balance

Ledger account can show chronological running balance for easier investigation.

Final balance must still derive from entries.

---

# 85. Financial Drill-Down

Example:

Dashboard:

```text
Vendor Receivable:
₹10,000
```

click:

```text
RAM
```

click:

```text
Receivable VRC-001
```

click:

```text
Original Settlement
```

click:

```text
Ledger Entries
```

Complete trace required.

---

# 86. Financial Timeline

Entity-level timeline should show:

```text
Funding

Payment

Allocation

Spend

Lock

Unlock

Refund

Settlement

Adjustment

Reversal
```

---

# 87. Financial Audit

For every high-risk action capture:

```text
User

Action

Before State

After State

Amount

Reason

Timestamp

Approval
```

---

# 88. Opening Balances

Existing business migration may require:

```text
OPENING_BALANCE
```

types.

Possible:

```text
Client Wallet Opening

Agency Fund Opening

Vendor Payable Opening

Vendor Receivable Opening

Ad Account Opening Allocation
```

---

# 89. Opening Balance Fields

```text
Entity

Amount

Owner

Location

As-of Date

Currency

Verification Status

Reference

Notes
```

---

# 90. Legacy Verification

Statuses:

```text
VERIFIED

PARTIALLY_VERIFIED

UNVERIFIED
```

Dashboard/report should not hide uncertainty.

---

# 91. Closing Periods

Future/optional financial period closing:

```text
Daily

Monthly
```

When period finalized, backdated transactions may trigger review.

---

# 92. Backdated Transaction

Store both:

```text
Business Transaction Date

Created At

Posted At
```

If prior closed period affected:

```text
REOPEN_REVIEW_REQUIRED
```

or adjustment workflow.

---

# 93. Currency

Every transaction must have currency.

Examples:

```text
INR

USD

AED
```

---

# 94. Multi-Currency

Do not add:

```text
₹10,000 + $500
```

directly.

Use:

```text
Separate balances
```

or approved reporting FX conversion.

---

# 95. Monetary Storage

Never use floating-point for money.

Recommended:

```text
BIGINT minor units
```

Example:

```text
₹1,250.75
=
125075 paise
```

---

# 96. Currency Precision

System should be currency-aware.

Do not assume every currency uses exactly two decimal places.

---

# 97. Idempotency

Every sensitive posting API should support:

```text
idempotency_key
```

to prevent duplicate posting.

---

# 98. Duplicate Reference Detection

System should detect repeated:

```text
UTR

Payment Reference

External Transaction ID
```

and warn/block appropriately.

---

# 99. Atomic Financial Operations

Financial posting must use database transaction.

Example vendor settlement:

```text
Validate Source
↓
Validate Payable
↓
Create Transaction
↓
Create Ledger Entries
↓
Update Allocations
↓
Create Receivable if Needed
↓
Commit
```

Any failure:

```text
ROLLBACK
```

---

# 100. Concurrency Protection

If two users try to use same fund simultaneously:

backend must prevent double spending.

Use:

```text
Database Locks

Transactions

Version Checks
```

where needed.

---

# 101. Balance Constraints

System should prevent:

```text
Client Wallet < 0
```

unless explicit client credit policy.

Similarly:

```text
Agency Available < 0
```

unless authorized overdraft concept exists.

Vendor payable must never go negative.

---

# 102. Source Availability Validation

Before allocation/payment:

```text
Available Source Amount >= Requested Amount
```

must be validated.

---

# 103. Double Use Prevention

Same fund cannot simultaneously be:

```text
Available in Client Wallet
```

and:

```text
Allocated to Job
```

after posting.

State movement must remove it from source availability.

---

# 104. Double Counting Prevention

Example:

₹5,000 moved:

```text
Client Wallet
→
AD1
```

Do not count:

```text
Wallet ₹5,000
+
AD1 ₹5,000
```

as ₹10,000 client money.

It is the same ₹5,000 at new location.

---

# 105. Financial Snapshot

System may create periodic snapshots for performance/reporting.

Examples:

```text
Daily Client Balance Snapshot

Daily Vendor Position Snapshot

Daily Ad Account Financial Snapshot
```

Snapshots do not replace ledger.

---

# 106. Point-in-Time Reporting

System should eventually answer:

```text
Client A wallet on 01 Sep?

RAM payable on 10 Sep?

Total locked fund on 15 Sep?
```

using ledger/history/snapshots.

---

# 107. Finance Reports

Required:

```text
Fund Movement Report

Client Financial Statement

Client Wallet Report

Client Leftover Report

Client Receivable Report

Vendor Funding Report

Vendor Payable Report

Vendor Receivable Report

Vendor Settlement Report

Agency Fund Report

Locked Fund Report

Refund Report

Transaction Report

Reconciliation Report
```

---

# 108. Fund Movement Report

Columns:

```text
Date

Transaction ID

Type

Source

Destination

Owner

Purpose

Amount

Currency

Status
```

---

# 109. Agency Fund Report

Show:

```text
Opening

Additions

Allocations

Recoveries

Locked Amount

Current Free Fund
```

---

# 110. Locked Fund Report

Show:

```text
Owner

Client

Ad Account

Amount

Reason

Locked Since

Age

Recovery Status
```

---

# 111. Refund Report

Show:

```text
Client

Requested

Approved

Paid

Pending

Status

Age

Reference
```

---

# 112. Receivable Report

Separate:

```text
Client Receivables

Vendor Receivables
```

Do not combine without clear entity classification.

---

# 113. Financial Search

Global finance search:

```text
Transaction ID

UTR

Client

Vendor

Ad Account

Amount

Reference
```

---

# 114. Financial Export

V1:

```text
CSV

Excel
```

Future:

```text
PDF Statements
```

---

# 115. Finance Permissions

Core permissions:

```text
VIEW_FINANCIAL_DASHBOARD

VIEW_LEDGER

CREATE_CLIENT_PAYMENT

POST_CLIENT_PAYMENT

CREATE_VENDOR_FUNDING

POST_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

CREATE_REFUND

CREATE_FUND_TRANSFER

CREATE_MANUAL_ADJUSTMENT

APPROVE_FINANCIAL_TRANSACTION

REVERSE_TRANSACTION

APPROVE_WRITE_OFF
```

---

# 116. Finance Role Experience

Finance user should be able to answer:

```text
How much client money do we hold?

Where is client money currently located?

How much agency free money is available?

How much is locked?

How much do we owe vendors?

How much do vendors owe us?

How much do clients owe us?

Which refunds are pending?

Which transactions need approval?

Which mismatches need reconciliation?
```

---

# 117. Admin Finance Experience

Admin additionally needs:

```text
High-Risk Approval

Write-Off

Reversal

Ownership Change Approval

Manual Adjustment Review

Financial Closure
```

---

# 118. Ads Manager Finance Experience

Ads Manager may see limited operational finance:

```text
Ad Account Available Fund

Client Job Allocation

Spend

Locked Fund

Funding Requirement
```

without full ledger/vendor details.

---

# 119. Finance Alerts

Examples:

```text
LOW_BALANCE

NEGATIVE_BALANCE_ATTEMPT

VENDOR_OVERPAYMENT

VENDOR_RECEIVABLE_AGED

CLIENT_RECEIVABLE_AGED

CLIENT_LEFTOVER_AGED

LOCKED_FUND_AGED

REFUND_PENDING_AGED

DUPLICATE_TRANSACTION_ATTEMPT

RECONCILIATION_MISMATCH

FAILED_FINANCIAL_TRANSACTION

POST_COMPLETION_SPEND
```

---

# 120. Financial Closing Check

Before entity financial closure:

Check:

```text
Available Balance

Allocated Funds

Locked Funds

Pending Refunds

Payables

Receivables

Pending Transactions

Pending Approvals

Open Reconciliation Cases
```

---

# 121. Client Financial Closure

Requires:

```text
No unresolved client-owned fund

No refund pending

No locked fund requiring resolution

No client receivable

No open reconciliation
```

---

# 122. Vendor Financial Closure

Requires:

```text
Payable = 0

Receivable = 0

Open Funding Batches = 0

Pending Settlements = 0

Open Reconciliation = 0
```

---

# 123. Ad Account Financial Closure

Requires:

```text
No available owned funds

No locked funds

No client allocations

No pending refund

No reconciliation mismatch
```

---

# 124. Financial Error Handling

If financial posting fails halfway:

```text
No partial financial state should remain.
```

Use transactional rollback.

---

# 125. External API Failure

Meta/API failure must not corrupt internal ledger.

Financial ledger can remain valid while Meta data becomes stale.

Reconciliation waits for next valid sync.

---

# 126. Notification Failure

If WhatsApp/email notification fails:

financial posting remains valid.

Notifications must not control financial truth.

---

# 127. Financial Data Security

Sensitive data:

```text
Payment References

Bank Details

Vendor Details

Client Financial Data

Ledger Entries
```

must be permission protected.

---

# 128. Audit Retention

Financial audit records should be retained long-term according to company/compliance requirements.

Application users should not delete them.

---

# 129. Backup Requirement

Financial tables should be part of:

```text
Automated Backups

Point-in-Time Recovery where available

Restore Testing
```

Detailed policy later TECH documentation me.

---

# 130. V1 Must-Have

```text
Financial Dashboard

Ledger Transactions

Ledger Accounts

Client Wallet Tracking

Agency Fund Tracking

Vendor Payable

Vendor Receivable

Client Receivable

Fund Allocation

Internal Transfers

Locked Funds

Refunds

Vendor Settlements

Reversals

Manual Adjustments

Reconciliation

Transaction Search

Audit Trail
```

---

# 131. V1 Should-Have

```text
Opening Balance Migration

Aging Reports

Transaction Attachments

Approval Center

Financial Snapshots

Advanced Export
```

---

# 132. Future Features

Potential:

```text
Bank Integration

Automatic Bank Reconciliation

Payment Gateway Integration

Invoice Accounting

GST Integration

Profit & Loss

Cash Flow Forecasting

Financial Forecasting

AI Anomaly Detection

Automated Vendor Payment Scheduling
```

These should only be added after base ledger is stable and reliable.

---

# 133. Finance Management Integrity Rules

System must enforce:

```text
1. Every finalized balance must be transaction-derived.

2. Every posted transaction must produce balanced ledger entries.

3. Posted transactions cannot be silently edited or deleted.

4. Corrections must use reversal or explicit adjustment.

5. Client-owned funds must remain separate from agency-owned funds.

6. Allocation must remain separate from spend.

7. Vendor payable and receivable must remain separate.

8. Client wallet and client receivable must remain separate.

9. Locked funds cannot be counted as available.

10. Pending transactions cannot be presented as posted transactions.

11. Ownership changes require explicit records and approvals.

12. Same fund cannot be used or counted twice.

13. Financial posting must be atomic.

14. Duplicate posting must be prevented.

15. Unknown financial differences must remain unresolved until reconciled.

16. Finance reports must be traceable back to ledger transactions.
```

---

# 134. Finance Management Golden Rule

> **The finance module must never rely on someone remembering where money went. Every rupee must be represented through an auditable transaction and ledger trail that explains its source, owner, purpose, location, status and final resolution.**
