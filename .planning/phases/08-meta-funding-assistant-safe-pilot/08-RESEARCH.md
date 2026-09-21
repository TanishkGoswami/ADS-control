# Phase 8: Meta Funding Assistant Safe Pilot - Research

**Researched:** 2026-09-18
**Domain:** Chrome Manifest V3, NestJS authentication, Prisma transactional funding capture
**Confidence:** HIGH for repo architecture and core platform behavior; MEDIUM for Meta DOM selectors pending live inspection

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Release mode: safe pilot.
- Rollout: one operator, one PC, one Meta Business, 1-2 Ad Accounts.
- Funding options: approved Funding Requests and eligible direct Fund Lots from day one.
- Funding Requests are backed by an existing Fund Lot; direct Fund Lot selection bypasses the request wrapper.
- URL account identifiers are checked first, then cross-checked against visible page/modal context. A mismatch blocks confirmation.
- English Meta Billing UI and INR only for the pilot.
- Meta success creates a UI-observed state and review item, not a financial posting.
- Reuse the existing React/Vite, NestJS, Prisma, AuditLog, FundLot, Meta asset, and reconciliation patterns.
- Do not add BullMQ/Redis for the pilot; run targeted verification through the existing API.

### Required Capabilities

- Secure, revocable web and extension sessions bound to user and organization.
- One-time extension pairing and device revoke/heartbeat.
- Funding Request lifecycle, direct Fund Lot eligibility, and temporary reservation accounting.
- Idempotent top-up sessions and append-only events.
- Manifest V3 extension limited to approved Meta hosts and ADS Control API.
- Multi-signal detection: URL, dialog, amount, visible account, QR presence, success text.
- Shadow DOM mapping overlay and durable local retry queue.
- Web workspace for requests, activity, review, session timeline, and device management.

### the agent's Discretion

No explicit discretion section was provided in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- QR payload decoding, screenshots/OCR, payment automation, UPI/bank integration, network interception, Meta control modification, AI guessing, automatic ledger posting, and company-wide rollout.

### Acceptance

- One real pilot top-up creates exactly one session and ordered event history.
- Account mismatch, amount mismatch, duplicate success, missing mapping, cancellation, expiry, restart, and offline retry are handled without ledger side effects.
- No Meta token, extension credential, QR payload, payment credentials, full page HTML, or screenshot is logged.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-TOPUP-01 | Detect Meta billing amount, currency, QR presence, and Ad Account context without modifying Meta controls or payment behavior. | Isolated content script, read-only detector, confidence model, and sanitized evidence contract. |
| REQ-TOPUP-02 | Cross-check URL-derived account IDs against visible Meta page/modal context before automatic mapping. | URL-first parser plus independent visible-context detector; mismatch is a blocking result. |
| REQ-TOPUP-03 | Map a top-up to either an approved Funding Request or an eligible direct Fund Lot with server-side tenant, permission, currency, and balance validation. | Request principal, transactional eligibility check, reservation rows, and organization-scoped queries. |
| REQ-TOPUP-04 | Store idempotent top-up sessions and append-only event history; preserve detected and selected accounts separately. | Unique idempotency keys, immutable event records, and separate detected/selected account foreign keys. |
| REQ-TOPUP-05 | Treat Meta UI success as an observation requiring review; do not automatically post ledger entries in the pilot. | Split operational and financial states; targeted Meta refresh creates review evidence only. |
| REQ-TOPUP-06 | Pair and revoke extension devices using short-lived, organization-bound credentials. | One-time hashed pairing challenge, hashed opaque device token, expiry, heartbeat, and revocation checks. |
</phase_requirements>

## Summary

The phase should begin with authentication hardening, because the current API does not have a global authentication guard and derives the current user by splitting a predictable bearer token. The exact current token is returned as `token: \`mb_token_${user.id}_${Date.now()}\`` and `/auth/me` extracts `parts[2]` as the user ID. [VERIFIED: apps/api/src/modules/auth/auth.service.ts:112-128; apps/api/src/modules/auth/auth.controller.ts:16-29] Current browser auth is persisted under the exact keys `"auth_token"` and `"auth_user"` in `localStorage`. [VERIFIED: apps/web/src/features/auth/AuthContext.tsx:16-27,31-49] OWASP recommends meaningless CSPRNG session identifiers, server-side expiry, and avoiding authentication credentials in local storage. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html]

