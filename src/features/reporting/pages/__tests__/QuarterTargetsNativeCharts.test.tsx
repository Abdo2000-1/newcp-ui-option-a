import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import QuarterTargetsReport from '../QuarterTargetsReport';
import { AppProviders } from '@/app/providers';

// Mock recharts ResponsiveContainer
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="native-responsive-chart" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

describe('Quarter Targets Native Charts & Power BI Removal (Task 10)', () => {
  it('renders zero iframe elements and zero external powerbi embeds', () => {
    const { container } = render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    const iframes = container.querySelectorAll('iframe');
    expect(iframes).toHaveLength(0);

    const html = container.innerHTML;
    expect(html).not.toContain('app.powerbi.com');
  });

  it('renders native charts with interactive quarter slicers', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    const charts = screen.getAllByTestId('native-responsive-chart');
    expect(charts.length).toBeGreaterThanOrEqual(2);

    const q1Btn = screen.getByRole('button', { name: /^Q1$/i });
    fireEvent.click(q1Btn);
    expect(screen.getByText(/2,580/)).toBeInTheDocument();
  });
});
