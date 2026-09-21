# Transaction Types

## Overview

Ye document system ke canonical financial transaction types define karta hai.

Har financial event ko ek known transaction type ke through represent karna chahiye.

Core principle:

> **Same business event ko alag-alag ad-hoc labels se record nahi kiya jayega. Har event ka canonical transaction type, validation rule, financial effect aur audit behavior defined hoga.**

---

# 1. Why Transaction Types Matter

Canonical transaction types help with:

```text
Consistent Ledger Posting

Correct Reporting

Approval Rules

Reversal Logic

Audit

Reconciliation

Permissions

Duplicate Prevention
```

---

# 2. Transaction Type Structure

Har transaction type ke liye ideally define hoga:

```text
Code

Business Meaning

Initiating Entity

Source

Destination

Owner Effect

Ledger Effect

Allocation Effect

Approval Requirement

Reversal Rule

Reporting Category
```

---

# 3. Transaction Categories

High-level categories:

```text
CLIENT

VENDOR

AGENCY

ALLOCATION

SPEND

LOCKED_FUNDS

REFUND

RECEIVABLE

TRANSFER

ADJUSTMENT

MIGRATION
```

---

# 4. Transaction Status Is Separate

Transaction type:

```text
CLIENT_PAYMENT
```

Transaction status:

```text
DRAFT
POSTED
REVERSED
```

These are separate concepts.

---

# 5. CLIENT_PAYMENT

## Meaning

Client se confirmed payment receive hua.

Example:

```text
Client A paid ₹20,000.
```

## Typical Effect

```text
Company Cash/Bank increases

Client Funds Liability increases
```

## Ownership

```text
Owner:
Client
```

unless payment purpose specifies service fee or another approved classification.

---

# 6. CLIENT_PAYMENT Purpose Split

One payment may contain:

```text
ADS_FUND

SERVICE_FEE

RECEIVABLE_SETTLEMENT

ADVANCE

OTHER
```

Do not automatically put entire payment into client wallet.

---

# 7. CLIENT_PAYMENT Example

Client sends:

```text
₹25,000
```

Breakdown:

```text
₹20,000 Ads Fund

₹5,000 Service Fee
```

These should create separate financial classifications.

---

# 8. CLIENT_PAYMENT_REVERSAL

Used when previously posted client payment is reversed externally or was posted incorrectly.

Must reference:

```text
Original Client Payment
Original Ledger Transaction
```

---

# 9. CLIENT_PAYMENT_REVERSAL After Spend

If original client funds already used:

reversal may create:

```text
Funding Gap

Client Receivable

Agency Exposure
```

depending on business resolution.

Do not allow client wallet to silently go negative.

---

# 10. CLIENT_RECEIVABLE_CREATE

Meaning:

> Client now owes company money.

Examples:

```text
Agency-funded spend

Payment reversal after spend

Approved client credit

Overspend funded by company
```

---

# 11. CLIENT_RECEIVABLE_SETTLEMENT

Client payment applied against open receivable.

Example:

```text
Receivable ₹10,000

Client pays ₹6,000
```

Result:

```text
Outstanding ₹4,000
```

---

# 12. CLIENT_RECEIVABLE_WRITE_OFF

Used when approved client receivable is permanently unrecoverable.

Requires:

```text
High-level approval

Reason

Evidence
```

---

# 13. CLIENT_REFUND

Meaning:

Client-owned money physically returned to client.

Requires:

```text
Valid available/refundable source

Approval according to threshold

External payment reference
```

---

# 14. CLIENT_REFUND_PARTIAL

Normally same canonical type `CLIENT_REFUND` can be used repeatedly against one refund workflow.

Do not require separate financial type unless implementation benefits.

---

# 15. CLIENT_REFUND_REVERSAL

Used if previously recorded refund is reversed/returned.

Example:

Bank transfer failed after initially being marked complete.

Must preserve original refund history.

---

