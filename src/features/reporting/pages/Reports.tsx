import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { LoadingState } from '@/shared/components/LoadingState';
import { formatCurrency } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';
import { useStore } from '@/shared/hooks/useStore';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { 
  TrendingUp, DollarSign, Award, Clock, Activity, Download, 
  Calendar, CheckCircle2, ArrowUpRight, Filter, Search, ChevronLeft, 
  ChevronRight, Sparkles, Layers, ArrowDownRight, Compass
} from 'lucide-react';

// Custom Tooltip with React styling
const CustomReportTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md border border-cyan-500/20 text-xs min-w-[140px] space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-300 pb-1 border-b border-slate-800">
          {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold font-mono text-cyan-400 text-xs">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Mock data matching the design in Image 1
const SPLINE_TRAJECTORY_DATA = [
  { step: 'Mon', value: 30 },
  { step: 'Tue', value: 85 },
  { step: 'Wed', value: 45 },
  { step: 'Thu', value: 110 },
  { step: 'Fri', value: 65 },
  { step: 'Sat', value: 125 }, // Apex
  { step: 'Sun', value: 120 },
];

const MULTI_POINT_LINE_DATA = [
  { name: '10', rate: 45, color: '#f59e0b' },
  { name: '20', rate: 90, color: '#6366f1' },
  { name: '30', rate: 30, color: '#00d8fe' },
  { name: '40', rate: 105, color: '#10b981' },
  { name: '50', rate: 65, color: '#00d8fe' },
  { name: '60', rate: 95, color: '#f59e0b' },
];

const DUAL_SPLINE_VELOCITY_DATA = [
  { day: 'Day 1', speed: 20, capacity: 45 },
  { day: 'Day 2', speed: 40, capacity: 70 },
  { day: 'Day 3', speed: 30, capacity: 55 },
  { day: 'Day 4', speed: 65, capacity: 35 },
  { day: 'Day 5', speed: 50, capacity: 60 },
  { day: 'Day 6', speed: 115, capacity: 85 },
  { day: 'Day 7', speed: 70, capacity: 40 },
];

const BIDIRECTIONAL_BAR_DATA = [
  { name: 'A', positive: 50, negative: -30 },
  { name: 'B', positive: 90, negative: -45 },
  { name: 'C', positive: 65, negative: -80 },
  { name: 'D', positive: 85, negative: -35 },
  { name: 'E', positive: 40, negative: -60 },
];

const GROUPED_WEEKLY_BAR_DATA = [
  { day: 'Sun', valA: 40, valB: 70, valC: 95 },
  { day: 'Mon', valA: 80, valB: 50, valC: 65 },
  { day: 'Tue', valA: 60, valB: 95, valC: 75 },
  { day: 'Wed', valA: 30, valB: 45, valC: 25 },
  { day: 'Thu', valA: 95, valB: 80, valC: 105 },
  { day: 'Fri', valA: 70, valB: 35, valC: 50 },
  { day: 'Sat', valA: 85, valB: 65, valC: 90 },
];

import { sound } from '@/shared/utils/sound';

export default function Reports() {
  const { t } = useLanguage();
  const [selectedWeek, setSelectedWeek] = useState('Week 4');
  const [calendarMonth, setCalendarMonth] = useState('January 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('7d');
  const [materialFilter, setMaterialFilter] = useState<'all' | 'zirconia' | 'emax' | 'titanium'>('all');
  const [selectedDay, setSelectedDay] = useState<number>(14);

  const { data: reports, loading: reportsLoading } = useFetch(api.getReports);
  const orders = useStore(s => s.getOrders());
  const billing = useStore(s => s.getBilling());
  const cases = useStore(s => s.getCases());

  const handleExportCSV = () => {
    sound.playSuccess();
    const rows = [
      ['Metric', 'Value', 'Benchmark', 'Status'],
      ['Case Intake Velocity', `${(125 * (timeframe === '7d' ? 1 : timeframe === '30d' ? 4 : 12)).toFixed(0)} units`, '110 units', 'Optimal'],
      ['Milling Efficiency', '98.4%', '95.0%', 'Passed'],
      ['Turnaround SLA Yield', '99.1%', '98.0%', 'Exceeding'],
      ['Total Billed Revenue', `$${totalRevenue.toLocaleString()}`, '$45,000', 'Profitable'],
      ['Active CAD Stations', '8 Active', '8 Stations', 'Online'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dentalab_performance_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTimeframeChange = (tf: '7d' | '30d' | '90d' | 'ytd') => {
    setTimeframe(tf);
    sound.playPop();
  };

  if (reportsLoading && !reports) {
    return <LoadingState text="Loading Executive Analytics Studio..." />;
  }

  const totalRevenue = (billing || []).filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0) || 52400;

  // Multiplier for dynamic chart data based on selected timeframe
  const tfMultiplier = timeframe === '7d' ? 1 : timeframe === '30d' ? 1.45 : timeframe === '90d' ? 2.1 : 3.6;

  const dynamicSplineData = SPLINE_TRAJECTORY_DATA.map(d => ({
    ...d,
    value: Math.round(d.value * tfMultiplier)
  }));

  const dynamicMultiLineData = MULTI_POINT_LINE_DATA.map(d => ({
    ...d,
    rate: Math.min(100, Math.round(d.rate * (timeframe === '7d' ? 1 : 1.15)))
  }));

  const dynamicDualSplineData = DUAL_SPLINE_VELOCITY_DATA.map(d => ({
    ...d,
    speed: Math.round(d.speed * tfMultiplier),
    capacity: Math.round(d.capacity * tfMultiplier)
  }));

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-5 select-none">
      {/* TOP CONTROLS & TIMEFRAME TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
              <TrendingUp className="w-4 h-4" />
            </span>
            Laboratory Performance Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Executive clinical intelligence, throughput velocity, and fabrication milestones
          </p>
        </div>

        {/* Timeframe & Export Action Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Timeframe Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {(['7d', '30d', '90d', 'ytd'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={14} className="text-cyan-500" />
            <span>{t('reports.exportCsv', 'Export CSV')}</span>
          </button>

          {/* Search widget */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter metrics..."
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 shadow-xs"
            />
            <button 
              onClick={() => sound.playClick()}
              className="absolute right-1 top-1 h-6 w-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-colors"
            >
              <Search className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>


      {/* ============================================================ */}
      {/* ROW 1: 4 WIDGETS (Spline Trajectory, Multi-point Line, Calendar, Dual Gauge) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Smooth Spline Trajectory with Apex Badge (Top Left of Image 1) */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Case Intake Velocity</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                +18.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Peak delivery yield per shift</p>
          </div>

          <div className="h-28 w-full mt-2 relative">
            {/* Floating Apex Tag Pin matching Image 1 */}
            <div className="absolute top-1 right-12 z-10 px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono font-extrabold text-[10px] shadow-md flex items-center gap-1">
              <span>{Math.round(125 * tfMultiplier)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicSplineData} onMouseMove={() => sound.playChartTick()}>
                <defs>
                  <linearGradient id="purpleSplineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="natural" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fill="url(#purpleSplineGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 2: Multi-point Line with Dot Nodes (Top Mid-Left of Image 1) */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Milling Efficiency</h3>
              <p className="text-[11px] text-slate-400">Tolerance precision index</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
              {timeframe}
            </span>
          </div>

          <div className="h-28 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicMultiLineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                <Line 
                  type="linear" 
                  dataKey="rate" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 4, stroke: '#00d8fe', strokeWidth: 2, fill: '#6366f1' }}
                  activeDot={{ r: 6, fill: '#00d8fe' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 3: Interactive Calendar Schedule (Top Mid-Right of Image 1) */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => sound.playClick()} 
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              January 2026
            </span>
            <button 
              onClick={() => sound.playClick()} 
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Mini Calendar Grid */}
          <div className="mt-2 text-center text-[10px]">
            <div className="grid grid-cols-7 text-slate-400 font-mono mb-1 text-[9px]">
              <span>sun</span><span>mon</span><span>tue</span><span>wed</span><span>thu</span><span>fri</span><span>sat</span>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-slate-600 dark:text-slate-300 font-mono font-medium">
              <span className="opacity-0">.</span><span className="opacity-0">.</span><span className="opacity-0">.</span>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(d => {
                const isSelected = selectedDay === d;
                const isPreset = d === 14 || d === 28;
                const isViolet = d === 25;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setSelectedDay(d); sound.playClick(); }}
                    className={`h-5 w-5 mx-auto rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/40 shadow-xs scale-110' 
                        : isPreset 
                        ? 'border border-cyan-400 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950'
                        : isViolet 
                        ? 'border border-indigo-400 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 4: Dual Radial Gauge Rings (Top Right of Image 1: 25K & 90K) */}
        <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">Throughput Gauges</h3>

          <div className="flex items-center justify-around gap-2 my-auto">
            {/* Ring 1: 25K */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.5"
                    className="opacity-20"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="68, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {Math.round(25 * tfMultiplier)}K
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Cases</span>
            </div>

            {/* Ring 2: 90K */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.5"
                    className="opacity-20"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#00d8fe"
                    strokeWidth="3.5"
                    strokeDasharray="88, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {Math.round(90 * tfMultiplier)}K
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Revenue</span>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* ROW 2: 3 WIDGETS (KPI Dual Sparklines, Big 75% Meter, Dual Spline Velocity Area) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* CARD 5: Dual KPI Metrics with Wavy Sparklines (Col 1-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {Math.round(1205 * tfMultiplier).toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Units Milled</div>
              {/* Mini Amber Wave */}
              <div className="h-10 mt-2">
                <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                  <path d="M 0 15 Q 25 0, 50 15 T 100 15" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {Math.round(840 * tfMultiplier).toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dispatched</div>
              {/* Mini Cyan Wave */}
              <div className="h-10 mt-2">
                <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                  <path d="M 0 15 Q 25 30, 50 15 T 100 15" stroke="#00d8fe" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>SLA Compliance</span>
            <span className="font-bold text-emerald-500 font-mono">99.2%</span>
          </div>
        </div>

        {/* CARD 6: Big 75% Circular Ring Gauge (Col 4-6) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col items-center justify-between text-center">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Quality Pass Rate</h3>
            <p className="text-[11px] text-slate-400">First-time fit accuracy</p>
          </div>

          {/* Big Circular Ring with 75% */}
          <div className="relative w-28 h-28 my-3 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3.5"
                className="opacity-20"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#00d8fe"
                strokeWidth="3.5"
                strokeDasharray="75, 100"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">75%</span>
              <span className="text-[9px] uppercase font-bold text-cyan-500">Verified</span>
            </div>
          </div>

          {/* Action button matching yellow/amber CTA in Image 1 */}
          <button className="w-full py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-[0.98]">
            Download Clinical Audit
          </button>
        </div>

        {/* CARD 7: Dual Spline Intertwining Velocity Area Chart (Col 7-12) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Weekly Case Velocity vs Lab Capacity</h3>
              <p className="text-[11px] text-slate-400">Intertwining spline curves with vertex anchors</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-indigo-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Velocity
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Capacity
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                All time
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicDualSplineData} onMouseMove={() => sound.playChartTick()}>
                <defs>
                  <linearGradient id="amberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="indigoAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <Tooltip content={<CustomReportTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="capacity" 
                  name="Capacity" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  fill="url(#amberAreaGrad)" 
                  dot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="speed" 
                  name="Velocity" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fill="url(#indigoAreaGrad)" 
                  dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* ROW 3: 3 WIDGETS (Bidirectional Bar, Production Timeline, Grouped Bars) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* CARD 8: Bidirectional Floating Bar Chart (Bottom Left of Image 1) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Delivery Variance Spread</h3>
            <p className="text-[11px] text-slate-400">Bidirectional divergence from standard turnaround</p>
          </div>

          <div className="h-32 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BIDIRECTIONAL_BAR_DATA} stackOffset="sign">
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                <Bar dataKey="positive" fill="#00d8fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" fill="#f59e0b" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Segmented Horizontal Progress Bar (Delenit augue in Image 1) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-semibold">
              <span>Throughput Segments</span>
              <span className="font-mono text-cyan-500">100% Total</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
              <div className="w-[45%] bg-indigo-500" title="Crowns (45%)" />
              <div className="w-[35%] bg-cyan-400" title="Implants (35%)" />
              <div className="w-[20%] bg-amber-400" title="Aligners (20%)" />
            </div>
          </div>
        </div>

        {/* CARD 9: Horizontal Step Milestone Production Rail (Bottom Mid of Image 1) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Workflow Milestones</h3>
            <p className="text-[11px] text-slate-400">Real-time batch progress pipeline</p>
          </div>

          {/* Horizontal Step Tracker with Tag Badges */}
          <div className="relative py-8 my-auto">
            {/* Base Horizontal Rail */}
            <div className="h-1 w-full bg-indigo-500/40 rounded-full" />

            {/* Step 1: Scan Intake */}
            <div className="absolute top-1/2 left-[15%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-[9px] shadow-sm mb-2">
                Scanned
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 ring-4 ring-white dark:ring-slate-900 shadow-md" />
              <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[9px] shadow-sm mt-2">
                Batch A
              </span>
            </div>

            {/* Step 2: CAD Design */}
            <div className="absolute top-1/2 left-[50%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-[9px] shadow-sm mb-2">
                Approved
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900 shadow-md" />
              <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[9px] shadow-sm mt-2">
                CAM Unit
              </span>
            </div>

            {/* Step 3: Final QC */}
            <div className="absolute top-1/2 left-[85%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-[9px] shadow-sm mb-2">
                Glazed
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-slate-900 shadow-md" />
              <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[9px] shadow-sm mt-2">
                Dispatch
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center font-mono">
            Active in queue: <strong className="text-cyan-500 font-bold">42 Cases</strong>
          </div>
        </div>

        {/* CARD 10: Grouped Multi-column Bar Chart (Bottom Right of Image 1) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0b1120] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Daily Multi-Restoration Volume</h3>
              <p className="text-[11px] text-slate-400">Weekly breakdown across material types</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          </div>

          <div className="h-40 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GROUPED_WEEKLY_BAR_DATA} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={false} content={<CustomReportTooltip />} />
                <Bar dataKey="valA" fill="#6366f1" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={750} animationEasing="ease-out" />
                <Bar dataKey="valB" fill="#00d8fe" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={750} animationEasing="ease-out" />
                <Bar dataKey="valC" fill="#f59e0b" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={750} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
