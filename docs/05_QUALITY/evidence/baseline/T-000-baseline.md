# Task T-000: Engineering Baseline Evidence

**Task Identifier:** `T-000`  
**Document Identifier:** `EVID-T000-BASELINE-2026-10-20`  
**Execution Date:** 2026-10-20  
**Environment:** Windows (PowerShell), Node.js v24.18.0, npm 12.0.2  
**Repository:** `newcp-ui-option-a` (`H:\3DDX\DEMO\newcp-ui-option-a`)  
**Target Branch:** `docs/T-000-engineering-baseline`  
**Base Commit:** `74a7e362a5c37bfb11988f1c23ba096fa6c8d052`  

---

## 1. Git Status & Repository Baseline

### 1.1 Commit Details
```text
Commit:  74a7e362a5c37bfb11988f1c23ba096fa6c8d052
Author:  Abdo Al Adawy <abdoaladawy2006@gmail.com>
Date:    Tue Oct 20 15:17:52 2026 +0300
Subject: chore: add Antigravity engineering workflow
```

### 1.2 Remote Repositories
```text
origin    https://github.com/Abdo2000-1/newcp-ui-option-a.git (fetch & push)
upstream  https://github.com/Abdo2000-1/cp-pro-max.git (fetch & push)
```

### 1.3 Active Branch
```text
docs/T-000-engineering-baseline
```

---

## 2. Repository Structure

```text
H:\3DDX\DEMO\newcp-ui-option-a/
├── .agents/                    # Antigravity rules, agents, skills
├── .claude/                    # Claude compatibility configuration
├── .github/                    # CI workflows & issue/PR templates
│   └── workflows/ci.yml        # CI definition (typecheck + build)
├── docs/                       # Project documentation tree
│   ├── 00_READ_FIRST.md
│   ├── 00_SOURCE_INVENTORY.md
│   ├── 01_PROJECT/             # architecture-understanding-report.md, SRS.md, SDS.md
│   ├── 02_REQUIREMENTS/        # requirements-inventory.md, open-questions.md
│   ├── 03_WORKFLOW/            # workflow.md, definition-of-done.md, ownership/abdo.md
│   ├── 04_INTEGRATION/         # openapi-status.md
│   ├── 05_QUALITY/             # testing-strategy.md, evidence/baseline/
│   └── 90_PRODUCT_REFERENCE/   # TeethChart reference documents
├── public/                     # Static assets & 12 mock JSON datasets
├── src/                        # React 19 / TypeScript / Vite application
├── package.json                # Project dependencies and npm scripts
├── package-lock.json           # Deterministic lockfile (v3)
└── vite.config.ts              # Vite 8 bundler configuration
```

---

## 3. Package Scripts & Dependencies State

### 3.1 Declared Scripts (`package.json`)
| Script | Command | Category | Verification Status |
|---|---|---|---|
| `dev` | `vite` | Development server | Present |
| `build` | `tsc -b && vite build` | Compilation & bundling | Executed (PASSED) |
| `lint` | `oxlint` | Static analysis | Executed (FAILED: 1 error, 421 warnings) |
| `preview` | `vite preview` | Static asset preview | Present |
| *test* | *None configured* | Automated testing | **MISSING** (No test runner) |

