/*
  F07 bridge for an already-built pre-review V3 database.

  Preferred October-demo path: rebuild the demo database from the same MySQL
  dump with V204 + the corrected stage-30 ETL. Use this bridge only when a
  rebuild window is unavailable.

  Before running this file:
    1. Apply V204__service_level_billed_party.sql.
    2. Use the approved billed-party policy against the exact MySQL dump to
       export ONE ROW FOR EVERY migrated orders.order_items row (all service
       families, not only Models/Conversion) with these columns:

         legacy_source, legacy_item_id, legacy_key, legacy_order_id,
         payer_legacy_account_id, payer_role, source_column,
         source_raw_value, resolution_origin, policy_version

       For Doctor/Scanning Center it must be the resolved UserAcounts.uID
       (Orders.DocID or Orders.ScanID), not the selector token. It may be NULL
       only for order_default, in which case the saved V3 order contact is used
       (including the existing placeholder-contact rule). resolution_origin is
       legacy_explicit or order_default.
    3. Load that export into the TEMP table below in this same session. Replace
       the commented INSERT/COPY placeholder; do not hand-enter only demo rows.

  The transaction fails on a missing/duplicate target, missing contact,
  financially locked row, cross-tenant payer, invalid order context, or any
  residual unresolved item. It never infers an ambiguous payer from V3 alone.
*/

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '30min';

SELECT pg_advisory_xact_lock(hashtext('newcp.f07.current-v3-full-backfill'));

CREATE TEMP TABLE f07_billed_party_import (
    legacy_source           varchar(64) NOT NULL,
    legacy_item_id          bigint NOT NULL,
    legacy_key              varchar(200),
    legacy_order_id         bigint NOT NULL,
    payer_legacy_account_id bigint,
    payer_role              varchar(30) NOT NULL
        CHECK (payer_role IN ('doctor', 'scanning_center', 'order_default')),
    source_column           varchar(64),
    source_raw_value        text,
    resolution_origin       varchar(30) NOT NULL
        CHECK (resolution_origin IN ('legacy_explicit', 'order_default')),
    policy_version          varchar(120) NOT NULL,
    CHECK (payer_role = 'order_default' OR payer_legacy_account_id IS NOT NULL)
) ON COMMIT DROP;

CREATE UNIQUE INDEX uq_f07_billed_party_import__identity
    ON f07_billed_party_import
       (legacy_source, legacy_item_id, legacy_order_id, COALESCE(legacy_key, ''));

/* Load the complete reviewed export here. Example client-side psql command:

   \copy f07_billed_party_import FROM '/approved/f07_all_services.csv' CSV HEADER

   Do not continue with an empty table or a partial demo-only file.
*/

DO $input_gate$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM f07_billed_party_import) THEN
        RAISE EXCEPTION
            'F07 backfill stopped: load the complete all-service legacy export into f07_billed_party_import';
    END IF;
    IF (SELECT count(DISTINCT policy_version) FROM f07_billed_party_import) <> 1 THEN
        RAISE EXCEPTION 'F07 backfill stopped: import contains more than one policy version';
    END IF;
END
$input_gate$;

CREATE TEMP TABLE f07_resolved AS
SELECT
    s.*,
    oi.id AS order_item_id,
    oi.uuid AS order_item_uuid,
    oi.tenant_id,
    oi.is_invoiced,
    oi.invoice_id,
    CASE
        WHEN s.payer_role = 'order_default' THEN o.contact_id
        ELSE c.id
    END AS billed_to_contact_id,
    o.contact_id AS order_contact_id,
    o.scan_center_contact_id
FROM f07_billed_party_import s
LEFT JOIN orders.orders o
  ON o.legacy_source = 'Orders'
 AND o.legacy_id = s.legacy_order_id
LEFT JOIN orders.order_items oi
  ON oi.order_id = o.id
 AND oi.legacy_source = s.legacy_source
 AND oi.legacy_id = s.legacy_item_id
 AND COALESCE(oi.legacy_key, '') = COALESCE(s.legacy_key, '')
LEFT JOIN crm.contacts c
  ON c.tenant_id = oi.tenant_id
 AND c.legacy_source = 'UserAcounts'
 AND c.legacy_id = s.payer_legacy_account_id;

