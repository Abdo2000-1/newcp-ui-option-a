import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import {
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  AlertCircle,
  Clock,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { useTheme } from '@/shared/hooks/useTheme';
import { useAuth } from '@/features/auth/AuthContext';
import {
  getAuthAdapter,
  GoogleAuthError,
  BackendAuthError,
} from '@/features/auth/authAdapter';

/**
 * ============================================================================
 * NEW CP LOGIN PAGE — GOOGLE-ONLY AUTHENTICATION (v0.9.8 CANONICAL CONTRACT)
 * ============================================================================
 *
 * SPECIFICATION & ARCHITECTURAL INVARIANTS:
 * 1. Single primary login action: "Sign in with Google".
 * 2. Removed controls: email/workstation input, password, forgot-password,
 *    remember token, role picker, demo buttons, fake success paths.
 * 3. Frontend does not determine or infer tenant, role, or capabilities.
 * 4. Google Groups are strictly excluded and not used.
 * 5. Handles all mandatory states:
 *    - idle
 *    - Google sign-in loading
 *    - Google authentication failure
 *    - backend authentication failure / network error
 *    - authenticated and authorized (redirects to /home)
 *    - authenticated but Pending Access:
 *      "Your account is authenticated, but access has not been assigned yet."
 *    - session expired / 401
 *    - access denied / 403
 *    - unavailable Google client configuration
 *    - unavailable backend
 */

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function Login() {
  const { loginWithGoogle, logout, status: authStatus, isPendingAccess, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Authentication UI States
  const [isLoading, setIsLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);

  // Surface Session Expiry (401) or Access Denied (403) from URL or route state
  const isExpired =
    searchParams.get('reason') === 'expired' ||
    location.state?.reason === 'expired' ||
    authStatus === 'expired';
  const isDenied =
    searchParams.get('reason') === 'denied' ||
    location.state?.reason === 'denied' ||
    authStatus === 'revoked';

  const clearErrors = () => {
    setGoogleAuthError(null);
    setBackendAuthError(null);
  };

  const handleGoogleSignIn = async (overrideIdToken?: string) => {
    setIsLoading(true);
    clearErrors();

    try {
      const adapter = getAuthAdapter();

      // Check for live configuration
      if (import.meta.env.VITE_API_MODE === 'LIVE_HTTP') {
        if (!adapter.isGoogleConfigured()) {
          throw new GoogleAuthError(
            'Google Identity Services client ID is not configured (VITE_GOOGLE_CLIENT_ID missing). Live authentication cannot proceed.',
            'CONFIG_MISSING'
          );
        }
      }

      // Execute login via AuthContext boundary
      await loginWithGoogle(overrideIdToken);

      // Check current session state after login
      // If authorized, route to /home
      // If pending access, stays on page and renders Pending Access alert
    } catch (err: any) {
      if (err instanceof GoogleAuthError) {
        setGoogleAuthError(err.message);
      } else if (err instanceof BackendAuthError) {
        setBackendAuthError(err.message);
      } else {
        setBackendAuthError(err?.message || 'Authentication failed. Please check network connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If user becomes authenticated and authorized, redirect to /home
  React.useEffect(() => {
    if (authStatus === 'authenticated' && session?.accessStatus === 'AUTHORIZED') {
      navigate('/home');
    }
  }, [authStatus, session, navigate]);

  const handleSignOutPending = async () => {
    await logout();
    clearErrors();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0284c7]/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Controls: Language & Theme */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          aria-label="Toggle Language"
        >
          <Globe size={14} className="text-[#0284c7] dark:text-sky-400" />
          <span>{language === 'en' ? 'Français' : 'English'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-slate-600" />
          )}
        </button>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl dark:shadow-2xl dark:shadow-black/50 p-6 sm:p-8 space-y-6 relative z-10"
      >
        {/* Brand & Platform Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white shadow-lg shadow-[#0284c7]/25 mb-1">
            <span className="font-mono text-xl font-black tracking-tighter">3D</span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              New CP
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your enterprise Google account to access clinical cases and service workflows
            </p>
          </div>
        </div>

        {/* Status & Error Alerts */}
        <div className="space-y-3">
          {/* Session Expired (401) */}
          {isExpired && (
            <Alert
              severity="warning"
              icon={<Clock size={18} />}
              sx={{ borderRadius: 2.5, fontSize: '0.8rem' }}
              data-testid="session-expired-alert"
            >
              <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Session Expired (401)</AlertTitle>
              Your session has expired. Please sign in again with your Google account.
            </Alert>
          )}

          {/* Access Denied (403) */}
          {isDenied && (
            <Alert
              severity="error"
              icon={<ShieldAlert size={18} />}
              sx={{ borderRadius: 2.5, fontSize: '0.8rem' }}
              data-testid="access-denied-alert"
            >
              <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Access Denied (403)</AlertTitle>
              Access denied. Your account does not have permission to access this resource or tenant context is invalid.
            </Alert>
          )}

          {/* Google Auth Failure */}
          {googleAuthError && (
            <Alert
              severity="error"
              icon={<AlertCircle size={18} />}
              onClose={() => setGoogleAuthError(null)}
              sx={{ borderRadius: 2.5, fontSize: '0.8rem' }}
              data-testid="google-auth-error-alert"
            >
              <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Google Authentication Error</AlertTitle>
              {googleAuthError}
            </Alert>
          )}

          {/* Backend Auth Failure */}
          {backendAuthError && (
            <Alert
              severity="error"
              icon={<AlertCircle size={18} />}
              onClose={() => setBackendAuthError(null)}
              sx={{ borderRadius: 2.5, fontSize: '0.8rem' }}
              data-testid="backend-auth-error-alert"
            >
              <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Authentication Error</AlertTitle>
              {backendAuthError}
            </Alert>
          )}

          {/* Pending Access: Exact approved message */}
          {isPendingAccess && (
            <Alert
              severity="info"
              icon={<Info size={18} />}
              sx={{
                borderRadius: 2.5,
                fontSize: '0.8rem',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                bgcolor: 'rgba(2, 132, 199, 0.08)',
              }}
              data-testid="pending-access-alert"
            >
              <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Pending Access</AlertTitle>
              Your account is authenticated, but access has not been assigned yet.
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                Contact your Tenant Administrator to grant an approved role assignment.
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSignOutPending}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25 }}
                >
                  Sign in with a different account
                </Button>
              </Box>
            </Alert>
          )}
        </div>

        {/* Primary Action: Sign in with Google */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={isLoading}
            aria-busy={isLoading}
            data-testid="google-signin-button"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:border-[#0284c7]/50 active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CircularProgress size={18} color="inherit" />
                <span>Signing in with Google...</span>
              </Stack>
            ) : (
              <>
                <GoogleIcon />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Compliance & Security Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              <ShieldCheck size={14} />
              <span>HIPAA & GDPR Compliant Medical Diagnostic Gateway</span>
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-2 text-center text-[10px] text-slate-400">
          <p>© 2026 3D Diagnostix Inc. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}