import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileEdit,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  Save,
  ArrowLeft,
  CheckCircle2,
  Zap,
  RotateCcw,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { TeethChart } from '@/shared/components/TeethChart';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { store } from '@/shared/services/store';

export default function EditCasePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Target: task=EditCase&thisID=523486&rep=1&mod=1&conv=1&tp=1&sg=1...
  const thisID = searchParams.get('thisID') || '523486';

  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preloaded data for Case #523486
  const [doctorName, setDoctorName] = useState('Dr. Marcus Vance (NY Smile Center)');
  const [scanCenter, setScanCenter] = useState('Align Chicago Scanning Lab');
  const [patientName, setPatientName] = useState('Christopher Walken');
  const [patientDob, setPatientDob] = useState('1976-11-20');
  const [archType, setArchType] = useState<'Maxilla' | 'Mandible' | 'Dual Arch'>('Maxilla');
  const [guideSupport, setGuideSupport] = useState('Tooth-Supported');
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([3, 4, 5, 12, 13]);
  const [isRush, setIsRush] = useState(true);
  const [status, setStatus] = useState('Design');
  const [operator, setOperator] = useState('Alex M. (Senior CAD)');
  const [internalNotes, setInternalNotes] = useState(
    'Doctor requested 1.5mm offset on tooth #4 implant site for Straumann BLX 4.2mm sleeve. Cross-sections verified.'
  );

  const handleToothToggle = (toothNum: number) => {
    if (selectedTeeth.includes(toothNum)) {
      setSelectedTeeth(selectedTeeth.filter((t) => t !== toothNum));
    } else {
      setSelectedTeeth([...selectedTeeth, toothNum]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/flow')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Back to Production Flow"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                <FileEdit size={18} />
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Edit Case #{thisID}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25">
                ?task=EditCase&thisID={thisID}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prescription modifier • Adjust Co-Diagnostix parameters, tooth sites & internal comments
            </p>
          </div>
        </div>

        {/* State Switcher & Controls */}
        <div className="flex items-center gap-2">
          <UIStateSwitcher
            state={uiState}
            onChange={(s) => setUiState(s)}
            label="Edit State"
          />

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Modifications</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Changes successfully written to 3DDX database for Case #{thisID}!</span>
          </div>
          <button onClick={() => navigate('/flow')} className="underline">View in Flow →</button>
        </motion.div>
      )}

      {/* Simulated States */}
      {uiState === 'loading' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <LoadingState text={`Retrieving Master Prescription Records for Case #${thisID}...`} />
        </div>
      )}

      {uiState === 'error' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <ErrorState
            title="Lock Collision (409 Conflict)"
            message={`Case #${thisID} is currently open in exclusive edit mode by Operator 'Alex M.' in Co-Diagnostix.`}
            code="ERR_CASE_LOCK_CONFLICT_409"
            onRetry={() => setUiState('normal')}
          />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title="Record Purged from Database"
            description="The requested case was archived and purged."
            action={
              <button
                onClick={() => setUiState('normal')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Reload Default Case #523486
              </button>
            }
          />
        </div>
      )}

      {/* Normal Live State */}
      {uiState === 'normal' && (
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left 2 Cols: Form Parameters */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Doctor & Patient */}
              <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Patient & Clinician Prescription Identity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={patientDob}
                      onChange={(e) => setPatientDob(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Treating Clinician
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Scan Center Facility
                    </label>
                    <input
                      type="text"
                      value={scanCenter}
                      onChange={(e) => setScanCenter(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tooth Chart 1-32 */}
              <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Interactive Tooth Chart (1 - 32)
                  </h3>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    Sites: {selectedTeeth.sort((a,b)=>a-b).join(', ') || 'None'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <TeethChart
                    selectedTeeth={selectedTeeth}
                    onToggleTooth={handleToothToggle}
                    onClearAll={() => setSelectedTeeth([])}
                    onSelectionChange={(sel) => setSelectedTeeth(sel)}
                  />
                </div>
              </div>

              {/* Internal History & Instructions */}
              <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16} className="text-cyan-500" />
                  <span>Internal Prescription Instructions & Revision Log</span>
                </h3>

                <textarea
                  rows={4}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                />
              </div>

            </div>

            {/* Right Col: Production Stage & Operator Controls */}
            <div className="space-y-4 text-xs">
              <div className="bg-white dark:bg-[#0b101d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Production Workflow Status
                </h3>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Current Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="New">New Prescription</option>
                    <option value="Review">Radiology & DICOM Review</option>
                    <option value="Design">Co-Diagnostix Treatment Plan</option>
                    <option value="Production">CAM 3D Guide Printing</option>
                    <option value="Quality Check">Final QC Inspection</option>
                    <option value="Completed">Dispatched / Shipped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Assigned Senior Operator
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option>Alex M. (Senior CAD)</option>
                    <option>Sarah K. (Planner)</option>
                    <option>Omar H. (QC Lead)</option>
                    <option>Jessica L. (CAM Specialist)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="rushCase"
                    checked={isRush}
                    onChange={(e) => setIsRush(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <label htmlFor="rushCase" className="text-amber-500 font-bold flex items-center gap-1 cursor-pointer">
                    <Zap size={14} className="fill-amber-500" />
                    <span>Mark as Rush Priority (12h TAT)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Save & Apply Changes
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/flow')}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel & Return to Flow
                </button>
              </div>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
