import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, ExternalLink, TrendingUp, Package, Bookmark, BookmarkCheck,
  Trash2, Copy, Check, Loader2, RefreshCw, Info, DollarSign, BarChart3,
  ArrowDown, ArrowUp, Minus, AlertTriangle, History, Target, Zap, ListChecks,
} from 'lucide-react'
import { useInventory } from '../../store/inventoryStore'
import { getMarketplaceLinks, getProductSearchQuery, type MarketplaceLink } from '../../utils/marketplaceUrls'
import { fetchPriceScout, getPriceHistory, type PriceScoutResult, type MarketPrice } from '../../utils/priceScoutApi'
import { quickEstimate, type PriceEstimate, parseDeviceFromQuery } from '../../utils/priceEstimator'

/* ── Marketplace URLs ── */
function getEbayUrl(query: string): string {
  return `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_ItemCondition=3000&rt=nc`
}
function getBackmarketUrl(query: string): string {
  return `https://www.backmarket.de/de-de/search?q=${encodeURIComponent(query)}`
}
function getRebuyUrl(query: string): string {
  return `https://www.rebuy.de/kaufen/suchen?q=${encodeURIComponent(query)}`
}

/* ── Saved Lookups ── */
interface SavedLookup {
  id: string; query: string; brand: string; model: string; note?: string; savedAt: string
}
const SAVED_KEY = 'restart-price-lookups'
function loadSaved(): SavedLookup[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') } catch { return [] }
}
function persistSaved(list: SavedLookup[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list))
}

/* ── Colors ── */
const MC: Record<string, { bg: string; text: string; border: string }> = {
  idealo: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  geizhals: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  google: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  amazon: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ebay: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  backmarket: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  rebuy: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
}

