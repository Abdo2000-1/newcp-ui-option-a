# New CP v0.9.7 Tenant Context Integration Specification

**Status:** Reference & Engineering Policy  
**Version:** v0.9.7 (Supersedes v0.9.6 for tenant handling only)  
**Date:** 26 October 2026  
**Applicability:** New CP React Option A & Backend Integration Boundary  

---

## 1. Executive Summary & Precedence

This document captures the approved v0.9.7 tenant-handling clarification established in the developer handoff package (`NewCP_Approved_IAM_Developer_Handoff_v0.9.7_2026-10-26`).

### Precedence Hierarchy:
1. **v0.9.7 supersedes v0.9.6 only for tenant handling.** The v0.9.6 tenant implementation specification v1.0 has been archived under `docs/newcp-ai/archive/superseded_v0.9.6_tenant_refs/` for audit and traceability.
2. **v0.9.5 IAM baseline remains fully binding:**
   - 5 approved business access families: CS, OPS, FINANCE, QC, ADMIN. No CP role.
   - Senior/Manager same-family transitive inheritance (IAM-HIER-001).
   - Google Sign-In authenticates identity only (no Google Groups for authorization).
   - Report viewing/export separation (Finance, QC, and Admin export; all five view).
   - F07 service-level payer architecture and Q-B8 through Q-B15 decisions remain intact.
3. **No product source code, database migrations, ETL, or deployment** is performed by this documentation update.

---

## 2. Core Architectural Invariant: The Three-Layer Separation

To maintain strict clinical, financial, and multi-tenant security, the system enforces complete separation between three distinct layers. Never use one layer as a replacement for another:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User Authorization Layer (PostgreSQL V3 IAM)                             │
│    - Authoritative source: iam.users, iam.roles, iam.user_roles, grants    │
│    - Evaluates: Which tenant(s) is this user permitted to access?           │
│    - Grants are managed by Tenant Admins; revocations take immediate effect │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Validated at login & per-request
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Active Session Context Layer (Backend Application Session)               │
│    - Stores: Exactly ONE active tenant ID after validating user's grant     │
│    - Session context is read-only for the client; it is NOT authorization   │
│    - Revoked grants invalidate session tenant context on subsequent request │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Injected into DB unit of work
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Request & Transaction Enforcement Layer (Database Transaction & RLS)     │
│    - Rechecks: Current user grant + Casbin permissions on EVERY request    │
│    - Execution: Backend executes `SELECT set_config('app.tenant_id', ...)` │
│      strictly transaction-locally (`is_local = true`)                       │
│    - PostgreSQL Row-Level Security (RLS) filters rows and rejects writes   │
│    - Connection pool contamination is prevented by transaction scoping     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Layer Descriptions:

1. **User Authorization Layer:**
   - PostgreSQL V3 IAM user-to-tenant grants determine which tenants the employee may access.
   - `@3ddx.com` email domain is strictly an **identity-provisioning eligibility condition**, NOT a tenant grant.
   - Google Sign-In authenticates identity only. Google Groups must NEVER be used for authorization or role mapping.
2. **Active Session Context Layer:**
   - The backend session stores one active tenant only after validating the user's explicit grant.
   - If a user has no tenant grant, the session has `activeTenant: null` and access status is `PENDING`.
   - The session tenant is an informational selection, not an authorization proof.
3. **Request/Transaction Enforcement Layer:**
   - Every protected request revalidates the current grant and Casbin permissions.
   - The backend sets PostgreSQL transaction-local `app.tenant_id` via `set_config('app.tenant_id', :tenantId, true)` inside the database transaction (`tx`).
   - `SET SESSION app.tenant_id` on pooled connections is strictly prohibited to prevent connection pool cross-talk.
   - PostgreSQL RLS enforces row-level isolation independently of application logic.

---

## 3. Non-Negotiable Engineering Constraints

1. **Google Sign-In authenticates identity only:** No Google Groups, group claims, or external email lookups may grant roles or tenant access.
2. **`@3ddx.com` is provisioning eligibility only:** It does not grant tenant access. Unassigned `@3ddx.com` users receive `PENDING` status and `403 ACCESS_NOT_ASSIGNED`.
3. **`DEMO_SEED_TENANT_ID=1` is fixture/seed configuration only:**
   - It must NEVER be used as a login, session, middleware, or API authorization fallback.
   - Never hardcode `tenantId: 1` as a default grant in frontend or backend code.
   - Never introduce `DEFAULT_TENANT_ID=1` or `ACTIVE_TENANT_ID=1`.
