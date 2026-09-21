# Tech Stack

## Overview

Ye document Ads Control system ke production technology stack ko define karta hai.

System financial-control application hai, isliye technology selection ka priority order:

```text
Correctness
↓
Data Integrity
↓
Security
↓
Auditability
↓
Reliability
↓
Maintainability
↓
Performance
↓
Developer Convenience
```

Core principle:

> **Financial correctness must never depend only on frontend state, application memory, Redis, ORM convenience methods or external Meta data. Canonical financial truth must remain in PostgreSQL with transaction-safe backend controls.**

---

# 1. Recommended Production Stack

```text
Frontend
Next.js + TypeScript + Tailwind CSS + shadcn/ui

Backend
NestJS + TypeScript

Runtime
Node.js 24 LTS

Database
Supabase PostgreSQL

Authentication
Supabase Auth

Object Storage
Supabase Storage

Realtime
Supabase Realtime

ORM
Prisma ORM 7

Queue
BullMQ

Queue / Cache Store
Redis

Reverse Proxy
Nginx

Container Runtime
Docker

Orchestration
Docker Compose

Validation
Zod / Backend DTO Validation

API Documentation
OpenAPI / Swagger

Logging
Pino

Error Monitoring
Sentry

Meta Integration
Meta Marketing API

Deployment
Hostinger VPS

Optional Edge
Cloudflare
```

---

# 2. Current Version Baseline

As of September 17, 2026, recommended baseline:

```text
Node.js:
24 LTS

Next.js:
16.3.x Active LTS

NestJS:
12.x

Prisma:
7.x stable

PostgreSQL:
Supabase-managed supported PostgreSQL release

Redis:
8.x supported stable release

Docker Compose:
Current Docker Compose v2
```

Node.js currently lists v24 as an LTS line, while v26 is still Current; production Node applications should use supported LTS lines.

Next.js currently identifies 16.3.3 as its Active LTS security release baseline.

Nest's current documentation is on Nest 12, with current runtime/CLI requirements documented by the project.

---

# 3. Node.js Version Decision

Recommended:

```text
Node.js 24 LTS
```

Do not use:

```text
Node.js 26 Current
```

for production merely because it has a higher version number.

---

# 4. Why Node 24 LTS

Benefits:

```text
Long-term support

Security updates

Stable package ecosystem

Nest compatibility

Next.js compatibility

Prisma compatibility

Production predictability
```

Node's official release page currently identifies v24 and v22 as LTS, while v26 is Current.

---

# 5. Node Version Consistency

Use same Node major for:

```text
Local Development

CI

Frontend Build

Backend Build

Worker Build

Production
```

Avoid:

```text
Local Node 26
Production Node 22
```

without deliberate compatibility testing.

---

# 6. Node Version File

Repository should include:

```text
.nvmrc
```

or equivalent version manager config.

Example:

```text
24
```

---

# 7. Docker Node Image

Production:

```text
node:24-bookworm-slim
```

or another supported official Node 24 image.

For maximum reproducibility:

```text
Pin exact patch
+
Image digest
```

in production release process.

---

# 8. TypeScript

Entire application should use:

```text
TypeScript
```

including:

```text
Next.js

NestJS

Workers

Shared Packages

Tests
```

---

# 9. TypeScript Strict Mode

Enable:

```text
strict: true
```

and avoid broad:

```text
any
```

in financial-domain code.

---

# 10. Type Safety Is Not Financial Validation

TypeScript prevents many programming mistakes.

It does not replace:

```text
Database constraints

Runtime validation

Authorization

Ledger balancing

DB transactions
```

---

# 11. Monorepo Architecture

Recommended:

```text
pnpm workspaces
```

with one repository.

Conceptually:

```text
apps/
├── web/
├── api/
└── worker/

packages/
├── shared/
├── config/
├── database/
├── domain-types/
└── eslint-config/
```

---

# 12. Why Monorepo

Benefits:

```text
Shared types

Shared validation schemas

Consistent tooling

One dependency lockfile

Atomic frontend/backend changes

Simpler CI
```

---

# 13. Package Manager

Recommended:

```text
pnpm
```

Reasons:

```text
Fast installs

Efficient disk usage

Workspace support

Strict dependency handling
```

---

# 14. Lockfile

Commit:

```text
pnpm-lock.yaml
```

Production build must use frozen lockfile.

Example:

```text
pnpm install --frozen-lockfile
```

---

# 15. Avoid Floating Production Dependencies

Do not deploy with uncontrolled:

```text
latest
```

resolution.

Dependencies should be:

```text
Version controlled
+
Lockfile controlled
```

---

# 16. Dependency Updates

Use:

```text
Renovate
```

or:

```text
Dependabot
```

for controlled update PRs.

Security updates get priority.

---

# 17. Frontend Framework

Recommended:

```text
Next.js 16.3.x
```

Next.js 16.3 is the current Active-LTS branch, with 16.3.3 carrying the August 2026 security fixes.

---

# 18. Why Next.js

Suitable for:

