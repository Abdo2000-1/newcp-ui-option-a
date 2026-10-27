import { loadTelemetryConfig } from '../config';
import { PostHogAdapter, NoopPostHogAdapter, type IPostHogAdapter } from './posthogAdapter';
import type { IPostHogClient, TelemetryConfig } from '../types';

export * from './posthogAdapter';
export * from './sanitizer';

let activePostHogAdapter: IPostHogAdapter | null = null;

/**
 * Initializes the PostHog adapter singleton using loaded telemetry configuration.
 */
export function initPostHog(
  customConfig?: TelemetryConfig,
  customClient?: IPostHogClient
): IPostHogAdapter {
  const config = customConfig || loadTelemetryConfig();

  if (!config.telemetryEnabled || !config.posthog.enabled) {
    activePostHogAdapter = new NoopPostHogAdapter();
    return activePostHogAdapter;
  }

  try {
    activePostHogAdapter = new PostHogAdapter(config.posthog, config.environment, customClient);
  } catch (err) {
    console.warn('[PostHog] Adapter creation error isolated:', err);
    activePostHogAdapter = new NoopPostHogAdapter();
  }
  return activePostHogAdapter;
}

/**
 * Gets the active PostHog adapter or falls back to a safe No-Op instance.
 */
export function getPostHog(): IPostHogAdapter {
  if (!activePostHogAdapter) {
    activePostHogAdapter = initPostHog();
  }
  return activePostHogAdapter;
}

/**
 * Convenience helper to reset the PostHog adapter instance (useful in tests and logout).
 */
export function resetPostHog(): void {
  if (activePostHogAdapter) {
    activePostHogAdapter.reset();
  }
  activePostHogAdapter = null;
}
