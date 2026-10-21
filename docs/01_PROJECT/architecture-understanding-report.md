# Architecture Understanding Report: 3DDX CP PRO MAX Frontend

**Document Identifier:** `ARCH-REPORT-T003-2026-10-21` (Updated Baseline post T-001 & T-002)  
**Task Reference:** Task T-003: Align New CP Standards, Documentation, and Boundaries  
**Workspace:** `newcp-ui-option-a` (`H:\3DDX\DEMO\newcp-ui-option-a`)  
**Parent Repository:** `https://github.com/Abdo2000-1/newcp-ui-option-a.git`  
**Governing Domain Source:** `H:\3DDX\02 Backend\New DB V3\03 BUSINESS_GUIDE.html` (3DDX Business Guide V3)  

---

## 1. Project Purpose & Executive Summary

The **3DDX CP PRO MAX Frontend** (`newcp-ui-option-a`) is the next-generation clinical and operational web portal for **3D Diagnostix (3DDX)**. 3DDX delivers patient-specific guided implant surgery templates, 3D anatomical modeling, radiology interpretations, prosthetic restorations, clear aligners (iSmile), software licensing, and surgical loaner kits to dental professionals worldwide.

While the physical surgical guide is the flagship physical product manufactured in Boston and engineered in Cairo, the system is fundamentally a multi-service clinical ERP. A single patient case encompasses multiple clinical services—such as 3D DICOM conversion, model laser scanning, treatment planning, sleeve design, guide printing, and restorative crown fabrication—each with independent workflow lifecycles, staff assignments, status sequences, quality checklists, and billing rules.

The purpose of this baseline report is to establish an objective, verifiable foundation transitioning the project from a rapid proof-of-concept (POC) single-page application into an enterprise-grade, clean-architecture frontend ready for real backend integration, automated CI/CD pipelines, containerized deployment, and strict clinical compliance.

---

## 2. Current-State Architecture

`[CONFIRMED FACT]` The current repository reflects an enterprise-grade clinical frontend built on top of the approved modular Clean Architecture (`app`/`features`/`shared`):

