import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SentryAdapter,
  NoopSentryAdapter,
  isExpectedDomainError,
  type ISentryClient,
} from '../sentry/sentryAdapter';
import { initSentry, resetSentry } from '../sentry';
import { loadTelemetryConfig } from '../config';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import {
  AuthenticationError,
  SessionExpiredError,
  InsufficientPermissionsError,
  ClinicalApprovalRequiredError,
  PreconditionFailedError,
  ValidationError,
  PreconditionRequiredError,
  ApiClientError,
} from '@/shared/api/errors';
import type { TelemetryConfig } from '../types';

function BombComponent({ shouldThrow, errorToThrow }: { shouldThrow: boolean; errorToThrow?: Error }) {
  if (shouldThrow) {
    throw errorToThrow || new Error('Uncaught rendering failure');
  }
  return <div>Component rendered safely</div>;
}

describe('OBS-002: Sentry Adapter Foundation & Error Classification', () => {
  let mockClient: ISentryClient;

  beforeEach(() => {
    resetSentry();
    mockClient = {
      init: vi.fn(),
      captureException: vi.fn().mockReturnValue('event-id-123'),
      captureMessage: vi.fn().mockReturnValue('msg-id-123'),
      addBreadcrumb: vi.fn(),
      setUser: vi.fn(),
    };
  });

  describe('Disabled by default & NoopAdapter', () => {
    it('1. returns NoopSentryAdapter when telemetry is disabled', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'false',
        VITE_SENTRY_ENABLED: 'true',
        VITE_SENTRY_DSN: 'https://key@o123.ingest.sentry.io/456',
      });

      const adapter = initSentry(config, mockClient);
      expect(adapter).toBeInstanceOf(NoopSentryAdapter);
      expect(adapter.isEnabled()).toBe(false);

      adapter.captureException(new Error('Test error'));
      expect(mockClient.captureException).not.toHaveBeenCalled();
    });

    it('2. returns NoopSentryAdapter when DSN is missing', () => {
      const config = loadTelemetryConfig({
        VITE_ENABLE_TELEMETRY: 'true',
        VITE_SENTRY_ENABLED: 'true',
        VITE_SENTRY_DSN: '',
      });

      const adapter = initSentry(config, mockClient);
      expect(adapter.isEnabled()).toBe(false);
      expect(mockClient.init).not.toHaveBeenCalled();
    });
  });

  describe('Domain Error Classification (401, 403, 404, 409, 412, 422, 428)', () => {
    it('3. accurately identifies expected domain errors vs unexpected defects', () => {
      // Expected domain outcomes
      expect(isExpectedDomainError(new AuthenticationError())).toBe(true); // 401
      expect(isExpectedDomainError(new SessionExpiredError())).toBe(true); // 401
      expect(isExpectedDomainError(new InsufficientPermissionsError())).toBe(true); // 403
      expect(isExpectedDomainError(new ApiClientError(404, 'Order not found'))).toBe(true); // 404
      expect(isExpectedDomainError(new ClinicalApprovalRequiredError())).toBe(true); // 409
      expect(isExpectedDomainError(new PreconditionFailedError())).toBe(true); // 412
      expect(isExpectedDomainError(new ValidationError())).toBe(true); // 422
      expect(isExpectedDomainError(new PreconditionRequiredError())).toBe(true); // 428

      // Unexpected errors / crashes
      expect(isExpectedDomainError(new Error('Null pointer exception'))).toBe(false);
      expect(isExpectedDomainError(new TypeError('Cannot read properties of undefined'))).toBe(false);
      expect(isExpectedDomainError(new ApiClientError(500, 'Internal Server Error'))).toBe(false);
      expect(isExpectedDomainError(new ApiClientError(502, 'Bad Gateway'))).toBe(false);
      expect(isExpectedDomainError(new ApiClientError(503, 'Service Unavailable'))).toBe(false);
    });
  });

  describe('Enabled Sentry Mode & Error Capture', () => {
    const enabledConfig: TelemetryConfig = {
      telemetryEnabled: true,
      posthog: {
        enabled: false,
        host: '',
        captureInDev: false,
        trackEmail: false,
      },
      sentry: {
        enabled: true,
        dsn: 'https://key@o123.ingest.sentry.io/456',
        environment: 'staging',
        release: 'v4.2.0',
        tracesSampleRate: 0,
        trackEmail: false,
      },
      environment: 'staging',
    };

    it('4. initializes client with sendDefaultPii=false and zero trace sample rate', () => {
      const adapter = new SentryAdapter(enabledConfig.sentry, enabledConfig.environment, mockClient);
      expect(adapter.isEnabled()).toBe(true);
      expect(mockClient.init).toHaveBeenCalledWith({
        dsn: 'https://key@o123.ingest.sentry.io/456',
        environment: 'staging',
        release: 'v4.2.0',
        tracesSampleRate: 0,
        sendDefaultPii: false,
      });
    });

    it('5. does NOT report expected domain errors to captureException (records breadcrumb instead)', () => {
      const adapter = new SentryAdapter(enabledConfig.sentry, enabledConfig.environment, mockClient);

      const res = adapter.captureException(new InsufficientPermissionsError('Forbidden action'));
      expect(res).toBeUndefined();
      expect(mockClient.captureException).not.toHaveBeenCalled();
      expect(mockClient.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'api.domain_outcome',
        })
      );
    });

    it('6. reports unexpected exceptions with scrubbed context', () => {
      const adapter = new SentryAdapter(enabledConfig.sentry, enabledConfig.environment, mockClient);

      const err = new Error('Unexpected database syntax fault');
      const res = adapter.captureException(err, {
        tags: {
          component: 'TeethChart',
          authKey: 'secret-token', // sensitive tag, must be dropped
        },
        extra: {
          price: 999, // sensitive, dropped
          attemptCount: 3,
        },
      });

      expect(res).toBe('event-id-123');
      expect(mockClient.captureException).toHaveBeenCalledWith(err, {
        tags: {
          component: 'TeethChart',
          environment: 'staging',
        },
        extra: {
          attemptCount: 3,
        },
        level: 'error',
      });
    });

    it('7. sets user context and scrubs email when trackEmail is false', () => {
      const adapter = new SentryAdapter(enabledConfig.sentry, enabledConfig.environment, mockClient);

      adapter.setUser({
        id: 'usr-cs-001',
        email: 'cs.demo@3ddx.com',
        role: 'cs_operator',
        tenantId: 1,
      });

      expect(mockClient.setUser).toHaveBeenCalledWith({
        id: 'usr-cs-001',
        role: 'cs_operator',
        tenantId: 1,
      });

      // Clear user on logout
      adapter.setUser(null);
      expect(mockClient.setUser).toHaveBeenLastCalledWith(null);
    });

    it('8. React ErrorBoundary invokes Sentry on uncaught render error', () => {
      initSentry(enabledConfig, mockClient);

      // Silence console.error during deliberate component explosion test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <BombComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Clinical View Exception/i)).toBeInTheDocument();
      expect(mockClient.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      );

      spy.mockRestore();
    });

    it('9. isolates client SDK failures without throwing', () => {
      mockClient.captureException = vi.fn().mockImplementation(() => {
        throw new Error('Sentry network failure');
      });

      const adapter = new SentryAdapter(enabledConfig.sentry, enabledConfig.environment, mockClient);

      expect(() => {
        adapter.captureException(new Error('Test crash'));
      }).not.toThrow();
    });
  });
});
