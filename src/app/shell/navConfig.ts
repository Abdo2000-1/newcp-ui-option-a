import {
  Home,
  Package,
  FolderOpen,
  FilePlus2,
  RefreshCcw,
  TrendingUp,
  Boxes,
  Users2,
  BarChart3,
  Users,
  Stethoscope,
  Building2,
  ScanLine,
  FileText,
  Receipt,
  Bell,
  Settings,
  Shield,
  Code2,
  type LucideIcon,
} from 'lucide-react';
import type { UserSession } from '@/features/auth';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
  adminOnly?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  adminOnly?: boolean;
  items: NavItem[];
}

/**
 * Approved Navigation Sections and Destinations
 * Adheres strictly to approved routes:
 * 1. Workspaces
 * 2. Clinical Operations
 * 3. Directory & Practice
 * 4. Preferences & System
 * 5. Administration (CMS, Settings, Swagger/API Docs) - Admin / Senior roles only
 *
 * Notice: Order Details and Edit Case are deliberately excluded from navigation items,
 * but are mapped in isRouteActive to highlight Orders and Cases respectively.
 */
export const APPROVED_NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspaces',
    title: 'Workspaces',
    items: [
      { id: 'home', label: 'Home', path: '/home', icon: Home },
      { id: 'orders', label: 'Orders', path: '/orders', icon: Package },
      { id: 'addCase', label: 'Add Case', path: '/add-case', icon: FilePlus2 },
      { id: 'changeRequests', label: 'Change Requests', path: '/change-requests', icon: RefreshCcw, badge: 4 },
    ],
  },
  {
    id: 'intelligence',
    title: 'Clinical Operations',
    items: [
      { id: 'liveDashboard', label: 'Live Dashboard', path: '/quarter-targets', icon: TrendingUp },
      { id: 'task47', label: '3D Models (Task 47)', path: '/task-47', icon: Boxes },
      { id: 'task31', label: 'Staff Targets (Task 31)', path: '/task-31', icon: Users2 },
      { id: 'reports', label: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    id: 'directory',
    title: 'Directory & Practice',
    items: [
      { id: 'patients', label: 'Patients', path: '/patients', icon: Users },
      { id: 'doctors', label: 'Doctors', path: '/doctors', icon: Stethoscope },
      { id: 'clinics', label: 'Clinics', path: '/clinics', icon: Building2 },
      { id: 'scanCenter', label: 'Scan Center', path: '/scan-center', icon: ScanLine },
      { id: 'documents', label: 'Documents', path: '/documents', icon: FileText },
      { id: 'billing', label: 'Billing', path: '/billing', icon: Receipt },
    ],
  },
  {
    id: 'system',
    title: 'Preferences & System',
    items: [
      { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    adminOnly: true,
    items: [
      { id: 'cms', label: 'CMS Controls', path: '/cms', icon: Shield, adminOnly: true },
      { id: 'adminSettings', label: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
      { id: 'swagger', label: 'API Documentation', path: '/api-docs', icon: Code2, adminOnly: true },
    ],
  },
];

/**
 * Checks whether user has permission to view Administration section.
 * Strictly adheres to backend/session capabilities, family, and roles.
 * Never infers authorization from email addresses or client strings.
 */
export function canAccessAdministration(session: UserSession | null): boolean {
  if (!session) return false;
  if (session.status === 'pending_access' || session.accessStatus === 'PENDING') {
    return false;
  }
  // 1. Session family
  if (session.family === 'ADMIN') return true;

  // 2. Session capabilities
  if (session.capabilities?.includes('iam.roles.assign') || session.capabilities?.includes('admin.access')) {
    return true;
  }

  // 3. Approved session roles (tenant_admin, super_admin, senior roles where approved)
  if (session.roles?.some((r) => {
    const roleLower = r.toLowerCase();
    return (
      roleLower === 'tenant_admin' ||
      roleLower.includes('admin') ||
      roleLower.includes('super_admin') ||
      roleLower.includes('senior')
    );
  })) {
    return true;
  }

  return false;
}

/**
 * Route active mapping:
 * - /order-details highlights /orders
 * - /flow highlights /orders
 * - /edit-case highlights /cases
 * - /swagger highlights /api-docs
 */
export function isRouteActive(currentPath: string, itemPath: string): boolean {
  if (currentPath === itemPath) return true;

  if (itemPath === '/orders') {
    return (
      currentPath === '/orders' ||
      currentPath.startsWith('/orders/') ||
      currentPath === '/flow' ||
      currentPath.startsWith('/order-details') || currentPath.startsWith('/edit-case')
    );
  }



  if (itemPath === '/quarter-targets') {
    return currentPath === '/quarter-targets' || currentPath === '/live-dashboard';
  }

  if (itemPath === '/home') {
    return currentPath === '/home';
  }

  if (itemPath === '/api-docs') {
    return currentPath === '/api-docs' || currentPath === '/swagger';
  }

  return currentPath.startsWith(itemPath);
}
