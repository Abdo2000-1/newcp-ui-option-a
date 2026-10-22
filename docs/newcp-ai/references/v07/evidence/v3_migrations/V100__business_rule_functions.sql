-- =============================================================================
-- V100  Business-rule functions
-- =============================================================================
-- Rules live in the database because four applications write the same data
-- (PHP CP, Node ServiceAPI, two Java tiers): a rule enforced in one of them is
-- not enforced. Trigger wiring is V110. Functions are ported from v2 (V027,
-- V034, V043) with the v3 changes noted per function.
--
-- Bypass switches (app.bypass_order_lock, app.bypass_financial_lock,
-- app.skip_audit) exist for the migration and for supervised corrections. In v3
-- they take effect ONLY for the migrator role or a superuser — an application
-- session that sets them gets no bypass (core.fn_bypass_allowed).
-- =============================================================================

-- ----------------------------------------------------------------- 0. helpers
-- The acting role is the session's SET ROLE (or the login when none), not
-- current_user: inside a SECURITY DEFINER caller such as core.fn_audit_row,
-- current_user is threeddx3_owner, which would hide the migrator (and the
-- skip_audit switch never worked). SET ROLE is not changed by a definer call.
CREATE FUNCTION core.fn_bypass_allowed(p_setting text) RETURNS boolean
    LANGUAGE sql STABLE
AS $$
    WITH acting AS (
        SELECT (CASE WHEN current_setting('role') = 'none' THEN session_user::text
                     ELSE current_setting('role') END)::name AS role_name)
    SELECT current_setting(p_setting, true) = 'on'
       AND (pg_has_role(a.role_name, 'threeddx3_migrator', 'MEMBER')
            OR COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = a.role_name), false))
    FROM acting a;
$$;
COMMENT ON FUNCTION core.fn_bypass_allowed(text) IS 'True when the named bypass setting (e.g. app.bypass_order_lock) is ''on'' AND the session acts as the migrator role (or a superuser): the SET ROLE of the session, or its login role when none is set — evaluated the same inside SECURITY DEFINER functions. Lets the ETL and supervised corrections skip a business guard, while an application session that sets the same flag gets no bypass.';

CREATE FUNCTION core.fn_next_sequence_value(p_tenant_id bigint, p_code text) RETURNS bigint
    LANGUAGE plpgsql
AS $$
DECLARE
    v bigint;
BEGIN
    INSERT INTO core.number_sequences (tenant_id, sequence_code, current_value)
    VALUES (p_tenant_id, p_code, 1)
    ON CONFLICT (tenant_id, sequence_code) DO UPDATE
        SET current_value = core.number_sequences.current_value + 1
    RETURNING current_value INTO v;
    RETURN v;
END;
$$;
COMMENT ON FUNCTION core.fn_next_sequence_value(bigint, text) IS 'Next value of a per-tenant business number series (order numbers, case codes), created at 1 on first use. Row-locked by the upsert, so concurrent callers never receive the same number; gaps are possible when a transaction rolls back.';

-- ------------------------------------------------- 1. business-hours arithmetic
CREATE FUNCTION core.fn_add_business_hours(p_calendar_id bigint, p_from timestamptz, p_hours numeric)
    RETURNS timestamptz
    LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_tz        text;
    v_remaining numeric := p_hours;
    v_cursor    timestamp;          -- local time in the calendar's zone
    v_day       date;
    v_win       record;
    v_start     timestamp;
    v_end       timestamp;
    v_available numeric;
    v_guard     int := 0;