# 16. CLIENT_LEFTOVER_RETURN

Operational transaction/event:

```text
Unused Job Funds
→ Client Available Wallet
```

Ownership does not change.

This may primarily affect allocation subledger rather than top-level accounting ledger.

---

# 17. CLIENT_LEFTOVER_REALLOCATION

Meaning:

Unused Client A funds moved from old job to another Client A job.

Example:

```text
JOB-001 leftover ₹5,000
→ JOB-002
```

Owner remains same.

---

# 18. CLIENT_TO_CLIENT_TRANSFER

Ownership change:

```text
Client A
→
Client B
```

High-risk.

Requires:

```text
Reason

Approval

Source balance validation
```

---

# 19. CLIENT_TO_AGENCY_TRANSFER

Meaning:

Client-owned funds explicitly become agency-owned.

Requires clear authorization.

Do not use simply because client campaign ended.

---

# 20. AGENCY_TO_CLIENT_TRANSFER

Opposite ownership transfer if agency formally assigns funds to client ownership.

This is different from agency temporarily funding a client job.

---

# 21. AGENCY_FUNDING

Meaning:

Company/agency internal fund introduced into tracked financial system.

Possible sources:

```text
Owner Capital

Company Bank Opening Fund

Internal Approved Funding
```

Exact accounting classification configurable.

---

# 22. AGENCY_ALLOCATION

Agency-owned fund assigned to purpose.

Examples:

```text
Client Job

Ad Account

Internal Campaign
```

Ownership remains agency unless explicitly transferred.

---

# 23. AGENCY_TEMP_CLIENT_FUNDING

Recommended business transaction/event code.

Meaning:

Agency temporarily funds a client job.

Example:

```text
Client funds locked
Agency provides ₹5,000 replacement
```

Potential consequence:

```text
Client Receivable
```

if client owes agency.

---

# 24. AGENCY_RECOVERY

Meaning:

Agency recovers previously advanced/temporarily used company money.

May be linked to:

```text
Client Receivable Settlement

Recovered Locked Fund

Other Recovery
```

---

# 25. VENDOR_FUNDING

Vendor provides money/credit.

Example:

```text
RAM → Company ₹1,00,000
```

Financial effect:

```text
Cash/Bank increases

Vendor Payable increases
```

---

# 26. VENDOR_FUNDING_REVERSAL

Used when vendor funding was incorrectly posted or externally reversed.

Must restore vendor payable accordingly.

---

# 27. VENDOR_REPAYMENT

Meaning:

Company validly repays open vendor payable.

Example:

```text
RAM Payable ₹50,000

Payment ₹20,000
```

After:

```text
Payable ₹30,000
```

---

# 28. VENDOR_REPAYMENT Source

Repayment source may be:

```text
Company Fund

Agency Fund

Client Collection After Valid Classification

Other Approved Source
```

Source must be traceable.

---

# 29. VENDOR_OVERPAYMENT

Meaning:

Payment to vendor exceeds valid payable.

Example:

```text
Payable ₹20,000

Payment ₹30,000
```

Financial interpretation:

```text
₹20,000 Vendor Repayment

₹10,000 Vendor Receivable
```

---

# 30. VENDOR_OVERPAYMENT Implementation

Can be represented as one compound settlement transaction with:

```text
valid_repayment_minor

excess_amount_minor
```

or separate linked financial events.

Either way reporting must clearly show both.

---

# 31. VENDOR_RECEIVABLE_CREATE

Meaning:

Vendor owes company.

Typical source:

```text
Vendor overpayment
```

Can also originate from approved other recoverable vendor amount.

---

# 32. VENDOR_RECOVERY

Vendor returns money owed to company.

Example:

```text
Vendor Receivable ₹10,000

Vendor Returns ₹4,000
```

Result:

```text
Receivable ₹6,000
```

---

# 33. VENDOR_RECEIVABLE_OFFSET

Meaning:

Open vendor receivable explicitly offset against new vendor funding/payable.

