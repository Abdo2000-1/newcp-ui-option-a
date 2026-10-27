import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PostHogSettings from '../PostHogSettings';
import * as observability from '@/shared/observability';

describe('PostHog Settings Dashboard (Task 5)', () => {
  it('renders without errors with default safe status', () => {
    render(<PostHogSettings />);

    expect(screen.getByTestId('posthog-settings-page')).toBeInTheDocument();
    expect(screen.getByText('PostHog Telemetry & Feature Flags')).toBeInTheDocument();
    expect(screen.getByText('Provider Runtime Configuration')).toBeInTheDocument();
    expect(screen.getByText('Feature Flags & Session Recording')).toBeInTheDocument();
    expect(screen.getByText('new_cp_v4_redesign')).toBeInTheDocument();
    expect(screen.getByText('Disabled (Zero PHI Leak)')).toBeInTheDocument();
  });

  it('safely handles Track Test Event action when PostHog is in No-Op mode', () => {
    render(<PostHogSettings />);

    const trackBtn = screen.getByRole('button', { name: /track test event/i });
    expect(trackBtn).toBeInTheDocument();

    // Trigger test event
    fireEvent.click(trackBtn);

    // Verify feedback message appears without throwing
    expect(
      screen.getByText(/Telemetry\/PostHog is disabled\. Test event safely absorbed by No-Op adapter\./i)
    ).toBeInTheDocument();
  });

  it('does NOT render or expose any secrets or tokens in the DOM', () => {
    const { container } = render(<PostHogSettings />);
    const html = container.innerHTML;

    // Verify secret patterns are never rendered
    expect(html).not.toMatch(/phc_[a-zA-Z0-9_-]{20,}/);
    expect(html).not.toMatch(/gho_[a-zA-Z0-9_-]{20,}/);
    expect(html).not.toContain('phc_test_secret_key');
    expect(html).toContain('Protected (Zero In-DOM Secret)');
  });
});
