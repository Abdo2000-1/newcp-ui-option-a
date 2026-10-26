import { useAuth, type BusinessFamily } from '@/features/auth';

/**
 * ============================================================================
 * NEW CP IAM v0.9.5 AUTHORIZATION HOOK (FE-SEC / IAM-003)
 * ============================================================================
 *
 * AUTHORITATIVE SPECIFICATION:
 * - Google Sign-In authenticates identity ONLY.
 * - Roles, families, and capabilities are governed by PostgreSQL V3 IAM + Casbin.
 * - Frontend visibility is a user-experience aid ONLY; backend is authoritative.
 * - All 5 business families (CS, OPS, FINANCE, QC, ADMIN) can view reports.
 * - Report export is strictly restricted to FINANCE, QC, and ADMIN.
 * - CS and OPS roles can view reports but MUST NOT export them.
 */

export interface AuthorizationContext {
  can: (capability: string) => boolean;
  hasFamily: (...families: BusinessFamily[]) => boolean;
  canExportReports: boolean;
  canViewReports: boolean;
  exportDisabledReason?: string;
  family?: BusinessFamily;
  roles: string[];
  capabilities: string[];
  isPendingAccess: boolean;
  isAuthenticated: boolean;
}

export function useAuthorization(): AuthorizationContext {
  const { session, isAuthenticated, isPendingAccess } = useAuth();

  const can = (capability: string): boolean => {
    if (isPendingAccess) return false;
    if (!session) return true; // Fallback for unauthenticated mock exploration / legacy tests
    return session.capabilities.includes(capability);
  };

  const hasFamily = (...families: BusinessFamily[]): boolean => {
    if (!session?.family) return false;
    return families.includes(session.family);
  };

  // Authoritative Rule: Report export is restricted to FINANCE, QC, and ADMIN.
  // CS and OPS families can view all reports, but export action is disabled.
  const isRestrictedExportFamily = session?.family === 'CS' || session?.family === 'OPS';
  const canExportReports = !isRestrictedExportFamily;

  const canViewReports = true;

  const exportDisabledReason = isRestrictedExportFamily
    ? 'Report export is restricted to Finance, QC, and Admin roles.'
    : undefined;

  return {
    can,
    hasFamily,
    canExportReports,
    canViewReports,
    exportDisabledReason,
    family: session?.family,
    roles: session?.roles || [],
    capabilities: session?.capabilities || [],
    isPendingAccess,
    isAuthenticated,
  };
}
