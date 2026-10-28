# Backend Contract Gap Requests for Uncovered Frontend Routes

**Document Version:** 1.0.0  
**Target Repository:** New CP Option A Frontend (`newcp-ui-option-a`)  
**Contract Baseline:** `docs/newcp-ai/references/api/newcp.openapi.yaml` (v1.0.0)  
**Status:** FORMAL BACKEND INTEGRATION GAP SUBMISSION  
**Classification:** ARCHITECTURAL SPECIFICATION & CONTRACT REQUEST  

---

## 1. Executive Summary

During the Phase 1 OpenAPI integration audit for the New CP Option A frontend, a complete route-by-route analysis was conducted against the repository-local canonical OpenAPI specification (`docs/newcp-ai/references/api/newcp.openapi.yaml`).

The current OpenAPI contract authoritatively covers **Service Instances**, **Catalog Services**, **Dynamic Service Form Schemas**, **ETag Concurrency**, **Workflow Transitions**, **Atomic On Hold (Q-B9)**, **Zero-Charge Reasons (Q-B10)**, and the **Proposal-only Eligible Billed Parties Boundary (F07)**.

However, **18 distinct frontend routes and functional workflows remain completely uncovered** by the current contract. These features currently rely exclusively on offline mock adapters, static fixtures, or in-memory stores. To transition New CP from an offline prototype to a fully integrated production application, the backend engineering team must formally review, specify, and provide canonical OpenAPI operations for these domains.

This document serves as the authoritative, machine-readable gap specification and contract change request for the backend team.

---

## 2. API Coverage Breakdown

| Category | Routes / Domains | Contract Status | Execution Mode |
| :--- | :--- | :--- | :--- |
| **Covered by Current Contract** | `/order-details`, `/orders/:id/sub-orders/:id`, `/orders/:id/workflow`, `/add-case` (service item portions) | Standardized in OpenAPI 3.0.3 | Ready for live backend when server is online |
| **Proposal Boundary (F07)** | `/orders/:id/eligible-billed-parties` | Defined as proposal; V3 DB unconfirmed | Isolated read-only boundary; NO DB writes |
| **Uncovered Routes (18 Routes)** | `/flow`, `/orders`, `/cases`, `/cases/:id`, `/cases/add`, `/clinics`, `/doctors`, `/patients`, `/dashboard`, `/reports`, `/quarter-targets`, `/task-31`, `/task-47` (global), `/billing`, `/documents`, `/notifications`, `/profile`, `/login` | **ABSENT FROM CONTRACT** | **EXPLICIT MOCK / NOT_INTEGRATED** |

---

## 3. High-Priority Backend Contract Requests

### Gap 1: Global Order Queue & Flow Management (`/flow`, `/orders`)

**Frontend Consumer:** `src/features/orders/pages/Flow.tsx`  
**Current State:** Reads local `flowMockData.ts` and `orders.json`.  
**Integration Problem:** The OpenAPI contract provides `GET /api/v1/orders/{orderUuid}/services` (per-order service listing), but provides **no endpoint to list, search, paginate, or filter orders** across the production studio.

#### Proposed Operation: List Production Orders
- **Path:** `GET /api/v1/orders`
- **OperationId:** `listProductionOrders`
- **Tags:** `['Orders', 'Production']`
- **Query Parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 25, max: 100)
  - `search` (string, optional: patient name, order number, doctor name, clinic name)
  - `status` (string, enum: `pending_intake`, `in_progress`, `on_hold`, `completed`, `cancelled`, `shipped`)
  - `priority` (string, enum: `standard`, `rush`, `urgent`)
  - `clinicUuid` (UUID, optional)
  - `doctorUuid` (UUID, optional)
  - `dateFrom`, `dateTo` (ISO date strings, optional)
  - `sortBy` (string, enum: `createdAt`, `targetDueDate`, `orderNumber`, `status`)
  - `sortOrder` (string, enum: `asc`, `desc`)
