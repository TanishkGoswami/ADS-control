# Realtime Architecture

## Overview

Ye document Ads Control system ke realtime communication architecture ko define karta hai.

Realtime ka purpose hai UI ko quickly batana ki:

```text
Something changed.
```

Examples:

```text
New alert created

Meta sync completed

Approval updated

Vendor settlement posted

Client payment posted

Reconciliation case changed

Report became ready
```

Realtime ka purpose **financial transaction delivery** ya **canonical business truth maintain karna** nahi hai.

Core principle:

> **Realtime events are notification and invalidation signals. The frontend must always refetch authoritative state from the API before treating changed financial or operational data as truth.**

---

# 1. Realtime Technology

Recommended:

```text
Supabase Realtime
```

Primary V1 feature:

```text
Broadcast
```

Optional:

```text
Presence
```

Limited/legacy/special-purpose:

```text
Postgres Changes
```

Supabase currently provides Broadcast, Presence and Postgres Changes as its three primary Realtime capabilities.

---

# 2. V1 Realtime Decision

Recommended architecture:

```text
PostgreSQL
↓
Domain Transaction
↓
Transactional Outbox
↓
Outbox Worker
↓
Realtime Broadcast
↓
Browser
↓
Invalidate Query
↓
NestJS API Refetch
↓
Canonical Current State
```

---

# 3. Why Broadcast

Supabase currently recommends Broadcast for database-change subscriptions where scalability and security matter, while Postgres Changes is described as simpler but less scalable.

Therefore V1 default:

```text
PRIVATE BROADCAST CHANNELS
```

---

# 4. Realtime Is Not Event Bus

Do not replace:

```text
Transactional Outbox
+
BullMQ
```

with:

```text
Supabase Realtime
```

They solve different problems.

---

# 5. Outbox Purpose

Outbox guarantees:

```text
Important business event remains durable
even if Redis or Realtime is unavailable.
```

---

# 6. Realtime Purpose

Realtime answers:

```text
Which connected UI should refresh now?
```

---

# 7. Canonical Event Flow

Example:

```text
Vendor Settlement Posted
↓
PostgreSQL COMMIT
↓
VENDOR_SETTLEMENT_POSTED Outbox Event
↓
Outbox Worker
├── Queue reconciliation
├── Queue alerts
└── Broadcast UI invalidation
```

---

# 8. Never Broadcast Before Commit

Bad:

```text
Broadcast:
Vendor Settlement Posted

↓
DB transaction fails
```

UI would receive false event.

Correct:

```text
DB COMMIT
↓
Outbox
↓
Broadcast
```

---

# 9. Broadcast Failure

If financial transaction commits but Broadcast fails:

```text
Financial transaction remains valid.
```

Outbox/notification delivery can retry independently.

---

# 10. Realtime Failure Boundary

If Supabase Realtime goes down:

```text
Finance continues

API continues

Ledger continues

Meta workers continue

Reports continue
```

Only:

```text
instant UI updates
```

degrade.

---

# 11. Frontend Fallback

Without realtime:

```text
Manual refresh
+
Route navigation
+
Focused polling
```

must still provide correct state.

---

# 12. Realtime Should Improve UX

Realtime should never be required for:

```text
Financial correctness

Authorization

Ledger posting

Approval validation

Fund allocation
```

---

# 13. Private Channels

V1 should use:

```text
private channels
```

for internal application events.

Supabase Realtime Authorization can restrict Broadcast and Presence channel access through RLS policies on `realtime.messages`.

---

# 14. Public Channels

Do not use public channels for:

```text
Finance

Clients

Vendors

Meta accounts

Alerts

Approvals
```

---

# 15. Supabase Public Access Setting

Supabase allows projects to disable public channel access entirely. When disabled, channel joins are checked against Realtime authorization policies.

Recommended production:

```text
Allow Public Access:
DISABLED
```

unless a future feature explicitly requires public realtime.

---

# 16. Realtime Authorization

Authorization uses:

```text
realtime.messages
```

RLS policies.

Supabase evaluates:

