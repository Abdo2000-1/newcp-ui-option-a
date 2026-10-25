import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingClient } from '../pricingClient';
import { ServiceClient } from '../serviceClient';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  PermissionDeniedError,
  ValidationError,
} from '../errors';
import type { ServiceItem } from '../contractTypes';

describe('PricingClient (T-API-007)', () => {
  let srvClient: ServiceClient;
  let pricingClient: PricingClient;

  const mockItem: ServiceItem = {
    uuid: 'srv-price-001',
    orderUuid: 'ord-price-1',
    sellableItemUuid: 'item-crown-premium',
    status: 'pending_intake',
    answers: [],
    billedToContactUuid: 'contact-clinic-99',
    billedPartyOrigin: 'order_default',
    isBillable: true,
    canEditPrice: true,
    unitPrice: '150.00',
    quantity: 1,
    lineTotal: '150.00',
    currencyCode: 'USD',
  };

  beforeEach(() => {
    srvClient = new ServiceClient(undefined, true);
    srvClient.reset([mockItem]);
    pricingClient = new PricingClient(undefined, srvClient, true);
  });

  describe('getZeroChargeReasons', () => {
    it('returns available zero charge reasons', async () => {
      const reasons = await pricingClient.getZeroChargeReasons();
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some(r => r.code === 'SYNTHETIC_WARRANTY_REMAKE')).toBe(true);
      expect(reasons.every(r => r.active)).toBe(true);
    });
  });

  describe('validatePricingRules & authorizations', () => {
    it('throws PermissionDeniedError when clerk is unauthorized to edit price', () => {
      const lockedItem: ServiceItem = { ...mockItem, canEditPrice: false };
      expect(() => {
        pricingClient.validatePricingRules(lockedItem, { unitPrice: '120.00' }, true);
      }).toThrow(PermissionDeniedError);

      expect(() => {
        pricingClient.validatePricingRules(mockItem, { unitPrice: '120.00' }, false);
      }).toThrow(PermissionDeniedError);
    });

    it('allows price change when clerk and item are authorized', () => {
      expect(() => {
        pricingClient.validatePricingRules(mockItem, { unitPrice: '120.00' }, true);
      }).not.toThrow();
    });

    it('rejects invalid or negative unitPrice values', () => {
      expect(() => {
        pricingClient.validatePricingRules(mockItem, { unitPrice: '-10.00' });
      }).toThrow(ValidationError);

      expect(() => {
        pricingClient.validatePricingRules(mockItem, { unitPrice: 'abc' });
      }).toThrow(ValidationError);
    });

    it('rejects invalid quantity values', () => {
      expect(() => {
        pricingClient.validatePricingRules(mockItem, { quantity: 0 });
      }).toThrow(ValidationError);

      expect(() => {
        pricingClient.validatePricingRules(mockItem, { quantity: 1.5 });
      }).toThrow(ValidationError);
    });

    it('enforces mandatory zeroChargeReasonCode when line total is 0.00 (Q-B10)', () => {
      expect(() => {
        pricingClient.validatePricingRules(mockItem, { unitPrice: '0.00' });
      }).toThrow(ValidationError);

      expect(() => {
        pricingClient.validatePricingRules(mockItem, {
          unitPrice: '0.00',
          zeroChargeReasonCode: 'SYNTHETIC_WARRANTY_REMAKE',
        });
      }).not.toThrow();
    });

    it('preserves independent isBillable without forcing zero charge reason', () => {
      // isBillable = false on a $150 item is valid and does NOT require zeroChargeReasonCode
      expect(() => {
        pricingClient.validatePricingRules(mockItem, { isBillable: false });
      }).not.toThrow();
    });
  });

  describe('updatePricing execution', () => {
    it('throws PreconditionRequiredError when ifMatch is missing', async () => {
      await expect(
        pricingClient.updatePricing('srv-price-001', { unitPrice: '100.00' })
      ).rejects.toThrow(PreconditionRequiredError);
    });

    it('updates pricing and rotates ETag on valid authorized mutation', async () => {
      const initial = await srvClient.get('srv-price-001');
      const updated = await pricingClient.updatePricing(
        'srv-price-001',
        {
          unitPrice: '180.00',
          quantity: 2,
        },
        initial.etag
      );

      expect(updated.data.unitPrice).toBe('180.00');
      expect(updated.data.quantity).toBe(2);
      expect(updated.data.lineTotal).toBe('360.00');
      expect(updated.etag).not.toBe(initial.etag);
    });

    it('throws PreconditionFailedError on stale ETag', async () => {
      await expect(
        pricingClient.updatePricing(
          'srv-price-001',
          { unitPrice: '180.00' },
          'W/"stale-tag"'
        )
      ).rejects.toThrow(PreconditionFailedError);
    });
  });
});
