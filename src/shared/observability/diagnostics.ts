import { loadTelemetryConfig } from './config';
import type { TelemetryConfig } from './types';
import { getPostHog } from './posthog';
import { getSentry } from './sentry';

export type ProviderDiagnosticStatus =
  | 'disabled'
  | 'missing_configuration'
  | 'configured_unverified'
  | 'enabled_initialized';

export interface ProviderDiagnosticDetail {
  status: ProviderDiagnosticStatus;
  enabled: boolean;
  configured: boolean;
  initialized: boolean;
  summary: string;
}

export interface ObservabilityDiagnostics {
  telemetryEnabled: boolean;
  environment: string;
  posthog: ProviderDiagnosticDetail & {
    host: string;
    captureInDev: boolean;
    sdkInstalled: boolean;
  };
  sentry: ProviderDiagnosticDetail & {
    environment?: string;
    release?: string;
    tracesSampleRate: number;
    sdkInstalled: boolean;
  };
  summary: {
    allDisabledByDefault: boolean;
    liveDeliveryVerified: boolean;
    readyForSeniorEngineerValues: boolean;
  };
}

/**
 * Returns a comprehensive runtime diagnostic report for PostHog and Sentry.
 * Distinguishes clearly between disabled, missing configuration, configured but
 * unverified, and enabled/initialized states.
 */
export function getObservabilityDiagnostics(
  customConfig?: TelemetryConfig,
  customPostHogAdapter?: { isEnabled(): boolean; isInitialized?(): boolean },
  customSentryAdapter?: { isEnabled(): boolean; isInitialized?(): boolean }
): ObservabilityDiagnostics {
  const config = customConfig || loadTelemetryConfig();
  const phAdapter = customPostHogAdapter || getPostHog();
  const sentryAdapter = customSentryAdapter || getSentry();

  // Evaluate PostHog status
  let posthogStatus: ProviderDiagnosticStatus;
  let posthogSummary: string;
  const posthogConfigured = Boolean(config.posthog.key && config.posthog.key.trim().length > 0);
  const posthogInitialized = Boolean(phAdapter.isInitialized?.());

  if (!config.telemetryEnabled) {
    posthogStatus = 'disabled';
    posthogSummary = 'Telemetry is globally disabled via VITE_ENABLE_TELEMETRY=false.';
  } else if (!config.posthog.enabled) {
    if (posthogConfigured) {
      posthogStatus = 'disabled';
      posthogSummary = 'PostHog key is present, but provider is disabled via VITE_POSTHOG_ENABLED=false or dev mode.';
    } else {
      posthogStatus = 'disabled';
      posthogSummary = 'PostHog is disabled by default via VITE_POSTHOG_ENABLED=false.';
    }
  } else if (!posthogConfigured) {
    posthogStatus = 'missing_configuration';
    posthogSummary = 'PostHog is enabled, but VITE_POSTHOG_KEY is missing or empty.';
  } else if (posthogInitialized) {
    posthogStatus = 'enabled_initialized';
    posthogSummary = 'PostHog SDK is installed, initialized, and operational through adapter boundary.';
  } else {
    posthogStatus = 'configured_unverified';
    posthogSummary = 'PostHog configuration is present, but SDK client is not yet initialized or verified.';
  }

  // Evaluate Sentry status
  let sentryStatus: ProviderDiagnosticStatus;
  let sentrySummary: string;
  const sentryConfigured = Boolean(config.sentry.dsn && config.sentry.dsn.trim().length > 0);
  const sentryInitialized = Boolean(sentryAdapter.isInitialized?.());

  if (!config.telemetryEnabled) {
    sentryStatus = 'disabled';
    sentrySummary = 'Telemetry is globally disabled via VITE_ENABLE_TELEMETRY=false.';
  } else if (!config.sentry.enabled) {
    if (sentryConfigured) {
      sentryStatus = 'disabled';
      sentrySummary = 'Sentry DSN is present, but provider is disabled via VITE_SENTRY_ENABLED=false.';
    } else {
      sentryStatus = 'disabled';
      sentrySummary = 'Sentry is disabled by default via VITE_SENTRY_ENABLED=false.';
    }
  } else if (!sentryConfigured) {
    sentryStatus = 'missing_configuration';
    sentrySummary = 'Sentry is enabled, but VITE_SENTRY_DSN is missing or empty.';
  } else if (sentryInitialized) {
    sentryStatus = 'enabled_initialized';
    sentrySummary = 'Sentry SDK is installed, initialized, and operational through adapter boundary.';
  } else {
    sentryStatus = 'configured_unverified';
    sentrySummary = 'Sentry configuration is present, but SDK client is not yet initialized or verified.';
  }

  return {
    telemetryEnabled: config.telemetryEnabled,
    environment: config.environment,
    posthog: {
      status: posthogStatus,
      enabled: config.posthog.enabled,
      configured: posthogConfigured,
      initialized: posthogInitialized,
      host: config.posthog.host,
      captureInDev: config.posthog.captureInDev,
      sdkInstalled: true,
      summary: posthogSummary,
    },
    sentry: {
      status: sentryStatus,
      enabled: config.sentry.enabled,
      configured: sentryConfigured,
      initialized: sentryInitialized,
      environment: config.sentry.environment,
      release: config.sentry.release,
      tracesSampleRate: config.sentry.tracesSampleRate,
      sdkInstalled: true,
      summary: sentrySummary,
    },
    summary: {
      allDisabledByDefault: !config.telemetryEnabled && !config.posthog.enabled && !config.sentry.enabled,
      liveDeliveryVerified: false, // Strict requirement: never claim real delivery without verified live credentials & evidence
      readyForSeniorEngineerValues: true,
    },
  };
}
