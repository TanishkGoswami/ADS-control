# Permissions

## Overview

Ye document system ke permission model ko define karta hai.

System me sirf role-based access enough nahi hoga. Har important action ko granular permission ke through control kiya jayega.

Core model:

```text
USER
  ↓
ROLE
  ↓
PERMISSIONS
  ↓
RESOURCE SCOPE
  ↓
ALLOWED ACTION
```

Example:

```text
User:
Rahul

Role:
ADS_MANAGER

Permission:
VIEW_AD_ACCOUNT

Scope:
BP1
```

Rahul BP1 ke Ad Accounts dekh sakta hai, lekin necessarily BP2 ke nahi.

---

# 1. Permission Model

Permission structure:

```text
RESOURCE + ACTION
```

Examples:

```text
VIEW_CLIENT

CREATE_CLIENT

EDIT_CLIENT

VIEW_VENDOR

CREATE_VENDOR_SETTLEMENT

APPROVE_VENDOR_SETTLEMENT
```

Permission names uppercase snake case me standardized rahenge.

---

# 2. Permission Categories

Main categories:

```text
AUTH

DASHBOARD

META

CLIENT

VENDOR

FUND

LEDGER

REFUND

RECONCILIATION

ALERT

APPROVAL

REPORT

AUDIT

USER

ROLE

SETTINGS
```

---

# 3. Authentication Permissions

Basic authenticated access:

```text
LOGIN

LOGOUT

VIEW_OWN_PROFILE

EDIT_OWN_PROFILE
```

Password/security actions auth provider ke through handle honge.

---

# 4. Dashboard Permissions

```text
VIEW_DASHBOARD

VIEW_OPERATIONAL_DASHBOARD

VIEW_FINANCIAL_DASHBOARD

VIEW_MANAGEMENT_DASHBOARD
```

Different roles ko different dashboard widgets dikh sakte hain.

---

# 5. Meta Connection Permissions

```text
VIEW_META_CONNECTION

CREATE_META_CONNECTION

EDIT_META_CONNECTION

DISABLE_META_CONNECTION

RECONNECT_META_CONNECTION

TRIGGER_META_SYNC

VIEW_META_SYNC_HISTORY

VIEW_META_SYNC_ERRORS

MANAGE_META_TOKEN
```

`MANAGE_META_TOKEN` highly restricted permission hogi.

---

# 6. Business Portfolio Permissions

```text
VIEW_BUSINESS_PORTFOLIO

EDIT_BUSINESS_PORTFOLIO_METADATA

VIEW_PORTFOLIO_FINANCIAL_SUMMARY

VIEW_PORTFOLIO_ACCOUNTS

ARCHIVE_BUSINESS_PORTFOLIO
```

Meta-origin fields direct manual edit nahi hone chahiye unless specifically internal metadata ho.

---

# 7. Ad Account Permissions

```text
VIEW_AD_ACCOUNT

VIEW_AD_ACCOUNT_FINANCIALS

VIEW_AD_ACCOUNT_SPEND

VIEW_AD_ACCOUNT_ALLOCATIONS

VIEW_AD_ACCOUNT_STATUS_HISTORY

EDIT_AD_ACCOUNT_INTERNAL_METADATA

ASSIGN_AD_ACCOUNT_MANAGER

ARCHIVE_AD_ACCOUNT

REPORT_ACCOUNT_RESTRICTION

VIEW_LOCKED_FUNDS
```

---

# 8. Client Permissions

```text
VIEW_CLIENT

CREATE_CLIENT

EDIT_CLIENT

CLOSE_CLIENT

REOPEN_CLIENT

VIEW_CLIENT_FINANCIALS

VIEW_CLIENT_WALLET

VIEW_CLIENT_LEDGER

VIEW_CLIENT_AUDIT
```

---

# 9. Client Payment Permissions

