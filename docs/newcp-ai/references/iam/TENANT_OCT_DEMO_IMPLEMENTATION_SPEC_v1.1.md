# New CP — October 2026 Tenant Handling: User Grants, Active Session Context & Transaction RLS

**Version:** 1.1 (v0.9.7 developer handoff; supersedes tenant v1.0)  
**Date:** 26 October 2026  
**Authority:** The user's approved IAM decisions (D01–D13, M01–M04), IAM-HIER-001, and the stated October demo tenant design.  
**Status:** Developer-facing scope and recommended implementation contract. No live runtime/DB tests executed.  
**Supersedes:** Tenant implementation specification v1.0 and conflicting provisional tenant examples in earlier handoff materials only; existing service, F07, business, role and security requirements remain applicable.

## A. Decisions, assumptions and authority

**Approved business requirements:**
- Google Sign-In authenticates the employee. **No Google Groups for authorization.** PostgreSQL V3 IAM assigns internal users, roles, groups and tenant access; Casbin enforces permissions.
- Five access families: **CS, Ops, Finance, QC, Admin**. Senior/Manager roles inherit all verified subordinate permissions within the same family (IAM-HIER-001); exact legacy mappings still require discovery.
- **Demo tenant:** tenant ID `1`, labelled `3ddx.com`; **explicit internal user-to-tenant grant** is required. `@3ddx.com` is currently an **identity-provisioning eligibility condition**, not automatic tenant authorization.
- Demo has one authorized active tenant per session, no tenant switcher. Admin is restricted to explicitly authorized tenants and cannot bypass RLS solely by being Admin.
- Three live Google identities (CS, Ops, Admin); Finance/QC checked by automated fixtures. Multi-role membership and union are approved architecturally; multi-role tests deferred until after demo.
- Unassigned eligible Google user may be provisioned but gets no business access; restricted Pending Access UI and `403` from protected APIs.
- All five groups may open reports; **only Finance, QC and Admin** may export/download. More granular report data visibility is later phase; use sanitized demo data.
- Session idle timeout 30 minutes, maximum lifetime 8 hours, **configurable**. Internal role changes apply on subsequent protected requests; logout revokes the app session.

**Recommended implementation choices**, not further business decisions: read-only `GET /api/v1/session/context`, normalized `error.code`, central `withTenantTransaction`, and configuration names specified below. Developers must align proposed endpoints and DTOs with the current backend API/OpenAPI; no parallel endpoint if an equivalent already exists.

## B. October demo — IN SCOPE (mandatory)

| Area | Required demo behavior | Owners / evidence |
|---|---|---|
| Authentication | Google OIDC sign-in; validate identity; eligible `@3ddx.com` and explicitly approved demo users only | BE with FE redirect handling; verified account linking |
| Provisioning | Safely create or link internal user; no auto-tenant or auto-role; absent grants → Pending Access | BE, IAM/DB owner approval |
| Tenant assignment | Explicitly grant tenant `1` to three demo accounts in trusted IAM store; reject unassigned users | BE, Admin/DB owner |
| Authorization | Load active internal roles/capabilities incl. scoped Ops; Casbin checks every protected operation | BE |
| Frontend | Both React options consume the same current-session context and error contract; no tenant selection UI | Both FE teams |
| RLS | Normal DB app role, RLS active; set transaction-local tenant context before every tenant-scoped query/write | BE/DB owner |
| Service workflows | Orders, Models/Conversion, commercial edits incl. F07 Bill To and price subject to authorization and financial locks | BE/FE; F07 schema must be verified |
| Reporting | All five roles view reports; only Finance/QC/Admin export; server must enforce independently of UI | BE/FE; fixtures |
| Sessions | Configurable 30-min idle/8h max; role changes effective on subsequent protected requests; logout revokes | BE/FE |
| Audit & tests | Record successful protected changes and security-relevant denials; positive/negative and cross-tenant tests | BE/QA |

## C. OUT OF SCOPE / explicitly DEFERRED

- Automatic domain-to-tenant assignment or use of an email domain as a permission; **`@3ddx.com` is not a tenant grant**.
- External-email authorization lookup granting tenant(s) and group(s); only pre-approved demo identities may authenticate under the approved demo exception.
- Tenant switcher, multiple active tenants, tenant selection by frontend, future multi-tenant UI/flows.
- Google Groups synchronization, membership-derived role inference, or Google Group APIs (excluded rather than merely postponed for current design).
- Cross-tenant Super Admin and automatic Admin bypass across tenants.
- Per-report/per-column visibility, role-based field masking, refined exports policy beyond approved role restriction.
- Extra sensitive-action reauthentication, user-facing multi-role demo/testing, and full post-demo hierarchical role discovery beyond roles required by the three demo users. **The approved inheritance business rule remains in force for any verified hierarchical roles used now.**

