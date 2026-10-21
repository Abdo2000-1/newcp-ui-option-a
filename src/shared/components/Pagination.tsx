import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  onPageChange,
}: PaginationProps) {
  const activePage = page ?? currentPage ?? 1;
  const count = totalCount ?? totalPages * pageSize;
  const start = (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, count);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderTop: '1px solid var(--color-border, rgba(0,0,0,0.08))',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontSize: '0.75rem',
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Showing {start}–{end} of {count}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <ButtonBase
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          sx={{
            p: 0.75,
            borderRadius: '6px',
            color: 'text.secondary',
            opacity: activePage <= 1 ? 0.4 : 1,
            cursor: activePage <= 1 ? 'not-allowed' : 'pointer',
            '&:hover': {
              bgcolor: activePage <= 1 ? 'transparent' : 'action.hover',
            },
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </ButtonBase>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) pageNum = i + 1;
          else if (activePage <= 3) pageNum = i + 1;
          else if (activePage >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = activePage - 2 + i;

          const isActive = activePage === pageNum;

          return (
            <ButtonBase
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.75rem',
                borderRadius: '6px',
                fontWeight: 500,
                bgcolor: isActive ? '#00706a' : 'transparent',
                color: isActive ? '#ffffff' : 'text.secondary',
                '&:hover': {
                  bgcolor: isActive ? '#005a55' : 'action.hover',
                },
              }}
            >
              {pageNum}
            </ButtonBase>
          );
        })}

        <ButtonBase
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          sx={{
            p: 0.75,
            borderRadius: '6px',
            color: 'text.secondary',
            opacity: activePage >= totalPages ? 0.4 : 1,
            cursor: activePage >= totalPages ? 'not-allowed' : 'pointer',
            '&:hover': {
              bgcolor: activePage >= totalPages ? 'transparent' : 'action.hover',
            },
          }}
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
        </ButtonBase>
      </Box>
    </Box>
  );
}
