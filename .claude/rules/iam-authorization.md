---
trigger: model_decision
description: Enforce New CP v0.9.5 IAM, Google authentication, Casbin, tenant, hierarchy, session, and audit boundaries.
---

# New CP IAM Authorization Rules

Read `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md` and `docs/newcp-ai/references/iam/` before IAM work.

- Google authenticates identity only; Google Groups are excluded entirely.
- PostgreSQL V3 IAM is authoritative for roles and capabilities; Casbin/backend enforcement is authoritative.
- Frontend visibility, localStorage, email domain, or client claims are never authorization.
- Use only evidenced roles, capabilities, tenant grants, OAuth/session contracts, and API errors. Unknown mappings default to deny.
- CS, OPS, FINANCE, QC, and ADMIN are business families, not exactly five physical role rows; CP is not a role.
- Verified same-family Senior/Manager hierarchy must inherit direct and transitive child permissions. Never infer edges from names or allow reverse, cross-family, or cross-tenant inheritance.
- Admin remains tenant-scoped; report viewing is separate from export, which is Finance/QC/Admin only.
- Pending/unassigned users receive restricted access and protected APIs return 403.
- Role changes apply on the next protected request; logout revokes the application session; defaults are 30-minute idle and 8-hour absolute lifetime.
- Audit without tokens, secrets, PHI, or policy internals.
- Do not add migrations, seeds, Casbin policies, OAuth secrets, or production endpoints without owner approval and evidence.
- Mark offline results MOCK, NOT_VERIFIED, BLOCKED, or DEFERRED; never claim live IAM from frontend tests.
