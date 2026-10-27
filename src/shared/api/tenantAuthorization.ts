/**
 * ============================================================================
 * IAM-TENANT-002 TENANT AUTHORIZATION ABSTRACTION
 * ============================================================================
 *
 * Architecture Invariants (IAM-TENANT-002 & v0.9.7):
 * 1. For October 2026 demo, iam.user_roles serves as the explicit user-to-tenant
 *    authorization source.
 * 2. Tenant authorization is encapsulated behind this dedicated service abstraction
 *    (isTenantAuthorized and getAuthorizedTenants) so that business modules do not
 *    depend on physical table queries.
 * 3. Frontend must not determine tenant, role, or capabilities.
 * 4. Google Groups and email domains are NOT authorization sources.
 * 5. In a future phase, this abstraction can read from normalized tenant grant tables
 *    without modifying application contracts or business services.
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED (Frontend Offline Boundary)
 */

export interface TenantGrant {
  tenantId: number;
  tenantLabel: string;
  roleId: string;
  roleName: string;
  isApproved: boolean;
}

export interface ITenantAuthorizationService {
  isTenantAuthorized(userId: string, tenantId: number): Promise<boolean>;
  getAuthorizedTenants(userId: string): Promise<TenantGrant[]>;
}

export interface MockTenantAssignmentRecord {
  userId: string;
  email: string;
  tenantId: number;
  roleId: string;
  roleTenantId: number;
  partyKind: 'employee' | 'customer' | 'contractor';
  userState: 'active' | 'suspended' | 'deleted';
  isDeleted: boolean;
  isApprovedForNewCp: boolean;
}

/**
 * Approved Demo Seed Assignments (Offline Verification Fixtures)
 * Reflects verified tenant-1 role assignments in PostgreSQL V3 schema:
 * - CS, OPS, ADMIN have approved tenant-1 assignments
 * - unassigned employee has no tenant-1 assignment
 */
export const APPROVED_OCTOBER_SEED_ASSIGNMENTS: MockTenantAssignmentRecord[] = [
  {
    userId: 'usr-cs-001',
    email: 'cs.demo@3ddx.com',
    tenantId: 1,
    roleId: 'cs_operator',
    roleTenantId: 1,
    partyKind: 'employee',
    userState: 'active',
    isDeleted: false,
    isApprovedForNewCp: true,
  },
  {
    userId: 'usr-ops-001',
    email: 'ops.demo@3ddx.com',
    tenantId: 1,
    roleId: 'ops_senior',
    roleTenantId: 1,
    partyKind: 'employee',
    userState: 'active',
    isDeleted: false,
    isApprovedForNewCp: true,
  },
  {
    userId: 'usr-admin-001',
    email: 'admin.demo@3ddx.com',
    tenantId: 1,
    roleId: 'tenant_admin',
    roleTenantId: 1,
    partyKind: 'employee',
    userState: 'active',
    isDeleted: false,
    isApprovedForNewCp: true,
  },
];

export class MockTenantAuthorizationService implements ITenantAuthorizationService {
  private assignments: MockTenantAssignmentRecord[];

  constructor(initialAssignments: MockTenantAssignmentRecord[] = APPROVED_OCTOBER_SEED_ASSIGNMENTS) {
    this.assignments = [...initialAssignments];
  }

  /**
   * Logical grant check matching IAM-TENANT-002 SQL verification rule:
   * SELECT EXISTS (
   *   SELECT 1 FROM iam.users u
   *   JOIN iam.user_roles ur ON ur.user_id = u.id
   *   JOIN iam.roles r ON r.id = ur.role_id
   *   WHERE u.id = :userId
   *     AND ur.tenant_id = :tenantId
   *     AND r.tenant_id = ur.tenant_id
   *     AND u.party_kind = 'employee'
   *     AND u.state = 'active'
   *     AND u.deleted_at IS NULL
   *     AND assignment is approved for New CP
   * )
   */
  public async isTenantAuthorized(userId: string, tenantId: number): Promise<boolean> {
    const validAssignment = this.assignments.find((a) => {
      return (
        a.userId === userId &&
        a.tenantId === tenantId &&
        a.roleTenantId === a.tenantId &&
        a.partyKind === 'employee' &&
        a.userState === 'active' &&
        !a.isDeleted &&
        a.isApprovedForNewCp
      );
    });

    return Boolean(validAssignment);
  }

  public async getAuthorizedTenants(userId: string): Promise<TenantGrant[]> {
    const matching = this.assignments.filter((a) => {
      return (
        a.userId === userId &&
        a.roleTenantId === a.tenantId &&
        a.partyKind === 'employee' &&
        a.userState === 'active' &&
        !a.isDeleted &&
        a.isApprovedForNewCp
      );
    });

    return matching.map((m) => ({
      tenantId: m.tenantId,
      tenantLabel: m.tenantId === 1 ? '3ddx.com' : `tenant-${m.tenantId}`,
      roleId: m.roleId,
      roleName: m.roleId,
      isApproved: m.isApprovedForNewCp,
    }));
  }

  public setAssignments(records: MockTenantAssignmentRecord[]): void {
    this.assignments = [...records];
  }

  public revokeTenantRole(userId: string, roleId: string, tenantId: number): void {
    this.assignments = this.assignments.filter(
      (a) => !(a.userId === userId && a.roleId === roleId && a.tenantId === tenantId)
    );
  }
}

let tenantAuthServiceInstance: ITenantAuthorizationService | null = null;

export function getTenantAuthorizationService(): ITenantAuthorizationService {
  if (!tenantAuthServiceInstance) {
    tenantAuthServiceInstance = new MockTenantAuthorizationService();
  }
  return tenantAuthServiceInstance;
}

export function resetTenantAuthorizationService(): void {
  tenantAuthServiceInstance = null;
}
