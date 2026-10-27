import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  Home,
  LayoutDashboard,
  Package,
  FolderOpen,
  FilePlus2,
  GitBranch,
  RefreshCcw,
  BarChart3,
  Boxes,
  Target,
  FileSpreadsheet,
  Users,
  Stethoscope,
  Building2,
  ScanLine,
  FileText,
  Receipt,
  Bell,
  Settings,
  Sliders,
  Code2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { useAuth } from '@/features/auth';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  badge?: number;
}

export interface NavSection {
  id: string;
  title: string;
  adminOnly?: boolean;
  items: NavItem[];
}

/**
 * Approved application navigation sections and routes.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspaces',
    title: 'Workspaces',
    items: [
      { id: 'home', label: 'Home', path: '/home', icon: Home },
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', path: '/orders', icon: Package },
      { id: 'cases', label: 'Cases', path: '/cases', icon: FolderOpen },
      { id: 'addCase', label: 'Add Case', path: '/add-case', icon: FilePlus2 },
      { id: 'workflowBoard', label: 'Workflow Board', path: '/workflow-board', icon: GitBranch },
      { id: 'changeRequests', label: 'Change Requests', path: '/change-requests', icon: RefreshCcw, badge: 4 },
    ],
  },
  {
    id: 'intelligence',
    title: 'Clinical Intelligence',
    items: [
      { id: 'quarterTargets', label: 'Quarter Targets', path: '/quarter-targets', icon: BarChart3 },
      { id: 'models', label: '3D Model Work', path: '/task-47', icon: Boxes },
      { id: 'staffTargets', label: 'Staff Targets', path: '/task-31', icon: Target },
      { id: 'reports', label: 'Reports', path: '/reports', icon: FileSpreadsheet },
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
    title: 'System & Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
      { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    adminOnly: true,
    items: [
      { id: 'cms', label: 'CMS Controls', path: '/cms', icon: Sliders },
      { id: 'configManager', label: 'Config Manager', path: '/config-manager', icon: Code2 },
    ],
  },
];

/**
 * Determines whether a sidebar navigation destination should be marked active.
 * Guarantees that Order Details remains highlighted under the 'Orders' navigation item
 * and supports deep nested links (e.g., /cases/:id, /patients/:id, etc.).
 */
