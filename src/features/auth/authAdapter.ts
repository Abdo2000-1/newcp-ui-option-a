/**
 * ============================================================================
 * GOOGLE AUTHENTICATION & BACKEND LOGIN ADAPTER (v0.9.8 CANONICAL CONTRACT)
 * ============================================================================
 *
 * SPECIFICATION & CONTRACT SAFETY:
 * 1. Google Identity Services (GIS) verifies employee identity and produces an ID token.
 * 2. ID token is transmitted to backend:
 *      POST /api/v1/auth/login
 *      Body: { "idToken": "<google-id-token>" }
 * 3. Backend verifies the token against PostgreSQL V3 IAM + Casbin.
 * 4. Backend returns:
 *      AUTHORIZED: { accessStatus: "AUTHORIZED", token: "...", expiresAt: "..." }
 *      PENDING_ACCESS: { accessStatus: "PENDING_ACCESS" } (NO session token issued)
 * 5. Subsequent API requests use:
 *      Authorization: Bearer <token>
 * 6. User identity and capabilities retrieved via:
 *      GET /api/v1/auth/me
 * 7. Session revocation:
 *      POST /api/v1/auth/logout
 *
 * CLASSIFICATION: Contract-ready adapter with offline test boundary.
 */

import { getAuthClient } from '@/shared/api/authClient';
import type {
  LoginRequest,
  LoginResponse,
  AuthorizedLoginResponse,
  PendingAccessLoginResponse,
  AuthMeResponse,
} from '@/shared/api/contractTypes';

export class GoogleAuthError extends Error {
  constructor(message: string, public readonly code: string = 'GOOGLE_AUTH_FAILED') {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

export class BackendAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
    public readonly code: string = 'BACKEND_AUTH_FAILED'
  ) {
    super(message);
    this.name = 'BackendAuthError';
  }
}

export class ContractGapError extends BackendAuthError {
  constructor(endpoint: string = 'POST /api/v1/auth/login') {
    super(
      `CONTRACT GAP: ${endpoint} is not defined in the canonical OpenAPI contract. Backend deployment is required before live authentication can succeed.`,
      501,
      'CONTRACT_GAP'
    );
    this.name = 'ContractGapError';
  }
}

export { LoginRequest, LoginResponse, AuthorizedLoginResponse, PendingAccessLoginResponse, AuthMeResponse };

export interface IAuthAdapter {
  isGoogleConfigured(): boolean;
  isContractAvailable(): boolean;
  signInWithGoogle(): Promise<{ idToken: string }>;
  exchangeTokenForSession(request: LoginRequest): Promise<LoginResponse>;
  getMe(sessionToken: string): Promise<AuthMeResponse>;
  logout(sessionToken: string): Promise<void>;
}

export class GoogleAuthAdapter implements IAuthAdapter {
  private readonly googleClientId: string | undefined;
  private readonly apiBaseUrl: string;
  private readonly apiMode: string;

  constructor() {
    this.googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    this.apiMode = import.meta.env.VITE_API_MODE || 'MOCK_BROWSER';
  }

  /**
   * Returns true only if a valid, non-placeholder Google Client ID is configured.
   */
  public isGoogleConfigured(): boolean {
    if (!this.googleClientId) return false;
    if (this.googleClientId.includes('your-google-client-id-here')) return false;
    return true;
  }

  /**
   * Returns true because authentication endpoints are approved in the canonical v0.9.8 contract.
   */
  public isContractAvailable(): boolean {
    return true;
  }

  /**
   * Initiates Google Sign-In via Google Identity Services.
   * In offline / unconfigured mode, throws GoogleAuthError or supports synthetic demo token.
   */
  public async signInWithGoogle(): Promise<{ idToken: string }> {
    if (!this.isGoogleConfigured()) {
      if (this.apiMode !== 'LIVE_HTTP') {
        return { idToken: 'synthetic-google-id-token-cs-demo' };
      }
      throw new GoogleAuthError(
        'Google Identity Services client ID is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.',
        'GOOGLE_CLIENT_ID_MISSING'
      );
    }

    return new Promise((resolve, reject) => {
      const g = (window as any).google;
      if (!g?.accounts?.id) {
        reject(
          new GoogleAuthError(
            'Google Identity Services script is not loaded or was blocked by the browser.',
            'GIS_SCRIPT_UNAVAILABLE'
          )
        );
        return;
      }

      try {
        g.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              resolve({ idToken: response.credential });
            } else {
              reject(new GoogleAuthError('Google Sign-In was cancelled or failed to return a credential.', 'CREDENTIAL_EMPTY'));
            }
          },
        });
        g.accounts.id.prompt();
      } catch (err: any) {
        reject(new GoogleAuthError(err?.message || 'Failed to initialize Google Identity Services prompt.', 'GIS_PROMPT_FAILED'));
      }
    });
  }

  /**
   * Exchanges Google ID token for application session response via canonical POST /api/v1/auth/login.
   */
  public async exchangeTokenForSession(request: LoginRequest): Promise<LoginResponse> {
    if (!request.idToken || !request.idToken.trim()) {
      throw new BackendAuthError('Invalid request: Google ID token is required.', 400, 'INVALID_TOKEN');
    }

    try {
      const authClient = getAuthClient();
      return await authClient.login(request.idToken);
    } catch (err: any) {
      if (err instanceof BackendAuthError) throw err;
      throw new BackendAuthError(
        err?.message || 'Failed to exchange Google ID token with authentication service.',
        err?.status || 500,
        err?.code || 'AUTH_EXCHANGE_FAILED'
      );
    }
  }

  /**
   * Retrieves authenticated user identity and capabilities via GET /api/v1/auth/me.
   */
  public async getMe(sessionToken: string): Promise<AuthMeResponse> {
    const authClient = getAuthClient();
    return await authClient.getMe(sessionToken);
  }

  /**
   * Revokes the application session via POST /api/v1/auth/logout.
   */
  public async logout(sessionToken: string): Promise<void> {
    const authClient = getAuthClient();
    await authClient.logout(sessionToken);
  }
}

let authAdapterInstance: IAuthAdapter | null = null;

export function getAuthAdapter(): IAuthAdapter {
  if (!authAdapterInstance) {
    authAdapterInstance = new GoogleAuthAdapter();
  }
  return authAdapterInstance;
}

export function setAuthAdapter(adapter: IAuthAdapter | null): void {
  authAdapterInstance = adapter;
}