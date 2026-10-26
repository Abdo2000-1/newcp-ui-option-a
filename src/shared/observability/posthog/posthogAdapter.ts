import type {
  AllowedEventName,
  EventPropertiesMap,
  UserTraits,
  IPostHogClient,
  TelemetryConfig,
  TelemetryEnvironment,
} from '../types';
import { sanitizeProperties, stripQueryString } from './sanitizer';

export const ALLOWED_TELEMETRY_EVENTS: readonly AllowedEventName[] = [
  'page_view',
  'user_logged_in',
  'user_logged_out',
  'navigation_clicked',
  'report_opened',
  'report_filtered',
  'report_exported',
  'workflow_action_completed',
  'feature_flag_variant_seen',
] as const;

export interface IPostHogAdapter {
  capture<E extends AllowedEventName>(event: E, properties?: EventPropertiesMap[E]): void;
  capturePageView(pathname: string, module?: string): void;
  identify(userId: string, traits?: UserTraits): void;
  reset(): void;
  isFeatureEnabled(key: string, fallback?: boolean): boolean;
  isEnabled(): boolean;
}

/**
 * No-op implementation for when Telemetry or PostHog is disabled.
 */
export class NoopPostHogAdapter implements IPostHogAdapter {
  capture(): void {}
  capturePageView(): void {}
  identify(): void {}
  reset(): void {}
  isFeatureEnabled(_key: string, fallback = false): boolean {
    return fallback;
  }
  isEnabled(): boolean {
    return false;
  }
}

/**
 * Production-ready PostHog adapter with strict privacy sanitization,
 * pageview deduplication, identity reset, and error isolation.
 */
export class PostHogAdapter implements IPostHogAdapter {
  private readonly config: TelemetryConfig['posthog'];
  private readonly environment: TelemetryEnvironment;
  private readonly client: IPostHogClient | null;
  private lastCapturedPath: string | null = null;

  constructor(
    config: TelemetryConfig['posthog'],
    environment: TelemetryEnvironment,
    customClient?: IPostHogClient
  ) {
    this.config = config;
    this.environment = environment;

    if (customClient) {
      this.client = customClient;
    } else if (typeof window !== 'undefined' && (window as unknown as { posthog?: IPostHogClient }).posthog) {
      this.client = (window as unknown as { posthog: IPostHogClient }).posthog;
    } else {
      this.client = null;
    }

    if (this.config.enabled && this.client?.init && this.config.key) {
      try {
        this.client.init(this.config.key, {
          api_host: this.config.host,
          autocapture: false,
          capture_pageview: false,
          disable_session_recording: true,
        });
      } catch (err) {
        console.warn('[PostHog] Failed to initialize SDK client:', err);
      }
    }
  }

  public isEnabled(): boolean {
    return Boolean(this.config.enabled);
  }

  public capture<E extends AllowedEventName>(event: E, properties?: EventPropertiesMap[E]): void {
    if (!this.isEnabled()) return;

    // Reject events outside approved telemetry-event-contract.md
    if (!ALLOWED_TELEMETRY_EVENTS.includes(event)) {
      if (this.environment === 'development') {
        console.warn(`[PostHog] Discarded non-contract event: ${event}`);
      }
      return;
    }

    try {
      const sanitized = sanitizeProperties(properties as Record<string, unknown>, {
        trackEmail: this.config.trackEmail,
      });

      const payload = {
        ...sanitized,
        environment: this.environment,
      };

      if (this.client?.capture) {
        this.client.capture(event, payload);
      }
    } catch (err) {
      // Telemetry failure must never break application runtime
      console.warn(`[PostHog] Error capturing event ${event}:`, err);
    }
  }

  /**
   * Emits a sanitized, deduplicated page view event from the central router.
   */
  public capturePageView(pathname: string, module = 'General'): void {
    if (!this.isEnabled()) return;

    const normalizedPath = stripQueryString(pathname).replace(/\/$/, '') || '/';

    // Deduplication guard: ignore redundant emissions of the same path
    if (this.lastCapturedPath === normalizedPath) {
      return;
    }

    this.lastCapturedPath = normalizedPath;
    const routeName = deriveRouteName(normalizedPath);

    this.capture('page_view', {
      route_name: routeName,
      route_path: normalizedPath,
      module,
      environment: this.environment,
    });
  }

  /**
   * Associates an opaque user identifier with bounded traits on login.
   */
  public identify(userId: string, traits?: UserTraits): void {
    if (!this.isEnabled() || !userId) return;

    try {
      const sanitizedTraits = sanitizeProperties((traits || {}) as Record<string, unknown>, {
        trackEmail: this.config.trackEmail,
      });

      if (this.client?.identify) {
        this.client.identify(userId, sanitizedTraits);
      }
    } catch (err) {
      console.warn('[PostHog] Error in identify:', err);
    }
  }

  /**
   * Resets identity state on logout.
   */
  public reset(): void {
    this.lastCapturedPath = null;
    if (!this.isEnabled()) return;

    try {
      if (this.client?.reset) {
        this.client.reset();
      }
    } catch (err) {
      console.warn('[PostHog] Error in reset:', err);
    }
  }

  public isFeatureEnabled(key: string, fallback = false): boolean {
    if (!this.isEnabled() || !this.client?.isFeatureEnabled) {
      return fallback;
    }

    try {
      const result = this.client.isFeatureEnabled(key);
      return typeof result === 'boolean' ? result : fallback;
    } catch {
      return fallback;
    }
  }
}

/**
 * Maps common route paths to canonical human-readable labels.
 */
function deriveRouteName(path: string): string {
  switch (path) {
    case '/':
    case '/dashboard':
      return 'Dashboard';
    case '/login':
      return 'Login';
    case '/flow':
    case '/orders':
      return 'Orders Flow';
    case '/add-case':
      return 'Add Case';
    case '/order-details':
      return 'Order Details';
    case '/quarter-targets':
      return 'Quarter Targets Report';
    case '/task-47':
      return 'Task 47 Model Work Report';
    case '/task-31':
      return 'Task 31 Staff Targets';
    case '/edit-case':
      return 'Edit Case';
    case '/reports':
      return 'Reports';
    case '/settings':
      return 'Settings';
    case '/profile':
      return 'User Profile';
    case '/503':
    case '/maintenance':
      return 'Maintenance';
    case '/404':
      return 'Not Found';
    default:
      if (path.startsWith('/orders/')) return 'Order Details View';
      if (path.startsWith('/cases/')) return 'Case Details View';
      return 'Application Route';
  }
}
