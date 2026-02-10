import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

export default function BuyerRequestCard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useBuyerLocale()
  const buyer = useBuyer()
  const rfq = id ? buyer.getRfqById(id) : undefined
  const history = id ? buyer.getRfqStatusHistory(id) : []
  const messages = id ? buyer.getRfqMessages(id) : []

  const statusLabels: Record<RfqStatus, string> = t.rfqDetail.statuses as Record<RfqStatus, string>

  const [title, setTitle] = useState(rfq?.title ?? '')
  const [comment, setComment] = useState(rfq?.comment ?? '')
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState(rfq?.desiredDeliveryDate ?? '')
  const [newMessage, setNewMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (rfq) {
      setTitle(rfq.title)
      setComment(rfq.comment ?? '')
      setDesiredDeliveryDate(rfq.desiredDeliveryDate ?? '')
    }
  }, [rfq?.id, rfq?.title, rfq?.comment, rfq?.desiredDeliveryDate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!id || !rfq) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-neutral-600">{t.rfqDetail.notFound}</p>
        <Link to="/buyer/requests" className="btn-primary mt-4 inline-flex">
          {t.rfqDetail.goToList}
        </Link>
      </div>
    )
  }

  const isDraft = rfq.status === 'DRAFT'
  const canSend = isDraft && rfq.items.length > 0
  const canApproveReject = rfq.status === 'QUOTED'
  const canCancel = !['CLOSED', 'CANCELLED'].includes(rfq.status)

  const handleSaveDraft = () => {
    if (!isDraft) return
    buyer.updateRfq(id, { title, comment, desiredDeliveryDate: desiredDeliveryDate || null })
  }

  const handleSend = () => {
    if (!canSend) return
    if (!window.confirm(t.rfqDetail.confirmSend)) return
    buyer.sendRfq(id)
  }

  const handleApprove = () => {
    if (!canApproveReject) return
    if (!window.confirm(t.rfqDetail.confirmApprove)) return
    buyer.approveRfq(id)
  }

  const handleReject = () => {
    if (!canApproveReject) return
    if (!window.confirm(t.rfqDetail.confirmReject)) return
    buyer.rejectRfq(id)
  }

  const handleCancel = () => {
    if (!canCancel) return
    if (!window.confirm(t.rfqDetail.confirmCancel)) return
    buyer.cancelRfq(id)
  }

  const handleDelete = () => {
    buyer.deleteRfq(id)
    navigate('/buyer/requests')
  }

  const handleRemoveItem = (itemId: string) => {
    buyer.removeRfqItem(id, itemId)
  }

  const handleDuplicate = () => {
    const newRfq = buyer.duplicateRfq(id)
    navigate(`/buyer/requests/${newRfq.id}`)
  }

  const handleExport = (format: 'pdf' | 'xlsx') => {
    import('../../auth/session').then(({ exportRfq }) => exportRfq(id, format))
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    buyer.addRfqMessage(id, newMessage.trim())
    setNewMessage('')
  }

  const quoteByItemId = new Map(rfq.quoteItems?.map((q) => [q.rfqItemId, q]) ?? [])

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          {isDraft ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold text-primary border border-neutral-300 rounded-lg px-3 py-1.5 w-full max-w-md"
              placeholder={t.rfqDetail.requestTitlePlaceholder}
            />
          ) : (
            <h2 className="text-lg font-semibold text-primary">{rfq.title}</h2>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RFQ_STATUS_STYLES[rfq.status]}`}>
              {statusLabels[rfq.status]}
            </span>
            {rfq.expiresAt && (
              <span className="text-sm text-neutral-500">{t.rfqDetail.expiresLabel}: {new Date(rfq.expiresAt).toLocaleDateString()}</span>
            )}
            <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-sm text-accent hover:underline">
              {showHistory ? t.rfqDetail.hideHistory : t.rfqDetail.statusHistory}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <button type="button" onClick={handleSaveDraft} className="btn-secondary text-sm py-2 px-3">{t.rfqDetail.actions.saveDraft}</button>
              <button type="button" onClick={handleSend} disabled={!canSend} className="btn-primary text-sm py-2 px-3">{t.rfqDetail.actions.send}</button>
            </>
          )}
          {canApproveReject && (
            <>
              <button type="button" onClick={handleApprove} className="btn-primary text-sm py-2 px-3">{t.rfqDetail.actions.approve}</button>
              <button type="button" onClick={handleReject} className="btn-secondary text-sm py-2 px-3 border-red-200 text-red-700">{t.rfqDetail.actions.reject}</button>
            </>
          )}
          {canCancel && !isDraft && !canApproveReject && (
            <button type="button" onClick={handleCancel} className="btn-secondary text-sm py-2 px-3">{t.rfqDetail.actions.cancel}</button>
          )}
          <button type="button" onClick={handleDuplicate} className="btn-secondary text-sm py-2 px-3">{t.rfqDetail.actions.duplicate}</button>
          <button type="button" onClick={() => handleExport('pdf')} className="btn-secondary text-sm py-2 px-3">{t.rfqDetail.exportPdf}</button>
          <button type="button" onClick={() => handleExport('xlsx')} className="btn-secondary text-sm py-2 px-3">{t.rfqDetail.exportExcel}</button>
          <Link to="/buyer/requests" className="btn-secondary text-sm py-2 px-3">{t.rfqDetail.goToList}</Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-secondary text-sm py-2 px-3 border-red-200 text-red-600 hover:bg-red-50"
          >
            {t.delete}
          </button>
        </div>
      </div>

      {/* Status history */}
      {showHistory && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">{t.rfqDetail.statusHistory}</h3>
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex gap-2">
                <span className="text-neutral-500 shrink-0">{new Date(h.changedAt).toLocaleString()}</span>
                <span className={`rounded px-1.5 py-0.5 ${RFQ_STATUS_STYLES[h.status]}`}>{statusLabels[h.status]}</span>
                {h.comment && <span className="text-neutral-600">— {h.comment}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-4">
          <p className="text-sm font-medium text-red-800">
            {(t.rfqDetail as Record<string, unknown>).confirmDelete as string ?? 'Delete this RFQ? This action cannot be undone.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {t.delete}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Common fields */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">{t.rfqDetail.fields.desiredDeliveryDate}</span>
          {isDraft ? (
            <input type="date" value={desiredDeliveryDate} onChange={(e) => setDesiredDeliveryDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          ) : (
            <p className="mt-1 text-neutral-800">{rfq.desiredDeliveryDate ? new Date(rfq.desiredDeliveryDate).toLocaleDateString() : '—'}</p>
          )}
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">{t.rfqDetail.fields.comment}</span>
          {isDraft ? (
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder={t.rfqDetail.commentPlaceholder} />
          ) : (
            <p className="mt-1 text-neutral-800 whitespace-pre-wrap">{rfq.comment || '—'}</p>
          )}
        </label>
      </div>

      {/* Items table */}
      <h3 className="mt-8 text-sm font-semibold text-neutral-800">
        {t.rfqDetail.items.title}
        {rfq.items.length > 0 && <span className="ml-1.5 text-neutral-500 font-normal">({rfq.items.length})</span>}
      </h3>
      {rfq.items.length === 0 ? (
        <div className="mt-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="text-sm text-neutral-500">{t.rfqDetail.addFromStockHint}</p>
          <Link to="/buyer" className="btn-primary mt-3 inline-flex text-sm">{t.empty.goToStock}</Link>
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqDetail.items.columns.description} / {t.rfqDetail.items.columns.sku}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqDetail.items.columns.quantity}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqDetail.items.columns.targetPrice}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqDetail.items.columns.offeredPrice}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqDetail.items.columns.minOrderQty}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqDetail.items.columns.availableQty}</th>
                {isDraft && <th className="px-4 py-3 w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {rfq.items.map((item, idx) => {
                const quote = quoteByItemId.get(item.id)
                const currSymbol = ({ EUR: '€', UAH: 'грн', USD: '$', RUB: '₽', PLN: 'zł', RON: 'lei', GBP: '£' } as Record<string, string>)[item.currency] ?? item.currency
                return (
                  <tr key={item.id} className={`border-b border-neutral-100 last:border-0 ${idx % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                    <td className="px-4 py-3 text-neutral-800 max-w-[280px]">
                      <span className="block truncate" title={item.description}>{item.description}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {isDraft ? (
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (v > 0) buyer.updateRfqItem(id, item.id, { quantity: v })
                          }}
                          className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {isDraft ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.targetPrice ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              const n = v === '' ? null : parseFloat(v)
                              buyer.updateRfqItem(id, item.id, { targetPrice: n != null && !Number.isNaN(n) ? n : null })
                            }}
                            placeholder="—"
                            className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                          <span className="text-xs text-neutral-400">{currSymbol}</span>
                        </div>
                      ) : (
                        item.targetPrice != null ? `${item.targetPrice.toLocaleString()} ${currSymbol}` : '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {quote ? `${quote.offeredPrice.toLocaleString()} ${({ EUR: '€', UAH: 'грн', USD: '$', RUB: '₽', PLN: 'zł', RON: 'lei', GBP: '£' } as Record<string, string>)[quote.currency] ?? quote.currency}` : '—'}
                    </td>
                    <td className="px-4 py-3">{quote?.minOrderQty ?? '—'}</td>
                    <td className="px-4 py-3">{quote?.availableQty ?? '—'}</td>
                    {isDraft && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-xs hover:underline"
                          title={t.delete}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Chat */}
      <h3 className="mt-8 text-sm font-semibold text-neutral-800">{t.chat.title}</h3>
      <div className="mt-2 rounded-xl border border-neutral-200 flex flex-col max-h-80">
        <div className="overflow-y-auto p-3 space-y-2 flex-1">
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-500">{t.chat.empty}</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.authorType === 'BUYER' ? 'bg-primary/10 ml-4' : m.authorType === 'SELLER' ? 'bg-neutral-100 mr-4' : 'bg-neutral-50 mx-4'
                }`}
              >
                <span className="text-xs text-neutral-500">
                  {m.authorType === 'BUYER' ? t.chat.authorBuyer : m.authorType === 'SELLER' ? t.chat.authorSeller : t.chat.system} · {new Date(m.createdAt).toLocaleString()}
                </span>
                <p className="mt-0.5 text-neutral-800">{m.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-neutral-200 p-2 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={t.chat.inputPlaceholder}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={sendMessage} className="btn-primary text-sm py-2 px-4">{t.chat.send}</button>
        </div>
      </div>
    </>
  )
}
