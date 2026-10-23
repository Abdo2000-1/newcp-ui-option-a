import { en } from './en';
import { fr } from './fr';
import { de } from './de';
import { it } from './it';
import { es } from './es';
import type { LanguageCode } from '../LanguageContext';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en,
  fr,
  de,
  it,
  es,
};

export { en, fr, de, it, es };
