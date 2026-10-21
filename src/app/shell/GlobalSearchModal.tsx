import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  User,
  Stethoscope,
  Building2,
  Scan,
  Compass,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Command,
  CheckCircle2,
  Sliders,
  DollarSign,
  Plus
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { MASTER_WORKFLOW_ORDERS } from '@/shared/data/flowMockData';
import { sound } from '@/shared/utils/sound';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'orders' | 'patients' | 'doctors' | 'clinics' | 'actions';

interface SearchResultItem {
  id: string;
  category: 'orders' | 'patients' | 'doctors' | 'clinics' | 'actions';
  title: string;
  subtitle: string;
  tag?: string;
  badgeColor?: string;
  route: string;
  icon: React.ElementType;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Store data for search
  const storeOrders = useStore((s) => s.getOrders());
  const storePatients = useStore((s) => s.getPatients());
  const storeDoctors = useStore((s) => s.getDoctors());
  const storeClinics = useStore((s) => s.getClinics());
  const storeScanCenters = useStore((s) => s.getScanCenters());

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Quick Action Pages
  const SYSTEM_PAGES: SearchResultItem[] = useMemo(() => [
    {
      id: 'act-new-case',
      category: 'actions',
      title: 'Create New Case',
      subtitle: 'Open the digital case submission wizard',
      tag: 'Action',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      route: '/add-case',
      icon: Plus,
    },
    {
      id: 'act-flow',
      category: 'actions',
      title: 'Master Orders Flow',
      subtitle: 'Multi-service digital production grid & queue',
      tag: 'Production',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30',
      route: '/flow',
      icon: Layers,
    },
    {
      id: 'act-dashboard',
      category: 'actions',
      title: 'Analytics Dashboard',
      subtitle: 'Executive KPIs, Power BI metrics & live targets',
      tag: 'Analytics',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
      route: '/dashboard',
      icon: Compass,
    },
    {
      id: 'act-cms',
      category: 'actions',
      title: 'Configuration Management System (CMS)',
      subtitle: 'Manage app.config.json, YAML settings & live features',
      tag: 'Admin',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      route: '/cms',
      icon: Sliders,
    },
    {
      id: 'act-patients',
      category: 'actions',
      title: 'Patient Directory',
      subtitle: 'View patient records, case histories, and dental scans',
      tag: 'Clinical',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
      route: '/patients',
      icon: User,
    },
    {
      id: 'act-doctors',
      category: 'actions',
      title: 'Doctors & Clinicians',
      subtitle: 'Manage prescribing dentists and specialists',
      tag: 'Clinicians',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30',
      route: '/doctors',
      icon: Stethoscope,
    },
    {
      id: 'act-clinics',
      category: 'actions',
      title: 'Clinics & Imaging Facilities',
      subtitle: 'Dental clinics, scan centers and hospitals',
      tag: 'Directory',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      route: '/clinics',
      icon: Building2,
    },
    {
      id: 'act-scans',
      category: 'actions',
      title: 'Scan Centers Hub',
      subtitle: 'Manage incoming CBCT and intraoral scan gateways',
      tag: 'Facility',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30',
      route: '/scan-center',
      icon: Scan,
    },
  ], []);

  // Compute Search Results across All Sources
  const allResults: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Orders from both Store and Master Workflow
    const orderResults: SearchResultItem[] = [];
    const seenOrderNums = new Set<string>();

    // From MASTER_WORKFLOW_ORDERS
    MASTER_WORKFLOW_ORDERS.forEach((o) => {
      if (seenOrderNums.has(o.orderNum)) return;
      seenOrderNums.add(o.orderNum);

      const matches = !q ||
        o.orderNum.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.doctorName.toLowerCase().includes(q) ||
        o.scanCenter.toLowerCase().includes(q) ||
        o.services.some(s => s.typeCode.toLowerCase().includes(q) || s.title.toLowerCase().includes(q));

      if (matches) {
        orderResults.push({
          id: `wf-${o.id}`,
          category: 'orders',
          title: `Case #${o.orderNum} • ${o.patientName}`,
          subtitle: `Dr. ${o.doctorName} • ${o.scanCenter} • ${o.services.map(s => s.typeCode).join(', ')}`,
          tag: o.source,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono',
          route: `/order-details?ID=${o.orderNum}`,
          icon: FileText,
        });
      }
    });

