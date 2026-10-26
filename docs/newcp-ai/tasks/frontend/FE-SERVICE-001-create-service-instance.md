# FE-SERVICE-001: Create Independent Biomodel and Conversion Service Instances

> **Boundary Status**: `MOCK / NOT_INTEGRATED` (Option A Frontend Target)  
> **API Authority**: `docs/newcp-ai/references/api/newcp.openapi.yaml` (OpenAPI 3.0.3)  
> **Business Evidence**: `docs/newcp-ai/tasks/frontend/FE-BUS-001-business-baseline.md`, `docs/newcp-ai/policy/APPROVED_QB8_QB15_DECISIONS.md`  
> **Preceding Task**: `FE-FORM-001` (`feat/FE-FORM-001-typed-dynamic-forms`)  
> **Branch**: `feat/FE-SERVICE-001-create-service-instance`  
> **PR Title**: `feat: create independent Biomodel and Conversion service instances`

---

## 1. Executive Summary & Purpose

In New CP Option A, cases are composed of one or more authoritative service instances attached to a master order. Under legacy systems, orders were frequently constrained to rigid single-slot concepts (e.g. fixed `ApplianceID` / `SimID`), preventing clinical users from adding repeated services or tracking distinct item lifecycles.

Task **FE-SERVICE-001** establishes the frontend service instance creation boundary for the two primary archetypes:
1. **Biomodel 3D Printing** (`BIOMODEL`, physical service, lead time 2 days)
2. **Dicom to CAD Conversion** (`CONVERSION`, digital service, lead time 1 day)

This task delivers:
- Contract-compliant payload formation matching `POST /orders/{orderUuid}/services`.
- Support for multiple independent same-type service instances within a single order.
- Direct mapping of dynamic questionnaire answers from `DynamicFormRenderer` into `answers: FormAnswer[]`.
- Default quantity behavior of 1 for Biomodel and Conversion.
- Independent `is_billable` state preservation, decouple from Bill To contact resolution.
- Strict zero-charge constraint enforcement (`ck_order_items__zero_charge_has_reason`).
- Redo service instance modeling referencing the original service item (`redoOfItemUuid`).
- Full UI resilience against form validation errors, server HTTP failures, and offline fallback.

---

## 2. Business & Architecture Rules

### 2.1 Independent Service Instance Identity
- Each service instance created under an order receives a unique UUID (`srv-...`), its own lifecycle state (`status: 'pending_intake'`), and its own concurrency revision / ETag (`W/"srv-...-rev1"`).
- Multiple service instances of the **same archetype** (e.g., two distinct Biomodel instances with different arch selections or wall thicknesses) can coexist within the same order without collision or overwriting.

### 2.2 Canonical Form Answer Mapping
- Questionnaire inputs collected via `DynamicFormRenderer` are structured into canonical `FormAnswer` objects:
  ```json
  [
    { "fieldCode": "model_type", "value": "solid", "optionCodes": ["solid"] },
    { "fieldCode": "arch_selection", "value": "both", "optionCodes": ["both"] },
    { "fieldCode": "wall_thickness_mm", "value": 2.5, "valueNumber": 2.5 }
  ]
  ```
- No arbitrary keys or uncontracted UI widget states are sent to the API.

### 2.3 Default Quantity & Line Pricing
- By business policy, Biomodel and Conversion service items default to `quantity: 1`.
- When an explicit quantity is provided, line totals are computed strictly as:
  $$\text{lineTotal} = \text{unitPrice} \times \text{quantity}$$
- Frontends never alter catalog base prices; pricing overrides occur only via clerk actions adhering to permission rules.

### 2.4 Independent Billability vs. Bill To Resolution
- Per decision **Q-B9** and **Q-B11**:
  - `isBillable` is an independent boolean flag on the service item.
  - An item can be marked non-billable (`isBillable: false`) regardless of whether a payer contact is assigned.
  - Bill To payer resolution (`billedToContactUuid`) remains governed by the mock/contract gate and is never coupled to live database billing operations.

