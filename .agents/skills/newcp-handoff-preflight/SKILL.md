---
name: newcp-handoff-preflight
description: Run the read-only assessment required before New CP Option A service-instance or F07 implementation.
---

# New CP Handoff Preflight

## Purpose

Establish repository facts and handoff constraints before implementation. This skill is read-only and does not authorize application, API, database, migration, or deployment changes.

## Invoke when

- The task references the New CP V0.9 handoff.
- A Biomodel, Conversion, service-instance, workflow, billing, or F07 task is being started.
- A new contract or form mapping must be compared with the current frontend.

## Required inputs

- `AGENTS.md` and applicable `.agents/rules/`.
- `docs/newcp-ai/README_START_HERE.md` and `INTEGRATION_WITH_REPOSITORY.md`.
- `docs/newcp-ai/policy/STATUS_AND_DECISIONS.md`.
- The relevant task file and only the relevant versioned references.
- Repository README, package scripts, router, source modules, fixtures, tests, CI, and integration status.

## Workflow

1. Confirm Git status, branch, package manager, runtime, scripts, and repository identity.
2. Identify whether the repository is React Option A and record exact paths for forms, routes, services, state, mocks, and tests.
3. Compare existing behavior with the selected Biomodel and Conversion references.
4. Record source labels, known decisions, unresolved mappings, missing APIs, and runtime blockers.
5. Identify reusable code and the smallest proposed first PR.
6. State safe commands and data prerequisites.
7. Stop for human/technical-lead review.

## Output

Return one concise assessment containing:

- confirmed repository facts
- authoritative handoff references
- existing implementation and gaps
- affected files
- blockers and decision owners
- proposed first PR and tests
- explicit `MOCK`, `INTEGRATED`, `BLOCKED`, and `NOT VERIFIED` statuses

## Stop conditions

Stop before implementation if the selected service, tenant catalog row, API contract, authorization rule, workflow transition, or financial gate is missing and the task would require guessing.
