# Ads Control System Brain

## Project Name

**Meta Ads Operations & Financial Control System**

---

## What Is This System?

Ye system company ke complete Meta Ads operations, financial tracking, client funds, vendor funds, Business Portfolios, Ad Accounts, spend, balances, restricted funds, leftover funds, repayments aur settlements ko ek centralized platform par manage aur track karne ke liye build kiya ja raha hai.

Company ke paas multiple Meta/Facebook accounts, multiple Business Portfolios aur unke andar multiple Ad Accounts ho sakte hain.

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

Jaise-jaise accounts aur clients increase hote hain, manually ye track karna difficult ho jata hai ki:

* Kaunsa Ad Account kis Business Portfolio me hai
* Kaunsa Business Portfolio kis main Meta connection/account ke under hai
* Kis Ad Account me kitna fund add hua
* Kis account se kitna spend hua
* Account me kitna balance remaining hai
* Kaunsa account active hai
* Kaunsa account restricted ya disabled hai
* Restricted account me kitna fund locked hai
* Locked fund kis client ya company ka hai
* Kis client ne kitna amount diya
* Client ka actual advertising spend kitna hua
* Client ka kitna unused balance bacha
* Leftover amount later kahan use hua
* Company ke paas kitna free fund available hai
* Vendor se kitna fund liya gaya
* Vendor ko kitna repay kiya gaya
* Vendor ko kitna dena baki hai
* Vendor ko extra payment chala gaya hai ya nahi
* Extra vendor payment company ko kitna recover karna hai
* Refund kitna pending hai
* Fund kis account se kis account me transfer hua
* Financial mismatch kahaan hua

Is system ka purpose in sab operations ko structured, automated aur auditable banana hai.

---

# Why Are We Building This?

Current operations me bahut saari information manually ya memory ke basis par manage hoti hai.

Jab:

* Ad Accounts zyada ho jaate hain
* Business Portfolios zyada ho jaate hain
* Multiple clients simultaneously run hote hain
* Multiple vendors involved hote hain
* Funds frequently transfer hote hain
* Accounts restrict hote hain
* Client campaigns expected budget se kam spend me complete hote hain

tab financial tracking complicated ho jati hai.

Example:

Client ne ₹1,000 advertising ke liye diye.

Actual ads ₹700 me complete ho gaye.

Remaining:

```text
₹300
```

Agar ye ₹300 later kisi dusre campaign ya client ke liye use hota hai, to system ko clearly pata rehna chahiye:

```text
₹300 originally kis client se aaye?
Kis Ad Account me pade the?
Kitna time wahan rahe?
Kahan transfer hue?
Kisne transfer approve kiya?
Current owner kaun hai?
```

Isi tarah agar kisi Ad Account me:

```text
₹2,000
```

available hain aur account restrict ho jata hai, to wo ₹2,000 disappear nahi hone chahiye.

System record karega:

```text
Account Status:
RESTRICTED

Locked Fund:
₹2,000

Fund Owner:
Client / Agency / Other

Current Status:
LOCKED
```

---

# Vendor Problem We Are Solving

Company kuch vendors se large amounts leti hai.

Example:

Vendor:

```text
RAM
```

Ram company ko:

```text
₹1,00,000
```

provide karta hai.

Company later client collections se Ram ka amount repay karti hai.

Example:

```text
Client A → ₹20,000
Client B → ₹20,000
Client C → ₹20,000
Client D → ₹20,000
Client E → ₹20,000
```

Total repayment:

```text
₹1,00,000
```

Ram ka account now settled hai.

```text
Vendor Funding:
₹1,00,000

Vendor Repaid:
₹1,00,000

Outstanding:
₹0
```

Lekin agar later Client F ka:

```text
₹10,000
```

bhi galti se Ram ko transfer kar diya gaya, to ye ₹10,000 simply forgotten nahi hona chahiye.

System record karega:

```text
Vendor Payable:
₹0

Extra Paid:
₹10,000

Vendor Receivable:
₹10,000
```

Meaning:

```text
RAM OWES COMPANY ₹10,000
```

Ye amount tab tak open rahega jab tak:

* Ram return nahi karta
* Next vendor funding se adjust nahi hota
* Authorized financial adjustment nahi hota

---

# Core Objective

System ka core objective hai:

> **Company ke har Meta Ad Account aur har rupee ka complete lifecycle track karna.**

