---
paths:
  - "newcp-api/openapi/**/*.yaml"
  - "newcp-api/src/**/*.ts"
  - "src/**/*.{ts,tsx}"
  - "newcp-ui-option-b/src/**/*.{ts,tsx}"
---

# API and Domain Contract Rules

- Use the approved New CP OpenAPI 3.0.3 contract as the source of truth. Legacy Swagger is historical reference only.
- Never invent paths, fields, payloads, response shapes, status codes, permissions, tenant derivation, or retry behavior.
- Identify service instances independently from service type. Do not reinstate a one-instance-per-type rule.
- Keep Zod boundary validation, domain rules/services, and Drizzle repositories separate; routes/controllers delegate.
- Do not access PostgreSQL from a frontend or use a superuser/BYPASSRLS to claim tenant-isolation proof.
- Mark typed mocks/fixtures as simulated and later verify live endpoint behavior before claiming integration.
- Breaking contract changes require impact analysis for both UIs, updated tests/docs, and human approval.
