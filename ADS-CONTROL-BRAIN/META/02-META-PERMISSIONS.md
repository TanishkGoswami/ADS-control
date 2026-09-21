# Meta Permissions

## Overview

Ye document Meta Marketing API integration ke permission, access-level aur authorization rules define karta hai.

Project ka V1 primarily:

```text
Meta Asset Discovery
Ad Account Monitoring
Campaign Discovery
Spend / Insights Reading
Account Status Monitoring
```

ke liye hai.

V1 ka goal Meta Ads assets ko create/edit/manage karna nahi hai.

Isliye permission strategy ka fundamental rule:

> **Request only the minimum Meta permissions required for the actual product functionality.**

---

# 1. Permission Strategy

Recommended V1 approach:

```text
READ FIRST

MINIMUM REQUIRED SCOPES

NO UNUSED WRITE PERMISSIONS

SERVER-SIDE TOKEN USE

PERMISSION HEALTH MONITORING
```

---

# 2. Primary V1 Permissions

Recommended core permission candidates:

```text
ads_read

business_management
```

depending on exact Meta asset discovery path.

---

# 3. ads_read

`ads_read` is the primary permission for read-only advertising reporting/data access.

Meta's current Marketing API guidance associates `ads_read` with reading ads reports for ad accounts the app is authorized to access.

For this system, `ads_read` may support:

```text
Ad Account data

Campaign read access

Insights

Spend

Advertising performance data
```

subject to the token's actual asset access.

---

# 4. ads_read Is Not Asset Ownership

Having:

```text
ads_read
```

does not mean the token automatically has access to every Ad Account.

Two things are required:

```text
Permission Scope
+
Asset Access
```

---

# 5. Permission vs Asset Access

Example:

Token contains:

```text
ads_read
```

but User/System User has no access to:

```text
AD1
```

Result:

```text
AD1 cannot necessarily be read
```

Permission alone is insufficient.

---

# 6. business_management

`business_management` is relevant when the application uses Meta's Business Manager / Business Management APIs for business assets.

Meta's Business Management API documentation lists `business_management` as a requirement for using that API, alongside the appropriate Marketing API access level.

Potential V1 use:

```text
Business Portfolio discovery

Business asset discovery

Business-to-Ad-Account relationships
```

---

# 7. business_management Is Broad

Because it covers Business Manager API functionality, it should only be requested if the implementation actually needs Business API access.

Do not request it simply because:

```text
"It might be useful later."
```

---

# 8. ads_management

`ads_management` allows an app to read and manage advertising accounts it owns or has been granted access to. Meta's current permission reference describes it as a read-and-manage permission.

Potential capabilities include:

```text
Campaign creation

Campaign updates

Ad Set changes

Ad changes

Other advertising-management operations
```

---

# 9. V1 Recommendation for ads_management

V1:

```text
DO NOT REQUEST BY DEFAULT
```

because current system scope is:

```text
Monitoring

Accounting

Reconciliation

Reporting
```

not ad creation/management.

---

# 10. Why Avoid ads_management in V1

Benefits:

```text
Smaller permission surface

Lower accidental-write risk

Clearer App Review justification

Simpler security model

Reduced blast radius if credential compromised
```

---

# 11. Future ads_management

Request later only when product adds features like:

```text
Pause Campaign

Resume Campaign

Create Campaign

Change Budget

Manage Ad Sets

Manage Ads
```

---

# 12. V1 Permission Matrix

Recommended conceptual matrix:

| Function                                | Permission                                           |
| --------------------------------------- | ---------------------------------------------------- |
| Read ad reporting                       | `ads_read`                                           |
| Read spend / insights                   | `ads_read`                                           |
| Read advertising structure              | `ads_read` where supported                           |
| Discover/manage Business Manager assets | `business_management` where Business API is required |
| Create/edit campaigns                   | `ads_management` — future                            |
| Create/edit ads                         | `ads_management` — future                            |

---

# 13. Minimal V1 Permission Set

