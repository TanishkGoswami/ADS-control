# Sample Data

## Overview

Ye document development, testing aur onboarding ke liye realistic sample data define karta hai.

Purpose:

```text id="smp001"
Developers ko business model samajhna

Database seed data banana

UI screens test karna

Financial flows verify karna

Edge cases reproduce karna

Reconciliation logic test karna
```

Important:

> **Ye sample data illustrative hai. Production records, IDs, balances aur references alag honge.**

---

# 1. Sample Organization

```text id="smp002"
Organization:
Metabull Universe

organization_id:
ORG-001

Default Currency:
INR

Timezone:
Asia/Kolkata

Status:
ACTIVE
```

---

# 2. Sample Users

## Admin

```text id="smp003"
User ID:
USR-001

Name:
System Admin

Role:
ADMIN

Status:
ACTIVE
```

## Finance User

```text id="smp004"
User ID:
USR-002

Name:
Finance Manager

Role:
FINANCE

Status:
ACTIVE
```

## Ads Manager

```text id="smp005"
User ID:
USR-003

Name:
Ads Manager 1

Role:
ADS_MANAGER

Status:
ACTIVE
```

## Viewer

```text id="smp006"
User ID:
USR-004

Name:
Viewer 1

Role:
VIEWER

Status:
ACTIVE
```

---

# 3. Meta Connections

## Connection 1

```text id="smp007"
Meta Connection ID:
MC-001

Internal Name:
Ads Pro

Connection Status:
ACTIVE

Permission Status:
OK

Last Successful Sync:
2026-09-17 15:00 IST
```

## Connection 2

```text id="smp008"
Meta Connection ID:
MC-002

Internal Name:
Ads Backup

Connection Status:
AUTH_REQUIRED

Last Successful Sync:
2026-09-17 11:00 IST
```

---

# 4. Business Portfolios

## BP1

```text id="smp009"
Business Portfolio ID:
BP-001

Meta Business ID:
123456789001

Name:
Main Portfolio

Status:
ACTIVE
```

## BP2

```text id="smp010"
Business Portfolio ID:
BP-002

Meta Business ID:
123456789002

Name:
Backup Portfolio

Status:
ACTIVE
```

---

# 5. Meta Asset Relationships

```text id="smp011"
MC-001
→ BP-001
Relationship:
OWNED

MC-001
→ BP-002
Relationship:
SHARED
```

---

# 6. Ad Accounts

## AD1

```text id="smp012"
Ad Account ID:
AA-001

Meta Ad Account ID:
act_100000001

Name:
Scaling Account 01

Alias:
AD1

Currency:
INR

Timezone:
Asia/Kolkata

Normalized Status:
ACTIVE

Can Run Ads:
YES
```

## AD2

```text id="smp013"
Ad Account ID:
AA-002

Meta Ad Account ID:
act_100000002

Name:
Scaling Account 02

Alias:
AD2

Currency:
INR

Normalized Status:
RESTRICTED

Can Run Ads:
NO
```

## AD3

```text id="smp014"
Ad Account ID:
AA-003

Meta Ad Account ID:
act_100000003

Name:
Shared Account

Alias:
AD3

Currency:
INR

Normalized Status:
ACTIVE

Can Run Ads:
YES
```

---

# 7. Portfolio ↔ Ad Account Relationships

```text id="smp015"
BP-001
→ AA-001
Relationship:
OWNED

BP-001
→ AA-002
Relationship:
OWNED

BP-002
→ AA-003
Relationship:
SHARED
```

---

# 8. Sample Clients

## Client A

```text id="smp016"
Client ID:
CLI-001

Client Reference:
CLI-0001

Name:
Alpha Digital

Operational Status:
ACTIVE

Financial Status:
ACTIVE

Assigned Manager:
USR-003
```

## Client B

```text id="smp017"
Client ID:
CLI-002

Client Reference:
CLI-0002

Name:
Beta Commerce

Operational Status:
ACTIVE

Financial Status:
ACTIVE

Assigned Manager:
USR-003
```

---

# 9. Client Jobs

## Client A Job

```text id="smp018"
Job ID:
JOB-001

Client:
CLI-001

Job Name:
Alpha September Campaign

Budget:
₹20,000

Currency:
INR

Operational Status:
ACTIVE

Financial Status:
FUNDED
```

## Client B Job

```text id="smp019"
Job ID:
JOB-002

Client:
CLI-002

Job Name:
Beta Lead Campaign

Budget:
₹15,000

Currency:
INR

Operational Status:
ACTIVE

Financial Status:
PARTIALLY_FUNDED
```

---

# 10. Meta Campaigns

## Campaign 1