```text
VIEW_CLIENT_PAYMENT

CREATE_CLIENT_PAYMENT

EDIT_CLIENT_PAYMENT_DRAFT

SUBMIT_CLIENT_PAYMENT

POST_CLIENT_PAYMENT

REVERSE_CLIENT_PAYMENT

VIEW_CLIENT_PAYMENT_PROOF
```

Posted payment edit permission intentionally nahi hoga.

---

# 10. Client Job Permissions

```text
VIEW_CLIENT_JOB

CREATE_CLIENT_JOB

EDIT_CLIENT_JOB

START_CLIENT_JOB

PAUSE_CLIENT_JOB

COMPLETE_CLIENT_JOB

CANCEL_CLIENT_JOB

ASSIGN_AD_ACCOUNT

MAP_META_CAMPAIGN

UNMAP_META_CAMPAIGN
```

---

# 11. Client Allocation Permissions

```text
VIEW_CLIENT_ALLOCATION

CREATE_CLIENT_ALLOCATION

EDIT_ALLOCATION_DRAFT

SUBMIT_CLIENT_ALLOCATION

APPROVE_CLIENT_ALLOCATION

REVERSE_CLIENT_ALLOCATION
```

---

# 12. Client Leftover Permissions

```text
VIEW_CLIENT_LEFTOVER

RETURN_LEFTOVER_TO_CLIENT_WALLET

ALLOCATE_LEFTOVER_TO_SAME_CLIENT_JOB

REQUEST_CROSS_CLIENT_TRANSFER

APPROVE_CROSS_CLIENT_TRANSFER

REQUEST_CLIENT_TO_AGENCY_TRANSFER

APPROVE_CLIENT_TO_AGENCY_TRANSFER

MARK_LEFTOVER_LOCKED

RESOLVE_LEFTOVER
```

---

# 13. Client Refund Permissions

```text
VIEW_CLIENT_REFUND

CREATE_CLIENT_REFUND

EDIT_REFUND_DRAFT

SUBMIT_CLIENT_REFUND

APPROVE_CLIENT_REFUND

MARK_REFUND_PAYMENT_PENDING

POST_CLIENT_REFUND

FAIL_CLIENT_REFUND

REVERSE_CLIENT_REFUND
```

---

# 14. Client Receivable Permissions

```text
VIEW_CLIENT_RECEIVABLE

CREATE_CLIENT_RECEIVABLE

SETTLE_CLIENT_RECEIVABLE

ADJUST_CLIENT_RECEIVABLE

WRITE_OFF_CLIENT_RECEIVABLE
```

Write-off should require elevated approval.

---

# 15. Vendor Permissions

```text
VIEW_VENDOR

CREATE_VENDOR

EDIT_VENDOR

CLOSE_VENDOR

REOPEN_VENDOR

VIEW_VENDOR_FINANCIALS

VIEW_VENDOR_LEDGER

VIEW_VENDOR_AUDIT
```

---

# 16. Vendor Funding Permissions

```text
VIEW_VENDOR_FUNDING

CREATE_VENDOR_FUNDING

EDIT_VENDOR_FUNDING_DRAFT

SUBMIT_VENDOR_FUNDING

POST_VENDOR_FUNDING

REVERSE_VENDOR_FUNDING

VIEW_VENDOR_FUNDING_PROOF
```

---

# 17. Vendor Funding Batch Permissions

```text
VIEW_VENDOR_FUNDING_BATCH

CREATE_VENDOR_FUNDING_BATCH

EDIT_VENDOR_FUNDING_BATCH_METADATA

MANUAL_VENDOR_BATCH_ALLOCATION

CLOSE_VENDOR_FUNDING_BATCH
```

Batch financially settled hone ke baad direct amount edit nahi hoga.

---

# 18. Vendor Settlement Permissions

