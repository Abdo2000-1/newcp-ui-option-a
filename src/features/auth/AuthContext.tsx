import { getPostHog, getSentry } from '@/shared/observability';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * ============================================================================
 * NEW CP IAM v0.9.5 & v0.9.7 AUTHENTICATION & SESSION CONTEXT
 * ============================================================================
 *
 * AUTHORITATIVE ARCHITECTURAL CONSTRAINTS (v0.9.7 Clarification):
 * 1. Google Sign-In authenticates identity ONLY.
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
 *    activeTenant = null and tenantId = null.
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
  activeTenant: ActiveTenantContext | null; // null if unassigned or pending
  tenantId: number | null; // strictly null when not authorized; never fallback to 1
  sessionToken?: string;
  tokenType?: 'Bearer';
  family?: BusinessFamily;
  roles: string[];
  capabilities: string[];
  status: SessionStatus;
  accessStatus: AccessStatus;
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
  loginWithGoogle: (emailOrToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// 30 minutes idle timeout, 8 hours absolute lifetime (in milliseconds)
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

// Approved October Demo Identities (MOCK / SYNTHETIC FIXTURES)
export const APPROVED_DEMO_IDENTITIES: Record<string, Omit<UserSession, 'issuedAt' | 'lastActivityAt' | 'expiresAt'>> = {
  'cs.demo@3ddx.com': {
    userId: 'usr-cs-001',
    email: 'cs.demo@3ddx.com',
    fullName: 'CS Demo Operator',
    activeTenant: { id: 1, label: '3ddx.com' },
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
    accessStatus: 'AUTHORIZED',
    tenantSwitchingEnabled: false,
  },
  'ops.demo@3ddx.com': {
    userId: 'usr-ops-001',
    email: 'ops.demo@3ddx.com',
    fullName: 'Senior Ops Specialist',
    activeTenant: { id: 1, label: '3ddx.com' },
    tenantId: 1,
    family: 'OPS',
    roles: ['ops_senior', 'ops_junior'], // Demonstrates same-family transitive inheritance
    capabilities: [
      'orders.view',
      'services.models.edit',
      'services.conversion.edit',
      'pricing.override',
      'workflow.transition',
      'reports.view_all',
    ],
    status: 'authenticated',
    accessStatus: 'AUTHORIZED',
    tenantSwitchingEnabled: false,
  },
  'admin.demo@3ddx.com': {
    userId: 'usr-admin-001',
    email: 'admin.demo@3ddx.com',
    fullName: 'Tenant Admin Operator',
    activeTenant: { id: 1, label: '3ddx.com' },
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
    accessStatus: 'AUTHORIZED',
    tenantSwitchingEnabled: false,
  },
  'unassigned@3ddx.com': {
    userId: 'usr-unassigned-001',
    email: 'unassigned@3ddx.com',
    fullName: 'Unassigned Internal Employee',
    activeTenant: null, // Zero tenant authorization
    tenantId: null, // Strictly null; no fallback to 1
    roles: [],
    capabilities: [],
    status: 'pending_access',
    accessStatus: 'PENDING',
    tenantSwitchingEnabled: false,
  },
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_SESSION_KEY = 'newcp_iam_session_v097';

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

  const loginWithGoogle = async (emailOrToken: string = 'cs.demo@3ddx.com') => {
    setStatus('authenticating');
    // Simulate interactive Google Sign-In identity resolution (client-side demo boundary)
    await new Promise((r) => setTimeout(r, 400));

    const normalized = emailOrToken.trim().toLowerCase();
    const preset = APPROVED_DEMO_IDENTITIES[normalized];

    const now = Date.now();
    if (preset) {
      const createdSession: UserSession = {
        ...preset,
        sessionToken: `sess-${now}-${normalized.split('@')[0]}`,
        tokenType: 'Bearer',
        issuedAt: now,
        lastActivityAt: now,
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
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
          family: createdSession.family,
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
      // Default: Authenticated with Google, but lacks an internal IAM user-to-tenant grant
      // In accordance with v0.9.7: activeTenant is strictly null; NO fallback to tenant 1
      const unassignedSession: UserSession = {
        userId: `usr-${Date.now()}`,
        email: normalized,
        fullName: normalized.split('@')[0].replace('.', ' ').toUpperCase(),
        activeTenant: null, // Strictly null; no grant exists
        tenantId: null, // Strictly null; never defaults to 1
        sessionToken: `sess-${now}-unassigned`,
        tokenType: 'Bearer',
        roles: [],
        capabilities: [],
        status: 'pending_access',
        accessStatus: 'PENDING',
        tenantSwitchingEnabled: false,
        issuedAt: now,
        lastActivityAt: now,
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
      };
      persistSession(unassignedSession);

      getSentry().setUser({
        id: unassignedSession.userId,
      });
      getPostHog().identify(unassignedSession.userId);
      getPostHog().capture('user_logged_in', {
        user_id: unassignedSession.userId,
      });
    }
  };

  const logout = async () => {
    // In future LIVE_HTTP mode, call POST /api/v1/auth/logout for server-side token revocation
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
    // In future LIVE_HTTP mode, fetch fresh context from GET /api/v1/session/context
    const cur = sessionRef.current;
    if (cur) {
      recordActivity();
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
