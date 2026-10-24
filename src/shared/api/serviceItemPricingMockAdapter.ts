/**
 * ============================================================================
 * OFFLINE MOCK SERVICE-ITEM PRICING OVERRIDE ADAPTER (V0.9.2.2 / Q-B10)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * EXPLICIT ARCHITECTURAL AND INTEGRATION NOTICE:
 * 1. This adapter is strictly an isolated, in-memory mock test double enforcing
 *    the approved Q-B10 pricing override and zero-charge validation policies.
 * 2. It contains ZERO live network calls, ZERO database connections, and ZERO
 *    browser storage operations.
 * 3. Initial unit prices are synthetic contract/backend-derived input fixtures
 *    (SYNTHETIC_MOCK_SERVICES). No pricing endpoint or frontend-calculated
 *    default is invented.
 * 4. A price override requires BOTH an explicit authorization signal from caller
 *    (`isAuthorized: true`) AND item `canEditPrice: true`. Real role names or
 *    permission schema mappings remain unconfirmed runtime decisions.
 * 5. Deterministic validation rejects negative, non-finite, and malformed prices
 *    before mutating in-memory state.
 * 6. When the final line amount is zero, a non-empty `zeroChargeReasonCode` is
 *    strictly required, returning HTTP 422 `ZERO_CHARGE_REASON_REQUIRED` with
 *    `details.field = 'zeroChargeReasonCode'`.
 * 7. Non-billable items (`isBillable: false`) are NOT automatically zero-charge;
 *    `isBillable` is preserved independently from unitPrice and zero-charge reason.
 * 8. Accepted Q-B8 ETag / If-Match optimistic concurrency semantics are reused;
 *    concurrency checks reject stale mutations with HTTP 412 / 428.
 * 9. Payer fields (`billedToContactUuid`, `billedPartyOrigin`) remain untouched.
 *    F07 service-level payer persistence remains completely BLOCKED by the
 *    missing V3 database schema columns.
 * 10. Peer items remain completely isolated across both valid and rejected
 *     mutations.
 */

import { ApiClientError } from './errors';
import {
  SYNTHETIC_MOCK_SERVICES,
  computeMockETag,
  PreconditionRequiredError,
  PreconditionFailedError,
  ServiceItemNotFoundError,
} from './serviceInstanceMockAdapter';
import type {
  ServiceItem,
  WithVersion,
  PriceOverrideRequest,
  PriceOverrideResult,
  IServiceItemPricingMockAdapter,
} from './types';

// ============================================================================
// Synthetic Demo Zero-Charge Reasons Lookup (MOCK / DEMO ONLY)
// ============================================================================

export interface ZeroChargeReasonOption {
  code: string;
  label: string;
  isTemporary: boolean;
}

export const SYNTHETIC_DEMO_ZERO_CHARGE_REASONS: readonly ZeroChargeReasonOption[] = [
  {
    code: 'SYNTHETIC_WARRANTY_REMAKE',
    label: 'Demo only — Warranty remake',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_CLINICAL_GOODWILL',
    label: 'Demo only — Clinical goodwill adjustment',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_MARKETING_PROMOTION',
    label: 'Demo only — Promotional courtesy',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_TRAINING',
    label: 'Demo only — Internal training case',
    isTemporary: true,
  },
] as const;

// ============================================================================
// Typed Error Classes for Pricing & Override Policy
// ============================================================================

export class PricingValidationError extends ApiClientError {
  public readonly code: string;
  public readonly field?: string;
  public readonly details: { field?: string; [key: string]: unknown };

  constructor(
    status: number,
    message: string,
    code: string,
    field?: string,
    details?: { field?: string; [key: string]: unknown }
  ) {
    super(status, message, typeof details === 'string' ? details : undefined, code);
    this.name = 'PricingValidationError';
    this.code = code;
    this.field = field;
    this.details = details ?? (field ? { field } : {});
    Object.setPrototypeOf(this, PricingValidationError.prototype);
  }

  get isZeroChargeReasonRequired(): boolean {
    return this.code === 'ZERO_CHARGE_REASON_REQUIRED';
  }

  get isPriceNotAuthorized(): boolean {
    return this.code === 'PRICE_OVERRIDE_NOT_AUTHORIZED';
  }

  get isPriceDisallowed(): boolean {
    return this.code === 'PRICE_OVERRIDE_DISALLOWED';
  }

