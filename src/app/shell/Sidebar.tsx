import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import { 
  Code2,
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  GitBranch, 
  ScanLine, 
  Users, 
  Stethoscope, 
  Building2, 
  FileText, 
  Receipt, 
  RefreshCcw, 
  BarChart3, 
  Bell, 
  Settings,
  TableProperties,
  FormInput,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sliders,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { AuthContext } from '@/features/auth/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

import Divider from '@mui/material/Divider';

interface NavItem {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspaces',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Package, label: 'Orders Flow', path: '/flow' },
      { icon: GitBranch, label: 'Workflow Board', path: '/workflow-board' },
    ],
  },
  {
    title: 'Laboratory & Production',
    items: [
      { icon: ScanLine, label: 'Scan Center', path: '/scan-center' },
      { icon: FileText, label: 'Documents', path: '/documents' },
    ],
  },
  {
    title: 'Operations & Reports',
    items: [
      { icon: BarChart3, label: 'Reports Hub', path: '/reports' },
    ],
  },
  {
    title: 'Directories & CRM',
    items: [
      { icon: FolderOpen, label: 'Cases', path: '/cases' },
      { icon: Users, label: 'Patients', path: '/patients' },
      { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
      { icon: Building2, label: 'Clinics', path: '/clinics' },
      { icon: Receipt, label: 'Billing', path: '/billing' },
      { icon: RefreshCcw, label: 'Change Requests', path: '/change-requests', badge: 4 },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const unreadNotifs = useStore(s => s.getNotifications().filter(n => !n.read).length);
  const profile = useStore(s => s.getProfile());
  const authContext = React.useContext(AuthContext);
  const handleLogout = () => {
    if (authContext?.logout) {
      authContext.logout();
    }
  };

  const isAdmin = authContext?.session?.family === 'ADMIN' ||
    Boolean(authContext?.session?.roles?.some(r => ['admin', 'system_admin', 'lab_director'].includes(r.toLowerCase()))) ||
    Boolean(authContext?.session?.capabilities?.includes('admin.access')) ||
    Boolean(authContext?.session?.capabilities?.includes('system.configure')) ||
    (!authContext?.session && authContext?.isAuthenticated);

  const visibleNavSections = React.useMemo(() => {
    if (!isAdmin) return navSections;
    return [
      ...navSections,
      {
        title: 'Administration',
        items: [
          { icon: Sliders, label: 'CMS Controls', path: '/admin/cms' },
          { icon: Activity, label: 'PostHog Settings', path: '/admin/posthog' },
          { icon: ShieldAlert, label: 'Sentry Settings', path: '/admin/sentry' },
        ],
      },
    ];
  }, [isAdmin]);

  const borderColor = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08);

  const renderNavLinks = () => (
    <Box component="nav" aria-label="Main Navigation" sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5 }}>
      {visibleNavSections.map((section, sIdx) => (
        <Box key={section.title} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {!collapsed ? (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                px: 1.5,
                pt: sIdx === 0 ? 0.5 : 1.5,
                pb: 0.5,
                userSelect: 'none',
              }}
            >
              {section.title}
            </Typography>
          ) : sIdx > 0 ? (
            <Divider sx={{ my: 0.75, borderColor }} />
          ) : null}

          {section.items.map((item) => {
            const isItemActive = (path: string, currentPath: string): boolean => {
              if (path === '/flow') {
                return currentPath === '/flow' || currentPath.startsWith('/flow/') || currentPath.startsWith('/orders') || currentPath.startsWith('/order-details');
              }
              if (path === '/reports') {
                return currentPath.startsWith('/reports') || currentPath.startsWith('/quarter-targets') || currentPath.startsWith('/task-31');
              }
              if (path === '/scan-center') {
                return currentPath.startsWith('/scan-center') || currentPath.startsWith('/task-47');
              }
              return currentPath.startsWith(path);
            };
            const isActive = isItemActive(item.path, location.pathname);
            const badgeCount = item.path === '/notifications' ? unreadNotifs : item.badge;

            return (
              <Tooltip
                key={item.path}
                title={collapsed ? item.label : ''}
                placement="right"
                arrow
                disableHoverListener={!collapsed}
                disableFocusListener={!collapsed}
              >
                <NavLink
                  to={item.path}
                  onClick={() => onMobileClose()}
                  aria-label={item.label}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <ButtonBase
                    aria-label={item.label}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 1.5,
                      px: collapsed ? 1 : 1.75,
                      py: 1,
                      borderRadius: 2,
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      bgcolor: isActive ? (isDark ? alpha('#0284c7', 0.18) : alpha('#0284c7', 0.1)) : 'transparent',
                      color: isActive ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#475569'),
                      borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
                      '&:hover': {
                        bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.05),
                        color: isDark ? '#f8fafc' : '#0f172a',
                      },
                      '&:focus-visible': {
                        outline: isDark ? '2px solid #38bdf8' : '2px solid #0284c7',
                        outlineOffset: 1,
                        bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.05),
                      },
                    }}
                  >
                  <item.icon size={18} color={isActive ? '#0284c7' : isDark ? '#94a3b8' : '#64748b'} />

                  {!collapsed && (
                    <Typography sx={{ flex: 1, fontSize: '0.8125rem', fontWeight: 'inherit', color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              </Tooltip>
            );
          })}
        </Box>
      ))}
    </Box>
  );

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
          <Tooltip title="Expand sidebar" arrow>
            <IconButton onClick={onToggle} size="small">
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
              <IconButton onClick={onToggle} size="small">
                <ChevronLeft size={18} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Nav Links scroll area */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {renderNavLinks()}
      </Box>

      {/* User Footer Profile */}
      <Box
        sx={{
          borderTop: `1px solid ${borderColor}`,
          p: 1.5,
          flexShrink: 0,
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? 1 : 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: collapsed ? 0 : 1 }}>
          <Tooltip title={collapsed ? `${profile.firstName} ${profile.lastName} (${profile.role})` : ''} arrow placement="right" disableHoverListener={!collapsed}>
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
              {profile.avatarInitials || `${profile.firstName?.[0] || 'J'}${profile.lastName?.[0] || 'R'}`}
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
          </Tooltip>
          {!collapsed && (
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, lineHeight: 1.2 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: '#0284c7', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.role} • Online
              </Typography>
            </Box>
          )}
        </Box>
        <Tooltip title="Sign out" arrow placement={collapsed ? 'right' : 'top'}>
          <IconButton
            size="small"
            aria-label="Sign out"
            onClick={handleLogout}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              borderRadius: 1.5,
              '&:hover': {
                color: '#ef4444',
                bgcolor: isDark ? alpha('#ef4444', 0.12) : alpha('#ef4444', 0.08),
              },
            }}
          >
            <LogOut size={16} />
          </IconButton>
        </Tooltip>
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
              bgcolor: '#ffffff',
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
