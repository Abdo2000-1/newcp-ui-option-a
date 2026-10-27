# Frontend Authentication Contract Gap & Backend API Change Request

**Document ID:** FE-AUTH-CONTRACT-GAP-001  
**Status:** `CONTRACT GAP — DO NOT IMPLEMENT AS LIVE API`  
**Date:** 2026-10-27  
**Applies to:** New CP Option A & Option B Authentication / Session Boundary  
**References:**
- `newcp.openapi.yaml` (canonical OpenAPI contract)
- `newcp-demo-f07.openapi.yaml` (F07 contract)
- `TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`
- `IAM_APPROVED_BUSINESS_SPEC_v1.2.md`
- Decision `IAM-TENANT-002` (2026-10-27)

---

## 1. Executive Summary

During the preflight assessment for the Google-only login and session adapter implementation, an audit of all OpenAPI specifications in the repository was conducted:
- `docs/newcp-ai/references/api/newcp.openapi.yaml`
- `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml`
- `docs/newcp-ai/references/v07/contracts/newcp-demo.openapi.yaml`

**Audit Finding:**  
None of the required authentication or session management endpoints exist in the current OpenAPI contracts.

| Required Endpoint | HTTP Method | Expected Responsibility | OpenAPI Status | Implementation Status |
|---|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Exchanges Google ID token for application session token | **MISSING** | CONTRACT GAP — DO NOT IMPLEMENT AS LIVE API |
| `/api/v1/session/context` | `GET` | Returns active tenant, user identity, roles, capabilities, access status | **MISSING** | CONTRACT GAP — DO NOT IMPLEMENT AS LIVE API |
| `/api/v1/auth/logout` | `POST` | Revokes server-side session token and clears tenant context | **MISSING** | CONTRACT GAP — DO NOT IMPLEMENT AS LIVE API |
| `/api/v1/auth/refresh` | `POST` | Renews session token subject to 30m idle and 8h absolute timeouts | **MISSING** | CONTRACT GAP — DO NOT IMPLEMENT AS LIVE API |

Per workspace engineering rules:
- **Do NOT invent endpoints** in client code.
- **Do NOT pretend the frontend is live-integrated.**
- Keep all authentication and session adapters explicitly classified as `MOCK / NOT_INTEGRATED`.
- Stop before attempting live network dispatch to non-existent backend endpoints.

---

## 2. Detailed Contract Gaps

### A. POST /api/v1/auth/login
- **Request Body:**
  ```json
  {
    "idToken": "<google-id-token>"
  }
  ```
- **Contract Gaps:**
  - Endpoint path is completely absent from `newcp.openapi.yaml`.
  - No request schema or validation for `idToken`.
  - No response schema defining the returned application session token (`sessionToken`), token type (`Bearer`), and expiration timestamp (`expiresAt`).
  - No contract definition for Google identity linking errors (e.g. unlinked Google subject, invalid token signature, non-`@3ddx.com` domain rejection).

### B. GET /api/v1/session/context
- **Header:** `Authorization: Bearer <session-token>` (or HttpOnly session cookie)
- **Contract Gaps:**
  - Endpoint path is completely absent.
  - No response DTO defining `user` (`id`, `displayName`, `email`), `accessStatus` (`AUTHORIZED`, `PENDING`, `TENANT_NOT_ASSIGNED`, `TENANT_ACCESS_DENIED`), `activeTenant` (`id`, `label`), `roles`, `capabilities`, `tenantSwitchingEnabled`.
  - No specification for Pending Access representation when authenticated with Google but lacking internal IAM tenant-1 assignment (`activeTenant: null`, `tenantId: null`).

### C. POST /api/v1/auth/logout
- **Contract Gaps:**
  - Endpoint path is absent.
  - No server-side session revocation contract or audit event logging specification.

### D. POST /api/v1/auth/refresh
- **Contract Gaps:**
  - Endpoint path is absent.
  - No idle timeout (30-minute) and absolute lifetime (8-hour) enforcement rules in API documentation.

### E. Error Schemas and HTTP Status Codes
- Missing RFC 7807 problem details specifications for:
  - `401 Unauthorized`: `AUTHENTICATION_REQUIRED`, `SESSION_EXPIRED`, `INVALID_TOKEN`
  - `403 Forbidden`: `ACCESS_NOT_ASSIGNED` (Pending Access), `TENANT_NOT_ASSIGNED`, `TENANT_ACCESS_DENIED`, `PERMISSION_DENIED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_DELETED`