The minimal extension architecture is one new workspace package with a static MV3 manifest, one service-worker entry, one content-script entry, and a small React overlay mounted into a Shadow DOM. Vite supports multiple build entry points, while Chrome documents MV3 service workers as ephemeral and recommends extension storage as the source of truth. [CITED: https://vite.dev/guide/build] [CITED: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers] The content script reads only rendered Meta DOM and URL state, sends normalized evidence to the service worker, and never sends HTML, QR data, screenshots, or Meta credentials.

The database operation that confirms a mapping must be a short Prisma interactive transaction: re-read the authenticated tenant's request/lot/account, validate eligibility, create or reuse the idempotent session, create a reservation, and append the first event atomically. Prisma 6 documents interactive transactions for read-modify-write and unique constraints for idempotent retries. [CITED: https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions] [CITED: https://docs.prisma.io/docs/orm/reference/prisma-schema-reference]

**Primary recommendation:** implement auth boundary and domain invariants first, then the extension against fixture pages, then the web review workspace, and reserve real Meta DOM selectors for a final live-pilot calibration task.

## Actual Repo Findings

- The monorepo already includes `apps/*` and `packages/*`, so `apps/browser-extension` will be discovered without workspace configuration changes. [VERIFIED: pnpm-workspace.yaml:1-3]
- Installed package truth is React `^19.0.0`, Vite `^6.2.0`, NestJS `^11.0.11`, Prisma Client/CLI `^6.4.1`, Zod `^3.24.2`, and TypeScript `^5.8.2`; planning text that says Prisma 7+ is stale. [VERIFIED: apps/web/package.json; apps/api/package.json; packages/database/package.json]
- The API enables `origin: '*'` together with `credentials: true`; Phase 8 must replace this with an explicit allow-list before accepting extension credentials. [VERIFIED: apps/api/src/main.ts:14-19]
- Organization lookup currently accepts a caller-supplied organization ID if it exists and otherwise falls back to the first active organization. [VERIFIED: apps/api/src/common/prisma.service.ts:19-64] Funding APIs must never call this fallback for authenticated requests; they must use the organization ID attached by the auth guard.
- Meta list and sync methods accept optional `organizationId` and `userId`, and filtering can be influenced by request parameters. [VERIFIED: apps/api/src/modules/meta/meta.service.ts:16-40,105-134,158-175] New extension endpoints must ignore tenant/user identifiers from query/body input.
- `FundLot` uses BigInt minor units and the schema verbatim defines `status String @default("AVAILABLE") // AVAILABLE, ALLOCATED, SPENT, LOCKED, REFUNDED`, `currencyCode String @default("INR")`, and `@@unique([organizationId, lotCode])`. [VERIFIED: packages/database/prisma/schema.prisma:435-453]
- The allocation service already uses `this.prisma.$transaction(async (tx) => ...)` and atomic BigInt increment/decrement patterns. [VERIFIED: apps/api/src/modules/allocations/fund-allocation.service.ts:16-84,106-138] Reuse that transaction style, but do not call the ledger service from the pilot top-up flow.
- The current reconciliation service iterates every account and writes snapshots. [VERIFIED: apps/api/src/modules/reconciliation/reconciliation.service.ts:12-63] Add a targeted account-level method rather than invoking the full organization run after each observed success.
- Audit records support organization, actor, action, entity type/id, before/after JSON, IP, and timestamp. [VERIFIED: packages/database/prisma/schema.prisma:550-560] Reuse this structure with sanitized metadata; never place secrets or raw DOM in before/after JSON.
- Tests currently use Node's built-in test runner through `node --import tsx --test`; there is no browser test harness in the repo. [VERIFIED: apps/api/package.json; apps/api/test/ledger.spec.ts:1-23]

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|------------|--------------|----------------|-----------|
| DOM/URL observation | Content script | Service worker | DOM access stays isolated; worker receives normalized evidence only. |
| Overlay UI | Content script Shadow DOM | Web API | Overlay renders server-approved choices and never owns authorization. |
| Credential and retry queue | Service worker | `chrome.storage.local` | MV3 workers are ephemeral, so durable state cannot live in globals. [CITED: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers] |
| Authentication/tenant boundary | NestJS global guard | Prisma session tables | Every protected endpoint receives a verified principal. [CITED: https://docs.nestjs.com/security/authentication] |
| Eligibility/reservation/idempotency | Funding module service | PostgreSQL constraints | Server and database own financial concurrency invariants. |
| Meta verification | Existing API/Meta service | Reconciliation service | Pilot stays synchronous and account-targeted; no BullMQ. |
| Operator workflow | Existing React web app | TanStack Query | Requests, activity, review, timeline, devices live in the control plane. |

## Standard Stack

### Core

| Library/platform | Version | Purpose | Recommendation |
|------------------|---------|---------|----------------|
| TypeScript | `^5.8.2` | Shared types and all new code | Reuse exact repo version. [VERIFIED: package.json] |
| Vite | `^6.2.0` | Multi-entry extension build | Reuse; configure service-worker and content-script entries, copy static manifest/assets. [VERIFIED: apps/web/package.json] [CITED: https://vite.dev/guide/build] |
| React | `^19.0.0` | Shadow DOM overlay and funding workspace | Reuse existing UI stack. [VERIFIED: apps/web/package.json] |
| NestJS | `^11.0.11` | Auth guard and funding APIs | Register authentication globally and mark only login/pair claim/public legal routes public. [VERIFIED: apps/api/package.json] [CITED: https://docs.nestjs.com/security/authentication] |
| Prisma | `^6.4.1` | Sessions, devices, funding requests, reservations, top-up sessions/events | Stay on installed major for this phase; use interactive transactions and compound unique constraints. [VERIFIED: packages/database/package.json] |
| PostgreSQL | existing datasource | Constraint-backed idempotency and reservations | Schema source declares `provider = "postgresql"`. [VERIFIED: packages/database/prisma/schema.prisma:1-4] |
| Zod | `^3.24.2` | Shared extension/API message validation | Reuse shared package; reject unknown/untrusted DOM-derived fields. [VERIFIED: packages/shared/package.json] |

### New dependency

Only `@types/chrome` is justified as a development dependency for typed MV3 APIs. Registry lookup returned version `0.3.0`, no postinstall script, and a DefinitelyTyped repository, but the GSD legitimacy seam returned `SUS` solely because the latest publish was too recent. [VERIFIED: npm registry and package-legitimacy seam, 2026-09-18] Add a human verification checkpoint before installation; pin the resolved version in the lockfile. If not approved, use a small project-local declaration containing only the Chrome APIs actually called, marked as temporary technical debt. [ASSUMED]

Do not add a Chrome-extension framework, state library, queue, JWT package, crypto package, DOM parser, or test framework. Node `crypto`, Web Crypto, existing React/Zod, `chrome.*`, and `node:test` cover the pilot. [ASSUMED]

## Domain Model Recommendation

Add models with explicit organization ownership and relations to existing `UserProfile`, `AdAccount`, and `FundLot`. Proposed names and status values below are implementation recommendations, not existing repo values. [ASSUMED]

| Model | Minimum fields/invariants |
|-------|---------------------------|
| `WebSession` | `tokenHash @unique`, user/org, created/expires/lastSeen/revoked timestamps; never persist raw token. |
| `ExtensionPairingChallenge` | `codeHash @unique`, org/user, expires/claimed timestamps; one-time claim inside transaction. |
| `ExtensionDevice` | org/user, stable public device ID, name/version, token hash, status, lastSeen, revokedAt; unique `(organizationId, devicePublicId)`. |
| `FundingRequest` | org, reference code, source FundLot, optional target AdAccount, amount/currency, purpose, status, creator/approver timestamps; unique `(organizationId, referenceCode)`. |
| `TopupReservation` | org, FundLot, request/session, amount, status, expires/released/confirmed timestamps; at most one active reservation per session. |
| `MetaTopupSession` | org/device/operator; detected and selected AdAccount IDs separately; detected/confirmed amount and currency separately; operational status, financial status, detector version, confidence, idempotency key, expiry/version timestamps. |
| `MetaTopupEvent` | session, organization, monotonic sequence, event type, idempotency key, sanitized JSON metadata, occurred/received timestamps; unique `(organizationId, idempotencyKey)` and `(sessionId, sequence)`. |

Recommended proposed state sets: `FundingRequest = DRAFT | APPROVED | READY | USED | CANCELLED`; reservation = `ACTIVE | RELEASED | CONFIRMED | EXPIRED`; operational top-up = `DETECTED | MAPPED | UI_OBSERVED | CANCELLED | EXPIRED | REVIEW_REQUIRED`; financial review = `UNVERIFIED | CONFIRMED | REJECTED`. [ASSUMED] Keep them centralized in `packages/shared`; avoid duplicating string literals across API, web, and extension.

Reservation availability must be computed server-side as `currentAmountMinor - sum(active reservations)` and validated in the same transaction that creates the reservation. [ASSUMED] Because the existing `FundLot.currentAmountMinor` is business truth, the pilot must not decrement it on mapping or UI success; the reservation is a separate hold and final review remains non-ledger. This preserves the documented three-truth separation. [VERIFIED: .planning/PROJECT.md]

## API and Authentication Design

### Web session hardening

1. Generate at least 128 random bits with Node `crypto.randomBytes`, return the opaque token once, and store only SHA-256 token hash plus server-side principal/expiry/revocation data. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html]
2. Add a global Nest auth guard that hashes bearer tokens, loads an active non-expired session plus user/org, and attaches a typed principal to the request. Nest recommends a global guard when most routes are protected. [CITED: https://docs.nestjs.com/security/authentication]
3. Add role/policy checks for approve, review, device revoke, and direct Fund Lot usage. Authentication and authorization are separate concerns. [CITED: https://docs.nestjs.com/security/authorization]
4. Stop accepting organization/user identity from query/body for protected behavior. Scope every lookup by `principal.organizationId`, and enforce user-to-account access where applicable.
5. Prefer an `HttpOnly; Secure; SameSite=Strict` cookie for the web session and CSRF protection for mutations; do not continue the current local-storage bearer pattern. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html] The extension uses its separate bearer credential because extension storage cannot consume the site's HttpOnly cookie reliably across the API boundary. [ASSUMED]
6. Replace wildcard CORS with explicit deployed web origin and the exact `chrome-extension://<extension-id>` pilot origin. OWASP recommends origins be as specific as possible. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html]

### Pairing and device token flow

1. Authenticated web UI creates a random one-time pairing code/challenge with five-minute expiry; database stores only its hash. [ASSUMED]
2. Extension claims it once with generated `devicePublicId`, name, and version. Transaction checks challenge hash, org/user, expiry, and `claimedAt IS NULL`, then creates the device and returns a separate opaque device token once. [ASSUMED]
3. Service worker stores device token and queue in `chrome.storage.local`; content script never receives the token. Chrome notes that content-script web storage belongs to the host page, while extension storage is shared with the service worker. [CITED: https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies]
4. Every extension request validates token hash, device status, expiry, user status, organization status, route permission, and optional account access. Revoke immediately invalidates server use; heartbeat updates a throttled `lastSeenAt`. [ASSUMED]
5. Do not log raw pairing codes, web/device tokens, authorization headers, or token hashes. Log device/session IDs and a separate non-secret correlation ID. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html]

### Endpoint groups

- Web: requests list/create/approve/cancel, activity, review confirm/reject, device list/revoke, pairing create. [ASSUMED]
- Extension: pairing claim, heartbeat, bootstrap config/accounts, eligible funding options, top-up detect/map/event/cancel. [ASSUMED]
- All mutation endpoints require an `Idempotency-Key` header and return the original resource/result on exact replay; reuse with a different request fingerprint returns `409`. [ASSUMED]
- Top-up create/map/event operations write domain row, append-only event, and AuditLog in one database transaction. [ASSUMED]

## Extension Architecture

Use this minimal package shape. [ASSUMED]

```text
apps/browser-extension/
  public/manifest.json
  src/background.ts
  src/content.tsx
  src/detector.ts
  src/messages.ts
  src/storage.ts
  src/overlay/
  vite.config.ts
  package.json
  tsconfig.json
```

- `manifest.json`: MV3 service worker, `storage` permission, narrowly scoped Meta content-script matches, and only the ADS Control API in host permissions. Manifest host permissions control remote access and are disclosed at install. [CITED: https://developer.chrome.com/docs/extensions/reference/manifest]
- Avoid `tabs`, `webRequest`, `scripting`, `activeTab`, `<all_urls>`, cookies, downloads, and clipboard permissions unless a fixture proves one is essential. [ASSUMED]
- `externally_connectable` is unnecessary if pairing is entered in an extension popup/overlay. If website-driven pairing is implemented, restrict `matches` to the exact production ADS Control HTTPS origin and verify `sender.url` in `onMessageExternal`. [CITED: https://developer.chrome.com/docs/extensions/reference/manifest/externally-connectable] [CITED: https://developer.chrome.com/docs/extensions/develop/concepts/messaging]
- Bundle all executable code locally; MV3 disallows remote executable logic. Remote detector configuration may contain only declarative selectors/text patterns/version flags validated by Zod. [CITED: https://developer.chrome.com/docs/extensions/develop/migrate/improve-security]
- Content scripts run in an isolated world but consume attacker-controlled page DOM. Read text/attributes defensively, render dynamic values with React text nodes, and never use `innerHTML`. [CITED: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts] [CITED: https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure]

### Detection pipeline

1. Observe top-frame Meta billing routes only; debounce history/location and bounded `MutationObserver` signals. [ASSUMED]
2. Parse account candidates from allow-listed URL keys (`act`, then explicitly observed alternatives). Strip an optional `act_` prefix and accept digits only. Proposed keys are unverified until live inspection. [ASSUMED]
3. Locate a visible payment dialog and independently extract normalized amount, currency, visible account ID/name, QR presence, and state text. Never read canvas pixels or QR attributes beyond presence. [ASSUMED]
4. Match URL ID and visible ID to the server-provided allowed account list. Exact same ID yields high confidence; name-only evidence requires confirmation; mismatch yields a blocking state and review event. [ASSUMED]
5. Create a stable client session key from device ID + tab ID + normalized account + amount + currency + modal lifecycle nonce. Server idempotency remains authoritative. [ASSUMED]
6. Success text is only accepted for the currently mapped modal lifecycle and emits `UI_OBSERVED` once. Processing/failure/expired/closed states append events without financial effects. [ASSUMED]

Do not ship production selectors from screenshots. Phase planning must include a live DOM calibration checkpoint that captures only selector notes and sanitized fixtures, never customer HTML or QR material. Meta's private DOM and wording are the only LOW/MEDIUM-confidence part of this research. [ASSUMED]

### Durable queue

Store envelopes with local event ID, server idempotency key, session key, event type, sanitized payload, created time, attempt count, and next-attempt time. [ASSUMED] Service worker startup, alarm/heartbeat, and new messages all call the same drain function. Use bounded exponential backoff with jitter; delete only after a definitive 2xx replay response; pause on 401/revoked device; route permanent 4xx validation failures to visible extension status. [ASSUMED] Chrome states service workers terminate and restart, so global variables cannot be the queue source of truth. [CITED: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers]

## Idempotency and Concurrency

- Put uniqueness in PostgreSQL, not only service code: organization-scoped request references, pairing hashes, token hashes, device IDs, API idempotency keys, and `(sessionId, sequence)`. Prisma's `@@unique` maps to database unique constraints/indexes. [CITED: https://docs.prisma.io/docs/orm/reference/prisma-schema-reference]
- Store an idempotency request fingerprint and serialized result/resource ID. Same key + same fingerprint returns original result; same key + different fingerprint is a conflict. [ASSUMED]
- In mapping transaction, re-read FundLot and active reservation sum, validate currency/status/amount and account access, then create reservation and event. Use serializable isolation or a compare-and-update/version column to prevent two concurrent holds overspending the lot. [ASSUMED]
- Append events; never update an existing event. Session projection fields may update transactionally, but the event sequence is the audit source. [ASSUMED]
- Duplicate success retries append nothing after the first accepted success idempotency key and return the existing `UI_OBSERVED` result. [ASSUMED]
- Expiry/cancel/reject releases active reservation exactly once; review confirmation marks it confirmed but still does not call `LedgerService`. [ASSUMED]

## Targeted Verification

Refactor reconciliation behind `runForAdAccount(principal.organizationId, adAccountId)` and have the existing organization-wide loop call that method. [ASSUMED] After `UI_OBSERVED`, the funding service invokes a targeted Meta account refresh, then targeted reconciliation, and stores their IDs/status in the review evidence. Failure to refresh leaves the session reviewable as unverified; it does not retry in BullMQ and does not change FundLot or ledger state. [ASSUMED]

Meta access tokens are currently interpolated into request URLs and stored directly in `MetaConnection.tokenSecretReference`. [VERIFIED: apps/api/src/modules/meta/meta.service.ts:177-179,202-207,520-562,576-602] Phase 8 must not expose or copy these values into extension payloads, top-up events, audit logs, or client errors. Token-at-rest hardening beyond preventing new exposure is a separate security task unless required to make targeted refresh safe. [ASSUMED]

## Don't Hand-Roll

- Do not invent a signed token format; use opaque random identifiers with server-side records and Node crypto. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html]
- Do not implement an in-memory retry queue; use `chrome.storage.local`. [CITED: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers]
- Do not implement a custom DOM renderer; use existing React in a Shadow DOM root. [ASSUMED]
- Do not add a queue/worker; call the existing API synchronously and persist a reviewable failure state. [VERIFIED: .planning/phases/08-meta-funding-assistant-safe-pilot/08-CONTEXT.md]
- Do not infer payment completion from account balance movement alone, decode QR, intercept Meta network traffic, click controls, or scrape hidden framework state. [VERIFIED: .planning/phases/08-meta-funding-assistant-safe-pilot/08-CONTEXT.md]
- Do not reuse the web session token as the extension device credential. [ASSUMED]

## Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Treating URL `act` as final truth | Require an independent visible account match; block mismatches. |
| Trusting body/query tenant IDs | Derive user/org from the guard principal and include org in every query. |
| Reserving with a stale balance read | Re-read and create the reservation under one guarded transaction/concurrency strategy. |
| Worker globals lost on suspension | Persist credentials, queue, and last-known session references in extension storage. |
| MutationObserver storms | Observe a scoped root, debounce, hash normalized snapshots, disconnect on route exit. |
| Duplicate events after restart/offline | Stable idempotency key plus database unique constraint and replay result. |
| Secret leakage in diagnostics | Structured allow-list logging; no headers, tokens, DOM/HTML, QR, screenshots, or Meta responses containing tokens. |
| Confusing UI success with financial truth | Separate `UI_OBSERVED` and financial review; no ledger call in pilot. |
| Extension CORS overexposure | Exact HTTPS web origin and exact extension origin; no wildcard. |
| Remote selector config becoming remote code | JSON data only, Zod schema, version/min-version/kill-switch; no regex from server unless bounded and audited. |
| Meta UI drift | Detector versioning, kill switch, fixture regression tests, and live calibration before pilot. |

## Security Verification (ASVS-oriented)

- **Authentication/session:** unpredictable opaque tokens, hash at rest, expiry, revocation, logout/device revoke, inactive-user checks, no token logging. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html]
- **Access control:** global default-deny authentication, explicit public routes, role policies, tenant-scoped object lookup, account-access checks, cross-organization negative tests. [CITED: https://docs.nestjs.com/security/authentication] [CITED: https://docs.nestjs.com/security/authorization]
- **Input validation:** Zod/class-validator allow lists, positive BigInt amounts, INR-only, normalized digit-only Meta IDs, bounded strings/metadata, rejected unknown event transitions. [ASSUMED]
- **Data protection:** HTTPS in production, exact CORS, no credentials in URLs, raw tokens returned once, no sensitive cache/log fields. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html]
- **Business logic:** request approval ownership, direct-lot permission, reservation race tests, request amount/account match, transition matrix, expiry and duplicate handling. [ASSUMED]
- **Logging:** sanitized AuditLog for pairing, revoke, request approval, mapping, observation, review, and rejection; append-only top-up events for domain history. [VERIFIED: packages/database/prisma/schema.prisma:550-560]

## Validation Architecture

### Existing infrastructure

The API and shared packages run `node --import tsx --test`; there is no existing Vitest, Jest execution script, Playwright config, or extension harness. [VERIFIED: apps/api/package.json; packages/shared/package.json; apps/api/test/ledger.spec.ts:1-23] Keep Wave 0 on `node:test` and pure functions so the fast suite stays dependency-free.

### Wave 0 additions

- Pure shared tests for INR parsing/formatting, digit-only account normalization, URL candidate extraction, confidence/mismatch outcomes, event transition table, and idempotency fingerprinting. [ASSUMED]
- API unit tests with a narrow fake Prisma adapter for token hashing/expiry/revocation, pairing replay, authorization policy, and reservation eligibility. [ASSUMED]
- API integration tests against a disposable PostgreSQL test database are required for unique-key replay and concurrent reservation behavior; mocks cannot prove database constraints or transaction isolation. [ASSUMED]
- Extension fixture runner: export detector as a pure DOM function and execute against sanitized static HTML fixtures in a real unpacked-extension Chrome smoke test. Browser automation can remain a manual script if adding a harness would violate the minimal-dependency pilot, but real Chrome verification is mandatory before acceptance. [ASSUMED]

### Requirement-to-test map

| Requirement | Automated checks under 30 seconds | Pilot/manual check |
|-------------|-----------------------------------|--------------------|
| TOPUP-01/02 | parser + fixture tests for URL/visible ID, amount, currency, QR presence, mismatch | Real English Meta QR modal calibration and non-modification observation |
| TOPUP-03 | tenant/permission/currency/balance tests; concurrent reservation integration test | Approve request and select direct lot in web/overlay |
| TOPUP-04 | duplicate create/event retry, ordered sequence, detected vs selected account persistence | Browser restart/offline replay |
| TOPUP-05 | success creates review and zero ledger transactions | One real top-up reviewed without posting |
| TOPUP-06 | pairing expiry/replay, revoked device, heartbeat, cross-org denial | Pair one pilot machine then revoke it |

### Acceptance scenarios

1. Exact URL and visible account ID, matching INR amount, approved request: one session, one active reservation, ordered events, one review item after success, zero ledger writes. [ASSUMED]
2. URL/visible account mismatch: confirmation disabled, mismatch event recorded once, zero reservation and ledger writes. [ASSUMED]
3. Amount changes after mapping: prior reservation released or session moved to review; no silent remap. [ASSUMED]
4. Repeated DOM mutations and duplicate success: same server result, no duplicate session/event/reservation. [ASSUMED]
5. Close/expire/cancel: reservation released exactly once and session terminal. [ASSUMED]
6. Worker termination/browser restart/offline API: queued envelopes survive and replay idempotently. [ASSUMED]
7. Revoked/suspended device or cross-org IDs: `401/403`, queue pauses, no data disclosure. [ASSUMED]
8. Meta refresh failure: review shows unverified evidence; no financial or ledger side effect. [ASSUMED]

## Build and Delivery Sequence

1. Wave 0: shared contracts/tests, session schema, auth guard/public decorator, explicit CORS, and current-login migration. [ASSUMED]
2. Funding domain: Prisma models/migration, request lifecycle, direct-lot eligibility, reservation/idempotency transactions, append-only events, audit writes. [ASSUMED]
3. Extension shell: Vite multi-entry MV3 package, pairing/storage/messaging/retry queue, fixture-based detector, Shadow DOM overlay. [ASSUMED]
4. Verification/review: targeted Meta refresh/reconciliation, review actions, activity/timeline/device APIs. [ASSUMED]
5. Web workspace: route/navigation plus Requests, Activity, Review, Session detail, and Devices views using existing TanStack Query/API patterns. [ASSUMED]
6. Pilot calibration: inspect real Meta billing states, finalize selectors/rules, load unpacked extension, execute acceptance matrix with one operator/device and 1-2 accounts. [VERIFIED: .planning/phases/08-meta-funding-assistant-safe-pilot/08-CONTEXT.md]

## Environment Availability

| Dependency | Required by | Available | Observed version | Fallback/action |
|------------|-------------|-----------|------------------|-----------------|
| Node.js | all workspaces | Yes | `v24.15.0` | None. [VERIFIED: local command, 2026-09-18] |
| pnpm | monorepo | Yes | `12.4.2` | None. [VERIFIED: local command, 2026-09-18] |
| Google Chrome | unpacked pilot/smoke | Yes | `153.0.8010.52` | Use installed Chrome. [VERIFIED: local executable metadata, 2026-09-18] |
| PostgreSQL/Supabase | migration/integration tests | Configured by datasource | Runtime connectivity not tested | Planner must include a disposable test DB/checkpoint. [VERIFIED: packages/database/prisma/schema.prisma:1-4] |
| Redis/BullMQ | none in pilot | Not required | N/A | Explicitly excluded. [VERIFIED: 08-CONTEXT.md] |
| Browser automation | extension smoke | No repo harness found | N/A | Manual unpacked-extension smoke or add only an approved harness later. [VERIFIED: repo file scan, 2026-09-18] |

## Package Legitimacy Audit

| Package | Registry | Seam verdict | Postinstall | Disposition |
|---------|----------|--------------|-------------|-------------|
| `@types/chrome` | npm version `0.3.0` | `SUS` (`too-new`) | none | Human-verify before pinning; dev-only. [VERIFIED: npm registry and GSD seam, 2026-09-18] |

No other new package is recommended. [ASSUMED]

## Open Questions / Required Checkpoints

- Exact Meta Billing route patterns, URL parameter names beyond `act`, dialog selectors, account text location, amount format, QR marker, and success/failure/expired wording require live DOM inspection on the pilot account. [ASSUMED]
- Production ADS Control web/API origins and stable unpacked/enterprise extension ID are not present in repo config; exact CORS, host permissions, and `externally_connectable` values must be supplied at deployment. [VERIFIED: repo search, 2026-09-18]
- Database migration tooling currently has only `db:push` and no checked-in migrations directory. [VERIFIED: packages/database/package.json; packages/database/prisma file scan] Planner should include a named Prisma migration workflow appropriate to the deployment database before implementation is considered production-ready. [ASSUMED]

## Sources

- Chrome manifest and permissions: https://developer.chrome.com/docs/extensions/reference/manifest
- Chrome service-worker lifecycle: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers
- Chrome content scripts and security: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts and https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure
- Chrome storage/network/messaging: https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies, https://developer.chrome.com/docs/extensions/develop/concepts/network-requests, https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- Vite production/multi-page build: https://vite.dev/guide/build
- Prisma 6 transactions and schema uniqueness: https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions and https://docs.prisma.io/docs/orm/reference/prisma-schema-reference
- NestJS authentication/authorization: https://docs.nestjs.com/security/authentication and https://docs.nestjs.com/security/authorization
- OWASP session and REST guidance: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html and https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Repo architecture/auth/data patterns | HIGH | Source-of-truth files were read with exact line evidence. |
| MV3/Vite/Nest/Prisma approach | HIGH | Cross-checked against current official documentation and installed package metadata. |
| Session/pairing security | HIGH | OWASP guidance plus verified current auth weaknesses. |
| Prisma model/state recommendations | MEDIUM | Decision-complete proposal, but new schema and deployment migration remain to be implemented/tested. |
| Meta DOM detection | MEDIUM/LOW | Architecture is sound; selectors and wording cannot be verified without a real billing session. |

## Research Quality Check

- All requested domains were investigated: MV3/Vite, opaque sessions/pairing, Prisma domain, idempotency, DOM/URL detection, tests, and no-BullMQ execution.
- Critical security claims were checked against NestJS, Chrome, Prisma, and OWASP primary documentation.
- Repo discrete values are quoted only where their source files were opened in this session.
- The largest unresolved risk is intentionally surfaced: Meta DOM evidence needs a live pilot calibration before selectors are locked.
