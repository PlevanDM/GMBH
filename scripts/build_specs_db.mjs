#!/usr/bin/env node
/**
 * Единая база спецификаций: один формат, один файл specs-db.json.
 * Объединяет: laptopSpecs.json (или CSV) + laptop-db-excel.xlsx → laptops;
 *             mobiles-spec-db.xlsx → mobiles.
 * Запуск: npm run data:specs-db  или  node scripts/build_specs_db.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dataDir = join(root, 'public', 'data')

const now = new Date().toISOString()
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
  else if (/SSD|Flash\s*Storage|eMCP/i.test(s)) type = s.match(/Flash/i) ? 'Flash' : 'SSD'
  else if (/HDD|Hybrid/i.test(s)) type = /Hybrid/i.test(s) ? 'Hybrid' : 'HDD'
  const gbMatch = s.match(/(\d+)\s*GB/gi)
  const tbMatch = s.match(/(\d+)\s*TB/gi)
  let totalGb = 0
  if (tbMatch) tbMatch.forEach((m) => { totalGb += parseInt(m, 10) * 1024 })
  if (gbMatch) gbMatch.forEach((m) => { totalGb += parseInt(m, 10) })
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
  } else if (c) {
    family = c.split(/\s+/).slice(0, 3).join(' ')
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
  if (t.includes('notebook') || t.includes('2 in 1') || t.includes('clamshell')) return 'office'
  return 'other'
}

function parseDisplaySize(inches) {
  if (inches == null || inches === '') return null
  const n = parseFloat(String(inches).replace(',', '.').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : null
}

function parseDisplayType(s) {
  const str = String(s || '')
  if (/IPS/i.test(str)) return 'IPS'
  const m = str.match(/(TN|VA|OLED)/i)
  return m ? m[0] : null
}

function parseYear(s) {
  if (s == null || s === '') return null
  const m = String(s).match(/\d{4}/)
  return m ? parseInt(m[0], 10) : null
}

/** Excel row (laptop-db-excel) → LaptopSpec */
function excelLaptopRowToSpec(row, index) {
  const productName = String(row['Product Name'] ?? '').trim()
  const brand = String(row['Brand'] ?? '').trim() || 'Unknown'
  const mainSpec = String(row['Main Specifications'] ?? '')
  const typeName = String(row['Type'] ?? '')
  const internalMem = row['Internal Memory'] ?? row['Internal memory'] ?? ''
  const displayDiag = row['Display Diagonal'] ?? ''
  const totalStorage = row['Total Storage Capacity'] ?? row['Storage Media'] ?? ''
  const procFamily = row['Processor Family'] ?? row['Core Processor Model'] ?? ''
  const releaseDate = row['Release Date'] ?? ''
  const gpuBoard = row['On_Board_Graphics Card'] ?? row['Discrete_Graphics Card'] ?? row['Discrete Graphics Card Model'] ?? ''

  const ram_raw = internalMem ? String(internalMem) : (mainSpec.match(/Internal memory:\s*[^,]+/i)?.[0] || '')
  const storage_raw = totalStorage ? String(totalStorage) : (mainSpec.match(/Storage:\s*[^,]+/i)?.[0] || '')
  const cpu_raw = procFamily ? String(procFamily) : (mainSpec.match(/Processor:\s*[^,]+/i)?.[0] || '')

  const { cpu_family, cpu_model, cpu_generation } = parseCpu(cpu_raw)
  const ram_gb = parseRamGb(ram_raw)
  const { type: storage_type, storage_gb } = parseStorage(storage_raw)
  const { gpu_type, gpu_model } = parseGpu(gpuBoard)

  const id = `excel-${index + 1}`
  const source_id = `excel-${index + 1}`

  return {
    id,
    source_id,
    brand,
    model_raw: productName || `Model ${index + 1}`,
    cpu_raw: cpu_raw || '',
    ram_raw: ram_raw || '',
    storage_raw: storage_raw || '',
    price_eur: 0,
    series: row['Series'] ? String(row['Series']).trim() : null,
    cpu_family,
    cpu_model,
    cpu_generation,
    ram_gb,
    storage_type,
    storage_gb,
    gpu_type,
    gpu_model,
    display_size_inch: parseDisplaySize(displayDiag || mainSpec.match(/Display diagonal:\s*(\d+(?:\.\d+)?)/i)?.[1]),
    display_type: parseDisplayType(row['Panel Type '] ?? row['Display Resolution'] ?? ''),
    year_released: parseYear(releaseDate),
    class: typeNameToClass(typeName),
    price_new_avg: null,
    price_used_avg: null,
    created_at: now,
    updated_at: now,
    is_active: true,
  }
}