---

## 3. Impact on Frontend Tasks

1. **Task 4 (FE-AUTH-LOGIN-UI):**
   - The UI controls are updated to match the single Google Sign-In action (removing email/password inputs, role selectors, forgot password, remember workstation token).
   - Because live Google Identity Services client ID and `POST /api/v1/auth/login` are not deployed or contracted, the interactive action is wired to the safe client simulation boundary (`APPROVED_DEMO_IDENTITIES` and unassigned identity), explicitly labelled as `MOCK / NOT_INTEGRATED`.
   - UI safely handles all states: Google sign-in loading, authentication failure, authorized session, pending access, 401 session expired, and 403 access denied.
2. **Task 5 (FE-AUTH-SESSION-ADAPTER):**
   - Live HTTP session adapter implementation is **strictly blocked** by the missing contract.
   - The task is completed as a documented blocker with typed interfaces and error adapters, awaiting backend OpenAPI contract ingestion.

---

## 4. Formal Backend API Contract Change Request (CR-AUTH-001)

The backend team is requested to add the following OpenAPI 3.0.3 specification to `newcp.openapi.yaml`:

```yaml
paths:
  /api/v1/auth/login:
    post:
      summary: Authenticate via Google ID Token
      description: Exchanges a verified Google OIDC ID token for an internal application session token.
      operationId: authLoginWithGoogle
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - idToken
              properties:
                idToken:
                  type: string
                  description: Google ID token from Google Identity Services.
      responses:
        '200':
          description: Successfully authenticated and authorized.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthLoginResponse'
        '401':
          description: Invalid or expired Google token.
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '403':
          description: Authenticated but access not assigned (Pending Access) or account suspended.
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'

  /api/v1/session/context:
    get:
      summary: Retrieve Current Session and Tenant Context
      description: Returns the verified session identity, active tenant context, access status, roles, and capabilities.
      operationId: getSessionContext
      tags:
        - Authentication
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Current session context.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionContextResponse'
        '401':
          description: Unauthenticated or session expired.
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '403':
          description: Tenant access denied or account inactive.
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'

  /api/v1/auth/logout:
    post:
      summary: Revoke Current Application Session
      description: Revokes the active session token and clears transaction tenant context.
      operationId: authLogout
      tags:
        - Authentication
      security:
        - BearerAuth: []
      responses:
        '204':
          description: Session successfully revoked.
        '401':
          description: Unauthenticated.

  /api/v1/auth/refresh:
    post:
      summary: Refresh Session Token
      description: Refreshes active session token subject to 30m idle and 8h absolute timeout rules.
      operationId: authRefresh
      tags:
        - Authentication
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Refreshed session token.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthLoginResponse'
        '401':
          description: Idle timeout or absolute session lifetime exceeded.

components:
  schemas:
    AuthLoginResponse:
      type: object
      required:
        - sessionToken
        - tokenType
        - expiresAt
        - accessStatus
      properties:
        sessionToken:
          type: string
        tokenType:
          type: string
          example: Bearer
        expiresAt:
          type: integer
          description: Epoch millisecond timestamp of absolute session expiration.
        accessStatus:
          type: string
          enum: [AUTHORIZED, PENDING, TENANT_NOT_ASSIGNED, TENANT_ACCESS_DENIED]

    SessionContextResponse:
      type: object
      required:
        - user
        - accessStatus
        - activeTenant
        - roles
        - capabilities
        - tenantSwitchingEnabled
      properties:
        user:
          type: object
          nullable: true
          required: [id, displayName, email]
          properties:
            id:
              type: string
            displayName:
              type: string
            email:
              type: string
        accessStatus:
          type: string
          enum: [AUTHORIZED, PENDING, TENANT_NOT_ASSIGNED, TENANT_ACCESS_DENIED, PERMISSION_DENIED, SESSION_EXPIRED]
        activeTenant:
          type: object
          nullable: true
          required: [id, label]
          properties:
            id:
              type: integer
            label:
              type: string
        roles:
          type: array
          items:
            type: string
        capabilities:
          type: array
          items:
            type: string
        tenantSwitchingEnabled:
          type: boolean
          example: false
