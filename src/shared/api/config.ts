/**
 * Configuration and Mode Management for New CP API Transport Layer.
 * 
 * Supports 3 decoupled runtime modes:
 * - MOCK_BROWSER: In-browser contract simulation (ideal for static demo / offline dev).
 * - MOCK_HTTP: Local standalone mock HTTP server (e.g. http://localhost:3000).
 * - LIVE_HTTP: Real production/staging backend HTTP gateway conforming to OpenAPI 3.0.3.
 */

export type ApiMode = 'MOCK_BROWSER' | 'MOCK_HTTP' | 'LIVE_HTTP';

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  enableMocks: boolean;
}

/**
 * Derives the active API configuration strictly from environment variables.
 * Never defaults LIVE_HTTP to mock fallback.
 */
export function getApiConfig(): ApiConfig {
  const envMode = (import.meta.env?.VITE_API_MODE as string | undefined)?.trim().toUpperCase();
  const rawBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim() || '';
  const envEnableMocks = import.meta.env?.VITE_ENABLE_MOCKS;

  let mode: ApiMode = 'MOCK_BROWSER';

  if (envMode === 'LIVE_HTTP') {
    mode = 'LIVE_HTTP';
  } else if (envMode === 'MOCK_HTTP') {
    mode = 'MOCK_HTTP';
  } else if (envMode === 'MOCK_BROWSER') {
    mode = 'MOCK_BROWSER';
  } else {
    // Default mode heuristic:
    // If VITE_ENABLE_MOCKS is explicitly 'false', select LIVE_HTTP.
    // Otherwise, default to safe MOCK_BROWSER for standalone client resilience.
    if (envEnableMocks === 'false') {
      mode = 'LIVE_HTTP';
    } else if (rawBaseUrl && rawBaseUrl.includes(':3000')) {
      mode = 'MOCK_HTTP';
    } else {
      mode = 'MOCK_BROWSER';
    }
  }

  // In LIVE_HTTP, mocks are strictly disabled.
  const enableMocks = mode !== 'LIVE_HTTP' && envEnableMocks !== 'false';

  // Base URL resolution
  let baseUrl = rawBaseUrl.replace(/\/+$/, '');
  if (!baseUrl && mode !== 'LIVE_HTTP') {
    baseUrl = '/api/v1';
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
