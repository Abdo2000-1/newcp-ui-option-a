// 3DDX Dynamic Global Application Configuration
// Every aspect of the application (branding, colors, theme, versioning, links, features, API) is defined here

export interface AppBrandingConfig {
  appName: string;
  shortName: string;
  tagline: string;
  version: string;
  buildNumber: string;
  releaseDate: string;
  copyrightHolder: string;
  logoLight: string;
  logoDark: string;
  logoIcon: string;
}

export interface AppLinksConfig {
  companyWebsite: string;
  supportEmail: string;
  supportPortal: string;
  documentationUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  statusPageUrl: string;
  systemDiagnosticsUrl: string;
}

export interface AppThemeConfig {
  defaultTheme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface AppFeaturesConfig {
  enablePowerBIRealEmbed: boolean;
  enableSoundEffects: boolean;
  enableLiveTelemetry: boolean;
  enableMultiLanguage: boolean;
  enableTableExcelResize: boolean;
  defaultPageSize: number;
}

export interface AppConfiguration {
  branding: AppBrandingConfig;
  links: AppLinksConfig;
  theme: AppThemeConfig;
  features: AppFeaturesConfig;
  powerBi: {
    defaultEmbedUrl: string;
    workspaceId: string;
    datasetName: string;
    refreshIntervalSec: number;
  };
  serviceProcedures: Record<string, string[]>;
}

import defaultAppConfigJson from './app.config.json';

export const DEFAULT_APP_CONFIG: AppConfiguration = defaultAppConfigJson as AppConfiguration;
export const DEFAULT_SERVICE_PROCEDURES: Record<string, string[]> = defaultAppConfigJson.serviceProcedures;

const STORAGE_KEY = '3ddx_cp_runtime_config_v1';


export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  validatedConfig: AppConfiguration;
}

export const CMS_SECURITY_DISCLOSURE = {
  storageNotice:
    'Browser-local changes are saved in local browser storage only and are not globally shared across tenants or backend services without a dedicated backend API.',
  iamNotice:
    'CMS presentation settings do NOT bypass backend IAM, Casbin policies, tenant isolation, or business permissions. Authoritative session and capability data remains enforced by the backend.',
};

export function validateAppConfig(input: unknown): ConfigValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid configuration format: configuration root must be an object'],
      validatedConfig: DEFAULT_APP_CONFIG,
    };
  }

  const raw = input as Partial<AppConfiguration>;
  const validated: AppConfiguration = {
    branding: { ...DEFAULT_APP_CONFIG.branding, ...(raw.branding || {}) },
    links: { ...DEFAULT_APP_CONFIG.links, ...(raw.links || {}) },
    theme: { ...DEFAULT_APP_CONFIG.theme, ...(raw.theme || {}) },
    features: { ...DEFAULT_APP_CONFIG.features, ...(raw.features || {}) },
    powerBi: { ...DEFAULT_APP_CONFIG.powerBi, ...(raw.powerBi || {}) },
    serviceProcedures: raw.serviceProcedures || DEFAULT_SERVICE_PROCEDURES,
  };

  // Color validation (hex format)
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  type ThemeColorKey = 'primaryColor' | 'accentColor' | 'successColor' | 'warningColor' | 'dangerColor';
  const themeColors: ThemeColorKey[] = [
    'primaryColor',
    'accentColor',
    'successColor',
    'warningColor',
    'dangerColor',
  ];

  for (const colorKey of themeColors) {
    const val = validated.theme[colorKey];
    if (typeof val !== 'string' || !hexColorRegex.test(val.trim())) {
      errors.push(`Invalid theme color '${colorKey}': '${val}'. Must be a valid hex color code.`);
      validated.theme[colorKey] = DEFAULT_APP_CONFIG.theme[colorKey] as string;
    }
  }

  // Page size validation
  const pageSize = validated.features.defaultPageSize;
  if (typeof pageSize !== 'number' || pageSize <= 0 || isNaN(pageSize)) {
    errors.push(`Invalid defaultPageSize: '${pageSize}'. Must be a positive integer.`);
    validated.features.defaultPageSize = DEFAULT_APP_CONFIG.features.defaultPageSize;
  }

  // URL validations (safe HTTP/HTTPS format)
  const urlKeys: (keyof AppLinksConfig)[] = [
    'companyWebsite',
    'supportPortal',
    'documentationUrl',
    'privacyPolicyUrl',
    'termsOfServiceUrl',
    'statusPageUrl',
    'systemDiagnosticsUrl',
  ];

  for (const linkKey of urlKeys) {
    const val = validated.links[linkKey];
    if (val && typeof val === 'string') {
      try {
        new URL(val);
      } catch {
        errors.push(`Invalid link URL '${linkKey}': '${val}'. Must be a valid absolute URL.`);
        validated.links[linkKey] = DEFAULT_APP_CONFIG.links[linkKey];
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedConfig: validated,
  };
}

export function loadAppConfig(): AppConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    const parsed = JSON.parse(raw);
    const { validatedConfig } = validateAppConfig(parsed);
    return validatedConfig;
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}

