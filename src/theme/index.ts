/**
 * Option A Clinical Theme & Design System Tokens
 *
 * NOTE: As established by Abdo's controlling project boundary,
 * Option A uses Tailwind CSS v4 and modern CSS custom properties.
 * MUI implementation and MUI comparison spikes are excluded from Option A.
 */

export const clinicalTheme = {
  colors: {
    brand: {
      primary: '#00706a',       // 3DDX Canonical Teal
      primarySoft: '#d5eae7',
      primaryInk: '#00534e',
      surface: '#ffffff',
      surfaceMuted: '#f8fafc',
      ground: '#f2f5f3',
    },
    status: {
      ok: '#2c7a4e',
      okSoft: '#dcecdf',
      warn: '#a9541c',
      warnSoft: '#f7e7d8',
      crit: '#9c2f2c',
      critSoft: '#f6dedd',
      info: '#0284c7',
      infoSoft: '#e0f2fe',
    },
    text: {
      main: '#0f172a',
      muted: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      hairline: '#e2e8f0',
      focus: '#00706a',
    },
  },
  typography: {
    fontFamilySans: 'ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
} as const;

export type ClinicalTheme = typeof clinicalTheme;
