import { describe, it, expect, beforeEach } from 'vitest';
import {
  GoogleAuthAdapter,
  GoogleAuthError,
  BackendAuthError,
  ContractGapError,
} from '../authAdapter';

/**
 * ============================================================================
 * AUTH ADAPTER UNIT TESTS (TASK: FE-AUTH-GOOGLE-LOGIN-UI-COMPLETE)
 * ============================================================================
 *
 * Verifies:
 * 1. Google configuration detection (reports unconfigured when placeholder or absent).
 * 2. Contract gap detection (POST /api/v1/auth/login is not available).
 * 3. Token exchange validation (rejects empty/invalid tokens).
 * 4. Synthetic boundary resolution for demo accounts.
 */

describe('GoogleAuthAdapter Boundary & Contract Safety', () => {
  let adapter: GoogleAuthAdapter;

  beforeEach(() => {
    adapter = new GoogleAuthAdapter();
  });

  it('1. Reports contract is not available for POST /api/v1/auth/login', () => {
    expect(adapter.isContractAvailable()).toBe(false);
  });

  it('2. Detects unconfigured Google Identity Services when client ID is missing or placeholder', () => {
    // Current environment has placeholder or undefined VITE_GOOGLE_CLIENT_ID
    expect(adapter.isGoogleConfigured()).toBe(false);
  });

  it('3. Rejects empty ID token in exchangeTokenForSession with 400 BackendAuthError', async () => {
    await expect(adapter.exchangeTokenForSession({ idToken: '' })).rejects.toThrow(BackendAuthError);
    await expect(adapter.exchangeTokenForSession({ idToken: '   ' })).rejects.toThrow(BackendAuthError);
  });

  it('4. Rejects invalid token with 401 BackendAuthError', async () => {
    await expect(adapter.exchangeTokenForSession({ idToken: 'invalid' })).rejects.toThrow(
      'Google ID token verification failed'
    );
  });

  it('5. Resolves unassigned employee with accessStatus: PENDING and activeTenant: null', async () => {
    const res = await adapter.exchangeTokenForSession({ idToken: 'token-unassigned' });
    expect(res.accessStatus).toBe('PENDING');
    expect(res.activeTenant).toBeNull();
    expect(res.roles).toEqual([]);
    expect(res.user.email).toBe('unassigned@3ddx.com');
  });

  it('6. Resolves CS demo operator with accessStatus: AUTHORIZED and tenant 1', async () => {
    const res = await adapter.exchangeTokenForSession({ idToken: 'token-cs-demo' });
    expect(res.accessStatus).toBe('AUTHORIZED');
    expect(res.activeTenant?.id).toBe(1);
    expect(res.activeTenant?.label).toBe('3ddx.com');
    expect(res.roles).toContain('cs_operator');
    expect(res.tokenType).toBe('Bearer');
    expect(res.sessionToken).toBeDefined();
  });

  it('7. Resolves Senior Ops specialist with accessStatus: AUTHORIZED and tenant 1', async () => {
    const res = await adapter.exchangeTokenForSession({ idToken: 'token-ops' });
    expect(res.accessStatus).toBe('AUTHORIZED');
    expect(res.activeTenant?.id).toBe(1);
    expect(res.roles).toContain('ops_senior');
  });

  it('8. Resolves Tenant Admin operator with accessStatus: AUTHORIZED and tenant 1', async () => {
    const res = await adapter.exchangeTokenForSession({ idToken: 'token-admin' });
    expect(res.accessStatus).toBe('AUTHORIZED');
    expect(res.activeTenant?.id).toBe(1);
    expect(res.roles).toContain('tenant_admin');
  });

  it('9. ContractGapError provides structured 501 status and error message', () => {
    const err = new ContractGapError('POST /api/v1/auth/login');
    expect(err.statusCode).toBe(501);
    expect(err.code).toBe('CONTRACT_GAP');
    expect(err.message).toContain('CONTRACT GAP');
  });
});
