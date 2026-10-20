---
name: testing-quality
description: Design or verify project-specific unit, component, integration, contract, E2E, accessibility, responsive, and release checks. Use when a task needs a test matrix or quality-gate review.
---

# Testing Quality

## Inputs and workflow

Read `docs/05_QUALITY/testing-strategy.md`, `docs/03_WORKFLOW/definition-of-done.md`, quality checklist, requirements matrix, actual manifests, test setup, and CI. Map each requirement to normal/invalid/boundary/loading/empty/error/authorization/failure scenarios. Identify automation versus manual verification and run only verified commands.

## Output

Return a test matrix, commands/results, missing coverage, environment limitations, accessibility/responsive procedure, and evidence records. Treat the package's 80% coverage number as proposed unless explicitly approved.

## Stop/completion gate

Stop when required infrastructure or test data is unavailable; report blocked rather than infer success. Do not weaken tests or hide failures. Complete when every applicable requirement has an explicit verification method and actual result or named limitation. Next stage: `code-review-task` or human decision.
