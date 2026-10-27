import { describe, it, expect, vi } from 'vitest';
import {
  emitSafeTestEvent,
  triggerSafeTestError,
  type VerificationResult,
  createMockPostHogClient,
  createMockSentryClient,
  PostHogAdapter,
  SentryAdapter,
  NoopPostHogAdapter,
  NoopSentryAdapter,
} from '../index';

describe('Observability Verification (Safe Test-Event and Test-Error)', () => {
  describe('emitSafeTestEvent', () => {
    it('returns no_op_disabled when PostHog adapter is disabled', () => {
      const disabledAdapter = new NoopPostHogAdapter();
      const result: VerificationResult = emitSafeTestEvent(disabledAdapter);

      expect(result.provider).toBe('posthog');
      expect(result.action).toBe('test_event');
      expect(result.status).toBe('no_op_disabled');
      expect(result.providerEnabled).toBe(false);
      expect(result.networkEvidenceClaimed).toBe(false);
      expect(result.summary).toContain('PostHog is disabled');
    });

    it('emits approved safe test event without sensitive data when enabled', () => {
      const mockPostHog = createMockPostHogClient();
      const enabledAdapter = new PostHogAdapter(
        {
          enabled: true,
          key: 'phc_test_dummy_key_not_real',
          host: 'https://us.i.posthog.com',
          captureInDev: true,
          trackEmail: false,
        },
        'development',
        mockPostHog
      );

      const result: VerificationResult = emitSafeTestEvent(enabledAdapter);

      expect(result.provider).toBe('posthog');
      expect(result.action).toBe('test_event');
      expect(result.status).toBe('emitted');
      expect(result.providerEnabled).toBe(true);
      expect(result.networkEvidenceClaimed).toBe(false);
      expect(result.payload?.report_key).toBe('observability_verification');

      // Check event captured in mock
      expect(mockPostHog.events).toHaveLength(1);
      expect(mockPostHog.events[0].event).toBe('report_opened');
      expect(mockPostHog.events[0].properties?.report_key).toBe('observability_verification');
      // Verify no sensitive properties or PHI
      expect(mockPostHog.events[0].properties?.patient_name).toBeUndefined();
      expect(mockPostHog.events[0].properties?.password).toBeUndefined();
      expect(mockPostHog.events[0].properties?.token).toBeUndefined();
    });

    it('isolates errors if capture throws without bubbling up', () => {
      const failingAdapter = {
        capture: vi.fn().mockImplementation(() => {
          throw new Error('PostHog network unreachable');
        }),
        capturePageView: vi.fn(),
        identify: vi.fn(),
        reset: vi.fn(),
        isFeatureEnabled: vi.fn().mockReturnValue(false),
        isEnabled: () => true,
        isInitialized: () => true,
      };

      const result = emitSafeTestEvent(failingAdapter);
      expect(result.status).toBe('error_isolated');
      expect(result.networkEvidenceClaimed).toBe(false);
      expect(result.summary).toContain('error isolated: PostHog network unreachable');
    });
  });

  describe('triggerSafeTestError', () => {
    it('returns no_op_disabled when Sentry adapter is disabled', () => {
      const disabledAdapter = new NoopSentryAdapter();
      const result: VerificationResult = triggerSafeTestError(undefined, disabledAdapter);

      expect(result.provider).toBe('sentry');
      expect(result.action).toBe('test_error');
      expect(result.status).toBe('no_op_disabled');
      expect(result.providerEnabled).toBe(false);
      expect(result.networkEvidenceClaimed).toBe(false);
      expect(result.summary).toContain('Sentry is disabled');
    });

    it('emits safe test error with scrubbed tags and non-fatal status when enabled', () => {
      const mockSentry = createMockSentryClient();
      const enabledAdapter = new SentryAdapter(
        {
          enabled: true,
          dsn: 'https://placeholder@sentry.io/12345',
          environment: 'development',
          tracesSampleRate: 0,
          trackEmail: false,
        },
        'development',
        mockSentry
      );

      const result: VerificationResult = triggerSafeTestError(
        { tags: { context: 'local-test' } },
        enabledAdapter
      );

      expect(result.provider).toBe('sentry');
      expect(result.action).toBe('test_error');
      expect(result.status).toBe('emitted');
      expect(result.providerEnabled).toBe(true);
      expect(result.networkEvidenceClaimed).toBe(false);
      expect(result.eventId).toBeDefined();

      // Check captured exception
      expect(mockSentry.exceptions).toHaveLength(1);
      const captured = mockSentry.exceptions[0];
      expect((captured.error as Error).message).toContain('[Observability Verification]');
      expect((captured.context as any)?.tags?.verification).toBe('true');
      expect((captured.context as any)?.tags?.module).toBe('SystemVerification');
    });

    it('isolates errors if captureException throws without crashing', () => {
      const failingAdapter = {
        captureException: vi.fn().mockImplementation(() => {
          throw new Error('Sentry SDK internal transport error');
        }),
        captureMessage: vi.fn(),
        addBreadcrumb: vi.fn(),
        setUser: vi.fn(),
        isExpectedDomainError: vi.fn().mockReturnValue(false),
        isEnabled: () => true,
        isInitialized: () => true,
      };

      const result = triggerSafeTestError(undefined, failingAdapter);
      expect(result.status).toBe('error_isolated');
      expect(result.networkEvidenceClaimed).toBe(false);
      expect(result.summary).toContain('error isolated: Sentry SDK internal transport error');
    });
  });
});
