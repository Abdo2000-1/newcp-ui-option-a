# Task FE-B — Service forms and API adapter for React Option B

Read existing repository router/components and `AGENTS.md` first. Preserve Option B's own approved visual/navigation design. Scope: selected **Biomodel** and **Conversion** forms for existing orders; Implant Analog Model is a documented reference, not newly in scope.

Use all fields in `docs/newcp-ai/references/v06/form_biomodel.json` and `form_conversion.json`, linked validation/source matrix, CP staff fields and the shared provisional contract/client. Include conditional visibility and backend validation messages. Do **not** treat unattached frontend validators as active.

Deliver the most isolated frontend implementation supporting:
- All Connect creation form controls plus staff edit fields for pricing, Redo (Yes/No), service-status and intended **service-level** Bill To (Doctor or Scanning Center choices sourced from eligible-order endpoint; interactive with mock adapter now; enable real persistence only once F07 runtime gate passes).
- A genuine per-instance selection/edit experience for two same-type items on one order, with distinct IDs; no prototype-only type-level identifier.
- Consistent loading, 401/403/validation/conflict handling, readonly mode for missing permission and safe patient-data presentation.
- Use the V0.9 F07 contract and typed client for Bill To, including proper `billedToContactUuid` in create/patch responses. Mock contract adapter + unit/component tests until backend exists; real API adapter only against approved OpenAPI and runtime backend. Keep a visible evidence distinction: MOCK vs INTEGRATED.
- Browser acceptance tests for the agreed scenarios when a suitable runner/environment exists. Preserve current tests.

Start read-only by naming existing relevant files, intended edits, missing APIs, and exact commands. Implement only approved touched scope, then run tests, give evidence and stop. No backend API or DB schema redesign.

For payer changes: target ONE service UUID, preserve other same-type items, render backend 403/409/422 errors, and never show save success unless the API persisted the item payer. Do not copy an order-level Bill To assumption.
