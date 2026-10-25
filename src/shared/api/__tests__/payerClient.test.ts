import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayerClient, PROPOSAL_PENDING_BACKEND_REVIEW } from '../payerClient';
import { ServiceClient } from '../serviceClient';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  PermissionDeniedError,
  ValidationError,
} from '../errors';
import type { ServiceItem } from '../contractTypes';
import type { IHttpTransport } from '../httpTransport';

describe('PayerClient & F07 Boundary (T-API-008)', () => {
  let srvClient: ServiceClient;
  let payerClient: PayerClient;

  const mockItem: ServiceItem = {
    uuid: 'srv-payer-001',
    orderUuid: 'ord-payer-10',
    sellableItemUuid: 'item-model-aligner',
    status: 'pending_intake',
    answers: [],
    billedToContactUuid: 'contact-dr-smith-01',
    billedPartyOrigin: 'order_default',
    canEditBilledParty: true,
    isBillable: true,
    unitPrice: '95.00',
    quantity: 1,
    lineTotal: '95.00',
  };

  beforeEach(() => {
    srvClient = new ServiceClient(undefined, true);
    srvClient.reset([mockItem]);
    payerClient = new PayerClient(undefined, srvClient, true);
  });

  it('declares status as PROPOSAL_PENDING_BACKEND_REVIEW', () => {
    expect(payerClient.status).toBe(PROPOSAL_PENDING_BACKEND_REVIEW);
  });

  describe('getEligibleBilledParties', () => {
    it('returns eligible doctor and scanning center choices in mock mode', async () => {
      const parties = await payerClient.getEligibleBilledParties('ord-payer-10');
      expect(parties.length).toBe(2);
      expect(parties.some(p => p.role === 'doctor')).toBe(true);
      expect(parties.some(p => p.role === 'scanning_center')).toBe(true);
    });

    it('delegates to transport in live mode', async () => {
      const mockTransport: IHttpTransport = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: [{ contactUuid: 'c-1', role: 'doctor', label: 'Dr. Live' }],
          etag: 'W/"parties-1"',
          status: 200,
        }),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      };

      const livePayerClient = new PayerClient(mockTransport, srvClient, false);
      const res = await livePayerClient.getEligibleBilledParties('ord-live-1');
      expect(mockTransport.get).toHaveBeenCalledWith('/orders/ord-live-1/eligible-billed-parties');
      expect(res[0].contactUuid).toBe('c-1');
    });
  });

  describe('validatePayerAssignment', () => {
    it('throws PermissionDeniedError when canEditBilledParty is false', () => {
      const locked: ServiceItem = { ...mockItem, canEditBilledParty: false };
      expect(() => {
        payerClient.validatePayerAssignment(locked, 'contact-sc-metro-02', [
          { contactUuid: 'contact-sc-metro-02', role: 'scanning_center', label: 'Metro' },
        ]);
      }).toThrow(PermissionDeniedError);
    });

    it('throws ValidationError when contact is not in eligible list', () => {
      expect(() => {
        payerClient.validatePayerAssignment(mockItem, 'unauthorized-contact', [
          { contactUuid: 'contact-dr-smith-01', role: 'doctor', label: 'Smith' },
        ]);
      }).toThrow(ValidationError);
    });

    it('succeeds when contact is eligible and item is editable', () => {
      expect(() => {
        payerClient.validatePayerAssignment(mockItem, 'contact-dr-smith-01', [
          { contactUuid: 'contact-dr-smith-01', role: 'doctor', label: 'Smith' },
        ]);
      }).not.toThrow();
    });
  });

  describe('assignBilledParty execution', () => {
    it('throws PreconditionRequiredError when ifMatch is omitted', async () => {
      await expect(
        payerClient.assignBilledParty('srv-payer-001', 'contact-sc-metro-02')
      ).rejects.toThrow(PreconditionRequiredError);
    });

    it('updates billedToContactUuid and sets origin to user_selected while preserving isBillable', async () => {
      const initial = await srvClient.get('srv-payer-001');
      const updated = await payerClient.assignBilledParty(
        'srv-payer-001',
        'contact-sc-metro-02',
        initial.etag
      );

      expect(updated.data.billedToContactUuid).toBe('contact-sc-metro-02');
      expect(updated.data.billedPartyOrigin).toBe('user_selected');
      // Verify independent billability preserved
      expect(updated.data.isBillable).toBe(true);
      expect(updated.etag).not.toBe(initial.etag);
    });

    it('throws PreconditionFailedError on stale ETag', async () => {
      await expect(
        payerClient.assignBilledParty(
          'srv-payer-001',
          'contact-sc-metro-02',
          'W/"stale-tag"'
        )
      ).rejects.toThrow(PreconditionFailedError);
    });
  });
});