```text
Admin Dashboard

Server Rendering

Secure authenticated application

Route layouts

Data-heavy screens

Responsive operations UI

Future public reporting pages if needed
```

---

# 19. Next.js App Router

Use:

```text
App Router
```

for the application.

Suggested sections:

```text
/dashboard

/meta

/clients

/vendors

/finance

/monitoring

/reports

/team

/audit

/settings
```

---

# 20. Frontend Is Not Financial Authority

Frontend may display:

```text
Available Client Balance
```

but must never calculate and post canonical money movement independently.

Backend decides.

---

# 21. React Server Components

Use where appropriate for:

```text
Initial page loading

Server-rendered layouts

Read-oriented pages
```

Do not force everything into client components.

---

# 22. Client Components

Use for:

```text
Interactive tables

Filters

Dialogs

Realtime alerts

Forms

Charts
```

---

# 23. Frontend Data Fetching

Recommended combination:

```text
Server-side fetch
+
TanStack Query for interactive client state
```

where helpful.

Do not duplicate every server response into global state.

---

# 24. UI Framework

Recommended:

```text
Tailwind CSS
+
shadcn/ui
```

---

# 25. Why shadcn/ui

Useful for internal operational application:

```text
Tables

Dialogs

Sheets

Dropdowns

Tabs

Forms

Cards

Command Palette
```

while preserving source-level customization.

---

# 26. UI Design Direction

System should prioritize:

```text
Dense but readable data

Fast navigation

Clear financial states

Minimal decoration

Consistent status colors

Good mobile/tablet fallback
```

over marketing-style visuals.

---

# 27. Data Tables

For large financial/account tables consider:

```text
TanStack Table
```

with backend pagination.

---

# 28. Avoid Loading Entire Dataset

Bad:

```text
GET all 50,000 ledger rows
```

then filter client-side.

Use:

```text
Server pagination

Filtering

Sorting

Search
```

---

# 29. Forms

Recommended:

```text
React Hook Form
+
Zod
```

for frontend validation.

---

# 30. Frontend Validation Is UX Only

Backend must repeat all important validation.

Never trust:

```text
disabled button
```

as authorization.

---

# 31. Backend Framework

Recommended:

```text
NestJS 12
```

Nest's current documentation has moved to the v12 generation and recommends supported modern Node runtimes.

---

# 32. Why NestJS

System requires many bounded modules:

```text
Meta

Clients

Vendors

Finance

Ledger

Allocations

Reconciliation

Alerts

Approvals

Audit

Workers
```

Nest's module/service architecture fits this well.

---

# 33. Backend API Style

V1 recommendation:

```text
REST API
+
JSON
+
OpenAPI
```

Do not introduce GraphQL unless a concrete need appears.

---

# 34. Why REST

Benefits:

```text
Simple permission boundaries

Easy audit logging

Clear financial actions

Easy integrations

OpenAPI documentation

Straightforward testing
```

---

# 35. API Prefix

Recommended:

```text
/api/v1
```

Example:

```text
/api/v1/clients

/api/v1/vendors

/api/v1/meta/accounts

/api/v1/finance/transactions
```

---

# 36. Financial APIs Should Be Commands

Prefer:

```text
POST /vendor-settlements/{id}/post
```

rather than generic:

```text
PATCH vendor payable balance
```

---

# 37. Backend Modules

Recommended high-level:

```text
auth

users

roles

meta

clients

vendors

finance

ledger

funds

reconciliation

alerts

approvals

audit

reports

storage

workers

health
```

---

# 38. Backend HTTP Adapter

V1 recommendation:

```text
Nest default Express adapter
```

for ecosystem simplicity.

Performance is unlikely to be the bottleneck initially.

---

# 39. Fastify

Can be evaluated later if API throughput warrants it.

Do not introduce adapter-specific complexity without need.

---

# 40. Database

Canonical relational database:

```text
PostgreSQL
```

provided through:

```text
Supabase
```

---

# 41. Why PostgreSQL

Required capabilities:

```text
ACID transactions

Foreign keys

Unique constraints

Row locking

CHECK constraints

Indexes

JSONB where appropriate

Views

Triggers

RLS

Strong financial querying
```

---

# 42. Supabase PostgreSQL

Supabase provides a full PostgreSQL database rather than a proprietary database abstraction, and integrates its database with Auth, Storage and Realtime.

---

# 43. Canonical Data in PostgreSQL

Store:

```text
Clients

Vendors

Meta Assets

Mappings

Payments

Ledger

Fund Lots

Allocations

Reconciliation

Alerts

Approvals

Audit
```

in PostgreSQL.

---

# 44. Do Not Use Redis as Database

Redis must never be canonical source for:

```text
Client Balance

Vendor Payable

Ledger

Locked Funds

Refund Status
```

---

# 45. PostgreSQL Monetary Data

Use:

```text
BIGINT
```

minor units.

Example:

```text
₹20,000
=
2,000,000 paise
```

---

# 46. No Floating Point Money

Never use:

```text
FLOAT

DOUBLE PRECISION

JavaScript Number calculations
```

for canonical money calculations where precision risk exists.

---

# 47. Currency

Every monetary record must have:

```text
currency_code
```

or inherit safely from a currency-specific ledger account.

---

# 48. PostgreSQL Transaction Boundaries

Financial postings must execute within:

```text
BEGIN

...

COMMIT
```

or rollback completely.

---

# 49. Row Locking

Critical flows require:

```text
SELECT ... FOR UPDATE
```

or equivalent database locking.

Examples:

```text
Vendor Settlement

Client Refund

Fund Allocation

Ownership Transfer
```

---

# 50. Database Is Final Concurrency Guard

Application checks:

```text
Available ₹10,000
```

are not enough.

Two concurrent requests can still race.

Database transaction/locking must prevent invalid state.

---

# 51. ORM

Recommended production ORM:

```text
Prisma ORM 7
```

for current V1.

---

# 52. Why Not Prisma 8 Yet

As of September 2026, Prisma ORM 8 remains a release candidate, with General Availability expected in October 2026. Prisma's own release-status page lists several currently unavailable capabilities in the RC, including transaction-isolation-level support. Prisma 7 remains fully supported.

For this financial system:

```text
RC ORM
=
Unnecessary production risk
```

---

# 53. Prisma Version Policy

Use:

```text
prisma@7

@prisma/client@7
```

pinned to stable tested releases.

Do not accidentally run:

```text
npx prisma
```

from an unpinned environment that could pull Prisma 8 tooling.

Prisma explicitly warns Prisma 7 projects to pin the v7 CLI while Prisma 8 is current RC.

---

# 54. Prisma Responsibilities

Good use cases:

```text
CRUD

Relationships

Normal queries

Transactions

Migrations

Type-safe database access
```

---

# 55. Prisma Must Not Be Only Integrity Layer

Critical constraints should also exist in PostgreSQL.

Example:

```text
Unique external IDs

Ledger entry checks

Foreign keys

Posted record protection

Tenant constraints
```

---

# 56. Raw SQL Is Allowed

For financial operations requiring:

```text
SELECT FOR UPDATE

Advisory locks

Advanced PostgreSQL queries

Atomic posting functions

Complex reports
```

use carefully reviewed raw SQL where Prisma abstraction is insufficient.

---

# 57. Database Functions

Critical posting logic may use PostgreSQL functions/procedures where doing so strengthens atomic guarantees.

Examples:

```text
post_ledger_transaction()

settle_vendor()

reserve_client_funds()
```

Use only where complexity is justified.

---

# 58. Migration Strategy

Use:

```text
Prisma Migrate
```

for core schema.

Supplement with reviewed SQL migration files for:

```text
RLS

Triggers

Functions

Special indexes

Database constraints
```

---

# 59. Never Edit Production Schema Manually

Schema changes must be migration-controlled.

Emergency changes should still be converted into migration history immediately.

---

# 60. Supabase Auth

Authentication:

```text
Supabase Auth
```

Supabase Auth uses JWTs and integrates with PostgreSQL RLS.

---

# 61. Auth Flow

Recommended:

```text
User
↓
Supabase Auth
↓
JWT
↓
Next.js / NestJS
↓
Backend authorization
```

---

# 62. Backend JWT Verification

NestJS must verify Supabase JWTs.

Do not trust:

```text
user_id
```

sent by frontend request body.

---

# 63. Authentication vs Authorization

Supabase Auth answers:

```text
Who is this user?
```

Internal RBAC answers:

```text
What can this user do?
```

---

# 64. RBAC Storage

Internal tables:

```text
user_profiles

roles

permissions

user_roles

resource_scopes
```

---

# 65. Row Level Security

Use Supabase/PostgreSQL:

```text
RLS
```

as defense-in-depth.

Supabase Auth is designed to integrate JWT-based authorization with PostgreSQL RLS.

---

# 66. Backend Service Access

Trusted backend may need elevated DB access for controlled operations.

Never expose:

```text
service role credentials
```

to frontend.

---

# 67. RLS Is Not Replacement for Backend Permissions

Financial API still checks:

```text
Permission

Scope

Workflow status

Approval

Maker-checker

Amount limits
```

---

# 68. Supabase Storage

Use for:

```text
Payment proofs

Vendor documents

Refund proofs

Reconciliation evidence

Attachments
```

Supabase Storage integrates with PostgreSQL/RLS-based access policies.

---

# 69. Never Store File Binary in Ledger Rows

Database stores:

```text
Attachment metadata

Storage object reference
```

Binary resides in object storage.

---

# 70. Storage Bucket Strategy

Possible:

```text
financial-proofs

reconciliation

general-attachments
```

Prefer private buckets.

---

# 71. Signed URLs

Sensitive attachments should use:

```text
Short-lived signed access
```

rather than public URLs.

---

# 72. Supabase Realtime

Use for:

```text
Alert updates

Approval updates

Sync progress

Dashboard refresh hints
```

---

