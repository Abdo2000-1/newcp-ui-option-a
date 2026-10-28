import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ApiDocsPage from '../ApiDocsPage';
import { AppProviders } from '@/app/providers';

describe('ApiDocsPage (Swagger / API Documentation Gateway)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders Swagger API documentation gateway and contract status', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    expect(screen.getByTestId('api-docs-page')).toBeInTheDocument();
    expect(screen.getByText(/Swagger & OpenAPI Documentation Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Authoritative Specification: OpenAPI 3.0.3/i)).toBeInTheDocument();
    expect(screen.getByText(/Approved OpenAPI 3.0.3 Contract Endpoints/i)).toBeInTheDocument();
  });

  it('allows configuring Swagger host IP and persists to localStorage', async () => {
    // Mock global fetch for health check
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

  it('renders all approved contract endpoints in the inventory', () => {
    render(
      <AppProviders>
        <ApiDocsPage />
      </AppProviders>
    );

    expect(screen.getByText('/health')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/session/context')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/catalog/services')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/orders/{orderId}/services')).toBeInTheDocument();
  });
});
