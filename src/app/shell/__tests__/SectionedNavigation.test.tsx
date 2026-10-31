import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import { Sidebar } from '../Sidebar';
import { ConvertibleNav } from '../ConvertibleNav';
import { Layout } from '../Layout';
import { AppProviders } from '@/app/providers';
import * as AuthModule from '@/features/auth';

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

const mockAdminSession: AuthModule.UserSession = {
  userId: 'usr-admin-001',
  email: 'admin.demo@3ddx.com',
  fullName: 'Tenant Admin Operator',
  activeTenant: { id: 1, label: '3ddx.com' },
  tenantId: 1,
  family: 'ADMIN',
  roles: ['tenant_admin'],
  capabilities: [
    'orders.view',
    'services.models.edit',
    'services.conversion.edit',
    'pricing.override',
    'payer.assign',
    'workflow.transition',
    'reports.view_all',
    'reports.export',
    'iam.roles.assign',
  ],
  status: 'authenticated',
  accessStatus: 'AUTHORIZED',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

const mockSeniorOpsSession: AuthModule.UserSession = {
  userId: 'usr-ops-001',
  email: 'ops.demo@3ddx.com',
  fullName: 'Senior Operations Specialist',
  activeTenant: { id: 1, label: '3ddx.com' },
  tenantId: 1,
  family: 'OPS',
  roles: ['ops_senior', 'ops_junior'],
  capabilities: ['orders.view', 'workflow.transition'],
  status: 'authenticated',
  accessStatus: 'AUTHORIZED',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

const mockCsSession: AuthModule.UserSession = {
  userId: 'usr-cs-001',
  email: 'cs.demo@3ddx.com',
  fullName: 'Customer Service Operator',
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
  expiresAt: Date.now() + 3600000,
};

const mockPendingSession: AuthModule.UserSession = {
  userId: 'usr-pending-001',
  email: 'unassigned@3ddx.com',
  fullName: 'Pending Employee',
  activeTenant: null,
  tenantId: null,
  roles: [],
  capabilities: [],
  status: 'pending_access',
  accessStatus: 'PENDING',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};




describe('UIUX-NAV-001: Sectioned Navigation Architecture Acceptance', () => {
  let mockLogout: () => Promise<void>;

  function createMockAuth(overrides?: Partial<AuthModule.AuthContextType>): AuthModule.AuthContextType {
    return {
      session: mockAdminSession,
      status: 'authenticated',
      accessStatus: 'AUTHORIZED',
      isAuthenticated: true,
      isPendingAccess: false,
      activeTenant: mockAdminSession.activeTenant,
      tenantId: mockAdminSession.tenantId,
      sessionToken: 'mock-token',
      loginWithGoogle: vi.fn(),
      logout: mockLogout,
      refreshSession: vi.fn(),
      ...overrides,
    };
  }

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLogout = vi.fn().mockResolvedValue(undefined) as unknown as () => Promise<void>;

    // Default auth mock: Admin session
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue(createMockAuth({ session: mockAdminSession }));
  });

  describe('1. Section rendering with headings & approved routes', () => {
    it('divides sidebar into logical sections with clear headings and scrollable container', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      // Section headings
      expect(screen.getByTestId('section-heading-workspaces')).toHaveTextContent(/workspaces/i);
      expect(screen.getByTestId('section-heading-intelligence')).toHaveTextContent(/clinical operations/i);
      expect(screen.getByTestId('section-heading-directory')).toHaveTextContent(/directory & practice/i);
      expect(screen.getByTestId('section-heading-system')).toHaveTextContent(/preferences & system/i);
      expect(screen.getByTestId('section-heading-administration')).toHaveTextContent(/administration/i);

      // Vertically scrollable container exists
      const scrollContainer = screen.getByTestId('sidebar-scrollable-container');
      expect(scrollContainer).toBeInTheDocument();

      // Approved routes are rendered
      expect(screen.getByText(/^home$/i)).toBeInTheDocument();
      expect(screen.getByText(/^orders$/i)).toBeInTheDocument();
      expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
      expect(screen.getByText(/add case/i)).toBeInTheDocument();

      expect(screen.getByText(/change requests/i)).toBeInTheDocument();
      expect(screen.getByText(/live dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/3d models/i)).toBeInTheDocument();
      expect(screen.getByText(/staff targets/i)).toBeInTheDocument();
      expect(screen.getByText(/reports/i)).toBeInTheDocument();
      expect(screen.getByText(/patients/i)).toBeInTheDocument();
      expect(screen.getByText(/doctors/i)).toBeInTheDocument();
      expect(screen.getByText(/clinics/i)).toBeInTheDocument();
      expect(screen.getByText(/scan center/i)).toBeInTheDocument();
      expect(screen.getByText(/documents/i)).toBeInTheDocument();
      expect(screen.getByText(/billing/i)).toBeInTheDocument();
      expect(screen.queryByText(/notifications/i)).not.toBeInTheDocument();
      expect(screen.getByText(/cms controls/i)).toBeInTheDocument();
      expect(screen.getByText(/api documentation/i)).toBeInTheDocument();
    });

    it('strictly omits "Order Details" and "Edit Case" as direct navigation links', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      // Requirement 21: remove order details, edit case from nav bar and side bar
      expect(screen.queryByText(/^order details$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^edit case$/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Role-based visibility boundary for Administration section', () => {
    it('shows Administration section to Admin session (family: ADMIN / iam.roles.assign)', () => {
      vi.spyOn(AuthModule, 'useAuth').mockReturnValue(createMockAuth({ session: mockAdminSession }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('section-heading-administration')).toBeInTheDocument();
      expect(screen.getByText(/cms controls/i)).toBeInTheDocument();
      expect(screen.getByText(/api documentation/i)).toBeInTheDocument();
    });

    it('shows Administration section to Senior role session (roles: ops_senior)', () => {
      vi.spyOn(AuthModule, 'useAuth').mockReturnValue(createMockAuth({ session: mockSeniorOpsSession, activeTenant: mockSeniorOpsSession.activeTenant, tenantId: mockSeniorOpsSession.tenantId }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('section-heading-administration')).toBeInTheDocument();
    });

    it('hides Administration section from CS Operator session', () => {
      vi.spyOn(AuthModule, 'useAuth').mockReturnValue(createMockAuth({ session: mockCsSession, activeTenant: mockCsSession.activeTenant, tenantId: mockCsSession.tenantId }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('section-heading-administration')).not.toBeInTheDocument();
      expect(screen.queryByText(/cms controls/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/api documentation/i)).not.toBeInTheDocument();
    });

    it('hides Administration section from Pending Access session', () => {
      vi.spyOn(AuthModule, 'useAuth').mockReturnValue(createMockAuth({ session: mockPendingSession, status: 'pending_access', accessStatus: 'PENDING', isAuthenticated: false, isPendingAccess: true, activeTenant: null, tenantId: null, sessionToken: null }));

      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('section-heading-administration')).not.toBeInTheDocument();
    });
  });

  describe('3. Active route highlighting & Order Details / Edit Case state', () => {
    it('highlights Orders when route is /orders', () => {
      render(
        <MemoryRouter initialEntries={['/orders']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const ordersLink = screen.getByTestId('nav-link-orders');
      expect(ordersLink).toHaveAttribute('aria-current', 'page');
    });

    it('highlights Orders when viewing /order-details (Order Details active state)', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?id=504901']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const ordersLink = screen.getByTestId('nav-link-orders');
      expect(ordersLink).toHaveAttribute('aria-current', 'page');
    });

    it('highlights Orders when viewing legacy /flow queue', () => {
      render(
        <MemoryRouter initialEntries={['/flow']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const ordersLink = screen.getByTestId('nav-link-orders');
      expect(ordersLink).toHaveAttribute('aria-current', 'page');
    });

    it('highlights Orders when viewing /edit-case', () => {
      render(
        <MemoryRouter initialEntries={['/edit-case?id=123']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const ordersLink = screen.getByTestId('nav-link-orders');
      expect(ordersLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('4. Sidebar collapse / expand & outer border toggle', () => {
    it('triggers onToggle when clicking the top collapse button', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={handleToggle} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const collapseBtn = screen.getByTestId('sidebar-toggle-collapse');
      fireEvent.click(collapseBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('triggers onToggle when clicking the top expand button in collapsed state', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={true} onToggle={handleToggle} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const expandBtn = screen.getByTestId('sidebar-toggle-expand');
      fireEvent.click(expandBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('triggers onToggle when clicking the interactive outer border strip (Requirement 10)', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={handleToggle} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const borderStrip = screen.getByTestId('sidebar-border-toggle');
      expect(borderStrip).toBeInTheDocument();

      fireEvent.click(borderStrip);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Keyboard access & collapsed state accessibility', () => {
    it('allows triggering outer border collapse via keyboard Enter and Space keys', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={handleToggle} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const borderStrip = screen.getByTestId('sidebar-border-toggle');
      expect(borderStrip).toHaveAttribute('tabIndex', '0');

      fireEvent.keyDown(borderStrip, { key: 'Enter' });
      expect(handleToggle).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(borderStrip, { key: ' ' });
      expect(handleToggle).toHaveBeenCalledTimes(2);
    });

    it('provides accessible aria-label and tooltips on icon buttons when collapsed', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={true} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const homeBtn = screen.getByLabelText(/^home$/i);
      expect(homeBtn).toBeInTheDocument();
      expect(homeBtn).toHaveAttribute('tabIndex', '0');

      const ordersBtn = screen.getByLabelText(/^orders$/i);
      expect(ordersBtn).toBeInTheDocument();
    });
  });

  describe('6. Logout action', () => {
    it('triggers logout when clicking the small logout icon near profile area', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
          </AppProviders>
        </MemoryRouter>
      );

      const logoutBtn = screen.getByTestId('sidebar-logout-button');
      expect(logoutBtn).toBeInTheDocument();
      expect(logoutBtn).toHaveAttribute('aria-label', 'Log out');

      fireEvent.click(logoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Mobile behavior', () => {
    it('renders mobile drawer when mobileOpen is true and closes on backdrop click', () => {
      const handleMobileClose = vi.fn();
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={true} onMobileClose={handleMobileClose} />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('mobile-sidebar-drawer')).toBeInTheDocument();

      const backdrop = screen.getByTestId('mobile-drawer-backdrop');
      fireEvent.click(backdrop);
      expect(handleMobileClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('8. Navbar and sidebar consistency', () => {
    it('makes Tier 2 navbar contain the same approved sections and removes + Add Case CTA', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <ConvertibleNav
              position="top"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const tier2 = screen.getByTestId('tier2-nav-container');
      expect(tier2).toBeInTheDocument();

      // Section groups in navbar
      expect(screen.getByText(/^home$/i)).toBeInTheDocument();
      expect(screen.getByText(/orders & cases/i)).toBeInTheDocument();
      expect(screen.getByText(/operations & reports/i)).toBeInTheDocument();
      expect(screen.getByText(/directory & practice/i)).toBeInTheDocument();
      expect(screen.getByText(/preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/administration/i)).toBeInTheDocument();

      // Requirement 17: + Add Case CTA button is removed from second navbar
      expect(screen.queryByText(/\+ add case/i)).not.toBeInTheDocument();
    });

    it('renders logout button in Tier 1 top navbar near profile', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <ConvertibleNav
              position="top"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const navLogout = screen.getByTestId('navbar-logout-button');
      expect(navLogout).toBeInTheDocument();

      fireEvent.click(navLogout);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('9. Default open state', () => {
    it('keeps sidebar open by default in Layout', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="home" element={<div data-testid="page-content">Home Content</div>} />
              </Route>
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });
  });
});
