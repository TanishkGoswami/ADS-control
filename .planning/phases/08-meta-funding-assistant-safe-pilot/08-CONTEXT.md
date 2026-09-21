# Phase 8 Context: Meta Funding Assistant Safe Pilot

## Goal

Build an internal Chrome MV3 companion that observes Meta Billing top-ups, identifies the correct Ad Account and amount, maps the event to approved internal funding, captures Meta UI success, and routes the observation through ADS Control review without performing payment or automatic ledger posting.

## Locked Decisions

- Release mode: safe pilot.
- Rollout: one operator, one PC, one Meta Business, 1-2 Ad Accounts.
- Funding options: approved Funding Requests and eligible direct Fund Lots from day one.
- Funding Requests are backed by an existing Fund Lot; direct Fund Lot selection bypasses the request wrapper.
- URL account identifiers are checked first, then cross-checked against visible page/modal context. A mismatch blocks confirmation.
- English Meta Billing UI and INR only for the pilot.
- Meta success creates a UI-observed state and review item, not a financial posting.
- Reuse the existing React/Vite, NestJS, Prisma, AuditLog, FundLot, Meta asset, and reconciliation patterns.
- Do not add BullMQ/Redis for the pilot; run targeted verification through the existing API.

## Required Capabilities

- Secure, revocable web and extension sessions bound to user and organization.
- One-time extension pairing and device revoke/heartbeat.
- Funding Request lifecycle, direct Fund Lot eligibility, and temporary reservation accounting.
- Idempotent top-up sessions and append-only events.
- Manifest V3 extension limited to approved Meta hosts and ADS Control API.
- Multi-signal detection: URL, dialog, amount, visible account, QR presence, success text.
- Shadow DOM mapping overlay and durable local retry queue.
- Web workspace for requests, activity, review, session timeline, and device management.

## Out of Scope

- QR payload decoding, screenshots/OCR, payment automation, UPI/bank integration, network interception, Meta control modification, AI guessing, automatic ledger posting, and company-wide rollout.

## Acceptance

- One real pilot top-up creates exactly one session and ordered event history.
- Account mismatch, amount mismatch, duplicate success, missing mapping, cancellation, expiry, restart, and offline retry are handled without ledger side effects.
- No Meta token, extension credential, QR payload, payment credentials, full page HTML, or screenshot is logged.
