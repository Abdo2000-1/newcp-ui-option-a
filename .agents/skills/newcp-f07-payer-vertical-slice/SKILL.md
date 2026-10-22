---
name: newcp-f07-payer-vertical-slice
description: Implement or review the F07 per-service Bill To behavior for Option A without claiming live migration or finance readiness.
---

# F07 Payer Vertical Slice

## Purpose

Apply the V0.9 service-level payer target to the frontend contract and mock interaction while preserving strict release gates for live writes.

## Required inputs

- `docs/newcp-ai/policy/F07_DECISION_AND_RELEASE_GATES.md`.
- `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml`.
- `v3-demo-f07.schema.ts`, the typed client, synthetic fixtures, and relevant Option A form task.
- Actual repository auth, tenant, API, and service-instance boundaries.

## Rules

- The target is `orders.order_items.billed_to_contact_id` plus `billed_party_origin`.
- The frontend sends public `billedToContactUuid`; it never sends internal contact IDs or provenance.
- Eligible choices are resolved for the specific order and tenant: Doctor/default and, when applicable, Scanning Center.
- A new item may default once to the order contact when the field is omitted; later order-header changes must not rewrite the saved item payer.
- An explicit staff change affects one service item, records `user_selected` server-side, respects authorization and financial locks, and must not change sibling items or the order header.
- Payer changes after charge or invoice are rejected.
- `is_billable` and `toBeBilled` are not interchangeable.

## Workflow

1. Confirm the contract and current frontend boundary.
2. Implement or update the mock adapter and payer controls only in approved Option A scope.
3. Add tests for two same-type items with different payers, missing/ineligible/cross-tenant choices, locked edits, and response error mapping.
4. Mark live persistence as `BLOCKED` or `NOT VERIFIED` until V204 deployment, approved source policy, stage-90 reconciliation, app-role tenant context, and finance checks have evidence.
5. Produce a gate table with actual evidence and unrun checks.

## Stop conditions

Stop on missing eligible contact mapping, authorization behavior, financial lock behavior, or backend runtime. Never replace a missing gate with a fixture-based success claim.
