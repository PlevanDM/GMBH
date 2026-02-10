/**
 * react-i18next setup for main site (common namespace).
 * Language is read/saved from localStorage key "restart-locale".
 * Sync with BuyerLocaleContext so buyer cabinet and main site use the same locale.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { commonTranslations, type CommonLocaleKey } from './commonTranslations'
import { BUYER_PORTAL_LOCALE_KEYS } from './index'
import { LOCALE_STORAGE_KEY } from './BuyerLocaleContext'

function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && BUYER_PORTAL_LOCALE_KEYS.includes(stored as CommonLocaleKey)) return stored
  return 'en'
}

type CommonResource = { common: Record<string, unknown> }
const resources: Record<string, CommonResource> = {}
for (const lang of Object.keys(commonTranslations) as CommonLocaleKey[]) {
  resources[lang] = { common: commonTranslations[lang] as Record<string, unknown> }
}

i18n.use(initReactI18next).init({
  resources,
  defaultNS: 'common',
  fallbackLng: 'en',
  lng: getStoredLanguage(),
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng)
  }
})

export default i18n
