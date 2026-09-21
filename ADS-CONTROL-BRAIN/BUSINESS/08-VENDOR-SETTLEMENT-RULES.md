# Vendor Settlement Rules

## Overview

Vendor Settlement Rules define karte hain ki company vendor ko repayment kaise karegi, payable kaise calculate hoga, payment kis funding batch ke against apply hoga, overpayment kaise detect hoga, aur extra amount recoverable kaise banega.

Core principle:

> **Vendor ko payment tabhi valid repayment maana jayega jab vendor ke against actual payable exist karta ho. Payable se zyada amount automatically Vendor Receivable banega.**

---

# 1. Vendor Settlement Definition

Vendor Settlement ka matlab:

```text
Existing Vendor Payable
↓
Valid Payment / Adjustment
↓
Outstanding Payable Reduced
```

Settlement ka purpose vendor ki funding liability ko partially ya fully close karna hai.

---

# 2. Settlement Is Different From Payment

Important distinction:

```text
Payment
=
Money actually vendor ko bhejna
```

while:

```text
Settlement
=
Us payment ko known vendor obligation ke against apply karna
```

A payment without payable may become:

```text
Vendor Overpayment / Receivable
```

---

# 3. Vendor Payable

Basic concept:

```text
Vendor Payable
=
Funding Received
-
Valid Repayments
-
Approved Liability Adjustments
```

Example:

```text
Funding Received:
₹1,00,000

Already Repaid:
₹60,000

Current Payable:
₹40,000
```

---

# 4. Vendor Receivable

Vendor Receivable means:

> Vendor se company ko amount recover karna hai.

Example:

```text
Vendor Payable:
₹0

Extra Paid:
₹10,000

Vendor Receivable:
₹10,000
```

---

# 5. Payable and Receivable Must Remain Separate

Do not represent only:

```text
Vendor Balance = -₹10,000
```

Preferred:

```text
Company Owes Vendor:
₹0

Vendor Owes Company:
₹10,000
```

This avoids confusion.

---

# 6. Settlement Eligibility

Vendor settlement create karne se pehle system should verify:

```text
Vendor Status

Current Payable

Open Funding Batches

Existing Pending Settlements

Existing Vendor Receivable

User Permission
```

---

# 7. Settlement Request

Typical settlement request:

```text
Vendor:
RAM

Requested Amount:
₹20,000

Payment Date:
17 Sep 2026

Payment Source:
Client A Collection

Reference:
UTR-12345
```

---

# 8. Mandatory Settlement Fields

Every settlement should contain:

```text
Settlement ID

Vendor ID

Amount

Currency

Payment Date

Payment Source

Payment Method

Reference

Funding Batch Allocation

Created By

Approval Status

Payment Proof

Notes
```

---

# 9. Settlement Status

Recommended:

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

# 10. Draft Settlement

Draft does not affect ledger.

User can still edit:

```text
Amount

Reference

Funding source

Notes
```

before submission.

---

# 11. Pending Approval

Sensitive settlement can move to:

```text
PENDING_APPROVAL
```

No payable reduction until posting policy is satisfied.

---

# 12. Approved Does Not Always Mean Paid

Possible state:

```text
APPROVED
```

but actual transfer not yet completed.

Therefore payable should generally reduce only when:

```text
POSTED / PAYMENT_CONFIRMED
```

according to final business rule.

---

# 13. Valid Settlement Rule

If:

```text
Requested Payment <= Vendor Payable
```

then entire amount can be valid repayment.

Example:

```text
Payable:
₹40,000

Payment:
₹20,000
```

Result:

```text
Valid Repayment:
₹20,000

Remaining Payable:
₹20,000
```

---

# 14. Exact Settlement

Example:

```text
Payable:
₹20,000

Payment:
₹20,000
```

Result:

```text
Payable:
₹0

Status:
SETTLED
```

---

# 15. Overpayment Detection

If:

```text
Payment > Payable
```

system must split amount.

Example:

