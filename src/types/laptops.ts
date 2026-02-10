/**
 * Типы по ТЗ: Kaggle (LaptopSpec), инвентарь (InventoryLaptop),
 * маппинг инвентарь↔Kaggle (InventoryLaptopMatch), правила выкупа (BuybackRuleSet).
 */

// --- Enums (значения для полей) ---

export type StorageType = 'HDD' | 'SSD' | 'Hybrid' | 'Flash' | 'Other'
export type GpuType = 'integrated' | 'dedicated' | 'unknown'
export type LaptopClass =
  | 'office'
  | 'business'
  | 'gaming'
  | 'ultrabook'
  | 'workstation'
  | 'macbook'
  | 'other'
export type BuybackCondition =
  | 'new'
  | 'like_new'
  | 'good'
  | 'cosmetic'
  | 'defective'
  | 'not_working'

// --- LaptopSpec (Kaggle, нормализованная структура) ---

export interface LaptopSpec {
  id: string | number
  source_id: string
  brand: string
  model_raw: string
  cpu_raw: string
  ram_raw: string
  storage_raw: string
  price_eur: number

  series: string | null
  cpu_family: string
  cpu_model: string | null
  cpu_generation: number | null
  ram_gb: number
  storage_type: StorageType
  storage_gb: number
  gpu_type: GpuType
  gpu_model: string | null
  display_size_inch: number | null
  display_type: string | null
  year_released: number | null
  class: LaptopClass
  price_new_avg: number | null
  price_used_avg: number | null

  created_at: string
  updated_at: string
  is_active: boolean
}

// --- InventoryLaptop (позиция инвентаря как ноутбук) ---

export interface InventoryLaptop {
  id: string | number
  title: string
  brand: string
  model_raw: string
  cpu_raw: string
  ram_raw: string
  storage_raw: string
  gpu_raw: string

  series: string | null
  cpu_family: string
  cpu_model: string | null
  cpu_generation: number | null
  ram_gb: number
  storage_type: StorageType
  storage_gb: number
  gpu_type: GpuType
  gpu_model: string | null
  display_size_inch: number | null
  year_approx: number | null

  condition: BuybackCondition
  buyback_price_planned: number | null
  buyback_price_recommended: number | null
  notes: string | null
}

// --- InventoryLaptopMatch (связь инвентарь ↔ LaptopSpec) ---

export interface InventoryLaptopMatch {
  id: string | number
  inventory_laptop_id: string | number
  laptop_spec_id: string | number
  similarity_score: number
  is_primary: boolean
}

// --- BuybackRuleSet (коэффициенты для расчёта выкупа) ---

export interface BuybackRuleSet {
  id: string | number
  name: string
  base_ratio: number
  class_coefficients: Record<LaptopClass, number>
  age_coefficients: {
    age_0_2: number
    age_3_5: number
    age_6_plus: number
  }
  condition_coefficients: Record<BuybackCondition, number>
  currency: string
}
