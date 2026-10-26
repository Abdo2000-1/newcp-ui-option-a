/**
 * ============================================================================
 * POSTHOG EVENT PROPERTY SANITIZER
 * ============================================================================
 *
 * Enforces strict redaction of:
 * - Passwords, secrets, credentials
 * - Tokens, cookies, authorization headers
 * - PHI, patient identifiers, clinical data/notes
 * - Financial amounts, prices, invoices
 * - Raw request/response bodies and payloads
 * - Query strings from URLs and paths
 * - Emails (unless explicitly authorized)
 */

export const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  // Passwords & Secrets
  /pass(word)?/i,
  /secret/i,
  /credential/i,

  // Tokens & Keys
  /token/i,
  /bearer/i,
  /api_?key/i,
  /auth(orization)?/i,

  // Cookies & Sessions
  /cookie/i,
  /session/i,

  // PHI / Patient / Doctor Clinical Identifiers
  /patient/i,
  /doctor/i,
  /first_?name/i,
  /last_?name/i,
  /full_?name/i,
  /dob/i,
  /birth_?date/i,
  /ssn/i,
  /mrn/i,
  /chart_?num/i,

  // Clinical Notes & Prescriptions
  /clinical/i,
  /notes/i,
  /prescription/i,
  /special_?request/i,

  // Financial Amounts & Invoices
  /amount/i,
  /price/i,
  /charge/i,
  /revenue/i,
  /invoice/i,

  // Raw Payloads & Bodies
  /payload/i,
  /raw(_?data)?/i,
  /request_?body/i,
  /response_?body/i,
];

/**
 * Strips query strings, hashes, and query parameters from path strings.
 * Example: "/orders?task=flow&id=123#sec" -> "/orders"
 */
export function stripQueryString(pathOrUrl: string): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';
  return pathOrUrl.split('?')[0].split('#')[0];
}

/**
 * Checks whether a property key matches any sensitive or prohibited key pattern.
 */
export function isSensitiveKey(key: string, trackEmail = false): boolean {
  if (!key) return false;

  const normalized = key
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();

  if (!trackEmail && /email/i.test(normalized)) {
    return true;
  }

  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Checks if a string value appears to contain token patterns or sensitive credentials.
 */
export function containsSensitiveValuePattern(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  // Bearer tokens, basic auth, JWTs (eyJ...)
  if (/^Bearer\s+/i.test(val)) return true;
  if (/^Basic\s+/i.test(val)) return true;
  if (/^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(val)) return true;
  return false;
}

/**
 * Deeply sanitizes event properties, stripping prohibited keys, scrubbing query strings,
 * and masking sensitive data.
 */
export function sanitizeProperties<T extends Record<string, unknown>>(
  properties?: T,
  options: { trackEmail?: boolean } = {}
): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Drop sensitive keys completely
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

      // If key represents a route or URL, strip query strings
      if (key === 'route_path' || key === 'route' || key === 'url' || key === 'path') {
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
            return sanitizeProperties(item as Record<string, unknown>, options);
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
      result[key] = sanitizeProperties(value as Record<string, unknown>, options);
      continue;
    }
  }

  return result;
}
