/**
 * Инвентарь как ноутбук (InventoryLaptop): нормализация title/*_raw,
 * маппинг на LaptopSpec (InventoryLaptopMatch), расчёт выкупа — в buybackRules.
 */

import type { InventoryItem } from '../types/inventory'
import type { InventoryLaptop, InventoryLaptopMatch } from '../types/laptops'
import { parseRamGb, parseStorageGb } from './laptopSpecs'

const STORAGE_MAP: Record<string, InventoryLaptop['storage_type']> = {
  HDD: 'HDD',
  SSD: 'SSD',
  Hybrid: 'Hybrid',
  Flash: 'Flash',
  Other: 'Other',
}

function parseStorageType(s: string): InventoryLaptop['storage_type'] {
  const t = String(s || '').toLowerCase()
  if (t.includes('ssd') && !t.includes('hdd')) return 'SSD'
  if (t.includes('hdd') || t.includes('hdd')) return 'HDD'
  if (t.includes('hybrid')) return 'Hybrid'
  if (t.includes('flash')) return 'Flash'
  return 'Other'
}

const GPU_INTEGRATED = /intel\s+(hd|uhd|iris|graphics)\s*\d|amd\s+radeon\s+graphics|apple\s+m\d|integrated/i

function parseGpuType(gpu: string): InventoryLaptop['gpu_type'] {
  const g = String(gpu || '').trim()
  if (!g) return 'unknown'
  return GPU_INTEGRATED.test(g) ? 'integrated' : 'dedicated'
}

/** Извлечь год из строки: "2018", "MacBook (15-inch, 2018)", "Latitude 5401" (по модели) */
function parseYearApprox(title: string, _cpu?: string): number | null {
  const y = title.match(/\b(20[12]\d)\b/)
  if (y) return parseInt(y[1], 10)
  return null
}