Target:

```text
ads_read
```

plus:

```text
business_management
```

only where needed for the chosen Business Portfolio/asset discovery workflow.

---

# 14. Endpoint-Driven Permission Design

Permissions should be derived from endpoints actually used.

Maintain a matrix:

```text
Endpoint
↓
Feature
↓
Permission Required
↓
Access Tier Required
```

Never maintain permissions from memory alone.

---

# 15. Permission Registry

Backend/project docs should maintain:

```text
Permission Name

Purpose

Required By Feature

Required / Optional

Access Level

Review Status

Last Verified
```

---

# 16. Example Registry

```text
ads_read

Purpose:
Read advertising data and reports

Required:
YES

Used By:
Account Sync
Campaign Sync
Spend Sync
```

---

# 17. business_management Registry

```text
business_management

Purpose:
Business Manager API / business asset operations

Required:
CONDITIONAL

Used By:
Business Portfolio Discovery
Asset Relationship Discovery
```

---

# 18. ads_management Registry

```text
ads_management

Purpose:
Advertising-management operations

Required:
NO in V1

Future:
YES only if write features introduced
```

---

# 19. Meta Access Levels

Meta permissions/features can have different access levels.

Conceptually:

```text
STANDARD ACCESS

ADVANCED ACCESS
```

The exact requirement depends on:

```text
Permission

Feature

Assets being accessed

App ownership/business relationship
```

---

# 20. Own Assets vs Other Businesses

Meta's current Marketing API guidance distinguishes between apps working with their own ad accounts and applications accessing other people's/client ad accounts.

For client/other-business advertising accounts, Advanced Access to the relevant ads permissions can be required.

---

# 21. Agency Scenario

This system is intended to potentially handle:

```text
Company-owned Ad Accounts

Shared Ad Accounts

Client Ad Accounts

Other authorized business assets
```

Therefore production access requirements must be tested against the actual agency/client access model.

---

# 22. Do Not Hardcode "Standard Is Enough"

Development may work with:

```text
Developer-owned assets
```

while production client assets fail.

Therefore onboarding must distinguish:

```text
Development Access Success
```

from:

```text
Production Client Access Readiness
```

---

# 23. Advanced Access

Where Meta requires Advanced Access:

the app may need:

```text
App Review

Relevant permission approval

Business verification or other platform prerequisites
```

depending on Meta's current requirements.

---

# 24. App Review Is Permission-Specific

Do not assume:

```text
App Approved Once
=
Every Permission Approved
```

Track approval per permission/feature.

---

# 25. Marketing API Access Tier

Meta currently documents Marketing API access features/tiers for scaling advertising API access.

The current feature reference states that at least `ads_read` or `ads_management` is required for relevant Marketing API access functionality, with `ads_read` used for reading reports and `ads_management` for read/manage use cases.

---

# 26. App Review Status Model

Internal deployment checklist can track:

```text
NOT_REQUESTED

IN_PREPARATION

SUBMITTED

IN_REVIEW

APPROVED

REJECTED

REQUIRES_RESUBMISSION
```

This is internal operational state, not Meta API state.

---

# 27. Permission Approval Matrix

Example:

```text
ads_read
Advanced Access:
APPROVED

business_management
Advanced Access:
PENDING

ads_management:
NOT REQUESTED
```

---

# 28. Permission Requested vs Granted

Three different things must be separated:

```text
App Can Request Permission

User/System User Granted Permission

Asset Is Assigned/Accessible
```

All may be required.

---

# 29. Four-Layer Authorization Model

Meta API access can conceptually depend on:

```text
1. App Capability / Access Level

2. Token Permission

3. User/System User Asset Assignment

4. Target Asset Relationship
```

A failure in any layer can cause access denial.

---

# 30. Permission Health Check

For every connection store:

```text
Required Permissions

Granted Permissions

Missing Permissions

Last Checked At

Health Status
```

---

# 31. Permission Status

Recommended normalized values:

