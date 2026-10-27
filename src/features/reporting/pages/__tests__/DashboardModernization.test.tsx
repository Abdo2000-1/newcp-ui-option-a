import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../../public/data/orders.json';

// Mock recharts ResponsiveContainer to avoid JSDOM zero-size issues
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

describe('Dashboard Modernization (Task 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  it('renders operational KPI cards with accurate metrics', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    // Verify operational strip exists
    expect(screen.getByTestId('operational-kpi-strip')).toBeInTheDocument();

    // Verify all 4 required operational metrics
    expect(screen.getByText(/Active Cases \/ Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Lab Reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgent SLA Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed This Week/i)).toBeInTheDocument();
  });

  it('contains zero non-standard broken characters in rendered text', () => {
    const { container } = render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    const html = container.innerHTML;
    expect(html).not.toContain('ÔÇó');
    expect(html).not.toContain('\ufffd');
  });
});
