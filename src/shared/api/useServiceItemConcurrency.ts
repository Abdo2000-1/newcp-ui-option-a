import { useState, useEffect, useCallback } from 'react';
import { concurrencyManager, type ConcurrencyState } from './concurrencyManager';
import type { WithVersion } from './types';

export function useServiceItemConcurrency<TDraft = unknown>(serviceItemUuid?: string) {
  const [state, setState] = useState<ConcurrencyState<TDraft>>(() =>
    serviceItemUuid ? concurrencyManager.getState(serviceItemUuid) as ConcurrencyState<TDraft> : { hasConflict: false }
  );

  useEffect(() => {
    if (!serviceItemUuid) return;
    setState(concurrencyManager.getState(serviceItemUuid) as ConcurrencyState<TDraft>);
    const unsubscribe = concurrencyManager.subscribe(serviceItemUuid, (newState) => {
      setState(newState as ConcurrencyState<TDraft>);
    });
    return unsubscribe;
  }, [serviceItemUuid]);

  const mutateWithConcurrency = useCallback(
    async <T>(
      mutationFn: (etag: string) => Promise<WithVersion<T>>,
      overrideEtag?: string,
      draftData?: TDraft
    ): Promise<WithVersion<T>> => {
      if (!serviceItemUuid) {
        throw new Error('serviceItemUuid is required for concurrency mutation');
      }
      return concurrencyManager.executeMutation(serviceItemUuid, mutationFn, overrideEtag, draftData);
    },
    [serviceItemUuid]
  );

  const reconcile = useCallback(
    async <T>(fetcher: () => Promise<WithVersion<T>>): Promise<WithVersion<T>> => {
      if (!serviceItemUuid) {
        throw new Error('serviceItemUuid is required to reconcile concurrency state');
      }
      return concurrencyManager.reconcile(serviceItemUuid, fetcher);
    },
    [serviceItemUuid]
  );

  const resetConflict = useCallback(() => {
    if (serviceItemUuid) {
      concurrencyManager.resetConflict(serviceItemUuid);
    }
  }, [serviceItemUuid]);

  const setEtag = useCallback(
    (etag: string) => {
      if (serviceItemUuid) {
        concurrencyManager.setEtag(serviceItemUuid, etag);
      }
    },
    [serviceItemUuid]
  );

  const saveDraft = useCallback(
    (draft: TDraft) => {
      if (serviceItemUuid) {
        concurrencyManager.saveDraft(serviceItemUuid, draft);
      }
    },
    [serviceItemUuid]
  );

  const clearDraft = useCallback(() => {
    if (serviceItemUuid) {
      concurrencyManager.clearDraft(serviceItemUuid);
    }
  }, [serviceItemUuid]);

  return {
    currentEtag: state.currentEtag,
    hasConflict: state.hasConflict,
    conflictDetails: state.conflictDetails,
    unsavedDraft: state.unsavedDraft,
    mutateWithConcurrency,
    reconcile,
    resetConflict,
    setEtag,
    saveDraft,
    clearDraft,
  };
}
