# Vendor Management

## Overview

Vendor Management module company aur external funding vendors ke complete financial relationship ko manage karega.

Vendor ko sirf contact record ke form me treat nahi karna.

System ko vendor ke saath ye complete lifecycle track karna hai:

```text
Vendor
↓
Funding
↓
Funding Batches
↓
Vendor Payable
↓
Repayments
↓
Settlement
↓
Overpayment Detection
↓
Vendor Receivable
↓
Recovery / Offset
↓
Financial Closure
```

Core principle:

> **Vendor se aaya hua har fund aur vendor ko gaya hua har payment traceable hona chahiye, aur system ko hamesha clearly batana chahiye ki company vendor ko kitna dena hai aur vendor se company ko kitna lena hai.**

---

# 1. Vendor Module Scope

Vendor Management cover karega:

```text
Vendor Creation

Vendor Profile

Vendor Status

Funding Receipts

Funding Batches

Vendor Payables

Vendor Settlements

Batch Settlement

Overpayment Detection

Vendor Receivables

Receivable Recovery

Funding Adjustments

Vendor Statement

Financial Closure

Vendor Audit
```

---

# 2. Vendor Entity

Every vendor ka stable internal record hoga.

Example:

```text
Vendor ID:
VEN-0001

Name:
RAM

Status:
ACTIVE
```

Vendor name unique identity nahi hoga.

Canonical internal identity:

```text
vendor_id
```

---

# 3. Vendor Basic Fields

Recommended:

```text
Internal Vendor ID

Vendor Name

Company Name

Phone

Email

Status

Assigned Finance Owner

Created At

Created By

Notes
```

Optional:

```text
Payment Details

Bank Details

Agreement Reference

Vendor Category

Tags
```

Sensitive payment details permission-protected honi chahiye.

---

# 4. Vendor Status

Operational statuses:

```text
ACTIVE

INACTIVE

ON_HOLD

BLOCKED

CLOSED
```

Financial status separate rahega.

---

# 5. Vendor Financial Status

Possible derived states:

```text
NO_OPEN_BALANCE

HAS_PAYABLE

HAS_RECEIVABLE

HAS_PAYABLE_AND_RECEIVABLE

PENDING_SETTLEMENT

CLOSURE_PENDING

SETTLED
```

---

# 6. Vendor List

Recommended columns:

```text
Vendor Name

Status

Total Funding

Current Payable

Current Receivable

Open Funding Batches

Pending Settlements

Last Funding

Last Settlement

Last Activity
```

---

# 7. Vendor Search

Search by:

```text
Vendor Name

Company Name

Phone

Email

Internal Vendor ID
```

---

# 8. Vendor Filters

Recommended:

```text
Status

Has Payable

Has Receivable

Has Open Funding Batch

Settlement Pending

Receivable Aged

Payable Aged

Financial Closure Pending
```

---

# 9. Create Vendor

Authorized user can create vendor.

Recommended required fields:

```text
Vendor Name

Status
```

Optional payment information can be added later.

---

# 10. Duplicate Vendor Warning

Potential duplicate indicators:

```text
Phone

Email

Company Name

Payment Details
```

System should warn but not automatically merge.

---

# 11. Vendor Detail Screen

Recommended tabs:

```text
Overview

Funding

Funding Batches

Settlements

Payables

Receivables

Recoveries

Adjustments

Ledger

Statement

Timeline

Audit
```

---

# 12. Vendor Overview

Top section:

```text
Vendor Name

Vendor ID

Status

Assigned Finance Owner

Created Date

Financial Status
```

Financial cards:

```text
Total Funding Received

Total Valid Repayment

Current Payable

Current Receivable

Pending Settlements

Open Funding Batches
```

---

# 13. Vendor Funding

Vendor Funding means company receives money/credit from vendor.

Example:

```text
RAM
↓
₹1,00,000
↓
Company
```

Funding creates:

```text
Vendor Payable
₹1,00,000
```

unless another contractual model is explicitly configured.

