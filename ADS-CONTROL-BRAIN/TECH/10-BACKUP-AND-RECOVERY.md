# Backup and Recovery

## Overview

Ye document Ads Control system ke backup, disaster recovery, restore, recovery verification aur business continuity rules ko define karta hai.

System ke andar multiple types of critical state exist karenge:

```text
PostgreSQL financial data

Ledger

Fund ownership

Vendor liabilities

Client balances

Meta normalized data

Audit history

Supabase Storage files

Application configuration

Secrets

Docker images

Redis queue state
```

In sabki recovery importance equal nahi hai.

Core principle:

> **Canonical financial truth must survive loss of an application container, Redis instance, VPS or external synchronization state, and every recovery must be followed by integrity verification before normal financial operations resume.**

---

# 1. Recovery Philosophy

Recovery architecture follows:

```text
Prevent
↓
Back Up
↓
Detect
↓
Restore
↓
Verify
↓
Reconcile
↓
Resume
```

Restore without verification is not complete recovery.

---

# 2. What Is Most Important

Priority order:

```text
1. PostgreSQL financial/business database

2. Supabase Storage evidence/files

3. Secrets and configuration

4. Application source/images

5. Redis queue state

6. Temporary/cache state
```

---

# 3. Canonical Financial State

Canonical financial truth exists in:

```text
Supabase PostgreSQL
```

including:

```text
Ledger Transactions

Ledger Entries

Client Payments

Vendor Funding

Vendor Settlements

Fund Lots

Fund Allocations

Receivables

Refunds

Reconciliation

Audit
```

---

# 4. PostgreSQL Loss Is Critical

Losing Redis is operationally disruptive.

Losing PostgreSQL financial history is:

```text
CRITICAL BUSINESS INCIDENT
```

---

# 5. Redis Is Reconstructable

Important queue work should be recoverable from:

```text
Outbox

SyncRun

ReportRequest

Freshness State

Reconciliation State

Scheduled-work state
```

stored in PostgreSQL.

---

# 6. Storage Is Separate

Supabase database backups do not contain the actual files stored through Supabase Storage.

They contain database-side Storage metadata, but deleted/missing Storage objects are not restored merely by restoring the database.

Therefore Storage requires a separate backup strategy.

---

# 7. Backup Domains

Define separate backup domains:

```text
DATABASE_BACKUP

STORAGE_BACKUP

CONFIG_BACKUP

SECRET_RECOVERY

APPLICATION_BACKUP

REDIS_BACKUP

INFRASTRUCTURE_BACKUP
```

---

# 8. Recovery Classes

Recommended classification:

```text
TIER 0
Financial Canonical Data

TIER 1
Financial Evidence / Storage

TIER 2
Application & Configuration

TIER 3
Operational Queue State

TIER 4
Caches / Temporary Files
```

---

# 9. Tier 0

Includes:

```text
Ledger

Funds

Client Financial State

Vendor Financial State

Approvals

Audit

Reconciliation
```

Highest recovery priority.

---

# 10. Tier 1

Includes:

```text
Payment proofs

Refund proofs

Vendor documents

Reconciliation evidence

Generated retained reports
```

---

# 11. Tier 2

Includes:

```text
Git Repository

Docker Images

Nginx config

Docker Compose

Environment templates

Migration files
```

---

# 12. Tier 3

Includes:

```text
Redis queues

Delayed jobs

Retry counters

Transient worker state
```

---

# 13. Tier 4

Includes:

```text
Query cache

Temporary exports

Build cache

Container temp files
```

Can normally be discarded.

---

# 14. Recovery Objectives

Two core metrics:

```text
RPO
Recovery Point Objective

RTO
Recovery Time Objective
```

---

# 15. RPO

RPO answers:

> How much recently written data can the business tolerate losing?

---

# 16. RTO

RTO answers:

> How long can the system remain unavailable before service must be restored?

---

# 17. Initial Financial Recovery Target

Recommended design target for production financial data:

```text
Preferred RPO:
Minutes, not hours

Preferred RTO:
A few hours or less
```

Exact contractual values must be chosen according to:

```text
Business risk

Transaction volume

Backup plan

PITR budget

Operational capability
```

---

# 18. Minimum Backup Baseline

At absolute minimum production should have:

```text
Managed daily PostgreSQL backup

Independent periodic logical database export

Separate Storage-object backup

Versioned application source/images

Documented secret recovery

Restore testing
```

---

# 19. Preferred Financial Baseline

For meaningful production money volume:

```text
PITR
+
Independent logical database backups
+
Separate Storage backup
```

is strongly preferred.

---

# 20. Supabase Managed Backups

Supabase currently automatically provides daily backups for Pro, Team and Enterprise projects.

Current documented retention:

```text
Pro:
7 days

Team:
14 days

Enterprise:
up to 30 days
```

---

# 21. Plan Dependence

Do not hardcode provider retention assumptions into application logic.

Backup monitoring must read/document actual current project configuration.

---

# 22. Point-in-Time Recovery

Supabase PITR allows recovery to a selected point with much finer granularity than daily backup snapshots.

Recommended for this system when financial exposure justifies the cost.

---

# 23. Why PITR Matters

Suppose:

```text
02:00
Daily backup

15:00
Major database corruption
```

Daily-only backup could theoretically require restoring to:

```text
02:00
```

