---
phase: 08-meta-funding-assistant-safe-pilot
plan: 01
status: complete
completed: 2026-09-18
requirements: [REQ-TOPUP-06]
commits: []
---

# Phase 8 Plan 01: Auth and Pairing Tracer Summary

Implemented the tenant-bound security tracer from opaque web login through one-time extension pairing, authenticated heartbeat, replay rejection, and device revocation.

## Delivered

- Added `WebSession`, `ExtensionPairingChallenge`, and `ExtensionDevice` Prisma models plus a checked-in PostgreSQL migration.
- Replaced predictable `mb_token_*` credentials with random opaque tokens stored only as SHA-256 hashes with expiry and revocation state.
- Added a global default-deny Nest guard, `@Public()` escape hatch, and typed current actor derived from verified server-side session state.
- Added pairing create/claim, extension heartbeat, device revoke, and authenticated `/auth/me` endpoints.
- Replaced wildcard credentialed CORS with exact environment-configured web and Chrome extension origins.
- Updated web auth restoration to validate `/auth/me` and clear stale local state on `401`.
- Added a minimal MV3 extension service worker for pair claim, local credential storage, periodic heartbeat, and message handling.
- Added real HTTP tracer and negative security tests covering expiry, revoke, replay, inactive principals, cross-organization rejection, token hashing, and CORS policy.

## Verification

- `pnpm --filter @ads-control/database run db:generate` - passed
- `pnpm --filter @ads-control/api exec node --import tsx --test test/auth-pairing.spec.ts` - passed, 5/5
- `pnpm --filter @ads-control/api run build` - passed
- `pnpm --filter @ads-control/web run build` - passed with the pre-existing Vite chunk-size warning
- `pnpm --filter @ads-control/browser-extension run build` - passed

## Deviations

- Added `apps/api/src/common/cors-policy.ts` so the exact-origin policy can be unit tested without importing and booting `main.ts`.
- Stopped running workspace API watch processes temporarily because Windows locked Prisma's query-engine DLL during generation. They were not needed for verification.
- The checked-in migration was not applied to the live database; deployment remains a separate controlled operation.

## Git

No files were staged and no commit was created because this project is untracked in its parent repository, as requested.
