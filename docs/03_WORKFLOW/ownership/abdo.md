# Abdo Ownership and Boundaries

## Controlling individual assignment

The user-provided task states that Abdo's assigned contribution is:

- Full Stack: 5 hours, preserved exactly as written.
- React UI: Option A only.
- NO Material UI (MUI): outside Abdo's assigned implementation scope.

The unit and meaning of “5 hours” are not inferred. This document does not convert it to hours per day, total hours, or task duration.

## Official-source discrepancy

The official selected package does not name Abdo. Its role table in `01_Team_Discussion_and_Execution_Plan.docx`, Table 3, describes the Full-stack intern as 5 hours/day with React Design B ownership and the FE intern as React Design A ownership. The user-provided Abdo boundary therefore conflicts with the unnamed role table on UI option and MUI scope. The user instruction controls this workspace; the technical lead must still confirm the official assignment before implementation planning is accepted.

The team-level requirement for two React + MUI options remains intact. Excluding MUI from Abdo's personal work does not remove MUI from another owner's team responsibility.

## Abdo-owned work to plan after repository access

Only the following categories may be assigned to Abdo without further clarification:

1. Full-stack work explicitly bounded by an approved task and within the stated 5-hour allocation.
2. React UI Option A implementation or integration, using the approved API contract and preserving functional equivalence.
3. Tests and evidence for Abdo's own changes, including loading/empty/error/validation/permission/responsive behavior as applicable.
4. Cross-team handoffs needed by Option A, including contract questions, mock-to-live integration proof, and reproducible blockers.

Do not assign Abdo MUI component implementation, MUI dependencies, MUI comparison-spike work, Option B ownership, broad V3 review/migration/ETL/reconciliation, production rollout, or another person's POC ownership unless a later human decision explicitly changes the boundary.

## Expected deliverable map

| Area | Abdo responsibility | Required dependency | Evidence required |
|---|---|---|---|
| Full Stack | Bounded task explicitly approved within the 5-hour allocation | Named task owner, contract, affected repository, reviewer | Diff, tests/checks actually run, handoff and limitation record |
| React Option A | Implement/integrate only approved Option A screens and workflows | Canonical OpenAPI, business fields/transitions, auth/tenant behavior, existing Option A source | Component/integration/E2E or manual evidence for success/invalid/loading/empty/error/responsive/permission cases |
| API integration | Consume the approved contract; report gaps rather than invent endpoints | Backend owner and contract approval | Request/response proof against mocks and then live API, error mapping, contract-gap record |
| Team handoff | Surface blockers and dependency status; do not absorb other ownership | Backend/full-time/lead decisions as applicable | Handoff note with owner, requested decision, deadline, fallback |

## Ownership acceptance checklist

- [ ] Abdo's exact task IDs and deliverables are named by the lead.
- [ ] The 5-hour allocation unit is clarified if it affects scheduling.
- [ ] Option A boundaries are separated from any Full Stack task.
- [ ] MUI work is excluded from Abdo's personal task breakdown.
- [ ] Every owned task has acceptance criteria, tests, evidence, reviewer, and handoff.
- [ ] No other team member's work is claimed as Abdo's contribution.

