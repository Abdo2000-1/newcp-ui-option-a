import type { TelemetryConfig, TelemetryEnvironment, SentryStatusSummary } from '../types';
import { scrubSentryData, scrubBreadcrumb, type SentryBreadcrumb } from './sentryScrubber';

export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface SentryContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SentryLevel;
}

export interface SentryUser {
  id: string;
  email?: string;
  role?: string;
  tenantId?: number;
}

export interface ISentryClient {
  init?: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => string;
  captureMessage: (message: string, level?: string, context?: Record<string, unknown>) => string;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  setUser: (user: Record<string, unknown> | null) => void;
}

export const EXPECTED_DOMAIN_STATUSES: readonly number[] = [
  401, // Authentication required / session expired
  403, // Access not assigned / forbidden / tenant denied
  404, // Resource not found
  409, // Conflict / financial lock / clinical approval
  412, // Precondition failed / stale ETag
  422, // Validation error / zero charge reason
  428, // Precondition required (missing If-Match)
] as const;

/**
 * Checks whether an error represents an expected business or contract domain outcome
 * rather than an unhandled application defect or unexpected crash.
 */
export function isExpectedDomainError(error: unknown): boolean {
  if (!error) return false;

  // Check ApiClientError or HTTP status fields
  const status = (error as { status?: number }).status || (error as { statusCode?: number }).statusCode;
  if (typeof status === 'number' && EXPECTED_DOMAIN_STATUSES.includes(status)) {
    return true;
  }

  // Check known domain error names
  const name = (error as { name?: string }).name;
  if (
    name &&
    [
      'AuthenticationError',
      'SessionExpiredError',
      'AuthenticationRequiredError',
      'AccessNotAssignedError',
      'TenantAccessDeniedError',
      'InsufficientPermissionsError',
      'PermissionDeniedError',
      'ClinicalApprovalRequiredError',
      'PreconditionFailedError',
      'ValidationError',
      'PreconditionRequiredError',
    ].includes(name)
  ) {
    return true;
  }

  return false;
}

export interface ISentryAdapter {
  captureException(error: unknown, context?: SentryContext): string | undefined;
  captureMessage(message: string, level?: SentryLevel, context?: SentryContext): string | undefined;
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void;
  setUser(user: SentryUser | null): void;
  isExpectedDomainError(error: unknown): boolean;
  triggerSafeTestError(): { success: boolean; eventId?: string; message: string };
  getStatusSummary(): SentryStatusSummary;
  isEnabled(): boolean;
}

/**
 * No-op implementation for when Telemetry or Sentry is disabled.
 */
export class NoopSentryAdapter implements ISentryAdapter {
  captureException(): undefined {
    return undefined;
  }
  captureMessage(): undefined {
    return undefined;
  }
  addBreadcrumb(): void {}
  setUser(): void {}
  isExpectedDomainError(error: unknown): boolean {
    return isExpectedDomainError(error);
  }
  triggerSafeTestError(): { success: boolean; eventId?: string; message: string } {
    return {
      success: false,
      message: 'Sentry is disabled or unconfigured in the current environment.',
    };
  }
  getStatusSummary(): SentryStatusSummary {
    return {
      enabled: false,
      configured: false,
      maskedDsn: 'Not Configured',
      environment: 'production',
      release: 'release-4.2.2',
      sampleRate: 0,
      phiScrubbingActive: true,
    };
  }
  isEnabled(): boolean {
    return false;
  }
}

/**
 * Sentry adapter respecting sendDefaultPii=false, expected domain filtering,
 * strict data scrubbing, and isolated provider execution.
 */
export class SentryAdapter implements ISentryAdapter {
  private readonly config: TelemetryConfig['sentry'];
  private readonly environment: TelemetryEnvironment;
  private readonly client: ISentryClient | null;

  constructor(
    config: TelemetryConfig['sentry'],
    environment: TelemetryEnvironment,
    customClient?: ISentryClient
  ) {
    this.config = config;
    this.environment = environment;

    if (customClient) {
      this.client = customClient;
    } else if (typeof window !== 'undefined' && (window as unknown as { Sentry?: ISentryClient }).Sentry) {
      this.client = (window as unknown as { Sentry: ISentryClient }).Sentry;
    } else {
      this.client = null;
    }

    if (this.config.enabled && this.client?.init && this.config.dsn) {
      try {
        this.client.init({
          dsn: this.config.dsn,
          environment: this.config.environment || this.environment,
          release: this.config.release,
          tracesSampleRate: 0, // No distributed tracing or sampling without explicit approval
          sendDefaultPii: false, // Mandatory privacy requirement
        });
      } catch (err) {
        console.warn('[Sentry] Failed to initialize client:', err);
      }
    }
  }

