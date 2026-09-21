# Auth and Security

## Overview

Ye document Ads Control system ke authentication, authorization, tenant isolation, secrets, session security aur financial security architecture ko define karta hai.

System financial aur operationally sensitive data handle karega:

```text
Client Funds

Vendor Funding

Vendor Payables

Vendor Receivables

Meta Ad Accounts

Financial Ledger

Refunds

Bank References

Supporting Documents
```

Isliye security ko later add-on nahi maana jayega.

Core principle:

> **Every request must prove who is acting, which organization they belong to, what they are allowed to do, which resource they may access and whether the requested business action is valid in the current financial state.**

---

# 1. Security Model

Recommended defense layers:

```text
Authentication
↓
Session Validation
↓
Tenant Isolation
↓
RBAC
↓
Resource Scope
↓
Business Authorization
↓
Approval / Maker-Checker
↓
Database Constraints
↓
Audit
```

Ek single layer failure hone par bhi doosri layers sensitive financial data ko protect karni chahiye.

---

# 2. Security Philosophy

System follows:

```text
Least Privilege

Deny by Default

Server-Side Enforcement

Defense in Depth

Explicit Trust Boundaries

Immutable Financial History

Secret Minimization

Continuous Auditability
```

OWASP authorization guidance specifically recommends both least privilege and deny-by-default authorization.

---

# 3. Authentication Provider

Recommended:

```text
Supabase Auth
```

Supabase Auth JWT-based authentication provide karta hai aur PostgreSQL RLS ke saath integrate kar sakta hai.

---

# 4. Authentication Responsibilities

Supabase Auth answers:

```text
Who is this user?
```

It does not by itself answer:

```text
Can this user settle Vendor Ram?

Can this user view Client Alpha?

Can this user approve ₹5 lakh refund?
```

Those decisions internal authorization layer karega.

---

# 5. Authentication vs Authorization

Keep separate:

```text
Authentication
=
Identity verification
```

```text
Authorization
=
Permission to access/action
```

Never treat:

```text
Authenticated user
=
Authorized for everything
```

---

# 6. Supported Sign-In

Initial recommended:

```text
Email + Password
```

Optional later:

```text
Magic Link

SSO

OAuth
```

depending on organization requirements.

---

# 7. Public Signup

Internal business application ke liye default:

```text
PUBLIC SELF-SIGNUP = DISABLED
```

Users should generally be:

```text
Invited by Admin
```

or provisioned through controlled onboarding.

---

# 8. User Lifecycle

Recommended:

```text
INVITED

ACTIVE

SUSPENDED

DEACTIVATED
```

Auth provider identity aur internal application membership separate rahenge.

---

# 9. User Removal

If employee leaves:

```text
Deactivate internal membership

Terminate/revoke sessions where appropriate

Remove privileged roles

Remove resource scopes

Rotate shared secrets if exposure possible

Preserve audit history
```

Historical actions user deletion ke saath disappear nahi hone chahiye.

---

# 10. Internal User Profile

Table:

```text
user_profiles
```

Possible fields:

```text
id

auth_user_id

organization_id

display_name

status

created_at

last_active_at
```

---

# 11. Supabase User ID

Use Supabase Auth user identifier as external authentication identity.

Internal domain relationships may reference internal user profile UUID.

---

# 12. JWT Authentication

Supabase user session access token:

```text
JWT
```

Backend ko token verify karna hai before trusting claims.

---

# 13. JWT Verification

Current Supabase guidance provides:

```text
supabase.auth.getClaims()
```

which verifies the JWT against the project's JWKS when asymmetric signing keys are used and is preferred over repeatedly calling `getUser()` solely for token validation.

---

# 14. NestJS JWT Verification

Recommended flow:

```text
Authorization Bearer JWT
↓
Verify signature
↓
Verify issuer/project context
↓
Verify expiry
↓
Read subject
↓
Load internal user membership
↓
Create ActorContext
```

---

# 15. JWKS

Supabase exposes project public signing keys through a JWKS endpoint when asymmetric signing keys are configured.

Backend may use:

```text
Supabase getClaims()
```

or trusted JWT/JWKS verification library.

---

# 16. Do Not Decode Without Verify

Bad:

```text
decode(jwt)
→ trust user ID
```

Correct:

```text
verify JWT signature
→ trust verified claims
```

---

# 17. `getSession()` Security Rule

Current Supabase SSR guidance warns not to rely on `getSession()` server-side as an authorization check because it does not necessarily revalidate the JWT.

Use verified claims instead.

---

# 18. Current User Record

Use:

```text
getUser()
```

when a fresh server-confirmed Auth user record is specifically required.

Use:

```text
getClaims()
```

for normal JWT identity verification.

---

# 19. Actor Context

After authentication backend constructs:

```text
ActorContext
```

Example:

```text
userId

authUserId

organizationId

roles

permissions

resourceScopes

aal

sessionId

requestId
```

---

# 20. Never Trust Actor IDs From Body

Bad:

```text
POST /payments

{
  "createdBy": "USR-ADMIN"
}
```

Backend must derive actor from authenticated context.

---

# 21. Organization Context

Same rule:

```text
organizationId
```

should not be freely user-controlled for tenant-scoped APIs.

---

# 22. Sessions

Supabase sessions consist of:

```text
Access Token
+
Refresh Token
```

Current Supabase documentation states access tokens are normally short-lived while refresh tokens are rotated and can only be exchanged once.

---

# 23. Session Architecture

Recommended web flow:

```text
User Login
↓
Supabase Auth
↓
Session
↓
Next.js
↓
JWT attached to NestJS request
↓
Nest verifies identity
```

---

# 24. Next.js SSR Auth

Current Supabase guidance supports cookie-based authentication for Next.js SSR through:

```text
@supabase/ssr
```

and recommends separate browser/server clients.

---

# 25. SSR Package Version Awareness

Supabase currently documents:

```text
@supabase/ssr
```

as recommended for SSR while also noting its API can evolve.

Pin tested package versions and review upgrades intentionally.

---

# 26. Browser Supabase Key

Browser may contain:

```text
NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Supabase explicitly treats the publishable key as suitable for client-side use when data is protected by appropriate authorization/RLS.

---

# 27. Browser Must Never Contain

```text
Supabase Secret Key

Legacy service_role Key

Database Password

Meta App Secret

Meta Access Token

Token Encryption Key
```

---

# 28. Supabase Key Model

Current Supabase key model distinguishes:

```text
Publishable Key
```

for low-privilege client use and:

```text
Secret Key
```

for privileged server use.

Legacy projects may also have:

```text
anon

service_role
```

keys.

---

# 29. Preferred Privileged Key

For new implementation:

```text
Supabase Secret Key
```

should be preferred where supported.

Legacy:

```text
service_role
```

may remain during migration/compatibility.

---

# 30. Secret Key Security

Supabase secret/service-role access can bypass RLS and therefore must remain server-side only.

---

# 31. Backend Database Access

NestJS/Prisma primarily connects directly to PostgreSQL through:

```text
DATABASE_URL
```

instead of routing every database operation through Supabase Data API.

---

# 32. Direct DB Trust Boundary

A privileged backend DB connection may not receive the same end-user RLS protections as frontend Data API calls.

Therefore:

> **NestJS authorization must be considered mandatory even when RLS also exists.**

---

# 33. Database Role Strategy

Production database access should use the least-privileged database role capable of backend duties.

Avoid routinely using:

```text
postgres superuser
```

for application traffic.

---

# 34. Database Credential Separation

Separate where feasible:

```text
Application Runtime DB Credential

Migration/Admin DB Credential
```

Application role should not need schema-owner permissions.

---

# 35. Row Level Security

Use PostgreSQL/Supabase:

```text
RLS
```

as defense in depth on tenant-scoped/exposed tables.

---

# 36. RLS Objective

Primary invariant:

```text
ORG-A
cannot access
ORG-B
```

---

# 37. Tenant Column

Every tenant-owned table should carry:

```text
organization_id
```

directly or through an unambiguous protected relationship.

---

# 38. RLS Example Concept

Conceptually:

```text
organization_id
=
authenticated user's authorized organization
```

---

# 39. RLS Is Not Full Business Authorization

RLS is excellent for:

```text
Row isolation
```

but complex rules such as:

```text
Finance user may refund up to threshold

Maker cannot approve own request
```

belong in backend domain authorization.

---

# 40. RLS Bypass Warning

Supabase documents that secret/service-role access can bypass RLS.

Therefore backend code using privileged access must never assume:

```text
RLS will save us
```

from missing authorization checks.

---

# 41. RLS Policy Testing

Every major table should test:

```text
Own tenant read

Other tenant read

Own tenant write

Other tenant write

Anonymous access
```

---

# 42. Deny by Default

New resource/endpoint should start:

```text
DENIED
```

until explicit permission added.

OWASP recommends deny-by-default authorization.

---

# 43. RBAC

Use:

```text
Role-Based Access Control
```

for broad job responsibilities.

Recommended baseline roles:

```text
ADMIN

FINANCE

ADS_MANAGER

VIEWER
```

---

# 44. Permissions

Roles map to granular permissions.

Examples:

```text
CLIENT_VIEW

CLIENT_CREATE

CLIENT_PAYMENT_POST

CLIENT_REFUND_CREATE

VENDOR_VIEW

VENDOR_FUNDING_POST

VENDOR_SETTLEMENT_POST

LEDGER_VIEW

RECONCILIATION_RESOLVE

META_CONNECTION_MANAGE

META_ACCOUNT_VIEW

APPROVAL_APPROVE

AUDIT_VIEW
```

---

# 45. Permission Tables

Conceptually:

```text
roles

permissions

role_permissions

user_roles
```

---

# 46. Do Not Code Role Checks Everywhere

Bad:

```text
if role === ADMIN
```

Preferred:

```text
can('VENDOR_SETTLEMENT_POST')
```

---

# 47. Custom Roles

Future:

```text
Finance Manager

Junior Finance

Ads Team Lead

Auditor
```

can be created through permission combinations.

---

# 48. Resource Scope

RBAC alone may be too broad.

Add resource scopes.

Example:

```text
ADS_MANAGER
```

may only see assigned:

```text
Clients A, B, C
```

---

# 49. Scope Types

Possible:

```text
ALL_ORGANIZATION

CLIENT

VENDOR

AD_ACCOUNT

TEAM

ASSIGNED_ONLY
```

---

# 50. Authorization Equation

Conceptually:

```text
Authorized
=
Authenticated
AND
Active Membership
AND
Permission
AND
Resource Scope
AND
Business Rule
```

---

# 51. Permission + Scope Example

User has:

```text
CLIENT_VIEW
```

but scoped to:

```text
CLI-001
```

Request:

```text
GET CLI-002
```

must be denied.

---

# 52. Financial Visibility

Separate permission dimension can control sensitive values.

Examples:

```text
NONE

OPERATIONAL

SUMMARY

FULL
```

---

# 53. ADS_MANAGER Visibility

May see:

```text
Client Allocation

Spend

Operational Remaining
```

but not necessarily:

```text
Vendor Liability

Company Bank

Financial Adjustments
```

---

# 54. VIEWER

Viewer may have read-only access according to assigned scope.

Viewer must not gain mutation rights merely through frontend bugs.

---

# 55. ADMIN

Admin does not automatically need unlimited financial posting permissions.

Recommended separation:

```text
System Administration
≠
Finance Authority
```

---

# 56. Separation of Duties

High-risk capabilities should be intentionally separated.

Examples:

```text
Manage Meta Credentials

Approve Vendor Settlement

Write Off Funds
```

need not belong to same person.

---

# 57. Maker-Checker

For sensitive actions:

```text
Requester
≠
Approver
```

where policy configured.

---

# 58. Maker-Checker Use Cases

Recommended:

```text
Large Vendor Settlement

Client Refund

Cross-Client Transfer

Write-Off

Manual Journal

Ownership Transfer
```

---

# 59. Approval Threshold

Example business configuration:

```text
Refund > ₹50,000
→ Approval Required
```

Exact thresholds belong in organization settings.

---

# 60. Approval Snapshot

Approval must bind to:

```text
Amount

Currency

Source

Destination

Reason

