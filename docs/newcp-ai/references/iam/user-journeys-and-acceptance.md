# IAM User Journeys and Acceptance Baseline

All scenarios begin as `NOT_RUN` until executed against the approved environment. Synthetic fixtures are not live evidence.

## Core journeys

1. Google login verifies identity through the backend; it does not assign role or tenant.
2. Eligible but unassigned users see Pending Access and protected APIs return `403 ACCESS_NOT_ASSIGNED`.
3. Explicitly authorized CS, OPS, and Admin demo identities enter tenant 1 with only their permitted actions.
4. Admin assigns/revokes an internal role; the change is audited and applies on the next protected request.
5. CS/OPS perform only approved operational and commercial actions; they cannot perform Finance-only transactions.
6. All families view reports; only Finance, QC, and Admin export/download.
7. Unauthorized, cross-tenant, wrong-service-type, and financially locked operations fail without mutation or data leakage.
8. Senior/Manager inheritance is positive only along verified same-family edges; reverse, cross-family, cross-tenant, cycle, and revoked-edge cases fail.
9. Session idle/absolute expiry and logout revocation produce `401`.

## Acceptance mapping

The source package defines AT-001 through AT-052. The highest-priority groups are:

- AT-001..012: authentication, provisioning, Pending Access, tenant assignment, Admin role changes, revocation.
- AT-013..021: commercial permissions, Bill To, price, billability, financial lock, concurrency, validation.
- AT-022..027: report viewing/export and tenant isolation.
- AT-029..035: expiry, logout, denial audit, payload sanitization.
- AT-036..039: independent service instances and no Google Groups privilege.
- AT-040..046: granular roles, Admin assignment, unknown mappings, refresh, team separation.
- AT-047..052: transitive inheritance, reverse/family/tenant boundaries, cycles, revocation.

Each test record must include actor fixture, tenant, role/capability source, request, expected status, mutation check, audit evidence, environment, and limitation.
