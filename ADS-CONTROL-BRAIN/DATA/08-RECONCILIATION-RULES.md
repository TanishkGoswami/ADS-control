# Reconciliation Rules

## Overview

Reconciliation system ka purpose ye verify karna hai ki different data truths ek dusre ke saath logically consistent hain.

System ke three major truths:

```text
META TRUTH
+
LEDGER TRUTH
+
BUSINESS TRUTH
```

Reconciliation in teenon ko compare karega.

Core principle:

> **Mismatch detect hone par system kisi value ko silently overwrite nahi karega. Difference ko explicit reconciliation case ke form me preserve kiya jayega jab tak cause identify aur valid resolution complete na ho.**

---

# 1. Reconciliation Goals

Reconciliation engine ko ensure karna hai ki system answer kar sake:

```text
Meta kya report kar raha hai?

Internal ledger kya keh raha hai?

Internal ownership/allocation kya keh rahi hai?

Kya teeno compatible hain?

Agar nahi, difference kitna hai?

Difference ka reason kya hai?

Kis user ko investigate karna hai?

Kab se unresolved hai?
```

---

# 2. Reconciliation Layers

Primary layers:

```text
1. Financial Ledger Reconciliation

2. Fund Allocation Reconciliation

3. Meta Spend Reconciliation

4. Client Reconciliation

5. Vendor Reconciliation

6. Locked Fund Reconciliation

7. Refund Reconciliation

8. Migration / Opening Balance Reconciliation
```

---

# 3. Reconciliation Case

Har unresolved mismatch ke liye:

```text
ReconciliationCase
```

create kiya jayega.

Case should represent a real unresolved difference, not just notification.

---

# 4. Reconciliation Case Fields

Recommended:

```text
Case ID

Case Type

Entity Type

Entity ID

Expected Amount

Observed Amount

Difference

Currency

Reason Category

Severity

Status

Assigned User

Opened At

Last Checked At

Resolved At

Resolution Type

Resolution Transaction ID
```

---

# 5. Core Formula

General:

```text
Difference
=
Observed Value
-
Expected Value
```

or vice versa, but system-wide sign convention consistent honi chahiye.

Recommended:

```text
difference_minor
=
observed_minor - expected_minor
```

---

# 6. Difference Sign

Example:

Expected:

```text
₹10,000
```

Observed:

```text
₹9,500
```

Then:

```text
Difference = -₹500
```

UI may display:

```text
Short by ₹500
```

but raw sign convention fixed rahe.

---

# 7. Difference Is Not Automatically Loss

Important:

```text
Mismatch
≠
Loss
```

Possible reason:

```text
Timing Delay

Late Meta Reporting

Missing Mapping

Missing Internal Transaction

Duplicate Internal Transaction

Pending Refund

Incorrect Ownership Attribution

Historical Backfill
```

---

# 8. Reconciliation Status

Recommended:

```text
OPEN

UNDER_REVIEW

WAITING_FOR_SYNC

WAITING_FOR_DOCUMENT

WAITING_FOR_EXTERNAL_CONFIRMATION

ADJUSTMENT_PENDING

RESOLVED

CLOSED
```

---

# 9. OPEN

Difference detected.

No valid resolution yet.

---

# 10. UNDER_REVIEW

User assigned and actively investigating.

---

# 11. WAITING_FOR_SYNC

Difference likely caused by stale/external data.

Example:

Meta spend sync failed.

---

# 12. WAITING_FOR_DOCUMENT

Need:

```text
Bank proof

Payment proof

Meta billing proof

Vendor confirmation
```

---

# 13. WAITING_FOR_EXTERNAL_CONFIRMATION

Example:

Meta refund claimed but bank credit not yet verified.

---

# 14. ADJUSTMENT_PENDING

Cause known and approved correction transaction required.

---

# 15. RESOLVED

Underlying discrepancy has been fixed or valid explanation formally recorded.

---

# 16. CLOSED

Resolution confirmed and case administratively completed.

---

# 17. Reconciliation Types

Recommended:

```text
AD_ACCOUNT_POSITION

META_SPEND

CLIENT_FINANCIAL

VENDOR_PAYABLE

VENDOR_RECEIVABLE

CLIENT_RECEIVABLE

FUND_ALLOCATION

LOCKED_FUND

REFUND

LEDGER_SUBLEDGER

OPENING_BALANCE

UNATTRIBUTED_FUND

UNATTRIBUTED_SPEND
```

