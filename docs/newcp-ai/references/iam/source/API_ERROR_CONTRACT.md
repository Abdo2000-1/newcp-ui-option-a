# API and React error behavior — IAM supplement

Approved: Google-authenticated but unassigned => restricted Pending Access UI and **403** from protected business APIs. Wrong privileged action => **403**; unauthenticated/expired/revoked => **401**. Explicit unapproved tenant => **403**. Lookup of inaccessible resource may deliberately return **404** to avoid data leaks.

Recommended application error codes (require consistency with OpenAPI): `AUTHENTICATION_REQUIRED`, `ACCESS_NOT_ASSIGNED`, `PERMISSION_DENIED`, `TENANT_ACCESS_DENIED`, `RESOURCE_NOT_FOUND`, `FINANCIAL_LOCK_CONFLICT`, `WORKFLOW_CONFLICT`, `BUSINESS_VALIDATION_FAILED`. Q-B8 contract already approves `412` stale ETag and `428` missing If-Match; Q-B10 approves `422 ZERO_CHARGE_REASON_REQUIRED` with `details.field=zeroChargeReasonCode`.

Proposed envelope: `{ "error": { "code": "PERMISSION_DENIED", "message": "You do not have access to this action", "requestId": "request-ref" } }`. Reconcile this *proposed shape* against actual implemented OpenAPI. Never return patient data, hidden resource existence, internal provider tokens, or detailed role-policy expressions to clients.

Frontend must differentiate: `401` => sign-in; `403 ACCESS_NOT_ASSIGNED` => Pending Access; other `403` => forbidden action; `412` => concurrent edit reload; `428` => missing precondition implementation error; `422` => show field errors; `409 FINANCIAL_LOCK_CONFLICT` => locked-state message. Both React options must implement identical business behavior.
