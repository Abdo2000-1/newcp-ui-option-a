import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Stethoscope,
  Building2,
  Calendar,
  Zap,
  RefreshCw,
  X,
  ExternalLink,
  Lock,
  Unlock,
  FileText,
  MoreHorizontal,
  Printer,
  Check,
  Wrench,
  Sparkles,
  AlertTriangle,
  UploadCloud,
  ChevronUp,
  User,
  CreditCard,
  Plus,
  ShoppingCart,
  Table,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import {
  MASTER_WORKFLOW_ORDERS,
  MasterWorkflowOrder,
  SubServiceItem
} from '@/shared/data/flowMockData';

// Web Audio API helper for smooth, light swoosh sound effect on expand/collapse
function playSwooshSound(isExpanding: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (isExpanding) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Audio policy fallback
  }
}

// -------------------------------------------------------------
// CALM, OUTLINE-ONLY STYLING HELPERS (Transparent Background)
// -------------------------------------------------------------

// Source badge styling: calm transparent background with colored border
export const getSourceBadgeStyle = (source: string) => {
  const s = (source || '').toLowerCase();
  if (
    s.includes('vatech') ||
    s.includes('planmeca') ||
    s.includes('jmorita') ||
    s.includes('prexion') ||
    s.includes('sender')
  ) {
    return 'bg-transparent text-slate-800 dark:text-slate-200 border border-slate-700/60 dark:border-slate-400 font-bold';
  }
  if (s.includes('casexchange') || s.includes('xchange')) {
    return 'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-400/80 dark:border-slate-500 font-bold';
  }
  if (s.includes('cp')) {
    return 'bg-transparent text-purple-600 dark:text-purple-400 border border-purple-500/50 font-bold';
  }
  if (s.includes('connect')) {
    return 'bg-transparent text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/50 font-bold';
  }
  return 'bg-transparent text-slate-600 dark:text-slate-400 border border-slate-400/50 font-bold';
};

// Workflow status badge renderer: calm transparent background with colored border
export const renderActionStatusBadge = (
  label: string,
  isAlert: boolean,
  buttonText?: string,
  onAction?: (e: React.MouseEvent) => void
) => {
  if (isAlert) {
    return (
      <div className="bg-transparent text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-lg font-bold text-[9px] leading-tight border border-rose-500/60 inline-flex flex-col items-center">
        <div>{label || 'No Scans'}</div>
        {buttonText && (
          <button
            type="button"
            onClick={onAction}
            className="mt-0.5 px-1 py-0.5 rounded bg-transparent border border-rose-400/60 hover:bg-rose-500/10 text-rose-600 dark:text-rose-300 cursor-pointer text-[8px] font-bold transition-all"
          >
            {buttonText}
          </button>
        )}
      </div>
    );
  }

  const l = (label || '').toLowerCase();
  if (
    l.includes('in progress') ||
    l.includes('sleeve design') ||
    l.includes('guide design') ||
    l.includes('printing') ||
    l.includes('planning') ||
    l.includes('production')
  ) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] bg-transparent text-amber-600 dark:text-amber-400 border border-amber-500/50 truncate max-w-full">
        {label}
      </span>
    );
  }

  if (l.includes('pending')) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] bg-transparent text-amber-500 dark:text-amber-400 border border-amber-500/50 truncate max-w-full">
        {label}
      </span>
    );
  }

  if (l.includes('review') || l.includes('reviewing') || l.includes('waiting confirmation')) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] bg-transparent text-sky-600 dark:text-sky-400 border border-sky-500/50 truncate max-w-full">
        {label}
      </span>
    );
  }

  if (
    l.includes('signed') ||
    l.includes('dispatched') ||
    l.includes('shipped') ||
    l.includes('complete') ||
    l.includes('delivered') ||
    l.includes('approved')
  ) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 truncate max-w-full">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 truncate max-w-full">
      {label}
    </span>
  );
};

// Distinct outlined service tags
export const getServiceTagStyle = (typeCode: string) => {
  const c = (typeCode || '').toUpperCase();
  if (c === 'TP') {
    return 'border-sky-500/60 text-sky-600 dark:text-sky-400';
  }
  if (c === 'IO') {
    return 'border-amber-500/60 text-amber-600 dark:text-amber-400';
  }
  if (c === 'SG') {
    return 'border-indigo-500/60 text-indigo-600 dark:text-indigo-400';
  }
  if (c === 'CONV') {
    return 'border-cyan-500/60 text-cyan-600 dark:text-cyan-400';
  }
  if (c === 'GFMR' || c === 'FMP') {
    return 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400';
  }
  if (c === 'MOD') {
    return 'border-purple-500/60 text-purple-600 dark:text-purple-400';
  }
  if (c === 'RAD') {
    return 'border-rose-500/60 text-rose-600 dark:text-rose-400';
  }
  return 'border-slate-400/60 text-slate-600 dark:text-slate-400';
};

// -------------------------------------------------------------
// 22-COLUMN SPECIFICATION & VISIBILITY DEFINITIONS
// -------------------------------------------------------------
export type ColumnKey =
  | 'tl'
  | 'scanCenter'
  | 'doctor'
  | 'patient'
  | 'lock'
  | 'notes'
  | 'archive'
  | 'more'
  | 'order'
  | 'billTo'
  | 'max'
  | 'mand'
  | 'format'
  | 'amount'
  | 'vouch'
  | 'received'
  | 'sent'
  | 'update'
  | 'charged'
  | 'action'
  | 'cr'
  | 'csTask';

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  baseWidth: number;
  category: 'Core' | 'Clinician' | 'Service' | 'Financial' | 'Anatomy' | 'Technical' | 'Timeline' | 'Status';
  align?: 'left' | 'center' | 'right';
}

