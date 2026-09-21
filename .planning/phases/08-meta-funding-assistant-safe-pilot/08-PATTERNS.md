# Phase 8: Meta Funding Assistant Safe Pilot - Pattern Map

**Mapped:** 2026-09-18
**Files classified:** 20 logical files/groups
**Analogs found:** 17 / 20
**Research input:** `08-RESEARCH.md` is not present; mapping uses `08-CONTEXT.md` and current source.

## Repository Tracking Gate

The project resolves to parent Git root `C:/Users/pc/Documents/GitHub`, but `git ls-files` returns no entries for this project's source and `git status` reports the Phase 8 directory as untracked. Therefore no on-disk project analog currently passes the mapper's tracked-source gate. The paths below are the canonical on-disk implementation patterns, but the planner must first ensure this project is tracked (or is made a nested repository) before relying on them for execution/commits.

## File Classification

| New/Modified File | Role | Data Flow | Closest Existing Analog | Match Quality |
|---|---|---|---|---|
| `packages/database/prisma/schema.prisma` | model/migration source | relational CRUD + append-only events | existing `FundLot`, `AuditLog`, `ReconciliationSnapshot` models in same file | exact role; tracking gate blocked |
| `packages/shared/src/enums/index.ts` | shared enum contract | transform | existing financial/status enums in same file | exact role; tracking gate blocked |
| `packages/shared/src/schemas/index.ts` | shared validation contract | request-response | shared Zod schemas + API DTO classes | role match; tracking gate blocked |
| `packages/shared/src/types/index.ts` | shared API types | request-response | existing dashboard/asset DTOs in same file | exact role; tracking gate blocked |
| `apps/api/src/modules/auth/session.*` | auth service/model | request-response + CRUD | `auth.service.ts` and `AuthContext.tsx` | partial; current token scheme must be replaced |
| `apps/api/src/common/auth.guard.ts` | guard/middleware | request-response | no guard exists | no analog |
| `apps/api/src/common/current-actor.decorator.ts` | request context utility | request-response | no decorator exists | no analog |
| `apps/api/src/modules/meta-funding/dto/*.ts` | DTO/validation | request-response | `users/dto/create-user.dto.ts` | exact role; tracking gate blocked |
| `apps/api/src/modules/meta-funding/meta-funding.controller.ts` | controller | request-response | `meta.controller.ts`, `users.controller.ts` | exact role; tracking gate blocked |
| `apps/api/src/modules/meta-funding/meta-funding.service.ts` | domain service | transactional CRUD + event-driven state transitions | `fund-allocation.service.ts` | strong role match; tracking gate blocked |
| `apps/api/src/modules/meta-funding/meta-funding.module.ts` | Nest module | dependency wiring | `allocations.module.ts`, `meta.module.ts` | exact role; tracking gate blocked |
| `apps/api/src/modules/meta/meta.service.ts` | external provider service | request-response + sync | existing Meta sync methods | exact modification target; tracking gate blocked |
| `apps/api/src/modules/reconciliation/reconciliation.service.ts` | verification service | batch/request-response | existing targeted snapshot calculation | role match; tracking gate blocked |
| `apps/api/src/app.module.ts` / `main.ts` | app config | dependency wiring/request ingress | existing module list, global pipe and CORS | exact modification targets; tracking gate blocked |
| `apps/web/src/lib/api.ts` | API client | request-response | existing Axios client/functions | exact role; tracking gate blocked |
| `apps/web/src/features/meta-funding/MetaFundingPage.tsx` | page/component | CRUD workspace | `TeamManagementPage.tsx`, `MetaAssetsPage.tsx` | strong role match; tracking gate blocked |
| `apps/web/src/App.tsx` / `components/Sidebar.tsx` | route/navigation | client routing | existing protected/admin routes and nav items | exact modification targets; tracking gate blocked |
| `apps/browser-extension/manifest.json` | extension config | browser permissions | none | no analog |
| `apps/browser-extension/src/background.ts` | MV3 service worker | event-driven + durable retry | API client conventions only | partial |
| `apps/browser-extension/src/content.tsx` + detector modules | content script/component | DOM event-driven/transform | no browser/DOM observer implementation | no analog |

