# Vendor Flow

## Overview

Vendor Flow system ka financial control layer hai jo company aur external funding vendors ke beech complete money movement ko track karta hai.

Vendor company ko large funding/credit provide kar sakta hai, jise company advertising operations me use karti hai aur later client collections ya company funds se repay karti hai.

Core lifecycle:

```text
Vendor Created
      ↓
Funding Received
      ↓
Funding Batch Created
      ↓
Company Uses Funds
      ↓
Client Collections Arrive
      ↓
Vendor Repayment
      ↓
Outstanding Reduced
      ↓
Settled / Overpaid / Receivable
```

Goal:

> Vendor ke saath har rupee ka complete payable, repayment aur receivable history traceable rehna chahiye.

---

# 1. Vendor Creation

New vendor system me create hoga.

Minimum vendor record:

```text
Vendor ID

Vendor Name

Company Name

Phone

Email

Status

Payment Details

Notes

Created Date

Created By
```

Example:

```text
Vendor ID:
VEN-0001

Name:
RAM

Status:
ACTIVE
```

---

# 2. Vendor Status

Possible vendor statuses:

```text
ACTIVE

INACTIVE

ON_HOLD

BLOCKED

CLOSED
```

Vendor close hone par historical funding aur settlement records preserve honge.

---

# 3. Vendor Funding

Vendor company ko fund provide karta hai.

Example:

```text
Vendor:
RAM

Funding:
₹1,00,000
```

System is transaction ko:

```text
VENDOR_FUNDING
```

ke roop me record karega.

---

# 4. Funding Batch

Every vendor funding separate batch hogi.

Example:

```text
RAM-RF-001
₹1,00,000

RAM-RF-002
₹2,00,000
```

Funding batches mix nahi karni.

---

# 5. Why Funding Batches Are Required

Funding batch se system ko pata rahega:

```text
Funding kab aayi?

Kitni aayi?

Kis reference se aayi?

Kitna repay hua?

Kitna outstanding hai?

Old batch fully settle hui ya nahi?
```

Without batches, vendor history unclear ho sakti hai.

---

# 6. Funding Batch Fields

Recommended:

```text
Funding Batch ID

Vendor ID

Amount

Received Date

Payment Method

Reference / UTR

Purpose

Received By

Proof Attachment

Status

Outstanding Amount
```

---

# 7. Funding Batch Status

Possible:

```text
OPEN

PARTIALLY_SETTLED

SETTLED

ADJUSTED

CANCELLED
```

---

# 8. Vendor Payable

Vendor Funding create hone par company ki liability create hoti hai.

Example:

```text
RAM Funding:
₹1,00,000
```

Then:

```text
Vendor Payable:
₹1,00,000
```

Meaning:

> Company owes Ram ₹1,00,000.

---

# 9. Vendor Funding Is Not Revenue

Vendor se received amount company revenue nahi hai.

Ye:

```text
Liability / Funding Obligation
```

hai.

Important distinction:

```text
Vendor Funding ≠ Company Income
```

---

# 10. Vendor Funding Usage

Vendor funds company advertising operations me use ho sakte hain.

Example:

```text
RAM Funding
₹1,00,000
      ↓
Company Financial Pool
      ↓
Meta Ad Accounts
      ↓
Client Campaigns
```

System ko origin traceability preserve karni chahiye where required.

---

# 11. Vendor Funding Source Trace

Example:

```text
AD1 Funding:
₹20,000

Source:
RAM-RF-001
```

Optional advanced tracking:

```text
Funding Lot:
RAM-RF-001-LOT-01
```

---

# 12. Client Collections and Vendor Repayment

Vendor repayment client collections ke through ho sakti hai.

Example:

```text
RAM Payable:
₹1,00,000
```

Client collections:

```text
Client A:
₹20,000

Client B:
₹20,000

Client C:
₹20,000

Client D:
₹20,000

Client E:
₹20,000
```

Vendor repayment:

```text
₹1,00,000
```

---

# 13. Repayment Transaction

Every vendor repayment separate transaction hogi.

Fields:

