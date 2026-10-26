## v0.9.7 mandatory tenant context distinction

DO NOT derive authorization from `session.activeTenant` or from `DEMO_SEED_TENANT_ID`. Use PostgreSQL V3 internal user→tenant grants for authorization, store the validated active tenant in backend-managed session, revalidate user grant and Casbin on *every protected request*, and set `app.tenant_id` transaction-locally for each SQL unit of work. Frontend reads the backend context only, never provides tenant selection. See `TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md` and tests TEN-23+.

## v0.9.6 mandatory October tenant scope
Read `TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md` and `TENANT_OCT_DEMO_ACCEPTANCE_TESTS.csv` before coding. Use central validated config (`TENANT_OCT_DEMO_CONFIG.example.env` as illustration). Google OIDC identity is not an authorization grant; no Google Groups. Tenant1 assignment only from trusted internal IAM grant. Expose safe normalized session context to BOTH React variants; do not accept a client-supplied demo tenant ID, and do not hardcode tenant1 in middleware. Use transaction-local RLS context on `tx`, check the `threeddx_app` role's RLS behavior, provide tenant2 negative fixtures. No role/tenant fallback; no automatic domain mapping. Align example routes/DTOs/error codes with existing API rather than independently adding duplicate endpoints. Report PASS/FAIL/NOT_RUN; do not claim live validation.

# AI coding agent implementation brief — IAM v1.2

## Read in order
1. `policy/IAM_APPROVED_BUSINESS_SPEC_v1.2.md` (authoritative IAM business requirements)
2. `references/iam/ROLE_CAPABILITY_MATRIX.csv`
3. `references/iam/USER_JOURNEYS.md` and `ACCEPTANCE_TESTS.csv`
4. `references/iam/API_ERROR_CONTRACT.md`, `IMPLEMENTATION_AND_SCHEMA_GAPS.md`
5. Older business/service/F07/Q-B8–Q-B15 reference documents for *non-IAM* behavior, and the actual current repository code/schema.

## Non-negotiable
- **Do a read-only current-repo audit first**: identify Google OAuth adapter, user/session persistence, role seeds, Casbin model/enforcer, tenant-RLS context, report endpoints, error conventions and audit sink. Distinguish code present, code missing, and runtime not verified.
- Implement only approved IAM decisions for October demo. There are five approved business access families (CS OPS FINANCE QC ADMIN), but internal IAM can contain granular role grades such as Senior Ops and Junior Ops; never collapse roles without a reviewed hierarchy mapping. No CP role. OPS scope Models/Conversion. CS and OPS commercial service edits allowed in scope; not charges/invoices. All roles view reports; only Finance/QC/Admin export. Role assignment Admin-only; authorization applies next protected request; pending users get no privileges.
- Protect all endpoints server-side; no role checks exclusively in React. Keep both FE options business-identical. Tenant 1 is explicitly granted, never inferred from matching domain.
- Do not imply demo provisioning exception is unrestricted external user tenant access. Never fill pending decisions with invented Google Group names or report-field policies.
- Ensure 3 Google demo identities maximum as approved (CS, OPS, ADMIN); Finance/QC authorization through automated fixtures. Multi-role test deferred, but schema must allow multi-role grants.
- `reports.export` requires separate middleware and audit event. Do not let `ADMIN` bypass tenant controls.
- Schema changes, privileged ETL and production data handling require responsible approval; do not execute as part of this handoff.
- Run/test available unit and integration suites; report PASS / FAIL / NOT RUN truthfully. No credentials, tokens, live dumps or client records in prompts or fixtures.

## First PR deliverables
1. Repository audit and delta list mapped to IAM-001..021.
2. Proposed capability seed+Casbin rules mapped to each matrix row, with tenant/service-type checks.
3. Authentication/user-provisioning, session, RBAC and report access implementation plan, including V3 gaps requiring approval.
4. API/OpenAPI changes and both React error/authorization UI behavior.
5. Acceptance matrix test evidence; end-to-end demo runbook for 3 identities.
6. Deferred items explicit, no silent implementation.

## Mandatory v1.2 correction (26 Oct 2026)
- Google OIDC is only for sign-in/identity. Do not call Google Groups APIs, rely on Google group claims, or synchronize Google Workspace group memberships for RBAC.
- Resolve V3 internal user, active status, tenant grant, role assignments and capability membership on the backend. Feed those trusted assignments to Casbin with tenant and resource context.
- Read `ROLE_HIERARCHY_DESIGN_AND_DISCOVERY.md` and `INTERNAL_ROLE_HIERARCHY_MAPPING_TEMPLATE.csv`. The five business access families do **not** mean the only five role codes. Inspect Senior/Junior Ops and other legacy grades before designing inheritance or seeds.
- `iam.roles` + `iam.role_capabilities` support a flat explicit grant model for the demo; there is no verified native role-parent table in V006. IAM-HIER-001 MANDATES transitive same-family inheritance along verified edges: calculate effective-capability closure with controlled mapping or propose approved role-link persistence. Test that parents inherit all child permissions, juniors do not inherit parent-only grants, and no cross-family grants occur.
- Provide read-only evidence for existing IAM role seed codes and a change plan; no invented Senior/Junior permissions. Negative tests should verify no unintended permission from similarly named groups.
