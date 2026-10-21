import { getStatusStyles } from '@/shared/utils/status-styles';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const styles = getStatusStyles(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap
      ${styles.bg} ${styles.text}
      ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.text.replace('text-', 'bg-')}`} />
      {status}
    </span>
  );
}
