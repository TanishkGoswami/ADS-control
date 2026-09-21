# Deployment

## Overview

Ye document Ads Control system ke production deployment architecture aur release process ko define karta hai.

Initial production environment:

```text
Hostinger VPS
+
Docker
+
Docker Compose
+
Nginx
+
Managed Supabase
```

Application deployment ka objective sirf containers start karna nahi hai.

Har release ko ensure karna hoga:

```text
Correct application version deployed ho

Database migrations controlled hon

Financial writes unsafe state me na jayen

Workers compatible hon

Secrets protected hon

Rollback possible ho

Health verifiable ho

Existing jobs/data preserve hon
```

Core principle:

> **A deployment is successful only when the new application version, database schema, workers and background processing are mutually compatible and the system can prove that financial operations remain safe.**

---

# 1. Initial Production Topology

Recommended:

```text
Internet
   │
   ▼
Cloudflare
(Optional)
   │
   ▼
Nginx
   │
   ├──────────────► Next.js Web
   │
   └──────────────► NestJS API

Docker Private Network
   │
   ├── Web
   ├── API
   ├── Worker
   └── Redis

External Managed Services
   │
   ├── Supabase PostgreSQL
   ├── Supabase Auth
   ├── Supabase Storage
   ├── Supabase Realtime
   ├── Meta Marketing API
   └── Sentry
```

---

# 2. What Runs On VPS

Initial VPS:

```text
Nginx

Next.js Web

NestJS API

BullMQ Worker

Redis
```

Do not run duplicate PostgreSQL unless architecture intentionally changes.

---

# 3. What Remains External

```text
Supabase PostgreSQL

Supabase Auth

Supabase Storage

Supabase Realtime

Meta API

Sentry
```

---

# 4. Deployment Style

Recommended:

```text
Dockerized deployment
```

rather than:

```text
pm2 running source directly
```

for this system.

PM2 can remain useful for unrelated existing services, but this application's production deployment should be containerized for repeatability.

---

# 5. Why Docker

Benefits:

```text
Consistent runtime

Pinned Node environment

Dependency isolation

Easy rollback

Predictable worker processes

Repeatable staging/production
```

---

# 6. Docker Compose

Initial orchestration:

```text
Docker Compose
```

Suitable for single-VPS V1 deployment.

---

# 7. Recommended Files

Repository:

```text
docker/
├── nginx/
│   └── nginx.conf
│
├── web.Dockerfile
├── api.Dockerfile
└── worker.Dockerfile

compose.yaml
compose.production.yaml
```

---

# 8. Monorepo Build

Possible structure:

```text
apps/
├── web
├── api
└── worker
```

Each deployed as separate runtime process/container.

---

# 9. Shared Image vs Separate Images

Two valid approaches.

### Option A — Separate Images

```text
web image

api image

worker image
```

Benefits:

```text
Smaller images

Clear isolation
```

### Option B — Shared Backend Image

```text
backend image
├── API command
└── Worker command
```

Benefits:

```text
Same backend code version

Less duplicate build work
```

Recommended initially:

```text
Separate Web Image

Shared API/Worker Backend Image
```

if build structure stays simple.

---

# 10. Deployment Services

Example Compose services:

```text
nginx

web

api

worker

redis
```

---

# 11. Internal Ports

Example:

```text
web:
3000

api:
4000

redis:
6379
```

Only Nginx should expose application HTTP traffic publicly.

---

# 12. Public Ports

Recommended:

```text
80
443
```

SSH separately restricted.

---

# 13. Redis Port

Never expose:

```text
6379
```

directly to internet.

---

# 14. Docker Network

Use private:

```text
ads-control-network
```

for internal services.

---

# 15. Nginx

Nginx acts as:

```text
TLS termination / forwarding

Reverse proxy

Request limits

Security-header layer

Routing
```

---

# 16. Domain Structure

Recommended conceptually:

```text
app.company.com
→ Next.js
```

```text
api.company.com
→ NestJS
```

Alternative:

```text
app.company.com/api
→ NestJS
```

Both valid.

---

# 17. Recommended Initial Choice

Prefer:

```text
app.company.com

api.company.com
```

for clear separation.

---

# 18. Nginx Upstreams

Conceptual:

```text
upstream web {
  server web:3000;
}

upstream api {
  server api:4000;
}
```

---

# 19. Nginx Proxy Headers

Forward:

```text
Host

X-Real-IP

X-Forwarded-For

X-Forwarded-Proto

X-Request-ID
```

where appropriate.

---

# 20. HTTPS

Production must be:

```text
HTTPS ONLY
```

HTTP redirects to HTTPS.

---

# 21. TLS Source

Can be handled via:

```text
Cloudflare
```

and/or:

```text
Let's Encrypt / Nginx
```

depending on infrastructure choice.

---

# 22. Cloudflare

Optional.

Possible uses:

```text
DNS

Edge TLS

DDoS protection

WAF

Rate limiting
```

---

# 23. Cloudflare Caching

Authenticated application/API:

```text
DO NOT CACHE GENERICALLY
```

especially:

```text
/api/*
```

financial responses.

---

# 24. Cloudflare Proxy Consideration

Ensure backend/Nginx sees trustworthy client/proxy headers according to configured proxy chain.

Do not blindly trust arbitrary forwarded headers.

---

# 25. Environment Separation

Required:

```text
LOCAL

STAGING

PRODUCTION
```

---

# 26. Each Environment Must Have Separate

```text
Supabase project/database

Redis

Storage

Meta controlled credentials where possible

Sentry environment

Secrets
```

---

# 27. Never Point Staging To Production DB

This is a hard rule.

---

# 28. Staging Purpose

Staging validates:

```text
Migrations

Auth

Meta integration

Queue behavior

Financial workflows

Deployment scripts

Rollback
```

before production.

---

# 29. Production Configuration

Environment values include:

```text
NODE_ENV=production

DATABASE_URL

DIRECT_DATABASE_URL

REDIS_URL

SUPABASE_URL

SUPABASE_SECRET_KEY

META_APP_ID

META_APP_SECRET

META_GRAPH_API_VERSION

TOKEN_ENCRYPTION_KEY

SENTRY_DSN
```

Exact variables depend on implementation.

---

# 30. Environment Validation

Every service validates required environment variables at startup.

If critical value missing:

```text
FAIL STARTUP
```

---

# 31. Do Not Use Defaults For Secrets

Bad:

```text
META_APP_SECRET = "changeme"
```

in production.

---

# 32. Secret Files

If using `.env.production` on VPS:

```text
Not committed

Restricted filesystem permissions

Backed up securely only if required
```

---

# 33. Better Future Secret Management

Can migrate later to:

```text
Vault

Cloud secret manager

Dedicated deployment secret store
```

without changing business architecture.

---

# 34. Deployment User

Create dedicated Linux deployment/application user.

Do not routinely deploy as:

```text
root
```

---

# 35. SSH

Recommended:

```text
SSH key authentication

Password login disabled where feasible
```

---

# 36. VPS Firewall

Allow only necessary inbound traffic.

Example:

```text
22 restricted

80

443
```

---

# 37. Docker Daemon

Do not expose Docker daemon publicly.

---

# 38. Source Repository

Recommended:

```text
Private GitHub repository
```

---

# 39. Deployment Source Of Truth

Production version should correspond to:

```text
Git commit
```

and preferably:

```text
release/tag
```

---

# 40. Application Version

Inject into containers:

```text
APP_VERSION

GIT_COMMIT_SHA
```

---

# 41. Version Visibility

Admin/System page can display:

```text
App Version

Git SHA

Deployment Time
```

without sensitive infrastructure details.

---

# 42. CI Pipeline

Recommended:

```text
Push / Pull Request
↓
Install Dependencies
↓
Lint
↓
Typecheck
↓
Unit Tests
↓
Integration Tests
↓
Build
↓
Container Build
```

---

# 43. Production Release Pipeline

Recommended:

```text
Approved Main Commit
↓
CI Pass
↓
Build Versioned Images
↓
Push Image Registry
↓
Production Backup/Checks
↓
Migration
↓
Deploy API/Web/Workers
↓
Health Verification
↓
Smoke Tests
```

---

# 44. Image Registry

Recommended future-ready approach:

```text
GitHub Container Registry
```

or equivalent.

---

# 45. Why Registry

Production should deploy:

```text
already built immutable image
```

rather than building unpredictable source directly on VPS.

---

# 46. Initial Simpler V1

If needed initially:

```text
git pull

docker compose build

docker compose up -d
```

is acceptable with controlled branch/commit.

But long-term prefer registry.

---

# 47. Immutable Image Tags

