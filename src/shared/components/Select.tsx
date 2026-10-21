import React, { useState, useRef, useEffect, type ReactNode, type ChangeEvent } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { sound } from '@/shared/utils/sound';

export interface SelectOption {
  label: string;
  value: string;
  icon?: ReactNode;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}

interface SelectProps {
  value: string;
  onChange: ((value: string) => void) | ((e: ChangeEvent<HTMLSelectElement>) => void) | any;
  options?: (SelectOption | string)[];
  placeholder?: string;
  className?: string;
  children?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  searchable?: boolean;
}

export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  children,
  icon,
  disabled = false,
  searchable = false, // Instant natural display by default without extra search bar clutter
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options array and remove empty placeholder dummy values if any
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    let raw: SelectOption[] = [];
    if (options && options.length > 0) {
      raw = options.map(opt => {
        if (typeof opt === 'string') {
          return { label: opt, value: opt };
        }
        return opt;
      });
    } else if (children) {
      React.Children.forEach(children, child => {
        if (React.isValidElement<{ children?: any; value?: any }>(child) && child.type === 'option') {
          raw.push({
            label: String(child.props.children || child.props.value),
            value: String(child.props.value),
          });
        }
      });
    }

    // Filter out dummy empty option if it just matches "Select..." placeholder
    return raw.filter(o => o.value !== '' || !o.label.toLowerCase().includes('select'));
  }, [options, children]);

  // Find currently selected option
  const selectedOption = normalizedOptions.find(o => o.value === value);

  // Filter options based on search query (if searchable)
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      opt => opt.label.toLowerCase().includes(q) || (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    sound.playClick();
    if (typeof onChange === 'function') {
      try {
        onChange(val);
      } catch {
        onChange({ target: { value: val } } as any);
      }
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button - Instant responsive feel */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            sound.playPop();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full h-11 px-3.5 text-left rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer shadow-2xs group transition-colors duration-100 ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : isOpen
              ? 'border-cyan-500 ring-4 ring-cyan-500/15 bg-white dark:bg-slate-900 shadow-md'
              : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Leading Icon */}
          {icon && (
            <span className="text-slate-400 group-hover:text-cyan-500 transition-colors shrink-0">
              {icon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}

          {/* Text Value */}
          <div className="min-w-0 flex-1">
            {selectedOption ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedOption.badgeColor || 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'}`}>
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        {/* Chevron Indicator */}
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180 text-cyan-500' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
          }`}
        />
      </button>

      {/* Floating Popover Dropdown - Instant render without sluggish animations or clipping */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-[100] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Input Bar (only if explicitly enabled) */}
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-2">
              <Search size={14} className="text-slate-400 ml-1.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type to filter..."
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Options List - Generous height so all options appear naturally */}
          <div className="max-h-80 overflow-y-auto p-1.5 space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-sm">{opt.label}</div>
                        {opt.subtitle && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-normal mt-0.5">
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${opt.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
