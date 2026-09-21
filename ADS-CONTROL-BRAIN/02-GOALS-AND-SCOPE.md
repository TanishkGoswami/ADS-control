# Goals and Scope

## Overview

Is project ka purpose sirf Meta Ad Accounts ki list maintain karna nahi hai.

Project ka actual objective ek centralized internal platform banana hai jo company ke:

```text
Meta Assets
Client Funds
Vendor Funds
Ad Account Funds
Campaign Allocations
Spend
Unused Balances
Restricted Funds
Vendor Settlements
Refunds
Adjustments
Reconciliation
```

ko ek structured aur auditable system me connect kare.

System ko operational tracking aur financial control dono provide karna hai.

---

# Primary Goal

Primary goal hai:

> **Company ke har Meta advertising asset aur har financial movement ko traceable, manageable aur auditable banana.**

System ko kisi bhi point par answer karna chahiye:

```text
Kaunsa Ad Account kahan hai?

Uska current status kya hai?

Usme kitna fund available hai?

Us fund ka actual owner kaun hai?

Kitna spend hua?

Kitna client balance remaining hai?

Kitna fund restricted/locked hai?

Kis vendor ko kitna dena hai?

Kis vendor se kitna lena hai?

Kya koi financial mismatch hai?
```

---

# Core Business Goals

## Goal 1: Complete Meta Account Visibility

Company ke saare Meta assets ek centralized hierarchy me visible hone chahiye.

Structure:

```text
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
```

System ko show karna chahiye:

```text
Total Meta Connections

Total Business Portfolios

Total Ad Accounts

Active Accounts

Restricted Accounts

Disabled Accounts

Payment Issue Accounts
```

---

## Goal 2: Remove Account Mapping Confusion

Har Ad Account ke saath clear mapping honi chahiye:

```text
Main Meta Connection
Business Portfolio
Meta Ad Account ID
Internal Name
Status
Assigned Client
```

Same display names se system confused nahi hona chahiye.

Actual identification:

```text
Meta Ad Account ID
```

ke basis par hogi.

---

# Goal 3: Track Every Fund Addition

Har fund addition record hona chahiye.

Example:

```text
Ad Account:
BP1 / AD1

Amount:
₹10,000

Source:
Client A

Added By:
User X

Reference:
Payment / UTR / Screenshot

Date:
17 Sep 2026
```

No financial top-up should exist without a traceable record.

---

# Goal 4: Separate Physical Balance and Ownership

Ek Ad Account ka total balance aur us balance ka ownership breakdown alag track karna hai.

Example:

```text
AD1 Total Tracked Balance
₹20,000
```

Breakdown:

```text
Client A       ₹5,000
Client B       ₹7,000
Agency         ₹4,000
Client C       ₹4,000
--------------------
Total         ₹20,000
```

System ko pata hona chahiye:

> Paisa physically kahan hai aur financially kis ka hai.

---

# Goal 5: Client Fund Lifecycle Track Karna

Client payment ka complete lifecycle visible hona chahiye.

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
      ↓
Remaining Balance
```

Remaining balance ka final status bhi clear hona chahiye.

Possible outcomes:

```text
Client Wallet

Next Campaign

Refund Pending

Refunded

Approved Transfer

Agency Allocation
```

---

# Goal 6: Client Leftover Funds Never Lose Track

Example:

```text
Client Budget:
₹1,000

Actual Spend:
₹700

Unused:
₹300
```

System ko ₹300 ko automatically invisible nahi karna.

₹300 ka:

```text
Source

Owner

Location

Status

Future Movement
```

track hona chahiye.

---

# Goal 7: Restricted Funds Track Karna

Ad Account restriction hone par account ka remaining fund separately identify hona chahiye.

Example:

```text
AD1

Before Restriction:
₹5,000
```

After restriction:

```text
Available:
₹0

Locked:
₹5,000
```

Ownership breakdown:

```text
Client A Locked:
₹2,000

Client B Locked:
₹2,000

Agency Locked:
₹1,000
```

---

# Goal 8: Vendor Funding Track Karna

Vendor se receive kiya gaya every funding transaction separate record hona chahiye.

Example:

```text
Vendor:
RAM

