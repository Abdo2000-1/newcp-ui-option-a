import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  ShoppingCart,
  Plus,
  Table,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ExternalLink,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import {
  MASTER_WORKFLOW_ORDERS,
  MasterWorkflowOrder,
  SubServiceItem
} from '@/shared/data/flowMockData';

// Web Audio API helper for smooth swoosh sound effect on expand/collapse
function playSwooshSound(isExpanding: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  } catch {
    // Audio policy fallback
  }
}

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

// Approved Action Colors & Status Badge Renderer
export const renderActionStatusBadge = (
  label: string,
  isAlert: boolean,
  buttonText?: string,
  onAction?: (e: React.MouseEvent) => void
) => {
  if (isAlert) {
    return (
      <button
        type="button"
        onClick={onAction}
        className="px-2 py-0.5 rounded-lg font-bold text-[9px] leading-tight border border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer inline-flex flex-col items-center transition-all shadow-2xs"
        title="Action Required - Click to open Order Details"
      >
        <span>{label || 'No Scans'}</span>
        {buttonText && (
          <span className="mt-0.5 px-1 py-0.5 rounded bg-rose-600 text-white text-[8px] font-bold">
            {buttonText}
          </span>
        )}
      </button>
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
      <button
        type="button"
        onClick={onAction}
        className="px-2 py-0.5 rounded-full font-bold text-[9px] border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer truncate max-w-full transition-all"
        title={`${label} - Click to open Order Details`}
      >
        {label}
      </button>
    );
  }

  if (l.includes('pending')) {
    return (
      <button
        type="button"
        onClick={onAction}
        className="px-2 py-0.5 rounded-full font-bold text-[9px] border border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 cursor-pointer truncate max-w-full transition-all"
        title={`${label} - Click to open Order Details`}
      >
        {label}
      </button>
    );
  }

  if (l.includes('review') || l.includes('reviewing') || l.includes('waiting confirmation')) {
    return (
      <button
        type="button"
        onClick={onAction}
        className="px-2 py-0.5 rounded-full font-bold text-[9px] border border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 cursor-pointer truncate max-w-full transition-all"
        title={`${label} - Click to open Order Details`}
      >
        {label}
      </button>
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
      <button
        type="button"
        onClick={onAction}
        className="px-2 py-0.5 rounded-full font-bold text-[9px] border border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer truncate max-w-full transition-all"
        title={`${label} - Click to open Order Details`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onAction}
      className="px-2 py-0.5 rounded-full font-bold text-[9px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-500 cursor-pointer truncate max-w-full transition-all"
      title={`${label} - Click to open Order Details`}
    >
      {label}
    </button>
  );
};

// -------------------------------------------------------------
// COLLAPSED ORDER TABLE COLUMNS (Shared Columns Only)
// -------------------------------------------------------------
export interface CollapsedColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  widthPercent: number;
}

export const COLLAPSED_ORDER_COLUMNS: CollapsedColumnDef[] = [
  { key: 'tl', label: '#', align: 'left', widthPercent: 8 },
  { key: 'scanCenter', label: 'Scan Center', align: 'left', widthPercent: 14 },
  { key: 'doctor', label: 'Doctor', align: 'left', widthPercent: 12 },
  { key: 'lock', label: 'Lock', align: 'center', widthPercent: 6 },
  { key: 'notes', label: 'Notes', align: 'center', widthPercent: 9 },
  { key: 'archive', label: 'Archive', align: 'center', widthPercent: 8 },
  { key: 'more', label: '...', align: 'center', widthPercent: 4 },
  { key: 'order', label: 'Order', align: 'left', widthPercent: 13 },
  { key: 'max', label: 'Max', align: 'center', widthPercent: 6 },
  { key: 'mand', label: 'Mand', align: 'center', widthPercent: 6 },
  { key: 'amount', label: 'Amount', align: 'right', widthPercent: 8 },
  { key: 'received', label: 'Received', align: 'left', widthPercent: 10 },
];