```text id="smp020"
Campaign ID:
CMP-001

Meta Campaign ID:
238500001

Ad Account:
AA-001

Name:
Alpha Leads Sept

Status:
ACTIVE
```

## Campaign 2

```text id="smp021"
Campaign ID:
CMP-002

Meta Campaign ID:
238500002

Ad Account:
AA-003

Name:
Beta Leads Sept

Status:
ACTIVE
```

---

# 11. Client Job ↔ Ad Account Assignments

```text id="smp022"
JOB-001
→ AA-001
Effective From:
2026-09-01

Status:
ACTIVE
```

```text id="smp023"
JOB-002
→ AA-003
Effective From:
2026-09-05

Status:
ACTIVE
```

---

# 12. Client Job ↔ Campaign Mappings

```text id="smp024"
JOB-001
→ CMP-001
→ AA-001
```

```text id="smp025"
JOB-002
→ CMP-002
→ AA-003
```

---

# 13. Client A Payment

Client A pays:

```text id="smp026"
₹20,000
```

Sample record:

```text id="smp027"
Client Payment ID:
CP-001

Client:
CLI-001

Amount:
₹20,000

Purpose:
ADS_FUND

Payment Date:
2026-09-01

Method:
UPI

Reference:
UTR-ALPHA-001

Status:
POSTED
```

---

# 14. Client A Payment Ledger

Transaction:

```text id="smp028"
Transaction:
TXN-001

Type:
CLIENT_PAYMENT

Amount:
₹20,000
```

Ledger:

```text id="smp029"
Dr COMPANY_BANK_INR
₹20,000

Cr CLIENT_CLI001_FUNDS_INR
₹20,000
```

---

# 15. Client A Fund Lot

```text id="smp030"
Fund Lot:
FL-001

Source:
CP-001

Owner:
CLI-001

Original Amount:
₹20,000

Currency:
INR

Status:
ACTIVE
```

---

# 16. Client A Job Allocation

Client A allocates:

```text id="smp031"
₹15,000
```

to JOB-001.

After:

```text id="smp032"
Client Wallet Available:
₹5,000

JOB-001 Allocation:
₹15,000
```

---

# 17. Client A Ad Account Allocation

JOB-001 allocation:

```text id="smp033"
₹15,000
```

moves operationally to:

```text id="smp034"
AA-001
```

Fund allocation:

```text id="smp035"
Allocation ID:
ALLOC-001

Fund Lot:
FL-001

Owner:
CLI-001

Purpose:
JOB-001

Location:
AA-001

Amount:
₹15,000

Status:
ALLOCATED
```

---

# 18. Client A Spend

Meta reports:

```text id="smp036"
₹11,500
```

spend.

Spend fact:

```text id="smp037"
Spend Fact ID:
SF-001

Ad Account:
AA-001

Campaign:
CMP-001

Date Range:
2026-09-01 to 2026-09-10

Amount:
₹11,500

Currency:
INR
```

---

# 19. Spend Attribution

```text id="smp038"
Spend Attribution:
SA-001

Spend Fact:
SF-001

Client:
CLI-001

Job:
JOB-001

Allocation:
ALLOC-001

Attributed Amount:
₹11,500

Status:
ATTRIBUTED
```

---

# 20. Client A Allocation Position

```text id="smp039"
Original Allocation:
₹15,000

Consumed:
₹11,500

Remaining:
₹3,500
```

---

# 21. Client A Total Position

Client A originally paid:

```text id="smp040"
₹20,000
```

Current:

```text id="smp041"
Wallet Available:
₹5,000

AD1 Remaining:
₹3,500

Spent:
₹11,500
```

Check:

```text id="smp042"
₹5,000
+
₹3,500
+
₹11,500
=
₹20,000
```

Reconciled.

---

# 22. Client B Payment

Client B pays:

```text id="smp043"
₹10,000
```

Budget:

```text id="smp044"
₹15,000
```

Funding gap:

```text id="smp045"
₹5,000
```

---

# 23. Client B Payment Record

```text id="smp046"
Client Payment:
CP-002

Client:
CLI-002

Amount:
₹10,000

Purpose:
ADS_FUND

Status:
POSTED
```

---

# 24. Client B Financial Status

```text id="smp047"
Job Budget:
₹15,000

Client Funded:
₹10,000

Funding Gap:
₹5,000

Job Financial Status:
PARTIALLY_FUNDED
```

---

# 25. Agency Temporary Funding

Agency provides Client B:

```text id="smp048"
₹5,000
```

temporarily.

Record:

```text id="smp049"
Transaction:
TXN-003

Type:
AGENCY_TEMP_CLIENT_FUNDING

Amount:
₹5,000

Purpose:
JOB-002
```

---

# 26. Client B Receivable

