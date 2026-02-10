/**
 * Справочники (каталоги) для выпадающих списков и автоподстановки.
 * Используются в инвентаре, витрине, фильтрах. База для брендов/категорий/процессоров/локаций.
 */

export const CATEGORIES = [
  'Ноутбук',
  'Монитор',
  'Телефон',
  'Планшет',
  'Системный блок',
  'Дисплей',
  'Плата',
  'Комплектующие',
  'Оборудование',
  'Прочее',
] as const

export const BRANDS = [
  'Apple',
  'Dell',
  'HP',
  'Lenovo',
  'Samsung',
  'Acer',
  'Asus',
  'MSI',
  'Microsoft',
  'Google',
  'Xiaomi',
  'Huawei',
  'Motorola',
  'OnePlus',
  'Sony',
  'LG',
  'AOC',
  'BenQ',
  'Прочее',
] as const

export const PROCESSORS = [
  'Intel Core i3',
  'Intel Core i5',
  'Intel Core i7',
  'Intel Core i9',
  'Intel Xeon',
  'Apple M1',
  'Apple M2',
  'Apple M3',
  'Apple M4',
  'AMD Ryzen 3',
  'AMD Ryzen 5',
  'AMD Ryzen 7',
  'AMD Ryzen 9',
  'Qualcomm Snapdragon',
  'MediaTek',
  '2.2GHZ',
  '2.6GHZ',
  '2.7GHZ',
  '2.8GHZ',
  '3.0GHZ',
  'I7 6820HQ',
  'I7 7820HQ',
  'I7 8850H',
  'I7 9850H',
  'Прочее',
] as const

/** Локации: нормализованные ключи (EN, без дат) для хранения и фильтра. */
export const LOCATIONS = [
  'Kyiv',
  'Odesa',
  'Bucharest',
  'Warsaw',
  'Berlin',
  'Cologne',
  'Prague',
  'Budapest',
  'Madrid',
  'Other',
] as const

/** Display labels for locations — clean, no flags, multilingual-friendly */
export const LOCATION_DISPLAY: Record<string, string> = {
  // Normalized keys
  'Kyiv':      'Ukraine, Kyiv',
  'Odesa':     'Ukraine, Odesa',
  'Bucharest': 'Romania, Bucharest',
  'Warsaw':    'Poland, Warsaw',
  'Berlin':    'Germany, Berlin',
  'Cologne':   'Germany, Cologne',
  'Prague':    'Czech Republic, Prague',
  'Budapest':  'Hungary, Budapest',
  'Madrid':    'Spain, Madrid',
  'Other':     'Other',
  // Legacy aliases (from old imports / seed data)
  'UKRAINE 11/01/25': 'Ukraine, Kyiv',
  'UKRAINE 07/12/24': 'Ukraine, Kyiv',
  'UKRAINE':          'Ukraine',
  'Киев':             'Ukraine, Kyiv',
  'Київ':             'Ukraine, Kyiv',
  'Одесса':           'Ukraine, Odesa',
  'Одеса':            'Ukraine, Odesa',
  'Варшава':          'Poland, Warsaw',
  'Берлин':           'Germany, Berlin',
  'Берлін':           'Germany, Berlin',
  'Кельн':            'Germany, Cologne',
  'Прага':            'Czech Republic, Prague',
  'Будапешт':         'Hungary, Budapest',
  'Мадрид':           'Spain, Madrid',
  'Прочее':           'Other',
}

/**
 * Парсит сырую строку локации (например "UKRAINE 11/01/25") в название и дату.
 * Если даты нет, dateOnly = null.
 */
export function parseLocationRaw(raw: string): { locationOnly: string; dateOnly: string | null } {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { locationOnly: '—', dateOnly: null }
  const match = trimmed.match(/^(.+?)\s+(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})$/);
  if (match) {
    const locationOnly = match[1].trim();
    const d = match[2].replace(/-/g, '.').replace(/\//g, '.');
    return { locationOnly, dateOnly: d };
  }
  return { locationOnly: trimmed, dateOnly: null };
}

// Legacy alias → closest LOCATIONS key
const _LEGACY_TO_NORM: Record<string, string> = {
  'UKRAINE 11/01/25': 'Kyiv',
  'UKRAINE 07/12/24': 'Kyiv',
  'UKRAINE':          'Kyiv',
  'Киев':             'Kyiv',
  'Київ':             'Kyiv',
  'Одесса':           'Odesa',
  'Одеса':            'Odesa',
  'Варшава':          'Warsaw',
  'Берлин':           'Berlin',
  'Берлін':           'Berlin',
  'Кельн':            'Cologne',
  'Прага':            'Prague',
  'Будапешт':         'Budapest',
  'Мадрид':           'Madrid',
  'Прочее':           'Other',
}