```text
VIEW_VENDOR_SETTLEMENT

CREATE_VENDOR_SETTLEMENT

EDIT_VENDOR_SETTLEMENT_DRAFT

SUBMIT_VENDOR_SETTLEMENT

APPROVE_VENDOR_SETTLEMENT

POST_VENDOR_SETTLEMENT

FAIL_VENDOR_SETTLEMENT

REVERSE_VENDOR_SETTLEMENT
```

---

# 19. Vendor Overpayment Permissions

```text
VIEW_VENDOR_OVERPAYMENT

CREATE_VENDOR_OVERPAYMENT_REQUEST

APPROVE_VENDOR_OVERPAYMENT

VIEW_VENDOR_RECEIVABLE

RECOVER_VENDOR_RECEIVABLE

OFFSET_VENDOR_RECEIVABLE

WRITE_OFF_VENDOR_RECEIVABLE
```

---

# 20. Agency Fund Permissions

```text
VIEW_AGENCY_FUND

CREATE_AGENCY_FUND_ENTRY

ALLOCATE_AGENCY_FUND

USE_AGENCY_FUND_FOR_CLIENT

USE_AGENCY_FUND_FOR_VENDOR_SETTLEMENT

RECOVER_AGENCY_FUND

ADJUST_AGENCY_FUND
```

---

# 21. Fund Transfer Permissions

```text
VIEW_FUND_TRANSFER

CREATE_FUND_TRANSFER

SUBMIT_FUND_TRANSFER

APPROVE_FUND_TRANSFER

POST_FUND_TRANSFER

REVERSE_FUND_TRANSFER
```

Ownership-changing transfers should require stronger permissions.

---

# 22. Restricted Fund Permissions

```text
VIEW_RESTRICTED_ACCOUNT

VIEW_LOCKED_FUND

CREATE_RECOVERY_CASE

ASSIGN_RECOVERY_CASE

UPDATE_RECOVERY_CASE

UNLOCK_FUND

MARK_REFUND_PENDING

REQUEST_WRITE_OFF_LOCKED_FUND

APPROVE_LOCKED_FUND_WRITE_OFF
```

---

# 23. Ledger Permissions

```text
VIEW_LEDGER

VIEW_LEDGER_ACCOUNT

VIEW_LEDGER_TRANSACTION

CREATE_LEDGER_TRANSACTION_DRAFT

SUBMIT_LEDGER_TRANSACTION

POST_LEDGER_TRANSACTION

REVERSE_LEDGER_TRANSACTION
```

No permission:

```text
EDIT_POSTED_LEDGER_TRANSACTION
```

because direct edit allowed nahi hona chahiye.

---

# 24. Manual Adjustment Permissions

```text
CREATE_MANUAL_ADJUSTMENT

SUBMIT_MANUAL_ADJUSTMENT

APPROVE_MANUAL_ADJUSTMENT

POST_MANUAL_ADJUSTMENT

REVERSE_MANUAL_ADJUSTMENT
```

---

# 25. Write-Off Permissions

```text
REQUEST_WRITE_OFF

APPROVE_WRITE_OFF

POST_WRITE_OFF

REVERSE_WRITE_OFF
```

Write-off high-risk permission category hai.

---

# 26. Reconciliation Permissions

```text
VIEW_RECONCILIATION

CREATE_RECONCILIATION_CASE

ASSIGN_RECONCILIATION_CASE

ADD_RECONCILIATION_NOTE

MARK_TIMING_DIFFERENCE

CREATE_RECONCILIATION_ADJUSTMENT

RESOLVE_RECONCILIATION_CASE

REOPEN_RECONCILIATION_CASE
```

---

# 27. Alert Permissions

```text
VIEW_ALERT

ACKNOWLEDGE_ALERT

ASSIGN_ALERT

RESOLVE_ALERT

DISMISS_ALERT_NOTIFICATION
```

Dismissing notification underlying issue close nahi karega.

---

# 28. Approval Permissions

