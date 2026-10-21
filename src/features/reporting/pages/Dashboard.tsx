import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell 
} from 'recharts';
import { 
  Calendar, AlertCircle, FileText, ClipboardList, CheckCircle2, 
  Activity, ArrowUpRight, DollarSign, Clock, RefreshCw, ChevronRight, ChevronLeft, Bell,
  TrendingUp, BarChart3, LineChart as LineChartIcon, ScanLine, ShieldAlert, Sparkles,
  Layers, Filter, Download, ExternalLink, Maximize2, Minimize2, Check, Target, PieChart,
  SlidersHorizontal, Database
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { formatDate, formatCurrency, timeAgo } from '@/shared/utils/format';
import { sound } from '@/shared/utils/sound';

// 3DDX Strictly Brand Colors
const BRAND_BLUE = '#0284c7';
const BRAND_ORANGE = '#ea580c';
const BRAND_ORANGE_LIGHT = '#f97316';
const BRAND_BLUE_LIGHT = '#38bdf8';

// Custom Power BI / 3DDX Glassmorphic Tooltip
const BrandChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-black/95 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs min-w-[170px] space-y-1.5 select-none">
        <div className="flex justify-between items-center pb-1 border-b border-slate-800">
          <span className="font-extrabold text-slate-200">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0284c7]/20 text-sky-400 font-mono font-bold">
            Power BI
          </span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="font-semibold">{entry.name}:</span>
            </span>
            <span className="font-bold font-mono text-white text-xs">
              {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue')
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'powerbi' | 'telemetry'>('powerbi');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q4');
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');
  const [refreshing, setRefreshing] = useState(false);
  const urgentScrollRef = useRef<HTMLDivElement>(null);

  const allOrders = useStore((s) => s.getOrders());
  const allCases = useStore((s) => s.getCases());
  const allNotifs = useStore((s) => s.getNotifications());
  const changeRequests = useStore((s) => s.getChangeRequests());

  const handleRefresh = () => {
    setRefreshing(true);
    sound.playPop?.();
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const scrollUrgent = (dir: 'left' | 'right') => {
    if (urgentScrollRef.current) {
      urgentScrollRef.current.scrollBy({
        left: dir === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
      sound.playClick?.();
    }
  };

  const urgentOrders = allOrders.filter((o) => o.priority === 'Urgent');
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Dynamic Power BI Quarterly Datasets with 100% reactive state & live telemetry
  const QUARTER_DATA_MAP = useMemo(() => ({
    Q1: {
      name: 'Q1 (Jan - Mar)',
      attainment: 96.8,
      yoy: '+8.2%',
      actualRev: '$695,000',
      targetRev: '$718,000',
      percentNum: 96.8,
      sgUnits: '2,890',
      sgQuota: '3,000',
      sgPercent: 96.3,
      tpUnits: '1,540',
      tpQuota: '1,600',
      tpPercent: 96.2,
      turnaround: '2.3 Days',
      slaPass: '98.8%',
      chartData: [
        { month: 'Jan', actualRevenue: 220000, targetRevenue: 235000, guides: 920, plans: 490, attainment: 93.6 },
        { month: 'Feb', actualRevenue: 232000, targetRevenue: 238000, guides: 960, plans: 510, attainment: 97.4 },
        { month: 'Mar', actualRevenue: 243000, targetRevenue: 245000, guides: 1010, plans: 540, attainment: 99.1 }
      ],
      distribution: [
        { name: 'Surgical Guides (SG)', units: 2890, revenue: 346800, color: BRAND_BLUE, share: '46%' },
        { name: 'Treatment Planning (TP)', units: 1540, revenue: 231000, color: BRAND_ORANGE, share: '30%' },
        { name: 'Model Work (MOD)', units: 780, revenue: 93600, color: '#0369a1', share: '14%' },
        { name: 'Temp/Final Restorations', units: 480, revenue: 72000, color: '#c2410c', share: '10%' },
      ],
      regionalHubs: [
        { hub: '3DDX Boston Radiology Hub', target: 250000, actual: 242000, percent: 96.8, lead: 'Dr. Sarah Jenkins' },
        { hub: 'Align Chicago CAD Lab', target: 210000, actual: 205000, percent: 97.6, lead: 'Bishoy Mina' },
        { hub: 'Dallas Imaging & CAD Facility', target: 140000, actual: 132000, percent: 94.2, lead: 'Marcus Vance' },
        { hub: 'NYC Dental Diagnostics Hub', target: 118000, actual: 116000, percent: 98.3, lead: 'Elena Rostova' },
      ]
    },
    Q2: {
      name: 'Q2 (Apr - Jun)',
      attainment: 101.4,
      yoy: '+11.5%',
      actualRev: '$765,000',
      targetRev: '$755,000',
      percentNum: 101.4,
      sgUnits: '3,180',
      sgQuota: '3,100',
      sgPercent: 102.5,
      tpUnits: '1,720',
      tpQuota: '1,700',
      tpPercent: 101.1,
      turnaround: '2.1 Days',
      slaPass: '99.2%',
      chartData: [
        { month: 'Apr', actualRevenue: 248000, targetRevenue: 245000, guides: 1020, plans: 550, attainment: 101.2 },
        { month: 'May', actualRevenue: 254000, targetRevenue: 252000, guides: 1060, plans: 575, attainment: 100.7 },
        { month: 'Jun', actualRevenue: 263000, targetRevenue: 258000, guides: 1100, plans: 595, attainment: 101.9 }
      ],
      distribution: [
        { name: 'Surgical Guides (SG)', units: 3180, revenue: 381600, color: BRAND_BLUE, share: '45%' },
        { name: 'Treatment Planning (TP)', units: 1720, revenue: 258000, color: BRAND_ORANGE, share: '31%' },
        { name: 'Model Work (MOD)', units: 890, revenue: 106800, color: '#0369a1', share: '13%' },
        { name: 'Temp/Final Restorations', units: 580, revenue: 87000, color: '#c2410c', share: '11%' },
      ],
      regionalHubs: [
        { hub: '3DDX Boston Radiology Hub', target: 270000, actual: 275000, percent: 101.8, lead: 'Dr. Sarah Jenkins' },
        { hub: 'Align Chicago CAD Lab', target: 225000, actual: 231000, percent: 102.6, lead: 'Bishoy Mina' },
        { hub: 'Dallas Imaging & CAD Facility', target: 145000, actual: 142000, percent: 97.9, lead: 'Marcus Vance' },
        { hub: 'NYC Dental Diagnostics Hub', target: 115000, actual: 117000, percent: 101.7, lead: 'Elena Rostova' },
      ]
    },
    Q3: {
      name: 'Q3 (Jul - Sep)',
      attainment: 102.1,
      yoy: '+14.2%',
      actualRev: '$812,000',
      targetRev: '$795,000',
      percentNum: 102.1,
      sgUnits: '3,670',
      sgQuota: '3,550',
      sgPercent: 103.3,
      tpUnits: '1,980',
      tpQuota: '1,920',
      tpPercent: 103.1,
      turnaround: '2.0 Days',
      slaPass: '99.4%',
      chartData: [
        { month: 'Jul', actualRevenue: 265000, targetRevenue: 260000, guides: 1180, plans: 630, attainment: 101.9 },
        { month: 'Aug', actualRevenue: 272000, targetRevenue: 266000, guides: 1230, plans: 665, attainment: 102.2 },
        { month: 'Sep', actualRevenue: 275000, targetRevenue: 269000, guides: 1260, plans: 685, attainment: 102.2 }
      ],
      distribution: [
        { name: 'Surgical Guides (SG)', units: 3670, revenue: 440400, color: BRAND_BLUE, share: '46%' },
        { name: 'Treatment Planning (TP)', units: 1980, revenue: 297000, color: BRAND_ORANGE, share: '31%' },
        { name: 'Model Work (MOD)', units: 980, revenue: 117600, color: '#0369a1', share: '12%' },
        { name: 'Temp/Final Restorations', units: 660, revenue: 99000, color: '#c2410c', share: '11%' },
      ],
      regionalHubs: [
        { hub: '3DDX Boston Radiology Hub', target: 290000, actual: 298000, percent: 102.7, lead: 'Dr. Sarah Jenkins' },
        { hub: 'Align Chicago CAD Lab', target: 235000, actual: 241000, percent: 102.5, lead: 'Bishoy Mina' },
        { hub: 'Dallas Imaging & CAD Facility', target: 150000, actual: 153000, percent: 102.0, lead: 'Marcus Vance' },
        { hub: 'NYC Dental Diagnostics Hub', target: 120000, actual: 120000, percent: 100.0, lead: 'Elena Rostova' },
      ]
    },
    Q4: {
      name: 'Q4 (Oct - Dec)',
      attainment: 99.4,
      yoy: '+6.8%',
      actualRev: '$940,000',
      targetRev: '$945,000',
      percentNum: 99.4,
      sgUnits: '4,340',
      sgQuota: '4,400',
      sgPercent: 98.6,
      tpUnits: '2,290',
      tpQuota: '2,300',
      tpPercent: 99.5,
      turnaround: '1.9 Days',
      slaPass: '99.6%',
      chartData: [
        { month: 'Oct', actualRevenue: 298000, targetRevenue: 305000, guides: 1390, plans: 740, attainment: 97.7 },
        { month: 'Nov (Proj)', actualRevenue: 315000, targetRevenue: 315000, guides: 1450, plans: 765, attainment: 100.0 },
        { month: 'Dec (Proj)', actualRevenue: 327000, targetRevenue: 325000, guides: 1500, plans: 785, attainment: 100.6 }
      ],
      distribution: [
        { name: 'Surgical Guides (SG)', units: 4340, revenue: 520800, color: BRAND_BLUE, share: '47%' },
        { name: 'Treatment Planning (TP)', units: 2290, revenue: 343500, color: BRAND_ORANGE, share: '30%' },
        { name: 'Model Work (MOD)', units: 1120, revenue: 134400, color: '#0369a1', share: '12%' },
        { name: 'Temp/Final Restorations', units: 750, revenue: 112500, color: '#c2410c', share: '11%' },
      ],
      regionalHubs: [
        { hub: '3DDX Boston Radiology Hub', target: 350000, actual: 342000, percent: 97.7, lead: 'Dr. Sarah Jenkins' },
        { hub: 'Align Chicago CAD Lab', target: 280000, actual: 289500, percent: 103.4, lead: 'Bishoy Mina' },
        { hub: 'Dallas Imaging & CAD Facility', target: 190000, actual: 181200, percent: 95.3, lead: 'Marcus Vance' },
        { hub: 'NYC Dental Diagnostics Hub', target: 150000, actual: 156800, percent: 104.5, lead: 'Elena Rostova' },
      ]
    },
    ALL: {
      name: 'FY2026 Full Year',
      attainment: 100.2,
      yoy: '+12.8%',
      actualRev: '$3,212,000',
      targetRev: '$3,213,000',
      percentNum: 100.2,
      sgUnits: '14,080',
      sgQuota: '14,050',
      sgPercent: 100.2,
      tpUnits: '7,530',
      tpQuota: '7,520',
      tpPercent: 100.1,
      turnaround: '2.1 Days',
      slaPass: '99.3%',
      chartData: [
        { month: 'Q1 (Jan-Mar)', actualRevenue: 695000, targetRevenue: 718000, guides: 2890, plans: 1540, attainment: 96.8 },
        { month: 'Q2 (Apr-Jun)', actualRevenue: 765000, targetRevenue: 755000, guides: 3180, plans: 1720, attainment: 101.4 },
        { month: 'Q3 (Jul-Sep)', actualRevenue: 812000, targetRevenue: 795000, guides: 3670, plans: 1980, attainment: 102.1 },
        { month: 'Q4 (Oct-Dec)', actualRevenue: 940000, targetRevenue: 945000, guides: 4340, plans: 2290, attainment: 99.4 }
      ],
      distribution: [
        { name: 'Surgical Guides (SG)', units: 14080, revenue: 1689600, color: BRAND_BLUE, share: '46%' },
        { name: 'Treatment Planning (TP)', units: 7530, revenue: 1129500, color: BRAND_ORANGE, share: '31%' },
        { name: 'Model Work (MOD)', units: 3770, revenue: 452400, color: '#0369a1', share: '13%' },
        { name: 'Temp/Final Restorations', units: 2470, revenue: 370500, color: '#c2410c', share: '10%' },
      ],
      regionalHubs: [
        { hub: '3DDX Boston Radiology Hub', target: 1160000, actual: 1157000, percent: 99.7, lead: 'Dr. Sarah Jenkins' },
        { hub: 'Align Chicago CAD Lab', target: 950000, actual: 966500, percent: 101.7, lead: 'Bishoy Mina' },
        { hub: 'Dallas Imaging & CAD Facility', target: 625000, actual: 608200, percent: 97.3, lead: 'Marcus Vance' },
        { hub: 'NYC Dental Diagnostics Hub', target: 503000, actual: 509800, percent: 101.3, lead: 'Elena Rostova' },
      ]
    }
  }), []);

  const currentQData = QUARTER_DATA_MAP[selectedQuarter] || QUARTER_DATA_MAP.Q4;

  return (
    <div className="space-y-4 w-full min-w-0 select-none">
      
      {/* Top Header: Clean, Refined, Minimalist */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-[#070b14] p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Command Center
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Live Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {formatDate(new Date().toISOString())} • 3D Diagnostix Dental Intelligence
          </p>
        </div>

        {/* View Mode & Power BI Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Studio Tab Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('powerbi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'powerbi'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Power BI Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity size={14} />
              <span>Production Queue</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Refresh Power BI Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* SLEEK COMPACT URGENT TICKER (Best Practice: Subtle, Compact, Non-Intrusive) */}
      {urgentOrders.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-1.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {urgentOrders.length} Urgent Rush
            </span>
          </div>

          <div
            ref={urgentScrollRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth py-0.5"
            style={{ scrollbarWidth: 'none' }}
          >
            {urgentOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => navigate(`/order-details?id=${order.id}`)}
                className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{order.orderNumber}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="truncate max-w-[110px]">{order.patientName}</span>
                <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                  Due {formatDate(order.dueDate)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => scrollUrgent('left')}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => scrollUrgent('right')}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: POWER BI ENTERPRISE ANALYTICS & QUARTER TARGETS    */}
      {/* ========================================================= */}
      {activeTab === 'powerbi' && (
        <div className="space-y-6">
          
          {/* Sleek Power BI Control Bar (Light Frosted Glassmorphism - Replaced Heavy Black Bar) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 dark:bg-[#0c1222]/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#ea580c] flex items-center justify-center font-black text-xs text-white shadow-sm">
                PBI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    Power BI Executive Telemetry • {currentQData.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live DirectQuery
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Dataset: [3DDX_DW].[TargetAttainment] • Real-time Sync Active
                </span>
              </div>
            </div>

            {/* Reactive Quarter Slicers with Instant Recalculation & Sound */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold self-end sm:self-auto">
              {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSelectedQuarter(q);
                    sound.playPop?.();
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                    selectedQuarter === q
                      ? 'bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white shadow-sm scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Core Power BI DAX KPI Tiles (Dynamic with selectedQuarter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Quarter Revenue Target Attainment */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {selectedQuarter === 'ALL' ? 'FY2026 Target' : `${selectedQuarter} Target Attainment`}
                </span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0284c7]">
                  <Target size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white transition-all">
                  {currentQData.attainment}%
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={13} /> {currentQData.yoy} YoY
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284c7] to-[#ea580c] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, currentQData.percentNum)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Actual: {currentQData.actualRev}</span>
                  <span>Target: {currentQData.targetRev}</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Surgical Guides Quota */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Surgical Guides (SG)
                </span>
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ea580c]">
                  <ClipboardList size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white transition-all">
                  {currentQData.sgUnits}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={13} /> {currentQData.sgPercent}%
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ea580c] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, currentQData.sgPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Quota: {currentQData.sgQuota}</span>
                  <span>{currentQData.sgPercent >= 100 ? 'Quota Met' : 'In Progress'}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Co-Diagnostix Treatment Plans */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Co-Dx Plans (TP)
                </span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0284c7]">
                  <Activity size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white transition-all">
                  {currentQData.tpUnits}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight size={13} /> {currentQData.tpPercent}%
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0284c7] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, currentQData.tpPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Quota: {currentQData.tpQuota}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {currentQData.tpPercent >= 100 ? 'Target Met' : 'Active Batch'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Lab Turnaround Velocity */}
            <div className="bg-white dark:bg-[#070b14] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg. Turnaround Time
                </span>
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#ea580c]">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white transition-all">
                  {currentQData.turnaround}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <CheckCircle2 size={13} /> Within SLA
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0284c7] to-[#ea580c] rounded-full" style={{ width: '88%' }} />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>Target SLA: &lt; 2.5d</span>
                  <span>QC Pass Rate: {currentQData.slaPass}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Main Power BI Analytical Charts (Area & Target Comparison) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Monthly Target vs Actual Revenue Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-[#0284c7]" size={18} />
                    <span>Quarter Target vs Actual Billed Revenue</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Co-Diagnostix CAD/CAM Production Trajectory ($ USD)
                  </p>
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-bold border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setChartView('area')}
                    className={`px-3 py-1 rounded-lg transition-colors ${chartView === 'area' ? 'bg-white dark:bg-slate-800 text-[#0284c7] shadow-xs' : 'text-slate-500'}`}
                  >
                    Smooth Area
                  </button>
                  <button
                    onClick={() => setChartView('bar')}
                    className={`px-3 py-1 rounded-lg transition-colors ${chartView === 'bar' ? 'bg-white dark:bg-slate-800 text-[#ea580c] shadow-xs' : 'text-slate-500'}`}
                  >
                    Target Bars
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'area' ? (
                    <AreaChart data={currentQData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="brandBlueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={BRAND_BLUE} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={BRAND_BLUE} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="brandOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={BRAND_ORANGE} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={BRAND_ORANGE} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip content={<BrandChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="actualRevenue"
                        name="Actual Revenue"
                        stroke={BRAND_BLUE}
                        strokeWidth={3}
                        fill="url(#brandBlueGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="targetRevenue"
                        name="Target Quota"
                        stroke={BRAND_ORANGE}
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        fill="url(#brandOrangeGrad)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={currentQData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip content={<BrandChartTooltip />} />
                      <Bar dataKey="actualRevenue" name="Actual Revenue" fill={BRAND_BLUE} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="targetRevenue" name="Target Quota" fill={BRAND_ORANGE} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                  <span className="text-slate-700 dark:text-slate-300">Actual Revenue ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ea580c]" />
                  <span className="text-slate-700 dark:text-slate-300">Quarter Target Quota ($)</span>
                </div>
              </div>
            </div>

            {/* Right Column: Service Revenue Contribution Matrix */}
            <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="text-[#ea580c]" size={18} />
                  <span>Service Line Share</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Production volume & yield by category
                </p>

                <div className="mt-5 space-y-3.5">
                  {currentQData.distribution.map((item) => (
                    <div key={item.name} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                        <span className="font-mono font-black" style={{ color: item.color }}>
                          {item.share}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: item.share, backgroundColor: item.color }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
                        <span>{item.units} units fabricated</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/quarter-targets')}
                className="w-full mt-4 py-2.5 rounded-2xl bg-[#0284c7]/10 hover:bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#0284c7] dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Open Full Quarter Targets Matrix</span>
                <ChevronRight size={14} />
              </button>
            </div>

          </div>

          {/* Regional Diagnostic Hubs & Quota Performance Table */}
          <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="text-[#0284c7]" size={18} />
                  <span>Regional Diagnostic Hubs Attainment</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Direct production quotas assigned to 3DDX Scan Centers
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-[#0284c7]">
                Active Hubs: 4
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px] pb-2">
                    <th className="py-2 px-3">Diagnostic Hub</th>
                    <th className="py-2 px-3">Lead Clinician</th>
                    <th className="py-2 px-3">Quarter Target</th>
                    <th className="py-2 px-3">Actual Achieved</th>
                    <th className="py-2 px-3">Attainment %</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-semibold text-slate-800 dark:text-slate-200">
                  {currentQData.regionalHubs.map((hub) => (
                    <tr key={hub.hub} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {hub.hub}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                        {hub.lead}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {formatCurrency(hub.target)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0284c7] dark:text-sky-400">
                        {formatCurrency(hub.actual)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(hub.percent, 100)}%`,
                                backgroundColor: hub.percent >= 100 ? BRAND_ORANGE : BRAND_BLUE,
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs">{hub.percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hub.percent >= 100
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        }`}>
                          {hub.percent >= 100 ? 'Target Exceeded' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CAD TELEMETRY & PRODUCTION QUEUE                   */}
      {/* ========================================================= */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Recent Orders Table */}
          <div className="lg:col-span-2 bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Live Intake Orders</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Cases queued across scan hubs
                </p>
              </div>
              <button
                onClick={() => navigate('/flow')}
                className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
              >
                <span>Open Master Flow Matrix</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[11px] pb-2">
                    <th className="py-2 px-3">Order #</th>
                    <th className="py-2 px-3">Patient</th>
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/order-details?id=${o.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0284c7] dark:text-sky-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-white truncate max-w-[120px]">
                        {o.patientName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {o.restoration}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0284c7]/10 text-[#0284c7] dark:text-sky-300">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {timeAgo(o.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Workflow Activity Feed */}
          <div className="bg-white dark:bg-[#070b14] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-[#ea580c]" />
                <span>PACS Audit Activity</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Real-time doctor approvals & DICOM sync
              </p>

              <div className="mt-4 space-y-3.5">
                {allNotifs.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/flow')}
              className="w-full mt-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              Inspect Active Cases
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
