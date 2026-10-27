import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderDetailsPage from '../OrderDetailsPage';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../../public/data/orders.json';

describe('Order Details Hierarchy & Action Toolbar (Task 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  it('renders streamlined primary action toolbar with Approve, Hold, and Edit', () => {
    render(
      <MemoryRouter initialEntries={['/order-details?id=ord-1']}>
        <AppProviders>
          <OrderDetailsPage />
        </AppProviders>
      </MemoryRouter>
    );

    const toolbar = screen.getByTestId('primary-action-toolbar');
    expect(toolbar).toBeInTheDocument();

    expect(screen.getByTestId('action-approve-case')).toBeInTheDocument();
    expect(screen.getByTestId('action-hold-case')).toBeInTheDocument();
    expect(screen.getByTestId('action-edit-case')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('triggers functional feedback when Approve and Hold actions are clicked', () => {
    render(
      <MemoryRouter initialEntries={['/order-details?id=ord-1']}>
        <AppProviders>
          <OrderDetailsPage />
        </AppProviders>
      </MemoryRouter>
    );

    const approveBtn = screen.getByTestId('action-approve-case');
    fireEvent.click(approveBtn);
    expect(screen.getByText(/Approved case/i)).toBeInTheDocument();

    const holdBtn = screen.getByTestId('action-hold-case');
    fireEvent.click(holdBtn);
    expect(screen.getByText(/clinical hold/i)).toBeInTheDocument();
  });

  it('renders sub-orders matrix breakdown table without broken characters', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/order-details?id=ord-1']}>
        <AppProviders>
          <OrderDetailsPage />
        </AppProviders>
      </MemoryRouter>
    );

    const html = container.innerHTML;
    expect(html).not.toContain('ÔÇó');
    expect(html).not.toContain('\ufffd');
  });
});
