# New CP IAM Approved Business Baseline v1.2

Status: approved business requirements; runtime, OAuth, IAM, Casbin, database, and acceptance execution are not verified by this document.

Source package: `NewCP_Approved_IAM_Developer_Handoff_v0.9.5_2026-10-26` and `NewCP_Approved_IAM_Developer_Handoff_v0.9.7_2026-10-26`.
Primary source: `payload/policy/IAM_APPROVED_BUSINESS_SPEC_v1.2.md` and `references/iam/TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`.
Related sources: `payload/references/iam/`, the v0.9.5 and v0.9.7 changelogs, and the repository OpenAPI contract.

## Authority and non-goals

- Google Sign-In is the interactive employee authentication method for the October demo.
- Google Groups are completely excluded from authentication, authorization, role assignment, tenant assignment, and permission refresh.
- PostgreSQL V3 `iam` records are authoritative for internal users, roles, assignments, and capabilities.
- Casbin enforces the effective authorization decision; the frontend must never be the security authority.
- The five approved business families are `CS`, `OPS`, `FINANCE`, `QC`, and `ADMIN`. They are functional envelopes, not a claim that V3 has exactly five physical roles.
- `CP` is the application name, not a sixth IAM role.
- This baseline does not authorize database migrations, ETL, production OAuth, deployment, or frontend-only permission implementation.

## Approved rules

| ID | Rule | Required behavior |
| --- | --- | --- |
| IAM-001 | Google authentication | Use Google Sign-In for the interactive demo; do not add a password login path. |
| IAM-002 | Provisioning | Eligible `@3ddx.com` or explicitly approved demo identities may be linked as internal users without receiving a role or tenant automatically. |
| IAM-003 | Authorization authority | Use internal PostgreSQL V3 IAM assignments/capabilities evaluated by Casbin; never use Google Groups. |
| IAM-004 | Role administration | Only an authorized tenant-scoped Admin may assign or revoke internal roles; changes are audited. |
| IAM-005 | Pending Access | An authenticated user without an authorized role/tenant sees restricted Pending Access and receives protected-API `403 ACCESS_NOT_ASSIGNED`. |
| IAM-006 | Demo tenant | Tenant `1` is the October demo tenant; email domain alone never grants it. |
| IAM-007 | Tenant session | One explicitly authorized active tenant per demo session; every protected operation validates tenant/resource scope. |
| IAM-008 | Admin scope | Admin is full functional access only inside authorized tenants; it is not automatic cross-tenant super-admin. |
| IAM-009 | Report viewing | All five families may view sanitized tenant reports. |
| IAM-010 | Report export | Only Finance, QC, and Admin may export/download; the API must enforce this independently of UI visibility. |
| IAM-011 | Session lifetime | Default idle timeout is 30 minutes and absolute lifetime is 8 hours; enforcement is server-side and configurable. |
| IAM-012 | Refresh/revocation | Role changes apply on the next protected request; logout revokes the application session. |
| IAM-013 | Audit | Record actor, identity context, tenant, effective authorization context, resource, action, time, changes, and security denials without tokens, secrets, or patient data. |
| IAM-014 | CS | Operational CP actions within approved scope, excluding financial transactions, QC audits, and administration. |
| IAM-015 | OPS | Models and Conversion operational create/edit/transition/On Hold and approved commercial adjustments only. |
| IAM-016 | Finance/QC/Admin | Finance performs financial actions; QC performs audits; Admin has tenant-scoped full functional access. |
| IAM-017 | Commercial edits | Price, Bill To, billability, and zero-charge changes never grant charging/invoicing and remain subject to locks, validation, tenancy, and audit. |
| IAM-018 | Multiple roles | Support additive union of applicable internal roles; demo multi-role tests are deferred, not architecturally removed. |
| IAM-019 | Step-up | Sensitive-action Google step-up is deferred; session validity, backend authorization, audit, and financial locks remain mandatory. |
| IAM-020 | Demo identities | Use only three live Google identities representing CS, OPS, and Admin; Finance/QC use automated fixtures. |
| IAM-021 | Demo journeys | Verify Google login, allowed/denied actions, commercial overrides, F07 payer change, and tenant denial. |
| IAM-022 | No Google Groups | No Google Workspace Groups lookup, claim, sync, or mapping. |
| IAM-023 | V3/Casbin | V3 IAM is authoritative and Casbin evaluates protected requests. |
| IAM-024 | Granular roles | Preserve verified granular staff roles/grades; do not collapse all staff into five physical rows. |
| IAM-025 | Mapping evidence | Discover exact role codes, direct grants, and parent-child links; names alone are not evidence. |
| IAM-026 | Effective closure | Same-family parent roles receive all direct and transitively inherited child grants through a reviewed implementation. |
| IAM-HIER-001 | Mandatory hierarchy | Every verified Senior/Manager role inherits every direct and inherited permission of verified subordinate roles in the same family, plus its own grants. No reverse, cross-family, or cross-tenant inheritance. |
| IAM-027 | Tenant Separation | User authorization (IAM grants) ≠ active session tenant context ≠ transaction-local PostgreSQL RLS context. |
| IAM-028 | Seed Tenant Non-Fallback | `DEMO_SEED_TENANT_ID=1` is fixture/seed only; never login, session, middleware, or API authorization fallback. |
| IAM-029 | No Client-Supplied Tenant | Client-supplied `tenantId` or `X-Tenant-Id` is rejected/ignored; no tenant selector UI; backend context is authoritative. |

