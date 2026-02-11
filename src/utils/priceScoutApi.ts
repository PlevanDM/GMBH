/**
 * Multi-source price fetcher v2 for Price Scout.
 *
 * Sources (6):
 *  1. eBay.de — used listings (CORS proxy + HTML parsing)
 *  2. BackMarket — refurbished
 *  3. Idealo.de — price comparison
 *  4. Geizhals — DACH price comparison
 *  5. reBuy.de — certified refurbished
 *  6. Amazon.de — new/used marketplace
 *
 * Improvements v2:
 *  - Per-source query optimization (strip/add keywords per marketplace)
 *  - Relevance filtering (sanity-check prices against estimate)
 *  - IQR-based outlier removal
 *  - Weighted aggregation (eBay used > BackMarket refurb > Idealo mixed)
 *  - Price history tracking in localStorage
 *  - Cross-validation with estimate engine
 */

import { quickEstimate, crossValidate, type PriceEstimate, type ValuationType } from './priceEstimator'

/* ── Types ── */
export interface MarketPrice {
  source: string
  sourceId: string
  prices: number[]
  low: number
  mid: number
  high: number
  currency: string
  count: number
  condition?: string
  url?: string
  fetchedAt: string
  /** Weight 0-1 for aggregation (higher = more trusted) */
  weight: number
}

export interface SourceStatus {
  sourceId: string
  label: string
  status: 'ok' | 'no-data' | 'error'
}

export interface PriceScoutResult {
  query: string
  brand: string
  model: string
  valuationType: ValuationType
  sources: MarketPrice[]
  /** Per-source fetch status for UI feedback */
  sourceStatuses: SourceStatus[]
  estimate: PriceEstimate
  aggregated: {
    low: number
    mid: number
    high: number
    weightedMid: number
    sources: number
    totalListings: number
    confidence: number
  }
  fetchedAt: string
  cached: boolean
}

/* ── Cache (sessionStorage for session, localStorage for history) ── */
const CACHE_KEY = 'restart-price-scout-cache'
const HISTORY_KEY = 'restart-price-scout-history'
const CACHE_TTL = 4 * 60 * 60 * 1000

interface CacheEntry { result: PriceScoutResult; ts: number }

function getCache(): Record<string, CacheEntry> {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function getCached(query: string): PriceScoutResult | null {
  const cache = getCache()
  const entry = cache[query.toLowerCase()]
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) return null
  return { ...entry.result, cached: true }
}

