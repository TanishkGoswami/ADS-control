# API Design

## Overview

Ye document Ads Control system ke REST API design ko define karta hai.

API ka purpose:

```text id="api001"
Frontend ko stable contract dena

Financial actions ko explicit commands me expose karna

Authorization centrally enforce karna

Idempotent mutations support karna

Background jobs safely trigger karna

Large data ko paginate karna

Errors ko machine-readable banana
```

Core principle:

> **The API should describe business intent, not database mutations. A client requests an action such as “post vendor settlement”; it must never directly instruct the server which ledger balances to overwrite.**

---

# 1. API Style

Recommended:

```text id="api002"
REST

JSON

HTTPS

Versioned routes

OpenAPI documented
```

Base:

```text id="api003"
/api/v1
```

---

# 2. Why REST

REST suits:

```text id="api004"
Clear business resources

Command-style actions

Permission checks

Auditing

Mobile/web consumers

OpenAPI
```

GraphQL is not required in V1.

---

# 3. API Domain Groups

Primary route groups:

```text id="api005"
/auth

/users

/roles

/meta

/clients

/vendors

/finance

/ledger

/funds

/approvals

/reconciliation

/alerts

/reports

/audit

/settings
```

---

# 4. Resource Naming

Use:

```text id="api006"
plural nouns
```

Examples:

```text id="api007"
/clients

/vendors

/ad-accounts

/transactions
```

Avoid inconsistent mixes such as:

```text id="api008"
/client
/vendorList
/getTransactions
```

---

# 5. HTTP Methods

Recommended:

```text id="api009"
GET
Read

POST
Create or execute explicit command

PATCH
Update mutable resource fields

DELETE
Only safe draft/non-historical deletions
```

---

# 6. Financial Records

For posted financial records:

```text id="api010"
DELETE
```

must not be used.

Corrections happen through:

```text id="api011"
Reversal

Adjustment

Replacement transaction
```

---

# 7. Resource APIs vs Command APIs

Normal CRUD:

```text id="api012"
POST /clients

PATCH /clients/{clientId}
```

Financial command:

```text id="api013"
POST /vendors/{vendorId}/settlements/{settlementId}/post
```

---

# 8. Why Command Endpoints

Financial workflows contain:

```text id="api014"
Validation

Locking

Approvals

Ledger postings

Fund changes
```

They are not simple CRUD updates.

---

# 9. Bad API Example

Do not expose:

```text id="api015"
PATCH /vendors/{id}

{
  "payable": 0
}
```

---

# 10. Correct API Example

Use:

```text id="api016"
POST /vendors/{vendorId}/settlements
```

then:

```text id="api017"
POST /vendors/{vendorId}/settlements/{settlementId}/post
```

Backend computes payable result.

---

# 11. API Versioning

Current:

```text id="api018"
/api/v1
```

Breaking contract changes:

```text id="api019"
/api/v2
```

---

# 12. Non-Breaking Changes

Can usually remain in V1:

```text id="api020"
New optional response field

New endpoint

New optional filter

New enum value if consumers support unknowns
```

---

# 13. Breaking Changes

Examples:

```text id="api021"
Removing response field

Changing amount format

Changing endpoint semantics

Renaming required request field
```

require migration/version strategy.

---

# 14. Authentication

Protected API requires:

```text id="api022"
Bearer token
```

from Supabase-authenticated session.

Conceptual:

```text id="api023"
Authorization: Bearer <JWT>
```

---

# 15. Backend Identity

Backend derives:

```text id="api024"
userId

organizationId

roles

permissions
```

from validated authentication/session context.

Do not trust these from request body.

---

# 16. Organization ID

Normal tenant APIs should not allow arbitrary:

```text id="api025"
organizationId
```

to override authenticated tenant context.

---

# 17. Multi-Organization Users

If future user can switch organizations:

selected org must still be validated against membership.

---

# 18. Authorization

Every endpoint defines required permission.

Example:

```text id="api026"
GET /vendors
→ VENDOR_VIEW
```

```text id="api027"
POST /vendors/{id}/settlements
→ VENDOR_SETTLEMENT_CREATE
```

---

# 19. Resource Scope

Permission alone is insufficient.

Backend checks whether actor can access:

```text id="api028"
specific client

vendor

ad account

team
```

---

# 20. API Capability Hints

Read responses may include:

```text id="api029"
capabilities
```

Example:

```text id="api030"
{
  "canEdit": true,
  "canRefund": false,
  "canArchive": true
}
```

These are UI hints.

Final command still revalidates.

---

# 21. JSON Naming

Use:

```text id="api031"
camelCase
```

in API.

Database may remain:

```text id="api032"
snake_case
```

---

# 22. IDs

Internal resource IDs:

```text id="api033"
UUID strings
```

Human reference:

```text id="api034"
CLI-0001
```

External Meta IDs:

```text id="api035"
strings
```

---

# 23. Money Representation