```text
Auth JWT

Channel topic

RLS policy

requested Realtime capability
```

when a client joins an authorized channel.

---

# 17. Realtime Tenant Isolation

A user from:

```text
ORG-A
```

must never subscribe to:

```text
ORG-B
```

channels.

---

# 18. Channel Topic Design

Recommended naming:

```text
org:{organizationId}:events
```

Example:

```text
org:8dd5...:events
```

---

# 19. User Channel

For user-specific notifications:

```text
org:{organizationId}:user:{userId}
```

---

# 20. Entity Channels

Use only where necessary.

Examples:

```text
org:{orgId}:client:{clientId}

org:{orgId}:vendor:{vendorId}

org:{orgId}:ad-account:{adAccountId}
```

---

# 21. Avoid Channel Explosion

Do not subscribe every browser to:

```text
500 Ad Account channels
+
300 Client channels
+
100 Vendor channels
```

at once.

---

# 22. Preferred Subscription Model

Most pages can subscribe to:

```text
Organization Event Channel
```

then invalidate only affected queries.

---

# 23. Event Payload

Recommended small payload:

```text
{
  "eventId": "...",
  "eventType": "CLIENT_PAYMENT_POSTED",
  "entityType": "CLIENT",
  "entityId": "...",
  "occurredAt": "..."
}
```

---

# 24. Payload Should Not Contain Full Entity

Do not broadcast:

```text
Full client ledger

Vendor statement

Bank details

Meta access token

Complete financial record
```

---

# 25. Why Small Payloads

Benefits:

```text
Less sensitive exposure

Lower bandwidth

Less frontend coupling

Canonical state remains API-based
```

---

# 26. Invalidation Event

Realtime event should conceptually mean:

```text
"The state related to entity X changed."
```

not:

```text
"Replace your entire local financial object with this payload."
```

---

# 27. Frontend Flow

Example:

```text
CLIENT_PAYMENT_POSTED received
↓
Invalidate:
['clients', clientId]
['clients', clientId, 'payments']
['clients', clientId, 'financial-summary']
['dashboard']
↓
API refetch
```

---

# 28. Query Invalidation Registry

Frontend should maintain centralized mapping:

```text
eventType
→
query keys to invalidate
```

---

# 29. Example Registry

```text
CLIENT_PAYMENT_POSTED
→ Client summary
→ Client payments
→ Dashboard finance
```

---

# 30. Vendor Event

```text
VENDOR_SETTLEMENT_POSTED
```

invalidates:

```text
Vendor summary

Vendor settlements

Vendor payable

Vendor receivable

Dashboard
```

---

# 31. Meta Status Event

```text
AD_ACCOUNT_STATUS_CHANGED
```

invalidates:

```text
Ad Account detail

Meta Account list

Account health dashboard

Relevant alerts
```

---

# 32. Reconciliation Event

```text
RECONCILIATION_CASE_UPDATED
```

invalidates:

```text
Case detail

Reconciliation list

Dashboard unresolved count
```

---

# 33. Approval Event

```text
APPROVAL_STATUS_CHANGED
```

invalidates:

```text
Approval center

Related financial request

User notification count
```

---

# 34. Report Event

```text
REPORT_READY
```

invalidates:

```text
Report detail

Report list

Notifications
```

---

# 35. Realtime Event Types

Recommended V1 UI events:

```text
CLIENT_UPDATED

CLIENT_PAYMENT_POSTED

CLIENT_REFUND_UPDATED

VENDOR_UPDATED

VENDOR_FUNDING_POSTED

VENDOR_SETTLEMENT_POSTED

META_SYNC_UPDATED

AD_ACCOUNT_STATUS_CHANGED

ALERT_CREATED

ALERT_UPDATED

APPROVAL_STATUS_CHANGED

RECONCILIATION_CASE_UPDATED

REPORT_UPDATED
```

---

# 36. Domain Event vs UI Event

Do not expose every internal domain event directly.

Example internal:

```text
FUND_ALLOCATION_CONSUMPTION_REBUILT
```

