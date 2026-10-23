---
trigger: model_decision
description: Apply the New CP V0.9 handoff, Option A scope, F07 payer safeguards, and evidence-status rules for service-instance work.
---

# New CP AI Handoff Rules

Use `docs/newcp-ai/INTEGRATION_WITH_REPOSITORY.md` as the local entry point, then read only the relevant handoff task and references.

- Perform the read-only preflight before service-form, API, workflow, or F07 work.
- Use the Option A template and preserve Option A's independent UI/UX while matching the shared business outcomes and API contract.
- Use `form_biomodel.json`, `form_conversion.json`, the validation matrix, and the V3 mapping references for selected forms. Include conditional controls, but do not promote unattached validators into enforced rules.
- Treat the F07 OpenAPI, typed client, and target schema as provisional code-generation references. They do not prove live V204 deployment, ETL reconciliation, finance integration, authorization, or E2E success.
- Bill To is per service instance, never a mutable order-header shortcut. Do not accept client-supplied provenance or internal database IDs.
- Preserve independent identity, edit, status, history, files, billing, and report behavior for same-type service instances.
- Use synthetic fixtures and visibly distinguish `MOCK` from `INTEGRATED` behavior.
- Never run migrations, ETL, privileged SQL, production billing, or real-data operations from this frontend repository.
- Never invent tenant catalog rows, UUIDs, roles, transitions, prices, payer choices, API paths, or backend behavior.
- Stop and record a blocker when a missing contract, row-level mapping, permission rule, runtime gate, or owner decision affects correctness.

The repository's existing Abdo ownership boundary remains in force: React Option A work is in scope; MUI implementation or MUI comparison-spike ownership is not assigned to Abdo unless the responsible owner explicitly changes that boundary.