BEGIN
    SELECT time_zone INTO v_tz FROM core.business_calendars WHERE id = p_calendar_id AND is_active;
    IF v_tz IS NULL THEN
        RETURN p_from + make_interval(secs => (p_hours * 3600)::double precision);   -- no calendar: wall clock
    END IF;
    v_cursor := p_from AT TIME ZONE v_tz;
    WHILE v_remaining > 0 AND v_guard < 3650 LOOP
        v_guard := v_guard + 1;
        v_day := v_cursor::date;
        IF EXISTS (SELECT 1 FROM core.calendar_exceptions e
                   WHERE e.calendar_id = p_calendar_id AND e.on_date = v_day AND NOT e.is_working) THEN
            v_cursor := (v_day + 1)::timestamp;
            CONTINUE;
        END IF;
        FOR v_win IN
            SELECT opens_at, closes_at FROM core.calendar_exceptions
            WHERE calendar_id = p_calendar_id AND on_date = v_day AND is_working
            UNION ALL
            SELECT opens_at, closes_at FROM core.business_hours
            WHERE calendar_id = p_calendar_id AND day_of_week = EXTRACT(dow FROM v_day)::smallint
              AND NOT EXISTS (SELECT 1 FROM core.calendar_exceptions e
                              WHERE e.calendar_id = p_calendar_id AND e.on_date = v_day AND e.is_working)
            ORDER BY 1
        LOOP
            v_start := GREATEST(v_cursor, v_day + v_win.opens_at);
            v_end   := v_day + v_win.closes_at;
            CONTINUE WHEN v_end <= v_start;
            v_available := EXTRACT(epoch FROM (v_end - v_start)) / 3600.0;
            IF v_available >= v_remaining THEN
                RETURN (v_start + make_interval(secs => (v_remaining * 3600)::double precision)) AT TIME ZONE v_tz;
            END IF;
            v_remaining := v_remaining - v_available;
            v_cursor := v_end;
        END LOOP;
        v_cursor := (v_day + 1)::timestamp;
    END LOOP;
    RETURN v_cursor AT TIME ZONE v_tz;
END;
$$;
COMMENT ON FUNCTION core.fn_add_business_hours(bigint, timestamptz, numeric) IS 'Due-date arithmetic in business time: walks the calendar forward from p_from, counting only opening hours and skipping holidays (core.calendar_exceptions), in the calendar''s own time zone. fn_add_business_hours(cal, now(), 8) = one business day later. An unknown or inactive calendar falls back to wall-clock hours. Calendars are per team (Q11); seeded hours are TO CONFIRM.';

-- ------------------------------------------------------ 2. workflow transitions
CREATE FUNCTION workflow.fn_validate_transition() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_transition_id bigint;
    v_last          timestamptz;
BEGIN
    IF NEW.current_state_id IS NOT DISTINCT FROM OLD.current_state_id THEN
        RETURN NEW;
    END IF;
    SELECT t.id INTO v_transition_id
    FROM workflow.workflow_transitions t
    WHERE t.definition_id = NEW.definition_id
      AND t.to_state_id = NEW.current_state_id
      AND (t.from_state_id IS NULL OR t.from_state_id = OLD.current_state_id)
    ORDER BY t.from_state_id NULLS LAST
    LIMIT 1;
    IF v_transition_id IS NULL AND NOT core.fn_bypass_allowed('app.bypass_workflow') THEN
        RAISE EXCEPTION 'Illegal workflow transition on instance % (definition %): state % -> % is not defined',
            NEW.id, NEW.definition_id, OLD.current_state_id, NEW.current_state_id
            USING ERRCODE = 'check_violation';
    END IF;
    SELECT max(h.occurred_at) INTO v_last FROM workflow.workflow_history h WHERE h.instance_id = NEW.id;
    INSERT INTO workflow.workflow_history (tenant_id, instance_id, from_state_id, to_state_id, transition_id,
                                           actor_kind, actor_user_id, actor_role_id, occurred_at, duration_seconds)
    VALUES (NEW.tenant_id, NEW.id, OLD.current_state_id, NEW.current_state_id, v_transition_id,
            CASE WHEN core.fn_current_user_id() IS NULL THEN 'system' ELSE 'user' END::core.actor_kind,
            core.fn_current_user_id(), core.fn_current_role_id(), now(),
            GREATEST(0, EXTRACT(epoch FROM (now() - COALESCE(v_last, NEW.started_at))))::bigint);
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION workflow.fn_validate_transition() IS 'BEFORE UPDATE on workflow.workflow_instances: rejects a state change that no workflow_transitions row allows for that definition (from the old state, or from any state when from_state_id is NULL), then writes the workflow_history row with the acting user and role and the time spent in the previous state — so history can never diverge from state. The migrator may set app.bypass_workflow to replay legacy histories that broke the rules.';

-- --------------------------------------------------- 3. voucher ledger -> balance
CREATE FUNCTION vouchers.fn_apply_transaction() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v         vouchers.vouchers%ROWTYPE;
    v_new     numeric;
    v_mag     numeric := abs(NEW.credit_delta);
    v_cases   integer := abs(COALESCE(NEW.case_delta, 0));
    v_order_contact bigint;
    v_live    boolean := NEW.legacy_key IS NULL AND NEW.legacy_id IS NULL;   -- created in threeddx3
