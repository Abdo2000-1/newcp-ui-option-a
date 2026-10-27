import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Info,
  Package,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { timeAgo } from '@/shared/utils/format';
import type { Notification } from '@/shared/types';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  onNavigateOrder?: (orderId: string) => void;
}

export function NotificationCenter({
  open,
  onClose,
  onNavigateOrder,
}: NotificationCenterProps) {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'orders' | 'system'>('all');
  const notifications = useStore((s) => s.getNotifications());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'orders') return n.type === 'order' || Boolean(n.relatedId);
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const handleMarkAllRead = () => {
    store.markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    // Clear notifications locally in store
    notifications.forEach((n) => store.markNotificationAsRead(n.id));
  };

  const handleCreateMockFixture = () => {
    store.createNotification({
      title: 'Urgent SLA Alert (Simulated)',
      message: 'Case #504901 is approaching the 4-hour Co-DiagnostiX review SLA threshold.',
      type: 'order',
      relatedId: '504901',
    });
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'order':
        return <Package size={16} color="#0284c7" />;
      case 'warning':
      case 'urgent':
        return <AlertTriangle size={16} color="#f59e0b" />;
      default:
        return <Info size={16} color="#10b981" />;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 420 },
            maxWidth: '100vw',
            bgcolor: isDark ? '#0c1222' : '#ffffff',
            color: 'text.primary',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.15)',
          },
        },
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Badge badgeContent={unreadCount} color="error">
              <Bell size={22} color={isDark ? '#38bdf8' : '#0284c7'} />
            </Badge>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Notification Center
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close notification center">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Frontend Demo Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 0.75,
            mb: 2,
            borderRadius: 2,
            bgcolor: isDark ? alpha('#0284c7', 0.1) : alpha('#0284c7', 0.06),
            border: `1px solid ${alpha('#0284c7', 0.15)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles size={14} color="#0284c7" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7' }}>
              Frontend In-Memory Simulation
            </Typography>
          </Box>
          <Button
            size="small"
            variant="text"
            startIcon={<PlusCircle size={14} />}
            onClick={handleCreateMockFixture}
            sx={{ fontSize: '0.7rem', textTransform: 'none', p: 0.5, minWidth: 0 }}
          >
            + Add Mock
          </Button>
        </Box>

        {/* Filter Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            mb: 2,
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              py: 0.5,
            },
          }}
        >
          <Tab value="all" label={`All (${notifications.length})`} />
          <Tab value="unread" label={`Unread (${unreadCount})`} />
          <Tab value="orders" label="Orders" />
          <Tab value="system" label="System" />
        </Tabs>

        {/* Batch Actions Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, mb: 1, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {filteredNotifications.length} alerts showing
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                variant="text"
                startIcon={<CheckCheck size={14} />}
                onClick={handleMarkAllRead}
                sx={{ fontSize: '0.7rem', textTransform: 'none', p: 0.5 }}
              >
                Mark all read
              </Button>
            )}
            <Button
              size="small"
              variant="text"
              color="error"
              startIcon={<Trash2 size={14} />}
              onClick={handleClearAll}
              sx={{ fontSize: '0.7rem', textTransform: 'none', p: 0.5 }}
            >
              Clear unread
            </Button>
          </Box>
        </Box>

        {/* Notification Cards List */}
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8, color: 'text.secondary' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                No notifications to display
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', mt: 0.5, maxWidth: 220 }}>
                You are all caught up with your clinical alerts.
              </Typography>
            </Box>
          ) : (
            filteredNotifications.map((n) => (
              <Box
                key={n.id}
                onClick={() => {
                  store.markNotificationAsRead(n.id);
                  if (n.relatedId && onNavigateOrder) {
                    onNavigateOrder(n.relatedId);
                    onClose();
                  }
                }}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  border: `1px solid ${!n.read ? alpha('#0284c7', 0.3) : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  bgcolor: !n.read
                    ? isDark
                      ? alpha('#0284c7', 0.12)
                      : alpha('#0284c7', 0.05)
                    : isDark
                    ? alpha('#ffffff', 0.02)
                    : '#ffffff',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#0284c7', 0.08),
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                  <Box sx={{ mt: 0.5 }}>{getIconForType(n.type)}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: !n.read ? 800 : 600,
                          color: !n.read ? (isDark ? '#e0f2fe' : '#0f172a') : 'text.primary',
                        }}
                      >
                        {n.title}
                      </Typography>
                      {!n.read && (
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: '#0284c7',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ fontSize: '0.725rem', color: 'text.secondary', lineHeight: 1.4 }}>
                      {n.message}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                      <Clock size={11} color="#94a3b8" />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        {timeAgo(n.createdAt)}
                      </Typography>
                      {n.relatedId && (
                        <Chip
                          label={`Case #${n.relatedId}`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
