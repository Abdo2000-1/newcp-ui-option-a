import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Flow from '../Flow';
import { AppProviders } from '@/app/providers';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UIUX-FLOW-001: Order Flow Table Structure & Entity Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/flow']}>
        <AppProviders>
          <Flow />
        </AppProviders>
      </MemoryRouter>
    );
  };

  describe('1. Page Title Requirement', () => {
    it('renames page title to "Order Flow" and does not display "Master Order Flow"', () => {
      renderComponent();

      const heading = screen.getByTestId('order-flow-page-title');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Order Flow');
      expect(screen.queryByText(/^Master Order Flow$/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Visible Collapsed Columns Requirement', () => {
    it('displays only the 12 approved shared columns when orders are collapsed', () => {
      renderComponent();

      // Check header row contains exactly the 12 approved columns:
      // #, Scan Center, Doctor, Lock, Notes, Archive, ..., Order, Max, Mand, Amount, Received
      expect(screen.getByTestId('th-tl')).toHaveTextContent('#');
      expect(screen.getByTestId('th-scanCenter')).toHaveTextContent('Scan Center');
      expect(screen.getByTestId('th-doctor')).toHaveTextContent('Doctor');
      expect(screen.getByTestId('th-lock')).toHaveTextContent('Lock');
      expect(screen.getByTestId('th-notes')).toHaveTextContent('Notes');
      expect(screen.getByTestId('th-archive')).toHaveTextContent('Archive');
      expect(screen.getByTestId('th-more')).toHaveTextContent('...');
      expect(screen.getByTestId('th-order')).toHaveTextContent('Order');
      expect(screen.getByTestId('th-max')).toHaveTextContent('Max');
      expect(screen.getByTestId('th-mand')).toHaveTextContent('Mand');
      expect(screen.getByTestId('th-amount')).toHaveTextContent('Amount');
      expect(screen.getByTestId('th-received')).toHaveTextContent('Received');

      // Verify that service-specific columns are NOT present in the collapsed headers
      expect(screen.queryByTestId('th-billTo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-format')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-vouchers')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-sentTime')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-updateTime')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-chargedOn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-cr')).not.toBeInTheDocument();
      expect(screen.queryByTestId('th-csTask')).not.toBeInTheDocument();
    });
  });

  describe('3. Expanded Service Columns Requirement', () => {
    it('shows service-specific fields when an order row is opened', () => {
      renderComponent();

      // Case 504901 is collapsed initially
      expect(screen.queryByTestId('expanded-row-504901')).not.toBeInTheDocument();

      // Click row or expand button to open accordion
      const expandBtn = screen.getByTestId('expand-btn-504901');
      fireEvent.click(expandBtn);

      // Now expanded row appears
      const expandedRow = screen.getByTestId('expanded-row-504901');
      expect(expandedRow).toBeInTheDocument();

      // Service-specific headers are present in expanded sub-table:
      // Bill To, Format, Voucher, Sent, Update, Charged, Action, CR, CS Task
      expect(screen.getByTestId('sub-th-billTo')).toHaveTextContent('Bill To');
      expect(screen.getByTestId('sub-th-format')).toHaveTextContent('Format');
      expect(screen.getByTestId('sub-th-vouchers')).toHaveTextContent('Voucher');
      expect(screen.getByTestId('sub-th-sentTime')).toHaveTextContent('Sent');
      expect(screen.getByTestId('sub-th-updateTime')).toHaveTextContent('Update');
      expect(screen.getByTestId('sub-th-chargedOn')).toHaveTextContent('Charged');
      expect(screen.getByTestId('sub-th-action')).toHaveTextContent('Action');
      expect(screen.getByTestId('sub-th-changeRequest')).toHaveTextContent('CR');
      expect(screen.getByTestId('sub-th-csTask')).toHaveTextContent('CS Task');

      // All service data values are visible
      const billToElements = within(expandedRow).getAllByText(/California Diagnostics CC: Master, 9903/i);
      expect(billToElements.length).toBeGreaterThan(0);
      const formatElements = within(expandedRow).getAllByText('coDiagnostiX');
      expect(formatElements.length).toBeGreaterThan(0);
    });
  });

  describe('4. Action Control on Every Entity / Service & Order Details Navigation', () => {
    it('shows an Action control for every service entity in the expanded view', () => {
      renderComponent();

      // Expand case 504901
      fireEvent.click(screen.getByTestId('expand-btn-504901'));

      const expandedRow = screen.getByTestId('expanded-row-504901');
      // Case 504901 has 3 services (IO, TP #1, TP #2)
      const actionCells = within(expandedRow).getAllByTestId('td-action');
      expect(actionCells.length).toBe(3);

      actionCells.forEach((cell) => {
        const actionBtn = within(cell).getByRole('button');
        expect(actionBtn).toBeInTheDocument();
      });
    });

    it('navigates to the correct Order Details page when clicking an Action control', () => {
      renderComponent();

      // Expand case 504901
      fireEvent.click(screen.getByTestId('expand-btn-504901'));

      const expandedRow = screen.getByTestId('expanded-row-504901');
      const actionBtns = within(expandedRow).getAllByRole('button');
      // Click the first service action button (IN PROGRESS)
      const inProgressBtn = actionBtns.find((b) => b.textContent?.includes('IN PROGRESS'));
      expect(inProgressBtn).toBeDefined();

      fireEvent.click(inProgressBtn!);
      expect(mockNavigate).toHaveBeenCalledWith('/order-details?id=504901');
    });

    it('navigates to the correct Order Details page when clicking the "..." menu control', () => {
      renderComponent();

      const moreBtn = screen.getByRole('button', { name: /open details for order 504901/i });
      fireEvent.click(moreBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/order-details?id=504901');
    });
  });

  describe('5. Filter List Requirement (Services, Status, Duration Only)', () => {
    it('displays only the approved filters: Services, Status, and Duration', () => {
      renderComponent();

      // Approved filters are present
      expect(screen.getByTestId('filter-services')).toBeInTheDocument();
      expect(screen.getByTestId('filter-status')).toBeInTheDocument();
      expect(screen.getByTestId('filter-duration')).toBeInTheDocument();

      // Unapproved extra filter spreads are not rendered
      expect(screen.queryByTestId('filter-scan-center')).not.toBeInTheDocument();
      expect(screen.queryByTestId('filter-doctor')).not.toBeInTheDocument();
      expect(screen.queryByTestId('filter-clinic')).not.toBeInTheDocument();
      expect(screen.queryByTestId('filter-source')).not.toBeInTheDocument();
    });

    it('filters cases dynamically when selecting a Service filter', () => {
      renderComponent();

      const servicesSelect = screen.getByTestId('filter-services');
      // Filter by Treatment Plan (TP)
      fireEvent.change(servicesSelect, { target: { value: 'TP' } });

      // Cases with TP should be present (e.g. 504901)
      expect(screen.getByTestId('order-row-504901')).toBeInTheDocument();
    });

    it('filters cases dynamically when selecting Status filter', () => {
      renderComponent();

      const statusSelect = screen.getByTestId('filter-status');
      // Filter by Action Required / No Scans
      fireEvent.change(statusSelect, { target: { value: 'ACTION_REQUIRED' } });

      // Case 504900 has missing scans / alert
      expect(screen.getByTestId('order-row-504900')).toBeInTheDocument();
      // Case 504901 has both scans and no alert, so should not be in action-required
      expect(screen.queryByTestId('order-row-504901')).not.toBeInTheDocument();
    });
  });

  describe('6. Pagination Requirement (Default 50 rows per page & No Data Loss)', () => {
    it('defaults to 50 rows per page and displays all mock cases on the first page', () => {
      renderComponent();

      const pageSizeSelect = screen.getByTestId('page-size-select') as HTMLSelectElement;
      expect(pageSizeSelect.value).toBe('50');

      // Total orders in mock data is 36, all 36 fit into page 1 with page size 50
      const pagination = screen.getByTestId('order-flow-pagination');
      expect(pagination).toHaveTextContent(/Showing\s+1\s+to\s+36\s+of\s+36\s+Cases/i);
    });

    it('preserves access to all remaining rows without data loss when page size changes', () => {
      renderComponent();

      const pageSizeSelect = screen.getByTestId('page-size-select');
      // Change page size to 25
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });

      // Page 1 now shows 1 to 25 of 36 Cases
      const pagination = screen.getByTestId('order-flow-pagination');
      expect(pagination).toHaveTextContent(/Showing\s+1\s+to\s+25\s+of\s+36\s+Cases/i);

      // Click Next to navigate to page 2
      const nextBtn = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      // Page 2 shows remaining cases (26 to 36 of 36 Cases)
      expect(pagination).toHaveTextContent(/Showing\s+26\s+to\s+36\s+of\s+36\s+Cases/i);
    });
  });

  describe('7. Responsive Table Behavior Requirement', () => {
    it('wraps the table in an overflow-x-auto container with minimum width', () => {
      renderComponent();

      const tableContainer = screen.getByTestId('order-flow-table-container');
      expect(tableContainer).toHaveClass('overflow-x-auto');

      const table = screen.getByTestId('order-flow-table');
      expect(table).toHaveClass('min-w-[960px]');
    });
  });
});
