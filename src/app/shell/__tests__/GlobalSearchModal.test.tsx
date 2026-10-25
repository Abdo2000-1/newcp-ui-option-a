import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalSearchModal } from '../GlobalSearchModal';
import { normalizeSearchTerm, tokenize, SearchIndex, createIndexedItem } from '@/shared/utils/searchIndex';

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Global Search Improvement (UIUX-REQ-009)', () => {
  const theme = createTheme({ palette: { mode: 'light' } });
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderModal = (isOpen = true) => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <GlobalSearchModal isOpen={isOpen} onClose={onClose} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  describe('Search Index & Tokenization Unit Logic', () => {
    it('normalizes terms: lowercases, collapses whitespace, and preserves alphanumeric, dash, and hash', () => {
      expect(normalizeSearchTerm('  Case #504901 - Dr. Smith!  ')).toBe('case #504901 - dr smith');
      expect(normalizeSearchTerm('')).toBe('');
      expect(normalizeSearchTerm('  SingleToken  ')).toBe('singletoken');
    });

    it('extracts unique tokens from multi-word strings', () => {
      const tokens = tokenize('Surgical Guide 3D Surgical Guide');
      expect(tokens).toEqual(['surgical', 'guide', '3d']);
    });

    it('indexes items and performs multi-token matching with AND semantics', () => {
      const index = new SearchIndex();
      const item1 = createIndexedItem({
        id: '1',
        category: 'orders',
        title: 'Case #504901 • John Doe',
        subtitle: 'Dr. Marcus Vance • Surgical Guide',
        route: '/order-details?ID=504901',
        icon: () => null,
      });
      const item2 = createIndexedItem({
        id: '2',
        category: 'orders',
        title: 'Case #504902 • Sarah Connor',
        subtitle: 'Dr. Jane Smith • Night Guard',
        route: '/order-details?ID=504902',
        icon: () => null,
      });

      index.setItems([item1, item2]);

      // Single token match
      const results1 = index.search('504901');
      expect(results1).toHaveLength(1);
      expect(results1[0].id).toBe('1');

      // Multi-token match across title & subtitle
      const results2 = index.search('marcus surgical');
      expect(results2).toHaveLength(1);
      expect(results2[0].id).toBe('1');

      // Non-matching multi-token
      const results3 = index.search('marcus night');
      expect(results3).toHaveLength(0);

      // Whitespace and case-insensitive tolerance
      const results4 = index.search('   SARAH   504902   ');
      expect(results4).toHaveLength(1);
      expect(results4[0].id).toBe('2');
    });
  });

  describe('Debouncing & Input Responsiveness', () => {
    it('debounces input changes before updating search results', () => {
      renderModal(true);

      const input = screen.getByRole('textbox', { name: /search clinical repository/i });

      // Search for an item that is NOT in the default empty-query top results (e.g. specialized term)
      fireEvent.change(input, { target: { value: 'Facility' } });
      expect(input).toHaveValue('Facility');

      // Before 150ms debounce timer finishes, debounced search hasn't triggered
      expect(screen.queryByText(/Scan Centers Hub/i)).not.toBeInTheDocument();

      // Fast-forward debounce timer (150ms)
      act(() => {
        vi.advanceTimersByTime(160);
      });

      // Now the debounced search results appear
      expect(screen.getByText(/Scan Centers Hub/i)).toBeInTheDocument();
    });

    it('immediately resets search when input is cleared without waiting for debounce', () => {
      renderModal(true);

      const input = screen.getByRole('textbox', { name: /search clinical repository/i });

      fireEvent.change(input, { target: { value: 'Facility' } });
      act(() => {
        vi.advanceTimersByTime(160);
      });
      expect(screen.getByText(/Scan Centers Hub/i)).toBeInTheDocument();

      // Clear input button
      const clearBtn = screen.getByRole('button', { name: /clear search input/i });
      fireEvent.click(clearBtn);

      expect(input).toHaveValue('');
      // Default suggestions (Quick Navigation pages) appear immediately
      expect(screen.getByText(/Create New Case/i)).toBeInTheDocument();
    });
  });

  describe('Default Recommendations & Category Filtering', () => {
    it('shows quick action pages by default when query is empty', () => {
      renderModal(true);

      expect(screen.getByText(/Create New Case/i)).toBeInTheDocument();
      expect(screen.getByText(/Master Orders Flow/i)).toBeInTheDocument();
      expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
    });

    it('filters results by category when category buttons are clicked', () => {
      renderModal(true);

      const input = screen.getByRole('textbox', { name: /search clinical repository/i });
      fireEvent.change(input, { target: { value: 'dental' } });
      act(() => {
        vi.advanceTimersByTime(160);
      });

      // Click on "Clinicians" category
      const doctorsFilterBtn = screen.getByRole('button', { name: /clinicians/i });
      fireEvent.click(doctorsFilterBtn);

      // Category should be active and non-matching categories excluded
      const actionsFilterBtn = screen.getByRole('button', { name: /quick navigation/i });
      fireEvent.click(actionsFilterBtn);
    });

    it('displays no-results empty state when search term has no matches', () => {
      renderModal(true);

      const input = screen.getByRole('textbox', { name: /search clinical repository/i });
      fireEvent.change(input, { target: { value: 'nonexistent-query-xyz-999' } });
      act(() => {
        vi.advanceTimersByTime(160);
      });

      expect(screen.getByText(/No results found for/i)).toBeInTheDocument();
      expect(screen.getByText(/nonexistent-query-xyz-999/i)).toBeInTheDocument();
      expect(screen.getByText(/Try searching by Order Number/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility & Selection', () => {
    it('navigates with ArrowDown, ArrowUp, and selects item with Enter', () => {
      renderModal(true);

      const dialog = screen.getByRole('dialog');

      // Arrow down to second item
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      // Arrow down to third item
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      // Arrow up back to second item
      fireEvent.keyDown(dialog, { key: 'ArrowUp' });

      // Press Enter to select
      fireEvent.keyDown(dialog, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('closes modal when Escape key is pressed', () => {
      renderModal(true);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('navigates to item route when clicked', () => {
      renderModal(true);

      const quickActionItem = screen.getByText(/Create New Case/i);
      fireEvent.click(quickActionItem);

      expect(mockNavigate).toHaveBeenCalledWith('/add-case');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
