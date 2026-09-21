# Client Flow

## Overview

Client Flow system ka one of the most important business processes hai.

System ko sirf ye track nahi karna ki client ka campaign kis Ad Account me run hua.

System ko complete financial lifecycle track karna hai:

```text id="cf001"
Client Created
      ↓
Requirement Created
      ↓
Budget Defined
      ↓
Payment Received
      ↓
Client Wallet
      ↓
Campaign / Job Created
      ↓
Fund Allocated
      ↓
Ad Account Assigned
      ↓
Ads Run
      ↓
Actual Spend
      ↓
Unused / Remaining Balance
      ↓
Financial Resolution
      ↓
Client Settlement
```

Goal:

> Client ke har rupee ka complete ownership aur movement traceable rehna chahiye.

---

# 1. Client Creation

New client system me create hoga.

Minimum client record:

```text id="cf002"
Client ID

Client Name

Company Name

Phone

Email

Status

Created Date

Created By

Notes
```

Example:

```text id="cf003"
Client ID:
CLI-0001

Name:
Client A

Status:
ACTIVE
```

---

# 2. Client Status

Possible client statuses:

```text id="cf004"
ACTIVE

INACTIVE

ON_HOLD

CLOSED

BLOCKED
```

Client status financial records ko delete nahi karega.

Even if client:

```text id="cf005"
CLOSED
```

ho gaya, uski transaction history preserve hogi.

---

# 3. Client Requirement

Client ke har advertising requirement ko separate work item ke form me create karna chahiye.

Possible naming:

```text id="cf006"
Client Job
```

or:

```text id="cf007"
Client Campaign Order
```

Example:

```text id="cf008"
Job ID:
JOB-001

Client:
Client A

Requirement:
Lead Generation

Budget:
₹20,000

Duration:
10 Days

Platform:
Meta Ads
```

---

# 4. Client Job Is Separate From Meta Campaign

Important distinction:

```text id="cf009"
Client Job
≠
Meta Campaign
```

Ek Client Job ke andar:

```text id="cf010"
1 Meta Campaign
```

ho sakta hai.

Ya:

```text id="cf011"
Multiple Meta Campaigns
```

ho sakte hain.

Similarly one Meta Campaign ko internal business rules ke according one or more internal records se map kiya ja sakta hai.

V1 me ideally one client job ka clean mapping maintain karna preferable hai.

---

# 5. Client Budget

Client Budget agreed/planned advertising amount represent karta hai.

Example:

```text id="cf012"
Client Job Budget:
₹20,000
```

Budget necessarily received payment ke equal nahi hai.

---

# 6. Client Payment

Actual client se received money:

```text id="cf013"
Client Payment
```

Example:

```text id="cf014"
Client Budget:
₹20,000

Payment Received:
₹15,000
```

System ko ye assume nahi karna:

```text id="cf015"
Budget = Payment
```

unless actual transaction same ho.

---

# 7. Partial Client Payment

Client partial payment kar sakta hai.

Example:

```text id="cf016"
Total Required:
₹20,000
```

Payments:

```text id="cf017"
Payment 1:
₹10,000

Payment 2:
₹5,000

Payment 3:
₹5,000
```

Total:

```text id="cf018"
₹20,000
```

Each payment separate transaction hogi.

---

# 8. Client Wallet

Client ko received fund logical:

```text id="cf019"
Client Wallet
```

me reflect hoga.

Example:

```text id="cf020"
Client A Wallet

Total Received:
₹20,000

Allocated:
₹0

Available:
₹20,000
```

---

# 9. Client Wallet Is Logical

Client Wallet actual bank account hona zaroori nahi.

Ye internal accounting representation hai.

Physical money ho sakta hai:

```text id="cf021"
Company Bank

Cash

UPI

Other Financial Account
```

Business ownership:

```text id="cf022"
Client A
```

rahegi.

---

# 10. Client Payment Record

