-- =============================================================================
-- V110  Business-rule triggers (bodies in V100)
-- =============================================================================
-- Generic triggers (touch updated_at, append-only, immutable-when-approved) are
-- attached in each table file. BEFORE triggers on one table fire in name order:
-- for orders.order_items that is financial_lock, item_total, reject_when_locked,
-- touch_updated_at — so a frozen invoiced line is rejected before any total is
-- recalculated.
-- =============================================================================

-- workflow ------------------------------------------------------------------
CREATE TRIGGER trg_workflow_instances__validate_transition
    BEFORE UPDATE OF current_state_id ON workflow.workflow_instances
    FOR EACH ROW EXECUTE FUNCTION workflow.fn_validate_transition();
COMMENT ON TRIGGER trg_workflow_instances__validate_transition ON workflow.workflow_instances IS 'Rejects state changes the workflow definition does not allow and writes the matching workflow_history row (workflow.fn_validate_transition).';

CREATE TRIGGER trg_tasks__due_date_reason
    BEFORE UPDATE OF due_at, original_due_at ON workflow.tasks
    FOR EACH ROW EXECUTE FUNCTION workflow.fn_require_due_date_reason();
COMMENT ON TRIGGER trg_tasks__due_date_reason ON workflow.tasks IS 'A task due date changes only together with a reasoned workflow.task_due_date_changes row; original_due_at never changes once set (workflow.fn_require_due_date_reason).';

-- vouchers ------------------------------------------------------------------
CREATE TRIGGER trg_voucher_transactions__apply
    BEFORE INSERT ON vouchers.voucher_transactions
    FOR EACH ROW EXECUTE FUNCTION vouchers.fn_apply_transaction();
COMMENT ON TRIGGER trg_voucher_transactions__apply ON vouchers.voucher_transactions IS 'Applies every ledger movement to its voucher''s balance columns and rejects overdraws, expired or foreign-client redemptions (vouchers.fn_apply_transaction).';

-- orders --------------------------------------------------------------------
CREATE TRIGGER trg_orders__assign_order_number
    BEFORE INSERT ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION orders.fn_assign_order_number();
COMMENT ON TRIGGER trg_orders__assign_order_number ON orders.orders IS 'Assigns the next per-tenant order number when an order is created without one (orders.fn_assign_order_number).';

CREATE TRIGGER trg_orders__reject_when_locked
    BEFORE UPDATE ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION orders.fn_reject_when_locked();
COMMENT ON TRIGGER trg_orders__reject_when_locked ON orders.orders IS 'Blocks edits to an order another holder has locked (orders.fn_reject_when_locked).';

CREATE TRIGGER trg_orders__party_lock
    BEFORE UPDATE OF contact_id, scan_center_contact_id, patient_id ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION orders.fn_reject_party_edit_when_invoiced();
COMMENT ON TRIGGER trg_orders__party_lock ON orders.orders IS 'Freezes doctor, scanning centre and patient once any line is invoiced or charged (orders.fn_reject_party_edit_when_invoiced).';

CREATE TRIGGER trg_orders__contact_order_dates
    AFTER INSERT ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION crm.fn_touch_contact_order_dates();
COMMENT ON TRIGGER trg_orders__contact_order_dates ON orders.orders IS 'Keeps the client''s first/last order dates current (crm.fn_touch_contact_order_dates).';

CREATE TRIGGER trg_order_items__financial_lock
    BEFORE UPDATE OR DELETE ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.fn_reject_financial_edit();
COMMENT ON TRIGGER trg_order_items__financial_lock ON orders.order_items IS 'Freezes the money of invoiced or charged lines and blocks their deletion (orders.fn_reject_financial_edit).';

CREATE TRIGGER trg_order_items__item_total
    BEFORE INSERT OR UPDATE OF unit_price, quantity, fields_amount, discount_amount, voucher_amount ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.fn_recalculate_item_total();
COMMENT ON TRIGGER trg_order_items__item_total ON orders.order_items IS 'Recomputes line_total from price, quantity, surcharges, discount and voucher (orders.fn_recalculate_item_total).';

CREATE TRIGGER trg_order_items__reject_when_locked
    BEFORE INSERT OR UPDATE ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.fn_reject_when_locked();
COMMENT ON TRIGGER trg_order_items__reject_when_locked ON orders.order_items IS 'Blocks adding or editing lines of an order another holder has locked (orders.fn_reject_when_locked).';

