import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users2,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronDown,
  Award,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

interface StaffTargetRow {
  id: number;
  name: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  quota: number;
  achieved: number;
  month1: number;
  month2: number;
  month3: number;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'On Track';
}

const SAMPLE_STAFF: StaffTargetRow[] = [
  { id: 1016, name: 'Alex M.', department: 'CAD / CAM Operators', role: 'Senior CAD Specialist', email: 'alex.m@3ddx.com', phone: '+1 617-555-0192', quota: 420, achieved: 452, month1: 145, month2: 152, month3: 155, tier: 'Diamond' },
  { id: 1024, name: 'Sarah K.', department: 'Treatment Planners', role: 'Senior Co-Diagnostix Planner', email: 'sarah.k@3ddx.com', phone: '+1 617-555-0144', quota: 380, achieved: 395, month1: 130, month2: 132, month3: 133, tier: 'Gold' },
  { id: 1032, name: 'Omar H.', department: 'Quality Control', role: 'Lead QC Auditor', email: 'omar.h@3ddx.com', phone: '+1 617-555-0188', quota: 400, achieved: 410, month1: 138, month2: 135, month3: 137, tier: 'Gold' },
  { id: 1045, name: 'Dr. Michael Chen', department: 'Radiologists', role: 'Staff Radiologist', email: 'm.chen@3ddx.com', phone: '+1 617-555-0177', quota: 500, achieved: 520, month1: 170, month2: 175, month3: 175, tier: 'Diamond' },
  { id: 1058, name: 'Jessica L.', department: 'CAD / CAM Operators', role: 'CAM 3D Guide Specialist', email: 'jessica.l@3ddx.com', phone: '+1 617-555-0122', quota: 350, achieved: 342, month1: 110, month2: 118, month3: 114, tier: 'On Track' },
  { id: 1066, name: 'David Vance', department: 'Customer Support', role: 'Senior Account Manager', email: 'd.vance@3ddx.com', phone: '+1 617-555-0199', quota: 300, achieved: 318, month1: 105, month2: 107, month3: 106, tier: 'Silver' },
  { id: 1074, name: 'Emma Watson', department: 'Senior Sales', role: 'Global Enterprise Sales', email: 'e.watson@3ddx.com', phone: '+1 617-555-0111', quota: 450, achieved: 490, month1: 160, month2: 165, month3: 165, tier: 'Diamond' },
];