Each client payment me minimum fields:

```text id="cf023"
Transaction ID

Client ID

Amount

Payment Date

Payment Method

Reference / UTR

Purpose

Received By

Proof Attachment

Status
```

---

# 11. Payment Status

Possible:

```text id="cf024"
PENDING

CONFIRMED

FAILED

REVERSED

REFUNDED
```

Wallet balance only valid confirmed/postable transactions se affect hona chahiye.

---

# 12. Client Payment Source

Payment methods:

```text id="cf025"
BANK_TRANSFER

UPI

CASH

PAYMENT_GATEWAY

OTHER
```

Sensitive financial details permissions ke according visible hone chahiye.

---

# 13. Service Fee vs Ads Fund

Client se received total amount future me multiple components me divide ho sakta hai.

Example:

```text id="cf026"
Client Pays:
₹25,000

Ads Fund:
₹20,000

Service Fee:
₹5,000
```

These should not automatically mix.

---

# 14. Client Payment Allocation

Client payment ko purpose-wise allocate kiya ja sakta hai.

Example:

```text id="cf027"
₹25,000 Received

₹20,000
→ Advertising Fund

₹5,000
→ Service Revenue
```

V1 me agar service fee model use nahi ho raha ho, system architecture future support ke liye flexible rahe.

---

# 15. Client Job Creation

Client requirement confirm hone ke baad job create hogi.

Example:

```text id="cf028"
JOB-001

Client:
Client A

Budget:
₹20,000

Start:
17 Sep 2026

Status:
PLANNED
```

---

# 16. Client Job Status

Possible operational statuses:

```text id="cf029"
PLANNED

READY

ACTIVE

PAUSED

COMPLETED

CANCELLED
```

Financial status separate rahega.

---

# 17. Client Financial Status

Possible:

```text id="cf030"
UNFUNDED

PARTIALLY_FUNDED

FUNDED

ACTIVE_ALLOCATION

PARTIALLY_SPENT

UNUSED_BALANCE

REFUND_PENDING

SETTLED
```

Operational aur financial status same nahi hain.

---

# 18. Client Fund Allocation

Client Wallet se campaign/job ke liye fund allocate kiya jayega.

Example:

```text id="cf031"
Client Wallet:
₹20,000
```

Allocation:

```text id="cf032"
JOB-001
₹15,000
```

Result:

```text id="cf033"
Client Wallet Available:
₹5,000

Job Allocated:
₹15,000
```

---

# 19. Allocation Does Not Mean Spend

Important rule:

```text id="cf034"
Allocation
≠
Spend
```

Allocation means:

> Money reserved for a purpose.

Spend means:

> Money actually consumed by advertising.

---

# 20. Ad Account Assignment

Job ko suitable Ad Account assign hoga.

Example:

```text id="cf035"
JOB-001
↓
Ads Pro / BP1 / AD1
```

Assignment record:

```text id="cf036"
Job:
JOB-001

Ad Account:
AA-001

Assigned At:
17 Sep 2026

Assigned By:
Ads Manager
```

---

# 21. Job Can Move Between Ad Accounts

Possible scenario:

```text id="cf037"
JOB-001

Initially:
AD1
```

AD1 restrict ho gaya.

Campaign later:

```text id="cf038"
AD2
```

par continue hua.

System history:

```text id="cf039"
17 Sep
AD1

18 Sep
AD1 Restricted

18 Sep
Job Reassigned to AD2
```

Previous mapping delete nahi hogi.

---

# 22. Multiple Ad Accounts Per Client Job

A client job may use:

```text id="cf040"
AD1
+
AD2
```

if business requires.

In that case allocations separate honi chahiye.

Example:

```text id="cf041"
JOB-001 Total:
₹20,000

AD1 Allocation:
₹12,000

AD2 Allocation:
₹8,000
```

---

# 23. Campaign Start

Job operational status:

