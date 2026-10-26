import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * ============================================================================
 * NEW CP IAM v0.9.5 AUTHENTICATION & SESSION CONTEXT
 * ============================================================================
 *
 * AUTHORITATIVE ARCHITECTURAL CONSTRAINTS:
 * 1. Google Sign-In authenticates identity ONLY.
 * 2. Google Groups are strictly prohibited and excluded.
 * 3. PostgreSQL V3 IAM + Casbin backend are authoritative for roles & permissions.
 * 4. The email domain (@3ddx.com) does NOT automatically grant role or tenant.
 * 5. October demo tenant is explicitly authorized tenant_id = 1.
 * 6. Authenticated identities without assigned roles receive 'pending_access'.
 * 7. Default session policy: 30-minute idle timeout, 8-hour absolute timeout.
 */

export type BusinessFamily = 'CS' | 'OPS' | 'FINANCE' | 'QC' | 'ADMIN';

export type SessionStatus =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'pending_access'
  | 'expired'
  | 'revoked';

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  tenantId: number; // explicitly 1 for October demo
  family?: BusinessFamily;
  roles: string[];
  capabilities: string[];
  status: SessionStatus;
  issuedAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export interface AuthContextType {
  session: UserSession | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  isPendingAccess: boolean;
  tenantId: number;
  loginWithGoogle: (email: string) => Promise<void>;
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
  },
  'admin.demo@3ddx.com': {
    userId: 'usr-admin-001',
    email: 'admin.demo@3ddx.com',
    fullName: 'Tenant Admin Operator',
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
    tenantId: 1,
    roles: [],
    capabilities: [],
    status: 'pending_access',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_SESSION_KEY = 'newcp_iam_session_v095';

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
        });
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [persistSession]);

  const loginWithGoogle = async (email: string) => {
    setStatus('authenticating');
    // Simulate interactive Google Sign-In identity resolution (client-side demo boundary)
    await new Promise((r) => setTimeout(r, 400));

    const normalized = email.trim().toLowerCase();
    const preset = APPROVED_DEMO_IDENTITIES[normalized];

    const now = Date.now();
    if (preset) {
      const createdSession: UserSession = {
        ...preset,
        issuedAt: now,
        lastActivityAt: now,
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
      };
      persistSession(createdSession);
    } else {
      // Default: Authenticated with Google, but unassigned in V3 PostgreSQL IAM
      const unassignedSession: UserSession = {
        userId: `usr-${Date.now()}`,
        email: normalized,
        fullName: normalized.split('@')[0].replace('.', ' ').toUpperCase(),
        tenantId: 1, // October demo tenant
        roles: [],
        capabilities: [],
        status: 'pending_access',
        issuedAt: now,
        lastActivityAt: now,
        expiresAt: now + ABSOLUTE_TIMEOUT_MS,
      };
      persistSession(unassignedSession);
    }
  };

  const logout = async () => {
    // In future LIVE_HTTP mode, call POST /api/v1/auth/logout for server-side token revocation
    persistSession(null);
  };

  const refreshSession = async () => {
    // In future LIVE_HTTP mode, fetch fresh permissions from GET /api/v1/auth/session
    const cur = sessionRef.current;
    if (cur) {
      recordActivity();
    }
  };

  const value: AuthContextType = {
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isPendingAccess: status === 'pending_access',
    tenantId: session?.tenantId || 1,
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
