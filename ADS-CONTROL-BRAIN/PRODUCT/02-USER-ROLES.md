# User Roles

## Overview

System me multiple internal users kaam karenge, lekin har user ko same level ka access nahi milna chahiye.

Kuch users sirf Ad Accounts aur campaign operations dekhenge, kuch financial entries create karenge, kuch approvals karenge, aur kuch sirf reports view karenge.

Isliye system me **Role-Based Access Control (RBAC)** implement kiya jayega.

Core principle:

> **A user should only have access to the data and actions required for their job.**

Initial system roles:

```text
ADMIN

FINANCE

ADS_MANAGER

VIEWER
```

Future me additional custom roles support kiye ja sakte hain.

---

# 1. Role vs Permission

Role ek permission group hai.

Example:

```text
Role:
FINANCE
```

iske andar permissions ho sakti hain:

```text
VIEW_FINANCIAL_DATA

CREATE_CLIENT_PAYMENT

CREATE_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

CREATE_REFUND
```

System ko ideally direct hardcoded role checks ke instead permission-based authorization use karna chahiye.

Example:

Avoid:

```text
if user.role == "ADMIN"
```

Preferred:

```text
if user.hasPermission("APPROVE_VENDOR_SETTLEMENT")
```

Isse future me custom roles easy rahenge.

---

# 2. Initial Roles

Initial V1 roles:

```text
ADMIN

FINANCE

ADS_MANAGER

VIEWER
```

Optional future:

```text
SUPER_ADMIN

FINANCE_MANAGER

SENIOR_ADS_MANAGER

AUDITOR

OPERATIONS_MANAGER

CUSTOM_ROLE
```

---

# 3. ADMIN

Admin highest normal business-level role hoga.

Admin responsibilities:

```text
System Configuration

User Management

Role Management

Financial Approvals

High-Risk Adjustments

Vendor Overpayment Approval

Transaction Reversal Approval

Cross-Client Transfer Approval

Agency Conversion Approval

Meta Connection Management

Reconciliation Resolution

Audit Access
```

---

# 4. Admin Access

Admin generally access kar sakta hai:

```text
Dashboard

Meta Accounts

Business Portfolios

Ad Accounts

Clients

Vendors

Finance

Ledger

Reconciliation

Alerts

Approvals

Reports

Audit Logs

Users

Settings
```

---

# 5. Admin Financial Powers

Admin can potentially:

```text
Approve Vendor Settlement

Approve Vendor Overpayment

Approve Large Refund

Approve Client-to-Agency Transfer

Approve Cross-Client Transfer

Approve Manual Adjustment

Approve Write-Off

Approve Transaction Reversal
```

Actual permissions configurable honi chahiye.

---

# 6. Admin Restrictions

Admin bhi posted ledger history directly edit/delete nahi karega.

Even Admin must use:

```text
REVERSAL

ADJUSTMENT

CORRECTION TRANSACTION
```

Financial audit trail sab roles par apply hota hai.

---

# 7. FINANCE

Finance role ka primary focus financial operations hai.

Responsibilities:

```text
Client Payments

Client Wallets

Vendor Funding

Vendor Settlements

Refunds

Receivables

Payables

Fund Transfers

Reconciliation

Transaction Proofs
```

---

# 8. Finance Can View

Finance should generally see:

```text
Client Financial Data

Vendor Financial Data

Ad Account Financial Summary

Agency Funds

Locked Funds

Ledger

Reconciliation

Reports

Financial Alerts
```

---

# 9. Finance Can Create

Potential permissions:

```text
CREATE_CLIENT_PAYMENT

CREATE_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

CREATE_CLIENT_REFUND

CREATE_FUND_TRANSFER

CREATE_ADJUSTMENT_REQUEST

CREATE_RECONCILIATION_NOTE
```

---

# 10. Finance Approval Limits

Finance may approve normal transactions under configured limits.

Example:

```text
₹0 – ₹10,000
Finance approval sufficient

₹10,001+
Admin approval required
```

This is configurable business policy.

---

# 11. Finance Cannot Automatically

Depending on policy, Finance should not independently:

```text
Write Off Large Receivable

Approve Own High-Risk Settlement

Delete Posted Transaction

Change Meta Connection Credentials

Manage All User Permissions
```

---

# 12. ADS MANAGER

Ads Manager ka primary purpose advertising operations monitor/manage karna hai.

Responsibilities:

```text
View Meta Connections

View Business Portfolios

View Ad Accounts

View Account Status

Monitor Spend

Monitor Campaign Mapping

Assign Client Jobs

Report Restriction

Request Fund Allocation

Monitor Low Balance

View Relevant Client Allocations
```

