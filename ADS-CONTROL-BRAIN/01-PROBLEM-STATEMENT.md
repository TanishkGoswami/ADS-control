# Problem Statement

## Overview

Company multiple Meta advertising assets, multiple clients aur multiple vendors ko simultaneously manage karti hai.

Operational structure simple nahi hai.

Ek typical structure:

```text
Main Meta Connection
        ↓
Business Portfolio
        ↓
Ad Account
        ↓
Client Campaign
```

Lekin real-world operations me iske saath financial complexity bhi attached hai:

```text
Client Payments
Vendor Funding
Agency Funds
Ad Account Top-Ups
Client Allocations
Campaign Spend
Unused Client Balance
Restricted Account Funds
Refunds
Vendor Repayments
Vendor Overpayments
Manual Adjustments
```

Current process me in sab cheezon ka centralized, reliable aur auditable record maintain karna difficult hai.

Is project ka purpose in problems ko solve karna hai.

---

# Problem 1: Meta Account Hierarchy Clear Nahi Hoti

Company ke paas multiple Meta/Facebook accounts ho sakte hain.

Har main account ke andar multiple Business Portfolios ho sakte hain.

Har Business Portfolio ke andar multiple Ad Accounts ho sakte hain.

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

Jaise-jaise number increase hota hai, ye manually yaad rakhna difficult ho jata hai:

* Kaunsa Ad Account kis BP me hai
* Kaunsa BP kis main Meta account ke under hai
* Kaunsa account currently active hai
* Kaunsa restricted hai
* Kaunsa disabled hai
* Kaunsa account kis client ke liye use ho raha hai

Same Ad Account name multiple jagah ho sakta hai.

Example:

```text
BP1 → AD1

BP2 → AD1
```

Naam same hone ki wajah se confusion ho sakta hai.

System ko actual Meta Ad Account ID ke basis par account identify karna hoga.

---

# Problem 2: Ad Account Me Kitna Fund Hai, Clear Nahi Rehta

Ad Account me fund add karne ke baad company ko manually track karna padta hai:

```text
Kitna add hua?

Kab add hua?

Kisne add kiya?

Kis source se add hua?

Kis client ke liye tha?

Kitna spend ho gaya?

Kitna remaining hai?
```

Meta ka current balance sirf total amount bata sakta hai.

Lekin total amount ka ownership breakdown automatically clear nahi hota.

Example:

```text
AD1 Total Balance:
₹20,000
```

Ye ₹20,000 ho sakta hai:

```text
Client A ₹5,000

Client B ₹7,000

Agency ₹3,000

Old Client Leftover ₹5,000
```

Without internal tracking, account ka total balance dekh kar actual ownership identify nahi hoti.

---

# Problem 3: Restricted Ad Account Me Fund Forget Ho Sakta Hai

Common scenario:

```text
Ad Account Fund Added:
₹2,000

Later:
Account Restricted
```

Account restrict hone ke baad wo ₹2,000 operationally use nahi ho pata.

Agar manually tracking ho rahi hai, kuch time baad ye amount forget ho sakta hai.

Problem:

```text
Fund actually exist karta hai,
lekin usable nahi hai.

Uska owner kaun hai?
Uska status kya hai?
Kya refund mila?
Kya account restore hua?
```

System ko ye amount:

```text
AVAILABLE
```

se:

```text
LOCKED
```

status me move karna hoga.

Ownership same rehni chahiye.

---

# Problem 4: Client Budget Aur Actual Spend Me Difference

Example:

Client A requirement:

```text
₹1,000
```

Actual campaign:

```text
₹700
```

me complete ho gaya.

Remaining:

```text
₹300
```

Ab problem ye hai:

* ₹300 kis ka hai?
* Client ko refund karna hai?
* Client ke next campaign me use hoga?
* Agency retain karegi?
* Dusre client ke liye use hua?
* Agar use hua to kis approval se?

Manual process me ye leftover fund easily mix ho sakta hai.

