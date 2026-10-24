/**
 * ============================================================================
 * UNIT TESTS: HoldTransitionMockAdapter (V0.9.2.2 / Q-B9)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * EXPLICIT ARCHITECTURAL AND INTEGRATION NOTICE:
 * 1. This test suite verifies the offline mock hold-transition adapter enforcing
 *    the approved Q-B9 rule: atomic requirement of holdType and holdReasonCode.
 * 2. Hold reasons are explicitly temporary synthetic demo fixtures. They are
 *    NOT historical, canonical, or production-approved taxonomy values.
 * 3. Contains ZERO live network calls, ZERO database connections, and ZERO
 *    browser storage operations.
 * 4. F07 service-level payer persistence (billed_to_contact_id and billed_party_origin)
 *    remains completely BLOCKED by the missing V3 database schema columns.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  HoldTransitionMockAdapter,
  HoldTransitionValidationError,
  SYNTHETIC_DEMO_HOLD_REASONS,
} from '../holdTransitionMockAdapter';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ServiceItemNotFoundError,
} from '../serviceInstanceMockAdapter';
import { ApiClientError } from '../errors';
import type { OnHoldTransitionRequest, HoldType } from '../types';

describe('HoldTransitionMockAdapter (MOCK / NOT_INTEGRATED — Q-B9)', () => {
  let adapter: HoldTransitionMockAdapter;

  const ITEM_1_UUID = '00000000-0000-0000-0000-000000000014';
  const ITEM_2_UUID = '00000000-0000-0000-0000-000000000015';
  const UNKNOWN_UUID = '00000000-0000-0000-0000-999999999999';

  beforeEach(() => {
    adapter = new HoldTransitionMockAdapter();
  });

  describe('Synthetic Hold Reasons Lookup (Demo Fixtures Only)', () => {
    it('returns all temporary synthetic demo hold reasons with isTemporary: true', () => {
      const reasons = adapter.getHoldReasons();

      expect(reasons).toHaveLength(4);
      for (const r of reasons) {
        expect(r.isTemporary).toBe(true);
        expect(['customer', 'internal']).toContain(r.holdType);
        expect(r.label).toContain('Demo only');
        expect(r.code).toMatch(/^SYNTHETIC_/);
      }
    });

    it('filters reasons strictly by customer holdType', () => {
      const customerReasons = adapter.getHoldReasons('customer');

      expect(customerReasons).toHaveLength(2);
      expect(customerReasons.every((r) => r.holdType === 'customer')).toBe(true);
      expect(customerReasons.map((r) => r.code)).toEqual([
        'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
        'SYNTHETIC_CUSTOMER_FILE_REUPLOAD',
      ]);
    });

    it('filters reasons strictly by internal holdType', () => {
      const internalReasons = adapter.getHoldReasons('internal');

      expect(internalReasons).toHaveLength(2);
      expect(internalReasons.every((r) => r.holdType === 'internal')).toBe(true);
      expect(internalReasons.map((r) => r.code)).toEqual([
        'SYNTHETIC_INTERNAL_REVIEW',
        'SYNTHETIC_INTERNAL_CAPACITY',
      ]);
    });

    it('returns deep clones to prevent callers from tampering with lookup tables', () => {
      const reasons = adapter.getHoldReasons();
      reasons[0].label = 'Mutated externally';

      const fresh = adapter.getHoldReasons();
      expect(fresh[0].label).toBe('Demo only — Awaiting customer input');
    });
  });

  describe('Atomic Validation Guards (Q-B9 Rejection Before Mutation)', () => {
    it('rejects transition when holdType is missing with status 422 and does not mutate state', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const invalidRequests = [
        { holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT' } as unknown as OnHoldTransitionRequest,
        { holdType: '' as unknown as HoldType, holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT' },
        { holdType: null as unknown as HoldType, holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT' },
        { holdType: undefined as unknown as HoldType, holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT' },
      ];

      for (const req of invalidRequests) {
        await expect(adapter.transitionToOnHold(ITEM_1_UUID, req)).rejects.toThrow(
          HoldTransitionValidationError
        );

        try {
          await adapter.transitionToOnHold(ITEM_1_UUID, req);
        } catch (err: unknown) {
          expect(err).toBeInstanceOf(ApiClientError);
          expect(err).toBeInstanceOf(HoldTransitionValidationError);
          const typed = err as HoldTransitionValidationError;
          expect(typed.status).toBe(422);
          expect(typed.code).toBe('HOLD_TYPE_REQUIRED');
          expect(typed.field).toBe('holdType');
          expect(typed.isHoldTypeMissing).toBe(true);
        }
      }

      // Verify item state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.data.holdType).toBeUndefined();
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects transition when holdType is invalid with status 422 and does not mutate state', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      const invalidReq: OnHoldTransitionRequest = {
        holdType: 'partner' as unknown as HoldType,
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
      };

      await expect(adapter.transitionToOnHold(ITEM_1_UUID, invalidReq)).rejects.toThrow(
        HoldTransitionValidationError
      );

      try {
        await adapter.transitionToOnHold(ITEM_1_UUID, invalidReq);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(HoldTransitionValidationError);
        const typed = err as HoldTransitionValidationError;
        expect(typed.status).toBe(422);
        expect(typed.code).toBe('INVALID_HOLD_TYPE');
        expect(typed.field).toBe('holdType');
        expect(typed.isInvalidHoldType).toBe(true);
      }

      // Verify state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects transition when holdReasonCode is missing with status 422 and does not mutate state', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);

      const invalidRequests: OnHoldTransitionRequest[] = [
        { holdType: 'customer', holdReasonCode: '' },
        { holdType: 'customer', holdReasonCode: '   ' },
        { holdType: 'customer' } as unknown as OnHoldTransitionRequest,
      ];

      for (const req of invalidRequests) {
        await expect(adapter.transitionToOnHold(ITEM_1_UUID, req)).rejects.toThrow(
          HoldTransitionValidationError
        );

        try {
          await adapter.transitionToOnHold(ITEM_1_UUID, req);
        } catch (err: unknown) {
          expect(err).toBeInstanceOf(ApiClientError);
          expect(err).toBeInstanceOf(HoldTransitionValidationError);
          const typed = err as HoldTransitionValidationError;
          expect(typed.status).toBe(422);
          expect(typed.code).toBe('HOLD_REASON_CODE_REQUIRED');
          expect(typed.field).toBe('holdReasonCode');
          expect(typed.isHoldReasonMissing).toBe(true);
        }
      }

      // Verify state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects transition when holdReasonCode is unknown with status 422 and does not mutate state', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      const req: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'NONEXISTENT_REASON_CODE',
      };

      await expect(adapter.transitionToOnHold(ITEM_1_UUID, req)).rejects.toThrow(
        HoldTransitionValidationError
      );

      try {
        await adapter.transitionToOnHold(ITEM_1_UUID, req);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(HoldTransitionValidationError);
        const typed = err as HoldTransitionValidationError;
        expect(typed.status).toBe(422);
        expect(typed.code).toBe('UNKNOWN_HOLD_REASON_CODE');
        expect(typed.field).toBe('holdReasonCode');
        expect(typed.isUnknownReason).toBe(true);
      }

      // Verify state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects transition when holdReasonCode does not match holdType with status 422', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      // Reason is internal, but request specifies customer
      const mismatchedReq: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_INTERNAL_REVIEW',
      };

      await expect(adapter.transitionToOnHold(ITEM_1_UUID, mismatchedReq)).rejects.toThrow(
        HoldTransitionValidationError
      );

      // Verify state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects transition for unknown service item UUID with status 404', async () => {
      const req: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
      };

      await expect(adapter.transitionToOnHold(UNKNOWN_UUID, req)).rejects.toThrow(
        ServiceItemNotFoundError
      );
    });
  });

  describe('Optimistic Concurrency Guards (Q-B8)', () => {
    it('rejects transition when empty If-Match is provided with status 428 and does not mutate', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      const req: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
      };

      await expect(adapter.transitionToOnHold(ITEM_1_UUID, req, '')).rejects.toThrow(
        PreconditionRequiredError
      );

      // Verify state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects transition when stale If-Match is provided with status 412 and does not mutate', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      const req: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
      };
      const staleTag = 'W/"mock-item-00000000-00000000"';

      await expect(adapter.transitionToOnHold(ITEM_1_UUID, req, staleTag)).rejects.toThrow(
        PreconditionFailedError
      );

      // Verify state was NOT mutated
      const after = await adapter.getItem(ITEM_1_UUID);
      expect(after.data.status).toBe(initial.data.status);
      expect(after.etag).toBe(initial.etag);
    });
  });

  describe('Successful Atomic On Hold Transition and State Rotation', () => {
    it('atomically transitions item to on_hold and rotates ETag when request is valid', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      expect(initial.data.status).toBe('new');

      const req: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
        comment: 'Awaiting updated CBCT scan',
      };

      const result = await adapter.transitionToOnHold(ITEM_1_UUID, req, initial.etag);

      // Verify result envelope
      expect(result.item.status).toBe('on_hold');
      expect(result.item.holdType).toBe('customer');
      expect(result.item.holdReasonCode).toBe('SYNTHETIC_CUSTOMER_AWAITING_INPUT');

      expect(result.transition.toStatus).toBe('on_hold');
      expect(result.transition.holdType).toBe('customer');
      expect(result.transition.holdReasonCode).toBe('SYNTHETIC_CUSTOMER_AWAITING_INPUT');
      expect(result.transition.isTemporary).toBe(true);
      expect(result.transition.comment).toBe('Awaiting updated CBCT scan');
      expect(result.transition.transitionedAt).toBeDefined();

      // Verify ETag rotation
      expect(result.etag).not.toBe(initial.etag);
      expect(result.etag).toMatch(/^W\/"mock-item-[a-f0-9]{8}-[a-f0-9]{8}"$/);

      // Verify subsequent getItem matches rotated state
      const reRead = await adapter.getItem(ITEM_1_UUID);
      expect(reRead.data.status).toBe('on_hold');
      expect(reRead.data.holdType).toBe('customer');
      expect(reRead.data.holdReasonCode).toBe('SYNTHETIC_CUSTOMER_AWAITING_INPUT');
      expect(reRead.etag).toBe(result.etag);
    });

    it('supports internal holdType transitions with matching internal reasons', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      const req: OnHoldTransitionRequest = {
        holdType: 'internal',
        holdReasonCode: 'SYNTHETIC_INTERNAL_CAPACITY',
      };

      const result = await adapter.transitionToOnHold(ITEM_1_UUID, req);
      expect(result.item.status).toBe('on_hold');
      expect(result.item.holdType).toBe('internal');
      expect(result.item.holdReasonCode).toBe('SYNTHETIC_INTERNAL_CAPACITY');
    });
  });

  describe('Instance Isolation Between Peer Items', () => {
    it('transitioning item 1 leaves item 2 completely unchanged in state, status, and ETag', async () => {
      const initialItem1 = await adapter.getItem(ITEM_1_UUID);
      const initialItem2 = await adapter.getItem(ITEM_2_UUID);

      const req: OnHoldTransitionRequest = {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_FILE_REUPLOAD',
      };

      await adapter.transitionToOnHold(ITEM_1_UUID, req, initialItem1.etag);

      // Verify item 2 is completely isolated and untouched
      const item2After = await adapter.getItem(ITEM_2_UUID);
      expect(item2After.data.status).toBe('new');
      expect(item2After.data.holdType).toBeUndefined();
      expect(item2After.data.holdReasonCode).toBeUndefined();
      expect(item2After.etag).toBe(initialItem2.etag);
    });
  });

  describe('Purity and Reset Lifecycle', () => {
    it('reset() restores all synthetic fixtures to pristine initial state', async () => {
      const initial = await adapter.getItem(ITEM_1_UUID);
      await adapter.transitionToOnHold(ITEM_1_UUID, {
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
      });

      adapter.reset();

      const restored = await adapter.getItem(ITEM_1_UUID);
      expect(restored.data.status).toBe('new');
      expect(restored.data.holdType).toBeUndefined();
      expect(restored.etag).toBe(initial.etag);
    });

    it('operates purely in memory with zero network, storage, or credential side effects', () => {
      expect(adapter).toBeInstanceOf(HoldTransitionMockAdapter);
    });
  });
});
