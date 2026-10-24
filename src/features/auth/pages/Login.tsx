import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  Globe,
  Sun,
  Moon,
  Sparkles,
  X,
  Key,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { useTheme } from '@/shared/hooks/useTheme';
import type { MockAuthRole } from '@/features/auth/types';

/**
 * UNINTEGRATED BOUNDARY NOTICE: Google Login / OAuth 2.0
 * Per UIUX-REQ-005, Google OAuth is intentionally NOT implemented in this
 * offline demonstration environment. No third-party OAuth dependencies, client IDs,
 * secrets, callback handlers, or scopes are configured.
 */

export default function Login() {
  const [email, setEmail] = useState('jessica.ruiz@3ddx.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MockAuthRole>('director');

  // Forgot Password Modal State (MOCK / NOT_INTEGRATED)
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleRoleSelect = (role: MockAuthRole) => {
    setSelectedRole(role);
    if (role === 'director') {
      setEmail('jessica.ruiz@3ddx.com');
    } else {
      setEmail('dr.vance@smilecenter.com');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      localStorage.setItem('3ddx-auth', 'true');
      localStorage.setItem('3ddx-user-role', selectedRole);
      setIsLoading(false);
      navigate('/flow');
    }, 600);
  };

  // Forgot Password Handlers
  const handleOpenForgotModal = () => {
    setForgotEmail(email || '');
    setForgotError(null);
    setForgotSuccess(false);
    setIsSubmittingForgot(false);
    setIsForgotOpen(true);
  };

  const handleCloseForgotModal = () => {
    setIsForgotOpen(false);
    setForgotError(null);
    setForgotSuccess(false);
    setIsSubmittingForgot(false);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = forgotEmail.trim();

    if (!trimmed) {
      setForgotError(t('login.emailRequiredError', 'Email address is required.'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setForgotError(t('login.emailInvalidError', 'Please enter a valid email address (e.g., name@3ddx.com).'));
      return;
    }

    setForgotError(null);
    setIsSubmittingForgot(true);

    // MOCK / NOT_INTEGRATED: offline simulation without network dispatch
    setTimeout(() => {
      setIsSubmittingForgot(false);
      setForgotSuccess(true);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 p-4 relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#0284c7]/20 to-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-[#ea580c]/15 to-orange-500/5 blur-3xl pointer-events-none" />

      {/* Top Controls: Language & Theme */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xs">
          <Globe size={13} className="text-[#0284c7]" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent text-slate-700 dark:text-slate-200 font-semibold cursor-pointer outline-hidden"
          >
            <option value="en" className="dark:bg-slate-900">EN - English</option>
            <option value="fr" className="dark:bg-slate-900">FR - Français</option>
            <option value="de" className="dark:bg-slate-900">DE - Deutsch</option>
            <option value="it" className="dark:bg-slate-900">IT - Italiano</option>
            <option value="es" className="dark:bg-slate-900">ES - Español</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0284c7] transition-colors cursor-pointer shadow-xs"
          title="Toggle Theme"
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
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-black text-[#0284c7] dark:text-sky-400 uppercase tracking-widest">
              <Sparkles size={13} className="text-[#ea580c]" />
              <span>CP PRO MAX PLATFORM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Clinical Control Panel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in to manage surgical guides, DICOM segmentations & treatment plans
            </p>
          </div>
        </div>

        {/* Quick Role Selection Presets */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleSelect('director')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 text-center ${
              selectedRole === 'director'
                ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="font-extrabold text-[11px]">{t('login.roleDirector', 'Lab Director')}</span>
            <span className="text-[10px] text-slate-400 font-normal">Jessica Ruiz</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('clinician')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 text-center ${
              selectedRole === 'clinician'
                ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="font-extrabold text-[11px]">{t('login.roleClinician', 'Treating Clinician')}</span>
            <span className="text-[10px] text-slate-400 font-normal">Dr. Marcus Vance</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {t('login.emailLabel', '3DDX Clinician ID / Email')}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@3ddx.com"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#0284c7]/40 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold">
                {t('login.passwordLabel', 'Security Password')}
              </label>
              <button
                type="button"
                onClick={handleOpenForgotModal}
                className="text-[11px] text-[#0284c7] hover:underline cursor-pointer"
                aria-haspopup="dialog"
              >
                {t('login.forgotPassword', 'Forgot password?')}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-[#0284c7]/40 outline-hidden transition-all"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-slate-300 dark:border-slate-700 text-[#0284c7] focus:ring-[#0284c7]"
              />
              <span>Remember workstation token</span>
            </label>

            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              <ShieldCheck size={13} />
              <span>HIPAA Compliant</span>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0284c7] to-sky-600 hover:from-sky-600 hover:to-[#0284c7] text-white font-bold text-xs shadow-lg shadow-[#0284c7]/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Authenticating Clinician...</span>
            ) : (
              <>
                <span>Sign In to CP PRO MAX</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center text-[10px] text-slate-400 space-y-1">
          <p>© 2026 3D Diagnostix Inc. All rights reserved.</p>
          <p className="font-mono text-slate-400">HIPAA & GDPR Compliant Medical Diagnostic Gateway</p>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* FORGOT PASSWORD MODAL (MOCK / NOT_INTEGRATED)                      */}
      {/* Uses MUI Dialog & components; zero backend / network dispatch.     */}
      {/* ================================================================= */}
      {isForgotOpen && (
        <Dialog
          open={isForgotOpen}
          onClose={handleCloseForgotModal}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                p: 1,
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          }}
          aria-labelledby="forgot-password-title"
        >
          <DialogTitle
            id="forgot-password-title"
            component="div"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Key size={16} />
              </Box>
              <Box>
                <Typography variant="subtitle1" component="span" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, display: 'block' }}>
                  {t('login.resetPasswordTitle', 'Reset Password')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Mock Password Recovery
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              aria-label="Close dialog"
              onClick={handleCloseForgotModal}
              sx={{ color: 'text.secondary' }}
            >
              <X size={18} />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleForgotSubmit} noValidate>
            <DialogContent sx={{ pt: 1, pb: 2 }}>
              <Alert
                severity="info"
                icon={<Info size={16} />}
                sx={{
                  mb: 2,
                  fontSize: '0.72rem',
                  py: 0.5,
                  borderRadius: 2,
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  bgcolor: 'rgba(2, 132, 199, 0.06)',
                  color: 'text.primary',
                }}
              >
                <strong>MOCK SIMULATION:</strong> This offline environment simulates recovery without dispatching live emails or contacting authentication servers.
              </Alert>

              {forgotSuccess ? (
                <Box sx={{ py: 1 }}>
                  <Alert
                    severity="success"
                    icon={<CheckCircle2 size={18} />}
                    sx={{
                      borderRadius: 2,
                      mb: 1.5,
                      fontSize: '0.78rem',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Demo Recovery Token Generated
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      A simulated password reset authorization has been recorded for{' '}
                      <strong style={{ color: '#0284c7' }}>{forgotEmail}</strong>.
                    </Typography>
                  </Alert>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontStyle: 'italic', fontSize: '0.7rem' }}>
                    No real email or external request was dispatched. In production, this initiates HIPAA-compliant tokenized verification.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                    Enter your clinician ID or registered email address. We will simulate sending instructions to reset your password.
                  </Typography>
                  <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    label={t('login.emailLabel', 'Workstation Identity / Email')}
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    error={Boolean(forgotError)}
                    helperText={forgotError || 'Enter the email associated with your 3DDX provider account'}
                    disabled={isSubmittingForgot}
                    slotProps={{
                      htmlInput: {
                        'aria-label': 'Forgot password email input',
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </Stack>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
              {forgotSuccess ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCloseForgotModal}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    borderRadius: 2,
                    py: 1,
                    bgcolor: '#0284c7',
                    '&:hover': { bgcolor: '#0369a1' },
                  }}
                >
                  Done
                </Button>
              ) : (
                <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleCloseForgotModal}
                    disabled={isSubmittingForgot}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      color: 'text.secondary',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmittingForgot}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: 2,
                      px: 2,
                      bgcolor: '#0284c7',
                      '&:hover': { bgcolor: '#0369a1' },
                    }}
                  >
                    {isSubmittingForgot ? (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <CircularProgress size={14} color="inherit" />
                        <span>Simulating...</span>
                      </Stack>
                    ) : (
                      'Send Reset Link (MOCK)'
                    )}
                  </Button>
                </Stack>
              )}
            </DialogActions>
          </form>
        </Dialog>
      )}

    </div>
  );
}
