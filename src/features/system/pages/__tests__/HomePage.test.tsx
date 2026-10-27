import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { AppProviders } from '@/app/providers';
import { AuthProvider } from '@/features/auth/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <AuthProvider>
        <AppProviders>
          <HomePage />
        </AppProviders>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Home Authenticated Landing Page (Task 1)', () => {
  it('renders home page container and welcome header', () => {
    renderHomePage();

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText(/New CP Clinical Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
  });

  it('renders all approved application workspace cards', () => {
    renderHomePage();

    expect(screen.getByText(/Active Case Flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Case/i)).toBeInTheDocument();
    expect(screen.getByText(/Quarterly Targets/i)).toBeInTheDocument();
    expect(screen.getByText(/3D Model Production/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff Workload Targets/i)).toBeInTheDocument();
    expect(screen.getByText(/Operator Profile & Preferences/i)).toBeInTheDocument();
  });

  it('navigates to the selected workspace when card is clicked', () => {
    renderHomePage();

    const flowCard = screen.getByText(/Active Case Flow/i);
    fireEvent.click(flowCard);

    expect(mockNavigate).toHaveBeenCalledWith('/flow');
  });
});
