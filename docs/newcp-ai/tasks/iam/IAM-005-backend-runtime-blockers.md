# IAM-005: Backend Runtime Dependencies and Integration Blockers

## Status: BLOCKED (BACKEND RUNTIME AND DATABASE MIGRATION GATES)
- **Branch:** `docs/IAM-005-backend-runtime-blockers`
- **Specification Baseline:** IAM Approved Business Spec v1.2 / IAM Approved Business Baseline v1.2
- **Authoritative Enforcement Rule:** `.agents/rules/iam-authorization.md`

---

## 1. Executive Summary

The frontend authentication and authorization boundaries for New CP IAM v0.9.5 have been implemented and verified in React Option A (`feat/IAM-002`, `feat/IAM-003`, `test/IAM-004`). All 481 synthetic and contract tests pass with 100% success.

However, **live integration with a real backend and real PostgreSQL database cannot occur** until seven critical backend runtime dependencies are deployed and verified by backend and database owners.

This document serves as the authoritative blocker register, specifying the exact missing components, architectural risks, required evidence, and decision owners.

---

## 2. Master Blocker Register

| Blocker ID | Dependency Domain | Specific Requirement | Current Status in Repo | Required Backend Artifact / Evidence | Assigned Decision Owner |
|---|---|---|---|---|---|
| **BLK-IAM-01** | **Google OAuth 2.0 / OIDC Backend** | Server-side verification of Google ID token; exchange for secure backend session cookie/JWT; token revocation on logout (`POST /api/v1/auth/logout`). | **MOCK ONLY**: Frontend simulates interactive sign-in with 4 demo identities. No live Google client secret or backend token exchange endpoint exists. | 1. Google OAuth Client ID & Secret configured in backend secrets vault.<br>2. Endpoint `POST /api/v1/auth/google/callback` verifying Google `sub` and email signature.<br>3. Endpoint `POST /api/v1/auth/logout` invalidating session. | Security Engineer / Backend Lead |
| **BLK-IAM-02** | **PostgreSQL V3 IAM Schema** | Application of Flyway migrations `V006__iam_tables.sql` establishing `iam.users`, `iam.roles`, `iam.user_roles`, `iam.capabilities`, and `iam.role_capabilities`. | **DESIGN ARTIFACT ONLY**: Migration SQL exists as reference only; no database instance is running. | 1. Applied Flyway migration log from staging PostgreSQL instance.<br>2. Seed confirmation for the 5 business families (`CS`, `OPS`, `FINANCE`, `QC`, `ADMIN`).<br>3. Immutable provider subject link (`google_sub` column in `iam.users`). | Database Administrator (DBA) |
| **BLK-IAM-03** | **Casbin Policy Enforcement** | Server-side Casbin / Go or Node enforcement middleware intercepting all HTTP routes and evaluating `(sub, dom, obj, act)`. | **FRONTEND BOUNDARY ONLY**: Capability checks implemented via `useAuthorization` and synthetic Casbin engine in tests. | 1. Casbin RBAC model definition (`model.conf`) and policy table (`casbin_rule`).<br>2. Automated backend integration tests asserting 403 on unauthorized requests independent of UI state. | Backend Security Lead |
| **BLK-IAM-04** | **Multi-Tenant Context & RLS** | Tenant isolation middleware injecting `SET LOCAL app.current_tenant_id = 1` into database connection pool before request execution. | **FRONTEND SCOPED**: Frontend hardcodes `tenant_id = 1` for October demo; checks request tenant. | 1. PostgreSQL Row-Level Security (RLS) policies enabled on all business tables.<br>2. Verification evidence showing connection pool reuse between tenants does not leak data. | DBA / Platform Lead |
| **BLK-IAM-05** | **Session State & Idle Timeout** | Backend session store enforcing 30-minute idle inactivity timeout and 8-hour absolute lifetime via server-side `last_activity_at` check. | **CLIENT-SIDE TIMERS ONLY**: `AuthContext.tsx` handles client-side idle heartbeat interval (30s) and absolute timeout. | 1. Migration adding `last_activity_at` to `iam.user_sessions`.<br>2. Backend Redis or DB session middleware invalidating sessions exceeding 1,800,000 ms idle time. | Backend Lead |
| **BLK-IAM-06** | **Audit Trail Logging Sink** | Audit event sink writing to `audit.event_log` for authentication, role changes, data export, and permission denial events. | **NOT INTEGRATED**: Option A logs audit events to mock console and local feedback state. | 1. Extension of `audit.event_log.event_code` CHECK constraint to include `permission_denied` / `authorization_denied`.<br>2. Audit logging middleware recording actor, tenant, timestamp, and action without patient data or tokens. | Compliance / Backend Lead |
| **BLK-IAM-07** | **Staging Infrastructure & Secrets** | Staging environment with HTTPS, valid TLS certificate, Google Cloud Console authorized redirect URIs, and backend API service. | **LOCAL DEMO ONLY**: Running in browser via Vite development server on `localhost:5173`. | 1. Deployed staging URL with valid HTTPS certificate.<br>2. Google Cloud OAuth Consent Screen approved for `@3ddx.com` internal domain.<br>3. Continuous Deployment pipeline running `npm test` and build checks. | DevOps / SRE Lead |

