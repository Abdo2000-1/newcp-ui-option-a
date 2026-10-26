import { describe, it, expect } from 'vitest';
import { ServiceClient } from '../serviceClient';
import { WorkflowClient } from '../workflowClient';
import { PricingClient } from '../pricingClient';
import type { ServiceItem } from '../contractTypes';

describe('FE-UX-001: Instance-Aware Order Details Boundary Tests', () => {
  it('supports two same-type service instances under the same order with independent state', async () => {
    const srvClient = new ServiceClient();
    const wfClient = new WorkflowClient();
    const pricingClient = new PricingClient(undefined, srvClient);

    // Seed two independent same-type items under order "ord-demo-same-type"
    const item1: ServiceItem = {
      uuid: 'srv-biomodel-alpha',
      orderUuid: 'ord-demo-same-type',
      sellableItemUuid: 'cat-biomodel-sellable',
      status: 'pending_intake',
      answers: [{ fieldCode: 'model_type', value: 'solid' }],
      billedToContactUuid: 'contact-doctor-01',
      billedPartyOrigin: 'user_selected',
      isBillable: true,
      unitPrice: '120.00',
      quantity: 1,
      lineTotal: '120.00',
      currencyCode: 'USD',
    };

    const item2: ServiceItem = {
      uuid: 'srv-biomodel-beta',
      orderUuid: 'ord-demo-same-type',
      sellableItemUuid: 'cat-biomodel-sellable',
      status: 'on_hold',
      holdType: 'customer',
      holdReasonCode: 'CLINICAL_QUERY',
      answers: [{ fieldCode: 'model_type', value: 'hollow' }],
      billedToContactUuid: 'contact-scancenter-02',
      billedPartyOrigin: 'user_selected',
      isBillable: false,
      unitPrice: '0.00',
      quantity: 1,
      lineTotal: '0.00',
      zeroChargeReasonCode: 'WARRANTY',
      currencyCode: 'USD',
    };

    (srvClient as any).mockStore.set('srv-biomodel-alpha', {
      item: item1,
      etag: 'W/"item-alpha-1"',
    });

    (srvClient as any).mockStore.set('srv-biomodel-beta', {
      item: item2,
      etag: 'W/"item-beta-1"',
    });

    // 1. Verify independent retrieval by UUID
    const res1 = await srvClient.get('srv-biomodel-alpha');
    const res2 = await srvClient.get('srv-biomodel-beta');

    expect(res1.data.uuid).toBe('srv-biomodel-alpha');
    expect(res2.data.uuid).toBe('srv-biomodel-beta');
    expect(res1.data.status).toBe('pending_intake');
    expect(res2.data.status).toBe('on_hold');
    expect(res1.data.isBillable).toBe(true);
    expect(res2.data.isBillable).toBe(false);
    expect(res1.data.billedToContactUuid).toBe('contact-doctor-01');
    expect(res2.data.billedToContactUuid).toBe('contact-scancenter-02');

    // 2. Mutate pricing on item 1; item 2 must remain completely unchanged
    await pricingClient.updatePricing(
      'srv-biomodel-alpha',
      { unitPrice: '180.00', quantity: 2, isBillable: true },
      'W/"item-alpha-1"',
      true
    );

    const refreshed1 = await srvClient.get('srv-biomodel-alpha');
    const refreshed2 = await srvClient.get('srv-biomodel-beta');

    expect(refreshed1.data.unitPrice).toBe('180.00');
    expect(refreshed1.data.quantity).toBe(2);
    expect(refreshed1.data.lineTotal).toBe('360.00');

    // Item 2 unaffected
    expect(refreshed2.data.unitPrice).toBe('0.00');
    expect(refreshed2.data.quantity).toBe(1);
    expect(refreshed2.data.lineTotal).toBe('0.00');
    expect(refreshed2.data.isBillable).toBe(false);
    expect(refreshed2.data.status).toBe('on_hold');
  });

  it('scopes history events strictly per serviceItemUuid', async () => {
    const wfClient = new WorkflowClient();
    (wfClient as any).mockServices.set('srv-item-x', {
      status: 'pending_intake',
      etag: 'W/"x-1"',
    });
    (wfClient as any).mockServices.set('srv-item-y', {
      status: 'pending_intake',
      etag: 'W/"y-1"',
    });

    // Advance item X only
    await wfClient.executeTransition('srv-item-x', { transitionId: 101 }, 'W/"x-1"');

    const histX = await wfClient.getHistory('srv-item-x');
    const histY = await wfClient.getHistory('srv-item-y');

    expect(histX.length).toBeGreaterThan(0);
    expect(histX[0].toCode).toBe('in_progress');

    // Item Y has no transitions in its history
    expect(histY.length).toBe(0);
  });
});
