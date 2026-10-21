import React, { type ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';

export interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <ThemeProvider>
          <LanguageProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </LanguageProvider>
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