// -------------------------------------------------------------
// EXPANDED ORDER SERVICE-SPECIFIC COLUMNS
// -------------------------------------------------------------
export interface ExpandedServiceColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  widthPercent: number;
}

export const EXPANDED_SERVICE_COLUMNS: ExpandedServiceColumnDef[] = [
  { key: 'service', label: 'Service', align: 'left', widthPercent: 15 },
  { key: 'billTo', label: 'Bill To', align: 'left', widthPercent: 15 },
  { key: 'format', label: 'Format', align: 'center', widthPercent: 8 },
  { key: 'vouchers', label: 'Voucher', align: 'center', widthPercent: 8 },
  { key: 'sentTime', label: 'Sent', align: 'center', widthPercent: 9 },
  { key: 'updateTime', label: 'Update', align: 'center', widthPercent: 9 },
  { key: 'chargedOn', label: 'Charged', align: 'center', widthPercent: 9 },
  { key: 'action', label: 'Action', align: 'center', widthPercent: 12 },
  { key: 'changeRequest', label: 'CR', align: 'center', widthPercent: 6 },
  { key: 'csTask', label: 'CS Task', align: 'center', widthPercent: 9 },
];

export default function Flow() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Search input state
  const [search, setSearch] = useState('');

  // -------------------------------------------------------------
  // STRICT FILTERS SPECIFICATION (Services, Status, Duration)
  // -------------------------------------------------------------
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [durationFilter, setDurationFilter] = useState<string>('ALL');

  // Accordion expansion state: closed/collapsed by default
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Sub-order view mode for expanded accordion: Table or Cards
  const [subOrderViewMode, setSubOrderViewMode] = useState<'matrix' | 'cards'>('matrix');

  // Sorting state
  const [sortCol, setSortCol] = useState<string>('tl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // -------------------------------------------------------------
  // PAGINATION SPECIFICATION (Default to 50 rows per page)
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Hover tooltip state for service badges in the Order column
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

  // Toggle single order accordion expansion
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

  // Expand all or collapse all rows
  const handleToggleExpandAll = () => {
    const isExpandingAll = expandedOrders.size !== filteredOrders.length;
    playSwooshSound(isExpandingAll);
    if (isExpandingAll) {
      setExpandedOrders(new Set(filteredOrders.map((o) => o.id)));
    } else {
      setExpandedOrders(new Set());
    }
  };

  const enrichedOrders: MasterWorkflowOrder[] = MASTER_WORKFLOW_ORDERS;

  // Reset pagination on filter changes
  const handleResetFilters = () => {
    setServiceFilter('ALL');
    setStatusFilter('ALL');
    setDurationFilter('ALL');
    setSearch('');
    setCurrentPage(1);
  };

  const isFilterActive = serviceFilter !== 'ALL' || statusFilter !== 'ALL' || durationFilter !== 'ALL' || search !== '';

  // Filtered orders according strictly to Services, Status, and Duration filters
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      // 1. Search Query filter (matches orderNum, patient, doctor, scan center, services)
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          order.orderNum.toLowerCase().includes(q) ||
          order.patientName.toLowerCase().includes(q) ||
          order.doctorName.toLowerCase().includes(q) ||
          order.scanCenter.toLowerCase().includes(q) ||
          order.services.some((s) => s.title.toLowerCase().includes(q) || s.billTo.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Services Filter (matches clinical type code across linked services)
      if (serviceFilter !== 'ALL') {
        const hasMatchingService = order.services.some(
          (s) => s.typeCode.toUpperCase() === serviceFilter.toUpperCase()
        );
        if (!hasMatchingService) return false;
      }

      // 3. Status Filter (matches status badge / alert state)
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTION_REQUIRED') {
          const hasAlert = order.services.some((s) => s.hasActionAlert || s.actionLabel.toLowerCase().includes('no scans'));
          if (!hasAlert) return false;
        } else if (statusFilter === 'IN_PROGRESS') {
          const hasInProgress = order.services.some((s) => s.actionLabel.toLowerCase().includes('in progress'));
          if (!hasInProgress) return false;
        } else if (statusFilter === 'COMPLETED') {
          const hasCompleted = order.services.some(
            (s) =>
              s.actionLabel.toLowerCase().includes('complete') ||
              s.actionLabel.toLowerCase().includes('shipped') ||
              s.actionLabel.toLowerCase().includes('delivered') ||
              s.actionLabel.toLowerCase().includes('approved')
          );
          if (!hasCompleted) return false;
        } else if (statusFilter === 'PENDING') {
          const hasPending = order.services.some((s) => s.actionLabel.toLowerCase().includes('pending'));
          if (!hasPending) return false;
        } else if (statusFilter === 'ON_HOLD') {
          const hasHold = order.services.some(
            (s) =>
              s.actionLabel.toLowerCase().includes('hold') ||
              s.actionLabel.toLowerCase().includes('review') ||
              s.actionLabel.toLowerCase().includes('waiting confirmation')
          );
          if (!hasHold) return false;
        }
      }

      // 4. Duration Filter
      if (durationFilter !== 'ALL') {
        if (durationFilter === 'TODAY') {
          const matches = order.services.some((s) => s.receivedTime?.toLowerCase().includes('today') || order.archiveDate?.includes('2026-09-28'));
          if (!matches) return false;
        } else if (durationFilter === 'LAST_7_DAYS') {
          // Keep recent cases within the active 7-day demo window
          const matches = order.serial <= 15;
          if (!matches) return false;
        } else if (durationFilter === 'LAST_30_DAYS') {
          // Keep monthly cases
          const matches = order.serial <= 30;
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [enrichedOrders, search, serviceFilter, statusFilter, durationFilter]);

  // Sorting
  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      let aVal: unknown = '';
      let bVal: unknown = '';

      const getOrderColVal = (order: MasterWorkflowOrder, col: string) => {
        const prim = order.services[0];
        switch (col) {
          case 'tl':
            return order.orderNum;
          case 'scanCenter':
            return order.scanCenter;
          case 'doctor':
            return order.doctorName;
          case 'lock':
            return order.isLocked ? 1 : 0;
          case 'notes':
            return order.notes;
          case 'archive':
            return order.archiveDate;
          case 'more':
            return order.serial;
          case 'order':
            return order.services.map((s) => s.typeCode).join(' ');
          case 'max':
            return prim?.maxilla || '';
          case 'mand':
            return prim?.mandible || '';
          case 'amount':
            return order.services.reduce((acc, s) => acc + (s.amount ?? 0), 0);
          case 'received':
            return prim?.receivedTime || '';
          default:
            return (order as unknown as Record<string, unknown>)[col] || '';
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

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  return (
    <div className="space-y-4 w-full min-w-0" data-testid="order-flow-page">

      {/* 1. Page Header with Title: Order Flow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Layers size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                data-testid="order-flow-page-title"
              >
                {t('flow.title', 'Order Flow')}
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

      {/* 2. Focused Filter Controls Bar (Services, Status, Duration ONLY) */}
      <div
        className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0b101d] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs"
        data-testid="order-flow-filters-container"
      >
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('orders.searchPlaceholder', 'Search Order #, Doctor, Patient...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Filter 1: Services Filter */}
          <div className="flex items-center gap-1.5" data-testid="filter-services-group">
            <label htmlFor="filter-services" className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
              {t('flow.filterServices', 'Services:')}
            </label>
            <select
              id="filter-services"
              data-testid="filter-services"
              aria-label="Services"
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-white dark:bg-[#0c1222] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Services</option>
              <option value="TP">Treatment Plan (TP)</option>
              <option value="IO">Intra-Oral Scan (IO)</option>
              <option value="SG">Surgical Guide (SG)</option>
              <option value="CONV">DICOM Conv. (CONV)</option>
              <option value="GFMR">Guided Full Mouth (GFMR)</option>
              <option value="MOD">Model Work (MOD)</option>
              <option value="RAD">Radiology Report (RAD)</option>
              <option value="VR">Virtual Reality (VR)</option>
              <option value="FMP">Fast Medical (FMP)</option>
            </select>
          </div>

          {/* Filter 2: Status Filter */}
          <div className="flex items-center gap-1.5" data-testid="filter-status-group">
            <label htmlFor="filter-status" className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
              {t('flow.filterStatus', 'Status:')}
            </label>
            <select
              id="filter-status"
              data-testid="filter-status"
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-white dark:bg-[#0c1222] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ACTION_REQUIRED">Action Required / No Scans</option>
              <option value="COMPLETED">Completed / Delivered</option>
              <option value="PENDING">Pending</option>
              <option value="ON_HOLD">Review / Waiting Confirmation</option>
            </select>
          </div>

          {/* Filter 3: Duration Filter */}
          <div className="flex items-center gap-1.5" data-testid="filter-duration-group">
            <label htmlFor="filter-duration" className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
              {t('flow.filterDuration', 'Duration:')}
            </label>
            <select
              id="filter-duration"
              data-testid="filter-duration"
              aria-label="Duration"
              value={durationFilter}
              onChange={(e) => {
                setDurationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-white dark:bg-[#0c1222] border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Reset Filters CTA */}
        {isFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-all cursor-pointer self-start lg:self-auto shrink-0"
          >
            <RotateCcw size={12} />
            <span>{t('flow.resetFilters', 'Reset Filters')}</span>
          </button>
        )}
      </div>

      {/* 3. ORDER FLOW TABLE (Stationary Collapsed Shared Columns + Accordion Expanded View) */}
      <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">

        {/* Table Toolbar */}
        <div className="p-3 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer bg-transparent"
              title="Expand/Collapse all cases"
            >
              {expandedOrders.size === filteredOrders.length && filteredOrders.length > 0 ? (
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
              Click row or expand icon to inspect service-specific fields
            </span>
          </div>

          {/* Sub-order View Mode Toggle (Visible when at least one order is expanded) */}
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
                title="Table Breakdown View"
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
                title="Cards Breakdown View"
              >
                <LayoutGrid size={12} />
                <span>Cards</span>
              </button>
            </div>
          )}
        </div>

        {/* Responsive Table Container with Horizontal Scroll Support */}
        <div
          className="w-full overflow-x-auto -webkit-overflow-scrolling-touch custom-scrollbar"
          data-testid="order-flow-table-container"
        >
          <table
            className="w-full min-w-[960px] text-left text-xs border-collapse table-fixed select-none"
            data-testid="order-flow-table"
          >
            <colgroup>
              {COLLAPSED_ORDER_COLUMNS.map((col) => (
                <col key={`col-${col.key}`} style={{ width: `${col.widthPercent}%` }} />
              ))}
            </colgroup>
            <thead>
              {/* COLLAPSED ORDER TABLE HEADERS (Strictly the 12 Approved Shared Columns) */}
              <tr className="bg-slate-200/80 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-[10.5px]">
                {COLLAPSED_ORDER_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    data-testid={`th-${col.key}`}
                    onClick={() => handleSort(col.key)}
                    className={`py-2.5 px-2 truncate cursor-pointer select-none transition-colors hover:bg-slate-300 dark:hover:bg-slate-700 relative ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${sortCol === col.key ? 'text-sky-600 dark:text-sky-400 font-black' : ''}`}
                    title={`Click to sort by ${col.label}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1 ${
                        col.align === 'center'
                          ? 'justify-center'
                          : col.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      } w-full min-w-0`}
                    >
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
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLLAPSED_ORDER_COLUMNS.length}
                    className="py-12 text-center text-slate-500 font-bold"
                  >
                    No matching cases in this production queue.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const totalCaseAmount = order.services.reduce((acc, s) => acc + (s.amount ?? 0), 0);
                  const primaryService = order.services[0];

                  return (
                    <React.Fragment key={order.id}>
                      {/* 1. COLLAPSED MASTER ORDER ROW (Displays ONLY the 12 Shared Columns) */}
                      <tr
                        data-testid={`order-row-${order.id}`}
                        onClick={() => toggleOrderExpand(order.id)}
                        className={`group transition-colors cursor-pointer font-medium border-b border-slate-200 dark:border-slate-800 ${
                          isExpanded
                            ? 'bg-sky-50/60 dark:bg-sky-950/20 border-l-4 border-l-sky-500'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {/* 1. # (Order Num & Source) */}
                        <td className="py-2.5 px-2 text-left truncate">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              data-testid={`expand-btn-${order.id}`}
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
                            <div className="flex flex-col items-start leading-tight min-w-0 truncate">
                              <span className="font-mono font-black text-amber-600 dark:text-amber-500 text-[11px] truncate">
                                {order.orderNum}
                              </span>
                              <span
                                className={`inline-block px-1 py-0.2 rounded text-[7.5px] tracking-wider uppercase mt-0.5 truncate ${getSourceBadgeStyle(
                                  order.source
                                )}`}
                              >
                                {order.source}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Scan Center */}
                        <td
                          className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate"
                          title={order.scanCenter}
                        >
                          <div className="truncate">{order.scanCenter}</div>
                        </td>

                        {/* 3. Doctor */}
                        <td className="py-2.5 px-2 text-[11px] truncate">
                          <div
                            className="font-bold text-slate-800 dark:text-slate-200 truncate"
                            title={order.doctorName}
                          >
                            {order.doctorName}
                          </div>
                          {order.doctorSub && (
                            <div className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold truncate">
                              {order.doctorSub}
                            </div>
                          )}
                        </td>

                        {/* 4. Lock */}
                        <td className="py-2.5 px-1 text-center truncate">
                          <div className="flex flex-col items-center">
                            {order.isLocked ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-transparent">
                                Lock
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-rose-500/50 text-rose-600 dark:text-rose-400 bg-transparent">
                                Sales
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Notes */}
                        <td className="py-2.5 px-1 text-center text-[10px] text-slate-700 dark:text-slate-300 font-medium truncate">
                          <span className="underline cursor-pointer truncate block" title={order.notes}>
                            {order.notes || '-'}
                          </span>
                        </td>

                        {/* 6. Archive */}
                        <td className="py-2.5 px-1 text-center text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate">
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="truncate">{order.archiveDate}</span>
                            <ShoppingCart size={10} className="text-emerald-500 inline shrink-0" />
                          </div>
                        </td>

                        {/* 7. ... (Action Menu navigating to Order Details) */}
                        <td
                          className="py-2.5 px-1 text-center truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/order-details?id=${order.orderNum}`);
                          }}
                          title="Open Order Details"
                        >
                          <button
                            type="button"
                            aria-label={`Open details for order ${order.orderNum}`}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-500 cursor-pointer mx-auto inline-flex"
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </td>

                        {/* 8. Order (Service Badges with Tooltip) */}
                        <td className="py-2.5 px-2 truncate">
                          <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
                            {order.services.map((sub, sIdx) => (
                              <div
                                key={sub.id || sIdx}
                                className="relative shrink-0"
                                onMouseEnter={(e) => handleServiceHover(sub, e)}
                                onMouseLeave={handleServiceLeave}
                              >
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border bg-transparent cursor-pointer transition-all hover:scale-105 inline-block ${getServiceTagStyle(
                                    sub.typeCode
                                  )}`}
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

                        {/* 9. Max (Maxilla from primary service) */}
                        <td
                          className="py-2.5 px-1 text-center font-bold text-[10.5px] text-emerald-600 dark:text-emerald-400 truncate"
                          title={primaryService?.maxilla}
                        >
                          <div className="truncate">{primaryService?.maxilla || '-'}</div>
                        </td>

                        {/* 10. Mand (Mandible from primary service) */}
                        <td
                          className="py-2.5 px-1 text-center font-bold text-[10.5px] text-emerald-600 dark:text-emerald-400 truncate"
                          title={primaryService?.mandible}
                        >
                          <div className="truncate">{primaryService?.mandible || '-'}</div>
                        </td>

                        {/* 11. Amount (Total Case Amount) */}
                        <td
                          className="py-2.5 px-2 text-right font-mono font-black text-[11px] text-slate-900 dark:text-white truncate"
                          title={`$${totalCaseAmount}.00`}
                        >
                          <div className="truncate">${totalCaseAmount}.00</div>
                        </td>

                        {/* 12. Received (Received Time from primary service) */}
                        <td
                          className="py-2.5 px-2 font-mono text-[9.5px] text-slate-600 dark:text-slate-400 truncate"
                          title={primaryService?.receivedTime}
                        >
                          <div className="truncate">{primaryService?.receivedTime || '-'}</div>
                        </td>
                      </tr>

                      {/* 2. EXPANDED ORDER VIEW (Displays the 9 Service-Specific Fields + Action) */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <tr
                            key={`expanded-row-${order.id}`}
                            data-testid={`expanded-row-${order.id}`}
                            className="bg-slate-50/50 dark:bg-slate-950/40"
                          >
                            <td
                              colSpan={COLLAPSED_ORDER_COLUMNS.length}
                              className="p-0 border-b border-sky-500/30"
                            >
                              <motion.div
                                key={`detail-anim-${order.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="p-3.5 space-y-3 bg-slate-50/30 dark:bg-slate-900/30 border-l-4 border-l-sky-500">

                                  {/* Sub-Services Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-sky-500/40 text-sky-600 dark:text-sky-400 bg-transparent">
                                        CASE #{order.orderNum}
                                      </span>
                                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                        {order.services.length} Service Breakdown
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      data-testid={`open-details-btn-${order.id}`}
                                      onClick={() => navigate(`/order-details?id=${order.orderNum}`)}
                                      className="flex items-center gap-1 px-3 py-1 rounded-lg border border-sky-500/50 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold transition-all cursor-pointer bg-transparent"
                                    >
                                      <span>Open Order Details</span>
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>

                                  {/* Expanded View Mode 1: Table Matrix of Service-Specific Fields */}
                                  {subOrderViewMode === 'matrix' ? (
                                    <div className="overflow-x-auto -webkit-overflow-scrolling-touch custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0b101d]">
                                      <table
                                        className="w-full min-w-[900px] text-left text-xs border-collapse table-fixed select-none"
                                        data-testid={`services-table-${order.id}`}
                                      >
                                        <colgroup>
                                          {EXPANDED_SERVICE_COLUMNS.map((col) => (
                                            <col
                                              key={`sub-col-${col.key}`}
                                              style={{ width: `${col.widthPercent}%` }}
                                            />
                                          ))}
                                        </colgroup>
                                        <thead>
                                          <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                                            {EXPANDED_SERVICE_COLUMNS.map((col) => (
                                              <th
                                                key={`sub-th-${col.key}`}
                                                data-testid={`sub-th-${col.key}`}
                                                className={`py-2 px-2 truncate ${
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
                                              key={sub.id || srvIdx}
                                              data-testid={`service-row-${sub.id || srvIdx}`}
                                              className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-medium transition-colors"
                                            >
                                              {/* Service Identifier */}
                                              <td className="py-2 px-2 truncate">
                                                <div className="flex items-center gap-1.5 truncate">
                                                  <span
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black border bg-transparent shrink-0 ${getServiceTagStyle(
                                                      sub.typeCode
                                                    )}`}
                                                  >
                                                    {sub.typeCode}
                                                  </span>
                                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                    {sub.title}
                                                  </span>
                                                </div>
                                              </td>

                                              {/* 1. Bill To */}
                                              <td
                                                className="py-2 px-2 text-[10px] text-slate-600 dark:text-slate-400 truncate"
                                                title={sub.billTo}
                                              >
                                                <div className="truncate">{sub.billTo}</div>
                                              </td>

                                              {/* 2. Format */}
                                              <td
                                                className="py-2 px-1 text-center font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate"
                                                title={sub.format}
                                              >
                                                <div className="truncate">{sub.format}</div>
                                              </td>

                                              {/* 3. Voucher */}
                                              <td className="py-2 px-1 text-center font-mono text-[10px] text-slate-500 truncate">
                                                <div className="truncate">{sub.vouchers || 'N/A'}</div>
                                              </td>

                                              {/* 4. Sent */}
                                              <td
                                                className="py-2 px-1 text-center font-mono text-[9px] text-slate-500 truncate"
                                                title={sub.sentTime}
                                              >
                                                <div className="truncate">{sub.sentTime}</div>
                                              </td>

                                              {/* 5. Update */}
                                              <td
                                                className="py-2 px-1 text-center font-mono text-[9px] text-slate-500 truncate"
                                                title={sub.updateTime}
                                              >
                                                <div className="truncate">{sub.updateTime}</div>
                                              </td>

                                              {/* 6. Charged */}
                                              <td
                                                className="py-2 px-1 text-center font-mono text-[9px] text-slate-500 truncate"
                                                title={sub.chargedOn}
                                              >
                                                <div className="truncate">{sub.chargedOn}</div>
                                              </td>

                                              {/* 7. Action Control (Clickable, navigates to Order Details) */}
                                              <td
                                                className="py-2 px-1 text-center truncate"
                                                data-testid="td-action"
                                              >
                                                <div className="flex items-center justify-center">
                                                  {renderActionStatusBadge(
                                                    sub.actionLabel,
                                                    sub.hasActionAlert,
                                                    sub.actionButtonText,
                                                    (e) => {
                                                      e.stopPropagation();
                                                      navigate(`/order-details?id=${order.orderNum}`);
                                                    }
                                                  )}
                                                </div>
                                              </td>

                                              {/* 8. CR (Change Request) */}
                                              <td
                                                className="py-2 px-1 text-center font-mono text-[10px] text-rose-600 font-bold truncate"
                                                title={sub.changeRequest}
                                              >
                                                <div className="truncate">{sub.changeRequest || '-'}</div>
                                              </td>

                                              {/* 9. CS Task */}
                                              <td className="py-2 px-1 text-center text-[10px] text-slate-500 truncate">
                                                <div className="truncate">
                                                  {sub.csTask?.assignee ? (
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                                      {sub.csTask.assignee}
                                                    </span>
                                                  ) : (
                                                    <span className="text-slate-400">Assign</span>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    /* Expanded View Mode 2: Service Cards */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                      {order.services.map((sub, srvIdx) => (
                                        <div
                                          key={sub.id || srvIdx}
                                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101d] space-y-2.5 shadow-xs hover:border-sky-400 dark:hover:border-sky-500 transition-all"
                                        >
                                          {/* Card Header: Type Badge, Title, Amount */}
                                          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black border bg-transparent ${getServiceTagStyle(
                                                  sub.typeCode
                                                )}`}
                                              >
                                                {sub.typeCode}
                                              </span>
                                              <div>
                                                <h5
                                                  className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1"
                                                  title={sub.title}
                                                >
                                                  {sub.title}
                                                </h5>
                                                <div className="text-[10px] text-slate-400">
                                                  Service #{srvIdx + 1}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <span className="font-mono font-black text-xs text-slate-900 dark:text-white block">
                                                ${sub.amount ?? 0}.00
                                              </span>
                                            </div>
                                          </div>

                                          {/* Service Fields Grid */}
                                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                              <span className="text-slate-400 block font-medium">Bill To:</span>
                                              <span
                                                className="font-bold text-slate-800 dark:text-slate-200 truncate block"
                                                title={sub.billTo}
                                              >
                                                {sub.billTo}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block font-medium">Format:</span>
                                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                                                {sub.format}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block font-medium">Voucher:</span>
                                              <span className="font-mono text-slate-700 dark:text-slate-300 block">
                                                {sub.vouchers || 'N/A'}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400 block font-medium">Sent:</span>
                                              <span className="font-mono text-slate-700 dark:text-slate-300 block">
                                                {sub.sentTime}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Timeline & CS Strip */}
                                          <div className="space-y-1 text-[9.5px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                                            <div className="flex justify-between items-center">
                                              <span>Updated: <strong className="text-slate-700 dark:text-slate-300">{sub.updateTime}</strong></span>
                                              <span>Charged: <strong className="text-slate-700 dark:text-slate-300">{sub.chargedOn}</strong></span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                                              <span>CR: <strong className="text-rose-500">{sub.changeRequest}</strong></span>
                                              <span>CS: <strong className="text-indigo-500">{sub.csTask?.assignee || 'Unassigned'}</strong></span>
                                            </div>
                                          </div>

                                          {/* Action Control Button */}
                                          <div className="flex justify-between items-center pt-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/order-details?id=${order.orderNum}`);
                                              }}
                                              className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>Inspect</span>
                                              <ExternalLink size={10} />
                                            </button>
                                            {renderActionStatusBadge(
                                              sub.actionLabel,
                                              sub.hasActionAlert,
                                              sub.actionButtonText,
                                              (e) => {
                                                e.stopPropagation();
                                                navigate(`/order-details?id=${order.orderNum}`);
                                              }
                                            )}
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

        {/* 4. PAGINATION FOOTER (Defaults to 50 rows per page, preserves access to all remaining rows) */}
        <div
          className="p-3 bg-slate-100/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3"
          data-testid="order-flow-pagination"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-700 dark:text-slate-300">
              Showing{' '}
              <strong className="text-sky-600 dark:text-sky-400">
                {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-sky-600 dark:text-sky-400">
                {Math.min(currentPage * pageSize, filteredOrders.length)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> Cases
            </span>
          </div>

          {/* Page Navigation Buttons */}
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

          {/* Rows Per Page Selector (Default: 50) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Rows per page:</span>
            <select
              data-testid="page-size-select"
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-white dark:bg-[#0c1222] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

      </div>

      {/* 5. FLOATING TOOLTIP FOR HOVERED SERVICE TAG */}
      <AnimatePresence>
        {hoveredService && (() => {
          const tooltipWidth = 320;
          const tooltipHeight = 160;
          const xPos = Math.min(
            window.innerWidth - tooltipWidth - 16,
            Math.max(16, hoveredService.x - tooltipWidth / 2)
          );
          const isNearTop = hoveredService.y < tooltipHeight + 20;
          const yPos = isNearTop ? hoveredService.y + 28 : hoveredService.y - tooltipHeight - 10;

          return (
            <motion.div
              key="service-tooltip"
              initial={{ opacity: 0, scale: 0.95, y: isNearTop ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: isNearTop ? -4 : 4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-50 pointer-events-none p-3.5 rounded-2xl bg-white/95 dark:bg-[#0c1322]/95 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 shadow-2xl backdrop-blur-md w-80 space-y-2 text-xs"
              style={{
                left: xPos,
                top: yPos,
              }}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded font-black text-[9px] border bg-transparent shrink-0 ${getServiceTagStyle(
                      hoveredService.service.typeCode
                    )}`}
                  >
                    {hoveredService.service.typeCode}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                      {hoveredService.service.title}
                    </h4>
                  </div>
                </div>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                  ${hoveredService.service.amount ?? 0}.00
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Format</span>
                  <span className="font-bold truncate block">{hoveredService.service.format}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Anatomy</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                    Max: {hoveredService.service.maxilla} / Mand: {hoveredService.service.mandible}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                <span className="text-slate-400 font-bold">Status:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {hoveredService.service.actionLabel}
                </span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
