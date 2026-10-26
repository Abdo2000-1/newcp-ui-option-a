import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  Layers,
  Code2,
  FilePlus2,
  FileText,
  TrendingUp,
  Boxes,
  LayoutDashboard,
  Users2,
  FileEdit,
  GripVertical,
  GripHorizontal,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  PanelTopClose,
  PanelBottomClose,
  PanelLeftClose,
  PanelRightClose,
  Check,
  ChevronDown,
  Shield,
  User,
  LogOut,
  Search,
  Move
} from 'lucide-react';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useLanguage, LANGUAGES, LanguageFlag } from '@/app/providers/contexts/LanguageContext';
import { useStore } from '@/shared/hooks/useStore';
import { ProfileModal } from './ProfileModal';
import { GlobalSearchModal } from './GlobalSearchModal';

export type NavPosition = 'top' | 'left' | 'right' | 'bottom';

interface ConvertibleNavProps {
  position: NavPosition;
  onChangePosition: (pos: NavPosition) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isDraggingNav: boolean;
  setIsDraggingNav: (dragging: boolean) => void;
  onOpenMobile?: () => void;
}

export function ConvertibleNav({
  position,
  onChangePosition,
  collapsed,
  onToggleCollapse,
  isDraggingNav: _isDraggingNav,
  setIsDraggingNav,
}: ConvertibleNavProps) {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const { theme, toggleTheme } = useThemeContext();
  const { language, setLanguage, currentOption, t } = useLanguage();

  const isDark = muiTheme.palette.mode === 'dark';

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [ordersDropdownOpen, setOrdersDropdownOpen] = useState(false);
  const [opsDropdownOpen, setOpsDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const isTier2DropdownOpen = ordersDropdownOpen || opsDropdownOpen;

  const langRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const ordersDropdownRef = useRef<HTMLDivElement>(null);
  const opsDropdownRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const profile = useStore((s) => s.getProfile());

  // 8 Target Pages from 3DDX CP (For vertical sidebar)
  const targetNavItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { id: 'flow', label: t('nav.flow', 'Master Orders Flow'), path: '/flow', icon: Layers },
    { id: 'addCase', label: t('nav.addCase', 'Add New Case'), path: '/add-case', icon: FilePlus2 },
    { id: 'orderDetails', label: t('nav.orderDetails', 'Order Details'), path: '/order-details?id=504901', icon: FileText },
    { id: 'quarterTargets', label: t('nav.quarterTargets', 'Quarter Targets'), path: '/quarter-targets', icon: TrendingUp },
    { id: 'task47', label: t('nav.task47', 'Task 47: Models'), path: '/task-47', icon: Boxes },
    { id: 'task31', label: t('nav.task31', 'Task 31: Staff Targets'), path: '/task-31', icon: Users2 },
    { id: 'editCase', label: t('nav.editCase', 'Edit Case'), path: '/edit-case', icon: FileEdit },
      ];

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (ordersDropdownRef.current && !ordersDropdownRef.current.contains(e.target as Node)) {
        setOrdersDropdownOpen(false);
      }
      if (opsDropdownRef.current && !opsDropdownRef.current.contains(e.target as Node)) {
        setOpsDropdownOpen(false);
      }
      if (posRef.current && !posRef.current.contains(e.target as Node)) {
        setPosDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // HTML5 Drag Handlers (Single Repositioning Technique: Drag & Drop Only)
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', position);
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingNav(true);
  };

  const handleDragEnd = () => {
    setIsDraggingNav(false);
  };

  // Pointer drag for instant hand-dragging without native browser drag quirks
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingNav(true);

    const onPointerMove = (moveEvt: PointerEvent) => {
      const clientX = moveEvt.clientX;
      const clientY = moveEvt.clientY;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (clientY < 80) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'top' }));
      } else if (clientY > winH - 80) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'bottom' }));
      } else if (clientX < 140) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'left' }));
      } else if (clientX > winW - 140) {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: 'right' }));
      } else {
        window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: null }));
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setIsDraggingNav(false);

      const clientX = upEvt.clientX;
      const clientY = upEvt.clientY;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (clientY < 100) {
        onChangePosition('top');
      } else if (clientY > winH - 100) {
        onChangePosition('bottom');
      } else if (clientX < 160) {
        onChangePosition('left');
      } else if (clientX > winW - 160) {
        onChangePosition('right');
      }
      window.dispatchEvent(new CustomEvent('nav-hover-zone', { detail: null }));
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const isVertical = position === 'left' || position === 'right';

  // Surface style tokens
  const tier1Bg = isDark ? alpha('#0a1b32', 0.95) : alpha('#ffffff', 0.96);
  const tier1Border = isDark ? alpha('#38bdf8', 0.16) : alpha('#0284c7', 0.14);
  const tier2Bg = isDark ? alpha('#071526', 0.92) : alpha('#f0f9ff', 0.94);
  const tier2Border = isDark ? alpha('#38bdf8', 0.12) : alpha('#0284c7', 0.12);

  if (!isVertical) {
    return (
      <>
        {/* Fixed Top or Bottom 2-Tier Navigation Bar */}
        <Box
          component="div"
          sx={{
            position: position === 'top' ? 'fixed' : 'relative',
            top: position === 'top' ? 0 : 'auto',
            left: 0,
            right: 0,
            zIndex: 50,
            width: '100%',
            boxShadow: position === 'top' ? (isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.06)') : 'none',
          }}
        >
          {/* ================================================================= */}
          {/* TIER 1: GLOBAL UTILITY BAR (STATIONARY ACROSS ALL PAGES)          */}
          {/* ================================================================= */}
          <Box
            component="header"
            sx={{
              width: '100%',
              bgcolor: tier1Bg,
              backdropFilter: 'blur(12px)',
              borderBottom: position === 'top' ? `1px solid ${tier1Border}` : 'none',
              borderTop: position === 'bottom' ? `1px solid ${tier1Border}` : 'none',
              position: position === 'bottom' ? 'fixed' : 'relative',
              bottom: position === 'bottom' ? 0 : 'auto',
              left: 0,
              right: 0,
              zIndex: 50,
              userSelect: 'none',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 1920,
                mx: 'auto',
                px: { xs: 2, sm: 3 },
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              {/* Left: Drag Handle, Quick Dock Menu & Brand Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                {/* Hand Drag Handle: Drag & Drop anywhere */}
                <Tooltip title="Click & Drag to dock navigation anywhere (Top, Left, Right, Bottom)" arrow>
                  <IconButton
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onPointerDown={handlePointerDownDrag}
                    size="small"
                    aria-label="Drag navigation dock"
                    sx={{
                      cursor: 'grab',
                      '&:active': { cursor: 'grabbing' },
                      color: isDark ? 'sky.400' : '#0284c7',
                      bgcolor: isDark ? alpha('#38bdf8', 0.08) : alpha('#0284c7', 0.06),
                      border: `1px solid ${alpha(isDark ? '#38bdf8' : '#0284c7', 0.2)}`,
                      borderRadius: 2,
                      p: 0.75,
                      '&:hover': {
                        bgcolor: isDark ? alpha('#38bdf8', 0.16) : alpha('#0284c7', 0.12),
                      },
                    }}
                  >
                    <GripVertical size={16} />
                  </IconButton>
                </Tooltip>

                {/* Quick Dock Position Selector Dropdown Menu */}
                <Box sx={{ position: 'relative' }} ref={posRef}>
                  <ButtonBase
                    type="button"
                    onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 2,
                      border: `1px solid ${tier1Border}`,
                      bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.02),
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.05),
                        borderColor: isDark ? 'sky.400' : '#0284c7',
                      },
                    }}
                    title="Choose navigation dock position directly from menu"
                  >
                    <Move size={13} color={isDark ? '#38bdf8' : '#0284c7'} />
                    <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' }, textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 800 }}>
                      {position}
                    </Typography>
                    <ChevronDown size={12} style={{ transform: posDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.6 }} />
                  </ButtonBase>

                  {posDropdownOpen && (
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        ...(position === 'bottom' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
                        width: 210,
                        p: 1,
                        borderRadius: 3,
                        bgcolor: isDark ? '#0c1222' : '#ffffff',
                        border: `1px solid ${isDark ? alpha('#38bdf8', 0.25) : alpha('#0284c7', 0.2)}`,
                        zIndex: 60,
                      }}
                    >
                      <Typography sx={{ px: 1, py: 0.5, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                        Dock Navbar Position
                      </Typography>

                      {[
                        { pos: 'top' as const, label: 'Top Navbar (Fixed)', icon: PanelTopClose },
                        { pos: 'bottom' as const, label: 'Bottom Taskbar', icon: PanelBottomClose },
                        { pos: 'left' as const, label: 'Left Sidebar', icon: PanelLeftClose },
                        { pos: 'right' as const, label: 'Right Sidebar', icon: PanelRightClose },
                      ].map((item) => (
                        <ButtonBase
                          key={item.pos}
                          type="button"
                          onClick={() => {
                            onChangePosition(item.pos);
                            setPosDropdownOpen(false);
                          }}
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left',
                            bgcolor: position === item.pos ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1)) : 'transparent',
                            color: position === item.pos ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#e2e8f0' : '#1e293b'),
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <item.icon size={15} color={position === item.pos ? '#0284c7' : '#94a3b8'} />
                            <span>{item.label}</span>
                          </Box>
                          {position === item.pos && <Check size={14} color="#0284c7" />}
                        </ButtonBase>
                      ))}
                    </Paper>
                  )}
                </Box>

                {/* Brand Logo (Links to Home) */}
                <NavLink
                  to="/dashboard"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
                  title="3D Diagnostix Cloud ERP - Home"
                >
                  <Box
                    sx={{
                      height: 32,
                      px: 1,
                      borderRadius: 2,
                      bgcolor: isDark ? '#0c1222' : '#ffffff',
                      border: `1px solid ${tier1Border}`,
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}logo-3ddx-full.png`}
                      alt="3D Diagnostix"
                      style={{ height: 20, width: 'auto', objectFit: 'contain' }}
                    />
                  </Box>
                </NavLink>
              </Box>

              {/* Center: Streamlined Global Search Bar (Spotlight Powered) */}
              <Box sx={{ flex: 1, maxWidth: 420, mx: { xs: 1, sm: 3 }, display: { xs: 'none', md: 'block' } }}>
                <ButtonBase
                  onClick={() => setIsSearchModalOpen(true)}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 0.85,
                    borderRadius: 3,
                    bgcolor: isDark ? alpha('#0c1222', 0.8) : alpha('#ffffff', 0.9),
                    border: `1px solid ${tier1Border}`,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isDark ? '#38bdf8' : '#0284c7',
                      bgcolor: isDark ? '#0c1222' : '#ffffff',
                      boxShadow: `0 0 0 2px ${alpha(isDark ? '#38bdf8' : '#0284c7', 0.15)}`,
                    },
                  }}
                  title="Search cases, orders, clinicians (Ctrl+K)"
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: isDark ? '#94a3b8' : '#64748b' }}>
                    <Search size={14} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'inherit' }}>
                      Spotlight Search...
                    </Typography>
                  </Box>
                  <Chip
                    label="Ctrl+K"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06),
                      color: isDark ? '#cbd5e1' : '#475569',
                      borderRadius: 1.5,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                </ButtonBase>
              </Box>

              {/* Right: Language, Theme & User Profile Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                {/* Language Switcher */}
                <Box sx={{ position: 'relative' }} ref={langRef}>
                  <ButtonBase
                    type="button"
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      p: 0.75,
                      px: 1.25,
                      borderRadius: 2,
                      border: `1px solid ${tier1Border}`,
                      bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.02),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: isDark ? 'sky.400' : '#0284c7',
                      },
                    }}
                    title="Change System Language"
                  >
                    <LanguageFlag code={currentOption.code} />
                    <Typography component="span" sx={{ display: { xs: 'none', lg: 'inline' }, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {currentOption.code}
                    </Typography>
                    <ChevronDown size={11} style={{ opacity: 0.6 }} />
                  </ButtonBase>

                  {langDropdownOpen && (
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        ...(position === 'bottom' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
                        width: 175,
                        p: 1,
                        borderRadius: 3,
                        bgcolor: isDark ? '#0c1222' : '#ffffff',
                        border: `1px solid ${isDark ? alpha('#38bdf8', 0.25) : alpha('#0284c7', 0.2)}`,
                        zIndex: 60,
                      }}
                    >
                      <Typography sx={{ px: 1, py: 0.5, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                        Select Language
                      </Typography>
                      {LANGUAGES.map((lang) => (
                        <ButtonBase
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setLangDropdownOpen(false);
                          }}
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 1.25,
                            py: 0.75,
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            bgcolor: language === lang.code ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1)) : 'transparent',
                            color: language === lang.code ? (isDark ? '#38bdf8' : '#0284c7') : 'inherit',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LanguageFlag code={lang.code} />
                            <span>{lang.nativeName}</span>
                          </Box>
                          {language === lang.code && <Check size={13} color="#0284c7" />}
                        </ButtonBase>
                      ))}
                    </Paper>
                  )}
                </Box>

                {/* Theme Toggle */}
                <Tooltip title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} arrow>
                  <IconButton
                    onClick={toggleTheme}
                    size="small"
                    aria-label="Toggle Theme"
                    sx={{
                      p: 0.75,
                      borderRadius: 2,
                      border: `1px solid ${tier1Border}`,
                      bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.02),
                      color: isDark ? '#fbbf24' : '#475569',
                      '&:hover': {
                        bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.05),
                        color: isDark ? '#f59e0b' : '#0284c7',
                      },
                    }}
                  >
                    {theme === 'dark' ? (
                      <Sun size={17} style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
                    ) : (
                      <Moon size={17} />
                    )}
                  </IconButton>
                </Tooltip>

                {/* Operator Avatar -> Navigates to dedicated profile page */}
                <Tooltip title="View Operator Profile" arrow>
                  <ButtonBase
                    component={NavLink}
                    to="/profile"
                    aria-label="Operator Avatar"
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #0284c7 0%, #ea580c 100%)',
                      color: '#ffffff',
                      fontSize: '0.6875rem',
                      fontWeight: 900,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  >
                    {profile?.avatarInitials || '3D'}
                  </ButtonBase>
                </Tooltip>

                {/* User Profile Dropdown Menu */}
                <Box sx={{ position: 'relative' }} ref={profileDropdownRef}>
                  <ButtonBase
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 0.5,
                      pl: 1,
                      pr: 1.25,
                      borderRadius: 2.5,
                      border: `1px solid ${tier1Border}`,
                      bgcolor: isDark ? alpha('#0c1222', 0.7) : alpha('#ffffff', 0.8),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: isDark ? 'sky.400' : '#0284c7',
                      },
                    }}
                    title="Operator Profile & Account Menu"
                    aria-label="Operator Profile & Account Menu"
                  >
                    <Box sx={{ display: { xs: 'none', xl: 'flex' }, flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile?.firstName || 'Abdu M.'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: '#ea580c' }}>
                        Lead Specialist
                      </Typography>
                    </Box>
                    <ChevronDown size={12} style={{ opacity: 0.6 }} />
                  </ButtonBase>

                  {profileDropdownOpen && (
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        ...(position === 'bottom' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
                        width: 250,
                        p: 1.25,
                        borderRadius: 3,
                        bgcolor: isDark ? '#0c1222' : '#ffffff',
                        border: `1px solid ${isDark ? alpha('#38bdf8', 0.25) : alpha('#0284c7', 0.2)}`,
                        zIndex: 60,
                      }}
                    >
                      <Box sx={{ p: 1, mb: 1, borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06)}` }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 900 }}>
                          {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Abdu Mohamed'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                          a.aladawy@3ddx.com • ID: 3DDX-9942
                        </Typography>
                      </Box>

                      <NavLink
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            p: 1,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                              color: '#0284c7',
                            },
                          }}
                        >
                          <User size={15} color="#0284c7" />
                          <span>Operator Profile & Credentials</span>
                        </Box>
                      </NavLink>

                      <NavLink
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            p: 1,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                              color: '#059669',
                            },
                          }}
                        >
                          <Shield size={15} color="#059669" />
                          <span>Security & Preferences</span>
                        </Box>
                      </NavLink>

                      <Divider sx={{ my: 0.75 }} />

                      <NavLink
                        to="/login"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            p: 1,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#e11d48',
                            '&:hover': {
                              bgcolor: alpha('#e11d48', 0.08),
                            },
                          }}
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </Box>
                      </NavLink>
                    </Paper>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ================================================================= */}
          {/* TIER 2: SECONDARY WORKSPACE SUB-NAVBAR                            */}
          {/* ================================================================= */}
          <Box
            component="nav"
            sx={{
              width: '100%',
              bgcolor: tier2Bg,
              backdropFilter: 'blur(8px)',
              borderBottom: position === 'top' ? `1px solid ${tier2Border}` : 'none',
              borderTop: position === 'bottom' ? `1px solid ${tier2Border}` : 'none',
              position: position === 'bottom' ? 'fixed' : 'relative',
              bottom: position === 'bottom' ? 56 : 'auto',
              left: 0,
              right: 0,
              zIndex: 40,
              userSelect: 'none',
            }}
          >
            <div
              data-testid="tier2-nav-container"
              className={`w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-4 ${isTier2DropdownOpen ? 'overflow-visible' : 'overflow-x-auto md:overflow-visible no-scrollbar'}`}
            >
              {/* Categorized Spread Menus */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, position: 'relative' }}>
                {/* 1. Dashboard */}
                <NavLink
                  to="/dashboard"
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                        bgcolor: isActive ? (isDark ? '#0c1222' : '#ffffff') : 'transparent',
                        color: isActive ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#475569'),
                        border: `1px solid ${isActive ? (isDark ? alpha('#38bdf8', 0.3) : alpha('#0284c7', 0.2)) : 'transparent'}`,
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                        '&:hover': {
                          color: isDark ? '#f8fafc' : '#0f172a',
                          bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.8),
                        },
                      }}
                    >
                      <LayoutDashboard size={13} />
                      <span>Dashboard</span>
                    </Box>
                  )}
                </NavLink>

                {/* 2. Orders & Cases Spread Dropdown */}
                <Box sx={{ position: 'relative' }} ref={ordersDropdownRef}>
                  <ButtonBase
                    type="button"
                    aria-expanded={ordersDropdownOpen}
                    aria-haspopup="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrdersDropdownOpen(!ordersDropdownOpen);
                      setOpsDropdownOpen(false);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      bgcolor: ordersDropdownOpen || ['/flow', '/order-details', '/edit-case'].includes(location.pathname)
                        ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1))
                        : 'transparent',
                      color: ordersDropdownOpen || ['/flow', '/order-details', '/edit-case'].includes(location.pathname)
                        ? (isDark ? '#38bdf8' : '#0284c7')
                        : (isDark ? '#94a3b8' : '#475569'),
                      border: `1px solid ${ordersDropdownOpen || ['/flow', '/order-details', '/edit-case'].includes(location.pathname) ? alpha(isDark ? '#38bdf8' : '#0284c7', 0.3) : 'transparent'}`,
                      '&:hover': {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.8),
                      },
                    }}
                  >
                    <Layers size={13} />
                    <span>Orders & Cases</span>
                    <ChevronDown size={11} style={{ transform: ordersDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.6 }} />
                  </ButtonBase>

                  {ordersDropdownOpen && (
                    <div
                      data-testid="orders-dropdown-menu"
                      className={`absolute ${position === 'bottom' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-56 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 space-y-1`}
                    >
                      <NavLink
                        to="/flow"
                        onClick={() => setOrdersDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.25,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <Layers size={15} color="#0284c7" />
                          <Box>
                            <div>Workflow Queue</div>
                            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>Master production queue</Typography>
                          </Box>
                        </Box>
                      </NavLink>

                      <NavLink
                        to="/order-details?id=504901"
                        onClick={() => setOrdersDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.25,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <FileText size={15} color="#6366f1" />
                          <Box>
                            <div>Order Details</div>
                            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>Deep telemetry & files</Typography>
                          </Box>
                        </Box>
                      </NavLink>

                      <NavLink
                        to="/edit-case"
                        onClick={() => setOrdersDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.25,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <FileEdit size={15} color="#a855f7" />
                          <Box>
                            <div>Edit Case</div>
                            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>Revisions & remakes</Typography>
                          </Box>
                        </Box>
                      </NavLink>
                    </div>
                  )}
                </Box>

                {/* 3. Operations & Analytics Spread Dropdown */}
                <Box sx={{ position: 'relative' }} ref={opsDropdownRef}>
                  <ButtonBase
                    type="button"
                    aria-expanded={opsDropdownOpen}
                    aria-haspopup="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpsDropdownOpen(!opsDropdownOpen);
                      setOrdersDropdownOpen(false);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      bgcolor: opsDropdownOpen || ['/quarter-targets', '/task-47', '/task-31'].includes(location.pathname)
                        ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1))
                        : 'transparent',
                      color: opsDropdownOpen || ['/quarter-targets', '/task-47', '/task-31'].includes(location.pathname)
                        ? (isDark ? '#38bdf8' : '#0284c7')
                        : (isDark ? '#94a3b8' : '#475569'),
                      border: `1px solid ${opsDropdownOpen || ['/quarter-targets', '/task-47', '/task-31'].includes(location.pathname) ? alpha(isDark ? '#38bdf8' : '#0284c7', 0.3) : 'transparent'}`,
                      '&:hover': {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.8),
                      },
                    }}
                  >
                    <Boxes size={13} />
                    <span>Operations & Reports</span>
                    <ChevronDown size={11} style={{ transform: opsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.6 }} />
                  </ButtonBase>

                  {opsDropdownOpen && (
                    <div
                      data-testid="ops-dropdown-menu"
                      className={`absolute ${position === 'bottom' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-64 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 space-y-1`}
                    >
                      <NavLink
                        to="/quarter-targets"
                        onClick={() => setOpsDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.25,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <TrendingUp size={15} color="#0284c7" />
                          <Box>
                            <div>Quarter Targets & Power BI</div>
                            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>DAX analytics & targets</Typography>
                          </Box>
                        </Box>
                      </NavLink>

                      <NavLink
                        to="/task-47"
                        onClick={() => setOpsDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.25,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <Boxes size={15} color="#059669" />
                          <Box>
                            <div>Task 47: Models Report</div>
                            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>3D Model logs & units</Typography>
                          </Box>
                        </Box>
                      </NavLink>

                      <NavLink
                        to="/task-31"
                        onClick={() => setOpsDropdownOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.25,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            '&:hover': {
                              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.06),
                            },
                          }}
                        >
                          <Users2 size={15} color="#d97706" />
                          <Box>
                            <div>Task 31: Staff Targets</div>
                            <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>Technician volume tiers</Typography>
                          </Box>
                        </Box>
                      </NavLink>
                    </div>
                  )}
                </Box>
              </Box>

              {/* Right: Primary Call to Action Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <NavLink
                  to="/add-case"
                  style={{ textDecoration: 'none' }}
                >
                  <ButtonBase
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: '#00706a',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      boxShadow: '0 1px 3px rgba(0, 112, 106, 0.3)',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: '#008b84',
                        boxShadow: '0 2px 6px rgba(0, 112, 106, 0.4)',
                      },
                    }}
                  >
                    <FilePlus2 size={14} />
                    <span>+ Add Case</span>
                  </ButtonBase>
                </NavLink>
              </Box>
            </div>
          </Box>
        </Box>

        {/* DOM Flow Spacer when docked at top (56px Tier 1 + 44px Tier 2 = 100px) */}
        {position === 'top' && (
          <div className="h-[100px] w-full shrink-0 select-none pointer-events-none" aria-hidden="true" />
        )}

        {/* Interactive Profile Credentials Modal */}
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

        {/* Enterprise Global Search Spotlight Modal */}
        <GlobalSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      </>
    );
  }

  // =========================================================================
  // RENDER: VERTICAL SIDEBAR (LEFT OR RIGHT)
  // =========================================================================
  return (
    <>
      {/* Sibling Layout Spacer to preserve document layout width */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: collapsed ? 80 : 256,
          flexShrink: 0,
          order: position === 'right' ? 999 : 'unset',
          transition: 'width 0.2s ease',
        }}
        aria-hidden="true"
      />

      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          height: '100vh',
          width: collapsed ? 80 : 256,
          flexShrink: 0,
          bgcolor: isDark ? alpha('#0a1b32', 0.96) : alpha('#ffffff', 0.96),
          backdropFilter: 'blur(12px)',
          userSelect: 'none',
          transition: 'width 0.2s ease',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: position === 'left' ? 0 : 'auto',
          right: position === 'right' ? 0 : 'auto',
          zIndex: 40,
          borderRight: position === 'left' ? `1px solid ${tier1Border}` : 'none',
          borderLeft: position === 'right' ? `1px solid ${tier1Border}` : 'none',
          order: position === 'right' ? 999 : 'unset',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header & Logo */}
        <Box
          sx={{
            display: 'flex',
            height: 56,
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            borderBottom: `1px solid ${tier1Border}`,
            flexShrink: 0,
          }}
        >
          <Box
            component={NavLink}
            to="/dashboard"
            title="3DDX Dashboard"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              flex: 1,
              overflow: 'hidden',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}${collapsed ? 'logo-3ddx.png' : 'logo-3ddx-full.png'}`}
              alt="3DDX Brand Logo"
              style={{
                height: collapsed ? 28 : 22,
                width: 'auto',
                maxWidth: collapsed ? 36 : 140,
                objectFit: 'contain',
              }}
            />
          </Box>

          {/* Drag Handle to dock anywhere */}
          <Tooltip title={t('action.dragHandle', 'Click & drag to dock at any edge')} arrow>
            <IconButton
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onPointerDown={handlePointerDownDrag}
              size="small"
              aria-label="Drag navigation dock"
              sx={{
                p: 0.75,
                borderRadius: 2,
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
                color: 'text.secondary',
                '&:hover': {
                  color: '#0284c7',
                  bgcolor: isDark ? alpha('#38bdf8', 0.1) : alpha('#0284c7', 0.08),
                },
              }}
            >
              <GripHorizontal size={18} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Dock Switcher / Collapse Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 0.5 : 1.5,
            py: 1,
            borderBottom: `1px solid ${tier1Border}`,
            bgcolor: isDark ? alpha('#ffffff', 0.02) : alpha('#000000', 0.02),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Dock as Top Navbar" arrow>
              <ButtonBase
                onClick={() => onChangePosition('top')}
                type="button"
                aria-label="Dock as Top Navbar"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: isDark ? '#cbd5e1' : '#475569',
                  border: `1px solid ${tier1Border}`,
                  bgcolor: isDark ? alpha('#ffffff', 0.04) : '#ffffff',
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#0284c7',
                    borderColor: '#0284c7',
                  },
                }}
              >
                <PanelTopClose size={12} color="#0284c7" />
                {!collapsed && <span>Top</span>}
              </ButtonBase>
            </Tooltip>

            {!collapsed && (
              <>
                <Tooltip title="Dock as Bottom Taskbar" arrow>
                  <ButtonBase
                    onClick={() => onChangePosition('bottom')}
                    type="button"
                    aria-label="Dock as Bottom Taskbar"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: isDark ? '#cbd5e1' : '#475569',
                      border: `1px solid ${tier1Border}`,
                      bgcolor: isDark ? alpha('#ffffff', 0.04) : '#ffffff',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#ea580c',
                        borderColor: '#ea580c',
                      },
                    }}
                  >
                    <PanelBottomClose size={12} color="#ea580c" />
                    <span>Bottom</span>
                  </ButtonBase>
                </Tooltip>

                <Tooltip title={position === 'left' ? 'Move to Right' : 'Move to Left'} arrow>
                  <ButtonBase
                    onClick={() => onChangePosition(position === 'left' ? 'right' : 'left')}
                    type="button"
                    aria-label={position === 'left' ? 'Move to Right' : 'Move to Left'}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: isDark ? '#cbd5e1' : '#475569',
                      border: `1px solid ${tier1Border}`,
                      bgcolor: isDark ? alpha('#ffffff', 0.04) : '#ffffff',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#0284c7',
                        borderColor: '#0284c7',
                      },
                    }}
                  >
                    {position === 'left' ? <PanelRightClose size={12} /> : <PanelLeftClose size={12} />}
                    <span>{position === 'left' ? 'Right' : 'Left'}</span>
                  </ButtonBase>
                </Tooltip>
              </>
            )}
          </Box>

          <Tooltip title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} arrow>
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              sx={{
                p: 0.5,
                borderRadius: 1.5,
                color: 'text.secondary',
                '&:hover': {
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
              }}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Target Nav Links */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {targetNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/flow' && (location.pathname === '/orders' || location.pathname === '/flow'));
            return (
              <NavLink
                key={item.id}
                to={item.path}
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
                    p: collapsed ? 1.25 : 1.25,
                    px: collapsed ? 1.25 : 1.75,
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    bgcolor: isActive ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1)) : 'transparent',
                    color: isActive ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#cbd5e1' : '#475569'),
                    borderLeft: isActive ? `3px solid ${isDark ? '#38bdf8' : '#0284c7'}` : '3px solid transparent',
                    '&:hover': {
                      bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#0284c7', 0.05),
                      color: isDark ? '#f8fafc' : '#0f172a',
                    },
                  }}
                >
                  <item.icon size={18} color={isActive ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8'} />
                  {!collapsed && (
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 'inherit', color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </Typography>
                  )}
                </ButtonBase>
              </NavLink>
            );
          })}
        </Box>

        {/* Footer: Profile, Language & Theme */}
        <Box
          sx={{
            mt: 'auto',
            flexShrink: 0,
            p: 1.5,
            borderTop: `1px solid ${tier1Border}`,
            bgcolor: isDark ? alpha('#000000', 0.2) : alpha('#ffffff', 0.4),
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: collapsed ? 'center' : 'stretch',
          }}
        >
          <NavLink
            to="/profile"
            style={{ textDecoration: 'none', width: '100%' }}
          >
            <ButtonBase
              type="button"
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1.25,
                p: 0.75,
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid transparent',
                color: 'inherit',
                '&:hover': {
                  bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
                  borderColor: tier1Border,
                },
              }}
              title="Technician Profile"
              aria-label="Technician Profile"
            >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0284c7 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '0.625rem',
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {profile?.avatarInitials || '3D'}
            </Box>
            {!collapsed && (
              <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0, lineHeight: 1.1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Abdu Mohamed'}
                </Typography>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#ea580c' }}>
                  CP Specialist
                </Typography>
              </Box>
            )}
            </ButtonBase>
          </NavLink>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', flexDirection: collapsed ? 'column' : 'row', gap: 1 }}>
            <ButtonBase
              onClick={() => {
                const nextIndex = (LANGUAGES.findIndex((l) => l.code === language) + 1) % LANGUAGES.length;
                setLanguage(LANGUAGES[nextIndex].code);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                p: 0.75,
                borderRadius: 1.5,
                border: `1px solid ${tier1Border}`,
                cursor: 'pointer',
                bgcolor: isDark ? alpha('#ffffff', 0.04) : '#ffffff',
                fontSize: '0.6875rem',
                fontWeight: 900,
                '&:hover': {
                  borderColor: '#0284c7',
                },
              }}
              title={`Language: ${currentOption.nativeName}`}
            >
              <LanguageFlag code={currentOption.code} />
              {!collapsed && <span>{currentOption.code.toUpperCase()}</span>}
            </ButtonBase>

            <Tooltip title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} arrow>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  color: isDark ? '#fbbf24' : '#475569',
                  '&:hover': {
                    bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.04),
                  },
                }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Interactive Profile Credentials Modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Enterprise Global Search Spotlight Modal */}
      <GlobalSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
}

export default ConvertibleNav;
