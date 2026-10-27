# Decision Record: IAM-TENANT-002

**Decision ID:** IAM-TENANT-002  
**Date:** 27 October 2026  
**Applies to:** New CP October 2026 Demo  
**Reference:** AI-Assisted Development Handoff v0.9.7, IAM Specification v1.2, Tenant Specification v1.1, PostgreSQL V3 Schema  
**Decision:** Use existing tenant-scoped IAM role assignments for October; retain a separate tenant-authorization abstraction for future extensibility.

---

## 1. Decision Summary

Following the backend developer's verification of the deployed PostgreSQL V3 schema, we confirm the following implementation decision:
- For the October demo, `iam.user_roles` will serve as the explicit user-to-tenant authorization source.
- A user is authorized for a tenant when they have at least one currently valid, explicitly approved internal role assignment for that tenant, subject to account state, role consistency, and security validations.
- No additional user-to-tenant grant table is required for the October demo.
- This decision does not make `iam.user_roles` the permanent tenant-membership model. Future phases may introduce independent user-to-tenant grants without changing the application's authentication or protected API contracts.
- This implementation choice must be documented and verified. The V3 schema defines role assignments, but does not independently establish that every existing migrated assignment is an approved New CP tenant grant.

---

## 2. Database Relationships and Responsibilities

| Database Field or Entity | Responsibility / Meaning |
|---|---|
| `iam.users.id` | Internal user identity |
| `iam.users.tenant_id` | Tenant that owns the login record (structural ownership, NOT independent authorization) |
| `iam.roles.id` | Internal role identity |
| `iam.roles.tenant_id` | Tenant in which the role is defined |
| `iam.user_roles.user_id` | User holding a role |
| `iam.user_roles.role_id` | Assigned role |
| `iam.user_roles.tenant_id` | Tenant associated with the role assignment |
| `iam.user_roles.granted_at` | Role assignment timestamp |
| `iam.user_roles.granted_by` | Assignment actor, where available |
| `orders.orders.tenant_id` | Tenant ownership of an order |
| PostgreSQL `app.tenant_id` | Effective tenant context for the current database transaction |

### Critical Distinctions:
1. `iam.users.tenant_id` is structural ownership, not independent proof of authorization.
2. `iam.user_roles` is the approved source for October tenant eligibility.
3. `iam.roles` and related capabilities define what the employee is permitted to do.
4. The application's active tenant identifies the tenant currently being accessed.
5. PostgreSQL `app.tenant_id` controls tenant-scoped database access through RLS; it does not establish permission by itself.
6. The application must validate relationships before considering an assignment authoritative.

---

## 3. October Demo Authorization Rule

A tenant assignment is considered valid only if:
1. The employee has successfully authenticated through Google Sign-In.
2. The Google identity has been securely linked to the correct internal `iam.users` record.
3. The internal user is active, not deleted, and has `party_kind = 'employee'`.
4. An explicit, currently effective record exists in `iam.user_roles` for the requested tenant.
5. The assigned role exists in `iam.roles`, and `iam.user_roles.tenant_id = iam.roles.tenant_id`.
6. The role is part of the approved New CP role/permission mapping; historical role names alone do not establish authorization.
7. The assignment is approved for New CP use, rather than implicitly trusted solely because it was imported from legacy data.
8. The user has the capabilities needed for the requested business operation, enforced through Casbin.

For the current demo, the authorized tenant is `tenant_id = 1` (`3ddx.com`).
The three live identities (`CS`, `OPS`, and `ADMIN`) must have reviewed and explicitly approved tenant-1 role assignments. `FINANCE` and `QC` will be validated through approved test fixtures.

The current V3 schema describes `iam.user_roles.tenant_id` as the tenant of the user and role. For the October tenant-1 accounts, verify that this is consistent with the user's owning tenant. This is a data-integrity check, not a rule that permanently prohibits cross-tenant user grants in a future redesigned IAM model.

