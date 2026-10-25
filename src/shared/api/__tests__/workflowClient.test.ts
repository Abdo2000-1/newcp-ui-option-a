import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowClient } from '../workflowClient';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
} from '../errors';
import type { IHttpTransport } from '../httpTransport';

describe('WorkflowClient (T-API-006)', () => {
  let client: WorkflowClient;

  beforeEach(() => {
    client = new WorkflowClient(undefined, true);
  });

  describe('getHoldReasons', () => {
    it('returns all synthetic demo hold reasons when no filter provided', async () => {
      const reasons = await client.getHoldReasons();
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some(r => r.holdType === 'customer')).toBe(true);
      expect(reasons.some(r => r.holdType === 'internal')).toBe(true);
    });

    it('filters reasons strictly by customer holdType', async () => {
      const reasons = await client.getHoldReasons('customer');
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.every(r => r.holdType === 'customer')).toBe(true);
    });

    it('filters reasons strictly by internal holdType', async () => {
      const reasons = await client.getHoldReasons('internal');
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.every(r => r.holdType === 'internal')).toBe(true);
    });
  });

  describe('getAvailableTransitions', () => {
    it('returns draft/intake transitions including on_hold with requiresHoldDetails', async () => {
      const transitions = await client.getAvailableTransitions('srv-biomodel-001');
      expect(transitions.length).toBeGreaterThan(0);
      const holdTransition = transitions.find(t => t.toCode === 'on_hold');
      expect(holdTransition).toBeDefined();
      expect(holdTransition?.requiresHoldDetails).toBe(true);
    });

    it('returns resume and cancel transitions when item is on_hold', async () => {
      // Put on hold first
      await client.executeTransition(
        'srv-biomodel-001',
        {
          transitionId: 102,
          holdType: 'customer',
          holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
        },
        'W/"v1-srv-biomodel-001"'
      );

      const transitions = await client.getAvailableTransitions('srv-biomodel-001');
      expect(transitions.some(t => t.toCode === 'in_progress')).toBe(true);
      expect(transitions.some(t => t.toCode === 'cancelled')).toBe(true);
    });
  });

  describe('executeTransition validation & concurrency', () => {
    it('throws PreconditionRequiredError when If-Match is missing', async () => {
      await expect(
        client.executeTransition('srv-biomodel-001', { transitionId: 101 })
      ).rejects.toThrow(PreconditionRequiredError);
    });

    it('throws ValidationError when transitionId is invalid', async () => {
      await expect(
        client.executeTransition(
          'srv-biomodel-001',
          {} as unknown as { transitionId: number },
          'W/"v1-srv-biomodel-001"'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when entering on_hold without holdReasonCode', async () => {
      await expect(
        client.executeTransition(
          'srv-biomodel-001',
          { transitionId: 102, holdType: 'customer' },
          'W/"v1-srv-biomodel-001"'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when entering on_hold without holdType', async () => {
      await expect(
        client.executeTransition(
          'srv-biomodel-001',
          { transitionId: 102, holdReasonCode: 'REASON_1' },
          'W/"v1-srv-biomodel-001"'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when holdType is not customer or internal', async () => {
      await expect(
        client.executeTransition(
          'srv-biomodel-001',
          {
            transitionId: 102,
            holdType: 'invalid_type' as unknown as 'customer',
            holdReasonCode: 'REASON_1',
          },
          'W/"v1-srv-biomodel-001"'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws PreconditionFailedError when If-Match tag does not match current ETag', async () => {
      await expect(
        client.executeTransition(
          'srv-biomodel-001',
          { transitionId: 101 },
          'W/"stale-etag"'
        )
      ).rejects.toThrow(PreconditionFailedError);
    });

    it('executes valid atomic on_hold transition and records history', async () => {
      const res = await client.executeTransition(
        'srv-biomodel-001',
        {
          transitionId: 102,
          holdType: 'customer',
          holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
          comment: 'Waiting for scan upload',
        },
        'W/"v1-srv-biomodel-001"'
      );

      expect(res.data.fromCode).toBe('pending_intake');
      expect(res.data.toCode).toBe('on_hold');
      expect(res.data.holdType).toBe('customer');
      expect(res.data.holdReasonCode).toBe('SYNTHETIC_CUSTOMER_AWAITING_INPUT');
      expect(res.etag).not.toBe('W/"v1-srv-biomodel-001"');

      // Verify history recorded
      const history = await client.getHistory('srv-biomodel-001');
      const latest = history[history.length - 1];
      expect(latest.toCode).toBe('on_hold');
      expect(latest.comment).toBe('Waiting for scan upload');
    });
  });

  describe('live transport integration delegation', () => {
    it('calls transport.post with If-Match header and payload', async () => {
      const mockTransport: IHttpTransport = {
        request: vi.fn(),
        get: vi.fn(),
        post: vi.fn().mockResolvedValue({
          data: {
            serviceItemUuid: 'srv-remote-1',
            fromCode: 'draft',
            toCode: 'in_progress',
            changedAt: '2026-10-26T00:00:00Z',
          },
          etag: 'W/"new-remote-tag"',
          status: 200,
        }),
        patch: vi.fn(),
        delete: vi.fn(),
      };

      const liveClient = new WorkflowClient(mockTransport, false);
      const result = await liveClient.executeTransition(
        'srv-remote-1',
        { transitionId: 101 },
        'W/"remote-tag-1"'
      );

      expect(mockTransport.post).toHaveBeenCalledWith(
        '/services/srv-remote-1/transitions',
        { transitionId: 101 },
        { ifMatch: 'W/"remote-tag-1"' }
      );
      expect(result.etag).toBe('W/"new-remote-tag"');
    });
  });
});
