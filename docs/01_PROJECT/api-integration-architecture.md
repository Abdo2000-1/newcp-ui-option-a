# API Integration Architecture

**Status:** Target architecture for review; not a claim of live integration.

## Intent

Preserve the existing React Option A UI and business workflow while establishing a clean boundary for the New CP service-instance API. Components must not know whether data comes from an offline mock or a real backend. The server remains authoritative for permissions, validation, pricing, workflow transitions, tenant access, and financial locks.

## Target dependency direction

```text
feature pages/components
        -> feature hooks and use cases
        -> typed API port and domain mapping
        -> offline mock adapter OR approved HTTP transport
```

Rules:

- Feature UI must not call `fetch` directly.
- Feature UI must not access a database.
- Transport owns URLs, headers, bearer token handling, JSON parsing, status mapping, and ETag capture.
- Mapping converts API models to UI/domain models without silently inventing defaults.
- Mock and live adapters should implement the same port where practical.
- Do not add an abstraction unless it isolates a real transport, mapping, or test boundary.

## Contract rules

### Service identity

Use `serviceItemUuid` as the service-instance identity. Same-type service instances must retain separate IDs, answers, pricing, billability, payer, status, history, and mutations.

### Concurrency

Store the response `ETag` and send it as `If-Match` on every mutation. Successful mutations rotate the tag. Handle `412` as a stale aggregate conflict and `428` as a missing precondition; do not retry blindly.

### Workflow

Read authorized transitions from `available-transitions`; do not hardcode legacy numeric statuses. A transition to `on_hold` requires `holdType` and `holdReasonCode` atomically.

### Forms

Use catalog form metadata and the canonical field types: `text`, `number`, `boolean`, `date`, `single_select`, `multi_select`, `file`, and `tooth_chart`. Server validation remains authoritative.

### Pricing and billing

Initial prices are backend/contract-derived. Respect `canEditPrice`. A zero final line total requires `zeroChargeReasonCode`. `isBillable` is independent from `billedToContactUuid` and must never be derived from legacy `toBeBilled`.

### F07

Use item-level `billedToContactUuid` and read-only `billedPartyOrigin`. Do not send internal database IDs or client-controlled provenance. Live payer writes remain blocked until the V204/runtime/ETL/finance gates are evidenced.

### Errors

Normalize `Problem` errors while preserving status and code. Handle at least `401`, `403`, `404`, `409`, `412`, `422`, and `428`. Do not expose tokens, PHI, internal IDs, or raw backend diagnostics.

## Known blockers and ambiguities

- `eligible-billed-parties` is marked as a proposal pending backend review.
- `Idempotency-Key` retention and replay policy is not final.
- The two hold-reason paths have different filtering requirements.
- `FormAnswer` supports polymorphic and compatibility carriers without fully enforcing precedence.
- `FormField.defaultValue` is typed as string despite polymorphic field types.
- V204 deployment, catalog IDs, roles, transition guards, currency precision, and live finance behavior are not verified.

## Migration sequence

1. Inventory current API consumers and adapters.
2. Add typed ports and contract-aware errors/ETag handling.
3. Extend offline mocks and tests for one approved bounded slice.
4. Keep all synthetic behavior labelled `MOCK / NOT_INTEGRATED`.
5. Add an HTTP adapter only after an approved safe non-production target and auth/tenant contract exist.
6. Keep migrations, ETL, live F07 writes, and production deployment outside frontend work until separately approved.