BEGIN
    SELECT * INTO v FROM vouchers.vouchers WHERE id = NEW.voucher_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voucher % does not exist', NEW.voucher_id USING ERRCODE = 'foreign_key_violation';
    END IF;
    v_new := v.remaining_credit + NEW.credit_delta;
    IF v_new < 0 THEN
        RAISE EXCEPTION 'Voucher % has % remaining; cannot apply a delta of %', v.voucher_code, v.remaining_credit, NEW.credit_delta
            USING ERRCODE = 'check_violation';
    END IF;
    IF v_live AND NEW.txn_kind = 'redeem' THEN
        IF v.expires_on IS NOT NULL AND NEW.effective_at::date > v.expires_on THEN
            RAISE EXCEPTION 'Voucher % expired on % and cannot be redeemed on %', v.voucher_code, v.expires_on, NEW.effective_at::date
                USING ERRCODE = 'check_violation';
        END IF;
        IF v.status IN ('suspended', 'cancelled', 'expired') THEN
            RAISE EXCEPTION 'Voucher % is % and cannot be redeemed', v.voucher_code, v.status USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.order_id IS NOT NULL AND v.contact_id IS NOT NULL THEN
            SELECT contact_id INTO v_order_contact FROM orders.orders WHERE id = NEW.order_id;
            IF v_order_contact IS DISTINCT FROM v.contact_id THEN
                RAISE EXCEPTION 'Voucher % belongs to contact % but order % is for contact %', v.voucher_code, v.contact_id, NEW.order_id, v_order_contact
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;
    NEW.balance_after := v_new;
    -- Each movement kind moves exactly one balance column, so
    -- remaining = issued - consumed - expired - refunded always holds.
    UPDATE vouchers.vouchers SET
        issued_credit   = issued_credit   + CASE WHEN NEW.txn_kind = 'issue' OR (NEW.txn_kind = 'adjust' AND NEW.credit_delta > 0) THEN v_mag ELSE 0 END,
        consumed_credit = consumed_credit + CASE WHEN NEW.txn_kind = 'redeem' OR (NEW.txn_kind = 'adjust' AND NEW.credit_delta < 0) THEN v_mag
                                                 WHEN NEW.txn_kind = 'refund' THEN -v_mag ELSE 0 END,
        expired_credit  = expired_credit  + CASE WHEN NEW.txn_kind = 'expire' THEN v_mag WHEN NEW.txn_kind = 'reinstate' THEN -v_mag ELSE 0 END,
        refunded_credit = refunded_credit + CASE WHEN NEW.txn_kind = 'transfer' THEN v_mag ELSE 0 END,
        remaining_credit = v_new,
        issued_cases    = issued_cases    + CASE WHEN NEW.txn_kind = 'issue'  THEN v_cases ELSE 0 END,
        consumed_cases  = consumed_cases  + CASE WHEN NEW.txn_kind = 'redeem' THEN v_cases WHEN NEW.txn_kind = 'refund' THEN -v_cases ELSE 0 END,
        expired_cases   = expired_cases   + CASE WHEN NEW.txn_kind = 'expire' THEN v_cases WHEN NEW.txn_kind = 'reinstate' THEN -v_cases ELSE 0 END,
        status = CASE
            WHEN v_new = 0 AND (v.issued_credit > 0 OR NEW.txn_kind = 'issue') AND NEW.txn_kind <> 'expire' THEN 'exhausted'
            WHEN v.status IN ('created', 'active') AND NEW.txn_kind = 'redeem' THEN 'in_use'
            WHEN v.status = 'exhausted' AND v_new > 0 THEN 'in_use'
            ELSE v.status END,
        exhausted_at = CASE WHEN v_new = 0 THEN COALESCE(v.exhausted_at, NEW.effective_at) ELSE NULL END
    WHERE id = NEW.voucher_id;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION vouchers.fn_apply_transaction() IS 'BEFORE INSERT on vouchers.voucher_transactions — the only writer of voucher balances. Rejects any movement that would take the balance below zero; for movements created in threeddx3 (no legacy key) also rejects redeeming an expired, suspended or cancelled voucher, or one that belongs to a different client than the order. Sets balance_after and moves exactly one balance column per kind: issue/adjust(+) -> issued; redeem/adjust(-) -> consumed; refund -> consumed decreases (credit returned to the voucher, as legacy voucher_fill ''refund by: SYSTEM''); expire/reinstate -> expired; transfer -> refunded (credit leaving the voucher). Case counters follow issue/redeem/refund/expire.';