export const ALL_COLUMNS: ColumnDefinition[] = [
  { key: 'tl', label: '# tl', baseWidth: 7.5, category: 'Core', align: 'center' },
  { key: 'scanCenter', label: 'Scan Center', baseWidth: 9.0, category: 'Clinician' },
  { key: 'doctor', label: 'Doctor', baseWidth: 8.5, category: 'Clinician' },
  { key: 'patient', label: 'Patient', baseWidth: 8.5, category: 'Clinician' },
  { key: 'lock', label: 'Lock', baseWidth: 3.5, category: 'Core', align: 'center' },
  { key: 'notes', label: 'Notes', baseWidth: 4.0, category: 'Core', align: 'center' },
  { key: 'archive', label: 'Archive', baseWidth: 5.0, category: 'Core', align: 'center' },
  { key: 'more', label: '...', baseWidth: 2.5, category: 'Core', align: 'center' },
  { key: 'order', label: 'Order', baseWidth: 10.0, category: 'Service' },
  { key: 'billTo', label: 'Bill To', baseWidth: 7.0, category: 'Financial' },
  { key: 'max', label: 'Max.', baseWidth: 3.5, category: 'Anatomy', align: 'center' },
  { key: 'mand', label: 'Mand.', baseWidth: 3.5, category: 'Anatomy', align: 'center' },
  { key: 'format', label: 'Format', baseWidth: 4.5, category: 'Technical', align: 'center' },
  { key: 'amount', label: 'Amount', baseWidth: 5.5, category: 'Financial', align: 'right' },
  { key: 'vouch', label: 'Vouch.', baseWidth: 3.5, category: 'Financial', align: 'center' },
  { key: 'received', label: 'Received', baseWidth: 7.0, category: 'Timeline' },
  { key: 'sent', label: 'Sent', baseWidth: 5.0, category: 'Timeline', align: 'center' },
  { key: 'update', label: 'Update', baseWidth: 5.0, category: 'Timeline', align: 'center' },
  { key: 'charged', label: 'Charged', baseWidth: 5.0, category: 'Financial', align: 'center' },
  { key: 'action', label: 'Action', baseWidth: 8.5, category: 'Status', align: 'center' },
  { key: 'cr', label: 'CR', baseWidth: 3.5, category: 'Status', align: 'center' },
  { key: 'csTask', label: 'CS-Task', baseWidth: 5.5, category: 'Status', align: 'center' },
];

export interface ServiceFilterState {
  rep: boolean;
  mod: boolean;
  conv: boolean;
  tp: boolean;
  sg: boolean;
  soft: boolean;
  vr: boolean;
  misc: boolean;
  restTemp: boolean;
  restFinal: boolean;
  other: boolean;
  GFMR: boolean;
  FMP: boolean;
}

const DEFAULT_FILTERS: ServiceFilterState = {
  rep: true,
  mod: true,
  conv: true,
  tp: true,
  sg: true,
  soft: true,
  vr: true,
  misc: true,
  restTemp: true,
  restFinal: true,
  other: true,
  GFMR: true,
  FMP: true,
};

const SERVICE_GROUPS = [
  {
    category: 'Planning & Scans',
    items: [
      { key: 'tp' as const, label: 'Treatment Plan', code: 'TP' },
      { key: 'conv' as const, label: 'DICOM Conv.', code: 'CONV' },
      { key: 'rep' as const, label: 'Radiology Report', code: 'RAD' },
      { key: 'vr' as const, label: 'Virtual Reality', code: 'VR' },
    ]
  },
  {
    category: 'Surgical Guides',
    items: [
      { key: 'sg' as const, label: 'Surgical Guide', code: 'SG' },
      { key: 'GFMR' as const, label: 'Guided Full Mouth', code: 'GFMR' },
      { key: 'FMP' as const, label: 'Fast Medical', code: 'FMP' },
    ]
  },
  {
    category: 'Restorations & Models',
    items: [
      { key: 'mod' as const, label: 'Model Work', code: 'MOD' },
      { key: 'restTemp' as const, label: 'Temp Rest.', code: 'TEMP' },
      { key: 'restFinal' as const, label: 'Final Rest.', code: 'REST' },
    ]
  },
  {
    category: 'Other Modules',
    items: [
      { key: 'soft' as const, label: 'Software', code: 'SOFT' },
      { key: 'misc' as const, label: 'Misc.', code: 'MISC' },
      { key: 'other' as const, label: 'Other', code: 'OTH' },
    ]
  }
];

