import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Reports from '../Reports';
import { AppProviders } from '@/app/providers';

describe('UIUX-REQ-018: Reports Print Stylesheet & Formatted Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Laboratory Performance Matrix header and print/export controls', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Reports />
        </AppProviders>
      </MemoryRouter>
    );

    const matches = await screen.findAllByText(/Laboratory Performance Matrix/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('reports-print-btn')).toBeInTheDocument();
    expect(screen.getByTestId('reports-export-btn')).toBeInTheDocument();
  });

  it('handles print action with mock feedback and invokes window.print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <AppProviders>
          <Reports />
        </AppProviders>
      </MemoryRouter>
    );

    await screen.findAllByText(/Laboratory Performance Matrix/i);

    const printBtn = screen.getByTestId('reports-print-btn');
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    expect(await screen.findByText(/Preparing report for browser print preview/i)).toBeInTheDocument();
  });

  it('handles formatted CSV export with local blob generation and toast feedback', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Reports />
        </AppProviders>
      </MemoryRouter>
    );

    await screen.findAllByText(/Laboratory Performance Matrix/i);

    const exportBtn = screen.getByTestId('reports-export-btn');
    fireEvent.click(exportBtn);

    expect(await screen.findByText(/Formatted performance CSV report exported locally/i)).toBeInTheDocument();
  });

  it('displays empty state when search query matches no metrics and resets correctly', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Reports />
        </AppProviders>
      </MemoryRouter>
    );

    await screen.findAllByText(/Laboratory Performance Matrix/i);

    const searchInput = screen.getByPlaceholderText(/filter metrics/i);
    fireEvent.change(searchInput, { target: { value: 'non_existent_metric_query_xyz' } });

    const noResults = await screen.findByTestId('reports-no-results');
    expect(noResults).toBeInTheDocument();
    expect(noResults).toHaveTextContent(/No performance metrics match query/i);

    const resetBtn = screen.getByRole('button', { name: /reset filter/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('reports-no-results')).not.toBeInTheDocument();
    });
  });

  it('renders print-only executive audit header and KPI summary table', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Reports />
        </AppProviders>
      </MemoryRouter>
    );

    await screen.findAllByText(/Laboratory Performance Matrix/i);

    expect(screen.getByText(/3D Diagnostix - Laboratory Performance Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive KPI Summary Matrix/i)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
