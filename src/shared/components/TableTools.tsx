import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Columns3, 
  ChevronDown, 
  RotateCcw, 
  Filter,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';

export interface TableColumnOption {
  id: string;
  label: string;
  visible?: boolean;
}

export interface TableFilterSelect {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}

export interface TableToolsProps {
  // Pass whole table hook object OR individual props
  table?: any;
  rightActions?: React.ReactNode;

  // Search
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Filters
  filters?: TableFilterSelect[];
  onResetFilters?: () => void;
  activeFiltersCount?: number;

  // Columns visibility
  columns?: TableColumnOption[];
  onToggleColumn?: (colId: string) => void;
  onSelectAllColumns?: () => void;
  onResetColumns?: () => void;

  // Extra Actions (e.g. view toggle, export, create button)
  extraActions?: React.ReactNode;

  // Counts
  totalItems?: number;
  filteredItems?: number;
  className?: string;
}

export function TableTools(props: TableToolsProps) {
  const searchTerm = props.searchTerm ?? props.table?.searchTerm ?? '';
  const onSearchChange = props.onSearchChange ?? props.table?.setSearchTerm ?? (() => {});
  const searchPlaceholder = props.searchPlaceholder ?? 'Search records...';
  const filters = props.filters ?? props.table?.filterSelects ?? [];
  const onResetFilters = props.onResetFilters ?? props.table?.resetAllFilters;
  const activeFiltersCount = props.activeFiltersCount ?? props.table?.activeFiltersCount ?? 0;
  const columns = props.columns ?? props.table?.columnsList ?? [];
  const onToggleColumn = props.onToggleColumn ?? props.table?.toggleColumn ?? (() => {});
  const onSelectAllColumns = props.onSelectAllColumns ?? props.table?.selectAllColumns;
  const onResetColumns = props.onResetColumns ?? props.table?.resetColumns;
  const extraActions = props.rightActions ?? props.extraActions;
  const totalItems = props.totalItems ?? props.table?.totalItems;
  const filteredItems = props.filteredItems ?? props.table?.filteredItems;
  const className = props.className ?? '';

  const [showColumnsPopover, setShowColumnsPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowColumnsPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleCount = columns.filter((c: TableColumnOption) => c.visible !== false).length;
  const isFiltered = Boolean(searchTerm || activeFiltersCount > 0);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Main Toolbar Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between transition-all">
        
        {/* Left Side: Search + Advanced Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Live Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contextual Advanced Filter Dropdowns */}
          {filters.map((filter: TableFilterSelect) => (
            <div key={filter.id} className="relative min-w-[140px]">
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={`w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer ${
                  filter.value && filter.value !== 'all' && filter.value !== ''
                    ? 'border-sky-500/70 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700/80'
                }`}
              >
                {filter.options.map((opt: { value: string; label: string }) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}

          {/* Reset Filters Button */}
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer border border-rose-200/60 dark:border-rose-900/60"
              title="Reset all search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right Side: Column Selector + Extra Actions + Counter */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
          
          {/* Columns Visibility Dropdown */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setShowColumnsPopover(!showColumnsPopover)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                visibleCount < columns.length
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              title="Configure visible columns"
            >
              <Columns3 className="w-4 h-4 text-sky-500" />
              <span>Columns ({visibleCount}/{columns.length})</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showColumnsPopover ? 'rotate-180' : ''}`} />
            </button>

            {/* Popover Menu */}
            {showColumnsPopover && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Visible Columns
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    {onSelectAllColumns && (
                      <button
                        type="button"
                        onClick={onSelectAllColumns}
                        className="text-sky-600 dark:text-sky-400 hover:underline font-medium px-1 cursor-pointer"
                      >
                        All
                      </button>
                    )}
                    {onResetColumns && (
                      <button
                        type="button"
                        onClick={onResetColumns}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-1 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Column Checkboxes List */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {columns.map((col: TableColumnOption) => {
                    const isChecked = col.visible !== false;
                    return (
                      <label
                        key={col.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <span className="truncate pr-2 font-medium">{col.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleColumn(col.id)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Extra Actions Slot */}
          {extraActions}

          {/* Counter Pill */}
          {totalItems !== undefined && (
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredItems !== undefined && filteredItems !== totalItems ? (
                <>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">{filteredItems}</span>
                  <span>of</span>
                  <span>{totalItems}</span>
                </>
              ) : (
                <span>{totalItems} total</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable sortable <th> component with Ascending / Descending arrow indicators
 */
export function SortTh({
  field,
  label,
  children,
  sortField,
  currentSortField,
  sortOrder,
  sortDirection,
  onSort,
  className = '',
  align = 'left'
}: {
  field?: string;
  label?: React.ReactNode;
  children?: React.ReactNode;
  sortField?: string;
  currentSortField?: string;
  sortOrder?: 'asc' | 'desc';
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const activeSortField = sortField ?? currentSortField;
  const activeSortDirection = sortOrder ?? sortDirection ?? 'asc';
  const content = label ?? children;
  const isSorted = Boolean(field && activeSortField === field);
  const alignClass = align === 'center' ? 'text-center justify-center' : align === 'right' ? 'text-right justify-end' : 'text-left justify-start';

  if (!field || !onSort) {
    return (
      <th className={`px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
        {content}
      </th>
    );
  }

  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none transition-colors group hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${
        isSorted ? 'bg-sky-50/60 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300' : ''
      } ${className}`}
      title={`Click to sort by ${typeof content === 'string' ? content : field} (Ascending / Descending)`}
    >
      <div className={`inline-flex items-center gap-1.5 ${alignClass} w-full`}>
        <span>{content}</span>
        <span className="inline-flex shrink-0">
          {isSorted ? (
            activeSortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-in fade-in" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-in fade-in" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </div>
    </th>
  );
}