---

# 14. Add Vendor Funding

Fields:

```text
Vendor

Amount

Currency

Received Date

Payment Method

Reference / UTR

Funding Batch

Proof

Notes
```

---

# 15. Vendor Funding Status

```text
DRAFT

PENDING

CONFIRMED

POSTED

FAILED

CANCELLED

REVERSED
```

Only valid posted funding should create payable.

---

# 16. Vendor Funding Is Not Revenue

System should never classify vendor funding as:

```text
Revenue
```

by default.

It represents:

```text
Funding / Liability
```

---

# 17. Funding Batch

Every vendor funding should belong to a funding batch or funding facility structure.

Example:

```text
RAM-RF-001

Original Amount:
₹1,00,000
```

---

# 18. Funding Batch Fields

Recommended:

```text
Batch ID

Vendor ID

Human Reference

Original Amount

Received Amount

Repaid Amount

Outstanding Amount

Currency

Opened At

Settled At

Status

Notes
```

---

# 19. Funding Batch Status

```text
DRAFT

OPEN

PARTIALLY_SETTLED

SETTLED

ADJUSTED

CANCELLED
```

---

# 20. Funding Batch Detail

Display:

```text
Original Funding

Total Valid Repayment

Current Outstanding

Settlement Progress

Funding Transactions

Settlement Transactions

Adjustments

Age
```

---

# 21. Multiple Funding Batches

Example:

```text
RAM-RF-001
₹1,00,000

RAM-RF-002
₹2,00,000
```

They must remain separate.

Vendor total payable can aggregate them:

```text
₹3,00,000
```

but detail remains batch-wise.

---

# 22. Vendor Payable

Definition:

> Amount company currently owes vendor.

Basic:

```text
Funding Received
-
Valid Repayment
-
Approved Liability Adjustments
=
Vendor Payable
```

---

# 23. Vendor Payable Must Be Derived

Do not allow:

```text
Set RAM Payable = ₹80,000
```

manually.

Payable should come from ledger/transactions.

---

# 24. Vendor Payable Card

Example:

```text
RAM

Current Payable:
₹80,000
```

Supporting:

```text
RF-001 ₹30,000
RF-002 ₹50,000
```

---

# 25. Vendor Payable Aging

Track:

```text
0–7 Days

8–15 Days

16–30 Days

31+ Days
```

Prefer batch-level aging.

---

# 26. Vendor Payable List

Columns:

```text
Vendor

Batch

Original Funding

Outstanding

Age

Last Settlement

Status
```

---

# 27. Create Vendor Settlement

Workflow:

```text
Select Vendor
↓
View Current Payable
↓
Enter Payment Amount
↓
Select Source
↓
Choose / Auto Allocate Funding Batches
↓
Upload Proof
↓
Submit
↓
Approval
↓
Post
```

---

# 28. Settlement Amount Validation

Example:

```text
Vendor Payable:
₹40,000

Entered Payment:
₹20,000
```

System:

```text
Valid Repayment:
₹20,000

Remaining Payable:
₹20,000
```

---

# 29. Full Settlement

Before:

```text
Payable:
₹20,000
```

Payment:

```text
₹20,000
```

After:

```text
Payable:
₹0
```

Funding batch can become:

```text
SETTLED
```

---

# 30. Vendor Overpayment Detection

Example:

```text
Payable:
₹20,000

Payment:
₹30,000
```

System must calculate:

```text
Valid Repayment:
₹20,000

Excess:
₹10,000
```

---

# 31. Vendor Receivable Creation

Excess:

```text
₹10,000
```

becomes:

```text
Vendor Receivable:
₹10,000
```

Meaning:

> Vendor owes company ₹10,000.

---

# 32. Payable Must Never Become Negative

Invalid:

```text
Vendor Payable:
-₹10,000
```

Preferred:

```text
Vendor Payable:
₹0

Vendor Receivable:
₹10,000
```

---

# 33. Vendor Receivable

Vendor Receivable can originate from:

```text
Vendor Overpayment

Vendor Advance Recovery

Incorrect Extra Payment

Other Approved Recoverable
```

---

# 34. Vendor Receivable Fields

Recommended:

```text
Receivable ID

Vendor ID

Original Amount

Recovered Amount

Outstanding Amount

Reason

Origin Transaction

Created Date

Age

Status
```

---

# 35. Vendor Receivable Status

```text
OPEN

PARTIALLY_RECOVERED

RECOVERED

OFFSET

ADJUSTED

WRITTEN_OFF
```

---

# 36. Vendor Receivable List

Columns:

```text
Vendor

Receivable ID

Original Amount

Outstanding

Reason

Created Date

Age

Status
```

---

# 37. Receivable Recovery

Example:

```text
RAM Receivable:
₹10,000
```

Ram returns:

```text
₹4,000
```

Result:

```text
Recovered:
₹4,000

Outstanding:
₹6,000
```

---

# 38. Full Receivable Recovery

If vendor returns full:

```text
₹10,000
```

status:

```text
RECOVERED
```

Outstanding:

```text
₹0
```

---

# 39. Vendor Recovery Payment

Fields:

```text
Vendor

Receivable ID

Amount

Date

Payment Method

Reference

Proof

Received By
```

---

# 40. Receivable Offset Against New Funding

Example:

Existing:

```text
Vendor Receivable:
₹10,000
```

New Funding:

```text
₹2,00,000
```

Approved offset:

```text
Gross Funding:
₹2,00,000

Receivable Offset:
₹10,000

Net New Payable:
₹1,90,000
```

---

# 41. Offset Must Be Explicit

Do not create only:

```text
New Funding:
₹1,90,000
```

because it hides ₹10,000 recovery.

Correct history:

```text
Funding +₹2,00,000

Receivable Offset -₹10,000

Net Payable +₹1,90,000
```

---

# 42. Vendor May Have Payable and Receivable Together

Example:

```text
Payable:
₹50,000

Receivable:
₹10,000
```

UI must show both.

Optional:

```text
Net Exposure:
₹40,000 Payable
```

can be secondary.

---

# 43. No Automatic Netting

Do not silently:

```text
₹50,000 Payable
-
₹10,000 Receivable
=
₹40,000
```

and erase both source balances.

Need explicit offset transaction.

---

# 44. Settlement Source

Every vendor settlement should identify money source.

Possible:

```text
CLIENT_COLLECTION

AGENCY_FUND

COMPANY_FUND

OTHER_APPROVED_SOURCE
```

---

# 45. Client Collection Source

Example:

```text
Client A Payment:
₹20,000
```

used to settle:

```text
RAM:
₹20,000
```

System should preserve source reference.

---

# 46. Settlement Source Split

One vendor settlement may use:

```text
Client A ₹10,000
Client B ₹5,000
Agency ₹5,000
```

for total:

```text
₹20,000
```

System should support multiple settlement source allocations.

---

# 47. One Source Across Multiple Vendors

Example client collection:

```text
₹50,000
```

used:

```text
RAM ₹20,000

SHYAM ₹20,000

Agency Pool ₹10,000
```

Source usage must not exceed available amount.

---

# 48. Prevent Double Use

System must prevent same ₹20,000 source from being allocated:

```text
₹20,000 → RAM
```

and again:

```text
₹20,000 → SHYAM
```

without sufficient balance.

Ledger enforces this.

---

# 49. Settlement Funding Batch Allocation

Valid repayment should map to open vendor funding batches.

Default policy:

```text
FIFO
```

---

# 50. FIFO Example

Open:

```text
RF-001 ₹30,000

RF-002 ₹70,000
```

Settlement:

```text
₹50,000
```

Apply:

```text
RF-001 ₹30,000

RF-002 ₹20,000
```

Remaining:

```text
RF-002 ₹50,000
```

---

# 51. Manual Batch Allocation

Authorized Finance/Admin can manually choose batch.

Require:

```text
Reason
```

