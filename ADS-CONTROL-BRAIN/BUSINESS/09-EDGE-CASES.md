# Edge Cases

## Overview

Ye document system ke unusual, risky aur non-standard business scenarios define karta hai.

Normal flows generally simple hote hain:

```text
Fund Received
↓
Allocated
↓
Spent
↓
Settled
```

Real business operations me situations aa sakti hain jahan:

```text
Account restrict ho jaye

Spend expected se zyada ho jaye

Client fund leftover ho

Vendor ko extra payment chala jaye

Same transaction twice enter ho

Meta data aur internal ledger mismatch kare

Ownership unknown ho

Refund partial mile

Client aur vendor funds mix ho jayein
```

System ko in situations me guess nahi karna chahiye.

Core rule:

> **When information is uncertain, the system should preserve the uncertainty instead of inventing an answer.**

---

# CASE-001: Fund Added and Account Restricted Before Spend

Scenario:

```text
AD1 Fund Added:
₹2,000

Actual Spend:
₹0

Later:
Account Restricted
```

Expected behavior:

```text
Available:
₹0

Locked:
₹2,000
```

Ownership unchanged.

Example:

```text
Owner:
Client A

Location:
AD1

Status:
LOCKED
```

System must not:

```text
Delete fund

Move automatically to another account

Mark as spent

Mark as agency balance
```

Alert:

```text
AD_ACCOUNT_RESTRICTED
```

---

# CASE-002: Account Restricted After Partial Spend

Scenario:

```text
Client Allocation:
₹5,000

Spend:
₹3,200

Remaining:
₹1,800
```

Then account restricted.

Expected:

```text
Spent:
₹3,200

Locked:
₹1,800
```

Client ownership remains.

---

# CASE-003: Account Restored With Same Balance

Before:

```text
Locked:
₹2,000
```

Account restored.

Meta/internal data verifies balance.

Expected:

```text
Locked:
₹0

Available:
₹2,000
```

Create:

```text
ACCOUNT_RESTORED
FUNDS_UNLOCKED
```

events.

---

# CASE-004: Account Restored but Balance Does Not Match

Expected locked:

```text
₹5,000
```

After restoration visible/tracked:

```text
₹4,500
```

Difference:

```text
₹500
```

Expected:

```text
Recovered:
₹4,500

Unresolved:
₹500
```

Create:

```text
RECONCILIATION_MISMATCH
```

Do not mark full ₹5,000 available.

---

# CASE-005: Client Budget Is ₹1,000 but Spend Is ₹700

Scenario:

```text
Client Budget:
₹1,000

Allocated:
₹1,000

Spend:
₹700
```

Expected:

```text
Unused:
₹300
```

Default owner:

```text
Client
```

Status:

```text
UNRESOLVED
```

until moved/refunded.

---

# CASE-006: Client Leftover Used for Same Client Again

Client A leftover:

```text
₹300
```

New Client A job created.

Expected:

```text
JOB-001 Leftover
↓
Client A Wallet
↓
JOB-002 Allocation
```

Ownership remains:

```text
Client A
```

---

# CASE-007: Client A Leftover Used for Client B

Scenario:

```text
Client A Leftover:
₹300
```

Need to use for Client B.

Expected:

```text
Explicit Ownership/Transfer Resolution
```

Required data:

```text
Source Client:
A

Destination Client:
B

Amount:
₹300

Reason

Approval

Transaction IDs
```

System must not silently reclassify.

---

# CASE-008: Client Leftover Automatically Treated as Agency Money

This should be considered invalid unless policy explicitly allows it.

Scenario:

```text
Client A Leftover:
₹500
```

Incorrect:

```text
Agency Balance +₹500
```

without transaction.

Expected:

```text
Client A Unused Balance:
₹500
```

until authorized ownership change.

---

# CASE-009: Client Pays More Than Current Campaign Requirement

Scenario:

```text
Campaign Budget:
₹10,000

Client Payment:
₹15,000
```

Expected:

```text
Campaign Allocation:
₹10,000

Client Wallet Free:
₹5,000
```

Do not automatically use excess elsewhere.

---

# CASE-010: Client Pays Less Than Campaign Requirement

Scenario:

```text
Campaign Budget:
₹20,000

Client Payment:
₹12,000
```

Expected:

```text
Funded:
₹12,000

Funding Gap:
₹8,000
```

