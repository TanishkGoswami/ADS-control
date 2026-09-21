# Fund Flow

## Overview

Fund Flow document system ke complete money movement model ko define karta hai.

System ka core principle:

> **Money can never disappear. It can only change source, owner, purpose, location or status.**

Har tracked amount ke liye system ideally answer kar sake:

```text id="ff001"
SOURCE
Paisa kahan se aaya?

OWNER
Paisa kis ka hai?

PURPOSE
Paisa kis kaam ke liye hai?

LOCATION
Paisa currently kahan hai?

STATUS
Paisa available, allocated, spent, locked, refunded ya transferred hai?

HISTORY
Paisa yahan tak kaise pahucha?
```

---

# 1. Fund Sources

System me paisa multiple sources se aa sakta hai.

Primary sources:

```text id="ff002"
CLIENT_PAYMENT

VENDOR_FUNDING

AGENCY_FUNDING

META_REFUND

VENDOR_RECOVERY

OTHER_APPROVED_SOURCE
```

Har incoming amount ka source mandatory hona chahiye.

---

# 2. Client Payment as Fund Source

Example:

```text id="ff003"
Client A
↓
₹20,000
↓
Company
```

System record:

```text id="ff004"
Source:
Client A

Type:
CLIENT_PAYMENT

Amount:
₹20,000
```

Default financial ownership:

```text id="ff005"
Client A
```

rahegi unless business rule explicitly changes it.

---

# 3. Vendor Funding as Fund Source

Example:

```text id="ff006"
RAM
↓
₹1,00,000
↓
Company
```

System record:

```text id="ff007"
Source:
RAM-RF-001

Type:
VENDOR_FUNDING

Amount:
₹1,00,000
```

This creates vendor liability.

---

# 4. Agency Funding as Fund Source

Company ka own operational money:

```text id="ff008"
Agency Fund
₹50,000
```

Use cases:

```text id="ff009"
Client campaign support

Ad Account top-up

Temporary funding

Internal ads

Approved settlement
```

---

# 5. Meta Refund as Fund Source

Restricted/closed account ya billing adjustment ke baad Meta se refund/credit aa sakta hai.

Example:

```text id="ff010"
Meta Refund
₹5,000
```

System ko original ownership lineage preserve karni chahiye if known.

---

# 6. Vendor Recovery as Fund Source

Vendor overpayment recover hone par:

```text id="ff011"
RAM returns ₹10,000
```

Type:

```text id="ff012"
VENDOR_RECOVERY
```

This reduces Vendor Receivable.

---

# 7. Fund Ownership

Every active amount ka owner identify hona chahiye.

Possible owners:

```text id="ff013"
CLIENT

AGENCY

COMPANY

VENDOR_RELATED
```

Ownership and physical location separate concepts hain.

---

# 8. Owner vs Source

Source aur Owner same ho sakte hain, lekin always same nahi.

Example:

Vendor RAM se ₹1,00,000 aaya.

Source:

```text id="ff014"
RAM
```

But money operationally client campaigns ke liye use ho sakta hai.

Vendor obligation remains separate.

---

# 9. Fund Purpose

Paisa kis use ke liye assigned hai.

Possible purposes:

```text id="ff015"
CLIENT_CAMPAIGN

AD_ACCOUNT_TOPUP

VENDOR_REPAYMENT

REFUND

AGENCY_OPERATION

TEMPORARY_FUNDING

RECONCILIATION_ADJUSTMENT
```

---

# 10. Fund Location

System ko amount ki current logical location track karni hai.

Possible locations:

```text id="ff016"
COMPANY_BANK

CLIENT_WALLET

AGENCY_POOL

AD_ACCOUNT

CAMPAIGN_ALLOCATION

LOCKED_FUND

REFUND_PENDING

VENDOR

OTHER_APPROVED_LOCATION
```

---

# 11. Fund Status

Possible statuses:

```text id="ff017"
AVAILABLE

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
```

---

# 12. Basic Fund Lifecycle

Generic lifecycle:

```text id="ff018"
Fund Received
      ↓
Available
      ↓
Allocated
      ↓
Used / Spent
      ↓
Remaining
      ↓
Refund / Reallocate / Return / Lock
```

---

# 13. Client Fund Flow

Typical:

```text id="ff019"
Client Payment
      ↓
Client Wallet
      ↓
Client Job
      ↓
Ad Account
      ↓
Meta Campaign
      ↓
Spend
```

