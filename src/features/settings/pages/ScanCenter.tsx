import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, MapPin, Server, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { Pagination } from '@/shared/components/Pagination';
import { formatDate } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';
import { useStore } from '@/shared/hooks/useStore';
import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable } from '@/shared/hooks/useAdvancedTable';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

const SCAN_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Review', label: 'Review' },
  { value: 'Done', label: 'Done' },
];

const SCAN_COLUMNS = [
  { id: 'orderNumber', label: 'Order #', defaultVisible: true },
  { id: 'patientName', label: 'Patient', defaultVisible: true },
  { id: 'doctorName', label: 'Doctor', defaultVisible: true },
  { id: 'scanCenterName', label: 'Scan Center', defaultVisible: true },
  { id: 'restoration', label: 'Restoration', defaultVisible: true },
  { id: 'format', label: 'Format', defaultVisible: true },
  { id: 'scanStatus', label: 'Scan Status', defaultVisible: true },
  { id: 'receivedAt', label: 'Received', defaultVisible: true },
  { id: 'actions', label: 'Actions', defaultVisible: true },
];

export default function ScanCenter() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const { data: centersData, loading: centersLoading } = useFetch(api.getScanCenters);
  const orders = useStore(s => s.getOrders());

  const centers = centersData || [];
  
  const scanOrders = orders
    .filter(o => o.scanCenterName || o.scanCenterId)
    .map(o => ({
      ...o,
      scanStatus: o.status === 'Completed' || o.status === 'Ready' ? 'Done' : o.status === 'Review' ? 'Review' : 'Active'
    }));

  const table = useAdvancedTable({
    data: scanOrders,
    columns: SCAN_COLUMNS,
    searchFields: ['orderNumber', 'id', 'patientName', 'doctorName', 'scanCenterName', 'restoration'],
    filterConfigs: [
      { key: 'scanStatus', label: 'Scan Status', options: SCAN_STATUS_OPTIONS, defaultValue: 'all' },
    ],
    pageSize: 8,
  });

  if (centersLoading) return <LoadingState text="Loading scan center data..." />;

  const filteredOrders = table.paginatedData;

  const getScanStatusColor = (status: string) => {
    if (status === 'Done') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'Review') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.scanCenters', 'Scan Center')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage scan centers, devices, and incoming digital impressions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {centers.map(center => (
          <div key={center.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{center.name}</h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="truncate">{center.location}</span>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${center.status === 'Operational' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {{ Operational: 'Active', Maintenance: 'Maintenance' }[center.status] || center.status}
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
              <Server className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-xs truncate">Operator: {center.operator}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">{center.activeOrders}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today</div>
                <div className="font-semibold text-green-600 dark:text-green-400">{center.completedToday}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Devices</div>
                <div className="font-semibold text-gray-900 dark:text-white">{center.devices}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TableTools
          table={table}
          searchPlaceholder="Search scan orders by order #, patient, doctor, center..."
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

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ScanLine className="w-8 h-8 opacity-60" />}
            title="No scan orders found"
            description="Adjust search query or check back later."
          />
        ) : viewMode === 'table' ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                  {table.isColVisible('orderNumber') && (
                    <SortTh field="orderNumber" label="Order #" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('patientName') && (
                    <SortTh field="patientName" label="Patient" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('doctorName') && (
                    <SortTh field="doctorName" label="Doctor" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden md:table-cell" />
                  )}
                  {table.isColVisible('scanCenterName') && (
                    <SortTh field="scanCenterName" label="Scan Center" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden lg:table-cell" />
                  )}
                  {table.isColVisible('restoration') && (
                    <SortTh field="restoration" label="Restoration" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden sm:table-cell" />
                  )}
                  {table.isColVisible('format') && (
                    <th className="hidden xl:table-cell px-4 py-3">Format</th>
                  )}
                  {table.isColVisible('scanStatus') && (
                    <SortTh field="scanStatus" label="Scan Status" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('receivedAt') && (
                    <SortTh field="receivedAt" label="Received" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden lg:table-cell" />
                  )}
                  {table.isColVisible('actions') && (
                    <th className="px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                {filteredOrders.map((order) => {
                  const sStatus = order.scanStatus;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      {table.isColVisible('orderNumber') && (
                        <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{order.orderNumber}</td>
                      )}
                      {table.isColVisible('patientName') && (
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-[140px] truncate">{order.patientName}</td>
                      )}
                      {table.isColVisible('doctorName') && (
                        <td className="hidden md:table-cell px-4 py-3 max-w-[130px] truncate">{order.doctorName}</td>
                      )}
                      {table.isColVisible('scanCenterName') && (
                        <td className="hidden lg:table-cell px-4 py-3 max-w-[130px] truncate">{order.scanCenterName}</td>
                      )}
                      {table.isColVisible('restoration') && (
                        <td className="hidden sm:table-cell px-4 py-3">{order.restoration}</td>
                      )}
                      {table.isColVisible('format') && (
                        <td className="hidden xl:table-cell px-4 py-3">
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{order.format}</span>
                        </td>
                      )}
                      {table.isColVisible('scanStatus') && (
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getScanStatusColor(sStatus)}`}>
                            {sStatus}
                          </span>
                        </td>
                      )}
                      {table.isColVisible('receivedAt') && (
                        <td className="hidden lg:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.receivedAt)}</td>
                      )}
                      {table.isColVisible('actions') && (
                        <td className="px-4 py-3 text-right">
                          <Link to={`/orders/${order.id}`}>
                            <Button size="sm" variant="outline">
                              View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const sStatus = order.scanStatus;
              return (
                <div key={order.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScanStatusColor(sStatus)}`}>
                        {sStatus}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{order.patientName}</h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p><span className="text-gray-400">Doctor:</span> {order.doctorName}</p>
                      <p><span className="text-gray-400">Center:</span> {order.scanCenterName}</p>
                      <p><span className="text-gray-400">Restoration:</span> {order.restoration} ({order.format})</p>
                      <p><span className="text-gray-400">Received:</span> {formatDate(order.receivedAt)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <Link to={`/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {scanOrders.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
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