Use:

```text
ads-control-api:2026.09.17-abc123
```

or:

```text
:git-sha
```

---

# 48. Avoid Only `latest`

`latest` can exist as convenience but should not be sole rollback reference.

---

# 49. Rollback Image

Always retain previous known-good image.

---

# 50. Database Migrations

Database schema changes are highest-risk deployment component.

Use:

```text
Prisma Migrate
+
reviewed SQL migrations
```

---

# 51. Migration Ownership

Only deployment pipeline/admin migration process should apply production migrations.

Application startup should not casually auto-run destructive migrations.

---

# 52. Migration Review

Every production migration checked for:

```text
Data loss

Table locks

Index build cost

RLS effects

Financial constraints

Backward compatibility
```

---

# 53. Financial Migration

Any change affecting:

```text
ledger_transactions

ledger_entries

fund_allocations

vendor settlements

client balances
```

requires special review.

---

# 54. Pre-Migration Backup

Before high-risk production migration:

```text
verify current backup / PITR state
```

and create additional backup where operationally appropriate.

---

# 55. Expand-Contract Strategy

Recommended for breaking schema evolution.

Phase 1:

```text
Add new nullable column/table
```

Phase 2:

```text
Deploy compatible application
```

Phase 3:

```text
Backfill data
```

Phase 4:

```text
Switch reads/writes
```

Phase 5:

```text
Remove old field later
```

---

# 56. Why Expand-Contract

Allows old and new containers to coexist briefly.

Important for safe deployment.

---

# 57. Avoid Migration Example

Bad:

```text
Rename critical column

Immediately deploy
```

while old API container still running.

---

# 58. Safer Rename

```text
Add new column

Dual compatibility

Backfill

Deploy

Remove old column in later release
```

---

# 59. Database Enum Changes

Treat carefully.

Adding value usually easier than removing/renaming.

---

# 60. Raw Meta Fields

Because external Meta values can change:

prefer flexible raw text fields where already designed.

This reduces migration risk.

---

# 61. Migration Transaction

Use transactional migrations where PostgreSQL operation supports it.

Be aware some operations may have special locking/performance implications.

---

# 62. Large Backfill

Do not run huge data rewrite inside deployment request if it can be:

```text
async maintenance/backfill job
```

after compatible schema deployed.

---

# 63. Migration Status

Deployment process should record:

```text
Migration version

Started

Completed

Failure
```

---

# 64. Migration Failure

If migration fails:

```text
STOP DEPLOYMENT
```

Do not continue deploying application requiring new schema.

---

# 65. Application Compatibility

Before deployment ensure:

```text
New API can run with new schema

Workers can run with new schema

Web matches API contract
```

---

# 66. Deployment Order

Typical safe sequence:

```text
1. Pre-deploy checks

2. Backward-compatible DB migration

3. API deployment

4. Worker deployment

5. Web deployment

6. Post-deploy verification
```

Exact order may vary by release.

---

# 67. Why API Before Web

Web should not call endpoints unavailable in production yet.

---

# 68. Worker Compatibility

A new worker may encounter:

```text
old queued jobs
```

Therefore job payload compatibility must be considered before worker deploy.

---

# 69. Queue Payload Version

Workers should support expected previous payload version during transition.

---

# 70. Old Worker During Deploy

If DB schema remains backward compatible:

old workers can finish current jobs safely.

---

# 71. Graceful Worker Shutdown

Before replacement:

```text
Stop receiving new jobs

Finish safe active jobs

Release locks

Close DB/Redis
```

---

# 72. Graceful API Shutdown

API should:

```text
Stop accepting new connections

Finish current requests

Close DB
```

---

# 73. Docker Stop Grace Period

Configure suitable grace period for:

```text
API

Workers
```

Workers may need longer than web.

---

# 74. Long-Running Jobs

Jobs should be chunked/checkpointed rather than requiring 30-minute graceful shutdown.

---

# 75. Deployment During Financial Transaction

A short financial DB transaction should either:

```text
COMMIT
```

or:

```text
ROLLBACK
```

Application termination must not create half-posted state.

---

# 76. Unknown HTTP Result

If transaction committed but connection dropped during deploy:

frontend uses:

```text
Idempotency Key
```

to safely discover result.

---

# 77. Deployment Lock

Prevent two production deployments running concurrently.

Use:

```text
CI environment lock

or deployment lock
```

---

