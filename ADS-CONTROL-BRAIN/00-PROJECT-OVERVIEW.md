# Project Overview

## Project Name

**Meta Ads Operations & Financial Control System**

---

## Project Summary

Ye project company ke complete Meta advertising operations aur unse related financial activities ko centrally manage, monitor aur reconcile karne ke liye build kiya ja raha hai.

Company multiple Meta/Facebook identities, Business Portfolios, Ad Accounts, clients aur vendors ke saath kaam karti hai. Jaise-jaise inki quantity badhti hai, manual tracking complicated ho jati hai.

Current operations me ek single Ad Account ke andar multiple sources ka paisa ho sakta hai:

```text
Client Fund
Vendor Fund
Agency Fund
Unused Client Balance
Refunded Amount
Meta Credit
Locked Fund
```

Is wajah se sirf Meta dashboard dekh kar ye samajhna possible nahi hota ki account me jo balance hai wo actually kis ka paisa hai aur uska next purpose kya hai.

Is project ka objective ek aisa internal management system banana hai jo Meta ke operational data aur company ke internal financial records ko combine karke complete visibility provide kare.

---

# Project Vision

System ka long-term vision hai:

> Company ke complete Meta Ads operation ke liye ek centralized control center build karna jahan every Meta asset, every client, every vendor aur every financial movement traceable ho.

Management ko kisi bhi point par pata hona chahiye:

```text
Kitne Meta Accounts connected hain?

Kitne Business Portfolios hain?

Kitne Ad Accounts hain?

Kaunse accounts currently active hain?

Kaunse restricted ya disabled hain?

Kis account me kitna fund hai?

Kis fund ka owner kaun hai?

Kis client ka kitna budget remaining hai?

Kis vendor ko kitna amount dena hai?

Kis vendor se kitna amount recover karna hai?

Kitna fund locked hai?

Kitna agency free balance available hai?

Kahan financial mismatch hai?
```

---

# Current Business Structure

Company ke Meta operations broadly is hierarchy ko follow karte hain:

```text
Main Meta Connection
        ↓
Business Portfolio
        ↓
Ad Account
        ↓
Campaign / Client Work
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

Ek company ke paas multiple main connections ho sakte hain:

```text
Ads Pro
Marketing Account
Backup Account
Agency Account
```

Har connection ke andar multiple Business Portfolios aur unke andar multiple Ad Accounts ho sakte hain.

---

# Core Business Problem

Current system ka sabse bada problem lack of centralized visibility hai.

Operational information alag-alag jagah scattered ho sakti hai:

```text
Meta Business Manager
Meta Ads Manager
Bank Transactions
Payment Screenshots
WhatsApp Chats
Spreadsheets
Team Members
Human Memory
```

Isliye important questions ka answer instantly available nahi hota.

Example:

> BP2 ke AD3 me jo ₹8,500 balance hai wo kis client ka hai?

Ya:

> Ye ₹5,000 kis vendor ke fund se initially add hua tha?

Ya:

> Client A ka campaign ₹1,000 budget ka tha lekin ₹700 me complete hua. Remaining ₹300 ab kahan hai?

Ya:

> Ram ko ₹1 lakh repay karna tha. ₹1 lakh already repay ho gaya, lekin extra ₹10,000 bhi transfer ho gaya. Wo ₹10,000 recover hua ya nahi?

Current manual process me ye information miss ho sakti hai.

---

# Major Problems Being Solved

## 1. Meta Asset Mapping

System maintain karega:

```text
Main Connection
→ Business Portfolio
→ Ad Account
```

Har Ad Account unique Meta Ad Account ID se identify hoga.

---

## 2. Fund Tracking

System track karega:

```text
Fund Added
Fund Source
Fund Owner
Current Location
Current Status
Remaining Amount
```

---

## 3. Client Fund Ownership

Ek Ad Account me total balance hone se enough information nahi milti.

Example:

```text
AD1 Balance
₹20,000
```

System isko breakdown karega:

```text
Client A       ₹5,000
Client B       ₹7,000
Client C       ₹3,000
Agency Fund    ₹5,000
---------------------
Total         ₹20,000
```

---

# Client Budget Lifecycle

Example:

Client A advertising ke liye:

```text
₹10,000
```

provide karta hai.

System lifecycle:

```text
Client Payment
     ↓
Client Wallet
     ↓
Campaign Allocation
     ↓
Ad Account
     ↓
Ad Spend
```

Campaign complete hone ke baad:

```text
Allocated
₹10,000

Actual Spend
₹8,500

Unused
₹1,500
```

₹1,500 ka status explicitly defined rahega.

Possible states:

```text
Client Wallet

Refund Pending

Refunded

