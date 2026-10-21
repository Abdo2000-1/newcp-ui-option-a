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

describe('AddCase Wizard Validation Guards (UIUX-REQ-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('empty required fields block progression', () => {
    renderAddCase();

    // Verify initially on Step 1
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    // Progression must be blocked - still on Step 1
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();
    expect(screen.queryByText(/services selection & surgical specs/i)).not.toBeInTheDocument();
  });

  it('whitespace-only values block progression', () => {
    renderAddCase();

    const firstNameInput = screen.getByLabelText(/first name \*/i);
    const lastNameInput = screen.getByLabelText(/last name \*/i);
    const chartIdInput = screen.getByLabelText(/patient chart id \/ pacs id \*/i);

    fireEvent.change(firstNameInput, { target: { value: '   ' } });
    fireEvent.change(lastNameInput, { target: { value: '  \t ' } });
    fireEvent.change(chartIdInput, { target: { value: '   ' } });

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    // Still blocked on Step 1
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();
    expect(screen.queryByText(/services selection & surgical specs/i)).not.toBeInTheDocument();
  });

  it('validation errors are visible and accessible', () => {
    renderAddCase();

    const firstNameInput = screen.getByLabelText(/first name \*/i);
    const lastNameInput = screen.getByLabelText(/last name \*/i);
    const chartIdInput = screen.getByLabelText(/patient chart id \/ pacs id \*/i);

    // Initial state: no error alerts
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(firstNameInput).toHaveAttribute('aria-invalid', 'false');

    // Trigger validation
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    // Validation alerts are visible and accessible
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBe(3);

    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Patient Chart ID / PACS ID is required')).toBeInTheDocument();

    expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(firstNameInput).toHaveAttribute('aria-describedby', 'patientFirstName-error');

    expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(lastNameInput).toHaveAttribute('aria-describedby', 'patientLastName-error');

    expect(chartIdInput).toHaveAttribute('aria-invalid', 'true');
    expect(chartIdInput).toHaveAttribute('aria-describedby', 'patientChartId-error');
  });

  it('future step navigation cannot bypass validation', () => {
    renderAddCase();

    // Click step headers for steps 2, 3, 4 without filling required fields
    const step2Btn = screen.getByRole('button', { name: /services & guide specs/i });
    const step3Btn = screen.getByRole('button', { name: /teeth chart/i });
    const step4Btn = screen.getByRole('button', { name: /scans & internal notes/i });

    fireEvent.click(step2Btn);
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();
    expect(screen.getByText('First name is required')).toBeInTheDocument();

    fireEvent.click(step3Btn);
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();

    fireEvent.click(step4Btn);
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();
    expect(screen.queryByText(/final clinical case review/i)).not.toBeInTheDocument();
  });

  it('valid fields allow progression', () => {
    renderAddCase();

    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'PT-99102' } });

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    // Advances to Step 2
    expect(screen.getByRole('heading', { name: /services selection & surgical specs/i })).toBeInTheDocument();
  });

  it('final submission is blocked when required fields are missing', () => {
    const createOrderSpy = vi.spyOn(store, 'createOrder');
    renderAddCase();

    // Fill valid data first to navigate to Step 4
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'PT-99102' } });

    // Step 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    // Step 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    // Step 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText(/final clinical case review/i)).toBeInTheDocument();

    // Navigate back to Step 1 and clear required fields
    fireEvent.click(screen.getByRole('button', { name: /clinician & patient/i }));
    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: '' } });

    // Try submitting if somehow on final step or attempting to jump
    // Step navigation to Step 4 is blocked
    fireEvent.click(screen.getByRole('button', { name: /scans & internal notes/i }));
    expect(screen.getByRole('heading', { name: /clinician & scan diagnostic center/i })).toBeInTheDocument();
    expect(createOrderSpy).not.toHaveBeenCalled();
  });

  it('the dummy "Alex Morgan" fallback is no longer used', async () => {
    const createOrderSpy = vi.spyOn(store, 'createOrder');
    renderAddCase();

    fireEvent.change(screen.getByLabelText(/first name \*/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/last name \*/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/patient chart id \/ pacs id \*/i), { target: { value: 'PT-77001' } });

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Verify Step 4 review displays real patient name and not Alex Morgan
    expect(screen.queryByText(/alex morgan/i)).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Submit case
    const submitBtn = screen.getByRole('button', { name: /submit & transmit case/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          patientName: 'Jane Smith',
        })
      );
    });

    expect(createOrderSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        patientName: expect.stringMatching(/alex morgan/i),
      })
    );
  });
});