export function isRouteActive(currentPath: string, itemPath: string): boolean {
  if (currentPath === itemPath) return true;

  // Active state highlighting for Orders
  if (itemPath === '/orders') {
    if (currentPath === '/flow' || currentPath.startsWith('/flow/')) return true;
    if (currentPath === '/order-details' || currentPath.startsWith('/order-details')) return true;
    if (currentPath.startsWith('/orders/')) return true;
  }

  // Active state highlighting for Cases
  if (itemPath === '/cases') {
    if (currentPath.startsWith('/cases/')) return true;
    if (currentPath === '/edit-case' || currentPath.startsWith('/edit-case')) return true;
  }

  // Active state highlighting for deep-link directory entities
  if (itemPath === '/patients' && currentPath.startsWith('/patients/')) return true;
  if (itemPath === '/doctors' && currentPath.startsWith('/doctors/')) return true;
  if (itemPath === '/clinics' && currentPath.startsWith('/clinics/')) return true;

  // Generic prefix matching for non-root routes
  if (itemPath !== '/' && currentPath.startsWith(itemPath + '/')) {
    return true;
  }

  return false;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const unreadNotifs = useStore((s) => s.getNotifications().filter((n) => !n.read).length);
  const profile = useStore((s) => s.getProfile());
  const { session, logout } = useAuth();

  // NOTE: Frontend navigation visibility check is strictly for UI personalization and UX ergonomics.
  // Real security boundaries, authorization enforcement, and tenant isolation are strictly governed
  // by backend APIs, Casbin IAM policies, and route guards. Never rely on frontend checks for security.
  const isAdmin = Boolean(
    session?.roles?.includes('admin') ||
    session?.roles?.includes('ADMIN') ||
    (session as any)?.role === 'admin' ||
    profile?.role?.toLowerCase() === 'admin'
  );

  const visibleSections = NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin);

  const borderColor = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (session?.fullName || 'Operator');
  const userRole = profile?.role || (session?.roles?.[0] ? session.roles[0].toUpperCase() : 'CS Specialist');
  const avatarInitials = profile?.avatarInitials || `${userName.charAt(0) || '3'}${userName.split(' ')[1]?.charAt(0) || 'D'}`;

  const renderNavItem = (item: NavItem) => {
    const isActive = isRouteActive(location.pathname, item.path);
    const badgeCount = item.path === '/notifications' ? unreadNotifs : item.badge;
    const IconComponent = item.icon;

    const navLink = (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={() => onMobileClose()}
        aria-current={isActive ? 'page' : undefined}
        style={{ textDecoration: 'none', display: 'block', width: '100%' }}
      >
        <ButtonBase
          aria-label={item.label}
          data-testid={`sidebar-nav-${item.id}`}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.5,
            px: collapsed ? 1 : 1.75,
            py: 0.85,
            borderRadius: 2,
            fontSize: '0.8125rem',
            fontWeight: isActive ? 800 : 600,
            cursor: 'pointer',
            textAlign: 'left',
            position: 'relative',
            transition: 'all 0.15s ease',
            bgcolor: isActive
              ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1))
              : 'transparent',
            color: isActive
              ? (isDark ? '#38bdf8' : '#0284c7')
              : (isDark ? '#94a3b8' : '#475569'),
            borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
            '&:hover': {
              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
              color: isDark ? '#f8fafc' : '#0f172a',
            },
          }}
        >
          <IconComponent
            size={18}
            color={isActive ? '#0284c7' : isDark ? '#94a3b8' : '#64748b'}
          />

          {!collapsed && (
            <Typography
              sx={{
                flex: 1,
                fontSize: '0.8125rem',
                fontWeight: 'inherit',
                color: 'inherit',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Typography>
          )}

          {!collapsed && Boolean(badgeCount) && (
            <Chip
              label={badgeCount}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 900,
                bgcolor: isActive ? '#0284c7' : '#e11d48',
                color: '#ffffff',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}

          {collapsed && Boolean(badgeCount) && (
            <Box
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#0284c7',
                boxShadow: '0 0 6px #0284c7',
              }}
            />
          )}
        </ButtonBase>
      </NavLink>
    );

    return (
      <Tooltip
        key={item.id}
        title={item.label}
        placement="right"
        arrow
        disableHoverListener={!collapsed}
      >
        <div>{navLink}</div>
      </Tooltip>
    );
  };

  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        bgcolor: isDark ? '#070b14' : '#ffffff',
        borderRight: `1px solid ${borderColor}`,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          display: 'flex',
          height: 64,
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2,
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <Tooltip title="Expand sidebar" arrow placement="right">
            <IconButton
              onClick={onToggle}
              size="small"
              aria-label="Expand sidebar"
              data-testid="sidebar-toggle-button"
            >
              <ChevronRight size={18} />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Box
              component={NavLink}
              to="/dashboard"
              title="3DDX Dashboard"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden', textDecoration: 'none', cursor: 'pointer' }}
            >
              <img
                src={`${import.meta.env.BASE_URL}logo-3ddx-full.png`}
                alt="3DDX Brand Logo"
                style={{ height: 22, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Tooltip title="Collapse sidebar" arrow>
              <IconButton
                onClick={onToggle}
                size="small"
                aria-label="Collapse sidebar"
                data-testid="sidebar-toggle-button"
              >
                <ChevronLeft size={18} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Nav Links scroll area */}
      <Box
        component="nav"
        aria-label="Sidebar Navigation"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: collapsed ? 1 : 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          },
        }}
      >
        {visibleSections.map((section, idx) => (
          <Box key={section.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {!collapsed ? (
              <Typography
                variant="caption"
                sx={{
                  px: 1.75,
                  pt: idx === 0 ? 0 : 0.75,
                  pb: 0.25,
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isDark ? '#64748b' : '#94a3b8',
                }}
              >
                {section.title}
              </Typography>
            ) : (
              idx > 0 && (
                <Box
                  sx={{
                    my: 0.5,
                    mx: 'auto',
                    width: 24,
                    height: 1,
                    bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
                  }}
                />
              )
            )}
            {section.items.map((item) => renderNavItem(item))}
          </Box>
        ))}
      </Box>

      {/* User Footer Profile & Compact Logout */}
      <Box
        sx={{
          borderTop: `1px solid ${borderColor}`,
          p: 1.5,
          flexShrink: 0,
          mt: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          bgcolor: isDark ? alpha('#000000', 0.2) : alpha('#000000', 0.02),
        }}
      >
        {collapsed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box
              title={`${userName} (${userRole})`}
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #00706a 0%, #0284c7 100%)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {avatarInitials}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: '#059669',
                  border: '2px solid #ffffff',
                }}
              />
            </Box>
            <Tooltip title="Log out" arrow placement="right">
              <IconButton
                onClick={handleLogout}
                size="small"
                aria-label="Log out"
                data-testid="sidebar-logout-button"
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  color: isDark ? '#94a3b8' : '#64748b',
                  '&:hover': {
                    bgcolor: alpha('#ef4444', 0.12),
                    color: '#ef4444',
                  },
                }}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #00706a 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {avatarInitials}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#059669',
                    border: '2px solid #ffffff',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, lineHeight: 1.2 }}>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    color: '#0284c7',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userRole} • Online
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Log out" arrow>
              <IconButton
                onClick={handleLogout}
                size="small"
                aria-label="Log out"
                data-testid="sidebar-logout-button"
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  color: isDark ? '#94a3b8' : '#64748b',
                  '&:hover': {
                    bgcolor: alpha('#ef4444', 0.12),
                    color: '#ef4444',
                  },
                }}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: collapsed ? 80 : 256,
          flexShrink: 0,
          transition: 'width 0.2s ease',
        }}
        aria-hidden="true"
      />
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'block' },
          height: '100vh',
          width: collapsed ? 80 : 256,
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          transition: 'width 0.2s ease',
        }}
      >
        {sidebarContent}
      </Box>

      {/* 2. Mobile Drawer */}
      {mobileOpen && (
        <Box
          sx={{
            display: { lg: 'none' },
            position: 'fixed',
            inset: 0,
            zIndex: 50,
          }}
        >
          <Box
            onClick={onMobileClose}
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
            aria-hidden="true"
          />
          <Box
            sx={{
              position: 'relative',
              height: '100%',
              maxWidth: 288,
              width: '100%',
              bgcolor: isDark ? '#070b14' : '#ffffff',
              zIndex: 50,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {sidebarContent}
          </Box>
        </Box>
      )}
    </>
  );
}

export default Sidebar;
