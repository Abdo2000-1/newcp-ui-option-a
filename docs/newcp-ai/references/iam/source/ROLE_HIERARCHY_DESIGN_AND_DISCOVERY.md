# Internal V3 Role/Group Hierarchy — Developer Discovery & Safe Design

**Status:** IAM-HIER-001 same-family, transitive Senior/Manager inheritance APPROVED 26 Oct 2026; concrete role codes, child/parent edges and direct grants still require source discovery and mapping. Google Groups are not used. This is a documentation/technical discovery task; do not run DDL automatically.

## 1. Separate the concepts
- **Google login:** verified Google OpenID Connect identity (provider subject, verified email, issuer/audience/expiry checked). No Google Groups / Admin Directory API membership required.
- **V3 user:** `iam.users`. Existing accounts may map to migrated legacy IDs. Safe identity linking requires DB-owner review because V006 does not visibly define a dedicated immutable Google provider-subject link table.
- **Internal group/role:** V3 `iam.roles`, assigned using `iam.user_roles`. Role codes are tenant-scoped. These are not Google Workspace Groups.
- **Capability:** `iam.capabilities`; assigned via `iam.role_capabilities`. Organization `iam.teams` and `iam.team_capabilities` are separate constructs. Validate if team capabilities should affect effective authorization instead of assuming they do.
- **Casbin:** authorizes `(internal_user, tenant, resource, action, attributes)` based on reviewed IAM role/capability membership plus business guards, not a user-supplied role or a Google token `groups` claim.

## 2. Legacy hierarchy discovery
User confirms legacy-style Senior Ops/Junior Ops group grades. Legacy CP `taskPermissions.php` references `AuthGroup` and `AuthPermission`, confirming authorization concepts; exact stored group names, hierarchy edges and privilege differences cannot be derived from this package alone. Read the restored MySQL schema and `AuthGroup`, group membership and permission data (subject to authorized access). **First inspect information_schema for table/column names**; do not assume a parent_group_id exists.

Read-only PostgreSQL seed inventory (adjust tenant context according to approved RLS policy, and use a read-authorized account):
```sql
SELECT r.tenant_id, r.id, r.code, r.name, r.legacy_source, r.legacy_id,
       COUNT(rc.capability_id) AS direct_capability_count
FROM iam.roles r
LEFT JOIN iam.role_capabilities rc ON rc.role_id=r.id AND rc.tenant_id=r.tenant_id
WHERE r.tenant_id=1
GROUP BY r.tenant_id,r.id,r.code,r.name,r.legacy_source,r.legacy_id
ORDER BY r.code;

SELECT r.code AS role_code, c.code AS capability_code
FROM iam.roles r JOIN iam.role_capabilities rc ON rc.role_id=r.id
JOIN iam.capabilities c ON c.id=rc.capability_id
WHERE r.tenant_id=1 AND rc.tenant_id=1
ORDER BY r.code,c.code;
```

Read-only MySQL schema discovery:
```sql
SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA='connect_full'
  AND (LOWER(TABLE_NAME) LIKE 'authgroup%'
       OR LOWER(TABLE_NAME) LIKE 'authpermission%'
       OR LOWER(TABLE_NAME) LIKE '%user%group%')
ORDER BY TABLE_NAME,ORDINAL_POSITION;
```
The MySQL `connect_full` schema name is the known restored source example; adjust if the active authorized source uses another database name.

## 3. Mandatory approved business semantics — IAM-HIER-001
- For EVERY confirmed `parent -> child` link within the SAME CS/OPS/FINANCE/QC (or applicable ADMIN grade) family, effective permissions of the parent are the **union** of its own direct capabilities and ALL child capabilities, recursively (transitive closure).
- Example only (not verified codes): `OPS_MANAGER` inherits `OPS_SENIOR` plus `OPS_JUNIOR`; `OPS_SENIOR` inherits `OPS_JUNIOR`; `OPS_JUNIOR` does **not** inherit permissions exclusive to Senior/Manager.
- For a user holding several internal roles, take the union of each role's effective permission set. The previously approved multi-role data model remains supported; multi-role test execution itself is deferred until after October demo.
- No inheritance across business families. OPS role inheritance cannot grant invoice-processing, QC audit, Admin functions or unrelated service types unless a distinct approved role independently grants them. Scope and business guards are not permissions that can be inherited away.
- Each parent-child edge must be grounded in the legacy group hierarchy or a new explicit approved mapping. **The inheritance rule is approved; the list of real edges is not verified in this package.** A Senior/Manager label alone does not identify its actual descendants.
- Prevent cycles, duplicate edges, cross-tenant role links and cross-family edges; default deny unknown/unmapped roles and edges. Role/hierarchy changes become effective on the next protected request.

## 4. Mapping and technical implementation
Populate `INTERNAL_ROLE_HIERARCHY_MAPPING_TEMPLATE.csv` with verified legacy AuthGroup IDs/names, target role codes, family, direct grants, parent/child role edges, tenant and reviewer/source evidence.

Supported approaches to propose to DB owner:
A. **Flattened effective-capability projection / materialization:** given reviewed parent-child graph, recursively compute each role's full effective grant set and feed Casbin from V3 internal IAM data. Roles in `iam.roles` remain distinct. Recompute/invalidate following assignment or hierarchy changes. Store reviewed edges in a governed mapping/policy source; do not hardcode by naming convention.
B. **Explicit tenant-aware role-hierarchy persistence:** add an approved role-parent/role-link relation and map it to Casbin, with cycle checks, family validation, audit and next-request revocation. This requires new reviewed V3 DDL because inspected V006 does not include native parent-role structure.

Either approach MUST implement IAM-HIER-001 when verified hierarchy relationships exist; do not downgrade inheritance to an optional later-phase feature. Do not assume `iam.teams` or organizational supervisor reporting lines imply IAM hierarchy edges.

## 5. Release gates
- No Google Groups dependency in login / RBAC.
- Verified `iam.roles` and capability seeds for demo users; no role created from email domain.
- Positive same-family Senior/Manager child-permission inheritance (including transitive); negative reverse/cross-family inheritance; unknown mappings deny.
- Tenant 1 grants explicit, report export only Finance/QC/Admin.
- Role update next request, logout revokes session, 30-minute idle/8-hour max configurable.
- Negative tests for missing group, wrong tenant, unseeded grade, unauthorized commercial edits.
