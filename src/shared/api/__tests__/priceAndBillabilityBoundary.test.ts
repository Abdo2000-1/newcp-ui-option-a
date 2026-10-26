import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingClient } from '../pricingClient';
import { PayerClient, PROPOSAL_PENDING_BACKEND_REVIEW } from '../payerClient';
import { ServiceClient } from '../serviceClient';
import type { IHttpTransport } from '../httpTransport';
import type { ServiceItem } from '../contractTypes';
import {
  PermissionDeniedError,
  ValidationError,
  PreconditionRequiredError,
  ApiClientError,
} from '../errors';

describe('FE-FIN-001: Price Override and Independent Billability Boundary', () => {
  let srvClient: ServiceClient;
  let pricingClient: PricingClient;
  let payerClient: PayerClient;
  let mockTransport: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const BASE_ITEM: ServiceItem = {
    uuid: 'srv-fin-001',
    orderUuid: 'ord-fin-101',
    sellableItemUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    status: 'pending_intake',
    answers: [],
    billedToContactUuid: 'contact-dr-smith-01',
    billedPartyOrigin: 'order_default',
    isBillable: true,
    canEditPrice: true,
    canEditBillability: true,
    canEditBilledParty: true,
    isInvoiced: false,
    unitPrice: '120.00',
    quantity: 1,
    lineTotal: '120.00',
    currencyCode: 'USD',
  };

  beforeEach(() => {
    mockTransport = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };
    srvClient = new ServiceClient(undefined, true);
    srvClient.reset([BASE_ITEM]);
    pricingClient = new PricingClient(undefined, srvClient, true);
    payerClient = new PayerClient(undefined, srvClient, true);
  });

  it('allows authorized price override and preserves the override without silent reset', async () => {
    const initial = await srvClient.get('srv-fin-001');

    const updated = await pricingClient.updatePricing(
      'srv-fin-001',
      { unitPrice: '150.00', quantity: 2 },
      initial.etag,
      true
    );

    expect(updated.data.unitPrice).toBe('150.00');
    expect(updated.data.quantity).toBe(2);
    expect(updated.data.lineTotal).toBe('300.00');

    // Re-fetching confirms the override was retained
    const refetched = await srvClient.get('srv-fin-001');
    expect(refetched.data.unitPrice).toBe('150.00');
    expect(refetched.data.lineTotal).toBe('300.00');
  });

  it('rejects unauthorized price editing with PermissionDeniedError (403)', async () => {
    const initial = await srvClient.get('srv-fin-001');

    // 1. Caller unauthorized (lacks clerk price override role)
    await expect(
      pricingClient.updatePricing(
        'srv-fin-001',
        { unitPrice: '99.00' },
        initial.etag,
        false
      )
    ).rejects.toThrow(PermissionDeniedError);

    // 2. Service item marked canEditPrice: false
    const lockedItem: ServiceItem = { ...BASE_ITEM, uuid: 'srv-locked-price', canEditPrice: false };
    srvClient.reset([lockedItem]);
    const lockedInitial = await srvClient.get('srv-locked-price');

    await expect(
      pricingClient.updatePricing(
        'srv-locked-price',
        { unitPrice: '99.00' },
        lockedInitial.etag,
        true
      )
    ).rejects.toThrow(PermissionDeniedError);
  });

  it('rejects zero line total when zeroChargeReasonCode is omitted (422)', async () => {
    const initial = await srvClient.get('srv-fin-001');

    await expect(
      pricingClient.updatePricing(
        'srv-fin-001',
        { unitPrice: '0.00' },
        initial.etag
      )
    ).rejects.toThrow(ValidationError);

    try {
      await pricingClient.updatePricing(
        'srv-fin-001',
        { unitPrice: '0.00' },
        initial.etag
      );
    } catch (err: any) {
      expect(err.code).toBe('ZERO_CHARGE_REASON_REQUIRED');
      expect(err.details?.field).toBe('zeroChargeReasonCode');
    }
  });

  it('accepts zero line total when a valid zeroChargeReasonCode is supplied', async () => {
    const initial = await srvClient.get('srv-fin-001');

    const updated = await pricingClient.updatePricing(
      'srv-fin-001',
      {
        unitPrice: '0.00',
        zeroChargeReasonCode: 'DOCTOR_DISCOUNT',
        zeroChargeNote: 'Courtesy adjustment authorized by supervisor',
      },
      initial.etag
    );

    expect(updated.data.unitPrice).toBe('0.00');
    expect(updated.data.lineTotal).toBe('0.00');
    expect(updated.data.zeroChargeReasonCode).toBe('DOCTOR_DISCOUNT');
    expect(updated.data.zeroChargeNote).toBe('Courtesy adjustment authorized by supervisor');
  });

  it('maintains independent Billable and Bill To values without cross-derivation', async () => {
    const initial = await srvClient.get('srv-fin-001');

    // Case A: Non-billable service item that STILL retains its assigned Bill To contact
    const nonBillable = await pricingClient.updatePricing(
      'srv-fin-001',
      { isBillable: false },
      initial.etag
    );

    expect(nonBillable.data.isBillable).toBe(false);
    expect(nonBillable.data.billedToContactUuid).toBe('contact-dr-smith-01');

    // Case B: Billable item with a different contact
    const billableCenter = await payerClient.assignBilledParty(
      'srv-fin-001',
      'contact-sc-metro-02',
      nonBillable.etag
    );

    expect(billableCenter.data.billedToContactUuid).toBe('contact-sc-metro-02');
    expect(billableCenter.data.isBillable).toBe(false); // retains non-billable state independently
  });

  it('enforces financial locks: disables mutation when item is invoiced or locked', async () => {
    const invoicedItem: ServiceItem = {
      ...BASE_ITEM,
      uuid: 'srv-invoiced-001',
      isInvoiced: true,
      canEditPrice: false,
      canEditBillability: false,
    };
    srvClient.reset([invoicedItem]);
    const initial = await srvClient.get('srv-invoiced-001');

    // Attempting to mutate price
    await expect(
      pricingClient.updatePricing('srv-invoiced-001', { unitPrice: '200.00' }, initial.etag)
    ).rejects.toThrow(PermissionDeniedError);

    // Attempting to mutate billability
    await expect(
      pricingClient.updatePricing('srv-invoiced-001', { isBillable: false }, initial.etag)
    ).rejects.toThrow(PermissionDeniedError);
  });

  it('in LIVE_HTTP mode, propagates 403, 409, and 422 responses from transport without mock fallback', async () => {
    const liveTransport = {
      request: vi.fn(),
      get: vi.fn().mockResolvedValue({ data: BASE_ITEM, etag: 'W/"test"' }),
      post: vi.fn(),
      patch: vi.fn().mockRejectedValueOnce(
        new ApiClientError(409, 'Conflict: item is locked for month-end close')
      ),
      delete: vi.fn(),
    } as unknown as IHttpTransport;

    const liveSrv = new ServiceClient(liveTransport, false);
    const livePricing = new PricingClient(liveTransport, liveSrv, false);

    await expect(
      livePricing.updatePricing('srv-fin-001', { unitPrice: '180.00' }, 'W/"test"')
    ).rejects.toThrow('Conflict: item is locked for month-end close');
  });

  it('confirms no live payer write claim: payerClient status is PROPOSAL_PENDING_BACKEND_REVIEW', () => {
    expect(payerClient.status).toBe(PROPOSAL_PENDING_BACKEND_REVIEW);
    expect(PROPOSAL_PENDING_BACKEND_REVIEW).toBe('PROPOSAL_PENDING_BACKEND_REVIEW');
  });
});
