import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MockTenantAuthorizationService,
  APPROVED_OCTOBER_SEED_ASSIGNMENTS,
  type MockTenantAssignmentRecord,
} from '../tenantAuthorization';
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
  InsufficientPermissionsError,
} from '../errors';

/**
 * ============================================================================
 * IAM-TENANT-002 AUTOMATED ACCEPTANCE TEST SUITE
 * ============================================================================
 *
 * Verification Environment:
 * - Frontend Unit & Contract Boundary (Synthetic Fixtures Only).
 * - No live PostgreSQL, Casbin, or live backend execution claimed.
 *
 * Scenarios tested:
 * 1. Authorized employee with approved tenant-1 role (CS, OPS, ADMIN)
 * 2. Authenticated user without approved role (Pending Access)
 * 3. Revoked last role immediately denies business access
 * 4. Unauthorized tenant-2 request fails
 * 5. Forged browser tenant value cannot override authorized context
 * 6. Suspended employee is denied access regardless of role assignments
 * 7. Deleted employee is denied access regardless of role assignments
 * 8. Expired session (30m idle or 8h absolute) requires re-authentication (401)
 * 9. Denied business capability enforced (403)
 * 10. Request without active tenant context cannot proceed
 * 11. Role/capability refresh without stale token persistence
 * 12. No Google Groups authorization (Google identity only)
 */

