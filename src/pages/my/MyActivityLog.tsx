import { useMemo, useState } from 'react'
import { IconActivity } from '../../components/CabinetIcons'
import { useInventory } from '../../store/inventoryStore'
import { useBuyer } from '../../store/buyerStore'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'

type LogEntry = {
  id: string
  date: string
  type: 'inventory' | 'rfq' | 'user' | 'system'
  action: string
  details: string
}

const TYPE_STYLES: Record<LogEntry['type'], string> = {
  inventory: 'bg-blue-100 text-blue-800',
  rfq: 'bg-green-100 text-green-800',
  user: 'bg-purple-100 text-purple-800',
  system: 'bg-neutral-100 text-neutral-600',
}

export default function MyActivityLog() {
  const { t, locale } = useSellerLocale()
  const { items, batches, lastUpdated } = useInventory()
  const { rfqs } = useBuyer()
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15

  // Build activity log from real data
  const logs = useMemo(() => {
    const entries: LogEntry[] = []

    // Inventory events
    if (lastUpdated) {
      entries.push({
        id: 'inv-update',
        date: lastUpdated,
        type: 'inventory',
        action: t.activity.actions.priceUpdate,
        details: t.activity.actions.priceUpdateDesc.replace('{{count}}', items.length.toString()),
      })
    }

    // Batch events
    batches.forEach((b) => {
      entries.push({
        id: `batch-${b.id}`,
        date: b.date ?? new Date().toISOString(),
        type: 'inventory',
        action: t.activity.actions.batchCreated,
        details: t.activity.actions.batchCreatedDesc
          .replace('{{name}}', b.source || b.id.slice(0, 8))
          .replace('{{supplier}}', b.supplier || '—'),
      })
    })

    // RFQ events
    rfqs.forEach((r) => {
      entries.push({
        id: `rfq-${r.id}`,
        date: r.createdAt,
        type: 'rfq',
        action: t.activity.actions.rfqCreated.replace('{{title}}', r.title),
        details: t.activity.actions.rfqCreatedDesc
          .replace('{{count}}', r.items.length.toString())
          .replace('{{status}}', t.rfq.statuses[r.status]),
      })
    })

    // Sort by date descending
    return entries.sort((a, b) => b.date.localeCompare(a.date))
  }, [items, batches, lastUpdated, rfqs])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? logs : logs.filter((l) => l.type === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((l) => l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q))
    }
    return list
  }, [logs, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
        <IconActivity className="shrink-0" /> {t.activity.title}
      </h2>
      <p className="mt-2 text-neutral-600 leading-relaxed">
        {t.activity.description.replace('{{total}}', logs.length.toString())}
      </p>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-600">{t.activity.filter}</span>
        {(['all', 'inventory', 'rfq', 'user', 'system'] as const).map((typeKey) => (
          <button key={typeKey} type="button" onClick={() => setFilter(typeKey)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === typeKey ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            {typeKey === 'all' ? `${t.activity.all} (${logs.length})` : `${t.activity.types[typeKey]} (${logs.filter((l) => l.type === typeKey).length})`}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder={t.activity.searchPlaceholder}
          className="w-full sm:w-72 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
          <p className="text-neutral-600">{t.activity.emptyState}</p>
          <p className="mt-1 text-sm text-neutral-500">{t.activity.emptyDesc}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {paginated.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex-shrink-0 mt-0.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[entry.type]}`}>
                    {t.activity.types[entry.type]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">{entry.action}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{entry.details}</p>
                </div>
                <time className="flex-shrink-0 text-xs text-neutral-400 whitespace-nowrap">
                  {new Date(entry.date).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">←</button>
              <span className="text-sm text-neutral-600">{page + 1} / {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">→</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
