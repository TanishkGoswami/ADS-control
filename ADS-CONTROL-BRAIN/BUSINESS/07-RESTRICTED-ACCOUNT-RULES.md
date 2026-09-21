# Restricted Account Rules

## Overview

Restricted Account Rules ka purpose ye define karna hai ki jab kisi Meta Ad Account ki operational availability change ho jaye—jaise account restricted, disabled, payment issue ya otherwise unusable ho—to system us account ke funds aur business obligations ko kaise treat kare.

Core principle:

> **Account ka restricted hona fund ka disappear hona nahi hai.**

Agar account me paisa tracked hai, to restriction ke baad system ko us amount ki ownership, current location, availability aur recovery status preserve karna hai.

---

# 1. Restricted Account Definition

Internal business context me Restricted Account ka matlab:

```text
Ad Account currently advertising operations ke liye normally usable nahi hai.
```

Possible causes:

```text
Meta Restriction

Disabled Account

Payment Issue

Risk Review

Temporary Hold

Access Issue

Other Platform Limitation
```

Exact Meta status ko internal normalized status me map kiya jayega.

---

# 2. Account Status vs Fund Status

Important distinction:

```text
Account Status:
RESTRICTED
```

does not automatically mean:

```text
Fund Status:
LOST
```

Instead tracked funds may become:

```text
LOCKED
```

---

# 3. Example

Before restriction:

```text
AD1

Status:
ACTIVE

Tracked Fund:
₹5,000
```

Breakdown:

```text
Client A:
₹2,000

Client B:
₹2,000

Agency:
₹1,000
```

After restriction:

```text
AD1

Status:
RESTRICTED

Available:
₹0

Locked:
₹5,000
```

Ownership breakdown remains:

```text
Client A Locked:
₹2,000

Client B Locked:
₹2,000

Agency Locked:
₹1,000
```

---

# 4. Restriction Detection

Restriction can be detected through:

```text
Meta Sync

Manual Review

Internal User Report
```

Preferred source:

```text
Meta API / Sync
```

Manual override should be allowed only with proper audit trail.

---

# 5. Restriction Event

When account status changes:

```text
ACTIVE
↓
RESTRICTED
```

system should create:

```text
ACCOUNT_STATUS_CHANGED
```

event.

Record:

```text
Ad Account

Old Status

New Status

Detected At

Detection Source

Last Known Balance

Last Known Spend

Affected Allocations
```

---

# 6. Last Known Financial Snapshot

At restriction time system should capture a snapshot.

Example:

```text
Account:
AD1

Restricted At:
17 Sep 2026 10:45 PM

Last Known Meta Value:
₹5,000

Internal Tracked Balance:
₹5,000
```

This helps future reconciliation.

---

# 7. Locking Rule

On confirmed restriction:

```text
AVAILABLE / ALLOCATED FUNDS
↓
LOCKED
```

as applicable.

Do not automatically:

```text
refund

write-off

transfer ownership
```

---

# 8. Ownership Preservation

Restriction does not change ownership.

Example:

Before:

```text
Owner:
Client A

Amount:
₹2,000
```

After:

```text
Owner:
Client A

Amount:
₹2,000

Status:
LOCKED
```

---

# 9. Location Preservation

Fund location remains associated with the affected Ad Account until actual recovery/refund/adjustment occurs.

Example:

```text
Location:
AD1
```

Status:

```text
LOCKED
```

---

# 10. Available vs Locked

Client profile should separate:

```text
Available Balance

Locked Balance
```

Example:

```text
Client A

Available:
₹3,000

Locked:
₹2,000
```

Locked fund should not be shown as freely usable.

---

# 11. Portfolio-Level Locked Fund

Example:

```text
BP1

AD1 Locked:
₹5,000

AD2 Locked:
₹2,000

Total Locked:
₹7,000
```

---

# 12. Connection-Level Locked Fund

Example:

```text
Ads Pro

Total Locked:
₹25,000
```

with drill-down to BP and account level.

---

# 13. Restriction Alerts

System should generate:

```text
AD_ACCOUNT_RESTRICTED
```

alert.

