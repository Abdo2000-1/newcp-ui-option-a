---
name: observability-verification
description: Independently verify PostHog/Sentry changes, privacy controls, no-op behavior, and evidence without claiming provider or production success.
---

# Observability Verification

## Use when

Use after an approved observability implementation or documentation change and
before human merge approval.

## Required inputs

- The task and PR diff.
- `docs/06_OPERATIONS/observability/readiness-checklist.md`.
- The applicable PostHog/Sentry contract and telemetry event contract.
- Actual provider configuration status without requesting or exposing secrets.

## Workflow

1. Inspect the diff for scope, direct SDK imports, leaked configuration, event
   duplication, missing fallbacks, and sensitive data.
2. Run only commands supported by the repository manifest. At minimum use
   `git diff --check`; run tests, lint, typecheck, and build when executable code
   changed.
3. Verify disabled mode, provider failure behavior, identity reset, expected
   error filtering, route/event deduplication, and redaction with tests or a
   documented manual procedure.
4. Review CI/deployment changes for secret names only, conditional execution,
   and absence of fabricated targets or credentials.
5. Separate confirmed results from `NOT VERIFIED`, `MOCK`, and `BLOCKED` items.

## Stop conditions

Reject or stop when secrets/PHI appear, telemetry can change authorization,
provider failure breaks the app, a live claim lacks evidence, or the diff mixes
unapproved feature work.

## Output and completion gate

Return `ACCEPTED`, `REJECTED`, or `REVIEW_REQUIRED`, with severity, file/line
references, exact commands/results, privacy findings, provider limitations, and
remaining human approvals. Acceptance never means production delivery or merge.
