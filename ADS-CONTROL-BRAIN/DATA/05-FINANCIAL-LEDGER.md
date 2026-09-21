# Financial Ledger

## Overview

Financial Ledger system ka core accounting engine hoga.

Iska kaam sirf transaction history store karna nahi hai.

Ledger ko ensure karna hai ki:

```text id="led001"
Money kab aaya?

Kahan se aaya?

Kis purpose ke liye aaya?

Kis account me gaya?

Kis client/vendor se related hai?

Kahan transfer hua?

Kitna spend hua?

Kitna locked hai?

Kitna refund hua?

Kitna payable/receivable hai?
```

har question ka traceable answer available ho.

Core principle:

> **Balances are results of ledger entries. Balances themselves are not editable business data.**

---

# 1. Ledger Goals

Ledger must provide:

```text id="led002"
Financial Accuracy

Complete Traceability

Double-Entry Integrity

Transaction Immutability

Point-in-Time Reconstruction

Reconciliation Support

Auditability

Concurrency Safety
```

---

# 2. Financial Source of Truth

Internal money movement ka primary source:

```text id="led003"
POSTED LEDGER ENTRIES
```

Not:

```text id="led004"
Client.wallet_balance

Vendor.payable

AdAccount.balance

Excel summary

Dashboard cache
```

These values may be derived/cached only.

---

# 3. Ledger Structure

Core model:

```text id="led005"
Ledger Account
      ↑
Ledger Entry
      ↑
Ledger Transaction
      ↑
Business Event
```

Example:

```text id="led006"
Client Payment
↓
Ledger Transaction
↓
Debit Company Bank
Credit Client Liability
```

---

# 4. Ledger Transaction

A `LedgerTransaction` represents one complete financial event.

Examples:

```text id="led007"
Client paid ₹20,000

Vendor RAM provided ₹1,00,000

₹10,000 allocated to AD1

Vendor repaid ₹30,000

Client refunded ₹5,000
```

---

# 5. Ledger Entry

Ledger entry transaction ka individual debit/credit line hai.

Every transaction has:

```text id="led008"
2 or more Ledger Entries
```

and must balance.

---

# 6. Double-Entry Rule

For every posted transaction:

```text id="led009"
Total Debit
=
Total Credit
```

Example:

```text id="led010"
Debit  ₹20,000
Credit ₹20,000
```

Otherwise posting reject hona chahiye.

---

# 7. Why Double Entry

Double-entry helps detect:

```text id="led011"
Missing opposite side

Incorrect money creation

Incorrect money deletion

Imbalanced adjustments

Partial transaction failures
```

---

# 8. Ledger Account Types

Recommended high-level account classes:

```text id="led012"
ASSET

LIABILITY

EQUITY

INCOME

EXPENSE

CLEARING / CONTROL
```

Initial system primarily assets, liabilities and control accounts use karega.

---

# 9. Asset Account

Asset represents money/value company controls or recoverable amount.

Examples:

```text id="led013"
Company Bank

Cash

Vendor Receivable

Client Receivable

Meta Recoverable / Refund Receivable
```

---

# 10. Liability Account

Liability represents amount company owes someone.

Examples:

```text id="led014"
Client Wallet / Client-Owned Funds

Vendor Payable

Refund Payable
```

---

# 11. Client Money as Liability

If Client A company ko ₹20,000 ads ke liye deta hai:

company ke paas physically cash/bank asset increase hota hai.

At same time company owes/use-control responsibility toward Client A.

Conceptually:

```text id="led015"
Debit:
Company Bank ₹20,000

Credit:
Client A Funds Liability ₹20,000
```

This ensures client payment automatically revenue nahi banta.

---

# 12. Vendor Funding as Liability

Vendor RAM sends:

```text id="led016"
₹1,00,000
```

Conceptually:

```text id="led017"
Debit:
Company Bank ₹1,00,000

Credit:
RAM Vendor Payable ₹1,00,000
```

Vendor funding is not revenue.

---

# 13. Vendor Receivable

If RAM is overpaid by ₹10,000:

company now has recoverable asset.

Conceptually:

```text id="led018"
Vendor Receivable RAM:
₹10,000
```

This is separate from payable.

---

# 14. Client Receivable

If agency spends ₹5,000 on behalf of client and client owes company:

```text id="led019"
Client Receivable:
₹5,000
```

Asset account.

---

# 15. Company Bank Account

Physical funds received/paid can be represented in:

```text id="led020"
COMPANY_BANK
```

There may be multiple real financial accounts later:

```text id="led021"
HDFC Bank

ICICI Bank

UPI Account

Cash
```

Each can have separate ledger account.

---

# 16. Client Wallet Account

Recommended:

```text id="led022"
One logical client funds account per client per currency
```

Example:

```text id="led023"
CLIENT_CLI001_FUNDS_INR
```

---

# 17. Vendor Payable Account

Recommended:

```text id="led024"
One vendor payable account per vendor per currency
```

Example:

```text id="led025"
VENDOR_RAM_PAYABLE_INR
```

---

# 18. Vendor Receivable Account

Separate:

```text id="led026"
VENDOR_RAM_RECEIVABLE_INR
```

Never merge into payable.

---

# 19. Client Receivable Account

Example:

```text id="led027"
CLIENT_CLI001_RECEIVABLE_INR
```

---

# 20. Agency Fund

Agency-owned free money may conceptually use:

```text id="led028"
Agency Equity / Internal Fund Account
```

plus physical bank/account asset.

Exact accounting treatment depends on company accounting model.

For operational finance system, agency ownership must remain distinguishable.

---

# 21. Operational Control Accounts

Some system concepts may be represented through control/subledger accounts.

Examples:

```text id="led029"
Ad Account Fund Control

Locked Client Fund Control

Refund Pending Control

Unattributed Fund Control
```

Need avoid duplicating actual accounting asset values.

---

# 22. Ledger vs Fund Allocation

Important distinction:

```text id="led030"
Ledger
=
Financial accounting movement
```

```text id="led031"
Fund Allocation
=
Business ownership/purpose/location detail
```

Both work together.

---

# 23. Example: Client Pays ₹20,000

Business event:

```text id="led032"
Client A Payment
₹20,000
```

Ledger:

```text id="led033"
Dr Company Bank                 ₹20,000
Cr Client A Funds Liability     ₹20,000
```

Business allocation:

```text id="led034"
Owner:
Client A

Available:
₹20,000
```

---

# 24. Example: Client Allocates ₹15,000 to Job

This may not require change in top-level accounting ownership because client still owns money.

Operational subledger movement:

```text id="led035"
Client A Available
↓
Client A JOB-001 Allocation
₹15,000
```

Possible implementation:

```text id="led036"
FundAllocation
```

rather than accounting journal between separate balance-sheet accounts.

---

# 25. Ledger Granularity Decision

Not every internal location move necessarily requires full general-ledger debit/credit if ownership/accounting classification doesn't change.

Recommended architecture:

```text id="led037"
General Financial Ledger
+
Allocation Subledger
```

General ledger handles actual accounting-impacting events.

Allocation subledger tracks:

```text id="led038"
Wallet

Job

Ad Account

Locked

Refund Reserved
```

---

# 26. Why Subledger Is Needed

If every tiny operational allocation is represented as general accounting account:

system may create unnecessary complexity.

Instead:

```text id="led039"
Ledger = financial truth

Allocation = operational ownership/location truth
```

Reconciliation ensures consistency.

---

# 27. Client Fund Location

Client-owned money can move:

```text id="led040"
Client Available
↓
Job Allocation
↓
Ad Account Allocation
↓
Spend / Leftover / Locked
```

Ownership:

```text id="led041"
Client A
```

remains same until explicit transfer/refund/spend.

---

# 28. Spend Event

When client-owned funds are consumed by Meta ad spend:

business allocation decreases.

Accounting treatment depends on whether client advertising spend is passed-through client expenditure or business expense.

V1 recommendation:

> Do not prematurely build P&L assumptions.

Use dedicated operational spend/control entries and retain spend attribution.

---

# 29. Operational Spend Recognition

System should still have financial event:

```text id="led042"
AD_SPEND
```

linked to:

```text id="led043"
Client

Job

Ad Account

Meta Campaign

Spend Fact
```

Exact GL accounts should be configurable/finalized with accounting requirements.

---

# 30. Avoid Treating Client Ad Spend as Agency Expense Automatically

Client-owned ad budget consumption should not automatically become agency's own business expense in management reporting.

Keep:

```text id="led044"
Client pass-through spend
```

separate from:

```text id="led045"
Agency operating expense
```

---

# 31. Transaction Lifecycle

Recommended:

```text id="led046"
DRAFT
↓
PENDING_APPROVAL
↓
APPROVED
↓
POSTED
```

Failure possibilities:

```text id="led047"
FAILED

CANCELLED
```

Correction:

```text id="led048"
REVERSED
```

---

# 32. Draft Transaction

Draft has no financial effect.

Can be edited/deleted subject to permissions.

---

# 33. Pending Approval

No posted financial effect.

May create reservation in separate control layer if required.

---

# 34. Approved Transaction

Approved but not yet posted.

For external money transfer:

```text id="led049"
Approval
≠
Actual payment
```

---

# 35. Posted Transaction

Only posted transaction affects canonical ledger balances.

---

# 36. Failed Transaction

If payment/process fails:

```text id="led050"
Status:
FAILED
```

No completed ledger posting should remain unless separate reversal is needed for already-completed external movement.

---

# 37. Cancelled Transaction

Draft/pending action cancelled before financial posting.

---

# 38. Reversed Transaction

Original posted transaction remains.

New opposite financial transaction created.

Original marked as reversed/reference-linked.