System ko ₹300 ka complete ownership aur lifecycle track karna hoga.

---

# Problem 5: Client Leftover Dusre Client Me Use Ho Jata Hai

Example:

```text
Client A Remaining:
₹300
```

Later Client B ka campaign start hua aur wahi ₹300 use kar diya gaya.

Agar proper record nahi hua to future me ye clear nahi hoga:

```text
₹300 originally kis client ka tha?

Kab transfer hua?

Kis client ko transfer hua?

Agency ne ownership li thi ya directly transfer hua?

Kya client consent/approval required tha?
```

Every transfer explicitly record hona chahiye.

---

# Problem 6: Client Money Aur Agency Money Mix Ho Jata Hai

Ek Ad Account me multiple owners ka fund ho sakta hai.

Example:

```text
Client A ₹2,000
Client B ₹4,000
Agency ₹1,500
```

Total:

```text
₹7,500
```

Agar system sirf account ka total balance track karega to ye amounts mix ho jayenge.

Problem:

> Physical location same hai, lekin financial ownership different hai.

System ko:

```text
LOCATION
```

aur:

```text
OWNER
```

alag concepts ke roop me maintain karna hoga.

---

# Problem 7: Vendor Funding Properly Track Nahi Hoti

Company vendors se large amounts receive karti hai.

Example:

```text
Vendor RAM
Funding:
₹1,00,000
```

Company is fund ko business operations me use karti hai aur later client collections se vendor ko repay karti hai.

Problem tab hoti hai jab:

* Vendor ne multiple baar fund diya ho
* Different amounts different dates par aaye ho
* Vendor ko partial repayments hue ho
* Repayment kis original funding ke against hai, clear na ho

System ko har vendor funding ko separate batch me track karna hoga.

Example:

```text
RAM-RF-001
₹1,00,000

RAM-RF-002
₹2,00,000
```

---

# Problem 8: Vendor Repayment Memory-Based Ho Sakta Hai

Example:

Ram ne:

```text
₹1,00,000
```

diya.

Company ne 5 clients ke through:

```text
₹20,000 × 5
```

repay kar diya.

Total:

```text
₹1,00,000
```

Vendor completely settled hai.

Agar proper system nahi hai to team ko future me yaad nahi rahega ki:

```text
Ram already settled hai.
```

Ye duplicate settlement ka risk create karta hai.

---

# Problem 9: Vendor Overpayment Forget Ho Sakta Hai

Example:

Ram ka outstanding:

```text
₹0
```

hai.

Lekin next client ka:

```text
₹10,000
```

bhi Ram ko transfer ho gaya.

Actual position:

```text
Vendor Payable:
₹0

Vendor Receivable:
₹10,000
```

Meaning:

```text
RAM OWES COMPANY ₹10,000
```

Agar ye separately track nahi hua to kuch time baad extra ₹10,000 completely forget ho sakta hai.

Ye system ka critical problem hai.

---

# Problem 10: Vendor Payable Aur Receivable Mix Ho Sakte Hain

Financially ye two different concepts hain:

```text
Vendor Payable
=
Company ko vendor ko kitna dena hai
```

and:

```text
Vendor Receivable
=
Vendor se company ko kitna lena hai
```

Dono ko single balance field se track karna dangerous hai.

Example:

```text
Vendor Payable:
₹0

Vendor Receivable:
₹10,000
```

Clear separate fields ya ledger accounts hone chahiye.

---

# Problem 11: Same Vendor Ke Multiple Funding Batches Mix Ho Sakte Hain

Example:

Ram:

```text
First Funding:
₹1,00,000

Second Funding:
₹2,00,000
```

Agar single balance maintain kiya gaya:

```text
Ram Balance = ₹3,00,000
```

to ye clear nahi rahega:

* First funding kab aayi
* First funding fully settle hui ya nahi
* Second funding se kitna outstanding hai
* Old overpayment adjust hua ya nahi