## Pattern Assignments

### Prisma funding models and append-only events

**Analog:** `packages/database/prisma/schema.prisma`

Use the existing tenant ownership, minor-unit money, relation, mapping, and compound uniqueness conventions:

```prisma
// lines 435-453
model FundLot {
  id                  String   @id @default(uuid())
  organizationId      String   @map("organization_id")
  lotCode             String   @map("lot_code")
  initialAmountMinor  BigInt   @map("initial_amount_minor")
  currentAmountMinor  BigInt   @map("current_amount_minor")
  status              String   @default("AVAILABLE")
  currencyCode        String   @default("INR") @map("currency_code")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@unique([organizationId, lotCode])
  @@map("fund_lots")
}
```

```prisma
// lines 550-565
model AuditLog {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  actorUserId    String?  @map("actor_user_id")
  action         String
  entityType     String   @map("entity_type")
  entityId       String   @map("entity_id")
  previousState  Json?    @map("previous_state")
  newState       Json?    @map("new_state")
  createdAt      DateTime @default(now()) @map("created_at")
}
```

Apply to `FundingRequest`, `ExtensionDevice`, `WebSession`, `ExtensionSession`, `MetaTopupSession`, `MetaTopupEvent`, and `TopupReservation`. Every tenant-owned record carries `organizationId`; every money field is `BigInt` minor units; every external/idempotency identifier gets an organization-scoped unique constraint. `MetaTopupEvent` is create-only and ordered by a per-session sequence plus timestamp. Reservations are separate records, not mutations that reduce `FundLot.currentAmountMinor` during the pilot.

### DTO validation

**Analog:** `apps/api/src/modules/users/dto/create-user.dto.ts`

```typescript
// lines 1-18
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
```

Create class-validator DTOs for pairing, request creation/approval, top-up detection/mapping/events, review, pagination, and device revoke. Preserve global `ValidationPipe({ transform: true, whitelist: true })` from `apps/api/src/main.ts:19`. Use string wire values for minor units and convert with `BigInt` in the service; do not accept JavaScript floating-point rupees.

### Auth and tenant context

**Current analog to replace:** `apps/api/src/modules/auth/auth.controller.ts:16-29` and `auth.service.ts:112-128`.

```typescript
// current unsafe pattern; do not copy
const parts = token.split('_');
const userId = parts[2];
return this.authService.getCurrentUser(userId);
```

```typescript
// current unsafe token; do not copy
token: `mb_token_${user.id}_${Date.now()}`
```

Phase 8 needs a new reusable Nest guard and actor decorator. The guard hashes the opaque bearer token, loads a non-revoked/non-expired session with user and organization, checks active user/device status, and places `{ userId, organizationId, role, sessionType, deviceId? }` on the request. Controllers derive tenant and actor only from this context. Never copy controller query/body `organizationId` or `userId` patterns such as `meta.controller.ts:12-17`.

Web sessions follow the existing Axios bearer attachment at `apps/web/src/lib/api.ts:17-31`, but AuthContext must validate `/auth/me` on startup instead of treating localStorage presence as authentication (`AuthContext.tsx:15-29,51-63`). Extension credentials remain separate from web credentials and are stored only in `chrome.storage.local`.

### Meta Funding controller/module

**Analogs:** `apps/api/src/modules/meta/meta.controller.ts`, `apps/api/src/modules/allocations/allocations.module.ts`

```typescript
// meta.controller.ts lines 5-17
@ApiTags('Meta Assets')
@Controller('api/v1/meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('connections')
  @ApiOperation({ summary: 'Get Meta connections hierarchy' })
  async getConnections(...) {
    return this.metaService.getConnections(...);
  }
}
```

```typescript
// allocations.module.ts lines 6-11
@Module({
  imports: [LedgerModule],
  controllers: [FundAllocationController],
  providers: [FundAllocationService],
  exports: [FundAllocationService]
})
export class AllocationsModule {}
```

Keep controllers thin: decorated route, validated DTO, authenticated actor, service call. `MetaFundingModule` imports `MetaModule`, `ReconciliationModule`, and `AuditModule`; it must not import or call `LedgerModule` in the pilot. Register it in `AppModule` beside the existing domain modules.