If amount remains:

```text id="ff020"
Unused
↓
Client Wallet / Refund / Approved Transfer
```

---

# 14. Vendor Fund Flow

Typical:

```text id="ff021"
Vendor Funding
      ↓
Company Financial Pool
      ↓
Ad Account / Operations
```

Parallel obligation:

```text id="ff022"
Vendor Payable
```

Later:

```text id="ff023"
Client Collection / Company Fund
      ↓
Vendor Repayment
      ↓
Vendor Payable Reduced
```

---

# 15. Agency Fund Flow

Typical:

```text id="ff024"
Agency Fund
      ↓
Agency Pool
      ↓
Client Campaign / Ad Account / Internal Use
```

Agency money must remain distinguishable from client-owned money.

---

# 16. Client Wallet to Campaign

Example:

```text id="ff025"
Client A Wallet:
₹10,000
```

Allocate:

```text id="ff026"
₹7,000
```

to:

```text id="ff027"
JOB-001
```

Result:

```text id="ff028"
Client Wallet Free:
₹3,000

JOB-001 Allocated:
₹7,000
```

---

# 17. Campaign to Ad Account

Example:

```text id="ff029"
JOB-001
₹7,000
```

assigned to:

```text id="ff030"
AD1
```

Important:

Money ownership remains:

```text id="ff031"
Client A
```

Location becomes:

```text id="ff032"
AD1
```

Purpose:

```text id="ff033"
JOB-001
```

---

# 18. Ad Account Spend

Example:

```text id="ff034"
AD1 Client A Allocation:
₹7,000
```

Actual spend:

```text id="ff035"
₹5,000
```

Result:

```text id="ff036"
Spent:
₹5,000

Remaining:
₹2,000
```

---

# 19. Unused Fund

Remaining amount automatically disappear nahi hoga.

Example:

```text id="ff037"
Unused:
₹2,000
```

Possible resolutions:

```text id="ff038"
Return to Client Wallet

Use in Same Client Next Campaign

Refund

Approved Ownership Transfer

Lock if account restricted
```

---

# 20. Client Leftover to Wallet

```text id="ff039"
JOB-001 Unused:
₹2,000
```

Transfer:

```text id="ff040"
Campaign Allocation
↓
Client Wallet
```

Owner unchanged.

---

# 21. Client Leftover to Next Job

```text id="ff041"
Client Wallet:
₹2,000
```

Allocate:

```text id="ff042"
JOB-002
```

History:

```text id="ff043"
PAY-001
↓
JOB-001
↓
Unused ₹2,000
↓
Client Wallet
↓
JOB-002
```

---

# 22. Cross-Client Fund Transfer

Sensitive flow.

Example:

```text id="ff044"
Client A Unused:
₹300
```

Need to use for Client B.

Direct silent transfer prohibited.

Preferred:

```text id="ff045"
Client A
↓
Approved Ownership Resolution
↓
Agency / Transfer Pool
↓
Client B
```

Every step traceable.

---

# 23. Cross-Client Transfer Requirements

Mandatory:

```text id="ff046"
Source Client

Destination Client

Amount

Reason

Approval

Created By

Date

Reference
```

---

# 24. Client to Agency Ownership Change

Example:

```text id="ff047"
Client A Unused:
₹1,000
```

If business agreement allows retention:

```text id="ff048"
Client Fund
↓
Approved Ownership Change
↓
Agency Fund
```

System must not do this automatically.

---

# 25. Ad Account Restriction Flow

Example:

```text id="ff049"
AD1 Balance:
₹5,000
```

Breakdown:

```text id="ff050"
Client A:
₹2,000

Client B:
₹2,000

Agency:
₹1,000
```

Account restricted.

System:

```text id="ff051"
AVAILABLE
↓
LOCKED
```

Ownership unchanged.

---

# 26. Locked Fund Representation

After restriction:

```text id="ff052"
Client A Locked:
₹2,000

Client B Locked:
₹2,000

Agency Locked:
₹1,000
```

Total:

```text id="ff053"
₹5,000
```

---

# 27. Locked Fund Recovery

If account restored:

```text id="ff054"
LOCKED
↓
AVAILABLE
```

If refund received:

```text id="ff055"
LOCKED
↓
META_REFUND
↓
Owner Wallet / Settlement
```

---

# 28. Temporary Replacement Funding

Scenario:

```text id="ff056"
Client A ₹2,000 locked in AD1
```

