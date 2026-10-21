import { getInitials } from '@/shared/utils/format';

interface AvatarProps {
  name?: string;
  initials?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'neutral' | 'success' | string;
  src?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

export function Avatar({ name = '', initials, fallback, size = 'md', variant = 'primary', src, className = '' }: AvatarProps) {
  const displayText = initials || (name ? getInitials(name) : (fallback || ''));
  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={`${sizeClasses[size]} rounded-full object-cover ${className}`} />;
  }
  const bgClass =
    variant === 'primary' ? 'bg-[var(--color-primary)] text-white' :
    variant === 'success' ? 'bg-emerald-600 text-white' :
    'bg-[var(--color-muted)] text-[var(--color-foreground-muted)]';

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold shrink-0 ${bgClass} ${className}`}>
      {displayText}
    </div>
  );
}