function setCache(query: string, result: PriceScoutResult) {
  const cache = getCache()
  const keys = Object.keys(cache)
  if (keys.length >= 50) {
    const sorted = keys.sort((a, b) => cache[a].ts - cache[b].ts)
    const toRemove = sorted.slice(0, keys.length - 40) // Keep only latest 40
    for (const k of toRemove) delete cache[k]
  }
  cache[query.toLowerCase()] = { result, ts: Date.now() }
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

/* ── Price History (localStorage, persistent across sessions) ── */
interface HistoryEntry {
  query: string
  mid: number
  low: number
  high: number
  sources: number
  ts: number
}

export function getPriceHistory(query: string): HistoryEntry[] {
  try {
    const all: Record<string, HistoryEntry[]> = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
    return all[query.toLowerCase()] || []
  } catch { return [] }
}

function addToHistory(query: string, result: PriceScoutResult) {
  try {
    const all: Record<string, HistoryEntry[]> = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
    const key = query.toLowerCase()
    if (!all[key]) all[key] = []
    all[key].push({
      query,
      mid: result.aggregated.weightedMid,
      low: result.aggregated.low,
      high: result.aggregated.high,
      sources: result.sources.length,
      ts: Date.now(),
    })
    // Keep max 20 entries per query
    if (all[key].length > 20) all[key] = all[key].slice(-20)
    // Keep max 100 queries
    const qKeys = Object.keys(all)
    if (qKeys.length >= 100) {
      const sortedKeys = qKeys.sort((a, b) => {
        const lastA = all[a][all[a].length - 1]?.ts || 0
        const lastB = all[b][all[b].length - 1]?.ts || 0
        return lastA - lastB
      })
      const toRemove = sortedKeys.slice(0, qKeys.length - 80) // Keep latest 80
      for (const k of toRemove) delete all[k]
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

/* ── CORS Proxies ── */
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

async function fetchViaCorsProxy(url: string, timeoutMs = 10000): Promise<string | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController()
      const tid = setTimeout(() => controller.abort(), timeoutMs)
      const resp = await fetch(proxy(url), {
        signal: controller.signal,
        headers: { Accept: 'text/html,application/json,*/*' },
      })
      clearTimeout(tid)
      if (resp.ok) {
        const text = await resp.text()
        if (text && text.length > 200) return text
      }
    } catch {
      // try next proxy
    }
  }
  return null
}

/* ── Per-marketplace query optimization ── */
function optimizeQueryForSource(query: string, sourceId: string): string {
  // Clean the query: remove excess whitespace, special chars
  let q = query.trim().replace(/\s+/g, ' ')

  switch (sourceId) {
    case 'ebay':
      // eBay: keep brand+model, add "laptop" if not present for better results
      if (!/\b(laptop|notebook|macbook|thinkpad|elitebook|latitude|xps|surface)\b/i.test(q)) {
        q += ' laptop'
      }
      break
    case 'backmarket':
      // BackMarket: shorter queries work better, remove year
      q = q.replace(/\b20[1-2]\d\b/g, '').replace(/\s+/g, ' ').trim()
      break
    case 'rebuy':
      // reBuy: very specific, keep as is but strip condition words
      q = q.replace(/\b(grade\s*[a-d]\+?|refurbished|used|gebraucht)\b/gi, '').trim()
      break
    case 'amazon':
      // Amazon: add "gebraucht" for used results
      q += ' gebraucht'
      break
    case 'idealo':
    case 'geizhals':
      // These work well with exact product names
      break
  }

  return q
}

/* ── Price extraction helpers ── */
function extractEurPrices(html: string, minPrice = 30, maxPrice = 15000): number[] {
  const prices: number[] = []
  const patterns = [
    // Standard EUR patterns
    /EUR\s*(\d{1,6}[.,]\d{2})/g,
    /(\d{1,6}[.,]\d{2})\s*€/g,
    /€\s*(\d{1,6}[.,]\d{2})/g,
    /(\d{1,6}[.,]\d{2})\s*EUR/g,
    // Data attributes
    /data-price[^"]*"(\d+\.?\d*)"/g,
    // JSON price fields
    /"(?:prc|price|currentPrice|binPrice|amount|lowPrice|salePrice)"[:\s]*["{]?(\d+\.?\d*)/g,
  ]

  for (const pattern of patterns) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(',', '.')
      const val = parseFloat(raw)
      if (val >= minPrice && val <= maxPrice && !isNaN(val)) {
        prices.push(Math.round(val * 100) / 100)
      }
    }
  }

  return prices
}

function deduplicatePrices(prices: number[], threshold = 1): number[] {
  if (prices.length === 0) return []
  const sorted = [...prices].sort((a, b) => a - b)
  const result: number[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - result[result.length - 1] > threshold) {
      result.push(sorted[i])
    }
  }
  return result
}

/** IQR-based outlier removal (more robust than simple percentile) */
function removeOutliersIQR(prices: number[]): number[] {
  if (prices.length <= 4) return prices
  const sorted = [...prices].sort((a, b) => a - b)
  const n = sorted.length
  const q1 = sorted[Math.floor(n * 0.25)]
  const q3 = sorted[Math.ceil(n * 0.75) - 1]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  return sorted.filter(p => p >= lowerBound && p <= upperBound)
}

/** Relevance filter: prices that are wildly off from estimate are likely for accessories */
function relevanceFilter(prices: number[], estimateMid: number): number[] {
  if (!estimateMid || estimateMid <= 0 || prices.length === 0) return prices
  // Accept prices within 0.15x to 4x of estimate (very generous)
  const low = estimateMid * 0.15
  const high = estimateMid * 4.0
  const filtered = prices.filter(p => p >= low && p <= high)
  // If we filtered everything, return original (estimate might be wrong)
  return filtered.length >= 2 ? filtered : prices
}

function computeStats(prices: number[]): { low: number; mid: number; high: number } {
  if (prices.length === 0) return { low: 0, mid: 0, high: 0 }
  const sorted = [...prices].sort((a, b) => a - b)
  const low = Math.round(sorted[0])
  const high = Math.round(sorted[sorted.length - 1])
  // Use median instead of mean for robustness
  const midIdx = Math.floor(sorted.length / 2)
  const mid = sorted.length % 2 === 0
    ? Math.round((sorted[midIdx - 1] + sorted[midIdx]) / 2)
    : Math.round(sorted[midIdx])
  return { low, mid, high }
}