/** Excel row (mobiles-spec-db) → MobileSpec */
function excelMobileRowToSpec(row, index) {
  const brand = String(row['Brand Name'] ?? '').trim() || 'Unknown'
  const model = String(row['Model Name'] ?? '').trim()
  const id = `mobile-${index + 1}`
  const source_id = `mobile-${index + 1}`

  let displaySize = null
  const dispSize = row['Dispaly Size'] ?? row['Display Type'] ?? ''
  const dm = String(dispSize).match(/(\d+(?:\.\d+)?)\s*inches?/i) || String(dispSize).match(/(\d+(?:\.\d+)?)\s*"/)
  if (dm) displaySize = parseFloat(dm[1])

  const mem = String(row['Internal Memory'] ?? '')
  const gbAll = mem.match(/(\d+)\s*GB/gi) || []
  let ram_gb = 0
  let storage_gb = 0
  if (gbAll.length >= 2) {
    ram_gb = parseInt(gbAll[0], 10)
    storage_gb = parseInt(gbAll[1], 10)
  } else if (gbAll.length === 1) {
    storage_gb = parseInt(gbAll[0], 10)
    ram_gb = storage_gb <= 32 ? storage_gb : 0
  }
  const tb = mem.match(/(\d+)\s*TB/i)
  if (tb) storage_gb = parseInt(tb[1], 10) * 1024

  let price_eur = null
  const pr = row['Price']
  if (pr != null && pr !== '') {
    const p = parseFloat(String(pr).replace(/[^\d.,]/g, '').replace(',', '.'))
    if (Number.isFinite(p)) price_eur = p
  }

  return {
    id,
    source_id,
    brand,
    model_raw: model || `Mobile ${index + 1}`,
    year_announced: parseYear(row['Year Announced']),
    display_size_inch: displaySize,
    display_resolution: row['Display Resolution'] ? String(row['Display Resolution']).trim() : null,
    ram_gb,
    storage_gb,
    chipset: row['Chipset'] ? String(row['Chipset']).trim() : null,
    cpu_raw: row['CPU'] ? String(row['CPU']).trim() : null,
    battery_type: row['Battery Type'] ? String(row['Battery Type']).trim() : null,
    price_eur,
    created_at: now,
    updated_at: now,
    is_active: true,
  }
}

function main() {
  const db = {
    version: 1,
    updated_at: now,
    laptops: [],
    mobiles: [],
  }

  // 1) Ноутбуки: сначала из laptopSpecs.json (если есть)
  const laptopSpecsPath = join(dataDir, 'laptopSpecs.json')
  if (existsSync(laptopSpecsPath)) {
    const existing = JSON.parse(readFileSync(laptopSpecsPath, 'utf8'))
    db.laptops = Array.isArray(existing) ? existing : []
    console.log('Загружено ноутбуков из laptopSpecs.json:', db.laptops.length)
  }

  // 2) Ноутбуки: добавить из laptop-db-excel.xlsx
  const laptopExcelPath = join(dataDir, 'laptop-db-excel.xlsx')
  if (existsSync(laptopExcelPath)) {
    const wb = XLSX.read(readFileSync(laptopExcelPath), { type: 'buffer' })
    const sheetName = wb.SheetNames[0]
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
    const start = db.laptops.length
    rows.forEach((row, i) => {
      const spec = excelLaptopRowToSpec(row, start + i)
      if (spec.brand && spec.model_raw) db.laptops.push(spec)
    })
    console.log('Добавлено ноутбуков из laptop-db-excel.xlsx:', db.laptops.length - start)
  }

  // 3) Мобильные: mobiles-spec-db.xlsx
  const mobileExcelPath = join(dataDir, 'mobiles-spec-db.xlsx')
  if (existsSync(mobileExcelPath)) {
    const wb = XLSX.read(readFileSync(mobileExcelPath), { type: 'buffer' })
    const sheetName = wb.SheetNames[0]
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
    rows.forEach((row, i) => {
      const spec = excelMobileRowToSpec(row, i)
      if (spec.brand && spec.model_raw) db.mobiles.push(spec)
    })
    console.log('Загружено мобильных из mobiles-spec-db.xlsx:', db.mobiles.length)
  }

  mkdirSync(dataDir, { recursive: true })
  const outPath = join(dataDir, 'specs-db.json')
  writeFileSync(outPath, JSON.stringify(db, null, 0), 'utf8')
  console.log('Сохранено:', outPath)
  console.log('Итого: ноутбуков', db.laptops.length, ', мобильных', db.mobiles.length)
}

main()