and reconstructing later transactions manually.

PITR drastically reduces this recovery gap.

---

# 24. PITR vs Daily Backup

Current Supabase behavior:

```text
PITR enabled
→ regular Daily Backup process is replaced by PITR backup mechanism
```

rather than both systems independently running.

---

# 25. PITR Configuration

Document:

```text
Enabled?

Retention window

Earliest recovery point

Latest recovery point

Who can execute restore?
```

---

# 26. PITR Access

Only high-authority infrastructure administrators should have permission to initiate production restore.

---

# 27. PITR Is Not Audit Reversal

Never use PITR because:

```text
Vendor settlement was entered incorrectly
```

Normal business mistake should be fixed via:

```text
Ledger reversal
+
Correct transaction
```

---

# 28. PITR Is Disaster Recovery

Use PITR for events such as:

```text
Severe corruption

Accidental mass deletion

Bad destructive migration

Security incident requiring point-in-time restoration
```

---

# 29. Why Not Restore For Normal Mistake

Database restore affects:

```text
all users

all transactions

all modules

all activity
```

not one mistaken transaction.

---

# 30. Independent Logical Backup

Even with provider-managed backups, maintain periodic:

```text
pg_dump
```

or:

```text
supabase db dump
```

logical backup.

Supabase currently documents manual logical backup through CLI or `pg_dump`, including when physical backups/PITR are enabled.

---

# 31. Why Independent Backup

Provides:

```text
Provider-independent recovery artifact

Migration/testing capability

Extra defense against operator mistakes

Historical archive
```

---

# 32. Logical Backup Frequency

Recommended starting policy:

```text
Daily:
automated logical database backup
```

for production.

Can increase frequency if business RPO requires.

---

# 33. Logical Backup Location

Do not save only on same VPS.

Use separate destination.

Examples:

```text
S3-compatible object storage

Secure backup bucket

Separate cloud provider
```

---

# 34. 3-2-1 Principle

Recommended conceptual backup strategy:

```text
3 copies

2 storage/media locations

1 off-site / independent copy
```

---

# 35. Example

```text
Copy 1:
Production Supabase

Copy 2:
Supabase managed backup/PITR

Copy 3:
Independent encrypted logical backup
```

---

# 36. Backup Separation

Do not store all recovery copies under one credential with unrestricted delete capability.

---

# 37. Backup Account

Use dedicated:

```text
backup service identity
```

with minimum required permissions.

---

# 38. Logical Backup Content

Should include:

```text
Schema

Tables

Data

Functions

Policies

Views

Required roles/configuration where appropriate
```

based on restore method.

---

# 39. Supabase CLI Backup

Supabase currently documents separate dump commands for:

```text
roles

schema

data
```

when creating manual backup artifacts.

---

# 40. Backup Manifest

Every independent backup should generate metadata:

```text
backupId

environment

startedAt

completedAt

databaseVersion

applicationVersion

schemaMigrationVersion

fileSize

checksum

status
```

---

# 41. Backup Checksum

Generate:

```text
SHA-256
```

for backup files.

---

# 42. Why Checksum

Allows detection of:

```text
Corrupted file

Incomplete upload

Unexpected modification
```

---

# 43. Backup Encryption

Independent backup containing financial data should be encrypted.

---

# 44. Backup Encryption Key

Must be stored separately from backup artifact.

---

# 45. Do Not Embed Password

Avoid creating recovery archive containing plaintext:

```text
DATABASE_PASSWORD
```

---

# 46. Backup Secrets

Database backups do not replace secret backups/recovery.

Secrets should usually be:

```text
rotatable/re-creatable
```

rather than blindly dumped alongside database.

---

# 47. Custom Database Role Passwords

Supabase currently notes that daily backup files do not include passwords for custom database roles, so restored custom roles may require password reset.

Include this in restore runbook.

---

# 48. Backup Verification

A backup job returning:

```text
exit code 0
```

is not enough.

Verify:

```text
File exists

File non-empty

Checksum stored

Expected tables included

Upload completed
```

---

# 49. Restore Test

Periodically restore backup into:

```text
isolated test environment
```

and run integrity tests.

---

# 50. Backup Without Restore Test

Considered:

```text
UNVERIFIED BACKUP
```

---

# 51. Recommended Restore Drill

At least:

```text
Quarterly
```

for production-critical system initially.

Higher assurance environments may test more frequently.

---

# 52. Restore Drill Must Not Use Production

Restore into:

```text
temporary isolated project/database
```

where practical.

---

# 53. Restore Drill Scope

Verify:

```text
Schema restores

Auth data expected

Ledger intact

Allocations intact

Audit intact

RLS exists

Functions/triggers exist

Application can connect
```

---

# 54. Financial Restore Verification

Run:

```text
Ledger balance checks

Vendor payable checks

Client fund conservation

Allocation conservation

Reconciliation checks
```

---

# 55. Storage Backup

Supabase Storage files require separate object-level backup.

Current Supabase Storage supports bulk access through its S3-compatible interface and CLI, enabling tools such as `rclone` or S3-compatible clients to copy files.

---

# 56. Storage Metadata

Database contains:

```text
storage.buckets

storage.objects
```

metadata.

Actual object bytes are separate.

---

# 57. Storage Backup Objective

Backup:

```text
Actual object bytes

Object paths

Checksums

Relevant metadata
```

