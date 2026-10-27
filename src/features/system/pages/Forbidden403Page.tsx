import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';

export default function Forbidden403Page() {
  const navigate = useNavigate();

  return (
    <Box
      data-testid="forbidden-403-page"
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
          maxWidth: 580,
          width: '100%',
          borderRadius: 4,
          border: (theme) =>
            `1px solid ${theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(11, 16, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ display: 'inline-flex', p: 2, borderRadius: 3, bgcolor: 'error.main', color: '#fff', mb: 2 }}>
          <ShieldAlert size={36} />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3.5rem', sm: '4.5rem' },
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: 'error.main',
            mb: 1,
          }}
        >
          403
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
          Administrative Access Required
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 440,
            mx: 'auto',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          You do not have the required administrative role or permissions to access this configuration module. Please contact your system administrator.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate(-1)}
            sx={{ minWidth: 160, py: 1.25, borderRadius: 2 }}
          >
            Go Back
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Home size={18} />}
            onClick={() => navigate('/home')}
            sx={{ minWidth: 160, py: 1.25, borderRadius: 2 }}
          >
            Return Home
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
