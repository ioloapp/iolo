// i18n.js
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import enTranslation from './en.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            //TODO fr: { translation: frTranslation },
            //TODO de: { translation: deTranslation },
        },
        lng: 'en', // Set the default language
        fallbackLng: 'en', // Fallback to English if translation missing
        interpolation: {
            escapeValue: false, // React already safely escapes interpolated strings
        },
    });

export default i18n;