**Guardrails NOT deferred:** RLS enforcement, denial of unauthorized cross-tenant access, role revocation, API authorization, safe provisioning, audit trails, report-export restriction, prevention of untrusted tenant headers, financial locks.

## B1. REQUIRED CLARIFICATION — USER AUTHORIZATION ≠ SESSION ACTIVE TENANT ≠ DB TRANSACTION CONTEXT

> **Approved business interpretation:** **Tenant eligibility is user-based**: the internal IAM assignment defines the tenant(s) a given employee is authorized to access. **Active tenant is session-based**: the application session identifies exactly one selected authorized tenant for the demo. **Effective database isolation is request/transaction-based**: each protected API operation resolves and verifies the tenant, then sets transaction-local PostgreSQL `app.tenant_id` for all RLS-governed SQL statements in that transaction.
>
> A session tenant is *context*, never independent proof of authorization. `tenant_id=1` in a config file is only a demo seed/test value, not a tenant grant. Being in the `@3ddx.com` email domain is identity-provisioning eligibility, not tenant authorization.

### Source and lifetime of each value

| Layer | Question answered | Authoritative source | Lifetime / handling |
|---|---|---|---|
| Google OIDC | Who is signing in? | Verified Google identity | Sign-in; no group or tenant authority |
| Internal user → tenant grants | Which tenant(s) is this user allowed to access? | PostgreSQL V3 IAM / approved tenant grant model (physical storage must be verified against deployed V3) | User-associated data, admin-managed; may be revoked |
| Active tenant | Which *already-authorized* tenant is this user currently working in? | Validated backend session state | One active tenant per session for October; never a standalone grant |
| Protected API request | Is the active tenant still authorized and is the requested action permitted? | Session + current IAM grants + Casbin + resource context | Re-evaluate on every protected request; role/tenant revocations affect the next request |
| PostgreSQL transaction | What tenant may this SQL transaction see or modify? | Server-verified active tenant, set as local `app.tenant_id` | Transaction only; reset automatically when it ends; PostgreSQL RLS enforces row access |

### Mandatory invariants

1. **An IAM user grant must pre-exist before protected access.** Google sign-in and a valid application session alone are insufficient. The demo's 3 assigned identities (CS, Ops, Admin) are explicitly granted tenant 1. A newly provisioned but unassigned user gets *Pending Access* and protected API `403`.
2. **At login/session initialization**, the backend obtains authorized tenant assignments, chooses the single permitted demo tenant only after validating a grant, and persists that *validated* active tenant in the application session. Never `session.tenantId = config.DEMO_SEED_TENANT_ID` without grant validation.
3. **At every protected request**, validate that (a) session is active, (b) user is active, (c) the session's active tenant is still authorized according to current grants, and (d) current Casbin permissions allow the resource/action/service type. Do not accept a request's `tenantId` as the source of authority. If an access grant was removed, invalidate/clear the active tenant context as appropriate and return `403 TENANT_ACCESS_DENIED` or `TENANT_NOT_ASSIGNED`.
4. **At each tenant-scoped DB unit of work**, start a Drizzle transaction, set `app.tenant_id` transaction-locally, and execute every tenant-scoped read/write using the same `tx`; transaction close prevents pooled connection contamination. A session cookie value does NOT set the PostgreSQL connection's tenant setting.
5. **For concurrent sessions**, each is independently bound to its own verified active tenant. They share underlying user grants but do not create new grants; a grant revocation invalidates access through all relevant active sessions on subsequent protected requests.
6. **Do not hardcode tenant authorization into `iam.users.tenant_id` without reviewing the V3 model.** A user may be granted multiple tenants in a future phase. The approved model is user-to-tenant eligibility + one active tenant per session, independent of the eventual normalized assignment table or authorized IAM service.

### Worked demo examples

