import { isSensitiveKey, containsSensitiveValuePattern, stripQueryString } from '../posthog/sanitizer';

export interface SentryBreadcrumb {
  type?: string;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp?: number;
}

/**
 * Scrubs arbitrary context dictionaries (tags, extra, contexts) for Sentry events.
 */
export function scrubSentryData(
  data?: Record<string, unknown>,
  options: { trackEmail?: boolean } = {}
): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key, options.trackEmail)) {
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      if (containsSensitiveValuePattern(value)) {
        result[key] = '[REDACTED]';
        continue;
      }
      if (key === 'url' || key === 'route' || key === 'route_path' || key === 'path') {
        result[key] = stripQueryString(value);
        continue;
      }
      result[key] = value;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            return scrubSentryData(item as Record<string, unknown>, options);
          }
          if (typeof item === 'string' && containsSensitiveValuePattern(item)) {
            return '[REDACTED]';
          }
          return item;
        })
        .filter((item) => item !== undefined);
      continue;
    }

    if (typeof value === 'object') {
      result[key] = scrubSentryData(value as Record<string, unknown>, options);
      continue;
    }
  }

  return result;
}

/**
 * Scrubs breadcrumbs to ensure safe clinical diagnostics without leaks.
 */
export function scrubBreadcrumb(
  breadcrumb: SentryBreadcrumb,
  options: { trackEmail?: boolean } = {}
): SentryBreadcrumb {
  const scrubbed: SentryBreadcrumb = {
    ...breadcrumb,
    message: breadcrumb.message ? stripQueryString(breadcrumb.message) : undefined,
  };

  if (breadcrumb.data) {
    scrubbed.data = scrubSentryData(breadcrumb.data, options);
  }

  return scrubbed;
}
