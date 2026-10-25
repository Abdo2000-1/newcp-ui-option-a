import { normalizeProblemError } from './errors';
import type { Problem } from './contractTypes';

export interface HttpTransportConfig {
  baseUrl?: string;
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
  private getAuthToken?: () => string | Promise<string | null> | null;
  private fetchFn: typeof fetch;
  private defaultHeaders: Record<string, string>;

  constructor(config?: HttpTransportConfig) {
    this.baseUrl = (config?.baseUrl || (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1').replace(/\/+$/, '');
    this.getAuthToken = config?.getAuthToken;
    this.fetchFn = config?.customFetch || fetch.bind(globalThis);
    this.defaultHeaders = config?.defaultHeaders || {};
  }

  public async request<T = unknown>(path: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
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

      throw normalizeProblemError(response.status, errorPayload);
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
