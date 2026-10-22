# AGENTS.md — New CP React Option A (merge with existing repo guidance)

- Implement the **same business outcomes and backend API contract** as the other UI option, but preserve this option's independently designed interactions, layout and navigation. Do not copy the other option's component tree.
- Read `docs/newcp-ai/policy/STATUS_AND_DECISIONS.md` for new vs legacy precedence; read `docs/newcp-ai/references/v06/form_biomodel.json`, `form_conversion.json` and `02_Validation_Rule_Matrix.csv` when implementing service forms. Include all source-observed controls, even conditional fields; honor ACTIVE validators, do not elevate unattached validators into enforced rules.
- Connect Add/Create forms define initial fields, internal CP edit source defines staff pricing/Redo/status/billing fields; backend controls business outcomes and permissions. The other Models-like form is NOT automatically in the committed demo.
- Use **F07-aware provisional V0.9** `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml` and its typed client for API fields/requests; retain v07 only as historical evidence; do not independently invent endpoints or data fields. Backend contract only becomes canonical after approved row-level mapping.
- Two same-type services in one order must display distinct instance identity and independent edit/status/history/report outcomes.
- Bill To is per service and the F07 target mapping is known (`billed_to_contact_id`, `billed_party_origin`). Implement Doctor/Scanning Center selection now against mocks, with create/edit `billedToContactUuid`; only enable real saving when backend confirms the deployed V204 + ETL/finance gate. Never falsely claim save success or write payer to order header.
- Keep current prototype styles unless an approved ADR changes them; Option A prototype is known to be mock-backed. Don't remove mocks before real API availability is demonstrated.
- Before edits inspect existing components/router/test commands and report plan, source pointers, affected paths and tests; scope changes and run checks. Mark mock vs real runtime tests distinctly. No production data/secrets or unapproved commits/pushes/deployments.

- **F07 target contract wins over V0.7 archival Bill To blocker.** All live persisted payer claims require evidence; details at `docs/newcp-ai/policy/F07_DECISION_AND_RELEASE_GATES.md`.
