import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';
import { AuthContext, AuthContextType } from '@/features/auth/AuthContext';
import { AdminRoute } from '@/app/router';

describe('Role-Aware Administration Section (Task 4)', () => {
  const createMockAuth = (overrides?: Partial<AuthContextType>): AuthContextType => ({
    session: null,
    status: 'authenticated',
    accessStatus: 'AUTHORIZED',
    isAuthenticated: true,
    isPendingAccess: false,
    activeTenant: { id: 1, label: '3ddx.com' },
    tenantId: 1,
    sessionToken: 'test-token',
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    ...overrides,
  });

  it('does NOT render Administration section for CS operator', () => {
    const csAuth = createMockAuth({
      session: {
        userId: 'usr-cs-1',
        email: 'cs@3ddx.com',
        fullName: 'CS Operator',
        activeTenant: { id: 1, label: '3ddx.com' },
        tenantId: 1,
        family: 'CS',
        roles: ['cs_operator'],
        capabilities: ['orders.view'],
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        tenantSwitchingEnabled: false,
        issuedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 10000,
      },
    });

    render(
      <AuthContext.Provider value={csAuth}>
        <BrowserRouter>
          <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    expect(screen.queryByText('CMS Controls')).not.toBeInTheDocument();
    expect(screen.queryByText('PostHog Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Sentry Settings')).not.toBeInTheDocument();
  });

  it('renders Administration section for ADMIN family user', () => {
    const adminAuth = createMockAuth({
      session: {
        userId: 'usr-admin-1',
        email: 'admin@3ddx.com',
        fullName: 'System Administrator',
        activeTenant: { id: 1, label: '3ddx.com' },
        tenantId: 1,
        family: 'ADMIN',
        roles: ['admin'],
        capabilities: ['admin.access', 'system.configure'],
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        tenantSwitchingEnabled: false,
        issuedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 10000,
      },
    });

    render(
      <AuthContext.Provider value={adminAuth}>
        <BrowserRouter>
          <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByText('CMS Controls')).toBeInTheDocument();
    expect(screen.getByText('PostHog Settings')).toBeInTheDocument();
    expect(screen.getByText('Sentry Settings')).toBeInTheDocument();
  });

  it('blocks non-admin users at AdminRoute with 403 Forbidden view', async () => {
    const csAuth = createMockAuth({
      session: {
        userId: 'usr-cs-1',
        email: 'cs@3ddx.com',
        fullName: 'CS Operator',
        activeTenant: { id: 1, label: '3ddx.com' },
        tenantId: 1,
        family: 'CS',
        roles: ['cs_operator'],
        capabilities: ['orders.view'],
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        tenantSwitchingEnabled: false,
        issuedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 10000,
      },
    });

    render(
      <AuthContext.Provider value={csAuth}>
        <MemoryRouter initialEntries={['/admin/posthog']}>
          <Routes>
            <Route
              path="/admin/posthog"
              element={
                <AdminRoute>
                  <div>Secret Admin Dashboard</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Secret Admin Dashboard')).not.toBeInTheDocument();
    expect(await screen.findByTestId('forbidden-403-page')).toBeInTheDocument();
    expect(screen.getByText(/Administrative Access Required/i)).toBeInTheDocument();
  });

  it('allows admin users at AdminRoute to view content', () => {
    const adminAuth = createMockAuth({
      session: {
        userId: 'usr-admin-1',
        email: 'admin@3ddx.com',
        fullName: 'System Administrator',
        activeTenant: { id: 1, label: '3ddx.com' },
        tenantId: 1,
        family: 'ADMIN',
        roles: ['admin'],
        capabilities: ['admin.access'],
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        tenantSwitchingEnabled: false,
        issuedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 10000,
      },
    });

    render(
      <AuthContext.Provider value={adminAuth}>
        <MemoryRouter initialEntries={['/admin/posthog']}>
          <Routes>
            <Route
              path="/admin/posthog"
              element={
                <AdminRoute>
                  <div>Secret Admin Dashboard</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Secret Admin Dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('forbidden-403-page')).not.toBeInTheDocument();
  });
});
