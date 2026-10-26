import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Activity,
  Save,
  Check,
  Scan,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { TeethChart } from '@/shared/components/TeethChart';
import { formatDate } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import {
  serviceClient,
  type ServiceItem,
  useServiceItemConcurrency,
  PreconditionFailedError,
  PreconditionRequiredError,
  PermissionDeniedError,
} from '@/shared/api';
import { ShieldAlert, RefreshCw, Lock, GitCompare } from 'lucide-react';

type SubOrderTab = 'overview' | 'forms' | 'scans' | 'activity';

export default function SubOrderDetail() {
  const { orderId, subOrderId } = useParams<{ orderId: string; subOrderId: string }>();
  const navigate = useNavigate();

  const orders = useStore((s) => s.getOrders());
  const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  const [activeTab, setActiveTab] = useState<SubOrderTab>('overview');
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([14, 15]);
  const [occlusalContact, setOcclusalContact] = useState('Light contact');
  const [marginType, setMarginType] = useState('Chamfer');
  const [material, setMaterial] = useState('Zirconia (Multilayer)');
  const [subOrderAnswers, setSubOrderAnswers] = useState<any[]>([]);
  const [shade, setShade] = useState('A2');
  const [clinicalNotes, setClinicalNotes] = useState('Ensure tight proximal contact on distal aspect.');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [contractService, setContractService] = useState<ServiceItem | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [serverVersionSnapshot, setServerVersionSnapshot] = useState<ServiceItem | null>(null);

  const serviceItemUuid = contractService?.uuid || subOrderId || 'srv-biomodel-001';

  const {
    currentEtag,
    hasConflict,
    conflictDetails,
    unsavedDraft,
    mutateWithConcurrency,
    reconcile,
    resetConflict,
    setEtag,
    saveDraft,
  } = useServiceItemConcurrency<{
    occlusalContact: string;
    marginType: string;
    material: string;
    shade: string;
    clinicalNotes: string;
    selectedTeeth: number[];
  }>(serviceItemUuid);

  const fetchServiceItem = React.useCallback(async () => {
    const key = subOrderId || 'srv-biomodel-001';
    try {
      const res = await serviceClient.get(key);
      setContractService(res.data);
      setEtag(res.etag);
      return res;
    } catch (err: any) {
      console.warn('Could not fetch contract service item:', err);
      throw err;
    }
  }, [subOrderId, setEtag]);

  React.useEffect(() => {
    fetchServiceItem().catch(console.warn);
  }, [fetchServiceItem]);

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/orders')}>Return to Orders</Button>
      </div>
    );
  }

  const isReadOnly = Boolean(contractService?.isInvoiced);

  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService) return;

    if (isReadOnly) {
      setEditError('This service item is invoiced and marked read-only. Further edits are not permitted.');
      return;
    }

    setEditError(null);
    setIsSaving(true);

    const draft = {
      occlusalContact,
      marginType,
      material,
      shade,
      clinicalNotes,
      selectedTeeth,
    };

    try {
      await mutateWithConcurrency(
        async (activeEtag) => {
          return await serviceClient.edit(
            contractService.uuid,
            {
              answers: [
                { fieldCode: 'occlusal_contact', value: occlusalContact },
                { fieldCode: 'margin_type', value: marginType },
                { fieldCode: 'material', value: material },
                { fieldCode: 'shade', value: shade },
              ],
              serviceNotes: clinicalNotes,
            },
            activeEtag
          );
        },
        currentEtag,
        draft
      );

      setSavedSuccess(true);
      resetConflict();
      await fetchServiceItem();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      if (err instanceof PreconditionFailedError || err?.status === 412) {
        setEditError('412 Precondition Failed: This service item was modified concurrently by another user. Your unsaved draft has been preserved below.');
      } else if (err instanceof PreconditionRequiredError || err?.status === 428) {
        setEditError('428 Precondition Required: Missing ETag. Reload entity before editing.');
      } else if (err instanceof PermissionDeniedError || err?.status === 403) {
        setEditError(`403 Forbidden: ${err.message || 'Permission denied on this service item.'}`);
      } else if (err?.status === 409) {
        setEditError(`409 Conflict: ${err.message || 'Workflow or business rule conflict.'}`);
      } else {
        setEditError(err.message || 'Failed to update service item specs');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadAndCompare = async () => {
    try {
      const refreshed = await reconcile(fetchServiceItem);
      setServerVersionSnapshot(refreshed.data);
      setShowCompareModal(true);
    } catch (err: any) {
      setEditError(`Failed to reload latest server version: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Order {order.orderNumber}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sub-Order: #{subOrderId || 'SO-101'}
              </h1>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Parent Order: {order.orderNumber} • Patient: {order.patientName}
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-5 h-5" />
          <span>Sub-order clinical specifications successfully updated with ETag rotation!</span>
        </div>
      )}

      {/* 412 Stale Revision Conflict Banner with Draft Preservation */}
      {hasConflict && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-300 dark:border-amber-800 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                412 Precondition Failed: Concurrency Conflict Detected
              </h4>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                Another operator or background process updated this service item concurrently.
                <strong> Your unsaved draft has been preserved in memory.</strong> Silent overwrites are prevented.
              </p>
              {conflictDetails && (
                <p className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                  Client ETag: {conflictDetails.clientEtag || 'unknown'} &bull; Server ETag: {conflictDetails.serverEtag || 'unknown'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-900">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReloadAndCompare}
              className="gap-1.5 text-xs font-bold"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Reload Latest Server Version & Compare
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetConflict}
              className="text-xs"
            >
              Dismiss Notice
            </Button>
          </div>
        </div>
      )}

      {/* Generic Edit Error Banner (428, 403, 409, 422) */}
      {editError && !hasConflict && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 rounded-xl flex items-start gap-3 border border-rose-300 dark:border-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-xs block">{editError}</span>
          </div>
        </div>
      )}

      {/* Read-Only State Indicator */}
      {isReadOnly && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-2 border border-slate-300 dark:border-slate-700 text-xs font-semibold">
          <Lock className="w-4 h-4 text-slate-500" />
          <span>Read-Only Mode: This service item has financial locks or is invoiced. Changes cannot be submitted.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'overview', label: 'Overview & Anatomy', icon: Layers },
          { id: 'forms', label: 'Clinical Specifications', icon: FileText },
          { id: 'scans', label: 'Target Scans', icon: Scan },
          { id: 'activity', label: 'Audit Trail', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubOrderTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Teeth Anatomy */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Anatomical FDI Teeth Selection
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select or deselect teeth included in this specific restoration sub-unit:
            </p>
            <TeethChart
              selectedTeeth={selectedTeeth}
              onToggleTooth={(tooth: number) => {
                setSelectedTeeth((prev) =>
                  prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]
                );
              }}
              onClearAll={() => setSelectedTeeth([])}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
              Selected units ({selectedTeeth.length}): {selectedTeeth.map(t => `#${t}`).join(', ') || 'None'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Summary Card
            </h2>
            <div className="space-y-3 text-sm">
              {contractService && (
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1.5 text-xs mb-3">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                    <span>SERVICE LINE SPECIFICATION</span>

                  </div>
                  <div className="text-[11px] text-emerald-900 dark:text-emerald-200 font-mono truncate">UUID: {contractService.uuid}</div>
                  <div className="text-[10px] text-slate-500 font-mono">ETag: {currentEtag || 'W/"srv-live"'}</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                    Payer: {contractService.billedToContactUuid} ({contractService.billedPartyOrigin})
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    Line Total: ${contractService.lineTotal || contractService.unitPrice} {contractService.currencyCode || 'USD'}
                  </div>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Sub-Order ID</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">#{subOrderId || 'SO-101'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Restoration</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.restoration}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Shade</span>
                <span className="font-medium text-gray-900 dark:text-white">{shade}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Material</span>
                <span className="font-medium text-gray-900 dark:text-white">{material}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(order.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Specifications */}
      {activeTab === 'forms' && (
        <form onSubmit={handleSaveSpecs} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Occlusal Contact Clearance
              </label>
              <select
                value={occlusalContact}
                onChange={(e) => setOcclusalContact(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="Light contact">Light contact (40µm shimstock pull)</option>
                <option value="Full contact">Full anatomical contact</option>
                <option value="No contact">No contact / Out of occlusion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Margin Finishing Type
              </label>
              <select
                value={marginType}
                onChange={(e) => setMarginType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="Chamfer">Chamfer (0.5mm)</option>
                <option value="Shoulder">Shoulder (90 degree)</option>
                <option value="Feather edge">Feather edge</option>
                <option value="Knife edge">Knife edge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Substrate Material
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="Zirconia (Multilayer)">Zirconia (Multilayer)</option>
                <option value="PFM">PFM</option>
                <option value="E-max">IPS e.max</option>
                <option value="PMMA">PMMA Temporary</option>
                <option value="Titanium">Titanium</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Target Shade
              </label>
              <input
                type="text"
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Technician Fabrication Directive
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="font-mono text-xs text-slate-400">
              Aggregated ETag: <code>{currentEtag || 'Unversioned'}</code>
            </span>
            <Button type="submit" disabled={isSaving || isReadOnly} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Validating ETag & Saving...' : 'Save Sub-Order Specs (If-Match)'}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Target Scans */}
      {activeTab === 'scans' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            3D Intraoral Scans Assigned to This Unit
          </h2>
          <div className="space-y-3">
            {[
              { name: 'preparation_arch_scan.stl', size: '15.4 MB', date: 'Dec 10, 2024' },
              { name: 'opposing_dentition_scan.stl', size: '13.1 MB', date: 'Dec 10, 2024' },
              { name: 'buccal_bite_registration.ply', size: '3.9 MB', date: 'Dec 10, 2024' },
            ].map((sc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Scan className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{sc.name}</div>
                    <div className="text-xs text-gray-400">{sc.size} • Captured {sc.date}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Ready for CAD
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Chronological Audit History
          </h2>
          <div className="space-y-4 pl-4 border-l-2 border-blue-500">
            <div className="relative">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Today, 10:15 AM</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Margin clearance checked</div>
              <div className="text-xs text-gray-400">Verified by Lead Technician Dr. Robert Miller</div>
            </div>
            <div className="relative">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Yesterday, 16:30 PM</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">STL scans matched with clinical order</div>
              <div className="text-xs text-gray-400">Automated geometry alignment verified</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
