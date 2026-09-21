# Database Schema

## Overview

Ye document system ke proposed PostgreSQL database schema ko define karta hai.

Recommended database:

```text
Supabase PostgreSQL
```

Application stack:

```text
NestJS
+
Prisma
+
PostgreSQL
```

Database design ka primary goal:

```text
Financial Correctness
+
Historical Traceability
+
Multi-Tenant Isolation
+
Meta Sync Reliability
+
Fast Reporting
+
Auditability
```

Core rule:

> **Database schema ko current UI ke according nahi, business truth aur long-term financial integrity ke according design kiya jayega.**

---

# 1. Schema Design Principles

Database should follow:

```text
1. UUID primary keys

2. organization_id on tenant-owned records

3. Foreign-key integrity

4. Money stored in minor units

5. Currency stored separately

6. Posted financial records immutable

7. Soft delete / archive for historical entities

8. Stable external Meta IDs

9. Relationship history preserved

10. Duplicate prevention through unique constraints

11. Idempotency for financial posting

12. Indexed operational queries

13. Explicit timestamps

14. Raw external status + normalized internal status

15. Derived balances not manually editable
```

---

# 2. Money Storage

All money fields should use:

```text
BIGINT
```

representing minor currency units.

Example:

```text
₹1,250.50
=
125050
```

Do not use:

```text
FLOAT
DOUBLE
REAL
```

for money.

---

# 3. Currency

Store:

```text
currency_code VARCHAR(3)
```

Example:

```text
INR
USD
AED
```

Currency must exist on every financial record where relevant.

---

# 4. Common Timestamp Fields

Most mutable tables:

```text
created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

Financial/business tables may additionally contain:

```text
business_date DATE

effective_at TIMESTAMPTZ

posted_at TIMESTAMPTZ
```

---

# 5. Common Tenant Field

Most business tables:

```text
organization_id UUID NOT NULL
```

Foreign key:

```text
organizations.id
```

---

# 6. organizations

Purpose:

Top-level tenant/workspace.

Columns:

```text
id UUID PK

name TEXT NOT NULL

slug TEXT NOT NULL

default_currency VARCHAR(3) NOT NULL

timezone TEXT NOT NULL

status TEXT NOT NULL

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(slug)
```

---

# 7. user_profiles

Authentication handled by Supabase Auth.

`user_profiles` stores application profile.

Columns:

```text
id UUID PK

organization_id UUID FK

auth_user_id UUID NOT NULL

name TEXT NOT NULL

email TEXT

status TEXT NOT NULL

primary_role_id UUID NULL

last_login_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraints:

```text
UNIQUE(auth_user_id)

UNIQUE(organization_id, email)
```

where email uniqueness is desired.

---

# 8. roles

Columns:

```text
id UUID PK

organization_id UUID NULL

code TEXT NOT NULL

name TEXT NOT NULL

description TEXT

is_system_role BOOLEAN NOT NULL DEFAULT false

status TEXT NOT NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Examples:

```text
ADMIN

FINANCE

ADS_MANAGER

VIEWER
```

Constraint:

```text
UNIQUE(organization_id, code)
```

System/global roles may use null organization according to implementation.

---

# 9. permissions

Permission catalog.

Columns:

```text
id UUID PK

code TEXT NOT NULL

category TEXT NOT NULL

description TEXT

created_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(code)
```

Example:

```text
CREATE_VENDOR_SETTLEMENT
```

---

# 10. role_permissions

Many-to-many mapping.

Columns:

```text
id UUID PK

role_id UUID FK

permission_id UUID FK

created_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(role_id, permission_id)
```

---

# 11. user_roles

Recommended even if V1 generally gives one primary role.

Columns:

```text
id UUID PK

user_id UUID FK

role_id UUID FK

created_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(user_id, role_id)
```

---

# 12. user_resource_scopes

Allows resource-level access.

Columns:

```text
id UUID PK

organization_id UUID FK

user_id UUID FK

resource_type TEXT NOT NULL

resource_id UUID NULL

access_scope TEXT NOT NULL

created_at TIMESTAMPTZ
```

Examples:

```text
BUSINESS_PORTFOLIO

AD_ACCOUNT

CLIENT

VENDOR
```

`resource_id = NULL` may represent all resources of type if designed that way.

---

# 13. meta_connections

Columns:

```text
id UUID PK

organization_id UUID FK

internal_name TEXT NOT NULL

external_context_id TEXT

token_secret_reference TEXT

connection_status TEXT NOT NULL

permission_status TEXT

last_successful_sync_at TIMESTAMPTZ

last_failed_sync_at TIMESTAMPTZ

connected_at TIMESTAMPTZ

disabled_at TIMESTAMPTZ

created_by UUID FK user_profiles

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Do not store raw token in plaintext.

---

# 14. meta_connection_permissions

Optional table to track granted external scopes.

Columns:

```text
id UUID PK

meta_connection_id UUID FK

permission_name TEXT NOT NULL

permission_status TEXT

checked_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(meta_connection_id, permission_name)
```

---

# 15. business_portfolios

Columns:

```text
id UUID PK

organization_id UUID FK

meta_business_id TEXT NOT NULL

name TEXT NOT NULL

status TEXT NOT NULL

first_seen_at TIMESTAMPTZ

last_seen_at TIMESTAMPTZ

last_synced_at TIMESTAMPTZ

archived_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, meta_business_id)
```

Index:

```text
INDEX organization_id, status

INDEX name
```

---

# 16. ad_accounts

Columns:

```text
id UUID PK

organization_id UUID FK

meta_ad_account_id TEXT NOT NULL

name TEXT NOT NULL

internal_alias TEXT

currency_code VARCHAR(3) NOT NULL

timezone_name TEXT

raw_meta_status TEXT

normalized_status TEXT NOT NULL

can_run_ads BOOLEAN NULL

purpose_type TEXT

low_balance_threshold_minor BIGINT NULL

first_seen_at TIMESTAMPTZ

last_seen_at TIMESTAMPTZ

last_status_sync_at TIMESTAMPTZ

last_spend_sync_at TIMESTAMPTZ

archived_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, meta_ad_account_id)
```

Indexes:

```text
INDEX organization_id, normalized_status

INDEX organization_id, currency_code

INDEX meta_ad_account_id
```

---

# 17. meta_asset_relationships

Tracks hierarchy/access relationships historically.

Columns:

```text
id UUID PK

organization_id UUID FK

parent_type TEXT NOT NULL

parent_id UUID NOT NULL

child_type TEXT NOT NULL

child_id UUID NOT NULL

relationship_type TEXT NOT NULL

source_meta_connection_id UUID NULL

effective_from TIMESTAMPTZ NOT NULL

effective_to TIMESTAMPTZ NULL

is_current BOOLEAN NOT NULL DEFAULT true

source_type TEXT NOT NULL

created_at TIMESTAMPTZ
```

Examples:

```text
META_CONNECTION → BUSINESS_PORTFOLIO

BUSINESS_PORTFOLIO → AD_ACCOUNT
```

relationship types:

```text
OWNED

SHARED

CLIENT_ACCESS

DISCOVERED

UNKNOWN
```

Index:

```text
INDEX organization_id, parent_type, parent_id

INDEX organization_id, child_type, child_id

INDEX is_current
```

---

# 18. ad_account_status_history

Columns:

```text
id UUID PK

organization_id UUID FK

ad_account_id UUID FK

previous_status TEXT

new_status TEXT NOT NULL

raw_meta_status TEXT

can_run_ads BOOLEAN

source_type TEXT NOT NULL

sync_run_id UUID NULL

detected_at TIMESTAMPTZ NOT NULL

effective_at TIMESTAMPTZ

created_at TIMESTAMPTZ
```

Indexes:

```text
INDEX ad_account_id, detected_at DESC
```

---

# 19. meta_campaigns

Columns:

```text
id UUID PK

organization_id UUID FK

ad_account_id UUID FK

meta_campaign_id TEXT NOT NULL

name TEXT NOT NULL

raw_status TEXT

effective_status TEXT

meta_created_at TIMESTAMPTZ

meta_updated_at TIMESTAMPTZ

first_seen_at TIMESTAMPTZ

last_seen_at TIMESTAMPTZ

last_synced_at TIMESTAMPTZ

archived_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, meta_campaign_id)
```

Index:

```text
INDEX ad_account_id

INDEX organization_id, effective_status
```

---

# 20. spend_facts

Stores Meta-reported spend at defined grain.

Columns:

```text
id UUID PK

organization_id UUID FK

ad_account_id UUID FK

meta_campaign_id UUID NULL FK meta_campaigns

spend_date DATE NOT NULL

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

source_sync_run_id UUID NULL

source_updated_at TIMESTAMPTZ NULL

fetched_at TIMESTAMPTZ NOT NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Recommended unique key:

```text
UNIQUE(
organization_id,
ad_account_id,
meta_campaign_id,
spend_date,
currency_code
)
```

If null campaign grain is stored separately, use a defined `grain_type` to avoid null uniqueness ambiguity.

---

# 21. clients

Columns:

```text
id UUID PK

organization_id UUID FK

client_reference TEXT NOT NULL

name TEXT NOT NULL

company_name TEXT

phone TEXT

email TEXT

operational_status TEXT NOT NULL

financial_status TEXT

assigned_manager_id UUID NULL

notes TEXT

closed_at TIMESTAMPTZ

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, client_reference)
```

Indexes:

```text
INDEX organization_id, operational_status

INDEX assigned_manager_id

INDEX name
```

---

# 22. client_jobs

Columns:

```text
id UUID PK

organization_id UUID FK

client_id UUID FK

job_reference TEXT NOT NULL

name TEXT NOT NULL

objective TEXT

planned_budget_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

start_date DATE

end_date DATE

operational_status TEXT NOT NULL

financial_status TEXT

assigned_manager_id UUID NULL

completed_at TIMESTAMPTZ

cancelled_at TIMESTAMPTZ

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraints:

```text
UNIQUE(organization_id, job_reference)

CHECK(planned_budget_minor >= 0)
```

Indexes:

```text
INDEX client_id

INDEX operational_status
```

---

# 23. client_job_ad_account_assignments

Columns:

```text
id UUID PK

organization_id UUID FK

client_job_id UUID FK

ad_account_id UUID FK

effective_from TIMESTAMPTZ NOT NULL

effective_to TIMESTAMPTZ

status TEXT NOT NULL

reason TEXT

assigned_by UUID

created_at TIMESTAMPTZ
```

Indexes:

```text
INDEX client_job_id, status

INDEX ad_account_id, status
```

Never overwrite old assignment dates.

---

# 24. client_job_campaign_mappings

Columns:

```text
id UUID PK

organization_id UUID FK

client_job_id UUID FK

meta_campaign_id UUID FK

ad_account_id UUID FK

effective_from TIMESTAMPTZ NOT NULL

effective_to TIMESTAMPTZ

status TEXT NOT NULL

mapped_by UUID

mapping_reason TEXT

created_at TIMESTAMPTZ
```

Constraint:

A campaign should normally not have multiple overlapping active client mappings unless explicitly allowed.

This may require exclusion/application-level validation.

Indexes:

```text
INDEX client_job_id

INDEX meta_campaign_id, status
```

---

# 25. vendors

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_reference TEXT NOT NULL

name TEXT NOT NULL

company_name TEXT

phone TEXT

email TEXT

operational_status TEXT NOT NULL

financial_status TEXT

assigned_finance_owner_id UUID NULL

payment_details_encrypted JSONB NULL

closed_at TIMESTAMPTZ

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, vendor_reference)
```

---

# 26. ledger_accounts

Core finance table.

Columns:

```text
id UUID PK

organization_id UUID FK

account_code TEXT NOT NULL

account_name TEXT NOT NULL

account_type TEXT NOT NULL

entity_type TEXT NULL

entity_id UUID NULL

currency_code VARCHAR(3) NOT NULL

status TEXT NOT NULL

is_system_account BOOLEAN NOT NULL DEFAULT false

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, account_code, currency_code)
```

Examples:

```text
COMPANY_BANK_INR

CLIENT_WALLET_CLI001_INR

VENDOR_PAYABLE_RAM_INR

VENDOR_RECEIVABLE_RAM_INR
```

---

# 27. ledger_transactions

Central transaction header.

Columns:

```text
id UUID PK

organization_id UUID FK

transaction_reference TEXT NOT NULL

transaction_type TEXT NOT NULL

business_date DATE NOT NULL

currency_code VARCHAR(3) NOT NULL

amount_minor BIGINT NOT NULL

status TEXT NOT NULL

description TEXT

external_reference TEXT

idempotency_key TEXT NULL

source_type TEXT

created_by UUID

approved_by UUID NULL

posted_by UUID NULL

created_at TIMESTAMPTZ

approved_at TIMESTAMPTZ NULL

