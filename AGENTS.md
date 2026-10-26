# Antigravity Workspace Instructions

This repository contains the CP PRO MAX frontend and its project-specific AI-assisted engineering system. These instructions are the Antigravity workspace entry point. The application source is the existing baseline; do not implement features unless the user provides an approved task.

## Read before work

1. `README.md`
2. `docs/00_READ_FIRST.md`
3. `docs/00_SOURCE_INVENTORY.md`
4. `docs/02_REQUIREMENTS/requirements-inventory.md`
5. `docs/02_REQUIREMENTS/traceability-matrix.md`
6. `docs/02_REQUIREMENTS/open-questions.md`
7. `docs/01_PROJECT/project-overview.md` and `docs/01_PROJECT/architecture.md`
8. `docs/01_PROJECT/architecture-understanding-report.md` when it exists
9. `.agents/rules/business-domain.md` before any product-behavior work

For work covered by the integrated New CP V0.9 handoff, also read `docs/newcp-ai/REFERENCE_INDEX.md`, `docs/newcp-ai/INTEGRATION_WITH_REPOSITORY.md`, and the applicable task under `docs/newcp-ai/tasks/`. The handoff is source material and a controlled workflow reference; it does not authorize backend, database, production, or unapproved application changes.

For authentication, IAM, Casbin, tenant, session, audit, role, or permission work, also read `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`, `docs/newcp-ai/references/iam/README.md`, and the applicable IAM task. Use `.agents/rules/iam-authorization.md` and the IAM skills before any related planning or review.

Use the relevant skill under `.agents/skills/`. The normal lifecycle is `plan-task` → `groom-task` → `implement-task` → `code-review-task` → human review/approval → `finalize-task`.

## Source of truth and scope

- Approved task documents outrank repository conventions. The merged engineering controls govern workflow, traceability, review, and evidence when generic or legacy repository documentation conflicts with them.
- Keep confirmed facts, approved requirements, existing implementation, proposed practices, assumptions, open questions, and blockers separate.
- Never invent endpoints, fields, credentials, commands, test results, architecture, approvals, or team ownership.
- Abdo's controlling boundary is Full Stack 5 hours as written, React UI Option A only, and no MUI implementation or MUI comparison-spike ownership.

## Engineering constraints

- Preserve existing application source and conventions unless an approved task authorizes a change.
- Do not add unrelated features, dependencies, broad refactors, or production operations.
- Use the approved OpenAPI contract when available; never infer backend behavior from local fixtures.
- Treat `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml` as a provisional design source unless live deployment and release-gate evidence is available.
- Use `MOCK`, `INTEGRATED`, `BLOCKED`, and `NOT VERIFIED` status labels accurately; synthetic fixtures never prove live integration.
- Apply `.agents/rules/business-domain.md` to business behavior, workflow states, pricing, permissions, patient privacy, service-line identity, physical operations, and integrations.
- Do not connect the frontend directly to a database or place secrets, tokens, PHI, customer data, or production dumps in prompts, logs, screenshots, or evidence.

## Verification and approval

- Run actual repository commands and report their real results. Never turn warnings, skipped checks, or unavailable infrastructure into success claims.
- Treat lockfile install, lint, typecheck, applicable tests, production build, SonarQube/approved quality scan, Docker/image validation, accessibility, responsive checks, documentation, and evidence as task-dependent quality gates. Use only gates supported by the confirmed environment.
- Use the approved CI provider and workflow. Do not invent GitHub Actions, SonarQube, Docker registry, image names, secrets, or deployment settings when the provider or environment is not confirmed; record the blocker instead.
- Inspect the diff and preserve application behavior.
- Human owners retain responsibility for business correctness, architecture, security, and merge approval. Do not merge, deploy, publish, or claim approval.
- Stop and record a blocker when a missing contract, ambiguous requirement, unavailable service, missing owner, or failed quality gate affects correctness.

`.claude/` and `CLAUDE.md` are retained as compatibility documentation for Claude Code; Antigravity-native rules and skills are under `.agents/`.
