/**
 * Данные NEXX-LAST: зарядные станции и аксессуары (EcoFlow, BLUETTI, DJI, Jackery).
 * Источник: https://github.com/PlevanDM/NEXX-LAST public/data/power-stations.json
 */
export interface NexxOffer {
  supplier: string
  price: number
  currency: string
  region?: string
  note?: string
}

export interface NexxPowerStation {
  id: string
  brand: string
  name: string
  model?: string
  specs?: string
  price_eu: number
  currency?: string
  category: string
  offers: NexxOffer[]
}

export const NEXX_POWER_STATIONS: NexxPowerStation[] = [
  { id: 'bluetti-ac70p', brand: 'BLUETTI', name: 'Зарядна станція BLUETTI AC70P', price_eu: 910, category: 'Power Station', offers: [{ supplier: 'BLUETTI EU', price: 910, currency: 'EUR', region: 'EU' }, { supplier: 'Amazon DE', price: 899, currency: 'EUR', region: 'EU' }, { supplier: 'Local (est.)', price: 1047, currency: 'EUR', note: '+15% імпорт', region: 'UA' }] },
  { id: 'dji-power-2000', brand: 'DJI', name: 'Зарядна станція DJI Power 2000 (DYM2000H)', specs: '2048 Вт·год', price_eu: 1850, category: 'Power Station', offers: [{ supplier: 'DJI Official', price: 1850, currency: 'EUR' }, { supplier: 'Amazon DE', price: 1799, currency: 'EUR' }, { supplier: 'Local (est.)', price: 2130, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-pro-3', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow DELTA Pro 3 EU-Version', model: 'EFDELTAPRO3-EU-CBox', price_eu: 3050, currency: 'EUR', category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 3050, currency: 'EUR' }, { supplier: 'Amazon DE', price: 2899, currency: 'EUR' }, { supplier: 'Local (est.)', price: 3508, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-pro', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow DELTA Pro', model: 'DELTAPro-EU', price_eu: 2650, category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 2650, currency: 'EUR' }, { supplier: 'Amazon DE', price: 2490, currency: 'EUR' }, { supplier: 'Local (est.)', price: 3048, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-2-max', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow DELTA 2 Max', model: 'EFDELTA2Max-EU', price_eu: 1950, category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 1950, currency: 'EUR' }, { supplier: 'Amazon DE', price: 1899, currency: 'EUR' }, { supplier: 'Local (est.)', price: 2243, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-3-plus', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow DELTA 3 Plus', model: 'EF_DELTA3Plus', price_eu: 1360, category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 1360, currency: 'EUR' }, { supplier: 'Amazon DE', price: 1299, currency: 'EUR' }, { supplier: 'Local (est.)', price: 1564, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-river-2-pro', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow RIVER 2 Pro', model: 'EF RIVER 2 Pro', specs: '768 Вт·год', price_eu: 429, category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 429, currency: 'EUR' }, { supplier: 'Amazon DE', price: 399, currency: 'EUR' }, { supplier: 'Local (est.)', price: 493, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-river-2-max', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow RIVER 2 Max', model: 'EF RIVER 2 Max', specs: '512 Вт·год', price_eu: 349, category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 349, currency: 'EUR' }, { supplier: 'Amazon DE', price: 329, currency: 'EUR' }, { supplier: 'Local (est.)', price: 401, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-river-2', brand: 'EcoFlow', name: 'Зарядна станція EcoFlow RIVER 2', model: 'EF RIVER 2', specs: '256 Вт·год', price_eu: 229, category: 'Power Station', offers: [{ supplier: 'EcoFlow EU', price: 229, currency: 'EUR' }, { supplier: 'Amazon DE', price: 219, currency: 'EUR' }, { supplier: 'Local (est.)', price: 263, currency: 'EUR', note: '+15%' }] },
  { id: 'bluetti-eb55', brand: 'BLUETTI', name: 'Зарядна станція BLUETTI EB55', model: 'EB55', specs: '537 Вт·год, 700 Вт AC', price_eu: 379, category: 'Power Station', offers: [{ supplier: 'BLUETTI EU', price: 379, currency: 'EUR' }, { supplier: 'Amazon DE', price: 359, currency: 'EUR' }, { supplier: 'Local (est.)', price: 436, currency: 'EUR', note: '+15%' }] },
  { id: 'bluetti-eb3a', brand: 'BLUETTI', name: 'Зарядна станція BLUETTI EB3A', model: 'EB3A', specs: '268 Вт·год', price_eu: 229, category: 'Power Station', offers: [{ supplier: 'BLUETTI EU', price: 229, currency: 'EUR' }, { supplier: 'Amazon DE', price: 219, currency: 'EUR' }, { supplier: 'Local (est.)', price: 263, currency: 'EUR', note: '+15%' }] },
  { id: 'bluetti-eb70', brand: 'BLUETTI', name: 'Зарядна станція BLUETTI EB70', model: 'EB70', specs: '716 Вт·год', price_eu: 499, category: 'Power Station', offers: [{ supplier: 'BLUETTI EU', price: 499, currency: 'EUR' }, { supplier: 'Amazon DE', price: 469, currency: 'EUR' }, { supplier: 'Local (est.)', price: 574, currency: 'EUR', note: '+15%' }] },
  { id: 'jackery-explorer-300', brand: 'Jackery', name: 'Зарядна станція Jackery Explorer 300', model: 'Explorer 300', specs: '293 Вт·год', price_eu: 279, category: 'Power Station', offers: [{ supplier: 'Jackery EU', price: 279, currency: 'EUR' }, { supplier: 'Amazon DE', price: 259, currency: 'EUR' }, { supplier: 'Local (est.)', price: 321, currency: 'EUR', note: '+15%' }] },
  { id: 'jackery-explorer-500', brand: 'Jackery', name: 'Зарядна станція Jackery Explorer 500', model: 'Explorer 500', specs: '518 Вт·год', price_eu: 429, category: 'Power Station', offers: [{ supplier: 'Jackery EU', price: 429, currency: 'EUR' }, { supplier: 'Amazon DE', price: 399, currency: 'EUR' }, { supplier: 'Local (est.)', price: 493, currency: 'EUR', note: '+15%' }] },
  { id: 'jackery-explorer-1000', brand: 'Jackery', name: 'Зарядна станція Jackery Explorer 1000', model: 'Explorer 1000', specs: '1002 Вт·год', price_eu: 749, category: 'Power Station', offers: [{ supplier: 'Jackery EU', price: 749, currency: 'EUR' }, { supplier: 'Amazon DE', price: 699, currency: 'EUR' }, { supplier: 'Local (est.)', price: 861, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-pro-ultra-eb', brand: 'EcoFlow', name: 'Додаткова батарея для EcoFlow DELTA Pro Ultra', price_eu: 3620, category: 'Battery', offers: [{ supplier: 'EcoFlow EU', price: 3620, currency: 'EUR' }, { supplier: 'Amazon DE', price: 3499, currency: 'EUR' }, { supplier: 'Local (est.)', price: 4163, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-3-max-plus-eb', brand: 'EcoFlow', name: 'Додаткова батарея для EcoFlow DELTA 3 Max Plus', model: 'EFD3MP-EB', price_eu: 1490, category: 'Battery', offers: [{ supplier: 'EcoFlow EU', price: 1490, currency: 'EUR' }, { supplier: 'Amazon DE', price: 1429, currency: 'EUR' }, { supplier: 'Local (est.)', price: 1714, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-delta-3-eb', brand: 'EcoFlow', name: 'Додаткова батарея для EcoFlow DELTA 3 Extra Battery', model: 'EFDELTA3P-EB', price_eu: 1080, category: 'Battery', offers: [{ supplier: 'EcoFlow EU', price: 1080, currency: 'EUR' }, { supplier: 'Amazon DE', price: 1049, currency: 'EUR' }, { supplier: 'Local (est.)', price: 1242, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-alternator-charger-500w', brand: 'EcoFlow', name: 'EcoFlow Alternator Charger 500W', model: 'EFAlternatorCharger-EU', price_eu: 355, category: 'Charger', offers: [{ supplier: 'EcoFlow EU', price: 355, currency: 'EUR' }, { supplier: 'Amazon DE', price: 339, currency: 'EUR' }, { supplier: 'Local (est.)', price: 408, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-stream-microinverter', brand: 'EcoFlow', name: 'EcoFlow STREAM Microinverter', model: 'EFStreamMI800W+AC5M+PV3M*4', price_eu: 285, category: 'Inverter', offers: [{ supplier: 'EcoFlow EU', price: 285, currency: 'EUR' }, { supplier: 'Amazon DE', price: 269, currency: 'EUR' }, { supplier: 'Local (est.)', price: 328, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-powerstream-800w', brand: 'EcoFlow', name: 'EcoFlow PowerStream Microinverter 800W', model: 'EFPowerStreamMI-EU-800W', price_eu: 230, category: 'Inverter', offers: [{ supplier: 'EcoFlow EU', price: 230, currency: 'EUR' }, { supplier: 'Amazon DE', price: 219, currency: 'EUR' }, { supplier: 'Local (est.)', price: 265, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-xt150-cable', brand: 'EcoFlow', name: 'EcoFlow Кабель XT150', model: 'EFL-BKWDELTAEBCable-0.4m', price_eu: 45, category: 'Cable', offers: [{ supplier: 'EcoFlow EU', price: 45, currency: 'EUR' }, { supplier: 'Amazon DE', price: 42, currency: 'EUR' }, { supplier: 'Local (est.)', price: 52, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-stream-parallel-cable', brand: 'EcoFlow', name: 'EcoFlow STREAM Parallel Cable', price_eu: 45, category: 'Cable', offers: [{ supplier: 'EcoFlow EU', price: 45, currency: 'EUR' }, { supplier: 'Amazon DE', price: 42, currency: 'EUR' }, { supplier: 'Local (est.)', price: 52, currency: 'EUR', note: '+15%' }] },
  { id: 'ecoflow-car-charge-xt60', brand: 'EcoFlow', name: 'EcoFlow Car Charge XT60 Cable', model: 'EFCAR-XT60CBL1.5M', price_eu: 42, category: 'Cable', offers: [{ supplier: 'EcoFlow EU', price: 42, currency: 'EUR' }, { supplier: 'Amazon DE', price: 39, currency: 'EUR' }, { supplier: 'Local (est.)', price: 48, currency: 'EUR', note: '+15%' }] },
  { id: 'walter-inverter-1000w', brand: 'Walter', name: 'Генеротор Walter inverter 1000W', price_eu: 500, category: 'Generator', offers: [{ supplier: 'Walter EU', price: 500, currency: 'EUR' }, { supplier: 'Amazon DE', price: 479, currency: 'EUR' }, { supplier: 'Local (est.)', price: 575, currency: 'EUR', note: '+15%' }] },
]
