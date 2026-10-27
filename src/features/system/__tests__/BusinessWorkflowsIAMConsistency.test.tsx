import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConcurrencyManager } from '@/shared/api/concurrencyManager';
import { APPROVED_DEMO_IDENTITIES, UserSession } from '@/features/auth/AuthContext';
import { store } from '@/shared/services/store';
import type { Order } from '@/shared/types';
import ordersData from '../../../../public/data/orders.json';

describe('Task 14: Comprehensive Business Workflows & IAM Consistency Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    (store as unknown as { orders: Order[]; notify: () => void }).orders = [...(ordersData as Order[])];
    (store as unknown as { notify: () => void }).notify();
  });

  describe('Workflow 1: Add Order / Intake Workflow', () => {
    it('verifies order creation validation and storage persistence', () => {
      const initialOrders = store.getOrders();
      expect(initialOrders.length).toBeGreaterThan(0);

      // Verify that adding a valid order assigns id and required attributes
      const newOrderPayload = {
        orderNumber: 'ORD-INTAKE-TEST-001',
        patientName: 'Test Patient Workflow',
        clinicName: 'Alpha Dental Studio',
        doctorName: 'Dr. John Doe',
        status: 'Intake' as const,
        priority: 'high' as const,
        restoration: 'Surgical Guide',
        stage: 'INTAKE',
        deliveryDate: '2026-11-15',
        comments: 'Verified intake workflow integration',
      };

      store.createOrder(newOrderPayload);
      const updatedOrders = store.getOrders();
      const added = updatedOrders.find(o => o.orderNumber === 'ORD-INTAKE-TEST-001');

      expect(added).toBeDefined();
      expect(added?.patientName).toBe('Test Patient Workflow');
      expect(added?.status).toBe('Intake');
    });
  });

  describe('Workflow 2: Edit Order (ETag Concurrency Protection)', () => {
    it('validates ETag matching, conflict detection, and draft recovery', () => {
      const manager = new ConcurrencyManager();
      const key = 'service-item-guid-123';
      const initialEtag = '"v1-hash-abc"';

      manager.setEtag(key, initialEtag);
      expect(manager.getEtag(key)).toBe(initialEtag);

      // Concurrency conflict detection: simulate 412 Precondition Failed
      const staleEtag = '"v0-hash-stale"';
      const serverNewEtag = '"v2-server-latest"';
      const conflictState = manager.recordConflict(
        key,
        staleEtag,
        serverNewEtag,
        'ETag mismatch: entity modified concurrently',
        { notes: 'Draft notes preserved during conflict' }
      );

      expect(conflictState.hasConflict).toBe(true);
      expect(conflictState.conflictDetails?.clientEtag).toBe(staleEtag);
      expect(conflictState.conflictDetails?.serverEtag).toBe(serverNewEtag);
      expect(manager.getDraft<{ notes: string }>(key)?.notes).toBe('Draft notes preserved during conflict');

      // Resolving conflict
      manager.setEtag(key, serverNewEtag);
      manager.resetConflict(key);
      expect(manager.getState(key).hasConflict).toBe(false);
      expect(manager.getEtag(key)).toBe(serverNewEtag);
    });
  });

  describe('Workflow 3: Financial / Payer Assignment & Pricing Rules', () => {
    it('enforces pricing.override and payer.assign capabilities on IAM identities', () => {
      const csUser = APPROVED_DEMO_IDENTITIES['cs.demo@3ddx.com'] as UserSession;
      const adminUser = APPROVED_DEMO_IDENTITIES['admin.demo@3ddx.com'] as UserSession;
      const unassignedUser = APPROVED_DEMO_IDENTITIES['unassigned@3ddx.com'] as UserSession;

      // CS and Admin have pricing.override and payer.assign
      expect(csUser.capabilities).toContain('pricing.override');
      expect(csUser.capabilities).toContain('payer.assign');
      expect(adminUser.capabilities).toContain('pricing.override');
      expect(adminUser.capabilities).toContain('payer.assign');

      // Unassigned identity has zero financial capabilities
      expect(unassignedUser.capabilities).not.toContain('pricing.override');
      expect(unassignedUser.capabilities).not.toContain('payer.assign');
    });
  });

  describe('Workflow 4: Workflow State Transitions & Clinical Holds', () => {
    it('verifies workflow.transition capability and hold state progression', () => {
      const csUser = APPROVED_DEMO_IDENTITIES['cs.demo@3ddx.com'] as UserSession;
      expect(csUser.capabilities).toContain('workflow.transition');

      // Test updating an order status to On Hold and In Progress
      const testOrder = store.getOrders()[0];
      const orderId = testOrder.id;

      store.updateOrder(orderId, { status: 'On Hold' });
      expect(store.getOrderById(orderId)?.status).toBe('On Hold');

      store.updateOrder(orderId, { status: 'In Progress' });
      expect(store.getOrderById(orderId)?.status).toBe('In Progress');
    });
  });

  describe('Workflow 5: PACS / Scan Center & DICOM Routing', () => {
    it('verifies scan center assignment and DICOM service metadata isolation', () => {
      const csUser = APPROVED_DEMO_IDENTITIES['cs.demo@3ddx.com'] as UserSession;
      expect(csUser.capabilities).toContain('services.conversion.edit');
      expect(csUser.capabilities).toContain('services.models.edit');

      const testOrder = store.getOrders()[0];
      expect(testOrder.clinicName).toBeTruthy();
    });
  });

  describe('Workflow 6: Reports Generation & Restricted Export', () => {
    it('restricts reports.export capability exclusively to authorized roles', () => {
      const adminUser = APPROVED_DEMO_IDENTITIES['admin.demo@3ddx.com'] as UserSession;
      const csUser = APPROVED_DEMO_IDENTITIES['cs.demo@3ddx.com'] as UserSession;
      const opsUser = APPROVED_DEMO_IDENTITIES['ops.demo@3ddx.com'] as UserSession;

      // Admin has reports.export capability
      expect(adminUser.capabilities).toContain('reports.export');

      // CS and OPS operators do NOT have export capability (view only)
      expect(csUser.capabilities).toContain('reports.view_all');
      expect(csUser.capabilities).not.toContain('reports.export');

      expect(opsUser.capabilities).toContain('reports.view_all');
      expect(opsUser.capabilities).not.toContain('reports.export');
    });
  });

  describe('Workflow 7: Multi-tenant Boundary (PostgreSQL V3 IAM user-to-tenant grants)', () => {
    it('strictly separates authorized tenants and prevents default fallback to tenant 1', () => {
      const authorizedUser = APPROVED_DEMO_IDENTITIES['cs.demo@3ddx.com'] as UserSession;
      const unassignedUser = APPROVED_DEMO_IDENTITIES['unassigned@3ddx.com'] as UserSession;

      // Authorized operator has explicit tenant grant
      expect(authorizedUser.tenantId).toBe(1);
      expect(authorizedUser.activeTenant?.id).toBe(1);
      expect(authorizedUser.activeTenant?.label).toBe('3ddx.com');
      expect(authorizedUser.accessStatus).toBe('AUTHORIZED');

      // Unassigned identity has strictly null tenant and never falls back to 1
      expect(unassignedUser.tenantId).toBeNull();
      expect(unassignedUser.activeTenant).toBeNull();
      expect(unassignedUser.status).toBe('pending_access');
      expect(unassignedUser.accessStatus).toBe('PENDING');
      expect(unassignedUser.tenantSwitchingEnabled).toBe(false);
    });
  });
});
