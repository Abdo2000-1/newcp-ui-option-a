import type { IPostHogClient } from './types';
import type { ISentryClient } from './sentry/sentryAdapter';

export interface MockPostHogClient extends IPostHogClient {
  events: Array<{ event: string; properties?: Record<string, unknown> }>;
  pageviews: Array<{ path: string; module?: string }>;
  users: Array<{ distinctId: string; userProperties?: Record<string, unknown> }>;
  resetsCount: number;
  flags: Record<string, boolean>;
  initCalledWithOptions: Record<string, unknown> | null;
}

/**
 * Creates an in-memory mock client for PostHog to enable deterministic
 * local verification and testing without network egress or API keys.
 */
export function createMockPostHogClient(initialFlags: Record<string, boolean> = {}): MockPostHogClient {
  const events: Array<{ event: string; properties?: Record<string, unknown> }> = [];
  const pageviews: Array<{ path: string; module?: string }> = [];
  const users: Array<{ distinctId: string; userProperties?: Record<string, unknown> }> = [];
  let resetsCount = 0;
  let initCalledWithOptions: Record<string, unknown> | null = null;
  const flags = { ...initialFlags };

  return {
    events,
    pageviews,
    users,
    get resetsCount() {
      return resetsCount;
    },
    flags,
    get initCalledWithOptions() {
      return initCalledWithOptions;
    },
    init: (_apiKey: string, config?: Record<string, unknown>) => {
      initCalledWithOptions = config || {};
    },
    capture: (eventName: string, properties?: Record<string, unknown>) => {
      events.push({ event: eventName, properties });
    },
    identify: (distinctId: string, userProperties?: Record<string, unknown>) => {
      users.push({ distinctId, userProperties });
    },
    reset: () => {
      resetsCount++;
    },
    isFeatureEnabled: (key: string) => flags[key] ?? false,
    getFeatureFlag: (key: string) => flags[key] ?? false,
  };
}

export interface MockSentryClient extends ISentryClient {
  exceptions: Array<{ error: unknown; context?: Record<string, unknown> }>;
  messages: Array<{ message: string; level?: string; context?: Record<string, unknown> }>;
  breadcrumbs: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown> | null>;
  initializedWithOptions: Record<string, unknown> | null;
}

/**
 * Creates an in-memory mock client for Sentry to enable deterministic
 * local verification and testing without network egress or DSNs.
 */
export function createMockSentryClient(): MockSentryClient {
  const exceptions: Array<{ error: unknown; context?: Record<string, unknown> }> = [];
  const messages: Array<{ message: string; level?: string; context?: Record<string, unknown> }> = [];
  const breadcrumbs: Array<Record<string, unknown>> = [];
  const users: Array<Record<string, unknown> | null> = [];
  let initializedWithOptions: Record<string, unknown> | null = null;

  return {
    exceptions,
    messages,
    breadcrumbs,
    users,
    get initializedWithOptions() {
      return initializedWithOptions;
    },
    init: (options: Record<string, unknown>) => {
      initializedWithOptions = options;
    },
    captureException: (error: unknown, context?: Record<string, unknown>) => {
      exceptions.push({ error, context });
      return `mock-sentry-event-${exceptions.length}`;
    },
    captureMessage: (message: string, level?: string, context?: Record<string, unknown>) => {
      messages.push({ message, level, context });
      return `mock-sentry-msg-${messages.length}`;
    },
    addBreadcrumb: (breadcrumb: Record<string, unknown>) => {
      breadcrumbs.push(breadcrumb);
    },
    setUser: (user: Record<string, unknown> | null) => {
      users.push(user);
    },
  };
}
