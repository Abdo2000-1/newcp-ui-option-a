import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { useAuth } from '@/features/auth';
import {
  APPROVED_NAV_SECTIONS,
  canAccessAdministration,
  isRouteActive,
  type NavSection,
} from './navConfig';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const { session, logout } = useAuth();
  const unreadNotifs = useStore((s) => s.getNotifications().filter((n) => !n.read).length);
  const profile = useStore((s) => s.getProfile());

  const borderColor = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08);
  const isAuthorizedForAdmin = canAccessAdministration(session);

  // Filter sections based on authoritative backend/session capabilities
  const visibleSections = APPROVED_NAV_SECTIONS.filter((section) => {
    if (section.adminOnly) {
      return isAuthorizedForAdmin;
    }
    return true;
  });

  const renderSection = (section: NavSection, sectionIdx: number) => {
    const isFirst = sectionIdx === 0;

    return (
      <Box
        key={section.id}
        data-testid={`nav-section-${section.id}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          mt: isFirst ? 0 : 1.5,
        }}
      >
        {/* Section Heading or Divider */}
        {!collapsed ? (
          <Box
            sx={{
              px: 2,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="caption"
              component="h3"
              data-testid={`section-heading-${section.id}`}
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isDark ? '#64748b' : '#94a3b8',
                userSelect: 'none',
              }}
            >
              {section.title}
            </Typography>
            {section.adminOnly && (
              <Chip
                label="SEC"
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.5625rem',
                  fontWeight: 900,
                  bgcolor: isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1),
                  color: '#0284c7',
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            )}
          </Box>
        ) : (
          !isFirst && <Divider sx={{ my: 0.75, borderColor }} />
        )}

        {/* Section Navigation Items */}
        {section.items.map((item) => {
          const active = isRouteActive(location.pathname, item.path);
          const badgeCount = item.path === '/notifications' ? unreadNotifs : item.badge;
          const Icon = item.icon;

          const buttonContent = (
            <ButtonBase
              tabIndex={0}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              data-testid={`nav-link-${item.id}`}
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
                fontWeight: active ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.15s ease',
                bgcolor: active
                  ? isDark
                    ? alpha('#0284c7', 0.18)
                    : alpha('#0284c7', 0.1)
                  : 'transparent',
                color: active
                  ? isDark
                    ? '#38bdf8'
                    : '#0284c7'
                  : isDark
                    ? '#94a3b8'
                    : '#475569',
                borderLeft: active ? '3px solid #0284c7' : '3px solid transparent',
                '&:hover': {
                  bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
                '&:focus-visible': {
                  outline: '2px solid #0284c7',
                  outlineOffset: '2px',
                },
              }}
            >
              <Icon size={18} color={active ? '#0284c7' : isDark ? '#94a3b8' : '#64748b'} />

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
                    bgcolor: active ? '#0284c7' : '#e11d48',
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
          );

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => onMobileClose()}
              style={{ textDecoration: 'none' }}
            >
              {collapsed ? (
                <Tooltip title={item.label} arrow placement="right">
                  {buttonContent}
                </Tooltip>
              ) : (
                buttonContent
              )}
            </NavLink>
          );
        })}
      </Box>
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
        position: 'relative',
      }}
    >
      {/* Brand Header & Compact Toggle Controls */}
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
              data-testid="sidebar-toggle-expand"
            >
              <ChevronRight size={18} />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Box
              component={NavLink}
              to="/home"
              title="3DDX Home"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                overflow: 'hidden',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}logo-3ddx-full.png`}
                alt="3DDX Brand Logo"
                style={{ height: 22, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Tooltip title="Collapse sidebar" arrow placement="bottom">
              <IconButton
                onClick={onToggle}
                size="small"
                aria-label="Collapse sidebar"
                data-testid="sidebar-toggle-collapse"
              >
                <ChevronLeft size={18} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Nav Links scroll area - Fully vertically scrollable */}
      <Box
        component="nav"
        aria-label="Sectioned Main Navigation"
        data-testid="sidebar-scrollable-container"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 1.5,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.15),
            borderRadius: '3px',
          },
        }}
      >
        {visibleSections.map((section, idx) => renderSection(section, idx))}
      </Box>

      {/* Outer Border Clickable Strip for Collapse/Expand (Requirement 10) */}
      <Box
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-label={collapsed ? 'Expand sidebar via border' : 'Collapse sidebar via border'}
        data-testid="sidebar-border-toggle"
        title={collapsed ? 'Click border to expand sidebar' : 'Click border to collapse sidebar'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 5,
          cursor: 'col-resize',
          zIndex: 45,
          transition: 'all 0.15s ease',
          bgcolor: 'transparent',
          '&:hover': {
            bgcolor: alpha('#0284c7', 0.5),
            width: 7,
          },
          '&:focus-visible': {
            outline: '2px solid #0284c7',
            bgcolor: alpha('#0284c7', 0.25),
          },
        }}
      />

      {/* User Footer Profile & Small Logout Action (Requirement 14) */}
      <Box
        sx={{
          borderTop: `1px solid ${borderColor}`,
          p: 1.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1,
        }}
      >
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
            {profile.avatarInitials || `${profile.firstName?.[0] || 'J'}${profile.lastName?.[0] || 'R'}`}
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
          {!collapsed && (
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
                {session?.fullName || `${profile.firstName} ${profile.lastName}`}
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
                {session?.family || profile.role} • Online
              </Typography>
            </Box>
          )}
        </Box>

        {/* Small Logout Icon near Profile Area (Requirement 14) */}
        <Tooltip title="Log out" arrow placement={collapsed ? 'right' : 'top'}>
          <IconButton
            size="small"
            onClick={() => logout()}
            aria-label="Log out"
            data-testid="sidebar-logout-button"
            sx={{
              p: 0.75,
              borderRadius: 1.5,
              color: isDark ? '#94a3b8' : '#64748b',
              flexShrink: 0,
              '&:hover': {
                color: '#ef4444',
                bgcolor: alpha('#ef4444', 0.1),
              },
              '&:focus-visible': {
                outline: '2px solid #ef4444',
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
        data-testid="desktop-sidebar-aside"
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
          data-testid="mobile-sidebar-drawer"
          sx={{
            display: { lg: 'none' },
            position: 'fixed',
            inset: 0,
            zIndex: 50,
          }}
        >
          <Box
            onClick={onMobileClose}
            data-testid="mobile-drawer-backdrop"
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