---

# 18. Account Position Reconciliation

Purpose:

Compare internal tracked Ad Account economic position with reliable external observation where possible.

Inputs may include:

```text
Internal fund allocations

Recognized spend

Meta billing/balance observations

Refunds

Locked state
```

Because Meta billing models vary, external field interpretation must be configurable.

---

# 19. Do Not Blindly Reconcile to One Meta "Balance"

Meta accounts may use different billing models.

Therefore reconciliation formula must depend on:

```text
Prepaid

Postpaid

Credit line

Other supported billing model
```

Do not assume:

```text
Meta Balance = Internal Available Fund
```

universally.

---

# 20. Meta Observation Model

Recommended:

Store external values as:

```text
Observation Type

Observed Value

Currency

Observed At

Source Sync Run

Confidence / Applicability
```

Then reconciliation rule determines whether observation is comparable.

---

# 21. Meta Spend Reconciliation

At basic level:

```text
Meta Spend Fact
vs
Attributed Internal Spend
```

Formula:

```text
Meta Spend
-
Attributed Spend
=
Unattributed Spend
```

---

# 22. Spend Attribution Rule

For each spend fact:

```text
Attributed Amount
<=
Meta Spend
```

If:

```text
Attributed < Meta Spend
```

difference becomes:

```text
UNATTRIBUTED_SPEND
```

---

# 23. Over-Attributed Spend

Invalid:

```text
Meta Spend ₹10,000

Attributed ₹11,000
```

This indicates internal integrity problem.

Severity should be HIGH/CRITICAL depending on amount.

---

# 24. Spend Reconciliation Grain

Recommended grain:

```text
Ad Account

Campaign

Date

Currency
```

where campaign-level data available.

Fallback:

```text
Ad Account

Date

Currency
```

---

# 25. Meta Spend Revisions

Meta may revise historical spend.

Therefore recent period should be re-synced.

Example:

Yesterday initially:

```text
₹10,000
```

Later:

```text
₹10,150
```

Difference:

```text
₹150
```

may require updated attribution and reconciliation.

---

# 26. Recent Spend Reconciliation Window

Configurable window:

```text
Last 3 Days

Last 7 Days
```

for repeated backfill/reconciliation.

Exact duration depends on Meta behavior and volume.

---

# 27. Finalized Historical Period

Older financially settled periods should not be silently rewritten.

If late Meta spend changes them:

```text
Create/Reopen Reconciliation Case
```

and controlled correction.

---

# 28. Client Reconciliation

Goal:

Verify all client money is accounted for.

Conceptual equation:

```text
Client Funds In
=
Current Client-Owned Funds
+
Client Spend Consumed
+
Refunded
+
Valid Ownership Transfers Out
+
Other Approved Final Uses
```

adjusted for reversals/corrections.

---

# 29. Client Funds In

Possible:

```text
Client Ads-Fund Payments

Opening Client Balance

Ownership Transfer Into Client

Recovered Refund Reclassification
```

Do not include service fees unless they became client-owned funds.

---

# 30. Client Current-Owned Funds

May include:

```text
Available Wallet

Allocated but Unspent

Locked

Refund Pending
```

No double counting.

---

# 31. Client Final Uses

Examples:

```text
Attributed Spend

Refunded Amount

Approved Transfer to Another Owner

Approved Write-Off if legally/business valid
```

---

# 32. Client Reconciliation Example

Client paid:

```text
₹20,000
```

Current:

```text
Wallet ₹3,000
Allocated Remaining ₹2,000
Locked ₹1,000
```

Spent:

```text
₹12,000
```

Refunded:

```text
₹2,000
```

Total:

```text
₹3,000 + ₹2,000 + ₹1,000 + ₹12,000 + ₹2,000
= ₹20,000
```

Matched.

---

# 33. Client Difference Example

Client funds in:

```text
₹20,000
```

Accounted:

```text
₹19,500
```

Difference:

```text
₹500
```

Create client reconciliation case.

---

# 34. Client Payment Reversal Reconciliation

If client payment was reversed externally after spend:

reconciliation must consider reversal and any resulting receivable/funding gap.

Do not just show missing ₹ amount.

---

# 35. Client Receivable Reconciliation

Formula:

```text
Receivable Created
-
Settlements
-
Approved Write-Offs
=
Outstanding Receivable
```

Must equal current receivable position.

---

# 36. Vendor Reconciliation

