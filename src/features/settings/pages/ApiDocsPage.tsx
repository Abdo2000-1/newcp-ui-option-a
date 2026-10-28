import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  Code2,
  Server,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EndpointSpec {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  status: 'READY' | 'MOCK_ADAPTER' | 'BLOCKED';
  tag: string;
}

const APPROVED_ENDPOINTS: EndpointSpec[] = [
  { method: 'GET', path: '/health', summary: 'Server liveness and readiness probe', status: 'READY', tag: 'Core' },
  { method: 'GET', path: '/api/v1/session/context', summary: 'Validated active session and tenant context', status: 'READY', tag: 'IAM' },
  { method: 'GET', path: '/api/v1/catalog/services', summary: 'Clinical service types & dynamic form schemas', status: 'READY', tag: 'Catalog' },
  { method: 'POST', path: '/api/v1/orders/{orderId}/services', summary: 'Create new billable service instance', status: 'READY', tag: 'Services' },
  { method: 'PATCH', path: '/api/v1/orders/{orderId}/services/{itemId}', summary: 'ETag concurrency-safe service update', status: 'READY', tag: 'Services' },
  { method: 'POST', path: '/api/v1/orders/{orderId}/services/{itemId}/hold', summary: 'Transition service line into or out of hold', status: 'READY', tag: 'Workflow' },
  { method: 'GET', path: '/api/v1/orders/{orderId}/services/{itemId}/pricing', summary: 'Retrieve item pricing & billability verdict', status: 'READY', tag: 'Pricing' },
  { method: 'GET', path: '/api/v1/orders/{orderId}/payer', summary: 'Read billing party and payer selection boundary', status: 'READY', tag: 'Billing' },
];

export default function ApiDocsPage() {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const defaultApiHost = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [swaggerHost, setSwaggerHost] = useState<string>(() => {
    return localStorage.getItem('3ddx-swagger-host') || defaultApiHost;
  });
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'offline'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSaveHost = () => {
    localStorage.setItem('3ddx-swagger-host', swaggerHost);
    setConnectionStatus('testing');
    setStatusMessage('Pinging server at ' + swaggerHost + '...');

    fetch(`${swaggerHost}/health`, { method: 'GET', mode: 'cors' })
      .then((res) => {
        if (res.ok) {
          setConnectionStatus('connected');
          setStatusMessage('Live backend service verified and healthy.');
        } else {
          setConnectionStatus('offline');
          setStatusMessage(`Server responded with HTTP ${res.status}. Falling back to contract simulation.`);
        }
      })
      .catch((err) => {
        setConnectionStatus('offline');
        setStatusMessage(`Host unreachable (${err?.message || 'Network error'}). Client fallback enabled.`);
      });
  };

  const getMethodChipColor = (method: string) => {
    switch (method) {
      case 'GET':
        return '#0284c7';
      case 'POST':
        return '#10b981';
      case 'PATCH':
        return '#f59e0b';
      case 'DELETE':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <Box
      data-testid="api-docs-page"
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1),
              color: '#0284c7',
            }}
          >
            <Code2 size={24} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Swagger & OpenAPI Documentation Gateway
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Canonical OpenAPI 3.0.3 Contract Explorer & Live IP/Host Configuration
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Contract Notice Alert */}
      <Alert
        severity="info"
        icon={<Terminal size={18} />}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.2)'}`,
          bgcolor: isDark ? alpha('#0284c7', 0.08) : alpha('#0284c7', 0.04),
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Authoritative Specification: OpenAPI 3.0.3
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
          Canonical contract specification is located at <code>docs/newcp-ai/references/api/newcp.openapi.yaml</code>.
          This view provides IP configuration for the live backend Swagger server.
        </Typography>
      </Alert>

      {/* Live Server Host / IP Configuration Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          bgcolor: isDark ? '#0b101d' : '#ffffff',
          mb: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Server size={18} className="text-[#0284c7]" />
            Backend Swagger / OpenAPI Host IP Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
            Specify the real Swagger server IP or hostname to connect live API inspection tools to the backend service.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              fullWidth
              label="Swagger IP / Host URL"
              value={swaggerHost}
              onChange={(e) => setSwaggerHost(e.target.value)}
              placeholder="http://192.168.1.100:3000 or http://localhost:3000"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleSaveHost}
              sx={{
                height: 40,
                px: 3,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 'none',
                bgcolor: '#0284c7',
                '&:hover': { bgcolor: '#0369a1' },
                whiteSpace: 'nowrap',
              }}
            >
              Verify & Save IP
            </Button>
          </Box>

          {connectionStatus !== 'idle' && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {connectionStatus === 'connected' ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : connectionStatus === 'testing' ? (
                <Activity size={16} className="text-sky-500 animate-spin" />
              ) : (
                <ShieldAlert size={16} className="text-amber-500" />
              )}
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {statusMessage}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Approved API Contract Endpoints */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', mb: 2 }}>
        Approved OpenAPI 3.0.3 Contract Endpoints
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {APPROVED_ENDPOINTS.map((ep) => (
          <Card
            key={`${ep.method}-${ep.path}`}
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              bgcolor: isDark ? '#0b101d' : '#ffffff',
              transition: 'border-color 0.15s ease',
              '&:hover': {
                borderColor: '#0284c7',
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={ep.method}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    color: '#ffffff',
                    bgcolor: getMethodChipColor(ep.method),
                    height: 22,
                    minWidth: 54,
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: 'text.primary',
                  }}
                >
                  {ep.path}
                </Typography>
                <Chip
                  size="small"
                  label={ep.tag}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {ep.summary}
                </Typography>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
