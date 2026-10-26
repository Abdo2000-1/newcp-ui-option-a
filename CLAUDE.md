# Claude Code Project Instructions

This repository contains the CP PRO MAX frontend and its project-specific AI-assisted engineering system. The application source remains the existing frontend baseline; the documentation, skills, rules, and evidence controls in this repository govern future work. The backend and canonical API contract are not available here. Keep work limited to documentation, traceability, Claude workflow configuration, evidence procedures, and repository analysis until an implementation task explicitly authorizes application changes.

## Read before work

1. `README.md`
2. `docs/00_READ_FIRST.md`
3. `docs/00_SOURCE_INVENTORY.md`
4. `docs/02_REQUIREMENTS/requirements-inventory.md`
5. `docs/02_REQUIREMENTS/traceability-matrix.md`
6. `docs/02_REQUIREMENTS/open-questions.md`
7. `docs/01_PROJECT/project-overview.md` and `docs/01_PROJECT/architecture.md`
8. `docs/01_PROJECT/architecture-understanding-report.md` when it exists
9. `.claude/rules/business-domain.md` before any product-behavior work
10. Any official source files explicitly listed as available by `docs/00_SOURCE_INVENTORY.md`.

For work covered by the integrated New CP V0.9 handoff, also read `docs/newcp-ai/REFERENCE_INDEX.md`, `docs/newcp-ai/INTEGRATION_WITH_REPOSITORY.md`, and the applicable task under `docs/newcp-ai/tasks/`. The handoff is source material and a controlled workflow reference; it does not authorize backend, database, production, or unapproved application changes.

For Google authentication, PostgreSQL IAM, Casbin, tenant, session, audit, role, or permission work, also read `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`, `docs/newcp-ai/references/iam/README.md`, and the applicable IAM task. Apply `.agents/rules/iam-authorization.md` and the corresponding IAM skill; never treat frontend visibility as authorization.

Use the relevant skill for each workflow stage: `plan-task`, `groom-task`, `implement-task`, `code-review-task`, and `finalize-task`. Use specialist subagents only for the bounded read-only analysis described in `.claude/agents/`.

## Source of truth and scope

- Approved task documents outrank repository conventions; the actual repository outranks generic templates; the AI engineering guide is methodological only.
- For engineering workflow, traceability, review, and evidence handling, the merged controls in this repository (`CLAUDE.md`, `.claude/`, and the engineering `docs/`) take precedence over conflicting generic or legacy repository documentation. Original product specifications remain source material unless an approved requirement explicitly overrides them.
- The supplied New CP package is discussion draft V1.2. Do not describe proposals as approved decisions.
- Record contradictions with both source references. Do not silently reconcile them.
- Keep confirmed facts, approved requirements, existing implementation, proposed practices, assumptions, and blockers explicitly separated.
- Do not invent endpoints, schemas, credentials, commands, test results, architecture, approvals, or team ownership.
- Treat the user-provided Abdo boundary as mandatory: Full Stack allocation of 5 hours as written, React UI Option A only, and no MUI implementation or MUI comparison-spike ownership. Preserve the team-level MUI requirement as out of scope for Abdo.

## Engineering constraints

- Preserve the existing application source and repository conventions until an approved implementation task authorizes a change. Organizational files may guide work, but they do not authorize feature implementation.
- New CP API work must be OpenAPI-first, tenant-safe, instance-identified, and compatible with the approved PostgreSQL V3 baseline. Legacy Swagger is historical reference only.
- Treat `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml` as a provisional design source unless live deployment and release-gate evidence is available.
- Use `MOCK`, `INTEGRATED`, `BLOCKED`, and `NOT VERIFIED` status labels accurately; synthetic fixtures never prove live integration.
- Do not add database access to a frontend, change the V3 schema, use a superuser to claim tenant-isolation proof, or invent authentication behavior.
- Never place secrets, tokens, PHI, customer data, or production dumps in the repository, AI prompts, logs, telemetry, screenshots, or evidence.

## Verification and approval

- Inspect diffs and run actual repository commands when they exist. Report skipped or unavailable checks.
- Treat lockfile installation, lint, typecheck, applicable tests, production builds, SonarQube or the approved quality scan, Docker/image validation where supported, contract checks, accessibility, responsive checks, documentation, and evidence as task-dependent completion gates.
- Reuse the approved CI provider and workflow. Do not invent GitHub Actions, SonarQube, Docker registries, image names, secrets, or deployment settings when the environment is not confirmed; record the blocker instead.
- Tests, lint, typecheck, builds, contract checks, accessibility checks, and evidence are completion inputs—not claims to fill in later.
- Human owners retain responsibility for business correctness, architecture approval, security decisions, and merge approval. Claude must not merge, deploy, publish, or claim approval.
- Stop when a missing contract, unavailable service, ambiguous scope, missing owner, or failed quality gate affects correctness. Record the blocker and next decision owner.

Detailed procedures live in `docs/03_WORKFLOW/workflow.md`, `docs/05_QUALITY/testing-strategy.md`, `docs/01_PROJECT/security.md`, and the skill files. Path-specific constraints live in `.claude/rules/`.