---

# 39. Transaction Immutability

After `POSTED`:

Do not allow direct changes to:

```text id="led051"
Amount

Currency

Transaction Type

Debit Account

Credit Account

Business Date

Core Entity Links
```

---

# 40. Reversal Rule

Wrong posted transaction:

```text id="led052"
Original
↓
Reversal
↓
Correct Transaction
```

Never:

```text id="led053"
Edit Original Amount
```

---

# 41. Reversal Example

Wrong client payment:

```text id="led054"
₹20,000
```

Actual:

```text id="led055"
₹2,000
```

Ledger history:

```text id="led056"
TXN-001 Client Payment +₹20,000

TXN-002 Reversal of TXN-001 -₹20,000

TXN-003 Correct Client Payment +₹2,000
```

---

# 42. Reversal Link

Store:

```text id="led057"
reversed_transaction_id
```

or dedicated transaction relationship.

Reports should show both.

---

# 43. Double-Reversal Protection

If TXN-001 already reversed:

second direct reversal attempt should be blocked.

Correction to reversal itself should use another explicit correcting transaction.

---

# 44. Idempotency

Every posting action should support:

```text id="led058"
idempotency_key
```

Example:

```text id="led059"
vendor-settlement:SET-001:post
```

Same request repeated must return same result rather than posting twice.

---

# 45. Idempotency Scope

Unique per:

```text id="led060"
organization_id + idempotency_key
```

---

# 46. External Reference

Separate from idempotency.

Examples:

```text id="led061"
UTR

Bank Transaction ID

Payment Gateway ID
```

External reference may require duplicate detection.

---

# 47. Duplicate UTR

Same UTR used twice:

system should:

```text id="led062"
Warn / Block according to transaction context
```

Do not rely on UTR as primary transaction ID.

---

# 48. Business Date

Financial transaction needs:

```text id="led063"
business_date
```

Example:

Payment happened:

```text id="led064"
16 Sep
```

but entered:

```text id="led065"
17 Sep
```

Both should be preserved.

---

# 49. Created At

Represents when system record was created.

---

# 50. Posted At

Represents when financial effect was finalized in system.

---

# 51. Effective At

Optional for business event timing where exact timestamp matters.

---

# 52. Client Payment Ledger Flow

Example:

Client A pays ₹20,000.

Conceptual entry:

```text id="led066"
Dr Company Bank                  ₹20,000
Cr Client A Funds Liability      ₹20,000
```

Business:

```text id="led067"
Client A Available Funds +₹20,000
```

---

# 53. Client Refund Ledger Flow

Client A refunded ₹5,000.

Conceptual:

```text id="led068"
Dr Client A Funds Liability      ₹5,000
Cr Company Bank                  ₹5,000
```

Business:

```text id="led069"
Client A Owned Funds -₹5,000
Refunded +₹5,000
```

---

# 54. Client Ownership Transfer to Agency

Client A ₹5,000 formally converted to agency-owned money.

This is not cash movement.

It changes liability/ownership classification.

Conceptually:

```text id="led070"
Dr Client A Funds Liability      ₹5,000
Cr Agency Ownership / Equity     ₹5,000
```

Requires explicit approval.

---

# 55. Cross-Client Transfer

Client A → Client B ₹3,000.

Conceptually:

```text id="led071"
Dr Client A Funds Liability      ₹3,000
Cr Client B Funds Liability      ₹3,000
```

Physical bank money does not move.

Ownership changes.

---

# 56. Vendor Funding Ledger Flow

RAM funds ₹1,00,000.

```text id="led072"
Dr Company Bank                  ₹1,00,000
Cr RAM Vendor Payable            ₹1,00,000
```

---

# 57. Vendor Repayment Ledger Flow

Pay RAM ₹20,000.

```text id="led073"
Dr RAM Vendor Payable            ₹20,000
Cr Company Bank                  ₹20,000
```

---

# 58. Vendor Overpayment Flow

Vendor payable:

```text id="led074"
₹20,000
```

Company pays:

```text id="led075"
₹30,000
```

Conceptual split:

```text id="led076"
Dr RAM Vendor Payable            ₹20,000
Dr RAM Vendor Receivable         ₹10,000
Cr Company Bank                  ₹30,000
```

After:

```text id="led077"
RAM Payable:
₹0

RAM Receivable:
₹10,000
```

---

# 59. Vendor Recovery Ledger Flow

RAM returns overpayment ₹4,000.

```text id="led078"
Dr Company Bank                  ₹4,000
Cr RAM Vendor Receivable         ₹4,000
```

Receivable:

```text id="led079"
₹10,000 → ₹6,000
```

---

# 60. Vendor Receivable Offset Against New Funding

Existing receivable:

```text id="led080"
₹10,000
```

New gross funding:

```text id="led081"
₹2,00,000
```

If explicit approved offset:

Gross event must remain visible.

Conceptual outcome:

