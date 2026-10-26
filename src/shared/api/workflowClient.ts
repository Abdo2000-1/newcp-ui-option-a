import { getApiConfig } from './config';
import { HttpTransport, type IHttpTransport } from './httpTransport';
import type { WithVersion } from './types';
import type {
  AvailableTransition,
  TransitionRequest,
  TransitionResult,
  HistoryEvent,
  HoldReasonOption,
  HoldType,
  ServiceItem,
} from './contractTypes';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
  PermissionDeniedError,
  ApiClientError,
} from './errors';
import { SYNTHETIC_DEMO_HOLD_REASONS } from './holdTransitionMockAdapter';

export interface IWorkflowClient {
  getHoldReasons(holdType?: HoldType): Promise<HoldReasonOption[]>;
  getAvailableTransitions(serviceItemUuid: string): Promise<AvailableTransition[]>;
  executeTransition(
    serviceItemUuid: string,
    request: TransitionRequest,
    ifMatch?: string
  ): Promise<WithVersion<TransitionResult>>;
  getHistory(serviceItemUuid: string): Promise<HistoryEvent[]>;
}

export class WorkflowClient implements IWorkflowClient {
  private transport?: IHttpTransport;
  private enableMocks: boolean;
  private mockServices: Map<string, { status: string; holdType?: HoldType; holdReasonCode?: string; etag: string; canTransition?: boolean; isReadOnly?: boolean }> = new Map();
  private mockHistory: Map<string, HistoryEvent[]> = new Map();
  private revisionCounter = 1;

  constructor(transport?: IHttpTransport, enableMocks = true) {
    this.transport = transport;
    this.enableMocks = enableMocks;
    this.initDefaultMocks();
  }

  private initDefaultMocks(): void {
    const srv1 = 'srv-biomodel-001';
    this.mockServices.set(srv1, {
      status: 'pending_intake',
      etag: 'W/"v1-srv-biomodel-001"',
    });
    this.mockHistory.set(srv1, [
      {
        fromCode: 'draft',
        toCode: 'pending_intake',
        actorUserUuid: 'user-system',
        occurredAt: '2026-10-25T10:00:00Z',
        comment: 'Initial order submission',
      },
    ]);
  }