may simply become UI signal:

```text
CLIENT_FINANCIAL_STATE_CHANGED
```

---

# 37. UI Event Adapter

Recommended:

```text
Domain Event
↓
RealtimeEventMapper
↓
UI Broadcast Event
```

---

# 38. Decoupling

This prevents frontend from becoming tightly coupled to backend internal event architecture.

---

# 39. Event Version

Include:

```text
eventVersion
```

Example:

```text
1
```

---

# 40. Unknown Event

Frontend should ignore/log unsupported future event safely.

Do not crash connection.

---

# 41. Event ID

Every broadcast should include:

```text
eventId
```

for diagnostics and optional client deduplication.

---

# 42. Duplicate Events

Clients must tolerate duplicate realtime delivery.

Receiving same:

```text
CLIENT_PAYMENT_POSTED
```

twice should merely trigger repeated safe query invalidation.

---

# 43. Event Ordering

Do not assume realtime delivery order alone is authoritative business ordering.

---

# 44. Example

Browser receives:

```text
CLIENT_UPDATED #102
```

then delayed:

```text
CLIENT_UPDATED #101
```

Frontend should not manually replace state from payload.

It refetches current API state.

---

# 45. Why Refetch Solves Ordering

API returns:

```text
latest canonical state
```

independent of broadcast order.

---

# 46. Realtime Replay

Even where provider replay features exist, Realtime should not be used as permanent history.

Supabase's current Realtime limits describe finite Broadcast replay retention, not permanent business-event storage.

Canonical history remains:

```text
PostgreSQL

Audit

Outbox

Domain records
```

---

# 47. Offline Browser

If browser is disconnected for 2 hours:

do not expect it to receive every historical event to rebuild state.

On reconnect:

```text
refetch active page/query state
```

---

# 48. Reconnect Flow

```text
WebSocket disconnected
↓
Reconnect
↓
Reauthenticate
↓
Rejoin channels
↓
Invalidate current critical queries
↓
Refetch
```

---

# 49. Reconnect Full Refresh

Recommended after meaningful disconnect:

```text
Dashboard

Current page

Alert badge

Approval badge
```

refresh.

---

# 50. Connection Status UI

Frontend may internally track:

```text
CONNECTED

CONNECTING

DISCONNECTED

ERROR
```

---

# 51. Do Not Alarm Normal Users

A brief WebSocket reconnect does not need giant system alert.

Use subtle fallback unless prolonged.

---

# 52. Realtime Degraded Banner

If prolonged:

```text
Live updates unavailable.
Data can still be refreshed manually.
```

---

# 53. Data Freshness Is Separate

Realtime connection:

```text
CONNECTED
```

does not mean Meta data itself is fresh.

Example:

```text
Realtime: Connected

Meta Spend: STALE
```

Both must remain separate.

---

# 54. JWT and Realtime

Realtime authorization uses user JWT during channel authorization.

Therefore channel connection must use current authenticated session.

---

# 55. Permission Changes

Supabase documentation notes Realtime authorization policy decisions are cached for the active connection and reevaluated when the client reconnects/subscribes or supplies a new JWT.

Therefore permission changes need explicit client refresh behavior.

---

# 56. Role Removal

If user's access is reduced:

backend should trigger:

```text
session/authorization refresh
```

and frontend should:

```text
refresh JWT

rejoin channels

invalidate protected data
```

---

# 57. Critical User Deactivation

For immediate security action:

```text
revoke session
```

rather than relying only on waiting for realtime authorization cache refresh.

---

# 58. JWT Expiry

Realtime should receive refreshed access token as session rotates.

Otherwise connection eventually loses authorization when token expires.

---

# 59. Realtime RLS

Policies should authorize topics based on:

```text
auth.uid()

Organization membership

Topic organization
```

---

# 60. Never Trust Topic String Alone

A user requesting:

```text
org:OTHER_ORG:events
```

must fail authorization.

---

# 61. Authorization Table

Could use existing:

```text
organization_members
```

to validate realtime topic access.

---

