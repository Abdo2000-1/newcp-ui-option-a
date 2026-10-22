-- F07 READ-ONLY APPLICATION-SCOPE PRECHECK
-- Execute only in an authorized isolated V3 environment using a tenant-scoped app role.
-- Tenant context MUST be configured server-side by the approved application connection setup.
-- This reports only rows visible through this role's RLS; it is NOT a substitute for ETL-owner stage-90 ALL-TENANT reconciliation.
BEGIN TRANSACTION READ ONLY;
SELECT current_database() AS database_name, current_user AS database_user,
       current_setting('app.tenant_id', true) AS tenant_setting,
       core.fn_current_tenant() AS effective_tenant,
       row_security_active('orders.order_items'::regclass) AS order_item_rls_active;
-- Expected after V204 + stage90 on rebuilt, authoritative V3: two columns exist; billed_to_contact_id is NOT NULL.
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='orders' AND table_name='order_items'
   AND column_name IN ('billed_to_contact_id','billed_party_origin')
 ORDER BY column_name;
-- Validate V204 guard objects exist; counts >0 are not automatically proof of a correctly applied migration.
SELECT tgname, tgenabled
  FROM pg_trigger
 WHERE tgrelid='orders.order_items'::regclass
   AND NOT tgisinternal
   AND tgname IN ('trg_order_items__billed_party_validate','trg_order_items__financial_lock','trg_order_items__direct_invoice_payer')
 ORDER BY tgname;
-- Tenant-visible evidence. Non-zero invalid counts BLOCK finance tests and signoff.
SELECT count(*) AS visible_service_instances,
       count(*) FILTER (WHERE billed_to_contact_id IS NULL OR billed_party_origin='unresolved_legacy') AS unresolved_items,
       count(*) FILTER (WHERE billed_party_origin='legacy_explicit' AND NOT (metadata ? 'billed_party_migration')) AS explicit_without_metadata
  FROM orders.order_items;
SELECT count(*) AS payer_outside_tenant_or_order_context
  FROM orders.order_items oi JOIN orders.orders o ON o.id=oi.order_id
  LEFT JOIN crm.contacts c ON c.id=oi.billed_to_contact_id
 WHERE oi.billed_to_contact_id IS NOT NULL
   AND (c.id IS NULL OR c.tenant_id IS DISTINCT FROM oi.tenant_id
        OR oi.tenant_id IS DISTINCT FROM o.tenant_id
        OR (oi.billed_to_contact_id IS DISTINCT FROM o.contact_id
            AND oi.billed_to_contact_id IS DISTINCT FROM o.scan_center_contact_id));
SELECT count(*) AS mismatched_item_charges
  FROM billing.charges ch JOIN orders.order_items oi ON oi.id=ch.order_item_id
 WHERE ch.contact_id IS DISTINCT FROM oi.billed_to_contact_id;
SELECT count(*) AS mismatched_invoice_lines
  FROM billing.invoice_lines il
  JOIN orders.order_items oi ON oi.id=il.order_item_id
  JOIN billing.invoices inv ON inv.id=il.invoice_id
 WHERE inv.contact_id IS DISTINCT FROM oi.billed_to_contact_id;
ROLLBACK;
-- STOP: a read-only PASS here is not stage-90 reconciliation or a negative-mutation test.
