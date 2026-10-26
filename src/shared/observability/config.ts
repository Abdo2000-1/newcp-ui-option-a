import type { TelemetryConfig, TelemetryEnvironment } from './types';

/**
 * Loads telemetry configuration safely from Vite environment variables.
 * ALL PROVIDERS ARE DISABLED BY DEFAULT.
 */
export function loadTelemetryConfig(customEnv?: Record<string, string | undefined>): TelemetryConfig {
  const env = customEnv || (typeof import.meta !== 'undefined' ? (import.meta.env as Record<string, string | undefined>) : {});

  const isDev = env.DEV === 'true' || env.MODE === 'development' || env.VITE_APP_ENV === 'development';
  const isTest = env.MODE === 'test' || env.NODE_ENV === 'test';

  let environment: TelemetryEnvironment = 'production';
  if (isTest) environment = 'test';
  else if (isDev) environment = 'development';
  else if (env.VITE_APP_ENV === 'staging') environment = 'staging';

  const telemetryEnabled = env.VITE_ENABLE_TELEMETRY === 'true';

  const posthogKey = (env.VITE_POSTHOG_KEY || '').trim();
  const posthogHost = (env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').trim();
  const posthogCaptureInDev = env.VITE_POSTHOG_CAPTURE_IN_DEV === 'true';
  const posthogTrackEmail = env.VITE_POSTHOG_TRACK_EMAIL === 'true';

  // PostHog is enabled only if global telemetry is true, posthog flag is true, and key is non-empty
  const posthogEnabled =
    telemetryEnabled &&
    env.VITE_POSTHOG_ENABLED === 'true' &&
    posthogKey.length > 0 &&
    (!isDev || posthogCaptureInDev);

  const sentryDsn = (env.VITE_SENTRY_DSN || '').trim();
  const sentryTrackEmail = env.VITE_SENTRY_TRACK_EMAIL === 'true';
  const sentrySampleRate = parseFloat(env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0');

  const sentryEnabled =
    telemetryEnabled &&
    env.VITE_SENTRY_ENABLED === 'true' &&
    sentryDsn.length > 0;

  return {
    telemetryEnabled,
    posthog: {
      enabled: posthogEnabled,
      key: posthogKey || undefined,
      host: posthogHost,
      captureInDev: posthogCaptureInDev,
      trackEmail: posthogTrackEmail,
    },
    sentry: {
      enabled: sentryEnabled,
      dsn: sentryDsn || undefined,
      environment: env.VITE_SENTRY_ENVIRONMENT || environment,
      release: env.VITE_SENTRY_RELEASE || undefined,
      tracesSampleRate: isNaN(sentrySampleRate) ? 0 : sentrySampleRate,
      trackEmail: sentryTrackEmail,
    },
    environment,
  };
}
