# v0.9.8 Blockers and Pending Items

**Source:** NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_20261028

## Authentication Blockers

| ID | Item | Owner | Status |
|---|---|---|---|
| AUTH-B01 | Google OAuth client ID and allowed JS origins | Hesham | BLOCKED |
| AUTH-B02 | Live POST /api/v1/auth/login verification | Hesham | NOT_VERIFIED |
| AUTH-B03 | Persistence behavior across page reload | Hesham | PARTIAL |
| AUTH-B04 | Exact refresh/re-auth behavior on token expiry | Hesham | PARTIAL |
| AUTH-B05 | Exact 401/403 error code matrix | Hesham | PARTIAL |
| AUTH-B06 | Idle and max timeout enforcement | Hesham | PARTIAL |

## IAM Blockers

| ID | Item | Owner | Status |
|---|---|---|---|
| IAM-B01 | Canonical capability code strings (beyond listed) | Hesham | EVIDENCE_REQUIRED |
| IAM-B02 | Exact V3 role codes and direct grants | Backend | EVIDENCE_REQUIRED |
| IAM-B03 | Native parent-role relation in V3 schema | DBA | EVIDENCE_REQUIRED |
| IAM-B04 | Casbin model/policy wiring | Backend | EVIDENCE_REQUIRED |
| IAM-B05 | Live Casbin authorization enforcement | Runtime | NOT_VERIFIED |

## API Contract Blockers

| ID | Item | Owner | Status |
|---|---|---|---|
| API-B01 | V3 applied migration V204 verification | DBA | NOT_VERIFIED |
| API-B02 | ETL stage-90 reconciliation | ETL owner | NOT_VERIFIED |
| API-B03 | Selected tenant catalog codes/UUIDs | Backend | BLOCKED |
| API-B06 | GET /api/v1/session/context endpoint | Backend | MISSING from canonical OpenAPI |
| API-B07 | ETag browser header exposure in CORS config | Hesham | NEEDS_VERIFICATION |
| API-B09 | Create parent order endpoint | Backend | BLOCKED |
| API-B11 | Patient data contract and PHI policy | Backend/legal | OPEN |
| API-B12 | Report export endpoint | Backend | OPEN |

## Dashboard Integration Blockers

ALL dashboard API integration items are NOT ASSIGNED to frontend.
Dashboard is DESIGN-ONLY. See 02_ORDERS_DASHBOARD_SCOPE.md.

| ID | Item | Owner | Status |
|---|---|---|---|
| DASH-B01 | Backend dashboard API implementation | Backend | NOT_ASSIGNED_TO_FE |
| DASH-B02..B10 | Various dashboard data provenance items | Various | NOT_ASSIGNED_TO_FE |

## Acceptance Test Status

| Suite | Count | Status |
|---|---|---|
| IAM acceptance tests (AT-001..AT-052) | 52 | NOT_RUN |
| Tenant acceptance tests (TEN-01..TEN-30) | 30 | NOT_RUN |
| Dashboard tests | 13 (backend) | NOT_CURRENT_FE_ASSIGNMENT |

## Change Log

| Date | Change | Source |
|---|---|---|
| 2026-10-28 | v0.9.8 blockers and pending items recorded | v0.9.8 REVIEW handoff |
| 2026-10-28 | Dashboard scope clarification: DESIGN-ONLY | 00_README_REVISION_SCOPE.md |
| 2026-10-28 | Auth contract recorded: login/me/logout | 00_README_REVISION_SCOPE.md |
| 2026-10-28 | IAM Admin addendum: 20 caps, provisioning rules | 00_README_REVISION_SCOPE.md |
