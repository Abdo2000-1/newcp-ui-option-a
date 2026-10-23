import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

interface Task47Row {
  serial: number;
  orderId: number;
  scanCenter: string;
  doctor: string;
  patientName: string;
  maxilla: boolean;
  mandible: boolean;
  cost: number;
  receivedTime: string;
  sentTime: string;
  operator: string;
  voucher: string;
  archiveDate: string;
  chargeTime: string;
}

const SAMPLE_TASK47_ROWS: Task47Row[] = [
  { serial: 1, orderId: 677201, scanCenter: 'Align Chicago', doctor: 'Dr. Marcus Vance', patientName: 'Arthur Pendelton', maxilla: true, mandible: false, cost: 75.00, receivedTime: '2026-09-28 09:30', sentTime: '2026-09-28 16:45', operator: 'Alex M.', voucher: 'VCH-9921', archiveDate: '2026-10-01', chargeTime: '2026-09-28 17:00' },
  { serial: 2, orderId: 677189, scanCenter: '3DDX Boston Hub', doctor: 'Dr. Sarah Jenkins', patientName: 'Elena Rostova', maxilla: true, mandible: true, cost: 130.00, receivedTime: '2026-09-28 10:15', sentTime: '2026-09-28 18:20', operator: 'Omar H.', voucher: 'VCH-9918', archiveDate: '2026-10-01', chargeTime: '2026-09-28 18:30' },
  { serial: 3, orderId: 677154, scanCenter: 'Dallas Imaging', doctor: 'Dr. Alan Turing', patientName: 'David Kim', maxilla: false, mandible: true, cost: 65.00, receivedTime: '2026-09-27 11:00', sentTime: '2026-09-27 15:40', operator: 'Sarah K.', voucher: 'None', archiveDate: '2026-09-30', chargeTime: '2026-09-27 16:00' },
  { serial: 4, orderId: 677098, scanCenter: 'NYC Dental Diagnostics', doctor: 'Dr. Jessica Alba', patientName: 'Rachel Green', maxilla: true, mandible: true, cost: 140.00, receivedTime: '2026-09-27 13:20', sentTime: '2026-09-28 09:10', operator: 'Jessica L.', voucher: 'VCH-9844', archiveDate: '2026-09-30', chargeTime: '2026-09-28 09:30' },
  { serial: 5, orderId: 676994, scanCenter: 'Align Chicago', doctor: 'Dr. Gregory House', patientName: 'John Watson', maxilla: true, mandible: false, cost: 70.00, receivedTime: '2026-09-26 08:45', sentTime: '2026-09-26 14:30', operator: 'Alex M.', voucher: 'VCH-9812', archiveDate: '2026-09-29', chargeTime: '2026-09-26 15:00' },
  { serial: 6, orderId: 676940, scanCenter: '3DDX Boston Hub', doctor: 'Dr. Lisa Cuddy', patientName: 'James Wilson', maxilla: false, mandible: true, cost: 65.00, receivedTime: '2026-09-26 10:00', sentTime: '2026-09-26 17:15', operator: 'Omar H.', voucher: 'None', archiveDate: '2026-09-29', chargeTime: '2026-09-26 17:45' },
];

