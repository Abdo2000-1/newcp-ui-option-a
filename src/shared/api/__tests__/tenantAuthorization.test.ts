import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockTenantAuthorizationService,
  APPROVED_OCTOBER_SEED_ASSIGNMENTS,
  type MockTenantAssignmentRecord,
} from '../tenantAuthorization';

/**
 * ============================================================================
 * IAM-TENANT-002: FRONTEND TENANT AUTHORIZATION BOUNDARY TESTS
 * ============================================================================
 *
 * Verifies that:
 * 1. iam.user_roles serves as the October authorization source.
 * 2. An employee is authorized ONLY if they have an active, non-deleted account,
 *    party_kind = 'employee', and an approved role assignment for that tenant.
 * 3. Role tenant must match assignment tenant (ur.tenant_id = r.tenant_id).
 * 4. Suspended or deleted users are denied access regardless of role records.
 * 5. Unassigned employees (no tenant-1 role) receive false (Pending Access).
 * 6. Non-employee parties (customer/contractor) are not authorized through employee IAM.
 * 7. Dedicated abstraction encapsulates queries.
 */

describe('IAM-TENANT-002: Tenant Authorization Abstraction & Boundary', () => {
  let service: MockTenantAuthorizationService;

  beforeEach(() => {
    service = new MockTenantAuthorizationService(APPROVED_OCTOBER_SEED_ASSIGNMENTS);
  });

  it('1. Authorizes approved CS employee for tenant 1', async () => {
    const isAuth = await service.isTenantAuthorized('usr-cs-001', 1);
    expect(isAuth).toBe(true);

    const grants = await service.getAuthorizedTenants('usr-cs-001');
    expect(grants).toHaveLength(1);
    expect(grants[0].tenantId).toBe(1);
    expect(grants[0].roleId).toBe('cs_operator');
    expect(grants[0].isApproved).toBe(true);
  });

  it('2. Authorizes approved Senior OPS employee for tenant 1', async () => {
    const isAuth = await service.isTenantAuthorized('usr-ops-001', 1);
    expect(isAuth).toBe(true);

    const grants = await service.getAuthorizedTenants('usr-ops-001');
    expect(grants).toHaveLength(1);
    expect(grants[0].tenantId).toBe(1);
    expect(grants[0].roleId).toBe('ops_senior');
  });

  it('3. Authorizes approved Tenant Admin for tenant 1', async () => {
    const isAuth = await service.isTenantAuthorized('usr-admin-001', 1);
    expect(isAuth).toBe(true);

    const grants = await service.getAuthorizedTenants('usr-admin-001');
    expect(grants).toHaveLength(1);
    expect(grants[0].tenantId).toBe(1);
    expect(grants[0].roleId).toBe('tenant_admin');
  });

  it('4. Denies unassigned employee (no tenant-1 role assignment)', async () => {
    const isAuth = await service.isTenantAuthorized('usr-unassigned-001', 1);
    expect(isAuth).toBe(false);

    const grants = await service.getAuthorizedTenants('usr-unassigned-001');
    expect(grants).toHaveLength(0);
  });

  it('5. Denies access to unauthorized tenant 2 even for Tenant Admin', async () => {
    const isAuth = await service.isTenantAuthorized('usr-admin-001', 2);
    expect(isAuth).toBe(false);
  });

  it('6. Denies access when role tenant does not match assignment tenant (integrity violation)', async () => {
    const corruptRecord: MockTenantAssignmentRecord = {
      userId: 'usr-corrupt-001',
      email: 'corrupt@3ddx.com',
      tenantId: 1,
      roleId: 'cs_operator',
      roleTenantId: 2, // Mismatched role tenant!
      partyKind: 'employee',
      userState: 'active',
      isDeleted: false,
      isApprovedForNewCp: true,
    };
    service.setAssignments([corruptRecord]);

    const isAuth = await service.isTenantAuthorized('usr-corrupt-001', 1);
    expect(isAuth).toBe(false);
  });

  it('7. Denies access when employee user state is suspended', async () => {
    const suspendedRecord: MockTenantAssignmentRecord = {
      userId: 'usr-suspended-001',
      email: 'suspended@3ddx.com',
      tenantId: 1,
      roleId: 'cs_operator',
      roleTenantId: 1,
      partyKind: 'employee',
      userState: 'suspended',
      isDeleted: false,
      isApprovedForNewCp: true,
    };
    service.setAssignments([suspendedRecord]);

    const isAuth = await service.isTenantAuthorized('usr-suspended-001', 1);
    expect(isAuth).toBe(false);
  });

  it('8. Denies access when employee record is soft-deleted', async () => {
    const deletedRecord: MockTenantAssignmentRecord = {
      userId: 'usr-deleted-001',
      email: 'deleted@3ddx.com',
      tenantId: 1,
      roleId: 'cs_operator',
      roleTenantId: 1,
      partyKind: 'employee',
      userState: 'active',
      isDeleted: true,
      isApprovedForNewCp: true,
    };
    service.setAssignments([deletedRecord]);

    const isAuth = await service.isTenantAuthorized('usr-deleted-001', 1);
    expect(isAuth).toBe(false);
  });

  it('9. Denies access when party_kind is not employee (e.g. customer/contractor)', async () => {
    const customerRecord: MockTenantAssignmentRecord = {
      userId: 'usr-cust-001',
      email: 'cust@smilecenter.com',
      tenantId: 1,
      roleId: 'customer_doctor',
      roleTenantId: 1,
      partyKind: 'customer',
      userState: 'active',
      isDeleted: false,
      isApprovedForNewCp: true,
    };
    service.setAssignments([customerRecord]);

    const isAuth = await service.isTenantAuthorized('usr-cust-001', 1);
    expect(isAuth).toBe(false);
  });

  it('10. Revoking the last authorized role removes tenant business access immediately', async () => {
    expect(await service.isTenantAuthorized('usr-cs-001', 1)).toBe(true);

    service.revokeTenantRole('usr-cs-001', 'cs_operator', 1);

    expect(await service.isTenantAuthorized('usr-cs-001', 1)).toBe(false);
    const grants = await service.getAuthorizedTenants('usr-cs-001');
    expect(grants).toHaveLength(0);
  });

  it('11. Legacy imported role not approved for New CP is denied', async () => {
    const unapprovedLegacyRecord: MockTenantAssignmentRecord = {
      userId: 'usr-legacy-001',
      email: 'legacy@3ddx.com',
      tenantId: 1,
      roleId: 'legacy_data_entry',
      roleTenantId: 1,
      partyKind: 'employee',
      userState: 'active',
      isDeleted: false,
      isApprovedForNewCp: false, // NOT approved for New CP use!
    };
    service.setAssignments([unapprovedLegacyRecord]);

    const isAuth = await service.isTenantAuthorized('usr-legacy-001', 1);
    expect(isAuth).toBe(false);
  });
});
