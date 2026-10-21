import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dentalab-theme-mode';

export type ThemeMode = 'light' | 'dark' | 'red' | 'system';

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'red' || stored === 'system') {
        return stored as ThemeMode;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [resolvedDark, setResolvedDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeMode === 'dark' || themeMode === 'red';
  });

  useEffect(() => {
    const updateTheme = () => {
      document.documentElement.classList.remove('theme-red', 'theme-beige', 'theme-petrol');

      if (themeMode === 'red') {
        document.documentElement.classList.add('dark', 'theme-red');
        document.documentElement.setAttribute('data-theme', 'red');
        document.documentElement.style.colorScheme = 'dark';
        setResolvedDark(true);
      } else if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
        setResolvedDark(true);
      } else if (themeMode === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
        setResolvedDark(false);
      } else {
        // System
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedDark(sysDark);
        if (sysDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.style.colorScheme = 'light';
        }
      }

      try {
        localStorage.setItem(STORAGE_KEY, themeMode);
      } catch {}
    };

    updateTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const toggle = useCallback(() => {
    setThemeMode(prev => {
      if (prev === 'system') {
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return sysDark ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return {
    isDark: resolvedDark,
    theme: themeMode,
    resolvedTheme: resolvedDark ? ('dark' as const) : ('light' as const),
    toggle,
    toggleTheme: toggle,
    setTheme: (mode: ThemeMode) => setThemeMode(mode),
    setThemeMode,
  };
}
