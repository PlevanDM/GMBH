import React from 'react'
import { getSellerPortalLocale, type SellerPortalLocaleKey } from './index'
import type { SellerPortalLocale } from './index'

export const SELLER_LOCALE_STORAGE_KEY = 'restart-my-locale'
export const SELLER_LOCALE_KEYS: SellerPortalLocaleKey[] = ['en', 'ro', 'es', 'de', 'pl', 'uk', 'ru']

function getStoredLocale(): SellerPortalLocaleKey {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(SELLER_LOCALE_STORAGE_KEY)
  if (stored && SELLER_LOCALE_KEYS.includes(stored as SellerPortalLocaleKey)) return stored as SellerPortalLocaleKey
  return 'en'
}

const SellerLocaleContext = React.createContext<{
  t: SellerPortalLocale
  locale: SellerPortalLocaleKey
  setLocale: (l: string) => void
}>({
  t: getSellerPortalLocale('en'),
  locale: 'en',
  setLocale: () => {},
})

export const SellerLocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = React.useState<SellerPortalLocaleKey>(() => getStoredLocale())
  const [t, setT] = React.useState<SellerPortalLocale>(() => getSellerPortalLocale(getStoredLocale()))

  const setLocale = (l: string) => {
    const key = SELLER_LOCALE_KEYS.includes(l as SellerPortalLocaleKey) ? (l as SellerPortalLocaleKey) : 'en'
    localStorage.setItem(SELLER_LOCALE_STORAGE_KEY, key)
    setLocaleState(key)
    setT(getSellerPortalLocale(key))
  }

  return (
    <SellerLocaleContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </SellerLocaleContext.Provider>
  )
}

export const useSellerLocale = () => React.useContext(SellerLocaleContext)