## Role and capability boundaries

- CS and OPS operational permissions remain constrained by tenant, resource, service type, workflow, and financial locks.
- OPS commercial service operations are scoped to Models and Conversion unless another service type is explicitly granted.
- Finance may perform financial transactions; operational commercial access does not imply financial access.
- QC may audit and export but does not automatically gain operational editing.
- Admin role assignment is tenant-scoped and audited.
- `reports.view_all` is distinct from `reports.export`.
- `tenant.cross_admin` is a separate privilege and is not included automatically in Admin.
- Unlisted capabilities are denied by default.

## Hierarchy implementation guardrails

V3 evidence currently shows roles, user-role assignments, capabilities, role capabilities, teams, and team capabilities, but no verified native parent-role relation. The approved business inheritance rule must not be weakened. A reviewed effective-capability projection or reviewed Casbin role links may implement it; a new schema relation requires database-owner and architecture approval.

Before activating granular hierarchy:

1. Inventory actual V3 and legacy role codes.
2. Map direct grants and verified same-family parent-child edges.
3. Reject unknown edges, cycles, cross-family links, and cross-tenant links.
4. Calculate transitive effective permissions.
5. Test positive inheritance, reverse denial, family/tenant/service boundaries, cycle rejection, and next-request revocation.

## v0.9.7 Tenant Separation & Enforcement Guardrails

Keep three concepts strictly separate:
1. **User authorization:** PostgreSQL V3 IAM user-to-tenant grants determine which tenants the user may access.
2. **Active session context:** The backend session stores one active tenant only after validating the user's grant.
3. **Request/transaction enforcement:** Every protected request revalidates the current grant and Casbin permissions. The backend sets PostgreSQL transaction-local `app.tenant_id` and relies on RLS.

Non-negotiable constraints:
- Google Sign-In authenticates identity only.
- Google Groups must not be used.
- `@3ddx.com` is provisioning eligibility only, not tenant authorization.
- `DEMO_SEED_TENANT_ID=1` is seed/test configuration only; never a login, session, middleware, or API authorization fallback.
- Never hardcode `tenantId: 1` as a default grant.
- Never introduce `DEFAULT_TENANT_ID=1` or `ACTIVE_TENANT_ID=1`.
- Do not add a tenant selector or tenant switcher.
- Do not accept client-controlled `tenantId` or `X-Tenant-Id` as authorization.
- Frontend consumes validated backend session context only.
- Backend remains authoritative for tenant access, roles, capabilities, Casbin, and RLS.

## API error behavior

The frontend must distinguish `401` authentication/session failure, `403 ACCESS_NOT_ASSIGNED`, other `403` permission denial, `404` masked inaccessible resources, `409` workflow/financial conflict, `412` stale ETag, `422` validation, and `428` missing If-Match. Proposed IAM error envelopes must be reconciled with the actual OpenAPI contract before client code treats them as canonical.

## Deferred or blocked

- Google Groups integration is excluded.
- Domain-to-tenant automatic grants, external email policy, tenant switching, report field masking, sensitive-action step-up, multi-role demo tests, cross-tenant super-admin, and non-Google login are deferred.
- Live IAM, OAuth, Casbin, V3 schema, F07, and staging behavior remain `NOT VERIFIED` until evidence exists.
- Canonical OpenAPI contract lacks `GET /api/v1/session/context` endpoint and DTOs; frontend uses typed offline boundary (`MOCK`/`NOT_INTEGRATED`).
- F07 live Bill To remains blocked by missing V3 schema fields (`orders.order_items.billed_to_contact_id` and `billed_party_origin`).
