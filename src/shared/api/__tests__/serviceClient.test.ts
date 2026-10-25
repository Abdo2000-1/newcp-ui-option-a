import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceClient, ServiceItemNotFoundError } from '../serviceClient';
import type { IHttpTransport } from '../httpTransport';
import { PreconditionRequiredError, PreconditionFailedError, ValidationError } from '../errors';

describe('T-API-004: Service-Instance CRUD & Peer Isolation', () => {
  let client: ServiceClient;

  beforeEach(() => {
    client = new ServiceClient(undefined, true);
  });

  it('lists service instances for a specific order', async () => {
    const res = await client.listByOrder('ord-1001');
    expect(res.data.length).toBe(2);
    expect(res.data[0].orderUuid).toBe('ord-1001');
    expect(res.etag).toContain('W/"mock-order-ord-1001');
  });

  it('preserves distinct identity and independent answers for repeated same-type instances', async () => {
    const res = await client.listByOrder('ord-1001');
    const [item1, item2] = res.data;

    // Both are biomodel services
    expect(item1.sellableItemUuid).toBe(item2.sellableItemUuid);
    // But have completely distinct instance UUIDs
    expect(item1.uuid).not.toBe(item2.uuid);
    expect(item1.uuid).toBe('srv-biomodel-001');
    expect(item2.uuid).toBe('srv-biomodel-002');
    // And independent answers
    expect(item1.answers[0].value).toBe('solid');
    expect(item2.answers[0].value).toBe('hollow');
  });

  it('creates a new service instance with independent UUID and does not send client-controlled billedPartyOrigin', async () => {
    const created = await client.create('ord-1001', {
      sellableItemUuid: 'cat-conversion-sellable',
      answers: [{ fieldCode: 'dicom_notes', value: 'urgent' }],
      isBillable: true,
      unitPrice: '90.00',
    });

    expect(created.data.uuid).toMatch(/^srv-/);
    expect(created.data.orderUuid).toBe('ord-1001');
    expect(created.data.billedPartyOrigin).toBe('order_default'); // Assigned by server/adapter
    expect(created.etag).toContain('W/"srv-');
  });

  it('rejects creation when sellableItemUuid is missing', async () => {
    await expect(
      client.create('ord-1001', {
        sellableItemUuid: '',
        answers: [],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('reads single service instance by UUID', async () => {
    const res = await client.get('srv-biomodel-001');
    expect(res.data.uuid).toBe('srv-biomodel-001');
    expect(res.data.unitPrice).toBe('120.00');
    expect(res.etag).toBe('W/"v1-srv-biomodel-001"');
  });

  it('throws ServiceItemNotFoundError for nonexistent service instance', async () => {
    await expect(client.get('nonexistent-uuid')).rejects.toThrow(ServiceItemNotFoundError);
  });

  it('requires an If-Match header for editing, throwing PreconditionRequiredError (428) when omitted', async () => {
    await expect(
      client.edit('srv-biomodel-001', { isBillable: false })
    ).rejects.toThrow(PreconditionRequiredError);
  });

  it('rejects stale If-Match header with PreconditionFailedError (412)', async () => {
    await expect(
      client.edit('srv-biomodel-001', { isBillable: false }, 'W/"stale-etag-000"')
    ).rejects.toThrow(PreconditionFailedError);
  });

  it('edits instance, rotates ETag, and maintains strict peer isolation from sibling instances', async () => {
    const original = await client.get('srv-biomodel-001');
    const siblingOriginal = await client.get('srv-biomodel-002');

    const edited = await client.edit(
      'srv-biomodel-001',
      {
        isBillable: false,
        serviceNotes: 'Updated via clerk action',
        billedToContactUuid: 'contact-special-doctor',
      },
      original.etag
    );

    expect(edited.data.isBillable).toBe(false);
    expect(edited.data.billedPartyOrigin).toBe('user_selected');
    expect(edited.etag).not.toBe(original.etag);
    expect(edited.etag).toContain('rev2');

    // Verify sibling instance is completely untouched (peer isolation)
    const siblingAfter = await client.get('srv-biomodel-002');
    expect(siblingAfter.data.isBillable).toBe(true);
    expect(siblingAfter.etag).toBe(siblingOriginal.etag);
  });
});