Campaign must continue.

Agency provides:

```text id="ff057"
₹2,000
```

to AD2.

System maintains:

```text id="ff058"
Client Locked:
₹2,000

Agency Temporary Funding:
₹2,000
```

They are not the same money.

---

# 29. Temporary Funding Recovery

Later client locked fund recovered:

```text id="ff059"
₹2,000
```

Approved transaction can reimburse Agency.

Flow:

```text id="ff060"
Recovered Client Fund
↓
Settlement
↓
Agency Recovery
```

---

# 30. Vendor Funding Flow Example

Ram:

```text id="ff061"
Funding:
₹1,00,000
```

System:

```text id="ff062"
Company Funds +₹1,00,000
Vendor Payable +₹1,00,000
```

Funds may then be allocated operationally.

---

# 31. Vendor Repayment Flow

Client A payment:

```text id="ff063"
₹20,000
```

Company uses it to repay Ram.

Flow:

```text id="ff064"
Client Collection / Company Cash
↓
Vendor Settlement
↓
RAM
```

Vendor payable reduced.

---

# 32. Vendor Overpayment Flow

RAM Payable:

```text id="ff065"
₹0
```

Payment:

```text id="ff066"
₹10,000
```

Flow:

```text id="ff067"
Company
↓
RAM
```

But classification:

```text id="ff068"
VENDOR_RECEIVABLE
₹10,000
```

---

# 33. Vendor Receivable Recovery

RAM returns:

```text id="ff069"
₹10,000
```

Flow:

```text id="ff070"
RAM
↓
Company
```

Receivable closes.

---

# 34. Vendor Receivable Offset Against New Funding

Existing:

```text id="ff071"
RAM Receivable:
₹10,000
```

New Funding:

```text id="ff072"
₹2,00,000
```

Approved offset:

```text id="ff073"
Gross Funding:
₹2,00,000

Receivable Offset:
₹10,000

Net New Payable:
₹1,90,000
```

---

# 35. Meta Refund Flow

Example:

Restricted AD1 had:

```text id="ff074"
Client A:
₹3,000

Agency:
₹2,000
```

Meta refunds:

```text id="ff075"
₹5,000
```

System should restore ownership:

```text id="ff076"
Client A:
₹3,000

Agency:
₹2,000
```

not dump entire refund into Agency Pool.

---

# 36. Partial Meta Refund

Example:

Expected locked:

```text id="ff077"
₹5,000
```

Refund received:

```text id="ff078"
₹4,500
```

Difference:

```text id="ff079"
₹500
```

should become reconciliation case.

---

# 37. Fund Transfer Types

Recommended transfer classifications:

```text id="ff080"
CLIENT_TO_JOB

JOB_TO_AD_ACCOUNT

AD_ACCOUNT_TO_CLIENT_WALLET

CLIENT_TO_AGENCY

AGENCY_TO_CLIENT_JOB

AGENCY_TO_AD_ACCOUNT

CLIENT_REFUND

VENDOR_REPAYMENT

VENDOR_RECOVERY

LOCK_FUNDS

UNLOCK_FUNDS

META_REFUND

MANUAL_ADJUSTMENT
```

---

# 38. Fund Transfer Minimum Data

Every transfer:

```text id="ff081"
Transaction ID

Source

Destination

Amount

Owner Before

Owner After

Purpose

Reason

Reference

Created By

Approved By

Date

Status
```

---

# 39. Ownership Change vs Location Change

Important distinction.

Example:

```text id="ff082"
Client A Wallet
↓
AD1
```

Only location changes.

Owner:

```text id="ff083"
Client A
```

remains same.

But:

```text id="ff084"
Client A
↓
Agency Fund
```

changes ownership.

This should require stronger approval.

---

# 40. Purpose Change

Example:

```text id="ff085"
Client A JOB-001
```

unused amount becomes:

```text id="ff086"
Client A JOB-002
```

Owner same.

Purpose changes.

Trace required.

---

# 41. Status Change

Example:

```text id="ff087"
AVAILABLE
↓
LOCKED
```

Owner and location may remain same.

Status changes.

---

# 42. Location Change

Example:

```text id="ff088"
Client Wallet
↓
Ad Account
```

Owner same.

Location changes.

---

# 43. Spend Is Terminal Consumption

When fund is recognized as valid spend:

```text id="ff089"
ALLOCATED
↓
SPENT
```

Spent amount should not remain in available balances.

