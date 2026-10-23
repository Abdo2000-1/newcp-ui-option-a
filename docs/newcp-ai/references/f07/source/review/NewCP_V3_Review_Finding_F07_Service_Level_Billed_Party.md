# New CP PostgreSQL V3 Review — Significant Finding F07

## Service-level billed party is absent from V3 and is mis-mapped by the ETL

**Date identified:** 22 October 2026  
**Classification:** Significant schema and migration gap  
**Severity:** High — financial correctness and migration fidelity  
**Status:** Open; must be resolved before V3 production sign-off  
**Scope:** Every service family represented by `orders.order_items`, not only the October demo or the Model/Conversion screens  
**Recommended October demo path:** Rebuild the V3 demo database from the legacy MySQL dump with the versioned schema migration and corrected ETL in this package

## Review conclusion

The legacy `ToBeBilled`/`toBeBilled` value is an instruction for the billed party of an individual service instance. The payer can be the applicable Doctor or Scanning Center, and separate items under the same order—including two instances of the same service type—can have different payers.

The examined V3 snapshot has no authoritative pre-charge payer on `orders.order_items`. `orders.orders.contact_id` is only the order-level default; `billing.charges.contact_id` and `billing.invoices.contact_id` record later financial events. They cannot preserve the intended payer before a charge or invoice exists.

The current ETL has two distinct defects:

1. It does not read a service payer for the main legacy line families, including `OrderAppliance` (Model) and `OrderSim` (Conversion).
2. It maps `SubOrderServices.toBeBilled` and `IsmileSubOrder.toBeBilled` through `as_bool(...)` into `orders.order_items.is_billable`. Payer selection and billability are separate concepts; this transformation loses the selected account and may alter billability incorrectly.

This is a confirmed business-rule and V2→V3 mapping gap. The only unconfirmed input is the raw legacy value encoding in the exact migration dump. The implementation must profile and approve that domain; it must not guess that `0`, `1`, `true`, or `false` means Doctor or Scanning Center.

## Why this is significant

If unresolved, V3 can:

- charge or invoice the order default instead of the selected service payer;
- price a service or consume a voucher against the wrong account;
- combine services belonging to different payers on one invoice;
- lose historical payer choices during MySQL→PostgreSQL migration;
- make same-type service instances unable to retain independent payer choices;
- change the intended payer after a financial event; and
- misstate `is_billable` by interpreting a payer selector as a boolean.

Because the affected value drives money and historical migration fidelity, this finding is release-blocking for production and must be communicated alongside the V3 review findings.

## Affected service scope

| Legacy source | V3 representation | F07 treatment |
|---|---|---|
| `OrderSG` | Surgical Guide item | Discover and map a source payer column if present; otherwise save the order default at item creation. |
| `OrderTP` | Treatment Plan item | Same. |
| `OrderRep` | Radiology Report item | Same. |
| `OrderAppliance` | Model/Appliance item | Preserve its explicit `ToBeBilled` selection. |
| `OrderSim` | Conversion/Simulation item | Preserve its explicit `ToBeBilled` selection; downstream voucher logic must use the item payer. |
| `OrderRestoration` | Temporary/Final Restoration item | Resolve independently for each target item. |
| `OrderSoftware` | Software item | Resolve independently. |
| `OrderMisc` | Miscellaneous item | Resolve independently. |
| `OrderOther` | Other-service parent item | Resolve independently. |
| `SubOrderServices` | Commercial child service | Map `toBeBilled` to the payer, not `is_billable`. |
| `IsmileOrder` | iSmile parent item | Resolve its own field when present; otherwise persist the creation-time order default. |
| `IsmileSubOrder` | iSmile child service | Map `toBeBilled` to the payer, not `is_billable`. |

`OrderVoucher` remains a voucher-purchase workflow in stage 50, not an ordinary service line. Retired `OrderTrn` and `OrderOrtho` rows remain governed by the existing Q21 exclusion decision. New native V3 services are covered by the database default/validation trigger even though they have no legacy source table.

## Proposed permanent V3 design

### Authoritative item fields

Add to `orders.order_items`:

- `billed_to_contact_id bigint → crm.contacts.id`: authoritative intended payer for the individual service instance.
- `billed_party_origin varchar(30)`: provenance (`legacy_explicit`, `order_default`, `manual_resolution`, or `user_selected`; `unresolved_legacy` is permitted only during the controlled bridge window).

The parent order contact is copied only when an item is created without an explicit choice. A later order-header change does not dynamically rewrite the saved item payer.

### Database enforcement

The proposed `V204__service_level_billed_party.sql`:

- validates that the payer is in the same tenant and is an allowed Doctor/Scanning Center for the order when assigned;
- defaults new items once from `orders.orders.contact_id`;
- extends the existing item financial lock to freeze payer and provenance after any charge, invoice link, or invoice line;
- requires item-tied charges to use `orders.order_items.billed_to_contact_id`;
- requires item-tied invoice lines and direct invoice links to use an invoice addressed to that payer; and
- prevents changing an invoice recipient when its service lines belong to another payer.

