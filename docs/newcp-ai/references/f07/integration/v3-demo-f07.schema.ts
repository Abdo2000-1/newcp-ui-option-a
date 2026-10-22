/**
 * V3 migration-derived Drizzle table declarations for the October demo only.
 * V0.7 mappings static-verified; F07 billed party fields declared from supplied V204 target source.
 * V204 DEPLOYMENT AND ETL FINALIZATION NOT VERIFIED IN LIVE DATABASE.
 * Requires drizzle-orm and pg driver in the consuming backend. Not compiled here.
 * Do not apply drizzle-kit push/migrations from this fragment: schema changes owned by DB team.
 */
import { pgSchema, bigint, uuid, varchar, boolean, smallint, numeric, integer, text, jsonb, timestamp, date, char } from 'drizzle-orm/pg-core';

const orders = pgSchema('orders');
const catalog = pgSchema('catalog');
const workflow = pgSchema('workflow');
const billing = pgSchema('billing');
const crm = pgSchema('crm');
export const contacts = crm.table('contacts', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),
  uuid:uuid('uuid').notNull(),
  tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  contactType:varchar('contact_type',{length:30}).notNull(),
  displayName:varchar('display_name',{length:255}).notNull(),
});
const itemKind = catalog.enum('item_kind', ['service','product','license','rental','bundle']);