# 73. Realtime Is Not Financial Transaction Bus

Do not rely on:

```text
Realtime delivery
```

to guarantee financial processing.

---

# 74. Critical Domain Events

For important event delivery use:

```text
Transactional Outbox
+
Worker/Dispatcher
```

rather than only ephemeral realtime/pub-sub.

---

# 75. Transactional Outbox

Financial transaction commits:

```text
Business change
+
Outbox event
```

inside same PostgreSQL transaction.

Then worker delivers event.

---

# 76. Why Outbox

Prevents scenario:

```text
Ledger committed

but

Process crashed before alert/reconciliation job queued
```

---

# 77. Queue System

Recommended:

```text
BullMQ
```

BullMQ is a Redis-backed Node.js queue with priorities, delayed jobs, retries, worker concurrency and crash recovery. Its documentation notes delivery aims for exactly once but can become at-least-once in worst-case situations.

---

# 78. BullMQ Implication

Because queue delivery can be repeated:

> **Every important worker must be idempotent.**

---

# 79. Queue Responsibilities

Use for:

```text
Meta Sync

Meta Backfills

Reconciliation

Alert Evaluation

Report Generation

Notifications

Snapshots

Cleanup Jobs
```

---

# 80. Queue Must Not Post Money Without Idempotency

Example:

```text
vendor settlement worker
```

must use:

```text
settlement ID

idempotency key

database lock
```

before financial posting.

---

# 81. Redis

BullMQ requires Redis-compatible infrastructure. BullMQ's current documentation uses Redis connections for queues and workers.

---

# 82. Redis Role

Use Redis for:

```text
BullMQ

Short-lived cache

Distributed locks where appropriate

Rate limiting

Temporary coordination
```

---

# 83. Redis Persistence

Because Redis stores queued jobs:

production Redis should use durability appropriate to BullMQ.

Redis supports:

```text
RDB snapshots

AOF

RDB + AOF
```

persistence options.

---

# 84. Recommended Redis Persistence

For single VPS V1:

```text
AOF enabled
+
RDB snapshots
```

with persistent Docker volume.

Queue can still be reconstructed for scheduled work, but durability reduces lost queued work after crash.

---

# 85. Redis Version

Use a supported stable:

```text
Redis 8.x
```

release tested against chosen BullMQ version.

Do not depend on Redis experimental features for core queue behavior.

---

# 86. Redis Authentication

Redis must not be openly exposed to internet.

Bind through:

```text
Docker private network
```

and authentication/configuration where appropriate.

---

# 87. Redis Port

Do not publish:

```text
6379
```

publicly unless specifically required and firewalled.

---

# 88. Cache Strategy

Initial system does not need aggressive caching.

Cache only expensive non-critical reads.

---

# 89. Never Cache Authoritative Financial Decision

Before refund/settlement:

backend must query canonical current PostgreSQL state.

Do not trust cached:

```text
available_balance
```

for final posting.

---

# 90. Cache Invalidation

Cached dashboards can be invalidated/refreshed after:

```text
Financial Post

Meta Sync

Reconciliation

Approval
```

---

# 91. API Validation

Recommended:

```text
Nest DTO validation
```

and/or:

```text
Zod
```

for shared runtime schemas.

---

# 92. Validation Levels

```text
Frontend validation

Backend request validation

Domain validation

Database constraints
```

All four have different purposes.

---

# 93. Domain Validation

Example vendor settlement checks:

```text
Vendor active

Currency matches

Payment amount valid

Open payable read

Approval valid

Maker-checker valid
```

---

# 94. OpenAPI

NestJS should generate:

```text
OpenAPI / Swagger
```

documentation for internal API.

---

# 95. API Documentation Benefits

```text
Frontend/backend coordination

Integration testing

Future mobile app

Admin API understanding
```

---

# 96. API Client Generation

Future frontend/mobile API clients may be generated from OpenAPI schema.

---

# 97. Meta API Client

Implement central:

```text
MetaApiClient
```

instead of calling Graph API from random modules.

---

# 98. Meta API Version

Config:

```text
META_GRAPH_API_VERSION=v26.0
```

for current implementation baseline.

API version upgrades must be controlled.

---

# 99. HTTP Client

Backend can use:

```text
Undici / native fetch
```

or Nest-compatible wrapper.

Need:

```text
Timeouts

Retry policy

Redaction

Tracing
```

---

# 100. Logging

Recommended:

```text
Pino
```

for structured backend logs.

---

# 101. Log Format

Production:

```text
JSON structured logs
```

with fields:

```text
request_id

user_id

organization_id

module

action

duration

status
```

---

# 102. Never Log

```text
Meta access token

Supabase service key

Passwords

App secrets

Authorization header
```

---

# 103. Financial Log Data

Avoid unnecessarily logging full:

```text
Bank account details

Sensitive payment evidence
```

Structured audit records should exist separately.

---

# 104. Audit Log ≠ Application Log

Application logs:

```text
Debug system behavior
```

Audit log:

```text
Permanent business/user activity evidence
```

