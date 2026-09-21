# Business Model

## Overview

Company multiple clients ke liye Meta advertising operations manage karti hai.

Business model me sirf ads run karna involved nahi hai. Actual operational model me multiple financial sources, multiple Ad Accounts, multiple Business Portfolios, client budgets, vendor funding, campaign spend, unused balances, restricted funds aur settlements ek saath manage hote hain.

Isliye business ko samajhne ke liye sirf:

```text
Client
↓
Ads
```

model enough nahi hai.

Actual business flow zyada complex hai:

```text
Clients
   │
   ├── Client Payments
   │
   └── Advertising Requirements
   │
   ▼
Company Financial & Ads Operations
   │
   ├── Agency Funds
   ├── Vendor Funds
   ├── Existing Ad Account Balances
   └── Client Funds
   │
   ▼
Meta Ad Accounts
   │
   ▼
Campaign Spend
   │
   ├── Completed Spend
   ├── Remaining Balance
   ├── Locked Balance
   └── Refund / Reallocation
```

Parallel financial relationship:

```text
Vendor
  │
  │ Funding
  ▼
Company
  │
  │ Repayment
  ▼
Vendor
```

The system being built must support both:

```text
Advertising Operations
+
Financial Operations
```

---

# 1. Core Business Activity

Company ka primary operational activity clients ke liye Meta advertising campaigns manage karna hai.

Typical client requirement:

```text
Client A

Required Ads Budget:
₹20,000
```

Company client ke requirement ke according suitable Meta Ad Account identify karti hai aur campaign run karti hai.

Campaign ka actual spend planned budget ke equal hona zaroori nahi.

Example:

```text
Planned Budget:
₹20,000

Actual Spend:
₹17,500

Unused:
₹2,500
```

Is unused amount ka financial handling business model ka important part hai.

---

# 2. Main Business Participants

Business me primarily following entities involved hain:

```text
Company

Clients

Vendors

Meta

Internal Team Members
```

In sabki different financial aur operational roles hain.

---

# 3. Company

Company central operator hai.

Company responsibilities:

```text
Client onboarding

Client requirement handling

Meta Ad Account selection

Campaign operation

Fund management

Vendor funding management

Client payment tracking

Vendor repayment

Unused fund management

Restricted fund monitoring

Financial reconciliation

Account monitoring
```

Company ke paas apna operational/agency fund bhi ho sakta hai.

---

# 4. Clients

Clients company ko advertising work ke liye engage karte hain.

Client company ko:

```text
Budget

Payment

Campaign Requirement

Timeline

Targeting / Campaign Requirement
```

provide kar sakta hai.

Client ke perspective se important financial values:

```text
Agreed Budget

Amount Received

Amount Allocated

Actual Ad Spend

Unused Balance

Refunded Amount

Locked Amount

Outstanding Amount
```

---

# 5. Vendors

Vendors company ko large financial funding/credit provide kar sakte hain.

Example:

```text
Vendor:
RAM

Funding:
₹1,00,000
```

Company vendor ke fund ko advertising operations ke liye use kar sakti hai aur later incoming client collections ke through vendor ko repay karti hai.

Vendor model therefore:

```text
Vendor Funding
      ↓
Company Operations
      ↓
Client Collections
      ↓
Vendor Repayment
```

---

# 6. Meta

Meta advertising infrastructure provide karta hai.

Meta ke through:

```text
Business Portfolios

Ad Accounts

Campaigns

Ad Sets

Ads

Spend

Account Status
```

operate hote hain.

Meta company ka financial accounting system nahi hai.

Meta primarily advertising execution platform hai.

---

# 7. Internal Team

Different team members different actions perform kar sakte hain.

Examples:

```text
Admin

Finance Team

Ads Manager

Viewer
```

Potential responsibilities:

### Ads Manager

```text
Ad Account selection

Campaign monitoring

Spend tracking

Account status monitoring
```

### Finance

