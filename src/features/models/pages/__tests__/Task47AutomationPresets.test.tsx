import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Task47ModelWorkReport from '../Task47ModelWorkReport';
import { AppProviders } from '@/app/providers';

describe('UIUX-REQ-020: Task 47 Model Work Automation Presets & Table Scroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Task 47 header, automation presets, and filter form', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Task47ModelWorkReport />
        </AppProviders>
      </MemoryRouter>
    );

    expect(screen.getByText(/Task 47: Model Work CP Report/i)).toBeInTheDocument();
    expect(screen.getByTestId('preset-dual-arch')).toBeInTheDocument();
    expect(screen.getByTestId('preset-high-value')).toBeInTheDocument();
    expect(screen.getByTestId('preset-vouchers')).toBeInTheDocument();
  });

  it('filters rows correctly when clicking automation presets', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Task47ModelWorkReport />
        </AppProviders>
      </MemoryRouter>
    );

    // Initial total count is 6
    expect(screen.getByText('Arthur Pendelton')).toBeInTheDocument();

    // Click Dual Arch preset (Elena Rostova and Rachel Green have both maxilla and mandible)
    const dualArchBtn = screen.getByTestId('preset-dual-arch');
    fireEvent.click(dualArchBtn);

    expect(screen.getByText(/Applied preset: Dual Arch Work/i)).toBeInTheDocument();
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('Rachel Green')).toBeInTheDocument();
    expect(screen.queryByText('Arthur Pendelton')).not.toBeInTheDocument();

    // Click High Value preset (≥$100: Elena Rostova $130, Rachel Green $140)
    const highValueBtn = screen.getByTestId('preset-high-value');
    fireEvent.click(highValueBtn);

    expect(screen.getByText(/Applied preset: High Value Appliances/i)).toBeInTheDocument();
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('Rachel Green')).toBeInTheDocument();
  });

  it('resets presets and filters using Reset Filters button', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Task47ModelWorkReport />
        </AppProviders>
      </MemoryRouter>
    );

    const dualArchBtn = screen.getByTestId('preset-dual-arch');
    fireEvent.click(dualArchBtn);

    expect(screen.queryByText('Arthur Pendelton')).not.toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /reset filters/i });
    expect(resetBtn).toBeEnabled();
    fireEvent.click(resetBtn);

    expect(screen.getByText('Arthur Pendelton')).toBeInTheDocument();
  });

  it('displays empty state when filters match no model work records and resets', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Task47ModelWorkReport />
        </AppProviders>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search patient, doc/i);
    fireEvent.change(searchInput, { target: { value: 'non_existent_model_record_xyz' } });

    const noResults = screen.getByTestId('task47-no-results');
    expect(noResults).toBeInTheDocument();
    expect(noResults).toHaveTextContent(/No model work appliance records match/i);

    const resetBtn = screen.getByRole('button', { name: /reset filters & presets/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByTestId('task47-no-results')).not.toBeInTheDocument();
    expect(screen.getByText('Arthur Pendelton')).toBeInTheDocument();
  });

  it('ensures table has horizontal overflow scrolling and minimum width to avoid clipping', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Task47ModelWorkReport />
        </AppProviders>
      </MemoryRouter>
    );

    const table = screen.getByRole('table');
    expect(table).toHaveClass('min-w-[1050px]');

    const scrollContainer = table.closest('.overflow-x-auto');
    expect(scrollContainer).toBeInTheDocument();
  });
});
