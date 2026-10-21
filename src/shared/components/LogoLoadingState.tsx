import React from 'react';
import { motion } from 'framer-motion';

interface LogoLoadingProps {
  text?: string;
  subtitle?: string;
  fullScreen?: boolean;
}

export function LogoLoadingState({
  text = 'CP PRO MAX Loading...',
  subtitle,
  fullScreen = false,
}: LogoLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 select-none ${
        fullScreen ? 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm' : 'w-full py-8'
      }`}
    >
      <div className="flex flex-col items-center max-w-xs w-full">
        
        {/* Compact Logo Badge with Laser Sweep */}
        <div className="relative flex items-center justify-center px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden mb-3">
          
          {/* Laser scanning beam */}
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#f97316] to-transparent shadow-[0_0_10px_#f97316] pointer-events-none"
            animate={{ left: ['-10%', '110%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* 3D Diagnostix Logo */}
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-2xl font-black tracking-tight text-[#0284c7]">
              3D
            </span>
            <div className="w-0.5 h-6 bg-[#0284c7] rounded-full" />
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-normal text-[#ea580c]">
                Diagnostix
              </span>
              <span className="text-[10px] font-bold text-slate-500">.COM</span>
            </div>
          </div>
        </div>

        {/* Small Sleek Progress Bar */}
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative mb-2.5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0284c7] via-[#f97316] to-[#0284c7] rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </div>

        {/* Clean, Short Title Only (No Cluttered Telemetry Dots) */}
        <span className="text-xs font-black text-slate-900 dark:text-white tracking-wide text-center">
          {text}
        </span>
        {subtitle && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 text-center">
            {subtitle}
          </span>
        )}

      </div>
    </div>
  );
}
