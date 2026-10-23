import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../Layout';
import { AppProviders } from '@/app/providers';

// Mock matchMedia for responsive tests in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function renderLayoutWithRoute(initialPosition: 'top' | 'bottom' | 'left' | 'right' = 'top') {
  localStorage.setItem('3ddx-cp-nav-position', initialPosition);

  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div data-testid="test-content">Dashboard Content</div>} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Bottom Taskbar Docking & Footer Visibility (UIUX-REQ-012)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Bottom Dock Mode Layout & Clearance', () => {
    it('renders the bottom dock clearance spacer when navigation is docked at the bottom', () => {
      renderLayoutWithRoute('bottom');

      const spacer = screen.getByTestId('bottom-dock-spacer');
      expect(spacer).toBeInTheDocument();
      expect(spacer).toHaveClass('h-[108px]');
    });

    it('renders the footer within the scroll flow above the bottom dock spacer', () => {
      renderLayoutWithRoute('bottom');

      const footer = screen.getByTestId('shell-footer');
      expect(footer).toBeInTheDocument();
      expect(screen.getByText(/3D Diagnostix,Inc. - All Rights Reserved/i)).toBeInTheDocument();

      const spacer = screen.getByTestId('bottom-dock-spacer');
      expect(spacer).toBeInTheDocument();
    });

    it('positions the floating support button with offset when docked at bottom', () => {
      renderLayoutWithRoute('bottom');

      const supportButton = screen.getByRole('button', { name: /^support$/i });
      expect(supportButton).toBeInTheDocument();

      const supportContainer = supportButton.closest('.fixed');
      expect(supportContainer).toHaveClass('bottom-[116px]');
    });
  });

  describe('Top and Sidebar Navigation Modes', () => {
    it('does not render the bottom dock spacer when navigation is in top mode', () => {
      renderLayoutWithRoute('top');

      expect(screen.queryByTestId('bottom-dock-spacer')).not.toBeInTheDocument();
      expect(screen.getByTestId('shell-footer')).toBeInTheDocument();
    });

    it('does not render the bottom dock spacer when navigation is in left sidebar mode', () => {
      renderLayoutWithRoute('left');

      expect(screen.queryByTestId('bottom-dock-spacer')).not.toBeInTheDocument();
      expect(screen.getByTestId('shell-footer')).toBeInTheDocument();
    });

    it('positions floating support button at normal bottom position when docked at top', () => {
      renderLayoutWithRoute('top');

      const supportButton = screen.getByRole('button', { name: /^support$/i });
      const supportContainer = supportButton.closest('.fixed');
      expect(supportContainer).not.toHaveClass('bottom-[116px]');
      expect(supportContainer).toHaveClass('bottom-4');
    });
  });

  describe('Dock Position Switching & State Transitions', () => {
    it('switches between positions and updates bottom clearance dynamically', () => {
      renderLayoutWithRoute('top');

      expect(screen.queryByTestId('bottom-dock-spacer')).not.toBeInTheDocument();

      // Open quick dock position menu and select Bottom Taskbar
      const dockMenuBtn = screen.getByTitle(/choose navigation dock position/i);
      fireEvent.click(dockMenuBtn);

      const bottomOption = screen.getByRole('button', { name: /bottom taskbar/i });
      fireEvent.click(bottomOption);

      // Bottom dock spacer must now be active
      expect(screen.getByTestId('bottom-dock-spacer')).toBeInTheDocument();
      expect(localStorage.getItem('3ddx-cp-nav-position')).toBe('bottom');
    });
  });
});