Because agency-funded amount is recoverable:

```text id="smp050"
Client Receivable:
CR-001

Client:
CLI-002

Original Amount:
₹5,000

Outstanding:
₹5,000

Reason:
Agency Temporary Funding

Status:
OPEN
```

---

# 27. Mixed Ownership Job

JOB-002 funding:

```text id="smp051"
Client B-owned:
₹10,000

Agency-owned:
₹5,000

Total:
₹15,000
```

This is an important sample because same job has two owners.

---

# 28. Shared Ad Account Allocation

AA-003:

```text id="smp052"
Client B / JOB-002:
₹10,000

Agency / JOB-002:
₹5,000
```

Total tracked:

```text id="smp053"
₹15,000
```

---

# 29. Vendor RAM

```text id="smp054"
Vendor ID:
VEN-001

Vendor Reference:
VEN-0001

Name:
RAM

Operational Status:
ACTIVE

Financial Status:
OPEN
```

---

# 30. Vendor Funding Example

RAM provides:

```text id="smp055"
₹1,00,000
```

Funding batch:

```text id="smp056"
Batch:
RAM-RF-001

Original Amount:
₹1,00,000

Currency:
INR

Status:
OPEN
```

---

# 31. Vendor Funding Record

```text id="smp057"
Vendor Funding ID:
VF-001

Vendor:
VEN-001

Funding Batch:
RAM-RF-001

Amount:
₹1,00,000

Date:
2026-08-25

Reference:
RAM-FUND-001

Status:
POSTED
```

---

# 32. Vendor Funding Ledger

```text id="smp058"
TXN-010

Dr COMPANY_BANK_INR
₹1,00,000

Cr VENDOR_RAM_PAYABLE_INR
₹1,00,000
```

---

# 33. Vendor Position After Funding

```text id="smp059"
Vendor Payable:
₹1,00,000

Vendor Receivable:
₹0
```

---

# 34. First Vendor Repayment

Company pays RAM:

```text id="smp060"
₹40,000
```

Settlement:

```text id="smp061"
SET-001

Payment Amount:
₹40,000

Valid Repayment:
₹40,000

Excess:
₹0
```

---

# 35. Repayment Ledger

```text id="smp062"
TXN-011

Dr VENDOR_RAM_PAYABLE_INR
₹40,000

Cr COMPANY_BANK_INR
₹40,000
```

---

# 36. RAM Position

```text id="smp063"
Original Funding:
₹1,00,000

Repaid:
₹40,000

Payable:
₹60,000
```

---

# 37. Second Vendor Repayment

Company pays:

```text id="smp064"
₹60,000
```

After:

```text id="smp065"
RAM Payable:
₹0
```

Funding batch:

```text id="smp066"
RAM-RF-001
Status:
SETTLED
```

---

# 38. Vendor Overpayment Scenario

Finance accidentally pays RAM:

```text id="smp067"
₹10,000
```

after payable already reached zero.

Settlement:

```text id="smp068"
SET-003

Payable Before:
₹0

Payment Amount:
₹10,000

Valid Repayment:
₹0

Excess:
₹10,000
```

---

# 39. Overpayment Ledger

Conceptually:

```text id="smp069"
Dr VENDOR_RAM_RECEIVABLE_INR
₹10,000

Cr COMPANY_BANK_INR
₹10,000
```

---

# 40. Vendor Receivable Record

```text id="smp070"
Vendor Receivable:
VR-001

Vendor:
RAM

Original Amount:
₹10,000

Outstanding:
₹10,000

Origin Settlement:
SET-003

Status:
OPEN
```

---

# 41. RAM Position After Overpayment

Correct display:

```text id="smp071"
Vendor Payable:
₹0

Vendor Receivable:
₹10,000
```

Incorrect display:

```text id="smp072"
Vendor Payable:
-₹10,000
```

The system must use the first version.

---

# 42. New RAM Funding

Later RAM provides:

```text id="smp073"
₹2,00,000
```

New batch:

```text id="smp074"
RAM-RF-002
₹2,00,000
```

---

# 43. Existing Receivable Before New Funding

```text id="smp075"
Vendor Receivable:
₹10,000
```

This must not disappear automatically.

---

# 44. Approved Offset

Finance explicitly approves:

```text id="smp076"
Offset:
₹10,000
```

against new funding liability.

Gross funding:

```text id="smp077"
₹2,00,000
```

Receivable offset:

```text id="smp078"
₹10,000
```

Net new payable effect:

```text id="smp079"
₹1,90,000
```

---

# 45. RAM Position After Offset

```text id="smp080"
Payable:
₹1,90,000

Receivable:
₹0
```

History still shows:

```text id="smp081"
Gross Funding:
₹2,00,000

Receivable Offset:
₹10,000
```

---

# 46. Restricted Ad Account Scenario

AA-002 receives client allocation:

```text id="smp082"
Client A:
₹5,000
```

Before any spend:

```text id="smp083"
Spend:
₹0
```

Then account becomes:

```text id="smp084"
RESTRICTED
```

---

# 47. Locked Fund Creation

```text id="smp085"
Locked Fund:
LF-001

Owner:
CLI-001

Ad Account:
AA-002

Amount:
₹5,000

Reason:
AD_ACCOUNT_RESTRICTED

Status:
LOCKED
```

---

# 48. Client Ownership After Restriction

Correct:

```text id="smp086"
Client A owns:
₹5,000 locked
```

Incorrect:

```text id="smp087"
Client A balance:
₹0
```

Restriction changes usability, not ownership.

---

# 49. Partial Spend Before Restriction

Alternative scenario:

Allocation:

```text id="smp088"
₹5,000
```

Spend:

```text id="smp089"
₹3,200
```

Restriction occurs.

Remaining locked:

```text id="smp090"
₹1,800
```

---

# 50. Locked Fund Reconciliation

```text id="smp091"
Original Allocation:
₹5,000

Spent:
₹3,200

Locked:
₹1,800

Total:
₹5,000
```

Matched.

---

# 51. Partial Recovery

Meta returns:

```text id="smp092"
₹1,000
```

of locked ₹1,800.

After:

```text id="smp093"
Recovered:
₹1,000

Remaining Locked:
₹800
```

Do not close recovery case yet.

---

# 52. Full Recovery

Later remaining:

```text id="smp094"
₹800
```

recovered.

Then:

```text id="smp095"
Locked:
₹0

Recovery Case:
RESOLVED
```

---

# 53. Client Leftover Scenario

JOB-001 completed.

Original allocation:

```text id="smp096"
₹15,000
```

Spend:

```text id="smp097"
₹11,500
```

Leftover:

```text id="smp098"
₹3,500
```

---

# 54. Client Leftover Record

```text id="smp099"
Leftover:
LO-001

Client:
CLI-001

Job:
JOB-001

Amount:
₹3,500

Owner:
CLI-001

Status:
OPEN
```

---

# 55. Return Leftover to Wallet

Client decides to retain balance.

Resolution:

```text id="smp100"
LO-001
→ Client Wallet
₹3,500
```

After:

```text id="smp101"
Client Wallet:
Previous ₹5,000
+
₹3,500
=
₹8,500
```

---

# 56. Client Refund Example

Client A asks refund:

```text id="smp102"
₹5,000
```

Available wallet:

```text id="smp103"
₹8,500
```

Reserve:

```text id="smp104"
Refund Pending:
₹5,000

Available:
₹3,500
```

---

# 57. Client Refund Record

```text id="smp105"
Refund:
REF-001

Client:
CLI-001

Requested:
₹5,000

Approved:
₹5,000

Paid:
₹0

Status:
APPROVED
```

---

# 58. Client Refund Posting

Actual bank payment completes.

Ledger:

```text id="smp106"
TXN-020

Dr CLIENT_CLI001_FUNDS_INR
₹5,000

Cr COMPANY_BANK_INR
₹5,000
```

Refund:

```text id="smp107"
Status:
COMPLETED
```

---

# 59. Client Position After Refund

Client A current:

```text id="smp108"
Available:
₹3,500

Refunded:
₹5,000

Historical Spend:
₹11,500
```

Original payment:

```text id="smp109"
₹20,000
```

Check:

```text id="smp110"
₹3,500
+
₹5,000
+
₹11,500
=
₹20,000
```

---

# 60. Unattributed Spend Example

AA-003 Meta spend:

```text id="smp111"
₹8,000
```

Known attributed:

```text id="smp112"
₹7,500
```

Difference:

```text id="smp113"
₹500
```

---

# 61. Reconciliation Case

```text id="smp114"
Case:
REC-001

Type:
UNATTRIBUTED_SPEND

Entity:
AA-003

Expected:
₹8,000

Attributed:
₹7,500

Difference:
₹500

Status:
OPEN

Severity:
WARNING
```

---

# 62. Missing Campaign Mapping Cause

Suppose ₹500 belongs to new campaign not mapped.

Reason:

```text id="smp115"
MISSING_MAPPING
```

After campaign mapped and attribution recalculated:

```text id="smp116"
Difference:
₹0
```

Case:

```text id="smp117"
RESOLVED
```

---

# 63. Vendor Payable Reconciliation Example

RAM payable ledger:

```text id="smp118"
₹1,90,000
```

Open batch outstanding:

```text id="smp119"
RAM-RF-002:
₹1,90,000
```