Requested Action
```

---

# 61. Approval Replay Protection

Approved request cannot be reused to execute:

```text
different amount

different vendor

different client
```

---

# 62. Material Change

Any material change invalidates/requires new approval.

---

# 63. MFA

Multi-factor authentication is recommended for sensitive users.

Supabase supports MFA and exposes Authenticator Assurance Level:

```text
aal1

aal2
```

inside JWT/session context.

---

# 64. MFA Recommendation

Require MFA at least for:

```text
ADMIN

FINANCE APPROVER
```

and potentially all production users.

---

# 65. AAL1

Supabase defines:

```text
aal1
```

as conventional first-factor authentication.

---

# 66. AAL2

```text
aal2
```

means the user successfully completed an additional authentication factor.

---

# 67. Step-Up Authentication

High-risk actions can require:

```text
aal2
```

even if normal browsing allows:

```text
aal1
```

---

# 68. Step-Up Candidates

Recommended:

```text
Write-Off

Large Refund

Vendor Settlement Approval

Ownership Transfer

Manual Financial Adjustment

Meta Credential Change

User Role Escalation
```

---

# 69. Backend MFA Enforcement

Frontend prompt is not enough.

Backend verifies JWT:

```text
aal == aal2
```

for protected high-risk actions.

---

# 70. MFA UI

If:

```text
currentLevel = aal1

nextLevel = aal2
```

redirect user to MFA verification rather than pretending authorization failure.

Supabase documents this AAL flow for MFA-enabled sessions.

---

# 71. Session Lifetime

Supabase sessions can by default continue until terminated, and additional controls can configure inactivity/maximum lifetime depending on plan/settings.

For financial system, explicit session policy is recommended.

---

# 72. Recommended Session Policy

Evaluate:

```text
Maximum session lifetime

Inactivity timeout

MFA requirement

Concurrent session policy
```

based on organization security level.

---

# 73. Example Initial Policy

Possible starting point:

```text
Normal session maximum:
8–24 hours

Privileged reauthentication:
shorter

Sensitive step-up:
aal2
```

Exact values remain organization/security configuration.

---

# 74. Shared Computers

Shorter inactivity timeout is recommended for environments with shared workstations.

---

# 75. Session ID

Supabase access tokens include:

```text
session_id
```

that can correlate a JWT with its Auth session.

Useful for security audit.

---

# 76. Session Audit

Possible records:

```text
Login

Logout

MFA Completed

Session Revoked

Suspicious Reauthentication
```

Do not log access/refresh token value.

---

# 77. Session Revocation

When:

```text
User deactivated

Privilege removed after incident

Credential compromise suspected
```

invalidate/revoke sessions as appropriate.

---

# 78. Password Change

Sensitive password/security changes should cause appropriate session reassessment/revocation according to Supabase configuration.

---

# 79. Cookie Security

If authentication session uses cookies, security configuration must include appropriate:

```text
Secure

SameSite

Path/Domain controls
```

and preferably `HttpOnly` for custom server-only session cookies where architecture permits.

---

# 80. SameSite

OWASP recommends explicit SameSite configuration and treats it as defense in depth rather than a universal replacement for CSRF protection.

---

# 81. CSRF

CSRF risk depends on authentication transport.

If NestJS authorization is automatically carried in browser cookies:

```text
CSRF protection required
```

---

# 82. Bearer Header

If frontend explicitly sends bearer access token in:

```text
Authorization
```

cross-site forms cannot automatically attach that custom header in the same way as cookies.

Still maintain:

```text
CORS

Origin controls

XSS prevention
```

---

# 83. Cookie-Based Mutation Protection

Recommended defense in depth:

```text
SameSite cookie

CSRF token where appropriate

Origin verification

No GET mutations
```

OWASP specifically warns that SameSite alone has limitations.

---

# 84. GET Must Never Mutate

Never:

```text
GET /vendor/settle?id=...
```

State-changing operations:

```text
POST

PATCH

DELETE
```

as appropriate.

---

# 85. CORS

NestJS should maintain strict allowlist.

Example:

```text
https://app.example.com
```

not:

```text
*
```

for credentialed/authenticated APIs.

---

# 86. CORS Environments

Separate:

```text
Development Origins

Staging Origins

Production Origins
```

---

# 87. Origin Validation

High-risk cookie-authenticated mutation paths should consider Origin verification as additional CSRF defense.

---

# 88. XSS

XSS can compromise authenticated browser context.

Protect through:

```text
React escaping

No unsafe HTML

CSP

Input sanitization

Dependency security
```

---

# 89. Dangerous HTML

Avoid:

```text
dangerouslySetInnerHTML
```

for user/client/vendor notes.

If ever required:

```text
sanitize first
```

---

# 90. Content Security Policy

Recommended production CSP.

Control:

```text
script-src

connect-src

img-src

frame-ancestors
```

according to required providers.

---

# 91. CSP Development vs Production

Development may require more relaxed policy.

Production should be restrictive.

---

# 92. Clickjacking

Set:

```text
frame-ancestors
```

through CSP and/or appropriate frame headers.

Application normally should not be embeddable by arbitrary websites.

---

# 93. Security Headers

Recommended:

```text
Content-Security-Policy

X-Content-Type-Options: nosniff

Referrer-Policy

Permissions-Policy

HSTS
```

with configuration tested against application behavior.

---

# 94. HTTPS

Production:

```text
HTTPS ONLY
```

HTTP redirects to HTTPS.

---

# 95. HSTS

Enable after HTTPS configuration is stable.

Use carefully with subdomains.

---

# 96. Reverse Proxy Trust

NestJS should trust forwarded proxy headers only from known reverse proxy configuration.

Do not blindly trust arbitrary:

```text
X-Forwarded-For
```

from internet clients.

---

# 97. IP Logging

Can store coarse operational security metadata where legitimate.

Do not use IP address as identity.

---

# 98. Rate Limiting

Protect:

```text
Login

Password reset

MFA flows

Meta reconnect

Report exports

