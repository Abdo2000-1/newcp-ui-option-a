import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Activity, 
  Paperclip, 
  ClipboardList, 
  Edit3, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Printer
} from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Button } from '@/shared/components/Button';
import { formatDate, formatCurrency } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';

export default function ViewOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'sub-orders' | 'workflow' | 'files'>('overview');

  const order = useStore((s) => s.getOrderById(orderId as string));

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">The order you are looking for does not exist.</p>
        <Button className="mt-4" onClick={() => navigate('/orders')}>Return to Orders</Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FileText },
    { id: 'sub-orders' as const, label: 'Sub-Orders', icon: ClipboardList },
    { id: 'workflow' as const, label: 'Workflow', icon: Activity },
    { id: 'files' as const, label: '3D Files', icon: Paperclip },
  ];

  const workflowStages = ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed'];
  const currentStageIndex = workflowStages.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {order.patientName} • {order.doctorName} • {order.clinicName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Rx
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/orders/${order.id}/files`)}
            className="gap-1.5"
          >
            <Paperclip className="w-4 h-4" />
            Manage Files
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/orders/${order.id}/workflow`)}
            className="gap-1.5 text-blue-600 dark:text-blue-400"
          >
            <Activity className="w-4 h-4" />
            Workflow Stepper
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate(`/orders/${order.id}/edit`)}
            className="gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Edit Order
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-6 sm:space-x-8 min-w-max pb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-3.5 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Clinical Case Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-4">
                  <InfoPair label="Order Number" value={order.orderNumber} />
                  <InfoPair label="Patient Name" value={order.patientName} />
                  <InfoPair label="Doctor" value={order.doctorName} />
                  <InfoPair label="Clinic" value={order.clinicName} />
                  <InfoPair label="Scan Center" value={order.scanCenterName || 'Downtown Imaging'} />
                  <InfoPair label="Date Received" value={formatDate(order.receivedAt)} />
                  <InfoPair label="Target Due Date" value={formatDate(order.dueDate)} />
                </div>
                <div className="space-y-4">
                  <InfoPair label="Restoration Type" value={order.restoration} />
                  <InfoPair label="Dental Arch" value={order.arch} />
                  <InfoPair label="VITA Shade" value={order.shade || 'A2'} />
                  <InfoPair label="Units Count" value={`${order.units || 1} unit(s)`} />
                  <InfoPair label="Prescription Amount" value={formatCurrency(order.amount)} />
                  <InfoPair label="File Format" value={order.format || 'Digital (.STL)'} />
                  <InfoPair label="Lock Status" value={order.isLocked ? 'Locked for review' : 'Active / Editable'} />
                </div>
              </div>
              {order.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Technician Notes</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Navigation to Workflow */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300">Live Production Workflow</h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  Currently in <strong>{order.status}</strong> stage with 7-step quality control.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate(`/orders/${order.id}/workflow`)}>
                Open Stepper Matrix →
              </Button>
            </div>
          </div>
        )}

        {/* Sub-Orders Tab */}
        {activeTab === 'sub-orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Sub-Order Units</h3>
              <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${order.id}/sub-orders/SO-101`)}>
                + Add Sub-Order
              </Button>
            </div>

            {[
              { id: 'SO-101', name: `${order.restoration} Unit A`, teeth: '14, 15', status: order.status, priority: order.priority, forms: '3/3' },
              { id: 'SO-102', name: 'Custom Abutment Unit', teeth: '19', status: 'Design', priority: 'Normal', forms: '2/3' },
            ].map((sub) => (
              <div 
                key={sub.id} 
                onClick={() => navigate(`/orders/${order.id}/sub-orders/${sub.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        #{sub.id}
                      </span>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">{sub.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Teeth: {sub.teeth} • Forms Completed: {sub.forms}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.status as any} />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Workflow Timeline</h3>
              <Button size="sm" onClick={() => navigate(`/orders/${order.id}/workflow`)}>
                Open Full Stage Manager →
              </Button>
            </div>

            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-6">
              {workflowStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;

                return (
                  <div key={stage} className="relative pl-6">
                    <div className={`
                      absolute w-5 h-5 rounded-full -left-[11px] border-2 bg-white dark:bg-gray-800
                      ${isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : isActive ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}
                    `} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                        }`}>
                          {stage}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {isCompleted ? 'Passed verified' : isActive ? 'Under active fabrication' : 'Pending preceding steps'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center space-y-4">
            <Paperclip className="w-12 h-12 text-blue-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">3D Digital Scan Files</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage, download, and review STL and PLY scans associated with this case.
              </p>
            </div>
            <Button onClick={() => navigate(`/orders/${order.id}/files`)}>
              Open File Center
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white mt-1">{value}</span>
    </div>
  );
}