---

# 58. Recommended Storage Backup

Example:

```text
Supabase Storage
↓
S3-Compatible Endpoint
↓
rclone / backup worker
↓
Independent private backup bucket
```

---

# 59. Storage Backup Frequency

Recommended starting baseline:

```text
Daily
```

for retained financial evidence.

Could be more frequent depending upload volume/risk.

---

# 60. Immutable Evidence

Important financial proof may additionally use:

```text
object versioning

immutable retention
```

at backup destination where supported.

---

# 61. Storage Deletion Risk

If a file is deleted from Supabase Storage after database backup:

restoring database alone will not restore that object.

This is why independent Storage backup is mandatory.

---

# 62. Storage Restore

Recovery needs two components:

```text
Storage metadata

Actual objects
```

---

# 63. New Project Restore

Supabase's current restore-to-new-project flow creates a database-level copy but does not automatically copy Storage objects/settings; these require separate restoration/reconfiguration.

---

# 64. New Project Recovery Warning

Do not assume:

```text
Database cloned
=
Project fully recovered
```

---

# 65. New Project Manual Reconfiguration

May include:

```text
Storage objects/settings

Auth configuration/API keys

Realtime settings

Extensions/settings

External integrations
```

depending on restore approach.

---

# 66. Infrastructure Configuration Backup

Version-control:

```text
Dockerfiles

Compose files

Nginx config

Deployment scripts

Database migrations

RLS migration SQL

Application configuration schema
```

---

# 67. Config-as-Code

Infrastructure should be reconstructable from Git plus secrets.

---

# 68. Configuration Inventory

Maintain:

```text
Required Environment Variables

Supabase configuration

Meta App IDs/config

DNS records

Nginx routes

Cloudflare settings

Storage buckets

RLS policies
```

---

# 69. Secrets Recovery

Do not simply back up plaintext `.env` into Git.

Maintain secure procedure for:

```text
Secret retrieval

Secret rotation

Secret recreation
```

---

# 70. Secret Recovery Categories

Some secrets can be restored:

```text
Encryption key
```

Some should be regenerated:

```text
Database password

API secret

Deployment token
```

depending on incident.

---

# 71. Encryption Key Criticality

If Meta tokens are application-encrypted using a key and that key is permanently lost:

```text
encrypted Meta tokens become unrecoverable
```

---

# 72. Encryption Key Backup

Encryption root/key material requires a separately secured backup/recovery process.

---

# 73. Encryption Key Exposure

Do not put encryption key inside same database backup.

---

# 74. Key Versioning

Store:

```text
keyVersion
```

with encrypted records.

Recovery runbook maps key versions to secure key storage.

---

# 75. Application Backup

Source is protected through:

```text
Git repository
```

Production builds through:

```text
Container registry
```

---

# 76. Git Alone Is Not Enough

If latest source does not build due external dependency drift:

immutable Docker image provides faster recovery.

---

# 77. Docker Image Retention

Retain:

```text
Current production image

Several previous known-good images
```

according to deployment policy.

---

# 78. Image Labels

Store:

```text
Git SHA

Build date

App version
```

inside image metadata.

---

# 79. Migration Files

Must remain permanently version-controlled.

Database backup without migration history makes future maintenance harder.

---

# 80. VPS Backup

Entire VPS image backup can be useful but is not primary financial recovery strategy.

---

# 81. Why VPS Snapshot Is Secondary

VPS does not contain canonical PostgreSQL.

It mainly contains:

```text
Docker runtime

Redis

Nginx

Local configuration
```

All should be reconstructable.

---

# 82. VPS Snapshot

Optional:

```text
Provider snapshot
```

before major infrastructure changes.

---

# 83. Do Not Depend Solely On VPS Snapshot

Recovery must work on:

```text
completely new VPS
```

---

# 84. Redis Backup

Redis may use:

```text
AOF

RDB
```

persistence.

---

# 85. Redis Recovery Priority

Redis state is:

```text
operationally helpful
```

but not mandatory for canonical recovery.

---

# 86. Redis Complete Loss Scenario

After clean Redis:

```text
Start Redis

Start workers

Process pending outbox

Detect stale/missing SyncRuns

Requeue reports

Requeue overdue sync

Run reconciliation
```

---

# 87. No Manual Financial Reconstruction From Redis

Redis must never be required to reconstruct:

```text
Client balance

Vendor payable

Ledger history
```

---

# 88. Redis Snapshot

Can reduce:

```text
queue recovery time
```

but must not raise Redis importance above PostgreSQL.

---

# 89. Temporary Report Files

Do not back up local report-generation temp directory.

Generated retained report should be uploaded to Storage.

---

# 90. Cache Backup

Do not back up:

```text
TanStack cache

API cache

temporary Redis cache
```

unless bundled operationally with Redis persistence.

---

# 91. Recovery Scenarios

Define explicit runbooks for:

```text
Single bad transaction

Database table corruption

Mass accidental deletion

Bad migration

Supabase project outage

VPS failure

Redis loss

Storage object deletion

Credential compromise

Full environment rebuild
```

---

# 92. Scenario A — One Wrong Financial Transaction

Do not restore database.

Use:

```text
Reversal
+
Correct Transaction
```

---

# 93. Scenario B — One Client Accidentally Archived

