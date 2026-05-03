/**
 * i18n/index.js — Internationalisation configuration.
 *
 * Initialises i18next with English and Arabic translation bundles.
 * Language preference is persisted in localStorage under 'phishaware-language'.
 * RTL/LTR direction and the <html lang> attribute are updated whenever the
 * language changes so the layout responds correctly to Arabic text.
 *
 * Exports: i18n (default), changeLanguage
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import ar from './ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'phishaware-language'
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    react: {
      useSuspense: true
    }
  });

// Function to change language and update document direction
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);

  // Update document direction for RTL support
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;

  // Store language preference
  localStorage.setItem('phishaware-language', lang);
};

// Initialize direction on load
const currentLang = i18n.language || 'en';
document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLang;

export default i18n;