Status:

```text
PARTIALLY_FUNDED
```

If campaign continues through agency funding, separate transaction required.

---

# CASE-011: Campaign Overspends Client Allocation

Scenario:

```text
Allocated:
₹10,000

Actual Spend:
₹10,500
```

Expected:

```text
Overspend:
₹500
```

Create:

```text
FUNDING_GAP
```

Possible resolution:

```text
Additional Client Payment

Agency Funding

Approved Adjustment
```

Do not silently consume another client's funds.

---

# CASE-012: Same Ad Account Has Multiple Clients

Example:

```text
AD1

Client A:
₹5,000

Client B:
₹4,000

Agency:
₹1,000
```

Total:

```text
₹10,000
```

Spend attribution must happen at campaign/job level.

Account total spend alone is insufficient.

---

# CASE-013: Unattributed Spend

Scenario:

```text
AD1 Total Spend:
₹10,000

Mapped Spend:
₹9,400
```

Difference:

```text
₹600
```

Expected:

```text
Unattributed Spend:
₹600
```

Create:

```text
UNATTRIBUTED_SPEND
```

Do not randomly assign to client.

---

# CASE-014: Client Campaign Moves to Another Ad Account

Scenario:

```text
JOB-001 initially:
AD1
```

AD1 restricted.

Campaign continues on:

```text
AD2
```

Expected:

```text
Old assignment retained in history

New assignment created
```

Locked funds in AD1 remain separately tracked.

---

# CASE-015: Replacement Funding Used After Restriction

Client has:

```text
₹2,000 locked in AD1
```

Agency adds:

```text
₹2,000
```

to AD2.

Expected:

```text
Client Locked:
₹2,000

Agency Temporary Funding:
₹2,000
```

Do not merge both balances.

---

# CASE-016: Locked Client Fund Later Recovered

Original:

```text
Client Locked:
₹2,000
```

Agency already funded replacement.

Later recovery:

```text
₹2,000
```

Expected:

```text
Recovered Client Fund
```

Then explicit settlement may repay Agency.

Do not automatically offset without transaction.

---

# CASE-017: Vendor Gives ₹1,00,000 and Fully Settles

Funding:

```text
₹1,00,000
```

Repayment:

```text
₹20,000 × 5
```

Expected:

```text
Vendor Payable:
₹0

Funding Batch:
SETTLED
```

---

# CASE-018: Vendor Fully Settled but Extra ₹10,000 Paid

Scenario:

```text
Vendor Payable:
₹0

Payment:
₹10,000
```

Expected:

```text
Valid Repayment:
₹0

Vendor Receivable:
₹10,000
```

This amount must remain open.

---

# CASE-019: Vendor Payable ₹20,000 but ₹30,000 Paid

Expected:

```text
Valid Repayment:
₹20,000

Overpayment:
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

# CASE-020: Vendor Has Both Payable and Receivable

Scenario:

```text
Vendor Payable:
₹50,000

Vendor Receivable:
₹10,000
```

System should show both separately.

Optional net exposure:

```text
₹40,000 Payable
```

may be displayed, but underlying values must remain visible.

No silent netting.

---

# CASE-021: Vendor Receivable Offset Against New Funding

Existing:

```text
Vendor Receivable:
₹10,000
```

New funding:

```text
₹2,00,000
```

Approved offset:

```text
Gross Funding:
₹2,00,000

Receivable Offset:
₹10,000

New Payable:
₹1,90,000
```

Explicit adjustment transaction required.

---

# CASE-022: Same Vendor Has Multiple Funding Batches

Example:

```text
RF-001:
₹1,00,000

RF-002:
₹2,00,000
```

Payment:

```text
₹50,000
```

System should apply according to configured batch settlement policy.

Default:

```text
FIFO
```

---

# CASE-023: Payment Entered Twice by Double Click

User creates:

```text
Vendor Payment:
₹20,000
```

Button clicked twice.

Expected:

```text
Only one transaction posted
```

Use:

```text
Idempotency Key
```

Duplicate request rejected.

---

# CASE-024: Same UTR Used Twice

Two transactions use same:

```text
UTR-12345
```

Expected:

```text
Duplicate Reference Warning
```

Depending on transaction type:

```text
Block
or
Require Review
```

---

# CASE-025: Two Finance Users Settle Same Vendor Simultaneously

Vendor payable:

```text
₹20,000
```

User A and User B both initiate:

```text
₹20,000
```

Expected:

Database transaction/locking prevents total ₹40,000 valid repayment.

One request should succeed first.

Second should re-evaluate payable.

---

# CASE-026: Vendor Payment Approved but Bank Transfer Fails

Expected:

```text
Status:
FAILED
```

Vendor payable should not be reduced if payment did not actually complete.

---

# CASE-027: Payment Approved but Pending

Expected:

```text
Gross Payable:
₹50,000

