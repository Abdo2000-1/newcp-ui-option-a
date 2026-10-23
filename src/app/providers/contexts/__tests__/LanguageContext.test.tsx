import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider, useLanguage, LanguageFlag, LANGUAGES } from '../LanguageContext';
import Settings from '@/features/settings/pages/Settings';
import { AppProviders } from '@/app/providers';

function ConsumerComponent() {
  const { language, setLanguage, currentOption, t } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="native-name">{currentOption.nativeName}</span>
      <span data-testid="translated-title">{t('brand.name')}</span>
      <span data-testid="fallback-english">{t('col.serial')}</span>
      <span data-testid="fallback-default">{t('non.existent.key', 'Safe Fallback Value')}</span>
      <span data-testid="fallback-key">{t('completely.unknown.key')}</span>
      <LanguageFlag code={language} />
      <button onClick={() => setLanguage('de')}>Set German</button>
      <button onClick={() => setLanguage('fr')}>Set French</button>
      <button onClick={() => setLanguage('es')}>Set Spanish</button>
      <button onClick={() => setLanguage('it')}>Set Italian</button>
    </div>
  );
}

describe('Localization Flags & LanguageContext Binding (UIUX-REQ-004)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('LanguageContext state & defaults', () => {
    it('initializes with default English (en) language when storage is empty', () => {
      render(
        <LanguageProvider>
          <ConsumerComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('native-name')).toHaveTextContent('English');
      expect(screen.getByTestId('flag-en')).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('en');
    });

    it('updates language and translates strings when language is changed', () => {
      render(
        <LanguageProvider>
          <ConsumerComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByText('Set German'));

      expect(screen.getByTestId('current-lang')).toHaveTextContent('de');
      expect(screen.getByTestId('native-name')).toHaveTextContent('Deutsch');
      expect(screen.getByTestId('flag-de')).toBeInTheDocument();
      expect(localStorage.getItem('3ddx-language')).toBe('de');
      expect(document.documentElement.lang).toBe('de');
    });

    it('persists language selection across remounts via localStorage', () => {
      localStorage.setItem('3ddx-language', 'fr');

      const { unmount } = render(
        <LanguageProvider>
          <ConsumerComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-lang')).toHaveTextContent('fr');
      expect(screen.getByTestId('native-name')).toHaveTextContent('Français');
      expect(screen.getByTestId('flag-fr')).toBeInTheDocument();

      unmount();

      render(
        <LanguageProvider>
          <ConsumerComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-lang')).toHaveTextContent('fr');
      expect(screen.getByTestId('native-name')).toHaveTextContent('Français');
    });

    it('safely handles missing translations using fallback priority (English -> defaultText -> key)', () => {
      render(
        <LanguageProvider>
          <ConsumerComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByText('Set Spanish'));

      // Safe fallback with defaultText
      expect(screen.getByTestId('fallback-default')).toHaveTextContent('Safe Fallback Value');
      // Safe fallback with key
      expect(screen.getByTestId('fallback-key')).toHaveTextContent('completely.unknown.key');
    });
  });

  describe('Flag asset resolution & base URL', () => {
    it('resolves flag assets with proper base URL and without hardcoded root paths', () => {
      render(
        <LanguageProvider>
          {LANGUAGES.map((opt) => (
            <LanguageFlag key={opt.code} code={opt.code} />
          ))}
        </LanguageProvider>
      );

      for (const opt of LANGUAGES) {
        const flagImg = screen.getByTestId(`flag-${opt.code}`);
        expect(flagImg).toBeInTheDocument();
        const src = flagImg.getAttribute('src');
        expect(src).toBe(`${import.meta.env.BASE_URL}flags/${opt.code}.svg`);
        expect(src?.startsWith('http://') || src?.startsWith('https://') || src?.startsWith('/') || src?.startsWith('.')).toBe(true);
      }
    });
  });

  describe('Settings page synchronization', () => {
    it('synchronizes LanguageContext when language is selected in Settings', () => {
      render(
        <MemoryRouter>
          <AppProviders>
            <Settings />
          </AppProviders>
        </MemoryRouter>
      );

      // Navigate to Language & Region tab in Settings
      const langTab = screen.getByRole('button', { name: /language & region/i });
      fireEvent.click(langTab);

      const select = screen.getByLabelText(/studio language/i) as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('en');

      // Change language to Italian
      fireEvent.change(select, { target: { value: 'it' } });

      expect(select.value).toBe('it');
      expect(localStorage.getItem('3ddx-language')).toBe('it');
      expect(screen.getByTestId('flag-it')).toBeInTheDocument();
    });
  });
});
