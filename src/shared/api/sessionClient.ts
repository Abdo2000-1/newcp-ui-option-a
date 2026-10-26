/**
 * ============================================================================
 * NEW CP v0.9.7 SESSION CONTEXT CLIENT BOUNDARY
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * ARCHITECTURAL NOTICE & BLOCKER DOCUMENTATION:
 * 1. The canonical OpenAPI contracts (newcp.openapi.yaml & newcp-demo-f07.openapi.yaml)
 *    do NOT expose the GET /api/v1/session/context endpoint or DTO.
 * 2. In strict compliance with v0.9.7 guidelines, the frontend does NOT invent a
 *    live network endpoint, nor does it connect to an unapproved backend route.
 * 3. This typed client models the backend session context contract as an explicit
 *    offline boundary.
 * 4. User authorization (PostgreSQL V3 IAM user-to-tenant grants) != active session
 *    tenant context != database transaction RLS context.
 * 5. DEMO_SEED_TENANT_ID=1 is test setup data only and NEVER an authorization fallback.
 */

import {
  AuthenticationRequiredError,
  AccessNotAssignedError,
  TenantAccessDeniedError,
  TenantNotAssignedError,
} from './errors';

export type SessionAccessStatus =
  | 'AUTHORIZED'
  | 'PENDING'
  | 'TENANT_NOT_ASSIGNED'
  | 'TENANT_ACCESS_DENIED'
  | 'PERMISSION_DENIED'
  | 'SESSION_EXPIRED';

export interface SessionUserDTO {
  id: string;
  displayName: string;
  email: string;
}

export interface ActiveTenantDTO {
  id: number;
  label: string;
}

export interface SessionContextDTO {
  user: SessionUserDTO | null;
  accessStatus: SessionAccessStatus;
  activeTenant: ActiveTenantDTO | null;
  roles: string[];
  capabilities: string[];
  tenantSwitchingEnabled: boolean;
}

export interface ISessionClient {
  getSessionContext(): Promise<SessionContextDTO>;
  revokeSession(): Promise<void>;
}

export class MockSessionClient implements ISessionClient {
  private currentContext: SessionContextDTO | null = null;

  constructor(initialContext?: SessionContextDTO | null) {
    this.currentContext = initialContext ?? null;
  }

  public setContext(context: SessionContextDTO | null): void {
    this.currentContext = context;
  }

  public async getSessionContext(): Promise<SessionContextDTO> {
    if (!this.currentContext || !this.currentContext.user) {
      throw new AuthenticationRequiredError('Session is not authenticated');
    }

    if (this.currentContext.accessStatus === 'SESSION_EXPIRED') {
      throw new AuthenticationRequiredError('Session has expired');
    }

    if (this.currentContext.accessStatus === 'TENANT_NOT_ASSIGNED') {
      throw new TenantNotAssignedError('Explicit tenant assignment is missing');
    }

    if (this.currentContext.accessStatus === 'TENANT_ACCESS_DENIED') {
      throw new TenantAccessDeniedError('Tenant access denied');
    }

    if (this.currentContext.accessStatus === 'PENDING') {
      // Pending access: return safe context with activeTenant: null
      return {
        ...this.currentContext,
        activeTenant: null,
      };
    }

    return this.currentContext;
  }

  public async revokeSession(): Promise<void> {
    this.currentContext = null;
  }
}

let sessionClientInstance: ISessionClient | null = null;

export function getSessionClient(): ISessionClient {
  if (!sessionClientInstance) {
    sessionClientInstance = new MockSessionClient();
  }
  return sessionClientInstance;
}

export function resetSessionClient(): void {
  sessionClientInstance = null;
}
