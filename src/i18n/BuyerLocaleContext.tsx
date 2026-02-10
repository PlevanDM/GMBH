import React from 'react'
import { getBuyerPortalLocale, BUYER_PORTAL_LOCALE_KEYS, type BuyerPortalLocaleKey } from './index'
import type { BuyerPortalLocale } from './index'

export const LOCALE_STORAGE_KEY = 'restart-locale'

function getStoredLocale(): string {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && BUYER_PORTAL_LOCALE_KEYS.includes(stored as BuyerPortalLocaleKey)) return stored
  return 'en'
}

const BuyerLocaleContext = React.createContext<{
  t: BuyerPortalLocale
  locale: string
  setLocale: (l: string) => void
}>({
  t: getBuyerPortalLocale('en'),
  locale: 'en',
  setLocale: () => {},
})

export const BuyerLocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = React.useState<string>(() => getStoredLocale())
  const [t, setT] = React.useState<BuyerPortalLocale>(() => getBuyerPortalLocale(getStoredLocale()))

  const setLocale = (l: string) => {
    const key = BUYER_PORTAL_LOCALE_KEYS.includes(l as BuyerPortalLocaleKey) ? l : 'en'
    localStorage.setItem(LOCALE_STORAGE_KEY, key)
    setLocaleState(key)
    setT(getBuyerPortalLocale(key))
  }

  return (
    <BuyerLocaleContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </BuyerLocaleContext.Provider>
  )
}

export const useBuyerLocale = () => React.useContext(BuyerLocaleContext)

export { BUYER_PORTAL_LOCALE_KEYS }
