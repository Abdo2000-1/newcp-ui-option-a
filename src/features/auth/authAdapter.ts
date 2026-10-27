/**
 * ============================================================================
 * GOOGLE AUTHENTICATION & BACKEND LOGIN ADAPTER (IAM-TENANT-002)
 * ============================================================================
 *
 * SPECIFICATION & CONTRACT SAFETY:
 * 1. Google Identity Services (GIS) verifies employee identity and produces an ID token.
 * 2. ID token is transmitted to backend:
 *      POST /api/v1/auth/login
 *      Body: { "idToken": "<google-id-token>" }
 * 3. Backend verifies the token against PostgreSQL V3 IAM + Casbin.
 * 4. Backend returns application session token and expiry.
 * 5. Subsequent API requests use:
 *      Authorization: Bearer <session-token>
 *
 * CONTRACT GAP AUDIT STATUS:
 * - POST /api/v1/auth/login is NOT defined in canonical newcp.openapi.yaml.
 * - This module provides the contract-ready adapter, detects unconfigured
 *   Google client IDs, safely catches backend/contract errors, and enables
 *   controlled offline verification for approved demo identities.
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED (Frontend Boundary)
 */

import { ApiClientError } from '@/shared/api/errors';

export class GoogleAuthError extends Error {
  constructor(message: string, public readonly code: string = 'GOOGLE_AUTH_FAILED') {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

export class BackendAuthError extends Error {
  constructor(message: string, public readonly statusCode: number = 401, public readonly code: string = 'BACKEND_AUTH_FAILED') {
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

export interface GoogleLoginRequest {
  idToken: string;
}

export interface BackendLoginResponse {
  sessionToken: string;
  tokenType: 'Bearer';
  expiresAt: number;
  accessStatus: 'AUTHORIZED' | 'PENDING' | 'TENANT_NOT_ASSIGNED' | 'TENANT_ACCESS_DENIED';
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  activeTenant: {
    id: number;
    label: string;
  } | null;
  roles: string[];
  capabilities: string[];
  tenantSwitchingEnabled: boolean;
}

export interface IAuthAdapter {
  isGoogleConfigured(): boolean;
  isContractAvailable(): boolean;
  signInWithGoogle(): Promise<{ idToken: string }>;
  exchangeTokenForSession(request: GoogleLoginRequest): Promise<BackendLoginResponse>;
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
   * Returns true only if POST /api/v1/auth/login is verified in the backend contract.
   * Currently false because endpoint is absent from newcp.openapi.yaml.
   */
  public isContractAvailable(): boolean {
    return false;
  }

  /**
   * Initiates Google Sign-In via Google Identity Services.
   * In offline / unconfigured mode, throws GoogleAuthError or supports synthetic demo token.
   */
  public async signInWithGoogle(): Promise<{ idToken: string }> {
    if (!this.isGoogleConfigured()) {
      // In offline / mock mode when GIS is unconfigured
      if (this.apiMode !== 'LIVE_HTTP') {
        // Return synthetic demo token for default CS identity
        return { idToken: 'synthetic-google-id-token-cs-demo' };
      }
      throw new GoogleAuthError(
        'Google Identity Services client ID is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.',
        'GOOGLE_CLIENT_ID_MISSING'
      );
    }

    // Interactive Google Identity Services SDK flow
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
   * Exchanges Google ID token for application session token via POST /api/v1/auth/login.
   */
  public async exchangeTokenForSession(request: GoogleLoginRequest): Promise<BackendLoginResponse> {
    if (!request.idToken || !request.idToken.trim()) {
      throw new BackendAuthError('Invalid request: Google ID token is required.', 400, 'INVALID_TOKEN');
    }

    // In LIVE_HTTP mode, attempt live network call
    if (this.apiMode === 'LIVE_HTTP') {
      try {
        const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (response.status === 404) {
          throw new ContractGapError();
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new BackendAuthError(
            errorData.detail || errorData.message || `Backend authentication rejected request with status ${response.status}`,
            response.status,
            errorData.code || 'BACKEND_REJECTED'
          );
        }

        const data: BackendLoginResponse = await response.json();
        return data;
      } catch (err: any) {
        if (err instanceof BackendAuthError) throw err;
        throw new BackendAuthError(
          `Failed to connect to backend authentication service: ${err?.message || 'Network error'}`,
          503,
          'BACKEND_UNAVAILABLE'
        );
      }
    }

    // Offline / Mock Boundary simulation
    // Simulates the backend PostgreSQL IAM + Casbin resolution for approved demo identities
    const now = Date.now();
    const token = request.idToken;

    if (token.includes('fail') || token === 'invalid') {
      throw new BackendAuthError('Google ID token verification failed: Invalid signature or expired claim.', 401, 'INVALID_GOOGLE_TOKEN');
    }

    if (token.includes('unassigned')) {
      return {
        sessionToken: `sess-${Date.now()}-unassigned`,
        tokenType: 'Bearer',
        expiresAt: now + 8 * 60 * 60 * 1000,
        accessStatus: 'PENDING',
        user: {
          id: 'usr-unassigned-001',
          displayName: 'Unassigned Internal Employee',
          email: 'unassigned@3ddx.com',
        },
        activeTenant: null, // Strictly null; no fallback to 1
        roles: [],
        capabilities: [],
        tenantSwitchingEnabled: false,
      };
    }

    if (token.includes('ops')) {
      return {
        sessionToken: `sess-${Date.now()}-ops`,
        tokenType: 'Bearer',
        expiresAt: now + 8 * 60 * 60 * 1000,
        accessStatus: 'AUTHORIZED',
        user: {
          id: 'usr-ops-001',
          displayName: 'Senior Ops Specialist',
          email: 'ops.demo@3ddx.com',
        },
        activeTenant: { id: 1, label: '3ddx.com' },
        roles: ['ops_senior', 'ops_junior'],
        capabilities: [
          'orders.view',
          'services.models.edit',
          'services.conversion.edit',
          'pricing.override',
          'workflow.transition',
          'reports.view_all',
        ],
        tenantSwitchingEnabled: false,
      };
    }

    if (token.includes('admin')) {
      return {
        sessionToken: `sess-${Date.now()}-admin`,
        tokenType: 'Bearer',
        expiresAt: now + 8 * 60 * 60 * 1000,
        accessStatus: 'AUTHORIZED',
        user: {
          id: 'usr-admin-001',
          displayName: 'Tenant Admin Operator',
          email: 'admin.demo@3ddx.com',
        },
        activeTenant: { id: 1, label: '3ddx.com' },
        roles: ['tenant_admin'],
        capabilities: [
          'orders.view',
          'services.models.edit',
          'services.conversion.edit',
          'pricing.override',
          'payer.assign',
          'workflow.transition',
          'reports.view_all',
          'reports.export',
          'iam.roles.assign',
        ],
        tenantSwitchingEnabled: false,
      };
    }

    // Default CS Demo Operator
    return {
      sessionToken: `sess-${Date.now()}-cs`,
      tokenType: 'Bearer',
      expiresAt: now + 8 * 60 * 60 * 1000,
      accessStatus: 'AUTHORIZED',
      user: {
        id: 'usr-cs-001',
        displayName: 'CS Demo Operator',
        email: 'cs.demo@3ddx.com',
      },
      activeTenant: { id: 1, label: '3ddx.com' },
      roles: ['cs_operator'],
      capabilities: [
        'orders.view',
        'services.models.edit',
        'services.conversion.edit',
        'pricing.override',
        'payer.assign',
        'workflow.transition',
        'reports.view_all',
      ],
      tenantSwitchingEnabled: false,
    };
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
