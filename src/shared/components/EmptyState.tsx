import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Inbox, Sparkles } from 'lucide-react';
import { sound } from '@/shared/utils/sound';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  suggestion?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  secondaryAction,
  suggestion 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 2,
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        {/* Visual Graphic with Illuminated Backdrop */}
        <Box sx={{ position: 'relative', mb: 2.5 }}>
          <Box
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              borderRadius: '24px',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9'),
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00706a',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {icon || <Inbox style={{ width: 40, height: 40, opacity: 0.8 }} />}
            <Box
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2,
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
            </Box>
          </Box>
        </Box>

        {/* Main Copy */}
        <Box sx={{ maxWidth: 440, mb: action || secondaryAction ? 3 : 0 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.01em',
              mb: 0.5,
              fontSize: '1.125rem',
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          )}
          {suggestion && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: '12px',
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.05)'),
                border: '1px solid rgba(2, 132, 199, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: '#0284c7', fontSize: '0.75rem' }}>
                💡 <strong>Tip:</strong> {suggestion}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        {(action || secondaryAction) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
            onClick={() => sound.playClick()}
          >
            {action}
            {secondaryAction}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
