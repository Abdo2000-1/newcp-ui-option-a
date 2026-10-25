import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { Wrench, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function Maintenance503Page() {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <Box
      data-testid="maintenance-503-page"
      sx={{
        py: { xs: 6, sm: 10 },
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        textAlign: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          maxWidth: 620,
          width: '100%',
          borderRadius: 4,
          border: (theme) =>
            `1px solid ${theme.palette.mode === 'dark' ? 'rgba(234, 88, 12, 0.25)' : 'rgba(253, 186, 116, 0.6)'}`,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 40px -15px rgba(234, 88, 12, 0.08)',
        }}
      >
        {/* Maintenance Icon */}
        <Box
          sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: 3,
            bgcolor: 'warning.main',
            color: '#fff',
            mb: 2,
            boxShadow: '0 8px 20px -6px rgba(245, 158, 11, 0.4)',
          }}
        >
          <Wrench size={36} />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3.5rem', sm: '4.5rem' },
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: 'warning.main',
            mb: 1,
          }}
        >
          503
        </Typography>

        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 1.5,
          }}
        >
          Scheduled Service Maintenance
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            maxWidth: 460,
            mx: 'auto',
            mb: 3,
            lineHeight: 1.6,
          }}
        >
          The 3DDX Clinical Platform and PACS CAD/CAM processing engine are temporarily undergoing scheduled maintenance or database synchronization. Normal service will resume shortly.
        </Typography>

        {/* Prototype Mock Boundary Banner */}
        <Alert
          severity="info"
          icon={<ShieldAlert size={18} />}
          sx={{
            mb: 4,
            textAlign: 'left',
            borderRadius: 2.5,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          [PROTOTYPE MOCK / NOT_INTEGRATED] Dedicated maintenance view demonstration. No real server outage or system downtime detected on local node.
        </Alert>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            color="warning"
            disabled={isRetrying}
            startIcon={<RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />}
            onClick={handleRetry}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.25,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            }}
          >
            {isRetrying ? 'Verifying Services...' : 'Retry Connection'}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<Home size={16} />}
            onClick={() => navigate('/dashboard')}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.25,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Go to Dashboard
          </Button>
        </Stack>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 4,
            color: 'text.disabled',
            fontFamily: 'monospace',
            fontSize: '0.6875rem',
          }}
        >
          STATUS_SERVICE_UNAVAILABLE_503 • ESTIMATED RESTORATION &lt; 15m
        </Typography>
      </Paper>
    </Box>
  );
}
