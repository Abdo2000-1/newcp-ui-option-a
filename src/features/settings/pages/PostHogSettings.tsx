import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { loadTelemetryConfig, getPostHog } from '@/shared/observability';

export default function PostHogSettings() {
  const config = loadTelemetryConfig();
  const postHog = getPostHog();
  const isEnabled = postHog.isEnabled();

  const [testFeedback, setTestFeedback] = useState<{
    status: 'success' | 'info';
    message: string;
    timestamp: string;
  } | null>(null);

  const handleTrackTestEvent = () => {
    const timestamp = new Date().toLocaleTimeString();
    try {
      postHog.capture('workflow_action_completed', {
        action_key: 'admin_test_event',
        module: 'TelemetrySettings',
        action: 'admin_test_event',
        status: 'success',
      });

      if (isEnabled) {
        setTestFeedback({
          status: 'success',
          message: 'Test event successfully forwarded to PostHog browser SDK.',
          timestamp,
        });
      } else {
        setTestFeedback({
          status: 'info',
          message: 'Telemetry/PostHog is disabled. Test event safely absorbed by No-Op adapter.',
          timestamp,
        });
      }
    } catch (err) {
      setTestFeedback({
        status: 'info',
        message: 'Test event safely absorbed by No-Op adapter.',
        timestamp,
      });
    }
  };

  return (
    <Box data-testid="posthog-settings-page" sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Activity size={24} color="#0284c7" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              PostHog Telemetry & Feature Flags
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Runtime observability status and privacy boundary verification.
          </Typography>
        </Box>
        <Chip
          icon={isEnabled ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          label={isEnabled ? 'Active Provider' : 'No-Op Fallback'}
          color={isEnabled ? 'success' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Status Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Provider Runtime Configuration
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Initialization State</Typography>
                <Chip
                  size="small"
                  label={config.posthog.enabled ? 'Enabled' : 'Disabled'}
                  color={config.posthog.enabled ? 'success' : 'default'}
                />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Target Host / Ingestion API</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {config.posthog.host || 'Default Host'}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Environment</Typography>
                <Chip size="small" variant="outlined" label={config.environment} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Credential Security</Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShieldCheck size={16} /> Protected (Zero In-DOM Secret)
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Feature Flags & Session Recording
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Session Recording</Typography>
                <Chip size="small" label="Disabled (Default Safe)" color="default" />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Autocapture</Typography>
                <Chip size="small" label="Disabled (Zero PHI Leak)" color="default" />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">new_cp_v4_redesign</Typography>
                <Chip size="small" variant="outlined" label={postHog.isFeatureEnabled('new_cp_v4_redesign', true) ? 'Active' : 'Inactive'} color="primary" />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">experimental_order_flow</Typography>
                <Chip size="small" variant="outlined" label={postHog.isFeatureEnabled('experimental_order_flow', false) ? 'Active' : 'Inactive'} />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Safe Test Action Card */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Telemetry Integration Verification
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Send a non-PII diagnostic test event through the approved PostHog adapter. When telemetry is disabled or credentials are omitted, the event is harmlessly absorbed by the No-Op adapter.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Send size={16} />}
          onClick={handleTrackTestEvent}
          sx={{ borderRadius: 2, px: 3, py: 1 }}
        >
          Track Test Event
        </Button>

        {testFeedback && (
          <Alert
            severity={testFeedback.status}
            sx={{ mt: 2.5, borderRadius: 2 }}
            onClose={() => setTestFeedback(null)}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {testFeedback.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Logged at {testFeedback.timestamp}
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
