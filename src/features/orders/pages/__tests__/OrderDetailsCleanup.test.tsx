import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetailsPage from '../OrderDetailsPage';
import { AppProviders } from '@/app/providers';

describe('UIUX-DETAILS-001: Order Details Simplification & Read-Only Notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (initialUrl = '/order-details?id=504901') => {
    return render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <AppProviders>
          <Routes>
            <Route path="/order-details" element={<OrderDetailsPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>
    );
  };

  describe('1. Removal of Disallowed Actions & Controls', () => {
    it('does NOT render the Print action button', () => {
      renderComponent();
      expect(screen.queryByRole('button', { name: /^print$/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle(/print clinical prescription/i)).not.toBeInTheDocument();
    });

    it('does NOT render the Copy Summary action button', () => {
      renderComponent();
      expect(screen.queryByRole('button', { name: /copy summary/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle(/copy case prescription summary/i)).not.toBeInTheDocument();
    });

    it('does NOT render the Export action button', () => {
      renderComponent();
      expect(screen.queryByRole('button', { name: /^export$/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle(/download summary file/i)).not.toBeInTheDocument();
    });

    it('does NOT render the Back to Flow action button', () => {
      renderComponent();
      expect(screen.queryByRole('button', { name: /back to flow/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/back to flow/i)).not.toBeInTheDocument();
    });

    it('does NOT render the Status dropdown', () => {
      renderComponent();
      // Verify no select element controls the order status
      const selects = screen.queryAllByRole('combobox');
      selects.forEach((select) => {
        expect(select).not.toHaveValue('In Progress');
        expect(select).not.toHaveValue('Revision Required');
        expect(select).not.toHaveValue('Ready for Manufacture');
      });
      expect(screen.queryByRole('option', { name: /revision required/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /ready for manufacture/i })).not.toBeInTheDocument();
    });
  });

  describe('2. Completely Read-Only Clinical Notes', () => {
    it('renders Dr. Special Request as completely read-only with preserved value', () => {
      renderComponent();

      const readonlyElem = screen.getByTestId('readonly-dr-special-request');
      expect(readonlyElem).toBeInTheDocument();
      // Preserves display of existing value for case 504901
      expect(readonlyElem).toHaveTextContent(/Immediate implant placement planned on site #19/i);

      // Ensures no editing controls or Save button exist for Dr. Special Request
      expect(screen.queryByPlaceholderText(/Enter clinician specific surgical or restoration requests/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save dr\. special request/i })).not.toBeInTheDocument();
    });

    it('renders Sc. Special Request as completely read-only with preserved value and value tag', () => {
      renderComponent();

      const readonlyElem = screen.getByTestId('readonly-sc-special-request');
      expect(readonlyElem).toBeInTheDocument();
      // Preserves display of existing value
      expect(readonlyElem).toHaveTextContent(/General/i);

      // Ensures no select dropdown or number input exist
      expect(screen.queryByRole('option', { name: /urgent pre-check/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /high density mesh/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /fast track delivery/i })).not.toBeInTheDocument();
    });

    it('renders Client Note as completely read-only with preserved value', () => {
      renderComponent();

      const readonlyElem = screen.getByTestId('readonly-client-note');
      expect(readonlyElem).toBeInTheDocument();
      // Preserves display of existing value for case 504901
      expect(readonlyElem).toHaveTextContent(/Please send digital STL plan approval link before milling guide/i);

      // Ensures no editing controls or Save button exist for Client Note
      expect(screen.queryByPlaceholderText(/Add client portal communication notes/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save client note/i })).not.toBeInTheDocument();
    });

    it('preserves fallback values for cases without custom clinical notes', () => {
      // Order 504902 in mock data
      renderComponent('/order-details?id=504902');

      const drElem = screen.getByTestId('readonly-dr-special-request');
      expect(drElem).toBeInTheDocument();

      const scElem = screen.getByTestId('readonly-sc-special-request');
      expect(scElem).toBeInTheDocument();
      expect(scElem).toHaveTextContent(/Not available/i);

      const clientElem = screen.getByTestId('readonly-client-note');
      expect(clientElem).toBeInTheDocument();
      expect(clientElem).toHaveTextContent(/Not available/i);
    });
  });

  describe('3. Visual Hierarchy, Spacing & Preserved Invariants', () => {
    it('renders case header, order reference, and copy ID action cleanly', () => {
      renderComponent();

      expect(screen.getByText('#504901')).toBeInTheDocument();
      expect(screen.getByTitle(/copy id/i)).toBeInTheDocument();
    });

    it('resolves ID from uppercase ?ID= parameter as well as lowercase ?id=', () => {
      renderComponent('/order-details?ID=504901');

      expect(screen.getByText('#504901')).toBeInTheDocument();
      expect(screen.getByText(/Immediate implant placement planned/i)).toBeInTheDocument();
    });
  });
});
