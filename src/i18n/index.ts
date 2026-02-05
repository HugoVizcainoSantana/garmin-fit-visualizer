import i18next from 'i18next';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  }
};

i18next
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;