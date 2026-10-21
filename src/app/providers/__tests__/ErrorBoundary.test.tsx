import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulation of CAD View Rendering Failure');
  }
  return <div data-testid="healthy-child">Healthy Medical View</div>;
}

describe('ErrorBoundary component', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children normally when no exception occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    expect(screen.getByText('Healthy Medical View')).toBeInTheDocument();
  });

  it('catches exception from child and displays clinical fallback view', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('healthy-child')).not.toBeInTheDocument();
    expect(screen.getByText('Clinical View Exception')).toBeInTheDocument();
    expect(
      screen.getByText(/A component-level error occurred while rendering this view/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload view/i })).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error View</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });
});