Funding Batch:
RAM-RF-001

Amount:
₹1,00,000

Received:
01 Sep 2026
```

Multiple funding batches separately maintained honge.

---

# Goal 9: Vendor Repayment Control

Vendor repayment ke time system ko calculate karna chahiye:

```text
Original Funding

Already Repaid

Outstanding Payable

Current Payment

Remaining Payable
```

User ko vendor ke actual outstanding se zyada repayment blindly nahi karni chahiye.

---

# Goal 10: Vendor Overpayment Track Karna

Agar vendor fully settled hai aur extra amount chala jata hai:

```text
Vendor Payable:
₹0

Extra Payment:
₹10,000
```

to system record kare:

```text
Vendor Receivable:
₹10,000
```

Ye amount tab tak open rahega jab tak resolve nahi hota.

---

# Goal 11: Agency Fund Separate Maintain Karna

Company ka free operational balance client money ke saath mix nahi hona chahiye.

Separate:

```text
Agency Free Fund
```

maintain hoga.

Example:

```text
Agency Available:
₹50,000
```

Agar agency fund kisi client ke liye use hota hai:

```text
Agency Pool
    ↓
Client Campaign
```

transaction create hogi.

---

# Goal 12: Immutable Financial Ledger

Financial balances transactions se calculate hone chahiye.

System me:

```text
Balance = manually editable field
```

approach avoid karna hai.

Correct model:

```text
Transactions
      ↓
Ledger Entries
      ↓
Calculated Balance
```

Posted financial record directly delete ya overwrite nahi hoga.

---

# Goal 13: Complete Auditability

System ko ye record karna hai:

```text
Who?

What?

When?

Where?

Why?

Previous State?

New State?
```

Particularly for:

```text
Fund Addition

Fund Transfer

Vendor Repayment

Refund

Adjustment

Reversal

Account Mapping Change

Approval
```

---

# Goal 14: Meta and Internal Data Reconciliation

Meta se aane wale operational numbers aur internal records compare hone chahiye.

Example:

```text
Internal Expected:
₹20,000

Meta Tracked:
₹19,700

Difference:
₹300
```

System should create:

```text
Reconciliation Issue
```

---

# Goal 15: Proactive Alerts

System sirf data show nahi kare.

Important issues proactively surface kare.

Examples:

```text
Account Restricted

Account Disabled

Low Balance

Payment Issue

No Spend

Vendor Overpayment

Vendor Outstanding

Client Locked Fund

Refund Pending

Financial Mismatch

Meta Sync Failure
```

---

# Goal 16: Reduce Human Memory Dependency

System ka important purpose hai:

> Business ko human memory se system memory par shift karna.

No critical information should depend on:

```text
"Mujhe yaad hai..."

"Shayad Ram ko payment ho gaya tha..."

"AD2 me kisi client ka balance bacha tha..."

"Ye ₹10k kahan gaya tha?"
```

System should provide exact answers.

---

# Goal 17: Scale Without Losing Control

System ko design karna hai so that same model work kare:

```text
10 Ad Accounts

50 Ad Accounts

100 Ad Accounts

500+ Ad Accounts
```

aur:

```text
5 Clients

50 Clients

500 Clients
```

ke saath bhi.

---

# V1 Scope

Version 1 ka objective:

> Tracking, financial control, reconciliation aur monitoring ko solid banana.

V1 me following modules included honge.

---

# V1 Module 1: Authentication

Include:

```text
Login

Logout

Session Management

User Roles

Permission Checks
```

Initial roles:

```text
ADMIN

FINANCE

ADS MANAGER

VIEWER
```

---

# V1 Module 2: Meta Connections

Ability to:

```text
Add Meta Connection

Store Secure Token

View Connection Status

View Last Sync

Enable / Disable Connection

Trigger Manual Sync
```

---

# V1 Module 3: Business Portfolio Management

System:

```text
Fetch Business Portfolios

Store Business IDs

Map to Meta Connection

Show Portfolio Status

Show Ad Account Count

Show Financial Summary
```

---

# V1 Module 4: Ad Account Management

Each Ad Account will include:

```text
Meta Ad Account ID

