# V0.4 Amendment — Requirements and Acceptance

This amendment supersedes interpretations in v0.2/v0.3 that placed customer-facing Connect endpoints ahead of internal CP for the October clerk workflow. It does not invalidate unmodified demo acceptance criteria.

| ID | Required clarification | Evidence |
|---|---|---|
| BR-002 / BR-003 | Select Models and Conversion options from relevant internal CP order/service paths; Connect may corroborate customer origin only | IC-01, IC-02, IC-03 |
| BR-006 | For internal add-to-existing-order, CP taskAddToThis and addCasePHP are primary source; do not copy header single foreign-key design | IC-02–IC-06, IC-25 |
| BR-007 / BR-008 | Use CP editCasePHP or catalog Other Services quick edit for field/edit conditions; billed/invoiced limitations scoped | IC-07, IC-08, IC-11, IC-12, IC-15, IC-16, IC-19 |
| BR-009 / BR-010 | Separate explicit clerk transition from customer action-triggered advancement and use branch-specific verified status lists | IC-09, IC-15, IC-18, IC-22, IC-23 |
| BR-011 | Actor, event trigger, service instance and before/after status should be recorded; source shows service-specific histories | IC-06, IC-17, IC-22, IC-23 |
| BR-015 | Actor/action/tenant policy needs explicit Casbin mapping; do not infer blanket clerk permissions or lack of them from a single PHP UI guard | IC-20, IC-21 |
| BR-004 / BR-005 | Existing header ApplianceID/SimID must not limit repeated same-type service instances | IC-02, IC-03, IC-25 |

## Existing acceptance-test amendments
- AT-06/07 and AT-12/13: Use CP creation path to determine selected valid/invalid service inputs, not invented Connect-only DTOs.
- AT-08/14: Include permitted internal clerk edit, readback and the relevant billed-state negative case only when selected service applies.
- AT-09/10/15: Choose a permitted and forbidden transition from actual service/role status configuration; avoid assuming direct customer transition permissions.
- AT-16/17: Same-type service A and B remain independently identifiable and editable regardless of legacy single-slot reference.
- AT-02/03/04: Validate real server-side Casbin permissions and tenant isolation, never client-side role/menu visibility alone.
- Add **ACT-01**: upload by an authorized customer can automatically advance a qualifying awaiting-input status when required files exist (only if upload behavior is included in demo scope; otherwise reference-only).
- Add **ACT-02**: internal clerk status change is an explicit authorized operation, not necessarily an upload event.
- Add **ACT-03**: for selected legacy OrderAppliance or OrderSim flow, billed-state edit denial behaves according to confirmed scope; safe exception escalation for different customer or admin behavior.

**Open:** selected service instances, current field catalog/configuration, full allowed-transition matrices, test fixtures and approved detailed role mapping.
