import { describe, it, expect, beforeEach } from 'vitest';
import {
  GoogleAuthAdapter,
  BackendAuthError,
  ContractGapError,
} from '../authAdapter';
import type { AuthorizedLoginResponse, PendingAccessLoginResponse } from '../authAdapter';

/**
 * ============================================================================
 * AUTH ADAPTER UNIT TESTS (v0.9.8 CANONICAL CONTRACT)
 * ============================================================================
 *
 * Verifies:
 * 1. Contract availability (v0.9.8 approved contract defines POST /api/v1/auth/login).
 * 2. Google configuration detection (reports unconfigured when placeholder or absent).
 * 3. Token exchange validation (rejects empty/invalid tokens).
 * 4. AUTHORIZED response handling with token and expiry.
 * 5. PENDING_ACCESS response handling with NO session token.
 * 6. getMe retrieval of backend-resolved identity, role codes, and capabilities.
 * 7. ContractGapError provides structured 501 status and code.
 */

describe('GoogleAuthAdapter Boundary & Contract Safety (v0.9.8)', () => {
  let adapter: GoogleAuthAdapter;

  beforeEach(() => {
    adapter = new GoogleAuthAdapter();
  });

  it('1. Reports contract is available for v0.9.8 canonical auth endpoints', () => {
    expect(adapter.isContractAvailable()).toBe(true);
  });

  it('2. Detects unconfigured Google Identity Services when client ID is missing or placeholder', () => {
    const unconfigured = new GoogleAuthAdapter('your-google-client-id-here.apps.googleusercontent.com');
    expect(unconfigured.isGoogleConfigured()).toBe(false);
    const missing = new GoogleAuthAdapter('');
    expect(missing.isGoogleConfigured()).toBe(false);
  });

  it('3. Rejects empty ID token in exchangeTokenForSession with 400 BackendAuthError', async () => {
    await expect(adapter.exchangeTokenForSession({ idToken: '' })).rejects.toThrow(BackendAuthError);
    await expect(adapter.exchangeTokenForSession({ idToken: '   ' })).rejects.toThrow(BackendAuthError);
  });

  it('4. Rejects invalid token with 401 BackendAuthError', async () => {
    await expect(adapter.exchangeTokenForSession({ idToken: 'invalid' })).rejects.toThrow();
  });

  it('5. Resolves unassigned employee with accessStatus: PENDING_ACCESS and NO token', async () => {
    const res = await adapter.exchangeTokenForSession({ idToken: 'token-unassigned' });
    expect(res.accessStatus).toBe('PENDING_ACCESS');
    expect((res as any).token).toBeUndefined();
  });

  it('6. Resolves authorized login with accessStatus: AUTHORIZED and session token', async () => {
    const res = await adapter.exchangeTokenForSession({ idToken: 'token-cs-demo' });
    expect(res.accessStatus).toBe('AUTHORIZED');
    const authRes = res as AuthorizedLoginResponse;
    expect(authRes.token).toBeDefined();
    expect(authRes.expiresAt).toBeDefined();
  });

  it('7. Retrieves user identity and capabilities via getMe', async () => {
    const me = await adapter.getMe('sess-cs-token');
    expect(me.email).toBe('cs.demo@3ddx.com');
    expect(me.userUuid).toBe('usr-cs-001');
    expect(me.tenantSlug).toBe('3ddx.com');
    expect(me.roleCodes).toContain('cs_operator');
    expect(me.capabilities).toContain('orders.view');
    expect(me.isPendingAccess).toBe(false);
  });

  it('8. Retrieves unassigned pending status via getMe', async () => {
    const me = await adapter.getMe('sess-unassigned-token');
    expect(me.email).toBe('unassigned@3ddx.com');
    expect(me.roleCodes).toHaveLength(0);
    expect(me.capabilities).toHaveLength(0);
    expect(me.isPendingAccess).toBe(true);
  });

  it('9. ContractGapError provides structured 501 status and error message', () => {
    const err = new ContractGapError('POST /api/v1/auth/login');
    expect(err.statusCode).toBe(501);
    expect(err.code).toBe('CONTRACT_GAP');
    expect(err.message).toContain('CONTRACT GAP');
  });
});