---

# 13. Ads Manager Financial Access

Ads Manager ko full financial ledger access dena necessary nahi.

Depending on company policy, Ads Manager dekh sakta hai:

```text
Ad Account Available Fund

Client Campaign Allocation

Spend

Locked Fund

Low Balance
```

But may not see:

```text
Company-Wide Vendor Funding

Vendor Receivables

Agency Bank-Level Balances

Sensitive Settlement Data
```

unless permission granted.

---

# 14. Ads Manager Can Create

Potential:

```text
CREATE_CLIENT_JOB

ASSIGN_AD_ACCOUNT

MAP_META_CAMPAIGN

REQUEST_CLIENT_ALLOCATION

REPORT_ACCOUNT_RESTRICTION

CREATE_OPERATIONAL_NOTE
```

---

# 15. Ads Manager Cannot Normally

```text
Create Vendor Funding

Post Vendor Settlement

Approve Refund

Write Off Balance

Create High-Risk Manual Adjustment

Manage User Roles

Edit Posted Ledger Transaction
```

---

# 16. VIEWER

Viewer read-only user hai.

Use cases:

```text
Management viewing

Team member observation

Temporary access

Reporting access
```

Viewer koi financial or operational write action nahi karega.

---

# 17. Viewer Access

Depending on assigned scope:

```text
Dashboard

Ad Account View

Client Summary

Vendor Summary

Reports

Alerts
```

read-only.

---

# 18. Viewer Cannot

```text
Create

Edit

Delete

Approve

Reverse

Transfer

Refund

Settle
```

financial or operational records.

---

# 19. SUPER ADMIN Future Role

Future multi-tenant or system-level architecture me:

```text
SUPER_ADMIN
```

platform-level control ke liye use ho sakta hai.

Responsibilities:

```text
Tenant Management

System-Level Configuration

Role Templates

Critical Recovery

Global Audit
```

V1 me required nahi unless multi-company support start se build ho.

---

# 20. AUDITOR Future Role

Auditor:

```text
Read Financial Records

Read Ledger

Read Audit Logs

Read Reconciliation Cases

Export Reports
```

but cannot modify transactions.

Useful for internal/external audit.

---

# 21. OPERATIONS MANAGER Future Role

Possible responsibilities:

```text
Manage Ads Managers

Assign Accounts

Review Account Health

Review Client Jobs

Handle Operational Alerts
```

without full finance permissions.

---

# 22. Role Scope

Role ke saath scope bhi important hai.

Example:

Ads Manager Rahul ko sirf:

```text
BP1

BP2
```

access ho.

Another manager:

```text
BP3

BP4
```

handle kare.

Therefore:

```text
ROLE
+
RESOURCE SCOPE
```

support useful hoga.

---

# 23. Resource Scope Types

Possible:

```text
ALL

META_CONNECTION

BUSINESS_PORTFOLIO

AD_ACCOUNT

CLIENT

TEAM
```

Example:

```text
User:
Rahul

Role:
ADS_MANAGER

Scope:
BP1, BP2
```

---

# 24. Client Scope

Specific account manager sirf assigned clients view kare.

Example:

```text
User:
Manager A

Clients:
Client A
Client B
Client C
```

Optional V1/future feature.

---

# 25. Financial Data Visibility Levels

Not every role ko same financial detail dikhani chahiye.

Possible levels:

```text
NONE

SUMMARY

OPERATIONAL

FULL
```

Example:

Ads Manager:

```text
Financial Access:
OPERATIONAL
```

Can see:

```text
Available Ad Account Fund

Campaign Allocation

Spend
```

but not detailed vendor settlement records.

---

# 26. Sensitive Financial Fields

Potential sensitive fields:

```text
Bank Account Details

Payment Account Details

Full Transaction References

Vendor Banking Details

Internal Agency Balances

Receivable Write-Off Reasons
```

Permission-specific visibility required.

---

# 27. Permission Categories

Permissions ko categories me organize karna chahiye.

```text
AUTH

META

CLIENT

VENDOR

FINANCE

RECONCILIATION

APPROVAL

REPORT

AUDIT

SYSTEM
```

---

# 28. Meta Permissions

Examples:

```text
VIEW_META_CONNECTIONS

MANAGE_META_CONNECTIONS

TRIGGER_META_SYNC

VIEW_PORTFOLIOS

VIEW_AD_ACCOUNTS

EDIT_INTERNAL_AD_ACCOUNT_DATA

ARCHIVE_AD_ACCOUNT
```