CREATE FUNCTION vouchers.fn_draw_down_order(p_contact_id bigint, p_order_id bigint, p_type_codes text[] DEFAULT NULL, p_on date DEFAULT CURRENT_DATE)
    RETURNS TABLE (voucher_id bigint, priority integer, remaining core.money_amount)
    LANGUAGE sql STABLE
AS $$
    SELECT v.id,
           CASE WHEN v.linked_order_id = p_order_id THEN 0
                WHEN vt.code IN ('prepaid_general', 'general') THEN 1
                WHEN v.issued_cases > v.consumed_cases THEN 2
                ELSE 3 END,
           v.remaining_credit
    FROM vouchers.vouchers v
    JOIN vouchers.voucher_types vt ON vt.id = v.voucher_type_id
    WHERE v.contact_id = p_contact_id
      AND v.status IN ('active', 'in_use')
      AND v.remaining_credit > 0
      AND (v.expires_on IS NULL OR v.expires_on >= p_on)
      AND (v.linked_order_id = p_order_id OR p_type_codes IS NULL OR vt.code = ANY (p_type_codes)
           OR vt.code IN ('prepaid_general', 'general'))
      AND (v.linked_order_id IS NULL OR v.linked_order_id = p_order_id)
    ORDER BY 2, v.issued_on, v.id;
$$;
COMMENT ON FUNCTION vouchers.fn_draw_down_order(bigint, bigint, text[], date) IS 'Candidate vouchers to pay an order line, in the order the business consumes them: a voucher linked to this order first, then general credit, then by-case vouchers, then oldest first. Excludes vouchers linked to a different order, expired, exhausted, suspended or cancelled ones. Engel priority (GFMR, then Engel, then General, then Normal — owner Q17 documentation) is applied by the caller through p_type_codes ordering.';

-- ------------------------------------------------------ 4. order and item totals
CREATE FUNCTION orders.fn_recalculate_item_total() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.fields_amount IS DISTINCT FROM OLD.fields_amount THEN
        NULL;   -- fields_amount pushed by fn_refresh_item_fields_amount: keep it
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.fields_amount := COALESCE((SELECT sum(charged_amount) FROM orders.order_item_field_values
                                       WHERE order_item_id = NEW.id), 0);
    END IF;
    NEW.line_total := (NEW.unit_price * NEW.quantity) + NEW.fields_amount - NEW.discount_amount - NEW.voucher_amount;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION orders.fn_recalculate_item_total() IS 'BEFORE INSERT/UPDATE on orders.order_items: line_total = unit_price × quantity + fields_amount − discount_amount − voucher_amount (the rule ck_order_items__total_consistent asserts). On update, fields_amount is re-summed from the item''s field values unless the update itself carries a new fields_amount (pushed by fn_refresh_item_fields_amount).';

CREATE FUNCTION orders.fn_refresh_item_fields_amount() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_item bigint := COALESCE(NEW.order_item_id, OLD.order_item_id);
BEGIN
    IF core.fn_bypass_allowed('app.bypass_totals') THEN
        RETURN NULL;   -- bulk load: stage 90 recomputes every total once
    END IF;
    UPDATE orders.order_items i
       SET fields_amount = COALESCE((SELECT sum(charged_amount) FROM orders.order_item_field_values f
                                     WHERE f.order_item_id = v_item), 0)
     WHERE i.id = v_item;
    IF TG_OP = 'UPDATE' AND NEW.order_item_id IS DISTINCT FROM OLD.order_item_id THEN
        UPDATE orders.order_items i
           SET fields_amount = COALESCE((SELECT sum(charged_amount) FROM orders.order_item_field_values f
                                         WHERE f.order_item_id = OLD.order_item_id), 0)
         WHERE i.id = OLD.order_item_id;
    END IF;
    RETURN NULL;
END;
$$;
COMMENT ON FUNCTION orders.fn_refresh_item_fields_amount() IS 'AFTER INSERT/UPDATE/DELETE on orders.order_item_field_values: re-sums the item''s field surcharges into order_items.fields_amount, which in turn recalculates line_total and the order totals. v2 recalculated only when the item itself changed, so surcharges loaded after their item (as the ETL does) never reached the total. The migrator may set app.bypass_totals during the bulk load; stage 90 then recomputes all totals in one pass.';

