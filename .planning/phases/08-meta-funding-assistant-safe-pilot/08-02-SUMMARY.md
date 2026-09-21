---
phase: 08-meta-funding-assistant-safe-pilot
plan: 02
subsystem: payments
tags: [typescript, zod, prisma, postgres, idempotency, reservations]
requires:
  - phase: 08-meta-funding-assistant-safe-pilot
    provides: Opaque tenant-bound sessions and extension device identity from Plan 08-01
provides:
  - Strict shared INR top-up contracts and pure evidence/state helpers
  - Tenant-scoped funding requests, top-up sessions, append-only events, and reservations
  - PostgreSQL constraints and indexes for idempotency and reservation safety
affects: [08-03-meta-funding-api, 08-04-browser-extension, 08-05-meta-funding-web]
actuals:
  tokens: 17221
  tasks: 2
  commits: 0
tech-stack:
  added: []
  patterns: [decimal minor-unit wire strings, separate operational and financial states, canonical idempotency input]
key-files:
  created:
    - packages/shared/src/topup/domain.ts
    - packages/shared/test/topup-domain.test.ts
    - packages/database/prisma/migrations/20260918_phase8_topup_domain/migration.sql
  modified:
    - packages/shared/src/enums/index.ts
    - packages/shared/src/types/index.ts
    - packages/shared/src/schemas/index.ts
    - packages/shared/src/index.ts
    - packages/database/prisma/schema.prisma
key-decisions:
  - "All top-up wire amounts are positive decimal minor-unit strings; BigInt conversion happens only after validation."
  - "Detected and selected account evidence remains separate, and account ID mismatch is a blocked confidence result."
  - "A session owns at most one reservation; reservations never mutate FundLot balance and have no ledger relation."
requirements-completed: [REQ-TOPUP-03, REQ-TOPUP-04, REQ-TOPUP-05]
coverage:
  - id: D1
    description: Exact INR parsing, account evidence evaluation, state transitions, and canonical fingerprint input
    requirement: REQ-TOPUP-04
    verification:
      - kind: unit
        ref: packages/shared/test/topup-domain.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Funding and top-up persistence with tenant-scoped uniqueness and no ledger side effects
    requirement: REQ-TOPUP-03
    verification:
      - kind: other
        ref: prisma validate, prisma generate, and database package build
        status: pass
    human_judgment: false
  - id: D3
    description: Operational observation and financial review states are represented independently
    requirement: REQ-TOPUP-05
    verification:
      - kind: unit
        ref: packages/shared/test/topup-domain.test.ts#operational transitions remain separate from financial review
        status: pass
    human_judgment: false
duration: 31min
completed: 2026-09-18
status: complete
---

# Phase 8 Plan 02: Top-up Domain Foundation Summary

**Strict INR and account-evidence contracts backed by tenant-scoped Prisma persistence, append-only events, and ledger-independent reservations**

## Performance

- **Duration:** 31 min
- **Completed:** 2026-09-18
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added shared enums, DTO types, strict Zod contracts, exact INR parsing, account normalization, confidence evaluation, transition validation, and canonical idempotency input.
- Added FundingRequest, MetaTopupSession, MetaTopupEvent, and TopupReservation persistence with tenant-scoped keys, operational indexes, and database checks.
- Kept UI observations, financial review, reservations, FundLot balances, and ledger transactions explicitly separate.

## Task Commits

No files were staged or committed, per the execution request. The containing parent repository has no valid `HEAD` and treats this project as untracked.

## Files Created/Modified

- `packages/shared/src/topup/domain.ts` - Pure money, evidence, transition, and fingerprint helpers.
- `packages/shared/test/topup-domain.test.ts` - Seven deterministic domain tests.
- `packages/shared/src/enums/index.ts` - Funding, confidence, operational, review, and reservation states.
- `packages/shared/src/types/index.ts` - Shared top-up and funding wire DTOs.
- `packages/shared/src/schemas/index.ts` - Strict bounded Zod contracts for untrusted extension input.
- `packages/database/prisma/schema.prisma` - Four top-up domain models and explicit relations.
- `packages/database/prisma/migrations/20260918_phase8_topup_domain/migration.sql` - PostgreSQL DDL, checks, indexes, uniqueness, and foreign keys.

## Decisions Made

- Account IDs are normalized to digits, but URL and visible evidence are never merged into one source field.
- Funding source type is constrained to either a Funding Request or direct Fund Lot; the session always stores the resolved Fund Lot.
- Events omit `updatedAt` and are modeled as sequence-ordered create-only records for the API layer to enforce as append-only.
- Reservation ownership is unique per session and does not decrement `FundLot.currentAmountMinor`.

## Deviations from Plan

None in product scope. Git commits were intentionally skipped because the user explicitly prohibited staging and committing.

## Issues Encountered

- Windows held Prisma's query-engine DLL through an IDE-launched `node dist/main.js` process. Only that child API process was stopped; Prisma generation then passed.
- The migration was checked in but was not applied to the live database, as required.

## Verification

- Shared top-up tests: passed, 7/7.
- Shared TypeScript build: passed.
- Prisma schema validation: passed.
- Prisma client generation: passed and exposes all four model delegates.
- Database TypeScript build: passed.
- API downstream build: passed.
- Static migration scan: no ledger references and no FundLot balance mutation.

## User Setup Required

None. Applying the migration remains a separate controlled deployment action.

## Next Phase Readiness

Plan 08-03 can implement tenant-scoped funding APIs and atomic reservation transactions using these shared contracts and generated Prisma models.

## Self-Check: PASSED

All planned source, test, migration, and summary files exist. Verification passed without staging, committing, or applying the migration to the live database.

---
*Phase: 08-meta-funding-assistant-safe-pilot*
*Completed: 2026-09-18*
