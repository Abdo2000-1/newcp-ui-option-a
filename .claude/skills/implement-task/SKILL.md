---
name: implement-task
description: Implement only an approved groomed task incrementally, with repository-compatible changes, tests, checks, and honest evidence. Use after planning and grooming approval.
---

# Implement Task

## Purpose

Make the smallest changes that satisfy the approved task and preserve existing behavior.

## Required inputs

- Approved plan and groomed steps.
- Traceability rows and acceptance criteria.
- Actual repository conventions, contract, environment instructions, and verified commands.
- Named owner/reviewer and evidence destination.

## Workflow

1. Confirm the working tree and scope before editing.
2. Implement one groomed step at a time, preserving established tooling and boundaries.
3. Add or update tests for changed logic and relevant success/negative/boundary behavior.
4. Inspect the diff after each meaningful change for unrelated edits, secrets, and contract drift.
5. Run relevant actual commands: tests, lint, typecheck, build, contract, integration, accessibility, or Docker checks as applicable.
6. Record command, result, environment, evidence path, failures, deviations, and remaining work.

## Constraints

No unrelated refactoring, fabricated result, weakened acceptance criterion, unapproved dependency, schema change, architecture change, production operation, or invented API behavior. Do not use mocks to claim live integration.

## Stop conditions

Stop on missing contract/auth/tenant behavior, unavailable required service, failed high-severity security/data-integrity check, unexpected scope expansion, or inability to run a required check. Report the blocker; do not hide it.

## Output and completion gate

Return implementation changes, changed-file summary, test/check commands and results, evidence links, deviations, and unresolved risks. The task is not complete until the diff is within scope, applicable checks have actual results, and the next stage is `code-review-task`.