posted_at TIMESTAMPTZ NULL

reversed_at TIMESTAMPTZ NULL

reversed_transaction_id UUID NULL

metadata JSONB
```

Constraints:

```text
UNIQUE(organization_id, transaction_reference)

UNIQUE(organization_id, idempotency_key)
```

where `idempotency_key IS NOT NULL`.

Check:

```text
amount_minor > 0
```

---

# 28. ledger_entries

Columns:

```text
id UUID PK

organization_id UUID FK

ledger_transaction_id UUID FK

ledger_account_id UUID FK

sequence_no INTEGER NOT NULL

debit_minor BIGINT NOT NULL DEFAULT 0

credit_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

description TEXT

created_at TIMESTAMPTZ
```

Checks:

```text
debit_minor >= 0

credit_minor >= 0

NOT (
debit_minor > 0
AND
credit_minor > 0
)

debit_minor + credit_minor > 0
```

Constraint:

```text
UNIQUE(ledger_transaction_id, sequence_no)
```

---

# 29. Ledger Balance Validation

PostgreSQL row check cannot easily ensure total transaction debit = credit across multiple rows.

Use:

```text
Database function / transaction posting service
```

which validates:

```text
SUM(debit_minor)
=
SUM(credit_minor)
```

before transaction status becomes:

```text
POSTED
```

---

# 30. Posted Transaction Immutability

Recommended DB-level protection:

```text
Trigger
```

blocks updates/deletes to financial-impacting fields where:

```text
status = POSTED
```

Exceptions only through controlled system process if necessary.

Preferred correction:

```text
Reversal
```

---

# 31. client_payments

Business workflow record.

Columns:

```text
id UUID PK

organization_id UUID FK

client_id UUID FK

ledger_transaction_id UUID NULL FK

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

purpose_type TEXT NOT NULL

payment_date DATE NOT NULL

payment_method TEXT

external_reference TEXT

status TEXT NOT NULL

proof_attachment_id UUID NULL

notes TEXT

created_by UUID

posted_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Check:

```text
amount_minor > 0
```

Index:

```text
INDEX client_id, payment_date DESC
```

---

# 32. vendor_funding_batches

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_id UUID FK

batch_reference TEXT NOT NULL

currency_code VARCHAR(3) NOT NULL

original_amount_minor BIGINT NOT NULL

received_amount_minor BIGINT NOT NULL DEFAULT 0

repaid_amount_minor BIGINT NOT NULL DEFAULT 0

status TEXT NOT NULL

opened_at TIMESTAMPTZ

settled_at TIMESTAMPTZ

notes TEXT

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, batch_reference)
```

Checks:

```text
original_amount_minor >= 0

received_amount_minor >= 0

repaid_amount_minor >= 0
```

These aggregate fields should be treated as cached/derived where possible.

---

# 33. vendor_fundings

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_id UUID FK

funding_batch_id UUID FK

ledger_transaction_id UUID NULL FK

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

received_date DATE NOT NULL

payment_method TEXT

external_reference TEXT

status TEXT NOT NULL

proof_attachment_id UUID NULL

notes TEXT

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

---

# 34. vendor_settlements

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_id UUID FK

ledger_transaction_id UUID NULL FK

payment_amount_minor BIGINT NOT NULL

valid_repayment_minor BIGINT NOT NULL DEFAULT 0

excess_amount_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

payable_before_minor BIGINT NULL

payable_after_minor BIGINT NULL

status TEXT NOT NULL

payment_date DATE

payment_method TEXT

external_reference TEXT

proof_attachment_id UUID NULL

created_by UUID

approved_by UUID NULL

posted_at TIMESTAMPTZ NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Checks:

```text
payment_amount_minor > 0

valid_repayment_minor >= 0

excess_amount_minor >= 0
```

Business validation:

```text
valid_repayment_minor + excess_amount_minor
=
payment_amount_minor
```

after final calculation.

---

# 35. vendor_settlement_batch_allocations

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_settlement_id UUID FK

vendor_funding_batch_id UUID FK

applied_amount_minor BIGINT NOT NULL

allocation_method TEXT NOT NULL

created_at TIMESTAMPTZ
```

Check:

```text
applied_amount_minor > 0
```

Index:

```text
INDEX vendor_settlement_id

INDEX vendor_funding_batch_id
```

---

# 36. vendor_receivables

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_id UUID FK

origin_settlement_id UUID NULL FK

origin_transaction_id UUID FK

original_amount_minor BIGINT NOT NULL

recovered_amount_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

reason TEXT NOT NULL

status TEXT NOT NULL

opened_at TIMESTAMPTZ

closed_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Outstanding is derived:

```text
original_amount_minor
-
recovered_amount_minor
-
approved adjustments
```

---

# 37. vendor_recoveries

Columns:

```text
id UUID PK

organization_id UUID FK

vendor_id UUID FK

vendor_receivable_id UUID FK

ledger_transaction_id UUID NULL FK

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

recovery_date DATE NOT NULL

payment_method TEXT

external_reference TEXT

status TEXT NOT NULL

proof_attachment_id UUID NULL

created_by UUID

created_at TIMESTAMPTZ
```

---

# 38. client_receivables

Columns:

```text
id UUID PK

organization_id UUID FK

client_id UUID FK

origin_transaction_id UUID NULL FK

original_amount_minor BIGINT NOT NULL

recovered_amount_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

reason TEXT NOT NULL

status TEXT NOT NULL

opened_at TIMESTAMPTZ

closed_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

---

# 39. client_receivable_settlements

Columns:

```text
id UUID PK

organization_id UUID FK

client_receivable_id UUID FK

client_payment_id UUID NULL FK

ledger_transaction_id UUID NULL FK

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

settled_at TIMESTAMPTZ

created_at TIMESTAMPTZ
```

---

# 40. fund_lots

Tracks fund lineage.

Columns:

```text
id UUID PK

organization_id UUID FK

origin_transaction_id UUID FK

source_type TEXT NOT NULL

source_entity_type TEXT

source_entity_id UUID

owner_type TEXT NOT NULL

owner_id UUID NULL

original_amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

status TEXT NOT NULL

created_at TIMESTAMPTZ
```

Potential cached field:

```text
remaining_amount_minor
```

only if safely maintained.

---

# 41. fund_allocations

Columns:

```text
id UUID PK

organization_id UUID FK

fund_lot_id UUID NULL FK

source_ledger_account_id UUID NULL FK

owner_type TEXT NOT NULL