---

# 29. Client Permissions

Examples:

```text
VIEW_CLIENT

CREATE_CLIENT

EDIT_CLIENT

CLOSE_CLIENT

VIEW_CLIENT_FINANCE

CREATE_CLIENT_PAYMENT

CREATE_CLIENT_JOB

EDIT_CLIENT_JOB

ALLOCATE_CLIENT_FUND

REQUEST_CLIENT_REFUND
```

---

# 30. Vendor Permissions

Examples:

```text
VIEW_VENDOR

CREATE_VENDOR

EDIT_VENDOR

CLOSE_VENDOR

VIEW_VENDOR_FINANCE

CREATE_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

VIEW_VENDOR_RECEIVABLE
```

---

# 31. Financial Permissions

Examples:

```text
VIEW_LEDGER

VIEW_ALL_FINANCIALS

CREATE_FUND_TRANSFER

CREATE_MANUAL_ADJUSTMENT

CREATE_REFUND

POST_TRANSACTION

REVERSE_TRANSACTION
```

---

# 32. Approval Permissions

Examples:

```text
APPROVE_VENDOR_SETTLEMENT

APPROVE_VENDOR_OVERPAYMENT

APPROVE_CLIENT_REFUND

APPROVE_CROSS_CLIENT_TRANSFER

APPROVE_CLIENT_TO_AGENCY_TRANSFER

APPROVE_MANUAL_ADJUSTMENT

APPROVE_WRITE_OFF

APPROVE_REVERSAL
```

---

# 33. Reconciliation Permissions

Examples:

```text
VIEW_RECONCILIATION

CREATE_RECONCILIATION_CASE

ASSIGN_RECONCILIATION_CASE

RESOLVE_RECONCILIATION_CASE

CREATE_RECONCILIATION_ADJUSTMENT
```

---

# 34. Report Permissions

Examples:

```text
VIEW_REPORTS

EXPORT_REPORTS

VIEW_FINANCIAL_REPORTS

VIEW_MANAGEMENT_REPORTS
```

---

# 35. Audit Permissions

Examples:

```text
VIEW_AUDIT_LOG

VIEW_LOGIN_HISTORY

VIEW_TRANSACTION_HISTORY

EXPORT_AUDIT_DATA
```

---

# 36. System Permissions

Examples:

```text
MANAGE_USERS

MANAGE_ROLES

MANAGE_PERMISSIONS

MANAGE_SYSTEM_SETTINGS

MANAGE_FINANCIAL_SETTINGS

MANAGE_APPROVAL_RULES
```

---

# 37. Maker-Checker Model

Sensitive financial actions ke liye:

```text
Maker
=
Transaction create karta hai
```

and:

```text
Checker
=
Transaction approve karta hai
```

High-risk actions me:

```text
Maker ≠ Checker
```

rule implement kiya ja sakta hai.

---

# 38. Example Maker-Checker

Finance user Rahul creates:

```text
Vendor Settlement:
₹1,00,000
```

System:

```text
PENDING_APPROVAL
```

Admin Dev approves.

Then settlement can proceed/post.

---

# 39. Self-Approval Rule

Configurable:

```text
ALLOW_SELF_APPROVAL = false
```

for:

```text
Large Vendor Settlement

Overpayment

Write-Off

Reversal

Manual Adjustment
```

---

# 40. Approval Thresholds

Permissions amount-sensitive ho sakti hain.

Example:

```text
FINANCE

Can approve up to:
₹10,000
```

Admin:

```text
No normal configured limit
```

or higher threshold.

---

# 41. Transaction Creation vs Posting

Separate permissions useful:

```text
CREATE_TRANSACTION

POST_TRANSACTION
```

User transaction prepare kar sakta hai but final ledger me post nahi.

---

# 42. Draft Rights

Ads/Finance staff draft create kar sakte hain.

Draft edit allowed.

Once submitted/approved:

permissions stricter ho jayengi.

---

# 43. Posted Transaction Rules

No role should directly:

```text
Edit Posted Amount

Delete Posted Transaction
```

Financial correction always controlled flow se.

---

# 44. Reversal Permissions

Only selected roles:

```text
FINANCE_MANAGER

ADMIN
```

reversal request/approve kar saken.

---

# 45. Write-Off Permissions

Write-off high-risk action hai.

Default:

```text
ADMIN
```

approval required.

---

# 46. Cross-Client Transfer Permission

Because fund ownership change hota hai:

```text
REQUEST_CROSS_CLIENT_TRANSFER

APPROVE_CROSS_CLIENT_TRANSFER
```

