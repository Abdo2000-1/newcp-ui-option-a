import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import {
  Activity,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  Settings,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/features/auth';

interface QuickActionTile {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  tag: string;
}

export default function HomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { session } = useAuth();

  const isDark = theme.palette.mode === 'dark';

  const actionTiles: QuickActionTile[] = [
    {
      title: 'Active Case Flow',
      description: 'Review clinical orders, track statuses, and manage prescription pipelines.',
      path: '/flow',
      icon: <Activity className="w-5 h-5 text-[#0284c7]" />,
      tag: 'Core Queue',
    },
    {
      title: 'Add New Case',
      description: 'Submit anatomical prescriptions, upload scan records, and configure CAD models.',
      path: '/add-case',
      icon: <PlusCircle className="w-5 h-5 text-emerald-500" />,
      tag: 'Prescriptions',
    },
    {
      title: 'Order Details',
      description: 'Inspect clinical order items, service lines, and technical specifications.',
      path: '/order-details?id=504901',
      icon: <FileText className="w-5 h-5 text-purple-500" />,
      tag: 'Specifications',
    },
    {
      title: 'Quarterly Targets',
      description: 'Monitor clinical delivery performance, SLA completion, and output goals.',
      path: '/quarter-targets',
      icon: <FileSpreadsheet className="w-5 h-5 text-indigo-500" />,
      tag: 'Reporting',
    },
    {
      title: '3D Model Production',
      description: 'Inspect Task 47 3D laboratory printing, milling, and arch fabrication queues.',
      path: '/task-47',
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      tag: '3D Lab',
    },
    {
      title: 'Operator Profile & Preferences',
      description: 'Configure display preferences, local workstation presets, and account details.',
      path: '/profile',
      icon: <Settings className="w-5 h-5 text-slate-400" />,
      tag: 'Preferences',
    },
  ];

  return (
    <Box
      data-testid="home-page"
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 },
      }}
    >
      {/* Brand Header with 3D Diagnostix Logo */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}logo-3ddx-full.png`}
            alt="3D Diagnostix Logo"
            sx={{
              height: { xs: 36, sm: 44 },
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ShieldCheck size={16} className="text-[#0284c7]" />
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              letterSpacing: 1.2,
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            3D Diagnostix Clinical Portal
          </Typography>
        </Box>

        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 1,
            letterSpacing: '-0.02em',
          }}
        >
          Welcome{session?.fullName ? `, ${session.fullName}` : ''}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 680,
            lineHeight: 1.6,
          }}
        >
          Access verified clinical case pipelines, digital surgical prescriptions, and laboratory workflows in a centralized workspace.
        </Typography>
      </Box>

      {/* Workspace Quick Action Cards */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.1,
            color: 'text.secondary',
            mb: 2,
            fontSize: '0.75rem',
          }}
        >
          Approved Application Workspaces
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {actionTiles.map((tile) => (
          <Card
            key={tile.path}
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              backgroundColor: isDark ? '#0b101d' : '#ffffff',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                borderColor: '#0284c7',
                boxShadow: isDark
                  ? '0 8px 24px -4px rgba(2, 132, 199, 0.2)'
                  : '0 8px 24px -4px rgba(2, 132, 199, 0.12)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardActionArea
              onClick={() => navigate(tile.path)}
              aria-label={`Navigate to ${tile.title}`}
              sx={{
                height: '100%',
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <CardContent sx={{ p: 0, width: '100%', flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2.5,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {tile.icon}
                  </Box>
                  <Chip
                    size="small"
                    label={tile.tag}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      height: 22,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}
                  />
                </Box>

                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'text.primary',
                    mb: 0.75,
                  }}
                >
                  {tile.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                >
                  {tile.description}
                </Typography>
              </CardContent>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 2,
                  color: '#0284c7',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                  Open Workspace
                </Typography>
                <ArrowRight size={13} />
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
