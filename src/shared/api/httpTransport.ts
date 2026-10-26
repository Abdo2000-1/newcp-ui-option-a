import { getSentry } from '@/shared/observability';
import { normalizeProblemError, ApiClientError } from './errors';
import { getApiConfig, type ApiMode } from './config';
import type { Problem } from './contractTypes';

export interface HttpTransportConfig {
  baseUrl?: string;
  mode?: ApiMode;
  getAuthToken?: () => string | Promise<string | null> | null;
  customFetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  ifMatch?: string;
  tenantId?: string;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  etag: string | null;
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

  constructor(config?: HttpTransportConfig) {
    const apiCfg = getApiConfig();
    this.mode = config?.mode || apiCfg.mode;
    const resolvedBase = config?.baseUrl !== undefined ? config.baseUrl : apiCfg.baseUrl;
    this.baseUrl = (resolvedBase || '').replace(/\/+$/, '');
    this.getAuthToken = config?.getAuthToken;
    this.fetchFn = config?.customFetch || fetch.bind(globalThis);
    this.defaultHeaders = config?.defaultHeaders || {};
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T = unknown>(path: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    // In LIVE_HTTP mode, baseUrl must be explicitly configured
    if (this.mode === 'LIVE_HTTP' && !this.baseUrl) {
      throw new ApiClientError(
        500,
        'Configuration Error: VITE_API_BASE_URL must be defined when running in LIVE_HTTP mode.'
      );
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${this.baseUrl}${cleanPath}`;

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

    // Token injection
    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Tenant Header
    if (options.tenantId) {
      headers.set('X-Tenant-ID', options.tenantId);
    }

    // Concurrency If-Match header
    if (options.ifMatch) {
      headers.set('If-Match', options.ifMatch);
    }

    // Custom option headers
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
    const response = await this.fetchFn(url, {
      method,
      headers,
      body: bodyStr,
    });

    const etag = response.headers.get('ETag') || response.headers.get('etag');

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
      if (!getSentry().isExpectedDomainError(normError)) {
        getSentry().captureException(normError, {
          tags: { status: String(response.status), method },
          extra: { path },
        });
      }
      throw normError;
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