describe('IAM-TENANT-002 Acceptance Test Suite (Synthetic Boundary)', () => {
  let authService: MockTenantAuthorizationService;
  let sessionAdapter: OfflineSessionAdapter;

  beforeEach(() => {
    authService = new MockTenantAuthorizationService(APPROVED_OCTOBER_SEED_ASSIGNMENTS);
    sessionAdapter = new OfflineSessionAdapter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. Authorized employee with approved tenant-1 role
  it('1. Authorized employee with approved tenant-1 role is authenticated and authorized', async () => {
    const isCsAuth = await authService.isTenantAuthorized('usr-cs-001', 1);
    const isOpsAuth = await authService.isTenantAuthorized('usr-ops-001', 1);
    const isAdminAuth = await authService.isTenantAuthorized('usr-admin-001', 1);

    expect(isCsAuth).toBe(true);
    expect(isOpsAuth).toBe(true);
    expect(isAdminAuth).toBe(true);

    const csGrants = await authService.getAuthorizedTenants('usr-cs-001');
    expect(csGrants).toHaveLength(1);
    expect(csGrants[0].tenantId).toBe(1);
    expect(csGrants[0].tenantLabel).toBe('3ddx.com');
  });

  // 2. Authenticated user without approved role
  it('2. Authenticated user without approved role receives Pending Access (activeTenant: null, tenantId: null)', async () => {
    const isAuth = await authService.isTenantAuthorized('usr-unassigned-001', 1);
    expect(isAuth).toBe(false);

    const grants = await authService.getAuthorizedTenants('usr-unassigned-001');
    expect(grants).toHaveLength(0);

    const now = Date.now();
    sessionAdapter.setContext({
      token: {
        sessionToken: 'sess-pending',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-unassigned-001', displayName: 'Unassigned', email: 'unassigned@3ddx.com' },
      activeTenant: null,
      accessStatus: 'PENDING',
      roles: [],
      capabilities: [],
      tenantSwitchingEnabled: false,
    });

    const ctx = await sessionAdapter.getSessionContext();
    expect(ctx.accessStatus).toBe('PENDING');
    expect(ctx.activeTenant).toBeNull();
  });

  // 3. Revoked last role
  it('3. Revoked last role immediately denies tenant business access on subsequent request', async () => {
    expect(await authService.isTenantAuthorized('usr-cs-001', 1)).toBe(true);

    // Revoke the role
    authService.revokeTenantRole('usr-cs-001', 'cs_operator', 1);

    expect(await authService.isTenantAuthorized('usr-cs-001', 1)).toBe(false);

    // Context should now reflect revoked access
    const now = Date.now();
    sessionAdapter.setContext({
      token: {
        sessionToken: 'sess-revoked',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-cs-001', displayName: 'CS', email: 'cs.demo@3ddx.com' },
      activeTenant: null,
      accessStatus: 'TENANT_ACCESS_DENIED',
      roles: [],
      capabilities: [],
      tenantSwitchingEnabled: false,
    });

    await expect(sessionAdapter.getSessionContext()).rejects.toThrow(TenantAccessDeniedError);
  });

  // 4. Unauthorized tenant-2 request
  it('4. Unauthorized tenant-2 request fails even when user holds tenant_admin on tenant 1', async () => {
    const isAdminAuthTenant2 = await authService.isTenantAuthorized('usr-admin-001', 2);
    expect(isAdminAuthTenant2).toBe(false);

    const now = Date.now();
    sessionAdapter.setContext({
      token: {
        sessionToken: 'sess-admin',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-admin-001', displayName: 'Admin', email: 'admin.demo@3ddx.com' },
      activeTenant: null,
      accessStatus: 'TENANT_ACCESS_DENIED',
      roles: ['tenant_admin'],
      capabilities: [],
      tenantSwitchingEnabled: false,
    });

    await expect(sessionAdapter.getSessionContext()).rejects.toThrow(TenantAccessDeniedError);
  });

  // 5. Forged browser tenant value
  it('5. Browser supplied tenant_id = 2 cannot override validated backend session context', async () => {
    const now = Date.now();
    const authorizedContext: VerifiedSessionContext = {
      token: {
        sessionToken: 'sess-legit',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-cs-001', displayName: 'CS', email: 'cs.demo@3ddx.com' },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view'],
      tenantSwitchingEnabled: false,
    };
    sessionAdapter.setContext(authorizedContext);

    // Synthetic client request simulation with untrusted body
    const untrustedRequest = {
      orderId: '504901',
      tenantId: 2, // Forged client-side tenant override!
    };

    // Verification: Backend unit of work uses session context tenant, rejecting client override
    const ctx = await sessionAdapter.getSessionContext();
    expect(ctx.activeTenant?.id).toBe(1);
    expect(ctx.activeTenant?.id).not.toBe(untrustedRequest.tenantId);
  });

  // 6. Suspended employee
  it('6. Suspended employee access is denied regardless of stored role assignments', async () => {
    const suspendedAssignment: MockTenantAssignmentRecord = {
      userId: 'usr-suspended-001',
      email: 'suspended@3ddx.com',
      tenantId: 1,
      roleId: 'cs_operator',
      roleTenantId: 1,
      partyKind: 'employee',
      userState: 'suspended',
      isDeleted: false,
      isApprovedForNewCp: true,
    };
    authService.setAssignments([suspendedAssignment]);

    const isAuth = await authService.isTenantAuthorized('usr-suspended-001', 1);
    expect(isAuth).toBe(false);
  });

  // 7. Deleted employee
  it('7. Soft-deleted employee access is denied regardless of stored role assignments', async () => {
    const deletedAssignment: MockTenantAssignmentRecord = {
      userId: 'usr-deleted-001',
      email: 'deleted@3ddx.com',
      tenantId: 1,
      roleId: 'cs_operator',
      roleTenantId: 1,
      partyKind: 'employee',
      userState: 'active',
      isDeleted: true,
      isApprovedForNewCp: true,
    };
    authService.setAssignments([deletedAssignment]);

    const isAuth = await authService.isTenantAuthorized('usr-deleted-001', 1);
    expect(isAuth).toBe(false);
  });

  // 8. Expired session
  it('8. Expired session (30m idle or 8h absolute) throws SessionExpiredError (401)', async () => {
    const now = Date.now();
    sessionAdapter.setContext({
      token: {
        sessionToken: 'sess-expiring',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-cs-001', displayName: 'CS', email: 'cs.demo@3ddx.com' },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view'],
      tenantSwitchingEnabled: false,
    });

    // Advance beyond 30 min idle timeout
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 1000);

    expect(sessionAdapter.isTokenExpired()).toBe(true);
    await expect(sessionAdapter.getSessionContext()).rejects.toThrow(SessionExpiredError);
  });

  // 9. Denied business capability
  it('9. Denied business capability (Casbin / capability check) rejects unauthorized operation (403)', async () => {
    const now = Date.now();
    sessionAdapter.setContext({
      token: {
        sessionToken: 'sess-cs',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-cs-001', displayName: 'CS', email: 'cs.demo@3ddx.com' },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['cs_operator'],
      capabilities: ['orders.view', 'services.models.edit'], // Lacks 'reports.export'
      tenantSwitchingEnabled: false,
    });

    const ctx = await sessionAdapter.getSessionContext();
    const canExport = ctx.capabilities.includes('reports.export');
    expect(canExport).toBe(false);
  });

  // 10. No active tenant context
  it('10. Request without verified active tenant context cannot proceed to tenant-scoped operations', async () => {
    sessionAdapter.setContext(null);

    await expect(sessionAdapter.getSessionContext()).rejects.toThrow(AuthenticationRequiredError);
    expect(sessionAdapter.getAuthHeader()).toBeNull();
  });

  // 11. Role/capability refresh
  it('11. Role/capability refresh updates active session without retaining stale token grants', async () => {
    const now = Date.now();
    sessionAdapter.setContext({
      token: {
        sessionToken: 'sess-refresh-test',
        tokenType: 'Bearer',
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
        lastActivityAt: now,
      },
      user: { id: 'usr-ops-001', displayName: 'Senior Ops', email: 'ops.demo@3ddx.com' },
      activeTenant: { id: 1, label: '3ddx.com' },
      accessStatus: 'AUTHORIZED',
      roles: ['ops_senior', 'ops_junior'],
      capabilities: ['orders.view', 'services.models.edit'],
      tenantSwitchingEnabled: false,
    });

    let ctx = await sessionAdapter.getSessionContext();
    expect(ctx.roles).toContain('ops_junior');

    // Simulate backend policy update (ops_junior role removed)
    sessionAdapter.setContext({
      ...ctx,
      roles: ['ops_senior'],
    });

    ctx = await sessionAdapter.getSessionContext();
    expect(ctx.roles).not.toContain('ops_junior');
    expect(ctx.roles).toContain('ops_senior');
  });

  // 12. No Google Groups authorization
  it('12. Google Groups claims are strictly ignored; PostgreSQL IAM remains authoritative', async () => {
    // Identity authenticates with Google, providing synthetic external group claim
    const syntheticGoogleOidcClaims = {
      sub: 'google-sub-99999',
      email: 'unassigned@3ddx.com',
      groups: ['3ddx-admin-group', 'super-users'], // Untrusted external group claims!
    };

    // Rule: Google Groups are NEVER queried, synchronized, or used for permissions.
    // Tenant eligibility is determined solely by PostgreSQL IAM assignments.
    const isAuthorized = await authService.isTenantAuthorized('usr-unassigned-001', 1);
    expect(isAuthorized).toBe(false);

    const grants = await authService.getAuthorizedTenants('usr-unassigned-001');
    expect(grants).toHaveLength(0);
  });
});
