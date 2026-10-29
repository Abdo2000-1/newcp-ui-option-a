import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

const ROUTE_LABELS: Record<string, string> = {
  home: 'Home',
  flow: 'Active Cases',
  orders: 'Orders Queue',
  'add-case': 'Add New Case',
  'order-details': 'Order Details',
  'quarter-targets': 'Quarterly Targets',
  'task-47': '3D Model Production',
  'task-31': 'Staff Workload Targets',
  'edit-case': 'Edit Case',
  profile: 'Operator Profile',
  'config-manager': 'Configuration Manager',
  cms: 'CMS Controls',
  clinics: 'Clinics',
  doctors: 'Doctors Directory',
  patients: 'Patients Directory',
  billing: 'Billing & Invoices',
  reports: 'Reports Hub',
  settings: 'System Settings',
  'api-docs': 'API Documentation',
  swagger: 'API Documentation',
  'change-requests': 'Change Requests',
  'scan-center': 'Scan Center',
  'workflow-board': 'Workflow Board',
  documents: 'Documents Library',
  grid: 'Grid',
  forms: 'Forms',
  503: 'Service Maintenance',
  maintenance: 'Maintenance',
  404: 'Page Not Found',
};

function formatSegmentLabel(segment: string, t: (k: string, def?: string) => string): string {
  if (ROUTE_LABELS[segment]) {
    return t(`breadcrumb.${segment}`, ROUTE_LABELS[segment]);
  }

  // Handle order, case, or numeric IDs safely (avoid exposing PHI)
  if (/^\d+$/.test(segment)) {
    return `ID #${segment}`;
  }
  if (/^ord[-_]/i.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment)) {
    return segment.toUpperCase();
  }

  // Clean hyphenated strings into Title Case
  const cleaned = segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return t(`breadcrumb.${segment}`, cleaned);
}

export function GlobalBreadcrumbs() {
  const location = useLocation();
  const { t } = useLanguage();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Do not render breadcrumbs on login or empty root
  if (pathnames.length === 0 || pathnames[0] === 'login') {
    return null;
  }

  return (
    <Box
      component="nav"
      aria-label={t('breadcrumb.nav', 'Breadcrumb navigation')}
      data-testid="global-breadcrumbs"
      sx={{
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        py: 0.5,
      }}
    >
      <Breadcrumbs
        separator={<ChevronRight size={13} className="text-slate-400" />}
        aria-label="breadcrumb"
        sx={{
          fontSize: '0.8125rem',
          '& .MuiBreadcrumbs-separator': {
            mx: 0.75,
          },
        }}
      >
        {/* If the current page is /home, show Home as the current page */}
        {pathnames.length === 1 && pathnames[0] === 'home' ? (
          <Typography
            variant="body2"
            aria-current="page"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '0.8125rem',
            }}
          >
            <Home size={14} />
            <span>{t('breadcrumb.home', 'Home')}</span>
          </Typography>
        ) : (
          /* Root Home Link */
          <Link
            component={RouterLink}
            to="/home"
            underline="hover"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { color: '#0284c7' },
            }}
            aria-label={t('breadcrumb.toHome', 'Navigate to Home')}
          >
            <Home size={14} />
            <span>{t('breadcrumb.home', 'Home')}</span>
          </Link>
        )}

        {/* Dynamic Route Hierarchy Segments for non-home pages */}
        {pathnames[0] !== 'home' &&
          pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const label = formatSegmentLabel(value, t);

            if (last) {
              return (
                <Typography
                  key={to}
                  variant="body2"
                  aria-current="page"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}
                >
                  {label}
                </Typography>
              );
            }

            return (
              <Link
                key={to}
                component={RouterLink}
                to={to}
                underline="hover"
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  '&:hover': { color: '#0284c7' },
                }}
              >
                {label}
              </Link>
            );
          })}
      </Breadcrumbs>
    </Box>
  );
}

export default GlobalBreadcrumbs;