Name

Business Portfolio

Main Connection

Account Status

Currency

Timezone

Spend

Tracked Balance

Locked Balance

Last Sync
```

---

# V1 Module 5: Account Tree View

Visual hierarchy:

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
    └── AD5
```

With status and financial indicators.

---

# V1 Module 6: Client Management

Features:

```text
Create Client

Edit Client Information

Client Status

Client Wallet

Client Payments

Client Campaigns

Client Allocations

Client Remaining Balance

Client Locked Balance
```

---

# V1 Module 7: Client Jobs / Campaign Tracking

Internal client work records:

```text
Client

Budget

Assigned Ad Account

Start Date

End Date

Actual Spend

Unused Balance

Operational Status

Financial Status
```

This does not mean system will necessarily create campaigns on Meta in V1.

---

# V1 Module 8: Vendor Management

Features:

```text
Create Vendor

Vendor Profile

Funding History

Funding Batches

Vendor Payable

Vendor Repayment

Vendor Receivable

Overpayment

Settlement History
```

---

# V1 Module 9: Vendor Funding Batches

Each vendor funding separately track hogi.

Example:

```text
RAM-RF-001
₹1,00,000

RAM-RF-002
₹2,00,000
```

System batch-level settlement visibility provide karega.

---

# V1 Module 10: Financial Ledger

V1 ka core module.

Contains:

```text
Ledger Accounts

Transactions

Ledger Entries

Balances

References

Transaction Types

Reversals
```

Rule:

```text
Debit = Credit
```

for every posted ledger transaction.

---

# V1 Module 11: Fund Allocation

System support karega:

```text
Client → Ad Account

Agency → Ad Account

Vendor-funded money → operational allocation

Ad Account → Client Allocation

Client Leftover → Client Wallet

Agency Pool → Campaign
```

Every allocation traceable hogi.

---

# V1 Module 12: Fund Transfer

Fund transfer should have:

```text
Source

Destination

Amount

Reason

Reference

Created By

Approved By

Date
```

---

# V1 Module 13: Leftover Fund Management

When client campaign completes:

```text
Allocated - Spend = Unused
```

Unused amount ka resolution required hoga.

Possible actions:

```text
Keep in Client Wallet

Allocate to Next Campaign

Refund

Approved Transfer

Agency Allocation
```

---

# V1 Module 14: Restricted Fund Management

Account status restricted hone par:

```text
Available allocations
↓
Locked allocations
```

Ownership unchanged rahega.

---

# V1 Module 15: Vendor Settlement

System allow karega:

```text
Select Vendor

View Outstanding

Enter Payment

Choose Source

Add Reference

Attach Proof

Submit
```

System excess amount detect karega.

---

# V1 Module 16: Vendor Overpayment

If:

```text
Payment > Vendor Payable
```

system calculate kare:

```text
Valid Repayment

Excess Payment

Vendor Receivable
```

---

# V1 Module 17: Refund Management

Support:

```text
Client Refund

Vendor Refund

Meta Refund

Other Financial Refund
```

Status:

```text
REQUESTED

PENDING

COMPLETED

FAILED

CANCELLED
```

---

# V1 Module 18: Reconciliation

System compare karega:

```text
Internal Ledger

Meta Data

Allocation Records
```

Mismatch create karega:

```text
Reconciliation Case
```

---

# V1 Module 19: Alerts

Initial alert categories:

```text
META_ACCOUNT_RESTRICTED

META_ACCOUNT_DISABLED

LOW_BALANCE

VENDOR_OVERPAYMENT

VENDOR_OUTSTANDING

CLIENT_LOCKED_FUND

REFUND_PENDING

RECONCILIATION_MISMATCH

META_SYNC_FAILED
```

---

# V1 Module 20: Audit Log

Sensitive activity audit:

```text
User

Action

Entity

Previous Data

New Data

Date

Reference
```

---

# V1 Module 21: Attachments

Financial transactions ke saath support:

```text
Payment Screenshot

Bank Receipt

UTR Proof

Invoice

Meta Screenshot

Other Document
```

---

# V1 Module 22: Dashboard

