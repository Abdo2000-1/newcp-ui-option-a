/**
 * ============================================================================
 * OFFLINE MOCK ON-HOLD TRANSITION ADAPTER (V0.9.2.2 / Q-B9)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * EXPLICIT ARCHITECTURAL AND INTEGRATION NOTICE:
 * 1. This adapter is strictly an isolated, in-memory mock test double enforcing
 *    the approved Q-B9 On Hold transition rule.
 * 2. It contains ZERO live network calls, ZERO database connections, and ZERO
 *    browser storage operations.
 * 3. Every new On Hold transition atomically requires BOTH `holdType` and
 *    `holdReasonCode`.
 * 4. Hold reasons are resolved exclusively from the temporary synthetic demo lookup
 *    (SYNTHETIC_DEMO_HOLD_REASONS). They are NOT historical, canonical, or
 *    production-approved taxonomy values.
 * 5. Valid temporary hold types are strictly 'customer' and 'internal'.
 * 6. Non-On-Hold workflow transitions are NOT modified or invented.
 * 7. Live F07 database persistence remains completely BLOCKED by the missing
 *    V3 database schema columns.
 */

import { ApiClientError } from './errors';
import {
  SYNTHETIC_MOCK_SERVICES,
  computeMockETag,
  PreconditionRequiredError,
  PreconditionFailedError,
  ServiceItemNotFoundError,
} from './serviceInstanceMockAdapter';
import type {
  ServiceItem,
  HoldType,
  HoldReasonOption,
  OnHoldTransitionRequest,
  HoldTransitionResult,
  WithVersion,
  IHoldTransitionMockAdapter,
} from './types';

// ============================================================================
// Temporary Synthetic Hold Reasons Lookup (DEMO / MOCK ONLY)
// Sourced from docs/newcp-ai/references/f07/fixtures/temporary_hold_reasons_demo_mock.json
// ============================================================================

export const SYNTHETIC_DEMO_HOLD_REASONS: readonly HoldReasonOption[] = [
  {
    code: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
    label: 'Demo only — Awaiting customer input',
    holdType: 'customer',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_CUSTOMER_FILE_REUPLOAD',
    label: 'Demo only — Awaiting file resubmission',
    holdType: 'customer',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_REVIEW',
    label: 'Demo only — Internal review',
    holdType: 'internal',
    isTemporary: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_CAPACITY',
    label: 'Demo only — Internal capacity',
    holdType: 'internal',
    isTemporary: true,
  },
] as const;

// ============================================================================
// Typed Error Classes for Hold Transitions
// ============================================================================

