import React, { useState } from 'react';
import { 
  TableProperties, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Users, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { SearchInput } from '@/shared/components/SearchInput';
import { Select } from '@/shared/components/Select';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Pagination } from '@/shared/components/Pagination';
import { formatDate } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';

type GridTab = 'orders' | 'patients' | 'services' | 'workflow';

interface ServiceGridRow {
  id: string;
  serviceName: string;
  category: string;
  orders: number;
  completedToday: number;
  utilization: number;
  owner: string;
  status: 'Active' | 'Under Review' | 'Paused';
  updated: string;
}

const SERVICES_DATA: ServiceGridRow[] = [
  { id: 'srv-1', serviceName: 'Zirconia Monolithic Crown', category: 'Crown & Bridge', orders: 48, completedToday: 14, utilization: 85, owner: 'CAD Dept', status: 'Active', updated: '2025-02-14' },
  { id: 'srv-2', serviceName: 'E-max Aesthetic Veneer', category: 'Aesthetic', orders: 22, completedToday: 8, utilization: 64, owner: 'Ceramics Dept', status: 'Active', updated: '2025-02-15' },
  { id: 'srv-3', serviceName: 'Titanium Custom Abutment', category: 'Implantology', orders: 19, completedToday: 5, utilization: 72, owner: 'Milling Team', status: 'Active', updated: '2025-02-13' },
  { id: 'srv-4', serviceName: 'Full Arch Surgical Guide', category: 'Guided Surgery', orders: 11, completedToday: 3, utilization: 90, owner: 'Planning Lab', status: 'Active', updated: '2025-02-16' },
  { id: 'srv-5', serviceName: 'Clear Aligner Treatment Plan', category: 'Orthodontics', orders: 34, completedToday: 11, utilization: 58, owner: 'Ortho Studio', status: 'Active', updated: '2025-02-12' },
  { id: 'srv-6', serviceName: 'PMMA Long-term Provisional', category: 'Provisional', orders: 15, completedToday: 7, utilization: 45, owner: 'Milling Team', status: 'Paused', updated: '2025-02-10' },
];

