import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkflowBoard from '../WorkflowBoard';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../../public/data/orders.json';

describe('Workflow Board Header & Filter Clean-up (UIUX-REQ-013)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  describe('Page Header & Actions', () => {
    it('renders the clean page header with title, subtitle, and active cases badge', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workflow/i);
      expect(screen.getByText(/active cases/i)).toBeInTheDocument();
      expect(screen.getByText(/real-time stage tracking and case progression/i)).toBeInTheDocument();
    });

    it('renders navigation action buttons for Orders Flow and New Case', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const flowBtn = screen.getByRole('link', { name: /orders flow/i });
      expect(flowBtn).toBeInTheDocument();
      expect(flowBtn).toHaveAttribute('href', '/flow');

      const newCaseBtn = screen.getByRole('link', { name: /new case/i });
      expect(newCaseBtn).toBeInTheDocument();
      expect(newCaseBtn).toHaveAttribute('href', '/add-case');
    });
  });

  describe('Search & Filter Controls', () => {
    it('renders the search input with accessible label and placeholder', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search by case #'));
    });

    it('filters cases when user searches by order number', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'DL-024001' } });

      expect(screen.getByText('DL-024001')).toBeInTheDocument();
      expect(screen.getByText(/showing 1 of/i)).toBeInTheDocument();
    });

    it('filters cases when user searches by patient name', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'Alice Johnson' } });

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('DL-024001')).toBeInTheDocument();
    });

    it('clears search input when clear button (X) is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      const clearBtn = screen.getByRole('button', { name: /clear search query/i });
      fireEvent.click(clearBtn);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Stage Selection & Pills', () => {
    it('renders All Stages tab and all 7 production stages with case counts', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByRole('tab', { name: /all stages/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /new intake/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /clinical review/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /cad design/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /milling & print/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /qc & polish/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ready \/ dispatch/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /delivered \/ done/i })).toBeInTheDocument();
    });

    it('switches to single stage view when a stage pill is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const designTab = screen.getByRole('tab', { name: /cad design/i });
      fireEvent.click(designTab);

      expect(screen.getByRole('button', { name: /back to all stages/i })).toBeInTheDocument();
    });

    it('returns to all stages when "Back to All Stages" is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const reviewTab = screen.getByRole('tab', { name: /clinical review/i });
      fireEvent.click(reviewTab);

      const backBtn = screen.getByRole('button', { name: /back to all stages/i });
      fireEvent.click(backBtn);

      expect(screen.queryByRole('button', { name: /back to all stages/i })).not.toBeInTheDocument();
    });
  });

  describe('Combined Filters & Active Filter Chips', () => {
    it('displays active filter chips for stage and search query', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      // Apply stage
      const newIntakeTab = screen.getByRole('tab', { name: /new intake/i });
      fireEvent.click(newIntakeTab);

      // Apply search
      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
      expect(screen.getByText(/stage: new intake/i)).toBeInTheDocument();
      expect(screen.getByText(/search: "alice"/i)).toBeInTheDocument();
    });

    it('clears individual filter chip when delete icon is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      const searchChip = screen.getByText(/search: "alice"/i).closest('div');
      const deleteIcon = searchChip?.querySelector('.MuiChip-deleteIcon') || searchChip?.querySelector('svg');
      expect(deleteIcon).toBeInTheDocument();
      fireEvent.click(deleteIcon!);

      expect(searchInput).toHaveValue('');
    });

    it('resets all filters when "Clear all" button is clicked', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const newIntakeTab = screen.getByRole('tab', { name: /new intake/i });
      fireEvent.click(newIntakeTab);

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearAllBtn);

      expect(searchInput).toHaveValue('');
      expect(screen.queryByText(/active filters/i)).not.toBeInTheDocument();
    });
  });

  describe('Empty and Filtered-Empty States', () => {
    it('displays filtered empty state with reset button when search has no matches', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const searchInput = screen.getByRole('textbox', { name: /search workflow cases/i });
      fireEvent.change(searchInput, { target: { value: 'NonExistentCaseXYZ-99999' } });

      expect(screen.getByText(/no matching workflow cases/i)).toBeInTheDocument();
      expect(screen.getByText(/no cases match your active filters/i)).toBeInTheDocument();

      // Reset button inside empty state
      const resetBtn = screen.getByRole('button', { name: /reset all filters/i });
      fireEvent.click(resetBtn);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText(/DL-024001/i)).toBeInTheDocument();
    });

    it('displays empty state when no orders exist in store', () => {
      (store as unknown as { orders: Order[]; notify: () => void }).orders = [];
      (store as unknown as { notify: () => void }).notify();

      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText(/no workflow cases/i)).toBeInTheDocument();
    });
  });

  describe('Quick Stage Move Interaction', () => {
    it('allows changing stage via card select and shows feedback message', async () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      const stageSelects = screen.getAllByLabelText(/change stage for case/i);
      expect(stageSelects.length).toBeGreaterThan(0);

      fireEvent.change(stageSelects[0], { target: { value: 'Design' } });

      await waitFor(() => {
        expect(screen.getByText(/moved to design/i)).toBeInTheDocument();
      });
    });
  });
});