- **CS employee**: Internal user A has explicit tenant 1 assignment. Google sign-in succeeds. Session `activeTenant=1` is stored after validating the grant. `PATCH /items/:id` rechecks CS permission, the grant and service lock; transactional `app.tenant_id=1` applies RLS. Authorized changes succeed and are audited.
- **Pending employee**: Approved Google email is provisioned, but there is no tenant assignment or role. Session has `activeTenant=null`; frontend shows Pending Access; protected API responds `403`, with no fallback to tenant 1.
- **Revoked grant**: User A's tenant 1 assignment is removed while signed in. The next protected request revalidates grants and returns `403`. The previous session value `activeTenant=1` cannot override revocation.
- **Tenant 2 probe**: User A sends `X-Tenant-Id: 2`, `tenantId:2`, or an object ID from a tenant-2 fixture. The backend rejects untrusted tenant selectors; tenant-2 data is inaccessible under RLS. No tenant switching is enabled.

### Configuration boundary

`DEMO_SEED_TENANT_ID=1` may initialize approved demo data/assignments **only in controlled seed tooling**. Normal login middleware, context generation, and request guards read the persisted **user grant**, not this variable. `TENANT_SWITCHING_ENABLED=false` hides/disables tenant selection; it does not make tenant 1 universally accessible. The session's `activeTenant` is authoritative only as a **validated selection**, not an authorization decision by itself. There must be no setting that turns off grants, Casbin, or RLS.

## D. Demo request/response contract — FRONTEND

**D1. On page load or after Google callback:**
1. Complete the authorized Google OIDC flow through backend/session handling. Frontend does not parse Google Groups for roles or tenants.
2. Call current-context endpoint (illustrative name `GET /api/v1/session/context`) **with authenticated application session only** (prefer HttpOnly Secure SameSite session cookie, appropriate CSRF controls for mutations; actual transport must match approved current app architecture).
3. Backend derives the active tenant from the validated user IAM grant and session selection; only then responds with tenant `id=1`, authorized role identifiers, capability flags and user/session status; do not expose private database role names, tokens, other tenants or security internals.
4. If `AUTHORIZED`, display normal workspace and its tenant label. For `PENDING`, show Pending Access with no business features. For `401`, redirect to sign-in.
5. Cache UI capability flags only for display. **Always rely on server authorization**; refresh context on app load, role-change notification, and after `403` with stale capabilities. No browser-local authority.

**D2. All ordinary business API requests:** `GET /orders`, `POST /orders/{id}/items`, `PATCH /items/{id}`, `GET /reports` etc. MUST send normal app authentication, payload, `If-Match` for versioned writes where required. **Do not supply tenant ID in query strings, request bodies or `X-Tenant-Id` headers for the demo.** If a DTO contains `tenant_id` for another reason, backend must reject conflicting/untrusted values.

**D3. Browser response handling:**
- `200/201`: refresh authoritative data; show server-resolved tenant state and permissions.
- `401 AUTHENTICATION_REQUIRED` / expired session: clear client auth view and initiate Google sign-in; preserve safe destination only.
- `403 ACCESS_NOT_ASSIGNED` or `TENANT_NOT_ASSIGNED`: Pending Access / contact Admin; no retries with invented tenant.
- `403 PERMISSION_DENIED` or `TENANT_ACCESS_DENIED`: permission-denied message, optionally refresh context; no attempt to work around with another tenant.
- `404 RESOURCE_NOT_FOUND`: generic unavailable record; do not disclose existence of other tenants' records.
- `409 FINANCIAL_LOCK_CONFLICT`: locked-state message; `412` stale ETag: reload/reconcile; `428` missing If-Match: API integration error; `422` business validation: show field errors.
- Display tenant label as an informational badge/heading only; **no editable tenant control**.

**Illustrative authorized context (proposed shape; reconcile with current API):**
```json
{
  "user": {"id":"internal-user-uuid", "displayName":"Demo CS"},
  "accessStatus":"AUTHORIZED",
  "activeTenant":{"id":1,"label":"3ddx.com"},
  "roles":["CS"],
  "capabilities":["orders:read","models:update","reports:read_all"],
  "tenantSwitchingEnabled":false
}
```
**Illustrative pending context:** `{"accessStatus":"PENDING", "activeTenant":null, "roles":[], "capabilities":[]}`. Protected business APIs still return `403`.

**Illustrative error envelope (existing v0.9.5 recommended convention):**
```json
{"error":{"code":"TENANT_ACCESS_DENIED","message":"You are not authorized for this resource","requestId":"req-example"}}
```
Do not expose alternate tenant IDs, row details or permission internals in error messages.

## E. Backend design and transaction flow