```text id="led082"
New Vendor Funding Liability:
₹2,00,000

Receivable Settled:
₹10,000

Net Payable Increase:
₹1,90,000
```

Exact journal structure depends on whether physical bank receives gross or net amount.

---

# 61. Physical Gross Funding Case

If vendor actually transfers ₹2,00,000 cash and offset is separately agreed, accounting differs from net cash case.

Therefore system must store:

```text id="led083"
Gross Funding

Physical Cash Amount

Offset Amount
```

separately when required.

---

# 62. Client Receivable Creation

Agency covers Client A ₹5,000 on credit.

Conceptually:

```text id="led084"
Dr Client A Receivable           ₹5,000
Cr Agency Funding / Cash         ₹5,000
```

Exact counter-account depends on operational funding mechanism.

---

# 63. Client Receivable Settlement

Client pays ₹5,000 against outstanding:

```text id="led085"
Dr Company Bank                  ₹5,000
Cr Client A Receivable           ₹5,000
```

---

# 64. Payment Exceeds Client Receivable

Receivable:

```text id="led086"
₹5,000
```

Client payment:

```text id="led087"
₹7,000
```

Split:

```text id="led088"
₹5,000 → Receivable settlement

₹2,000 → Client funds liability/wallet
```

---

# 65. Agency Funding

Company injects internal operating fund.

Exact journal depends on funding source:

```text id="led089"
Owner Capital

Retained Cash

Inter-account transfer
```

System should not guess accounting classification.

For V1 operational tracking, use explicit agency funding source category.

---

# 66. Internal Bank Transfer

Example:

```text id="led090"
HDFC → ICICI
₹1,00,000
```

Conceptually:

```text id="led091"
Dr ICICI Bank
Cr HDFC Bank
```

No income/expense.

---

# 67. Client Wallet Allocation

Moving client fund from "available" to "allocated" may live in allocation subledger.

If separate control ledger accounts are used:

```text id="led092"
Dr Client Allocated Control
Cr Client Available Control
```

But avoid creating accounting duplication.

Recommended final design should distinguish:

```text id="led093"
Accounting Ledger
vs
Fund State Subledger
```

---

# 68. Allocation Subledger

Tracks:

```text id="led094"
Owner

Purpose

Location

Available Amount

Allocated Amount

Consumed Amount

Locked Amount
```

This can be implemented through:

```text id="led095"
fund_lots

fund_allocations

fund_allocation_events
```

---

# 69. Fund Lot

Fund lot tracks origin.

Example:

```text id="led096"
PAY-001

Client A

₹20,000
```

Useful to answer:

```text id="led097"
Which original payment funded JOB-001?
```

---

# 70. Fund Lot Splitting

Original:

```text id="led098"
₹20,000
```

Can split:

```text id="led099"
JOB-001 ₹10,000

JOB-002 ₹5,000

Remaining ₹5,000
```

---

# 71. Fund Lot Consumption

Consumption should never exceed original usable amount.

Constraint:

```text id="led100"
Allocated + Refunded + Transferred + Other Final Use
<=
Available Fund Lot Amount
```

subject to returned amounts.

---

# 72. Available Balance

Available balance should represent:

> Amount currently eligible for use.

Not:

```text id="led101"
Total owner balance
```

Example:

```text id="led102"
Total Owned ₹10,000
Locked ₹4,000
Refund Reserved ₹1,000
Available ₹5,000
```

---

# 73. Reserved Balance

Reserved means:

```text id="led103"
Not yet final outflow
but cannot be reused
```

Examples:

```text id="led104"
Approved Refund

Approved Vendor Settlement

Pending Transfer
```

---

# 74. Pending Transaction Accounting

Pending workflow should generally not post final journal.

Instead use:

```text id="led105"
Reservation / hold layer
```

to prevent duplicate use.

---

# 75. Pending Vendor Settlement

Vendor payable:

```text id="led106"
₹50,000
```

Pending approved payment:

```text id="led107"
₹20,000
```

Posted payable remains:

```text id="led108"
₹50,000
```

Optional:

```text id="led109"
Available To Schedule:
₹30,000
```

---

# 76. Pending Refund

Client wallet total:

```text id="led110"
₹10,000
```

Refund reserved:

```text id="led111"
₹4,000
```

Available:

```text id="led112"
₹6,000
```

Final liability reduces only when refund posted.

---

# 77. Locked Fund

Locking usually changes usability, not ownership.

Example:

```text id="led113"
Client A owned:
₹5,000
```

before restriction.

After restriction:

```text id="led114"
Owner:
Client A

Status:
LOCKED
```

Accounting liability may remain same.

Allocation subledger changes state.

---

# 78. Lock Event

Record:

```text id="led115"
LOCK_FUNDS
```

with:

```text id="led116"
Owner

Ad Account

Amount

Reason

Original Allocation
```

---

# 79. Unlock Event

After verified recovery:

```text id="led117"
UNLOCK_FUNDS
```

