import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initObservability,
  resetObservability,
  getObservabilityDiagnostics,
  createMockPostHogClient,
  createMockSentryClient,
  PostHogAdapter,
  SentryAdapter,
  NoopPostHogAdapter,
  NoopSentryAdapter,
  loadTelemetryConfig,
} from '../index';
import { ApiClientError, AuthenticationError } from '@/shared/api/errors';

describe('Observability Provider Runtime Integration & Diagnostics', () => {
  beforeEach(() => {
    resetObservability();
  });

  describe('1. Default Disabled State & Safety Boundary', () => {
    it('initializes with both providers disabled by default', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'false',
        VITE_POSTHOG_ENABLED: 'false',
        VITE_SENTRY_ENABLED: 'false',
      });

      const { posthog, sentry } = initObservability(config);

      expect(posthog).toBeInstanceOf(NoopPostHogAdapter);
      expect(sentry).toBeInstanceOf(NoopSentryAdapter);
      expect(posthog.isEnabled()).toBe(false);
      expect(sentry.isEnabled()).toBe(false);
      expect(posthog.isInitialized()).toBe(false);
      expect(sentry.isInitialized()).toBe(false);
    });

    it('guarantees no-op adapters never throw when methods are invoked', () => {
      const { posthog, sentry } = initObservability({
        telemetryEnabled: false,
        posthog: { enabled: false, host: '', captureInDev: false, trackEmail: false },
        sentry: { enabled: false, tracesSampleRate: 0, trackEmail: false },
        environment: 'development',
      });

      expect(() => {
        posthog.capture('page_view', { route_name: 'Test', route_path: '/test', module: 'Orders' });
        posthog.capturePageView('/test');
        posthog.identify('user-123');
        posthog.reset();
        sentry.captureException(new Error('Test failure'));
        sentry.captureMessage('Diagnostic notice', 'info');
        sentry.addBreadcrumb({ category: 'test', message: 'test breadcrumb' });
        sentry.setUser(null);
      }).not.toThrow();
    });
  });

  describe('2. Provider Initialization & SDK Options', () => {
    it('initializes PostHog with strict privacy: autocapture=false, pageview=false, session recording disabled', () => {
      const mockPostHog = createMockPostHogClient();
      const adapter = new PostHogAdapter(
        {
          enabled: true,
          key: 'ph_project_test_key_123',
          host: 'https://us.i.posthog.com',
          captureInDev: true,
          trackEmail: false,
        },
        'staging',
        mockPostHog
      );

      expect(adapter.isEnabled()).toBe(true);
      expect(adapter.isInitialized()).toBe(true);
      expect(mockPostHog.initCalledWithOptions).toEqual({
        api_host: 'https://us.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
      });
    });

    it('initializes Sentry with strict privacy: sendDefaultPii=false, tracesSampleRate=0', () => {
      const mockSentry = createMockSentryClient();
      const adapter = new SentryAdapter(
        {
          enabled: true,
          dsn: 'https://test@o123.ingest.sentry.io/456',
          environment: 'staging',
          release: 'v4.2.0-test',
          tracesSampleRate: 0,
          trackEmail: false,
        },
        'staging',
        mockSentry
      );

      expect(adapter.isEnabled()).toBe(true);
      expect(adapter.isInitialized()).toBe(true);
      expect(mockSentry.initializedWithOptions).toEqual({
        dsn: 'https://test@o123.ingest.sentry.io/456',
        environment: 'staging',
        release: 'v4.2.0-test',
        tracesSampleRate: 0,
        sendDefaultPii: false,
      });
    });
  });

  describe('3. Local Verification Test Clients', () => {
    it('accurately captures sanitized events in MockPostHogClient', () => {
      const mockClient = createMockPostHogClient({ 'beta-dashboard': true });
      const adapter = new PostHogAdapter(
        {
          enabled: true,
          key: 'test-key',
          host: 'https://us.i.posthog.com',
          captureInDev: true,
          trackEmail: false,
        },
        'development',
        mockClient
      );

      adapter.capture('report_opened', {
        report_key: 'quarter_targets',
        route: '/quarter-targets',
        module: 'Reporting',
      });

      expect(mockClient.events).toHaveLength(1);
      expect(mockClient.events[0].event).toBe('report_opened');
      expect(mockClient.events[0].properties?.report_key).toBe('quarter_targets');

      // Feature flags
      expect(adapter.isFeatureEnabled('beta-dashboard')).toBe(true);
      expect(adapter.isFeatureEnabled('non-existent')).toBe(false);

      // Identity & Reset
      adapter.identify('usr-cs-999');
      expect(mockClient.users).toHaveLength(1);
      expect(mockClient.users[0].distinctId).toBe('usr-cs-999');

      adapter.reset();
      expect(mockClient.resetsCount).toBe(1);
    });

    it('accurately records exceptions and breadcrumbs in MockSentryClient', () => {
      const mockClient = createMockSentryClient();
      const adapter = new SentryAdapter(
        {
          enabled: true,
          dsn: 'https://test@o123.ingest.sentry.io/456',
          environment: 'test',
          tracesSampleRate: 0,
          trackEmail: false,
        },
        'test',
        mockClient
      );

      // Unhandled crash captured
      const err = new Error('Database connection failed');
      adapter.captureException(err, { tags: { module: 'Database' } });

      expect(mockClient.exceptions).toHaveLength(1);
      expect(mockClient.exceptions[0].error).toBe(err);

      // Expected domain outcome filtered to breadcrumb
      const expectedErr = new ApiClientError(404, 'Order not found');
      adapter.captureException(expectedErr);

      expect(mockClient.exceptions).toHaveLength(1); // Not incremented
      expect(mockClient.breadcrumbs).toHaveLength(1);
      expect(mockClient.breadcrumbs[0].category).toBe('api.domain_outcome');
    });
  });

  describe('4. Provider Failure Isolation', () => {
    it('isolates PostHog initialization crashes without bubbling up or crashing Sentry', () => {
      const throwingClient = {
        init: () => {
          throw new Error('PostHog SDK crash simulation');
        },
        capture: vi.fn(),
        identify: vi.fn(),
        reset: vi.fn(),
      };

      const adapter = new PostHogAdapter(
        {
          enabled: true,
          key: 'crash-key',
          host: 'https://us.i.posthog.com',
          captureInDev: true,
          trackEmail: false,
        },
        'development',
        throwingClient
      );

      expect(adapter.isInitialized()).toBe(false);
      // Adapter remains operational and does not crash when called
      expect(() => adapter.capture('user_logged_out', {})).not.toThrow();
    });

    it('isolates Sentry initialization crashes without bubbling up', () => {
      const throwingClient = {
        init: () => {
          throw new Error('Sentry SDK crash simulation');
        },
        captureException: vi.fn(),
        captureMessage: vi.fn(),
        addBreadcrumb: vi.fn(),
        setUser: vi.fn(),
      };

      const adapter = new SentryAdapter(
        {
          enabled: true,
          dsn: 'https://test@sentry.io/1',
          tracesSampleRate: 0,
          trackEmail: false,
        },
        'development',
        throwingClient
      );

      expect(adapter.isInitialized()).toBe(false);
      expect(() => adapter.captureException(new Error('fail'))).not.toThrow();
    });
  });

  describe('5. Runtime Diagnostics Matrix (Requirement 21)', () => {
    it('reports disabled state when telemetry is globally disabled', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'false',
        VITE_POSTHOG_ENABLED: 'false',
        VITE_SENTRY_ENABLED: 'false',
      });

      const diagnostics = getObservabilityDiagnostics(
        config,
        new NoopPostHogAdapter(),
        new NoopSentryAdapter()
      );

      expect(diagnostics.posthog.status).toBe('disabled');
      expect(diagnostics.sentry.status).toBe('disabled');
      expect(diagnostics.summary.allDisabledByDefault).toBe(true);
      expect(diagnostics.summary.liveDeliveryVerified).toBe(false);
    });

    it('reports missing_configuration state when provider is enabled but key/dsn is empty', () => {
      const config: any = {
        telemetryEnabled: true,
        posthog: { enabled: false, key: '', host: 'https://us.i.posthog.com', captureInDev: false, trackEmail: false },
        sentry: { enabled: false, dsn: '', tracesSampleRate: 0, trackEmail: false },
        environment: 'staging',
      };

      // Simulate senior engineer turning on flags before keys are filled
      const customConfig = {
        ...config,
        telemetryEnabled: true,
        posthog: { ...config.posthog, enabled: true, key: '' },
        sentry: { ...config.sentry, enabled: true, dsn: '' },
      };

      const diagnostics = getObservabilityDiagnostics(
        customConfig,
        new NoopPostHogAdapter(),
        new NoopSentryAdapter()
      );

      expect(diagnostics.posthog.status).toBe('missing_configuration');
      expect(diagnostics.sentry.status).toBe('missing_configuration');
    });

    it('reports configured_unverified state when key is provided but adapter is not yet initialized', () => {
      const config: any = {
        telemetryEnabled: true,
        posthog: { enabled: true, key: 'mock-key', host: 'https://us.i.posthog.com', captureInDev: true, trackEmail: false },
        sentry: { enabled: true, dsn: 'https://mock@sentry.io/1', tracesSampleRate: 0, trackEmail: false },
        environment: 'staging',
      };

      const uninitializedPostHog = { isEnabled: () => true, isInitialized: () => false };
      const uninitializedSentry = { isEnabled: () => true, isInitialized: () => false };

      const diagnostics = getObservabilityDiagnostics(config, uninitializedPostHog, uninitializedSentry);

      expect(diagnostics.posthog.status).toBe('configured_unverified');
      expect(diagnostics.sentry.status).toBe('configured_unverified');
    });

    it('reports enabled_initialized state when adapter is initialized with active client', () => {
      const mockPostHog = createMockPostHogClient();
      const mockSentry = createMockSentryClient();

      const phAdapter = new PostHogAdapter(
        { enabled: true, key: 'valid-key', host: 'https://us.i.posthog.com', captureInDev: true, trackEmail: false },
        'staging',
        mockPostHog
      );
      const sentryAdapter = new SentryAdapter(
        { enabled: true, dsn: 'https://k@sentry.io/1', tracesSampleRate: 0, trackEmail: false },
        'staging',
        mockSentry
      );

      const config: any = {
        telemetryEnabled: true,
        posthog: { enabled: true, key: 'valid-key', host: 'https://us.i.posthog.com', captureInDev: true, trackEmail: false },
        sentry: { enabled: true, dsn: 'https://k@sentry.io/1', tracesSampleRate: 0, trackEmail: false },
        environment: 'staging',
      };

      const diagnostics = getObservabilityDiagnostics(config, phAdapter, sentryAdapter);

      expect(diagnostics.posthog.status).toBe('enabled_initialized');
      expect(diagnostics.sentry.status).toBe('enabled_initialized');
      expect(diagnostics.summary.readyForSeniorEngineerValues).toBe(true);
      // Even when initialized locally, live delivery must strictly remain false without live network verification
      expect(diagnostics.summary.liveDeliveryVerified).toBe(false);
    });
  });
});
