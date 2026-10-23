import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Globe, 
  ShieldCheck, 
  Building2, 
  Moon, 
  Sun, 
  Monitor,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Trash2,
  Sparkles,
  Sliders,
  QrCode,
  RefreshCw,
  Info,
  Eye,
  EyeOff,
  Clock,
  Coins,
  Laptop,
  Smartphone,
  Shield,
  Key,
  Lock,
  AlertTriangle,
  FileSpreadsheet,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useLanguage, LANGUAGES, LanguageFlag, type LanguageCode } from '@/app/providers/contexts/LanguageContext';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { sound } from '@/shared/utils/sound';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'language' | 'security' | 'organization'>('appearance');
  const { theme, setTheme } = useThemeContext();
  const { language, setLanguage, currentOption } = useLanguage();
  const profile = useStore(s => s.getProfile());

  // Profile Form State
  const [firstName, setFirstName] = useState(profile.firstName || 'Jessica');
  const [lastName, setLastName] = useState(profile.lastName || 'Ruiz');
  const [email, setEmail] = useState(profile.email || 'j.ruiz@dentalab-cad.com');
  const [phone, setPhone] = useState(profile.phone || '+1 (555) 749-3821');
  const [role, setRole] = useState(profile.role || 'Lab Director');
  const [specialty, setSpecialty] = useState(profile.specialty || 'Orthodontics & 3D CAD/CAM');
  const [licenseNumber, setLicenseNumber] = useState(profile.licenseNumber || 'CAD-DL-89421');
  const [bio, setBio] = useState(profile.bio || 'Specialist in digital dental prosthetics and 3D intraoral scan segmentation.');
  const [avatarInitials, setAvatarInitials] = useState(profile.avatarInitials || 'JR');

  // Appearance State
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('dentalab-accent') || 'cyan';
  });
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [highContrastTeeth, setHighContrastTeeth] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Notification Toggles State
  const [notifPreferences, setNotifPreferences] = useState({
    orderStatus: true,
    newMessages: true,
    fileUploads: true,
    billingAlerts: true,
    urgentFlags: true,
    dailySummary: false,
    soundAlerts: true
  });
  const [testNotifSent, setTestNotifSent] = useState(false);

  // Language & Region State (Bound to global LanguageContext)
  const [timezone, setTimezone] = useState('America/New_York');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [currency, setCurrency] = useState('USD');
  const [numberingSystem, setNumberingSystem] = useState<'universal' | 'fdi'>('universal');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 'sess-1', device: 'Windows 11 PC (Chrome 128)', location: 'Houston, TX, USA', ip: '192.168.1.45', isCurrent: true, time: 'Active now', icon: Laptop },
    { id: 'sess-2', device: 'CAD Workstation 02 (DentalLab Suite)', location: 'Dallas, TX, USA', ip: '192.168.1.112', isCurrent: false, time: '2 hours ago', icon: Laptop },
    { id: 'sess-3', device: 'iPad Pro 12.9" (Chairside Mobile)', location: 'Austin, TX, USA', ip: '172.56.21.90', isCurrent: false, time: 'Yesterday at 4:15 PM', icon: Smartphone }
  ]);

  // Organization State
  const [orgName, setOrgName] = useState('DentaLab 3D CAD/CAM Center');
  const [legalName, setLegalName] = useState('DentaLab BioTechnologies LLC');
  const [taxId, setTaxId] = useState('US-EIN-9844201');
  const [orgEmail, setOrgEmail] = useState('operations@dentalab-studio.com');
  const [orgPhone, setOrgPhone] = useState('+1 (800) 555-3392');
  const [orgAddress, setOrgAddress] = useState('7420 Innovation Way, Suite 400, Houston, TX 77030');
  const [crownDays, setCrownDays] = useState(3);
  const [implantDays, setImplantDays] = useState(5);
  const [alignerDays, setAlignerDays] = useState(7);

  // UI Toast State
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Sync profile when store changes
  useEffect(() => {
    setFirstName(profile.firstName || 'Jessica');
    setLastName(profile.lastName || 'Ruiz');
    setEmail(profile.email || 'j.ruiz@dentalab-cad.com');
    setPhone(profile.phone || '+1 (555) 749-3821');
    setRole(profile.role || 'Lab Director');
    setSpecialty(profile.specialty || 'Orthodontics & 3D CAD/CAM');
    setLicenseNumber(profile.licenseNumber || 'CAD-DL-89421');
    setBio(profile.bio || 'Specialist in digital dental prosthetics and 3D intraoral scan segmentation.');
    setAvatarInitials(profile.avatarInitials || 'JR');
  }, [profile]);

  const handleSave = () => {
    // 1. Save profile to reactive store
    store.updateProfile({
      firstName,
      lastName,
      email,
      phone,
      role,
      specialty,
      licenseNumber,
      bio,
      avatarInitials: avatarInitials || `${firstName[0] || 'J'}${lastName[0] || 'R'}`
    });

    // 2. Save appearance preferences
    try {
      localStorage.setItem('dentalab-accent', accentColor);
      localStorage.setItem('dentalab-density', uiDensity);
      localStorage.setItem('dentalab-numbering', numberingSystem);
    } catch {}

    setSavedMessage('All settings and preferences saved successfully!');
    setTimeout(() => setSavedMessage(null), 3500);
  };

  const handleSendTestNotification = () => {
    store.createNotification({
      type: 'order',
      title: 'Lab Notification Test',
      message: 'Intraoral scan segmented & verified for Crown #19 (Patient: Sarah Connor).',
    });
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleTerminateOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    setSavedMessage('Terminated all other active sessions.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleExportData = () => {
    const exportData = {
      profile: store.getProfile(),
      ordersCount: store.getOrders().length,
      casesCount: store.getCases().length,
      clinicsCount: store.getClinics().length,
      theme,
      accentColor,
      exportedAt: new Date().toISOString(),
      version: 'React 19 Pure DentaLab'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dentalab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    
    if (score <= 25) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 50) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 75) return { score, label: 'Good', color: 'bg-cyan-500' };
    return { score, label: 'Military-Grade', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(newPassword);

  interface TabItem {
    id: 'profile' | 'appearance' | 'notifications' | 'language' | 'security' | 'organization';
    label: string;
    icon: any;
    badge?: string;
  }

  const tabs: TabItem[] = [
    { id: 'appearance', label: 'Theme & Appearance', icon: Palette, badge: 'Active' },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
    { id: 'organization', label: 'Organization & Lab', icon: Building2 },
  ];

  const accentColors = [
    { id: 'cyan', label: 'React Cyan', color: '#06b6d4', ring: 'ring-cyan-500' },
    { id: 'indigo', label: 'Electric Indigo', color: '#6366f1', ring: 'ring-indigo-500' },
    { id: 'emerald', label: 'Emerald Mint', color: '#10b981', ring: 'ring-emerald-500' },
    { id: 'amber', label: 'Sunset Amber', color: '#f59e0b', ring: 'ring-amber-500' },
    { id: 'purple', label: 'Violet Laser', color: '#8b5cf6', ring: 'ring-purple-500' },
    { id: 'rose', label: 'Rose Quartz', color: '#f43f5e', ring: 'ring-rose-500' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Studio Settings
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              v2.4 Live
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system themes, dental notation models, account security, and lab workflow parameters.
          </p>
        </div>

        {/* Global Save Button at top right */}
        <div className="flex items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-fade-in">
              <CheckCircle2 size={16} />
              <span>{savedMessage}</span>
            </div>
          )}
          <Button 
            onClick={handleSave}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-sm shadow-cyan-500/30 flex items-center gap-2"
          >
            <Check size={16} />
            <span>Save Preferences</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Layout: Sidebar Navigation + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 shadow-xs flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 no-scrollbar">
            <div className="hidden lg:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Configuration Categories
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 lg:w-full whitespace-nowrap lg:whitespace-normal flex items-center justify-between px-3.5 py-2.5 sm:py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow-xs border border-cyan-200/60 dark:border-cyan-800/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Profile Summary Card inside Sidebar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {firstName} {lastName}
                  </p>
                  <p className="text-[11px] text-cyan-600 dark:text-cyan-400 truncate">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
          
          {/* ========================================================================= */}
          {/* TAB 1: THEME & APPEARANCE (Completely Overhauled)                          */}
          {/* ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-cyan-500" />
                  Theme & Visual Appearance
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Personalize the interface design system, contrast modes, and CAD visual density.
                </p>
              </div>

              {/* Theme Mode Selector Cards with UI Mockup Previews */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Theme Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Light Mode Card */}
                  <button
                    type="button"
                    onClick={() => { setTheme('light'); sound.playClick(); }}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      theme === 'light'
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 ring-4 ring-cyan-500/10 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}
                  >
                    {/* Visual UI Preview Mockup */}
                    <div className="w-full h-20 rounded-lg bg-slate-100 border border-slate-200 p-1.5 mb-2.5 flex gap-1 overflow-hidden">
                      <div className="w-5 h-full bg-white rounded border border-slate-200 flex flex-col items-center py-1 gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                        <div className="w-2 h-0.5 bg-slate-300 rounded" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full h-2.5 bg-white rounded border border-slate-200 px-1 flex items-center">
                          <div className="w-6 h-0.5 bg-cyan-400 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-white rounded border border-slate-200 p-1" />
                          <div className="bg-white rounded border border-slate-200 p-1" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-100 text-amber-600">
                          <Sun size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Light Daylight</div>
                          <div className="text-[10px] text-slate-500">Daylight contrast</div>
                        </div>
                      </div>
                      {theme === 'light' && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 2. Dark Obsidian Card */}
                  <button
                    type="button"
                    onClick={() => { setTheme('dark'); sound.playClick(); }}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      theme === 'dark'
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 ring-4 ring-cyan-500/10 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}
                  >
                    {/* Visual UI Preview Mockup (Obsidian) */}
                    <div className="w-full h-20 rounded-lg bg-slate-950 border border-slate-800 p-1.5 mb-2.5 flex gap-1 overflow-hidden">
                      <div className="w-5 h-full bg-slate-900 rounded border border-slate-800 flex flex-col items-center py-1 gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <div className="w-2 h-0.5 bg-slate-700 rounded" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full h-2.5 bg-slate-900 rounded border border-slate-800 px-1 flex items-center">
                          <div className="w-6 h-0.5 bg-cyan-400 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-slate-900 rounded border border-slate-800 p-1" />
                          <div className="bg-slate-900 rounded border border-slate-800 p-1" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-blue-900/50 text-cyan-400">
                          <Moon size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Obsidian</div>
                          <div className="text-[10px] text-slate-500">Low-fatigue CAD</div>
                        </div>
                      </div>
                      {theme === 'dark' && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 3. Crimson Red Card */}
                  <button
                    type="button"
                    onClick={() => { setTheme('red'); sound.playClick(); }}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      theme === 'red'
                        ? 'border-rose-500 bg-rose-950/40 ring-4 ring-rose-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-rose-600 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}
                  >
                    {/* Visual UI Preview Mockup (Crimson Red) */}
                    <div className="w-full h-20 rounded-lg bg-[#0f0507] border border-[#38141c] p-1.5 mb-2.5 flex gap-1 overflow-hidden">
                      <div className="w-5 h-full bg-[#1b0a0e] rounded border border-[#38141c] flex flex-col items-center py-1 gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <div className="w-2 h-0.5 bg-rose-900 rounded" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full h-2.5 bg-[#1b0a0e] rounded border border-[#38141c] px-1 flex items-center">
                          <div className="w-6 h-0.5 bg-rose-500 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-[#1b0a0e] rounded border border-[#38141c] p-1" />
                          <div className="bg-[#1b0a0e] rounded border border-[#38141c] p-1" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-rose-950/80 text-rose-400 border border-rose-800/40">
                          <Flame size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Crimson Red</div>
                          <div className="text-[10px] text-slate-500">Ruby cyber obsidian</div>
                        </div>
                      </div>
                      {theme === 'red' && (
                        <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 4. System Auto Card */}
                  <button
                    type="button"
                    onClick={() => { setTheme('system'); sound.playClick(); }}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      theme === 'system'
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 ring-4 ring-cyan-500/10 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}
                  >
                    {/* Visual UI Preview Mockup (Split) */}
                    <div className="w-full h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 mb-2.5 flex">
                      <div className="w-1/2 h-full bg-slate-100 p-1.5 flex flex-col justify-between">
                        <div className="w-6 h-1 bg-slate-300 rounded" />
                        <div className="w-8 h-4 bg-white rounded border border-slate-200" />
                      </div>
                      <div className="w-1/2 h-full bg-slate-950 p-1.5 flex flex-col justify-between border-l border-slate-800">
                        <div className="w-6 h-1 bg-slate-700 rounded" />
                        <div className="w-8 h-4 bg-slate-900 rounded border border-slate-800" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                          <Monitor size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">System Auto</div>
                          <div className="text-[10px] text-slate-500">Sync with OS</div>
                        </div>
                      </div>
                      {theme === 'system' && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Accent Color Palette Selector */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Studio Accent Color</h3>
                    <p className="text-xs text-slate-500">Sets the vibrant focus glow on buttons, tooth selections, and active states.</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 uppercase">
                    Current: {accentColor}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {accentColors.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccentColor(acc.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                        accentColor === acc.id
                          ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-900/10 dark:ring-white/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full shadow-xs shrink-0" 
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {acc.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UI Density & Layout Scaling */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Grid & Table Spacing Density</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUiDensity('comfortable')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      uiDensity === 'comfortable'
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Comfortable (16px Padding)</div>
                      <div className="text-xs text-slate-500 mt-0.5">Spacious targets, ideal for touchscreen & tablet use</div>
                    </div>
                    {uiDensity === 'comfortable' && <Check size={18} className="text-cyan-500 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUiDensity('compact')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      uiDensity === 'compact'
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Compact (10px Padding)</div>
                      <div className="text-xs text-slate-500 mt-0.5">Max data visibility for high-res CAD lab monitors</div>
                    </div>
                    {uiDensity === 'compact' && <Check size={18} className="text-cyan-500 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Hardware Acceleration & Visual Performance */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Display & 3D Acceleration</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">GPU WebGL 3D Odontogram Engine</div>
                      <div className="text-xs text-slate-500">Accelerate root rendering and titanium screw models via GPU shaders</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hardwareAcceleration} 
                        onChange={e => setHardwareAcceleration(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">High Contrast Tooth Numbers</div>
                      <div className="text-xs text-slate-500">Sharpen tooth labels against gingival background colors</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={highContrastTeeth} 
                        onChange={e => setHighContrastTeeth(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Motion Effects & Spring Animations</div>
                      <div className="text-xs text-slate-500">Fluid transitions on modal overlays and navigation items</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={animationsEnabled} 
                        onChange={e => setAnimationsEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: USER PROFILE                                                       */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-500" />
                  Clinician & Technician Profile
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage your personal laboratory signature, professional licensing, and CAD profile.
                </p>
              </div>

              {/* Avatar & Quick Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-md ring-4 ring-cyan-500/20">
                    {avatarInitials || `${firstName[0] || 'J'}${lastName[0] || 'R'}`}
                  </div>
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Online" />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {firstName} {lastName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                      Verified Director
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {email} • {specialty}
                  </p>
                  
                  {/* Preset Avatar Selector */}
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Avatar Initials:</span>
                    {['JR', 'DR', 'AL', 'CAD'].map((inits) => (
                      <button
                        key={inits}
                        type="button"
                        onClick={() => setAvatarInitials(inits)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          avatarInitials === inits
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {inits}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address (CAD Notifications)</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct Phone / Hotline</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Role & Position</label>
                  <input 
                    type="text" 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">License / Board Certification #</label>
                  <input 
                    type="text" 
                    value={licenseNumber} 
                    onChange={e => setLicenseNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinical Specialty</label>
                  <input 
                    type="text" 
                    value={specialty} 
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bio & Lab Notes</label>
                  <textarea 
                    rows={3}
                    value={bio} 
                    onChange={e => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: NOTIFICATIONS & ALERTS                                             */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-500" />
                    Alerts & Dispatch Channels
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Select events that trigger in-app banners, push alerts, and technician SMS notices.
                  </p>
                </div>

                {/* Send Test Notification Button */}
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-cyan-500" />
                  <span>{testNotifSent ? 'Notification Triggered!' : 'Send Test Notification'}</span>
                </button>
              </div>

              {testNotifSent && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-800 dark:text-cyan-300 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={16} />
                  <span>Dispatched real test notification! Check the bell icon in the top header.</span>
                </div>
              )}

              {/* Toggles List */}
              <div className="space-y-3">
                {[
                  { key: 'orderStatus', title: 'Case & Order Lifecycle Updates', desc: 'Alert when cases progress to Design, Milling, Sintering, or Quality Check.' },
                  { key: 'newMessages', title: 'Clinician CAD Messages & Notes', desc: 'Instant alert when a doctor leaves instructions or margin adjustments.' },
                  { key: 'fileUploads', title: 'Intraoral Scans & STL File Uploads', desc: 'Notify when high-resolution 3D arches are uploaded from Medit, iTero, or Trios.' },
                  { key: 'billingAlerts', title: 'Billing & Invoice Settlement Alerts', desc: 'Overdue invoices, client payments, and batch voucher credit updates.' },
                  { key: 'urgentFlags', title: 'Urgent & Rush Order Flags', desc: 'Priority notifications for 24h turnarounds and emergency surgical guides.' },
                  { key: 'dailySummary', title: 'Daily Morning Production Digest', desc: 'Consolidated email summary delivered every morning at 08:00 AM.' },
                  { key: 'soundAlerts', title: 'Audible Lab Bell chime on Incoming Scans', desc: 'Play subtle audio chime when new cases arrive at the intake desk.' }
                ].map((item) => {
                  const isChecked = notifPreferences[item.key as keyof typeof notifPreferences];
                  return (
                    <div 
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30"
                    >
                      <div className="pr-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => setNotifPreferences(prev => ({ ...prev, [item.key]: !isChecked }))}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: LANGUAGE & REGION                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'language' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-500" />
                  Language, Dental Notation & Region
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Configure odontogram tooth numbering conventions, local currency, and date formats.
                </p>
              </div>

              {/* Numbering System Preference */}
              <div className="p-5 rounded-2xl border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/30 dark:bg-cyan-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Odontogram Dental Numbering System</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Select your clinic’s preferred standard for tooth charts, order tickets, and lab milling instructions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setNumberingSystem('universal')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      numberingSystem === 'universal'
                        ? 'border-cyan-500 bg-white dark:bg-slate-900 shadow-xs ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Universal Numbering System</span>
                      {numberingSystem === 'universal' && <Check size={16} className="text-cyan-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Numbers 1 through 32 (Standard in USA & Canada)</p>
                    <div className="mt-2 text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                      Sample: Tooth #14 (Upper Left 1st Molar)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNumberingSystem('fdi')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      numberingSystem === 'fdi'
                        ? 'border-cyan-500 bg-white dark:bg-slate-900 shadow-xs ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">FDI Two-Digit Notation</span>
                      {numberingSystem === 'fdi' && <Check size={16} className="text-cyan-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Quadrants 1–4, Teeth 1–8 (WHO / International Standard)</p>
                    <div className="mt-2 text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                      Sample: Tooth #26 (Upper Left 1st Molar)
                    </div>
                  </button>
                </div>
              </div>

              {/* Locale Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="settings-studio-language" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Studio Language
                    </label>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <LanguageFlag code={language} />
                      <span>{currentOption.nativeName}</span>
                    </div>
                  </div>
                  <select 
                    id="settings-studio-language"
                    aria-label="Studio Language"
                    value={language} 
                    onChange={e => setLanguage(e.target.value as LanguageCode)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    {LANGUAGES.map(opt => (
                      <option key={opt.code} value={opt.code}>
                        {opt.nativeName} ({opt.label})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operating Timezone</label>
                  <select 
                    value={timezone} 
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="America/New_York">Eastern Time (ET) - US & Canada</option>
                    <option value="America/Chicago">Central Time (CT) - Houston / Dallas</option>
                    <option value="America/Los_Angeles">Pacific Time (PT) - California</option>
                    <option value="Asia/Riyadh">Riyadh (GMT+3) - Saudi Arabia</option>
                    <option value="Africa/Cairo">Cairo (GMT+2) - Egypt</option>
                    <option value="Europe/London">London (GMT+0) - United Kingdom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date Formatting</label>
                  <select 
                    value={dateFormat} 
                    onChange={e => setDateFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (09/29/2026)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (29/09/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-29 - ISO)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoicing Currency</label>
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="SAR">SAR (ر.س) - Saudi Riyal</option>
                    <option value="AED">AED (د.إ) - UAE Dirham</option>
                    <option value="EGP">EGP (ج.م) - Egyptian Pound</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: SECURITY & SESSIONS                                                */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  Account Security & Multi-Factor Access
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage password updates, hardware keys, two-factor authentication, and active logged-in sessions.
                </p>
              </div>

              {/* Password Change Form */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-cyan-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Director Password</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Password</label>
                    <input 
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirm Password</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Password Strength:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{passStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passStrength.color}`} 
                        style={{ width: `${passStrength.score}%` }} 
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                    onClick={() => {
                      setSavedMessage('Password updated successfully!');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setTimeout(() => setSavedMessage(null), 3000);
                    }}
                  >
                    Update Password
                  </Button>
                </div>
              </div>

              {/* Two-Factor Authentication (2FA) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Protect CAD design files and sensitive patient dental records with TOTP authenticator verification.
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {twoFactorEnabled ? '2FA Enabled & Protected' : 'Not Configured'}
                    </span>
                  </div>
                </div>

                <Button
                  variant={twoFactorEnabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => setShowTwoFactorModal(true)}
                  className="shrink-0"
                >
                  {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              {/* Active Sessions */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Authorized Sessions</h3>
                    <p className="text-xs text-slate-500">Devices currently authenticated to your DentaLab CAD profile.</p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleTerminateOtherSessions}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Terminate Other Sessions
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {sessions.map((sess) => {
                    const DeviceIcon = sess.icon;
                    return (
                      <div 
                        key={sess.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <DeviceIcon size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{sess.device}</span>
                              {sess.isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {sess.location} • IP: {sess.ip} • <span className="text-cyan-600 dark:text-cyan-400">{sess.time}</span>
                            </div>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="p-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Revoke session"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: ORGANIZATION & CLINIC                                              */}
          {/* ========================================================================= */}
          {activeTab === 'organization' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-500" />
                  Organization & Production Parameters
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Laboratory business credentials, production turnaround days, and global data export.
                </p>
              </div>

              {/* Lab Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Laboratory Facility / Brand Name</label>
                  <input 
                    type="text" 
                    value={orgName} 
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Legal Entity</label>
                  <input 
                    type="text" 
                    value={legalName} 
                    onChange={e => setLegalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">FDA Dental Facility / Tax ID</label>
                  <input 
                    type="text" 
                    value={taxId} 
                    onChange={e => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lab Dispatch Email</label>
                  <input 
                    type="email" 
                    value={orgEmail} 
                    onChange={e => setOrgEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinic Support Phone</label>
                  <input 
                    type="tel" 
                    value={orgPhone} 
                    onChange={e => setOrgPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Milling Facility Address</label>
                  <input 
                    type="text" 
                    value={orgAddress} 
                    onChange={e => setOrgAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Turnaround Lead Times */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Default Production Turnaround Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Crowns & Inlays</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min={1} 
                        max={14} 
                        value={crownDays} 
                        onChange={e => setCrownDays(Number(e.target.value))}
                        className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center"
                      />
                      <span className="text-xs text-slate-500">Business Days</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Implant Abutments</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min={1} 
                        max={14} 
                        value={implantDays} 
                        onChange={e => setImplantDays(Number(e.target.value))}
                        className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center"
                      />
                      <span className="text-xs text-slate-500">Business Days</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Clear Aligner Sets</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min={1} 
                        max={21} 
                        value={alignerDays} 
                        onChange={e => setAlignerDays(Number(e.target.value))}
                        className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center"
                      />
                      <span className="text-xs text-slate-500">Business Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Backup Actions */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Studio Data & Maintenance</h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Download Studio Snapshot (JSON)</div>
                    <div className="text-xs text-slate-500">Export active cases, clinic directory, and configuration state to a single file</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <Download size={15} />
                    <span>Export JSON</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Action Bar */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              DentaLab CAD Engine • Synchronized with Local Storage & In-Memory Store
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setSavedMessage('Discarded changes.');
                  setTimeout(() => setSavedMessage(null), 2500);
                }}
              >
                Reset Tab
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-cyan-500/25 flex items-center gap-2"
              >
                <Check size={16} />
                <span>Save All Changes</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Setup Authenticator App</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTwoFactorModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Scan this QR code with Google Authenticator, 1Password, or Microsoft Authenticator:
            </p>

            {/* Simulated Authenticator QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-inner">
              <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                {/* QR corner patterns */}
                <rect x="10" y="10" width="25" height="25" fill="#0f172a" rx="2" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                
                <rect x="65" y="10" width="25" height="25" fill="#0f172a" rx="2" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="73" y="18" width="9" height="9" fill="#0f172a" />

                <rect x="10" y="65" width="25" height="25" fill="#0f172a" rx="2" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="18" y="73" width="9" height="9" fill="#0f172a" />

                {/* Random matrix blocks */}
                <rect x="40" y="15" width="6" height="6" fill="#06b6d4" />
                <rect x="50" y="20" width="8" height="5" fill="#0f172a" />
                <rect x="42" y="35" width="16" height="16" fill="#06b6d4" rx="2" />
                <rect x="46" y="39" width="8" height="8" fill="white" />
                <rect x="40" y="65" width="6" height="10" fill="#0f172a" />
                <rect x="52" y="70" width="10" height="6" fill="#0f172a" />
                <rect x="70" y="55" width="8" height="8" fill="#0f172a" />
                <rect x="82" y="75" width="8" height="12" fill="#06b6d4" />
              </svg>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                otpauth://totp/DentaLab:j.ruiz?secret=DENT8942
              </div>
            </div>

            {/* Secret Key with copy */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Or enter manual key:</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value="DENT-LAB7-X892-KQ41" 
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText('DENT-LAB7-X892-KQ41');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                >
                  {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>

            {/* Verification Code */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enter 6-digit Code</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="123456"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowTwoFactorModal(false)}>
                Cancel
              </Button>
              <Button 
                size="sm"
                disabled={twoFactorCode.length < 6}
                onClick={() => {
                  setTwoFactorEnabled(true);
                  setShowTwoFactorModal(false);
                  setTwoFactorCode('');
                  setSavedMessage('Two-Factor Authentication is now active!');
                  setTimeout(() => setSavedMessage(null), 3000);
                }}
              >
                Verify & Activate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
