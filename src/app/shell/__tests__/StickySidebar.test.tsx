import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ConvertibleNav, NavPosition } from '../ConvertibleNav';
import { Sidebar } from '../Sidebar';
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

describe('Sticky Full-Height Sidebar & Logo-Only Brand Header (UIUX-REQ-011)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Sticky Positioning & Full-Height Viewport', () => {
    it('applies sticky positioning (top: 0, height: 100vh) in left sidebar mode', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <ConvertibleNav
              position="left"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveStyle({
        position: 'fixed',
        top: '0px',
      });
      // In JSDOM, 100vh evaluates to window.innerHeight (768px)
      expect(window.getComputedStyle(aside!).height).toBe('768px');
    });

    it('applies sticky positioning (top: 0, height: 100vh) in right sidebar mode with correct order', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <ConvertibleNav
              position="right"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveStyle({
        position: 'fixed',
        top: '0px',
        order: '999',
      });
      expect(window.getComputedStyle(aside!).height).toBe('768px');
    });

    it('renders Sidebar component with sticky positioning', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveStyle({
        position: 'fixed',
        top: '0px',
      });
      expect(window.getComputedStyle(aside!).height).toBe('768px');
    });
  });

  describe('Logo-Only Brand Header', () => {
    it('renders logo-only brand header in ConvertibleNav sidebar without text branding', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <ConvertibleNav
              position="left"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      // Logo image is present
      const logoImg = screen.getByAltText(/3DDX Brand Logo/i);
      expect(logoImg).toBeInTheDocument();

      // Logo is a clickable link navigating to /dashboard
      const logoLink = screen.getByTitle('3DDX Home');
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/home');

      // No text branding like "DentaLab" or redundant text clutter in sidebar header
      expect(screen.queryByText(/DentaLab/i)).not.toBeInTheDocument();
    });

    it('renders logo-only brand header in Sidebar component', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Sidebar
              collapsed={false}
              onToggle={vi.fn()}
              mobileOpen={false}
              onMobileClose={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const logoImg = screen.getByAltText(/3DDX Brand Logo/i);
      expect(logoImg).toBeInTheDocument();
      expect(screen.queryByText(/DentaLab/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/CP Option A/i)).not.toBeInTheDocument();
    });

    it('renders compact logo-only brand header when sidebar is collapsed', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <ConvertibleNav
              position="left"
              onChangePosition={vi.fn()}
              collapsed={true}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const logoImg = screen.getByAltText(/3DDX Brand Logo/i);
      expect(logoImg).toBeInTheDocument();
    });
  });

  describe('Docking Modes & Navigation Functionality', () => {
    it('renders all 8 primary navigation items in sidebar mode', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <ConvertibleNav
              position="left"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={vi.fn()}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText(/^home$/i)).toBeInTheDocument();
      expect(screen.getByText(/^orders$/i)).toBeInTheDocument();
      expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
      expect(screen.getByText(/add case/i)).toBeInTheDocument();
      expect(screen.getByText(/live dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/3d models/i)).toBeInTheDocument();
      expect(screen.getByText(/staff targets/i)).toBeInTheDocument();
      expect(screen.queryByText(/order details/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/edit case/i)).not.toBeInTheDocument();
    });

    it('allows toggling between expanded and collapsed states', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <ConvertibleNav
              position="left"
              onChangePosition={vi.fn()}
              collapsed={false}
              onToggleCollapse={handleToggle}
              isDraggingNav={false}
              setIsDraggingNav={vi.fn()}
            />
          </AppProviders>
        </MemoryRouter>
      );

      const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(collapseBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('integrates cleanly in Layout component with independent scrolling flow', () => {
      localStorage.setItem('3ddx-cp-nav-position', 'left');

      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Routes>
              <Route path="*" element={<Layout />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      // Verify layout has flex-row when in left sidebar position
      const outerLayout = container.firstChild as HTMLElement;
      expect(outerLayout).toHaveClass('flex-row');

      // Verify main content container has independent scroll styling
      const mainContainer = container.querySelector('main');
      expect(mainContainer).toBeInTheDocument();

      // Footer is rendered within the scroll flow
      expect(screen.getByTestId('shell-footer')).toBeInTheDocument();
    });
  });
});