Dashboard summary:

```text
Total Meta Connections

Total Business Portfolios

Total Ad Accounts

Active Accounts

Restricted Accounts

Total Tracked Funds

Client Allocated Funds

Agency Free Funds

Locked Funds

Vendor Payable

Vendor Receivable

Alerts

Reconciliation Issues
```

---

# V1 Module 23: Reports

Basic reports:

```text
Ad Account Summary

Client Fund Report

Vendor Statement

Vendor Outstanding Report

Vendor Receivable Report

Locked Fund Report

Fund Movement Report

Transaction Report

Reconciliation Report
```

---

# V1 Module 24: Meta Sync

V1 sync should include:

```text
Business Portfolios

Ad Accounts

Ad Account Status

Basic Account Details

Spend Data

Balance-related information

Campaign-level data where needed
```

---

# Explicitly Out of Scope for V1

V1 ko focused rakhne ke liye following features intentionally include nahi honge.

---

## 1. Full Meta Campaign Creation

V1 me system ka main purpose campaign builder banna nahi hai.

No initial requirement for:

```text
Create Campaign

Create Ad Set

Create Ad

Upload Creative

Edit Targeting

Publish Campaign
```

Ye future phase me possible hai.

---

## 2. Creative Management Platform

No complete:

```text
Creative Library

Design Editor

Video Editor

Ad Creative Approval Workflow
```

in V1.

---

## 3. Full CRM

System client tracking karega but complete sales CRM nahi hoga.

No initial focus on:

```text
Lead Pipeline

Sales Automation

Calling

WhatsApp CRM

Follow-up Automation
```

---

# 4. Full Accounting ERP

This is not initially:

```text
Tally Replacement

GST System

Payroll System

General Company Accounting ERP

Tax Filing Software
```

Financial ledger ads operations ke context me focused rahega.

---

# 5. Bank API Automation

V1 me bank account automatically sync karna mandatory nahi hai.

Initial:

```text
Manual Payment Entry

Reference Number

Proof Attachment
```

Future me bank reconciliation add ki ja sakti hai.

---

# 6. Automatic Vendor Payments

System initially vendor ko actual money transfer nahi karega.

It will:

```text
Track

Validate

Approve

Record
```

settlements.

Actual payment outside system ho sakta hai.

---

# 7. Automatic Client Refunds

V1 me refund automatically bank/UPI transfer karna required nahi hai.

System refund lifecycle track karega.

---

# 8. AI Decision Making

V1 me AI automatically decide nahi karega:

```text
Which client should receive leftover fund?

Which vendor should be paid?

Which account should run ads?

Should money be transferred?
```

AI future me recommendation layer ho sakta hai.

Financial decision requires explicit rule/approval.

---

# V1 Non-Goals

V1 ka objective nahi hai:

```text
Build everything at once

Replace Meta Ads Manager

Replace accounting software

Automate every financial action

Remove human approval

Create campaigns automatically

Manage ad creatives
```

V1 ka objective hai:

```text
Get the data model right.

Get the ledger right.

Get ownership right.

Get fund movement right.

Get reconciliation right.

Get auditability right.
```

---

# Phase 2 Scope

V2 me consider kiya ja sakta hai:

```text
Campaign Auto Mapping

Campaign-Level Client Allocation

Automated Daily Reports

WhatsApp Alerts

Email Alerts

Client Statements

Vendor Statements

Advanced Analytics

Accounting Export

Bulk Operations

Advanced Approval Rules

Mobile-Friendly Operations

Automated Reconciliation Suggestions
```

---

# Phase 3 Scope

Future advanced functionality:

```text
Bank Integration

Payment Gateway Integration

Automatic Vendor Settlement Suggestions

Automatic Client Billing

Invoice Generation

Meta Campaign Creation

Cross-Platform Ads

Google Ads Integration

YouTube Ads Integration

AI Anomaly Detection

AI Finance Assistant

Predictive Fund Requirements

Automated Low Balance Forecasting
```

---

# Cross-Platform Future Scope

Core financial architecture platform-independent honi chahiye.

Future:

```text
Meta Ads
Google Ads
YouTube Ads
Other Ad Platforms
```

