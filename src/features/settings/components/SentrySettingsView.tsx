import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  FileCode,
  Flame,
  Check
} from 'lucide-react';
import { getSentry } from '@/shared/observability';
import { useAuth } from '@/features/auth';
import { canAccessAdministration } from '@/app/shell/navConfig';
import type { SentryStatusSummary } from '@/shared/observability/types';

export const SentrySettingsView: React.FC = () => {
  const { session } = useAuth();
  const isAuthorized = canAccessAdministration(session);

  const [status] = useState<SentryStatusSummary>(() => getSentry().getStatusSummary());
  const [testResult, setTestResult] = useState<{
    triggered: boolean;
    success: boolean;
    message: string;
    eventId?: string;
    timestamp?: string;
  } | null>(null);

  const handleTriggerTestError = () => {
    if (!isAuthorized) return;
    const res = getSentry().triggerSafeTestError();
    const now = new Date().toLocaleTimeString();
    setTestResult({
      triggered: true,
      success: res.success,
      message: res.message,
      eventId: res.eventId,
      timestamp: now,
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0" data-testid="sentry-settings-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Sentry Error Monitoring & Sanitization
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Application exception monitoring, automated PII/PHI scrubbing, and release tracking.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          <span
            data-testid="sentry-status-badge"
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-xs ${
              status.enabled
                ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {status.enabled ? <CheckCircle2 size={13} className="text-emerald-500" /> : <AlertTriangle size={13} className="text-slate-400" />}
            <span>{status.enabled ? 'Sentry Active' : 'Sentry Disabled'}</span>
          </span>
        </div>
      </div>

      {/* PII / PHI Sanitization Notice */}
      <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 flex items-start gap-3 shadow-xs">
        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold">Automated Data Scrubber & HIPAA Compliance</div>
          <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            All error payloads, stack frames, breadcrumbs, and extra context are scrubbed using strict HIPAA regex filters. Authorization headers, session tokens, passwords, and clinical DICOM metadata are completely stripped.
          </div>
        </div>
      </div>

      {/* Provider Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DSN Masked State */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <KeyRound size={14} className="text-slate-400" />
            <span>Sentry DSN</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono truncate" data-testid="sentry-masked-dsn">
            {status.maskedDsn}
          </div>
          <div className="text-[11px] text-slate-400">
            {status.configured ? 'DSN is configured safely without disclosing credentials' : 'Not configured in environment'}
          </div>
        </div>

        {/* Environment */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Server size={14} className="text-slate-400" />
            <span>Environment</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize" data-testid="sentry-environment">
            {status.environment}
          </div>
          <div className="text-[11px] text-slate-400">
            Production, staging, or development
          </div>
        </div>

        {/* Release */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <FileCode size={14} className="text-slate-400" />
            <span>Release</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono" data-testid="sentry-release">
            {status.release}
          </div>
          <div className="text-[11px] text-slate-400">
            Git baseline release tag
          </div>
        </div>

        {/* Auth Tokens Non-Disclosure */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Lock size={14} className="text-slate-400" />
            <span>Sentry Auth Token</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Never Disclosed
          </div>
          <div className="text-[11px] text-slate-400">
            Build-time secret only; never in client
          </div>
        </div>
      </div>

      {/* Safe Test-Error Verification Section */}
      <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame size={16} className="text-rose-500" />
              <span>Safe Error Capture Verification</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dispatches a synthetic, non-critical test exception to verify pipeline ingestion and scrubber integrity.
            </p>
          </div>
          <div>
            {isAuthorized ? (
              <button
                type="button"
                data-testid="trigger-test-error-button"
                onClick={handleTriggerTestError}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play size={13} fill="currentColor" />
                <span>Trigger Safe Test Error</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed">
                <Lock size={12} />
                <span>Admin / Senior Only</span>
              </div>
            )}
          </div>
        </div>

        {testResult && (
          <div
            data-testid="test-error-result"
            className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-300">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-rose-600 dark:text-rose-400" />
                <span>Verification Dispatch Completed</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">{testResult.timestamp}</span>
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              {testResult.message}
            </div>
            {testResult.eventId && (
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Synthetic Event ID: <span className="text-rose-600 dark:text-rose-400 font-bold">{testResult.eventId}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