Vendor side should separately reconcile:

```text
Vendor Payable
```

and:

```text
Vendor Receivable
```

Never net them first.

---

# 37. Vendor Payable Formula

Conceptually:

```text
Vendor Funding Posted
+
Opening Vendor Payable
+
Approved Payable Adjustments
-
Valid Vendor Repayments
-
Approved Offsets Reducing Payable
=
Current Vendor Payable
```

---

# 38. Vendor Funding Batch Reconciliation

For each batch:

```text
Original / Posted Funding
-
Batch Repayment Allocations
-
Approved Batch Adjustments
=
Batch Outstanding
```

Sum of batch outstanding should reconcile with vendor payable subledger for same currency.

---

# 39. Vendor Payable vs Ledger

Check:

```text
Vendor Payable Ledger Account
```

vs:

```text
Sum of Open Funding Batch Outstanding
```

Difference:

```text
VENDOR_PAYABLE_SUBLEDGER_MISMATCH
```

---

# 40. Vendor Receivable Formula

```text
Receivable Created
-
Recoveries
-
Approved Offsets
-
Approved Write-Offs
=
Current Vendor Receivable
```

---

# 41. Vendor Receivable Example

Overpayment created:

```text
₹10,000
```

Recovery:

```text
₹4,000
```

Offset:

```text
₹2,000
```

Outstanding:

```text
₹4,000
```

---

# 42. Vendor Payable + Receivable Together

Example:

```text
Payable ₹50,000

Receivable ₹10,000
```

Both can be correct simultaneously.

Reconciliation must test each separately.

---

# 43. No Silent Netting

Do not reconcile only to:

```text
Net ₹40,000 payable
```

because this could hide overpayment.

---

# 44. Vendor Settlement Reconciliation

For each posted settlement:

```text
Payment Amount
=
Valid Repayment
+
Excess Amount
```

This must hold exactly.

---

# 45. Settlement Batch Allocation Rule

For a posted vendor settlement:

```text
SUM(batch allocations)
=
Valid Repayment
```

If not:

Critical reconciliation/integrity issue.

---

# 46. Vendor Overpayment Rule

If:

```text
Payment > Valid Payable
```

then:

```text
Excess
=
Payment - Valid Repayment
```

and a matching Vendor Receivable must exist.

---

# 47. Missing Vendor Receivable

If overpayment exists but no receivable record:

```text
CRITICAL
```

because money may be forgotten.

---

# 48. Fund Allocation Reconciliation

For each Fund Lot:

```text
Original Amount
=
Current Active States
+
Final Consumed/Resolved States
```

with no overlap.

---

# 49. Fund Lot Integrity Equation

Conceptually:

```text
Original
=
Available
+
Reserved
+
Allocated Remaining
+
Locked
+
Refund Pending
+
Consumed
+
Refunded
+
Transferred Out
+
Written Off
```

taking reversals/returns into account.

---

# 50. Double-Count Detection

If same amount appears in both:

```text
Available
```

and:

```text
Allocated
```

reconciliation should flag.

---

# 51. Allocation Overrun

If:

```text
Total Allocated > Source Eligible Amount
```

critical integrity case.

---

# 52. Consumption Overrun

If:

```text
Consumed > Allocation
```

critical.

---

# 53. Unresolved Funding Gap

If:

```text
Spend > Known Allocation
```

difference becomes funding gap.

Create case until source identified.

---

# 54. Locked Fund Reconciliation

For every locked fund:

Need reconcile:

```text
Original Locked Amount

Recovered Amount

Refunded Amount

Unlocked Amount

Written-Off Amount

Remaining Locked
```

---

# 55. Locked Fund Formula

Conceptually:

```text
Original Locked
=
Remaining Locked
+
Recovered/Unlocked
+
Refunded/Returned
+
Written Off
```

---

# 56. Locked Fund Owner Reconciliation

Sum of owner-level locked amounts for Ad Account must equal total tracked locked amount for that same scope.

---

# 57. Partial Recovery Reconciliation

Example:

Locked:

```text
₹10,000
```

Recovered:

```text
₹6,000
```

Remaining:

```text
₹4,000
```

Any other result requires investigation.

---

# 58. Account Restored But Locked Still Open

Operational status:

```text
ACTIVE
```

does not automatically mean:

```text
Locked = 0
```

Reconciliation should keep case open until funds verified.

---

# 59. Refund Reconciliation

Client refund workflow compares:

```text
Requested

Approved

Reserved

Paid

Externally Confirmed

Ledger Posted
```

---

# 60. Refund Posted vs External Payment

If system says refund posted but bank proof/payment confirmation fails:

case required.

---

# 61. External Refund Completed but Ledger Missing

If finance proves money left bank but internal refund not posted:

create reconciliation case.

Do not manually edit wallet.

---

# 62. Partial Client Refund

Formula:

```text
Approved Refund
=
Paid Amount
+
Remaining Pending
+
Cancelled Amount if explicitly cancelled
```

---

# 63. Meta Refund Reconciliation

Compare:

```text
Expected/Detected Meta Refund

Actual External Receipt

Internal Ledger Receipt

Allocation to Original Owners
```

---

# 64. Meta Refund Ownership Distribution

If refund received:

```text
SUM(owner refund allocations)
=
Meta Refund Received
```

unless some amount remains unattributed.

Unattributed portion must remain explicit.

---

# 65. Ledger Reconciliation

Core ledger health:

For every posted transaction:

```text
Total Debit = Total Credit
```

---

# 66. Ledger Orphan Checks

Detect:

```text
Posted transaction with zero entries

Ledger entry without valid transaction

Entry currency mismatch

Deleted/missing ledger account

Invalid reversal reference
```

These are critical integrity errors.

---

# 67. Ledger vs Balance Cache

If cached balance exists:

```text
Cached Balance
=
Recomputed Ledger Balance
```

Mismatch means system/cache issue.

Ledger wins.

---

# 68. Ledger vs Client Subledger

Client funds liability totals should reconcile with client current ownership + resolved consumption according to accounting design.

---

# 69. Ledger vs Vendor Batch Subledger

Vendor payable ledger should reconcile with batch outstanding.

---

# 70. Ledger vs Receivable Subledger

Vendor/client receivable ledger should match detailed receivable outstanding.

---

# 71. Opening Balance Reconciliation

Migrated opening balances must carry verification state.

Possible:

```text
VERIFIED

PARTIALLY_VERIFIED

UNVERIFIED
```

---

# 72. Opening Balance Case

If opening vendor payable entered:

```text
₹1,00,000
```

but supporting records indicate:

```text
₹95,000
```

difference:

```text
₹5,000
```

remains reconciliation issue.

---

# 73. Migration Does Not Need Fake History

Do not fabricate historical transactions simply to make numbers match.

Use explicit opening balance with confidence status.

---

# 74. Reconciliation Reason Categories

Recommended:

```text
TIMING_DIFFERENCE

STALE_EXTERNAL_DATA

MISSING_INTERNAL_TRANSACTION

DUPLICATE_INTERNAL_TRANSACTION

MISSING_MAPPING

INCORRECT_MAPPING

META_BACKFILL

PAYMENT_REVERSAL

REFUND_PENDING

EXTERNAL_PAYMENT_UNCONFIRMED

OWNERSHIP_MISMATCH

CURRENCY_MISMATCH

OPENING_BALANCE_UNVERIFIED

MANUAL_ENTRY_ERROR

ROUNDING

UNKNOWN
```

---

# 75. Timing Difference

Example:

Meta spend updated but internal worker not yet processed.

Case may stay:

```text
WAITING_FOR_SYNC
```

---

# 76. Stale Data

If source stale beyond threshold:

Do not treat difference as final mismatch until refreshed where appropriate.

---

# 77. Missing Mapping

Meta spend exists but campaign has no client/job mapping.

Reason:

```text
MISSING_MAPPING
```

---

# 78. Incorrect Mapping

Spend attributed to wrong client/job.

Resolution:

```text
Correct mapping
+
Recalculate attribution
+
Financial adjustment if already settled
```

---

# 79. Manual Entry Error

Example:

Client payment entered ₹50,000 instead of ₹5,000.

Resolution:

```text
Reversal
+
Correct Transaction
```

not direct edit.

---

# 80. Unknown Cause

Use:

```text
UNKNOWN
```

when investigation incomplete.

Do not invent cause.

---

# 81. Tolerance

Some reconciliation types may support tolerance.

Example:

```text
₹1 rounding
```

or:

```text
small percentage
```

But tolerance must be explicit and type-specific.

---

# 82. Financial Ownership Tolerance

For core ledger/client/vendor money:

Recommended:

```text
Tolerance = 0
```

in minor units unless legitimate rounding/FX is involved.