export default function Grid() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<GridTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({ 'ord-1': true });
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const orders = useStore((s) => s.getOrders());
  const patients = useStore((s) => s.getPatients());

  // Metrics
  const totalOrders = orders.length;
  const highPriorityCount = orders.filter((o) => o.priority === 'High' || o.priority === 'Urgent').length;
  const activeServicesCount = SERVICES_DATA.filter((s) => s.status === 'Active').length;
  const attentionCount = orders.filter((o) => o.status === 'Review' || o.priority === 'Urgent').length;

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(term) ||
      o.patientName.toLowerCase().includes(term) ||
      o.doctorName.toLowerCase().includes(term) ||
      o.restoration.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Patients
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      p.doctorName.toLowerCase().includes(term) ||
      p.clinicName.toLowerCase().includes(term) ||
      (p.email || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Services
  const filteredServices = SERVICES_DATA.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      s.serviceName.toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term) ||
      s.owner.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleWorkflowExpand = (orderId: string) => {
    setExpandedWorkflows((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Grid Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Interactive Prime Table
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Unified data grid with cross-entity navigation, expandable matrices, and multi-view synchronization
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => {
              const csv = `Entity Grid Export - ${activeTab.toUpperCase()}\nGenerated: ${new Date().toISOString()}`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `grid_${activeTab}_export.csv`;
              a.click();
            }}
          >
            <Download className="w-4 h-4" />
            Export Tab
          </Button>
          <Button size="sm" onClick={() => navigate('/orders/create')}>
            + New Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Work Orders</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalOrders}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">All active workflows</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">High Priority Orders</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{highPriorityCount}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Expedited production</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Lab Services</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeServicesCount}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Across all departments</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Requires Review</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{attentionCount}</div>
            <div className="text-xs text-rose-500 mt-0.5 font-medium">Pending technician sign-off</div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'orders', label: 'Orders Grid', count: filteredOrders.length },
          { id: 'patients', label: 'Patients Directory', count: filteredPatients.length },
          { id: 'services', label: 'Services Catalog', count: filteredServices.length },
          { id: 'workflow', label: 'Workflow Matrix', count: orders.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as GridTab); setPage(1); }}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchTerm}
          onChange={(val: any) => setSearchTerm(typeof val === 'string' ? val : val?.target?.value || '')}
          placeholder={`Search ${activeTab}...`}
          className="flex-1"
        />
        {activeTab === 'orders' && (
          <Select
            options={[
              { value: 'all', label: 'All Stages' },
              { value: 'New', label: 'New' },
              { value: 'Review', label: 'Review' },
              { value: 'Design', label: 'Design' },
              { value: 'Production', label: 'Production' },
              { value: 'Quality Check', label: 'Quality Check' },
              { value: 'Completed', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(typeof val === 'string' ? val : val?.target?.value || '')}
            className="w-full sm:w-48"
          />
        )}
      </div>

      {/* Tab 1: Orders Grid */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Order #</th>
                <th className="px-3.5 py-3 font-semibold">Patient</th>
                <th className="px-3.5 py-3 font-semibold hidden md:table-cell">Doctor & Clinic</th>
                <th className="px-3.5 py-3 font-semibold hidden sm:table-cell">Service</th>
                <th className="px-3.5 py-3 font-semibold">Stage</th>
                <th className="px-3.5 py-3 font-semibold hidden sm:table-cell">Priority</th>
                <th className="px-3.5 py-3 font-semibold hidden lg:table-cell">Due Date</th>
                <th className="px-3.5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.slice((page - 1) * pageSize, page * pageSize).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-3.5 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => navigate(`/orders/${order.id}`)}>
                    {order.orderNumber}
                  </td>
                  <td className="px-3.5 py-3 font-semibold text-gray-900 dark:text-white">
                    {order.patientName}
                  </td>
                  <td className="px-3.5 py-3 hidden md:table-cell">
                    <div className="text-gray-900 dark:text-gray-200 font-medium">{order.doctorName}</div>
                    <div className="text-[10px] text-gray-400">{order.clinicName}</div>
                  </td>
                  <td className="px-3.5 py-3 hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[11px] font-medium">
                      {order.restoration} ({order.units}u)
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3.5 py-3 hidden sm:table-cell">
                    <PriorityBadge priority={order.priority} />
                  </td>
                  <td className="px-3.5 py-3 hidden lg:table-cell text-gray-500">
                    {formatDate(order.dueDate)}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/orders/${order.id}`)}>
                      View
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab 2: Patients Directory */}
      {activeTab === 'patients' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Patient Name</th>
                <th className="px-3.5 py-3 font-semibold hidden sm:table-cell">Doctor</th>
                <th className="px-3.5 py-3 font-semibold hidden md:table-cell">Clinic</th>
                <th className="px-3.5 py-3 font-semibold hidden lg:table-cell">Contact</th>
                <th className="px-3.5 py-3 font-semibold">Status</th>
                <th className="px-3.5 py-3 font-semibold hidden sm:table-cell">Orders</th>
                <th className="px-3.5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPatients.slice((page - 1) * pageSize, page * pageSize).map((pt) => (
                <tr key={pt.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                         onClick={() => navigate(`/patients/${pt.id}`)}>
                      {pt.name}
                    </div>
                    <div className="text-[10px] text-gray-400">DOB: {pt.dob} ({pt.gender})</div>
                  </td>
                  <td className="px-3.5 py-3 hidden sm:table-cell text-gray-900 dark:text-gray-200 font-medium">
                    {pt.doctorName?.replace('Dr. ', '')}
                  </td>
                  <td className="px-3.5 py-3 hidden md:table-cell text-gray-600 dark:text-gray-300">
                    {pt.clinicName}
                  </td>
                  <td className="px-3.5 py-3 hidden lg:table-cell text-[11px]">
                    <div>{pt.email || 'No email'}</div>
                    <div className="text-gray-400">{pt.phone || 'No phone'}</div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      pt.status === 'Active' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {pt.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 hidden sm:table-cell font-medium text-gray-900 dark:text-white">
                    {pt.ordersCount || 0}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${pt.id}`)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab 3: Services Catalog */}
      {activeTab === 'services' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Service Name</th>
                <th className="px-3.5 py-3 font-semibold hidden sm:table-cell">Category</th>
                <th className="px-3.5 py-3 font-semibold">Active</th>
                <th className="px-3.5 py-3 font-semibold text-emerald-600">Done</th>
                <th className="px-3.5 py-3 font-semibold hidden md:table-cell">Utilization</th>
                <th className="px-3.5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-3.5 py-3 font-semibold text-gray-900 dark:text-white">
                    {srv.serviceName}
                  </td>
                  <td className="px-3.5 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-300">
                    {srv.category}
                  </td>
                  <td className="px-3.5 py-3 font-bold text-gray-900 dark:text-white">
                    {srv.orders}
                  </td>
                  <td className="px-3.5 py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                    +{srv.completedToday}
                  </td>
                  <td className="px-3.5 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            srv.utilization > 80 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${srv.utilization}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">{srv.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      srv.status === 'Active'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    }`}>
                      {srv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab 4: Workflow Matrix */}
      {activeTab === 'workflow' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-2 py-3 w-8"></th>
                <th className="px-3 py-3 font-semibold">Order #</th>
                <th className="px-3 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold hidden md:table-cell">Assigned Tech</th>
                <th className="px-3 py-3 font-semibold">Stage</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">Priority</th>
                <th className="px-3 py-3 font-semibold hidden lg:table-cell">Pipeline Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map((order) => {
                const isExpanded = !!expandedWorkflows[order.id];
                return (
                  <React.Fragment key={order.id}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                      onClick={() => toggleWorkflowExpand(order.id)}
                    >
                      <td className="px-2 py-3 text-center text-gray-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-3 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        {order.orderNumber}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                        {order.patientName}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-gray-700 dark:text-gray-300 text-[11px]">
                        T. Anderson (Lead Tech)
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <PriorityBadge priority={order.priority} />
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          order.priority === 'Urgent'
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {order.priority === 'Urgent' ? 'Attention' : 'On Track'}
                        </span>
                      </td>
                    </tr>

                      {/* Expandable Sub-Orders Subtable */}
                      {isExpanded && (
                        <tr className="bg-blue-50/40 dark:bg-blue-950/20 border-b border-gray-200 dark:border-gray-800">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white dark:bg-gray-800/80 rounded-lg p-3 border border-blue-100 dark:border-blue-900/40">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                                <span>Sub-Order Deliverables for {order.orderNumber}</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View Full Order Specs →
                                </button>
                              </div>
                              <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/60">
                                  <tr>
                                    <th className="py-2 px-3">Item #</th>
                                    <th className="py-2 px-3">Service Type</th>
                                    <th className="py-2 px-3">Shade / Material</th>
                                    <th className="py-2 px-3">Sub-Stage</th>
                                    <th className="py-2 px-3">Target ETA</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  <tr>
                                    <td className="py-2 px-3 font-mono font-medium text-gray-900 dark:text-white">SO-101</td>
                                    <td className="py-2 px-3">{order.restoration} Design Model</td>
                                    <td className="py-2 px-3">{order.shade || 'A2'} • Zirconia</td>
                                    <td className="py-2 px-3 text-emerald-600 font-medium">Completed</td>
                                    <td className="py-2 px-3 text-gray-500">Dec 12, 14:00</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 px-3 font-mono font-medium text-gray-900 dark:text-white">SO-102</td>
                                    <td className="py-2 px-3">Milling & Sintering Block</td>
                                    <td className="py-2 px-3">{order.shade || 'A2'} • Multi-layered</td>
                                    <td className="py-2 px-3 text-blue-600 font-medium">In Production</td>
                                    <td className="py-2 px-3 text-gray-500">Dec 14, 18:00</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

      {/* Pagination */}
      {activeTab === 'orders' && filteredOrders.length > pageSize && (
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(filteredOrders.length / pageSize)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
