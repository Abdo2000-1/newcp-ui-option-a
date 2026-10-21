import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Shield,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  FileBadge,
  Sparkles,
  LogOut,
  Sliders,
  Database,
  Monitor
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { t } = useLanguage();
  const profile = useStore((s) => s.getProfile());

  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'preferences'>('overview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText?.('3DDX-TECH-9942-CP');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {/* Header Banner with Brand Gradient */}
          <div className="h-28 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#ea580c] relative p-6 flex items-end justify-between">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                CP PRO MAX • Technician Credentials
              </span>
            </div>
          </div>

          {/* Profile Header Overlap */}
          <div className="px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-6 gap-4">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="w-22 h-22 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#ea580c] p-1 shadow-xl ring-4 ring-white dark:ring-[#0c1222]">
                    <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-2xl text-[#0284c7] dark:text-sky-400">
                      {profile?.avatarInitials || '3D'}
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1222]" title="Active Online" />
                </div>

                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Abdu Mohamed'}
                    </h2>
                    <span className="text-emerald-500" title="Verified CP Specialist">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#ea580c] dark:text-orange-400">
                    Lead CAD/CAM Engineer & Co-Diagnostix Director
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:border-[#0284c7] transition-colors"
                >
                  {copied ? 'Copied!' : 'ID: 3DDX-9942'}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 px-1 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Operator Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`pb-2.5 px-1 border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Roles & Access
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`pb-2.5 px-1 border-b-2 transition-colors ${
                  activeTab === 'preferences'
                    ? 'border-[#0284c7] text-[#0284c7] dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Workstation Settings
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Organization
                    </span>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Building2 size={15} className="text-[#0284c7]" />
                      <span>3D Diagnostix Hub (Boston / Cairo)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Division
                    </span>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <FileBadge size={15} className="text-[#ea580c]" />
                      <span>Guided Surgery & 3D Restorations</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Official Email
                    </span>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white">
                      <Mail size={15} className="text-[#0284c7]" />
                      <span>a.aladawy@3ddx.com</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      PACS Telemetry Server
                    </span>
                    <div className="flex items-center gap-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <Database size={15} />
                      <span>pacs-prod.3ddx.org (Connected)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 flex items-start gap-3">
                  <Sparkles size={18} className="text-[#0284c7] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-[#0284c7] dark:text-sky-300 block">
                      CP PRO MAX Verified Operator
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      You are authorized to review CT scans, validate coDiagnostiX surgical guide designs, approve QC checkpoints, and submit lab orders.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-[#0284c7]" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Full Production Access</span>
                      <span className="text-[11px] text-slate-500">Flow, AddCase, OrderDetails, Reports, Task 47, Task 31</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                    Granted
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-[#ea580c]" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Power BI Enterprise Suite</span>
                      <span className="text-[11px] text-slate-500">Quarter Targets, DAX Metrics & Quotas</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                    Active
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Monitor size={18} className="text-[#0284c7]" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">22" High-DPI Workspace</span>
                      <span className="text-[11px] text-slate-500">Zero horizontal scroll table optimization</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 font-bold text-[10px]">
                    Enabled
                  </span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
