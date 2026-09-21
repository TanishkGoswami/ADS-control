# Account Hierarchy

## Overview

Is system ka core operational structure Meta assets ki hierarchy par based hoga.

Primary hierarchy:

```text
Meta Connection
      ↓
Business Portfolio
      ↓
Ad Account
      ↓
Campaign / Client Work
```

System ko har Ad Account ka exact parent structure pata hona chahiye.

---

# Why Account Hierarchy Matters

Jaise-jaise company ke paas Meta assets increase hote hain, sirf account names ke basis par tracking unreliable ho jati hai.

Example:

```text
Ads Pro
│
├── BP1
│   ├── AD1
│   ├── AD2
│   └── AD3
│
└── BP2
    ├── AD1
    ├── AD2
    └── AD3
```

Yahan `AD1` naam do jagah exist karta hai.

Agar system sirf display name store kare:

```text
AD1
```

to ye clear nahi hoga ki kaunsa AD1 refer ho raha hai.

Isliye system ko IDs-based architecture follow karna hai.

---

# Level 1: Meta Connection

Meta Connection top-level integration context hai.

Example internal names:

```text
Ads Pro
Ads Backup
Marketing Main
Agency Account
```

Meta Connection ka purpose:

```text
Meta API authentication
Business assets discovery
Sync context
Ownership/access grouping
```

System me ek Meta Connection ke andar one or more Business Portfolios ho sakte hain.

---

# Meta Connection Example

```text
Meta Connection:
Ads Pro

Internal ID:
MC-001

Meta Business Context:
Available through connected token

Status:
ACTIVE

Last Sync:
17 Sep 2026 02:30 PM
```

---

# Meta Connection Identification

Internal system ID:

```text
MC-001
```

and Meta-provided identifiers separate honge.

Names unique assume nahi karne.

Example:

```text
Internal Name:
Ads Pro

System ID:
MC-001
```

---

# Level 2: Business Portfolio

Business Portfolio Meta ka logical business asset container hai.

Ek Meta Connection ke andar multiple Business Portfolios ho sakte hain.

Example:

```text
Ads Pro
│
├── BP1
├── BP2
└── BP3
```

Each portfolio should have:

```text
Internal ID
Meta Business ID
Display Name
Parent Meta Connection
Status
Last Sync
```

---

# Business Portfolio Example

```text
Internal ID:
BP-001

Name:
BP1

Meta Business ID:
123456789012345

Parent Connection:
Ads Pro

Status:
ACTIVE
```

---

# Business Portfolio Identity Rule

Business Portfolio ko sirf name se identify nahi karna.

Primary external identifier:

```text
Meta Business ID
```

Internal identifier:

```text
BP-001
```

Names only display purpose ke liye.

---

# Level 3: Ad Account

Ad Account actual advertising execution account hai.

Business Portfolio ke andar multiple Ad Accounts ho sakte hain.

Example:

```text
BP1
│
├── AD1
├── AD2
└── AD3
```

Each Ad Account should store:

```text
Internal ID
Meta Ad Account ID
Display Name
Parent Business Portfolio
Parent Meta Connection
Account Status
Currency
Timezone
Last Sync
```

---

# Ad Account Example

```text
Internal ID:
AA-001

Display Name:
AD1

Meta Ad Account ID:
act_123456789

Business Portfolio:
BP1

Meta Connection:
Ads Pro

Status:
ACTIVE

Currency:
INR

Timezone:
Asia/Kolkata
```

---

# Ad Account Identity Rule

Primary uniqueness:

```text
Meta Ad Account ID
```

not:

```text
Display Name
```

Example:

```text
BP1 → AD1 → act_111111111
BP2 → AD1 → act_222222222
```

Names same ho sakte hain.

IDs different hone chahiye.

---

# Hierarchy Path

Every Ad Account ka full path generated hona chahiye.

Example:

```text
Ads Pro / BP1 / AD1
```

Internal path:

```text
MC-001 / BP-001 / AA-001
```

External IDs:

```text
Meta Business ID:
123456789

Meta Ad Account ID:
act_111111111
```

---

# Full Example Structure

```text
Ads Pro
│
├── BP1
│   ├── AD1
│   ├── AD2
│   └── AD3
│
├── BP2
│   ├── AD4
│   └── AD5
│
└── BP3
    └── AD6
```

