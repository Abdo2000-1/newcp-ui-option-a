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
  ChevronRight
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: FolderOpen, label: 'Cases', path: '/cases' },
  { icon: GitBranch, label: 'Workflow', path: '/workflow-board' },
  { icon: ScanLine, label: 'Scan Center', path: '/scan-center' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
  { icon: Building2, label: 'Clinics', path: '/clinics' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: Receipt, label: 'Billing', path: '/billing' },
  { icon: RefreshCcw, label: 'Change Requests', path: '/change-requests', badge: 4 },
  { icon: TableProperties, label: 'Grid', path: '/grid' },
  { icon: FormInput, label: 'Forms', path: '/forms' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const unreadNotifs = useStore(s => s.getNotifications().filter(n => !n.read).length);
  const profile = useStore(s => s.getProfile());

  const borderColor = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08);

  const renderNavLinks = () => (
    <Box component="nav" aria-label="Main Navigation" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5 }}>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const badgeCount = item.path === '/notifications' ? unreadNotifs : item.badge;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onMobileClose()}
            title={collapsed ? item.label : undefined}
            style={{ textDecoration: 'none' }}
          >
            <ButtonBase
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
                  bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                  color: isDark ? '#f8fafc' : '#0f172a',
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
        );
      })}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
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
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
      </Box>
    </Box>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'block' },
          height: '100vh',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          transition: 'width 0.2s ease',
          width: collapsed ? 80 : 256,
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