```text
Payable:
₹20,000

Payment:
₹30,000
```

System:

```text
Valid Repayment:
₹20,000

Excess:
₹10,000
```

---

# 16. Overpayment Result

After posting:

```text
Vendor Payable:
₹0

Vendor Receivable:
₹10,000
```

Do not reduce payable below zero.

---

# 17. Fully Settled Vendor Receiving New Payment

Example:

```text
RAM Payable:
₹0

Payment:
₹10,000
```

System classification:

```text
Valid Repayment:
₹0

Vendor Overpayment:
₹10,000

Vendor Receivable:
₹10,000
```

---

# 18. Overpayment Warning

Before confirmation:

```text
WARNING

Current Vendor Payable:
₹0

Entered Payment:
₹10,000

This payment will create:
Vendor Receivable ₹10,000
```

---

# 19. Overpayment Approval

Recommended:

```text
Payment > Payable
```

should require elevated approval.

Flow:

```text
Settlement Created
↓
Overpayment Detected
↓
PENDING_APPROVAL
↓
Admin / Finance Approval
↓
Payment / Posting
```

---

# 20. Optional Overpayment Blocking

Company may configure:

```text
BLOCK_OVERPAYMENT = true
```

Then system rejects payment above payable.

Alternative:

```text
ALLOW_WITH_APPROVAL = true
```

Recommended for real-world flexibility.

---

# 21. Settlement Against Funding Batches

Vendor may have multiple open funding batches.

Example:

```text
RAM-RF-001
Outstanding ₹30,000

RAM-RF-002
Outstanding ₹70,000
```

Total Payable:

```text
₹1,00,000
```

Payment:

```text
₹50,000
```

must be allocated against batches.

---

# 22. Default Batch Settlement Policy

Recommended default:

```text
FIFO
```

Oldest open funding batch settled first.

Example:

```text
Payment ₹50,000
```

Allocation:

```text
RF-001:
₹30,000

RF-002:
₹20,000
```

---

# 23. Batch Settlement Result

After payment:

```text
RF-001:
Outstanding ₹0
Status SETTLED

RF-002:
Outstanding ₹50,000
Status PARTIALLY_SETTLED
```

---

# 24. Manual Batch Selection

Finance user may override FIFO if required.

Example:

```text
Apply ₹20,000 specifically to RF-002
```

Manual override must require:

```text
Reason
Created By
Optional Approval
```

---

# 25. Batch Allocation Must Equal Valid Repayment

Example:

```text
Valid Repayment:
₹20,000
```

Batch allocation total must equal:

```text
₹20,000
```

not more or less.

---

# 26. Overpayment Is Not Applied to Funding Batch

If payment split:

```text
Repayment:
₹20,000

Overpayment:
₹10,000
```

only ₹20,000 applies to funding batches.

₹10,000 creates separate receivable.

---

# 27. Settlement Source Tracking

Every vendor repayment should identify where payment funding came from.

Possible sources:

```text
CLIENT_COLLECTION

AGENCY_FUND

COMPANY_BANK

VENDOR_RECOVERY_ADJUSTMENT

OTHER_APPROVED_SOURCE
```

---

# 28. Client Collection as Settlement Source

Example:

```text
Client A Payment:
₹20,000
```

used for:

```text
RAM Settlement:
₹20,000
```

System should link both records.

---

# 29. One Client Payment Can Fund Multiple Settlements

Example:

```text
Client A Payment:
₹50,000
```

Used:

```text
RAM:
₹20,000

Shyam:
₹20,000

Agency Pool:
₹10,000
```

Allocation history required.

---

# 30. Multiple Client Collections Can Fund One Settlement

Example:

RAM settlement:

```text
₹30,000
```

Sources:

```text
Client A ₹10,000
Client B ₹10,000
Client C ₹10,000
```

System should support multiple source allocations.

---

# 31. Settlement Source Allocation Table

Conceptually:

```text
Settlement ID
Source Transaction ID
Amount
```

