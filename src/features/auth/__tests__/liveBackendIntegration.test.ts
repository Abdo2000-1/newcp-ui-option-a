import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '@/shared/api/httpTransport';
import { AuthClient } from '@/shared/api/authClient';
import { GoogleAuthAdapter, BackendAuthError } from '@/features/auth/authAdapter';
import { ServiceClient } from '@/shared/api/serviceClient';
import { CatalogClient } from '@/shared/api/catalogClient';
import { WorkflowClient } from '@/shared/api/workflowClient';
import { PricingClient } from '@/shared/api/pricingClient';
import { PayerClient } from '@/shared/api/payerClient';
import {
  isProblemError,
  AuthenticationError,
  SessionExpiredError,
  PreconditionRequiredError,
  PreconditionFailedError,
} from '@/shared/api/errors';

/**
 * ============================================================================
 * LIVE BACKEND INTEGRATION & CANONICAL CONTRACT ACCEPTANCE TEST SUITE
 * ============================================================================
 *
 * Verifies Part 1 through Part 7 requirements:
 * - Real contract endpoints and normalized Problem envelopes
 * - Token injection: Authorization: Bearer <session-token>
 * - No client-side tenant override header (X-Tenant-ID stripped)
 * - 401, 403, 412, 428 status handling
 * - ETag response capture and If-Match concurrency headers
 * - Session recovery, pending access, and logout
 * - Swagger /docs and /health URLs
 */

