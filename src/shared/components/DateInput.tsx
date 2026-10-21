import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { formatDate } from '@/shared/utils/format';
import { sound } from '@/shared/utils/sound';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  min,
  className = '',
}: DateInputProps) {
  const setQuickDate = (daysAhead: number) => {
    sound.playClick();
    const target = new Date(Date.now() + daysAhead * 86400000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  // Calculate remaining days
  const daysDiff = React.useMemo(() => {
    if (!value) return null;
    const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
    return diff;
  }, [value]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Date Field Container */}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-cyan-500 transition-colors pointer-events-none">
          <Calendar size={16} />
        </div>

        <input
          type="date"
          value={value}
          min={min}
          onChange={e => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 focus:border-cyan-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs"
        />

        {daysDiff !== null && (
          <span className={`absolute right-9 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none hidden sm:inline ${
            daysDiff <= 2 
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {daysDiff <= 0 ? 'Today' : `${daysDiff} days turnaround`}
          </span>
        )}
      </div>

      {/* Fast Presets Pills */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Presets:</span>
        <button
          type="button"
          onClick={() => setQuickDate(3)}
          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
        >
          ⚡ 3 Days (Rush)
        </button>
        <button
          type="button"
          onClick={() => setQuickDate(7)}
          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-colors cursor-pointer"
        >
          Standard (7d)
        </button>
        <button
          type="button"
          onClick={() => setQuickDate(14)}
          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          Extended (14d)
        </button>
      </div>
    </div>
  );
}