and audit.

---

# 52. Settlement Detail Screen

Show:

```text
Settlement ID

Vendor

Payment Amount

Payable Before

Valid Repayment

Excess

Payable After

Receivable After

Payment Source

Batch Allocations

Reference

Proof

Approval History

Ledger Entries

Audit
```

---

# 53. Settlement Status

```text
DRAFT

PENDING_APPROVAL

APPROVED

PAYMENT_PENDING

POSTED

FAILED

CANCELLED

REVERSED
```

---

# 54. Pending Settlement

Pending payment should not silently reduce posted payable.

Example:

```text
Gross Payable:
₹50,000

Pending Settlement:
₹20,000

Actual Posted Payable:
₹50,000
```

Optional available-to-settle:

```text
₹30,000
```

if reservation logic used.

---

# 55. Settlement Reservation

To prevent duplicate scheduling:

```text
Payable:
₹50,000

Reserved:
₹20,000

Available To Schedule:
₹30,000
```

Reservation is not final repayment.

---

# 56. Settlement Approval

High-value or sensitive settlement can require approval.

Possible:

```text
Finance Creates

Admin Approves

Finance Posts
```

or configured workflow.

---

# 57. Overpayment Approval

Payment beyond payable should either:

```text
BLOCK
```

or:

```text
REQUIRE_APPROVAL
```

Recommended default:

```text
REQUIRE_APPROVAL
```

for controlled flexibility.

---

# 58. Maker-Checker

High-risk vendor actions can enforce:

```text
Creator != Approver
```

Examples:

```text
Overpayment

Write-Off

Large Settlement

Manual Adjustment

Reversal
```

---

# 59. Settlement Payment Proof

Support:

```text
UTR

Bank Reference

Screenshot

Payment Date

Payment Method
```

---

# 60. Missing Proof

Configurable rule:

```text
Allow post with warning
```

or:

```text
Block until proof uploaded
```

depending on company process.

---

# 61. Vendor Funding Proof

Funding receipts should also support:

```text
Bank Proof

UPI Proof

Statement

Receipt
```

---

# 62. Vendor Statement

Chronological:

```text
01 Sep
Funding +₹1,00,000

03 Sep
Repayment -₹20,000

05 Sep
Repayment -₹20,000

10 Sep
Repayment -₹60,000

12 Sep
Overpayment ₹10,000

20 Sep
Recovery ₹4,000
```

Current:

```text
Payable ₹0

Receivable ₹6,000
```

---

# 63. Vendor Statement Filters

```text
Date Range

Funding

Repayment

Overpayment

Recovery

Adjustment

Batch
```

---

# 64. Vendor Timeline

Operational + financial timeline:

```text
Vendor Created

Funding Received

Funding Batch Opened

Settlement Created

Settlement Approved

Settlement Posted

Overpayment Detected

Receivable Recovered

Adjustment Created

Vendor Closed
```

---

# 65. Vendor Ledger

Finance view should support:

```text
Ledger Entries

Debits

Credits

Running Position

Transaction References
```

---

# 66. Vendor Adjustments

Adjustment should only be used for valid business/accounting corrections.

Examples:

```text
Receivable Offset

Payable Adjustment

Write-Off

Migration Correction
```

---

# 67. Manual Payable Adjustment

Never directly edit payable.

Use:

```text
VENDOR_PAYABLE_ADJUSTMENT
```

with:

```text
Amount

Reason

Reference

Approval
```

---

# 68. Manual Receivable Adjustment

Same:

```text
VENDOR_RECEIVABLE_ADJUSTMENT
```

not direct field edit.

---

# 69. Wrong Funding Entry

If draft:

```text
Edit / Cancel
```

If posted:

```text
Reverse
+
Create Correct Funding
```

---

# 70. Wrong Settlement Entry

Same:

```text
Original Settlement
↓
Reversal
↓
Correct Settlement
```

---

# 71. Settlement Reversal

Reversal should restore:

```text
Vendor Payable
```

