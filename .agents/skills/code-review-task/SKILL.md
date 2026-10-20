---
name: code-review-task
description: Independently review an actual diff against requirements, architecture, security, tests, and evidence. Use after implementation and before human approval.
---

# Code Review Task

## Purpose

Find defects and missing evidence independently; do not approve because an implementation agent says it is complete.

## Required inputs

- Actual diff and changed files.
- Requirements/traceability rows, approved plan, architecture, conventions, security, testing strategy, and Definition of Done.
- Actual command results, test reports, contract/evidence artifacts, and known deviations.

## Workflow

1. Inspect the diff and surrounding code, not just the summary.
2. Check functional correctness, data integrity, tenant/auth boundaries, API contract compliance, regressions, maintainability, accessibility/responsive behavior, and evidence integrity.
3. Verify tests cover normal, invalid, boundary, failure, authorization, loading/empty/error cases as applicable.
4. Distinguish confirmed defects from risks, questions, and suggestions.
5. Report findings with severity (`P0` security/data-integrity, `P1` core-demo blocker, `P2` noncritical/polish), file/line references, impact, and required correction.
6. Identify missing or untrusted evidence and checks that were not run.

## Constraints and stop conditions

Do not merge, deploy, rewrite the change, or waive a requirement. Stop review if the diff or required evidence is unavailable and report that limitation.

## Output and completion gate

Return a prioritized review report, verification gaps, and explicit recommendation: corrections required, human review ready, or blocked. Next stage is human review and approval, followed by `finalize-task` only after findings are addressed.
