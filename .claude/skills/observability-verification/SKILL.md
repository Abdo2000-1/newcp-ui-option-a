---
name: observability-verification
description: Independently verify PostHog/Sentry changes, privacy controls, no-op behavior, and evidence without claiming provider or production success.
---

# Observability Verification

Review the actual PR diff against the observability contracts and readiness
checklist. Look for direct SDK imports, leaked credentials, PHI/sensitive
payloads, missing kill-switches, event duplication, broken fallbacks, and
telemetry affecting authorization or business behavior.

Run supported repository checks; at minimum `git diff --check`, plus tests,
lint, typecheck, and build when executable code changed. Verify disabled mode,
provider failure, identity reset, expected-error filtering, redaction, and
route/event deduplication with actual tests or a documented manual procedure.

Return `ACCEPTED`, `REJECTED`, or `REVIEW_REQUIRED`, with exact commands/results,
file references, privacy findings, `MOCK`/`NOT VERIFIED`/`BLOCKED` limitations,
and remaining human approvals. Acceptance never claims production delivery or
merge approval.
