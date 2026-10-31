import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuarterTargetsReport from '../QuarterTargetsReport';
import { AppProviders } from '@/app/providers';
import { catalogClient, MOCK_CATALOG_SERVICES } from '@/shared/api/catalogClient';

// Mock Recharts ResponsiveContainer to avoid 0x0 container size issues in JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

describe('Live Dashboard & Contract Telemetries (UIUX-REQ-019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(catalogClient, 'listServices').mockResolvedValue(MOCK_CATALOG_SERVICES);
  });

  it('renders the Live Dashboard header, API Live badge, and contract compliance notice', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Live Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Live')).toBeInTheDocument();
    });

    // Truthful Contract Capability Gap Alert
    expect(screen.getByText(/Canonical Contract Integration & Telemetry Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/In accordance with zero-fake-data standards/i)).toBeInTheDocument();

    // Verify complete absence of Power BI text
    expect(screen.queryByText(/Power BI Web Canvas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Power BI Gateway/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Power Designer/i)).not.toBeInTheDocument();

    // Verify absence of unsupported synthetic slicers
    expect(screen.queryByRole('button', { name: /^Guides$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^TP Plans$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^All Quota$/i })).not.toBeInTheDocument();
  });

  it('renders real catalog services and KPI summary cards from catalogClient', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Biomodel 3D Printing')).toBeInTheDocument();
      expect(screen.getByText('Dicom to CAD Conversion')).toBeInTheDocument();
    });

    // KPI cards
    expect(screen.getByText('Registered Services')).toBeInTheDocument();
    expect(screen.getByText('Average SLA Lead Time')).toBeInTheDocument();
    expect(screen.getByText('Digital CAD Services')).toBeInTheDocument();
    expect(screen.getByText('Active Workflows')).toBeInTheDocument();
  });

  it('filters catalog services dynamically and displays empty state on zero matches', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Biomodel 3D Printing')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search service name, code, workflow/i);
    fireEvent.change(searchInput, { target: { value: 'non_existent_service_xyz' } });

    // Empty state should appear
    expect(screen.getByTestId('slicer-no-results')).toBeInTheDocument();
    expect(screen.getByText('No Matching Catalog Services')).toBeInTheDocument();

    // Click Reset Filters
    const resetBtn = screen.getByTestId('reset-slicers-btn');
    fireEvent.click(resetBtn);

    // Services should reappear
    await waitFor(() => {
      expect(screen.getByText('Biomodel 3D Printing')).toBeInTheDocument();
    });
  });

  it('filters by Digital CAD format and switches tabs', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <QuarterTargetsReport />
        </AppProviders>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Biomodel 3D Printing')).toBeInTheDocument();
    });

    // Click Digital CAD filter
    const digitalBtn = screen.getByRole('button', { name: /digital cad/i });
    fireEvent.click(digitalBtn);

    expect(screen.getByText('Dicom to CAD Conversion')).toBeInTheDocument();
    expect(screen.queryByText('Biomodel 3D Printing')).not.toBeInTheDocument();

    // Switch to Catalog Matrix tab
    const matrixTab = screen.getByRole('button', { name: /catalog matrix/i });
    fireEvent.click(matrixTab);

    expect(screen.getByText('Clinical Catalog Specifications Matrix')).toBeInTheDocument();
  });
});
