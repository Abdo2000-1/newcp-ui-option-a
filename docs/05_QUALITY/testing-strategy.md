# Testing Strategy and Quality Gates

## Current capability

As of Task T-002 (2026-10-21), this repository has a fully functional, verified testing and continuous integration foundation. The test runner is **Vitest** (v5) integrated with **React Testing Library** (v16) and **JSDOM** (v30).

| Check | Actual result | Scope / Command | Evidence |
|---|---|---|---|
| Dependency Installation | Passed (Exit 0) | `npm ci` | Deterministic lockfile resolution without fallback |
| Architecture & Code Lint | Passed (Exit 0) | `npm run lint` (`oxlint`) | 0 errors across 118 files (427 baseline warnings preserved) |
| TypeScript Strict Check | Passed (Exit 0) | `npx tsc -b` | 0 errors across entire codebase |
| Automated Unit & Component Tests | Passed (Exit 0) | `npm run test` (`vitest run`) | 44 tests passed across 7 test suites |
| Production Build | Passed (Exit 0) | `npm run build` (`tsc -b && vite build`) | Built production bundle in < 2.0s to `dist/` |
| Local Docker Daemon | Blocked (Local limitation) | `docker info` | Docker CLI 29.9.1 installed; local daemon (`dockerDesktopLinuxEngine`) not running |
| CI Docker Image Build | Configured in CI | `docker build -t 3ddx-clinical-engine:ci .` | Validated in GitHub Actions `ubuntu-latest` runner |
| SonarQube Quality Scan | Conditional Integration | Safe conditional step in `.github/workflows/ci.yml` | Requires `SONAR_HOST_URL`, `SONAR_TOKEN`, `SONAR_PROJECT_KEY` |

---

## Baseline Automated Test Suites

The automated test suites cover normal, invalid, loading, empty, and error behavior across shared utilities, domain error classes, atomic UI components, and shell architecture:

1. **`src/shared/utils/__tests__/format.test.ts` (15 tests)**:
   - Date formatting (`formatDate` normal, with time, boundaries).
   - Relative timestamps (`timeAgo` for just now, minutes, hours, days).
   - Currency formatting (`formatCurrency` positive, zero).
   - Initials extractor (`getInitials` single, multiple words, casing).
   - Text truncation (`truncate` within bounds, exceeding max length).
   - Conditional CSS classes (`cn` merging truthy, filtering falsy/null/undefined).

2. **`src/shared/api/__tests__/errors.test.ts` (4 tests)**:
   - `ApiClientError` baseline (status, detail, type, instance).
   - `AuthenticationError` (HTTP 401 convention).
   - `TenantAccessDeniedError` (HTTP 403 convention).
   - `ClinicalApprovalRequiredError` (HTTP 409 manufacturing guard).

3. **`src/shared/components/__tests__/Button.test.tsx` (5 tests)**:
   - Normal rendering with children.
   - Variant styling (`primary`, `secondary`, `danger`, `ghost`, `outline`).
   - Loading state (shows spinner, disables interaction).
   - Disabled state (disables DOM element, prevents click events).
   - Click event triggering.

4. **`src/shared/components/__tests__/StatusBadge.test.tsx` (4 tests)**:
   - Normal status rendering.
   - Size variations (`sm`, `md`).
   - Fallback styling for unrecognized status values.

5. **`src/shared/components/__tests__/UIStates.test.tsx` (9 tests)**:
   - `LoadingState`: default copy, custom message, skeleton pulse rows.
   - `EmptyState`: title, description, custom action button.
   - `ErrorState`: default error title, error code, custom message, retry interaction with timer advance.
   - `UIStateSwitcher`: 4 simulation states (`normal`, `loading`, `empty`, `error`), callback triggers.

6. **`src/app/providers/__tests__/ErrorBoundary.test.tsx` (3 tests)**:
   - Clean rendering of healthy child components.
   - Interception of rendering exceptions and fallback rendering.
   - Custom fallback presentation.

7. **`src/app/shell/__tests__/Header.test.tsx` (4 tests)**:
   - Quick search input rendering with placeholder.
   - Mobile hamburger menu button click event.
   - Notification dropdown toggle.
   - Theme switch toggle.

---

## Required Testing Levels & Traceability

| Level | Scope | Minimum scenarios | Current Status |
|---|---|---|---|
| **Unit** | Validators, domain rules, state/data mapping, error normalization | Normal, invalid, boundary, retry behavior | Fully operational via Vitest |
| **Component/UI** | Option A critical interactions | Loading, empty, error, buttons, navigation shell | Fully operational via Testing Library |
| **Contract** | OpenAPI and endpoint schemas | Request/response schemas, 401/403/409 error models | Error domain classes covered; live OpenAPI pending backend |
| **Integration** | Backend PostgreSQL V3, cache, auth | Tenant isolation, duplicate same-type instances | Pending backend availability |
| **E2E** | Critical CEO-demo journeys | Login, report, Models, Conversion | Follow-up candidate (Playwright/Cypress) |
| **Operations** | Build and container repeatability | Pinned dependencies, Dockerfile multi-stage build | Pinned via package-lock.json; Docker build tested in CI |

---

## SonarQube & Infrastructure Dependency Status

Per engineering standards:
- No fabricated SonarQube credentials, URLs, or fake analysis results are permitted.
- **Missing Required Inputs**:
  1. `SONAR_HOST_URL` (Host URL of SonarQube / SonarCloud instance).
  2. `SONAR_TOKEN` (Repository authentication token with analysis permissions).
  3. `SONAR_PROJECT_KEY` (Official project key registered in SonarQube).
- **Safe Integration Point**: `.github/workflows/ci.yml` has a conditional step that will only execute when `SONAR_TOKEN` secret is configured in the GitHub repository settings.