---

# 44. Refund Is Not Spend

Refund:

```text id="ff090"
Company / Client Wallet
↓
Client
```

should classify separately.

Do not count refund as advertising spend.

---

# 45. Vendor Repayment Is Not Spend

Vendor repayment:

```text id="ff091"
Company
↓
Vendor
```

is settlement of liability, not ad spend.

---

# 46. Transfer Is Not Expense

Internal transfer:

```text id="ff092"
Client Wallet
↓
Ad Account
```

does not mean money consumed.

Only location changes.

---

# 47. Fund State Machine

Simplified:

```text id="ff093"
RECEIVED
  ↓
AVAILABLE
  ↓
ALLOCATED
  ├──→ SPENT
  ├──→ LOCKED
  ├──→ REFUND_PENDING
  └──→ TRANSFERRED
```

Locked:

```text id="ff094"
LOCKED
├──→ AVAILABLE
├──→ REFUNDED
└──→ ADJUSTED
```

---

# 48. Invalid State Transitions

System should reject nonsensical flows.

Examples:

```text id="ff095"
SPENT → AVAILABLE
```

without reversal.

```text id="ff096"
REFUNDED → SPENT
```

without new transaction.

```text id="ff097"
Vendor Receivable → Vendor Payable
```

without explicit offset/adjustment.

---

# 49. Reversal Flow

Wrong transaction:

```text id="ff098"
Original +₹10,000
```

Correct:

```text id="ff099"
Reversal -₹10,000
New Correct +₹1,000
```

Never silently rewrite money history.

---

# 50. Fund Lot Tracking

For high traceability, incoming amounts can create fund lots.

Example:

```text id="ff100"
LOT-001
Client A
₹10,000

LOT-002
RAM Funding
₹50,000
```

As money is allocated, lot balance reduces.

---

# 51. Why Fund Lots Help

They answer:

```text id="ff101"
This ₹300 originally kis payment se aaya?

Is Ad Account ka ₹5,000 kis vendor/client source se linked hai?

Kaunsa fund batch abhi remaining hai?
```

---

# 52. FIFO Fund Consumption

Where business policy requires generic pool consumption:

```text id="ff102"
FIFO
```

use kiya ja sakta hai.

Example:

Oldest allocation consumed first.

But owner-specific client funds should not be mixed arbitrarily.

---

# 53. Fund Pool

System can maintain logical pools:

```text id="ff103"
Client Funds Pool

Agency Pool

Vendor-Funded Operational Pool

Locked Funds Pool

Refund Pending Pool
```

Logical pools ledger constructs hain.

---

# 54. Agency Pool

Contains:

```text id="ff104"
Company-owned available funds
```

Not:

```text id="ff105"
Unresolved Client Leftovers
```

unless formally transferred.

---

# 55. Locked Fund Pool

Tracks financially owned funds temporarily unusable due to platform/account condition.

Ownership sub-ledgers still preserved.

---

# 56. Refund Pending Pool

Approved but not completed refunds:

```text id="ff106"
REFUND_PENDING
```

should be visible separately.

---

# 57. Vendor Payable Pool

Total vendor liabilities:

```text id="ff107"
RAM ₹80,000
Shyam ₹50,000
Other ₹20,000
```

Total:

```text id="ff108"
₹1,50,000
```

---

# 58. Vendor Receivable Pool

Total recoverable from vendors:

```text id="ff109"
RAM ₹10,000
Shyam ₹5,000
```

Total:

```text id="ff110"
₹15,000
```

---

# 59. Fund Reconciliation

System should reconcile:

```text id="ff111"
Ledger Balances
```

with:

```text id="ff112"
Meta Data
```

and:

```text id="ff113"
Ownership Allocations
```

---

# 60. Ad Account Reconciliation Formula

Conceptually:

```text id="ff114"
Expected Ad Account Balance
=
Client-Owned Funds
+
Agency-Owned Funds
+
Other Valid Funds
-
Recognized Spend
± Valid Adjustments
```

Compare with Meta/derived balance.

---

# 61. Reconciliation Example

Internal:

```text id="ff115"
₹18,000
```

Meta:

```text id="ff116"
₹17,500
```

Difference:

```text id="ff117"
₹500
```

System:

```text id="ff118"
RECONCILIATION_MISMATCH
```

---

# 62. Client Fund Reconciliation

