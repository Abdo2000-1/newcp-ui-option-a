import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { AppProviders } from '@/app/providers';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Form Controls & Mock Auth Boundaries (UIUX-REQ-005)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Password Visibility Toggle', () => {
    it('defaults to hidden password input with accessible "Show password" label', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('••••••••••••');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByRole('button', { name: /show password/i });
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');
    });

    it('toggles password visibility to visible on click with "Hide password" label', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('••••••••••••');
      const toggleBtn = screen.getByRole('button', { name: /show password/i });

      // Click to reveal password
      fireEvent.click(toggleBtn);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });

    it('toggles password visibility back to hidden on second click', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('••••••••••••');
      const toggleBtn = screen.getByRole('button', { name: /show password/i });

      // Reveal
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Hide again
      const hideBtn = screen.getByRole('button', { name: /hide password/i });
      fireEvent.click(hideBtn);

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });
  });

  describe('Quick Role Preset Boundaries', () => {
    it('switches to Treating Clinician preset with associated email on click', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const clinicianBtn = screen.getByRole('button', { name: /treating clinician/i });
      fireEvent.click(clinicianBtn);

      const emailInput = screen.getByPlaceholderText('name@3ddx.com');
      expect(emailInput).toHaveValue('dr.vance@smilecenter.com');
    });

    it('switches back to Lab Director preset with director email on click', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const clinicianBtn = screen.getByRole('button', { name: /treating clinician/i });
      fireEvent.click(clinicianBtn);

      const directorBtn = screen.getByRole('button', { name: /lab director/i });
      fireEvent.click(directorBtn);

      const emailInput = screen.getByPlaceholderText('name@3ddx.com');
      expect(emailInput).toHaveValue('jessica.ruiz@3ddx.com');
    });
  });

  describe('Forgot Password Modal (MOCK / NOT_INTEGRATED)', () => {
    it('opens modal on "Forgot password?" click and renders mock boundary notice', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const forgotBtn = screen.getByRole('button', { name: /forgot password\?/i });
      fireEvent.click(forgotBtn);

      // Verify modal dialog and mock simulation alert
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText(/mock simulation:/i)).toBeInTheDocument();
    });

    it('closes modal when Cancel button is clicked', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal when Close icon button is clicked', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const closeIconBtn = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeIconBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('rejects empty email submission with an accessible validation error', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));

      // Clear the pre-filled email
      const modalEmailInput = screen.getByLabelText(/forgot password email input/i);
      fireEvent.change(modalEmailInput, { target: { value: '' } });

      const submitBtn = screen.getByRole('button', { name: /send reset link \(mock\)/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
    });

    it('rejects malformed email submission with an accessible validation error', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));

      const modalEmailInput = screen.getByLabelText(/forgot password email input/i);
      fireEvent.change(modalEmailInput, { target: { value: 'invalid-email-address' } });

      const submitBtn = screen.getByRole('button', { name: /send reset link \(mock\)/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('accepts valid email and displays mock success state without dispatching real network calls', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));

      const modalEmailInput = screen.getByLabelText(/forgot password email input/i);
      fireEvent.change(modalEmailInput, { target: { value: 'clinician@smilecenter.com' } });

      const submitBtn = screen.getByRole('button', { name: /send reset link \(mock\)/i });
      fireEvent.click(submitBtn);

      // Verify mock success state
      expect(await screen.findByText(/demo recovery token generated/i, {}, { timeout: 3000 })).toBeInTheDocument();
      expect(screen.getByText(/no real email or external request was dispatched/i)).toBeInTheDocument();

      // Click Done to close
      const doneBtn = screen.getByRole('button', { name: /done/i });
      fireEvent.click(doneBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission & Safe Mock Authentication', () => {
    it('shows authenticating status on submit and navigates safely without real token generation', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /sign in to cp pro max/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/authenticating clinician\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/flow');
      }, { timeout: 3000 });

      expect(localStorage.getItem('3ddx-auth')).toBe('true');
      expect(localStorage.getItem('3ddx-user-role')).toBe('director');
    });
  });
});
