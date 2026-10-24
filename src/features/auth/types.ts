/**
 * ============================================================================
 * MOCK AUTHENTICATION AND ROLE BOUNDARY TYPES (UIUX-REQ-005)
 * ============================================================================
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED
 *
 * ARCHITECTURAL AND INTEGRATION NOTICE:
 * 1. Real authentication, backend sessions, session cookies, OAuth 2.0, tokens,
 *    and real permission authorization policies are NOT implemented.
 * 2. These types represent client-side demonstration user profiles, simulated
 *    role presets, and mock password recovery boundaries.
 * 3. FUTURE INTEGRATION BOUNDARY: Google SSO / OpenID Connect / SAML.
 *    OAuth dependencies, client IDs, secrets, redirect URIs, scopes, and
 *    token exchanges are intentionally omitted from this offline repository.
 */

export type MockAuthRole =
  | 'director'
  | 'clinician'
  | 'doctor'
  | 'planner'
  | 'operator'
  | 'lab_tech'
  | 'cs'
  | 'finance'
  | 'admin';

export interface MockUserSession {
  userId: string;
  email: string;
  fullName: string;
  role: MockAuthRole;
  tenantId: string;
  permissions: readonly string[];
  isMock?: boolean;
}

export interface MockAuthState {
  isAuthenticated: boolean;
  session: MockUserSession | null;
  token: string | null;
  status?: 'unauthenticated' | 'authenticated' | 'mock_simulation';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordMockResult {
  success: boolean;
  email: string;
  simulatedMessage: string;
  isMock: true;
}

// Backward-compatible type aliases for existing references
export type UserSession = MockUserSession;
export type AuthState = MockAuthState;
