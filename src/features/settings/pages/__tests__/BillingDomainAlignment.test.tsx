import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Billing, { getBillingAccountDisplayName } from '../Billing';
import { store } from '@/shared/services/store';
import type { BillingRecord } from '@/shared/types';

const mockBillingRecords: BillingRecord[] = [
  {
    id: 'bill-test-1',
    orderId: 'ord-101',
    orderNumber: 'DL-024101',
    patientName: 'Jane Doe',
    doctorName: 'Dr. Sarah Connor',
    clinicName: 'Metro Dental Clinic',
    amount: 1500,
    status: 'Invoiced',
    invoiceNumber: 'INV-90001',
    invoiceDate: '2026-10-01T10:00:00Z',
    dueDate: '2026-11-01',
    paidDate: null,
    vouchers: 1,
    notes: 'Standard model work',
    isBillable: true,
    billingAccountName: 'Metro Dental Clinic',
    billingAccountType: 'Clinic'
  },
  {
    id: 'bill-test-2',
    orderId: 'ord-102',
    orderNumber: 'DL-024102',
    patientName: 'John Smith',
    doctorName: 'Dr. Alan Grant',
    clinicName: 'Island Oral Care',
    amount: 850,
    status: 'Paid',
    invoiceNumber: 'INV-90002',
    invoiceDate: '2026-09-15T14:00:00Z',
    dueDate: '2026-10-15',
    paidDate: '2026-10-10T11:00:00Z',
    vouchers: 0,
    notes: 'Warranty redo',
    isBillable: false,
    billingAccountName: 'Island Oral Care',
    billingAccountType: 'Clinic'
  }
];

describe('UIUX-REQ-022: Billing Account vs Patient Domain Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(store, 'getBilling').mockReturnValue(mockBillingRecords);
    vi.spyOn(store, 'updateBillingStatus').mockImplementation(() => {});
  });

  it('renders the mandatory business domain safety banner [MOCK / NOT_INTEGRATED]', () => {
    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    );

    const alertBanner = screen.getByTestId('billing-domain-alert');
    expect(alertBanner).toBeInTheDocument();
    expect(alertBanner).toHaveTextContent(/Billing Account & Patient Domain Alignment/i);
    expect(alertBanner).toHaveTextContent(/Sections 8 & 13\.9/i);
    expect(alertBanner).toHaveTextContent(/Client Account \(Clinic \/ Doctor \/ Scan Center\)/i);
    expect(alertBanner).toHaveTextContent(/distinct from the case Patient/i);
  });

  it('renders client clinic as the primary billing debtor and decouples the patient in Card view', () => {
    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    );

    // Cards view is default
    expect(screen.getByTestId('billing-cards-view')).toBeInTheDocument();

    const card1 = screen.getByTestId('billing-card-bill-test-1');
    expect(card1).toBeInTheDocument();

    // Debtor heading is the Clinic Account
    expect(card1).toHaveTextContent('Metro Dental Clinic');
    expect(card1).toHaveTextContent(/Billing Account \(Client\)/i);

    // Patient is clearly labeled as case clinical subject, never the billing debtor
    expect(card1).toHaveTextContent('Jane Doe');
    expect(card1).toHaveTextContent(/Case Subject/i);

    // Independent billable badge
    expect(card1).toHaveTextContent('Billable');
    expect(card1).toHaveTextContent('Yes');
  });

  it('properly preserves isBillable independently from payer assignment', () => {
    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    );

    const card2 = screen.getByTestId('billing-card-bill-test-2');
    expect(card2).toBeInTheDocument();

    // Billable is No for warranty/non-billable item, but Clinic remains the billing account
    expect(card2).toHaveTextContent('Island Oral Care');
    expect(card2).toHaveTextContent('John Smith');
    expect(card2).toHaveTextContent('No');
  });

  it('switches to table view and displays distinct columns for Billing Account, Patient, and Billable', async () => {
    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    );

    const tableModeBtn = screen.getByRole('button', { name: /Table View/i });
    fireEvent.click(tableModeBtn);

    await waitFor(() => {
      expect(screen.getByTestId('billing-table-view')).toBeInTheDocument();
    });

    expect(screen.getByText('Billing Account (Payer)')).toBeInTheDocument();
    expect(screen.getByText('Patient (Subject)')).toBeInTheDocument();
    expect(screen.getByText('Billable')).toBeInTheDocument();

    const row1 = screen.getByTestId('billing-row-bill-test-1');
    expect(row1).toHaveTextContent('Metro Dental Clinic');
    expect(row1).toHaveTextContent('Jane Doe');
    expect(row1).toHaveTextContent('Clinical Subject');
  });

  it('triggers prototype status update action without mutating real database', () => {
    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    );

    const card1 = screen.getByTestId('billing-card-bill-test-1');
    const markPaidBtn = card1.querySelector('button');
    expect(markPaidBtn).toBeInTheDocument();
    if (markPaidBtn) {
      fireEvent.click(markPaidBtn);
      expect(store.updateBillingStatus).toHaveBeenCalledWith('bill-test-1', 'Paid');
    }
  });

  it('correctly resolves billing account display name fallback', () => {
    const withClinic: BillingRecord = {
      ...mockBillingRecords[0],
      billingAccountName: undefined,
      clinicName: 'Alpha Dental'
    };
    expect(getBillingAccountDisplayName(withClinic)).toBe('Alpha Dental');

    const withDoctorOnly: BillingRecord = {
      ...mockBillingRecords[0],
      billingAccountName: undefined,
      clinicName: '',
      doctorName: 'Dr. Gregory House'
    };
    expect(getBillingAccountDisplayName(withDoctorOnly)).toBe('Dr. Gregory House (Doctor Account)');

    const emptyAccount: BillingRecord = {
      ...mockBillingRecords[0],
      billingAccountName: undefined,
      clinicName: '',
      doctorName: ''
    };
    expect(getBillingAccountDisplayName(emptyAccount)).toBe('Client Billing Account');
  });
});
