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
import { serviceClient, workflowClient } from '@/shared/api';
import type { AvailableTransition, HoldReasonOption, ServiceItem } from '@/shared/api/contractTypes';
import { Zap, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

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
  
  // OpenAPI 3.0.3 Contract Integration State
  const [contractServices, setContractServices] = useState<ServiceItem[]>([]);
  const [selectedServiceUuid, setSelectedServiceUuid] = useState<string>('');
  const [availableTransitions, setAvailableTransitions] = useState<AvailableTransition[]>([]);
  const [holdReasons, setHoldReasons] = useState<HoldReasonOption[]>([]);
  const [targetTransition, setTargetTransition] = useState<string>('');
  const [holdType, setHoldType] = useState<'customer' | 'internal' | 'lab'>('customer');
  const [holdReasonCode, setHoldReasonCode] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionMsg, setTransitionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load contract services for this order
  const loadServices = React.useCallback(async () => {
    if (!order) return;
    try {
      const orderRef = order.orderNumber || order.id || 'ORD-504901';
      const res = await serviceClient.listByOrder(orderRef);
      setContractServices(res.data || []);
      if (res.data && res.data.length > 0 && !selectedServiceUuid) {
        setSelectedServiceUuid(res.data[0].uuid);
      }
    } catch (err: any) {
      console.warn('Failed to load contract services:', err);
    }
  }, [order, selectedServiceUuid]);

  React.useEffect(() => {
    loadServices();
    workflowClient.getHoldReasons().then(setHoldReasons).catch(console.warn);
  }, [loadServices]);

  // Load available transitions when selected service changes
  React.useEffect(() => {
    if (!selectedServiceUuid) return;
    workflowClient.getAvailableTransitions(selectedServiceUuid)
      .then((transitions) => {
        setAvailableTransitions(transitions || []);
        if (transitions && transitions.length > 0) {
          setTargetTransition(transitions[0].toCode);
        }
      })
      .catch(console.warn);
  }, [selectedServiceUuid]);

  const activeContractSvc = contractServices.find((s) => s.uuid === selectedServiceUuid);

  const handleExecuteTransition = async () => {
    if (!activeContractSvc || !targetTransition) return;
    setIsTransitioning(true);
    setTransitionMsg(null);
    try {
      const etag = (activeContractSvc as any)._etag || `W/"srv-${activeContractSvc.uuid}-live"`;
      const payload: any = {
        targetStatusCode: targetTransition,
      };
      if (targetTransition === 'on_hold') {
        payload.holdType = holdType;
        payload.holdReasonCode = holdReasonCode || (holdReasons[0]?.code || 'SYNTHETIC_CUSTOMER_AWAITING_INPUT');
      }
      await workflowClient.executeTransition(activeContractSvc.uuid, payload, etag);
      setTransitionMsg({
        type: 'success',
        text: `Successfully transitioned service ${activeContractSvc.uuid} to ${targetTransition} (HTTP 200 OK)`
      });
      await loadServices();
      const updatedTrans = await workflowClient.getAvailableTransitions(activeContractSvc.uuid);
      setAvailableTransitions(updatedTrans || []);
    } catch (err: any) {
      setTransitionMsg({
        type: 'error',
        text: err?.message || 'Failed to execute workflow transition.'
      });
    } finally {
      setIsTransitioning(false);
    }
  };

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

      {/* OpenAPI 3.0.3 Contract Services Lifecycle Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-cyan-200">
                  OpenAPI 3.0.3 Service Instances Lifecycle & Concurrency
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE PORT 3000
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: Q-B8..Q-B15 Concurrency (ETag/If-Match), Atomic On-Hold & F07 Payer Target
              </p>
            </div>
          </div>

          <Button 
            size="sm" 
            variant="outline"
            onClick={loadServices}
            className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Services</span>
          </Button>
        </div>

        {transitionMsg && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            transitionMsg.type === 'success'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
          }`}>
            {transitionMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <span>{transitionMsg.text}</span>
          </div>
        )}

        {/* Services Tabs / Select */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-1 space-y-2">
            <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              Attached Contract Services ({contractServices.length})
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {contractServices.map((svc) => (
                <button
                  key={svc.uuid}
                  type="button"
                  onClick={() => setSelectedServiceUuid(svc.uuid)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    selectedServiceUuid === svc.uuid
                      ? 'bg-cyan-600/30 border-cyan-400 text-white font-bold shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-cyan-300 truncate">{svc.uuid}</span>
                    <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                      {svc.status}
                    </span>
                  </div>
                  <div className="text-xs mt-1 truncate">
                    {(svc as any).name || 'Biomodel 3D Print'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    ${svc.lineTotal || svc.unitPrice} • Payer: {svc.billedPartyOrigin}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeContractSvc && (
            <div className="md:col-span-2 bg-slate-850/80 rounded-xl p-4 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-slate-400 text-[11px]">Selected Service: </span>
                  <span className="font-bold text-white">{(activeContractSvc as any).name || activeContractSvc.uuid}</span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-800">
                  Status: {activeContractSvc.status}
                </span>
              </div>

              {/* Transition Controller */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Authorized Contract Transitions (GET /api/v1/services/{activeContractSvc.uuid}/available-transitions)
                </label>
                {availableTransitions.length === 0 ? (
                  <div className="text-xs text-amber-300 py-1">No transitions available for current status.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((tr) => (
                      <button
                        key={tr.transitionId}
                        type="button"
                        onClick={() => setTargetTransition(tr.toCode)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          targetTransition === tr.toCode
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        }`}
                      >
                        {(tr as any).label || tr.toCode}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* On Hold Requirements (Q-B9) */}
              {targetTransition === 'on_hold' && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Mandatory Atomic On-Hold Payload (Q-B9 Rule)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Hold Type</label>
                      <select
                        value={holdType}
                        onChange={(e) => setHoldType(e.target.value as any)}
                        className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="customer">customer</option>
                        <option value="internal">internal</option>
                        <option value="lab">lab</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Hold Reason</label>
                      <select
                        value={holdReasonCode}
                        onChange={(e) => setHoldReasonCode(e.target.value)}
                        className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        {holdReasons.map((hr) => (
                          <option key={hr.code} value={hr.code}>
                            {hr.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Button */}
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={handleExecuteTransition}
                  disabled={isTransitioning || !targetTransition}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs gap-1.5"
                >
                  {isTransitioning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing Transition...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Execute POST /api/v1/services/{activeContractSvc.uuid}/transitions</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
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