Canonical money should not be sent as floating-point decimal.

Recommended API:

```text id="api036"
{
  "amountMinor": "2000000",
  "currency": "INR"
}
```

---

# 24. Why String

Database:

```text id="api037"
BIGINT
```

may exceed JavaScript safe integer.

JSON string avoids precision loss.

---

# 25. Display Amount

Frontend converts:

```text id="api038"
"2000000" INR
```

to:

```text id="api039"
₹20,000.00
```

---

# 26. Input Money

Preferred:

```text id="api040"
amountMinor
```

as integer string.

Alternative user-entry API may accept:

```text id="api041"
amount: "20000.00"
currency: "INR"
```

but backend must convert using decimal-safe logic.

---

# 27. Do Not Accept Float

Avoid:

```text id="api042"
"amount": 1999.99
```

for canonical financial commands.

---

# 28. Currency

Use ISO-style currency code:

```text id="api043"
INR

USD

EUR
```

Do not infer currency solely from user locale.

---

# 29. Dates

Date-only field:

```text id="api044"
YYYY-MM-DD
```

Example:

```text id="api045"
2026-09-17
```

---

# 30. Timestamps

Use ISO 8601 UTC or timezone-aware timestamp.

Example:

```text id="api046"
2026-09-17T11:08:00Z
```

---

# 31. Business Date

Financial transaction may have separate:

```text id="api047"
businessDate
```

from:

```text id="api048"
createdAt

postedAt
```

---

# 32. Null Semantics

Critical:

```text id="api049"
0
```

means verified zero.

```text id="api050"
null
```

means absent/unknown/not applicable according to field semantics.

API docs must define each.

---

# 33. Enums

Return machine-readable enum:

```text id="api051"
"RESTRICTED"
```

not only user-facing:

```text id="api052"
"Account Restricted"
```

Frontend handles labels.

---

# 34. Unknown Enum Forward Compatibility

Frontend should safely handle unknown future value.

Fallback:

```text id="api053"
Unknown
```

rather than crash.

---

# 35. Standard Success Response

Recommended for object response:

```text id="api054"
{
  "data": {
    ...
  },
  "meta": {
    "requestId": "..."
  }
}
```

---

# 36. List Response

```text id="api055"
{
  "data": [
    ...
  ],
  "meta": {
    "requestId": "...",
    "nextCursor": "...",
    "hasMore": true
  }
}
```

---

# 37. Mutation Response

Return canonical resulting resource.

Example:

```text id="api056"
{
  "data": {
    "id": "...",
    "reference": "SET-000123",
    "status": "POSTED"
  },
  "meta": {
    "requestId": "..."
  }
}
```

---

# 38. HTTP Status Codes

Recommended:

```text id="api057"
200
Successful read/action

201
Resource created

202
Async request accepted

204
Safe no-content action

400
Malformed validation

401
Unauthenticated

403
Unauthorized

404
Resource unavailable/not found

409
Conflict/idempotency/concurrency

422
Valid request but domain rule prevents action

429
Rate limited

500
Unexpected server failure

503
Critical dependency unavailable
```

---

# 39. Async Operations

For operations such as:

```text id="api058"
Meta full sync

Historical backfill

Large report

Full reconciliation
```

return:

```text id="api059"
202 Accepted
```

---

# 40. Async Response

Example:

```text id="api060"
{
  "data": {
    "jobId": "...",
    "syncRunId": "...",
    "status": "QUEUED"
  }
}
```

---

# 41. Async Status Endpoint

Examples:

```text id="api061"
GET /meta/sync-runs/{syncRunId}
```

```text id="api062"
GET /reports/{reportId}
```

---

# 42. Do Not Hold HTTP Connection

A 10-minute report should not keep one browser request open.

---

# 43. Pagination

All large lists must paginate.

Recommended default:

```text id="api063"
limit=50
```

with max:

```text id="api064"
100
```

or feature-specific equivalent.

---

# 44. Cursor Pagination

Preferred for:

```text id="api065"
Ledger

Audit

Alerts

Reconciliation

Timeline
```

---

# 45. Cursor Request

Example:

```text id="api066"
GET /ledger/transactions?limit=50&cursor=...
```

---

# 46. Cursor Must Be Opaque

Frontend should not parse cursor internals.

---

# 47. Offset Pagination

Acceptable for smaller lists:

```text id="api068"
Users

Roles

Configuration
```

if desired.

---

# 48. Sorting

Example:

```text id="api069"
?sort=postedAt:desc
```

Only whitelisted fields allowed.

---

# 49. Filtering

Example:

```text id="api070"
GET /clients?status=ACTIVE
```

```text id="api071"
GET /ledger/transactions?type=CLIENT_PAYMENT
```

---

# 50. Date Range Filters

Recommended:

```text id="api072"
from=2026-09-01

to=2026-09-17
```

Semantics documented as inclusive/exclusive clearly.

---

# 51. Search