# 78. Maintenance Mode

Optional.

Useful only for deployments requiring temporary write blocking.

---

# 79. Prefer No Full Maintenance

Normal releases should support:

```text
minimal/no downtime
```

through backward-compatible migrations.

---

# 80. Financial Write Maintenance

For risky financial migration:

```text
FINANCIAL_WRITES_ENABLED=false
```

may be enabled temporarily.

Read access can remain.

---

# 81. Maintenance Banner

UI should clearly show:

```text
Financial posting temporarily unavailable for maintenance.
```

---

# 82. Do Not Queue User Financial Writes During Maintenance

Reject safely.

Do not store browser requests for later automatic execution.

---

# 83. Meta Sync During Maintenance

Can often continue unless migration affects Meta tables.

---

# 84. Queue Pause

Specific queues may be paused during relevant migrations.

Example:

```text
reconciliation
```

while financial schema changing.

---

# 85. Queue Resume

Only after new schema/application verified.

---

# 86. Outbox During Queue Pause

Events remain:

```text
PENDING
```

in PostgreSQL.

They can process after resume.

---

# 87. Health Checks

Web:

```text
container process health
```

API:

```text
/health/live

/health/ready
```

Worker:

```text
DB/Redis/process health
```

---

# 88. API Liveness

Answers:

```text
Is process alive?
```

---

# 89. API Readiness

Answers:

```text
Can API safely serve requests?
```

At minimum:

```text
PostgreSQL reachable
```

---

# 90. Worker Readiness

Requires:

```text
PostgreSQL

Redis

Worker processors initialized
```

---

# 91. Meta API Is Not Core Readiness

Meta outage should not remove API readiness.

Integration health is separate.

---

# 92. Redis API Readiness

Decision depends on endpoint architecture.

Core finance reads/writes may continue even if Redis unavailable because outbox persists downstream work.

API may report:

```text
DEGRADED
```

rather than unavailable.

---

# 93. System Health Model

Admin health should display:

```text
Web: Healthy

API: Healthy

Database: Healthy

Redis: Healthy

Workers: Healthy

Meta Integration: Degraded
```

---

# 94. Docker Healthchecks

Use Compose health checks for service dependencies where useful.

---

# 95. `depends_on`

Do not treat Docker startup ordering as business readiness.

Application should retry/handle dependency startup safely.

---

# 96. Startup Database Connection

API should fail startup or readiness if canonical DB unavailable.

---

# 97. Startup Redis Connection

Worker should not report ready without Redis.

---

# 98. Restart Policy

Recommended:

```text
restart: unless-stopped
```

or equivalent intentional policy.

---

# 99. Crash Loop

Repeated restart should trigger alert/investigation.

Do not simply let container crash forever unnoticed.

---

# 100. Resource Limits

Set appropriate:

```text
CPU

Memory
```

limits/reservations where supported.

---

# 101. Worker Resource Isolation

Worker should not consume all VPS memory and kill API.

---

# 102. Redis Memory

Monitor:

```text
Used memory

Evictions

Queue size
```

Redis eviction policy must not be configured in a way that arbitrarily destroys critical BullMQ keys.

---

# 103. Redis Volume

Persist Redis data to Docker volume.

---

# 104. Redis Persistence

Use configured:

```text
AOF

RDB snapshots
```

according to queue durability plan.

---

# 105. Redis Is Recoverable

Even with persistence:

architecture assumes Redis can be rebuilt.

PostgreSQL remains canonical.

---

# 106. Nginx Timeouts

Normal API endpoints:

short enough to detect failures.

Long operations:

```text
202 Accepted
```

instead of increasing Nginx timeout to many minutes.

---

# 107. Upload Limits

Nginx/API must configure upload size intentionally for:

```text
Payment proofs

Evidence files
```

---

# 108. File Upload Strategy

Prefer direct signed upload to Supabase Storage where appropriate.

This avoids routing large files through VPS.

---

# 109. API Body Limit

Set reasonable JSON body limits.

Do not accept unlimited payloads.

---

# 110. Nginx Rate Limiting

Can provide additional protection for:

```text
Login-like routes

Manual sync

API abuse
```

Backend-level rate limiting remains available.

---

# 111. Logs

Container logs should go to:

```text
stdout/stderr
```

in structured format.

---

# 112. Log Collection

Initial:

```text
Docker logs
+
Sentry
```

may be sufficient.

