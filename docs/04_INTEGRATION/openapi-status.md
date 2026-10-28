# OpenAPI and Integration Status

`[CONFIRMED FACT]`

## 1. Authority and Standards

The approved New CP package requires an OpenAPI 3.0.3 contract derived from business domain specifications. Legacy Swagger files and mock fixtures serve as historical and transitional reference only. The canonical contract is located at `docs/newcp-ai/references/api/newcp.openapi.yaml` (v1.0.0). The proposed Orders Dashboard extension (`02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml`) is a proposed API draft only; dashboard API integration is NOT assigned to frontend.

---

## 2. Current Implementation Status

- `[CONFIRMED FACT]` **Status:** **Pending / Simulated**.
- `[CONFIRMED FACT]` Canonical OpenAPI contract is present in repository at `docs/newcp-ai/references/api/newcp.openapi.yaml`. Live backend service, database connection, and production infrastructure remain external.
- `[EXISTING IMPLEMENTATION]` **Mock Data Layer:**
  - `public/data/*.json`: 12 static fixtures supplying simulated records.
  - `src/shared/data/flowMockData.ts`: Static workflow arrays for complex workflow board views.
  - `src/shared/services/api.ts`: Fetch abstractions simulating network delays and returning typed domain data.
- `[EXISTING IMPLEMENTATION]` **Transport Domain Errors:**
  - `src/shared/api/errors.ts` defines typed HTTP error classes (`ApiClientError`, `AuthenticationError` 401, `TenantAccessDeniedError` 403, `ClinicalApprovalRequiredError` 409).
  - Verified with 4 unit tests in `src/shared/api/__tests__/errors.test.ts`.

---

## 3. Required Contract Contents (Pre-Integration Prerequisites)

Before frontend integration begins, the canonical OpenAPI contract must supply:
1. Complete path, HTTP method, and operation IDs for Models, Conversion, Orders, and Reporting.
2. Tenant isolation via backend session context (`Authorization: Bearer <token>`); client-controlled `X-Tenant-ID` is prohibited.
3. Required Casbin / RBAC permissions per endpoint.
4. Request bodies, query parameters, and response schemas conforming to PostgreSQL V3 models.
5. Standard RFC 7807 problem details or typed error envelope conventions.
6. Rate limiting, pagination (`page`, `pageSize`, `totalCount`), and idempotency headers for mutations.

---

## 4. Integration Workflow & Next Steps

1. **Ingest Canonical Contract:** Backend team commits `newcp.openapi.yaml`.
2. **Automated Code Generation:** Run `openapi-typescript` to generate strict TypeScript models.
3. **HTTP Client Configuration:** Instantiate `apiClient` with automatic tenant header injection and error mapping.
4. **Vertical Slice Integration:** Connect one end-to-end slice (e.g. Models / Conversion read & write) against real backend dev server.
5. **Contract Testing:** Validate frontend client schemas against OpenAPI definitions.
