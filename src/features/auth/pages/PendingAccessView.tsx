import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { ShieldAlert, LogOut, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export default function PendingAccessView() {
  const { session, logout } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 540,
          width: '100%',
          p: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'warning.light',
            color: 'warning.dark',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
          }}
        >
          <ShieldAlert size={28} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>
          Pending Access Authorization
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          You have successfully authenticated via Google identity, but your account has not yet been assigned
          an authorized internal role or tenant membership in PostgreSQL V3 IAM.
        </Typography>

        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            bgcolor: 'action.hover',
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'left',
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: 13 }}>
              <Mail size={16} className="text-slate-500" />
              <span>
                Identity: <strong>{session?.email || 'Authenticated Employee'}</strong>
              </span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: 13 }}>
              <Lock size={16} className="text-amber-500" />
              <span>
                Access Status: <strong className="text-amber-600">403 ACCESS_NOT_ASSIGNED</strong>
              </span>
            </Box>
          </Stack>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
          Policy Notice (IAM-002 / IAM-005): Organizational email domains do not automatically grant tenant permissions.
          Please contact your 3DDX Tenant Administrator to provision an active CS, OPS, Finance, or Admin role.
        </Typography>

        <Button
          variant="contained"
          color="inherit"
          onClick={() => logout()}
          startIcon={<LogOut size={16} />}
          sx={{
            px: 3,
            py: 1.2,
            borderRadius: 2.5,
            fontWeight: 700,
            textTransform: 'none',
          }}
        >
          Sign Out of Current Identity
        </Button>
      </Paper>
    </Box>
  );
}