# 62. Topic Parsing

Realtime RLS should use controlled predictable topic format.

Do not create arbitrary user-provided topic strings with hidden semantics.

---

# 63. Private Channel Flag

Client should explicitly join private channels according to Supabase Realtime configuration.

---

# 64. Broadcast Sender

Recommended V1 sender:

```text
Trusted backend / Outbox Worker
```

rather than browsers broadcasting business events.

---

# 65. Browser Send Permission

Most Ads Control users do not need:

```text
Realtime Broadcast INSERT/send permission
```

for domain events.

---

# 66. Listen-Only Client

Prefer:

```text
Client can receive
```

without:

```text
Client can broadcast arbitrary financial events
```

---

# 67. Why

Otherwise malicious browser could emit fake:

```text
VENDOR_SETTLEMENT_POSTED
```

messages.

Even though API remains canonical, this could confuse UI.

---

# 68. Server-Only Business Broadcast

Backend sends trusted UI invalidation events after canonical changes.

---

# 69. Presence

Presence is optional.

Potential use:

```text
Show who is currently viewing a reconciliation case
```

or:

```text
User online state
```

---

# 70. Presence Not Needed V1

Core product can ship without Presence.

---

# 71. Presence Cost

Supabase recommends using Presence minimally because synchronization has computational overhead, and it is not intended for high-frequency state updates.

---

# 72. Do Not Use Presence For

```text
Financial locks

Editing ownership

Approval ownership

Transaction locking
```

---

# 73. Presence Is Advisory

"Finance User A is viewing this vendor"

does not mean:

```text
Finance User A owns exclusive settlement lock.
```

---

# 74. Financial Lock

Must remain:

```text
PostgreSQL transaction / lock
```

---

# 75. Postgres Changes

Supabase can stream database changes via logical replication.

However V1 should avoid using direct Postgres Changes broadly across financial tables.

---

# 76. Why Avoid Direct Postgres Changes

Concerns:

```text
Schema coupling

Potential high event volume

Sensitive row payloads

Frontend coupled to DB tables

Scaling considerations
```

---

# 77. Current Supabase Recommendation

Supabase currently recommends Broadcast over Postgres Changes for scalable and secure database change subscriptions.

---

# 78. Postgres Changes Performance

Supabase documents that Postgres Changes processing can become a bottleneck at scale, with changes processed serially to preserve ordering.

---

# 79. Direct Postgres Changes Allowed Cases

Possible limited use:

```text
Development

Low-frequency internal screen

Simple non-sensitive table
```

if deliberately chosen.

---

# 80. Not For Ledger

Do not broadly subscribe browser directly to:

```text
ledger_entries
```

---

# 81. Not For Financial Transactions

Do not use direct DB row events as the only signal for business meaning.

One business event may write:

```text
Payment

Ledger Transaction

2 Ledger Entries

Fund Lot

Outbox Event
```

A browser receiving all row changes independently could observe temporary/complex partial semantics.

---

# 82. Business Event Is Better

Instead broadcast:

```text
CLIENT_PAYMENT_POSTED
```

after transaction commit.

---

# 83. Database Broadcast

Supabase supports broadcasting from Postgres through database functions/triggers.

This can be useful but must be used carefully.

---

# 84. V1 Recommendation

Prefer:

```text
Transactional Outbox
↓
Worker
↓
Broadcast
```

over triggers on every business table.

---

# 85. Why Not Trigger Everything

Otherwise:

```text
Database schema
```

becomes tightly coupled to:

```text
Frontend realtime protocol
```

---

# 86. Selective Database Broadcast

Can be considered for:

```text
notifications
```

or very simple server-owned invalidation records later.

---

# 87. Realtime Event Storage

Do not create duplicate permanent business history only because event was broadcast.

Permanent history already exists in:

```text
Audit

Outbox

Domain records
```

---

# 88. Notification Record

If a user notification must survive offline periods:

create canonical:

```text
notifications
```

row.

Then Broadcast:

```text
NOTIFICATION_CREATED
```

---

# 89. Notification Badge

