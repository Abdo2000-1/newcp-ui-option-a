import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Eye,
  Activity,
  FileCheck,
  Shield,
  Box,
  MessageSquare,
  Send,
  Zap,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  Printer,
  Mail,
  Share2,
  Paperclip,
  CheckSquare,
  Square,
  Radio,
  Circle,
  CircleDot,
  Trash2,
  X,
  Copy,
  ExternalLink,
  ChevronRight,
  Save,
  FileUp,
  AlertCircle,
  Phone
} from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { Button } from '@/shared/components/Button';
import { DicomMprViewer } from '@/features/conversion/components/DicomMprViewer';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { MASTER_WORKFLOW_ORDERS, MasterWorkflowOrder, SubServiceItem } from '@/shared/data/flowMockData';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import type { OrderStatus, Priority } from '@/shared/types';

interface UploadedFileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
}

interface CaseNoteItem {
  id: number;
  by: string;
  to: string;
  timeSent: string;
  history: string;
  attach: string;
  attachContent?: string;
}

export default function OrderDetailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // URL Params matching: OrderDetails.php?xid=1016;reg=1;u=1;modID=288004;ID=504901 or ?ID=504901 or ?id=ord-1
  const paramId = searchParams.get('ID') || searchParams.get('id');
  const modId = searchParams.get('modID') || '288004';
  const xid = searchParams.get('xid') || '1016';

  const storeOrders = useStore((s) => s.getOrders());

  // Find matching case in MASTER_WORKFLOW_ORDERS or store orders
  const flowOrder: MasterWorkflowOrder | undefined = useMemo(() => {
    if (!paramId) return undefined;

    // 1. Search in MASTER_WORKFLOW_ORDERS
    const wfMatch = MASTER_WORKFLOW_ORDERS.find(
      (o) =>
        o.orderNum === paramId ||
        o.id === paramId ||
        o.orderNum.toLowerCase() === paramId.toLowerCase() ||
        o.id.toLowerCase() === paramId.toLowerCase()
    );
    if (wfMatch) return wfMatch;

    // 2. Search in store orders (by id or orderNumber)
    const stMatch =
      storeOrders.find(
        (o) =>
          o.id === paramId ||
          o.orderNumber === paramId ||
          o.id.toLowerCase() === paramId.toLowerCase() ||
          o.orderNumber.toLowerCase() === paramId.toLowerCase()
      ) || store.getOrderById(paramId);

    if (stMatch) {
      const scanCenterLabel = stMatch.scanCenterName || stMatch.clinicName || 'Not available';
      const doctorLabel = stMatch.doctorName || 'Not available';
      const patientLabel = stMatch.patientName || 'Not available';
      const serviceTitle = stMatch.restoration
        ? (stMatch.arch ? `${stMatch.restoration} (${stMatch.arch})` : stMatch.restoration)
        : 'Not available';
      const billToLabel = stMatch.billTo || stMatch.clinicName || 'Not available';
      const serviceAmount = typeof stMatch.amount === 'number' ? stMatch.amount : (null as any);

      return {
        id: stMatch.id,
        serial: 1,
        orderNum: stMatch.orderNumber || stMatch.id,
        source: 'Via CP',
        scanCenter: scanCenterLabel,
        doctorName: doctorLabel,
        doctorSub: stMatch.doctorName ? 'DDS' : '',
        patientName: patientLabel,
        patientSub: stMatch.patientId || '',
        isLocked: Boolean(stMatch.isLocked),
        notes: stMatch.notes || '',
        archiveDate: stMatch.archiveDate || '',
        services: [
          {
            id: `srv-${stMatch.id}`,
            type: stMatch.restoration || 'Not available',
            typeCode: (stMatch.restoration ? stMatch.restoration.slice(0, 2) : 'N/A').toUpperCase(),
            title: serviceTitle,
            subtitle: stMatch.format || '',
            billTo: billToLabel,
            maxilla: stMatch.arch === 'Maxilla' || stMatch.arch === 'Both' ? 'Yes' : 'No',
            mandible: stMatch.arch === 'Mandible' || stMatch.arch === 'Both' ? 'Yes' : 'No',
            format: stMatch.format || 'Not available',
            amount: serviceAmount,
            vouchers: stMatch.vouchers !== undefined ? String(stMatch.vouchers) : '0',
            receivedTime: stMatch.receivedAt || '',
            sentTime: stMatch.sentAt || '',
            updateTime: stMatch.updatedAt || '',
            chargedOn: stMatch.chargedAt || '',
            hasActionAlert: stMatch.priority === 'Urgent',
            actionLabel: stMatch.status || 'Not available',
            changeRequest: stMatch.changeRequest || 'Not available',
            csTask: {
              status: 'Assign',
              assignee: stMatch.csTask || undefined,
            },
          },
        ],
      };
    }

    return undefined;
  }, [paramId, storeOrders]);

  // Isolated MOCK demo notes for static demo case #504901
  const DEMO_504901_OLD_NOTES: CaseNoteItem[] = [
    {
      id: 1,
      by: 'shrouk',
      to: 'CS',
      timeSent: '2026/Sep/28 02:14',
      history: '@cs please call the dr to check for the office working hours',
      attach: 'View',
      attachContent: 'Doctor Office Hours Verification Report:\nOffice is open Mon-Thu 08:00 AM - 05:00 PM.\nFront desk contact: Nurse Amanda.'
    },
    {
      id: 2,
      by: 'shrouk',
      to: 'CS',
      timeSent: '2026/Sep/28 02:13',
      history: 'test add IH',
      attach: '-'
    },
    {
      id: 3,
      by: 'Marcus Vance',
      to: 'TP',
      timeSent: '2026/Sep/27 18:40',
      history: 'CBCT DICOM series aligned with optical intra-oral maxilla STL. Nerve tracing confirmed.',
      attach: 'View',
      attachContent: 'CAD Alignment Log:\nCBCT FOV: 8x8 cm\nVoxel size: 0.15 mm\nMesh Deviation: < 0.08 mm (Passed QMS validation).'
    }
  ];

  // The primary service title serves as the main hook
  const primaryService = flowOrder?.services[0] || {
    id: 'srv-default',
    type: 'Not available',
    typeCode: 'N/A',
    title: 'Not available',
    subtitle: '',
    format: 'Not available',
    actionLabel: 'Not available',
    amount: null as any,
    billTo: 'Not available',
    maxilla: 'No',
    mandible: 'No',
    vouchers: '0',
    receivedTime: '',
    sentTime: '',
    updateTime: '',
    chargedOn: '',
    hasActionAlert: false,
    changeRequest: 'Not available',
    csTask: {
      status: 'Assign' as const,
    },
  };

  const [activeTab, setActiveTab] = useState<'prescription' | '3dviewer' | 'suborders'>('prescription');
  const [orderStatus, setOrderStatus] = useState<string>(primaryService?.actionLabel || 'Not available');
  const [isCopiedId, setIsCopiedId] = useState<boolean>(false);

  // Core Form Fields
  const [doctorName, setDoctorName] = useState<string>(flowOrder?.doctorName || 'Not available');
  const [patientName, setPatientName] = useState<string>(flowOrder?.patientName || 'Not available');
  const [scanCenter, setScanCenter] = useState<string>(flowOrder?.scanCenter || 'Not available');

  const isInitialDemo = flowOrder?.orderNum === '504901' || flowOrder?.id === '504901';
  const [drSpecialRequest, setDrSpecialRequest] = useState<string>(
    isInitialDemo ? 'Immediate implant placement planned on site #19. Ensure 2mm safety margin from mandibular canal.' : (flowOrder?.notes || '')
  );
  const [scSpecialRequest, setScSpecialRequest] = useState<string>(isInitialDemo ? 'General' : 'None');
  const [scSpecialValue, setScSpecialValue] = useState<string>('0');
  const [clientNote, setClientNote] = useState<string>(
    isInitialDemo ? 'Please send digital STL plan approval link before milling guide.' : ''
  );
  const [registrationType, setRegistrationType] = useState<'option1' | 'option2'>('option1');
  const [specialPreShippingOld, setSpecialPreShippingOld] = useState<string>(
    isInitialDemo ? 'Standard courier delivery to main clinic address. Signature required on receipt.' : ''
  );
  const [specialPreShippingNew, setSpecialPreShippingNew] = useState<string>('');
  const [oldNotes, setOldNotes] = useState<CaseNoteItem[]>(
    isInitialDemo ? DEMO_504901_OLD_NOTES : []
  );

  useEffect(() => {
    if (flowOrder) {
      setDoctorName(flowOrder.doctorName || 'Not available');
      setPatientName(flowOrder.patientName || 'Not available');
      setScanCenter(flowOrder.scanCenter || 'Not available');
      setOrderStatus(flowOrder.services[0]?.actionLabel || 'Not available');

      const isCurrentDemo = flowOrder.orderNum === '504901' || flowOrder.id === '504901';
      if (isCurrentDemo) {
        setDrSpecialRequest('Immediate implant placement planned on site #19. Ensure 2mm safety margin from mandibular canal.');
        setScSpecialRequest('General');
        setScSpecialValue('0');
        setClientNote('Please send digital STL plan approval link before milling guide.');
        setSpecialPreShippingOld('Standard courier delivery to main clinic address. Signature required on receipt.');
        setOldNotes(DEMO_504901_OLD_NOTES);
      } else {
        setDrSpecialRequest(flowOrder.notes || '');
        setScSpecialRequest('None');
        setScSpecialValue('0');
        setClientNote('');
        setSpecialPreShippingOld('');
        setOldNotes([]);
      }
    }
  }, [flowOrder]);

  // Composer Form State for New Internal Case Note
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [mailToSelected, setMailToSelected] = useState<Set<string>>(new Set(['CS', 'TP']));
  const [ihTaskSelected, setIhTaskSelected] = useState<string>('CS');
  const [isRushTask, setIsRushTask] = useState<boolean>(false);
  const [attachedNoteFileName, setAttachedNoteFileName] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Preview Modal State
  const [activePreviewDoc, setActivePreviewDoc] = useState<{ title: string; content: string; type: string } | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteAttachmentInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFilesList, setUploadedFilesList] = useState<UploadedFileItem[]>([
    { id: 'f-1', name: `${(flowOrder?.patientName || 'Patient').replace(/\s+/g, '_')}_CBCT_Raw.zip`, size: '142 MB', type: 'DICOM Archive', uploadDate: '2026-09-28 09:15' },
    { id: 'f-2', name: 'Maxilla_Optical_Scan.stl', size: '18 MB', type: 'STL Mesh', uploadDate: '2026-09-28 09:20' },
    { id: 'f-3', name: 'Mandible_Optical_Scan.stl', size: '16 MB', type: 'STL Mesh', uploadDate: '2026-09-28 09:22' }
  ]);

  // Departments for 'Send mail to' (12 options from Image 1)
  const MAIL_DEPARTMENTS = [
    'CS', 'Sales', 'TP', 'Ops', 'Finance', 'Guides',
    'Restorations', 'Production', 'Boston', 'Scanning Techs', 'CAD/CAM', 'QMS'
  ];

  // Departments for 'Send IH task' (11 options from Image 1)
  const IH_TASK_DEPARTMENTS = [
    'CS', 'Sales', 'TP', 'Ops', 'Finance', 'Guides assembly',
    'Restorations EG', 'Production', 'Boston', 'Scanning Techs', 'CAD/CAM'
  ];

  const triggerToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const copyOrderId = () => {
    if (!flowOrder) return;
    const orderNum = flowOrder.orderNum;
    navigator.clipboard.writeText(orderNum);
    setIsCopiedId(true);
    triggerToast(`Order ID #${orderNum} copied to clipboard!`);
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  const toggleMailDept = (dept: string) => {
    setMailToSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const selectAllMail = () => {
    setMailToSelected(new Set(MAIL_DEPARTMENTS));
    triggerToast('All 12 notification departments selected.');
  };

  const clearAllMail = () => {
    setMailToSelected(new Set());
    triggerToast('All email notification recipients cleared.');
  };

  const applyTemplate = (text: string) => {
    setNewInternalNote((prev) => (prev ? `${prev} - ${text}` : text));
  };

  const handlePostInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) {
      triggerToast('Please write a message before dispatching!');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${now.toLocaleString('en', { month: 'short' })}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry: CaseNoteItem = {
      id: Date.now(),
      by: 'You (Current CS Agent)',
      to: ihTaskSelected,
      timeSent: formattedDate,
      history: `${isRushTask ? '[⚡ RUSH] ' : ''}${newInternalNote.trim()}`,
      attach: attachedNoteFileName ? 'View' : '-',
      attachContent: attachedNoteFileName
        ? `Attached Document: ${attachedNoteFileName}\nDispatched with Task to ${ihTaskSelected}.\nNotes: ${newInternalNote.trim()}`
        : undefined
    };

    setOldNotes([newEntry, ...oldNotes]);
    setNewInternalNote('');
    setAttachedNoteFileName('');
    triggerToast(`Dispatched to IH [${ihTaskSelected}] and emailed [${Array.from(mailToSelected).join(', ')}]!`);
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUpload = selectedFileName.trim();
    if (!nameToUpload) {
      triggerToast('Please select or enter a file name first!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          const now = new Date();
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newFile: UploadedFileItem = {
            id: `f-${Date.now()}`,
            name: nameToUpload.includes('.') ? nameToUpload : `${nameToUpload}.stl`,
            size: '22.4 MB',
            type: nameToUpload.toLowerCase().endsWith('.zip') ? 'Archive' : '3D Model',
            uploadDate: dateStr
          };

          setUploadedFilesList([newFile, ...uploadedFilesList]);
          setSelectedFileName('');
          triggerToast(`File "${newFile.name}" successfully uploaded and registered!`);
          return 0;
        }
        return p + 30;
      });
    }, 150);
  };

  const handleDeleteFile = (id: string, name: string) => {
    setUploadedFilesList((prev) => prev.filter((f) => f.id !== id));
    triggerToast(`File "${name}" removed from order.`);
  };

  const handleDownloadFile = (fileName: string) => {
    if (!flowOrder) return;
    const { orderNum, patientName: ptName, doctorName: docName } = flowOrder;
    const dummyContent = `3D Diagnostix Case Asset: ${fileName}\nOrder ID: ${orderNum}\nPatient: ${ptName}\nClinician: ${docName}\nExported on: ${new Date().toISOString()}`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.txt') || fileName.endsWith('.stl') || fileName.endsWith('.zip') ? fileName : `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Download started for ${fileName}`);
  };

  const handleSaveShippingInstruction = () => {
    if (!specialPreShippingNew.trim()) {
      triggerToast('Please type new shipping instructions before saving!');
      return;
    }
    setSpecialPreShippingOld(specialPreShippingNew.trim());
    setSpecialPreShippingNew('');
    triggerToast('Special Pre-Shipping instructions updated!');
  };

  const exportCaseSummary = () => {
    if (!flowOrder) return;
    const activeOrder = flowOrder;
    const summary = `3D DIAGNOSTIX CLINICAL CASE SUMMARY
=========================================
Order ID: #${activeOrder.orderNum}
Status: ${orderStatus}
Primary Service: ${primaryService.title} (${primaryService.format || 'Not available'})
Doctor: ${doctorName}
Patient: ${patientName}
Scanning Center: ${scanCenter}
Dr. Special Request: ${drSpecialRequest || 'Not available'}
Client Note: ${clientNote || 'Not available'}
Registration Type: ${registrationType.toUpperCase()}
Shipping Instructions: ${specialPreShippingOld || 'Not available'}
Active Modules: ${activeOrder.services.map((s) => `${s.typeCode}: ${s.title} (${typeof s.amount === 'number' ? `$${s.amount}` : 'Not available'})`).join(', ')}
Total Value: ${activeOrder.services.some(s => typeof s.amount === 'number') ? `$${activeOrder.services.reduce((a, s) => a + (typeof s.amount === 'number' ? s.amount : 0), 0)}.00 USD` : 'Not available'}
Generated on: ${new Date().toLocaleString()}
`;
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Case_${activeOrder.orderNum}_Prescription_Summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Prescription summary downloaded successfully!');
  };

  if (!flowOrder) {
    return (
      <div className="space-y-4 w-full min-w-0 pb-16 select-none">
        <div className="flex items-center gap-3 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Order Details
          </h1>
        </div>

        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title="Order Not Found"
            description={
              paramId
                ? `No clinical order or case could be found matching identifier "${paramId}".`
                : "No order identifier was specified in the request."
            }
            suggestion="Verify the order number or navigate from the Dashboard or Production Flow."
            action={
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0 pb-16 select-none">

      {/* ------------------------------------------------------------------ */}
      {/* 1. PRIMARY EYE HOOK: REFINED FOR BOTH LIGHT & DARK MODES           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-sky-50/90 via-white to-blue-50/70 dark:from-sky-950/40 dark:via-[#0b101d] dark:to-slate-900/60 p-5 rounded-2xl border border-sky-200 dark:border-sky-500/30 shadow-sm dark:shadow-xl space-y-3 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div className="space-y-2">
            {/* Badges Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border border-sky-300 dark:border-sky-500/50 text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-500/10">
                PRIMARY SERVICE HOOK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-purple-300 dark:border-purple-500/50 text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-500/10">
                {flowOrder.source || 'Via CP'}
              </span>

              {/* Working Status Pill Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Status:</span>
                <select
                  value={orderStatus}
                  onChange={(e) => {
                    setOrderStatus(e.target.value);
                    triggerToast(`Order status updated to: ${e.target.value}`);
                  }}
                  className="text-[11px] font-bold py-0.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Revision Required">Revision Required</option>
                  <option value="Ready for Manufacture">Ready for Manufacture</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* RUSH ORDER Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRushTask(!isRushTask);
                  triggerToast(isRushTask ? 'Normal priority restored' : 'Case flagged as RUSH PRIORITY!');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  isRushTask
                    ? 'border-rose-400 dark:border-rose-500 text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-500/15 animate-pulse'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:text-rose-600 bg-white/60 dark:bg-slate-900/40'
                }`}
                title="Click to toggle urgent rush status"
              >
                <Zap size={11} className={isRushTask ? 'text-rose-600 dark:text-rose-400 fill-current' : ''} />
                <span>{isRushTask ? '⚡ RUSH ORDER' : 'Normal Priority'}</span>
              </button>
            </div>

            {/* Giant Service Name Hook */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{primaryService.title}</span>
              {primaryService.format && primaryService.format !== 'Not available' ? (
                <span className="text-sky-600 dark:text-sky-400 font-bold text-lg sm:text-xl">
                  ({primaryService.format})
                </span>
              ) : null}
            </h1>

            {/* Sub-services pills row */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Included Modules:</span>
              {flowOrder.services.map((sub, sIdx) => (
                <button
                  key={sub.id || sIdx}
                  type="button"
                  onClick={() => triggerToast(`Module: ${sub.title} | Format: ${sub.format || 'Not available'} | Fee: ${typeof sub.amount === 'number' ? `$${sub.amount}` : 'Not available'}`)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-xs hover:border-sky-400 dark:hover:border-sky-500 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="text-sky-600 dark:text-sky-400 font-mono font-black text-[10px]">{sub.typeCode}</span>
                  <span>{sub.title}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-extrabold">{typeof sub.amount === 'number' ? `$${sub.amount}.00` : 'Not available'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Order ID & Clinician Actions */}
          <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-2 shrink-0">
            <div className="text-right flex items-center lg:items-end gap-2 lg:gap-0 lg:flex-col">
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Order Reference</div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-500">
                  #{flowOrder.orderNum}
                </span>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  title="Copy Order ID"
                >
                  {isCopiedId ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Print Clinical Prescription"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={exportCaseSummary}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Download Summary File"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/flow')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-500 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft size={13} />
                <span>Back to Flow</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action / Feedback Toast */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SECTION NAVIGATION TABS                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101d] rounded-2xl p-1 gap-1 text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('prescription')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'prescription'
              ? 'border border-sky-400 dark:border-sky-500/60 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 shadow-xs'
              : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={15} />
          <span>Official Prescription & Case Dispatch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('3dviewer')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === '3dviewer'
              ? 'border border-sky-400 dark:border-sky-500/60 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 shadow-xs'
              : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Box size={15} />
          <span>3D DICOM CAD & Co-Diagnostix™ Viewport</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suborders')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'suborders'
              ? 'border border-sky-400 dark:border-sky-500/60 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 shadow-xs'
              : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers size={15} />
          <span>Sub-Orders Matrix ({flowOrder.services.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: EXACT IMAGE 1 PRESCRIPTION & DISPATCH WORKFLOW              */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'prescription' && (
        <div className="space-y-4">

          {/* A. Core Case Prescription Specification Table */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm text-xs">

            {/* Header Cyan Banner Rows */}
            <div className="bg-[#bfe6f2] dark:bg-[#0d2838] border-b border-slate-300 dark:border-slate-700 divide-y divide-slate-300/80 dark:divide-slate-700/80">
              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Order ID</div>
                <div className="col-span-9 flex items-center justify-between font-mono font-black text-slate-900 dark:text-white">
                  <span>{flowOrder.orderNum}</span>
                  <span className="text-[11px] font-sans font-bold text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded bg-sky-100/60 dark:bg-sky-900/60">
                    ModID: {modId} • XID: {xid}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Scanning Center</div>
                <div className="col-span-9 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-300">{scanCenter}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = prompt('Edit Scanning Center Name:', scanCenter);
                      if (next) {
                        setScanCenter(next);
                        triggerToast('Scanning Center updated!');
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-sky-600 transition-colors"
                    title="Edit Scanning Center"
                  >
                    <Edit size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Doctor</div>
                <div className="col-span-9 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{doctorName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = prompt('Edit Doctor Name:', doctorName);
                      if (next) {
                        setDoctorName(next);
                        triggerToast('Doctor Name updated!');
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-sky-600 transition-colors"
                    title="Edit Doctor Name"
                  >
                    <Edit size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center">
                <div className="col-span-3 font-extrabold text-slate-800 dark:text-slate-200">Patient Name</div>
                <div className="col-span-9 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{patientName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = prompt('Edit Patient Name:', patientName);
                      if (next) {
                        setPatientName(next);
                        triggerToast('Patient Name updated!');
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-sky-600 transition-colors"
                    title="Edit Patient Name"
                  >
                    <Edit size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Form Fields: Dr Special Request, Sc Special Request, Client Note */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">

              {/* Dr. Special Request */}
              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center gap-2">
                <div className="col-span-3 font-extrabold text-slate-700 dark:text-slate-300">Dr. Special Request</div>
                <div className="col-span-9 flex items-center gap-2">
                  <input
                    type="text"
                    value={drSpecialRequest}
                    onChange={(e) => setDrSpecialRequest(e.target.value)}
                    placeholder="Enter clinician specific surgical or restoration requests..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => triggerToast('Dr. Special Request saved successfully!')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-400 dark:border-sky-600 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 cursor-pointer shrink-0"
                  >
                    <Save size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Sc. Special Request */}
              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center gap-2">
                <div className="col-span-3 font-extrabold text-slate-700 dark:text-slate-300">Sc. Special Request</div>
                <div className="col-span-9 flex items-center gap-3 flex-wrap">
                  <select
                    value={scSpecialRequest}
                    onChange={(e) => {
                      setScSpecialRequest(e.target.value);
                      triggerToast(`Sc. Special Request set to ${e.target.value}`);
                    }}
                    className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="General">General</option>
                    <option value="Urgent Pre-Check">Urgent Pre-Check</option>
                    <option value="High Density Mesh">High Density Mesh</option>
                    <option value="Fast Track Delivery">Fast Track Delivery</option>
                  </select>

                  <span className="text-slate-400">|</span>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">Value:</span>
                    <input
                      type="number"
                      value={scSpecialValue}
                      onChange={(e) => setScSpecialValue(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Client Note */}
              <div className="grid grid-cols-12 py-2.5 px-3.5 items-center gap-2">
                <div className="col-span-3 font-extrabold text-slate-700 dark:text-slate-300">Client Note</div>
                <div className="col-span-9 flex items-center gap-2">
                  <input
                    type="text"
                    value={clientNote}
                    onChange={(e) => setClientNote(e.target.value)}
                    placeholder="Add client portal communication notes..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => triggerToast('Client Note saved to case file!')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-400 dark:border-sky-600 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 cursor-pointer shrink-0"
                  >
                    <Save size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* B. Internal Case Note(Old) Table (Exact Image 1 layout) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm space-y-0 text-xs">
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Internal Case Note(Old)</span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {oldNotes.length} historical logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white font-extrabold text-[11px]">
                    <th className="py-2.5 px-3 w-[12%]">By</th>
                    <th className="py-2.5 px-3 w-[10%]">To</th>
                    <th className="py-2.5 px-3 w-[22%]">Time Sent</th>
                    <th className="py-2.5 px-3 w-[44%]">History</th>
                    <th className="py-2.5 px-3 w-[12%] text-center">Attach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
                  {oldNotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-slate-500 dark:text-slate-400">
                        No historical notes recorded for this order.
                      </td>
                    </tr>
                  ) : (
                    oldNotes.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{n.by}</td>
                      <td className="py-2 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">{n.to}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">{n.timeSent}</td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{n.history}</td>
                      <td className="py-2 px-3 text-center">
                        {n.attach === 'View' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePreviewDoc({
                                title: `Attachment for Note #${n.id} (Sent to ${n.to})`,
                                content: n.attachContent || 'Standard surgical planning document attached.',
                                type: 'Clinical Report'
                              })
                            }
                            className="px-2 py-0.5 rounded text-sky-700 dark:text-sky-400 font-extrabold hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>

          {/* C. Internal Case Note & Task Dispatcher System (Modernized Checkboxes & Radios) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm text-xs">
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={14} className="text-sky-600 dark:text-sky-400" />
                <span>Internal Case Note & Task Dispatcher</span>
              </div>
              <span className="text-[11px] text-slate-500">Live Team Routing</span>
            </div>

            <form onSubmit={handlePostInternalNote} className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* 1. Left: Internal Case Note Textarea + Shortcuts */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      Internal Case Note:
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {newInternalNote.length} characters
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={newInternalNote}
                    onChange={(e) => setNewInternalNote(e.target.value)}
                    placeholder="Type internal case instruction, doctor phone notes, or lab coordination message..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium leading-relaxed"
                  />

                  {/* Pre-made Quick Templates */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Quick Action Templates:</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTemplate('Call doctor regarding screw-retained vs cement-retained')}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] hover:border-sky-400 transition-colors"
                      >
                        📞 Call Doctor
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('DICOM artifact detected near #19 - requesting re-scan')}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] hover:border-sky-400 transition-colors"
                      >
                        ⚠️ DICOM Artifact
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('Expedited turnaround approved by clinic manager')}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] hover:border-sky-400 transition-colors"
                      >
                        🚀 Expedite
                      </button>
                    </div>
                  </div>

                  {/* Note Attachment Picker */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="file"
                      ref={noteAttachmentInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachedNoteFileName(file.name);
                          triggerToast(`File "${file.name}" attached to note`);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => noteAttachmentInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                    >
                      <Paperclip size={13} />
                      <span>{attachedNoteFileName ? `Attached: ${attachedNoteFileName}` : 'Attach document to note'}</span>
                    </button>

                    {attachedNoteFileName && (
                      <button
                        type="button"
                        onClick={() => setAttachedNoteFileName('')}
                        className="text-rose-500 hover:text-rose-700 text-[11px] font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Middle: Send mail to (Custom Modern Checkboxes) */}
                <div className="lg:col-span-4 border-l border-slate-200 dark:border-slate-800 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      Send mail to ({mailToSelected.size})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllMail}
                        className="text-[10px] text-sky-700 dark:text-sky-400 font-bold hover:underline"
                      >
                        All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={clearAllMail}
                        className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Modern Checkbox Tiles */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    {MAIL_DEPARTMENTS.map((dept) => {
                      const isChecked = mailToSelected.has(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => toggleMailDept(dept)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-800 dark:text-sky-300 shadow-xs'
                              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="truncate">{dept}</span>
                          {isChecked ? (
                            <CheckSquare size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Right: Send IH task (Custom Modern Radios) & Priority RUSH */}
                <div className="lg:col-span-3 border-l border-slate-200 dark:border-slate-800 pl-4 space-y-2">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300">
                    Send IH task
                  </div>

                  {/* Modern Radio Tiles */}
                  <div className="grid grid-cols-1 gap-1 text-[11px] max-h-48 overflow-y-auto pr-1">
                    {IH_TASK_DEPARTMENTS.map((dept) => {
                      const isSelected = ihTaskSelected === dept;
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setIhTaskSelected(dept)}
                          className={`flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-300 shadow-xs'
                              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="truncate">{dept}</span>
                          {isSelected ? (
                            <CircleDot size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <Circle size={14} className="text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Priority Checkbox: RUSH task in bold red */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-slate-500 text-[10px] font-bold uppercase">Priority Level:</div>
                    <button
                      type="button"
                      onClick={() => setIsRushTask(!isRushTask)}
                      className={`w-full mt-1.5 p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isRushTask
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 animate-pulse'
                          : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs">
                        <Zap size={13} className={isRushTask ? 'text-rose-600 dark:text-rose-400 fill-current' : ''} />
                        <span>RUSH task</span>
                      </div>
                      {isRushTask ? (
                        <CheckSquare size={15} className="text-rose-600 dark:text-rose-400" />
                      ) : (
                        <Square size={15} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Submit Dispatch Action */}
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-sky-500/70 hover:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-extrabold text-xs transition-all cursor-pointer bg-transparent shadow-xs active:scale-95"
                >
                  <Send size={14} />
                  <span>Dispatch Note & Notify Departments</span>
                </button>
              </div>
            </form>
          </div>

          {/* D. Special Pre-Shipping Instructions (Old & New) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b101d] shadow-sm p-4 space-y-3 text-xs">
            <div>
              <div className="font-extrabold text-slate-700 dark:text-slate-300">
                Special Pre Shipping Instruction (Old) :
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 mt-1 font-mono leading-relaxed">
                {specialPreShippingOld || 'Not available'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-extrabold text-slate-700 dark:text-slate-300">
                Special Pre Shipping Instruction (New) :
              </div>
              <textarea
                rows={3}
                value={specialPreShippingNew}
                onChange={(e) => setSpecialPreShippingNew(e.target.value)}
                placeholder="Specify sterile packaging instructions, delivery time constraints, or customs codes..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium mt-1"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveShippingInstruction}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 cursor-pointer transition-all"
                >
                  <Save size={13} />
                  <span>Save Shipping Instructions</span>
                </button>
              </div>
            </div>
          </div>

          {/* E. Registration Type (Option 1 / Option 2) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-[#0b101d] shadow-sm text-xs space-y-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 block">
              Registration Type :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRegistrationType('option1');
                  triggerToast('Registration set to Option 1: Direct Surface Matching');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  registrationType === 'option1'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Option 1</span>
                  {registrationType === 'option1' ? <CircleDot size={15} className="text-sky-600" /> : <Circle size={15} className="text-slate-400" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Direct Surface Matching (Crown & Soft-tissue optical scan alignment)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegistrationType('option2');
                  triggerToast('Registration set to Option 2: Radiographic Marker Co-registration');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  registrationType === 'option2'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Option 2</span>
                  {registrationType === 'option2' ? <CircleDot size={15} className="text-sky-600" /> : <Circle size={15} className="text-slate-400" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Dual Scan Radiographic Marker Co-registration (Edentulous protocol)
                </div>
              </button>
            </div>
          </div>

          {/* F. Uploading Files Section (Exact Image 1, 100% Functional) */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-[#0b101d] shadow-sm text-xs space-y-4">
            <form onSubmit={handleFileUpload} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                  * Uploading Files:
                </span>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFileName(file.name);
                    }
                  }}
                />

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Select a File or enter file name..."
                    value={selectedFileName}
                    onChange={(e) => setSelectedFileName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:border-sky-500 cursor-pointer shrink-0"
                  >
                    Browse Files
                  </button>
                </div>
              </div>

              {/* Upload Progress Bar if uploading */}
              {isUploading && (
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Green Upload File Button matching Image 1 */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-7 py-2.5 rounded-xl bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>

            {/* List of Uploaded Assets with Download & Delete actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                <span>Linked Archive Files ({uploadedFilesList.length})</span>
                <span>Click icon to download</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {uploadedFilesList.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between hover:border-sky-400 transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {f.type} • {f.size}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(f.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        title="Download file"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFile(f.id, f.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: CLINICAL 3D DICOM CAD & CO-DIAGNOSTIX VIEWPORT              */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === '3dviewer' && (
        <DicomMprViewer
          orderNumber={flowOrder.orderNum}
          patientName={patientName}
          implantSite="Tooth #19 (Mandibular 1st Molar)"
          implantModel="Straumann® BLT Ø4.1mm RC x 10mm"
          sleeveModel="T-Sleeve Straumann (Ø5.0mm, H: 5mm)"
          sleeveOffset={9.0}
          nerveClearance={3.2}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: SUB-ORDERS MATRIX BREAKDOWN                                 */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'suborders' && (
        <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-[#0b101d] space-y-4 text-xs shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Case #{flowOrder.orderNum} Sub-Orders Breakdown
              </h3>
              <p className="text-xs text-slate-400">All services billed and tracked under this master order</p>
            </div>
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
              Total: {flowOrder.services.some(s => typeof s.amount === 'number') ? `$${flowOrder.services.reduce((a, s) => a + (typeof s.amount === 'number' ? s.amount : 0), 0)}.00 USD` : 'Not available'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {flowOrder.services.map((sub, srvIdx) => (
              <div
                key={sub.id || srvIdx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black border border-sky-400 dark:border-sky-500/50 text-sky-700 dark:text-sky-400 bg-transparent">
                      {sub.typeCode}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {sub.title}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {typeof sub.amount === 'number' ? `$${sub.amount}.00` : 'Not available'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>Format: <strong className="text-slate-700 dark:text-slate-300">{sub.format}</strong></div>
                  <div>Anatomical Jaws: <strong className="text-slate-700 dark:text-slate-300">Max: {sub.maxilla} • Mand: {sub.mandible}</strong></div>
                  <div>Bill To: <span className="text-slate-700 dark:text-slate-300 truncate block">{sub.billTo}</span></div>
                  <div>Received: <span className="font-mono text-[10px] text-slate-400">{sub.receivedTime}</span></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">CS Task: {sub.csTask.assignee || 'Unassigned'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-400 dark:border-sky-500/40 text-sky-700 dark:text-sky-400 bg-transparent">
                    {sub.actionLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ATTACHMENT PREVIEW MODAL                                           */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {activePreviewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-sky-600 dark:text-sky-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {activePreviewDoc.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activePreviewDoc.content}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadFile('Attachment_Report.txt');
                    setActivePreviewDoc(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                >
                  <Download size={13} />
                  <span>Download Attachment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
