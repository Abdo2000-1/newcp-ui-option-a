import { useState, useMemo, useCallback } from 'react';
import { TableColumnOption, TableFilterSelect } from '@/shared/components/TableTools';

export interface ColumnConfig {
  id: string;
  label: string;
  defaultVisible?: boolean;
}

export interface TableFilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  icon?: React.ReactNode;
}

export interface UseAdvancedTableOptions<T> {
  data: T[];
  columns: ColumnConfig[];
  searchFields?: (keyof T | string)[];
  filterConfigs?: TableFilterConfig[];
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
  itemsPerPage?: number;
  pageSize?: number;
}

export function useAdvancedTable<T = any>({
  data = [],
  columns: initialColumns,
  searchFields = [],
  filterConfigs = [],
  initialSortField = '',
  initialSortDirection = 'asc',
  itemsPerPage = 10,
  pageSize: optPageSize,
}: UseAdvancedTableOptions<T>) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<string>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(optPageSize || itemsPerPage);

  // Custom filters state (key-value dictionary: e.g. { status: 'all', priority: 'all' })
  const [filters, setFilters] = useState<Record<string, string>>({});

  const setFilterValue = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Column Visibility state
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialColumns.forEach(c => {
      map[c.id] = c.defaultVisible !== false;
    });
    return map;
  });

  const toggleColumn = useCallback((colId: string) => {
    setVisibleMap(prev => {
      const next = { ...prev, [colId]: !prev[colId] };
      // Ensure at least 1 column is visible
      const count = Object.values(next).filter(Boolean).length;
      if (count === 0) return prev;
      return next;
    });
  }, []);

  const selectAllColumns = useCallback(() => {
    const next: Record<string, boolean> = {};
    initialColumns.forEach(c => { next[c.id] = true; });
    setVisibleMap(next);
  }, [initialColumns]);

  const resetColumns = useCallback(() => {
    const next: Record<string, boolean> = {};
    initialColumns.forEach(c => { next[c.id] = c.defaultVisible !== false; });
    setVisibleMap(next);
  }, [initialColumns]);

  const isColVisible = useCallback((colId: string) => {
    return visibleMap[colId] !== false;
  }, [visibleMap]);

  const columnsList: TableColumnOption[] = useMemo(() => {
    return initialColumns.map(c => ({
      id: c.id,
      label: c.label,
      visible: visibleMap[c.id] !== false,
    }));
  }, [initialColumns, visibleMap]);

  // Handle Sort Toggle
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortField]);

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(item => {
        if (!item) return false;
        if (searchFields.length > 0) {
          return searchFields.some(f => {
            const val = (item as any)[f];
            if (val === undefined || val === null) return false;
            return String(val).toLowerCase().includes(q);
          });
        }
        // Fallback: search all values
        return Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        );
      });
    }

    // Dynamic key-value filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== 'all' && val !== '') {
        result = result.filter(item => {
          const itemVal = (item as any)[key];
          return String(itemVal).toLowerCase() === val.toLowerCase();
        });
      }
    });

    return result;
  }, [data, searchTerm, searchFields, filters]);

  // Sorted Data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    const resolveValue = (item: any, path: string) => {
      if (!item) return '';
      if (item[path] !== undefined && item[path] !== null) return item[path];
      // Check dotted path
      if (path.includes('.')) {
        const parts = path.split('.');
        let current = item;
        for (const p of parts) {
          if (current === undefined || current === null) return '';
          current = current[p];
        }
        return current ?? '';
      }
      return '';
    };

    return [...filteredData].sort((a: any, b: any) => {
      let aVal = resolveValue(a, sortField);
      let bVal = resolveValue(b, sortField);

      // Handle undefined/null/empty
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null || aVal === '') return 1;
      if (bVal === undefined || bVal === null || bVal === '') return -1;

      // Clean currency or numeric strings like "$400.00" -> 400
      let cleanA = typeof aVal === 'string' ? aVal.replace(/[$,]/g, '').trim() : aVal;
      let cleanB = typeof bVal === 'string' ? bVal.replace(/[$,]/g, '').trim() : bVal;

      // Numeric comparison
      const aNum = Number(cleanA);
      const bNum = Number(cleanB);
      if (!isNaN(aNum) && !isNaN(bNum) && typeof aVal !== 'boolean' && typeof bVal !== 'boolean') {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Date comparison
      const aDate = Date.parse(String(aVal));
      const bDate = Date.parse(String(bVal));
      if (!isNaN(aDate) && !isNaN(bDate) && String(aVal).length > 6) {
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // String comparison
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginated Data
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v && v !== 'all' && v !== '').length;
  }, [filters]);

  const filterSelects: TableFilterSelect[] = useMemo(() => {
    return (filterConfigs || []).map(cfg => ({
      id: cfg.key,
      label: cfg.label,
      value: filters[cfg.key] || cfg.defaultValue || 'all',
      onChange: (val: string) => setFilterValue(cfg.key, val),
      options: cfg.options,
      icon: cfg.icon,
    }));
  }, [filterConfigs, filters, setFilterValue]);

  return {
    // Search
    searchTerm,
    setSearchTerm: (v: string) => { setSearchTerm(v); setCurrentPage(1); },
    
    // Filters
    filters,
    setFilterValue,
    resetAllFilters,
    activeFiltersCount,
    filterSelects,

    // Columns
    columnsList,
    toggleColumn,
    selectAllColumns,
    resetColumns,
    isColVisible,

    // Sorting
    sortField,
    sortDirection,
    sortOrder: sortDirection,
    handleSort,

    // Pagination
    currentPage,
    setCurrentPage,
    page: currentPage,
    setPage: setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,

    // Data outputs
    totalItems: data.length,
    filteredItems: sortedData.length,
    paginatedData,
    sortedData,
  };
}