On login/reconnect:

```text
GET unread notifications
```

from API/database.

Do not derive unread count from events received during current WebSocket session.

---

# 90. Alerts

Same principle.

Alerts are PostgreSQL records.

Realtime merely says:

```text
Alert state changed.
```

---

# 91. Approval Requests

Approval request must exist in PostgreSQL.

Realtime says:

```text
Approval queue changed.
```

---

# 92. Report Ready

Report readiness stored:

```text
ReportRequest.status = READY
```

Broadcast simply accelerates UI update.

---

# 93. Sync Progress

Realtime can be useful for:

```text
Meta Sync progress
```

but canonical progress remains:

```text
SyncRun
```

---

# 94. Sync Progress Event

Example:

```text
{
  "eventType": "META_SYNC_UPDATED",
  "syncRunId": "...",
  "connectionId": "..."
}
```

Frontend refetches SyncRun.

---

# 95. Progress Frequency

Do not broadcast after every Meta API row.

---

# 96. Progress Throttling

For large backfill:

broadcast at meaningful milestones:

```text
Job started

Chunk completed

Status changed

Job finished
```

---

# 97. Avoid Event Storm

Example bad design:

```text
10,000 SpendFact rows
=
10,000 browser broadcasts
```

Prefer:

```text
SPEND_SYNC_UPDATED
```

for affected account/date range.

---

# 98. Coalescing

Realtime adapter may coalesce repeated updates within short interval.

Example:

```text
20 campaign rows updated
↓
1 AD_ACCOUNT_DATA_CHANGED event
```

---

# 99. Coalescing Is UX Optimization

It must not alter canonical outbox/domain events required for business processing.

Only UI Broadcast may be coalesced.

---

# 100. Channel Lifetime

Frontend subscribes when authenticated dashboard layout mounts.

Unsubscribe when:

```text
Logout

Organization switch

Component/entity subscription no longer needed
```

---

# 101. Channel Cleanup

Use proper Supabase channel removal/unsubscribe flow to avoid unnecessary active subscriptions.

---

# 102. Organization Switch

Flow:

```text
Leave ORG-A channels
↓
Clear ORG-A query cache
↓
Load ORG-B authorization
↓
Join ORG-B channels
↓
Fetch ORG-B data
```

---

# 103. Never Subscribe To Multiple Tenants Accidentally

Organization switch must aggressively clean previous tenant subscriptions.

---

# 104. Logout

On logout:

```text
Remove channels

Clear query cache

Clear sensitive UI state

Terminate session
```

---

# 105. Realtime Provider

Recommended frontend component:

```text
RealtimeProvider
```

Responsibilities:

```text
Open channel

Refresh token

Handle reconnect

Route events

Clean up
```

---

# 106. Do Not Put Business Logic in Provider

Provider should not calculate:

```text
new vendor payable
```

It routes invalidation signals.

---

# 107. Realtime Event Router

Conceptually:

```text
RealtimeProvider
↓
RealtimeEventRouter
↓
QueryInvalidationRegistry
```

---

# 108. Example

```text
eventType:
ALERT_CREATED
```

router:

```text
invalidate ['alerts']
invalidate ['dashboard']
```

---

# 109. Query Invalidation Debounce

Multiple events arriving close together can be grouped.

Example:

```text
5 vendor events in 200 ms
↓
1 vendor summary refetch
```

---

# 110. Avoid Refetch Storm

Do not refetch entire dashboard on every small event.

Invalidate narrowly.

---

# 111. Global Events

Examples that may justify dashboard invalidation:

```text
FINANCIAL_STATE_CHANGED

CRITICAL_ALERT_CHANGED
```

---

# 112. Entity-Specific Events

Invalidate only entity.

Example:

```text
CLIENT_UPDATED
```

---

# 113. Current Page Priority

If user is currently viewing:

```text
Vendor Ram
```

vendor event may refresh detail quickly.

Background pages need not refetch immediately.

---

# 114. Browser Tab Visibility

Optional optimization:

if tab is hidden:

```text
defer non-critical refetch
```

and refresh on focus.

---

# 115. Critical Alert

Could still trigger notification badge while hidden.

---

# 116. TanStack Query Integration

Realtime callback should generally call:

```text
queryClient.invalidateQueries(...)
```

not manually patch deeply nested financial cache.

---

# 117. Cache Patching

Safe only for simple non-financial UI state where payload is authoritative enough.

V1 financial state:

```text
prefer refetch
```

---

# 118. API Refetch Authorization

Even if realtime event leaks somehow, API authorization still prevents unauthorized data fetch.

Defense in depth.

---

# 119. Event Payload Authorization

Still protect broadcast payload because:

```text
Entity IDs

Client existence

Alert type
```

can themselves be sensitive metadata.

---

# 120. Topic Authorization

Private channel RLS therefore remains required.

---

# 121. Realtime Limits

Supabase applies limits to:

```text
Concurrent connections

Channels

Channel joins

Message throughput

Payload size
```

according to plan.

Architecture should not assume infinite realtime capacity.

---

# 122. Connection Efficiency

Prefer:

```text
1 organization channel
```

plus limited special channels over hundreds of unnecessary channels.

---

# 123. Payload Limit

Keep event payload tiny.

Do not broadcast files or huge JSON snapshots.

---

# 124. Attachments

Broadcast only:

```text
ATTACHMENT_UPDATED
```

with entity ID.

File fetched separately through authorized API/signed URL.

---

# 125. Large Data

Never send:

```text
ledger export
```

through realtime.

Use Storage.

---

# 126. Presence Frequency

Do not send cursor/mouse events in this application.

No need.

---

# 127. Metrics

Track:

```text
Realtime connection errors

Reconnect count

Channel join failures

Broadcast failures

Events sent

Event type volume

Client invalidation rate
```

---

# 128. Provider Logs

Supabase Realtime provides service logs/diagnostics useful for troubleshooting limits and connection failures.

---

# 129. App Logs

Backend broadcast failure log:

```text
eventId

organizationId

eventType

error

attempt
```

No sensitive payload.

---

# 130. Client Logs

Avoid logging full sensitive event payload in browser production console.

---

# 131. Broadcast Retry

Realtime notification retry can be best-effort.

Do not endlessly retry old UI invalidations.

Because:

```text
API polling / page refresh
```

can recover current state.

---

# 132. Outbox Event Retry vs Broadcast Retry

Important distinction.

Business event processing:

```text
must retry durably
```

UI broadcast:

```text
can eventually expire
```

once downstream durable processing is complete.

---

# 133. Example

`CLIENT_PAYMENT_POSTED` outbox event consumers:

```text
Reconciliation
→ must succeed/retry

Alert calculation
→ must succeed/retry

Realtime Broadcast
→ best-effort UX
```

---

# 134. Broadcast Delivery Record

No need for permanent delivery acknowledgement per browser.

---

# 135. Notifications Need Persistence

If user must see message later:

create notification row.

---

# 136. Realtime Ack

WebSocket delivery acknowledgement is not business acknowledgement.

---

# 137. Alert Acknowledge

User must call:

```text
POST /alerts/{id}/acknowledge
```

Realtime receipt does not acknowledge alert.

---

# 138. Approval Receipt

Receiving:

```text
APPROVAL_CREATED
```

does not mean user approved or even read it.

---

# 139. Multi-Tab Browser

Same user may have multiple tabs.

Each may receive event.

This is okay.

---

# 140. Duplicate Refetch Across Tabs

Can be optimized later.

Correctness does not require cross-tab coordination.

---

# 141. BroadcastChannel API

Browser-native cross-tab coordination may be introduced later if excessive duplicate fetching occurs.

Not required V1.

---

# 142. Realtime Security Test

Must test:

```text
ORG-A user can join ORG-A channel

ORG-A user cannot join ORG-B channel

Logged-out user cannot join private internal channel

User after permission removal loses access after auth refresh/reconnect
```

---

# 143. Client Send Test

Normal browser should not be able to emit protected business-domain broadcast events.

