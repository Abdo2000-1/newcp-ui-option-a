import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Custom 3DDX Clinical Engine MUI Theme
 * Matches the existing 3DDX Option A design tokens and color scheme.
 */
export function getMuiTheme(mode: 'light' | 'dark'): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#00706a', // 3DDX Canonical Teal
        light: '#008b84',
        dark: '#00534e',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#0284c7', // Sky blue / PACS accent
        light: '#38bdf8',
        dark: '#0369a1',
        contrastText: '#ffffff',
      },
      error: {
        main: '#e11d48', // Rose 600
        light: '#fb7185',
        dark: '#be123c',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#d97706', // Amber 600
        light: '#fbbf24',
        dark: '#b45309',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0284c7',
        light: '#38bdf8',
        dark: '#0369a1',
        contrastText: '#ffffff',
      },
      success: {
        main: '#059669', // Emerald 600
        light: '#34d399',
        dark: '#047857',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            fontWeight: 500,
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            fontWeight: 500,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
    },
  });
}
