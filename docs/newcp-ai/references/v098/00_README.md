# New CP v0.9.8 REVIEW Reference Package

**Package:** `NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_20261028`
**Source authority:** v0.9.8 revision supplement (additive revision of v0.9.7)
**Integrated:** 2026-10-28
**Status:** APPROVED business decisions; implementation and runtime verification still required

> [!IMPORTANT]
> This directory holds the repository-integrated engineering summary for the v0.9.8 REVIEW handoff.
> All original v0.9.7 files are copied unchanged; new/updated review status is in the
> `2026-10-28_DASHBOARD_IAM_API_UPDATES/` supplement within the source package.

## What v0.9.8 adds / clarifies

| Item | Decision | Status |
|---|---|---|
| Orders Dashboard scope | DESIGN-ONLY for both React candidates. No API integration assignment. | APPROVED |
| Google login contract | POST /api/v1/auth/login {idToken} -> AUTHORIZED {accessStatus,token,expiresAt} or PENDING_ACCESS {accessStatus} (no token) | APPROVED |
| GET /api/v1/auth/me | Returns email, userUuid, tenantSlug, roleCodes, capabilities, isPendingAccess | APPROVED |
| POST /api/v1/auth/logout | Revokes server session; bearer token required | APPROVED |
| IAM implementation | Hesham reported COMPLETE (Google OIDC + PostgreSQL IAM/Casbin + tenant-controlled sessions) | OWNER_REPORTED_COMPLETE; RUNTIME_NOT_VERIFIED_BY_THIS_REPO |
| F07 Bill To | Separation of billed_to_contact_id/payer provenance from is_billable reported COMPLETE | OWNER_REPORTED_COMPLETE; RUNTIME_NOT_VERIFIED_BY_THIS_REPO |
| Admin role | 1 tenant-1 admin, is_system=true, 20 approved seeded capabilities | APPROVED |
| Dashboard API contract | 02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml is PROPOSED; NOT deployed canonical API | PROPOSED_ONLY |
| OD decisions OD-01..OD-24 | Orders Dashboard business decisions for design reference | APPROVED_DESIGN_ONLY |

## Reading order

1. 00_README.md (this file)
2. 01_AUTH_CONTRACT.md -- Google auth, session, /auth/me, /auth/logout, error handling
3. 02_ORDERS_DASHBOARD_SCOPE.md -- Dashboard design scope, OD decisions, synthetic data rules
4. 03_IAM_ADMIN_ADDENDUM.md -- Admin role addendum, capability codes, provisioning rules
5. 04_BLOCKERS_AND_PENDING.md -- All known blockers, verification dependencies, pending items

## What these references do NOT authorize

- No database migration, ETL run, privileged SQL, or production operation.
- No real patient data, credentials, tokens, production dumps, or sensitive screenshots.
- No invented endpoint, field, callback URL, permission, or persistence claim.
- No backend code changes (backend IAM is reported complete by Hesham; do not reimplement).
- No deployment of the Orders Dashboard API contract.
- No merger of the proposed dashboard YAML into the canonical newcp.openapi.yaml.
- No frontend integration of the proposed Orders Dashboard API endpoints.
