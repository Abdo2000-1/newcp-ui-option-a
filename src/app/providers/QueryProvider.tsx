import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface CacheContextType {
  cache: Map<string, unknown>;
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
  invalidate: (keyPrefix: string) => void;
}

const CacheContext = createContext<CacheContextType | null>(null);

export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache] = useState<Map<string, unknown>>(() => new Map());

  const get = <T,>(key: string): T | undefined => {
    return cache.get(key) as T | undefined;
  };

  const set = <T,>(key: string, value: T): void => {
    cache.set(key, value);
  };

  const invalidate = (keyPrefix: string): void => {
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
      }
    }
  };

  return (
    <CacheContext.Provider value={{ cache, get, set, invalidate }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useQueryCache = (): CacheContextType => {
  const ctx = useContext(CacheContext);
  if (!ctx) {
    throw new Error('useQueryCache must be used within a QueryProvider');
  }
  return ctx;
};