export default function Task31StaffTargets() {
  const { t } = useLanguage();
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q3 (Jul - Sep)');
  const [search, setSearch] = useState('');

  const filteredStaff = useMemo(() => {
    return SAMPLE_STAFF.filter((s) => {
      if (selectedDept !== 'ALL' && s.department !== selectedDept) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedDept, search]);

  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedStaff = useMemo(() => {
    const list = [...filteredStaff];
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
  }, [filteredStaff, sortField, sortDir]);

  const totalQuota = filteredStaff.reduce((acc, s) => acc + s.quota, 0);
  const totalAchieved = filteredStaff.reduce((acc, s) => acc + s.achieved, 0);
  const avgCompletion = totalQuota > 0 ? Math.round((totalAchieved / totalQuota) * 100) : 0;

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Users2 size={18} />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Task 31: Staff Quarterly Targets & Quotas
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              ?task=31
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Departmental productivity tracking • Case volume quotas, individual technician throughput & bonus tiers
          </p>
        </div>

        {/* State Switcher & Export */}
        <div className="flex items-center gap-2">
          <UIStateSwitcher
            state={uiState}
            onChange={(s) => setUiState(s)}
            label="Matrix State"
          />

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-xs hover:bg-sky-700 cursor-pointer"
          >
            <Printer size={13} />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* 2. Department & Quarter Filters Bar (Matches task31.php roles) */}
      <div className="bg-white dark:bg-[#0b101d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Auth Group / Department (task31.php)
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Company Departments</option>
              <option value="CAD / CAM Operators">CAD / CAM Operators</option>
              <option value="Treatment Planners">Treatment Planners (Co-Diagnostix)</option>
              <option value="Radiologists">Radiologists & Segmenters</option>
              <option value="Quality Control">Quality Control & Assurance</option>
              <option value="Customer Support">Customer Support (CS)</option>
              <option value="Senior Sales">Senior Enterprise Sales</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Target Quarter Period
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option>Q1 (Jan - Mar)</option>
              <option>Q2 (Apr - Jun)</option>
              <option>Q3 (Jul - Sep)</option>
              <option>Q4 (Oct - Dec)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Staff Member Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name or role..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Simulated States */}
      {uiState === 'loading' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <LoadingState text="Loading WSaccounts & Quota Calculations for Task 31..." />
        </div>
      )}

      {uiState === 'error' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <ErrorState
            title="Database Permission Denied (403)"
            message="User session does not hold super admin permission to inspect all staff quota files."
            code="ERR_AUTH_GROUP_RESTRICTED"
            onRetry={() => setUiState('normal')}
          />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <EmptyState
            title="No Staff Assigned to Selected Department"
            description="There are currently no staff records listed for this specific operational group."
            action={
              <button
                onClick={() => setSelectedDept('ALL')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Reset to All Departments
              </button>
            }
          />
        </div>
      )}

      {/* Normal Live State: High-Tech 22" Wide Matrix */}
      {uiState === 'normal' && (
        <div className="space-y-3">
          
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Staff Listed</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{filteredStaff.length} Members</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Target Quota</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{totalQuota} Cases</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Cases Delivered</span>
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">{totalAchieved} Cases</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Completion</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{avgCompletion}%</span>
            </div>
          </div>

          {/* Matrix Table - Fits 22" (1920px) screens without horizontal scroll */}
          <div className="bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
            <div className="w-full overflow-x-auto lg:overflow-x-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase select-none">
                    <th onClick={() => handleSort('id')} className="py-3 px-3 w-16 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Staff ID</span>
                        {sortField === 'id' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-cyan-500" /> : <ArrowDown size={11} className="text-cyan-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('name')} className="py-3 px-3 w-40 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Specialist Name</span>
                        {sortField === 'name' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-cyan-500" /> : <ArrowDown size={11} className="text-cyan-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('department')} className="py-3 px-3 w-44 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Department</span>
                        {sortField === 'department' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-cyan-500" /> : <ArrowDown size={11} className="text-cyan-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th className="py-3 px-3 w-44">Email & Phone</th>
                    <th onClick={() => handleSort('quota')} className="py-3 px-3 w-24 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Quota</span>
                        {sortField === 'quota' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-cyan-500" /> : <ArrowDown size={11} className="text-cyan-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th onClick={() => handleSort('achieved')} className="py-3 px-3 w-24 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Achieved</span>
                        {sortField === 'achieved' ? (sortDir === 'asc' ? <ArrowUp size={11} className="text-cyan-500" /> : <ArrowDown size={11} className="text-cyan-500" />) : <ArrowUpDown size={10} className="text-slate-400 opacity-40" />}
                      </div>
                    </th>
                    <th className="py-3 px-3 w-36">Quarter Progress</th>
                    <th className="py-3 px-3 w-40">Monthly Slices (M1 / M2 / M3)</th>
                    <th className="py-3 px-3 text-right w-24">Bonus Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {sortedStaff.map((staff) => {
                    const pct = Math.round((staff.achieved / staff.quota) * 100);
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400 font-bold">#{staff.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{staff.name}</div>
                          <div className="text-[10px] text-slate-400">{staff.role}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold">{staff.department}</td>
                        <td className="py-3 px-3">
                          <div className="text-[11px] text-slate-700 dark:text-slate-300">{staff.email}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{staff.phone}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 font-bold">{staff.quota}</td>
                        <td className="py-3 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{staff.achieved}</td>
                        
                        {/* Progress Bar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">{pct}%</span>
                          </div>
                        </td>

                        {/* Monthly Slices */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{staff.month1}</span> / {staff.month2} / {staff.month3}
                        </td>

                        {/* Tier Badge */}
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            staff.tier === 'Diamond'
                              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                              : staff.tier === 'Gold'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {staff.tier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>Displaying <strong>{filteredStaff.length}</strong> evaluated staff targets for {selectedQuarter}</span>
              <span className="font-mono text-emerald-600 font-bold">Live Production Pipeline</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