Use application recovery/unarchive workflow.

No DB restore.

---

# 94. Scenario C — Mass Business Data Deleted

Potential recovery candidate:

```text
PITR
```

or backup restoration.

First freeze writes and investigate.

---

# 95. Scenario D — Bad Migration

Actions:

```text
Disable financial writes

Assess corruption scope

Stop affected workers

Choose forward-fix or restore

Validate
```

---

# 96. Forward Fix vs Restore

If migration only broke schema behavior but data remains intact:

```text
forward fix
```

may be safer.

If data was destructively corrupted:

```text
PITR/restore
```

may be needed.

---

# 97. Scenario E — VPS Lost

Canonical data remains in Supabase.

Recovery:

```text
Provision VPS

Install Docker

Restore configs/secrets

Deploy known-good images

Start Redis

Start API/worker/web

Resume outbox/schedulers

Run smoke tests
```

---

# 98. VPS RPO

For canonical money:

```text
approximately irrelevant
```

because canonical DB is external.

For Redis:

some operational queue state may be lost and reconstructed.

---

# 99. Scenario F — Redis Lost

Do not restore database.

Rebuild queue.

---

# 100. Scenario G — Storage File Deleted

Recover object from independent Storage backup.

Validate:

```text
Path

Hash

Metadata

Entity link
```

---

# 101. Scenario H — Supabase Project Catastrophic Failure

Recovery may require:

```text
New Supabase project

Database restore

Storage restore

Auth configuration

API keys

Realtime config

RLS verification

Application secret updates
```

---

# 102. Restore-To-New-Project

Supabase currently provides a restore-to-new-project capability on eligible paid projects, but it is a database-oriented recovery and requires manual recreation of several project-level services/settings.

Do not rely on it as a one-click full-environment DR solution.

---

# 103. Auth Data

Database-level project restore/clone can include authentication schema data/users depending on restore method, but application Auth settings/API keys may still require manual reconfiguration.

---

# 104. Recovery Configuration Checklist

After new project:

```text
Auth URLs

SMTP

API keys

RLS

Storage buckets

Storage policies

Realtime authorization

Database extensions

Connection pool

Network restrictions
```

---

# 105. Scenario I — Credential Compromise

Backup restore may not solve compromise.

Actions:

```text
Rotate compromised secret

Revoke sessions/tokens

Review logs/audit

Assess unauthorized changes

Restore only if data corruption occurred
```

---

# 106. Database Restore Is Not Security Cleanup

Restoring old DB while attacker still has valid credential simply reopens risk.

Credentials must be secured first.

---

# 107. Recovery Command Structure

Only documented runbooks should be used for production restore.

Avoid improvising commands during incident.

---

# 108. Restore Authorization

Recommended:

```text
Two-person approval
```

for production PITR/full restore where team size permits.

---

# 109. Why Dual Approval

Restore can intentionally discard legitimate recent data.

---

# 110. Pre-Restore Freeze

Before destructive restore:

```text
Disable Financial Writes

Pause Workers

Pause Meta Sync if needed

Prevent new user mutations
```

---

# 111. Capture Current State

Before restore where possible:

create:

```text
Emergency logical dump
```

of current damaged database.

---

# 112. Why Capture Damaged State

It may contain legitimate transactions created after the target restore point.

Can help reconstruct/reconcile afterward.

---

# 113. Restore Point Selection

Choose:

```text
latest known-good point before corruption
```

not arbitrary earliest backup.

---

# 114. Incident Timeline

Determine:

```text
Last known good transaction

First known bad transaction

Incident discovery time
```

---

# 115. Recovery Gap

After restoring older point:

all legitimate actions after restore target need identification.

---

# 116. Recovery Gap Sources

Can use:

```text
Emergency pre-restore dump

Audit logs

External bank references

Meta data

Storage uploads

Application logs

User records
```

to reconstruct what happened.

---

# 117. Never Blindly Replay Financial Actions

Post-restore replay must be reviewed and idempotent.

---

# 118. Restore Downtime

Current Supabase restore documentation notes project access is unavailable during restore, and restore time varies with database size/activity.

Plan operational downtime rather than promising instant restoration.

---

# 119. Maintenance Mode

During restore:

```text
Application Maintenance
```

should block financial operations.

---

# 120. Post-Restore Startup Order

Recommended:

```text
1. Database restored

2. Validate schema/migrations

3. Keep workers paused

4. Run integrity checks

5. Restore/verify Storage

6. Verify Auth

7. Verify application reads

8. Reconcile

9. Resume controlled writes

10. Resume workers/sync
```

---

# 121. Do Not Start Workers Immediately

Old queued/scheduled work could act on partially recovered state.

---

# 122. Schema Migration Version

Compare restored:

```text
migration version
```

with application image.

---

# 123. Application Compatibility

If backup predates current schema:

either:

```text
apply migrations
```

or deploy matching compatible application version.

---

# 124. Restore Migration Risk

Apply migrations only after confirming they did not cause original incident.

---

# 125. Post-Restore Integrity Phase

Financial writes stay disabled until integrity checks pass.

---

# 126. Ledger Check

Verify every posted ledger transaction:

```text
SUM(DEBITS)
=
SUM(CREDITS)
```

---

# 127. Orphan Check

Ensure no:

```text
Ledger Entry without Transaction

Allocation without Fund Lot

Settlement without Vendor

Payment without Client
```

