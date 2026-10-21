import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, LayoutGrid, List, FileText, ChevronRight, LayoutTemplate
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { SearchInput } from '@/shared/components/SearchInput';
import { Select } from '@/shared/components/Select';
import { Pagination } from '@/shared/components/Pagination';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { ErrorState } from '@/shared/components/ErrorState';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { timeAgo, formatCurrency } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';
import { useTableState } from '@/shared/hooks/useTableState';

import { useStore } from '@/shared/hooks/useStore';

import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable, ColumnConfig } from '@/shared/hooks/useAdvancedTable';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Closed', label: 'Closed' }
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
];

const CASE_COLUMNS: ColumnConfig[] = [
  { id: 'caseNumber', label: 'Case #' },
  { id: 'title', label: 'Title' },
  { id: 'patientName', label: 'Patient / Doctor' },
  { id: 'clinicName', label: 'Clinic' },
  { id: 'ordersCount', label: 'Stats' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'updatedAt', label: 'Updated' },
];

export default function Cases() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [simulatedState, setSimulatedState] = useState<UIStateType>('normal');
  
  const cases = useStore(s => s.getCases());

  const table = useAdvancedTable({
    data: cases,
    columns: CASE_COLUMNS,
    searchFields: ['title', 'caseNumber', 'patientName', 'doctorName', 'clinicName'],
    initialSortField: 'caseNumber',
    initialSortDirection: 'desc',
    itemsPerPage: 10,
  });

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cases</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all {cases.length} cases
          </p>
        </div>
        <Button onClick={() => navigate('/orders/create')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Advanced Table Tools */}
      <TableTools
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder="Search cases by #, title, patient, doctor, clinic..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: table.filters.status || 'all',
            onChange: (val) => table.setFilterValue('status', val),
            options: STATUS_OPTIONS,
          },
          {
            id: 'priority',
            label: 'Priority',
            value: table.filters.priority || 'all',
            onChange: (val) => table.setFilterValue('priority', val),
            options: PRIORITY_OPTIONS,
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
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-900">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-xs text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-xs text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* State Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <UIStateSwitcher state={simulatedState} onChange={setSimulatedState} label="Simulate Cases View State" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          Toggle <b>Loading</b>, <b>Empty</b>, or <b>Error</b> status in real-time
        </span>
      </div>

      {simulatedState === 'loading' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <LoadingState 
            text="Loading Clinical Cases Database..." 
            subtitle="Querying treatment plans, 3D anatomical charts, and doctor approvals"
          />
        </div>
      ) : simulatedState === 'error' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <ErrorState
            title="Failed to Load Cases"
            message="Secure DICOM/Case Gateway encountered an unexpected socket termination (503)."
            code="ERR_CASES_SOCKET_DISCONNECT_503"
            onRetry={() => setSimulatedState('normal')}
          />
        </div>
      ) : simulatedState === 'empty' || table.filteredItems === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <EmptyState 
            title="No Clinical Cases Found" 
            description="There are currently no active clinical cases matching your filter criteria."
            action={
              <Button 
                variant="primary" 
                onClick={() => { setSimulatedState('normal'); table.resetAllFilters(); }}
                className="cursor-pointer"
              >
                Clear Search & Filters
              </Button>
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm text-gray-500 dark:text-gray-400 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                <tr>
                  {table.isColVisible('caseNumber') && (
                    <SortTh field="caseNumber" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Case #</SortTh>
                  )}
                  {table.isColVisible('title') && (
                    <SortTh field="title" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Title</SortTh>
                  )}
                  {table.isColVisible('patientName') && (
                    <SortTh field="patientName" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Patient / Doctor</SortTh>
                  )}
                  {table.isColVisible('clinicName') && (
                    <SortTh field="clinicName" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden md:table-cell">Clinic</SortTh>
                  )}
                  {table.isColVisible('ordersCount') && (
                    <SortTh field="ordersCount" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden lg:table-cell">Stats</SortTh>
                  )}
                  {table.isColVisible('status') && (
                    <SortTh field="status" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort}>Status</SortTh>
                  )}
                  {table.isColVisible('priority') && (
                    <SortTh field="priority" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden sm:table-cell">Priority</SortTh>
                  )}
                  {table.isColVisible('updatedAt') && (
                    <SortTh field="updatedAt" currentSortField={table.sortField} sortDirection={table.sortDirection} onSort={table.handleSort} className="hidden xl:table-cell">Updated</SortTh>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {table.paginatedData.map((c: any) => (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    {table.isColVisible('caseNumber') && (
                      <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{c.caseNumber}</td>
                    )}
                    {table.isColVisible('title') && (
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[160px] truncate">{c.title}</td>
                    )}
                    {table.isColVisible('patientName') && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[130px]">{c.patientName || c.patient?.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[130px]">{c.doctorName || c.doctor?.name}</div>
                      </td>
                    )}
                    {table.isColVisible('clinicName') && (
                      <td className="hidden md:table-cell px-4 py-3 text-gray-600 dark:text-gray-300">{c.clinicName || c.clinic?.name}</td>
                    )}
                    {table.isColVisible('ordersCount') && (
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="text-xs flex flex-col gap-1">
                          <span className="flex items-center gap-1"><LayoutTemplate className="w-3 h-3"/> {c.ordersCount || 0} Orders</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {c.filesCount || 0} Files</span>
                        </div>
                      </td>
                    )}
                    {table.isColVisible('status') && (
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    )}
                    {table.isColVisible('priority') && (
                      <td className="hidden sm:table-cell px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    )}
                    {table.isColVisible('updatedAt') && (
                      <td className="hidden xl:table-cell px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{timeAgo(c.updatedAt)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination 
              currentPage={table.currentPage} 
              totalPages={table.totalPages} 
              onPageChange={table.setCurrentPage} 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {table.paginatedData.map((c: any) => (
              <div 
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {c.caseNumber}
                    </span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">Patient: {c.patientName || c.patient?.name}</p>
                  <p className="text-xs text-gray-500">Dr. {c.doctorName || c.doctor?.name}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
                  <StatusBadge status={c.status} />
                  <span className="text-[11px] text-gray-400">{timeAgo(c.updatedAt)}</span>
                </div>
              </div>
            ))}
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

