import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
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
  Sliders,
  SlidersHorizontal,
  Home,
  User,
  LogOut,
  ExternalLink,
  Search,
  Sparkles,
  Move
} from 'lucide-react';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useLanguage, LANGUAGES } from '@/app/providers/contexts/LanguageContext';
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
  isDraggingNav,
  setIsDraggingNav,
}: ConvertibleNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeContext();
  const { language, setLanguage, currentOption, t } = useLanguage();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [ordersDropdownOpen, setOrdersDropdownOpen] = useState(false);
  const [opsDropdownOpen, setOpsDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);

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
    { id: 'orderDetails', label: t('nav.orderDetails', 'Order Details'), path: '/order-details', icon: FileText },
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

  if (!isVertical) {
    return (
      <>
        {/* Fixed Top 2-Tier Navigation Bar (100% Locked with Scroll) */}
        <div className={position === 'top' ? 'fixed top-0 left-0 right-0 z-50 w-full shadow-sm' : ''}>
        {/* ================================================================= */}
        {/* TIER 1: FIXED TOP GLOBAL UTILITY BAR (STATIONARY ACROSS ALL PAGES) */}
        {/* Brand, Drag Handle, Centered Search, Language, Theme, Profile      */}
        {/* ================================================================= */}
        <header
          className={`w-full bg-sky-100/90 dark:bg-[#0a1b32]/92 backdrop-blur-md border-b border-sky-300/60 dark:border-sky-800/60 shadow-xs select-none z-50 ${
            position === 'top' ? 'relative' : 'fixed bottom-0 left-0 right-0 border-t shadow-2xl'
          }`}
        >
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            
            {/* Left: Drag Handle, Quick Dock Menu & Brand Logo */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Hand Drag Handle: Drag & Drop anywhere */}
              <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onPointerDown={handlePointerDownDrag}
                title="Click & Drag with mouse to dock navigation anywhere (Top, Left, Right, Bottom)"
                className="flex items-center justify-center p-1.5 rounded-xl text-slate-500 hover:text-[#0284c7] dark:hover:text-sky-400 hover:bg-white/80 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors group border border-transparent hover:border-sky-300/60 dark:hover:border-sky-700/60 shadow-2xs"
              >
                <GripVertical size={18} className="group-hover:scale-110 transition-transform text-[#0284c7] dark:text-sky-400" />
              </div>

              {/* Quick Dock Position Selector Dropdown Menu */}
              <div className="relative" ref={posRef}>
                <button
                  type="button"
                  onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-sky-300/60 dark:border-sky-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs group"
                  title="Choose navigation dock position directly from menu"
                >
                  <Move size={13} className="text-[#0284c7] dark:text-sky-400 group-hover:rotate-45 transition-transform" />
                  <span className="hidden sm:inline capitalize text-[11px] font-extrabold">{position}</span>
                  <ChevronDown size={11} className={`text-slate-400 transition-transform duration-200 ${posDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {posDropdownOpen && (
                  <div className={`absolute left-0 ${position === 'bottom' ? 'bottom-full mb-2' : 'top-full mt-2'} w-52 rounded-2xl bg-white dark:bg-[#0c1222] border border-sky-200/80 dark:border-sky-800/80 shadow-2xl p-1.5 z-50 animate-slide-up space-y-1`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                      Dock Navbar Position
                    </div>

                    {[
                      { pos: 'top' as const, label: 'Top Navbar (Fixed)', icon: PanelTopClose },
                      { pos: 'bottom' as const, label: 'Bottom Taskbar', icon: PanelBottomClose },
                      { pos: 'left' as const, label: 'Left Sidebar', icon: PanelLeftClose },
                      { pos: 'right' as const, label: 'Right Sidebar', icon: PanelRightClose },
                    ].map((item) => (
                      <button
                        key={item.pos}
                        type="button"
                        onClick={() => {
                          onChangePosition(item.pos);
                          setPosDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          position === item.pos
                            ? 'bg-[#0284c7]/15 text-[#0284c7] dark:text-sky-300 border border-sky-300/50 dark:border-sky-700/50'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon size={14} className={position === item.pos ? 'text-[#0284c7]' : 'text-slate-400'} />
                          <span>{item.label}</span>
                        </div>
                        {position === item.pos && <Check size={13} className="text-[#0284c7]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Logo (Links to Home - No redundant Home button) */}
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2 group"
                title="3D Diagnostix Cloud ERP - Home"
              >
                <div className="h-8 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center shadow-xs group-hover:border-[#0284c7] transition-colors">
                  <img
                    src="/logo-3ddx-full.png"
                    alt="3D Diagnostix"
                    className="h-5 w-auto object-contain"
                  />
                </div>
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    CP PRO MAX
                  </span>
                  <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400">
                    Clinical Platform
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Center: Clean Minimalist Global Search Bar (Spotlight Powered) */}
            <div className="flex-1 max-w-md mx-2 sm:mx-6 hidden md:block">
              <div
                onClick={() => setIsSearchModalOpen(true)}
                className="relative group cursor-pointer"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-[#0284c7] transition-colors pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search orders, cases, patients, doctors... (⌘K)"
                  className="w-full h-8.5 pl-9 pr-12 text-xs font-medium rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-300/60 dark:border-sky-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400/80 cursor-pointer hover:border-[#0284c7] dark:hover:border-sky-400 transition-all shadow-xs"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right: Language, Theme, & User Profile Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="md:hidden p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Deep Global Search"
              >
                <Search size={15} />
              </button>
              
              {/* Language Switcher */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Change System Language"
                >
                  <span className="text-sm">{currentOption.flag}</span>
                  <span className="font-extrabold text-[11px] uppercase">{currentOption.code}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-slide-up">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Select Language
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          language === lang.code
                            ? 'bg-[#0284c7]/15 text-[#0284c7] dark:text-sky-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </div>
                        {language === lang.code && <Check size={13} className="text-[#0284c7]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                type="button"
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0284c7] transition-colors cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun size={17} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                ) : (
                  <Moon size={17} className="text-slate-700" />
                )}
              </button>

              {/* User Profile Dropdown Menu (Houses Admin CMS link for authorized users) */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#0284c7] dark:hover:border-sky-500 bg-slate-50/80 dark:bg-slate-900/80 transition-all cursor-pointer group"
                  title="Operator Profile & Account Menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#ea580c] text-xs font-black text-white shadow-xs group-hover:scale-105 transition-transform">
                    {profile?.avatarInitials || '3D'}
                  </div>
                  <div className="flex flex-col text-left leading-tight hidden xl:flex">
                    <span className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[100px]">
                      {profile?.firstName || 'Abdu M.'}
                    </span>
                    <span className="text-[9px] font-bold text-[#ea580c]">
                      Lead Specialist
                    </span>
                  </div>
                  <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-slide-up space-y-1">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Abdu Mohamed'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        a.aladawy@3ddx.com • ID: 3DDX-9942
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <User size={15} className="text-sky-500" />
                      <span>Operator Profile & Credentials</span>
                    </button>

                    <NavLink
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Shield size={15} className="text-emerald-500" />
                      <span>Security & Preferences</span>
                    </NavLink>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1" />

                    <NavLink
                      to="/login"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* TIER 2: SECONDARY WORKSPACE SUB-NAVBAR                            */}
        {/* Lighter Ice-Blue Glassmorphic Tint, Fixed Dropdowns, Zero CMS Link */}
        {/* ================================================================= */}
        <nav
          className={`w-full bg-sky-50/75 dark:bg-[#071526]/80 backdrop-blur-md border-b border-sky-200/50 dark:border-sky-900/50 shadow-xs select-none z-40 ${
            position === 'top' ? 'relative' : 'fixed bottom-14 left-0 right-0 border-t shadow-xl'
          }`}
        >
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-4">
            
            {/* Categorized Spread Menus */}
            <div className="flex items-center gap-1 sm:gap-2 relative">
              
              {/* 1. Dashboard */}
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <LayoutDashboard size={13} />
                <span>Dashboard</span>
              </NavLink>

              {/* 2. Orders & Cases Spread Dropdown */}
              <div className="relative" ref={ordersDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrdersDropdownOpen(!ordersDropdownOpen);
                    setOpsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ordersDropdownOpen || ['/flow', '/order-details', '/edit-case'].includes(location.pathname)
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Layers size={13} />
                  <span>Orders & Cases</span>
                  <ChevronDown size={11} className={`transition-transform duration-200 ${ordersDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {ordersDropdownOpen && (
                  <div className={`absolute ${position === 'bottom' ? 'bottom-10' : 'top-10'} left-0 w-56 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-slide-up space-y-1`}>
                    <NavLink
                      to="/flow"
                      onClick={() => setOrdersDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Layers size={14} className="text-sky-500" />
                      <div>
                        <div>Workflow Queue</div>
                        <div className="text-[10px] text-slate-400 font-normal">Master production queue</div>
                      </div>
                    </NavLink>

                    <NavLink
                      to="/order-details"
                      onClick={() => setOrdersDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FileText size={14} className="text-indigo-500" />
                      <div>
                        <div>Order Details</div>
                        <div className="text-[10px] text-slate-400 font-normal">Deep telemetry & files</div>
                      </div>
                    </NavLink>

                    <NavLink
                      to="/edit-case"
                      onClick={() => setOrdersDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FileEdit size={14} className="text-purple-500" />
                      <div>
                        <div>Edit Case</div>
                        <div className="text-[10px] text-slate-400 font-normal">Revisions & remakes</div>
                      </div>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* 3. Operations & Analytics Spread Dropdown */}
              <div className="relative" ref={opsDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpsDropdownOpen(!opsDropdownOpen);
                    setOrdersDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    opsDropdownOpen || ['/quarter-targets', '/task-47', '/task-31'].includes(location.pathname)
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Boxes size={13} />
                  <span>Operations & Reports</span>
                  <ChevronDown size={11} className={`transition-transform duration-200 ${opsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {opsDropdownOpen && (
                  <div className={`absolute ${position === 'bottom' ? 'bottom-10' : 'top-10'} left-0 w-64 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-slide-up space-y-1`}>
                    <NavLink
                      to="/quarter-targets"
                      onClick={() => setOpsDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <TrendingUp size={14} className="text-sky-500" />
                      <div>
                        <div>Quarter Targets & Power BI</div>
                        <div className="text-[10px] text-slate-400 font-normal">DAX analytics & targets</div>
                      </div>
                    </NavLink>

                    <NavLink
                      to="/task-47"
                      onClick={() => setOpsDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Boxes size={14} className="text-emerald-500" />
                      <div>
                        <div>Task 47: Models Report</div>
                        <div className="text-[10px] text-slate-400 font-normal">3D Model logs & units</div>
                      </div>
                    </NavLink>

                    <NavLink
                      to="/task-31"
                      onClick={() => setOpsDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Users2 size={14} className="text-amber-500" />
                      <div>
                        <div>Task 31: Staff Targets</div>
                        <div className="text-[10px] text-slate-400 font-normal">Technician volume tiers</div>
                      </div>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Primary Call to Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              <NavLink
                to="/add-case"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all"
              >
                <FilePlus2 size={13} />
                <span>+ Add Case</span>
              </NavLink>
            </div>
          </div>
        </nav>
      </div>

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
      <aside
        className={`hidden lg:flex flex-col h-screen shrink-0 bg-sky-100/90 dark:bg-[#0a1b32]/92 backdrop-blur-md select-none transition-all duration-200 relative z-40 ${
          position === 'left' ? 'border-r' : 'border-l order-last'
        } border-sky-300/60 dark:border-sky-800/60 shadow-xs ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header & Logo */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src="/logo-3ddx-full.png"
                alt="3DDX"
                className="h-5 w-auto object-contain"
              />
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                CP PRO MAX
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-xs font-black tracking-tight text-[#0284c7]">3DDX</span>
            </div>
          )}

          {/* Drag Handle to dock anywhere */}
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDownDrag}
            title={t('action.dragHandle', 'Click & drag with hand/mouse to dock at any edge')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0284c7] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripHorizontal size={18} />
          </div>
        </div>

        {/* Dock Switcher / Collapse Bar */}
        <div className={`flex items-center ${collapsed ? 'justify-center py-2' : 'justify-between px-3 py-1.5'} border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50`}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangePosition('top')}
              type="button"
              title="Dock as Top Navbar"
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#0284c7] hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <PanelTopClose size={12} className="text-[#0284c7]" />
              {!collapsed && <span>Top</span>}
            </button>

            {!collapsed && (
              <>
                <button
                  onClick={() => onChangePosition('bottom')}
                  type="button"
                  title="Dock as Bottom Taskbar"
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#ea580c] hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  <PanelBottomClose size={12} className="text-[#ea580c]" />
                  <span>Bottom</span>
                </button>

                <button
                  onClick={() => onChangePosition(position === 'left' ? 'right' : 'left')}
                  type="button"
                  title={position === 'left' ? 'Move to Right' : 'Move to Left'}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  {position === 'left' ? <PanelRightClose size={12} /> : <PanelLeftClose size={12} />}
                  <span>{position === 'left' ? 'Right' : 'Left'}</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            type="button"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Target Nav Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {targetNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/flow' && (location.pathname === '/orders' || location.pathname === '/flow'));
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0284c7]/20 to-[#ea580c]/10 text-[#0284c7] dark:text-sky-300 border-l-2 border-[#0284c7] shadow-xs'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-[#0284c7] dark:text-sky-400 drop-shadow-[0_0_6px_rgba(2,132,199,0.5)]' : 'text-slate-400 group-hover:text-[#0284c7]'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer: Profile, Language & Theme - strictly aligned to the bottom at all times */}
        <div className={`mt-auto shrink-0 p-2 border-t border-sky-200/60 dark:border-sky-800/60 bg-sky-50/70 dark:bg-slate-950/70 ${collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`w-full flex items-center ${collapsed ? 'justify-center p-1.5' : 'gap-2 px-2 py-1.5'} rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer`}
            title="Technician Profile"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#ea580c] text-[10px] font-black text-white shrink-0">
              {profile?.avatarInitials || '3D'}
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Abdu Mohamed'}
                </span>
                <span className="text-[9px] text-[#ea580c] font-bold">CP Specialist</span>
              </div>
            )}
          </button>

          <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'justify-between px-1'}`}>
            <button
              onClick={() => {
                const nextIndex = (LANGUAGES.findIndex((l) => l.code === language) + 1) % LANGUAGES.length;
                setLanguage(LANGUAGES[nextIndex].code);
              }}
              className="flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-black cursor-pointer"
              title={`Language: ${currentOption.nativeName}`}
            >
              <span>{currentOption.flag}</span>
              {!collapsed && <span>{currentOption.code.toUpperCase()}</span>}
            </button>

            <button
              onClick={toggleTheme}
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-[#0284c7] cursor-pointer"
              title="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Interactive Profile Credentials Modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Enterprise Global Search Spotlight Modal */}
      <GlobalSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
}

export default ConvertibleNav;
