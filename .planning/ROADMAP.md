# Implementation Roadmap

## Milestone 1: Core Foundation & Ledger Engine
- [x] **Phase 1: Monorepo Setup & Database Architecture**
  - Setup pnpm workspace, `packages/shared` (types, enums, Zod validation, minor-unit money utils).
  - Setup `packages/database` (Prisma ORM schema with all 22 entities from `DATA/03-DATABASE-SCHEMA.md`, migrations, seeders).
- [x] **Phase 2: NestJS Backend Core & Double-Entry Ledger Engine**
  - Setup NestJS API modular monolith with Swagger OpenAPI.
  - Implement `LedgerService` with ACID double-entry posting, immutable correction flows, and minor-unit BigInt precision.
  - Implement `FundAllocationService` (Lot creation, FIFO/specific consumption, status transitions).
  - Implement Client Wallets & Job Budget endpoints.
  - Implement Vendor Funding Batches, Repayment & Overpayment Receivable logic.

## Milestone 2: Meta Sync, Worker Pipeline & Reconciliation
- [x] **Phase 3: Meta Marketing Connector & Asset Mapper**
  - Implement Meta API service (and local Mock Provider) for Asset discovery and daily spend facts.
  - Setup modular sync triggers for Account Status and Daily Spend.
- [x] **Phase 4: Three-Way Reconciliation & Alert Center**
  - Implement 3-way Truth Comparator (Meta Truth vs Ledger Truth vs Business Fund Lots).
  - Implement Alert Rules Engine with severity handling and status resolution.
  - Implement immutable Audit Trail recording.

## Milestone 3: React 19 Frontend Dashboard & Polish
- [x] **Phase 5: React + TypeScript Frontend Core & Navigation**
  - Initialize Vite + React 19 + TypeScript + Tailwind CSS + shadcn/ui.
  - Build App Shell, Sidebar, Navigation, Org context, and Theme provider.
  - Setup API Client with TanStack Query and fallback mock datasets for instant local execution.
- [x] **Phase 6: Operational & Financial Feature Screens**
  - Executive Dashboard with live KPI counters and spend trends.
  - Meta Hierarchy Explorer & Ad Account detail page with multi-owner fund breakdown.
  - Client Management, Wallets, and Leftover Fund resolution wizard.
  - Vendor Hub with funding batches and receivable tracking.
  - Financial Ledger stream & Fund Lot Inspector with Dr/Cr splits.
  - Reconciliation Workbench & Alert Center.
- [x] **Phase 7: End-to-End Verification & Documentation**
  - Full monorepo clean build passing across `@ads-control/shared`, `@ads-control/database`, `@ads-control/api`, and `@ads-control/web`.
  - Comprehensive unit tests covering paise conversion, Indian currency formatting, and double-entry balance invariants.

## Milestone 4: Meta Funding Capture
- [ ] **Phase 8: Meta Funding Assistant Safe Pilot**
  - Harden authenticated user and organization boundaries for extension access.
  - Add Funding Requests, extension devices, top-up sessions/events, and temporary reservations.
  - Build the Meta-only Manifest V3 companion extension with URL-first account detection, DOM cross-checks, and durable retries.
  - Add Meta Funding activity, review, request, and device-management UI.
  - Pilot with one operator/device and no automatic ledger posting.
