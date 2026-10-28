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

function renderNavWithPosition(initialPosition: 'top' | 'bottom' | 'left' | 'right' = 'top') {
  localStorage.setItem('3ddx-cp-nav-position', initialPosition);

  return render(
    <MemoryRouter initialEntries={['/home']}>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="home" element={<div data-testid="test-content">Home Content</div>} />
            <Route path="flow" element={<div data-testid="flow-content">Workflow Queue Content</div>} />
            <Route path="task-47" element={<div data-testid="task47-content">Task 47 Content</div>} />
            <Route path="quarter-targets" element={<div data-testid="qt-content">Quarter Targets Content</div>} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Tier 2 Navbar Dropdown Visibility & Overflow Fix (UIUX-REQ-012)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Orders & Cases Dropdown Visibility', () => {
    it('opens and visibly renders Orders & Cases dropdown menu without overflow clipping', () => {
      renderNavWithPosition('top');

      const container = screen.getByTestId('tier2-nav-container');
      expect(container).toHaveClass('overflow-x-auto');

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      expect(ordersBtn).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId('orders-dropdown-menu')).not.toBeInTheDocument();

      // Open Orders & Cases
      fireEvent.click(ordersBtn);

      expect(ordersBtn).toHaveAttribute('aria-expanded', 'true');
      const menu = screen.getByTestId('orders-dropdown-menu');
      expect(menu).toBeInTheDocument();
      expect(screen.getByText(/workflow queue/i)).toBeInTheDocument();
      expect(screen.getByText(/order details/i)).toBeInTheDocument();
      expect(screen.getByText(/edit case/i)).toBeInTheDocument();

      // Container switches to overflow-visible to prevent clipping
      expect(container).toHaveClass('overflow-visible');
    });

    it('closes the dropdown on outside click and restores scrolling container', () => {
      renderNavWithPosition('top');

      const container = screen.getByTestId('tier2-nav-container');
      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);

      expect(screen.getByTestId('orders-dropdown-menu')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      expect(screen.queryByTestId('orders-dropdown-menu')).not.toBeInTheDocument();
      expect(container).toHaveClass('overflow-x-auto');
    });
  });

  describe('Operations & Reports Dropdown Visibility & Click Behavior', () => {
    it('opens and visibly renders Operations & Reports dropdown menu without clipping', () => {
      renderNavWithPosition('top');

      const container = screen.getByTestId('tier2-nav-container');
      const opsBtn = screen.getByRole('button', { name: /operations & reports/i });
      expect(opsBtn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(opsBtn);

      expect(opsBtn).toHaveAttribute('aria-expanded', 'true');
      const menu = screen.getByTestId('ops-dropdown-menu');
      expect(menu).toBeInTheDocument();
      expect(screen.getByText(/quarter targets & power bi/i)).toBeInTheDocument();
      expect(screen.getByText(/task 47: models report/i)).toBeInTheDocument();
      expect(screen.getByText(/task 31: staff targets/i)).toBeInTheDocument();

      // Container switches to overflow-visible
      expect(container).toHaveClass('overflow-visible');
    });

    it('navigates and closes dropdown when an Operations & Reports menu item is clicked', () => {
      renderNavWithPosition('top');

      const opsBtn = screen.getByRole('button', { name: /operations & reports/i });
      fireEvent.click(opsBtn);

      const task47Link = screen.getByText(/task 47: models report/i);
      fireEvent.click(task47Link);

      // Menu closes and content routes to Task 47
      expect(screen.queryByTestId('ops-dropdown-menu')).not.toBeInTheDocument();
      expect(screen.getByTestId('task47-content')).toBeInTheDocument();
    });
  });

  describe('Navigation Modes: Top vs Bottom Taskbar', () => {
    it('positions dropdowns downward (top-full mt-2) in top navigation mode', () => {
      renderNavWithPosition('top');

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);

      const menu = screen.getByTestId('orders-dropdown-menu');
      expect(menu).toHaveClass('top-full', 'mt-2');
      expect(menu).not.toHaveClass('bottom-full');
    });

    it('positions dropdowns upward (bottom-full mb-2) in bottom navigation mode', () => {
      renderNavWithPosition('bottom');

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);

      const menu = screen.getByTestId('orders-dropdown-menu');
      expect(menu).toHaveClass('bottom-full', 'mb-2');
      expect(menu).not.toHaveClass('top-full');

      const container = screen.getByTestId('tier2-nav-container');
      expect(container).toHaveClass('overflow-visible');
    });
  });

  describe('Mobile Navigation Behavior', () => {
    it('maintains horizontal scrolling classes when dropdowns are closed and visible overflow when open', () => {
      renderNavWithPosition('top');

      const container = screen.getByTestId('tier2-nav-container');

      // Closed state: contains overflow-x-auto and no-scrollbar for smooth mobile swiping
      expect(container).toHaveClass('overflow-x-auto', 'no-scrollbar');

      // Open state: switches to overflow-visible so dropdown is completely unclipped
      const opsBtn = screen.getByRole('button', { name: /operations & reports/i });
      fireEvent.click(opsBtn);

      expect(container).toHaveClass('overflow-visible');
      expect(container).not.toHaveClass('overflow-x-auto');

      // Closing returns to mobile scrolling classes
      fireEvent.click(opsBtn);
      expect(container).toHaveClass('overflow-x-auto', 'no-scrollbar');
    });
  });
});