Funding batches required hain.

---

# Problem 12: Manual Balance Fields Reliable Nahi Hote

Agar system me user manually:

```text
Balance = ₹10,000
```

enter kare aur later:

```text
Balance = ₹7,000
```

kar de, to ₹3,000 ka history disappear ho jata hai.

Financial system me balance manually replace nahi hona chahiye.

Instead:

```text
+₹10,000 Fund Added

-₹3,000 Spend

= ₹7,000 Balance
```

System ko transaction-based ledger use karna hoga.

---

# Problem 13: Old Transactions Edit Hone Se Audit Trail Break Hota Hai

Example:

Wrong entry:

```text
₹10,000
```

Actual:

```text
₹1,000
```

Agar old entry edit karke directly ₹1,000 kar di:

history lost.

Correct approach:

```text
Original:
+₹10,000

Reversal:
-₹10,000

Correct:
+₹1,000
```

Har financial change traceable rehna chahiye.

---

# Problem 14: Meta Data Aur Internal Accounting Different Hain

Meta platform bata sakta hai:

```text
Ad Account Status

Spend

Campaign Data

Balance-related Data
```

Lekin Meta nahi jaanta:

```text
Ye amount Client A ka hai

Ye amount Vendor Ram se aaya

Ye ₹300 Client B ko reallocate hua

Ye ₹10,000 vendor overpayment hai

Ye amount agency free fund hai
```

Isliye Meta ko complete accounting source of truth nahi maana ja sakta.

System ko Meta data aur internal ledger ko separate maintain karna hoga.

---

# Problem 15: Reconciliation Missing Hai

Suppose internal records bolte hain:

```text
Expected Balance:
₹10,000
```

Lekin Meta side par:

```text
₹9,500
```

dikhta hai.

Difference:

```text
₹500
```

Agar reconciliation mechanism nahi hua to mismatch unnoticed reh sakta hai.

System ko regularly compare karna chahiye:

```text
Meta Data

vs

Internal Ledger

vs

Client/Vendor Allocation
```

---

# Problem 16: Data Multiple Places Par Scattered Hai

Current business information alag-alag places par ho sakti hai:

```text
Meta Ads Manager

Meta Business Manager

Bank App

UPI History

Screenshots

WhatsApp Chats

Excel/Google Sheets

Team Notes

Human Memory
```

Is fragmentation ki wajah se:

* Duplicate entries ho sakti hain
* Information miss ho sakti hai
* Settlement forget ho sakta hai
* Ownership unclear ho sakti hai
* Financial mismatch discover late hota hai

Centralized system required hai.

---

# Problem 17: Team Me Accountability Clear Nahi Rehti

Agar multiple team members use karte hain, ye pata hona chahiye:

```text
Fund kisne add kiya?

Vendor payment kisne create kiya?

Adjustment kisne approve kiya?

Client fund kisne reallocate kiya?

Account mapping kisne change ki?
```

Without audit logs, accountability missing hoti hai.

---

# Problem 18: Large Transactions Me Approval Control Missing Ho Sakta Hai

Financial operations me every user ko unlimited power dena risk create karta hai.

Example:

```text
₹1,00,000 Vendor Settlement
```

Ads Manager directly post na kar sake.

System me role-based approval required ho sakta hai.

Example:

```text
Created By:
Ads Manager

Approved By:
Finance/Admin
```

---

# Problem 19: Duplicate Transactions Ho Sakte Hain

Technical failure ya repeated button clicks ki wajah se same transaction twice create ho sakta hai.

Example:

```text
Ram Payment ₹20,000
Ram Payment ₹20,000
```

Actual intended payment:

```text
₹20,000
```

But records:

```text
₹40,000
```

System ko duplicate financial transaction prevention implement karna hoga.

---

# Problem 20: Meta Sync Fail Hone Par Data Stale Ho Sakta Hai

Meta API request fail ho sakti hai.

Reasons:

```text
Rate Limit

Expired Token

Temporary Meta Issue

Permission Error

Network Error
```

Problem:

Dashboard stale data show kar raha ho lekin user ko pata na chale.

System ko display karna chahiye:

```text
Last Successful Sync:
17 Sep 2026 01:30 PM

Data Status:
STALE
```

---

# Problem 21: Historical State Missing Ho Sakti Hai

Management ko future me ye answer chahiye ho sakta hai:

> AD1 restrict hone ke exact time kitna balance tha?

Ya:

> 10 September ko Client A ka remaining fund kitna tha?

Ya:

> Ram 5 September ko kitna outstanding tha?

Agar sirf current values store ki jaati hain to historical answers impossible hain.

Snapshots aur transaction history required hai.

---

# Problem 22: Account Restriction Ka Client-Level Impact Clear Nahi Hota

Example:

```text
AD1 Balance:
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

Account restrict hua.

Sirf:

```text
₹5,000 Locked
```

batana enough nahi hai.

System ko show karna hoga:

```text
Client A Locked:
₹2,000

Client B Locked:
₹2,000

Agency Locked:
₹1,000
```

---

# Problem 23: Client Campaign Completion Automatically Financial Completion Nahi Hai

Campaign:

```text
COMPLETED
```

ho gaya.

Lekin financial questions pending ho sakte hain:

```text
Unused amount?

Refund?

Transfer?

Agency allocation?

Locked fund?
```

Campaign status aur financial settlement status separate hone chahiye.

---

# Problem 24: No Single Source of Truth

Current biggest overall problem:

> Business ke paas aisa ek system nahi hai jahan account hierarchy, Meta status, client ownership, vendor liabilities aur complete financial trail ek saath available ho.

Isliye different people different numbers bata sakte hain.

System ko centralized single operational source of truth create karna hoga.

---

# Business Impact of These Problems

Agar ye problems solve nahi hoti, company ko following risks ho sakte hain:

```text
Lost Funds

Forgotten Vendor Receivables

Duplicate Vendor Payments

Incorrect Client Balances

Client Fund Misallocation

Locked Funds Forgotten

Financial Reconciliation Errors

Incorrect Management Reports

Team Accountability Issues

Manual Workload

Scaling Difficulty

Decision-Making Delays
```

---

# Operational Impact

Jab accounts aur clients increase honge:

```text
10 Ad Accounts
→ manageable manually

50 Ad Accounts
→ difficult

100 Ad Accounts
→ high confusion risk

500 Ad Accounts
→ manual tracking impractical
```

Isliye problem sirf current workload ki nahi hai.

System future scalability ke liye bhi required hai.

---

# Core Problem Statement

> **Company ke Meta advertising operations me multiple Meta assets, clients, vendors aur financial sources involved hain, lekin inke beech fund ownership, movement, spend, balance, restriction, settlement aur recovery ko centrally track karne ke liye reliable system nahi hai. Is wajah se fund confusion, forgotten balances, vendor overpayments, client leftovers, restricted funds, duplicate transactions aur reconciliation mismatches ka risk create hota hai.**

---

# Required Solution

Required platform ko:

```text
Centralize
Track
Reconcile
Monitor
Alert
Audit
```

karna hoga.

System ko minimum ye guarantee deni chahiye:

```text
Every Meta Account is identifiable.

Every Ad Account has a known hierarchy.

Every fund has a known source.

Every amount has a known owner.

Every transaction has a history.

Every transfer has source and destination.

Every vendor has payable and receivable visibility.

Every client has allocated, spent and unused visibility.

Every restricted amount remains traceable.

Every mismatch creates visibility.

Every financial action is auditable.
```

---

# Final Problem Definition

> **The problem is not simply tracking Meta Ad Accounts. The real problem is maintaining complete operational and financial traceability across Meta assets, client funds, vendor funds, campaign spend, unused balances, restricted accounts, repayments, overpayments and internal transfers at scale.**
