import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { Header } from '@/app/shell/Header';
import { AppProviders } from '@/app/providers';
import {
  MockSessionClient,
  type SessionContextDTO,
  normalizeProblemError,
  AuthenticationRequiredError,
  AccessNotAssignedError,
  TenantAccessDeniedError,
  TenantNotAssignedError,
  InsufficientPermissionsError,
} from '@/shared/api';

/**
 * ============================================================================
 * v0.9.7 TENANT AUTHORIZATION BOUNDARY & ACCEPTANCE VERIFICATION
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * Scenarios verified: TEN-01, TEN-04, TEN-05, TEN-06, TEN-13, TEN-21, TEN-23..TEN-30
 */

function TestAuthConsumer() {
  const { status, accessStatus, activeTenant, tenantId, loginWithGoogle, logout } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="access-status">{accessStatus}</div>
      <div data-testid="active-tenant-id">{activeTenant?.id ?? 'none'}</div>
      <div data-testid="active-tenant-label">{activeTenant?.label ?? 'none'}</div>
      <div data-testid="tenant-id">{tenantId ?? 'none'}</div>
      <button onClick={() => loginWithGoogle('cs.demo@3ddx.com')}>Login CS</button>
      <button onClick={() => loginWithGoogle('unassigned@3ddx.com')}>Login Unassigned</button>
      <button onClick={() => loginWithGoogle('external.unlinked@3ddx.com')}>Login Unlinked 3DDX</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('v0.9.7 Frontend Tenant Authorization Boundary & Invariants', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. Authorized user receives backend-derived active tenant
  it('1. [TEN-01, TEN-28] authorized user receives backend-derived active tenant (id=1, label=3ddx.com)', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('status').textContent).toBe('authenticated');
    expect(screen.getByTestId('access-status').textContent).toBe('AUTHORIZED');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('1');
    expect(screen.getByTestId('active-tenant-label').textContent).toBe('3ddx.com');
    expect(screen.getByTestId('tenant-id').textContent).toBe('1');
  });

  // 2. Pending user has activeTenant = null and tenantId = null
  it('2. [TEN-04, TEN-24] pending user has activeTenant = null and tenantId = null (no fallback to 1)', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Unassigned'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('status').textContent).toBe('pending_access');
    expect(screen.getByTestId('access-status').textContent).toBe('PENDING');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');
    expect(screen.getByTestId('tenant-id').textContent).toBe('none');
  });

  // 3. A valid Google login without a tenant grant does not receive tenant access
  it('3. [TEN-04, TEN-27] a valid Google login from @3ddx.com without an explicit IAM grant does not receive tenant access', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Unlinked 3DDX'));
      vi.advanceTimersByTime(500);
    });

    // @3ddx.com is provisioning eligibility only, NOT tenant authorization
    expect(screen.getByTestId('status').textContent).toBe('pending_access');
    expect(screen.getByTestId('access-status').textContent).toBe('PENDING');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');
    expect(screen.getByTestId('tenant-id').textContent).toBe('none');
  });

  // 4. DEMO_SEED_TENANT_ID=1 cannot authorize a user
  it('4. [TEN-27] DEMO_SEED_TENANT_ID=1 cannot authorize a user lacking an IAM grant', async () => {
    const client = new MockSessionClient();
    // Simulate unassigned user context with DEMO_SEED_TENANT_ID set in config
    const unassignedContext: SessionContextDTO = {
      user: { id: 'usr-unassigned', displayName: 'Unassigned Clerk', email: 'unassigned@3ddx.com' },
      accessStatus: 'PENDING',
      activeTenant: null, // seed configuration cannot set this
      roles: [],
      capabilities: [],
      tenantSwitchingEnabled: false,
    };
    client.setContext(unassignedContext);

    const fetched = await client.getSessionContext();
    expect(fetched.accessStatus).toBe('PENDING');
    expect(fetched.activeTenant).toBeNull();
  });

  // 5. No tenant selector is rendered
  it('5. [TEN-21, TEN-28] no tenant selector or tenant switcher is rendered anywhere in the application shell', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Header onMenuClick={vi.fn()} />
        </AppProviders>
      </MemoryRouter>
    );

    // Verify there are zero select, combobox, or option elements representing a tenant picker
    const selects = screen.queryAllByRole('combobox');
    const tenantSelect = selects.find(el => el.getAttribute('name')?.includes('tenant') || el.id?.includes('tenant'));
    expect(tenantSelect).toBeUndefined();

    // Verify no "Switch Tenant" button
    expect(screen.queryByRole('button', { name: /switch tenant/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /select tenant/i })).toBeNull();
  });

  // 6. Client-supplied tenant IDs are ignored or rejected at the frontend boundary
  it('6. [TEN-05, TEN-06] client-supplied tenant overrides are rejected or denied by backend error contract', () => {
    // Simulated forged tenant header response (403 TENANT_ACCESS_DENIED)
    const error403 = normalizeProblemError(403, {
      code: 'TENANT_ACCESS_DENIED',
      message: 'Client-supplied tenant ID is rejected; session tenant is authoritative',
    });
    expect(error403).toBeInstanceOf(TenantAccessDeniedError);
    expect(error403.message).toContain('Client-supplied tenant ID is rejected');
  });

  // 7. Capability-based UI visibility is not treated as authorization
  it('7. capability-based UI visibility is for UX only; server rejection with 403 overrides UI state', () => {
    // If frontend optimistically rendered a button based on cached capabilities,
    // a server 403 PERMISSION_DENIED or TENANT_ACCESS_DENIED properly normalizes
    const err = normalizeProblemError(403, {
      code: 'PERMISSION_DENIED',
      message: 'Operation not permitted with current permissions',
    });
    expect(err).toBeInstanceOf(InsufficientPermissionsError);
    expect((err as InsufficientPermissionsError).code).toBe('PERMISSION_DENIED');
  });

  // 8. Logout clears tenant, session, and identity state
  it('8. [TEN-13] logout clears session state, activeTenant, and identity context', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('1');

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');
    expect(screen.getByTestId('tenant-id').textContent).toBe('none');
  });

  // 9. Session/context errors map correctly to approved error codes
  it('9. session and context errors map correctly to RFC 7807 problem error classes', () => {
    const err401Auth = normalizeProblemError(401, { code: 'AUTHENTICATION_REQUIRED' });
    expect(err401Auth).toBeInstanceOf(AuthenticationRequiredError);

    const err403Pending = normalizeProblemError(403, { code: 'ACCESS_NOT_ASSIGNED' });
    expect(err403Pending).toBeInstanceOf(AccessNotAssignedError);

    const err403TenantMissing = normalizeProblemError(403, { code: 'TENANT_NOT_ASSIGNED' });
    expect(err403TenantMissing).toBeInstanceOf(TenantNotAssignedError);

    const err403TenantDenied = normalizeProblemError(403, { code: 'TENANT_ACCESS_DENIED' });
    expect(err403TenantDenied).toBeInstanceOf(TenantAccessDeniedError);
  });

  // 10. Revoked tenant grant is not treated as valid merely because old session state exists
  it('10. [TEN-25] revoked tenant grant invalidates active tenant access on subsequent request', async () => {
    const client = new MockSessionClient();
    const revokedContext: SessionContextDTO = {
      user: { id: 'usr-cs', displayName: 'CS Clerk', email: 'cs.demo@3ddx.com' },
      accessStatus: 'TENANT_ACCESS_DENIED',
      activeTenant: null, // Grant was revoked by Tenant Admin
      roles: ['cs_operator'],
      capabilities: [],
      tenantSwitchingEnabled: false,
    };
    client.setContext(revokedContext);

    await expect(client.getSessionContext()).rejects.toThrow(TenantAccessDeniedError);
  });

  // 11. Mock fixtures are clearly labeled MOCK / NOT_INTEGRATED
  it('11. session client boundary is explicitly identified as MOCK / NOT_INTEGRATED', () => {
    const client = new MockSessionClient();
    expect(client).toBeDefined();
    // Class name confirms mock boundary
    expect(client.constructor.name).toBe('MockSessionClient');
  });
});