owner_id UUID NULL

purpose_type TEXT NOT NULL

purpose_id UUID NULL

location_type TEXT NOT NULL

location_id UUID NULL

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

status TEXT NOT NULL

effective_from TIMESTAMPTZ NOT NULL

effective_to TIMESTAMPTZ NULL

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Check:

```text
amount_minor > 0
```

Indexes:

```text
INDEX owner_type, owner_id, status

INDEX location_type, location_id, status

INDEX purpose_type, purpose_id
```

---

# 42. fund_allocation_events

Recommended for immutable allocation lifecycle history.

Columns:

```text
id UUID PK

organization_id UUID FK

fund_allocation_id UUID FK

event_type TEXT NOT NULL

amount_minor BIGINT

from_status TEXT

to_status TEXT

ledger_transaction_id UUID NULL

reason TEXT

created_by UUID

created_at TIMESTAMPTZ
```

---

# 43. ownership_transfers

Columns:

```text
id UUID PK

organization_id UUID FK

source_owner_type TEXT NOT NULL

source_owner_id UUID NULL

destination_owner_type TEXT NOT NULL

destination_owner_id UUID NULL

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

reason TEXT NOT NULL

status TEXT NOT NULL

approval_request_id UUID NULL

ledger_transaction_id UUID NULL

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Use for:

```text
Client A → Client B

Client → Agency
```

---

# 44. client_leftovers

Columns:

```text
id UUID PK

organization_id UUID FK

client_id UUID FK

client_job_id UUID FK

ad_account_id UUID NULL FK

origin_allocation_id UUID NULL FK

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

current_location_type TEXT

current_location_id UUID NULL

status TEXT NOT NULL

detected_at TIMESTAMPTZ NOT NULL

resolved_at TIMESTAMPTZ NULL

resolution_type TEXT NULL

resolution_transaction_id UUID NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

---

# 45. locked_funds

Columns:

```text
id UUID PK

organization_id UUID FK

owner_type TEXT NOT NULL

owner_id UUID NULL

ad_account_id UUID FK

client_job_id UUID NULL FK

origin_allocation_id UUID NULL FK

amount_minor BIGINT NOT NULL

recovered_amount_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

lock_reason TEXT NOT NULL

status TEXT NOT NULL

locked_at TIMESTAMPTZ NOT NULL

resolved_at TIMESTAMPTZ NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Check:

```text
amount_minor > 0

recovered_amount_minor >= 0
```

---

# 46. recovery_cases

Columns:

```text
id UUID PK

organization_id UUID FK

ad_account_id UUID FK

locked_fund_id UUID NULL FK

status TEXT NOT NULL

severity TEXT

assigned_user_id UUID NULL

expected_recovery_minor BIGINT NULL

recovered_amount_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3)

resolution_type TEXT

opened_at TIMESTAMPTZ NOT NULL

resolved_at TIMESTAMPTZ NULL

closed_at TIMESTAMPTZ NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

---

# 47. client_refunds

Columns:

```text
id UUID PK

organization_id UUID FK

client_id UUID FK

requested_amount_minor BIGINT NOT NULL

approved_amount_minor BIGINT NULL

paid_amount_minor BIGINT NOT NULL DEFAULT 0

currency_code VARCHAR(3) NOT NULL

source_type TEXT

source_id UUID NULL

status TEXT NOT NULL

payment_method TEXT

external_reference TEXT

ledger_transaction_id UUID NULL

approval_request_id UUID NULL

requested_by UUID

approved_by UUID NULL

requested_at TIMESTAMPTZ

completed_at TIMESTAMPTZ

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

---

# 48. meta_refunds

Columns:

```text
id UUID PK

organization_id UUID FK

ad_account_id UUID FK

amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

detected_date DATE

external_reference TEXT

status TEXT NOT NULL

matched_locked_fund_id UUID NULL

ledger_transaction_id UUID NULL

source_sync_run_id UUID NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

---

# 49. spend_attributions

Recommended table to separate raw Meta spend from business attribution.

Columns:

```text
id UUID PK

organization_id UUID FK

spend_fact_id UUID FK

client_id UUID NULL FK

client_job_id UUID NULL FK

fund_allocation_id UUID NULL FK

attributed_amount_minor BIGINT NOT NULL

currency_code VARCHAR(3) NOT NULL

status TEXT NOT NULL

attribution_method TEXT NOT NULL

created_by UUID NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Methods:

```text
CAMPAIGN_MAPPING

MANUAL

SYSTEM_RULE

UNATTRIBUTED
```

---

# 50. Reconciliation Need for Spend

Constraint/business validation:

For one spend fact:

```text
SUM(attributed_amount_minor)
<=
spend_fact.amount_minor
```

Difference:

```text
Unattributed Spend
```

---

# 51. reconciliation_cases

Columns:

```text
id UUID PK

organization_id UUID FK

case_reference TEXT NOT NULL

case_type TEXT NOT NULL

entity_type TEXT NOT NULL

entity_id UUID NULL

expected_amount_minor BIGINT NULL

observed_amount_minor BIGINT NULL

difference_amount_minor BIGINT NULL

currency_code VARCHAR(3)

reason_category TEXT

severity TEXT NOT NULL

status TEXT NOT NULL

assigned_user_id UUID NULL

opened_at TIMESTAMPTZ NOT NULL

resolved_at TIMESTAMPTZ NULL

closed_at TIMESTAMPTZ NULL

resolution_type TEXT NULL

resolution_transaction_id UUID NULL

notes TEXT

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, case_reference)
```

---

# 52. reconciliation_case_links

Links evidence/entities.

Columns:

```text
id UUID PK

organization_id UUID FK

reconciliation_case_id UUID FK

related_entity_type TEXT NOT NULL

related_entity_id UUID NOT NULL

link_type TEXT NOT NULL

created_at TIMESTAMPTZ
```

---

# 53. alerts

Columns:

```text
id UUID PK

organization_id UUID FK

alert_type TEXT NOT NULL

category TEXT NOT NULL

severity TEXT NOT NULL

entity_type TEXT NOT NULL

entity_id UUID NULL

deduplication_key TEXT NOT NULL

title TEXT NOT NULL

description TEXT

amount_exposure_minor BIGINT NULL

currency_code VARCHAR(3) NULL

status TEXT NOT NULL

assigned_user_id UUID NULL

related_reconciliation_case_id UUID NULL

related_recovery_case_id UUID NULL

source_type TEXT NOT NULL

created_at TIMESTAMPTZ

