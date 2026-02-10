import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch } from './CabinetIcons'
import { searchArticles } from '../data/knowledge'

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const results = query.trim() ? searchArticles(query) : []

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close])

  const goToArticle = (id: string) => {
    navigate(`/tools/knowledge/article/${id}`)
    close()
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        aria-hidden
        onClick={close}
      />
      <div
        className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-neutral-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Глобальный поиск по базе знаний"
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 p-3">
          <IconSearch className="shrink-0 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по базе знаний (Ctrl+K)"
            className="flex-1 bg-transparent text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {results.length > 0 ? (
            <ul className="space-y-0.5">
              {results.slice(0, 8).map((art) => (
                <li key={art.id}>
                  <button
                    type="button"
                    onClick={() => goToArticle(art.id)}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
                  >
                    <span className="font-medium text-primary">{art.title}</span>
                    <p className="mt-0.5 line-clamp-1 text-neutral-500">{art.summary}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <p className="py-4 text-center text-sm text-neutral-500">Ничего не найдено</p>
          ) : (
            <div className="space-y-2 py-2">
              <p className="px-2 text-sm text-neutral-500">Введите запрос для поиска по статьям</p>
              <button
                type="button"
                onClick={() => { navigate('/tools/references'); close() }}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none border border-neutral-100"
              >
                <span className="font-medium text-primary">Справочники NEXX</span>
                <p className="mt-0.5 line-clamp-1 text-neutral-500">Зарядні станції, Apple PMIC, ціни</p>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