```text
Settlement ID

Vendor ID

Funding Batch

Amount

Payment Date

Payment Method

Payment Reference

Funding Source

Created By

Approved By

Proof Attachment
```

---

# 14. Vendor Repayment Validation

Before repayment:

```text
Current Payable
```

check hoga.

Example:

```text
RAM Payable:
₹40,000

Requested Payment:
₹20,000
```

Valid.

After payment:

```text
RAM Payable:
₹20,000
```

---

# 15. Partial Vendor Repayment

Vendor repayment ek baar me complete hona zaroori nahi.

Example:

```text
Funding:
₹1,00,000
```

Repayments:

```text
₹20,000
₹15,000
₹25,000
```

Total:

```text
₹60,000
```

Remaining:

```text
₹40,000
```

Status:

```text
PARTIALLY_SETTLED
```

---

# 16. Full Vendor Settlement

When:

```text
Vendor Payable = ₹0
```

vendor funding obligation:

```text
SETTLED
```

ho sakti hai.

Example:

```text
Funding:
₹1,00,000

Repaid:
₹1,00,000

Outstanding:
₹0
```

---

# 17. Vendor Overpayment

Critical scenario:

```text
RAM Payable:
₹0

New Payment:
₹10,000
```

This is not valid repayment.

System classify kare:

```text
Vendor Overpayment:
₹10,000
```

---

# 18. Vendor Receivable

Vendor overpayment se:

```text
Vendor Receivable
```

create hoga.

Example:

```text
RAM Payable:
₹0

RAM Receivable:
₹10,000
```

Meaning:

> Ram owes company ₹10,000.

---

# 19. Payable and Receivable Must Be Separate

Never store:

```text
Vendor Balance = -₹10,000
```

as only representation.

UI me explicit:

```text
We Owe Vendor:
₹0

Vendor Owes Us:
₹10,000
```

show karna better hai.

---

# 20. Overpayment Split Logic

Example:

```text
Vendor Payable:
₹20,000

Payment Entered:
₹30,000
```

System split kare:

```text
Valid Repayment:
₹20,000

Excess:
₹10,000
```

Result:

```text
Vendor Payable:
₹0

Vendor Receivable:
₹10,000
```

---

# 21. Overpayment Warning

Payment confirmation se pehle UI show kare:

```text
Outstanding:
₹20,000

You are paying:
₹30,000

Excess:
₹10,000

This will create a Vendor Receivable.
```

---

# 22. Overpayment Approval

High-risk financial action hone ki wajah se excess vendor payment ideally approval require kare.

Possible flow:

```text
Settlement Created
      ↓
Excess Detected
      ↓
PENDING APPROVAL
      ↓
Finance/Admin Approval
      ↓
POSTED
```

---

# 23. Vendor Receivable Status

Possible:

```text
OPEN

PARTIALLY_RECOVERED

RECOVERED

ADJUSTED

WRITTEN_OFF
```

---

# 24. Vendor Receivable Recovery

Vendor company ko amount return karta hai.

Example:

```text
RAM Receivable:
₹10,000
```

Ram returns:

```text
₹10,000
```

System:

```text
Vendor Receivable:
₹0
```

Status:

```text
RECOVERED
```

---

# 25. Partial Receivable Recovery

Example:

```text
Receivable:
₹10,000

Returned:
₹4,000
```

Remaining:

```text
₹6,000
```

Status:

```text
PARTIALLY_RECOVERED
```

---

# 26. Future Funding Adjustment

Example:

```text
RAM Receivable:
₹10,000
```

Ram provides new funding:

```text
₹2,00,000
```

Approved adjustment:

```text
New Funding:
₹2,00,000

Less Old Receivable:
₹10,000

Net New Payable:
₹1,90,000
```

---

# 27. Adjustment Must Be Explicit

Incorrect:

```text
New Funding:
₹1,90,000
```

without explanation.

Correct:

```text
Funding:
₹2,00,000

Receivable Adjustment:
₹10,000

Net Liability:
₹1,90,000
```

Full history preserved.

---

# 28. Vendor Funding Batch Settlement Order

If multiple open funding batches exist, system ko settlement allocation policy define karni hogi.