4. **No client-controlled tenant selection:**
   - Do NOT add a tenant selector, tenant dropdown, or tenant switcher in the UI.
   - Do NOT accept client-supplied `tenantId` in request query strings, bodies, or `X-Tenant-Id` headers as authorization.
   - Any untrusted client-supplied tenant field conflicting with backend session context must be rejected with `403 TENANT_ACCESS_DENIED`.
5. **Frontend role:**
   - Frontend consumes backend-provided session context only.
   - Frontend displays the validated active tenant as read-only information (badge/label).
   - Frontend capability gating is for UX only (hiding/disabling actions). True authorization resides on the server.
   - Logout revokes the application session and clears all client tenant/user state.
6. **Revocation propagation:**
   - An existing session `activeTenant=1` cannot override a revoked grant. On the next protected request, the backend revalidates grants and returns `403 TENANT_ACCESS_DENIED` or `403 TENANT_NOT_ASSIGNED`.

---

## 4. Ownership Boundaries & Blockers

| Domain | Responsible Party | In Scope for Demo | Blockers / Open Dependencies |
|---|---|---|---|
| **Frontend (Option A)** | Frontend Team (Abdo) | Consume session context; read-only tenant display; capability-based UI gating; handle 401/403/404/409/412/422/428; zero hardcoded tenant 1 fallbacks | **Blocker:** Canonical OpenAPI contract currently lacks `GET /api/v1/session/context` endpoint and DTO. Frontend uses offline typed boundary (`MOCK`/`NOT_INTEGRATED`). |
| **Backend API** | Backend Team | Implement session context endpoint; validate user-to-tenant grants; enforce Casbin; implement `withTenantTransaction` using transaction-local `set_config`; audit security denials | Requires deployed V3 database and canonical OpenAPI specification alignment. |
| **Database & IAM** | DB / Schema Owner | Confirm `threeddx_app` role has RLS active (`BYPASSRLS=false`); configure `iam` tables; provision 3 demo identities with tenant 1 grant | Requires running PostgreSQL V3 instance with RLS verification. |
| **F07 Payer Vertical Slice** | DB / ETL Team | Service-level Bill To (`billed_to_contact_id`, `billed_party_origin`) | **BLOCKED:** Current V3 database lacks F07 columns. V204 migration and ETL stage-90 reconciliation are required before live writes can be enabled. |

---

## 5. Acceptance Scenarios: TEN-01 through TEN-30

All 30 tenant acceptance scenarios from `TENANT_OCT_DEMO_ACCEPTANCE_TESTS.csv` are recorded below. All runtime execution statuses are currently **`NOT_RUN`** as no live backend or database deployment has occurred.