---

# 128. Fund Lot Conservation

For every fund lot:

```text
Original Amount
=
Available
+
Reserved
+
Allocated
+
Locked
+
Consumed
+
Refunded
+
Transferred
+
Written Off
```

according to state model.

---

# 129. Double Allocation Check

Same active funds must not exist in multiple active buckets simultaneously.

---

# 130. Client Conservation

Validate:

```text
Client Funds In
=
Current Client-Owned Funds
+
Attributed Spend
+
Refunds
+
Approved Transfers Out
± valid defined adjustments
```

---

# 131. Vendor Payable

Verify:

```text
Vendor Payable >= 0
```

always.

---

# 132. Vendor Receivable

Verify overpayments are represented separately.

No negative payable used as receivable.

---

# 133. Vendor Batch Reconciliation

```text
Gross Funding
-
Valid Settlements
-
Approved Offsets
=
Open Payable
```

according to model.

---

# 134. Refund Integrity

Check:

```text
Requested

Reserved

Approved

Posted/Paid

External reference
```

relationships.

---

# 135. Locked Funds

Validate:

```text
Original Locked
=
Still Locked
+
Recovered
+
Refunded
+
Written Off
```

---

# 136. Client Receivables

Must remain separate from client-wallet assets.

---

# 137. Unattributed Spend

Restore must not magically assign unattributed spend.

Keep unresolved.

---

# 138. Audit Integrity

Verify high-risk transactions have corresponding audit context.

---

# 139. Idempotency Integrity

Confirm restored idempotency records align with posted financial transactions.

---

# 140. Why Idempotency Matters After Restore

Clients/users may retry commands whose response was lost around incident.

Existing keys prevent duplicates.

---

# 141. Reconciliation After Restore

Run:

```text
FULL RECONCILIATION
```

before declaring recovery complete.

---

# 142. Meta Resynchronization

After DB restore:

Meta may contain newer external facts.

Perform:

```text
Connection Health

Account Status

Recent Spend

Campaign Sync

Backfill covering recovery window
```

---

# 143. Meta Is Not Replay Source For Ledger

Meta can reconstruct:

```text
Spend observations
```

but cannot recreate:

```text
Vendor repayments

Client ownership

Internal refunds
```

---

# 144. Bank/External Verification

Where important financial transactions occurred during recovery gap:

manually/external-system verify them before replay.

---

# 145. Storage Verification

Compare:

```text
Database attachment records
```

with:

```text
Storage objects
```

---

# 146. Missing Object Check

Detect:

```text
metadata exists
but object missing
```

---

# 147. Orphan Storage Object Check

Detect:

```text
object exists
but no expected metadata/entity reference
```

for investigation.

---

# 148. Hash Verification

Where evidence hashes stored:

```text
Restored object SHA-256
=
Stored expected SHA-256
```

---

# 149. Storage Restore Ordering

Prefer:

```text
Database metadata restored

Objects restored

Integrity matched
```

before enabling evidence-dependent workflows.

---

# 150. Realtime Recovery

Realtime state is not backed up as business truth.

After restore:

```text
Reconnect clients

Rebuild channel sessions

Use current DB state
```

---

# 151. Realtime Settings

If new Supabase project is used:

reconfigure authorization/settings explicitly.

---

# 152. Auth Recovery

Verify:

```text
Login

JWT validation

RLS

MFA

Redirect URLs

SMTP
```

before reopening application.

---

# 153. API Keys

New project can require new:

```text
Supabase URL

Publishable Key

Secret Key
```

Application environments need updating.

---

# 154. Secret Rotation After DR

For catastrophic/security-related recovery:

prefer rotating:

```text
Database password

Supabase secret key where appropriate

Meta token if exposed

Deployment credentials
```

---

# 155. DNS Recovery

If moving infrastructure:

update:

```text
DNS

Cloudflare

TLS
```

after application health verified.

---

# 156. New VPS Recovery

Maintain provisioning checklist:

```text
OS updates

Docker

Firewall

Deployment user

SSH

Nginx

Environment secrets

Compose

Monitoring
```

---

# 157. Automated Infrastructure

Future:

```text
Ansible

Terraform
```

can make VPS/project reconstruction faster.

Not required V1 but useful as system matures.

---

# 158. Recovery Environment

Do not directly test unknown backup by overwriting production.

Restore into isolated environment first whenever incident allows.

---

# 159. Emergency Exception

If production fully destroyed and time-critical:

restore directly according to approved runbook.

Still perform post-restore verification.

---

# 160. Backup Monitoring

Backup jobs should generate:

```text
SUCCESS

FAILED

MISSED
```

state.

---

# 161. Backup Alert

Alert if expected backup does not complete.

---

# 162. Backup Age

Dashboard/operations should know:

```text
Last Successful DB Logical Backup

Last Storage Backup

PITR Status

Oldest Recovery Point
```

---

# 163. Backup Freshness Alert

Example:

```text
No successful independent DB backup > 24h
```

→ HIGH alert.

Threshold configurable.

---

# 164. Storage Backup Alert

Example:

```text
No successful Storage backup > 24h
```

→ alert.

---

# 165. Backup Failure Does Not Delete Old Backups

Never overwrite only previous known-good backup during new backup operation.

---

# 166. Versioned Backup Files

