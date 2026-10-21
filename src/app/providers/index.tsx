import React, { type ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';
import { getMuiTheme } from '@/theme/muiTheme';

export interface AppProvidersProps {
  children: ReactNode;
}

function MuiThemeBridge({ children }: { children: ReactNode }) {
  const { isDark } = useThemeContext();
  const muiTheme = useMemo(() => getMuiTheme(isDark ? 'dark' : 'light'), [isDark]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <ThemeProvider>
          <MuiThemeBridge>
            <LanguageProvider>
              <QueryProvider>
                {children}
              </QueryProvider>
            </LanguageProvider>
          </MuiThemeBridge>
        </ThemeProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export * from './ErrorBoundary';
export * from './QueryProvider';
export * from './contexts/ThemeContext';
export * from './contexts/LanguageContext';
export * from './contexts/ConfigContext';