Har rupee ke liye system ideally answer kar sake:

```text
Paisa kahan se aaya?

Kisne diya?

Kis purpose ke liye aaya?

Kis client/vendor se related hai?

Kis Ad Account me gaya?

Kitna spend hua?

Kitna remaining hai?

Remaining paisa kis ka hai?

Kya paisa available hai ya locked?

Kya kisi aur client me transfer hua?

Kya vendor ko diya gaya?

Vendor ko dena tha ya extra chala gaya?

Kya refund hua?

Current paisa exactly kahan hai?
```

---

# Core System Principle

## Money Can Never Disappear

System ka sabse important principle:

> **Money can never disappear. It can only change owner, purpose, location or status.**

Example:

```text
Client Fund
↓
Ad Account
↓
Campaign
↓
Spend
```

Ya:

```text
Client Fund
↓
Ad Account
↓
Unused Balance
↓
Client Wallet
```

Ya:

```text
Client Fund
↓
Agency Pool
↓
Another Approved Allocation
```

Ya:

```text
Fund
↓
Restricted Ad Account
↓
Locked Balance
```

Har movement transaction ke through record hoga.

---

# Main Domains

System ko major domains me divide kiya jayega.

## 1. Meta Account Management

Track:

* Meta Connections
* Business Portfolios
* Ad Accounts
* Ad Account IDs
* Account Status
* Currency
* Account hierarchy

Structure:

```text
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
```

---

## 2. Client Management

Track:

* Client
* Client payments
* Client budget
* Campaign allocation
* Advertising spend
* Remaining client fund
* Client wallet
* Refunds
* Transfers

Example:

```text
Client A

Received:
₹10,000

Allocated:
₹10,000

Spent:
₹8,500

Unused:
₹1,500
```

---

## 3. Vendor Management

Track:

* Vendor
* Vendor funding
* Funding batches
* Vendor repayment
* Outstanding payable
* Vendor overpayment
* Vendor receivable
* Adjustments
* Settlement history

---

## 4. Ad Account Fund Management

Track:

* Total fund
* Client allocated fund
* Agency fund
* Available fund
* Locked fund
* Spend
* Refund pending
* Reconciliation difference

---

## 5. Financial Ledger

System me direct balances manually maintain nahi honge.

Balances financial transactions se calculate honge.

Example:

```text
+ ₹10,000 Client Payment
- ₹7,000 Ad Spend
- ₹2,000 Refund
-------------------
₹1,000 Remaining
```

Financial transaction history immutable rahegi.

Posted transaction edit/delete karne ki jagah:

```text
Original Entry
+
Reversal
+
Correct Entry
```

create hogi.

---

## 6. Reconciliation

System compare karega:

```text
Internal Ledger
vs
Meta Data
vs
Client/Vendor Allocation
```

Mismatch hone par alert create hoga.

Example:

```text
Internal Expected:
₹10,000

Meta/Tracked:
₹9,700

Difference:
₹300
```

Alert:

```text
RECONCILIATION ISSUE
₹300 Difference
```

---

## 7. Monitoring & Alerts

Alerts generate ho sakte hain:

* Ad Account Restricted
* Ad Account Disabled
* Low Balance
* Payment Issue
* No Spend
* Unexpected Spend
* Vendor Overpayment
* Vendor Outstanding
* Locked Client Fund
* Reconciliation mismatch
* Failed Meta Sync
* Pending Refund
* Pending Approval

---

# Data Sources

System ke paas do major sources honge.

## Meta Data

Meta integration se:

```text
Business Portfolio
Ad Account
Ad Account ID
Account Name
Account Status
Currency
Timezone
Spend
Campaign information
Balance-related information
Funding source information where available
```

---

## Internal Data

Company system se:

```text
Clients
Client payments
Client budgets
Client allocations
Vendor information
Vendor funding
Vendor repayment
Vendor overpayment
Fund transfers
Fund owner
Agency fund
Unused client fund
Locked fund allocations
Refunds
Adjustments
Payment references
Screenshots
Notes
Approvals
Audit logs
```

Meta API company ki internal accounting ko replace nahi karega.

---

# Source of Truth

System me three separate truths maintain honge.

## Meta Truth

Meta advertising platform par actually kya ho raha hai.

```text
Account status
Spend
Campaigns
Meta-related balance information
```

---