Example:

```text
VST-001
PAY-A001 ₹10,000
PAY-B001 ₹10,000
```

---

# 32. Settlement Payment Proof

Posted settlement should ideally have:

```text
UTR

Bank Reference

Payment Screenshot

Payment Date

Payment Method
```

where applicable.

---

# 33. Missing Proof

If payment posted without required proof:

System may create:

```text
PAYMENT_PROOF_MISSING
```

alert.

Policy configurable.

---

# 34. Duplicate Settlement Prevention

System must prevent accidental duplicate settlement.

Example:

User clicks twice:

```text
RAM ₹20,000
```

Without protection:

```text
₹40,000 recorded
```

Use:

```text
Idempotency Key
```

plus transaction checks.

---

# 35. Duplicate Reference Warning

Same:

```text
UTR
Bank Reference
Payment ID
```

used twice should trigger warning or block depending on payment type.

---

# 36. Pending Settlement Reservation

If settlement created but not yet paid, company may optionally reserve vendor payable.

Example:

```text
Current Payable:
₹50,000

Pending Settlement:
₹20,000
```

Show:

```text
Gross Payable:
₹50,000

Pending Settlement:
₹20,000

Available To Settle:
₹30,000
```

This prevents two users scheduling same payable.

---

# 37. Reservation Does Not Equal Repayment

Pending settlement should not reduce actual posted payable.

Display both separately.

---

# 38. Concurrent Settlement Protection

Two finance users may settle same vendor simultaneously.

Use database locking/transaction logic so:

```text
User A sees ₹20,000 payable
User B sees ₹20,000 payable
```

both cannot independently post ₹20,000 unless valid.

---

# 39. Settlement Transaction Must Be Atomic

Posting should execute as one atomic operation:

```text
Check payable
↓
Lock vendor/batches
↓
Calculate valid repayment
↓
Calculate excess
↓
Create ledger entries
↓
Allocate to funding batches
↓
Create receivable if needed
↓
Commit
```

If any step fails:

```text
ROLLBACK
```

---

# 40. Settlement Cannot Create Negative Payable

Hard rule:

```text
Vendor Payable >= 0
```

Always.

Excess goes to:

```text
Vendor Receivable
```

---

# 41. Settlement Reversal

If posted payment record was wrong:

Do not edit directly.

Create:

```text
SETTLEMENT_REVERSAL
```

---

# 42. Reversal Example

Original:

```text
RAM Repayment:
₹20,000
```

Wrong entry.

Reversal:

```text
+₹20,000 back to Vendor Payable
```

Then correct transaction can be created.

---

# 43. Reversing Overpayment

Original:

```text
Valid Repayment:
₹20,000

Receivable:
₹10,000
```

Full reversal must correctly reverse both effects.

---

# 44. Partial Reversal

If only part was wrong:

Use explicit partial adjustment/reversal according to ledger rules.

Never manually edit posted values.

---

# 45. Failed Payment

Settlement may be approved but bank transfer fails.

Status:

```text
FAILED
```

Vendor payable should remain unchanged if money never actually moved.

---

# 46. Payment Pending

Actual transfer initiated but not confirmed:

```text
PAYMENT_PENDING
```

Final posting rule depends on payment confirmation policy.

---

# 47. Payment Confirmation

Possible confirmation sources:

```text
Manual Finance Confirmation

Bank Reference

Payment Gateway

Future Bank Integration
```

---

# 48. Settlement Date vs Created Date

Store separately:

```text
Created At
Payment Date
Posted At
```

Important for accurate reports.

---

# 49. Backdated Settlement

Finance may need to record historical payment.

Allow:

```text
Payment Date
```

in past.

But:

```text
Created At
```

remains actual system entry time.

Audit user who backdated it.

---

# 50. Settlement Currency

Vendor settlement must specify currency.

If vendor payable:

```text
INR
```

payment should normally be INR.

Cross-currency settlement requires explicit FX logic.

---

