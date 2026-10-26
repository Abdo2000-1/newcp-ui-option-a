# Task FE-UX-001: Instance-Aware Order Details

## Executive Summary
This document outlines the instance-aware enhancements applied to the Order Details page in Option A (`OrderDetailsPage.tsx`). Without altering Option A's established visual identity, layouts, or routing, the Order Details interface cleanly renders each service instance as an independent domain entity identified by its unique `serviceItemUuid`, preserving independent states across multiple items of the same service type.

---

## 1. Instance-Aware UX Capabilities

### A. Strict Entity Identification
- Each service line is keyed and addressed exclusively by its unique `serviceItemUuid` (`svc.uuid`).
- Type codes and generic names are never conflated with identity; an order containing two same-type services (e.g. two separate Biomodel instances or two Conversion services) renders distinct rows with independent controls.

### B. Independent Lifecycle and Actions
For every distinct `serviceItemUuid`, Order Details exposes:
1. **Status & Workflow:** Individual status badge (`pending_intake`, `in_progress`, `on_hold`, `completed`), hold type/reason badges, and independent workflow transition modal invocations.
2. **Dynamic Form Answers:** Specific field answers recorded for that exact instance (e.g., `model_type: solid`, `arch_selection: upper`).
3. **F07 Payer Target:** Independent item-level contact assignment (`billedToContactUuid`) with origin provenance (`billedPartyOrigin`), isolated from order-level `contact_id`.
4. **Pricing & Billability:** Independent `unitPrice`, `quantity`, `lineTotal`, `isBillable` boolean toggle, and mandatory `zeroChargeReasonCode` when total is 0.00.
5. **Audit Trail History:** Dedicated history modal triggered per item (`workflowClient.getHistory(svc.uuid)`), displaying state transitions, actors, and hold rationale.

### C. State Handling & Data Integrity
- **Loading State:** Renders a clean loading row during asynchronous fetch from the API boundary.
- **Error State:** Renders explicit error banner with a user-triggered "Retry" action.
- **Empty State:** When no contract service items exist, displays documented neutral text: *"No service instances recorded for this order."*
- **Missing Data Handling:** Displays explicit neutral placeholders (`"Not available"`) when optional fields are null or unpopulated. No fabricated names or contact fallbacks are invented.
- **Permission & Locks:** Respects `canEditPrice`, `canEditBillability`, `canTransition`, and `isInvoiced` states per item row.

---

## 2. Option A Product Preservation
- Preserves the approved Option A navigation, shell, theme transitions, and color palette.
- Does not copy Option B layout or components.
- Modifies zero unrelated pages or routes.
