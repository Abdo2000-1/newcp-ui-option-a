---
name: iam-readiness-assessment
description: Perform a read-only assessment of Google authentication, PostgreSQL IAM, Casbin authorization, tenant isolation, hierarchy, sessions, and audit readiness.
---

# IAM Readiness Assessment

## Invoke when

- A task references the New CP IAM v0.9.5 handoff.
- Google authentication, role mapping, Casbin, tenant access, sessions, or audit is discussed.
- A frontend permission or protected-route change is proposed.

## Read first

- `AGENTS.md`, `CLAUDE.md`, and applicable `.agents/rules/`.
- `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`.
- All files under `docs/newcp-ai/references/iam/`.
- Current auth, router, API, provider, session, and test files.

## Workflow

1. Inspect Git status and repository identity.
2. Inventory current authentication, session, protected routes, API errors, and permission hints.
3. Identify available backend contracts and distinguish frontend behavior from server authority.
4. Record actual IAM schema/role/capability evidence and missing mapping inputs.
5. Check Google Groups is absent from the authorization path.
6. Check tenant, hierarchy, session, revocation, and audit prerequisites.
7. Map relevant acceptance scenarios AT-001..AT-052.
8. Produce one concise readiness report and one bounded next-task proposal.

## Stop conditions

Stop before editing when OAuth callback/session behavior, IAM role codes, hierarchy edges, Casbin model, tenant contract, or audit sink is unavailable. Do not infer or create them.

## Output gate

Every finding is labelled `CONFIRMED`, `EVIDENCE_REQUIRED`, `MOCK`, `BLOCKED`, `DEFERRED`, or `NOT_VERIFIED`. The next stage requires human review.
