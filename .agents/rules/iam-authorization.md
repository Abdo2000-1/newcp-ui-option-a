---
trigger: model_decision
description: Enforce New CP v0.9.5 and v0.9.7 Google authentication, PostgreSQL IAM, Casbin, tenant separation, hierarchy, session, and audit boundaries.
---

# New CP IAM Authorization Rules

- Read `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`, `docs/newcp-ai/references/iam/tenant-context-integration.md`, and `docs/newcp-ai/references/iam/TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md` before authentication or authorization work.
- **Tenant Three-Layer Separation**: Keep user authorization (PostgreSQL V3 IAM user-to-tenant grants), active session context (validated tenant selection in session), and request/transaction enforcement (revalidated on every request; transaction-local `set_config('app.tenant_id', ..., true)` and PostgreSQL RLS) strictly separate. Never substitute one layer for another.
- `DEMO_SEED_TENANT_ID=1` is fixture/seed setup ONLY. Never use it as a login, session, middleware, or API authorization fallback. Never hardcode `tenantId: 1` as a default grant; never introduce `DEFAULT_TENANT_ID=1` or `ACTIVE_TENANT_ID=1`.
- Do not add a tenant selector or switcher UI. Do not accept client-controlled `tenantId` or `X-Tenant-Id` as authorization.
- Google authenticates identity only. Never use Google Groups, group claims, or email domain as role/tenant authorization. `@3ddx.com` is provisioning eligibility only, not tenant authorization.
- PostgreSQL V3 IAM assignments/capabilities are authoritative; Casbin/backend enforcement is authoritative. Frontend visibility is for UX only, not security.
- Use only explicitly evidenced roles, capabilities, tenant grants, OAuth/session contracts, and API errors. Unknown mappings default to deny.
- Preserve CS, OPS, FINANCE, QC, and ADMIN as business families, not an assumption of exactly five physical role rows; no CP role.
- Senior/Manager same-family transitive inheritance is mandatory after verified edges are discovered (IAM-HIER-001). Never infer edges from names, permit reverse/cross-family/cross-tenant inheritance, or bypass service/financial/workflow guards.
- Admin is tenant-scoped; cross-tenant administration requires a separate approved privilege.
- Report viewing and report export are separate capabilities. Export is restricted to Finance, QC, and Admin.
- Pending/unassigned users receive restricted UI and protected API `403 ACCESS_NOT_ASSIGNED`; no default privileged role or tenant.
- Role/grant revocations take effect on the next protected request; logout revokes the app session; default session limits are 30-minute idle and 8-hour absolute.
- All tenant runtime scenarios (TEN-01 through TEN-30) are recorded as `NOT_RUN` until validated against a live environment.
- F07 live Bill To remains blocked by missing V3 schema fields (`orders.order_items.billed_to_contact_id` and `billed_party_origin`).
- Audit security-relevant actions and denials without tokens, secrets, PHI, or internal policy expressions.
- Never add migrations, seed roles, Casbin policies, OAuth secrets, or production endpoints without explicit owner approval and evidence.
- Label all fixtures and offline results `MOCK`, `NOT_VERIFIED`, or `BLOCKED`; never claim live IAM or tenant isolation from frontend tests alone.
