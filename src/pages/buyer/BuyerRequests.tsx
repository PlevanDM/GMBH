import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBuyer } from '../../store/buyerStore'
import { useBuyerLocale } from '../../i18n/BuyerLocaleContext'
import type { RfqStatus } from '../../types/buyer'

const RFQ_STATUS_STYLES: Record<RfqStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SENT: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  QUOTED: 'bg-green-100 text-green-800',
  APPROVED_BY_BUYER: 'bg-emerald-100 text-emerald-800',
  REJECTED_BY_BUYER: 'bg-red-100 text-red-800',
  CLOSED: 'bg-neutral-100 text-neutral-600',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
}

const ALL_STATUSES: RfqStatus[] = [
  'DRAFT', 'SENT', 'UNDER_REVIEW', 'QUOTED', 'APPROVED_BY_BUYER', 'REJECTED_BY_BUYER', 'CLOSED', 'CANCELLED',
]

export default function BuyerRequests() {
  const navigate = useNavigate()
  const { t } = useBuyerLocale()
  const { rfqs, createRfq, deleteRfq } = useBuyer()
  const [statusFilter, setStatusFilter] = useState<RfqStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const statusLabels: Record<RfqStatus, string> = t.rfqDetail.statuses as Record<RfqStatus, string>

  const filtered = useMemo(() => {
    let list = rfqs
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    if (dateFrom) list = list.filter((r) => r.createdAt >= dateFrom)
    if (dateTo) list = list.filter((r) => r.createdAt.slice(0, 10) <= dateTo)
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [rfqs, statusFilter, dateFrom, dateTo])

  const handleCreate = () => {
    const rfq = createRfq({ title: t.rfqList.createButton, items: [] })
    navigate(`/buyer/requests/${rfq.id}`)
  }

  const handleExport = (id: string, format: 'pdf' | 'xlsx') => {
    import('../../auth/session').then(({ exportRfq }) => exportRfq(id, format))
  }

  const handleDelete = (id: string) => {
    const confirmed = window.confirm((t.rfqDetail as Record<string, unknown>).confirmDelete as string ?? 'Delete this RFQ?')
    if (!confirmed) return
    deleteRfq(id)
  }

  return (
    <>
      <h2 className="text-base sm:text-lg font-semibold text-primary">{t.rfqList.title}</h2>
      <p className="mt-2 text-neutral-600 text-sm sm:text-base leading-relaxed">{t.rfqList.emptyText}</p>

      {/* Action buttons */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button type="button" onClick={handleCreate} className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]">{t.rfqList.createButton}</button>
        <Link to="/buyer" className="btn-secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]">{t.empty.goToStock}</Link>
      </div>

      {/* Filters */}
      <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 sm:p-4">
        {/* Status filter — dropdown on mobile, chips on desktop */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium text-neutral-600 shrink-0">{t.rfqList.filters.status}:</span>
          {/* Mobile: dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RfqStatus | 'all')}
            className="sm:hidden w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm min-h-[44px]"
          >
            <option value="all">— {t.rfqList.filters.status} —</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
          {/* Desktop: chip buttons */}
          <div className="hidden sm:flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              —
            </button>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === s ? 'ring-2 ring-primary ring-offset-1 bg-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Date range — stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium text-neutral-600 shrink-0">{t.rfqList.filters.period}:</span>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center w-full sm:w-auto">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[44px] sm:min-h-[36px]"
            />
            <span className="hidden sm:inline text-neutral-400">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[44px] sm:min-h-[36px]"
            />
          </div>
        </div>
      </div>

      {/* Desktop: table view */}
      <div className="mt-4 sm:mt-6 hidden sm:block overflow-hidden rounded-xl border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.number} / {t.rfqList.columns.title}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.createdAt}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.status}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.itemsCount}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.expiresAt}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/buyer/requests/${r.id}`} className="font-medium text-primary hover:underline">{r.title}</Link>
                    <span className="text-neutral-500 block text-xs">{r.id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RFQ_STATUS_STYLES[r.status]}`}>{statusLabels[r.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{r.items.length}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link to={`/buyer/requests/${r.id}`} className="text-accent hover:underline text-sm">{t.rfqList.actions.open}</Link>
                      <button type="button" onClick={() => handleExport(r.id, 'pdf')} className="text-neutral-600 hover:underline text-sm">PDF</button>
                      <button type="button" onClick={() => handleExport(r.id, 'xlsx')} className="text-neutral-600 hover:underline text-sm">Excel</button>
                      <button type="button" onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline text-sm">{t.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="bg-neutral-50 px-4 py-12 text-center">
            <p className="text-neutral-600">{t.rfqList.emptyTitle}</p>
            <button type="button" onClick={handleCreate} className="btn-primary mt-4 inline-flex">{t.rfqList.createButton}</button>
            <Link to="/buyer" className="btn-secondary mt-3 ml-3 inline-flex">{t.empty.goToStock}</Link>
          </div>
        )}
      </div>

      {/* Mobile: card view */}
      <div className="mt-4 sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
            <p className="text-neutral-600 text-sm">{t.rfqList.emptyTitle}</p>
            <button type="button" onClick={handleCreate} className="btn-primary mt-4 inline-flex text-sm">{t.rfqList.createButton}</button>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/buyer/requests/${r.id}`} className="font-semibold text-primary text-sm hover:underline line-clamp-2">{r.title}</Link>
                  <span className="text-neutral-400 text-xs block mt-0.5">{r.id.slice(0, 8)}…</span>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${RFQ_STATUS_STYLES[r.status]}`}>{statusLabels[r.status]}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                <div>
                  <span className="text-neutral-400">{t.rfqList.columns.createdAt}:</span>
                  <span className="ml-1 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-neutral-400">{t.rfqList.columns.itemsCount}:</span>
                  <span className="ml-1 font-medium">{r.items.length}</span>
                </div>
                {r.expiresAt && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">{t.rfqList.columns.expiresAt}:</span>
                    <span className="ml-1 font-medium">{new Date(r.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-3 border-t border-neutral-100 pt-3">
                <Link to={`/buyer/requests/${r.id}`} className="text-accent font-medium text-sm hover:underline">{t.rfqList.actions.open}</Link>
                <button type="button" onClick={() => handleExport(r.id, 'pdf')} className="text-neutral-500 text-sm hover:underline">PDF</button>
                <button type="button" onClick={() => handleExport(r.id, 'xlsx')} className="text-neutral-500 text-sm hover:underline">Excel</button>
                <button type="button" onClick={() => handleDelete(r.id)} className="text-red-500 text-sm hover:underline ml-auto">{t.delete}</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
