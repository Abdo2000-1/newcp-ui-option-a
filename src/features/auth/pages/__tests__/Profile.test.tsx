import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Profile from '../Profile';
import { AppProviders } from '@/app/providers';
import type { UserSession } from '@/features/auth/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockBackendUserSession: UserSession = {
  userId: 'usr-backend-001',
  email: 'operator.live@3ddx.com',
  fullName: 'Jane Operator',
  tenantSlug: '3ddx.com',
  activeTenant: { id: 10, label: 'Northwest Dental Group' },
  tenantId: 10,
  family: 'OPS',
  roles: ['ops_senior', 'workflow_coordinator'],
  capabilities: [
    'orders.view',
    'services.models.edit',
    'workflow.transition',
    'reports.view_all',
  ],
  status: 'authenticated',
  accessStatus: 'AUTHORIZED',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

function renderProfile(session: UserSession | null = mockBackendUserSession) {
  if (session) {
    localStorage.setItem('newcp_iam_session_v098', JSON.stringify(session));
    localStorage.setItem('newcp_iam_session_v097', JSON.stringify(session));
  } else {
    localStorage.removeItem('newcp_iam_session_v098');
    localStorage.removeItem('newcp_iam_session_v097');
  }

  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <AppProviders>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Profile Page — Minimal Backend-Derived Presentation', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  describe('1. Backend-Derived Identity & Metadata', () => {
    it('displays the authenticated user name, email, avatar initials, and user ID from backend session', () => {
      renderProfile(mockBackendUserSession);

      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      expect(screen.getByTestId('profile-user-name')).toHaveTextContent('Jane Operator');
      expect(screen.getByTestId('profile-user-email')).toHaveTextContent('operator.live@3ddx.com');
      expect(screen.getByTestId('profile-user-id')).toHaveTextContent('usr-backend-001');
      expect(screen.getByTestId('profile-avatar-initials')).toHaveTextContent('JO');
      expect(screen.getByTestId('profile-access-status')).toHaveTextContent('AUTHORIZED');
    });

    it('displays assigned role codes returned by the backend', () => {
      renderProfile(mockBackendUserSession);

      expect(screen.getByTestId('role-tag-ops_senior')).toHaveTextContent('ops_senior');
      expect(screen.getByTestId('role-tag-workflow_coordinator')).toHaveTextContent('workflow_coordinator');
    });

    it('displays backend-returned capabilities and permissions', () => {
      renderProfile(mockBackendUserSession);

      expect(screen.getByTestId('capability-tag-orders.view')).toBeInTheDocument();
      expect(screen.getByTestId('capability-tag-services.models.edit')).toBeInTheDocument();
      expect(screen.getByTestId('capability-tag-workflow.transition')).toBeInTheDocument();
      expect(screen.getByTestId('capability-tag-reports.view_all')).toBeInTheDocument();
    });

    it('displays tenant information only when returned by the backend', () => {
      renderProfile(mockBackendUserSession);

      const tenantInfo = screen.getByTestId('profile-tenant-info');
      expect(tenantInfo).toHaveTextContent('Northwest Dental Group (ID #10)');
    });

    it('omits tenant section when backend session contains no active tenant', () => {
      const sessionWithoutTenant: UserSession = {
        ...mockBackendUserSession,
        activeTenant: null,
        tenantSlug: null,
        tenantId: null,
      };

      renderProfile(sessionWithoutTenant);

      expect(screen.queryByTestId('profile-tenant-info')).not.toBeInTheDocument();
    });
  });

  describe('2. Strict Non-Invention Policy', () => {
    it('does NOT render editable inputs or invented profile fields (phone, bio, license, specialty)', () => {
      renderProfile(mockBackendUserSession);

      expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/license/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/bio/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/specialty/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /update clinician info/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/MOCK AUTHENTICATION BOUNDARY/i)).not.toBeInTheDocument();
    });
  });

  describe('3. Sign Out Action', () => {
    it('provides functional sign out action that invokes logout and navigates to login', async () => {
      renderProfile(mockBackendUserSession);

      const logoutBtn = screen.getByTestId('profile-logout-button');
      fireEvent.click(logoutBtn);

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    });
  });
});
