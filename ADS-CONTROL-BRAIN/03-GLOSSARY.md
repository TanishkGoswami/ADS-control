# Glossary

## Purpose

Ye glossary project me use hone wale important business, financial, Meta aur technical terms ko standardize karti hai.

Is file ka goal hai:

* Terminology confusion avoid karna
* Developers aur business team ko same language dena
* Database naming consistent rakhna
* UI labels ko clear banana
* Financial logic me ambiguity remove karna

Agar kisi term ka meaning is file me defined hai, to project me wahi meaning use kiya jana chahiye.

---

# A

## Account Status

Meta Ad Account ki current operational condition.

Possible examples:

```text
ACTIVE
DISABLED
RESTRICTED
PAYMENT_ISSUE
CLOSED
UNKNOWN
```

Account Status aur financial status separate concepts hain.

---

## Ad Account

Meta advertising account jahan campaigns aur ads run hote hain.

Example:

```text
AD1
AD2
AD3
```

System me Ad Account actual Meta Ad Account ID se uniquely identify hoga.

Example:

```text
act_123456789
```

---

## Ad Account ID

Meta dwara assigned unique identifier.

Display name repeat ho sakta hai, lekin Ad Account ID unique hota hai.

---

## Ad Account Wallet

Internal logical representation of the money currently associated with an Ad Account.

Ye Meta wallet ka exact technical equivalent zaroori nahi hai.

Iska purpose internal fund ownership aur allocation tracking hai.

---

## Ads Manager

Meta ka interface jahan campaigns, Ad Sets aur Ads manage kiye jaate hain.

Project ka V1 Ads Manager replacement nahi hai.

---

## Agency Fund

Company ka apna operational money jo kisi specific client ki ownership me nahi hai.

Example:

```text
Agency Free Fund
₹25,000
```

---

## Agency Free Fund

Agency Fund ka woh portion jo currently kisi client, campaign ya locked state me allocated nahi hai.

---

## Allocation

Kisi fund ko specific purpose, client, campaign, vendor obligation ya Ad Account ke liye assign karna.

Example:

```text
Client A Wallet
↓
₹10,000 Allocation
↓
AD1 Campaign
```

Allocation ka matlab necessarily physical bank transfer nahi hota.

---

## Allocation Lot

Ek traceable fund unit jo original source aur remaining amount ko preserve karta hai.

Example:

```text
LOT-001

Source:
Client A

Original Amount:
₹1,000

Spent:
₹700

Remaining:
₹300
```

---

## Amount Spent

Advertising platform par actually spend hua amount.

Meta se spend data aa sakta hai, lekin internal client allocation ke saath reconcile karna zaroori hai.

---

## Approval

Sensitive action ko authorize karne ka process.

Example:

```text
Vendor Overpayment
Manual Adjustment
Large Settlement
Refund
Reversal
```

---

## Audit Log

System me kis user ne kya action kiya, kab kiya aur kis entity par kiya uska record.

Example:

```text
User: Rahul
Action: Vendor Settlement Created
Vendor: RAM
Amount: ₹20,000
Time: 17 Sep 2026 02:15 PM
```

---

# B

## Balance

Kisi account/entity me calculated remaining financial amount.

Project me balance generally transactions ka result hona chahiye, manually overwritten value nahi.

---

## Balance Snapshot

Kisi specific time par account ka recorded balance/state.

Historical analysis ke liye use hota hai.

---

## Business Portfolio

Meta ka business-level asset container jiske andar Ad Accounts aur other assets ho sakte hain.

Internal shorthand:

```text
BP
```

Example:

```text
BP1
BP2
```

---

## Business ID

Meta Business Portfolio ka unique identifier.

---

# C

## Campaign

Meta Ads me advertising campaign.

System me Meta Campaign aur Internal Client Job alag entities ho sakte hain.

---

## Client

Company ka customer jiske liye advertising work perform kiya ja raha hai.

---

## Client Allocation

Client ke available fund ka woh part jo specific campaign ya Ad Account ke liye reserve kiya gaya hai.

---

## Client Balance

Client ke naam par system me currently available amount.

---

## Client Campaign

Internal record representing advertising work for a client.

Ye Meta Campaign ke exactly same entity hona zaroori nahi.

---

## Client Fund

Client se received ya client ke naam par owned financial amount.

---

## Client Job

Internal business work order.

Example:

```text
Client A Lead Generation
Budget ₹20,000
```

---

## Client Payment

Client se company ko received financial amount.

---

## Client Wallet

Client ka logical internal balance account.

Example:

```text
Client A Wallet

Received: ₹10,000
Allocated: ₹7,000
Available: ₹3,000
```