Transferred to another campaign

Approved Agency Balance
```

Unused money silently disappear ya repurpose nahi hoga.

---

# Restricted Ad Account Problem

Example:

```text
AD1

Fund Added:
₹2,000

Spend:
₹0
```

Same night account restricted ho gaya.

System financial ownership remove nahi karega.

Instead:

```text
Account Status:
RESTRICTED

Available:
₹0

Locked:
₹2,000
```

Agar amount Client A ka tha:

```text
Client A Locked Fund
₹2,000
```

Client aur management dono ke perspective se fund traceable rahega.

---

# Vendor Funding Model

Company vendors se bhi large advertising funds receive kar sakti hai.

Example:

```text
Vendor:
RAM

Funding:
₹1,00,000
```

System vendor funding ko batch ke form me record karega.

Example:

```text
Funding Batch:
RAM-RF-001

Amount:
₹1,00,000
```

Company subsequently client collections ke through Ram ko repay karti hai.

---

# Vendor Repayment Lifecycle

Example:

```text
Ram Funding:
₹1,00,000
```

Five clients:

```text
Client A   ₹20,000
Client B   ₹20,000
Client C   ₹20,000
Client D   ₹20,000
Client E   ₹20,000
```

Vendor repayment:

```text
Total Repaid:
₹1,00,000

Outstanding:
₹0
```

Status:

```text
SETTLED
```

---

# Vendor Overpayment Problem

Agar settlement complete hone ke baad extra:

```text
₹10,000
```

Ram ko transfer kar diya gaya:

System usko normal repayment nahi treat karega.

Instead:

```text
Vendor Payable
₹0

Vendor Receivable
₹10,000
```

Meaning:

```text
RAM OWES COMPANY
₹10,000
```

Ye receivable open item ke form me system me visible rahega jab tak resolve nahi hota.

Resolution options:

```text
Vendor Returned Money

Adjusted Against New Funding

Authorized Financial Adjustment
```

---

# Agency Fund

Company ke paas kuch amount client-specific nahi bhi ho sakta.

Isko:

```text
Agency Free Fund
```

ke form me maintain kiya jayega.

Example:

```text
Agency Fund:
₹25,000
```

Agency fund kisi approved client campaign me allocate ho sakta hai.

Har allocation transaction ke through record hogi.

---

# Financial Ledger

System financial balances ko manually editable numbers ke form me maintain nahi karega.

Instead every money movement transaction hoga.

Example:

```text
+ ₹10,000 Client Payment
- ₹7,000 Ad Spend
- ₹2,000 Refund
-------------------
₹1,000 Remaining
```

Balance transactions ka result hoga.

Is approach se history preserve hogi.

---

# Immutable Financial Records

Posted transaction direct edit ya delete nahi honi chahiye.

Agar wrong transaction:

```text
₹10,000
```

enter ho gayi aur correct:

```text
₹1,000
```

thi, to:

```text
Original:
+₹10,000

Reversal:
-₹10,000

Correct:
+₹1,000
```

System maintain karega.

Isse complete audit trail rahega.

---

# Core Financial Entities

System ke primary financial entities:

```text
Client

Vendor

Agency

Ad Account

Campaign

Company

Refund Account

Locked Fund
```

Inke beech funds move kar sakte hain.

---

# Money State Model

Every tracked fund kisi na kisi status me hona chahiye.

Possible statuses:

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

# Money Ownership Model

Every amount ka owner identified hona chahiye.

Possible owners:

```text
CLIENT

AGENCY

VENDOR

COMPANY
```

Ownership transfer sirf approved transaction ke through hoga.

---

# Money Location Model

Every active balance ka current location bhi identifiable hona chahiye.

Example:

```text
Company Bank

Client Wallet

Ad Account

Agency Pool

Vendor Account

Locked Fund

Refund Pending
```

---

# Fundamental Tracking Model

Every rupee ke saath minimum ye information available honi chahiye:

```text
SOURCE
Where did the money come from?

OWNER
Whose money is it?

PURPOSE
Why was the money received or allocated?

LOCATION
Where is the money now?

STATUS
Is it available, allocated, spent, locked or refunded?
```

---

# Meta Integration

Meta system se operational data automatically synchronize kiya jayega.

Expected Meta data:

```text
Business Portfolios

Ad Accounts

Ad Account IDs

Account Names

Account Status

Currency

Timezone

Spend Data

Campaign Information

Balance-related fields

Funding-related metadata where available
```

Meta system internal client/vendor accounting ka source nahi hoga.

---

# Internal System Data

Internal system maintain karega:

```text
Clients

Client Payments

Client Budgets

Client Campaign Allocations

Vendor Funding

Vendor Settlements

