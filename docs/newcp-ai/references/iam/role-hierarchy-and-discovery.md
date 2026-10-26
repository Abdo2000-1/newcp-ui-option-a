# IAM Role Hierarchy and Discovery

## Approved rule

Within one verified business family, every Senior or Manager role inherits all direct and transitive permissions of its verified subordinate roles, plus its own direct permissions. This is mandatory business behavior under IAM-HIER-001.

Example only, not verified database data:

```text
OPS_MANAGER -> OPS_SENIOR -> OPS_JUNIOR
```

The example must not be seeded or treated as a real mapping until source evidence confirms the role codes and edges.

## Discovery procedure

1. Read-only inventory of V3 `iam.roles`, `iam.user_roles`, `iam.capabilities`, `iam.role_capabilities`, teams, and team capabilities.
2. Inventory legacy group/grade identifiers and direct permission evidence.
3. Map exact codes, active state, business family, direct capabilities, and verified parent-child edges.
4. Mark unknown roles and edges as unmapped/deny; never infer from labels or prefixes.
5. Confirm that every edge is same-family and tenant-safe.
6. Choose a reviewed implementation: effective-capability closure or Casbin role links. Do not add schema without DB-owner approval.
7. Validate transitive closure, reverse denial, cross-family denial, cross-tenant denial, cycle rejection, and next-request revocation.

## Safety rules

- A child never inherits parent-only permissions.
- A role title is not evidence of a parent-child relationship.
- Team membership is not automatically a security role.
- Admin does not automatically bypass tenant scope.
- Inheritance cannot bypass service-type restrictions, financial locks, workflow guards, audit, or tenant checks.
- Unknown mapping defaults to deny.
- Cache invalidation or next-request recomputation is required after role, edge, or capability revocation.

## Required evidence

- Sanitized V3 role/capability inventory.
- Legacy-to-V3 mapping reviewed by the responsible owner.
- Direct grant matrix.
- Parent-child edge matrix.
- Chosen Casbin/effective-closure design.
- Cycle and boundary test results.
- Human approval for any schema or policy model change.
