import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getArticleById, getCategoryById } from '../../data/knowledge'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'

export default function KnowledgeArticlePage() {
  const { t } = useSellerLocale()
  const { id } = useParams<{ id: string }>()
  const article = id ? getArticleById(id) : undefined
  const category = article ? getCategoryById(article.categoryId) : undefined

  if (!article) {
    return (
      <div className="py-8">
        <p className="text-neutral-500">{t.tools.knowledgeArticleNotFound}</p>
        <Link to="/tools/knowledge" className="text-accent hover:underline mt-4 inline-block">
          ← {t.tools.knowledgeBackToList}
        </Link>
      </div>
    )
  }

  return (
    <>
      <nav className="text-sm text-neutral-500 mb-6" aria-label="Breadcrumbs">
        <Link to="/" className="hover:text-primary">{t.tools.knowledgeHome}</Link>
        <span className="mx-2">/</span>
        <Link to="/tools/knowledge" className="hover:text-primary">{t.tools.knowledge}</Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <span className="text-primary">{category.title}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-neutral-700">{article.title}</span>
      </nav>

      <article>
        <h1 className="text-2xl font-bold text-primary">{article.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t.tools.knowledgeUpdated}: {article.updatedAt}
          {category && ` · ${category.title}`}
        </p>
        <div className="mt-6 prose prose-neutral max-w-none prose-headings:text-primary prose-p:text-neutral-700 prose-li:text-neutral-700">
          {article.content.split('\n\n').map((block, i) => {
            if (block.startsWith('## ')) {
              return (
                <h2 key={i} className="text-xl font-semibold mt-8 mb-2">
                  {block.slice(3)}
                </h2>
              )
            }
            if (block.startsWith('- ')) {
              const items = block.split('\n').filter((l) => l.startsWith('- '))
              return (
                <ul key={i} className="list-disc pl-6 mt-2 space-y-1">
                  {items.map((item, j) => (
                    <li key={j}>{item.slice(2)}</li>
                  ))}
                </ul>
              )
            }
            if (block.startsWith('1. ')) {
              const items = block.split('\n').filter((l) => /^\d+\.\s/.test(l))
              return (
                <ol key={i} className="list-decimal pl-6 mt-2 space-y-1">
                  {items.map((item, j) => (
                    <li key={j}>{item.replace(/^\d+\.\s/, '')}</li>
                  ))}
                </ol>
              )
            }
            const re = /\[([^\]]+)\]\(([^)]+)\)/g
            const nodes: (string | ReactNode)[] = []
            let lastIdx = 0
            let match: RegExpExecArray | null
            while ((match = re.exec(block)) !== null) {
              nodes.push(block.slice(lastIdx, match.index))
              nodes.push(
                <Link key={match.index} to={match[2]} className="text-accent hover:underline">
                  {match[1]}
                </Link>
              )
              lastIdx = re.lastIndex
            }
            nodes.push(block.slice(lastIdx))
            return (
              <p key={i} className="mt-2 leading-relaxed">
                {nodes.length > 1 ? nodes : block}
              </p>
            )
          })}
        </div>
      </article>

      <div className="mt-10 pt-6 border-t border-neutral-200">
        <Link
          to="/tools/knowledge"
          className="text-accent hover:underline inline-flex items-center gap-1"
        >
          ← {t.tools.knowledgeBackToList}
        </Link>
      </div>
    </>
  )
}