Difference:

```text id="smp120"
₹0
```

Reconciled.

---

# 64. Vendor Payable Mismatch Example

Ledger says:

```text id="smp121"
₹1,90,000
```

Batch outstanding says:

```text id="smp122"
₹1,80,000
```

Difference:

```text id="smp123"
₹10,000
```

Create:

```text id="smp124"
VENDOR_PAYABLE_RECONCILIATION
```

case.

---

# 65. Duplicate UTR Example

Existing:

```text id="smp125"
UTR-ALPHA-001
```

Finance tries second Client Payment with same reference.

System should:

```text id="smp126"
Block or require duplicate review
```

Do not silently post.

---

# 66. Duplicate Idempotency Example

API request:

```text id="smp127"
POST vendor settlement SET-001
```

is retried.

Same idempotency key:

```text id="smp128"
vendor-settlement:SET-001:post
```

System returns existing transaction.

No second payment posting.

---

# 67. Wrong Client Payment Example

Finance posts:

```text id="smp129"
₹50,000
```

but actual:

```text id="smp130"
₹5,000
```

Correct history:

```text id="smp131"
TXN-030:
CLIENT_PAYMENT ₹50,000

TXN-031:
REVERSAL ₹50,000

TXN-032:
CLIENT_PAYMENT ₹5,000
```

Never edit TXN-030.

---

# 68. Unidentified Receipt Example

Bank receives:

```text id="smp132"
₹12,000
```

payer unknown.

Ledger:

```text id="smp133"
Dr COMPANY_BANK ₹12,000
Cr UNIDENTIFIED_RECEIPT_CLEARING ₹12,000
```

---

# 69. Receipt Later Identified

Later finance confirms:

```text id="smp134"
Client B
```

Classification transaction moves:

```text id="smp135"
UNIDENTIFIED_RECEIPT_CLEARING
→ CLIENT_B_FUNDS
₹12,000
```

Original receipt history remains.

---

# 70. Meta Sync Stale Example

AA-001:

```text id="smp136"
Last Status Sync:
15 minutes ago

Status:
ACTIVE
```

AA-003:

```text id="smp137"
Last Spend Sync:
3 hours ago
```

Configured threshold:

```text id="smp138"
30 minutes
```

AA-003 should show:

```text id="smp139"
STALE
```

not spend = zero.

---

# 71. Meta Auth Failure Example

MC-002 token requires reconnect.

Alert:

```text id="smp140"
META_AUTH_REQUIRED

Connection:
Ads Backup

Severity:
HIGH
```

Affected assets remain in database.

Do not delete them.

---

# 72. Account Restriction Alert

```text id="smp141"
Alert ID:
ALT-001

Type:
AD_ACCOUNT_RESTRICTED

Entity:
AA-002

Locked Exposure:
₹5,000

Severity:
HIGH

Status:
OPEN
```

---

# 73. Vendor Receivable Alert

```text id="smp142"
Alert:
ALT-002

Type:
VENDOR_RECEIVABLE_OPEN

Vendor:
RAM

Amount:
₹10,000

Age:
5 Days

Status:
OPEN
```

After receivable offset:

```text id="smp143"
Alert:
RESOLVED
```

---

# 74. Client Funding Gap Alert

```text id="smp144"
Alert:
ALT-003

Type:
CLIENT_UNDERFUNDED

Client:
Beta Commerce

Job:
JOB-002

Budget:
₹15,000

Client Funding:
₹10,000

Gap:
₹5,000
```

Agency funding may resolve operational gap, but client receivable remains separate.

---

# 75. Approval Example

Cross-client transfer:

```text id="smp145"
Client A → Client B

Amount:
₹3,000
```

Approval request:

```text id="smp146"
APR-001

Action:
CLIENT_TO_CLIENT_TRANSFER

Requested By:
Finance

Status:
PENDING
```

No ownership change yet.

---

# 76. Approval Completed

Admin approves:

```text id="smp147"
APR-001:
APPROVED
```

Then transaction posts.

---

# 77. Maker-Checker Example

Requested by:

```text id="smp148"
USR-002 Finance Manager
```

Approver:

```text id="smp149"
USR-001 Admin
```

Same user cannot approve if maker-checker required.

---

# 78. Sample Ledger Accounts

```text id="smp150"
1000 COMPANY_BANK_INR
Type: ASSET

2101 CLIENT_CLI001_FUNDS_INR
Type: LIABILITY

2102 CLIENT_CLI002_FUNDS_INR
Type: LIABILITY

2201 VENDOR_RAM_PAYABLE_INR
Type: LIABILITY

1201 VENDOR_RAM_RECEIVABLE_INR
Type: ASSET

1202 CLIENT_CLI002_RECEIVABLE_INR
Type: ASSET

2999 UNIDENTIFIED_RECEIPT_CLEARING_INR
Type: LIABILITY/CLEARING
```