Use:

```text
database/
  2026/
    09/
      17/
        ...

storage/
  ...
```

or equivalent.

---

# 167. Backup Naming

Example:

```text
ads-control-prod-db-2026-09-17T020000Z.dump
```

---

# 168. Backup Manifest Example

```text
{
  "backupId": "...",
  "environment": "production",
  "type": "DATABASE_LOGICAL",
  "startedAt": "...",
  "completedAt": "...",
  "sha256": "...",
  "schemaVersion": "...",
  "applicationVersion": "...",
  "status": "SUCCESS"
}
```

---

# 169. Backup Retention

Example starting policy:

```text
Daily:
30 days

Weekly:
12 weeks

Monthly:
12 months
```

for independent encrypted logical backups.

Actual retention depends on:

```text
Cost

Legal requirements

Business requirements

Data growth
```

---

# 170. Provider Retention vs Independent Retention

Independent backups can retain history longer than managed Supabase backup window.

---

# 171. Storage Retention

Evidence backup retention should align with business/legal document-retention policy.

Do not automatically delete financial evidence because application record was archived.

---

# 172. Backup Deletion

Backup deletion itself is privileged action.

---

# 173. Immutable Backup Protection

Where supported:

```text
Object Lock

Retention Lock

MFA Delete
```

can protect backups from compromised credentials/ransomware.

---

# 174. Backup Account Separation

Prefer backup destination credentials different from production application credentials.

---

# 175. Application Should Not Delete Backups

Normal API/worker credentials should not have backup-deletion permission.

---

# 176. Ransomware Principle

If attacker compromises production application credentials:

they should not automatically gain authority to delete independent backups.

---

# 177. Backup Encryption Key Rotation

Maintain procedure for rotating backup encryption keys while keeping older backups decryptable until retention expiry.

---

# 178. Recovery Key Test

Periodically verify recovery team can decrypt backup artifact.

---

# 179. No Single-Person Secret Dependency

Critical recovery should not depend on one employee remembering:

```text
password/key
```

---

# 180. Recovery Ownership

Define responsible roles:

```text
Incident Commander

Database Recovery Owner

Infrastructure Owner

Finance Verification Owner

Security Owner
```

depending on incident scale.

---

# 181. Finance Verification Owner

Recovery should not be declared financially healthy solely by engineering.

Finance/business owner should verify critical balances/reports.

---

# 182. Recovery Statuses

Recommended:

```text
INCIDENT_DETECTED

WRITES_FROZEN

RESTORING

TECHNICAL_VALIDATION

FINANCIAL_VALIDATION

RECONCILING

LIMITED_SERVICE

RECOVERED

POSTMORTEM
```

---

# 183. Limited Service

Possible:

```text
Read-only application available
```

while financial validation continues.

---

# 184. Reopening Financial Writes

Requires explicit checklist completion.

---

# 185. Reopen Checklist

```text
Database accessible

Migration state verified

Ledger balanced

Fund conservation passed

Vendor checks passed

Auth verified

Storage critical objects verified

Reconciliation completed/understood

Workers safe to resume

Incident owner approves
```

---

# 186. Worker Resume Order

Recommended:

```text
Outbox

Reconciliation

Current Meta Status

Recent Spend

Routine Sync

Historical Backfill

Reports/Notifications
```

depending on incident.

---

# 187. Why Outbox First

Important committed business events may be waiting.

---

# 188. Why Backfill Last

Historical backfill can create heavy load during fragile recovery.

---

# 189. Rate-Limited Recovery

Do not release thousands of reconstructed jobs simultaneously.

Throttle queue rebuild.

---

# 190. Recovery Queue Priorities

Use existing priority system.

---

# 191. External Meta Gap

After downtime:

```text
backfill recovery interval
```

plus normal recent rolling window.

---

# 192. Duplicate Meta Facts

Upsert/idempotency makes overlap safe.

---

# 193. Recovery Reconciliation Window

Run reconciliation across at least:

```text
affected incident interval
```

plus safety overlap.

---

# 194. Recovery Snapshot

After system declared healthy:

create fresh:

```text
logical backup
+
financial integrity report
```

as new clean recovery baseline.

---

# 195. Post-Recovery Audit

Record:

```text
Incident

Restore point

Backup used

Who approved restore

Who performed restore

Integrity results

Time writes resumed
```

---

# 196. Postmortem

Every serious restore incident should document:

```text
Root cause

Impact

Lost/replayed data

Recovery duration

Control failures

Preventive actions
```

---

# 197. Backup Incident Test Cases

Test:

```text
Logical DB backup job fails

Backup upload fails

Checksum mismatch

Backup destination unavailable

Storage backup partial
```

---

# 198. Database Restore Test Cases

```text
Restore latest backup

Restore older backup

Migration after restore

Custom role credential reset

Application connects
```

---

# 199. PITR Test

Where PITR enabled:

periodically restore to isolated/non-production environment where provider capability permits.

Verify selected recovery point behaves as expected.

---

# 200. Storage Restore Test

Delete test Storage object in staging.

Restore from backup.

Verify:

```text
bytes

path

metadata

hash
```

---

# 201. Redis Loss Test

Delete staging Redis.

Verify:

```text
Outbox processing resumes

Scheduled sync reconstructed

Report requests recovered
```

---

# 202. VPS Loss Test

