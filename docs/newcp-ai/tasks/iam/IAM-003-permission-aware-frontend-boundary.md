# IAM-003: Permission-Aware Frontend Boundary & Error Contract

## Status: IMPLEMENTED (CAPABILITY HOOK & RFC 7807 ERROR MAPPINGS)
- **Branch:** `feat/IAM-003-permission-aware-frontend-boundary`
- **Specification Baseline:** IAM Approved Business Spec v1.2 / API Error Contract Supplement
- **Authoritative Enforcement Rule:** `.agents/rules/iam-authorization.md`

---

## 1. Objectives & Architectural Boundaries

1. **Capability-Driven UI Authorization:**
   - Central hook `useAuthorization()` exposes fine-grained capability checks (`can(capability)`), business family membership (`hasFamily(family)`), and reporting permissions.
   - Frontend controls are adapted according to role capabilities, but frontend visibility is strictly treated as UX guidance rather than security enforcement.
   - Backend PostgreSQL V3 IAM + Casbin remain the authoritative enforcement engine.
2. **Business Family Reporting Rules:**
   - All five business families (`CS`, `OPS`, `FINANCE`, `QC`, `ADMIN`) are permitted to view reports.
   - Report export (`reports.export`) is strictly restricted to `FINANCE`, `QC`, and `ADMIN`.
   - `CS` and `OPS` roles have export actions disabled with explanatory tooltip feedback: *"Report export is restricted to Finance, QC, and Admin roles."*
3. **IAM RFC 7807 Error Contract Mapping (`API_ERROR_CONTRACT.md`):**
   - `401 AUTHENTICATION_REQUIRED` -> `AuthenticationRequiredError`
   - `401 SESSION_EXPIRED` -> `SessionExpiredError`
   - `403 ACCESS_NOT_ASSIGNED` -> `AccessNotAssignedError` (routes to `PendingAccessView`)
   - `403 PERMISSION_DENIED` -> `InsufficientPermissionsError`
   - `403 TENANT_ACCESS_DENIED` -> `TenantAccessDeniedError`
   - Preserves Q-B8 / Q-B10 contract errors: `412 STALE_PRECONDITION`, `428 PRECONDITION_REQUIRED`, `422 VALIDATION_ERROR`.

---

## 2. Changes Summary

- `src/shared/hooks/useAuthorization.ts`: Capability verification hook with family checks, report export restriction enforcement, and unassigned/pending-access guards.
- `src/shared/hooks/index.ts`: Exported `useAuthorization` and `AuthorizationContext`.
- `src/shared/api/errors.ts`: Added typed error constructors for `AccessNotAssignedError`, `SessionExpiredError`, `AuthenticationRequiredError`, and `InsufficientPermissionsError`; updated `normalizeProblemError` parser.
- `src/features/reporting/pages/Reports.tsx`: Wrapped Export CSV action with `canExportReports` gate, disabling the button and providing tooltip feedback for unauthorized roles.
- `src/features/models/pages/Task47ModelWorkReport.tsx`: Export CSV button gated with `canExportReports` and disabled state tooltip.
- `src/features/reporting/pages/QuarterTargetsReport.tsx`: Export PDF action gated with `canExportReports`.
- `src/shared/hooks/__tests__/useAuthorization.test.tsx`: 5 acceptance unit tests covering role capability checking, pending access blocking, family export gates, and RFC 7807 error normalization.

---

## 3. Verification & Evidence

- `npm test -- src/shared/hooks/__tests__/useAuthorization.test.tsx --run`: **5/5 passed**
- `npm test -- src/features/reporting/pages/__tests__/ReportsPrintExport.test.tsx --run`: **5/5 passed**
- `npx tsc -b --pretty false`: **Clean (0 errors)**
- `npm run build`: **Clean build**
