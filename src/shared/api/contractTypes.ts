/**
 * New CP — Service-Instance API Contract Types
 * 
 * Strict TypeScript types reflecting OpenAPI 3.0.3 specification:
 * docs/newcp-ai/references/api/newcp.openapi.yaml
 * 
 * Target: Q-B8..Q-B15 Approved Implementation Target
 * Authority: Canonical OpenAPI YAML is the sole machine-readable authority.
 * MOCK / NOT_INTEGRATED: Types provide offline compile-time safety and boundary isolation.
 */

// ============================================================================
// 1. Problem Details & Errors (RFC 7807 compatible)
// ============================================================================

export interface ProblemDetails {
  field?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface Problem {
  code: string;
  message: string;
  requestId?: string;
  details?: ProblemDetails;
}

// ============================================================================
// 2. Catalog & Forms
// ============================================================================

export interface FormOption {
  code: string;
  label: string;
  active?: boolean;
}

export interface CatalogService {
  uuid: string;
  code: string;
  name: string;
  itemKind: 'service';
  isDigital?: boolean;
  workflowCode?: string | null;
  defaultSellableItemUuid?: string;
  leadTimeDays?: number;
}

export interface CatalogQueryParams {
  categoryCode?: string;
}

export type CanonicalFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'single_select'
  | 'multi_select'
  | 'file'
  | 'tooth_chart';

export interface FormValidation {
  min?: number;
  max?: number;
  max_length?: number;
  pattern?: string;
  [key: string]: unknown;
}

// Conditional Expressions (V3 Boolean Tree Logic)
export type FieldConditionOp =
  | 'eq'
  | 'ne'
  | 'in'
  | 'not_in'
  | 'is_set'
  | 'is_not_set'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface FieldConditionLeaf {
  field?: string;
  attribute?: string;
  op: FieldConditionOp;
  value?: unknown;
  values?: unknown[];
}

export interface FieldConditionAll {
  all: FieldCondition[];
}

export interface FieldConditionAny {
  any: FieldCondition[];
}

export interface FieldConditionNot {
  not: FieldCondition;
}

export type FieldCondition =
  | FieldConditionLeaf
  | FieldConditionAll
  | FieldConditionAny
  | FieldConditionNot;

export type ConditionalRuleKind = 'visible' | 'required' | 'options';

export interface ConditionalFieldRule {
  ruleKind: ConditionalRuleKind;
  condition: FieldCondition;
  optionCodes?: string[];
  sortOrder?: number;
  active?: boolean;
}

export interface FormField {
  uuid: string;
  code: string;
  label: string;
  type: CanonicalFieldType;
  required: boolean;
  options: FormOption[];
  defaultValue?: string | null;
  validation?: FormValidation;
  conditionalRules?: ConditionalFieldRule[];
}

export interface FormDefinition {
  service: CatalogService;
  fields: FormField[];
  evidence?: string;
}

// ============================================================================
// 3. Service Instances & Answers
// ============================================================================

export interface FormAnswer {
  fieldCode: string;
  value?: string | number | boolean;
  optionCodes?: string[];
  // Legacy / compatibility carriers
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: string;
  optionCode?: string;
}

export type BilledPartyOrigin =
  | 'legacy_explicit'
  | 'order_default'
  | 'manual_resolution'
  | 'user_selected'
  | 'unresolved_legacy';

export interface CreateServiceItem {
  sellableItemUuid: string;
  answers: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  billedToContactUuid?: string;
  isBillable?: boolean;
  unitPrice?: string;
  quantity?: number;
  zeroChargeReasonCode?: string;
  zeroChargeNote?: string;
}

export interface PatchServiceItem {
  answers?: FormAnswer[];
  isRedo?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  pendingReason?: string;
  billedToContactUuid?: string;
  isBillable?: boolean;
  unitPrice?: string;
  quantity?: number;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string;
}

export interface ServiceItem {
  uuid: string;
  orderUuid: string;
  sellableItemUuid: string;
  lineNumber?: number;
  status: string;
  answers: FormAnswer[];
  billedToContactUuid: string;
  billedPartyOrigin: BilledPartyOrigin;
  canEditBilledParty?: boolean;
  isBillable: boolean;
  canEditBillability?: boolean;
  isInvoiced?: boolean;
  currencyCode?: string;
  unitPrice?: string;
  quantity?: number;
  lineTotal?: string;
  canEditPrice?: boolean;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string | null;
  isRedo?: boolean;
  redoOfItemUuid?: string | null;
  serviceNotes?: string;
  holdType?: HoldType | null;
  holdReasonCode?: string | null;
}

// ============================================================================
// 4. Workflow Transitions, On Hold, & History
// ============================================================================

export type HoldType = 'customer' | 'internal';

export interface HoldReasonOption {
  code: string;
  label: string;
  isTemporary: boolean;
  holdType?: HoldType;
  active?: boolean;
}

export interface AvailableTransition {
  transitionId: number;
  fromCode: string;
  toCode: string;
  toStatusName?: string;
  requiresHoldDetails?: boolean;
  guardDescription?: string;
}

export interface TransitionRequest {
  transitionId: number;
  comment?: string;
  holdType?: HoldType;
  holdReasonCode?: string;
}

export interface TransitionResult {
  serviceItemUuid: string;
  fromCode: string;
  toCode: string;
  changedAt: string;
  actorUserUuid?: string;
  holdType?: HoldType;
  holdReasonCode?: string;
}

export interface HistoryEvent {
  fromCode?: string;
  toCode?: string;
  actorUserUuid?: string;
  occurredAt?: string;
  comment?: string;
}

// ============================================================================
// 5. Billing & Pricing Lookups
// ============================================================================

export interface BilledPartyChoice {
  contactUuid: string;
  role: 'doctor' | 'scanning_center';
  label: string;
}

export interface ZeroChargeReason {
  code: string;
  label: string;
  active: boolean;
  description?: string | null;
}
