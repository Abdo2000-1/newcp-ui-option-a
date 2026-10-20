# Testing Strategy and Quality Gates

## Current capability

This repository defines `dev`, `build`, and `lint` scripts in its `package.json`. The application source was not changed to repair dependency metadata. On 2026-10-20, the following checks were executed from this repository:

| Check | Actual result | Limitation |
|---|---|---|
| `npm ci` | Failed | The committed `package-lock.json` is out of sync with `package.json`; npm reported missing Three.js/Rapier/Tween/types entries. |
| `node node_modules/typescript/bin/tsc -b` | Passed | Used the locally available dependency tree because npm's binary links were unavailable. |
| `node node_modules/vite/bin/vite.js build` | Passed | Vite emitted a `__dirname` config warning and a large-chunk warning; no source files were changed. |
| `node node_modules/oxlint/bin/oxlint src` | Failed | Existing lint findings were reported; no lint rule or source was weakened. |
| `git status --short --branch` | Clean | `main` tracks `upstream/main`; no tracked files were modified. |

The repository does not currently provide a verified automated unit/component/E2E test command. The checks below remain required categories for future approved implementation work.

## Required testing levels

| Level | Scope | Minimum scenarios | Evidence |
|---|---|---|---|
| Unit | Validators, domain rules, state/data mapping, error normalization | Normal, invalid, boundary, unauthorized/invalid transition, retry behavior where applicable | Test report and changed-logic coverage if available |
| Component/UI | Option A and Option B critical interactions | Forms, validation display, loading, empty, error, permissions, responsive behavior | Component test result plus sanitized screenshot/manual record where needed |
| API/contract | Approved OpenAPI and endpoint behavior | Request/response schemas, status/error conventions, auth/tenant requirements | OpenAPI lint and contract test report |
| Integration | Backend with controlled PostgreSQL V3, cache, auth, telemetry as applicable | Relationships, tenant isolation, repeated same-type instances, status history, cache invalidation | Reproducible integration result using appropriate app role |
| End-to-end | Priority CEO-demo journeys in both UIs | Login, report, Models, Conversion, invalid then valid write, edit/reopen, transition/history, duplicate same-type, final report | Run record with environment/build/data baseline |
| Accessibility/responsive | Critical actions across desktop/tablet/mobile | Keyboard/focus, labels/errors, readable layout, navigation, touch-size/overflow checks | Manual or automated report with viewport and limitations |
| Release/operations | Build and demo repeatability | Clean checkout, pinned dependencies, Docker readiness, fallback/rollback, telemetry freshness | CI/runbook/release candidate evidence |

## Project-specific test matrix

| Test ID | Requirement | Scenario | Expected result |
|---|---|---|---|
| T-001 | REQ-003 | Valid Models/Conversion create, edit, reopen | Record persists and reload shows the same approved fields |
| T-002 | REQ-003 | Invalid input and unauthorized mutation | Actionable error; no partial record or side effect |
| T-003 | REQ-004 | Create two same-type instances in one order | Both survive reload with distinct stable IDs |
| T-004 | REQ-004 | Update/transition instance #2 then #1 | Each changes independently; history/actor/time remain separate |
| T-005 | REQ-004 | Report aggregation after duplicate create/update | Counts instances correctly and reconcile to baseline |
| T-006 | REQ-005 | Login/logout, protected route, 401/403, cross-tenant access | Approved auth flow works; unauthorized/cross-tenant access is denied or hidden |
| T-007 | REQ-006 | Tenant-scoped query through pooled connection reuse | No tenant leakage; missing context fails closed |
| T-008 | REQ-013 | Redis report hit/miss and mutation invalidation | Tenant-safe keying and affected-cache invalidation are observable |
| T-009 | REQ-013 | Sentry test-only error and recovery | Tagged safe event captured; normal success window remains valid |
| T-010 | REQ-012 | Both UIs against same prepared baseline | Functional outcomes are equivalent and comparison is fair |
| T-011 | REQ-011 | Logs/metrics/screenshots/evidence review | No secret, PHI, customer data, or unbounded sensitive label |

## Quality gates

Run only gates supported by the actual repository: dependency install from lockfile, lint, typecheck, unit/component tests, contract tests, integration tests, production build, Docker image validation, and SonarQube/quality scan where available. Do not invent a coverage threshold. The package mentions an 80% new backend business-logic target as a discussion proposal, not an approved universal requirement.

## Manual test evidence

For unavailable automation, record the exact environment, build/commit, dataset baseline, steps, expected/actual result, screenshots or recording path, reviewer, and limitation. Manual evidence does not prove more than the tested scenario.