```text id="cf042"
ACTIVE
```

jab actual campaign work start ho.

Financial system me allocation aur spend tracking simultaneously begin hogi.

---

# 24. Spend Tracking

Meta se actual spend sync hoga.

Example:

```text id="cf043"
JOB-001

Allocated:
₹20,000

Spend:
₹6,500
```

Remaining:

```text id="cf044"
₹13,500
```

---

# 25. Spend Mapping

Meta spend ko correct client/job ke against map karna mandatory hai.

Possible mapping basis:

```text id="cf045"
Meta Campaign ID

Internal Job ID

Ad Account ID

Date Range
```

Best practice:

> Explicit Meta Campaign ↔ Client Job mapping maintain karna.

---

# 26. Campaign-Level Spend Preferred

Agar ek Ad Account multiple clients ke liye use hota hai, sirf account-level spend enough nahi hoga.

Example:

```text id="cf046"
AD1 Total Spend:
₹10,000
```

But:

```text id="cf047"
Client A:
₹6,000

Client B:
₹4,000
```

Need campaign-level mapping.

---

# 27. Account-Level Spend vs Client Spend

System ko distinguish karna hai:

```text id="cf048"
Ad Account Spend
```

and:

```text id="cf049"
Client Attributed Spend
```

Difference unresolved hone par reconciliation issue generate ho sakta hai.

---

# 28. Client Spend Formula

Basic:

```text id="cf050"
Client Job Spend
=
Sum of mapped Meta campaign spend
```

subject to:

```text id="cf051"
Adjustments

Taxes

Credits

Other configured costs
```

if future business model requires.

---

# 29. Client Remaining Balance

Basic calculation:

```text id="cf052"
Allocated Amount
-
Recognized Spend
=
Remaining Allocation
```

Example:

```text id="cf053"
₹10,000
-
₹7,000
=
₹3,000
```

---

# 30. Campaign Completion

Campaign operationally complete ho sakta hai when business work ends.

Example:

```text id="cf054"
JOB-001

Operational Status:
COMPLETED
```

But financial settlement check still required.

---

# 31. Financial Closure Check

Before job financially close ho:

```text id="cf055"
Allocated
Spend
Unused Balance
Refund
Transfer
Locked Balance
Pending Adjustment
```

all resolve hone chahiye.

---

# 32. Unused Client Balance

Example:

```text id="cf056"
Allocated:
₹10,000

Spend:
₹7,000

Unused:
₹3,000
```

Default rule:

```text id="cf057"
Unused amount remains client-owned
```

until authorized action changes it.

---

# 33. Unused Balance Resolution Options

Possible actions:

```text id="cf058"
KEEP_IN_CLIENT_WALLET

USE_IN_NEXT_CLIENT_JOB

REFUND_TO_CLIENT

TRANSFER_WITH_APPROVAL

CONVERT_TO_AGENCY_FUND_WITH_VALID_BUSINESS_RULE
```

No silent transfer.

---

# 34. Keep in Client Wallet

Example:

```text id="cf059"
JOB-001 Unused:
₹3,000
```

Move:

```text id="cf060"
JOB-001
↓
Client A Wallet
₹3,000
```

Client can use later.

---

# 35. Use in Same Client's Next Job

Example:

```text id="cf061"
Client A Wallet:
₹3,000
```

New:

```text id="cf062"
JOB-002
```

Allocation:

```text id="cf063"
₹3,000
```

Trace:

```text id="cf064"
JOB-001 leftover
↓
Client Wallet
↓
JOB-002
```

---

# 36. Refund to Client

Client unused amount refund:

```text id="cf065"
Unused:
₹3,000
```

Create:

```text id="cf066"
Refund Request
₹3,000
```

Status:

```text id="cf067"
REFUND_PENDING
```

After actual payment:

```text id="cf068"
REFUNDED
```

---

# 37. Refund Is Financial Transaction

