import React, { useState, useMemo, type ReactNode } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import { Search, X, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  className?: string;
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onRowClick?: (item: T) => void;
  rowKey: (item: T, index?: number) => string;
  emptyState?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  rowsPerPageOptions?: number[];
  initialRowsPerPage?: number;
  dense?: boolean;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  ariaLabel?: string;
}

export function DataTable<T>({
  columns,
  data,
  sortField: controlledSortField,
  sortDirection: controlledSortDirection,
  onSort: controlledOnSort,
  onRowClick,
  rowKey,
  emptyState,
  searchable = false,
  searchPlaceholder = 'Search table records...',
  searchFilter,
  searchQuery: controlledSearchQuery,
  onSearchChange,
  rowsPerPageOptions,
  initialRowsPerPage,
  dense = false,
  title,
  subtitle,
  actions,
  ariaLabel = 'Data table',
}: DataTableProps<T>) {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === 'dark';

  // Internal search state if uncontrolled
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const query = controlledSearchQuery !== undefined ? controlledSearchQuery : internalSearchQuery;

  const handleQueryChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  // Internal sort state if uncontrolled
  const [internalSortField, setInternalSortField] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  const currentSortField = controlledSortField !== undefined ? controlledSortField : internalSortField;
  const currentSortDirection = controlledSortDirection !== undefined ? controlledSortDirection : internalSortDirection;

  const handleSort = (fieldKey: string) => {
    if (controlledOnSort) {
      controlledOnSort(fieldKey);
    } else {
      if (internalSortField === fieldKey) {
        setInternalSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setInternalSortField(fieldKey);
        setInternalSortDirection('asc');
      }
    }
  };

  // Pagination state
  const isPaginated = Boolean(rowsPerPageOptions || initialRowsPerPage);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage || 10);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!query.trim()) return data;
    const lower = query.trim().toLowerCase();

    if (searchFilter) {
      return data.filter((item) => searchFilter(item, lower));
    }

    // Default search across all primitive fields
    return data.filter((item: any) => {
      return Object.values(item).some((v) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string' || typeof v === 'number') {
          return String(v).toLowerCase().includes(lower);
        }
        return false;
      });
    });
  }, [data, query, searchFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!currentSortField || controlledOnSort) {
      return filteredData;
    }

    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[currentSortField];
      const bVal = b[currentSortField];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let result = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }

      return currentSortDirection === 'desc' ? -result : result;
    });
  }, [filteredData, currentSortField, currentSortDirection, controlledOnSort]);

  // Paginate data
  const displayedData = useMemo(() => {
    if (!isPaginated) return sortedData;
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, isPaginated, page, rowsPerPage]);

  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 2.5,
        border: `1px solid ${borderColor}`,
        bgcolor: isDark ? alpha('#0b101d', 0.8) : '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Header & Controls Toolbar */}
      {(title || subtitle || searchable || actions) && (
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            borderBottom: `1px solid ${borderColor}`,
            bgcolor: isDark ? alpha('#000000', 0.15) : alpha('#000000', 0.015),
          }}
        >
          {/* Title and subtitle */}
          {(title || subtitle) && (
            <Box>
              {title && (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography sx={{ fontSize: '0.6875rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          )}

          {/* Search and Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: title ? undefined : 1 }}>
            {searchable && (
              <TextField
                size="small"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={searchPlaceholder}
                slotProps={{
                  htmlInput: {
                    'aria-label': searchPlaceholder,
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                      </InputAdornment>
                    ),
                    endAdornment: query ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => handleQueryChange('')}
                          aria-label="Clear table search"
                          sx={{ p: 0.25 }}
                        >
                          <X size={12} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 220 },
                  flex: title ? undefined : 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#ffffff', 0.9),
                    '& fieldset': { borderColor: borderColor },
                    '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#0284c7' },
                  },
                }}
              />
            )}

            {actions}
          </Box>
        </Box>
      )}

      {/* Responsive Table Container */}
      <TableContainer sx={{ maxHeight: 520, overflowX: 'auto' }}>
        <Table stickyHeader={Boolean(title)} size={dense ? 'small' : 'medium'} aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                const isSorted = currentSortField === col.key;
                const align = col.align || 'left';

                return (
                  <TableCell
                    key={col.key}
                    align={align}
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      py: 1.5,
                      px: 2,
                      width: col.width,
                      color: isDark ? '#cbd5e1' : '#475569',
                      bgcolor: isDark ? '#080d1a' : '#f8fafc',
                      borderBottom: `1px solid ${borderColor}`,
                      whiteSpace: 'nowrap',
                    }}
                    sortDirection={isSorted ? currentSortDirection : false}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={isSorted}
                        direction={isSorted ? currentSortDirection : 'asc'}
                        onClick={() => handleSort(col.key)}
                        IconComponent={ArrowUpDown}
                        sx={{
                          '&.Mui-active': {
                            color: isDark ? '#38bdf8' : '#0284c7',
                          },
                          '& .MuiTableSortLabel-icon': {
                            width: 12,
                            height: 12,
                            ml: 0.5,
                            opacity: isSorted ? 1 : 0.4,
                          },
                        }}
                      >
                        {col.header}
                      </TableSortLabel>
                    ) : (
                      col.header
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {displayedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{
                    py: 5,
                    borderBottom: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '0.8125rem',
                  }}
                >
                  {emptyState || (
                    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                        {query ? 'No matching records found' : 'No table records available'}
                      </Typography>
                      {query && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          Try adjusting your search query.
                        </Typography>
                      )}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              displayedData.map((item, index) => {
                const key = rowKey(item, index);
                return (
                  <TableRow
                    key={key}
                    hover={Boolean(onRowClick)}
                    onClick={() => onRowClick?.(item)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#0284c7', 0.03),
                      },
                      '&:last-child td, &:last-child th': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    {columns.map((col) => {
                      const align = col.align || 'left';
                      const cellContent = col.render ? col.render(item, index) : (item as any)[col.key];

                      return (
                        <TableCell
                          key={col.key}
                          align={align}
                          sx={{
                            fontSize: '0.75rem',
                            py: dense ? 1 : 1.5,
                            px: 2,
                            borderBottom: `1px solid ${borderColor}`,
                            color: isDark ? '#f1f5f9' : '#1e293b',
                          }}
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer */}
      {isPaginated && sortedData.length > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions || [5, 10, 25]}
          component="div"
          count={sortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: `1px solid ${borderColor}`,
            fontSize: '0.75rem',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
        />
      )}
    </Paper>
  );
}
