import { Link, useNavigate } from 'react-router-dom'
import PageHero from '../../components/PageHero'
import { useBuyerLocale } from '../../i18n/BuyerLocaleContext'
import { useInventory } from '../../store/inventoryStore'
import { suggestBrandFromDescription } from '../../data/catalogs'
import {
  IconFolder,
  IconPackage,
  IconCpu,
  IconTag,
} from '../../components/CabinetIcons'
import type { InventoryItem } from '../../types/inventory'
import { getDemoImageUrl } from '../../data/demoImages'

const PREVIEW_LIMIT = 12

/** Lightweight preview card for the public stock page — with real photo */
function PreviewCard({ it, index, onClick }: { it: InventoryItem; index: number; onClick: () => void }) {
  const { t } = useBuyerLocale()
  const brand = it.brand || suggestBrandFromDescription(it.description)
  const ram = it.ram_raw ?? (it.laptopRamGb != null ? `${it.laptopRamGb} GB` : undefined)
  const imageUrl = it.imageUrl || getDemoImageUrl(index, brand, it.category)

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 cursor-pointer"
      onClick={onClick}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] w-full bg-neutral-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={it.description}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = getDemoImageUrl(index + 50, brand, it.category) }}
        />
        {it.condition && (
          <span className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-neutral-700 shadow-sm">
            {it.condition}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-primary text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">{it.description}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
          {brand && <span className="font-medium text-neutral-700">{brand}</span>}
          {brand && (it.sku || it.inventoryNumber) && <span className="text-neutral-300">·</span>}
          {(it.sku || it.inventoryNumber) && <span>{it.sku || it.inventoryNumber}</span>}
        </div>

        {/* Spec chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {it.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">
              <IconFolder className="shrink-0 w-3 h-3" /> {it.category}
            </span>
          )}
          {it.processor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 truncate max-w-[140px]" title={it.processor}>
              <IconCpu className="shrink-0 w-3 h-3" /> {it.processor}
            </span>
          )}
          {ram && (
            <span className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">
              {ram}
            </span>
          )}
        </div>

        {/* Bottom row: quantity + CTA hint */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            {it.quantity != null && it.quantity > 0 && (
              <span className="inline-flex items-center gap-1">
                <IconPackage className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                {it.quantity} {t.publicStock.pcs}
              </span>
            )}
            {it.location && (
              <span className="inline-flex items-center gap-1">
                <IconTag className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                {it.location.split(' ')[0]}
              </span>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 italic">{t.publicStock.priceOnRequest}</span>
        </div>
      </div>
    </div>
  )
}

export default function Stock() {
  const { t } = useBuyerLocale()
  const navigate = useNavigate()
  const { getAvailable } = useInventory()
  const items = getAvailable()
  const preview = items.slice(0, PREVIEW_LIMIT)
  const hasMore = items.length > PREVIEW_LIMIT

  return (
    <>
      <PageHero
        title={t.publicStock.title}
        subtitle={items.length > 0 ? t.publicStock.subtitle.replace('{{count}}', items.length.toString()) : undefined}
      />
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* CTA banner */}
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary-light p-4 sm:p-6 lg:p-8 text-white flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold">{t.publicStock.ctaTitle}</h2>
              <p className="mt-1 text-white/80 text-xs sm:text-sm max-w-lg">
                {t.publicStock.ctaDesc}
              </p>
            </div>
            <Link to="/buyer" className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-primary hover:bg-neutral-50 transition-colors shadow-lg w-full sm:w-auto min-h-[44px]">
              {t.publicStock.ctaButton}
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="mt-10 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-12 text-center text-neutral-500">
              <p className="font-medium text-neutral-600">{t.publicStock.noItems}</p>
              <p className="mt-1 text-sm">{t.publicStock.noItemsDesc}</p>
            </div>
          ) : (
            <>
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {preview.map((it, idx) => (
                  <PreviewCard key={it.id} it={it} index={idx} onClick={() => navigate(`/marketplace/item/${it.id}`)} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-neutral-500 mb-4">
                    {t.publicStock.previewInfo.replace('{{count}}', preview.length.toString()).replace('{{total}}', items.length.toString())}
                  </p>
                  <Link to="/buyer" className="btn-primary inline-flex items-center gap-2">
                    {t.publicStock.openFull}
                  </Link>
                </div>
              )}

              {!hasMore && (
                <div className="mt-8 text-center">
                  <Link to="/buyer" className="btn-primary inline-flex items-center gap-2">
                    {t.publicStock.loginForPrice}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
