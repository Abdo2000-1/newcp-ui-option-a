import { loadTelemetryConfig } from '../config';
import { SentryAdapter, NoopSentryAdapter, type ISentryAdapter, type ISentryClient } from './sentryAdapter';
import type { TelemetryConfig } from '../types';

export * from './sentryAdapter';
export * from './sentryScrubber';

let activeSentryAdapter: ISentryAdapter | null = null;

/**
 * Initializes the Sentry adapter singleton using loaded telemetry configuration.
 */
export function initSentry(
  customConfig?: TelemetryConfig,
  customClient?: ISentryClient
): ISentryAdapter {
  const config = customConfig || loadTelemetryConfig();

  if (!config.telemetryEnabled || !config.sentry.enabled) {
    activeSentryAdapter = new NoopSentryAdapter();
    return activeSentryAdapter;
  }

  activeSentryAdapter = new SentryAdapter(config.sentry, config.environment, customClient);
  return activeSentryAdapter;
}

/**
 * Gets the active Sentry adapter or falls back to a safe No-Op instance.
 */
export function getSentry(): ISentryAdapter {
  if (!activeSentryAdapter) {
    activeSentryAdapter = initSentry();
  }
  return activeSentryAdapter;
}

/**
 * Convenience helper to reset the Sentry adapter instance (useful in tests and logout).
 */
export function resetSentry(): void {
  if (activeSentryAdapter) {
    activeSentryAdapter.setUser(null);
  }
  activeSentryAdapter = null;
}