acknowledged_at TIMESTAMPTZ NULL

resolved_at TIMESTAMPTZ NULL

closed_at TIMESTAMPTZ NULL

updated_at TIMESTAMPTZ
```

Important partial uniqueness:

One open alert per dedup key.

This may be implemented with partial unique index.

Example:

```text
UNIQUE(deduplication_key)
WHERE status IN ('OPEN','ACKNOWLEDGED','ASSIGNED','IN_PROGRESS')
```

---

# 54. alert_events

Tracks lifecycle.

Columns:

```text
id UUID PK

organization_id UUID FK

alert_id UUID FK

event_type TEXT NOT NULL

old_status TEXT

new_status TEXT

old_severity TEXT

new_severity TEXT

actor_user_id UUID NULL

notes TEXT

created_at TIMESTAMPTZ
```

---

# 55. approval_requests

Columns:

```text
id UUID PK

organization_id UUID FK

request_reference TEXT NOT NULL

action_type TEXT NOT NULL

entity_type TEXT NOT NULL

entity_id UUID NOT NULL

amount_minor BIGINT NULL

currency_code VARCHAR(3) NULL

requested_by UUID NOT NULL

required_approval_level TEXT

status TEXT NOT NULL

expires_at TIMESTAMPTZ NULL

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ

resolved_at TIMESTAMPTZ NULL
```

Constraint:

```text
UNIQUE(organization_id, request_reference)
```

---

# 56. approval_decisions

Columns:

```text
id UUID PK

organization_id UUID FK

approval_request_id UUID FK

approver_user_id UUID FK

decision TEXT NOT NULL

reason TEXT

decided_at TIMESTAMPTZ NOT NULL

created_at TIMESTAMPTZ
```

Possible decisions:

```text
APPROVED

REJECTED

REQUEST_CHANGES
```

---

# 57. attachments

Columns:

```text
id UUID PK

organization_id UUID FK

entity_type TEXT NOT NULL

entity_id UUID NOT NULL

storage_bucket TEXT NOT NULL

storage_path TEXT NOT NULL

file_name TEXT NOT NULL

mime_type TEXT

file_size_bytes BIGINT

visibility_level TEXT NOT NULL

uploaded_by UUID

uploaded_at TIMESTAMPTZ NOT NULL

deleted_at TIMESTAMPTZ NULL
```

Constraint:

```text
UNIQUE(storage_bucket, storage_path)
```

---

# 58. notes

Columns:

```text
id UUID PK

organization_id UUID FK

entity_type TEXT NOT NULL

entity_id UUID NOT NULL

content TEXT NOT NULL

created_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ

deleted_at TIMESTAMPTZ NULL
```

---

# 59. audit_events

Columns:

```text
id UUID PK

organization_id UUID FK

actor_type TEXT NOT NULL

actor_user_id UUID NULL

action TEXT NOT NULL

entity_type TEXT NOT NULL

entity_id UUID NULL

before_data JSONB NULL

after_data JSONB NULL

metadata JSONB NULL

ip_address INET NULL

user_agent TEXT NULL

occurred_at TIMESTAMPTZ NOT NULL
```

Recommended:

No application-level UPDATE/DELETE permissions.

Indexes:

```text
INDEX organization_id, occurred_at DESC

INDEX entity_type, entity_id

INDEX actor_user_id
```

---

# 60. sync_runs

Columns:

```text
id UUID PK

organization_id UUID FK

meta_connection_id UUID FK

sync_type TEXT NOT NULL

status TEXT NOT NULL

started_at TIMESTAMPTZ NOT NULL

completed_at TIMESTAMPTZ NULL

records_processed INTEGER NOT NULL DEFAULT 0

records_created INTEGER NOT NULL DEFAULT 0

records_updated INTEGER NOT NULL DEFAULT 0

error_count INTEGER NOT NULL DEFAULT 0

is_complete BOOLEAN NOT NULL DEFAULT false

metadata JSONB

created_at TIMESTAMPTZ
```

---

# 61. sync_errors

Columns:

```text
id UUID PK

organization_id UUID FK

sync_run_id UUID FK

entity_type TEXT

external_entity_id TEXT

error_code TEXT

error_category TEXT NOT NULL

message TEXT NOT NULL

retryable BOOLEAN NOT NULL DEFAULT false

raw_metadata JSONB NULL

created_at TIMESTAMPTZ
```

---

# 62. financial_snapshots

Optional but recommended later.

Columns:

```text
id UUID PK

organization_id UUID FK

entity_type TEXT NOT NULL

entity_id UUID NULL

snapshot_date DATE NOT NULL

currency_code VARCHAR(3) NOT NULL

snapshot_type TEXT NOT NULL

values JSONB NOT NULL

generated_at TIMESTAMPTZ NOT NULL
```

Constraint:

Depends on snapshot grain.

---

# 63. system_settings

Organization-level settings.

Columns:

```text
id UUID PK

organization_id UUID FK

setting_key TEXT NOT NULL

setting_value JSONB NOT NULL

updated_by UUID

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ
```

Constraint:

```text
UNIQUE(organization_id, setting_key)
```

Examples:

```text
DEFAULT_LOW_BALANCE_THRESHOLD

VENDOR_RECEIVABLE_AGING_DAYS

RECONCILIATION_TOLERANCE

DEFAULT_VENDOR_SETTLEMENT_POLICY
```

---

# 64. entity_sequences

Optional for human-readable references.

Columns:

```text
id UUID PK

organization_id UUID FK

entity_type TEXT NOT NULL

current_value BIGINT NOT NULL
```

Constraint:

```text
UNIQUE(organization_id, entity_type)
```

Used to generate:

```text
CLI-000001

VEN-000001

JOB-000001

TXN-000001
```

Alternatively PostgreSQL sequences may be used.

---

# 65. Recommended Enums

PostgreSQL ENUM or application-controlled text enums can be used.

Recommended approach:

Use:

```text
TEXT + CHECK
```

or Prisma enums for stable fields.

Avoid overusing DB enums for frequently changing operational values.

---

# 66. Transaction Status Enum

```text
DRAFT

PENDING_APPROVAL

APPROVED

PROCESSING

POSTED

FAILED

CANCELLED

REVERSED
```

---

# 67. Ad Account Normalized Status

```text
ACTIVE

RESTRICTED

DISABLED

PAYMENT_ISSUE

ACCESS_LOST

UNKNOWN

STALE

ARCHIVED
```

---

# 68. Client Operational Status

```text
ACTIVE