Example:

```text id="api073"
?q=Alpha
```

Backend searches only defined fields.

---

# 52. Field Selection

V1 does not need generic:

```text id="api074"
fields=...
```

API optimization should be endpoint-specific.

---

# 53. Error Response

Standard:

```text id="api075"
{
  "error": {
    "code": "INSUFFICIENT_AVAILABLE_FUNDS",
    "message": "Requested amount exceeds available funds.",
    "requestId": "...",
    "details": {
      ...
    }
  }
}
```

---

# 54. Error Code

Machine-readable stable key.

Examples:

```text id="api076"
AUTH_REQUIRED

PERMISSION_DENIED

RESOURCE_NOT_FOUND

INSUFFICIENT_AVAILABLE_FUNDS

OWNERSHIP_MISMATCH

APPROVAL_REQUIRED

DUPLICATE_REFERENCE

FINANCIAL_STATE_CHANGED

IDEMPOTENCY_KEY_CONFLICT
```

---

# 55. Error Message

Human-readable safe message.

Do not expose:

```text id="api077"
SQL

stack trace

internal token

secret
```

---

# 56. Error Details

Can include safe context.

Example:

```text id="api078"
{
  "requestedMinor": "1000000",
  "availableMinor": "500000"
}
```

---

# 57. Field Validation Error

Example:

```text id="api079"
{
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": {
      "amountMinor": [
        "Amount must be greater than zero."
      ]
    }
  }
}
```

---

# 58. Business Error vs Validation Error

Validation:

```text id="api080"
Amount field missing
```

Business error:

```text id="api081"
Amount is valid but client does not own enough funds
```

---

# 59. Conflict Error

Use 409 for:

```text id="api082"
Duplicate reference

Idempotency conflict

Concurrent state changed

Already posted
```

---

# 60. 422 Domain Error

Use for:

```text id="api083"
Approval required

Ownership rule violation

Entity state doesn't permit command
```

depending on chosen API convention.

Consistency more important than exact status philosophy.

---

# 61. Request ID

Every request gets:

```text id="api084"
requestId
```

returned in response.

---

# 62. Client-Supplied Request ID

Optional:

```text id="api085"
X-Request-ID
```

can be accepted if safe/validated.

Backend generates one if absent.

---

# 63. Idempotency Header

Critical financial mutation:

```text id="api086"
Idempotency-Key: <unique-key>
```

---

# 64. Idempotency Scope

Key uniqueness should be scoped by:

```text id="api087"
organization

operation
```

---

# 65. Idempotency Required Endpoints

At minimum:

```text id="api088"
Client payment posting

Vendor funding posting

Vendor settlement posting

Client refund posting

Ownership transfer execution

Manual adjustment posting
```

---

# 66. Retry Same Request

If same key + same request:

return same canonical result.

---

# 67. Retry Different Request

Same key + changed amount:

```text id="api068b"
409 IDEMPOTENCY_KEY_CONFLICT
```

---

# 68. Idempotency Expiration

Financial idempotency records should have long enough retention to prevent accidental duplicate historical posting.

Do not expire aggressively.

---

# 69. External Reference

Example payment request:

```text id="api089"
{
  "externalReference": "UTR123..."
}
```

Backend may also apply uniqueness/review rules.

---

# 70. External Reference Is Not Idempotency Key

Two separate concepts:

```text id="api090"
Idempotency key
=
API retry protection

External reference
=
Business/payment reference
```

---

# 71. Client APIs

Examples:

```text id="api091"
GET /clients

POST /clients

GET /clients/{clientId}

PATCH /clients/{clientId}

POST /clients/{clientId}/archive
```

---

# 72. Client Payment APIs

```text id="api092"
GET /clients/{clientId}/payments

POST /clients/{clientId}/payments

GET /clients/{clientId}/payments/{paymentId}
```

---

# 73. Client Payment Create

Example:

```text id="api094"
POST /clients/{clientId}/payments
```

Body:

```text id="api095"
{
  "amountMinor": "2000000",
  "currency": "INR",
  "purpose": "ADS_FUND",
  "paymentDate": "2026-09-17",
  "externalReference": "UTR123",
  "note": "September funding"
}
```

---

# 74. Client Payment Status

Depending on workflow:

```text id="api096"
DRAFT

PENDING_APPROVAL

POSTED

REVERSED
```

---

# 75. Payment Posting Command

If payment creation and posting separated:

```text id="api097"
POST /clients/{clientId}/payments/{paymentId}/post
```

---

# 76. Client Financial Summary

```text id="api098"
GET /clients/{clientId}/financial-summary
```

Response may include:

```text id="api099"
available

allocated

locked

refundPending

receivable

historicalSpend
```

---

# 77. Client Jobs

```text id="api100"
GET /clients/{clientId}/jobs

POST /clients/{clientId}/jobs

GET /client-jobs/{jobId}

PATCH /client-jobs/{jobId}
```

