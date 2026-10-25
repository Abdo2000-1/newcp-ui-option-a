---
trigger: model_decision
description: Enforce the supplied New CP OpenAPI contract and integration boundaries.
---

# New CP OpenAPI Contract Rules

- Read `docs/newcp-ai/references/api/README.md`, `docs/01_PROJECT/api-integration-architecture.md`, and `docs/newcp-ai/references/api/newcp.openapi.yaml` before API work.
- Treat the contract as an implementation target, not proof of live backend, database, V204, tenant, role, ETL, finance, or production readiness.
- Never invent endpoints, schemas, headers, permissions, tenant behavior, retry policy, or credentials.
- Preserve independent `serviceItemUuid` identity for repeated same-type services.
- Preserve aggregate `ETag`/`If-Match`, including `412` stale and `428` missing-precondition handling.
- Read authorized transitions from the API; On Hold requires `holdType` and `holdReasonCode` together.
- Keep backend-derived pricing, zero-charge reasons, independent `isBillable`, and F07 payer/provenance separate.
- Mark synthetic fixtures and adapters `MOCK / NOT_INTEGRATED`.
- Do not access PostgreSQL, run migrations/ETL, use production endpoints, or claim live integration without evidence.
