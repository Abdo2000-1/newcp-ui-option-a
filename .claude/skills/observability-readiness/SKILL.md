---
name: observability-readiness
description: Assess and plan safe PostHog/Sentry preparation or implementation in New CP React Option A without inventing provider, privacy, or backend capabilities.
---

# Observability Readiness

Read `AGENTS.md`/`CLAUDE.md`, the project security and testing documents, and
all files under `docs/06_OPERATIONS/observability/`. Inspect the actual React,
Vite, router, auth/IAM, API, error-boundary, environment, and CI boundaries.

Inventory existing behavior, classify confirmed facts/proposals/blockers, and
define one bounded task with allowed and excluded files. Keep providers
disabled by default, use typed no-op-safe adapters, and stop when event/privacy
approval, provider ownership, backend coordination, or a safe target is
missing. Never copy Vue/Node examples, company DSNs, URLs, or credentials.

Return an observability inventory, event/privacy matrix, risks, tests, evidence
plan, and human approval gates. Do not implement during assessment. Next stage:
`plan-task` or `observability-verification`.