  public async getHoldReasons(holdType?: HoldType): Promise<HoldReasonOption[]> {
    if (this.transport) {
      try {
        const query = holdType ? `?holdType=${encodeURIComponent(holdType)}` : '';
        const res = await this.transport.get<HoldReasonOption[]>(`/catalog/hold-reasons${query}`);
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    if (holdType) {
      return SYNTHETIC_DEMO_HOLD_REASONS.filter(r => r.holdType === holdType);
    }
    return [...SYNTHETIC_DEMO_HOLD_REASONS];
  }

  public async getAvailableTransitions(serviceItemUuid: string): Promise<AvailableTransition[]> {
    if (this.transport) {
      try {
        const res = await this.transport.get<AvailableTransition[]>(
          `/services/${serviceItemUuid}/available-transitions`
        );
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    const svc = this.mockServices.get(serviceItemUuid);
    if (svc && (svc.canTransition === false || svc.isReadOnly === true)) {
      return [];
    }
    const currentStatus = svc ? svc.status : 'pending_intake';

    if (currentStatus === 'on_hold') {
      return [
        {
          transitionId: 201,
          fromCode: 'on_hold',
          toCode: 'in_progress',
          toStatusName: 'Resume In Progress',
        },
        {
          transitionId: 202,
          fromCode: 'on_hold',
          toCode: 'cancelled',
          toStatusName: 'Cancel Order Service',
        },
      ];
    }

    return [
      {
        transitionId: 101,
        fromCode: currentStatus,
        toCode: 'in_progress',
        toStatusName: 'Start In Progress',
      },
      {
        transitionId: 102,
        fromCode: currentStatus,
        toCode: 'on_hold',
        toStatusName: 'Place On Hold',
        requiresHoldDetails: true,
      },
      {
        transitionId: 103,
        fromCode: currentStatus,
        toCode: 'completed',
        toStatusName: 'Complete Service',
      },
    ];
  }

  public async executeTransition(
    serviceItemUuid: string,
    request: TransitionRequest,
    ifMatch?: string
  ): Promise<WithVersion<TransitionResult>> {
    if (!ifMatch) {
      throw new PreconditionRequiredError('An If-Match header containing the current ETag is required for workflow transitions.');
    }

    if (!request || typeof request.transitionId !== 'number') {
      throw new ValidationError({
        code: 'VALIDATION_ERROR',
        message: 'A valid numeric transitionId is required.',
        details: { field: 'transitionId' },
      });
    }

    // Atomic Q-B9 On Hold validation:
    // When placing on hold (or if either hold field is provided), BOTH holdType ('customer' | 'internal')
    // and holdReasonCode are strictly mandatory.
    const isHoldTarget = request.transitionId === 102 || request.holdType !== undefined || request.holdReasonCode !== undefined;
    if (isHoldTarget) {
      if (!request.holdType || !request.holdReasonCode) {
        throw new ValidationError({
          code: 'VALIDATION_ERROR',
          message: 'Entering on_hold requires both holdType ("customer" or "internal") and holdReasonCode.',
          details: { field: !request.holdType ? 'holdType' : 'holdReasonCode' },
        });
      }

      if (request.holdType !== 'customer' && request.holdType !== 'internal') {
        throw new ValidationError({
          code: 'VALIDATION_ERROR',
          message: 'holdType must be strictly "customer" or "internal".',
          details: { field: 'holdType' },
        });
      }
    }

    if (this.transport) {
      try {
        const res = await this.transport.post<TransitionResult>(
          `/services/${serviceItemUuid}/transitions`,
          request,
          { ifMatch }
        );
        return {
          data: res.data,
          etag: res.etag || `W/"srv-${serviceItemUuid}-${Date.now()}"`,
        };
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    let svc = this.mockServices.get(serviceItemUuid);
    if (svc && (svc.canTransition === false || svc.isReadOnly === true)) {
      throw new PermissionDeniedError(`Workflow transitions are not permitted on item "${serviceItemUuid}" (read-only mode).`);
    }
    if (!svc) {
      svc = {
        status: 'pending_intake',
        etag: `W/"v1-${serviceItemUuid}"`,
      };
      this.mockServices.set(serviceItemUuid, svc);
    }

    if (svc.etag !== ifMatch) {
      throw new PreconditionFailedError({
        code: 'STALE_PRECONDITION',
        message: 'The provided If-Match tag does not match the current service item revision.',
        details: { serviceItemUuid, providedETag: ifMatch, currentETag: svc.etag },
      });
    }

    const fromCode = svc.status;
    let toCode = 'in_progress';
    if (request.transitionId === 102) toCode = 'on_hold';
    else if (request.transitionId === 103) toCode = 'completed';
    else if (request.transitionId === 201) toCode = 'in_progress';
    else if (request.transitionId === 202) toCode = 'cancelled';

    this.revisionCounter++;
    const rotatedEtag = `W/"v${this.revisionCounter}-${serviceItemUuid}"`;

    svc.status = toCode;
    svc.etag = rotatedEtag;
    if (toCode === 'on_hold') {
      svc.holdType = request.holdType;
      svc.holdReasonCode = request.holdReasonCode;
    } else {
      svc.holdType = undefined;
      svc.holdReasonCode = undefined;
    }

    const changedAt = new Date().toISOString();
    const result: TransitionResult = {
      serviceItemUuid,
      fromCode,
      toCode,
      changedAt,
      actorUserUuid: 'mock-clerk-user',
      ...(toCode === 'on_hold' ? { holdType: request.holdType, holdReasonCode: request.holdReasonCode } : {}),
    };

    const history = this.mockHistory.get(serviceItemUuid) || [];
    history.push({
      fromCode,
      toCode,
      actorUserUuid: 'mock-clerk-user',
      occurredAt: changedAt,
      comment: request.comment || (toCode === 'on_hold' ? `Placed on hold (${request.holdType}: ${request.holdReasonCode})` : undefined),
    });
    this.mockHistory.set(serviceItemUuid, history);

    return {
      data: result,
      etag: rotatedEtag,
    };
  }

  public async getHistory(serviceItemUuid: string): Promise<HistoryEvent[]> {
    if (this.transport) {
      try {
        const res = await this.transport.get<HistoryEvent[]>(`/services/${serviceItemUuid}/history`);
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / NOT_INTEGRATED fallback
    return [...(this.mockHistory.get(serviceItemUuid) || [])];
  }
}

export const workflowClient = new WorkflowClient(new HttpTransport(), getApiConfig().enableMocks);