### Funding lifecycle, reservations, and idempotency

**Analog:** `apps/api/src/modules/allocations/fund-allocation.service.ts:16-84,90-138`

```typescript
const orgId = await this.prisma.resolveOrgId(organizationId);

return this.prisma.$transaction(async (tx) => {
  const wallet = await tx.clientWallet.findUnique({ where: { clientId } });
  if (!wallet || wallet.balanceMinor < amountMinor) {
    throw new BadRequestException('Insufficient balance in client wallet');
  }
  // related writes occur inside one transaction
});
```

Copy the transaction boundary and Nest exceptions, but strengthen every lookup with authenticated `organizationId`. Within one transaction: validate request/lot/account ownership and currency, sum active reservations, enforce available amount, create or reuse the idempotent session, create reservation, append event, and write AuditLog. Use compound unique keys for pairing claim, request reference, idempotency key, and `(sessionId, sequence)`; on unique collision return the existing canonical result rather than creating a duplicate.

State transitions must be explicit allow-lists in the service. Meta UI success changes operational state to `UI_OBSERVED` and creates a review item/event only. Review confirmation may mark the observation verified and release/confirm its reservation, but cannot call `LedgerService.postTransaction`.

### Meta account resolution and targeted verification

**Analog:** `apps/api/src/modules/meta/meta.service.ts:105-151`

```typescript
return this.prisma.adAccount.findMany({
  where: whereClause,
  include: {
    businessPortfolio: true,
    fundLots: true,
    userAccess: { include: { user: { select: { id: true, name: true } } } }
  },
  orderBy: { name: 'asc' }
});
```

Resolve the URL-derived external ID using `(organizationId, metaAdAccountId)`, then verify the actor's `UserAdAccountAccess`. Store URL-detected, visible-context-detected, and user-selected account IDs separately. High confidence requires exact URL/visible agreement; mismatch blocks mapping.

Targeted verification should reuse Meta provider/sync logic but expose a single-account refresh method rather than calling full `syncMetaAssets`. Follow reconciliation's compare-and-persist shape (`reconciliation.service.ts:12-62`) to create a fresh observation/snapshot and append verification events. Do not set `ledgerBalanceMinor` from Meta balance for this workflow and do not infer financial confirmation from UI text.

### Audit and safe logging

**Analog:** `apps/api/src/modules/users/users.service.ts:102-116`

```typescript
await this.prisma.auditLog.create({
  data: {
    organizationId: orgId,
    actorUserId: newUser.id,
    action: 'ADMIN_CREATE_USER',
    entityType: 'USER_PROFILE',
    entityId: newUser.id,
    newState: { name: newUser.name, email: newUser.email, role: newUser.role }
  }
});
```

Write audit records in the same database transaction as sensitive state changes. Event metadata must be allow-listed fields only: route category, detector version, confidence signals, sanitized account IDs, and state transition. Never persist Meta access tokens, opaque session secrets, pairing secrets, QR payloads, page HTML, screenshots, payment credentials, or raw DOM text.

### Web API, workspace, routing, and navigation

**Analogs:** `apps/web/src/lib/api.ts`, `TeamManagementPage.tsx`, `App.tsx`, `Sidebar.tsx`