CREATE FUNCTION orders.fn_recalculate_order_total() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id bigint := COALESCE(NEW.order_id, OLD.order_id);
BEGIN
    IF core.fn_bypass_allowed('app.bypass_totals') THEN
        RETURN NULL;   -- bulk load: stage 90 recomputes every total once
    END IF;
    UPDATE orders.orders o SET
        subtotal_amount = COALESCE(agg.subtotal, 0),
        discount_amount = COALESCE(agg.discount, 0),
        voucher_amount  = COALESCE(agg.voucher, 0),
        total_amount    = COALESCE(agg.subtotal, 0) - COALESCE(agg.discount, 0) - COALESCE(agg.voucher, 0) + o.adjustment_amount
    FROM (SELECT sum(unit_price * quantity + fields_amount) AS subtotal,
                 sum(discount_amount) AS discount, sum(voucher_amount) AS voucher
          FROM orders.order_items WHERE order_id = v_order_id AND deleted_at IS NULL) agg
    WHERE o.id = v_order_id;
    IF TG_OP = 'UPDATE' AND NEW.order_id IS DISTINCT FROM OLD.order_id THEN
        PERFORM 1;   -- moving an item between orders is not supported; the FK and party rules prevent it
    END IF;
    RETURN NULL;
END;
$$;
COMMENT ON FUNCTION orders.fn_recalculate_order_total() IS 'AFTER INSERT/UPDATE/DELETE on orders.order_items: recomputes the order''s subtotal, discount, voucher and total from its live (not soft-deleted) items, keeping the order-level adjustment. total = subtotal − discount − voucher + adjustment, as ck_orders__total_consistent asserts. Skipped for the migrator when app.bypass_totals is on (bulk load; stage 90 recomputes all totals).';

-- ------------------------------------------------------------ 5. order locking
CREATE FUNCTION orders.fn_reject_when_locked() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_lock     record;
    v_order_id bigint;
BEGIN
    IF core.fn_bypass_allowed('app.bypass_order_lock') THEN
        RETURN NEW;
    END IF;
    -- Separate IF branches, never one CASE: plpgsql plans each statement lazily, so
    -- the branch for the other table is never resolved (v2 defect 13: NEW.order_id
    -- on orders.orders raised and made every order uneditable).
    IF TG_TABLE_NAME = 'orders' THEN
        v_order_id := NEW.id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;
    SELECT l.lock_source, l.lock_reason, l.locked_by_user_id INTO v_lock
    FROM orders.order_locks l
    WHERE l.order_id = v_order_id AND l.status = 'active'
      AND (l.expires_at IS NULL OR l.expires_at > now())
      AND (l.lock_source = 'system' OR l.locked_by_user_id IS DISTINCT FROM core.fn_current_user_id())
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'Order % is locked (% lock: %)', v_order_id, v_lock.lock_source, COALESCE(v_lock.lock_reason, 'no reason given')
            USING ERRCODE = 'lock_not_available';
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION orders.fn_reject_when_locked() IS 'BEFORE UPDATE on orders.orders and BEFORE INSERT/UPDATE on orders.order_items: rejects the change while another holder has an active, unexpired lock on the order. The user who holds a user lock may edit; system locks (charging, invoicing) block everyone. Legacy enforced this only in PHP, so background jobs could write to a locked order. The migrator may bypass with app.bypass_order_lock.';

