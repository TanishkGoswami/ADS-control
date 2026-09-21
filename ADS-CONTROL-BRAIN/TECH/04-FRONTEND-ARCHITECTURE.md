# Frontend Architecture

## Overview

Ye document Ads Control system ke frontend architecture ko define karta hai.

Frontend ka role hai:

```text id="fea001"
System data clearly present karna

Users ko safe actions perform karne dena

Operational issues visible banana

Financial states understandable banana

Backend workflows trigger karna

Realtime changes surface karna
```

Frontend financial source of truth nahi hoga.

Core principle:

> **The frontend may display and request financial actions, but it must never become the authority that determines balances, ownership, approvals or ledger postings.**

---

# 1. Frontend Technology

Recommended:

```text id="fea002"
Next.js

TypeScript

App Router

Tailwind CSS

shadcn/ui

TanStack Query

TanStack Table

React Hook Form

Zod
```

---

# 2. Frontend Architecture Style

Use:

```text id="fea003"
Feature-oriented frontend
+
Server-first data loading
+
Client-side interactivity where required
```

Avoid:

```text id="fea004"
Everything as Client Component

One giant global state store

Business logic duplicated from backend
```

---

# 3. High-Level Frontend Flow

```text id="fea005"
Browser
↓
Next.js
↓
Authenticated Layout
↓
Page / Feature
↓
NestJS API
↓
Canonical Backend State
```

For realtime hints:

```text id="fea006"
Supabase Realtime / Event Signal
↓
Frontend
↓
Invalidate Query
↓
Refetch API
```

---

# 4. Recommended Folder Structure

```text id="fea007"
apps/web/
├── app/
├── components/
├── features/
├── lib/
├── hooks/
├── providers/
├── services/
├── types/
├── styles/
└── middleware.ts
```

---

# 5. App Router Structure

Suggested:

```text id="fea008"
app/
├── (auth)/
│   ├── login/
│   └── callback/
│
├── (dashboard)/
│   ├── dashboard/
│   ├── meta/
│   ├── clients/
│   ├── vendors/
│   ├── finance/
│   ├── monitoring/
│   ├── reports/
│   ├── team/
│   ├── audit/
│   └── settings/
│
├── api/
├── error.tsx
├── loading.tsx
├── not-found.tsx
└── layout.tsx
```

---

# 6. Route Groups

Use route groups to separate:

```text id="fea009"
Authentication UI

Authenticated Application UI
```

without changing URL unnecessarily.

---

# 7. Root Layout

Root layout responsibilities:

```text id="fea010"
Global CSS

Theme

Fonts

Providers

Global error boundary

Application metadata
```

---

# 8. Dashboard Layout

Authenticated layout should include:

```text id="fea011"
Sidebar

Top Navigation

Organization Context

Global Search

Notifications

User Menu

Page Content
```

---

# 9. Sidebar Sections

Recommended:

```text id="fea012"
Dashboard

Meta Accounts

Clients

Vendors

Finance

Monitoring

Reports

Team

Audit

Settings
```

---

# 10. Permission-Aware Sidebar

Sidebar item should appear only when user has relevant internal permission.

Example:

```text id="fea013"
Viewer without AUDIT_VIEW
```

does not see:

```text id="fea014"
Audit
```

But frontend hiding is not security.

Backend still enforces permissions.

---

# 11. Layout Permission Rule

UI should use permission context for:

```text id="fea015"
Navigation

Buttons

Tabs

Columns

Actions
```

but never assume UI restriction is sufficient authorization.

---

# 12. Server Components

Prefer Server Components for:

```text id="fea016"
Initial page load

Read-only detail pages

Layout data

Summary cards

Static metadata
```

where practical.

---

# 13. Client Components

Use when interaction requires:

```text id="fea017"
Form state

Dialogs

Filters

Realtime updates

Drag/drop

Interactive tables

Charts

Optimistic UI
```

---

# 14. Avoid `"use client"` Everywhere

A page does not become client-side merely because one button is interactive.

Split:

```text id="fea018"
Server Page
+
Client Action Component
```

---

# 15. Example

```text id="fea019"
Client Detail Page
├── Server-rendered summary
├── Server-loaded current data
└── Client-side refund/action dialog
```

---

# 16. Data Access Rule

Frontend should access business data through:

```text id="fea020"
NestJS API
```

not directly through PostgreSQL.

---

# 17. Direct Supabase Usage

Frontend may use Supabase for:

```text id="fea021"
Authentication

Controlled realtime subscription
```

and limited signed-storage workflows.

Financial tables should not be mutated directly.

---

# 18. API Client

Create central:

```text id="fea022"
ApiClient
```

Responsibilities:

```text id="fea023"
Base URL

Authentication header/token

Request ID handling

Error parsing

JSON parsing

Timeout

API response typing
```

---

# 19. Do Not Scatter Fetch Calls

Bad:

```text id="fea024"
fetch('/api...')
```

in dozens of unrelated components.

Prefer:

```text id="fea025"
clientService

vendorService

financeService

metaService
```

using shared API client.

---

# 20. API Service Structure

Possible:

```text id="fea026"
services/
├── api-client.ts
├── clients.ts
├── vendors.ts
├── finance.ts
├── meta.ts
├── alerts.ts
└── reports.ts
```

---

# 21. Authentication Flow

```text id="fea027"
Login
↓
Supabase Auth
↓
Session/JWT
↓
Next.js
↓
NestJS API
```

