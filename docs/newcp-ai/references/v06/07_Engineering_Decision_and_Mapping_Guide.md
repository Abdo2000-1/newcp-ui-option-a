# New CP October — Form generation, domain rules & V3 integration guide
**22 Oct 2026 · v0.6 · Static legacy source + sanitized V3 DDL evidence · Not a code implementation or runtime certification**

## Adopted form/source layering
- **Connect Add/Create Service**: all visible, hidden-by-condition, and nested source controls; use observed client-side validators, options, defaults and conditions.
- **CP internal Other Services editor**: for Biomodel and Implant Analog Model, add service-level financial fields/adjustments, Redo Yes/No, digital/physical, status, pending reason, zero-charge reason, and internal notes. The edit path is `newcp/pages/taskOtherServicesQuickEdit.php`.
- **CP internal Conversion editor**: additional bill-to, currency, cost, zero reason, Rush/Redo, status, pending reason, and correction fields via `subConvForEdit.php` + `editCasePHP.php`.
- **Backend & V3**: preserve business outcomes only where not overridden by approved New CP rules; enforce critical conditions server-side; use V3 existing schemas and controls, not old storage.

## Precise selected options
1. Primary: **Conversion** (dedicated Conversion UI form). This is a code-supported service family, not a verified V3 catalog row.
2. Primary representative **Models**: **Biomodel**, a separately selectable *Other Service*. It provides two paths: physical and digital-design-only.
3. Additional fully inventoried Models candidate: **Implant Analog Model**. Included in machine-readable forms, but not automatically an extra live CEO workflow.
4. Distinct legacy **OrderAppliance/Model Work** path remains out of this form family. Do not use its billing status rules as automatically applicable to Biomodel.

These are explicit **implementation selections for specification**, not claims of business-owner approval or verified tenant catalog seed codes. Resolve catalog ID/code for chosen tenant before final contract or DB fixture. Do not invent `MDL_PRINT_ARCH` etc.

## Connect validation — source fidelity versus improvements
- All Angular `Validators.required`, default values, radio option codes and conditional show/hide logic are included in `form_*.json`.
- Biomodel attaches its group-level at-least-one-arch validator. `custom-deliver-as` and `custom-printer-form` define validator functions but **their attachment is commented out in the inspected source**. Mark these as *candidate improvements*, not effective legacy validation rules. Any new stricter check needs deliberate engineering or business decision, depending on impact.
- Conversion shows an error if both arches are `20/None` for a standalone path, but source template alone does not prove that submission is blocked. A new server guard may be reasonable, but mark as a validation decision and test it.
- Software/format options are conditional; BSB selection maps to internal format 13, not shown as a radio choice. Do not infer unlisted tenant-supported formats.
- Do not propagate old hardcoded `+$20`, `+$50`, `+$5` and `+$450` UI labels as true prices. Tenant pricing must come from selected catalog/pricing rules or approved synthetic demo data.

## V3 physical storage — what the sanitized migration SQL actually supports
- `orders.orders` is the existing order and tenancy/party context. Internal create-service should add a **new** `orders.order_items` record, not replace an existing same-type record. Service's public key is `orders.order_items.uuid`; service type is `sellable_item_id` (FK to `catalog.sellable_items`). `line_number` has order-specific uniqueness and requires concurrency-safe allocation.
- Form controls from Connect are **conceptual fields**, not automatically database columns. Match each to `catalog.fields` + `catalog.item_fields` and actual `catalog.field_options`. Store answers using typed `orders.order_item_field_values` columns; do not blindly use Connect numeric enum IDs as V3 `field_option_id` values.
- Dynamic required/visible/option conditions have a data model `catalog.item_field_rules`. The inspected SQL creates it, but **no matching executable field-rule validator was located** by targeted search of the supplied migrations. Explicitly implement/evaluate approved conditions in the app if the supplied deployed DB does not perform it, and test. Do not assert the PostgreSQL server is enforcing every conditional rule.
- `orders.order_item_field_values` has unique `(order_item_id,field_id,field_option_id)`; PostgreSQL ordinary UNIQUE treats NULL as distinct. For single-valued non-option fields, enforce one logical value per field in the application and verify on insert/update, rather than assuming the index alone prevents duplicates.
- `orders.order_items` already contains `is_redo`, `redo_of_item_id`, `status`, `pending_reason`, `rush_type_id`, `currency_code`, `unit_price`, `fields_amount`, `line_total`, `zero_charge_reason_id` and `zero_charge_note`. The V100/V110 total and financial-lock triggers are part of the target architecture. Once invoiced or charged, financial changes are blocked; status can still progress under normal workflows.
- `workflow.workflow_instances`, `workflow.workflow_states`, and `workflow.workflow_transitions` govern allowed state changes, with trigger-based validation and history. `orders.order_items.status` is a summary. **Do not use legacy numeric CP status IDs as New CP workflow state IDs** or allow arbitrary status PATCH that bypasses V3 workflow rules.
- CP labels “Order Status” may mean **service item** status, not order header status; the API must target a unique service instance.
- `orders.order_status_history` includes optional `order_item_id`; `workflow.workflow_history` records workflow transitions. Decide and test the correct write path to avoid creating conflicting/doubled history events.
- **Unresolved billed party:** CP Conversion shows Doctor/Scanning Center, but no direct billed-party FK was found in the inspected `orders.order_items` DDL; `billing.charges.contact_id` exists. The correct source for displaying/storing per-service billed recipient requires a focused data-model decision; do not add a column or persist billing identity to arbitrary metadata without approval.
- Older OrderAppliance and legacy OrderSim historic constraints are reference-only; New CP explicitly allows two independent items of same type under one order.

## Security, correctness, and data preparation
- Derive tenant from trusted authenticated server-side context. Use transaction-scoped RLS settings within the same transaction as Drizzle queries; test an ordinary application role and verify negative tenant cases.
- Keep Google Auth/Casbin/monitoring POCs under the full-time developer's foundation responsibility.
- Do not store actual patient identifiers, customer secrets or non-anonymized records in AI-context fixtures or repositories. The supplied fixtures here are synthetic examples, not valid IDs from a database.
- Avoid automated schema modifications, ETL operations, or global V3 remediation. Escalate only the selected mapping mismatch to the designated database owners.
- No source execution, live V3 query, backend build, or generated React/Express code verification was performed in this specification pass.

## API resource modeling — candidate operations, not approved contract
- `GET /api/v1/catalog/services/{serviceTypeId}/form-schema` → selected resolved field/option/rule metadata for one tenant.
- `POST /api/v1/orders/{orderId}/services` → creates one identified service item even if type already appears.
- `GET /api/v1/orders/{orderId}/services` → lists each instance independently.
- `GET/PATCH /api/v1/services/{serviceInstanceId}` → individual read/edit (including authorized CP fields).
- `GET /api/v1/services/{serviceInstanceId}/available-transitions` → effective permitted actions from V3 workflow.
- `POST /api/v1/services/{serviceInstanceId}/transitions` → change state through accepted workflow path and history.
- Financial edits and service transition must be separate authorization scopes; parent order party changes and line billing have independent restrictions.

Request/response DTOs need actual V3 catalog codes, roles, and workflow examples before freezing OpenAPI; do **not** present endpoint suggestions as a ratified contract.
