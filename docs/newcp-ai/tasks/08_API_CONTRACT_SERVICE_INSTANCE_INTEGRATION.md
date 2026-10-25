# Task 08 — OpenAPI Service-Instance Integration Foundation

## Objective

Prepare React Option A to consume the supplied New CP contract through a typed and testable boundary while preserving the existing UI and business workflow. Begin with offline/mock behavior and contract-oriented tests. Do not connect to a live backend unless a separate approval and runtime gate exists.

## Required sources

- `AGENTS.md` or `CLAUDE.md`
- `docs/newcp-ai/references/api/newcp.openapi.yaml`
- `docs/newcp-ai/references/api/README.md`
- `docs/01_PROJECT/api-integration-architecture.md`
- Current `src/shared/api/`, affected features, tests, scripts, and configuration
- Relevant New CP Q-B8–Q-B15 and F07 business references

## Allowed scope

- Typed API ports, request/response models, error normalization, ETag handling, and offline adapters.
- Synthetic contract-oriented unit/component tests.
- Documentation and evidence updates based on actual verification.
- Small feature wiring only when an approved task names the route and acceptance criteria.

## Excluded scope

- Database access, migrations, ETL, privileged SQL, production URLs, credentials, real patient data, or deployment.
- Live F07 Bill To persistence before V204/runtime/finance gates are verified.
- Invented endpoints, schemas, roles, tenant rules, catalog IDs, prices, or transitions.
- Broad architecture rewrites or replacement of Option A's visual direction.

## Completion gate

- Every implementation maps to an operationId, path, and schema in the YAML.
- Repeated same-type service instances remain independent.
- ETag/If-Match, 412, and 428 are tested where mutation is supported.
- On Hold requires both hold fields atomically.
- Pricing, zero-charge, isBillable, and payer fields retain their independent rules.
- Problem errors are normalized without sensitive data leakage.
- Mocks are labelled `MOCK / NOT_INTEGRATED`.
- Actual tests, typecheck, lint, build, and diff results are recorded.
- Missing runtime or contract decisions are reported as blockers.

One bounded task produces one branch and one PR. Human review and merge remain mandatory.