---

# 78. Job Funding

```text id="api101"
POST /client-jobs/{jobId}/allocations
```

Backend selects eligible fund lots.

---

# 79. Allocation Request

Example:

```text id="api102"
{
  "amountMinor": "1500000",
  "currency": "INR",
  "source": "CLIENT_WALLET",
  "reason": "Fund September campaign"
}
```

---

# 80. Ad Account Assignment

```text id="api103"
POST /client-jobs/{jobId}/ad-account-assignments
```

---

# 81. Campaign Mapping

```text id="api104"
POST /client-jobs/{jobId}/campaign-mappings
```

Body:

```text id="api105"
{
  "campaignId": "...",
  "effectiveFrom": "2026-09-17"
}
```

---

# 82. Mapping Closure

Use explicit endpoint or PATCH:

```text id="api106"
POST /client-jobs/{jobId}/campaign-mappings/{mappingId}/close
```

---

# 83. Client Refund APIs

```text id="api107"
GET /clients/{clientId}/refunds

POST /clients/{clientId}/refunds

GET /clients/{clientId}/refunds/{refundId}

POST /clients/{clientId}/refunds/{refundId}/approve

POST /clients/{clientId}/refunds/{refundId}/post
```

depending on approval model.

---

# 84. Refund Request vs Refund Post

Requesting:

```text id="api108"
does not mean money paid
```

Posting:

```text id="api109"
represents confirmed canonical financial event
```

---

# 85. Client Receivables

```text id="api110"
GET /clients/{clientId}/receivables

POST /clients/{clientId}/receivables/{receivableId}/settlements
```

---

# 86. Vendor APIs

```text id="api111"
GET /vendors

POST /vendors

GET /vendors/{vendorId}

PATCH /vendors/{vendorId}

POST /vendors/{vendorId}/archive
```

---

# 87. Vendor Funding APIs

```text id="api112"
GET /vendors/{vendorId}/funding-batches

POST /vendors/{vendorId}/fundings
```

---

# 88. Vendor Settlement APIs

```text id="api113"
GET /vendors/{vendorId}/settlements

POST /vendors/{vendorId}/settlements

GET /vendors/{vendorId}/settlements/{settlementId}
```

---

# 89. Settlement Preview

Useful endpoint:

```text id="api114"
POST /vendors/{vendorId}/settlements/preview
```

---

# 90. Settlement Preview Request

```text id="api115"
{
  "paymentAmountMinor": "3000000",
  "currency": "INR"
}
```

---

# 91. Settlement Preview Response

```text id="api116"
{
  "data": {
    "openPayableMinor": "2000000",
    "validRepaymentMinor": "2000000",
    "excessMinor": "1000000",
    "willCreateReceivable": true
  }
}
```

---

# 92. Preview Is Informational

Final:

```text id="api117"
POST /settlements/{id}/post
```

recalculates under DB lock.

---

# 93. Settlement Post

Endpoint:

```text id="api118"
POST /vendors/{vendorId}/settlements/{settlementId}/post
```

requires idempotency key.

---

# 94. Vendor Financial Summary

```text id="api119"
GET /vendors/{vendorId}/financial-summary
```

returns separately:

```text id="api120"
payable

receivable

openBatches

reservedSettlement
```

---

# 95. Vendor Recovery

```text id="api121"
POST /vendors/{vendorId}/receivables/{receivableId}/recoveries
```

---

# 96. Vendor Offset

Explicit command:

```text id="api122"
POST /vendors/{vendorId}/receivables/{receivableId}/offset
```

not generic payable PATCH.

---

# 97. Ledger APIs

Read:

```text id="api123"
GET /ledger/accounts

GET /ledger/transactions

GET /ledger/transactions/{transactionId}
```

---

# 98. Ledger Posting

Normal business users do not create raw ledger transactions.

Internal domain services post them.

---

# 99. Reversal API

Authorized:

```text id="api124"
POST /ledger/transactions/{transactionId}/reverse
```

Body:

```text id="api125"
{
  "reason": "Payment entered with wrong amount"
}
```

---

# 100. Reversal Validation

Backend verifies:

```text id="api126"
Transaction posted

Not already reversed

User authorized

Period rules allow action

Approval if required
```

---

# 101. Fund APIs

```text id="api127"
GET /funds/allocations

GET /funds/lots/{fundLotId}

GET /funds/lineage/{entityType}/{entityId}
```

---

# 102. Allocation Command

Possible:

```text id="api128"
POST /funds/allocations
```

but domain-specific endpoints are often clearer.

Example:

```text id="api129"
POST /client-jobs/{jobId}/allocations
```

---

# 103. Ownership Transfer

Explicit:

```text id="api130"
POST /funds/ownership-transfers
```

Request:

```text id="api131"
{
  "sourceOwnerType": "CLIENT",
  "sourceOwnerId": "...",
  "destinationOwnerType": "CLIENT",
  "destinationOwnerId": "...",
  "amountMinor": "300000",
  "currency": "INR",
  "reason": "Approved balance transfer"
}
```