Alert should show:

```text
Ad Account

Business Portfolio

Restricted At

Tracked Balance

Locked Amount

Affected Clients

Agency Amount

Active Campaigns
```

---

# 14. Example Alert

```text
ALERT

AD1 Restricted

Locked Fund:
₹5,000

Affected:
Client A ₹2,000
Client B ₹2,000
Agency ₹1,000
```

---

# 15. Active Client Jobs Impact

When account gets restricted, all active jobs mapped to it should be reviewed.

Possible states:

```text
PAUSED_DUE_TO_ACCOUNT

REASSIGNMENT_REQUIRED

AWAITING_RECOVERY
```

---

# 16. Client Notification State

Internal system may mark:

```text
CLIENT_IMPACT_REVIEW_REQUIRED
```

This does not necessarily mean automated client notification is sent in V1.

---

# 17. Campaign Continuation

If client campaign must continue, another Ad Account may be assigned.

Example:

```text
Old:
AD1 Restricted

New:
AD2 Active
```

This is an operational reassignment.

It does not mean locked money moved.

---

# 18. Do Not Move Locked Fund Virtually

Incorrect:

```text
AD1 Locked ₹2,000
↓
AD2 Available ₹2,000
```

without actual recovery/funding.

Correct:

```text
AD1 Locked:
₹2,000

AD2 New Funding:
₹2,000
```

Two separate financial positions.

---

# 19. Temporary Agency Funding

Example:

Client A has:

```text
₹2,000
```

locked in AD1.

Campaign continuation requires ₹2,000.

Agency may provide:

```text
₹2,000
```

to AD2.

System should record:

```text
Client A Locked:
₹2,000

Agency Temporary Funding:
₹2,000
```

---

# 20. Temporary Funding Is a Separate Obligation

Agency temporary support should not erase client locked amount.

Later when locked fund recovers, system may resolve agency exposure through explicit transaction.

---

# 21. Account Restored

If account status changes:

```text
RESTRICTED
↓
ACTIVE
```

system should create:

```text
ACCOUNT_RESTORED
```

event.

---

# 22. Unlocking Rule

After restoration and balance verification:

```text
LOCKED
↓
AVAILABLE / ALLOCATED
```

depending on previous state.

Do not blindly unlock before reconciliation.

---

# 23. Restoration Verification

Before unlock:

```text
Meta Account Status = Active

Latest Balance Checked

Internal Balance Compared

No Major Mismatch
```

If mismatch:

```text
RECONCILIATION_REQUIRED
```

---

# 24. Example Restoration

Before:

```text
Client A Locked:
₹2,000
```

Account restored.

Meta/internal verified.

Result:

```text
Client A Available:
₹2,000
```

---

# 25. Partial Recovery

Possible scenario:

Locked:

```text
₹5,000
```

Recovered:

```text
₹4,500
```

Difference:

```text
₹500
```

System should not silently close full amount.

Instead:

```text
Recovered:
₹4,500

Unresolved:
₹500
```

Create reconciliation case.

---

# 26. Meta Refund

If platform refunds restricted account funds:

```text
LOCKED
↓
REFUND RECEIVED
```

Refund ownership should follow original locked ownership.

---

# 27. Example Full Refund

Locked:

```text
Client A ₹3,000
Agency ₹2,000
```

Refund:

```text
₹5,000
```

Allocation:

```text
Client A:
₹3,000

Agency:
₹2,000
```

---

# 28. Partial Refund Allocation

If only:

```text
₹4,000
```

refund received against expected:

```text
₹5,000
```

system needs allocation policy.

Preferred:

```text
Do not silently guess ownership reduction.
```

Create reconciliation workflow.

Possible configured methods:

```text
Pro-rata

Specific Ownership Allocation

Manual Finance Allocation
```

Manual decision should be auditable.

---

# 29. Refund Pending

If refund expected but not received:

```text
LOCKED
↓
REFUND_PENDING
```

Do not mark as refunded until actual confirmation.

---

# 30. Refund Pending Aging

Track:

```text
Expected Refund Date

Days Pending
```

Generate alert if too old.

---