```text
VIEW_APPROVAL_QUEUE

APPROVE_FINANCIAL_TRANSACTION

REJECT_FINANCIAL_TRANSACTION

APPROVE_HIGH_VALUE_TRANSACTION

APPROVE_OWNERSHIP_CHANGE

APPROVE_WRITE_OFF

APPROVE_REVERSAL
```

Approval capability transaction-specific permission ke saath combined honi chahiye.

---

# 29. Report Permissions

```text
VIEW_OPERATIONAL_REPORTS

VIEW_FINANCIAL_REPORTS

VIEW_CLIENT_REPORTS

VIEW_VENDOR_REPORTS

VIEW_RECONCILIATION_REPORTS

EXPORT_REPORTS
```

---

# 30. Audit Permissions

```text
VIEW_AUDIT_LOG

VIEW_FINANCIAL_AUDIT

VIEW_USER_ACTIVITY

VIEW_LOGIN_HISTORY

EXPORT_AUDIT_LOG
```

Audit log records immutable hone chahiye.

---

# 31. User Management Permissions

```text
VIEW_USER

CREATE_USER

EDIT_USER

DISABLE_USER

SUSPEND_USER

REACTIVATE_USER

ASSIGN_ROLE

ASSIGN_RESOURCE_SCOPE
```

---

# 32. Role Management Permissions

```text
VIEW_ROLE

CREATE_ROLE

EDIT_ROLE

DISABLE_ROLE

ASSIGN_PERMISSION_TO_ROLE

REMOVE_PERMISSION_FROM_ROLE
```

---

# 33. Settings Permissions

```text
VIEW_SETTINGS

MANAGE_GENERAL_SETTINGS

MANAGE_FINANCIAL_SETTINGS

MANAGE_APPROVAL_SETTINGS

MANAGE_RECONCILIATION_SETTINGS

MANAGE_META_SETTINGS

MANAGE_ALERT_SETTINGS
```

---

# 34. Admin Default Permissions

Admin should normally have:

```text
All VIEW permissions

All CREATE permissions

All EDIT draft permissions

All APPROVE permissions

All POST permissions

All REVERSAL permissions

User management

Role management

Settings management
```

Exception:

Even Admin cannot directly edit/delete posted financial records.

---

# 35. Finance Default Permissions

Finance recommended permissions:

```text
VIEW_DASHBOARD

VIEW_CLIENT

VIEW_CLIENT_FINANCIALS

VIEW_CLIENT_WALLET

CREATE_CLIENT_PAYMENT

POST_CLIENT_PAYMENT

VIEW_VENDOR

VIEW_VENDOR_FINANCIALS

CREATE_VENDOR_FUNDING

POST_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

VIEW_VENDOR_RECEIVABLE

CREATE_CLIENT_REFUND

CREATE_FUND_TRANSFER

VIEW_LEDGER

VIEW_RECONCILIATION

CREATE_RECONCILIATION_CASE

VIEW_FINANCIAL_REPORTS
```

Approvals may depend on amount threshold.

---

# 36. Ads Manager Default Permissions

Recommended:

```text
VIEW_OPERATIONAL_DASHBOARD

VIEW_META_CONNECTION

VIEW_BUSINESS_PORTFOLIO

VIEW_AD_ACCOUNT

VIEW_AD_ACCOUNT_SPEND

VIEW_AD_ACCOUNT_ALLOCATIONS

REPORT_ACCOUNT_RESTRICTION

VIEW_CLIENT

CREATE_CLIENT_JOB

EDIT_CLIENT_JOB

ASSIGN_AD_ACCOUNT

MAP_META_CAMPAIGN

VIEW_CLIENT_ALLOCATION

VIEW_CLIENT_LEFTOVER

VIEW_LOCKED_FUNDS
```

No vendor settlement/posting access by default.

---

# 37. Viewer Default Permissions

Recommended:

```text
VIEW_DASHBOARD

VIEW_META_CONNECTION

VIEW_BUSINESS_PORTFOLIO

VIEW_AD_ACCOUNT

VIEW_CLIENT

VIEW_VENDOR
```

Financial visibility depends on assigned viewer policy.

No CREATE/EDIT/APPROVE/POST permissions.

---

# 38. Recommended Permission Matrix

| Permission Group   | Admin  | Finance        | Ads Manager      | Viewer        |
| ------------------ | ------ | -------------- | ---------------- | ------------- |
| Dashboard          | Full   | Finance        | Operational      | Read          |
| Meta Connections   | Manage | View           | View             | View          |
| Portfolio          | Full   | View           | Full Operational | View          |
| Ad Accounts        | Full   | Financial View | Operational      | View          |
| Clients            | Full   | Full           | Operational      | View          |
| Client Payments    | Full   | Create/Post    | No               | No            |
| Client Jobs        | Full   | View           | Create/Manage    | View          |
| Client Allocations | Full   | Full           | Request/View     | View          |
| Client Refunds     | Full   | Create/Post    | Request          | View          |
| Vendors            | Full   | Full           | Limited          | View/Limited  |
| Vendor Funding     | Full   | Create/Post    | No               | No            |
| Vendor Settlement  | Full   | Create         | No               | No            |
| Vendor Approval    | Yes    | Limited        | No               | No            |
| Agency Fund        | Full   | Full           | Limited View     | No            |
| Ledger             | Full   | Full           | Limited View     | Optional Read |
| Reconciliation     | Full   | Full           | Operational View | View          |
| Reports            | Full   | Full           | Operational      | Read          |
| Audit              | Full   | Limited        | Relevant         | No            |
| Users/Roles        | Full   | No             | No               | No            |
| Settings           | Full   | Limited        | No               | No            |

---

# 39. Resource Scope

Permission alone enough nahi hoga.

Example:

```text
User:
Rahul

Permission:
VIEW_AD_ACCOUNT

Scope:
BP1
```

Rahul sirf BP1 ke accounts dekh sakta hai.

---

# 40. Scope Types

Possible:

```text
GLOBAL

META_CONNECTION

BUSINESS_PORTFOLIO

AD_ACCOUNT

CLIENT

VENDOR

TEAM
```

---

# 41. Scope Inheritance

Example:

User has scope:

```text
Business Portfolio:
BP1
```

Then automatically access ho sakta hai:

```text
BP1 child Ad Accounts
```

according to permission.

---

# 42. No Reverse Inheritance

If user has access:

```text
AD1
```

it does not automatically mean user can access every account in BP1.

---

# 43. Client Scope

Example:

```text
User:
Client Manager A

Clients:
CLI-001
CLI-002
```

He/she can only view/manage assigned clients.

---

# 44. Vendor Scope

Finance user may be limited to selected vendors if required.

Example:

```text
Vendor Scope:
RAM
SHYAM
```

---

# 45. Financial Visibility Levels

Separate data visibility:

```text
NONE

SUMMARY

OPERATIONAL

FULL
```

---

# 46. NONE

User financial information nahi dekh sakta.

---

# 47. SUMMARY

User only high-level amount dekh sakta hai.

Example:

```text
Available Fund:
₹5,000
```

but detailed transaction history nahi.

---

# 48. OPERATIONAL

User dekh sakta hai:

```text
Campaign Allocation

Ad Spend

Available Ad Account Fund

Locked Fund
```

but detailed vendor/company ledger nahi.

---

# 49. FULL

Full financial detail:

```text
Transactions

Payables

Receivables

Vendor Funding

Agency Funds

Ledger Entries
```

---

# 50. Approval Amount Limits

Permission ke saath approval limit ho sakti hai.

Example:

```text
FINANCE

APPROVE_CLIENT_REFUND
Max Amount:
₹10,000
```

Admin:

```text
Max Amount:
Unlimited / Configured Higher Limit
```

---

# 51. Transaction Limits

