# Status / precedence / release gates — New CP demo

## Current scope
Demo in late October 2026: internal clerks locate prepared orders, create/edit selected Biomodel/Conversion service instances, manage authorized workflow status and instance history, and reconcile instance-aware reports in **two distinct UI alternatives** sharing **one** backend contract. Also approved foundation POCs as agreed. CEO evaluation is directional; later operator UAT is separate.

## Authoritative business sources
- Connect customer portal **Add/Create New Service**: initial service fields/options, currently attached client validation, conditional controls. Not authority for internal clerk edit permissions.
- CP internal portal: financial fields, redo, status and clerk edit capabilities, conditions/restrictions.
- Backend and configuration: true server-side guards, updates, computed values, eligibility and side effects.
- Explicit New CP decisions override legacy rules. New repeatable instances mean unique **service-instance identity**, never one-per-type storage or blanket duplicate-type errors.

## Evidence labels
- `NEWCP_CONFIRMED`: explicit new requirement.
- `LEGACY_UI_OBSERVED` / `LEGACY_CP_OBSERVED`: observed source behavior in relevant actual path.
- `V3_DDL_VERIFIED`: structural static migration definition only.
- `CANDIDATE_UNVERIFIED`: design or developer proposal pending DB/runtime/config.
- `DEMO_ONLY_APPROVED`: lead-approved labeled simulation; never production authority.
- `BLOCKED`: prohibited operation pending authoritative mapping or approval.

## Decisions that must remain visibly open
1. Biomodel and Conversion selected catalog identifiers and tenant availability: `R01`.
2. Exact field definitions/options/conditions mapped to active V3 data: `R02`.
3. Effective transitions, guards, roles, history behavior: `R03`, `R06`, `R13`.
4. **Service-level Bill To — F07 TARGET RESOLVED**: `R04` schema/business design replaced by `orders.order_items.billed_to_contact_id` + `billed_party_origin` per supplied V204. Runtime V204 deployment, exact MySQL source policy, ETL stage-90 and finance integration remain evidence gates. See `policy/F07_DECISION_AND_RELEASE_GATES.md`. Do not store in metadata/order header or charge workarounds.
5. Prices/zero-charge, sanctioned fixture records, running API and both FE repos: `R05`,`R07`–`R10`.
6. Idempotency and source validator attachment edge cases: `R11`,`R12`.
7. Option A Tailwind vs MUI direction: `R14`; preserve the existing approved mock design unless explicit ADR resolves migration.

## Phase gates
- **Generation permitted:** read-only repo analysis; unit tests; TS/React form scaffolds with source-grounded controls; mock adapters; proposals; read-only catalog API using verified DDL with tenant scoping.
- **Generation conditional:** F07 item-payer fields can be generated against V204; ENABLED real financial writes and workflow transitions require live migration/ETL readiness and real row-level mappings, permission and financial guard proof. Create/edit require catalog IDs and correct per-instance DB transaction semantics.
- **Never infer PASS:** no claim of live DB, role security, E2E or production-readiness without recorded executions.
- **No autonomous privileged actions:** commits/pushes/merges, database DDL/migrations, external deployments, production traffic or uploading sensitive files all require explicit authorization.

The backend developer remains responsible for reviewing business correctness and security, even when tests pass. Existing POCs/CI standards remain binding where agreed.
