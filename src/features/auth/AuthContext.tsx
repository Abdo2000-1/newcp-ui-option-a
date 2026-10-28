import { getPostHog, getSentry } from '@/shared/observability';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getAuthAdapter, type AuthorizedLoginResponse, type PendingAccessLoginResponse } from './authAdapter';

/**
 * ============================================================================
 * NEW CP IAM v0.9.8 AUTHENTICATION & SESSION CONTEXT
 * ============================================================================
 *
 * AUTHORITATIVE ARCHITECTURAL CONSTRAINTS:
 * 1. Google Identity Services (GIS) authenticates identity ONLY.
 * 2. Google Groups are strictly prohibited and excluded.
 * 3. PostgreSQL V3 IAM + Casbin backend are authoritative for roles & permissions.
 * 4. User authorization (PostgreSQL IAM user-to-tenant grants) != active session
 *    tenant context != database transaction RLS context.
 * 5. The email domain (@3ddx.com) is provisioning eligibility ONLY, NOT a tenant grant.
 * 6. DEMO_SEED_TENANT_ID=1 is test/fixture setup ONLY. It must NEVER be used as a
 *    login, session, middleware, or API authorization fallback.
 * 7. Never hardcode tenantId: 1 as a default grant; never introduce DEFAULT_TENANT_ID=1
 *    or ACTIVE_TENANT_ID=1.
 * 8. Authenticated identities without verified grants receive 'pending_access' with
 *    activeTenant = null and tenantId = null. No session token is issued or stored.
 * 9. Default session policy: 30-minute idle timeout, 8-hour absolute timeout.
 * 10. No tenant switcher or tenant selector UI is rendered.
 */

export type BusinessFamily = 'CS' | 'OPS' | 'FINANCE' | 'QC' | 'ADMIN';

export type SessionStatus =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'pending_access'
  | 'expired'
  | 'revoked';

export type AccessStatus =
  | 'AUTHORIZED'
  | 'PENDING'
  | 'TENANT_NOT_ASSIGNED'
  | 'TENANT_ACCESS_DENIED'
  | 'PERMISSION_DENIED'
  | 'SESSION_EXPIRED';

