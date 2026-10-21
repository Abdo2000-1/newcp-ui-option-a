import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppConfiguration,
  DEFAULT_APP_CONFIG,
  loadAppConfig,
  saveAppConfig,
  resetAppConfig
} from '@/shared/config/appConfig';

interface ConfigContextType {
  config: AppConfiguration;
  updateConfig: (updater: (prev: AppConfiguration) => AppConfiguration) => void;
  saveConfig: (newConfig: AppConfiguration) => void;
  resetConfig: () => void;
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

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        saveConfig: handleSaveConfig,
        resetConfig: handleResetConfig
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
    };
  }
  return ctx;
}
