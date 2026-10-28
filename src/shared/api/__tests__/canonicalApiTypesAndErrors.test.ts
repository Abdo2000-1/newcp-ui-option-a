import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeProblemError,
  isProblemError,
  isAccessNotAssignedError,
  isSessionExpiredError,
  isPreconditionFailedError,
  isPreconditionRequiredError,
  AccessNotAssignedError,
  SessionExpiredError,
  AuthenticationError,
  AuthenticationRequiredError,
  TenantNotAssignedError,
  InsufficientPermissionsError,
  ClinicalApprovalRequiredError,
  PreconditionFailedError,
  PreconditionRequiredError,
  ValidationError,
  ProblemError,
} from '../errors';
import { AuthClient } from '../authClient';
import type {
  AuthorizedLoginResponse,
  AuthMeResponse,
  AuthErrorEnvelope,
} from '../contractTypes';

describe('Canonical API Types & Error Normalization (v0.9.8)', () => {
  describe('Error Normalization & Distinguishability', () => {
    it('normalizes 401 with SESSION_EXPIRED code', () => {
      const err = normalizeProblemError(401, { code: 'SESSION_EXPIRED', message: 'Session timed out' });
      expect(err).toBeInstanceOf(SessionExpiredError);
      expect(err.status).toBe(401);
      expect(isSessionExpiredError(err)).toBe(true);
    });

    it('normalizes 401 with AUTHENTICATION_REQUIRED code', () => {
      const err = normalizeProblemError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Auth required' });
      expect(err).toBeInstanceOf(AuthenticationRequiredError);
      expect(err.status).toBe(401);
    });

    it('normalizes generic 401 to AuthenticationError', () => {
      const err = normalizeProblemError(401, 'Invalid credentials');
      expect(err).toBeInstanceOf(AuthenticationError);
      expect(err.status).toBe(401);
    });

    it('normalizes 403 with ACCESS_NOT_ASSIGNED to AccessNotAssignedError with exact message', () => {
      const err = normalizeProblemError(403, { code: 'ACCESS_NOT_ASSIGNED', message: 'Custom message' });
      expect(err).toBeInstanceOf(AccessNotAssignedError);
      expect(err.status).toBe(403);
      expect(isAccessNotAssignedError(err)).toBe(true);
    });

    it('AccessNotAssignedError has exact approved v0.9.8 default message', () => {
      const defaultErr = new AccessNotAssignedError();
      expect(defaultErr.message).toBe('Your account is authenticated, but access has not been assigned yet.');
      expect(defaultErr.status).toBe(403);
      expect(defaultErr.code).toBe('ACCESS_NOT_ASSIGNED');
    });

    it('normalizes 403 with TENANT_NOT_ASSIGNED', () => {
      const err = normalizeProblemError(403, { code: 'TENANT_NOT_ASSIGNED', message: 'Tenant not assigned' });
      expect(err).toBeInstanceOf(TenantNotAssignedError);
      expect(err.status).toBe(403);
    });

    it('normalizes 403 with PERMISSION_DENIED', () => {
      const err = normalizeProblemError(403, { code: 'PERMISSION_DENIED', message: 'Access denied' });
      expect(err).toBeInstanceOf(InsufficientPermissionsError);
      expect(err.status).toBe(403);
    });

    it('normalizes 409 to ClinicalApprovalRequiredError', () => {
      const err = normalizeProblemError(409, { message: 'Conflict' });
      expect(err).toBeInstanceOf(ClinicalApprovalRequiredError);
      expect(err.status).toBe(409);
    });

    it('normalizes 412 (stale ETag) to PreconditionFailedError', () => {
      const err = normalizeProblemError(412, { code: 'STALE_PRECONDITION', message: 'Resource changed' });
      expect(err).toBeInstanceOf(PreconditionFailedError);
      expect(err.status).toBe(412);
      expect(isPreconditionFailedError(err)).toBe(true);
    });

    it('normalizes 428 (missing If-Match) to PreconditionRequiredError', () => {
      const err = normalizeProblemError(428, { code: 'PRECONDITION_REQUIRED', message: 'If-Match missing' });
      expect(err).toBeInstanceOf(PreconditionRequiredError);
      expect(err.status).toBe(428);
      expect(isPreconditionRequiredError(err)).toBe(true);
    });

    it('normalizes 422 to ValidationError', () => {
      const err = normalizeProblemError(422, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload',
        details: { field: 'answers' },
      });
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.status).toBe(422);
      expect((err as ValidationError).field).toBe('answers');
    });

    it('unwraps v0.9.8 nested auth error envelope { error: Problem }', () => {
      const authErrorPayload: AuthErrorEnvelope = {
        error: {
          code: 'ACCESS_NOT_ASSIGNED',
          message: 'Access has not been assigned',
          requestId: 'req-123',
        },
      };
      const err = normalizeProblemError(403, authErrorPayload);
      expect(err).toBeInstanceOf(AccessNotAssignedError);
      expect(err.status).toBe(403);
      expect((err as ProblemError).requestId).toBe('req-123');
    });

    it('type guard isProblemError detects ProblemError and its subclasses', () => {
      expect(isProblemError(new ProblemError(500, { code: 'ERR', message: 'Error' }))).toBe(true);
      expect(isProblemError(new AccessNotAssignedError())).toBe(true);
      expect(isProblemError(new Error('Generic'))).toBe(false);
    });
  });

  describe('AuthClient (v0.9.8 Contract)', () => {
    let client: AuthClient;

    beforeEach(() => {
      client = new AuthClient();
    });

    it('returns AUTHORIZED response with token and expiresAt for valid demo token', async () => {
      const res = await client.login('valid-google-id-token-cs');
      expect(res.accessStatus).toBe('AUTHORIZED');
      const authRes = res as AuthorizedLoginResponse;
      expect(authRes.token).toBeDefined();
      expect(authRes.token).toContain('sess-v098');
      expect(authRes.expiresAt).toBeGreaterThan(Date.now());
    });

    it('returns PENDING_ACCESS response with NO session token for unassigned token', async () => {
      const res = await client.login('unassigned-user-token');
      expect(res.accessStatus).toBe('PENDING_ACCESS');
      expect((res as any).token).toBeUndefined();
    });

    it('throws error for invalid token', async () => {
      await expect(client.login('invalid')).rejects.toThrow();
    });

    it('throws error when idToken is empty', async () => {
      await expect(client.login('')).rejects.toThrow('Google ID token is required');
    });

    it('getMe returns backend-resolved identity and capabilities for authorized session', async () => {
      const me: AuthMeResponse = await client.getMe('sess-v098-cs-token');
      expect(me.email).toBe('cs.demo@3ddx.com');
      expect(me.userUuid).toBe('usr-cs-001');
      expect(me.tenantSlug).toBe('3ddx.com');
      expect(me.roleCodes).toContain('cs_operator');
      expect(me.capabilities).toContain('orders.view');
      expect(me.capabilities).toContain('services.models.edit');
      expect(me.isPendingAccess).toBe(false);
    });

    it('getMe reflects pending access when session is unassigned', async () => {
      const me: AuthMeResponse = await client.getMe('sess-v098-unassigned-token');
      expect(me.email).toBe('unassigned@3ddx.com');
      expect(me.roleCodes).toHaveLength(0);
      expect(me.capabilities).toHaveLength(0);
      expect(me.isPendingAccess).toBe(true);
    });

    it('getMe throws SessionExpiredError for expired session', async () => {
      await expect(client.getMe('sess-expired-token')).rejects.toThrow(SessionExpiredError);
    });

    it('logout succeeds without error', async () => {
      await expect(client.logout('sess-token')).resolves.toBeUndefined();
    });
  });
});