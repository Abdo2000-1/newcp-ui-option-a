import React, { useState, useRef, useEffect, useMemo , useCallback } from 'react';
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
  Plus,
  Code2,
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
  Phone,
  LayoutGrid,
  List,
  DollarSign,
  ShieldAlert,
  Lock,
  Tag,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import {
  serviceClient,
  workflowClient,
  pricingClient,
  payerClient,
  type ServiceItem,
  type AvailableTransition,
  type HoldReasonOption,
  type ZeroChargeReason,
  type BilledPartyChoice,
  type HistoryEvent,
} from '@/shared/api';
import { DynamicFormRenderer } from '@/shared/components/DynamicFormRenderer';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { DataTable, type Column } from '@/shared/components/DataTable';
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
  // If no param is provided at all, gracefully default to demo case #504901 so direct navigation never dead-ends
  const rawId = searchParams.get('ID') || searchParams.get('id');
  const paramId = rawId !== null ? rawId : '504901';
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
      const serviceAmount: number | null = typeof stMatch.amount === 'number' ? stMatch.amount : null;

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
              status: stMatch.csTask ? 'Assigned' : 'Unassigned',
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
  const primaryService: SubServiceItem = flowOrder?.services[0] || {
    id: 'srv-default',
    type: 'Not available',
    typeCode: 'N/A',
    title: 'Not available',
    subtitle: '',
    format: 'Not available',
    actionLabel: 'Not available',
    amount: null,
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
      status: 'Unassigned',
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
  const [scSpecialRequest, setScSpecialRequest] = useState<string>(isInitialDemo ? 'General' : 'Not available');
  const [scSpecialValue, setScSpecialValue] = useState<string>(isInitialDemo ? '0' : '');
  const [clientNote, setClientNote] = useState<string>(
    isInitialDemo ? 'Please send digital STL plan approval link before milling guide.' : ''
  );
  const [registrationType, setRegistrationType] = useState<'option1' | 'option2' | null>(
    isInitialDemo ? 'option1' : null
  );
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
        setRegistrationType('option1');
        setClientNote('Please send digital STL plan approval link before milling guide.');
        setSpecialPreShippingOld('Standard courier delivery to main clinic address. Signature required on receipt.');
        setOldNotes(DEMO_504901_OLD_NOTES);
      } else {
        setDrSpecialRequest(flowOrder.notes || '');
        setScSpecialRequest('Not available');
        setScSpecialValue('');
        setRegistrationType(null);
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

  // Prototype mock action states (UIUX-REQ-016)
  const [isSavingSpecialRequest, setIsSavingSpecialRequest] = useState(false);
  const [isSavingClientNote, setIsSavingClientNote] = useState(false);
  const [isDispatchingNote, setIsDispatchingNote] = useState(false);

  // Preview Modal State
  const [activePreviewDoc, setActivePreviewDoc] = useState<{ title: string; content: string; type: string } | null>(null);
  const [subOrdersViewMode, setSubOrdersViewMode] = useState<'matrix' | 'table'>('table');

  // ==========================================================================
  // OpenAPI 3.0.3 Contract State & Live HTTP Integration (http://localhost:3000)
  // ==========================================================================
  const [contractServices, setContractServices] = useState<ServiceItem[]>([]);
  const [contractEtag, setContractEtag] = useState<string>('');
  const [isContractLoading, setIsContractLoading] = useState<boolean>(false);
  const [isContractLive, setIsContractLive] = useState<boolean>(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Transition Modal State
  const [selectedServiceForTransition, setSelectedServiceForTransition] = useState<ServiceItem | null>(null);
  const [availableTransitions, setAvailableTransitions] = useState<AvailableTransition[]>([]);
  const [selectedTransitionId, setSelectedTransitionId] = useState<number | null>(null);
  const [holdReasonsList, setHoldReasonsList] = useState<any[]>([]);
  const [selectedHoldType, setSelectedHoldType] = useState<'customer' | 'internal'>('customer');
  const [selectedHoldReasonCode, setSelectedHoldReasonCode] = useState<string>('');
  const [transitionComment, setTransitionComment] = useState<string>('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState<boolean>(false);

  // Price Override & Billability Modal State (Q-B10 & Independent Billability)
  const [selectedServiceForPricing, setSelectedServiceForPricing] = useState<ServiceItem | null>(null);
  const [editUnitPrice, setEditUnitPrice] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editIsBillable, setEditIsBillable] = useState<boolean>(true);
  const [zeroChargeReasonsList, setZeroChargeReasonsList] = useState<ZeroChargeReason[]>([]);
  const [selectedZeroChargeReason, setSelectedZeroChargeReason] = useState<string>('');
  const [pricingError, setPricingError] = useState<{ message: string; field?: string } | null>(null);
  const [isSubmittingPricing, setIsSubmittingPricing] = useState<boolean>(false);

  // History Modal State
  const [selectedServiceForHistory, setSelectedServiceForHistory] = useState<ServiceItem | null>(null);
  const [serviceHistoryList, setServiceHistoryList] = useState<HistoryEvent[]>([]);

  // State for Add Service Item Modal (Biomodel & Conversion Independent Instances)
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState<boolean>(false);
  const [addServiceCatalogUuid, setAddServiceCatalogUuid] = useState<string>('11111111-1111-4111-8111-111111111111');
  const [addServicePrice, setAddServicePrice] = useState<string>('120.00');
  const [addServiceQuantity, setAddServiceQuantity] = useState<number>(1);
  const [addServiceIsBillable, setAddServiceIsBillable] = useState<boolean>(true);
  const [addServiceZeroReason, setAddServiceZeroReason] = useState<string>('');
  const [addServiceZeroNote, setAddServiceZeroNote] = useState<string>('');
  const [addServiceIsRedo, setAddServiceIsRedo] = useState<boolean>(false);
  const [addServiceRedoOfUuid, setAddServiceRedoOfUuid] = useState<string>('');
  const [addServiceAnswers, setAddServiceAnswers] = useState<any[]>([]);
  const [addServiceError, setAddServiceError] = useState<string | null>(null);
  const [isSubmittingAddService, setIsSubmittingAddService] = useState<boolean>(false);

  const handleOpenAddServiceModal = async () => {
    setIsAddServiceModalOpen(true);
    setAddServiceError(null);
    setAddServiceAnswers([]);
    setAddServiceQuantity(1);
    setAddServiceIsBillable(true);
    setAddServiceZeroReason('');
    setAddServiceZeroNote('');
    setAddServiceIsRedo(false);
    setAddServiceRedoOfUuid('');
    try {
      const reasons = await pricingClient.getZeroChargeReasons();
      setZeroChargeReasonsList(reasons);
    } catch {
      // safe fallback
    }
  };

  const handleCreateServiceItem = async () => {
    setAddServiceError(null);
    const numPrice = parseFloat(addServicePrice || '0');
    if (numPrice === 0 && !addServiceZeroReason) {
      setAddServiceError('Zero-charge reason is required when price is $0.00 (ck_order_items__zero_charge_has_reason)');
      return;
    }
    if (addServiceIsRedo && !addServiceRedoOfUuid) {
      setAddServiceError('Please select the original service instance being redone');
      return;
    }

    setIsSubmittingAddService(true);
    try {
      const sellableUuid = addServiceCatalogUuid === '22222222-2222-4222-8222-222222222222'
        ? 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

      await serviceClient.create(flowOrder?.orderNum || '504901', {
        sellableItemUuid: sellableUuid,
        unitPrice: addServicePrice,
        quantity: addServiceQuantity || 1,
        isBillable: addServiceIsBillable,
        answers: addServiceAnswers,
        zeroChargeReasonCode: numPrice === 0 ? addServiceZeroReason : undefined,
        zeroChargeNote: numPrice === 0 && addServiceZeroNote ? addServiceZeroNote : undefined,
        isRedo: addServiceIsRedo,
        redoOfItemUuid: addServiceIsRedo ? addServiceRedoOfUuid : undefined,
      });
      triggerToast('Service item created successfully (POST /api/v1/orders/{orderUuid}/services)');
      setIsAddServiceModalOpen(false);
      await loadContractServices();
    } catch (err: any) {
      setAddServiceError(err.message || 'Failed to create service item');
      triggerToast(`[OpenAPI Error] ${err.message}`);
    } finally {
      setIsSubmittingAddService(false);
    }
  };

  // Payer Selection Modal State
  const [selectedServiceForPayer, setSelectedServiceForPayer] = useState<ServiceItem | null>(null);
  const [eligiblePayersList, setEligiblePayersList] = useState<BilledPartyChoice[]>([]);
  const [selectedPayerContactUuid, setSelectedPayerContactUuid] = useState<string>('');
  const [isSubmittingPayer, setIsSubmittingPayer] = useState<boolean>(false);

  const loadContractServices = useCallback(async () => {
    if (!flowOrder) return;
    const orderKey = flowOrder.orderNum || flowOrder.id;
    setIsContractLoading(true);
    setContractError(null);
    try {
      const res = await serviceClient.listByOrder(orderKey);
      setContractServices(res.data || []);
      setContractEtag(res.etag || '');
      setIsContractLive(true);
    } catch (err: any) {
      console.warn('Could not load contract services via HTTP:', err);
      setContractError(err.message || 'Failed to fetch from OpenAPI server');
      setIsContractLive(false);
    } finally {
      setIsContractLoading(false);
    }
  }, [flowOrder]);

  useEffect(() => {
    loadContractServices();
  }, [loadContractServices]);

  const handleOpenTransitionModal = async (svc: ServiceItem) => {
    if (svc.canTransition === false || svc.isReadOnly === true) {
      triggerToast(`[403 Forbidden] Workflow transitions are locked for ${svc.uuid} (read-only mode).`);
      return;
    }
    setSelectedServiceForTransition(svc);
    setSelectedTransitionId(null);
    setTransitionComment('');
    setSelectedHoldReasonCode('');
    try {
      const [transitions, holds] = await Promise.all([
        workflowClient.getAvailableTransitions(svc.uuid),
        workflowClient.getHoldReasons()
      ]);
      setAvailableTransitions(transitions);
      setHoldReasonsList(holds);
      if (transitions.length > 0) {
        setSelectedTransitionId(transitions[0].transitionId);
      }
    } catch (err: any) {
      triggerToast(`Error fetching transitions: ${err.message}`);
    }
  };

  const handleExecuteTransition = async () => {
    if (!selectedServiceForTransition || !selectedTransitionId) return;
    setIsSubmittingTransition(true);
    try {
      const itemEtag = contractEtag || `W/"${selectedServiceForTransition.uuid}-1"`;
      await workflowClient.executeTransition(
        selectedServiceForTransition.uuid,
        {
          transitionId: selectedTransitionId,
          holdType: selectedTransitionId === 102 ? selectedHoldType : undefined,
          holdReasonCode: selectedTransitionId === 102 ? selectedHoldReasonCode : undefined,
          comment: transitionComment || undefined
        },
        itemEtag
      );
      triggerToast(`[OpenAPI 200 OK] Workflow advanced for ${selectedServiceForTransition.uuid}!`);
      setSelectedServiceForTransition(null);
      await loadContractServices();
    } catch (err: any) {
      if (err?.status === 401) {
        triggerToast('[401 Unauthorized] Session expired or invalid authentication credentials.');
      } else if (err?.status === 403) {
        triggerToast(`[403 Forbidden] ${err.message || 'Permission denied on this transition.'}`);
      } else {
        triggerToast(`[OpenAPI Error] ${err.message}`);
      }
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const handleOpenPricingModal = async (svc: ServiceItem) => {
    setSelectedServiceForPricing(svc);
    setEditUnitPrice(svc.unitPrice || '0.00');
    setEditQuantity(svc.quantity || 1);
    setEditIsBillable(svc.isBillable !== false);
    setSelectedZeroChargeReason(svc.zeroChargeReasonCode || '');
    setPricingError(null);
    try {
      const reasons = await pricingClient.getZeroChargeReasons();
      setZeroChargeReasonsList(reasons);
    } catch (err: any) {
      triggerToast(`Error fetching pricing reasons: ${err.message}`);
    }
  };

  const handleExecutePricing = async () => {
    if (!selectedServiceForPricing) return;
    setPricingError(null);

    const priceNum = parseFloat(editUnitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setPricingError({ message: 'Unit price must be a valid non-negative number.', field: 'unitPrice' });
      return;
    }

    if (priceNum === 0 && !selectedZeroChargeReason) {
      setPricingError({
        message: 'When unit price is $0.00, a zero-charge reason code is strictly mandatory (ck_order_items__zero_charge_has_reason).',
        field: 'zeroChargeReasonCode',
      });
      return;
    }

    setIsSubmittingPricing(true);
    try {
      const itemEtag = contractEtag || `W/"${selectedServiceForPricing.uuid}-1"`;
      await pricingClient.updatePricing(
        selectedServiceForPricing.uuid,
        {
          unitPrice: editUnitPrice,
          quantity: editQuantity,
          isBillable: editIsBillable,
          zeroChargeReasonCode: priceNum === 0 ? selectedZeroChargeReason : null,
        },
        itemEtag,
        true
      );
      triggerToast(`[OpenAPI 200 OK] Price & billability updated for ${selectedServiceForPricing.uuid}!`);
      setSelectedServiceForPricing(null);
      await loadContractServices();
    } catch (err: any) {
      const field = err?.details?.field || (err?.code === 'ZERO_CHARGE_REASON_REQUIRED' ? 'zeroChargeReasonCode' : undefined);
      setPricingError({ message: err.message || 'Pricing update failed', field });
      triggerToast(`[OpenAPI Error] ${err.message}`);
    } finally {
      setIsSubmittingPricing(false);
    }
  };

  const handleOpenHistoryModal = async (svc: ServiceItem) => {
    setSelectedServiceForHistory(svc);
    try {
      const hist = await workflowClient.getHistory(svc.uuid);
      setServiceHistoryList(hist);
    } catch (err: any) {
      triggerToast(`Error fetching history: ${err.message}`);
    }
  };

  const handleOpenPayerModal = async (svc: ServiceItem) => {
    setSelectedServiceForPayer(svc);
    setSelectedPayerContactUuid(svc.billedToContactUuid || '');
    try {
      const payers = await payerClient.getEligibleBilledParties(flowOrder?.orderNum || flowOrder?.id || 'ORD-504901');
      setEligiblePayersList(payers);
    } catch (err: any) {
      triggerToast(`Error fetching eligible payers: ${err.message}`);
    }
  };

  const handleExecutePayer = async () => {
    if (!selectedServiceForPayer || !selectedPayerContactUuid) return;
    setIsSubmittingPayer(true);
    try {
      const itemEtag = contractEtag || `W/"${selectedServiceForPayer.uuid}-1"`;
      await payerClient.assignBilledParty(
        selectedServiceForPayer.uuid,
        selectedPayerContactUuid,
        itemEtag
      );
      triggerToast(`[OpenAPI 200 OK] Payer assigned to ${selectedPayerContactUuid}!`);
      setSelectedServiceForPayer(null);
      await loadContractServices();
    } catch (err: any) {
      if (err?.status === 401) {
        triggerToast('[401 Unauthorized] Session expired or invalid authentication credentials.');
      } else if (err?.status === 403) {
        triggerToast(`[403 Forbidden] ${err.message || 'Permission denied on this transition.'}`);
      } else {
        triggerToast(`[OpenAPI Error] ${err.message}`);
      }
    } finally {
      setIsSubmittingPayer(false);
    }
  };

  const noteColumns: Column<CaseNoteItem>[] = useMemo(
    () => [
      {
        key: 'by',
        header: 'By',
        sortable: true,
        width: '15%',
        render: (n) => <span className="font-bold text-slate-900 dark:text-white">{n.by}</span>,
      },
      {
        key: 'to',
        header: 'To',
        sortable: true,
        width: '12%',
        render: (n) => <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{n.to}</span>,
      },
      {
        key: 'timeSent',
        header: 'Time Sent',
        sortable: true,
        width: '22%',
        render: (n) => <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{n.timeSent}</span>,
      },
      {
        key: 'history',
        header: 'History',
        sortable: true,
        width: '41%',
        render: (n) => <span className="text-slate-800 dark:text-slate-200">{n.history}</span>,
      },
      {
        key: 'attach',
        header: 'Attach',
        align: 'center',
        width: '10%',
        render: (n) =>
          n.attach === 'View' ? (
            <button
              type="button"
              onClick={() =>
                setActivePreviewDoc({
                  title: `Attachment for Note #${n.id} (Sent to ${n.to})`,
                  content: n.attachContent || 'Standard surgical planning document attached.',
                  type: 'Clinical Report',
                })
              }
              className="px-2 py-0.5 rounded text-sky-700 dark:text-sky-400 font-extrabold hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer inline-flex items-center gap-1"
            >
              <Eye size={12} />
              <span>View</span>
            </button>
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
    ],
    []
  );

  const subOrderColumns: Column<SubServiceItem>[] = useMemo(
    () => [
      {
        key: 'typeCode',
        header: 'Code',
        sortable: true,
        width: '12%',
        render: (sub) => (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black border border-sky-400 dark:border-sky-500/50 text-sky-700 dark:text-sky-400 bg-transparent">
            {sub.typeCode}
          </span>
        ),
      },
      {
        key: 'title',
        header: 'Service / Module',
        sortable: true,
        width: '24%',
        render: (sub) => (
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            {sub.title}
          </span>
        ),
      },
      {
        key: 'format',
        header: 'Format',
        sortable: true,
        width: '15%',
        render: (sub) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {sub.format}
          </span>
        ),
      },
      {
        key: 'jaws',
        header: 'Anatomical Jaws',
        sortable: false,
        width: '18%',
        render: (sub) => (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Max: <strong className="text-slate-800 dark:text-slate-200">{sub.maxilla}</strong> • Mand: <strong className="text-slate-800 dark:text-slate-200">{sub.mandible}</strong>
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Fee',
        sortable: true,
        width: '11%',
        render: (sub) => (
          <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
            {typeof sub.amount === 'number' ? `${sub.amount}.00` : 'Not available'}
          </span>
        ),
      },
      {
        key: 'csTask',
        header: 'CS Assignee',
        sortable: true,
        width: '12%',
        render: (sub) => (
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
            CS Task: {sub.csTask?.assignee || 'Unassigned'}
          </span>
        ),
      },
      {
        key: 'actionLabel',
        header: 'Workflow Stage',
        sortable: true,
        width: '12%',
        align: 'right',
        render: (sub) => (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-400 dark:border-sky-500/40 text-sky-700 dark:text-sky-400 bg-transparent whitespace-nowrap">
            {sub.actionLabel}
          </span>
        ),
      },
    ],
    []
  );

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
    if (text.includes('Call doctor')) {
      setIhTaskSelected('CS');
      triggerToast('Template applied: Auto-routed task to Customer Service (CS)');
    } else if (text.includes('DICOM artifact')) {
      setIhTaskSelected('Scanning Techs');
      setIsRushTask(true);
      triggerToast('Template applied: Auto-routed task to Scanning Techs [RUSH PRIORITY]');
    } else if (text.includes('Expedited turnaround')) {
      setIhTaskSelected('Production');
      setIsRushTask(true);
      triggerToast('Template applied: Auto-routed task to Production [RUSH PRIORITY]');
    } else {
      triggerToast('Quick template applied to note.');
    }
    setNewInternalNote((prev) => (prev ? `${prev} - ${text}` : text));
  };

  const copyPrescriptionSummary = () => {
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
Registration Type: ${registrationType ? registrationType.toUpperCase() : 'Not available'}
Shipping Instructions: ${specialPreShippingOld || 'Not available'}
Active Modules: ${activeOrder.services.map((s) => `${s.typeCode}: ${s.title} (${typeof s.amount === 'number' ? `${s.amount}` : 'Not available'})`).join(', ')}
Total Value: ${activeOrder.services.some(s => typeof s.amount === 'number') ? `${activeOrder.services.reduce((a, s) => a + (typeof s.amount === 'number' ? s.amount : 0), 0)}.00 USD` : 'Not available'}
Generated on: ${new Date().toLocaleString()}
`;
    navigator.clipboard.writeText(summary);
    triggerToast('Case prescription summary copied to clipboard!');
  };

  const handleSaveSpecialRequest = () => {
    setIsSavingSpecialRequest(true);
    setTimeout(() => {
      setIsSavingSpecialRequest(false);
      triggerToast('[MOCK / NOT_INTEGRATED] Dr. Special Request saved to local case state.');
    }, 300);
  };

  const handleSaveClientNote = () => {
    setIsSavingClientNote(true);
    setTimeout(() => {
      setIsSavingClientNote(false);
      triggerToast('[MOCK / NOT_INTEGRATED] Client Note saved to case file.');
    }, 300);
  };

  const handlePostInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim() || isDispatchingNote) {
      if (!newInternalNote.trim()) {
        triggerToast('Please write a message before dispatching!');
      }
      return;
    }

    setIsDispatchingNote(true);

    setTimeout(() => {
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
      setIsDispatchingNote(false);
      triggerToast(`[MOCK / NOT_INTEGRATED] Dispatched to IH [${ihTaskSelected}] and emailed [${Array.from(mailToSelected).join(', ')}]!`);
    }, 300);
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
Registration Type: ${registrationType ? registrationType.toUpperCase() : 'Not available'}
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
            {t('order.title', 'Order Details')}
          </h1>
        </div>

        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title={t('order.notFoundTitle', 'Order Not Found')}
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
                {t('order.returnDashboard', 'Return to Dashboard')}
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
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t('action.status', 'Status')}:</span>
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
                <span>{isRushTask ? ('⚡ ' + t('order.rush', 'RUSH ORDER')) : t('order.normal', 'Normal Priority')}</span>
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
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{t('order.orderNumber', 'Order Reference')}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-500">
                  #{flowOrder.orderNum}
                </span>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  title={t('order.copyId', 'Copy Order ID')}
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
                title={t('order.printPrescription', 'Print Clinical Prescription')}
              >
                <Printer size={13} />
                <span className="hidden sm:inline">{t('action.print', 'Print')}</span>
              </button>

              <button
                type="button"
                onClick={copyPrescriptionSummary}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Copy case prescription summary to clipboard"
              >
                <Copy size={13} />
                <span className="hidden sm:inline">Copy Summary</span>
              </button>

              <button
                type="button"
                onClick={exportCaseSummary}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title={t('action.download', 'Download Summary File')}
              >
                <Download size={13} />
                <span className="hidden sm:inline">{t('action.export', 'Export')}</span>
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
          <span>{t('order.overview', 'Official Prescription & Case Dispatch')}</span>
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
          <span>{t('order.viewer3d', '3D DICOM CAD & Co-Diagnostix™ Viewport')}</span>
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
          <span>{t('order.suborders', 'Sub-Orders Matrix')} ({flowOrder.services.length})</span>
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
                    disabled={isSavingSpecialRequest}
                    onClick={handleSaveSpecialRequest}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-400 dark:border-sky-600 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 cursor-pointer shrink-0 disabled:opacity-50 transition-all"
                  >
                    <Save size={12} />
                    <span>{isSavingSpecialRequest ? 'Saving...' : 'Save'}</span>
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
                    <option value="Not available">Not available</option>
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
                    disabled={isSavingClientNote}
                    onClick={handleSaveClientNote}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-400 dark:border-sky-600 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 cursor-pointer shrink-0 disabled:opacity-50 transition-all"
                  >
                    <Save size={12} />
                    <span>{isSavingClientNote ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* B. Internal Case Note(Old) Table - Modernized with Unified DataTable */}
          <DataTable<CaseNoteItem>
            columns={noteColumns}
            data={oldNotes}
            rowKey={(item) => String(item.id)}
            title="Internal Case Note (Old)"
            subtitle={`${oldNotes.length} historical logs`}
            searchable
            searchPlaceholder="Filter notes by sender, recipient, or text..."
            searchFilter={(item, query) =>
              item.by.toLowerCase().includes(query) ||
              item.to.toLowerCase().includes(query) ||
              item.history.toLowerCase().includes(query) ||
              item.timeSent.toLowerCase().includes(query)
            }
            ariaLabel="Internal Case Notes Table"
            emptyState={
              <div className="py-4 px-3 text-center text-slate-500 dark:text-slate-400">
                No historical notes recorded for this order.
              </div>
            }
          />

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
                  disabled={isDispatchingNote}
                  onClick={handlePostInternalNote}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-sky-500/70 hover:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-extrabold text-xs transition-all cursor-pointer bg-transparent shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <Send size={14} className={isDispatchingNote ? 'animate-pulse' : ''} />
                  <span>{isDispatchingNote ? 'Dispatching...' : 'Dispatch Note & Notify Departments'}</span>
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
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 block">
                Registration Type :
              </span>
              {registrationType === null && (
                <span className="text-[11px] font-mono text-slate-400">
                  (Not available / Unselected)
                </span>
              )}
            </div>
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
      {/* TAB 3: SUB-ORDERS MATRIX BREAKDOWN (LIVE OPENAPI 3.0.3 CONTRACT)    */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'suborders' && (
        <div className="border border-slate-300 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-[#0b101d] space-y-5 text-xs shadow-sm">

          {/* Sub-Orders Breakdown (Table / Cards View) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Case #{flowOrder.orderNum} Sub-Orders Breakdown
              </h3>
              <p className="text-xs text-slate-400">All services billed and tracked under this master order</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle: Table vs Cards */}
              <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setSubOrdersViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    subOrdersViewMode === 'table'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Table View"
                >
                  <List size={13} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubOrdersViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    subOrdersViewMode === 'matrix'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Card Matrix View"
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
              </div>

              <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                Total: {flowOrder.services.some(s => typeof s.amount === 'number') ? `${flowOrder.services.reduce((a, s) => a + (typeof s.amount === 'number' ? s.amount : 0), 0)}.00 USD` : 'Not available'}
              </span>
            </div>
          </div>

          {subOrdersViewMode === 'table' ? (
            <DataTable<SubServiceItem>
              columns={subOrderColumns}
              data={flowOrder.services}
              rowKey={(sub, idx) => sub.id || `${sub.typeCode}-${idx}`}
              onRowClick={(sub) => triggerToast(`[MOCK] Selected Sub-Order: ${sub.title} (${sub.typeCode}) - Stage: ${sub.actionLabel}`)}
              searchable
              searchPlaceholder="Filter sub-orders by title or code..."
              searchFilter={(sub, query) =>
                sub.title.toLowerCase().includes(query) ||
                sub.typeCode.toLowerCase().includes(query) ||
                sub.format.toLowerCase().includes(query) ||
                (sub.csTask?.assignee || '').toLowerCase().includes(query)
              }
              ariaLabel="Sub-orders Matrix Breakdown Table"
              emptyState="No sub-orders recorded for this master order."
            />
          ) : (
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
                      {typeof sub.amount === 'number' ? `${sub.amount}.00` : 'Not available'}
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
          )}

          <hr className="border-slate-200 dark:border-slate-800 my-4" />

          {/* Live OpenAPI Connection Header Banner */}
          <div className="p-3.5 rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                    Service Line Items
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {contractServices.length} Active Lines
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Prescription sub-order instances attached to Order #{flowOrder.orderNum} • Version: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{contractEtag || 'Current'}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddServiceModal}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Plus size={12} />
                <span>+ Add Service Item</span>
              </button>
              <button
                type="button"
                onClick={loadContractServices}
                disabled={isContractLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs text-slate-700 dark:text-slate-300"
              >
                <RotateCw size={12} className={isContractLoading ? "animate-spin" : ""} />
                <span>{isContractLoading ? 'Refreshing...' : 'Refresh Services'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Case #{flowOrder.orderNum} Service Instances</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  {contractServices.length} Contract Instances
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative service items conforming strictly to New CP OpenAPI 3.0.3 specification
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                Total Line Value: ${contractServices.reduce((acc, s) => acc + (parseFloat(s.lineTotal || s.unitPrice || '0') * (s.quantity || 1)), 0).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Service Items Table from Live Contract */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Service UUID</th>
                  <th className="py-2.5 px-3">Service Name</th>
                  <th className="py-2.5 px-3">Status & Workflow</th>
                  <th className="py-2.5 px-3">Dynamic Form Answers</th>
                  <th className="py-2.5 px-3">F07 Payer Target</th>
                  <th className="py-2.5 px-3">Pricing & Zero Charge</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                {contractServices.map((svc) => (
                  <tr key={svc.uuid} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Service UUID */}
                    <td className="py-3 px-3 align-top font-mono text-[11px]">
                      <span className="font-bold text-sky-700 dark:text-sky-400 block">{svc.uuid}</span>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        Sellable: <code className="font-mono text-[9px]">{svc.sellableItemUuid ? svc.sellableItemUuid.slice(0, 13) + '...' : 'Default'}</code>
                      </span>
                    </td>

                    {/* Name & Category */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{(svc as any).name || 'Biomodel 3D Print'}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black border border-sky-400 dark:border-sky-500/50 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30">
                          {(svc as any).categoryCode || 'RESTORATIVE'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Billable: <strong className={svc.isBillable ? "text-emerald-600" : "text-slate-400"}>{svc.isBillable ? 'YES' : 'NO'}</strong>
                        </span>
                      </div>
                    </td>

                    {/* Workflow Status */}
                    <td className="py-3 px-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                          svc.status === 'on_hold'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                            : svc.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                            : 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700'
                        }`}>
                          {svc.status.toUpperCase()}
                        </span>
                      </div>
                      {svc.status === 'on_hold' && svc.holdReasonCode && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-1">
                          [{svc.holdType}]: {svc.holdReasonCode}
                        </div>
                      )}
                    </td>

                    {/* Dynamic Form Answers */}
                    <td className="py-3 px-3 align-top">
                      {svc.answers && svc.answers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {svc.answers.map((ans, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                              <strong>{ans.fieldCode}:</strong> {String((ans as any).value || ans.optionCode || '')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No custom answers</span>
                      )}
                    </td>

                    {/* F07 Payer Target */}
                    <td className="py-3 px-3 align-top">
                      <div className="text-slate-900 dark:text-slate-200 font-semibold text-xs truncate max-w-[150px]">
                        {svc.billedToContactUuid || 'contact-dr-smith-01'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        Origin: <strong className="text-sky-600 dark:text-sky-400">{svc.billedPartyOrigin || 'order_default'}</strong>
                      </span>
                    </td>

                    {/* Pricing & Zero Charge */}
                    <td className="py-3 px-3 align-top font-mono">
                      <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        ${svc.lineTotal || svc.unitPrice || '0.00'} {svc.currencyCode || 'USD'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {svc.quantity || 1} unit(s) @ ${svc.unitPrice || '0.00'}
                      </div>
                      {parseFloat(svc.lineTotal || svc.unitPrice || '0') === 0 && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 mt-1">
                          ZERO: {svc.zeroChargeReasonCode || 'WARRANTY'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenTransitionModal(svc)}
                          className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] transition-all cursor-pointer shadow-xs"
                          title="Advance Workflow Stage or Place On Hold"
                        >
                          Workflow
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPricingModal(svc)}
                          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                          title="Override Price or Apply Zero Charge"
                        >
                          Price
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPayerModal(svc)}
                          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                          title="Assign F07 Payer Contact"
                        >
                          Payer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenHistoryModal(svc)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="View Service History"
                        >
                          <Clock size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 1: WORKFLOW TRANSITION & ATOMIC ON HOLD (OPENAPI 3.0.3)     */}
      {/* ================================================================== */}
      <AnimatePresence>
        {selectedServiceForTransition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Advance Service Workflow (OpenAPI 3.0.3)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Target: {selectedServiceForTransition.uuid} • Current: <strong>{selectedServiceForTransition.status}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceForTransition(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Transition Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Workflow Transition:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {availableTransitions.map((t) => (
                    <label
                      key={t.transitionId}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedTransitionId === t.transitionId
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="transitionOption"
                          value={t.transitionId}
                          checked={selectedTransitionId === t.transitionId}
                          onChange={() => setSelectedTransitionId(t.transitionId)}
                          className="text-sky-600"
                        />
                        <span className="font-bold text-xs">{(t.toStatusName || t.toCode)}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">ID: {t.transitionId}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Atomic On Hold Fields (Q-B9 requirement) */}
              {selectedTransitionId === 102 && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <ShieldAlert size={14} />
                    <span>Mandatory Atomic On Hold Policy (Q-B9)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hold Type (Required):
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="holdType"
                          value="customer"
                          checked={selectedHoldType === 'customer'}
                          onChange={() => setSelectedHoldType('customer')}
                        />
                        <span>Customer Hold</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="holdType"
                          value="internal"
                          checked={selectedHoldType === 'internal'}
                          onChange={() => setSelectedHoldType('internal')}
                        />
                        <span>Internal Hold</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hold Reason Code (Mandatory):
                    </label>
                    <select
                      value={selectedHoldReasonCode}
                      onChange={(e) => setSelectedHoldReasonCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Select Active Hold Reason --</option>
                      {holdReasonsList
                        .filter((r) => r.holdType === selectedHoldType)
                        .map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.label} ({r.code})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Log Comment:
                </label>
                <input
                  type="text"
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                  placeholder="Optional operator notes for audit trail..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedServiceForTransition(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransition}
                  disabled={isSubmittingTransition || (selectedTransitionId === 102 && !selectedHoldReasonCode)}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTransition ? 'Transiting...' : 'Submit Transition (POST)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* MODAL 2: PRICING & ZERO-CHARGE OVERRIDE (OPENAPI 3.0.3)           */}
      {/* ================================================================== */}
      <AnimatePresence>
        {selectedServiceForPricing && (() => {
          const isPriceLocked = selectedServiceForPricing.canEditPrice === false || Boolean(selectedServiceForPricing.isInvoiced);
          const isBillabilityLocked = selectedServiceForPricing.canEditBillability === false || Boolean(selectedServiceForPricing.isInvoiced);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Service Price Override (Q-B10)
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      UUID: {selectedServiceForPricing.uuid}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedServiceForPricing(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {pricingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{pricingError.message}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Unit Price (USD):
                      </label>
                      {isPriceLocked && (
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Lock size={10} /> Locked (canEditPrice: false)
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isPriceLocked}
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-xs font-bold ${
                        isPriceLocked
                          ? 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500 cursor-not-allowed'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={isPriceLocked}
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs disabled:opacity-60"
                    />
                  </div>

                  {/* Independent Billable Control (Q-B9 / Q-B11) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Billable to Client? (Independent of Bill To):
                      </span>
                      {isBillabilityLocked && (
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="pricingBillableToggle"
                          disabled={isBillabilityLocked}
                          checked={editIsBillable}
                          onChange={() => setEditIsBillable(true)}
                        />
                        <span className={editIsBillable ? "text-emerald-600 font-bold" : "text-slate-600"}>
                          Yes (Billable)
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="pricingBillableToggle"
                          disabled={isBillabilityLocked}
                          checked={!editIsBillable}
                          onChange={() => setEditIsBillable(false)}
                        />
                        <span className={!editIsBillable ? "text-rose-600 font-bold" : "text-slate-600"}>
                          No (Non-Billable)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Bill To Reference Display (Distinct from Billable) */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Bill To Contact (Payer Assignment):
                    </span>
                    <div className="font-mono text-xs text-sky-700 dark:text-sky-300 font-bold mt-0.5">
                      {selectedServiceForPricing.billedToContactUuid || 'contact-dr-smith-01'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Origin: {selectedServiceForPricing.billedPartyOrigin || 'order_default'} &bull; Managed via Payer Target Modal
                    </span>
                  </div>

                  {parseFloat(editUnitPrice || '0') === 0 && (
                    <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 space-y-2">
                      <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                        ⚠️ Zero-Charge Reason Required (ck_order_items__zero_charge_has_reason):
                      </span>
                      <select
                        value={selectedZeroChargeReason}
                        onChange={(e) => setSelectedZeroChargeReason(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs ${
                          pricingError?.field === 'zeroChargeReasonCode'
                            ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/80 dark:bg-rose-950/80'
                            : 'border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <option value="">-- Select Zero-Charge Reason --</option>
                        {zeroChargeReasonsList.map((z) => (
                          <option key={z.code} value={z.code}>
                            {z.label} ({z.code})
                          </option>
                        ))}
                      </select>
                      {pricingError?.field === 'zeroChargeReasonCode' && (
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                          Reason code must be selected when unit price is 0.00
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceForPricing(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePricing}
                    disabled={isSubmittingPricing || (parseFloat(editUnitPrice || '0') === 0 && !selectedZeroChargeReason)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingPricing ? 'Saving...' : 'Apply Price (PATCH)'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* MODAL 3: F07 PAYER SELECTION MODAL                                 */}
      {/* ================================================================== */}
      <AnimatePresence>
        {selectedServiceForPayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Assign F07 Payer Contact
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Target: {selectedServiceForPayer.uuid}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceForPayer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Authorized Contact:
                </label>
                <div className="space-y-2">
                  {eligiblePayersList.map((p) => (
                    <label
                      key={p.contactUuid}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                        selectedPayerContactUuid === p.contactUuid
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="payerOption"
                          value={p.contactUuid}
                          checked={selectedPayerContactUuid === p.contactUuid}
                          onChange={() => setSelectedPayerContactUuid(p.contactUuid)}
                        />
                        <div>
                          <span className="font-bold text-xs block">{p.label}</span>
                          <span className="font-mono text-[10px] text-slate-400">Role: {p.role}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedServiceForPayer(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePayer}
                  disabled={isSubmittingPayer}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPayer ? 'Assigning...' : 'Save Payer (PATCH)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* MODAL 4: AUDIT HISTORY TRAIL MODAL                                */}
      {/* ================================================================== */}
      <AnimatePresence>
        {selectedServiceForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Service Audit History (GET /history)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    UUID: {selectedServiceForHistory.uuid}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceForHistory(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {serviceHistoryList.length > 0 ? (
                  serviceHistoryList.map((h, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                        <span>From: <strong>{h.fromCode || 'draft'}</strong> &rarr; To: <strong>{h.toCode}</strong></span>
                        <span>{new Date(h.occurredAt || Date.now()).toLocaleTimeString()}</span>
                      </div>
                      {h.comment && (
                        <p className="text-slate-800 dark:text-slate-200 mt-1 font-sans">
                          {h.comment}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        Actor: {h.actorUserUuid || 'system'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-center py-4">No audit events recorded.</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedServiceForHistory(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* MODAL 5: CREATE BIOMODEL / CONVERSION SERVICE INSTANCE (OPENAPI)   */}
      {/* ================================================================== */}
      <AnimatePresence>
        {isAddServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-2xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Add Independent Service Instance
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Order #{flowOrder?.orderNum} &bull; Biomodel & Conversion Contract Target
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {addServiceError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{addServiceError}</span>
                </div>
              )}

              <div className="overflow-y-auto pr-2 space-y-4 text-xs">
                {/* Service Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Service Archetype:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAddServiceCatalogUuid('11111111-1111-4111-8111-111111111111');
                        setAddServicePrice('120.00');
                        setAddServiceAnswers([]);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        addServiceCatalogUuid === '11111111-1111-4111-8111-111111111111'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold text-xs block">Biomodel 3D Printing</span>
                      <span className="text-[10px] text-slate-500 font-mono">Code: BIOMODEL (Physical)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAddServiceCatalogUuid('22222222-2222-4222-8222-222222222222');
                        setAddServicePrice('90.00');
                        setAddServiceAnswers([]);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        addServiceCatalogUuid === '22222222-2222-4222-8222-222222222222'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold text-xs block">Dicom to CAD Conversion</span>
                      <span className="text-[10px] text-slate-500 font-mono">Code: CONVERSION (Digital)</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Metadata Form Questionnaire */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Catalog Dynamic Form Specification
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Target: {addServiceCatalogUuid.slice(0, 8)}...
                    </span>
                  </div>

                  <DynamicFormRenderer
                    key={addServiceCatalogUuid}
                    serviceUuid={addServiceCatalogUuid}
                    onChange={(answers) => setAddServiceAnswers(answers)}
                  />
                </div>

                {/* Instance Parameters: Quantity & Billable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Price (USD):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={addServicePrice}
                      onChange={(e) => setAddServicePrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity (Default: 1):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={addServiceQuantity}
                      onChange={(e) => setAddServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <input
                    type="checkbox"
                    id="add-service-billable"
                    checked={addServiceIsBillable}
                    onChange={(e) => setAddServiceIsBillable(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="add-service-billable" className="font-semibold text-xs cursor-pointer select-none">
                    Is Billable (evaluated independently of Bill To contact)
                  </label>
                </div>

                {/* Zero-Charge Section when Price = 0 */}
                {parseFloat(addServicePrice || '0') === 0 && (
                  <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 space-y-2">
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                      ⚠️ Zero-Charge Reason Required (ck_order_items__zero_charge_has_reason):
                    </span>
                    <select
                      value={addServiceZeroReason}
                      onChange={(e) => setAddServiceZeroReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="">-- Select Zero-Charge Reason --</option>
                      {zeroChargeReasonsList.map((z) => (
                        <option key={z.code} value={z.code}>
                          {z.label} ({z.code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Optional Zero-charge note..."
                      value={addServiceZeroNote}
                      onChange={(e) => setAddServiceZeroNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                )}

                {/* Redo Flag and Reference */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="add-service-redo"
                      checked={addServiceIsRedo}
                      onChange={(e) => setAddServiceIsRedo(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <label htmlFor="add-service-redo" className="font-semibold text-xs cursor-pointer select-none">
                      Is Redo of Existing Service Instance
                    </label>
                  </div>

                  {addServiceIsRedo && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select Original Service Instance (Mandatory for Redo):
                      </label>
                      <select
                        value={addServiceRedoOfUuid}
                        onChange={(e) => setAddServiceRedoOfUuid(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="">-- Select Original Service --</option>
                        {contractServices.map((svc) => (
                          <option key={svc.uuid} value={svc.uuid}>
                            {svc.uuid} - {(svc as any).name || 'Service Item'} ({svc.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateServiceItem}
                  disabled={isSubmittingAddService}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingAddService ? 'Creating Instance...' : 'Create Service Item (POST)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
