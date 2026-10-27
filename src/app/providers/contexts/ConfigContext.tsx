import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppConfiguration,
  DEFAULT_APP_CONFIG,
  loadAppConfig,
  saveAppConfig,
  resetAppConfig,
  getFeatureFlag,
} from '@/shared/config/appConfig';

interface ConfigContextType {
  config: AppConfiguration;
  updateConfig: (updater: (prev: AppConfiguration) => AppConfiguration) => void;
  saveConfig: (newConfig: AppConfiguration) => void;
  resetConfig: () => void;
  isFeatureActive: (featureKey: string, defaultValue?: boolean) => boolean;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfiguration>(() => loadAppConfig());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('app-config-updated', handleUpdate);
    return () => window.removeEventListener('app-config-updated', handleUpdate);
  }, []);

  const updateConfig = (updater: (prev: AppConfiguration) => AppConfiguration) => {
    setConfig(prev => {
      const next = updater(prev);
      saveAppConfig(next);
      return next;
    });
  };

  const handleSaveConfig = (newConfig: AppConfiguration) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
  };

  const handleResetConfig = () => {
    const fresh = resetAppConfig();
    setConfig(fresh);
  };

  const isFeatureActive = (featureKey: string, defaultValue = false): boolean => {
    if (featureKey in config.features) {
      const val = (config.features as Record<string, unknown>)[featureKey];
      if (typeof val === 'boolean') return val;
    }
    return getFeatureFlag(featureKey, defaultValue);
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        saveConfig: handleSaveConfig,
        resetConfig: handleResetConfig,
        isFeatureActive,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    return {
      config: DEFAULT_APP_CONFIG,
      updateConfig: () => {},
      saveConfig: () => {},
      resetConfig: () => {},
      isFeatureActive: (_key: string, def = false) => def,
    };
  }
  return ctx;
}
