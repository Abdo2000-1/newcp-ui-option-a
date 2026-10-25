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
  Receipt,
  Building2,
  User,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { Button } from '@/shared/components/Button';
import { SearchInput } from '@/shared/components/SearchInput';
import { Select } from '@/shared/components/Select';
import { Pagination } from '@/shared/components/Pagination';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import type { BillingRecord } from '@/shared/types';
import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable, ColumnConfig } from '@/shared/hooks/useAdvancedTable';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

const BILLING_COLUMNS: ColumnConfig[] = [
  { id: 'orderNumber', label: 'Order #' },
  { id: 'billingAccount', label: 'Billing Account (Payer)' },
  { id: 'patientName', label: 'Patient (Subject)' },
  { id: 'isBillable', label: 'Billable' },
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

const BILLABLE_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'billable', label: 'Billable Only' },
  { value: 'non-billable', label: 'Non-Billable' }
];

export const getBillingAccountDisplayName = (r: BillingRecord): string => {
  if (r.billingAccountName && r.billingAccountName.trim()) {
    return r.billingAccountName;
  }
  if (r.clinicName && r.clinicName.trim()) {
    return r.clinicName;
  }
  if (r.doctorName && r.doctorName.trim()) {
    return `${r.doctorName} (Doctor Account)`;
  }
  return 'Client Billing Account';
};

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
    searchFields: ['orderNumber', 'patientName', 'doctorName', 'clinicName', 'invoiceNumber', 'billingAccountName'],
    initialSortField: 'dueDate',
    initialSortDirection: 'desc',
    itemsPerPage: 12,
  });

  // Apply custom billable filter if selected
  const activeBillableFilter = table.filters.billable || 'all';
  const filteredData = table.sortedData.filter((r: BillingRecord) => {
    const isItemBillable = r.isBillable !== false;
    if (activeBillableFilter === 'billable') return isItemBillable;
    if (activeBillableFilter === 'non-billable') return !isItemBillable;
    return true;
  });

  const startIndex = (table.currentPage - 1) * table.pageSize;
  const paginatedRecords = filteredData.slice(startIndex, startIndex + table.pageSize);
  const totalFilteredCount = filteredData.length;

  // Metrics
  const totalValue = records.reduce((sum: number, r: BillingRecord) => sum + (r.amount || 0), 0);
  const collected = records.filter((r: BillingRecord) => r.status === 'Paid').reduce((sum: number, r: BillingRecord) => sum + (r.amount || 0), 0);
  const pending = records.filter((r: BillingRecord) => ['Pending', 'Invoiced'].includes(r.status)).reduce((sum: number, r: BillingRecord) => sum + (r.amount || 0), 0);
  const overdueCount = records.filter((r: BillingRecord) => r.status === 'Overdue').length;

  const handleUpdateStatus = (id: string, status: 'Paid' | 'Pending' | 'Invoiced' | 'Overdue') => {
    store.updateBillingStatus(id, status);
    setActionSuccess(`Invoice ${id} status updated to ${status} in local prototype store.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleExport = () => {
    const headers = [
      'Order #',
      'Billing Account (Payer)',
      'Clinic',
      'Doctor',
      'Patient (Clinical Subject)',
      'Billable',
      'Invoice #',
      'Amount',
      'Status',
      'Invoice Date',
      'Due Date'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map((r: BillingRecord) =>
        [
          `"${r.orderNumber}"`,
          `"${getBillingAccountDisplayName(r)}"`,
          `"${r.clinicName || ''}"`,
          `"${r.doctorName || ''}"`,
          `"${r.patientName || ''}"`,
          r.isBillable !== false ? 'Yes' : 'No',
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
    link.setAttribute('download', `billing_domain_aligned_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full min-w-0" data-testid="billing-page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing &amp; Invoices</h1>
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
              aria-label="Card Grid View"
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
              aria-label="Table View"
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

      {/* Mandatory Business Domain Safety Banner */}
      <Alert
        severity="info"
        variant="outlined"
        icon={<Info className="w-5 h-5 text-sky-600" />}
        sx={{
          borderRadius: 2,
          borderColor: 'info.main',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(2, 136, 209, 0.08)' : 'rgba(2, 136, 209, 0.04)'
        }}
        data-testid="billing-domain-alert"
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
          [MOCK / NOT_INTEGRATED] Billing Account &amp; Patient Domain Alignment
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.5 }}>
          In accordance with 3DDX Business Domain Guidelines (Sections 8 &amp; 13.9), the billing debtor is strictly the ordering <strong>Client Account (Clinic / Doctor / Scan Center)</strong>, distinct from the case <strong>Patient</strong> (clinical subject). Service-level Bill To (F07 V204) and real ERP accounting synchronization remain unintegrated mock boundaries in this prototype. The billable flag (<code>isBillable</code>) is evaluated independently from payer assignment.
        </Typography>
      </Alert>

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
          <div className="text-[11px] text-gray-400 mt-1">{records.length} total client invoices</div>
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
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Awaiting client settlement</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Overdue Invoices</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueCount}</div>
          <div className="text-[11px] text-rose-500 mt-1 font-semibold">Client follow-up required</div>
        </div>
      </div>

      {/* Advanced Table Tools */}
      <TableTools
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search client account, clinic, doctor, patient, order #, invoice #..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: table.filters.status || 'all',
            onChange: (val) => table.setFilterValue('status', val),
            options: STATUS_OPTIONS,
          },
          {
            id: 'billable',
            label: 'Billable',
            value: table.filters.billable || 'all',
            onChange: (val) => table.setFilterValue('billable', val),
            options: BILLABLE_OPTIONS,
          }
        ]}
        onResetFilters={table.resetAllFilters}
        activeFiltersCount={table.activeFiltersCount}
        columns={table.columnsList}
        onToggleColumn={table.toggleColumn}
        onSelectAllColumns={table.selectAllColumns}
        onResetColumns={table.resetColumns}
        totalItems={table.totalItems}
        filteredItems={totalFilteredCount}
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
        /* MODE 1: Responsive Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="billing-cards-view">
          {paginatedRecords.map((r: BillingRecord) => {
            const billingAccount = getBillingAccountDisplayName(r);
            const isItemBillable = r.isBillable !== false;

            return (
              <div
                key={r.id}
                data-testid={`billing-card-${r.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <span
                      onClick={() => navigate(`/orders/${r.orderId}`)}
                      className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      title="View order details"
                    >
                      {r.orderNumber}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>

                  {/* Primary Debtor: Billing Account / Client */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Billing Account (Client)</span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mt-0.5">
                      {billingAccount}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {r.doctorName || 'Doctor'} • {r.clinicName || 'Clinic'}
                    </p>
                  </div>

                  {/* Clinical Subject: Patient (Explicitly Decoupled from Debtor) */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium">Patient:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{r.patientName || 'Anonymous Patient'}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        Case Subject
                      </span>
                    </div>
                  </div>

                  {/* Invoice Details & Billable Indicator */}
                  <div className="flex items-center justify-between text-xs font-mono bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-gray-400 font-sans">Invoice #</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{r.invoiceNumber || 'Pending'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-gray-400 font-sans block">Billable</span>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-sans font-bold rounded ${
                        isItemBillable
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {isItemBillable ? 'Yes' : 'No'}
                      </span>
                    </div>
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
                        className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors border border-green-200 dark:border-green-800 cursor-pointer"
                      >
                        ✓ Mark Paid
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'Pending')}
                        className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        Revert to Pending
                      </button>
                    )}
                    {r.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'Invoiced')}
                        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                      >
                        Invoice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE 2: Responsive Table View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" data-testid="billing-table-view">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs text-gray-500 dark:text-gray-400">
              <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {table.isColVisible('orderNumber') && (
                    <SortTh field="orderNumber" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Order #</SortTh>
                  )}
                  {table.isColVisible('billingAccount') && (
                    <SortTh field="billingAccountName" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Billing Account (Payer)</SortTh>
                  )}
                  {table.isColVisible('patientName') && (
                    <SortTh field="patientName" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Patient (Subject)</SortTh>
                  )}
                  {table.isColVisible('isBillable') && (
                    <th className="px-4 py-3.5 font-semibold text-center">Billable</th>
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
                {paginatedRecords.map((r: BillingRecord) => {
                  const billingAccount = getBillingAccountDisplayName(r);
                  const isItemBillable = r.isBillable !== false;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" data-testid={`billing-row-${r.id}`}>
                      {table.isColVisible('orderNumber') && (
                        <td
                          className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          onClick={() => navigate(`/orders/${r.orderId}`)}
                        >
                          {r.orderNumber}
                        </td>
                      )}
                      {table.isColVisible('billingAccount') && (
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{billingAccount}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {r.doctorName && <span>Dr. {r.doctorName.replace(/^Dr\.\s*/i, '')} • </span>}
                            <span>Client Account</span>
                          </div>
                        </td>
                      )}
                      {table.isColVisible('patientName') && (
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{r.patientName || 'Anonymous'}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Clinical Subject
                          </div>
                        </td>
                      )}
                      {table.isColVisible('isBillable') && (
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                            isItemBillable
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {isItemBillable ? 'Yes' : 'No'}
                          </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalFilteredCount > table.pageSize && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
          <div>
            Showing {(table.currentPage - 1) * table.pageSize + 1} to {Math.min(table.currentPage * table.pageSize, totalFilteredCount)} of {totalFilteredCount} records
          </div>
          <Pagination
            currentPage={table.currentPage}
            totalPages={Math.ceil(totalFilteredCount / table.pageSize)}
            onPageChange={table.setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