separate permissions honi chahiye.

---

# 47. Client-to-Agency Transfer Permission

Separate:

```text
REQUEST_CLIENT_TO_AGENCY_TRANSFER

APPROVE_CLIENT_TO_AGENCY_TRANSFER
```

---

# 48. Vendor Overpayment Permission

Normal user accidentally vendor overpayment create kar sakta hai.

System should:

```text
Detect Excess
```

Then either:

```text
BLOCK
```

or:

```text
REQUIRE APPROVAL
```

Only elevated user approve.

---

# 49. Meta Token Permission

Meta access token highly sensitive hai.

Only:

```text
ADMIN
```

or dedicated integration role should manage token.

Other users should never see raw token.

---

# 50. Password Visibility

No user—including Admin—should be able to retrieve user passwords.

Authentication provider handles credentials securely.

---

# 51. Payment Details Visibility

Vendor bank/payment details may only be visible to:

```text
FINANCE

ADMIN
```

Ads Manager should not necessarily see them.

---

# 52. Client Sensitive Data

Client personal/contact information should be permission-scoped as appropriate.

---

# 53. Audit Log Access

Users should not be able to edit Audit Logs.

Audit logs:

```text
APPEND / SYSTEM GENERATED
```

and read-only.

---

# 54. User Activity Tracking

Important actions capture:

```text
User ID

Role at Time

Action

Entity

IP Address if available

Timestamp

Result
```

---

# 55. Role Changes

If user role changes:

Old transactions retain:

```text
Created By User ID
```

and optionally role snapshot at action time.

---

# 56. User Deactivation

If employee leaves:

```text
User Status:
DISABLED
```

Historical records remain linked.

Never delete user if financial actions exist.

---

# 57. Disabled User

Disabled user:

```text
Cannot Login

Cannot Create Actions

Cannot Approve
```

Past audit remains.

---

# 58. User Suspension

Possible:

```text
ACTIVE

SUSPENDED

DISABLED
```

Suspension useful for temporary access block.

---

# 59. Last Admin Protection

System should avoid:

```text
Removing/deactivating last active Admin
```

without replacement.

---

# 60. Role Deletion

Role used by users should not be deleted blindly.

Prefer:

```text
INACTIVE
```

or migration to another role.

---

# 61. Custom Role Future Support

Example:

```text
FINANCE_EXECUTIVE
```

Permissions:

```text
View Clients
Add Payments
Add Vendor Funding
Cannot Approve Settlements
```

Custom permissions architecture should support this.

---

# 62. Default Role Matrix

High-level:

| Feature                     | Admin | Finance           | Ads Manager      | Viewer          |
| --------------------------- | ----- | ----------------- | ---------------- | --------------- |
| Dashboard                   | Full  | Finance           | Operational      | Read            |
| Meta Accounts               | Full  | View              | Full Operational | View            |
| Clients                     | Full  | Full              | Operational      | View            |
| Client Payments             | Full  | Create/Edit       | Limited View     | View if allowed |
| Client Jobs                 | Full  | View              | Create/Manage    | View            |
| Vendors                     | Full  | Full              | Limited          | View if allowed |
| Vendor Funding              | Full  | Create            | No               | View if allowed |
| Vendor Settlement           | Full  | Create            | No               | No              |
| Vendor Overpayment Approval | Yes   | Limited/No        | No               | No              |
| Ledger                      | Full  | Full              | Limited/No       | Read if allowed |
| Refunds                     | Full  | Create            | Request          | View            |
| Reconciliation              | Full  | Full              | Operational      | View            |
| Audit Logs                  | Full  | Limited           | Own/Relevant     | No/Limited      |
| User Management             | Full  | No                | No               | No              |
| Settings                    | Full  | Limited Financial | No               | No              |

Exact matrix dedicated `PRODUCT/03-PERMISSIONS.md` me detail hogi.

---

# 63. Dashboard Visibility by Role

## Admin

See everything:

```text
Accounts

Clients

Vendors

Financials

Alerts

Approvals

Audit
```

## Finance

Focus:

```text
Client Funds

Vendor Payable

Vendor Receivable

Refunds

Reconciliation
```

## Ads Manager

Focus:

```text
Ad Accounts

Client Jobs

Spend

Low Balance

Restrictions
```

## Viewer

Configured read-only summaries.

---

# 64. Notification Routing by Role

Example:

```text
AD_ACCOUNT_RESTRICTED
→ Ads Manager + Admin
```

