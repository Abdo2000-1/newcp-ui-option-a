# Security and Data Handling

## Scope

This document applies to the New CP engineering workflow and future implementation repositories. It is not a security certification. The supplied V3 review report explicitly does not provide broad database review, production readiness, or sign-off.

## Secrets and sensitive data

- Keep credentials, OAuth client secrets, tokens, private keys, production dumps, PHI, customer data, and SSH keys out of Git, AI prompts, logs, telemetry, screenshots, issues, and evidence.
- Use `.env.example` only for variable names and safe non-secret examples once an actual application repository exists.
- Use the approved secret manager or CI environment secrets; never fabricate values.
- Sanitize demo data and validate that screenshots and logs contain no sensitive values before sharing.

## Authentication and authorization

Google Login is a package-level acceptance item, but provider configuration, callback URLs, scopes, session/token handling, and backend validation were not available. Do not treat a client button as completed authentication. Before implementation, document the approved flow, failure/cancellation behavior, session persistence/expiry, logout, protected routes, 401/403 handling, and test-environment strategy.

Casbin or another approved policy layer must be deny-by-default and server-enforced. The client may improve UX but cannot be the authority for tenant selection or permission.

## Tenant isolation and database access

Derive tenant context from server-validated identity/membership. Use a scoped transaction and appropriate application role for tenant-scoped queries. Do not use a superuser or `BYPASSRLS` to claim isolation proof. Test pooled-connection reuse, missing tenant context, cross-tenant reads/updates, and cache invalidation with tenant-safe keys.

## Input and integration safety

Validate inputs at the backend boundary, normalize errors, and avoid partial writes. Do not add production endpoints, database connections, real credentials, or unapproved integrations during documentation setup. Treat POCs as untrusted until their New CP adapter, configuration, smoke test, evidence, and limitation are recorded.

## AI data handling

Use synthetic or approved sanitized examples. Do not send PHI, customer records, secrets, access tokens, production logs, private keys, or confidential infrastructure details to Claude or any other AI tool. Record material AI-assisted work in `AI_USAGE_LOG.md` without copying sensitive prompts or outputs.

