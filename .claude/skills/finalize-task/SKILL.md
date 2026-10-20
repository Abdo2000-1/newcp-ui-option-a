---
name: finalize-task
description: Confirm a reviewed task is genuinely complete, update documentation and evidence records, and prepare a concise human-review or PR summary without claiming unverified success.
---

# Finalize Task

## Purpose

Close the workflow only when implementation, review, evidence, and human gates are satisfied.

## Required inputs

- Approved implementation diff and resolved review findings.
- Traceability matrix, Definition of Done, test/check results, evidence, task breakdown, and AI usage record.
- Human decisions for business, architecture, security, and merge gates.

## Workflow

1. Reconcile each acceptance criterion with actual evidence and reviewer.
2. Confirm scope, architecture, security, testing, accessibility, responsive, API, and documentation requirements.
3. Verify that failed, skipped, blocked, or simulated checks are labelled honestly.
4. Update traceability, ownership, AI usage, contribution, decision, and evidence records.
5. Summarize changed files, actual checks, review findings, residual risks, and required follow-up.
6. Prepare a PR/MR-ready summary only if the repository host and workflow are known.

## Constraints and stop conditions

Never claim unverified success, human approval, merge, deployment, publication, or production readiness. Stop if any required finding or approval remains unresolved.

## Output and completion gate

Return a completion report with requirement coverage, evidence links, checks and results, unresolved risks, and explicit human approval status. Next action may be merge only through the authorized human workflow.