Financial mutations
```

---

# 99. Rate Limits Do Not Replace Authorization

A malicious authorized user sending one bad request is still harmful.

Business authorization remains primary.

---

# 100. Brute Force

Authentication provider controls + application monitoring should detect repeated failed login patterns.

---

# 101. Account Lockout

Avoid insecure permanent lockout patterns that can create easy denial-of-service.

Use provider-supported protections/rate limiting.

---

# 102. Secrets Management

Secrets include:

```text
Database Password

Supabase Secret Key

Meta App Secret

Meta Access Token

Encryption Keys

Sentry Auth Token

Deployment Credentials
```

OWASP recommends centralized secret lifecycle practices including controlled storage, access and rotation rather than hardcoding secrets.

---

# 103. Secrets Must Not Be In

```text
Git Repository

Frontend Bundle

Screenshots

Logs

Error Messages

Documentation Examples

Queue Payloads
```

---

# 104. `.env`

Local:

```text
.env.local
```

may contain developer secrets.

Must be:

```text
.gitignore
```

---

# 105. Production Secrets

Initial VPS may use secured environment files / deployment secret management.

Future:

```text
Dedicated Secret Manager
```

can be introduced.

---

# 106. File Permissions

Production `.env`/secret files must be readable only by required deployment/runtime users.

---

# 107. Secret Rotation

Every major secret should support rotation.

Examples:

```text
Meta Access Token

Supabase Secret Key

DB Password

Encryption Key
```

---

# 108. Secret Metadata

Track:

```text
secret_type

version

created_at

rotated_at
```

where useful.

Do not store plaintext secret in audit.

---

# 109. Encryption at Rest for Meta Tokens

Meta connection token should be stored encrypted.

Conceptual:

```text
ciphertext

key_version

nonce

auth_tag
```

---

# 110. Encryption Key

Encryption key must not live in the same database row as encrypted token as plaintext.

---

# 111. Cryptography

Use established:

```text
AES-256-GCM
```

or appropriate well-reviewed authenticated encryption implementation.

Do not create custom crypto.

---

# 112. Key Rotation

Token record stores:

```text
key_version
```

so data can be re-encrypted under newer key.

---

# 113. Token Decryption

Only trusted Meta integration backend/worker code should decrypt Meta token.

---

# 114. Token Access

Finance user:

```text
cannot read Meta token
```

Ads Manager:

```text
cannot read Meta token
```

Admin UI:

```text
cannot read full Meta token
```

at most:

```text
Connected / Reconnect Required
```

---

# 115. Secret Logging

Logger redaction patterns:

```text
authorization

access_token

refresh_token

app_secret

password

service_role

secret_key
```

---

# 116. URL Logging

Be careful with query strings.

Never log:

```text
?access_token=...
```

---

# 117. Database URLs

`DATABASE_URL` commonly contains credential.

Never expose in errors/UI.

---

# 118. Supabase Secret Key

Supabase explicitly says secret/service-role keys must never be exposed in frontend because they carry elevated access and can bypass RLS.

---

# 119. Secret Key Isolation

Only components requiring privileged Supabase API operations receive it.

Example:

```text
API

Worker
```

Browser never.

---

# 120. Least Secret Distribution

If Report Worker does not need Meta token:

do not give it Meta token environment variable.

---

# 121. Container Secret Boundaries

Ideally different services receive only secrets required by that process.

---

# 122. Database Security

Production database should not be openly reachable from arbitrary internet sources where network restrictions can be applied.

---

# 123. Connection Encryption

Use:

```text
SSL/TLS
```

for remote PostgreSQL connections according to Supabase connection requirements.

---

# 124. Prisma Credentials

Prisma application credentials remain server-only.

---

# 125. Migration Credentials

CI/deployment only.

Do not include powerful migration credential in normal frontend or unnecessary containers.

---

# 126. SQL Injection

Normal Prisma parameterization protects many paths.

For raw SQL:

```text
parameterized values only
```

Never concatenate user input.

---

# 127. Dynamic Sorting

Whitelist requested sort columns.

Never:

```text
ORDER BY ${userInput}
```

without controlled mapping.

---

# 128. File Security

Financial evidence uploads may contain sensitive information.

Use private storage.

---

# 129. Storage Access

Default:

```text
PRIVATE
```

Download only through authorized signed URL or backend proxy.

---

# 130. Signed URLs

Use short expiry.

Do not create long-lived publicly reusable evidence URLs.

---

# 131. Upload Authorization

Before signed upload:

```text
Authenticate

Authorize entity

Validate upload purpose
```

---

# 132. Upload Limits

Validate:

```text
Max file size

Allowed MIME

Allowed extension

Document type
```

---

# 133. Filename

Never trust raw filename as storage path.

Generate internal path.

---

# 134. Malicious Files

Future enhancement:

```text
Malware scanning
```

especially if users upload PDFs/images/documents.

---

# 135. Content-Type

Do not trust client-provided MIME alone.

Perform server/storage-side checks where feasible.

---

# 136. File Execution

Uploads must never be executed as application code.

---

# 137. Financial Evidence Immutability

Proof attached to posted financial event should normally not be silently replaced.

Use:

```text
Superseded attachment

New version

Audit
```

---

# 138. Hash

Optional evidence checksum:

```text
SHA-256
```

helps detect unintended replacement.

---

# 139. Audit Security

Audit records must be append-only to normal users.

---

# 140. Audit Events

Capture:

```text
Login-related security action

Role assignment

Permission change

Meta reconnect

Client payment post

Vendor settlement post

Refund approval

Write-off

Reversal

Settings change
```

---

# 141. Audit Actor

Store:

```text
USER

SYSTEM

WORKER

MIGRATION
```

---

# 142. Audit Correlation

Include:

```text
request_id

session_id where appropriate

related transaction ID
```

---

# 143. Audit Does Not Store Secrets

Never include:

```text
JWT

Password

Meta token

Secret key
```

---

# 144. Authentication Logs

Track meaningful events:

```text
Successful login

Failed login summary

MFA enrollment/change

Privilege escalation

Session revocation
```

according to privacy/security policy.

---

# 145. Authorization Failure Logs

Repeated:

```text
403
```

for sensitive resources may indicate abuse.

Monitor patterns.

---

# 146. Cross-Tenant Attempt

High-confidence cross-tenant access attempt should create security log/event.

Do not expose whether target exists.

---

# 147. Tenant Isolation Testing

Mandatory tests:

```text
ORG-A Client → ORG-A User = allowed

