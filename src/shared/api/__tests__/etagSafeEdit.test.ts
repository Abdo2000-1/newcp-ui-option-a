import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceClient } from '../serviceClient';
import { ConcurrencyManager } from '../concurrencyManager';
import type { IHttpTransport } from '../httpTransport';
import type { ServiceItem, PatchServiceItem } from '../contractTypes';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  PermissionDeniedError,
  ValidationError,
  ApiClientError,
} from '../errors';

describe('FE-SERVICE-002: ETag-Safe Service Instance Editing', () => {
  let client: ServiceClient;
  let manager: ConcurrencyManager;
  let mockTransport: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const SEED_ITEM_1: ServiceItem = {
    uuid: 'srv-item-001',
    orderUuid: 'ord-1001',
    sellableItemUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    status: 'pending_intake',
    answers: [{ fieldCode: 'model_type', value: 'solid' }],
    billedToContactUuid: 'contact-clinic-99',
    billedPartyOrigin: 'order_default',
    isBillable: true,
    unitPrice: '120.00',
    quantity: 1,
    lineTotal: '120.00',
    canEditPrice: true,
    canEditBillability: true,
    canEditBilledParty: true,
    isInvoiced: false,
  };

  const SEED_ITEM_2: ServiceItem = {
    uuid: 'srv-item-002',
    orderUuid: 'ord-1001',
    sellableItemUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', // Same-type service under same order
    status: 'pending_intake',
    answers: [{ fieldCode: 'model_type', value: 'hollow' }],
    billedToContactUuid: 'contact-clinic-99',
    billedPartyOrigin: 'order_default',
    isBillable: true,
    unitPrice: '140.00',
    quantity: 1,
    lineTotal: '140.00',
    canEditPrice: true,
    canEditBillability: true,
    canEditBilledParty: true,
    isInvoiced: false,
  };

  beforeEach(() => {
    mockTransport = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };
    client = new ServiceClient(undefined, true);
    client.reset([SEED_ITEM_1, SEED_ITEM_2]);
    manager = new ConcurrencyManager();
  });

  it('successfully edits a service instance with a valid If-Match header and rotates ETag', async () => {
    const initial = await client.get('srv-item-001');
    const initialEtag = initial.etag;
    expect(initialEtag).toBe('W/"v1-srv-item-001"');

    const patch: PatchServiceItem = {
      answers: [{ fieldCode: 'model_type', value: 'hollow' }],
      serviceNotes: 'Updated to hollow arch with drainage per doctor call',
    };

    const updated = await client.edit('srv-item-001', patch, initialEtag);

    expect(updated.data.uuid).toBe('srv-item-001');
    expect(updated.data.answers[0].value).toBe('hollow');
    expect(updated.data.serviceNotes).toBe('Updated to hollow arch with drainage per doctor call');
    expect(updated.etag).not.toBe(initialEtag);
    expect(updated.etag).toMatch(/^W\/"srv-srv-item-001-rev/);

    // Verify subsequent read returns rotated ETag
    const reread = await client.get('srv-item-001');
    expect(reread.etag).toBe(updated.etag);
  });

  it('rejects edit request with 428 PreconditionRequiredError when If-Match is missing', async () => {
    const patch: PatchServiceItem = { serviceNotes: 'Missing etag attempt' };

    await expect(client.edit('srv-item-001', patch)).rejects.toThrow(PreconditionRequiredError);
    await expect(client.edit('srv-item-001', patch, '')).rejects.toThrow(PreconditionRequiredError);
  });

  it('rejects edit request with 412 PreconditionFailedError on stale ETag without silent retry', async () => {
    const initial = await client.get('srv-item-001');
    const firstEtag = initial.etag;

    // Concurrently mutate item to advance ETag
    await client.edit('srv-item-001', { serviceNotes: 'Interim edit by clerk B' }, firstEtag);

    // Attempt second edit using stale firstEtag
    await expect(
      client.edit('srv-item-001', { serviceNotes: 'Stale edit by clerk A' }, firstEtag)
    ).rejects.toThrow(PreconditionFailedError);

    // Verify error contains conflict details
    try {
      await client.edit('srv-item-001', { serviceNotes: 'Stale edit by clerk A' }, firstEtag);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PreconditionFailedError);
      expect(err.details?.serviceItemUuid).toBe('srv-item-001');
      expect(err.details?.providedETag).toBe(firstEtag);
      expect(err.details?.currentETag).toMatch(/^W\/"srv-srv-item-001-rev/);
    }
  });

  it('preserves user unsaved draft upon 412 conflict and does not silently overwrite', async () => {
    const initial = await client.get('srv-item-001');
    manager.setEtag('srv-item-001', initial.etag);

    // Another user mutates the item
    await client.edit('srv-item-001', { serviceNotes: 'Server advanced revision' }, initial.etag);

    const clerkDraft = {
      model_type: 'hollow',
      notes: 'Important unsaved clinical instructions',
    };

    // Execute mutation via ConcurrencyManager with draft data
    await expect(
      manager.executeMutation(
        'srv-item-001',
        (etag) => client.edit('srv-item-001', { serviceNotes: clerkDraft.notes }, etag),
        undefined,
        clerkDraft
      )
    ).rejects.toThrow(PreconditionFailedError);

    // Verify draft was preserved in manager state
    const state = manager.getState<typeof clerkDraft>('srv-item-001');
    expect(state.hasConflict).toBe(true);
    expect(state.unsavedDraft).toEqual(clerkDraft);
    expect(state.unsavedDraft?.notes).toBe('Important unsaved clinical instructions');

    // Reconcile and ensure latest server data is fetched
    const refreshed = await manager.reconcile('srv-item-001', () => client.get('srv-item-001'));
    expect(refreshed.data.serviceNotes).toBe('Server advanced revision');
    expect(manager.getState('srv-item-001').hasConflict).toBe(false);
  });

  it('ensures independent same-type items under the same order are isolated and not modified', async () => {
    const item1Before = await client.get('srv-item-001');
    const item2Before = await client.get('srv-item-002');

    // Mutate item 1 only
    await client.edit(
      'srv-item-001',
      { serviceNotes: 'Specific note for item 1', unitPrice: '135.00' },
      item1Before.etag
    );

    // Verify item 2 remained completely unmodified with original ETag and answers
    const item2After = await client.get('srv-item-002');
    expect(item2After.data.answers[0].value).toBe('hollow');
    expect(item2After.data.unitPrice).toBe('140.00');
    expect(item2After.data.serviceNotes).toBeUndefined();
    expect(item2After.etag).toBe(item2Before.etag);
  });

  it('rejects generic status mutation via PATCH (requires workflow transition)', async () => {
    const initial = await client.get('srv-item-001');

    await expect(
      client.edit('srv-item-001', { status: 'in_progress' } as any, initial.etag)
    ).rejects.toThrow(ValidationError);

    await expect(
      client.edit('srv-item-001', { status: 'in_progress' } as any, initial.etag)
    ).rejects.toMatchObject({
      code: 'STATUS_MUTATION_DISALLOWED',
    });
  });

  it('enforces read-only permissions: rejects edits with 403 on invoiced or locked items', async () => {
    const lockedItem: ServiceItem = {
      ...SEED_ITEM_1,
      uuid: 'srv-locked-003',
      isInvoiced: true,
      canEditPrice: false,
      canEditBillability: false,
    };
    client.reset([lockedItem]);

    const initial = await client.get('srv-locked-003');

    // Invoiced financial mutation rejected
    await expect(
      client.edit('srv-locked-003', { unitPrice: '200.00' }, initial.etag)
    ).rejects.toThrow(PermissionDeniedError);

    // Invoiced billability mutation rejected
    await expect(
      client.edit('srv-locked-003', { isBillable: false }, initial.etag)
    ).rejects.toThrow(PermissionDeniedError);
  });

  it('in LIVE_HTTP mode, propagates 403 and 409 responses from transport without mock fallback', async () => {
    mockTransport.patch.mockRejectedValueOnce(
      new ApiClientError(403, 'Forbidden: clerk lacks financial override role')
    );

    const liveClient = new ServiceClient(mockTransport as unknown as IHttpTransport, false);

    await expect(
      liveClient.edit('srv-item-001', { unitPrice: '150.00' }, 'W/"test-etag"')
    ).rejects.toThrow('Forbidden: clerk lacks financial override role');

    mockTransport.patch.mockRejectedValueOnce(
      new ApiClientError(409, 'Conflict: service item is currently locked by batch billing')
    );

    await expect(
      liveClient.edit('srv-item-001', { serviceNotes: 'Test' }, 'W/"test-etag"')
    ).rejects.toThrow('Conflict: service item is currently locked by batch billing');
  });
});
