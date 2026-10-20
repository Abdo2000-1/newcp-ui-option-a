---
trigger: model_decision
description: Apply OpenAPI-first and frontend/backend contract safeguards when inspecting or changing API integration.
---

# API and Domain Contract

- Read `docs/04_INTEGRATION/openapi-status.md` before API client or contract work.
- Use the approved New CP OpenAPI 3.0.3 contract as the source of truth. Legacy Swagger and inferred shapes are historical or proposed only.
- Never invent paths, fields, payloads, response shapes, status codes, permissions, tenant derivation, or retry behavior.
- Identify service instances independently from service type.
- Keep validation, domain rules, transport, and data mapping separable and testable.
- Do not access PostgreSQL from the frontend or use a superuser/BYPASSRLS to claim tenant-isolation proof.
- Mark fixtures and mocks as simulated; do not claim live integration without runtime evidence.
- Breaking contract changes require impact analysis, tests, documentation, and human approval.
