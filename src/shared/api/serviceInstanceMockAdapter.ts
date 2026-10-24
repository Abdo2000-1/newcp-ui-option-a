/**
 * ============================================================================
 * OFFLINE MOCK SERVICE-INSTANCE ADAPTER (V0.9.2.2 / Q-B8)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * DESCRIPTION:
 * Pure in-memory test double for service-instance read and edit operations.
 * Implements the provisional V0.9.2.2 service-instance contract and Q-B8
 * optimistic concurrency control (ETag, If-Match, 412, 428).
 *
 * IMPORTANT NON-PRODUCTION CONSTRAINTS:
 * 1. This adapter is strictly an in-memory test double for offline development
 *    and unit/component testing.
 * 2. It contains NO network calls (no fetch), NO database access, NO browser
 *    storage (no localStorage/sessionStorage), and NO production URLs or credentials.
 * 3. F07 database-backed Bill To operations remain intentionally BLOCKED by the
 *    current V3 physical database schema.
 * 4. isBillable is preserved independently as a boolean and is NEVER derived from
 *    Bill To or toBeBilled.
 * 5. This PR implements only the offline mock adapter. Q-B9 through Q-B14 UI
 *    features are NOT implemented in this PR.
 */

import { ApiClientError } from './errors';
import type {
  ServiceItem,
  PatchServiceItem,
  WithVersion,
  IServiceInstanceMockAdapter,
} from './types';

// ============================================================================
// Typed Error Classes
// ============================================================================

