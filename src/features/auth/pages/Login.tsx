import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { useTheme } from '@/shared/hooks/useTheme';

export default function Login() {
  const [email, setEmail] = useState('jessica.ruiz@3ddx.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'director' | 'clinician'>('director');
  
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleRoleSelect = (role: 'director' | 'clinician') => {
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
            <span className="font-extrabold text-[11px]">Lab Director</span>
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
            <span className="font-extrabold text-[11px]">Treating Clinician</span>
            <span className="text-[10px] text-slate-400 font-normal">Dr. Marcus Vance</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              3DDX Clinician ID / Email
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
                Security Password
              </label>
              <button
                type="button"
                className="text-[11px] text-[#0284c7] hover:underline"
              >
                Forgot password?
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

    </div>
  );
}