Keep separate.

---

# 105. Error Monitoring

Recommended:

```text
Sentry
```

for:

```text
Unhandled frontend errors

Unhandled backend exceptions

Worker crashes

Performance traces where useful
```

---

# 106. Sentry Redaction

Configure:

```text
beforeSend
```

or equivalent sanitization to remove:

```text
Tokens

Secrets

Sensitive headers

Sensitive form fields
```

---

# 107. Operational Metrics

V1 minimum metrics:

```text
API request rate

API error rate

Worker failures

Queue depth

Queue age

Meta sync failures

Stale accounts

DB connection usage
```

---

# 108. Future Monitoring

Later:

```text
Prometheus

Grafana
```

can provide deeper infrastructure observability.

Not mandatory for initial V1.

---

# 109. Health Endpoints

Backend:

```text
/health/live

/health/ready
```

---

# 110. Liveness

Checks:

```text
Process running
```

Do not include every external dependency.

---

# 111. Readiness

Checks critical dependencies:

```text
PostgreSQL

Redis
```

and application initialization.

Meta API should not necessarily make entire app unready.

---

# 112. Why Meta Not Readiness Dependency

Meta outage should not stop:

```text
Ledger

Vendor

Client

Finance
```

functionality.

---

# 113. Testing Stack

Recommended:

```text
Unit:
Jest

API Integration:
Jest + Supertest

Frontend:
Vitest/Jest as appropriate

Browser E2E:
Playwright

Database Integration:
Real PostgreSQL test database

Queue Integration:
Real Redis test service
```

---

# 114. Financial Tests Must Use Real Database Semantics

Mocks cannot verify:

```text
SELECT FOR UPDATE

Transactions

Unique constraints

Concurrent settlements
```

Use integration tests against PostgreSQL.

---

# 115. Testcontainers

Optional:

```text
Testcontainers
```

for isolated PostgreSQL/Redis integration tests.

---

# 116. Financial Concurrency Tests

Must include:

```text
Two allocations race

Two vendor settlements race

Duplicate refund post

Duplicate idempotency request
```

---

# 117. Deployment Platform

Initial production:

```text
Hostinger VPS
```

---

# 118. Deployment Architecture

Recommended:

```text
Internet
   ↓
Optional Cloudflare
   ↓
Nginx
   ↓
┌────────────────────────────┐
│ Docker Compose             │
│                            │
│ Next.js Web                │
│ NestJS API                 │
│ BullMQ Worker              │
│ Redis                      │
└────────────────────────────┘
          ↓
   External Services
          ↓
Supabase
Meta API
Sentry
```

---

# 119. Supabase Remains External Managed Service

Do not run a second PostgreSQL copy on the VPS unless architecture changes intentionally.

Canonical DB:

```text
Supabase PostgreSQL
```

---

# 120. Docker

Use containers for:

```text
Web

API

Worker

Redis
```

---

# 121. Docker Compose

Docker documents Compose as suitable for defining/running multi-container apps and explicitly documents production use on a single server.

This fits V1 Hostinger deployment.

---

# 122. Production Compose

Recommended:

```text
compose.yaml

compose.production.yaml
```

Docker officially documents production-specific Compose overrides for things such as environment configuration, ports and restart policies.

---

# 123. Container Services

Example:

```text
web

api

worker-meta

worker-finance

redis
```

Workers may initially share one worker image/process configuration.

---

# 124. Separate API and Worker Process

Do not run long BullMQ jobs inside API HTTP process.

Advantages:

```text
Independent restart

Independent scaling

API remains responsive

Worker crashes isolated
```

---

# 125. Worker Images

API and worker can use same code image with different startup commands.

Example:

```text
api:
node dist/main.js

worker:
node dist/worker.js
```

---

# 126. Nginx

Use:

```text
Nginx
```

as reverse proxy.

Nginx's proxy module supports forwarding requests to upstream application servers through `proxy_pass`.

---

# 127. Nginx Routing

Conceptually:

```text
app.domain.com
→ Next.js

api.domain.com
→ NestJS
```

or:

```text
app.domain.com/api/
→ NestJS
```

---

# 128. Recommended Domain Pattern

For this system:

```text
app.example.com
```

for frontend.

```text
api.example.com
```

for backend is clean.

Same-site architecture can also be used if cookie/session strategy benefits.

---

# 129. TLS

All production traffic:

```text
HTTPS only
```

---

# 130. Nginx Headers

Forward safely:

```text
Host

X-Real-IP

X-Forwarded-For

X-Forwarded-Proto
```

Nginx officially documents these reverse-proxy patterns.

---

# 131. Internal Ports

Only Nginx should expose public web ports.

Example internal:

```text
web:3000

api:4000

redis:6379
```

Redis should remain private.

---

# 132. Docker Network

Use private:

```text
app-network
```

for container-to-container communication.

---

# 133. Restart Policies

Production containers:

```text
restart: unless-stopped
```

or appropriate equivalent.

Docker's production Compose guidance recommends explicit restart policies.

