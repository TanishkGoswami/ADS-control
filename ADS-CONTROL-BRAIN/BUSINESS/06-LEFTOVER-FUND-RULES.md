# Leftover Fund Rules

## Overview

Leftover Fund wo amount hai jo kisi client/job/campaign ke liye allocate kiya gaya tha, lekin actual spend me consume nahi hua.

Example:

```text
Allocated:
₹1,000

Actual Spend:
₹700

Leftover:
₹300
```

Ye ₹300 automatically free company money nahi banega.

System ka default rule:

> **Unused amount apne original owner ke saath associated rahega jab tak valid business action uska final treatment define na kare.**

---

# 1. Leftover Fund Definition

Basic formula:

```text
Leftover Fund
=
Allocated Amount
-
Recognized Valid Spend
-
Other Valid Charges
```

Example:

```text
Allocation:
₹10,000

Spend:
₹8,500

Leftover:
₹1,500
```

---

# 2. Leftover vs Free Fund

Important distinction:

```text
Leftover Client Fund
≠
Agency Free Fund
```

Client ka unused balance company ke paas physically pada ho sakta hai, lekin ownership automatically company ki nahi hoti.

---

# 3. Default Ownership

Agar fund originally:

```text
Client A
```

ka tha, to unused portion bhi default:

```text
Owner:
Client A
```

rahega.

Example:

```text
Client A Allocation:
₹5,000

Spend:
₹4,000

Unused:
₹1,000
```

Default:

```text
Owner:
Client A

Status:
UNUSED
```

---

# 4. Leftover Creation Event

Campaign/job complete hone par system automatically calculate kare:

```text
allocated_amount
-
recognized_spend
=
remaining_amount
```

If remaining amount > 0:

```text
LEFTOVER_FUND_CREATED
```

event/status create hoga.

---

# 5. Leftover Must Have Context

Every leftover record must include:

```text
Client

Client Job

Original Payment / Fund Lot

Ad Account

Original Allocation

Actual Spend

Remaining Amount

Created Date

Current Owner

Current Location

Current Status
```

---

# 6. Possible Leftover Statuses

Recommended:

```text
UNRESOLVED

IN_CLIENT_WALLET

ALLOCATED_TO_NEXT_JOB

REFUND_PENDING

REFUNDED

TRANSFER_PENDING

TRANSFERRED

CONVERTED_TO_AGENCY

LOCKED

ADJUSTED
```

---

# 7. Unresolved Leftover

Campaign complete hua but user ne decide nahi kiya ki leftover ka kya karna hai.

Example:

```text
Client A
Unused ₹2,500

Status:
UNRESOLVED
```

Ye amount dashboard par clearly visible rehna chahiye.

---

# 8. Leftover Should Not Disappear on Job Completion

Incorrect:

```text
Job Completed
→ Remaining amount ignored
```

Correct:

```text
Job Completed
→ Spend finalized
→ Leftover calculated
→ Resolution required
```

---

# 9. Option 1: Return to Client Wallet

Recommended default flow:

```text
Job Leftover
↓
Client Wallet
```

Example:

```text
JOB-001 Leftover:
₹3,000
```

Result:

```text
Client A Wallet:
+₹3,000
```

Owner unchanged.

---

# 10. Wallet Return Transaction

Transaction should include:

```text
Source:
JOB-001 Allocation

Destination:
Client A Wallet

Amount:
₹3,000

Type:
LEFTOVER_RETURN_TO_WALLET
```

---

# 11. Option 2: Use in Same Client's Next Job

Example:

```text
Client A Wallet:
₹3,000
```

New job:

```text
JOB-002
```

Allocation:

```text
₹3,000
```

Lineage:

```text
Original Client Payment
↓
JOB-001
↓
Unused ₹3,000
↓
Client Wallet
↓
JOB-002
```

---

# 12. Same Client Reuse Is Not Ownership Change

If Client A ka leftover Client A ke next campaign me use hota hai:

```text
Owner:
Client A
```

same rehta hai.

Only purpose changes.

---

# 13. Option 3: Refund to Client

Example:

```text
Unused:
₹3,000
```

Refund create:

```text
REFUND_PENDING
₹3,000
```

After payment:

```text
REFUNDED
₹3,000
```

---

# 14. Refund Requirements

Refund record:

```text
Client

Amount

Reason

Payment Method

Reference / UTR

Processed By

Approved By

Proof

Date
```

---

# 15. Option 4: Convert to Agency Fund

Ye sensitive ownership change hai.

Flow:

```text
Client-Owned Leftover
↓
Approved Ownership Change
↓
Agency Fund
```

This must not happen automatically.

---

# 16. Agency Conversion Requirements

Minimum:

```text
Client

Amount

Original Job

Reason

Business Basis

Created By

Approved By

Date
```

Optional:

```text
Client Agreement Reference
```

---

# 17. Option 5: Cross-Client Reallocation

Example:

```text
Client A Leftover:
₹300
```

Need to use for:

```text
Client B
```

Direct silent movement prohibited.

---

# 18. Preferred Cross-Client Flow

Recommended:

```text
Client A
↓
Approved Ownership Resolution
↓
Agency / Transfer Pool
↓
Client B
```

This creates explicit ownership change.

---

# 19. Cross-Client Reallocation Record

Must include:

```text
Source Client

Destination Client

Amount

Reason

Approval

Original Job

Destination Job

Created By

Date
```

---

# 20. Original Lineage Must Remain

Even after Client B gets ₹300, system should be able to answer:

```text
Original Source:
Client A PAY-001

Original Job:
JOB-001

Unused:
₹300

Transferred:
Client B

Destination Job:
JOB-010
```

---

# 21. Option 6: Locked Leftover

Scenario:

```text
Client A Allocation:
₹5,000

Spend:
₹3,000

Remaining:
₹2,000
```

Ad Account gets restricted before leftover can be moved.

Status:

```text
LOCKED
```

Owner remains:

```text
Client A
```

---

# 22. Locked Leftover Is Not Wallet Balance

Example:

```text
Client Wallet:
₹0

Locked:
₹2,000
```

Do not show:

```text
Available:
₹2,000
```

until actually recoverable.

---

# 23. Leftover on Multiple Ad Accounts

Example:

Client job used:

```text
AD1
AD2
```

Leftovers:

```text
AD1 ₹700
AD2 ₹300
```

Total client leftover:

```text
₹1,000
```

But locations separately preserved.

---

# 24. Leftover Aggregation

Client summary:

```text
Total Leftover:
₹5,000
```

Drill-down:

```text
JOB-001 / AD1 ₹2,000
JOB-002 / AD3 ₹1,500
JOB-003 / Wallet ₹1,500
```

---

# 25. Leftover Aging

Unused amount long time unresolved reh sakta hai.

Track:

```text
Created Date

Age in Days
```

Example:

```text
Client A
Unused ₹5,000

Open for:
35 days
```

---

# 26. Aging Alerts

Example thresholds:

```text
7 Days → Info

15 Days → Warning

30 Days → Critical Review
```

Configurable.

---

# 27. Leftover Resolution Deadline

Optional business rule:

```text
Every completed job leftover must be resolved within X days.
```

Useful for finance discipline.

---

# 28. Leftover Must Not Be Counted Twice

Example:

JOB leftover:

```text
₹3,000
```

Once moved to Client Wallet:

```text
Job leftover open balance = ₹0
Client Wallet = +₹3,000
```

Do not keep both as active available balances.

---

# 29. Leftover vs Ad Account Balance

Ad Account me ₹10,000 balance ho sakta hai.

Not all of that is leftover.

Example:

```text
Client A leftover ₹2,000
Client B active allocation ₹5,000
Agency fund ₹3,000
```

System should distinguish classifications.

---

# 30. Partial Leftover Resolution

Example:

```text
Unused:
₹5,000
```

Actions:

```text
₹2,000 refunded

₹3,000 retained in Client Wallet
```

System support multiple resolution transactions.

---

# 31. Partial Cross-Client Transfer

Example:

```text
Unused:
₹5,000
```

Transfer:

```text
₹1,000 → Client B
```

Remaining:

```text
₹4,000
```

still belongs to Client A until resolved.