Example:

```text
Old Receivable ₹10,000

New Funding ₹2,00,000

Approved Offset ₹10,000

New Payable Net Effect ₹1,90,000
```

Gross events must remain visible.

---

# 34. VENDOR_RECEIVABLE_WRITE_OFF

Used when vendor receivable is approved as unrecoverable.

Requires elevated approval.

---

# 35. VENDOR_PAYABLE_ADJUSTMENT

Exceptional correction to vendor payable.

Use only for:

```text
Migration correction

Reconciliation correction

Approved contractual adjustment
```

Never direct balance edit.

---

# 36. VENDOR_RECEIVABLE_ADJUSTMENT

Same for vendor receivable.

---

# 37. INTERNAL_FUND_TRANSFER

Changes tracked location without changing owner.

Examples:

```text
Company Bank A → Bank B

Client Wallet → Job Allocation

Agency Pool → Ad Account Location
```

Depending on layer, may be accounting transfer or allocation-subledger transfer.

---

# 38. FUND_ALLOCATION

General business event:

```text
Available Fund
→
Reserved/Allocated Purpose
```

Example:

```text
Client Wallet → JOB-001
```

---

# 39. FUND_DEALLOCATION

Releases unused allocation back to valid source.

Example:

```text
JOB-001 Unused
→ Client Wallet
```

---

# 40. AD_ACCOUNT_FUND_ALLOCATION

Recommended subtype/event:

```text
Job/Owner Funds
→ Ad Account
```

Useful for clear operational reporting.

---

# 41. AD_ACCOUNT_FUND_RETURN

Meaning:

Tracked fund leaves Ad Account allocation and returns to valid internal location.

Should only occur when operationally/financially verified.

---

# 42. AD_SPEND

Represents recognized Meta advertising spend.

Must link where possible to:

```text
Spend Fact

Ad Account

Campaign

Client Job

Fund Allocation
```

---

# 43. AD_SPEND_ATTRIBUTED

Can be treated as attribution status/event rather than separate ledger transaction type.

Recommended:

```text
AD_SPEND
```

with attribution records.

---

# 44. UNATTRIBUTED_SPEND

Not necessarily a ledger transaction type.

Better represented as:

```text
Spend Attribution Status
=
UNATTRIBUTED
```

plus reconciliation case.

---

# 45. LOCK_FUNDS

Meaning:

Previously usable tracked funds become unavailable.

Example:

```text
Ad Account Restricted
```

Effect:

```text
AVAILABLE/ALLOCATED
→ LOCKED
```

Ownership does not change.

---

# 46. UNLOCK_FUNDS

Meaning:

Locked funds become usable again after verification.

Requires:

```text
Recovery verification

Reconciliation
```

---

# 47. LOCKED_FUND_PARTIAL_RECOVERY

May be represented through repeated recovery/unlock transactions.

Example:

```text
Locked ₹10,000

Recovered ₹6,000
```

Remaining:

```text
₹4,000 locked
```

---

# 48. LOCKED_FUND_WRITE_OFF

Used when permanently unrecoverable locked amount is approved for write-off.

Must not simply close recovery case.

---

# 49. META_REFUND_RECEIVED

Meaning:

Refund from Meta physically/financially received.

Must link to:

```text
Ad Account

Original Locked/Allocated Funds

Owners
```

where known.

---

# 50. META_REFUND_PENDING

Usually workflow/status rather than posted transaction.

Do not treat expected refund as received cash.

---

# 51. META_REFUND_ALLOCATION

Meaning:

Received Meta refund distributed back to original ownership buckets.

Example:

```text
Meta Refund ₹10,000
↓
Client A ₹6,000
Agency ₹4,000
```

---

# 52. UNIDENTIFIED_RECEIPT

Money received but source/payer not yet identified.

Example:

```text
Bank +₹10,000
```

but unknown origin.

Use clearing account.

---

