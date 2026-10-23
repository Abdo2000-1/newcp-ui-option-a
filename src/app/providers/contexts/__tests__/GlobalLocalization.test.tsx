import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { Layout } from '@/app/shell/Layout';
import Dashboard from '@/features/reporting/pages/Dashboard';
import AddCase from '@/features/orders/pages/AddCase';
import OrderDetailsPage from '@/features/orders/pages/OrderDetailsPage';
import WorkflowBoard from '@/features/orders/pages/WorkflowBoard';
import Settings from '@/features/settings/pages/Settings';
import { useLanguage, LanguageFlag } from '../LanguageContext';

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

// Mock recharts ResponsiveContainer
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

function LanguageControlHelper() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div data-testid="lang-helper">
      <span data-testid="helper-lang">{language}</span>
      <span data-testid="fallback-test">{t('test.untranslated.key', 'Explicit Fallback Text')}</span>
      <button onClick={() => setLanguage('es')}>Switch ES</button>
      <button onClick={() => setLanguage('fr')}>Switch FR</button>
      <button onClick={() => setLanguage('de')}>Switch DE</button>
      <button onClick={() => setLanguage('it')}>Switch IT</button>
      <button onClick={() => setLanguage('en')}>Switch EN</button>
    </div>
  );
}

describe('Global Application Localization (UIUX-REQ-004)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Language switching through Shell and Settings', () => {
    it('switches language through Settings and updates document.documentElement.lang', () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <AppProviders>
            <Settings />
          </AppProviders>
        </MemoryRouter>
      );

      // In Settings, switch to Language & Region tab
      const langTab = screen.getByRole('button', { name: /language & region/i });
      fireEvent.click(langTab);

      // Select Spanish option from Studio Language select
      const langSelect = screen.getByLabelText(/studio language/i);
      fireEvent.change(langSelect, { target: { value: 'es' } });

      expect(localStorage.getItem('3ddx-language')).toBe('es');
      expect(document.documentElement.lang).toBe('es');
    });

    it('switches language via global shell navbar dropdown', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppProviders>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<div data-testid="child-page">Home Content</div>} />
              </Route>
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );

      // Open Language Switcher button in navbar
      const langBtn = screen.getByTitle(/change system language/i);
      fireEvent.click(langBtn);

      // Select French option
      const frOption = screen.getByText('Français');
      fireEvent.click(frOption);

      expect(localStorage.getItem('3ddx-language')).toBe('fr');
      expect(document.documentElement.lang).toBe('fr');
    });
  });

  describe('Application-wide translation of pages', () => {
    it('translates Dashboard UI when language is set to French (fr)', () => {
      localStorage.setItem('3ddx-language', 'fr');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Centre de Contrôle')).toBeInTheDocument();
      expect(screen.getByText('Analytique en Direct')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analytique power bi/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /file de production/i })).toBeInTheDocument();
    });

    it('translates Dashboard UI when language is set to German (de)', () => {
      localStorage.setItem('3ddx-language', 'de');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Leitzentrale')).toBeInTheDocument();
      expect(screen.getByText('Echtzeit-Analytik')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /power bi analysen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /produktionswarteschlange/i })).toBeInTheDocument();
    });

    it('translates Add Case steps and buttons into Spanish (es)', () => {
      localStorage.setItem('3ddx-language', 'es');

      render(
        <MemoryRouter initialEntries={['/add-case']}>
          <AppProviders>
            <AddCase />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Médico y Paciente')).toBeInTheDocument();
      expect(screen.getByText('Servicios y Especificaciones Guía')).toBeInTheDocument();
      expect(screen.getByText('Odontograma (1-32)')).toBeInTheDocument();
      expect(screen.getByText('Escaneos y Notas Internas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
    });

    it('translates validation error messages into French (fr)', () => {
      localStorage.setItem('3ddx-language', 'fr');

      render(
        <MemoryRouter initialEntries={['/add-case']}>
          <AppProviders>
            <AddCase />
          </AppProviders>
        </MemoryRouter>
      );

      // Attempt to continue with empty fields to trigger validation
      const continueBtn = screen.getByRole('button', { name: /continuer/i });
      fireEvent.click(continueBtn);

      expect(screen.getByText('Le prénom est requis')).toBeInTheDocument();
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
      expect(screen.getByText('L’identifiant du dossier est requis')).toBeInTheDocument();
    });

    it('translates Order Details section headers into Italian (it)', () => {
      localStorage.setItem('3ddx-language', 'it');

      render(
        <MemoryRouter initialEntries={['/order-details?id=504901']}>
          <AppProviders>
            <OrderDetailsPage />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText(/panoramica ordine & medico/i)).toBeInTheDocument();
      expect(screen.getByText(/anteprima 3d cad \/ sezioni dicom/i)).toBeInTheDocument();
      expect(screen.getByText(/matrice sotto-ordini/i)).toBeInTheDocument();
    });

    it('translates Workflow Board into Spanish (es)', () => {
      localStorage.setItem('3ddx-language', 'es');

      render(
        <MemoryRouter initialEntries={['/workflow-board']}>
          <AppProviders>
            <WorkflowBoard />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByText('Tablero de Flujo Clínico')).toBeInTheDocument();
    });
  });

  describe('Fallback, Persistence, and Flag Rendering', () => {
    it('safely renders fallback text for missing translation keys', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <LanguageControlHelper />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('fallback-test')).toHaveTextContent('Explicit Fallback Text');
    });

    it('persists language across remounts via localStorage', () => {
      localStorage.setItem('3ddx-language', 'de');

      const { unmount } = render(
        <MemoryRouter>
          <AppProviders>
            <LanguageControlHelper />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('helper-lang')).toHaveTextContent('de');
      unmount();

      render(
        <MemoryRouter>
          <AppProviders>
            <LanguageControlHelper />
          </AppProviders>
        </MemoryRouter>
      );

      expect(screen.getByTestId('helper-lang')).toHaveTextContent('de');
    });

    it('renders all 5 country flags with valid BASE_URL paths and testids', () => {
      render(
        <div>
          <LanguageFlag code="en" />
          <LanguageFlag code="fr" />
          <LanguageFlag code="de" />
          <LanguageFlag code="it" />
          <LanguageFlag code="es" />
        </div>
      );

      expect(screen.getByTestId('flag-en')).toHaveAttribute('src', expect.stringContaining('flags/en.svg'));
      expect(screen.getByTestId('flag-fr')).toHaveAttribute('src', expect.stringContaining('flags/fr.svg'));
      expect(screen.getByTestId('flag-de')).toHaveAttribute('src', expect.stringContaining('flags/de.svg'));
      expect(screen.getByTestId('flag-it')).toHaveAttribute('src', expect.stringContaining('flags/it.svg'));
      expect(screen.getByTestId('flag-es')).toHaveAttribute('src', expect.stringContaining('flags/es.svg'));
    });
  });
});