---

# 134. Resource Limits

Configure container CPU/memory limits where practical.

Worker should not consume entire VPS.

---

# 135. Redis Memory

Configure:

```text
maxmemory
```

and monitor.

BullMQ job retention policies should remove old completed jobs after useful retention period.

---

# 136. Queue History Is Not Audit History

Deleting old BullMQ completed jobs does not delete:

```text
SyncRun

Ledger

Audit

Reconciliation
```

from PostgreSQL.

---

# 137. Environment Variables

Separate:

```text
.env.local

.env.staging

Production secrets
```

Do not commit production `.env`.

---

# 138. Secrets

Examples:

```text
SUPABASE_SERVICE_ROLE_KEY

DATABASE_URL

META_APP_SECRET

META_TOKEN_ENCRYPTION_KEY

SENTRY_DSN
```

must remain server-side.

---

# 139. Secret Rotation

Architecture must allow:

```text
Meta token rotation

Database credential rotation

Supabase key rotation

Encryption-key rotation strategy
```

without rebuilding business history.

---

# 140. Cloudflare

Optional:

```text
DNS

TLS/edge protection

Rate limiting
```

Use carefully.

---

# 141. Cloudflare Caching

Do not cache authenticated:

```text
/api/*
```

financial responses at edge unless deliberately designed.

---

# 142. Application Rate Limiting

Nest backend should apply:

```text
Authentication rate limits

Sensitive mutation limits

Meta reconnect limits

Export limits
```

---

# 143. Financial Mutation Rate Limit

Rate limit can protect from accidental repeated submissions, but:

```text
Idempotency
```

remains the real duplicate-posting protection.

---

# 144. Idempotency Store

Canonical idempotency state should live in:

```text
PostgreSQL
```

not only Redis.

---

# 145. Why

Redis restart must not allow:

```text
Vendor Settlement
```

to post twice.

---

# 146. Transactional Outbox Store

Also PostgreSQL.

Worker can retry outbox delivery safely.

---

# 147. Database Connection Pooling

Need controlled DB connection counts because:

```text
Next.js

Nest API

Multiple Workers
```

can otherwise exhaust Supabase connections.

Supabase provides database connection options and Supavisor connection pooling.

---

# 148. Prisma Connection Strategy

Use deployment-appropriate pooled connection string for normal application queries.

Certain migration/admin operations may require direct connection configuration.

Follow current Supabase + Prisma connection guidance during implementation.

---

# 149. Do Not Create PrismaClient Per Request

Use shared backend database service.

---

# 150. Worker DB Pool

Workers should use their own controlled process-level pool/client.

Monitor total connections across all containers.

---

# 151. Database Indexing

Important initial indexes:

```text
organization_id

meta external IDs

client_id

vendor_id

transaction date

ledger account

reconciliation status

alert status

sync freshness
```

Specific design already defined in database schema docs.

---

# 152. Search

V1 can use PostgreSQL:

```text
ILIKE

Full-text search
```

where necessary.

No Elasticsearch needed initially.

---

# 153. Reporting

V1 reports can query PostgreSQL using:

```text
Optimized SQL

Views

Materialized views where justified
```

---

# 154. Analytics Warehouse

Not required for V1.

Future high-volume reporting may move historical analytics to a warehouse.

Financial canonical ledger remains PostgreSQL.

---

# 155. Charts

Frontend charts can use:

```text
Recharts
```

or similar light React chart library.

Avoid chart dependency driving backend design.

---

# 156. Date Handling

Recommended:

```text
UTC timestamps in DB

Explicit business_date

Meta account timezone for Meta daily reporting

User display timezone separately
```

---

# 157. Date Library

Use native modern date APIs or a lightweight tested library where needed.

Avoid hidden server-local timezone assumptions.

---

# 158. IDs

Internal:

```text
UUID
```

External:

```text
Meta IDs as strings
```

Human:

```text
CLI-0001
VEN-0001
TXN-000001
```

---

# 159. UUID Generation

Generate through:

```text
PostgreSQL
```

or backend consistently.

Human reference is not primary key.

---

# 160. Notifications

V1:

```text
In-app
```

Future:

```text
Email

WhatsApp

Slack

Push
```

Notification failure must not alter underlying alert/business state.

---

# 161. Email Provider

Not required to choose for core V1 architecture.

Can be plugged through notification adapter later.

---

# 162. File Export

V1:

```text
CSV

XLSX
```

generated by backend/worker for large reports.

---

# 163. Large Reports

Do not hold HTTP connection during massive report generation.

Use:

```text
Queue Job
↓
Generate File
↓
Supabase Storage
↓
Signed Download URL
```

---

# 164. PDF Reporting

Future feature.

Not required for finance engine itself.

---

# 165. Feature Flags

Recommended for risky/new functionality.

Examples:

```text
META_WRITE_ENABLED=false

VENDOR_OVERPAYMENT_ALLOWED=false

CROSS_CLIENT_TRANSFER_ENABLED=false
```

---

