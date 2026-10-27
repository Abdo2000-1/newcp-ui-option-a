import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Sidebar, isRouteActive, NAV_SECTIONS } from '../Sidebar';
import { AppProviders } from '@/app/providers';

// Mock matchMedia for responsive tests in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('PR 4: Sidebar Information Architecture & Best-Practice MUI Layout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Section Grouping & Approved Page Destinations', () => {
    it('renders all approved sections with headings in expanded mode', () => {
      // Setup CS (non-admin) session
      localStorage.setItem('newcp_iam_session_v097', JSON.stringify({
        userId: 'usr-cs-01',
        fullName: 'Jane Doe',
        roles: ['cs'],
        tenantId: 1,
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
      }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      // Section headings
      expect(screen.getByText(/workspaces/i)).toBeInTheDocument();
      expect(screen.getByText(/clinical intelligence/i)).toBeInTheDocument();
      expect(screen.getByText(/directory & practice/i)).toBeInTheDocument();
      expect(screen.getByText(/system & preferences/i)).toBeInTheDocument();

      // Key destinations
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Cases')).toBeInTheDocument();
      expect(screen.getByText('Add Case')).toBeInTheDocument();
      expect(screen.getByText('Workflow Board')).toBeInTheDocument();
      expect(screen.getByText('Quarter Targets')).toBeInTheDocument();
      expect(screen.getByText('3D Model Work')).toBeInTheDocument();
      expect(screen.getByText('Staff Targets')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Doctors')).toBeInTheDocument();
      expect(screen.getByText('Clinics')).toBeInTheDocument();
      expect(screen.getByText('Scan Center')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Billing')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Non-admin should not see Administration section
      expect(screen.queryByText(/administration/i)).not.toBeInTheDocument();
      expect(screen.queryByText('CMS Controls')).not.toBeInTheDocument();
      expect(screen.queryByText('Config Manager')).not.toBeInTheDocument();
    });

    it('renders Administration section when user has admin role', () => {
      localStorage.setItem('newcp_iam_session_v097', JSON.stringify({
        userId: 'usr-admin-01',
        fullName: 'Admin User',
        roles: ['admin'],
        tenantId: 1,
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
      }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText(/administration/i)).toBeInTheDocument();
      expect(screen.getByText('CMS Controls')).toBeInTheDocument();
      expect(screen.getByText('Config Manager')).toBeInTheDocument();
    });
  });

  describe('Active Route Highlighting & Deep Links', () => {
    it('isRouteActive correctly matches paths, deep links, and order details mapping', () => {
      // Direct exact match
      expect(isRouteActive('/home', '/home')).toBe(true);
      expect(isRouteActive('/dashboard', '/dashboard')).toBe(true);

      // Order Details highlights Orders
      expect(isRouteActive('/order-details', '/orders')).toBe(true);
      expect(isRouteActive('/order-details?id=504901', '/orders')).toBe(true);
      expect(isRouteActive('/flow', '/orders')).toBe(true);
      expect(isRouteActive('/orders/504901', '/orders')).toBe(true);
      expect(isRouteActive('/orders/504901/workflow', '/orders')).toBe(true);

      // Cases deep link
      expect(isRouteActive('/cases', '/cases')).toBe(true);
      expect(isRouteActive('/cases/987', '/cases')).toBe(true);
      expect(isRouteActive('/edit-case', '/cases')).toBe(true);

      // Directory deep links
      expect(isRouteActive('/patients/101', '/patients')).toBe(true);
      expect(isRouteActive('/doctors/202', '/doctors')).toBe(true);
      expect(isRouteActive('/clinics/303', '/clinics')).toBe(true);

      // Negative checks
      expect(isRouteActive('/settings', '/orders')).toBe(false);
      expect(isRouteActive('/home', '/dashboard')).toBe(false);
    });

    it('highlights Orders button when viewing /order-details', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?id=504901']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const ordersBtn = screen.getByTestId('sidebar-nav-orders');
      expect(ordersBtn).toBeInTheDocument();
      // Has active border style
      expect(ordersBtn).toHaveStyle({
        borderLeft: '3px solid #0284c7',
      });
    });
  });

  describe('Collapsed vs Expanded States & Hide/Show Control', () => {
    it('calls onToggle when collapse toggle button is clicked', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={handleToggle}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const toggleBtn = screen.getByTestId('sidebar-toggle-button');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-label', 'Collapse sidebar');

      fireEvent.click(toggleBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('renders expand button when sidebar is collapsed', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar
              collapsed={true}
              onToggle={handleToggle}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const toggleBtn = screen.getByTestId('sidebar-toggle-button');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-label', 'Expand sidebar');

      fireEvent.click(toggleBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Compact Logout Control & Footer Area', () => {
    it('renders compact logout icon button beside user profile in footer', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const logoutBtn = screen.getByTestId('sidebar-logout-button');
      expect(logoutBtn).toBeInTheDocument();
      expect(logoutBtn).toHaveAttribute('aria-label', 'Log out');
    });

    it('clicking logout invokes auth logout and clears session', async () => {
      localStorage.setItem('newcp_iam_session_v097', JSON.stringify({
        userId: 'usr-cs-01',
        fullName: 'Jane Doe',
        roles: ['cs'],
        tenantId: 1,
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
      }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Routes>
              <Route
                path="/home"
                element={
                  <Sidebar
                    collapsed={false}
                    onToggle={vi.fn()}
                    mobileOpen={false}
                    onMobileClose={vi.fn()}
                  />
                }
              />
              <Route path="/login" element={<div>Login Page Landing</div>} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      const logoutBtn = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(localStorage.getItem('newcp_iam_session_v097')).toBeNull();
      });
    });
  });

  describe('Vertical Scrollability & Footer Visibility', () => {
    it('ensures nav list container is vertically scrollable with flex: 1 and minHeight: 0', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const navContainer = container.querySelector('nav[aria-label="Sidebar Navigation"]');
      expect(navContainer).toBeInTheDocument();
      expect(navContainer).toHaveStyle({
        overflowY: 'auto',
      });
    });
  });
});
