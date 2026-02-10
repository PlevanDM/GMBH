import type { ColumnMapping, InventoryItem, RawRow } from '../types/inventory'
import { HEADER_ALIASES } from '../types/inventory'
import * as XLSX from 'xlsx'

export interface ParsedFile {
  sheetNames: string[]
  rowsBySheet: Record<string, RawRow[]>
  headers: string[]
}

function sheetToRows(sheet: XLSX.WorkSheet): RawRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
    defval: '',
    raw: false,
  })
  return data.map((row) => {
    const out: RawRow = {}
    for (const [k, v] of Object.entries(row)) {
      out[k] = v == null ? '' : v
    }
    return out
  })
}

/**
 * Из ссылки на Google Таблицу (вид или экспорт) получает URL для скачивания CSV.
 * Примеры:
 * - https://docs.google.com/spreadsheets/d/1abc.../edit#gid=0
 * - https://docs.google.com/spreadsheets/d/1abc.../export?format=csv&gid=0
 */
export function getGoogleSheetsExportUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  // Уже export-ссылка
  if (trimmed.includes('/export') && trimmed.includes('format=csv')) {
    try {
      const u = new URL(trimmed)
      if (u.hostname.includes('google.com') && u.pathname.includes('/spreadsheets/')) return trimmed
    } catch {
      return null
    }
  }
  // Вид: .../d/ID/edit#gid=GID
  const match = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) return null
  const spreadsheetId = match[1]
  let gid = '0'
  const gidMatch = trimmed.match(/[#&]gid=(\d+)/)
  if (gidMatch) gid = gidMatch[1]
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
}

/**
 * Загружает данные из Google Таблицы по ссылке (вид или export) и возвращает ParsedFile.
 * Использует прокси /api/my/inventory/google-sheets при необходимости (обход CORS).
 */
export async function parseInventoryFromGoogleSheetsUrl(
  viewOrExportUrl: string,
  fetchCsv: (exportUrl: string) => Promise<string>
): Promise<ParsedFile> {
  const exportUrl = getGoogleSheetsExportUrl(viewOrExportUrl)
  if (!exportUrl) throw new Error('Некорректная ссылка на Google Таблицу')
  const csvText = await fetchCsv(exportUrl)
  const workbook = XLSX.read(csvText, { type: 'string', raw: false })
  const sheetNames = workbook.SheetNames.length ? workbook.SheetNames : ['Лист1']
  const rowsBySheet: Record<string, RawRow[]> = {}
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name]
    rowsBySheet[name] = sheetToRows(sheet)
  }
  const firstSheet = sheetNames[0]
  const firstRows = rowsBySheet[firstSheet] || []
  const headers =
    firstRows.length > 0
      ? Object.keys(firstRows[0]).filter((k) => k != null && k !== '')
      : []
  return { sheetNames, rowsBySheet, headers }
}

export function parseInventoryFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('Failed to read file'))
          return
        }
        const isBinary =
          file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
        const workbook = XLSX.read(data, {
          type: isBinary ? 'array' : 'string',
          raw: false,
        })
        const sheetNames = workbook.SheetNames
        const rowsBySheet: Record<string, RawRow[]> = {}
        for (const name of sheetNames) {
          const sheet = workbook.Sheets[name]
          rowsBySheet[name] = sheetToRows(sheet)
        }
        const firstSheet = sheetNames[0]
        const firstRows = rowsBySheet[firstSheet] || []
        const headers =
          firstRows.length > 0
            ? Object.keys(firstRows[0]).filter((k) => k != null && k !== '')
            : []
        resolve({ sheetNames, rowsBySheet, headers })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

