# Task FE-SEC-001: Permission-Aware Service UI

## Executive Summary
This document establishes the permission-aware service user interface and client boundary for New CP Option A. All capabilities, controls, and form actions operate strictly under server-derived permission hints, respecting read-only states, financial invoice locks, and role restrictions without hardcoded client-side authority assumptions or security-by-obscurity patterns.

---

## 1. Permission Hints Matrix

| Server Hint | Contract Field | Type | Default | Guarded UI Surfaces |
| :--- | :--- | :--- | :--- | :--- |
| **Service Editing** | `canEditService` | `boolean` | `true` | Form inputs, specifications tabs, clinical note fields in `SubOrderDetail.tsx` and `OrderDetailsPage.tsx`. When `false` or `isReadOnly: true`, renders read-only locks. |
| **Price Override** | `canEditPrice` | `boolean` | `true` | Unit price input, quantity adjustment in Modal 2. When `false` or `isInvoiced: true`, disables inputs and displays amber Lock badge. |
| **Billability Toggle** | `canEditBillability` | `boolean` | `true` | "Billable to Client?" radio selectors in Modal 2. When `false`, locks toggle and rejects mutation with HTTP 403. |
| **Payer Assignment** | `canEditBilledParty` | `boolean` | `true` | F07 Payer selector in Modal 3. When `false`, displays lock badge and rejects changes. |
| **Workflow Advancement** | `canTransition` | `boolean` | `true` | Workflow button and transition selector. When `false`, displays locked notice, clears next options, and rejects transition execution. |
| **Read-Only / Invoiced** | `isReadOnly` / `isInvoiced` | `boolean` | `false` | Locks all financial, specification, and transition controls with a persistent read-only banner. |

---

## 2. Security & Boundary Governance Principles

### A. No Hidden Buttons as Security
- While unauthorized buttons or controls may be disabled or display lock indicators, the client-side API boundary (`ServiceClient`, `PricingClient`, `WorkflowClient`, `PayerClient`) strictly validates permission hints before dispatch and rejects unauthorized actions with `PermissionDeniedError` (`HTTP 403`).
- In `LIVE_HTTP` mode, server-returned 403 Forbidden and 401 Unauthorized responses are propagated directly to the UI without fallback to mock success.

### B. No Hardcoded Clerk Privileges or Admin Assumptions
- The frontend never assumes an internal "Clerk" role has automatic administrative override privileges.
- Admin and supervisor override capabilities remain an unverified business decision; no client bypass logic is implemented.

### C. Protection of PHI and Safe Data Presentation
- Error messages never interpolate patient health identifiers or clinical diagnostic details into query parameters, global toasts, or unauthenticated logs.
- Public representations use opaque UUIDs exclusively (`orderUuid`, `serviceItemUuid`, `billedToContactUuid`).
- Internal database BigInt primary keys (`orders.id`, `order_items.id`, `contacts.id`) and multi-tenant schema IDs (`tenant_id`) are never surfaced or accepted.

### D. No Client-Side Provenance (`billedPartyOrigin`)
- `billedPartyOrigin` (`legacy_explicit`, `order_default`, `manual_resolution`, `user_selected`, `unresolved_legacy`) is strictly managed by database triggers, migrations, and ETL.
- Client PATCH payloads never supply `billedPartyOrigin`; if present in payloads, it is stripped at the client boundary before transmission.

---

## 3. Verification & Acceptance Evidence

### Automated Test Suite
- Test file: `src/shared/api/__tests__/permissionAwareServiceUI.test.ts`
- Scenarios covered:
  1. `canEditService === false` enforces read-only mode and raises `PermissionDeniedError` (403).
  2. `isReadOnly === true` enforces read-only mode and raises `PermissionDeniedError` (403).
  3. `canTransition === false` returns empty transition list and rejects transition requests with 403.
  4. `canEditPrice === false` enforces price override lock with 403.
  5. `canEditBillability === false` enforces billability lock with 403.
  6. Propagation of 401 Unauthorized without silent retry.
  7. Propagation of 403 Forbidden without mock bypass.
  8. Stripping of client-supplied `billedPartyOrigin`.
  9. Public UUID enforcement and non-exposure of internal database integer IDs.
