import { useState, useMemo } from 'react'
import { useBuyer } from '../../store/buyerStore'
import { IconFileText } from '../../components/CabinetIcons'
import type { Rfq, RfqStatus } from '../../types/buyer'

const STATUS_LABELS: Record<RfqStatus, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  UNDER_REVIEW: 'На рассмотрении',
  QUOTED: 'Предложение отправлено',
  APPROVED_BY_BUYER: 'Утверждён покупателем',
  REJECTED_BY_BUYER: 'Отклонён покупателем',
  CLOSED: 'Закрыт',
  CANCELLED: 'Отменён',
}

const STATUS_STYLES: Record<RfqStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SENT: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  QUOTED: 'bg-green-100 text-green-800',
  APPROVED_BY_BUYER: 'bg-emerald-100 text-emerald-800',
  REJECTED_BY_BUYER: 'bg-red-100 text-red-800',
  CLOSED: 'bg-neutral-100 text-neutral-600',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
}

/** Available seller actions per status */
function getSellerActions(status: RfqStatus): { label: string; action: string; style: string }[] {
  switch (status) {
    case 'SENT':
      return [
        { label: 'Взять в работу', action: 'review', style: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { label: 'Отправить предложение', action: 'quote', style: 'bg-green-600 hover:bg-green-700 text-white' },
      ]
    case 'UNDER_REVIEW':
      return [
        { label: 'Отправить предложение', action: 'quote', style: 'bg-green-600 hover:bg-green-700 text-white' },
        { label: 'Закрыть', action: 'close', style: 'bg-neutral-500 hover:bg-neutral-600 text-white' },
      ]
    case 'QUOTED':
      return [
        { label: 'Закрыть', action: 'close', style: 'bg-neutral-500 hover:bg-neutral-600 text-white' },
      ]
    case 'APPROVED_BY_BUYER':
      return [
        { label: 'Закрыть', action: 'close', style: 'bg-neutral-500 hover:bg-neutral-600 text-white' },
      ]
    default:
      return []
  }
}

const ALL_STATUSES: RfqStatus[] = ['DRAFT', 'SENT', 'UNDER_REVIEW', 'QUOTED', 'APPROVED_BY_BUYER', 'REJECTED_BY_BUYER', 'CLOSED', 'CANCELLED']
const PAGE_SIZE = 10

export default function MyRfqManagement() {
  const buyer = useBuyer()
  const { rfqs } = buyer
  const [statusFilter, setStatusFilter] = useState<RfqStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = rfqs
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.items.some((it) => it.description.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [rfqs, statusFilter, search])

  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const stats = useMemo(() => {
    const pending = rfqs.filter((r) => r.status === 'SENT' || r.status === 'UNDER_REVIEW').length
    const quoted = rfqs.filter((r) => r.status === 'QUOTED').length
    const approved = rfqs.filter((r) => r.status === 'APPROVED_BY_BUYER').length
    return { total: rfqs.length, pending, quoted, approved }
  }, [rfqs])

  const handleAction = (rfq: Rfq, action: string) => {
    const confirmMsg = `Изменить статус запроса "${rfq.title}"?`
    if (!window.confirm(confirmMsg)) return

    switch (action) {
      case 'review':
        buyer.reviewRfq(rfq.id)
        break
      case 'quote':
        buyer.quoteRfq(rfq.id)
        break
      case 'close':
        buyer.closeRfq(rfq.id)
        break
      case 'cancel':
        buyer.cancelRfq(rfq.id)
        break
    }
    setActionFeedback(`Статус запроса "${rfq.title}" обновлён.`)
    setTimeout(() => setActionFeedback(null), 3000)
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <IconFileText className="shrink-0" /> Управление заявками
          </h2>
          <p className="mt-1 text-neutral-600 text-sm">
            Все запросы от покупателей. Обрабатывайте, отвечайте, меняйте статусы.
          </p>
        </div>
      </div>

      {/* Feedback */}
      {actionFeedback && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 animate-fade-in">
          ✓ {actionFeedback}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Всего" value={stats.total} />
        <MiniStat label="Ожидают" value={stats.pending} accent={stats.pending > 0} />
        <MiniStat label="Предложения" value={stats.quoted} />
        <MiniStat label="Утверждены" value={stats.approved} />
      </div>

      {/* Search + Filter */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Поиск по названию, ID, комментарию..."
          className="flex-1 min-w-0 max-w-md rounded-lg border border-neutral-300 px-4 py-2.5 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600 shrink-0">Статус:</span>
          <button type="button" onClick={() => { setStatusFilter('all'); setPage(0) }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            Все ({rfqs.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const count = rfqs.filter((r) => r.status === s).length
            if (count === 0) return null
            return (
              <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(0) }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'ring-2 ring-primary ring-offset-1 bg-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                {STATUS_LABELS[s]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
          <p className="text-neutral-600 font-medium">Заявок пока нет.</p>
          <p className="mt-1 text-sm text-neutral-500">Покупатели создадут запросы через витрину после загрузки прайса.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 font-semibold text-neutral-700">Запрос</th>
                  <th className="px-4 py-3 font-semibold text-neutral-700">Дата</th>
                  <th className="px-4 py-3 font-semibold text-neutral-700">Статус</th>
                  <th className="px-3 py-3 font-semibold text-neutral-700 text-center">Поз.</th>
                  <th className="px-4 py-3 font-semibold text-neutral-700">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, idx) => {
                  const actions = getSellerActions(r.status)
                  const isExpanded = expandedId === r.id
                  return (
                    <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${idx % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : r.id)} className="text-left group">
                          <span className="font-medium text-neutral-800 group-hover:text-accent transition-colors">{r.title}</span>
                          <span className="block text-xs text-neutral-400 mt-0.5">{r.id.slice(0, 8)}… {r.comment ? `· ${r.comment.slice(0, 40)}${r.comment.length > 40 ? '…' : ''}` : ''}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-neutral-700">{r.items.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {actions.map((a) => (
                            <button
                              key={a.action}
                              type="button"
                              onClick={() => handleAction(r, a.action)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${a.style}`}
                            >
                              {a.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                          >
                            {isExpanded ? 'Свернуть' : 'Детали'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">
                Назад
              </button>
              <span className="text-sm text-neutral-600">{page + 1} из {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">
                Далее
              </button>
            </div>
          )}
        </>
      )}

      {/* Expanded detail panel */}
      {expandedId && (() => {
        const rfq = rfqs.find((r) => r.id === expandedId)
        if (!rfq) return null
        const messages = buyer.getRfqMessages(expandedId)
        const history = buyer.getRfqStatusHistory(expandedId)
        const actions = getSellerActions(rfq.status)
        return (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-primary">{rfq.title}</h3>
                <p className="text-sm text-neutral-500 mt-1">ID: {rfq.id.slice(0, 12)}… · {new Date(rfq.createdAt).toLocaleString('ru-RU')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[rfq.status]}`}>
                  {STATUS_LABELS[rfq.status]}
                </span>
                {actions.length > 0 && actions.map((a) => (
                  <button key={a.action} type="button" onClick={() => handleAction(rfq, a.action)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${a.style}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {rfq.comment && (
              <p className="mt-3 text-sm text-neutral-700 bg-white rounded-lg p-3 border border-neutral-200">{rfq.comment}</p>
            )}

            {rfq.desiredDeliveryDate && (
              <p className="mt-2 text-sm text-neutral-600">
                <strong>Желаемая поставка:</strong> {new Date(rfq.desiredDeliveryDate).toLocaleDateString('ru-RU')}
              </p>
            )}

            {/* Items */}
            {rfq.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Позиции ({rfq.items.length})</h4>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-200">
                        <th className="px-3 py-2 font-medium text-neutral-600">Описание</th>
                        <th className="px-3 py-2 font-medium text-neutral-600 text-center">Кол-во</th>
                        <th className="px-3 py-2 font-medium text-neutral-600 text-right">Целевая цена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.items.map((item, i) => (
                        <tr key={item.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                          <td className="px-3 py-2 text-neutral-800">{item.description}</td>
                          <td className="px-3 py-2 text-neutral-700 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-neutral-700 text-right">{item.targetPrice != null ? `${item.targetPrice} ${item.currency}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status history */}
            {history.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">История статусов</h4>
                <div className="flex flex-col gap-1">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400 shrink-0 w-32">{new Date(h.changedAt).toLocaleString('ru-RU')}</span>
                      <span className={`rounded px-1.5 py-0.5 ${STATUS_STYLES[h.status]}`}>{STATUS_LABELS[h.status]}</span>
                      {h.comment && <span className="text-neutral-600 truncate">— {h.comment}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Сообщения ({messages.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={`rounded-lg p-3 border text-xs ${m.authorType === 'BUYER' ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-200'}`}>
                      <span className="text-neutral-400">{m.authorType === 'BUYER' ? 'Покупатель' : 'Продавец'} · {new Date(m.createdAt).toLocaleString('ru-RU')}</span>
                      <p className="mt-1 text-neutral-800">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={() => setExpandedId(null)} className="mt-4 text-sm text-neutral-500 hover:text-neutral-700">
              ← Свернуть
            </button>
          </div>
        )
      })()}
    </>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center transition-colors ${accent ? 'border-amber-200 bg-amber-50' : 'border-neutral-200 bg-neutral-50'}`}>
      <p className={`text-2xl font-bold ${accent ? 'text-amber-700' : 'text-primary'}`}>{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  )
}
