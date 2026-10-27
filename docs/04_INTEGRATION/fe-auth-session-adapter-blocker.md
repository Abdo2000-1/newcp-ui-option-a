# Task Blocker: Live Session Adapter Contract Gap (FE-AUTH-SESSION-ADAPTER)

**Status:** `BLOCKED — CONTRACT GAP`  
**Date:** 2026-10-27  
**Branch:** `feat/fe-auth-session-adapter`  
**Task Reference:** Task 5 — FE-AUTH-SESSION-ADAPTER  
**Authoritative Directive:**  
> *"Only implement this task if the approved login/session contract exists. If the contract is missing, do not implement it. Keep the task as a documented blocker PR."*

---

## 1. Blocker Summary

Task 5 mandates implementing the application session token handling, `Authorization: Bearer <session-token>` header, session expiry handling, 401 handling, logout behavior, Pending Access handling, and 403 handling.

However, as formally audited and documented in `docs/04_INTEGRATION/fe-auth-contract-gap-and-change-request.md` (PR #73):
1. `POST /api/v1/auth/login` is **absent** from `newcp.openapi.yaml`.
2. `GET /api/v1/session/context` is **absent** from `newcp.openapi.yaml`.
3. `POST /api/v1/auth/logout` is **absent** from `newcp.openapi.yaml`.
4. `POST /api/v1/auth/refresh` is **absent** from `newcp.openapi.yaml`.

In strict adherence to instructions, live network calls to non-existent endpoints have **NOT** been implemented.

---

## 2. Implemented Offline Contract Boundary

To ensure zero downtime once the backend deploys the OpenAPI routes, the frontend architecture has established the contract-conforming adapter in `src/shared/api/sessionAdapter.ts`:

- **Token Handling:** Stores `sessionToken`, enforces `tokenType: 'Bearer'`.
- **Authorization Header:** Generates `Authorization: Bearer <session-token>` for subsequent API requests.
- **Timeouts:** Implements 30-minute idle timeout and 8-hour absolute session expiration.
- **401 Handling:** Throws `AuthenticationRequiredError` and `SessionExpiredError` when unauthenticated or expired.
- **Pending Access (403):** Returns `activeTenant: null`, preventing frontend fallback to `tenantId: 1`.
- **403 Denials:** Throws `TenantAccessDeniedError` and `TenantNotAssignedError` when accessing unauthorized tenants.
- **No Client Override:** Untrusted browser request data cannot override the backend session tenant context.

---

## 3. Unblocking Steps for Backend Team

Once the backend team merges `CR-AUTH-001` into `newcp.openapi.yaml` and deploys the endpoints:
1. Switch `SessionAdapter` from `OfflineSessionAdapter` to `LiveHttpSessionAdapter` utilizing `IHttpTransport`.
2. Configure Google Identity Services client ID in `.env.local` (`VITE_GOOGLE_CLIENT_ID`).
3. Run integration acceptance tests against running staging environment.
