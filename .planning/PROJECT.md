# Meta Ads Operations & Financial Control System

## Project Name
**Meta Ads Operations & Financial Control System (In-House)**

## Overview
A centralized internal control system for Meta advertising operations and financial reconciliation. It enables end-to-end tracking of multi-source Ad Account funds (Client funds, Vendor funding, Agency free balances, Meta credits, Locked funds), maintains an immutable double-entry financial ledger, provides automated synchronization with the Meta Marketing API, and surfaces real-time reconciliation mismatches and operational alerts.

## Tech Stack
- **Architecture**: Monorepo with `pnpm workspaces`
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + TanStack Table + Lucide React
- **Backend**: NestJS 11+ (TypeScript, Modular Monolith, REST API + Swagger OpenAPI)
- **Database & ORM**: PostgreSQL (Supabase compatible) + Prisma ORM 7+
- **Queuing & Workers**: BullMQ + Redis
- **Auth & Storage**: Supabase Auth (JWT verification) + Supabase Storage
- **Runtime**: Node.js 24 LTS

## Key Business Objectives & Non-Negotiables
1. **Six Questions Rule**: For every rupee, the system must trace Source, Owner, Purpose, Location, Status, and History.
2. **Three Truths Separation**: Meta Truth (external API facts), Ledger Truth (immutable double-entry postings), and Business Truth (intent and ownership) must never be collapsed into a single mutable number.
3. **Double-Entry Ledger Integrity**: Every posted financial transaction must balance (`Debit == Credit`). No direct balance mutations allowed.
4. **Minor Units for Money**: All currency calculations are handled as `BigInt` minor units (paise) to prevent floating-point inaccuracies.
5. **Leftover & Restricted Fund Protection**: Unused client budget remains client-owned by default; restricted Ad Account funds remain attributed to their owner in a `LOCKED` state rather than disappearing.
6. **Vendor Settlement & Overpayment Guard**: Vendor funding batches are settled against client collections; overpayments automatically generate tracked `VendorReceivable` assets.
