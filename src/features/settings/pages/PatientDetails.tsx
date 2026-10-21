import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, FileText, Activity, Package } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDate, timeAgo, formatCurrency } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';

export default function PatientDetails() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'cases' | 'documents' | 'activity'>('overview');

  const { data: patient, isLoading } = useFetch(() => api.getPatientById(patientId!), [patientId]);
  const { data: allOrders } = useFetch(api.getOrders);
  const { data: allCases } = useFetch(api.getCases);
  const { data: allDocs } = useFetch(api.getDocuments);

  if (isLoading) return <LoadingState text="Loading patient profile..." />;
  if (!patient) return <EmptyState title="Patient not found" description="The patient you are looking for does not exist." />;

  const patientOrders = (allOrders || []).filter(o => o.patientId === patient.id || o.patientName === patient.name);
  const patientCases = (allCases || []).filter(c => c.patientId === patient.id || c.patientName === patient.name);
  const patientDocs = (allDocs || []).filter(d => d.patientName === patient.name);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <button onClick={() => navigate('/patients')} className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Patients
      </button>

      {/* Header Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <Avatar name={patient.name} size="lg" className="w-16 h-16 text-lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
              <StatusBadge status={patient.status} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> DOB: {formatDate(patient.dob)} ({patient.gender === 'M' ? 'Male' : 'Female'})</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Clinic: {patient.clinicName}</span>
              <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> Doctor: {patient.doctorName}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/orders/create')}>
            New Order
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max pb-px">
          {(['overview', 'orders', 'cases', 'documents', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab} {tab === 'orders' ? `(${patientOrders.length})` : tab === 'cases' ? `(${patientCases.length})` : tab === 'documents' ? `(${patientDocs.length})` : ''}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Info Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Contact Information</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /> {patient.phone}</div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /> {patient.email}</div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-400" /> {patient.clinicName}</div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Patient Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{patientOrders.length || patient.ordersCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Orders</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{patientCases.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Cases</div>
                </div>
              </div>
            </div>

            {/* Recent Activity Mini */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <div className="space-y-4">
                {patientOrders.slice(0, 3).map(o => (
                  <div key={o.id} className="flex gap-3 text-sm cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                    <Package className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{o.orderNumber} - {o.restoration}</p>
                      <p className="text-gray-500 text-xs">{timeAgo(o.updatedAt)}</p>
                    </div>
                  </div>
                ))}
                {patientOrders.length === 0 && (
                  <p className="text-xs text-gray-500">No recent orders recorded.</p>
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
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Restoration</th>
                    <th className="px-4 py-3">Arch</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {patientOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{o.restoration}</td>
                      <td className="px-4 py-3">{o.arch}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCurrency(o.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={o.priority} /></td>
                      <td className="px-4 py-3 text-xs">{timeAgo(o.updatedAt)}</td>
                    </tr>
                  ))}
                  {patientOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">No orders found for this patient.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientCases.map((c) => (
              <div key={c.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:border-blue-400" onClick={() => navigate(`/cases/${c.id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{c.caseNumber}</span>
                  <StatusBadge status={c.status} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{c.title}</h4>
                <p className="text-xs text-gray-500 mb-3">{c.notes || 'Dental case'}</p>
                <div className="flex justify-between text-xs text-gray-400 border-t pt-2 dark:border-gray-700">
                  <PriorityBadge priority={c.priority} />
                  <span>Updated {timeAgo(c.updatedAt)}</span>
                </div>
              </div>
            ))}
            {patientCases.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-500">No cases recorded for this patient.</div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            {patientDocs.map((d) => (
              <div key={d.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.category} • {d.size}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(d.date)}</span>
              </div>
            ))}
            {patientDocs.length === 0 && (
              <div className="py-8 text-center text-gray-500">No documents found for this patient.</div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-100 border-2 border-blue-500 dark:bg-blue-900"></span>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Last Visit Registered</p>
                <span className="text-xs text-gray-400">{formatDate(patient.lastVisit || new Date().toISOString())}</span>
              </div>
              {patientOrders.map(o => (
                <div key={o.id} className="relative pl-6 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-green-100 border-2 border-green-500 dark:bg-green-900"></span>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Order {o.orderNumber} Updated</p>
                  <p className="text-xs text-gray-500">{o.restoration} • Status: {o.status}</p>
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
