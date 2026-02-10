/**
 * Данные NEXX-LAST: справочник PMIC и микросхем Apple iPhone.
 * Источник: https://github.com/PlevanDM/NEXX-LAST public/data/apple-pmic-reference.json
 */
export interface NexxPmicBySeries {
  main: string
  secondary?: string[]
  charging?: string
  chargingBoost?: string
  wirelessCharging?: string
  audioCodec?: string
  audioAmp?: string
}

export interface NexxPmicReference {
  version: string
  lastUpdated: string
  description: string
  sources: string[]
  pmicBySeries: Record<string, NexxPmicBySeries>
  audioCodecByModel: Record<string, string>
  diagnosticSymptoms: Record<string, string>
}

export const NEXX_PMIC_REFERENCE: NexxPmicReference = {
  version: '1.0',
  lastUpdated: '2026-01-31',
  description: 'Справочник PMIC и ключевых микросхем Apple iPhone для сервисного центра NEXX',
  sources: ['Apple Support', 'iFixit Chip ID', 'TechWalls', 'internal report 2026'],
  pmicBySeries: {
    'iPhone 17': { main: 'Apple 338S01119 (APL109A)', audioCodec: '338S00967' },
    'iPhone 16': {
      main: 'Apple 338S01119 (APL109A)',
      secondary: ['Qualcomm PMX65-000', 'STMicro STPMIA3C', 'Cirrus 338S00843'],
      charging: 'Texas Instruments CP3200B1G0',
      audioCodec: 'Cirrus Logic 338S00967',
      audioAmp: 'Cirrus Logic 338S01087',
    },
    'iPhone 15': { main: '338S00946-B0', chargingBoost: '338S00843', audioCodec: '338S00967' },
    'iPhone 14': { main: '338S00839-B0', chargingBoost: '338S00843', audioCodec: '338S00843' },
    'iPhone 13': { main: '338S00770-B0 (Tigris)', wirelessCharging: '338S00817', audioCodec: '338S00770' },
    'iPhone 12': { main: '338S00663 (Symphony)', audioCodec: '338S00663' },
    'iPhone 11': { main: '338S00519 (Hector)', audioCodec: '338S00519' },
    'iPhone XS': { main: '338S00309 (Tigris)', audioCodec: '338S00309' },
    'iPhone XR': { main: '338S00309', audioCodec: '338S00309' },
    'iPhone X': { main: '338S00309', audioCodec: '338S00309' },
    'iPhone 8': { main: '338S00309', audioCodec: '338S00309' },
    'iPhone 7': { main: '338S00233 (Tigris)', audioCodec: '338S00105' },
    'iPhone 6s': { main: '338S00128', audioCodec: '338S00105' },
    'iPhone 6': { main: '338S00097', audioCodec: '338S00097' },
    'iPhone SE': { main: '338S00128', audioCodec: '338S00105' },
  },
  audioCodecByModel: {
    'iPhone 17': '338S00967', 'iPhone 16': '338S00967', 'iPhone 16 Pro': '338S00967',
    'iPhone 15': '338S00967', 'iPhone 14': '338S00843', 'iPhone 13': '338S00770',
    'iPhone 12': '338S00663', 'iPhone 11': '338S00519', 'iPhone XS': '338S00309',
    'iPhone XR': '338S00309', 'iPhone X': '338S00309', 'iPhone 8': '338S00309',
    'iPhone 7': '338S00105', 'iPhone 7 Plus': '338S00105', 'iPhone 6s': '338S00105',
    'iPhone 6': '338S00097', 'iPhone SE': '338S00105',
  },
  diagnosticSymptoms: {
    deadNoPower: 'PMIC не выдаёт напряжения — проверить 338S01119/338S00946/338S00839/338S00770',
    bootLoop: 'Нестабильные линии питания PMIC',
    noCharging: 'CP3200B1G0 или 338S00843 (Charging Boost)',
    noTouch: 'Touch Boost 2Fxx (2F54, 2F0A, 2F1B, 2F3C) — iPhone 16 Pro Max',
    noAudio: '338S00967 (codec) или 338S01087 (amplifier)',
  },
}
