import MuiAvatar from '@mui/material/Avatar';
import { getInitials } from '@/shared/utils/format';

export interface AvatarProps {
  name?: string;
  initials?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'neutral' | 'success' | string;
  src?: string;
  className?: string;
}

const sizeSx = {
  sm: { width: 28, height: 28, fontSize: '0.625rem' },
  md: { width: 36, height: 36, fontSize: '0.75rem' },
  lg: { width: 48, height: 48, fontSize: '0.875rem' },
};

const bgColors = {
  primary: '#00706a',
  success: '#059669',
  neutral: 'rgba(100, 116, 139, 0.2)',
};

export function Avatar({
  name = '',
  initials,
  fallback,
  size = 'md',
  variant = 'primary',
  src,
  className = '',
}: AvatarProps) {
  const displayText = initials || (name ? getInitials(name) : (fallback || ''));
  const bgColor = bgColors[variant as keyof typeof bgColors] || bgColors.primary;
  const textColor = variant === 'neutral' ? '#64748b' : '#ffffff';

  return (
    <MuiAvatar
      src={src}
      alt={name || 'Avatar'}
      className={className}
      sx={{
        ...sizeSx[size],
        bgcolor: src ? 'transparent' : bgColor,
        color: textColor,
        fontWeight: 600,
      }}
    >
      {displayText}
    </MuiAvatar>
  );
}
