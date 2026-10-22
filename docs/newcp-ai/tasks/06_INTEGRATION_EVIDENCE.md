# Task 06 — Independent verification of backend + Option A + Option B

**Prerequisites:** approved isolated staging, tenant app role/RLS credentials provisioned outside AI prompts, sanitized prepared orders, deployed backend, actual selected catalog/workflow rows and *both* React source repos.

Run a real evidence-based vertical slice per repo, using current route structure:
- Backend: build/typecheck/lint/test; OpenAPI actual request/response matching; real tenant catalog lookup; invalid create; two same-type creates; per-instance edit/status/history; unauthorized + cross-tenant denials; optimistic concurrent writes/idempotent retry; instance-aware report counts. All mutating operations in isolated approved staging only.
- FE A and B independently: same approved data/actions and business-result assertions, different UX allowed; no static JSON serving committed live flow. Take safe/redacted screenshots/network traces; never share tokens/PHI.
- Real per-item Bill To tests use F07 `billed_to_contact_id` and `billed_party_origin` target; first verify V204 deployment + exact dump policy approval + stage-90 evidence for the authoritative V3 rebuild. If missing, mark LIVE TEST BLOCKED, not PASS. Test same-order different payers, same-type independence, locked changes, cross-tenant/outside-order choices and charge/invoice consistency. Confirm status and audit writer conditions with actual workflow rows.
- POC operational evidence: approved auth/Casbin, Redis tenant safety, PostHog split, Sentry simulated safe event, Prometheus/Grafana metrics according to current scope.

Produce separate per-app PASS/FAIL/NOT RUN/BLOCKED table, exact commands, anonymized logs, data baseline before/after, observable defects, PR references and release recommendation. Do not claim either E2E passed unless actually executed.

No auto deploy, merges, pushes, test records from real production, or DB migrations.
