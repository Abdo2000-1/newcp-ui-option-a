---
name: iam-acceptance-evidence
description: Design or review evidence for IAM authentication, authorization, hierarchy, tenant, session, audit, and permission acceptance scenarios without fabricating runtime success.
---

# IAM Acceptance Evidence

## Required inputs

- `docs/newcp-ai/references/iam/user-journeys-and-acceptance.md`.
- `docs/newcp-ai/references/iam/capability-boundaries.md`.
- Approved API/auth/session contracts.
- Actual sanitized test fixtures and approved environment.

## Workflow

1. Map each claim to an IAM requirement and AT scenario.
2. Identify actor, internal role, tenant, service type, request, expected status, mutation check, and audit evidence.
3. Separate frontend unit tests, synthetic contract tests, backend integration, and live demo evidence.
4. Verify positive and negative hierarchy cases: transitive inheritance, reverse denial, cross-family denial, cross-tenant denial, cycle rejection, and revocation.
5. Verify `401`, Pending Access `403`, permission `403`, masked `404`, `409`, `412`, and `422` behavior against the actual contract.
6. Sanitize evidence; reject tokens, secrets, PHI, and production identifiers.

## Constraints

- All package acceptance rows begin `NOT_RUN` until actually executed.
- Mock fixtures do not prove OAuth, Casbin, IAM, PostgreSQL, tenant isolation, or live audit behavior.
- Do not run migrations, ETL, production traffic, or privileged IAM operations.

## Completion gate

Return an evidence matrix with exact command/environment/result/limitation and mark missing runtime dependencies `BLOCKED` or `NOT_VERIFIED`. Never fabricate approval or live success.