Recommended default:

```text
FIFO
First In, First Out
```

Example:

```text
RF-001:
₹50,000 outstanding

RF-002:
₹1,00,000 outstanding
```

Payment:

```text
₹70,000
```

Allocation:

```text
RF-001:
₹50,000 settled

RF-002:
₹20,000 settled
```

---

# 29. Manual Batch Allocation

Finance user ko specific funding batch choose karne ka option ho sakta hai where business requires.

But manual selection:

```text
reason
```

record kare.

---

# 30. Vendor Statement

Vendor ke liye chronological statement generate hona chahiye.

Example:

```text
01 Sep
Funding Received
₹1,00,000

03 Sep
Repayment
₹20,000

05 Sep
Repayment
₹20,000

07 Sep
Repayment
₹20,000

09 Sep
Repayment
₹20,000

11 Sep
Repayment
₹20,000

12 Sep
Extra Payment
₹10,000
```

Final:

```text
Payable:
₹0

Receivable:
₹10,000
```

---

# 31. Vendor Dashboard

Vendor detail should show:

```text
Total Funding Received

Total Valid Repaid

Current Payable

Current Receivable

Open Funding Batches

Settled Batches

Overpayments

Recoveries

Last Activity
```

---

# 32. Example Vendor Dashboard

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

Open Batches:
1

Settled Batches:
1
```

Netting internally possible hai, but UI should still preserve separate payable and receivable.

---

# 33. Vendor Payable Aging

Useful report:

```text
0–7 Days

8–15 Days

16–30 Days

31+ Days
```

Example:

```text
RAM:
₹80,000 outstanding for 12 days
```

---

# 34. Vendor Receivable Aging

Similarly:

```text
RAM Receivable:
₹10,000

Open Since:
12 Sep 2026
```

Aging helps prevent forgetting.

---

# 35. Vendor Alerts

Possible alerts:

```text
VENDOR_PAYABLE_DUE

VENDOR_LONG_OUTSTANDING

VENDOR_OVERPAYMENT

VENDOR_RECEIVABLE_OPEN

VENDOR_RECEIVABLE_AGED

VENDOR_PAYMENT_EXCEEDS_PAYABLE

VENDOR_BATCH_UNRESOLVED
```

---

# 36. Vendor Payment Source

Every repayment should ideally identify source.

Possible:

```text
Client Collection

Agency Fund

Company Bank

Recovered Amount

Other Approved Source
```

Example:

```text
Payment to RAM:
₹20,000

Source:
Client A Collection
```

---

# 37. Client-to-Vendor Link

If client collection directly vendor settlement me used hui:

```text
Client A Payment
      ↓
Vendor Settlement RAM
```

link preserve hona chahiye.

This helps answer:

> Ram ka repayment kis client ke paise se hua?

---

# 38. Settlement Allocation Record

Example:

```text
Settlement:
STL-001

Vendor:
RAM

Amount:
₹20,000

Source:
Client A Payment PAY-001

Applied To:
RAM-RF-001
```

---

# 39. Vendor Funding To Ad Account Link

Where required:

```text
RAM-RF-001
      ↓
₹20,000
      ↓
AD1
```

recorded allocation ho sakti hai.

This helps answer:

> AD1 me jo ₹20k add hua tha, kis vendor funding se aaya tha?

---

# 40. Vendor Money Ownership

Vendor funding receive hone ke baad physical control company ke paas ho sakta hai, but financial obligation vendor ke favour me remain karti hai.

Therefore:

```text
Location:
Company / Ad Account

Liability:
Vendor RAM
```

These are separate concepts.

---

# 41. Vendor Funding and Client Ownership Can Coexist

Example:

Vendor RAM se company ko funding mili.

Us funding se Client A campaign run hua.

Operational lineage:

```text
RAM Funding
↓
Company
↓
AD1
↓
Client A Campaign
```

But system ko clearly differentiate karna hoga:

```text
Funding Source:
RAM

Business Purpose:
Client A

