import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, currentPage, totalPages, totalCount, pageSize = 10, onPageChange }: PaginationProps) {
  const activePage = page ?? currentPage ?? 1;
  const count = totalCount ?? (totalPages * pageSize);
  const start = (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, count);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border)]">
      <span className="text-xs text-[var(--color-foreground-muted)] text-center sm:text-left">
        Showing {start}–{end} of {count}
      </span>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="p-1.5 rounded-md hover:bg-[var(--color-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) pageNum = i + 1;
          else if (activePage <= 3) pageNum = i + 1;
          else if (activePage >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = activePage - 2 + i;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 text-xs rounded-md font-medium transition-colors
                ${activePage === pageNum 
                  ? 'bg-[var(--color-primary)] text-white' 
                  : 'hover:bg-[var(--color-muted)] text-[var(--color-foreground-muted)]'}`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="p-1.5 rounded-md hover:bg-[var(--color-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