-- ------------------------------------------------------- 6. financial immutability
CREATE FUNCTION orders.fn_reject_financial_edit() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_locked boolean;
BEGIN
    IF core.fn_bypass_allowed('app.bypass_financial_lock') THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    v_locked := OLD.is_invoiced OR EXISTS (SELECT 1 FROM billing.charges c WHERE c.order_item_id = OLD.id);
    IF NOT v_locked THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    IF TG_OP = 'DELETE' OR (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Order item % is invoiced or charged and cannot be deleted', OLD.id
            USING ERRCODE = 'restrict_violation', HINT = 'Record a credit charge instead.';
    END IF;
    IF NEW.unit_price IS DISTINCT FROM OLD.unit_price OR NEW.quantity IS DISTINCT FROM OLD.quantity
       OR NEW.currency_code IS DISTINCT FROM OLD.currency_code OR NEW.is_billable IS DISTINCT FROM OLD.is_billable
       OR NEW.sellable_item_id IS DISTINCT FROM OLD.sellable_item_id
       OR NEW.zero_charge_reason_id IS DISTINCT FROM OLD.zero_charge_reason_id
       OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
       OR NEW.voucher_amount IS DISTINCT FROM OLD.voucher_amount THEN
        RAISE EXCEPTION 'Order item % is invoiced or charged; price, quantity, currency, discount, voucher, billability and the item sold are frozen', OLD.id
            USING ERRCODE = 'restrict_violation', HINT = 'Raise an extra charge or a credit note instead of editing the line.';
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION orders.fn_reject_financial_edit() IS 'BEFORE UPDATE/DELETE on orders.order_items. Replaces the legacy prevent_update_invoiced_* trigger family: once an item is invoiced or has any billing.charges row (a charge row exists only once money was taken), its price, quantity, currency, discount, voucher amount, billability, item sold and zero-charge reason are frozen and it cannot be deleted or soft-deleted. Status, dates and assignments stay editable so production continues. Deliberate divergence from legacy: legacy silently reverted the edit; v3 raises.';

CREATE FUNCTION orders.fn_reject_party_edit_when_invoiced() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF core.fn_bypass_allowed('app.bypass_financial_lock') THEN
        RETURN NEW;
    END IF;
    IF (NEW.contact_id IS DISTINCT FROM OLD.contact_id
        OR NEW.scan_center_contact_id IS DISTINCT FROM OLD.scan_center_contact_id
        OR NEW.patient_id IS DISTINCT FROM OLD.patient_id)
       AND EXISTS (SELECT 1 FROM orders.order_items oi
                   WHERE oi.order_id = OLD.id
                     AND (oi.is_invoiced OR EXISTS (SELECT 1 FROM billing.charges c WHERE c.order_item_id = oi.id))) THEN
        RAISE EXCEPTION 'Order % has invoiced or charged items; the doctor, scanning centre and patient cannot be changed', OLD.id
            USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION orders.fn_reject_party_edit_when_invoiced() IS 'BEFORE UPDATE on orders.orders: once any item is invoiced or charged, the doctor (contact_id), scanning centre and patient of the order are frozen — the legacy rule behind "prevent sending charged orders to another billed account" (prevent_update_invoiced_orders_ctbb_credit).';

CREATE FUNCTION clinical.fn_reject_identity_edit_when_invoiced() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF core.fn_bypass_allowed('app.bypass_financial_lock') THEN
        RETURN NEW;
    END IF;
    IF (NEW.full_name IS DISTINCT FROM OLD.full_name OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth)
       AND EXISTS (SELECT 1 FROM orders.orders o JOIN orders.order_items oi ON oi.order_id = o.id
                   WHERE o.patient_id = OLD.patient_id AND oi.is_invoiced) THEN
        RAISE EXCEPTION 'Patient % appears on an invoiced order; name and date of birth are frozen', OLD.patient_id
            USING ERRCODE = 'restrict_violation', HINT = 'Issue a credit note and re-invoice if the identity was wrong.';
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION clinical.fn_reject_identity_edit_when_invoiced() IS 'BEFORE UPDATE on clinical.patient_identities: the patient name and date of birth printed on an issued invoice cannot be changed afterwards (they would silently rewrite a financial document). The migrator may bypass for approved rectifications (GDPR Art. 16) with app.bypass_financial_lock.';

-- ------------------------------------------------------------ 7. inventory ledger
CREATE FUNCTION inventory.fn_apply_movement() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_delta numeric := CASE NEW.movement_kind
                           WHEN 'receipt' THEN abs(NEW.quantity) WHEN 'return' THEN abs(NEW.quantity)
                           WHEN 'issue' THEN -abs(NEW.quantity) WHEN 'write_off' THEN -abs(NEW.quantity)
                           WHEN 'adjustment' THEN NEW.quantity ELSE 0 END;
BEGIN
    IF NEW.movement_kind = 'transfer' THEN
        INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand)
        VALUES (NEW.tenant_id, NEW.item_id, NEW.from_warehouse_id, -abs(NEW.quantity))
        ON CONFLICT (item_id, warehouse_id, location_id) DO UPDATE
            SET quantity_on_hand = inventory.stock_levels.quantity_on_hand + EXCLUDED.quantity_on_hand;
        INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand)
        VALUES (NEW.tenant_id, NEW.item_id, NEW.to_warehouse_id, abs(NEW.quantity))
        ON CONFLICT (item_id, warehouse_id, location_id) DO UPDATE
            SET quantity_on_hand = inventory.stock_levels.quantity_on_hand + EXCLUDED.quantity_on_hand;
    ELSIF v_delta <> 0 AND COALESCE(NEW.to_warehouse_id, NEW.from_warehouse_id) IS NOT NULL THEN
        INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand)
        VALUES (NEW.tenant_id, NEW.item_id, COALESCE(NEW.to_warehouse_id, NEW.from_warehouse_id), v_delta)
        ON CONFLICT (item_id, warehouse_id, location_id) DO UPDATE
            SET quantity_on_hand = inventory.stock_levels.quantity_on_hand + EXCLUDED.quantity_on_hand;
    END IF;
    RETURN NULL;