Pending Settlement:
₹20,000

Posted Repayment:
₹0
```

Do not treat pending as completed repayment.

---

# CASE-028: Wrong Vendor Payment Amount Was Posted

Recorded:

```text
₹20,000
```

Actual:

```text
₹2,000
```

Expected:

```text
Original:
₹20,000

Reversal:
₹20,000

Correct Entry:
₹2,000
```

Never overwrite original posted transaction.

---

# CASE-029: Wrong Client Payment Entered

Same rule:

```text
Original transaction
↓
Reversal
↓
Correct transaction
```

---

# CASE-030: Wrong Client Assigned to Transaction

Posted financial transaction linked incorrectly.

Expected:

Use correction/reclassification transaction according to ledger rules.

Do not silently rewrite history if financial effect already posted.

---

# CASE-031: Meta Sync Fails

Possible:

```text
API Error
Expired Token
Rate Limit
Network Error
```

Expected:

```text
Last Known Data retained

Status:
STALE
```

Show:

```text
Last Successful Sync
```

Do not delete assets.

---

# CASE-032: Meta API Temporarily Returns No Accounts

Expected:

Do not instantly assume all accounts deleted.

Use sync reconciliation/grace period.

Possible state:

```text
NOT_SEEN_IN_LATEST_SYNC
```

not immediate hard deletion.

---

# CASE-033: Ad Account Name Changes

Old:

```text
AD1
```

New Meta name:

```text
Scaling Account 01
```

Identity remains:

```text
Meta Ad Account ID
```

History should preserve old name where useful.

---

# CASE-034: Business Portfolio Name Changes

Same principle.

Meta Business ID remains canonical.

---

# CASE-035: Same Ad Account Found Through Multiple Business Relationships

Possible due to access/shared relationships.

Expected:

```text
One canonical Ad Account
```

plus multiple relationship records if needed.

Do not duplicate financial balances.

---

# CASE-036: Ad Account Moves Between Portfolios

Old:

```text
BP1 → AD1
```

New:

```text
BP2 → AD1
```

Expected:

```text
Current mapping updated

Mapping history preserved
```

Old transactions still retain historical context.

---

# CASE-037: Ad Account Is No Longer Returned by Meta

Do not hard delete.

Possible:

```text
ARCHIVED
ACCESS_LOST
UNRESOLVED
```

Historical financial records remain.

---

# CASE-038: Account Status Unknown

If API stale/unavailable:

Use:

```text
UNKNOWN
```

or:

```text
STALE
```

Do not guess:

```text
ACTIVE
```

or:

```text
RESTRICTED
```

---

# CASE-039: Meta Reports Different Balance Than Internal Ledger

Example:

```text
Internal:
₹10,000

Meta:
₹9,700
```

Expected:

```text
Difference:
₹300
```

Create:

```text
RECONCILIATION_CASE
```

Do not automatically overwrite internal ledger.

---

# CASE-040: Internal Balance Higher Than Meta

Same reconciliation workflow.

Investigate:

```text
Spend timing

Fees

Refunds

Manual error

Meta reporting delay

Missing transaction
```

---

# CASE-041: Meta Balance Higher Than Internal

Possible reasons:

```text
Missing top-up

Meta credit

Refund

Unrecorded balance
```

Create reconciliation case.

---

# CASE-042: Unknown Fund Appears in Ad Account

Example:

Meta/account balance implies:

```text
₹5,000
```

but internal ownership only:

```text
₹4,000
```

Expected:

```text
Unattributed Fund:
₹1,000
```

Do not assign to Agency automatically.

---

# CASE-043: Unknown Ownership

Use:

```text
Owner:
UNATTRIBUTED
```

until reviewed.

This is safer than guessing.

---

# CASE-044: Unknown Fund Source

Owner may be known but source unknown.

Example:

```text
Owner:
Agency

