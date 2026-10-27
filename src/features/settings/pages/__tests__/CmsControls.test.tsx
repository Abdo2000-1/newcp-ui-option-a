import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CmsControls from '../CmsControls';
import { AppProviders } from '@/app/providers';
import { AuthProvider } from '@/features/auth/AuthContext';

function renderCmsControls() {
  return render(
    <MemoryRouter initialEntries={['/cms']}>
      <AuthProvider>
        <AppProviders>
          <CmsControls />
        </AppProviders>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Local Admin/Senior CMS Controls (CMS-001)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders page header and prominent frontend demo simulation banner', () => {
    renderCmsControls();

    expect(screen.getByText(/CMS Configuration & Senior Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend Demo Controls — Local In-Memory & Storage State Only/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL IAM authorization/i)).toBeInTheDocument();
  });

  it('renders workstation appearance controls with theme and density options', () => {
    renderCmsControls();

    expect(screen.getByText(/Workstation Appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Color Theme/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comfortable/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compact/i })).toBeInTheDocument();
  });

  it('toggles density and persists feature flag changes locally', () => {
    renderCmsControls();

    const compactBtn = screen.getByRole('button', { name: /compact/i });
    fireEvent.click(compactBtn);

    // Toggle multi-unit batch queue switch
    const batchSwitch = screen.getByLabelText(/Multi-Unit Batch Queue/i);
    expect(batchSwitch).toBeChecked();

    fireEvent.click(batchSwitch);
    expect(batchSwitch).not.toBeChecked();

    const stored = JSON.parse(localStorage.getItem('newcp_local_cms_flags') || '{}');
    expect(stored.batchQueue).toBe(false);
  });

  it('displays read-only active IAM authorization context', () => {
    renderCmsControls();

    expect(screen.getByText(/Active IAM Authorization Context/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL V3 Schema • Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL IAM & Casbin Guarded/i)).toBeInTheDocument();
  });

  it('resets local demo flags to default when reset button is clicked', () => {
    renderCmsControls();

    // Toggle a switch off first
    const batchSwitch = screen.getByLabelText(/Multi-Unit Batch Queue/i);
    fireEvent.click(batchSwitch);
    expect(batchSwitch).not.toBeChecked();

    // Click reset
    const resetBtn = screen.getByRole('button', { name: /reset local demo flags/i });
    fireEvent.click(resetBtn);

    // Switches restore to default
    expect(batchSwitch).toBeChecked();
  });
});
