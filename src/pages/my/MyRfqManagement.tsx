import { useState, useMemo } from 'react'
import { useBuyer } from '../../store/buyerStore'
import { IconFileText } from '../../components/CabinetIcons'
import type { Rfq, RfqStatus } from '../../types/buyer'
import { exportRfqToExcel } from '../../utils/exportRfq'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'
import ConfirmDialog from '../../components/ConfirmDialog'

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


const ALL_STATUSES: RfqStatus[] = ['DRAFT', 'SENT', 'UNDER_REVIEW', 'QUOTED', 'APPROVED_BY_BUYER', 'REJECTED_BY_BUYER', 'CLOSED', 'CANCELLED']
const PAGE_SIZE = 10

export default function MyRfqManagement() {
  const { t, locale } = useSellerLocale()
  const buyer = useBuyer()
  const { rfqs } = buyer

  /** Available seller actions per status */
  const getSellerActions = (status: RfqStatus): { label: string; action: string; style: string }[] => {
    switch (status) {
      case 'SENT':
        return [
          { label: t.rfq.actions.review, action: 'review', style: 'bg-amber-500 hover:bg-amber-600 text-white' },
          { label: t.rfq.actions.quote, action: 'quote', style: 'bg-green-600 hover:bg-green-700 text-white' },
        ]
      case 'UNDER_REVIEW':
        return [
          { label: t.rfq.actions.quote, action: 'quote', style: 'bg-green-600 hover:bg-green-700 text-white' },
          { label: t.rfq.actions.close, action: 'close', style: 'bg-neutral-500 hover:bg-neutral-600 text-white' },
        ]
      case 'QUOTED':
        return [
          { label: t.rfq.actions.close, action: 'close', style: 'bg-neutral-500 hover:bg-neutral-600 text-white' },
        ]
      case 'APPROVED_BY_BUYER':
        return [
          { label: t.rfq.actions.close, action: 'close', style: 'bg-neutral-500 hover:bg-neutral-600 text-white' },
        ]
      default:
        return []
    }
  }
  const [statusFilter, setStatusFilter] = useState<RfqStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }))

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
    setConfirmState({
      isOpen: true,
      title: t.rfq.actions.confirm.replace('{{title}}', rfq.title),
      message: `${t.rfq.table.request}: ${rfq.title}. ${t.rfq.table.status}: ${t.rfq.statuses[rfq.status]}`,
      onConfirm: () => {
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
        setActionFeedback(t.rfq.actions.feedback.replace('{{title}}', rfq.title))
        setTimeout(() => setActionFeedback(null), 3000)
        closeConfirm()
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <IconFileText className="shrink-0" /> {t.rfq.title}
          </h2>
          <p className="mt-1 text-neutral-600 text-sm">
            {t.rfq.subtitle}
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
        <MiniStat label={t.rfq.stats.total} value={stats.total} />
        <MiniStat label={t.rfq.stats.pending} value={stats.pending} accent={stats.pending > 0} />
        <MiniStat label={t.rfq.stats.quoted} value={stats.quoted} />
        <MiniStat label={t.rfq.stats.approved} value={stats.approved} />
      </div>

      {/* Search + Filter */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder={t.rfq.filters.searchPlaceholder}
          className="flex-1 min-w-0 max-w-md rounded-lg border border-neutral-300 px-4 py-2.5 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600 shrink-0">{t.rfq.filters.status}</span>
          <button type="button" onClick={() => { setStatusFilter('all'); setPage(0) }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            {t.rfq.filters.all} ({rfqs.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const count = rfqs.filter((r) => r.status === s).length
            if (count === 0) return null
            return (
              <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(0) }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'ring-2 ring-primary ring-offset-1 bg-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                {t.rfq.statuses[s]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
          <p className="text-neutral-600 font-medium">{t.rfq.filters.noRfqs}</p>
          <p className="mt-1 text-sm text-neutral-500">{t.rfq.filters.noRfqsDesc}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfq.table.request}</th>
                  <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfq.table.date}</th>
                  <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfq.table.status}</th>
                  <th className="px-3 py-3 font-semibold text-neutral-700 text-center">{t.rfq.table.positions}</th>
                  <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfq.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => {
                  const actions = getSellerActions(r.status)
                  const isExpanded = expandedId === r.id
                  return (
                    <tr key={r.id} className="border-b border-neutral-100 last:border-0 even:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : r.id)} className="text-left group">
                          <span className="font-medium text-neutral-800 group-hover:text-accent transition-colors">{r.title}</span>
                          <span className="block text-xs text-neutral-400 mt-0.5">{r.id.slice(0, 8)}… {r.comment ? `· ${r.comment.slice(0, 40)}${r.comment.length > 40 ? '…' : ''}` : ''}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                          {t.rfq.statuses[r.status]}
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
                            {isExpanded ? t.rfq.table.collapse : t.rfq.table.expand}
                          </button>
                          <button
                            type="button"
                            onClick={() => exportRfqToExcel(r)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
                          >
                            {t.common.excel}
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
                {t.common.prev}
              </button>
              <span className="text-sm text-neutral-600">{page + 1} {t.common.of} {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">
                {t.common.next}
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
                <p className="text-sm text-neutral-500 mt-1">
                  {t.rfq.detail.id} {rfq.id.slice(0, 12)}… · {new Date(rfq.createdAt).toLocaleString(locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[rfq.status]}`}>
                  {t.rfq.statuses[rfq.status]}
                </span>
                {actions.length > 0 && actions.map((a) => (
                  <button key={a.action} type="button" onClick={() => handleAction(rfq, a.action)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${a.style}`}>
                    {a.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => exportRfqToExcel(rfq)}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t.rfq.detail.excel}
                </button>
              </div>
            </div>

            {rfq.comment && (
              <div className="mt-3 text-sm text-neutral-700 bg-white rounded-lg p-3 border border-neutral-200">
                <strong className="block text-xs text-neutral-400 mb-1 uppercase tracking-wider">{t.rfq.detail.comment}</strong>
                {rfq.comment}
              </div>
            )}

            {rfq.desiredDeliveryDate && (
              <p className="mt-2 text-sm text-neutral-600">
                <strong>{t.rfq.detail.delivery}</strong> {new Date(rfq.desiredDeliveryDate).toLocaleDateString(locale)}
              </p>
            )}

            {/* Items */}
            {rfq.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">{t.rfq.detail.positions} ({rfq.items.length})</h4>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-200">
                        <th className="px-3 py-2 font-medium text-neutral-600">{t.rfq.detail.description}</th>
                        <th className="px-3 py-2 font-medium text-neutral-600 text-center">{t.rfq.detail.qty}</th>
                        <th className="px-3 py-2 font-medium text-neutral-600 text-right">{t.rfq.detail.targetPrice}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.items.map((item, i) => (
                        <tr key={item.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                          <td className="px-3 py-2 text-neutral-800">{item.description}</td>
                          <td className="px-3 py-2 text-neutral-700 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-neutral-700 text-right">
                            {item.targetPrice != null ? item.targetPrice.toLocaleString(locale, { style: 'currency', currency: item.currency || 'EUR' }) : '—'}
                          </td>
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
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">{t.rfq.detail.history}</h4>
                <div className="flex flex-col gap-1">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400 shrink-0 w-32">{new Date(h.changedAt).toLocaleString(locale)}</span>
                      <span className={`rounded px-1.5 py-0.5 ${STATUS_STYLES[h.status]}`}>{t.rfq.statuses[h.status]}</span>
                      {h.comment && <span className="text-neutral-600 truncate">— {h.comment}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">{t.rfq.detail.messages} ({messages.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={`rounded-lg p-3 border text-xs ${m.authorType === 'BUYER' ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-200'}`}>
                      <span className="text-neutral-400">{m.authorType === 'BUYER' ? t.rfq.detail.buyer : t.rfq.detail.seller} · {new Date(m.createdAt).toLocaleString(locale)}</span>
                      <p className="mt-1 text-neutral-800">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={() => setExpandedId(null)} className="mt-4 text-sm text-neutral-500 hover:text-neutral-700">
              ← {t.rfq.table.collapse}
            </button>
          </div>
        )
      })()}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
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
