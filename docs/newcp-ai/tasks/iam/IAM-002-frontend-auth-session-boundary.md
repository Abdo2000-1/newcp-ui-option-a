# IAM-002: Frontend Authentication and Session Boundary

## Status: IMPLEMENTED (MOCK / SYNTHETIC RUNTIME BOUNDARY)
- **Branch:** `feat/IAM-002-frontend-auth-session-boundary`
- **Specification Baseline:** IAM Approved Business Spec v1.2 / IAM Approved Business Baseline v1.2
- **Authoritative Enforcement Rule:** `.agents/rules/iam-authorization.md`

---

## 1. Objectives & Architectural Boundaries

1. **Google Identity Boundary:**
   - Google Sign-In authenticates identity ONLY.
   - Google Groups are strictly prohibited and excluded from authorization decisions.
   - Internal role mapping and capabilities are governed authoritatively by PostgreSQL V3 IAM + Casbin backend.
   - Email domain (`@3ddx.com`) does NOT automatically grant role or tenant access.
2. **Tenant Isolation:**
   - Single tenant explicitly set to `tenant_id = 1` for the October demo release.
   - Cross-tenant access is prohibited.
3. **Session State Machine:**
   - Statuses: `unauthenticated` | `authenticating` | `authenticated` | `pending_access` | `expired` | `revoked`.
   - Default Session Policy:
     - 30-minute idle inactivity timeout (`IDLE_TIMEOUT_MS = 1800000`).
     - 8-hour absolute session lifetime (`ABSOLUTE_TIMEOUT_MS = 28800000`).
     - Interactive user events (`click`, `keydown`) reset the idle timer if authenticated.
     - Background heartbeat interval checks expiration every 30 seconds.
4. **Pending Access View (403 ACCESS_NOT_ASSIGNED):**
   - Unassigned internal employees (`unassigned@3ddx.com`) receive `pending_access` session status.
   - Protected routes render `PendingAccessView` providing accessible guidance and operator contact instructions without exposing operational actions or clinical data.
5. **Approved Demo Identities:**
   - `cs.demo@3ddx.com`: CS Operator (`family: 'CS'`, roles: `cs_operator`)
   - `ops.demo@3ddx.com`: Senior Ops Specialist (`family: 'OPS'`, roles: `ops_senior`, `ops_junior` - same-family inheritance)
   - `admin.demo@3ddx.com`: Tenant Admin (`family: 'ADMIN'`, roles: `tenant_admin`, full tenant scope)
   - `unassigned@3ddx.com`: Unassigned internal user (`roles: []`, `status: 'pending_access'`)

---

## 2. Changes Summary

- `src/features/auth/AuthContext.tsx`: Core session state machine, idle & absolute timer logic, and mock identity presets.
- `src/features/auth/pages/PendingAccessView.tsx`: Dedicated Material-UI / Tailwind accessible view for pending authorization.
- `src/features/auth/pages/Login.tsx`: Provider-agnostic Google Sign-In boundary and 4 one-click demo identity presets.
- `src/app/router/index.tsx`: `ProtectedRoute` route guard enforcing authenticated session state and pending access trapping.
- `src/features/auth/__tests__/AuthContext.test.tsx`: 6 unit tests verifying identity resolution, role inheritance, pending access state, logout, 30m idle timeout, and 8h absolute timeout.

---

## 3. Verification & Evidence

- `npm test -- src/features/auth/__tests__/AuthContext.test.tsx --run`: **6/6 passed**
- `npx tsc -b --pretty false`: **Clean (0 errors)**
- `npm run build`: **Built successfully (dist produced)**
- `git diff --check`: **Clean**