/* ── Format ── */
function fmtPrice(val: number | undefined | null): string {
  if (val == null || (typeof val === 'number' && isNaN(val))) return '—'
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function ConfidenceBadge({ value }: { value: number }) {
  const capped = Math.min(value, 95)
  const color = capped >= 60 ? 'text-green-600 bg-green-50' : capped >= 40 ? 'text-amber-600 bg-amber-50' : 'text-neutral-500 bg-neutral-100'
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {capped >= 60 ? <BarChart3 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
      {capped}%
    </span>
  )
}

/* ── Source Price Card ── */
function SourcePriceCard({ mp }: { mp: MarketPrice }) {
  const c = MC[mp.sourceId] || MC.idealo
  return (
    <a
      href={mp.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group rounded-xl border ${c.border} ${c.bg} p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 block`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{mp.source}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-500">{mp.count} offers</span>
          <ExternalLink className={`w-3 h-3 ${c.text} opacity-40 group-hover:opacity-100`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-xl font-extrabold ${c.text}`}>{fmtPrice(mp.mid)}</span>
        <span className="text-[11px] text-neutral-400 font-medium">median</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500">
        <span className="flex items-center gap-0.5"><ArrowDown className="w-3 h-3 text-green-500" />{fmtPrice(mp.low)}</span>
        <span className="flex items-center gap-0.5"><ArrowUp className="w-3 h-3 text-red-500" />{fmtPrice(mp.high)}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {mp.condition && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-neutral-500 font-medium capitalize">
            {mp.condition}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-neutral-400">
          weight: {Math.round(mp.weight * 100)}%
        </span>
      </div>
    </a>
  )
}

/* ── Recommended Sell Price ── */
function SellRecommendation({
  priceResult,
  inventoryPrice,
}: {
  priceResult: PriceScoutResult
  inventoryPrice?: number
}) {
  const { aggregated, estimate } = priceResult
  const marketMid = aggregated.weightedMid

  // Recommended sell prices for different conditions
  const sellPrices = {
    gradeA: Math.round(marketMid * 1.1),
    gradeB: Math.round(marketMid * 0.95),
    gradeC: Math.round(marketMid * 0.75),
    quickSale: Math.round(marketMid * 0.8),
  }

  const delta = inventoryPrice ? marketMid - inventoryPrice : null
  const deltaPct = inventoryPrice && inventoryPrice > 0 ? Math.round(((marketMid - inventoryPrice) / inventoryPrice) * 100) : null

  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent p-4">
      <h4 className="text-xs font-bold text-primary flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-accent" />
        Рекомендованные цены продажи
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-[10px] font-semibold text-neutral-500 uppercase mb-1">Grade A</div>
          <div className="text-base font-extrabold text-green-600">{fmtPrice(sellPrices.gradeA)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-semibold text-neutral-500 uppercase mb-1">Grade B</div>
          <div className="text-base font-extrabold text-primary">{fmtPrice(sellPrices.gradeB)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-semibold text-neutral-500 uppercase mb-1">Grade C</div>
          <div className="text-base font-extrabold text-amber-600">{fmtPrice(sellPrices.gradeC)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-semibold text-neutral-500 uppercase mb-1">Quick Sale</div>
          <div className="text-base font-extrabold text-red-500">{fmtPrice(sellPrices.quickSale)}</div>
        </div>
      </div>

      {inventoryPrice != null && inventoryPrice > 0 && (
        <div className="mt-3 pt-3 border-t border-accent/10 flex flex-wrap items-center gap-3">
          <span className="text-xs text-neutral-500">Ваша цена: <strong className="text-primary">{fmtPrice(inventoryPrice)}</strong></span>
          <span className="text-xs text-neutral-500">Рынок: <strong className="text-primary">{fmtPrice(marketMid)}</strong></span>
          {delta != null && deltaPct != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              delta > 0 ? 'bg-green-50 text-green-600' : delta < 0 ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-500'
            }`}>
              {delta > 0 ? '+' : ''}{fmtPrice(delta)} ({delta > 0 ? '+' : ''}{deltaPct}%)
            </span>
          )}
          {delta != null && delta < 0 && Math.abs(deltaPct!) > 15 && (
            <span className="text-[11px] text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Ваша цена выше рынка — рассмотрите снижение
            </span>
          )}
          {delta != null && delta > 0 && deltaPct! > 20 && (
            <span className="text-[11px] text-green-600 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Хорошая цена — ниже рынка
            </span>
          )}
        </div>
      )}

      {estimate.refModelUsed && (
        <div className="mt-2 text-[10px] text-neutral-400">
          Ref: {estimate.refModelUsed}
        </div>
      )}
    </div>
  )
}

/* ── Price History Mini-chart (text-based) ── */
function PriceHistorySection({ query }: { query: string }) {
  const history = getPriceHistory(query)
  if (history.length < 2) return null

  const recent = history.slice(-8)
  const latest = recent[recent.length - 1]
  const earliest = recent[0]
  const trend = latest.mid - earliest.mid
  const trendPct = earliest.mid > 0 ? Math.round((trend / earliest.mid) * 100) : 0

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-accent" />
        История цен ({recent.length} запросов)
      </h4>
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-sm font-bold ${trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-600' : 'text-neutral-500'}`}>
          {trend > 0 ? '+' : ''}{fmtPrice(trend)} ({trend > 0 ? '+' : ''}{trendPct}%)
        </span>
        <span className="text-[11px] text-neutral-400">за последние запросы</span>
      </div>
      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-16">
        {recent.map((h, i) => {
          const maxMid = Math.max(...recent.map(r => r.mid))
          const minMid = Math.min(...recent.map(r => r.mid))
          const range = maxMid - minMid || 1
          const height = 20 + ((h.mid - minMid) / range) * 80
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t transition-all ${i === recent.length - 1 ? 'bg-accent' : 'bg-accent/30'}`}
                style={{ height: `${height}%` }}
                title={`${fmtPrice(h.mid)} (${new Date(h.ts).toLocaleDateString('de-DE')})`}
              />
              <span className="text-[8px] text-neutral-400">{new Date(h.ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MyLaptopRecommendations() {
  const { items } = useInventory()
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [activeQuery, setActiveQuery] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedLookup[]>(loadSaved)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null)

  const [priceResult, setPriceResult] = useState<PriceScoutResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [liveEstimate, setLiveEstimate] = useState<PriceEstimate | null>(null)
  const estimateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Batch analysis */
  const [batchResults, setBatchResults] = useState<Record<string, PriceEstimate>>({})
  const [batchRunning, setBatchRunning] = useState(false)

  const inventoryDevices = useMemo(
    () => items.filter((it) => it.brand && it.description && it.status === 'available'),
    [items]
  )

  /* Selected inventory item's price for comparison */
  const inventoryPrice = useMemo(() => {
    if (!selectedInventoryId) return undefined
    return items.find(i => i.id === selectedInventoryId)?.price
  }, [selectedInventoryId, items])

  /* Debounced live estimate as user types (300ms) */
  useEffect(() => {
    if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current)
    estimateTimerRef.current = setTimeout(() => {
      if (brand.trim() || model.trim()) {
        setLiveEstimate(quickEstimate(brand, model))
      } else {
        setLiveEstimate(null)
      }
    }, 300)
    return () => { if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current) }
  }, [brand, model])

  /* Fetch prices when activeQuery changes — clear stale result immediately */
  useEffect(() => {
    if (!activeQuery) { setPriceResult(null); setFetchError(null); return }
    let cancelled = false
    setPriceResult(null) // ← clear stale result from previous query
    setFetchError(null)
    setLoading(true)
    fetchPriceScout(brand, model, activeQuery).then((result) => {
      if (!cancelled) { setPriceResult(result); setLoading(false) }
    }).catch((err) => {
      if (!cancelled) {
        setLoading(false)
        setFetchError(err?.message || 'Ошибка загрузки данных')
      }
    })
    return () => { cancelled = true }
  }, [activeQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(() => {
    const q = getProductSearchQuery(brand, model).trim()
    if (!q) return
    setActiveQuery(q)
  }, [brand, model])

  const handleRefresh = useCallback(() => {
    if (!activeQuery) return
    setFetchError(null)
    setLoading(true)
    fetchPriceScout(brand, model, activeQuery, { skipCache: true }).then((result) => {
      setPriceResult(result); setLoading(false)
    }).catch((err) => {
      setLoading(false)
      setFetchError(err?.message || 'Ошибка загрузки данных')
    })
  }, [activeQuery, brand, model])

  const handleSelectInventory = useCallback((id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setBrand(item.brand || '')
    setModel(item.description || '')
    setSelectedInventoryId(id)
    const q = getProductSearchQuery(item.brand || '', item.description || '').trim()
    if (q) setActiveQuery(q)
  }, [items])

  const isSaved = useMemo(() => saved.some((s) => s.query === activeQuery), [saved, activeQuery])
  const handleToggleSave = useCallback(() => {
    if (!activeQuery) return
    const next = isSaved
      ? saved.filter((s) => s.query !== activeQuery)
      : [...saved, { id: crypto.randomUUID(), query: activeQuery, brand, model, savedAt: new Date().toISOString() }]
    setSaved(next); persistSaved(next)
  }, [activeQuery, isSaved, saved, brand, model])

  const handleDeleteSaved = useCallback((id: string) => {
    const next = saved.filter((s) => s.id !== id)
    setSaved(next); persistSaved(next)
  }, [saved])

  const handleLoadSaved = useCallback((lookup: SavedLookup) => {
    setBrand(lookup.brand); setModel(lookup.model); setActiveQuery(lookup.query)
    setSelectedInventoryId(null)
  }, [])

  const handleCopyQuery = useCallback((query: string, id: string) => {
    navigator.clipboard.writeText(query)
    setCopiedId(id); setTimeout(() => setCopiedId(null), 1500)
  }, [])

  /* Batch analyze all inventory items (local estimation only — instant) */
  const handleBatchAnalyze = useCallback(() => {
    setBatchRunning(true)
    const results: Record<string, PriceEstimate> = {}
    for (const item of inventoryDevices) {
      results[item.id] = quickEstimate(item.brand || '', item.description || '')
    }
    setBatchResults(results)
    setBatchRunning(false)
  }, [inventoryDevices])

  /* All marketplace links */
  const allLinks: (MarketplaceLink & { color: typeof MC[string]; priceData?: MarketPrice })[] = useMemo(() => {
    if (!activeQuery) return []
    const base = getMarketplaceLinks(activeQuery)
    const extra: MarketplaceLink[] = [
      { id: 'ebay', label: 'eBay.de (used)', url: getEbayUrl(activeQuery), region: 'DE' },
      { id: 'backmarket', label: 'Back Market', url: getBackmarketUrl(activeQuery), region: 'DE/EU' },
      { id: 'rebuy', label: 'reBuy.de', url: getRebuyUrl(activeQuery), region: 'DE' },
    ]
    return [...base, ...extra].map((l) => ({
      ...l,
      color: MC[l.id] || { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200' },
      priceData: priceResult?.sources.find(s => s.sourceId === l.id),
    }))
  }, [activeQuery, priceResult])

  const parsedDevice = useMemo(() => {
    if (!brand && !model) return null
    return parseDeviceFromQuery(brand, model)
  }, [brand, model])

  return (
    <>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Скаут цен — Price Scout
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Реальные цены с 6 площадок + алгоритмическая оценка по 200+ моделям. eBay, Idealo, BackMarket, Geizhals, reBuy, Amazon.
          </p>
        </div>
      </div>

      {/* ── Search form ── */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor="ps-brand" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Бренд</label>
            <input
              id="ps-brand" type="text" value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Apple, Dell, Lenovo…"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-neutral-400 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none min-h-[44px]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            />
          </div>
          <div className="flex-[2] min-w-0">
            <label htmlFor="ps-model" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Модель / описание</label>
            <input
              id="ps-model" type="text" value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="MacBook Pro 14 M3, Latitude 5540, ThinkPad T14s Gen 3…"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-neutral-400 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none min-h-[44px]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            />
          </div>
          <div className="shrink-0 flex items-end">
            <button type="button" onClick={handleSearch}
              disabled={!brand.trim() && !model.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.97] transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Search className="w-4 h-4" />
              Найти цены
            </button>
          </div>
        </div>

        {/* Live estimate preview */}
        {liveEstimate && !activeQuery && (
          <div className="mt-3 rounded-lg bg-accent/5 border border-accent/10 px-4 py-2.5 flex flex-wrap items-center gap-3">
            <DollarSign className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs text-neutral-600">Предварительная оценка:</span>
            <span className="text-sm font-bold text-primary">{fmtPrice(liveEstimate.mid)}</span>
            <span className="text-[11px] text-neutral-400">({fmtPrice(liveEstimate.low)} – {fmtPrice(liveEstimate.high)})</span>
            <ConfidenceBadge value={liveEstimate.confidence} />
            {liveEstimate.refModelUsed && (
              <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">ref: {liveEstimate.refModelUsed}</span>
            )}
          </div>
        )}

        {/* Quick select from inventory */}
        {inventoryDevices.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 min-w-0">
                <label htmlFor="ps-inventory" className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Package className="w-3.5 h-3.5" /> Или выбрать из прайса
                </label>
                <select id="ps-inventory"
                  onChange={(e) => { if (e.target.value) handleSelectInventory(e.target.value) }}
                  className="w-full sm:max-w-[480px] rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none min-h-[44px]"
                  value=""
                >
                  <option value="">— выбрать позицию —</option>
                  {inventoryDevices.map((it) => (
                    <option key={it.id} value={it.id}>
                      {[it.brand, it.description].filter(Boolean).join(' — ').slice(0, 80)}
                      {it.price ? ` (${it.price}€)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {inventoryDevices.length >= 2 && (
                <button type="button" onClick={handleBatchAnalyze} disabled={batchRunning}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-colors min-h-[44px] whitespace-nowrap disabled:opacity-50">
                  <ListChecks className="w-4 h-4" />
                  Оценить все ({inventoryDevices.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Batch Analysis Results ── */}
      {Object.keys(batchResults).length > 0 && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-accent" />
              Быстрая оценка всего прайса ({inventoryDevices.length} шт.)
            </h3>
            <button type="button" onClick={() => setBatchResults({})}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors">
              Скрыть
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500">
                  <th className="text-left px-4 py-2 font-semibold">Товар</th>
                  <th className="text-right px-3 py-2 font-semibold">Ваша цена</th>
                  <th className="text-right px-3 py-2 font-semibold">Рынок (оценка)</th>
                  <th className="text-right px-3 py-2 font-semibold">Маржа</th>
                  <th className="text-center px-3 py-2 font-semibold">Точность</th>
                  <th className="text-center px-2 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {inventoryDevices.map((item) => {
                  const est = batchResults[item.id]
                  if (!est) return null
                  const delta = item.price ? est.mid - item.price : null
                  const deltaPct = item.price && item.price > 0 ? Math.round(((est.mid - item.price) / item.price) * 100) : null
                  return (
                    <tr key={item.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-primary truncate max-w-[280px]">
                          {item.brand} {item.description?.slice(0, 50)}
                        </div>
                        {est.refModelUsed && (
                          <span className="text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            ref: {est.refModelUsed}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-neutral-600">
                        {item.price ? fmtPrice(item.price) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-primary">
                        {fmtPrice(est.mid)}
                        <div className="text-[9px] text-neutral-400 font-normal">{fmtPrice(est.low)} – {fmtPrice(est.high)}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {delta != null && deltaPct != null ? (
                          <span className={`font-bold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                            {delta > 0 ? '+' : ''}{deltaPct}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <ConfidenceBadge value={est.confidence} />
                      </td>
                      <td className="px-2 py-2.5">
                        <button type="button" onClick={() => handleSelectInventory(item.id)}
                          className="text-accent hover:text-accent-hover text-[10px] font-semibold whitespace-nowrap">
                          Детали →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRICE RESULTS ── */}
      {activeQuery && (
        <div className="mt-6 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Анализ цен для:</h3>
              <p className="text-base font-bold text-accent mt-0.5">{activeQuery}</p>
            </div>
            <div className="flex items-center gap-2">
              {priceResult?.cached && (
                <span className="text-[10px] text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full">кэш</span>
              )}
              <button type="button" onClick={handleRefresh} disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200 transition-colors min-h-[36px] disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Обновить
              </button>
              <button type="button" onClick={handleToggleSave}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors min-h-[36px] ${
                  isSaved ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200'
                }`}>
                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {isSaved ? 'Сохранено' : 'Сохранить'}
              </button>
            </div>
          </div>

          {/* ── Loading skeleton ── */}
          {loading && !priceResult && (
            <div className="rounded-xl border-2 border-accent/20 bg-gradient-to-r from-accent/5 via-white to-accent/5 p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-sm font-semibold text-primary">Загружаем цены с 6 площадок…</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[0,1,2].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-3 w-12 bg-neutral-200 rounded" />
                    <div className="h-7 w-20 bg-neutral-200 rounded" />
                  </div>
                ))}
              </div>
              {liveEstimate && (
                <div className="mt-4 pt-3 border-t border-accent/10 text-xs text-neutral-500">
                  Предварительная оценка: <strong className="text-primary">{fmtPrice(liveEstimate.mid)}</strong>
                  <span className="text-neutral-400 ml-1">({fmtPrice(liveEstimate.low)} – {fmtPrice(liveEstimate.high)})</span>
                </div>
              )}
            </div>
          )}

          {/* ── Error state ── */}
          {fetchError && !priceResult && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700">Не удалось загрузить рыночные данные</p>
                <p className="text-xs text-red-600 mt-1">{fetchError}</p>
                {liveEstimate && (
                  <p className="text-xs text-neutral-600 mt-2">
                    Алгоритмическая оценка: <strong>{fmtPrice(liveEstimate.mid)}</strong> ({fmtPrice(liveEstimate.low)} – {fmtPrice(liveEstimate.high)})
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Повторить
              </button>
            </div>
          )}

          {/* ── Aggregated Price Summary ── */}
          {(priceResult || (!loading && liveEstimate)) && (
            <div className="rounded-xl border-2 border-accent/20 bg-gradient-to-r from-accent/5 via-white to-accent/5 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-accent" />
                <h4 className="text-sm font-bold text-primary">Рыночная цена</h4>
                {loading && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
                {priceResult && <ConfidenceBadge value={priceResult.aggregated.confidence} />}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <ArrowDown className="w-3 h-3 text-green-500" /> Мин
                  </div>
                  <div className="text-lg font-extrabold text-green-600">
                    {fmtPrice(priceResult?.aggregated.low ?? liveEstimate?.low)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Minus className="w-3 h-3 text-accent" /> Средняя
                  </div>
                  <div className="text-2xl font-extrabold text-accent">
                    {fmtPrice(priceResult?.aggregated.weightedMid ?? priceResult?.aggregated.mid ?? liveEstimate?.mid)}
                  </div>
                  {priceResult && priceResult.aggregated.weightedMid !== priceResult.aggregated.mid && (
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      mean: {fmtPrice(priceResult.aggregated.mid)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <ArrowUp className="w-3 h-3 text-red-500" /> Макс
                  </div>
                  <div className="text-lg font-extrabold text-red-500">
                    {fmtPrice(priceResult?.aggregated.high ?? liveEstimate?.high)}
                  </div>
                </div>
              </div>

              {priceResult && (
                <div className="mt-3 pt-3 border-t border-accent/10 flex flex-wrap gap-3 text-[11px] text-neutral-500">
                  <span>Источников: <strong>{priceResult.aggregated.sources}</strong></span>
                  <span>Объявлений: <strong>{priceResult.aggregated.totalListings}</strong></span>
                  {priceResult.sources.length > 0 && priceResult.sources.length < 4 && (
                    <span className="text-neutral-400">
                      ({6 - priceResult.sources.length} из 6 площадок не ответили)
                    </span>
                  )}
                  {priceResult.sources.length === 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      Рыночные данные недоступны — показана алгоритмическая оценка
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Sell Recommendation ── */}
          {priceResult && (
            <SellRecommendation priceResult={priceResult} inventoryPrice={inventoryPrice} />
          )}

          {/* ── Source Breakdown ── */}
          {priceResult && (
            <div>
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Источники цен
              </h4>
              {/* Source status badges */}
              {priceResult.sourceStatuses && priceResult.sourceStatuses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {priceResult.sourceStatuses.map(ss => (
                    <span key={ss.sourceId} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      ss.status === 'ok' ? 'bg-green-50 text-green-600 border border-green-200'
                      : ss.status === 'no-data' ? 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                      : 'bg-red-50 text-red-500 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        ss.status === 'ok' ? 'bg-green-500' : ss.status === 'no-data' ? 'bg-neutral-400' : 'bg-red-500'
                      }`} />
                      {ss.label}
                    </span>
                  ))}
                </div>
              )}
              {priceResult.sources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {priceResult.sources.map((s) => (
                    <SourcePriceCard key={s.sourceId} mp={s} />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-200">
                  Ни одна площадка не вернула данных по этому запросу. Попробуйте упростить запрос или использовать более общее описание.
                </div>
              )}
            </div>
          )}

          {/* ── Price History ── */}
          {activeQuery && <PriceHistorySection query={activeQuery} />}

          {/* ── Estimation Breakdown ── */}
          {priceResult && (
            <details className="rounded-xl border border-neutral-200 bg-white">
              <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-neutral-600 hover:text-primary transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                Алгоритмическая оценка — детали расчёта
                <ConfidenceBadge value={priceResult.estimate.confidence} />
                {priceResult.estimate.refModelUsed && (
                  <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full ml-2">
                    ref model match
                  </span>
                )}
              </summary>
              <div className="px-4 pb-4 pt-1">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-lg font-extrabold text-primary">{fmtPrice(priceResult.estimate.mid)}</span>
                  <span className="text-xs text-neutral-400">
                    ({fmtPrice(priceResult.estimate.low)} – {fmtPrice(priceResult.estimate.high)})
                  </span>
                </div>
                <div className="space-y-1">
                  {priceResult.estimate.factors.map((f, i) => (
                    <div key={i} className="text-xs text-neutral-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/40 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                {parsedDevice && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400 space-y-0.5">
                    <div>Parsed: brand=<strong>{parsedDevice.brand}</strong>, series=<strong>{parsedDevice.series || '—'}</strong>, cpu=<strong>{parsedDevice.cpuKey || '—'}</strong>, gpu=<strong>{parsedDevice.gpuKey || '—'}</strong></div>
                    <div>RAM=<strong>{parsedDevice.ramGb || '—'}GB</strong>, Storage=<strong>{parsedDevice.storageGb || '—'}GB</strong>, Screen=<strong>{parsedDevice.screenInch || '—'}"</strong>, Year≈<strong>{parsedDevice.yearApprox || '—'}</strong></div>
                    {parsedDevice.refMatch && (
                      <div>Ref match: <strong>{parsedDevice.refMatch.model.tokens.join(' ')}</strong> (score: {parsedDevice.refMatch.score.toFixed(1)}, price: {parsedDevice.refMatch.model.priceB}€)</div>
                    )}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* ── Marketplace Links ── */}
          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Перейти на площадки</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {allLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className={`group relative flex flex-col rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${link.color.bg} ${link.color.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${link.color.text}`}>{link.label}</span>
                    <ExternalLink className={`w-3.5 h-3.5 ${link.color.text} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{link.region}</span>
                  {link.priceData ? (
                    <div className="mt-2 pt-2 border-t border-white/60">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-base font-extrabold ${link.color.text}`}>{fmtPrice(link.priceData.mid)}</span>
                        <span className="text-[10px] text-neutral-400">median</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {fmtPrice(link.priceData.low)} – {fmtPrice(link.priceData.high)} · {link.priceData.count} offers
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                      Поиск «{activeQuery.length > 30 ? activeQuery.slice(0, 30) + '…' : activeQuery}»
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-lg bg-amber-50/50 border border-amber-100 px-4 py-3 text-xs text-amber-700 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p>
                <strong>Как это работает:</strong> Собираем цены с 6 площадок (eBay.de, BackMarket, Idealo, Geizhals, reBuy, Amazon.de),
                фильтруем нерелевантные (аксессуары, зарядки), удаляем выбросы по IQR, считаем взвешенную медиану.
                Параллельно — алгоритмическая оценка по базе 200+ популярных моделей.
              </p>
              <p className="mt-1 text-amber-600/80">
                Точность зависит от специфичности запроса: чем больше деталей (RAM, SSD, год, CPU) — тем точнее.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved lookups ── */}
      {saved.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-accent" /> Сохранённые запросы ({saved.length})
          </h3>
          <div className="space-y-2">
            {saved.map((lookup) => (
              <div key={lookup.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 group hover:border-accent/30 transition-colors">
                <button type="button" onClick={() => handleLoadSaved(lookup)} className="flex-1 min-w-0 text-left">
                  <span className="text-sm font-medium text-primary truncate block">{lookup.query}</span>
                  <span className="text-[11px] text-neutral-400">{new Date(lookup.savedAt).toLocaleDateString('de-DE')}</span>
                </button>
                <button type="button" onClick={() => handleCopyQuery(lookup.query, lookup.id)}
                  className="shrink-0 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  title="Скопировать" aria-label="Скопировать запрос">
                  {copiedId === lookup.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => handleDeleteSaved(lookup.id)}
                  className="shrink-0 p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Удалить" aria-label="Удалить сохранённый запрос">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeQuery && saved.length === 0 && (
        <div className="mt-10 text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-primary">Начните поиск</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
            Введите бренд и модель — увидите реальные цены с 6 европейских площадок + алгоритмическую оценку по базе 200+ моделей.
            Чем точнее запрос, тем точнее цена.
          </p>
        </div>
      )}
    </>
  )
}