Possible policy:

```text
Finance can create:
Up to ₹1,00,000

Above ₹1,00,000:
Requires Admin creation/approval
```

Configurable.

---

# 52. High-Risk Transaction Types

Regardless of amount, approval required:

```text
VENDOR_OVERPAYMENT

WRITE_OFF

CROSS_CLIENT_TRANSFER

CLIENT_TO_AGENCY_TRANSFER

MANUAL_ADJUSTMENT

TRANSACTION_REVERSAL
```

---

# 53. Maker-Checker Rule

For configured actions:

```text
Created By
!=
Approved By
```

Required.

---

# 54. Maker-Checker Example

Finance Rahul creates:

```text
Vendor Settlement:
₹50,000
```

Rahul cannot approve own transaction.

Admin or authorized Finance Manager approves.

---

# 55. Multi-Level Approval

Future support:

```text
Creator
↓
Finance Approval
↓
Admin Approval
↓
Posted
```

Useful for high-value transactions.

---

# 56. Approval Rejection

Approver can:

```text
APPROVE

REJECT

REQUEST_CHANGES
```

Rejected transaction does not affect ledger.

---

# 57. Edit After Approval

If material data changes:

```text
Amount

Vendor

Client

Source

Destination

Ownership
```

existing approval invalidated.

Transaction returns to:

```text
PENDING_APPROVAL
```

---

# 58. Non-Material Edit

Examples:

```text
Add Note

Add Attachment
```

may not invalidate approval depending on settings.

All changes still audited.

---

# 59. Posted Transaction Protection

Once:

```text
POSTED
```

No user can directly modify:

```text
Amount

Debit/Credit

Source

Destination

Owner
```

Correction requires reversal.

---

# 60. Archive Permission

Archiving entities should be separate from financial deletion.

Permissions:

```text
ARCHIVE_AD_ACCOUNT

CLOSE_CLIENT

CLOSE_VENDOR
```

Financial history remains.

---

# 61. Hard Delete Permissions

Production system should generally avoid hard delete permission for:

```text
Financial Transactions

Clients with transactions

Vendors with transactions

Ad Accounts with history
```

If hard delete exists for empty/draft records, highly restricted.

---

# 62. Draft Delete Permission

Draft transaction with no ledger effect may be deletable by creator/admin.

Example permission:

```text
DELETE_DRAFT_TRANSACTION
```

---

# 63. Audit Log Permission Rule

Audit logs cannot be modified by normal application users.

No:

```text
EDIT_AUDIT_LOG

DELETE_AUDIT_LOG
```

permissions should exist.

---

# 64. Meta Token Security

Raw token should never be returned through normal API.

Even user with:

```text
MANAGE_META_TOKEN
```

should generally see masked/connection state, not necessarily recover plaintext token.

---

# 65. Sensitive Vendor Details

Permissions may include:

```text
VIEW_VENDOR_PAYMENT_DETAILS
```

Separate from:

```text
VIEW_VENDOR
```

---

# 66. Sensitive Client Details

Possible:

```text
VIEW_CLIENT_CONTACT_DETAILS

VIEW_CLIENT_FINANCIAL_DETAILS
```

---

# 67. Export Permission

Exporting financial data is sensitive.

Separate:

```text
EXPORT_FINANCIAL_REPORTS
```

from:

```text
VIEW_FINANCIAL_REPORTS
```

---

# 68. Bulk Action Permissions

Future:

```text
BULK_ASSIGN_AD_ACCOUNT

BULK_EXPORT

BULK_UPDATE_METADATA
```

No broad bulk financial posting without strong controls.

---

# 69. Manual Sync Permission

Ads Manager may have:

```text
TRIGGER_META_SYNC
```

without:

```text
MANAGE_META_CONNECTION
```

---

# 70. Reconciliation Adjustment

Creating a case and posting adjustment are different permissions.

Example:

```text
CREATE_RECONCILIATION_CASE
```

does not imply:

```text
POST_MANUAL_ADJUSTMENT
```

---

# 71. Alert Resolution Permission

User may acknowledge alert but not resolve underlying case.

Example:

```text
ACKNOWLEDGE_ALERT
```

separate from:

```text
RESOLVE_RECONCILIATION_CASE
```

---

# 72. Recovery Case Permissions

```text
VIEW_RECOVERY_CASE

CREATE_RECOVERY_CASE

ASSIGN_RECOVERY_CASE

UPDATE_RECOVERY_CASE

CLOSE_RECOVERY_CASE
```

Closing may require financial issue resolved.

---

# 73. Resource Ownership Permission

Some records may allow creator-specific rights.

Example:

Ads Manager can edit own:

```text
DRAFT Client Job
```

but not another manager's job unless shared scope permits.

---

# 74. Permission Evaluation Order

Backend authorization should check:

```text
1. Is user authenticated?

2. Is user active?

3. Does user have permission?

4. Is resource inside user scope?

5. Is entity state compatible with action?

6. Is amount within user's limit?

7. Is approval required?

8. Is maker-checker rule satisfied?
```

---

# 75. Example Permission Evaluation

User attempts vendor settlement ₹20,000.

Check:

```text
Authenticated?
YES

Active?
YES

CREATE_VENDOR_SETTLEMENT?
YES

Vendor in scope?
YES

Amount within creation limit?
YES

Current transaction state valid?
YES
```

Then create settlement.

---

# 76. Approval Example

Same settlement posting requires:

```text
APPROVE_VENDOR_SETTLEMENT?
YES

Amount within approval limit?
YES

Approver != Creator?
YES
```

Then approval succeeds.

---

# 77. Unauthorized Response

Backend should return:

```text
403 FORBIDDEN
```

with safe reason such as:

```text
You do not have permission to approve this transaction.
```

No financial state change.

---

# 78. Permission Denial Audit

For highly sensitive actions, system may log:

```text
User

Attempted Permission

Entity

Timestamp

Result:
DENIED
```

---

# 79. Role Changes

When user's role changes:

Existing logged-in session permissions should refresh/revalidate promptly.

Do not rely on old frontend state.

---

# 80. Permission Caching

Permission caching allowed for performance.

But high-risk financial authorization should not trust stale long-lived cache.

---

# 81. Disabled User

If user is disabled:

All actions rejected regardless of old token/session.

---

# 82. Last Admin Protection

System should prevent:

```text
Disable last Admin
```

or removing all administrative access accidentally.

---

# 83. Default Deny Principle

If permission is not explicitly granted:

```text
DENY
```

Default should not be allow.

---

# 84. Backend Enforcement Rule

Frontend:

```text
Hide unauthorized button
```

for UX.

Backend:

```text
Reject unauthorized request
```

for security.

Both required.

---

# 85. Database-Level Protection

Where feasible:

```text
Tenant isolation

User scope

Sensitive data policies
```

should additionally be protected through PostgreSQL/Supabase RLS.

---

# 86. Multi-Tenant Rule

Future multi-company architecture:

User must have:

```text
organization_id
```

Every business record also belongs to organization.

Cross-organization access forbidden.

---

# 87. System Actor

Some records will be created automatically.

Actor:

```text
SYSTEM
```

Examples:

```text
Meta Sync

Automatic Alert

Automatic Restriction Detection

Scheduled Reconciliation
```

---

# 88. System Actor Permissions

Background workers should use narrowly scoped service credentials.

Do not give workers unlimited user-level access unless necessary.

---

# 89. API Service Permission

Meta sync service can:

```text
READ_META_API

UPSERT_META_ASSETS

CREATE_SNAPSHOTS

CREATE_SYNC_ALERTS
```

but does not necessarily need permission to settle vendors.

---

# 90. Financial Worker Permission

Reconciliation worker can:

```text
READ_LEDGER

READ_META_DATA

CREATE_RECONCILIATION_CASE
```

but should not automatically post financial adjustments unless explicitly designed later.

---

# 91. Human Approval Principle

Automation can detect:

```text
Mismatch

Overpayment

Locked Fund

Aging
```

but high-risk money ownership changes should remain human-approved in V1.

---

# 92. Recommended Admin Permission Set

```text
ALL_STANDARD_PERMISSIONS

MANAGE_USERS

MANAGE_ROLES

MANAGE_SETTINGS

MANAGE_META_TOKEN

APPROVE_HIGH_VALUE_TRANSACTION

APPROVE_WRITE_OFF

APPROVE_REVERSAL

VIEW_FULL_AUDIT
```

---

# 93. Recommended Finance Permission Set

```text
VIEW_FINANCIAL_DASHBOARD

VIEW_CLIENT_FINANCIALS

CREATE_CLIENT_PAYMENT

POST_CLIENT_PAYMENT

CREATE_VENDOR_FUNDING

POST_VENDOR_FUNDING

CREATE_VENDOR_SETTLEMENT

CREATE_CLIENT_REFUND

VIEW_VENDOR_RECEIVABLE

CREATE_FUND_TRANSFER

VIEW_LEDGER

VIEW_RECONCILIATION

CREATE_RECONCILIATION_CASE

EXPORT_FINANCIAL_REPORTS
```

High-risk approvals limited/configured.

---

# 94. Recommended Ads Manager Permission Set

```text
VIEW_OPERATIONAL_DASHBOARD

VIEW_META_CONNECTION

VIEW_BUSINESS_PORTFOLIO

VIEW_AD_ACCOUNT

VIEW_AD_ACCOUNT_SPEND

VIEW_CLIENT

CREATE_CLIENT_JOB

EDIT_CLIENT_JOB

ASSIGN_AD_ACCOUNT

MAP_META_CAMPAIGN

REPORT_ACCOUNT_RESTRICTION

VIEW_CLIENT_ALLOCATION

VIEW_LOCKED_FUNDS
```

---

# 95. Recommended Viewer Permission Set

```text
VIEW_DASHBOARD

VIEW_META_CONNECTION

VIEW_BUSINESS_PORTFOLIO

VIEW_AD_ACCOUNT

VIEW_CLIENT_SUMMARY

VIEW_VENDOR_SUMMARY

VIEW_ALLOWED_REPORTS
```

No mutation permissions.

---

# 96. Permission Naming Rule

Permission names:

```text
ACTION_RESOURCE
```

preferred.

Example:

```text
VIEW_VENDOR

CREATE_VENDOR

APPROVE_VENDOR_SETTLEMENT
```

Do not use inconsistent naming like:

```text
vendorCanPay

manageRam

fullFinance
```

---

# 97. Permission Documentation Rule

Every new feature should define:

```text
Who can view it?

Who can create it?

Who can edit draft?

Who can submit?

Who can approve?

Who can post?

Who can reverse?

What scope applies?
```

before implementation.

---

# 98. Permission Testing

Every critical API endpoint should test:

```text
Allowed role

Denied role

Wrong scope

Disabled user

Insufficient approval limit

Self-approval attempt

Wrong entity state
```

---

# 99. Financial Permission Testing

Critical tests:

```text
Ads Manager cannot post vendor settlement.

Viewer cannot create client payment.

Finance cannot exceed approval threshold.

Creator cannot self-approve when maker-checker enabled.

No role can directly edit posted ledger amount.

User outside BP scope cannot access its Ad Account.

Disabled user cannot perform actions.
```

---

# 100. Permission Golden Rule

> **Permissions must control not only what a user can see, but also what they can create, submit, approve, post, reverse and financially affect. Every sensitive action must be validated server-side against the user's permission, resource scope, transaction state and approval limit before any business or ledger change occurs.**
