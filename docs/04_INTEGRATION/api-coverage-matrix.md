# Whole-Website API Coverage Matrix

**Document Status:** COMPLETE AUDIT  
**OpenAPI Contract Reference:** `docs/newcp-ai/references/api/newcp.openapi.yaml` (v1.0.0, SHA256: `47f759ec4b406ffa350a7cc947fda0a5ed88d761f8a8fc9f4a16642285644394`)  
**Mock Server Status:** UNAVAILABLE / BLOCKED (`http://localhost:3000` is offline; no active port listener or runner script)

---

## 1. Route-by-Route API Coverage & Gap Analysis

| Route / Page | Current Data Source | Required API Operation | Contract Operation & Path | Current Status | Affected Files | Integration Risk | Required Backend Decision | Proposed Bounded PR |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/add-case`** (New Order Wizard) | `store.createOrder`, `store.cases` (Local Store) | 1. List catalog services<br>2. Get dynamic form schema<br>3. Create service item | `listDemoCatalogServices` (`GET /api/v1/catalog/services`)<br>`getServiceFormSchema` (`GET /api/v1/catalog/services/{serviceUuid}/form-schema`)<br>`createOrderServiceItem` (`POST /api/v1/orders/{orderUuid}/services`) | **Partially Covered** (Service items covered; parent Order creation missing from contract) | `src/features/orders/pages/AddCase.tsx` | Medium (Wizard currently assumes atomic parent order creation + service attachment) | Backend must provide `POST /api/v1/orders` or clarify order initialization flow | **T-API-003** (Catalog & Dynamic Schema), **T-API-004** (Service Creation) |
| **`/order-details`** (Order Details Workspace) | `useStore`, `store.getOrderById`, `flowMockData` | 1. Read service item details<br>2. Edit service instance<br>3. Available transitions<br>4. History event trail | `getServiceItem` (`GET /api/v1/services/{serviceItemUuid}`)<br>`patchServiceItem` (`PATCH /api/v1/services/{serviceItemUuid}`)<br>`listServiceTransitions` (`GET /api/v1/services/{serviceItemUuid}/available-transitions`)<br>`getServiceHistory` (`GET /api/v1/services/{serviceItemUuid}/history`) | **Covered by Current Contract** | `src/features/orders/pages/OrderDetailsPage.tsx` | High (Requires ETag concurrency, atomic hold, price override, and If-Match) | Confirm tenant ID header injection and If-Match mismatch UI handling | **T-API-004** (Service Edit), **T-API-005** (ETag), **T-API-006** (Workflow & History) |
| **`/orders/:orderId/sub-orders/:subOrderId`** | `useStore` | Read single service instance & form answers | `getServiceItem` (`GET /api/v1/services/{serviceItemUuid}`) | **Covered by Current Contract** | `src/features/orders/pages/SubOrderDetail.tsx` | Low | Map legacy sub-order ID to `serviceItemUuid` | **T-API-004** (Service Details) |
| **`/orders/:orderId/workflow`** | `useStore`, `store.updateOrderStatus` | 1. Available transitions<br>2. Advance workflow<br>3. Service history | `listServiceTransitions` (`GET .../available-transitions`)<br>`advanceServiceWorkflow` (`POST .../transitions`)<br>`getServiceHistory` (`GET .../history`) | **Covered by Current Contract** | `src/features/orders/pages/OrderWorkflow.tsx` | High (Atomic hold reason code + holdType required) | Agree on transition error message toast conventions | **T-API-006** (Workflow & History) |
| **`/workflow-board`** | `useStore`, `store.orders` | Query transitions & advance service item status | `listServiceTransitions`<br>`advanceServiceWorkflow` | **Partially Covered** (Service items covered; global board query missing) | `src/features/orders/pages/WorkflowBoard.tsx` | Medium (Board currently operates on orders, not discrete service instances) | Backend must provide `GET /api/v1/workflow/board` or batch service transitions | **T-API-006** (Service Transitions) |
| **`/task-47`** (Model Work Report) | Local state, mock presets | List order service items filtered for Biomodel/Model Work | `listOrderServiceItems` (`GET /api/v1/orders/{orderUuid}/services`) | **Partially Covered** (Per-order service items covered; global Task 47 query missing) | `src/features/models/pages/Task47ModelWorkReport.tsx` | Medium | Backend must provide catalog-filtered queue query endpoint | **T-API-004** (Service Listing) |
| **`/flow` & `/orders`** (Production Queue) | `flowMockData.ts`, `orders.json` | Global order list, search, multi-service column rollup | **None** (Contract only has `GET /orders/{orderUuid}/services`) | **Not Covered / Requires Backend Operation** | `src/features/orders/pages/Flow.tsx` | High (Core production table requires backend order queue endpoint) | Backend must supply `GET /api/v1/orders` with pagination, search, and service rollup | **T-API-009** (Gap Request) |
| **`/cases`** | `cases.json`, `store.cases` | Cases listing, search, status filtering | **None** | **Not Covered / Requires Backend Operation** | `src/features/orders/pages/Cases.tsx` | Low (Auxiliary) | Backend must supply `GET /api/v1/cases` | **T-API-009** (Gap Request) |
| **`/cases/:caseId`** | `cases.json`, `api.getCase` | Case details, clinical notes, patient association | **None** | **Not Covered / Requires Backend Operation** | `src/features/orders/pages/CaseDetails.tsx` | Low | Backend must supply `GET /api/v1/cases/{caseId}` | **T-API-009** (Gap Request) |
| **`/orders/:orderId`** | `useStore`, `orders.json` | Order header details, doctor/patient info | **None** (Only service items covered) | **Not Covered / Requires Backend Operation** | `src/features/orders/pages/ViewOrder.tsx` | Medium | Backend must supply `GET /api/v1/orders/{orderUuid}` | **T-API-009** (Gap Request) |
| **`/orders/:orderId/files`** | `useStore`, mock attachments | Document/CAD file listing and upload | **None** | **Not Covered / Requires Backend Operation** | `src/features/orders/pages/OrderFiles.tsx` | Medium | Backend must supply `GET /orders/{id}/files` and upload presigned URL | **T-API-009** (Gap Request) |
| **`/change-requests`** | `store.changeRequests` | Change request approval/rejection | **None** | **Not Covered / Requires Backend Operation** | `src/features/orders/pages/ChangeRequests.tsx` | Medium | Backend must supply `GET/POST /api/v1/change-requests` | **T-API-009** (Gap Request) |
| **`/dashboard`** | `useStore`, mock analytics | CRM metrics, studio revenue, CAD queue KPIs | **None** | **Not Covered / Requires Backend Operation** | `src/features/reporting/pages/Dashboard.tsx` | Low (Executive view) | Backend must supply aggregate analytics endpoint | **T-API-009** (Gap Request) |
| **`/reports`** | `useStore` | Financial and production reports | **None** | **Not Covered / Requires Backend Operation** | `src/features/reporting/pages/Reports.tsx` | Low | Backend must supply `/api/v1/reports/*` | **T-API-009** (Gap Request) |
| **`/quarter-targets`** | Mock targets & Power BI slicers | Quarterly financial and studio targets | **None** | **Not Covered / Requires Backend Operation** | `src/features/reporting/pages/QuarterTargetsReport.tsx` | Low | Backend must supply Power BI embed token & target stats | **T-API-009** (Gap Request) |
| **`/task-31`** | Mock staff target state | Staff targets and CAD technician performance | **None** | **Not Covered / Requires Backend Operation** | `src/features/reporting/pages/Task31StaffTargets.tsx` | Low | Backend must supply `/api/v1/staff-targets` | **T-API-009** (Gap Request) |
| **`/billing`** | `billing.json`, `store.billing` | Invoicing ledger, payments, overdue tracking | **Blocked / Proposal** (Contract only has proposal `eligible-billed-parties`) | **Blocked by Database V204 & Missing Invoicing Endpoints** | `src/features/settings/pages/Billing.tsx` | High (F07 Bill To live writes blocked; ERP sync not in contract) | V204 migration deployment, stage-90 reconciliation, and billing ledger contract | **T-API-008** (Payer Read-Only), **T-API-009** (Gap Request) |
| **`/clinics` & `/clinics/:id`** | `clinics.json`, `api.getClinics` | Clinic directory and management | **None** | **Not Covered / Requires Backend Operation** | `src/features/settings/pages/Clinics.tsx`, `ClinicDetails.tsx` | Low | Backend must supply `/api/v1/clinics` | **T-API-009** (Gap Request) |
| **`/doctors` & `/doctors/:id`** | `doctors.json`, `api.getDoctors` | Doctor directory and profile | **None** | **Not Covered / Requires Backend Operation** | `src/features/settings/pages/Doctors.tsx`, `DoctorDetails.tsx` | Low | Backend must supply `/api/v1/doctors` | **T-API-009** (Gap Request) |
| **`/patients` & `/patients/:id`** | `patients.json`, `api.getPatients` | Patient directory, medical history, odontogram | **None** | **Not Covered / Requires Backend Operation** | `src/features/settings/pages/Patients.tsx`, `PatientDetails.tsx` | Medium (Requires HIPAA / 13.9 anonymization) | Backend must supply `/api/v1/patients` with identity token reveal audit | **T-API-009** (Gap Request) |
| **`/scan-center`** | `scanCenters.json` | Scanning center directory | **None** | **Not Covered / Requires Backend Operation** | `src/features/settings/pages/ScanCenter.tsx` | Low | Backend must supply `/api/v1/scan-centers` | **T-API-009** (Gap Request) |
| **`/documents`** | `documents.json` | Prescriptions, scan files, invoices | **None** | **Not Covered / Requires Backend Operation** | `src/features/settings/pages/Documents.tsx` | Low | Backend must supply `/api/v1/documents` | **T-API-009** (Gap Request) |
| **`/notifications`** | `store.notifications` | Operator notifications & unread counts | **None** | **Not Covered / Requires Backend Operation** | `src/features/settings/pages/Notifications.tsx` | Low | Backend must supply `/api/v1/notifications` (SSE or polling) | **T-API-009** (Gap Request) |
| **`/profile`** | `store.profile` | Current clinician/operator profile | **None** | **Not Covered / Requires Backend Operation** | `src/features/auth/pages/Profile.tsx` | Low | Backend must supply `GET/PUT /api/v1/auth/me` | **T-API-009** (Gap Request) |
| **`/login`** | Local mock login state | Google OAuth 2.0 PKCE / Session Authentication | **None** (Contract only defines `BearerAuth` scheme) | **Not Covered / Requires Auth Backend** | `src/features/auth/pages/Login.tsx` | High (Security / Auth) | Backend must establish OAuth token exchange and session cookies | **T-API-009** (Gap Request) |
| **`/settings`** | `store.profile`, language/theme context | System preferences | **None** | **Not Covered (Client-Side State)** | `src/features/settings/pages/Settings.tsx` | Low | None (App-level preference persistence) | N/A |
| **`/config-manager` & `/cms`** | Static rules JSON | CMS & business rule manager | **None** | **Not Covered / Prototype Tool** | `src/features/settings/pages/ConfigManager.tsx` | Low | None | N/A |
| **`/forms` & `/grid`** | Demo mock state | UI component showcase | **None** | **Not Covered / Developer Sandbox** | `src/features/settings/pages/Forms.tsx`, `Grid.tsx` | Low | None | N/A |
| **`/404` & `/503`** | Static system views | Dedicated error boundary views | `getHealth` (`GET /health`) | **Static System Pages** | `src/features/system/pages/NotFoundPage.tsx`, `Maintenance503Page.tsx` | Low | None (Can wire `/503` retry to `GET /health`) | **T-API-002** (Health Check) |

---

## 2. Summary of Coverage Categories

1. **Directly Covered by OpenAPI Contract (7 Functional Areas):**
   - Catalog service listing (`GET /api/v1/catalog/services`)
   - Dynamic service form schemas (`GET /api/v1/catalog/services/{serviceUuid}/form-schema`)
   - Service instance listing & details (`GET /api/v1/orders/{orderUuid}/services`, `GET /api/v1/services/{serviceItemUuid}`)
   - Service instance creation & editing (`POST /api/v1/orders/{orderUuid}/services`, `PATCH /api/v1/services/{serviceItemUuid}`)
   - ETag and If-Match optimistic concurrency (`412` and `428` handling)
   - Workflow transitions & atomic On Hold (`GET .../available-transitions`, `POST .../transitions`)
   - Service instance audit history (`GET /api/v1/services/{serviceItemUuid}/history`)
   - Pricing display, authorized overrides, zero-charge reasons (`GET /api/v1/lookups/zero-charge-reasons`)
   - Independent `isBillable` flag

2. **Covered ONLY by Existing Mock Layer (Uncovered by Contract - 18 Routes):**
   - Global Order Queue & Production List (`/flow`, `/orders`)
   - Cases & Case Details (`/cases`, `/cases/:caseId`)
   - Order Header & CAD Attachments (`/orders/:orderId`, `/orders/:orderId/files`)
   - CRM & Executive Dashboards (`/dashboard`, `/reports`, `/quarter-targets`, `/task-31`)
   - Billing & Accounts Receivable Ledger (`/billing`)
   - Entity Directories: Clinics, Doctors, Patients, Scan Centers (`/clinics`, `/doctors`, `/patients`, `/scan-center`)
   - Operator Profile, Notifications, Documents (`/profile`, `/notifications`, `/documents`)
   - Authentication & Login (`/login`)

3. **Blocked by Missing Backend / Database Behavior (2 Key Areas):**
   - **Live F07 Service-Level Bill To Persistence:** V204 migration is not applied to live MySQL/PostgreSQL databases; stage-90 ETL is unexecuted. Real database writes are strictly blocked.
   - **Live Mock Server:** `http://localhost:3000` is offline; no active port listener or runner script exists in the environment.
