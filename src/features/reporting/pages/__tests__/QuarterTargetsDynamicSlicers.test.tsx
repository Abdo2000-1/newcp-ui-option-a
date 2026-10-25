import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuarterTargetsReport from '../QuarterTargetsReport';
import { AppProviders } from '@/app/providers';

describe('UIUX-REQ-019: Quarter Targets Dynamic Slicers & Mock Power BI Canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Quarter Targets header, view switchers, and mock notice banner', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    expect(screen.getByText(/3DDX Quarter Targets/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /power bi live dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /doctor target matrix/i })).toBeInTheDocument();
    expect(screen.getByText(/Power BI Canvas Emulation: Synthetic demonstration/i)).toBeInTheDocument();
  });

  it('manages Reset Slicers button state and resets active slicers to defaults', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    const resetBtn = screen.getByTestId('reset-slicers-btn');
    expect(resetBtn).toBeDisabled();

    // Select Q1 slicer
    const q1Btn = screen.getByRole('button', { name: /^Q1$/i });
    fireEvent.click(q1Btn);

    expect(resetBtn).toBeEnabled();
    expect(screen.getByText(/2,580/)).toBeInTheDocument();

    // Click Reset Slicers
    fireEvent.click(resetBtn);

    expect(resetBtn).toBeDisabled();
    expect(screen.getByText(/11,770/)).toBeInTheDocument();
  });

  it('supports modality and quota slicer selections dynamically', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    const guidesBtn = screen.getByRole('button', { name: /^Guides$/i });
    fireEvent.click(guidesBtn);

    const resetBtn = screen.getByTestId('reset-slicers-btn');
    expect(resetBtn).toBeEnabled();

    const aboveQuotaBtn = screen.getByRole('button', { name: /^≥ 100%$/i });
    fireEvent.click(aboveQuotaBtn);

    expect(resetBtn).toBeEnabled();
  });

  it('displays empty state in Doctor Target Matrix when query has no matches and resets', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    // Switch to Doctor Target Matrix view
    const matrixTab = screen.getByRole('button', { name: /doctor target matrix/i });
    fireEvent.click(matrixTab);

    expect(screen.getByText(/CT Dent Ltd/i)).toBeInTheDocument();

    // Type non-existent doctor
    const searchInput = screen.getByPlaceholderText(/search doctor or clinic/i);
    fireEvent.change(searchInput, { target: { value: 'non_existent_doctor_xyz' } });

    const noResults = screen.getByTestId('slicer-no-results');
    expect(noResults).toBeInTheDocument();
    expect(noResults).toHaveTextContent(/No client accounts match active slicers/i);

    // Reset from within empty state
    const resetFromEmptyBtn = screen.getByRole('button', { name: /^reset slicers$/i });
    fireEvent.click(resetFromEmptyBtn);

    expect(screen.queryByTestId('slicer-no-results')).not.toBeInTheDocument();
    expect(screen.getByText(/CT Dent Ltd/i)).toBeInTheDocument();
  });
});
