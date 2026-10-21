# Abdo Ownership and Boundaries

`[APPROVED REQUIREMENT]`

## 1. Controlling Individual Assignment

The user-provided task instructions establish Abdo's assigned contribution:

- **Role & Allocation:** Full Stack: 5 hours, preserved strictly as written.
- **Frontend Target:** React UI Option A only (`newcp-ui-option-a`).
- **Framework Constraint:** **NO Material UI (MUI)**. MUI is strictly outside Abdo's assigned implementation scope.
- **Allocation Unit:** The unit and meaning of "5 hours" are not inferred or converted. This document does not convert it to hours per day, total hours, or task duration.

---

## 2. Official-Source Discrepancy & Resolution

The official selected package draft does not name Abdo. Its role table in `01_Team_Discussion_and_Execution_Plan.docx`, Table 3, describes the Full-stack intern as 5 hours/day with React Design B ownership and the FE intern as React Design A ownership. 

The user-provided Abdo boundary conflicts with the unnamed role table regarding UI option (Option A vs. B) and MUI scope.
- `[CONFIRMED FACT]` The user instruction controls this workspace.
- `[APPROVED REQUIREMENT]` Excluding MUI from Abdo's personal work does not remove MUI from another owner's team responsibility (e.g. Option B).
- `[APPROVED REQUIREMENT]` Tailwind CSS v4 remains active in Option A until a formal decision is approved.

---

## 3. Completed Deliverables

`[CONFIRMED FACT]`

| Task ID | Deliverable | Git Ref / PR | Actual Results |
|---|---|---|---|
| **T-000** | Architecture Understanding Baseline Report, SRS, SDS, Baseline Evidence | Commit on `main` | Initial baseline audited, verified scripts, documented domain rules. |
| **T-001** | Structural alignment to `src/app`, `src/features`, `src/shared` | [PR #4](https://github.com/Abdo2000-1/newcp-ui-option-a/pull/4) (Merged) | 95 files restructured, 0 dead folders, typecheck & build passing. |
| **T-002** | Foundational testing & CI quality gates | [PR #5](https://github.com/Abdo2000-1/newcp-ui-option-a/pull/5) (Merged) | Vitest + RTL configured, 44 tests passing, GitHub Actions CI green with Docker build. |
| **T-003** | Documentation, ownership, and standards alignment | Current Task | Reconciled architecture docs, open questions, and restructuring estimates. |

---

## 4. Abdo-Owned Work Scope (Forward-Looking)

Only the following categories may be assigned to Abdo:

1. **Full-Stack Implementation:** Work explicitly bounded by an approved task and within the stated 5-hour allocation.
2. **React UI Option A:** Implementation or integration of approved Option A screens and workflows using the canonical API contract while preserving functional equivalence.
3. **Quality & Evidence:** Automated tests (unit, component, integration) and evidence records for Abdo's own changes.
4. **Cross-Team Handoffs:** Surfacing blockers, contract questions, mock-to-live integration proof, and PR delivery.

### Explicitly Excluded from Abdo's Scope:
- `[CONFIRMED FACT]` Material UI (MUI) component implementation or dependencies.
- `[CONFIRMED FACT]` MUI comparison-spike ownership.
- `[CONFIRMED FACT]` Option B implementation or ownership.
- `[CONFIRMED FACT]` Broad database migrations, ETL, or PostgreSQL production administration.
- `[CONFIRMED FACT]` Merging PRs into `main` without human review and approval.

---

## 5. Active Dependencies & Handoff Map

`[CONFIRMED FACT]`

| Dependency / Handoff | External Owner | Impact on Abdo Scope | Status |
|---|---|---|---|
| **Canonical OpenAPI Contract (`newcp.openapi.yaml`)** | Backend Owner / Tech Lead | Blocks typed client code generation and live API integration for Option A | `[BLOCKER]` |
| **Running Backend API / Dev Database** | Backend Owner / Ops | Blocks Phase 4 real data fetching and Phase 5 authentication | `[BLOCKER]` |
| **SonarQube Credentials** (`SONAR_HOST_URL`, `SONAR_TOKEN`, `SONAR_PROJECT_KEY`) | Repository Owner / Admin | Safe conditional CI step ready; scan blocked until secrets added | `[BLOCKER]` |
| **Tailwind vs. MUI Formal Decision** | Technical Lead / Stakeholders | Determines whether Option A remains on Tailwind or requires handoff to an MUI owner | `[OPEN QUESTION]` |