Source:
UNKNOWN
```

System should allow incomplete legacy state with explicit uncertainty.

---

# CASE-045: Old Business Data Migrated Without Full History

Example:

Known:

```text
AD1 Balance:
₹25,000
```

but detailed origin unavailable.

Use:

```text
OPENING_BALANCE
```

with confidence:

```text
UNVERIFIED
or
PARTIALLY_VERIFIED
```

---

# CASE-046: Opening Balance Has Mixed Ownership

Example:

```text
AD1:
₹20,000
```

Known estimate:

```text
Client A ₹10,000
Agency ₹5,000
Unknown ₹5,000
```

Store each separately.

Do not force full ownership classification.

---

# CASE-047: Client Is Closed but Has Remaining Wallet Balance

Scenario:

```text
Client Status:
CLOSED

Wallet:
₹5,000
```

Expected:

```text
FINANCIAL_CLOSURE_PENDING
```

Do not hard close financially.

---

# CASE-048: Client Closed but Has Locked Fund

Same:

```text
Client Operational Status:
CLOSED

Financial Status:
OPEN
```

until resolution.

---

# CASE-049: Vendor Closed but Receivable Exists

Vendor:

```text
CLOSED
```

but:

```text
Vendor Receivable:
₹10,000
```

Financial case remains open.

Vendor historical entity retained.

---

# CASE-050: Vendor Closed but Payable Exists

Do not allow silent closure.

Show:

```text
FINANCIAL_CLOSURE_PENDING
```

---

# CASE-051: Refund Requested but Not Sent

Status:

```text
REFUND_PENDING
```

Client wallet available amount should reflect reserved refund appropriately.

Do not mark:

```text
REFUNDED
```

until complete.

---

# CASE-052: Refund Fails

Expected:

```text
Refund Status:
FAILED
```

Money remains unresolved/available according to ledger state.

---

# CASE-053: Partial Refund

Refund expected:

```text
₹5,000
```

Only:

```text
₹3,000
```

completed.

Expected:

```text
Refunded:
₹3,000

Pending:
₹2,000
```

---

# CASE-054: Meta Refund Is Less Than Locked Fund

Locked:

```text
₹10,000
```

Refund:

```text
₹9,500
```

Expected:

```text
Recovered:
₹9,500

Unresolved:
₹500
```

Create reconciliation case.

---

# CASE-055: Meta Refund Is More Than Expected

Expected:

```text
₹10,000
```

Refund/Credit:

```text
₹10,500
```

Extra:

```text
₹500
```

should remain:

```text
UNATTRIBUTED_CREDIT
```

until classified.

---

# CASE-056: Client Refund Comes From Agency Money Temporarily

Client refund due:

```text
₹5,000
```

Original client funds locked.

Agency pays client now.

Expected:

```text
Agency Outflow:
₹5,000

Client Refund:
₹5,000

Agency Recovery Claim:
tracked separately if business model requires
```

Do not pretend original locked fund was refunded.

---

# CASE-057: Campaign Spend Arrives Late From Meta

Job marked completed at:

```text
₹9,000
```

Later Meta sync updates spend to:

```text
₹9,500
```

Expected:

```text
Recalculate financial settlement
```

If leftover already refunded/transferred, create reconciliation/funding issue.

---

# CASE-058: Client Leftover Already Reallocated, Then Spend Increases

Example:

Initial:

```text
Allocated ₹10,000
Spend ₹9,000
Leftover ₹1,000
```

₹1,000 moved to wallet.

Later final spend:

```text
₹9,500
```

True leftover:

```text
₹500
```

System now detects:

```text
Over-released:
₹500
```

Create reconciliation case.

Do not silently change old transaction.

---

# CASE-059: Spend Decreases Due to Meta Credit

Initial spend:

```text
₹10,000
```

Later adjusted to:

```text
₹9,500
```

Difference:

```text
₹500
```

Create credit/recovery event and re-evaluate ownership.

---

# CASE-060: Campaign Mapped to Wrong Client

Meta Campaign X was attributed to Client A but belongs to Client B.

Need controlled spend reattribution.

Historical correction must be auditable.

---

# CASE-061: One Campaign Contains Spend for Multiple Internal Jobs

If business operation creates this scenario, spend attribution becomes ambiguous.

Expected:

```text
Manual Allocation / Defined Split Rule
```

Do not guess based on totals.

Prefer avoiding this operational pattern.

---

# CASE-062: One Client Uses Multiple Ad Accounts

Expected:

Client summary aggregates all allocations/spend while preserving location-level detail.

---

# CASE-063: One Ad Account Uses Multiple Currencies Over Time

Normally Meta account currency is fixed, but if migration/new account mapping causes different currencies:

Do not combine raw amounts.

Reporting currency conversion required.

---

# CASE-064: INR and USD Balances in Same Portfolio

Example:

```text
AD1 INR ₹10,000

