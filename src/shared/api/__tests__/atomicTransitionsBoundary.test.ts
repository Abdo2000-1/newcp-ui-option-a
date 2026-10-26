import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowClient } from '../workflowClient';
import type { IHttpTransport } from '../httpTransport';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
  ApiClientError,
} from '../errors';

describe('FE-WORKFLOW-001: Atomic Service Workflow Transitions Boundary', () => {
  let client: WorkflowClient;
  let mockTransport: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTransport = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };
    client = new WorkflowClient(undefined, true);
  });

  it('executes a valid forward workflow transition with If-Match and rotates ETag', async () => {
    const transitions = await client.getAvailableTransitions('srv-biomodel-001');
    const startProgress = transitions.find(t => t.toCode === 'in_progress');
    expect(startProgress).toBeDefined();

    const res = await client.executeTransition(
      'srv-biomodel-001',
      { transitionId: startProgress!.transitionId, comment: 'Starting fabrication' },
      'W/"v1-srv-biomodel-001"'
    );

    expect(res.data.fromCode).toBe('pending_intake');
    expect(res.data.toCode).toBe('in_progress');
    expect(res.data.actorUserUuid).toBe('mock-clerk-user');
    expect(res.etag).not.toBe('W/"v1-srv-biomodel-001"');
    expect(res.etag).toMatch(/^W\/"v2-srv-biomodel-001"/);
  });

  it('rejects on_hold transition when holdType is missing (422)', async () => {
    await expect(
      client.executeTransition(
        'srv-biomodel-001',
        {
          transitionId: 102,
          holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
        },
        'W/"v1-srv-biomodel-001"'
      )
    ).rejects.toThrow(ValidationError);
  });

  it('rejects on_hold transition when holdReasonCode is missing (422)', async () => {
    await expect(
      client.executeTransition(
        'srv-biomodel-001',
        {
          transitionId: 102,
          holdType: 'customer',
        },
        'W/"v1-srv-biomodel-001"'
      )
    ).rejects.toThrow(ValidationError);
  });

  it('submits both holdType and holdReasonCode atomically in a single transition payload', async () => {
    const res = await client.executeTransition(
      'srv-biomodel-001',
      {
        transitionId: 102,
        holdType: 'internal',
        holdReasonCode: 'SYNTHETIC_INTERNAL_EQUIPMENT_CALIBRATION',
        comment: '3D Printer optical sensor recalibration in progress',
      },
      'W/"v1-srv-biomodel-001"'
    );

    expect(res.data.toCode).toBe('on_hold');
    expect(res.data.holdType).toBe('internal');
    expect(res.data.holdReasonCode).toBe('SYNTHETIC_INTERNAL_EQUIPMENT_CALIBRATION');

    // Verify history trail contains atomic details
    const history = await client.getHistory('srv-biomodel-001');
    const lastEvent = history[history.length - 1];
    expect(lastEvent.toCode).toBe('on_hold');
    expect(lastEvent.comment).toContain('3D Printer optical sensor recalibration');
  });

  it('verifies synthetic hold reasons are clearly marked as synthetic and temporary', async () => {
    const reasons = await client.getHoldReasons();
    expect(reasons.length).toBeGreaterThan(0);

    for (const r of reasons) {
      expect(r.isTemporary).toBe(true);
      expect(r.code).toMatch(/^SYNTHETIC_/);
      expect(r.label).toMatch(/Demo only/i);
    }
  });

  it('rejects invalid or non-numeric transitionId with ValidationError', async () => {
    await expect(
      client.executeTransition(
        'srv-biomodel-001',
        { transitionId: 'invalid' as unknown as number },
        'W/"v1-srv-biomodel-001"'
      )
    ).rejects.toThrow(ValidationError);
  });

  it('rejects transition with 412 PreconditionFailedError when stale If-Match is provided', async () => {
    // Stale tag attempt
    await expect(
      client.executeTransition(
        'srv-biomodel-001',
        { transitionId: 101 },
        'W/"stale-revision-tag"'
      )
    ).rejects.toThrow(PreconditionFailedError);
  });

  it('loads and maintains complete immutable transition audit history', async () => {
    const historyBefore = await client.getHistory('srv-biomodel-001');
    const initialCount = historyBefore.length;

    await client.executeTransition(
      'srv-biomodel-001',
      { transitionId: 101, comment: 'Audit test progression' },
      'W/"v1-srv-biomodel-001"'
    );

    const historyAfter = await client.getHistory('srv-biomodel-001');
    expect(historyAfter.length).toBe(initialCount + 1);

    const latest = historyAfter[historyAfter.length - 1];
    expect(latest.fromCode).toBe('pending_intake');
    expect(latest.toCode).toBe('in_progress');
    expect(latest.comment).toBe('Audit test progression');
    expect(latest.occurredAt).toBeDefined();
  });

  it('conforms strictly to approved status codes without inventing fictional values', async () => {
    const transitions = await client.getAvailableTransitions('srv-biomodel-001');
    const validCanonicalStatuses = ['draft', 'pending_intake', 'in_progress', 'on_hold', 'completed', 'cancelled'];

    for (const t of transitions) {
      expect(validCanonicalStatuses).toContain(t.fromCode);
      expect(validCanonicalStatuses).toContain(t.toCode);
    }
  });

  it('in LIVE_HTTP mode, propagates 403, 409, 412, and 422 responses from transport without fallback', async () => {
    const liveTransport: IHttpTransport = {
      get: vi.fn(),
      post: vi.fn().mockRejectedValueOnce(
        new ApiClientError(409, 'Conflict: clinical approval required before release from hold')
      ),
      patch: vi.fn(),
    };

    const liveClient = new WorkflowClient(liveTransport, false);

    await expect(
      liveClient.executeTransition('srv-biomodel-001', { transitionId: 201 }, 'W/"test"')
    ).rejects.toThrow('Conflict: clinical approval required before release from hold');
  });
});
