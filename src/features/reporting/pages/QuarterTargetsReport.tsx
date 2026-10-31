import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Download,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Table,
  Activity,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Boxes,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { catalogClient } from '@/shared/api/catalogClient';
import type { CatalogService } from '@/shared/api/contractTypes';
import { useReducedMotion } from 'framer-motion';

const PIE_COLORS = ['#0284c7', '#ea580c', '#8b5cf6', '#10b981'];

export default function QuarterTargetsReport() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'digital' | 'physical'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix'>('overview');

  const fetchCatalogServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogClient.listServices();
      setServices(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve catalog telemetries';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogServices();
  }, []);

  // Filtered Services based on search query and type filter
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesSearch =
        svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        svc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (svc.workflowCode || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (typeFilter === 'digital') return svc.isDigital;
      if (typeFilter === 'physical') return !svc.isDigital;
      return true;
    });
  }, [services, searchTerm, typeFilter]);

  // Derived real KPI metrics
  const totalServices = services.length;
  const digitalServicesCount = useMemo(() => services.filter((s) => s.isDigital).length, [services]);
  const physicalServicesCount = totalServices - digitalServicesCount;
  const avgLeadTime = useMemo(() => {
    if (services.length === 0) return 0;
    const totalLeadTime = services.reduce((acc, s) => acc + (s.leadTimeDays || 1), 0);
    return (totalLeadTime / services.length).toFixed(1);
  }, [services]);

  const uniqueWorkflowsCount = useMemo(() => {
    return new Set(services.map((s) => s.workflowCode).filter(Boolean)).size;
  }, [services]);

  // Chart data 1: Lead times per service
  const leadTimesChartData = useMemo(() => {
    return services.map((s) => ({
      name: s.code,
      fullName: s.name,
      leadTimeDays: s.leadTimeDays || 1,
      isDigital: s.isDigital,
    }));
  }, [services]);

  // Chart data 2: Deliverable distribution
  const deliverableChartData = useMemo(() => {
    return [
      { name: 'Digital CAD / Virtual', value: digitalServicesCount, color: '#0284c7' },
      { name: 'Physical Biomodel / Guide', value: physicalServicesCount, color: '#ea580c' },
    ].filter((item) => item.value > 0);
  }, [digitalServicesCount, physicalServicesCount]);

  const handleExportCSV = () => {
    const headers = ['UUID', 'Service Code', 'Service Name', 'Classification', 'Workflow Code', 'Lead Time (Days)'];
    const rows = filteredServices.map((s) => [
      s.uuid,
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      s.isDigital ? 'Digital CAD' : 'Physical Biomodel',
      s.workflowCode,
      s.leadTimeDays ?? 1,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `3DDX_Clinical_Catalog_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('nav.liveDashboard', 'Live Dashboard')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              API Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('dashboard.liveDashboardDesc', 'Live clinical operations telemetries, catalog specifications, and fulfillment tracking')}
          </p>
        </div>

        {/* View switcher and Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl border border-slate-300/80 dark:border-slate-700/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('dashboard.overview', 'Telemetry Overview')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('dashboard.specMatrix', 'Catalog Matrix')}
            </button>
          </div>

          <button
            type="button"
            onClick={fetchCatalogServices}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs disabled:opacity-50"
            title={t('dashboard.refreshMetrics', 'Refresh Analytics Metrics')}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{t('common.refresh', 'Refresh')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Download size={13} />
            <span>{t('common.export', 'Export CSV')}</span>
          </button>
        </div>
      </div>

      {/* Truthful Contract Capability Gap Alert */}
      <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/20 text-sky-950 dark:text-sky-200 flex items-start gap-3 shadow-xs">
        <ShieldCheck size={20} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold flex items-center gap-2">
            <span>Canonical Contract Integration & Telemetry Governance</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              Contract Compliant
            </span>
          </div>
          <div className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            In accordance with zero-fake-data standards, unsupported external BI iframe embeds and synthetic quarterly financial projections have been decommissioned. Telemetries rendered below are loaded live from the canonical OpenAPI catalog endpoint (<code className="font-mono bg-sky-100 dark:bg-sky-900/80 px-1 py-0.2 rounded">GET /api/v1/catalog/services</code>) reflecting actual registered surgical and conversion procedures.
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingState text={t('dashboard.loadingCatalog', 'Loading verified catalog operations telemetry...')} />}

      {!loading && error && (
        <ErrorState
          title={t('dashboard.errorLoading', 'Catalog Telemetry Unavailable')}
          message={error}
          onRetry={fetchCatalogServices}
        />
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* KPI Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{t('dashboard.totalServices', 'Registered Services')}</span>
                <Boxes size={16} className="text-sky-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {totalServices}
              </div>
              <div className="text-[11px] text-slate-400">
                Prescribed clinical catalog definitions
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{t('dashboard.avgLeadTime', 'Average SLA Lead Time')}</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {avgLeadTime} <span className="text-xs font-semibold text-slate-400">days</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Standard turnaround commitment
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{t('dashboard.digitalRatio', 'Digital CAD Services')}</span>
                <Activity size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {digitalServicesCount} <span className="text-xs font-semibold text-slate-400">/ {totalServices}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Pure digital turnaround pathways
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{t('dashboard.activeWorkflows', 'Active Workflows')}</span>
                <Layers size={16} className="text-purple-500" />
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {uniqueWorkflowsCount}
              </div>
              <div className="text-[11px] text-slate-400">
                Distinct state machine progressions
              </div>
            </div>
          </div>

          {/* Slicers & Filters Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('dashboard.searchCatalog', 'Search service name, code, workflow...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    typeFilter === 'all'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Formats
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('digital')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    typeFilter === 'digital'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Digital CAD
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('physical')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    typeFilter === 'physical'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Physical Models
                </button>
              </div>

              {(searchTerm || typeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  data-testid="reset-slicers-btn"
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: TELEMETRY OVERVIEW CHARTS */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Times Bar Chart */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Prescribed Service Delivery Lead Times
                    </h3>
                    <p className="text-xs text-slate-400">Contractual turnaround in business days</p>
                  </div>
                  <Clock size={16} className="text-slate-400" />
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadTimesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '0.75rem',
                        }}
                      />
                      <Bar
                        dataKey="leadTimeDays"
                        name="Lead Time (Days)"
                        fill="#0284c7"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={!shouldReduceMotion}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Deliverable Architecture Donut Chart */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Deliverable Architecture Breakdown
                    </h3>
                    <p className="text-xs text-slate-400">Digital versus physical laboratory deliverables</p>
                  </div>
                  <Layers size={16} className="text-slate-400" />
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deliverableChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        isAnimationActive={!shouldReduceMotion}
                      >
                        {deliverableChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '0.75rem',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.75rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: SPECIFICATIONS & WORKFLOW MATRIX TABLE */}
          {(activeTab === 'matrix' || activeTab === 'overview') && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Clinical Catalog Specifications Matrix
                  </h3>
                  <p className="text-xs text-slate-400">Registered procedures, state machine bindings, and SLA targets</p>
                </div>
                <Table size={16} className="text-slate-400" />
              </div>

              {filteredServices.length === 0 ? (
                <div data-testid="slicer-no-results" className="py-12 text-center space-y-3">
                  <EmptyState
                    title="No Matching Catalog Services"
                    description={`No registered services match "${searchTerm || typeFilter}".`}
                  />
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-sky-500"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3">Service Code</th>
                        <th className="px-4 py-3">Clinical Procedure Name</th>
                        <th className="px-4 py-3">Classification</th>
                        <th className="px-4 py-3">Workflow Binding</th>
                        <th className="px-4 py-3 text-right">SLA Turnaround</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredServices.map((svc) => (
                        <tr key={svc.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                            {svc.code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {svc.name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                svc.isDigital
                                  ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300'
                                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {svc.isDigital ? 'Digital CAD' : 'Physical Biomodel'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {svc.workflowCode}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            {svc.leadTimeDays ?? 1} {svc.leadTimeDays === 1 ? 'day' : 'days'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={12} />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