---

# 22. Session Handling

Frontend should centrally manage:

```text id="fea028"
Logged-in state

Token refresh

Logout

Session expiry
```

---

# 23. Session Failure

If session expires:

```text id="fea029"
Stop protected requests

Redirect/re-authenticate

Preserve safe intended route where appropriate
```

---

# 24. Authorization Context

Frontend may load:

```text id="fea030"
Current User

Roles

Permissions

Resource Scopes

Financial Visibility Level
```

from backend.

---

# 25. Permission Context

Recommended provider/hook:

```text id="fea031"
usePermissions()
```

Examples:

```text id="fea032"
can('CLIENT_VIEW')

can('VENDOR_SETTLEMENT_CREATE')
```

---

# 26. Permission Is Not Hardcoded by Role

Avoid:

```text id="fea033"
if role === "ADMIN"
```

throughout UI.

Prefer permission checks.

---

# 27. Role Can Be Displayed

Role useful for:

```text id="fea034"
UI labels

Admin screens
```

But permission engine determines action availability.

---

# 28. Financial Visibility

Frontend should honor backend visibility:

```text id="fea035"
NONE

SUMMARY

OPERATIONAL

FULL
```

Example:

Ads Manager may see:

```text id="fea036"
Client allocation

Spend

Remaining operational amount
```

but not:

```text id="fea037"
Company bank balance

Vendor receivable
```

---

# 29. Never Hide Sensitive Data Only With CSS

Do not fetch full confidential data then visually hide it.

Backend should avoid returning fields user cannot access.

---

# 30. Data Fetching Strategy

Use combination:

```text id="fea038"
Server-side initial fetch

TanStack Query for interactive client data
```

---

# 31. Server Fetch

Good for:

```text id="fea039"
Initial page

Detail summary

Stable read
```

---

# 32. TanStack Query

Good for:

```text id="fea040"
Tables

Pagination

Filtering

Realtime invalidation

Manual refresh

Mutation follow-up
```

---

# 33. Query Key Design

Consistent hierarchy:

```text id="fea041"
['clients']

['clients', clientId]

['clients', clientId, 'ledger']

['vendors', vendorId]

['meta', 'accounts', filters]
```

---

# 34. Tenant Context in Query

If UI supports organization switching:

organization must be part of relevant query key.

Example:

```text id="fea042"
['org', orgId, 'clients']
```

---

# 35. Query Cache Is Not Truth

TanStack Query cache can become stale.

Financial action confirmation must use latest backend validation.

---

# 36. Stale Time

Use different stale times per data type.

Example:

```text id="fea043"
Reference data:
longer

Alerts:
short

Meta status:
short

Ledger:
invalidate after mutations
```

---

# 37. Avoid Polling Everything

Use:

```text id="fea044"
Realtime signals

Focused polling

Manual refresh

Query invalidation
```

instead of every component polling every five seconds.

---

# 38. Realtime Pattern

Recommended:

```text id="fea045"
Realtime event received
↓
Identify affected query
↓
Invalidate query
↓
Fetch canonical API state
```

---

# 39. Do Not Trust Realtime Payload Alone

Realtime event can say:

```text id="fea046"
Vendor updated
```

Frontend then reloads canonical vendor state.

---

# 40. Mutation Pattern

Example:

```text id="fea047"
User submits refund
↓
API mutation
↓
Backend response
↓
Show success
↓
Invalidate relevant queries
```

---

# 41. Financial Optimistic Updates

Avoid optimistic balance mutation for high-risk finance.

Bad:

```text id="fea048"
Immediately subtract ₹50,000 from UI wallet
before server confirms
```

Prefer:

```text id="fea049"
Submitting...
↓
Server success
↓
Refetch canonical amount
```

---

# 42. Safe Optimistic Updates

Can be used for low-risk UI state such as:

```text id="fea050"
Mark notification locally read
```

if backend semantics support it.

---

# 43. Loading States

Every data surface needs:

```text id="fea051"
Loading

Empty

Error

Success
```

states.

---

# 44. Skeletons

Use skeletons for:

```text id="fea052"
Dashboard cards

Tables

Detail summaries
```

instead of layout jumping.

---

# 45. Empty State

Should explain:

```text id="fea053"
No records exist
```

versus:

```text id="fea054"
You do not have permission
```

versus:

```text id="fea055"
Data could not be loaded
```

---

# 46. Unknown vs Zero UI

Critical financial/UI rule:

```text id="fea056"
₹0
```

means verified zero.

```text id="fea057"
—
Unknown
```

means value unavailable.

Never display unknown as zero.

---

# 47. Stale Meta Data UI

Example:

```text id="fea058"
Spend: ₹50,000

Last sync: 2h ago

STALE
```

Do not visually present it as live/current without warning.

---

# 48. Freshness Component

Reusable:

```text id="fea059"
<DataFreshnessBadge />
```

States:

```text id="fea060"
Fresh

Aging

Stale

Unknown
```

---

# 49. Financial Amount Component

Reusable:

```text id="fea061"
<Money />
```

Responsibilities:

```text id="fea062"
Minor-unit conversion

Currency formatting

Negative display policy

Unknown handling
```

---

# 50. Amount Conversion

API:

```text id="fea063"
amountMinor: "2000000"
currency: "INR"
```

UI displays:

```text id="fea064"
₹20,000.00
```

or business-configured precision.

---

# 51. Do Not Calculate Money With Float