# 166. Feature Flag Is Not Authorization

Even if feature enabled:

permission/approval checks still apply.

---

# 167. Configuration Management

System settings should distinguish:

```text
Deployment Environment Config

Organization Business Config
```

---

# 168. Environment Config

Examples:

```text
DATABASE_URL

REDIS_URL

META_API_VERSION
```

---

# 169. Business Config

Examples:

```text
Approval Threshold

Leftover Aging Days

Low-Balance Threshold

Reconciliation Tolerance
```

Store in DB with audit.

---

# 170. Infrastructure Config

Examples:

```text
Worker concurrency

Queue retry count

HTTP timeout

Sync frequency
```

deployment/config system.

---

# 171. Security Headers

Nginx/Next should configure appropriate:

```text
Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Frame restrictions
```

based on application requirements.

---

# 172. CORS

If frontend/API use different subdomains:

allow only authorized application origins.

Never:

```text
Access-Control-Allow-Origin: *
```

for authenticated finance APIs.

---

# 173. CSRF

Authentication/session architecture must evaluate CSRF protections if cookie-based authentication is used.

---

# 174. Input Sanitization

Never trust:

```text
Notes

Search queries

Export filters

Uploaded filenames
```

Use validation and safe rendering.

---

# 175. SQL Injection

Prisma parameterized queries protect normal cases.

Raw SQL must always use safe parameter binding.

Never concatenate user input into SQL.

---

# 176. Encryption

Transport:

```text
TLS
```

Sensitive Meta token:

```text
Application-level encrypted secret
```

Database/storage encryption uses provider capabilities plus application controls where required.

---

# 177. Token Encryption

Recommended envelope:

```text
Encrypted token ciphertext

Key version

IV/nonce

Auth tag
```

Actual cryptographic implementation must use established library.

---

# 178. No Custom Cryptography

Do not invent encryption algorithm.

---

# 179. Backup

Supabase manages PostgreSQL backup capabilities; its docs state projects receive managed backups and paid plans can provide point-in-time recovery.

Backup architecture detailed later.

---

# 180. Redis Backup

Redis queue persistence is useful operationally, but PostgreSQL remains sufficient to reconstruct critical scheduled/business work.

---

# 181. Source Control

Recommended:

```text
GitHub
```

private repository.

---

# 182. Branching

Simple:

```text
main

feature/*
fix/*
```

with PR review.

Avoid unnecessarily complex GitFlow.

---

# 183. CI

GitHub Actions or equivalent:

```text
Install

Lint

Type Check

Unit Tests

Integration Tests

Build

Migration Validation

Container Build
```

---

# 184. Production Deployment

Only deploy if:

```text
Tests pass

Build passes

Migration reviewed

Backup available

Required environment variables present
```

---

# 185. Migration Deployment Order

Generally:

```text
Backward-compatible DB migration

Deploy backend

Deploy frontend

Run cleanup migration later if needed
```

for safer zero/minimal downtime changes.

---

# 186. Financial Migration Review

Changes affecting:

```text
Ledger

Balances

Fund allocation

Vendor settlement
```

require extra review.

---

# 187. Database Backup Before High-Risk Migration

Required operational policy.

---

# 188. Deployment Rollback

Application image should be versioned.

Rollback:

```text
Previous Docker image
```

must be available.

Database rollback may require forward-fix rather than destructive migration reversal.

---

# 189. Build Artifacts

Docker image is production artifact.

Do not build production source manually on VPS as primary release workflow long-term.

---

# 190. Initial Simple Deployment

For V1, acceptable:

```text
Git Pull / CI Build
+
Docker Compose Deploy
```

if controlled.

Future can move to image registry-based deployments.

---

# 191. Recommended Production Containers

```text
nginx

web

api

worker

redis
```

Optional future:

```text
worker-meta

worker-finance

worker-reports
```

split separately.

---

# 192. Why Split Worker Later

Allows:

```text
Different concurrency

Different priorities

Isolation

Independent scaling
```

---

# 193. V1 Worker

One worker service can initially process multiple queues if workload is moderate.

Keep queue names separate even if same process consumes them.

---

# 194. Queue Names

Recommended:

```text
meta-sync

reconciliation

finance-events

alerts

reports

notifications
```

---

# 195. Finance Worker Safety

No financial worker should post arbitrary ledger transactions from generic queue JSON.

Worker loads canonical business record and validates current state in PostgreSQL.

---

# 196. Financial Transaction Example

Queue payload:

```text
{
  settlementId
}
```

not:

```text
{
  debitAccount,
  creditAccount,
  amount
}
```

Backend derives entries from canonical settlement.

---

# 197. Environment Architecture

Recommended:

```text
LOCAL

STAGING

PRODUCTION
```

---

# 198. Staging

Should have:

```text
Separate Supabase project

Separate Redis

Separate Meta test/controlled connections

Separate storage
```

Do not point staging to production financial DB.

---

# 199. Local Development

Docker can run:

```text
Redis
```

locally.

Developers may use dedicated development Supabase project.