```text
VENDOR_OVERPAYMENT
→ Finance + Admin
```

```text
RECONCILIATION_MISMATCH
→ Finance + Admin
```

```text
META_TOKEN_EXPIRED
→ Admin
```

---

# 65. Assigned User Overrides

Alert may additionally go to:

```text
Assigned Account Manager

Assigned Client Manager

Recovery Owner

Reconciliation Owner
```

---

# 66. Data Scope Example

User:

```text
Rahul
```

Role:

```text
ADS_MANAGER
```

Assigned:

```text
Ads Pro / BP1
```

He can view/manage:

```text
BP1 and child Ad Accounts
```

but not necessarily:

```text
BP2
```

---

# 67. Finance Scope Example

Finance staff may have:

```text
ALL_CLIENTS

ALL_VENDORS
```

but not:

```text
MANAGE_META_CONNECTION
```

---

# 68. Admin Scope

Usually:

```text
ALL
```

within company/tenant.

---

# 69. Multi-Tenant Future

If system later supports multiple companies:

Every user belongs to:

```text
Organization / Tenant
```

Role applies inside tenant.

Example:

```text
Company A Admin
```

cannot access:

```text
Company B
```

RLS must enforce tenant isolation.

---

# 70. Principle of Least Privilege

Every role should receive minimum required permissions.

Avoid:

```text
Everyone = Admin
```

especially because financial data involved hai.

---

# 71. Server-Side Enforcement

Frontend button hide karna security nahi hai.

Every API request must validate:

```text
Authentication

Permission

Resource Scope

Transaction State
```

server-side.

---

# 72. RLS Enforcement

Database level par bhi sensitive tenant/resource access ke liye RLS use ki ja sakti hai.

Backend authorization and DB security complement each other.

---

# 73. Permission Denied Behavior

Unauthorized action:

```text
403 Forbidden
```

No partial transaction.

Optional audit:

```text
UNAUTHORIZED_ACTION_ATTEMPT
```

for sensitive operations.

---

# 74. Role Change Audit

Track:

```text
Old Role

New Role

Changed By

Changed At
```

---

# 75. Permission Change Audit

Track:

```text
Permission Added

Permission Removed

Role

Changed By
```

---

# 76. High-Risk Action Audit

Always audit:

```text
Vendor Settlement

Overpayment

Write-Off

Reversal

Manual Adjustment

Cross-Client Transfer

Client-to-Agency Conversion

Refund
```

---

# 77. Emergency Access

Future optional:

```text
BREAK_GLASS_ACCESS
```

for emergency Admin action.

Must require:

```text
Reason

Short Expiry

Full Audit
```

Not V1 requirement.

---

# 78. Read vs Manage Distinction

Every module ideally separates:

```text
VIEW

CREATE

EDIT

APPROVE

ARCHIVE
```

permissions.

Example:

```text
VIEW_VENDOR
```

does not imply:

```text
CREATE_VENDOR_SETTLEMENT
```

---

# 79. Edit vs Financial Edit

Normal profile fields:

```text
Vendor Phone

Client Name

Notes
```

can be editable.

Financial posted fields:

```text
Amount

Ledger Effect
```

cannot be directly editable.

---

# 80. Operational vs Financial Permission

Ads Manager may edit:

```text
Job Status

Ad Account Assignment
```

but not:

```text
Posted Client Payment
```

Finance may edit drafts of payments but not campaign targeting.

---

# 81. Role Design Golden Rules

System should enforce:

```text
1. No user gets more access than required.

2. Financial actions require explicit permissions.

3. High-risk financial actions can require approval.

4. Posted transactions cannot be directly edited by any role.

5. User deactivation must preserve history.

6. Raw Meta credentials are highly restricted.

7. Frontend permissions must also be enforced server-side.

8. Resource scope must be respected.

9. Role changes must be audited.

10. Sensitive actions must preserve creator and approver identity.
```

---

# 82. Initial Recommended Role Model

For V1:

```text
ADMIN
├── Full business access
├── Financial approvals
├── User management
└── Settings


FINANCE
├── Client financials
├── Vendor financials
├── Ledger operations
├── Refunds
└── Reconciliation


ADS_MANAGER
├── Meta asset visibility
├── Client jobs
├── Campaign mapping
├── Spend monitoring
└── Account issue reporting


VIEWER
└── Read-only configured access
```

---

# 83. User Role Golden Rule

> **Access should be based on responsibility, not convenience. The system must ensure that operational users can perform their work without gaining unnecessary financial control, while finance and administrative users receive the authority required to manage money with proper approval and audit safeguards.**
