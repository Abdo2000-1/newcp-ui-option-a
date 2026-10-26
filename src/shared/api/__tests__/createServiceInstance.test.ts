import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceClient } from '../serviceClient';
import type { IHttpTransport } from '../httpTransport';
import type { CreateServiceItem, FormAnswer, ServiceItem } from '../contractTypes';
import { ValidationError, ApiClientError } from '../errors';

describe('FE-SERVICE-001: Independent Biomodel & Conversion Service Instances', () => {
  const ORDER_UUID = 'ord-test-4040';
  const BIOMODEL_SELLABLE_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const CONVERSION_SELLABLE_UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  let client: ServiceClient;
  let mockTransport: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTransport = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };
    client = new ServiceClient(undefined, true);
    client.reset([]);
  });

  it('creates an independent Biomodel service instance with valid answers', async () => {
    const answers: FormAnswer[] = [
      { fieldCode: 'model_type', value: 'solid', optionCodes: ['solid'] },
      { fieldCode: 'arch_selection', value: 'both', optionCodes: ['both'] },
    ];

    const payload: CreateServiceItem = {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers,
      unitPrice: '120.00',
    };

    const res = await client.create(ORDER_UUID, payload);

    expect(res.data).toBeDefined();
    expect(res.data.uuid).toMatch(/^srv-/);
    expect(res.data.orderUuid).toBe(ORDER_UUID);
    expect(res.data.sellableItemUuid).toBe(BIOMODEL_SELLABLE_UUID);
    expect(res.data.status).toBe('pending_intake');
    expect(res.data.answers).toEqual(answers);
    expect(res.data.quantity).toBe(1);
    expect(res.data.unitPrice).toBe('120.00');
    expect(res.data.lineTotal).toBe('120.00');
    expect(res.data.isBillable).toBe(true);
    expect(res.etag).toMatch(/^W\/"srv-/);
  });

  it('creates an independent Conversion service instance with valid answers', async () => {
    const answers: FormAnswer[] = [
      { fieldCode: 'software', value: 'exocad', optionCodes: ['exocad'] },
      { fieldCode: 'export_format', value: 'stl', optionCodes: ['stl'] },
      { fieldCode: 'nerve_canal_tracing', value: true, valueBoolean: true },
    ];

    const payload: CreateServiceItem = {
      sellableItemUuid: CONVERSION_SELLABLE_UUID,
      answers,
      unitPrice: '90.00',
    };

    const res = await client.create(ORDER_UUID, payload);

    expect(res.data).toBeDefined();
    expect(res.data.uuid).toMatch(/^srv-/);
    expect(res.data.orderUuid).toBe(ORDER_UUID);
    expect(res.data.sellableItemUuid).toBe(CONVERSION_SELLABLE_UUID);
    expect(res.data.answers).toEqual(answers);
    expect(res.data.quantity).toBe(1);
    expect(res.data.unitPrice).toBe('90.00');
    expect(res.data.lineTotal).toBe('90.00');
  });

  it('supports multiple same-type service instances within the same order with unique identities', async () => {
    const item1 = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [{ fieldCode: 'model_type', value: 'solid' }],
      unitPrice: '120.00',
    });

    const item2 = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [{ fieldCode: 'model_type', value: 'hollow' }],
      unitPrice: '140.00',
    });

    expect(item1.data.uuid).not.toBe(item2.data.uuid);
    expect(item1.data.answers[0].value).toBe('solid');
    expect(item2.data.answers[0].value).toBe('hollow');

    const listRes = await client.listByOrder(ORDER_UUID);
    expect(listRes.data).toHaveLength(2);
    expect(listRes.data.map(i => i.uuid)).toContain(item1.data.uuid);
    expect(listRes.data.map(i => i.uuid)).toContain(item2.data.uuid);
  });

  it('enforces default quantity of 1 when omitted and computes lineTotal correctly when quantity is provided', async () => {
    const defaultQty = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [],
      unitPrice: '150.00',
    });
    expect(defaultQty.data.quantity).toBe(1);
    expect(defaultQty.data.lineTotal).toBe('150.00');

    const multiQty = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [],
      unitPrice: '150.00',
      quantity: 3,
    });
    expect(multiQty.data.quantity).toBe(3);
    expect(multiQty.data.lineTotal).toBe('450.00');
  });

  it('supports is_billable flag independently of billedToContactUuid resolution', async () => {
    const nonBillable = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [],
      isBillable: false,
    });
    expect(nonBillable.data.isBillable).toBe(false);

    const billableExplicitContact = await client.create(ORDER_UUID, {
      sellableItemUuid: CONVERSION_SELLABLE_UUID,
      answers: [],
      isBillable: true,
      billedToContactUuid: 'contact-lab-101',
    });
    expect(billableExplicitContact.data.isBillable).toBe(true);
    expect(billableExplicitContact.data.billedToContactUuid).toBe('contact-lab-101');
    expect(billableExplicitContact.data.billedPartyOrigin).toBe('user_selected');
  });

  it('enforces zero-charge constraints: requires zeroChargeReasonCode when unitPrice is 0.00', async () => {
    await expect(
      client.create(ORDER_UUID, {
        sellableItemUuid: BIOMODEL_SELLABLE_UUID,
        answers: [],
        unitPrice: '0.00',
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      client.create(ORDER_UUID, {
        sellableItemUuid: BIOMODEL_SELLABLE_UUID,
        answers: [],
        unitPrice: '0.00',
      })
    ).rejects.toMatchObject({
      code: 'ZERO_CHARGE_REASON_REQUIRED',
    });

    // Valid zero charge with reason code and optional note
    const zeroChargeItem = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [],
      unitPrice: '0.00',
      zeroChargeReasonCode: 'DOCTOR_DISCOUNT',
      zeroChargeNote: 'Courtesy discount applied per practice manager',
    });

    expect(zeroChargeItem.data.unitPrice).toBe('0.00');
    expect(zeroChargeItem.data.lineTotal).toBe('0.00');
    expect(zeroChargeItem.data.zeroChargeReasonCode).toBe('DOCTOR_DISCOUNT');
    expect(zeroChargeItem.data.zeroChargeNote).toBe('Courtesy discount applied per practice manager');
  });

  it('supports redo service instance creation referencing original service item', async () => {
    // Fails when isRedo is true but redoOfItemUuid is missing
    await expect(
      client.create(ORDER_UUID, {
        sellableItemUuid: BIOMODEL_SELLABLE_UUID,
        answers: [],
        isRedo: true,
      })
    ).rejects.toMatchObject({
      code: 'REDO_SOURCE_REQUIRED',
    });

    // Valid redo referencing original instance
    const originalItem = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [{ fieldCode: 'model_type', value: 'solid' }],
    });

    const redoItem = await client.create(ORDER_UUID, {
      sellableItemUuid: BIOMODEL_SELLABLE_UUID,
      answers: [{ fieldCode: 'model_type', value: 'solid' }],
      isRedo: true,
      redoOfItemUuid: originalItem.data.uuid,
    });

    expect(redoItem.data.isRedo).toBe(true);
    expect(redoItem.data.redoOfItemUuid).toBe(originalItem.data.uuid);
    expect(redoItem.data.uuid).not.toBe(originalItem.data.uuid);
  });

  it('rejects payload when sellableItemUuid is missing', async () => {
    await expect(
      client.create(ORDER_UUID, {
        sellableItemUuid: '',
        answers: [],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('in LIVE_HTTP mode (enableMocks: false), propagates server error responses and never fabricates mock data', async () => {
    mockTransport.post.mockRejectedValueOnce(
      new ApiClientError(422, 'Unprocessable Entity: invalid clinical parameters')
    );

    const liveClient = new ServiceClient(mockTransport as unknown as IHttpTransport, false);

    await expect(
      liveClient.create(ORDER_UUID, {
        sellableItemUuid: BIOMODEL_SELLABLE_UUID,
        answers: [],
      })
    ).rejects.toThrow('Unprocessable Entity: invalid clinical parameters');

    expect(mockTransport.post).toHaveBeenCalledTimes(1);
    expect(mockTransport.post).toHaveBeenCalledWith(
      `/orders/${ORDER_UUID}/services`,
      expect.objectContaining({ sellableItemUuid: BIOMODEL_SELLABLE_UUID })
    );
  });
});
