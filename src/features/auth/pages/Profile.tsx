import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  RotateCcw,
  Check,
  Sun,
  Moon,
  Laptop,
  Compass,
  Volume2,
  VolumeX,
  Bell,
  Activity,
  Layers,
  Award,
  Key
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useLanguage, LANGUAGES, LanguageFlag } from '@/app/providers/contexts/LanguageContext';
import { sound } from '@/shared/utils/sound';

export default function Profile() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeContext();
  const { language, setLanguage, currentOption, t } = useLanguage();
  const rawProfile = useStore((s) => s.getProfile());

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'pacs' | 'security'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState(rawProfile?.firstName || 'Abdo');
  const [lastName, setLastName] = useState(rawProfile?.lastName || 'Mohamed');
  const [email, setEmail] = useState('a.aladawy@3ddx.com');
  const [phone, setPhone] = useState('+1 (555) 749-3821');
  const [role, setRole] = useState('Lead CAD/CAM Engineer & Co-Diagnostix Director');
  const [license, setLicense] = useState('CAD-DL-89421');
  const [bio, setBio] = useState('Specialist in digital dental prosthetics, coDiagnostiX surgical guide planning, and 3D intraoral scan segmentation.');

  // Personalization settings
  const [dockPos, setDockPos] = useState<string>(() => localStorage.getItem('3ddx-cp-nav-position') || 'top');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pacsAutoSync, setPacsAutoSync] = useState(true);
  const [pacsSyncInterval, setPacsSyncInterval] = useState('15s');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    sound.playPop?.();
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('3ddx-cp-nav-position', dockPos);
    window.dispatchEvent(new Event('storage'));
    showToast(t('action.save', 'Preferences saved successfully!'));
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto min-w-0 select-none pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl shadow-emerald-900/40 border border-emerald-400"
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b14] shadow-sm">
        
        {/* Brand Gradient Banner */}
        <div className="h-36 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#ea580c] relative p-6 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
              CP PRO MAX • Master Specialist Profile
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/80 font-bold hidden sm:inline">
            PACS Telemetry Node #1016 • Verified
          </span>
        </div>

        {/* Profile Card Header */}
        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0284c7] to-[#ea580c] p-1.5 shadow-xl ring-4 ring-white dark:ring-[#070b14]">
                  <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-3xl text-[#0284c7] dark:text-sky-400">
                    3DDX
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070b14]" title="Operator Online" />
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    {firstName} {lastName}
                  </h1>
                  <span className="text-emerald-500" title="CP PRO MAX Certified">
                    <CheckCircle2 size={18} />
                  </span>
                </div>
                <p className="text-xs font-bold text-[#ea580c] dark:text-orange-400">
                  {role}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  3D Diagnostix Hub (Boston / Cairo Lab) • License: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{license}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold mt-6 overflow-x-auto">
            {[
              { id: 'profile', label: 'Clinician Credentials', icon: User },
              { id: 'appearance', label: 'UI Personalization & Docking', icon: Sliders },
              { id: 'pacs', label: 'PACS & Power BI Gateway', icon: Database },
              { id: 'security', label: 'Security & Access Logs', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* TAB 1: CLINICIAN CREDENTIALS */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Personal & Professional Profile
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your identity, CAD credentials, and clinical signature displayed on 3DDX surgical guide reports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Corporate Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Phone / Ext</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">License & Certification ID</label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">System Role Designation</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1">Professional Bio & Notes</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white font-bold text-xs shadow-md"
            >
              Update Clinician Info
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: UI PERSONALIZATION & DOCKING */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Workstation Personalization & Navigation Dock
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Customize how the CP PRO MAX navigation bar docks and configure your 22" display ergonomics.
            </p>
          </div>

          {/* Docking Position Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Default Navigation Bar Docking Position
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
              {[
                { id: 'top', label: 'Top Navbar', icon: '⬆️', desc: 'Standard header across top' },
                { id: 'bottom', label: 'Bottom Taskbar', icon: '⬇️', desc: 'Docked at bottom of screen' },
                { id: 'left', label: 'Left Sidebar', icon: '⬅️', desc: 'Collapsible left rail' },
                { id: 'right', label: 'Right Sidebar', icon: '➡️', desc: 'Collapsible right rail' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => {
                    setDockPos(pos.id);
                    localStorage.setItem('3ddx-cp-nav-position', pos.id);
                    window.location.reload();
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    dockPos === pos.id
                      ? 'bg-[#0284c7]/15 border-[#0284c7] text-[#0284c7] dark:text-sky-300 ring-2 ring-[#0284c7]/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{pos.icon}</div>
                  <div className="font-extrabold">{pos.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{pos.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode Switcher */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Visual Workspace Theme
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  theme === 'light'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-900 ring-2 ring-amber-400/40 font-black'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Sun size={20} className="text-amber-500" />
                <div className="text-left">
                  <div>Clinical Light Mode</div>
                  <span className="text-[10px] font-normal text-slate-500">Optimized for daytime clinical viewing</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#0284c7]/15 border-[#0284c7] text-white ring-2 ring-[#0284c7]/40 font-black'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Moon size={20} className="text-[#0284c7]" />
                <div className="text-left">
                  <div>Deep Dark Mode (OLED / CAD)</div>
                  <span className="text-[10px] font-normal text-slate-400">High contrast for 3D DICOM & guide contours</span>
                </div>
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Interface Language (Global System-Wide)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    showToast(`Language changed to ${l.nativeName}`);
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                    language === l.code
                      ? 'bg-[#0284c7]/15 border-[#0284c7] text-[#0284c7] dark:text-sky-300 ring-1 ring-[#0284c7]'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LanguageFlag code={l.code} className="w-5 h-3.5 rounded-xs object-cover shadow-2xs shrink-0" />
                    <span>{l.nativeName}</span>
                  </div>
                  {language === l.code && <Check size={14} className="text-[#0284c7]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PACS & POWER BI GATEWAY */}
      {activeTab === 'pacs' && (
        <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              PACS Server Connection & Microsoft Power BI Gateway
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Direct telemetry connection status to 3DDX Boston Cloud Storage & Fabric Direct Lake.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">PACS Cluster Endpoint</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block">pacs-prod.3ddx.org</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-[11px]">
                <CheckCircle2 size={13} /> Active (Latency 22ms)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Power BI Direct Lake</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block">Fabric DW • Q4 Attainment</span>
              <span className="inline-flex items-center gap-1.5 text-[#0284c7] font-bold mt-1 text-[11px]">
                <Database size={13} /> Direct Query Synced
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Hardware Acceleration</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block">WebGL 2.0 / 3D Shaders</span>
              <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold mt-1 text-[11px]">
                <Sparkles size={13} /> Enabled
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Security Clearance & Production Privileges
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              CP PRO MAX enterprise role-based authorization assigned to operator #{rawProfile?.licenseNumber || '99421'}.
            </p>
          </div>

          <div className="space-y-3 text-xs font-semibold">
            {[
              { role: 'Master Orders Flow Control', status: 'Full Write', desc: 'Ability to lock, archive, change state, and assign CS tasks' },
              { role: 'Co-Diagnostix Treatment Planning', status: 'Approved Lead', desc: 'Digital implant planning & nerve canal trace validation' },
              { role: 'Power BI Executive Intelligence', status: 'Enterprise Viewer', desc: 'Direct access to quarter targets, clinician quotas, and revenue metrics' },
              { role: 'DICOM Optical Scan Intake', status: 'Superuser', desc: 'Manage incoming CBCT slice volumes and optical intraoral models' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{r.role}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{r.desc}</div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase font-mono">
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut size={14} />
              <span>Sign Out of CP PRO MAX</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
