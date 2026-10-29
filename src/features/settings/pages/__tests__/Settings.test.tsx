import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Settings from '../Settings';
import { AppProviders } from '@/app/providers';

// Mock sound utility
vi.mock('@/shared/utils/sound', () => ({
  sound: {
    playSuccess: vi.fn(),
    playWarning: vi.fn(),
    playClick: vi.fn(),
    playPop: vi.fn(),
  },
}));

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <AppProviders>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Settings Page Simplification & Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Appearance Settings & Clean Boundary', () => {
    it('renders Appearance tab by default with Light, Dark, and System theme controls', () => {
      renderSettings();

      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      expect(screen.getByTestId('settings-appearance-section')).toBeInTheDocument();
      expect(screen.getByTestId('theme-option-dark')).toBeInTheDocument();
      expect(screen.getByTestId('theme-option-light')).toBeInTheDocument();
      expect(screen.getByTestId('theme-option-system')).toBeInTheDocument();
    });

    it('removes unsupported controls (Studio Accent Color, Density, 3D Acceleration, Security, Organizations, Notifications)', () => {
      renderSettings();

      // Removed unsupported controls
      expect(screen.queryByText(/Studio Accent Color/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Grid Table Spacing Density/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Display 3D Acceleration/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Hardware Acceleration/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Two-Factor Authentication/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Active Sessions/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Change Password/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^security$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^organization$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^notifications$/i })).not.toBeInTheDocument();
    });
  });

  describe('2. Language & Region Settings', () => {
    it('switches to Language & Region tab and displays supported languages with English default', () => {
      renderSettings();

      const langTab = screen.getByRole('button', { name: /language & region/i });
      fireEvent.click(langTab);

      expect(screen.getByTestId('settings-language-section')).toBeInTheDocument();
      expect(screen.getByLabelText(/studio language/i)).toBeInTheDocument();

      // Check all 5 supported languages
      expect(screen.getByTestId('lang-btn-en')).toBeInTheDocument();
      expect(screen.getByTestId('lang-btn-fr')).toBeInTheDocument();
      expect(screen.getByTestId('lang-btn-de')).toBeInTheDocument();
      expect(screen.getByTestId('lang-btn-it')).toBeInTheDocument();
      expect(screen.getByTestId('lang-btn-es')).toBeInTheDocument();
    });

    it('changes language and updates global language context and html document lang attribute', () => {
      renderSettings();

      fireEvent.click(screen.getByRole('button', { name: /language & region/i }));

      const select = screen.getByLabelText(/studio language/i);
      fireEvent.change(select, { target: { value: 'fr' } });

      expect(localStorage.getItem('3ddx-language')).toBe('fr');
      expect(document.documentElement.lang).toBe('fr');
    });

    it('renders supported region settings (Date Format and Operational Timezone)', () => {
      renderSettings();

      fireEvent.click(screen.getByRole('button', { name: /language & region/i }));

      expect(screen.getByLabelText(/date format/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/operational timezone/i)).toBeInTheDocument();
    });
  });

  describe('3. Functional Save Action & Feedback', () => {
    it('persists selected settings when Save Settings button is clicked and shows success feedback', async () => {
      renderSettings();

      // Select light theme
      fireEvent.click(screen.getByTestId('theme-option-light'));

      // Switch to language tab and configure region
      fireEvent.click(screen.getByRole('button', { name: /language & region/i }));
      fireEvent.change(screen.getByLabelText(/date format/i), { target: { value: 'YYYY-MM-DD' } });
      fireEvent.change(screen.getByLabelText(/operational timezone/i), { target: { value: 'Europe/Paris' } });

      // Click Save Settings
      const saveBtn = screen.getByTestId('save-settings-button');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByTestId('save-status-banner')).toBeInTheDocument();
        expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
      });

      expect(localStorage.getItem('dentalab-theme')).toBe('light');
      expect(localStorage.getItem('3ddx-date-format')).toBe('YYYY-MM-DD');
      expect(localStorage.getItem('3ddx-timezone')).toBe('Europe/Paris');
    });
  });
});
