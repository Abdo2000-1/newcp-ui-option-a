import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
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
  Layers,
  Sliders,
  Plus
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { MASTER_WORKFLOW_ORDERS } from '@/shared/data/flowMockData';
import { sound } from '@/shared/utils/sound';
import {
  SearchResultItem,
  SearchIndex,
  createIndexedItem,
} from '@/shared/utils/searchIndex';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'orders' | 'patients' | 'doctors' | 'clinics' | 'actions';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Store data for search
  const storeOrders = useStore((s) => s.getOrders());
  const storePatients = useStore((s) => s.getPatients());
  const storeDoctors = useStore((s) => s.getDoctors());
  const storeClinics = useStore((s) => s.getClinics());
  const storeScanCenters = useStore((s) => s.getScanCenters());

  // Focus input when opened and reset states
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
      return () => clearTimeout(timer);
    } else {
      setInputValue('');
      setDebouncedQuery('');
      setIsDebouncing(false);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounce search query input (150ms)
  useEffect(() => {
    if (inputValue === '') {
      setDebouncedQuery('');
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(inputValue);
      setIsDebouncing(false);
    }, 150);

    return () => clearTimeout(handler);
  }, [inputValue]);

  // Global Quick Action Pages
  const SYSTEM_PAGES: SearchResultItem[] = useMemo(() => [
    {
      id: 'act-new-case',
      category: 'actions',
      title: 'Create New Case',
      subtitle: 'Open the digital case submission wizard',
      tag: 'Action',
      badgeColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
      route: '/add-case',
      icon: Plus,
    },
    {
      id: 'act-flow',
      category: 'actions',
      title: 'Master Orders Flow',
      subtitle: 'Multi-service digital production grid & queue',
      tag: 'Production',
      badgeColor: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.1)',
      route: '/flow',
      icon: Layers,
    },
    {
      id: 'act-dashboard',
      category: 'actions',
      title: 'Analytics Dashboard',
      subtitle: 'Executive KPIs, Power BI metrics & live targets',
      tag: 'Analytics',
      badgeColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
      route: '/dashboard',
      icon: Compass,
    },
    {
      id: 'act-cms',
      category: 'actions',
      title: 'Configuration Management System (CMS)',
      subtitle: 'Manage app.config.json, YAML settings & live features',
      tag: 'Admin',
      badgeColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
      route: '/cms',
      icon: Sliders,
    },
    {
      id: 'act-patients',
      category: 'actions',
      title: 'Patient Directory',
      subtitle: 'View patient records, case histories, and dental scans',
      tag: 'Clinical',
      badgeColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
      route: '/patients',
      icon: User,
    },
    {
      id: 'act-doctors',
      category: 'actions',
      title: 'Doctors & Clinicians',
      subtitle: 'Manage prescribing dentists and specialists',
      tag: 'Clinicians',
      badgeColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
      route: '/doctors',
      icon: Stethoscope,
    },
    {
      id: 'act-clinics',
      category: 'actions',
      title: 'Clinics & Imaging Facilities',
      subtitle: 'Dental clinics, scan centers and hospitals',
      tag: 'Directory',
      badgeColor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.1)',
      route: '/clinics',
      icon: Building2,
    },
    {
      id: 'act-scans',
      category: 'actions',
      title: 'Scan Centers Hub',
      subtitle: 'Manage incoming CBCT and intraoral scan gateways',
      tag: 'Facility',
      badgeColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
      route: '/scan-center',
      icon: Scan,
    },
  ], [isDark]);

  // Build the in-memory SearchIndex ONLY when underlying data collections change.
  // Keystrokes NEVER rebuild this index.
  const searchIndex = useMemo(() => {
    const indexedItems = [];
    const seenOrderNums = new Set<string>();

    // 1. Workflow Orders
    for (const o of MASTER_WORKFLOW_ORDERS) {
      if (seenOrderNums.has(o.orderNum)) continue;
      seenOrderNums.add(o.orderNum);

      const serviceCodes = o.services.map((s) => s.typeCode).join(', ');
      const serviceTitles = o.services.map((s) => s.title).join(' ');

      const item: SearchResultItem = {
        id: `wf-${o.id}`,
        category: 'orders',
        title: `Case #${o.orderNum} • ${o.patientName}`,
        subtitle: `Dr. ${o.doctorName} • ${o.scanCenter} • ${serviceCodes}`,
        tag: o.source,
        badgeColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
        route: `/order-details?ID=${o.orderNum}`,
        icon: FileText,
      };
      indexedItems.push(createIndexedItem(item, [o.orderNum, o.patientName, o.doctorName, o.scanCenter, serviceCodes, serviceTitles]));
    }

    // 2. Store Orders
    for (const o of storeOrders) {
      if (seenOrderNums.has(o.orderNumber)) continue;
      seenOrderNums.add(o.orderNumber);

      const item: SearchResultItem = {
        id: `ord-${o.id}`,
        category: 'orders',
        title: `Order #${o.orderNumber} • ${o.patientName}`,
        subtitle: `Dr. ${o.doctorName} • ${o.clinicName} • Status: ${o.status}`,
        tag: o.status,
        badgeColor: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.1)',
        route: `/order-details?id=${o.id}`,
        icon: FileText,
      };
      indexedItems.push(createIndexedItem(item, [o.orderNumber, o.patientName, o.doctorName, o.clinicName, o.status]));
    }

    // 3. Patients
    for (const p of storePatients) {
      const item: SearchResultItem = {
        id: `pat-${p.id}`,
        category: 'patients',
        title: p.name,
        subtitle: `Phone: ${p.phone || 'N/A'} • Total Cases: ${p.ordersCount || 1}`,
        tag: 'Patient',
        badgeColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
        route: '/patients',
        icon: User,
      };
      indexedItems.push(createIndexedItem(item, [p.name, p.phone]));
    }

    // 4. Doctors
    for (const d of storeDoctors) {
      const item: SearchResultItem = {
        id: `doc-${d.id}`,
        category: 'doctors',
        title: d.name,
        subtitle: `${d.specialty || 'General Dentistry'} • Clinic: ${d.clinicName || '3DDX Clinic'}`,
        tag: 'Clinician',
        badgeColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
        route: '/doctors',
        icon: Stethoscope,
      };
      indexedItems.push(createIndexedItem(item, [d.name, d.specialty, d.clinicName]));
    }

    // 5. Clinics
    for (const c of storeClinics) {
      const item: SearchResultItem = {
        id: `cln-${c.id}`,
        category: 'clinics',
        title: c.name,
        subtitle: `Location: ${c.city || 'Dental Facility'} • Active Cases: ${c.ordersCount || 0}`,
        tag: 'Clinic',
        badgeColor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.1)',
        route: '/clinics',
        icon: Building2,
      };
      indexedItems.push(createIndexedItem(item, [c.name, c.city]));
    }

    // 6. Scan Centers
    for (const sc of storeScanCenters) {
      const item: SearchResultItem = {
        id: `sc-${sc.id}`,
        category: 'clinics',
        title: sc.name,
        subtitle: `Location: ${sc.location || 'Scan Facility'} • Devices: ${sc.devices || 1} • Active: ${sc.activeOrders || 0}`,
        tag: 'Scan Center',
        badgeColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
        route: '/scan-center',
        icon: Scan,
      };
      indexedItems.push(createIndexedItem(item, [sc.name, sc.location]));
    }

    // 7. System Quick Actions
    for (const act of SYSTEM_PAGES) {
      indexedItems.push(createIndexedItem(act, [act.title, act.subtitle]));
    }

    return new SearchIndex(indexedItems);
  }, [storeOrders, storePatients, storeDoctors, storeClinics, storeScanCenters, SYSTEM_PAGES, isDark]);

  // Query the pre-built index using debouncedQuery
  const searchResults: SearchResultItem[] = useMemo(() => {
    const q = debouncedQuery.trim();

    if (!q) {
      // Empty query default recommendations: Quick actions followed by recent orders
      if (activeCategory === 'actions') {
        return SYSTEM_PAGES;
      }
      if (activeCategory === 'orders') {
        return searchIndex.search('', 'orders', { maxTotal: 10 });
      }
      if (activeCategory !== 'all') {
        return searchIndex.search('', activeCategory, { maxTotal: 10 });
      }
      return [
        ...SYSTEM_PAGES.slice(0, 4),
        ...searchIndex.search('', 'orders', { maxTotal: 6 }),
      ];
    }

    return searchIndex.search(q, activeCategory, {
      maxTotal: 25,
      maxPerCategory: {
        orders: 8,
        actions: 4,
        patients: 5,
        doctors: 4,
        clinics: 4,
      },
    });
  }, [debouncedQuery, activeCategory, searchIndex, SYSTEM_PAGES]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery, activeCategory]);

  const handleSelect = useCallback((item: SearchResultItem) => {
    sound.playClick?.();
    onClose();
    navigate(item.route);
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      }
    }
  };

  const categories = [
    { id: 'all' as const, label: 'All Results' },
    { id: 'orders' as const, label: 'Orders & Cases' },
    { id: 'actions' as const, label: 'Quick Navigation' },
    { id: 'patients' as const, label: 'Patients' },
    { id: 'doctors' as const, label: 'Clinicians' },
    { id: 'clinics' as const, label: 'Facilities' },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="global-search-dialog-title"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? '#090e18' : '#ffffff',
            backgroundImage: 'none',
            border: `1px solid ${isDark ? alpha('#38bdf8', 0.2) : alpha('#0284c7', 0.16)}`,
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
              : '0 25px 50px -12px rgba(14, 165, 233, 0.2)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            m: { xs: 1.5, sm: 2 },
          },
        },
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: isDark ? 'rgba(2, 6, 23, 0.75)' : 'rgba(15, 23, 42, 0.5)',
          },
        },
      }}
      onKeyDown={handleKeyDown}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search Input Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2.5,
            py: 1.75,
            borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08)}`,
            gap: 1.5,
          }}
        >
          <Search size={22} color={isDark ? '#38bdf8' : '#0284c7'} style={{ flexShrink: 0 }} />
          <InputBase
            inputRef={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search orders, cases, patients, doctors, facilities, actions..."
            fullWidth
            inputProps={{ 'aria-label': 'Search clinical repository' }}
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              color: isDark ? '#f8fafc' : '#0f172a',
              '& input::placeholder': {
                color: isDark ? '#64748b' : '#94a3b8',
                opacity: 1,
              },
            }}
          />

          {isDebouncing && (
            <CircularProgress size={16} sx={{ color: '#0284c7', shrink: 0 }} />
          )}

          {inputValue && (
            <IconButton
              size="small"
              onClick={() => {
                setInputValue('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <X size={16} />
            </IconButton>
          )}

          <Chip
            label="ESC"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              borderRadius: 1.5,
              bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
              color: 'text.secondary',
              border: `1px solid ${isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1)}`,
            }}
          />
        </Box>

        {/* Categories Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.25,
            bgcolor: isDark ? alpha('#000000', 0.25) : alpha('#f8fafc', 0.8),
            borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)}`,
            overflowX: 'auto',
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <ButtonBase
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease-in-out',
                  bgcolor: isActive
                    ? '#0284c7'
                    : isDark
                    ? alpha('#ffffff', 0.04)
                    : alpha('#000000', 0.04),
                  color: isActive ? '#ffffff' : isDark ? '#94a3b8' : '#475569',
                  boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                  '&:hover': {
                    bgcolor: isActive ? '#0284c7' : isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
                  },
                }}
              >
                {cat.label}
              </ButtonBase>
            );
          })}
        </Box>

        {/* Results List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
          role="listbox"
          aria-label="Search results"
        >
          {searchResults.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary', px: 2 }}>
              <Search size={36} style={{ margin: '0 auto', opacity: 0.3, marginBottom: 8 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#e2e8f0' : '#1e293b' }}>
                No results found for &ldquo;{debouncedQuery}&rdquo;
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', mt: 0.5, color: 'text.secondary' }}>
                Try searching by Order Number (e.g. 504900), patient name, doctor name, or clinical tag.
              </Typography>
            </Box>
          ) : (
            searchResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <ButtonBase
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                  sx={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.25,
                    borderRadius: 2.5,
                    transition: 'all 0.12s ease-in-out',
                    bgcolor: isSelected
                      ? isDark
                        ? alpha('#0284c7', 0.16)
                        : alpha('#0284c7', 0.08)
                      : 'transparent',
                    borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent',
                    '&:hover': {
                      bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.03),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0, pr: 1 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shrink: 0,
                        bgcolor: isSelected
                          ? '#0284c7'
                          : isDark
                          ? alpha('#ffffff', 0.06)
                          : alpha('#000000', 0.05),
                        color: isSelected ? '#ffffff' : isDark ? '#38bdf8' : '#0284c7',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontWeight: 800,
                            fontSize: { xs: '0.825rem', sm: '0.9rem' },
                            color: isDark ? '#f8fafc' : '#0f172a',
                          }}
                        >
                          {item.title}
                        </Typography>
                        {item.tag && (
                          <Chip
                            label={item.tag}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: item.badgeColor || (isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06)),
                              color: isDark ? '#94a3b8' : '#475569',
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: '0.725rem',
                          color: 'text.secondary',
                          mt: 0.25,
                        }}
                      >
                        {item.subtitle}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, shrink: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: isSelected ? '#0284c7' : 'text.secondary',
                        display: { xs: 'none', sm: 'inline' },
                      }}
                    >
                      Jump to
                    </Typography>
                    <ArrowRight
                      size={14}
                      color={isSelected ? '#0284c7' : isDark ? '#64748b' : '#94a3b8'}
                    />
                  </Box>
                </ButtonBase>
              );
            })
          )}
        </Box>

        {/* Footer shortcuts */}
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            bgcolor: isDark ? alpha('#000000', 0.3) : alpha('#f8fafc', 0.9),
            borderTop: `1px solid ${isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.725rem',
            color: 'text.secondary',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip label="↑↓" size="small" sx={{ height: 18, fontSize: '0.625rem', fontFamily: 'monospace', fontWeight: 700 }} />
              <Typography sx={{ fontSize: '0.7rem' }}>Navigate</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip label="↵" size="small" sx={{ height: 18, fontSize: '0.625rem', fontFamily: 'monospace', fontWeight: 700 }} />
              <Typography sx={{ fontSize: '0.7rem' }}>Select</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip label="ESC" size="small" sx={{ height: 18, fontSize: '0.625rem', fontFamily: 'monospace', fontWeight: 700 }} />
              <Typography sx={{ fontSize: '0.7rem' }}>Close</Typography>
            </Box>
          </Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              color: '#0284c7',
              display: { xs: 'none', sm: 'inline' },
            }}
          >
            3DDX Global Spotlight Engine
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
