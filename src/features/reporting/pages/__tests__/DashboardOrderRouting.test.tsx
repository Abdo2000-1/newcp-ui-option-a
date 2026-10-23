import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import OrderDetailsPage from '@/features/orders/pages/OrderDetailsPage';
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

function getSortedRecentOrders(): Order[] {
  return [...(ordersData as Order[])]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
}

describe('Dashboard-to-OrderDetails ID Match & Routing (UIUX-REQ-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  describe('Dashboard row navigation', () => {
    it('clicking one Dashboard row opens its matching order', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      // Switch to Production Queue tab to reveal the intake orders table
      const queueTab = screen.getByRole('button', { name: /production queue/i });
      fireEvent.click(queueTab);

      const recentOrders = getSortedRecentOrders();
      expect(recentOrders.length).toBeGreaterThan(1);
      const firstOrder = recentOrders[0];

      // Find the row containing firstOrder's orderNumber
      const orderNumberCell = screen.getByText(firstOrder.orderNumber);
      const tableRow = orderNumberCell.closest('tr');
      expect(tableRow).not.toBeNull();

      fireEvent.click(tableRow!);

      expect(mockNavigate).toHaveBeenCalledWith(`/order-details?id=${firstOrder.id}`);
    });

    it('clicking a different row opens a different matching order', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      // Switch to Production Queue tab to reveal the intake orders table
      const queueTab = screen.getByRole('button', { name: /production queue/i });
      fireEvent.click(queueTab);

      const recentOrders = getSortedRecentOrders();
      expect(recentOrders.length).toBeGreaterThan(1);
      const secondOrder = recentOrders[1];

      // Find the row containing secondOrder's orderNumber
      const orderNumberCell = screen.getByText(secondOrder.orderNumber);
      const tableRow = orderNumberCell.closest('tr');
      expect(tableRow).not.toBeNull();

      fireEvent.click(tableRow!);

      expect(mockNavigate).toHaveBeenCalledWith(`/order-details?id=${secondOrder.id}`);
    });

    it('the correct identifier is passed through the route', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      // Switch to Production Queue tab to reveal the intake orders table
      const queueTab = screen.getByRole('button', { name: /production queue/i });
      fireEvent.click(queueTab);

      const recentOrders = getSortedRecentOrders();
      const targetOrder = recentOrders[2] || recentOrders[0];

      const orderNumberCell = screen.getByText(targetOrder.orderNumber);
      const tableRow = orderNumberCell.closest('tr');
      fireEvent.click(tableRow!);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      const navigatedRoute = mockNavigate.mock.calls[0][0];
      expect(navigatedRoute).toBe(`/order-details?id=${targetOrder.id}`);
    });
  });

  describe('OrderDetailsPage ID resolution', () => {
    it('resolves and renders the first order details accurately', () => {
      const orders = store.getOrders();
      const firstOrder = orders[0];

      render(
        <MemoryRouter initialEntries={[`/order-details?id=${firstOrder.id}`]}>
          <AppProviders>
            <OrderDetailsPage />
          </AppProviders>
        </MemoryRouter>
      );

      // Verify no not-found state
      expect(screen.queryByText('Order Not Found')).not.toBeInTheDocument();
      // Should show the patient or order number
      expect(screen.getAllByText(new RegExp(firstOrder.patientName, 'i')).length).toBeGreaterThan(0);
    });

    it('resolves and renders a different order details accurately', () => {
      const orders = store.getOrders();
      const secondOrder = orders[1];

      render(
        <MemoryRouter initialEntries={[`/order-details?id=${secondOrder.id}`]}>
          <AppProviders>
            <OrderDetailsPage />
          </AppProviders>
        </MemoryRouter>
      );

      // Verify no not-found state
      expect(screen.queryByText('Order Not Found')).not.toBeInTheDocument();
      // Should show second order's patient name
      expect(screen.getAllByText(new RegExp(secondOrder.patientName, 'i')).length).toBeGreaterThan(0);
    });

    it('an unknown identifier displays a clear not-found state', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?id=non-existent-order-999']}>
          <AppProviders>
            <OrderDetailsPage />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Order Not Found')).toBeInTheDocument();
      expect(
        screen.getByText(/No clinical order or case could be found matching identifier "non-existent-order-999"./i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to dashboard/i })).toBeInTheDocument();
    });

    it('no default case is displayed for an unknown identifier', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?id=invalid-id-xyz']}>
          <AppProviders>
            <OrderDetailsPage />
          </AppProviders>
        </MemoryRouter>
      );

      // Must not fall back to Case #504901
      expect(screen.queryByText(/Case #504901/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/PRIMARY SERVICE HOOK/i)).not.toBeInTheDocument();
      expect(screen.getByText('Order Not Found')).toBeInTheDocument();
    });

    it('uses explicit neutral values when clinical fields are missing and never invents fictional entities', () => {
      const minimalOrder = store.createOrder({
        orderNumber: 'ORD-MINIMAL-001',
        patientName: '',
        doctorName: '',
        clinicName: '',
        scanCenterName: '',
        billTo: '',
        amount: undefined,
        restoration: '',
      });

      render(
        <MemoryRouter initialEntries={[`/order-details?id=${minimalOrder.id}`]}>
          <AppProviders>
            <OrderDetailsPage />
          </AppProviders>
        </MemoryRouter>
      );

      // Must not invent fictional doctor, clinic, or diagnostic provider
      expect(screen.queryByText(/Dr\. Allison Park/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/3DDX Boston Radiology Hub/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/California Diagnostics/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Patient Record/i)).not.toBeInTheDocument();

      // Must not invent clinical notes, shipping instructions, or historical logs
      expect(screen.queryByText(/Immediate implant placement/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/CBCT DICOM series aligned/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Standard courier delivery/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/office working hours/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/shrouk/i)).not.toBeInTheDocument();

      // Must not invent fictional service semantics or fees
      expect(screen.queryByText('General Service')).not.toBeInTheDocument();
      expect(screen.queryByText('Standard')).not.toBeInTheDocument();
      expect(screen.queryByText('.00')).not.toBeInTheDocument();
      expect(screen.queryByText('.00 USD')).not.toBeInTheDocument();
      expect(screen.queryByText('.00')).not.toBeInTheDocument();

      // Must render explicit neutral empty state for historical notes
      expect(screen.getByText('No historical notes recorded for this order.')).toBeInTheDocument();

      // Must display neutral registration type and Sc. Special Request defaults
      expect(screen.getByText('(Not available / Unselected)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Not available')).toBeInTheDocument();

      // In Sub Orders tab, CS task reflects unassigned status
      const subOrdersTab = screen.getByRole('button', { name: /sub-orders/i });
      fireEvent.click(subOrdersTab);
      expect(screen.getByText(/CS Task: Unassigned/i)).toBeInTheDocument();

      // Must display explicit neutral fallbacks
      expect(screen.getAllByText('Not available').length).toBeGreaterThan(0);
    });
  });
});
