export interface AppSettings {
  language: 'en' | 'ar';
  theme: 'light' | 'dark' | 'system';
  autoRefreshIntervalSeconds: number;
  enableSoundAlerts: boolean;
  teethNotationSystem: 'Universal' | 'FDI';
}
