import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  emptyState?: ReactNode;
}

export function DataTable<T>({ columns, data, sortField, sortDirection, onSort, onRowClick, rowKey, emptyState }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-xs font-semibold text-[var(--color-foreground-muted)] uppercase tracking-wider whitespace-nowrap
                  ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--color-foreground)] transition-colors' : ''}
                  ${col.className || ''}`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    sortField === col.key
                      ? sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      : <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length}>{emptyState}</td></tr>
            ) : (
              data.map((item, idx) => (
                <motion.tr
                  key={rowKey(item)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.02 }}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-[var(--color-border)] last:border-0 transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-card-hover)]' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render(item, idx)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
