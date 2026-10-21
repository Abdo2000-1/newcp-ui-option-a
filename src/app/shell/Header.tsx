import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  Plus, 
  LogOut, 
  Settings, 
  Check, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { Button } from '@/shared/components/Button';
import { timeAgo } from '@/shared/utils/format';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeContext();

  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = useStore(s => s.getNotifications());
  const orders = useStore(s => s.getOrders());
  const patients = useStore(s => s.getPatients());
  const profile = useStore(s => s.getProfile());

  const unreadNotifs = notifications.filter(n => !n.read);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(event.target as Node)) {
        setNotifsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter for global search popup
  const searchResults = searchQuery.trim() === '' ? [] : [
    ...orders
      .filter(o => o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || o.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 4)
      .map(o => ({ type: 'order', id: o.id, title: `${o.orderNumber} - ${o.patientName}`, subtitle: `${o.restoration} • ${o.status}`, url: `/orders/${o.id}` })),
    ...patients
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map(p => ({ type: 'patient', id: p.id, title: p.name, subtitle: `${p.clinicName} • ${p.doctorName}`, url: `/patients/${p.id}` })),
  ];

  // Breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentTitle = pathSegments.length > 0 
    ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1).replace(/-/g, ' ') 
    : 'Dashboard';

  const handleLogout = () => {
    localStorage.removeItem('dentalab-auth');
    localStorage.removeItem('dentalab-auth-token');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 sm:px-6">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {currentTitle}
          </span>
          {pathSegments.length > 1 && (
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              / #{pathSegments[1]}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Interactive Global Search */}
      <div className="relative hidden md:block max-w-sm w-full mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Quick search orders, patients (Ctrl+K)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-xs"
          />
        </div>

        {/* Live Search Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-10 left-0 right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fade-in backdrop-blur-md">
            <div className="text-[11px] font-semibold text-slate-400 uppercase px-2 py-1 flex items-center justify-between">
              <span>Quick Results</span>
              <span className="text-[10px] text-cyan-500 font-mono">React Search</span>
            </div>
            {searchResults.map((res) => (
              <button
                key={res.id}
                onMouseDown={() => {
                  navigate(res.url);
                  setSearchQuery('');
                  setSearchFocused(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{res.title}</div>
                  <div className="text-[11px] text-slate-400">{res.subtitle}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Quick Action Buttons & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cohesive, Modern Header Action Button */}
        <button 
          onClick={() => navigate('/orders/create')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xs shadow-cyan-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Order</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={19} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> : <Moon size={19} />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => setNotifsOpen(!notifsOpen)}
            className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell size={19} />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 sm:max-w-none rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 py-3 z-50 animate-slide-up">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-bold text-sm text-gray-900 dark:text-white">Recent Alerts</span>
                {unreadNotifs.length > 0 && (
                  <button 
                    onClick={() => store.markAllNotificationsAsRead()} 
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                {notifications.slice(0, 5).map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      store.markNotificationAsRead(n.id);
                      if (n.relatedId) navigate(`/orders/${n.relatedId}`);
                      setNotifsOpen(false);
                    }}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 px-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <button 
                  onClick={() => { navigate('/notifications'); setNotifsOpen(false); }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="User Profile Menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-xs font-bold text-white shadow-sm ring-2 ring-cyan-100 dark:ring-cyan-900/50">
              {profile.avatarInitials || `${profile.firstName?.[0] || 'J'}${profile.lastName?.[0] || 'R'}`}
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:inline" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-slide-up text-xs">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{profile.firstName} {profile.lastName}</p>
                <p className="text-gray-400 text-[11px]">{profile.role} • Pro</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-left"
                >
                  <Settings size={15} />
                  <span>Lab & App Settings</span>
                </button>
                <button
                  onClick={() => { toggleTheme(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-left"
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  <span>Switch Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
                </button>
              </div>
              <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-left font-semibold"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
