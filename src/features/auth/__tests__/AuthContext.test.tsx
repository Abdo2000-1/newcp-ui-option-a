import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS } from '../AuthContext';

function TestConsumer() {
  const { session, status, accessStatus, isAuthenticated, isPendingAccess, activeTenant, tenantId, loginWithGoogle, logout } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="access-status">{accessStatus}</div>
      <div data-testid="is-auth">{String(isAuthenticated)}</div>
      <div data-testid="is-pending">{String(isPendingAccess)}</div>
      <div data-testid="email">{session?.email || 'none'}</div>
      <div data-testid="family">{session?.family || 'none'}</div>
      <div data-testid="roles">{session?.roles.join(',') || 'none'}</div>
      <div data-testid="tenant">{tenantId ?? 'none'}</div>
      <div data-testid="active-tenant-id">{activeTenant?.id ?? 'none'}</div>
      <div data-testid="active-tenant-label">{activeTenant?.label ?? 'none'}</div>
      <button onClick={() => loginWithGoogle('cs.demo@3ddx.com')}>Login CS</button>
      <button onClick={() => loginWithGoogle('ops.demo@3ddx.com')}>Login OPS</button>
      <button onClick={() => loginWithGoogle('admin.demo@3ddx.com')}>Login Admin</button>
      <button onClick={() => loginWithGoogle('unassigned@3ddx.com')}>Login Unassigned</button>
      <button onClick={() => loginWithGoogle('new.user@3ddx.com')}>Login New Domain User</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('IAM-002 & v0.9.7: Frontend Authentication and Tenant Session Boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. logs in with CS identity and sets backend-derived activeTenant (id=1, label=3ddx.com)', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('status').textContent).toBe('authenticated');
    expect(screen.getByTestId('access-status').textContent).toBe('AUTHORIZED');
    expect(screen.getByTestId('email').textContent).toBe('cs.demo@3ddx.com');
    expect(screen.getByTestId('family').textContent).toBe('CS');
    expect(screen.getByTestId('tenant').textContent).toBe('1');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('1');
    expect(screen.getByTestId('active-tenant-label').textContent).toBe('3ddx.com');
    expect(screen.getByTestId('roles').textContent).toBe('cs_operator');
  });

  it('2. logs in with OPS identity with inherited roles and active tenant', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login OPS'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('family').textContent).toBe('OPS');
    expect(screen.getByTestId('roles').textContent).toContain('ops_senior');
    expect(screen.getByTestId('roles').textContent).toContain('ops_junior');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('1');
  });

  it('3. unassigned internal user receives pending_access with activeTenant=null and tenantId=null', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Unassigned'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('status').textContent).toBe('pending_access');
    expect(screen.getByTestId('access-status').textContent).toBe('PENDING');
    expect(screen.getByTestId('is-pending').textContent).toBe('true');
    expect(screen.getByTestId('roles').textContent).toBe('none');
    // Strict v0.9.7 requirement: activeTenant is null and tenantId has NO fallback to 1
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');
    expect(screen.getByTestId('tenant').textContent).toBe('none');
  });

  it('4. a valid Google login without an explicit tenant grant does not receive tenant access', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login New Domain User'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('status').textContent).toBe('pending_access');
    expect(screen.getByTestId('access-status').textContent).toBe('PENDING');
    expect(screen.getByTestId('is-pending').textContent).toBe('true');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');
    expect(screen.getByTestId('tenant').textContent).toBe('none');
  });

  it('5. logout clears session state, tenant context, and localStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Admin'));
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('status').textContent).toBe('authenticated');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('1');

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });
    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('email').textContent).toBe('none');
    expect(screen.getByTestId('active-tenant-id').textContent).toBe('none');
    expect(screen.getByTestId('tenant').textContent).toBe('none');
  });

  it('6. triggers session expiration after 30 minutes of idle inactivity', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('status').textContent).toBe('authenticated');

    // Advance clock past 30-minute idle timeout (and past periodic 30s heartbeat interval)
    await act(async () => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 35000);
    });

    expect(screen.getByTestId('status').textContent).toBe('expired');
  });

  it('7. triggers session expiration after 8 hours of absolute lifetime', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('status').textContent).toBe('authenticated');

    // Keep clicking every 10 minutes to avoid idle timeout, but exceed 8-hour max lifetime
    for (let i = 0; i < 48; i++) {
      await act(async () => {
        vi.advanceTimersByTime(10 * 60 * 1000);
        window.dispatchEvent(new Event('click'));
      });
    }

    // Now elapsed is 8 hours
    await act(async () => {
      vi.advanceTimersByTime(ABSOLUTE_TIMEOUT_MS + 1000);
    });

    expect(screen.getByTestId('status').textContent).toBe('expired');
  });
});
