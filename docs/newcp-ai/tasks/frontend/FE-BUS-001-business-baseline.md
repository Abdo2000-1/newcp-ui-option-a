# FE-BUS-001: New CP Business and Contract Baseline

**Task ID:** FE-BUS-001  
**Target Repository:** New CP React Option A (`newcp-ui-option-a`)  
**Scope:** Authoritative business baseline, clerk workflow rules, contract traceability, and boundary definitions.  
**Authority Hierarchy:**
1. Explicit New CP decisions & agreed October 2026 scope (`STATUS_AND_DECISIONS.md`, `APPROVED_QB8_QB15_DECISIONS.md`).
2. New CP v0.9.2.2 package & V204 F07 target design (`F07_DECISION_AND_RELEASE_GATES.md`, `V204__service_level_billed_party.sql`).
3. Approved OpenAPI 3.0.3 implementation target (`docs/newcp-ai/references/api/newcp.openapi.yaml`, `newcp-demo-f07.openapi.yaml`).
4. Verified legacy business evidence (CP portal internal paths: `taskAddToThis`, `addCasePHP`, `editCasePHP`).
5. Existing repository Option A implementation (`src/`).
6. Proposals, assumptions, or unverified inferences (marked explicitly as `PROPOSED`, `UNRESOLVED`, or `BLOCKED`).

---

## 1. Business Purpose & Core Context

New CP (Customer Portal & Production Control Platform) serves 3DDX internal laboratory clerks, operators, and customer service teams. Its primary business objective is to streamline order intake, prescription review, and digital/physical manufacturing service orchestration.

### 1.1 Internal CP Clerk-First Workflow (V0.4 Amendment Superseding Legacy Customer-First View)
- Historically, early documentation (v0.2/v0.3) treated the customer-facing Connect portal as the primary authority for service intake.
- Per **V0.4 Amendment** (`05_Requirements_and_Acceptance_Amendment.md`) and **AI Handoff Clerk-First** (`06_AI_Handoff_Clerk_First.md`), internal CP clerk workflows take absolute precedence:
  - Internal clerks locate prepared master orders, review submitted clinical specifications, create/append service instances to existing orders (`taskAddToThis` / `addCasePHP`), execute authorized status transitions, perform price/zero-charge adjustments, and resolve item-level payers.
  - Connect customer portal evidence (`form_biomodel.json`, `form_conversion.json`) governs only initial customer input field definitions and client-side validation rules. It is **not** authority for internal clerk edit capabilities, financial adjustments, or status advancement.

---

## 2. Biomodel and Conversion Scope

The agreed scope is strictly confined to selected **Biomodel** and **Conversion** service families attached to existing master orders:
1. **Biomodel Service Family:**
   - Anatomical 3D digital dental models, surgical osteotomy biomodels, and restorative diagnostic models.
   - Dynamic schema fields: arch selection (`upper`, `lower`, `both`), model type / finish, hollow vs solid base, articulation options, and clinical notes.
   - Reference: `docs/newcp-ai/references/v06/form_biomodel.json`.
2. **Conversion Service Family:**
   - Multi-format CAD/CAM file translation and surgical planning software conversions (e.g., DICOM to STL, coDiagnostiX, Simplant, RealGUIDE conversions).
   - Dynamic schema fields: source system, target system, jaw type, export format, and alignment verification requirements.
   - Reference: `docs/newcp-ai/references/v06/form_conversion.json`.
3. **Excluded / Reference-Only Services:**
   - Implant Analog Models and full physical aligner manufacturing are documented legacy references only; they are **NOT** in the October 2026 vertical slice.

---

## 3. Actor and Action Boundaries