Vendor Payable:
still exists until repaid
```

---

# 42. Vendor Settlement Does Not Depend On Same Physical Money

Important:

Vendor repayment necessarily wahi exact banknotes/funds nahi hone chahiye jo vendor ne diye the.

Accounting relationship:

```text
Vendor Funding creates Liability
```

Later valid payment:

```text
reduces Liability
```

Source may be:

```text
Client Collection
Agency Fund
Company Fund
```

---

# 43. Vendor Funding Proof

Funding batch should support attachment:

```text
Bank Screenshot

UPI Screenshot

Statement

Receipt

Other Proof
```

---

# 44. Vendor Repayment Proof

Settlement should support:

```text
UTR

Payment Screenshot

Bank Reference

Payment Date
```

---

# 45. Vendor Note History

Vendor ke special agreements ya context ke liye notes:

```text
Funding terms

Expected settlement pattern

Special adjustment

Payment issue
```

Notes financial transaction replace nahi karenge.

---

# 46. Vendor Financial Closure

Vendor close karne se pehle check:

```text
Payable = ₹0?

Receivable = ₹0?

Open Funding Batches = 0?

Pending Settlement = 0?

Unresolved Adjustments = 0?

Reconciliation Issues = 0?
```

If not:

```text
FINANCIAL_CLOSURE_PENDING
```

---

# 47. Vendor Deletion Rule

Financial history wala vendor hard delete nahi hoga.

Use:

```text
INACTIVE

CLOSED
```

Historical transactions remain.

---

# 48. Vendor Merge Protection

Same vendor duplicate create ho sakta hai.

Possible duplicate indicators:

```text
Name

Phone

Bank Reference

Company Name
```

System warning de sakta hai.

Automatic merge financial records ke saath dangerous hai.

Admin-only controlled merge required.

---

# 49. Vendor Internal ID

Stable ID:

```text
VEN-0001
```

Name change hone par history break nahi hogi.

---

# 50. Funding Batch ID

Recommended:

```text
VFB-000001
```

Human-readable reference:

```text
RAM-RF-001
```

Both ho sakte hain.

---

# 51. Vendor Settlement ID

Example:

```text
VST-000001
```

---

# 52. Vendor Receivable ID

Example:

```text
VRC-000001
```

Useful for recovery tracking.

---

# 53. Vendor Reconciliation

Vendor reconciliation compare kare:

```text
Total Funding
```

against:

```text
Valid Repayments
+
Current Payable
+
Approved Adjustments
```

Receivable side separately:

```text
Total Overpayment
=
Recovered
+
Open Receivable
+
Approved Write-Off
```

---

# 54. Vendor Payable Formula

Conceptually:

```text
Vendor Payable
=
Funding Received
-
Valid Repayments
-
Approved Liability Adjustments
```

Never include overpayment as negative payable without preserving receivable.

---

# 55. Vendor Receivable Formula

Conceptually:

```text
Vendor Receivable
=
Vendor Overpayments
+
Other Vendor Recoverables
-
Recoveries
-
Approved Receivable Adjustments
```

---

# 56. Example Complete Vendor Flow

Ram gives:

```text
₹1,00,000
```

System:

```text
Funding Batch:
RAM-RF-001

Payable:
₹1,00,000
```

Then:

```text
Client A Collection → Ram ₹20,000
```

Payable:

```text
₹80,000
```

Then four more valid ₹20,000 repayments.

Result:

```text
Payable:
₹0

Batch:
SETTLED
```

Then extra:

```text
₹10,000
```

Ram ko transferred.

System:

```text
Valid Repayment:
₹0

Vendor Overpayment:
₹10,000

Vendor Receivable:
₹10,000
```

---

# 57. Example Future Funding Adjustment

Later Ram gives:

```text
₹2,00,000
```

Current receivable:

```text
₹10,000
```

Approved adjustment:

```text
Gross New Funding:
₹2,00,000

Receivable Offset:
₹10,000

Net Vendor Payable Created:
₹1,90,000
```

Old receivable:

```text
₹0
```

New batch remains fully documented.

---

# 58. Example Partial Overpayment

Vendor payable:

```text
₹30,000
```

Payment:

```text
₹35,000
```

System:

```text
Vendor Repayment:
₹30,000

