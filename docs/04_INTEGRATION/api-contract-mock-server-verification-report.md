# OpenAPI Contract & Mock Server Integration Verification Audit Report

**Repository:** `newcp-ui-option-a` (New CP React Option A)  
**Execution Date:** 26 October 2026  
**Auditor:** Antigravity AI Engineering Pair / Abdo Al Adawy  
**Approved OpenAPI Specification:** `docs/newcp-ai/references/api/newcp.openapi.yaml` (v1.0.0, OpenAPI 3.0.3)  
**PDF Reference:** `docs/newcp-ai/references/api/newcp.openapi.pdf`  
**Mock Server Script:** `scripts/mock-server.cjs`  
**Frontend Development Server:** Vite 8.3.1 on `http://localhost:5173` (with `/api` reverse-proxy to `http://localhost:3000`)  
**Audit Branch:** `audit/api-contract-mock-server-verification`  
**Baseline Commit:** `017a5ecd378a49ee92f2e68c3ab1031d94c943aa` (Merge PR #69 from `feat/iam-v097-frontend-tenant-boundary`)

---

## 1. Executive Summary

This audit report records the results of the complete local API-contract integration verification conducted against the running canonical OpenAPI 3.0.3 HTTP mock server and the running React Option A frontend application.

In strict compliance with repository instructions and behavioral guidelines:
1. Product UI/UX, layouts, and business domain rules were **not modified**.
2. No live backend, PostgreSQL database, or production systems were connected.
3. All operations were verified against isolated mock environments using synthetic fixtures clearly labeled as `MOCK`.
4. The approved OpenAPI contract was **not altered**.
5. All 14 OpenAPI endpoints defined in `newcp.openapi.yaml` were exercised using actual HTTP requests over TCP to the running mock server (`http://localhost:3000`) and verified through the frontend Vite proxy (`http://localhost:5173/api/v1`).
6. Contract gaps (endpoints required by frontend features but omitted from the OpenAPI contract) were identified, isolated, and documented separately from confirmed contract endpoints.

---

## 2. Server Startup & Verification Commands

### 2.1 Mock Server
- **Technology:** Node.js standalone HTTP server (`http.createServer`), zero external dependencies, native `crypto` and `url` modules.
- **File:** [`scripts/mock-server.cjs`](file:///H:/3DDX/DEMO/newcp-ui-option-a/scripts/mock-server.cjs)
- **Start Command:** `npm run mock:server` (`node scripts/mock-server.cjs`)
- **Configured Port:** `3000` (configurable via `process.env.PORT`)
- **Listening URL:** `http://localhost:3000`
- **Health Probe:** `http://localhost:3000/health`
- **Base API:** `http://localhost:3000/api/v1`
- **Runtime Task ID:** `49e6f5ef-4bbb-448f-8774-c12d5199fc33/task-169` (Active daemon process during verification session)

### 2.2 Frontend Development Server
- **Technology:** Vite 8.3.1, React 19.2.8, TypeScript 6.0.2.
- **Start Command:** `npm run dev` (`vite`)
- **Configured Port:** `5173`
- **Listening URL:** `http://localhost:5173`
- **Reverse Proxy:** Configured in `vite.config.ts`: `/api` forwards to `http://localhost:3000` (`changeOrigin: true`)
- **Runtime Task ID:** `49e6f5ef-4bbb-448f-8774-c12d5199fc33/task-171` (Active daemon process during verification session)

### 2.3 Verification Commands & Actual Results

| Command | Purpose | Exit Code | Result | Evidence Summary |
| :--- | :--- | :--- | :--- | :--- |
| `npm run verify:contract` | Full live HTTP contract test suite against running mock & proxy | **0** | **31/31 PASSED** | All 14 endpoints, query params, request bodies, ETags, 428, 412, 422, and gap routes verified over HTTP |
| `npm test` | Vitest comprehensive unit & integration suite | **0** | **58/58 files, 534/534 tests PASSED** | 10 new live HTTP integration tests in `mockServerLiveIntegration.test.ts` passed; 0 regressions |
| `npm run lint` | Oxlint fast linter | **0** | **450 warnings, 0 errors** | Clean exit (all warnings are pre-existing unused vars / React compiler notes) |
| `npm run build` | TypeScript project references (`tsc -b`) & Vite build | **0** | **Built in 6.31s** | Production client bundle generated in `dist/` without type errors |
| `git diff --check` | Whitespace and merge marker check | **0** | **Clean** | No trailing whitespace errors or conflict markers |

---

## 3. Contract Coverage Matrix

The following matrix documents every endpoint defined in the approved OpenAPI 3.0.3 contract (`docs/newcp-ai/references/api/newcp.openapi.yaml`), its frontend callers, parameters, security/tenancy requirements, expected responses, error behaviors, and verified status.

| # | Endpoint | HTTP Method | Contract Path | Frontend Caller | Request Parameters / Body | Authentication | Tenant Requirement | Expected Response | Expected Error Responses | Current Status | Verification Method |
| :-: | :--- | :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Liveness / Readiness Probe | `GET` | `/health` | Retry / System monitoring (`Maintenance503Page`) | None | None (`security: []`) | None | `200 OK`<br>`{ status: "UP", version, service }` | None | **VERIFIED** | Live HTTP probe to `http://localhost:3000/health` (Status 200, status="UP") |
| 2 | List Catalog Services | `GET` | `/api/v1/catalog/services` | `catalogClient.listServices()`, `AddCase.tsx` | Query: `categoryCode` (optional, string) | Bearer Token (`BearerAuth`) | `X-Tenant-ID` header (scoped to active tenant) | `200 OK`<br>`CatalogService[]` | `400`, `401`, `403`, `404`, `409`, `422` | **VERIFIED** | Live HTTP call with/without `categoryCode=restorative` query filter; verified array return |
| 3 | Dynamic Form Schema | `GET` | `/api/v1/catalog/services/{serviceUuid}/form-schema` | `catalogClient.getFormSchema()`, `AddCase.tsx`, `DynamicFormRenderer.tsx` | Path: `serviceUuid` (UUID string) | Bearer Token (`BearerAuth`) | Tenant-scoped sellable item | `200 OK`<br>`FormDefinition` (fields, conditionalRules) | `400`, `401`, `403`, `404` | **VERIFIED** | Live HTTP call for Biomodel UUID `00000000-0000-0000-0000-000000000003`; verified fields and typed conditional rules |
| 4 | List Hold Reasons | `GET` | `/api/v1/catalog/hold-reasons` | `workflowClient.getHoldReasons()`, `OrderDetailsPage.tsx`, `OrderWorkflow.tsx` | Query: `holdType` (optional, "customer" \| "internal") | Bearer Token (`BearerAuth`) | Active tenant lookup | `200 OK`<br>`HoldReasonOption[]` | `400`, `401`, `403` | **VERIFIED** | Live HTTP call with `holdType=customer` query filter; verified filtered list |
| 5 | List Hold Reasons (Alias) | `GET` | `/api/v1/lookups/hold-reasons` | `workflowClient.getHoldReasons()` (fallback) | Query: `holdType` (optional) | Bearer Token (`BearerAuth`) | Active tenant lookup | `200 OK`<br>`HoldReasonOption[]` | `400`, `401`, `403` | **VERIFIED** | Live HTTP call to lookup alias path; verified identical reason set |
| 6 | List Zero-Charge Reasons | `GET` | `/api/v1/lookups/zero-charge-reasons` | `pricingClient.getZeroChargeReasons()`, `OrderDetailsPage.tsx` | None | Bearer Token (`BearerAuth`) | Active tenant lookup | `200 OK`<br>`ZeroChargeReason[]` | `400`, `401`, `403` | **VERIFIED** | Live HTTP call; verified return of 4 approved Q-B10 synthetic reason codes |
| 7 | List Eligible Billed Parties | `GET` | `/api/v1/orders/{orderUuid}/eligible-billed-parties` | `payerClient.getEligibleBilledParties()`, `OrderDetailsPage.tsx` | Path: `orderUuid` (string) | Bearer Token (`BearerAuth`) | Scoped to order's clinical contacts | `200 OK`<br>`BilledPartyChoice[]` | `400`, `401`, `403`, `404` | **VERIFIED** (Proposal) | Live HTTP call; verified doctor and scan center party options for `ORD-504901` |
| 8 | List Order Services | `GET` | `/api/v1/orders/{orderUuid}/services` | `serviceClient.listByOrder()`, `OrderDetailsPage.tsx`, `OrderWorkflow.tsx`, `Task47ModelWorkReport.tsx` | Path: `orderUuid` (string) | Bearer Token (`BearerAuth`) | Tenant isolation under order | `200 OK`<br>`ServiceItem[]`<br>Header: `ETag: W/"ord-..."` | `400`, `401`, `403`, `404` | **VERIFIED** | Live HTTP call; verified response items and `ETag` header extraction |
| 9 | Create Order Service Item | `POST` | `/api/v1/orders/{orderUuid}/services` | `serviceClient.create()`, `AddCase.tsx` | Path: `orderUuid`<br>Body: `CreateServiceItem` | Bearer Token (`BearerAuth`) | Scoped to order tenant | `201 Created`<br>`ServiceItem`<br>Header: `ETag: W/"srv-..."` | `400`, `401`, `403`, `404`, `409`, `422` (missing required fields) | **VERIFIED** | Live HTTP call creating synthetic Biomodel instance; verified 201 status, lineTotal calculation, and initial ETag; verified 422 on missing `sellableItemUuid` |
| 10 | Get Service Instance | `GET` | `/api/v1/services/{serviceItemUuid}` | `serviceClient.get()`, `SubOrderDetail.tsx`, `OrderDetailsPage.tsx` | Path: `serviceItemUuid` (UUID string) | Bearer Token (`BearerAuth`) | Instance must belong to active tenant | `200 OK`<br>`ServiceItem`<br>Header: `ETag: W/"srv-..."` | `400`, `401`, `403`, `404` | **VERIFIED** | Live HTTP call fetching created instance; verified ETag header and JSON payload |
| 11 | Edit Service Instance | `PATCH` | `/api/v1/services/{serviceItemUuid}` | `serviceClient.edit()`, `pricingClient.updatePricing()`, `payerClient.assignBilledParty()`, `OrderDetailsPage.tsx`, `SubOrderDetail.tsx` | Path: `serviceItemUuid`<br>Header: `If-Match: W/"..."`<br>Body: `PatchServiceItem` | Bearer Token (`BearerAuth`) | Instance belongs to tenant; clerk editing permissions | `200 OK`<br>`ServiceItem`<br>Header: `ETag: W/"srv-..."` (rotated) | `400`, `401`, `403`, `404`, `409`, `412` (stale revision), `422` (validation / zero-charge reason missing), `428` (missing If-Match) | **VERIFIED** | 1. Verified 428 when `If-Match` is missing.<br>2. Verified 412 when `If-Match` is stale.<br>3. Verified 422 when `unitPrice: 0.00` without reason.<br>4. Verified 200 with rotated ETag upon valid zero-charge patch. |
| 12 | List Available Transitions | `GET` | `/api/v1/services/{serviceItemUuid}/available-transitions` | `workflowClient.getAvailableTransitions()`, `OrderDetailsPage.tsx`, `OrderWorkflow.tsx` | Path: `serviceItemUuid` (string) | Bearer Token (`BearerAuth`) | Instance belongs to tenant | `200 OK`<br>`AvailableTransition[]` | `400`, `401`, `403`, `404` | **VERIFIED** | Live HTTP call; verified transitions returned dynamically according to current status |
| 13 | Execute Workflow Transition | `POST` | `/api/v1/services/{serviceItemUuid}/transitions` | `workflowClient.executeTransition()`, `OrderDetailsPage.tsx`, `OrderWorkflow.tsx` | Path: `serviceItemUuid`<br>Header: `If-Match: W/"..."`<br>Body: `TransitionRequest` (`transitionId`, `holdType`, `holdReasonCode`, `comment`) | Bearer Token (`BearerAuth`) | Instance belongs to tenant; workflow action permissions | `200 OK`<br>`TransitionResult`<br>Header: `ETag: W/"srv-..."` (rotated) | `400`, `401`, `403`, `404`, `409`, `412` (stale ETag), `422` (missing hold reason/type), `428` (missing If-Match) | **VERIFIED** | 1. Verified 428 on missing `If-Match`.<br>2. Verified 412 on stale `If-Match`.<br>3. Verified 422 on transition 102 without `holdType`/`holdReasonCode`.<br>4. Verified 200 on atomic hold transition.<br>5. Verified 200 on resume transition. |
| 14 | Get Service Audit History | `GET` | `/api/v1/services/{serviceItemUuid}/history` | `workflowClient.getHistory()`, `OrderDetailsPage.tsx`, `OrderWorkflow.tsx` | Path: `serviceItemUuid` (string) | Bearer Token (`BearerAuth`) | Scoped to tenant audit logs | `200 OK`<br>`HistoryEvent[]` | `400`, `401`, `403`, `404` | **VERIFIED** | Live HTTP call; verified chronological audit trail reflecting creation and transitions |

---

## 4. Integration Status Classification

### 4.1 Connected Endpoints (Fully Integrated in UI & Mock Server)
The following 14 endpoints are implemented in the mock server and connected to corresponding frontend API clients (`serviceClient`, `catalogClient`, `pricingClient`, `payerClient`, `workflowClient`):
1. `GET /health` (System probe)
2. `GET /api/v1/catalog/services` (Catalog listing)
3. `GET /api/v1/catalog/services/{serviceUuid}/form-schema` (Dynamic form definitions)
4. `GET /api/v1/catalog/hold-reasons` (Hold reason lookup)
5. `GET /api/v1/lookups/hold-reasons` (Hold reason lookup alias)
6. `GET /api/v1/lookups/zero-charge-reasons` (Zero charge justification lookup)
7. `GET /api/v1/orders/{orderUuid}/eligible-billed-parties` (F07 eligible payers proposal)
8. `GET /api/v1/orders/{orderUuid}/services` (Order service instance listing)
9. `POST /api/v1/orders/{orderUuid}/services` (Service instance creation)
10. `GET /api/v1/services/{serviceItemUuid}` (Single service instance retrieval)
11. `PATCH /api/v1/services/{serviceItemUuid}` (Service instance clerk edit + optimistic concurrency)
12. `GET /api/v1/services/{serviceItemUuid}/available-transitions` (Dynamic workflow transition lookup)
13. `POST /api/v1/services/{serviceItemUuid}/transitions` (Atomic state transition execution)
14. `GET /api/v1/services/{serviceItemUuid}/history` (Service transition audit history)

### 4.2 Partially Connected Endpoints (UI Routes with Architectural Gaps)
The following frontend routes consume the contract's service-instance endpoints, but are blocked from full contract-backed operation by missing parent-level contract endpoints:
1. **`/add-case` (Add Case Wizard):**
   - *Connected:* Consumes `catalogClient.listServices()` and `catalogClient.getFormSchema()`, and creates service instances with `serviceClient.create()`.
   - *Gap:* The parent Order creation endpoint (`POST /api/v1/orders`) is missing from the OpenAPI contract. Currently falls back to local reactive store for the parent order container.
2. **`/order-details` (Order Details Workspace):**
   - *Connected:* Section B (Service Instances, Dynamic Forms, Pricing Overrides, Workflow Transitions, Hold Management, and Audit History) fully consumes `serviceClient`, `workflowClient`, `pricingClient`, and `payerClient`.
   - *Gap:* The parent Order header details (`GET /api/v1/orders/{orderUuid}`) are not defined in the contract; uses local store/mock for order metadata.
3. **`/orders/:orderId/workflow` (Order Workflow View):**
   - *Connected:* Consumes `serviceClient.listByOrder()`, `workflowClient.getAvailableTransitions()`, and `workflowClient.executeTransition()`.
   - *Gap:* Operates on discrete service instances; batch order-level status advances are not covered by contract.
4. **`/task-47` (Model Work Report):**
   - *Connected:* Filtered view of Biomodel service instances.
   - *Gap:* Contract only supports per-order service queries (`GET /orders/{orderUuid}/services`), lacking a global queue query endpoint (`GET /api/v1/services?categoryCode=restorative`).

### 4.3 Missing or Unavailable Endpoints (Required by Frontend but Absent from Contract)
The following operations are required by the New CP application but are completely absent from `newcp.openapi.yaml`:
1. **Session & IAM Context (`GET /api/v1/session/context`):**
   - Documented in [`docs/newcp-ai/tasks/iam/IAM-006-session-context-contract-blocker.md`](file:///H:/3DDX/DEMO/newcp-ui-option-a/docs/newcp-ai/tasks/iam/IAM-006-session-context-contract-blocker.md).
   - Necessary for backend-derived active tenant context, user roles, capability flags, and session lifetime.
   - Verified HTTP test: returns `404 ROUTE_NOT_FOUND`.
2. **Orders Collection & Order Details (`GET /api/v1/orders`, `GET /api/v1/orders/{orderUuid}`, `POST /api/v1/orders`):**
   - Necessary for the global production queue (`/flow`, `/orders`), order header views, and parent order creation.
   - Verified HTTP test: returns `404 ROUTE_NOT_FOUND`.
3. **Cases Directory (`GET /api/v1/cases`, `GET /api/v1/cases/{caseId}`, `POST /api/v1/cases`):**
   - Necessary for clinical case intake, patient case history, and odontogram linking.
   - Verified HTTP test: returns `404 ROUTE_NOT_FOUND`.
4. **Patients Directory (`GET /api/v1/patients`, `GET /api/v1/patients/{patientId}`):**
   - Necessary for patient demographics, CBCT/DICOM records, and HIPAA-compliant identity disclosure.
   - Verified HTTP test: returns `404 ROUTE_NOT_FOUND`.
5. **Practice Directories (`GET /api/v1/clinics`, `GET /api/v1/doctors`, `GET /api/v1/scan-centers`):**
   - Necessary for clinic, doctor, and scanning center address books and contact role lookup.
   - Verified HTTP test: returns `404 ROUTE_NOT_FOUND`.
6. **Invoicing & Ledger (`GET /api/v1/billing`, `POST /api/v1/billing/invoices`):**
   - Live Bill To writes and ERP synchronization are blocked by unapplied V204 database migrations and missing billing contract endpoints.
7. **Change Requests & Files (`GET/POST /api/v1/change-requests`, `GET /api/v1/orders/{id}/files`):**
   - Necessary for lab technician remake requests and 3D STL/CAD file attachments.
8. **Reports & BI Analytics (`GET /api/v1/reports/*`, `GET /api/v1/powerbi/embed-token`):**
   - Necessary for production KPIs, staff quotas (Task 31), and Power BI dashboard embedding.
9. **Delete Operations (`DELETE /api/v1/services/{serviceItemUuid}`):**
   - The contract defines NO DELETE methods. Verified HTTP test: returns `404 ROUTE_NOT_FOUND`.

### 4.4 Frontend Routes Still Using Local Mock JSON / Store
The following routes in `src/app/router/index.tsx` rely exclusively on static JSON fixtures (`public/data/*.json`) or local in-memory store because no corresponding contract endpoints exist:
- `/flow` and `/orders` (`public/data/orders.json`, `flowMockData.ts`)
- `/cases` and `/cases/:caseId` (`public/data/cases.json`)
- `/dashboard` (`public/data/dashboard-volume.json`, `orders.json`)
- `/billing` (`public/data/billing.json`)
- `/clinics` and `/clinics/:id` (`public/data/clinics.json`)
- `/doctors` and `/doctors/:id` (`public/data/doctors.json`)
- `/patients` and `/patients/:id` (`public/data/patients.json`)
- `/scan-center` (`public/data/scan-centers.json`)
- `/documents` (`public/data/documents.json`)
- `/notifications` (`public/data/notifications.json`)
- `/change-requests` (`public/data/change-requests.json`)
- `/reports` (`public/data/reports.json`)
- `/quarter-targets` (local mock state / embedded iframe)
- `/task-31` (local mock quota state)
- `/profile` (local authentication store)
- `/login` (local mock auth context)
- `/config-manager` (local `app.config.json`)

---

## 5. Verification Distinction & Evidence Summary

| Verification Boundary | Status | Evidence & Verification Scope |
| :--- | :---: | :--- |
| **Contract Verified** | **YES** | All 14 endpoints in `newcp.openapi.yaml` were analyzed. Schemas, parameters, headers, and status codes (200, 201, 400, 401, 403, 404, 409, 412, 422, 428) were mapped and validated. Absence of DELETE and Orders collections verified. |
| **Mock-Server Verified** | **YES** | Standalone Node.js server (`scripts/mock-server.cjs`) was started on port 3000. 31 automated HTTP tests verified every route, query parameter filter, path parameter, request body, header (`Authorization`, `X-Tenant-ID`, `If-Match`), and `ETag` emission. |
| **Frontend Verified** | **YES** | Vite development server was started on port 5173. Reverse-proxy routing (`/api` -> `:3000`) verified via actual HTTP requests. 58 Vitest test suites (534 tests) passed. UI routes (`AddCase`, `OrderDetailsPage`, `OrderWorkflow`, `SubOrderDetail`, `DynamicFormRenderer`) verified against typed client interfaces. |
| **Live Backend Not Verified** | **UNVERIFIED / BLOCKED** | No live backend gateway, Google OAuth token exchange, Casbin policy engine, PostgreSQL V3 database, V204 migration, or Stage-90 ETL was executed. Live integration claims are strictly avoided. |

---

## 6. Known Limitations & Blockers

1. **IAM-006 Session Context Blocker:** The OpenAPI contract lacks `GET /api/v1/session/context`. The frontend maintains an explicit `MOCK / NOT_INTEGRATED` boundary (`MockSessionClient`) to prevent inventing live HTTP endpoints.
2. **Missing Parent Orders Schema:** The contract only defines endpoints scoped under an existing `orderUuid` (`/orders/{orderUuid}/services`), leaving order creation and listing uncontracted.
3. **F07 Payer Persistence Gate:** Live write operations to `billed_to_contact_id` and `billed_party_origin` remain blocked pending DBA deployment of migration V204 on PostgreSQL V3 and stage-90 reconciliation.
4. **No DELETE Operations:** No DELETE method is specified in `newcp.openapi.yaml`; service instances cannot be destroyed via contract.

---

## 7. Next Recommended Tasks

1. **Task BE-API-001:** Request Backend Architect to extend `newcp.openapi.yaml` with `GET /api/v1/session/context` conforming to v0.9.7 specifications.
2. **Task BE-API-002:** Request Backend Architect to specify `GET /api/v1/orders` and `POST /api/v1/orders` in the OpenAPI contract.
3. **Task FE-INT-002:** Prepare the frontend HTTP transport layer for seamless transition from `MOCK_HTTP` to `LIVE_HTTP` once the backend gateway is deployed.