# 51. Multi-Currency Settlement

Future support may require:

```text
Original Payable:
USD 1,000

Payment:
INR equivalent
```

Need:

```text
FX Rate

Rate Date

Base Amount

Settlement Amount
```

V1 may avoid cross-currency complexity if not needed.

---

# 52. Vendor Receivable Recovery

If vendor owes company:

```text
₹10,000
```

and returns:

```text
₹4,000
```

System:

```text
Recovered:
₹4,000

Remaining Receivable:
₹6,000
```

---

# 53. Vendor Receivable and New Payable

Possible:

```text
Vendor Receivable:
₹10,000
```

Vendor later provides new funding:

```text
₹50,000
```

Company now may have:

```text
Payable:
₹50,000

Receivable:
₹10,000
```

Do not automatically net unless approved rule exists.

---

# 54. Explicit Netting

If company approves netting:

```text
Vendor Payable:
₹50,000

Vendor Receivable:
₹10,000
```

Adjustment:

```text
₹10,000 offset
```

Result:

```text
Payable:
₹40,000

Receivable:
₹0
```

Must create explicit offset transaction.

---

# 55. No Silent Netting

Dashboard may show optional:

```text
Net Exposure:
₹30,000 payable
```

but underlying:

```text
Payable ₹40,000
Receivable ₹10,000
```

should still remain visible.

---

# 56. Vendor Settlement Priority

If vendor has:

```text
Payable ₹50,000
Receivable ₹10,000
```

business can choose:

```text
First offset receivable
```

or:

```text
Pay full payable separately
```

Policy must be explicit, not assumed by developer.

---

# 57. Settlement Approval Thresholds

Example configurable policy:

```text
₹0 – ₹10,000
Finance can approve

₹10,001 – ₹50,000
Senior Finance

₹50,000+
Admin approval
```

Exact thresholds configuration-based.

---

# 58. Automatic Approval

Low-value normal settlements may be auto-approved if policy allows.

But overpayment should generally bypass normal automatic approval.

---

# 59. Mandatory Approval Cases

Recommended:

```text
Payment > Payable

Manual batch override

Vendor receivable write-off

Backdated large settlement

Settlement reversal

Manual payable adjustment

Cross-currency settlement
```

---

# 60. Vendor Settlement Notes

Notes can capture context:

```text
Client A collection used

Urgent vendor payment

Batch specifically selected

Payment delayed

Vendor confirmation pending
```

Notes do not replace structured fields.

---

# 61. Vendor Confirmation

Optional:

```text
Vendor Confirmed Receipt:
YES / NO / PENDING
```

Useful for reconciliation.

---

# 62. Vendor Receipt Confirmation

Fields:

```text
Confirmed At

Confirmed By

Confirmation Reference

Attachment
```

---

# 63. Settlement Reconciliation

System should reconcile:

```text
Settlement Records

Ledger Entries

Funding Batch Outstanding

Vendor Payable

Bank/Payment Proof
```

Any mismatch creates issue.

---

# 64. Example Settlement Reconciliation

Vendor:

```text
RAM
```

Funding:

```text
₹1,00,000
```

Repayment transactions:

```text
₹20,000 × 5
```

Expected payable:

```text
₹0
```

If dashboard shows:

```text
₹20,000
```

create reconciliation case.

---

# 65. Settlement Aging

Pending settlement may remain unprocessed.

Track:

```text
Created Date

Approval Age

Payment Pending Age
```

Alerts if delayed.

---

# 66. Vendor Payable Aging

Funding batch should track:

```text
Outstanding Since

Days Outstanding
```

Useful for prioritization.

---

# 67. Overpayment Aging

Vendor Receivable:

```text
₹10,000
```

Open for:

```text
30 days
```

should become high-priority alert.

---

# 68. Settlement Dashboard

Vendor detail:

```text
RAM

Current Payable:
₹80,000

Pending Settlements:
₹20,000

Current Receivable:
₹10,000

Open Funding Batches:
2
```