```text
GRANTED

MISSING

DECLINED

EXPIRED

REVOKED

UNKNOWN
```

---

# 32. Connection Permission Health

Derived:

```text
HEALTHY

DEGRADED

BLOCKED

UNKNOWN
```

---

# 33. HEALTHY

All permissions required for configured V1 functionality are available.

---

# 34. DEGRADED

Some optional capability is unavailable.

Example:

```text
business_management missing
```

but direct configured Ad Accounts remain readable.

---

# 35. BLOCKED

Critical permission missing.

Example:

```text
ads_read missing
```

when the entire integration depends on it.

---

# 36. Permission Check During Connect

Connection onboarding flow:

```text
Authenticate
↓
Read Granted Permissions
↓
Compare Against Required Matrix
↓
Test Required API Calls
↓
Test Asset Access
↓
Save Connection Health
```

---

# 37. Do Not Trust Scope List Alone

A token may appear to contain permission but still fail on a target asset because:

```text
Asset not assigned

Business relationship missing

Access revoked

App access level insufficient
```

Therefore perform functional endpoint checks.

---

# 38. Capability-Based Verification

Instead of only checking:

```text
Does token contain ads_read?
```

also test:

```text
Can connection read target Ad Account?

Can it retrieve required campaigns?

Can it retrieve required insights?
```

---

# 39. Connection Capability Matrix

Store derived capabilities:

```text
CAN_DISCOVER_BUSINESSES

CAN_DISCOVER_AD_ACCOUNTS

CAN_READ_CAMPAIGNS

CAN_READ_INSIGHTS

CAN_MANAGE_ADS
```

---

# 40. V1 Expected Capabilities

```text
CAN_DISCOVER_AD_ACCOUNTS

CAN_READ_CAMPAIGNS

CAN_READ_INSIGHTS
```

and preferably:

```text
CAN_DISCOVER_BUSINESSES
```

where portfolio discovery is needed.

---

# 41. CAN_MANAGE_ADS

V1:

```text
FALSE / NOT REQUIRED
```

---

# 42. Facebook Login / Business Login

Permission granting can occur through Meta-supported authorization mechanisms.

Meta's current permissions reference notes permissions can be requested through supported login/business authorization flows.

Exact login product should match the app architecture.

---

# 43. User Access Token

User-authorized connections may be suitable for:

```text
Initial connect

Interactive authorization

User-controlled assets
```

Token lifecycle must be monitored.

---

# 44. System User

System Users can be useful for:

```text
Backend automation

Business-managed assets

Non-interactive scheduled sync
```

where supported by the business setup.

---

# 45. System User Is Not "Super Access"

A System User still needs:

```text
Correct App

Correct Permissions

Correct Asset Assignment

Correct Business Access
```

---

# 46. System User Asset Assignment

Before relying on System User integration:

verify target:

```text
Business Portfolio

Ad Account
```

has actually been assigned to the System User with required tasks/access.

---

# 47. Token Type Tracking

Connection metadata:

```text
USER

SYSTEM_USER
```

where known.

---

# 48. Token Secret Separation

Database may store:

```text
token_type

secret_reference

permissions_cache

validated_at
```

Raw token stored separately/encrypted.

---

# 49. public_profile

Some Meta login flows may provide `public_profile` as part of basic login context.

This system should not request additional profile information beyond what is needed.

---

# 50. Pages Permissions

Possible permissions include:

```text
pages_show_list

pages_read_engagement
```

But V1 Meta Ads financial-control system does not inherently need Page content functionality.

---

# 51. pages_show_list

Only add if an implemented workflow genuinely needs to list Facebook Pages.

Do not request it simply because many generic Meta Apps request it.

---

# 52. pages_read_engagement

Only request if product needs relevant Page information/engagement fields.

Not required for V1 financial monitoring by default.

---

# 53. Page Permissions and Dependency Changes

Certain Meta permissions may have documented dependencies.

Therefore when requesting a permission later:

check current Meta permission reference.

Do not maintain assumptions permanently in code.

