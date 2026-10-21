import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, Building2, User, Users, Package } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDate, timeAgo, formatCurrency } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';

export default function ClinicDetails() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'orders' | 'activity'>('overview');

  const { data: clinic, isLoading } = useFetch(() => api.getClinicById(clinicId!), [clinicId]);
  const { data: allDoctors } = useFetch(api.getDoctors);
  const { data: allOrders } = useFetch(api.getOrders);

  if (isLoading) return <LoadingState text="Loading clinic profile..." />;
  if (!clinic) return <EmptyState title="Clinic not found" description="The clinic profile does not exist." />;

  const clinicDoctors = (allDoctors || []).filter(d => d.clinicId === clinic.id || d.clinicName === clinic.name);
  const clinicOrders = (allOrders || []).filter(o => o.clinicId === clinic.id || o.clinicName === clinic.name);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/clinics')} className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Clinics
      </button>

      {/* Header Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{clinic.name}</h1>
              <StatusBadge status={clinic.status} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {clinic.address}, {clinic.city}</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> Account Manager: {clinic.accountManager}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/orders/create')}>
            New Order for Clinic
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'doctors', 'orders', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab} {tab === 'doctors' ? `(${clinicDoctors.length})` : tab === 'orders' ? `(${clinicOrders.length})` : ''}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Clinic Details</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /> {clinic.phone}</div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /> {clinic.email}</div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-400" /> {clinic.address}, {clinic.city}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Account Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{clinicDoctors.length || clinic.doctorsCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dentists</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{clinicOrders.length || clinic.ordersCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Orders</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Active Doctors</h3>
              <div className="space-y-3">
                {clinicDoctors.slice(0, 3).map(d => (
                  <div key={d.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 p-1.5 rounded" onClick={() => navigate(`/doctors/${d.id}`)}>
                    <div className="flex items-center gap-2">
                      <Avatar name={d.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.specialty}</p>
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinicDoctors.map(d => (
              <div key={d.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:border-blue-400" onClick={() => navigate(`/doctors/${d.id}`)}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={d.name} size="md" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{d.name}</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{d.specialty}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>{d.email}</p>
                  <p>{d.phone}</p>
                </div>
              </div>
            ))}
            {clinicDoctors.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-500">No doctors associated with this clinic yet.</div>
            )}
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
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Restoration</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {clinicOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">{o.orderNumber}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{o.patientName}</td>
                      <td className="px-6 py-4">{o.doctorName}</td>
                      <td className="px-6 py-4">{o.restoration}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatCurrency(o.amount)}</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4 text-right text-xs">{timeAgo(o.updatedAt)}</td>
                    </tr>
                  ))}
                  {clinicOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">No orders registered for this clinic.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Clinic Activity Timeline</h3>
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
              {clinicOrders.map(o => (
                <div key={o.id} className="relative pl-6 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-100 border-2 border-blue-500 dark:bg-blue-900"></span>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Order {o.orderNumber} Submitted</p>
                  <p className="text-xs text-gray-500">{o.doctorName} for {o.patientName} • {o.restoration}</p>
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