```typescript
// api.ts lines 17-31
export const apiClient = axios.create({ baseURL: '/api/v1' });
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

```typescript
// TeamManagementPage.tsx lines 41-64
const { data: users = [], isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetchUsersApi()
});
const createUserMutation = useMutation({
  mutationFn: createUserApi,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
});
```

Use one `MetaFundingPage` workspace with tabs for Requests, Activity/Review, and Devices. Use TanStack Query/mutations and query invalidation rather than manual duplicated loading state. Reuse the table/overflow approach from `TeamManagementPage.tsx:160-300`, but follow current design direction: sentence case, sans-serif labels, tabular numerals only for money/IDs, subtle row separators, and borders only around structural surfaces.

Register `/meta-funding` in `App.tsx:79-90` and a corresponding Sidebar item in `Sidebar.tsx:26-35`. UI role checks are presentation only; API authorization remains authoritative.

### Browser extension

No extension analog exists. Create a plain Vite/TypeScript MV3 workspace under `apps/browser-extension`, reusing monorepo package conventions and shared types but no extension framework.

- `manifest.json`: minimum permissions (`storage`, `tabs` only if required), approved Meta billing host matches, and the exact ADS Control HTTPS origin in `externally_connectable`; no broad `<all_urls>`.
- Service worker: central API client, credential refresh, heartbeat, and an idempotent FIFO retry queue in `chrome.storage.local`; retry network/5xx with bounded exponential backoff, stop/re-auth on 401/403.
- Content script: URL parsing first, scoped `MutationObserver` second, visible dialog/account/amount/QR signals third. Emit normalized observations, not DOM blobs.
- Overlay: mount into a Shadow DOM root, require confirmation for medium/low confidence, lock high-confidence exact matches, and block all URL/visible mismatch states.
- Detector rules: bundled defaults plus backend-delivered declarative JSON; never download or execute JavaScript.

## Shared Patterns

### Tenant isolation

Existing services commonly call `PrismaService.resolveOrgId`, but its fallback behavior (`prisma.service.ts:23-63`) is unsuitable for extension endpoints. All Phase 8 guarded paths require actor-derived organization ID and every query/update must include that tenant scope or first load and compare it before mutation.

### Money

Use `BigInt` minor units end to end, matching `FundLot` and Ledger models. JSON serialization already converts BigInt to strings in `apps/api/src/main.ts:6-9`; shared API contracts should declare money as strings. INR is the only accepted pilot currency.

### Error handling

Services use Nest `BadRequestException`, `NotFoundException`, `ConflictException`, and `UnauthorizedException`; controllers allow Nest's global exception handling to shape responses. Do not catch and suppress domain errors. Frontend mutations display the API `message`; list queries need explicit error states instead of silently converting security/server failures to empty arrays.

### CORS and secrets

Replace `origin: '*'` in `apps/api/src/main.ts:14-18` with an environment-driven allow-list for the web origin and extension origin. Remove source fallback secrets such as `META_APP_SECRET` in `meta.service.ts:520-524`; secrets come only from environment/secret storage. Never log access tokens or complete Meta responses containing secrets.

### Testing

Follow `apps/api/test/ledger.spec.ts` for current `node:test` + `node:assert` style. Add service-level tests with mocked Prisma transactions for session expiry/revocation, tenant isolation, account mismatch, reservation arithmetic, valid/invalid transitions, idempotent retries, duplicate success, cancellation and expiry. Extension detector logic must be pure functions tested against sanitized HTML fixtures; queue tests cover restart and offline replay.

## No Analog Found

| File/Area | Role | Data Flow | Guidance |
|---|---|---|---|
| Nest auth guard/current actor decorator | middleware/utility | request-response | Implement as new infrastructure before Phase 8 routes; do not extend manual header parsing. |
| MV3 manifest/service worker lifecycle | config/runtime | event-driven | Follow Chrome MV3 APIs and keep permissions narrow; no project precedent. |
| Meta DOM detector + Shadow DOM overlay | detector/component | DOM event-driven | Isolate selectors/rules from UI, test against fixtures, and fail closed on ambiguity. |

## Planner Warnings

1. Security hardening is a prerequisite, not a follow-up: current unsigned bearer tokens and user/org query parameters cannot secure extension access.
2. Existing UI role checks do not authorize APIs; introduce backend guards before exposing funding/device/review routes.
3. Current `MetaService` stores token material in `tokenSecretReference` and contains a source fallback app secret; Phase 8 must not propagate either pattern.
4. Pilot top-up review must never invoke the ledger posting analog. Ledger code is included only to document the boundary.
5. Add indexes for operational queues: funding request status, device owner/status, top-up session organization/status/createdAt, event session/sequence, reservation lot/status/expiresAt, and review status.

## Metadata

**Analog search scope:** `apps/api/src`, `apps/api/test`, `apps/web/src`, `packages/database`, `packages/shared`
**Primary analogs read:** auth, users, Meta, allocations, ledger, reconciliation, audit, app routing/API, team/meta UI
**Pattern extraction date:** 2026-09-18
**Git status note:** source analogs exist on disk but do not currently pass `git ls-files` from the detected parent repository.
