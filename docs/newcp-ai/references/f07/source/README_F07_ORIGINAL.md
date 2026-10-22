# F07 full-remediation review package

This package supersedes the earlier demo-only F07 patch. It treats the missing service-level billed party as a significant V3 schema/ETL gap affecting every service family.

## Review first

- `review/NewCP_V3_Review_Finding_F07_Service_Level_Billed_Party.md` — review-ready finding, impact, full solution, and sign-off gates.
- `review/V2_TO_V3_CHANGES_with_F07.html` — V2→V3 findings document with F07 added as an open significant gap.

## Proposed implementation

- `proposed_code/migrations/V204__service_level_billed_party.sql` — versioned V3 schema and financial-consistency guards.
- `proposed_code/etl/billed_party.py` — fail-closed source profiler/payer resolver.
- `proposed_code/etl/profile_billed_party.py` — generates the policy-review JSON from the exact MySQL dump.
- `proposed_code/etl/billed_party_policy.template.json` — policy shape; do not use the placeholders as a real mapping.
- `proposed_code/etl/stage_30_orders.py` — proposed full stage-30 implementation for all service families.
- `proposed_code/etl/stage_90_finalise.py` — proposed authoritative-run payer reconciliation gate.
- `proposed_code/etl/connections.env.example` — adds `ETL_BILLED_PARTY_POLICY`.

## Existing current-V3 bridge

- `proposed_code/migrations/current_v3_backfill_from_legacy_export.sql` — optional all-service SQL backfill for an already-built V3 when a rebuild is unavailable. It requires a complete, policy-resolved export from the legacy dump and rejects partial/demo-only inputs.

## Recommended sequence for the October demo

1. Restore the exact legacy MySQL dump to the read-only ETL source.
2. Run `profile_billed_party.py`; review and approve every raw value meaning.
3. Apply V204 to a clean V3 demo database.
4. Run the proposed ETL from the beginning.
5. Require stage 90 and the application-level pricing/voucher/charge/invoice tests to pass.
6. Do not run real charging or invoicing until downstream code uses `orders.order_items.billed_to_contact_id`.

The SQL bridge is a contingency, not the preferred path. PostgreSQL alone cannot reconstruct a legacy payer choice that the previous ETL never stored.

