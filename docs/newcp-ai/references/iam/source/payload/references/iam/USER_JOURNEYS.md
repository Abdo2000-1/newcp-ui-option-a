# New CP — IAM User Journey Cards (updated Oct 26, 2026)

**Reference:** `../../policy/IAM_APPROVED_BUSINESS_SPEC_v1.2.md`. Each journey is a business outcome contract; endpoints/UI labels are illustrative implementation details. Demo test identities: CS, OPS, ADMIN (three Google identities); Finance/QC checked through automated fixtures.

| Journey | Actor | Preconditions | Success | Negative/alternative path | Acceptance |
|---|---|---|---|---|---|
| J-01 First Google login | eligible employee | verified @3ddx.com or approved demo identity | internal identity linked/provisioned; no role automatically granted | ineligible/invalid identity rejected; unassigned pending with business API 403 | AT-001..006 |
| J-02 Authorized login | CS/OPS/ADMIN | active internal user, explicit tenant grant, assigned role | scoped workspace, protected APIs check on each request | suspended/missing tenant/permission denied | AT-007..009 |
| J-03 Admin assigns role | ADMIN | own authorized tenant, target user exists | role stored+audited; effective next request | non-admin denied; cross-tenant denied | AT-010..012 |
| J-04 Service edit/transition | CS/OPS | existing order and service within scope | validate and atomically persist update with history | wrong type/financial lock/stale ETag/invalid hold | AT-013..021 |
| J-05 Reports view/export | any | authorized tenant report, sanitized demo data | all five roles view; Finance/QC/Admin export | CS/OPS download/export forbidden server side | AT-022..025 |
| J-06 Tenant denial | assigned employee | tenant 1 assigned; tenant 2 isolated fixture | no tenant 2 data leaks | direct item URL/tenant parameter refused | AT-026..028 |
| J-07 Logout and session expiry | authorized user | active session | revoke on logout/expire 30 min idle or 8 h max | expired session 401 | AT-029..032 |

Detailed step-by-step and validation rules are in sections 4–6 of the approved spec. All actors and outcomes must be auditable in the agreed format.

## J-08 — Resolve granular internal role/grade (v1.2 — approved inheritance)
**Actor:** Google-authenticated employee mapped to an existing V3 user with approved tenant grant and a granular internal role (e.g. one actual Ops grade). **Success:** backend reads the exact `iam.user_roles` and approved role/capability projection, Casbin permits direct plus mandatory inherited child actions along verified same-family role links for tenant and service type. **Negative:** unrecognized or unapproved grade mapping confers no higher permissions. Once a same-family Senior/Manager→child relationship is verified, Senior/Manager MUST inherit all child capabilities, recursively; a child must NOT inherit parent-only capabilities. Titles alone do not establish which concrete role links exist. Confirm actual role codes and grade differences before creating live examples. **Google Group membership is never evaluated.**

## J-09 — Admin assigns a granular internal group
**Actor:** tenant-authorized ADMIN. **Flow:** choose internal V3 role/code from approved list; assign/revoke to target user; audit user, role, tenant and effective scope; new permissions take effect on next protected request. Group codes are internal role IDs and may be grade-specific. **Negative:** unapproved group/code, non-admin, or wrong-tenant update denied and security audited.