---

## 3. Detailed Architecture Analysis of Blockers

### 3.1 Blocker BLK-IAM-01: Google OAuth Identity Resolution
- **Rule:** Google authenticates identity ONLY. Google Groups are strictly prohibited.
- **The Gap:** The current repository operates in client-side demonstration mode. When a user clicks "Sign In with Google" or chooses a demo identity, the frontend directly resolves mock profile fixtures.
- **Remediation Required:**
  1. Backend must implement `/api/v1/auth/google/authorize` and `/api/v1/auth/google/callback`.
  2. Backend must verify the Google JWT using Google's public JWKS keys (`https://www.googleapis.com/oauth2/v3/certs`).
  3. Google `sub` (immutable subject identifier) must be matched against `iam.users.google_sub`.
  4. Backend must set an `HttpOnly`, `SameSite=Strict`, `Secure` session cookie.

### 3.2 Blocker BLK-IAM-02 & BLK-IAM-03: PostgreSQL V3 IAM & Casbin Closure
- **Rule:** PostgreSQL V3 IAM is authoritative for roles and capabilities. Senior/Manager roles inherit transitive capabilities of same-family subordinates.
- **The Gap:** Schema migration `V006__iam_tables.sql` is a design proposal. It lacks a native role-parent hierarchy table (`iam.role_hierarchy` or `parent_role_id`) to compute transitive closure.
- **Remediation Required:**
  1. DBA must approve and apply a migration for `iam.role_hierarchy(parent_role, child_role, family)`.
  2. Casbin engine must load the role hierarchy and project the effective permission closure into memory.
  3. Any role mutation by an admin must trigger instant Casbin policy invalidation so the next request is re-evaluated.

### 3.3 Blocker BLK-IAM-05: Server-Side Inactivity Expiration
- **Rule:** Default session policy is 30-minute idle inactivity timeout, 8-hour absolute maximum lifetime.
- **The Gap:** `iam.user_sessions` currently lacks a `last_activity_at` column. If a client simply disables JavaScript, client-side timers will not fire.
- **Remediation Required:**
  1. DBA must add `last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` to `iam.user_sessions`.
  2. Every authenticated API request must update `last_activity_at`.
  3. Requests with `NOW() - last_activity_at > INTERVAL '30 minutes'` must be rejected with `401 SESSION_EXPIRED`.

---

## 4. Acceptance Gate for Backend Live Cutover

Before any frontend configuration is switched from `VITE_API_MODE=MOCK` to `VITE_API_MODE=LIVE_HTTP`:

1. All 7 blockers must have documented sign-off from their respective owners.
2. Staging environment must execute acceptance test suite `AT-001` through `AT-052` against the live backend API.
3. Penetration test must confirm that injecting arbitrary headers or tampering with localStorage cannot bypass Casbin authorization.
4. Security review must confirm zero leakage of patient data or PHI in audit logs.