INACTIVE

ON_HOLD

BLOCKED

CLOSED
```

---

# 69. Client Job Status

```text
PLANNED

READY

ACTIVE

PAUSED

COMPLETED

CANCELLED
```

---

# 70. Vendor Operational Status

```text
ACTIVE

INACTIVE

ON_HOLD

BLOCKED

CLOSED
```

---

# 71. Alert Severity

```text
INFO

WARNING

HIGH

CRITICAL
```

---

# 72. Alert Status

```text
OPEN

ACKNOWLEDGED

ASSIGNED

IN_PROGRESS

RESOLVED

CLOSED
```

---

# 73. Reconciliation Status

```text
OPEN

UNDER_REVIEW

WAITING_FOR_SYNC

WAITING_FOR_DOCUMENT

ADJUSTMENT_PENDING

RESOLVED

CLOSED
```

---

# 74. Approval Status

```text
PENDING

APPROVED

REJECTED

CHANGES_REQUESTED

EXPIRED

CANCELLED
```

---

# 75. Locked Fund Status

```text
LOCKED

PARTIALLY_RECOVERED

RECOVERED

REFUND_PENDING

WRITTEN_OFF

RESOLVED
```

---

# 76. Vendor Receivable Status

```text
OPEN

PARTIALLY_RECOVERED

RECOVERED

OFFSET

WRITTEN_OFF
```

---

# 77. Vendor Funding Batch Status

```text
OPEN

PARTIALLY_SETTLED

SETTLED

ADJUSTED

CANCELLED
```

---

# 78. Critical Foreign-Key Rules

Financial/history records should usually use:

```text
ON DELETE RESTRICT
```

or:

```text
NO ACTION
```

not cascade deletion.

---

# 79. Safe Cascade Candidates

Only low-risk child data may use cascade.

Examples:

```text
role_permissions
```

when role itself is legitimately deleted before use.

But audit/history tables should remain protected.

---

# 80. Client Deletion Rule

If client has:

```text
payments

jobs

transactions

refunds

receivables
```

database/service should prevent hard delete.

Use:

```text
CLOSED
```

---

# 81. Vendor Deletion Rule

Same if financial activity exists.

---

# 82. Ad Account Deletion Rule

If synced/history exists:

Use:

```text
ARCHIVED
```

not physical deletion.

---

# 83. Ledger Transaction Delete Rule

Posted:

```text
DELETE = FORBIDDEN
```

Draft:

May be deletable depending on policy.

---

# 84. Ledger Entry Delete Rule

Entries linked to posted transaction:

```text
DELETE = FORBIDDEN
```

---

# 85. Organization Isolation

Every query must enforce:

```text
organization_id
```

RLS should ensure:

```text
user.organization_id
=
record.organization_id
```

subject to backend/service-role design.

---

# 86. RLS Tables

Strong RLS recommended for:

```text
clients

vendors

client_jobs

ad_accounts

ledger_accounts

ledger_transactions

ledger_entries

fund_allocations

reconciliation_cases

alerts

attachments

audit_events
```

---

# 87. Service Role

NestJS backend may use trusted Supabase service role for server operations.

Then backend must enforce:

```text
Tenant

Role

Permission

Resource Scope
```

strictly.

Do not expose service role to frontend.

---

# 88. Indexing Strategy

Frequently filtered columns need indexes.

Core:

```text
organization_id

status

created_at

business_date

client_id

vendor_id

ad_account_id

meta_campaign_id

ledger_transaction_id
```

---

# 89. Composite Indexes

Examples:

```text
ledger_transactions(
organization_id,
business_date DESC
)
```

```text
alerts(
organization_id,
status,
severity
)
```

```text
spend_facts(
organization_id,
ad_account_id,
spend_date
)
```

```text
client_jobs(
organization_id,
client_id,
operational_status
)
```

---

# 90. Partial Indexes

Useful:

Open alerts:

```text
WHERE status NOT IN ('RESOLVED','CLOSED')
```

Open receivables:

```text
WHERE status IN ('OPEN','PARTIALLY_RECOVERED')
```

Current mappings:

```text
WHERE effective_to IS NULL
```

---

# 91. External Reference Index

For duplicate detection:

```text
external_reference
```

indexed on:

```text
client_payments

vendor_fundings

vendor_settlements

vendor_recoveries
```

Do not universally enforce unique because references may collide across payment methods.

Use contextual uniqueness where safe.

---

# 92. Idempotency Index

Critical:

```text
ledger_transactions(
organization_id,
idempotency_key
)
```

unique when non-null.

---

# 93. Meta ID Indexes

Unique:

```text
organization_id + meta_business_id

organization_id + meta_ad_account_id

organization_id + meta_campaign_id
```

---

# 94. Search Indexes

For client/vendor/ad account names:

Use PostgreSQL:

```text
GIN trigram indexes
```

later if search scale requires.

---

# 95. JSONB Usage

Use JSONB only for flexible metadata.

Good:

```text
raw sync metadata

audit before/after

provider-specific extra fields

settings
```

Avoid putting core relational data into giant JSON documents.

---

# 96. Raw Meta Data

Optional table:

```text
meta_raw_snapshots
```

if debugging/history requirements justify.

Columns could include:

```text
entity_type

external_id

payload JSONB

sync_run_id

fetched_at
```

Not required for every API response in V1.

---

# 97. Cached Balance Tables

Optional:

```text
ledger_account_balances
```

Columns:

```text
ledger_account_id

posted_balance_minor

reserved_balance_minor

available_balance_minor

updated_at
```

This is cache only.

Canonical truth remains ledger entries.

---

# 98. Cached Balance Rebuild

Must support:

```text
Recalculate from Ledger
```

If cache disagrees:

ledger wins.

---

# 99. Dashboard Aggregate Views

Potential materialized views:

```text
mv_client_financial_summary

mv_vendor_financial_summary

mv_ad_account_financial_summary

mv_dashboard_financial_totals
```

Not necessary initially if query performance is acceptable.

---

# 100. Vendor Payable View

Example derived SQL view:

```text
vendor_current_payables
```

should calculate payable from posted vendor funding and repayment transactions.

Do not rely solely on mutable `vendor.payable`.

---

# 101. Vendor Receivable View

Derived from:

```text
vendor_receivables

recoveries

offsets

write-offs
```

---

# 102. Client Wallet View

Derived through client-related ledger accounts.

Potential:

```text
client_wallet_balances
```

---

# 103. Ad Account Allocation View

Derived:

```text
ad_account_current_allocations
```

grouped by:

```text
Ad Account