and funding batch outstanding appropriately.

If original settlement created receivable, reversal must also reverse relevant receivable effect.

---

# 72. Failed Vendor Payment

If payment never completed:

```text
FAILED
```

No valid payable reduction.

---

# 73. Vendor Payment Confirmation

Possible sources:

```text
Manual Finance Confirmation

Bank Reference

Payment Provider

Future Bank Integration
```

---

# 74. Duplicate Settlement Protection

Use:

```text
Idempotency Key
```

plus:

```text
Duplicate Reference Detection
```

to avoid double posting.

---

# 75. Concurrent Settlement Protection

If two finance users settle same vendor simultaneously:

backend must re-check payable inside DB transaction.

Do not rely on stale UI value.

---

# 76. Atomic Settlement Posting

Recommended flow:

```text
Begin DB Transaction
↓
Lock Vendor Financial Position
↓
Validate Payable
↓
Validate Source Funds
↓
Calculate Valid Repayment
↓
Calculate Excess
↓
Create Ledger Entries
↓
Allocate Funding Batches
↓
Create Receivable if Excess
↓
Commit
```

Any failure:

```text
ROLLBACK
```

---

# 77. Vendor Alerts

Examples:

```text
VENDOR_PAYABLE_DUE

VENDOR_PAYABLE_AGED

VENDOR_OVERPAYMENT

VENDOR_RECEIVABLE_OPEN

VENDOR_RECEIVABLE_AGED

VENDOR_SETTLEMENT_PENDING

VENDOR_PAYMENT_FAILED

VENDOR_RECONCILIATION_MISMATCH

VENDOR_CLOSURE_PENDING
```

---

# 78. Vendor Payable Aging Alert

Example:

```text
RAM

Payable:
₹80,000

Age:
18 days
```

alert based on configured threshold.

---

# 79. Vendor Receivable Aging Alert

Example:

```text
RAM

Receivable:
₹10,000

Open:
27 days
```

High priority because overpayment can otherwise be forgotten.

---

# 80. Vendor Financial Reconciliation

Compare:

```text
Total Vendor Funding
```

with:

```text
Valid Repayment
+
Current Payable
+
Approved Liability Adjustments
```

Receivable side:

```text
Total Vendor Overpayment / Recoverable
=
Recovered
+
Outstanding Receivable
+
Approved Adjustments
```

---

# 81. Reconciliation Mismatch

Example:

```text
Funding:
₹1,00,000

Valid Repayment:
₹80,000

Expected Payable:
₹20,000

System Payable:
₹25,000
```

Difference:

```text
₹5,000
```

Create:

```text
VENDOR_RECONCILIATION_MISMATCH
```

---

# 82. Vendor Financial Closure

Vendor can be operationally closed separately.

Financial closure requires:

```text
Payable = ₹0

Receivable = ₹0

Open Funding Batches = 0

Pending Settlements = 0

Open Adjustments = 0

Reconciliation Cases = 0
```

---

# 83. Closure Pending

If any value remains:

```text
Financial Status:
CLOSURE_PENDING
```

---

# 84. Close Vendor

Operational status:

```text
CLOSED
```

does not erase financial history.

---

# 85. Reopen Vendor

If future funding occurs:

```text
CLOSED
↓
ACTIVE
```

same canonical vendor ID retained.

---

# 86. Vendor Hard Delete

Do not allow if:

```text
Funding Exists

Settlement Exists

Receivable Exists

Ledger History Exists

Audit Dependency Exists
```

---

# 87. Empty Vendor Delete

Vendor accidentally created with zero activity may optionally be deletable by Admin.

Audit event recommended.

---

# 88. Vendor Merge

Automatic vendor merge should not be implemented in V1.

Financial history merging is high-risk.

Future merge requires controlled process.

---

# 89. Vendor Payment Details

Sensitive payment details should support masking.

Example:

```text
Account:
XXXXXX1234
```

Only authorized roles see full details where needed.

---

# 90. Vendor Attachments

Possible:

```text
Funding Proof

Settlement Proof

Agreement

Bank Details Document

Receivable Recovery Proof
```

---

# 91. Vendor Notes

Examples:

```text
Vendor prefers weekly settlement

Old receivable to be adjusted next funding

Payment confirmation pending
```

Notes do not replace transactions.

---

# 92. Assigned Finance Owner

Vendor may have:

```text
Primary Finance Owner
```

Used for:

```text
Alerts

Follow-ups

Dashboard filtering
```

---

# 93. Vendor Tags

Optional:

```text
Primary Vendor

High Volume

Backup Vendor

Credit Vendor

On Hold
```

Tags are operational metadata.

---

# 94. Vendor Dashboard Card

Example:

```text
RAM

Total Funding:
₹3,00,000

Valid Repaid:
₹2,10,000

Current Payable:
₹80,000

Current Receivable:
₹10,000

Pending Settlement:
₹20,000

Open Batches:
1
```

---

# 95. Vendor List Summary

System-wide top:

```text
Active Vendors

Total Payable

Total Receivable

Pending Settlements

Open Funding Batches

Aged Receivables
```

---

# 96. Vendor Quick Actions

Role-based:

```text
Add Funding

Create Settlement

Record Recovery

Create Offset

Add Note

View Statement

Close Vendor
```

---

# 97. Vendor Funding Report

Columns:

```text
Vendor

Funding Batch

Funding Date

Amount

Repaid

Outstanding

Age

Status
```

---

# 98. Vendor Settlement Report

Columns:

```text
Settlement ID

Vendor

Payment Amount

Valid Repayment

Overpayment

Source

Payment Date

Status

Approved By
```

---

# 99. Vendor Receivable Report

Columns:

```text
Vendor

Receivable ID

Original Amount

Recovered

Outstanding

Age

Reason

Status
```

---

# 100. Vendor Statement Export

V1:

```text
CSV

Excel
```

Future:

```text
PDF
```

---

# 101. Financial Data Freshness

Vendor ledger data should update immediately after valid posting.

No dependency on Meta sync.

---

# 102. Vendor Management Permissions

Typical:

```text
VIEW_VENDOR

CREATE_VENDOR

EDIT_VENDOR

VIEW_VENDOR_FINANCIALS

CREATE_VENDOR_FUNDING

POST_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

APPROVE_VENDOR_SETTLEMENT

VIEW_VENDOR_RECEIVABLE

RECOVER_VENDOR_RECEIVABLE

OFFSET_VENDOR_RECEIVABLE

WRITE_OFF_VENDOR_RECEIVABLE

VIEW_VENDOR_LEDGER
```

---

# 103. Ads Manager Vendor Access

Ads Manager generally does not need full vendor financial data.

Optional limited view:

```text
Funding Source Name

Operational Allocation Reference
```

if relevant.

Sensitive payable/receivable data should remain Finance/Admin-only by default.

---

# 104. Finance Vendor Access

Finance handles:

```text
Funding

Batches

Settlements

Payables

Receivables

Recoveries

Statements

Reconciliation
```

subject to approval limits.

---

# 105. Admin Vendor Access

Admin additionally manages:

```text
High-Value Approval

Overpayment Approval

Write-Off Approval

Reversal Approval

Financial Closure

Sensitive Overrides
```

---

# 106. Vendor Payment Source Validation

System should ensure selected source has sufficient available amount where source is tracked internally.

Example:

```text
Agency Fund Available:
₹10,000

Settlement Source Requested:
₹20,000
```

Reject unless additional valid source selected.

---

# 107. Client-Owned Fund Warning

If selected source belongs to client and business ownership rules do not yet permit vendor settlement:

System must block or require valid ownership settlement first.

Do not consume client-owned fund silently.

---

# 108. Vendor Funding Usage Trace

Where business requires, system should answer:

> RAM-RF-001 se aaye funds kis Ad Accounts/campaigns me use hue?

This can be supported through fund allocation lineage.

---

