import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Sparkles, PlusCircle } from 'lucide-react';
import { sound } from '@/shared/utils/sound';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  suggestion?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  secondaryAction,
  suggestion 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center select-none"
    >
      {/* Visual Graphic with Illuminated Backdrop */}
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-blue-500/10 dark:bg-cyan-500/15 rounded-3xl blur-2xl transform scale-150 pointer-events-none" />
        
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-300/80 dark:border-slate-700/80 flex items-center justify-center shadow-lg shadow-slate-900/5 text-cyan-600 dark:text-cyan-400">
          {icon || <Inbox className="w-10 h-10 opacity-80 stroke-[1.5]" />}
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Main Copy */}
      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
        {suggestion && (
          <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 pt-1">
            Tip: {suggestion}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
