import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Settings,
  Sliders,
  Users,
  Palette,
  Globe,
  Activity,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  FileCode,
  Download,
  Info
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { canAccessAdministration } from '@/app/shell/navConfig';
import { useAppConfig } from '@/app/providers/contexts/ConfigContext';
import {
  validateAppConfig,
  CMS_SECURITY_DISCLOSURE,
  DEFAULT_APP_CONFIG,
  configToYaml,
  downloadConfigFile,
} from '@/shared/config/appConfig';
import { sound } from '@/shared/utils/sound';
import { CmsAccessManagement } from '../components/CmsAccessManagement';
import { PostHogSettingsView } from '../components/PostHogSettingsView';
import { SentrySettingsView } from '../components/SentrySettingsView';

export default function ConfigManager() {
  const navigate = useNavigate();
  const { session, isPendingAccess } = useAuth();
  const isAuthorized = canAccessAdministration(session);

  const { config, saveConfig, resetConfig } = useAppConfig();
  const [formState, setFormState] = useState(config);
  const [activeTab, setActiveTab] = useState<'access' | 'configuration' | 'posthog' | 'sentry'>('access');
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 1. Authorization & Capability Check (Deny-by-default)
  if (!isAuthorized) {
    let denialReason = 'CMS controls and system administration require authoritative Admin, Super Admin, or Senior roles.';
    if (isPendingAccess) {
      denialReason = 'Your account is currently in Pending Access status. An administrator must assign you a role before you can access administration tools.';
    } else if (!session) {
      denialReason = 'Authoritative session capability data is unavailable. Access is denied by default per security requirements.';
    }

    return (
      <div className="w-full min-w-0 py-12 px-4 sm:px-6 flex justify-center" data-testid="cms-access-denied">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Lock size={28} />
          </div>
          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
              403 FORBIDDEN
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Administrative Access Restricted
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {denialReason}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-left text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">Policy Specification:</div>
            <div>• Access is not inferred from email addresses or client strings.</div>
            <div>• CMS settings cannot bypass PostgreSQL IAM or tenant boundaries.</div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Handlers for Configuration Form
  const handleFieldChange = (section: keyof typeof formState, field: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...(prev as unknown as Record<string, unknown>)[section] as Record<string, unknown>,
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    const validation = validateAppConfig(formState);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSaveStatus({
        success: false,
        message: 'Configuration validation failed. Some fields contained invalid formats.',
      });
      sound.playClick();
      return;
    }

    setValidationErrors([]);
    saveConfig(validation.validatedConfig);
    sound.playSuccess();
    setSaveStatus({
      success: true,
      message: 'Configuration saved successfully to local browser storage.',
    });
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleReset = () => {
    if (window.confirm('Restore factory default configuration? Any local overrides will be removed.')) {
      resetConfig();
      setFormState(DEFAULT_APP_CONFIG);
      setValidationErrors([]);
      sound.playClick();
      setSaveStatus({
        success: true,
        message: 'Factory defaults restored.',
      });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleExportJson = () => {
    downloadConfigFile(JSON.stringify(formState, null, 2), 'app.config.json', 'application/json');
  };

  const handleExportYaml = () => {
    downloadConfigFile(configToYaml(formState), 'app.config.yml', 'text/yaml');
  };

  return (
    <div className="space-y-6 w-full min-w-0 pb-16" data-testid="cms-page">
      {/* Restored Minimal CMS Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sliders size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              CMS & System Controls
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clean, minimal administration for branding, pending access provisioning, and observability.
            </p>
          </div>
        </div>

        {/* Action Controls for Configuration */}
        {activeTab === 'configuration' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="reset-config-button"
              onClick={handleReset}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} className="text-slate-400" />
              <span>Reset to Default</span>
            </button>
            <button
              type="button"
              data-testid="save-config-button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Save size={13} />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          data-testid="tab-access"
          onClick={() => setActiveTab('access')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'access'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Users size={16} />
          <span>Access & Pending Accounts</span>
        </button>

        <button
          type="button"
          data-testid="tab-configuration"
          onClick={() => setActiveTab('configuration')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'configuration'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Palette size={16} />
          <span>Configuration</span>
        </button>

        <button
          type="button"
          data-testid="tab-posthog"
          onClick={() => setActiveTab('posthog')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'posthog'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity size={16} />
          <span>PostHog Settings</span>
        </button>

        <button
          type="button"
          data-testid="tab-sentry"
          onClick={() => setActiveTab('sentry')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sentry'
              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert size={16} />
          <span>Sentry Settings</span>
        </button>
      </div>

      {/* Tab 1: Access (Pending Accounts & Admin Auths) */}
      {activeTab === 'access' && <CmsAccessManagement />}

      {/* Tab 2: CMS Configuration */}
      {activeTab === 'configuration' && (
        <div className="space-y-6" data-testid="cms-configuration-view">
          {/* Notification Feedback */}
          {saveStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 shadow-xs ${
                saveStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {saveStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Validation Notices:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Disclosures Callouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/30 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info size={14} className="text-sky-500" />
                <span>Storage & Scope Notice</span>
              </div>
              <p>{CMS_SECURITY_DISCLOSURE.storageNotice}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/30 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>IAM & Policy Boundary</span>
              </div>
              <p>{CMS_SECURITY_DISCLOSURE.iamNotice}</p>
            </div>
          </div>

          {/* Configuration Form Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section A: Branding Labels */}
            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders size={16} className="text-sky-500" />
                <span>Branding & Product Labels</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={formState.branding.appName}
                    onChange={(e) => handleFieldChange('branding', 'appName', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Short Name / Badge
                  </label>
                  <input
                    type="text"
                    value={formState.branding.shortName}
                    onChange={(e) => handleFieldChange('branding', 'shortName', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Platform Tagline
                  </label>
                  <input
                    type="text"
                    value={formState.branding.tagline}
                    onChange={(e) => handleFieldChange('branding', 'tagline', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Theme Colors */}
            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette size={16} className="text-indigo-500" />
                <span>Theme Colors (Hex Codes)</span>
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formState.theme.primaryColor}
                      onChange={(e) => handleFieldChange('theme', 'primaryColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formState.theme.primaryColor}
                      onChange={(e) => handleFieldChange('theme', 'primaryColor', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formState.theme.accentColor}
                      onChange={(e) => handleFieldChange('theme', 'accentColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formState.theme.accentColor}
                      onChange={(e) => handleFieldChange('theme', 'accentColor', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Success Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formState.theme.successColor}
                      onChange={(e) => handleFieldChange('theme', 'successColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formState.theme.successColor}
                      onChange={(e) => handleFieldChange('theme', 'successColor', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Warning Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formState.theme.warningColor}
                      onChange={(e) => handleFieldChange('theme', 'warningColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formState.theme.warningColor}
                      onChange={(e) => handleFieldChange('theme', 'warningColor', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Approved Links */}
            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={16} className="text-emerald-500" />
                <span>Approved Links & Support</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={formState.links.companyWebsite}
                    onChange={(e) => handleFieldChange('links', 'companyWebsite', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Documentation URL
                  </label>
                  <input
                    type="url"
                    value={formState.links.documentationUrl}
                    onChange={(e) => handleFieldChange('links', 'documentationUrl', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={formState.links.supportEmail}
                    onChange={(e) => handleFieldChange('links', 'supportEmail', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section D: Feature Toggles & Local Layout */}
            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={16} className="text-amber-500" />
                <span>Feature Visibility & Preferences</span>
              </h2>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Sound Effects</span>
                  <input
                    type="checkbox"
                    checked={formState.features.enableSoundEffects}
                    onChange={(e) => handleFieldChange('features', 'enableSoundEffects', e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Multi-Language Switching</span>
                  <input
                    type="checkbox"
                    checked={formState.features.enableMultiLanguage}
                    onChange={(e) => handleFieldChange('features', 'enableMultiLanguage', e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Table Column Resize</span>
                  <input
                    type="checkbox"
                    checked={formState.features.enableTableExcelResize}
                    onChange={(e) => handleFieldChange('features', 'enableTableExcelResize', e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                  />
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Default Rows Per Page
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={formState.features.defaultPageSize}
                    onChange={(e) => handleFieldChange('features', 'defaultPageSize', parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>Download JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportYaml}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileCode size={13} />
              <span>Download YAML</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: PostHog Settings */}
      {activeTab === 'posthog' && <PostHogSettingsView />}

      {/* Tab 4: Sentry Settings */}
      {activeTab === 'sentry' && <SentrySettingsView />}
    </div>
  );
}
