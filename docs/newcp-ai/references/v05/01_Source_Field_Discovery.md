# New CP — Connect Form + CP Internal Edit Field Discovery
**Evidence supplement v0.5 | 22 October 2026 | Static-source inspection**

## Decision and scope
For the October demo's internal clerk workflows, extract the **base service-selection and creation-form fields** from the existing *Connect Add/Create Service* frontend, then add the **specific internal CP controls** identified by the Technical Lead: relevant pricing/billing inputs, Redo (Yes/No) and order/service status. Do not copy customer-only access limitations. Implement independent service-instance identity under New CP even where legacy has one reference per service type.

This document describes **observed source fields**, not the final selected demo service/catalog code, the full legacy business rule set, or verified V3 data mappings. The source is an archived Angular 12 `new-connect-v3-CR_DDS_V2.zip`; no runtime version comparison has been executed. Source line numbers refer to files in that archive or to `CP-master 2.zip`.

## Connect Add/Create Order — form ownership
- `projects/connect/src/app/Pages/ConnectModules/connect-pages/add-order-pages/add-order/add-order.component.html:11-36` hosts `<app-add-order-form>`.
- `shared/shared-components/shared-forms/add-order-form/add-order-form.component.ts:2116-2128` defines the Conversion `FormGroup`.
- `shared/shared-components/shared-forms/add-order-form/conversion-form/conversion-form.component.html:1-265` defines its visible fields, choices and conditional rendering.
- `projects/connect/src/app/Pages/ConnectModules/connect-pages/add-order-pages/utils/mappers/create-conversion-data.util.ts:1-27` shows a conversion request projection. Inspect the owning server paths before concluding those values are accepted server rules.

### Conversion — source-observed candidate fields
| Field/control | Source-observed behavior | Evidence | Classification |
|---|---|---|---|
| Software | Simplant (1), coDiagnostiX (3), BSB (6); conditional Express presentation | `conversion-form.component.html:4-29` | Connect UI observed; visibility depends on mode |
| Format | Dependent on Software, with specified format choices | `conversion-form.component.html:31-67`; `conversion-form.component.ts:104-113` | Conditional UI choice; IDs are legacy values |
| Maxilla / Mandible | None (20), Full Arch (21), Left Quad (22), Right Quad (23), Anterior Sextant (24) | `conversion-form.component.html:82-178` | UI choice; not necessarily valid in every scenario |
| Type Maxilla / Type Mandible | Custom (1), Basic (2), shown when matching arch condition holds | `conversion-form.component.html:112-178` | Conditional UI choice |
| Separate-double-arch files | Checkbox shown for specified arch/model-scan conditions | `conversion-form.component.html:181-190`; mapper | Conditional UI choice |
| Portable version | No (1), Yes (2) | `conversion-form.component.html:194-213` | UI choice |
| Model scan | No (0), Yes (1); enabled only outside Surgical Guide path | `conversion-form.component.html:216-235` | Conditional UI choice |
| Intraoral scan available | No (1), Yes (2); control added when modelScan is 1 | `conversion-form.component.ts:165-174`; `.html:239-258` | Dynamically required UI control |
| General comment | Initialized to empty string | `add-order-form.component.ts:2116-2128` | Form control; confirm exact screen placement |

**Validation warning:** Angular `Validators.required` on an enum with default values does not prove every business combination is valid. Conversion UI explicitly warns when neither maxilla nor mandible is chosen (`conversion-form.component.html:70-80`). Backend and service-specific workflow constraints still govern persistence. Static dollar figures displayed beside specific options are illustrative labels, not definitive tenant pricing.

## Connect Add/Create Order — Models ambiguity and candidates
`shared/shared-components/shared-forms/add-order-form/other-services-form/other-services-form.component.ts:53-65` offers at least **Biomodel** and **Implant Analog Model**, in addition to other service types. `other-services-form.component.html:124-202` renders these as separate forms. Separately, the older CP `OrderAppliance`/Model path has its own internal data model. **Do not conflate these distinct services or automatically call one the October selected Models option.**

### Biomodel candidate
`shared/shared-components/shared-forms/add-order-form/digital design services/other-services/biomode-service/biomode-service.component.ts:83-126`:
- `isDigitalDesign` (required boolean), `customizationMaxilla`, `customizationMandible`, `colorMaxilla`, `colorMandible`, `rxNote`.
- For digital design, dynamically adds `printerGroup`, `deliverablesgroup`, and `nestingDesign`; otherwise removes them.
- Nested controls and the custom `validator` must be examined before classifying a complete field list as final.

### Implant Analog Model candidate
`shared/shared-components/shared-forms/add-order-form/digital design services/other-services/implant-analog-model/implant-analog-model.component.ts:81-106`:
- `ImpantAnalogDDS` required, `ImpantAnalogArches` required, `ImpantAnalogRxNote`, `implantSystem`.
- Digital design selection conditionally adds `ImpantAnalogdeliverablesgroup`, `ImpantAnalogprinterGroup` and `ImpantAnalogNest`.
- The `implantSystem` field is initialized empty without a `required` validator in this specific form. This is a UI validation observation, not a global business statement.

## CP internal staff edit fields — relevant additions

### Conversion
- `CP-master/newcp/pages/subConvForEdit.php:229-233` — **Client to be billed** (Doctor / Scanning Center).
- `subConvForEdit.php:272-282` — **Rush** and **Redo** Yes/No.
- `subConvForEdit.php:293-309, 370-380` — **Status** and **cost**, with pending state handling.
- `subConvForEdit.php:390-397` — **Zero-cost reason**, including conditional Other detail.
- `CP-master/newcp/pages/editCasePHP.php:746-750,809-813,816-832,878-887` — backend update logic and billed-state guard.
- `editCasePHP.php:906-925` — zero-charge reason mapping; do not treat it as display-only behavior.

### Models (legacy OrderAppliance path)
- `CP-master/newcp/pages/subModelForEdit.php:204-207` — **Client to be billed**.
- `subModelForEdit.php:286-289` — **Redo** Yes/No.
- `subModelForEdit.php:254-265, 315-348` — status/pending and model cost.
- `CP-master/newcp/pages/taskModelQuickEdit.php:120-124` — internal save path for Redo.
- `CP-master/newcp/pages/editCasePHP.php:223-227,297-320,329-337` — billed-state guard, cost/bill-to/currency/comments, model status.

### Important status distinction
In CP, the label **Order Status** frequently represents a **specific sub-order/service status** (`OrderSim.StatusId` or `OrderAppliance.StatusId`), not necessarily the parent order header's status. New CP must address the affected *service instance* explicitly in the status API, authorization checks and audit/history.

## What this resolves versus what remains
**Source-observed now:** Connect Conversion UI field/option definitions and conditional UI rules; Connect has separate Biomodel and Implant Analog Model candidates; CP internal price/currency/bill-to, Redo and per-service status controls exist.

**Needs scoped corroboration:** which Models option is selected for the CEO demo; full nested shared-form/validator behavior; actual effective pricing and status transition permissions from backend/config; actual V3 catalog item and physical columns; authorized Drizzle read/write behavior and sanitized fixtures. Those latter technical mappings cannot be learned from frontend forms alone.

**For AI generation:** Supply the selected actual form definition plus CP-only additions as two explicit layers, with per-field source refs; supply the verified backend validations and exact V3 mappings separately. Do not generate new APIs or Drizzle schema from legacy field names automatically; no reuse of legacy one-service-per-type uniqueness.

**Out of scope:** full V3 assessment, migrations, remediation and sign-off.