## Ledger Truth

Money actually kahan se aaya aur kahan gaya.

```text
Payment
Transfer
Spend
Refund
Repayment
Adjustment
```

---

## Business Truth

Money kis entity ka hai.

```text
Client
Vendor
Agency
Campaign
Ad Account
```

---

# Example Complete Money Flow

```text
Vendor RAM
     │
     │ ₹1,00,000
     ▼
Company Fund
     │
     ▼
Ad Account
     │
     ▼
Client Campaign
     │
     ├── Spend
     │
     └── Remaining Balance
```

Client payment:

```text
Client
  │
  ▼
Company
  │
  ▼
Vendor Repayment
```

Every step database transaction ke through linked rahega.

---

# System Users

Possible user roles:

```text
ADMIN

FINANCE

ADS MANAGER

VIEWER
```

Future me permissions granular ho sakti hain.

Example:

```text
Ads Manager

Can:
View Meta Accounts
View Ad Accounts
Create client campaign allocations

Cannot:
Approve large financial adjustment
Delete financial transactions
Approve vendor overpayment
```

---

# Proposed Technology Stack

Initial proposed architecture:

```text
Frontend
Next.js
TypeScript
Tailwind CSS

Backend
NestJS
TypeScript

Database
PostgreSQL
Supabase

Authentication
Supabase Auth

Storage
Supabase Storage

Realtime
Supabase Realtime

Queue
Redis
BullMQ

Meta Integration
Meta Marketing API

Deployment
Docker
Nginx
VPS
```

Final implementation details dedicated technical documentation me defined hongi.

---

# Main Product Sections

Dashboard navigation approximately:

```text
Dashboard

Meta Accounts
├── Connections
├── Business Portfolios
└── Ad Accounts

Clients
├── Client List
├── Client Wallets
├── Campaigns
└── Leftover Funds

Vendors
├── Vendors
├── Funding Batches
├── Repayments
└── Receivables

Finance
├── Ledger
├── Transactions
├── Fund Allocation
├── Agency Pool
├── Locked Funds
└── Reconciliation

Monitoring
├── Account Status
├── Restrictions
├── Alerts
└── Sync Issues

Reports

Team

Audit Logs

Settings
```

---

# What This System Is NOT

Ye system initially:

* Meta Ads campaign builder nahi hai
* Full accounting/ERP software nahi hai
* Facebook password manager nahi hai
* CRM replacement nahi hai

Initial focus:

```text
Tracking
+
Monitoring
+
Fund Management
+
Financial Control
+
Client/Vendor Reconciliation
```

---

# V1 Objective

Version 1 ka goal:

```text
Meta Accounts ko organize karna

Business Portfolios track karna

Ad Accounts track karna

Ad Account statuses monitor karna

Client funds track karna

Vendor funds track karna

Fund allocation manage karna

Client unused balances track karna

Restricted balances track karna

Vendor payable/receivable track karna

Financial ledger maintain karna

Reconciliation karna

Alerts generate karna

Complete audit trail maintain karna
```

---

# Brain Folder Purpose

Ye Brain Folder project ka central documentation source hai.

Is folder ka purpose:

* Business rules document karna
* Architecture define karna
* Developers ko context dena
* AI development tools ko context dena
* Important decisions preserve karna
* Edge cases record karna
* Data structure document karna
* Financial rules lock karna
* Development consistency maintain karna

---

# Recommended Reading Order

New developer ya AI ko project understand karne ke liye ye order follow karna chahiye:

```text
1. README.md

2. 00-PROJECT-OVERVIEW.md

3. 01-PROBLEM-STATEMENT.md

4. 02-GOALS-AND-SCOPE.md

5. 03-GLOSSARY.md

6. BUSINESS/02-ACCOUNT-HIERARCHY.md

7. BUSINESS/03-CLIENT-FLOW.md

8. BUSINESS/04-VENDOR-FLOW.md

9. BUSINESS/05-FUND-FLOW.md

10. DATA/05-FINANCIAL-LEDGER.md

11. TECH/02-SYSTEM-ARCHITECTURE.md

12. RULES/01-GOLDEN-RULES.md
```

---

# Golden Statement

The entire system should always follow this statement:

> **Every account must be identifiable. Every transaction must be traceable. Every rupee must have an owner, purpose, location and status. Nothing should disappear from the system without a recorded transaction.**
