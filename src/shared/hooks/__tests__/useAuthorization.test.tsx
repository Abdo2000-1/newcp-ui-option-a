import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { useAuthorization } from '../useAuthorization';
import {
  normalizeProblemError,
  AccessNotAssignedError,
  SessionExpiredError,
  AuthenticationRequiredError,
  InsufficientPermissionsError,
  TenantAccessDeniedError,
} from '@/shared/api/errors';

function AuthTestComponent() {
  const { loginWithGoogle } = useAuth();
  const {
    can,
    hasFamily,
    canExportReports,
    canViewReports,
    exportDisabledReason,
    family,
    isPendingAccess,
  } = useAuthorization();

  return (
    <div>
      <div data-testid="family">{family || 'none'}</div>
      <div data-testid="can-export">{String(canExportReports)}</div>
      <div data-testid="can-view">{String(canViewReports)}</div>
      <div data-testid="export-reason">{exportDisabledReason || 'none'}</div>
      <div data-testid="can-edit-models">{String(can('services.models.edit'))}</div>
      <div data-testid="is-pending">{String(isPendingAccess)}</div>
      <div data-testid="is-cs">{String(hasFamily('CS'))}</div>
      <div data-testid="is-finance">{String(hasFamily('FINANCE'))}</div>

      <button onClick={() => loginWithGoogle('cs.demo@3ddx.com')}>Login CS</button>
      <button onClick={() => loginWithGoogle('ops.demo@3ddx.com')}>Login OPS</button>
      <button onClick={() => loginWithGoogle('admin.demo@3ddx.com')}>Login Admin</button>
      <button onClick={() => loginWithGoogle('unassigned@3ddx.com')}>Login Unassigned</button>
    </div>
  );
}

describe('IAM-003: Permission-Aware Frontend Boundary & Error Contract', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. CS role can view reports but CANNOT export reports', async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login CS'));
      await new Promise((r) => setTimeout(r, 450));
    });

    expect(screen.getByTestId('family').textContent).toBe('CS');
    expect(screen.getByTestId('is-cs').textContent).toBe('true');
    expect(screen.getByTestId('can-view').textContent).toBe('true');
    expect(screen.getByTestId('can-export').textContent).toBe('false');
    expect(screen.getByTestId('export-reason').textContent).toBe(
      'Report export is restricted to Finance, QC, and Admin roles.'
    );
    expect(screen.getByTestId('can-edit-models').textContent).toBe('true');
  });

  it('2. OPS role can view reports but CANNOT export reports', async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login OPS'));
      await new Promise((r) => setTimeout(r, 450));
    });

    expect(screen.getByTestId('family').textContent).toBe('OPS');
    expect(screen.getByTestId('can-view').textContent).toBe('true');
    expect(screen.getByTestId('can-export').textContent).toBe('false');
    expect(screen.getByTestId('export-reason').textContent).toBe(
      'Report export is restricted to Finance, QC, and Admin roles.'
    );
  });

  it('3. ADMIN role can both view and export reports', async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Admin'));
      await new Promise((r) => setTimeout(r, 450));
    });

    expect(screen.getByTestId('family').textContent).toBe('ADMIN');
    expect(screen.getByTestId('can-view').textContent).toBe('true');
    expect(screen.getByTestId('can-export').textContent).toBe('true');
    expect(screen.getByTestId('export-reason').textContent).toBe('none');
  });

  it('4. unassigned user has isPendingAccess=true and can() returns false', async () => {
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Unassigned'));
      await new Promise((r) => setTimeout(r, 450));
    });

    expect(screen.getByTestId('is-pending').textContent).toBe('true');
    expect(screen.getByTestId('can-edit-models').textContent).toBe('false');
  });

  it('5. normalizeProblemError maps IAM error codes to typed ProblemErrors', () => {
    const err403Pending = normalizeProblemError(403, {
      code: 'ACCESS_NOT_ASSIGNED',
      message: 'Account pending role assignment',
    });
    expect(err403Pending).toBeInstanceOf(AccessNotAssignedError);
    expect(err403Pending.status).toBe(403);

    const err401Expired = normalizeProblemError(401, {
      code: 'SESSION_EXPIRED',
      message: 'Session has expired',
    });
    expect(err401Expired).toBeInstanceOf(SessionExpiredError);
    expect(err401Expired.status).toBe(401);

    const err401AuthRequired = normalizeProblemError(401, {
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Auth required',
    });
    expect(err401AuthRequired).toBeInstanceOf(AuthenticationRequiredError);

    const err403Forbidden = normalizeProblemError(403, {
      code: 'PERMISSION_DENIED',
      message: 'Action forbidden',
    });
    expect(err403Forbidden).toBeInstanceOf(InsufficientPermissionsError);

    const err403Tenant = normalizeProblemError(403, {
      code: 'TENANT_ACCESS_DENIED',
      message: 'Tenant mismatch',
    });
    expect(err403Tenant).toBeInstanceOf(TenantAccessDeniedError);
  });
});