/** Нормализация для сравнения: без пробелов по краям, нижний регистр, пунктуация/дефисы как пробел */
function normalizeHeader(h: string): string {
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/[\s_\-–—./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Priority order for mapping fields — higher priority fields are matched first
 * to prevent ambiguous headers being assigned to wrong fields.
 */
const FIELD_PRIORITY: (keyof ColumnMapping)[] = [
  'description',    // most important — match first
  'serialNumber',   // "SN", "S/N" — very specific
  'processor',      // "CPU"
  'ram',            // "RAM"
  'gpu',            // "GPU", "Video"
  'storage',        // "SSD", "HDD"
  'batteryCycles',  // "Cycle BAT"
  'batteryHealth',  // "Battery"
  'price',          // "Price", "Цена"
  'quantity',       // "Qty"
  'brand',
  'category',
  'condition',
  'status',
  'inventoryNumber',
  'sku',
  'year',
  'location',
  'imageUrl',
  'notes',
]

/**
 * Подбор маппинга колонок по шапке файла.
 * - Priority-based: important fields match first
 * - No duplicates: once a header is assigned, it's removed from pool
 * - Multi-pass: exact match first, then partial match
 */
export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    description: '',
    brand: '',
    category: '',
    inventoryNumber: '',
    serialNumber: '',
    condition: '',
    status: '',
    price: '',
    quantity: '',
    sku: '',
    imageUrl: '',
    processor: '',
    ram: '',
    storage: '',
    gpu: '',
    year: '',
    batteryCycles: '',
    batteryHealth: '',
    location: '',
    notes: '',
  }

  const headerPool = headers.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
    used: false,
  }))

  // Pass 1: exact match (normalized header === normalized alias)
  for (const field of FIELD_PRIORITY) {
    const aliases = HEADER_ALIASES[field].map((a) => normalizeHeader(a))
    const found = headerPool.find(
      (h) => !h.used && h.normalized && aliases.includes(h.normalized),
    )
    if (found) {
      mapping[field] = found.original
      found.used = true
    }
  }

  // Pass 2: partial match for remaining unmapped fields
  for (const field of FIELD_PRIORITY) {
    if (mapping[field]) continue // already matched
    const aliases = HEADER_ALIASES[field].map((a) => normalizeHeader(a))
    const found = headerPool.find((h) => {
      if (h.used || !h.normalized) return false
      return aliases.some(
        (a) =>
          h.normalized.includes(a) ||
          a.includes(h.normalized) ||
          h.normalized.split(' ').some((w) => w.length > 2 && a.includes(w)),
      )
    })
    if (found) {
      mapping[field] = found.original
      found.used = true
    }
  }

  return mapping
}

/** Map status string to our status; default available */
export function normalizeStatus(value: string | number | undefined): 'available' | 'sold' | 'reserved' | 'unavailable' {
  const s = String(value ?? '').trim().toLowerCase()
  if (s === 'sold' || s === 'продано') return 'sold'
  if (s === 'reserved' || s === 'зарезервировано') return 'reserved'
  if (s === 'unavailable' || s === 'нет' || s === 'no' || s === 'red') return 'unavailable'
  if (s === 'available' || s === 'good' || s === 'да' || s === 'yes' || s === 'green' || s === '') return 'available'
  if (s.includes('ready') && s.includes('sell')) return 'available'
  if (s.includes('repair') || s.includes('ремонт')) return 'reserved'
  return 'unavailable'
}

function getCell(row: RawRow, colKey: string): string {
  if (!colKey) return ''
  const v = row[colKey]
  return v != null ? String(v).trim() : ''
}

function parseNumber(val: string): number | undefined {
  const s = String(val).replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : undefined
}

/* ---- Auto-detection helpers ---- */

const KNOWN_BRANDS = [
  'Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Samsung', 'Microsoft',
  'Toshiba', 'Fujitsu', 'LG', 'Huawei', 'Razer', 'Panasonic', 'Sony', 'VAIO',
  'Google', 'Compaq', 'Gateway', 'Alienware', 'Dynabook',
]

const KNOWN_CATEGORIES: Record<string, string> = {
  macbook: 'Ноутбук', laptop: 'Ноутбук', notebook: 'Ноутбук', ноутбук: 'Ноутбук',
  desktop: 'Десктоп', pc: 'Десктоп', компьютер: 'Десктоп', 'all-in-one': 'Десктоп',
  imac: 'Десктоп',
  monitor: 'Монитор', display: 'Монитор', монитор: 'Монитор',
  tablet: 'Планшет', ipad: 'Планшет', планшет: 'Планшет',
  phone: 'Телефон', iphone: 'Телефон', smartphone: 'Телефон', телефон: 'Телефон',
  server: 'Сервер', сервер: 'Сервер',
  printer: 'Принтер', принтер: 'Принтер',
}