Future:

```text
Loki

ELK

Cloud logging
```

can be added.

---

# 113. Log Rotation

Docker host logs must rotate.

Avoid filling VPS disk.

---

# 114. Disk Monitoring

Monitor:

```text
Docker images

Container logs

Redis data

Temporary report files

System logs
```

---

# 115. Temporary Files

Large report generation should remove temp files after upload.

---

# 116. Storage Reports

Final reports should go to:

```text
Supabase Storage
```

rather than permanent VPS filesystem.

---

# 117. VPS Filesystem Is Not Canonical Storage

Container/VPS loss should not remove:

```text
Financial evidence

Canonical reports meant for retention
```

---

# 118. Docker Volumes

Persistent local volume primarily needed for:

```text
Redis
```

and possibly controlled operational files.

---

# 119. Backups

Database backup strategy detailed in:

```text
TECH/10-BACKUP-AND-RECOVERY.md
```

Deployment process must be aware of backup readiness before risky release.

---

# 120. Application Rollback

If application code is bad but migration remains compatible:

```text
Deploy previous image
```

---

# 121. Rollback Requirement

Keep:

```text
Current image

Previous known-good image
```

readily available.

---

# 122. Rollback Trigger

Examples:

```text
Financial posting errors

High 500 rate

Auth broken

Major UI/API incompatibility

Worker corruption risk
```

---

# 123. Rollback Is Not Always DB Rollback

Database migration reversal can be dangerous.

Prefer:

```text
forward-compatible schema
+
application rollback
```

---

# 124. Destructive DB Migration

Should only happen after old application no longer depends on removed structure and rollback window is closed.

---

# 125. Forward Fix

For many production DB issues:

```text
forward migration
```

is safer than restoring an old schema.

---

# 126. Emergency Rollback

Procedure:

```text
Pause risky queue if needed

Disable financial writes if needed

Deploy previous application image

Verify health

Investigate DB compatibility

Resume controlled operations
```

---

# 127. Deployment Smoke Tests

After release test:

```text
Login

Dashboard load

Client list

Vendor list

Ledger read

Meta account list

Worker connectivity
```

---

# 128. Financial Smoke Test

Do not necessarily post real money transaction merely to test.

Use:

```text
read-only integrity checks

staging transaction tests
```

and controlled production diagnostics.

---

# 129. Production Integrity Check

After deploy:

```text
Ledger unbalanced count = 0

Negative vendor payable count = 0

Over-allocation count = 0

Outbox backlog within threshold
```

---

# 130. Migration Integrity Check

If migration touches financial tables:

run pre/post invariant queries.

---

# 131. Worker Smoke Test

Enqueue controlled:

```text
health/test job
```

or verify scheduler/known safe job executes.

---

# 132. Meta Smoke Test

Perform safe read-only:

```text
connection health
```

on controlled connection.

---

# 133. Realtime Smoke Test

Trigger safe notification/invalidation and verify UI receives it.

Not required to block deployment if realtime temporarily degraded unless release depends critically on it.

---

# 134. Staging Release

Every production release should ideally have same image already running in staging.

---

# 135. Staging Schema

Apply migration to staging first.

Run:

```text
integration tests

financial tests

worker tests
```

---

# 136. Production Approval

High-risk release may require manual approval before deployment.

Examples:

```text
Ledger migration

Auth architecture change

Fund allocation change
```

---

# 137. Release Checklist

Before production:

```text
CI green

Migration reviewed

Staging verified

Secrets configured

Backup verified

Rollback image known

Queue compatibility checked

Feature flags checked
```

---

# 138. Feature Flags

Risky feature deploy disabled first.

Example:

```text
CROSS_CLIENT_TRANSFER_ENABLED=false
```

Deploy code.

Then intentionally enable later.

---

# 139. Dark Launch

Possible for:

```text
new reconciliation engine

new report engine
```

Run without exposing user actions initially.

---

# 140. Financial Feature Rollout

Recommended stages:

```text
Staging

Internal admin

Limited production scope

Full production
```

---

# 141. Meta API Version Deployment

Meta API upgrade treated as controlled release.

Steps:

```text
Update config/staging

Run mapper/contract tests

Canary controlled connections

Production rollout
```

---

# 142. Do Not Change Meta API Version Ad Hoc

Central configuration only.

---

# 143. ORM Upgrade

Prisma major upgrade must be separate deliberate release.

