/**
 * Датасет спецификаций ноутбуков (Kaggle → LaptopSpec по ТЗ).
 * Загрузка: laptopSpecs.json (полная структура) или laptops.json (legacy).
 * Content-based рекомендации, подбор похожих для инвентаря.
 */

import type { LaptopSpec } from '../types/laptops'

/** Плоский формат для таблиц и обратной совместимости */
export interface LaptopSpecRecord {
  id?: string
  brand?: string
  model?: string
  typeName?: string
  inches?: string
  screenResolution?: string
  processor?: string
  ram?: string
  storage?: string
  gpu?: string
  opSys?: string
  weight?: string
  price_euros?: string
  year?: string
  [key: string]: unknown
}

const CSV_TO_OUR: Record<string, string> = {
  Company: 'brand',
  Product: 'model',
  TypeName: 'typeName',
  Inches: 'inches',
  ScreenResolution: 'screenResolution',
  Cpu: 'processor',
  Ram: 'ram',
  Memory: 'storage',
  Gpu: 'gpu',
  GPU: 'gpu',
  OpSys: 'opSys',
  Weight: 'weight',
  Price_euros: 'price_euros',
  Price_in_euros: 'price_euros',
  Price: 'price_euros',
}

function normalizeRecord(raw: Record<string, unknown>): LaptopSpecRecord {
  const out: LaptopSpecRecord = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v == null || String(v).trim() === '') continue
    const key = CSV_TO_OUR[k] ?? k
    out[key] = String(v).trim()
  }
  return out
}

/** LaptopSpec → LaptopSpecRecord для UI */
export function specToRecord(spec: LaptopSpec): LaptopSpecRecord {
  return {
    id: String(spec.id),
    brand: spec.brand,
    model: spec.model_raw,
    typeName: spec.class,
    inches: spec.display_size_inch != null ? String(spec.display_size_inch) : undefined,
    processor: spec.cpu_raw,
    ram: spec.ram_raw,
    storage: spec.storage_raw,
    gpu: spec.gpu_model ?? undefined,
    price_euros: spec.price_eur > 0 ? String(spec.price_eur) : undefined,
  }
}

let cachedRecords: LaptopSpecRecord[] | null = null
let cachedSpecs: LaptopSpec[] | null = null

/**
 * Загружает список ноутбуков. Сначала пробует laptopSpecs.json (LaptopSpec), иначе laptops.json (legacy).
 * Возвращает плоские записи для таблиц и фильтров.
 */
export async function loadLaptopSpecs(): Promise<LaptopSpecRecord[]> {
  if (cachedRecords) return cachedRecords
  const specs = await loadLaptopSpecsFull()
  cachedSpecs = specs
  cachedRecords = specs.map(specToRecord)
  return cachedRecords
}

/**
 * Загружает полный массив LaptopSpec (ТЗ). Приоритет: specs-db.json (laptops) → laptopSpecs.json → laptops.json (legacy).
 */
