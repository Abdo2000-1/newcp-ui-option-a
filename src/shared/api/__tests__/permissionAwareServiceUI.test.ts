import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceClient } from '../serviceClient';
import { WorkflowClient } from '../workflowClient';
import { PricingClient } from '../pricingClient';
import {
  PermissionDeniedError,
  AuthenticationError,
  ApiClientError,
} from '../errors';
import type { IHttpTransport } from '../httpTransport';

describe('FE-SEC-001: Permission-Aware Service UI and Boundary Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Server-Derived Permission Hints & Read-Only Mode', () => {
    it('rejects editing a service item when canEditService is false (read-only mode)', async () => {
      const client = new ServiceClient();
      const existing = await client.get('srv-biomodel-001');

      // Set canEditService: false in mock store
      (client as any).mockStore.get('srv-biomodel-001').item.canEditService = false;

      await expect(
        client.edit('srv-biomodel-001', { serviceNotes: 'Attempted edit' }, existing.etag)
      ).rejects.toThrow(PermissionDeniedError);
    });

    it('rejects editing a service item when isReadOnly is true', async () => {
      const client = new ServiceClient();
      const existing = await client.get('srv-biomodel-001');

      // Set isReadOnly: true in mock store
      (client as any).mockStore.get('srv-biomodel-001').item.isReadOnly = true;

      await expect(
        client.edit('srv-biomodel-001', { serviceNotes: 'Attempted edit' }, existing.etag)
      ).rejects.toThrow(PermissionDeniedError);
    });

    it('returns empty available transitions and rejects execution when canTransition is false', async () => {
      const wfClient = new WorkflowClient();
      const srvClient = new ServiceClient();
      const existing = await srvClient.get('srv-biomodel-001');

      // Inject canTransition: false into workflow client state
      (wfClient as any).mockServices.set('srv-biomodel-001', {
        status: 'pending_intake',
        etag: existing.etag,
        canTransition: false,
      });

      const transitions = await wfClient.getAvailableTransitions('srv-biomodel-001');
      expect(transitions).toEqual([]);

      await expect(
        wfClient.executeTransition('srv-biomodel-001', { transitionId: 101 }, existing.etag)
      ).rejects.toThrow(PermissionDeniedError);
    });

    it('enforces price override locks when canEditPrice is false', async () => {
      const srvClient = new ServiceClient();
      const pricingClient = new PricingClient(undefined, srvClient);

      const existing = await srvClient.get('srv-biomodel-001');
      (srvClient as any).mockStore.get('srv-biomodel-001').item.canEditPrice = false;

      await expect(
        pricingClient.updatePricing(
          'srv-biomodel-001',
          { unitPrice: '150.00', quantity: 1, isBillable: true },
          existing.etag,
          true
        )
      ).rejects.toThrow(PermissionDeniedError);
    });

    it('enforces billability locks when canEditBillability is false', async () => {
      const srvClient = new ServiceClient();
      const pricingClient = new PricingClient(undefined, srvClient);

      const existing = await srvClient.get('srv-biomodel-001');
      (srvClient as any).mockStore.get('srv-biomodel-001').item.canEditBillability = false;
      (srvClient as any).mockStore.get('srv-biomodel-001').item.isBillable = true;

      await expect(
        pricingClient.updatePricing(
          'srv-biomodel-001',
          { unitPrice: '120.00', quantity: 1, isBillable: false },
          existing.etag,
          true
        )
      ).rejects.toThrow(PermissionDeniedError);
    });
  });

  describe('2. Unauthorized (401) and Forbidden (403) Handling', () => {
    it('propagates 401 Unauthorized response from transport without silent retry or faking success', async () => {
      const mockTransport = {
        request: vi.fn(),
        get: vi.fn().mockRejectedValue(new AuthenticationError('Session expired')),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      } as unknown as IHttpTransport;

      const liveSrvClient = new ServiceClient(mockTransport, false);

      await expect(liveSrvClient.get('srv-biomodel-001')).rejects.toThrow(AuthenticationError);
    });

    it('propagates 403 Forbidden response from transport without falling back to mock bypass', async () => {
      const mockTransport = {
        request: vi.fn(),
        get: vi.fn(),
        post: vi.fn().mockRejectedValue(new ApiClientError(403, 'Forbidden: tenant boundary violation')),
        patch: vi.fn(),
        delete: vi.fn(),
      } as unknown as IHttpTransport;

      const liveWfClient = new WorkflowClient(mockTransport, false);

      await expect(
        liveWfClient.executeTransition('srv-biomodel-001', { transitionId: 101 }, 'W/"test"')
      ).rejects.toThrow(ApiClientError);
    });
  });

  describe('3. Safe Data Presentation and Boundary Isolation', () => {
    it('strictly strips billedPartyOrigin from client PATCH payload if provided', async () => {
      const client = new ServiceClient();
      const existing = await client.get('srv-biomodel-001');
      const patchWithOrigin: any = {
        serviceNotes: 'Updated notes',
        billedPartyOrigin: 'user_selected',
      };

      await client.edit('srv-biomodel-001', patchWithOrigin, existing.etag);

      // Verify billedPartyOrigin remained DB-controlled default ('order_default') and was not mutated by the client
      const updated = await client.get('srv-biomodel-001');
      expect(updated.data.billedPartyOrigin).toBe('order_default');
    });

    it('exposes public UUIDs and never internal database integer IDs or tenant IDs', async () => {
      const client = new ServiceClient();
      const res = await client.get('srv-biomodel-001');

      expect(res.data.uuid).toMatch(/^srv-/);
      expect(res.data.orderUuid).toMatch(/^ord-/);
      expect(res.data.billedToContactUuid).toMatch(/^(contact-|ct-)/);

      // Verify internal DB numeric ID fields are NOT present
      expect((res.data as any).id).toBeUndefined();
      expect((res.data as any).order_id).toBeUndefined();
      expect((res.data as any).tenant_id).toBeUndefined();
      expect((res.data as any).tenantId).toBeUndefined();
    });
  });
});
