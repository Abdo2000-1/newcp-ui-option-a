import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTheme, ThemeMode } from '@/shared/hooks/useTheme';

export interface ThemeContextType {
  isDark: boolean;
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  toggle: () => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  isTransitioning: boolean;
  prefersReducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const baseTheme = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Listen to prefers-reduced-motion OS changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Trigger transient transition state on theme toggle
  const handleToggle = useCallback(() => {
    if (!prefersReducedMotion) {
      setIsTransitioning(true);
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.classList.remove('theme-transitioning');
      }, 220);
    }
    baseTheme.toggle();
  }, [baseTheme, prefersReducedMotion]);

  const handleSetTheme = useCallback((mode: ThemeMode) => {
    if (!prefersReducedMotion) {
      setIsTransitioning(true);
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.classList.remove('theme-transitioning');
      }, 220);
    }
    baseTheme.setTheme(mode);
  }, [baseTheme, prefersReducedMotion]);

  const contextValue: ThemeContextType = {
    ...baseTheme,
    toggle: handleToggle,
    toggleTheme: handleToggle,
    setTheme: handleSetTheme,
    isTransitioning,
    prefersReducedMotion,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