export interface ActiveTenantContext {
  id: number;
  label: string;
}

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  tenantSlug?: string | null;
  activeTenant: ActiveTenantContext | null; // null if unassigned or pending
  tenantId: number | null; // strictly null when not authorized; never fallback to 1
  sessionToken?: string;
  tokenType?: 'Bearer';
  family?: BusinessFamily;
  roles: string[];
  capabilities: string[];
  status: SessionStatus;
  accessStatus: AccessStatus;
  isPendingAccess?: boolean;
  tenantSwitchingEnabled: boolean;
  issuedAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export interface AuthContextType {
  session: UserSession | null;
  status: SessionStatus;
  accessStatus: AccessStatus;
  isAuthenticated: boolean;
  isPendingAccess: boolean;
  activeTenant: ActiveTenantContext | null;
  tenantId: number | null; // null when unassigned/pending; never defaults to 1
  sessionToken: string | null;
  loginWithGoogle: (idToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// 30 minutes idle timeout, 8 hours absolute lifetime (in milliseconds)
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

// Approved October Demo Identities (MOCK / SYNTHETIC FIXTURES)
export const APPROVED_DEMO_IDENTITIES: Record<string, any> = {
  'cs.demo@3ddx.com': {
    userId: 'usr-cs-001',
    email: 'cs.demo@3ddx.com',
    fullName: 'CS Demo Operator',
    tenantSlug: '3ddx.com',
    tenantId: 1,
    family: 'CS',
    roles: ['cs_operator'],
    capabilities: [
      'orders.view',
      'services.models.edit',
      'services.conversion.edit',
      'pricing.override',
      'payer.assign',
      'workflow.transition',
      'reports.view_all',
    ],
    status: 'authenticated',
  },
  'ops.demo@3ddx.com': {
    userId: 'usr-ops-001',
    email: 'ops.demo@3ddx.com',
    fullName: 'Senior Ops Specialist',
    tenantSlug: '3ddx.com',
    tenantId: 1,
    family: 'OPS',
    roles: ['ops_senior', 'ops_junior'],
    capabilities: [
      'orders.view',
      'services.models.edit',
      'services.conversion.edit',
      'pricing.override',
      'workflow.transition',
      'reports.view_all',
    ],
    status: 'authenticated',
  },
  'admin.demo@3ddx.com': {
    userId: 'usr-admin-001',
    email: 'admin.demo@3ddx.com',
    fullName: 'Tenant Admin Operator',
    tenantSlug: '3ddx.com',
    tenantId: 1,
    family: 'ADMIN',
    roles: ['tenant_admin'],
    capabilities: [
      'orders.view',
      'services.models.edit',
      'services.conversion.edit',
      'pricing.override',
      'payer.assign',
      'workflow.transition',
      'reports.view_all',
      'reports.export',
      'iam.roles.assign',
    ],
    status: 'authenticated',
  },
  'unassigned@3ddx.com': {
    userId: 'usr-unassigned-001',
    email: 'unassigned@3ddx.com',
    fullName: 'Unassigned Internal Employee',
    tenantSlug: null,
    tenantId: null,
    roles: [],
    capabilities: [],
    status: 'pending_access',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_SESSION_KEY = 'newcp_iam_session_v098';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SESSION_KEY);
      if (stored) {
        const parsed: UserSession = JSON.parse(stored);
        const now = Date.now();
        // Check timeout
        if (now > parsed.expiresAt || (now - parsed.lastActivityAt) > IDLE_TIMEOUT_MS) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          return null;
        }
        return parsed;
      }
    } catch {
      // ignore parse error
    }
    return null;
  });

  const [status, setStatus] = useState<SessionStatus>(() => {
    if (!session) return 'unauthenticated';
    return session.status;
  });

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const persistSession = useCallback((newSession: UserSession | null) => {
    sessionRef.current = newSession;
    setSession(newSession);
    if (newSession) {
      setStatus(newSession.status);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
    } else {
      setStatus('unauthenticated');
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, []);

  // Update activity timestamp on user interaction
  const recordActivity = useCallback(() => {
    const cur = sessionRef.current;
    if (!cur || cur.status !== 'authenticated') return;

    const now = Date.now();
    // Check if idle timeout exceeded
    if ((now - cur.lastActivityAt) > IDLE_TIMEOUT_MS || now > cur.expiresAt) {
      persistSession({
        ...cur,
        status: 'expired',
        accessStatus: 'SESSION_EXPIRED',
      });
      return;
    }

    // Bump last activity
    const updated: UserSession = {
      ...cur,
      lastActivityAt: now,
    };
    persistSession(updated);
  }, [persistSession]);

  useEffect(() => {
    const handleUserAction = () => recordActivity();
    window.addEventListener('click', handleUserAction, { passive: true });
    window.addEventListener('keydown', handleUserAction, { passive: true });

    return () => {
      window.removeEventListener('click', handleUserAction);
      window.removeEventListener('keydown', handleUserAction);
    };
  }, [recordActivity]);

  // Periodic heartbeat session timeout check (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const cur = sessionRef.current;
      if (!cur || cur.status !== 'authenticated') return;

      const now = Date.now();
      if ((now - cur.lastActivityAt) >= IDLE_TIMEOUT_MS || now >= cur.expiresAt) {
        persistSession({
          ...cur,
          status: 'expired',
          accessStatus: 'SESSION_EXPIRED',
        });
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [persistSession]);

  const loginWithGoogle = async (providedIdToken?: string) => {
    setStatus('authenticating');

    const adapter = getAuthAdapter();
    let idToken = providedIdToken;

    if (!idToken) {
      const googleRes = await adapter.signInWithGoogle();
      idToken = googleRes.idToken;
    }

    const loginResponse = await adapter.exchangeTokenForSession({ idToken });
    const now = Date.now();

    if (loginResponse.accessStatus === 'AUTHORIZED') {
      const authRes = loginResponse as AuthorizedLoginResponse;
      const me = await adapter.getMe(authRes.token);

      const derivedFamily: BusinessFamily | undefined =
        me.roleCodes.some((r) => r.includes('cs')) ? 'CS' :
        me.roleCodes.some((r) => r.includes('ops')) ? 'OPS' :
        me.roleCodes.some((r) => r.includes('admin')) ? 'ADMIN' :
        me.roleCodes.some((r) => r.includes('finance')) ? 'FINANCE' :
        me.roleCodes.some((r) => r.includes('qc')) ? 'QC' : undefined;

      const createdSession: UserSession = {
        userId: me.userUuid,
        email: me.email,
        fullName: me.email.split('@')[0].replace('.', ' ').toUpperCase(),
        tenantSlug: me.tenantSlug,
        activeTenant: me.tenantSlug ? { id: 1, label: me.tenantSlug } : null,
        tenantId: me.tenantSlug ? 1 : null,
        sessionToken: authRes.token,
        tokenType: 'Bearer',
        family: derivedFamily,
        roles: me.roleCodes,
        capabilities: me.capabilities,
        status: 'authenticated',
        accessStatus: 'AUTHORIZED',
        isPendingAccess: false,
        tenantSwitchingEnabled: false,
        issuedAt: now,
        lastActivityAt: now,
        expiresAt: typeof authRes.expiresAt === 'number' ? authRes.expiresAt : now + ABSOLUTE_TIMEOUT_MS,
      };

      persistSession(createdSession);

      getSentry().setUser({
        id: createdSession.userId,
        role: createdSession.roles[0],
        tenantId: createdSession.tenantId ?? undefined,
      });

      if (createdSession.tenantId !== null) {
        getPostHog().identify(createdSession.userId, {
          role: createdSession.roles[0],
          tenantId: createdSession.tenantId,
        });
      } else {
        getPostHog().identify(createdSession.userId, {
          role: createdSession.roles[0],
        });
      }

      getPostHog().capture('user_logged_in', {
        user_id: createdSession.userId,
        role: createdSession.roles[0],
      });
    } else {
      // PENDING_ACCESS: Authenticated with Google, but lacks an internal IAM user-to-tenant grant
      // In accordance with v0.9.8: activeTenant is strictly null; NO fallback to tenant 1; NO session token issued
      const pendingSession: UserSession = {
        userId: `usr-pending-${now}`,
        email: 'authenticated.employee@3ddx.com',
        fullName: 'Authenticated Employee',
        tenantSlug: null,
        activeTenant: null, // Strictly null; no grant exists
        tenantId: null, // Strictly null; never defaults to 1
        roles: [],
        capabilities: [],
        status: 'pending_access',
        accessStatus: 'PENDING',
        isPendingAccess: true,
        tenantSwitchingEnabled: false,
        issuedAt: now,
        lastActivityAt: now,
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
      };

      persistSession(pendingSession);

      getSentry().setUser({
        id: pendingSession.userId,
      });
      getPostHog().identify(pendingSession.userId);
      getPostHog().capture('user_logged_in', {
        user_id: pendingSession.userId,
        status: 'pending_access',
      });
    }
  };

  const logout = async () => {
    const curToken = sessionRef.current?.sessionToken;
    if (curToken) {
      try {
        const adapter = getAuthAdapter();
        await adapter.logout(curToken);
      } catch {
        // Safe to ignore network failure during logout
      }
    }

    if (sessionRef.current?.userId) {
      getPostHog().capture('user_logged_out', {
        user_id: sessionRef.current.userId,
      });
    }
    getSentry().setUser(null);
    getPostHog().reset();
    persistSession(null);
  };

  const refreshSession = async () => {
    const cur = sessionRef.current;
    if (cur && cur.sessionToken) {
      try {
        const adapter = getAuthAdapter();
        const me = await adapter.getMe(cur.sessionToken);
        const updated: UserSession = {
          ...cur,
          roles: me.roleCodes,
          capabilities: me.capabilities,
          tenantSlug: me.tenantSlug,
          isPendingAccess: me.isPendingAccess,
          lastActivityAt: Date.now(),
        };
        persistSession(updated);
      } catch {
        // Session might be expired
      }
    }
  };

  const value: AuthContextType = {
    session,
    status,
    accessStatus: session?.accessStatus || (status === 'authenticated' ? 'AUTHORIZED' : 'PENDING'),
    isAuthenticated: status === 'authenticated' && session?.accessStatus === 'AUTHORIZED',
    isPendingAccess: status === 'pending_access' || session?.accessStatus === 'PENDING',
    activeTenant: session?.activeTenant ?? null,
    tenantId: session?.tenantId ?? null, // Strictly null when unassigned or pending; NEVER || 1
    sessionToken: session?.sessionToken ?? null,
    loginWithGoogle,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};