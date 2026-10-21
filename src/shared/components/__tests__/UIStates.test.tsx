import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoadingState } from '../LoadingState';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { UIStateSwitcher } from '../UIStateSwitcher';

describe('UI State Representation Components', () => {
  describe('LoadingState', () => {
    it('renders default loading copy', () => {
      render(<LoadingState />);
      expect(screen.getByText(/CP PRO MAX Loading\.\.\./i)).toBeInTheDocument();
    });

    it('renders custom loading message when provided', () => {
      render(<LoadingState message="Fetching DICOM Datasets..." />);
      expect(screen.getByText('Fetching DICOM Datasets...')).toBeInTheDocument();
    });

    it('renders shimmer skeleton rows when showRows is true', () => {
      const { container } = render(<LoadingState showRows={true} rowCount={4} />);
      const skeletonRows = container.querySelectorAll('.animate-pulse');
      expect(skeletonRows.length).toBe(4);
    });
  });

  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(
        <EmptyState
          title="No Orders Found"
          description="Try adjusting your filter criteria or search terms."
        />
      );
      expect(screen.getByText('No Orders Found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filter criteria or search terms.')).toBeInTheDocument();
    });

    it('renders custom action button when provided', () => {
      render(
        <EmptyState
          title="No Cases"
          action={<button data-testid="new-case-btn">Create Case</button>}
        />
      );
      expect(screen.getByTestId('new-case-btn')).toBeInTheDocument();
    });
  });

  describe('ErrorState', () => {
    it('renders default error title, message, and error code', () => {
      render(<ErrorState />);
      expect(screen.getByText('Service Synchronization Interrupted')).toBeInTheDocument();
      expect(screen.getByText(/ERR_CAD_SYNC_503/i)).toBeInTheDocument();
    });

    it('calls onRetry callback when Retry button is clicked after timeout', () => {
      vi.useFakeTimers();
      const onRetryMock = vi.fn();
      render(<ErrorState onRetry={onRetryMock} />);

      const retryBtn = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryBtn);

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(onRetryMock).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('UIStateSwitcher', () => {
    it('renders all four state simulation options (normal, loading, empty, error)', () => {
      render(<UIStateSwitcher state="normal" onChange={() => {}} />);
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('Empty')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('calls onChange with the chosen state when clicked', () => {
      const handleChange = vi.fn();
      render(<UIStateSwitcher state="normal" onChange={handleChange} />);

      const emptyBtn = screen.getByRole('button', { name: /empty/i });
      fireEvent.click(emptyBtn);

      expect(handleChange).toHaveBeenCalledWith('empty');
    });
  });
});