Frontend display conversion should use:

```text id="fea065"
BigInt / safe decimal utility
```

not floating-point arithmetic for canonical calculations.

---

# 52. UI Calculations

Frontend may calculate presentation-only values:

```text id="fea066"
Percentage

Chart ratio

Display subtotal
```

but backend remains authoritative.

---

# 53. Balance Component

Never accept arbitrary balance value created by UI state.

It should render backend-provided derived values.

---

# 54. Status Components

Reusable:

```text id="fea067"
<MetaAccountStatus />

<FinancialStatus />

<ReconciliationStatus />

<ApprovalStatus />
```

---

# 55. Status Color Consistency

Example policy:

```text id="fea068"
Green:
Healthy / resolved

Amber:
Attention / pending

Red:
Critical / blocked

Gray:
Unknown / archived
```

Exact visual design centralized.

---

# 56. Avoid Red Everywhere

Financial app can become visually noisy.

Severity color should represent actual importance.

---

# 57. Tooltips

Use for unfamiliar concepts:

```text id="fea069"
Vendor Receivable

Locked Funds

Funding Gap

Unattributed Spend
```

---

# 58. Tables

Core application is table-heavy.

Use:

```text id="fea070"
TanStack Table
```

with backend data.

---

# 59. Server-Side Pagination

Tables request:

```text id="fea071"
page/cursor

limit

sort

filters
```

Backend returns bounded results.

---

# 60. Table URL State

Important filters should live in URL query parameters.

Example:

```text id="fea072"
/clients?status=active&page=2
```

Benefits:

```text id="fea073"
Shareable links

Browser back/forward

Reload persistence
```

---

# 61. Cursor Pagination UI

Can still display:

```text id="fea074"
Next

Previous
```

even if backend uses cursor.

---

# 62. Large Ledger Table

Do not render thousands of DOM rows.

Use pagination/virtualization if needed.

---

# 63. Column Visibility

Users may customize non-sensitive columns.

Sensitive columns still controlled by permissions.

---

# 64. Table Export

Export uses backend.

Do not construct large finance exports only from current browser rows.

---

# 65. Global Search

Search bar can surface:

```text id="fea075"
Client

Vendor

Ad Account

Job

Transaction
```

---

# 66. Search Result Design

Each result should identify:

```text id="fea076"
Entity type

Name/reference

Relevant context
```

Example:

```text id="fea077"
AD1
Ad Account
Main Portfolio
```

---

# 67. Forms

Recommended:

```text id="fea078"
React Hook Form
+
Zod
```

---

# 68. Form Layers

Form validation:

```text id="fea079"
Required fields

Formatting

Basic amount checks
```

Backend still validates domain rules.

---

# 69. Form Error Mapping

Backend returns:

```text id="fea080"
field errors
```

or business error.

UI maps appropriately.

---

# 70. Example

User requests:

```text id="fea081"
₹10,000 refund
```

Backend says:

```text id="fea082"
INSUFFICIENT_AVAILABLE_FUNDS
```

UI displays business message near amount/action.

---

# 71. Confirmation Dialog

High-risk actions need explicit confirmation.

Examples:

```text id="fea083"
Post Vendor Settlement

Refund Client

Ownership Transfer

Write-Off
```

---

# 72. Confirmation Should Show Consequences

Example:

```text id="fea084"
Vendor settlement:
₹30,000

Current payable:
₹20,000

Excess receivable:
₹10,000
```

before final submit.

---

# 73. But Backend Recalculates

UI preview is informational.

Server recalculates at post time.

---

# 74. Preview Endpoint

For complex actions, use backend:

```text id="fea085"
POST /vendor-settlements/preview
```

or equivalent.

---

# 75. Preview Is Not Reservation Unless Explicit

Previewing:

```text id="fea086"
₹20,000 payable
```

does not lock payable by default.

Final post may differ.

---

# 76. State Changed Warning

If backend detects changed state:

```text id="fea087"
FINANCIAL_STATE_CHANGED
```

UI should:

```text id="fea088"
Refresh preview

Ask user to review again
```

---

# 77. Double Submit Protection

Frontend:

```text id="fea089"
Disable submit after click
```

plus backend idempotency.

Frontend alone is insufficient.

---

# 78. Idempotency Key

Financial action form generates stable key for submission attempt.

On network retry:

reuse same key.

---

# 79. New Intent

If user changes amount after failed/abandoned request:

generate new idempotency key.

---

# 80. Approval UI

Approval Center shows:

```text id="fea090"
Requested action

Requester

Amount

Reason

Entity

Risk

Created time
```

---

# 81. Approval Decision

Actions:

```text id="fea091"
Approve

Reject
```

with optional/required note.

---

# 82. Maker-Checker UI

If current user requested transaction:

approval button should be disabled/hidden where maker-checker prevents self-approval.

Backend still enforces.

---

# 83. Approval Changed Warning

If underlying request became invalid:

show:

```text id="fea092"
Request changed / no longer executable
```

Do not blindly post old approval.

---

# 84. Dashboard Page

Dashboard should be optimized separately.

Sections:

```text id="fea093"
KPIs

Meta Health

Financial Exposure

Client Summary

Vendor Summary

Spend

Reconciliation

Alerts

Approvals
```

---

# 85. Dashboard API

Prefer one/few aggregate endpoints.

Avoid:

```text id="fea094"
30 components
=
30 API requests
```

---