# 109. Funding Source vs Vendor Liability

Important:

Funding source may be vendor RAM.

But vendor liability is tracked separately from where operational funds currently reside.

Example:

```text
Source:
RAM-RF-001

Current Location:
AD1

Vendor Payable:
Still open
```

---

# 110. Vendor Receivable Is an Asset

Vendor receivable must not be displayed as:

```text
negative payable only
```

because it represents company recoverable.

Dedicated UI required.

---

# 111. Pending vs Posted Values

Every vendor screen should distinguish:

```text
Current Posted Payable

Pending Settlement

Current Posted Receivable

Pending Recovery
```

Do not mix workflow states into final balances.

---

# 112. Historical Snapshot

System should be able to answer:

```text
What was RAM payable on 10 Sep?

What funding batches were open?

What receivable existed then?
```

Transaction history must support point-in-time reconstruction.

---

# 113. Vendor Activity Timeline

Example:

```text
01 Sep
Funding ₹1,00,000

05 Sep
Settlement ₹20,000

08 Sep
Settlement ₹30,000

10 Sep
Settlement ₹50,000

12 Sep
Extra Payment ₹10,000

15 Sep
Recovery ₹4,000
```

---

# 114. Vendor Opening Balance Migration

For legacy vendors:

```text
OPENING_VENDOR_PAYABLE

OPENING_VENDOR_RECEIVABLE
```

may be used.

Fields:

```text
Vendor

Amount

As-of Date

Verification Status

Reference / Notes
```

---

# 115. Legacy Confidence

Possible:

```text
VERIFIED

PARTIALLY_VERIFIED

UNVERIFIED
```

Legacy opening balances should be clearly marked.

---

# 116. Vendor Multi-Currency

Each funding/settlement needs currency.

Do not blindly aggregate:

```text
INR + USD
```

without conversion.

---

# 117. Monetary Precision

Store amounts in currency-safe minor units.

No floating point for financial amounts.

---

# 118. V1 Must-Have

```text
Vendor List

Vendor Create/Edit

Vendor Detail

Vendor Funding

Funding Batches

Vendor Payable

Vendor Settlement

Batch Settlement

Overpayment Detection

Vendor Receivable

Receivable Recovery

Vendor Statement

Reconciliation

Financial Closure Check
```

---

# 119. V1 Should-Have

```text
Vendor Aging

Attachments

Assigned Finance Owner

Advanced Filters

Opening Balance Migration

Vendor Timeline

Settlement Reservations
```

---

# 120. Future Features

Potential:

```text
Vendor Portal

Automated Bank Reconciliation

Vendor Statements by Email

Vendor Payment Scheduling

Credit Limits

Funding Forecast

Bank API Integration
```

Actual payment automation should be introduced only after core controls are stable.

---

# 121. Vendor Management Integrity Rules

System must enforce:

```text
1. Every vendor must have a stable internal ID.

2. Every posted vendor funding must create a traceable financial obligation.

3. Funding batches must remain individually traceable.

4. Vendor payable must be transaction-derived.

5. Vendor payable can never become negative.

6. Any payment above payable must create vendor receivable.

7. Vendor payable and receivable must remain separately visible.

8. Vendor settlement must map to valid payable/funding batches.

9. Pending settlement must not be treated as posted repayment.

10. Same source fund cannot be used twice.

11. Vendor receivable cannot disappear without recovery, offset, adjustment or write-off.

12. Payable/receivable netting must always be explicit.

13. Posted vendor transactions cannot be silently edited.

14. Wrong transactions require reversal/correction.

15. Financial closure cannot occur with unresolved payable, receivable or reconciliation issues.

16. Vendor history must remain available after operational closure.
```

---

# 122. Vendor Management Golden Rule

> **The vendor module must always make it possible to answer: how much money the vendor provided, which funding batches remain open, how much the company has validly repaid, how much is still payable, whether the vendor was overpaid, how much is recoverable from the vendor, and exactly which transactions created or resolved every amount.**
