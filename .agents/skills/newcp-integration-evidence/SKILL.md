---
name: newcp-integration-evidence
description: Prepare and audit evidence for the New CP backend, Option A, Option B, contract, F07, and demo acceptance claims.
---

# New CP Integration Evidence

## Purpose

Keep implementation and demo claims traceable to actual commands, environments, fixtures, reviewers, and limitations.

## Required inputs

- `docs/newcp-ai/tasks/06_INTEGRATION_EVIDENCE.md`.
- `docs/newcp-ai/policy/F07_DECISION_AND_RELEASE_GATES.md`.
- The relevant OpenAPI contract and source mapping.
- Actual frontend/backend repositories, sanitized staging, and approved test data when live evidence is required.

## Workflow

1. Identify the requirement, contract operation, source reference, and owner for every claim.
2. Separate Option A and Option B results while checking equivalent business outcomes.
3. Record exact commands, environment, branch/commit, fixture status, result, reviewer, and limitation.
4. Distinguish `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`, `MOCK`, and `INTEGRATED`.
5. Check evidence for PHI, credentials, tokens, production identifiers, and misleading data.
6. Validate service-instance independence, tenant/permission failures, validation errors, workflow history, and F07 payer gates when applicable.

## Constraints

- Offline contract checks do not prove live API or database integration.
- Static V204 or ETL source does not prove deployment or stage-90 reconciliation.
- Do not run migrations, ETL, production traffic, or privileged operations.
- Do not fabricate screenshots, logs, test outcomes, approvals, or demo measurements.

## Completion gate

Complete only when each accepted claim has authentic evidence or is explicitly marked unavailable/blocked, with a named owner for the next decision.
