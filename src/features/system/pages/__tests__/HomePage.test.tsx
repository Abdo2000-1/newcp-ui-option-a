import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { Layout } from '@/app/shell/Layout';
import { Sidebar } from '@/app/shell/Sidebar';
import { ConvertibleNav } from '@/app/shell/ConvertibleNav';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UIUX-HOME-001: Home Page & Landing Route Acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Home renders correctly', () => {
    it('renders calm, welcoming header with 3D Diagnostix company logo and brand text', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <HomePage />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('home-page')).toBeInTheDocument();

      // Contains 3D Diagnostix company logo
      const logo = screen.getByAltText(/3D Diagnostix Logo/i);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', expect.stringContaining('logo-3ddx-full.png'));

      // Calming welcome heading & brand gateway title
      expect(screen.getByText(/3D Diagnostix Clinical Portal/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /Welcome/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Access verified clinical case pipelines, digital surgical prescriptions, and laboratory workflows/i)
      ).toBeInTheDocument();
    });

    it('renders all approved workspace action tiles without invented business metrics or workflows', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <HomePage />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Approved Application Workspaces')).toBeInTheDocument();
      expect(screen.getByText('Active Case Flow')).toBeInTheDocument();
      expect(screen.getByText('Add New Case')).toBeInTheDocument();
      expect(screen.getByText('Order Details')).toBeInTheDocument();
      expect(screen.getByText('Quarterly Targets')).toBeInTheDocument();
      expect(screen.getByText('3D Model Production')).toBeInTheDocument();
      expect(screen.getByText('Operator Profile & Preferences')).toBeInTheDocument();
    });

    it('navigates to approved workspace routes when action tiles are clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <HomePage />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Navigate to Active Case Flow/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/flow');

      fireEvent.click(screen.getByRole('button', { name: /Navigate to Add New Case/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/add-case');

      fireEvent.click(screen.getByRole('button', { name: /Navigate to Order Details/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/order-details?id=504901');
    });
  });

  describe('Sidebar is open by default', () => {
    it('initializes Layout with open/expanded sidebar (sidebarCollapsed = false)', () => {
      localStorage.setItem('3ddx-cp-nav-position', 'left');

      const { container } = render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <Layout />
          </AppProviders>
        </MemoryRouter>
      );

      // In left sidebar mode, the collapse toggle button shows "Collapse sidebar", proving it is open by default
      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(collapseButton).toBeInTheDocument();

      // Nav link labels are visible in expanded state
      expect(screen.getAllByText(/^home$/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/^orders$/i)).toBeInTheDocument();
    });
  });

  describe('Dashboard is not reachable through application navigation', () => {
    it('does not contain /dashboard link or Dashboard item in Sidebar navigation', () => {
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

      // Dashboard item is completely absent from Sidebar
      expect(screen.queryByText(/^dashboard$/i)).not.toBeInTheDocument();

      // Sidebar brand logo links to /home, not /dashboard
      const homeLink = screen.getByTitle('3DDX Home');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/home');
      expect(screen.queryByTitle(/dashboard/i)).not.toBeInTheDocument();
    });

    it('does not contain /dashboard link in ConvertibleNav top or sidebar modes', () => {
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

      expect(screen.queryByText(/^dashboard$/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/^home$/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders 404 NotFound view when accessing /dashboard directly via route access', async () => {
            localStorage.setItem('3ddx-auth', 'true');
      localStorage.setItem('newcp_iam_session_v098', JSON.stringify({
        userId: 'usr-home-001',
        email: 'doctor@3ddx.com',
        fullName: 'Dr. Test User',
        activeTenant: { id: 1, label: '3ddx.com' },
        tenantId: 1,
        family: 'DOCTOR',
        roles: ['tenant_user'],
        capabilities: ['orders.view'],
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        tenantSwitchingEnabled: false,
        issuedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      }));

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <AppRouter />
          </AppProviders>
        </MemoryRouter>
      );

      // Since /dashboard route was completely removed, it falls back to 404 NotFoundPage
      expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText(/Clinical Route Not Found/i)).toBeInTheDocument();
    });
  });

  describe('Authenticated users enter /home & unauthorized users are not redirected incorrectly', () => {
    it('redirects authenticated users entering root / directly to /home', async () => {
            localStorage.setItem('3ddx-auth', 'true');
      localStorage.setItem('newcp_iam_session_v098', JSON.stringify({
        userId: 'usr-home-001',
        email: 'doctor@3ddx.com',
        fullName: 'Dr. Test User',
        activeTenant: { id: 1, label: '3ddx.com' },
        tenantId: 1,
        family: 'DOCTOR',
        roles: ['tenant_user'],
        capabilities: ['orders.view'],
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        tenantSwitchingEnabled: false,
        issuedAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      }));

      render(
        <MemoryRouter initialEntries={['/']}>
          <AppProviders>
            <AppRouter />
          </AppProviders>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('home-page')).toBeInTheDocument();
    });

    it('redirects unauthenticated users attempting to access /home to /login', async () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <AppProviders>
            <AppRouter />
          </AppProviders>
        </MemoryRouter>
      );

      // Unauthenticated users are sent to login
      expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('keeps unauthenticated users on /login without incorrect redirect loops', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AppProviders>
            <AppRouter />
          </AppProviders>
        </MemoryRouter>
      );

      expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    });
  });
});
