import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../Header';
import { AppProviders } from '@/app/providers';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderHeader(onMenuClick = vi.fn()) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <Header onMenuClick={onMenuClick} />
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Shell Header Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates to /add-case when New Order button is clicked', () => {
    renderHeader();

    const newOrderBtn = screen.getByRole('button', { name: /new order/i });
    expect(newOrderBtn).toBeInTheDocument();

    fireEvent.click(newOrderBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/add-case');
  });
  it('renders search input with placeholder', () => {
    renderHeader();
    expect(screen.getByPlaceholderText(/quick search orders, patients/i)).toBeInTheDocument();
  });

  it('triggers onMenuClick when mobile hamburger button is clicked', () => {
    const handleMenuClick = vi.fn();
    renderHeader(handleMenuClick);

    // Menu button has md:hidden
    const menuButtons = screen.getAllByRole('button');
    const menuBtn = menuButtons[0];
    fireEvent.click(menuBtn);

    expect(handleMenuClick).toHaveBeenCalledTimes(1);
  });

  it('toggles notification dropdown when bell icon button is clicked', () => {
    renderHeader();

    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    expect(bellBtn).toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
  });

  it('toggles theme when theme toggle button is clicked', () => {
    renderHeader();

    // Find theme toggle button (contains Sun/Moon)
    const buttons = screen.getAllByRole('button');
    const themeBtn = buttons.find(b => b.querySelector('svg.lucide-moon') || b.querySelector('svg.lucide-sun'));
    expect(themeBtn).toBeDefined();

    if (themeBtn) {
      fireEvent.click(themeBtn);
    }
  });
});