Summary:

```text
Meta Connections:
1

Business Portfolios:
3

Ad Accounts:
6
```

---

# Multiple Meta Connections

System ko multiple connections support karne hain.

Example:

```text
Ads Pro
│
├── BP1
│   ├── AD1
│   └── AD2
│
└── BP2
    └── AD3


Ads Backup
│
└── BP3
    ├── AD4
    └── AD5
```

Summary:

```text
Connections:
2

Portfolios:
3

Ad Accounts:
5
```

---

# Client Assignment Is Not Parent Hierarchy

Important:

Client Ad Account ka parent nahi hai.

Incorrect:

```text
Client
↓
Ad Account
```

as permanent hierarchy.

Correct:

```text
Meta Connection
↓
Business Portfolio
↓
Ad Account
```

Client association dynamic assignment hai.

Example:

```text
AD1
Currently Assigned Client:
Client A
```

Later:

```text
AD1
Currently Assigned Client:
Client B
```

Ad Account ki core hierarchy same rahegi.

---

# Client-to-Ad Account Relationship

Relationship types:

```text
Client Job
↓
Assigned Ad Account
```

Possible one client:

```text
Client A
├── AD1
└── AD2
```

or one Ad Account sequentially:

```text
AD1
├── Client A Campaign
├── Client B Campaign
└── Client C Campaign
```

History preserve honi chahiye.

---

# One Ad Account, Multiple Clients

Business may allow one Ad Account to hold or run funds for multiple clients.

Example:

```text
AD1

Client A Allocation:
₹5,000

Client B Allocation:
₹3,000

Agency Allocation:
₹2,000
```

Total:

```text
₹10,000
```

Therefore Ad Account assignment and fund ownership alag concepts hain.

---

# Primary vs Secondary Portfolio Relationship

System ko assume nahi karna chahiye ki Ad Account permanently sirf display-name-based Portfolio me hai.

If Meta mapping changes or access changes:

```text
Old Mapping:
BP1 → AD1

New Mapping:
BP2 → AD1
```

system should record mapping history where relevant.

---

# Account Mapping History

Recommended historical record:

```text
Ad Account:
AA-001

From Portfolio:
BP1

To Portfolio:
BP2

Changed At:
17 Sep 2026

Source:
Meta Sync / Manual Review
```

Current parent relationship latest valid mapping hogi.

---

# Account Status Is Separate From Hierarchy

Example:

```text
Ads Pro
↓
BP1
↓
AD1
```

Hierarchy unchanged reh sakti hai even when:

```text
AD1 Status:
RESTRICTED
```

Do not remove account from hierarchy just because it is disabled/restricted.

---

# Account Lifecycle

Possible lifecycle:

```text
DISCOVERED
↓
ACTIVE
↓
RESTRICTED
↓
RESTORED
```

or:

```text
ACTIVE
↓
DISABLED
↓
CLOSED / ARCHIVED
```

Historical entity retain honi chahiye.

---

# Archive Instead of Delete

Agar Ad Account no longer used hai:

```text
ARCHIVED
```

mark karna preferable hai.

Financial/history-linked Ad Account ko hard delete nahi karna.

Same principle:

```text
Business Portfolio
Meta Connection
```

par bhi apply hoga where history exists.

---

# Orphan Account Case

Kabhi sync me Ad Account mil sakta hai but expected portfolio mapping temporarily unavailable ho.

System should support:

```text
Mapping Status:
UNRESOLVED
```

Example:

```text
AD Account:
act_123

Portfolio:
UNKNOWN / UNRESOLVED
```

Account ko drop nahi karna.

Alert create karna.

---

# Duplicate Discovery Protection

Meta sync repeatedly same asset return karega.

System duplicate record create nahi kare.

Matching rules:

## Business Portfolio

```text
Meta Business ID
```

## Ad Account

```text
Meta Ad Account ID
```

Use upsert logic.

---

# Internal Naming

Internal names user-friendly hone chahiye.

Example:

```text
Ads Pro
BP1
AD1
```

but backend IDs:

```text
MC-001
BP-001
AA-001
```

and Meta IDs separately stored.