# 31. Permanent Unrecoverable Fund

Worst-case:

```text
Fund cannot be recovered.
```

Do not delete it.

Process:

```text
LOCKED
↓
LOSS_REVIEW
↓
AUTHORIZED_ADJUSTMENT / WRITE_OFF
```

Requires approval.

---

# 32. Write-Off Requirements

Need:

```text
Amount

Owner

Ad Account

Reason

Evidence

Created By

Approved By

Date
```

---

# 33. Client-Owned Loss

If unrecoverable amount belonged to Client A:

system must preserve that fact.

Do not silently convert client loss to agency adjustment without policy.

---

# 34. Agency-Owned Loss

If amount agency-owned:

```text
Agency Loss / Adjustment
```

can be recorded separately.

---

# 35. Account Disabled Permanently

If Meta account permanently disabled:

```text
Status:
DISABLED
```

but financial state may still be:

```text
LOCKED

REFUND_PENDING

PARTIALLY_RECOVERED

SETTLED
```

Operational closure and financial closure are separate.

---

# 36. Account Archive Rule

Ad Account should only be financially archivable after:

```text
Locked Balance resolved

Refund Pending resolved

No active client jobs

No unresolved reconciliation

No open fund ownership issue
```

---

# 37. Operational Archive vs Financial Archive

Possible:

```text
Operational Status:
ARCHIVED
```

while:

```text
Financial Status:
OPEN
```

if money issues remain.

---

# 38. Restricted Account Detail View

Recommended sections:

```text
Overview

Status History

Locked Funds

Affected Clients

Active Jobs

Recovery Attempts

Refunds

Reconciliation

Audit Log
```

---

# 39. Locked Fund Breakdown

Example UI:

```text
AD1
RESTRICTED

Total Locked:
₹8,500

Client A:
₹3,000

Client B:
₹2,500

Client C:
₹1,000

Agency:
₹2,000
```

---

# 40. Account Status History

Example:

```text
10 Sep
ACTIVE

17 Sep
RESTRICTED

19 Sep
ACTIVE

25 Sep
RESTRICTED
```

Historical record required.

---

# 41. Restriction Count

System may track:

```text
Total Restrictions

Last Restricted At

Total Restricted Days
```

useful for risk analysis later.

---

# 42. Account Risk Indicator

Optional future score based on factual metrics:

```text
Restriction frequency

Payment issues

Sync issues

Recovery time
```

Avoid vague manual labels unless defined.

---

# 43. Restricted Account and New Funding

If account already restricted:

system should ideally warn before allowing new internal top-up record.

Example:

```text
AD1 Status:
RESTRICTED

Attempted Fund Addition:
₹5,000
```

Warning:

```text
Account is currently restricted.
```

Depending on policy, block or require approval.

---

# 44. Restricted Account Allocation Rule

Do not allocate new client budget to a known restricted account by default.

Need override if exceptional.

---

# 45. Restriction Between Top-Up and Spend

Example:

```text
10:00 AM
₹2,000 added

11:00 PM
Account restricted
```

Spend:

```text
₹0
```

System:

```text
Fund Added:
₹2,000

Spent:
₹0

Locked:
₹2,000
```

This exact scenario must work cleanly.

---

# 46. Restriction After Partial Spend

Example:

```text
Allocated:
₹5,000

Spent:
₹3,200

Restriction occurs
```

Result:

```text
Spent:
₹3,200

Locked:
₹1,800
```

---

# 47. Restriction with Unattributed Funds

If account total tracked:

```text
₹10,000
```

but ownership mapped:

```text
₹9,000
```

then:

```text
Unattributed:
₹1,000
```

Restriction should preserve:

```text
Attributed Locked:
₹9,000

Unattributed Locked:
₹1,000
```

Create reconciliation alert.

---

# 48. Do Not Invent Ownership

If fund ownership unknown:

```text
Owner:
UNATTRIBUTED
```

is better than assigning randomly.

---

# 49. Restriction and Multiple Clients

Example:

```text
AD1

Client A:
₹2,000

Client B:
₹4,000

Client C:
₹1,000
```

All should be independently locked.

