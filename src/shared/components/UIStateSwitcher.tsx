import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { Activity, Inbox, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sound } from '@/shared/utils/sound';

export type UIStateType = 'normal' | 'loading' | 'empty' | 'error';

interface UIStateSwitcherProps {
  state: UIStateType;
  onChange: (newState: UIStateType) => void;
  className?: string;
  label?: string;
}

export function UIStateSwitcher({
  state,
  onChange,
  className = '',
  label = 'Simulate View State'
}: UIStateSwitcherProps) {
  const options: { id: UIStateType; label: string; shortLabel: string; icon: React.ReactNode; activeBg: string; activeColor: string }[] = [
    {
      id: 'normal',
      label: 'Normal Live',
      shortLabel: 'Live',
      icon: <CheckCircle2 size={13} />,
      activeBg: '#059669',
      activeColor: '#ffffff',
    },
    {
      id: 'loading',
      label: 'Loading Status',
      shortLabel: 'Loading',
      icon: <Activity size={13} className="animate-pulse" />,
      activeBg: '#0284c7',
      activeColor: '#ffffff',
    },
    {
      id: 'empty',
      label: 'Empty Status',
      shortLabel: 'Empty',
      icon: <Inbox size={13} />,
      activeBg: '#9333ea',
      activeColor: '#ffffff',
    },
    {
      id: 'error',
      label: 'Error Status',
      shortLabel: 'Error',
      icon: <AlertTriangle size={13} />,
      activeBg: '#e11d48',
      activeColor: '#ffffff',
    },
  ];

  return (
    <Box
      className={className}
      sx={{
        display: 'inline-flex',
        maxWidth: '100%',
        alignItems: 'center',
        gap: 0.75,
        p: 0.5,
        borderRadius: '12px',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'),
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
        overflowX: 'auto',
      }}
    >
      {label && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.625rem',
            fontFamily: 'monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'text.secondary',
            px: 1,
            display: { xs: 'none', md: 'inline' },
            flexShrink: 0,
          }}
        >
          {label}:
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {options.map((opt) => {
          const isActive = state === opt.id;
          return (
            <ButtonBase
              key={opt.id}
              onClick={() => {
                sound.playClick();
                onChange(opt.id);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.5,
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 500,
                transition: 'all 0.15s ease-out',
                bgcolor: isActive ? opt.activeBg : 'transparent',
                color: isActive ? opt.activeColor : 'text.secondary',
                boxShadow: isActive ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none',
                '&:hover': {
                  bgcolor: isActive ? opt.activeBg : 'action.hover',
                  color: isActive ? opt.activeColor : 'text.primary',
                },
              }}
            >
              {opt.icon}
              <span>{opt.shortLabel}</span>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
