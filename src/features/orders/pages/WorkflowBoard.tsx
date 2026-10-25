import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  Search,
  X,
  Filter,
  RotateCcw,
  Plus,
  Layers,
  GitBranch,
  CheckCircle2,
  Move,
  ArrowDown,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import type { OrderStatus, Priority, Order } from '@/shared/types';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { formatDate } from '@/shared/utils/format';
import { sound } from '@/shared/utils/sound';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { ErrorState } from '@/shared/components/ErrorState';

export interface StageDefinition {
  id: OrderStatus;
  label: string;
  color: string;
  dotColor: string;
}

export const STAGES: StageDefinition[] = [
  { id: 'New', label: 'New Intake', color: 'border-slate-400 bg-slate-500', dotColor: '#64748b' },
  { id: 'Review', label: 'Clinical Review', color: 'border-amber-400 bg-amber-500', dotColor: '#f59e0b' },
  { id: 'Design', label: 'CAD Design', color: 'border-purple-400 bg-purple-500', dotColor: '#a855f7' },
  { id: 'Production', label: 'Milling & Print', color: 'border-blue-400 bg-blue-500', dotColor: '#3b82f6' },
  { id: 'Quality Check', label: 'QC & Polish', color: 'border-pink-400 bg-pink-500', dotColor: '#ec4899' },
  { id: 'Ready', label: 'Ready / Dispatch', color: 'border-emerald-400 bg-emerald-500', dotColor: '#10b981' },
  { id: 'Completed', label: 'Delivered / Done', color: 'border-green-500 bg-green-600', dotColor: '#22c55e' }
];

export const PRIORITIES: Priority[] = ['Low', 'Normal', 'High', 'Urgent'];

