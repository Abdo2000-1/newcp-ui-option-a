---
name: evidence-acceptance
description: Prepare or audit authentic, sanitized evidence for requirements, tests, API contracts, demos, accessibility, builds, reviews, and AI-assisted work. Use before acceptance or demo readiness claims.
---

# Evidence and Acceptance

## Inputs and workflow

Read `evidence/README.md`, traceability matrix, quality checklist, Definition of Done, task breakdown, AI usage log, and actual result artifacts. For each claim, verify requirement ID, environment, procedure/command, result, reviewer, date/version, and limitation. Check screenshots/logs/telemetry for secrets, PHI, customer data, and misleading baselines.

## Output

Return an evidence index, missing/invalid artifacts, sanitized evidence paths, reviewer/approval status, and a clear distinction between live, simulated, mocked, blocked, and not-applicable results.

## Stop/completion gate

Never fabricate screenshots, timestamps, approvals, test reports, integration success, or demo outcomes. Stop acceptance when evidence is missing, inconsistent, or unsafe. Complete only when each claimed requirement has authentic evidence and the named human reviewer/approver is recorded. Next stage: `finalize-task` or human clarification.