export const sellableItems = catalog.table('sellable_items', {
  id: bigint('id', {mode:'bigint'}).primaryKey(),
  uuid: uuid('uuid').notNull(),
  tenantId: bigint('tenant_id',{mode:'bigint'}).notNull(),
  categoryId: bigint('category_id',{mode:'bigint'}),
  itemKind: itemKind('item_kind').notNull(),
  code: varchar('code',{length:100}).notNull(),
  name: varchar('name',{length:200}).notNull(),
  isDigital: boolean('is_digital').notNull(),
  pricingMethod: varchar('pricing_method',{length:30}).notNull(),
  workflowCode: varchar('workflow_code',{length:100}),
});
export const fields = catalog.table('fields', {
  id: bigint('id',{mode:'bigint'}).primaryKey(), uuid: uuid('uuid').notNull(),
  tenantId: bigint('tenant_id',{mode:'bigint'}).notNull(),
  fieldTypeId: bigint('field_type_id',{mode:'bigint'}).notNull(),
  code: varchar('code',{length:100}).notNull(), label: varchar('label',{length:200}).notNull(),
  isPriced: boolean('is_priced').notNull(), validation: jsonb('validation').notNull(),
});
export const itemFields = catalog.table('item_fields', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  itemId:bigint('item_id',{mode:'bigint'}).notNull(),fieldId:bigint('field_id',{mode:'bigint'}).notNull(),
  isRequired:boolean('is_required').notNull(),sortOrder:integer('sort_order').notNull(),defaultValue:text('default_value'),
});
export const fieldOptions = catalog.table('field_options', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  fieldId:bigint('field_id',{mode:'bigint'}).notNull(),code:varchar('code',{length:100}).notNull(),
  label:varchar('label',{length:200}).notNull(),isActive:boolean('is_active').notNull(),
});
export const itemFieldRules = catalog.table('item_field_rules', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  itemFieldId:bigint('item_field_id',{mode:'bigint'}).notNull(),
  ruleKind:varchar('rule_kind',{length:20}).notNull(), condition:jsonb('condition').notNull(),
  optionCodes:varchar('option_codes',{length:100}).array(),isActive:boolean('is_active').notNull(),
});
export const orderHeaders = orders.table('orders', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),uuid:uuid('uuid').notNull(),
  tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  contactId:bigint('contact_id',{mode:'bigint'}).notNull(),
  scanCenterContactId:bigint('scan_center_contact_id',{mode:'bigint'}),
  status:varchar('status',{length:50}).notNull(),
});
export const orderItems = orders.table('order_items', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),uuid:uuid('uuid').notNull(),
  tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  orderId:bigint('order_id',{mode:'bigint'}).notNull(),
  lineNumber:smallint('line_number').notNull(),
  sellableItemId:bigint('sellable_item_id',{mode:'bigint'}).notNull(),
  itemKind:itemKind('item_kind').notNull(),status:varchar('status',{length:50}).notNull(),
  currencyCode:char('currency_code',{length:3}).notNull(),
  unitPrice:numeric('unit_price',{precision:15,scale:4}).notNull(),
  fieldsAmount:numeric('fields_amount',{precision:15,scale:4}).notNull(),
  discountAmount:numeric('discount_amount',{precision:15,scale:4}).notNull(),
  lineTotal:numeric('line_total',{precision:15,scale:4}).notNull(),
  isInvoiced:boolean('is_invoiced').notNull(),
  invoiceId:bigint('invoice_id',{mode:'bigint'}),
  /** F07 V204 authoritative per-item payer; resolve public contact UUID via crm.contacts table. */
  billedToContactId:bigint('billed_to_contact_id',{mode:'bigint'}), // NOT NULL only after verified stage-90 finalization
  billedPartyOrigin:varchar('billed_party_origin',{length:30}).notNull(),
  isRedo:boolean('is_redo').notNull(),
  redoOfItemId:bigint('redo_of_item_id',{mode:'bigint'}),
  zeroChargeReasonId:bigint('zero_charge_reason_id',{mode:'bigint'}),
  zeroChargeNote:varchar('zero_charge_note',{length:255}),
  pendingReason:varchar('pending_reason',{length:255}),
  serviceNotes:text('service_notes'),
});
export const fieldValues = orders.table('order_item_field_values', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  orderItemId:bigint('order_item_id',{mode:'bigint'}).notNull(),
  fieldId:bigint('field_id',{mode:'bigint'}).notNull(),
  fieldOptionId:bigint('field_option_id',{mode:'bigint'}),
  valueText:text('value_text'),valueNumber:numeric('value_number',{precision:18,scale:4}),
  valueBoolean:boolean('value_boolean'),valueDate:date('value_date'),
  chargedAmount:numeric('charged_amount',{precision:15,scale:4}).notNull(),
});
export const workflowDefinitions = workflow.table('workflow_definitions', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  code:varchar('code',{length:100}).notNull(),entityType:varchar('entity_type',{length:50}).notNull(),
  serviceFamily:varchar('service_family',{length:40}),isActive:boolean('is_active').notNull(),
});
export const workflowInstances = workflow.table('workflow_instances', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  definitionId:bigint('definition_id',{mode:'bigint'}).notNull(),
  entityType:varchar('entity_type',{length:50}).notNull(),
  entityId:bigint('entity_id',{mode:'bigint'}).notNull(),
  currentStateId:bigint('current_state_id',{mode:'bigint'}),
});
export const workflowTransitions = workflow.table('workflow_transitions', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  definitionId:bigint('definition_id',{mode:'bigint'}).notNull(),
  fromStateId:bigint('from_state_id',{mode:'bigint'}),toStateId:bigint('to_state_id',{mode:'bigint'}).notNull(),
  requiredCapabilityId:bigint('required_capability_id',{mode:'bigint'}),
  guardCondition:jsonb('guard_condition').notNull(),autoTrigger:varchar('auto_trigger',{length:100}),
});
export const orderStatusHistory = orders.table('order_status_history', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  orderId:bigint('order_id',{mode:'bigint'}).notNull(),
  orderItemId:bigint('order_item_id',{mode:'bigint'}),
  fromStatus:varchar('from_status',{length:50}),toStatus:varchar('to_status',{length:50}).notNull(),
  actorUserId:bigint('actor_user_id',{mode:'bigint'}),
  changedAt:timestamp('changed_at',{withTimezone:true}).notNull(),
});
export const charges = billing.table('charges', {
  id:bigint('id',{mode:'bigint'}).primaryKey(),tenantId:bigint('tenant_id',{mode:'bigint'}).notNull(),
  orderItemId:bigint('order_item_id',{mode:'bigint'}),
  contactId:bigint('contact_id',{mode:'bigint'}).notNull(),
  amount:numeric('amount',{precision:15,scale:4}).notNull(),
  currencyCode:char('currency_code',{length:3}).notNull(),
});
// F07 fields above come from the PROVIDED V204 migration, not an inferred column.
// Do not use drizzle-kit push/migrations; DB owner applies V204 and ETL stage90.
// Do not assume billed_to_contact_id NOT NULL until stage90 signed off.
// App-role transactions must enforce tenant, order eligibility and financial locks.