export default function Task47ModelWorkReport() {
  const { t } = useLanguage();
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [selectedOperator, setSelectedOperator] = useState<string>('-1');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-10-03');
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    return SAMPLE_TASK47_ROWS.filter((r) => {
      if (selectedOperator !== '-1' && !r.operator.includes(selectedOperator)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.orderId.toString().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          r.doctor.toLowerCase().includes(q) ||
          r.scanCenter.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedOperator, search]);

  const [sortField, setSortField] = useState<string>('orderId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    if (!sortField) return list;
    return list.sort((a, b) => {
      let aVal = (a as any)[sortField];
      let bVal = (b as any)[sortField];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredRows, sortField, sortDir]);

  const totalCost = filteredRows.reduce((acc, r) => acc + r.cost, 0);
  const totalMax = filteredRows.filter((r) => r.maxilla).length;
  const totalMand = filteredRows.filter((r) => r.mandible).length;

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
              <Boxes size={18} />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Task 47: Model Work CP Report
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/25">
              ?task=47
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Orthodontic & digital dental model work report with operator tracking and archive telemetry
          </p>
        </div>

        {/* State Switcher & Print */}
        <div className="flex items-center gap-2">
          <UIStateSwitcher
            state={uiState}
            onChange={(s) => setUiState(s)}
            label="Report State"
          />

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-xs hover:bg-cyan-400 cursor-pointer"
          >
            <Printer size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Original Filter Form from task47.php */}
      <div className="bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Operator
            </label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="-1">All Operators</option>
              <option value="0">Not Specified</option>
              <option value="Alex M.">Alex M. (Senior CAD)</option>
              <option value="Omar H.">Omar H. (QC Lead)</option>
              <option value="Sarah K.">Sarah K. (Planner)</option>
              <option value="Jessica L.">Jessica L. (CAM Specialist)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
            </input>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
            </input>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Quick Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, doc..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Simulated States */}
      {uiState === 'loading' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <LoadingState text="Querying OrderAppliance & Orders DB for Task 47..." />
        </div>
      )}

      {uiState === 'error' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <ErrorState
            title="Model Work Query Failure (500)"
            message="Error executing SELECT on OrderAppliance table."
            code="ERR_SQL_APP_TABLE_FAIL"
            onRetry={() => setUiState('normal')}
          />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title="No Model Work Records in Date Range"
            description="No appliance orders matched the selected operator and timeframe."
            action={
              <button
                onClick={() => setUiState('normal')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Reset Search Filters
              </button>
            }
          />
        </div>
      )}

      {/* Normal Live State: High-Tech 22" Wide Table */}
      {uiState === 'normal' && (
        <div className="space-y-3">
          
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{filteredRows.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Arches (Max/Mand)</span>
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">{totalMax} Max / {totalMand} Mand</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Billed Cost</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">${totalCost.toFixed(2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Vouchers Linked</span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">{filteredRows.filter(r => r.voucher !== 'None').length}</span>
            </div>
          </div>

          {/* Table Container - Perfectly fits 22" (1920px) screens without horizontal scroll */}
          <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
            <div className="w-full overflow-x-auto lg:overflow-x-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase select-none">
                    <th onClick={() => handleSort('serial')} className="py-3 px-3 w-10 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>#</span>
                        {sortField === 'serial' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('orderId')} className="py-3 px-3 w-24 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Order ID</span>
                        {sortField === 'orderId' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('scanCenter')} className="py-3 px-3 w-40 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Scan Center</span>
                        {sortField === 'scanCenter' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('doctor')} className="py-3 px-3 w-40 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Doctor</span>
                        {sortField === 'doctor' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('patientName')} className="py-3 px-3 w-40 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Patient Name</span>
                        {sortField === 'patientName' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-14">Max.</th>
                    <th className="py-3 px-3 text-center w-14">Mand.</th>
                    <th onClick={() => handleSort('cost')} className="py-3 px-3 w-20 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Cost</span>
                        {sortField === 'cost' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('receivedTime')} className="py-3 px-3 w-32 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Received</span>
                        {sortField === 'receivedTime' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('sentTime')} className="py-3 px-3 w-32 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Sent Time</span>
                        {sortField === 'sentTime' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('operator')} className="py-3 px-3 w-28 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Operator</span>
                        {sortField === 'operator' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-pink-500" /> : <ArrowDown size={11} className="text-pink-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th className="py-3 px-3 w-24">Vouchers</th>
                    <th className="py-3 px-3 w-24">Archive</th>
                    <th className="py-3 px-3 text-right w-24">Charged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {sortedRows.map((row) => (
                    <tr key={row.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{row.serial}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">#{row.orderId}</td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{row.scanCenter}</td>
                      <td className="py-2.5 px-3 truncate max-w-[150px]">{row.doctor}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{row.patientName}</td>
                      <td className="py-2.5 px-3 text-center">
                        {row.maxilla ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.mandible ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">${row.cost.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{row.receivedTime}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{row.sentTime}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{row.operator}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-600 dark:text-cyan-400">{row.voucher}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{row.archiveDate}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">{row.chargeTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>Displaying <strong>{filteredRows.length}</strong> model work appliance cases</span>
              <span className="font-mono text-emerald-600 font-bold">Live Production Pipeline</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
