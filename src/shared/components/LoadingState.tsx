import React from 'react';
import { LogoLoadingState } from './LogoLoadingState';

interface LoadingStateProps {
  message?: string;
  text?: string;
  subtitle?: string;
  fullHeight?: boolean;
  rowCount?: number;
  showRows?: boolean;
}

export function LoadingState({
  message,
  text = 'CP PRO MAX Loading...',
  subtitle,
  fullHeight = false,
  rowCount = 3,
  showRows = false,
}: LoadingStateProps) {
  const displayMsg = message || text;
  const rows = Array.from({ length: rowCount });

  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-3 select-none ${
        fullHeight ? 'min-h-[400px]' : ''
      }`}
    >
      {/* Compact Authentic 3D Diagnostix Logo Motion Graphic Animation */}
      <LogoLoadingState
        text={displayMsg}
        subtitle={subtitle}
      />

      {/* Shimmer Skeleton Rows (Only if explicitly requested) */}
      {showRows && (
        <div className="w-full max-w-2xl space-y-2 mt-3 opacity-75">
          {rows.map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800/50 rounded" />
              <div className="w-14 h-4 rounded bg-sky-500/10" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
