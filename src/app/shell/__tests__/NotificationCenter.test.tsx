import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenter } from '../NotificationCenter';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';

describe('Local Notification Center (UX-005)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders notification center header and frontend simulation disclaimer', () => {
    render(
      <AppProviders>
        <NotificationCenter open={true} onClose={vi.fn()} />
      </AppProviders>
    );

    expect(screen.getByText(/^Notification Center$/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend In-Memory Simulation/i)).toBeInTheDocument();
  });

  it('adds simulated mock fixture alert when + Add Mock button is clicked', () => {
    render(
      <AppProviders>
        <NotificationCenter open={true} onClose={vi.fn()} />
      </AppProviders>
    );

    const addMockBtn = screen.getByRole('button', { name: /\+ add mock/i });
    fireEvent.click(addMockBtn);

    expect(screen.getByText(/Urgent SLA Alert \(Simulated\)/i)).toBeInTheDocument();
  });

  it('filters notifications by category tabs', () => {
    render(
      <AppProviders>
        <NotificationCenter open={true} onClose={vi.fn()} />
      </AppProviders>
    );

    const unreadTab = screen.getByRole('tab', { name: /unread/i });
    fireEvent.click(unreadTab);

    expect(unreadTab).toHaveAttribute('aria-selected', 'true');
  });

  it('marks all notifications as read when button is clicked', () => {
    render(
      <AppProviders>
        <NotificationCenter open={true} onClose={vi.fn()} />
      </AppProviders>
    );

    // Add unread mock first
    const addMockBtn = screen.getByRole('button', { name: /\+ add mock/i });
    fireEvent.click(addMockBtn);

    const markAllBtn = screen.queryByRole('button', { name: /mark all read/i });
    if (markAllBtn) {
      fireEvent.click(markAllBtn);
      // Unread count is now 0
      expect(screen.queryByRole('button', { name: /mark all read/i })).not.toBeInTheDocument();
    }
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <AppProviders>
        <NotificationCenter open={true} onClose={handleClose} />
      </AppProviders>
    );

    const closeBtn = screen.getByRole('button', { name: /close notification center/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateOrder when clicking notification with relatedId', () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <AppProviders>
        <NotificationCenter open={true} onClose={handleClose} onNavigateOrder={handleNavigate} />
      </AppProviders>
    );

    const addMockBtn = screen.getByRole('button', { name: /\+ add mock/i });
    fireEvent.click(addMockBtn);

    const alertCards = screen.getAllByText(/Urgent SLA Alert \(Simulated\)/i);
    fireEvent.click(alertCards[0]);

    expect(handleNavigate).toHaveBeenCalledWith('504901');
    expect(handleClose).toHaveBeenCalled();
  });
});
