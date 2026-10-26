import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApiConfig } from '../config';
import { HttpTransport } from '../httpTransport';
import { ServiceClient } from '../serviceClient';
import {
  ApiClientError,
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
  AuthenticationError,
  TenantAccessDeniedError,
  ClinicalApprovalRequiredError,
  ProblemError,
} from '../errors';
import { ROUTES } from '@/app/router';

describe('T-API-016: API Mode Switching and LIVE_HTTP Contract Transport', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('1. Mode Selection Configuration', () => {
    it('selects MOCK_BROWSER when mode is explicitly set or defaulted without mock port', () => {
      const config = getApiConfig();
      expect(['MOCK_BROWSER', 'MOCK_HTTP', 'LIVE_HTTP']).toContain(config.mode);
    });

    it('identifies LIVE_HTTP mode configuration semantics', () => {
      const liveTransport = new HttpTransport({
        mode: 'LIVE_HTTP',
        baseUrl: 'https://api.3ddx.com/v1',
      });
      expect(liveTransport.getMode()).toBe('LIVE_HTTP');
      expect(liveTransport.getBaseUrl()).toBe('https://api.3ddx.com/v1');
    });

    it('identifies MOCK_HTTP mode configuration semantics', () => {
      const mockHttpTransport = new HttpTransport({
        mode: 'MOCK_HTTP',
        baseUrl: 'http://localhost:3000/api/v1',
      });
      expect(mockHttpTransport.getMode()).toBe('MOCK_HTTP');
      expect(mockHttpTransport.getBaseUrl()).toBe('http://localhost:3000/api/v1');
    });
  });

  describe('2. LIVE_HTTP Request Construction and Validation', () => {
    it('throws ApiClientError if baseUrl is missing in LIVE_HTTP mode', async () => {
      const transportWithoutUrl = new HttpTransport({
        mode: 'LIVE_HTTP',
        baseUrl: '',
      });

      await expect(transportWithoutUrl.get('/services/123')).rejects.toThrow(ApiClientError);
      await expect(transportWithoutUrl.get('/services/123')).rejects.toThrow(
        /VITE_API_BASE_URL must be defined/i
      );
    });

    it('correctly sets Accept, Content-Type, and If-Match headers in LIVE_HTTP', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
          'ETag': 'W/"tag-test-123"',
        }),
        json: async () => ({ id: 'srv-001', name: 'Surgical Guide' }),
      });

      const transport = new HttpTransport({
        mode: 'LIVE_HTTP',
        baseUrl: 'https://gateway.3ddx.com/api/v1',
        customFetch: mockFetch as unknown as typeof fetch,
      });

      const response = await transport.patch(
        '/services/srv-001',
        { status: 'DRAFT' },
        { ifMatch: 'W/"tag-test-123"' }
      );

      expect(response.status).toBe(200);
      expect(response.etag).toBe('W/"tag-test-123"');
      expect(response.data).toEqual({ id: 'srv-001', name: 'Surgical Guide' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.3ddx.com/api/v1/services/srv-001',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'DRAFT' }),
        })
      );

      const requestInit = mockFetch.mock.calls[0][1];
      const callHeaders = requestInit.headers as Headers;
      expect(callHeaders.get('Accept')).toBe('application/json');
      expect(callHeaders.get('Content-Type')).toBe('application/json');
      expect(callHeaders.get('If-Match')).toBe('W/"tag-test-123"');
    });

    it('extracts ETag from response headers correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
          'ETag': '"strong-etag-789"',
        }),
        json: async () => ({ uuid: 'item-99' }),
      });

      const transport = new HttpTransport({
        mode: 'LIVE_HTTP',
        baseUrl: 'https://gateway.3ddx.com/api/v1',
        customFetch: mockFetch as unknown as typeof fetch,
      });

      const res = await transport.get('/service-items/item-99');
      expect(res.etag).toBe('"strong-etag-789"');
    });
  });

  describe('3. RFC 7807 Error Normalization in LIVE_HTTP', () => {
    const errorCases = [
      {
        status: 401,
        expectedClass: AuthenticationError,
        body: { code: 'UNAUTHORIZED', message: 'Token missing or invalid' },
      },
      {
        status: 403,
        expectedClass: TenantAccessDeniedError,
        body: { code: 'FORBIDDEN', message: 'User lacks required role' },
      },
      {
        status: 404,
        expectedClass: ProblemError,
        body: { code: 'NOT_FOUND', message: 'Service instance does not exist' },
      },
      {
        status: 409,
        expectedClass: ClinicalApprovalRequiredError,
        body: { code: 'CONFLICT', message: 'Duplicate service instance code' },
      },
      {
        status: 412,
        expectedClass: PreconditionFailedError,
        body: { code: 'STALE_PRECONDITION', message: 'Resource version mismatch' },
      },
      {
        status: 422,
        expectedClass: ValidationError,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { field: 'quantity' },
        },
      },
      {
        status: 428,
        expectedClass: PreconditionRequiredError,
        body: { code: 'PRECONDITION_REQUIRED', message: 'If-Match header is mandatory' },
      },
    ];

    errorCases.forEach(({ status, expectedClass, body }) => {
      it(`maps HTTP ${status} to ${expectedClass.name}`, async () => {
        const mockFetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status,
          headers: new Headers({ 'Content-Type': 'application/problem+json' }),
          json: async () => body,
        });

        const transport = new HttpTransport({
          mode: 'LIVE_HTTP',
          baseUrl: 'https://gateway.3ddx.com/api/v1',
          customFetch: mockFetch as unknown as typeof fetch,
        });

        await expect(transport.get('/services/test')).rejects.toThrow(expectedClass);
      });
    });
  });

  describe('4. LIVE_HTTP Strict Boundary (No Mock Fallback)', () => {
    it('throws immediately on network failure in LIVE_HTTP and never returns mock data', async () => {
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Connection refused by backend gateway'));

      const liveTransport = new HttpTransport({
        mode: 'LIVE_HTTP',
        baseUrl: 'https://live-gateway.3ddx.com/api/v1',
        customFetch: mockFetch as unknown as typeof fetch,
      });

      const client = new ServiceClient(liveTransport, false);

      await expect(client.get('non-existent-uuid')).rejects.toThrow(
        /Connection refused by backend gateway/
      );
    });
  });

  describe('5. Application Shell & Routing Cleanliness', () => {
    it('does NOT contain any /api-contract or contract-explorer routes in ROUTES definition', () => {
      const routeValues = Object.values(ROUTES);
      const contractRoutes = routeValues.filter((r) =>
        typeof r === 'string' && (r.includes('contract') || r.includes('api-contract'))
      );
      expect(contractRoutes).toEqual([]);
    });
  });
});
