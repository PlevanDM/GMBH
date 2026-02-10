import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInventory } from '../../store/inventoryStore'
import { useBuyer } from '../../store/buyerStore'
import { buildStockFromInventory } from '../../store/buyerStore'
import { useBuyerLocale } from '../../i18n/BuyerLocaleContext'
import { IconTag, IconFolder, IconMapPin, IconCurrency, IconFileText } from '../../components/CabinetIcons'
import type { StockFilter, StockCurrency, StockItem } from '../../types/buyer'
import {
  getBrands,
  getCategories,
  getLocations,
  parseLocationRaw,
  getLocationDisplayLabel,
} from '../../data/catalogs'
import { getDemoImageUrl } from '../../data/demoImages'
import ProductDetailModal from '../../components/ProductDetailModal'

const PAGE_SIZE = 12

type ViewMode = 'table' | 'grid'

/* ────────── helpers ────────── */

function formatPrice(amount: number, currency: StockCurrency): string {
  const symbols: Record<StockCurrency, string> = { EUR: '€', UAH: 'грн', USD: '$' }
  return `${amount.toLocaleString('ru-RU')} ${symbols[currency] ?? currency}`
}

function formatArrivalDate(iso: string): string {
  try {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    return `${day}.${month}.${year}`
  } catch {
    return iso
  }
}

function ProductCell({ s }: { s: StockItem }) {
  return (
    <div className="product-cell py-1 max-w-[220px]">
      <div className="product-name font-semibold text-[13px] leading-snug text-neutral-900 mb-0.5 line-clamp-2" title={s.model}>{s.model}</div>
      <div className="product-meta flex items-center gap-1 text-[11px] text-neutral-500 truncate">
        <span className="brand font-medium text-neutral-700">{s.brand}</span>
        <span className="separator text-neutral-300">·</span>
        <span className="sku text-neutral-400 truncate">{s.sku}</span>
      </div>
    </div>
  )
}

/* ────────── Grid card (photo view) ────────── */

