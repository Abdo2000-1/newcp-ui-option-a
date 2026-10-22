# Task 01 — Backend read-only catalog and field metadata (after approved preflight)

**Scope:** Backend repo only; catalog read operations for the current authorized tenant; one selected Biomodel candidate + Conversion, not all company products.

Read: `AGENTS.md`, `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml`, `docs/newcp-ai/references/f07/integration/v3-demo-f07.schema.ts`, `docs/newcp-ai/references/v07/mappings/01_verified_ddl_columns.csv`, `docs/newcp-ai/references/v06/form_biomodel.json`, `form_conversion.json`, `docs/newcp-ai/policy/STATUS_AND_DECISIONS.md`.

Produce **after explicit approval of touched files**:
- Application-role, tenant-scoped read-only repository + service + controller/routes for selected catalog/form metadata, following actual codebase conventions. Don't generate new DB schema.
- Zod response/request checks consistent with approved API shape, and read-only tests/fixtures with synthetic identifiers.
- A structured mapping report showing which legacy controls can be bound to actual catalog field IDs and which need real staged tenant rows; verify row-level mapping only if an approved isolated staging connection already exists.
- Describe `R01`, `R02`, `R06` outcomes with evidence; don't assert actual catalog UUID without querying the isolated staging app role.
- Run typecheck/tests; report observed results, unrun checks, and remaining blockers. Stop after this task.

**Never:** write/seed data, fabricate catalog rows/UUIDs, use admin DB connection, change DDL, upload restricted DB outputs.

Use F07 as canonical target for service payer; original V0.7 form/catalog source mapping remains reference evidence, not writable Bill To contract.
