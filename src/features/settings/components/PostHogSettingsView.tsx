import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Server,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  Globe
} from 'lucide-react';
import { getPostHog } from '@/shared/observability';
import type { FeatureFlagDetail, PostHogStatusSummary } from '@/shared/observability/types';

export const TRACKED_FEATURE_FLAGS = [
  {
    key: 'new_reports_ui',
    description: 'InsightHub Modernized Reporting UI (Demo rollout flag)',
    defaultFallback: false,
  },
  {
    key: 'new_cp_modern_flow',
    description: 'High-density Order Flow table layout',
    defaultFallback: true,
  },
  {
    key: 'dark_mode_v2',
    description: 'MUI v6 high-contrast dark theme token palette',
    defaultFallback: true,
  },
  {
    key: 'pacs_gateway_v2',
    description: 'Real-time PACS DICOM image streaming gateway',
    defaultFallback: false,
  },
];

export const PostHogSettingsView: React.FC = () => {
  const [status, setStatus] = useState<PostHogStatusSummary>(() => getPostHog().getStatusSummary());
  const [flagEvaluations, setFlagEvaluations] = useState<FeatureFlagDetail[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const evaluateFlags = () => {
    const posthog = getPostHog();
    setStatus(posthog.getStatusSummary());
    const evals = TRACKED_FEATURE_FLAGS.map((f) =>
      posthog.evaluateFeatureFlag(f.key, f.defaultFallback)
    );
    setFlagEvaluations(evals);
  };

  useEffect(() => {
    evaluateFlags();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      evaluateFlags();
      setIsRefreshing(false);
    }, 200);
  };

  return (
    <div className="space-y-6 w-full min-w-0" data-testid="posthog-settings-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                PostHog Observability & Feature Flags
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Safe frontend telemetry configuration, remote rollout flags, and privacy guarantees.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          <span
            data-testid="posthog-status-badge"
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-xs ${
              status.enabled
                ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {status.enabled ? <CheckCircle2 size={13} className="text-emerald-500" /> : <AlertTriangle size={13} className="text-slate-400" />}
            <span>{status.enabled ? 'Telemetry Enabled' : 'Telemetry Disabled'}</span>
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-sky-500' : 'text-slate-400'} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* Zero-PHI Privacy Notice Banner */}
      <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/80 dark:bg-sky-950/20 text-sky-950 dark:text-sky-200 flex items-start gap-3 shadow-xs">
        <ShieldCheck size={18} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold">Strict Zero-PHI & PII Sanitization Boundary</div>
          <div className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            Patient identifiers, clinical notes, tooth charts, and medical scans are excluded by default. All properties are filtered through strict sanitizers before transmission.
          </div>
        </div>
      </div>

      {/* Provider Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Configured / Missing State */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <KeyRound size={14} className="text-slate-400" />
            <span>Project API Key</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono" data-testid="posthog-masked-key">
            {status.maskedKey}
          </div>
          <div className="text-[11px] text-slate-400">
            {status.configured ? 'Project key is configured (token is never disclosed in UI)' : 'Missing configuration in environment'}
          </div>
        </div>

        {/* Host & Region */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Globe size={14} className="text-slate-400" />
            <span>Ingestion Host</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={status.host} data-testid="posthog-host">
            {status.host}
          </div>
          <div className="text-[11px] text-slate-400">
            US Cloud Region (Zero PHI)
          </div>
        </div>

        {/* Environment */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Server size={14} className="text-slate-400" />
            <span>Environment</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
            {status.environment}
          </div>
          <div className="text-[11px] text-slate-400">
            Events tagged by environment
          </div>
        </div>

        {/* Security Rule */}
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Lock size={14} className="text-slate-400" />
            <span>Security Rule</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Rollout Only
          </div>
          <div className="text-[11px] text-slate-400">
            Never used as authorization boundary
          </div>
        </div>
      </div>

      {/* Feature Flags Status & State Discrimination */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Feature Flag Evaluation Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distinguishes remote PostHog Cloud flags, local fallbacks, client offline, and disabled states.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Flag Key</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Evaluation State</th>
                <th className="py-3 px-3">Active Variant</th>
                <th className="py-3 px-4">Evaluation Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {flagEvaluations.map((flag) => {
                const configItem = TRACKED_FEATURE_FLAGS.find((f) => f.key === flag.key);
                return (
                  <tr key={flag.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {flag.key}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {configItem?.description || 'Feature flag'}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {flag.state === 'remote' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 size={11} className="text-emerald-500" />
                          <span>remote</span>
                        </span>
                      )}
                      {flag.state === 'local' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                          <AlertTriangle size={11} className="text-amber-500" />
                          <span>local</span>
                        </span>
                      )}
                      {flag.state === 'unavailable' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                          <ShieldAlert size={11} className="text-rose-500" />
                          <span>unavailable</span>
                        </span>
                      )}
                      {flag.state === 'disabled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                          <span>disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          flag.enabled
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {flag.source}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
