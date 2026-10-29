import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeethChart } from '../TeethChart';
import { AppProviders } from '@/app/providers';

// Mock WebGL canvas if 3D arch is mounted
vi.mock('@/shared/components/TeethChart3DArch', () => ({
  TeethChart3DArch: () => <div data-testid="mock-3d-arch">3D Arch Canvas</div>,
}));

function renderTeethChart(props: React.ComponentProps<typeof TeethChart> = {}) {
  return render(
    <AppProviders>
      <TeethChart {...props} />
    </AppProviders>
  );
}

describe('TeethChart Responsive Layout & Operation Summary Suite', () => {
  it('renders correctly with one tooth selected', () => {
    renderTeethChart({
      selectedTeeth: [14],
      toothRestorations: { 14: 'implant' },
    });

    expect(screen.getByTestId('selected-procedures-summary')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-group-implant')).toBeInTheDocument();
    expect(screen.getByTestId('tooth-chip-14')).toBeInTheDocument();
    expect(screen.getByTestId('tooth-num-14')).toHaveTextContent('#14');
    expect(screen.getByText(/Selected Procedures Summary \(1 Units\)/i)).toBeInTheDocument();
  });

  it('renders and wraps many teeth selected for a single operation without overflow', () => {
    // 16 teeth in upper arch all assigned to 'crown'
    const sixteenTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const crownsMap: Record<number, any> = {};
    sixteenTeeth.forEach((n) => {
      crownsMap[n] = 'crown';
    });

    renderTeethChart({
      selectedTeeth: sixteenTeeth,
      toothRestorations: crownsMap,
    });

    const summary = screen.getByTestId('selected-procedures-summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveClass('w-full', 'max-w-full', 'overflow-hidden');

    const procedureGroup = screen.getByTestId('procedure-group-crown');
    expect(procedureGroup).toBeInTheDocument();
    expect(procedureGroup).toHaveClass('flex-wrap', 'max-w-full');

    const teethList = screen.getByTestId('teeth-list-crown');
    expect(teethList).toHaveClass('flex-wrap', 'max-w-full');

    // Verify all 16 teeth chips exist and retain accurate numbers
    sixteenTeeth.forEach((n) => {
      expect(screen.getByTestId(`tooth-chip-${n}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tooth-num-${n}`)).toHaveTextContent(`#${n}`);
    });

    expect(screen.getByText(/Selected Procedures Summary \(16 Units\)/i)).toBeInTheDocument();
  });

  it('handles multiple distinct operations with many teeth and maintains responsiveness', () => {
    const selected = [2, 3, 4, 5, 12, 13, 14, 15, 18, 19, 30, 31];
    const restorations: Record<number, any> = {
      2: 'crown',
      3: 'crown',
      4: 'crown',
      5: 'crown',
      12: 'implant',
      13: 'implant',
      14: 'implant',
      15: 'implant',
      18: 'extraction',
      19: 'extraction',
      30: 'sleeve',
      31: 'sleeve',
    };

    renderTeethChart({
      selectedTeeth: selected,
      toothRestorations: restorations,
    });

    expect(screen.getByTestId('procedure-group-crown')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-group-implant')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-group-extraction')).toBeInTheDocument();
    expect(screen.getByTestId('procedure-group-sleeve')).toBeInTheDocument();

    expect(screen.getByText(/Selected Procedures Summary \(12 Units\)/i)).toBeInTheDocument();
  });

  it('allows deselection and removal of individual teeth directly from the summary chips', () => {
    const onSelectionChange = vi.fn();
    renderTeethChart({
      selectedTeeth: [14, 15],
      toothRestorations: { 14: 'implant', 15: 'implant' },
      onSelectionChange,
    });

    const removeBtn14 = screen.getByTitle('Remove tooth #14');
    expect(removeBtn14).toBeInTheDocument();

    fireEvent.click(removeBtn14);

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(
      [15],
      expect.not.objectContaining({ 14: expect.anything() })
    );
  });

  it('renders cleanly in narrow viewport containers without truncating tooth identification', () => {
    const { container } = render(
      <AppProviders>
        <div style={{ width: 320, maxWidth: 320 }}>
          <TeethChart
            selectedTeeth={[8, 9, 10, 11]}
            toothRestorations={{ 8: 'crown', 9: 'crown', 10: 'crown', 11: 'crown' }}
          />
        </div>
      </AppProviders>
    );

    const summary = screen.getByTestId('selected-procedures-summary');
    expect(summary).toBeInTheDocument();
    expect(screen.getByTestId('tooth-num-8')).toHaveTextContent('#8');
    expect(screen.getByTestId('tooth-num-9')).toHaveTextContent('#9');
    expect(screen.getByTestId('tooth-num-10')).toHaveTextContent('#10');
    expect(screen.getByTestId('tooth-num-11')).toHaveTextContent('#11');
  });
});