```text
Client payments

Vendor funding

Vendor settlements

Refunds

Fund transfers

Reconciliation
```

### Admin

```text
Approvals

Configuration

User access

Manual financial corrections

High-risk actions
```

---

# 8. Business Asset Hierarchy

Meta asset hierarchy:

```text
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
      ↓
Campaign
```

Example:

```text
Ads Pro
│
├── BP1
│   ├── AD1
│   ├── AD2
│   └── AD3
│
└── BP2
    ├── AD4
    ├── AD5
    └── AD6
```

Company ke paas multiple Meta Connections ho sakte hain.

---

# 9. Client Business Flow

Basic client lifecycle:

```text
Client Created
      ↓
Client Requirement
      ↓
Budget Defined
      ↓
Payment Received
      ↓
Client Wallet
      ↓
Campaign / Job Created
      ↓
Ad Account Assigned
      ↓
Fund Allocated
      ↓
Campaign Runs
      ↓
Spend Recorded
      ↓
Campaign Completed
      ↓
Remaining Fund Resolved
```

---

# 10. Client Requirement

Client ke requirement record me minimum:

```text
Client

Campaign Type

Budget

Expected Duration

Start Date

Target Platform

Assigned Team Member

Notes
```

ho sakte hain.

Example:

```text
Client:
Client A

Requirement:
Meta Lead Generation

Budget:
₹20,000

Duration:
10 Days
```

---

# 11. Client Payment vs Client Budget

Ye two separate concepts hain.

Example:

```text
Client Budget:
₹20,000

Client Payment Received:
₹15,000
```

Client budget agreed campaign amount represent karta hai.

Payment received actual money received represent karta hai.

System ko dono separately maintain karna chahiye.

---

# 12. Client Wallet Model

Client ke received funds initially logical:

```text
Client Wallet
```

me store honge.

Example:

```text
Client A Wallet

Received:
₹20,000

Available:
₹20,000
```

Campaign allocate hone ke baad:

```text
Received:
₹20,000

Allocated:
₹15,000

Available:
₹5,000
```

---

# 13. Campaign Allocation

Client wallet se campaign ke liye amount allocate kiya jayega.

Example:

```text
Client A Wallet
₹20,000

↓ Allocate ₹15,000

Campaign CAM-001
₹15,000
```

Allocation aur actual spend different rahenge.

---

# 14. Ad Account Selection

Campaign run karne ke liye system suitable Ad Account select karega.

Initially selection manual ho sakti hai.

Selection factors:

```text
Account Status

Available Fund

Currency

Business Portfolio

Client Assignment

Account Capacity

Restriction Status
```

---

# 15. Ad Account Financial Model

Ad Account me total amount multiple financial owners ka ho sakta hai.

Example:

```text
AD1

Client A:
₹5,000

Client B:
₹4,000

Agency:
₹3,000

Total:
₹12,000
```

Therefore:

```text
Physical / Tracked Account Balance
```

and:

```text
Financial Ownership
```

must remain separate concepts.

---

# 16. Campaign Spend

Campaign spend Meta data ke through sync kiya ja sakta hai.

Example:

```text
Client A Campaign

Allocated:
₹10,000

Spend:
₹7,500

Remaining:
₹2,500
```

Spend allocation logic system ko identify karna hoga.

---

# 17. Client Campaign Completion

Campaign operationally completed ho sakta hai even when financial settlement pending ho.

Example:

```text
Campaign Status:
COMPLETED

Financial Status:
UNSETTLED
```

Reason:

```text
₹2,500 unused balance still unresolved
```

---

# 18. Unused Client Balance

Client budget ka unspent portion:

```text
Unused Client Balance
```

kehlaega.

Example:

```text
Allocated:
₹10,000

Spent:
₹7,000

Unused:
₹3,000
```

Ye amount automatically agency fund nahi banega.

Default ownership:

```text
Client
```

rahegi until valid action occurs.

---

# 19. Unused Balance Resolution

Unused balance ke possible outcomes:

```text
Keep in Client Wallet

Use in Same Client's Next Campaign

Refund to Client

Authorized Transfer

Convert to Agency Fund
```

Business policy define karegi ki kaunsi actions allowed hain.

Every action recorded transaction hogi.

---

# 20. Cross-Client Fund Use

Agar Client A ka ₹300 Client B ke liye use hota hai, system me explicit reallocation required hoga.

Incorrect model:

```text
Client A leftover
↓
Directly Client B spend
```

without record.

Correct model:

```text
Client A Balance
      ↓
Authorized Reallocation
      ↓
Destination Pool / Client B
      ↓
Client B Campaign
```

Original source history preserve hogi.

---

# 21. Agency Fund Model

Company ke paas apna fund ho sakta hai.

Example:

```text
Agency Free Fund:
₹50,000
```

Agency fund use cases:

```text
Temporary Client Funding

Campaign Continuation

Internal Ads

Operational Funding

Approved Adjustment
```

Agency fund client fund se separate rahega.

---

# 22. Vendor Funding Model

Vendor company ko funding provide karta hai.

Example:

```text
RAM
₹1,00,000
```

System funding create karega:

```text
Vendor:
RAM

Batch:
RAM-RF-001

Amount:
₹1,00,000

Outstanding Payable:
₹1,00,000
```

---

# 23. Vendor Funding Batches

Every vendor funding separate batch hogi.

Example:

```text
RAM-RF-001
₹1,00,000

RAM-RF-002
₹2,00,000
```

Reason:

Funding lifecycle independently trace karna.

---

# 24. Vendor Fund Usage

Vendor ka provided fund business operations me use ho sakta hai.

Potential flow:

```text
RAM Funding
₹1,00,000
      ↓
Company Financial Pool
      ↓
Ad Account Funding
      ↓
Client Campaigns
```

System ko funding source lineage preserve karne ki capability honi chahiye where required.

---

# 25. Vendor Repayment Model

Vendor repayments incoming client collections ke through ho sakte hain.

Example:

```text
RAM Outstanding:
₹1,00,000
```

Client collections:

```text
Client A ₹20,000
Client B ₹20,000
Client C ₹20,000
Client D ₹20,000
Client E ₹20,000
```

Repayments:

```text
₹20,000 × 5
=
₹1,00,000
```

Result:

```text
RAM Payable:
₹0

Status:
SETTLED
```

---

# 26. Vendor Overpayment Model

Suppose Ram completely settled hai.

```text
RAM Payable:
₹0
```

Another ₹10,000 Ram ko transfer ho gaya.

System should not show:

```text
Vendor Repayment:
₹10,000
```

as normal repayment.

Instead:

```text
Vendor Overpayment:
₹10,000
```

creates:

```text
Vendor Receivable:
₹10,000
```

Meaning:

```text
RAM OWES COMPANY ₹10,000
```

---

# 27. Vendor Receivable Recovery

Vendor receivable resolve ho sakta hai:

```text
Vendor returns money

Adjusted against future vendor funding

Authorized write-off

Other approved adjustment
```

Resolution transaction mandatory hai.

---

# 28. Vendor Future Funding Adjustment

Example:

```text
RAM Receivable:
₹10,000
```

Ram later new funding deta hai:

```text
₹2,00,000
```

Company approved adjustment kar sakti hai:

```text
New Funding:
₹2,00,000

Old Receivable Adjustment:
₹10,000

Net Payable Position:
₹1,90,000
```

Adjustment silently perform nahi hoga.

Transaction create hogi.

---

# 29. Restricted Ad Account Model

Scenario:

```text
AD1

Available Fund:
₹5,000
```

Account restricted.

System:

```text
Account Status:
RESTRICTED

Available:
₹0

Locked:
₹5,000
```

Ownership unchanged.

---

# 30. Restricted Fund Ownership

Example:

```text
AD1 Locked Fund:
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

System ko individual ownership preserve karna hai.

---

# 31. Restricted Account Recovery

If account restored:

```text
LOCKED
↓
AVAILABLE
```

If refund received:

```text
LOCKED
↓
REFUND
```

If permanent loss/adjustment:

```text
LOCKED
↓
AUTHORIZED ADJUSTMENT
```

Every resolution traceable hogi.

---

# 32. Meta Operational Data

Meta automatically provide kar sakta hai:

```text
Ad Accounts

Business Portfolios

Account Status

Spend

Campaign Information

Balance-related information

Currency

Timezone
```

Ye operational truth hai.

---

# 33. Internal Financial Data

Company system maintain karega:

```text
Client Payments

Client Wallets

Client Allocations

Vendor Funding

Vendor Repayments

Vendor Receivables

Agency Funds

Unused Balances

Locked Fund Ownership

Refunds

Adjustments

Transfers
```

---

# 34. Meta vs Internal Accounting

Meta:

```text
"What happened on the advertising platform?"
```

Internal system:

```text
"Whose money was it and why did it move?"
```

Dono required hain.

---

# 35. Core Money Flow

Generic money flow:

```text
SOURCE
  ↓
OWNER
  ↓
FINANCIAL LOCATION
  ↓
PURPOSE
  ↓
SPEND / TRANSFER / REFUND
  ↓
FINAL STATE
```

Every financial unit ko ideally is model se traceable hona chahiye.

---

# 36. Money Sources

Possible fund sources:

```text
Client Payment

Vendor Funding

Agency Funding

Meta Refund

Recovered Vendor Receivable

Adjustment
```

---

# 37. Money Owners

Possible financial owners:

```text
Client

Agency

Company

Vendor-related obligation
```

Ownership business rules ke according change ho sakti hai, but change recorded hona chahiye.

---

# 38. Money Locations

Possible locations:

```text
Company Bank

Client Wallet

Agency Pool

Ad Account

Vendor

Locked Fund

Refund Pending
```

---

# 39. Money States

Possible states:

```text
AVAILABLE

ALLOCATED

SPENT

LOCKED

REFUND_PENDING

REFUNDED

TRANSFERRED

RECEIVABLE

PAYABLE

ADJUSTED
```

---

# 40. Business Source of Truth

Different areas ke different authoritative sources honge.

### Meta Asset State

```text
Meta API
```

### Internal Financial Movement

```text
Financial Ledger
```

### Business Ownership

```text
Allocation / Ownership Records
```

### Historical Action

```text
Audit Log
```

---

# 41. Revenue vs Advertising Fund

System ko future me clearly distinguish karna chahiye:

```text
Client Advertising Fund
```

and:

```text
Company Revenue / Service Fee
```

These are not necessarily the same.

Example:

```text
Client Pays:
₹25,000

Ads Budget:
₹20,000

Service Fee:
₹5,000
```

V1 me exact billing model business configuration ke according define kiya ja sakta hai.

Financial architecture should not assume complete client payment equals ad spend.

---

# 42. Service Fee Support

Future/optional model:

```text
Client Payment
₹25,000
      │
      ├── Ads Fund ₹20,000
      └── Service Revenue ₹5,000
```

This separation important hai if company later profitability reporting implement karti hai.

---

# 43. Campaign Cost Model

Actual client campaign cost future me include kar sakta hai:

```text
Meta Ad Spend

Platform Charges

Vendor Charges

Taxes

Service Fee

Other Operational Cost
```

V1 primarily ad fund control par focus karega.

---

# 44. Business Profitability

Profitability V1 ka primary goal nahi hai, but architecture future support kare.

Potential calculation:

```text
Client Revenue
-
Ad Spend
-
Vendor Cost
-
Other Direct Cost
=
Gross Margin
```

Ye later reporting module ka part ho sakta hai.

---

# 45. Client Settlement Model

Client campaign complete hone par financial settlement check required hai.

Example:

```text
Budget:
₹20,000