AD2 USD $500
```

Portfolio total cannot simply add:

```text
₹10,500
```

Need separate currency totals or FX conversion.

---

# CASE-065: Floating Point Money Error

Never calculate:

```text
0.1 + 0.2
```

using standard floating-point money fields.

Use integer minor units.

---

# CASE-066: Negative Client Wallet Attempt

Wallet:

```text
₹1,000
```

Requested allocation:

```text
₹2,000
```

Expected:

```text
Reject
```

or require alternate funding source.

Do not silently allow negative balance unless explicit credit policy exists.

---

# CASE-067: Negative Agency Balance Attempt

Same principle.

---

# CASE-068: Vendor Payable Negative Attempt

Hard reject.

Excess becomes:

```text
Vendor Receivable
```

---

# CASE-069: User Deletes a Financial Transaction

Posted transaction deletion should be prohibited.

Use:

```text
Reversal
```

---

# CASE-070: User Edits Posted Amount

Prohibit direct edit.

Use:

```text
Reversal + Correct Transaction
```

---

# CASE-071: Draft Transaction Edited

Allowed before posting, subject to audit requirements.

---

# CASE-072: Transaction Approved but Edited Afterwards

If material financial fields change after approval:

```text
Approval invalidated
```

Transaction should return to:

```text
PENDING_APPROVAL
```

---

# CASE-073: User Changes Payment Proof Only

May not require financial reapproval depending on policy.

Audit attachment change.

---

# CASE-074: Approval User Is Same as Creator

For high-risk transactions system may enforce:

```text
Maker ≠ Checker
```

Example:

Creator cannot approve own ₹1,00,000 settlement.

Configurable.

---

# CASE-075: Admin Override

Admin may override specific validations.

Required:

```text
Reason

Audit Log

Approval

Affected Amount
```

No invisible bypass.

---

# CASE-076: Manual Balance Adjustment

User notices ₹500 difference and wants to fix balance.

Do not allow:

```text
Set Balance = ₹X
```

Instead:

```text
Manual Adjustment Transaction
₹500
```

with reason.

---

# CASE-077: Reconciliation Issue Resolved by Missing Transaction

Example:

Difference:

```text
₹5,000
```

Investigation finds unrecorded top-up.

Create proper historical transaction.

Then reconciliation closes.

---

# CASE-078: Reconciliation Issue Resolved by Write-Off

If amount genuinely unrecoverable:

```text
WRITE_OFF
```

requires approval.

---

# CASE-079: Reconciliation Issue Is Timing Difference

If Meta data delayed:

Keep case:

```text
OPEN / WAITING_FOR_SYNC
```

Do not create fake financial transaction.

---

# CASE-080: Account Balance Is Zero but Allocations Exist

Example:

```text
Meta/Physical:
₹0

Internal Allocations:
₹5,000
```

Critical reconciliation mismatch.

Possible causes:

```text
Spend not attributed

Account issue

Missing transaction

Incorrect balance interpretation
```

---

# CASE-081: Physical Balance Exists but No Ownership Allocations

Example:

```text
Physical:
₹5,000

Allocated Ownership:
₹0
```

Expected:

```text
Unattributed Fund:
₹5,000
```

---

# CASE-082: Client Wallet Shows Balance but All Money Physically Locked

Important separation.

Client may have:

```text
Total Owned:
₹5,000

Available:
₹0