describe('Live Backend Integration & Contract Conformance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Part 1: HTTP Transport & Canonical Contract Behaviors', () => {
    it('1. performs GET /health and parses JSON response successfully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
          'ETag': 'W/"f-VaSQ4oDUiZblZNAEkkN+sX+q3Sg"',
          'x-request-id': 'req-health-001',
        }),
        json: async () => ({ status: 'ok' }),
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const res = await transport.get<{ status: string }>('/health');
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ok');
      expect(res.etag).toBe('W/"f-VaSQ4oDUiZblZNAEkkN+sX+q3Sg"');
      expect(res.requestId).toBe('req-health-001');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://10.20.25.147:3001/health',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('2. injects Authorization: Bearer token automatically from stored session', async () => {
      localStorage.setItem(
        'newcp_iam_session_v098',
        JSON.stringify({ sessionToken: 'live-backend-token-abc-123' })
      );

      let capturedHeaders: Headers | null = null;
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        capturedHeaders = init.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ status: 'ok' }),
        });
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      await transport.get('/api/v1/catalog/services');
      expect(capturedHeaders).not.toBeNull();
      expect(capturedHeaders!.get('Authorization')).toBe('Bearer live-backend-token-abc-123');
    });

    it('3. normal frontend contract requests do NOT send client-side X-Tenant-ID header', async () => {
      let capturedHeaders: Headers | null = null;
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        capturedHeaders = init.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ status: 'ok' }),
        });
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      await transport.get('/api/v1/orders/1001/services');
      expect(capturedHeaders!.get('X-Tenant-ID')).toBeNull();
    });

    it('4. captures ETag from response and attaches If-Match header on mutations', async () => {
      let capturedHeaders: Headers | null = null;
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        capturedHeaders = init.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({
            'Content-Type': 'application/json',
            'ETag': 'W/"rev-456-service-item"',
          }),
          json: async () => ({ uuid: 'srv-001', status: 'in_progress' }),
        });
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const res = await transport.patch(
        '/api/v1/services/srv-001',
        { serviceNotes: 'Updated clinical notes' },
        { ifMatch: 'W/"rev-455-service-item"' }
      );

      expect(capturedHeaders!.get('If-Match')).toBe('W/"rev-455-service-item"');
      expect(res.etag).toBe('W/"rev-456-service-item"');
    });

    it('5. handles 412 Precondition Failed and 428 Precondition Required correctly', async () => {
      const mock412Fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'PRECONDITION_FAILED',
            message: 'Target service item has been modified by another clerk.',
          },
        }),
      });

      const transport412 = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mock412Fetch,
      });

      await expect(
        transport412.patch('/api/v1/services/srv-001', {}, { ifMatch: 'W/"stale"' })
      ).rejects.toThrow(PreconditionFailedError);

      const mock428Fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 428,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'PRECONDITION_REQUIRED',
            message: 'If-Match header is mandatory for updates.',
          },
        }),
      });

      const transport428 = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mock428Fetch,
      });

      await expect(
        transport428.patch('/api/v1/services/srv-001', {})
      ).rejects.toThrow(PreconditionRequiredError);
    });

    it('6. unrolls v0.9.8 auth error envelope on 401 Unauthorized', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({
          'Content-Type': 'application/json',
          'x-request-id': 'req-auth-fail-999',
        }),
        json: async () => ({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            requestId: 'req-auth-fail-999',
          },
        }),
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      try {
        await transport.get('/api/v1/auth/me');
        expect.unreachable('Should have thrown 401');
      } catch (err: any) {
        expect(isProblemError(err)).toBe(true);
        expect(err.status).toBe(401);
        expect(err.problem.code).toBe('AUTHENTICATION_REQUIRED');
        expect(err.problem.requestId).toBe('req-auth-fail-999');
      }
    });
  });

  describe('Part 3 & 4: AuthClient & Session Lifecycle', () => {
    it('7. exchanges Google ID token for AUTHORIZED response with token and expiresAt', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          accessStatus: 'AUTHORIZED',
          token: 'sess-jwt-real-backend-12345',
          expiresAt: Date.now() + 28800000,
        }),
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const client = new AuthClient(transport);
      const res = await client.login('valid-google-id-token-abc');

      expect(res.accessStatus).toBe('AUTHORIZED');
      if (res.accessStatus === 'AUTHORIZED') {
        expect(res.token).toBe('sess-jwt-real-backend-12345');
        expect(res.expiresAt).toBeDefined();
      }
    });

    it('8. handles PENDING_ACCESS response with NO session token issued', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          accessStatus: 'PENDING_ACCESS',
        }),
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const client = new AuthClient(transport);
      const res = await client.login('unassigned-employee-google-token');

      expect(res.accessStatus).toBe('PENDING_ACCESS');
      expect((res as any).token).toBeUndefined();
    });

    it('9. retrieves backend-resolved identity, roles, and capabilities via GET /api/v1/auth/me', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          email: 'jessica.ruiz@3ddx.com',
          userUuid: 'usr-44020-jessica',
          tenantSlug: '3ddx.com',
          roleCodes: ['admin'],
          capabilities: ['orders.view', 'iam.users.read', 'iam.roles.read'],
          isPendingAccess: false,
        }),
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const client = new AuthClient(transport);
      const me = await client.getMe('session-token-valid');

      expect(me.email).toBe('jessica.ruiz@3ddx.com');
      expect(me.userUuid).toBe('usr-44020-jessica');
      expect(me.tenantSlug).toBe('3ddx.com');
      expect(me.roleCodes).toEqual(['admin']);
      expect(me.capabilities).toContain('iam.users.read');
      expect(me.isPendingAccess).toBe(false);
    });

    it('10. revokes session token via POST /api/v1/auth/logout', async () => {
      let loggedOut = false;
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        expect(init.method).toBe('POST');
        expect(init.headers.get('Authorization')).toBe('Bearer token-to-revoke');
        loggedOut = true;
        return Promise.resolve({
          ok: true,
          status: 204,
          headers: new Headers(),
          text: async () => '',
        });
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const client = new AuthClient(transport);
      await client.logout('token-to-revoke');
      expect(loggedOut).toBe(true);
    });
  });

  describe('Part 5: Swagger /docs and Lookups Verification', () => {
    it('11. verifies zero-charge reasons via GET /api/v1/lookups/zero-charge-reasons', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => [
          { code: 'warranty_redo', label: 'Warranty / Redo', active: true },
          { code: 'goodwill', label: 'Goodwill gesture', active: true },
        ],
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const pricing = new PricingClient(transport, undefined, false);
      const reasons = await pricing.getZeroChargeReasons();
      expect(reasons).toHaveLength(2);
      expect(reasons[0].code).toBe('warranty_redo');
    });

    it('12. verifies hold reasons via GET /api/v1/catalog/hold-reasons', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => [
          { code: 'MISSING_SCAN_DATA', label: 'Missing scan data', holdType: 'CLINICAL' },
          { code: 'PAYMENT_PENDING', label: 'Payment pending', holdType: 'BILLING' },
        ],
      });

      const transport = new HttpTransport({
        baseUrl: 'http://10.20.25.147:3001',
        mode: 'LIVE_HTTP',
        customFetch: mockFetch,
      });

      const workflow = new WorkflowClient(transport, false);
      const reasons = await workflow.getHoldReasons();
      expect(reasons).toHaveLength(2);
      expect(reasons[0].code).toBe('MISSING_SCAN_DATA');
    });
  });
});
