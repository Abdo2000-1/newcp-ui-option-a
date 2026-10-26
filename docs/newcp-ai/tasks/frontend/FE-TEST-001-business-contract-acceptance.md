# Task FE-TEST-001: Business and Contract Acceptance Tests

## Executive Summary
This document registers the comprehensive business and OpenAPI contract acceptance test suite for the New CP React Option A repository. All 22 business scenarios identified in the task briefs and test catalogs are verified using explicit **MOCK / SYNTHETIC** fixtures conforming strictly to OpenAPI 3.0.3 data structures. No live integration is claimed prior to the deployment of an approved staging environment.

---

## 1. Acceptance Scenarios Coverage Register

| # | Business Scenario | Acceptance Criteria | Verified Test Case | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Create Biomodel | Creates new Biomodel instance with UUID and initial aggregate ETag | `1. successfully creates an independent Biomodel service instance` | **PASS** |
| **2** | Create Conversion | Creates new Conversion instance with independent software/format specs | `2. successfully creates an independent Conversion service instance` | **PASS** |
| **3** | Two same-type instances | Creates 2 Biomodels under same order with unique `serviceItemUuid` | `3. creates two same-type service instances under same order` | **PASS** |
| **4** | Independent update | Modifying instance 1 leaves instance 2 strictly untouched | `4. updates two same-type instances independently` | **PASS** |
| **5** | ETag success | Matching `If-Match` completes edit and rotates aggregate ETag | `5. accepts PATCH request with matching If-Match ETag` | **PASS** |
| **6** | Stale ETag 412 | Mismatched `If-Match` triggers `HTTP 412 Precondition Failed` | `6. rejects edit with stale If-Match ETag` | **PASS** |
| **7** | Missing If-Match 428 | Missing `If-Match` on mutating requests triggers `HTTP 428 Precondition Required` | `7. rejects edit without If-Match header` | **PASS** |
| **8** | On Hold without type | Placing on hold without `holdType` raises `HTTP 422 ValidationError` | `8. rejects transition 102 when holdType is missing` | **PASS** |
| **9** | On Hold without reason | Placing on hold without `holdReasonCode` raises `HTTP 422 ValidationError` | `9. rejects transition 102 when holdReasonCode is missing` | **PASS** |
| **10** | Atomic On Hold | Supplying both `holdType` and `holdReasonCode` atomically transitions state | `10. executes atomic On Hold request` | **PASS** |
| **11** | Authorized price override | Authorized caller updates price without losing other fields | `11. allows authorized unit price override` | **PASS** |
| **12** | Unauthorized price edit | Unauthorized caller or `canEditPrice: false` raises `HTTP 403` | `12. rejects price override when caller is unauthorized` | **PASS** |
| **13** | Zero charge without reason | 0.00 line total without reason violates constraint `ck_order_items__zero_charge_has_reason` (422) | `13. rejects 0.00 line total without zeroChargeReasonCode` | **PASS** |
| **14** | Zero charge with reason | 0.00 line total with valid reason succeeds | `14. accepts 0.00 line total when zeroChargeReasonCode supplied` | **PASS** |
| **15** | Independent isBillable | `isBillable` toggles independently without mutating payer | `15. allows toggling isBillable independently of contact` | **PASS** |
| **16** | Independent Bill To | Assigning item-level payer does not affect order contact or other items | `16. updates item-level payer without altering other services` | **PASS** |
| **17** | Financial lock | Modifying invoiced item (`isInvoiced: true`) raises `HTTP 403 PermissionDeniedError` | `17. rejects modifications when service item is invoiced` | **PASS** |
| **18** | Unauthorized response | HTTP 401 raises `AuthenticationError` without silent retry | `18. handles 401 Unauthorized response from transport` | **PASS** |
| **19** | Forbidden response | HTTP 403 raises `ApiClientError`/`PermissionDeniedError` without mock fallback | `19. handles 403 Forbidden response without mock fallback bypass` | **PASS** |
| **20** | Same-tenant behavior | Scoped to tenant boundary; uses public UUIDs; no raw `tenant_id` exposed | `20. strictly isolates entities within tenant scope` | **PASS** |
| **21** | Safe error presentation | Error responses never leak database primary keys or patient PHI | `21. error objects never expose raw database bigints or PHI` | **PASS** |
| **22** | No invented fallback values | Missing optional fields evaluate to undefined/empty, never invented values | `22. unpopulated fields return explicit undefined/null` | **PASS** |

---

## 2. Test Execution Details
- Test runner: Vitest 5.0.5 (`vitest run src/shared/api/__tests__/businessContractAcceptance.test.ts --run`)
- All 22 tests pass synchronously with 0 failures.
- No live backend integration is claimed. Real integration requires approved backend deployment per Task `FE-INTEGRATION-001`.