---

# Recommended Entity Keys

## Meta Connection

```text
id
internal_name
meta_user_id / business context
status
```

## Business Portfolio

```text
id
meta_connection_id
meta_business_id
name
status
```

## Ad Account

```text
id
business_portfolio_id
meta_connection_id
meta_ad_account_id
name
status
```

---

# Denormalized Parent Reference

Ad Account ke paas technically:

```text
business_portfolio_id
```

enough ho sakta hai to derive Meta Connection.

Lekin performance/reporting ke liye optional denormalized:

```text
meta_connection_id
```

store kiya ja sakta hai.

If stored, consistency validation required hogi.

---

# Hierarchy Financial Summary

Every hierarchy level aggregate financial data show kar sakta hai.

Example:

```text
Ads Pro
Total Fund:
₹1,50,000
```

Breakdown:

```text
BP1:
₹60,000

BP2:
₹90,000
```

Then:

```text
BP1

AD1 ₹10,000
AD2 ₹20,000
AD3 ₹30,000
```

---

# Portfolio Aggregate Rule

Portfolio total:

```text
BP Total Tracked Fund
=
Sum of child Ad Account tracked balances
```

Example:

```text
AD1 ₹10,000
AD2 ₹20,000
AD3 ₹30,000

BP1 Total:
₹60,000
```

---

# Connection Aggregate Rule

Meta Connection total:

```text
Connection Total
=
Sum of linked Business Portfolio totals
```

Example:

```text
BP1 ₹60,000
BP2 ₹90,000

Ads Pro:
₹1,50,000
```

---

# Do Not Double Count

Important:

If same Ad Account becomes visible through multiple API relationships/access paths, financial aggregation must not double-count it.

Unique account aggregation should use:

```text
Meta Ad Account ID
```

or internal canonical Ad Account ID.

---

# Ownership vs Access

Meta me kisi business ke paas:

```text
Owned Account
```

or:

```text
Client / Shared Account
```

type access ho sakta hai.

Internal system ko where available distinguish karna chahiye:

```text
OWNED
SHARED
CLIENT_ACCESS
UNKNOWN
```

This is an access relationship, not fund ownership.

---

# Access Relationship Table

If required:

```text
business_ad_account_relationships
```

could store:

```text
business_portfolio_id
ad_account_id
relationship_type
is_primary
first_seen_at
last_seen_at
```

This is useful if Meta APIs expose same account via multiple relationship edges.

---

# Canonical Ad Account

System me each actual Meta Ad Account ka one canonical record hona chahiye.

Example:

```text
Canonical:
AA-001
Meta ID act_123
```

Then portfolio/access relationships separately attach ho sakte hain.

This avoids duplicates.

---

# Initial Simplified V1 Model

If current business reality guarantees one operational parent portfolio per account, V1 can use:

```text
Ad Account
→ primary_business_portfolio_id
```

But schema should not make future multi-access tracking impossible.

---

# Account Tree UI

Expected tree:

```text
▼ Ads Pro
  2 Portfolios • 6 Ad Accounts • ₹1,50,000

  ▼ BP1
    3 Accounts • ₹60,000

    ● AD1
      ACTIVE • ₹10,000

    ● AD2
      ACTIVE • ₹20,000

    ● AD3
      RESTRICTED • ₹30,000

  ▼ BP2
    3 Accounts • ₹90,000
```

---

# Account Tree Search

Global search should support:

```text
Account Name
Meta Ad Account ID
Business Portfolio Name
Meta Business ID
Connection Name
Internal ID
```

Example search:

```text
AD1
```

Result:

```text
Ads Pro / BP1 / AD1
act_111111

Ads Pro / BP2 / AD1
act_222222
```

---

# Account Tree Filters

Useful filters:

```text
Meta Connection

Business Portfolio

Ad Account Status

Currency

Assigned Client

Low Balance

Restricted

Disabled

Payment Issue

Has Locked Fund
```

---

# Ad Account Detail Header

Example:

```text
AD1

Path:
Ads Pro / BP1 / AD1

Meta ID:
act_123456789

Status:
ACTIVE

Currency:
INR

Last Sync:
2 min ago
```

---

# Business Portfolio Detail Header

Example:

```text
BP1

Parent:
Ads Pro

Meta Business ID:
123456789

Ad Accounts:
3

Active:
2

Restricted:
1
```

---

# Meta Connection Detail Header

Example:

```text
Ads Pro

Portfolios:
2

Ad Accounts:
6

Active:
5

Restricted:
1

Last Successful Sync:
2 min ago
```

---

# Historical Hierarchy Requirement

If a Business Portfolio or Ad Account changes mapping, historical reports should ideally preserve the hierarchy relevant at transaction time.

Example:

```text
Transaction date:
01 Sep

Ad Account was under:
BP1
```

Even if current mapping later:

```text
BP2
```

History should not silently rewrite old context.

---

# Transaction Context Snapshot

Financial transactions can store snapshot metadata:

```text
meta_connection_name_at_time

business_portfolio_name_at_time

ad_account_name_at_time

meta_ad_account_id
```

Canonical IDs remain primary.

Snapshot labels help readable historical reports.

---

# Account Assignment History

Optional table:

```text
ad_account_assignments
```

Fields:

```text
ad_account_id

client_id

client_job_id

started_at

ended_at

status
```

This shows:

```text
AD1

1 Sep – 5 Sep:
Client A

6 Sep – 10 Sep:
Client B
```

---

# Multiple Active Allocations

If business allows multiple clients simultaneously on one account, assignment should not enforce one-client-only rule.

Instead campaign/allocation-level mapping is source of truth.

---

# Account Purpose

Optional internal classification:

```text
SCALING
TESTING
PRIMARY
BACKUP
INTERNAL
CLIENT_DEDICATED
SHARED
```

Useful for account selection and reporting.

---

# Account Tags

Optional tags:

```text
High Spend

Backup

Stable

New

Risky

Client Dedicated
```

Tags business metadata hain, hierarchy nahi.

---

# Account Manager Assignment

Internal team mapping:

```text
AD1
Assigned Manager:
Rahul
```

This can change without changing Meta hierarchy.

---

# Portfolio Manager Assignment

Similarly:

```text
BP1
Manager:
Team A
```

Optional operational feature.

---

# Hierarchy Integrity Rules

System must enforce:

```text
1. Every Ad Account must have a canonical internal record.

2. Every Meta Ad Account ID must be unique.

3. Every Business Portfolio must have a unique Meta Business ID where available.

4. Display names are not identifiers.

5. Restricted/disabled assets are not automatically deleted.

6. Historical financial records must remain linked to canonical IDs.

7. Duplicate API discovery must not create duplicate assets.

8. Parent mapping changes must be traceable.

9. Same Ad Account must not be double-counted in aggregates.

10. Client assignment must not replace Meta hierarchy.
```

---

# Example Full Record

```text
META CONNECTION

Internal ID:
MC-001

Name:
Ads Pro


BUSINESS PORTFOLIO

Internal ID:
BP-001

Name:
BP1

Meta Business ID:
123456789


AD ACCOUNT

Internal ID:
AA-001

Name:
AD1

Meta Ad Account ID:
act_987654321

Currency:
INR

Status:
ACTIVE
```

Full path:

```text
MC-001 / BP-001 / AA-001
```

Readable:

```text
Ads Pro / BP1 / AD1
```

---

# Example With Financial Data

```text
Ads Pro
│
├── BP1
│   │
│   ├── AD1
│   │   Fund: ₹10,000
│   │   Status: ACTIVE
│   │
│   ├── AD2
│   │   Fund: ₹20,000
│   │   Status: ACTIVE
│   │
│   └── AD3
│       Fund: ₹30,000
│       Status: RESTRICTED
│
└── BP2
    │
    ├── AD4
    │   Fund: ₹40,000
    │
    └── AD5
        Fund: ₹50,000
```

Aggregate:

```text
BP1:
₹60,000

BP2:
₹90,000

Ads Pro:
₹1,50,000
```

---

# Final Account Hierarchy Principle

> **Meta Connection, Business Portfolio and Ad Account define where an advertising asset belongs operationally. Client assignments, fund ownership and campaign usage sit on top of this hierarchy and must never replace or corrupt the underlying Meta asset structure. Every asset must be identified by stable IDs, while names are used only for human-readable display.**