For each authenticated protected request:
1. Validate server-side application session; resolve a **stable internal `iam.users` identity** from Google OIDC subject, not just a mutable email string; account may be provisioned only by a trusted approved process.
2. Check account active/not revoked and get current internal roles/permissions from V3 IAM. Resolve verified same-family role inheritance; do not infer hierarchy edges from titles alone.
3. Read the session-selected active tenant and revalidate it against **current user-to-tenant grants**. In the demo the validated choice is tenant `1` for explicitly assigned employees. Missing/revoked/mismatched grant = fail closed (403), even with valid Google login; neither session nor config substitutes for the grant.
4. Run Casbin `enforce` using internal user/role, tenant, resource, action and applicable service type, then check business state (price/Bill To locks, etc.). `Admin` is still tenant scoped.
5. Invoke a *single reusable transactional database access helper* that executes `SELECT set_config('app.tenant_id', :authorizedTenantId, true)` **inside** the transaction. Every tenant-scoped SQL statement within this unit must use its `tx`, never the root pool/DB handle.
6. PostgreSQL V3 tenant RLS independently filters eligible rows and rejects unauthorized writes. Validate `WITH CHECK` policies as well as `USING`, and the actual app role's behavior. If an operation touches multiple tenant tables, keep it within the same context/transaction.
7. Return minimal data and consistent error codes, audit allowed changes and security-relevant denials (prefer a suitable authorized audit channel that survives rejected business transactions).