---

# 79. Sample Ledger Transaction Register

```text id="smp151"
TXN-001
CLIENT_PAYMENT
Client A
₹20,000
POSTED

TXN-002
CLIENT_PAYMENT
Client B
₹10,000
POSTED

TXN-003
AGENCY_TEMP_CLIENT_FUNDING
Client B
₹5,000
POSTED / operational-linked

TXN-010
VENDOR_FUNDING
RAM
₹1,00,000
POSTED

TXN-011
VENDOR_REPAYMENT
RAM
₹40,000
POSTED

TXN-012
VENDOR_REPAYMENT
RAM
₹60,000
POSTED

TXN-013
VENDOR_OVERPAYMENT
RAM
₹10,000
POSTED

TXN-020
CLIENT_REFUND
Client A
₹5,000
POSTED
```

---

# 80. Sample Current Client Summary

## Client A

```text id="smp152"
Total Ads Funds Received:
₹20,000

Spend:
₹11,500

Current Available:
₹3,500

Locked:
₹0

Refunded:
₹5,000

Receivable:
₹0
```

Check:

```text id="smp153"
₹20,000
=
₹11,500
+
₹3,500
+
₹5,000
```

---

# 81. Client B Summary

```text id="smp154"
Client Funds:
₹10,000

Agency Temporary Funding:
₹5,000

Job Budget:
₹15,000

Client Receivable:
₹5,000
```

Important:

Agency funding is not Client B-owned merely because it funds Client B job.

---

# 82. Sample Current Vendor Summary

RAM:

```text id="smp155"
Historical Funding Batch 1:
₹1,00,000
Settled

Overpayment:
₹10,000
Recovered/Offset:
₹10,000

New Funding Batch:
₹2,00,000

Current Payable:
₹1,90,000

Current Receivable:
₹0
```

---

# 83. Sample Ad Account Summary

## AA-001

```text id="smp156"
Status:
ACTIVE

Current Client:
Alpha Digital

Tracked Remaining Client Funds:
₹0 / according to latest leftover resolution

Historical Spend:
₹11,500
```

## AA-002

```text id="smp157"
Status:
RESTRICTED

Locked:
₹5,000

Owner:
Client A
```

## AA-003

```text id="smp158"
Status:
ACTIVE

Client B-Owned Allocation:
₹10,000

Agency-Owned Allocation:
₹5,000
```

---

# 84. Sample Fund Lineage

Client A:

```text id="smp159"
CP-001 ₹20,000
│
├── Wallet ₹5,000
│
└── JOB-001 ₹15,000
     │
     └── AA-001 ₹15,000
          │
          ├── Meta Spend ₹11,500
          └── Leftover ₹3,500
               │
               └── Returned to Client Wallet
```

Then client wallet:

```text id="smp160"
₹8,500
```

Then refund:

```text id="smp161"
₹5,000
```

Final wallet:

```text id="smp162"
₹3,500
```

---

# 85. Sample Vendor Flow

```text id="smp163"
RAM Funding ₹1,00,000
↓
Vendor Payable ₹1,00,000
↓
Repayment ₹40,000
↓
Payable ₹60,000
↓
Repayment ₹60,000
↓
Payable ₹0
↓
Accidental Payment ₹10,000
↓
Vendor Receivable ₹10,000
↓
New Funding ₹2,00,000
↓
Explicit Offset ₹10,000
↓
New Payable ₹1,90,000
```

---

# 86. Sample Restricted Flow

```text id="smp164"
Client A Fund ₹5,000
↓
AA-002
↓
Account Restricted
↓
Locked ₹5,000
↓
Owner remains Client A
↓
Recovery / Refund
```

---

# 87. Sample Reconciliation Dashboard

```text id="smp165"
Open Cases:
3

Critical:
0

High:
1

Warning:
2

Total Unresolved INR:
₹10,500
```

Example cases:

```text id="smp166"
REC-001
Unattributed Spend
₹500

REC-002
Vendor Payable Mismatch
₹10,000

REC-003
Meta Data Stale
No financial amount
```

---

# 88. Sample Alert Center

```text id="smp167"
HIGH
AA-002 Restricted
₹5,000 Locked

HIGH
RAM Payable Mismatch
₹10,000

WARNING
AA-003 Spend Data Stale

WARNING
Client B Funding Gap
₹5,000
```

---

# 89. Sample Pending Approval Center

```text id="smp168"
APR-001
Client A → Client B Transfer
₹3,000

APR-002
Vendor Settlement
₹1,00,000

APR-003
Manual Adjustment
₹2,500
```

