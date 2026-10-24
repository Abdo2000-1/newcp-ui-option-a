/**
 * ============================================================================
 * UNIT TESTS: ServiceItemPricingMockAdapter (V0.9.2.2 / Q-B10)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * EXPLICIT ARCHITECTURAL AND INTEGRATION NOTICE:
 * 1. This test suite verifies the offline mock pricing override adapter enforcing
 *    approved Q-B10 rules: synthetic backend-derived initial prices, authorized CP
 *    price overrides, in-memory override persistence, and zero-charge reason validation.
 * 2. It contains ZERO live network calls, ZERO database connections, and ZERO
 *    browser storage operations.
 * 3. Initial unit prices are synthetic contract/backend-derived input fixtures
 *    (SYNTHETIC_MOCK_SERVICES). No pricing endpoint or frontend-calculated
 *    default is invented.
 * 4. F07 service-level payer persistence (billed_to_contact_id and billed_party_origin)
 *    remains completely BLOCKED by the missing V3 database schema columns.
 * 5. Runtime monetary precision and real role/permission configurations remain
 *    unconfirmed runtime decisions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ServiceItemPricingMockAdapter,
  PricingValidationError,
  SYNTHETIC_DEMO_ZERO_CHARGE_REASONS,
} from '../serviceItemPricingMockAdapter';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ServiceItemNotFoundError,
} from '../serviceInstanceMockAdapter';
import type { PriceOverrideRequest, ServiceItem } from '../types';

describe('ServiceItemPricingMockAdapter (MOCK / NOT_INTEGRATED — Q-B10)', () => {
  let adapter: ServiceItemPricingMockAdapter;

  const ITEM_1_UUID = '00000000-0000-0000-0000-000000000014';
  const ITEM_2_UUID = '00000000-0000-0000-0000-000000000015';
  const UNKNOWN_UUID = '00000000-0000-0000-0000-999999999999';

  beforeEach(() => {
    adapter = new ServiceItemPricingMockAdapter();
  });

  describe('Synthetic Initial Fixtures & Read-Only Access', () => {
    it('initializes with synthetic backend/contract-derived unit prices', async () => {
      const item1 = await adapter.getItem(ITEM_1_UUID);
      expect(item1.data.unitPrice).toBe('20.00');
      expect(item1.data.quantity).toBe(1);
      expect(item1.data.lineTotal).toBe('20.00');
      expect(item1.data.zeroChargeReasonCode).toBeNull();
      expect(item1.data.canEditPrice).toBe(true);

      const item2 = await adapter.getItem(ITEM_2_UUID);
      expect(item2.data.unitPrice).toBe('20.00');
      expect(item2.data.lineTotal).toBe('20.00');
    });

    it('returns deep clones from getItem to prevent external tampering', async () => {
      const item = await adapter.getItem(ITEM_1_UUID);
      item.data.unitPrice = '999.99';

      const reread = await adapter.getItem(ITEM_1_UUID);
      expect(reread.data.unitPrice).toBe('20.00');
    });

    it('throws ServiceItemNotFoundError (404) for unknown service UUID', async () => {
      await expect(adapter.getItem(UNKNOWN_UUID)).rejects.toThrow(ServiceItemNotFoundError);
    });

    it('lists temporary synthetic zero-charge reasons', () => {
      const reasons = adapter.getZeroChargeReasons();
      expect(reasons).toHaveLength(4);
      expect(reasons.every((r) => r.isTemporary)).toBe(true);
      expect(reasons.map((r) => r.code)).toEqual([
        'SYNTHETIC_WARRANTY_REMAKE',
        'SYNTHETIC_CLINICAL_GOODWILL',
        'SYNTHETIC_MARKETING_PROMOTION',
        'SYNTHETIC_INTERNAL_TRAINING',
      ]);
    });
  });

  describe('Authorization and Permission Guards (Q-B10 Requirement 2)', () => {
    it('rejects override when caller authorization signal is false or missing (403)', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const unauthorizedRequests = [
        { unitPrice: '25.00', isAuthorized: false } as PriceOverrideRequest,
        { unitPrice: '25.00' } as unknown as PriceOverrideRequest,
        { unitPrice: '25.00', isAuthorized: undefined } as unknown as PriceOverrideRequest,
      ];

      for (const req of unauthorizedRequests) {
        await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
          PricingValidationError
        );
        try {
          await adapter.overridePrice(ITEM_1_UUID, req);
        } catch (err: unknown) {
          const pErr = err as PricingValidationError;
          expect(pErr.status).toBe(403);
          expect(pErr.code).toBe('PRICE_OVERRIDE_NOT_AUTHORIZED');
          expect(pErr.field).toBe('isAuthorized');
        }
      }

      // Assert state was not mutated
      const current = await adapter.getItem(ITEM_1_UUID);
      expect(current.data.unitPrice).toBe(initial.data.unitPrice);
      expect(current.etag).toBe(initial.etag);
    });

    it('rejects override when item canEditPrice is false (403)', async () => {
      const lockedItem: ServiceItem = {
        ...(await adapter.getItem(ITEM_1_UUID)).data,
        canEditPrice: false,
      };
      adapter.reset([lockedItem]);

      const req: PriceOverrideRequest = { unitPrice: '30.00', isAuthorized: true };

      await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
        PricingValidationError
      );
      try {
        await adapter.overridePrice(ITEM_1_UUID, req);
      } catch (err: unknown) {
        const pErr = err as PricingValidationError;
        expect(pErr.status).toBe(403);
        expect(pErr.code).toBe('PRICE_OVERRIDE_DISALLOWED');
        expect(pErr.field).toBe('canEditPrice');
      }
    });
  });

  describe('Input Validation: Negative, Non-Finite, and Malformed Prices (Q-B10 Requirement 4)', () => {
    it('rejects negative prices deterministically with 422 before mutation', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const negativeValues = ['-1', '-0.01', '-50.00', -15];
      for (const val of negativeValues) {
        const req: PriceOverrideRequest = {
          unitPrice: val as unknown as string,
          isAuthorized: true,
        };

        await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
          PricingValidationError
        );
        try {
          await adapter.overridePrice(ITEM_1_UUID, req);
        } catch (err: unknown) {
          const pErr = err as PricingValidationError;
          expect(pErr.status).toBe(422);
          expect(pErr.code).toBe('INVALID_PRICE_VALUE');
          expect(pErr.field).toBe('unitPrice');
        }
      }

      // Assert zero mutation
      const current = await adapter.getItem(ITEM_1_UUID);
      expect(current.data.unitPrice).toBe(initial.data.unitPrice);
      expect(current.etag).toBe(initial.etag);
    });

    it('rejects non-finite prices deterministically with 422 before mutation', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const nonFiniteValues = ['NaN', 'Infinity', '-Infinity'];
      for (const val of nonFiniteValues) {
        const req: PriceOverrideRequest = { unitPrice: val, isAuthorized: true };

        await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
          PricingValidationError
        );
      }

      // Assert zero mutation
      const current = await adapter.getItem(ITEM_1_UUID);
      expect(current.data.unitPrice).toBe(initial.data.unitPrice);
    });

    it('rejects malformed price strings deterministically with 422 before mutation', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const malformedValues = ['', '   ', 'abc', '$50', '25.00.00', 'free', 'N/A'];
      for (const val of malformedValues) {
        const req: PriceOverrideRequest = { unitPrice: val, isAuthorized: true };

        await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
          PricingValidationError
        );
      }

      // Assert zero mutation
      const current = await adapter.getItem(ITEM_1_UUID);
      expect(current.data.unitPrice).toBe(initial.data.unitPrice);
    });

    it('rejects invalid or negative quantities with 422', async () => {
      const invalidQuantities = [-1, 1.5, NaN, Infinity];
      for (const q of invalidQuantities) {
        const req: PriceOverrideRequest = {
          unitPrice: '25.00',
          quantity: q,
          isAuthorized: true,
        };

        await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
          PricingValidationError
        );
      }
    });
  });

  describe('Zero-Charge Reason Validation (Q-B10 Requirement 5)', () => {
    it('requires a non-empty zeroChargeReasonCode when unit price is zero (422 ZERO_CHARGE_REASON_REQUIRED)', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const missingReasonRequests: PriceOverrideRequest[] = [
        { unitPrice: '0', isAuthorized: true },
        { unitPrice: '0.00', isAuthorized: true, zeroChargeReasonCode: '' },
        { unitPrice: '0', isAuthorized: true, zeroChargeReasonCode: '   ' },
        { unitPrice: '0.00', isAuthorized: true, zeroChargeReasonCode: null },
      ];

      for (const req of missingReasonRequests) {
        await expect(adapter.overridePrice(ITEM_1_UUID, req)).rejects.toThrow(
          PricingValidationError
        );

        try {
          await adapter.overridePrice(ITEM_1_UUID, req);
        } catch (err: unknown) {
          const pErr = err as PricingValidationError;
          expect(pErr.status).toBe(422);
          expect(pErr.code).toBe('ZERO_CHARGE_REASON_REQUIRED');
          expect(pErr.field).toBe('zeroChargeReasonCode');
          expect(pErr.details.field).toBe('zeroChargeReasonCode');
        }
      }

      // Assert zero mutation
      const current = await adapter.getItem(ITEM_1_UUID);
      expect(current.data.unitPrice).toBe(initial.data.unitPrice);
      expect(current.etag).toBe(initial.etag);
    });

    it('successfully applies zero-charge when valid zeroChargeReasonCode is provided', async () => {
      const req: PriceOverrideRequest = {
        unitPrice: '0.00',
        isAuthorized: true,
        zeroChargeReasonCode: 'SYNTHETIC_WARRANTY_REMAKE',
        zeroChargeNote: 'Clinical warranty remake approved by supervisor',
      };

      const result = await adapter.overridePrice(ITEM_1_UUID, req);

      expect(result.overrideApplied).toBe(true);
      expect(result.item.unitPrice).toBe('0.00');
      expect(result.item.lineTotal).toBe('0.00');
      expect(result.item.zeroChargeReasonCode).toBe('SYNTHETIC_WARRANTY_REMAKE');
      expect(result.item.zeroChargeNote).toBe('Clinical warranty remake approved by supervisor');
      expect(result.syntheticBaseUnitPrice).toBe('20.00');

      // Verify persistence on reread
      const reread = await adapter.getItem(ITEM_1_UUID);
      expect(reread.data.unitPrice).toBe('0.00');
      expect(reread.data.zeroChargeReasonCode).toBe('SYNTHETIC_WARRANTY_REMAKE');
    });

    it('clears zeroChargeReasonCode when a non-zero price override is applied subsequently', async () => {
      // First apply zero charge
      await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '0.00',
        isAuthorized: true,
        zeroChargeReasonCode: 'SYNTHETIC_CLINICAL_GOODWILL',
      });

      // Then apply non-zero price
      const secondResult = await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '35.00',
        isAuthorized: true,
      });

      expect(secondResult.item.unitPrice).toBe('35.00');
      expect(secondResult.item.zeroChargeReasonCode).toBeNull();
      expect(secondResult.item.zeroChargeNote).toBeNull();

      const reread = await adapter.getItem(ITEM_1_UUID);
      expect(reread.data.zeroChargeReasonCode).toBeNull();
    });
  });

  describe('In-Memory Override Persistence & Re-read Stability (Q-B10 Requirement 3)', () => {
    it('persists valid authorized override in memory and does not reset to initial contract price on reread', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      expect(initial.data.unitPrice).toBe('20.00');

      const req: PriceOverrideRequest = {
        unitPrice: '45.00',
        quantity: 2,
        isAuthorized: true,
      };

      const result = await adapter.overridePrice(ITEM_1_UUID, req);
      expect(result.item.unitPrice).toBe('45.00');
      expect(result.item.quantity).toBe(2);
      expect(result.item.lineTotal).toBe('90.00');
      expect(result.etag).not.toBe(initial.etag);

      // Re-read must return the overridden values, not the seed values
      const reread = await adapter.getItem(ITEM_1_UUID);
      expect(reread.data.unitPrice).toBe('45.00');
      expect(reread.data.quantity).toBe(2);
      expect(reread.data.lineTotal).toBe('90.00');
      expect(reread.etag).toBe(result.etag);

      // Multiple re-reads remain completely stable
      const reread2 = await adapter.getItem(ITEM_1_UUID);
      expect(reread2.data.unitPrice).toBe('45.00');
    });

    it('restores initial seed fixtures when reset is invoked', async () => {
      await adapter.overridePrice(ITEM_1_UUID, { unitPrice: '80.00', isAuthorized: true });
      expect((await adapter.getItem(ITEM_1_UUID)).data.unitPrice).toBe('80.00');

      adapter.reset();
      expect((await adapter.getItem(ITEM_1_UUID)).data.unitPrice).toBe('20.00');
    });
  });

  describe('Independent Billability Preservation (Q-B10 Requirement 6)', () => {
    it('preserves isBillable independently from price and zero-charge status', async () => {
      // 1. Billable item remains billable when discounted to zero
      const billableZero = await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '0.00',
        isAuthorized: true,
        zeroChargeReasonCode: 'SYNTHETIC_MARKETING_PROMOTION',
      });
      expect(billableZero.item.isBillable).toBe(true);

      // 2. Non-billable item retains isBillable: false when price is overridden
      const nonBillableItem: ServiceItem = {
        ...(await adapter.getItem(ITEM_1_UUID)).data,
        isBillable: false,
      };
      adapter.reset([nonBillableItem]);

      const nonBillableOverride = await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '50.00',
        isAuthorized: true,
      });
      expect(nonBillableOverride.item.isBillable).toBe(false);
      expect(nonBillableOverride.item.unitPrice).toBe('50.00');

      // 3. Non-billable item with zero-charge also keeps isBillable: false
      const nonBillableZero = await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '0.00',
        isAuthorized: true,
        zeroChargeReasonCode: 'SYNTHETIC_INTERNAL_TRAINING',
      });
      expect(nonBillableZero.item.isBillable).toBe(false);
      expect(nonBillableZero.item.zeroChargeReasonCode).toBe('SYNTHETIC_INTERNAL_TRAINING');
    });
  });

  describe('ETag & Optimistic Concurrency Control (Q-B10 Requirement 7)', () => {
    it('succeeds when matching If-Match ETag is provided and rotates ETag', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const result = await adapter.overridePrice(
        ITEM_1_UUID,
        { unitPrice: '30.00', isAuthorized: true },
        initial.etag
      );

      expect(result.item.unitPrice).toBe('30.00');
      expect(result.etag).not.toBe(initial.etag);

      // Stale ETag check on next mutation
      await expect(
        adapter.overridePrice(
          ITEM_1_UUID,
          { unitPrice: '35.00', isAuthorized: true },
          initial.etag // Old ETag is now stale
        )
      ).rejects.toThrow(PreconditionFailedError);
    });

    it('rejects stale If-Match ETag with 412 PreconditionFailedError', async () => {
      await expect(
        adapter.overridePrice(
          ITEM_1_UUID,
          { unitPrice: '30.00', isAuthorized: true },
          '"stale-mock-etag-999"'
        )
      ).rejects.toThrow(PreconditionFailedError);
    });

    it('rejects empty If-Match string with 428 PreconditionRequiredError', async () => {
      await expect(
        adapter.overridePrice(
          ITEM_1_UUID,
          { unitPrice: '30.00', isAuthorized: true },
          ''
        )
      ).rejects.toThrow(PreconditionRequiredError);
    });

    it('accepts wildcard If-Match "*" and increments revision', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const result = await adapter.overridePrice(
        ITEM_1_UUID,
        { unitPrice: '32.00', isAuthorized: true },
        '*'
      );

      expect(result.item.unitPrice).toBe('32.00');
      expect(result.etag).not.toBe(initial.etag);
    });
  });

  describe('Payer Independence & F07 Non-Persistence (Q-B10 Requirement 8)', () => {
    it('leaves billedToContactUuid and billedPartyOrigin untouched across pricing mutations', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      const originalContact = initial.data.billedToContactUuid;
      const originalOrigin = initial.data.billedPartyOrigin;

      const result = await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '75.00',
        isAuthorized: true,
      });

      expect(result.item.billedToContactUuid).toBe(originalContact);
      expect(result.item.billedPartyOrigin).toBe(originalOrigin);

      const reread = await adapter.getItem(ITEM_1_UUID);
      expect(reread.data.billedToContactUuid).toBe(originalContact);
      expect(reread.data.billedPartyOrigin).toBe(originalOrigin);
    });
  });

  describe('Peer Item Isolation (Q-B10 Requirement 10)', () => {
    it('keeps peer item strictly unchanged after valid price override on target item', async () => {
      const initialItem2 = await adapter.getItem(ITEM_2_UUID);

      await adapter.overridePrice(ITEM_1_UUID, {
        unitPrice: '99.00',
        isAuthorized: true,
      });

      const currentItem2 = await adapter.getItem(ITEM_2_UUID);
      expect(currentItem2.data.unitPrice).toBe(initialItem2.data.unitPrice);
      expect(currentItem2.data.lineTotal).toBe(initialItem2.data.lineTotal);
      expect(currentItem2.data.quantity).toBe(initialItem2.data.quantity);
      expect(currentItem2.etag).toBe(initialItem2.etag);
    });

    it('keeps peer item strictly unchanged after rejected mutation on target item', async () => {
      const initialItem2 = await adapter.getItem(ITEM_2_UUID);

      try {
        await adapter.overridePrice(ITEM_1_UUID, {
          unitPrice: '-50.00',
          isAuthorized: true,
        });
      } catch {
        // expected error
      }

      const currentItem2 = await adapter.getItem(ITEM_2_UUID);
      expect(currentItem2.data.unitPrice).toBe(initialItem2.data.unitPrice);
      expect(currentItem2.etag).toBe(initialItem2.etag);
    });
  });
});