export default function WorkflowBoard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === 'dark';

  const orders = useStore((s) => s.getOrders()) || [];

  // Filter States
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drag & Interaction States
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<OrderStatus | null>(null);

  // Status Change Handler
  const handleStageChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    store.updateOrderStatus(orderId, newStatus);
    const order = orders.find(o => o.id === orderId);
    setFeedback(`Case ${order?.orderNumber || orderId} moved to ${newStatus}`);
    sound.playSuccess();
    setTimeout(() => setFeedback(null), 2500);
  }, [orders]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(orderId);
    sound.playPop();
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedOrderId(null);
    setDragOverStage(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  }, [dragOverStage]);

  const handleDragLeave = useCallback((e: React.DragEvent, stageId: OrderStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  }, [dragOverStage]);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      handleStageChange(orderId, targetStatus);
    }
    setDraggedOrderId(null);
    setDragOverStage(null);
  }, [draggedOrderId, handleStageChange]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSelectedStage('all');
    setSelectedPriority('all');
    setSearchQuery('');
  }, []);

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter(order => {
      // Stage filter
      if (selectedStage !== 'all' && order.status !== selectedStage) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'all' && order.priority !== selectedPriority) {
        return false;
      }
      // Search term filter
      if (q) {
        const matchNum = order.orderNumber?.toLowerCase().includes(q);
        const matchPatient = order.patientName?.toLowerCase().includes(q);
        const matchDoctor = order.doctorName?.toLowerCase().includes(q);
        const matchClinic = order.clinicName?.toLowerCase().includes(q);
        const matchRestoration = order.restoration?.toLowerCase().includes(q);
        if (!matchNum && !matchPatient && !matchDoctor && !matchClinic && !matchRestoration) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedStage, selectedPriority, searchQuery]);

  const activeCount = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length;
  const hasActiveFilters = selectedStage !== 'all' || selectedPriority !== 'all' || searchQuery.trim().length > 0;

  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const surfaceBg = isDark ? alpha('#0f172a', 0.8) : '#ffffff';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
      {/* 1. Modernized Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          bgcolor: surfaceBg,
          border: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: isDark ? alpha('#38bdf8', 0.15) : alpha('#0284c7', 0.1),
                color: isDark ? '#38bdf8' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GitBranch size={20} />
            </Box>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              {t('workflow.title', 'Workflow Production Hub')}
            </Typography>
            <Chip
              label={`${activeCount} Active Cases`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.6875rem',
                fontWeight: 800,
                bgcolor: isDark ? alpha('#38bdf8', 0.15) : alpha('#0284c7', 0.1),
                color: isDark ? '#38bdf8' : '#0284c7',
                border: `1px solid ${isDark ? alpha('#38bdf8', 0.3) : alpha('#0284c7', 0.2)}`,
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 500,
            }}
          >
            Real-time stage tracking and case progression across digital engineering and manufacturing.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-start' }}>
          <Button
            component={Link}
            to="/flow"
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              borderColor: borderColor,
              color: isDark ? '#cbd5e1' : '#475569',
              '&:hover': {
                borderColor: isDark ? '#38bdf8' : '#0284c7',
                bgcolor: isDark ? alpha('#38bdf8', 0.08) : alpha('#0284c7', 0.04),
              },
            }}
          >
            Orders Flow
          </Button>

          <Button
            component={Link}
            to="/add-case"
            variant="contained"
            size="small"
            startIcon={<Plus size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.8125rem',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              bgcolor: isDark ? '#38bdf8' : '#0284c7',
              color: isDark ? '#0f172a' : '#ffffff',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              '&:hover': {
                bgcolor: isDark ? '#7dd3fc' : '#0369a1',
              },
            }}
          >
            New Case
          </Button>
        </Stack>
      </Paper>

      {/* Feedback Alert Banner */}
      {feedback && (
        <Alert
          icon={<CheckCircle2 size={18} />}
          severity="success"
          sx={{
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: '0.8125rem',
            border: `1px solid ${isDark ? alpha('#34d399', 0.3) : alpha('#10b981', 0.3)}`,
            bgcolor: isDark ? alpha('#064e3b', 0.5) : alpha('#d1fae5', 0.7),
            color: isDark ? '#6ee7b7' : '#065f46',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)',
          }}
        >
          {feedback}
        </Alert>
      )}

      {/* 2. Modern Filter & Search Controls Panel */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          bgcolor: surfaceBg,
          border: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Search, Priority Filter, and Reset Button */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5,
          }}
        >
          {/* Search Input */}
          <TextField
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case #, patient, doctor, clinic, restoration..."
            slotProps={{
              htmlInput: {
                'aria-label': 'Search workflow cases',
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                      sx={{ p: 0.5 }}
                    >
                      <X size={14} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.8125rem',
                bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
                '& fieldset': { borderColor: borderColor },
                '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#0284c7' },
              },
            }}
          />

          {/* Priority Select Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="workflow-priority-filter-label" sx={{ fontSize: '0.8125rem' }}>
              Priority
            </InputLabel>
            <Select
              labelId="workflow-priority-filter-label"
              id="workflow-priority-filter"
              value={selectedPriority}
              label="Priority"
              onChange={(e) => setSelectedPriority(e.target.value)}
              sx={{
                borderRadius: 2,
                fontSize: '0.8125rem',
                bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
                '& fieldset': { borderColor: borderColor },
              }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reset Filters Button */}
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            startIcon={<RotateCcw size={15} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              borderRadius: 2,
              px: 2,
              py: 0.85,
              borderColor: borderColor,
              color: isDark ? '#cbd5e1' : '#475569',
              '&:hover': {
                borderColor: isDark ? '#38bdf8' : '#0284c7',
                bgcolor: isDark ? alpha('#38bdf8', 0.08) : alpha('#0284c7', 0.04),
              },
            }}
          >
            Reset
          </Button>
        </Box>

        {/* Stage Selector Pills */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            pt: 1,
            borderTop: `1px solid ${borderColor}`,
          }}
          role="tablist"
          aria-label="Workflow Stages Filter"
        >
          {/* All Stages Pill */}
          <Button
            onClick={() => setSelectedStage('all')}
            role="tab"
            aria-selected={selectedStage === 'all'}
            aria-label={`All Stages (${orders.length} cases)`}
            sx={{
              borderRadius: 2,
              px: 1.75,
              py: 0.6,
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: selectedStage === 'all'
                ? (isDark ? '#38bdf8' : '#0284c7')
                : (isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.03)),
              color: selectedStage === 'all'
                ? (isDark ? '#0f172a' : '#ffffff')
                : (isDark ? '#cbd5e1' : '#475569'),
              border: `1px solid ${selectedStage === 'all' ? 'transparent' : borderColor}`,
              boxShadow: selectedStage === 'all' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
              '&:hover': {
                bgcolor: selectedStage === 'all'
                  ? (isDark ? '#7dd3fc' : '#0369a1')
                  : (isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06)),
              },
            }}
          >
            <span>All Stages</span>
            <Chip
              label={orders.length}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 900,
                bgcolor: selectedStage === 'all'
                  ? (isDark ? alpha('#0f172a', 0.25) : alpha('#ffffff', 0.25))
                  : (isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)),
                color: 'inherit',
                border: 'none',
              }}
            />
          </Button>

          {/* Individual Stage Pills */}
          {STAGES.map((stage) => {
            const count = orders.filter((o) => o.status === stage.id).length;
            const isSelected = selectedStage === stage.id;

            return (
              <Button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                role="tab"
                aria-selected={isSelected}
                aria-label={`${stage.label} (${count} cases)`}
                sx={{
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: isSelected
                    ? (isDark ? '#38bdf8' : '#0284c7')
                    : (isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.03)),
                  color: isSelected
                    ? (isDark ? '#0f172a' : '#ffffff')
                    : (isDark ? '#cbd5e1' : '#475569'),
                  border: `1px solid ${isSelected ? 'transparent' : borderColor}`,
                  boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                  '&:hover': {
                    bgcolor: isSelected
                      ? (isDark ? '#7dd3fc' : '#0369a1')
                      : (isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.06)),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isSelected ? (isDark ? '#0f172a' : '#ffffff') : stage.dotColor,
                  }}
                />
                <span>{stage.label}</span>
                <Chip
                  label={count}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    bgcolor: isSelected
                      ? (isDark ? alpha('#0f172a', 0.25) : alpha('#ffffff', 0.25))
                      : (isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)),
                    color: 'inherit',
                    border: 'none',
                  }}
                />
              </Button>
            );
          })}
        </Box>

        {/* Active Filters Summary Chips */}
        {hasActiveFilters && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              pt: 1.5,
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b' }}>
                Active Filters:
              </Typography>

              {selectedStage !== 'all' && (
                <Chip
                  label={`Stage: ${STAGES.find((s) => s.id === selectedStage)?.label || selectedStage}`}
                  size="small"
                  onDelete={() => setSelectedStage('all')}
                  sx={{
                    height: 24,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    bgcolor: isDark ? alpha('#38bdf8', 0.15) : alpha('#0284c7', 0.1),
                    color: isDark ? '#38bdf8' : '#0284c7',
                  }}
                />
              )}

              {selectedPriority !== 'all' && (
                <Chip
                  label={`Priority: ${selectedPriority}`}
                  size="small"
                  onDelete={() => setSelectedPriority('all')}
                  sx={{
                    height: 24,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    bgcolor: isDark ? alpha('#f59e0b', 0.15) : alpha('#d97706', 0.1),
                    color: isDark ? '#fbbf24' : '#d97706',
                  }}
                />
              )}

              {searchQuery.trim() && (
                <Chip
                  label={`Search: "${searchQuery.trim()}"`}
                  size="small"
                  onDelete={() => setSearchQuery('')}
                  sx={{
                    height: 24,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    bgcolor: isDark ? alpha('#a855f7', 0.15) : alpha('#7c3aed', 0.1),
                    color: isDark ? '#c084fc' : '#7c3aed',
                  }}
                />
              )}

              <Button
                size="small"
                onClick={handleResetFilters}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  p: 0.5,
                  minWidth: 'auto',
                  color: isDark ? '#38bdf8' : '#0284c7',
                }}
              >
                Clear all
              </Button>
            </Box>

            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
              Showing {filteredOrders.length} of {orders.length} cases
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Floating Drag Feedback Banner */}
      {draggedOrderId && (
        <Paper
          elevation={4}
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            bgcolor: '#06b6d4',
            color: '#082f49',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Move size={16} />
            <span>
              Moving Case: {orders.find((o) => o.id === draggedOrderId)?.orderNumber} •{' '}
              {orders.find((o) => o.id === draggedOrderId)?.patientName}
            </span>
          </Box>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, opacity: 0.85, display: { xs: 'none', sm: 'inline' } }}>
            Release mouse over destination column to reassign stage
          </Typography>
        </Paper>
      )}

      {/* 3. Empty State (No orders at all in store) */}
      {orders.length === 0 && (
        <EmptyState
          title="No workflow cases"
          description="There are currently no orders in the production workflow pipeline."
        />
      )}

      {/* 4. Filtered Empty State (Active filters returned 0 results) */}
      {orders.length > 0 && filteredOrders.length === 0 && (
        <EmptyState
          title="No matching workflow cases"
          description="No cases match your active filters. Try adjusting your search query, stage, or priority."
          action={
            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              startIcon={<RotateCcw size={15} />}
              sx={{
                mt: 1,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderColor: borderColor,
              }}
            >
              Reset all filters
            </Button>
          }
        />
      )}

      {/* 5. Mode 1: Specific Stage Filtered (Card Grid, 100% responsive) */}
      {filteredOrders.length > 0 && selectedStage !== 'all' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{STAGES.find((s) => s.id === selectedStage)?.label}</span>
              <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary' }}>
                ({filteredOrders.length} cases)
              </Typography>
            </Typography>
            <Button
              size="small"
              onClick={() => setSelectedStage('all')}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isDark ? '#38bdf8' : '#0284c7',
              }}
            >
              ← Back to All Stages
            </Button>
          </Box>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <PriorityBadge priority={order.priority} />
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    {order.patientName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {order.restoration} • {order.arch} ({order.units || 1}u)
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 truncate">
                    {order.doctorName} • {order.clinicName}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400">
                    <span>Due: {formatDate(order.dueDate)}</span>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Quick Move Stage Select */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 shrink-0">Stage:</span>
                    <select
                      value={order.status}
                      aria-label={`Change stage for case ${order.orderNumber}`}
                      onChange={(e) => handleStageChange(order.id, e.target.value as OrderStatus)}
                      className="w-full text-xs py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* 6. Mode 2: All Stages Responsive Multi-Section Grid */}
      {filteredOrders.length > 0 && selectedStage === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {STAGES.map((stage) => {
            const stageOrders = filteredOrders.filter((o) => o.status === stage.id);
            const isTargetColumn = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm border flex flex-col overflow-hidden transition-all duration-200 ${
                  isTargetColumn
                    ? 'border-cyan-500 ring-4 ring-cyan-500/20 bg-cyan-50/20 dark:bg-cyan-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Stage Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: stage.dotColor,
                      }}
                    />
                    <h2 className="font-bold text-sm text-gray-900 dark:text-white">{stage.label}</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {stageOrders.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 flex-1 min-h-[160px] max-h-[460px] overflow-y-auto custom-scrollbar relative">
                  {/* Dynamic Drop Zone Indicator */}
                  {isTargetColumn && draggedOrderId && (
                    <div className="p-3 rounded-xl border-2 border-dashed border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-2 text-xs font-bold animate-pulse shadow-inner">
                      <ArrowDown size={14} className="animate-bounce" />
                      <span>Drop Case into {stage.label}</span>
                    </div>
                  )}

                  {stageOrders.length === 0 && !isTargetColumn ? (
                    <div className="h-28 border-2 border-dashed border-gray-200 dark:border-gray-700/60 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      No cases in this stage
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const isBeingDragged = draggedOrderId === order.id;

                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onDragEnd={handleDragEnd}
                          className={`p-3.5 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? 'scale-[1.04] -rotate-1 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400 bg-white dark:bg-slate-800 border-cyan-400 opacity-95 z-30'
                              : 'bg-gray-50/80 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-800 border-gray-200/80 dark:border-gray-700/60 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <Link
                              to={`/orders/${order.id}`}
                              className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                            <PriorityBadge priority={order.priority} />
                          </div>

                          <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-0.5">{order.patientName}</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {order.restoration} • {order.arch} ({order.units || 1}u)
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/40 flex justify-between items-center text-[10px] text-gray-400">
                            <span className="truncate max-w-[120px]">{order.doctorName?.replace('Dr. ', '')}</span>

                            {/* Quick stage mover */}
                            <select
                              value={order.status}
                              aria-label={`Change stage for case ${order.orderNumber}`}
                              onChange={(e) => handleStageChange(order.id, e.target.value as OrderStatus)}
                              className="text-[10px] py-0.5 px-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>{s.id}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Box>
  );
}
