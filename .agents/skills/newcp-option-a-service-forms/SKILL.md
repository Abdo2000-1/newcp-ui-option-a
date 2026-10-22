---
name: newcp-option-a-service-forms
description: Implement the approved React Option A Biomodel and Conversion service-instance forms against the shared New CP contract.
---

# New CP Option A Service Forms

## Purpose

Implement the selected Option A service-form vertical slice without copying another UI option or inventing business behavior.

## Required inputs

- Completed New CP handoff preflight.
- Approved task and touched-file scope.
- `references/v06/form_biomodel.json` and `form_conversion.json`.
- `references/v06/02_Validation_Rule_Matrix.csv`.
- Relevant V3 mapping and synthetic fixture references.
- `references/f07/integration/newcp-demo-f07.openapi.yaml` and typed client when payer fields are involved.

## Workflow

1. Inspect the actual router, reusable components, form state, mock adapter, API boundary, and existing tests.
2. Map every required and conditional control to an evidence-backed field key.
3. Keep Connect creation fields separate from internal CP edit fields for pricing, Redo, status, and Bill To.
4. Model service instances independently so two same-type items retain distinct IDs, edits, statuses, histories, files, and reporting outcomes.
5. Implement loading, read-only, unauthorized, validation, conflict, and failure states.
6. Use a mock contract adapter until an approved backend runtime is available; label simulated behavior as `MOCK`.
7. For F07, expose public UUIDs and `billedToContactUuid`; never expose internal BIGINT IDs or accept client provenance.
8. Add focused unit/component/contract tests for success, invalid, boundary, permission, conflict, and repeated-instance behavior.

## Constraints

- Preserve Option A's independent visual and interaction design.
- Do not add the Implant Analog Model to the committed demo without approval.
- Do not connect directly to PostgreSQL.
- Do not run migrations or ETL.
- Do not claim a save succeeded unless the approved API persisted it; mock saves must be visibly simulated.
- Do not invent catalog UUIDs, API paths, roles, prices, statuses, or transitions.

## Completion gate

The skill is complete only when changed fields map to evidence, tests pass with actual results, mock/integrated status is explicit, no unrelated files changed, and unresolved contract or runtime gates are recorded.