CREATE TRIGGER trg_order_items__order_total
    AFTER INSERT OR UPDATE OF unit_price, quantity, fields_amount, discount_amount, voucher_amount, deleted_at OR DELETE ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.fn_recalculate_order_total();
COMMENT ON TRIGGER trg_order_items__order_total ON orders.order_items IS 'Rolls line amounts up into the order''s subtotal, discount, voucher and total (orders.fn_recalculate_order_total).';

CREATE TRIGGER trg_order_item_field_values__refresh_item
    AFTER INSERT OR UPDATE OF charged_amount, order_item_id OR DELETE ON orders.order_item_field_values
    FOR EACH ROW EXECUTE FUNCTION orders.fn_refresh_item_fields_amount();
COMMENT ON TRIGGER trg_order_item_field_values__refresh_item ON orders.order_item_field_values IS 'Pushes field surcharges into the line''s fields_amount, which recalculates the line and order totals (orders.fn_refresh_item_fields_amount).';

-- clinical ------------------------------------------------------------------
CREATE TRIGGER trg_patient_identities__invoiced_lock
    BEFORE UPDATE OF full_name, date_of_birth ON clinical.patient_identities
    FOR EACH ROW EXECUTE FUNCTION clinical.fn_reject_identity_edit_when_invoiced();
COMMENT ON TRIGGER trg_patient_identities__invoiced_lock ON clinical.patient_identities IS 'Freezes the patient name and date of birth once they appear on an invoiced order (clinical.fn_reject_identity_edit_when_invoiced).';

CREATE TRIGGER trg_surgical_kit_protocol_rows__parent_frozen
    BEFORE INSERT OR UPDATE OR DELETE ON clinical.surgical_kit_protocol_rows
    FOR EACH ROW EXECUTE FUNCTION core.fn_reject_child_edit_when_parent_approved('clinical.surgical_kit_protocols', 'protocol_id');
COMMENT ON TRIGGER trg_surgical_kit_protocol_rows__parent_frozen ON clinical.surgical_kit_protocol_rows IS 'Drilling-protocol rows of an approved, superseded or migrated protocol version cannot change (core.fn_reject_child_edit_when_parent_approved).';

-- inventory / archive -------------------------------------------------------
CREATE TRIGGER trg_stock_movements__apply
    AFTER INSERT ON inventory.stock_movements
    FOR EACH ROW EXECUTE FUNCTION inventory.fn_apply_movement();
COMMENT ON TRIGGER trg_stock_movements__apply ON inventory.stock_movements IS 'Applies each stock movement to the warehouse stock levels (inventory.fn_apply_movement).';

CREATE TRIGGER trg_packages__status_transition
    BEFORE UPDATE OF status ON archive.packages
    FOR EACH ROW EXECUTE FUNCTION archive.fn_validate_package_status();
COMMENT ON TRIGGER trg_packages__status_transition ON archive.packages IS 'Enforces the physical archive lifecycle (archive.fn_validate_package_status).';

-- regulated records: detail rows frozen with their parent -------------------
CREATE TRIGGER trg_report_lines__parent_frozen
    BEFORE INSERT OR UPDATE OR DELETE ON production.report_lines
    FOR EACH ROW EXECUTE FUNCTION core.fn_reject_child_edit_when_parent_approved('production.reports', 'report_id');
COMMENT ON TRIGGER trg_report_lines__parent_frozen ON production.report_lines IS 'Lines of an approved, superseded or migrated production report cannot change (core.fn_reject_child_edit_when_parent_approved).';

CREATE TRIGGER trg_inspection_results__parent_frozen
    BEFORE INSERT OR UPDATE OR DELETE ON quality.inspection_results
    FOR EACH ROW EXECUTE FUNCTION core.fn_reject_child_edit_when_parent_approved('quality.inspections', 'inspection_id');
COMMENT ON TRIGGER trg_inspection_results__parent_frozen ON quality.inspection_results IS 'Results of an approved, superseded or migrated QC inspection cannot change (core.fn_reject_child_edit_when_parent_approved).';

CREATE TRIGGER trg_document_record_values__parent_frozen
    BEFORE INSERT OR UPDATE OR DELETE ON docs.document_record_values
    FOR EACH ROW EXECUTE FUNCTION core.fn_reject_child_edit_when_parent_approved('docs.document_records', 'document_record_id');
COMMENT ON TRIGGER trg_document_record_values__parent_frozen ON docs.document_record_values IS 'Values of an approved, superseded or migrated document record (forms, fabrication notes, instruction sheets) cannot change (core.fn_reject_child_edit_when_parent_approved).';
