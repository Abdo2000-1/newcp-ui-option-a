# OpenAPI and Integration Status

## Authority

The selected package requires a New CP OpenAPI 3.0.3 contract derived from approved business requirements and target architecture. Legacy Swagger/endpoint shapes are historical reference only. The standards draft proposes `newcp-api/openapi/newcp.openapi.yaml` as the canonical location, subject to repository-topology confirmation.

## Current status

No OpenAPI file, backend repository, endpoint implementation, generated client, contract-test harness, or approved freeze/version process was available in this workspace. Candidate paths in `03_API_Contract_and_Domain_Guardrails.md` are explicitly illustrative and must not be copied into frontend code as approved API behavior.

## Required contract contents

Before live frontend integration, the approved contract must define for each operation:

- path and method;
- service-instance identity and tenant-scope derivation;
- required permission;
- request parameters/body and response schemas;
- status and error conventions, including correlation ID;
- examples and pagination where needed;
- retry/concurrency/idempotency behavior where applicable;
- authentication and authorization expectations.

## Integration workflow

1. Technical lead and business owner approve Models/Conversion operations, fields, editability, and the permitted transition.
2. Backend owner drafts the contract from those decisions and maps it to V3 entities.
3. Full-time/security owner reviews tenant, session, authorization, and error boundaries.
4. Both frontend owners review consumption needs without changing business semantics.
5. Contract lint and behavior tests run against the implementation.
6. Breaking changes require impact notice to both UIs, updated tests/docs, and human approval before merge.

If the backend is unavailable, use explicit typed mocks/fixtures marked as simulated. Do not claim live integration until the actual endpoint is exercised against the approved environment.

