# IAM-004: Acceptance Test Coverage (AT-001 through AT-052)

## Status: IMPLEMENTED (SYNTHETIC & CONTRACT SUITE PASSING 100%)
- **Branch:** `test/IAM-004-iam-acceptance-coverage`
- **Specification Baseline:** `ACCEPTANCE_TESTS.csv` / `API_ERROR_CONTRACT.md` / `IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`
- **Authoritative Enforcement Rule:** `.agents/rules/iam-authorization.md`

---

## 1. Scope & Coverage Summary

Automated synthetic and contract acceptance tests covering the canonical test scenarios cataloged in `docs/newcp-ai/references/iam/source/ACCEPTANCE_TESTS.csv`:

1. **Dimension 1: Google Identity & Groupless Boundary (AT-001 - AT-006, AT-038, AT-039)**:
   - Google Sign-In authenticates identity ONLY; Workspace Google Groups are strictly excluded.
   - Internal employees without role assignments receive `pending_access` status.
   - Unassigned identities requesting protected resources receive `403 ACCESS_NOT_ASSIGNED`.
   - Spurious or forged token group claims cannot elevate privileges.
2. **Dimension 2: Tenant Isolation & Boundaries (AT-007, AT-008, AT-026 - AT-028, AT-050)**:
   - Active session strictly pinned to `tenant_id = 1` for October demo.
   - Requests targeting other tenants (`tenant_id = 2`) are rejected with `403 TENANT_ACCESS_DENIED`.
   - Inherited capabilities never bypass tenant boundaries.
3. **Dimension 3: Administration & Privilege Boundary (AT-010, AT-011, AT-042, AT-043)**:
   - Only `ADMIN` role is authorized to perform `iam.roles.assign`.
   - Non-admin roles (`CS`, `OPS`) attempting role mutation are rejected with `403 PERMISSION_DENIED`.
4. **Dimension 4: Commercial & Financial Boundaries (AT-013 - AT-021, AT-036, AT-037)**:
   - `CS` and `OPS` have price override permissions on Models/Conversion service instances.
   - Ops cannot operate on unsupported Restoration services (`403`).
   - CS is denied financial actions (`invoices.generate`).
   - Concurrency & ETag validation: `412 STALE_PRECONDITION` on stale edits, `428 PRECONDITION_REQUIRED` on missing `If-Match`.
   - Zero-charge validation requires `zeroChargeReasonCode` (`422 ZERO_CHARGE_REASON_REQUIRED`).
5. **Dimension 5: Reporting Viewing & Export Boundaries (AT-022 - AT-025)**:
   - All 5 families (`CS`, `OPS`, `FINANCE`, `QC`, `ADMIN`) can view sanitized reports (`reports.view_all`).
   - Report export (`reports.export`) is strictly forbidden for `CS` and `OPS` (`403 PERMISSION_DENIED`).
   - `FINANCE`, `QC`, and `ADMIN` are authorized to export reports.
6. **Dimension 6: Session Lifecycle & Inactivity (AT-029 - AT-033)**:
   - Idle timeout constant verified at 30 minutes (`1,800,000 ms`).
   - Absolute lifetime verified at 8 hours (`28,800,000 ms`).
   - Unauthenticated requests return `401 AUTHENTICATION_REQUIRED`.
7. **Dimension 7: Same-Family Transitive Role Inheritance (AT-041, AT-047 - AT-052)**:
   - `OPS_SENIOR` automatically inherits `OPS_JUNIOR` capabilities within `OPS` family.
   - `OPS_MANAGER` transitively inherits `OPS_JUNIOR` through `OPS_SENIOR`.
   - Reverse inheritance is prohibited (Junior cannot invoke Senior capabilities).
   - Cross-family inheritance is strictly prohibited (`OPS_SENIOR` cannot inherit `FINANCE`).

---

## 2. Test Execution & Evidence

```text
RUN vitest run src/shared/api/__tests__/iamAcceptanceCoverage.test.ts --run

✓ src/shared/api/__tests__/iamAcceptanceCoverage.test.ts (25 tests) 14ms

Test Files  1 passed (1)
     Tests  25 passed (25)
  Duration  1.61s
```

Full repository regression verification:
```text
Test Files  52 passed (52)
     Tests  481 passed (481)
  Duration  60.65s
```
- TypeScript check (`npx tsc -b --pretty false`): **0 errors**
- Build verification (`npm run build`): **Clean production bundle**