---

# 144. Node Upgrade

Node major upgrade:

```text
local/staging tests

Docker rebuild

production rollout
```

---

# 145. Redis Upgrade

Test:

```text
BullMQ jobs

Retries

Delayed jobs

Persistence

Restart recovery
```

before production.

---

# 146. Nginx Reload

Use configuration validation before reload.

Conceptually:

```text
nginx -t
```

then reload.

---

# 147. Bad Nginx Config

Must not take healthy application offline due syntax error.

---

# 148. Certificate Renewal

Automate renewal if using Let's Encrypt.

Monitor expiration.

---

# 149. DNS Changes

Treat DNS/proxy changes separately from application release where possible.

---

# 150. Cloudflare Proxy Incidents

If proxy/rate limit blocks app unexpectedly:

ability to temporarily:

```text
switch proxy behavior

adjust WAF/rate rules
```

should be documented.

---

# 151. Database Connection Pooling

Production:

```text
API

Workers

Next server
```

must not collectively exhaust Supabase connection limits.

---

# 152. Connection Budget

Define per process:

```text
API pool

Worker pool

Migration/direct connection
```

---

# 153. Scale-Out Check

Before adding more API/worker replicas:

review DB connection budget.

---

# 154. Horizontal API Scaling

Future:

```text
api-1

api-2
```

behind Nginx/load balancer.

API should remain stateless.

---

# 155. Worker Scaling

BullMQ allows multiple worker processes.

Financial DB locks/idempotency preserve correctness.

---

# 156. Web Scaling

Can run multiple Next.js instances later.

---

# 157. Single VPS Risk

Initial V1 single VPS has one infrastructure failure domain.

If VPS fails:

```text
Web/API/Worker/Redis unavailable
```

while Supabase canonical data remains external.

---

# 158. Single VPS Recovery

Provision replacement VPS:

```text
Install Docker

Load secrets

Deploy same images

Restore/reinitialize Redis

Point DNS

Resume schedulers/outbox
```

---

# 159. Why External PostgreSQL Helps

VPS failure does not destroy canonical financial database.

---

# 160. Redis Recovery After VPS Loss

Redis jobs may be lost depending on backup state.

System reconstructs important work using:

```text
Outbox

Sync freshness

ReportRequest

Reconciliation state
```

---

# 161. RTO

Recovery Time Objective should later be formally defined.

Example business decision:

```text
How quickly must system return after VPS failure?
```

---

# 162. RPO

Recovery Point Objective mainly applies to:

```text
PostgreSQL

Storage evidence
```

Canonical data should have much stricter RPO than queue state.

---

# 163. Deployment Documentation

Production repository should include:

```text
DEPLOYMENT-RUNBOOK.md
```

or equivalent operations documentation.

---

# 164. Deployment Runbook

Should contain:

```text
Prerequisites

Deploy command

Migration command

Health checks

Smoke tests

Rollback

Emergency contacts/ownership
```

without embedding secrets.

---

# 165. Incident Runbooks

Separate:

```text
Redis down

Meta down

Database down

Auth down

VPS down

Bad deployment
```

---

# 166. Production Access

Only authorized engineering/admin users should have:

```text
SSH

Docker control

Secrets access

Migration access
```

---

# 167. Finance User

Does not need VPS shell access.

---

# 168. Audit Deployment

Record production deployments.

Fields:

```text
Version

Commit SHA

Deployed by

Started at

Completed at

Migration version

Result
```

---

# 169. Deployment Audit Location

Can live in:

```text
CI history
```

plus optional internal:

```text
deployment_records
```

table.

---

# 170. Deployment Failure

Record:

```text
FAILED
```

with safe reason.

---

# 171. Application Start Order

Typical:

```text
Redis

API

Worker

Web/Nginx
```

but services must tolerate dependency startup races.

---

# 172. API Startup

Must not run if:

```text
DB schema incompatible
```

where compatibility can be detected.

---

# 173. Worker Startup

Should verify:

```text
DB

Redis

Required queue definitions/config
```

---

# 174. Web Startup

Can start independently of Redis.

---

# 175. Read-Only Degraded Mode

Future useful feature:

If workers/Meta unavailable:

```text
application remains read/write finance
```

where safe.

If DB integrity concern:

```text
read-only mode
```

may be triggered.

---

# 176. Financial Fail-Closed

