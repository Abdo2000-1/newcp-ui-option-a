import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import MuiButtonBase from '@mui/material/ButtonBase';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles = {
  primary: {
    backgroundColor: '#00706a',
    color: '#ffffff',
    '&:hover': { backgroundColor: '#005a55' },
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  secondary: {
    backgroundColor: 'var(--color-muted, #f1f5f9)',
    color: 'var(--color-foreground, #0f172a)',
    '&:hover': { backgroundColor: 'var(--color-border, #e2e8f0)' },
  },
  danger: {
    backgroundColor: '#e11d48',
    color: '#ffffff',
    '&:hover': { backgroundColor: '#be123c' },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-foreground-muted, #64748b)',
    '&:hover': {
      backgroundColor: 'var(--color-muted, #f1f5f9)',
      color: 'var(--color-foreground, #0f172a)',
    },
  },
  outline: {
    border: '1px solid var(--color-border, #e2e8f0)',
    backgroundColor: 'transparent',
    color: 'var(--color-foreground, #0f172a)',
    '&:hover': { backgroundColor: 'var(--color-muted, #f1f5f9)' },
  },
};

const sizeStyles = {
  sm: { height: 32, px: 1.5, fontSize: '0.75rem', gap: 0.75, borderRadius: '6px' },
  md: { height: 36, px: 2, fontSize: '0.875rem', gap: 1, borderRadius: '8px' },
  lg: { height: 44, px: 3, fontSize: '0.875rem', gap: 1, borderRadius: '8px' },
};

const variantClasses = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
  secondary: 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]',
  danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]',
  ghost: 'bg-transparent text-[var(--color-foreground-muted)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
  outline: 'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-sm gap-2 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <MuiButtonBase
        ref={ref}
        disabled={disabled || loading}
        type={type}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 500,
          transition: 'all 0.2s',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled || loading ? 0.5 : 1,
          ...variantStyles[variant],
          ...sizeStyles[size],
        }}
        {...(props as any)}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </MuiButtonBase>
    );
  }
);

Button.displayName = 'Button';
