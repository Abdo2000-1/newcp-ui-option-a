import { loadTelemetryConfig } from './config';
import { initPostHog, resetPostHog, type IPostHogAdapter } from './posthog';
import { initSentry, resetSentry, type ISentryAdapter } from './sentry';
import type { TelemetryConfig } from './types';

export * from './types';
export * from './config';
export * from './posthog';
export * from './sentry';
export * from './diagnostics';
export * from './testUtils';
export * from './verification';

export interface ObservabilityInstance {
  posthog: IPostHogAdapter;
  sentry: ISentryAdapter;
}

/**
 * Centrally initializes the observability runtime foundation.
 * Both providers are disabled by default. If either provider fails to initialize,
 * error isolation guarantees the application startup is never interrupted.
 */
export function initObservability(customConfig?: TelemetryConfig): ObservabilityInstance {
  const config = customConfig || loadTelemetryConfig();
  let posthog: IPostHogAdapter;
  let sentry: ISentryAdapter;

  try {
    posthog = initPostHog(config);
  } catch (err) {
    console.warn('[Observability] PostHog initialization error isolated:', err);
    posthog = initPostHog({
      ...config,
      telemetryEnabled: false,
      posthog: { ...config.posthog, enabled: false },
    });
  }

  try {
    sentry = initSentry(config);
  } catch (err) {
    console.warn('[Observability] Sentry initialization error isolated:', err);
    sentry = initSentry({
      ...config,
      telemetryEnabled: false,
      sentry: { ...config.sentry, enabled: false },
    });
  }

  return { posthog, sentry };
}

/**
 * Convenience helper to reset both provider adapters simultaneously.
 */
export function resetObservability(): void {
  resetPostHog();
  resetSentry();
}
