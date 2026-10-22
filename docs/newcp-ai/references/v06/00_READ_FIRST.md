# New CP October Demo — Source-grounded form / validation / V3 reference (v0.6, 22 Oct 2026)

## How to use
1. Read `07_Engineering_Decision_and_Mapping_Guide.md` before generating anything.
2. Use `form_conversion.json` and `form_biomodel.json` for the primary demo flows. `form_implant_analog_model.json` captures the additional observed Models-class form, and must not automatically become an extra committed CEO scenario.
3. Generate **all form controls** in each selected form, including conditionally shown controls, parent service controls and internal CP-edit fields; conditions govern when a control appears, not whether it is documented. The form variants can differ visually across both React applications, but have the same business fields/validation/outcomes.
4. Take active **client validation rules** from `02_Validation_Rule_Matrix.csv`, distinguishing ACTIVE/ATTACHED from DEFINED_NOT_ATTACHED. Where the observed UI displays an error but the submit guard is not proven, do not assert server-enforced behavior without testing.
5. New CP backend must enforce authorization, relevant field validation, V3 DB constraints and workflow transition rules; legacy frontend validation alone is not a security guarantee.
6. Bind field keys to actual tenant-specific V3 catalog rows (not invented IDs). `03_V3_Data_Mapping_and_Gaps.csv` is a **schema-level** mapping, not an actual live row-level mapping.
7. Build synthetic fixtures only; never share live customer/patient data with AI.

## Evidence and decision classification
- SOURCE_UI_OBSERVED — legacy Angular control, option, default and active validators.
- SOURCE_CP_OBSERVED — internal PHP UI/backend staff edit behavior.
- V3_DDL_VERIFIED — structure/constraint seen in sanitized V3 migration SQL; not deployed/seeded state.
- INFERRED/MAPPING_CANDIDATE — expected new representation requires V3 row-level validation.
- OPEN — exact tenant catalog code, billed-to ownership, some prices/status transitions, API semantics.

## Choice and boundary
**Selected candidate**: Biomodel from Connect Other Services as the primary Models-class demo form; Conversion from the standalone Connect Conversion form. **Also included**: Implant Analog Model, because user requested all source fields and this is a separate observed Models-class form. This does not prove Biomodel is what stakeholders intend by the word “Models”; the selected V3 catalog ID/code is still unverified.

CP's older `OrderAppliance` edit form is **not** used as the internal-edit implementation reference for Biomodel: Biomodel belongs to configurable Other Services, which uses `taskOtherServicesQuickEdit.php`. This avoids mixing distinct legacy service types. Only generic staff controls supported by that path (pricing, redo, status etc.) are added to Biomodel.

The existing New CP same-type multiplicity rule overrides legacy. The broader V3 migration correctness/reconciliation/signoff remains outside the implementation team's scope.

## Files
- `01_All_Form_Fields_and_Sources.csv` — field-level exact source inventory, including hidden and nested controls.
- `02_Validation_Rule_Matrix.csv` — actual Angular validation attachment vs uninstalled candidate validators, CP/V3 rules.
- `03_V3_Data_Mapping_and_Gaps.csv` — confirmed DDL structure and unresolved per-row mapping.
- `04_Test_Scenario_Catalog.csv` — targets for AI-generated tests.
- `05_Synthetic_Form_Fixtures.json` — non-sensitive illustrative form data; not validated against database.
- `form_*.json` — machine-readable field catalogs per selected service.
- `06_Source_Manifest.csv` — source archive hashes and evidence boundaries.
- `07_Engineering_Decision_and_Mapping_Guide.md` — implementation rules and blockers.
- `08_AI_Task_Briefs.md` — copyable bounded task specifications for coding agent.
- `09_Implementation_Gap_Register.csv` — unresolved decisions with explicit ownership.
- `10_Management_Summary.docx` — executive shareable overview.