---

# 50. Restriction and Multiple Campaigns

Same client may have multiple active jobs.

Breakdown:

```text
Client A JOB-001:
₹1,000

Client A JOB-002:
₹1,000
```

Preserve job-level ownership if available.

---

# 51. Account-Level and Job-Level Locking

Recommended hierarchy:

```text
AD1 Locked Total
↓
Owner
↓
Client Job
↓
Fund Lot
```

for maximum traceability.

---

# 52. Restricted Fund Reconciliation

At restriction:

```text
Internal Tracked:
₹5,000

Meta-related latest balance:
₹4,900
```

Difference:

```text
₹100
```

Create:

```text
RESTRICTED_ACCOUNT_RECONCILIATION_MISMATCH
```

---

# 53. Restriction Sync Timing

Meta sync may detect restriction after some delay.

System should store:

```text
Detected At
```

separately from:

```text
Meta Event Time
```

if Meta provides it.

Do not invent exact restriction time if unknown.

---

# 54. Historical Accuracy

If exact status change time unknown:

Use:

```text
Detected At:
known timestamp

Effective At:
unknown / estimated only if explicitly flagged
```

---

# 55. Manual Restriction Entry

If team notices restriction before API sync:

user can mark:

```text
RESTRICTION_REPORTED
```

Then API confirms later.

Audit both events.

---

# 56. Status Conflict

Example:

Internal user marks:

```text
RESTRICTED
```

but Meta sync later shows:

```text
ACTIVE
```

System should not silently overwrite without history.

Create/update status based on authoritative rules and record conflict.

---

# 57. Source Priority

Recommended:

```text
Meta API
>
Verified Admin Override
>
User Report
```

for actual platform status.

Internal risk/availability flags may coexist.

---

# 58. Payment Issue Status

An account may be:

```text
PAYMENT_ISSUE
```

without full restriction.

Fund may still need special treatment depending on actual usability.

Do not automatically lock all money unless account cannot spend/use funds.

---

# 59. Normalized Availability State

Recommended separate property:

```text
CAN_RUN_ADS = true/false/unknown
```

This may be more useful than relying on label alone.

---

# 60. Fund Lock Trigger

Lock should occur when:

```text
Account cannot reliably use the tracked funds
```

according to defined platform/business rule.

Do not map every non-active status blindly.

---

# 61. Account Recovery Case

System can create:

```text
RECOVERY_CASE
```

for restricted account.

Fields:

```text
Ad Account

Restriction Date

Locked Amount

Affected Clients

Owner

Current Status

Recovery Notes

Expected Resolution

Assigned User
```

---

# 62. Recovery Case Status

Possible:

```text
OPEN

UNDER_REVIEW

RESTORED

REFUND_PENDING

PARTIALLY_RECOVERED

RECOVERED

WRITE_OFF_PENDING

CLOSED
```

---

# 63. Recovery Notes

Useful for internal team:

```text
Appeal submitted

Meta review pending

Payment issue fixed

Refund requested

Account restored
```

Notes do not replace financial transactions.

---

# 64. Recovery Ownership

Assign internal user/team:

```text
Recovery Owner:
Rahul
```

so no account issue gets forgotten.

---

# 65. Restricted Fund Aging

Track:

```text
Locked Since

Days Locked
```

Example:

```text
₹20,000 locked for 28 days
```

---

# 66. Locked Fund Aging Alerts

Configurable thresholds:

```text
3 Days → Info

7 Days → Warning

15 Days → High Priority

30 Days → Critical Review
```

---

# 67. Management Dashboard

Summary:

```text
Restricted Accounts:
4

Total Locked Funds:
₹85,000

Client-Owned Locked:
₹55,000

Agency-Owned Locked:
₹30,000
```

---

# 68. Restricted Account Report

Columns:

```text
Account

Portfolio

Connection

Status

Restricted Since

Locked Amount

Client Amount

Agency Amount

Affected Jobs

Recovery Status

Assigned Owner
```

---

# 69. Client View

Client profile:

```text
Client A

Available:
₹10,000

Locked:
₹4,000
```

Drill-down:

