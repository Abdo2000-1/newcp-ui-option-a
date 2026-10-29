import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
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
  AlertTriangle,
  Globe,
} from 'lucide-react';

export type EndpointCategory = 'CANONICAL' | 'PROPOSED_DASHBOARD' | 'MOCK_ONLY' | 'UNAVAILABLE';

export interface EndpointSpec {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  summary: string;
  category: EndpointCategory;
  tag: string;
  notes?: string;
}

export const API_ENDPOINT_INVENTORY: EndpointSpec[] = [
  // Canonical Auth Endpoints (v0.9.8)
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Exchange Google ID token for application session or pending access',
    category: 'CANONICAL',
    tag: 'Authentication',
    notes: 'GIS ID token exchange. Returns AUTHORIZED with token or PENDING_ACCESS without token.',
  },
  {
    method: 'GET',
    path: '/api/v1/auth/me',
    summary: 'Retrieve authenticated user identity, tenant slug, roles, and capabilities',
    category: 'CANONICAL',
    tag: 'Authentication',
    notes: 'PostgreSQL V3 IAM authoritative context. Frontend does not infer role or tenant.',
  },
  {
    method: 'POST',
    path: '/api/v1/auth/logout',
    summary: 'Revoke active server-side session token',
    category: 'CANONICAL',
    tag: 'Authentication',
    notes: 'Server-side token invalidation and session cleanup.',
  },
  // Canonical Core & Domain Endpoints
  {
    method: 'GET',
    path: '/health',
    summary: 'Server liveness and readiness probe',
    category: 'CANONICAL',
    tag: 'Core',
    notes: 'Returns 200 OK and health telemetry when backend is live.',
  },
  {
    method: 'GET',
    path: '/api/v1/catalog/services',
    summary: 'Clinical service types & dynamic form schemas',
    category: 'CANONICAL',
    tag: 'Catalog',
    notes: 'Returns catalog metadata, forms schemas, and allowable service codes.',
  },
  {
    method: 'GET',
    path: '/api/v1/catalog/services/{serviceUuid}/form-schema',
    summary: 'Get dynamic form definition for a catalog service',
    category: 'CANONICAL',
    tag: 'Catalog',
    notes: 'Returns fields, validations, and conditional rules for dynamic service intake form.',
  },
  {
    method: 'GET',
    path: '/api/v1/orders/{orderUuid}/services',
    summary: 'List service items for an order',
    category: 'CANONICAL',
    tag: 'Services',
    notes: 'Returns all billable service instances under an order.',
  },
  {
    method: 'POST',
    path: '/api/v1/orders/{orderUuid}/services',
    summary: 'Create new billable service instance',
    category: 'CANONICAL',
    tag: 'Services',
    notes: 'Creates an independent service instance with assigned itemId and initial ETag.',
  },
  {
    method: 'GET',
    path: '/api/v1/services/{serviceItemUuid}',
    summary: 'Get single service instance with version ETag',
    category: 'CANONICAL',
    tag: 'Services',
    notes: 'Retrieves service instance with answers, financial lines, and current revision ETag.',
  },
  {
    method: 'PATCH',
    path: '/api/v1/services/{serviceItemUuid}',
    summary: 'ETag concurrency-safe service update',
    category: 'CANONICAL',
    tag: 'Services',
    notes: 'Requires If-Match header with matching ETag. Returns 412 on stale or 428 if missing.',
  },
  {
    method: 'GET',
    path: '/api/v1/services/{serviceItemUuid}/available-transitions',
    summary: 'List permitted workflow transitions for service item',
    category: 'CANONICAL',
    tag: 'Workflow',
    notes: 'Returns available transitions based on item status and user capabilities.',
  },
  {
    method: 'POST',
    path: '/api/v1/services/{serviceItemUuid}/transitions',
    summary: 'Execute state transition for service item',
    category: 'CANONICAL',
    tag: 'Workflow',
    notes: 'Executes atomic transition, supporting hold reasons when transitioning into on_hold.',
  },
  {
    method: 'GET',
    path: '/api/v1/services/{serviceItemUuid}/history',
    summary: 'Audit log of workflow transitions and events',
    category: 'CANONICAL',
    tag: 'Workflow',
    notes: 'Chronological timeline of state changes and clerk comments.',
  },
  {
    method: 'GET',
    path: '/api/v1/orders/{orderUuid}/eligible-billed-parties',
    summary: 'Read eligible billing parties (F07 doctor/clinic/scanning center)',
    category: 'CANONICAL',
    tag: 'Billing',
    notes: 'Payer assignment and eligible billed party choices for service items.',
  },
  {
    method: 'GET',
    path: '/api/v1/lookups/hold-reasons',
    summary: 'Standard clinical and administrative hold reasons',
    category: 'CANONICAL',
    tag: 'Lookups',
    notes: 'Lookup values for hold transitions.',
  },
  {
    method: 'GET',
    path: '/api/v1/lookups/zero-charge-reasons',
    summary: 'Mandatory zero-charge reasons when unit price is 0.00',
    category: 'CANONICAL',
    tag: 'Lookups',
    notes: 'Lookup codes required when unitPrice=0.00 to satisfy financial validation.',
  },
  {
    method: 'GET',
    path: '/api/v1/iam/users',
    summary: 'Tenant-scoped IAM employee identities',
    category: 'CANONICAL',
    tag: 'IAM',
    notes: 'List tenant employee identities for IAM administration (requires iam.users.read).',
  },
  {
    method: 'GET',
    path: '/api/v1/iam/roles',
    summary: 'Available IAM role codes and capabilities',
    category: 'CANONICAL',
    tag: 'IAM',
    notes: 'List roles and capabilities (requires iam.roles.read).',
  },
  // Proposed Orders Dashboard Endpoints (Draft Extension Only - NOT Integrated)
  {
    method: 'GET',
    path: '/api/v1/orders/dashboard-summary',
    summary: 'Proposed: Aggregated orders dashboard KPIs & family distributions',
    category: 'PROPOSED_DASHBOARD',
    tag: 'Orders Dashboard (Proposed)',
    notes: 'PROPOSED DRAFT ONLY (02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml). NOT INTEGRATED on frontend.',
  },
  {
    method: 'GET',
    path: '/api/v1/orders/dashboard-stream',
    summary: 'Proposed: Real-time Server-Sent Events (SSE) stream for order updates',
    category: 'PROPOSED_DASHBOARD',
    tag: 'Orders Dashboard (Proposed)',
    notes: 'PROPOSED DRAFT ONLY. Not implemented on backend; frontend uses synthetic data.',
  },
  // Mock Adapter Endpoints
  {
    method: 'GET',
    path: '/mock/orders',
    summary: 'Mock orders collection for UI/UX evaluation and demonstration',
    category: 'MOCK_ONLY',
    tag: 'Mock Adapter',
    notes: 'Active in offline / mock mode only. Never presented as live backend data.',
  },
  {
    method: 'GET',
    path: '/mock/services/templates',
    summary: 'Synthetic tooth-chart and clinical service templates',
    category: 'MOCK_ONLY',
    tag: 'Mock Adapter',
    notes: 'Local synthetic fixtures for teeth chart render tests.',
  },
  // Unavailable / Gap Endpoints
  {
    method: 'POST',
    path: '/api/v1/billing/batch-invoicing',
    summary: 'Batch enterprise invoicing export',
    category: 'UNAVAILABLE',
    tag: 'Billing Gap',
    notes: 'Backend contract gap. Currently blocked and not exposed in OpenAPI 3.0.3.',
  },
];

