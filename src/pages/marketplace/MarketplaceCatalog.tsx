import { Link } from 'react-router-dom'
import PageHero from '../../components/PageHero'
import { useBuyerLocale } from '../../i18n/BuyerLocaleContext'
import { getCategories, getBrands } from '../../data/catalogs'
import { IconFolder, IconTag } from '../../components/CabinetIcons'

export default function MarketplaceCatalog() {
  const { t } = useBuyerLocale()
  const categories = getCategories()
  const brands = getBrands()

  return (
    <>
      <PageHero title={t.publicStock.marketplace} subtitle={t.publicStock.title} />

      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar Filters (Visual only) */}
            <div className="hidden md:block space-y-8">
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <IconFolder className="w-4 h-4" /> {t.stock.filterCategory}
                </h3>
                <ul className="space-y-2">
                  {categories.map(cat => (
                    <li key={cat}>
                      <Link to="/marketplace/stock" className="text-sm text-neutral-600 hover:text-accent transition-colors">{cat}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <IconTag className="w-4 h-4" /> {t.stock.filterBrand}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brands.slice(0, 15).map(brand => (
                    <Link key={brand} to="/marketplace/stock" className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs hover:bg-neutral-200 transition-colors">
                      {brand}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <div className="rounded-2xl bg-neutral-900 p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-3xl font-bold mb-4">{t.publicStock.ctaTitle}</h2>
                  <p className="text-neutral-400 mb-8">{t.publicStock.ctaDesc}</p>
                  <Link to="/buyer" className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover transition-all">
                    {t.publicStock.ctaButton}
                  </Link>
                </div>
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -mr-32 -mt-32" />
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {categories.slice(0, 4).map(cat => (
                  <Link key={cat} to="/marketplace/stock" className="group relative rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-xl transition-all">
                    <h3 className="text-lg font-bold text-primary mb-2 group-hover:text-accent transition-colors">{cat}</h3>
                    <p className="text-sm text-neutral-500">Explore our curated selection of high-quality {cat.toLowerCase()} for your business needs.</p>
                    <div className="mt-4 text-accent font-semibold text-sm inline-flex items-center gap-1">
                      View items <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
