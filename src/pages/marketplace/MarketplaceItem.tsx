import { Link, useParams, useNavigate } from 'react-router-dom'
import PageHero from '../../components/PageHero'
import { useInventory } from '../../store/inventoryStore'
import { getDemoImageUrl } from '../../data/demoImages'
import ProductShowcase, {
  buildFeaturesFromInventory,
} from '../../components/ui/product-showcase'

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New',
  USED: 'Used',
  REFURBISHED: 'Refurbished',
  FOR_PARTS: 'For Parts',
}

const CONDITION_COLORS: Record<string, string> = {
  NEW: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  USED: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  REFURBISHED: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  FOR_PARTS: 'bg-red-500/20 text-red-300 border border-red-500/30',
}

const GRADIENT_BY_BRAND: Record<string, string> = {
  Apple: 'from-zinc-900 via-slate-800 to-neutral-900',
  Dell: 'from-blue-950 via-slate-900 to-zinc-900',
  Lenovo: 'from-red-950 via-zinc-900 to-neutral-900',
  HP: 'from-sky-950 via-slate-900 to-zinc-900',
  _default: 'from-slate-900 via-zinc-900 to-neutral-900',
}

const GLOW_BY_BRAND: Record<string, string> = {
  Apple: 'bg-zinc-400',
  Dell: 'bg-blue-500',
  Lenovo: 'bg-red-500',
  HP: 'bg-sky-500',
  _default: 'bg-blue-500',
}

export default function MarketplaceItem() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items } = useInventory()
  const item = id ? items.find((i) => i.id === id) : null

  if (!id || !item) {
    return (
      <>
        <PageHero title="Item not found" subtitle="" />
        <section className="py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className="text-neutral-600">This item is not available in the showcase.</p>
            <Link to="/marketplace/stock" className="btn-primary mt-6 inline-block">
              Back to Marketplace
            </Link>
          </div>
        </section>
      </>
    )
  }

  const conditionLabel = item.condition
    ? CONDITION_LABELS[item.condition] ?? item.condition
    : undefined
  const conditionColor = item.condition
    ? CONDITION_COLORS[item.condition] ?? undefined
    : undefined
  const imageUrl = item.imageUrl || getDemoImageUrl(0, item.brand, item.category)
  const fallbackUrl = getDemoImageUrl(99, item.brand, item.category)

  const brandKey = item.brand || '_default'
  const gradient = GRADIENT_BY_BRAND[brandKey] || GRADIENT_BY_BRAND._default
  const glow = GLOW_BY_BRAND[brandKey] || GLOW_BY_BRAND._default

  const { quickStats, features } = buildFeaturesFromInventory(item)

  const priceStr =
    item.price != null && item.price > 0
      ? `${item.price.toLocaleString('de-DE')} €`
      : null

  return (
    <>
      <PageHero
        title={item.description}
        subtitle={item.category ? `${item.brand || ''} ${item.category}`.trim() : undefined}
      />
      <section className="py-10 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductShowcase
            title={item.description}
            brand={item.brand}
            description={
              [item.category, item.processor, item.ram_raw]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            sku={item.sku || item.inventoryNumber}
            image={imageUrl}
            fallbackImage={fallbackUrl}
            condition={conditionLabel}
            conditionColor={conditionColor}
            category={item.category}
            quantity={item.quantity}
            location={item.location}
            price={priceStr}
            features={features}
            quickStats={quickStats}
            gradientClasses={gradient}
            glowColor={glow}
            onRequestQuote={() => navigate('/#quote')}
            onBack={() => navigate('/marketplace/stock')}
            ctaLabel="Get Offer"
            backLabel="Marketplace"
          />
        </div>
      </section>
    </>
  )
}
