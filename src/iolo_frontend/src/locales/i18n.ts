// i18n.js
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import enTranslation from './en.json';
import deTranslation from './de.json';
import frTranslation from './fr.json';
import itTranslation from './it.json';
import esTranslation from './es.json';

export const supportedLanguage = ['en', 'de', 'fr', 'it', 'es']

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            fr: { translation: frTranslation },
            de: { translation: deTranslation },
            it: { translation: itTranslation },
            es: { translation: esTranslation },
        },
        lng: 'en', // Set the default language
        fallbackLng: 'en', // Fallback to English if translation missing
        interpolation: {
            escapeValue: false, // React already safely escapes interpolated strings
        },
    });

export default i18n;
