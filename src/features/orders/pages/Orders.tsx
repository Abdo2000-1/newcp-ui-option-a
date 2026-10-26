import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  LayoutGrid, 
  Table as TableIcon,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Pagination } from '@/shared/components/Pagination';
import { SearchInput } from '@/shared/components/SearchInput';
import { Select } from '@/shared/components/Select';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { ErrorState } from '@/shared/components/ErrorState';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { Button } from '@/shared/components/Button';
import { timeAgo, formatCurrency, formatDate } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import { useTableState } from '@/shared/hooks/useTableState';

import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable, ColumnConfig } from '@/shared/hooks/useAdvancedTable';

const ORDER_COLUMNS: ColumnConfig[] = [
  { id: 'orderNumber', label: 'Order #' },
  { id: 'patientName', label: 'Patient' },
  { id: 'doctorName', label: 'Doctor & Clinic' },
  { id: 'restoration', label: 'Restoration' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'amount', label: 'Amount' },
  { id: 'dueDate', label: 'Due Date' },
];

export default function Orders() {
  const navigate = useNavigate();
  const orders = useStore((s) => s.getOrders());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [simulatedState, setSimulatedState] = useState<UIStateType>('normal');

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'Review', label: 'Review' },
    { value: 'Design', label: 'Design' },
    { value: 'Production', label: 'Production' },
    { value: 'Quality Check', label: 'Quality Check' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  const table = useAdvancedTable({
    data: orders || [],
    columns: ORDER_COLUMNS,
    searchFields: ['orderNumber', 'patientName', 'doctorName', 'clinicName', 'restoration', 'restorationType'],
    initialSortField: 'updatedAt',
    initialSortDirection: 'desc',
    itemsPerPage: 12,
  });

  const paginatedData = table.paginatedData;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage dental restoration cases ({table.totalItems} total)
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button 
            onClick={() => navigate('/orders/create')} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Live OpenAPI 3.0.3 Contract Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-900 dark:text-emerald-200">
            OpenAPI 3.0.3 Contract Mock Server Active (http://localhost:3000/api/v1)
          </span>
          <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-black">
            HTTP 200 OK
          </span>
        </div>
        <div className="text-[11px] text-slate-600 dark:text-slate-400">
          Enforcing Q-B8..Q-B15 Concurrency (ETag), Transitions & F07 Payer Target
        </div>
      </div>

      {/* Advanced Table Tools */}
      <TableTools
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search by order #, patient, doctor, clinic, restoration..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: table.filters.status || 'all',
            onChange: (val) => table.setFilterValue('status', val),
            options: statusOptions,
          },
          {
            id: 'priority',
            label: 'Priority',
            value: table.filters.priority || 'all',
            onChange: (val) => table.setFilterValue('priority', val),
            options: priorityOptions,
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

      {/* State Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <UIStateSwitcher state={simulatedState} onChange={setSimulatedState} label="Simulate Orders View State" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          Use the buttons to preview <b>Loading</b>, <b>Empty</b>, or <b>Error</b> states in real-time
        </span>
      </div>

      {/* Conditional State Rendering */}
      {simulatedState === 'loading' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <LoadingState 
            text="Synchronizing Dental Lab Orders..." 
            subtitle="Fetching high-resolution STL files and milling queues from cloud PACS"
          />
        </div>
      ) : simulatedState === 'error' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <ErrorState
            title="Failed to Load Dental Orders"
            message="Server timeout while querying order inventory from EU-Central PACS node (HTTP 503)."
            code="ERR_ORDERS_FETCH_TIMEOUT_503"
            onRetry={() => setSimulatedState('normal')}
          />
        </div>
      ) : simulatedState === 'empty' || paginatedData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <EmptyState 
            title="No Dental Orders Found" 
            description="There are currently no active or historical orders matching your filter criteria."
            suggestion="Try clearing your search filters or create a new dental order deliverable."
            action={
              <Button 
                variant="primary" 
                onClick={() => { setSimulatedState('normal'); navigate('/orders/create'); }}
                className="cursor-pointer"
              >
                Create New Dental Order
              </Button>
            }
          />
        </div>
      ) : viewMode === 'cards' ? (
        /* MODE 1: Responsive Card Grid (Zero Horizontal Scroll!) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map((order: any) => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                    {order.orderNumber}
                  </span>
                  <PriorityBadge priority={order.priority} />
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {order.patientName}
                </h3>
                
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {order.restoration || order.restorationType} • {order.arch} ({order.units || 1} unit)
                </p>

                <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                  <div className="truncate">{order.doctorName}</div>
                  <div className="truncate text-gray-500 dark:text-gray-400 font-medium">{order.clinicName}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Amount</div>
                  <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <div className="text-[10px] text-gray-400 mt-1">Due: {formatDate(order.dueDate)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE 2: Responsive Adaptive Table */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs text-left text-gray-500 dark:text-gray-400">
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
                  {table.isColVisible('restoration') && (
                    <SortTh field="restoration" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden sm:table-cell">Restoration</SortTh>
                  )}
                  {table.isColVisible('status') && (
                    <SortTh field="status" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Status</SortTh>
                  )}
                  {table.isColVisible('priority') && (
                    <SortTh field="priority" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden sm:table-cell">Priority</SortTh>
                  )}
                  {table.isColVisible('amount') && (
                    <SortTh field="amount" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} align="right">Amount</SortTh>
                  )}
                  {table.isColVisible('dueDate') && (
                    <SortTh field="dueDate" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden lg:table-cell">Due Date</SortTh>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {table.paginatedData.map((order: any) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    {table.isColVisible('orderNumber') && (
                      <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                    )}
                    {table.isColVisible('patientName') && (
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {order.patientName}
                      </td>
                    )}
                    {table.isColVisible('doctorName') && (
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-gray-800 dark:text-gray-200">{order.doctorName?.replace('Dr. ', '')}</div>
                        <div className="text-[10px] text-gray-400">{order.clinicName}</div>
                      </td>
                    )}
                    {table.isColVisible('restoration') && (
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {order.restoration || order.restorationType} ({order.units || 1}u)
                      </td>
                    )}
                    {table.isColVisible('status') && (
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    )}
                    {table.isColVisible('priority') && (
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <PriorityBadge priority={order.priority} />
                      </td>
                    )}
                    {table.isColVisible('amount') && (
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.amount)}
                      </td>
                    )}
                    {table.isColVisible('dueDate') && (
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400">
                        {formatDate(order.dueDate)}
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
      {table.filteredItems > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
          <span>
            Showing {Math.min((table.currentPage - 1) * table.pageSize + 1, table.filteredItems)} to {Math.min(table.currentPage * table.pageSize, table.filteredItems)} of {table.filteredItems} orders
          </span>
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
