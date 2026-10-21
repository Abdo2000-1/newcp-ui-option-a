import { useRef } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <OutlinedInput
      inputRef={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      size="small"
      fullWidth
      startAdornment={
        <InputAdornment position="start" sx={{ mr: 1 }}>
          <Search style={{ width: 16, height: 16, color: '#94a3b8' }} />
        </InputAdornment>
      }
      endAdornment={
        value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => {
                onChange('');
                ref.current?.focus();
              }}
              edge="end"
              sx={{ p: 0.5, color: '#94a3b8' }}
            >
              <X style={{ width: 14, height: 14 }} />
            </IconButton>
          </InputAdornment>
        ) : null
      }
      sx={{
        height: 36,
        fontSize: '0.875rem',
        borderRadius: '8px',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--color-input-border, rgba(148, 163, 184, 0.3))',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#00706a',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#00706a',
          borderWidth: 1.5,
        },
      }}
    />
  );
}
