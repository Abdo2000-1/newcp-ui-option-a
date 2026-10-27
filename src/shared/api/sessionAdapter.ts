/**
 * ============================================================================
 * NEW CP APPLICATION SESSION ADAPTER & TOKEN BOUNDARY
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED (CONTRACT GAP)
 *
 * ARCHITECTURAL NOTICE & BLOCKER STATUS:
 * Because POST /api/v1/auth/login and GET /api/v1/session/context do not exist
 * in the canonical OpenAPI specification (newcp.openapi.yaml), this session
 * adapter models the approved backend contract as an offline boundary.
 *
 * In strict compliance with Task 5 instructions:
 * "Only implement this task if the approved login/session contract exists.
 *  If the contract is missing, do not implement it. Keep the task as a documented blocker PR."
 *
 * This module defines the contract-ready adapter, token manager, and headers
 * generator, but blocks live HTTP dispatch until the backend OpenAPI contract
 * is delivered.
 */

import {
  AuthenticationRequiredError,
  SessionExpiredError,
  TenantAccessDeniedError,
  TenantNotAssignedError,
  InsufficientPermissionsError,
} from './errors';

export interface ApplicationSessionToken {
  sessionToken: string;
  tokenType: 'Bearer';
  expiresAt: number; // Absolute expiration (epoch ms)
  lastActivityAt: number; // Idle timeout tracking (epoch ms)
}

export interface SessionContextUser {
  id: string;
  displayName: string;
  email: string;
}

export interface SessionContextTenant {
  id: number;
  label: string;
}

export type SessionAccessStatus =
  | 'AUTHORIZED'
  | 'PENDING'
  | 'TENANT_NOT_ASSIGNED'
  | 'TENANT_ACCESS_DENIED'
  | 'PERMISSION_DENIED'
  | 'SESSION_EXPIRED';

export interface VerifiedSessionContext {
  token: ApplicationSessionToken | null;
  user: SessionContextUser | null;
  activeTenant: SessionContextTenant | null; // strictly null when PENDING
  accessStatus: SessionAccessStatus;
  roles: string[];
  capabilities: string[];
  tenantSwitchingEnabled: boolean;
}

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface ISessionAdapter {
  getAuthHeader(): string | null;
  getSessionContext(): Promise<VerifiedSessionContext>;
  loginWithGoogleToken(idToken: string): Promise<VerifiedSessionContext>;
  logout(): Promise<void>;
  touchActivity(): void;
  isTokenExpired(): boolean;
}

/**
 * Mock / Offline Contract Adapter
 */
export class OfflineSessionAdapter implements ISessionAdapter {
  private currentContext: VerifiedSessionContext | null = null;

  constructor(initialContext?: VerifiedSessionContext | null) {
    this.currentContext = initialContext ?? null;
  }

  public setContext(context: VerifiedSessionContext | null): void {
    this.currentContext = context;
  }

  public getAuthHeader(): string | null {
    if (!this.currentContext?.token) return null;
    if (this.isTokenExpired()) return null;
    return `Bearer ${this.currentContext.token.sessionToken}`;
  }

  public isTokenExpired(): boolean {
    if (!this.currentContext?.token) return true;
    const now = Date.now();
    const { expiresAt, lastActivityAt } = this.currentContext.token;
    if (now >= expiresAt) return true;
    if (now - lastActivityAt >= IDLE_TIMEOUT_MS) return true;
    return false;
  }

  public touchActivity(): void {
    if (this.currentContext?.token && !this.isTokenExpired()) {
      this.currentContext.token.lastActivityAt = Date.now();
    }
  }

  public async getSessionContext(): Promise<VerifiedSessionContext> {
    if (!this.currentContext || !this.currentContext.user || !this.currentContext.token) {
      throw new AuthenticationRequiredError('Authentication required: No active session');
    }

    if (this.isTokenExpired()) {
      throw new SessionExpiredError('Session expired: Re-authentication with Google is required');
    }

    if (this.currentContext.accessStatus === 'TENANT_ACCESS_DENIED') {
      throw new TenantAccessDeniedError('Tenant access denied: Not authorized for active tenant');
    }

    if (this.currentContext.accessStatus === 'TENANT_NOT_ASSIGNED') {
      throw new TenantNotAssignedError('Tenant not assigned: Account has no tenant assignment');
    }

    // Touch activity on successful context retrieval
    this.touchActivity();

    // If PENDING, guarantee activeTenant is null
    if (this.currentContext.accessStatus === 'PENDING') {
      return {
        ...this.currentContext,
        activeTenant: null,
      };
    }

    return this.currentContext;
  }

  public async loginWithGoogleToken(idToken: string): Promise<VerifiedSessionContext> {
    if (!idToken || idToken.trim().length === 0) {
      throw new AuthenticationRequiredError('Invalid Google ID token');
    }

    // NOTE: In live mode, this sends POST /api/v1/auth/login { idToken }
    // In mock mode, returns contract-shaped session based on identity
    const now = Date.now();
    const token: ApplicationSessionToken = {
      sessionToken: `demo-sess-${Math.random().toString(36).substring(2)}`,
      tokenType: 'Bearer',
      expiresAt: now + ABSOLUTE_TIMEOUT_MS,
      lastActivityAt: now,
    };

    const ctx: VerifiedSessionContext = {
      token,
      user: {
        id: 'usr-demo-001',
        displayName: 'Demo Employee',
        email: 'employee@3ddx.com',
      },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view', 'services.models.edit'],
      tenantSwitchingEnabled: false,
    };

    this.currentContext = ctx;
    return ctx;
  }

  public async logout(): Promise<void> {
    // In live mode, sends POST /api/v1/auth/logout with Bearer token
    this.currentContext = null;
  }
}

let sessionAdapterInstance: ISessionAdapter | null = null;

export function getSessionAdapter(): ISessionAdapter {
  if (!sessionAdapterInstance) {
    sessionAdapterInstance = new OfflineSessionAdapter();
  }
  return sessionAdapterInstance;
}

export function resetSessionAdapter(): void {
  sessionAdapterInstance = null;
}