---

# 104. Ownership Transfer Approval

Creation may return:

```text id="api132"
PENDING_APPROVAL
```

instead of immediately changing ownership.

---

# 105. Locked Funds APIs

```text id="api133"
GET /funds/locked

GET /funds/locked/{lockedFundId}

POST /funds/locked/{lockedFundId}/unlock

POST /funds/locked/{lockedFundId}/write-off
```

---

# 106. Unlock

Backend verifies recovery amount.

Client cannot simply set:

```text id="api134"
status = AVAILABLE
```

---

# 107. Meta Connections

```text id="api135"
GET /meta/connections

POST /meta/connections

GET /meta/connections/{connectionId}

POST /meta/connections/{connectionId}/reconnect

POST /meta/connections/{connectionId}/disable
```

---

# 108. Meta Connection Secret

Never returned from API.

Response:

```text id="api136"
{
  "status": "ACTIVE",
  "authMode": "SYSTEM_USER",
  "tokenConfigured": true
}
```

not token.

---

# 109. Meta Ad Accounts

```text id="api137"
GET /meta/ad-accounts

GET /meta/ad-accounts/{adAccountId}
```

---

# 110. Account Filters

Examples:

```text id="api138"
?status=RESTRICTED

?freshness=STALE

?portfolioId=...

?clientId=...
```

---

# 111. Meta Campaigns

```text id="api139"
GET /meta/ad-accounts/{adAccountId}/campaigns
```

---

# 112. Spend APIs

```text id="api140"
GET /meta/spend
```

Filters:

```text id="api141"
adAccountId

campaignId

clientId

jobId

from

to
```

---

# 113. Sync APIs

```text id="api142"
POST /meta/connections/{connectionId}/sync
```

Body:

```text id="api143"
{
  "type": "FULL_CONNECTION_SYNC"
}
```

---

# 114. Targeted Sync

```text id="api144"
POST /meta/ad-accounts/{adAccountId}/sync
```

Body:

```text id="api145"
{
  "type": "SPEND_RECENT"
}
```

---

# 115. Sync Runs

```text id="api146"
GET /meta/sync-runs

GET /meta/sync-runs/{syncRunId}
```

---

# 116. Sync Request Response

```text id="api147"
202 Accepted
```

with run/job reference.

---

# 117. Reconciliation APIs

```text id="api148"
GET /reconciliation/cases

GET /reconciliation/cases/{caseId}

POST /reconciliation/cases/{caseId}/assign

POST /reconciliation/cases/{caseId}/resolve
```

---

# 118. Manual Reconciliation

```text id="api149"
POST /reconciliation/runs
```

Example:

```text id="api150"
{
  "scopeType": "VENDOR",
  "scopeId": "..."
}
```

---

# 119. Reconciliation Resolve

Must not accept simply:

```text id="api151"
{
  "status": "RESOLVED"
}
```

without valid resolution context.

---

# 120. Better Resolve Command

```text id="api152"
{
  "resolutionType": "MAPPING_CORRECTED",
  "note": "...",
  "relatedTransactionId": null
}
```

Backend rechecks difference.

---

# 121. Case Cannot Resolve If Difference Still Exists

Unless resolution type explicitly supports explained accepted state with proper policy.

---

# 122. Alert APIs

```text id="api153"
GET /alerts

GET /alerts/{alertId}

POST /alerts/{alertId}/acknowledge

POST /alerts/{alertId}/assign

POST /alerts/{alertId}/snooze
```

---

# 123. Alert Resolve

Only if allowed:

```text id="api154"
POST /alerts/{alertId}/resolve
```

Backend may prevent manual resolution of condition-controlled alerts.

---

# 124. Approval APIs

```text id="api155"
GET /approvals

GET /approvals/{approvalId}

POST /approvals/{approvalId}/approve

POST /approvals/{approvalId}/reject
```

---

# 125. Approval Decision Request

```text id="api156"
{
  "note": "Approved after verification."
}
```

---

# 126. Self-Approval

Backend returns:

```text id="api157"
403 / 422
MAKER_CHECKER_VIOLATION
```

where policy applies.

---

# 127. Reports

```text id="api158"
POST /reports
```

Request:

```text id="api159"
{
  "type": "CLIENT_STATEMENT",
  "filters": {
    "clientId": "...",
    "from": "2026-09-01",
    "to": "2026-09-30"
  },
  "format": "XLSX"
}
```

---

# 128. Report Response

```text id="api160"
202 Accepted
```

---

# 129. Report Status

```text id="api161"
GET /reports/{reportId}
```

Response:

```text id="api162"
QUEUED

PROCESSING

READY

FAILED
```

---

# 130. Report Download

When ready:

```text id="api163"
POST /reports/{reportId}/download-link
```

returns short-lived signed URL.