# 53. UNIDENTIFIED_RECEIPT_CLASSIFICATION

Once identified:

```text
Clearing
→ Client/Vendor Recovery/Other Classification
```

through explicit reclassification transaction.

---

# 54. UNATTRIBUTED_FUND_CREATE

Operational control event for funds whose owner/purpose cannot be determined.

Should not silently become agency fund.

---

# 55. UNATTRIBUTED_FUND_RESOLVE

Used when unknown ownership is successfully identified.

Must preserve original unknown period/history.

---

# 56. REFUND_RESERVATION

Recommended as non-posted reservation event/state.

Meaning:

```text
Funds reserved for refund
```

Not yet cash outflow.

---

# 57. VENDOR_SETTLEMENT_RESERVATION

Similarly:

```text
Vendor Payable Reserved for Pending Settlement
```

No posted payable reduction yet.

---

# 58. OWNERSHIP_TRANSFER

Generic high-risk event.

Specific subtypes should be preferred:

```text
CLIENT_TO_CLIENT_TRANSFER

CLIENT_TO_AGENCY_TRANSFER

AGENCY_TO_CLIENT_TRANSFER
```

for reporting clarity.

---

# 59. MANUAL_ADJUSTMENT

Exceptional financial correction.

Requires:

```text
Reason

Evidence

Approval

Explicit debit/credit template
```

---

# 60. RECONCILIATION_ADJUSTMENT

Subtype of manual adjustment specifically linked to reconciliation case.

Recommended because it makes reporting clearer.

---

# 61. ROUNDING_ADJUSTMENT

Small financial adjustment due to legitimate currency/rounding reconciliation.

Should have strict tolerance.

---

# 62. WRITE_OFF

Generic high-level transaction type.

Prefer specific types where possible:

```text
CLIENT_RECEIVABLE_WRITE_OFF

VENDOR_RECEIVABLE_WRITE_OFF

LOCKED_FUND_WRITE_OFF
```

---

# 63. REVERSAL

Generic transaction type for reversing original posted transaction.

Every reversal must reference original transaction.

---

# 64. OPENING_BALANCE

Used during migration.

Must never be used later as convenience adjustment.

---

# 65. OPENING_CLIENT_FUNDS

Optional subtype for clearer migration reporting.

---

# 66. OPENING_VENDOR_PAYABLE

Recommended explicit migration type.

---

# 67. OPENING_VENDOR_RECEIVABLE

Recommended.

---

# 68. OPENING_CLIENT_RECEIVABLE

Recommended.

---

# 69. OPENING_AGENCY_FUND

Recommended.

---

# 70. OPENING_AD_ACCOUNT_POSITION

Operational migration record for known fund ownership/location.

May combine ledger opening balance plus allocation records.

---

# 71. Transaction Type Registry

Recommended backend maintain registry such as:

```text
CLIENT_PAYMENT
VENDOR_FUNDING
VENDOR_REPAYMENT
CLIENT_REFUND
...
```

with metadata:

```text
Category

Requires Approval

Allows Reversal

Requires Client

Requires Vendor

Requires Ad Account

Affects Cash

Affects Ownership

Affects Payable

Affects Receivable
```

---

# 72. CLIENT_PAYMENT Metadata

Example registry rules:

```text
Category: CLIENT

Requires Client: YES

Amount > 0

Currency Required: YES

External Reference: Recommended

Creates Fund Ownership: YES
```

---

# 73. VENDOR_FUNDING Metadata

```text
Requires Vendor: YES

Funding Batch Required: YES

Creates Vendor Payable: YES

Affects Cash: YES
```

---

# 74. VENDOR_REPAYMENT Metadata

```text
Requires Vendor: YES

Open Payable Required: YES

Settlement Source Required: YES

Batch Allocation Required: YES
```

---

# 75. CLIENT_REFUND Metadata

```text
Requires Client: YES

Refundable Balance Required: YES

Approval: Conditional/Required

Affects Cash: YES
```