Restores amount to valid available/allocated state.

---

# 80. Permanent Locked Fund Loss

If money becomes genuinely unrecoverable:

need:

```text id="led118"
Loss Review

Approval

Write-Off Transaction
```

Do not simply set locked amount to zero.

---

# 81. Write-Off

Write-off must have:

```text id="led119"
Source Exposure

Reason

Amount

Evidence

Approval

Ledger Transaction
```

---

# 82. Vendor Receivable Write-Off

If RAM owes ₹10,000 but unrecoverable:

conceptually:

```text id="led120"
Dr Approved Loss / Adjustment Account
Cr RAM Vendor Receivable
```

Only after approval.

---

# 83. Client Receivable Write-Off

Same pattern.

---

# 84. Manual Adjustment

Manual adjustment should be rare.

Use when:

```text id="led121"
Opening correction

Reconciliation correction

Approved historical correction

Rounding adjustment
```

Never for convenience.

---

# 85. Manual Adjustment Fields

Required:

```text id="led122"
Reason

Evidence

Affected Entity

Amount

Currency

Debit/Credit logic generated by backend

Approver
```

---

# 86. Adjustment Threshold

Large adjustments require higher approval.

Example configured rules:

```text id="led123"
₹0–₹1,000
Finance approval

₹1,001+
Admin approval
```

Actual thresholds configurable.

---

# 87. Opening Balance

Migration transaction type:

```text id="led124"
OPENING_BALANCE
```

Should include:

```text id="led125"
As-of Date

Source Evidence

Verification Status

Migration Batch
```

---

# 88. Opening Client Balance

If old Client A wallet known:

```text id="led126"
₹20,000
```

but transaction history unavailable:

create opening balance, not fake old payments.

---

# 89. Opening Vendor Payable

RAM old payable:

```text id="led127"
₹1,50,000
```

create explicit opening vendor liability.

---

# 90. Opening Vendor Receivable

Similarly explicit asset.

---

# 91. Unverified Opening Balance

Mark:

```text id="led128"
UNVERIFIED
```

Do not pretend fully reconciled.

---

# 92. Ledger Account Currency

Recommended:

> One ledger account has one currency.

Example:

```text id="led129"
COMPANY_BANK_INR

COMPANY_BANK_USD
```

not one mixed-currency account.

---

# 93. One Transaction One Currency

V1 recommended rule:

```text id="led130"
One ledger transaction
=
One currency
```

Simplifies balancing and reconciliation.

---

# 94. Cross-Currency Transaction

Do not allow direct:

```text id="led131"
Dr ₹10,000
Cr $120
```

inside same simple transaction model.

Future FX workflow should create explicit:

```text id="led132"
Source Currency

Destination Currency

FX Rate

FX Difference

Conversion Reference
```

---

# 95. Rounding

Store monetary amounts in minor units.

No floating-point rounding.

---

# 96. Currency Decimal Awareness

Do not universally assume 2 decimals.

Currency metadata should define minor-unit precision.

---

# 97. Transaction Metadata

Flexible supporting metadata can store:

```text id="led133"
Payment Method

Bank Name

Provider Reference

Migration Info

System Calculation Context
```

But core financial fields must remain relational columns.

---

# 98. Ledger Account Status

Possible:

```text id="led134"
ACTIVE

INACTIVE

CLOSED
```

Account closure does not delete ledger history.

---

# 99. Closing Ledger Account

Cannot close if business process still needs postings.

Closing affects future posting availability, not old records.

---

# 100. Ledger Balance Calculation

For asset account conceptually:

```text id="led135"
Balance
=
Debits - Credits
```

For liabilities:

presentation may be:

```text id="led136"
Credits - Debits
```

Backend should use account normal balance rules.

---

# 101. Running Balance

Ledger view may show running balance.

Sorting must use deterministic:

```text id="led137"
Business Date
+
Posted At
+
Sequence
```

---

# 102. Point-in-Time Balance

System should calculate:

```text id="led138"
Balance as of timestamp/date
```

from entries posted/effective by that point.

---

# 103. Current Balance Cache

For performance:

```text id="led139"
ledger_account_balances
```

may cache current balance.

But:

```text id="led140"
Ledger Entries
```

remain canonical.

---

# 104. Cache Reconciliation

Periodically compare:

```text id="led141"
Cached Balance
vs
Recomputed Ledger Balance
```

Mismatch should be critical system issue.

---

# 105. Ledger Posting Service

Only trusted backend service should post ledger.

Conceptual function:

```text id="led142"
postTransaction()
```

---

# 106. Posting Validation

Before posting check:

```text id="led143"
Transaction exists

Status valid

Not already posted

Idempotency unique

Accounts active

Organization matches

Currency matches

Entries valid

Debit = Credit

Business constraints valid

Approval complete if required
```

---

# 107. Posting Atomicity

Posting process:

```text id="led144"
BEGIN

Lock required financial rows

Validate

Create ledger entries

Update related workflow state

Create allocations/receivables if required

Set transaction POSTED

Write audit event

COMMIT
```

If error:

```text id="led145"
ROLLBACK
```

---

# 108. Never Partial Post

Invalid state:

```text id="led146"
Bank reduced
but vendor payable not reduced
```

inside internal system because transaction crashed halfway.

Atomic DB transaction must prevent this.

---

# 109. External Payment Atomicity Limitation

Bank/payment transfer can happen outside DB transaction.

Therefore workflow may be:

```text id="led147"
Approved
↓
Payment Pending
↓
External Payment Success
↓
Internal Ledger Post
```

Need idempotent reconciliation if confirmation uncertain.

---

# 110. External Payment Unknown State

If payment request times out:

Do not immediately retry blindly.

Use:

```text id="led148"
PAYMENT_STATUS_UNKNOWN
```

then verify provider/bank reference before second transfer.

This prevents double payment.

---

# 111. Concurrency

Two users may attempt same funds simultaneously.

Need database lock/transaction.

Example:

```text id="led149"
Available Client Wallet:
₹10,000
```

User A allocates ₹8,000.

User B allocates ₹8,000 simultaneously.

Only valid total <= ₹10,000.

---

# 112. SELECT FOR UPDATE

Use on financial position/allocation rows where needed.

---

# 113. Optimistic Locking

Workflow entities may also use:

```text id="led150"
version
```

to prevent stale edits.

---

# 114. Negative Balances

Default policy:

```text id="led151"
Client Available Funds < 0
NOT ALLOWED
```

```text id="led152"
Agency Available < 0
NOT ALLOWED
```

unless explicit credit/overdraft feature exists.

---

# 115. Vendor Payable Negative

Never allowed as representation.

Excess moves to vendor receivable.

---

# 116. Client Receivable Negative

If client overpays receivable:

extra should become client wallet/other explicit classification, not negative receivable.

---

# 117. Clearing Accounts

Useful when transaction classification incomplete.

Example:

```text id="led153"
UNIDENTIFIED_RECEIPT_CLEARING
```

Bank receives ₹10,000 but payer unknown.

Ledger:

```text id="led154"
Dr Company Bank
Cr Unidentified Receipt Clearing
```

Later classify.

---

# 118. Unidentified Receipt Resolution

Once Client A identified:

move:

```text id="led155"
Unidentified Receipt Clearing
→ Client A Funds Liability
```

through explicit transaction/reclassification.

---

# 119. Unattributed Funds

Similar concept for funds whose operational ownership is unknown.

Do not classify as agency free cash.

---

# 120. Clearing Account Aging

Unknown receipts/funds should generate aging alerts.

They must not remain indefinitely invisible.

---

# 121. Pending External Refund Clearing

If Meta says refund initiated but cash not received:

possible:

```text id="led156"
Meta Refund Receivable / Pending
```

depending on confidence/accounting model.

Only recognize actual received cash according to configured rule.

---

# 122. Meta Balance vs Ledger

Meta "balance" or billing fields should not automatically create ledger journal.

They are reconciliation observations.

---

# 123. Reconciliation Observation

External observation:

```text id="led157"
Meta reports X
```

Internal ledger:

```text id="led158"
Ledger says Y
```

Difference creates reconciliation.

Do not overwrite ledger.

---

# 124. Spend Adjustment from Meta

Meta may revise spend historical value.

Raw spend fact can be updated/versioned.

If financial recognized spend already posted:

create reconciliation/correction workflow.

Do not rewrite old posted financial transaction silently.

---

# 125. Financial Period Impact

Backdated corrections may alter historical reporting.

Need audit and optionally:

```text id="led159"
REOPEN_REVIEW_REQUIRED
```

---

# 126. Transaction Relationships

Each transaction can reference business context via metadata/explicit link tables.

Examples:

```text id="led160"
Client ID

Vendor ID

Job ID

Ad Account ID

Refund ID

Settlement ID

Reconciliation Case
```

Avoid overloading one generic foreign key for core cases.

---

# 127. Transaction Description

Human-readable:

```text id="led161"
Client A payment received for ads fund.
```

Useful but not authoritative.

Structured fields remain source.

---

# 128. Transaction Reference

Human ID:

```text id="led162"
TXN-000123
```

Stable and immutable.

---

# 129. Ledger Entry Description

Optional explanation:

```text id="led163"
Client A funds liability created.
```

---

# 130. Approval Relationship

A transaction requiring approval should not post until:

```text id="led164"
Approval Request = APPROVED
```

---

# 131. Maker-Checker

For configured transaction:

```text id="led165"
Created By
!=
Approved By
```

---

# 132. Approval Expiry

Expired approval:

```text id="led166"
Cannot be posted
```

unless re-approved.

---

# 133. Approval Changes After Material Edit

If draft transaction materially changes:

```text id="led167"
Amount

Currency

Vendor

Client

Source

Destination
```

previous approval invalidated.

---

# 134. Financial Audit Event

Every posting creates audit:

```text id="led168"
Transaction Created

Submitted

Approved

Posted

Reversed
```

---

# 135. Ledger Delete Rule

Posted transaction:

```text id="led169"
DELETE FORBIDDEN
```

Posted ledger entry:

```text id="led170"
DELETE FORBIDDEN
```

---

# 136. Audit Delete Rule

No normal user delete.

---

# 137. Financial Permissions

Typical:

```text id="led171"
VIEW_LEDGER

CREATE_TRANSACTION

SUBMIT_TRANSACTION

APPROVE_TRANSACTION

POST_TRANSACTION

REVERSE_TRANSACTION

CREATE_ADJUSTMENT

APPROVE_WRITE_OFF
```

---

# 138. Frontend Ledger Screen

Tabs:

```text id="led172"
Transactions

Accounts

Entries

Pending

Adjustments

Reversals
```

---

# 139. Transaction Table

Columns:

```text id="led173"
Date

Reference

Type

Entity

Amount

Currency

Status

Created By

Approved By
```

---

# 140. Ledger Account Table

Columns:

```text id="led174"
Account Code

Account Name

Type

Entity

Currency

Current Balance

Status
```

---

# 141. Transaction Drill-Down

Show:

```text id="led175"
Business Event

Ledger Entries

Approval

Proof

Related Client/Vendor

Related Fund Allocations

Reconciliation Links

Audit Timeline
```

---

# 142. Trial Balance

Future/useful finance validation report:

```text id="led176"
Ledger Account

Debit Total

Credit Total

Net Balance
```

Overall ledger:

```text id="led177"
Total Debits = Total Credits
```

---

# 143. Ledger Health Check

Scheduled validation:

```text id="led178"
Any unbalanced posted transaction?

Any entry without transaction?

Any posted transaction without entries?

Any duplicate idempotency key?

Any currency mismatch?

Any invalid reversal?
```

Critical alert if found.

---

# 144. Subledger Reconciliation

Compare general ledger control accounts with:

```text id="led179"
Client Wallet Subledger

Vendor Payable Batches

Vendor Receivables

Client Receivables

Fund Allocations
```

---

# 145. Vendor Payable Reconciliation

Example:

```text id="led180"
Vendor Payable Ledger:
₹1,00,000
```

Funding batch outstanding sum:

```text id="led181"
₹1,00,000
```

Must match.

---

# 146. Client Funds Reconciliation

Client liability ledger total should reconcile with client fund ownership subledger.

---

# 147. Locked Fund Reconciliation

Locked allocation totals should reconcile with owner/location records.

Locked status itself may not alter top-level client liability.

---

# 148. Financial Event Registry

Recommended backend define canonical event types.

Example:

```text id="led182"
CLIENT_PAYMENT_RECEIVED

CLIENT_REFUND_PAID

VENDOR_FUNDING_RECEIVED

VENDOR_SETTLEMENT_PAID

VENDOR_OVERPAYMENT_CREATED

VENDOR_RECOVERY_RECEIVED

CLIENT_RECEIVABLE_CREATED

OWNERSHIP_TRANSFERRED

WRITE_OFF_POSTED
```

Each event maps deterministically to ledger template.

---

# 149. Ledger Templates

Instead of frontend choosing debit/credit, backend uses templates.

Example:

```text id="led183"
CLIENT_PAYMENT_RECEIVED
```

template:

```text id="led184"
Dr Company Bank
Cr Client Funds Liability
```

---

# 150. Why Ledger Templates

Prevents users from accidentally creating wrong debit/credit direction.

Also ensures consistent reports.

---

# 151. Custom Journal Entry

V1 should avoid unrestricted custom journal entries.

If needed:

```text id="led185"
MANUAL_ADJUSTMENT
```

with elevated approval.

---

# 152. Service Fee

Client payment may contain:

```text id="led186"
₹20,000 Ad Fund

₹5,000 Service Fee
```

Should be split into correct classifications.

Ads fund:

```text id="led187"
Client Funds Liability
```

Service fee:

may become:

```text id="led188"
Revenue / Service Fee account
```

only if business accounting confirms.

---

# 153. Never Mix Service Fee and Ads Fund

Client payment purpose allocation must preserve split.

Otherwise client wallet becomes overstated.

---

# 154. Ad Spend Funding Source

If spend is funded by:

```text id="led189"
Client-owned money
```

vs:

```text id="led190"
Agency-owned money
```

subledger must distinguish.

This matters for client receivable/leftover handling.

---

# 155. Agency-Funded Spend

If agency funds Client A:

```text id="led191"
Owner:
Agency
Purpose:
Client A Job
```

If recoverable from client:

create Client Receivable.

---

# 156. Client-Funded Spend

No client receivable should arise merely from normal use of client's own allocated funds.

