# F07-specific implementation: V204 target, not a deployed certificate

### Database / Drizzle
`v3-demo-f07.schema.ts` extends archival V0.7 partial schema with `orders.order_items.billedToContactId` and `billedPartyOrigin`, plus `crm.contacts` ID/UUID mapping. Read F07 migration source; do **not** use Drizzle migrations or `drizzle-kit push` from this fragment. Only a DB owner should apply V204 after verifying the exact schema version.

### API / Zod
F07-aware `newcp-demo-f07.openapi.yaml` adds per-item `billedToContactUuid` to create/patch/read, read-only `billedPartyOrigin`, optional calculated `canEditBilledParty`, and proposed authorized `GET /api/v1/orders/{orderUuid}/eligible-billed-parties`. Request body must never set provenance or internal contact BIGINT ID. Backend authorization, eligibility and financial lock are mandatory independently of frontend validation. All F07 endpoints remain draft until backend/FE contract review.

### Business logic
- Resolve UUID to contact under trusted tenant RLS and order context. Legitimate eligible parties are the order's Doctor/default and optionally the associated Scanning Center; label choices according to order actor roles.
- On CREATE: if omitted, DB V204 trigger captures the order default ONCE. If explicit, DB derives `user_selected`; no client provenance. If changing an existing payer, write the chosen ID and `user_selected` in one guarded transaction; preserve immutable history. Allow two same-type items, different payer selections.
- On POST/financial operation: use `orders.order_items.billed_to_contact_id` for pricing/vouchers/charges/invoice grouping. Never substitute order contact after item creation. Keep billability (`is_billable`) conceptually separate from billed recipient.
- Locks: payer changes denied after ANY charge/invoice association or per DB guard. Billing reversal/rebill workflow requires separate authorization and design, never direct override.
- Existing V3 with pre-F07 rows: unresolved payer is not proof of usable migrated data; failed stage-90 blocks finance and production.

### Tests
Synthetic JSON fixtures are fake; run Python static checks. Real app-role SQL preflight is read-only, tenant-scoped, and may see only a subset under RLS. Only authoritative ETL stage-90 can certify **all** migrated rows.