function StockGridCard({
  s,
  index,
  isSelected,
  onToggle,
  onOpenDetail,
  conditionLabels,
  t,
}: {
  s: StockItem
  index: number
  isSelected: boolean
  onToggle: () => void
  onOpenDetail: () => void
  conditionLabels: Record<string, string>
  t: ReturnType<typeof useBuyerLocale>['t']
}) {
  const imageUrl = s.images[0] || getDemoImageUrl(index, s.brand, s.category)

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-card transition-all duration-200 hover:shadow-card-hover ${isSelected ? 'border-accent ring-2 ring-accent/20' : 'border-neutral-200 hover:border-primary/20'}`}
    >
      {/* Checkbox overlay */}
      <label className="absolute top-3 left-3 z-10 cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-5 w-5 rounded border-2 border-white shadow-sm accent-accent cursor-pointer"
        />
      </label>

      {/* Condition badge */}
      {s.condition && (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-neutral-700 shadow-sm">
          {conditionLabels[s.condition] ?? s.condition}
        </span>
      )}

      {/* Image */}
      <div
        className="relative aspect-[4/3] w-full bg-neutral-100 overflow-hidden cursor-pointer"
        onClick={onOpenDetail}
      >
        <img
          src={imageUrl}
          alt={s.model}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getDemoImageUrl(index + 100, s.brand, s.category)
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3
          className="font-semibold text-sm leading-snug text-primary line-clamp-2 group-hover:text-accent transition-colors cursor-pointer"
          onClick={onOpenDetail}
        >
          {s.model}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">{s.brand}</span>
          <span className="text-neutral-300">·</span>
          <span className="text-neutral-400">{s.sku}</span>
        </div>

        {/* Spec chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {s.processor && (
            <span className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 truncate max-w-[130px]" title={s.processor}>
              {s.processor}
            </span>
          )}
          {s.ram && (
            <span className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">
              {s.ram}
            </span>
          )}
          {s.video && (
            <span className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 truncate max-w-[120px]" title={s.video}>
              {s.video}
            </span>
          )}
        </div>

        {/* Bottom: qty + location + price */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1 text-xs text-neutral-500">
            <span>{s.quantityAvailable} {t.quotePanel.pcs}</span>
            <span>{getLocationDisplayLabel(s.location)}</span>
          </div>
          <div className="text-right">
            {s.buyerPrice != null ? (
              <span className="font-bold text-sm text-primary">{formatPrice(s.buyerPrice, s.currency)}</span>
            ) : (
              <span className="text-xs text-neutral-400 italic">{t.stock.priceOnRequest}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────── View Toggle ────────── */

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'
        }`}
        title="Table view"
        aria-label="Table view"
      >
        {/* Table icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'
        }`}
        title="Grid view"
        aria-label="Grid view"
      >
        {/* Grid icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
    </div>
  )
}

/* ────────── Main component ────────── */

/** Hook: true when screen is below given width */
function useIsSmallScreen(breakpoint = 1024) {
  const [isSmall, setIsSmall] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches)
    setIsSmall(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isSmall
}

export default function BuyerStock() {
  const navigate = useNavigate()
  const { t } = useBuyerLocale()
  const { getAvailable, getBatchById } = useInventory()
  const { company, bulkQuoteFromStock } = useBuyer()
  const inventoryItems = getAvailable()

  const isTabletOrMobile = useIsSmallScreen(1024)

  const [filter, setFilter] = useState<StockFilter>({})
  const [searchInput, setSearchInput] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [viewModePreference, setViewModePreference] = useState<ViewMode>(() => {
    try { return (localStorage.getItem('buyer_stock_view') as ViewMode) || 'table' } catch { return 'table' }
  })
  const [quoteComment, setQuoteComment] = useState('')
  const [quoteDeliveryDate, setQuoteDeliveryDate] = useState('')
  const [quoteContactMethod, setQuoteContactMethod] = useState<'email' | 'phone' | 'whatsapp' | 'telegram'>('email')
  const [sortField, setSortField] = useState<'description' | 'price' | 'quantity' | 'brand' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [detailItem, setDetailItem] = useState<{ item: StockItem; index: number } | null>(null)

  // Force grid view on tablet/mobile — table has too many columns
  const viewMode: ViewMode = isTabletOrMobile ? 'grid' : viewModePreference

  const setViewModeAndSave = useCallback((m: ViewMode) => {
    setViewModePreference(m)
    try { localStorage.setItem('buyer_stock_view', m) } catch { /* */ }
  }, [])

  const stock = useMemo(
    () => buildStockFromInventory(inventoryItems, company.id, { ...filter, search: searchInput || undefined }),
    [inventoryItems, company.id, filter, searchInput]
  )

  const brands = getBrands()
  const categories = getCategories()
  const locations = getLocations()
  const conditionOptions = ['NEW', 'USED', 'REFURBISHED', 'FOR_PARTS'] as const

  const sorted = useMemo(() => {
    if (!sortField) return stock
    return [...stock].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'description': cmp = a.model.localeCompare(b.model); break
        case 'price': cmp = (a.buyerPrice ?? a.basePrice) - (b.buyerPrice ?? b.basePrice); break
        case 'quantity': cmp = a.quantityAvailable - b.quantityAvailable; break
        case 'brand': cmp = (a.brand || '').localeCompare(b.brand || ''); break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [stock, sortField, sortDir])

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(0)
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <span className="text-neutral-300 ml-1">↕</span>
    return <span className="text-accent ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paginated.map((s) => s.id)))
  }

  const handleSubmitQuoteRequest = () => {
    if (selectedIds.size === 0) return
    const items = stock.filter((s) => selectedIds.has(s.id))
    const contactLabel = { email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', telegram: 'Telegram' }[quoteContactMethod]
    const fullComment = [quoteComment, `Preferred contact: ${contactLabel}`].filter(Boolean).join(' | ')
    const rfq = bulkQuoteFromStock(items.map((s) => s.id), items, {
      comment: fullComment || null,
      desiredDeliveryDate: quoteDeliveryDate || null,
    })
    setSelectedIds(new Set())
    setQuoteComment('')
    setQuoteDeliveryDate('')
    navigate(`/buyer/requests/${rfq.id}`)
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const selectedItems = useMemo(() => stock.filter((s) => selectedIds.has(s.id)), [stock, selectedIds])
  const selectedSum = useMemo(
    () => selectedItems.reduce((sum, s) => sum + (s.buyerPrice ?? s.basePrice) * Math.min(s.quantityAvailable, 1), 0),
    [selectedItems]
  )

  const conditionLabels: Record<string, string> = t.stock.conditionValues as Record<string, string>

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-primary">{t.stock.title}</h2>
          <p className="mt-1 text-neutral-600 text-xs sm:text-sm leading-relaxed">{t.stock.description}</p>
        </div>
        <Link
          to="/buyer/requests"
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border-2 border-primary bg-transparent px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-primary hover:bg-primary/10 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <IconFileText className="w-4 h-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t.stock.myRequestsButton}</span>
          <span className="sm:hidden">RFQ</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 sm:p-4">
        <div className="search-row flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 mb-1">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(0) }}
            placeholder={t.stock.searchPlaceholder}
            className="search-input flex-1 min-w-0 max-w-full sm:max-w-[600px] rounded-lg border border-neutral-300 px-4 py-2.5 text-[16px] sm:text-[15px] min-h-[44px]"
          />
          <label className="checkbox-inline inline-flex items-center gap-2 text-sm text-neutral-700 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={!!filter.showOnlyMyPrice}
              onChange={(e) => setFilter((f) => ({ ...f, showOnlyMyPrice: e.target.checked || undefined }))}
              className="rounded border-neutral-400"
            />
            {t.stock.filterOnlyMyPrice}
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
          <FilterMultiDropdown label={t.stock.filterBrand} options={[...brands]} value={filter.brand ?? []} onChange={(brand) => { setFilter((f) => ({ ...f, brand: brand.length ? brand : undefined })); setPage(0) }} placeholder={t.stock.searchBrand} noMatchesText={t.stock.noMatches} />
          <FilterMultiDropdown label={t.stock.filterCategory} options={[...categories]} value={filter.category ?? []} onChange={(category) => { setFilter((f) => ({ ...f, category: category.length ? category : undefined })); setPage(0) }} placeholder={t.stock.searchCategory} noMatchesText={t.stock.noMatches} />
          <FilterCondition label={t.stock.filterCondition} options={conditionOptions} value={filter.condition ?? []} onChange={(condition) => { setFilter((f) => ({ ...f, condition: condition.length ? condition : undefined })); setPage(0) }} optionLabels={conditionLabels} />
          <FilterMulti label={t.stock.filterLocation} options={[...locations]} value={filter.location ?? []} onChange={(loc) => { setFilter((f) => ({ ...f, location: loc.length ? loc : undefined })); setPage(0) }} optionLabels={Object.fromEntries(locations.map((l) => [l, getLocationDisplayLabel(l)]))} />
        </div>
      </div>

      {/* Control bar: select all + info + view toggle */}
      {stock.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-t-lg border border-b-0 border-neutral-200 bg-neutral-100 px-3 sm:px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-700">
              <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} className="rounded border-neutral-400" />
              <span className="hidden sm:inline">{t.stock.selectAll}</span>
            </label>
            {selectedIds.size > 0 && (
              <span className="text-xs sm:text-sm text-neutral-600">
                {t.stock.selected}: <strong>{selectedIds.size}</strong> {t.stock.totalAmount} ~<strong>{selectedSum.toLocaleString('ru-RU')} €</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hide view toggle on tablet/mobile — grid is forced */}
            {!isTabletOrMobile && <ViewToggle mode={viewMode} onChange={setViewModeAndSave} />}
            <button type="button" disabled={selectedIds.size === 0} className="rounded-lg bg-accent px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-h-[40px]">
              {t.stock.addToRequest}
            </button>
          </div>
        </div>
      )}

      {/* Quote panel (side on desktop, bottom sheet on mobile) */}
      {selectedIds.size > 0 && (
        <aside className="fixed right-0 top-[72px] bottom-0 w-full max-w-[380px] bg-white shadow-[-2px_0_16px_rgba(0,0,0,0.1)] flex flex-col z-[1000] md:max-w-[380px] max-md:inset-x-0 max-md:top-auto max-md:h-[60vh] max-md:rounded-t-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-primary">{t.quotePanel.title}</h3>
            <button type="button" onClick={clearSelection} className="p-2 text-neutral-500 hover:text-neutral-800 rounded-lg" aria-label="Close">&#10005;</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="rounded-lg bg-neutral-100 px-3 py-2.5 mb-4 text-sm text-neutral-700">
              <strong>{t.quotePanel.selected}: {selectedItems.length} {t.quotePanel.items}</strong>
              {selectedSum > 0 && <span> {t.quotePanel.total} ~{selectedSum.toLocaleString('ru-RU')} €</span>}
            </div>
            <ul className="list-none p-0 m-0 mb-5 space-y-2 text-[13px] border-b border-neutral-100 pb-4">
              {selectedItems.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <img src={item.images[0] || getDemoImageUrl(0, item.brand, item.category)} alt="" className="w-10 h-10 rounded object-cover bg-neutral-100 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.model}</div>
                    <div className="text-neutral-400 text-xs">{item.quantityAvailable} {t.quotePanel.pcs}</div>
                  </div>
                </li>
              ))}
              {selectedItems.length > 3 && <li className="text-neutral-500 italic py-1">+ {t.quotePanel.moreItems} {selectedItems.length - 3}</li>}
            </ul>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-neutral-700 mb-1.5 text-sm">{t.quotePanel.commentLabel}</label>
                <textarea value={quoteComment} onChange={(e) => setQuoteComment(e.target.value)} rows={3} placeholder={t.quotePanel.commentPlaceholder} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-y" />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1.5 text-sm">{t.quotePanel.deliveryDateLabel}</label>
                <input type="date" value={quoteDeliveryDate} onChange={(e) => setQuoteDeliveryDate(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-2 text-sm">{t.quotePanel.contactMethodLabel}</label>
                <div className="flex flex-col gap-2">
                  {(['email', 'phone', 'whatsapp', 'telegram'] as const).map((method) => (
                    <label key={method} className="inline-flex items-center gap-2 cursor-pointer text-sm font-normal">
                      <input type="radio" name="contactMethod" checked={quoteContactMethod === method} onChange={() => setQuoteContactMethod(method)} className="border-neutral-400" />
                      {method === 'email' && t.quotePanel.contactEmail}
                      {method === 'phone' && t.quotePanel.contactPhone}
                      {method === 'whatsapp' && t.quotePanel.contactWhatsApp}
                      {method === 'telegram' && t.quotePanel.contactTelegram}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-neutral-200">
            <button type="button" onClick={clearSelection} className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">{t.quotePanel.clear}</button>
            <button type="button" onClick={handleSubmitQuoteRequest} className="flex-[2] rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover">{t.quotePanel.submit}</button>
          </div>
        </aside>
      )}

      {/* Content */}
      {stock.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-500">
          <p className="font-medium text-neutral-600">{t.stock.noResultsTitle}</p>
          <p className="mt-1 text-sm">{t.stock.noResultsText}</p>
          <Link to="/buyer/requests" className="btn-primary mt-4 inline-flex">{t.stock.createRequest}</Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* ════ GRID VIEW ════ */
        <>
          <div className={`grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-0 rounded-b-xl border border-t-0 border-neutral-200 p-3 sm:p-4 lg:p-5 bg-white`}>
            {paginated.map((s, idx) => (
              <StockGridCard
                key={s.id}
                s={s}
                index={page * PAGE_SIZE + idx}
                isSelected={selectedIds.has(s.id)}
                onToggle={() => toggleSelect(s.id)}
                onOpenDetail={() => setDetailItem({ item: s, index: page * PAGE_SIZE + idx })}
                conditionLabels={conditionLabels}
                t={t}
              />
            ))}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} t={t} />}
        </>
      ) : (
        /* ════ TABLE VIEW ════ */
        <>
          <div className="overflow-hidden rounded-b-xl border border-t-0 border-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-xs">
                    <th className="px-2 py-2.5 w-9"><span className="sr-only">{t.stock.columns.select}</span></th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 cursor-pointer select-none hover:text-accent transition-colors min-w-[200px]" onClick={() => handleSort('description')}>{t.stock.columns.modelBrandSku}<SortIcon field="description" /></th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap"><span className="inline-flex items-center gap-1"><IconFolder className="shrink-0 w-3.5 h-3.5" aria-hidden /> {t.stock.columns.category}</span></th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap"><span className="inline-flex items-center gap-1"><IconTag className="shrink-0 w-3.5 h-3.5" aria-hidden /> {t.stock.columns.condition}</span></th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap">{t.stock.columns.ram}</th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap">{t.stock.columns.processor}</th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap">{t.stock.columns.video}</th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap">{t.stock.columns.battery}</th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-center cursor-pointer select-none hover:text-accent transition-colors text-nowrap" onClick={() => handleSort('quantity')}>{t.stock.columns.quantity}<SortIcon field="quantity" /></th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap"><span className="inline-flex items-center gap-1"><IconMapPin className="shrink-0 w-3.5 h-3.5" aria-hidden /> {t.stock.columns.location}</span></th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-nowrap">{t.stock.columns.arrivalDate}</th>
                    <th className="px-2 py-2.5 font-semibold text-neutral-700 text-right cursor-pointer select-none hover:text-accent transition-colors text-nowrap" onClick={() => handleSort('price')}><span className="inline-flex items-center gap-1"><IconCurrency className="shrink-0 w-3.5 h-3.5" aria-hidden /> {t.stock.columns.price}<SortIcon field="price" /></span></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, idx) => {
                    const invItem = inventoryItems.find((i) => i.id === s.id)
                    const batch = invItem?.batchId ? getBatchById(invItem.batchId) : undefined
                    const parsedLoc = parseLocationRaw(s.location)
                    const arrivalDate = batch?.date ? formatArrivalDate(batch.date) : (parsedLoc.dateOnly ?? '—')
                    const isSelected = selectedIds.has(s.id)
                    const imgUrl = s.images[0] || getDemoImageUrl(page * PAGE_SIZE + idx, s.brand, s.category)
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-neutral-100 last:border-0 hover:bg-blue-50/50 cursor-pointer ${idx % 2 === 1 ? 'bg-neutral-50/50' : ''} ${isSelected ? 'bg-blue-100/50' : ''}`}
                        onClick={() => setDetailItem({ item: s, index: page * PAGE_SIZE + idx })}
                      >
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)} aria-label={`${t.stock.columns.select} ${s.model}`} className="rounded border-neutral-400" />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover bg-neutral-100 shrink-0"
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <ProductCell s={s} />
                          </div>
                        </td>
                        <td className="px-2 py-2 text-neutral-700 text-nowrap">{s.category}</td>
                        <td className="px-2 py-2 text-neutral-700 text-nowrap">{conditionLabels[s.condition] ?? s.condition}</td>
                        <td className="px-2 py-2 text-neutral-600 max-w-[5rem] truncate" title={s.ram}>{s.ram ?? '—'}</td>
                        <td className="px-2 py-2 text-neutral-600 max-w-[7rem] truncate" title={s.processor}>{s.processor ?? '—'}</td>
                        <td className="px-2 py-2 text-neutral-600 max-w-[6rem] truncate" title={s.video}>{s.video ?? '—'}</td>
                        <td className="px-2 py-2 text-neutral-600 max-w-[4rem] text-nowrap">
                          {s.battery ? (
                            <span title={t.stock.batteryTooltip} className="inline-flex items-center gap-1">
                              {s.battery}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-2 py-2 text-center font-medium text-neutral-800">{s.quantityAvailable}</td>
                        <td className="px-2 py-2 text-neutral-700 text-nowrap max-w-[6rem] truncate" title={getLocationDisplayLabel(s.location)}>{getLocationDisplayLabel(s.location)}</td>
                        <td className="px-2 py-2 text-neutral-600 text-nowrap">{arrivalDate}</td>
                        <td className="px-2 py-2 text-right text-nowrap">
                          {s.buyerPrice != null ? (
                            <span className="font-semibold text-neutral-900">{formatPrice(s.buyerPrice, s.currency)}</span>
                          ) : (
                            <span className="text-neutral-400 italic font-normal">{t.stock.priceOnRequest}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} t={t} />}
        </>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={detailItem?.item ?? null}
        itemIndex={detailItem?.index}
        onClose={() => setDetailItem(null)}
        onAddToQuote={(id) => {
          toggleSelect(id)
          setDetailItem(null)
        }}
        ctaLabel={t.stock.addToRequest}
      />
    </>
  )
}

/* ────────── Pagination ────────── */

function Pagination({ page, totalPages, setPage, t }: { page: number; totalPages: number; setPage: (fn: (p: number) => number) => void; t: ReturnType<typeof useBuyerLocale>['t'] }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {t.stock.pagination.back}
      </button>
      <span className="text-sm text-neutral-600">
        {page + 1} {t.stock.pagination.of} {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {t.stock.pagination.forward}
      </button>
    </div>
  )
}

/* ────────── Filter components ────────── */

function FilterMulti({
  label,
  options,
  value,
  onChange,
  optionLabels,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  optionLabels?: Record<string, string>
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt))
    else onChange([...value, opt])
  }
  if (options.length === 0) return null

  const labelText = value.length > 0 ? `${label} (${value.length})` : label

  return (
    <>
      {/* Desktop: chip buttons */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm font-medium text-neutral-600 shrink-0">{label}:</span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[100px] overflow-y-auto">
          {options.slice(0, 10).map((opt) => (
            <button key={opt} type="button" onClick={() => toggle(opt)} className={`rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium transition-colors min-h-[32px] sm:min-h-[28px] ${value.includes(opt) ? 'bg-primary text-white' : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}>
              {optionLabels?.[opt] ?? opt}
            </button>
          ))}
        </div>
      </div>
      {/* Mobile: dropdown trigger + bottom sheet */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 w-full min-h-[44px]"
        >
          {labelText}
          <span className="ml-auto text-neutral-400">▼</span>
        </button>
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[1100]" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-x-0 bottom-0 z-[1101] bg-white rounded-t-2xl max-h-[60vh] overflow-y-auto animate-slide-in-up">
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between">
                <span className="font-semibold text-neutral-800">{label}</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="text-neutral-500 p-2">✕</button>
              </div>
              <div className="px-5 py-3 space-y-1">
                {options.map((opt) => (
                  <label key={opt} className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0 cursor-pointer min-h-[48px]">
                    <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} className="rounded border-neutral-400 w-5 h-5" />
                    <span className="text-sm text-neutral-700">{optionLabels?.[opt] ?? opt}</span>
                  </label>
                ))}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-5 py-4">
                <button type="button" onClick={() => setMobileOpen(false)} className="w-full rounded-lg bg-primary text-white py-3 text-sm font-semibold">
                  {value.length > 0 ? `${labelText} ✓` : label}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function FilterMultiDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = '',
  noMatchesText = 'No matches',
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  noMatchesText?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, search])

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt))
    else onChange([...value, opt])
  }

  const labelText = value.length === 0 ? label : `${label} (${value.length})`

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 min-w-[120px]"
      >
        {labelText}
        <span className="text-neutral-400">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-neutral-200 bg-white shadow-lg py-2">
          <div className="px-2 pb-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">{noMatchesText}</div>
            ) : (
              filtered.map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} className="rounded border-neutral-400" />
                  {opt}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterCondition({
  label,
  options,
  value,
  onChange,
  optionLabels,
}: {
  label: string
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
  optionLabels?: Record<string, string>
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-xs sm:text-sm font-medium text-neutral-600 shrink-0">{label}:</span>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm text-neutral-700 min-h-[32px] sm:min-h-[28px]">
            <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} className="rounded border-neutral-400 w-4 h-4" />
            {optionLabels?.[opt] ?? opt}
          </label>
        ))}
      </div>
    </div>
  )
}
