import type { IHttpTransport } from './httpTransport';
import type { WithVersion } from './types';
import type {
  ServiceItem,
  CreateServiceItem,
  PatchServiceItem,
  FormAnswer
} from './contractTypes';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
  ApiClientError
} from './errors';

export interface IServiceClient {
  listByOrder(orderUuid: string): Promise<WithVersion<ServiceItem[]>>;
  create(orderUuid: string, payload: CreateServiceItem): Promise<WithVersion<ServiceItem>>;
  get(serviceItemUuid: string): Promise<WithVersion<ServiceItem>>;
  edit(serviceItemUuid: string, patch: PatchServiceItem, ifMatch?: string): Promise<WithVersion<ServiceItem>>;
  reset(seedItems?: ServiceItem[]): void;
}

export class ServiceItemNotFoundError extends ApiClientError {
  constructor(serviceItemUuid: string) {
    super(404, `Service item with UUID "${serviceItemUuid}" was not found.`);
    this.name = 'ServiceItemNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Strips client-controlled provenance or internal fields before dispatch.
 */
function sanitizeCreatePayload(payload: CreateServiceItem): Record<string, unknown> {
  const { sellableItemUuid, answers, isRedo, redoOfItemUuid, serviceNotes, billedToContactUuid, isBillable, unitPrice, quantity, zeroChargeReasonCode, zeroChargeNote } = payload;
  const clean: Record<string, unknown> = {
    sellableItemUuid,
    answers: answers || [],
  };
  if (isRedo !== undefined) clean.isRedo = isRedo;
  if (redoOfItemUuid) clean.redoOfItemUuid = redoOfItemUuid;
  if (serviceNotes) clean.serviceNotes = serviceNotes;
  if (billedToContactUuid) clean.billedToContactUuid = billedToContactUuid;
  if (isBillable !== undefined) clean.isBillable = isBillable;
  if (unitPrice !== undefined) clean.unitPrice = unitPrice;
  if (quantity !== undefined) clean.quantity = quantity;
  if (zeroChargeReasonCode !== undefined) clean.zeroChargeReasonCode = zeroChargeReasonCode;
  if (zeroChargeNote !== undefined) clean.zeroChargeNote = zeroChargeNote;
  return clean;
}

export class ServiceClient implements IServiceClient {
  private transport?: IHttpTransport;
  private enableMocks: boolean;
  private mockStore: Map<string, { item: ServiceItem; etag: string }> = new Map();
  private revisionCounter = 1;

  constructor(transport?: IHttpTransport, enableMocks = true) {
    this.transport = transport;
    this.enableMocks = enableMocks;
    this.initDefaultMocks();
  }

  private initDefaultMocks(): void {
    const item1: ServiceItem = {
      uuid: 'srv-biomodel-001',
      orderUuid: 'ord-1001',
      sellableItemUuid: 'cat-biomodel-sellable',
      status: 'pending_intake',
      answers: [{ fieldCode: 'model_type', value: 'solid' }],
      billedToContactUuid: 'contact-clinic-99',
      billedPartyOrigin: 'order_default',
      isBillable: true,
      unitPrice: '120.00',
      quantity: 1,
      lineTotal: '120.00',
    };

    const item2: ServiceItem = {
      uuid: 'srv-biomodel-002', // Repeated same-type instance under same order
      orderUuid: 'ord-1001',
      sellableItemUuid: 'cat-biomodel-sellable',
      status: 'pending_intake',
      answers: [{ fieldCode: 'model_type', value: 'hollow' }],
      billedToContactUuid: 'contact-clinic-99',
      billedPartyOrigin: 'order_default',
      isBillable: true,
      unitPrice: '140.00',
      quantity: 1,
      lineTotal: '140.00',
    };

    this.mockStore.set(item1.uuid, { item: item1, etag: 'W/"v1-srv-biomodel-001"' });
    this.mockStore.set(item2.uuid, { item: item2, etag: 'W/"v1-srv-biomodel-002"' });
  }

  public reset(seedItems?: ServiceItem[]): void {
    this.mockStore.clear();
    this.revisionCounter = 1;
    if (seedItems) {
      for (const it of seedItems) {
        this.mockStore.set(it.uuid, { item: { ...it }, etag: `W/"v1-${it.uuid}"` });
      }
    } else {
      this.initDefaultMocks();
    }
  }

  public async listByOrder(orderUuid: string): Promise<WithVersion<ServiceItem[]>> {
    if (this.transport) {
      try {
        const res = await this.transport.get<ServiceItem[]>(`/orders/${orderUuid}/services`);
        return {
          data: res.data,
          etag: res.etag || `W/"order-${orderUuid}-${Date.now()}"`,
        };
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    const items = Array.from(this.mockStore.values())
      .filter(v => v.item.orderUuid === orderUuid)
      .map(v => ({ ...v.item }));

    return {
      data: items,
      etag: `W/"mock-order-${orderUuid}-${this.revisionCounter}"`,
    };
  }

  public async create(orderUuid: string, payload: CreateServiceItem): Promise<WithVersion<ServiceItem>> {
    if (!payload.sellableItemUuid) {
      throw new ValidationError({ code: 'VALIDATION_ERROR', message: 'sellableItemUuid is required' });
    }

    const cleanPayload = sanitizeCreatePayload(payload);

    if (this.transport) {
      try {
        const res = await this.transport.post<ServiceItem>(`/orders/${orderUuid}/services`, cleanPayload);
        return {
          data: res.data,
          etag: res.etag || `W/"srv-${res.data.uuid}-1"`,
        };
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback: create independent instance identity
    const instanceUuid = `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdItem: ServiceItem = {
      uuid: instanceUuid,
      orderUuid,
      sellableItemUuid: payload.sellableItemUuid,
      status: 'pending_intake',
      answers: payload.answers ? JSON.parse(JSON.stringify(payload.answers)) : [],
      billedToContactUuid: payload.billedToContactUuid || 'contact-default-order',
      billedPartyOrigin: payload.billedToContactUuid ? 'user_selected' : 'order_default',
      isBillable: payload.isBillable !== undefined ? payload.isBillable : true,
      unitPrice: payload.unitPrice || '100.00',
      quantity: payload.quantity || 1,
      lineTotal: payload.unitPrice ? (Number(payload.unitPrice) * (payload.quantity || 1)).toFixed(2) : '100.00',
      isRedo: payload.isRedo || false,
      serviceNotes: payload.serviceNotes,
      zeroChargeReasonCode: payload.zeroChargeReasonCode || null,
      zeroChargeNote: payload.zeroChargeNote || null,
    };

    const initialEtag = `W/"srv-${instanceUuid}-rev1"`;
    this.mockStore.set(instanceUuid, { item: createdItem, etag: initialEtag });

    return {
      data: { ...createdItem },
      etag: initialEtag,
    };
  }

  public async get(serviceItemUuid: string): Promise<WithVersion<ServiceItem>> {
    if (this.transport) {
      try {
        const res = await this.transport.get<ServiceItem>(`/services/${serviceItemUuid}`);
        return {
          data: res.data,
          etag: res.etag || `W/"srv-${serviceItemUuid}-1"`,
        };
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    const entry = this.mockStore.get(serviceItemUuid);
    if (!entry) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }

    return {
      data: { ...entry.item },
      etag: entry.etag,
    };
  }

  public async edit(
    serviceItemUuid: string,
    patch: PatchServiceItem,
    ifMatch?: string
  ): Promise<WithVersion<ServiceItem>> {
    if (!ifMatch) {
      throw new PreconditionRequiredError('An If-Match header containing the current ETag is required to edit a service item.');
    }

    if (this.transport) {
      try {
        const res = await this.transport.patch<ServiceItem>(`/services/${serviceItemUuid}`, patch, { ifMatch });
        return {
          data: res.data,
          etag: res.etag || `W/"srv-${serviceItemUuid}-${Date.now()}"`,
        };
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    const entry = this.mockStore.get(serviceItemUuid);
    if (!entry) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }

    if (entry.etag !== ifMatch) {
      throw new PreconditionFailedError('The provided If-Match tag does not match the current service item revision.');
    }

    // Rotate ETag on mutation
    this.revisionCounter++;
    const rotatedEtag = `W/"srv-${serviceItemUuid}-rev${this.revisionCounter}"`;

    const updated: ServiceItem = {
      ...entry.item,
      ...(patch.answers ? { answers: JSON.parse(JSON.stringify(patch.answers)) } : {}),
      ...(patch.isBillable !== undefined ? { isBillable: patch.isBillable } : {}),
      ...(patch.billedToContactUuid ? { billedToContactUuid: patch.billedToContactUuid, billedPartyOrigin: 'user_selected' } : {}),
      ...(patch.unitPrice !== undefined ? { unitPrice: patch.unitPrice } : {}),
      ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
      ...(patch.zeroChargeReasonCode !== undefined ? { zeroChargeReasonCode: patch.zeroChargeReasonCode } : {}),
      ...(patch.zeroChargeNote !== undefined ? { zeroChargeNote: patch.zeroChargeNote } : {}),
      ...(patch.serviceNotes !== undefined ? { serviceNotes: patch.serviceNotes } : {}),
    };

    this.mockStore.set(serviceItemUuid, { item: updated, etag: rotatedEtag });

    return {
      data: { ...updated },
      etag: rotatedEtag,
    };
  }
}

export const serviceClient = new ServiceClient();