| Actor Role | Permitted Actions | Prohibited Actions | Source Evidence |
| :--- | :--- | :--- | :--- |
| **Internal CP Clerk** | • View orders & attached services<br>• Create new service instances under existing orders (`POST /orders/{uuid}/services`)<br>• Edit draft/active service instance specs (`PATCH /services/{id}`)<br>• Adjust unit price, quantity, zero-charge reasons (`PATCH /services/{id}`)<br>• Transition service workflow states (`POST /services/{id}/transitions`)<br>• Select item-level payer (`billedToContactUuid`) before charge lock | • Mutate financial fields after charge/invoice lock<br>• Mutate items belonging to other tenant accounts<br>• Direct SQL or non-contract status manipulation | `IC-02`–`IC-08`, `06_AI_Handoff_Clerk_First.md`, `V100__business_rule_functions.sql` |
| **Customer / Doctor** | • Initial prescription submission via Connect<br>• Upload required clinical files (CBCT DICOM, IOS scans)<br>• Trigger automatic advancement from awaiting-input status upon upload (ACT-01) | • Direct execution of internal manufacturing workflow transitions<br>• Internal financial overrides or clerk zero-charge reason assignment | `05_Requirements_and_Acceptance_Amendment.md` (ACT-01, ACT-02) |
| **Lab Supervisor / Admin** | • Override on-hold blocks with verified reasons<br>• Re-open disputed or cancelled workflows under strict audit tracking | • Unaudited ledger or price manipulation | `BR-009`, `BR-011`, `V130__security_rls_grants.sql` |

---

## 4. Service-Instance Identity & Repeated Same-Type Rules

### 4.1 Explicit New CP Override of Legacy Header Slots
- **Legacy Architecture Flaw:** Legacy MySQL schemas stored service links as fixed single foreign-key slots on the order header (`OrderAppliance.ApplianceID`, `OrderSim.SimID`). This physically prohibited multiple same-type services per order and caused duplicate-key collisions.
- **New CP Explicit Rule (`BR-004`, `BR-005`, `BR-006`):**
  - Every service instance is stored as an independent record (`orders.order_items`) addressed by a globally unique UUID (`serviceItemUuid`).
  - An order may contain **unlimited same-type service instances** (e.g., Biomodel Upper Arch + Biomodel Lower Arch; or Conversion 1 for coDiagnostiX + Conversion 2 for Simplant).
  - Each same-type instance possesses its own independent:
    1. Unique UUID and sequential `lineNumber`.
    2. Workflow lifecycle state (`draft`, `in_progress`, `on_hold`, `completed`).
    3. Concurrency ETag version (`ETag` / `If-Match`).
    4. Dynamic form answers.
    5. Unit price, quantity, and line total.
    6. Independent `isBillable` flag.
    7. Independent item-level payer (`billedToContactUuid`).
    8. Append-only audit history log (`/history`).

---

## 5. Item-Level Payer Target & F07 Decision Resolution

Per **F07 Superseding Policy** (`policy/F07_DECISION_AND_RELEASE_GATES.md` & `references/f07/integration/APP_IMPLEMENTATION_NOTES.md`):
1. **Target Schema Model (`V204`):**
   - Each item independently owns `orders.order_items.billed_to_contact_id → crm.contacts.id`.
   - Each item tracks `orders.order_items.billed_party_origin`:
     - `order_default`: captured once from order header contact upon item creation when omitted.
     - `user_selected`: explicitly selected by staff via UI/API.
     - `legacy_explicit` / `manual_resolution`: migration and ETL resolution only.
2. **Order Contact Decoupling:**
   - An item adopts the order default contact **once** at insertion.
   - Subsequent changes to the master order's Doctor contact **never** rewrite or overwrite an existing item's saved payer.
3. **Eligible Parties Endpoint:**
   - Only parties applicable to that specific order may be chosen: Doctor/default (`orders.orders.contact_id`) or Associated Scan Center (`orders.orders.scan_center_contact_id`).
   - Sourced via `GET /api/v1/orders/{orderUuid}/eligible-billed-parties`.
4. **Financial Lock:**
   - Payer modifications are strictly prohibited after an item is charged or associated with an invoice.
5. **Runtime Verification Status:**
   - While the V204 design is **CONFIRMED** as the architectural code generation target, its live database migration, stage-90 reconciliation, and live finance integration remain **NOT VERIFIED**.
   - The frontend must therefore support item-level payer selection via contract types and mock adapters, but mark live persistence as **BLOCKED / NOT VERIFIED**.

---

## 6. Financial Rules: Pricing, Zero-Charge & Independent Billability

1. **Pricing Rule (`BR-007`, `BR-008`):**
   - Unit price and quantity are passed as strings/numbers conforming to monetary precision (`^\d+\.\d{2}$`).
   - Line total is calculated as $\text{unitPrice} \times \text{quantity}$.
