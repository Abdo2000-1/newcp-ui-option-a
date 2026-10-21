import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  User, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Play
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { formatDate } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import type { OrderStatus } from '@/shared/types';

interface WorkflowStageConfig {
  status: OrderStatus;
  label: string;
  owner: string;
  role: string;
  description: string;
  tasks: string[];
}

const STAGES: WorkflowStageConfig[] = [
  {
    status: 'New',
    label: 'Order Intake',
    owner: 'Sarah Jenkins',
    role: 'Intake Coordinator',
    description: 'Initial intake, digital impression verification, and order prescription routing.',
    tasks: ['Verify intraoral scan completeness', 'Confirm patient prescription and shade', 'Register billing voucher']
  },
  {
    status: 'Review',
    label: 'Technical Review',
    owner: 'Dr. Robert Miller',
    role: 'Lead Lab Technician',
    description: 'Validate preparation margins, occlusal clearance, and clinical feasibility.',
    tasks: ['Check preparation margin clearance (min 0.5mm)', 'Evaluate opposing arch articulation', 'Confirm material substrate compatibility']
  },
  {
    status: 'Design',
    label: 'CAD Modeling',
    owner: 'Thomas Anderson',
    role: 'Senior Dental Designer',
    description: '3D CAD digital crown design, emergence profile, and contact point calibration.',
    tasks: ['Generate anatomical 3D proposal in 3Shape/Exocad', 'Refine contact areas and marginal fit', 'Export CAM manufacturing files (.stl/.nc)']
  },
  {
    status: 'Production',
    label: 'CAM Fabrication',
    owner: 'Milling Department',
    role: 'Milling Specialist',
    description: 'Nesting, 5-axis wet/dry milling of zirconia disc, and high-temp sintering furnace cycle.',
    tasks: ['Nest design in multi-layer disc', 'Execute 5-axis precision milling cycle', 'Run 8-hour sintering program at 1530°C']
  },
  {
    status: 'Quality Check',
    label: 'Finishing & QC',
    owner: 'Elena Rostova',
    role: 'Master Ceramist',
    description: 'Glazing, characterization staining, microscopic marginal fit inspection on 3D printed die.',
    tasks: ['Manual surface texture characterization', 'Glaze firing and high-gloss polish', 'Microscopic marginal inspection (50x magnification)']
  },
  {
    status: 'Ready',
    label: 'Dispatch Packaging',
    owner: 'Logistics Desk',
    role: 'Fulfillment Lead',
    description: 'Disinfection, protective blister pack sealing, final invoice generation, and courier scheduling.',
    tasks: ['Ultrasonic disinfection and sealing', 'Print case certificate and delivery note', 'Attach courier dispatch label']
  },
  {
    status: 'Completed',
    label: 'Delivered & Closed',
    owner: 'Courier & Clinic',
    role: 'Delivery Confirmation',
    description: 'Handover to dental clinic, clinician acceptance sign-off, and transaction completion.',
    tasks: ['Clinic reception handover confirmed', 'Doctor clinical seating completed', 'Invoice marked for settlement']
  }
];

export default function OrderWorkflow() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const orders = useStore((s) => s.getOrders());
  const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/orders')}>Return to Orders</Button>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.status === order.status);

  const handleSetStage = (targetStatus: OrderStatus) => {
    store.updateOrderStatus(order.id, targetStatus);
    store.createNotification({
      type: 'workflow',
      title: `Stage Updated: ${order.orderNumber}`,
      message: `Prescription advanced to stage: ${targetStatus}`,
      relatedId: order.id
    });
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Workflow Matrix: {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {order.patientName} • {order.restoration} ({order.units} unit) • Due {formatDate(order.dueDate)}
            </p>
          </div>
        </div>

        <Button onClick={() => navigate(`/orders/${order.id}/files`)} variant="outline" size="sm">
          Attached 3D Files →
        </Button>
      </div>

      {/* Pipeline Visual Stepper Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px] relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0" />
          {STAGES.map((st, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div 
                key={st.status} 
                onClick={() => handleSetStage(st.status)}
                className="flex flex-col items-center relative z-10 cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-110 ${
                  isCompleted 
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 animate-pulse'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {st.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Cards */}
      <div className="space-y-4">
        {STAGES.map((st, idx) => {
          const isCurrent = idx === currentStageIndex;
          const isPassed = idx < currentStageIndex;

          return (
            <div 
              key={st.status}
              className={`rounded-xl border transition-all ${
                isCurrent 
                  ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md ring-1 ring-blue-500/20'
                  : isPassed
                    ? 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70'
              } p-5`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isPassed 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                        {st.label} ({st.status})
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                          Active Stage
                        </span>
                      )}
                      {isPassed && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{st.owner} • {st.role}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {!isCurrent && (
                    <Button 
                      size="sm" 
                      variant={isPassed ? 'ghost' : 'outline'}
                      onClick={() => handleSetStage(st.status)}
                      className="text-xs gap-1"
                    >
                      <span>Move to this stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isCurrent && idx < STAGES.length - 1 && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSetStage(STAGES[idx + 1].status)}
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <span>Advance to {STAGES[idx + 1].status}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                {st.description}
              </p>

              {/* Checklist */}
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                <div className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                  Quality Checklist & Requirements
                </div>
                <div className="space-y-1.5">
                  {st.tasks.map((task, tIdx) => {
                    const taskId = `${st.status}-${tIdx}`;
                    const isChecked = isPassed || Boolean(completedTasks[taskId]);

                    return (
                      <label 
                        key={tIdx} 
                        className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTask(taskId)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className={isChecked ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                          {task}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
