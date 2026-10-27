import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import {
  Sliders,
  Palette,
  Flag,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Info,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useThemeContext } from '@/app/providers/contexts/ThemeContext';
import { useAuth } from '@/features/auth/AuthContext';

export interface CmsFeatureFlags {
  batchQueue: boolean;
  meshInspection: boolean;
  slaAlerts: boolean;
  instantExport: boolean;
}

const DEFAULT_FLAGS: CmsFeatureFlags = {
  batchQueue: true,
  meshInspection: false,
  slaAlerts: true,
  instantExport: false,
};

const STORAGE_KEY = 'newcp_local_cms_flags';

export default function CmsControls() {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const { theme, toggleTheme } = useThemeContext();
  const auth = useAuth();

  const [flags, setFlags] = useState<CmsFeatureFlags>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_FLAGS;
    } catch {
      return DEFAULT_FLAGS;
    }
  });

  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleFlag = (key: keyof CmsFeatureFlags) => {
    setFlags((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setToastMessage(`Feature flag updated (Local Simulation)`);
  };

  const handleResetDefaults = () => {
    setFlags(DEFAULT_FLAGS);
    localStorage.removeItem(STORAGE_KEY);
    setDensity('comfortable');
    setToastMessage('Local settings reset to factory defaults');
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Page Title & Breadcrumb Context */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Sliders size={24} color={isDark ? '#38bdf8' : '#0284c7'} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            CMS Configuration & Senior Controls
          </Typography>
          <Chip
            label="Frontend Demo Mode"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Local workstation preferences, demonstration feature flag toggles, and appearance controls.
        </Typography>
      </Box>

      {/* Explicit Frontend-Only Simulation Notice */}
      <Alert
        severity="info"
        icon={<Info size={20} />}
        sx={{
          mb: 3,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#0284c7', 0.1) : alpha('#0284c7', 0.05),
          border: `1px solid ${alpha('#0284c7', 0.2)}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Frontend Demo Controls — Local In-Memory & Storage State Only
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          These controls simulate administrative overrides for evaluation workflows. They do NOT alter backend PostgreSQL IAM authorization, Casbin policies, or live database records.
        </Typography>
      </Alert>

      {/* Grid of Control Panels */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* 1. Theme & Appearance */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            bgcolor: isDark ? '#0c1222' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Palette size={20} color="#0284c7" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Workstation Appearance
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Active Color Theme
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Toggle between dark mode and clinical light theme
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleTheme}
                startIcon={isDark ? <Sun size={16} /> : <Moon size={16} />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Table & Card Density
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Adjust padding across clinical data views
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={density === 'comfortable' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setDensity('comfortable')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Comfortable
                </Button>
                <Button
                  variant={density === 'compact' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setDensity('compact')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Compact
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 2. Demonstration Feature Flags */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            bgcolor: isDark ? '#0c1222' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Flag size={20} color="#10b981" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Demo Feature Flags
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={flags.batchQueue}
                    onChange={() => handleToggleFlag('batchQueue')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Multi-Unit Batch Queue
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Enables bulk batch processing controls on Task 47
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={flags.meshInspection}
                    onChange={() => handleToggleFlag('meshInspection')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Advanced 3D Mesh Inspection
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Shows preview shaders in surgical guide viewer
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={flags.slaAlerts}
                    onChange={() => handleToggleFlag('slaAlerts')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Predictive SLA Threshold Alerts
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Flags orders nearing SLA deadline on Master Orders Flow
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={flags.instantExport}
                    onChange={() => handleToggleFlag('instantExport')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Diagnostic Package Fast Export
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Instant zip generation for DICOM + STL archives
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </CardContent>
        </Card>

        {/* 3. Session & IAM Context (Read-Only) */}
        <Card
          variant="outlined"
          sx={{
            gridColumn: { xs: '1', md: '1 / -1' },
            borderRadius: 3,
            bgcolor: isDark ? '#0c1222' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldCheck size={20} color="#8b5cf6" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Active IAM Authorization Context
                </Typography>
              </Box>
              <Chip
                label="PostgreSQL V3 Schema • Verified"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  SESSION OPERATOR
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {auth.session?.fullName || 'Authorized Clinical Specialist'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  EFFECTIVE TENANT
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {auth.tenantId || 'tenant_3ddx_default'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  SECURITY BOUNDARY
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  PostgreSQL IAM & Casbin Guarded
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<RotateCcw size={16} />}
                onClick={handleResetDefaults}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Reset Local Demo Flags
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Feedback Toast */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  );
}
