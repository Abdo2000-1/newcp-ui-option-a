import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../Footer';
import { FloatingSupport } from '../FloatingSupport';
import { AppProviders } from '@/app/providers';

describe('UIUX-REQ-017: Footer Modernization & Floating Support FAB Downsizing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Footer Component', () => {
    it('renders the modernized footer with data-testid="shell-footer"', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Footer navPosition="top" />
          </AppProviders>
        </MemoryRouter>
      );

      const footer = screen.getByTestId('shell-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('3D');
      expect(footer).toHaveTextContent('Diagnostix');
      expect(footer).toHaveTextContent('.COM');
    });

    it('renders legal and documentation links with proper destinations', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Footer navPosition="top" />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /^faq$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^terms$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^privacy$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^contact$/i })).toBeInTheDocument();
    });

    it('renders current year copyright notice', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Footer navPosition="top" />
          </AppProviders>
        </MemoryRouter>
      );

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`Copyright © ${currentYear} -3D Diagnostix,Inc\\. - All Rights Reserved`, 'i'))).toBeInTheDocument();
    });

    it('renders accessible social media icon links', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Footer navPosition="top" />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute('href', 'https://facebook.com');
      expect(screen.getByRole('link', { name: /youtube/i })).toHaveAttribute('href', 'https://youtube.com');
      expect(screen.getByRole('link', { name: /^x$/i })).toHaveAttribute('href', 'https://x.com');
      expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute('href', 'https://instagram.com');
    });
  });

  describe('Floating Support FAB Component', () => {
    it('renders the downsized accessible Support FAB', () => {
      render(
        <AppProviders>
          <FloatingSupport navPosition="top" />
        </AppProviders>
      );

      const fab = screen.getByRole('button', { name: /^support$/i });
      expect(fab).toBeInTheDocument();
      expect(fab).toHaveAttribute('aria-label', 'Support');
    });

    it('positions the FAB with offset when navigation is docked at the bottom', () => {
      const { rerender } = render(
        <AppProviders>
          <FloatingSupport navPosition="top" />
        </AppProviders>
      );

      let fab = screen.getByRole('button', { name: /^support$/i });
      let container = fab.closest('.fixed');
      expect(container).toHaveClass('bottom-4');
      expect(container).not.toHaveClass('bottom-[116px]');

      rerender(
        <AppProviders>
          <FloatingSupport navPosition="bottom" />
        </AppProviders>
      );

      fab = screen.getByRole('button', { name: /^support$/i });
      container = fab.closest('.fixed');
      expect(container).toHaveClass('bottom-[116px]');
    });

    it('opens and closes the support dialog when clicked', async () => {
      render(
        <AppProviders>
          <FloatingSupport navPosition="top" />
        </AppProviders>
      );

      const fab = screen.getByRole('button', { name: /^support$/i });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click(fab);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/3DDX Telemedicine Support/i)).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /close support dialog/i });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('handles message submission and displays confirmation feedback', async () => {
      render(
        <AppProviders>
          <FloatingSupport navPosition="top" />
        </AppProviders>
      );

      fireEvent.click(screen.getByRole('button', { name: /^support$/i }));

      const messageInput = screen.getByPlaceholderText(/describe your inquiry/i);
      fireEvent.change(messageInput, { target: { value: 'Inquiry regarding DICOM series alignment.' } });

      const submitBtn = screen.getByRole('button', { name: /send ticket/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Ticket Dispatched!/i)).toBeInTheDocument();
    });
  });
});