/* ── eBay.de ── */
function parseEbayPrices(html: string): number[] {
  const prices = extractEurPrices(html, 20, 15000)

  // eBay-specific: s-item__price class
  const itemPricePattern = /s-item__price[^>]*>([^<]*)</g
  let m: RegExpExecArray | null
  while ((m = itemPricePattern.exec(html)) !== null) {
    const numMatch = m[1].match(/(\d{1,6}[.,]\d{2})/)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.'))
      if (val >= 20 && val <= 15000) prices.push(val)
    }
  }

  return deduplicatePrices(prices)
}

async function fetchEbayPrices(query: string, estimateMid: number): Promise<MarketPrice | null> {
  const q = optimizeQueryForSource(query, 'ebay')
  const url = `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_ItemCondition=3000&_sop=15&rt=nc&_ipg=60`
  const html = await fetchViaCorsProxy(url)
  if (!html) return null

  let prices = parseEbayPrices(html)
  prices = relevanceFilter(prices, estimateMid)
  prices = removeOutliersIQR(prices)
  if (prices.length < 2) return null

  const stats = computeStats(prices)
  return {
    source: 'eBay.de', sourceId: 'ebay', prices, ...stats,
    currency: 'EUR', count: prices.length, condition: 'used',
    url, fetchedAt: new Date().toISOString(), weight: 0.9,
  }
}

/* ── BackMarket ── */
function parseBackMarketPrices(html: string): number[] {
  const prices = extractEurPrices(html, 50, 10000)

  // BackMarket also uses data-qa attributes for prices
  const bmPattern = /data-qa="[^"]*price[^"]*"[^>]*>([^<]*)</gi
  let m: RegExpExecArray | null
  while ((m = bmPattern.exec(html)) !== null) {
    const numMatch = m[1].match(/(\d{1,6}[.,]\d{2})/)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.'))
      if (val >= 50 && val <= 10000) prices.push(val)
    }
  }

  return deduplicatePrices(prices)
}

async function fetchBackMarketPrices(query: string, estimateMid: number): Promise<MarketPrice | null> {
  const q = optimizeQueryForSource(query, 'backmarket')
  const url = `https://www.backmarket.de/de-de/search?q=${encodeURIComponent(q)}`
  const html = await fetchViaCorsProxy(url)
  if (!html) return null

  let prices = parseBackMarketPrices(html)
  prices = relevanceFilter(prices, estimateMid)
  prices = removeOutliersIQR(prices)
  if (prices.length < 2) return null

  const stats = computeStats(prices)
  return {
    source: 'Back Market', sourceId: 'backmarket', prices, ...stats,
    currency: 'EUR', count: prices.length, condition: 'refurbished',
    url, fetchedAt: new Date().toISOString(), weight: 0.85,
  }
}

/* ── Idealo.de ── */
function parseIdealoPrices(html: string): number[] {
  const prices = extractEurPrices(html, 50, 15000)

  // Idealo uses offerPrice elements
  const offerPattern = /offerPrice[^>]*>([^<]*)/g
  let m: RegExpExecArray | null
  while ((m = offerPattern.exec(html)) !== null) {
    const numMatch = m[1].match(/(\d{1,6}[.,]\d{2})/)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.'))
      if (val >= 50 && val <= 15000) prices.push(val)
    }
  }

  return deduplicatePrices(prices)
}

async function fetchIdealoPrices(query: string, estimateMid: number): Promise<MarketPrice | null> {
  const q = optimizeQueryForSource(query, 'idealo')
  const url = `https://www.idealo.de/preisvergleich/MainSearchProduct.html?q=${encodeURIComponent(q)}`
  const html = await fetchViaCorsProxy(url)
  if (!html) return null

  let prices = parseIdealoPrices(html)
  prices = relevanceFilter(prices, estimateMid)
  prices = removeOutliersIQR(prices)
  if (prices.length < 1) return null

  const stats = computeStats(prices)
  return {
    source: 'Idealo.de', sourceId: 'idealo', prices, ...stats,
    currency: 'EUR', count: prices.length, condition: 'mixed',
    url, fetchedAt: new Date().toISOString(), weight: 0.7,
  }
}

