import React from 'react';
import { describe, it, expect, vi } from 'vitest';
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
});
