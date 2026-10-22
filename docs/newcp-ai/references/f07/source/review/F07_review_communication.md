# V3 review addendum — significant gap F07

**Subject:** V3 review addendum: service-level billed-party mapping (F07)

During the V2→V3 mapping review, we confirmed a significant gap in the current V3 design and ETL. The billed party is selected per service instance in the legacy CP; it is not an order-wide attribute. Services under the same order, including two instances of the same type, may be billed independently to the applicable Doctor or Scanning Center.

The reviewed V3 `orders.order_items` structure does not store this instruction. The current ETL also omits the value for the main service tables and maps `SubOrderServices.toBeBilled` and `IsmileSubOrder.toBeBilled` to `is_billable`, which is a different concept. This can lose historical payer choices and drive pricing, vouchers, charges, or invoices to the wrong account.

We propose recording this as **F07 — Significant / Open / production-sign-off blocker** and resolving it across all service families by:

- adding an authoritative `orders.order_items.billed_to_contact_id` with migration provenance;
- profiling and approving the exact legacy value domain from the MySQL dump rather than assuming its encoding;
- resolving every item through one fail-closed ETL rule, with the order client used only as the creation-time default when no explicit source choice exists;
- removing the incorrect `toBeBilled → is_billable` transformation;
- making pricing, voucher, charge, and invoice flows use the item payer; and
- reconciling every item and blocking payer changes after a financial event.

For the October demo, the recommended path is to rebuild the V3 demo database from the legacy dump with the same versioned schema and full ETL correction proposed for production. If a rebuild is not possible, the included SQL bridge can update the current V3 only from a complete legacy-derived all-service export; a PostgreSQL-only default or a demo-UUID-only update cannot reconstruct the discarded historical choices and is not accepted as closure evidence.

**Decision requested:** accept F07 as a significant V3 finding, approve the per-item payer model and fail-closed ETL approach, and keep the finding open until the source-domain mapping, downstream billing changes, and reconciliation evidence pass review.

