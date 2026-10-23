-- =============================================================================
-- V204  F07 — authoritative billed party per service instance
--
-- This migration is safe to apply to the current pre-review V3: existing rows
-- are marked unresolved and remain nullable until the legacy-aware backfill or
-- a complete ETL rebuild resolves them. New rows always receive a saved payer.
-- Stage 90 makes billed_to_contact_id NOT NULL only after reconciliation passes.
-- =============================================================================

DO $preflight$
BEGIN
    IF to_regclass('orders.order_items') IS NULL
       OR to_regclass('orders.orders') IS NULL
       OR to_regclass('crm.contacts') IS NULL
       OR to_regclass('billing.charges') IS NULL
       OR to_regclass('billing.invoices') IS NULL
       OR to_regclass('billing.invoice_lines') IS NULL THEN
        RAISE EXCEPTION 'V204 requires the V3 orders, CRM and billing tables';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'orders'
          AND table_name = 'order_items'
          AND column_name IN ('billed_to_contact_id', 'billed_party_origin')
    ) THEN
        RAISE EXCEPTION
            'V204 stopped: a billed-party implementation already exists; compare it with F07 before proceeding';
    END IF;
END
$preflight$;

ALTER TABLE orders.order_items
    ADD COLUMN billed_to_contact_id bigint,
    ADD COLUMN billed_party_origin varchar(30) NOT NULL DEFAULT 'unresolved_legacy',
    ADD CONSTRAINT ck_order_items__billed_party_origin
        CHECK (billed_party_origin IN (
            'unresolved_legacy', 'legacy_explicit', 'order_default',
            'manual_resolution', 'user_selected'
        )),
    ADD CONSTRAINT ck_order_items__billed_party_resolution
        CHECK (
            (billed_party_origin = 'unresolved_legacy' AND billed_to_contact_id IS NULL)
            OR
            (billed_party_origin <> 'unresolved_legacy' AND billed_to_contact_id IS NOT NULL)
        ),
    ADD CONSTRAINT fk_order_items__billed_to_contact_id
        FOREIGN KEY (billed_to_contact_id)
        REFERENCES crm.contacts (id)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION;

COMMENT ON COLUMN orders.order_items.billed_to_contact_id IS
    'Authoritative intended payer for this service instance before and after billing (crm.contacts). It is saved per item; the order client is a creation-time default only. [FINANCIAL]';
COMMENT ON COLUMN orders.order_items.billed_party_origin IS
    'How billed_to_contact_id was established: legacy_explicit, order_default, manual_resolution or user_selected. unresolved_legacy exists only during the controlled V204 backfill window. [AUDIT]';
COMMENT ON CONSTRAINT ck_order_items__billed_party_origin ON orders.order_items IS
    'Only documented billed-party provenance states are stored.';
COMMENT ON CONSTRAINT ck_order_items__billed_party_resolution ON orders.order_items IS
    'An unresolved legacy row has no payer; every resolved row has one. Stage 90 permits no unresolved row in an authoritative database.';
COMMENT ON CONSTRAINT fk_order_items__billed_to_contact_id ON orders.order_items IS
    'A service payer is a CRM contact and cannot be deleted while the service retains that financial instruction.';

CREATE INDEX ix_order_items__tenant_id__billed_to_contact_id
    ON orders.order_items (tenant_id, billed_to_contact_id)
    WHERE billed_to_contact_id IS NOT NULL;
COMMENT ON INDEX orders.ix_order_items__tenant_id__billed_to_contact_id IS
    'Find service lines by intended payer and cover the billed_to_contact_id foreign key.';


-- ---------------------------------------------------------------------------
-- Default once on INSERT; validate tenant and the Doctor/Scanning-Center
-- context whenever the payer itself is assigned or the item changes order.
-- Header changes do not rewrite a saved item payer.
-- ---------------------------------------------------------------------------
CREATE FUNCTION orders.fn_validate_order_item_billed_party()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_order_tenant_id         bigint;
    v_order_contact_id        bigint;
    v_scan_center_contact_id  bigint;
    v_payer_tenant_id         bigint;
