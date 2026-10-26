---
name: observability-readiness
description: Assess and plan safe PostHog/Sentry preparation or implementation in New CP React Option A without inventing provider, privacy, or backend capabilities.
---

# Observability Readiness

## Use when

Use before adding PostHog, Sentry, telemetry events, feature flags, session
replay, error capture, tracing, or provider configuration.

## Required inputs

Read:

1. `AGENTS.md` or `CLAUDE.md`.
2. `docs/00_READ_FIRST.md` and the source inventory.
3. `docs/01_PROJECT/security.md`, `engineering-guidelines.md`, and
   `docs/05_QUALITY/testing-strategy.md`.
4. All files under `docs/06_OPERATIONS/observability/`.
5. The actual `package.json`, lockfile, router, providers, auth/IAM boundary,
   API client, error boundary, environment template, and CI workflow.

## Workflow

1. Inventory current telemetry, error handling, routes, identity boundaries, and
   available commands.
2. Compare the requested change with the PostHog/Sentry contracts and classify
   facts, proposals, blockers, and approvals.
3. Define a bounded task, allowed files, excluded scope, event/privacy matrix,
   and fallback behavior.
4. Identify whether the task is docs-only, adapter-only, or provider-enabled.
   Provider-enabled work stops without approved project ownership, configuration,
   privacy decisions, and a safe target.
5. Produce acceptance criteria, tests, evidence, and a PR boundary. Do not code
   during assessment.

## Stop conditions

Stop and report a blocker for missing event approval, unclear sensitive-data
classification, invented provider configuration, missing backend contract, or a
request to claim live delivery without a safe target.

## Output and completion gate

Return an observability inventory, gap list, bounded plan, proposed event matrix,
allowed/excluded files, risks, commands, and evidence plan. Complete only when
each claim points to a repository file or approved source. Next stage:
`plan-task` for implementation or `observability-verification` for review.
