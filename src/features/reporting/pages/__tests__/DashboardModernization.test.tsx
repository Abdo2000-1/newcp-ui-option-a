import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AppProviders } from '@/app/providers';
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

describe('Dashboard UX Modernization (PR 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  it('contains zero strange mojibake symbols or broken characters', () => {
    const { container } = render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    const fullText = container.textContent || '';
    // Assert no Windows-1252 / UTF-8 mojibake patterns exist
    expect(fullText).not.toContain('ÔÇó');
    expect(fullText).not.toContain('Ô');
    expect(fullText).not.toContain('\uFFFD');
  });

  it('renders a simplified visual hierarchy with clean studio tabs and metric cards', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    // Header & Brand subtitle
    expect(screen.getByText(/command center/i)).toBeInTheDocument();
    expect(screen.getByText(/3D Diagnostix Dental Intelligence/i)).toBeInTheDocument();

    // Studio tabs
    const analyticsTab = screen.getByRole('button', { name: /power bi analytics/i });
    const queueTab = screen.getByRole('button', { name: /production queue/i });
    expect(analyticsTab).toBeInTheDocument();
    expect(queueTab).toBeInTheDocument();

    // Core KPIs
    expect(screen.getByText(/target attainment/i)).toBeInTheDocument();
    expect(screen.getByText(/co-dx plans/i)).toBeInTheDocument();
    expect(screen.getByText(/turnaround time/i)).toBeInTheDocument();
  });

  it('supports toggling between Area and Bar charts seamlessly', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    const areaBtn = screen.getByRole('button', { name: /smooth area/i });
    const barBtn = screen.getByRole('button', { name: /target bars/i });
    expect(areaBtn).toBeInTheDocument();
    expect(barBtn).toBeInTheDocument();

    fireEvent.click(barBtn);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();

    fireEvent.click(areaBtn);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('preserves empty state when orders list is cleared in production queue view', () => {
    (store as unknown as { orders: Order[]; notify: () => void }).orders = [];
    (store as unknown as { notify: () => void }).notify();

    render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    // Switch to queue
    const queueTab = screen.getByRole('button', { name: /production queue/i });
    fireEvent.click(queueTab);

    expect(screen.getByText(/no intake orders available/i)).toBeInTheDocument();
  });

  it('supports quarter filter slicers and updates attainments without error', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Dashboard />
        </AppProviders>
      </MemoryRouter>
    );

    const q1Btn = screen.getByRole('button', { name: /^Q1$/i });
    fireEvent.click(q1Btn);

    // Attainment for Q1 is rendered
    expect(screen.getByText(/Q1 Target Attainment/i)).toBeInTheDocument();

    const q3Btn = screen.getByRole('button', { name: /^Q3$/i });
    fireEvent.click(q3Btn);
    expect(screen.getByText(/Q3 Target Attainment/i)).toBeInTheDocument();
  });
});
