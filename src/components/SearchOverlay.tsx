import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Search, X, ArrowRight, Monitor, Package } from 'lucide-react'
import { useInventory } from '../store/inventoryStore'
import { getDemoImageUrl } from '../data/demoImages'
import { suggestBrandFromDescription } from '../data/catalogs'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { getAvailable } = useInventory()
  const items = getAvailable()

  useEffect(() => {
    if (open) {
      setQuery('')
      document.body.style.overflow = 'hidden'
      // Small delay so the overlay renders before focus
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return items
      .filter(
        (it) =>
          it.description.toLowerCase().includes(q) ||
          (it.brand && it.brand.toLowerCase().includes(q)) ||
          (it.category && it.category.toLowerCase().includes(q)) ||
          (it.processor && it.processor.toLowerCase().includes(q)) ||
          (it.sku && it.sku.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [items, query])

  const handleSelect = useCallback(
    (id: string) => {
      onClose()
      navigate(`/marketplace/item/${id}`)
    },
    [navigate, onClose],
  )

  const handleGoToStock = useCallback(() => {
    onClose()
    navigate('/marketplace/stock')
  }, [navigate, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[3000]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search panel */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-20 sm:mt-24 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search equipment — model, brand, specs..."
              className="flex-1 text-base sm:text-lg font-medium text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {query.length >= 2 && (
            <div className="max-h-[50vh] overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Package className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-500">No results for "{query}"</p>
                  <p className="text-xs text-neutral-400 mt-1">Try a different search term</p>
                </div>
              ) : (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Equipment ({results.length}{results.length === 6 ? '+' : ''})
                    </span>
                  </div>
                  {results.map((it, idx) => {
                    const brand = it.brand || suggestBrandFromDescription(it.description)
                    const imgUrl = it.imageUrl || getDemoImageUrl(idx, brand, it.category)
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => handleSelect(it.id)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors group"
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-accent transition-colors">
                            {it.description}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                            {brand && <span className="font-medium">{brand}</span>}
                            {it.category && (
                              <>
                                <span className="text-neutral-300">·</span>
                                <span>{it.category}</span>
                              </>
                            )}
                            {it.processor && (
                              <>
                                <span className="text-neutral-300">·</span>
                                <span className="truncate">{it.processor}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300 shrink-0 group-hover:text-accent transition-colors" />
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* Quick actions */}
          {query.length < 2 && (
            <div className="px-4 py-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                Quick links
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGoToStock}
                  className="flex items-center gap-2.5 rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:border-neutral-200 transition-colors text-left"
                >
                  <Monitor className="w-4 h-4 text-neutral-400" />
                  Browse Stock
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/#quote') }}
                  className="flex items-center gap-2.5 rounded-xl bg-accent/5 border border-accent/10 px-4 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors text-left"
                >
                  <Package className="w-4 h-4" />
                  Get an Offer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