END;
$$;
COMMENT ON FUNCTION inventory.fn_apply_movement() IS 'AFTER INSERT on inventory.stock_movements (append-only): applies the movement to inventory.stock_levels — receipts and returns add, issues and write-offs subtract, adjustments carry their own sign, transfers move between warehouses. Stock may not go negative (ck_stock_levels__quantities_non_negative rejects the movement).';

-- ------------------------------------------------------------- 8. CRM roll-ups
CREATE FUNCTION crm.fn_touch_contact_order_dates() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF core.fn_bypass_allowed('app.bypass_totals') THEN
        RETURN NULL;   -- bulk load: stage 90 recomputes first/last order dates once
    END IF;
    UPDATE crm.contacts SET
        first_order_at = LEAST(COALESCE(first_order_at, NEW.created_at), NEW.created_at),
        last_order_at  = GREATEST(COALESCE(last_order_at, NEW.created_at), NEW.created_at)
    WHERE id = NEW.contact_id
      AND (first_order_at IS NULL OR last_order_at IS NULL OR NEW.created_at < first_order_at OR NEW.created_at > last_order_at);
    RETURN NULL;
END;
$$;
COMMENT ON FUNCTION crm.fn_touch_contact_order_dates() IS 'AFTER INSERT on orders.orders: keeps crm.contacts.first_order_at / last_order_at current, so "inactive clients" is a column read rather than an aggregate. Updates only when the new order moves either date. Skipped for the migrator when app.bypass_totals is on (stage 90 recomputes the dates in bulk).';

CREATE FUNCTION orders.fn_assign_order_number() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = 0 THEN
        NEW.order_number := core.fn_next_sequence_value(NEW.tenant_id, 'order_number');
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION orders.fn_assign_order_number() IS 'BEFORE INSERT on orders.orders: assigns the next per-tenant order number when none is given. Migrated orders keep their legacy Orders.ID as order_number; the sequence is moved past the legacy maximum by the ETL so new numbers never collide.';

-- ---------------------------------------------------------- 9. task due dates
CREATE FUNCTION workflow.fn_require_due_date_reason() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    -- checked before the due_at early return: the trigger also fires on an
    -- UPDATE OF original_due_at alone, which must not slip through
    IF OLD.original_due_at IS NOT NULL AND NEW.original_due_at IS DISTINCT FROM OLD.original_due_at THEN
        RAISE EXCEPTION 'Task %: original_due_at is fixed once set', OLD.id USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.due_at IS NOT DISTINCT FROM OLD.due_at THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM workflow.task_due_date_changes d
                   WHERE d.task_id = NEW.id AND d.new_due_at IS NOT DISTINCT FROM NEW.due_at AND d.changed_at = now())
       AND NOT core.fn_bypass_allowed('app.bypass_workflow') THEN
        RAISE EXCEPTION 'Task %: changing the due date needs a reason — insert workflow.task_due_date_changes in the same transaction', OLD.id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION workflow.fn_require_due_date_reason() IS 'BEFORE UPDATE OF due_at on workflow.tasks: a due date may change only when a workflow.task_due_date_changes row (with its reason) for the same task and new date was written in the same transaction (changed_at = transaction time). original_due_at, once set, never changes. Legacy evidence: ReasonsForChangeDueDateCSTasks, Tasks/updateDueDate.';

