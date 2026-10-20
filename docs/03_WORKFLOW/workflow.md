# AI Assisted Engineering Workflow

## Lifecycle

The workflow follows the AI guide's Part 2 sequence and the task-specific lifecycle:

```text
Plan -> Groom -> Implement -> Code Review -> Human Review and Approval -> Finalize
```

The stages are gates, not labels. A later stage cannot silently repair missing inputs from an earlier stage.

## Stage contracts

| Stage | Required inputs | Required output | Gate |
|---|---|---|---|
| Plan Task | Requirement IDs, source sections, current files, constraints, acceptance criteria | Bounded plan with impacted files, risks, dependencies, success criteria, verification | No implementation changes; clarify blockers |
| Groom Task | Approved plan and answers to blocking questions | Ordered steps, dependencies, affected files, tests, evidence, owner/reviewer per step | Every step has completion criteria |
| Implement Task | Approved groomed steps, available contracts, repository commands | Incremental changes, tests/checks, diff summary, deviations and evidence | No unrelated refactor or fabricated result |
| Code Review Task | Actual diff, requirements, plan, architecture, checks, evidence | Independent prioritized findings with severity and file/line references | Reviewer does not trust completion claim alone |
| Human Review and Approval | Review report, resolved findings, evidence, risk summary | Explicit business/architecture/security/merge decision | Human decision required for gated changes |
| Finalize Task | Approved diff, review resolution, actual command results | Completion report, updated docs/logs, PR/MR-ready summary | No claim beyond evidence; no merge/deploy without authorization |

## Stop conditions

Stop and record a blocker when the canonical API contract, business fields/transition, tenant/auth behavior, app-role access, required owner, or test environment is missing and proceeding would require invention. Also stop when a high-severity security/data-integrity issue, failed required check, or unresolved review finding remains.

## Evidence discipline

Every acceptance claim must link to a reproducible command result, test report, sanitized screenshot/recording, review finding, or named human decision. “Mentioned in a document,” “a POC exists,” and “the agent says it works” are not evidence.

## Human ownership

Humans retain architecture, business correctness, security, approval, merge, deployment, and release ownership. Claude can prepare plans, make bounded changes, inspect diffs, and report evidence; it cannot approve its own work or bypass gates.