---

# 54. read_insights

Some Meta products/reference material may expose/use `read_insights` in other Page/insight scenarios.

For Marketing API ad-reporting design, this project should rely on the permissions explicitly required by the actual advertising endpoints rather than blindly requesting every "insights"-named permission.

---

# 55. No "Permission Collection"

Avoid requesting:

```text
ads_read
ads_management
business_management
pages_show_list
pages_read_engagement
instagram_basic
...
```

all together without feature justification.

---

# 56. Instagram Permissions

This system's Meta Ads accounting integration should not request Instagram permissions merely because campaigns may deliver on Instagram.

Ad delivery placement does not automatically mean the application needs Instagram account/profile APIs.

---

# 57. WhatsApp Permissions

Completely separate from this integration.

Do not mix:

```text
whatsapp_business_management

whatsapp_business_messaging
```

into Meta Ads integration unless a separate product module requires them.

---

# 58. Lead Ads Permissions

If future product retrieves actual Lead Ads form submissions:

additional permissions may be required.

That should be a separate feature scope.

---

# 59. leads_retrieval

Do not request in V1.

The current Meta permission reference describes `leads_retrieval` specifically for reading information captured by lead-ad forms and lists dependencies for that use case.

---

# 60. V1 Does Not Need Lead Data

V1 needs:

```text
Spend

Campaign identity

Account identity

Account health
```

not individual lead/customer records.

This also reduces privacy exposure.

---

# 61. Permissions by Product Version

Recommended:

## V1

```text
ads_read

business_management
only if required
```

## Future Write Version

Possible:

```text
ads_management
```

## Future Lead Module

Possible:

```text
leads_retrieval
and its current required dependencies
```

---

# 62. Permission Config

Backend configuration should define:

```text
META_REQUIRED_PERMISSIONS

META_OPTIONAL_PERMISSIONS
```

Example:

```text
Required:
ads_read

Conditional:
business_management
```

---

# 63. Do Not Put Permission Logic Only in Frontend

Backend must independently know what permissions each operation needs.

---

# 64. Endpoint Guard

Conceptually:

```text
requireMetaCapability(
  connection,
  CAN_READ_INSIGHTS
)
```

before starting sync.

---

# 65. Permission Preflight

Before worker runs large sync:

```text
Connection active?

Required capability available?

Token validated recently?

```

If clearly blocked:

do not waste API quota.

---

# 66. Permission Failure During Sync

If API returns authorization error:

```text
Capture raw Meta error

Normalize error category

Update capability/permission health if confirmed

Stop inappropriate retries

Create alert
```

---

# 67. Do Not Revoke Permission Based on One Timeout

Timeout:

```text
NETWORK_ERROR
```

not:

```text
PERMISSION_REVOKED
```

---

# 68. Confirmed Permission Error

Only mark permission unhealthy when Meta response indicates authorization/access failure with sufficient confidence.

---

# 69. Connection-Level vs Asset-Level Permission Failure

Example:

`ads_read` works on AD1 but not AD2.

Possible cause:

```text
AD2 asset access
```

not connection-wide permission failure.

---

# 70. Asset Access Health

Per Ad Account optionally track:

```text
ACCESS_OK

ACCESS_DENIED

ACCESS_LOST

UNKNOWN
```

---

# 71. Connection-Wide Auth Failure

If all required endpoints fail because token invalid:

```text
MetaConnection
→ AUTH_REQUIRED
```

---

# 72. Partial Permission Loss

Example:

```text
Insights readable

Business portfolio discovery fails
```

Connection:

```text
DEGRADED
```

rather than completely unusable.

---

# 73. Permission Reconnect

Reconnect should:

```text
Obtain updated authorization

Store new token securely

Re-check permissions

Re-test capabilities

Re-run asset discovery

Compare previous access

Resume workers
```

---

# 74. Preserve Connection Identity

Reconnect should normally update credential of:

```text
MC-001
```

not create:

```text
MC-002 duplicate
```

