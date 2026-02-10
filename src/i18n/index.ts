import { buyerPortalLocales, type BuyerPortalLocaleKey } from './buyerPortal'
import { sellerPortalLocales } from './sellerPortal'

export { buyerPortalLocales, type BuyerPortalLocaleKey }
export type BuyerPortalLocale = (typeof buyerPortalLocales)[BuyerPortalLocaleKey]

/** Список кодов языков кабинета покупателя */
export const BUYER_PORTAL_LOCALE_KEYS: BuyerPortalLocaleKey[] = ['en', 'ro', 'es', 'de', 'pl', 'uk', 'ru']

/**
 * Возвращает объект локалей для выбранного языка. Fallback: en.
 */
export function getBuyerPortalLocale(locale: string): BuyerPortalLocale {
  const key = BUYER_PORTAL_LOCALE_KEYS.includes(locale as BuyerPortalLocaleKey)
    ? (locale as BuyerPortalLocaleKey)
    : 'en'
  return buyerPortalLocales[key]
}

export type SellerPortalLocaleKey = keyof typeof sellerPortalLocales
export type SellerPortalLocale = (typeof sellerPortalLocales)[SellerPortalLocaleKey]

export function getSellerPortalLocale(locale: string): SellerPortalLocale {
  // Currently seller portal only supports en and ru
  const key = (['en', 'ru'].includes(locale) ? locale : 'en') as SellerPortalLocaleKey
  return sellerPortalLocales[key]
}
