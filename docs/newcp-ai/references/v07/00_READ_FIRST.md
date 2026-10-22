# New CP — V3 Mapping, Provisional OpenAPI & Integration Readiness (v0.7)
**22 October 2026 | Scope: October demo Biomodel + Conversion internal clerk workflows**

## Executive status

**Static V3 mapping: VERIFIED against supplied sanitized V3 migration SQL**, not against your actual deployed tenant database. **Real tenant catalog identifiers/field option codes/workflow transitions: NOT RESOLVED.** The inspected V3 SQL contains DDL but no actual migrated catalog rows for your chosen tenant.

**OpenAPI: PROVISIONAL DRAFT**, syntactically valid YAML/JSON with 7 resource paths and 9 operations, usable for initial API/client contract discussions and AI assistance. **Do not call it the final agreed contract** without live mapping and owner review of endpoints/role controls/idempotency/financial billing details.

**Backend live integration: NOT RUN** — no runnable New CP Express/Drizzle backend, isolated staging PostgreSQL connection or test credentials were available. **Both-React end-to-end integration: NOT RUN** — Option A is available as a mock-backed prototype; a verified Option B source was not located. Option A's existing 7 prototype unit tests PASS, but they do not exercise this API.

## What's verified by this package
- All 118 selected columns across 15 V3 tables are present in inspected sanitized migrations (file and line mapping in `mappings/01_verified_ddl_columns.csv`).
- `orders.order_items` stores distinct service instances; unique `(order_id,line_number)` but not `(order_id,sellable_item_id)`; same-type multiplicity supported structurally.
- V3 has direct order item fields for status, currency/prices, `is_redo`, zero charge reason, audit notes. Actual item field answers are relational in `orders.order_item_field_values`.
- `catalog.*` represents configurable service selection, fields, options and conditions; `workflow.*` represents allowed transitions, but actual rows and permissions remain runtime-dependent.
- `billing.charges.contact_id` records the actual charged party for a service; no pre-charge intended billed party was found on `orders.order_items` in this migration snapshot. **Service-level Bill To write stays BLOCKED pending database-owner-approved mapping.**
- Legacy frontend provides 75 inventoried controls across Conversion, Biomodel and Implant Analog Model from v0.6. The 75 controls do NOT imply that 75 corresponding tenant V3 `catalog.fields` rows were found.

## Recommended order for backend intern and full-time developer
1. Run `mappings/03_READ_ONLY_TENANT_DISCOVERY.sql` as a **non-admin app role** in your isolated staging database with explicit tenant ID. Review returned app role/tenant and `row_security_active`; no PHI is output.
2. Resolve actual *Biomodel* and *Conversion* catalog UUIDs, internal IDs, options and field codes. Complete `mappings/02_connect_fields_to_v3_resolution.csv` with evidence. Do not carry forward synthetic UUIDs.
3. Resolve the correct item workflow definition/version for each selected service (including legacy digital dimensions where `workflow_code` is NULL). Verify current permitted transitions under Casbin and V3 guard conditions.
4. Resolve the **pre-charge billed-party mapping** with the DB owner. If it requires a schema change, leave it to the database owner; avoid `metadata` or a premature charge record as an undocumented surrogate.
5. Fill the canonical contract's remaining mappings; approve exact endpoint scope and idempotency, then graduate the OpenAPI from PROVISIONAL to approved.
6. Implement the selected backend vertical slice against authorized tenant/RLS transactions (Drizzle fragment is starting context, not a migration) and run backend checks.
7. Wire the selected demo route in each React option using `clients/newcp-demo-client.ts`; retain different UX. Run both against the same staging backend/tenant. Collect evidence before declaring PASS.

## File index
| File | Purpose |
|---|---|
| `evidence/v3_migrations/*.sql` | Eight sanitized migration source files for repeatable offline mapping checks (no live records) |
| `mappings/00_source_migration_manifest.csv` | V3 source fingerprints |
| `mappings/01_verified_ddl_columns.csv` | 118 mapped column/line citations |
| `mappings/02_connect_fields_to_v3_resolution.csv` | 75 extracted Connect controls with explicitly unresolved tenant field codes |
| `mappings/03_READ_ONLY_TENANT_DISCOVERY.sql` | Safe tenant-scoped service, form, transition and billed-party discovery |
| `contracts/newcp-demo.openapi.yaml/.json` | Provisional new REST contract — 9 operations |
| `drizzle/v3-demo-scope.schema.ts` | Partial V3 SQL-aligned Drizzle source, *not* a migration, uncompiled |
| `clients/newcp-demo-client.ts` | Shared option-independent HTTP client for both React projects, uncompiled |
| `fixtures/synthetic_contract_examples.json` | Synthetic UUID examples only — not database records |
| `tests/test_static_contract.py` | Offline DDL, OpenAPI schema and fixture checks (10 PASS) |
| `tests/option_a_baseline_unit_test.log` | Existing Option A prototype unit test output (7 PASS) |
| `live/run_live_smoke.py` | Optional real HTTP smoke runner, default read-only; mutating tests locked to isolated staging |
| `ui-tests/INTEGRATION_GATES.md` | Both-React integration acceptance gates, not yet executed |
| `01_GAPS_AND_DECISIONS.csv` | Exact runtime dependencies and next ownership |

## Commands
Offline (in an environment with Python, PyYAML and jsonschema):
```bash
python tests/test_static_contract.py
```
Read-only tenant discovery (do **not** share result exports with public AI tools if they contain restricted information):
```bash
psql -X -v ON_ERROR_STOP=1 -v tenant_id=YOUR_TEST_TENANT_ID -d YOUR_ISOLATED_STAGING_DB -f mappings/03_READ_ONLY_TENANT_DISCOVERY.sql
```
Real backend smoke (after deployment; never production):
```bash
export NEWCP_BASE_URL=https://your-approved-staging-api
export NEWCP_TEST_TOKEN=...             # keep outside AI tools and shared files
export NEWCP_TEST_SERVICE_UUID=...     # real selected catalog UUID
export NEWCP_TEST_ORDER_UUID=...       # actual SANITIZED prepared order UUID
python live/run_live_smoke.py            # read-only first
# mutation in isolated staging only; explicit authorization required
NEWCP_TEST_ENV=isolated-staging NEWCP_VALID_CREATE_JSON='{"sellableItemUuid":"...","answers":[...]}' python live/run_live_smoke.py --allow-mutations
```

## Important boundaries
No direct network connection to private 3DDX environments was attempted. No migration, production access or PostgreSQL alteration was performed. No live data, credentials, patient or customer records are shipped. The Drizzle mapping only covers selected structural tables, and the supplied PostgreSQL V3 design is still subject to its independent technical review and deployment validation.