export class HoldTransitionValidationError extends ApiClientError {
  public readonly code: string;
  public readonly field?: string;
  public readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    code: string,
    field?: string,
    details?: unknown
  ) {
    super(status, message, typeof details === 'string' ? details : undefined, code);
    this.name = 'HoldTransitionValidationError';
    this.code = code;
    this.field = field;
    this.details = details;
    Object.setPrototypeOf(this, HoldTransitionValidationError.prototype);
  }

  get isHoldTypeMissing(): boolean {
    return this.code === 'HOLD_TYPE_REQUIRED';
  }

  get isHoldReasonMissing(): boolean {
    return this.code === 'HOLD_REASON_CODE_REQUIRED';
  }

  get isInvalidHoldType(): boolean {
    return this.code === 'INVALID_HOLD_TYPE';
  }

  get isUnknownReason(): boolean {
    return this.code === 'UNKNOWN_HOLD_REASON_CODE';
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// Hold Transition Mock Adapter Class
// ============================================================================

export class HoldTransitionMockAdapter implements IHoldTransitionMockAdapter {
  private items: Map<string, ServiceItem> = new Map();
  private revisions: Map<string, number> = new Map();

  constructor(seedItems: ServiceItem[] = SYNTHETIC_MOCK_SERVICES) {
    this.reset(seedItems);
  }

  /**
   * Resets in-memory state to pristine seed fixtures.
   */
  public reset(seedItems: ServiceItem[] = SYNTHETIC_MOCK_SERVICES): void {
    this.items.clear();
    this.revisions.clear();
    for (const item of seedItems) {
      this.items.set(item.uuid, deepClone(item));
      this.revisions.set(item.uuid, 1);
    }
  }

  /**
   * Returns temporary synthetic hold reasons, optionally filtered by holdType.
   * Preserves isTemporary metadata.
   */
  public getHoldReasons(holdType?: HoldType): HoldReasonOption[] {
    const reasons = holdType
      ? SYNTHETIC_DEMO_HOLD_REASONS.filter((r) => r.holdType === holdType)
      : SYNTHETIC_DEMO_HOLD_REASONS;
    return deepClone(reasons as HoldReasonOption[]);
  }

  /**
   * Reads a service instance by UUID with version/ETag.
   */
  public async getItem(serviceItemUuid: string): Promise<WithVersion<ServiceItem>> {
    const item = this.items.get(serviceItemUuid);
    if (!item) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }
    const rev = this.revisions.get(serviceItemUuid) ?? 1;
    return {
      data: deepClone(item),
      etag: computeMockETag(item, rev),
    };
  }

  /**
   * Atomically transitions a service instance to 'on_hold' (Q-B9).
   *
   * Enforces:
   * 1. Existence check (404).
   * 2. Atomic holdType validation (422 HOLD_TYPE_REQUIRED, INVALID_HOLD_TYPE).
   * 3. Atomic holdReasonCode validation (422 HOLD_REASON_CODE_REQUIRED, UNKNOWN_HOLD_REASON_CODE).
   * 4. Concurrency check (428 PRECONDITION_REQUIRED, 412 PRECONDITION_FAILED) when ifMatch provided.
   * 5. Atomic state update: status='on_hold', holdType, holdReasonCode, rotated ETag.
   * 6. Zero mutation on failure; peer items completely isolated.
   */
  public async transitionToOnHold(
    serviceItemUuid: string,
    request: OnHoldTransitionRequest,
    ifMatch?: string
  ): Promise<HoldTransitionResult> {
    // 1. Existence check
    const existing = this.items.get(serviceItemUuid);
    if (!existing) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }

    // 2. Atomic holdType check
    if (!request || !request.holdType || typeof request.holdType !== 'string' || (request.holdType as string).trim() === '') {
      throw new HoldTransitionValidationError(
        422,
        'MOCK: holdType is required for On Hold transition.',
        'HOLD_TYPE_REQUIRED',
        'holdType'
      );
    }

    if (request.holdType !== 'customer' && request.holdType !== 'internal') {
      throw new HoldTransitionValidationError(
        422,
        `MOCK: Invalid holdType "${request.holdType}". Valid types are strictly "customer" and "internal".`,
        'INVALID_HOLD_TYPE',
        'holdType',
        { providedHoldType: request.holdType }
      );
    }

    // 3. Atomic holdReasonCode check
    if (!request.holdReasonCode || typeof request.holdReasonCode !== 'string' || request.holdReasonCode.trim() === '') {
      throw new HoldTransitionValidationError(
        422,
        'MOCK: holdReasonCode is required for On Hold transition.',
        'HOLD_REASON_CODE_REQUIRED',
        'holdReasonCode'
      );
    }

    // Resolve reason code against synthetic demo lookup matching the given holdType
    const matchedReason = SYNTHETIC_DEMO_HOLD_REASONS.find(
      (r) => r.code === request.holdReasonCode && r.holdType === request.holdType
    );

    if (!matchedReason) {
      throw new HoldTransitionValidationError(
        422,
        `MOCK: holdReasonCode "${request.holdReasonCode}" is unknown or does not match holdType "${request.holdType}".`,
        'UNKNOWN_HOLD_REASON_CODE',
        'holdReasonCode',
        { holdReasonCode: request.holdReasonCode, holdType: request.holdType }
      );
    }

    // 4. Concurrency validation (Q-B8 optimistic concurrency)
    const currentRev = this.revisions.get(serviceItemUuid) ?? 1;
    const currentETag = computeMockETag(existing, currentRev);

    if (ifMatch !== undefined) {
      if (typeof ifMatch !== 'string' || ifMatch.trim() === '') {
        throw new PreconditionRequiredError(
          'MOCK: Precondition Required. If-Match header must not be empty.',
          { serviceItemUuid }
        );
      }
      if (ifMatch.trim() !== currentETag) {
        throw new PreconditionFailedError(
          `MOCK: Precondition Failed. Provided If-Match tag "${ifMatch}" does not match current ETag "${currentETag}".`,
          { serviceItemUuid, providedETag: ifMatch, currentETag }
        );
      }
    }

    // 5. Apply atomic transition to selected item only
    const updated: ServiceItem = deepClone(existing);
    updated.status = 'on_hold';
    updated.holdType = request.holdType;
    updated.holdReasonCode = request.holdReasonCode;

    const nextRev = currentRev + 1;
    this.revisions.set(serviceItemUuid, nextRev);
    const rotatedETag = computeMockETag(updated, nextRev);
    this.items.set(serviceItemUuid, updated);

    return {
      item: deepClone(updated),
      transition: {
        toStatus: 'on_hold',
        holdType: request.holdType,
        holdReasonCode: request.holdReasonCode,
        isTemporary: true,
        comment: request.comment,
        transitionedAt: new Date().toISOString(),
      },
      etag: rotatedETag,
    };
  }
}

/**
 * Singleton mock adapter instance for offline development.
 */
export const holdTransitionMockAdapter = new HoldTransitionMockAdapter();
