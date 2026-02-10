/**
 * Клиент для mobile-specs-api (неофициальный API спецификаций телефонов, GSMArena).
 * Базовый URL задаётся через VITE_SPECS_API_URL (например http://localhost:3001).
 * При отсутствии URL все методы возвращают пустые данные.
 */

const BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_SPECS_API_URL?: string } }).env?.VITE_SPECS_API_URL) ||
  ''

export interface PhoneListItem {
  id: string
  name?: string
  brand?: string
  model?: string
  slug?: string
}

export interface PhoneDetails {
  id: string
  name?: string
  brand?: string
  model?: string
  releaseYear?: string
  processor?: string
  battery?: string
  display?: string
  ram?: string
  storage?: string
  [key: string]: unknown
}

async function get<T>(path: string): Promise<T | null> {
  if (!BASE_URL) return null
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/**
 * Список телефонов (GET /api/phones). Опционально поиск по query.
 */
export async function fetchPhones(query?: string): Promise<PhoneListItem[]> {
  const path = query?.trim() ? `/api/phones?search=${encodeURIComponent(query.trim())}` : '/api/phones'
  const data = await get<PhoneListItem[] | { data?: PhoneListItem[] }>(path)
  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as { data?: PhoneListItem[] }).data)) return (data as { data: PhoneListItem[] }).data
  return []
}

/**
 * Детали телефона по id (GET /api/phones/:id).
 * Можно маппить в поля InventoryItem: processor, year, batteryHealth и т.д.
 */
export async function fetchPhoneById(id: string): Promise<PhoneDetails | null> {
  if (!id) return null
  const data = await get<PhoneDetails>(`/api/phones/${encodeURIComponent(id)}`)
  return data
}

/**
 * Проверка доступности API.
 */
export function getSpecsApiBaseUrl(): string {
  return BASE_URL
}
