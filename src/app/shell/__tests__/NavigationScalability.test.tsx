import React from 'react';
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

function renderNavWithPosition(initialPosition: 'top' | 'bottom' | 'left' | 'right' = 'top', sessionRole: string = 'cs') {
  localStorage.setItem('3ddx-cp-nav-position', initialPosition);
  localStorage.setItem('newcp_iam_session_v097', JSON.stringify({
    userId: `usr-${sessionRole}-01`,
    fullName: sessionRole === 'admin' ? 'Admin User' : 'CS Specialist',
    roles: [sessionRole],
    tenantId: 1,
    status: 'authenticated',
    accessStatus: 'AUTHORIZED',
  }));

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="home" element={<div data-testid="home-content">Home Content</div>} />
            <Route path="dashboard" element={<div data-testid="dashboard-content">Dashboard Content</div>} />
            <Route path="flow" element={<div data-testid="flow-content">Workflow Queue Content</div>} />
            <Route path="workflow-board" element={<div data-testid="board-content">Workflow Board Content</div>} />
            <Route path="cases" element={<div data-testid="cases-content">Cases Content</div>} />
            <Route path="patients" element={<div data-testid="patients-content">Patients Content</div>} />
            <Route path="reports" element={<div data-testid="reports-content">Reports Content</div>} />
            <Route path="cms" element={<div data-testid="cms-content">CMS Controls Content</div>} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('PR 5: Navigation Scalability, Grouped Sections & Overflow Handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Grouped Sections in Navigation Dropdowns', () => {
    it('renders categorized sections inside Orders & Cases dropdown', () => {
      renderNavWithPosition('top');

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);

      const menu = screen.getByTestId('orders-dropdown-menu');
      expect(menu).toBeInTheDocument();

      // Section Headings
      expect(screen.getByText(/active production/i)).toBeInTheDocument();
      expect(screen.getByText(/cases & revisions/i)).toBeInTheDocument();

      // Routes within sections
      expect(screen.getByText(/workflow queue/i)).toBeInTheDocument();
      expect(screen.getByText(/workflow board/i)).toBeInTheDocument();
      expect(screen.getByText(/order details/i)).toBeInTheDocument();
      expect(screen.getByText(/cases archive/i)).toBeInTheDocument();
      expect(screen.getByText(/edit case/i)).toBeInTheDocument();
      expect(screen.getByText(/change requests/i)).toBeInTheDocument();
    });

    it('renders categorized sections inside Operations & Reports dropdown', () => {
      renderNavWithPosition('top');

      const opsBtn = screen.getByRole('button', { name: /operations & reports/i });
      fireEvent.click(opsBtn);

      const menu = screen.getByTestId('ops-dropdown-menu');
      expect(menu).toBeInTheDocument();

      // Section Headings
      expect(screen.getByText(/analytics & slas/i)).toBeInTheDocument();
      expect(screen.getByText(/laboratory & intake/i)).toBeInTheDocument();

      // Routes
      expect(screen.getByText(/quarter targets & power bi/i)).toBeInTheDocument();
      expect(screen.getByText(/task 31: staff targets/i)).toBeInTheDocument();
      expect(screen.getByText(/reports hub/i)).toBeInTheDocument();
      expect(screen.getByText(/task 47: models report/i)).toBeInTheDocument();
      expect(screen.getByText(/scan center/i)).toBeInTheDocument();
      expect(screen.getByText(/documents & prescriptions/i)).toBeInTheDocument();
    });

    it('renders categorized sections inside More dropdown', () => {
      renderNavWithPosition('top', 'cs');

      const moreBtn = screen.getByRole('button', { name: /^more$/i });
      fireEvent.click(moreBtn);

      const menu = screen.getByTestId('more-dropdown-menu');
      expect(menu).toBeInTheDocument();

      // Section Headings
      expect(screen.getByText(/directories & network/i)).toBeInTheDocument();
      expect(screen.getByText(/finance & settings/i)).toBeInTheDocument();

      // Directories
      expect(screen.getByText(/patients directory/i)).toBeInTheDocument();
      expect(screen.getByText(/clinics directory/i)).toBeInTheDocument();
      expect(screen.getByText(/doctors directory/i)).toBeInTheDocument();
      expect(screen.getByText(/billing & finance/i)).toBeInTheDocument();
      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/system settings/i)).toBeInTheDocument();

      // Non-admin should not see Administration section
      expect(screen.queryByText(/^administration$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cms controls/i)).not.toBeInTheDocument();
    });

    it('renders Administration section in More dropdown when user has admin role', () => {
      renderNavWithPosition('top', 'admin');

      const moreBtn = screen.getByRole('button', { name: /^more$/i });
      fireEvent.click(moreBtn);

      expect(screen.getByText(/^administration$/i)).toBeInTheDocument();
      expect(screen.getByText(/cms controls/i)).toBeInTheDocument();
      expect(screen.getByText(/config manager/i)).toBeInTheDocument();
    });
  });

  describe('Sensible Overflow Strategy & No Endless Menu Expansion', () => {
    it('applies scroll capping classes (max-h and overflow-y-auto) to all dropdown menus', () => {
      renderNavWithPosition('top');

      // Check Orders menu
      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);
      const ordersMenu = screen.getByTestId('orders-dropdown-menu');
      expect(ordersMenu).toHaveClass('overflow-y-auto');

      // Check Ops menu
      const opsBtn = screen.getByRole('button', { name: /operations & reports/i });
      fireEvent.click(opsBtn);
      const opsMenu = screen.getByTestId('ops-dropdown-menu');
      expect(opsMenu).toHaveClass('overflow-y-auto');

      // Check More menu
      const moreBtn = screen.getByRole('button', { name: /^more$/i });
      fireEvent.click(moreBtn);
      const moreMenu = screen.getByTestId('more-dropdown-menu');
      expect(moreMenu).toHaveClass('overflow-y-auto');
    });

    it('prevents horizontal dropdown clipping by aligning More menu to right edge on desktop', () => {
      renderNavWithPosition('top');

      const moreBtn = screen.getByRole('button', { name: /^more$/i });
      fireEvent.click(moreBtn);

      const moreMenu = screen.getByTestId('more-dropdown-menu');
      expect(moreMenu).toHaveClass('sm:right-0');
    });
  });

  describe('Keyboard Accessibility (WCAG 2.1 AA)', () => {
    it('closes any active dropdown when pressing the Escape key', () => {
      renderNavWithPosition('top');

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);
      expect(screen.getByTestId('orders-dropdown-menu')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('orders-dropdown-menu')).not.toBeInTheDocument();
    });

    it('has proper ARIA semantics for menu triggers, menus, and items', () => {
      renderNavWithPosition('top');

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      expect(ordersBtn).toHaveAttribute('aria-haspopup', 'true');
      expect(ordersBtn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(ordersBtn);
      expect(ordersBtn).toHaveAttribute('aria-expanded', 'true');

      const menu = screen.getByTestId('orders-dropdown-menu');
      expect(menu).toHaveAttribute('role', 'menu');

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('No Duplicate Navigation Routes', () => {
    it('ensures + New Case is not rendered in Tier 2 second navbar', () => {
      renderNavWithPosition('top');

      const container = screen.getByTestId('tier2-nav-container');
      expect(container).not.toHaveTextContent(/add new case/i);
    });
  });
});