/** Try to detect brand from description string */
function detectBrandFromDescription(desc: string): string | undefined {
  const lower = desc.toLowerCase()
  return KNOWN_BRANDS.find((b) => lower.includes(b.toLowerCase()))
}

/** Try to detect category from description string */
function detectCategoryFromDescription(desc: string): string | undefined {
  const lower = desc.toLowerCase()
  for (const [keyword, cat] of Object.entries(KNOWN_CATEGORIES)) {
    if (lower.includes(keyword)) return cat
  }
  return undefined
}

/** Normalize condition grades: A, B, C etc or descriptive */
export function normalizeCondition(val: string): string | undefined {
  const s = String(val).trim()
  if (!s) return undefined
  // Already a grade letter
  const grade = s.match(/^([A-D])([+-])?$/i)
  if (grade) return grade[1].toUpperCase() + (grade[2] ?? '')
  // Common words
  const lower = s.toLowerCase()
  if (lower === 'new' || lower === 'новый' || lower === 'neu') return 'A'
  if (lower === 'like new' || lower === 'как новый') return 'A-'
  if (lower === 'good' || lower === 'хорошее' || lower === 'gut') return 'B'
  if (lower === 'fair' || lower === 'удовл' || lower === 'befriedigend') return 'C'
  if (lower === 'poor' || lower === 'плохое' || lower === 'schlecht') return 'D'
  return s // return as-is if can't normalize
}

/**
 * Collect all unmapped columns as extra data (key-value) so no data is lost.
 * Useful for different price formats that may have custom columns.
 */
function collectExtraColumns(row: RawRow, mapping: ColumnMapping): Record<string, string> {
  const mappedCols = new Set(Object.values(mapping).filter(Boolean))
  const extra: Record<string, string> = {}
  for (const [key, val] of Object.entries(row)) {
    if (!mappedCols.has(key) && val != null && String(val).trim()) {
      extra[key] = String(val).trim()
    }
  }
  return extra
}

export function mapRowsToItems(
  rows: RawRow[],
  mapping: ColumnMapping
): InventoryItem[] {
  const now = new Date().toISOString()
  return rows
    .filter((row) => {
      // Skip completely empty rows
      const vals = Object.values(row).map((v) => String(v ?? '').trim()).filter(Boolean)
      return vals.length > 0
    })
    .map((row, idx) => {
      const desc = getCell(row, mapping.description) || `Позиция ${idx + 1}`
      const statusVal = mapping.status ? getCell(row, mapping.status) : ''
      const priceVal = mapping.price ? getCell(row, mapping.price) : ''
      const qtyVal = mapping.quantity ? getCell(row, mapping.quantity) : ''
      const conditionRaw = mapping.condition ? getCell(row, mapping.condition) : ''

      // Auto-detect brand and category from description if not mapped
      const brandMapped = mapping.brand ? getCell(row, mapping.brand) || undefined : undefined
      const categoryMapped = mapping.category ? getCell(row, mapping.category) || undefined : undefined
      const brand = brandMapped || detectBrandFromDescription(desc)
      const category = categoryMapped || detectCategoryFromDescription(desc)

      // Collect unmapped columns into notes if notes column not mapped
      const extraCols = collectExtraColumns(row, mapping)
      const extraStr = Object.entries(extraCols)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
      const notesFromMapping = mapping.notes ? getCell(row, mapping.notes) || undefined : undefined
      const notesValue = notesFromMapping
        ? (extraStr ? `${notesFromMapping} | ${extraStr}` : notesFromMapping)
        : (extraStr || undefined)

      return {
        id: crypto.randomUUID(),
        description: desc,
        brand,
        category,
        inventoryNumber: mapping.inventoryNumber ? getCell(row, mapping.inventoryNumber) || undefined : undefined,
        serialNumber: mapping.serialNumber ? getCell(row, mapping.serialNumber) || undefined : undefined,
        condition: normalizeCondition(conditionRaw) || undefined,
        status: normalizeStatus(statusVal || (mapping.status ? undefined : 'available')),
        price: priceVal ? parseNumber(priceVal) : undefined,
        quantity: qtyVal ? parseNumber(qtyVal) : undefined,
        sku: mapping.sku ? getCell(row, mapping.sku) || undefined : undefined,
        imageUrl: mapping.imageUrl ? getCell(row, mapping.imageUrl) || undefined : undefined,
        processor: mapping.processor ? getCell(row, mapping.processor) || undefined : undefined,
        ram_raw: mapping.ram ? getCell(row, mapping.ram) || undefined : undefined,
        storage_raw: mapping.storage ? getCell(row, mapping.storage) || undefined : undefined,
        gpu_raw: mapping.gpu ? getCell(row, mapping.gpu) || undefined : undefined,
        year: mapping.year ? getCell(row, mapping.year) || undefined : undefined,
        batteryCycles: mapping.batteryCycles ? getCell(row, mapping.batteryCycles) || undefined : undefined,
        batteryHealth: mapping.batteryHealth ? getCell(row, mapping.batteryHealth) || undefined : undefined,
        location: mapping.location ? getCell(row, mapping.location) || undefined : undefined,
        notes: notesValue,
        createdAt: now,
        updatedAt: now,
        sourceRow: idx + 1,
      }
    })
}

