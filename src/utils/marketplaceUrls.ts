/**
 * Посилання на пошук цін у великих європейських маркетах (open source — користувач сам переглядає актуальні ціни).
 * Idealo (DE/AT/FR), Geizhals (DACH), Google Shopping, Amazon DE.
 */

export interface MarketplaceLink {
  id: string
  label: string
  url: string
  region: string
}

/**
 * Побудова пошукового запиту для товару: бренд + модель/назва (латиницею для кращого пошуку на DE/EU сайтах).
 */
export function getProductSearchQuery(brand: string, name: string, model?: string): string {
  const cleanName = name
    .replace(/^Зарядна станція\s+/i, '')
    .replace(/^Додаткова батарея для\s+/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim()
  const part = model || cleanName
  return `${brand} ${part}`.trim()
}

/**
 * URL пошуку на Idealo (Німеччина) — порівняння цін.
 * Формат: https://www.idealo.de/preisvergleich/MainSearchProduct.html?q=...
 */
export function getIdealoSearchUrl(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.idealo.de/preisvergleich/MainSearchProduct.html?q=${encoded}`
}

/**
 * URL пошуку на Geizhals (DACH — DE, AT, CH).
 * Формат: https://geizhals.eu/?fs=...
 */
export function getGeizhalsSearchUrl(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://geizhals.eu/?fs=${encoded}`
}

/**
 * URL пошуку в Google Shopping (Європа).
 */
export function getGoogleShoppingSearchUrl(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.google.com/search?tbm=shop&q=${encoded}`
}

/**
 * URL пошуку на Amazon.de (Німеччина).
 */
export function getAmazonDeSearchUrl(query: string): string {
  const encoded = encodeURIComponent(query)
  return `https://www.amazon.de/s?k=${encoded}`
}

/**
 * Усі посилання на маркети для одного пошукового запиту.
 */
export function getMarketplaceLinks(query: string): MarketplaceLink[] {
  return [
    { id: 'idealo', label: 'Idealo.de', url: getIdealoSearchUrl(query), region: 'DE' },
    { id: 'geizhals', label: 'Geizhals', url: getGeizhalsSearchUrl(query), region: 'DACH' },
    { id: 'google', label: 'Google Shopping', url: getGoogleShoppingSearchUrl(query), region: 'EU' },
    { id: 'amazon', label: 'Amazon.de', url: getAmazonDeSearchUrl(query), region: 'DE' },
  ]
}
