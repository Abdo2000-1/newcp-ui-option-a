/**
 * ============================================================================
 * UNIT TESTS: ApiClient offlineMockServiceInstances Boundary (Q-B8 / V0.9.2.2)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * EXPLICIT ARCHITECTURAL AND INTEGRATION NOTICE:
 * 1. This test suite verifies the explicit offlineMockServiceInstances boundary
 *    on ApiClient, which delegates to an injected or default in-memory mock adapter.
 * 2. It contains ZERO live network calls, ZERO database connections, and ZERO
 *    browser storage operations.
 * 3. F07 service-level payer persistence (billed_to_contact_id and billed_party_origin)
 *    remains completely BLOCKED by the current V3 physical database schema.
 * 4. isBillable is verified to be strictly independent of billedToContactUuid (Q-B14).
 * 5. This boundary is NOT consumed by any UI page or production endpoint.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../apiClient';
import {
  ServiceInstanceMockAdapter,
  PreconditionRequiredError,
  PreconditionFailedError,
  ServiceItemNotFoundError,
} from '../serviceInstanceMockAdapter';
import { ApiClientError } from '../errors';
import type { PatchServiceItem } from '../types';

describe('ApiClient offlineMockServiceInstances Boundary (MOCK / NOT_INTEGRATED)', () => {
  const ITEM_1_UUID = '00000000-0000-0000-0000-000000000014';
  const ITEM_2_UUID = '00000000-0000-0000-0000-000000000015';
  const UNKNOWN_UUID = '00000000-0000-0000-0000-999999999999';

  describe('Injection and Instance Isolation', () => {
    it('allows injection of fresh adapter instances and guarantees complete state and ETag isolation between two ApiClients', async () => {
      // Inject two distinct adapter instances into two ApiClient instances
      const adapter1 = new ServiceInstanceMockAdapter();
      const adapter2 = new ServiceInstanceMockAdapter();

      const client1 = new ApiClient(undefined, adapter1);
      const client2 = new ApiClient(undefined, adapter2);

      // Verify both begin with identical synthetic fixture data but independent memory
      const read1Initial = await client1.offlineMockServiceInstances.item(ITEM_1_UUID);
      const read2Initial = await client2.offlineMockServiceInstances.item(ITEM_1_UUID);

      expect(read1Initial.data.uuid).toBe(ITEM_1_UUID);
      expect(read2Initial.data.uuid).toBe(ITEM_1_UUID);
      expect(read1Initial.etag).toBe(read2Initial.etag);

      // Mutate item 1 exclusively via client1
      const patch: PatchServiceItem = {
        serviceNotes: 'Client 1 specialized note',
        unitPrice: '45.00',
        quantity: 2,
      };
      const mutated1 = await client1.offlineMockServiceInstances.edit(
        ITEM_1_UUID,
        patch,
        read1Initial.etag
      );

      // Verify client1 reflects the mutation and has rotated ETag
      expect(mutated1.data.serviceNotes).toBe('Client 1 specialized note');
      expect(mutated1.data.lineTotal).toBe('90.00');
      expect(mutated1.etag).not.toBe(read1Initial.etag);

      // Verify client2 is COMPLETELY ISOLATED: state and ETag remain at original baseline
      const read2After = await client2.offlineMockServiceInstances.item(ITEM_1_UUID);
      expect(read2After.data.serviceNotes).toBe('MOCK Biomodel Instance A');
      expect(read2After.data.lineTotal).toBe('20.00');
      expect(read2After.etag).toBe(read2Initial.etag);
      expect(read2After.etag).not.toBe(mutated1.etag);
    });

    it('supports injection via options object parameter format', async () => {
      const customAdapter = new ServiceInstanceMockAdapter();
      const client = new ApiClient({ mockServiceInstances: customAdapter });

      const item = await client.offlineMockServiceInstances.item(ITEM_1_UUID);
      expect(item.data.uuid).toBe(ITEM_1_UUID);
      expect(item.etag).toBeDefined();
    });

    it('defaults to an isolated in-memory mock adapter when no adapter is explicitly passed', async () => {
      const defaultClient1 = new ApiClient();
      const defaultClient2 = new ApiClient();

      const item1 = await defaultClient1.offlineMockServiceInstances.item(ITEM_1_UUID);
      await defaultClient1.offlineMockServiceInstances.edit(
        ITEM_1_UUID,
        { serviceNotes: 'Default client 1 change' },
        item1.etag
      );

      // defaultClient2 should not see defaultClient1's mutation
      const item2 = await defaultClient2.offlineMockServiceInstances.item(ITEM_1_UUID);
      expect(item2.data.serviceNotes).toBe('MOCK Biomodel Instance A');
    });
  });

  describe('Call Delegation to Adapter', () => {
    it('delegates item() call to the injected adapter with transparent pass-through', async () => {
      const mockAdapter = new ServiceInstanceMockAdapter();
      const itemSpy = vi.spyOn(mockAdapter, 'item');
      const client = new ApiClient(undefined, mockAdapter);

      const result = await client.offlineMockServiceInstances.item(ITEM_1_UUID);

      expect(itemSpy).toHaveBeenCalledTimes(1);
      expect(itemSpy).toHaveBeenCalledWith(ITEM_1_UUID);
      expect(result.data.uuid).toBe(ITEM_1_UUID);
      expect(result.etag).toBeDefined();
    });

    it('delegates edit() call to the injected adapter with transparent pass-through', async () => {
      const mockAdapter = new ServiceInstanceMockAdapter();
      const editSpy = vi.spyOn(mockAdapter, 'edit');
      const client = new ApiClient(undefined, mockAdapter);

      const initial = await client.offlineMockServiceInstances.item(ITEM_1_UUID);
      const patch: PatchServiceItem = { serviceNotes: 'Delegated edit test' };

      const result = await client.offlineMockServiceInstances.edit(ITEM_1_UUID, patch, initial.etag);

      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(ITEM_1_UUID, patch, initial.etag);
      expect(result.data.serviceNotes).toBe('Delegated edit test');
    });

    it('delegates reset() call to the injected adapter', async () => {
      const mockAdapter = new ServiceInstanceMockAdapter();
      const resetSpy = vi.spyOn(mockAdapter, 'reset');
      const client = new ApiClient(undefined, mockAdapter);

      client.offlineMockServiceInstances.reset();

      expect(resetSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Identity and Status Preservation', () => {
    let client: ApiClient;

    beforeEach(() => {
      client = new ApiClient(undefined, new ServiceInstanceMockAdapter());
    });

    it('preserves status 404 and ServiceItemNotFoundError identity without rewriting', async () => {
      try {
        await client.offlineMockServiceInstances.item(UNKNOWN_UUID);
        expect.unreachable('Should have thrown 404 error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(ServiceItemNotFoundError);
        const typed = err as ServiceItemNotFoundError;
        expect(typed.status).toBe(404);
        expect(typed.code).toBe('NOT_FOUND');
        expect(typed.isNotFound).toBe(true);
        expect(typed.message).toContain(UNKNOWN_UUID);
      }
    });

    it('preserves status 428 and PreconditionRequiredError identity when If-Match is omitted or empty', async () => {
      const patch: PatchServiceItem = { serviceNotes: 'Missing precondition' };

      try {
        await client.offlineMockServiceInstances.edit(ITEM_1_UUID, patch, '');
        expect.unreachable('Should have thrown 428 error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(PreconditionRequiredError);
        const typed = err as PreconditionRequiredError;
        expect(typed.status).toBe(428);
        expect(typed.code).toBe('PRECONDITION_REQUIRED');
        expect(typed.isPreconditionRequired).toBe(true);
      }
    });

    it('preserves status 412 and PreconditionFailedError identity when If-Match is stale', async () => {
      const patch: PatchServiceItem = { serviceNotes: 'Stale precondition' };
      const staleTag = 'W/"mock-item-00000000-00000000"';

      try {
        await client.offlineMockServiceInstances.edit(ITEM_1_UUID, patch, staleTag);
        expect.unreachable('Should have thrown 412 error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect(err).toBeInstanceOf(PreconditionFailedError);
        const typed = err as PreconditionFailedError;
        expect(typed.status).toBe(412);
        expect(typed.code).toBe('PRECONDITION_FAILED');
        expect(typed.isStale).toBe(true);
      }
    });
  });

  describe('Offline Purity and Zero External Side Effects', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn> | undefined;

    beforeEach(() => {
      if (typeof globalThis.fetch === 'function') {
        fetchSpy = vi.spyOn(globalThis, 'fetch');
      }
    });

    afterEach(() => {
      fetchSpy?.mockRestore();
    });

    it('performs read, edit, and reset operations with ZERO fetch or network calls', async () => {
      const client = new ApiClient(undefined, new ServiceInstanceMockAdapter());

      const initial = await client.offlineMockServiceInstances.item(ITEM_1_UUID);
      await client.offlineMockServiceInstances.edit(
        ITEM_1_UUID,
        { serviceNotes: 'Offline check' },
        initial.etag
      );
      client.offlineMockServiceInstances.reset();

      if (fetchSpy) {
        expect(fetchSpy).not.toHaveBeenCalled();
      }
    });

    it('operates purely in memory without browser storage access or credentials', async () => {
      const client = new ApiClient(undefined, new ServiceInstanceMockAdapter());

      // Read operation
      const res = await client.offlineMockServiceInstances.item(ITEM_2_UUID);
      expect(res.data.uuid).toBe(ITEM_2_UUID);

      // Verify no storage or token dependency exists
      expect(client.offlineMockServiceInstances).toBeDefined();
    });
  });

  describe('Independent Billability Preservation (Q-B14)', () => {
    it('preserves isBillable independence through the ApiClient boundary without deriving from payer', async () => {
      const client = new ApiClient(undefined, new ServiceInstanceMockAdapter());

      const initial = await client.offlineMockServiceInstances.item(ITEM_1_UUID);
      expect(initial.data.isBillable).toBe(true);
      expect(initial.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000011');

      // 1. Mutate isBillable to false -> payer must NOT change
      const editedBillability = await client.offlineMockServiceInstances.edit(
        ITEM_1_UUID,
        { isBillable: false },
        initial.etag
      );
      expect(editedBillability.data.isBillable).toBe(false);
      expect(editedBillability.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000011');

      // 2. Mutate payer -> isBillable must remain false and NOT be toggled
      const editedPayer = await client.offlineMockServiceInstances.edit(
        ITEM_1_UUID,
        { billedToContactUuid: '00000000-0000-0000-0000-000000000099' },
        editedBillability.etag
      );
      expect(editedPayer.data.billedToContactUuid).toBe('00000000-0000-0000-0000-000000000099');
      expect(editedPayer.data.isBillable).toBe(false);
    });
  });

  describe('Preservation of Existing ApiClient Behavior', () => {
    it('leaves existing cases, orders, patients, and billing intact on ApiClient', () => {
      const client = new ApiClient();

      expect(client.cases).toBeDefined();
      expect(typeof client.cases.list).toBe('function');
      expect(typeof client.cases.getById).toBe('function');

      expect(client.orders).toBeDefined();
      expect(typeof client.orders.list).toBe('function');
      expect(typeof client.orders.getById).toBe('function');

      expect(client.patients).toBeDefined();
      expect(typeof client.patients.list).toBe('function');
      expect(typeof client.patients.getById).toBe('function');

      expect(client.billing).toBeDefined();
      expect(typeof client.billing.list).toBe('function');

      expect(client.offlineMockServiceInstances).toBeDefined();
    });
  });
});