/**
 * Analyzes a set of headers and provides a confidence score + detected price type.
 * Helps users understand how well their file was recognized.
 */
export interface MappingAnalysis {
  /** Detected price format type */
  detectedType: string
  /** Confidence 0-100 */
  confidence: number
  /** Number of fields auto-mapped */
  mappedCount: number
  /** Total possible fields */
  totalFields: number
  /** Headers that were not mapped to any field */
  unmappedHeaders: string[]
  /** Suggestions for the user */
  suggestions: string[]
}

export function analyzeMappingQuality(mapping: ColumnMapping, headers: string[]): MappingAnalysis {
  const allFields = Object.keys(mapping) as (keyof ColumnMapping)[]
  const mapped = allFields.filter((f) => mapping[f])
  const mappedHeaders = new Set(Object.values(mapping).filter(Boolean))
  const unmappedHeaders = headers.filter((h) => !mappedHeaders.has(h))

  const suggestions: string[] = []
  if (!mapping.description) suggestions.push('Не определена колонка описания — укажите вручную')
  if (!mapping.price) suggestions.push('Не определена колонка цены — возможно формат нестандартный')
  if (!mapping.brand && !mapping.description) suggestions.push('Нет бренда — он будет определён автоматически из описания')
  if (!mapping.serialNumber) suggestions.push('Нет серийного номера — если есть, укажите вручную')
  if (unmappedHeaders.length > 3) suggestions.push(`${unmappedHeaders.length} колонок не распознаны — данные сохранятся в комментариях`)

  // Detect type
  let detectedType = 'Стандартный прайс'
  const hasSerial = !!mapping.serialNumber
  const hasBattery = !!mapping.batteryCycles || !!mapping.batteryHealth
  const hasProcessor = !!mapping.processor
  const hasCondition = !!mapping.condition
  if (hasSerial && hasBattery && hasProcessor) detectedType = 'Детальный сток ноутбуков (with S/N, Battery, CPU)'
  else if (hasSerial && hasCondition) detectedType = 'Сток б/у техники (with S/N, Grade)'
  else if (mapping.quantity && mapping.price && !hasSerial) detectedType = 'Оптовый прайс-лист (bulk pricing)'
  else if (mapping.sku && mapping.price) detectedType = 'Каталожный прайс (SKU + Price)'

  const confidence = Math.min(100, Math.round((mapped.length / Math.max(headers.length, 1)) * 100))

  return {
    detectedType,
    confidence,
    mappedCount: mapped.length,
    totalFields: allFields.length,
    unmappedHeaders,
    suggestions,
  }
}
