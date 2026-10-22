# New CP — Codex handoff v0.9 (F07 integrated, 22 October 2026)

This package revises v0.8 to integrate the **source-provided V3 F07 service-level payer solution** into the Codex implementation specification. It does not claim that the attached V204 SQL/ETL was executed on a live database.

## What changed
- Target item payer mapping is **resolved for code generation**: `orders.order_items.billed_to_contact_id` + `billed_party_origin`. V0.8's unconditional Bill To write-block / "schema missing" notes are superseded by `payload/policy/F07_DECISION_AND_RELEASE_GATES.md`.
- Supplied F07 V204 migration, source profiler, stage-30 and stage-90 ETL, policy template and review are available under `payload/references/f07/source`. These are reference / DBA-owned code; Codex must **not automatically run them**.
- F07-aware OpenAPI YAML+JSON, Drizzle map, shared TS client, eligible payer endpoint proposal, sanitized fixtures, offline test and read-only SQL preflight are under `payload/references/f07/`.
- Updated backend + frontend agent instructions and Task 02, 03, FE-A, FE-B, integration and new Task 07.

## Installation
1. Review company AI/data policy. Do NOT upload real MySQL/PG dumps, identifiers, credentials or client data to an unapproved agent environment.
2. Add *contents* of `payload/` at `docs/newcp-ai/` of each authorized repo (or mount versioned read-only spec repository). Merge, do not overwrite, the relevant `templates/<repo>/AGENTS.md` into repo root.
3. Begin `tasks/00_READ_ONLY_REPOSITORY_PREFLIGHT.md`. For F07 feature use `tasks/07_F07_PAYER_VERTICAL_SLICE.md` alongside backend/FE tasks.
4. **Contract priority:** `references/f07/integration/newcp-demo-f07.openapi.yaml` and `v3-demo-f07.schema.ts` are current F07 target. V0.7 files are preserved **as historical pre-F07 evidence**, not authoritative instructions for writable Bill To.
5. Static test: `python docs/newcp-ai/references/f07/tests/test_f07_contract.py`; prior V0.7 regression: `python docs/newcp-ai/references/v07/tests/test_static_contract.py`. Requires PyYAML and jsonschema for former.
6. Database/ETL owner verifies deployed V204, exact-dump payer-domain policy, stage-90 and financial consistency before enabling live writes. Agents do not perform privileged migrations or infer that checks passed.
7. Backend tests and both React E2E tests need actual repos, authorized sanitized staging and runtime; do not label them PASS based on offline tests.

**Authority:** explicit New CP changes > evidenced legacy business rules (Connect customer create + CP clerk edit) > developer proposals. Per-item payer applies to all service families; demo coding is scoped to Biomodel and Conversion. Keep independent same-type service instances.

## Start Codex
Read `AGENTS.md`, `docs/newcp-ai/policy/F07_DECISION_AND_RELEASE_GATES.md`, and `docs/newcp-ai/tasks/00_READ_ONLY_REPOSITORY_PREFLIGHT.md`. Report actual current repository paths and runtime evidence first; do not migrate a DB. Then follow `tasks/07_F07_PAYER_VERTICAL_SLICE.md` with approved target files, unit tests and explicit release gates.
