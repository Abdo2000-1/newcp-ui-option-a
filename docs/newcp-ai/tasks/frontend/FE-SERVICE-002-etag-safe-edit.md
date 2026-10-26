# FE-SERVICE-002: ETag-Safe Service Instance Editing with Concurrency Control

> **Boundary Status**: `MOCK / NOT_INTEGRATED` (Option A Frontend Target)  
> **API Authority**: `docs/newcp-ai/references/api/newcp.openapi.yaml` (OpenAPI 3.0.3)  
> **Preceding Task**: `FE-SERVICE-001` (`feat/FE-SERVICE-001-create-service-instance`)  
> **Branch**: `feat/FE-SERVICE-002-etag-safe-edit`  
> **PR Title**: `feat: add ETag-safe service instance editing`

---

## 1. Executive Summary & Purpose

In a collaborative dental laboratory environment, multiple operators (e.g. intake clerks, CAD designers, billing specialists) simultaneously interact with orders and their child service instances. Without optimistic concurrency control, concurrent edits overwrite each other silently ("last write wins"), destroying clinical directives or overriding financial parameters.

Task **FE-SERVICE-002** enforces strict RFC 7232 HTTP concurrency control across the frontend:
- Captures and retains authoritative entity ETags (`W/"..."`) on every read.
- Dispatches conditional `If-Match` headers with every `PATCH /services/{serviceItemUuid}` and workflow transition.
- Explicitly handles `412 Precondition Failed` without silent automated retries.
- Preserves the operator's unsaved form draft in memory following a 412 conflict.
- Provides a clear compare and reconcile workflow so the operator can inspect server changes against their local draft.
- Handles `428 Precondition Required` when an edit is attempted without an ETag.
- Isolates mutation targets to exactly one `serviceItemUuid`, ensuring same-type services under the same order are unaffected.
- Disallows generic status modifications via `PATCH`, reserving status transitions exclusively for authorized workflow transitions.
- Enforces read-only protection against invoiced or locked items (`403 Forbidden`).

---

## 2. Concurrency Architecture & Mechanics

### 2.1 ETag Lifecycle & Rotation
1. **Initial Read**: When a service instance is loaded via `serviceClient.get` or `listByOrder`, the aggregate or entity ETag is extracted from HTTP headers (or mock adapter) and registered with `ConcurrencyManager`.
2. **Conditional Dispatch**: Any mutation dispatched through `serviceClient.edit` requires an `If-Match: <etag>` parameter. If omitted, the client throws `PreconditionRequiredError` (428).
3. **ETag Rotation**: Upon successful server mutation, the server returns an updated ETag (e.g. `W/"srv-101-rev2"`). `ConcurrencyManager` rotates its cache to the new revision and clears temporary drafts.
4. **Collision Detection (412)**: If another user modified the resource in the interim, the server returns `412 Precondition Failed`. `ConcurrencyManager` captures the conflict, stores the user's uncommitted draft, and notifies UI subscribers.
5. **No Silent Retry**: Under no circumstances does the frontend silently refresh the ETag and re-dispatch the payload. Doing so would violate clinical safety by silently overriding another operator's instructions.

### 2.2 Status Mutation Boundary
- In New CP OpenAPI 3.0.3, service lifecycle state transitions are governed strictly through:
  `POST /services/{serviceItemUuid}/transitions`
- The generic endpoint `PATCH /services/{serviceItemUuid}` is restricted to metadata fields (`answers`, `serviceNotes`, etc.).
- `ServiceClient.edit` explicitly rejects any payload attempting to modify `status` with `ValidationError(STATUS_MUTATION_DISALLOWED)`.

### 2.3 Read-Only & Financial Locks
- If an item is locked (e.g. `isInvoiced: true` or `canEditPrice: false`), attempts to mutate financial fields (`unitPrice`, `quantity`, `isBillable`) throw `PermissionDeniedError` (403), preserving financial integrity.

---

## 3. UI Implementation in SubOrderDetail

In `src/features/orders/pages/SubOrderDetail.tsx`:
- Integrated `useServiceItemConcurrency(serviceItemUuid)` hook.
- When an edit conflict (412) occurs:
  - Displays a high-visibility amber conflict banner: `412 Precondition Failed: Concurrency Conflict Detected`.
  - Informs the user that their draft is safely preserved in memory.
  - Surfaces a `Reload Latest Server Version & Compare` action button.
- Displays read-only badges when financial locks prevent modifications.

---

## 4. Test Suite Coverage

A comprehensive test suite was established in `src/shared/api/__tests__/etagSafeEdit.test.ts`:

| Test Name | Verification Focus | Status |
|:---|:---|:---:|
| `successfully edits with valid If-Match` | ETag rotation, answers and notes update | PASS |
| `rejects edit without If-Match (428)` | PreconditionRequiredError validation | PASS |
| `rejects edit with stale ETag (412)` | PreconditionFailedError with details; no silent retry | PASS |
| `preserves unsaved draft on 412` | Memory draft retention, reconciliation flow | PASS |
| `ensures independent same-type items isolated` | Unrelated same-type items remain untouched | PASS |
| `rejects generic status mutation via PATCH` | Enforces workflow transition requirement | PASS |
| `enforces read-only permissions (403)` | Invoiced and locked item protection | PASS |
| `LIVE_HTTP error propagation (403/409)` | Verifies no mock fallback on live transport errors | PASS |

---

## 5. Verification Checklist

- [x] ETag retained on read and passed via `If-Match` on `PATCH`.
- [x] 412 handled without silent retry; draft retained in memory.
- [x] Compare/reconcile path implemented.
- [x] 428 Precondition Required thrown when ETag missing.
- [x] Independent same-type instances tested and isolated.
- [x] Status mutation rejected via PATCH; reserved for workflow transitions.
- [x] Read-only / invoiced protection enforced.