---

## Company Fund

Company-controlled financial amount.

Context ke according ye Agency Fund ya operational company money ho sakta hai.

---

## Connection

System aur Meta ke beech authenticated integration record.

Project me mostly:

```text
Meta Connection
```

ke context me use hoga.

---

## Current Balance

Latest known/calculated balance.

Historical balance se different.

---

# D

## Debit

Double-entry ledger ka accounting side.

UI me har jagah debit/credit terminology expose karna zaroori nahi.

Backend ledger ke liye use hoga.

---

## Disabled Account

Ad Account jo Meta side par operationally disabled hai.

Disabled aur Restricted terms technically exact same nahi maane jayenge unless mapped through Meta status logic.

---

## Double Entry

Financial accounting pattern jahan har posted transaction ke debit aur credit totals equal hote hain.

Rule:

```text
Total Debit = Total Credit
```

---

# E

## Entity

System ke andar identifiable business object.

Examples:

```text
Client
Vendor
Ad Account
Business Portfolio
Campaign
Transaction
```

---

## Excess Payment

Required amount se zyada payment.

Vendor context me:

```text
Vendor Outstanding = ₹0
Payment = ₹10,000

Excess = ₹10,000
```

---

# F

## Financial Ledger

System ka core financial record jahan every fund movement transaction form me stored hota hai.

---

## Financial Status

Kisi business item ka financial completion state.

Example:

```text
UNSETTLED
PARTIALLY_SETTLED
SETTLED
REFUND_PENDING
```

Campaign operational status se separate.

---

## Free Balance

Amount jo currently available hai aur kisi active commitment me locked/allocated nahi.

---

## Fund

Any monetary value tracked by the system.

---

## Fund Addition

Ad Account ya internal financial location me amount add karne ka recorded event.

---

## Fund Allocation

Available money ko kisi purpose ke liye reserve/assign karna.

---

## Fund Location

Paisa currently logically/physically kahan hai.

Examples:

```text
Company Bank
Client Wallet
Ad Account
Agency Pool
Locked Fund
Vendor
Refund Pending
```

---

## Fund Owner

Financial amount ka actual business owner.

Possible examples:

```text
CLIENT
AGENCY
COMPANY
VENDOR
```

---

## Fund Purpose

Paisa kis reason ya use-case ke liye assigned hai.

Example:

```text
Client Campaign
Vendor Repayment
Meta Top-Up
Refund
```

---

## Fund Source

Paisa originally kahan se aaya.

Examples:

```text
Client Payment
Vendor Funding
Agency Fund
Meta Refund
```

---

## Fund Status

Tracked amount ki current state.

Examples:

```text
AVAILABLE
ALLOCATED
SPENT
LOCKED
REFUND_PENDING
REFUNDED
TRANSFERRED
ADJUSTED
```

---

## Fund Transfer

Ek internal financial location/owner/purpose se dusre me amount move karne ka recorded transaction.

---

## Funding Batch

Vendor se received ek specific funding instance.

Example:

```text
RAM-RF-001
₹1,00,000
```

---

## Funding Source

Paisa ka source.

Meta me `funding_source` term payment instrument ke context me bhi use ho sakta hai.

Internal system me context clearly specify karna hoga.

---

# I

## Idempotency

Same request accidental duplicate hone par system ko same financial transaction twice create karne se rokne ka mechanism.

---

## Internal Balance

System ke ledger ke basis par calculated balance.

Meta-reported balance se separate.

---

## Internal Ledger

Company ke apne financial tracking ka source of truth.

---

## Internal Transaction

System ke andar recorded financial event.

---

# J

## Job

Client work assignment ya campaign-related internal work order.

---

# L

## Ledger Account

Financial ledger me logical account.

Examples:

```text
Client A Wallet
Vendor Payable RAM
Vendor Receivable RAM
Agency Pool
AD1 Wallet
```

---

## Ledger Entry

Transaction ka debit/credit component.

Ek transaction ke multiple ledger entries ho sakte hain.

---

## Ledger Transaction

Financial event ka master record.

Example:

```text
Vendor Repayment ₹20,000
```

Uske andar corresponding ledger entries hongi.

---

## Locked Balance

Fund jo exist karta hai lekin currently usable nahi hai.

Common example:

```text
Restricted Ad Account Fund
```

---

## Locked Fund

Financial amount jiska ownership known hai but availability temporarily blocked hai.

---

# M

## Main Meta Connection

System me top-level connected Meta identity/business context.

Example internal label:

```text
Ads Pro
```

---

## Manual Adjustment

Authorized transaction jo correction ya specific financial reason ke liye manually create kiya gaya ho.