BEGIN
    SELECT o.tenant_id, o.contact_id, o.scan_center_contact_id
      INTO v_order_tenant_id, v_order_contact_id, v_scan_center_contact_id
      FROM orders.orders o
     WHERE o.id = NEW.order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item references missing order %', NEW.order_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF NEW.tenant_id IS DISTINCT FROM v_order_tenant_id THEN
        RAISE EXCEPTION 'Order item tenant % differs from order % tenant %',
            NEW.tenant_id, NEW.order_id, v_order_tenant_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF TG_OP = 'INSERT' AND NEW.billed_to_contact_id IS NULL THEN
        NEW.billed_to_contact_id := v_order_contact_id;
        NEW.billed_party_origin := 'order_default';
    ELSIF NEW.billed_to_contact_id IS NULL THEN
        RAISE EXCEPTION 'A service billed party cannot be cleared'
            USING ERRCODE = 'not_null_violation';
    ELSIF TG_OP = 'INSERT' AND NEW.billed_party_origin = 'unresolved_legacy' THEN
        -- API callers that explicitly set a payer but omit provenance selected
        -- it themselves. The ETL always sends legacy_explicit/order_default.
        NEW.billed_party_origin := 'user_selected';
    ELSIF NEW.billed_party_origin = 'unresolved_legacy' THEN
        RAISE EXCEPTION 'A resolved service payer requires a resolved origin'
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT c.tenant_id INTO v_payer_tenant_id
      FROM crm.contacts c
     WHERE c.id = NEW.billed_to_contact_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service billed contact % does not exist', NEW.billed_to_contact_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF v_payer_tenant_id IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Service billed contact % belongs to tenant %, not %',
            NEW.billed_to_contact_id, v_payer_tenant_id, NEW.tenant_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.billed_to_contact_id IS DISTINCT FROM v_order_contact_id
       AND NEW.billed_to_contact_id IS DISTINCT FROM v_scan_center_contact_id THEN
        RAISE EXCEPTION
            'Service billed contact % is neither order Doctor/default % nor Scanning Center % for order %',
            NEW.billed_to_contact_id, v_order_contact_id,
            v_scan_center_contact_id, NEW.order_id
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.billed_party_origin = 'order_default'
       AND NEW.billed_to_contact_id IS DISTINCT FROM v_order_contact_id THEN
        RAISE EXCEPTION 'order_default origin must use order contact %', v_order_contact_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END
$function$;

COMMENT ON FUNCTION orders.fn_validate_order_item_billed_party() IS
    'F07: defaults a new item once from its order, then validates the saved service-level payer against tenant and Doctor/Scanning-Center context.';
REVOKE ALL ON FUNCTION orders.fn_validate_order_item_billed_party() FROM PUBLIC;

CREATE TRIGGER trg_order_items__billed_party_validate
    BEFORE INSERT OR UPDATE OF order_id, tenant_id, billed_to_contact_id, billed_party_origin
    ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.fn_validate_order_item_billed_party();
COMMENT ON TRIGGER trg_order_items__billed_party_validate ON orders.order_items IS
    'F07: supplies the creation default and validates every explicit item-level payer assignment.';


-- ---------------------------------------------------------------------------
-- Extend the existing financial lock: payer and provenance are money-driving
-- fields, and an invoice line is also a lock even if a legacy flag is wrong.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION orders.fn_reject_financial_edit() RETURNS trigger
    LANGUAGE plpgsql
AS $function$
DECLARE
    v_locked boolean;