Spend:
₹17,500

Unused:
₹2,500
```

Campaign cannot be financially closed until ₹2,500 resolution defined.

---

# 46. Vendor Settlement Model

Vendor financially settled only when:

```text
Vendor Payable = ₹0
```

and no unresolved linked settlement issue remains.

If:

```text
Vendor Receivable > ₹0
```

vendor relationship may be:

```text
OVERPAID
```

not simply settled.

---

# 47. Business Control Principle

No money should move solely because:

```text
"We normally do this."
```

System should require identifiable reason.

Examples:

```text
Client Allocation

Vendor Repayment

Refund

Reallocation

Agency Funding

Adjustment
```

---

# 48. Operational Control Principle

No Ad Account should exist in internal operation without clear mapping:

```text
Meta Connection

Business Portfolio

Meta Ad Account ID

Status
```

Optional additional mappings:

```text
Assigned Manager

Assigned Client

Purpose
```

---

# 49. Financial Control Principle

No financial amount should exist without sufficient context.

Every amount should ideally answer:

```text
Where did it come from?

Who owns it?

Where is it?

What is it for?

What is its current state?

How did it reach here?
```

---

# 50. Business Risk Areas

System specifically following risks reduce karega:

```text
Forgotten Ad Account Funds

Restricted Funds Lost From Tracking

Client Leftover Confusion

Cross-Client Fund Mixing

Vendor Overpayment

Vendor Outstanding Confusion

Duplicate Payment

Incorrect Balance

Missing Payment Proof

Missing Historical Context

Unapproved Fund Transfer

Financial Reconciliation Errors
```

---

# 51. Management View

Management ko system se broad financial picture milna chahiye.

Example:

```text
Total Meta Funds

Total Client Funds

Total Agency Funds

Total Locked Funds

Total Vendor Payable

Total Vendor Receivable

Total Unused Client Balance

Total Spend Today

Active Accounts

Restricted Accounts
```

---

# 52. Operational View

Ads team ko:

```text
Available Ad Accounts

Account Status

Current Spend

Available Fund

Assigned Clients

Restriction Alerts

Low Balance Alerts
```

primarily visible honge.

---

# 53. Finance View

Finance team ko:

```text
Client Payments

Vendor Funding

Vendor Payables

Vendor Receivables

Refunds

Fund Transfers

Unused Balances

Reconciliation Issues
```

primarily visible honge.

---

# 54. Audit View

Admin/auditor ko:

```text
Transaction History

Reversals

Adjustments

Approvals

User Activity

Payment Proofs

Status Changes
```

available honge.

---

# 55. Business Scalability Model

System ka business model quantity-independent hona chahiye.

Same process work kare:

```text
1 Vendor
10 Vendors
100 Vendors
```

and:

```text
5 Clients
100 Clients
1000 Clients
```

and:

```text
10 Ad Accounts
500 Ad Accounts
```

---

# 56. Core Business Rules Summary

```text
1. Every Ad Account must be uniquely identifiable.

2. Every fund must have a source.

3. Every active amount must have an owner.

4. Fund ownership and fund location are separate concepts.

5. Allocation is not the same as spend.

6. Client unused balance remains client-owned unless an authorized action changes it.

7. Restricted account fund becomes locked, not deleted.

8. Vendor funding must be batch-based.

9. Vendor repayment must reduce actual payable.

10. Payment beyond vendor payable becomes receivable.

11. Financial balances must be transaction-driven.

12. Posted transactions cannot be silently edited.

13. All important financial movements must be auditable.

14. Meta data and internal financial data must remain distinguishable.

15. Financial mismatches must be reconciled.
```

---

# Final Business Model Definition

> **The business operates as a managed advertising and fund-control environment where client funds, vendor funding, agency money and Meta advertising assets interact continuously. The system must therefore manage not only where ads run, but also who owns each amount, where the money currently exists, why it moved, how much was spent, what remains, what is locked, what must be paid, and what must be recovered.**
