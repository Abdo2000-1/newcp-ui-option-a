# AI Implementation Task Briefs — scoped generation, NOT autonomous deployment

### BE-01 — Read schema and form metadata
Input: `form_*.json`, actual V3 catalog subset, `03_V3_Data_Mapping_and_Gaps.csv`. Output: Drizzle-mapped read-only endpoints for selected tenant's option, controls and allowed codes; attach table/column evidence and tests. Do not seed invented field codes.

### BE-02 — Create service instance
Input: source verified forms, V3 selected catalog row, requirements BR-004, BR-006, V3 data mapping. Output: Express route + Zod request schema + domain service + Drizzle repository + integration tests. Must create multiple same-type items under same order and allocate line_number safely. Do not reuse legacy endpoint names/storage. Must not fabricate financial price, legal audit or permission values.

### BE-03 — Internal edit and transition
Input: internal controls + V3 financial lock + selected workflow instance/transition/capability data. Output: separate authorized field/value edit, financial change, and transition operations, with append-only audit/history tests. Do not patch arbitrary summary status when a workflow change is needed.

### FE-A / FE-B — Equivalent separate UIs
Input: exactly same `form_*.json`, approved API contract and synthetic fixtures. Output: independently designed React UI/UX implementations with **all applicable fields**, conditional visibility, source-observed client validation, loading/error feedback, edit/read and independent same-type instances. Preserve Option A existing mock prototype until integration works; don't require one shared API-client implementation.

### Platform — reusable POCs
Input: existing POC source+version and agreed boundaries. Output: verified Google Auth, Casbin, tenant-safe transaction middleware, Redis, Sentry, Prometheus/Grafana, CI/SonarQube and Docker hooks. No secrets/production data in agent context; tests and owner review required.

### AI agent operating rule
Before writing code, report: source pointers, what is verified, unknown V3 catalog identifiers, affected files, acceptance tests. Modify only your owned scope. Do not invent source-authoritative statuses, billed-party mappings, prices, or numeric IDs. Fail closed on security. Run build/lint/tests; describe any unrun step honestly.