---

## 4. Authentication versus Authorization

- **Google is used exclusively for authentication:**
  - Google OIDC verifies the employee's identity.
  - Google Groups are not queried, synchronized, or used for permissions.
  - The employee's email domain (`@3ddx.com`) does not grant tenant access; it is identity-provisioning eligibility only.
- **PostgreSQL V3 IAM is authoritative for tenant assignments, roles, and capabilities.**
- **Casbin enforces resource/action permissions**, together with backend business rules.
- First-time provisioning creates or links an internal identity only. It must not automatically create a tenant assignment or assign a business role.
- An authenticated user without an approved tenant-scoped role assignment remains in **Pending Access**, without access to protected Orders, Services, Reports, or other business resources.

---

## 5. Backend Implementation Workflow

### A. During Google Login
1. Validate Google OIDC identity, including immutable subject (`sub`) and token security properties.
2. Resolve or provision the corresponding internal employee through an approved IAM process.
3. Check that the employee is active (`state = 'active'`, `deleted_at IS NULL`).
4. Retrieve employee's approved tenant-scoped roles from PostgreSQL IAM.
5. If there is no approved assignment for tenant 1, return **Pending Access**.
6. Otherwise, establish an application session with `activeTenantId = 1`.
7. Resolve effective permissions from internal IAM, including approved same-family role inheritance.
*The active tenant must be assigned to the application session only after the tenant authorization check succeeds.*

### B. On Every Protected API Request
1. Validate application session.
2. Resolve current internal user.
3. Revalidate user's active account state.
4. Recheck active tenant against current approved IAM assignments.
5. Resolve current effective role capabilities and Casbin permissions.
6. Apply resource-specific, service-type, and business-state restrictions.
7. Execute tenant-scoped database operations with the verified tenant context.
8. Return only authorized data and record security-relevant events.
*Do not rely on role grants embedded in a long-lived session or token without revalidation. A removed role must cease to authorize operations on the affected user's next protected request.*

### C. During Database Operations
For each tenant-scoped unit of work, use a Drizzle/PostgreSQL transaction and execute:
```sql
SELECT set_config('app.tenant_id', :authorizedTenantId, true);
```
- Tenant ID must originate from validated backend IAM/session context, never from browser-supplied values.
- All tenant-scoped reads and writes within the unit of work must use the same transaction.
- Third argument `true` ensures transaction-local configuration and avoids leaking tenant settings between requests via pooled connections.
- PostgreSQL RLS remains an independent, mandatory database security boundary.
- Do not use the privileged migration or database-owner role for normal application traffic.

---

## 6. Pre-Tenant IAM Lookup

The backend must resolve identity and tenant grants before establishing a validated active tenant.
The existing `iam.fn_find_login_user(text)` provides pre-tenant login lookup, but is not a complete tenant-role-grant lookup.
The backend and database owner must agree on a narrowly scoped mechanism to read approved tenant-role assignments during authentication and session validation (reviewed IAM function or restricted trusted-access mechanism).
It must not require granting unrestricted access to protected IAM or business tables, and must not disable RLS globally.

---

## 7. Role Assignment and Revocation

- Only authorized administration or approved seed processes may assign tenant-scoped roles.
- Each live demo identity requires an explicitly approved tenant-1 assignment.
- Adding a role does not create Google permissions or alter Google Groups.
- Revoking an employee's last authorized role for tenant 1 removes tenant-1 business access immediately (effective on next protected request).
- Assignment and revocation operations must be audited.
- Historical migrated role assignments must be reconciled against the approved New CP role mapping.
- V3 `iam.user_roles` PK is `(user_id, role_id)`. Application and DB-owner validation must explicitly enforce that `iam.user_roles.tenant_id = iam.roles.tenant_id`.

---

## 8. Expected Application Behavior

