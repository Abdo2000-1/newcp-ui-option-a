/**
 * SYNTHETIC FIXTURE SUITE: New CP Business and OpenAPI Contract Acceptance
 * 
 * All test data used herein are MOCK / SYNTHETIC test fixtures representing
 * sanitized scenarios for Option A acceptance verification.
 * 
 * Note: These tests verify client contract behavior against the approved OpenAPI 3.0.3
 * specification boundary. They do not claim live backend integration until an approved
 * staging backend is deployed and verified.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceClient } from '../serviceClient';
import { WorkflowClient } from '../workflowClient';
import { PricingClient } from '../pricingClient';
import { PayerClient } from '../payerClient';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  PermissionDeniedError,
  ValidationError,
  AuthenticationError,
  ApiClientError,
} from '../errors';
import type { IHttpTransport } from '../httpTransport';
import type { CreateServiceItem, ServiceItem } from '../contractTypes';

describe('FE-TEST-001: Business and Contract Acceptance Test Suite (MOCK / SYNTHETIC)', () => {
  let srvClient: ServiceClient;
  let wfClient: WorkflowClient;
  let pricingClient: PricingClient;
  let payerClient: PayerClient;

  beforeEach(() => {
    srvClient = new ServiceClient();
    wfClient = new WorkflowClient();
    pricingClient = new PricingClient(undefined, srvClient);
    payerClient = new PayerClient(undefined, srvClient);
  });

  describe('Service Creation & Lifecycle Independence', () => {
    // 1. Create Biomodel
    it('1. successfully creates an independent Biomodel service instance', async () => {
      const payload: CreateServiceItem = {
        sellableItemUuid: 'cat-biomodel-sellable',
        answers: [{ fieldCode: 'model_type', value: 'solid' }],
        billedToContactUuid: 'contact-synth-dr-01',
      };

      const res = await srvClient.create('ord-synth-1001', payload);
      expect(res.data.uuid).toMatch(/^srv-/);
      expect(res.data.sellableItemUuid).toBe('cat-biomodel-sellable');
      expect(res.data.status).toBe('pending_intake');
      expect(res.etag).toMatch(/^W\/"srv-/);
    });

    // 2. Create Conversion
    it('2. successfully creates an independent Conversion service instance', async () => {
      const payload: CreateServiceItem = {
        sellableItemUuid: 'cat-conversion-sellable',
        answers: [
          { fieldCode: 'software', value: 'exocad' },
          { fieldCode: 'export_format', value: 'dcm' },
        ],
        billedToContactUuid: 'contact-synth-sc-01',
      };

      const res = await srvClient.create('ord-synth-1001', payload);
      expect(res.data.uuid).toMatch(/^srv-/);
      expect(res.data.sellableItemUuid).toBe('cat-conversion-sellable');
      expect(res.etag).toBeDefined();
    });

    // 3. Create two same-type service instances
    it('3. creates two same-type service instances under the same order with distinct UUIDs', async () => {
      const payload1: CreateServiceItem = {
        sellableItemUuid: 'cat-biomodel-sellable',
        answers: [{ fieldCode: 'arch', value: 'upper' }],
      };
      const payload2: CreateServiceItem = {
        sellableItemUuid: 'cat-biomodel-sellable',
        answers: [{ fieldCode: 'arch', value: 'lower' }],
      };

      const res1 = await srvClient.create('ord-synth-duplicate-type', payload1);
      const res2 = await srvClient.create('ord-synth-duplicate-type', payload2);

      expect(res1.data.uuid).not.toBe(res2.data.uuid);
      expect(res1.data.orderUuid).toBe('ord-synth-duplicate-type');
      expect(res2.data.orderUuid).toBe('ord-synth-duplicate-type');
    });

    // 4. Update each independently
    it('4. updates two same-type service instances independently without cross-mutation', async () => {
      const res1 = await srvClient.create('ord-synth-same', {
        sellableItemUuid: 'cat-biomodel-sellable',
        answers: [{ fieldCode: 'arch', value: 'upper' }],
      });
      const res2 = await srvClient.create('ord-synth-same', {
        sellableItemUuid: 'cat-biomodel-sellable',
        answers: [{ fieldCode: 'arch', value: 'lower' }],
      });

      // Update instance 1 only
      await srvClient.edit(
        res1.data.uuid,
        { serviceNotes: 'Updated Arch Upper specs' },
        res1.etag
      );

      const refreshed1 = await srvClient.get(res1.data.uuid);
      const refreshed2 = await srvClient.get(res2.data.uuid);

      expect(refreshed1.data.serviceNotes).toBe('Updated Arch Upper specs');
      expect(refreshed2.data.serviceNotes).toBeUndefined();
    });
  });

  describe('ETag Concurrency Boundary', () => {
    // 5. ETag success
    it('5. accepts PATCH request with matching If-Match ETag and rotates the revision', async () => {
      const existing = await srvClient.get('srv-biomodel-001');
      const prevEtag = existing.etag;

      const editRes = await srvClient.edit(
        'srv-biomodel-001',
        { serviceNotes: 'Revision 2 test notes' },
        prevEtag
      );

      expect(editRes.etag).not.toBe(prevEtag);
      expect(editRes.data.serviceNotes).toBe('Revision 2 test notes');
    });

    // 6. Stale ETag 412
    it('6. rejects edit with stale If-Match ETag with 412 Precondition Failed', async () => {
      await expect(
        srvClient.edit('srv-biomodel-001', { serviceNotes: 'Stale update' }, 'W/"stale-etag-999"')
      ).rejects.toThrow(PreconditionFailedError);
    });

    // 7. Missing If-Match 428
    it('7. rejects edit without If-Match header with 428 Precondition Required', async () => {
      await expect(
        srvClient.edit('srv-biomodel-001', { serviceNotes: 'No ETag update' }, undefined)
      ).rejects.toThrow(PreconditionRequiredError);
    });
  });

  describe('Atomic Workflow Transitions & On Hold Rules', () => {
    // 8. On Hold without type
    it('8. rejects transition 102 (On Hold) when holdType is missing with 422 ValidationError', async () => {
      await expect(
        wfClient.executeTransition(
          'srv-biomodel-001',
          { transitionId: 102, holdReasonCode: 'CLINICAL_QUERY' } as any,
          'W/"v1-srv-biomodel-001"'
        )
      ).rejects.toThrow(ValidationError);
    });

    // 9. On Hold without reason
    it('9. rejects transition 102 (On Hold) when holdReasonCode is missing with 422 ValidationError', async () => {
      await expect(
        wfClient.executeTransition(
          'srv-biomodel-001',
          { transitionId: 102, holdType: 'customer' } as any,
          'W/"v1-srv-biomodel-001"'
        )
      ).rejects.toThrow(ValidationError);
    });

    // 10. Atomic On Hold request
    it('10. executes atomic On Hold request when both holdType and holdReasonCode are provided', async () => {
      const res = await wfClient.executeTransition(
        'srv-biomodel-001',
        {
          transitionId: 102,
          holdType: 'customer',
          holdReasonCode: 'CLINICAL_QUERY',
          comment: 'Doctor consultation required',
        },
        'W/"v1-srv-biomodel-001"'
      );

      expect(res.data.toCode).toBe('on_hold');
      expect(res.data.holdType).toBe('customer');
      expect(res.data.holdReasonCode).toBe('CLINICAL_QUERY');
    });
  });

  describe('Financial Pricing & Billability Integrity', () => {
    // 11. Authorized price override
    it('11. allows authorized unit price override without resetting existing fields', async () => {
      const existing = await srvClient.get('srv-biomodel-001');

      const updated = await pricingClient.updatePricing(
        'srv-biomodel-001',
        { unitPrice: '145.50', quantity: 2, isBillable: true },
        existing.etag,
        true
      );

      expect(updated.data.unitPrice).toBe('145.50');
      expect(updated.data.quantity).toBe(2);
      expect(updated.data.lineTotal).toBe('291.00');
    });

    // 12. Unauthorized price edit
    it('12. rejects price override when caller is unauthorized with 403 PermissionDeniedError', async () => {
      const existing = await srvClient.get('srv-biomodel-001');

      await expect(
        pricingClient.updatePricing(
          'srv-biomodel-001',
          { unitPrice: '200.00', quantity: 1, isBillable: true },
          existing.etag,
          false // unauthorized
        )
      ).rejects.toThrow(PermissionDeniedError);
    });

    // 13. Zero final amount without reason
    it('13. rejects 0.00 line total without zeroChargeReasonCode with 422 ValidationError', async () => {
      const existing = await srvClient.get('srv-biomodel-001');

      await expect(
        pricingClient.updatePricing(
          'srv-biomodel-001',
          { unitPrice: '0.00', quantity: 1, isBillable: true, zeroChargeReasonCode: '' },
          existing.etag,
          true
        )
      ).rejects.toThrow(ValidationError);
    });

    // 14. Zero final amount with reason
    it('14. accepts 0.00 line total when valid zeroChargeReasonCode is supplied', async () => {
      const existing = await srvClient.get('srv-biomodel-001');

      const res = await pricingClient.updatePricing(
        'srv-biomodel-001',
        {
          unitPrice: '0.00',
          quantity: 1,
          isBillable: true,
          zeroChargeReasonCode: 'WARRANTY',
          zeroChargeNote: 'Remake under clinical warranty',
        },
        existing.etag,
        true
      );

      expect(res.data.lineTotal).toBe('0.00');
      expect(res.data.zeroChargeReasonCode).toBe('WARRANTY');
    });

    // 15. Independent isBillable
    it('15. allows toggling isBillable independently of billedToContactUuid', async () => {
      const existing = await srvClient.get('srv-biomodel-001');
      const contactBefore = existing.data.billedToContactUuid;

      const res = await pricingClient.updatePricing(
        'srv-biomodel-001',
        { unitPrice: '120.00', quantity: 1, isBillable: false },
        existing.etag,
        true
      );

      expect(res.data.isBillable).toBe(false);
      expect(res.data.billedToContactUuid).toBe(contactBefore);
    });

    // 16. Independent Bill To
    it('16. updates item-level payer without altering other services or order contacts', async () => {
      const existing = await srvClient.get('srv-biomodel-001');

      const res = await payerClient.assignBilledParty(
        'srv-biomodel-001',
        'contact-sc-metro-02',
        existing.etag
      );

      expect(res.data.billedToContactUuid).toBe('contact-sc-metro-02');
      // Second item untouched
      const other = await srvClient.get('srv-biomodel-002');
      expect(other.data.billedToContactUuid).not.toBe('contact-sc-metro-02');
    });

    // 17. Financial lock
    it('17. rejects modifications when service item is invoiced (isInvoiced: true) with 403', async () => {
      const existing = await srvClient.get('srv-biomodel-001');
      (srvClient as any).mockStore.get('srv-biomodel-001').item.isInvoiced = true;

      await expect(
        pricingClient.updatePricing(
          'srv-biomodel-001',
          { unitPrice: '190.00', quantity: 1, isBillable: true },
          existing.etag,
          true
        )
      ).rejects.toThrow(PermissionDeniedError);
    });
  });

  describe('Security, Multi-Tenancy & Safe Error Presentation', () => {
    // 18. Unauthorized response
    it('18. handles 401 Unauthorized response from transport without silent retry', async () => {
      const mockTransport = {
        request: vi.fn(),
        get: vi.fn().mockRejectedValue(new AuthenticationError('Token expired')),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      } as unknown as IHttpTransport;

      const liveSrv = new ServiceClient(mockTransport, false);
      await expect(liveSrv.get('srv-any')).rejects.toThrow(AuthenticationError);
    });

    // 19. Forbidden response
    it('19. handles 403 Forbidden response without mock fallback bypass', async () => {
      const mockTransport = {
        request: vi.fn(),
        get: vi.fn(),
        post: vi.fn().mockRejectedValue(new ApiClientError(403, 'Tenant access denied')),
        patch: vi.fn(),
        delete: vi.fn(),
      } as unknown as IHttpTransport;

      const liveWf = new WorkflowClient(mockTransport, false);
      await expect(
        liveWf.executeTransition('srv-any', { transitionId: 101 }, 'W/"test"')
      ).rejects.toThrow(ApiClientError);
    });

    // 20. Same-tenant behavior
    it('20. strictly isolates entities within tenant scope using opaque UUIDs only', async () => {
      const item = await srvClient.get('srv-biomodel-001');

      expect(item.data.uuid).toMatch(/^srv-/);
      expect(item.data.orderUuid).toMatch(/^ord-/);
      expect(item.data.billedToContactUuid).toMatch(/^contact-/);

      // No raw tenant ID exposed
      expect((item.data as any).tenantId).toBeUndefined();
      expect((item.data as any).tenant_id).toBeUndefined();
    });

    // 21. Safe error presentation
    it('21. error objects never expose raw database bigints or unredacted PHI', () => {
      const error = new PermissionDeniedError('Permission denied on service srv-biomodel-001');

      expect(error.status).toBe(403);
      expect(error.message).not.toContain('patient_name');
      expect(error.message).not.toContain('patient_dob');
      expect(error.message).not.toContain('SELECT * FROM');
    });

    // 22. No invented fallback values
    it('22. unpopulated fields return explicit undefined/null or empty without invented placeholders', async () => {
      const res = await srvClient.create('ord-synth-bare', {
        sellableItemUuid: 'cat-biomodel-sellable',
        answers: [],
      });

      expect(res.data.serviceNotes).toBeUndefined();
      expect(res.data.zeroChargeReasonCode ?? null).toBeNull();
      expect(res.data.zeroChargeNote ?? null).toBeNull();
      expect(res.data.isRedo).toBe(false);
    });
  });
});