2. **Zero-Charge Rules:**
   - If `unitPrice` is `"0.00"`, a valid `zeroChargeReasonCode` is mandatory.
   - Supported reason codes: `WARRANTY_REMAKE`, `CLINICAL_DISCOUNT`, `PROMOTIONAL_SAMPLE`, `GOODWILL_ADJUSTMENT`, `INTERNAL_RND`.
   - If `zeroChargeReasonCode` is provided, an explanatory note may be optionally supplied (`zeroChargeNote`).
3. **Independent `isBillable` Behavior:**
   - `isBillable` is an independent boolean attribute.
   - `toBeBilled` must not be coerced into `isBillable`.
   - A zero-charge item can still be flagged as `isBillable: true` (e.g. for reporting ledger tracking) or `false`.

---

## 7. Workflow State Machine & Concurrency

1. **Workflow Transitions (`BR-009`, `BR-010`, `R03`):**
   - Direct status updates via `PATCH` summary fields are prohibited when changing workflow states.
   - State advancement must be executed via `POST /services/{serviceItemUuid}/transitions`.
   - Available transitions are retrieved via `GET /services/{serviceItemUuid}/available-transitions`.
2. **On-Hold Atomic Validation:**
   - Transitioning to `on_hold` requires a non-empty `holdReasonCode` and descriptive `holdComment`.
   - Supported hold reasons: `AWAITING_CLINICAL_DATA`, `POOR_SCAN_QUALITY`, `PRESCRIPTION_AMBIGUITY`, `MANUFACTURING_DEFECT`, `CLIENT_REQUESTED_PAUSE`.
3. **Concurrency Control (`If-Match` / `ETag`):**
   - Every read operation returns an `ETag` HTTP header.
   - All mutation operations (`PATCH /services/{id}`, `POST /services/{id}/transitions`) **must** include an `If-Match` header containing the exact current ETag.
   - The server rejects stale writes with `412 Precondition Failed` or missing headers with `428 Precondition Required`.

---

## 8. Unresolved Conflicts & Document Disagreements

The following discrepancies exist across historical project documentation and are explicitly documented rather than silently reconciled:

1. **Design System Specification (Tailwind vs MUI — `R14`):**
   - *Conflict:* Legacy architectural baseline suggested Material UI (MUI), whereas Option A was created and approved using Tailwind CSS.
   - *Authoritative Resolution:* Per `STATUS_AND_DECISIONS.md (R14)`: Preserve existing approved Option A design (Tailwind CSS with MUI icon/component enhancements). Do not rewrite Option A into pure MUI.
2. **Customer vs Clerk Role Authorization (`BR-015` / `R06`):**
   - *Conflict:* Connect documentation suggested doctors could trigger arbitrary workflow steps.
   - *Authoritative Resolution:* Per `05_Requirements_and_Acceptance_Amendment.md`: Doctors can only trigger advancement via actual file upload (`ACT-01`). Manufacturing workflow status changes are clerk-only (`ACT-02`). Casbin role policies remain pending live database integration.
3. **F07 Payer Target Status:**
   - *Conflict:* V0.8 marked Bill To storage as an unresolved gap.
   - *Authoritative Resolution:* F07 policy resolved the target DDL (`orders.order_items.billed_to_contact_id`). However, live V204 database application is unverified in this repository.

---

## 9. Requirements Traceability Matrix

