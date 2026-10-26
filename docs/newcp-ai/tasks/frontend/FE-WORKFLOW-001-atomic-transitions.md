# FE-WORKFLOW-001: Atomic Service Workflow Transitions & On Hold Integrity

> **Boundary Status**: `MOCK / NOT_INTEGRATED` (Option A Frontend Target)  
> **API Authority**: `docs/newcp-ai/references/api/newcp.openapi.yaml` (OpenAPI 3.0.3)  
> **Decisions & Policy**: `docs/newcp-ai/policy/APPROVED_QB8_QB15_DECISIONS.md` (Q-B9), `docs/newcp-ai/references/f07/fixtures/temporary_hold_reasons_demo_mock.json`  
> **Preceding Tasks**: `FE-SERVICE-002`, `FE-FIN-001`  
> **Branch**: `feat/FE-WORKFLOW-001-atomic-transitions`  
> **PR Title**: `feat: implement contract-safe service workflow transitions`

---

## 1. Executive Summary & Purpose

Under legacy CP architectures, workflow state changes were frequently updated via arbitrary column patches or unstructured freeform statuses. This prevented transactional integrity, bypassed mandatory intake gates, and caused incomplete hold states where cases were paused without specifying who caused the hold or why.

Task **FE-WORKFLOW-001** aligns frontend service lifecycle management with the approved OpenAPI 3.0.3 contract and decision **Q-B9**:
- Service status modifications are strictly restricted to `POST /services/{serviceItemUuid}/transitions`.
- Generic `PATCH /services/{serviceItemUuid}` is prevented from mutating status (`STATUS_MUTATION_DISALLOWED`).
- Available transitions are queried dynamically per service item using `GET /services/{serviceItemUuid}/available-transitions`.
- Transitions use server-issued `transitionId` numbers (e.g. `101`, `102`, `103`, `201`, `202`); no status codes or IDs are invented.
- For every new transition to `on_hold`, the request **atomically requires BOTH `holdType` (`'customer'` | `'internal'`) and `holdReasonCode`**.
- Temporary synthetic hold reasons are isolated to mock mode, marked as synthetic, and never retrofitted onto historical NULL hold cases.
- Comprehensive immutable audit history is loaded via `GET /services/{serviceItemUuid}/history` and rendered in the service history modal.

---

## 2. Business & Contract Rules

### 2.1 Server-Driven Transition State Machine
- Permitted forward and backward transitions are determined strictly by the server/catalog workflow definition.
- Current active canonical statuses:
  - `draft`
  - `pending_intake`
  - `in_progress`
  - `on_hold`
  - `completed`
  - `cancelled`
- The client never dispatches arbitrary target statuses directly; it dispatches only `{ transitionId, ... }` with conditional `If-Match: <etag>`.

### 2.2 Atomic Q-B9 On-Hold Rule
- When the selected transition targets `on_hold` (`transitionId === 102` or `toCode === 'on_hold'`):
  1. `holdType` is **mandatory** and must be strictly either `'customer'` or `'internal'`.
  2. `holdReasonCode` is **mandatory** and must match an active reason for that hold type.
  3. Both parameters are transmitted in a **single atomic payload**. A request supplying only one is rejected with `ValidationError` (422).
- **Synthetic Reason Handling**:
  - In `MOCK / DEMO` mode, reasons are loaded from `SYNTHETIC_DEMO_HOLD_REASONS`.
  - Every synthetic reason is clearly labeled in the UI as `Demo only — ...` (`isTemporary: true`).
  - Synthetic reasons are never treated as production-approved taxonomy codes.
  - Historical records with `NULL` hold reasons are preserved as-is; the frontend never retroactively modifies or invents historical hold reasons.

### 2.3 Resuming and Leaving On-Hold
- When an item is currently in `on_hold`:
  - `available-transitions` exposes `201 Resume In Progress` and `202 Cancel Order Service`.
  - Resuming service clears the active hold flag on the item and generates a resumption history event with the clerk's audit comment.

### 2.4 Immutable Service History Trail
- Every workflow change generates an append-only audit record containing:
  - `fromCode` &rarr; `toCode`
  - `actorUserUuid`
  - `occurredAt` (ISO 8601 timestamp)
  - `comment` (including atomic hold reason and operator notes)
- History events are displayed in Modal 4 (`Service Audit History`) in reverse chronological order.

---

## 3. UI Implementation in OrderDetailsPage

In `src/features/orders/pages/OrderDetailsPage.tsx`:
- **Modal 1: Advance Service Workflow**:
  - Dynamically fetches available transitions for the selected service item.
  - Renders server-supplied transition cards with their formal `transitionId`.
  - When `Place On Hold (102)` is selected, mounts the mandatory Q-B9 container:
    - Radio buttons for `Customer Hold` vs. `Internal Hold`.
    - Filtered dropdown displaying active hold reason codes for that hold type.
  - Requires both fields before allowing submission.
  - Submits payload atomically with `If-Match: <etag>` and refreshes the table upon success.
- **Modal 4: Service Audit History**:
  - Loads and renders the complete event trail with timestamps, actors, and transition comments.

---

## 4. Test Suite Coverage

A dedicated test suite was established in `src/shared/api/__tests__/atomicTransitionsBoundary.test.ts`:

| Test Name | Verification Focus | Status |
|:---|:---|:---:|
| `executes valid forward transition` | Status change to in_progress, ETag rotation | PASS |
| `rejects on_hold without holdType (422)` | Atomic validation rule enforcement | PASS |
| `rejects on_hold without holdReasonCode (422)` | Atomic validation rule enforcement | PASS |
| `submits holdType and holdReasonCode atomically` | Single payload with both fields; history verification | PASS |
| `verifies synthetic hold reasons labeling` | isTemporary: true, marked as Demo only | PASS |
| `rejects non-numeric transitionId` | Validation error handling | PASS |
| `rejects stale transition with 412` | PreconditionFailedError with details | PASS |
| `loads and maintains transition history` | Immutable append-only audit trail verification | PASS |
| `conforms to approved status codes` | Verifies no fictional status values exist | PASS |
| `LIVE_HTTP error propagation (409)` | Verifies clean propagation without mock synthesis | PASS |

---

## 5. Verification Checklist

- [x] Transitions loaded dynamically via `workflowClient.getAvailableTransitions`.
- [x] Uses numerical `transitionId` strictly from server response.
- [x] No invented status values or arbitrary status patching via PATCH.
- [x] Atomic On Hold requires both `holdType` and `holdReasonCode` in one payload.
- [x] Valid hold types restricted strictly to `'customer'` and `'internal'`.
- [x] Synthetic hold reasons labeled clearly as temporary demo fixtures.
- [x] No retroactive modification of historical NULL hold records.
- [x] Resuming from hold clears active hold state.
- [x] Service history loaded via `workflowClient.getHistory` and displayed.
- [x] 412, 422, 403, and 409 error responses handled.
