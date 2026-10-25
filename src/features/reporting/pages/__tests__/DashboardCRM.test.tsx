import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../../public/data/orders.json';

// Mock recharts ResponsiveContainer to avoid 0x0 container size issues in JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard CRM Modernization (UIUX-REQ-006)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  describe('CRM Dashboard Modernization & Views', () => {
    it('renders the modernized CRM dashboard header, KPI stats, and studio switcher', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      // Verify CRM Header
      expect(screen.getByText(/command center/i)).toBeInTheDocument();

      // Verify Studio Switcher tabs
      expect(screen.getByRole('button', { name: /power bi analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /production queue/i })).toBeInTheDocument();

      // Verify Power BI KPI metrics cards exist
      expect(screen.getByText(/target attainment/i)).toBeInTheDocument();
      expect(screen.getAllByText(/surgical guides/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/co-dx plans/i)).toBeInTheDocument();
      expect(screen.getByText(/turnaround time/i)).toBeInTheDocument();
    });

    it('switches between Power BI Analytics and Production Queue seamlessly', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      // Default tab is Power BI Analytics: regional hubs attainment is visible
      expect(screen.getByText(/regional diagnostic hubs attainment/i)).toBeInTheDocument();

      // Click Production Queue tab
      const queueTab = screen.getByRole('button', { name: /production queue/i });
      fireEvent.click(queueTab);

      // Production Queue should now display the Live Intake Orders table and PACS activity
      expect(screen.getByText(/live intake orders/i)).toBeInTheDocument();
      expect(screen.getByText(/pacs audit activity/i)).toBeInTheDocument();

      // Switch back to Power BI Analytics
      const analyticsTab = screen.getByRole('button', { name: /power bi analytics/i });
      fireEvent.click(analyticsTab);
      expect(screen.getByText(/regional diagnostic hubs attainment/i)).toBeInTheDocument();
    });

    it('navigates to order details when clicking an urgent ticker item', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      // Urgent ticker displays urgent items if any exist
      const urgentOrders = (ordersData as Order[]).filter((o) => o.priority === 'Urgent');
      if (urgentOrders.length > 0) {
        const urgentItem = screen.getByText(urgentOrders[0].orderNumber);
        fireEvent.click(urgentItem);
        expect(mockNavigate).toHaveBeenCalledWith(`/order-details?id=${urgentOrders[0].id}`);
      }
    });

    it('handles empty orders state gracefully', () => {
      // Set store to empty
      (store as unknown as { orders: Order[]; notify: () => void }).orders = [];
      (store as unknown as { notify: () => void }).notify();

      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      const queueTab = screen.getByRole('button', { name: /production queue/i });
      fireEvent.click(queueTab);

      expect(screen.getByText(/no intake orders available/i)).toBeInTheDocument();
    });
  });

  describe('Default Route Auth Redirect', () => {
    it('redirects root route / to /login landing page', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/']}>
            <AppProviders>
              <AppRouter />
            </AppProviders>
          </MemoryRouter>
        );
      });

      // After navigating to '/', it redirects to '/login' and renders Login page
      expect(await screen.findByRole('button', { name: /sign in/i }, { timeout: 5000 })).toBeInTheDocument();
    });

    it('allows direct access to /login without forced redirect to dashboard', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <AppProviders>
              <AppRouter />
            </AppProviders>
          </MemoryRouter>
        );
      });

      // On /login, login form / button is rendered
      expect(await screen.findByRole('button', { name: /sign in/i }, { timeout: 5000 })).toBeInTheDocument();
    });
  });
});
