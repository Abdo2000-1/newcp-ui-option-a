import { getPostHog, type IPostHogAdapter } from './posthog';
import { getSentry, type ISentryAdapter, type SentryContext } from './sentry';

export interface VerificationResult {
  provider: 'posthog' | 'sentry';
  action: 'test_event' | 'test_error';
  status: 'emitted' | 'no_op_disabled' | 'error_isolated';
  providerEnabled: boolean;
  providerInitialized: boolean;
  payload?: Record<string, unknown>;
  eventId?: string;
  networkEvidenceClaimed: false;
  summary: string;
}

/**
 * Emits a safe diagnostic test event to PostHog without transmitting PHI or sensitive data.
 * Adheres strictly to the requirement: never claim delivery without network evidence.
 */
export function emitSafeTestEvent(
  customAdapter?: IPostHogAdapter
): VerificationResult {
  const adapter = customAdapter || getPostHog();
  const providerEnabled = adapter.isEnabled();
  const providerInitialized = Boolean(adapter.isInitialized?.());

  if (!providerEnabled) {
    return {
      provider: 'posthog',
      action: 'test_event',
      status: 'no_op_disabled',
      providerEnabled: false,
      providerInitialized: false,
      networkEvidenceClaimed: false,
      summary: 'PostHog is disabled. Safe test event was handled by No-op adapter without egress.',
    };
  }

  const payload = {
    report_key: 'observability_verification',
    route: '/settings/observability',
    module: 'SystemVerification',
  };

  try {
    adapter.capture('report_opened', payload);
    return {
      provider: 'posthog',
      action: 'test_event',
      status: 'emitted',
      providerEnabled: true,
      providerInitialized,
      payload,
      networkEvidenceClaimed: false,
      summary: 'Safe test event emitted through PostHog adapter. Live delivery NOT verified without network egress evidence.',
    };
  } catch (err) {
    return {
      provider: 'posthog',
      action: 'test_event',
      status: 'error_isolated',
      providerEnabled: true,
      providerInitialized,
      networkEvidenceClaimed: false,
      summary: `Safe test event error isolated: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Triggers a safe diagnostic test error through Sentry without crashing the application.
 * Adheres strictly to the requirement: never claim delivery without network evidence.
 */
export function triggerSafeTestError(
  context?: SentryContext,
  customAdapter?: ISentryAdapter
): VerificationResult {
  const adapter = customAdapter || getSentry();
  const providerEnabled = adapter.isEnabled();
  const providerInitialized = Boolean(adapter.isInitialized?.());

  if (!providerEnabled) {
    return {
      provider: 'sentry',
      action: 'test_error',
      status: 'no_op_disabled',
      providerEnabled: false,
      providerInitialized: false,
      networkEvidenceClaimed: false,
      summary: 'Sentry is disabled. Safe test error was handled by No-op adapter without egress.',
    };
  }

  try {
    const testError = new Error('[Observability Verification] Safe diagnostic test error - non-fatal');
    testError.name = 'ObservabilityDiagnosticTestError';

    const eventId = adapter.captureException(testError, {
      tags: {
        verification: 'true',
        module: 'SystemVerification',
        ...(context?.tags || {}),
      },
      extra: {
        timestamp: new Date().toISOString(),
        ...(context?.extra || {}),
      },
      level: 'error',
    });

    return {
      provider: 'sentry',
      action: 'test_error',
      status: 'emitted',
      providerEnabled: true,
      providerInitialized,
      eventId,
      networkEvidenceClaimed: false,
      summary: 'Safe test error emitted through Sentry adapter. Live delivery NOT verified without network egress evidence.',
    };
  } catch (err) {
    return {
      provider: 'sentry',
      action: 'test_error',
      status: 'error_isolated',
      providerEnabled: true,
      providerInitialized,
      networkEvidenceClaimed: false,
      summary: `Safe test error error isolated: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
