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

export function loadAppConfig(): AppConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      branding: { ...DEFAULT_APP_CONFIG.branding, ...parsed.branding },
      links: { ...DEFAULT_APP_CONFIG.links, ...parsed.links },
      theme: { ...DEFAULT_APP_CONFIG.theme, ...parsed.theme },
      features: { ...DEFAULT_APP_CONFIG.features, ...parsed.features },
      powerBi: { ...DEFAULT_APP_CONFIG.powerBi, ...parsed.powerBi },
      serviceProcedures: parsed.serviceProcedures || DEFAULT_SERVICE_PROCEDURES,
    };
  } catch (e) {
    return DEFAULT_APP_CONFIG;
  }
}

export function saveAppConfig(newConfig: AppConfiguration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig, null, 2));
    window.dispatchEvent(new CustomEvent('app-config-updated', { detail: newConfig }));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function resetAppConfig(): AppConfiguration {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('app-config-updated', { detail: DEFAULT_APP_CONFIG }));
  } catch (e) {
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

