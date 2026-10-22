# Task 03 — Backend internal clerk edit / permitted transition / financial controls

**Only implement verified parts.** Separate: (a) ordinary field edits; (b) authorized workflow transitions; (c) financial values and redo; (d) intended service-level billed party.

Inputs: CP-first `docs/newcp-ai/references/v06/07_Engineering_Decision_and_Mapping_Guide.md`, V0.6 matrices and forms, V0.7 approved transitions/tenant bindings, approved API contract, backend permissions and actual V3 financial guards.

1. Verify which CP controls apply to chosen **Biomodel configurable Other Service** versus legacy OrderAppliance (not the same thing), and Conversion; avoid copying irrelevant source edit behavior.
2. Update **one** service instance only; preserve source-enforced editability, billing locks, redo, zero charge and audit correctness.
3. Change status only through proven workflow definition/transition/guard, preserve actor/time/from/to and avoid duplicate history writers.
4. **Implement Bill To against the F07 V204 target:** `orders.order_items.billed_to_contact_id` + server-owned `billed_party_origin`; resolve the submitted contact UUID against eligible Doctor/Scanning Center on this exact order, update only the selected instance and audit the staff change. Do NOT enable live writes until F07 deployment and ETL/readiness gates are evidenced. Reject payer changes once charged/invoiced; enforce tenant/role/financial locks in API and DB. Follow `policy/F07_DECISION_AND_RELEASE_GATES.md` and the V0.9 contract, not the archival V0.7 contract.
5. Test unauthorized/invalid transitions and cross-tenant denial, repeated same-type isolation and locked billing. Give report PASS/FAIL/NOT RUN, stop.

If missing runtime evidence blocks enabling real mutation, generate testable V204-target code and synthetic contract/unit coverage with writes disabled in unverified environments; record blockers rather than inventing database behavior.
