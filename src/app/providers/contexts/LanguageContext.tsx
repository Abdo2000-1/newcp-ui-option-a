import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from './translations';

export type LanguageCode = 'en' | 'fr' | 'de' | 'it' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
  nativeName: string;
  flagUrl: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English', flagUrl: `${import.meta.env.BASE_URL}flags/en.svg` },
  { code: 'fr', label: 'French', flag: '🇫🇷', nativeName: 'Français', flagUrl: `${import.meta.env.BASE_URL}flags/fr.svg` },
  { code: 'de', label: 'German', flag: '🇩🇪', nativeName: 'Deutsch', flagUrl: `${import.meta.env.BASE_URL}flags/de.svg` },
  { code: 'it', label: 'Italian', flag: '🇮🇹', nativeName: 'Italiano', flagUrl: `${import.meta.env.BASE_URL}flags/it.svg` },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', nativeName: 'Español', flagUrl: `${import.meta.env.BASE_URL}flags/es.svg` },
];

export function LanguageFlag({
  code,
  className = 'w-4 h-3 rounded-xs object-cover shadow-2xs inline-block shrink-0',
  alt,
}: {
  code: LanguageCode;
  className?: string;
  alt?: string;
}) {
  const flagUrl = `${import.meta.env.BASE_URL}flags/${code}.svg`;
  const lang = LANGUAGES.find((l) => l.code === code);
  const flagAlt = alt || lang?.label || code;

  return (
    <img
      src={flagUrl}
      alt={flagAlt}
      data-testid={`flag-${code}`}
      className={className}
      loading="lazy"
    />
  );
}

export { TRANSLATIONS };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentOption: LanguageOption;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('3ddx-language');
      if (saved && (saved === 'en' || saved === 'fr' || saved === 'de' || saved === 'it' || saved === 'es')) {
        return saved;
      }
    } catch {
      // ignore storage access errors
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    if (lang === 'en' || lang === 'fr' || lang === 'de' || lang === 'it' || lang === 'es') {
      setLanguageState(lang);
      try {
        localStorage.setItem('3ddx-language', lang);
      } catch {
        // ignore storage access errors
      }
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore in non-browser environments
    }
  }, [language]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === '3ddx-language' && e.newValue) {
        if (['en', 'fr', 'de', 'it', 'es'].includes(e.newValue)) {
          setLanguageState(e.newValue as LanguageCode);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const t = (key: string, defaultText?: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentOption, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe default fallback for isolated testing and environments outside LanguageProvider
    return {
      language: 'en' as LanguageCode,
      setLanguage: () => {},
      currentOption: LANGUAGES[0],
      t: (key: string, defaultText?: string) => TRANSLATIONS.en[key] || defaultText || key,
    };
  }
  return context;
}
