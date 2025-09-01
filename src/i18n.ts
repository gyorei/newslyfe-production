import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTs from './locales/en';
import huTs from './locales/hu';

// i18next konfiguráció

const detectLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('lang');
  if (saved) return saved;
  const nav = navigator.language || (navigator as any).userLanguage || 'en';
  const code = nav.split('-')[0];
  return ['en', 'hu', 'es', 'de', 'fr'].includes(code) ? code : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTs },
      hu: { translation: huTs },
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV !== 'production',
  });

i18n.on('languageChanged', (lng) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lng);
      document.documentElement.lang = lng;
    }
  } catch {}
});

export default i18n; 