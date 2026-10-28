import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { useTheme } from '@/shared/hooks/useTheme';
import { useAuth, APPROVED_DEMO_IDENTITIES } from '@/features/auth/AuthContext';
import {
  getAuthAdapter,
  GoogleAuthError,
  BackendAuthError,
  ContractGapError,
} from '@/features/auth/authAdapter';

/**
 * ============================================================================
 * NEW CP LOGIN PAGE — GOOGLE-ONLY AUTHENTICATION (IAM-TENANT-002)
 * ============================================================================
 *
 * SPECIFICATION & ARCHITECTURAL INVARIANTS:
 * 1. Single primary login action: "Sign in with Google".
 * 2. Removed controls: email/workstation identity input, password input,
 *    "Forgot password", "Remember workstation token", and Lab Director / Treating
 *    Clinician role selectors.
 * 3. Frontend does not determine or infer tenant, role, or capabilities.
 * 4. Google Groups are strictly excluded and not used.
 * 5. Handles all mandatory states:
 *    - idle
 *    - Google sign-in loading
 *    - Google authentication failure
 *    - backend authentication failure
 *    - authenticated and authorized
 *    - authenticated but Pending Access ("Your account is authenticated, but access has not been assigned yet.")
 *    - session expired / 401
 *    - access denied / 403
 *
 * CLASSIFICATION: MOCK / NOT_INTEGRATED (Frontend Offline Boundary)
 * Live POST /api/v1/auth/login and GET /api/v1/session/context are marked as
 * CONTRACT GAP pending backend OpenAPI delivery.
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
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [selectedDemoEmail, setSelectedDemoEmail] = useState<string>('cs.demo@3ddx.com');

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

  const handleGoogleSignIn = async (overrideEmail?: string) => {
    const targetEmail = overrideEmail || selectedDemoEmail;
    setIsLoading(true);
    clearErrors();

    try {
      const adapter = getAuthAdapter();

      // Check for live configuration vs offline boundary
      if (import.meta.env.VITE_API_MODE === 'LIVE_HTTP') {
        if (!adapter.isGoogleConfigured()) {
          throw new GoogleAuthError(
            'Google Identity Services client ID is not configured (VITE_GOOGLE_CLIENT_ID missing). Live authentication cannot proceed.',
            'CONFIG_MISSING'
          );
        }
        if (!adapter.isContractAvailable()) {
          throw new ContractGapError('POST /api/v1/auth/login');
        }
      }

      // Execute login via AuthContext boundary
      await loginWithGoogle(targetEmail);

      if (targetEmail === 'unassigned@3ddx.com') {
        // Authenticated but Pending Access: stays on page and renders Pending Access state
      } else {
        // Authenticated and authorized: navigate to main clinical flow
        navigate('/home');
      }
    } catch (err: any) {
      if (err instanceof GoogleAuthError) {
        setGoogleAuthError(err.message);
      } else if (err instanceof BackendAuthError) {
        setBackendAuthError(err.message);
      } else {
        setBackendAuthError(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateGoogleError = () => {
    setIsLoading(true);
    clearErrors();
    setTimeout(() => {
      setIsLoading(false);
      setGoogleAuthError('Google Sign-In failed: The identity provider rejected or cancelled the authentication prompt.');
    }, 400);
  };

  const handleSimulateBackendError = () => {
    setIsLoading(true);
    clearErrors();
    setTimeout(() => {
      setIsLoading(false);
      setBackendAuthError('Backend authentication failed: POST /api/v1/auth/login rejected the credentials (401 Unauthorized).');
    }, 400);
  };

  const handleSignOutPending = async () => {
    await logout();
    clearErrors();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 p-4 relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#0284c7]/20 to-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-[#ea580c]/15 to-orange-500/5 blur-3xl pointer-events-none" />

      {/* Top Controls: Language & Theme */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
        <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xs">
          <Globe size={13} className="text-[#0284c7]" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent text-slate-700 dark:text-slate-200 font-semibold cursor-pointer outline-hidden"
            aria-label="Select interface language"
          >
            <option value="en" className="dark:bg-slate-900">EN - English</option>
            <option value="fr" className="dark:bg-slate-900">FR - Français</option>
            <option value="de" className="dark:bg-slate-900">DE - Deutsch</option>
            <option value="it" className="dark:bg-slate-900">IT - Italiano</option>
            <option value="es" className="dark:bg-slate-900">ES - Español</option>
          </select>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0284c7] transition-colors cursor-pointer shadow-xs"
          title="Toggle Theme"
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] bg-white/95 dark:bg-[#0b101d]/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-7 sm:p-9 shadow-2xl shadow-slate-900/10 z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <img
              src={`${import.meta.env.BASE_URL}logo-3ddx-full.png`}
              alt="3DDX Logo"
              className="h-12 w-auto object-contain drop-shadow-xs"
            />
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

        {/* State Notification Banners */}
        <div className="space-y-3" role="region" aria-live="polite">
          {/* 401 Session Expired */}
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

          {/* 403 Access Denied */}
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
              <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Backend Authentication Error</AlertTitle>
              {backendAuthError}
            </Alert>
          )}

          {/* Pending Access (Authenticated but not assigned to tenant 1) */}
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
                Signed in as <strong>{session?.email}</strong>. Contact your Tenant Administrator to grant an approved role assignment for 3ddx.com.
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

        {/* Offline Demo Identity Panel (Controlled Verification Boundary) */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setShowDemoSelector(!showDemoSelector)}
            className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1 font-medium cursor-pointer"
            aria-expanded={showDemoSelector}
          >
            <span>Demo Verification Options (Offline Boundary)</span>
            {showDemoSelector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <Collapse in={showDemoSelector}>
            <div className="mt-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                Select an approved demo identity to verify backend IAM & session behavior:
              </Typography>

              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(APPROVED_DEMO_IDENTITIES).map(([email, info]) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => {
                      setSelectedDemoEmail(email);
                      handleGoogleSignIn(email);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                      selectedDemoEmail === email
                        ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-400 font-bold shadow-xs'
                        : 'hover:bg-white/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{info.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{email}</div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {info.family || 'UNASSIGNED'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Error Simulation Triggers */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  onClick={handleSimulateGoogleError}
                  sx={{ textTransform: 'none', fontSize: '0.7rem', p: 0.5 }}
                >
                  Simulate Google Error
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="warning"
                  onClick={handleSimulateBackendError}
                  sx={{ textTransform: 'none', fontSize: '0.7rem', p: 0.5 }}
                >
                  Simulate Backend Error
                </Button>
              </div>
            </div>
          </Collapse>
        </div>

        {/* Footer Info */}
        <div className="pt-2 text-center text-[10px] text-slate-400">
          <p>© 2026 3D Diagnostix Inc. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
