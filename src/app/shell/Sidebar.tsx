import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronRight,
  X,
  Sparkles
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
  const unreadNotifs = useStore(s => s.getNotifications().filter(n => !n.read).length);
  const profile = useStore(s => s.getProfile());

  const renderNavLinks = () => (
    <nav className="flex flex-col gap-1 px-3 py-3" aria-label="Main Navigation">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const badgeCount = item.path === '/notifications' ? unreadNotifs : item.badge;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              onMobileClose();
            }}
            className={`group relative flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} rounded-xl py-2.5 text-sm font-medium transition-all duration-200 select-none ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/10 dark:from-cyan-400/20 dark:to-blue-600/10 text-cyan-700 dark:text-cyan-300 font-semibold border-l-2 border-cyan-500 shadow-xs shadow-cyan-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon 
              className={`w-5 h-5 shrink-0 transition-colors ${
                isActive ? 'text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(0,216,254,0.5)]' : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
              }`} 
            />

            {!collapsed && (
              <span className="truncate flex-1 text-left">{item.label}</span>
            )}

            {!collapsed && Boolean(badgeCount) && (
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                isActive 
                  ? 'bg-cyan-500 text-slate-950 font-black' 
                  : 'bg-rose-500 text-white'
              }`}>
                {badgeCount}
              </span>
            )}

            {collapsed && Boolean(badgeCount) && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00d8fe]" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-[#070b14] border-r border-slate-200/80 dark:border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className={`flex h-16 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-slate-100 dark:border-slate-800/80 shrink-0 relative`}>
        {collapsed ? (
          /* Collapsed View: Perfectly centered React logo with click to expand */
          <button
            onClick={onToggle}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95"
            title="Expand sidebar"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#087ea4] via-[#00d8fe] to-[#6366f1] p-0.5 shadow-md shadow-cyan-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '18s' }}>
                  <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(0 50 50)" opacity="0.8" />
                  <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(60 50 50)" opacity="0.8" />
                  <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(120 50 50)" opacity="0.8" />
                  <circle cx="50" cy="50" r="5" fill="#00d8fe" className="drop-shadow-[0_0_6px_#00d8fe]" />
                </svg>
              </div>
            </div>
            {/* Mini expand arrow badge */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-sm border border-slate-950">
              <ChevronRight size={11} strokeWidth={3} />
            </span>
          </button>
        ) : (
          /* Expanded View: Full Brand + Collapse Toggle */
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#087ea4] via-[#00d8fe] to-[#6366f1] p-0.5 shadow-md shadow-cyan-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '18s' }}>
                    <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(0 50 50)" opacity="0.8" />
                    <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(60 50 50)" opacity="0.8" />
                    <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(120 50 50)" opacity="0.8" />
                    <circle cx="50" cy="50" r="5" fill="#00d8fe" className="drop-shadow-[0_0_6px_#00d8fe]" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                    DentaLab
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 whitespace-nowrap shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    v2.4
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  CAD/CAM Cloud Studio
                </span>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggle}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {renderNavLinks()}
      </div>

      {/* User Footer Profile */}
      <div className={`border-t border-slate-100 dark:border-slate-800/80 p-3 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-xs font-bold text-white shadow-sm ring-2 ring-cyan-400/40">
            {profile.avatarInitials || `${profile.firstName?.[0] || 'J'}${profile.lastName?.[0] || 'R'}`}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {profile.firstName} {profile.lastName}
              </span>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400 truncate font-mono">
                {profile.role} • Online
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside 
        className={`hidden lg:block h-screen shrink-0 relative transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile / Tablet Drawer & Backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          {/* Slide-out drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
