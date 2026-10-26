# FE-FIN-001: Price Override and Independent Billability Boundary

> **Boundary Status**: `MOCK / NOT_INTEGRATED` (Option A Frontend Target)  
> **API Authority**: `docs/newcp-ai/references/api/newcp.openapi.yaml` (OpenAPI 3.0.3)  
> **Payer Reference**: `docs/newcp-ai/references/f07/integration/newcp-demo-f07.openapi.yaml` (F07 Bill To Boundary)  
> **Decisions & Policy**: `docs/newcp-ai/policy/APPROVED_QB8_QB15_DECISIONS.md` (Q-B9, Q-B10, Q-B11), `docs/newcp-ai/policy/CURRENT_V3_DATABASE_STATUS.md`  
> **Preceding Task**: `FE-SERVICE-002` (`feat/FE-SERVICE-002-etag-safe-edit`)  
> **Branch**: `feat/FE-FIN-001-price-billability-boundary`  
> **PR Title**: `feat: implement contract-safe pricing and billability UI`

---

## 1. Executive Summary & Purpose

In New CP Option A, financial controls are governed by strict transactional boundaries established in decisions **Q-B9**, **Q-B10**, and **Q-B11**:
1. **Initial Pricing**: Service items inherit backend-derived initial unit prices from the catalog sellable item.
2. **Authorized Price Overrides**: Overrides are permitted only when an authorized clerk operates on an item where `canEditPrice: true`. Once established, the authorized override is preserved and never silently reverted.
3. **Zero-Charge Integrity**: Under database rule `ck_order_items__zero_charge_has_reason`, a unit price of `$0.00` strictly mandates an explicit `zeroChargeReasonCode`.
4. **Independent Billability (Q-B9 / Q-B11)**: The `isBillable` flag is decoupled from the `billedToContactUuid` payer target.
5. **No Live Payer Persistence Claim**: Because PostgreSQL V3 database schema does not yet possess the item-level F07 payer foreign keys (`billed_to_contact_uuid`, `billed_party_origin`), the frontend maintains payer assignments strictly behind the `MOCK / PROPOSAL_PENDING_BACKEND_REVIEW` gate.

---

## 2. Business & Contract Rules

### 2.1 Backend-Derived Pricing & Authorized Overrides
- Service items display their backend-calculated catalog price by default.
- If the clerk possesses the override entitlement and `canEditPrice === true`, the price can be customized via `PATCH /services/{serviceItemUuid}` with conditional `If-Match`.
- The system preserves this price across re-renders and re-fetches; no automated background process may silently reset the user-authorized override.

### 2.2 Enforced Zero-Charge Validation (Q-B10)
- When line total evaluates to `$0.00`:
  - `zeroChargeReasonCode` is **strictly mandatory**.
  - If omitted, the client throws a `422 Unprocessable Entity` `ValidationError` with `code: 'ZERO_CHARGE_REASON_REQUIRED'` and associates the field error explicitly with `details.field: 'zeroChargeReasonCode'`.
  - The UI highlights the reason selector in red and displays contextual validation feedback.
  - An optional `zeroChargeNote` provides auditing context for clinical billing review.

### 2.3 Independent Billability vs. Bill To (Q-B9, Q-B11)
- The UI exposes separate, uncoupled controls:
  - **Billable?**: Independent boolean (`isBillable: true | false`).
  - **Bill To**: Payer contact identifier (`billedToContactUuid`).
- **Forbidden cross-derivations**:
  - `isBillable` is NEVER derived from `billedToContactUuid`.
  - `billedToContactUuid` is NEVER derived from `isBillable`.
  - Legacy `toBeBilled` is NEVER mapped to `isBillable`.
  - `order.contact_id` is NEVER used as a substitute for item-level payer identity.

### 2.4 Financial Locks & Permissions
- Items with `isInvoiced: true`, `canEditPrice: false`, or `canEditBillability: false` render disabled controls with a lock icon and explanatory badge.
- Any attempt to bypass the UI and mutate locked financial attributes throws `PermissionDeniedError` (403).

---

## 3. UI Implementation in OrderDetailsPage

In `src/features/orders/pages/OrderDetailsPage.tsx`:
- **Modal 2: Pricing & Billability Override**:
  - Unit Price input with disabled state when `canEditPrice === false` or `isInvoiced === true`.
  - Dedicated Segmented Radio: **Billable to Client? (Independent of Bill To)** (`Yes` / `No`).
  - Isolated display showing currently assigned **Bill To Contact** and its provenance (`order_default` vs. `user_selected`).
  - Conditional Zero-Charge container triggered when unit price is `$0.00`, bound to `zeroChargeReasonsList` with field error highlighting.
  - Clear error alerts for `403 Forbidden`, `409 Conflict`, or `422 Validation` responses.

---

## 4. Test Suite Coverage

A comprehensive test suite was established in `src/shared/api/__tests__/priceAndBillabilityBoundary.test.ts`:

| Test Name | Verification Focus | Status |
|:---|:---|:---:|
| `allows authorized price override and preserves it` | Custom price & quantity update, persistence verified | PASS |
| `rejects unauthorized price editing (403)` | PermissionDeniedError when unauthorized or canEditPrice is false | PASS |
| `rejects zero line total without reason (422)` | ZERO_CHARGE_REASON_REQUIRED with field: 'zeroChargeReasonCode' | PASS |
| `accepts zero line total with valid reason` | Zero total with reason code and optional audit note | PASS |
| `maintains independent Billable and Bill To values` | Non-billable with assigned contact; no cross-derivation | PASS |
| `enforces financial locks on invoiced/locked items` | Rejection with 403 on locked financial attributes | PASS |
| `LIVE_HTTP error propagation (409)` | Verifies clean error propagation without mock synthesis | PASS |
| `confirms no live payer write claim` | PayerClient status is PROPOSAL_PENDING_BACKEND_REVIEW | PASS |

---

## 5. Verification Checklist

- [x] Backend-derived initial price displayed and retained.
- [x] Price editing gated strictly by `canEditPrice` and authorized clerk permissions.
- [x] Zero-charge reason code strictly required when price is $0.00; associated with 422 field.
- [x] Separate UI controls for Billable? (Yes/No) and Bill To (Doctor/Center).
- [x] No cross-derivation between Billable and Bill To.
- [x] No mapping of legacy `toBeBilled` into `isBillable`.
- [x] Financial locks enforced on invoiced items.
- [x] Payer writes remain gated under `PROPOSAL_PENDING_BACKEND_REVIEW`.