| ID | Scenario | Setup | Expected Result | Owner | Scope | Execution Status |
|---|---|---|---|---|---|---|
| **TEN-01** | CS sign-in assigned tenant 1 | Auth CS and IAM tenant=1 | AUTHORIZED context tenant=1, no selector | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-02** | OPS sign-in assigned tenant 1 | Auth OPS and IAM tenant=1 | AUTHORIZED context tenant=1, Ops scoped to Models/Conversion | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-03** | ADMIN sign-in assigned tenant 1 | Auth ADMIN and IAM tenant=1 | ADMIN rights only inside tenant 1 | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-04** | Unassigned @3ddx.com Google user | Approved domain, no group or tenant assignment | May provision pending identity; API 403; no auto tenant | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-05** | Forged X-Tenant-Id:2 | CS with tenant 1 only | Header cannot change tenant; protected request denied/no tenant 2 access | BE | Demo mandatory | `NOT_RUN` |
| **TEN-06** | Forged body tenantId:2 | OPS with tenant 1 only | Reject conflicting tenant field; no tenant 2 data created/modified | BE | Demo mandatory | `NOT_RUN` |
| **TEN-07** | Cross-tenant read by identifier | Known synthetic tenant2 order ID | 404/403 without leaking tenant2 order existence/data | BE+DB | Demo mandatory | `NOT_RUN` |
| **TEN-08** | Cross-tenant write attempt | Synthetic tenant2 item or order ID | No write; correct denial and audit | BE+DB | Demo mandatory | `NOT_RUN` |
| **TEN-09** | RLS active with threeddx_app | Actual app connection | row_security_active true and only scoped rows visible | DB+BE | Demo mandatory | `NOT_RUN` |
| **TEN-10** | Pooled connection tenant context | Concurrent tenant1/tenant2 test fixture requests | No context leakage; transaction local context only | BE+DB | Demo mandatory | `NOT_RUN` |
| **TEN-11** | Missing tenant context in DB | Tenant-scoped query under app role without setting | Fails closed/no protected rows | BE+DB | Demo mandatory | `NOT_RUN` |
| **TEN-12** | Role revoke active session | CS role removed by authorized Admin | Subsequent business request 403; frontend refresh context | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-13** | Logout | Authorized session then logout | Session revoked; next protected request 401 | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-14** | Session idle & max expiry | Configured 30m idle and 8h max | Expire at configured limits, deny next protected request | BE | Demo mandatory | `NOT_RUN` |
| **TEN-15** | Both React options | Same identity and permissions | Same backend API, error handling and tenant label | FE A+FE B | Demo mandatory | `NOT_RUN` |
| **TEN-16** | Report export CS/OPS | Authenticated CS or Ops | View allowed, export/download 403 | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-17** | Report export FINANCE/QC/ADMIN | Fixtures for FINANCE/QC; live ADMIN | Export capability allowed within authorized tenant | BE+QA | Automated fixture | `NOT_RUN` |
| **TEN-18** | Service F07 payer adjustment | CS/OPS authorized service instance | Bill To updates authorized only when not financially locked | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-19** | IAM provisioning under DB grants | First login without existing iam.user | Scoped approved provisioning succeeds, broad iam.users INSERT not granted to app role | BE+DB | Demo mandatory | `NOT_RUN` |
| **TEN-20** | Config fail-fast | Domain auto-assignment or RLS off/missing mandatory config | Startup/test fails; no insecure defaults | BE | Demo mandatory | `NOT_RUN` |
| **TEN-21** | Deferred tenant switching | No feature enabled | No tenant switcher, no alternate active-tenant endpoint | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-22** | Multi-role roles union | Multiple IAM assignments | Model supports union; end-to-end multi-role testing deferred | BE | Post-demo | `NOT_RUN` |
| **TEN-23** | User grant is independent of session | User A is granted tenant1; no active app session | DB grant exists but no protected API authorization without valid app session | BE | Demo mandatory | `NOT_RUN` |
| **TEN-24** | Active tenant is selected only after validating grant | Google login eligible; IAM role exists but tenant assignment absent | Pending context activeTenant=null; never seed 1 into session | BE+FE | Demo mandatory | `NOT_RUN` |
| **TEN-25** | Revoked grant overrides existing session | User A activeTenant=1, then Admin revokes tenant1 grant | Next protected API returns 403; session field does not reauthorize | BE | Demo mandatory | `NOT_RUN` |
| **TEN-26** | Session context does not leak to PostgreSQL pool | Concurrent requests with different authorized synthetic tenants and reused connections | Each transaction uses correct tenant and no cross-transaction RLS leakage | BE+DB | Demo mandatory | `NOT_RUN` |
| **TEN-27** | Tenant configuration cannot authorize a user | Set DEMO_SEED_TENANT_ID=1; Google-verified user has no IAM grant | User remains pending; no tenant1 data accessible | BE | Demo mandatory | `NOT_RUN` |
| **TEN-28** | Frontend derives tenant only from safe session context | Option A/B; authorized and pending fixture responses | UI displays validated active tenant or Pending; never constructs tenant selectors | FE-A+FE-B | Demo mandatory | `NOT_RUN` |
| **TEN-29** | Two sessions for one user use valid current grant | Two sessions of same user, grant tenant1 then revoke | Grant revocation denies next protected request in both sessions | BE | Demo mandatory | `NOT_RUN` |
| **TEN-30** | Multi-tenant future readiness without tenant switching | Schema/IAM design review only; one active demo tenant | Grant model not assumed to be single immutable iam.users.tenant_id; switcher remains disabled | BE+DB | Demo design review | `NOT_RUN` |