---

# 200. Local Supabase

Optional Supabase local stack can be used where team workflow benefits.

But production behavior must still be verified against hosted environment.

---

# 201. Seed Data

Development/staging seed data:

```text
DATA/09-SAMPLE-DATA.md
```

should populate realistic edge cases.

Never seed fake clients into production except controlled configuration/system data.

---

# 202. Technology Decision Summary

## Frontend

```text
Next.js 16.3.x
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query/Table where useful
```

## Backend

```text
Node.js 24 LTS
NestJS 12
REST
OpenAPI
Pino
```

## Data

```text
Supabase PostgreSQL
Prisma ORM 7
PostgreSQL SQL for critical locking/constraints
Supabase Storage
Supabase Auth
Supabase Realtime
```

## Async

```text
Redis 8.x
BullMQ
Transactional Outbox
```

## Infrastructure

```text
Docker
Docker Compose
Nginx
Hostinger VPS
Optional Cloudflare
```

## Observability

```text
Sentry
Structured Pino Logs
Health Checks
Queue Metrics
```

---

# 203. Technology We Do Not Need in V1

Avoid unnecessary:

```text
Kubernetes

Kafka

RabbitMQ

Elasticsearch

GraphQL

Microservices

MongoDB

Multiple databases per module

Event sourcing framework

Data warehouse

Service mesh
```

unless scale proves need.

---

# 204. Modular Monolith

Recommended backend architecture:

```text
MODULAR MONOLITH
```

not microservices.

---

# 205. Why Modular Monolith

Current system needs:

```text
Strong DB transactions

Cross-module consistency

Small/medium team simplicity

Fast development

Easy deployments
```

Microservices would complicate:

```text
Financial transactions

Distributed consistency

Operations

Debugging
```

without immediate benefit.

---

# 206. Workers Are Separate Processes, Not Microservices

API and workers can share:

```text
Codebase

Database

Domain modules
```

while running as separate processes.

---

# 207. Future Service Extraction

Only extract service when clear reason exists:

```text
Independent scaling

Different availability requirements

Major workload separation
```

---

# 208. Financial Core Must Remain Cohesive

Ledger, allocations, settlement and reconciliation should initially remain strongly coordinated around same PostgreSQL database.

---

# 209. Prisma 8 Migration Later

After Prisma 8 reaches GA and required features mature:

```text
Evaluate

Run compatibility tests

Benchmark

Migrate deliberately
```

Do not auto-upgrade major ORM in production.

---

# 210. Next.js Security Updates

Because Next.js issued multiple security releases in 2026, production dependency monitoring must treat framework security patches as operationally important. Next's August 2026 advisory instructs users on Active LTS to upgrade to 16.3.3.

---

# 211. Runtime Security Updates

Node LTS patch releases should also be updated regularly after staging verification.

---

# 212. Redis Upgrade Policy

Pin compatible Redis/BullMQ versions.

Upgrade through staging.

Queue infrastructure changes must test:

```text
Delayed jobs

Retries

Worker restart

Persistence

Deduplication
```

---

# 213. Database Upgrade Policy

Supabase manages underlying platform upgrades, but application must still test:

```text
Prisma compatibility

Extensions

RLS

Functions

Triggers
```

when relevant.

---

# 214. Stack Integrity Rules

System must enforce:

```text
1. PostgreSQL is canonical application and financial data store.

2. Redis must never be canonical financial truth.

3. Frontend must never directly post ledger entries.

4. All financial mutations go through NestJS domain services.

5. Financial balances derive from posted PostgreSQL ledger entries.

6. Critical financial writes use atomic PostgreSQL transactions.

7. Concurrency-sensitive operations use database-level locking.

8. Prisma is an access layer, not the only integrity layer.

9. PostgreSQL constraints must protect critical invariants.

10. Prisma 7 should remain pinned until Prisma 8 is production-ready and intentionally adopted.

11. Supabase service credentials must never reach the frontend.

12. Meta credentials must never reach the frontend.

13. BullMQ workers must be idempotent because jobs may be redelivered.

14. Queue state must not be treated as permanent audit history.

15. Important asynchronous domain events should use a durable outbox pattern.

16. Meta outages must not make core finance unavailable.

17. Application containers and dependencies must use controlled versions.

18. Production must use HTTPS.

19. Redis must remain on private infrastructure/networking.

20. Production database changes must be migration-controlled.

21. Financial migrations require additional review and backups.

22. Logs and monitoring must redact secrets.

23. Staging and production financial databases must remain separate.

24. Microservices should not be introduced without a demonstrated need.

25. Technology decisions must favor correctness and maintainability over novelty.
```

---

# 215. Tech Stack Golden Rule

> **The technology stack must make the safe path the easiest path: PostgreSQL protects financial truth, NestJS controls business mutations, Prisma provides type-safe access without replacing database guarantees, BullMQ handles retryable asynchronous work, Redis coordinates but never owns money, Next.js presents the system without becoming its authority, and every external dependency can fail without causing the ledger to lie.**
