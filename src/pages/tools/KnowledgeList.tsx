import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IconSearch } from '../../components/CabinetIcons'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'
import {
  KNOWLEDGE_CATEGORIES,
  getArticlesByCategory,
  searchArticles,
} from '../../data/knowledge'

export default function KnowledgeList() {
  const { t } = useSellerLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const articles = useMemo(() => {
    if (searchQuery.trim()) {
      return searchArticles(searchQuery)
    }
    if (selectedCategoryId) {
      return getArticlesByCategory(selectedCategoryId)
    }
    return []
  }, [searchQuery, selectedCategoryId])

  const showCategories = !searchQuery.trim()

  return (
    <>
      <h2 className="text-lg font-semibold text-primary">{t.tools.knowledge}</h2>
      <p className="mt-2 text-neutral-600 leading-relaxed">
        {t.tools.knowledgeSubtitle}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <label className="relative flex-1 max-w-md">
          <span className="sr-only">{t.tools.knowledgeSearch}</span>
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedCategoryId(null)
            }}
            placeholder={t.tools.knowledgeSearch}
            className="w-full rounded-xl border border-neutral-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </label>
      </div>

      {showCategories && (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-primary mb-3">{t.tools.knowledgeCategories}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KNOWLEDGE_CATEGORIES.sort((a, b) => a.order - b.order).map((cat) => {
              const count = getArticlesByCategory(cat.id).length
              const isSelected = selectedCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/5 ring-2 ring-accent'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-card'
                  }`}
                >
                  <span className="font-medium text-primary">{cat.title}</span>
                  <p className="mt-1 text-sm text-neutral-500">{t.tools.knowledgeArticlesCount.replace('{{count}}', count.toString())}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-base font-semibold text-primary mb-3">
          {searchQuery.trim()
            ? `${t.tools.knowledgeFound}: ${articles.length}`
            : selectedCategoryId
              ? t.tools.knowledgeArticlesInCategory
              : t.tools.knowledgeSelectCategory}
        </h3>
        {articles.length > 0 ? (
          <ul className="space-y-3">
            {articles.map((art) => (
              <li key={art.id}>
                <Link
                  to={`/tools/knowledge/article/${art.id}`}
                  className="block rounded-xl border border-neutral-200 p-4 hover:border-accent hover:bg-accent/5 transition-colors"
                >
                  <span className="font-medium text-primary">{art.title}</span>
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{art.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          (searchQuery.trim() || selectedCategoryId) && (
            <p className="text-neutral-500 py-6">{t.tools.knowledgeNotFound}</p>
          )
        )}
      </div>
    </>
  )
}