# 86. Dashboard Cards

Examples:

```text id="fea095"
Client-Owned Funds

Agency Available

Locked Funds

Vendor Payable

Vendor Receivable

Unresolved Differences
```

---

# 87. KPI Context

Every card should indicate:

```text id="fea096"
Currency

As-of time

State vs period
```

where relevant.

---

# 88. Multi-Currency UI

Do not show:

```text id="fea097"
Total Funds: 1,00,000
```

if values contain INR + USD without conversion policy.

Display separately.

---

# 89. Account Tree

Meta hierarchy UI:

```text id="fea098"
Connection
└── Portfolio
    └── Ad Account
```

---

# 90. Same Account Multiple Paths

UI must support same canonical Ad Account appearing under multiple access relationships.

Do not imply duplicates.

---

# 91. Account Tree Row

Display:

```text id="fea099"
Alias

Meta Name

Status

Freshness

Assigned Client/Jobs

Spend
```

depending on view.

---

# 92. Financial Ownership in Account Tree

Do not show one:

```text id="fea100"
Owner
```

field for shared accounts.

Use:

```text id="fea101"
3 Fund Owners
```

or drill-down.

---

# 93. Ad Account Detail

Recommended tabs:

```text id="fea102"
Overview

Financials

Clients / Jobs

Campaigns

Spend

Status History

Reconciliation

Audit
```

---

# 94. Client Detail

Tabs:

```text id="fea103"
Overview

Payments

Wallet

Jobs

Allocations

Spend

Leftovers

Locked

Refunds

Receivables

Ledger

Timeline

Audit
```

---

# 95. Vendor Detail

Tabs:

```text id="fea104"
Overview

Funding

Batches

Settlements

Payables

Receivables

Recoveries

Ledger

Statement

Timeline

Audit
```

---

# 96. Lazy Tab Loading

Do not load all detail tabs on initial page.

Fetch tab data when needed.

---

# 97. Preserve Tab in URL

Example:

```text id="fea105"
/clients/CLI-001?tab=ledger
```

for shareability.

---

# 98. Ledger Screen

Should support:

```text id="fea106"
Date filters

Account filters

Transaction type

Entity

Currency

Status
```

---

# 99. Ledger Row

Display:

```text id="fea107"
Transaction Reference

Date

Type

Entity

Amount

Status

Description
```

Detailed debit/credit entries on expand/detail page.

---

# 100. Ledger Must Not Have Edit Button

Posted transaction:

```text id="fea108"
View

Reverse
```

where authorized.

Not:

```text id="fea109"
Edit
```

---

# 101. Reverse Action

Reverse should open controlled workflow.

UI clearly states:

```text id="fea110"
Original transaction will remain in history.
A reversal transaction will be created.
```

---

# 102. Fund Lineage UI

Useful visualization:

```text id="fea111"
Payment
↓
Fund Lot
↓
Job
↓
Ad Account
↓
Spend / Leftover / Locked
```

---

# 103. Do Not Render Huge Graph by Default

Use expandable hierarchy/tree.

---

# 104. Reconciliation Center

Main filters:

```text id="fea112"
Type

Severity

Status

Age

Assigned User

Currency
```

---

# 105. Reconciliation Case Page

Show:

```text id="fea113"
Expected

Observed

Difference

Source Data

Reason

Timeline

Evidence

Resolution
```

---

# 106. Difference Label

Use:

```text id="fea114"
Unresolved Difference
```

not:

```text id="fea115"
Loss
```

unless confirmed.

---

# 107. Alert Center

Show:

```text id="fea116"
Severity

Alert Type

Entity

Age

Owner

Status
```

---

# 108. Alert vs Reconciliation

UI should visually distinguish.

Alert:

```text id="fea117"
Something needs attention
```

Reconciliation case:

```text id="fea118"
Data/financial truth currently disagrees
```

---

# 109. Dismissing Alert

Must not imply:

```text id="fea119"
Issue resolved
```

Use explicit:

```text id="fea120"
Acknowledge

Snooze

Resolve
```

depending on permissions.

---

# 110. Realtime Alerts

New critical alerts can show:

```text id="fea121"
Toast

Notification badge
```

but user can always inspect Alert Center.

---

# 111. Notification Center

Notification != alert.

Notifications can represent:

```text id="fea122"
Approval requested

Report ready

Sync completed
```

---

# 112. Monitoring Page

Show:

```text id="fea123"
Meta Connection Health

Sync Runs

Stale Data

Queue-related operational state

Recent Meta Errors
```

---

# 113. Meta Sync Status

Display domains separately:

```text id="fea124"
Assets:
Fresh

Status:
Fresh

Spend:
Stale
```

not one global:

```text id="fea125"
Synced
```

---

# 114. Manual Sync UI

User selects:

```text id="fea126"
Refresh Status

Refresh Spend

Full Sync
```

according to permission.

---

# 115. Manual Sync Feedback

After request:

```text id="fea127"
Queued
```

then:

```text id="fea128"
Running

Success

Partial

Failed
```

---

# 116. Avoid Blocking Spinner

Do not keep user on modal until 10-minute backfill completes.

Create background job UI.

---

# 117. Sync Run Page

Show:

```text id="fea129"
Type

Started

Status

Progress

Records

Errors

Retry
```

---

# 118. Progress Accuracy

If backend cannot know exact percentage:

display:

```text id="fea130"
Processing...
2,450 records processed
```

rather than fake:

```text id="fea131"
73%
```

---

# 119. Reports UI

Report filters:

```text id="fea132"
Date

Client

Vendor

Account

Currency

Status
```

---

# 120. Large Export

User requests export.

UI shows:

```text id="fea133"
Generating...
```

Then notification:

```text id="fea134"
Report ready
```

---

# 121. Audit UI

Audit records are read-only.

Filters:

```text id="fea135"
Actor

Action

Entity

Date

Module
```

---

# 122. Audit Detail

Display safe metadata.

Do not expose secrets.

---

# 123. Settings UI

Separate:

```text id="fea136"
Organization Settings

Financial Rules

Meta Integration

Approval Rules

Users & Permissions

System Config
```

depending on user role.

---

# 124. Dangerous Settings

Examples:

```text id="fea137"
Cross-client transfers

Overpayment policy

Write-off permissions
```

should have:

```text id="fea138"
Clear warnings

Approval if required

Audit
```

---

# 125. Responsive Strategy

Primary usage:

```text id="fea139"
Desktop
```

because data-heavy operations.

Still support:

```text id="fea140"
Tablet

Basic mobile viewing
```

---

# 126. Mobile Actions

High-risk financial posting can remain supported only if UX is safe.

Do not compress complex settlement form into unusable mobile screen.

---

# 127. Responsive Tables

On small screens:

```text id="fea141"
Priority columns

Expandable detail

Cards
```

rather than horizontal chaos.

---

# 128. Accessibility

Required:

```text id="fea142"
Keyboard navigation

Focus states

ARIA labels

Semantic form labels

Sufficient contrast
```

---

# 129. Do Not Encode Status Only by Color

Use:

```text id="fea143"
Color + Label + Icon where useful
```

Example:

```text id="fea144"
● Restricted
```

---

# 130. Dialog Focus

Modal must:

```text id="fea145"
Trap focus

Return focus

Support Escape where safe
```

---

# 131. Confirmation Accessibility

Buttons must clearly state action:

```text id="fea146"
Post ₹30,000 Settlement
```

better than:

```text id="fea147"
Yes
```

---

# 132. Error Boundaries

Next.js route-level error boundaries should prevent one component error from breaking whole application.

---

# 133. Global Error

Unexpected error screen:

```text id="fea148"
Something went wrong.

Request ID: ...
```

with retry.

---

# 134. Financial Mutation Unknown Outcome

Special handling.

If network fails after submit:

Do not immediately say:

```text id="fea149"
Settlement failed
```

if server result unknown.

Use:

```text id="fea150"
Unable to confirm result.
Checking transaction status...
```

then query by idempotency key/reference.

---

# 135. Idempotency Recovery UI

Flow:

```text id="fea151"
Submit
↓
Network timeout
↓
GET status by operation/idempotency key
↓
Posted?
├── yes → show success
└── no → safe retry
```

---

# 136. Offline Handling

Financial writes should not be queued locally for automatic later posting.

If offline:

```text id="fea152"
Block submit
```

and preserve form draft locally only if safe.

---

# 137. Why No Offline Auto-Post

Financial state may change while user offline.

Backend must validate fresh state.

---

# 138. Draft Forms

Low-risk drafts can be:

```text id="fea153"
local storage

session storage
```

with caution around sensitive data.

---

# 139. Sensitive Form Data

Do not persist:

```text id="fea154"
Bank details

Secrets

Sensitive proofs
```

in browser storage unnecessarily.

---

# 140. State Management

Do not introduce Redux by default.

Use:

```text id="fea155"
Server state:
TanStack Query

Form state:
React Hook Form

UI state:
React state/context

Auth/permissions:
Providers
```

---

# 141. Global State

Use only for truly global:

```text id="fea156"
Current organization

Theme

Sidebar state

User permission context
```

---

# 142. Zustand

Can be introduced for specific complex client UI state if needed.

Not required initially.

---

# 143. URL Is State

Use URL for:

```text id="fea157"
Filters

Pagination

Tabs

Search
```

where shareable/navigation-relevant.

---

# 144. Form Is State

Do not put every form input in global store.

---

# 145. Design System

Create reusable primitives.

Examples:

```text id="fea158"
Money

StatusBadge

EntityLink

DataFreshnessBadge

RiskBadge

PageHeader

EmptyState

DataTable

FilterBar
```

---

# 146. Entity Link

Reusable links:

```text id="fea159"
Client Reference

Vendor Reference

Ad Account Alias

Transaction Ref
```

---

# 147. Entity Reference Pattern

Example display:

```text id="fea160"
Alpha Digital
CLI-0001
```

---

# 148. Money Breakdown Component

For multi-owner state:

```text id="fea161"
Client A      ₹10,000
Client B       ₹5,000
Agency         ₹2,000
```

better than one unexplained total.

---

# 149. Financial Summary Component

Reusable sections:

```text id="fea162"
Current

Historical

Outstanding

Pending
```

avoid mixing them.

---

# 150. Pending vs Posted UI

Clearly distinguish.

Example:

```text id="fea163"
Vendor settlement:
Pending Approval
```

must not reduce displayed canonical payable.

---

# 151. Reserved Amount

May display separately:

```text id="fea164"
Posted Payable: ₹1,00,000

Reserved for pending settlement: ₹30,000

Unreserved Exposure: ₹70,000
```

if business model uses reservations.

---

# 152. Tooltip Definitions

Definitions should match glossary.