- **Success Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "orderUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "orderNumber": "ORD-504901",
        "patientName": "Sarah Connor",
        "doctorName": "Dr. Marcus Brody",
        "clinicName": "Metropolis Dental Care",
        "status": "in_progress",
        "priority": "rush",
        "createdAt": "2026-10-25T14:30:00Z",
        "targetDueDate": "2026-10-30T17:00:00Z",
        "serviceItemCount": 2,
        "services": [
          {
            "serviceItemUuid": "srv-101",
            "name": "Biomodel 3D Print",
            "categoryCode": "restorative",
            "status": "in_progress",
            "isBillable": true,
            "lineTotal": "140.00"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalRecords": 184,
      "totalPages": 8
    }
  }
  ```

---

### Gap 2: Case Intake & Order Header Creation (`/cases/add`, `/add-case`)

**Frontend Consumer:** `src/features/orders/pages/AddCase.tsx`  
**Current State:** Directly mutates frontend `store.cases` and `store.orders`.  
**Integration Problem:** The OpenAPI contract allows creating service items (`POST /api/v1/orders/{orderUuid}/services`), but requires an **existing `orderUuid`**. There is no contract operation to create or initialize the parent Order entity.

#### Proposed Operation: Create Order Header
- **Path:** `POST /api/v1/orders`
- **OperationId:** `createOrder`
- **Tags:** `['Orders']`
- **Headers:** `Idempotency-Key` (UUID, optional)
- **Request Body (`application/json`):**
  ```json
  {
    "clinicUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "doctorUuid": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "patientUuid": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
    "orderType": "clinical_cad",
    "priority": "standard",
    "targetDueDate": "2026-11-05T18:00:00Z",
    "clinicalNotes": "Mandibular 1st molar crown prep.",
    "panoramicImageRequired": false
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "orderUuid": "6fa85f64-5717-4562-b3fc-2c963f66afa9",
    "orderNumber": "ORD-505102",
    "status": "draft",
    "createdAt": "2026-10-26T02:00:00Z",
    "etag": "W/\"ord-6fa85f64-1\""
  }
  ```

---

### Gap 3: Case Management & Medical Record Directory (`/cases`, `/cases/:id`)

**Frontend Consumer:** `src/features/orders/pages/Cases.tsx`, `CaseDetails.tsx`  
**Current State:** Consumes `cases.json` fixture.  
**Required Operations:**
1. `GET /api/v1/cases` — Filterable case registry.
2. `GET /api/v1/cases/{caseId}` — Case clinical details, tooth chart annotations, prescription scans.
3. `PATCH /api/v1/cases/{caseId}` — Update clinical impressions and prescription notes.

---

### Gap 4: Entity Directories (`/clinics`, `/doctors`, `/patients`, `/scan-centers`)

**Frontend Consumers:**  
- `src/features/settings/pages/Clinics.tsx`, `ClinicDetails.tsx`  
- `src/features/settings/pages/Doctors.tsx`, `DoctorDetails.tsx`  
- `src/features/settings/pages/Patients.tsx`, `PatientDetails.tsx`  
- `src/features/settings/pages/ScanCenter.tsx`  

**Required Operations:**
1. `GET /api/v1/clinics` & `GET /api/v1/clinics/{clinicUuid}`
2. `GET /api/v1/doctors` & `GET /api/v1/doctors/{doctorUuid}`
3. `GET /api/v1/patients` & `GET /api/v1/patients/{patientUuid}`
   - *Security Note:* Must implement HIPAA-compliant de-identification / masking and record-access audit trails.
4. `GET /api/v1/scan-centers` & `GET /api/v1/scan-centers/{scanCenterUuid}`

---

### Gap 5: Executive Dashboard & Reporting Analytics (`/dashboard`, `/reports`, `/quarter-targets`, `/task-31`)

**Frontend Consumers:**  
- `src/features/reporting/pages/Dashboard.tsx`  
- `src/features/reporting/pages/Reports.tsx`  
- `src/features/reporting/pages/QuarterTargetsReport.tsx`  
- `src/features/reporting/pages/Task31StaffTargets.tsx`  

**Required Operations:**
1. `GET /api/v1/analytics/dashboard-summary` — Aggregated KPI metrics: active cases, in-production count, on-hold count, revenue to date, average turnaround time.
2. `GET /api/v1/analytics/quarter-targets` — Targets vs. actual production volume by product tier.
3. `GET /api/v1/analytics/powerbi-embed-token` — Secure embed token for embedded Microsoft Power BI reporting canvas.
4. `GET /api/v1/analytics/staff-performance` — Task 31 technician throughput and SLA compliance.

---

### Gap 6: Full Billing & Accounts Receivable Ledger (`/billing`)

**Frontend Consumer:** `src/features/settings/pages/Billing.tsx`  
**Current State:** `billing.json` mock ledger.  
**Database Blocker:** F07 database migration V204 (`order_items.billed_to_contact_id` and `billed_party_origin`) is unmigrated in production. ERP sync (QuickBooks / NetSuite) endpoints are undefined.

**Required Operations:**
1. `GET /api/v1/billing/invoices` — List invoices with payment status (`draft`, `issued`, `paid`, `overdue`, `voided`).
2. `GET /api/v1/billing/invoices/{invoiceUuid}` — Line item invoice breakdown.
3. `POST /api/v1/billing/invoices/generate` — Generate invoice from completed billable service items.
4. `POST /api/v1/billing/payments` — Record payment receipt against invoice.

---

### Gap 7: Authentication, Session Management, & Operator Profile (`/login`, `/profile`)

**Frontend Consumer:** `src/features/auth/pages/Login.tsx`, `Profile.tsx`  
**Current State:** Contract-defined in v0.9.8; backend IAM reported complete by Hesham; live verification unverified in this environment.

**Approved Operations (v0.9.8):**
1. `POST /api/v1/auth/login` — Google Identity Services ID token exchange (`{ idToken }` -> `AUTHORIZED` with `token, expiresAt` or `PENDING_ACCESS`).
2. `GET /api/v1/auth/me` — Current authenticated user identity (`email, userUuid, tenantSlug, roleCodes, capabilities, isPendingAccess`).
3. `POST /api/v1/auth/logout` — Revoke application session token.
4. `PUT /api/v1/auth/me` — Update operator profile, locale, and notification preferences (deferred).

---

## 4. Architectural Rules for Backend Implementers

1. **RFC 7807 Problem Details:** All error responses (`4xx` and `5xx`) must use `application/json` with the canonical `Problem` schema (`code`, `message`, `requestId`, `details`).
2. **Concurrency & ETag (`If-Match`):** All resource mutation endpoints (`PATCH`, `PUT`, `DELETE`, and workflow `POST`) must mandate `If-Match` headers containing the resource ETag. Missing header must yield HTTP `428 Precondition Required`; stale ETag must yield HTTP `412 Precondition Failed`.
3. **Multi-Tenant Isolation:** All endpoints must enforce tenant scoping via server-validated session context (`Authorization: Bearer <token>`). The frontend does NOT send client-controlled `X-Tenant-ID` or `tenantId` headers. Unmatched tenant entities must return `404 Not Found` (masked) to prevent cross-tenant enumeration.
4. **Idempotency:** Non-safe actions must accept `Idempotency-Key` headers to ensure network resilience during automated retries.

---

## 5. Hand-off and Review Next Steps

1. Backend team to review the 7 gap areas above and prioritize them against the sprint roadmap.
2. Backend team to incorporate these paths into `newcp.openapi.yaml` in iterative PRs.
3. Frontend team will connect each feature page upon availability of live staging endpoints.