export class ServiceInstanceMockError extends ApiClientError {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, message: string, code = 'MOCK_ERROR', details?: unknown) {
    super(status, message, typeof details === 'string' ? details : undefined, code);
    this.name = 'ServiceInstanceMockError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ServiceInstanceMockError.prototype);
  }

  get isStale(): boolean {
    return this.status === 412;
  }

  get isPreconditionRequired(): boolean {
    return this.status === 428;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export class PreconditionRequiredError extends ServiceInstanceMockError {
  constructor(
    message = 'MOCK: Precondition Required. An "If-Match" header containing the current ETag is required to edit a service item.',
    details?: unknown
  ) {
    super(428, message, 'PRECONDITION_REQUIRED', details);
    this.name = 'PreconditionRequiredError';
    Object.setPrototypeOf(this, PreconditionRequiredError.prototype);
  }
}

export class PreconditionFailedError extends ServiceInstanceMockError {
  constructor(
    message = 'MOCK: Precondition Failed. The provided If-Match tag does not match the current revision.',
    details?: unknown
  ) {
    super(412, message, 'PRECONDITION_FAILED', details);
    this.name = 'PreconditionFailedError';
    Object.setPrototypeOf(this, PreconditionFailedError.prototype);
  }
}

export class ServiceItemNotFoundError extends ServiceInstanceMockError {
  constructor(serviceItemUuid: string, details?: unknown) {
    super(
      404,
      `MOCK: Service instance with UUID "${serviceItemUuid}" was not found.`,
      'NOT_FOUND',
      details ?? { serviceItemUuid }
    );
    this.name = 'ServiceItemNotFoundError';
    Object.setPrototypeOf(this, ServiceItemNotFoundError.prototype);
  }
}

// ============================================================================
// Synthetic Initial Fixtures (MOCK DATA ONLY)
// ============================================================================

/**
 * Default synthetic service-instance fixtures from the V0.9.2.2 handoff.
 * Explicitly labeled MOCK; contains no live or clinical data.
 */
export const SYNTHETIC_MOCK_SERVICES: ServiceItem[] = [
  {
    uuid: '00000000-0000-0000-0000-000000000014',
    orderUuid: '00000000-0000-0000-0000-000000000001',
    sellableItemUuid: '00000000-0000-0000-0000-000000000003', // Biomodel
    status: 'new',
    answers: [],
    lineNumber: 1,
    isRedo: false,
    isBillable: true,
    canEditBillability: true,
    currencyCode: 'USD',
    unitPrice: '20.00',
    quantity: 1,
    lineTotal: '20.00',
    zeroChargeReasonCode: null,
    zeroChargeNote: null,
    canEditPrice: true,
    serviceNotes: 'MOCK Biomodel Instance A',
    billedToContactUuid: '00000000-0000-0000-0000-000000000011', // Synthetic Doctor
    billedPartyOrigin: 'user_selected',
    canEditBilledParty: true,
  },
  {
    uuid: '00000000-0000-0000-0000-000000000015',
    orderUuid: '00000000-0000-0000-0000-000000000001',
    sellableItemUuid: '00000000-0000-0000-0000-000000000003', // Biomodel (same-type instance)
    status: 'new',
    answers: [],
    lineNumber: 2,
    isRedo: false,
    isBillable: true,
    canEditBillability: true,
    currencyCode: 'USD',
    unitPrice: '20.00',
    quantity: 1,
    lineTotal: '20.00',
    zeroChargeReasonCode: null,
    zeroChargeNote: null,
    canEditPrice: true,
    serviceNotes: 'MOCK Biomodel Instance B',
    billedToContactUuid: '00000000-0000-0000-0000-000000000012', // Synthetic Scanning Center
    billedPartyOrigin: 'user_selected',
    canEditBilledParty: true,
  },
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// ETag Computation Helper
// ============================================================================

/**
 * Computes a deterministic ETag covering the complete editable service-instance state.
 * Any mutation to answers, billability, payer, quantity, price, or notes produces a new tag.
 */
export function computeMockETag(item: ServiceItem, revision = 1): string {
  const canonicalState = {
    uuid: item.uuid,
    orderUuid: item.orderUuid,
    sellableItemUuid: item.sellableItemUuid,
    status: item.status,
    answers: item.answers,
    lineNumber: item.lineNumber,
    isRedo: item.isRedo,
    isBillable: item.isBillable,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    zeroChargeReasonCode: item.zeroChargeReasonCode,
    zeroChargeNote: item.zeroChargeNote,
    serviceNotes: item.serviceNotes,
    billedToContactUuid: item.billedToContactUuid,
    billedPartyOrigin: item.billedPartyOrigin,
    revision,
  };

  const serialized = JSON.stringify(canonicalState);
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `W/"mock-item-${item.uuid.slice(0, 8)}-${hex}"`;
}

// ============================================================================
// In-Memory Mock Adapter Class
// ============================================================================

export class ServiceInstanceMockAdapter implements IServiceInstanceMockAdapter {
  private items: Map<string, ServiceItem> = new Map();
  private revisions: Map<string, number> = new Map();

  constructor(seedItems: ServiceItem[] = SYNTHETIC_MOCK_SERVICES) {
    this.reset(seedItems);
  }

  /**
   * Resets in-memory state to synthetic seed fixtures.
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
   * Reads a service instance by UUID.
   * Returns item data with opaque ETag header representation.
   * Rejects unknown UUIDs with a deterministic 404 NOT_FOUND error.
   */
  public async item(serviceItemUuid: string): Promise<WithVersion<ServiceItem>> {
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
   * Edits a service instance with Q-B8 optimistic concurrency control.
   * - Missing or empty If-Match yields HTTP 428 PRECONDITION_REQUIRED with zero state mutation.
   * - Stale If-Match yields HTTP 412 PRECONDITION_FAILED with zero state mutation.
   * - Matching If-Match applies patch to the selected item only, rotates ETag, and preserves other items.
   * - isBillable is updated independently and never derived from Bill To.
   */
  public async edit(
    serviceItemUuid: string,
    patch: PatchServiceItem,
    ifMatch?: string
  ): Promise<WithVersion<ServiceItem>> {
    // 1. Precondition Required Guard (Q-B8)
    if (!ifMatch || typeof ifMatch !== 'string' || ifMatch.trim() === '') {
      throw new PreconditionRequiredError(
        'MOCK: Precondition Required. An "If-Match" header containing the current ETag is required to edit a service item.',
        { serviceItemUuid }
      );
    }

    // 2. Existence Guard
    const existing = this.items.get(serviceItemUuid);
    if (!existing) {
      throw new ServiceItemNotFoundError(serviceItemUuid);
    }

    // 3. Stale ETag Guard (Q-B8 Optimistic Concurrency)
    const currentRev = this.revisions.get(serviceItemUuid) ?? 1;
    const currentETag = computeMockETag(existing, currentRev);
    if (ifMatch.trim() !== currentETag) {
      throw new PreconditionFailedError(
        `MOCK: Precondition Failed. The provided If-Match tag "${ifMatch}" does not match the current revision "${currentETag}". The service item has been modified by another operation.`,
        { serviceItemUuid, providedETag: ifMatch, currentETag }
      );
    }

    // 4. Apply Mutation to Selected Item Only
    const updated: ServiceItem = deepClone(existing);

    if (patch.answers !== undefined) {
      updated.answers = deepClone(patch.answers);
    }
    if (patch.isRedo !== undefined) {
      updated.isRedo = patch.isRedo;
    }
    // Independent billability: never derived from Bill To
    if (patch.isBillable !== undefined) {
      updated.isBillable = patch.isBillable;
    }
    if (patch.redoOfItemUuid !== undefined) {
      updated.serviceNotes = updated.serviceNotes
        ? `${updated.serviceNotes} (Redo of ${patch.redoOfItemUuid})`
        : `Redo of ${patch.redoOfItemUuid}`;
    }
    if (patch.serviceNotes !== undefined) {
      updated.serviceNotes = patch.serviceNotes;
    }
    if (patch.billedToContactUuid !== undefined) {
      updated.billedToContactUuid = patch.billedToContactUuid;
      updated.billedPartyOrigin = 'user_selected';
    }
    if (patch.unitPrice !== undefined) {
      updated.unitPrice = patch.unitPrice;
      const numPrice = parseFloat(patch.unitPrice) || 0;
      const qty = updated.quantity ?? 1;
      updated.lineTotal = (numPrice * qty).toFixed(2);
    }
    if (patch.quantity !== undefined) {
      updated.quantity = patch.quantity;
      const numPrice = parseFloat(updated.unitPrice ?? '0') || 0;
      updated.lineTotal = (numPrice * patch.quantity).toFixed(2);
    }
    if (patch.zeroChargeReasonCode !== undefined) {
      updated.zeroChargeReasonCode = patch.zeroChargeReasonCode;
    }
    if (patch.zeroChargeNote !== undefined) {
      updated.zeroChargeNote = patch.zeroChargeNote;
    }

    // 5. Rotate ETag and Store Updated State
    const nextRev = currentRev + 1;
    this.revisions.set(serviceItemUuid, nextRev);
    const rotatedETag = computeMockETag(updated, nextRev);
    this.items.set(serviceItemUuid, updated);

    return {
      data: deepClone(updated),
      etag: rotatedETag,
    };
  }

  /**
   * Helper to retrieve all in-memory mock items for offline inspection.
   */
  public list(): ServiceItem[] {
    return Array.from(this.items.values()).map(deepClone);
  }
}

/**
 * Export default singleton instance for offline development.
 */
export const serviceInstanceMockAdapter = new ServiceInstanceMockAdapter();
