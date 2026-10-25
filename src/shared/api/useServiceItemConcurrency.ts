import { useState, useEffect, useCallback } from 'react';
import { concurrencyManager, type ConcurrencyState } from './concurrencyManager';
import type { WithVersion } from './types';

export function useServiceItemConcurrency(serviceItemUuid?: string) {
  const [state, setState] = useState<ConcurrencyState>(() =>
    serviceItemUuid ? concurrencyManager.getState(serviceItemUuid) : { hasConflict: false }
  );

  useEffect(() => {
    if (!serviceItemUuid) return;
    setState(concurrencyManager.getState(serviceItemUuid));
    const unsubscribe = concurrencyManager.subscribe(serviceItemUuid, (newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [serviceItemUuid]);

  const mutateWithConcurrency = useCallback(
    async <T>(
      mutationFn: (etag: string) => Promise<WithVersion<T>>,
      overrideEtag?: string
    ): Promise<WithVersion<T>> => {
      if (!serviceItemUuid) {
        throw new Error('serviceItemUuid is required for concurrency mutation');
      }
      return concurrencyManager.executeMutation(serviceItemUuid, mutationFn, overrideEtag);
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

  return {
    currentEtag: state.currentEtag,
    hasConflict: state.hasConflict,
    conflictDetails: state.conflictDetails,
    mutateWithConcurrency,
    reconcile,
    resetConflict,
    setEtag,
  };
}
