# API & Backend Integration Architecture: 3DDX CP PRO MAX

**Document Identifier:** `DOC-API-INTEGRATION-V1.0`  
**Application Scope:** `newcp-ui-option-a`  
**API Standard:** OpenAPI 3.0.3 (`openapi/newcp.openapi.yaml`)  

---

## 1. Architectural Strategy

The frontend enforces a strict **Contract-First API integration** model. 

To prevent breaking existing prototype functionality while backend services are developed, the application implements the **Adapter Pattern** with two interchangeable transport adapters:
1. **Mock / Simulated Adapter (`MswApiAdapter` / Local Fixtures):** Intercepts network calls during development and testing, returning typed fixtures matching OpenAPI schemas.
2. **Live HTTP Client Adapter (`OpenApiHttpAdapter`):** Dispatches real REST requests to the New CP API Gateway once staging/production environments are active.

```
+------------------------------------------------------------------+
|                   Application & Feature Layer                    |
+------------------------------------------------------------------+
                                 | consumes
                                 v
+------------------------------------------------------------------+
|               Abstract API Client Port (IApiClient)              |
+------------------------------------------------------------------+
             |                                        |
    implements (Production)                 implements (Development/Testing)
             v                                        v
+---------------------------+            +-------------------------+
|   OpenApiHttpAdapter      |            |     MswApiAdapter       |
|  (Axios / Ky + Fetch)     |            |  (Mock Service Worker)  |
+---------------------------+            +-------------------------+
             |                                        |
             v                                        v
[ New CP Backend Gateway ]               [ In-Memory Fixtures ]
```

---

## 2. Abstract API Client Interface

```typescript
export interface IApiClient {
  cases: {
    list(params: CaseQueryParams): Promise<PaginatedResult<CaseSummary>>;
    getById(caseId: string): Promise<CaseDetails>;
    create(payload: CreateCasePayload): Promise<CaseDetails>;
  };
  orders: {
    list(params: OrderQueryParams): Promise<PaginatedResult<OrderSummary>>;
    getById(orderId: string): Promise<OrderDetails>;
    create(payload: CreateOrderPayload): Promise<OrderDetails>;
  };
  services: {
    getRegistration(instanceId: string): Promise<RegistrationService>;
    submitRegistrationVerdict(instanceId: string, verdict: RegistrationVerdictPayload): Promise<void>;
    approveTreatmentPlan(instanceId: string, approval: PlanApprovalPayload): Promise<void>;
  };
  billing: {
    getVoucherLedger(accountId: string): Promise<VoucherTransaction[]>;
  };
}
```

---

## 3. HTTP Request & Response Interceptors

Every outbound request processed by `OpenApiHttpAdapter` passes through standard security and tracing middleware:

### 3.1 Security & Tracing Headers
```http
GET /api/v1/cases/case_9012 HTTP/1.1
Host: api.3ddx.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...
X-Tenant-ID: tenant_clinic_cairo_01
X-Correlation-ID: c56a4180-65aa-42ec-a945-5fd21dec0538
Accept: application/json
```

- **`Authorization`**: Short-lived JWT access token stored exclusively in application memory (never in `localStorage`).
- **`X-Tenant-ID`**: Active tenant identifier ensuring database-level row-level security (RLS) partition.
- **`X-Correlation-ID`**: Unique UUIDv4 generated per user action to trace requests across frontend and backend microservices.

### 3.2 Error Normalization (RFC 7807)
Server errors return standardized Problem Details which are converted into strongly typed frontend domain exceptions:
```json
{
  "type": "https://api.3ddx.com/errors/manufacturing-approval-required",
  "title": "Clinical Approval Gate Violation",
  "status": 409,
  "detail": "Surgical guide cannot proceed to 3D printing without verified doctor approval.",
  "instance": "/orders/sg_4102/approve"
}
```

---

## 4. Large Binary File Upload Transport

Clinical scans (DICOM CBCT archives up to 2 GB and optical STL meshes up to 250 MB) do not pass through application API servers:
1. **Pre-Signed URL Request:** Frontend requests an upload slot from `/api/v1/documents/upload-slot`.
2. **Integrity Pre-computation:** Client computes SHA-256 checksum during streaming file read.
3. **Direct Cloud Storage Upload:** Uploads file directly to cloud bucket (AWS S3 / Google Cloud Storage) with progress telemetry.
4. **Completion Notification:** Calls `/api/v1/documents/confirm` with file metadata, size, and SHA-256 hash.

---

*Specification approved for Option A API integration.*