### 3.2 Dependency Inventory
- **Core Framework:** `react` 19.2.8, `react-dom` 19.2.8.
- **Routing:** `react-router-dom` 7.18.4.
- **Styling:** `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3.
- **Graphics & 3D:** `three` 0.180.0, `@types/three` 0.180.0.
- **Icons & UI:** `lucide-react` 1.48.0, `framer-motion` 13.4.4, `clsx` 2.1.1.
- **Data & Visualizations:** `recharts` 3.10.1, `powerbi-client` 2.25.0, `powerbi-client-react` 2.0.2.
- **Dev Tools:** `typescript` ~6.0.2, `vite` 8.3.0, `oxlint` 1.81.0, `@vitejs/plugin-react` 6.1.1.

---

## 4. Quality Gates: Verification Results

### 4.1 TypeScript Strict Typecheck
- **Command:** `npx tsc --noEmit` / `npx tsc -b`
- **Execution Date:** 2026-10-20T20:37:28+03:00
- **Exit Code:** `0`
- **Result:** **PASSED**
- **Evidence Output:**
  ```text
  npm notice run @3ddx/clinical-teeth-chart-web@4.2.0 npx
  npm notice run tsc --noEmit
  (Exited with code 0 - Zero compilation errors)
  ```

### 4.2 Static Analysis & Linting
- **Command:** `npm run lint` (`oxlint`)
- **Execution Date:** 2026-10-20T20:37:14+03:00
- **Exit Code:** `1`
- **Result:** **FAILED (Known Defect Baseline)**
- **Diagnostic Summary:**
  - Total files scanned: 84 files
  - Rules evaluated: 116 rules
  - Elapsed time: 1.4s
  - **Warnings:** 421 warnings (primarily unused imports, catch parameter unused, React impure render warnings in `CreateOrder.tsx`).
  - **Errors:** 1 error (`react-hooks/exhaustive-deps` in `src/hooks/useFetch.ts:28:6` — `useCallback` passed dynamic non-array literal deps).

### 4.3 Automated Tests
- **Command:** None available in `package.json`.
- **Search Command:** `Get-ChildItem -Recurse -Include *.test.ts,*.test.tsx,*.spec.ts,*.spec.tsx`
- **Execution Result:** **0 test files found.**
- **Status:** **NOT AVAILABLE / BLOCKED** (Test runner installation required in follow-up task).

### 4.4 Production Distribution Build
- **Command:** `npm run build` (`tsc -b && vite build`)
- **Execution Date:** 2026-10-20T20:38:02+03:00
- **Exit Code:** `0`
- **Result:** **PASSED**
- **Build Duration:** 7.63s
- **Output Artifacts:** `dist/index.html` (1.15 kB), `dist/assets/index-CH3yiqVt.css` (209.87 kB), 80+ dynamic JavaScript chunks.
- **Known Build Warnings:**
  - Vite config deprecation warning: `__dirname` in `vite.config.ts:10:25` (use `import.meta.dirname`).
  - Chunk size warning: `dist/assets/index-DmK91Xpt.js` (535.57 kB gzip: 159.44 kB) and `dist/assets/AreaChart-BHwCd_B1.js` (373.75 kB) exceed 500 kB limit.

---

## 5. Existing CI/CD & Container Status

### 5.1 CI/CD Configuration
- **File:** `.github/workflows/ci.yml`
- **Triggers:** Push to `main`, `develop`; Pull Request to `main`.
- **Configured Steps:**
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (Node 20, cache: 'npm')
  3. `npm ci`
  4. `npx tsc -b`
  5. `npm run build`
  6. Verification of `dist/index.html`.
- **Missing CI Gates:** Lint gate (`oxlint`), Automated test runner, Docker image build validation, SonarQube quality scan.

### 5.2 Docker / Container Status
- **Current State:** **No Dockerfile or docker-compose configuration exists** in the repository.
- **Target Design:** Multi-stage Dockerfile (Node 22 builder + Nginx Alpine runner) specified in `docs/01_PROJECT/SDS.md`.

---

## 6. Unavailable Services & Limitations

| Service / Dependency | Current Status | Impact on Project |
|---|---|---|
| **Backend Repository** | Unavailable | Prevents live end-to-end integration and API verification. |
| **OpenAPI Contract** | Canonical `openapi/newcp.openapi.yaml` missing | Endpoints and schemas cannot be generated automatically. |
| **PostgreSQL Database** | Direct access unavailable | Confirms frontend must not attempt direct database queries. |
| **Google OAuth Provider** | Credentials unconfigured | Live authentication flows cannot be executed. |
| **Automated Test Runner** | Vitest not installed | Prevents unit and component test execution. |
| **SonarQube Scanner** | Unconfigured | Excluded from current scope per task safety guidelines. |

---

## 7. Sign-off and Traceability

- **Audited by:** Antigravity AI Engineering Assistant
- **Reviewed by:** Abdo Al Adawy (Lead Software Engineer)
- **Status:** Baseline Established (Non-destructive documentation-only milestone). No application source code modified.