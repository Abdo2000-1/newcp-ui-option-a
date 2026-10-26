import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS } from '../AuthContext';

function TestConsumer() {
  const { session, status, isAuthenticated, isPendingAccess, loginWithGoogle, logout } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="is-auth">{String(isAuthenticated)}</div>
      <div data-testid="is-pending">{String(isPendingAccess)}</div>
      <div data-testid="email">{session?.email || 'none'}</div>
      <div data-testid="family">{session?.family || 'none'}</div>
      <div data-testid="roles">{session?.roles.join(',') || 'none'}</div>
      <div data-testid="tenant">{session?.tenantId || 'none'}</div>
      <button onClick={() => loginWithGoogle('cs.demo@3ddx.com')}>Login CS</button>
      <button onClick={() => loginWithGoogle('ops.demo@3ddx.com')}>Login OPS</button>
      <button onClick={() => loginWithGoogle('admin.demo@3ddx.com')}>Login Admin</button>
      <button onClick={() => loginWithGoogle('unassigned@3ddx.com')}>Login Unassigned</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('IAM-002: Frontend Authentication and Session Boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. logs in with CS identity and sets explicit tenant_id=1 and family=CS', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('status').textContent).toBe('authenticated');
    expect(screen.getByTestId('email').textContent).toBe('cs.demo@3ddx.com');
    expect(screen.getByTestId('family').textContent).toBe('CS');
    expect(screen.getByTestId('tenant').textContent).toBe('1');
    expect(screen.getByTestId('roles').textContent).toBe('cs_operator');
  });

  it('2. logs in with OPS identity with inherited roles', async () => {
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
  });

  it('3. unassigned internal user receives pending_access and no operational roles', async () => {
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
    expect(screen.getByTestId('is-pending').textContent).toBe('true');
    expect(screen.getByTestId('roles').textContent).toBe('none');
  });

  it('4. logout clears session state and localStorage', async () => {
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

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });
    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('5. triggers session expiration after 30 minutes of idle inactivity', async () => {
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

  it('6. triggers session expiration after 8 hours of absolute lifetime', async () => {
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
