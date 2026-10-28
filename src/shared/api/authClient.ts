/**
 * ============================================================================
 * NEW CP v0.9.8 AUTHENTICATION CLIENT (CANONICAL CONTRACT)
 * ============================================================================
 *
 * SPECIFICATION & CONTRACT SAFETY:
 * 1. Google Identity Services (GIS) verifies employee identity and produces an ID token.
 * 2. Token exchange: POST /api/v1/auth/login with body { "idToken": "<google-id-token>" }
 *    - AUTHORIZED: { accessStatus: 'AUTHORIZED', token: string, expiresAt: string | number }
 *    - PENDING_ACCESS: { accessStatus: 'PENDING_ACCESS' } (NO session token issued)
 * 3. Identity and capabilities: GET /api/v1/auth/me with Authorization: Bearer <token>
 *    - Returns { email, userUuid, tenantSlug, roleCodes, capabilities, isPendingAccess }
 * 4. Revocation: POST /api/v1/auth/logout with Authorization: Bearer <token>
 *
 * CLASSIFICATION: Contract-ready HTTP client with offline mock fallback.
 */

import { HttpTransport, type IHttpTransport } from './httpTransport';
import { getApiConfig } from './config';
import {
  AuthenticationError,
  SessionExpiredError,
  normalizeProblemError,
} from './errors';
import type {
  LoginResponse,
  AuthorizedLoginResponse,
  PendingAccessLoginResponse,
  AuthMeResponse,
} from './contractTypes';

export interface IAuthClient {
  login(idToken: string): Promise<LoginResponse>;
  getMe(sessionToken: string): Promise<AuthMeResponse>;
  logout(sessionToken: string): Promise<void>;
}

export class AuthClient implements IAuthClient {
  private readonly transport: IHttpTransport;
  private readonly apiMode: string;

  constructor(transport?: IHttpTransport) {
    this.apiMode = getApiConfig().mode;
    this.transport = transport || new HttpTransport();
  }

  /**
   * Exchanges Google ID token for application session token.
   * Calls POST /api/v1/auth/login
   */
  public async login(idToken: string): Promise<LoginResponse> {
    if (!idToken || !idToken.trim()) {
      throw new AuthenticationError('Google ID token is required');
    }

    if (this.apiMode === 'LIVE_HTTP') {
      const response = await this.transport.post<LoginResponse>('/api/v1/auth/login', {
        idToken: idToken.trim(),
      });
      return response.data;
    }

    // Offline / Mock Boundary simulation
    const token = idToken.trim();

    if (token.includes('fail') || token === 'invalid') {
      throw normalizeProblemError(401, {
        error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Google ID token verification failed' },
      });
    }

    if (token.includes('unassigned') || token.includes('pending')) {
      const pendingResponse: PendingAccessLoginResponse = {
        accessStatus: 'PENDING_ACCESS',
      };
      return pendingResponse;
    }

    const now = Date.now();
    const authorizedResponse: AuthorizedLoginResponse = {
      accessStatus: 'AUTHORIZED',
      token: `sess-v098-${now}-${token.slice(0, 8)}`,
      expiresAt: now + 8 * 60 * 60 * 1000,
    };
    return authorizedResponse;
  }

  /**
   * Retrieves authenticated user identity, tenant slug, role codes, and capabilities.
   * Calls GET /api/v1/auth/me
   */
  public async getMe(sessionToken: string): Promise<AuthMeResponse> {
    if (!sessionToken) {
      throw new AuthenticationError('Session token is required');
    }

    if (this.apiMode === 'LIVE_HTTP') {
      const response = await this.transport.get<AuthMeResponse>('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      return response.data;
    }

    // Offline / Mock Boundary simulation
    if (sessionToken.includes('expired')) {
      throw new SessionExpiredError({
        code: 'SESSION_EXPIRED',
        message: 'Session has expired due to inactivity or max lifetime',
      });
    }

    if (sessionToken.includes('unassigned') || sessionToken.includes('pending')) {
      return {
        email: 'unassigned@3ddx.com',
        userUuid: 'usr-unassigned-001',
        tenantSlug: '3ddx',
        roleCodes: [],
        capabilities: [],
        isPendingAccess: true,
      };
    }

    if (sessionToken.includes('ops')) {
      return {
        email: 'ops.demo@3ddx.com',
        userUuid: 'usr-ops-001',
        tenantSlug: '3ddx',
        roleCodes: ['ops_senior', 'ops_junior'],
        capabilities: [
          'orders.view',
          'services.models.edit',
          'services.conversion.edit',
          'pricing.override',
          'workflow.transition',
          'reports.view_all',
        ],
        isPendingAccess: false,
      };
    }

    if (sessionToken.includes('admin')) {
      return {
        email: 'admin.demo@3ddx.com',
        userUuid: 'usr-admin-001',
        tenantSlug: '3ddx',
        roleCodes: ['admin'],
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
          'iam.users.read',
          'iam.user_roles.read',
          'iam.roles.read',
          'iam.capabilities.read',
        ],
        isPendingAccess: false,
      };
    }

    // Default CS Demo Operator
    return {
      email: 'cs.demo@3ddx.com',
      userUuid: 'usr-cs-001',
      tenantSlug: '3ddx',
      roleCodes: ['cs_operator'],
      capabilities: [
        'orders.view',
        'services.models.edit',
        'services.conversion.edit',
        'pricing.override',
        'payer.assign',
        'workflow.transition',
        'reports.view_all',
      ],
      isPendingAccess: false,
    };
  }

  /**
   * Revokes the application session token.
   * Calls POST /api/v1/auth/logout
   */
  public async logout(sessionToken: string): Promise<void> {
    if (!sessionToken) return;

    if (this.apiMode === 'LIVE_HTTP') {
      try {
        await this.transport.post('/api/v1/auth/logout', null, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      } catch {
        // Safe to ignore network/backend errors on logout; local state is cleared regardless
      }
    }
  }
}

let authClientInstance: IAuthClient | null = null;

export function getAuthClient(): IAuthClient {
  if (!authClientInstance) {
    authClientInstance = new AuthClient();
  }
  return authClientInstance;
}

export function setAuthClient(client: IAuthClient | null): void {
  authClientInstance = client;
}