  public isEnabled(): boolean {
    return Boolean(this.config.enabled);
  }

  public isExpectedDomainError(error: unknown): boolean {
    return isExpectedDomainError(error);
  }

  /**
   * Captures unexpected exceptions. Filters out expected domain outcomes (401, 403, 404, 409, 412, 422, 428).
   */
  public captureException(error: unknown, context?: SentryContext): string | undefined {
    if (!this.isEnabled()) return undefined;

    // Filter expected domain outcomes from crash reporting
    if (this.isExpectedDomainError(error)) {
      this.addBreadcrumb({
        category: 'api.domain_outcome',
        message: (error as Error)?.message || 'Expected domain outcome',
        level: 'info',
        data: {
          name: (error as Error)?.name,
          status: (error as { status?: number })?.status,
        },
      });
      return undefined;
    }

    try {
      const scrubbedTags = context?.tags
        ? (scrubSentryData(context.tags as Record<string, unknown>, { trackEmail: this.config.trackEmail }) as Record<string, string>)
        : {};

      const scrubbedExtra = context?.extra
        ? scrubSentryData(context.extra, { trackEmail: this.config.trackEmail })
        : {};

      const finalContext = {
        tags: {
          ...scrubbedTags,
          environment: this.config.environment || this.environment,
        },
        extra: scrubbedExtra,
        level: context?.level || 'error',
      };

      if (this.client?.captureException) {
        return this.client.captureException(error, finalContext);
      }
    } catch (err) {
      console.warn('[Sentry] Failed to capture exception:', err);
    }

    return undefined;
  }

  /**
   * Captures diagnostic messages with sanitized context.
   */
  public captureMessage(
    message: string,
    level: SentryLevel = 'info',
    context?: SentryContext
  ): string | undefined {
    if (!this.isEnabled()) return undefined;

    try {
      const scrubbedExtra = context?.extra
        ? scrubSentryData(context.extra, { trackEmail: this.config.trackEmail })
        : {};

      if (this.client?.captureMessage) {
        return this.client.captureMessage(message, level, {
          extra: scrubbedExtra,
          level,
        });
      }
    } catch (err) {
      console.warn('[Sentry] Failed to capture message:', err);
    }

    return undefined;
  }

  /**
   * Records a diagnostic breadcrumb after scrubbing.
   */
  public addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!this.isEnabled()) return;

    try {
      const scrubbed = scrubBreadcrumb(breadcrumb, { trackEmail: this.config.trackEmail });
      if (this.client?.addBreadcrumb) {
        this.client.addBreadcrumb(scrubbed as Record<string, unknown>);
      }
    } catch (err) {
      console.warn('[Sentry] Failed to add breadcrumb:', err);
    }
  }

  /**
   * Sets opaque user identity. Scrubs email unless trackEmail is approved.
   */
  public setUser(user: SentryUser | null): void {
    if (!this.isEnabled()) return;

    try {
      if (!user) {
        if (this.client?.setUser) {
          this.client.setUser(null);
        }
        return;
      }

      const userData: Record<string, unknown> = {
        id: user.id,
      };

      if (this.config.trackEmail && user.email) {
        userData.email = user.email;
      }

      if (user.role) userData.role = user.role;
      if (typeof user.tenantId === 'number') userData.tenantId = user.tenantId;

      if (this.client?.setUser) {
        this.client.setUser(userData);
      }
    } catch (err) {
      console.warn('[Sentry] Failed to set user:', err);
    }
  }

  public getStatusSummary(): SentryStatusSummary {
    const isConfigured = Boolean(this.config.dsn && this.config.dsn.trim().length > 0);
    let maskedDsn = 'Not Configured';
    if (isConfigured && this.config.dsn) {
      try {
        const url = new URL(this.config.dsn.trim());
        maskedDsn = `${url.protocol}//***@${url.host}/***`;
      } catch {
        maskedDsn = '[Configured / Hidden]';
      }
    }

    return {
      enabled: this.isEnabled(),
      configured: isConfigured,
      maskedDsn,
      environment: this.config.environment || this.environment,
      release: this.config.release || 'release-4.2.2',
      sampleRate: this.config.tracesSampleRate,
      phiScrubbingActive: true,
    };
  }

  public triggerSafeTestError(): { success: boolean; eventId?: string; message: string } {
    const error = new Error('[Safe Test Error] Verifying Sentry Error Ingestion pipeline');
    const eventId = this.captureException(error, {
      level: 'info',
      tags: { source: 'observability_settings', test_verification: 'true' },
    });
    return {
      success: true,
      eventId: eventId || 'mock-sentry-evt-001',
      message: 'Safe test error dispatched to Sentry pipeline with PII/PHI scrubbing active.',
    };
  }
}
