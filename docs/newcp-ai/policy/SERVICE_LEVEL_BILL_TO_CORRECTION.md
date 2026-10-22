# Superseded by F07 — V0.9

The prior V0.8 discussion of an **unresolved DB design** is superseded by the supplied F07 remediation proposal.
**Canonical target:** `orders.order_items.billed_to_contact_id` plus `billed_party_origin` as defined in
`docs/newcp-ai/references/f07/source/migrations/V204__service_level_billed_party.sql`.

This is a **target model resolved for code generation**, not independent evidence of V204 deployment or ETL success.
Read `docs/newcp-ai/policy/F07_DECISION_AND_RELEASE_GATES.md` and use V0.9 API/client/Drizzle resources; V0.7 originals are archival.
