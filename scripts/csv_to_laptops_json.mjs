#!/usr/bin/env node
/**
 * Импорт Kaggle CSV в LaptopSpec (ТЗ): laptops.json — плоский формат (обратная совместимость),
 * laptopSpecs.json — полная структура LaptopSpec с нормализованными полями.
 * Использование: node scripts/csv_to_laptops_json.mjs [путь к CSV]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const COLUMN_MAP = {
  laptop_ID: 'laptop_ID',
  Company: 'brand',
  Product: 'model',
  TypeName: 'typeName',
  Inches: 'inches',
  ScreenResolution: 'screenResolution',
  Cpu: 'processor',
  Ram: 'ram',
  Memory: 'storage',
  Gpu: 'gpu',
  OpSys: 'opSys',
  Weight: 'weight',
  Price_in_euros: 'price_euros',
  Price_euros: 'price_euros',
  Price: 'price_euros',
}

function parseCSVLine(line) {
  const out = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            cell += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          cell += line[i++]
        }
      }
      out.push(cell)
    } else {
      let cell = ''
      while (i < line.length && line[i] !== ',') cell += line[i++]
      out.push(cell.trim())
      if (line[i] === ',') i++
    }
  }
  return out
}

function csvToRows(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, j) => {
      if (values[j] !== undefined) row[h] = values[j].trim()
    })
    rows.push(row)
  }
  return { headers, rows }
}

// --- Нормализация для LaptopSpec (ТЗ) ---

const STORAGE_TYPES = ['HDD', 'SSD', 'Hybrid', 'Flash', 'Other']
const GPU_INTEGRATED = /intel\s+(hd|uhd|iris|graphics)\s*\d|amd\s+radeon\s+graphics|apple\s+m\d|apple\s+gpu/i

function parseRamGb(ram) {
  if (!ram) return 0
  const m = String(ram).match(/(\d+)\s*GB/i)
  return m ? Math.min(128, Math.max(0, parseInt(m[1], 10))) : 0
}

function parseStorage(storage) {
  const s = String(storage || '')
  let type = 'Other'
  if (/SSD|Flash/i.test(s) && /HDD|Hybrid/i.test(s)) type = 'Hybrid'
  else if (/SSD|Flash\s*Storage/i.test(s)) type = s.match(/Flash/i) ? 'Flash' : 'SSD'
  else if (/HDD|Hybrid/i.test(s)) type = /Hybrid/i.test(s) ? 'Hybrid' : 'HDD'
  const tb = s.match(/(\d+)\s*TB/i)
  const gb = s.match(/(\d+)\s*GB/i)
  let totalGb = 0
  const tbMatch = s.match(/(\d+)\s*TB/gi)
  const gbMatch = s.match(/(\d+)\s*GB/gi)
  if (tbMatch) tbMatch.forEach((m) => { totalGb += parseInt(m, 10) * 1024 })
  if (gbMatch) gbMatch.forEach((m) => { totalGb += parseInt(m, 10) })
  if (totalGb === 0 && tb) totalGb = parseInt(tb[1], 10) * 1024
  if (totalGb === 0 && gb) totalGb = parseInt(gb[1], 10)
  return { type, storage_gb: Math.min(8192, totalGb) || 0 }
}

function parseCpu(cpu) {
  const c = String(cpu || '').trim()
  let family = c.slice(0, 50)
  let model = null
  let generation = null
  const intelCore = c.match(/Intel\s+Core\s+(i[3579]|M|m\d)\s*([^\s,]+)?/i)
  const amdRyzen = c.match(/AMD\s+(Ryzen\s*[3579]|FX|A[0-9]+|E-Series)\s*([^\s,]+)?/i)
  const appleM = c.match(/Apple\s+M[123]\s*(Pro|Max)?/i)
  const intelCeleron = c.match(/Intel\s+(Celeron|Pentium|Atom)\s+/i)
  const genMatch = c.match(/(\d{4,5})[UHQHK]/i) || c.match(/(\d)th\s*Gen/i) || c.match(/Generation\s*(\d+)/i)
  if (genMatch) generation = parseInt(genMatch[1], 10)
  if (generation && generation > 20) generation = Math.floor(generation / 100)
  if (intelCore) {
    family = `Core ${intelCore[1]}`
    model = intelCore[2] ? intelCore[2].replace(/\s*GHz.*$/i, '').trim() : null
  } else if (amdRyzen) {
    family = amdRyzen[1].replace(/\s+/g, ' ')
    model = amdRyzen[2] || null
  } else if (appleM) {
    family = `Apple ${appleM[0].trim()}`
  } else if (intelCeleron) {
    family = intelCeleron[1]
  }
  return { cpu_family: family, cpu_model: model, cpu_generation: generation }
}

function parseGpu(gpu) {
  const g = String(gpu || '')
  const gpu_type = GPU_INTEGRATED.test(g) ? 'integrated' : g.length > 2 ? 'dedicated' : 'unknown'
  const model = g.length > 0 ? g.slice(0, 80) : null
  return { gpu_type, gpu_model: model }
}

function typeNameToClass(typeName) {
  const t = String(typeName || '').toLowerCase()
  if (t.includes('ultrabook')) return 'ultrabook'
  if (t.includes('gaming')) return 'gaming'
  if (t.includes('workstation')) return 'workstation'
  if (t.includes('macbook') || t.includes('mac')) return 'macbook'
  if (t.includes('notebook') || t.includes('2 in 1')) return 'office'
  return 'other'
}

function parseDisplaySize(inches) {
  if (inches == null || inches === '') return null
  const n = parseFloat(String(inches).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseDisplayType(screenResolution) {
  const s = String(screenResolution || '')
  if (/IPS/i.test(s)) return 'IPS'
  if (/TN|VA|OLED/i.test(s)) return s.match(/(TN|VA|OLED)/i)[0]
  return null
}

function rowToLaptopSpec(row, index) {
  const now = new Date().toISOString()
  const sourceId = row.laptop_ID != null ? String(row.laptop_ID) : `row-${index + 1}`
  const id = `kaggle-${sourceId}`
  const brand = String(row.Company || row.brand || '').trim() || 'Unknown'
  const model_raw = String(row.Product || row.model || '').trim()
  const cpu_raw = String(row.Cpu || row.processor || '').trim()
  const ram_raw = String(row.Ram || row.ram || '').trim()
  const storage_raw = String(row.Memory || row.storage || '').trim()
  const priceEur = parseFloat(String(row.Price_in_euros ?? row.Price_euros ?? row.Price ?? 0).replace(',', '.')) || 0

  const { cpu_family, cpu_model, cpu_generation } = parseCpu(cpu_raw)
  const ram_gb = parseRamGb(ram_raw)
  const { type: storage_type, storage_gb } = parseStorage(storage_raw)
  const { gpu_type, gpu_model } = parseGpu(row.Gpu || row.gpu || '')
  const typeName = row.TypeName || row.typeName || ''
  const series = model_raw && model_raw.length > 0 ? model_raw : null

  return {
    id,
    source_id: sourceId,
    brand,
    model_raw,
    cpu_raw,
    ram_raw,
    storage_raw,
    price_eur: priceEur,
    series,
    cpu_family,
    cpu_model,
    cpu_generation,
    ram_gb,
    storage_type,
    storage_gb,
    gpu_type,
    gpu_model,
    display_size_inch: parseDisplaySize(row.Inches || row.inches),
    display_type: parseDisplayType(row.ScreenResolution || row.screenResolution),
    year_released: null,
    class: typeNameToClass(typeName),
    price_new_avg: priceEur,
    price_used_avg: null,
    created_at: now,
    updated_at: now,
    is_active: true,
  }
}

function rowToLegacyRecord(row) {
  const record = {}
  const map = {
    Company: 'brand',
    Product: 'model',
    TypeName: 'typeName',
    Inches: 'inches',
    ScreenResolution: 'screenResolution',
    Cpu: 'processor',
    Ram: 'ram',
    Memory: 'storage',
    Gpu: 'gpu',
    OpSys: 'opSys',
    Weight: 'weight',
    Price_euros: 'price_euros',
    Price_in_euros: 'price_euros',
    Price: 'price_euros',
  }
  for (const [csvCol, ourKey] of Object.entries(map)) {
    if (row[csvCol] != null && String(row[csvCol]).trim()) {
      record[ourKey] = String(row[csvCol]).trim()
    }
  }
  return record
}

function main() {
  const arg = process.argv[2]
  const csvPath = arg
    ? (arg.startsWith('c:\\') || arg.startsWith('C:\\') || arg.startsWith('/') ? arg : join(process.cwd(), arg))
    : join(root, 'public', 'data', 'laptop_price.csv')

  if (!existsSync(csvPath)) {
    console.error('Файл не найден:', csvPath)
    console.error('Использование: node scripts/csv_to_laptops_json.mjs <путь к CSV>')
    process.exit(1)
  }

  const csvText = readFileSync(csvPath, 'utf8')
  const { rows } = csvToRows(csvText)
  const legacyRecords = rows.map((row) => rowToLegacyRecord(row)).filter((r) => Object.keys(r).length > 0)
  const specs = rows.map((row, i) => rowToLaptopSpec(row, i)).filter((s) => s.brand && s.model_raw)

  const outDir = join(root, 'public', 'data')
  mkdirSync(outDir, { recursive: true })

  writeFileSync(join(outDir, 'laptops.json'), JSON.stringify(legacyRecords, null, 0), 'utf8')
  writeFileSync(join(outDir, 'laptopSpecs.json'), JSON.stringify(specs, null, 0), 'utf8')

  console.log('Записей (legacy laptops.json):', legacyRecords.length)
  console.log('Записей (LaptopSpec laptopSpecs.json):', specs.length)
  console.log('Сохранено:', outDir)
}

main()