Owner

Client

Currency
```

---

# 104. Spend Attribution View

Shows:

```text
Raw Spend

Attributed Spend

Unattributed Spend
```

per campaign/account/date.

---

# 105. Audit Trigger Strategy

Not every DB update needs generic trigger.

Application/service audit is easier for business context.

But critical DB protections can be implemented via trigger for:

```text
Posted transaction mutation

Ledger entry deletion

Financial immutability
```

---

# 106. created_by / updated_by

Important business tables should capture creator.

For general profile edits, `updated_by` may be useful.

Financial workflows additionally track:

```text
approved_by

posted_by
```

---

# 107. Soft Delete Pattern

Recommended:

```text
archived_at

closed_at

deleted_at
```

depending on entity semantics.

Do not use one generic `is_deleted` everywhere if business meaning differs.

---

# 108. Status History Pattern

For important state changes:

Current value on parent:

```text
ad_accounts.normalized_status
```

Historical events:

```text
ad_account_status_history
```

Same principle can later apply to:

```text
client status

vendor status

job status
```

if audit requirements need full lifecycle history beyond generic audit logs.

---

# 109. Point-in-Time Mapping

Relationship tables use:

```text
effective_from

effective_to
```

This allows historical questions:

```text
Which client job used AD1 on 10 Sep?
```

---

# 110. Date Range Overlap Validation

For certain mappings, system should prevent invalid overlapping periods.

Example:

If business rule says one campaign can belong to only one client at a time:

prevent overlapping active mappings.

Can be enforced via:

```text
PostgreSQL exclusion constraint
```

or application transaction validation.

---

# 111. Currency Consistency Validation

A financial transaction's ledger entries must use compatible currency.

V1 recommendation:

One transaction = one currency.

Cross-currency operation requires:

```text
FX transaction pair / dedicated model
```

later.

---

# 112. Cross-Currency Transfers

V1 should block direct:

```text
INR → USD
```

internal transfer unless FX conversion workflow exists.

---

# 113. Transaction Reference

Human-readable:

```text
TXN-000001
```

should be unique within organization.

UUID remains primary key.

---

# 114. Reference Generation

Generate human references within DB/backend transaction.

Avoid race conditions.

Possible:

```text
PostgreSQL sequence

or locked entity_sequences row
```

---

# 115. Opening Balances

Can use ledger transaction type:

```text
OPENING_BALANCE
```

with metadata pointing to:

```text
Client

Vendor

Ad Account

Agency Fund
```

Separate legacy records may exist if migration evidence needs richer workflow.

---

# 116. Migration Confidence

Could add generic columns to opening-balance/migration records:

```text
verification_status

source_reference

migration_batch_id
```

---

# 117. migration_batches

Recommended if large old data import occurs.

Columns:

```text
id UUID PK

organization_id UUID FK

batch_reference TEXT

source_type TEXT

status TEXT

started_at TIMESTAMPTZ

completed_at TIMESTAMPTZ

created_by UUID

metadata JSONB
```

---

# 118. imported_record_links

Optional:

```text
migration_batch_id

entity_type

entity_id

legacy_reference
```

for rollback/review tracing.

---

# 119. Approval Linking

Sensitive business records should carry:

```text
approval_request_id
```

where needed.

Do not duplicate approval state independently without synchronization.

---

# 120. Alert Linking

Underlying entities do not necessarily need alert IDs.

Alerts point to entities.

One entity may have many historical alerts.

---

# 121. Reconciliation Linking

Same:

One entity may have multiple reconciliation cases over time.

---

# 122. Attachment Linking

Generic polymorphic:

```text
entity_type

entity_id
```

is practical.

For critical referential integrity, specific junction tables could be used later.

---

# 123. Polymorphic Relation Risk

PostgreSQL cannot directly FK generic:

```text
entity_type + entity_id
```

to multiple tables.

Therefore application validation is required.

Use polymorphism primarily for:

```text
attachments

notes

audit

alerts
```

not core financial relationships.

---

# 124. Core Financial Relationships Should Be Explicit

Example:

Prefer:

```text
vendor_settlements.vendor_id FK vendors.id
```

rather than only:

```text
entity_type='VENDOR'
entity_id
```

because money relationships need hard DB integrity.

---

# 125. Recommended Table Groups

## Security

```text
organizations
user_profiles
roles
permissions
role_permissions
user_roles
user_resource_scopes
```

## Meta

```text
meta_connections
meta_connection_permissions
business_portfolios
ad_accounts
meta_asset_relationships
ad_account_status_history
meta_campaigns
spend_facts
sync_runs
sync_errors
```

## Client

```text
clients
client_jobs
client_job_ad_account_assignments
client_job_campaign_mappings
client_payments
client_receivables
client_receivable_settlements
client_leftovers
client_refunds
```

## Vendor

```text
vendors
vendor_funding_batches
vendor_fundings
vendor_settlements
vendor_settlement_batch_allocations
vendor_receivables
vendor_recoveries
```

## Finance

```text
ledger_accounts
ledger_transactions
ledger_entries
fund_lots
fund_allocations
fund_allocation_events
ownership_transfers
locked_funds
meta_refunds
spend_attributions
```

## Control

```text
reconciliation_cases
reconciliation_case_links
recovery_cases
alerts
alert_events
approval_requests
approval_decisions
```

## Supporting

```text
attachments
notes
audit_events
system_settings
financial_snapshots
migration_batches
```

---

# 126. Simplified Relationship Diagram

```text
organizations
   │
   ├── user_profiles
   │
   ├── meta_connections
   │      │
   │      └── meta_asset_relationships
   │                │
   │                ├── business_portfolios
   │                └── ad_accounts
   │                       └── meta_campaigns
   │                              └── spend_facts
   │
   ├── clients
   │      └── client_jobs
   │             ├── client_job_ad_account_assignments
   │             └── client_job_campaign_mappings
   │
   ├── vendors
   │      └── vendor_funding_batches
   │             ├── vendor_fundings
   │             └── vendor_settlement_batch_allocations
   │
   └── ledger_transactions
          └── ledger_entries
                 └── ledger_accounts
```

---

# 127. Extended Money Relationship

```text
Client Payment
      ↓
Ledger Transaction
      ↓
Fund Lot
      ↓
Fund Allocation
      ↓
Client Job
      ↓
Ad Account
      ↓
Meta Campaign Spend
      ↓
Spend Attribution
      ↓
