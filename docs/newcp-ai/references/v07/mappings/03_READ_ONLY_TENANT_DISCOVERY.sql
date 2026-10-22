-- Run ONLY in approved isolated development/staging PostgreSQL as a non-superuser application role.
-- psql -X -v ON_ERROR_STOP=1 -v tenant_id=YOUR_TEST_TENANT_ID -d YOUR_TEST_DATABASE -f mappings/03_READ_ONLY_TENANT_DISCOVERY.sql
-- tenant_id is deliberately required: omitted variables cause a failure instead of a cross-tenant inspection.
-- No patient/contact names or financial amounts are returned. No writes or temp tables.
BEGIN TRANSACTION READ ONLY;
SELECT set_config('app.tenant_id', :'tenant_id', true) AS scoped_tenant;
SELECT current_database() AS database_name, current_user AS app_user,
       core.fn_current_tenant() AS effective_tenant,
       row_security_active('orders.order_items'::regclass) AS item_rls_active,
       row_security_active('catalog.sellable_items'::regclass) AS catalog_rls_active;

-- 01: find service candidates; actual codes and UUIDs come from YOUR selected tenant, never sample identifiers.
SELECT si.id AS internal_item_id, si.uuid AS sellable_item_uuid,
       si.code AS sellable_item_code, si.name AS sellable_item_name,
       c.code AS category_code, c.name AS category_name,
       si.item_kind, si.is_digital, si.pricing_method, si.workflow_code,
       si.legacy_source, si.legacy_id
FROM catalog.sellable_items si
LEFT JOIN catalog.categories c ON c.id=si.category_id AND c.tenant_id=si.tenant_id
WHERE si.tenant_id=core.fn_current_tenant()
  AND si.item_kind='service'
  AND (lower(si.name) LIKE '%biomodel%' OR lower(si.name) LIKE '%conversion%'
       OR lower(si.name) LIKE '%implant analog%'
       OR lower(si.code) LIKE '%biomodel%' OR lower(si.code) LIKE '%conversion%')
ORDER BY c.code, si.name, si.id;

-- 02: actual dynamic field mappings incl. types, options, static validation and conditional rules.
-- Not all Connect control names will appear in V3: preserve unmatched rows in mapping gap register.
SELECT si.code AS item_code, si.uuid AS item_uuid,
       f.id AS internal_field_id, f.uuid AS field_uuid, f.code AS field_code, f.label,
       ft.code AS field_type_code, f.validation AS field_validation,
       itf.is_required, itf.default_value, itf.section, itf.sort_order,
       coalesce((SELECT jsonb_agg(jsonb_build_object('code', opt.code, 'label', opt.label, 'active', opt.is_active)
                       ORDER BY opt.sort_order, opt.id)
                 FROM catalog.field_options opt
                 WHERE opt.field_id=f.id AND opt.tenant_id=si.tenant_id),'[]'::jsonb) AS option_definitions,
       coalesce((SELECT jsonb_agg(jsonb_build_object('kind', rule.rule_kind, 'condition', rule.condition,
                          'optionCodes',rule.option_codes) ORDER BY rule.sort_order,rule.id)
                 FROM catalog.item_field_rules rule
                 WHERE rule.item_field_id=itf.id AND rule.is_active=true
                   AND rule.tenant_id=si.tenant_id),'[]'::jsonb) AS conditional_rules
FROM catalog.sellable_items si
JOIN catalog.item_fields itf ON itf.item_id=si.id AND itf.tenant_id=si.tenant_id
JOIN catalog.fields f ON f.id=itf.field_id AND f.tenant_id=si.tenant_id
JOIN catalog.field_types ft ON ft.id=f.field_type_id
WHERE si.tenant_id=core.fn_current_tenant()
  AND (lower(si.name) LIKE '%biomodel%' OR lower(si.name) LIKE '%conversion%'
       OR lower(si.name) LIKE '%implant analog%'
       OR lower(si.code) LIKE '%biomodel%' OR lower(si.code) LIKE '%conversion%')
ORDER BY si.code,itf.sort_order,f.code;

-- 03: candidate workflow definitions and transitions. NO claim these transitions are permitted until
-- the service-to-definition mapping and the user capability/guard checks are evaluated by the backend.
SELECT si.code AS item_code, si.workflow_code, wd.id AS definition_id, wd.code AS definition_code,
       wd.version, wd.entity_type, wd.service_family,
       s_from.code AS from_state_code, s_to.code AS to_state_code,
       tr.id AS transition_id, tr.name AS transition_name,
       tr.required_capability_id, tr.guard_condition, tr.auto_trigger
FROM catalog.sellable_items si
LEFT JOIN workflow.workflow_definitions wd ON wd.tenant_id=si.tenant_id
 AND wd.code=si.workflow_code AND wd.is_active=true
LEFT JOIN workflow.workflow_transitions tr ON tr.definition_id=wd.id AND tr.tenant_id=si.tenant_id
LEFT JOIN workflow.workflow_states s_from ON s_from.id=tr.from_state_id
LEFT JOIN workflow.workflow_states s_to ON s_to.id=tr.to_state_id
WHERE si.tenant_id=core.fn_current_tenant()
  AND (lower(si.name) LIKE '%biomodel%' OR lower(si.name) LIKE '%conversion%'
       OR lower(si.code) LIKE '%biomodel%' OR lower(si.code) LIKE '%conversion%')
ORDER BY si.code,wd.version,tr.id;

-- 04: number of safe testable candidates; NO patient/doctor identifiers returned.
SELECT si.code, COUNT(DISTINCT oi.id) AS visible_existing_instances,
       COUNT(DISTINCT oi.order_id) AS visible_parent_orders
FROM catalog.sellable_items si
LEFT JOIN orders.order_items oi ON oi.sellable_item_id=si.id AND oi.tenant_id=si.tenant_id AND oi.deleted_at IS NULL
WHERE si.tenant_id=core.fn_current_tenant()
  AND (lower(si.name) LIKE '%biomodel%' OR lower(si.name) LIKE '%conversion%'
       OR lower(si.code) LIKE '%biomodel%' OR lower(si.code) LIKE '%conversion%')
GROUP BY si.code ORDER BY si.code;

-- 05: service-level billed party provenance check (structural only, does not return contact IDs).
-- The original migration provides charging recipient in the ledger, but not an explicit pre-charge recipient
-- in orders.order_items; verify deployed schema differs or an existing normalized relation was added.
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema IN ('orders','billing')
 AND (column_name ILIKE '%bill%to%' OR column_name ILIKE '%payer%'
      OR column_name ILIKE '%billed%contact%' OR column_name ILIKE '%contact_id%')
 AND table_name IN ('order_items','orders','charges','invoices','charge_requests')
ORDER BY table_schema, table_name, ordinal_position;

ROLLBACK;
