import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from '@/app/router';
import { AppProviders } from '@/app/providers';

// Mock matchMedia for responsive layouts in jsdom
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

function renderWithRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </MemoryRouter>
  );
}

describe('UIUX-REQ-021: Dedicated Frontend 404 & 503 Maintenance Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('3ddx-auth', 'true');
  });

  describe('404 Not Found Page', () => {
    it('renders the dedicated 404 view when navigating to an unknown route', async () => {
      renderWithRoute('/some/non-existent/clinical-path-999');

      expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText(/Clinical Route Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/The requested clinical module, case view, or page path does not exist/i)).toBeInTheDocument();
    });

    it('provides accessible Return to Dashboard and Go Back navigation actions', async () => {
      renderWithRoute('/missing-page-xyz');

      await screen.findByTestId('not-found-page');

      const dashboardBtn = screen.getByRole('button', { name: /return to dashboard/i });
      expect(dashboardBtn).toBeInTheDocument();

      const backBtn = screen.getByRole('button', { name: /go back/i });
      expect(backBtn).toBeInTheDocument();

      // Click dashboard button to navigate
      fireEvent.click(dashboardBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument();
      }, { timeout: 15000 });
      const matches = await screen.findAllByText(/Dashboard/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('preserves the application shell container during 404 view', async () => {
      renderWithRoute('/unknown-subsystem');

      await screen.findByTestId('not-found-page');
      expect(screen.getByTestId('shell-footer')).toBeInTheDocument();
    });
  });

  describe('503 Service Maintenance Page', () => {
    it('renders the dedicated 503 maintenance view at /503', async () => {
      renderWithRoute('/503');

      expect(await screen.findByTestId('maintenance-503-page')).toBeInTheDocument();
      expect(screen.getByText('503')).toBeInTheDocument();
      expect(screen.getByText(/Scheduled Service Maintenance/i)).toBeInTheDocument();
      expect(screen.getByText(/temporarily undergoing scheduled maintenance/i)).toBeInTheDocument();
      expect(screen.getByText(/\[PROTOTYPE MOCK \/ NOT_INTEGRATED\] Dedicated maintenance view demonstration/i)).toBeInTheDocument();
    });

    it('renders the maintenance view at alias /maintenance', async () => {
      renderWithRoute('/maintenance');

      expect(await screen.findByTestId('maintenance-503-page')).toBeInTheDocument();
      expect(screen.getByText('503')).toBeInTheDocument();
    });

    it('provides functional Retry Connection and Go to Dashboard actions', async () => {
      renderWithRoute('/503');

      await screen.findByTestId('maintenance-503-page');

      const retryBtn = screen.getByRole('button', { name: /retry connection/i });
      expect(retryBtn).toBeInTheDocument();

      const dashboardBtn = screen.getByRole('button', { name: /go to dashboard/i });
      expect(dashboardBtn).toBeInTheDocument();

      fireEvent.click(dashboardBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('maintenance-503-page')).not.toBeInTheDocument();
      });
      const matches = await screen.findAllByText(/Dashboard/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