| Requirement ID | Source | Business Rule | Frontend Implication | API Operation | Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-BUS-001** | `06_AI_Handoff_Clerk_First.md` | Clerk-first workflow for existing orders | Option A UI focuses on internal case management and service line items | `GET /orders/{uuid}/services` | Unit test & UI mock render | **CONFIRMED** |
| **REQ-BUS-002** | `05_Requirements_and_Acceptance_Amendment.md` | Biomodel dynamic form specifications | Render dynamic questions for jaw, finish, base, articulation | `GET /catalog/services/{id}/form-schema` | DynamicFormRenderer unit tests | **CONFIRMED** |
| **REQ-BUS-003** | `05_Requirements_and_Acceptance_Amendment.md` | Conversion dynamic form specifications | Render source/target CAD formats, export types, alignment | `GET /catalog/services/{id}/form-schema` | DynamicFormRenderer unit tests | **CONFIRMED** |
| **REQ-BUS-004** | `BR-004`, `BR-005` | Unique service-instance identity | Distinct UUIDs and line numbers; multiple same-type instances on one order | `POST /orders/{uuid}/services` | `serviceClient.test.ts` | **CONFIRMED** |
| **REQ-BUS-005** | `BR-006` | Multiple same-type items editable independently | Editing item A must not alter item B | `PATCH /services/{id}` | Component isolation tests | **CONFIRMED** |
| **REQ-BUS-006** | `BR-007`, `BR-008` | Zero-charge reason mandatory when price is 0.00 | Require dropdown reason selection when price is zero | `PATCH /services/{id}` | `pricingClient.test.ts` | **CONFIRMED** |
| **REQ-BUS-007** | `STATUS_AND_DECISIONS.md` | Independent `isBillable` flag | Checkbox control decoupled from unit price and payer | `PATCH /services/{id}` | `pricingClient.test.ts` | **CONFIRMED** |
| **REQ-BUS-008** | `policy/F07_DECISION_AND_RELEASE_GATES.md` | Item-level Bill To selection | Dropdown for Doctor vs Scan Center choices; provenance tracking | `GET /orders/{uuid}/eligible-billed-parties`<br>`PATCH /services/{id}` | `payerClient.test.ts` | **PROPOSED / MOCK_ONLY** |
| **REQ-BUS-009** | `policy/F07_DECISION_AND_RELEASE_GATES.md` | Payer locked after charge or invoice | Disable payer editing when service is charged or invoiced | `PATCH /services/{id}` | 409 error test handling | **CONFIRMED** |
| **REQ-BUS-010** | `BR-009`, `V013` | Explicit workflow transition operations | Transition modal/buttons invoking dedicated transition endpoint | `POST /services/{id}/transitions` | `workflowClient.test.ts` | **CONFIRMED** |
| **REQ-BUS-011** | `BR-009`, `V100` | Mandatory hold reason and comment on hold | Hold modal requires code and comment before submitting | `POST /services/{id}/transitions` | `holdTransitionMockAdapter.test.ts` | **CONFIRMED** |
| **REQ-BUS-012** | `newcp.openapi.yaml` | Optimistic locking via ETag / If-Match | Header passed on all mutations; handle 412/428 errors | All `PATCH` and `POST` mutations | `concurrencyHandling.test.ts` | **CONFIRMED** |
| **REQ-BUS-013** | `BR-011` | Immutable audit history inspection | History modal displays actor, timestamp, comment, state delta | `GET /services/{id}/history` | `serviceClient.test.ts` | **CONFIRMED** |
| **REQ-BUS-014** | `R01`, `R02` | Live database V3 catalog IDs & tenant mappings | Actual staging catalog UUIDs | `GET /catalog/services` | Blocked until staging DB provisioned | **BLOCKED** |
| **REQ-BUS-015** | `R06`, `V130` | Live Google Auth PKCE & Casbin authorization | Real user login and permission enforcement | OAuth2 / API gateway | Blocked until identity server deployed | **BLOCKED** |
| **REQ-BUS-016** | `R08`, `R09` | Live HTTP backend gateway | Network HTTP connection to Express/Drizzle backend | All endpoints | Staging deployment required | **BLOCKED** |
| **REQ-BUS-017** | `08_AI_Task_Briefs.md` | Order list and summary dashboard | ERP order grid, CRM queue, KPI statistics | Not in OpenAPI 3.0.3 contract | Prototype mock fixture | **NOT_IN_SCOPE** |

---

## 10. Verification Requirements

For any frontend integration milestone:
1. **Offline Integrity:** All unit and component tests must pass 100% without an active network connection (`vitest run`).
2. **Compilation Integrity:** TypeScript (`tsc -b --pretty false`) and linting (`oxlint`) must produce zero errors.
3. **Production Build:** Vite bundle creation must complete with exit code 0.
4. **Git Hygiene:** Clean diffs with zero trailing whitespace or unresolved merge markers (`git diff --check`).
5. **No False Claims:** Live backend integration must remain marked **`NOT VERIFIED`** until verified against a deployed, live backend.