export async function loadLaptopSpecsFull(): Promise<LaptopSpec[]> {
  if (cachedSpecs) return cachedSpecs
  try {
    const res = await fetch('/data/specs-db.json', { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      const arr = data?.laptops ?? []
      if (Array.isArray(arr) && arr.length > 0) {
        const list = arr.filter((s: LaptopSpec) => s.is_active !== false) as LaptopSpec[]
        cachedSpecs = list
        cachedRecords = list.map(specToRecord)
        return list
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const res = await fetch('/data/laptopSpecs.json', { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data?.items ?? []
      const list = arr.filter((s: LaptopSpec) => s.is_active !== false) as LaptopSpec[]
      cachedSpecs = list
      cachedRecords = list.map(specToRecord)
      return list
    }
  } catch {
    /* ignore */
  }
  try {
    const res = await fetch('/data/laptops.json', { method: 'GET' })
    if (!res.ok) return []
    const data = await res.json()
    const arr = Array.isArray(data) ? data : data?.items ?? []
    const records = arr.map((row: Record<string, unknown>) => normalizeRecord(row))
    cachedRecords = records
    const specs = records.map((r: LaptopSpecRecord, i: number) => legacyRecordToSpec(r, i))
    cachedSpecs = specs
    return specs
  } catch {
    return []
  }
}

function legacyRecordToSpec(r: LaptopSpecRecord, index: number): LaptopSpec {
  const now = new Date().toISOString()
  return {
    id: `legacy-${index + 1}`,
    source_id: String(index + 1),
    brand: r.brand ?? 'Unknown',
    model_raw: r.model ?? '',
    cpu_raw: r.processor ?? '',
    ram_raw: r.ram ?? '',
    storage_raw: r.storage ?? '',
    price_eur: parseFloat(String(r.price_euros ?? 0)) || 0,
    series: r.model ?? null,
    cpu_family: r.processor?.slice(0, 30) ?? 'Other',
    cpu_model: null,
    cpu_generation: null,
    ram_gb: parseRamGb(r.ram),
    storage_type: /SSD|Flash/i.test(r.storage ?? '') ? 'SSD' : /HDD/i.test(r.storage ?? '') ? 'HDD' : 'Other',
    storage_gb: parseStorageGb(r.storage),
    gpu_type: 'unknown',
    gpu_model: r.gpu ?? null,
    display_size_inch: r.inches ? parseFloat(String(r.inches)) : null,
    display_type: null,
    year_released: null,
    class: 'other',
    price_new_avg: parseFloat(String(r.price_euros ?? 0)) || null,
    price_used_avg: null,
    created_at: now,
    updated_at: now,
    is_active: true,
  }
}

export function clearLaptopSpecsCache(): void {
  cachedRecords = null
  cachedSpecs = null
}

export async function searchLaptopSpecs(query: string): Promise<LaptopSpecRecord[]> {
  const list = await loadLaptopSpecs()
  if (!query?.trim()) return list.slice(0, 50)
  const q = query.trim().toLowerCase()
  return list
    .filter(
      (r) =>
        (r.brand && String(r.brand).toLowerCase().includes(q)) ||
        (r.model && String(r.model).toLowerCase().includes(q)) ||
        (r.processor && String(r.processor).toLowerCase().includes(q)) ||
        (r.storage && String(r.storage).toLowerCase().includes(q))
    )
    .slice(0, 50)
}

export function parseRamGb(ram: string | undefined): number {
  if (!ram) return 0
  const m = String(ram).match(/(\d+)\s*GB/i)
  return m ? Math.min(128, Math.max(0, parseInt(m[1], 10))) : 0
}

export function parseStorageGb(storage: string | undefined): number {
  if (!storage) return 0
  const s = String(storage)
  const tb = s.match(/(\d+)\s*TB/i)
  if (tb) return Math.min(4096, parseInt(tb[1], 10) * 1024)
  const gb = s.match(/(\d+)\s*GB/i)
  return gb ? Math.min(4096, parseInt(gb[1], 10)) : 0
}

function processorNorm(p: string | undefined): string {
  if (!p) return ''
  return String(p)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/intel core\s*/i, 'intel ')
    .replace(/amd ryzen\s*/i, 'amd ')
    .trim()
    .slice(0, 40)
}

/**
 * Похожие ноутбуки по target (Record или LaptopSpec). Возвращает плоские записи.
 */
export function getSimilarLaptops(
  target: LaptopSpecRecord | { brand?: string; processor?: string; ram?: string; storage?: string },
  list: LaptopSpecRecord[],
  k: number = 10
): LaptopSpecRecord[] {
  const tBrand = (target.brand ?? '').toLowerCase().trim()
  const tProcessor = processorNorm(target.processor)
  const tRam = parseRamGb(target.ram)
  const tStorage = parseStorageGb(target.storage)

  const scored = list
    .filter((r) => r !== target && (r.brand || r.model || r.processor))
    .map((r) => {
      let score = 0
      if (tBrand && r.brand && r.brand.toLowerCase().trim() === tBrand) score += 2
      const pNorm = processorNorm(r.processor)
      if (tProcessor && pNorm && (pNorm.includes(tProcessor.slice(0, 15)) || tProcessor.includes(pNorm.slice(0, 15))))
        score += 1.5
      const rRam = parseRamGb(r.ram)
      if (tRam > 0 && rRam > 0) {
        const diff = Math.abs(rRam - tRam)
        score += Math.max(0, 1 - diff / 32)
      }
      const rStorage = parseStorageGb(r.storage)
      if (tStorage > 0 && rStorage > 0) {
        const diff = Math.abs(rStorage - tStorage)
        score += Math.max(0, 0.8 - diff / 2048)
      }
      return { record: r, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, k).map((x) => x.record)
}

/**
 * Подбор похожих LaptopSpec по нормализованным полям (для инвентаря). Возвращает спецификации с оценкой 0–1.
 */
export function findSimilarSpecs(
  target: {
    brand?: string
    cpu_family?: string
    ram_gb?: number
    storage_type?: string
    storage_gb?: number
    display_size_inch?: number | null
  },
  specs: LaptopSpec[],
  k: number = 10
): Array<{ spec: LaptopSpec; similarity_score: number }> {
  const tBrand = (target.brand ?? '').toLowerCase().trim()
  const tFamily = (target.cpu_family ?? '').toLowerCase().trim()
  const tRam = target.ram_gb ?? 0
  const tStorage = target.storage_gb ?? 0
  const tDisplay = target.display_size_inch ?? 0

  const scored = specs
    .filter((s) => s.is_active !== false)
    .map((s) => {
      let score = 0
      let weight = 0
      if (tBrand && s.brand) {
        weight += 2
        if (s.brand.toLowerCase().trim() === tBrand) score += 2
        else if (s.brand.toLowerCase().includes(tBrand) || tBrand.includes(s.brand.toLowerCase())) score += 1
      }
      if (tFamily && s.cpu_family) {
        weight += 1.5
        const fam = s.cpu_family.toLowerCase()
        if (fam === tFamily) score += 1.5
        else if (fam.includes(tFamily) || tFamily.includes(fam)) score += 1
      }
      if (tRam > 0 && s.ram_gb > 0) {
        weight += 1
        const diff = Math.abs(s.ram_gb - tRam)
        score += Math.max(0, 1 - diff / 32)
      }
      if (tStorage > 0 && s.storage_gb > 0) {
        weight += 0.8
        const diff = Math.abs(s.storage_gb - tStorage)
        score += 0.8 * Math.max(0, 1 - diff / 2048)
      }
      if (tDisplay > 0 && s.display_size_inch != null) {
        weight += 0.5
        const diff = Math.abs(s.display_size_inch - tDisplay)
        score += 0.5 * Math.max(0, 1 - diff / 5)
      }
      const similarity_score = weight > 0 ? Math.min(1, score / weight) : 0
      return { spec: s, similarity_score }
    })
    .filter((x) => x.similarity_score > 0)
    .sort((a, b) => b.similarity_score - a.similarity_score)

  return scored.slice(0, k)
}

export interface LaptopFilters {
  brand?: string
  processor?: string
  ram?: string
  storage?: string
}

export function filterLaptops(list: LaptopSpecRecord[], filters: LaptopFilters): LaptopSpecRecord[] {
  let out = list
  if (filters.brand?.trim()) {
    const b = filters.brand.trim().toLowerCase()
    out = out.filter((r) => r.brand && r.brand.toLowerCase().includes(b))
  }
  if (filters.processor?.trim()) {
    const p = filters.processor.trim().toLowerCase()
    out = out.filter((r) => r.processor && r.processor.toLowerCase().includes(p))
  }
  if (filters.ram?.trim()) {
    const r = filters.ram.trim().toLowerCase()
    out = out.filter((x) => x.ram && x.ram.toLowerCase().includes(r))
  }
  if (filters.storage?.trim()) {
    const s = filters.storage.trim().toLowerCase()
    out = out.filter((x) => x.storage && x.storage.toLowerCase().includes(s))
  }
  return out
}
