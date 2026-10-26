# v0.9.6 → v0.9.7 — Explicit user, session, and transaction tenant separation

**Date:** 26 October 2026  
**Business authority:** User clarification approved in the conversation: tenant access is user-based; active tenant is session-based; database enforcement must be transaction-scoped.  
**Impact:** Documentation, developer integration guidance, example configuration comments, and acceptance cases; no application code/database modified.

## Changed
- Replaced October tenant spec v1.0 with v1.1 (`payload/references/iam/TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`), retaining v1.0 under `/archive/superseded_v0.9.6_tenant_refs/` for traceability.
- Updated Word summary to v1.1 and added explicit grants-vs-session-vs-RLS lifecycle, including revocation and UI behavior.
- Updated root and payload READMEs, canonical policy/spec pointers, developer agent brief, example env comments, and ready-to-send email.
- Extended tenant acceptance tests from 22 to **30** scenarios (TEN-23..TEN-30), all NOT_RUN.
- Preserved five business families, Senior/Manager within-family inheritance, Google sign-in only, no Google Groups, report view/export policy, F07, config preferences and deferred features.

## Mandatory business interpretation
- **User-based**: `iam` or approved tenant-grant model stores who is eligible to access tenant(s).
- **Session-based**: authenticated session stores one active *validated* tenant, not its authorization.
- **Request-based**: each protected request checks current grant and effective capability; revocations take effect on subsequent requests.
- **Transaction-based**: backend sets `app.tenant_id` transaction-local and uses PostgreSQL RLS for tenant data; never sets pooled DB connection tenant session persistently.
- **Config-only**: `DEMO_SEED_TENANT_ID=1` is controlled setup data, NOT user-grant, session default, or RLS bypass.

## Status
No Google login, PostgreSQL privileges, Casbin policies, V3 restore/ETL or end-to-end tenant cases were run. Developers must verify behavior against actual V3 schema and repositories.