---

# 76. OWNERSHIP_TRANSFER Metadata

```text
Source Owner Required

Destination Owner Required

Approval Required

Cash Movement:
Usually NO
```

---

# 77. LOCK_FUNDS Metadata

```text
Owner Required

Ad Account Required

Original Allocation Recommended

Cash Movement:
NO

Availability Effect:
YES
```

---

# 78. Transaction Type Permissions

Different types should map to permissions.

Example:

```text
CLIENT_PAYMENT
→ CREATE_CLIENT_PAYMENT

VENDOR_REPAYMENT
→ CREATE_VENDOR_SETTLEMENT

MANUAL_ADJUSTMENT
→ CREATE_MANUAL_ADJUSTMENT
```

---

# 79. Approval Requirement Matrix

Example conceptual:

```text
Client Payment
→ Usually no approval / configurable

Client Refund
→ Conditional

Vendor Settlement
→ Conditional

Vendor Overpayment
→ Required

Cross-Client Transfer
→ Required

Manual Adjustment
→ Required

Write-Off
→ Required

Reversal
→ Required
```

---

# 80. Amount Threshold Approval

Same transaction type may require different approval based on amount.

Example:

```text
Vendor Settlement ₹5,000
→ Finance

Vendor Settlement ₹5,00,000
→ Senior/Admin
```

---

# 81. Transaction Type + Status Rules

Certain statuses valid only for specific types.

Example:

External payment transaction may use:

```text
PAYMENT_PENDING
```

while pure ownership transfer may not need it.

Domain workflow status may live in business record while ledger transaction uses simpler financial status.

---

# 82. Business Record vs Ledger Type

Example:

```text
Vendor Settlement
```

business record contains:

```text
Payable Before

Batch Allocation

Approval

Payment Status
```

Ledger transaction type:

```text
VENDOR_REPAYMENT
```

or compound vendor settlement posting.

---

# 83. Compound Transactions

Some business events require multiple financial effects.

Example vendor overpayment:

```text
Payable reduction
+
Receivable creation
```

Can be one balanced ledger transaction.

This is preferred when all effects are part of same atomic event.

---

# 84. Split Transactions

Use multiple linked transactions when events happen at different times.

Example:

```text
Refund Approved
```

today.

Actual refund paid:

```text
3 days later
```

Approval should not post payment transaction today.

---

# 85. Reservation Events Are Not Final Transactions

Examples:

```text
Refund Reserved

Vendor Settlement Reserved
```

should not be treated as final ledger movement.

---

# 86. Transaction Type Reversal Policy

Every canonical type should specify:

```text
REVERSIBLE

CONDITIONALLY_REVERSIBLE

NON_REVERSIBLE
```

Most posted business transactions should be reversible via correcting transaction.

---

# 87. Non-Reversible Meaning

Even if original event should not be "undone" operationally, correction still must be possible through explicit compensating transaction.

Therefore true immutable event record remains, while financial effect can be compensated.

---

# 88. Reversal of Client Payment

Reverse:

```text
Cash/Bank effect

Client liability effect
```

and handle downstream allocation separately if already used.

---

# 89. Reversal of Vendor Funding

Must:

```text
Reduce vendor payable
```

but only if downstream repayment/usage relationships remain valid.

If not, reversal may need reconciliation/manual workflow.

---

# 90. Reversal of Vendor Repayment

Must restore:

```text
Vendor Payable
```

and reverse any overpayment receivable effect.

---

# 91. Reversal of Refund

Must restore client financial position appropriately.

If cash truly returned back, record actual incoming transaction.

Do not reverse merely because user made mistake in UI without validating external money movement.

---

# 92. Reversal of Ownership Transfer

Creates opposite ownership transfer after approval.

Original history remains.

---

# 93. Transaction Reason Codes

Useful standardized reason codes:

```text
USER_ERROR

BANK_REVERSAL

DUPLICATE_ENTRY

WRONG_CLIENT

WRONG_VENDOR

WRONG_AMOUNT

RECONCILIATION_CORRECTION

CONTRACTUAL_ADJUSTMENT

MIGRATION_CORRECTION

OTHER_APPROVED
```

---

# 94. Transaction Source Types

Possible:

```text
USER_INPUT

SYSTEM

META_SYNC

BANK_IMPORT

PAYMENT_GATEWAY

MIGRATION

RECONCILIATION
```

---

# 95. Transaction Origin Entity

Every transaction should ideally know business origin.

Examples:

```text
ClientPayment ID

VendorFunding ID

VendorSettlement ID

Refund ID

OwnershipTransfer ID
```

---

# 96. Transaction Destination Entity

Not always required, but useful for transfers.

Example:

```text
Client A → Client B
```

---

# 97. Transaction Type Naming

Use uppercase stable machine codes:

```text
VENDOR_REPAYMENT
```

Do not use display labels as database logic.

UI may display:

```text
Vendor Repayment
```

---

# 98. Avoid Ambiguous Type Names

Avoid:

```text
PAYMENT

TRANSFER

ADJUSTMENT
```

without context.

Prefer:

```text
CLIENT_PAYMENT

VENDOR_REPAYMENT

CLIENT_TO_CLIENT_TRANSFER
```

---

# 99. Transaction Category

Each type should also have category for reporting.

Example:

```text
VENDOR_REPAYMENT
Category:
VENDOR
```

---

# 100. Cash Flow Direction

Registry may define:

```text
CASH_IN

CASH_OUT

NON_CASH

CONDITIONAL
```

Example:

```text
CLIENT_PAYMENT → CASH_IN

CLIENT_REFUND → CASH_OUT

CLIENT_TO_CLIENT_TRANSFER → NON_CASH
```

---

# 101. Ownership Effect

Registry may define:

```text
NO_CHANGE

CREATE_OWNER_BALANCE

REDUCE_OWNER_BALANCE

TRANSFER_OWNER
```

---

# 102. Vendor Liability Effect

Registry:

```text
VENDOR_FUNDING → INCREASE

VENDOR_REPAYMENT → DECREASE

VENDOR_PAYABLE_ADJUSTMENT → VARIABLE
```

---

# 103. Vendor Receivable Effect

```text
VENDOR_OVERPAYMENT → INCREASE

VENDOR_RECOVERY → DECREASE

VENDOR_RECEIVABLE_OFFSET → DECREASE
```

---

# 104. Client Receivable Effect

```text
CLIENT_RECEIVABLE_CREATE → INCREASE

CLIENT_RECEIVABLE_SETTLEMENT → DECREASE

CLIENT_RECEIVABLE_WRITE_OFF → DECREASE
```

---

# 105. Locked Fund Effect

```text
LOCK_FUNDS → INCREASE LOCKED

UNLOCK_FUNDS → DECREASE LOCKED

LOCKED_FUND_WRITE_OFF → DECREASE LOCKED / FINAL RESOLUTION
```

---

# 106. Required Entity Validation

Examples:

`CLIENT_PAYMENT`:

```text
client_id required
```

`VENDOR_FUNDING`:

```text
vendor_id required
funding_batch_id required
```

`LOCK_FUNDS`:

```text
ad_account_id required
owner required
```

---

# 107. Currency Validation

All financial transaction types require valid currency.

Cross-entity transaction should validate same currency unless explicit FX type exists.

---

# 108. Amount Validation

Default:

```text
amount_minor > 0
```

Direction comes from type/template.

Do not encode negative transaction amount for normal operations.

---

# 109. Negative Amounts

Avoid user-entered negative values.

Use explicit transaction type or reversal.

Example:

Instead of:

```text
Client Payment -₹5,000
```

use:

```text
CLIENT_PAYMENT_REVERSAL ₹5,000
```

---

# 110. Transaction Idempotency

Every type with posting side effect must support idempotency.