/* ── Geizhals ── */
async function fetchGeizhalsPrices(query: string, estimateMid: number): Promise<MarketPrice | null> {
  const q = optimizeQueryForSource(query, 'geizhals')
  const url = `https://geizhals.eu/?fs=${encodeURIComponent(q)}`
  const html = await fetchViaCorsProxy(url)
  if (!html) return null

  let prices = extractEurPrices(html, 50, 15000)

  // Geizhals-specific price container
  const ghPattern = /gh_price[^>]*>([^<]*)/g
  let m: RegExpExecArray | null
  while ((m = ghPattern.exec(html)) !== null) {
    const numMatch = m[1].match(/(\d{1,6}[.,]\d{2})/)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.'))
      if (val >= 50 && val <= 15000) prices.push(val)
    }
  }

  prices = deduplicatePrices(prices)
  prices = relevanceFilter(prices, estimateMid)
  prices = removeOutliersIQR(prices)
  if (prices.length < 1) return null

  const stats = computeStats(prices)
  return {
    source: 'Geizhals', sourceId: 'geizhals', prices, ...stats,
    currency: 'EUR', count: prices.length, condition: 'mixed',
    url, fetchedAt: new Date().toISOString(), weight: 0.7,
  }
}

/* ── reBuy.de ── */
function parseRebuyPrices(html: string): number[] {
  const prices = extractEurPrices(html, 30, 8000)

  // reBuy uses product-price elements
  const rbPattern = /product-price[^>]*>([^<]*)/gi
  let m: RegExpExecArray | null
  while ((m = rbPattern.exec(html)) !== null) {
    const numMatch = m[1].match(/(\d{1,6}[.,]\d{2})/)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.'))
      if (val >= 30 && val <= 8000) prices.push(val)
    }
  }

  return deduplicatePrices(prices)
}

async function fetchRebuyPrices(query: string, estimateMid: number): Promise<MarketPrice | null> {
  const q = optimizeQueryForSource(query, 'rebuy')
  const url = `https://www.rebuy.de/kaufen/suchen?q=${encodeURIComponent(q)}`
  const html = await fetchViaCorsProxy(url)
  if (!html) return null

  let prices = parseRebuyPrices(html)
  prices = relevanceFilter(prices, estimateMid)
  prices = removeOutliersIQR(prices)
  if (prices.length < 1) return null

  const stats = computeStats(prices)
  return {
    source: 'reBuy.de', sourceId: 'rebuy', prices, ...stats,
    currency: 'EUR', count: prices.length, condition: 'refurbished',
    url, fetchedAt: new Date().toISOString(), weight: 0.8,
  }
}

/* ── Amazon.de ── */
function parseAmazonPrices(html: string): number[] {
  const prices = extractEurPrices(html, 50, 15000)

  // Amazon uses a-price-whole / a-price-fraction
  const aPattern = /a-price-whole[^>]*>(\d{1,6})/g
  let m: RegExpExecArray | null
  while ((m = aPattern.exec(html)) !== null) {
    const val = parseFloat(m[1])
    if (val >= 50 && val <= 15000) prices.push(val)
  }

  // Amazon used price pattern
  const usedPattern = /Gebraucht[^€]*?(\d{1,6}[.,]\d{2})\s*€/gi
  while ((m = usedPattern.exec(html)) !== null) {
    const val = parseFloat(m[1].replace(',', '.'))
    if (val >= 50 && val <= 15000) prices.push(val)
  }

  return deduplicatePrices(prices)
}

async function fetchAmazonPrices(query: string, estimateMid: number): Promise<MarketPrice | null> {
  const q = optimizeQueryForSource(query, 'amazon')
  const url = `https://www.amazon.de/s?k=${encodeURIComponent(q)}&i=computers`
  const html = await fetchViaCorsProxy(url)
  if (!html) return null

  let prices = parseAmazonPrices(html)
  prices = relevanceFilter(prices, estimateMid)
  prices = removeOutliersIQR(prices)
  if (prices.length < 1) return null

  const stats = computeStats(prices)
  return {
    source: 'Amazon.de', sourceId: 'amazon', prices, ...stats,
    currency: 'EUR', count: prices.length, condition: 'mixed',
    url, fetchedAt: new Date().toISOString(), weight: 0.6,
  }
}