```text id="ff119"
Client Received Funds
=
Spend
+
Wallet Balance
+
Locked Balance
+
Refunds
+
Authorized Transfers
+
Other Valid Adjustments
```

Unexplained difference invalid.

---

# 63. Vendor Reconciliation

```text id="ff120"
Vendor Funding
=
Valid Repayment
+
Outstanding Payable
+
Approved Adjustments
```

Overpayments tracked separately as receivable.

---

# 64. Agency Reconciliation

Agency fund:

```text id="ff121"
Opening Agency Fund
+
Agency Additions
+
Recovered Amounts
+
Approved Ownership Transfers
-
Agency Allocations
-
Refunds / Payments
=
Current Agency Balance
```

---

# 65. Negative Balance Protection

Client wallet should not go negative unless explicit credit policy exists.

Example invalid:

```text id="ff122"
Client Wallet:
₹1,000

Allocation:
₹2,000
```

System should reject or require alternate funding source.

---

# 66. Overspend Handling

Campaign may overspend:

```text id="ff123"
Allocated:
₹10,000

Actual Spend:
₹10,500
```

Difference:

```text id="ff124"
₹500
```

System should create:

```text id="ff125"
FUNDING_GAP
```

Need resolution source:

```text id="ff126"
Agency

Additional Client Payment

Other Approved Source
```

---

# 67. Overspend Must Not Auto-Steal Other Client Funds

Example:

Client A overspends ₹500.

Client B has ₹5,000 on same account.

System must not silently attribute ₹500 from Client B.

Explicit funding resolution required.

---

# 68. Same Account Multiple Owners

Example:

```text id="ff127"
AD1

Client A ₹5,000
Client B ₹3,000
Agency ₹2,000
```

Spend attribution must map campaign-level usage correctly.

---

# 69. Unattributed Spend

If AD1 spend:

```text id="ff128"
₹11,000
```

but attributed:

```text id="ff129"
₹10,500
```

then:

```text id="ff130"
Unattributed:
₹500
```

Alert required.

---

# 70. Fund Proofs

Fund movements may have attachments:

```text id="ff131"
Payment Screenshot

UTR

Bank Receipt

Meta Receipt

Invoice
```

---

# 71. Fund Transaction Status

Possible:

```text id="ff132"
DRAFT

PENDING_APPROVAL

APPROVED

POSTED

FAILED

CANCELLED

REVERSED
```

Only posted transactions affect finalized ledger balances.

---

# 72. Approval Rules

High-risk moves may require approval:

```text id="ff133"
Cross-client transfer

Client-to-agency ownership change

Vendor overpayment

Large refund

Manual adjustment

Write-off

Reversal
```

---

# 73. Duplicate Transaction Protection

Every sensitive financial request should have:

```text id="ff134"
idempotency_key
```

to prevent double posting.

---

# 74. Fund History

Every amount should support drill-down.

Example:

```text id="ff135"
₹300 Remaining
```

Click:

```text id="ff136"
Received from:
Client A PAY-001

Allocated to:
JOB-001

Spent:
₹700

Remaining:
₹300

Moved to:
Client Wallet

Later allocated:
JOB-002
```

---

# 75. Money Lineage

The system should preserve lineage:

```text id="ff137"
Original Source
↓
Intermediate Transfers
↓
Current Location
↓
Current Owner
↓
Current Status
```

---

# 76. Money Lineage Example

```text id="ff138"
Client A PAY-001 ₹1,000
↓
Client A Wallet
↓
JOB-001
↓
AD1
↓
₹700 spent
↓
₹300 unused
↓
Client Wallet
↓
JOB-002
```

---

# 77. Vendor Lineage Example

```text id="ff139"
RAM-RF-001 ₹1,00,000
↓
Company
↓
AD Accounts
↓
Operations
```

Liability parallel:

```text id="ff140"
RAM Payable ₹1,00,000
↓
₹20k repayment
↓
₹80k
...
↓
₹0
```

---

# 78. Overpayment Lineage Example

```text id="ff141"
Client F Payment ₹10,000
↓
Company
↓
RAM
```

RAM payable before:

```text id="ff142"
₹0
```

Result:

```text id="ff143"
Vendor Receivable RAM
₹10,000
```

---

# 79. Fund Closure

Fund item/lifecycle financially closed only when fully resolved.

Examples:

```text id="ff144"
SPENT

REFUNDED

SETTLED

VALIDLY_TRANSFERRED

ADJUSTED
```

No unexplained residual.

---

