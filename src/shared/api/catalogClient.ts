import { getApiConfig } from './config';
import { HttpTransport, type IHttpTransport } from './httpTransport';
import type {
  CatalogService,
  CatalogQueryParams,
  FormDefinition,
  FormField,
  FieldCondition,
  FieldConditionLeaf,
  ConditionalFieldRule,
  ConditionalRuleKind
} from './contractTypes';

/**
 * EXPLICIT BOUNDARY: MOCK / DEMO ONLY
 * Canonical offline catalog fixtures adhering strictly to newcp.openapi.yaml.
 */
export const MOCK_CATALOG_SERVICES: CatalogService[] = [
  {
    uuid: '11111111-1111-4111-8111-111111111111',
    code: 'BIOMODEL',
    name: 'Biomodel 3D Printing',
    itemKind: 'service',
    isDigital: false,
    workflowCode: 'WF_BIOMODEL',
    defaultSellableItemUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    leadTimeDays: 2,
  },
  {
    uuid: '22222222-2222-4222-8222-222222222222',
    code: 'CONVERSION',
    name: 'Dicom to CAD Conversion',
    itemKind: 'service',
    isDigital: true,
    workflowCode: 'WF_CONVERSION',
    defaultSellableItemUuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    leadTimeDays: 1,
  },
];

export const MOCK_BIOMODEL_FORM_SCHEMA: FormDefinition = {
  service: MOCK_CATALOG_SERVICES[0],
  fields: [
    {
      uuid: 'f1111111-1111-4111-8111-111111111111',
      code: 'model_type',
      label: 'Model Architecture',
      type: 'single_select',
      required: true,
      options: [
        { code: 'solid', label: 'Solid Arch' },
        { code: 'hollow', label: 'Hollow Arch (Hygienic Drain)' },
      ],
      defaultValue: 'solid',
    },
    {
      uuid: 'f2222222-2222-4222-8222-222222222222',
      code: 'wall_thickness_mm',
      label: 'Wall Thickness (mm)',
      type: 'number',
      required: true,
      options: [],
      validation: { min: 1.5, max: 4.0 },
      conditionalRules: [
        {
          ruleKind: 'visible',
          condition: {
            op: 'eq',
            field: 'model_type',
            value: 'hollow',
          },
        },
        {
          ruleKind: 'required',
          condition: {
            op: 'eq',
            field: 'model_type',
            value: 'hollow',
          },
        },
      ],
    },
    {
      uuid: 'f3333333-3333-4333-8333-333333333333',
      code: 'clinical_notes',
      label: 'Special Staging Notes',
      type: 'text',
      required: false,
      options: [],
    },
    {
      uuid: 'f4444444-4444-4444-8444-444444444444',
      code: 'target_teeth',
      label: 'Selected Teeth Chart',
      type: 'tooth_chart',
      required: false,
      options: [],
    },
  ],
  evidence: 'MOCK / NOT_INTEGRATED: Canonical contract schema fixture for offline testing',
};

/**
 * Evaluates a contract FieldCondition expression against current form answers.
 */
export function evaluateCondition(condition: FieldCondition, answers: Record<string, unknown>): boolean {
  if ('all' in condition) {
    return condition.all.every(c => evaluateCondition(c, answers));
  }
  if ('any' in condition) {
    return condition.any.some(c => evaluateCondition(c, answers));
  }
  if ('not' in condition) {
    return !evaluateCondition(condition.not, answers);
  }

  const leaf = condition as FieldConditionLeaf;
  const val = leaf.field ? answers[leaf.field] : undefined;

  switch (leaf.op) {
    case 'eq':
      return val === leaf.value;
    case 'ne':
      return val !== leaf.value;
    case 'is_set':
      return val !== undefined && val !== null && val !== '';
    case 'is_not_set':
      return val === undefined || val === null || val === '';
    case 'in':
      return Array.isArray(leaf.value) && leaf.value.includes(val);
    case 'not_in':
      return Array.isArray(leaf.value) && !leaf.value.includes(val);
    case 'gt':
      return Number(val) > Number(leaf.value);
    case 'gte':
      return Number(val) >= Number(leaf.value);
    case 'lt':
      return Number(val) < Number(leaf.value);
    case 'lte':
      return Number(val) <= Number(leaf.value);
    default:
      return true;
  }
}

/**
 * Checks if a field should be visible according to its conditional rules.
 */
export function isFieldVisible(field: FormField, answers: Record<string, unknown>): boolean {
  if (!field.conditionalRules || field.conditionalRules.length === 0) return true;
  const visibleRules = field.conditionalRules.filter(r => r.ruleKind === 'visible');
  if (visibleRules.length === 0) return true;
  return visibleRules.every(r => evaluateCondition(r.condition, answers));
}

/**
 * Checks if a field should be required according to its base property and conditional rules.
 */
export function isFieldRequired(field: FormField, answers: Record<string, unknown>): boolean {
  let required = field.required;
  if (!field.conditionalRules || field.conditionalRules.length === 0) return required;
  const reqRules = field.conditionalRules.filter(r => r.ruleKind === 'required');
  for (const rule of reqRules) {
    if (evaluateCondition(rule.condition, answers)) {
      required = true;
    }
  }
  return required;
}

export interface ICatalogClient {
  listServices(params?: CatalogQueryParams): Promise<CatalogService[]>;
  getFormSchema(serviceUuid: string): Promise<FormDefinition>;
}

export class CatalogClient implements ICatalogClient {
  private transport?: IHttpTransport;
  private enableMocks: boolean;

  constructor(transport?: IHttpTransport, enableMocks = true) {
    this.transport = transport;
    this.enableMocks = enableMocks;
  }

  public async listServices(params?: CatalogQueryParams): Promise<CatalogService[]> {
    if (this.transport) {
      try {
        const queryParams: Record<string, string | undefined> = {};
        if (params?.categoryCode) {
          queryParams.categoryCode = params.categoryCode;
        }
        const res = await this.transport.get<CatalogService[]>('/catalog/services', {
          params: queryParams,
        });
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    return MOCK_CATALOG_SERVICES;
  }

  public async getFormSchema(serviceUuid: string): Promise<FormDefinition> {
    if (this.transport) {
      try {
        const res = await this.transport.get<FormDefinition>(`/catalog/services/${serviceUuid}/form-schema`);
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    if (serviceUuid === MOCK_CATALOG_SERVICES[0].uuid || serviceUuid.includes('1111')) {
      return MOCK_BIOMODEL_FORM_SCHEMA;
    }

    return {
      service: MOCK_CATALOG_SERVICES[1],
      fields: [
        {
          uuid: 'f-conv-1',
          code: 'dicom_series_uid',
          label: 'DICOM Series Identifier',
          type: 'text',
          required: true,
          options: [],
        },
      ],
      evidence: 'MOCK / NOT_INTEGRATED: Fallback conversion form schema',
    };
  }
}

export const catalogClient = new CatalogClient(new HttpTransport(), getApiConfig().enableMocks);