ORG-A Client → ORG-B User = denied

ORG-A UUID guessed by ORG-B = no leak

Cross-tenant export = denied

Cross-tenant attachment = denied
```

---

# 148. Tenant Isolation at API Layer

Every repository/service must load by:

```text
organization_id
+
resource_id
```

---

# 149. Tenant Isolation at Database Layer

RLS/constraints provide additional protection.

---

# 150. Child Resource Tenant Validation

Example:

```text
POST /clients/{A}/jobs/{B}
```

must verify:

```text
Job B belongs to Client A

Both belong to current organization
```

---

# 151. IDOR Protection

Random UUIDs help but do not solve authorization.

Every resource fetch must check authorization.

---

# 152. Sensitive Identifiers

Do not use guessability as security mechanism.

---

# 153. Financial Authorization

Financial command authorization includes more than role.

Example settlement:

```text
Permission

Vendor scope

Amount authority

Approval

MFA level

Vendor status

Current payable
```

---

# 154. Step-Up Financial Security

Recommended high-risk flow:

```text
User logged in
↓
Requests large refund
↓
AAL check
↓
If aal1 → MFA challenge
↓
aal2
↓
Approval/domain validation
↓
Posting
```

---

# 155. Step-Up Validity

AAL state comes from verified JWT.

Do not trust:

```text
frontend says MFA complete
```

---

# 156. Sensitive User Management

Role escalation to:

```text
ADMIN

FINANCE APPROVER
```

should itself require:

```text
High permission

MFA

Audit
```

and potentially approval.

---

# 157. Prevent Self-Privilege Escalation

User cannot modify own roles/scopes to gain new privileges unless explicitly authorized under controlled admin flow.

---

# 158. Last Admin

System should prevent accidental removal/deactivation of last valid organization administrator unless recovery process exists.

---

# 159. User Invitation

Invitation should:

```text
Bind intended organization

Expire

Be single-purpose

Require authenticated completion
```

according to auth flow.

---

# 160. Invitation Role

Avoid putting uncontrolled role selection into invitation acceptance request.

Server stores intended role.

---

# 161. Password Policy

Use provider-supported modern password requirements.

Prefer:

```text
Long password/passphrase

Compromised-password protections where available
```

over unnecessarily complex composition rules alone.

---

# 162. Password Storage

Supabase Auth handles password storage.

Application database should never store user plaintext passwords.

---

# 163. Meta Passwords

Never request/store:

```text
Facebook password
```

Meta connection uses supported OAuth/token-based authentication.

---

# 164. Password Reset

Use Supabase supported recovery flow.

After sensitive reset:

review/revoke prior sessions according to configured security policy.

---

# 165. Login Error Messages

Avoid unnecessary account enumeration.

Example:

```text
Unable to sign in with those credentials.
```

rather than exposing whether email definitely exists where avoidable.

---

# 166. Email Verification

For invited/internal users, verified email should be required before production access according to chosen auth workflow.

---

# 167. Login Redirects

Validate redirect destinations.

Avoid open redirects:

```text
?next=https://evil.example
```

---

# 168. Allowed Redirects

Use internal route allowlist or verified same-origin paths.

---

# 169. OAuth State

If social/OAuth login added:

use provider/library-supported:

```text
state

PKCE
```

controls.

Supabase SSR guidance uses PKCE-compatible server-side flows.

---

# 170. API Authorization Header

Nest APIs should accept:

```text
Authorization: Bearer <verified access token>
```

for authenticated API calls.

---

# 171. Token Exposure

Avoid placing access tokens in:

```text
URL

query parameters

browser history

logs
```

---

# 172. Refresh Token

Treat as highly sensitive session credential.

Do not log or expose to backend modules that don't need session handling.

---

# 173. Local Storage

Do not manually copy sensitive session tokens into additional browser local-storage keys.

Use supported Supabase session mechanism.

---

# 174. Logout

On logout:

```text
End auth session as configured

Clear application query cache

Clear sensitive UI state

Return to login
```

---

# 175. Shared Device

After logout, previous user's cached financial data must not remain visible.

---

# 176. Browser Cache

Authenticated financial responses should generally use:

```text
private

no-store
```

or other deliberate caching policy.

Do not allow public intermediary caching.

---

# 177. Next.js Server Cache

Do not accidentally statically cache tenant-specific financial pages across users.

Authenticated data must be request/user scoped.

---

# 178. SSR User Isolation

Supabase's MFA/SSR guidance warns server contexts to avoid accidentally reusing user-specific clients across requests.

Create request-scoped SSR auth context as appropriate.

---

# 179. Server-Side Supabase Client

For Next.js SSR:

create appropriate client per request/context as documented.

Do not use one globally stateful user session client shared across requests.

---

# 180. Backend API Client

NestJS is stateless regarding end-user session.

Each request verifies bearer token.

---

# 181. Security Context Caching

Do not cache permission state indefinitely.

If role removed:

access should stop within controlled short interval/session refresh policy.

---

# 182. Permission Version

Optional:

```text
authorization_version
```

can help detect changed membership/permissions.

---

# 183. Critical Permission Recheck

High-risk financial operation should query current DB authorization state rather than relying exclusively on old JWT-custom permission claims.

---

# 184. Avoid Huge Permission JWT

Keep dynamic authorization in database.

JWT primarily authenticates identity/session assurance.

---

# 185. User Deactivation

Backend checks:

```text
user_profile.status == ACTIVE
```

on protected operations.

Even valid Supabase JWT should not bypass internal deactivation.

---

# 186. Organization Suspension

Organization status may globally disable business mutations while retaining controlled read/export access.

---

# 187. Security Incident Mode

Future capability:

```text
READ_ONLY_MODE
```

or:

```text
FINANCIAL_WRITES_DISABLED
```

for emergency operational response.

---

# 188. Kill Switches

Recommended environment/system controls:

```text
FINANCIAL_WRITES_ENABLED

META_SYNC_ENABLED