Avoid different teams inventing terms.

---

# 153. Client Wallet UI

Show:

```text id="fea165"
Available

Reserved

Allocated

Locked

Refund Pending
```

with clear non-overlapping buckets.

---

# 154. Total Owned

Can show:

```text id="fea166"
Current Client-Owned Funds
```

with breakdown.

---

# 155. Client Receivable

Display separately from wallet.

Never:

```text id="fea167"
Wallet = -₹5,000
```

to represent receivable.

---

# 156. Vendor Financial UI

Show separately:

```text id="fea168"
Payable

Receivable
```

even when both exist.

---

# 157. Net Vendor Position

Can be secondary:

```text id="fea169"
Net Exposure
```

but not replace gross payable/receivable.

---

# 158. Vendor Overpayment UI

Example:

```text id="fea170"
Payable before payment: ₹20,000

Payment: ₹30,000

Settled payable: ₹20,000

Vendor receivable created: ₹10,000
```

---

# 159. Locked Fund UI

Display:

```text id="fea171"
Owner

Ad Account

Original Locked

Recovered

Remaining

Age
```

---

# 160. Locked Does Not Mean Lost

Wording:

```text id="fea172"
Locked / Unavailable
```

not:

```text id="fea173"
Lost
```

until explicitly resolved as loss/write-off.

---

# 161. Funding Gap UI

Show:

```text id="fea174"
Known Spend

Known Allocation

Funding Gap
```

Do not silently mark gap as agency-funded.

---

# 162. Unattributed UI

Highlight:

```text id="fea175"
Unattributed
```

and provide resolution action.

---

# 163. Reconciliation Difference

Use signed + explanatory display.

Example:

```text id="fea176"
Expected ₹10,000

Observed ₹9,500

Short by ₹500
```

---

# 164. Client Job UI

Separate:

```text id="fea177"
Budget

Client Funding

Agency Temporary Funding

Spend

Remaining
```

---

# 165. Budget Is Not Wallet

Do not label:

```text id="fea178"
Budget ₹20,000
```

as:

```text id="fea179"
Balance ₹20,000
```

---

# 166. Meta Account UI

Separate sections:

```text id="fea180"
Meta Operational Data

Internal Client Assignments

Financial Allocations
```

---

# 167. Avoid One Blended Card

Do not mix:

```text id="fea181"
Meta balance

Client wallet

Vendor payable
```

in one unlabeled financial card.

---

# 168. Data Source Labels

Where ambiguity exists, show:

```text id="fea182"
Source:
Meta

Source:
Internal Ledger

Source:
Allocation Model
```

---

# 169. Historical "As Of"

Reports/detail should indicate:

```text id="fea183"
As of Sep 17, 2026 15:30
```

where relevant.

---

# 170. Timezone

UI default:

```text id="fea184"
Organization/User timezone
```

but Meta daily spend should retain account-date semantics.

---

# 171. Meta Spend Date Tooltip

Could explain:

```text id="fea185"
Spend date follows Ad Account reporting timezone.
```

---

# 172. Date Range Picker

Standard component reused across:

```text id="fea186"
Dashboard

Reports

Spend

Ledger
```

---

# 173. Default Ranges

Examples:

```text id="fea187"
Today

Yesterday

7 Days

30 Days

Custom
```

---

# 174. Financial State vs Period Metrics

UI should distinguish:

```text id="fea188"
Current Vendor Payable
```

from:

```text id="fea189"
Vendor Repayments This Month
```

---

# 175. Charts

Charts for:

```text id="fea190"
Spend trends

Locked aging

Reconciliation aging
```

should always have tabular/detail fallback.

---

# 176. Avoid Misleading Charts

Do not graph:

```text id="fea191"
client payments as revenue
```

unless business/accounting definition explicitly supports it.

---

# 177. Action Menu

Entity actions can use:

```text id="fea192"
⋯
```

but high-risk actions should not be buried ambiguously.

---

# 178. Destructive Actions

Use distinct visual treatment for:

```text id="fea193"
Archive

Cancel

Reverse

Write-Off
```

---

# 179. No Delete for Historical Finance

UI should not expose delete button for posted financial records.

---

# 180. Archive Action

Show consequences:

```text id="fea194"
This client will become operationally inactive.
Financial history will remain.
```

---

# 181. Global Command/Search Palette

Can support:

```text id="fea195"
Go to Client

Open Vendor

Find Ad Account

Create Client
```

according to permission.

---

# 182. Avoid High-Risk Commands in Palette Without Confirmation

No one-step:

```text id="fea196"
Pay Vendor
```

from command palette.

---

# 183. Breadcrumbs

Useful for deep paths:

```text id="fea197"
Meta Accounts
>
AD1
>
Reconciliation
```

---

# 184. Page Header

Reusable:

```text id="fea198"
Title

Reference

Status

Primary Action

Secondary Menu
```

---

# 185. Detail Header Example

```text id="fea199"
Alpha Digital

CLI-0001

ACTIVE

[Add Payment]
[More]
```

---

# 186. Finance Actions

Only display when backend capability/permission allows.

---

# 187. Backend Capability Response

Useful pattern:

```text id="fea200"
capabilities: {
  canRefund: true,
  canTransfer: false
}
```

for entity-specific state.

---

# 188. Why Capability Response

Permission alone may say user can refund generally, but client current state may block it.

---

# 189. Backend Still Revalidates

Capabilities are UI hints.