Manual adjustment direct balance overwrite nahi hona chahiye.

---

## Meta

Meta Platforms ke advertising/business systems ke liye shorthand.

---

## Meta Balance

Meta API se received balance-related value.

Internal ledger balance ka exact equivalent assume nahi karna chahiye.

---

## Meta Connection

Meta API authentication/integration configuration.

Contains things like:

```text
Connection Name
Business ID
Token
Status
Last Sync
```

---

## Meta Data

Meta API se synchronized operational data.

---

## Meta Sync

Meta se latest data fetch karke internal database update karne ki process.

---

## Meta Truth

Meta platform ke according operational reality.

Example:

```text
Account Status
Spend
Campaign State
```

---

# O

## Outstanding

Abhi tak settle na hua amount.

Vendor context:

```text
Original Funding
-
Repayment
=
Outstanding Payable
```

---

## Overpayment

Required/outstanding amount se zyada diya gaya money.

Example:

```text
Payable ₹20,000
Payment ₹30,000

Overpayment ₹10,000
```

---

## Owner

Paisa financially kis entity ka hai.

---

# P

## Payable

Company ko kisi external party ko dena hai.

Vendor context:

```text
Vendor Payable
```

means company owes vendor.

---

## Payment Proof

Transaction supporting document.

Example:

```text
UPI Screenshot
Bank Receipt
UTR
Invoice
```

---

## Physical Balance

Actual platform/account location par currently available amount.

Internal ownership breakdown isse separate hai.

---

## Posted Transaction

Financial transaction jo final ledger me commit ho chuki hai.

Posted transaction generally direct edit/delete nahi hogi.

---

# R

## Receivable

Company ko kisi external party se lena hai.

Vendor context:

```text
Vendor Receivable
```

means vendor owes company.

---

## Reconciliation

Different financial/operational sources ko compare karke mismatch detect karna.

Example:

```text
Internal Ledger
vs
Meta Data
vs
Allocation Records
```

---

## Reconciliation Difference

Expected aur observed amount ke beech mismatch.

---

## Reconciliation Issue

Mismatch detect hone par created investigation record.

---

## Reference

Transaction ko identify/support karne wala identifier.

Examples:

```text
UTR
Payment ID
Bank Ref
Internal Ref
Meta Ref
```

---

## Refund

Previously paid/allocated amount ka reverse money movement.

---

## Refund Pending

Refund approved/expected hai but complete nahi hua.

---

## Reallocation

Existing fund ko ek purpose/client/campaign se dusre me formally move karna.

---

## Restricted Account

Ad Account jo temporarily/permanently Meta restrictions ke under hai.

System me restricted hone par remaining fund ko locked state me mark kiya ja sakta hai.

---

## Reversal

Wrong posted financial transaction ko negate karne ke liye created opposite transaction.

---

## Role

System user permission group.

Examples:

```text
ADMIN
FINANCE
ADS_MANAGER
VIEWER
```

---

# S

## Settlement

Outstanding obligation ko payment/adjustment ke through resolve karna.

---

## Settlement Status

Examples:

```text
OPEN
PARTIAL
SETTLED
OVERPAID
```

---

## Snapshot

Kisi entity ka point-in-time historical state.

---

## Source of Truth

Authoritative data source for a particular type of information.

Project me multiple specialized sources of truth hain.

---

## Spend

Ads par actually consumed amount.

---

## Status

Entity ki current state.

Always context-specific hona chahiye.

Examples:

```text
Account Status
Transaction Status
Settlement Status
Fund Status
Sync Status
```

---

## Sync Run

Ek complete background synchronization execution.

---

# T

## Transaction

Financial ya operational event.

Financial context me amount movement/change record.

---

## Transaction ID

Unique identifier for a financial transaction.

---

## Transaction Type

Financial event classification.

Examples:

```text
CLIENT_PAYMENT
VENDOR_FUNDING
META_TOPUP
AD_SPEND
TRANSFER
REFUND
VENDOR_REPAYMENT
VENDOR_OVERPAYMENT
ADJUSTMENT
```

---

## Transfer

Fund ka source se destination me move hona.

---

# U

## Unallocated Fund

Money jo currently kisi specific client/campaign/purpose ko assigned nahi hai.

---

## Unused Client Balance

Client ke allocated budget ka woh portion jo campaign me spend nahi hua.

Example:

```text
Allocated ₹1,000
Spent ₹700
Unused ₹300
```

---

## User

Internal system user.

Examples:

```text
Admin
Finance Team
Ads Manager
Viewer
```

---

# V

## Vendor

