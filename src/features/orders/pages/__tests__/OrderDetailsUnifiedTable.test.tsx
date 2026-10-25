import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetailsPage from '../OrderDetailsPage';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../../public/data/orders.json';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UIUX-REQ-015: Order Details Automation & Unified Table System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  describe('Unified DataTable Component', () => {
    interface TestItem {
      id: string;
      name: string;
      score: number;
    }

    const testColumns: Column<TestItem>[] = [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'score', header: 'Score', sortable: true, align: 'right' },
    ];

    const testData: TestItem[] = [
      { id: '1', name: 'Alpha', score: 95 },
      { id: '2', name: 'Beta', score: 80 },
      { id: '3', name: 'Gamma', score: 90 },
    ];

    it('renders column headers and table rows correctly', () => {
      render(
        <AppProviders>
          <DataTable<TestItem>
            columns={testColumns}
            data={testData}
            rowKey={(item) => item.id}
            title="Test Table"
            ariaLabel="Test Table"
          />
        </AppProviders>
      );

      expect(screen.getByText('Test Table')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
    });

    it('filters rows dynamically using the in-table search field', () => {
      render(
        <AppProviders>
          <DataTable<TestItem>
            columns={testColumns}
            data={testData}
            rowKey={(item) => item.id}
            searchable
            searchPlaceholder="Search items..."
          />
        </AppProviders>
      );

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Beta' } });

      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    });

    it('shows empty state when no search results match', () => {
      render(
        <AppProviders>
          <DataTable<TestItem>
            columns={testColumns}
            data={testData}
            rowKey={(item) => item.id}
            searchable
            searchPlaceholder="Search items..."
          />
        </AppProviders>
      );

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Non-existent item' } });

      expect(screen.getByText('No matching records found')).toBeInTheDocument();
    });
  });

  describe('OrderDetailsPage Integration', () => {
    it('renders the unified DataTable in Section B for historical notes', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      // Section B title and search field
      expect(screen.getByText('Internal Case Note (Old)')).toBeInTheDocument();
      expect(screen.getByText(/historical logs/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Filter notes by sender, recipient, or text...')
      ).toBeInTheDocument();

      // Historical notes headers
      expect(screen.getByRole('columnheader', { name: /^by$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^to$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^time sent$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^history$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^attach$/i })).toBeInTheDocument();
    });

    it('filters historical case notes with in-table search', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      const notesSearch = screen.getByPlaceholderText(
        'Filter notes by sender, recipient, or text...'
      );
      fireEvent.change(notesSearch, { target: { value: 'shrouk' } });

      expect(screen.getAllByText('shrouk').length).toBeGreaterThan(0);
    });

    it('applies smart team auto-routing when clicking quick action templates', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      // Click "DICOM Artifact" template
      const dicomTemplateBtn = screen.getByText(/DICOM Artifact/i);
      fireEvent.click(dicomTemplateBtn);

      // Check feedback toast and check that note input contains the template text
      expect(
        screen.getByText(/Auto-routed task to Scanning Techs \[RUSH PRIORITY\]/i)
      ).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/Type internal case instruction/i);
      expect((textarea as HTMLTextAreaElement).value).toContain('DICOM artifact detected');
    });

    it('copies case prescription summary to clipboard with one-click action', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      const copySummaryBtn = screen.getByRole('button', { name: /copy summary/i });
      fireEvent.click(copySummaryBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(
        screen.getByText('Case prescription summary copied to clipboard!')
      ).toBeInTheDocument();
    });

    it('renders Sub-orders Matrix Breakdown with unified table and toggle to card view', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      // Switch to Tab 3 (Sub-Orders Breakdown)
      const tab3Btn = screen.getByRole('button', { name: /Sub-Orders Matrix/i });
      fireEvent.click(tab3Btn);

      // Verify table view is active by default with unified DataTable
      expect(screen.getByRole('table', { name: /sub-orders matrix breakdown table/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^code$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /service \/ module/i })).toBeInTheDocument();

      // Switch to Card Matrix View
      const cardsBtn = screen.getByRole('button', { name: /cards/i });
      fireEvent.click(cardsBtn);

      // Verify card layout is displayed
      expect(screen.getByText('All services billed and tracked under this master order')).toBeInTheDocument();
      expect(screen.queryByRole('table', { name: /sub-orders matrix breakdown table/i })).not.toBeInTheDocument();

      // Switch back to Table View
      const tableBtn = screen.getByRole('button', { name: /table/i });
      fireEvent.click(tableBtn);
      expect(screen.getByRole('table', { name: /sub-orders matrix breakdown table/i })).toBeInTheDocument();
    });

    it('preserves order not found state for nonexistent order ID', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=non-existent-order-999']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Order Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to Dashboard' })).toBeInTheDocument();
    });
  });
});