Final POST validates again.

---

# 190. Error Toast vs Inline Error

Toast:

```text id="fea201"
Report generated
```

Inline/form:

```text id="fea202"
Insufficient funds
```

Critical persistent issue:

```text id="fea203"
Page banner
```

---

# 191. Avoid Toast-Only Critical Errors

User may miss them.

---

# 192. Connection Health Banner

Example:

```text id="fea204"
Meta connection requires reauthorization.
Spend data may be stale.
```

---

# 193. Global System Banner

Use for:

```text id="fea205"
Meta outage

Maintenance

Major degraded service
```

---

# 194. Do Not Block Finance UI for Meta Outage

Banner + stale indicators sufficient unless workflow specifically depends on fresh Meta data.

---

# 195. Refresh Button

Should indicate:

```text id="fea206"
Refresh Internal Data
```

versus:

```text id="fea207"
Sync from Meta
```

These are different actions.

---

# 196. Manual Meta Sync Permission

Only authorized users.

---

# 197. Reconnect Meta UI

Admin-only flow.

Never display raw token.

---

# 198. Credential UI

Show:

```text id="fea208"
Connected

Needs Reconnect

Permissions Healthy
```

not secret/token values.

---

# 199. File Upload UI

For proofs:

```text id="fea209"
Drag/drop

Upload progress

Preview metadata

Remove draft
```

---

# 200. Posted Proof

After financial posting:

attachment removal may require controlled replacement/supersede flow.

---

# 201. Audit Link

High-risk transaction detail should include:

```text id="fea210"
View Audit Trail
```

---

# 202. Timeline Component

Useful for:

```text id="fea211"
Client

Vendor

Ad Account

Reconciliation Case
```

---

# 203. Timeline Events

Examples:

```text id="fea212"
Payment Posted

Funds Allocated

Spend Detected

Account Restricted

Refund Completed
```

---

# 204. Timeline Is Derived

Events should link to canonical records.

---

# 205. Frontend Performance

Focus on:

```text id="fea213"
Initial bundle

Large tables

Repeated requests

Unnecessary rerenders
```

---

# 206. Code Splitting

Next.js automatically helps, but heavy charts/editors should be lazy-loaded.

---

# 207. Do Not Bundle Admin-Only Heavy Module Globally

Load when needed.

---

# 208. Image Optimization

Not major concern for internal finance app.

Avoid oversized decorative images.

---

# 209. Bundle Analysis

Use periodically if frontend becomes heavy.

---

# 210. Table Performance

Memoize:

```text id="fea214"
Column definitions

Expensive cell renderers
```

where relevant.

---

# 211. Query Cancellation

Search/filter changes should cancel obsolete requests where supported.

---

# 212. Debounce Search

Global/table search:

```text id="fea215"
300–500 ms
```

starting range as UX choice.

---

# 213. Avoid Debouncing Financial Submit

Submit is explicit action.

---

# 214. Cache Invalidation Matrix

Maintain mapping:

```text id="fea216"
Client payment posted
→ invalidate client summary
→ client payments
→ dashboard finance

Vendor settlement posted
→ vendor summary
→ settlements
→ dashboard
```

---

# 215. Mutation Hooks

Create domain hooks:

```text id="fea217"
useCreateClientPayment()

usePostVendorSettlement()

useRequestRefund()
```

rather than generic mutation everywhere.

---

# 216. Mutation Hook Does Not Contain Domain Logic

It handles:

```text id="fea218"
API call

Loading

Error

Invalidation
```

Backend handles financial rules.

---

# 217. Feature Folder Example

```text id="fea219"
features/vendors/
├── components/
├── hooks/
├── queries/
├── mutations/
├── schemas/
└── utils/
```

---

# 218. Shared Components

Generic only.

Do not put vendor-specific financial UI under:

```text id="fea220"
components/common/
```

without reason.

---

# 219. Types

Prefer generated/shared API contract types where practical.

Avoid duplicating backend DTO definitions manually.

---

# 220. Domain UI Types

Can add view-specific types:

```text id="fea221"
VendorSummaryView
```

without changing API domain models.

---

# 221. Zod Schemas

Use for:

```text id="fea222"
Form validation

URL filters

External/untrusted local parsing
```

---

# 222. API Response Validation

Optional for critical boundaries.

TypeScript compile-time typing alone doesn't validate runtime response.

---

# 223. Feature Flags

Frontend may consume backend-configured flags.

Example:

```text id="fea223"
crossClientTransferEnabled
```

---

# 224. Do Not Hardcode Business Features Only in Frontend

Backend must also enforce flag/policy.

---

# 225. Environment Variables

Public frontend env only:

```text id="fea224"
NEXT_PUBLIC_*
```

for non-secret config.

---

# 226. Never Put Secrets in NEXT_PUBLIC

Examples forbidden:

```text id="fea225"
Supabase service role

Meta token

Meta app secret

Encryption key
```

---

# 227. Error Monitoring

Frontend integrates Sentry.

Capture:

```text id="fea226"
Unhandled render errors

Failed route transitions

Unexpected client exceptions
```

---

# 228. Sensitive Error Data

Redact:

```text id="fea227"
Auth tokens

Financial form data

Bank info
```

---

# 229. User Context in Monitoring

Can attach:

```text id="fea228"
Internal user ID

Organization ID
```

but avoid unnecessary PII.

---

# 230. Analytics

Product analytics may be added later.

