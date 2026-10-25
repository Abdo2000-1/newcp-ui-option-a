import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConcurrencyManager } from '../concurrencyManager';
import { ServiceClient } from '../serviceClient';
import { PreconditionRequiredError, PreconditionFailedError } from '../errors';
import type { ServiceItem } from '../contractTypes';

describe('ConcurrencyManager & Concurrency Handling (T-API-005)', () => {
  let manager: ConcurrencyManager;

  beforeEach(() => {
    manager = new ConcurrencyManager();
  });

  it('stores, retrieves, and clears ETags correctly', () => {
    expect(manager.getEtag('srv-101')).toBeUndefined();

    manager.setEtag('srv-101', 'W/"srv-101-rev1"');
    expect(manager.getEtag('srv-101')).toBe('W/"srv-101-rev1"');

    const state = manager.getState('srv-101');
    expect(state.currentEtag).toBe('W/"srv-101-rev1"');
    expect(state.hasConflict).toBe(false);

    manager.clear('srv-101');
    expect(manager.getEtag('srv-101')).toBeUndefined();
  });

  it('notifies subscribers on ETag update and conflict', () => {
    const listener = vi.fn();
    const unsubscribe = manager.subscribe('srv-102', listener);

    manager.setEtag('srv-102', 'W/"v1"');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        currentEtag: 'W/"v1"',
        hasConflict: false,
      })
    );

    manager.recordConflict('srv-102', 'W/"v1"', 'W/"v2"', 'Conflict detected');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        hasConflict: true,
        conflictDetails: expect.objectContaining({
          clientEtag: 'W/"v1"',
          serverEtag: 'W/"v2"',
          message: 'Conflict detected',
        }),
      })
    );

    unsubscribe();
    manager.resetConflict('srv-102');
    expect(listener).toHaveBeenCalledTimes(2); // no third call after unsubscribe
  });

  it('throws PreconditionRequiredError if mutation executed without cached ETag', async () => {
    const mutation = vi.fn();
    await expect(manager.executeMutation('srv-no-tag', mutation)).rejects.toThrow(
      PreconditionRequiredError
    );
    expect(mutation).not.toHaveBeenCalled();
  });

  it('executes mutation with cached ETag and updates cache on success', async () => {
    manager.setEtag('srv-103', 'W/"rev1"');

    const mutation = vi.fn().mockResolvedValue({
      data: { id: 1 },
      etag: 'W/"rev2"',
    });

    const res = await manager.executeMutation('srv-103', mutation);
    expect(mutation).toHaveBeenCalledWith('W/"rev1"');
    expect(res.etag).toBe('W/"rev2"');
    expect(manager.getEtag('srv-103')).toBe('W/"rev2"');
    expect(manager.getState('srv-103').hasConflict).toBe(false);
  });

  it('captures 412 PreconditionFailedError and records conflict state', async () => {
    manager.setEtag('srv-104', 'W/"stale-rev"');

    const mutation = vi.fn().mockRejectedValue(
      new PreconditionFailedError({
        code: 'STALE_PRECONDITION',
        message: 'ETag mismatch',
        details: {
          serviceItemUuid: 'srv-104',
          providedETag: 'W/"stale-rev"',
          currentETag: 'W/"server-rev"',
        },
      })
    );

    await expect(manager.executeMutation('srv-104', mutation)).rejects.toThrow(
      PreconditionFailedError
    );

    const state = manager.getState('srv-104');
    expect(state.hasConflict).toBe(true);
    expect(state.conflictDetails?.clientEtag).toBe('W/"stale-rev"');
    expect(state.conflictDetails?.serverEtag).toBe('W/"server-rev"');
  });

  it('reconciles state via fresh fetcher', async () => {
    manager.recordConflict('srv-105', 'W/"stale"', 'W/"server"');
    expect(manager.getState('srv-105').hasConflict).toBe(true);

    const fetcher = vi.fn().mockResolvedValue({
      data: { serviceItemUuid: 'srv-105' },
      etag: 'W/"reconciled-v3"',
    });

    const refreshed = await manager.reconcile('srv-105', fetcher);
    expect(refreshed.etag).toBe('W/"reconciled-v3"');
    expect(manager.getEtag('srv-105')).toBe('W/"reconciled-v3"');
    expect(manager.getState('srv-105').hasConflict).toBe(false);
  });

  it('integrates end-to-end with ServiceClient offline mock adapter', async () => {
    const seed: ServiceItem = {
      uuid: 'srv-e2e-1',
      orderUuid: 'ord-1',
      sellableItemUuid: 'item-crown',
      status: 'pending_intake',
      isRedo: false,
      isBillable: true,
      billedToContactUuid: 'contact-1',
      billedPartyOrigin: 'order_default',
      unitPrice: '150.00',
      quantity: 1,
      lineTotal: '150.00',
      answers: [],
    };

    const client = new ServiceClient(undefined, true);
    client.reset([seed]);

    // 1. Fetch item to obtain initial ETag
    const fetched = await client.get('srv-e2e-1');
    manager.setEtag('srv-e2e-1', fetched.etag);
    expect(fetched.etag).toBe('W/"v1-srv-e2e-1"');

    // 2. Perform concurrent edit behind the scenes (advances revision)
    await client.edit('srv-e2e-1', { serviceNotes: 'Changed by another user' }, fetched.etag);

    // 3. User tries to execute mutation with stale cached ETag
    await expect(
      manager.executeMutation('srv-e2e-1', (etag) =>
        client.edit('srv-e2e-1', { serviceNotes: 'Conflicting edit' }, etag)
      )
    ).rejects.toThrow(PreconditionFailedError);

    expect(manager.getState('srv-e2e-1').hasConflict).toBe(true);

    // 4. Reconcile by re-fetching
    await manager.reconcile('srv-e2e-1', () => client.get('srv-e2e-1'));
    expect(manager.getState('srv-e2e-1').hasConflict).toBe(false);

    // 5. Retry mutation with reconciled ETag succeeds
    const finalUpdate = await manager.executeMutation('srv-e2e-1', (etag) =>
      client.edit('srv-e2e-1', { serviceNotes: 'Resolved edit' }, etag)
    );
    expect(finalUpdate.data.serviceNotes).toBe('Resolved edit');
  });
});
