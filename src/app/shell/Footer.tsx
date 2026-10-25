import React from 'react';
import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import { useAppConfig } from '@/app/providers/contexts/ConfigContext';
import type { NavPosition } from './ConvertibleNav';

export interface FooterProps {
  navPosition?: NavPosition;
}

export function Footer({ navPosition = 'top' }: FooterProps) {
  const { config } = useAppConfig();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      data-testid="shell-footer"
      className="w-full relative z-10 select-none mt-auto transition-colors duration-200"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(10, 27, 50, 0.92)' : 'rgba(240, 248, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: (theme) =>
          `1px solid ${theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(186, 230, 253, 0.8)'}`,
        py: { xs: 2, sm: 2.5 },
        px: { xs: 2, sm: 3, md: 4 },
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
    >
      <Box
        sx={{
          maxWidth: 1920,
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Brand / Logo Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NavLink
            to="/dashboard"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="3D Diagnostix Cloud ERP"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                fontWeight: 900,
                fontSize: '0.875rem',
                letterSpacing: '-0.02em',
              }}
            >
              <Typography
                component="span"
                sx={{ fontWeight: 900, fontSize: '1rem', color: 'primary.main' }}
              >
                3D
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: (theme) => (theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300'),
                  fontWeight: 300,
                }}
              >
                |
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontWeight: 800,
                  color: (theme) => (theme.palette.mode === 'dark' ? 'grey.100' : 'grey.800'),
                }}
              >
                Diagnostix
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.625rem',
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                .COM
              </Typography>
            </Box>
          </NavLink>
        </Box>

        {/* Center: Legal & Help Links + Copyright */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: { xs: 2, sm: 3 },
              alignItems: 'center',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'text.secondary',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href={config.links.documentationUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="inherit"
              sx={{ '&:hover': { color: 'primary.main' }, transition: 'color 0.15s ease' }}
            >
              FAQ
            </Link>
            <Link
              href={config.links.termsOfServiceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="inherit"
              sx={{ '&:hover': { color: 'primary.main' }, transition: 'color 0.15s ease' }}
            >
              Terms
            </Link>
            <Link
              href={config.links.privacyPolicyUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="inherit"
              sx={{ '&:hover': { color: 'primary.main' }, transition: 'color 0.15s ease' }}
            >
              Privacy
            </Link>
            <Link
              href={`mailto:${config.links.supportEmail}`}
              underline="hover"
              color="inherit"
              sx={{ '&:hover': { color: 'primary.main' }, transition: 'color 0.15s ease' }}
            >
              Contact
            </Link>
          </Box>

          <Typography
            variant="caption"
            sx={{
              fontSize: '0.6875rem',
              color: 'text.disabled',
              letterSpacing: '0.01em',
            }}
          >
            Copyright © {currentYear} -3D Diagnostix,Inc. - All Rights Reserved
          </Typography>
        </Box>

        {/* Right: Circular Social Media Icons (Offset for Floating Support FAB) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pr: { xs: 0, md: 10, lg: 12 },
          }}
        >
          {/* Facebook */}
          <IconButton
            component="a"
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            size="small"
            sx={{
              width: 28,
              height: 28,
              border: (theme) =>
                `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
              color: 'text.secondary',
              '&:hover': { color: '#1877f2', borderColor: '#1877f2' },
              transition: 'all 0.15s ease',
            }}
          >
            <svg style={{ width: 14, height: 14, fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </IconButton>

          {/* YouTube */}
          <IconButton
            component="a"
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            size="small"
            sx={{
              width: 28,
              height: 28,
              border: (theme) =>
                `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
              color: 'text.secondary',
              '&:hover': { color: '#ff0000', borderColor: '#ff0000' },
              transition: 'all 0.15s ease',
            }}
          >
            <svg style={{ width: 14, height: 14, fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </IconButton>

          {/* X */}
          <IconButton
            component="a"
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            size="small"
            sx={{
              width: 28,
              height: 28,
              border: (theme) =>
                `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
              color: 'text.secondary',
              '&:hover': {
                color: (theme) => (theme.palette.mode === 'dark' ? '#ffffff' : '#000000'),
                borderColor: (theme) => (theme.palette.mode === 'dark' ? '#ffffff' : '#000000'),
              },
              transition: 'all 0.15s ease',
            }}
          >
            <svg style={{ width: 14, height: 14, fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </IconButton>

          {/* Instagram */}
          <IconButton
            component="a"
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            size="small"
            sx={{
              width: 28,
              height: 28,
              border: (theme) =>
                `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
              color: 'text.secondary',
              '&:hover': { color: '#e1306c', borderColor: '#e1306c' },
              transition: 'all 0.15s ease',
            }}
          >
            <svg style={{ width: 14, height: 14, fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default Footer;
