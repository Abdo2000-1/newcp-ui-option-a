import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';

describe('Sidebar Grouping (Task 3.1)', () => {
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
});
