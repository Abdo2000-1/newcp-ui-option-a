# ADR 0002 IAM-TENANT-002: Tenant-Scoped IAM Role Assignments as October Authorization Source

- Status: Accepted
- Date: 2026-10-27
- Decision owner: Backend Architecture & Database Owner
- Approver: Security Lead & IAM Architect
- Source requirement IDs: IAM-TENANT-002, IAM Specification v1.2, Tenant Specification v1.1, PostgreSQL V3 Schema

## Context

Following the backend developer's verification of the deployed PostgreSQL V3 schema, a physical persistence resolution was required for user-to-tenant authorization. The earlier v0.9.7 specification noted a schema gap regarding whether a dedicated normalized user-to-tenant grant table existed or if tenant eligibility was derived from role assignments.

In PostgreSQL V3 schema (`migrations/V006__iam_tables.sql`), the entities are:
- `iam.users.id`: Internal user identity
- `iam.users.tenant_id`: Tenant that owns the login record (structural ownership, NOT independent proof of authorization)
- `iam.roles.id`: Internal role identity
- `iam.roles.tenant_id`: Tenant in which the role is defined
- `iam.user_roles.user_id`: User holding a role
- `iam.user_roles.role_id`: Assigned role
- `iam.user_roles.tenant_id`: Tenant associated with the role assignment
- `iam.user_roles.granted_at`: Role assignment timestamp
- `iam.user_roles.granted_by`: Assignment actor, where available
- `orders.orders.tenant_id`: Tenant ownership of an order
- PostgreSQL `app.tenant_id`: Effective tenant context for the current database transaction

## Decision

For the October 2026 demo, `iam.user_roles` serves as the explicit user-to-tenant authorization source.
A user is authorized for a tenant when they have at least one currently valid, explicitly approved internal role assignment for that tenant, subject to account state, role consistency, and security validations:
1. **User Identity vs Tenant Authorization vs Active Session vs Transaction RLS:**
   - `iam.users.tenant_id` represents structural user-record ownership, NOT independent proof of tenant authorization.
   - `iam.user_roles` is the approved source for October tenant eligibility.
   - `iam.roles` and related capabilities define what the employee is permitted to do.
   - The application's active tenant identifies the tenant currently being accessed (backend session holds exactly one validated active tenant for October).
   - PostgreSQL `app.tenant_id` controls tenant-scoped database access through RLS (`set_config('app.tenant_id', authorizedTenantId, true)`); it does NOT establish permission by itself.
   - Casbin enforces resource/action/service permissions.
2. **October Demo Authorization Rule:**
   A tenant assignment is valid only if:
   - Successfully authenticated through Google Sign-In (identity only).
   - Google identity securely linked to the correct internal `iam.users` record.
   - Internal user is active (`state = 'active'`), not deleted (`deleted_at IS NULL`), and `party_kind = 'employee'`.
   - Explicit, currently effective record exists in `iam.user_roles` for the requested tenant.
   - Assigned role exists in `iam.roles`, and `iam.user_roles.tenant_id = iam.roles.tenant_id`.
   - Role is part of approved New CP role/permission mapping; historical role names alone do not establish authorization.
   - Assignment is approved for New CP use, rather than implicitly trusted solely because it was imported from legacy data.
   - Demo authorized tenant is `tenant_id = 1` (`3ddx.com`). Live identities (CS, OPS, ADMIN) have reviewed tenant-1 role assignments. FINANCE and QC validated via test fixtures.
3. **Dedicated Tenant Authorization Abstraction for Future Extensibility:**
   This decision does NOT make `iam.user_roles` the permanent tenant-membership model.
   Tenant authorization is encapsulated behind a dedicated service/repository abstraction:
   - `isTenantAuthorized(userId: string, tenantId: number): Promise<boolean>`
   - `getAuthorizedTenants(userId: string): Promise<TenantGrant[]>`
   Business modules depend on this abstraction rather than directly querying `iam.user_roles`. In a future phase, this abstraction can read from an independent normalized user-to-tenant grant table without altering authentication or protected business API contracts.
4. **Pre-Tenant IAM Lookup:**
   The backend must resolve identity and tenant grants before establishing active tenant context. The existing `iam.fn_find_login_user(text)` provides identity lookup but not tenant-role grant resolution. Backend and database owner require a narrowly scoped reviewed IAM function or equivalent restricted trusted-access mechanism without granting unrestricted table access or globally disabling RLS.

## Alternatives Considered

1. *Introduce an unapproved physical table (`iam.tenant_grants`) immediately:* Rejected because creating migrations or database changes without DBA approval violates change control and the October release scope.
2. *Rely on `iam.users.tenant_id` for authorization:* Rejected because `iam.users.tenant_id` represents structural record ownership and would permanently prevent cross-tenant membership.
3. *Rely on email domain (`@3ddx.com`) or Google Groups:* Strictly rejected per IAM-022 and IAM Specification v1.2; Google is identity-only.

## Consequences and Risks

- `iam.user_roles` primary key is `(user_id, role_id)`. Foreign keys do not independently enforce `iam.user_roles.tenant_id = iam.roles.tenant_id`. Application and database-owner checks must validate this consistency explicitly.
- Revoking an employee's last tenant-1 role revokes business access on their next protected request.
- Historical migrated role assignments must be reconciled before authorizing access.
- Official handoff package (`NewCP_Approved_IAM_Developer_Handoff_v0.9.7_2026-10-26.zip`) update is explicitly deferred; this repository records the decision for traceability without modifying the zipped bundle.

## Verification and Migration

- Automated acceptance tests verify authorized users, pending access users (unassigned), revoked roles, tenant-2 access denial, forged tenant header rejection, and inactive account states.
- Clean separation between frontend abstraction and backend resolution.

## Related Artifacts

- `docs/newcp-ai/references/iam/IAM-TENANT-002-TENANT-AUTHORIZATION-DECISION.md`
- `docs/newcp-ai/references/iam/source/IAM_V11_DECISION_REGISTER.csv`
- `docs/newcp-ai/references/iam/tenant-context-integration.md`
- `docs/newcp-ai/references/iam/TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`
