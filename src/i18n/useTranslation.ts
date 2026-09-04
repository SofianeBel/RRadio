import { translations, Language, Translations } from './translations';

export const useTranslation = (language: Language = 'fr'): { t: Translations; language: Language } => {
  const currentLang: Language = language === 'en' ? 'en' : 'fr';
  const t = translations[currentLang];
  return { t, language: currentLang };
};
