import React, { useState } from 'react';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  Lock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Layers,
  ChevronRight,
  Filter,
  Check,
  ArrowDown,
  Sparkles,
  Move
} from 'lucide-react';
import type { OrderStatus, Priority } from '@/shared/types';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { formatDate } from '@/shared/utils/format';
import { sound } from '@/shared/utils/sound';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

const STAGES: { id: OrderStatus; label: string; color: string; badgeColor: string }[] = [
  { id: 'New', label: 'New Intake', color: 'border-slate-400 bg-slate-500', badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'Review', label: 'Clinical Review', color: 'border-amber-400 bg-amber-500', badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'Design', label: 'CAD Design', color: 'border-purple-400 bg-purple-500', badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'Production', label: 'Milling & Print', color: 'border-blue-400 bg-blue-500', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'Quality Check', label: 'QC & Polish', color: 'border-pink-400 bg-pink-500', badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { id: 'Ready', label: 'Ready / Dispatch', color: 'border-emerald-400 bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'Completed', label: 'Delivered / Done', color: 'border-green-500 bg-green-600', badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }
];

export default function WorkflowBoard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const orders = useStore((s) => s.getOrders());
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<OrderStatus | null>(null);

  const handleStageChange = (orderId: string, newStatus: OrderStatus) => {
    store.updateOrderStatus(orderId, newStatus);
    const order = orders.find(o => o.id === orderId);
    setFeedback(`Case ${order?.orderNumber || orderId} moved to ${newStatus}`);
    sound.playSuccess();
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(orderId);
    sound.playPop();
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: OrderStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      handleStageChange(orderId, targetStatus);
    }
    setDraggedOrderId(null);
    setDragOverStage(null);
  };

  const activeCount = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workflow.title', 'Workflow Production Hub')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {activeCount} active cases in progress across the production pipeline
          </p>
        </div>

        {feedback && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Stage Selector Pills (Reflows cleanly without horizontal scrolling!) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedStage('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedStage === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60'
          }`}
        >
          <span>All Stages</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            selectedStage === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {orders.length}
          </span>
        </button>

        {STAGES.map((st) => {
          const count = orders.filter(o => o.status === st.id).length;
          const isSelected = selectedStage === st.id;

          return (
            <button
              key={st.id}
              onClick={() => setSelectedStage(st.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : st.color}`} />
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode 1: Specific Stage Filtered (Card Grid, 100% responsive, 0 horizontal scroll) */}
      {selectedStage !== 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{STAGES.find(s => s.id === selectedStage)?.label}</span>
              <span className="text-xs font-normal text-gray-400">
                ({orders.filter(o => o.status === selectedStage).length} cases)
              </span>
            </h2>
            <button
              onClick={() => setSelectedStage('all')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              ← Back to All Stages
            </button>
          </div>

          {orders.filter(o => o.status === selectedStage).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <Layers className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">No cases currently in this stage</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select another stage above to review active work orders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.filter(o => o.status === selectedStage).map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <PriorityBadge priority={order.priority} />
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                      {order.patientName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.restoration} • {order.arch} ({order.units || 1}u)
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                      {order.doctorName} • {order.clinicName}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400">
                      <span>Due: {formatDate(order.dueDate)}</span>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Quick Move Stage Select */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 shrink-0">Stage:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStageChange(order.id, e.target.value as OrderStatus)}
                        className="w-full text-xs py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Drag Feedback Banner */}
      {draggedOrderId && (
        <div className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-between shadow-lg shadow-cyan-500/20 animate-pulse">
          <div className="flex items-center gap-2">
            <Move size={15} />
            <span>Moving Case: {orders.find(o => o.id === draggedOrderId)?.orderNumber} • {orders.find(o => o.id === draggedOrderId)?.patientName}</span>
          </div>
          <span className="text-[11px] opacity-80 hidden sm:inline">Release mouse over destination column to reassign stage</span>
        </div>
      )}

      {/* Mode 2: All Stages Responsive Multi-Section Grid (0 Horizontal Scroll!) */}
      {selectedStage === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {STAGES.map((stage) => {
            const stageOrders = orders.filter(o => o.status === stage.id);
            const isTargetColumn = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm border flex flex-col overflow-hidden transition-all duration-200 ${
                  isTargetColumn
                    ? 'border-cyan-500 ring-4 ring-cyan-500/20 bg-cyan-50/20 dark:bg-cyan-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Stage Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <h2 className="font-bold text-sm text-gray-900 dark:text-white">{stage.label}</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {stageOrders.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 flex-1 min-h-[160px] max-h-[460px] overflow-y-auto custom-scrollbar relative">
                  {/* Dynamic Drop Zone Indicator */}
                  {isTargetColumn && draggedOrderId && (
                    <div className="p-3 rounded-xl border-2 border-dashed border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-2 text-xs font-bold animate-pulse shadow-inner">
                      <ArrowDown size={14} className="animate-bounce" />
                      <span>Drop Case into {stage.label}</span>
                    </div>
                  )}

                  {stageOrders.length === 0 && !isTargetColumn ? (
                    <div className="h-28 border-2 border-dashed border-gray-200 dark:border-gray-700/60 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      No cases in this stage
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const isBeingDragged = draggedOrderId === order.id;

                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onDragEnd={handleDragEnd}
                          className={`p-3.5 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? 'scale-[1.04] -rotate-1 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400 bg-white dark:bg-slate-800 border-cyan-400 opacity-95 z-30'
                              : 'bg-gray-50/80 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-800 border-gray-200/80 dark:border-gray-700/60 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <Link
                              to={`/orders/${order.id}`}
                              className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                            <PriorityBadge priority={order.priority} />
                          </div>

                          <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-0.5">{order.patientName}</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {order.restoration} • {order.arch} ({order.units || 1}u)
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/40 flex justify-between items-center text-[10px] text-gray-400">
                            <span className="truncate max-w-[120px]">{order.doctorName?.replace('Dr. ', '')}</span>

                            {/* Quick stage mover */}
                            <select
                              value={order.status}
                              onChange={(e) => handleStageChange(order.id, e.target.value as OrderStatus)}
                              className="text-[10px] py-0.5 px-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>{s.id}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