export default function ApiDocsPage() {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const configuredApiHost = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  const defaultApiHost = configuredApiHost || 'http://10.20.25.147:3001';

  const [swaggerHost, setSwaggerHost] = useState<string>(() => {
    if (configuredApiHost) return configuredApiHost;
    return localStorage.getItem('3ddx-swagger-host') || defaultApiHost;
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'offline'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'embed' | 'matrix'>('embed');
  const [selectedFilter, setSelectedFilter] = useState<EndpointCategory | 'ALL'>('ALL');
  const [_iframeError, setIframeError] = useState<boolean>(false);

  // Formulate backend docs and health URLs (strips any trailing /api/v1)
  const normalizedBase = swaggerHost.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
  const docsUrl = `${normalizedBase}/docs`;
  const healthUrl = `${normalizedBase}/health`;

  // Automatic liveness probe on mount or host change
  React.useEffect(() => {
    let isCancelled = false;
    setConnectionStatus('testing');
    setStatusMessage(`Pinging backend service at ${swaggerHost}...`);

    fetch(healthUrl, { method: 'GET', mode: 'cors' })
      .then((res) => {
        if (isCancelled) return;
        if (res.ok) {
          setConnectionStatus('connected');
          setStatusMessage('Live backend service verified and healthy.');
          setIframeError(false);
        } else {
          setConnectionStatus('offline');
          setStatusMessage(`Server responded with HTTP ${res.status}. Falling back to contract simulation.`);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setConnectionStatus('offline');
        setStatusMessage(`Host unreachable (${err?.message || 'Network error'}). Backend /docs is offline or blocked.`);
      });

    return () => {
      isCancelled = true;
    };
  }, [healthUrl, swaggerHost]);

  const handleSaveHost = () => {
    localStorage.setItem('3ddx-swagger-host', swaggerHost);
    setConnectionStatus('testing');
    setStatusMessage(`Pinging backend service at ${swaggerHost}...`);

    fetch(healthUrl, { method: 'GET', mode: 'cors' })
      .then((res) => {
        if (res.ok) {
          setConnectionStatus('connected');
          setStatusMessage('Live backend service verified and healthy.');
          setIframeError(false);
        } else {
          setConnectionStatus('offline');
          setStatusMessage(`Server responded with HTTP ${res.status}. Falling back to contract simulation.`);
        }
      })
      .catch((err) => {
        setConnectionStatus('offline');
        setStatusMessage(`Host unreachable (${err?.message || 'Network error'}). Backend /docs is offline or blocked.`);
      });
  };

  const handleOpenDocsNewTab = () => {
    window.open(docsUrl, '_blank', 'noopener,noreferrer');
  };

  const getCategoryChipConfig = (category: EndpointCategory) => {
    switch (category) {
      case 'CANONICAL':
        return { label: 'Canonical OpenAPI', color: '#10b981', bg: alpha('#10b981', 0.12) };
      case 'PROPOSED_DASHBOARD':
        return { label: 'Proposed Dashboard (Draft)', color: '#8b5cf6', bg: alpha('#8b5cf6', 0.12) };
      case 'MOCK_ONLY':
        return { label: 'Mock Adapter Only', color: '#f59e0b', bg: alpha('#f59e0b', 0.12) };
      case 'UNAVAILABLE':
        return { label: 'Unavailable / Blocked', color: '#ef4444', bg: alpha('#ef4444', 0.12) };
    }
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

  const filteredEndpoints = API_ENDPOINT_INVENTORY.filter((ep) => {
    if (selectedFilter === 'ALL') return true;
    return ep.category === selectedFilter;
  });

  return (
    <Box
      data-testid="api-docs-page"
      sx={{
        maxWidth: 1280,
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                bgcolor: isDark ? alpha('#0284c7', 0.2) : alpha('#0284c7', 0.1),
                color: '#0284c7',
              }}
            >
              <Code2 size={26} />
            </Box>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Swagger & OpenAPI Documentation Gateway
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Canonical OpenAPI 3.0.3 Contract Explorer & Live Backend /docs Gateway
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExternalLink size={16} />}
              onClick={handleOpenDocsNewTab}
              data-testid="direct-open-swagger-button"
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                borderColor: '#0284c7',
                color: '#0284c7',
              }}
            >
              Open Backend /docs in New Tab
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Authoritative Contract & Scope Alert */}
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
          Live backend documentation is served from <code>{docsUrl}</code>. Orders Dashboard API extension is proposed draft only.
        </Typography>
      </Alert>

      {/* Backend Host & Live Connection Configuration Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          bgcolor: isDark ? '#0b101d' : '#ffffff',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Server size={17} className="text-[#0284c7]" />
            Backend Swagger / OpenAPI Host IP Configuration
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Specify the live backend URL to embed the Swagger UI document and execute live endpoint probes.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              fullWidth
              label="Swagger IP / Host URL"
              value={swaggerHost}
              onChange={(e) => setSwaggerHost(e.target.value)}
              placeholder="http://localhost:3000 or http://192.168.1.100:3000"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleSaveHost}
              sx={{
                height: 40,
                px: 2.5,
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

          {/* Connection Status Indicator */}
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

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab
            value="embed"
            label="Live Swagger /docs Embed"
            icon={<Globe size={16} />}
            iconPosition="start"
            data-testid="tab-swagger-embed"
          />
          <Tab
            value="matrix"
            label="Contract Status & Endpoints Matrix"
            icon={<Layers size={16} />}
            iconPosition="start"
            data-testid="tab-contract-matrix"
          />
        </Tabs>
      </Box>

      {/* VIEW 1: LIVE SWAGGER EMBED */}
      {activeTab === 'embed' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="swagger-embed-view">
          {/* Iframe Fallback Notice Alert */}
          <Alert
            severity="warning"
            icon={<AlertTriangle size={18} />}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
              bgcolor: isDark ? alpha('#f59e0b', 0.08) : alpha('#f59e0b', 0.04),
            }}
            data-testid="iframe-fallback-alert"
          >
            <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Browser Frame Policy & CSP Fallback
            </AlertTitle>
            If the live Swagger UI below appears blank or is denied by your browser due to{' '}
            <code>X-Frame-Options: SAMEORIGIN</code> or <code>frame-ancestors</code> CSP restrictions, click{' '}
            <strong
              onClick={handleOpenDocsNewTab}
              style={{ color: '#0284c7', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Open Backend /docs in New Tab
            </strong>{' '}
            to inspect the interactive Swagger UI directly at <code>{docsUrl}</code>.
          </Alert>

          {/* Iframe Container */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? '#0b101d' : '#ffffff',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
                <Typography sx={{ ml: 1, fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                  {docsUrl}
                </Typography>
              </Box>

              <Button
                size="small"
                variant="text"
                startIcon={<ExternalLink size={14} />}
                onClick={handleOpenDocsNewTab}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Direct Open
              </Button>
            </Box>

            <Box sx={{ position: 'relative', width: '100%', minHeight: 650, bgcolor: isDark ? '#050811' : '#f8fafc' }}>
              <iframe
                data-testid="swagger-iframe"
                src={docsUrl}
                title="Backend Swagger Documentation"
                style={{
                  width: '100%',
                  height: 650,
                  border: 'none',
                  display: 'block',
                }}
                onError={() => setIframeError(true)}
              />
            </Box>
          </Card>
        </Box>
      )}

      {/* VIEW 2: CONTRACT STATUS & ENDPOINTS MATRIX */}
      {activeTab === 'matrix' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} data-testid="contract-matrix-view">
          {/* Filter Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', mr: 1 }}>
              Filter by Contract Status:
            </Typography>

            <Chip
              label="All Endpoints"
              data-testid="filter-chip-all"
              clickable
              color={selectedFilter === 'ALL' ? 'primary' : 'default'}
              variant={selectedFilter === 'ALL' ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setSelectedFilter('ALL')}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label="Canonical OpenAPI"
              data-testid="filter-chip-canonical"
              clickable
              color={selectedFilter === 'CANONICAL' ? 'success' : 'default'}
              variant={selectedFilter === 'CANONICAL' ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setSelectedFilter('CANONICAL')}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label="Proposed Dashboard"
              data-testid="filter-chip-proposed"
              clickable
              color={selectedFilter === 'PROPOSED_DASHBOARD' ? 'secondary' : 'default'}
              variant={selectedFilter === 'PROPOSED_DASHBOARD' ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setSelectedFilter('PROPOSED_DASHBOARD')}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label="Mock Adapter"
              data-testid="filter-chip-mock"
              clickable
              color={selectedFilter === 'MOCK_ONLY' ? 'warning' : 'default'}
              variant={selectedFilter === 'MOCK_ONLY' ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setSelectedFilter('MOCK_ONLY')}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label="Unavailable / Gaps"
              data-testid="filter-chip-unavailable"
              clickable
              color={selectedFilter === 'UNAVAILABLE' ? 'error' : 'default'}
              variant={selectedFilter === 'UNAVAILABLE' ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setSelectedFilter('UNAVAILABLE')}
              sx={{ fontWeight: 700 }}
            />
          </Box>

          {/* Endpoints List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredEndpoints.map((ep) => {
              const catConfig = getCategoryChipConfig(ep.category);

              return (
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
                  data-testid={`endpoint-card-${ep.method}-${ep.path}`}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {ep.summary}
                      </Typography>

                      <Chip
                        size="small"
                        label={catConfig.label}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          color: catConfig.color,
                          bgcolor: catConfig.bg,
                          height: 20,
                        }}
                      />
                    </Box>
                  </Box>

                  {ep.notes && (
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontStyle: 'italic' }}>
                        {ep.notes}
                      </Typography>
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