/** Извлечь диагональ: "15.4", "15-inch", "16.0" */
function parseDisplayInch(title: string): number | null {
  const m = title.match(/(\d+\.?\d*)\s*inch/i) || title.match(/(\d+\.?\d*)"\s*[,\s]/) || title.match(/\b(\d+\.?\d*)\s*[,\s]\s*(inch|MBP|silver)/i)
  if (m) return parseFloat(m[1])
  const m2 = title.match(/\b(11\.6|12|13\.3|14|15\.6|17\.3)\b/)
  if (m2) return parseFloat(m2[1])
  return null
}

const CONDITION_MAP: Record<string, InventoryLaptop['condition']> = {
  A: 'like_new',
  'A-': 'good',
  B: 'good',
  'B-': 'cosmetic',
  C: 'cosmetic',
  new: 'new',
  like_new: 'like_new',
  good: 'good',
  cosmetic: 'cosmetic',
  defective: 'defective',
  not_working: 'not_working',
}

/** Преобразует InventoryItem в InventoryLaptop, заполняя raw и нормализованные поля из title/description. */
export function inventoryItemToLaptop(item: InventoryItem): InventoryLaptop {
  const title = item.description || ''
  const cpu_raw = item.processor ?? ''
  const ram_raw = item.ram_raw ?? extractFromTitle(title, /(\d+)\s*GB\s*(?:RAM|ram)/i) ?? (title.match(/(\d+)RAM/i) ? (title.match(/(\d+)RAM/i)?.[1] ?? '') + ' GB' : '') ?? ''
  const storage_raw = item.storage_raw ?? extractFromTitle(title, /\d+\s*(?:GB|TB)\s*(?:SSD|HDD|Flash|G)/i) ?? ''
  const gpu_raw = item.gpu_raw ?? extractFromTitle(title, /(Radeon|GeForce|Intel\s+(?:HD|Iris|UHD)|RP\s*\d+|AMD\s+R[\d\s]+|MX\d+|GTX\s*\d+)/i) ?? ''

  const ram_gb = item.laptopRamGb ?? parseRamGb(ram_raw || undefined)
  const storage_gb = item.laptopStorageGb ?? parseStorageGb(storage_raw || undefined)
  const storage_type = (item.laptopStorageType && STORAGE_MAP[item.laptopStorageType]) || parseStorageType(storage_raw || title)
  const gpu_type = (item.laptopGpuType === 'integrated' || item.laptopGpuType === 'dedicated' ? item.laptopGpuType : null) ?? parseGpuType(gpu_raw)

  const conditionKey = (item.condition ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  const condition = CONDITION_MAP[conditionKey] ?? CONDITION_MAP[item.condition ?? ''] ?? 'good'

  return {
    id: item.id,
    title,
    brand: item.brand ?? '',
    model_raw: title.slice(0, 120),
    cpu_raw,
    ram_raw,
    storage_raw,
    gpu_raw,
    series: item.laptopSeries ?? null,
    cpu_family: item.laptopCpuFamily ?? (cpu_raw ? cpu_raw.slice(0, 40) : ''),
    cpu_model: null,
    cpu_generation: null,
    ram_gb,
    storage_type,
    storage_gb,
    gpu_type,
    gpu_model: gpu_raw ? gpu_raw.slice(0, 60) : null,
    display_size_inch: parseDisplayInch(title),
    year_approx: item.laptopYearApprox ?? parseYearApprox(title, cpu_raw),
    condition,
    buyback_price_planned: item.price ?? null,
    buyback_price_recommended: item.buyback_price_recommended ?? null,
    notes: item.notes ?? null,
  }
}

function extractFromTitle(title: string, re: RegExp): string | null {
  const m = title.match(re)
  return m ? m[0] : null
}

/**
 * Нормализует позицию инвентаря: разбирает title и *_raw, возвращает обновлённые поля для patch.
 * Вызывающий может сделать updateItem(id, normalizeInventoryLaptop(item)).
 */
export function normalizeInventoryLaptop(item: InventoryItem): Partial<InventoryItem> {
  const title = item.description || ''
  const cpu = item.processor ?? ''
  const ram_raw = item.ram_raw ?? extractFromTitle(title, /(\d+)\s*GB\s*(?:RAM|ram)/i) ?? (title.match(/(\d+)RAM/i) ? (title.match(/(\d+)RAM/i)?.[1] ?? '') + ' GB' : '') ?? ''
  const storage_raw = item.storage_raw ?? extractFromTitle(title, /\d+\s*(?:GB|TB)\s*(?:SSD|HDD|Flash|G)/i) ?? ''
  const gpu_raw = item.gpu_raw ?? extractFromTitle(title, /(Radeon|GeForce|Intel\s+(?:HD|Iris|UHD)|RP\s*\d+|AMD\s+R[\d\s]+|MX\d+|GTX\s*\d+)/i) ?? ''

  const laptopRamGb = parseRamGb(ram_raw || undefined)
  const laptopStorageGb = parseStorageGb(storage_raw || undefined)
  const laptopStorageType = parseStorageType(storage_raw || title)
  const laptopGpuType = parseGpuType(gpu_raw)
  const laptopYearApprox = parseYearApprox(title, cpu)
  const laptopCpuFamily = cpu ? cpu.slice(0, 50) : undefined
  const laptopSeries = title.slice(0, 80) || undefined

  return {
    ram_raw: ram_raw || undefined,
    storage_raw: storage_raw || undefined,
    gpu_raw: gpu_raw || undefined,
    laptopRamGb,
    laptopStorageGb,
    laptopStorageType,
    laptopGpuType,
    laptopYearApprox: laptopYearApprox ?? undefined,
    laptopCpuFamily,
    laptopSeries,
  }
}

// --- InventoryLaptopMatch store (localStorage) ---

const MATCHES_STORAGE_KEY = 'restart-inventory-laptop-matches'

function loadMatches(): InventoryLaptopMatch[] {
  try {
    const raw = localStorage.getItem(MATCHES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMatches(matches: InventoryLaptopMatch[]) {
  try {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches))
  } catch (e) {
    // Storage write failed — gracefully ignored
  }
}

export function getMatchesForInventory(inventory_laptop_id: string | number): InventoryLaptopMatch[] {
  return loadMatches().filter((m) => String(m.inventory_laptop_id) === String(inventory_laptop_id))
}

export function setMatchesForInventory(inventory_laptop_id: string | number, matches: Omit<InventoryLaptopMatch, 'id' | 'inventory_laptop_id'>[]) {
  const all = loadMatches().filter((m) => String(m.inventory_laptop_id) !== String(inventory_laptop_id))
  const newMatches: InventoryLaptopMatch[] = matches.map((m, i) => ({
    ...m,
    id: `match-${inventory_laptop_id}-${i}`,
    inventory_laptop_id,
  }))
  saveMatches([...all, ...newMatches])
}

export function setPrimaryMatch(inventory_laptop_id: string | number, laptop_spec_id: string | number) {
  const all = loadMatches()
  const updated = all.map((m) => {
    if (String(m.inventory_laptop_id) !== String(inventory_laptop_id)) return m
    return { ...m, is_primary: String(m.laptop_spec_id) === String(laptop_spec_id) }
  })
  saveMatches(updated)
}

export function getPrimarySpecId(inventory_laptop_id: string | number): string | number | null {
  const primary = loadMatches().find(
    (m) => String(m.inventory_laptop_id) === String(inventory_laptop_id) && m.is_primary
  )
  return primary ? primary.laptop_spec_id : null
}