DO $validate$
DECLARE
    v_count bigint;
BEGIN
    SELECT count(*) INTO v_count FROM f07_resolved WHERE order_item_id IS NULL;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'F07 backfill stopped: % import rows match no order item', v_count;
    END IF;

    SELECT count(*) INTO v_count FROM f07_resolved WHERE billed_to_contact_id IS NULL;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'F07 backfill stopped: % payer account ids match no in-tenant contact', v_count;
    END IF;

    SELECT count(*) INTO v_count
    FROM f07_resolved
    WHERE billed_to_contact_id IS DISTINCT FROM order_contact_id
      AND billed_to_contact_id IS DISTINCT FROM scan_center_contact_id;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'F07 backfill stopped: % resolved payers are outside the order Doctor/Scanning-Center context', v_count;
    END IF;

    SELECT count(*) INTO v_count
    FROM f07_resolved r
    WHERE r.is_invoiced OR r.invoice_id IS NOT NULL
       OR EXISTS (SELECT 1 FROM billing.charges ch WHERE ch.order_item_id = r.order_item_id)
       OR EXISTS (SELECT 1 FROM billing.invoice_lines il WHERE il.order_item_id = r.order_item_id);
    IF v_count <> 0 THEN
        RAISE EXCEPTION
            'F07 backfill stopped: % target items already have financial history; rebuild from source or use an approved reversal/rebilling plan',
            v_count;
    END IF;

    SELECT count(*) INTO v_count
    FROM (
        SELECT order_item_id FROM f07_resolved
        GROUP BY order_item_id HAVING count(*) <> 1
    ) duplicate_targets;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'F07 backfill stopped: % target items are represented more than once', v_count;
    END IF;
END
$validate$;

UPDATE orders.order_items oi
   SET billed_to_contact_id = r.billed_to_contact_id,
       billed_party_origin = r.resolution_origin,
       metadata = jsonb_set(
           oi.metadata,
           '{billed_party_migration}',
           jsonb_build_object(
               'policy_version', r.policy_version,
               'source_table', r.legacy_source,
               'source_column', r.source_column,
               'source_raw_value', r.source_raw_value,
               'legacy_id', r.legacy_item_id,
               'legacy_key', r.legacy_key,
               'resolution', r.resolution_origin,
               'resolved_role', r.payer_role
           ),
           true
       )
  FROM f07_resolved r
 WHERE oi.id = r.order_item_id;

DO $completion_gate$
DECLARE
    v_unresolved bigint;
BEGIN
    SELECT count(*) INTO v_unresolved
    FROM orders.order_items
    WHERE billed_to_contact_id IS NULL
       OR billed_party_origin = 'unresolved_legacy';
    IF v_unresolved <> 0 THEN
        RAISE EXCEPTION
            'F07 backfill incomplete: % order items remain unresolved. No partial/demo-only backfill is accepted.',
            v_unresolved;
    END IF;
END
$completion_gate$;

ALTER TABLE orders.order_items
    ALTER COLUMN billed_to_contact_id SET NOT NULL;

COMMIT;

-- Evidence query: every count must be zero.
SELECT 'unresolved_items' AS check_name, count(*) AS failures
FROM orders.order_items
WHERE billed_to_contact_id IS NULL OR billed_party_origin = 'unresolved_legacy'
UNION ALL
SELECT 'cross_tenant_payers', count(*)
FROM orders.order_items oi
JOIN crm.contacts c ON c.id = oi.billed_to_contact_id
WHERE c.tenant_id IS DISTINCT FROM oi.tenant_id
UNION ALL
SELECT 'charge_payer_mismatch', count(*)
FROM billing.charges ch
JOIN orders.order_items oi ON oi.id = ch.order_item_id
WHERE ch.contact_id IS DISTINCT FROM oi.billed_to_contact_id
UNION ALL
SELECT 'invoice_payer_mismatch', count(*)
FROM billing.invoice_lines il
JOIN billing.invoices i ON i.id = il.invoice_id
JOIN orders.order_items oi ON oi.id = il.order_item_id
WHERE i.contact_id IS DISTINCT FROM oi.billed_to_contact_id;

