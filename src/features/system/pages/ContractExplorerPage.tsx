import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  ShieldAlert, 
  DollarSign, 
  Users, 
  Terminal, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Sliders, 
  ArrowRight,
  ExternalLink,
  Code2
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { DynamicFormRenderer } from '@/shared/components/DynamicFormRenderer';
import { catalogClient, workflowClient, pricingClient, payerClient, serviceClient } from '@/shared/api';
import type { 
  CatalogService, 
  HoldReasonOption, 
  ZeroChargeReason, 
  BilledPartyChoice 
} from '@/shared/api/contractTypes';

type ExplorerTab = 'health' | 'catalog' | 'hold' | 'pricing' | 'payer' | 'console';

export default function ContractExplorerPage() {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('health');

  // Health State
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLatency, setHealthLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Catalog State
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [selectedServiceUuid, setSelectedServiceUuid] = useState<string>('00000000-0000-0000-0000-000000000003');

  // Hold Reasons State
  const [holdReasons, setHoldReasons] = useState<HoldReasonOption[]>([]);
  const [holdFilter, setHoldFilter] = useState<'all' | 'customer' | 'internal' | 'lab'>('all');

  // Zero-Charge Reasons State
  const [zeroChargeReasons, setZeroChargeReasons] = useState<ZeroChargeReason[]>([]);

  // Eligible Billed Parties State
  const [billedParties, setBilledParties] = useState<BilledPartyChoice[]>([]);

  // Console State
  const [consoleEndpoint, setConsoleEndpoint] = useState<string>('/api/v1/catalog/services');
  const [consoleMethod, setConsoleMethod] = useState<'GET' | 'POST' | 'PATCH'>('GET');
  const [consoleOutput, setConsoleOutput] = useState<string>('Click "Execute Endpoint" to test...');
  const [consoleStatus, setConsoleStatus] = useState<number | null>(null);
  const [consoleEtag, setConsoleEtag] = useState<string | null>(null);
  const [isExecutingConsole, setIsExecutingConsole] = useState<boolean>(false);

  // Ping health on mount
  const checkHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/health');
      const data = await res.json();
      setHealthLatency(Math.round(performance.now() - start));
      setHealthData(data);
    } catch (err: any) {
      setHealthData({ status: 'OFFLINE_MOCK_ACTIVE', error: err?.message });
      setHealthLatency(0);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkHealth();
    catalogClient.listServices().then(setCatalog).catch(console.warn);
    workflowClient.getHoldReasons().then(setHoldReasons).catch(console.warn);
    pricingClient.getZeroChargeReasons().then(setZeroChargeReasons).catch(console.warn);
    payerClient.getEligibleBilledParties('ORD-504901').then(setBilledParties).catch(console.warn);
  }, []);

  // Filtered Hold Reasons
  const filteredHoldReasons = holdReasons.filter((r) =>
    holdFilter === 'all' ? true : r.holdType === holdFilter
  );

  // Execute console request
  const handleExecuteConsole = async () => {
    setIsExecutingConsole(true);
    setConsoleOutput('Executing request...');
    try {
      const res = await fetch(consoleEndpoint, {
        method: consoleMethod,
        headers: {
          'Accept': 'application/json',
          'If-Match': '*',
        },
      });
      setConsoleStatus(res.status);
      setConsoleEtag(res.headers.get('ETag') || res.headers.get('etag') || 'None');
      const json = await res.json();
      setConsoleOutput(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setConsoleStatus(500);
      setConsoleOutput(JSON.stringify({ error: err?.message }, null, 2));
    } finally {
      setIsExecutingConsole(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Zap className="w-5 h-5 animate-pulse" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-cyan-200 tracking-tight">
                New CP — Canonical OpenAPI 3.0.3 Contract Explorer
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Official implementation target for Q-B8..Q-B15: Concurrency (ETags/If-Match), Atomic On-Hold Requirements,
              Dynamic Form Definitions, Zero-Charge Invoicing Justifications & F07 Item-Level Payer Attribution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-cyan-500/30 text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-400">
                  {healthData?.status === 'UP' ? 'HTTP 200 OK' : 'CONTRACT ACTIVE'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Latency: {healthLatency !== null ? `${healthLatency}ms` : '0ms'} • 14 Operations
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={checkHealth}
              disabled={isPinging}
              className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'health', label: '1. Gateway & Health (GET /health)', icon: Activity },
          { id: 'catalog', label: '2. Catalog & Dynamic Forms (FormDefinition)', icon: Layers },
          { id: 'hold', label: '3. Hold Reasons (Q-B9)', icon: ShieldAlert },
          { id: 'pricing', label: '4. Zero-Charge Pricing (Q-B10)', icon: DollarSign },
          { id: 'payer', label: '5. Eligible Billed Parties (F07)', icon: Users },
          { id: 'console', label: '6. Interactive API Console', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExplorerTab)}
              className={`flex items-center gap-2 px-4 py-3 font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Gateway & Health */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Live Health Check Endpoint (GET /health)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Evaluates the live availability of the OpenAPI service layer. Returns runtime timestamp, version, and service identifier.
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-emerald-500/20">
              {JSON.stringify(healthData, null, 2)}
            </pre>
            <Button size="sm" onClick={checkHealth} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ping Health Endpoint</span>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-500" />
              <span>RFC 7807 Problem Error Normalization</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              The OpenAPI contract strictly specifies application/problem+json responses for all validation, authorization, and concurrency errors.
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-rose-500">428 Precondition Required</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Missing If-Match header during PATCH or POST /transitions.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-amber-500">412 Precondition Failed</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Concurrent modification detected: supplied ETag does not match latest revision.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-purple-500">422 Unprocessable Content</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Missing atomic Q-B9 holdType/holdReasonCode or Q-B10 zeroChargeReasonCode.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Catalog & Dynamic Forms */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Catalog Services (GET /api/v1/catalog/services)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Select an authorized clinical service below to dynamically fetch its form schema definition:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {catalog.map((item) => (
                <button
                  key={item.uuid}
                  type="button"
                  onClick={() => setSelectedServiceUuid(item.uuid)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedServiceUuid === item.uuid
                      ? 'bg-cyan-500/10 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900 dark:text-cyan-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                    {item.code}
                  </div>
                  <div className="font-bold text-sm mt-1 text-slate-900 dark:text-white truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>{(item as any).categoryCode || item.workflowCode}</span>
                    <span className="font-mono font-bold">{item.leadTimeDays}d lead</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Form Schema Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-500" />
              <span>Interactive Dynamic Form Renderer (GET /api/v1/catalog/services/{selectedServiceUuid}/form-schema)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              The form fields, input types, and conditional visibility below are computed on the fly from the contract schema:
            </p>
            <DynamicFormRenderer
              serviceUuid={selectedServiceUuid}
              onChange={(answers, valid) => {
                console.log('Dynamic Form answers:', answers, 'Valid:', valid);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: Hold Reasons */}
      {activeTab === 'hold' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>On-Hold Reasons Directory (GET /api/v1/catalog/hold-reasons)</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Rule Q-B9 requires an atomic payload containing both <code className="font-mono text-cyan-600">holdType</code> and <code className="font-mono text-cyan-600">holdReasonCode</code> whenever advancing to status "on_hold".
              </p>
            </div>

            {/* Hold Type Filters */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(['all', 'customer', 'internal', 'lab'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHoldFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    holdFilter === filter
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredHoldReasons.map((hr) => (
              <div
                key={hr.code}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                    {hr.holdType}
                  </span>
                  {hr.isTemporary && (
                    <span className="text-[10px] font-bold text-slate-400">Temporary</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">{hr.label}</div>
                <div className="font-mono text-[10px] text-slate-400 break-all">{hr.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Zero-Charge Pricing */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Zero-Charge Invoicing Reasons (GET /api/v1/lookups/zero-charge-reasons)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Rule Q-B10 strictly mandates that whenever <code className="font-mono text-cyan-600">unitPrice</code> is set to 0.00, a valid <code className="font-mono text-cyan-600">zeroChargeReasonCode</code> must be provided to justify the non-billed line item.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {zeroChargeReasons.map((zc) => (
              <div
                key={zc.code}
                className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white">{zc.label}</div>
                <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                  CODE: {zc.code}
                </div>
                {zc.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    {zc.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Eligible Billed Parties */}
      {activeTab === 'payer' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <span>Eligible Billed Parties Attribution (GET /api/v1/orders/{'{orderUuid}'}/eligible-billed-parties)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Rule F07 allows each individual service item under an order to be attributed and billed to an independent payer (ordering doctor, clinic, or scan center).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {billedParties.map((party) => (
              <div
                key={party.contactUuid}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
              >
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 uppercase">
                  {party.role}
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{party.label}</div>
                <div className="font-mono text-[10px] text-slate-400">{party.contactUuid}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Interactive API Console */}
      {activeTab === 'console' && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-cyan-500/30 shadow-xl space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-cyan-200 text-sm">Interactive OpenAPI 3.0.3 Console</span>
            </div>
            {consoleStatus && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-800">
                STATUS: {consoleStatus} • ETAG: {consoleEtag}
              </span>
            )}
          </div>

          {/* Quick Endpoints */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {[
              { path: '/health', method: 'GET' },
              { path: '/api/v1/catalog/services', method: 'GET' },
              { path: '/api/v1/catalog/services/00000000-0000-0000-0000-000000000003/form-schema', method: 'GET' },
              { path: '/api/v1/orders/ORD-504901/services', method: 'GET' },
              { path: '/api/v1/services/srv-biomodel-001/available-transitions', method: 'GET' },
              { path: '/api/v1/services/srv-biomodel-001/history', method: 'GET' },
              { path: '/api/v1/catalog/hold-reasons', method: 'GET' },
              { path: '/api/v1/lookups/zero-charge-reasons', method: 'GET' },
              { path: '/api/v1/orders/ORD-504901/eligible-billed-parties', method: 'GET' },
            ].map((ep, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setConsoleEndpoint(ep.path);
                  setConsoleMethod(ep.method as any);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {ep.method} {ep.path}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={consoleMethod}
              onChange={(e) => setConsoleMethod(e.target.value as any)}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 font-bold"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
            </select>
            <input
              type="text"
              value={consoleEndpoint}
              onChange={(e) => setConsoleEndpoint(e.target.value)}
              className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
            <Button
              onClick={handleExecuteConsole}
              disabled={isExecutingConsole}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4"
            >
              {isExecutingConsole ? 'Calling...' : 'Execute'}
            </Button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-cyan-300 font-mono text-xs max-h-96 overflow-y-auto border border-cyan-500/20">
            {consoleOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