---

# 83. Meta Reporting Tolerance

If Meta external comparison includes timing/rounding differences, configurable tolerance may be allowed.

---

# 84. Tolerance Must Not Hide Large Differences

Example:

Do not use broad:

```text
5% tolerance
```

for vendor payable.

---

# 85. Reconciliation Severity

Severity based on:

```text
Amount

Age

Type

Financial Risk

Operational Impact
```

---

# 86. Example Severity

```text
₹100 timing difference
fresh
→ INFO/WARNING
```

```text
₹1,00,000 vendor receivable missing
→ CRITICAL
```

---

# 87. Aging

Every case tracks age:

```text
NOW - opened_at
```

Useful buckets:

```text
0–1 Day

2–3 Days

4–7 Days

8–15 Days

16–30 Days

31+ Days
```

---

# 88. Aging Escalation

Example:

```text
Day 1 → WARNING

Day 7 → HIGH

Day 30 → CRITICAL
```

depending on case type.

---

# 89. Assigned Owner

Cases can auto-assign:

```text
Ad Account/Spend → Ads Manager + Finance

Client Financial → Finance / Client Manager

Vendor → Finance Owner

Meta Sync → Admin/Integration Owner
```

---

# 90. Reconciliation Schedule

Recommended initial design:

```text
Near-real-time checks after key financial posting

Periodic Meta spend reconciliation

Nightly full reconciliation

Manual reconciliation on demand
```

Exact schedule later worker document me.

---

# 91. Post-Transaction Reconciliation

After high-risk posting:

```text
Vendor Settlement

Refund

Ownership Transfer

Receivable Recovery
```

run immediate internal consistency validation.

---

# 92. Nightly Reconciliation

Nightly job can verify:

```text
Ledger balance health

Vendor payable vs batches

Receivable balances

Client ownership totals

Fund allocation conservation

Locked fund conservation

Spend attribution gaps
```

---

# 93. Meta Reconciliation Frequency

Meta-related checks depend on latest valid sync.

Do not reconcile against stale external data as if current.

---

# 94. Manual Reconciliation

Authorized user can trigger:

```text
Reconcile Client

Reconcile Vendor

Reconcile Ad Account
```

Backend should enqueue a job.

---

# 95. Idempotent Reconciliation

Repeated same reconciliation should not create duplicate open cases for same unresolved condition.

Use deduplication key.

---

# 96. Case Deduplication

Conceptual:

```text
Case Type
+
Entity ID
+
Currency
+
Mismatch Episode
```

---

# 97. Case Update

If same mismatch remains:

Update:

```text
Observed Value

Difference

Last Checked At

Age
```

rather than creating duplicate case.

---

# 98. New Mismatch Episode

If case resolves, later same issue reappears:

Create new case.

---

# 99. Resolution Types

Recommended:

```text
SYNC_CAUGHT_UP

MAPPING_CORRECTED

TRANSACTION_REVERSED

MISSING_TRANSACTION_POSTED

REFUND_CONFIRMED

RECOVERY_POSTED

OWNERSHIP_CORRECTED

ADJUSTMENT_POSTED

WRITE_OFF_APPROVED

FALSE_POSITIVE

EXPLAINED_NO_FINANCIAL_CHANGE
```

---

# 100. Resolution Must Preserve Evidence

Store:

```text
Resolution Notes

Resolved By

Resolved At

Related Transaction

Related Mapping Change

Supporting Attachment
```

---

# 101. False Positive

Use only when condition truly invalid.

Do not use false positive to hide unresolved difference.

---

# 102. Adjustment Resolution

If adjustment needed:

Case status:

```text
ADJUSTMENT_PENDING
```

Then approved transaction posts.

After re-run:

```text
Difference = 0
```

Case can resolve.

---

# 103. Write-Off Resolution

Write-off resolves financial exposure only after approved write-off transaction.

Case should link it.

---

# 104. Case Cannot Resolve Just by Note

Adding:

```text
"Checked, okay"
```

is not enough if difference still exists.

---

# 105. Case Auto-Resolution

Allowed when deterministic condition clears.

Example:

```text
Meta stale data refreshes
and difference becomes 0
```

Auto-resolve with reason:

```text
SYNC_CAUGHT_UP
```

---

# 106. Financial Case Auto-Resolution

Can auto-resolve when canonical balances mathematically match after valid posting.

Audit event still required.

---

# 107. Reconciliation Evidence

