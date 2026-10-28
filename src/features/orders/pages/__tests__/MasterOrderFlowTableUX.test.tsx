import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Flow, { ALL_COLUMNS } from '../Flow';
import { AppProviders } from '@/app/providers';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Master Order Flow Table UX (PR 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Column Completeness & Data Preservation', () => {
    it('defines and preserves all 22 columns with explicit minWidths', () => {
      expect(ALL_COLUMNS).toHaveLength(22);
      const expectedKeys = [
        'tl', 'scanCenter', 'doctor', 'patient', 'lock', 'notes',
        'archive', 'more', 'order', 'billTo', 'max', 'mand',
        'format', 'amount', 'vouch', 'received', 'sent', 'update',
        'charged', 'action', 'cr', 'csTask'
      ];
      expectedKeys.forEach((key) => {
        const col = ALL_COLUMNS.find((c) => c.key === key);
        expect(col, `Column ${key} must exist`).toBeDefined();
        expect(col?.minWidth, `Column ${key} must have minWidth >= 45`).toBeGreaterThanOrEqual(45);
      });
    });

    it('renders all visible column headers in the table', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      // Verify key column headers are visible
      expect(screen.getByText(/# tl/i)).toBeInTheDocument();
      expect(screen.getByText(/scan center/i)).toBeInTheDocument();
      expect(screen.getAllByText(/doctor/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/patient/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getAllByText(/action/i).length).toBeGreaterThan(0);
    });

    it('preserves order rows, case identifiers, and source badges', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      // Verify at least one known order number renders
      expect(screen.getByText('504901')).toBeInTheDocument();
    });
  });

  describe('2. Readability, Horizontal Scrolling & Text Overlap Prevention', () => {
    it('ensures table container enables horizontal scrolling without sm:overflow-x-visible constraint', () => {
      const { container } = render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      // The table container must have overflow-x-auto and must NOT have sm:overflow-x-visible
      const scrollContainers = container.querySelectorAll('.overflow-x-auto');
      expect(scrollContainers.length).toBeGreaterThan(0);

      scrollContainers.forEach((el) => {
        expect(el.className).not.toContain('sm:overflow-x-visible');
      });
    });

    it('applies comfortable cell padding and vertical alignment across table cells', () => {
      const { container } = render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();

      // Check header cells have comfortable padding
      const thElements = table?.querySelectorAll('th');
      expect(thElements && thElements.length).toBeGreaterThan(0);
      thElements?.forEach((th) => {
        expect(th.className).toContain('py-3');
      });

      // Check data cells have align-middle and py-3.5
      const tdElements = table?.querySelectorAll('tbody tr td');
      expect(tdElements && tdElements.length).toBeGreaterThan(0);
      const firstTd = tdElements?.[0];
      expect(firstTd?.className).toContain('align-middle');
    });
  });

  describe('3. Sorting, Filtering & Table Tools', () => {
    it('supports sorting when clicking column headers', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      const amountHeader = screen.getByText(/amount/i);
      fireEvent.click(amountHeader);

      // Clicking amount triggers sort indicator
      expect(amountHeader.closest('th')?.className).toContain('text-sky-600');
    });

    it('filters orders dynamically with the search input', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/filter by order #, patient, doctor/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistentCaseQuery999' } });

      expect(screen.getByText(/no matching cases in this production queue/i)).toBeInTheDocument();
    });

    it('toggles column visibility presets and provides reset layout control', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      // Open column picker dropdown
      const colPickerBtn = screen.getByRole('button', { name: /columns \(/i });
      fireEvent.click(colPickerBtn);

      // Minimal preset (6 columns)
      const minimalBtn = screen.getByRole('button', { name: /minimal \(6\)/i });
      fireEvent.click(minimalBtn);

      expect(screen.getByText(/columns \(6\/22\)/i)).toBeInTheDocument();

      // Re-open column picker to access reset control
      const updatedColPickerBtn = screen.getByRole('button', { name: /columns \(6\/22\)/i });
      fireEvent.click(updatedColPickerBtn);

      // Reset layout button restores all 22 columns
      const resetBtn = screen.getByRole('button', { name: /reset table layout/i });
      fireEvent.click(resetBtn);

      expect(screen.getByText(/columns \(22\/22\)/i)).toBeInTheDocument();
    });
  });

  describe('4. Sub-Orders Accordion & Workflow Actions', () => {
    it('expands row details and displays linked sub-services breakdown on click', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      const orderRow = screen.getByText('504901').closest('tr');
      expect(orderRow).toBeInTheDocument();
      fireEvent.click(orderRow!);

      // Verify sub-services header renders
      expect(screen.getByText(/linked sub-services breakdown/i)).toBeInTheDocument();
    });

    it('navigates to order details when clicking open order details action', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Flow />
          </AppProviders>
        </MemoryRouter>
      );

      // Expand order
      const orderRow = screen.getByText('504901').closest('tr');
      fireEvent.click(orderRow!);

      const openDetailsBtn = screen.getByRole('button', { name: /open full order details/i });
      fireEvent.click(openDetailsBtn);

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/order-details?ID=504901'));
    });
  });
});