External party jo company ko funding/credit provide karti hai ya company ke saath financial settlement relationship me hai.

---

## Vendor Funding

Vendor se company ko received amount.

---

## Vendor Funding Batch

Vendor funding ka individual traceable instance.

---

## Vendor Payable

Company ko vendor ko kitna dena hai.

Example:

```text
RAM Payable ₹80,000
```

---

## Vendor Receivable

Vendor se company ko kitna lena hai.

Example:

```text
RAM Receivable ₹10,000
```

---

## Vendor Repayment

Company dwara vendor ko original funding/obligation ke against diya gaya valid payment.

---

## Vendor Settlement

Vendor payable ko reduce/close karne wali financial process.

---

## Vendor Overpayment

Vendor ko uske actual payable se zyada amount pay hona.

Excess part Vendor Receivable banega.

---

# W

## Wallet

System me logical financial container.

Examples:

```text
Client Wallet
Agency Wallet
Ad Account Wallet
```

Wallet actual bank account hona zaroori nahi hai.

---

# Core Distinctions

## Balance vs Ownership

```text
Balance:
Kitna paisa hai?

Ownership:
Wo paisa kis ka hai?
```

---

## Location vs Owner

Example:

```text
Location:
AD1

Owner:
Client A
```

Same location me multiple owners ho sakte hain.

---

## Meta Balance vs Internal Balance

```text
Meta Balance:
Meta side ka balance-related number

Internal Balance:
Ledger ke basis par calculated value
```

Dono automatically identical assume nahi karne.

---

## Client Budget vs Client Payment

```text
Client Budget:
Campaign ke liye agreed/planned amount

Client Payment:
Actually client se received amount
```

---

## Allocation vs Spend

```text
Allocation:
Money reserve/assign karna

Spend:
Money actually consume hona
```

---

## Payable vs Receivable

```text
Payable:
Humko dena hai

Receivable:
Humko lena hai
```

---

## Restricted vs Locked

```text
Restricted:
Ad Account operational state

Locked:
Fund financial availability state
```

Account restricted hone se fund locked ho sakta hai.

---

## Campaign Status vs Financial Status

Example:

```text
Campaign:
COMPLETED

Financial:
UNSETTLED
```

Campaign complete hone ka matlab financial settlement complete hona zaroori nahi.

---

# Three Truth Model

## Meta Truth

Meta platform ke according operational reality.

```text
Account status
Spend
Campaign data
```

---

## Ledger Truth

Money movement ke according financial reality.

```text
Payment
Spend
Transfer
Refund
Settlement
```

---

## Business Truth

Money kis business entity se associated hai.

```text
Client
Vendor
Agency
Campaign
Ad Account
```

---

# Standard Status Vocabulary

## Account Status

```text
ACTIVE
RESTRICTED
DISABLED
PAYMENT_ISSUE
CLOSED
UNKNOWN
```

---

## Fund Status

```text
AVAILABLE
ALLOCATED
SPENT
LOCKED
REFUND_PENDING
REFUNDED
TRANSFERRED
ADJUSTED
```

---

## Transaction Status

```text
DRAFT
PENDING_APPROVAL
APPROVED
POSTED
REVERSED
FAILED
CANCELLED
```

---

## Client Job Status

```text
PLANNED
ACTIVE
PAUSED
COMPLETED
CANCELLED
```

---

## Financial Settlement Status

```text
OPEN
PARTIAL
SETTLED
OVERPAID
REFUND_PENDING
```

---

## Sync Status

```text
PENDING
RUNNING
SUCCESS
PARTIAL
FAILED
STALE
```

---

# Standard Financial Questions

System design ko aisa hona chahiye ki every tracked amount ke liye ideally following questions answer ho sakein:

```text
SOURCE
Paisa kahan se aaya?

OWNER
Paisa kis ka hai?

PURPOSE
Paisa kis kaam ke liye hai?

LOCATION
Paisa currently kahan hai?

STATUS
Paisa available, allocated, spent ya locked hai?

HISTORY
Paisa yahan tak kaise pahucha?
```

---

# Golden Terminology Rule

> **Same business concept ke liye project me multiple words randomly use nahi karne. Database, backend, UI aur documentation me standardized terminology follow karni hai.**

Example:

Use:

```text
Vendor Receivable
```

instead of randomly:

```text
Vendor Extra
Vendor Minus Balance
Vendor Recovery
Vendor Negative Payable
```

Likewise use:

```text
Unused Client Balance
```

instead of multiple inconsistent terms.

---

# Final Glossary Principle

> **If a term affects money, ownership, account identity, settlement or auditability, its meaning must be explicit and consistent across the entire system.**
