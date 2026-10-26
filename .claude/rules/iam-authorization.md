---
trigger: model_decision
description: Enforce New CP v0.9.5 and v0.9.7 IAM, Google authentication, Casbin, tenant separation, hierarchy, session, and audit boundaries.
---

# New CP IAM Authorization Rules

Read `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`, `docs/newcp-ai/references/iam/tenant-context-integration.md`, and `docs/newcp-ai/references/iam/` before IAM work.

- Google authenticates identity only; Google Groups are excluded entirely. `@3ddx.com` is provisioning eligibility only, not tenant authorization.
- **Tenant Three-Layer Separation**: Keep user authorization (PostgreSQL V3 IAM user-to-tenant grants), active session context (validated tenant selection in session), and request/transaction enforcement (revalidated on every request; transaction-local `set_config('app.tenant_id', ..., true)` and PostgreSQL RLS) strictly separate. Never substitute one layer for another.
- `DEMO_SEED_TENANT_ID=1` is fixture/seed setup ONLY. Never use it as a login, session, middleware, or API authorization fallback. Never hardcode `tenantId: 1` as a default grant; never introduce `DEFAULT_TENANT_ID=1` or `ACTIVE_TENANT_ID=1`.
- Do not add a tenant selector or switcher UI. Do not accept client-controlled `tenantId` or `X-Tenant-Id` as authorization.
- PostgreSQL V3 IAM is authoritative for roles and capabilities; Casbin/backend enforcement is authoritative.
- Frontend visibility, localStorage, email domain, or client claims are never authorization.
- Use only evidenced roles, capabilities, tenant grants, OAuth/session contracts, and API errors. Unknown mappings default to deny.
- CS, OPS, FINANCE, QC, and ADMIN are business families, not exactly five physical role rows; CP is not a role.
- Verified same-family Senior/Manager hierarchy must inherit direct and transitive child permissions (IAM-HIER-001). Never infer edges from names or allow reverse, cross-family, or cross-tenant inheritance.
- Admin remains tenant-scoped; report viewing is separate from export, which is Finance/QC/Admin only.
- Pending/unassigned users receive restricted access and protected APIs return `403 ACCESS_NOT_ASSIGNED`.
- Role/grant revocations apply on the next protected request; logout revokes the application session; defaults are 30-minute idle and 8-hour absolute lifetime.
- All tenant runtime scenarios (TEN-01 through TEN-30) are recorded as `NOT_RUN` until validated against a live environment.
- F07 live Bill To remains blocked by missing V3 schema fields (`orders.order_items.billed_to_contact_id` and `billed_party_origin`).
- Audit without tokens, secrets, PHI, or policy internals.
- Do not add migrations, seeds, Casbin policies, OAuth secrets, or production endpoints without owner approval and evidence.
- Mark offline results MOCK, NOT_VERIFIED, BLOCKED, or DEFERRED; never claim live IAM or tenant isolation from frontend tests.