---

# 157. Late Spend

If additional Meta spend appears after leftover moved:

do not rewrite previous transfer.

Create:

```text id="led192"
Funding Gap / Reconciliation Case
```

and explicit correction.

---

# 158. Refund After Late Spend

If client already refunded ₹1,000 but Meta later adds ₹500 spend:

system should detect:

```text id="led193"
Over-refunded / funding shortfall
```

Potential client receivable/agency exposure depending on business decision.

---

# 159. Ledger Reporting

Key reports:

```text id="led194"
General Ledger

Transaction Register

Ledger Account Statement

Client Funds Liability

Vendor Payable

Vendor Receivable

Client Receivable

Adjustments

Reversals

Trial Balance
```

---

# 160. Ledger Export

Financial export should include:

```text id="led195"
Transaction Reference

Business Date

Posted Date

Account Code

Debit

Credit

Currency

Entity

External Reference
```

---

# 161. Ledger Security

Frontend must never receive raw ability to:

```text id="led196"
Insert ledger entry

Update ledger entry

Delete ledger entry
```

Normal APIs invoke domain actions only.

---

# 162. Service Account Access

Only trusted backend financial service should write posted ledger records.

---

# 163. Database Trigger Protection

Recommended DB-level trigger:

Block UPDATE/DELETE of posted:

```text id="led197"
ledger_transactions

ledger_entries
```

except carefully controlled maintenance procedure.

---

# 164. Backup

Ledger is highest-priority backup data.

Need:

```text id="led198"
Daily backups

Point-in-time recovery where available

Restore testing
```

---

# 165. Disaster Recovery

If balance cache/summaries lost:

rebuild from ledger.

If ledger lost:

critical financial history lost.

Therefore ledger gets strongest durability policy.

---

# 166. V1 Required Ledger Accounts

At minimum categories:

```text id="led199"
Company Bank / Cash Accounts

Client Funds Liability Accounts

Agency/Internal Fund Accounts

Vendor Payable Accounts

Vendor Receivable Accounts

Client Receivable Accounts

Clearing / Unidentified Receipt Account

Adjustment / Control Accounts
```

---

# 167. V1 Required Transaction Templates

```text id="led200"
CLIENT_PAYMENT

CLIENT_REFUND

VENDOR_FUNDING

VENDOR_REPAYMENT

VENDOR_OVERPAYMENT

VENDOR_RECOVERY

CLIENT_RECEIVABLE_CREATE

CLIENT_RECEIVABLE_SETTLE

AGENCY_FUNDING

OWNERSHIP_TRANSFER

MANUAL_ADJUSTMENT

WRITE_OFF

REVERSAL

OPENING_BALANCE
```

Operational allocation/spend templates added according to final subledger architecture.

---

# 168. Recommended Ledger Architecture

Final recommended structure:

```text id="led201"
GENERAL FINANCIAL LEDGER
│
├── Cash / Bank
├── Client Liabilities
├── Vendor Payables
├── Vendor Receivables
├── Client Receivables
└── Agency / Control Accounts

        +

FUND ALLOCATION SUBLEDGER
│
├── Fund Lots
├── Owner
├── Purpose
├── Location
├── Allocation
├── Locked
├── Spend Attribution
└── Leftover
```

---

# 169. Why This Architecture

It provides:

```text id="led202"
Accounting correctness
without
turning every operational fund move into confusing general-ledger complexity.
```

At the same time system can answer:

```text id="led203"
How much money exists?

Whom do we owe?

Who owes us?

Whose operational money is this?

Where is it being used?

What remains?
```

---

# 170. Ledger Integrity Rules

System must enforce:

```text id="led204"
1. Only posted transactions affect canonical ledger balances.

2. Every posted transaction must balance.

3. Posted transactions and entries are immutable.

4. Wrong posted transactions must be reversed, not edited.

5. Every financial transaction must have currency.

6. Client funds must not automatically be treated as revenue.

7. Vendor funding must create traceable liability.

8. Vendor payable must never become negative.

9. Vendor overpayment must create a separate receivable.

10. Client receivable and client wallet must remain separate.

11. Pending transactions must not be included in posted balances.

12. Reservations must prevent double use without pretending settlement is complete.

13. Ownership transfer must be explicit.

14. Unknown funds must use clearing/unattributed states.

15. Duplicate posting must be prevented with idempotency.

16. Financial posting must be atomic.

17. Concurrency must not create negative/double balances.

18. Cached balances must be rebuildable from ledger.

19. External Meta values must reconcile with, not overwrite, ledger.

20. Every ledger movement must be traceable back to a business event.
```

---

# 171. Financial Ledger Golden Rule

> **The ledger must make it impossible for money to appear, disappear or silently change meaning. Every posted rupee must have an equal financial counter-entry, a traceable business reason, a known currency, a permanent transaction history and a clear relationship to the client, vendor, agency or financial event that caused it.**
