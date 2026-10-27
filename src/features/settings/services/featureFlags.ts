import { useState, useEffect } from 'react';
import { getPostHog } from '@/shared/observability';

export const CMS_FLAG_KEYS = {
  BATCH_QUEUE: 'flag_batch_queue',
  MESH_INSPECTION: 'flag_mesh_inspection',
  SLA_ALERTS: 'flag_sla_alerts',
  INSTANT_EXPORT: 'flag_instant_export',
} as const;

export interface CmsFeatureFlags {
  batchQueue: boolean;
  meshInspection: boolean;
  slaAlerts: boolean;
  instantExport: boolean;
}

export const DEFAULT_CMS_FLAGS: CmsFeatureFlags = {
  batchQueue: true,
  meshInspection: false,
  slaAlerts: true,
  instantExport: false,
};

export const CMS_STORAGE_KEY = 'newcp_local_cms_flags';

export function getLocalCmsFlags(): CmsFeatureFlags {
  if (typeof window === 'undefined') return DEFAULT_CMS_FLAGS;
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    return raw ? { ...DEFAULT_CMS_FLAGS, ...JSON.parse(raw) } : DEFAULT_CMS_FLAGS;
  } catch {
    return DEFAULT_CMS_FLAGS;
  }
}

export function setLocalCmsFlags(flags: CmsFeatureFlags): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // Safe ignore storage write failures
  }
}

/**
 * Resolves a feature flag by querying the PostHog provider boundary
 * with deterministic fallback to the local CMS configuration.
 */
export function resolveCmsFeatureFlag(
  flagKey: string,
  localDefault: boolean
): boolean {
  try {
    const posthog = getPostHog();
    return posthog.isFeatureEnabled(flagKey, localDefault);
  } catch {
    return localDefault;
  }
}

/**
 * React hook to read a feature flag with deterministic local fallback.
 */
export function useCmsFeatureFlag(
  flagKey: string,
  localDefault: boolean
): boolean {
  const [enabled, setEnabled] = useState<boolean>(() =>
    resolveCmsFeatureFlag(flagKey, localDefault)
  );

  useEffect(() => {
    setEnabled(resolveCmsFeatureFlag(flagKey, localDefault));
  }, [flagKey, localDefault]);

  return enabled;
}