---

# 144. Reconnect Test

Disconnect network.

Change data elsewhere.

Reconnect.

Expected:

```text
Current page refetches authoritative current state
```

even if intermediate events were missed.

---

# 145. Duplicate Event Test

Send same event twice.

Expected:

```text
No duplicate financial side effect

Safe duplicate query invalidation
```

---

# 146. Out-of-Order Test

Send update events out of order.

Expected:

```text
Latest API data shown
```

---

# 147. Realtime Down Test

Disable Supabase Realtime.

Expected:

```text
Application continues to function

Manual refresh works

Financial actions work

Realtime status becomes degraded
```

---

# 148. Event Storm Test

Simulate large Meta sync.

Ensure browser receives aggregated events, not one message per DB row.

---

# 149. Permission Change Test

User viewing Vendor page.

Admin removes Vendor scope.

Expected:

```text
Authorization refresh

Channel access removed

API Vendor request denied

Cached vendor data cleared
```

---

# 150. Organization Switch Test

Ensure old organization realtime events never update new organization UI.

---

# 151. Realtime Channel Naming Standard

Recommended:

```text
org:{orgId}:events

org:{orgId}:user:{userId}
```

Optional:

```text
org:{orgId}:entity:{entityType}:{entityId}
```

---

# 152. Avoid Human Names In Topics

Bad:

```text
org:Metabull Universe:client:Alpha
```

Names change and may expose business information.

Use UUIDs.

---

# 153. Event Schema

Recommended:

```text
RealtimeEvent {
  eventId: string
  eventVersion: number
  eventType: string
  organizationId: string
  entityType?: string
  entityId?: string
  occurredAt: string
  metadata?: small-safe-object
}
```

---

# 154. Organization ID In Payload

Useful for defensive verification.

Frontend discards event whose:

```text
organizationId
```

does not match active organization.

---

# 155. Frontend Defensive Check

Even with channel authorization:

```text
if event.organizationId !== activeOrganizationId
  ignore
```

Defense in depth.

---

# 156. Event Metadata

Allowed:

```text
syncRunId

alertId

reportId
```

Avoid full sensitive objects.

---

# 157. Event Schema Validation

Frontend validates realtime payload using:

```text
Zod
```

or equivalent before processing.

---

# 158. Invalid Event

Ignore and log diagnostic safely.

---

# 159. Backend Broadcast Schema

Backend should generate events through central:

```text
RealtimePublisher
```

---

# 160. RealtimePublisher

Responsibilities:

```text
Topic construction

Payload validation

Event version

Secret-safe logging

Broadcast send
```

---

# 161. No Scattered Broadcast Calls

Bad:

```text
supabase.channel(...).send(...)
```

inside random finance services.

---

# 162. Domain Services

Domain services emit durable domain/outbox events.

Realtime adapter handles UX delivery.

---

# 163. Event Fan-Out

One domain event may map to:

```text
Organization broadcast

Specific user notification
```

without changing source transaction.

---

# 164. Example Approval

```text
REFUND_APPROVAL_REQUESTED
```

may create:

```text
Notification rows for approvers
```

and broadcast:

```text
NOTIFICATION_CREATED
```

to relevant users.

---

# 165. Sensitive Targeting

Do not broadcast approval existence to entire organization if only Finance Approvers should know it.

---

# 166. User-Specific Topics

Use:

```text
org:{orgId}:user:{userId}
```

for sensitive targeted notifications.

---

# 167. Role-Based Group Channel

Avoid complex:

```text
role:finance
```

topics initially because role memberships can change.

User-specific persistent notifications are simpler and safer.

---

# 168. Organization Events

Use for broadly visible operational changes only.

---

# 169. Realtime Authorization Cache

Because authorization is not reevaluated for every individual message, security-sensitive membership changes should trigger session/JWT refresh rather than assuming existing channel state immediately changes itself.

---

# 170. Permission Revocation Priority

For critical revocation:

```text
Revoke session
```

is stronger than waiting for channel reconnect.

---

