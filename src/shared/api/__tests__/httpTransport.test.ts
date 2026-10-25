import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '../httpTransport';
import { ApiClient } from '../apiClient';
import {
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
  AuthenticationError
} from '../errors';

describe('T-API-002: Contract-Aware HTTP Transport Boundary', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('constructs requests with base URL, paths, and default headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/json',
        'ETag': 'W/"initial-tag"'
      }),
      json: async () => ({ status: 'ok' })
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      customFetch: mockFetch as unknown as typeof fetch
    });

    const res = await transport.get('/health');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
    expect(res.etag).toBe('W/"initial-tag"');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api.example.com/api/v1/health',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });

  it('injects Bearer token and tenant header when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => []
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      getAuthToken: () => 'token-xyz-123',
      customFetch: mockFetch as unknown as typeof fetch
    });

    await transport.get('/catalog/services', { tenantId: 'tenant-clinics-01' });

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-xyz-123');
    expect(headers.get('X-Tenant-ID')).toBe('tenant-clinics-01');
  });

  it('injects If-Match header and captures rotated ETag on mutation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/json',
        'ETag': '"rotated-etag-999"'
      }),
      json: async () => ({ uuid: 'item-1', status: 'in_progress' })
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      customFetch: mockFetch as unknown as typeof fetch
    });

    const res = await transport.patch(
      '/services/item-1',
      { isBillable: true },
      { ifMatch: '"original-etag-111"' }
    );

    expect(res.status).toBe(200);
    expect(res.etag).toBe('"rotated-etag-999"');

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('If-Match')).toBe('"original-etag-111"');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(callArgs[1].body).toBe(JSON.stringify({ isBillable: true }));
  });

  it('throws AuthenticationError when server returns 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        code: 'UNAUTHORIZED',
        message: 'Bearer token expired or invalid'
      })
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      customFetch: mockFetch as unknown as typeof fetch
    });

    await expect(transport.get('/catalog/services')).rejects.toThrow(AuthenticationError);
  });

  it('throws PreconditionRequiredError when server returns 428', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 428,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        code: 'IF_MATCH_REQUIRED',
        message: 'Precondition required for mutation'
      })
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      customFetch: mockFetch as unknown as typeof fetch
    });

    await expect(transport.patch('/services/item-1', {})).rejects.toThrow(PreconditionRequiredError);
  });

  it('throws PreconditionFailedError when server returns 412', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 412,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        code: 'STALE_PRECONDITION',
        message: 'Concurrent conflict'
      })
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      customFetch: mockFetch as unknown as typeof fetch
    });

    await expect(transport.patch('/services/item-1', {}, { ifMatch: '"stale-tag"' })).rejects.toThrow(
      PreconditionFailedError
    );
  });

  it('throws ValidationError with field detail when server returns 422', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        code: 'ZERO_CHARGE_REASON_REQUIRED',
        message: 'Zero line total requires reason',
        details: { field: 'zeroChargeReasonCode' }
      })
    });

    const transport = new HttpTransport({
      baseUrl: 'http://api.example.com/api/v1',
      customFetch: mockFetch as unknown as typeof fetch
    });

    try {
      await transport.post('/services/item-1/pricing', {});
      expect.fail('Expected error was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const valErr = err as ValidationError;
      expect(valErr.field).toBe('zeroChargeReasonCode');
      expect(valErr.code).toBe('ZERO_CHARGE_REASON_REQUIRED');
    }
  });

  it('wires transport into ApiClient without breaking offline mock adapter defaults', () => {
    const client = new ApiClient({ baseUrl: 'http://api.example.com/api/v1' });
    expect(client.transport).toBeDefined();
    expect(typeof client.transport.get).toBe('function');
    expect(client.offlineMockServiceInstances).toBeDefined();
    expect(typeof client.offlineMockServiceInstances.item).toBe('function');
  });
});
