---
name: api-contract-analysis
description: Inspect and validate the authoritative OpenAPI/API contract and its frontend/backend integration boundaries. Use before API client work, endpoint changes, or contract review.
---

# API Contract Analysis

## Inputs and workflow

Read `docs/04_INTEGRATION/openapi-status.md`, API guardrails, requirements, architecture, and actual OpenAPI/config files. Determine the authoritative version, paths, methods, schemas, status/error conventions, auth/tenant requirements, service-instance identity, retries, and generated-client process. Compare frontend requests and backend handlers to the contract without treating legacy Swagger or inferred shapes as authoritative.

## Output

Return a contract inventory, endpoint/schema gaps, impacted owners/files, breaking-change analysis, test cases, and explicit blockers. Label proposals as drafts and simulated mocks as simulated.

## Stop/completion gate

Stop when no authoritative contract or required business decision exists. Do not create or alter an OpenAPI contract without human ownership/approval. Complete when every reviewed integration claim points to an actual contract operation and verification method. Next stage: `plan-task` or human contract decision.
