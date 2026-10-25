import type { IHttpTransport } from './httpTransport';
import type { IServiceClient } from './serviceClient';
import { serviceClient } from './serviceClient';
import type { WithVersion } from './types';
import type {
  ZeroChargeReason,
  ServiceItem,
  PatchServiceItem,
} from './contractTypes';
import {
  PreconditionRequiredError,
  PermissionDeniedError,
  ValidationError,
} from './errors';
import { SYNTHETIC_DEMO_ZERO_CHARGE_REASONS } from './serviceItemPricingMockAdapter';

export interface PriceUpdateParams {
  unitPrice?: string;
  quantity?: number;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string | null;
  isBillable?: boolean;
}

export interface IPricingClient {
  getZeroChargeReasons(): Promise<ZeroChargeReason[]>;
  validatePricingRules(
    currentService: ServiceItem,
    params: PriceUpdateParams,
    callerIsAuthorized?: boolean
  ): void;
  updatePricing(
    serviceItemUuid: string,
    params: PriceUpdateParams,
    ifMatch?: string,
    callerIsAuthorized?: boolean
  ): Promise<WithVersion<ServiceItem>>;
}

export class PricingClient implements IPricingClient {
  private transport?: IHttpTransport;
  private srvClient: IServiceClient;
  private enableMocks: boolean;

  constructor(transport?: IHttpTransport, srvClient: IServiceClient = serviceClient, enableMocks = true) {
    this.transport = transport;
    this.srvClient = srvClient;
    this.enableMocks = enableMocks;
  }

  public async getZeroChargeReasons(): Promise<ZeroChargeReason[]> {
    if (this.transport) {
      try {
        const res = await this.transport.get<ZeroChargeReason[]>('/lookups/zero-charge-reasons');
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    return SYNTHETIC_DEMO_ZERO_CHARGE_REASONS.map(r => ({
      code: r.code,
      label: r.label,
      active: true,
      description: 'Demo fixture',
    }));
  }

  public validatePricingRules(
    currentService: ServiceItem,
    params: PriceUpdateParams,
    callerIsAuthorized = true
  ): void {
    // 1. Authorization check
    if (params.unitPrice !== undefined && params.unitPrice !== currentService.unitPrice) {
      if (currentService.canEditPrice === false || !callerIsAuthorized) {
        throw new PermissionDeniedError('You do not have permission to override service pricing.');
      }
    }

    // 2. Unit price format validation
    if (params.unitPrice !== undefined) {
      const priceNum = parseFloat(params.unitPrice);
      if (isNaN(priceNum) || priceNum < 0 || !/^\d+(\.\d{1,2})?$/.test(params.unitPrice.trim())) {
        throw new ValidationError({
          code: 'VALIDATION_ERROR',
          message: 'Unit price must be a valid non-negative decimal with up to 2 decimal places.',
          details: { field: 'unitPrice' },
        });
      }
    }

    // 3. Quantity validation
    if (params.quantity !== undefined) {
      if (!Number.isInteger(params.quantity) || params.quantity < 1) {
        throw new ValidationError({
          code: 'VALIDATION_ERROR',
          message: 'Quantity must be an integer greater than or equal to 1.',
          details: { field: 'quantity' },
        });
      }
    }

    // 4. Zero-charge reason enforcement (Q-B10 ck_order_items__zero_charge_has_reason)
    const effectiveUnitPriceStr = params.unitPrice !== undefined ? params.unitPrice : currentService.unitPrice || '0';
    const effectiveQty = params.quantity !== undefined ? params.quantity : currentService.quantity || 1;
    const effectiveLineTotal = parseFloat(effectiveUnitPriceStr) * effectiveQty;

    const effectiveReasonCode = params.zeroChargeReasonCode !== undefined
      ? params.zeroChargeReasonCode
      : currentService.zeroChargeReasonCode;

    if (effectiveLineTotal === 0) {
      if (!effectiveReasonCode || typeof effectiveReasonCode !== 'string' || effectiveReasonCode.trim() === '') {
        throw new ValidationError({
          code: 'ZERO_CHARGE_REASON_REQUIRED',
          message: 'When line total is $0.00, a non-empty zeroChargeReasonCode is strictly mandatory (Q-B10).',
          details: { field: 'zeroChargeReasonCode' },
        });
      }
    }
  }

  public async updatePricing(
    serviceItemUuid: string,
    params: PriceUpdateParams,
    ifMatch?: string,
    callerIsAuthorized = true
  ): Promise<WithVersion<ServiceItem>> {
    if (!ifMatch) {
      throw new PreconditionRequiredError('An If-Match header is required for pricing mutations.');
    }

    // Fetch existing entity to validate business rules
    const existing = await this.srvClient.get(serviceItemUuid);
    this.validatePricingRules(existing.data, params, callerIsAuthorized);

    const patch: PatchServiceItem = {};
    if (params.unitPrice !== undefined) patch.unitPrice = params.unitPrice;
    if (params.quantity !== undefined) patch.quantity = params.quantity;
    if (params.zeroChargeReasonCode !== undefined) patch.zeroChargeReasonCode = params.zeroChargeReasonCode;
    if (params.zeroChargeNote !== undefined) patch.zeroChargeNote = params.zeroChargeNote || undefined;
    if (params.isBillable !== undefined) patch.isBillable = params.isBillable;

    return this.srvClient.edit(serviceItemUuid, patch, ifMatch);
  }
}

export const pricingClient = new PricingClient();