  get isInvalidPriceValue(): boolean {
    return this.code === 'INVALID_PRICE_VALUE';
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// Service-Item Pricing Mock Adapter Class
// ============================================================================

export class ServiceItemPricingMockAdapter implements IServiceItemPricingMockAdapter {
  private items: Map<string, ServiceItem> = new Map();
  private revisions: Map<string, number> = new Map();
  private originalBasePrices: Map<string, string> = new Map();

  constructor(seedItems: ServiceItem[] = SYNTHETIC_MOCK_SERVICES) {
    this.reset(seedItems);
  }

  /**
   * Resets in-memory state to pristine seed fixtures.
   */
  public reset(seedItems: ServiceItem[] = SYNTHETIC_MOCK_SERVICES): void {
    this.items.clear();
    this.revisions.clear();
    this.originalBasePrices.clear();

    for (const item of seedItems) {
      this.items.set(item.uuid, deepClone(item));
      this.revisions.set(item.uuid, 1);
      if (item.unitPrice !== undefined) {
        this.originalBasePrices.set(item.uuid, item.unitPrice);
      }
    }
  }

  /**
   * Returns temporary synthetic zero-charge reasons.
   */
  public getZeroChargeReasons(): ZeroChargeReasonOption[] {
    return deepClone(SYNTHETIC_DEMO_ZERO_CHARGE_REASONS as ZeroChargeReasonOption[]);
  }

  /**
   * Reads a service instance by UUID with version/ETag.
   */
  public async getItem(serviceItemUuid: string): Promise<WithVersion<ServiceItem>> {
    const item = this.items.get(serviceItemUuid);
    if (!item) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }
    const rev = this.revisions.get(serviceItemUuid) ?? 1;
    return {
      data: deepClone(item),
      etag: computeMockETag(item, rev),
    };
  }

  /**
   * Applies an authorized CP price override to a service item (Q-B10).
   *
   * Enforces:
   * 1. Service item existence (404 NOT_FOUND).
   * 2. Caller authorization signal (`request.isAuthorized === true`) (403 PRICE_OVERRIDE_NOT_AUTHORIZED).
   * 3. Item-level price editability (`item.canEditPrice !== false`) (403 PRICE_OVERRIDE_DISALLOWED).
   * 4. Numeric validity of price: non-negative, finite, well-formed (422 INVALID_PRICE_VALUE).
   * 5. Numeric validity of quantity if provided (422 INVALID_QUANTITY_VALUE).
   * 6. Zero-charge reason requirement: if line amount is zero, non-empty `zeroChargeReasonCode` is mandatory
   *    (422 ZERO_CHARGE_REASON_REQUIRED with details.field = 'zeroChargeReasonCode').
   * 7. Concurrency check (428 PRECONDITION_REQUIRED, 412 PRECONDITION_FAILED) when `ifMatch` is provided.
   * 8. Independent preservation of `isBillable`, `billedToContactUuid`, and `billedPartyOrigin`.
   * 9. State persistence in memory: override persists on subsequent re-reads.
   * 10. Strict failure isolation: zero mutation on failure; peer items remain unaffected.
   */
  public async overridePrice(
    serviceItemUuid: string,
    request: PriceOverrideRequest,
    ifMatch?: string
  ): Promise<PriceOverrideResult> {
    // 1. Existence check
    const existing = this.items.get(serviceItemUuid);
    if (!existing) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }

    // 2. Authorization signal check (Q-B10: explicit signal required from caller)
    if (!request || request.isAuthorized !== true) {
      throw new PricingValidationError(
        403,
        'MOCK: Price override requires an explicit authorization signal from the caller.',
        'PRICE_OVERRIDE_NOT_AUTHORIZED',
        'isAuthorized',
        { field: 'isAuthorized' }
      );
    }

    // 3. Item editability check
    if (existing.canEditPrice === false) {
      throw new PricingValidationError(
        403,
        'MOCK: Price override is disallowed for this service item (canEditPrice is false).',
        'PRICE_OVERRIDE_DISALLOWED',
        'canEditPrice',
        { field: 'canEditPrice' }
      );
    }

    // 4. Concurrency check (ETag / If-Match) if provided
    if (ifMatch !== undefined) {
      if (typeof ifMatch !== 'string' || ifMatch.trim() === '') {
        throw new PreconditionRequiredError();
      }
      const currentRev = this.revisions.get(serviceItemUuid) ?? 1;
      const currentETag = computeMockETag(existing, currentRev);
      if (ifMatch !== currentETag && ifMatch !== '*') {
        throw new PreconditionFailedError();
      }
    }

    // 5. Price value validation (non-negative, finite, well-formed)
    if (
      request.unitPrice === undefined ||
      request.unitPrice === null ||
      (typeof request.unitPrice !== 'string' && typeof request.unitPrice !== 'number')
    ) {
      throw new PricingValidationError(
        422,
        'MOCK: Price value must be specified as a valid numeric string or number.',
        'INVALID_PRICE_VALUE',
        'unitPrice',
        { field: 'unitPrice', value: request.unitPrice }
      );
    }

    const priceStr = String(request.unitPrice).trim();
    if (priceStr === '' || !/^-?\d+(\.\d+)?$/.test(priceStr)) {
      throw new PricingValidationError(
        422,
        `MOCK: Price value "${priceStr}" is not a well-formed numeric representation.`,
        'INVALID_PRICE_VALUE',
        'unitPrice',
        { field: 'unitPrice', value: priceStr }
      );
    }

    const parsedPrice = Number(priceStr);
    if (!Number.isFinite(parsedPrice)) {
      throw new PricingValidationError(
        422,
        'MOCK: Price value must be finite.',
        'INVALID_PRICE_VALUE',
        'unitPrice',
        { field: 'unitPrice', value: priceStr }
      );
    }

    if (parsedPrice < 0) {
      throw new PricingValidationError(
        422,
        `MOCK: Price value cannot be negative (received ${parsedPrice}).`,
        'INVALID_PRICE_VALUE',
        'unitPrice',
        { field: 'unitPrice', value: parsedPrice }
      );
    }

    // 6. Quantity validation
    let effectiveQuantity = existing.quantity ?? 1;
    if (request.quantity !== undefined) {
      if (
        typeof request.quantity !== 'number' ||
        !Number.isFinite(request.quantity) ||
        request.quantity < 0 ||
        !Number.isInteger(request.quantity)
      ) {
        throw new PricingValidationError(
          422,
          `MOCK: Quantity must be a non-negative integer (received ${request.quantity}).`,
          'INVALID_QUANTITY_VALUE',
          'quantity',
          { field: 'quantity', value: request.quantity }
        );
      }
      effectiveQuantity = request.quantity;
    }

    // 7. Final line amount calculation and zero-charge reason validation
    const lineAmount = parsedPrice * effectiveQuantity;
    const isZeroAmount = lineAmount === 0 || parsedPrice === 0;

    if (isZeroAmount) {
      if (
        !request.zeroChargeReasonCode ||
        typeof request.zeroChargeReasonCode !== 'string' ||
        request.zeroChargeReasonCode.trim() === ''
      ) {
        throw new PricingValidationError(
          422,
          'MOCK: A non-empty zeroChargeReasonCode is required when line amount is zero.',
          'ZERO_CHARGE_REASON_REQUIRED',
          'zeroChargeReasonCode',
          { field: 'zeroChargeReasonCode' }
        );
      }
    }

    // 8. Apply mutation atomically to in-memory state
    const currentRev = this.revisions.get(serviceItemUuid) ?? 1;
    const updated: ServiceItem = deepClone(existing);

    // Update pricing fields
    updated.unitPrice = parsedPrice.toFixed(2);
    updated.quantity = effectiveQuantity;
    updated.lineTotal = lineAmount.toFixed(2);

    if (isZeroAmount) {
      updated.zeroChargeReasonCode = request.zeroChargeReasonCode!.trim();
      updated.zeroChargeNote = request.zeroChargeNote ? request.zeroChargeNote.trim() : null;
    } else {
      updated.zeroChargeReasonCode = null;
      updated.zeroChargeNote = null;
    }

    // PRESERVATION RULES (strict invariants):
    // - isBillable is preserved independently and is never altered by pricing
    updated.isBillable = existing.isBillable;
    updated.canEditBillability = existing.canEditBillability;
    // - Payer fields remain untouched (F07 Bill To remains unpersisted)
    updated.billedToContactUuid = existing.billedToContactUuid;
    updated.billedPartyOrigin = existing.billedPartyOrigin;
    updated.canEditBilledParty = existing.canEditBilledParty;

    // Rotate revision and compute new ETag
    const nextRev = currentRev + 1;
    const nextETag = computeMockETag(updated, nextRev);

    this.items.set(serviceItemUuid, deepClone(updated));
    this.revisions.set(serviceItemUuid, nextRev);

    return {
      item: deepClone(updated),
      etag: nextETag,
      overrideApplied: true,
      syntheticBaseUnitPrice: this.originalBasePrices.get(serviceItemUuid),
    };
  }
}
