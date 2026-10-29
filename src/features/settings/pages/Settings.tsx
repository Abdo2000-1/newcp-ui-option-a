import React, { useState, useEffect } from 'react';
import {
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Check,
  Save,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import {
  useLanguage,
  LANGUAGES,
  LanguageFlag,
  type LanguageCode,
} from '@/app/providers/contexts/LanguageContext';
import { sound } from '@/shared/utils/sound';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'language'>('appearance');
  const { theme, setTheme } = useThemeContext();
  const { language, setLanguage, t } = useLanguage();

  // Selected State (staged for Save button)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('dentalab-theme') as 'light' | 'dark' | 'system') || theme || 'dark';
  });

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language || 'en');

  const [dateFormat, setDateFormat] = useState<string>(() => {
    return localStorage.getItem('3ddx-date-format') || 'MM/DD/YYYY';
  });

  const [timezone, setTimezone] = useState<string>(() => {
    return localStorage.getItem('3ddx-timezone') || 'America/New_York';
  });

  // Feedback State
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Sync with global context if it changes from external triggers
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  useEffect(() => {
    if (theme === 'light' || theme === 'dark' || theme === 'system') { setSelectedTheme(theme); }
  }, [theme]);

  // Handle immediate language change in dropdown to support instant reactivity
  const handleLanguageChange = (newLang: LanguageCode) => {
    setSelectedLanguage(newLang);
    setLanguage(newLang);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      // 1. Persist approved theme configuration
      setTheme(selectedTheme);
      localStorage.setItem('dentalab-theme', selectedTheme);

      // 2. Persist approved language configuration
      setLanguage(selectedLanguage);
      localStorage.setItem('3ddx-language', selectedLanguage);

      // 3. Persist approved region configuration
      localStorage.setItem('3ddx-date-format', dateFormat);
      localStorage.setItem('3ddx-timezone', timezone);

      sound.playSuccess?.();
      setSaveStatus({
        success: true,
        message: 'Settings saved successfully',
      });

      const timer = setTimeout(() => {
        setSaveStatus(null);
      }, 4000);
      return () => clearTimeout(timer);
    } catch (err: any) {
      sound.playError?.();
      setSaveStatus({
        success: false,
        message: err?.message || 'Failed to save settings. Please try again.',
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6" data-testid="settings-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Palette size={24} className="text-[#0284c7]" />
            <span>Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage supported application appearance, localization, and regional preferences.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => handleSave()}
            data-testid="save-settings-button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div
          data-testid="save-status-banner"
          className={`p-4 rounded-2xl border flex items-center gap-3 shadow-xs text-xs sm:text-sm ${
            saveStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {saveStatus.success ? (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          ) : (
            <Save size={18} className="text-rose-500 shrink-0" />
          )}
          <span className="font-semibold">{saveStatus.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          data-testid="tab-appearance"
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette size={15} />
          <span>Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('language')}
          data-testid="tab-language"
          aria-label="Language & Region"
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'language'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe size={15} />
          <span>Language & Region</span>
        </button>
      </div>

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-6" data-testid="settings-appearance-section">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette size={16} className="text-[#0284c7]" />
                <span>Application Theme</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose light, dark, or system mode. Theme selection applies globally across all portals and clinical tables.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: 'dark' as const, label: 'Dark Mode', desc: 'High-contrast clinical dark theme', icon: Moon },
                { id: 'light' as const, label: 'Light Mode', desc: 'Clean high-readability daylight theme', icon: Sun },
                { id: 'system' as const, label: 'System Default', desc: 'Follows operating system appearance', icon: Monitor },
              ].map((item) => {
                const isSelected = selectedTheme === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(item.id);
                      setTheme(item.id);
                    }}
                    data-testid={`theme-option-${item.id}`}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0284c7] bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-[#0284c7]/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#0284c7] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <Icon size={18} />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Language & Region */}
      {activeTab === 'language' && (
        <div className="space-y-6" data-testid="settings-language-section">
          {/* Studio Language */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={16} className="text-[#0284c7]" />
                <span>Studio Language</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                English is the default language. Selecting a language affects all navigation, table headings, and workflow controls.
              </p>
            </div>

            <div className="max-w-md pt-2 space-y-2">
              <label htmlFor="studio-language-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Studio Language
              </label>
              <select
                id="studio-language-select"
                aria-label="Studio Language"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              {LANGUAGES.map((l) => {
                const isSelected = selectedLanguage === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    data-testid={`lang-btn-${l.code}`}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-[#0284c7] bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-300 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LanguageFlag code={l.code} className="w-5 h-3.5 rounded-xs object-cover" />
                    <span className="text-xs">{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regional Formats */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-[#0284c7]" />
                <span>Regional Formatting & Timezone</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure preferred clinical date formatting and operational timezone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Date Format */}
              <div className="space-y-1.5">
                <label htmlFor="date-format-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Date Format
                </label>
                <select
                  id="date-format-select"
                  aria-label="Date Format"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (EU Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label htmlFor="timezone-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Operational Timezone
                </label>
                <select
                  id="timezone-select"
                  aria-label="Operational Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="America/New_York">Eastern Time (US & Canada - UTC-5)</option>
                  <option value="America/Chicago">Central Time (US & Canada - UTC-6)</option>
                  <option value="America/Denver">Mountain Time (US & Canada - UTC-7)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada - UTC-8)</option>
                  <option value="Europe/London">London / Greenwich (UTC+0)</option>
                  <option value="Europe/Paris">Paris / Berlin (UTC+1)</option>
                  <option value="Asia/Dubai">Gulf Standard Time (Dubai - UTC+4)</option>
                  <option value="Asia/Tokyo">Tokyo / Japan Standard (UTC+9)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
