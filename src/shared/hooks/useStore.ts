import { useState, useEffect, useRef } from 'react';
import { store } from '@/shared/services/store';

export function useStore<T>(selector: (s: typeof store) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const [data, setData] = useState<T>(() => selectorRef.current(store));

  useEffect(() => {
    setData(selectorRef.current(store));
    const unsubscribe = store.subscribe(() => {
      setData(selectorRef.current(store));
    });
    return unsubscribe;
  }, []);

  return data;
}
