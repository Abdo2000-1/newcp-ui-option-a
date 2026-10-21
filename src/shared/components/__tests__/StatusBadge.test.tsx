import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge component', () => {
  it('renders status text correctly', () => {
    render(<StatusBadge status="Draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders small size classes when size is sm', () => {
    const { container } = render(<StatusBadge status="Completed" size="sm" />);
    expect(container.firstChild).toHaveClass('px-2', 'py-0.5', 'text-[10px]');
  });

  it('renders medium size classes by default', () => {
    const { container } = render(<StatusBadge status="In Progress" />);
    expect(container.firstChild).toHaveClass('px-2.5', 'py-1', 'text-xs');
  });

  it('falls back to neutral styling for unknown status', () => {
    const { container } = render(<StatusBadge status="UNKNOWN_CUSTOM_STATUS" />);
    expect(screen.getByText('UNKNOWN_CUSTOM_STATUS')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-slate-100');
  });
});