META_WRITE_ENABLED
```

Meta write remains false in V1.

---

# 189. Kill Switch Security

Only high-authority administrator/deployment configuration can change emergency controls.

Audit changes.

---

# 190. Meta Integration Security

Each Meta Connection stores:

```text
encrypted token

auth mode

status

permissions
```

not credentials in browser.

---

# 191. Meta Connection Management Permission

Example:

```text
META_CONNECTION_MANAGE
```

required to:

```text
Connect

Reconnect

Disable
```

---

# 192. Meta Connection Data View

Normal user sees:

```text
Connection Name

Health

Permissions

Last Sync
```

not token.

---

# 193. Meta App Secret

Server-side only.

Use environment secret storage.

---

# 194. Meta Token Refresh/Replacement

New token:

```text
Encrypt

Store new version

Invalidate old secret reference

Audit credential rotation metadata
```

without logging token.

---

# 195. Queue Security

BullMQ job payload must not include:

```text
Access Token

Secret Key

Database Password
```

---

# 196. Queue Payload

Contains:

```text
organizationId

resourceId

job type

syncRunId
```

Worker reloads credentials securely.

---

# 197. Redis Network Security

Redis:

```text
Private Docker/network

Not internet-exposed
```

---

# 198. Redis Authentication

Configure authentication where appropriate.

Even with private network, do not treat Redis as harmless.

---

# 199. Queue Injection

Workers validate:

```text
job schema

organization

resource existence

current state
```

before executing.

---

# 200. Stale Queue Jobs

Job may be legitimate when queued but invalid later.

Worker rechecks authorization/business eligibility.

---

# 201. Outbox Security

Outbox events contain business references but no secrets.

---

# 202. Internal Event Trust

Even internal events should be validated against canonical DB state before high-risk side effects.

---

# 203. Financial Integrity Security

Security also means preventing accidental unauthorized state transitions.

Controls:

```text
Idempotency

DB locking

Constraints

Maker-checker

Immutable ledger

Reconciliation
```

---

# 204. Duplicate Request Attack

Sending same settlement repeatedly should result in:

```text
one canonical posting
```

through idempotency.

---

# 205. Replay Attack on Financial API

Valid previously captured command should not be reusable indefinitely to create additional postings.

Idempotency + authentication + current state prevent this.

---

# 206. Financial State Race

Authorization done before transaction is insufficient.

Backend must recheck financial state under lock.

---

# 207. Example

At preview:

```text
Available ₹20,000
```

At posting:

another transaction used ₹10,000.

Backend must see:

```text
Available ₹10,000
```

under locked current state.

---

# 208. Audit vs Security Alert

Audit:

```text
Records what happened
```

Security alert:

```text
Flags suspicious behavior
```

Keep separate.

---

# 209. Security Alerts

Potential:

```text
Repeated Failed Login

Repeated Forbidden Access

Cross-Tenant Access Attempt

Privilege Escalation

Unusual MFA Changes

Secret Rotation Required
```

---

# 210. Financial Abuse Alerts

Possible future:

```text
Unusually Large Refund

Repeated Reversal Attempts

Multiple Failed Settlement Conflicts
```

These are risk signals, not automatic guilt conclusions.

---

# 211. Sentry Security

Sentry events must redact:

```text
Authorization

Cookies

Passwords

Tokens

Financial evidence
```

---

# 212. Error Responses

Production error must never reveal:

```text
SQL statement

database hostname

secret

internal stack trace

encryption metadata
```

---

# 213. Request IDs

Return:

```text
requestId
```

so support can locate logs without exposing internals.

---

# 214. Dependency Security

Use automated dependency alerts.

Monitor:

```text
Next.js

NestJS

Supabase packages

Prisma

BullMQ

Redis clients
```

for security releases.

---

# 215. Lockfile

Production builds use committed:

```text
pnpm-lock.yaml
```

to prevent unexpected dependency changes.

---

# 216. Dependency Update Process

```text
Security advisory
↓
Update branch
↓
Tests
↓
Staging
↓
Production
```

---

# 217. No Blind Major Upgrade

Especially:

```text
Auth

ORM

Framework

Crypto
```

major versions require review.

---

# 218. Container Security

Production images should:

```text
Use minimal base image

Run non-root where practical

Exclude development tools

Exclude source secrets
```

---

# 219. Docker Socket

Application containers should not have Docker socket mounted.

---

# 220. Container Capabilities

Remove unnecessary Linux capabilities where practical.

---

# 221. Image Scanning

Future/CI:

```text
Container vulnerability scan
```

before production deployment.

---

# 222. VPS Access

Use:

```text
SSH keys
```

rather than password login where possible.

---

# 223. Root SSH

Disable direct root SSH where operationally feasible.

Use controlled sudo user.

---

# 224. Firewall

Only expose necessary ports:

```text
80

443

SSH restricted
```

Redis/application internal ports remain private.

---

# 225. SSH Restriction

Where practical:

```text
IP allowlist

VPN

Zero-trust access
```

can strengthen VPS administration.

---

# 226. OS Updates

Keep VPS:

```text
Security patched
```

with controlled maintenance/reboots.

---

# 227. Backups Security

Database backups contain sensitive financial information.

Treat backup as sensitive as production DB.

---

# 228. Backup Access

Only authorized administrators.

---

# 229. Backup Encryption

Use provider encryption/security and additional encryption where applicable.

---

# 230. Backup Restore Testing

Security/reliability requires verifying backups can actually be restored.

---

# 231. Production Data in Development

Do not copy full production DB casually.

Use:

```text
Synthetic data
```

or:

```text
Sanitized snapshot
```

if debugging requires realistic data.

---

# 232. Sensitive Data Minimization

Store only data required for business/system operation.

Do not collect extra personal information merely because storage is available.

---

# 233. Bank Details

If bank information becomes necessary:

store minimal required fields.

Restrict visibility.

---

# 234. Payment References

UTR/reference numbers are sensitive operational data.

Only appropriate roles should view/export them.

---

# 235. Export Security

CSV/XLSX export can leak large volumes.

Require:

```text
REPORT_EXPORT
```

and resource scope.

---

# 236. Export Audit

Record:

```text
Who exported

Report type

Scope