---

# 69. System-Wide Settlement Dashboard

Show:

```text
Total Vendor Payable

Pending Vendor Settlements

Total Vendor Receivable

Overpaid Vendors

Settlements Today

Settlements Awaiting Approval
```

---

# 70. Settlement List

Columns:

```text
Settlement ID

Vendor

Amount

Valid Repayment

Excess

Source

Funding Batch

Status

Payment Date

Created By

Approved By
```

---

# 71. Settlement Detail

Should show:

```text
Vendor

Requested Amount

Current Payable Before

Valid Repayment

Overpayment

Payable After

Receivable After

Source Allocations

Batch Allocations

Reference

Proof

Approval History

Audit Log
```

---

# 72. Example Normal Settlement

Before:

```text
RAM Payable:
₹40,000
```

Payment:

```text
₹20,000
```

After:

```text
Valid Repayment:
₹20,000

Payable:
₹20,000

Receivable:
₹0
```

---

# 73. Example Final Settlement

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

Vendor Funding Status:
SETTLED
```

---

# 74. Example Partial Overpayment

Before:

```text
Payable:
₹20,000
```

Payment:

```text
₹25,000
```

After:

```text
Valid Repayment:
₹20,000

Payable:
₹0

Receivable:
₹5,000
```

---

# 75. Example Full Overpayment

Before:

```text
Payable:
₹0
```

Payment:

```text
₹10,000
```

After:

```text
Valid Repayment:
₹0

Receivable:
₹10,000
```

---

# 76. Example Pending Payment

Vendor payable:

```text
₹50,000
```

Settlement initiated:

```text
₹20,000
```

Status:

```text
PAYMENT_PENDING
```

UI may show:

```text
Gross Payable:
₹50,000

Pending:
₹20,000

Unscheduled:
₹30,000
```

Actual payable only changes after final posting.

---

# 77. Example Multiple Batches

RAM:

```text
RF-001 ₹30,000 outstanding
RF-002 ₹70,000 outstanding
```

Payment:

```text
₹50,000
```

FIFO:

```text
RF-001 settled ₹30,000
RF-002 settled ₹20,000
```

Remaining:

```text
RF-002 ₹50,000
```

---

# 78. Example Client-Funded Settlement

Client F pays:

```text
₹10,000
```

RAM payable:

```text
₹10,000
```

Settlement:

```text
Source:
Client F PAY-101

Destination:
RAM

Valid Repayment:
₹10,000
```

Full trace available.

---

# 79. Example Extra Client-Funded Payment

Client F pays:

```text
₹10,000
```

RAM payable:

```text
₹0
```

Payment still sent to RAM.

System:

```text
Source:
Client F PAY-101

Valid Vendor Repayment:
₹0

Vendor Receivable:
₹10,000
```

This is the exact scenario the system must never forget.

---

# 80. Vendor Settlement Integrity Rules

System must enforce:

```text
1. Every vendor settlement must reference a vendor.

2. Every settlement must have a known amount and currency.

3. Vendor payable cannot become negative.

4. Payment beyond payable becomes vendor receivable.

5. Payable and receivable must remain separately visible.

6. Every valid repayment must reduce a known payable.

7. Every valid repayment should map to funding batches.

8. Funding batch allocation must equal valid repayment amount.

9. Pending payment must not silently reduce posted payable.

10. Duplicate settlements must be prevented.

11. Posted settlements cannot be silently edited.

12. Wrong settlements require reversal/correction.

13. Vendor overpayment must remain open until recovered or adjusted.

14. Payable-receivable netting must be explicit.

15. High-risk settlement actions require approval.

16. Every settlement must remain auditable from source to destination.
```

---

# 81. Settlement Golden Rule

> **A vendor payment is not automatically a vendor repayment. It becomes a valid repayment only to the extent that an actual vendor payable exists. Any amount beyond that payable must remain visible as a recoverable Vendor Receivable until explicitly recovered, offset or otherwise authorized.**
