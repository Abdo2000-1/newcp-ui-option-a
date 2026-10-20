---
name: plan-task
description: Build a bounded, traceable implementation plan from approved requirements. Use before feature work or refactoring when scope, files, dependencies, risks, and verification need to be established.
---

# Plan Task

## Purpose

Convert an approved requirement into a bounded plan without implementing it.

## Required inputs

- Requirement/task IDs and authoritative source sections.
- Acceptance criteria and exclusions.
- Actual repository tree, configuration, and relevant implementation files.
- Approved API contract, data/auth dependencies, owner, reviewer, and available commands when applicable.

## Workflow

1. Read `CLAUDE.md`, `docs/00_READ_FIRST.md`, `docs/02_REQUIREMENTS/requirements-inventory.md`, the traceability matrix, open questions, architecture, testing, security, and the relevant source documents.
2. Inspect the actual repository and current implementation. Record missing repositories or commands as blockers.
3. Identify impacted files/modules, dependency direction, API/data/auth boundaries, risks, and possible regression points.
4. Separate facts, requirements, existing behavior, proposed decisions, assumptions, and unknowns.
5. Define measurable success criteria and exact verification steps for every acceptance criterion.
6. State required human decisions or approvals and the next workflow stage.

## Output

Produce a plan containing: scope, requirement links, current behavior, affected files, ordered approach, dependencies, risks, non-goals, success criteria, verification commands/scenarios, evidence outputs, owner/reviewer, and blockers.

## Constraints and stop conditions

Do not edit application files. Stop if a missing contract, ambiguous business rule, unavailable service, missing owner, or unavailable repository makes the plan depend on invention.

## Completion gate

The plan is complete only when each in-scope requirement has an owner, affected location, measurable success criterion, verification method, and explicit approval status. Next stage: `groom-task` after human approval.
