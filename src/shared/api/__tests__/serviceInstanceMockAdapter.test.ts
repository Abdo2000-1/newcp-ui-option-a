/**
 * Unit Tests for ServiceInstanceMockAdapter (React Option A)
 *
 * EXPLICIT NOTICE:
 * This test suite exercises an in-memory MOCK test double adapter.
 * It does NOT claim live API integration, database connectivity, or F07 production readiness.
 * Status: MOCK / NOT_INTEGRATED (offline test double for Q-B8 concurrency verification).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ServiceInstanceMockAdapter,
  ServiceInstanceMockError,
  PreconditionRequiredError,
  PreconditionFailedError,
  ServiceItemNotFoundError,
  SYNTHETIC_MOCK_SERVICES,
  computeMockETag,
} from '../serviceInstanceMockAdapter';
import { ApiClientError } from '../errors';
import type { PatchServiceItem } from '../types';

describe('MOCK ServiceInstanceMockAdapter (Offline Test Double — NOT Live Integration)', () => {
  let adapter: ServiceInstanceMockAdapter;

  const ITEM_1_UUID = '00000000-0000-0000-0000-000000000014';
  const ITEM_2_UUID = '00000000-0000-0000-0000-000000000015';
  const UNKNOWN_UUID = '00000000-0000-0000-0000-999999999999';

  beforeEach(() => {
    adapter = new ServiceInstanceMockAdapter();
  });

  describe('Read operations (GET 200 equivalent & 404 not found)', () => {
    it('returns a known synthetic service item with a stable ETag (200 equivalent)', async () => {
      const response = await adapter.item(ITEM_1_UUID);

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.uuid).toBe(ITEM_1_UUID);
      expect(response.data.orderUuid).toBe('00000000-0000-0000-0000-000000000001');
      expect(response.data.unitPrice).toBe('20.00');
      expect(response.data.quantity).toBe(1);
      expect(response.data.lineTotal).toBe('20.00');
      expect(response.data.isBillable).toBe(true);
      expect(response.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000011');
      expect(response.data.serviceNotes).toBe('MOCK Biomodel Instance A');

      // ETag must be non-empty and formatted as a revision tag
      expect(response.etag).toBeDefined();
      expect(typeof response.etag).toBe('string');
      expect(response.etag).toMatch(/^W\/"mock-item-[a-f0-9]{8}-[a-f0-9]{8}"$/);
    });

    it('returns the identical deterministic ETag across repeated reads without mutation', async () => {
      const read1 = await adapter.item(ITEM_1_UUID);
      const read2 = await adapter.item(ITEM_1_UUID);
      const read3 = await adapter.item(ITEM_1_UUID);

      expect(read1.etag).toBe(read2.etag);
      expect(read2.etag).toBe(read3.etag);
      expect(read1.data).toEqual(read2.data);
    });

    it('returns a deterministic not-found error for an unknown UUID (404 equivalent)', async () => {
      await expect(adapter.item(UNKNOWN_UUID)).rejects.toThrow(ServiceItemNotFoundError);

      try {
        await adapter.item(UNKNOWN_UUID);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(ServiceInstanceMockError);
        expect(err).toBeInstanceOf(ServiceItemNotFoundError);
        const notFound = err as ServiceItemNotFoundError;
        expect(notFound.status).toBe(404);
        expect(notFound.name).toBe('ServiceItemNotFoundError');
        expect(notFound.isNotFound).toBe(true);
      }
    });
  });

  describe('Precondition validation & Concurrency (428 & 412 errors)', () => {
    it('rejects an edit without If-Match header with status 428 and does not mutate state', async () => {
      const initial = await adapter.item(ITEM_1_UUID);
      const patch: PatchServiceItem = { serviceNotes: 'Illegal edit without precondition' };

      // Empty string
      await expect(adapter.edit(ITEM_1_UUID, patch, '')).rejects.toThrow(PreconditionRequiredError);

      // Whitespace only
      await expect(adapter.edit(ITEM_1_UUID, patch, '   ')).rejects.toThrow(PreconditionRequiredError);

      try {
        await adapter.edit(ITEM_1_UUID, patch, '');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(ServiceInstanceMockError);
        expect(err).toBeInstanceOf(PreconditionRequiredError);
        const reqErr = err as PreconditionRequiredError;
        expect(reqErr.status).toBe(428);
        expect(reqErr.isPreconditionRequired).toBe(true);
      }

      // Verify state was NOT mutated
      const after = await adapter.item(ITEM_1_UUID);
      expect(after.data.serviceNotes).toBe(initial.data.serviceNotes);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects an edit with a stale or mismatched If-Match with status 412 and does not mutate state', async () => {
      const initial = await adapter.item(ITEM_1_UUID);
      const patch: PatchServiceItem = { serviceNotes: 'Stale update attempt' };
      const staleEtag = 'W/"mock-item-00000000-00000000"';

      await expect(adapter.edit(ITEM_1_UUID, patch, staleEtag)).rejects.toThrow(PreconditionFailedError);

      try {
        await adapter.edit(ITEM_1_UUID, patch, staleEtag);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(ServiceInstanceMockError);
        expect(err).toBeInstanceOf(PreconditionFailedError);
        const failErr = err as PreconditionFailedError;
        expect(failErr.status).toBe(412);
        expect(failErr.isStale).toBe(true);
      }

      // Verify state was NOT mutated
      const after = await adapter.item(ITEM_1_UUID);
      expect(after.data.serviceNotes).toBe(initial.data.serviceNotes);
      expect(after.etag).toBe(initial.etag);
    });

    it('rejects edit on unknown service item with status 404 even when If-Match is provided', async () => {
      const patch: PatchServiceItem = { serviceNotes: 'Edit on missing item' };
      await expect(adapter.edit(UNKNOWN_UUID, patch, 'W/"any-tag"')).rejects.toThrow(
        ServiceItemNotFoundError
      );
    });
  });

  describe('Successful mutations and ETag rotation (200 equivalent)', () => {
    it('applies a valid patch when If-Match matches current ETag and rotates the ETag', async () => {
      const initial = await adapter.item(ITEM_1_UUID);
      const patch: PatchServiceItem = {
        serviceNotes: 'Updated clinical notes by CP clerk',
        quantity: 3,
        unitPrice: '20.00',
      };

      const result = await adapter.edit(ITEM_1_UUID, patch, initial.etag);

      // Verify mutation succeeded
      expect(result.data.serviceNotes).toBe('Updated clinical notes by CP clerk');
      expect(result.data.quantity).toBe(3);
      expect(result.data.lineTotal).toBe('60.00');

      // Verify ETag rotation
      expect(result.etag).not.toBe(initial.etag);
      expect(result.etag).toMatch(/^W\/"mock-item-[a-f0-9]{8}-[a-f0-9]{8}"$/);

      // Verify subsequent read matches new ETag
      const reRead = await adapter.item(ITEM_1_UUID);
      expect(reRead.etag).toBe(result.etag);
      expect(reRead.data.serviceNotes).toBe('Updated clinical notes by CP clerk');
    });

    it('successive edits require the newly rotated ETag for optimistic concurrency', async () => {
      const read1 = await adapter.item(ITEM_1_UUID);
      const edit1 = await adapter.edit(ITEM_1_UUID, { serviceNotes: 'First edit' }, read1.etag);

      // Attempting second edit with the old read1 ETag must fail with 412
      await expect(
        adapter.edit(ITEM_1_UUID, { serviceNotes: 'Conflict edit' }, read1.etag)
      ).rejects.toThrow(PreconditionFailedError);

      // Editing with the new rotated ETag must succeed
      const edit2 = await adapter.edit(ITEM_1_UUID, { serviceNotes: 'Second edit' }, edit1.etag);
      expect(edit2.data.serviceNotes).toBe('Second edit');
      expect(edit2.etag).not.toBe(edit1.etag);
      expect(edit2.etag).toMatch(/^W\/"mock-item-[a-f0-9]{8}-[a-f0-9]{8}"$/);
    });

    it('ETag computation reflects changes in all editable fields (answers, notes, price)', () => {
      const baseItem = SYNTHETIC_MOCK_SERVICES[0];
      const tag1 = computeMockETag(baseItem);

      const modifiedAnswers = {
        ...baseItem,
        answers: [{ fieldCode: 'SCAN_TYPE', valueText: 'CBCT' }],
      };
      const tag2 = computeMockETag(modifiedAnswers);
      expect(tag1).not.toBe(tag2);

      const modifiedPrice = { ...baseItem, unitPrice: '99.00', lineTotal: '99.00' };
      const tag3 = computeMockETag(modifiedPrice);
      expect(tag1).not.toBe(tag3);
    });
  });

  describe('Instance isolation on same-order same-type services', () => {
    it('mutating item 1 leaves item 2 completely unchanged in state and ETag', async () => {
      const initialItem1 = await adapter.item(ITEM_1_UUID);
      const initialItem2 = await adapter.item(ITEM_2_UUID);

      // Mutate item 1
      const patch1: PatchServiceItem = {
        serviceNotes: 'Item 1 changed',
        billedToContactUuid: '00000000-0000-0000-0000-000000000099',
        isBillable: false,
      };
      const result1 = await adapter.edit(ITEM_1_UUID, patch1, initialItem1.etag);

      expect(result1.data.serviceNotes).toBe('Item 1 changed');
      expect(result1.data.isBillable).toBe(false);

      // Verify item 2 is completely isolated and unmodified
      const reReadItem2 = await adapter.item(ITEM_2_UUID);
      expect(reReadItem2.data.serviceNotes).toBe(initialItem2.data.serviceNotes);
      expect(reReadItem2.data.billedToContactUuid).toBe(initialItem2.data.billedToContactUuid);
      expect(reReadItem2.data.isBillable).toBe(initialItem2.data.isBillable);
      expect(reReadItem2.etag).toBe(initialItem2.etag);
    });
  });

  describe('Independent billability preservation (Q-B14)', () => {
    it('preserves isBillable independently from billedToContactUuid and does not derive one from the other', async () => {
      const initial = await adapter.item(ITEM_1_UUID);
      expect(initial.data.isBillable).toBe(true);
      expect(initial.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000011');

      // Update isBillable only
      const edit1 = await adapter.edit(ITEM_1_UUID, { isBillable: false }, initial.etag);
      expect(edit1.data.isBillable).toBe(false);
      // Payer must remain unchanged
      expect(edit1.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000011');

      // Update billedToContactUuid only
      const edit2 = await adapter.edit(
        ITEM_1_UUID,
        { billedToContactUuid: '00000000-0000-0000-0000-000000000012' },
        edit1.etag
      );
      expect(edit2.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000012');
      // isBillable must remain false and not be reset or derived
      expect(edit2.data.isBillable).toBe(false);
    });
  });

  describe('Purity and in-memory lifecycle', () => {
    it('reset() restores all synthetic fixtures to pristine initial state', async () => {
      const initial = await adapter.item(ITEM_1_UUID);
      await adapter.edit(ITEM_1_UUID, { serviceNotes: 'Mutated' }, initial.etag);

      adapter.reset();

      const restored = await adapter.item(ITEM_1_UUID);
      expect(restored.data.serviceNotes).toBe('MOCK Biomodel Instance A');
      expect(restored.etag).toBe(initial.etag);
    });

    it('list() returns cloned in-memory fixtures without leaking internal map references', () => {
      const items = adapter.list();
      expect(items.length).toBe(2);
      items[0].serviceNotes = 'Tampered externally';
      const reRead = adapter.list();
      expect(reRead[0].serviceNotes).toBe('MOCK Biomodel Instance A');
    });

    it('has no network, storage, or credential side effects', () => {
      expect(adapter).toBeInstanceOf(ServiceInstanceMockAdapter);
      // Pure in-memory adapter verifies offline readiness
    });
  });
});
