import { useState, useMemo, useCallback } from 'react';

interface TableConfig<T> {
  data?: T[];
  searchFields?: (keyof T | string)[];
  defaultSort?: { field: keyof T | string; direction: 'asc' | 'desc' };
  defaultPageSize?: number;
  itemsPerPage?: number;
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
  filterField?: string;
}

export function useTableState<T = any>(config?: TableConfig<T>) {
  const data = (config?.data ?? []) as any[];
  const searchFields = config?.searchFields ?? [];
  const defaultSortField = config?.defaultSort?.field ?? config?.initialSortField ?? '';
  const defaultSortDir = config?.defaultSort?.direction ?? config?.initialSortDirection ?? 'asc';
  const defaultPageSize = config?.defaultPageSize ?? config?.itemsPerPage ?? 10;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortField, setSortField] = useState<string>(defaultSortField as string);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => String(item[field]).toLowerCase().includes(q))
      );
    }
    if (statusFilter && statusFilter !== 'all') {
      const field = config?.filterField || 'status';
      result = result.filter(item => item[field] === statusFilter);
    }
    return result;
  }, [data, search, statusFilter, searchFields, config?.filterField]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField]; const bVal = b[sortField];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDirection]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  }, [sortField]);

  return {
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    searchQuery: search, setSearchQuery: (v: string) => { setSearch(v); setPage(1); },
    searchTerm: search, setSearchTerm: (v: string) => { setSearch(v); setPage(1); },
    statusFilter, setStatusFilter: (v: string) => { setStatusFilter(v); setPage(1); },
    filterValue: statusFilter, setFilterValue: (v: string) => { setStatusFilter(v); setPage(1); },
    sortField, sortDirection, handleSort,
    page, setPage, pageSize, setPageSize, totalPages,
    currentPage: page, setCurrentPage: setPage, pageChange: setPage,
    filtered, sorted, paginated, paginatedData: paginated, items: paginated,
    totalCount: sorted.length, totalItems: sorted.length,
  };
}
