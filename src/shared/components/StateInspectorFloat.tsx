import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Activity, 
  Inbox, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Button } from './Button';
import { sound } from '@/shared/utils/sound';

export function StateInspectorFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModalState, setActiveModalState] = useState<'loading' | 'empty' | 'error' | null>(null);

  const openState = (type: 'loading' | 'empty' | 'error') => {
    sound.playPop();
    setActiveModalState(type);
  };

  return (
    <>
      {/* Floating Trigger Pill in Bottom Corner */}
      <aside aria-label="Developer tools" className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { sound.playClick(); setIsOpen(!isOpen); }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 dark:bg-slate-800/90 text-white border border-slate-700/80 shadow-xl backdrop-blur-md cursor-pointer hover:border-cyan-500/50 transition-colors group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight">UI States Tester</span>
          <Sliders size={14} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
        </motion.button>
      </aside>

      {/* Floating Quick Action Drawer */}
      <AnimatePresence>
        {isOpen && (
          <aside aria-label="UI states tester panel" className="fixed bottom-18 right-5 z-40">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="w-72 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">State Showcase</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Preview the 3 essential application states in high-fidelity React components:
              </p>

              {/* State Triggers */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => openState('loading')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                      <Activity size={15} className="animate-spin" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                        Loading Status
                      </div>
                      <div className="text-[10px] text-slate-400">3D CAD scanner & mesh loader</div>
                    </div>
                  </div>
                  <Maximize2 size={12} className="text-slate-400 group-hover:text-cyan-500" />
                </button>

                <button
                  type="button"
                  onClick={() => openState('empty')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      <Inbox size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Empty Status
                      </div>
                      <div className="text-[10px] text-slate-400">No records / zero state guide</div>
                    </div>
                  </div>
                  <Maximize2 size={12} className="text-slate-400 group-hover:text-purple-500" />
                </button>

                <button
                  type="button"
                  onClick={() => openState('error')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                        Error Status
                      </div>
                      <div className="text-[10px] text-slate-400">Diagnostics, retry & telemetry</div>
                    </div>
                  </div>
                  <Maximize2 size={12} className="text-slate-400 group-hover:text-rose-500" />
                </button>
              </div>
            </motion.div>
          </aside>
        )}
      </AnimatePresence>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {activeModalState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => { sound.playClick(); setActiveModalState(null); }}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer z-10 transition-colors"
              >
                <X size={18} />
              </button>

              {/* State Content */}
              {activeModalState === 'loading' && (
                <LoadingState
                  text="Simulated CAD Rendering Pipeline..."
                  subtitle="Calculating marginal gap analysis and occlusal clearance map"
                  fullHeight
                />
              )}

              {activeModalState === 'empty' && (
                <EmptyState
                  title="No Restorations in Queue"
                  description="All scheduled CAD/CAM milling procedures for this laboratory batch are completed or unassigned."
                  suggestion="Use the 'New Order' flow to submit an intraoral STL/DICOM prescription."
                  action={
                    <Button 
                      variant="primary" 
                      onClick={() => { sound.playClick(); setActiveModalState(null); }}
                      className="cursor-pointer"
                    >
                      Return to Active Orders
                    </Button>
                  }
                />
              )}

              {activeModalState === 'error' && (
                <ErrorState
                  title="Lab Synchronizer Timeout (504)"
                  message="Failed to transmit 3D tessellation STL file to milling unit. Upstream proxy timed out."
                  code="ERR_MILL_LINK_TIMEOUT_504"
                  onRetry={() => {
                    setTimeout(() => setActiveModalState(null), 500);
                  }}
                  fullHeight
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