Locked:
₹5,000
```

Do not call total-owned amount "available wallet".

---

# CASE-083: Same Fund Counted in Wallet and Ad Account

Invalid double counting.

If ₹5,000 moves:

```text
Client Wallet
↓
AD1
```

wallet available reduces and AD1 allocation increases.

Total client ownership stays same.

---

# CASE-084: Same Locked Fund Counted as Available

Invalid.

Use mutually exclusive active states.

---

# CASE-085: Client Payment Reversed by Bank

Initial:

```text
+₹10,000
```

Later bank reverses.

Need:

```text
PAYMENT_REVERSAL
-₹10,000
```

If funds already spent, create client funding gap/receivable.

---

# CASE-086: Vendor Funding Reversed

Vendor sends money but transaction later reverses.

Need liability reversal.

If funds already used, company may have funding gap.

Critical alert.

---

# CASE-087: Vendor Funding Received in Parts

Example:

```text
₹50,000
₹25,000
₹25,000
```

Can create separate funding batches or one batch with multiple funding receipts depending on model.

Preferred clarity:

Separate funding receipt transactions linked to one agreed facility/batch if needed.

---

# CASE-088: Vendor Sends Extra Funding Accidentally

Expected:

Treat based on confirmed business intent.

Do not automatically classify as planned vendor funding if disputed.

Possible:

```text
UNCONFIRMED_VENDOR_RECEIPT
```

until verified.

---

# CASE-089: Client Sends Unknown Payment

Bank receives:

```text
₹10,000
```

payer not identified.

Expected:

```text
UNIDENTIFIED_RECEIPT
```

Do not assign to random client.

---

# CASE-090: Payment Belongs to Existing Client but No Job Yet

Expected:

```text
Client Wallet
```

available until job created.

---

# CASE-091: Client Payment Has Two Purposes

Example:

```text
₹25,000 received
```

Split:

```text
₹20,000 Ads Fund

₹5,000 Service Fee
```

System should support allocation by purpose.

---

# CASE-092: Client Campaign Cancelled Before Spend

Allocated:

```text
₹10,000
```

Spend:

```text
₹0
```

Expected:

```text
₹10,000 returned to Client Wallet
```

unless locked or otherwise unavailable.

---

# CASE-093: Client Campaign Cancelled After Partial Spend

Allocated:

```text
₹10,000

Spent:
₹3,000
```

Expected:

```text
₹7,000 unresolved/returnable
```

---

# CASE-094: Account Restricted During Refund Process

If amount marked refund pending but physical funds become locked:

System needs status reflecting:

```text
Refund Obligation:
Pending

Physical Fund:
Locked
```

Do not mark refund completed.

---

# CASE-095: Client Requests Refund While Fund Is Locked

Expected:

```text
Refund Requested:
₹5,000

Refund Availability:
BLOCKED_BY_LOCKED_FUND
```

Unless agency chooses temporary refund funding.

---

# CASE-096: Vendor Repayment Source Is Client Fund Still Owned by Client

Important business rule issue.

If client money legally/business-wise is still client-owned, it cannot simply be used for vendor repayment without valid business settlement/allocation rule.

System should require correct ownership/purpose classification before using funds.

---

# CASE-097: Agency Uses Its Own Money for Vendor Repayment

Valid if agency/company fund available.

Source:

```text
AGENCY / COMPANY FUND
```

Vendor payable reduces.

---

# CASE-098: One Payment Used Twice

Example client payment:

```text
₹20,000
```

allocated:

```text
₹20,000 campaign
```

and again:

```text
₹20,000 vendor settlement
```

without proper ownership movement.

System must prevent double-use through ledger balances.

---

# CASE-099: One Fund Lot Has Partial Allocations

Fund lot:

```text
₹10,000
```

Allocations:

```text
JOB-001 ₹4,000

JOB-002 ₹3,000

Available ₹3,000
```

Valid if business rule allows.

---

# CASE-100: Transaction Timestamp and Business Date Differ

Payment entered today but occurred yesterday.

Store:

```text
Transaction Date

