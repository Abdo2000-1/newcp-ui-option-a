import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import HomePage from '../HomePage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe('HomePage (UX-002: Minimal Calm Landing Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders welcoming header, branding, and workspace section', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText(/New CP Clinical Gateway/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Welcome/i })).toBeInTheDocument();
    expect(screen.getByText(/Approved Application Workspaces/i)).toBeInTheDocument();
  });

  it('renders all approved workspace entry points', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Active Case Flow')).toBeInTheDocument();
    expect(screen.getByText('Add New Case')).toBeInTheDocument();
    expect(screen.getByText('Quarterly Targets')).toBeInTheDocument();
    expect(screen.getByText('3D Model Production')).toBeInTheDocument();
    expect(screen.getByText('Staff Workload Targets')).toBeInTheDocument();
    expect(screen.getByText('Operator Profile & Preferences')).toBeInTheDocument();
  });

  it('navigates to corresponding route when a tile is clicked', () => {
    renderWithProviders(<HomePage />);

    const flowTile = screen.getByRole('button', { name: /Navigate to Active Case Flow/i });
    fireEvent.click(flowTile);
    expect(mockNavigate).toHaveBeenCalledWith('/flow');

    const addCaseTile = screen.getByRole('button', { name: /Navigate to Add New Case/i });
    fireEvent.click(addCaseTile);
    expect(mockNavigate).toHaveBeenCalledWith('/add-case');
  });

  it('displays authenticated operator identity, role, and tenant when session is present', () => {
    const now = Date.now();
    const mockSession = {
      userId: 'usr-cs-001',
      email: 'cs.demo@3ddx.com',
      fullName: 'Sarah Jenkins',
      roles: ['cs'],
      family: 'cs',
      tenantId: 1,
      activeTenant: { tenantId: 1, name: '3DDX Clinical Solutions', slug: '3ddx' },
      accessStatus: 'AUTHORIZED',
      status: 'authenticated',
      issuedAt: now,
      lastActivityAt: now,
      expiresAt: now + 8 * 3600 * 1000,
    };
    localStorage.setItem('newcp_iam_session_v097', JSON.stringify(mockSession));

    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: /Welcome, Sarah Jenkins/i })).toBeInTheDocument();
    expect(screen.getByTestId('home-session-context')).toBeInTheDocument();
    expect(screen.getByText(/Role: CS/i)).toBeInTheDocument();
    expect(screen.getByText(/Tenant #1 \(3DDX\)/i)).toBeInTheDocument();
  });

  it('does NOT render fake business metrics, fake counters, or invented chart widgets', () => {
    renderWithProviders(<HomePage />);

    // Verify absence of fake metrics
    expect(screen.queryByText(/Total Revenue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Conversion Rate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Net Profit/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('fake-kpi-widget')).not.toBeInTheDocument();
  });
});
