import { describe, it, expect } from 'vitest';
import {
  ApiClientError,
  AuthenticationError,
  TenantAccessDeniedError,
  ClinicalApprovalRequiredError,
} from '../errors';

describe('Domain and API Client Errors', () => {
  it('creates ApiClientError with proper status and details', () => {
    const err = new ApiClientError(500, 'Server failure', 'Database connection refused', 'INTERNAL_ERROR', 'case-101');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.name).toBe('ApiClientError');
    expect(err.status).toBe(500);
    expect(err.message).toBe('Server failure');
    expect(err.detail).toBe('Database connection refused');
    expect(err.type).toBe('INTERNAL_ERROR');
    expect(err.instance).toBe('case-101');
  });

  it('creates AuthenticationError with 401 status and default message', () => {
    const err = new AuthenticationError();
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.status).toBe(401);
    expect(err.name).toBe('AuthenticationError');
    expect(err.message).toBe('Authentication failed or session expired');
  });

  it('creates TenantAccessDeniedError with 403 status', () => {
    const err = new TenantAccessDeniedError();
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.status).toBe(403);
    expect(err.name).toBe('TenantAccessDeniedError');
    expect(err.message).toBe('Access to this tenant or clinic is denied');
  });

  it('creates ClinicalApprovalRequiredError with 409 status for manufacturing block', () => {
    const err = new ClinicalApprovalRequiredError();
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.status).toBe(409);
    expect(err.name).toBe('ClinicalApprovalRequiredError');
    expect(err.message).toBe('Physical manufacturing requires verified doctor approval');
  });
});