| Scenario | Expected Result |
|---|---|
| Valid Google login, active employee, approved tenant-1 role | Authenticated and authorized according to role capabilities |
| Valid Google login, no approved role | Pending Access; protected endpoints return `403` |
| User's last tenant-1 role revoked | Tenant-1 business access denied on next protected request |
| Valid tenant role, unauthorized business action | Casbin/backend denies with `403` |
| ADMIN role without tenant-2 assignment | Tenant-2 access denied |
| Browser supplies forged `tenant_id = 2` | Rejected; cannot alter authorized session context |
| Request without verified tenant context | Tenant-scoped business query cannot proceed |
| Suspended or deleted internal user | Access denied regardless of stored assignments |
| Expired or revoked application session | `401`; reauthentication required |

For the October demo, no frontend tenant switcher is rendered. Both React options consume the same backend-resolved session context.

---

## 9. Future Architectural Requirements

This October decision must not prevent:
- A user belonging to multiple tenants.
- Tenant membership existing independently of business-role assignment.
- Membership lifecycle (`Pending`, `Active`, `Suspended`, `Revoked`).
- Configurable tenant role administration.
- Independent role and tenant membership audit trails.
- Controlled IAM services across multiple applications.
- Tenant-specific capability and visibility policies.
- Administration UI for tenant membership and roles.

Accordingly, tenant authorization must be encapsulated behind a dedicated backend service or repository abstraction:
```typescript
interface ITenantAuthorizationService {
  isTenantAuthorized(userId: string, tenantId: number): Promise<boolean>;
  getAuthorizedTenants(userId: string): Promise<TenantGrant[]>;
}
```
Business services depend on this abstraction rather than directly querying `iam.user_roles`. In a future phase, it can read from a dedicated normalized tenant-membership table without breaking contracts.

---

## 10. Required Implementation Verification

Verification must confirm:
1. All three live Google demo identities have approved, validated tenant-1 assignments.
2. An eligible but unassigned Google user receives Pending Access.
3. `iam.user_roles.tenant_id` matches the assigned role's tenant.
4. Current role and capability assignments are resolved correctly.
5. Historical imported grants do not unintentionally authorize employees.
6. Removing the last authorized role revokes tenant access.
7. Unauthorized tenant-2 requests fail.
8. React cannot override the active tenant through request data.
9. PostgreSQL transaction-local tenant context is enforced under normal application role.
10. Connection pooling does not leak tenant context.
11. IAM lookup and provisioning use reviewed database privileges.
12. Authorization checks, denials, and role changes are auditable.

---

## 11. Technical Illustration (SQL Script)

```sql
SELECT EXISTS (
  SELECT 1
  FROM iam.users u
  JOIN iam.user_roles ur ON ur.user_id = u.id
  JOIN iam.roles r ON r.id = ur.role_id
  WHERE u.id = :internal_user_id
    AND ur.tenant_id = :authorized_tenant_id
    AND r.tenant_id = ur.tenant_id
    AND u.party_kind = 'employee'
    AND u.state = 'active'
    AND u.deleted_at IS NULL
    -- Additional requirement:
    -- role assignment is approved for New CP use
) AS has_tenant_grant;
```
*Note: The approved-assignment check is not represented by a dedicated approval column in V006. That is why the demo account/role seed review and restricted lookup mechanism remain necessary.*

---

## 12. Handoff Package Change Control

- **Target package:** `NewCP_Approved_IAM_Developer_Handoff_v0.9.7_2026-10-26.zip`
- This decision clarifies and supersedes the package's previous unresolved physical tenant-grant source question.
- **Change control:** The handoff package update is explicitly **deferred**. Do NOT regenerate or modify the zip package yet; it will be incorporated alongside Orders Dashboard architectural decisions.
- This clarification changes the October tenant-grant persistence decision only; it does not alter Google authentication policy, approved business-role capabilities, F07 requirements, financial restrictions, or tenant-isolation guarantees.
