import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddCase from '../AddCase';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderAddCase() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <AddCase />
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Add Case Workflow & Tooth Chart Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Service Guide visibility: renders clean Service Guide section on Step 2 without developer clutter', () => {
    renderAddCase();

    // Fill valid Step 1
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Sarah' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Connor' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'PT-1002' } });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Verify Service Guide section is visible
    expect(screen.getByTestId('service-guide-section')).toBeInTheDocument();
    expect(screen.getByText(/Prescribed Clinical Services Catalog & Guide Specs/i)).toBeInTheDocument();

    // Verify developer clutter is removed
    expect(screen.queryByText('HTTP 200 OK')).not.toBeInTheDocument();
    expect(screen.getByText('Active Catalog')).toBeInTheDocument();
  });

  it('2. Correct step order and sequence: progresses from Step 1 -> 2 -> 3 -> 4 sequentially', () => {
    renderAddCase();

    // Initially Step 1
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Bruce' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Wayne' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'BW-007' } });

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('heading', { name: /services selection & surgical specs/i })).toBeInTheDocument();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('heading', { name: /universal dental numbering/i })).toBeInTheDocument();

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/final clinical case review/i)).toBeInTheDocument();
  });

  it('3. Required validation on Step 2: blocks progression if no service is selected', () => {
    renderAddCase();

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Clark' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Kent' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'CK-001' } });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('heading', { name: /services selection & surgical specs/i })).toBeInTheDocument();

    // Deselect default services
    const sgCheckbox = screen.getByRole('checkbox', { name: /surgical guide \(sg\)/i });
    if ((sgCheckbox as HTMLInputElement).checked) {
      fireEvent.click(sgCheckbox);
    }
    const tpCheckbox = screen.getByRole('checkbox', { name: /treatment plan \(tp\)/i });
    if ((tpCheckbox as HTMLInputElement).checked) {
      fireEvent.click(tpCheckbox);
    }
    const convCheckbox = screen.getByRole('checkbox', { name: /dicom conversion/i });
    if ((convCheckbox as HTMLInputElement).checked) {
      fireEvent.click(convCheckbox);
    }

    // Deselect catalog item if one is selected by clicking it again
    const catalogButtons = screen.getAllByRole('button').filter(b => b.className.includes('ring-2 ring-cyan-500/30'));
    catalogButtons.forEach(b => fireEvent.click(b));

    // Try to advance to Step 3 with Continue button
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Should remain on Step 2 and show error alert if services are invalid
    expect(screen.getByRole('heading', { name: /services selection & surgical specs/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Please select at least one clinical service/i);
  });

  it('4. Tooth Chart visibility & required validation: Tooth Chart appears when service requires it, and blocks progression if 0 teeth selected', () => {
    renderAddCase();

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Diana' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Prince' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'DP-100' } });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Tooth Chart MUST be visible
    expect(screen.getByRole('heading', { name: /universal dental numbering/i })).toBeInTheDocument();
    expect(screen.getByText(/pick your active tool below/i)).toBeInTheDocument();

    // Clear all teeth selections
    const clearBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearBtn);

    // Verify 0 teeth selected
    expect(screen.getByText('0 Teeth Selected')).toBeInTheDocument();

    // Try to proceed to Step 4 with 0 teeth
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Blocked: remains on Step 3 and shows error alert
    expect(screen.getByRole('heading', { name: /universal dental numbering/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Please select at least one tooth on the Tooth Chart/i);

    // Select tooth #19
    const tooth19 = screen.getByTestId('tooth-19');
    fireEvent.click(tooth19);

    // Now progression is allowed
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/final clinical case review/i)).toBeInTheDocument();
  });

  it('5. No bypass to final submission: stepper navigation blocks jumping across steps without completing prerequisites', () => {
    renderAddCase();

    // On Step 1: try clicking Step 4 directly
    const step4Header = screen.getByRole('button', { name: /scans & internal notes/i });
    fireEvent.click(step4Header);

    // Must still be on Step 1
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();
    expect(screen.queryByText(/final clinical case review/i)).not.toBeInTheDocument();

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Barry' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Allen' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'BA-001' } });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Advance to Step 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Clear teeth on Step 3
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    // Try clicking Step 4 header directly
    fireEvent.click(step4Header);

    // Blocked: remains on Step 3 with alert
    expect(screen.getByRole('heading', { name: /universal dental numbering/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Please select at least one tooth/i);
  });

  it('6. Full valid progression & submission: correctly records order and dispatches without errors', async () => {
    const createOrderSpy = vi.spyOn(store, 'createOrder');
    renderAddCase();

    // Step 1
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Arthur' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Curry' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'AC-777' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4
    expect(screen.getByText(/final clinical case review/i)).toBeInTheDocument();
    expect(screen.getByText('Arthur Curry')).toBeInTheDocument();

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit & transmit case/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          patientName: 'Arthur Curry',
          status: 'New',
        })
      );
    });
  });
});
