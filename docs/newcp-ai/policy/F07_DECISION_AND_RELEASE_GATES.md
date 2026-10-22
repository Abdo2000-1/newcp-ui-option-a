# F07 superseding decision — service-level Bill To (22 October 2026)

**This page supersedes the outdated R04 / Bill To sections in V0.6, V0.7, and V0.8.**

## Authoritative target for code generation
- Each independently addressed service item (`orders.order_items.id`/UUID) owns its own intended billed party: `orders.order_items.billed_to_contact_id → crm.contacts.id`.
- Persist `orders.order_items.billed_party_origin`: `legacy_explicit`, `order_default`, `manual_resolution`, `user_selected`; `unresolved_legacy` is migration-bridge-only and MUST NOT remain after authoritative stage 90.
- Resolve eligible contacts from the **specific order**: Doctor/default `orders.orders.contact_id`, or Scanning Center `orders.orders.scan_center_contact_id`. The client may present contact UUIDs only; the server resolves BIGINT IDs under tenant scope.
- A new service without an explicit choice adopts the order contact ONCE at insert; subsequent order contact changes must not rewrite saved payer automatically.
- A staff-origin edit of Bill To updates only that service item, must set `billed_party_origin='user_selected'`, honor authorization and financial locks, and create appropriate audit evidence.
- No payer/provenance modifications after charging or invoicing. All pricing, vouchers, charge, invoice and reporting processing must use the **item payer**, not the order header payer; invoice lines must not mix billed parties or currencies.
- `is_billable` is a separate concept; `toBeBilled` MUST NOT be coerced into `is_billable`.
- This design applies to **every service family**, not only the demo; the demo's implementation task is scoped to selected Biomodel + Conversion flows and reuse of shared services.

## What the supplied F07 archive actually proves
- The user supplied complete **proposed code** for V204 schema changes, the stage-30 resolver, stage-90 validation, dump profiler, template policy and optional full legacy-export backfill.
- The original README explicitly reports the SQL was **not** run against a live V3 instance and that raw MySQL payer encodings need **profile + approval** before ETL.
- Accordingly classify `F07_TARGET_DESIGN_AVAILABLE = YES`; `LIVE_V204_APPLIED`, `APPROVED_SOURCE_POLICY`, `AUTHORITATIVE_ETL_STAGE90_PASS`, `DOWNSTREAM_FINANCE_INTEGRATED` = **NOT VERIFIED HERE**.
- User asks that the solution be treated as incorporated into the target V3 design; Codex should generate against V204's target fields rather than continue treating Bill To storage as undecided. This is NOT evidence the deployed instance has already been migrated/reconciled.

## Phase gates for Codex
1. **Generate now:** Drizzle mappings for V204, OpenAPI create/read/edit payer properties, React Doctor/Scanning Center selectors with synthetic fixtures, unit/contract tests, and backend service/repository code designed for V204.
2. **Before enabled real writes:** Database owner supplies approved V204 migration application evidence, non-null payer policy for the selected database, correct app-role tenant context, and verified eligible payer/contact UUID resolution.
3. **Before migration/financial release:** ETL owner profiles **exact restored MySQL dump**, approves every raw value mapping and domain hash, runs full corrected ETL, and supplies stage-90 reconciliation; finance owner validates pricing/voucher/charge/invoice grouping uses service payer. Static code review is NOT a substitute.
4. **Before marking integration PASS:** Execute same-instance payer edit + two same-type items with different payers, negative cross-tenant/outside-order payer, post-charge edit rejection and mixed-recipient invoice rejection on isolated sanctioned staging data; retain redacted results.

## Strict prohibitions
No fallback to `orders.orders.contact_id` for an *existing item's* billed party; no `metadata` or charge-request workaround; no fabricated source encodings, payer IDs, contract rates, or demo-only mutation of historical payer values. No autonomous migrations, ETL execution, production billing, credential handling or source export to an unapproved AI environment.

## Owner boundaries
V3/migration owner owns V204 deploy, source policy and stage-90 reconciliation. New CP backend owner owns app mapping and item-aware financial behavior. FE owners own control behavior and shared contract consumption. Development Technical Lead reviews business-rule adherence and deviations. Production F07 is not closed merely because Codex implementation compiles.