Created At
```

separately.

---

# CASE-101: Backdated Transaction Affects Closed Report

If a past transaction is added after report closure:

System should mark affected reporting period/reconciliation as:

```text
REOPEN_REVIEW_REQUIRED
```

or equivalent.

---

# CASE-102: Timezone Difference

Meta reporting timezone may differ from system timezone.

Spend attribution should use account timezone where required.

Do not blindly use server UTC day boundaries.

---

# CASE-103: Day-End Spend Changes After Midnight

Meta final spend may update after initial daily snapshot.

System should allow:

```text
Preliminary Snapshot
Finalized Snapshot
```

or resync recent days.

---

# CASE-104: Currency Decimal Rules Differ

Do not assume every currency has two decimals.

Use currency-aware minor units.

---

# CASE-105: User Has No Finance Permission

User can view ad status but attempts vendor settlement.

Expected:

```text
403 / Permission Denied
```

No transaction created.

---

# CASE-106: User Loses Access Mid-Session

Permissions should be revalidated server-side.

Frontend hidden button is not enough.

---

# CASE-107: Meta Token Expired

Expected:

```text
Connection Status:
AUTH_REQUIRED
```

Existing historical data remains.

Sync stops with clear alert.

---

# CASE-108: Meta Permission Removed

Expected:

```text
PERMISSION_ERROR
```

Do not delete existing asset data.

---

# CASE-109: Meta Account Removed From Business Access

Record:

```text
ACCESS_LOST
```

or appropriate state.

Financial history remains.

---

# CASE-110: User Manually Adds Ad Account Before Meta Sync Finds It

Allow:

```text
PENDING_VERIFICATION
```

if product requires manual onboarding.

Later match by Meta Ad Account ID.

Do not create duplicate.

---

# CASE-111: Duplicate Client Created

System may warn based on:

```text
Phone
Email
Company Name
```

Do not auto-merge financial histories.

---

# CASE-112: Duplicate Vendor Created

Same principle.

Merge should be controlled/admin-only.

---

# CASE-113: Duplicate Ad Account Name

Allowed.

Use Meta Ad Account ID as canonical identity.

---

# CASE-114: Client Name Changes

Internal Client ID remains unchanged.

Historical records should show stable linkage.

---

# CASE-115: Vendor Name Changes

Same.

---

# CASE-116: Ad Account Hard Delete Attempt

If financial/history records exist:

Reject hard deletion.

Use:

```text
ARCHIVED
```

---

# CASE-117: Client Hard Delete Attempt

If financial history exists:

Reject.

Use:

```text
CLOSED / INACTIVE
```

---

# CASE-118: Vendor Hard Delete Attempt

Same.

---

# CASE-119: Fund Transfer Has No Reason

For sensitive ownership change, system should require reason.

---

# CASE-120: Transaction Has No Reference

Some cash/internal adjustments may genuinely not have external reference.

Allow:

```text
Reference Type:
INTERNAL
```

but require notes according to policy.

---

# CASE-121: Proof Attachment Missing

Certain transaction types may require proof.

If missing:

```text
PENDING_DOCUMENTATION
```

or block posting according to policy.

---

# CASE-122: Large Adjustment

Example:

```text
₹1,00,000 manual adjustment
```

Requires elevated approval.

---

# CASE-123: Small Rounding Difference

Example:

```text
₹0.01 / ₹1
```

Depending on configured tolerance:

May auto-classify as rounding adjustment or require review.

Tolerance must be explicit.

---

# CASE-124: Reconciliation Difference Within Tolerance

System may mark:

```text
WITHIN_TOLERANCE
```

without full incident.

But exact raw difference still stored.

---

# CASE-125: Reconciliation Difference Exceeds Tolerance

Create:

```text
OPEN_RECONCILIATION_CASE
```

---

# CASE-126: Restricted Account With No Internal Balance

Account restricts but:

```text
Internal Tracked Balance:
₹0
```

No locked fund entry needed.

Still record restriction event.

---

# CASE-127: Restricted Account Has Negative/Invalid Meta Value

Do not directly use strange raw API number.

Store raw value and normalize through billing logic.

Flag if inconsistent.

---

# CASE-128: Meta Credit Appears on Restricted Account

Treat as new financial event.

Determine ownership through original context/reconciliation.

---

# CASE-129: Multiple Restrictions on Same Account

History:

```text
Restricted
Restored
Restricted
Restored
```

Each episode should be separate event/recovery case if appropriate.

---

# CASE-130: Account Restored but Campaign Should Not Resume

Operational decision separate from account status.

Restored means:

```text
CAN_RUN
```

not:

```text
AUTO_RESUME_ALL_CAMPAIGNS
```

---

# CASE-131: Client Job Completed but Meta Campaign Still Spending

Critical alert.

Expected:

```text
POST_COMPLETION_SPEND
```

Investigate immediately.

---

# CASE-132: Meta Campaign Paused but Spend Still Updates Slightly

Allow for reporting delay/late attribution.

Do not instantly treat small late spend as fraud.

Use reconciliation window.

---

# CASE-133: Job Has No Meta Campaign Mapping

Can exist in:

```text
PLANNED
```

state.

But active spend attribution requires mapping or explicit manual method.

---

# CASE-134: Meta Campaign Deleted

Internal historical mapping remains.

Do not delete client/job spend history.

---

# CASE-135: Client Job Uses Agency Funding Only

Valid.

Record:

```text
Owner/Source:
Agency