    // From storeOrders
    storeOrders.forEach((o) => {
      if (seenOrderNums.has(o.orderNumber)) return;
      seenOrderNums.add(o.orderNumber);

      const matches = !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.doctorName.toLowerCase().includes(q) ||
        o.clinicName.toLowerCase().includes(q);

      if (matches) {
        orderResults.push({
          id: `ord-${o.id}`,
          category: 'orders',
          title: `Order #${o.orderNumber} • ${o.patientName}`,
          subtitle: `Dr. ${o.doctorName} • ${o.clinicName} • Status: ${o.status}`,
          tag: o.status,
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30',
          route: `/order-details?id=${o.id}`,
          icon: FileText,
        });
      }
    });

    // 2. Patients
    const patientResults: SearchResultItem[] = storePatients
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q))
      .map((p) => ({
        id: `pat-${p.id}`,
        category: 'patients',
        title: p.name,
        subtitle: `Phone: ${p.phone || 'N/A'} • Total Cases: ${p.ordersCount || 1}`,
        tag: 'Patient',
        badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
        route: `/patients`,
        icon: User,
      }));

    // 3. Doctors
    const doctorResults: SearchResultItem[] = storeDoctors
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q) || d.clinicName?.toLowerCase().includes(q))
      .map((d) => ({
        id: `doc-${d.id}`,
        category: 'doctors',
        title: d.name,
        subtitle: `${d.specialty || 'General Dentistry'} • Clinic: ${d.clinicName || '3DDX Clinic'}`,
        tag: 'Clinician',
        badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30',
        route: `/doctors`,
        icon: Stethoscope,
      }));

    // 4. Clinics & Scan Centers
    const clinicResults: SearchResultItem[] = [
      ...storeClinics
        .filter((c) => !q || c.name.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q))
        .map((c) => ({
          id: `cln-${c.id}`,
          category: 'clinics' as const,
          title: c.name,
          subtitle: `Location: ${c.city || 'Dental Facility'} • Active Cases: ${c.ordersCount || 0}`,
          tag: 'Clinic',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30',
          route: `/clinics`,
          icon: Building2,
        })),
      ...storeScanCenters
        .filter((sc) => !q || sc.name.toLowerCase().includes(q) || sc.location?.toLowerCase().includes(q))
        .map((sc) => ({
          id: `sc-${sc.id}`,
          category: 'clinics' as const,
          title: sc.name,
          subtitle: `Location: ${sc.location || 'Scan Facility'} • Devices: ${sc.devices || 1} • Active: ${sc.activeOrders || 0}`,
          tag: 'Scan Center',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30',
          route: `/scan-center`,
          icon: Scan,
        }))
    ];

    // 5. Actions / Pages
    const actionResults: SearchResultItem[] = SYSTEM_PAGES.filter(
      (a) => !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    let combined: SearchResultItem[] = [];

    if (!q) {
      // Default / empty query suggestions: Quick actions first, followed by recent orders
      combined = [...actionResults, ...orderResults.slice(0, 6)];
    } else {
      combined = [
        ...orderResults.slice(0, 8),
        ...actionResults.slice(0, 4),
        ...patientResults.slice(0, 5),
        ...doctorResults.slice(0, 4),
        ...clinicResults.slice(0, 4),
      ];
    }

    if (activeCategory === 'all') return combined;
    return combined.filter((item) => item.category === activeCategory);
  }, [query, activeCategory, storeOrders, storePatients, storeDoctors, storeClinics, storeScanCenters, SYSTEM_PAGES]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const handleSelect = (item: SearchResultItem) => {
    sound.playClick();
    onClose();
    navigate(item.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#090e18] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <Search size={20} className="text-sky-500 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, cases, patients, doctors, facilities, actions..."
            className="w-full bg-transparent px-3 text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer mr-1"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-bold">
          {[
            { id: 'all' as const, label: 'All Results' },
            { id: 'orders' as const, label: 'Orders & Cases' },
            { id: 'actions' as const, label: 'Quick Navigation' },
            { id: 'patients' as const, label: 'Patients' },
            { id: 'doctors' as const, label: 'Clinicians' },
            { id: 'clinics' as const, label: 'Facilities' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search size={32} className="mx-auto opacity-30" />
              <p className="text-sm font-bold">No results found for "{query}"</p>
              <p className="text-xs">Try searching by Order Number (e.g. 504900), patient name, or doctor name.</p>
            </div>
          ) : (
            allResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-l-4 border-l-sky-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {item.tag && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-500 transition-colors hidden sm:inline">
                      Jump to
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">ESC</kbd> Close</span>
          </div>
          <span className="font-bold text-sky-600 dark:text-sky-400 hidden sm:inline">
            3DDX Global Spotlight Engine
          </span>
        </div>
      </div>
    </div>
  );
};
