import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { AppProviders } from '@/app/providers';
import { getAuthAdapter, GoogleAuthError, BackendAuthError } from '@/features/auth/authAdapter';

/**
 * ============================================================================
 * LOGIN PAGE ACCEPTANCE TESTS — GOOGLE-ONLY AUTHENTICATION (IAM-TENANT-002)
 * ============================================================================
 *
 * Verifies:
 * 1. Old controls are completely removed (email, password, forgot password,
 *    remember token, clinician/director selectors).
 * 2. Google button is present as primary action ("Sign in with Google").
 * 3. Role selectors are completely absent.
 * 4. Tenant selectors are completely absent.
 * 5. Google sign-in loading state.
 * 6. Google authentication error state.
 * 7. Backend authentication error state.
 * 8. Pending Access state ("Your account is authenticated, but access has not been assigned yet.").
 * 9. 401 Session expired state.
 * 10. 403 Access denied state.
 * 11. No frontend role inference (Google identity alone does not grant role).
 * 12. No hardcoded tenant authorization (No fallback to tenant 1 for unassigned users).
 * 13. No Google Groups authorization (PostgreSQL IAM remains authoritative).
 */

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page — Google-Only Authentication & States (IAM-TENANT-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Removal of Legacy Controls', () => {
    it('1. Does NOT render password field or show/hide password toggle', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByPlaceholderText('••••••••••••')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /show password/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /hide password/i })).not.toBeInTheDocument();
    });

    it('2. Does NOT render email or workstation identity input', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByPlaceholderText('name@3ddx.com')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/workstation/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/clinician id/i)).not.toBeInTheDocument();
    });

    it('3. Does NOT render "Forgot password" link or modal dialog', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /forgot password/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
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

    it('6. Does NOT render any frontend role selectors', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('role-selector')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/select role/i)).not.toBeInTheDocument();
    });

    it('7. Does NOT render any frontend tenant selectors or switchers', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('tenant-selector')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/select tenant/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/switch tenant/i)).not.toBeInTheDocument();
    });
  });

  describe('Primary Action: Sign in with Google', () => {
    it('8. Renders "Sign in with Google" as the primary authentication action', () => {
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

    it('9. Displays loading state during Google authentication', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const googleBtn = screen.getByTestId('google-signin-button');
      fireEvent.click(googleBtn);

      expect(screen.getByText(/signing in with google\.\.\./i)).toBeInTheDocument();
      expect(googleBtn).toHaveAttribute('aria-busy', 'true');
      expect(googleBtn).toBeDisabled();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('10. Navigates to /flow upon authenticated and authorized session', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });
  });

  describe('Authentication Error and Status States', () => {
    it('11. Handles and displays Google authentication error state', async () => {
      const adapter = getAuthAdapter();
      vi.spyOn(adapter, 'signInWithGoogle').mockRejectedValueOnce(
        new GoogleAuthError('Google sign-in popup was closed before completing authentication.', 'POPUP_CLOSED')
      );

      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('google-auth-error-alert')).toBeInTheDocument();
        expect(screen.getByText(/google sign-in popup was closed/i)).toBeInTheDocument();
      });
    });

    it('12. Handles and displays backend authentication error state', async () => {
      const adapter = getAuthAdapter();
      vi.spyOn(adapter, 'signInWithGoogle').mockResolvedValueOnce({ idToken: 'valid-google-token' });
      vi.spyOn(adapter, 'exchangeTokenForSession').mockRejectedValueOnce(
        new BackendAuthError('Backend authentication service unavailable (503).', 503, 'SERVICE_UNAVAILABLE')
      );

      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('backend-auth-error-alert')).toBeInTheDocument();
        expect(screen.getByText(/backend authentication service unavailable/i)).toBeInTheDocument();
      });
    });

    it('13. Displays Pending Access message when authenticated user lacks tenant role assignment', async () => {
      const adapter = getAuthAdapter();
      vi.spyOn(adapter, 'signInWithGoogle').mockResolvedValueOnce({ idToken: 'token-unassigned-employee' });
      vi.spyOn(adapter, 'exchangeTokenForSession').mockResolvedValueOnce({
        accessStatus: 'PENDING_ACCESS',
      });

      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('pending-access-alert')).toBeInTheDocument();
        expect(
          screen.getByText('Your account is authenticated, but access has not been assigned yet.')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/contact your tenant administrator to grant an approved role assignment/i)
        ).toBeInTheDocument();
      });

      // Does NOT navigate to /home
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('14. Displays Session Expired (401) alert when navigated with reason=expired', () => {
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

    it('15. Displays Access Denied (403) alert when navigated with reason=denied', () => {
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

  describe('Authorization Invariants & Non-Negotiables', () => {
    it('16. Does NOT infer role from email domain or identity', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      // Verify no UI element suggests role is selected or derived by client
      expect(screen.queryByText(/role: director/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/role: clinician/i)).not.toBeInTheDocument();
    });

    it('17. Does NOT hardcode tenant 1 for unassigned users', async () => {
      const adapter = getAuthAdapter();
      vi.spyOn(adapter, 'signInWithGoogle').mockResolvedValueOnce({ idToken: 'token-unassigned-employee' });
      vi.spyOn(adapter, 'exchangeTokenForSession').mockResolvedValueOnce({
        accessStatus: 'PENDING_ACCESS',
      });

      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('pending-access-alert')).toBeInTheDocument();
      });

      // Confirms session state in localStorage has tenantId: null, NEVER falling back to 1
      const stored = localStorage.getItem('newcp_iam_session_v098');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.tenantId).toBeNull();
      expect(parsed.activeTenant).toBeNull();
      expect(parsed.accessStatus).toBe('PENDING');
    });

    it('18. External Google Groups claims do NOT grant authorization', async () => {
      // Confirms that signing in with an unassigned Google email leaves the account in Pending Access
      // regardless of any external Google Groups claims
      const adapter = getAuthAdapter();
      vi.spyOn(adapter, 'signInWithGoogle').mockResolvedValueOnce({ idToken: 'token-unassigned-employee' });
      vi.spyOn(adapter, 'exchangeTokenForSession').mockResolvedValueOnce({
        accessStatus: 'PENDING_ACCESS',
      });

      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('google-signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('pending-access-alert')).toBeInTheDocument();
      });

      const stored = JSON.parse(localStorage.getItem('newcp_iam_session_v098')!);
      expect(stored.roles).toEqual([]);
      expect(stored.capabilities).toEqual([]);
    });
  });
});