Refund complete hone par:

```text id="cf069"
Client Wallet / Payable
↓
External Client
```

transaction record required.

---

# 38. Refund Proof

Refund should optionally include:

```text id="cf070"
Payment Reference

UTR

Screenshot

Date

Processed By
```

---

# 39. Cross-Client Transfer

Client A balance directly Client B ko use karna sensitive action hai.

Example:

```text id="cf071"
Client A:
₹300
```

Need:

```text id="cf072"
Authorized Transfer
```

No silent reassignment.

---

# 40. Preferred Cross-Client Flow

Safer model:

```text id="cf073"
Client A
↓
Approved Settlement / Ownership Change
↓
Agency Pool
↓
Client B Allocation
```

rather than direct unexplained transfer.

Actual commercial/legal rule business policy ke according defined hoga.

---

# 41. Agency Conversion

If company has valid business right to retain unused amount:

```text id="cf074"
Client Unused Balance
↓
Approved Ownership Transfer
↓
Agency Fund
```

This action must include:

```text id="cf075"
Reason

Approval

Amount

Date

Reference
```

---

# 42. Restricted Ad Account During Client Campaign

Scenario:

```text id="cf076"
Client A Allocation:
₹5,000

Spend:
₹3,000

Remaining:
₹2,000
```

Ad Account restricted.

System:

```text id="cf077"
Spent:
₹3,000

Locked:
₹2,000
```

Client ownership remains.

---

# 43. Client Locked Fund

Client detail:

```text id="cf078"
Client A

Available:
₹0

Locked:
₹2,000
```

Linked to:

```text id="cf079"
Ads Pro / BP1 / AD1
```

---

# 44. Restricted Fund Recovery

If account restores:

```text id="cf080"
Locked ₹2,000
↓
Available ₹2,000
```

If Meta refund:

```text id="cf081"
Locked
↓
Refund Received
↓
Client Wallet / Settlement
```

---

# 45. Moving Client Campaign After Restriction

If campaign needs continue:

```text id="cf082"
Old Account:
AD1
Restricted
```

New account:

```text id="cf083"
AD2
```

Possible funding:

```text id="cf084"
New Client Payment

Client Wallet Existing Balance

Agency Temporary Fund

Other approved funding
```

Locked AD1 balance separately remains tracked.

---

# 46. Agency Temporary Funding

Example:

Client A ka ₹2,000 AD1 me locked hai.

Campaign urgently continue karna hai.

Agency provides:

```text id="cf085"
₹2,000
```

to AD2.

System must not assume locked client money has moved.

Record:

```text id="cf086"
Client A Locked:
₹2,000

Agency Temporary Funding:
₹2,000
```

Two separate amounts.

---

# 47. Later Locked Fund Recovered

If original ₹2,000 recover ho:

system may settle agency temporary funding through approved process.

Example:

```text id="cf087"
Recovered Client Fund:
₹2,000
```

Then:

```text id="cf088"
Agency Recovery / Adjustment
₹2,000
```

Trace required.

---

# 48. Client Over-Funding

Client may pay more than current requirement.

Example:

```text id="cf089"
Current Job Budget:
₹10,000

Client Payment:
₹15,000
```

Difference:

```text id="cf090"
₹5,000
```

should remain:

```text id="cf091"
Client Wallet Available
```

unless allocated elsewhere.

---

# 49. Client Under-Funding

Example:

```text id="cf092"
Job Budget:
₹20,000

Client Payment:
₹10,000
```

System should show:

```text id="cf093"
Funding Gap:
₹10,000
```

If company chooses to fund gap, source must be recorded.

---

# 50. Client Outstanding

Client may owe company money.

Example:

```text id="cf094"
Recognized Client Obligation:
₹20,000

Received:
₹15,000

Outstanding:
₹5,000
```

This should be separate from unused client balance.

---

# 51. Client Receivable

