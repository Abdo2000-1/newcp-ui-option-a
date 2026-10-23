import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import { RefreshCw, Terminal, ChevronDown, ChevronUp, ShieldAlert, WifiOff } from 'lucide-react';
import { Button } from './Button';
import { sound } from '@/shared/utils/sound';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  fullHeight?: boolean;
}

export function ErrorState({
  title,
  message,
  code = 'ERR_CAD_SYNC_503',
  onRetry,
  fullHeight = false
}: ErrorStateProps) {
  const { t } = useLanguage();
  const displayTitle = title ?? t('error.syncInterrupted', 'Service Synchronization Interrupted');
  const displayMessage = message ?? t('error.syncMessage', 'Unable to establish secure handshake with the Dental CAD PACS cloud server. Please verify your connection or retry.');
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = () => {
    sound.playPop();
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (onRetry) onRetry();
    }, 650);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
          userSelect: 'none',
          minHeight: fullHeight ? '420px' : 'auto',
          py: fullHeight ? 0 : 8,
        }}
      >
        {/* Icon with Rose Glow */}
        <Box sx={{ position: 'relative', mb: 2.5 }}>
          <Box
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              borderRadius: '24px',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(225, 29, 72, 0.15)' : '#fff1f2'),
              border: '1px solid',
              borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(225, 29, 72, 0.4)' : '#fecdd3'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48',
              boxShadow: '0 10px 15px -3px rgba(225, 29, 72, 0.1)',
            }}
          >
            <ShieldAlert style={{ width: 40, height: 40, strokeWidth: 1.8 }} />
          </Box>
        </Box>

        {/* Error Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            borderRadius: 9999,
            fontSize: '0.6875rem',
            fontFamily: 'monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(225, 29, 72, 0.2)' : '#ffe4e6'),
            color: (theme) => (theme.palette.mode === 'dark' ? '#fda4af' : '#be123c'),
            border: '1px solid',
            borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(225, 29, 72, 0.3)' : '#fecdd3'),
            mb: 1,
          }}
        >
          <WifiOff size={12} />
          <span>{code}</span>
        </Box>

        {/* Main Copy */}
        <Box sx={{ maxWidth: 440, mb: 3 }}>
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
            {displayTitle}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.6,
            }}
          >
            {displayMessage}
          </Typography>
        </Box>

        {/* Action Controls */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleRetry}
            loading={retrying}
            icon={<RefreshCw className="w-4 h-4" />}
            style={{ backgroundColor: '#e11d48' }}
          >
            Try Again
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              sound.playClick();
              setShowDetails(!showDetails);
            }}
            icon={showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          >
            Inspect Diagnostic Trace
          </Button>
        </Box>

        {/* Diagnostic Details Panel */}
        <Collapse in={showDetails} sx={{ width: '100%', maxWidth: 540, mt: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.6875rem',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#020617' : '#0f172a'),
              color: '#38bdf8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', mb: 1, pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Terminal size={14} />
              <span>DIAGNOSTIC NETWORK TRACE</span>
            </Box>
            <div>Target: https://pacs.3ddx.internal:9443/v1/cad/sync</div>
            <div>Timestamp: {new Date().toISOString()}</div>
            <div>Error: Handshake timeout after 4500ms (ERR_CONNECTION_TIMED_OUT)</div>
          </Box>
        </Collapse>
      </Box>
    </motion.div>
  );
}
