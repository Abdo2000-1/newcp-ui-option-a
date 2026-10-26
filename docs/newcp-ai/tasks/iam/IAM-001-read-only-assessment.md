# IAM-001 — Read-Only IAM and Authentication Assessment

Status: planned/read-only; no product implementation authorized by this task.

## Objective

Compare the v0.9.5 IAM v1.2 requirements with the current Option A repository and identify the smallest approved next implementation task.

## Required inputs

- `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`
- `docs/newcp-ai/references/iam/README.md`
- `docs/newcp-ai/references/iam/role-hierarchy-and-discovery.md`
- `docs/newcp-ai/references/iam/capability-boundaries.md`
- `docs/newcp-ai/references/iam/user-journeys-and-acceptance.md`
- `docs/newcp-ai/references/iam/implementation-gaps-and-deferred.md`
- Current auth/router/API source and repository rules.

## Required output

One concise report separating:

- confirmed business requirements
- current repository facts
- existing auth/session/permission behavior
- backend dependencies
- IAM schema and role mapping gaps
- Casbin gaps
- tenant/session/audit gaps
- affected files
- proposed bounded next task
- exact acceptance and verification steps

## Constraints

- Do not implement Google Login.
- Do not create roles or permissions from labels.
- Do not use Google Groups.
- Do not make frontend authorization authoritative.
- Do not add credentials, OAuth secrets, migrations, or production endpoints.
- Do not claim live IAM, OAuth, Casbin, tenant, or audit success.

## Completion gate

The assessment is complete only when every requested IAM claim is marked `CONFIRMED`, `EVIDENCE_REQUIRED`, `BLOCKED`, `DEFERRED`, or `NOT_VERIFIED`, with an owner and next action. Next stage requires human review.
