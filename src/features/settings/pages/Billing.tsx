import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { SearchInput } from '@/shared/components/SearchInput';
import { Select } from '@/shared/components/Select';
import { Pagination } from '@/shared/components/Pagination';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { useTableState } from '@/shared/hooks/useTableState';
import type { BillingRecord } from '@/shared/types';
import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable, ColumnConfig } from '@/shared/hooks/useAdvancedTable';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

const BILLING_COLUMNS: ColumnConfig[] = [
  { id: 'orderNumber', label: 'Order #' },
  { id: 'patientName', label: 'Patient' },
  { id: 'doctorName', label: 'Doctor & Clinic' },
  { id: 'invoiceNumber', label: 'Invoice #' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'dueDate', label: 'Due Date' },
  { id: 'actions', label: 'Actions' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Invoiced', label: 'Invoiced' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Cancelled', label: 'Cancelled' }
];

export default function Billing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const billingRecords = useStore((s) => s.getBilling());
  const records = billingRecords || [];

  const table = useAdvancedTable({
    data: records,
    columns: BILLING_COLUMNS,
    searchFields: ['orderNumber', 'patientName', 'doctorName', 'clinicName', 'invoiceNumber'],
    initialSortField: 'dueDate',
    initialSortDirection: 'desc',
    itemsPerPage: 12,
  });

  const paginatedRecords = table.paginatedData;

  // Metrics
  const totalValue = records.reduce((sum: number, r: BillingRecord) => sum + (r.amount || 0), 0);
  const collected = records.filter((r: BillingRecord) => r.status === 'Paid').reduce((sum: number, r: BillingRecord) => sum + (r.amount || 0), 0);
  const pending = records.filter((r: BillingRecord) => ['Pending', 'Invoiced'].includes(r.status)).reduce((sum: number, r: BillingRecord) => sum + (r.amount || 0), 0);
  const overdueCount = records.filter((r: BillingRecord) => r.status === 'Overdue').length;

  const handleUpdateStatus = (id: string, status: 'Paid' | 'Pending' | 'Invoiced' | 'Overdue') => {
    store.updateBillingStatus(id, status);
    setActionSuccess(`Invoice status updated to ${status}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleExport = () => {
    const headers = ['Order #', 'Patient', 'Doctor', 'Clinic', 'Invoice #', 'Amount', 'Status', 'Invoice Date', 'Due Date'];
    const csvContent = [
      headers.join(','),
      ...table.sortedData.map((r: BillingRecord) => 
        [
          `"${r.orderNumber}"`, 
          `"${r.patientName || ''}"`, 
          `"${r.doctorName || ''}"`, 
          `"${r.clinicName || ''}"`, 
          `"${r.invoiceNumber || ''}"`, 
          r.amount, 
          r.status, 
          r.invoiceDate || '', 
          r.dueDate || ''
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `billing_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Accounts receivable, payment tracking, and digital invoices
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon size={16} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-xs flex items-center gap-2 border border-green-200 dark:border-green-800 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Total Receivables</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</div>
          <div className="text-[11px] text-gray-400 mt-1">{records.length} total invoices</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Collected</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(collected)}</div>
          <div className="text-[11px] text-green-600 dark:text-green-400 mt-1 font-semibold">
            {records.length ? Math.round((collected / (totalValue || 1)) * 100) : 0}% collected
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(pending)}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Awaiting settlement</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Overdue Invoices</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueCount}</div>
          <div className="text-[11px] text-rose-500 mt-1 font-semibold">Requires follow-up</div>
        </div>
      </div>

      {/* Advanced Table Tools */}
      <TableTools
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search invoices, order #, patient, doctor, clinic..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: table.filters.status || 'all',
            onChange: (val) => table.setFilterValue('status', val),
            options: STATUS_OPTIONS,
          }
        ]}
        onResetFilters={table.resetAllFilters}
        activeFiltersCount={table.activeFiltersCount}
        columns={table.columnsList}
        onToggleColumn={table.toggleColumn}
        onSelectAllColumns={table.selectAllColumns}
        onResetColumns={table.resetColumns}
        totalItems={table.totalItems}
        filteredItems={table.filteredItems}
        extraActions={
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'cards' 
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon size={15} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        }
      />

      {/* Content: Cards View (Zero horizontal scroll) OR Table View */}
      {paginatedRecords.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No invoices found matching your filters</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* MODE 1: Responsive Cards View (No horizontal scrolling whatsoever!) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedRecords.map((r: BillingRecord) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span 
                    onClick={() => navigate(`/orders/${r.orderId}`)}
                    className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {r.orderNumber}
                  </span>
                  <StatusBadge status={r.status} />
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white mb-0.5">
                  {r.patientName || 'Patient'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {r.doctorName || 'Doctor'} • {r.clinicName || 'Clinic'}
                </p>

                <div className="mt-3 flex items-center justify-between text-xs font-mono bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Invoice:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{r.invoiceNumber || 'Pending'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Total Due</span>
                    <span className="font-bold text-base text-gray-900 dark:text-white">{formatCurrency(r.amount)}</span>
                  </div>
                  <div className="text-right text-[11px]">
                    <div className="text-gray-400">Due Date</div>
                    <div className={r.status === 'Overdue' ? 'text-rose-500 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                      {r.dueDate ? formatDate(r.dueDate) : '-'}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {r.status !== 'Paid' ? (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'Paid')}
                      className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors border border-green-200 dark:border-green-800"
                    >
                      ✓ Mark Paid
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'Pending')}
                      className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Revert to Pending
                    </button>
                  )}
                  {r.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'Invoiced')}
                      className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE 2: Responsive Table View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {table.isColVisible('orderNumber') && (
                  <SortTh field="orderNumber" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Order #</SortTh>
                )}
                {table.isColVisible('patientName') && (
                  <SortTh field="patientName" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Patient</SortTh>
                )}
                {table.isColVisible('doctorName') && (
                  <SortTh field="doctorName" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden md:table-cell">Doctor & Clinic</SortTh>
                )}
                {table.isColVisible('invoiceNumber') && (
                  <SortTh field="invoiceNumber" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden sm:table-cell">Invoice #</SortTh>
                )}
                {table.isColVisible('amount') && (
                  <SortTh field="amount" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} align="right">Amount</SortTh>
                )}
                {table.isColVisible('status') && (
                  <SortTh field="status" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Status</SortTh>
                )}
                {table.isColVisible('dueDate') && (
                  <SortTh field="dueDate" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden lg:table-cell">Due Date</SortTh>
                )}
                {table.isColVisible('actions') && (
                  <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {table.paginatedData.map((r: BillingRecord) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  {table.isColVisible('orderNumber') && (
                    <td 
                      className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      onClick={() => navigate(`/orders/${r.orderId}`)}
                    >
                      {r.orderNumber}
                    </td>
                  )}
                  {table.isColVisible('patientName') && (
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                      {r.patientName || 'Patient'}
                    </td>
                  )}
                  {table.isColVisible('doctorName') && (
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs">
                      <div className="text-gray-800 dark:text-gray-200">{r.doctorName}</div>
                      <div className="text-[10px] text-gray-400">{r.clinicName}</div>
                    </td>
                  )}
                  {table.isColVisible('invoiceNumber') && (
                    <td className="px-4 py-3.5 hidden sm:table-cell font-mono text-xs">
                      {r.invoiceNumber || '-'}
                    </td>
                  )}
                  {table.isColVisible('amount') && (
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(r.amount)}
                    </td>
                  )}
                  {table.isColVisible('status') && (
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                  )}
                  {table.isColVisible('dueDate') && (
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs">
                      {r.dueDate ? formatDate(r.dueDate) : '-'}
                    </td>
                  )}
                  {table.isColVisible('actions') && (
                    <td className="px-4 py-3.5 text-right">
                      {r.status !== 'Paid' ? (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Paid')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors border border-green-200 dark:border-green-800 cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Pending')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        >
                          Revert
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {table.filteredItems > table.pageSize && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
          <div>
            Showing {(table.currentPage - 1) * table.pageSize + 1} to {Math.min(table.currentPage * table.pageSize, table.filteredItems)} of {table.filteredItems} records
          </div>
          <Pagination 
            currentPage={table.currentPage} 
            totalPages={table.totalPages} 
            onPageChange={table.setCurrentPage} 
          />
        </div>
      )}
    </div>
  );
}
