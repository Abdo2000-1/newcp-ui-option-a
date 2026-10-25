import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AddCase from '../AddCase';
import Task47ModelWorkReport from '@/features/models/pages/Task47ModelWorkReport';
import OrderDetailsPage from '../OrderDetailsPage';
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

describe('UIUX-REQ-016: Functional Mock Wiring for Prototype Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();

    // Mock window.URL.createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  describe('AddCase Prototype Actions', () => {
    it('supports replacing scan files and displays mock toast feedback', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <AddCase />
          </AppProviders>
        </MemoryRouter>
      );

      // Fill step 1 required fields
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Michael/i), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Henderson/i), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. PT-99210/i), {
        target: { value: 'CH-1001' },
      });

      // Click Continue to Step 2
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      // Click Continue to Step 3
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      // Click Continue to Step 4 (Scans & Internal Notes)
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Verify Replace Scan and Replace STL buttons exist
      const replaceScanBtn = screen.getByRole('button', { name: /replace scan/i });
      expect(replaceScanBtn).toBeInTheDocument();

      // Trigger file replacement
      const fileInputs = document.querySelectorAll('input[type="file"]');
      expect(fileInputs.length).toBeGreaterThanOrEqual(3);

      const testFile = new File(['mock content'], 'Custom_Patient_DICOM.zip', {
        type: 'application/zip',
      });
      fireEvent.change(fileInputs[0], { target: { files: [testFile] } });

      expect(screen.getAllByText(/Custom_Patient_DICOM\.zip/i).length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Replaced DICOM volume with: Custom_Patient_DICOM\.zip/i)
      ).toBeInTheDocument();
    });

    it('resets form draft when Reset Draft button is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <AddCase />
          </AppProviders>
        </MemoryRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(/e\.g\. Michael/i);
      fireEvent.change(firstNameInput, { target: { value: 'Alice' } });
      expect((firstNameInput as HTMLInputElement).value).toBe('Alice');

      const resetBtn = screen.getByRole('button', { name: /reset draft/i });
      fireEvent.click(resetBtn);

      expect((firstNameInput as HTMLInputElement).value).toBe('');
      expect(screen.getByText(/Prescription draft reset to initial values/i)).toBeInTheDocument();
    });

    it('submits case with safe local mock persistence and explicit prototype notice', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <AddCase />
          </AppProviders>
        </MemoryRouter>
      );

      // Fill step 1
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Michael/i), {
        target: { value: 'Jane' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Henderson/i), {
        target: { value: 'Smith' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. PT-99210/i), {
        target: { value: 'CH-2002' },
      });

      // Continue through all steps to Step 4
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Click Submit & Transmit Case
      const submitBtn = screen.getByRole('button', { name: /submit & transmit case/i });
      fireEvent.click(submitBtn);

      // Wait for mock creation
      await waitFor(
        () => {
          expect(
            screen.getByText(/Case Successfully Created & Transmitted!/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Verify prototype mock boundary notice is clearly visible
      expect(
        screen.getByText(/Prototype demonstration: order record stored in local browser state only/i)
      ).toBeInTheDocument();
    });
  });

  describe('Task47ModelWorkReport Prototype Actions', () => {
    it('manages Reset Filters button state based on active filter criteria', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Task47ModelWorkReport />
          </AppProviders>
        </MemoryRouter>
      );

      const resetBtn = screen.getByRole('button', { name: /reset filters/i });
      // Initially disabled because filters are at defaults
      expect(resetBtn).toBeDisabled();

      // Type in search filter
      const searchInput = screen.getByPlaceholderText(/Search patient, doc\.\.\./i);
      fireEvent.change(searchInput, { target: { value: 'Vance' } });

      // Reset button should now be enabled
      expect(resetBtn).not.toBeDisabled();

      // Click reset filters
      fireEvent.click(resetBtn);
      expect((searchInput as HTMLInputElement).value).toBe('');
      expect(resetBtn).toBeDisabled();
      expect(screen.getByText(/Filters reset to default values/i)).toBeInTheDocument();
    });

    it('exports report data to CSV and provides feedback without remote calls', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Task47ModelWorkReport />
          </AppProviders>
        </MemoryRouter>
      );

      const exportCsvBtn = screen.getByRole('button', { name: /export csv/i });
      fireEvent.click(exportCsvBtn);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(
        screen.getByText(/Exported \d+ model work records to CSV/i)
      ).toBeInTheDocument();
    });

    it('navigates to Order Details when an Order ID button is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Task47ModelWorkReport />
          </AppProviders>
        </MemoryRouter>
      );

      const orderBtn = screen.getByRole('button', { name: '#677201' });
      fireEvent.click(orderBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/order-details?ID=677201');
    });
  });

  describe('OrderDetailsPage Prototype Actions', () => {
    it('handles Dr. Special Request save action with loading feedback and mock notice', async () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);

      // Click Dr. Special Request save button
      fireEvent.click(saveButtons[0]);

      await waitFor(
        () => {
          expect(
            screen.getByText(/Dr\. Special Request saved to local case state\./i)
          ).toBeInTheDocument();
        },
        { timeout: 1500 }
      );
    });

    it('handles Client Note save action with loading feedback', async () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      // Client note save button is the second one
      fireEvent.click(saveButtons[1]);

      await waitFor(
        () => {
          expect(
            screen.getByText(/Client Note saved to case file\./i)
          ).toBeInTheDocument();
        },
        { timeout: 1500 }
      );
    });

    it('handles Internal Case Note dispatching with local mock updates and dispatching state', async () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      const textarea = screen.getByPlaceholderText(/Type internal case instruction/i);
      fireEvent.change(textarea, {
        target: { value: 'Lab team: please check sleeve diameter for implant #19.' },
      });

      const dispatchBtn = screen.getByRole('button', { name: /dispatch note & notify departments/i });
      fireEvent.click(dispatchBtn);

      await waitFor(
        () => {
          expect(
            screen.getByText(/Dispatched to IH \[CS\] and emailed/i)
          ).toBeInTheDocument();
        },
        { timeout: 1500 }
      );

      // Verify the new note was prepended to the table
      expect(
        screen.getByText(/Lab team: please check sleeve diameter for implant #19\./i)
      ).toBeInTheDocument();
    });

    it('triggers mock row click feedback in Sub-Orders breakdown table', () => {
      render(
        <MemoryRouter initialEntries={['/order-details?ID=504901']}>
          <AppProviders>
            <Routes>
              <Route path="/order-details" element={<OrderDetailsPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      // Go to Sub-Orders tab
      const tab3Btn = screen.getByRole('button', { name: /sub-orders matrix/i });
      fireEvent.click(tab3Btn);

      // Target table inside suborders view
      const subOrdersTable = screen.getByRole('table', { name: /sub-orders matrix breakdown table/i });
      const serviceNameInTable = within(subOrdersTable).getByText('Intra-Oral Scan');
      fireEvent.click(serviceNameInTable);

      expect(
        screen.getByText(/Selected Sub-Order: Intra-Oral Scan/i)
      ).toBeInTheDocument();
    });
  });
});
