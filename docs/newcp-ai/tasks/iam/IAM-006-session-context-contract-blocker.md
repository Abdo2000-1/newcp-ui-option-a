# IAM-006: Canonical OpenAPI Session Context Blocker Notice

**Status:** `BLOCKED` / `NOT_INTEGRATED`  
**Date:** 26 October 2026  
**Component:** Backend OpenAPI Contract / Session Context Endpoint  
**Authoritative Reference:** `NewCP_Approved_IAM_Developer_Handoff_v0.9.7_2026-10-26` & `TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`  

---

## 1. Description of Blocker

The v0.9.7 Tenant Handling Specification mandates that the frontend Option A and Option B must consume a backend-provided session context endpoint (illustratively `GET /api/v1/session/context`) that returns:
- The authenticated internal user ID and display name.
- The validated active tenant object (`{ id: 1, label: '3ddx.com' }` or `null`).
- User access status (`AUTHORIZED`, `PENDING`, `TENANT_NOT_ASSIGNED`, etc.).
- Active internal roles and capability flags.
- `tenantSwitchingEnabled: false`.

### Inspection Result:
Inspection of the canonical OpenAPI contracts in the repository:
- `docs/newcp-ai/references/api/newcp.openapi.yaml`
- `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml`

reveals that **no `/session/context`, `/auth/session`, or equivalent session context endpoint or DTO is defined in either OpenAPI document**.

---

## 2. Mandatory Architectural Guardrail

Per strict non-negotiable workspace instructions:
> "If the canonical OpenAPI contract does not yet expose the required session context:
> - Do not invent an endpoint.
> - Do not pretend the frontend is integrated.
> - Keep the adapter interface explicitly MOCK / NOT_INTEGRATED.
> - Create a blocker document identifying the exact missing endpoint/DTO and owner.
> - Stop before live API wiring."

Accordingly:
1. The frontend does **not** fabricate a live HTTP request to any invented endpoint.
2. The frontend adapter (`SessionClient` / `MockSessionClient`) is explicitly classified as `MOCK / NOT_INTEGRATED`.
3. Live API wiring is strictly stopped at the client boundary.
4. No frontend tenant switcher or picker is implemented.

---

## 3. Required Action from Backend / Contract Architect

To unblock live session context integration, the Backend API Owner must:
1. Update `newcp.openapi.yaml` to specify the endpoint:
   - Route: `GET /api/v1/session/context`
   - Security: Session Cookie / Bearer Token
   - Response `200`: `SessionContextResponse` schema containing `user`, `accessStatus`, `activeTenant`, `roles`, `capabilities`, `tenantSwitchingEnabled`.
   - Responses `401` / `403`: Standard RFC 7807 Problem details with codes `AUTHENTICATION_REQUIRED`, `ACCESS_NOT_ASSIGNED`, `TENANT_NOT_ASSIGNED`, `TENANT_ACCESS_DENIED`.
2. Deploy the backend handler using `withTenantTransaction` to ensure transaction-local PostgreSQL RLS scoping (`set_config('app.tenant_id', ..., true)`).
3. Notify the frontend teams upon deployment and verification against running PostgreSQL V3.
