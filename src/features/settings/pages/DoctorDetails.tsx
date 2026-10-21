import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, Building, Stethoscope, Clock, Package, DollarSign } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDate, timeAgo, formatCurrency } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';

export default function DoctorDetails() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'activity'>('overview');

  const { data: doctor, isLoading } = useFetch(() => api.getDoctorById(doctorId!), [doctorId]);
  const { data: allOrders } = useFetch(api.getOrders);

  if (isLoading) return <LoadingState text="Loading doctor profile..." />;
  if (!doctor) return <EmptyState title="Doctor not found" description="The doctor profile does not exist." />;

  const doctorOrders = (allOrders || []).filter(o => o.doctorId === doctor.id || o.doctorName === doctor.name);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/doctors')} className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Doctors
      </button>

      {/* Header Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <Avatar name={doctor.name} size="lg" className="w-16 h-16 text-lg" variant="success" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{doctor.name}</h1>
              <StatusBadge status={doctor.status} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                <Stethoscope className="w-4 h-4" /> {doctor.specialty}
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" /> {doctor.clinicName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/orders/create')}>
            New Prescription
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'orders', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab} {tab === 'orders' ? `(${doctorOrders.length})` : ''}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Contact & Practice</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /> {doctor.phone}</div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /> {doctor.email}</div>
                <div className="flex items-center gap-3"><Building className="w-4 h-4 text-gray-400" /> {doctor.clinicName}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Prescription Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{doctorOrders.length || doctor.ordersCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Orders</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(doctorOrders.reduce((s, o) => s + o.amount, 0))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Volume</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <div className="space-y-3">
                {doctorOrders.slice(0, 3).map(o => (
                  <div key={o.id} className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded" onClick={() => navigate(`/orders/${o.id}`)}>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{o.orderNumber}</p>
                      <p className="text-xs text-gray-500">{o.patientName} • {o.restoration}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                ))}
                {doctorOrders.length === 0 && (
                  <p className="text-xs text-gray-500">No orders placed yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Order #</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Restoration</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {doctorOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">{o.orderNumber}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{o.patientName}</td>
                      <td className="px-6 py-4">{o.restoration} ({o.arch})</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatCurrency(o.amount)}</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4"><PriorityBadge priority={o.priority} /></td>
                      <td className="px-6 py-4 text-right text-xs">{timeAgo(o.updatedAt)}</td>
                    </tr>
                  ))}
                  {doctorOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">No orders found for this doctor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Doctor Activity Log</h3>
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
              {doctorOrders.map(o => (
                <div key={o.id} className="relative pl-6 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-100 border-2 border-blue-500 dark:bg-blue-900"></span>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Order {o.orderNumber} Prescribed</p>
                  <p className="text-xs text-gray-500">Patient: {o.patientName} • {o.restoration}</p>
                  <span className="text-xs text-gray-400">{timeAgo(o.updatedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
