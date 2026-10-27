import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ChevronRight, Home } from 'lucide-react';

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
  dashboard: 'Dashboard',
  profile: 'Operator Profile',
  'config-manager': 'Configuration Manager',
  cms: 'CMS Controls',
  cases: 'Cases Archive',
  clinics: 'Clinics',
  doctors: 'Doctors Directory',
  patients: 'Patients Directory',
  billing: 'Billing & Invoices',
  reports: 'Reports Hub',
  settings: 'System Settings',
  notifications: 'Notifications',
  'change-requests': 'Change Requests',
  'scan-center': 'Scan Center',
  'workflow-board': 'Workflow Board',
  documents: 'Documents Library',
  503: 'Service Maintenance',
  maintenance: 'Maintenance',
  404: 'Page Not Found',
};

function formatSegmentLabel(segment: string): string {
  if (ROUTE_LABELS[segment]) {
    return ROUTE_LABELS[segment];
  }

  // Handle order, case, or numeric IDs safely (avoid exposing PHI)
  if (/^\d+$/.test(segment)) {
    return `ID #${segment}`;
  }
  if (/^ord[-_]/i.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment)) {
    return segment.toUpperCase();
  }

  // Clean hyphenated strings into Title Case
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function GlobalBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Do not render breadcrumbs on login or root redirect
  if (pathnames.length === 0 || pathnames[0] === 'login') {
    return null;
  }

  return (
    <Box
      component="nav"
      aria-label="Breadcrumb navigation"
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
        {/* Root Home Link */}
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
          aria-label="Navigate to Home"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>

        {/* Dynamic Route Hierarchy Segments */}
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = formatSegmentLabel(value);

          // If current pathname is just 'home', don't repeat 'Home > Home'
          if (value === 'home' && index === 0) {
            return null;
          }

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