Business Purpose:
Client A
```

Client may later reimburse agency depending on business terms.

---

# CASE-136: Client Reimburses Agency Later

Create explicit settlement:

```text
Client Payment
↓
Agency Recovery
```

Do not count reimbursement as new ad budget unless intended.

---

# CASE-137: Agency Funding Becomes Client Receivable

If company spends on behalf of client on credit:

```text
Agency Fund Used:
₹5,000

Client Receivable:
₹5,000
```

This is different from client wallet.

---

# CASE-138: Client Pays After Agency-Funded Spend

Payment should reduce:

```text
Client Receivable
```

not automatically create free wallet balance unless payment exceeds receivable.

---

# CASE-139: Client Payment Exceeds Receivable

Example:

```text
Client Receivable:
₹5,000

Payment:
₹7,000
```

Result:

```text
Receivable Cleared:
₹5,000

Client Wallet:
₹2,000
```

---

# CASE-140: Financial Period Closing With Open Issues

Monthly report may close while:

```text
Locked Funds

Unresolved Leftovers

Open Vendor Receivables

Reconciliation Cases
```

still exist.

Report should explicitly list outstanding items.

---

# CASE-141: Reconciliation Case Closed Without Resolution

Not allowed.

Closure needs:

```text
Resolution Type

Resolution Transaction / Explanation

Resolved By

Resolved At
```

---

# CASE-142: Alert Dismissed but Financial Issue Still Exists

Dismissing alert must not close underlying financial case.

Example:

```text
Vendor Receivable ₹10,000
```

remains until resolved.

---

# CASE-143: User Deletes Alert

Alerts may be acknowledged/dismissed.

Underlying transactions/cases remain immutable.

---

# CASE-144: Notification Failed

Financial event remains recorded even if WhatsApp/email notification fails.

Notification is secondary.

---

# CASE-145: Worker Processes Same Meta Event Twice

Sync logic must be idempotent.

No duplicate snapshots/financial events where uniqueness applies.

---

# CASE-146: Worker Crashes Halfway Through Sync

Use sync run state:

```text
PARTIAL / FAILED
```

Previously committed data remains valid.

Retry safely.

---

# CASE-147: Same Spend Snapshot Imported Twice

Use unique key such as:

```text
Ad Account / Campaign
+
Date
+
Breakdown Context
```

and upsert/update according to Meta reporting semantics.

---

# CASE-148: Historical Spend Revised by Meta

System should allow snapshot/report updates while preserving sync/audit history.

Financial settlements affected may require reconciliation.

---

# CASE-149: User Attempts to Close Client With Open Receivable

Block financial closure or show mandatory warning.

---

# CASE-150: User Attempts to Close Vendor With Open Receivable/Payable

Same.

---

# Core Edge Case Principle

Whenever a scenario creates uncertainty, system priority should be:

```text
1. Preserve existing history

2. Prevent double counting

3. Prevent silent ownership changes

4. Prevent negative/invalid financial positions

5. Record uncertainty explicitly

6. Create reconciliation/approval case

7. Require explicit resolution
```

---

# Never Guess Rule

System must never silently guess:

```text
Which client owns unexplained money

Which vendor payment a transaction belongs to

Why Meta and internal values differ

Whether a refund happened

Whether a locked amount is recoverable

Whether extra vendor payment should be ignored
```

Use:

```text
UNATTRIBUTED

UNRESOLVED

PENDING_REVIEW

RECONCILIATION_REQUIRED
```

instead.

---

# Edge Case Golden Rule

> **When the system cannot confidently determine ownership, source, status, or purpose of money, it must preserve the amount in an explicit unresolved state rather than silently assigning, deleting, netting, or correcting it. Financial uncertainty must remain visible until a traceable resolution is recorded.**
