import { useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ProductShowcase, {
  buildFeaturesFromStock,
} from './ui/product-showcase'
import type { StockItem, StockCurrency } from '../types/buyer'
import { getDemoImageUrl } from '../data/demoImages'
import { getLocationDisplayLabel } from '../data/catalogs'
import { useBuyerLocale } from '../i18n/BuyerLocaleContext'

const CONDITION_COLORS: Record<string, string> = {
  NEW: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  USED: 'bg-amber-50 text-amber-700 border border-amber-200',
  REFURBISHED: 'bg-blue-50 text-blue-700 border border-blue-200',
  FOR_PARTS: 'bg-red-50 text-red-700 border border-red-200',
}

const GRADIENT_BY_BRAND: Record<string, string> = {
  Apple: 'from-neutral-100 via-slate-50 to-white',
  Dell: 'from-blue-50 via-slate-50 to-white',
  Lenovo: 'from-red-50 via-neutral-50 to-white',
  HP: 'from-sky-50 via-slate-50 to-white',
  _default: 'from-slate-50 via-neutral-50 to-white',
}

const GLOW_BY_BRAND: Record<string, string> = {
  Apple: 'bg-neutral-300',
  Dell: 'bg-blue-300',
  Lenovo: 'bg-red-300',
  HP: 'bg-sky-300',
  _default: 'bg-blue-300',
}

function formatPrice(amount: number, currency: StockCurrency): string {
  const symbols: Record<StockCurrency, string> = { EUR: '€', UAH: 'грн', USD: '$' }
  return `${amount.toLocaleString('de-DE')} ${symbols[currency] ?? currency}`
}

interface ProductDetailModalProps {
  item: StockItem | null
  itemIndex?: number
  onClose: () => void
  onAddToQuote?: (id: string) => void
  /** Override labels */
  ctaLabel?: string
}

export default function ProductDetailModal({
  item,
  itemIndex = 0,
  onClose,
  onAddToQuote,
  ctaLabel,
}: ProductDetailModalProps) {
  const { t } = useBuyerLocale()

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!item) return
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [item, handleEscape])

  if (!item) return null

  const imageUrl = item.images[0] || getDemoImageUrl(itemIndex, item.brand, item.category)
  const fallbackUrl = getDemoImageUrl(itemIndex + 100, item.brand, item.category)
  const brandKey = item.brand || '_default'
  const gradient = GRADIENT_BY_BRAND[brandKey] || GRADIENT_BY_BRAND._default
  const glow = GLOW_BY_BRAND[brandKey] || GLOW_BY_BRAND._default

  const conditionLabel = useMemo(() => {
    const labels = t.stock.conditionValues as Record<string, string>
    return labels[item.condition] ?? item.condition
  }, [t, item.condition])

  const conditionColor = CONDITION_COLORS[item.condition] ?? undefined

  const priceStr = item.buyerPrice != null
    ? formatPrice(item.buyerPrice, item.currency)
    : null

  const { quickStats, features } = buildFeaturesFromStock(item, {
    sku: item.sku,
    model: item.model,
    brand: item.brand,
    category: item.category,
    condition: conditionLabel,
    quantity: item.quantityAvailable,
    location: getLocationDisplayLabel(item.location),
    price: priceStr,
    updatedAt: item.updatedAt,
  })

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="product-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="product-modal-content"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <ProductShowcase
            title={item.model}
            brand={item.brand}
            description={
              [item.category, item.processor, item.ram].filter(Boolean).join(' · ') || undefined
            }
            sku={item.sku}
            image={imageUrl}
            fallbackImage={fallbackUrl}
            condition={conditionLabel}
            conditionColor={conditionColor}
            category={item.category}
            quantity={item.quantityAvailable}
            location={getLocationDisplayLabel(item.location)}
            price={priceStr}
            features={features}
            quickStats={quickStats}
            gradientClasses={gradient}
            glowColor={glow}
            onRequestQuote={onAddToQuote ? () => onAddToQuote(item.id) : undefined}
            ctaLabel={ctaLabel || t.stock.addToRequest}
            priceOnRequestLabel={t.stock.priceOnRequest}
            backLabel={t.back}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