If business model includes credit billing:

```text id="cf095"
Client Receivable
```

means client owes company.

Do not confuse with:

```text id="cf096"
Client Wallet Balance
```

which means company holds client-owned funds.

---

# 52. Client Financial Summary

Client profile should show:

```text id="cf097"
Total Payments Received

Total Ads Allocated

Total Spend

Current Wallet Balance

Unused Campaign Balance

Locked Fund

Refund Pending

Refunded

Client Outstanding / Receivable
```

---

# 53. Example Client Dashboard

```text id="cf098"
CLIENT A

Received:
₹50,000

Allocated:
₹45,000

Actual Spend:
₹38,000

Wallet Available:
₹5,000

Unused in Active/Closed Jobs:
₹4,000

Locked:
₹3,000

Refund Pending:
₹0
```

Numbers should be backed by ledger/allocation records.

---

# 54. Job-Level Summary

Example:

```text id="cf099"
JOB-001

Budget:
₹20,000

Funded:
₹20,000

Allocated:
₹20,000

Spend:
₹17,000

Unused:
₹3,000

Operational:
COMPLETED

Financial:
UNUSED_BALANCE_PENDING
```

---

# 55. Client Statement

System should be able to generate chronological statement:

```text id="cf100"
01 Sep
Payment Received
+₹20,000

02 Sep
Allocated to JOB-001
-₹15,000 wallet

05 Sep
Additional Payment
+₹10,000

10 Sep
JOB-001 Completed
₹3,000 returned to wallet

12 Sep
Allocated to JOB-002
-₹5,000 wallet
```

---

# 56. Client Money Source Trace

For any amount:

```text id="cf101"
₹3,000
```

system should answer:

```text id="cf102"
Originally received:
Payment PAY-001

Client:
Client A

Used in:
JOB-001

Unused:
₹3,000

Returned to:
Client Wallet

Later allocated:
JOB-002
```

---

# 57. Client Money Must Not Disappear

Core equation concept:

```text id="cf103"
Client Money Received
=
Current Client-Owned Balance
+ Valid Spend
+ Refunds
+ Authorized Ownership Transfers
+ Other Valid Settlements
```

Any unexplained difference should trigger reconciliation.

---

# 58. Client Fund Ownership Rule

Default:

```text id="cf104"
Money received specifically for Client A
remains Client A-associated
```

until:

```text id="cf105"
Spend

Refund

Authorized Ownership Transfer

Settlement
```

occurs.

---

# 59. Allocation Ownership Rule

Allocation does not transfer ownership to the Ad Account.

Example:

```text id="cf106"
Client A ₹5,000
allocated to AD1
```

still:

```text id="cf107"
Owner:
Client A

Location:
AD1

Purpose:
JOB-001
```

---

# 60. Client Fund State Model

Possible states:

```text id="cf108"
AVAILABLE_IN_WALLET

ALLOCATED_TO_JOB

ALLOCATED_TO_AD_ACCOUNT

SPENT

UNUSED

LOCKED

REFUND_PENDING

REFUNDED

TRANSFER_PENDING

TRANSFERRED

SETTLED
```

---

# 61. Client Job Financial State Model

Possible:

```text id="cf109"
UNFUNDED

PARTIALLY_FUNDED

FUNDED

ACTIVE

PARTIALLY_SPENT

FULLY_SPENT

UNUSED_BALANCE_PENDING

LOCKED_FUNDS

REFUND_PENDING

SETTLED
```

---

# 62. Client Closure Rule

Client account close karne se pehle ideally check:

```text id="cf110"
Wallet Balance = ₹0?

Locked Funds = ₹0?

Refund Pending = ₹0?

Open Jobs = 0?

Client Receivable = ₹0?

Unresolved Reconciliation = 0?
```

If not:

```text id="cf111"
Financial Closure Pending
```

show hona chahiye.

---

# 63. Job Closure Rule

