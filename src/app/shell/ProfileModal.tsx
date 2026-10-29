import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Building2,
  Mail,
  CheckCircle2,
  LogOut,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const displayName = session?.fullName || (session?.email ? session.email.split('@')[0] : t('profile.authenticatedUser', 'Authenticated User'));
  const displayEmail = session?.email || t('profile.noEmail', 'No email provided');
  const roles = session?.roles || [];
  const capabilities = session?.capabilities || [];
  const activeTenant = session?.activeTenant;
  const tenantSlug = session?.tenantSlug;

  const initials = (session?.fullName || session?.email || 'AU')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleCopyId = () => {
    if (session?.userId) {
      navigator.clipboard?.writeText?.(session.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#0c1222] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 select-none"
        >
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#ea580c] relative p-6 flex items-end justify-between">
            <button
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                {t('profile.accountProfile', 'Account Profile')}
              </span>
            </div>
          </div>

          {/* Profile Header Overlap */}
          <div className="px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 mb-6 gap-4">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#ea580c] p-1 shadow-xl ring-4 ring-white dark:ring-[#0c1222]">
                    <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-2xl text-[#0284c7] dark:text-sky-400">
                      {initials}
                    </div>
                  </div>
                  {session?.status === 'authenticated' && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1222]" title="Active Online" />
                  )}
                </div>

                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {displayName}
                    </h2>
                    {session?.accessStatus && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {session.accessStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>{displayEmail}</span>
                  </p>
                </div>
              </div>

              {session?.userId && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:border-[#0284c7] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copied ? t('common.copied', 'Copied!') : `ID: ${session.userId.slice(0, 8)}`}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tenant Info if available */}
                {(activeTenant || tenantSlug) && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {t('profile.tenantOrg', 'Tenant Organization')}
                    </span>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Building2 size={15} className="text-[#0284c7]" />
                      <span>{activeTenant ? `${activeTenant.label} (#${activeTenant.id})` : tenantSlug}</span>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('profile.sessionState', 'Session State')}
                  </span>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white capitalize">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>{session?.status || 'authenticated'}</span>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Shield size={13} className="text-[#0284c7]" />
                  <span>{t('profile.assignedRoles', 'Assigned Roles')}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <span
                        key={r}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                      >
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">{t('profile.noRoles', 'No role codes assigned')}</span>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              {capabilities.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 max-h-36 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Key size={13} className="text-[#0284c7]" />
                    <span>{t('profile.backendCapabilities', 'Backend Capabilities & Permissions')} ({capabilities.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>{t('profile.signOut', 'Sign Out')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