/* ── Weighted Aggregation ── */
function weightedAggregate(
  sources: MarketPrice[],
  estimate: PriceEstimate,
): {
  low: number; mid: number; high: number; weightedMid: number
  sources: number; totalListings: number; confidence: number
} {
  const totalListings = sources.reduce((a, s) => a + s.count, 0)

  if (sources.length === 0) {
    // Only estimate available
    return {
      low: estimate.low,
      mid: estimate.mid,
      high: estimate.high,
      weightedMid: estimate.mid,
      sources: 1,
      totalListings: 0,
      confidence: estimate.confidence,
    }
  }

  // Weighted median of mid prices
  const weightedPrices: { price: number; weight: number }[] = sources.map(s => ({
    price: s.mid,
    weight: s.weight * Math.min(s.count, 20), // cap listing count impact
  }))
  // Add estimate with lower weight
  weightedPrices.push({
    price: estimate.mid,
    weight: Math.max(0.3, 1 - sources.length * 0.15), // less weight as more real sources
  })

  // Sort by price
  weightedPrices.sort((a, b) => a.price - b.price)

  // Find weighted median
  const totalWeight = weightedPrices.reduce((a, wp) => a + wp.weight, 0)
  let cumWeight = 0
  let weightedMid = weightedPrices[0].price
  for (const wp of weightedPrices) {
    cumWeight += wp.weight
    if (cumWeight >= totalWeight / 2) {
      weightedMid = wp.price
      break
    }
  }
  weightedMid = Math.round(weightedMid)

  // Low = min of all lows; High = max of all highs
  const allLows = [...sources.map(s => s.low), estimate.low]
  const allHighs = [...sources.map(s => s.high), estimate.high]
  const low = Math.round(Math.min(...allLows))
  const high = Math.round(Math.max(...allHighs))

  // Simple mean as secondary mid
  const allMids = sources.map(s => s.mid)
  allMids.push(estimate.mid)
  const mid = Math.round(allMids.reduce((a, b) => a + b, 0) / allMids.length)

  // Confidence: cross-validate estimate with fetched data
  const cv = crossValidate(estimate, weightedMid)
  const confidence = Math.min(95, cv.adjustedConfidence + sources.length * 5)

  return { low, mid, high, weightedMid, sources: sources.length + 1, totalListings, confidence }
}

/* ── Main API ── */
export async function fetchPriceScout(
  brand: string,
  model: string,
  query?: string,
  options?: { skipCache?: boolean; valuationType?: ValuationType },
): Promise<PriceScoutResult> {
  const searchQuery = query || `${brand} ${model}`.trim()
  const vType = options?.valuationType || 'retail'
  const cacheKey = `${vType}:${searchQuery}`

  // Check cache
  if (!options?.skipCache) {
    const cached = getCached(cacheKey)
    if (cached) return cached
  }

  // Get local estimate (always works, needed for relevance filtering)
  const estimate = quickEstimate(brand, model, vType)

  // Fetch from all 6 sources in parallel
  const SOURCE_META = [
    { id: 'ebay', label: 'eBay.de' },
    { id: 'backmarket', label: 'Back Market' },
    { id: 'idealo', label: 'Idealo.de' },
    { id: 'geizhals', label: 'Geizhals' },
    { id: 'rebuy', label: 'reBuy.de' },
    { id: 'amazon', label: 'Amazon.de' },
  ]
  const results = await Promise.allSettled([
    fetchEbayPrices(searchQuery, estimate.mid),
    fetchBackMarketPrices(searchQuery, estimate.mid),
    fetchIdealoPrices(searchQuery, estimate.mid),
    fetchGeizhalsPrices(searchQuery, estimate.mid),
    fetchRebuyPrices(searchQuery, estimate.mid),
    fetchAmazonPrices(searchQuery, estimate.mid),
  ])

  const sources: MarketPrice[] = []
  const sourceStatuses: SourceStatus[] = []
  for (let idx = 0; idx < results.length; idx++) {
    const r = results[idx]
    const meta = SOURCE_META[idx]
    if (r.status === 'fulfilled' && r.value) {
      sources.push(r.value)
      sourceStatuses.push({ sourceId: meta.id, label: meta.label, status: 'ok' })
    } else if (r.status === 'rejected') {
      sourceStatuses.push({ sourceId: meta.id, label: meta.label, status: 'error' })
    } else {
      sourceStatuses.push({ sourceId: meta.id, label: meta.label, status: 'no-data' })
    }
  }

  // Weighted aggregation
  const aggregated = weightedAggregate(sources, estimate)

  const result: PriceScoutResult = {
    query: searchQuery,
    brand,
    model,
    valuationType: vType,
    sources,
    sourceStatuses,
    estimate,
    aggregated,
    fetchedAt: new Date().toISOString(),
    cached: false,
  }

  // Cache + history
  setCache(cacheKey, result)
  addToHistory(searchQuery, result)

  return result
}