# 80. Fund Adjustment

Manual adjustment should include:

```text id="ff145"
Amount

Reason

Entity

Reference

Created By

Approved By

Supporting Proof
```

Use only for valid reconciliation/business corrections.

---

# 81. Write-Off

Financial loss/receivable write-off:

```text id="ff146"
WRITTEN_OFF
```

must never be hidden.

Requires explicit transaction and approval.

---

# 82. Opening Balances

When migrating existing business data, current balances may be entered as:

```text id="ff147"
OPENING_BALANCE
```

with:

```text id="ff148"
As Of Date

Source

Owner

Location

Proof/Note
```

Opening balances should be clearly distinguished from normal transactions.

---

# 83. Historical Migration

If exact old transaction history unavailable:

Use:

```text id="ff149"
VERIFIED_OPENING_BALANCE
```

or:

```text id="ff150"
UNVERIFIED_OPENING_BALANCE
```

depending on confidence.

---

# 84. Currency Rule

Fund records need currency.

Example:

```text id="ff151"
INR
USD
AED
```

Do not directly add different currencies without conversion logic.

---

# 85. Multi-Currency Future Support

Example:

```text id="ff152"
AD1 INR
AD2 USD
```

Portfolio total may need reporting currency conversion.

V1 can limit currencies if business only uses INR, but data model should be currency-aware.

---

# 86. Monetary Precision

Money should not use floating-point calculations.

Use:

```text id="ff153"
Minor Currency Units
```

Example:

```text id="ff154"
₹1,000.50
=
100050 paise
```

---

# 87. Fund Dashboard

Top cards:

```text id="ff155"
Total Tracked Funds

Client-Owned Funds

Agency Free Funds

Locked Funds

Refund Pending

Vendor Payable

Vendor Receivable
```

---

# 88. Fund Movement Report

Report columns:

```text id="ff156"
Date

Transaction ID

Source

Destination

Owner

Purpose

Type

Amount

Status

Created By

Reference
```

---

# 89. Fund Location Report

Shows:

```text id="ff157"
Company Bank

Client Wallets

Ad Accounts

Agency Pool

Locked Funds

Refund Pending

Vendor Receivable
```

---

# 90. Fund Ownership Report

Shows:

```text id="ff158"
Client-Owned

Agency-Owned

Company-Owned

Vendor-Related Obligations
```

---

# 91. Fund Aging

Important for:

```text id="ff159"
Locked funds

Refund pending

Vendor receivable

Unused client balance
```

Example:

```text id="ff160"
Client A unused ₹5,000
Open for 32 days
```

---

# 92. Fund Alerts

Possible:

```text id="ff161"
FUND_RECONCILIATION_MISMATCH

LOCKED_FUND_AGED

UNUSED_CLIENT_BALANCE_AGED

REFUND_PENDING_AGED

VENDOR_RECEIVABLE_AGED

UNATTRIBUTED_SPEND

NEGATIVE_BALANCE_ATTEMPT

DUPLICATE_TRANSACTION_ATTEMPT
```

---

# 93. Fund Flow Integrity Rules

System must enforce:

```text id="ff162"
1. Every incoming fund must have a source.

2. Every active fund must have an owner.

3. Every amount must have a location.

4. Every amount must have a status.

5. Ownership and location are separate.

6. Allocation and spend are separate.

7. Internal transfer is not spend.

8. Vendor repayment is not ad spend.

9. Refund is not ad spend.

10. Restricted funds become locked, not deleted.

11. Client unused funds remain client-owned until valid resolution.

12. Cross-client transfer must be explicit.

13. Vendor overpayment becomes receivable.

14. Posted financial transactions cannot be silently edited.

15. Every fund movement must create history.

16. Mismatches must be reconciled.

17. Money must never disappear from the system without a valid closing transaction.
```

---

# 94. Core Fund Equation

Conceptually:

```text id="ff163"
Total Funds Received
=
Valid Spend
+
Current Available Funds
+
Locked Funds
+
Refunds
+
Vendor Repayments
+
Transfers Out
+
Approved Adjustments
+
Other Valid Final States
```

Exact equation context-specific ledger accounts par depend karegi.

---

# 95. Fund Flow Golden Rule

> **For every rupee in the system, we must always be able to identify where it came from, who owns it, why it exists, where it currently is, what state it is in, and every transaction through which it moved. No amount should be changed, transferred, consumed, locked, refunded or settled without a traceable record.**
