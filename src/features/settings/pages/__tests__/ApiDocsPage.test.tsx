import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ApiDocsPage from '../ApiDocsPage';
import { AppProviders } from '@/app/providers';

describe('ApiDocsPage (Live Swagger / OpenAPI Documentation Gateway - FE-SWAGGER-V098-001)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. renders Swagger & OpenAPI Documentation Gateway heading and contract alerts', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    expect(screen.getByTestId('api-docs-page')).toBeInTheDocument();
    expect(screen.getByText(/Swagger & OpenAPI Documentation Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Authoritative Specification: OpenAPI 3.0.3/i)).toBeInTheDocument();
    expect(screen.getByText(/Canonical contract specification is located at/i)).toBeInTheDocument();
  });

  it('2. points to backend /docs and renders live iframe container', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    const iframe = screen.getByTestId('swagger-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', expect.stringContaining('/docs'));
  });

  it('3. provides prominent Direct Open action and iframe fallback for X-Frame-Options/CSP restrictions', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    // Header direct open button
    const directOpenBtn = screen.getByTestId('direct-open-swagger-button');
    expect(directOpenBtn).toBeInTheDocument();
    expect(directOpenBtn).toHaveAttribute('href', expect.stringContaining('/docs'));
    expect(directOpenBtn).toHaveAttribute('target', '_blank');

    // Fallback notice alert
    expect(screen.getByTestId('iframe-fallback-alert')).toBeInTheDocument();
    expect(screen.getByText(/Browser Frame Policy & CSP Fallback/i)).toBeInTheDocument();
    expect(screen.getByText(/X-Frame-Options: SAMEORIGIN/i)).toBeInTheDocument();
  });

  it('4. allows configuring Swagger host IP and persists to localStorage', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    const input = screen.getByLabelText(/Swagger IP \/ Host URL/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'http://192.168.1.100:8080' } });
    const testBtn = screen.getByRole('button', { name: /verify & save ip/i });
    fireEvent.click(testBtn);

    expect(localStorage.getItem('3ddx-swagger-host')).toBe('http://192.168.1.100:8080');
    expect(fetchMock).toHaveBeenCalledWith('http://192.168.1.100:8080/health', expect.any(Object));

    await waitFor(() => {
      expect(screen.getByText(/live backend service verified and healthy/i)).toBeInTheDocument();
    });
  });

  it('5. switches to Contract Status & Endpoints Matrix tab and renders categories', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    // Switch to matrix tab
    const matrixTab = screen.getByTestId('tab-contract-matrix');
    fireEvent.click(matrixTab);

    expect(screen.getByTestId('contract-matrix-view')).toBeInTheDocument();

    // Verify Canonical endpoints are rendered
    expect(screen.getByText('/api/v1/auth/login')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/auth/me')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/auth/logout')).toBeInTheDocument();
    expect(screen.getByText('/health')).toBeInTheDocument();

    // Verify Proposed Dashboard endpoints are rendered and clearly labeled
    expect(screen.getByText('/api/v1/orders/dashboard-summary')).toBeInTheDocument();
    expect(screen.getAllByText(/Proposed Dashboard \(Draft\)/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/PROPOSED DRAFT ONLY \(02_ORDERS_DASHBOARD_PROPOSED_EXTENSION\.yaml\)\. NOT INTEGRATED on frontend\./i)).toBeInTheDocument();
  });

  it('6. filters endpoints correctly by status (Canonical, Proposed, Mock, Unavailable)', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    fireEvent.click(screen.getByTestId('tab-contract-matrix'));

    // Filter Canonical only
    const canonicalFilterChip = screen.getByTestId('filter-chip-canonical');
    fireEvent.click(canonicalFilterChip);

    expect(screen.getByText('/api/v1/auth/login')).toBeInTheDocument();
    expect(screen.queryByText('/api/v1/orders/dashboard-summary')).not.toBeInTheDocument();

    // Filter Proposed Dashboard only
    const proposedFilterChip = screen.getByTestId('filter-chip-proposed');
    fireEvent.click(proposedFilterChip);

    expect(screen.getByText('/api/v1/orders/dashboard-summary')).toBeInTheDocument();
    expect(screen.queryByText('/api/v1/auth/login')).not.toBeInTheDocument();
  });

  it('7. renders correctly when routed via /swagger or /api-docs', () => {
    render(
      <MemoryRouter initialEntries={['/swagger']}>
        <AppProviders>
          <Routes>
            <Route path="/swagger" element={<ApiDocsPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>
    );

    expect(screen.getByTestId('api-docs-page')).toBeInTheDocument();
  });
});