The migration remains compatible with the already-built pre-review V3 by marking old items `unresolved_legacy`. A successful authoritative ETL or complete bridge backfill then makes `billed_to_contact_id` `NOT NULL`.

### Downstream application contract

Schema and ETL changes are necessary but not sufficient. The following paths must read the item payer, not the order contact:

1. price-list/account selection;
2. voucher eligibility and consumption;
3. charge creation;
4. invoice grouping and recipient selection;
5. API request/response contracts and per-service UI controls;
6. financial and client reporting; and
7. audit/reversal/rebilling flows.

An invoice may contain several service items only when they have the same `billed_to_contact_id` and currency.

## Full MySQL→PostgreSQL ETL solution

The proposed implementation changes stage 30 for every service family, not just demo records.

### 1. Profile the exact dump before migrating

Run `profile_billed_party.py` against the MySQL dump. It discovers case-exact `ToBeBilled`/`toBeBilled` columns and emits every distinct raw value and count without exporting patient/contact data.

The reviewer assigns each raw selector value one of:

- `doctor`;
- `scanning_center`; or
- `order_default`.

If the legacy column stores an actual `UserAcounts.uID` instead of a selector, the policy uses `legacy_account_id` mode. The policy receives a decision/version identifier and the generated source-domain hash.

### 2. Fail closed on unapproved values

`BilledPartyResolver` runs before stage 30 writes any rows. It stops the ETL when:

- a source payer column/value is absent from the approved policy;
- the policy belongs to a different source value domain;
- a value selects Doctor but the order has no resolvable Doctor;
- a value selects Scanning Center but the order has no resolvable Scanning Center; or
- an account-id value has no migrated contact.

Blank or absent source fields use the order default once and record that fact. Nonblank unknown values never silently fall back.

### 3. Write payer and provenance on every item

All four item creation paths in `stage_30_orders.py`—main line tables, `SubOrderServices`, `IsmileOrder`, and `IsmileSubOrder`—write:

- `billed_to_contact_id`;
- `billed_party_origin`; and
- `metadata.billed_party_migration` containing policy version, source table/column, raw value, legacy identity, resolution method, and resolved role.

The two existing `as_bool(toBeBilled)` assignments are removed. `is_billable` retains its independent default until a separate, evidenced legacy billability source is identified.

### 4. Gate the authoritative run in stage 90

The proposed stage-90 checks fail the run if any item is unresolved or cross-tenant, if required provenance is missing, or if a charge/invoice recipient differs from its item payer. They also detect mixed-payer invoices. Only a clean run makes the item payer `NOT NULL`.

## Current V3 / October demo path

### Preferred: rebuild from the dump

For the October demo, apply V204 to a clean V3 build, approve the policy generated from the exact legacy dump, run the corrected ETL, and require stage 90 to pass. This exercises the same all-service solution proposed for production and avoids demo-only data behavior.

### Alternative when a rebuild window is unavailable

`current_v3_backfill_from_legacy_export.sql` can update the already-built V3, but only from a complete legacy-derived export covering every migrated `orders.order_items` row. It validates item identity, target contact, tenant/order context, duplicates, and financial locks; it aborts if any item remains unresolved.

A PostgreSQL-only mass update such as `SET billed_to_contact_id = orders.contact_id` is not acceptable: V3 already discarded the explicit historical choice, so that update would silently overwrite Doctor/Scanning-Center distinctions. Likewise, a hand-entered list of October demo UUIDs is not the full solution and must not be used as production evidence.

## Acceptance and sign-off gates

1. The source profile and value meanings are approved against the exact authoritative MySQL dump.
2. Every migrated item has a non-null payer and documented resolution origin.
3. Zero source values are unmapped; zero payer selections are silently defaulted when a nonblank instruction exists.
4. One order can retain Model A billed to Doctor and Conversion B billed to Scanning Center before charging.
5. Two same-type items under one order can retain different payers.
6. Cross-tenant and outside-order-context payers are rejected.
7. Pricing and voucher selection use the item payer.
8. Every item-tied charge has `charges.contact_id = order_items.billed_to_contact_id`.
9. Every item-tied invoice line belongs to an invoice with `invoices.contact_id = order_items.billed_to_contact_id`.
10. Payer changes are rejected after any charge or invoice association.
11. Stage 90 reports zero unresolved items, payer mismatches, and mixed-payer invoices.
12. API/UI tests prove independent per-service selection and persistence across every supported service family.

## Review disposition

**Proposed decision:** Accept F07 as a significant open V3 finding; approve the per-item schema representation and fail-closed ETL approach; require the legacy value-domain profile, downstream billing changes, and full reconciliation evidence before closing the finding.

**Finding owner:** PostgreSQL V3 architecture/migration owner.  
**Business validation:** Development Technical Lead.  
**Downstream implementation:** New CP backend, pricing/voucher, billing/invoice, and frontend owners.  
**Cutover approval:** Database/environment owner after backup, dry run, reconciliation, and rollback review.

## Evidence boundary

This finding is based on the supplied legacy-code references and the static V3 migrations/ETL snapshot. No raw-value mapping is asserted without profiling the actual dump, and no migration has been run against a live database as part of this review package.

