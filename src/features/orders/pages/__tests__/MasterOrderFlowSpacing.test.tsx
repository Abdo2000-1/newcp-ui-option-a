import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Flow, { ALL_COLUMNS } from '../Flow';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../../public/data/orders.json';

describe('Master Order Flow Table Spacing & Scrolling (Task 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = ordersData as Order[];
    (store as unknown as { notify: () => void }).notify();
  });

  it('widens critical clinician columns for breathing room and readability', () => {
    const scanCenterCol = ALL_COLUMNS.find((c) => c.key === 'scanCenter');
    const doctorCol = ALL_COLUMNS.find((c) => c.key === 'doctor');
    const patientCol = ALL_COLUMNS.find((c) => c.key === 'patient');
    const orderCol = ALL_COLUMNS.find((c) => c.key === 'order');

    expect(scanCenterCol?.baseWidth).toBeGreaterThanOrEqual(11.0);
    expect(doctorCol?.baseWidth).toBeGreaterThanOrEqual(11.0);
    expect(patientCol?.baseWidth).toBeGreaterThanOrEqual(11.0);
    expect(orderCol?.baseWidth).toBeGreaterThanOrEqual(12.0);
  });

  it('preserves all 22 clinical columns and tools', () => {
    expect(ALL_COLUMNS).toHaveLength(22);

    const keys = ALL_COLUMNS.map((c) => c.key);
    expect(keys).toContain('tl');
    expect(keys).toContain('scanCenter');
    expect(keys).toContain('doctor');
    expect(keys).toContain('patient');
    expect(keys).toContain('lock');
    expect(keys).toContain('notes');
    expect(keys).toContain('archive');
    expect(keys).toContain('order');
    expect(keys).toContain('billTo');
    expect(keys).toContain('max');
    expect(keys).toContain('mand');
    expect(keys).toContain('format');
    expect(keys).toContain('amount');
    expect(keys).toContain('vouch');
    expect(keys).toContain('received');
    expect(keys).toContain('sent');
    expect(keys).toContain('update');
    expect(keys).toContain('charged');
    expect(keys).toContain('action');
    expect(keys).toContain('cr');
    expect(keys).toContain('csTask');
  });

  it('renders table container with responsive horizontal scroll enabled', () => {
    render(
      <BrowserRouter>
        <AppProviders>
          <Flow />
        </AppProviders>
      </BrowserRouter>
    );

    const container = screen.getByTestId('flow-table-container');
    expect(container).toBeInTheDocument();
    expect(container.className).toContain('overflow-x-auto');
    expect(container.className).not.toContain('sm:overflow-x-visible');
  });
});