---

# 131. Audit APIs

```text id="api164"
GET /audit/events
```

Read-only.

---

# 132. Audit Filters

```text id="api165"
actorId

entityType

entityId

action

from

to
```

---

# 133. User APIs

```text id="api166"
GET /users

POST /users/invitations

PATCH /users/{userId}

POST /users/{userId}/deactivate
```

---

# 134. Roles APIs

```text id="api167"
GET /roles

GET /permissions

POST /roles

PATCH /roles/{roleId}
```

if custom roles enabled.

---

# 135. Role Assignment

```text id="api168"
POST /users/{userId}/roles
```

---

# 136. Resource Scope

```text id="api169"
POST /users/{userId}/resource-scopes
```

or controlled PATCH model.

---

# 137. Settings APIs

Separate business settings:

```text id="api170"
GET /settings/financial

PATCH /settings/financial
```

from integration settings:

```text id="api171"
GET /settings/meta
```

---

# 138. Settings Audit

Every material settings change audited.

---

# 139. API Resource References

Response should include both:

```text id="api172"
id
```

and human reference when useful.

Example:

```text id="api173"
{
  "id": "...uuid...",
  "reference": "CLI-0001",
  "name": "Alpha Digital"
}
```

---

# 140. Relationship Embedding

Avoid huge nested responses.

Client list should not embed:

```text id="api174"
all jobs

all transactions

all payments
```

Use separate endpoints.

---

# 141. Small Summary Embedding

Okay:

```text id="api175"
{
  "client": ...,
  "summary": {
    "availableMinor": "...",
    "activeJobs": 3
  }
}
```

---

# 142. Expand Parameter

Optional future:

```text id="api176"
?expand=summary
```

Not needed initially.

---

# 143. N+1 API Calls

Frontend should not require 100 detail requests for one table.

List endpoints include required summary fields.

---

# 144. List Endpoint Design

Example client list row:

```text id="api177"
id

reference

name

status

assignedManager

currentAvailable

activeJobs

openAlerts
```

subject to permissions.

---

# 145. Detail Endpoint

Provides richer overview but not all tab contents.

---

# 146. Field-Level Authorization

Finance-sensitive fields should be omitted or null according to backend policy.

Prefer omission/documented restricted response.

---

# 147. 403 vs Hidden Field

If entire resource inaccessible:

```text id="api178"
403 / 404
```

If resource visible but full financial data not:

return permitted subset.

---

# 148. Resource Existence Leakage

Cross-tenant inaccessible UUID should generally not confirm existence.

---

# 149. ETags

Optional future for read caching/concurrency.

Not necessary for V1 financial commands.

---

# 150. Optimistic Concurrency Header

Mutable configuration could use:

```text id="api179"
version
```

Example:

```text id="api180"
PATCH /clients/{id}

{
  "version": 4,
  ...
}
```

---

# 151. Version Conflict

If current version 5:

```text id="api181"
409 RESOURCE_VERSION_CONFLICT
```

---

# 152. Financial Commands Do Not Depend on Client Version

They lock/revalidate financial state transactionally.

---

# 153. Preview APIs

Useful for risky action consequences.

Potential:

```text id="api182"
/vendors/{id}/settlements/preview

/clients/{id}/refunds/preview

/funds/ownership-transfers/preview
```

---

# 154. Preview Response Metadata

Include:

```text id="api183"
generatedAt

stateVersion / hash
```

if useful.

---

# 155. Preview Expiration

Preview is not guaranteed current later.

Frontend should warn.

---

# 156. Dry Run

Avoid generic:

```text id="api184"
?dryRun=true
```

for every command.

Explicit preview endpoints clearer.

---

# 157. Batch APIs

Use only when meaningful.

Example:

```text id="api185"
POST /alerts/batch-assign
```

Possible.

Avoid batch financial posting initially.

---

# 158. Why Avoid Batch Finance V1

Atomicity, approvals and partial failures become more complex.

Post individually.

---

# 159. Bulk Import APIs

Future migration/import:

```text id="api186"
POST /imports/client-payments
```

should create:

```text id="api187"
ImportBatch
```

and validation report.

---

# 160. Import Does Not Skip Financial Rules

Bulk mode still enforces:

```text id="api188"
Duplicates

Currencies

References

Ledger integrity
```

---

# 161. Webhook Endpoints

Future:

```text id="api189"
/api/v1/webhooks/meta
```

should be separate public endpoint.

---

# 162. Webhook Auth

Use provider verification/signature mechanisms.

Do not use normal user JWT.

---

# 163. Webhook Response

Acknowledge quickly.

Queue detailed processing.

---

# 164. Webhook Idempotency

Duplicate provider event safe.

---

# 165. Health APIs

```text id="api190"
GET /health/live

GET /health/ready
```

not under authenticated business `/api/v1` necessarily.

---

# 166. Internal Metrics APIs

Should not be public unless protected.

---

