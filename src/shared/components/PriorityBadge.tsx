import { getPriorityStyles } from '@/shared/utils/status-styles';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = getPriorityStyles(priority);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {priority}
    </span>
  );
}
