import React, { useState, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Calendar, Activity, ArrowUpRight, Clock, RefreshCw, ChevronRight, ChevronLeft, Bell,
  TrendingUp, BarChart3, ClipboardList, Target, PieChart, Database,
} from 'lucide-react';

// MUI Material Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTheme as useMuiTheme } from '@mui/material/styles';

import { useStore } from '@/shared/hooks/useStore';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { formatDate, formatCurrency, timeAgo } from '@/shared/utils/format';
import { sound } from '@/shared/utils/sound';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';

// 3DDX Canonical Brand Colors
const BRAND_BLUE = '#0284c7';
const BRAND_ORANGE = '#ea580c';

// Custom 3DDX Glassmorphic Chart Tooltip using MUI styling
interface ChartTooltipEntry {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

interface BrandChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

function BrandChartTooltip({ active, payload, label }: BrandChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          color: '#ffffff',
          p: 1.5,
          borderRadius: 2,
          boxShadow: 4,
          border: '1px solid rgba(51, 65, 85, 0.8)',
          minWidth: 170,
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 0.75,
            mb: 0.75,
            borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#e2e8f0' }}>
            {label}
          </Typography>
          <Chip
            size="small"
            label="Analytics"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'rgba(2, 132, 199, 0.2)',
              color: '#38bdf8',
            }}
          />
        </Box>
        {payload.map((entry, index) => (
          <Box
            key={`tooltip-entry-${index}`}
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, my: 0.25 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: entry.color || entry.fill || BRAND_BLUE,
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                {entry.name}:
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
              {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue')
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const theme = useMuiTheme();
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<'analytics' | 'telemetry'>('analytics');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q4');
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const urgentScrollRef = useRef<HTMLDivElement>(null);

  const allOrders = useStore((s) => s.getOrders());
  const allNotifs = useStore((s) => s.getNotifications());

  const handleRefresh = () => {
    setRefreshing(true);
    sound.playPop?.();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const scrollUrgent = (dir: 'left' | 'right') => {
    if (urgentScrollRef.current) {
      urgentScrollRef.current.scrollBy({
        left: dir === 'left' ? -300 : 300,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
      sound.playClick?.();
    }
  };

  const urgentOrders = allOrders.filter((o) => o.priority === 'Urgent');
  const recentOrders = useMemo(() => {
    return [...allOrders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [allOrders]);

  // Dynamic Executive Analytics Quarterly Datasets
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
        { month: 'Mar', actualRevenue: 243000, targetRevenue: 245000, guides: 1010, plans: 540, attainment: 99.1 },
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
      ],
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
        { month: 'Jun', actualRevenue: 263000, targetRevenue: 258000, guides: 1100, plans: 595, attainment: 101.9 },
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
      ],
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
        { month: 'Sep', actualRevenue: 275000, targetRevenue: 269000, guides: 1260, plans: 685, attainment: 102.2 },
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
      ],
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
        { month: 'Dec (Proj)', actualRevenue: 327000, targetRevenue: 325000, guides: 1500, plans: 785, attainment: 100.6 },
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
      ],
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
        { month: 'Q4 (Oct-Dec)', actualRevenue: 940000, targetRevenue: 945000, guides: 4340, plans: 2290, attainment: 99.4 },
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
      ],
    },
  }), []);

  const currentQData = QUARTER_DATA_MAP[selectedQuarter] || QUARTER_DATA_MAP.Q4;

  if (hasError) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorState
          title={t('error.syncInterrupted', 'Dashboard Service Synchronization Interrupted')}
          message={t('error.syncMessage', 'Unable to retrieve live CAD/CAM telemetry metrics. Please retry.')}
          onRetry={() => {
            setHasError(false);
            handleRefresh();
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', minWidth: 0, userSelect: 'none' }}>

      {/* Top Header / Control Bar (MUI Card) */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          {/* Title & Live Status */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                {t('dashboard.commandCenter', 'Command Center')}
              </Typography>
              <Chip
                size="small"
                label={t('dashboard.liveAnalytics', 'Live Analytics')}
                color="secondary"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 22,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.08)',
                }}
              />
            </Stack>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Calendar size={13} />
              {formatDate(new Date().toISOString())} ÔÇó 3D Diagnostix Dental Intelligence
            </Typography>
          </Box>

          {/* Studio Tab Switcher & Refresh Button */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 0.5,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 1)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                variant={activeTab === 'analytics' ? 'contained' : 'text'}
                color={activeTab === 'analytics' ? 'secondary' : 'inherit'}
                size="small"
                onClick={() => setActiveTab('analytics')}
                startIcon={<BarChart3 size={15} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 1.5,
                  boxShadow: activeTab === 'analytics' ? 1 : 'none',
                  bgcolor: activeTab === 'analytics' ? BRAND_BLUE : 'transparent',
                  color: activeTab === 'analytics' ? '#ffffff' : 'text.secondary',
                  '&:hover': {
                    bgcolor: activeTab === 'analytics' ? BRAND_BLUE : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {t('dashboard.executiveAnalytics', 'Executive Analytics')}
              </Button>
              <Button
                variant={activeTab === 'telemetry' ? 'contained' : 'text'}
                color={activeTab === 'telemetry' ? 'secondary' : 'inherit'}
                size="small"
                onClick={() => setActiveTab('telemetry')}
                startIcon={<Activity size={15} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 1.5,
                  boxShadow: activeTab === 'telemetry' ? 1 : 'none',
                  bgcolor: activeTab === 'telemetry' ? BRAND_ORANGE : 'transparent',
                  color: activeTab === 'telemetry' ? '#ffffff' : 'text.secondary',
                  '&:hover': {
                    bgcolor: activeTab === 'telemetry' ? BRAND_ORANGE : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {t('dashboard.productionQueue', 'Production Queue')}
              </Button>
            </Box>

            <Tooltip title={t('dashboard.refreshMetrics', 'Refresh Analytics Metrics')}>
              <IconButton
                size="small"
                onClick={handleRefresh}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  p: 0.9,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <RefreshCw
                  size={14}
                  style={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    color: refreshing ? BRAND_BLUE : undefined,
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {refreshing && (
          <LinearProgress
            sx={{
              mt: 2,
              height: 3,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: BRAND_BLUE },
            }}
          />
        )}
      </Card>

      {/* Urgent Rush Orders Ticker */}
      {urgentOrders.length > 0 && (
        <Card
          elevation={0}
          role="status"
          sx={{
            py: 1,
            px: 2,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip
              size="small"
              label={`${urgentOrders.length} ${t('dashboard.urgentRush', 'Urgent Rush')}`}
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                bgcolor: 'rgba(225, 29, 72, 0.12)',
                color: '#e11d48',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                height: 24,
                flexShrink: 0,
              }}
            />

            <Box
              ref={urgentScrollRef}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                overflowX: 'auto',
                py: 0.5,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                flex: 1,
              }}
            >
              {urgentOrders.map((order) => (
                <Button
                  key={order.id}
                  size="small"
                  onClick={() => navigate(`/order-details?id=${order.id}`)}
                  sx={{
                    flexShrink: 0,
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.4,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: BRAND_BLUE,
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: BRAND_BLUE }}>
                    {order.orderNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>ÔÇó</Typography>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.patientName}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#e11d48', fontSize: '0.68rem' }}>
                    {t('dashboard.due', 'Due')} {formatDate(order.dueDate)}
                  </Typography>
                </Button>
              ))}
            </Box>

            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              <IconButton size="small" onClick={() => scrollUrgent('left')} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}>
                <ChevronLeft size={13} />
              </IconButton>
              <IconButton size="small" onClick={() => scrollUrgent('right')} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}>
                <ChevronRight size={13} />
              </IconButton>
            </Stack>
          </Stack>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 1: EXECUTIVE ANALYTICS ENTERPRISE ANALYTICS & QUARTER TARGETS    */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <Stack spacing={3}>

          {/* Executive Analytics Sub-bar with Quarter Slicers */}
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    boxShadow: 1,
                  }}
                >EXEC</Box>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {t('dashboard.executiveTelemetry', 'Executive Telemetry')} ÔÇó {currentQData.name}
                    </Typography>
                    <Chip
                      size="small"
                      label="Live DirectQuery"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: 'rgba(5, 150, 105, 0.15)',
                        color: '#059669',
                      }}
                    />
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                    Dataset: [3DDX_Analytics].[ExecutiveTelemetry] ÔÇó Real-time Sync Active
                  </Typography>
                </Box>
              </Stack>

              {/* Quarter Slicers */}
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 1)',
                  border: '1px solid',
                  borderColor: 'divider',
                  alignSelf: { xs: 'flex-end', sm: 'center' },
                }}
              >
                {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                  <Button
                    key={q}
                    size="small"
                    onClick={() => {
                      setSelectedQuarter(q);
                      sound.playPop?.();
                    }}
                    sx={{
                      minWidth: 44,
                      px: 1.5,
                      py: 0.4,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      background: selectedQuarter === q
                        ? `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`
                        : 'transparent',
                      color: selectedQuarter === q ? '#ffffff' : 'text.secondary',
                      boxShadow: selectedQuarter === q ? 1 : 'none',
                      '&:hover': {
                        bgcolor: selectedQuarter === q ? undefined : 'action.hover',
                      },
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </Box>
            </Stack>
          </Card>

          {/* 4 Core KPI Tiles (Responsive CSS Grid via Box) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {/* KPI 1: Target Attainment */}
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedQuarter === 'ALL' ? 'FY2026 Target' : `${selectedQuarter} Target Attainment`}
                </Typography>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(2, 132, 199, 0.1)', color: BRAND_BLUE }}>
                  <Target size={18} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {currentQData.attainment}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center' }}>
                  <ArrowUpRight size={13} /> {currentQData.yoy} YoY
                </Typography>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, currentQData.percentNum)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`,
                    },
                  }}
                />
                <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    Actual: {currentQData.actualRev}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    Target: {currentQData.targetRev}
                  </Typography>
                </Stack>
              </Box>
            </Card>

            {/* KPI 2: Surgical Guides Quota */}
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Surgical Guides (SG)
                </Typography>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(234, 88, 12, 0.1)', color: BRAND_ORANGE }}>
                  <ClipboardList size={18} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {currentQData.sgUnits}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center' }}>
                  <ArrowUpRight size={13} /> {currentQData.sgPercent}%
                </Typography>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, currentQData.sgPercent)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': { bgcolor: BRAND_ORANGE },
                  }}
                />
                <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    Quota: {currentQData.sgQuota}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: currentQData.sgPercent >= 100 ? '#059669' : BRAND_ORANGE }}>
                    {currentQData.sgPercent >= 100 ? 'Quota Met' : 'In Progress'}
                  </Typography>
                </Stack>
              </Box>
            </Card>

            {/* KPI 3: Treatment Plans */}
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Co-Dx Plans (TP)
                </Typography>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(2, 132, 199, 0.1)', color: BRAND_BLUE }}>
                  <Activity size={18} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {currentQData.tpUnits}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center' }}>
                  <ArrowUpRight size={13} /> {currentQData.tpPercent}%
                </Typography>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, currentQData.tpPercent)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': { bgcolor: BRAND_BLUE },
                  }}
                />
                <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    Quota: {currentQData.tpQuota}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                    {currentQData.tpPercent >= 100 ? 'Target Met' : 'Active Batch'}
                  </Typography>
                </Stack>
              </Box>
            </Card>

            {/* KPI 4: Turnaround Velocity */}
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Avg. Turnaround Time
                </Typography>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(234, 88, 12, 0.1)', color: BRAND_ORANGE }}>
                  <Clock size={18} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {currentQData.turnaround}
                </Typography>
                <Chip
                  size="small"
                  label="Within SLA"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(5, 150, 105, 0.12)',
                    color: '#059669',
                  }}
                />
              </Stack>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={88}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`,
                    },
                  }}
                />
                <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    Target SLA: &lt; 2.5d
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    QC Pass: {currentQData.slaPass}
                  </Typography>
                </Stack>
              </Box>
            </Card>
          </Box>

          {/* Charts Row (Responsive CSS Grid: 2 cols on lg, 1 on xs) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
              gap: 3,
            }}
          >
            {/* Revenue Trend Chart */}
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp size={18} color={BRAND_BLUE} />
                    Quarter Target vs Actual Billed Revenue
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Co-Diagnostix CAD/CAM Production Trajectory ($ USD)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 0.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 1)',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setChartView('area')}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 0.3,
                      bgcolor: chartView === 'area' ? 'background.paper' : 'transparent',
                      color: chartView === 'area' ? BRAND_BLUE : 'text.secondary',
                      boxShadow: chartView === 'area' ? 1 : 'none',
                    }}
                  >
                    Smooth Area
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setChartView('bar')}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 0.3,
                      bgcolor: chartView === 'bar' ? 'background.paper' : 'transparent',
                      color: chartView === 'bar' ? BRAND_ORANGE : 'text.secondary',
                      boxShadow: chartView === 'bar' ? 1 : 'none',
                    }}
                  >
                    Target Bars
                  </Button>
                </Box>
              </Stack>

              <Box sx={{ height: 280, width: '100%' }}>
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} tickFormatter={(v) => `$${v / 1000}k`} />
                      <RechartsTooltip content={<BrandChartTooltip />} />
                      <Area type="monotone" dataKey="actualRevenue" name="Actual Revenue" stroke={BRAND_BLUE} strokeWidth={3} fill="url(#brandBlueGrad)" />
                      <Area type="monotone" dataKey="targetRevenue" name="Target Quota" stroke={BRAND_ORANGE} strokeWidth={2} strokeDasharray="4 4" fill="url(#brandOrangeGrad)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={currentQData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} tickFormatter={(v) => `$${v / 1000}k`} />
                      <RechartsTooltip content={<BrandChartTooltip />} />
                      <Bar dataKey="actualRevenue" name="Actual Revenue" fill={BRAND_BLUE} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="targetRevenue" name="Target Quota" fill={BRAND_ORANGE} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Box>

              <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: BRAND_BLUE }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Actual Revenue ($)
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: BRAND_ORANGE }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Quarter Target Quota ($)
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            {/* Service Line Share Matrix */}
            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PieChart size={18} color={BRAND_ORANGE} />
                  Service Line Share
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Production volume & yield by category
                </Typography>

                <Stack spacing={2} sx={{ mt: 2.5 }}>
                  {currentQData.distribution.map((item) => (
                    <Box
                      key={item.name}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.8)',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: item.color, fontFamily: 'monospace' }}>
                          {item.share}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={parseInt(item.share, 10)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: item.color },
                        }}
                      />
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                          {item.units} units fabricated
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.primary' }}>
                          {formatCurrency(item.revenue)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => navigate('/quarter-targets')}
                endIcon={<ChevronRight size={14} />}
                sx={{
                  mt: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  bgcolor: 'rgba(2, 132, 199, 0.08)',
                  borderColor: 'rgba(2, 132, 199, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(2, 132, 199, 0.15)',
                  },
                }}
              >
                {t('dashboard.openQuarterTargets', 'Open Full Quarter Targets Matrix')}
              </Button>
            </Card>
          </Box>

          {/* Regional Diagnostic Hubs Attainment Table */}
          <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Database size={18} color={BRAND_BLUE} />
                  {t('dashboard.regionalHubs', 'Regional Diagnostic Hubs Attainment')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Direct production quotas assigned to 3DDX Scan Centers
                </Typography>
              </Box>
              <Chip
                size="small"
                label="Active Hubs: 4"
                sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: 'rgba(2, 132, 199, 0.1)', color: BRAND_BLUE }}
              />
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>Diagnostic Hub</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>Lead Clinician</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>Quarter Target</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>Actual Achieved</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>Attainment %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentQData.regionalHubs.map((hub) => (
                    <TableRow key={hub.hub} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: 'text.primary' }}>
                        {hub.hub}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                        {hub.lead}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {formatCurrency(hub.target)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: BRAND_BLUE, fontSize: '0.78rem' }}>
                        {formatCurrency(hub.actual)}
                      </TableCell>
                      <TableCell sx={{ width: 180 }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(hub.percent, 100)}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: hub.percent >= 100 ? BRAND_ORANGE : BRAND_BLUE,
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                            {hub.percent}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={hub.percent >= 100 ? 'Target Exceeded' : 'On Track'}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            height: 20,
                            bgcolor: hub.percent >= 100 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                            color: hub.percent >= 100 ? '#059669' : BRAND_BLUE,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

        </Stack>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CAD TELEMETRY & PRODUCTION QUEUE                   */}
      {/* ========================================================= */}
      {activeTab === 'telemetry' && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 3,
          }}
        >
          {/* Left Column: Recent Intake Orders Table */}
          <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {t('dashboard.liveIntakeOrders', 'Live Intake Orders')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Cases queued across scan hubs
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => navigate('/flow')}
                endIcon={<ChevronRight size={14} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: BRAND_BLUE,
                }}
              >
                {t('dashboard.openFlowMatrix', 'Open Master Flow Matrix')}
              </Button>
            </Stack>

            {recentOrders.length === 0 ? (
              <EmptyState
                title="No Intake Orders Available"
                description="The production intake queue is currently clear across all diagnostic hubs."
              />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)' }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>{t('col.order', 'Order #')}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>{t('col.patientName', 'Patient')}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>{t('col.format', 'Service')}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>{t('action.status', 'Status')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary' }}>{t('col.updateTime', 'Updated')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((o) => (
                      <TableRow
                        key={o.id}
                        hover
                        onClick={() => navigate(`/order-details?id=${o.id}`)}
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: BRAND_BLUE, fontSize: '0.78rem' }}>
                          {o.orderNumber}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.patientName}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                          {o.restoration}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={o.status}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 20,
                              bgcolor: 'rgba(2, 132, 199, 0.1)',
                              color: BRAND_BLUE,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.72rem' }}>
                          {timeAgo(o.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>

          {/* Right Column: Workflow Activity Feed */}
          <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Bell size={18} color={BRAND_ORANGE} />
                {t('dashboard.pacsActivity', 'PACS Audit Activity')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Real-time doctor approvals & DICOM sync
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                {allNotifs.slice(0, 4).map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.8)',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" noWrap sx={{ fontWeight: 800, color: 'text.primary', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                        {timeAgo(item.createdAt)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/flow')}
              sx={{
                mt: 3,
                py: 1.1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`,
                color: '#ffffff',
                boxShadow: 2,
                '&:hover': {
                  background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`,
                  boxShadow: 3,
                },
              }}
            >
              {t('dashboard.inspectActiveCases', 'Inspect Active Cases')}
            </Button>
          </Card>
        </Box>
      )}

    </Box>
  );
}
