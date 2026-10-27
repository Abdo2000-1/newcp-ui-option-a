import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConvertibleNav, NavPosition } from '../ConvertibleNav';
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

function renderConvertibleNav(props?: {
  position?: NavPosition;
  collapsed?: boolean;
  onChangePosition?: (pos: NavPosition) => void;
  onToggleCollapse?: () => void;
}) {
  const position = props?.position ?? 'top';
  const collapsed = props?.collapsed ?? false;
  const onChangePosition = props?.onChangePosition ?? vi.fn();
  const onToggleCollapse = props?.onToggleCollapse ?? vi.fn();

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AppProviders>
        <Routes>
          <Route
            path="*"
            element={
              <ConvertibleNav
                position={position}
                onChangePosition={onChangePosition}
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
                isDraggingNav={false}
                setIsDraggingNav={vi.fn()}
              />
            }
          />
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Streamlined Navigation Shell with MUI (UIUX-REQ-007)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Top Docking Mode (Tier 1 & Tier 2)', () => {
    it('renders the brand logo without CP PRO MAX text (UIUX-REQ-014)', () => {
      renderConvertibleNav({ position: 'top' });

      expect(screen.getByAltText(/3D Diagnostix/i)).toBeInTheDocument();
      expect(screen.queryByText(/CP PRO MAX/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Clinical Platform/i)).not.toBeInTheDocument();
    });

    it('renders the global spotlight search trigger with keyboard shortcut chip', () => {
      renderConvertibleNav({ position: 'top' });

      expect(screen.getByText(/Spotlight Search.../i)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+K/i)).toBeInTheDocument();
    });

    it('opens dock position selector menu on click and lists all 4 positions', () => {
      const handleChangePosition = vi.fn();
      renderConvertibleNav({ position: 'top', onChangePosition: handleChangePosition });

      const dockBtn = screen.getByTitle(/choose navigation dock position/i);
      expect(dockBtn).toBeInTheDocument();

      fireEvent.click(dockBtn);

      expect(screen.getByText(/dock navbar position/i)).toBeInTheDocument();
      expect(screen.getByText(/top navbar \(fixed\)/i)).toBeInTheDocument();
      expect(screen.getByText(/bottom taskbar/i)).toBeInTheDocument();
      expect(screen.getByText(/left sidebar/i)).toBeInTheDocument();
      expect(screen.getByText(/right sidebar/i)).toBeInTheDocument();

      // Click on Bottom Taskbar option
      fireEvent.click(screen.getByText(/bottom taskbar/i));
      expect(handleChangePosition).toHaveBeenCalledWith('bottom');
    });

    it('opens and closes operator account menu on profile click', () => {
      renderConvertibleNav({ position: 'top' });

      const profileBtn = screen.getByTitle(/operator profile & account menu/i);
      expect(profileBtn).toBeInTheDocument();

      fireEvent.click(profileBtn);

      expect(screen.getByText(/operator profile & credentials/i)).toBeInTheDocument();
      expect(screen.getByText(/security & preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/sign out/i)).toBeInTheDocument();

      // Close on outside click
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText(/security & preferences/i)).not.toBeInTheDocument();
    });

    it('renders Tier 2 navigation items and omits duplicate + Add Case CTA', () => {
      renderConvertibleNav({ position: 'top' });

      expect(screen.getByText(/^dashboard$/i)).toBeInTheDocument();
      expect(screen.getByText(/orders & cases/i)).toBeInTheDocument();
      expect(screen.getByText(/operations & reports/i)).toBeInTheDocument();
      expect(screen.queryByText(/\+ add case/i)).not.toBeInTheDocument();
    });
  });

  describe('Bottom Docking Mode', () => {
    it('renders navigation docked at the bottom with upward positioned dropdowns', () => {
      renderConvertibleNav({ position: 'bottom' });

      const ordersBtn = screen.getByRole('button', { name: /orders & cases/i });
      fireEvent.click(ordersBtn);

      const menu = screen.getByTestId('orders-dropdown-menu');
      expect(menu).toHaveClass('bottom-full', 'mb-2');
    });
  });

  describe('Vertical Sidebar Modes (Left and Right)', () => {
    it('renders 8 navigation links in left sidebar mode', () => {
      renderConvertibleNav({ position: 'left', collapsed: false });

      expect(screen.getByText(/^dashboard$/i)).toBeInTheDocument();
      expect(screen.getByText(/master orders flow/i)).toBeInTheDocument();
      expect(screen.getByText(/add new case/i)).toBeInTheDocument();
      expect(screen.getByText(/order details/i)).toBeInTheDocument();
      expect(screen.getByText(/quarter targets/i)).toBeInTheDocument();
      expect(screen.getByText(/task 47: models/i)).toBeInTheDocument();
      expect(screen.getByText(/task 31: staff targets/i)).toBeInTheDocument();
      expect(screen.getByText(/edit case/i)).toBeInTheDocument();
    });

    it('toggles collapse in sidebar mode', () => {
      const handleToggle = vi.fn();
      renderConvertibleNav({ position: 'left', collapsed: false, onToggleCollapse: handleToggle });

      const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(collapseBtn).toBeInTheDocument();

      fireEvent.click(collapseBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('supports quick dock button to switch from sidebar to top', () => {
      const handleChangePosition = vi.fn();
      renderConvertibleNav({ position: 'left', collapsed: false, onChangePosition: handleChangePosition });

      const topBtn = screen.getByRole('button', { name: /dock as top navbar/i });
      expect(topBtn).toBeInTheDocument();

      fireEvent.click(topBtn);
      expect(handleChangePosition).toHaveBeenCalledWith('top');
    });
  });
});
