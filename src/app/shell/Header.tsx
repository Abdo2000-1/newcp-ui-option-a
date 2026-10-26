import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import { 
  Menu,
  Zap, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  LogOut, 
  Settings, 
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { timeAgo } from '@/shared/utils/format';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { theme, toggleTheme } = useThemeContext();

  const isDark = muiTheme.palette.mode === 'dark';

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

  const headerBorder = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        height: 64,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${headerBorder}`,
        bgcolor: isDark ? alpha('#0f172a', 0.95) : alpha('#ffffff', 0.95),
        backdropFilter: 'blur(8px)',
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Left: Mobile Hamburger & Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          size="small"
          sx={{
            display: { lg: 'none' },
            p: 1,
            borderRadius: 2,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.04),
              color: 'text.primary',
            },
          }}
        >
          <Menu size={20} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: 800, color: 'text.primary' }}>
            {currentTitle}
          </Typography>
          {pathSegments.length > 1 && (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace', display: { xs: 'none', sm: 'inline' } }}>
              / #{pathSegments[1]}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Middle: Interactive Global Search */}
      <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' }, maxWidth: 360, width: '100%', mx: 2 }}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 3,
            border: `1px solid ${headerBorder}`,
            bgcolor: isDark ? alpha('#1e293b', 0.6) : alpha('#f8fafc', 0.9),
            px: 1.5,
            py: 0.5,
            transition: 'all 0.15s ease',
            '&:focus-within': {
              borderColor: '#0284c7',
              boxShadow: `0 0 0 2px ${alpha('#0284c7', 0.2)}`,
            },
          }}
        >
          <Search size={16} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Quick search orders, patients (Ctrl+K)..."
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.75rem',
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
          />
        </Box>

        {/* Live Search Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <Paper
            elevation={12}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              borderRadius: 3,
              border: `1px solid ${headerBorder}`,
              p: 1,
              zIndex: 50,
            }}
          >
            <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                Quick Results
              </Typography>
              <Typography sx={{ fontSize: '0.625rem', color: '#0284c7', fontFamily: 'monospace' }}>
                React Search
              </Typography>
            </Box>
            {searchResults.map((res) => (
              <Box
                key={res.id}
                component="button"
                onMouseDown={() => {
                  navigate(res.url);
                  setSearchQuery('');
                  setSearchFocused(false);
                }}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  borderRadius: 2,
                  border: 'none',
                  bgcolor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha('#0284c7', 0.08),
                  },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                    {res.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    {res.subtitle}
                  </Typography>
                </Box>
                <ExternalLink size={14} color="#94a3b8" />
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      {/* Right: Quick Action Buttons & Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
        {/* Cohesive, Modern Header Action Button */}
        <Button
          onClick={() => navigate('/add-case')}
          variant="contained"
          size="small"
          startIcon={<Plus size={14} />}
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#00706a',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.75rem',
            px: 2,
            py: 0.75,
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#008b84',
              boxShadow: 'none',
            },
          }}
        >
          New Order
        </Button>

        {/* Theme Toggle */}
        <Tooltip title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} arrow>
          <IconButton
            onClick={toggleTheme}
            size="small"
            aria-label="Toggle Theme"
            sx={{
              p: 1,
              borderRadius: 2,
              color: isDark ? '#fbbf24' : '#64748b',
              '&:hover': {
                bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.04),
              },
            }}
          >
            {theme === 'dark' ? (
              <Sun size={19} className="lucide-sun" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
            ) : (
              <Moon size={19} className="lucide-moon" />
            )}
          </IconButton>
        </Tooltip>

        {/* Notifications Popover */}
        <Box sx={{ position: 'relative' }} ref={notifsRef}>
          <Tooltip title="Notifications" arrow>
            <IconButton
              onClick={() => setNotifsOpen(!notifsOpen)}
              size="small"
              aria-label="Open notifications"
              sx={{
                p: 1,
                borderRadius: 2,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.04),
                  color: 'text.primary',
                },
              }}
            >
              <Badge badgeContent={unreadNotifs.length > 9 ? '9+' : unreadNotifs.length} color="error">
                <Bell size={19} />
              </Badge>
            </IconButton>
          </Tooltip>

          {notifsOpen && (
            <Paper
              elevation={12}
              sx={{
                position: 'absolute',
                right: 0,
                mt: 1,
                width: { xs: 'calc(100vw - 2rem)', sm: 360 },
                maxWidth: 380,
                borderRadius: 3,
                border: `1px solid ${headerBorder}`,
                p: 2,
                zIndex: 50,
                bgcolor: isDark ? '#1e293b' : '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: `1px solid ${headerBorder}` }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.875rem' }}>Recent Alerts</Typography>
                {unreadNotifs.length > 0 && (
                  <Button
                    onClick={() => store.markAllNotificationsAsRead()}
                    size="small"
                    sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: '#0284c7' }}
                  >
                    Mark all read
                  </Button>
                )}
              </Box>

              <Box sx={{ maxHeight: 280, overflowY: 'auto', my: 1 }}>
                {notifications.slice(0, 5).map((n) => (
                  <Box
                    key={n.id}
                    onClick={() => {
                      store.markNotificationAsRead(n.id);
                      if (n.relatedId) navigate(`/orders/${n.relatedId}`);
                      setNotifsOpen(false);
                    }}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: !n.read ? (isDark ? alpha('#0284c7', 0.1) : alpha('#0284c7', 0.06)) : 'transparent',
                      '&:hover': {
                        bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: !n.read ? 800 : 600 }}>
                        {n.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>
                        {timeAgo(n.createdAt)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.25 }}>
                      {n.message}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 1 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  onClick={() => { navigate('/notifications'); setNotifsOpen(false); }}
                  size="small"
                  sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}
                >
                  View All Notifications →
                </Button>
              </Box>
            </Paper>
          )}
        </Box>

        {/* User Profile Dropdown */}
        <Box sx={{ position: 'relative' }} ref={profileRef}>
          <IconButton
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User Profile Menu"
            size="small"
            sx={{
              p: 0.5,
              borderRadius: 2,
              '&:hover': {
                bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.04),
              },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #00706a 0%, #0284c7 100%)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {profile.avatarInitials || `${profile.firstName?.[0] || 'J'}${profile.lastName?.[0] || 'R'}`}
            </Box>
            <ChevronDown size={14} style={{ marginLeft: 4, opacity: 0.6 }} />
          </IconButton>

          {profileOpen && (
            <Paper
              elevation={12}
              sx={{
                position: 'absolute',
                right: 0,
                mt: 1,
                width: 220,
                borderRadius: 3,
                border: `1px solid ${headerBorder}`,
                p: 1,
                zIndex: 50,
                bgcolor: isDark ? '#1e293b' : '#ffffff',
              }}
            >
              <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${headerBorder}` }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.8125rem' }}>
                  {profile.firstName} {profile.lastName}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                  {profile.role} • Pro
                </Typography>
              </Box>
              <Box sx={{ py: 0.5 }}>
                <Button
                  fullWidth
                  onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                  startIcon={<User size={15} />}
                  sx={{ justifyContent: 'flex-start', fontSize: '0.75rem', color: 'text.primary', py: 0.75 }}
                >
                  Operator Profile
                </Button>
                <Button
                  fullWidth
                  onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                  startIcon={<Settings size={15} />}
                  sx={{ justifyContent: 'flex-start', fontSize: '0.75rem', color: 'text.primary', py: 0.75 }}
                >
                  Lab & App Settings
                </Button>
                <Button
                  fullWidth
                  onClick={() => { toggleTheme(); setProfileOpen(false); }}
                  startIcon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  sx={{ justifyContent: 'flex-start', fontSize: '0.75rem', color: 'text.primary', py: 0.75 }}
                >
                  Switch Theme ({theme === 'dark' ? 'Light' : 'Dark'})
                </Button>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Button
                fullWidth
                onClick={handleLogout}
                startIcon={<LogOut size={15} />}
                sx={{ justifyContent: 'flex-start', fontSize: '0.75rem', color: '#e11d48', py: 0.75, fontWeight: 700 }}
              >
                Log Out
              </Button>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Header;