---

# 90. Sample Dashboard Financial Cards

```text id="smp169"
Client-Owned Current Funds:
₹18,500

Agency Free/Tracked Funds:
Example derived amount

Locked Funds:
₹5,000

Vendor Payable:
₹1,90,000

Vendor Receivable:
₹0

Client Receivable:
₹5,000

Refund Pending:
₹0

Unattributed Spend:
₹500
```

Exact totals should be calculated from canonical sample state.

---

# 91. Sample Data Freshness

```text id="smp170"
AA-001 Status:
Fresh

AA-001 Spend:
Fresh

AA-002 Status:
Fresh

AA-003 Spend:
Stale

MC-002:
Auth Required
```

---

# 92. Sample Audit Events

```text id="smp171"
AUD-001
Finance created Client A payment

AUD-002
System posted TXN-001

AUD-003
Ads Manager assigned JOB-001 to AA-001

AUD-004
System detected AA-002 restriction

AUD-005
Finance created RAM settlement

AUD-006
Admin approved RAM settlement

AUD-007
System created vendor receivable after overpayment
```

---

# 93. Sample Invalid Case — Cross Client Fund Use

Available:

```text id="smp172"
Client A Wallet:
₹5,000
```

User attempts:

```text id="smp173"
Allocate ₹5,000
to Client B JOB-002
```

Expected:

```text id="smp174"
BLOCK
```

Reason:

```text id="smp175"
OWNER_MISMATCH
```

Unless approved ownership transfer is completed first.

---

# 94. Sample Invalid Case — Negative Vendor Payable

RAM Payable:

```text id="smp176"
₹10,000
```

Payment:

```text id="smp177"
₹15,000
```

System must not create:

```text id="smp178"
Payable = -₹5,000
```

Correct:

```text id="smp179"
Payable:
₹0

Vendor Receivable:
₹5,000
```

---

# 95. Sample Invalid Case — Over Allocation

Client Wallet:

```text id="smp180"
₹10,000
```

Request:

```text id="smp181"
Allocate ₹12,000
```

Expected:

```text id="smp182"
INSUFFICIENT_AVAILABLE_FUNDS
```

No partial silent allocation unless user explicitly chooses partial amount.

---

# 96. Sample Invalid Case — Double Allocation

Available:

```text id="smp183"
₹10,000
```

Concurrent requests:

```text id="smp184"
Request A:
₹8,000

Request B:
₹8,000
```

Expected:

```text id="smp185"
One valid allocation succeeds.

Second fails/recalculates availability.
```

Total must not become ₹16,000.

---

# 97. Sample Invalid Case — Duplicate Settlement

Settlement:

```text id="smp186"
SET-001
```

already posted.

Retry comes with same idempotency key.

Expected:

```text id="smp187"
Return existing result.

Do not create second ledger transaction.
```

---

# 98. Sample Invalid Case — Spend Over Attribution

Meta spend:

```text id="smp188"
₹10,000
```

Internal attribution attempt:

```text id="smp189"
₹11,000
```

Expected:

```text id="smp190"
BLOCK / CRITICAL RECONCILIATION
```

---

# 99. Sample Invalid Case — Stale Meta Zero

Latest valid spend:

```text id="smp191"
₹8,000
```

Meta sync fails.

Expected:

```text id="smp192"
Keep last known ₹8,000
Mark STALE
```

Not:

```text id="smp193"
Spend = ₹0
```

---

# 100. Sample Invalid Case — Hard Delete Client

Client A has payments and ledger history.

User attempts delete.

Expected:

```text id="smp194"
BLOCK HARD DELETE
```

Allowed:

```text id="smp195"
CLOSE / ARCHIVE CLIENT
```

---

# 101. Sample Opening Balance

Legacy vendor payable:

```text id="smp196"
Vendor:
Legacy Vendor X

Outstanding:
₹75,000

As of:
2026-08-31
```

Create:

```text id="smp197"
OPENING_VENDOR_PAYABLE
₹75,000
```

Verification:

```text id="smp198"
PARTIALLY_VERIFIED
```

Do not fabricate old funding transactions.

---

# 102. Sample Unknown Owner

Legacy AD account tracked fund:

```text id="smp199"
₹20,000
```

Known owner:

```text id="smp200"
₹15,000 Client A
```

Unknown:

```text id="smp201"
₹5,000
```

Correct:

```text id="smp202"
Client A:
₹15,000

Unattributed:
₹5,000
```

Not:

```text id="smp203"
Agency:
₹5,000
```

unless confirmed.

---

# 103. Sample Seed Data Set

Recommended development seed:

```text id="smp204"
1 Organization

4 Users

4 Roles

1 Active Meta Connection

1 Broken/Auth-Required Connection

2 Business Portfolios

3 Ad Accounts

2 Clients

2 Client Jobs

2 Meta Campaigns

2 Client Payments

1 Agency Temporary Funding

1 Client Receivable

1 Vendor

2 Vendor Funding Batches

3 Vendor Settlements

1 Vendor Overpayment

1 Vendor Receivable

1 Vendor Receivable Offset

Multiple Ledger Transactions

Multiple Fund Lots

Multiple Fund Allocations

1 Restricted Ad Account

1 Locked Fund

1 Client Refund

3 Reconciliation Cases

4 Alerts

3 Approval Requests
```

---

# 104. Why This Seed Set Is Useful

It covers:

```text id="smp205"
Normal Client Flow

Partial Client Funding

Mixed Client/Agency Funding

Vendor Funding

Vendor Settlement

Vendor Overpayment

Vendor Receivable

Explicit Offset

Account Restriction

Locked Funds

Client Refund

Unattributed Spend

Stale Meta Data

Approval Workflow

Reconciliation
```

---

# 105. Sample Data Naming Rule

Use clear non-production names:

```text id="smp206"
Alpha Digital

Beta Commerce

RAM

Scaling Account 01
```

Never seed production environment with confusing real client records unless explicitly imported.

---

# 106. Environment Rule

Seed data should be enabled only in:

```text id="smp207"
LOCAL

DEVELOPMENT

STAGING
```

Production seed:

```text id="smp208"
System roles

permissions

required configuration
```

only.

---

# 107. Sample Data Integrity Check

After seed, automated validation should confirm:

```text id="smp209"
All ledger transactions balanced

No fund lot overallocated

No negative vendor payable

Receivable matches overpayment

Spend attribution <= spend

Locked fund totals correct

Client positions reconcile

Tenant IDs consistent

All FKs valid
```

---

# 108. Expected Client A Reconciliation

Using final sample state:

```text id="smp210"
Ads Fund Received:
₹20,000

Spend:
₹11,500

Refunded:
₹5,000

Available:
₹3,500

Difference:
₹0
```

---

# 109. Expected RAM Reconciliation

After second funding + offset:

```text id="smp211"
New Gross Funding:
₹2,00,000

Old Receivable Offset:
₹10,000

Current Payable:
₹1,90,000

Current Receivable:
₹0
```

Historical first batch:

```text id="smp212"
₹1,00,000
Fully Settled
```

---

# 110. Expected Locked Fund Reconciliation

AA-002 scenario:

```text id="smp213"
Allocated:
₹5,000

Spent:
₹0

Locked:
₹5,000

Difference:
₹0
```

Alternative partial-spend scenario:

```text id="smp214"
Allocated:
₹5,000

Spent:
₹3,200

Locked:
₹1,800

Difference:
₹0
```

---

# 111. Expected Shared Account Ownership

AA-003:

```text id="smp215"
Client B:
₹10,000

Agency:
₹5,000

Total:
₹15,000
```

No single-client owner field should replace this breakdown.

---

# 112. Example API-Friendly Sample Object

Conceptually:

```text id="smp216"
Client:
CLI-001

Current Funds:
{
  available: 3500,
  allocated: 0,
  locked: 0,
  refund_pending: 0
}

Historical:
{
  received: 20000,
  spent: 11500,
  refunded: 5000
}
```

Amounts here shown in rupees for readability.

Actual API should use clear minor-unit convention.

---

# 113. Actual Stored Minor Units

Example:

```text id="smp217"
₹20,000
=
2000000 paise
```

```text id="smp218"
₹3,500
=
350000 paise
```

---

# 114. Seed Data IDs

Development can use deterministic UUIDs so automated tests can reference fixed records.

Example:

```text id="smp219"
00000000-0000-0000-0000-000000000001
```

for organization in test environment.

Human-readable refs remain:

```text id="smp220"
CLI-0001
VEN-0001
JOB-0001
```

---

# 115. Sample Data Must Preserve Distinctions

Seed data should intentionally demonstrate:

```text id="smp221"
Payment ≠ Allocation

Allocation ≠ Spend

Client Funds ≠ Agency Funds

Vendor Funding ≠ Revenue

Vendor Payable ≠ Vendor Receivable

Locked ≠ Spent

Pending Refund ≠ Refunded

Meta Status Unknown ≠ Restricted

Alert ≠ Reconciliation Case
```

---

# 116. Sample Data Golden Rule

> **Sample data should behave exactly like production data. Every sample rupee must balance, every relationship must be valid, and every edge case should demonstrate the same rules the production system will enforce. Seed data is not decoration—it is an executable example of the business model.**
