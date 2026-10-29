/**
 * Configuration and Mode Management for New CP API Transport Layer.
 * 
 * Supports 3 decoupled runtime modes:
 * - MOCK_BROWSER: In-browser contract simulation (strictly for offline unit tests in jsdom).
 * - MOCK_HTTP: Local standalone mock HTTP server (e.g. http://localhost:3000).
 * - LIVE_HTTP: Real New CP testing/production backend HTTP gateway (http://10.20.25.147:3001).
 */

export type ApiMode = 'MOCK_BROWSER' | 'MOCK_HTTP' | 'LIVE_HTTP';

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  enableMocks: boolean;
}

/**
 * Derives the active API configuration.
 * In unit tests (Vitest/jsdom), defaults to MOCK_BROWSER for offline safety.
 * In development and production browser runtimes, defaults to LIVE_HTTP against http://10.20.25.147:3001.
 */
export function getApiConfig(): ApiConfig {
  const isTest =
    (globalThis as any).process?.env?.NODE_ENV === 'test' ||
    import.meta.env?.MODE === 'test';

  const envMode = (import.meta.env?.VITE_API_MODE as string | undefined)?.trim().toUpperCase();
  const rawBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim() || '';
  const envEnableMocks = import.meta.env?.VITE_ENABLE_MOCKS;

  let mode: ApiMode = 'LIVE_HTTP';

  if (isTest) {
    // In unit test runner (jsdom), default to MOCK_BROWSER so offline test suites pass
    mode = 'MOCK_BROWSER';
  } else if (envMode === 'MOCK_BROWSER') {
    mode = 'MOCK_BROWSER';
  } else if (envMode === 'MOCK_HTTP') {
    mode = 'MOCK_HTTP';
  } else {
    // In browser runtime (npm run dev / preview / prod), default to LIVE_HTTP against the real backend!
    mode = 'LIVE_HTTP';
  }

  // In LIVE_HTTP, mocks are strictly disabled.
  const enableMocks = mode !== 'LIVE_HTTP' && envEnableMocks === 'true';

  // Base URL resolution:
  // If baseUrl is unset OR points to localhost:3000 (which is now the Vite dev server port),
  // default to the real New CP testing backend http://10.20.25.147:3001
  let baseUrl = rawBaseUrl.replace(/\/+$/, '');
  if (!baseUrl || (mode === 'LIVE_HTTP' && baseUrl.includes('localhost:3000'))) {
    baseUrl = 'http://10.20.25.147:3001';
  }

  return {
    mode,
    baseUrl,
    enableMocks,
  };
}

export const apiConfig = getApiConfig();

export const isLiveHttp = (): boolean => getApiConfig().mode === 'LIVE_HTTP';
export const isMockHttp = (): boolean => getApiConfig().mode === 'MOCK_HTTP';
export const isMockBrowser = (): boolean => getApiConfig().mode === 'MOCK_BROWSER';
