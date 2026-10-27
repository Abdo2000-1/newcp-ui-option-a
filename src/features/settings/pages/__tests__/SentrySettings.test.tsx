import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SentrySettings from '../SentrySettings';

describe('Sentry Settings Dashboard (Task 6)', () => {
  it('renders without errors with default safe status', () => {
    render(<SentrySettings />);

    expect(screen.getByTestId('sentry-settings-page')).toBeInTheDocument();
    expect(screen.getByText('Sentry Error Monitoring & APM')).toBeInTheDocument();
    expect(screen.getByText('Runtime Error Reporting')).toBeInTheDocument();
    expect(screen.getByText('Performance & Privacy Filters')).toBeInTheDocument();
    expect(screen.getByText('Traces Sample Rate')).toBeInTheDocument();
    expect(screen.getByText('Strict (HIPAA Safe)')).toBeInTheDocument();
  });

  it('safely handles Capture Test Exception action when Sentry is in No-Op mode', () => {
    render(<SentrySettings />);

    const captureBtn = screen.getByRole('button', { name: /capture test exception/i });
    expect(captureBtn).toBeInTheDocument();

    // Trigger test exception
    fireEvent.click(captureBtn);

    // Verify feedback message appears without throwing
    expect(
      screen.getByText(/Telemetry\/Sentry is disabled\. Test exception safely absorbed by No-Op adapter\./i)
    ).toBeInTheDocument();
  });

  it('does NOT render or expose any real DSN, token, or secret in the DOM', () => {
    const { container } = render(<SentrySettings />);
    const html = container.innerHTML;

    // Verify DSN patterns (e.g., https://<key>@<org>.ingest.sentry.io/<id>) are never rendered
    expect(html).not.toMatch(/https:\/\/[a-f0-9]{32}@o\d+\.ingest\.sentry\.io\/\d+/);
    expect(html).not.toMatch(/gho_[a-zA-Z0-9_-]{20,}/);
    expect(html).not.toContain('sentry_key');
    expect(html).toContain('Protected (Zero In-DOM Secret)');
  });
});