Provision clean test VPS/environment from documented configuration.

Measure actual recovery time.

---

# 203. Secrets Recovery Test

Verify team can obtain:

```text
DB access

Supabase keys

encryption key

Meta configuration
```

without exposing them in documentation.

---

# 204. Auth Recovery Test

Restore/rebuild environment.

Verify existing/staged users can authenticate as expected.

---

# 205. Tenant Isolation After Restore

Critical.

Run cross-tenant authorization/RLS tests after database recovery.

---

# 206. Why

A restore missing:

```text
RLS policy
```

could expose data despite rows being intact.

---

# 207. Database Function Verification

Confirm restored:

```text
Triggers

Functions

Constraints

Indexes

Policies
```

not only table rows.

---

# 208. Migration Drift Test

Compare restored schema to expected migration state.

---

# 209. Ledger Immutability Test

Attempt unauthorized update to posted transaction.

Must still fail after restore.

---

# 210. Audit Immutability Test

Same.

---

# 211. Backup Scope — Meta Raw Data

Normalized Meta data should be backed up because it contributes to historical reconciliation.

---

# 212. Meta Rebuildability

Some current Meta data may be refetched.

Historical availability from provider is not guaranteed forever.

Therefore internal stored historical SpendFacts remain valuable backup data.

---

# 213. Raw Meta Response Retention

If raw provider payloads are transient/debug-only:

they do not need same backup retention as normalized canonical facts unless required by policy.

---

# 214. Audit Data Retention

Audit should receive long-term backup protection.

---

# 215. Idempotency Records

Include in DB backups.

Important for safe replay after disaster.

---

# 216. Outbox Records

Include in DB backups.

After restore, inspect pending/processing events carefully.

---

# 217. Processing Outbox After PITR

An event marked:

```text
PENDING
```

at restored point may have actually been delivered after that point before disaster.

Consumer idempotency protects duplicate delivery.

---

# 218. Why At-Least-Once Recovery Matters

PITR rolls database state backward.

External side effects may not roll backward.

---

# 219. External Side-Effect Reconciliation

Examples:

```text
Email already sent

Meta operation completed

External refund executed

Bank payment happened
```

while restored DB predates acknowledgment.

These require explicit reconciliation.

---

# 220. V1 Meta Is Read-Only

This substantially reduces external side-effect complexity for Meta recovery.

---

# 221. Financial External Payments

If refunds/vendor payments are performed outside system:

after restore compare:

```text
Bank/external payment reference

Restored internal settlement state
```

before reposting.

---

# 222. Never Repeat Payment Blindly After Restore

A payment might have externally succeeded even if restored DB says:

```text
PENDING
```

---

# 223. Recovery State For Uncertain External Transaction

Use:

```text
WAITING_FOR_EXTERNAL_CONFIRMATION
```

rather than re-executing blindly.

---

# 224. Recovery and Approvals

An approval restored to:

```text
APPROVED
```

does not automatically mean its action should be re-executed.

Check whether external/internal side effect already occurred after restore point.

---

# 225. Backup Admin UI

Future internal page can show:

```text
Backup Health

Last Verified Restore

PITR Enabled

Storage Backup Freshness
```

but should not expose backup credentials.

---

# 226. Restore UI

Do not expose production PITR/full DB restore as casual application button.

Use infrastructure/admin runbook.

---

# 227. User-Level Recovery

Normal users can use application workflows for:

```text
Reverse transaction

Restore archive

Retry report

Reconnect Meta
```

not database restore.

---

# 228. Provider Project Deletion

Supabase warns that deleting a project permanently removes associated project data and backups.

Therefore project deletion is an extreme privileged action requiring independent backups and strict governance.

---

# 229. Project Deletion Protection

Recommended:

```text
Restricted Supabase organization permissions

MFA

Independent backups
```

---

# 230. Free Tier

Production financial system should not depend on Free-tier recovery limitations.

Use a plan appropriate for:

```text
backup retention

availability

support

PITR requirements
```

---

# 231. Backup Costs

Backup/PITR cost is part of financial system operating cost.

Do not remove recovery protection merely to optimize small infrastructure expense without business risk review.

---

# 232. Recovery Documentation

Required files/runbooks:

```text
DATABASE-RESTORE-RUNBOOK.md

STORAGE-RESTORE-RUNBOOK.md

VPS-REBUILD-RUNBOOK.md

REDIS-RECOVERY-RUNBOOK.md

DISASTER-RECOVERY-CHECKLIST.md
```

These can be added later under operations documentation.

---

# 233. Recovery Contacts

Runbooks identify roles/owners, not personal passwords or secrets.

---

# 234. Backup Automation

Automate:

```text
Logical DB backup

Checksum

Encryption

Upload

Retention cleanup

Success/failure reporting
```

---

# 235. Backup Worker Location

Independent scheduled backup process may run from:

```text
VPS

dedicated CI schedule

separate backup host
```

A separate environment is safer than relying only on production VPS.

---

# 236. Backup Credentials

Read-only where possible.

Backup destination requires:

```text
write new object
```

but ideally not broad destructive access.

---

# 237. Retention Cleanup

Dedicated lifecycle policy preferred over application script with broad delete credentials.

---

# 238. Backup Monitoring Alert

If backup success notification stops:

absence itself should generate an alert.

---

# 239. Backup Success Is Not Enough