Vendor Receivable:
₹5,000
```

Not:

```text
Vendor Payable = -₹5,000
```

only.

---

# 59. Example Duplicate Payment Risk

Settlement request:

```text
RAM
₹20,000
```

User clicks twice.

System should use idempotency and prevent:

```text
₹40,000
```

ledger posting.

---

# 60. Example Payment Pending

Settlement created:

```text
₹20,000
```

but actual bank transfer not completed.

Transaction should remain:

```text
PENDING
```

not reduce payable until valid posting rule is satisfied.

---

# 61. Vendor Transaction Status

Possible:

```text
DRAFT

PENDING_APPROVAL

APPROVED

POSTED

FAILED

CANCELLED

REVERSED
```

---

# 62. Wrong Vendor Payment Entry

Suppose system me wrong payment entry:

```text
₹20,000
```

posted hui.

Actual:

```text
₹2,000
```

Do not edit old posted transaction.

Use:

```text
Original:
₹20,000

Reversal:
₹20,000

Correct:
₹2,000
```

---

# 63. Vendor Reversal

Reversal linked hona chahiye:

```text
Original Transaction ID

Reversal Transaction ID

Reason

Approved By
```

---

# 64. Write-Off

Agar vendor receivable recover nahi ho sakta aur management formally write-off karti hai:

```text
Vendor Receivable:
₹10,000
```

then:

```text
Write-Off:
₹10,000
```

requires:

```text
Reason

Approval

Audit Log
```

Silent deletion not allowed.

---

# 65. Vendor Funding Cancellation

Funding record wrong create hua but money actually receive nahi hua.

If still draft:

```text
CANCEL
```

allowed.

If posted:

```text
REVERSAL
```

required.

---

# 66. Vendor Detail Tabs

Recommended:

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

Audit Log
```

---

# 67. Vendor List Columns

Recommended:

```text
Vendor Name

Status

Total Funding

Current Payable

Current Receivable

Open Batches

Last Payment

Last Activity
```

---

# 68. Vendor Dashboard Summary

System-wide:

```text
Total Vendors

Total Vendor Funding

Total Vendor Payable

Total Vendor Receivable

Open Funding Batches

Overpaid Vendors

Settled Vendors
```

---

# 69. Vendor Risk Indicators

Possible flags:

```text
HIGH_OUTSTANDING

LONG_AGED_PAYABLE

OPEN_RECEIVABLE

REPEATED_OVERPAYMENT

MISSING_PAYMENT_PROOF

RECONCILIATION_MISMATCH
```

---

# 70. Vendor Role Permissions

Example:

```text
Ads Manager:
View limited vendor allocation info

Finance:
Create funding and settlements

Admin:
Approve overpayments, write-offs and reversals

Viewer:
Read-only
```

---

# 71. Vendor Audit Requirements

Audit events:

```text
Vendor Created

Funding Added

Funding Batch Modified Before Posting

Settlement Created

Settlement Approved

Settlement Posted

Overpayment Detected

Receivable Created

Receivable Recovered

Receivable Adjusted

Write-Off Approved

Transaction Reversed

Vendor Closed
```

---

# 72. Vendor Data Integrity Rules

System must enforce:

```text
1. Every vendor funding must create a traceable obligation.

2. Every funding event must belong to a funding batch.

3. Funding batches must not silently merge.

4. Vendor payable and receivable are separate.

5. Repayment cannot reduce payable below zero.

6. Excess payment becomes receivable.

7. Every repayment must have a source and reference.

8. Every receivable must remain open until resolved.

9. Future funding adjustments must be explicit.

10. Posted transactions cannot be silently edited.

11. Vendor financial history must survive vendor closure.

12. Duplicate payment posting must be prevented.

13. Every high-risk vendor adjustment must be auditable.
```

---

# 73. Vendor Flow Golden Rule

> **Every vendor funding must create a clearly traceable obligation, every repayment must reduce a known payable, and any payment beyond that payable must remain visible as a vendor receivable until it is recovered, adjusted or formally resolved. No vendor amount should ever disappear because the team forgot that it existed.**