# 171. UI Freshness After Mutation

Current user who posts transaction already receives API response.

Do not depend on realtime to update their own page.

Mutation handler should immediately invalidate relevant queries.

Realtime primarily helps:

```text
other tabs/users
```

---

# 172. Same-User Event

Receiving same mutation event afterward is harmless due idempotent invalidation.

---

# 173. Realtime State Should Be Ephemeral

Do not persist arbitrary WebSocket state into business tables.

---

# 174. Online User Count

If Presence later enabled:

online count should remain advisory.

Not used for security decisions.

---

# 175. Collaboration Lock

If two users edit same client metadata:

use:

```text
optimistic concurrency version
```

not Presence.

---

# 176. Financial Conflict

Use:

```text
DB transaction + row locks
```

not "someone else is online" logic.

---

# 177. System Architecture Relationship

```text
PostgreSQL
=
Truth

NestJS
=
Business Authority

Outbox/BullMQ
=
Durable Async Processing

Supabase Realtime
=
Live UX Signal

TanStack Query
=
Frontend Server-State Cache
```

---

# 178. V1 Realtime Features

Required:

```text
Private authenticated channels

Organization event channel

User notification channel

Central RealtimePublisher

Frontend RealtimeProvider

Event schema validation

Query invalidation

Reconnect handling

Channel cleanup

Tenant validation

Fallback/manual refresh
```

---

# 179. Optional V1 Features

Could include:

```text
Sync progress updates

Realtime alert badge

Report-ready notification
```

---

# 180. Not Needed V1

Avoid:

```text
Presence-heavy collaboration

Realtime chat

Cursor tracking

Direct financial-table subscriptions

Realtime-based distributed locks

Browser-originated business Broadcasts
```

---

# 181. Future Possibilities

Possible:

```text
Collaborative reconciliation review

Live assignment presence

Realtime comments

Cross-device notifications
```

without changing financial authority model.

---

# 182. Realtime Integrity Rules

System must enforce:

```text
1. Realtime must never be canonical business or financial truth.

2. PostgreSQL remains authoritative.

3. Important domain events must first be durably committed.

4. Transactional outbox must remain separate from realtime delivery.

5. Broadcast should happen only after source transaction commits.

6. A realtime failure must never roll back a committed financial transaction.

7. Frontend must use realtime primarily to invalidate/refetch canonical API data.

8. Financial state must not be replaced directly from arbitrary broadcast payloads.

9. Production internal channels must be private.

10. Realtime channel access must be tenant-authorized.

11. Users must never receive another organization's events.

12. Browser clients should not be allowed to emit trusted business-domain events.

13. Event payloads must remain small and free of secrets.

14. Meta tokens, bank details and complete ledger records must never be broadcast.

15. Duplicate realtime events must be harmless.

16. Out-of-order events must not corrupt frontend state.

17. Reconnecting clients must refetch relevant canonical state.

18. Missed events must never make the application permanently inconsistent.

19. Notifications that must survive offline periods must be stored in PostgreSQL.

20. Alert acknowledgement must require an API command; message receipt is not acknowledgement.

21. Approval receipt is not approval.

22. Presence must never be used as a financial lock.

23. PostgreSQL locks must remain the final concurrency protection for money.

24. Direct Postgres Changes subscriptions should not be the default for sensitive financial tables.

25. Event storms from bulk Meta syncs should be aggregated/coalesced for UI delivery.

26. Realtime subscription count and payload size must remain controlled.

27. Organization switching must remove old subscriptions and caches.

28. Logout must remove channels and clear sensitive cached data.

29. Security-sensitive role changes must refresh/revoke realtime authorization appropriately.

30. The product must remain operational if Supabase Realtime is unavailable.
```

---

# 183. Realtime Golden Rule

> **Realtime tells the user that something changed; it does not tell the system what the truth is. Every durable change must first exist in PostgreSQL, every important asynchronous consequence must survive through the outbox/worker architecture, and every connected UI must treat realtime messages as secure invalidation signals that lead back to the authenticated API for authoritative state.**
