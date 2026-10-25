import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CatalogClient,
  evaluateCondition,
  isFieldVisible,
  isFieldRequired,
  MOCK_CATALOG_SERVICES,
  MOCK_BIOMODEL_FORM_SCHEMA
} from '../catalogClient';
import type { IHttpTransport } from '../httpTransport';
import type { FormField } from '../contractTypes';

describe('T-API-003: Catalog Services & Dynamic Form Schema Integration', () => {
  let mockTransport: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTransport = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
    };
  });

  it('queries /catalog/services using exact categoryCode parameter (not itemKind)', async () => {
    mockTransport.get.mockResolvedValueOnce({
      status: 200,
      data: MOCK_CATALOG_SERVICES,
      headers: new Headers(),
      etag: null,
    });

    const client = new CatalogClient(mockTransport as unknown as IHttpTransport);
    const services = await client.listServices({ categoryCode: 'PRINTING' });

    expect(services.length).toBe(2);
    expect(mockTransport.get).toHaveBeenCalledWith('/catalog/services', {
      params: { categoryCode: 'PRINTING' },
    });
  });

  it('loads dynamic form schema with canonical field types from /catalog/services/{serviceUuid}/form-schema', async () => {
    mockTransport.get.mockResolvedValueOnce({
      status: 200,
      data: MOCK_BIOMODEL_FORM_SCHEMA,
      headers: new Headers(),
      etag: null,
    });

    const client = new CatalogClient(mockTransport as unknown as IHttpTransport);
    const schema = await client.getFormSchema('11111111-1111-4111-8111-111111111111');

    expect(schema.service.code).toBe('BIOMODEL');
    expect(schema.fields.length).toBe(4);
    expect(schema.fields.map(f => f.type)).toEqual(['single_select', 'number', 'text', 'tooth_chart']);
  });

  it('correctly evaluates boolean tree conditions (leaf, all, any, not)', () => {
    // Leaf op
    expect(evaluateCondition({ field: 'color', op: 'eq', value: 'blue' }, { color: 'blue' })).toBe(true);
    expect(evaluateCondition({ field: 'color', op: 'eq', value: 'blue' }, { color: 'red' })).toBe(false);
    expect(evaluateCondition({ field: 'qty', op: 'gt', value: 5 }, { qty: 10 })).toBe(true);
    expect(evaluateCondition({ field: 'tag', op: 'in', value: ['a', 'b'] }, { tag: 'a' })).toBe(true);

    // Tree all
    const allCond = {
      all: [
        { field: 'a', op: 'eq', value: 1 } as const,
        { field: 'b', op: 'eq', value: 2 } as const,
      ],
    };
    expect(evaluateCondition(allCond, { a: 1, b: 2 })).toBe(true);
    expect(evaluateCondition(allCond, { a: 1, b: 3 })).toBe(false);

    // Tree any
    const anyCond = {
      any: [
        { field: 'role', op: 'eq', value: 'admin' } as const,
        { field: 'role', op: 'eq', value: 'clerk' } as const,
      ],
    };
    expect(evaluateCondition(anyCond, { role: 'clerk' })).toBe(true);
    expect(evaluateCondition(anyCond, { role: 'guest' })).toBe(false);

    // Tree not
    const notCond = {
      not: { field: 'status', op: 'eq', value: 'archived' } as const,
    };
    expect(evaluateCondition(notCond, { status: 'active' })).toBe(true);
    expect(evaluateCondition(notCond, { status: 'archived' })).toBe(false);
  });

  it('evaluates visible and required rule kinds (not show, require, or disable)', () => {
    const field: FormField = {
      uuid: 'field-1',
      code: 'wall_thickness',
      label: 'Wall Thickness',
      type: 'number',
      required: false,
      options: [],
      conditionalRules: [
        {
          ruleKind: 'visible',
          condition: { field: 'model_type', op: 'eq', value: 'hollow' },
        },
        {
          ruleKind: 'required',
          condition: { field: 'model_type', op: 'eq', value: 'hollow' },
        },
      ],
    };

    // When model_type is solid: not visible, not required
    expect(isFieldVisible(field, { model_type: 'solid' })).toBe(false);
    expect(isFieldRequired(field, { model_type: 'solid' })).toBe(false);

    // When model_type is hollow: visible and required
    expect(isFieldVisible(field, { model_type: 'hollow' })).toBe(true);
    expect(isFieldRequired(field, { model_type: 'hollow' })).toBe(true);
  });

  it('falls back safely to MOCK fixtures when transport fails or server is offline', async () => {
    mockTransport.get.mockRejectedValueOnce(new Error('Network offline'));
    const client = new CatalogClient(mockTransport as unknown as IHttpTransport, true);

    const services = await client.listServices();
    expect(services).toEqual(MOCK_CATALOG_SERVICES);

    const schema = await client.getFormSchema('11111111-1111-4111-8111-111111111111');
    expect(schema.service.code).toBe('BIOMODEL');
  });
});
