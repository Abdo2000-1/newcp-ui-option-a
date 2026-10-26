import { PreconditionFailedError, PreconditionRequiredError } from './errors';
import type { WithVersion } from './types';

export interface ConcurrencyState<TDraft = unknown> {
  currentEtag?: string;
  hasConflict: boolean;
  conflictDetails?: {
    serviceItemUuid: string;
    clientEtag?: string;
    serverEtag?: string;
    message: string;
  };
  unsavedDraft?: TDraft;
}

export class ConcurrencyManager {
  private etags: Map<string, string> = new Map();
  private states: Map<string, ConcurrencyState> = new Map();
  private drafts: Map<string, unknown> = new Map();
  private listeners: Map<string, Set<(state: ConcurrencyState) => void>> = new Map();

  public saveDraft(key: string, draft: unknown): void {
    this.drafts.set(key, draft);
    const existing = this.states.get(key) || { hasConflict: false };
    const nextState: ConcurrencyState = {
      ...existing,
      unsavedDraft: draft,
    };
    this.states.set(key, nextState);
    this.notify(key, nextState);
  }

  public getDraft<T = unknown>(key: string): T | undefined {
    return this.drafts.get(key) as T | undefined;
  }

  public clearDraft(key: string): void {
    this.drafts.delete(key);
    const existing = this.states.get(key);
    if (existing && existing.unsavedDraft !== undefined) {
      const nextState: ConcurrencyState = {
        ...existing,
        unsavedDraft: undefined,
      };
      this.states.set(key, nextState);
      this.notify(key, nextState);
    }
  }

  public getEtag(key: string): string | undefined {
    return this.etags.get(key);
  }

  public setEtag(key: string, etag: string): void {
    if (!etag) return;
    this.etags.set(key, etag);
    const existing = this.states.get(key) || { hasConflict: false };
    const nextState: ConcurrencyState = {
      ...existing,
      currentEtag: etag,
      hasConflict: false,
      conflictDetails: undefined,
    };
    this.states.set(key, nextState);
    this.notify(key, nextState);
  }

  public clear(key: string): void {
    this.etags.delete(key);
    this.states.delete(key);
  }

  public clearAll(): void {
    this.etags.clear();
    this.states.clear();
  }

  public getState(key: string): ConcurrencyState {
    return this.states.get(key) || {
      currentEtag: this.etags.get(key),
      hasConflict: false,
    };
  }

  public subscribe(key: string, listener: (state: ConcurrencyState) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notify(key: string, state: ConcurrencyState): void {
    this.listeners.get(key)?.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('Error in concurrency listener:', err);
      }
    });
  }

  public recordConflict(
    key: string,
    clientEtag?: string,
    serverEtag?: string,
    message?: string,
    unsavedDraft?: unknown
  ): ConcurrencyState {
    const draft = unsavedDraft !== undefined ? unsavedDraft : this.drafts.get(key);
    if (unsavedDraft !== undefined) {
      this.drafts.set(key, unsavedDraft);
    }
    const nextState: ConcurrencyState = {
      currentEtag: serverEtag || this.etags.get(key),
      hasConflict: true,
      conflictDetails: {
        serviceItemUuid: key,
        clientEtag,
        serverEtag,
        message: message || 'Stale revision conflict (412 Precondition Failed). The entity was modified concurrently.',
      },
      unsavedDraft: draft,
    };
    this.states.set(key, nextState);
    this.notify(key, nextState);
    return nextState;
  }

  public resetConflict(key: string): void {
    const existing = this.states.get(key);
    if (existing) {
      const nextState: ConcurrencyState = {
        ...existing,
        hasConflict: false,
        conflictDetails: undefined,
      };
      this.states.set(key, nextState);
      this.notify(key, nextState);
    }
  }

  /**
   * Executes a mutation function with automatic ETag retrieval and concurrency handling.
   * On success: stores the rotated ETag from the returned WithVersion<T>.
   * On 412: sets conflict state and re-throws the error.
   * On 428: validates precondition requirements and re-throws.
   */
  public async executeMutation<T, TDraft = unknown>(
    key: string,
    mutation: (etag: string) => Promise<WithVersion<T>>,
    overrideEtag?: string,
    draftData?: TDraft
  ): Promise<WithVersion<T>> {
    const etag = overrideEtag || this.getEtag(key);
    if (!etag) {
      throw new PreconditionRequiredError(
        `Precondition Required (428): No ETag cached for entity "${key}". Fetch entity before mutating.`
      );
    }

    try {
      const result = await mutation(etag);
      if (result && result.etag) {
        this.setEtag(key, result.etag);
        this.clearDraft(key);
      }
      return result;
    } catch (err: unknown) {
      if (err instanceof PreconditionFailedError || (err as { status?: number }).status === 412) {
        const errorDetails = err as { details?: { currentETag?: string } };
        const serverEtag = errorDetails?.details?.currentETag;
        this.recordConflict(key, etag, serverEtag, (err as Error).message, draftData);
      }
      throw err;
    }
  }

  /**
   * Helper to reconcile a conflict: fetches fresh entity and updates stored ETag.
   */
  public async reconcile<T>(
    key: string,
    fetcher: () => Promise<WithVersion<T>>
  ): Promise<WithVersion<T>> {
    const fresh = await fetcher();
    if (fresh && fresh.etag) {
      this.setEtag(key, fresh.etag);
    }
    return fresh;
  }
}

export const concurrencyManager = new ConcurrencyManager();
