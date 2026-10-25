import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      data-testid="not-found-page"
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
            `1px solid ${theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(226, 232, 240, 0.9)'}`,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(11, 16, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
        }}
      >
        {/* Icon & Code Badge */}
        <Box sx={{ display: 'inline-flex', p: 2, borderRadius: 3, bgcolor: 'error.main', color: '#fff', mb: 2 }}>
          <FileQuestion size={36} />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3.5rem', sm: '4.5rem' },
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: 'primary.main',
            mb: 1,
          }}
        >
          404
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
          Clinical Route Not Found
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            maxWidth: 420,
            mx: 'auto',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          The requested clinical module, case view, or page path does not exist or has been relocated within the 3DDX platform.
        </Typography>

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
            variant="outlined"
            color="primary"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.25,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Go Back
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Home size={16} />}
            onClick={() => navigate('/dashboard')}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.25,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            }}
          >
            Return to Dashboard
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
          ERR_HTTP_404_PAGE_NOT_FOUND • 3DDX CP CLOUD
        </Typography>
      </Paper>
    </Box>
  );
}
