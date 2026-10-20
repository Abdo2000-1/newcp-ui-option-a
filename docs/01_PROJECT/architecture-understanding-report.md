# Architecture Understanding Report: 3DDX CP PRO MAX Frontend

**Document Identifier:** `ARCH-REPORT-T000-2026-10-20`  
**Task Reference:** Task T-000: Project, Business, Architecture and Engineering Baseline  
**Workspace:** `newcp-ui-option-a` (`H:\3DDX\DEMO\newcp-ui-option-a`)  
**Parent Repository:** `https://github.com/Abdo2000-1/newcp-ui-option-a.git`  
**Upstream Baseline:** `https://github.com/Abdo2000-1/cp-pro-max.git`  
**Governing Domain Source:** `H:\3DDX\02 Backend\New DB V3\03 BUSINESS_GUIDE.html` (3DDX Business Guide V3)  

---

## 1. Project Purpose & Executive Summary

The **3DDX CP PRO MAX Frontend** (`newcp-ui-option-a`) is the next-generation clinical and operational web portal for **3D Diagnostix (3DDX)**. 3DDX delivers patient-specific guided implant surgery templates, 3D anatomical modeling, radiology interpretations, prosthetic restorations, clear aligners (iSmile), software licensing, and surgical loaner kits to dental professionals worldwide.

While the physical surgical guide is the flagship physical product manufactured in Boston and engineered in Cairo, the system is fundamentally a multi-service clinical ERP. A single patient case encompasses multiple clinical services—such as 3D DICOM conversion, model laser scanning, treatment planning, sleeve design, guide printing, and restorative crown fabrication—each with independent workflow lifecycles, staff assignments, status sequences, quality checklists, and billing rules.

The purpose of this baseline report is to establish an objective, verifiable foundation transitioning the project from a rapid proof-of-concept (POC) single-page application into an enterprise-grade, clean-architecture frontend ready for real backend integration, automated CI/CD pipelines, containerized deployment, and strict clinical compliance.

---

## 2. Current-State Architecture

The current repository reflects an advanced clinical demonstration prototype built with modern web technologies:

### 2.1 Technology Stack Inventory
- **Runtime Environment:** Node.js (tested on v24.18.0 / npm 12.0.2).
- **Core Framework:** React 19.2.8 with `react-dom` 19.2.8.
- **Language:** TypeScript ~6.0.2 (targeting ES2022 / DOM).
- **Build & Bundler:** Vite 8.3.0 with `@vitejs/plugin-react` 6.1.1.
- **Routing:** React Router DOM v7 (`react-router-dom` 7.18.4).
- **Styling & Design System:** Tailwind CSS v4 (`tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3).
- **3D Graphics & WebGL:** Three.js 0.180.0 (`three` and `@types/three`) providing 3D anatomical dental arch and surgical implant visualization.
- **Icons & Animation:** `lucide-react` 1.48.0, `framer-motion` 13.4.4.
- **Charts & Telemetry:** `recharts` 3.10.1, `powerbi-client` 2.25.0, `powerbi-client-react` 2.0.2.
- **Static Analysis & Linting:** `oxlint` 1.81.0.

### 2.2 Application Structure & Topology
```text
H:\3DDX\DEMO\newcp-ui-option-a/
├── .agents/                    # Antigravity rules, agents, and skills
├── .claude/                    # Claude Code compatibility layer
├── .github/                    # CI/CD workflows and issue/PR templates
├── docs/                       # Project engineering documentation & governance
│   ├── 00_READ_FIRST.md
│   ├── 00_SOURCE_INVENTORY.md
│   ├── 01_PROJECT/             # Architecture, conventions, SRS, SDS
│   ├── 02_REQUIREMENTS/        # Requirements inventory & open questions
│   ├── 03_WORKFLOW/            # Workflow, DoD, Abdo ownership boundary
│   ├── 04_INTEGRATION/         # OpenAPI contract status & integration notes
│   ├── 05_QUALITY/             # Testing strategy, quality gates, evidence
│   └── 90_PRODUCT_REFERENCE/   # TeethChart component SRS & SDS references
├── public/                     # Public static assets & mock data fixtures
│   ├── data/                   # 12 static JSON files simulating backend databases
│   ├── app.config.json         # Dynamic branding & tenant feature configuration
│   └── icons.svg, logos...
├── src/                        # Application source code
│   ├── assets/                 # Brand images and SVG graphics
│   ├── components/             # UI components
│   │   ├── dicom/              # Multiplanar DICOM viewer prototype
│   │   ├── layout/             # Header, Sidebar, Footer, GlobalSearch, Navigation
│   │   └── ui/                 # Reusable controls, TeethChart, Table, State Badges
│   ├── config/                 # Application runtime configuration loader
│   ├── contexts/               # React Contexts (Theme, Language, Config)
│   ├── data/                   # Static flow data fixtures (flowMockData.ts)
│   ├── hooks/                  # Custom React hooks (useFetch, useTableState, etc.)
│   ├── pages/                  # 35+ page components (Dashboard, Orders, Cases, etc.)
│   ├── services/               # Data access layer (api.ts, store.ts)
│   ├── types/                  # TypeScript interface definitions (index.ts)
│   ├── utils/                  # Formatting, sound feedback, status styling
│   ├── App.tsx                 # Route declarations & top-level layout
│   └── main.tsx                # Application mounting entry point
├── package.json                # Dependencies, scripts, project metadata
└── vite.config.ts              # Vite bundling configuration
```

---

## 3. Current Modules and Boundaries

### 3.1 Presentation Layer (`src/pages/` and `src/components/`)
- **Pages:** Includes clinical pages (`Cases.tsx`, `CaseDetails.tsx`, `AddCase.tsx`, `Orders.tsx`, `CreateOrder.tsx`, `OrderDetailsPage.tsx`, `OrderWorkflow.tsx`, `WorkflowBoard.tsx`), administrative pages (`Billing.tsx`, `Doctors.tsx`, `Clinics.tsx`, `ScanCenter.tsx`), reporting pages (`Reports.tsx`, `QuarterTargetsReport.tsx`, `Task31StaffTargets.tsx`, `Task47ModelWorkReport.tsx`), and configuration pages (`ConfigManager.tsx`, `Settings.tsx`).
- **UI Components:** Clean atomic components (`Button`, `Select`, `DateInput`, `SearchInput`, `DataTable`, `Pagination`, `PriorityBadge`, `StatusBadge`, `EmptyState`, `ErrorState`, `LoadingState`).
- **Clinical Engine:** High-fidelity `<TeethChart />` rendering 2D anatomical cross-quadrants and 3D WebGL parabolic dental arches with titanium implant models.

### 3.2 State & Storage Layer (`src/services/store.ts`)
- Implemented as a singleton `ReactiveStore` class.
- Listens to internal state changes and dispatches updates to subscribed React components via `useStore` hook.
- Persists all mutations directly to browser `localStorage` using keys prefixed with `dentalab_store_`.
- Hydrates on startup from `localStorage`, falling back to `api.ts` JSON fetches if empty.

### 3.3 Data Transport Layer (`src/services/api.ts`)
- Exposes promise-based functions (`getOrders`, `getOrderById`, `getCases`, `getPatients`, etc.).
- Performs standard `fetch()` calls against local static JSON files in `/data/*.json`.
- Implements simulated client-side filtering (e.g. `orders.find(o => o.id === id)`).

---

## 4. Existing Mock-Data Locations & Coupling

The application currently relies entirely on static fixtures:

1. **`public/data/` Static Fixtures:**
   - `orders.json`: 50+ mock orders with mixed restoration types and simulated billing flags.
   - `sub-orders.json`: Sub-services tied to orders (Model, Planning, Fabrication).
   - `cases.json`: Clinical cases containing simulated patient and doctor associations.
   - `patients.json`: Patient profiles with plain-text PII (full names, DOBs, phone numbers, emails).
   - `doctors.json`, `clinics.json`, `scan-centers.json`: Directory information.
   - `billing.json`: Invoices, vouchers, and payment records.
   - `change-requests.json`, `notifications.json`: Support and alert items.
   - `reports.json`, `dashboard-volume.json`: Aggregated charts data.
2. **In-Code Fixtures:**
   - `src/data/flowMockData.ts`: Workflow board columns and card structures.
   - `src/services/store.ts`: Initial user profile hardcoded to "Jessica Ruiz, Lab Director".

**Architectural Risk:** The presentation components import `store` directly or use `useFetch` against `/data/*.json`. This tight coupling binds the UI directly to mock schemas, obscuring real API error states, pagination, server-side filtering, and network latency.

---

## 5. Confirmed Business Rules (3DDX Domain Authority)

Derived from the official business reference (`H:\3DDX\02 Backend\New DB V3\03 BUSINESS_GUIDE.html`):

### 5.1 Account vs. Patient Hierarchy
- **Hierarchy:** `Account (Client) -> Case -> Order -> Service Line / Order Item`.
- **Account:** The billing customer (Doctor, Scanning Centre, Lab, Company). An account is never a patient.
- **Patient:** A patient is never the customer and is never billed. In the target 3DDX V3 model, patients are identified by an anonymized `patient_code`. PII sits strictly isolated in `clinical.patient_identities` accessible only via purpose-logged queries.
- **Case:** Represents one patient and one clinical intent. Multiple submissions (such as upper and lower arches submitted separately) belong to a single case.
- **Order:** A submission container holding billable service lines.

### 5.2 Service Line Independence
The system is **not** a single-pipeline guide application. An order contains multiple billable service lines:
1. `OrderSG` (Surgical Guide design and manufacturing).
2. `OrderRep` (Radiology report evaluated across specific clinical topics).
3. `OrderAppliance` (Laser scanning, pouring impressions, stone models).
4. `OrderTP` (Treatment planning, replication, fine-tuning review).
5. `OrderSim` (3D conversion: basic/custom, quadrant/full arch).
6. `OrderMisc` (Fixation pins, drills, loaner kits, sleeves).
7. `OrderVoucher` (Prepaid credit purchases).
8. `OrderRestoration` (Crowns, abutments, bridges, GFMR; temporary and final).
9. `IsmileOrder` (Clear aligners, retainers, stages: model, planning, fabrication).
10. `OrderSoftware` (CoDiagnostiX licenses and dongles).

**Invariant:** Each service line runs independently. It has its own status, owner, due date, price, and charge state. There is **no single global order status**.

### 5.3 Surgical Guide Canonical Workflow & Registration Verdicts
- **Clinical Spine:** Case Intake -> Scan Conversion (Cairo) -> Physical Package Arrival (Boston) -> Registration Verdict -> Treatment Planning -> Doctor Consultation (Fine-Tuning) -> Approval Confirmation -> Sleeve Design -> Planning QC -> Guide Design -> 3D Printing (Boston) -> Post-Processing/Wash/Cure/QC -> Packaging & Shipping -> Charging.
- **Approval Gate Invariant:** **Nothing physical is manufactured before the doctor's explicit approval.** Approval is obtained via confirmation email, portal button click, or verbal approval recorded during a fine-tuning video call.
- **Registration Verdicts (Options 1–4):**
  - **Option 1:** Clean registration. File is uploaded and the case moves to Planning immediately.
  - **Option 2:** Clean registration with clinical notes. Case proceeds, but informative notes are routed to the doctor via Customer Support.
  - **Option 3:** Compromise registration. The case is held; operator records findings from a standard list; an automated email presents clickable options; a Customer Support task is raised. The case cannot proceed until the doctor responds.
  - **Option 4:** Unusable scans/models. The case is held; file is **not** uploaded downstream; case is blocked until new records are provided.
- **Guide Support Dependency:**
  - *Tooth-supported:* Requires STL registration against optical scans/models.
  - *Tissue-supported:* Requires dual-scan registration with radiographic markers.
  - *Bone-supported:* Bypasses surface registration unless a Pre-Positioning Guide (PPG) is specified.

### 5.4 Money, Vouchers, and Invoicing
- **Multi-Dimensional Pricing:** Pricing is per client, per option, per currency (USD, EUR, GBP), with distinct digital vs. manufacturing pricing. Surgical guides are priced on a 1-to-16 implant site scale plus extra components.
- **Voucher Ledger:** Vouchers are prepaid credit managed through an append-only ledger (`vouchers.voucher_transactions`). Movements are never edited or deleted; corrections are compensating records. Consumption order is strictly: general credit first, oldest first, cases before additional credit before original credit.
- **Charging Trigger:** A service is eligible for charging only when it is closed with a timestamp and lacks a charge timestamp. Daily billing batches execute according to account schedule preferences (instant, weekly, biweekly, monthly).
- **Post-Charge Price Adjustments:** Price changes post-charge must generate an extra charge line or refund record with mandatory reason logging and history auditing.

### 5.5 Boston vs. Cairo Operational Segregation
- **Cairo (Digital Operations):** 3D conversions, STL registrations, CoDiagnostiX treatment planning, fine-tuning consultations, sleeve design, guide CAD modeling.
- **Boston (Physical Manufacturing & Logistics):** Intake receiving of stone models and impressions, model pouring and laser scanning, bin archiving under QR/barcodes, 3D printing on Formlabs/Carbon printers, IPA washing and UV curing ovens, physical fit inspection on 3D printed fitting surfaces (FS), packing loaner drill kits, outbound/return shipping label generation.

### 5.6 Status Codes Verbatim Collision
Status integers have product-line specific meanings:
- Integer `39` = *Guide Design* in Surgical Guide, but *In Production* in Appliance.
- Integer `37` = *Waiting Confirmation* in Surgical Guide and Appliance.
- Integer `40` = *Shipped* in Surgical Guide and Appliance.
- Integer `41` = *On Hold* across multiple lines.
- Integer `130–150` = Restoration and GFMR sequence.
*A global status enum in the frontend is invalid and causes data corruption.*

---

## 6. Current Risks and Architectural Problems

| Risk / Problem | Impact | Evidence in Codebase | Remediation Strategy |
|---|---|---|---|
| **Monolithic Client Store** | UI and business state are mixed in `localStorage`; state loss on cache clearing; concurrency issues across tabs. | `src/services/store.ts` (`ReactiveStore` class with `dentalab_store_*`). | Decouple UI state into clean React state/Zustand; route server data through TanStack Query / RTK Query. |
| **Generic Status Decoding** | The UI uses generic status strings (`'New'`, `'Review'`, `'Design'`, `'Production'`) that collapse distinct product workflows. | `src/types/index.ts` (`OrderStatus` type definition). | Replace with service-line specific workflow decoders aligned with `workflow.legacy_status_codes`. |
| **PII & Privacy Exposure** | Real-looking patient names, dates of birth, and emails are displayed in plain text without access purpose logging. | `public/data/patients.json`, `src/types/index.ts`. | Redact PII in mock fixtures; implement pseudonymous `patientCode` and purpose-bound access modal. |
| **Lint & Purity Violations** | 421 warnings and 1 error under `oxlint`; impure function calls (`Date.now()`, `Math.random()`) during React rendering. | `npm run lint` execution output (`CreateOrder.tsx`, `useFetch.ts`). | Clean unused imports, fix `useCallback` dependency array literals, move impure generators to event handlers. |
| **Zero Automated Tests** | No unit, component, or E2E tests exist; zero test runner packages in `package.json`. | Search for `*.test.*` returned zero files. | Introduce Vitest, `@testing-library/react`, and MSW for deterministic API contract testing. |
| **Large Bundle Chunks** | Production build produces oversized chunks exceeding 500 kB (Three.js and Recharts). | Vite build warning: `index-DmK91Xpt.js` (535 kB), `AreaChart-BHwCd_B1.js` (373 kB). | Implement route-based dynamic code-splitting and optimize Three.js tree-shaking. |
| **Missing Backend & Contract** | No real backend or OpenAPI 3.0.3 contract file exists in the repository. | `docs/04_INTEGRATION/openapi-status.md`. | Isolate mock services behind a clean API interface; generate types once OpenAPI file is supplied. |

---

## 7. Proposed Target Direction: Clean Architecture

To ensure high maintainability and prevent regressions, the frontend should evolve toward a modular Clean Architecture:

```text
src/
├── app/                        # Application bootstrap, routing, global providers
├── domains/                    # Domain-driven feature modules
│   ├── cases/                  # Case aggregation, clinical pairing
│   ├── orders/                 # Order containers, submission flows
│   ├── services/               # Independent service-line workflows
│   │   ├── surgical-guide/     # Sleeve design, guide design, print QC, loaners
│   │   ├── conversion/         # 3D DICOM conversion, nerve mapping
│   │   ├── model-work/         # Boston package intake, laser scan, bin archiving
│   │   ├── treatment-plan/     # CoDiagnostiX planning, FT calendar, Relu AI
│   │   ├── restorations/       # Crowns, abutments, wax-up, GFMR
│   │   └── ismile/             # Aligners, stages, thermoforming
│   ├── patients/               # Pseudonymous patient records & privacy audit
│   └── billing/                # Voucher ledger, charging cycle, invoicing
├── shared/                     # Cross-cutting platform layer
│   ├── api/                    # OpenAPI HTTP client, interceptors, error mapping
│   ├── components/             # Atomic design system & TeethChart 3D engine
│   ├── hooks/                  # Reusable hooks
│   └── utils/                  # Domain-agnostic formatting & mathematics
```

### Architectural Layering Rules:
1. **Domain Entities:** Contain pure business invariants (e.g. calculation of implant site pricing, verification of registration verdict transitions). No React or DOM dependencies.
2. **Application Use Cases:** Coordinate async tasks, call API client ports, and dispatch notifications.
3. **Transport Adapters:** Handle HTTP communication, JWT authentication headers, correlation IDs, and network errors.
4. **UI Presentation:** Dumb presentation components and reactive container components; UI components never make direct `fetch()` calls or manipulate persistent storage.

---

## 8. Incremental Migration Order

The migration from POC to production baseline will proceed in controlled phases:

1. **Phase 0: Baseline & Documentation (Current Task T-000)**
   - Audit repository, establish project SRS/SDS, verify existing scripts, capture baseline evidence.
2. **Phase 1: Tooling, Linting & Testing Harness**
   - Install Vitest and React Testing Library without breaking existing dependencies.
   - Resolve `oxlint` error and critical warnings.
   - Add initial component tests for design primitives and `<TeethChart />`.
3. **Phase 2: Domain Modeling & Status Decoders**
   - Create domain types for individual service lines (`SurgicalGuide`, `Conversion`, `ModelWork`, `Restoration`).
   - Implement product-specific status enum decoders matching official business specifications.
4. **Phase 3: Transport Layer & Mock Abstraction**
   - Introduce an `ApiClient` interface separating UI components from `/data/*.json` paths.
   - Implement MSW (Mock Service Worker) for network-level simulation mimicking real HTTP codes.
5. **Phase 4: Real Backend & OpenAPI Integration**
   - Ingest canonical `openapi/newcp.openapi.yaml` when supplied by backend team.
   - Implement OpenAPI TypeScript code generation (`openapi-typescript`).
   - Wire Google OAuth and session management tokens.
6. **Phase 5: Vertical Slice Verification**
   - Deliver one end-to-end live flow: Model Registration & Scan Conversion.
   - Verify tenant isolation, same-type service independence, and real PostgreSQL V3 persistence.

---

## 9. CI/CD and Container Readiness

### 9.1 Existing CI Status
The repository contains `.github/workflows/ci.yml` running:
- `npm ci`
- `npx tsc -b` (TypeScript typecheck)
- `npm run build` (Vite production build)
- Verification of `dist/index.html` artifact existence.

### 9.2 CI Enhancements Needed
- Integrate lint verification (`npm run lint`).
- Integrate unit and component test execution (`npm test -- --run`).
- Enforce bundle size budgets.
- Add pull request title and conventional commit validation.

### 9.3 Docker / Containerization Strategy
For containerized staging and production hosting:
- **Build Stage:** `node:22-alpine` executing `npm ci && npm run build`.
- **Runtime Stage:** `nginx:alpine` serving static assets from `dist/` with custom `nginx.conf` supporting SPA fallback routing (`try_files $uri $uri/ /index.html;`) and security headers (CSP, HSTS, X-Content-Type-Options).
- **Environment Ingestion:** Runtime configuration injected via `window.__APP_CONFIG__` or `/app.config.json` rather than baking secrets into the static bundle.

---

## 10. Open Questions & Blockers

| ID | Category | Description | Impact | Interim Safe Action |
|---|---|---|---|---|
| **OQ-001** | Backend Integration | Location of official backend repository and canonical `openapi/newcp.openapi.yaml`. | Blocks live API integration and contract tests. | Maintain simulated `api.ts` boundary with explicit mock tagging. |
| **OQ-002** | Test Framework | Official choice of unit test runner (Vitest vs. Jest). | Blocks test authoring. | Recommend Vitest due to native Vite bundler alignment. |
| **OQ-003** | Auth Provider | Specific Google OAuth Client ID, redirect URIs, and Casbin RBAC role mappings. | Blocks live login integration. | Maintain mock user profile in local store. |
| **OQ-004** | Container Registry | Target Docker registry and deployment cluster specifications. | Prevents writing production deployment manifests. | Restrict container tasks to local Dockerfile validation once approved. |

---

*Report authored under Task T-000 guidelines. No application source code was modified.*