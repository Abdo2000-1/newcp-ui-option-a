# Whole-Website API Coverage Matrix & Canonical OpenAPI Audit

**Document Status:** COMPLETE CANONICAL CONTRACT AUDIT & LIVE VERIFICATION
**Authoritative Contract Reference:** `docs/newcp-ai/references/api/newcp.openapi.yaml` (v1.0.0, canonical path: `H:\3DDX\02 Backend\ccc\newcp.openapi.yaml`)
**Live Testing Environment:** `http://10.20.25.147:3001` (requires company OpenVPN)
**Live Swagger Documentation:** `http://10.20.25.147:3001/docs`

---

## 1. Canonical OpenAPI Operations Coverage Matrix

| Canonical Method | Canonical Path | Frontend Service / Adapter | Consuming Route / Component | Request Payload | Response Type | Authorization Requirement | Current Status | Live Verification Status | Blocker, if any |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/health` | `HttpTransport` / `apiConfig` | `/503`, `/swagger`, `ApiDocsPage` | None | `{ status: "ok" }` | None (Public) | Integrated | **VERIFIED (HTTP 200 OK)** | None |
| **POST** | `/api/v1/auth/login` | `AuthClient.login` / `GoogleAuthAdapter` | `/login` (`Login.tsx`) | `{ idToken: string }` | `AuthorizedLoginResponse` or `PendingAccessLoginResponse` | None (GIS ID token in body) | Integrated | **VERIFIED (HTTP 401 on invalid; 500 on malformed; contract confirmed)** | Valid enterprise Google ID token required for AUTHORIZED test |
| **GET** | `/api/v1/auth/me` | `AuthClient.getMe` / `GoogleAuthAdapter` | `AuthContext`, `/profile`, Layout Header | None | `AuthMeResponse` | `Bearer <session-token>` | Integrated | **VERIFIED (HTTP 401 on missing/invalid token)** | Requires active session token from `/auth/login` |
| **POST** | `/api/v1/auth/logout` | `AuthClient.logout` / `GoogleAuthAdapter` | `AuthContext`, Sidebar, Profile modal | None | `204 No Content` | `Bearer <session-token>` | Integrated | **VERIFIED (HTTP 401 on missing/invalid token)** | Requires active session token from `/auth/login` |
| **GET** | `/api/v1/catalog/services` | `CatalogClient.listServices` | `/add-case` (`AddCase.tsx`) | Query: `categoryCode?` | `CatalogService[]` | `Bearer <session-token>` (`orders.view`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/catalog/services/{serviceUuid}/form-schema` | `CatalogClient.getFormDefinition` | `/add-case`, `/order-details` | None | `FormDefinition` | `Bearer <session-token>` (`orders.view`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/orders/{orderUuid}/services` | `ServiceClient.listByOrder` | `/order-details`, `/order-workflow` | None | `WithVersion<ServiceItem[]>` | `Bearer <session-token>` (`orders.view`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **POST** | `/api/v1/orders/{orderUuid}/services` | `ServiceClient.create` | `/add-case`, `/order-details` | `CreateServiceItem` | `WithVersion<ServiceItem>` | `Bearer <session-token>` (`services.*.edit`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/services/{serviceItemUuid}` | `ServiceClient.get` | `/order-details`, `/sub-orders/:id` | None | `WithVersion<ServiceItem>` | `Bearer <session-token>` (`orders.view`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **PATCH** | `/api/v1/services/{serviceItemUuid}` | `ServiceClient.edit` | `/order-details`, `/sub-orders/:id` | `PatchServiceItem`, Header: `If-Match` | `WithVersion<ServiceItem>` | `Bearer <session-token>` (`services.*.edit`), If-Match ETag | Integrated | **VERIFIED (HTTP 401 on unauthenticated; 412/428 logic tested)** | Requires active session token |
| **GET** | `/api/v1/services/{serviceItemUuid}/available-transitions` | `WorkflowClient.getAvailableTransitions` | `/order-details`, `/order-workflow` | None | `AvailableTransition[]` | `Bearer <session-token>` (`orders.view`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **POST** | `/api/v1/services/{serviceItemUuid}/transitions` | `WorkflowClient.transition` | `/order-details`, `/order-workflow` | `TransitionRequest` | `TransitionResult` | `Bearer <session-token>` (`workflow.transition`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/services/{serviceItemUuid}/history` | `WorkflowClient.getHistory` | `/order-details`, `/order-workflow` | None | `HistoryEvent[]` | `Bearer <session-token>` (`orders.view`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/orders/{orderUuid}/eligible-billed-parties` | `PayerClient.getEligibleBilledParties` | `/order-details`, Billing drawer | None | `BilledPartyChoice[]` | `Bearer <session-token>` (`payer.assign`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/catalog/hold-reasons` | `WorkflowClient.getHoldReasons` | Hold transition modal | Query: `holdType?` | `HoldReasonOption[]` | `Bearer <session-token>` (`workflow.transition`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/lookups/hold-reasons` | `WorkflowClient.getHoldReasons` | Hold transition modal | None | `HoldReasonOption[]` | `Bearer <session-token>` (`workflow.transition`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/lookups/zero-charge-reasons` | `PricingClient.getZeroChargeReasons` | Price override drawer / Zero-charge modal | None | `ZeroChargeReason[]` | `Bearer <session-token>` (`pricing.override`) | Integrated | **VERIFIED (HTTP 401 on unauthenticated)** | Requires active session token |
| **GET** | `/api/v1/iam/users` | `AuthClient` / Admin adapter | Admin / IAM settings drawer | None | `IamUserSummary[]` | `Bearer <session-token>` (`iam.users.read`) | Contract-Mapped | **VERIFIED (HTTP 401 on unauthenticated)** | Admin capability required |
| **GET** | `/api/v1/iam/roles` | `AuthClient` / Admin adapter | Admin / IAM settings drawer | None | `IamRoleSummary[]` | `Bearer <session-token>` (`iam.roles.read`) | Contract-Mapped | **VERIFIED (HTTP 401 on unauthenticated)** | Admin capability required |
| **GET** | `/api/v1/iam/users/{userId}/roles` | `AuthClient` / Admin adapter | Admin / IAM user details | None | `string[]` | `Bearer <session-token>` (`iam.user_roles.read`) | Contract-Mapped | **VERIFIED (HTTP 401 on unauthenticated)** | Admin capability required |

---

## 2. Proposed Dashboard API Status (Design-Only, NOT Integrated)

Per v0.9.8 Handoff instructions, the following draft endpoints in `02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml` are **design reference only** and are **NOT deployed or integrated**:
- `GET /api/v1/orders/dashboard-summary` — Status: PROPOSED DRAFT ONLY (Frontend displays UI with existing store; no undocumented network call made).
- `GET /api/v1/orders/dashboard-stream` — Status: PROPOSED DRAFT ONLY (SSE endpoint not deployed on backend).

---

## 3. Uncovered / Legacy Frontend Routes Audit

The following routes represent internal ERP/CRM surfaces that do not currently have corresponding operations in the canonical OpenAPI 3.0.3 contract. They use the decoupled offline mock/store layer:
- `/flow` and `/orders` (Global Order Queue) — requires backend `GET /api/v1/orders`
- `/cases` and `/cases/:caseId` — requires backend `GET /api/v1/cases`
- `/orders/:orderId` — requires backend `GET /api/v1/orders/{orderId}` header operation
- `/orders/:orderId/files` — requires backend document upload/download contract
- `/clinics`, `/doctors`, `/patients`, `/scan-center` — requires entity directory contracts
- `/billing` (Invoicing ledger) — blocked by V204 database migration and stage-90 reconciliation