Do not send sensitive financial values to third-party analytics by default.

---

# 231. Frontend Security

Protect against:

```text id="fea229"
XSS

CSRF where applicable

Clickjacking

Token exposure

Unsafe HTML
```

---

# 232. HTML Rendering

Never render user notes through raw HTML without sanitization.

---

# 233. External Links

Use safe:

```text id="fea230"
rel="noopener noreferrer"
```

where applicable.

---

# 234. Clipboard

Avoid copying sensitive secrets because they should never be displayed.

---

# 235. Logout

Must clear relevant local session/cache state.

---

# 236. Query Cache on Logout

Clear TanStack Query cache to avoid next user seeing previous user's cached data on shared device.

---

# 237. Organization Switch

If future multi-org switch:

```text id="fea231"
Clear/invalidate tenant-specific cache
```

before rendering new org.

---

# 238. Browser Back Button

Financial submit completion page should remain safe.

Back navigation must not resubmit POST.

---

# 239. POST-Redirect Pattern

After financial action:

Navigate to:

```text id="fea232"
Transaction detail
```

or update current page.

Do not use browser form submission that can repost on refresh.

---

# 240. Unsaved Changes

Forms should warn before navigation when meaningful unsaved draft exists.

---

# 241. Draft vs Posted Visual Design

Draft:

```text id="fea233"
Editable
```

Posted:

```text id="fea234"
Read-only
```

visually obvious.

---

# 242. Data Density Modes

Future:

```text id="fea235"
Comfortable

Compact
```

may help finance/ops users.

Not required V1.

---

# 243. Keyboard Shortcuts

Can support:

```text id="fea236"
Search

Navigate tables
```

but avoid shortcuts that directly trigger high-risk financial actions.

---

# 244. Frontend Testing

Need:

```text id="fea237"
Component tests

Form validation tests

Permission rendering tests

E2E tests
```

---

# 245. Critical E2E Flows

```text id="fea238"
Login

Add Client

Record Payment

Allocate Fund

Vendor Funding

Vendor Settlement

Vendor Overpayment

Refund

Restricted Account Review

Reconciliation Resolution
```

---

# 246. Permission Tests

Verify:

```text id="fea239"
Viewer cannot see finance action

Finance sees permitted action

Maker cannot self-approve

Scoped user cannot access another client
```

---

# 247. Unknown Data Tests

Verify UI does not show:

```text id="fea240"
0
```

when backend returns unknown/null.

---

# 248. Stale Data Tests

Verify freshness badge and warning.

---

# 249. Double Submit E2E

Simulate double-click/network retry.

Expected:

```text id="fea241"
one financial transaction
```

---

# 250. Network Timeout Test

Financial POST timeout.

UI checks existing operation status rather than immediately creating new request.

---

# 251. Realtime Failure Test

Disable realtime.

Manual refresh/query still works.

---

# 252. Large Table Test

Test:

```text id="fea242"
10,000+ records server-side
```

without loading all into browser.

---

# 253. Accessibility Test

Use:

```text id="fea243"
keyboard

screen reader basics

contrast checks
```

for core screens.

---

# 254. Frontend Architecture Decisions

Use:

```text id="fea244"
Next.js App Router

Feature folders

Server-first pages

TanStack Query for client server-state

React Hook Form + Zod

shadcn/ui

Backend-driven permissions

Backend-driven financial calculations

URL-backed filters

Realtime invalidation
```

---

# 255. Things To Avoid

```text id="fea245"
Redux for all state

Direct DB mutations

Frontend ledger calculations

Client-only permission enforcement

Huge page components

All-data upfront loading

Optimistic money balances

Unknown = zero

Hardcoded role checks everywhere

Secrets in browser
```

---

# 256. Frontend Integrity Rules

System must enforce:

```text id="fea246"
1. Frontend must never be canonical financial authority.

2. All financial mutations must go through NestJS APIs.

3. Frontend must never construct arbitrary ledger debit/credit entries.

4. Permission-aware rendering does not replace backend authorization.

5. Sensitive data should not be fetched when user lacks permission.

6. Financial balances should come from backend-derived canonical state.

7. Unknown values must never be displayed as zero.

8. Stale Meta data must display freshness clearly.

9. Pending financial actions must remain visually distinct from posted actions.

10. Vendor payable and receivable must remain separate in UI.

11. Client wallet and client receivable must remain separate.

12. Locked funds must not be labeled as losses without explicit resolution.

13. Funding gaps must remain explicit.

14. High-risk actions require clear confirmation.

15. Backend must recalculate financial consequences at execution time.

16. Financial optimistic balance updates should be avoided.

17. Critical submits must use backend idempotency.

18. Network uncertainty after a financial POST must be resolved through status lookup/idempotency, not blind resubmission.

19. Large data sets must use backend pagination/filtering.

20. Realtime events should trigger canonical refetch rather than become final state.

21. Meta secrets and service credentials must never reach the browser.

22. Query cache must be cleared on logout/tenant switch where necessary.

23. Posted financial records must remain read-only.

24. Audit records must remain read-only.

25. Frontend architecture must prioritize clarity and financial-state correctness over decorative complexity.
```

---

# 257. Frontend Architecture Golden Rule

> **The frontend must make financial truth easy to understand without trying to own it. It should clearly show what is current, pending, stale, locked, unresolved or posted; guide users through safe business actions; and always defer final authorization, balance calculation, ownership validation and posting logic to the backend.**
