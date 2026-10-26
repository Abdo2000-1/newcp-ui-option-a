import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FilePlus2,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  ArrowRight,
  ArrowLeft,
  Save,
  MessageSquare,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { TeethChart, type DentalServiceId, type RestorationType } from '@/shared/components/TeethChart';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { store } from '@/shared/services/store';
import { catalogClient, serviceClient } from '@/shared/api';
import { DynamicFormRenderer } from '@/shared/components/DynamicFormRenderer';
import type { FormAnswer } from '@/shared/api/contractTypes';
import type { CatalogService } from '@/shared/api/contractTypes';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';

export default function AddCase() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  // Multi-step navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  // Form State preserving ALL real fields from taskAddCase.php
  const [doctorName, setDoctorName] = useState('Dr. Marcus Vance (NY Smile Center)');
  const [scanCenter, setScanCenter] = useState('3DDX Boston Radiology Hub');
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientChartId, setPatientChartId] = useState('');
  const [patientDob, setPatientDob] = useState('1985-06-15');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [showErrors, setShowErrors] = useState(false);

  const isStep1Valid = Boolean(
    patientFirstName.trim() &&
    patientLastName.trim() &&
    patientChartId.trim()
  );

  // Arches & Services
  const [archSelection, setArchSelection] = useState<'Maxilla' | 'Mandible' | 'Dual Arch'>('Dual Arch');
  const [services, setServices] = useState({
    sg: true,       // Surgical Guide
    tp: true,       // Treatment Plan (Co-Diagnostix)
    mod: false,     // Model Work
    conv: true,     // DICOM CT Conversion
    rep: false,     // Radiology Report
    restTemp: false,// Temp Restoration
    restFinal: false,// Final Restoration
    vr: false,      // Virtual Reality
  });

  const [isRushExpress, setIsRushExpress] = useState(false);

  // Surgical Guide Specs
  const [guideSupport, setGuideSupport] = useState<'Tooth-Supported' | 'Bone-Supported' | 'Mucosa-Supported'>('Tooth-Supported');
  const [contractCatalog, setContractCatalog] = useState<CatalogService[]>([]);
  const [selectedCatalogUuid, setSelectedCatalogUuid] = useState<string>('00000000-0000-0000-0000-000000000004');
  const [dynamicAnswers, setDynamicAnswers] = useState<FormAnswer[]>([]);

  React.useEffect(() => {
    catalogClient.listServices().then((items) => {
      if (items && items.length > 0) {
        setContractCatalog(items);
      }
    }).catch(console.warn);
  }, []);
  const [sleeveBrand, setSleeveBrand] = useState('Straumann VeloGuide / Co-Diagnostix');
  const [includeFixationPins, setIncludeFixationPins] = useState(false);

  // Tooth Chart selections (Universal 1-32)
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([14, 15, 16]);
  const [toothProcedures, setToothProcedures] = useState<Record<number, RestorationType>>({
    14: 'implant',
    15: 'implant',
    16: 'crown'
  });
  const [toothActionCategory, setToothActionCategory] = useState<'implants' | 'missing' | 'extracted' | 'abutments' | 'crowns'>('implants');

  // Convert active services boolean map into DentalServiceId array
  const activeServiceIds = useMemo(() => {
    return Object.entries(services)
      .filter(([_, active]) => active)
      .map(([id]) => id as DentalServiceId);
  }, [services]);

  // Files
  const [dicomFile, setDicomFile] = useState<string | null>('Patient_CT_Scan_Volume.zip');
  const [upperStl, setUpperStl] = useState<string | null>('Upper_Arch_Intraoral.stl');
  const [lowerStl, setLowerStl] = useState<string | null>('Lower_Arch_Intraoral.stl');

  // Internal History Notes & Task Delegation (from taskAddCase.php)
  const [taskToGroup, setTaskToGroup] = useState('Co-Diagnostix Senior Planning Group');
  const [internalComment, setInternalComment] = useState('Verify nerve canal distance at tooth #19 site. Please use 3.5mm Straumann BLX sleeves.');

  // Form submission feedback
  const [submitting, setSubmitting] = useState(false);
  const [successCaseNumber, setSuccessCaseNumber] = useState<string | null>(null);

  // Prototype mock feedback & file replacement state (UIUX-REQ-016)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const dicomInputRef = useRef<HTMLInputElement>(null);
  const upperStlInputRef = useRef<HTMLInputElement>(null);
  const lowerStlInputRef = useRef<HTMLInputElement>(null);

  const handleResetForm = () => {
    setPatientFirstName('');
    setPatientLastName('');
    setPatientChartId('');
    setDoctorName('Dr. Marcus Vance (NY Smile Center)');
    setScanCenter('3DDX Boston Radiology Hub');
    setSelectedTeeth([14, 15, 16]);
    setDicomFile('Patient_CT_Scan_Volume.zip');
    setUpperStl('Upper_Arch_Intraoral.stl');
    setLowerStl('Lower_Arch_Intraoral.stl');
    setShowErrors(false);
    setCurrentStep(1);
    triggerToast('[MOCK] Prescription draft reset to initial values.');
  };

  const toggleService = (key: keyof typeof services) => {
    setServices((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToothToggle = (toothNum: number) => {
    if (selectedTeeth.includes(toothNum)) {
      setSelectedTeeth((prev) => prev.filter((t) => t !== toothNum));
      setToothProcedures((prev) => {
        const next = { ...prev };
        delete next[toothNum];
        return next;
      });
    } else {
      setSelectedTeeth((prev) => [...prev, toothNum]);
      setToothProcedures((prev) => ({ ...prev, [toothNum]: 'crown' }));
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (submitting) return;
    if (!isStep1Valid) {
      setShowErrors(true);
      setCurrentStep(1);
      return;
    }
    setSubmitting(true);

    setTimeout(() => {
      const newOrderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const fullName = `${patientFirstName.trim()} ${patientLastName.trim()}`.trim();
      
      store.createOrder({
        orderNumber: newOrderNum,
        patientName: fullName,
        doctorName: doctorName.split('(')[0].trim(),
        clinicName: scanCenter,
        restoration: guideSupport,
        shade: 'Universal',
        status: 'New',
        priority: isRushExpress ? 'Urgent' : 'Normal',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        amount: 485,
        notes: internalComment,
      });

      // Synchronize with OpenAPI 3.0.3 Contract Server (POST /api/v1/orders/:orderUuid/services)
      serviceClient.create(newOrderNum, {
        sellableItemUuid: selectedCatalogUuid,
        unitPrice: '250.00',
        quantity: 1,
        isBillable: true,
        answers: dynamicAnswers.length > 0 ? dynamicAnswers : [
          { fieldCode: 'guide_support', value: guideSupport },
          { fieldCode: 'sleeve_brand', value: sleeveBrand }
        ]
      }).catch(console.warn);

      setSubmitting(false);
      setSuccessCaseNumber(newOrderNum);
    }, 700);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* Mock action feedback notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xs transition-all"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 cursor-pointer font-bold"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FilePlus2 size={18} />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              3DDX Add New Case Prescription
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
              ?task=AddCase
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete dental surgical guide, model work & Co-Diagnostix treatment plan prescription
          </p>
        </div>

        {/* State Switcher for demonstration */}
        <div className="flex items-center gap-2">
          <UIStateSwitcher
            state={uiState}
            onChange={(s) => setUiState(s)}
            label="View State"
          />
        </div>
      </div>

      {/* Simulated States */}
      {uiState === 'loading' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <LoadingState text="Loading 3DDX Prescription Master Catalog..." />
        </div>
      )}

      {uiState === 'error' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <ErrorState
            title="Surgical Protocol Error"
            message="Failed to validate implant sleeve library against Co-Diagnostix database."
            code="ERR_SLEEVE_LIB_INVALID"
            onRetry={() => setUiState('normal')}
          />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title="Form Reset State"
            description="The prescription form has no unsaved draft data."
            suggestion="Click start to begin entering patient and scan details."
            action={
              <button
                onClick={() => setUiState('normal')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Open Prescription Form
              </button>
            }
          />
        </div>
      )}

      {/* Normal State: Interactive Add Case Form */}
      {uiState === 'normal' && (
        <>
          {successCaseNumber ? (
            /* Success confirmation card */
            <div className="bg-white dark:bg-[#0b101d] p-8 rounded-2xl border border-emerald-500/30 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Case Successfully Created & Transmitted!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Case <strong className="text-cyan-600 font-mono">{successCaseNumber}</strong> has been routed to the <strong>{taskToGroup}</strong> queue for Co-Diagnostix planning.
              </p>
              <div className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 rounded-xl p-2.5 max-w-md mx-auto">
                [MOCK / NOT_INTEGRATED] Prototype demonstration: order record stored in local browser state only. No remote PACS transmission or billing integration was performed.
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/flow')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  View in Production Flow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessCaseNumber(null);
                    setShowErrors(false);
                    setPatientFirstName('');
                    setPatientLastName('');
                    setPatientChartId('');
                    setCurrentStep(1);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Create Another Case
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
              
              {/* Stepper Progress Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { num: 1, title: t('addCase.step1', 'Clinician & Patient') },
                    { num: 2, title: t('addCase.step2', 'Services & Guide Specs') },
                    { num: 3, title: t('addCase.step3', 'Teeth Chart (1-32)') },
                    { num: 4, title: t('addCase.step4', 'Scans & Internal Notes') },
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        if (s.num > 1 && !isStep1Valid) {
                          setShowErrors(true);
                          return;
                        }
                        setCurrentStep(s.num);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        currentStep === s.num
                          ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                          : currentStep > s.num
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 opacity-60'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStep === s.num
                          ? 'bg-cyan-500 text-slate-950'
                          : currentStep > s.num
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {currentStep > s.num ? '✓' : s.num}
                      </div>
                      <span className="text-xs font-bold hidden sm:inline">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={(e) => e.preventDefault()} className="p-5 space-y-6">
                
                {/* STEP 1: Clinician & Patient Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Stethoscope size={16} className="text-cyan-500" />
                      <span>Clinician & Scan Diagnostic Center</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Doctor / Treating Clinician *
                        </label>
                        <select
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option>Dr. Marcus Vance (NY Smile Center)</option>
                          <option>Dr. Sarah Jenkins (Boston Maxillofacial)</option>
                          <option>Dr. Alan Turing (Advanced Implantology)</option>
                          <option>Dr. Elena Rostova (Chicago Dental Studio)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Scan Center / Receiving Facility *
                        </label>
                        <select
                          value={scanCenter}
                          onChange={(e) => setScanCenter(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option>3DDX Boston Radiology Hub</option>
                          <option>Align Chicago Scanning Lab</option>
                          <option>Dallas Imaging & CAD Facility</option>
                          <option>NYC Dental Diagnostics Hub</option>
                        </select>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <User size={16} className="text-cyan-500" />
                      <span>Patient Medical Record</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label htmlFor="patientFirstName" className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          First Name *
                        </label>
                        <Box
                          component="input"
                          id="patientFirstName"
                          type="text"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(showErrors && !patientFirstName.trim())}
                          aria-describedby={showErrors && !patientFirstName.trim() ? "patientFirstName-error" : undefined}
                          value={patientFirstName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientFirstName(e.target.value)}
                          placeholder="e.g. Michael"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          sx={showErrors && !patientFirstName.trim() ? {
                            borderColor: 'error.main !important',
                            boxShadow: (theme) => `0 0 0 1px ${theme.palette.error.main}`,
                          } : undefined}
                        />
                        {showErrors && !patientFirstName.trim() && (
                          <FormHelperText error id="patientFirstName-error" role="alert" sx={{ mx: 0, mt: 0.5 }}>
                            {t('validation.firstNameRequired', 'First name is required')}
                          </FormHelperText>
                        )}
                      </div>

                      <div>
                        <label htmlFor="patientLastName" className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Last Name *
                        </label>
                        <Box
                          component="input"
                          id="patientLastName"
                          type="text"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(showErrors && !patientLastName.trim())}
                          aria-describedby={showErrors && !patientLastName.trim() ? "patientLastName-error" : undefined}
                          value={patientLastName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientLastName(e.target.value)}
                          placeholder="e.g. Henderson"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          sx={showErrors && !patientLastName.trim() ? {
                            borderColor: 'error.main !important',
                            boxShadow: (theme) => `0 0 0 1px ${theme.palette.error.main}`,
                          } : undefined}
                        />
                        {showErrors && !patientLastName.trim() && (
                          <FormHelperText error id="patientLastName-error" role="alert" sx={{ mx: 0, mt: 0.5 }}>
                            {t('validation.lastNameRequired', 'Last name is required')}
                          </FormHelperText>
                        )}
                      </div>

                      <div>
                        <label htmlFor="patientChartId" className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Patient Chart ID / PACS ID *
                        </label>
                        <Box
                          component="input"
                          id="patientChartId"
                          type="text"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(showErrors && !patientChartId.trim())}
                          aria-describedby={showErrors && !patientChartId.trim() ? "patientChartId-error" : undefined}
                          value={patientChartId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientChartId(e.target.value)}
                          placeholder="e.g. PT-99210"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          sx={showErrors && !patientChartId.trim() ? {
                            borderColor: 'error.main !important',
                            boxShadow: (theme) => `0 0 0 1px ${theme.palette.error.main}`,
                          } : undefined}
                        />
                        {showErrors && !patientChartId.trim() && (
                          <FormHelperText error id="patientChartId-error" role="alert" sx={{ mx: 0, mt: 0.5 }}>
                            {t('validation.chartIdRequired', 'Patient Chart ID / PACS ID is required')}
                          </FormHelperText>
                        )}
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
                          Gender
                        </label>
                        <select
                          value={patientGender}
                          onChange={(e) => setPatientGender(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="rush"
                          checked={isRushExpress}
                          onChange={(e) => setIsRushExpress(e.target.checked)}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                        />
                        <label htmlFor="rush" className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-pointer">
                          <Zap size={14} className="fill-amber-500" />
                          <span>Express Rush Case (12h TAT Priority)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Services & Surgical Guide Specs */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers size={16} className="text-cyan-500" />
                      <span>Services Selection & Surgical Specs</span>
                    </h3>

                    {/* Arch Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Dental Arch Focus
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Maxilla', 'Mandible', 'Dual Arch'] as const).map((arch) => (
                          <button
                            key={arch}
                            type="button"
                            onClick={() => setArchSelection(arch)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              archSelection === arch
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {arch}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live OpenAPI 3.0.3 Master Catalog */}
                    <div className="p-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/5 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 uppercase tracking-wider">
                            Live OpenAPI 3.0.3 Master Catalog (GET /api/v1/catalog/services)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-cyan-200/50 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded font-bold">
                          HTTP 200 OK
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Select an authorized clinical service from the live contract catalogue to prescribe for this case:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {contractCatalog.map((item) => (
                          <button
                            key={item.uuid}
                            type="button"
                            onClick={() => setSelectedCatalogUuid(item.uuid)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              selectedCatalogUuid === item.uuid
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400'
                            }`}
                          >
                            <div className="text-[10px] uppercase font-mono font-bold opacity-75">{item.code}</div>
                            <div className="text-xs font-bold mt-0.5 truncate">{item.name}</div>
                            <div className="text-[11px] mt-1 opacity-90 flex items-center justify-between">
                              <span>{(item as any).categoryCode || item.workflowCode || 'clinical'}</span>
                              <span className="font-mono text-[10px]">{item.leadTimeDays}d lead</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Form Questionnaire according to OpenAPI Schema */}
                      <div className="mt-4">
                        <DynamicFormRenderer
                          serviceUuid={selectedCatalogUuid}
                          onChange={(ans) => setDynamicAnswers(ans)}
                        />
                      </div>
                    </div>

                    {/* Services Checkbox Grid */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Prescribed 3DDX Services
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[
                          { id: 'sg', label: 'Surgical Guide (SG)' },
                          { id: 'tp', label: 'Treatment Plan (TP)' },
                          { id: 'conv', label: 'DICOM Conversion' },
                          { id: 'mod', label: 'Model Work (MOD)' },
                          { id: 'rep', label: 'Radiology Report' },
                          { id: 'restTemp', label: 'Temp Restoration' },
                          { id: 'restFinal', label: 'Final Restoration' },
                          { id: 'vr', label: 'Virtual Reality VR' },
                        ].map((srv) => (
                          <label
                            key={srv.id}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                              services[srv.id as keyof typeof services]
                                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-800 dark:text-cyan-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={services[srv.id as keyof typeof services]}
                              onChange={() => toggleService(srv.id as keyof typeof services)}
                              className="w-3.5 h-3.5 text-cyan-600 rounded"
                            />
                            <span>{srv.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Surgical Guide Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Guide Support Topology
                        </label>
                        <select
                          value={guideSupport}
                          onChange={(e) => setGuideSupport(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option>Tooth-Supported</option>
                          <option>Bone-Supported</option>
                          <option>Mucosa-Supported</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Implant Sleeve Master Library
                        </label>
                        <select
                          value={sleeveBrand}
                          onChange={(e) => setSleeveBrand(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option>Straumann VeloGuide / Co-Diagnostix</option>
                          <option>Nobel Biocare Guided Surgery</option>
                          <option>BioHorizons Guided Surgery</option>
                          <option>Zimmer Biomet Navigator</option>
                          <option>Custom Universal Stepped Sleeves</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Tooth Chart 1-32 */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Universal Dental Numbering (Teeth 1 - 32)</span>
                      </h3>
                      <span className="text-xs font-mono font-bold text-[#0284c7] dark:text-sky-400">
                        {selectedTeeth.length} Teeth Selected
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Pick your active tool below (Crown, Implant, Missing, Bridge) and click on any tooth to assign. Clicking an assigned tooth with the same tool unselects it.
                    </p>

                    {/* Visual Teeth Chart */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <TeethChart
                        selectedTeeth={selectedTeeth}
                        activeServices={activeServiceIds}
                        toothRestorations={toothProcedures}
                        archFocus={archSelection === 'Maxilla' ? 'upper' : archSelection === 'Mandible' ? 'lower' : 'both'}
                        onToggleTooth={handleToothToggle}
                        onClearAll={() => {
                          setSelectedTeeth([]);
                          setToothProcedures({});
                        }}
                        onSelectionChange={(sel, restorations) => {
                          setSelectedTeeth(sel);
                          if (restorations) {
                            setToothProcedures(restorations);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Scans, Internal History Notes & Final Confirmation */}
                {currentStep === 4 && (
                  <div className="space-y-4 text-xs">
                    {/* Clinical Order Verification Summary */}
                    <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 space-y-2">
                      <div className="flex items-center justify-between font-bold text-sky-800 dark:text-sky-300">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <Sparkles size={14} className="text-sky-500" />
                          Final Clinical Case Review
                        </span>
                        <span className="font-mono text-xs">{selectedTeeth.length} Teeth Selected</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-sky-200/60 dark:border-sky-800/40">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Patient</span>
                          <strong className="text-slate-900 dark:text-white">
                            {patientFirstName.trim() && patientLastName.trim()
                              ? `${patientFirstName.trim()} ${patientLastName.trim()}`
                              : '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Clinician</span>
                          <strong className="text-slate-900 dark:text-white truncate block">{doctorName.split('(')[0]}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Guide Support</span>
                          <strong className="text-slate-900 dark:text-white">{guideSupport}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Target Teeth & Procedures</span>
                          <strong className="text-[#0284c7] font-mono block truncate" title={selectedTeeth.map(t => `#${t} (${toothProcedures[t] || 'crown'})`).join(', ')}>
                            {selectedTeeth.length > 0
                              ? selectedTeeth.sort((a,b)=>a-b).map(t => `#${t} (${toothProcedures[t] || 'crown'})`).join(', ')
                              : 'General / Non-Specific'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <UploadCloud size={16} className="text-[#0284c7]" />
                      <span>Diagnostic Scan Uploads & PACS Links</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                        <input
                          type="file"
                          ref={dicomInputRef}
                          className="hidden"
                          accept=".zip,.dcm,.tar.gz"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDicomFile(file.name);
                              triggerToast(`[MOCK / NOT_INTEGRATED] Replaced DICOM volume with: ${file.name}`);
                            }
                          }}
                        />
                        <div className="font-bold text-slate-900 dark:text-white">DICOM CT Volume</div>
                        <span className="text-[10px] text-cyan-600 font-mono block mt-1">{dicomFile}</span>
                        <button
                          type="button"
                          onClick={() => dicomInputRef.current?.click()}
                          className="mt-2 text-[10px] text-slate-500 hover:text-cyan-500 font-semibold cursor-pointer underline-offset-2 hover:underline"
                        >
                          Replace Scan
                        </button>
                      </div>

                      <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                        <input
                          type="file"
                          ref={upperStlInputRef}
                          className="hidden"
                          accept=".stl,.ply,.obj"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUpperStl(file.name);
                              triggerToast(`[MOCK / NOT_INTEGRATED] Replaced Upper Optical Scan with: ${file.name}`);
                            }
                          }}
                        />
                        <div className="font-bold text-slate-900 dark:text-white">Upper Optical Scan</div>
                        <span className="text-[10px] text-emerald-600 font-mono block mt-1">{upperStl}</span>
                        <button
                          type="button"
                          onClick={() => upperStlInputRef.current?.click()}
                          className="mt-2 text-[10px] text-slate-500 hover:text-cyan-500 font-semibold cursor-pointer underline-offset-2 hover:underline"
                        >
                          Replace STL
                        </button>
                      </div>

                      <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                        <input
                          type="file"
                          ref={lowerStlInputRef}
                          className="hidden"
                          accept=".stl,.ply,.obj"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLowerStl(file.name);
                              triggerToast(`[MOCK / NOT_INTEGRATED] Replaced Lower Optical Scan with: ${file.name}`);
                            }
                          }}
                        />
                        <div className="font-bold text-slate-900 dark:text-white">Lower Optical Scan</div>
                        <span className="text-[10px] text-emerald-600 font-mono block mt-1">{lowerStl}</span>
                        <button
                          type="button"
                          onClick={() => lowerStlInputRef.current?.click()}
                          className="mt-2 text-[10px] text-slate-500 hover:text-cyan-500 font-semibold cursor-pointer underline-offset-2 hover:underline"
                        >
                          Replace STL
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <MessageSquare size={16} className="text-[#0284c7]" />
                      <span>Internal History & Task Delegation (taskAddCase.php)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Assign Initial Task To Group
                        </label>
                        <select
                          value={taskToGroup}
                          onChange={(e) => setTaskToGroup(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option>Co-Diagnostix Senior Planning Group</option>
                          <option>DICOM Segmentation & Conversion Unit</option>
                          <option>CAM 3D Guide Printing Lab</option>
                          <option>Senior Radiologist Review Team</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Internal Prescription Instructions
                        </label>
                        <textarea
                          rows={3}
                          value={internalComment}
                          onChange={(e) => setInternalComment(e.target.value)}
                          placeholder="Special anatomical considerations, sleeve offsets, prosthetic clearances..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Stepper Footer Controls */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>{t('addCase.previous', 'Previous Step')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                      title="Reset form fields to default"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Draft</span>
                    </button>
                  </div>

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep === 1 && !isStep1Valid) {
                          setShowErrors(true);
                          return;
                        }
                        setCurrentStep(currentStep + 1);
                      }}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <span>{t('addCase.continue', 'Continue')}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save size={15} />
                      <span>{submitting ? 'Transmitting to 3DDX PACS...' : t('addCase.submit', 'Submit & Transmit Case')}</span>
                    </button>
                  )}
                </div>

              </form>
            </div>
          )}
        </>
      )}

    </div>
  );
}