If backend cannot prove DB transaction integrity:

financial mutation returns failure.

Never queue uncertain money command in browser for later.

---

# 177. Deployment Failure During Approval

Approval request remains in DB.

After application recovery workflow continues.

---

# 178. Deployment Failure During Meta Sync

SyncRun may become stale/RUNNING.

Watchdog detects and retries/marks abandoned.

---

# 179. Deployment Failure During Report

Report job can retry from canonical ReportRequest.

---

# 180. Deployment Failure During Outbox Dispatch

Pending event remains/retries.

---

# 181. Monitoring After Deploy

For first post-release window monitor:

```text
5xx rate

Auth failures

DB errors

Queue failures

Outbox backlog

Meta sync failures

Memory

CPU

Redis
```

---

# 182. Financial Monitoring After Deploy

Also monitor:

```text
Unbalanced ledger checks

Unexpected receivables

Over-allocation

Reconciliation spike
```

---

# 183. Canary Release

Future when multiple API instances exist:

deploy:

```text
one instance
```

first.

Verify.

Then roll out rest.

---

# 184. Blue-Green

Possible future:

```text
Blue environment

Green environment
```

for near-zero downtime.

Not required V1.

---

# 185. Kubernetes

Not needed for initial system.

Single VPS + Docker Compose is sufficient until actual scaling/availability requirements justify orchestration complexity.

---

# 186. Automated Deployment

Recommended eventually:

```text
GitHub Actions
↓
Build Images
↓
Registry
↓
SSH/Deployment Runner
↓
docker compose pull
↓
migration
↓
docker compose up
```

---

# 187. CI Production Secret Access

CI gets only deployment secrets needed.

Do not give CI unrestricted financial database access unless required by migration strategy.

---

# 188. Migration Runner

Could run:

```text
one-off Docker container
```

using migration credentials.

---

# 189. One-Off Commands

Examples:

```text
docker compose run --rm migrate
```

or equivalent deployment script.

---

# 190. No Manual SQL Habit

Production schema should not drift through ad hoc terminal SQL.

If emergency SQL required:

```text
document

review

audit

create matching migration/fix
```

---

# 191. Database Drift Detection

CI/staging should detect migration/schema drift.

---

# 192. Feature Configuration Drift

Production business settings stored in DB and audited.

Do not hide business rules only inside `.env`.

---

# 193. Infrastructure Configuration

Keep version-controlled:

```text
Dockerfiles

Compose

Nginx config

Deployment scripts
```

---

# 194. Secrets Exception

Never store secret values in infrastructure repository.

---

# 195. Dockerfile Principles

Use:

```text
multi-stage builds

production dependencies only

non-root runtime where feasible
```

---

# 196. Build Cache

Can improve CI speed.

Must not leak secrets into image layers.

---

# 197. Secrets During Build

Avoid passing runtime secrets as Docker build args.

They may remain in image/history.

---

# 198. Runtime Secrets

Inject when container starts.

---

# 199. Source Maps

Production source maps may be uploaded privately to Sentry.

Do not publicly expose sensitive source maps unnecessarily.

---

# 200. Next.js Build Env

Only values intended for browser may use:

```text
NEXT_PUBLIC_*
```

Secrets never embedded at build time.

---

# 201. API Container

Receives:

```text
DB credentials

Auth config

financial config
```

---

# 202. Meta Worker Secret Separation

If worker split later:

```text
worker-meta
```

gets Meta secrets.

Other workers do not need them.

---

# 203. Backup Worker

Not required on VPS if managed provider backup handles DB.

But backup verification processes still needed.

---

# 204. Production Time

Server containers should operate in:

```text
UTC
```

where possible.

Business timezone handled explicitly at application layer.

---

# 205. Clock Synchronization

VPS should have reliable system clock/NTP.

Audit timestamps and token validation depend on accurate time.

---

# 206. Deployment Tests — API

Verify:

```text
/health/live

/health/ready

authenticated read

permission denial
```

---

# 207. Deployment Tests — Worker

Verify:

```text
job pickup

DB write

retry capability

outbox dispatch
```

---

# 208. Deployment Tests — Finance

Staging must test:

```text
Client payment

Vendor settlement

Overpayment

Refund

Reversal

Concurrent settlement
```

against release candidate.

---

# 209. Deployment Tests — Meta

Verify:

```text
Connection health

Ad Account status

Recent spend

Error handling
```