Timestamp
```

---

# 237. Signed Export Links

Short-lived.

Do not create permanent public report links.

---

# 238. Spreadsheet Injection

When generating CSV/XLSX with user-controlled strings, protect against formula injection values beginning with characters such as:

```text
=

+

-

@
```

according to export sanitization policy.

---

# 239. Import Security

Imported CSVs must be treated as untrusted data.

Validate all:

```text
IDs

Amounts

Dates

References

Text
```

---

# 240. No Import Bypass

Bulk import must not bypass:

```text
Tenant checks

Duplicate checks

Financial validation
```

---

# 241. Webhook Security

Future Meta webhook endpoint must verify provider authenticity.

Webhook signal alone should not make financial posting.

---

# 242. Webhook Replay

Use:

```text
event deduplication

timestamp/signature rules where available
```

---

# 243. Meta Webhook Scope

Webhook:

```text
signals change
```

then backend fetches canonical supported API state.

---

# 244. API Rate Limit Trust

Client IP/user rate limits are supplemental.

Do not use IP as authorization.

---

# 245. Security Testing

Required:

```text
Authentication tests

Authorization tests

Tenant isolation tests

RLS tests

MFA tests

Financial permission tests

CSRF tests where relevant

XSS tests

Secret leakage tests
```

---

# 246. Auth Test Cases

```text
No JWT

Expired JWT

Invalid signature

Valid JWT

Deactivated user

Wrong Supabase project token
```

---

# 247. MFA Test Cases

```text
aal1 normal read

aal1 sensitive write blocked/step-up required

aal2 sensitive action allowed

MFA removed/stale session
```

---

# 248. RBAC Tests

For every sensitive endpoint:

```text
Allowed role

Denied role

Custom permission

No permission
```

---

# 249. Resource Scope Tests

```text
Allowed Client A

Denied Client B

Allowed own assigned account

Denied unassigned account
```

---

# 250. Maker-Checker Tests

```text
Requester approves own transaction
→ denied

Different authorized approver
→ allowed
```

---

# 251. RLS Tests

Test direct exposed-data paths where enabled.

Ensure:

```text
cross-tenant SELECT denied

cross-tenant INSERT denied

cross-tenant UPDATE denied
```

---

# 252. Secret Scanning

CI should detect accidentally committed:

```text
API keys

Private keys

Tokens
```

through secret scanning.

---

# 253. Git History

Removing a leaked secret from latest commit is not enough.

Rotate compromised credential.

---

# 254. Penetration Testing

Before broad production use:

perform targeted security review for:

```text
Authentication

Authorization/IDOR

Tenant isolation

Financial command APIs

Uploads

Exports
```

---

# 255. OWASP-Oriented Testing

Prioritize:

```text
Broken Access Control

Injection

Authentication Failures

Security Misconfiguration

Cryptographic Failures
```

relevant to this architecture.

---

# 256. Security Review Before New Feature

Mandatory for features that introduce:

```text
Meta write operations

Bank integrations

Public API

External webhooks

Cross-client transfers

Automated financial actions
```

---

# 257. Meta Write Security

V1:

```text
META_WRITE_ENABLED = false
```

Backend should not expose campaign-modification capability even if Meta token happens to have extra scopes.

---

# 258. Excess External Permission

A token possessing:

```text
ads_management
```

does not mean application should use it.

Product feature flag + backend capability controls still apply.

---

# 259. Financial Write Kill Switch

Emergency:

```text
FINANCIAL_WRITES_ENABLED=false
```

can block new mutations while maintaining read access.

---

# 260. Kill Switch Must Fail Safe

When uncertain:

```text
deny mutation
```

rather than allow.

---

# 261. Security Configuration Audit

Material changes:

```text
MFA policy

Approval threshold

Role permissions

Financial feature flags

Meta connection
```

must be audited.

---

# 262. Authorization Cache

If caching permissions for performance:

keep TTL short and invalidate on permission change.

High-risk action should still verify authoritative state.

---

# 263. Background Worker Authorization

System jobs are not normal users.

They need:

```text
explicit system capability
```

and should execute only well-defined operations.

---

# 264. Worker Cannot Become Superuser API

Queue payload should not support arbitrary:

```text
operation: "run-any-sql"
```

---

# 265. System Actor Audit

Worker changes recorded as:

```text
actor_type = SYSTEM
```

with source event/job ID.

---

# 266. Reconciliation Security

User resolving case must have:

```text
RECONCILIATION_RESOLVE
```

and cannot simply hide mismatch.

---

# 267. Alert Security

Acknowledging alert is not equivalent to solving financial condition.

Backend preserves condition truth.

---

# 268. Ledger Security

Only controlled posting services can create:

```text
POSTED ledger transaction
```

---

# 269. Ledger Read Security

Ledger may expose company-wide financial details.

Restrict:

```text
LEDGER_VIEW
```

separately from client operational visibility.

---

# 270. Ledger Immutability

No ordinary API:

```text
UPDATE ledger_entries
```

after posting.

---

# 271. Database Trigger Defense

Optional DB trigger can reject modification/deletion of posted entries even if application bug occurs.

---

# 272. Audit Immutability Defense

Normal DB application role should lack ability to delete audit records where practical.

---

# 273. Financial Period Closure

Future closed-period control can prevent late backdated financial mutations without special approval.

---

# 274. Time Manipulation

Backend controls:

```text
created_at

posted_at
```

Client may propose:

```text
business_date
```

only where allowed.

---

# 275. Security Time Source

Server/database timestamps authoritative.

Do not trust browser clock for audit sequence.

---

# 276. Sensitive Operation Reason

Require reason for:

```text
Reversal

Write-Off

Ownership Transfer

Manual Adjustment

Permission Escalation
```

---

# 277. Reason Is Audit Context

Reason doesn't replace approval or validation.

---

# 278. Reversal Security

User reversing transaction must have special permission.

Cannot alter original.

---

# 279. Write-Off Security

Highest-risk class.

Recommended requirements:

```text
Dedicated permission

MFA aal2

Approval

Reason

Evidence

Audit
```

---

# 280. Cross-Client Transfer Security

Recommended:

```text
Disabled by default
```

If enabled:

```text
Explicit permission

Approval

MFA

