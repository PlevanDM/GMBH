/**
 * Единая база спецификаций: один формат, один файл specs-db.json.
 * Содержит ноутбуки (LaptopSpec) и мобильные (MobileSpec).
 */

import type { LaptopSpec } from './laptops'

/** Единый файл базы: версия + массивы по типам */
export interface SpecsDb {
  version: number
  updated_at: string
  laptops: LaptopSpec[]
  mobiles: MobileSpec[]
}

/** Спецификация мобильного устройства (телефон/планшет) — тот же стиль полей, что и LaptopSpec */
export interface MobileSpec {
  id: string | number
  source_id: string
  brand: string
  model_raw: string

  year_announced: number | null
  display_size_inch: number | null
  display_resolution: string | null
  ram_gb: number
  storage_gb: number
  chipset: string | null
  cpu_raw: string | null
  battery_type: string | null
  price_eur: number | null

  created_at: string
  updated_at: string
  is_active: boolean
}
