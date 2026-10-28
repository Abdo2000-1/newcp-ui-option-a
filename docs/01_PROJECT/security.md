# Security and Data Handling

## Scope

This document applies to the New CP engineering workflow and future implementation repositories. It is not a security certification. The supplied V3 review report explicitly does not provide broad database review, production readiness, or sign-off.

## Secrets and sensitive data

- Keep credentials, OAuth client secrets, tokens, private keys, production dumps, PHI, customer data, and SSH keys out of Git, AI prompts, logs, telemetry, screenshots, issues, and evidence.
- Use `.env.example` only for variable names and safe non-secret examples once an actual application repository exists.
- Use the approved secret manager or CI environment secrets; never fabricate values.
- Sanitize demo data and validate that screenshots and logs contain no sensitive values before sharing.

## Authentication and authorization

Under approved New CP v0.9.8 requirements:
- Google Identity Services (GIS) is used for authentication only; Google Groups are strictly excluded from authorization.
- Interactive login transmits the Google ID token via `POST /api/v1/auth/login` (`{ "idToken": "<google-id-token>" }`).
- The backend verifies identity against PostgreSQL V3 IAM + Casbin and returns `AUTHORIZED` with application session token (`{ "accessStatus": "AUTHORIZED", "token": "...", "expiresAt": "..." }`) or `PENDING_ACCESS` with no session token (`{ "accessStatus": "PENDING_ACCESS" }`).
- Authenticated users without assigned access receive the exact approved Pending Access message: "Your account is authenticated, but access has not been assigned yet." Protected APIs return HTTP `403 ACCESS_NOT_ASSIGNED`.
- For authorized users, the frontend transmits `Authorization: Bearer <session-token>` on subsequent requests and resolves user identity and capabilities via `GET /api/v1/auth/me`.
- Session revocation is performed via `POST /api/v1/auth/logout`.
- PostgreSQL V3 IAM is authoritative for users, roles, tenant assignments, and capabilities. Casbin enforces authorization server-side.
- The frontend must never determine or infer tenant, role, or permissions locally, and must never hardcode tenant IDs, role names, or capability decisions.

## Tenant isolation and database access

Per v0.9.7 and v0.9.8 non-negotiable architectural constraints:
- Keep three concepts strictly separate: (1) User authorization via PostgreSQL V3 IAM user-to-tenant grants; (2) Active session context holding one validated active tenant; (3) Request/transaction enforcement with revalidation on every request and transaction-local `set_config('app.tenant_id', ..., true)` under PostgreSQL RLS.
- `DEMO_SEED_TENANT_ID=1` is fixture/seed setup only; NEVER a login, session, middleware, or API authorization fallback.
- Never hardcode `tenantId: 1` as a default grant. Never introduce `DEFAULT_TENANT_ID=1` or `ACTIVE_TENANT_ID=1`.
- Do not add a tenant selector or switcher in the UI. Do not accept client-controlled `tenantId` or `X-Tenant-Id` headers as authorization.
- The frontend consumes backend-validated session context only; the backend remains the sole authority for tenant scoping.

## Input and integration safety

Validate inputs at the backend boundary, normalize errors, and avoid partial writes. Do not add production endpoints, database connections, real credentials, or unapproved integrations during documentation setup. Treat POCs as untrusted until their New CP adapter, configuration, smoke test, evidence, and limitation are recorded.

## AI data handling

Use synthetic or approved sanitized examples. Do not send PHI, customer records, secrets, access tokens, production logs, private keys, or confidential infrastructure details to Claude or any other AI tool. Record material AI-assisted work in `AI_USAGE_LOG.md` without copying sensitive prompts or outputs.

