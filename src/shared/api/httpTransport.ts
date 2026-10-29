import { getSentry } from '@/shared/observability';
import { normalizeProblemError, ApiClientError } from './errors';
import { getApiConfig, type ApiMode } from './config';

export interface HttpTransportConfig {
  baseUrl?: string;
  mode?: ApiMode;
  getAuthToken?: () => string | Promise<string | null> | null;
  customFetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
  defaultTimeoutMs?: number;
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  ifMatch?: string;
  tenantId?: string; // Kept for type signature compatibility; NOT transmitted as client override header
  requestId?: string;
  timeoutMs?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  etag: string | null;
  requestId?: string | null;
}

export interface IHttpTransport {
  request<T = unknown>(path: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  get<T = unknown>(path: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T = unknown>(path: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export class HttpTransport implements IHttpTransport {
  private baseUrl: string;
  private mode: ApiMode;
  private getAuthToken?: () => string | Promise<string | null> | null;
  private fetchFn: typeof fetch;
  private defaultHeaders: Record<string, string>;
  private defaultTimeoutMs: number;

  constructor(config?: HttpTransportConfig) {
    const apiCfg = getApiConfig();
    this.mode = config?.mode || apiCfg.mode;
    const resolvedBase = config?.baseUrl !== undefined ? config.baseUrl : apiCfg.baseUrl;
    this.baseUrl = (resolvedBase || '').replace(/\/+$/, '');
    this.getAuthToken = config?.getAuthToken;
    this.fetchFn = config?.customFetch || fetch.bind(globalThis);
    this.defaultHeaders = config?.defaultHeaders || {};
    this.defaultTimeoutMs = config?.defaultTimeoutMs || 15000;
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T = unknown>(path: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    // Browser CORS mitigation:
    // When running in a browser on localhost (Vite dev server) and target is a cross-origin backend,
    // the backend at http://10.20.25.147:3001 does not return Access-Control-Allow-Origin headers.
    // To prevent browser CORS rejection (Failed to fetch), route via same-origin Vite proxy (/api, /health, /docs).
    let effectiveBaseUrl = this.baseUrl;
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.hostname === 'localhost' &&
      effectiveBaseUrl &&
      !effectiveBaseUrl.startsWith(window.location.origin) &&
      (globalThis as any).process?.env?.NODE_ENV !== 'test'
    ) {
      effectiveBaseUrl = '';
    }

    // In LIVE_HTTP mode, baseUrl must be explicitly configured or defaulted
    if (this.mode === 'LIVE_HTTP' && !this.baseUrl) {
      throw new ApiClientError(
        500,
        'Configuration Error: VITE_API_BASE_URL must be defined when running in LIVE_HTTP mode.'
      );
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${effectiveBaseUrl}${cleanPath}`;

    if (effectiveBaseUrl.endsWith('/api/v1') && cleanPath.startsWith('/api/v1/')) {
      url = `${effectiveBaseUrl}${cleanPath.slice(7)}`;
    } else if (
      !effectiveBaseUrl.includes('/api/v1') &&
      !cleanPath.startsWith('/api/v1') &&
      cleanPath !== '/health' &&
      !cleanPath.startsWith('/health/') &&
      cleanPath !== '/docs' &&
      !cleanPath.startsWith('/docs/')
    ) {
      url = `${effectiveBaseUrl}/api/v1${cleanPath}`;
    }

    if (options.params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(options.params)) {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers = new Headers();
    headers.set('Accept', 'application/json');

    // Default headers
    for (const [k, v] of Object.entries(this.defaultHeaders)) {
      headers.set(k, v);
    }

    // Token injection:
    // 1. Explicit getAuthToken callback if provided
    // 2. Or fallback to stored active session token in localStorage
    if (!headers.has('Authorization')) {
      if (this.getAuthToken) {
        const token = await this.getAuthToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } else {
        try {
          if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('newcp_iam_session_v098');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.sessionToken) {
                headers.set('Authorization', `Bearer ${parsed.sessionToken}`);
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    // Tenant header (when explicitly provided by tests)
    if (options.tenantId) {
      headers.set('X-Tenant-ID', options.tenantId);
    }

    // Concurrency If-Match header
    if (options.ifMatch) {
      headers.set('If-Match', options.ifMatch);
    }

    // Request Correlation ID
    if (options.requestId) {
      headers.set('X-Request-ID', options.requestId);
    }

    // Custom option headers (e.g. override Authorization if specified in options)
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        headers.set(k, v);
      }
    }

    let bodyStr: string | undefined = undefined;
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === 'string') {
        bodyStr = options.body;
      } else {
        headers.set('Content-Type', 'application/json');
        bodyStr = JSON.stringify(options.body);
      }
    }

    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method,
        headers,
        body: bodyStr,
        signal: controller.signal,
      });
    } catch (networkErr: any) {
      clearTimeout(timer);
      if (networkErr?.name === 'AbortError') {
        throw new ApiClientError(408, `Request timeout after ${timeoutMs}ms: ${method} ${cleanPath}`);
      }
      throw new ApiClientError(
        0,
        `Network failure: unable to connect to backend at ${this.baseUrl || url}. ${networkErr?.message || ''}`.trim()
      );
    } finally {
      clearTimeout(timer);
    }

    const etag = response.headers.get('ETag') || response.headers.get('etag');
    const requestId = response.headers.get('x-request-id') || response.headers.get('X-Request-ID');

    if (!response.ok) {
      let errorPayload: unknown;
      const contentType = response.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          errorPayload = await response.json();
        } else {
          errorPayload = await response.text();
        }
      } catch {
        errorPayload = `HTTP Error ${response.status}`;
      }

      const normError = normalizeProblemError(response.status, errorPayload);
      if (requestId && 'problem' in normError && (normError as any).problem) {
        if (!(normError as any).problem.requestId) {
          (normError as any).problem.requestId = requestId;
        }
      }

      if (!getSentry().isExpectedDomainError(normError)) {
        getSentry().captureException(normError, {
          tags: { status: String(response.status), method },
          extra: { path: cleanPath, requestId: requestId || undefined },
        });
      }
      throw normError;
    }

    // 204 No Content
    if (response.status === 204) {
      return {
        data: undefined as unknown as T,
        status: response.status,
        headers: response.headers,
        etag,
        requestId,
      };
    }

    let responseData: T;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = (await response.json()) as T;
    } else {
      responseData = (await response.text()) as unknown as T;
    }

    return {
      data: responseData,
      status: response.status,
      headers: response.headers,
      etag,
      requestId,
    };
  }

  public get<T = unknown>(path: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  public patch<T = unknown>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  public delete<T = unknown>(path: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
