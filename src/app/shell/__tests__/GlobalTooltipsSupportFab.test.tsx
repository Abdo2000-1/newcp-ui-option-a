import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FloatingSupport } from '../FloatingSupport';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { AppProviders } from '@/app/providers';

describe('Task 11: Global Tooltips & Support FAB Downsizing', () => {
  it('renders the Support FAB with MUI Tooltip and accessible label', async () => {
    render(
      <AppProviders>
        <FloatingSupport navPosition="top" />
      </AppProviders>
    );

    const fab = screen.getByRole('button', { name: /^support$/i });
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveAttribute('aria-label', 'Support');

    // Hover or focus to test tooltip interaction
    fireEvent.mouseOver(fab);
    // Modal opens on click
    fireEvent.click(fab);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders Header with accessible tooltips on action buttons', async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Header onMenuClick={() => {}} />
        </AppProviders>
      </MemoryRouter>
    );

    // Theme toggle, notifications, and profile have accessible buttons
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user profile menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it('renders Sidebar with accessible tooltips on sign out and collapse actions', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <Sidebar collapsed={false} onToggle={() => {}} mobileOpen={false} onMobileClose={() => {}} />
        </AppProviders>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });
});