# 167. API Rate Limiting

Different route classes.

Example:

```text id="api191"
Read lists:
moderate

Manual Meta sync:
strict

Auth:
strict

Financial POST:
controlled
```

---

# 168. Rate Limit Response

```text id="api192"
429
```

with retry hint where supported.

---

# 169. API Timeouts

Normal interactive API should complete quickly.

Large job:

```text id="api193"
202
```

instead.

---

# 170. File Upload APIs

Possible:

```text id="api194"
POST /attachments/upload-intent
```

returns signed upload information.

---

# 171. Attachment Confirmation

```text id="api195"
POST /attachments/{attachmentId}/confirm
```

after upload.

---

# 172. Attachment Entity Link

Must verify:

```text id="api196"
actor can access target entity
```

before upload link created.

---

# 173. Sensitive Attachment Download

Endpoint:

```text id="api197"
POST /attachments/{id}/download-link
```

performs authorization before signed URL.

---

# 174. API Error Logging

Backend logs:

```text id="api198"
requestId

errorCode

route

actor

organization
```

without secrets.

---

# 175. API Audit Correlation

Audit event stores:

```text id="api199"
requestId
```

for important mutations.

---

# 176. Financial Transaction Response

Should include:

```text id="api200"
businessRecordId

ledgerTransactionId

status

reference
```

where authorized/useful.

---

# 177. Example Vendor Settlement Response

```text id="api201"
{
  "data": {
    "settlementId": "...",
    "reference": "SET-000121",
    "status": "POSTED",
    "paymentAmountMinor": "3000000",
    "validRepaymentMinor": "2000000",
    "excessReceivableMinor": "1000000",
    "vendorPayableAfterMinor": "0",
    "vendorReceivableAfterMinor": "1000000"
  }
}
```

---

# 178. API Should Explain Important Split

Financial response should make consequences explicit rather than forcing frontend to infer.

---

# 179. Client Payment Response

```text id="api202"
{
  "data": {
    "paymentId": "...",
    "status": "POSTED",
    "fundLotIds": ["..."],
    "amountMinor": "2000000",
    "currency": "INR"
  }
}
```

---

# 180. Approval-Required Response

Possible:

```text id="api203"
201 Created
```

with:

```text id="api204"
status: "PENDING_APPROVAL"
approvalId: "..."
```

rather than error.

---

# 181. When Approval Is Workflow

If command legitimately creates request:

approval is a normal state, not failure.

---

# 182. When Approval Is Missing Requirement

If user calls direct execution endpoint without approval:

return:

```text id="api205"
APPROVAL_REQUIRED
```

---

# 183. Async vs Workflow Status

Keep separate.

Example:

```text id="api206"
Business status:
APPROVED

Job status:
QUEUED
```

---

# 184. Never Overload One Status Field

Different state machines should remain distinct.

---

# 185. Status APIs

For long operation:

```text id="api207"
jobStatus
```

For financial resource:

```text id="api208"
transactionStatus
```

---

# 186. API Documentation

Every endpoint documents:

```text id="api209"
Purpose

Permission

Request

Response

Errors

Idempotency requirement

Side effects

Async behavior
```

---

# 187. OpenAPI Tags

Recommended:

```text id="api210"
Clients

Vendors

Meta

Finance

Ledger

Funds

Reconciliation

Approvals

Alerts

Reports
```

---

# 188. Examples

Financial endpoints should include examples for:

```text id="api211"
Normal case

Insufficient funds

Approval required

Idempotent retry
```

---

# 189. API Changelog

Maintain:

```text id="api212"
API-CHANGELOG.md
```

or generated release notes for breaking/important changes.

---

# 190. Deprecation

Deprecated endpoint should return:

```text id="api213"
Deprecation header / documentation
```

for migration period where feasible.

---

# 191. No Silent Semantic Changes

Do not change:

```text id="api214"
availableBalance
```

from one definition to another without version/release communication.

---

# 192. API Contract Tests

Test important endpoint schemas.

Especially:

```text id="api215"
money fields

statuses

errors

pagination
```

---

# 193. Financial API Integration Tests

Real PostgreSQL tests for:

```text id="api216"
Client payment

Vendor settlement

Refund

Ownership transfer

Reversal
```

---

# 194. Idempotency Tests

Send same request twice.

Expected:

```text id="api217"
same resulting financial transaction
```

---

# 195. Idempotency Conflict Test

Same key, different amount.

Expected:

```text id="api218"
409
```

---

# 196. Concurrency Test

Two settlement POST requests simultaneously.

Expected:

```text id="api219"
financially valid final state
```

---

# 197. Permission Tests

Each sensitive API should test:

```text id="api220"
Allowed user

Denied user

Scoped user

Inactive user
```

---

# 198. Cross-Tenant Tests

ORG-A token requests ORG-B UUID.

Expected:

```text id="api221"
No data leak
```

---

# 199. Null/Zero Tests