---

# 75. Permission Changes Must Be Audited

Track:

```text
Old Granted Scopes

New Granted Scopes

Connection

Detected At

Changed By / Source
```

Do not store token itself in audit.

---

# 76. Permission Removal Alert

Possible:

```text
META_PERMISSION_ERROR
```

Include:

```text
Connection

Missing Permission

Affected Capability

Affected Asset Count
```

---

# 77. Missing ads_read

Severity likely:

```text
HIGH / CRITICAL
```

depending on number of affected accounts.

Because core reporting/spend sync stops.

---

# 78. Missing business_management

Severity depends on use.

If existing Ad Accounts remain readable:

```text
DEGRADED
```

may be sufficient.

If entire asset discovery depends on it:

higher severity.

---

# 79. App Review Preparation

For each requested permission prepare:

```text
Exact feature using it

Why feature requires it

Test user/account

Step-by-step reviewer flow

Screencast

Privacy Policy

Data handling explanation
```

---

# 80. Review Justification Must Match Product

For `ads_read`, explanation should clearly demonstrate:

```text
Authorized user connects Meta

System reads authorized Ad Accounts

System displays account/campaign/spend information

System uses data for internal ads operations/financial reconciliation
```

---

# 81. Avoid Fake Review Features

Do not build dummy permission use solely to pass review.

Requested permission should correspond to real production functionality.

---

# 82. Review Screencast

Show complete workflow:

```text
Login

Grant Permission

Select/Discover Asset

Use Data in Product

Relevant UI Result
```

without exposing secrets.

---

# 83. Test Credentials

Any reviewer/test environment should contain:

```text
Working login

Accessible test assets

Stable test data

Clear review instructions
```

according to current Meta submission requirements.

---

# 84. Privacy Policy

Permission request should correspond with privacy policy describing:

```text
What Meta data is accessed

Why it is accessed

How it is used

How it is stored/protected

Deletion/contact process
```

Exact legal wording handled separately.

---

# 85. Data Use Checkup

Meta's current permissions reference notes apps may be subject to Data Use Checkup requirements.

This should be tracked as an operational/compliance task.

---

# 86. Inactive Permission Regrant

Meta's current permission reference notes that when an app does not use a granted permission for a prolonged period—currently described as 90 days in the reference—an app user may need to grant that permission again.

Therefore integration must handle reauthorization gracefully.

---

# 87. Do Not Assume Token = Permanent Connection

Connection health requires ongoing monitoring.

Possible issues:

```text
Permission regrant

Token invalidation

Business access removed

Asset assignment removed

User access changed
```

---

# 88. Permissions Cache

System may cache last observed granted permissions.

Example:

```text
ads_read: GRANTED

business_management: GRANTED

last_checked_at: ...
```

But cache must not be considered permanent truth.

---

# 89. Refresh Permission Health

Check:

```text
During connection

After auth error

Periodic health check

After reconnect
```

---

# 90. Permission Health Timestamp

UI should display:

```text
Permissions last verified:
10 minutes ago
```

where useful.

---

# 91. Unknown Permission State

If health check fails due network:

```text
UNKNOWN
```

not:

```text
REVOKED
```

---

# 92. Access Token Debugging

Meta provides tools such as the Access Token Debugger for inspecting token metadata/permissions during development and troubleshooting; Meta's official Marketing API Postman guide explicitly references this workflow.

Production application should still perform its own server-side health checks.

---

# 93. Token Debugger Is Not Production Architecture

Do not make production system depend on developers manually checking tokens.

---

# 94. Permission Test Cases

Test:

```text
Valid ads_read

Missing ads_read

Valid business_management

Missing business_management

Permission revoked after working

Asset access removed

One account denied

All accounts denied

Token invalid

Connection reauthorized
```

---

# 95. Own Account Test

Test connection against company-owned account.

---

# 96. Shared Account Test

Test:

```text
Shared Ad Account
```

because permission/asset relationship differs from owned asset.

---