Leftover / Locked / Refund
```

---

# 128. Vendor Money Relationship

```text
Vendor Funding
      ↓
Funding Batch
      ↓
Ledger Transaction
      ↓
Vendor Payable
      ↓
Vendor Settlement
      ↓
Batch Allocation
      ↓
Payable Reduction
      ↓
Excess?
   ┌──┴──┐
   No    Yes
         ↓
   Vendor Receivable
         ↓
   Recovery / Offset
```

---

# 129. Required Transaction Boundaries

The following operations must execute inside DB transaction:

```text
Post Client Payment

Post Vendor Funding

Post Vendor Settlement

Create Vendor Overpayment Receivable

Create Client Refund

Post Fund Transfer

Post Ownership Transfer

Reverse Transaction

Lock Funds

Unlock Funds

Post Manual Adjustment
```

---

# 130. Vendor Settlement Transaction Boundary

Example:

```text
BEGIN

Lock vendor financial position

Read posted payable

Read pending reservation

Validate source fund

Calculate repayment

Calculate excess

Create settlement

Create ledger transaction

Create ledger entries

Update batch allocation

Create vendor receivable if required

POST transaction

COMMIT
```

Failure:

```text
ROLLBACK
```

---

# 131. Client Allocation Transaction Boundary

```text
BEGIN

Lock source wallet/account

Check available amount

Create allocation

Create ledger/control transaction if required

Reduce source availability

Increase destination allocation

COMMIT
```

---

# 132. Concurrency Columns

For selected mutable workflow records add:

```text
version INTEGER NOT NULL DEFAULT 1
```

for optimistic locking where useful.

Example:

```text
vendor_settlements

approval_requests
```

Financial posting should still use DB locking.

---

# 133. SELECT FOR UPDATE

Recommended for:

```text
Vendor payable calculation during settlement

Client wallet allocation

Agency fund allocation

Receivable recovery

Refund reservation
```

where concurrent use can cause overspending.

---

# 134. Database Constraints vs Application Rules

Database should enforce:

```text
Foreign keys

Unique IDs

Non-negative amounts

Basic status-compatible fields where safe

No duplicate idempotency key
```

Application/domain service enforces:

```text
Approval rules

Ownership rules

Batch FIFO rules

Complex state transitions

Resource permissions
```

---

# 135. Ledger Posting Function

Recommended architecture:

Only one domain service/function should be able to finalize ledger transactions.

Conceptually:

```text
postLedgerTransaction()
```

Responsibilities:

```text
Validate Status

Validate Currency

Validate Entries

Check Debit = Credit

Check Idempotency

Write Entries

Set Posted Status

Write Audit
```

---

# 136. No Direct Ledger Entry API

Frontend should never send arbitrary ledger debit/credit rows for normal operations.

Frontend sends business action:

```text
Create Client Payment
```

Backend determines ledger entries.

---

# 137. Financial Schema Security

Restrict direct database modification of:

```text
ledger_transactions

ledger_entries

vendor_receivables

fund_allocations
```

to trusted backend/service functions.

---

# 138. Reporting Read Models

For UI performance, backend may create read models/views.

Examples:

```text
client_financial_summary

vendor_financial_summary

ad_account_summary

dashboard_summary
```

These are read-only.

---

# 139. Data Retention

Retain long-term:

```text
Ledger Transactions

Ledger Entries

Financial Business Records

Audit Events

Status Histories

Reconciliation Cases

Approval Decisions
```

according to business/compliance policy.

---

# 140. Backup Critical Tables

Highest priority:

```text
organizations

clients

vendors

ledger_accounts

ledger_transactions

ledger_entries

fund_allocations

receivables

settlements

refunds

audit_events
```

---

# 141. Schema Migration Strategy

Use:

```text
Prisma Migrations
```

or controlled SQL migrations.

Production rules:

```text
No manual random schema edits

Version all migrations

Backup before high-risk migrations

Test rollback/recovery path
```

---

# 142. Large Table Growth

Likely high-growth tables:

```text
spend_facts

ledger_entries

audit_events

alerts

sync_errors
```

Monitor size/indexes.

Future partitioning may be used for:

```text
spend_facts by date

audit_events by month/year
```

if scale requires.

---

# 143. Database Schema V1 Minimum

Required tables:

```text
organizations

user_profiles
roles
permissions
role_permissions

meta_connections
business_portfolios
ad_accounts
meta_asset_relationships
ad_account_status_history
meta_campaigns
spend_facts
sync_runs
sync_errors

clients
client_jobs
client_job_ad_account_assignments
client_job_campaign_mappings
client_payments
client_leftovers
client_refunds

vendors
vendor_funding_batches
vendor_fundings
vendor_settlements
vendor_settlement_batch_allocations
vendor_receivables
vendor_recoveries

ledger_accounts
ledger_transactions
ledger_entries
fund_allocations
locked_funds
spend_attributions

reconciliation_cases
alerts
approval_requests
approval_decisions

attachments
audit_events
system_settings
```

---

# 144. Recommended V1 Additions

Strongly recommended:

```text
fund_lots

client_receivables

ownership_transfers

recovery_cases

meta_refunds

alert_events

reconciliation_case_links
```

because they improve traceability significantly.

---

# 145. Database Schema Integrity Rules

Database architecture must ensure:

```text
1. One Meta external asset ID maps to one canonical tenant record.

2. Client and vendor names are never primary identity.

3. Money is never stored as floating-point.

4. Every financial transaction has currency.

5. Posted ledger entries cannot be silently edited.

6. Ledger transaction debits must equal credits.

7. Financial balances must remain reconstructable.

8. Client allocations cannot exceed valid available funding.

9. Vendor payable cannot become negative.

10. Excess vendor payment must remain represented as receivable.

11. Client and agency ownership cannot be silently merged.

12. Historical mappings cannot be overwritten.

13. Hard deletes must not destroy financial history.

14. Duplicate financial posting must be blocked through idempotency.

15. Tenant isolation must be enforced on every critical table.

16. Meta sync failures must never delete financial/business history.

17. Unknown/unresolved data must have explicit representable states.

18. Financial posting must use atomic database transactions.
```

---

# 146. Database Schema Golden Rule

> **The database must make invalid financial states difficult or impossible to create. IDs preserve identity, foreign keys preserve relationships, transactions preserve atomicity, the ledger preserves money history, and immutable records preserve accountability. UI mistakes or concurrent requests must never be able to make money disappear, duplicate, silently change owner or lose its history.**