**Illustrative Drizzle TypeScript (adapt to actual DB initialization/schema):**
```ts
import { sql } from 'drizzle-orm';

export async function withTenantTransaction<T>(
  authorizedTenantId: number,
  work: (tx: any) => Promise<T>,
): Promise<T> {
  // Caller MUST derive the tenant from authenticated IAM grants.
  if (!Number.isSafeInteger(authorizedTenantId) || authorizedTenantId <= 0) {
    throw new Error('Missing verified tenant');
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${String(authorizedTenantId)}, true)`);
    return work(tx);
  });
}
```
The application SHOULD use a strong typed `tx` rather than `any`; the sample is not deployable without integration. `set_config(..., true)` lasts only for the current DB transaction. **Never use `SET SESSION app.tenant_id` on pooled application connections**.

**IAM bootstrap complication:** some identity and grant lookup queries happen **before** a tenant context exists. Implement these only via an approved minimal trusted IAM access path/function/role with no unrestricted access to tenant-owned business data. Do not solve the earlier `iam.users INSERT` permission issue by broadly granting table write privileges to `threeddx_app`; propose a scoped, audited provisioning operation for DB-owner review.

**DB gate:** verify `threeddx_app` is not superuser, `BYPASSRLS` or a table-owner bypass; verify `row_security_active('orders.orders'::regclass)` when connected as the app, `core.fn_current_tenant()` and actual service/report RLS. Grant appropriate app role rights needed for normal operations, but never migrator/bypass role membership. The new F07 SQL/schema must be installed and reconciled before demonstrating payer edits.

## F. Configuration-first demo implementation

**Prefer one typed central configuration module** reading environment variables or an approved server config file. The `.ts` module should *read/validate* configuration, not act as an unrelated second set of hardcoded values. Deploy values per environment; commit only `.example.env`; keep credentials out of source control/AI materials.

| Proposed variable | Demo value | Interpretation |
|---|---|---|
| `AUTH_PROVIDER` | `google` | Google authentication (not Google Groups) |
| `LOGIN_ALLOWED_DOMAINS` | `3ddx.com` | Provisioning eligibility check, NOT tenant grant |
| `IAM_ROLE_SOURCE` | `postgres` | PostgreSQL V3 IAM authority |
| `TENANT_SWITCHING_ENABLED` | `false` | No tenant picker |
| `DOMAIN_TENANT_AUTO_ASSIGN_ENABLED` | `false` | Disallow domain-derived grants |
| `DEMO_SEED_TENANT_ID` | `1` | Used ONLY by approved seed/test setup; cannot set an active session tenant or grant access |
| `SESSION_IDLE_TIMEOUT_MINUTES` | `30` | Approved configurable idle expiration |
| `SESSION_MAX_LIFETIME_HOURS` | `8` | Approved configurable absolute expiration |
| `AUTHZ_CHECK_ON_EVERY_REQUEST` | `true` | Current effective capability policy |
| `DB_RLS_REQUIRED` | `true` | Fail startup/test if app RLS assumptions are not met |

**Business permissions, including FINANCE/QC/ADMIN report export, MUST come from the approved PostgreSQL IAM/Casbin policy, not mutable environment variables. No config toggle may bypass authorization or RLS.** In particular, `DEMO_SEED_TENANT_ID=1` must never be used as default in request middleware, nor inserted into sessions merely because a valid Google email is from `3ddx.com`. A missing config or grant should fail startup/request with a controlled error rather than silently falling back to tenant 1.

**Central config validation on startup:** reject zero/negative session limits; undefined authentication method; tenant auto-assignment enabled; or RLS enforcement disabled. Read feature flags from the backend and expose only safe flags to frontend through the context endpoint. Both React apps must share behavior, without duplicating tenant assignment logic.

## G. API error / frontend response alignment

| Event | HTTP | Proposed `error.code` | Frontend action |
|---|---|---|---|
| Missing/invalid/expired/revoked app session | 401 | `AUTHENTICATION_REQUIRED` | Sign-in |
| Authenticated but no role | 403 | `ACCESS_NOT_ASSIGNED` | Pending Access |
| Explicit tenant assignment missing | 403 | `TENANT_NOT_ASSIGNED` | Pending Access/contact Admin |
| Requested tenant not authorized | 403 | `TENANT_ACCESS_DENIED` | Access denied |
| Role incapable of action | 403 | `PERMISSION_DENIED` | Access denied |
| Resource inaccessible; existence should be hidden | 404 | `RESOURCE_NOT_FOUND` | Generic not-found |
| Financially locked attempted change | 409 | `FINANCIAL_LOCK_CONFLICT` | Display locked and refresh |
| Stale `If-Match` | 412 | `PRECONDITION_FAILED` | Refresh/reconcile |
| Required `If-Match` omitted | 428 | `PRECONDITION_REQUIRED` | Fix request integration |
| Business validation | 422 | `BUSINESS_VALIDATION_FAILED` | Show field-level errors |

Codes are recommended stable application identifiers until merged into approved OpenAPI; the HTTP semantics and no data leaks are mandatory. Avoid a `400` or `403` full of internal stack traces.

## H. Acceptance and release gates

1. Three real Google demo identities, internal active accounts, and persistent user-based tenant=1 grants: CS, Ops, Admin; sessions record the tenant as active only *after* checking these grants; report capability settings match approved matrix.
2. On tenant 1: authorized service operations work (Models/Conversion and commercial edits), respecting role scopes and financial locks.
3. Unassigned Google account cannot access business APIs or receive an inferred tenant; sees Pending Access.
4. Expired/revoked session → 401; role removal takes effect on next protected request.
5. CS/Ops cannot export reports; Finance/QC/Admin can through policy tests/fixtures; all five have view access.
6. An account assigned only tenant 1 cannot fetch/update/insert tenant-2 data; use a synthetic or isolated second-tenant fixture; **no additional live Google identity needed**.
7. App DB role is subject to RLS; tenant-less DB reads fail closed; transaction-scoped setting does not leak through pooling or concurrent requests.
8. Frontend Option A and Option B call the same session-context/API contracts, hide unauthorized actions, and show identical logical error states.
9. Dynamic client-supplied `tenantId`/`X-Tenant-Id` is ignored/rejected for demo; no tenant-picker UI.
10. Test role hierarchy only for verified grades used now. Multi-role tests after demo as agreed, but schema keeps many-to-many support.
11. Record security-relevant denials in suitable audit sink; transaction rollbacks must not erase required denial logs.
12. Record PASS/FAIL/NOT_RUN with reproducible evidence; no claim of production/data-migration approval solely because demo isolation passes.

**No full integration tests were performed while preparing this document.** Developers/DB owner must execute these gates on their actual repositories and restored V3 database.

## I. Responsibilities and handoff

| Role | Required next action |
|---|---|
| Backend developer | Audit existing auth/IAM/Drizzle/RLS code; implement tenant resolver + context endpoint + centralized transaction helper and errors; record test results |
| Both frontend developers | Consume context endpoint; no tenant ID control; capability-based UI presentation; handle 401/403/404/409/412/422 consistently |
| DB/Schema owner | Confirm approved grants, IAM provisioning mechanism, tenant/user assignment persistence, RLS policy and F07 schema readiness |
| Testing | Run synthetic tenant isolation/deny tests, role-export restrictions and both frontend variants |
| Technical Lead/Product | Validate business alignment, review deviations and accept demo evidence; deferred features remain out of scope |

### Technical source references (official)
- PostgreSQL setting parameters: https://www.postgresql.org/docs/current/config-setting.html
- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Drizzle transaction API: https://orm.drizzle.team/docs/transactions