### 2.5 Zero-Charge Enforcement
- In compliance with database integrity rule `ck_order_items__zero_charge_has_reason`:
  - When `unitPrice` is `"0"` or `"0.00"`, a valid `zeroChargeReasonCode` (e.g. `DOCTOR_DISCOUNT`, `WARRANTY_REDO`) is **mandatory**.
  - An optional `zeroChargeNote` provides auditing context for clinical billing review.
  - The client rejects submission immediately if a zero-price item lacks a reason code.

### 2.6 Redo Support
- When a service item represents a clinical redo (`isRedo: true`):
  - `redoOfItemUuid` is mandatory and references the original service item in the order.
  - The redo item maintains its own independent status, answers, and audit log.

---

## 3. Implementation Details

### 3.1 Client Layer (`src/shared/api/serviceClient.ts`)
- Enhanced `ServiceClient.create(orderUuid, payload)`:
  - Validates `sellableItemUuid`.
  - Enforces zero-charge validation (`ZERO_CHARGE_REASON_REQUIRED` error when price is 0 without reason).
  - Enforces redo source validation (`REDO_SOURCE_REQUIRED` error when `isRedo` is true without `redoOfItemUuid`).
  - Sets default `quantity = 1` and default `isBillable = true`.
  - Computes `lineTotal` mathematically from `unitPrice` and `quantity`.
  - In `LIVE_HTTP` mode (`enableMocks: false`), propagates server HTTP errors directly and refuses mock synthesis.
  - In `MOCK_HTTP` / `MOCK_BROWSER` mode, stores the newly minted item into the in-memory mock store and issues an initial revision ETag.

### 3.2 UI Integration (`src/features/orders/pages/OrderDetailsPage.tsx`)
- Integrated `+ Add Service Item` modal (Modal 5):
  - Allows toggling between **Biomodel 3D Printing** (`11111111-1111-4111-8111-111111111111`) and **Dicom to CAD Conversion** (`22222222-2222-4222-8222-222222222222`).
  - Dynamically mounts `DynamicFormRenderer` scoped to the chosen service archetype.
  - Provides inputs for `unitPrice`, `quantity` (default 1), and `isBillable` checkbox.
  - Displays conditional Zero-Charge fields (reason dropdown and note input) when unit price is 0.00.
  - Displays conditional Redo controls (original item dropdown) when `isRedo` is checked.
  - Displays clear error banners for validation errors or server failures.
  - On submission, executes `serviceClient.create` and triggers automatic refresh of the authoritative contract services table.

---

## 4. Test Suite Coverage

A comprehensive test suite was established in `src/shared/api/__tests__/createServiceInstance.test.ts`:

| Test Name | Verification Focus | Status |
|:---|:---|:---:|
| `creates an independent Biomodel service instance` | Answers mapping, status, default quantity = 1, lineTotal calculation | PASS |
| `creates an independent Conversion service instance` | Answers mapping, digital format answers, unitPrice and lineTotal | PASS |
| `supports multiple same-type service instances within the same order` | Unique UUIDs, independent data, listing persistence | PASS |
| `enforces default quantity of 1 when omitted` | Default 1, custom multiplier lineTotal math | PASS |
| `supports is_billable flag independently of billedToContactUuid` | Explicit true/false billability decoupled from contact | PASS |
| `enforces zero-charge constraints` | Rejection on 0.00 without reason, acceptance with valid reason code | PASS |
| `supports redo service instance creation` | Rejection without original UUID, acceptance with valid reference | PASS |
| `rejects payload when sellableItemUuid is missing` | Contract validation error handling | PASS |
| `LIVE_HTTP mode error propagation` | Propagates 422/network failure, never fabricates mocks in live mode | PASS |

---

## 5. Verification Checklist

- [x] Canonical Biomodel and Conversion schemas supported.
- [x] Dynamic questionnaire answers mapped accurately into `FormAnswer[]`.
- [x] Zero-charge reason enforced strictly for $0.00 line items.
- [x] Redo instances strictly reference original instance UUID.
- [x] Multiple instances under single order tested and verified.
- [x] No backend deployed; no database migrations executed; no live F07 Bill To enabled.
- [x] Verified via offline mock adapters and typed boundary contracts.