Particularly:

```text
Client Payment

Vendor Funding

Vendor Repayment

Refund

Recovery

Ownership Transfer
```

---

# 111. Duplicate External Reference

Rules may vary by type.

Example:

Same client payment UTR:

```text
Likely duplicate
```

Same generic bank reference across unrelated imports:

may require contextual review.

---

# 112. Transaction Type Reporting

Reports should group by stable categories.

Example:

Cash inflows:

```text
CLIENT_PAYMENT

VENDOR_FUNDING

VENDOR_RECOVERY
```

but should not label all as revenue.

---

# 113. Revenue Reporting Warning

Only transaction types explicitly mapped to revenue accounts should appear in revenue reports.

Vendor funding never.

Client ads fund normally not automatically.

---

# 114. Transaction Type Audit

Audit should log:

```text
Type

Amount

Currency

Origin Entity

Created By

Approved By

Posted By

Reversal Reference
```

---

# 115. Recommended V1 Transaction Types

```text
CLIENT_PAYMENT

CLIENT_PAYMENT_REVERSAL

CLIENT_RECEIVABLE_CREATE

CLIENT_RECEIVABLE_SETTLEMENT

CLIENT_RECEIVABLE_WRITE_OFF

CLIENT_REFUND

CLIENT_REFUND_REVERSAL

CLIENT_LEFTOVER_RETURN

CLIENT_LEFTOVER_REALLOCATION

CLIENT_TO_CLIENT_TRANSFER

CLIENT_TO_AGENCY_TRANSFER

AGENCY_TO_CLIENT_TRANSFER

AGENCY_FUNDING

AGENCY_ALLOCATION

AGENCY_TEMP_CLIENT_FUNDING

AGENCY_RECOVERY

VENDOR_FUNDING

VENDOR_FUNDING_REVERSAL

VENDOR_REPAYMENT

VENDOR_OVERPAYMENT

VENDOR_RECEIVABLE_CREATE

VENDOR_RECOVERY

VENDOR_RECEIVABLE_OFFSET

VENDOR_RECEIVABLE_WRITE_OFF

VENDOR_PAYABLE_ADJUSTMENT

VENDOR_RECEIVABLE_ADJUSTMENT

FUND_ALLOCATION

FUND_DEALLOCATION

AD_ACCOUNT_FUND_ALLOCATION

AD_ACCOUNT_FUND_RETURN

AD_SPEND

LOCK_FUNDS

UNLOCK_FUNDS

LOCKED_FUND_WRITE_OFF

META_REFUND_RECEIVED

META_REFUND_ALLOCATION

UNIDENTIFIED_RECEIPT

UNIDENTIFIED_RECEIPT_CLASSIFICATION

MANUAL_ADJUSTMENT

RECONCILIATION_ADJUSTMENT

ROUNDING_ADJUSTMENT

REVERSAL

OPENING_BALANCE

OPENING_CLIENT_FUNDS

OPENING_VENDOR_PAYABLE

OPENING_VENDOR_RECEIVABLE

OPENING_CLIENT_RECEIVABLE

OPENING_AGENCY_FUND
```

---

# 116. V1 Simplification

Backend does not necessarily need every listed business event as a separate `ledger_transaction.transaction_type`.

Some can exist only in allocation/workflow layer.

Recommended minimum ledger transaction types:

```text
CLIENT_PAYMENT

CLIENT_REFUND

CLIENT_RECEIVABLE_CREATE

CLIENT_RECEIVABLE_SETTLEMENT

VENDOR_FUNDING

VENDOR_REPAYMENT

VENDOR_OVERPAYMENT

VENDOR_RECOVERY

VENDOR_RECEIVABLE_OFFSET

AGENCY_FUNDING

OWNERSHIP_TRANSFER

WRITE_OFF

MANUAL_ADJUSTMENT

REVERSAL

OPENING_BALANCE
```

Operational fund-state events can remain in:

```text
fund_allocation_events
```

---

# 117. Transaction Layer Separation

Recommended final model:

```text
LEDGER TRANSACTIONS
=
Accounting/financial effect
```

```text
ALLOCATION EVENTS
=
Purpose/location/state effect
```

```text
WORKFLOW EVENTS
=
Approval/process state
```

Do not force all three into one transaction table.

---

# 118. Example: Client Payment to Spend

Flow:

```text
CLIENT_PAYMENT
↓
Client Fund Lot
↓
FUND_ALLOCATION
↓
AD_ACCOUNT_FUND_ALLOCATION
↓
AD_SPEND
```

Each stage has distinct meaning.

---

# 119. Example: Restricted Account

```text
AD_ACCOUNT_FUND_ALLOCATION
↓
LOCK_FUNDS
↓
META_REFUND_RECEIVED
↓
META_REFUND_ALLOCATION
```

or:

```text
LOCK_FUNDS
↓
UNLOCK_FUNDS
```

if account restores.

---

# 120. Example: Vendor Lifecycle

```text
VENDOR_FUNDING
↓
Vendor Payable
↓
VENDOR_REPAYMENT
↓
Overpayment?
   ├── No → Payable Reduced
   └── Yes → VENDOR_OVERPAYMENT
                  ↓
          Vendor Receivable
                  ↓
          VENDOR_RECOVERY
```

---

# 121. Example: Client Receivable Lifecycle

```text
AGENCY_TEMP_CLIENT_FUNDING
↓
CLIENT_RECEIVABLE_CREATE
↓
CLIENT_PAYMENT
↓
CLIENT_RECEIVABLE_SETTLEMENT
```

---

# 122. Example: Wrong Entry

```text
CLIENT_PAYMENT
₹20,000
↓
Error Found
↓
REVERSAL
₹20,000
↓
CLIENT_PAYMENT
₹2,000
```

---

# 123. Transaction Type Configuration

Each type can have config:

```text
is_active

requires_approval

requires_attachment

supports_reversal

max_without_approval

allowed_roles
```

Some settings global, some organization-specific.

---

# 124. System-Only Transaction Types

Certain types should not be manually created from frontend.

Examples:

```text
REVERSAL

VENDOR_OVERPAYMENT

META_REFUND_ALLOCATION

CLIENT_PAYMENT_REVERSAL
```

depending on workflow.

Frontend triggers business action; backend generates type.

---

# 125. Manual User-Creatable Types

Examples:

```text
CLIENT_PAYMENT

VENDOR_FUNDING

AGENCY_FUNDING
```

subject to permissions.

---

# 126. Approval-Only Types

Examples:

```text
CLIENT_TO_CLIENT_TRANSFER

CLIENT_TO_AGENCY_TRANSFER

WRITE_OFF

MANUAL_ADJUSTMENT
```

---

# 127. Transaction Type Integrity Rules

System must enforce:

```text
1. Every posted financial event must use a canonical transaction type.

2. Type must determine allowed business context and ledger behavior.

3. Generic ambiguous transaction names should be avoided.

4. Negative amounts should not be used to simulate reversal.

5. Reversal must be an explicit linked event.

6. Client payment must not automatically become revenue.

7. Vendor funding must not become revenue.

8. Vendor repayment cannot exceed payable without generating receivable logic.

9. Ownership changes require explicit ownership-transfer types.

10. Allocation/location movement must remain distinguishable from ownership changes.

11. Locked fund events must not change ownership automatically.

12. Pending reservations must remain separate from posted transactions.

13. Transaction types must validate required entities and currency.

14. Same business event must not post twice.

15. System-generated financial types must not be directly user-forged.
```

---

# 128. Transaction Types Golden Rule

> **Every financial event must have one clear meaning. The transaction type should tell the system what happened, whose money or liability was affected, what validations apply, what approvals are required, how the ledger should post it, and how it can be corrected without rewriting history.**
