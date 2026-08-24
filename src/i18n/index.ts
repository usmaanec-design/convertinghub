import i18n, { Namespace, ParseKeys } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const validNamespaces = [
  'string',
  'number',
  'video',
  'list',
  'json',
  'time',
  'csv',
  'pdf',
  'audio',
  'xml',
  'translation',
  'image',
  'converters'
] as const satisfies readonly Namespace[];

export type I18nNamespaces = (typeof validNamespaces)[number];
export type FullI18nKey = {
  [K in I18nNamespaces]: `${K}:${ParseKeys<K>}`;
}[I18nNamespaces];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [
      'en',
      'ar',
      'ur',
      'de',
      'es',
      'fr',
      'pt',
      'ja',
      'hi',
      'nl',
      'ru',
      'zh'
    ],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    detection: {
      lookupLocalStorage: 'lang',
      caches: ['localStorage']
    }
  });

i18n.on('languageChanged', (lng) => {
  const isRtl = lng === 'ar' || lng === 'ur' || lng.startsWith('ur');
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Initial direction setting
const initialLang = localStorage.getItem('lang') || 'en';
const initialRtl =
  initialLang === 'ar' || initialLang === 'ur' || initialLang.startsWith('ur');
document.documentElement.dir = initialRtl ? 'rtl' : 'ltr';

export default i18n;
