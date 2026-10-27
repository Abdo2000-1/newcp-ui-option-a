import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../Login';
import { AppProviders } from '@/app/providers';

/**
 * ============================================================================
 * LOGIN PAGE ACCEPTANCE TESTS — GOOGLE-ONLY AUTHENTICATION (IAM-TENANT-002)
 * ============================================================================
 *
 * Verifies:
 * 1. Removed controls: email input, password field, forgot password, remember
 *    workstation token, and director/clinician role selectors.
 * 2. Primary action: "Sign in with Google".
 * 3. Loading state during Google sign-in.
 * 4. Google authentication failure state.
 * 5. Authenticated and authorized state (navigates to /flow).
 * 6. Authenticated but Pending Access state ("Your account is authenticated, but access has not been assigned yet.").
 * 7. Session expired / 401 state.
 * 8. Access denied / 403 state.
 * 9. No client-side tenant or role inference.
 */

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page — Google-Only Authentication (IAM-TENANT-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Removal of Legacy Authentication Controls', () => {
    it('1. Does NOT render password input or visibility toggle', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByPlaceholderText('••••••••••••')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/show password/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/hide password/i)).not.toBeInTheDocument();
    });

    it('2. Does NOT render email/workstation identity input field', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByPlaceholderText('name@3ddx.com')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/workstation identity/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/3ddx clinician id/i)).not.toBeInTheDocument();
    });

    it('3. Does NOT render "Forgot password" action or recovery dialog', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /forgot password/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/reset password/i)).not.toBeInTheDocument();
    });

    it('4. Does NOT render "Remember workstation token" checkbox', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByLabelText(/remember workstation token/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/remember workstation token/i)).not.toBeInTheDocument();
    });

    it('5. Does NOT render Lab Director or Treating Clinician role selector buttons', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /lab director/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /treating clinician/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Jessica Ruiz')).not.toBeInTheDocument();
      expect(screen.queryByText('Dr. Marcus Vance')).not.toBeInTheDocument();
    });
  });

  describe('Primary Action: Sign in with Google', () => {
    it('6. Renders "Sign in with Google" as the primary action', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const googleBtn = screen.getByTestId('google-signin-button');
      expect(googleBtn).toBeInTheDocument();
      expect(googleBtn).toHaveTextContent(/sign in with google/i);
    });

    it('7. Displays loading state during Google authentication', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const googleBtn = screen.getByTestId('google-signin-button');
      fireEvent.click(googleBtn);

      // Immediately shows loading indicator
      expect(screen.getByText(/signing in with google\.\.\./i)).toBeInTheDocument();
      expect(googleBtn).toHaveAttribute('aria-busy', 'true');
      expect(googleBtn).toBeDisabled();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/flow');
      });
    });

    it('8. Navigates to /flow upon successful authorized authentication', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/flow');
      });
    });
  });

  describe('Error and Status State Handling', () => {
    it('9. Handles Google authentication failure state cleanly', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      // Open demo options and trigger simulated failure
      fireEvent.click(screen.getByText(/demo verification options/i));
      const failBtn = screen.getByText(/simulate auth failure/i);
      fireEvent.click(failBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-alert')).toBeInTheDocument();
        expect(screen.getByText(/the authentication provider rejected the identity token/i)).toBeInTheDocument();
      });
    });

    it('10. Displays Pending Access message when authenticated user has no approved tenant assignment', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      // Open demo options and select unassigned employee
      fireEvent.click(screen.getByText(/demo verification options/i));
      const unassignedBtn = screen.getByText(/unassigned internal employee/i);
      fireEvent.click(unassignedBtn);

      await waitFor(() => {
        expect(screen.getByTestId('pending-access-alert')).toBeInTheDocument();
        expect(screen.getByText('Your account is authenticated, but access has not been assigned yet.')).toBeInTheDocument();
        expect(screen.getByText(/contact your tenant administrator to grant an approved role assignment/i)).toBeInTheDocument();
      });

      // Does NOT navigate to /flow with active tenant
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('11. Displays Session Expired (401) alert when navigated with reason=expired', () => {
      render(
        <MemoryRouter initialEntries={['/login?reason=expired']}>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('session-expired-alert')).toBeInTheDocument();
      expect(screen.getByText(/your session has expired\. please sign in again/i)).toBeInTheDocument();
    });

    it('12. Displays Access Denied (403) alert when navigated with reason=denied', () => {
      render(
        <MemoryRouter initialEntries={['/login?reason=denied']}>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('access-denied-alert')).toBeInTheDocument();
      expect(screen.getByText(/access denied\. your account does not have permission/i)).toBeInTheDocument();
    });
  });
});