-- ------------------------------------------------------------ 10. archive lifecycle
CREATE FUNCTION archive.fn_validate_package_status() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = OLD.status OR core.fn_bypass_allowed('app.bypass_workflow') THEN
        RETURN NEW;
    END IF;
    IF NOT ((OLD.status, NEW.status) IN (('expected','received'),
                                          ('received','stored'), ('received','shipped_back'), ('received','disposed'),
                                          ('stored','retrieved'), ('stored','shipped_back'), ('stored','disposed'),
                                          ('retrieved','stored'), ('retrieved','shipped_back'), ('retrieved','disposed'))) THEN
        RAISE EXCEPTION 'Archive package %: status % -> % is not an allowed transition', OLD.id, OLD.status, NEW.status
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION archive.fn_validate_package_status() IS 'BEFORE UPDATE OF status on archive.packages: enforces the physical archive lifecycle expected -> received -> stored <-> retrieved -> shipped_back | disposed (a package can also leave straight from received). Disposal of physical client material is irreversible; who may dispose is a capability check in the application (ARCHIVE_DISPOSE).';

-- ------------------------------------------- 11. children of approved records frozen
CREATE FUNCTION core.fn_reject_child_edit_when_parent_approved() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_parent_table text := TG_ARGV[0];   -- e.g. 'clinical.surgical_kit_protocols'
    v_fk_column    text := TG_ARGV[1];   -- e.g. 'protocol_id'
    v_parent_id    bigint;
    v_state        text;
BEGIN
    IF core.fn_bypass_allowed('app.bypass_regulated_lock') THEN
        RETURN COALESCE(NEW, OLD);   -- the migration loads detail rows of migrated records
    END IF;
    v_parent_id := (to_jsonb(COALESCE(NEW, OLD)) ->> v_fk_column)::bigint;
    EXECUTE format('SELECT state FROM %s WHERE id = $1', v_parent_table) INTO v_state USING v_parent_id;
    IF v_state IN ('approved', 'superseded', 'migrated') THEN
        RAISE EXCEPTION '%.%: rows of % % are frozen because it is %', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_parent_table, v_parent_id, v_state
            USING ERRCODE = 'insufficient_privilege', HINT = 'Create a new version of the parent record.';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;
COMMENT ON FUNCTION core.fn_reject_child_edit_when_parent_approved() IS 'BEFORE INSERT/UPDATE/DELETE trigger body for detail rows of a versioned regulated record (protocol rows, report lines, inspection results, document record values): once the parent version is approved, superseded or migrated, its detail rows cannot be added, changed or removed. Arguments: parent table, FK column. The migrator may set app.bypass_regulated_lock to load the detail rows of migrated legacy records.';

-- ------------------------------------------------------- 12. partition maintenance
CREATE FUNCTION platform.fn_ensure_monthly_partitions(p_parent regclass, p_months_ahead integer DEFAULT 3) RETURNS integer
    LANGUAGE plpgsql
AS $$
DECLARE
    v_schema text;
    v_table  text;
    v_month  date := date_trunc('month', now())::date;
    v_name   text;
    v_made   integer := 0;
BEGIN
    SELECT n.nspname, c.relname INTO v_schema, v_table
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = p_parent;
    FOR i IN 0 .. p_months_ahead LOOP
        v_name := format('%s_%s', v_table, to_char(v_month + make_interval(months => i), 'YYYY_MM'));
        IF to_regclass(format('%I.%I', v_schema, v_name)) IS NULL THEN
            EXECUTE format('CREATE TABLE %I.%I PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
                           v_schema, v_name, p_parent, v_month + make_interval(months => i),
                           v_month + make_interval(months => i + 1));
            EXECUTE format('COMMENT ON TABLE %I.%I IS %L', v_schema, v_name,
                           format('Monthly partition of %s for %s; created by platform.fn_ensure_monthly_partitions.',
                                  p_parent, to_char(v_month + make_interval(months => i), 'YYYY-MM')));
            v_made := v_made + 1;
        END IF;
    END LOOP;
    RETURN v_made;
END;
$$;
COMMENT ON FUNCTION platform.fn_ensure_monthly_partitions(regclass, integer) IS 'Creates any missing monthly partitions of a range-partitioned log table (audit.audit_log, audit.event_log, audit.phi_access_log, comms.email_logs) for this month and the next p_months_ahead months, with a comment on each. Run daily by a platform job; rows outside every partition fall into the DEFAULT partition and stay queryable. Returns how many partitions it created.';
