/**
 * Правила выкупа (BuybackRuleSet): коэффициенты по классу, возрасту, состоянию.
 * Расчёт: buyback = price_used_avg × base_ratio × class_coef × age_coef × condition_coef.
 */

import type { BuybackRuleSet, LaptopSpec, InventoryLaptop } from '../types/laptops'

export const DEFAULT_BUYBACK_RULE_SET: BuybackRuleSet = {
  id: 'default',
  name: 'Ноутбуки по умолчанию',
  base_ratio: 0.6,
  class_coefficients: {
    office: 1,
    business: 1.05,
    gaming: 0.95,
    ultrabook: 1.1,
    workstation: 1.05,
    macbook: 1.15,
    other: 1,
  },
  age_coefficients: {
    age_0_2: 1,
    age_3_5: 0.85,
    age_6_plus: 0.7,
  },
  condition_coefficients: {
    new: 1,
    like_new: 0.95,
    good: 0.85,
    cosmetic: 0.7,
    defective: 0.5,
    not_working: 0.25,
  },
  currency: 'EUR',
}

function getAgeBucket(yearApprox: number | null, yearReleased: number | null): keyof BuybackRuleSet['age_coefficients'] {
  const year = yearApprox ?? yearReleased
  if (year == null) return 'age_3_5'
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  if (age <= 2) return 'age_0_2'
  if (age <= 5) return 'age_3_5'
  return 'age_6_plus'
}

/**
 * Рассчитывает рекомендованную выкупную цену для позиции инвентаря по подобранному LaptopSpec и набору правил.
 * Формула: price_used_avg (или price_eur как fallback) × base_ratio × class × age × condition.
 */
export function calculateBuybackPrice(
  inventoryLaptop: InventoryLaptop,
  primarySpec: LaptopSpec | null,
  ruleSet: BuybackRuleSet = DEFAULT_BUYBACK_RULE_SET
): { recommended: number; currency: string; breakdown?: string } {
  const priceBase = primarySpec?.price_used_avg ?? primarySpec?.price_new_avg ?? primarySpec?.price_eur ?? 0
  if (priceBase <= 0) {
    return { recommended: 0, currency: ruleSet.currency, breakdown: 'Нет базовой цены от подобранной модели' }
  }

  const classCoef = ruleSet.class_coefficients[primarySpec?.class ?? 'other'] ?? 1
  const ageBucket = getAgeBucket(inventoryLaptop.year_approx ?? null, primarySpec?.year_released ?? null)
  const ageCoef = ruleSet.age_coefficients[ageBucket] ?? 0.85
  const conditionCoef = ruleSet.condition_coefficients[inventoryLaptop.condition] ?? 0.85

  const recommended =
    Math.round(priceBase * ruleSet.base_ratio * classCoef * ageCoef * conditionCoef * 100) / 100

  return {
    recommended,
    currency: ruleSet.currency,
    breakdown: `База ${priceBase} × ${ruleSet.base_ratio} × класс ${classCoef} × возраст ${ageCoef} × состояние ${conditionCoef} ≈ ${recommended} ${ruleSet.currency}`,
  }
}

export function getDefaultRuleSet(): BuybackRuleSet {
  return DEFAULT_BUYBACK_RULE_SET
}