export default function Flow() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const rawOrders = useStore((s) => s.getOrders());

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [servicesFilter, setServicesFilter] = useState<ServiceFilterState>(DEFAULT_FILTERS);
  const [viewFilter, setViewFilter] = useState<'all' | 'multi-tp' | 'action-required'>('all');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedScanCenter, setSelectedScanCenter] = useState<string>('ALL');

  // Closed / Collapsed by default as requested: "وعايز مقفول بالافتراضي"
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Quick View Drawer Modal
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<any | null>(null);
  const [subOrderViewMode, setSubOrderViewMode] = useState<'matrix' | 'cards'>('matrix');

  // -------------------------------------------------------------
  // COLUMN VISIBILITY STATE (User can choose which columns to show)
  // -------------------------------------------------------------
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.map((c) => c.key))
  );
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);
  const columnPickerRef = useRef<HTMLDivElement | null>(null);

  // Close column picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 3) next.delete(key); // keep at least 3 columns
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const setColumnPreset = (preset: 'all' | 'clinical' | 'compact') => {
    if (preset === 'all') {
      setVisibleColumns(new Set(ALL_COLUMNS.map((c) => c.key)));
    } else if (preset === 'clinical') {
      setVisibleColumns(
        new Set<ColumnKey>([
          'tl',
          'doctor',
          'patient',
          'order',
          'max',
          'mand',
          'format',
          'received',
          'action',
          'csTask'
        ])
      );
    } else if (preset === 'compact') {
      setVisibleColumns(
        new Set<ColumnKey>([
          'tl',
          'doctor',
          'patient',
          'order',
          'amount',
          'action'
        ])
      );
    }
    setShowColumnPicker(false);
  };

  // Dynamic Column Resizing (Excel-like drag resize)
  const [colWidthOverrides, setColWidthOverrides] = useState<Record<string, number>>({});

  const startResizing = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const th = (e.currentTarget as HTMLElement).closest('th');
    if (!th) return;

    const startX = e.clientX;
    const startWidth = th.getBoundingClientRect().width;
    let animationFrameId: number | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(75, Math.round(startWidth + delta));
        setColWidthOverrides(prev => {
          if (prev[key] === newWidth) return prev;
          return { ...prev, [key]: newWidth };
        });
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  };

  // Calculate dynamic column width so visible columns strictly sum to 100% or use pixel override
  const totalVisibleBaseWidth = useMemo(() => {
    return ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).reduce(
      (sum, c) => sum + c.baseWidth,
      0
    );
  }, [visibleColumns]);

  const getColWidth = (col: ColumnDefinition) => {
    if (colWidthOverrides[col.key]) {
      return `${colWidthOverrides[col.key]}px`;
    }
    return `${((col.baseWidth / totalVisibleBaseWidth) * 100).toFixed(2)}%`;
  };

  // -------------------------------------------------------------
  // HOVER TOOLTIP STATE FOR SERVICE BADGES IN ORDER COLUMN
  // -------------------------------------------------------------
  const [hoveredService, setHoveredService] = useState<{
    service: SubServiceItem;
    x: number;
    y: number;
  } | null>(null);

  const handleServiceHover = (service: SubServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredService({
      service,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleServiceLeave = () => {
    setHoveredService(null);
  };

  // Toggle single order expansion with swoosh sound
  const toggleOrderExpand = (orderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(orderId);
      if (isExpanding) {
        next.add(orderId);
      } else {
        next.delete(orderId);
      }
      playSwooshSound(isExpanding);
      return next;
    });
  };

  // Expand all or collapse all rows with sound
  const handleToggleExpandAll = () => {
    const isExpandingAll = expandedOrders.size !== filteredOrders.length;
    playSwooshSound(isExpandingAll);
    if (isExpandingAll) {
      setExpandedOrders(new Set(filteredOrders.map((o) => o.id)));
    } else {
      setExpandedOrders(new Set());
    }
  };

  const toggleService = (key: keyof ServiceFilterState) => {
    setServicesFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllServices = (val: boolean) => {
    const updated: any = {};
    Object.keys(DEFAULT_FILTERS).forEach((k) => {
      updated[k] = val;
    });
    setServicesFilter(updated);
  };

  const activeServicesCount = Object.values(servicesFilter).filter(Boolean).length;

  // Use complete 36-case dataset representing all sender tools, CaseXchange, CP, Connect, and clinical workflows
  const enrichedOrders: MasterWorkflowOrder[] = MASTER_WORKFLOW_ORDERS;

  const availableScanCenters = useMemo(() => {
    const s = new Set<string>();
    enrichedOrders.forEach((o) => {
      if (o.scanCenter) s.add(o.scanCenter);
    });
    return Array.from(s).sort();
  }, [enrichedOrders]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, viewFilter, servicesFilter, selectedScanCenter]);

  // Filtered orders according to search and view modes
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          order.orderNum.toLowerCase().includes(q) ||
          order.patientName.toLowerCase().includes(q) ||
          order.doctorName.toLowerCase().includes(q) ||
          order.scanCenter.toLowerCase().includes(q) ||
          order.services.some(s => s.title.toLowerCase().includes(q) || s.billTo.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (selectedScanCenter !== 'ALL' && order.scanCenter !== selectedScanCenter) {
        return false;
      }

      if (viewFilter === 'multi-tp') {
        const tpCount = order.services.filter(s => s.typeCode === 'TP').length;
        if (tpCount < 2) return false;
      } else if (viewFilter === 'action-required') {
        const hasAlert = order.services.some(s => s.hasActionAlert);
        if (!hasAlert) return false;
      }

      // Check if at least one service in the order matches active service filters
      if (activeServicesCount < 13) {
        const activeCodes = new Set<string>();
        if (servicesFilter.tp) activeCodes.add('TP');
        if (servicesFilter.conv) activeCodes.add('CONV');
        if (servicesFilter.rep) activeCodes.add('RAD');
        if (servicesFilter.vr) activeCodes.add('VR');
        if (servicesFilter.sg) activeCodes.add('SG');
        if (servicesFilter.GFMR) activeCodes.add('GFMR');
        if (servicesFilter.FMP) activeCodes.add('FMP');
        if (servicesFilter.mod) activeCodes.add('MOD');
        if (servicesFilter.restTemp) activeCodes.add('TEMP');
        if (servicesFilter.restFinal) activeCodes.add('REST');
        if (servicesFilter.soft) activeCodes.add('SOFT');
        if (servicesFilter.misc) activeCodes.add('MISC');
        if (servicesFilter.other) activeCodes.add('OTH');
        // IO is considered foundation unless no services match
        activeCodes.add('IO');

        const hasMatchingService = order.services.some(s => activeCodes.has(s.typeCode));
        if (!hasMatchingService) return false;
      }

      return true;
    });
  }, [enrichedOrders, search, viewFilter, servicesFilter, selectedScanCenter, activeServicesCount]);

  const [sortCol, setSortCol] = useState<string>('tl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      const getOrderColVal = (order: MasterWorkflowOrder, col: string) => {
        const prim = order.services[0];
        switch (col) {
          case 'tl':
            return order.orderNum;
          case 'scanCenter':
            return order.scanCenter;
          case 'doctor':
            return order.doctorName;
          case 'patient':
            return order.patientName;
          case 'lock':
            return order.isLocked ? 1 : 0;
          case 'notes':
            return order.notes;
          case 'archive':
            return order.archiveDate;
          case 'more':
            return order.serial;
          case 'order':
            return order.services.map(s => s.typeCode).join(' ');
          case 'billTo':
            return prim?.billTo || '';
          case 'max':
            return prim?.maxilla || '';
          case 'mand':
            return prim?.mandible || '';
          case 'format':
            return prim?.format || '';
          case 'amount':
            return order.services.reduce((acc, s) => acc + s.amount, 0);
          case 'vouch':
            return prim?.vouchers || '';
          case 'received':
            return prim?.receivedTime || '';
          case 'sent':
            return prim?.sentTime || '';
          case 'update':
            return prim?.updateTime || '';
          case 'charged':
            return prim?.chargedOn || '';
          case 'action':
            return prim?.actionLabel || '';
          case 'cr':
            return prim?.changeRequest || '';
          case 'csTask':
            return prim?.csTask?.assignee || '';
          default:
            return (order as any)[col] || '';
        }
      };

      aVal = getOrderColVal(a, sortCol);
      bVal = getOrderColVal(b, sortCol);

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined || aVal === '') return 1;
      if (bVal === null || bVal === undefined || bVal === '') return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredOrders, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Refined Minimalist Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Layers size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t('nav.flow', 'Orders Flow')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {filteredOrders.length} Cases
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live multi-service production pipeline
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/add-case')}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>{t('action.newCase', 'New Case')}</span>
        </button>
      </div>

      {/* 2. ADVANCED FILTERS MODAL (Enterprise Modal Pattern) */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-[#090e18] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-scale-up overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                  <Filter size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Advanced Production Filters
                  </h3>
                  <p className="text-xs text-slate-500">
                    Filter queue by clinical services, scan centers, and priority status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Filter 1: Clinical Services Module Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Clinical Service Modules ({activeServicesCount}/13 Active)
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAllServices(true)}
                      className="text-sky-600 dark:text-sky-400 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAllServices(false)}
                      className="text-slate-500 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SERVICE_GROUPS.map((grp) => (
                    <div key={grp.category} className="p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {grp.category}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {grp.items.map((item) => {
                          const active = servicesFilter[item.key as keyof ServiceFilterState];
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => toggleService(item.key as keyof ServiceFilterState)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                active
                                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-2xs'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-400 opacity-60 hover:opacity-100 bg-transparent'
                              }`}
                            >
                              <span className="font-mono text-[10px]">{item.code}</span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter 2: Scan Center Facilities */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Scan Center / Receiving Facility
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedScanCenter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedScanCenter === 'ALL'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All Scan Centers
                  </button>
                  {availableScanCenters.map((center) => (
                    <button
                      key={center}
                      type="button"
                      onClick={() => setSelectedScanCenter(center)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedScanCenter === center
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {center}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 3: Quick View Modes */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Queue View Mode
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all' as const, label: 'All Queue Orders' },
                    { id: 'multi-tp' as const, label: 'Multi-TP (2+ Plans)' },
                    { id: 'action-required' as const, label: '🚨 Action Required Only' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setViewFilter(mode.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        viewFilter === mode.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setAllServices(true);
                  setSelectedScanCenter('ALL');
                  setViewFilter('all');
                  setSearch('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Reset All Filters
              </button>

              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="px-5 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Apply Filters ({filteredOrders.length} Cases)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Compact Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0b101d] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('orders.searchPlaceholder', 'Filter by Order #, Patient, Doctor...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sleek Filter Trigger Button Beside Search */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeServicesCount < 13 || viewFilter !== 'all' || selectedScanCenter !== 'ALL'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Filter size={13} className={activeServicesCount < 13 || viewFilter !== 'all' || selectedScanCenter !== 'ALL' ? 'text-sky-500' : 'text-slate-400'} />
            <span>Filters</span>
            {activeServicesCount < 13 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[9.5px] font-bold">
                {activeServicesCount}/13
              </span>
            )}
          </button>
        </div>

        {/* View Mode Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-bold mr-1 hidden sm:inline">Views:</span>
          {(['all', 'multi-tp', 'action-required'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewFilter(mode)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                viewFilter === mode
                  ? 'border-sky-500/60 text-sky-600 dark:text-sky-400 bg-transparent'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-transparent'
              }`}
            >
              {mode === 'all' && `All Queue (${enrichedOrders.length})`}
              {mode === 'multi-tp' && 'Multi-TP (2+ Plan)'}
              {mode === 'action-required' && '🚨 Action Required'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MASTER FLOW TABLE */}
      <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        
        {/* Table Toolbar: Expand All & Column Visibility Selector */}
        <div className="p-3 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer bg-transparent"
              title="Expand/Collapse all cases"
            >
              {expandedOrders.size === filteredOrders.length ? (
                <>
                  <ChevronUp size={14} className="text-sky-500" />
                  <span>Collapse All Cases</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="text-sky-500" />
                  <span>Expand All Cases ({filteredOrders.length})</span>
                </>
              )}
            </button>
            <span className="text-slate-500 font-normal hidden md:inline text-[11px]">
              Click row to expand details • Stationary master rows
            </span>
          </div>

          <div className="flex items-center gap-2 relative" ref={columnPickerRef}>
            
            {/* COLUMN VISIBILITY SELECTOR DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer bg-transparent text-xs font-bold ${
                  visibleColumns.size < ALL_COLUMNS.length
                    ? 'border-sky-500/60 text-sky-600 dark:text-sky-400'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500'
                }`}
                title="Select which columns to display"
              >
                <Columns size={13} className="text-sky-500" />
                <span>Columns ({visibleColumns.size}/{ALL_COLUMNS.length})</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnPicker ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Menu */}
              {showColumnPicker && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Visible Columns ({visibleColumns.size})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowColumnPicker(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => setColumnPreset('all')}
                      className="flex-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 font-bold text-center cursor-pointer"
                    >
                      All (22)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnPreset('clinical')}
                      className="flex-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 font-bold text-center cursor-pointer"
                    >
                      Clinical (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnPreset('compact')}
                      className="flex-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 font-bold text-center cursor-pointer"
                    >
                      Minimal (6)
                    </button>
                  </div>

                  {/* Checkbox List */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
                    {ALL_COLUMNS.map((col) => {
                      const isChecked = visibleColumns.has(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center justify-between py-1.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumn(col.key)}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className={`font-semibold text-[11px] ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                              {col.label}
                            </span>
                          </div>
                          <span className="text-[9.5px] font-mono text-slate-400">
                            {col.category}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sub-order View Mode Toggle (Only visible when at least one order is expanded) */}
            {expandedOrders.size > 0 && (
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 bg-transparent animate-slide-up">
                <button
                  type="button"
                  onClick={() => setSubOrderViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    subOrderViewMode === 'matrix'
                      ? 'border border-sky-500/60 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Expanded 22-Column Table"
                >
                  <Table size={12} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubOrderViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    subOrderViewMode === 'cards'
                      ? 'border border-sky-500/60 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="22-Field Comprehensive Cards"
                >
                  <LayoutGrid size={12} />
                  <span>Cards</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Container - Responsive horizontal scrolling on mobile/phone screens only */}
        <div className="w-full overflow-x-auto sm:overflow-x-visible -webkit-overflow-scrolling-touch custom-scrollbar">
          <table className="w-full min-w-[1050px] sm:min-w-full text-left text-xs border-collapse table-fixed select-none">
            <colgroup>
              {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                <col key={`col-${col.key}`} style={{ width: getColWidth(col) }} />
              ))}
            </colgroup>
            <thead>
              {/* DYNAMIC HEADERS FROM VISIBLE COLUMNS - PROPORTIONALLY RESIZED TO 100% */}
              <tr className="bg-slate-200/80 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-[10.5px]">
                {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ width: getColWidth(col) }}
                    className={`py-2.5 px-1.5 truncate cursor-pointer select-none transition-colors hover:bg-slate-300 dark:hover:bg-slate-700 relative group/th max-w-0 overflow-hidden ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${sortCol === col.key ? 'text-sky-600 dark:text-sky-400 font-black' : ''}`}
                    title={`Click to sort by ${col.label} (Ascending/Descending) • Drag right border to resize`}
                  >
                    <div className={`inline-flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'} w-full min-w-0 overflow-hidden`}>
                      <span className="truncate">{col.label}</span>
                      <span className="shrink-0 inline-flex">
                        {sortCol === col.key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp size={11} className="text-sky-500" />
                          ) : (
                            <ArrowDown size={11} className="text-sky-500" />
                          )
                        ) : (
                          <ArrowUpDown size={10} className="text-slate-400 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </div>

                    {/* Excel-like column resize grip handle */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => startResizing(col.key, e)}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-sky-500/50 active:bg-sky-600 z-10 transition-colors"
                      title="Drag to resize column"
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.size} className="py-12 text-center text-slate-500 font-bold">
                    No matching cases in this production queue.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const tpCount = order.services.filter((s) => s.typeCode === 'TP').length;
                  const hasActionAlert = order.services.some((s) => s.hasActionAlert);
                  const totalCaseAmount = order.services.reduce((acc, s) => acc + s.amount, 0);
                  const primaryService = order.services[0];
                  const alertService = order.services.find((s) => s.hasActionAlert);

                  return (
                    <React.Fragment key={order.id}>
                      {/* 1. MASTER ORDER ROW (STATIONARY: DYNAMICALLY RENDERS VISIBLE COLUMNS ONLY) */}
                      <tr
                        onClick={() => toggleOrderExpand(order.id)}
                        className={`group transition-colors cursor-pointer font-medium border-b border-slate-200 dark:border-slate-800 ${
                          isExpanded
                            ? 'bg-sky-50/60 dark:bg-sky-950/20 border-l-4 border-l-sky-500'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {/* 1. # tl */}
                        {visibleColumns.has('tl') && (
                          <td className="py-2.5 px-2 text-left max-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                onClick={(e) => toggleOrderExpand(order.id, e)}
                                className={`p-0.5 rounded transition-transform duration-200 cursor-pointer shrink-0 ${
                                  isExpanded
                                    ? 'text-sky-500 rotate-90'
                                    : 'text-slate-400 group-hover:text-sky-500'
                                }`}
                                title={isExpanded ? 'Collapse case' : 'Expand full sub-services breakdown'}
                              >
                                <ChevronRight size={14} className="stroke-[3]" />
                              </span>
                              <div className="flex flex-col items-start leading-tight min-w-0 max-w-full overflow-hidden">
                                <span className="font-mono font-black text-amber-600 dark:text-amber-500 text-[11px] truncate block max-w-full">
                                  {order.orderNum}
                                </span>
                                <span className={`inline-block px-1 py-0.2 rounded text-[7.5px] tracking-wider uppercase mt-0.5 truncate max-w-full ${getSourceBadgeStyle(order.source)}`}>
                                  {order.source}
                                </span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* 2. Scan Center tl */}
                        {visibleColumns.has('scanCenter') && (
                          <td className="py-2.5 px-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px] max-w-0 overflow-hidden" title={order.scanCenter}>
                            <div className="truncate block w-full">{order.scanCenter}</div>
                          </td>
                        )}

                        {/* 3. Doctor tl */}
                        {visibleColumns.has('doctor') && (
                          <td className="py-2.5 px-1.5 text-[11px] max-w-0 overflow-hidden">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate block w-full" title={order.doctorName}>
                              {order.doctorName}
                            </div>
                            <div className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold truncate block w-full">
                              {order.doctorSub}
                            </div>
                          </td>
                        )}

                        {/* 4. Patient Name tl */}
                        {visibleColumns.has('patient') && (
                          <td className="py-2.5 px-1.5 text-[11px] max-w-0 overflow-hidden">
                            <div className="font-bold text-slate-900 dark:text-white truncate block w-full" title={order.patientName}>
                              {order.patientName}
                            </div>
                            <div className="text-[9px] text-amber-600 dark:text-amber-500 font-bold truncate block w-full">
                              {order.patientSub}
                            </div>
                          </td>
                        )}

                        {/* 5. Is Locked (?) */}
                        {visibleColumns.has('lock') && (
                          <td className="py-2.5 px-1 text-center max-w-0 overflow-hidden">
                            <div className="flex flex-col items-center truncate">
                              {order.isLocked ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-transparent truncate">
                                  Lock
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-rose-500/50 text-rose-600 dark:text-rose-400 bg-transparent truncate">
                                  Sales
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* 6. Notes */}
                        {visibleColumns.has('notes') && (
                          <td className="py-2.5 px-1 text-center text-[10px] text-slate-700 dark:text-slate-300 font-medium max-w-0 overflow-hidden">
                            <span className="underline cursor-pointer truncate block w-full" title={order.notes}>
                              {order.notes}
                            </span>
                          </td>
                        )}

                        {/* 7. Archive Date */}
                        {visibleColumns.has('archive') && (
                          <td className="py-2.5 px-1 text-center text-[10px] font-mono text-slate-600 dark:text-slate-400 max-w-0 overflow-hidden">
                            <div className="flex items-center justify-center gap-0.5 truncate w-full">
                              <span className="truncate">{order.archiveDate}</span>
                              <ShoppingCart size={10} className="text-emerald-500 inline shrink-0" />
                            </div>
                          </td>
                        )}

                        {/* 8. ... */}
                        {visibleColumns.has('more') && (
                          <td className="py-2.5 px-0.5 text-center max-w-0 overflow-hidden" onClick={(e) => { e.stopPropagation(); navigate(`/order-details?ID=${order.orderNum}`); }}>
                            <MoreHorizontal size={13} className="text-slate-400 hover:text-sky-500 mx-auto cursor-pointer" />
                          </td>
                        )}

                        {/* 9. Order (SERVICE TAGS WITH LIVE HOVER TOOLTIP) */}
                        {visibleColumns.has('order') && (
                          <td className="py-2.5 px-1.5 max-w-0 overflow-hidden">
                            <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
                              {order.services.map((sub, sIdx) => (
                                <div
                                  key={sub.id || sIdx}
                                  className="relative shrink-0"
                                  onMouseEnter={(e) => handleServiceHover(sub, e)}
                                  onMouseLeave={handleServiceLeave}
                                >
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border bg-transparent cursor-pointer transition-all hover:scale-105 inline-block ${getServiceTagStyle(sub.typeCode)}`}
                                  >
                                    {sub.typeCode}
                                  </span>
                                </div>
                              ))}

                              {!isExpanded && (
                                <span className="text-[8.5px] text-slate-400 hover:text-sky-500 ml-0.5 font-bold cursor-pointer shrink-0">
                                  ▼
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* 10. Bill To */}
                        {visibleColumns.has('billTo') && (
                          <td className="py-2.5 px-1.5 text-[10.5px] text-slate-600 dark:text-slate-400 max-w-0 overflow-hidden" title={primaryService?.billTo}>
                            <div className="truncate block w-full">{primaryService?.billTo}</div>
                          </td>
                        )}

                        {/* 11. Maxilla */}
                        {visibleColumns.has('max') && (
                          <td className="py-2.5 px-1 text-center font-bold text-[10.5px] text-emerald-600 dark:text-emerald-400 max-w-0 overflow-hidden" title={primaryService?.maxilla}>
                            <div className="truncate block w-full">{primaryService?.maxilla}</div>
                          </td>
                        )}

                        {/* 12. Mandible */}
                        {visibleColumns.has('mand') && (
                          <td className="py-2.5 px-1 text-center font-bold text-[10.5px] text-emerald-600 dark:text-emerald-400 max-w-0 overflow-hidden" title={primaryService?.mandible}>
                            <div className="truncate block w-full">{primaryService?.mandible}</div>
                          </td>
                        )}

                        {/* 13. Format */}
                        {visibleColumns.has('format') && (
                          <td className="py-2.5 px-1 text-center font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 max-w-0 overflow-hidden" title={primaryService?.format}>
                            <div className="truncate block w-full">{primaryService?.format}</div>
                          </td>
                        )}

                        {/* 14. Amount */}
                        {visibleColumns.has('amount') && (
                          <td className="py-2.5 px-1.5 text-right font-mono font-black text-[11px] text-slate-900 dark:text-white max-w-0 overflow-hidden" title={`$${totalCaseAmount}.00`}>
                            <div className="truncate block w-full">${totalCaseAmount}.00</div>
                          </td>
                        )}

                        {/* 15. Vouchers */}
                        {visibleColumns.has('vouch') && (
                          <td className="py-2.5 px-1 text-center font-mono text-[10px] text-slate-500 max-w-0 overflow-hidden" title={primaryService?.vouchers}>
                            <div className="truncate block w-full">{primaryService?.vouchers}</div>
                          </td>
                        )}

                        {/* 16. Received Time */}
                        {visibleColumns.has('received') && (
                          <td className="py-2.5 px-1.5 font-mono text-[9.5px] text-slate-600 dark:text-slate-400 max-w-0 overflow-hidden" title={primaryService?.receivedTime}>
                            <div className="truncate block w-full">{primaryService?.receivedTime}</div>
                          </td>
                        )}

                        {/* 17. Sent Time */}
                        {visibleColumns.has('sent') && (
                          <td className="py-2.5 px-1 text-center font-mono text-[9.5px] text-slate-500 max-w-0 overflow-hidden" title={primaryService?.sentTime}>
                            <div className="truncate block w-full">{primaryService?.sentTime}</div>
                          </td>
                        )}

                        {/* 18. Update Time */}
                        {visibleColumns.has('update') && (
                          <td className="py-2.5 px-1 text-center font-mono text-[9.5px] text-slate-500 max-w-0 overflow-hidden" title={primaryService?.updateTime}>
                            <div className="truncate block w-full">{primaryService?.updateTime}</div>
                          </td>
                        )}

                        {/* 19. Charged On */}
                        {visibleColumns.has('charged') && (
                          <td className="py-2.5 px-1 text-center font-mono text-[9.5px] text-slate-500 max-w-0 overflow-hidden" title={primaryService?.chargedOn}>
                            <div className="truncate block w-full">{primaryService?.chargedOn}</div>
                          </td>
                        )}

                        {/* 20. Action */}
                        {visibleColumns.has('action') && (
                          <td className="py-2.5 px-1 text-center max-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="overflow-hidden flex items-center justify-center">
                              {renderActionStatusBadge(
                                hasActionAlert ? (alertService?.actionLabel || 'No Scans') : (primaryService?.actionLabel || 'In Progress'),
                                hasActionAlert,
                                alertService?.actionButtonText || 'Upload',
                                (e) => {
                                  e.stopPropagation();
                                  navigate(`/order-details?ID=${order.orderNum}`);
                                }
                              )}
                            </div>
                          </td>
                        )}

                        {/* 21. Change Request */}
                        {visibleColumns.has('cr') && (
                          <td className="py-2.5 px-1 text-center font-mono text-[10px] text-rose-600 font-bold max-w-0 overflow-hidden" title={primaryService?.changeRequest}>
                            <div className="truncate block w-full">{primaryService?.changeRequest || '-'}</div>
                          </td>
                        )}

                        {/* 22. CS-Task */}
                        {visibleColumns.has('csTask') && (
                          <td className="py-2.5 px-1 text-center max-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="truncate block w-full">
                              <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] hover:text-sky-500 cursor-pointer">
                                {primaryService?.csTask?.assignee ? primaryService.csTask.assignee : 'Assign'}
                              </span>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* 2. EXPANDED ACCORDION: SMOOTH SLIDE-DOWN & SLIDE-UP */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <tr key={`expanded-row-${order.id}`} className="bg-slate-50/50 dark:bg-slate-950/40">
                            <td colSpan={visibleColumns.size} className="p-0 border-b border-sky-500/30">
                              <motion.div
                                key={`detail-anim-${order.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="p-3.5 space-y-3 bg-slate-50/30 dark:bg-slate-900/30 border-l-4 border-l-sky-500">
                                  
                                  {/* Sub-orders Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-sky-500/40 text-sky-600 dark:text-sky-400 bg-transparent">
                                        CASE #{order.orderNum}
                                      </span>
                                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                        {order.services.length} Linked Sub-Services Breakdown
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/order-details?ID=${order.orderNum}`)}
                                      className="flex items-center gap-1 px-3 py-1 rounded-lg border border-sky-500/50 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold transition-all cursor-pointer bg-transparent"
                                    >
                                      <span>Open Full Order Details</span>
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>

                                  {/* Sub-Orders View Mode 1: Table Matrix */}
                                  {subOrderViewMode === 'matrix' ? (
                                    <div className="overflow-x-auto sm:overflow-x-visible -webkit-overflow-scrolling-touch custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0b101d]">
                                      <table className="w-full min-w-[1050px] sm:min-w-full text-left text-xs border-collapse table-fixed select-none">
                                        <colgroup>
                                          {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                                            <col key={`sub-col-${col.key}`} style={{ width: getColWidth(col) }} />
                                          ))}
                                        </colgroup>
                                        <thead>
                                          <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                                            {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                                              <th
                                                key={`sub-th-${col.key}`}
                                                style={{ width: getColWidth(col) }}
                                                className={`py-2 px-1.5 truncate max-w-0 overflow-hidden ${
                                                  col.align === 'center'
                                                    ? 'text-center'
                                                    : col.align === 'right'
                                                    ? 'text-right'
                                                    : 'text-left'
                                                }`}
                                              >
                                                <span className="truncate block w-full">{col.label}</span>
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                          {order.services.map((sub, srvIdx) => (
                                            <tr
                                              key={sub.id}
                                              className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-medium transition-colors"
                                            >
                                              {visibleColumns.has('tl') && (
                                                <td className="py-2 px-1 text-center font-mono text-[10px] text-slate-400 max-w-0 overflow-hidden">
                                                  <div className="truncate block w-full">↳ #{srvIdx + 1}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('scanCenter') && (
                                                <td className="py-2 px-1.5 text-[10px] text-slate-400 max-w-0 overflow-hidden" title={order.scanCenter}>
                                                  <div className="truncate block w-full">{order.scanCenter}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('doctor') && (
                                                <td className="py-2 px-1.5 text-[10px] text-slate-400 max-w-0 overflow-hidden" title={order.doctorName}>
                                                  <div className="truncate block w-full">{order.doctorName}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('patient') && (
                                                <td className="py-2 px-1.5 text-[10px] text-slate-400 max-w-0 overflow-hidden" title={order.patientName}>
                                                  <div className="truncate block w-full">{order.patientName}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('lock') && (
                                                <td className="py-2 px-1 text-center text-[10px] text-slate-400 max-w-0 overflow-hidden">
                                                  -
                                                </td>
                                              )}
                                              {visibleColumns.has('notes') && (
                                                <td className="py-2 px-1 text-center text-[10px] text-slate-400 max-w-0 overflow-hidden" title={order.notes}>
                                                  <div className="truncate block w-full">{order.notes}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('archive') && (
                                                <td className="py-2 px-1 text-center text-[10px] font-mono text-slate-400 max-w-0 overflow-hidden">
                                                  <div className="truncate block w-full">{order.archiveDate}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('more') && (
                                                <td className="py-2 px-0.5 text-center text-slate-400 max-w-0 overflow-hidden">•</td>
                                              )}
                                              {visibleColumns.has('order') && (
                                                <td className="py-2 px-1.5 max-w-0 overflow-hidden">
                                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border bg-transparent shrink-0 ${getServiceTagStyle(sub.typeCode)}`}>
                                                      {sub.typeCode}
                                                    </span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                      {sub.title}
                                                    </span>
                                                  </div>
                                                </td>
                                              )}
                                              {visibleColumns.has('billTo') && (
                                                <td className="py-2 px-1.5 text-[10px] text-slate-500 max-w-0 overflow-hidden" title={sub.billTo}>
                                                  <div className="truncate block w-full">{sub.billTo}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('max') && (
                                                <td className="py-2 px-1 text-center font-bold text-emerald-600 dark:text-emerald-400 text-[10px] max-w-0 overflow-hidden" title={sub.maxilla}>
                                                  <div className="truncate block w-full">{sub.maxilla}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('mand') && (
                                                <td className="py-2 px-1 text-center font-bold text-emerald-600 dark:text-emerald-400 text-[10px] max-w-0 overflow-hidden" title={sub.mandible}>
                                                  <div className="truncate block w-full">{sub.mandible}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('format') && (
                                                <td className="py-2 px-1 text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 max-w-0 overflow-hidden" title={sub.format}>
                                                  <div className="truncate block w-full">{sub.format}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('amount') && (
                                                <td className="py-2 px-1.5 text-right font-mono font-bold text-[10.5px] text-slate-900 dark:text-white max-w-0 overflow-hidden" title={`$${sub.amount}.00`}>
                                                  <div className="truncate block w-full">${sub.amount}.00</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('vouch') && (
                                                <td className="py-2 px-1 text-center font-mono text-[10px] text-slate-400 max-w-0 overflow-hidden">
                                                  <div className="truncate block w-full">{sub.vouchers}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('received') && (
                                                <td className="py-2 px-1.5 font-mono text-[9px] text-slate-500 max-w-0 overflow-hidden" title={sub.receivedTime}>
                                                  <div className="truncate block w-full">{sub.receivedTime}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('sent') && (
                                                <td className="py-2 px-1 text-center font-mono text-[9px] text-slate-400 max-w-0 overflow-hidden" title={sub.sentTime}>
                                                  <div className="truncate block w-full">{sub.sentTime}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('update') && (
                                                <td className="py-2 px-1 text-center font-mono text-[9px] text-slate-400 max-w-0 overflow-hidden" title={sub.updateTime}>
                                                  <div className="truncate block w-full">{sub.updateTime}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('charged') && (
                                                <td className="py-2 px-1 text-center font-mono text-[9px] text-slate-400 max-w-0 overflow-hidden" title={sub.chargedOn}>
                                                  <div className="truncate block w-full">{sub.chargedOn}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('action') && (
                                                <td className="py-2 px-1 text-center max-w-0 overflow-hidden">
                                                  <div className="overflow-hidden flex items-center justify-center">
                                                    {renderActionStatusBadge(
                                                      sub.actionLabel,
                                                      sub.hasActionAlert,
                                                      sub.actionButtonText,
                                                      (e) => {
                                                        e.stopPropagation();
                                                        navigate(`/order-details?ID=${order.orderNum}`);
                                                      }
                                                    )}
                                                  </div>
                                                </td>
                                              )}
                                              {visibleColumns.has('cr') && (
                                                <td className="py-2 px-1 text-center font-mono text-[10px] text-rose-600 max-w-0 overflow-hidden" title={sub.changeRequest}>
                                                  <div className="truncate block w-full">{sub.changeRequest || '-'}</div>
                                                </td>
                                              )}
                                              {visibleColumns.has('csTask') && (
                                                <td className="py-2 px-1 text-center text-[10px] text-slate-500 max-w-0 overflow-hidden">
                                                  <div className="truncate block w-full">
                                                    {sub.csTask.assignee ? `by ${sub.csTask.assignee}` : 'Assign'}
                                                  </div>
                                                </td>
                                              )}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    /* Sub-Orders View Mode 2: Enhanced Comprehensive 22-Field Cards */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                      {order.services.map((sub, srvIdx) => (
                                        <div
                                          key={sub.id}
                                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101d] space-y-2.5 shadow-xs hover:border-sky-400 dark:hover:border-sky-500 transition-all"
                                        >
                                          {/* Card Header: Type Badge, Title, Amount */}
                                          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border bg-transparent ${getServiceTagStyle(sub.typeCode)}`}>
                                                {sub.typeCode}
                                              </span>
                                              <div>
                                                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1" title={sub.title}>
                                                  {sub.title}
                                                </h5>
                                                <div className="text-[10px] text-slate-400">Sub-Service #{srvIdx + 1}</div>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <span className="font-mono font-black text-xs text-slate-900 dark:text-white block">
                                                ${sub.amount}.00
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-mono">Billed USD</span>
                                            </div>
                                          </div>

                                          {/* Clinical & Financial Specs Grid */}
                                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                              <span className="text-slate-400 block font-medium">Bill To Entity:</span>
                                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block" title={sub.billTo}>
                                                {sub.billTo}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block font-medium">Export Format:</span>
                                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                                                {sub.format}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block font-medium">Anatomy Arches:</span>
                                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                                Max: {sub.maxilla} / Mand: {sub.mandible}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block font-medium">Voucher Ref:</span>
                                              <span className="font-mono text-slate-700 dark:text-slate-300 block">
                                                {sub.vouchers || 'N/A'}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Timeline & CS Assignment Strip */}
                                          <div className="space-y-1 text-[9.5px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                                            <div className="flex justify-between items-center">
                                              <span>Received: <strong className="text-slate-700 dark:text-slate-300">{sub.receivedTime}</strong></span>
                                              <span>Sent: <strong className="text-slate-700 dark:text-slate-300">{sub.sentTime}</strong></span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span>Updated: <strong className="text-slate-700 dark:text-slate-300">{sub.updateTime}</strong></span>
                                              <span>Charged: <strong className="text-slate-700 dark:text-slate-300">{sub.chargedOn}</strong></span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                                              <span>CR: <strong className="text-rose-500">{sub.changeRequest}</strong></span>
                                              <span>CS-Task: <strong className="text-indigo-500">{sub.csTask.assignee ? `Assigned to ${sub.csTask.assignee}` : 'Unassigned'}</strong></span>
                                            </div>
                                          </div>

                                          {/* Action Footer */}
                                          <div className="flex justify-between items-center pt-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/order-details?ID=${order.orderNum}`);
                                              }}
                                              className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>Inspect Service</span>
                                              <ExternalLink size={10} />
                                            </button>
                                            {renderActionStatusBadge(sub.actionLabel, sub.hasActionAlert, sub.actionButtonText, (e) => {
                                              e.stopPropagation();
                                              navigate(`/order-details?ID=${order.orderNum}`);
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Accessible Modern Pagination */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 dark:text-slate-300">
              Showing <strong className="text-sky-600 dark:text-sky-400">{filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong className="text-sky-600 dark:text-sky-400">{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> of <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> Cases
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  currentPage === page
                    ? 'border border-sky-500/70 text-sky-600 dark:text-sky-400 bg-sky-500/10'
                    : 'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-sky-500'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={36}>All (36)</option>
            </select>
          </div>
        </div>

      </div>

      {/* 5. FLOATING TOOLTIP FOR HOVERED SERVICE TAG (PORTAL OVERLAY) */}
      <AnimatePresence>
        {hoveredService && (() => {
          const tooltipWidth = 340;
          const tooltipHeight = 185;
          const xPos = Math.min(window.innerWidth - tooltipWidth - 16, Math.max(16, hoveredService.x - tooltipWidth / 2));
          const isNearTop = hoveredService.y < tooltipHeight + 20;
          const yPos = isNearTop ? hoveredService.y + 28 : hoveredService.y - tooltipHeight - 10;

          return (
            <motion.div
              key="service-tooltip"
              initial={{ opacity: 0, scale: 0.95, y: isNearTop ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: isNearTop ? -4 : 4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-50 pointer-events-none p-4 rounded-2xl bg-white/95 dark:bg-[#0c1322]/95 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 shadow-2xl shadow-sky-950/15 dark:shadow-black/70 backdrop-blur-md w-84 sm:w-[340px] space-y-2.5 text-xs"
              style={{
                left: xPos,
                top: yPos,
              }}
            >
              {/* Header: Service Badge + Full Title */}
              <div className="flex items-start justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] tracking-tight border bg-transparent shrink-0 ${getServiceTagStyle(hoveredService.service.typeCode)}`}>
                    {hoveredService.service.typeCode}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate leading-snug">
                      {hoveredService.service.title}
                    </h4>
                    {hoveredService.service.subtitle && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {hoveredService.service.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                  ${hoveredService.service.amount}.00
                </span>
              </div>

              {/* Technical & Anatomical Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {hoveredService.service.format || 'Standard CAD'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Anatomical Site</span>
                  <div className="flex items-center gap-1 font-bold text-[10.5px]">
                    <span className={hoveredService.service.maxilla !== 'None' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}>
                      Max: {hoveredService.service.maxilla}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className={hoveredService.service.mandible !== 'None' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                      Mand: {hoveredService.service.mandible}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="text-[11px] p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bill To Account</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold truncate block">
                  {hoveredService.service.billTo}
                </span>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Clinical Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-transparent flex items-center gap-1.5 ${
                  hoveredService.service.hasActionAlert
                    ? 'border-amber-500/50 text-amber-700 dark:text-amber-400'
                    : 'border-sky-500/50 text-sky-700 dark:text-sky-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hoveredService.service.hasActionAlert ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  <span>{hoveredService.service.actionLabel}</span>
                </span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
