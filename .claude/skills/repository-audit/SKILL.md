---
name: repository-audit
description: Audit an unfamiliar repository or documentation workspace before planning changes. Use when current structure, commands, dependencies, architecture, or existing AI instructions are unknown.
---

# Repository Audit

## Purpose

Establish repository reality before requirements or implementation decisions.

## Inputs and workflow

Read `CLAUDE.md`, source inventory, requirements inventory, architecture, and relevant package documents. Inspect Git status, tree, manifests, lockfiles, entry points, modules, tests, config, CI, Docker, docs, API files, auth code, and existing Claude configuration. Record only observable facts and distinguish unavailable sources.

## Output

Return an inventory of languages/frameworks, entry points, boundaries, scripts, dependency management, test/lint/build/CI setup, security/auth/data paths, existing docs/instructions, preserved implementation, risks, and missing access. Include exact paths and commands only when verified.

## Stop/completion gate

Do not modify application code. Stop architectural recommendations when the actual source repository is absent. Complete when current-state facts, gaps, and next inspection needs are traceable. Next stage: `plan-task` or human clarification.