with controlled Meta assets.

---

# 210. Deployment Tests — Security

Verify:

```text
No secret in web bundle

Cross-tenant access denied

Protected routes require auth

Secret/service keys server-only
```

---

# 211. Deployment Tests — Redis Loss

Staging exercise:

```text
Stop Redis

Post safe business event

Verify outbox remains

Restart Redis

Verify downstream processing resumes
```

---

# 212. Deployment Tests — Worker Restart

Kill worker during retryable job.

Verify job safely resumes.

---

# 213. Deployment Tests — API Restart

Restart API during normal traffic.

Idempotent mutation retries remain safe.

---

# 214. Deployment Tests — Rollback

At least periodically rehearse rollback in staging.

A rollback plan that has never been tested is not reliable.

---

# 215. Deployment Status

Recommended release statuses:

```text
PENDING

DEPLOYING

VERIFYING

SUCCESS

FAILED

ROLLED_BACK
```

---

# 216. Release Notes

Every release should summarize:

```text
Features

Fixes

Migrations

Risky changes

Rollback notes
```

---

# 217. Financial Release Notes

Explicitly call out changes affecting:

```text
Ledger

Allocations

Settlements

Refunds

Reconciliation
```

---

# 218. Emergency Hotfix

Still requires:

```text
commit

build

version

deployment record
```

Avoid editing production files manually.

---

# 219. Postmortem

If deployment causes material incident:

record:

```text
What happened

Impact

Root cause

Recovery

Prevention
```

---

# 220. Deployment Ownership

Define who can:

```text
Deploy

Apply migration

Rollback

Change secrets

Pause financial writes
```

---

# 221. Principle of Least Privilege

Developer access does not automatically mean:

```text
Production deployment permission
```

---

# 222. Production Database Access

Limit direct access.

Prefer application/admin tooling for normal operations.

---

# 223. Read-Only Analyst Access

If needed later, create restricted read-only role.

Do not share admin DB credential.

---

# 224. Production Redis Access

Also restricted.

Queue manipulation can affect operations even if not financial truth.

---

# 225. Deployment Integrity Rules

System must enforce:

```text
1. Production must deploy versioned, reproducible application builds.

2. Database schema changes must be migration-controlled.

3. High-risk financial migrations must be reviewed and backed up.

4. Migration failure must stop deployment.

5. Application and worker versions must remain schema-compatible.

6. Backward-compatible migrations should be preferred.

7. Destructive schema cleanup should occur only after old application compatibility is no longer required.

8. Production must retain a known-good rollback image.

9. Rollback must not blindly reverse financial database migrations.

10. Financial writes may be temporarily disabled during unsafe migration windows.

11. User financial commands must never be queued locally for later automatic execution during maintenance.

12. Workers must shut down gracefully.

13. Interrupted background jobs must be idempotently recoverable.

14. Redis loss must not destroy canonical financial truth.

15. Outbox state must allow downstream jobs to recover after Redis failure.

16. Secrets must never be embedded in Docker images or source control.

17. Only required ports should be publicly exposed.

18. Redis must remain private.

19. Production traffic must use HTTPS.

20. Staging and production must use separate databases and secrets.

21. Production application configuration must be validated at startup.

22. Authenticated financial API responses must not be publicly cached.

23. Long-running work must execute asynchronously rather than through long HTTP requests.

24. Production logs must rotate and must not contain secrets.

25. VPS filesystem must not be treated as canonical financial document storage.

26. Production releases must perform health and smoke verification.

27. Financial invariants should be checked after relevant deployments/migrations.

28. Feature flags should be used to control risky feature rollouts.

29. Meta API version upgrades must follow staged compatibility testing.

30. Production access, migration access and secret access must follow least privilege.

31. Deployment actions must remain traceable to a version and actor.

32. Emergency hotfixes must remain version-controlled.

33. A deployment must fail closed if database compatibility or financial safety cannot be established.

34. System recovery must not depend on one specific VPS instance.

35. Deployment architecture must make rollback and reconstruction predictable rather than improvisational.
```

---

# 226. Deployment Golden Rule

> **Production deployment must never turn application delivery into a financial-risk event. Every release must be reproducible, schema-compatible, observable and reversible at the application layer; database changes must be deliberate and conservative; workers must recover safely from interruption; and canonical financial truth must remain protected even if a container, Redis instance, proxy or entire VPS fails.**