Job `COMPLETED` ho sakta hai operationally.

But `SETTLED` tab:

```text id="cf112"
Unused resolved

Locked fund resolved or separately carried

Refund resolved

Spend reconciled

No unexplained balance
```

---

# 64. Client Deletion Rule

Financial history wale Client ko hard delete nahi karna.

Use:

```text id="cf113"
INACTIVE
```

or:

```text id="cf114"
CLOSED
```

Historical transactions preserve honge.

---

# 65. Duplicate Client Protection

Possible duplicate indicators:

```text id="cf115"
Phone

Email

Company Name

External Client Code
```

But business may allow same company multiple entities.

Duplicate prevention should warn, not blindly block unless exact internal rule says so.

---

# 66. Client Internal ID

Use stable system ID:

```text id="cf116"
CLI-0001
```

Client name can change.

Historical relationships remain linked to ID.

---

# 67. Client Job Internal ID

Example:

```text id="cf117"
JOB-000001
```

Do not rely on campaign name for uniqueness.

---

# 68. Meta Campaign Mapping

Recommended record:

```text id="cf118"
Client Job:
JOB-001

Meta Campaign:
12000000001

Ad Account:
act_123456

Mapping Status:
ACTIVE
```

---

# 69. Campaign Mapping History

If campaign changes:

```text id="cf119"
JOB-001

Campaign A
01–05 Sep

Campaign B
06–10 Sep
```

Both mappings preserve honi chahiye.

---

# 70. Spend Attribution Rule

Spend should never be randomly assigned based only on client name.

Priority:

```text id="cf120"
Explicit Campaign Mapping

then

Explicit Ad Set Mapping if needed

then

Approved Manual Attribution
```

Unmapped spend:

```text id="cf121"
UNATTRIBUTED
```

remain kare until resolved.

---

# 71. Unattributed Spend

Example:

```text id="cf122"
AD1 Spend:
₹10,000

Mapped Client Spend:
₹9,500

Unattributed:
₹500
```

System alert:

```text id="cf123"
SPEND_ATTRIBUTION_MISMATCH
₹500
```

---

# 72. Client Reconciliation

Client-level reconciliation compare kare:

```text id="cf124"
Client Payments
+
Other Approved Funding
```

against:

```text id="cf125"
Spend
+
Wallet Balance
+
Locked Balance
+
Refund
+
Authorized Transfers
```

---

# 73. Example Complete Client Flow

Client A:

```text id="cf126"
Payment:
₹10,000
```

Wallet:

```text id="cf127"
₹10,000
```

Allocate:

```text id="cf128"
JOB-001
₹10,000
```

Assigned:

```text id="cf129"
AD1
```

Spend:

```text id="cf130"
₹7,000
```

Remaining:

```text id="cf131"
₹3,000
```

Job complete.

Decision:

```text id="cf132"
₹3,000
→ Client Wallet
```

New state:

```text id="cf133"
Client Wallet:
₹3,000

JOB-001:
SETTLED
```

---

# 74. Example With Refund

Client A:

```text id="cf134"
Unused:
₹3,000
```

Refund initiated:

```text id="cf135"
₹3,000
REFUND_PENDING
```

After transfer:

```text id="cf136"
₹3,000
REFUNDED
```

Wallet:

```text id="cf137"
₹0
```

---

# 75. Example With Restricted Account

```text id="cf138"
Client A

Allocation:
₹10,000

Spend:
₹6,000

Remaining:
₹4,000
```

AD1 restricted.

Result:

```text id="cf139"
Spent:
₹6,000

Locked:
₹4,000
```

Client profile:

```text id="cf140"
Available Wallet:
₹0

Locked Fund:
₹4,000
```

---

# 76. Example With Additional Funding

Campaign must continue.

Agency gives:

```text id="cf141"
₹4,000
```

to AD2.

System:

```text id="cf142"
Client A Original Locked:
₹4,000

Agency Temporary Funding:
₹4,000

New Campaign Continuation:
AD2
```

Do not merge original locked fund and temporary funding.

---

# 77. Example With Client Overpayment

Client requirement:

```text id="cf143"
₹10,000
```

Client pays:

```text id="cf144"
₹15,000
```

Result:

```text id="cf145"
Job Allocation:
₹10,000

Client Wallet Free:
₹5,000
```

No automatic agency conversion.

---

# 78. Example With Multiple Jobs

```text id="cf146"
Client A Wallet:
₹30,000
```

Allocate:

```text id="cf147"
JOB-001:
₹10,000

JOB-002:
₹15,000
```

Free:

```text id="cf148"
₹5,000
```

Each job independent settlement track karega.

---

# 79. Example With Same Ad Account

```text id="cf149"
AD1
```

contains:

```text id="cf150"
Client A JOB-001:
₹5,000

Client B JOB-010:
₹7,000

Agency:
₹3,000
```

System account total:

```text id="cf151"
₹15,000
```

but client ownership separate.

---

# 80. Required Client Screens

V1 should have:

```text id="cf152"
Client List

Client Detail

Client Wallet

Client Payments

Client Jobs

Client Allocations

Unused Balances

Locked Funds

Refunds

Transaction History
```

---

# 81. Client List Columns

Recommended:

```text id="cf153"
Client Name

Status

Wallet Balance

Active Jobs

Total Spend

Locked Fund

Refund Pending

Outstanding

Last Activity
```

---

# 82. Client Detail Tabs

Recommended:

```text id="cf154"
Overview

Payments

Jobs

Wallet

Allocations

Spend

Unused Funds

Locked Funds

Refunds

Ledger

Audit
```

---

# 83. Client Alerts

Possible:

```text id="cf155"
CLIENT_PAYMENT_PENDING

CLIENT_UNDERFUNDED

CLIENT_UNUSED_BALANCE

CLIENT_LOCKED_FUND

CLIENT_REFUND_PENDING

CLIENT_RECONCILIATION_MISMATCH

UNATTRIBUTED_SPEND

CLIENT_FINANCIAL_CLOSURE_PENDING
```

---

# 84. Required Approvals

Depending on company policy, approval may be required for:

```text id="cf156"
Cross-client transfer

Client-to-agency ownership change

Large refund

Manual spend adjustment

Write-off

Financial reversal
```

---

# 85. Client Audit Requirements

Audit should capture:

```text id="cf157"
Client Created

Payment Added

Job Created

Allocation Created

Ad Account Assigned

Fund Reallocated

Refund Requested

Refund Completed

Financial Adjustment

Job Closed
```

---

# 86. Client Data Ownership

Client financial data should not be editable by all roles.

Possible permissions:

```text id="cf158"
Ads Manager:
View assigned client financial summary

Finance:
Create payments/refunds

Admin:
Approve high-risk adjustments

Viewer:
Read-only
```

---

# 87. Client Flow Integrity Rules

System must enforce:

```text id="cf159"
1. Client Payment and Client Budget are separate.

2. Client Wallet balance is transaction-driven.

3. Allocation does not equal spend.

4. Spend must map to a client/job where possible.

5. Unused fund must remain traceable.

6. Unused client fund cannot silently become agency fund.

7. Restricted fund remains client-owned.

8. Cross-client transfer requires explicit record.

9. Refund requires a transaction and status.

10. Operational completion does not automatically mean financial settlement.

11. Posted financial records are not silently edited.

12. Client history cannot be destroyed by account closure.
```

---

# 88. Client Flow Golden Rule

> **Every client payment must be traceable from receipt to final use. At any point, the system must be able to explain how much the client paid, how much was allocated, how much was actually spent, how much remains, where the remaining amount is located, whether any amount is locked, refunded or transferred, and whether the client is financially settled.**