Case may link:

```text
Ledger Transactions

Spend Facts

Fund Allocations

Client Payments

Vendor Settlements

Attachments

Sync Runs
```

---

# 108. Reconciliation Timeline

Track:

```text
Detected

Assigned

Value Changed

Reason Updated

Evidence Added

Adjustment Requested

Resolved

Closed
```

---

# 109. Reconciliation Comments

Users can add investigation notes.

Notes do not alter financial state.

---

# 110. Reconciliation Permissions

Possible:

```text
VIEW_RECONCILIATION

CREATE_MANUAL_RECONCILIATION

ASSIGN_RECONCILIATION

UPDATE_RECONCILIATION_REASON

RESOLVE_RECONCILIATION

CREATE_RECONCILIATION_ADJUSTMENT

APPROVE_RECONCILIATION_ADJUSTMENT
```

---

# 111. Reconciliation Dashboard

Top metrics:

```text
Open Cases

Critical Cases

Total Unresolved Difference by Currency

Aged Cases

Waiting for Sync

Adjustment Pending
```

---

# 112. Unresolved Difference Label

Do not call:

```text
Loss
```

unless confirmed.

Use:

```text
Unresolved Difference
```

---

# 113. Currency Separation

Reconciliation totals grouped by currency.

Do not sum:

```text
₹ + $
```

without explicit conversion.

---

# 114. Reconciliation Report

Columns:

```text
Case ID

Type

Entity

Expected

Observed

Difference

Currency

Reason

Age

Severity

Assigned To

Status
```

---

# 115. Client Reconciliation Drill-Down

Show:

```text
Funds In

Spend

Current Available

Current Allocated

Locked

Refunded

Ownership Transfers

Difference
```

---

# 116. Vendor Reconciliation Drill-Down

Show separately:

```text
Funding

Repayments

Payable

Overpayments

Recoveries

Receivable

Batch Outstanding

Difference
```

---

# 117. Ad Account Reconciliation Drill-Down

Show:

```text
Internal Allocations by Owner

Attributed Spend

Unattributed Spend

Locked Funds

External Observations

Freshness

Difference
```

---

# 118. Locked Fund Drill-Down

Show:

```text
Original Locked

Owner Breakdown

Recovered

Refunded

Unlocked

Written Off

Remaining
```

---

# 119. Reconciliation and Alerts

Open cases may generate alerts.

Example:

```text
Case:
Vendor Payable Mismatch ₹50,000
```

Alert:

```text
VENDOR_RECONCILIATION_MISMATCH
```

Alert and case are separate.

---

# 120. Alert Resolution vs Case Resolution

Dismissing alert does not close reconciliation case.

Case resolution may auto-resolve linked alert.

---

# 121. Reconciliation and Approvals

If case needs:

```text
Manual Adjustment

Write-Off

Ownership Transfer
```

create Approval Request.

---

# 122. Reconciliation and Audit

Every:

```text
Reason Change

Assignment

Resolution

Adjustment

Write-Off
```

must be audited.

---

# 123. Reconciliation With Closed Entity

Closed Client/Vendor/Ad Account can still have open reconciliation case.

Operational closure does not close finance issues.

---

# 124. Financial Closure Rule

Entity cannot become financially settled if material open reconciliation exists.

---

# 125. Reopening Financial Closure

Late spend/refund/reversal may reopen financial settlement.

Example:

```text
Client financially settled
↓
Late Meta spend appears
↓
New Reconciliation Case
↓
Financial Status → CLOSURE_PENDING
```

---

# 126. Late Vendor Bank Reversal

If vendor repayment later reverses externally:

Need:

```text
Payment Reversal Transaction
```

Vendor payable may reopen.

Reconciliation reflects it.

---

# 127. Late Client Bank Reversal

Same for client receipt.

May create client receivable/funding gap after spend.

---

# 128. Deleted Source Protection

Reconciliation-linked financial/source records should not be hard-deleted.

---

# 129. Reconciliation Snapshot

Each check run may store calculation metadata:

```text
Input IDs

Input timestamps

Expected formula version

Observed values

Rule version
```

Useful for explaining past cases.

---

# 130. Rule Versioning

Important reconciliation rules should have version identifiers.

Example:

```text
CLIENT_RECON_V1
```

If logic changes later, historical cases remain explainable.

---

# 131. Deterministic Rules

V1 reconciliation should be deterministic.

Avoid AI deciding whether money matches.