# 97. Client Account Test

Before production release verify:

```text
Authorized external/client Ad Account
```

works under the approved Meta access model.

Do not infer from company-owned account testing.

---

# 98. System User Test

Where used:

verify:

```text
System User exists

App assigned

Target asset assigned

Correct tasks/access assigned

Token contains required scopes

API call succeeds
```

---

# 99. Permission Error Logging

Safe fields:

```text
Connection ID

Permission/Capability

Meta Error Code

Meta Error Subcode

HTTP Status

Asset ID

Timestamp

Trace ID if available
```

---

# 100. Never Log

```text
Access Token

App Secret

Full Authorization Header
```

---

# 101. Meta App Secret

App Secret must remain:

```text
Server-only secret
```

Never frontend environment variable.

---

# 102. Token Storage Permissions

Only trusted backend/integration service should retrieve decrypted credential.

Finance/Ads Manager roles should not see raw token.

---

# 103. Internal App Permission vs Meta Permission

Important distinction:

```text
Meta Permission
```

controls what integration token can do on Meta.

```text
Internal Permission
```

controls what system user can do inside our product.

Both required.

---

# 104. Example

Meta token has:

```text
ads_read
```

but Viewer role does not have:

```text
VIEW_META_ACCOUNTS
```

Viewer should still not access internal account screen.

---

# 105. Ads Manager Internal Role

May view permitted Meta account data.

But should not see/change connection token.

---

# 106. Admin Internal Role

Can:

```text
Connect

Reconnect

Disable Meta Connection

Inspect Permission Health
```

subject to company policy.

---

# 107. Finance Internal Role

Usually does not need Meta connection credential management.

Can consume normalized Meta spend/status data required for reconciliation.

---

# 108. Separation of Duties

Recommended:

```text
Connection Administration
≠
Financial Approval
```

No reason Meta admin must automatically approve vendor payments.

---

# 109. Permission Expansion Procedure

Before requesting new Meta permission:

```text
1. Define feature.

2. Identify API endpoint.

3. Confirm current Meta requirement.

4. Confirm least-privilege alternative unavailable.

5. Update permission matrix.

6. Update privacy/data-flow documentation.

7. Prepare App Review if required.

8. Add backend capability.

9. Add tests.

10. Release after approval.
```

---

# 110. Permission Removal Procedure

If feature removed:

```text
Stop requesting permission

Remove dependent API calls

Update review/config

Update privacy documentation

Reconnect/re-authorize where appropriate
```

---

# 111. Permission Drift

Permission drift occurs when:

```text
App requests scopes no longer used
```

or:

```text
Code requires permission no longer requested
```

Scheduled review should detect this.

---

# 112. Quarterly Permission Review

Recommended internal control:

Review:

```text
Current Requested Permissions

Actual API Usage

Approved Access

Deprecated Permissions

Unused Permissions
```

Period can be adjusted.

---

# 113. Permission Environment Differences

Development:

```text
Developer/test assets
```

Staging:

```text
Controlled real/test business assets
```

Production:

```text
Approved authorized assets
```

Do not assume permissions behave identically across environments.

---

# 114. V1 Required Capability Matrix

```text
Feature:
Ad Account Discovery

Permission:
ads_read and/or business-management path as required by actual endpoint

Capability:
CAN_DISCOVER_AD_ACCOUNTS
```

```text
Feature:
Campaign Sync

Permission:
ads_read

Capability:
CAN_READ_CAMPAIGNS
```

```text
Feature:
Spend Sync

Permission:
ads_read

Capability:
CAN_READ_INSIGHTS
```

---

# 115. Portfolio Discovery

Where Business Manager API is used:

```text
Permission:
business_management
```

must be evaluated.

Meta's Business Management API currently explicitly identifies `business_management` as a requirement.

---

# 116. V1 Write Capability

```text
CAN_MANAGE_ADS = FALSE
```

by default.

---

# 117. Backend Safety Check

Even if a token accidentally has `ads_management`:

V1 backend should not expose campaign-write APIs.

Permission available:

```text
≠
Feature enabled
```

---

# 118. Extra Permission Does Not Grant Product Authorization

If token has more scopes than needed:

backend still restricts operations to V1 capabilities.

---

# 119. Connection Summary UI

Show:

```text
Connection Name

Connection Status

Required Permission Health

Optional Permission Health

Capabilities

Last Verification

Reconnect Action
```

---

# 120. Permission UI Example

```text
ads_read
✓ Granted
Required

business_management
✓ Granted
Used for portfolio discovery

ads_management
Not requested
Not required in V1
```

---

# 121. Avoid Technical Noise for Normal Users

Ads Manager user may see:

```text
Meta connection needs attention
```

Admin detail can show actual:

```text
ads_read missing
```

---

# 122. Connection Setup Validation

Do not mark connection fully active until required V1 test operations succeed.

---

# 123. Partial Connection

If portfolio discovery fails but manually configured Ad Accounts work:

allow:

```text
DEGRADED
```

if supported by product design.

---

# 124. Unsupported Permission Combination

If connection cannot meet minimum capabilities:

```text
BLOCK activation
```

and explain required remediation.

---

# 125. Meta Permission Changes

Meta can change:

```text
Permission definitions

Dependencies

Access levels

App Review requirements

Features
```

Therefore this document represents architectural policy, while exact current Meta requirements must be verified during implementation/submission.

---

# 126. Do Not Encode Review Rules Permanently

Avoid:

```text
if permission == X
then always requires exact review state Y
```

unless confirmed against current platform config.

Keep external requirements configurable/documented.

---

# 127. Production Checklist

Before enabling a Meta connection in production:

```text
Correct Meta App selected

App mode/config ready

Required access tier available

Required permissions granted

Business verification requirements satisfied where applicable

Target assets assigned

Functional read tests passed

Token stored securely

No secret exposed to frontend

Initial sync passed

Audit event recorded
```

---

# 128. V1 Recommended Permission Decision

For this project:

```text
ads_read
=
YES
```

because spend, campaign and advertising-read functionality is core.

```text
business_management
=
YES IF Business Manager API/portfolio discovery is required
```

which is likely useful for the desired:

```text
Meta Connection
→ Business Portfolio
→ Ad Account
```

hierarchy.

```text
ads_management
=
NO IN V1
```

until write operations are intentionally introduced.

---

# 129. Future Permission Decision

If future release supports:

```text
Campaign Pause

Budget Edit

Campaign Creation
```

then evaluate:

```text
ads_management
```

and its then-current access/review requirements.

---

# 130. Permissions Integrity Rules

System must enforce:

```text
1. Request the minimum Meta permissions needed for implemented functionality.

2. ads_read is the primary V1 advertising read/reporting permission.

3. business_management should only be requested when Business Manager API functionality is actually used.

4. ads_management should not be requested in V1 unless write functionality is introduced.

5. A granted permission does not automatically mean the token can access every asset.

6. Permission scope and asset assignment must be validated separately.

7. Development access success must not be assumed to equal client-account production readiness.

8. Required capabilities must be tested using actual API operations.

9. Missing optional permissions should degrade only the affected feature.

10. Missing critical permissions must stop dependent syncs.

11. Permission failures must not delete previously synchronized business or financial history.

12. Permission failure must never modify the ledger.

13. Tokens and app secrets must remain backend-only.

14. Raw credentials must never appear in logs or audit records.

15. Permission and capability changes must be auditable.

16. Reconnect must preserve the canonical Meta Connection where possible.

17. Meta permission requirements must be re-verified before App Review or API upgrades.

18. Internal product authorization and Meta platform permissions must remain separate.
```

---

# 131. Meta Permissions Golden Rule

> **Meta access must follow least privilege. The application should ask only for the permissions required to perform its current documented features, verify both permission scopes and actual asset access, and treat authorization failures as integration problems—not as reasons to alter internal business or financial truth.**