BEGIN
    IF core.fn_bypass_allowed('app.bypass_financial_lock') THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    v_locked := OLD.is_invoiced
        OR OLD.invoice_id IS NOT NULL
        OR EXISTS (SELECT 1 FROM billing.charges c WHERE c.order_item_id = OLD.id)
        OR EXISTS (SELECT 1 FROM billing.invoice_lines il WHERE il.order_item_id = OLD.id);
    IF NOT v_locked THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    IF TG_OP = 'DELETE' OR (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Order item % is invoiced or charged and cannot be deleted', OLD.id
            USING ERRCODE = 'restrict_violation',
                  HINT = 'Record a credit charge instead.';
    END IF;
    IF NEW.unit_price IS DISTINCT FROM OLD.unit_price
       OR NEW.quantity IS DISTINCT FROM OLD.quantity
       OR NEW.currency_code IS DISTINCT FROM OLD.currency_code
       OR NEW.is_billable IS DISTINCT FROM OLD.is_billable
       OR NEW.sellable_item_id IS DISTINCT FROM OLD.sellable_item_id
       OR NEW.zero_charge_reason_id IS DISTINCT FROM OLD.zero_charge_reason_id
       OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
       OR NEW.voucher_amount IS DISTINCT FROM OLD.voucher_amount
       OR NEW.billed_to_contact_id IS DISTINCT FROM OLD.billed_to_contact_id
       OR NEW.billed_party_origin IS DISTINCT FROM OLD.billed_party_origin THEN
        RAISE EXCEPTION
            'Order item % is financially locked; payer, price, quantity, currency, discount, voucher, billability and item sold cannot change',
            OLD.id
            USING ERRCODE = 'restrict_violation',
                  HINT = 'Use an authorized reversal/rebilling flow instead of rewriting financial history.';
    END IF;
    RETURN NEW;
END
$function$;

COMMENT ON FUNCTION orders.fn_reject_financial_edit() IS
    'BEFORE UPDATE/DELETE on orders.order_items. Once a charge, invoice link or invoice line exists, freezes all money-driving fields including the F07 service-level payer and provenance.';
REVOKE ALL ON FUNCTION orders.fn_reject_financial_edit() FROM PUBLIC;


-- ---------------------------------------------------------------------------
-- Financial-event consistency. Application code must choose pricing,
-- vouchers and invoice groups by oi.billed_to_contact_id; these guards make a
-- wrong recipient fail at the database boundary instead of becoming history.
-- ---------------------------------------------------------------------------
CREATE FUNCTION billing.fn_validate_charge_item_payer()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_item_payer bigint;
    v_item_tenant bigint;
    v_item_order bigint;
    v_invoice_contact bigint;
BEGIN
    IF NEW.order_item_id IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT oi.billed_to_contact_id, oi.tenant_id, oi.order_id
      INTO v_item_payer, v_item_tenant, v_item_order
      FROM orders.order_items oi
     WHERE oi.id = NEW.order_item_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Charge references missing order item %', NEW.order_item_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF v_item_payer IS NULL THEN
        RAISE EXCEPTION 'Order item % has no resolved billed party', NEW.order_item_id
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.contact_id IS DISTINCT FROM v_item_payer THEN
        RAISE EXCEPTION 'Charge contact % differs from order item % payer %',
            NEW.contact_id, NEW.order_item_id, v_item_payer
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.tenant_id IS DISTINCT FROM v_item_tenant THEN
        RAISE EXCEPTION 'Charge tenant differs from order item tenant'
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.order_id IS NOT NULL AND NEW.order_id IS DISTINCT FROM v_item_order THEN
        RAISE EXCEPTION 'Charge order % differs from order item % order %',
            NEW.order_id, NEW.order_item_id, v_item_order
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.invoice_id IS NOT NULL THEN
        SELECT i.contact_id INTO v_invoice_contact
          FROM billing.invoices i WHERE i.id = NEW.invoice_id;
        IF v_invoice_contact IS DISTINCT FROM v_item_payer THEN
            RAISE EXCEPTION 'Charge invoice recipient differs from order-item payer'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END
$function$;

COMMENT ON FUNCTION billing.fn_validate_charge_item_payer() IS
    'F07: a charge tied to an order item must use that item''s persisted billed party, tenant and order.';
REVOKE ALL ON FUNCTION billing.fn_validate_charge_item_payer() FROM PUBLIC;

CREATE TRIGGER trg_charges__item_payer
    BEFORE INSERT ON billing.charges
    FOR EACH ROW EXECUTE FUNCTION billing.fn_validate_charge_item_payer();
COMMENT ON TRIGGER trg_charges__item_payer ON billing.charges IS
    'F07: rejects a charge addressed to anyone other than the service-level payer.';

CREATE FUNCTION billing.fn_validate_invoice_line_item_payer()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_item_payer bigint;
    v_item_tenant bigint;
    v_item_order bigint;
    v_invoice_contact bigint;
    v_invoice_tenant bigint;
BEGIN
    IF NEW.order_item_id IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT oi.billed_to_contact_id, oi.tenant_id, oi.order_id
      INTO v_item_payer, v_item_tenant, v_item_order
      FROM orders.order_items oi
     WHERE oi.id = NEW.order_item_id;
    SELECT i.contact_id, i.tenant_id
      INTO v_invoice_contact, v_invoice_tenant
      FROM billing.invoices i
     WHERE i.id = NEW.invoice_id;
    IF v_item_payer IS NULL THEN
        RAISE EXCEPTION 'Order item % has no resolved billed party', NEW.order_item_id
            USING ERRCODE = 'check_violation';
    END IF;
    IF v_invoice_contact IS DISTINCT FROM v_item_payer THEN
        RAISE EXCEPTION 'Invoice recipient % differs from order item % payer %',
            v_invoice_contact, NEW.order_item_id, v_item_payer
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.tenant_id IS DISTINCT FROM v_item_tenant
       OR NEW.tenant_id IS DISTINCT FROM v_invoice_tenant THEN
        RAISE EXCEPTION 'Invoice line, invoice and item must belong to one tenant'
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.order_id IS NOT NULL AND NEW.order_id IS DISTINCT FROM v_item_order THEN
        RAISE EXCEPTION 'Invoice-line order differs from its order item'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END
$function$;

COMMENT ON FUNCTION billing.fn_validate_invoice_line_item_payer() IS
    'F07: every invoice line tied to a service must belong to an invoice addressed to that service''s payer.';
REVOKE ALL ON FUNCTION billing.fn_validate_invoice_line_item_payer() FROM PUBLIC;

CREATE TRIGGER trg_invoice_lines__item_payer
    BEFORE INSERT OR UPDATE OF invoice_id, order_id, order_item_id, tenant_id
    ON billing.invoice_lines
    FOR EACH ROW EXECUTE FUNCTION billing.fn_validate_invoice_line_item_payer();
COMMENT ON TRIGGER trg_invoice_lines__item_payer ON billing.invoice_lines IS
    'F07: prevents mixed-payer service items from being placed on one recipient''s invoice.';

CREATE FUNCTION billing.fn_validate_invoice_recipient()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.contact_id IS DISTINCT FROM OLD.contact_id
       AND (
            EXISTS (
                SELECT 1
                FROM billing.invoice_lines il
                JOIN orders.order_items oi ON oi.id = il.order_item_id
                WHERE il.invoice_id = OLD.id
                  AND oi.billed_to_contact_id IS DISTINCT FROM NEW.contact_id
            )
            OR EXISTS (
                SELECT 1
                FROM billing.charges ch
                JOIN orders.order_items oi ON oi.id = ch.order_item_id
                WHERE ch.invoice_id = OLD.id
                  AND oi.billed_to_contact_id IS DISTINCT FROM NEW.contact_id
            )
            OR EXISTS (
                SELECT 1
                FROM orders.order_items oi
                WHERE oi.invoice_id = OLD.id
                  AND oi.billed_to_contact_id IS DISTINCT FROM NEW.contact_id
            )
       ) THEN
        RAISE EXCEPTION 'Invoice % recipient does not match all service-line payers', OLD.id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END
$function$;

COMMENT ON FUNCTION billing.fn_validate_invoice_recipient() IS
    'F07: changing a draft invoice recipient is allowed only when every linked service item has that payer.';
REVOKE ALL ON FUNCTION billing.fn_validate_invoice_recipient() FROM PUBLIC;

CREATE TRIGGER trg_invoices__service_payer
    BEFORE UPDATE OF contact_id ON billing.invoices
    FOR EACH ROW EXECUTE FUNCTION billing.fn_validate_invoice_recipient();
COMMENT ON TRIGGER trg_invoices__service_payer ON billing.invoices IS
    'F07: prevents changing an invoice recipient away from its service-item payers.';

CREATE FUNCTION orders.fn_validate_item_direct_invoice_payer()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_invoice_contact bigint;
BEGIN
    IF NEW.invoice_id IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT i.contact_id INTO v_invoice_contact
      FROM billing.invoices i WHERE i.id = NEW.invoice_id;
    IF v_invoice_contact IS DISTINCT FROM NEW.billed_to_contact_id THEN
        RAISE EXCEPTION 'Order item % payer differs from direct invoice recipient', NEW.id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END
$function$;

COMMENT ON FUNCTION orders.fn_validate_item_direct_invoice_payer() IS
    'F07: orders.order_items.invoice_id, when populated, must point to an invoice for the item-level payer.';
REVOKE ALL ON FUNCTION orders.fn_validate_item_direct_invoice_payer() FROM PUBLIC;

CREATE TRIGGER trg_order_items__direct_invoice_payer
    BEFORE INSERT OR UPDATE OF invoice_id, billed_to_contact_id
    ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.fn_validate_item_direct_invoice_payer();
COMMENT ON TRIGGER trg_order_items__direct_invoice_payer ON orders.order_items IS
    'F07: keeps the optional direct invoice link consistent with the service-level payer.';