```text
AD1:
₹2,000

AD3:
₹2,000
```

---

# 70. Finance View

Finance needs:

```text
Total locked money

Ownership

Expected refund

Recovery status

Age

Write-off exposure
```

---

# 71. Ads Manager View

Ads team needs:

```text
Which accounts cannot run ads

Which campaigns affected

Which jobs need reassignment

Which accounts restored
```

---

# 72. Admin View

Admin needs:

```text
Approvals

Write-offs

Manual overrides

Unresolved mismatches

High-value locked funds
```

---

# 73. Account Restriction Audit Events

Track:

```text
Restriction Detected

Restriction Reported

Funds Locked

Client Jobs Paused

Job Reassigned

Account Restored

Funds Unlocked

Refund Requested

Refund Received

Write-Off Requested

Write-Off Approved

Recovery Case Closed
```

---

# 74. Wrong Lock Correction

If account was incorrectly marked restricted and funds locked:

Do not silently edit historical lock event.

Use correction/reversal logic where financial states were posted.

---

# 75. Temporary API Error Is Not Restriction

Meta sync failure:

```text
API unavailable
```

does not mean:

```text
Account Restricted
```

Use:

```text
STATUS_UNKNOWN / STALE
```

rather than false restriction.

---

# 76. Stale Status

If last successful sync too old:

```text
Status Data:
STALE
```

UI should show uncertainty.

---

# 77. Restricted Account and Duplicate Balance

Do not count same locked balance as:

```text
Available
+
Locked
```

simultaneously.

Once locked:

```text
Available component decreases
Locked component increases
```

Total ownership remains same.

---

# 78. Restricted Fund Equation

Conceptually:

```text
Before Restriction:
Available + Allocated = X
```

After:

```text
Available Usable + Locked = X
```

subject to spend/adjustments/reconciliation.

---

# 79. Partial Lock

Some situations may only affect part of funds.

System should allow:

```text
Available:
₹3,000

Locked:
₹2,000
```

if business/Meta reality supports it.

---

# 80. Restriction and Refund Ownership

Refund should follow original owner distribution where known.

Never default all refunds to agency.

---

# 81. Restriction and Service Fees

Service fee/revenue is separate from locked ad funds.

Do not include non-ad financial components in restricted balance.

---

# 82. Restriction and Vendor Funding

If the money in account originally came from vendor funding but was allocated for a client:

system may need both:

```text
Funding Source:
Vendor RAM

Business Owner/Purpose:
Client A
```

Restriction should preserve both lineage dimensions.

---

# 83. Vendor Liability Does Not Disappear

If vendor-funded amount locks in Meta account:

```text
Vendor Payable
```

still exists unless contractual/accounting rule says otherwise.

Restriction does not automatically reduce vendor liability.

---

# 84. Example Vendor-Funded Restriction

RAM provides:

```text
₹20,000
```

used in AD1.

AD1 restricts with:

```text
₹8,000
```

remaining.

System may show:

```text
Locked in AD1:
₹8,000

Funding Source:
RAM-RF-001

Vendor Payable:
tracked independently
```

---

# 85. Restricted Fund Golden Rule

> **Restriction changes usability, not history or ownership. Every amount present when an account becomes unusable must remain traceable by owner, source, location and status until it is restored, refunded, recovered, transferred through a valid process, or formally written off.**

---

# 86. Integrity Rules

System must enforce:

```text
1. Restricted account funds are not deleted.

2. Restriction does not automatically change ownership.

3. Locked funds are not available funds.

4. Locked money cannot be virtually moved to another Ad Account.

5. Replacement funding must have its own source.

6. Account restoration requires balance verification before unlock.

7. Refunds must preserve original ownership where known.

8. Partial recovery must leave unresolved residual visible.

9. Write-offs require explicit approval and transaction.

10. Operational account closure does not equal financial closure.

11. Unknown ownership must stay unattributed rather than guessed.

12. API failure must not be treated as restriction.

13. Historical restriction and recovery events must remain auditable.

14. Restricted funds must be included in aging and management reporting.

15. Every recovery path must end in a traceable final state.
```