export function saveAppConfig(newConfig: AppConfiguration): { success: boolean; errors: string[] } {
  const { isValid, errors, validatedConfig } = validateAppConfig(newConfig);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedConfig, null, 2));
    window.dispatchEvent(new CustomEvent('app-config-updated', { detail: validatedConfig }));
    return { success: isValid, errors };
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
    return { success: false, errors: ['Failed to persist configuration to local storage'] };
  }
}

export function resetAppConfig(): AppConfiguration {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('app-config-updated', { detail: DEFAULT_APP_CONFIG }));
  } catch {
    // ignore
  }
  return DEFAULT_APP_CONFIG;
}

export function downloadConfigFile(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function configToYaml(config: AppConfiguration): string {
  const lines: string[] = [
    '# ==============================================================================',
    '# 3DDX Enterprise Dental ERP & Clinical Dispatch Platform Configuration',
    '# Production Runtime Configuration (YAML Format)',
    '# Sourced from /public/app.config.yml and src/config/app.config.yml',
    '# ==============================================================================',
    '',
    'branding:',
    `  appName: ${JSON.stringify(config.branding.appName)}`,
    `  shortName: ${JSON.stringify(config.branding.shortName)}`,
    `  tagline: ${JSON.stringify(config.branding.tagline)}`,
    `  version: ${JSON.stringify(config.branding.version)}`,
    `  buildNumber: ${JSON.stringify(config.branding.buildNumber)}`,
    `  releaseDate: ${JSON.stringify(config.branding.releaseDate)}`,
    `  copyrightHolder: ${JSON.stringify(config.branding.copyrightHolder)}`,
    `  logoLight: ${JSON.stringify(config.branding.logoLight)}`,
    `  logoDark: ${JSON.stringify(config.branding.logoDark)}`,
    `  logoIcon: ${JSON.stringify(config.branding.logoIcon)}`,
    '',
    'links:',
    `  companyWebsite: ${JSON.stringify(config.links.companyWebsite)}`,
    `  supportEmail: ${JSON.stringify(config.links.supportEmail)}`,
    `  supportPortal: ${JSON.stringify(config.links.supportPortal)}`,
    `  documentationUrl: ${JSON.stringify(config.links.documentationUrl)}`,
    `  privacyPolicyUrl: ${JSON.stringify(config.links.privacyPolicyUrl)}`,
    `  termsOfServiceUrl: ${JSON.stringify(config.links.termsOfServiceUrl)}`,
    `  statusPageUrl: ${JSON.stringify(config.links.statusPageUrl)}`,
    `  systemDiagnosticsUrl: ${JSON.stringify(config.links.systemDiagnosticsUrl)}`,
    '',
    'theme:',
    `  defaultTheme: ${JSON.stringify(config.theme.defaultTheme)}`,
    `  primaryColor: ${JSON.stringify(config.theme.primaryColor)}`,
    `  accentColor: ${JSON.stringify(config.theme.accentColor)}`,
    `  successColor: ${JSON.stringify(config.theme.successColor)}`,
    `  warningColor: ${JSON.stringify(config.theme.warningColor)}`,
    `  dangerColor: ${JSON.stringify(config.theme.dangerColor)}`,
    `  fontFamily: ${JSON.stringify(config.theme.fontFamily)}`,
    `  borderRadius: ${JSON.stringify(config.theme.borderRadius)}`,
    '',
    'features:',
    `  enablePowerBIRealEmbed: ${config.features.enablePowerBIRealEmbed}`,
    `  enableSoundEffects: ${config.features.enableSoundEffects}`,
    `  enableLiveTelemetry: ${config.features.enableLiveTelemetry}`,
    `  enableMultiLanguage: ${config.features.enableMultiLanguage}`,
    `  enableTableExcelResize: ${config.features.enableTableExcelResize}`,
    `  defaultPageSize: ${config.features.defaultPageSize}`,
    '',
    'powerBi:',
    `  defaultEmbedUrl: ${JSON.stringify(config.powerBi.defaultEmbedUrl)}`,
    `  workspaceId: ${JSON.stringify(config.powerBi.workspaceId)}`,
    `  datasetName: ${JSON.stringify(config.powerBi.datasetName)}`,
    `  refreshIntervalSec: ${config.powerBi.refreshIntervalSec}`,
    '',
    'serviceProcedures:'
  ];

  for (const [svc, procs] of Object.entries(config.serviceProcedures || {})) {
    lines.push(`  ${svc}:`);
    for (const proc of procs) {
      lines.push(`    - ${proc}`);
    }
  }

  return lines.join('\n') + '\n';
}