same ledger use kar saken.

Example:

```text
Client A
│
├── Meta Ads
├── Google Ads
└── YouTube Ads
```

Financial ownership model unchanged rahega.

---

# Scalability Goal

System architecture ideally support kare:

```text
500+ Ad Accounts

100+ Business Portfolios

1000+ Clients

100+ Vendors

Millions of Ledger Entries
```

without core architecture redesign.

Exact infrastructure scale usage ke saath adjust ho sakti hai.

---

# Data Integrity Goal

System should prioritize:

```text
Correctness
>
Convenience
```

Financial transaction me incorrect fast operation se better hai validated operation.

Critical actions:

```text
Fund Transfer

Vendor Settlement

Refund

Adjustment

Reversal
```

must pass validation.

---

# Security Goal

System should ensure:

```text
No Meta/Facebook Password Storage

Encrypted Tokens

Role-Based Access

Financial Approval Controls

Audit Logs

Secure File Storage

Database Backups

Session Security
```

---

# UX Goal

Complex accounting backend ke despite UI simple rehni chahiye.

User ko ledger accounting samajhna mandatory nahi hona chahiye.

Example UI:

```text
RAM

Funding:
₹1,00,000

Paid:
₹80,000

You Still Owe:
₹20,000
```

rather than exposing raw debit/credit terminology everywhere.

Technical ledger backend me rahega.

---

# Reporting Goal

Management should quickly answer:

```text
Today kitna spend hua?

Total free fund kitna hai?

Total locked fund kitna hai?

Vendor outstanding kitna hai?

Vendor se recover kitna karna hai?

Clients ka unused balance kitna hai?

Restricted accounts me kitna money stuck hai?
```

---

# Audit Goal

Any important number should be explainable.

Example:

Dashboard:

```text
Vendor Receivable:
₹85,000
```

User click kare aur breakdown milna chahiye:

```text
RAM      ₹10,000

Shyam    ₹25,000

Vendor C ₹50,000
```

Then transaction level detail tak drill down possible hona chahiye.

---

# Project Priority Order

Development priority:

```text
1. Business Rules

2. Entity Model

3. Ledger Design

4. Database Schema

5. Money Flows

6. Meta Integration

7. Backend Logic

8. Reconciliation

9. Dashboard

10. Alerts

11. Reports

12. Automation
```

UI first approach avoid karni hai.

Core financial model pehle stable hona chahiye.

---

# Definition of V1 Success

V1 successful tab hoga jab following real scenarios correctly handle ho:

### Scenario A

```text
Fund added to AD1
Account later restricted
Remaining amount visible as locked
```

### Scenario B

```text
Client budget ₹1,000
Spend ₹700
Unused ₹300 correctly tracked
```

### Scenario C

```text
Unused ₹300 later transferred
Complete source history remains available
```

### Scenario D

```text
Vendor RAM gives ₹1,00,000
Repayment happens in parts
Outstanding automatically calculated
```

### Scenario E

```text
RAM fully settled
Extra ₹10,000 paid

System shows:
RAM Owes Company ₹10,000
```

### Scenario F

```text
Meta account changes status
System detects and alerts
```

### Scenario G

```text
Internal amount and Meta amount mismatch
System creates reconciliation issue
```

### Scenario H

```text
Wrong financial transaction entered
It is reversed rather than silently edited
```

---

# Scope Protection Rule

Any new feature request should be checked against these questions:

```text
Does it improve account tracking?

Does it improve financial traceability?

Does it improve fund ownership?

Does it improve reconciliation?

Does it improve auditability?

Does it reduce operational risk?
```

If answer is no and feature is unrelated, it should not enter V1 by default.

---

# Final Scope Statement

> **Version 1 of the Meta Ads Operations & Financial Control System will focus on establishing a reliable operational and financial control layer across Meta Connections, Business Portfolios, Ad Accounts, Clients and Vendors. Its highest priority is accurate money ownership, transaction history, account monitoring, vendor/client settlement tracking and reconciliation. Campaign creation, complete CRM, general accounting ERP and advanced automation are intentionally outside the initial scope.**
