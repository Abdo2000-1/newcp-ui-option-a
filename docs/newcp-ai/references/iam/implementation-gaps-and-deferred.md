# IAM Implementation Gaps and Deferred Decisions

## Current gaps

- No live OAuth/provider verification is established by the handoff.
- No verified runtime IAM seed inventory is available in this frontend repository.
- Exact legacy-to-V3 role codes, direct capability grants, and hierarchy edges require owner-approved discovery.
- V3 source evidence has role assignments and role capabilities but no verified native parent-role relation.
- Casbin model/policy wiring and tenant/resource guards require backend implementation and review.
- Session storage, refresh, revocation, idle timeout, absolute timeout, and audit sink require backend evidence.
- The frontend must not claim authorization based on local role labels or hidden buttons.
- F07 live payer integration remains separately gated by the current V3 schema and ETL evidence.

## Explicitly deferred

- Google Groups integration.
- Automatic domain-to-tenant grants.
- General external-email allowlist policy.
- Multiple active tenant switching.
- Report field-level masking and production export contents.
- Google step-up authentication for sensitive actions.
- Multi-role demo execution (architecture support remains required).
- Cross-tenant super-admin workflow.
- Non-Google interactive login methods.

## Stop conditions

Stop before code when the task requires an unknown OAuth callback, token/session contract, IAM code, role edge, tenant rule, Casbin model, audit schema, or backend endpoint. Record the missing evidence and decision owner instead of guessing.