---

# 32. Partial Agency Conversion

Example:

```text
Unused:
₹3,000
```

Approved:

```text
₹1,000 → Agency
```

Remaining:

```text
₹2,000 → Client Wallet
```

Both transactions separate.

---

# 33. Leftover Source Lots

If client made multiple payments:

```text
PAY-001 ₹5,000
PAY-002 ₹5,000
```

Campaign uses ₹7,000.

Remaining ₹3,000 can preserve lot lineage.

If FIFO:

```text
PAY-001 fully consumed
PAY-002 ₹2,000 consumed
PAY-002 ₹3,000 remaining
```

---

# 34. FIFO Is Configurable

Fund lot consumption policy may be:

```text
FIFO

Specific Lot

Manual Allocation
```

Default should be deterministic.

---

# 35. Leftover After Overspend

Example:

```text
Allocated:
₹10,000

Spend:
₹10,500
```

There is no leftover.

Instead:

```text
Funding Gap:
₹500
```

Do not represent as:

```text
Leftover -₹500
```

---

# 36. Leftover After Refund/Credit

Example:

```text
Spend:
₹10,000
```

Later Meta credits:

```text
₹500
```

System may create new recoverable/available amount.

This should be separate from original leftover calculation until reconciliation classifies it.

---

# 37. Leftover With Tax/Fees

If business model includes additional recognized charges:

```text
Allocation:
₹10,000

Ad Spend:
₹9,000

Valid Charges:
₹500

Leftover:
₹500
```

Formula should use configured recognized cost types.

---

# 38. Leftover and Service Fee

Service fee is not leftover ad fund.

Example:

```text
Client Pays ₹12,000

Ads Budget ₹10,000
Service Fee ₹2,000
```

If ads spend ₹8,000:

```text
Unused Ads Fund:
₹2,000
```

Service fee ₹2,000 remains separate.

---

# 39. Campaign Completion Rule

Before campaign/job financial settlement:

```text
Recognized Spend finalized

All mapped Meta spend synced

Leftover calculated

Locked amount checked

Refund/transfer decision recorded
```

---

# 40. Job Financial Closure

Job can be financially settled when:

```text
Open Leftover = ₹0

Refund Pending = ₹0

Unresolved Locked Allocation = handled appropriately

Unattributed Spend = ₹0

Reconciliation Issue = resolved
```

---

# 41. Client Closure Check

Client cannot be financially clean if:

```text
Unused Balance > ₹0

Locked Balance > ₹0

Refund Pending > ₹0

Open Transfers > ₹0
```

Client can operationally be inactive, but financial closure remains pending.

---

# 42. Agency Pool Must Exclude Unresolved Leftovers

Agency available balance formula must not include:

```text
Client Unresolved Leftovers
```

until valid ownership transfer occurs.

---

# 43. Cross-Client Use Without Ownership Change Is Invalid

Invalid:

```text
Client A leftover ₹300
↓
Spend for Client B
```

without formal transaction.

System should flag such case as:

```text
OWNERSHIP_MISMATCH
```

---

# 44. Reconciliation Example

Client A:

```text
Received:
₹10,000

Spend:
₹7,000

Refunded:
₹1,000

Wallet:
₹2,000
```

Equation:

```text
₹10,000
=
₹7,000
+
₹1,000
+
₹2,000
```

Valid.

---

# 45. Reconciliation Mismatch Example

Client A:

```text
Received:
₹10,000

Spend:
₹7,000

Wallet:
₹2,500
```

Tracked:

```text
₹9,500
```

Difference:

```text
₹500
```

Create:

```text
CLIENT_FUND_RECONCILIATION_MISMATCH
```

---

# 46. Leftover UI Card

Example:

```text
CLIENT A

Unused Funds
₹5,300

In Wallet
₹3,000

Locked
₹1,500

Refund Pending
₹800
```

---

# 47. Leftover List

Columns:

```text
Client

Job

Ad Account

Original Allocation

Spend

Leftover

Location

Status

Age

Action Required
```

---

# 48. Leftover Detail View

Should show:

```text
Original Payment

Fund Lot

Client

Job

Ad Account

Allocation

Spend History

Leftover Amount

Current Location

Current Owner

Resolution History

Audit Log
```

---

# 49. Resolution Actions

UI actions:

```text
Return to Client Wallet

Allocate to Same Client Job

Initiate Refund

Request Agency Conversion

Request Cross-Client Transfer

Mark Locked

Create Adjustment
```

Permissions apply.

---

# 50. Permissions

Example:

```text
Ads Manager:
View leftover
Request reallocation

Finance:
Move to wallet
Initiate refund

Admin:
Approve ownership changes
Approve cross-client transfer
Approve write-off
```

---

# 51. Approval Requirement

Strong approval required for:

```text
Client → Agency

Client A → Client B

Write-Off

Manual Adjustment
```

Normal same-client wallet return may not need approval depending on policy.

---

# 52. Audit Events

Track:

```text
Leftover Created

Returned to Wallet

Reallocated

Refund Requested

Refund Completed

Ownership Changed

Locked

Unlocked

Adjusted

Written Off
```

---

# 53. Deletion Rule

Leftover record with financial history cannot be hard deleted.

If created incorrectly:

```text
Reverse / Cancel according to transaction state.
```

---

# 54. Historical Reporting

System should answer:

> 1 September ko Client A ka unresolved leftover kitna tha?

Need point-in-time history.

---

# 55. Leftover Report

Possible summary:

```text
Total Client Leftover:
₹2,40,000

Available in Wallet:
₹1,20,000

Locked:
₹60,000

Refund Pending:
₹30,000

Unresolved:
₹30,000
```

---

# 56. Aging Report

Example:

```text
0–7 Days:
₹1,00,000

8–15 Days:
₹50,000

16–30 Days:
₹40,000

31+ Days:
₹50,000
```

---

# 57. High-Risk Leftover Cases

System should highlight:

```text
Large unresolved leftover

Old unresolved leftover

Cross-client transfer

Locked leftover

Refund pending too long

Ownership mismatch

Spend greater than allocation

Unattributed spend
```

---

# 58. Leftover State Machine

Simplified:

```text
CREATED
  ↓
UNRESOLVED
  ├──→ CLIENT_WALLET
  ├──→ NEXT_JOB
  ├──→ REFUND_PENDING → REFUNDED
  ├──→ TRANSFER_PENDING → TRANSFERRED
  ├──→ AGENCY_CONVERSION
  ├──→ LOCKED
  └──→ ADJUSTED
```

---

# 59. Invalid State Changes

Examples:

```text
REFUNDED → AVAILABLE
```

without reversal/new receipt.

```text
TRANSFERRED → CLIENT_WALLET
```

without reverse transfer.

```text
SPENT → LEFTOVER
```

without spend correction/reversal.

---

# 60. Opening Leftover Migration

Existing old balances may be imported as:

```text
OPENING_LEFTOVER_BALANCE
```

with:

```text
Client

Amount

Approximate/Verified Source

As-of Date

Current Location

Confidence Level

Notes
```

---

# 61. Verified vs Unverified

Existing historical records may be incomplete.

Use:

```text
VERIFIED

PARTIALLY_VERIFIED

UNVERIFIED
```

so system doesn't present uncertain legacy data as exact fact.

---

# 62. Leftover Integrity Rules

System must enforce:

```text
1. Leftover is calculated from allocation and valid spend.

2. Client leftover remains client-owned by default.

3. Leftover cannot silently become agency money.

4. Cross-client reuse requires explicit transfer.

5. Locked leftover remains traceable.

6. Job completion does not delete leftover.

7. One amount cannot be active in two locations simultaneously.

8. Partial resolution must leave exact residual balance.

9. Refund, transfer and ownership changes require transactions.

10. Posted resolutions cannot be silently edited.

11. Unresolved leftovers must remain visible.

12. Old leftovers should trigger aging alerts.

13. Every leftover must preserve original source lineage.
```

---

# 63. Golden Rule

> **A leftover amount is not “extra money”; it is unresolved money with an existing owner and history. Until an explicit transaction resolves its ownership and destination, it must remain visible, traceable and separate from agency free funds.**