Vendor Receivables

Fund Transfers

Agency Funds

Unused Client Funds

Locked Fund Ownership

Refunds

Manual Adjustments

Payment References

Attachments

Approvals

Audit Logs
```

---

# Reconciliation Engine

System periodically compare karega:

```text
Meta Operational Data
        VS
Internal Financial Ledger
        VS
Business Allocation Records
```

Example:

```text
Expected Internal Balance:
₹20,000

Tracked Meta Balance:
₹19,500

Difference:
₹500
```

System alert generate karega:

```text
RECONCILIATION ISSUE

Difference:
₹500
```

---

# Alerting System

Important situations automatically identify ki jayengi.

Examples:

```text
Ad Account Restricted

Ad Account Disabled

Low Balance

Unexpected Spend

No Spend

Client Fund Locked

Vendor Overpayment

Vendor Settlement Due

Vendor Receivable Pending

Refund Pending

Meta Sync Failed

Financial Reconciliation Mismatch
```

---

# Auditability

System ke sensitive actions audit honge.

Example:

```text
Who performed the action?

What changed?

When did it change?

What was the previous value?

What is the new value?

Which entity was affected?
```

Financial action ke case me transaction reference bhi store hoga.

---

# User Roles

Initial roles:

```text
ADMIN

FINANCE

ADS MANAGER

VIEWER
```

Different roles ke different permissions honge.

Example:

```text
Ads Manager:
Can view Ad Accounts

Finance:
Can create settlements

Admin:
Can approve adjustments

Viewer:
Read-only
```

---

# Main Modules

System ke major modules:

```text
Dashboard

Meta Accounts

Business Portfolios

Ad Accounts

Clients

Client Campaigns

Client Wallets

Vendors

Vendor Funding

Vendor Settlement

Fund Management

Financial Ledger

Agency Fund

Locked Funds

Refunds

Reconciliation

Alerts

Reports

Audit Logs

Team & Permissions

Settings
```

---

# Project Architecture Direction

Initial architecture:

```text
Frontend
Next.js

Backend
NestJS

Database
PostgreSQL / Supabase

Authentication
Supabase Auth

Storage
Supabase Storage

Background Jobs
BullMQ

Queue
Redis

Meta Integration
Meta Marketing API

Deployment
Docker + Nginx
```

Architecture detailed technical documents me separately define hogi.

---

# Primary Source-of-Truth Model

System ke andar three different truths maintain honge:

## Meta Truth

```text
Meta platform par kya hua?
```

## Financial Ledger Truth

```text
Paisa kahan se aaya aur kahan gaya?
```

## Business Ownership Truth

```text
Paisa kis client/vendor/agency ka tha?
```

In teeno ko reconciliation layer connect karegi.

---

# Initial Project Goal

Initial release ka main goal campaign automation nahi hai.

Primary objective hai:

```text
TRACK

CONTROL

RECONCILE

MONITOR

AUDIT
```

System initially Meta Ads operation ka control layer hoga.

---

# Success Criteria

Project successful tab consider hoga jab management kisi bhi point par ye questions accurately answer kar sake:

```text
Kaunsa Ad Account kahan hai?

Account ki current status kya hai?

Kitna fund add hua?

Kitna spend hua?

Kitna balance hai?

Balance kis ka hai?

Kya koi fund locked hai?

Kis client ka budget remaining hai?

Kis vendor ko dena hai?

Kis vendor se lena hai?

Kya koi extra payment hua?

Kya koi unresolved refund hai?

Kya internal aur Meta numbers match kar rahe hain?

Har transaction ka complete history kya hai?
```

---

# Long-Term Vision

Future me ye system sirf tracking dashboard nahi, balki company ke complete paid advertising financial infrastructure ka central platform ban sakta hai.

Future possibilities:

```text
Automated Bank Reconciliation

Payment Gateway Integration

Mobile Application

WhatsApp Alerts

Automated Daily Reports

Campaign-Level Cost Allocation

Vendor Settlement Suggestions

Client Statements

Financial Exports

AI-Based Anomaly Detection

Automated Risk Alerts

Cross-Platform Ads Support
```

Future me Meta ke alawa:

```text
Google Ads

YouTube Ads

Other Advertising Platforms
```

bhi same financial control layer ke andar integrate kiye ja sakte hain.

---

# Final Project Definition

> **Meta Ads Operations & Financial Control System ek centralized internal platform hai jo company ke Meta assets, clients, vendors, advertising funds aur financial transactions ko track, organize, monitor aur reconcile karta hai. Iska purpose har advertising account aur har rupee ke lifecycle ko completely traceable aur auditable banana hai, taaki company scale hone ke baad bhi financial aur operational control lose na ho.**