Source/destination visibility

Audit
```

---

# 281. Vendor Overpayment

Backend automatically classifies excess into:

```text
Vendor Receivable
```

rather than permitting negative payable.

Security and accounting invariant aligned.

---

# 282. Negative Balance Protection

Database/domain rules prevent creating illegal financial state even from privileged UI actions.

---

# 283. Super Admin Philosophy

Avoid unrestricted:

```text
God Mode
```

for routine use.

Even privileged admins should use explicit audited workflows.

---

# 284. Break-Glass Account

Future enterprise option:

```text
Emergency privileged account
```

with:

```text
MFA

Restricted custody

Alert on use

Detailed audit
```

not normal daily account.

---

# 285. Security Incident Response

Minimum process:

```text
Identify affected credential/user

Disable/revoke access

Rotate secrets

Review audit

Assess financial actions

Restore safely

Document incident
```

---

# 286. Meta Token Leak

If suspected:

```text
Revoke/replace token

Check Meta asset activity

Rotate related secrets if necessary

Review sync/access logs
```

---

# 287. Supabase Secret Leak

Treat as critical because privileged key can bypass RLS.

Rotate/disable leaked key immediately. Supabase explicitly classifies secret/service-role credentials as elevated and server-only.

---

# 288. Database Credential Leak

Rotate DB credential.

Inspect DB logs/audit.

Assess data exposure or unauthorized writes.

---

# 289. User Account Compromise

```text
Deactivate/revoke sessions

Reset credentials

Review recent actions

Review approvals

Review exported data

Restore access after verification
```

---

# 290. Finance User Compromise

Additional review:

```text
Payments

Refunds

Settlements

Ownership transfers

Reversals

Write-offs
```

during compromise window.

---

# 291. Security Health Dashboard

Admin can see:

```text
Users without MFA

Inactive privileged accounts

Recent permission changes

Meta auth issues

Failed access attempts

Secret rotation age
```

without exposing secrets.

---

# 292. Security Alerts Severity

Example:

```text
CRITICAL:
Secret exposure
Cross-tenant access succeeded
Unauthorized ledger mutation

HIGH:
Repeated privilege abuse
Privileged user without required MFA

MEDIUM:
Repeated failed authorization
```

---

# 293. System Must Prefer Fail Closed

If authorization service cannot determine user permission:

```text
DENY
```

not:

```text
ALLOW
```

---

# 294. Authentication Provider Outage

Already-verified short-lived JWTs may continue to validate depending on architecture/key availability, but new login/refresh may fail.

Do not bypass auth because provider is down.

---

# 295. Authorization Database Outage

If backend cannot load current internal membership/permissions for a sensitive action:

```text
Reject action
```

---

# 296. Security vs Availability

For financial writes:

```text
Correct denial
>
unsafe availability
```

---

# 297. V1 Required Security Features

```text
Supabase Auth

Verified JWTs

Internal user membership

RBAC

Resource scopes

Tenant isolation

RLS defense in depth

MFA support

AAL checks for sensitive operations

Maker-checker

Secret encryption

Private Storage

API rate limits

CORS

Security headers

Audit

Idempotency

Financial DB locks

Secret redaction
```

---

# 298. Future Security Features

Possible:

```text
SSO / SAML

IP/device policies

Dedicated secret manager

Security Information and Event Management

Malware scanning

Break-glass administration

Hardware security keys

Fine-grained column encryption
```

---

# 299. Auth and Security Integrity Rules

System must enforce:

```text
1. Every protected request must have a cryptographically verified authenticated identity.

2. JWT decoding without signature verification must never authorize a request.

3. Internal user membership must remain separate from Supabase authentication identity.

4. A valid JWT for a deactivated internal user must not grant application access.

5. Authorization must follow deny-by-default.

6. Users receive only least privileges required for their work.

7. Roles must map to granular permissions rather than drive scattered hardcoded checks.

8. Resource scope must be validated independently from permission.

9. Tenant-owned data must always be scoped to the authenticated organization.

10. RLS should provide defense in depth but must not replace NestJS authorization.

11. Supabase secret/service-role credentials must never reach frontend code.

12. Browser code should use only publishable/low-privilege Supabase credentials.

13. Meta tokens and Meta app secrets must remain server-only.

14. Secrets must never appear in logs, queue payloads, URLs or audit records.

15. Meta tokens must be encrypted at rest.

16. Privileged users should use MFA.

17. High-risk financial/admin actions should support aal2 step-up authentication.

18. Maker-checker rules must be enforced server-side.

19. Users must not self-escalate roles or permissions.

20. CORS must use explicit trusted origins.

21. State-changing GET endpoints are forbidden.

22. Cookie-authenticated state changes require appropriate CSRF defenses.

23. Unknown authorization state must fail closed.

24. Financial command authorization must be revalidated against current database state.

25. Frontend permission hiding must never be treated as security.

26. Financial idempotency must prevent duplicate posting/replay.

27. Posted ledger records must not be editable or deletable by normal application flows.

28. Sensitive evidence files must remain private and permission-protected.

29. Exports must obey resource scopes and be auditable.

30. Cross-tenant access attempts must never reveal unauthorized data.

31. Workers must validate tenant/resource context even for internal queue messages.

32. Application containers must receive only secrets they actually need where feasible.

33. Production secrets must never be committed to source control.

34. A leaked credential must be rotated; deleting it from source code alone is insufficient.

35. Security-sensitive configuration changes must be audited.

36. Meta write functionality must remain disabled in V1 regardless of excess token permissions.

37. Financial write kill switches must fail closed.

38. Database constraints and locks must backstop application-level security and business validation.

39. Backups and exported reports must be protected as sensitive data.

40. Security testing must include authentication, authorization, tenant isolation, MFA and financial abuse scenarios.
```

---

# 300. Auth and Security Golden Rule

> **No user, browser, worker, integration or administrator should gain authority merely because they possess an ID, can reach an endpoint or hold a broad credential. Every sensitive action must be authenticated, tenant-scoped, permission-checked, resource-authorized, business-validated and auditable; every secret must remain confined to the smallest trusted boundary; and every financial mutation must fail closed whenever identity, authority or current state cannot be proven.**