AI may later summarize investigation, but not define financial truth.

---

# 132. Reconciliation Engine Input Quality

If required input missing:

Result should be:

```text
INSUFFICIENT_DATA
```

or case waiting state.

Do not fabricate expected value.

---

# 133. Unknown External Observation

If Meta unavailable:

Do not set observed:

```text
0
```

Use:

```text
UNKNOWN
```

and status:

```text
WAITING_FOR_SYNC
```

---

# 134. Zero vs Unknown

Critical:

```text
0 = verified zero

NULL/unknown = not known
```

Reconciliation engine must preserve this distinction.

---

# 135. Historical Reconciliation

Need ability to reconcile:

```text
As of Date
```

for month-end or investigation.

This requires transaction dates and temporal mappings.

---

# 136. Current vs Historical Mapping

For spend on 5 Sep:

Use job/campaign mapping effective on 5 Sep.

Not today's mapping.

---

# 137. Reconciliation Performance

Large reconciliation jobs should run in workers.

Use incremental checks where possible.

---

# 138. Incremental Reconciliation

Trigger only affected entities after events.

Example:

Client Payment posted:

```text
Reconcile Client A
```

Vendor Settlement posted:

```text
Reconcile Vendor RAM
```

---

# 139. Full Reconciliation

Nightly/full job covers all active relevant entities to catch missed issues.

---

# 140. Reconciliation Failure

If reconciliation worker fails:

Create system alert.

Do not assume entities reconciled.

---

# 141. Reconciliation Run

Recommended durable entity:

```text
ReconciliationRun
```

optional.

Fields:

```text
Run ID

Type

Started At

Completed At

Entities Checked

Cases Created

Cases Updated

Errors
```

---

# 142. Reconciliation Priority

Recommended:

```text
1. Ledger integrity

2. Vendor payable/receivable

3. Client ownership/funds

4. Locked funds

5. Refunds

6. Spend attribution

7. Meta observations
```

because internal financial consistency is foundational.

---

# 143. V1 Must-Have Reconciliation Rules

```text
Ledger Debit = Credit

Posted transaction has entries

Vendor Payable vs Funding Batches

Vendor Settlement Amount = Repayment + Excess

Overpayment must create receivable

Vendor Receivable Outstanding

Client Receivable Outstanding

Fund Lot Conservation

Allocation Cannot Exceed Source

Spend Attribution <= Meta Spend

Unattributed Spend Detection

Locked Fund Conservation

Client Refund Consistency

Client Ownership Reconciliation

Duplicate Financial Transaction Detection
```

---

# 144. V1 Should-Have

```text
Ad Account External Position Reconciliation

Meta Refund Reconciliation

Historical Month-End Reconciliation

Opening Balance Verification

Automated Case Escalation

Rule Version Tracking
```

---

# 145. Future Reconciliation

Potential:

```text
Bank Reconciliation

Payment Gateway Reconciliation

Google Ads Reconciliation

Cross-Platform Spend Reconciliation

Invoice Reconciliation

Automated Evidence Matching
```

---

# 146. Reconciliation Integrity Rules

System must enforce:

```text
1. Reconciliation must compare defined truths, not overwrite one with another.

2. Difference must always preserve expected, observed and currency.

3. Unknown data must not be treated as zero.

4. A mismatch is not automatically a loss.

5. Vendor payable and receivable must reconcile separately.

6. Client wallet and client receivable must reconcile separately.

7. Same fund cannot be counted in multiple current-state buckets.

8. Spend attribution cannot exceed Meta spend.

9. Fund allocation cannot exceed source funds.

10. Vendor settlement valid repayment plus excess must equal payment amount.

11. Vendor overpayment must have matching receivable.

12. Locked fund recovery must preserve original owner.

13. Financial cases cannot be resolved merely by dismissing alerts.

14. Posted financial corrections must use transactions, reversals or approved adjustments.

15. Reconciliation must use historical mappings for historical periods.

16. Stale external data must be identified before final mismatch conclusions.

17. Duplicate open cases for same active mismatch should be prevented.

18. Every reconciliation resolution must remain auditable.
```

---

# 147. Reconciliation Golden Rule

> **Reconciliation exists to expose disagreement, not hide it. Whenever Meta data, ledger records and business ownership do not align, the system must preserve the difference, identify what is known and unknown, assign responsibility for investigation, and only close the issue after a traceable business or financial resolution makes the position explainable again.**