### 2.1 Technology Stack Inventory
- **Runtime Environment:** Node.js (tested on v24.18.0 / npm 12.0.2).
- **Core Framework:** React 19.2.8 with `react-dom` 19.2.8.
- **Language:** TypeScript ~6.0.2 (targeting ES2022 / DOM).
- **Build & Bundler:** Vite 8.3.1 with `@vitejs/plugin-react` 6.1.1.
- **Routing:** React Router DOM v7 (`react-router-dom` 7.18.4).
- **Styling & Design System:** Tailwind CSS v4 (`tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3).
- **Test Runner & Environment:** Vitest 5.0.5 + `@testing-library/react` 16.3.3 + JSDOM 30.1.3.
- **3D Graphics & WebGL:** Three.js 0.180.0 (`three` and `@types/three`) providing 3D anatomical dental arch and surgical implant visualization.
- **Icons & Animation:** `lucide-react` 1.48.0, `framer-motion` 13.4.4.
- **Charts & Telemetry:** `recharts` 3.10.1, `powerbi-client` 2.25.0, `powerbi-client-react` 2.0.2.
- **Static Analysis & Linting:** `oxlint` 1.81.0 (passes with 0 errors).

### 2.2 Active Application Structure & Topology
```text
H:\3DDX\DEMO\newcp-ui-option-a/
├── .agents/                    # Antigravity rules, agents, and skills
├── .claude/                    # Claude Code compatibility layer
├── .github/                    # [CONFIRMED FACT] GitHub Actions CI pipeline (.github/workflows/ci.yml)
├── deploy/                     # [CONFIRMED FACT] Nginx runtime configuration (nginx.conf)
├── docs/                       # Project engineering documentation & governance
│   ├── 00_READ_FIRST.md
│   ├── 00_SOURCE_INVENTORY.md
│   ├── 01_PROJECT/             # Architecture, conventions, SRS, SDS
│   ├── 02_REQUIREMENTS/        # Requirements inventory & open questions
│   ├── 03_WORKFLOW/            # Workflow, DoD, Abdo ownership boundary
│   ├── 04_INTEGRATION/         # OpenAPI contract status & integration notes
│   ├── 05_QUALITY/             # Testing strategy, quality gates, evidence (T-000, T-002)
│   └── 90_PRODUCT_REFERENCE/   # TeethChart component SRS & SDS references
├── public/                     # Public static assets & mock data fixtures
│   ├── data/                   # 12 static JSON files simulating backend databases
│   ├── app.config.json         # Dynamic branding & tenant feature configuration
│   └── icons.svg, logos...
├── src/                        # [EXISTING IMPLEMENTATION] Modular Architecture (app/features/shared)
│   ├── app/                    # Application bootstrap, routing, shell layout, and composed providers
│   │   ├── providers/          # Theme, Language, Config, ErrorBoundary, Query providers & tests
│   │   ├── router/             # Centralized route tree (35+ screens) & legacy task query handler
│   │   ├── shell/              # Shell navigation: Header, Sidebar, Footer, ConvertibleNav, Modals
│   │   └── App.tsx             # Root component composing providers and router
│   ├── features/               # Feature-oriented UI modules & domain sub-pages
│   │   ├── auth/               # Login, Profile pages
│   │   ├── conversion/         # DicomMprViewer
│   │   ├── models/             # Task47ModelWorkReport
│   │   ├── orders/             # Flow, Orders, OrderDetails, Cases, AddCase, WorkflowBoard
│   │   ├── reporting/          # Dashboard, Reports, QuarterTargets, StaffTargets
│   │   └── settings/           # Clinics, Doctors, Patients, Billing, Documents, ScanCenter
│   ├── shared/                 # Cross-feature reusable infrastructure & atomic components
│   │   ├── api/                # ApiClient interfaces, domain errors, and types
│   │   ├── components/         # Atomic UI widgets (Button, DataTable, Avatar, TeethChart, Badges)
│   │   ├── config/             # Runtime config loader (appConfig.ts)
│   │   ├── data/               # Workflow mock fixtures (flowMockData.ts)
│   │   ├── hooks/              # Reusable React hooks (useFetch, useStore, useTableState)
│   │   ├── services/           # Data services (api.ts, reactive store.ts)
│   │   ├── types/              # Domain interfaces & paginated envelopes
│   │   └── utils/              # Pure utilities (format, sound, status-styles)
│   ├── test/                   # Global test configuration and mocks (setup.ts)
│   ├── theme/                  # Design tokens & color palettes
│   └── main.tsx                # Browser entry point mounting src/app/App.tsx
├── Dockerfile                  # [CONFIRMED FACT] Multi-stage container specification
├── package.json                # Dependencies, scripts (dev, build, lint, test, preview)
├── tsconfig.json               # Root TypeScript configuration
├── tsconfig.app.json           # Application TypeScript paths and compiler options
└── vite.config.ts              # Vite & Vitest bundler configuration
```

---

## 3. Current Modules and Boundaries

### 3.1 Presentation Layer (`src/app/shell/` and `src/features/`)
- `[EXISTING IMPLEMENTATION]` **Shell:** Header, Sidebar, Navigation, and Modals reside in `src/app/shell/`.
- `[EXISTING IMPLEMENTATION]` **Feature Pages:** 36 feature views organized under domain sub-directories in `src/features/`.
- `[EXISTING IMPLEMENTATION]` **Shared Primitives:** Reusable components reside in `src/shared/components/` (`Button`, `DataTable`, `Avatar`, `DateInput`, `EmptyState`, `ErrorState`, `LoadingState`, `StatusBadge`, `UIStateSwitcher`).
- `[EXISTING IMPLEMENTATION]` **Clinical Engine:** `<TeethChart />` renders 2D anatomical cross-quadrants and 3D WebGL parabolic dental arches with titanium implant models.

### 3.2 State & Storage Layer (`src/shared/services/store.ts`)
- Implemented as a singleton `ReactiveStore` class.
- Listens to internal state changes and dispatches updates to subscribed React components via `useStore` hook.
- Persists all mutations directly to browser `localStorage` using keys prefixed with `dentalab_store_`.
- Hydrates on startup from `localStorage`, falling back to `api.ts` JSON fetches if empty.

### 3.3 Data Transport Layer (`src/shared/services/api.ts`)
- Exposes promise-based functions (`getOrders`, `getOrderById`, `getCases`, `getPatients`, etc.).
- Performs standard `fetch()` calls against local static JSON files in `/data/*.json`.
- Implements simulated client-side filtering.
- `[CONFIRMED FACT]` **No real backend API or database connection exists.**

---

## 4. Existing Mock-Data Locations & Coupling

`[EXISTING IMPLEMENTATION]` The application currently relies on two mock data sources:
1. `public/data/*.json`: 12 static JSON files representing simulated database tables.
2. `src/shared/data/flowMockData.ts`: In-memory JavaScript arrays representing 3DDX master workflow orders.

---

## 5. Confirmed Business Rules

`[APPROVED REQUIREMENT]` Sourced from the official `03 BUSINESS_GUIDE.html`:
1. **Multi-Service Line Independence:** A single Patient Case contains multiple independent Service Lines (`SurgicalGuide`, `Conversion`, `ModelWork`, `Restoration`). Each maintains its own status sequence, technician assignment, quality checklist, and history.
2. **Clinical Approval Gate:** Physical manufacturing (guide 3D printing or milling) cannot proceed until the treating doctor explicitly reviews and approves the digital treatment plan.
3. **Tenant Isolation:** Clinic and patient data must be strictly isolated per tenant account (`X-Tenant-ID`).
4. **Physical Logistics:** Dual-site operations (Boston physical manufacturing, Cairo clinical design engineering) require distinct physical tracking states (`Cairo In-Design`, `Boston Printing`, `Shipped`).

---

## 6. Incremental Migration Order

The migration proceeds across planned milestones:

1. **Phase 1: Architecture Alignment & Quality Foundation (`[COMPLETED - T-001 & T-002]`)**
   - Reorganized source into `app/features/shared`.
   - Introduced Vitest testing harness with 44 unit & component tests.
   - Configured GitHub Actions CI pipeline with deterministic `npm ci`, lint, typecheck, tests, build, and Docker build.
2. **Phase 2: Documentation & Standards Alignment (`[COMPLETED - T-003]`)**
   - Formalized boundaries, open questions, and restructuring estimates.
3. **Phase 3: OpenAPI Ingestion & Client Generation (`[BLOCKED - Awaiting Canonical YAML]`)**
   - Ingest canonical `newcp.openapi.yaml`.
   - Setup code-generated TypeScript API client.
4. **Phase 4: Feature-by-Feature Data Transport Migration (`[PENDING Phase 3]`)**
   - Transition feature queries to TanStack Query.
5. **Phase 5: Auth & Multi-Tenancy (`[PENDING Backend Auth]`)**
   - Replace client-only mock profile with OAuth2/JWT session management and tenant interceptors.
6. **Phase 6: E2E Testing & Release Hardening (`[PENDING Full Integration]`)**
   - Deploy Playwright test suite for critical CEO-demo journeys.

---

## 7. CI/CD and Container Readiness

### 7.1 Existing CI Status
`[CONFIRMED FACT]` `.github/workflows/ci.yml` is active and passing on GitHub Actions:
- `npm ci` (deterministic lockfile install, no fallback)
- `npm run lint` (`oxlint` code and architectural hygiene)
- `npx tsc -b` (strict TypeScript check)
- `npm run test` (`vitest run` unit & component tests)
- `npm run build` (production Vite build)
- `test -f dist/index.html` (artifact verification)
- `docker build -t 3ddx-clinical-engine:ci .` (container image validation)
- SonarQube quality analysis (safe conditional integration point)

### 7.2 Docker / Containerization Strategy
`[EXISTING IMPLEMENTATION]`
- **Build Stage:** `node:22-alpine` executing `npm ci && npm run build`.
- **Runtime Stage:** `nginx:alpine` serving compiled assets from `/app/dist` as unprivileged `USER nginx` on port `8080`.
- **Healthcheck:** `wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1`.
- **Limitation:** Local Docker Desktop daemon socket is not running on development workstation; container validation is verified in CI.

---

## 8. Open Questions & Blockers

| ID | Category | Description | Decision Owner | Status |
|---|---|---|---|---|
| **OQ-001** | Backend Integration | Location of official backend repository and canonical `openapi/newcp.openapi.yaml`. | Backend Owner + Tech Lead | `[BLOCKER]` |
| **OQ-002** | Test Framework | Official choice of unit test runner. | Resolved | `[CONFIRMED FACT]` Vitest (v5) + RTL implemented. |
| **OQ-003** | Auth Provider | Google OAuth Client ID, redirect URIs, and tenant session model. | Full-time Dev + Tech Lead | `[BLOCKER]` |
| **OQ-004** | Container Registry | Target production container registry and deployment secrets. | Full-time Dev / Ops | `[OPEN QUESTION]` |
| **OQ-005** | Styling Framework | Tailwind CSS v4 vs. Material UI (MUI). | Tech Lead / Stakeholders | `[OPEN QUESTION]` Retained Tailwind; MUI excluded from Abdo's scope. |
| **OQ-006** | SonarQube Secrets | `SONAR_HOST_URL`, `SONAR_TOKEN`, `SONAR_PROJECT_KEY`. | Repository Admin / Full-time Dev | `[BLOCKER]` Safe conditional step in place. |

---

*Report updated under Task T-003 guidelines. All checks and statements reflect authentic repository state.*