/** Normalizes any location string to a standard LOCATIONS key. */
export function normalizeLocationKey(raw: string): string {
  if (!raw) return 'Other'
  const trimmed = raw.trim()
  // Already a normalized key?
  if ((LOCATIONS as readonly string[]).includes(trimmed)) return trimmed
  // Legacy alias?
  if (_LEGACY_TO_NORM[trimmed]) return _LEGACY_TO_NORM[trimmed]
  // Try parsed (strip date)
  const parsed = parseLocationRaw(trimmed)
  if ((LOCATIONS as readonly string[]).includes(parsed.locationOnly)) return parsed.locationOnly
  if (_LEGACY_TO_NORM[parsed.locationOnly]) return _LEGACY_TO_NORM[parsed.locationOnly]
  // Case-insensitive
  const lower = parsed.locationOnly.toLowerCase()
  for (const loc of LOCATIONS) {
    if (loc.toLowerCase() === lower) return loc
  }
  for (const [alias, norm] of Object.entries(_LEGACY_TO_NORM)) {
    if (alias.toLowerCase() === lower) return norm
  }
  return trimmed // return as-is if nothing matches
}

export function getLocationDisplayLabel(raw: string): string {
  if (!raw) return '—'
  // Try exact match first
  if (LOCATION_DISPLAY[raw]) return LOCATION_DISPLAY[raw]
  // Try parsed location name (e.g. "UKRAINE" from "UKRAINE 11/01/25")
  const parsed = parseLocationRaw(raw)
  if (LOCATION_DISPLAY[parsed.locationOnly]) return LOCATION_DISPLAY[parsed.locationOnly]
  // Try case-insensitive match
  const lower = parsed.locationOnly.toLowerCase()
  for (const [key, label] of Object.entries(LOCATION_DISPLAY)) {
    if (key.toLowerCase() === lower) return label
  }
  return parsed.locationOnly
}

export const CONDITION_GRADES = [
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C',
  'NEW',
  'USED',
  'REFURBISHED',
  'FOR_PARTS',
] as const

export const YEARS = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 12 }, (_, i) => String(y - i))
})()

export type Category = (typeof CATEGORIES)[number]
export type Brand = (typeof BRANDS)[number]
export type Location = (typeof LOCATIONS)[number]
export type ConditionGrade = (typeof CONDITION_GRADES)[number]

export function getCategories(): readonly string[] {
  return CATEGORIES
}

export function getBrands(): readonly string[] {
  return BRANDS
}

export function getProcessors(): readonly string[] {
  return PROCESSORS
}

export function getLocations(): readonly string[] {
  return LOCATIONS
}

export function getConditionGrades(): readonly string[] {
  return CONDITION_GRADES
}

export const CONDITION_LABELS: Record<string, string> = {
  A: 'A',
  'A-': 'A-',
  'B+': 'B+',
  B: 'B',
  'B-': 'B-',
  C: 'C',
  NEW: 'Новый',
  USED: 'Б/У',
  REFURBISHED: 'Восстановленный',
  FOR_PARTS: 'На запчасти',
}

export function getYears(): readonly string[] {
  return YEARS
}

const BRAND_ALIASES: Record<string, string> = {
  MACBOOK: 'Apple', IMAC: 'Apple', 'MAC MINI': 'Apple', 'MAC PRO': 'Apple', IPHONE: 'Apple', IPAD: 'Apple',
  THINKPAD: 'Lenovo', IDEAPAD: 'Lenovo', YOGA: 'Lenovo', LEGION: 'Lenovo',
  LATITUDE: 'Dell', INSPIRON: 'Dell', XPS: 'Dell', VOSTRO: 'Dell', PRECISION: 'Dell', OPTIPLEX: 'Dell',
  ELITEBOOK: 'HP', PROBOOK: 'HP', PAVILION: 'HP', ZBOOK: 'HP', SPECTRE: 'HP', ENVY: 'HP',
  GALAXY: 'Samsung', SURFACE: 'Microsoft', ASPIRE: 'Acer', NITRO: 'Acer', SWIFT: 'Acer',
  ZENBOOK: 'Asus', VIVOBOOK: 'Asus', ROG: 'Asus', TUF: 'Asus',
  GRAM: 'LG', REDMIBOOK: 'Xiaomi',
}

export function suggestBrandFromDescription(description: string): string | undefined {
  const d = description.toUpperCase()
  // Check direct brand name match first
  for (const b of BRANDS) {
    if (b !== 'Прочее' && d.includes(b.toUpperCase())) return b
  }
  // Check product line aliases (MacBook → Apple, ThinkPad → Lenovo, etc.)
  for (const [alias, brand] of Object.entries(BRAND_ALIASES)) {
    if (d.includes(alias)) return brand
  }
  return undefined
}

export function suggestCategoryFromDescription(description: string): string | undefined {
  const d = description.toLowerCase()
  if (d.includes('macbook') || d.includes('latitude') || d.includes('notebook') || d.includes('laptop')) return 'Ноутбук'
  if (d.includes('monitor') || d.includes('монитор') || d.includes('дисплей')) return 'Монитор'
  if (d.includes('iphone') || d.includes('phone') || d.includes('телефон')) return 'Телефон'
  if (d.includes('mac mini') || d.includes('desktop')) return 'Системный блок'
  return undefined
}
