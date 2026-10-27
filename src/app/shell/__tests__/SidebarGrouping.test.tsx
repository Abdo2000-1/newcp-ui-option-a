import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';

describe('Sidebar Grouping & Active Highlighting (Task 3.1 & 3.2)', () => {
  it('renders section headers when expanded', () => {
    render(
      <BrowserRouter>
        <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Laboratory & Production')).toBeInTheDocument();
    expect(screen.getByText('Operations & Reports')).toBeInTheDocument();
    expect(screen.getByText('Directories & CRM')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('hides section header titles when collapsed', () => {
    render(
      <BrowserRouter>
        <Sidebar collapsed={true} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument();
    expect(screen.queryByText('Laboratory & Production')).not.toBeInTheDocument();
  });

  it('highlights Orders Flow when on /order-details deep link', () => {
    render(
      <MemoryRouter initialEntries={['/order-details?id=ord-101']}>
        <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
      </MemoryRouter>
    );

    const ordersLink = screen.getByText('Orders Flow').closest('button');
    expect(ordersLink).toBeInTheDocument();
    // In active state, borderLeft is '3px solid #0284c7'
    expect(ordersLink).toHaveStyle({ borderLeft: '3px solid #0284c7' });
  });

  it('highlights Reports Hub when on /quarter-targets deep link', () => {
    render(
      <MemoryRouter initialEntries={['/quarter-targets']}>
        <Sidebar collapsed={false} onToggle={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
      </MemoryRouter>
    );

    const reportsLink = screen.getByText('Reports Hub').closest('button');
    expect(reportsLink).toBeInTheDocument();
    expect(reportsLink).toHaveStyle({ borderLeft: '3px solid #0284c7' });
  });
});
