import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PostHogAdapter,
  NoopPostHogAdapter,
} from '../posthog/posthogAdapter';
import { initPostHog, getPostHog, resetPostHog } from '../posthog';
import { loadTelemetryConfig } from '../config';
import type { IPostHogClient, TelemetryConfig } from '../types';

describe('OBS-001: PostHog Adapter Foundation', () => {
  let mockClient: IPostHogClient;

  beforeEach(() => {
    resetPostHog();
    mockClient = {
      init: vi.fn(),
      capture: vi.fn(),
      identify: vi.fn(),
      reset: vi.fn(),
      isFeatureEnabled: vi.fn().mockReturnValue(true),
    };
  });

  describe('Disabled by default & NoopAdapter', () => {
    it('1. returns NoopPostHogAdapter when telemetry is disabled', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'false',
        VITE_POSTHOG_ENABLED: 'true',
        VITE_POSTHOG_KEY: 'test-key',
      });

      const adapter = initPostHog(config, mockClient);
      expect(adapter).toBeInstanceOf(NoopPostHogAdapter);
      expect(adapter.isEnabled()).toBe(false);

      adapter.capture('page_view' as any, { route_name: 'Test', route_path: '/test', module: 'Test' } as any);
      expect(mockClient.capture).not.toHaveBeenCalled();

      expect(adapter.isFeatureEnabled('any-flag', false)).toBe(false);
      expect(adapter.isFeatureEnabled('any-flag', true)).toBe(true);
    });

    it('2. returns NoopPostHogAdapter when posthog key is missing', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'true',
        VITE_POSTHOG_ENABLED: 'true',
        VITE_POSTHOG_KEY: '',
      });

      const adapter = initPostHog(config, mockClient);
      expect(adapter.isEnabled()).toBe(false);
      expect(mockClient.init).not.toHaveBeenCalled();
    });

    it('3. blocks capture in dev when VITE_POSTHOG_CAPTURE_IN_DEV is false', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'true',
        VITE_POSTHOG_ENABLED: 'true',
        VITE_POSTHOG_KEY: 'valid-test-key',
        VITE_POSTHOG_CAPTURE_IN_DEV: 'false',
        VITE_APP_ENV: 'development',
        DEV: 'true',
      });

      const adapter = initPostHog(config, mockClient);
      expect(adapter.isEnabled()).toBe(false);
    });
  });

  describe('Enabled mode & Event contract enforcement', () => {
    const enabledConfig: TelemetryConfig = {
      telemetryEnabled: true,
      posthog: {
        enabled: true,
        key: 'phc_valid_test_token_123',
        host: 'https://us.i.posthog.com',
        captureInDev: true,
        trackEmail: false,
      },
      sentry: {
        enabled: false,
        tracesSampleRate: 0,
        trackEmail: false,
      },
      environment: 'staging',
    };

    it('4. initializes SDK client with autocapture and session replay disabled', () => {
      const adapter = new PostHogAdapter(enabledConfig.posthog, enabledConfig.environment, mockClient);
      expect(adapter.isEnabled()).toBe(true);
      expect(mockClient.init).toHaveBeenCalledWith('phc_valid_test_token_123', {
        api_host: 'https://us.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
      });
    });

    it('5. captures approved contract event with sanitized properties and environment', () => {
      const adapter = new PostHogAdapter(enabledConfig.posthog, enabledConfig.environment, mockClient);

      adapter.capture('report_opened', {
        report_key: 'quarter_targets',
        route: '/quarter-targets',
        module: 'Reporting',
        amount: 9999, // sensitive, must be dropped
      } as any);

      expect(mockClient.capture).toHaveBeenCalledWith('report_opened', {
        report_key: 'quarter_targets',
        route: '/quarter-targets',
        module: 'Reporting',
        environment: 'staging',
      });
    });

    it('6. rejects events outside the approved telemetry contract', () => {
      const adapter = new PostHogAdapter(enabledConfig.posthog, enabledConfig.environment, mockClient);

      // Attempt to emit unapproved event
      adapter.capture('unapproved_custom_click' as any, { btn: 'x' } as any);
      expect(mockClient.capture).not.toHaveBeenCalled();
    });

    it('7. deduplicates consecutive pageview emissions from the router', () => {
      const adapter = new PostHogAdapter(enabledConfig.posthog, enabledConfig.environment, mockClient);

      // Initial route transition
      adapter.capturePageView('/orders');
      expect(mockClient.capture).toHaveBeenCalledTimes(1);
      expect(mockClient.capture).toHaveBeenCalledWith('page_view', {
        route_name: 'Orders Flow',
        route_path: '/orders',
        module: 'General',
        environment: 'staging',
      });

      // Consecutive duplicate call (e.g., component re-render with query param)
      adapter.capturePageView('/orders?tab=active');
      expect(mockClient.capture).toHaveBeenCalledTimes(1); // Not called again!

      // Transition to new route
      adapter.capturePageView('/reports');
      expect(mockClient.capture).toHaveBeenCalledTimes(2);
      expect(mockClient.capture).toHaveBeenLastCalledWith('page_view', {
        route_name: 'Reports',
        route_path: '/reports',
        module: 'General',
        environment: 'staging',
      });
    });

    it('8. identity reset on logout resets deduplication cache and calls client.reset', () => {
      const adapter = new PostHogAdapter(enabledConfig.posthog, enabledConfig.environment, mockClient);

      adapter.identify('usr-cs-001', {
        role: 'cs_operator',
        family: 'CS',
        password: 'should-be-dropped',
        email: 'cs.demo@3ddx.com', // dropped because trackEmail is false
      });

      expect(mockClient.identify).toHaveBeenCalledWith('usr-cs-001', {
        role: 'cs_operator',
        family: 'CS',
      });

      adapter.capturePageView('/dashboard');
      expect(mockClient.capture).toHaveBeenCalledTimes(1);

      // Logout and reset
      adapter.reset();
      expect(mockClient.reset).toHaveBeenCalled();

      // After reset, visiting the same route emits page_view again
      adapter.capturePageView('/dashboard');
      expect(mockClient.capture).toHaveBeenCalledTimes(2);
    });

    it('9. isolates client SDK failures without throwing', () => {
      mockClient.capture = vi.fn().mockImplementation(() => {
        throw new Error('PostHog network unreachable');
      });

      const adapter = new PostHogAdapter(enabledConfig.posthog, enabledConfig.environment, mockClient);

      // Calling capture must not throw
      expect(() => {
        adapter.capture('user_logged_out', { user_id: 'usr-1' });
      }).not.toThrow();
    });
  });
});
