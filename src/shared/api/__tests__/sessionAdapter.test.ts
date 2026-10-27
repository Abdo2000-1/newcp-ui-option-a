import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  OfflineSessionAdapter,
  type VerifiedSessionContext,
  IDLE_TIMEOUT_MS,
  ABSOLUTE_TIMEOUT_MS,
} from '../sessionAdapter';
import {
  AuthenticationRequiredError,
  SessionExpiredError,
  TenantAccessDeniedError,
  TenantNotAssignedError,
} from '../errors';

/**
 * ============================================================================
 * SESSION ADAPTER ACCEPTANCE TESTS (TASK 5)
 * ============================================================================
 *
 * Verifies:
 * 1. Success: Returns authorized context with Authorization: Bearer <session-token>.
 * 2. Failure: Unauthenticated request throws AuthenticationRequiredError (401).
 * 3. Expiry: Idle timeout (>30 min) or absolute timeout (>8h) throws SessionExpiredError (401).
 * 4. Pending Access: Authenticated without grant returns activeTenant: null (403).
 * 5. Denial: Unauthorized tenant access throws TenantAccessDeniedError (403).
 * 6. Logout: Revokes session token and clears auth header.
 */

describe('Session Adapter Acceptance & Token Boundary (Task 5)', () => {
  let adapter: OfflineSessionAdapter;

  beforeEach(() => {
    adapter = new OfflineSessionAdapter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Returns valid Bearer authorization header for authorized session', async () => {
    const now = Date.now();
    const authorizedContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'test-session-token-xyz',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: {
        id: 'usr-cs-001',
        displayName: 'CS Demo Operator',
        email: 'cs.demo@3ddx.com',
      },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view'],
      tenantSwitchingEnabled: false,
    };
    adapter.setContext(authorizedContext);

    expect(adapter.getAuthHeader()).toBe('Bearer test-session-token-xyz');

    const ctx = await adapter.getSessionContext();
    expect(ctx.activeTenant?.id).toBe(1);
    expect(ctx.accessStatus).toBe('AUTHORIZED');
  });

  it('2. Throws AuthenticationRequiredError (401) when session context is missing or null', async () => {
    adapter.setContext(null);

    expect(adapter.getAuthHeader()).toBeNull();
    await expect(adapter.getSessionContext()).rejects.toThrow(AuthenticationRequiredError);
  });

  it('3. Throws SessionExpiredError (401) when idle timeout (30m) is exceeded', async () => {
    const now = Date.now();
    const authorizedContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: {
        id: 'usr-001',
        displayName: 'User',
        email: 'user@3ddx.com',
      },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view'],
      tenantSwitchingEnabled: false,
    };
    adapter.setContext(authorizedContext);

    // Advance timers by 31 minutes
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 60000);

    expect(adapter.isTokenExpired()).toBe(true);
    expect(adapter.getAuthHeader()).toBeNull();
    await expect(adapter.getSessionContext()).rejects.toThrow(SessionExpiredError);
  });

  it('4. Throws SessionExpiredError (401) when absolute timeout (8h) is exceeded', async () => {
    const now = Date.now();
    const authorizedContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: {
        id: 'usr-001',
        displayName: 'User',
        email: 'user@3ddx.com',
      },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view'],
      tenantSwitchingEnabled: false,
    };
    adapter.setContext(authorizedContext);

    // Keep touching activity but exceed absolute 8h
    vi.advanceTimersByTime(ABSOLUTE_TIMEOUT_MS + 1000);

    expect(adapter.isTokenExpired()).toBe(true);
    await expect(adapter.getSessionContext()).rejects.toThrow(SessionExpiredError);
  });

  it('5. Returns activeTenant: null for Pending Access context without falling back to tenant 1', async () => {
    const now = Date.now();
    const pendingContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'pending-token-123',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: {
        id: 'usr-unassigned',
        displayName: 'Unassigned User',
        email: 'unassigned@3ddx.com',
      },
      activeTenant: null, // Strictly null
      accessStatus: 'PENDING',
      roles: [],
      capabilities: [],
      tenantSwitchingEnabled: false,
    };
    adapter.setContext(pendingContext);

    const ctx = await adapter.getSessionContext();
    expect(ctx.accessStatus).toBe('PENDING');
    expect(ctx.activeTenant).toBeNull();
  });

  it('6. Throws TenantAccessDeniedError (403) when tenant access is denied', async () => {
    const now = Date.now();
    const deniedContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'denied-token',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: {
        id: 'usr-001',
        displayName: 'User',
        email: 'user@3ddx.com',
      },
      activeTenant: null,
      accessStatus: 'TENANT_ACCESS_DENIED',
      roles: [],
      capabilities: [],
      tenantSwitchingEnabled: false,
    };
    adapter.setContext(deniedContext);

    await expect(adapter.getSessionContext()).rejects.toThrow(TenantAccessDeniedError);
  });

  it('7. Throws TenantNotAssignedError (403) when explicit assignment is missing', async () => {
    const now = Date.now();
    const notAssignedContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'not-assigned-token',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: {
        id: 'usr-001',
        displayName: 'User',
        email: 'user@3ddx.com',
      },
      activeTenant: null,
      accessStatus: 'TENANT_NOT_ASSIGNED',
      roles: [],
      capabilities: [],
      tenantSwitchingEnabled: false,
    };
    adapter.setContext(notAssignedContext);

    await expect(adapter.getSessionContext()).rejects.toThrow(TenantNotAssignedError);
  });

  it('8. Logout clears session token and sets auth header to null', async () => {
    const now = Date.now();
    adapter.setContext({
      token: {
        sessionToken: 'active-token',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-01', displayName: 'U', email: 'u@3ddx.com' },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: [],
      tenantSwitchingEnabled: false,
    });

    expect(adapter.getAuthHeader()).toBe('Bearer active-token');

    await adapter.logout();

    expect(adapter.getAuthHeader()).toBeNull();
    await expect(adapter.getSessionContext()).rejects.toThrow(AuthenticationRequiredError);
  });
});
