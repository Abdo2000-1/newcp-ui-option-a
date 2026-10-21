import React, { useState } from 'react';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Pagination } from '@/shared/components/Pagination';
import { EmptyState } from '@/shared/components/EmptyState';
import { timeAgo } from '@/shared/utils/format';
import { Link } from 'react-router-dom';
import { Check, X, AlertCircle, CheckCircle2, LayoutGrid, List } from 'lucide-react';
import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable } from '@/shared/hooks/useAdvancedTable';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

const CR_COLUMNS = [
  { id: 'requestNumber', label: 'Request #', defaultVisible: true },
  { id: 'orderNumber', label: 'Order #', defaultVisible: true },
  { id: 'patientName', label: 'Patient', defaultVisible: true },
  { id: 'requester', label: 'Requester', defaultVisible: true },
  { id: 'description', label: 'Description', defaultVisible: true },
  { id: 'priority', label: 'Priority', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'createdAt', label: 'Created', defaultVisible: true },
  { id: 'actions', label: 'Actions', defaultVisible: true },
];

export default function ChangeRequests() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const changeRequests = useStore((s) => s.getChangeRequests());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAction = (id: string, newStatus: 'Approved' | 'Rejected') => {
    store.updateChangeRequestStatus(id, newStatus);
    setFeedback(`Change request marked as ${newStatus}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const table = useAdvancedTable({
    data: changeRequests || [],
    columns: CR_COLUMNS,
    searchFields: ['requestNumber', 'orderNumber', 'orderId', 'patientName', 'requester', 'description', 'id'],
    filterConfigs: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS, defaultValue: 'all' },
      { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS, defaultValue: 'all' },
    ],
    pageSize: 10,
  });

  const paginatedRequests = table.paginatedData;

  const pendingCount = changeRequests.filter(cr => cr.status === 'Pending').length;
  const inReviewCount = changeRequests.filter(cr => cr.status === 'In Review').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Change Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and approve lab modification and remake requests</p>
        </div>
        {feedback && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Under Review</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inReviewCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{changeRequests.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TableTools
          table={table}
          searchPlaceholder="Search by request #, order #, patient, requester..."
          rightActions={
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-gray-50 dark:bg-gray-900 shrink-0">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {paginatedRequests.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No change requests found" description="Try adjusting your filters or search query." />
          </div>
        ) : viewMode === 'table' ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm text-gray-500 dark:text-gray-400 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {table.isColVisible('requestNumber') && (
                    <SortTh field="requestNumber" label="Request #" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('orderNumber') && (
                    <SortTh field="orderNumber" label="Order #" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('patientName') && (
                    <SortTh field="patientName" label="Patient" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('requester') && (
                    <SortTh field="requester" label="Requester" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden md:table-cell" />
                  )}
                  {table.isColVisible('description') && (
                    <th className="hidden lg:table-cell px-4 py-3.5 font-semibold max-w-xs">Description</th>
                  )}
                  {table.isColVisible('priority') && (
                    <SortTh field="priority" label="Priority" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden sm:table-cell" />
                  )}
                  {table.isColVisible('status') && (
                    <SortTh field="status" label="Status" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('createdAt') && (
                    <SortTh field="createdAt" label="Created" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden xl:table-cell" />
                  )}
                  {table.isColVisible('actions') && (
                    <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedRequests.map((cr) => (
                  <tr key={cr.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    {table.isColVisible('requestNumber') && (
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {cr.requestNumber || cr.id}
                      </td>
                    )}
                    {table.isColVisible('orderNumber') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Link to={`/orders/${cr.orderId}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          {cr.orderNumber || cr.orderId}
                        </Link>
                      </td>
                    )}
                    {table.isColVisible('patientName') && (
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white truncate max-w-[130px]">{cr.patientName}</td>
                    )}
                    {table.isColVisible('requester') && (
                      <td className="hidden md:table-cell px-4 py-3.5 text-gray-600 dark:text-gray-300 truncate max-w-[130px]">{cr.requester || (cr as any).requesterName}</td>
                    )}
                    {table.isColVisible('description') && (
                      <td className="hidden lg:table-cell px-4 py-3.5 max-w-xs text-xs text-gray-700 dark:text-gray-300">
                        <span className="line-clamp-2" title={cr.description}>{cr.description}</span>
                      </td>
                    )}
                    {table.isColVisible('priority') && (
                      <td className="hidden sm:table-cell px-4 py-3.5">
                        <PriorityBadge priority={cr.priority as any} />
                      </td>
                    )}
                    {table.isColVisible('status') && (
                      <td className="px-4 py-3.5">
                        <StatusBadge status={cr.status as any} />
                      </td>
                    )}
                    {table.isColVisible('createdAt') && (
                      <td className="hidden xl:table-cell px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{timeAgo(cr.createdAt)}</td>
                    )}
                    {table.isColVisible('actions') && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {(cr.status === 'Pending' || cr.status === 'In Review') ? (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                              title="Approve Request"
                              onClick={() => handleAction(cr.id, 'Approved')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors"
                              title="Reject Request"
                              onClick={() => handleAction(cr.id, 'Rejected')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Settled</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedRequests.map((cr) => (
              <div key={cr.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">{cr.requestNumber || cr.id}</span>
                    <StatusBadge status={cr.status as any} />
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="text-gray-400">Order:</span>
                    <Link to={`/orders/${cr.orderId}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-medium">
                      {cr.orderNumber || cr.orderId}
                    </Link>
                    <PriorityBadge priority={cr.priority as any} />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{cr.patientName}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-2">{cr.description}</p>
                  <p className="text-xs text-gray-400">By {cr.requester || (cr as any).requesterName} • {timeAgo(cr.createdAt)}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  {(cr.status === 'Pending' || cr.status === 'In Review') ? (
                    <>
                      <button 
                        onClick={() => handleAction(cr.id, 'Rejected')}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button 
                        onClick={() => handleAction(cr.id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 py-1">Settled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {changeRequests.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <Pagination
              page={table.page}
              totalPages={table.totalPages}
              onPageChange={table.setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