Track:

```text
Last Backup

Last Verified Backup

Last Restore Test
```

separately.

---

# 240. Example

```text
Last Backup:
Today

Last Verified Restore:
4 months ago
```

should be treated as recovery-risk warning.

---

# 241. Recovery Metrics

Track:

```text
Backup success rate

Backup age

Restore-test age

Actual restore duration

Database size

Storage backup size
```

---

# 242. Capacity Planning

Backup duration grows with:

```text
Database size

Storage size

Network bandwidth
```

Monitor trends before backups exceed operational windows.

---

# 243. Large Database

As data grows:

```text
PITR
+
physical provider backup
```

becomes increasingly useful compared with relying solely on large logical dumps.

---

# 244. Logical Backup Still Useful

Even with physical/PITR:

keep periodic logical export for provider-independent recovery and inspection.

---

# 245. Data Archival

Archiving old financial records to cheaper storage should not remove canonical records unless explicit legal/business architecture exists.

V1:

```text
No destructive financial archival
```

---

# 246. Audit Archive

Future long-term archive may use immutable storage.

But application should retain enough searchable audit history for operations.

---

# 247. Recovery Security

Backups can bypass application authorization.

Anyone with backup may access:

```text
all clients

all vendors

all financial data
```

Protect strongly.

---

# 248. Backup Download Audit

Record who downloads production backup where tooling/provider allows.

---

# 249. Backup Local Copy

Do not leave unencrypted production dump on developer laptop indefinitely.

---

# 250. Temporary Restore Data

Destroy temporary restored environments after approved testing.

---

# 251. Restore Environment Access

Limit to recovery/testing personnel.

---

# 252. Sanitized Testing

Prefer sanitized data for normal development.

Full backup restore only for controlled DR testing.

---

# 253. Recovery and Compliance

If legal/regulatory retention requirements are introduced:

backup retention must align with them.

Do not make assumptions in V1.

---

# 254. V1 Backup Requirements

Required:

```text
Supabase managed database backup

Independent automated logical DB backup

Encrypted off-site backup

Database backup manifest + checksum

Separate Supabase Storage backup

Git source control

Versioned Docker images

Protected secrets/key recovery

Redis persistence

Redis reconstruction logic

Restore runbooks

Periodic restore drills

Post-restore financial integrity checks

Post-restore reconciliation
```

---

# 255. Strongly Recommended Production Upgrade

Once meaningful financial volume exists:

```text
Enable PITR
```

subject to business-approved retention/cost.

---

# 256. Not Sufficient Alone

None of these alone is enough:

```text
Supabase daily DB backup only

VPS snapshot only

Redis AOF only

Git repository only

Storage metadata only
```

---

# 257. Backup and Recovery Integrity Rules

System must enforce:

```text
1. PostgreSQL is the highest-priority backup asset.

2. Canonical financial data must have managed and independent backup protection.

3. Supabase database backup must never be assumed to include Storage object bytes.

4. Storage objects require a separate backup strategy.

5. Redis must remain reconstructable and non-canonical.

6. Application containers must be reconstructable from source/versioned images.

7. Recovery must work on a completely new VPS.

8. Production backups must not live only on the production VPS.

9. Independent backups must be encrypted.

10. Backup encryption keys must remain separate from backup artifacts.

11. Backup files should have cryptographic checksums.

12. Successful backup creation does not prove successful restoration.

13. Restore drills must be performed periodically.

14. Normal accounting errors must use reversal workflows, not database restore.

15. PITR/full restore is reserved for disaster-level incidents.

16. Production financial writes must be frozen during destructive recovery.

17. The damaged pre-restore database should be preserved when possible.

18. Restore-point selection must be based on an incident timeline.

19. Restored schema must be compatible with the deployed application.

20. Workers must remain paused until financial integrity checks pass.

21. Every restored ledger must pass debit-credit equality checks.

22. Every restored fund lot must pass conservation checks.

23. Vendor payable must never become negative after restore.

24. Client and vendor receivables must remain distinct from wallets/payables.

25. Audit and idempotency records must be restored and validated.

26. A database restore must be followed by reconciliation.

27. Meta recent status/spend must be resynchronized after recovery.

28. External payments occurring after a restore point must be reconciled before replay.

29. Financial actions must never be blindly replayed after PITR.

30. Storage metadata must be reconciled against restored object bytes.

31. Authentication, RLS and tenant isolation must be retested after restore.

32. Secret rotation may be required after security-related recovery.

33. Restored backup environments must remain isolated and protected.

34. Provider project deletion must never be considered reversible without independent backups.

35. Backup health, restore-test age and recovery readiness must be monitored separately.

36. Backup retention must be explicit and documented.

37. Old known-good backups must not be overwritten by a failed new backup.

38. Recovery actions must be auditable.

39. Financial writes should resume only after technical and financial validation.

40. Every major recovery should end with a new clean backup baseline and postmortem.
```

---

# 258. Backup and Recovery Golden Rule

> **A backup is valuable only if it can restore trustworthy financial truth. Database state, Storage evidence, application configuration and critical keys must therefore be protected independently; Redis and infrastructure must remain rebuildable; every restore must be followed by financial integrity checks and reconciliation; and no financial operation may resume until the system can prove that ownership, liabilities, allocations and ledger history remain internally consistent.**