Financial summary:

```text id="api222"
unknown ≠ 0
```

---

# 200. API Performance

List endpoint should:

```text id="api223"
paginate

select needed fields

use indexes
```

---

# 201. Avoid Unbounded Endpoints

No:

```text id="api224"
GET /ledger/transactions?limit=1000000
```

---

# 202. Export Is Separate

For all records:

```text id="api225"
Report/export job
```

---

# 203. Cache Headers

Authenticated financial API generally:

```text id="api226"
private / no-store
```

where appropriate.

Do not allow public intermediary caching.

---

# 204. Public vs Private API

V1 is internal authenticated API.

No public developer API initially.

---

# 205. Future Public API

If introduced:

```text id="api227"
/api/public/v1
```

should have separate credentials, quotas and scopes.

Do not reuse normal user session design blindly.

---

# 206. Service-to-Service APIs

Workers usually call shared services directly inside codebase, not HTTP API.

Avoid unnecessary internal HTTP roundtrips in modular monolith.

---

# 207. API and Worker Share Domain Services

HTTP:

```text id="api228"
Controller
→ Service
```

Worker:

```text id="api229"
Processor
→ Same Service
```

where use case matches.

---

# 208. Worker Must Not Call Public API With Fake User

Use internal service/domain call.

---

# 209. Request Actor

Each command receives:

```text id="api230"
ActorContext
```

with:

```text id="api231"
actorType

userId

organizationId

permissions

requestId
```

---

# 210. System Actor

Worker command:

```text id="api232"
actorType = SYSTEM
```

with originating request/user reference when relevant.

---

# 211. API Auditability

Every high-risk endpoint should answer later:

```text id="api233"
Who requested it?

What request?

What result?

Which transaction?

Which approval?

Which request ID?
```

---

# 212. Sensitive Responses

Do not return:

```text id="api234"
Meta access token

App secret

Supabase service key

Password hashes
```

under any endpoint.

---

# 213. Masked Bank Details

Where financial bank details displayed:

return only fields authorized for role.

Possible:

```text id="api235"
XXXX1234
```

for operational users.

---

# 214. PII Minimization

API list endpoints should not include sensitive client/vendor details unless needed.

---

# 215. API Version Header

Optional response:

```text id="api236"
X-API-Version: v1
```

not required but can aid diagnostics.

---

# 216. Server Version

Do not expose unnecessary detailed stack/server version publicly.

---

# 217. Meta Sync Response

Do not include provider raw payload to normal users.

Return normalized sync state.

---

# 218. Admin Diagnostics

Dedicated protected endpoint may show safe provider error fields.

---

# 219. API Command Naming Consistency

Use verbs for command subroutes:

```text id="api237"
/approve

/reject

/post

/reverse

/archive

/reconnect

/sync
```

---

# 220. Avoid Generic `/action`

Bad:

```text id="api238"
/vendors/{id}/action
```

Body:

```text id="api239"
{ "type": "settle" }
```

Use explicit route.

---

# 221. Avoid RPC-Like Everything

Do not make all routes:

```text id="api240"
/getClients

/createClient

/updateClient
```

Normal resource CRUD remains RESTful.

---

# 222. Use Commands Where Semantics Matter

Hybrid model is deliberate.

---

# 223. API Design Integrity Rules

System must enforce:

```text id="api2241"
1. API routes must express business intent rather than direct database mutations.

2. Posted financial balances must never be editable through generic PATCH endpoints.

3. Critical financial commands must support idempotency.

4. Money values must use precision-safe representations.

5. Currency must be explicit.

6. Authentication context must determine user and tenant identity.

7. Request-body organization/user IDs must never override verified auth context.

8. Backend permissions and resource scopes must be checked on every protected action.

9. Large collections must be paginated.

10. Long-running work must return 202 and run asynchronously.

11. Unknown values must not be serialized as verified zero.

12. Vendor payable and receivable must remain separate response fields.

13. Client wallet and client receivable must remain separate.

14. Preview endpoints must not be treated as financial reservations unless explicitly documented.

15. Final financial actions must recalculate against current DB state.

16. API errors must use stable machine-readable codes.

17. Raw stack traces and secrets must never be returned.

18. External references and idempotency keys must remain separate concepts.

19. Posted ledger transactions must only be corrected through explicit reversal/adjustment APIs.

20. Financial approval status and async job status must remain separate.

21. Reconciliation cases must not be resolvable by simply patching status.

22. Meta connection credentials must never be returned.

23. Exports must obey the same authorization and resource scopes as interactive queries.

24. Webhook endpoints must validate provider authenticity and remain idempotent.

25. API contracts must be documented and tested through OpenAPI/integration tests.
```

---

# 224. API Design Golden Rule

> **Every API mutation must represent a real business action, validate the actor and current state, preserve financial precision, support safe retries where required, and return enough structured information for the client to understand the result without allowing the client to dictate accounting truth.**
