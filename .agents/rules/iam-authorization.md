---
trigger: model_decision
description: Enforce New CP v0.9.5 Google authentication, PostgreSQL IAM, Casbin, tenant, hierarchy, session, and audit boundaries.
---

# New CP IAM Authorization Rules

- Read `docs/newcp-ai/policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md` and `docs/newcp-ai/references/iam/` before authentication or authorization work.
- Google authenticates identity only. Never use Google Groups, group claims, or email domain as role/tenant authorization.
- PostgreSQL V3 IAM assignments/capabilities are authoritative; Casbin/backend enforcement is authoritative. Frontend visibility is not security.
- Use only explicitly evidenced roles, capabilities, tenant grants, OAuth/session contracts, and API errors. Unknown mappings default to deny.
- Preserve CS, OPS, FINANCE, QC, and ADMIN as business families, not an assumption of exactly five physical role rows; no CP role.
- Senior/Manager same-family transitive inheritance is mandatory after verified edges are discovered. Never infer edges from names, permit reverse/cross-family/cross-tenant inheritance, or bypass service/financial/workflow guards.
- Admin is tenant-scoped; cross-tenant administration requires a separate approved privilege.
- Report viewing and report export are separate capabilities. Export is restricted to Finance, QC, and Admin.
- Pending/unassigned users receive restricted UI and protected API `403`; no default privileged role.
- Role changes apply on the next protected request; logout revokes the app session; default session limits are 30-minute idle and 8-hour absolute.
- Audit security-relevant actions and denials without tokens, secrets, PHI, or internal policy expressions.
- Never add migrations, seed roles, Casbin policies, OAuth secrets, or production endpoints without explicit owner approval and evidence.
- Label all fixtures and offline results `MOCK`, `NOT_VERIFIED`, or `BLOCKED`; never claim live IAM or tenant isolation from frontend tests alone.
