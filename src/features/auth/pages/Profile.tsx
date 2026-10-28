import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  User,
  Shield,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  FileBadge,
  Sparkles,
  LogOut,
  Sliders,
  Database,
  Monitor,
  Save,
  Sun,
  Moon,
  PanelTopClose,
  PanelBottomClose,
  PanelLeftClose,
  PanelRightClose,
  Check,
  Key,
  BadgeCheck
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useLanguage, LANGUAGES, LanguageFlag } from '@/app/providers/contexts/LanguageContext';
import { sound } from '@/shared/utils/sound';
import { useAuth } from '@/features/auth/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { session, logout, isAuthenticated } = useAuth();
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const { theme, toggleTheme } = useThemeContext();
  const { language, setLanguage, t } = useLanguage();

  const rawProfile = useStore((s) => s.getProfile());

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'pacs' | 'security'>('profile');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Form State initialized from reactive store
  const [firstName, setFirstName] = useState(rawProfile?.firstName || 'Jessica');
  const [lastName, setLastName] = useState(rawProfile?.lastName || 'Ruiz');
  const [email, setEmail] = useState(rawProfile?.email || 'j.ruiz@dentalab-cad.com');
  const [phone, setPhone] = useState(rawProfile?.phone || '+1 (555) 749-3821');
  const [role, setRole] = useState(rawProfile?.role || 'Lab Director');
  const [specialty, setSpecialty] = useState(rawProfile?.specialty || 'Orthodontics & 3D CAD/CAM');
  const [license, setLicense] = useState(rawProfile?.licenseNumber || 'CAD-DL-89421');
  const [bio, setBio] = useState(rawProfile?.bio || 'Specialist in digital dental prosthetics and 3D intraoral scan segmentation.');
  const [avatarInitials, setAvatarInitials] = useState(rawProfile?.avatarInitials || 'JR');

  // Workstation personalization settings
  const [dockPos, setDockPos] = useState<string>(() => localStorage.getItem('3ddx-cp-nav-position') || 'top');

  // Sync state if store updates from other parts of the app
  useEffect(() => {
    if (rawProfile) {
      setFirstName(rawProfile.firstName || 'Jessica');
      setLastName(rawProfile.lastName || 'Ruiz');
      setEmail(rawProfile.email || 'j.ruiz@dentalab-cad.com');
      setPhone(rawProfile.phone || '+1 (555) 749-3821');
      setRole(rawProfile.role || 'Lab Director');
      setSpecialty(rawProfile.specialty || 'Orthodontics & 3D CAD/CAM');
      setLicense(rawProfile.licenseNumber || 'CAD-DL-89421');
      setBio(rawProfile.bio || 'Specialist in digital dental prosthetics and 3D intraoral scan segmentation.');
      setAvatarInitials(rawProfile.avatarInitials || 'JR');
    }
  }, [rawProfile]);

  const showToast = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
    sound.playPop?.();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update reactive store (MOCK session storage)
    const updatedInitials = avatarInitials.trim() || `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    store.updateProfile({
      firstName,
      lastName,
      email,
      phone,
      role,
      specialty,
      licenseNumber: license,
      bio,
      avatarInitials: updatedInitials,
    });

    // 2. Persist nav position
    localStorage.setItem('3ddx-cp-nav-position', dockPos);
    window.dispatchEvent(new Event('storage'));

    showToast(t('profile.saveSuccess', 'Profile and preferences updated successfully!'));
  };

  const borderColor = isDark ? alpha('#38bdf8', 0.16) : alpha('#0284c7', 0.14);
  const cardBg = isDark ? '#0a1b32' : '#ffffff';

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', pb: 8, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Toast Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontWeight: 700, borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Header Banner & Overlapping Profile Card */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          bgcolor: cardBg,
        }}
      >
        {/* Brand Gradient Banner */}
        <Box
          sx={{
            height: 140,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #ea580c 100%)',
            p: 3,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="CP PRO MAX • Dedicated Specialist Profile"
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.6875rem',
                letterSpacing: '0.04em',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            />
          </Box>
          <Typography
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.6875rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            PACS Telemetry Node #1016 • Verified
          </Typography>
        </Box>

        {/* Profile Card Header Info */}
        <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 3, pt: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
              justifyContent: 'space-between',
              mt: -6,
              mb: 3,
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 3.5,
                    p: 0.5,
                    background: 'linear-gradient(135deg, #0284c7 0%, #ea580c 100%)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    border: `4px solid ${cardBg}`,
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 3,
                      bgcolor: isDark ? '#0c1222' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      color: '#0284c7',
                    }}
                  >
                    {avatarInitials || '3D'}
                  </Box>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: '#059669',
                    border: `2px solid ${cardBg}`,
                  }}
                  title="Operator Online"
                />
              </Box>

              <Box sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
                    {firstName} {lastName}
                  </Typography>
                  <Tooltip title="CP PRO MAX Verified Operator" arrow>
                    <Box component="span" sx={{ color: '#059669', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle2 size={20} />
                    </Box>
                  </Tooltip>
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#ea580c' }}>
                  {role}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, mt: 0.25 }}>
                  3D Diagnostix Hub (Boston / Cairo Lab) • License: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{license}</span>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, alignSelf: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<Save size={15} />}
                sx={{
                  bgcolor: '#00706a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  px: 3,
                  py: 1,
                  borderRadius: 2.5,
                  boxShadow: '0 2px 8px rgba(0, 112, 106, 0.25)',
                  '&:hover': {
                    bgcolor: '#008b84',
                    boxShadow: '0 4px 12px rgba(0, 112, 106, 0.35)',
                  },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08)}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                minHeight: 48,
                gap: 1,
              },
            }}
          >
            <Tab icon={<User size={16} />} iconPosition="start" label="Clinician Credentials" value="profile" />
            <Tab icon={<Sliders size={16} />} iconPosition="start" label="Workstation & Docking" value="appearance" />
            <Tab icon={<Database size={16} />} iconPosition="start" label="PACS & Power BI Gateway" value="pacs" />
            <Tab icon={<Shield size={16} />} iconPosition="start" label="Security & Access Logs" value="security" />
          </Tabs>
        </Box>
      </Paper>

      {/* TAB 1: CLINICIAN CREDENTIALS */}
      {activeTab === 'profile' && (
        <Paper
          elevation={1}
          component="form"
          onSubmit={handleSave}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${borderColor}`,
            bgcolor: cardBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
              Personal & Professional Profile
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Manage your operator identity, clinical CAD credentials, and digital signature rendered across surgical guide exports.
            </Typography>
          </Box>

          {/* Mock Boundary Alert */}
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
              MOCK AUTHENTICATION BOUNDARY: Profile modifications are updated in local application state only. No backend persistence, live database mutation, or OAuth synchronization is performed in this version.
            </Typography>
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'First Name' } }}
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'Last Name' } }}
            />
            <TextField
              label="Corporate Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'Corporate Email' } }}
            />
            <TextField
              label="Phone / Extension"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'Phone / Extension' } }}
            />
            <TextField
              label="License & Certification ID"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'License & Certification ID' } }}
            />
            <TextField
              label="Clinical Role Designation"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'Clinical Role Designation' } }}
            />
            <TextField
              label="Clinical Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'Clinical Specialty' } }}
            />
            <TextField
              label="Avatar Initials"
              value={avatarInitials}
              onChange={(e) => setAvatarInitials(e.target.value.toUpperCase())}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 3, 'aria-label': 'Avatar Initials' } }}
            />
          </Box>

          <TextField
            label="Professional Bio & Clinical Notes"
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { 'aria-label': 'Professional Bio & Clinical Notes' } }}
          />

          <Box sx={{ pt: 2, borderTop: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08)}`, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#00706a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.8125rem',
                px: 3.5,
                py: 1,
                borderRadius: 2,
                '&:hover': { bgcolor: '#008b84' },
              }}
            >
              Update Clinician Info
            </Button>
          </Box>
        </Paper>
      )}

      {/* TAB 2: WORKSTATION & DOCKING */}
      {activeTab === 'appearance' && (
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${borderColor}`,
            bgcolor: cardBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 3.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
              Workstation Personalization & Navigation Dock
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Customize how the CP PRO MAX navigation bar docks and configure your 22" display workstation ergonomics.
            </Typography>
          </Box>

          {/* Docking Position Selector */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Default Navigation Bar Docking Position
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
              {[
                { id: 'top', label: 'Top Navbar', icon: PanelTopClose, desc: 'Stationary header across top' },
                { id: 'bottom', label: 'Bottom Taskbar', icon: PanelBottomClose, desc: 'Docked at bottom of screen' },
                { id: 'left', label: 'Left Sidebar', icon: PanelLeftClose, desc: 'Collapsible left rail' },
                { id: 'right', label: 'Right Sidebar', icon: PanelRightClose, desc: 'Collapsible right rail' },
              ].map((pos) => {
                const isSelected = dockPos === pos.id;
                return (
                  <ButtonBase
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      setDockPos(pos.id);
                      localStorage.setItem('3ddx-cp-nav-position', pos.id);
                      showToast(`Navigation docking position set to ${pos.label}`);
                    }}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: `2px solid ${isSelected ? '#0284c7' : borderColor}`,
                      bgcolor: isSelected ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.08)) : (isDark ? alpha('#ffffff', 0.02) : '#f8fafc'),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: '#0284c7',
                        bgcolor: isDark ? alpha('#0284c7', 0.12) : alpha('#0284c7', 0.04),
                      },
                    }}
                  >
                    <Box sx={{ color: isSelected ? '#0284c7' : 'text.secondary', mb: 1 }}>
                      <pos.icon size={22} />
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: isSelected ? '#0284c7' : 'text.primary' }}>
                      {pos.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.5 }}>
                      {pos.desc}
                    </Typography>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>

          <Divider />

          {/* Theme Mode Switcher */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Visual Workspace Theme
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <ButtonBase
                type="button"
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `2px solid ${theme === 'light' ? '#f59e0b' : borderColor}`,
                  bgcolor: theme === 'light' ? alpha('#f59e0b', 0.1) : (isDark ? alpha('#ffffff', 0.02) : '#f8fafc'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Sun size={24} color="#f59e0b" />
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: 'text.primary' }}>
                    Clinical Light Mode
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    Optimized for daylight clinical reading
                  </Typography>
                </Box>
              </ButtonBase>

              <ButtonBase
                type="button"
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `2px solid ${theme === 'dark' ? '#0284c7' : borderColor}`,
                  bgcolor: theme === 'dark' ? alpha('#0284c7', 0.18) : (isDark ? alpha('#ffffff', 0.02) : '#f8fafc'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Moon size={24} color="#38bdf8" />
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: 'text.primary' }}>
                    Deep Dark Mode (OLED / CAD)
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    High contrast for 3D DICOM & guide contours
                  </Typography>
                </Box>
              </ButtonBase>
            </Box>
          </Box>

          <Divider />

          {/* Language Selection */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Interface Language (Global System-Wide)
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 1.5 }}>
              {LANGUAGES.map((l) => {
                const isCurrent = language === l.code;
                return (
                  <ButtonBase
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      showToast(`Language set to ${l.nativeName}`);
                    }}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: `1.5px solid ${isCurrent ? '#0284c7' : borderColor}`,
                      bgcolor: isCurrent ? (isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.08)) : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#0284c7',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LanguageFlag code={l.code} />
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {l.nativeName}
                      </Typography>
                    </Box>
                    {isCurrent && <Check size={14} color="#0284c7" />}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* TAB 3: PACS & POWER BI GATEWAY */}
      {activeTab === 'pacs' && (
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${borderColor}`,
            bgcolor: cardBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
              PACS Server Connection & Microsoft Power BI Gateway
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Direct telemetry connection status to 3DDX Boston Cloud Storage & Fabric Direct Lake.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                PACS Cluster Endpoint
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, fontFamily: 'monospace', my: 0.5 }}>
                pacs-prod.3ddx.org
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
                <CheckCircle2 size={14} /> Active (Latency 22ms)
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                Power BI Direct Lake
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, fontFamily: 'monospace', my: 0.5 }}>
                Fabric DW • Q4 Attainment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#0284c7', fontSize: '0.75rem', fontWeight: 700 }}>
                <Database size={14} /> Direct Query Synced
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                Hardware Acceleration
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, fontFamily: 'monospace', my: 0.5 }}>
                WebGL 2.0 / 3D Shaders
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                <Sparkles size={14} /> Enabled
              </Box>
            </Paper>
          </Box>
        </Paper>
      )}

      {/* TAB 4: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${borderColor}`,
            bgcolor: cardBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
              Security Clearance & Production Privileges
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              CP PRO MAX enterprise role-based authorization assigned to operator #{license}.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              { role: 'Master Orders Flow Control', status: 'Full Write', desc: 'Ability to lock, archive, change state, and assign CS tasks' },
              { role: 'Co-Diagnostix Treatment Planning', status: 'Approved Lead', desc: 'Digital implant planning & nerve canal trace validation' },
              { role: 'Power BI Executive Intelligence', status: 'Enterprise Viewer', desc: 'Direct access to quarter targets, clinician quotas, and revenue metrics' },
              { role: 'DICOM Optical Scan Intake', status: 'Superuser', desc: 'Manage incoming CBCT slice volumes and optical intraoral models' },
            ].map((r, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
                  border: `1px solid ${borderColor}`,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800 }}>
                    {r.role}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    {r.desc}
                  </Typography>
                </Box>
                <Chip
                  label={r.status}
                  size="small"
                  sx={{
                    bgcolor: alpha('#059669', 0.15),
                    color: '#059669',
                    fontWeight: 900,
                    fontSize: '0.6875rem',
                    fontFamily: 'monospace',
                  }}
                />
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary' }}>
                Authentication State: <span style={{ color: '#059669' }}>Active Mock Session (v0.9.8 GIS)</span>
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                Session: {session?.sessionToken ? `${session.sessionToken.slice(0, 16)}...` : "None"} • Tenant: {session?.tenantSlug || "3ddx"}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="error"
              onClick={() => { void logout(); navigate('/login'); }}
              startIcon={<LogOut size={15} />}
              sx={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: 2 }}
            >
              Sign Out of CP PRO MAX
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
