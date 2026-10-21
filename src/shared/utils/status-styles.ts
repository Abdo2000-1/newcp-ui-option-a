const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'New': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  'Review': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  'Design': { bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  'Production': { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'Quality Check': { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  'Ready': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Completed': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Cancelled': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  'Open': { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'In Progress': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  'Closed': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  'Pending': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  'Invoiced': { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'Paid': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Overdue': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  'Active': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Inactive': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  'In Review': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  'Approved': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Rejected': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  'Operational': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Maintenance': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  'done': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'in-progress': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  'pending': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  'blocked': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

export function getStatusStyles(status: string) {
  return STATUS_STYLES[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
}

const PRIORITY_STYLES: Record<string, { dot: string; text: string }> = {
  'Low': { dot: 'bg-slate-400', text: 'text-slate-500' },
  'Normal': { dot: 'bg-blue-500', text: 'text-blue-600' },
  'High': { dot: 'bg-amber-500', text: 'text-amber-600' },
  'Urgent': { dot: 'bg-red-500', text: 'text-red-600' },
};

export function getPriorityStyles(priority: string) {
  return PRIORITY_STYLES[priority] || { dot: 'bg-slate-400', text: 'text-slate-500' };
}

export const BREAKDOWN_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#94A3B8'];
