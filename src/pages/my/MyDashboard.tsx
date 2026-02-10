import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IconSettings, IconActivity, IconUpload, IconFileText, IconUser } from '../../components/CabinetIcons'
import { useInventory } from '../../store/inventoryStore'
import { useBuyer } from '../../store/buyerStore'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(n: number) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const CONDITION_LABELS: Record<string, string> = { NEW: 'Новые', USED: 'Б/У', REFURBISHED: 'Восстановл.', FOR_PARTS: 'На запчасти' }
const CONDITION_COLORS: Record<string, string> = { NEW: 'bg-emerald-500', USED: 'bg-blue-500', REFURBISHED: 'bg-amber-500', FOR_PARTS: 'bg-neutral-400' }

export default function MyDashboard() {
  const { items, lastUpdated, getAvailable, batches } = useInventory()
  const { rfqs, users } = useBuyer()
  const available = getAvailable()

  const stats = useMemo(() => {
    const availableCount = available.length
    const totalCount = items.length
    const totalValue = available.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0)

    const brands = new Set(available.map((i) => i.brand).filter(Boolean))
    const categories = new Set(available.map((i) => i.category).filter(Boolean))

    const rfqDraft = rfqs.filter((r) => r.status === 'DRAFT').length
    const rfqSent = rfqs.filter((r) => r.status === 'SENT').length
    const rfqReview = rfqs.filter((r) => r.status === 'UNDER_REVIEW').length
    const rfqQuoted = rfqs.filter((r) => r.status === 'QUOTED').length
    const rfqApproved = rfqs.filter((r) => r.status === 'APPROVED_BY_BUYER').length
    const rfqTotal = rfqs.length
    const rfqPending = rfqSent + rfqReview

    const buyerUsers = users.length
    const activeBatches = batches.length

    return {
      availableCount, totalCount, totalValue, brands: brands.size, categories: categories.size,
      rfqDraft, rfqSent, rfqReview, rfqQuoted, rfqApproved, rfqTotal, rfqPending, buyerUsers, activeBatches,
    }
  }, [available, items, rfqs, users, batches])

  /* Category + brand + condition distributions */
  const { topBrands, topCategories, conditionBreakdown } = useMemo(() => {
    const brandMap: Record<string, number> = {}
    const catMap: Record<string, number> = {}
    const condMap: Record<string, number> = {}

    for (const it of available) {
      const b = it.brand || 'N/A'
      brandMap[b] = (brandMap[b] || 0) + 1
      const c = it.category || 'N/A'
      catMap[c] = (catMap[c] || 0) + 1
      const cond = it.condition || 'USED'
      condMap[cond] = (condMap[cond] || 0) + 1
    }

    const topBrands = Object.entries(brandMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const conditionBreakdown = Object.entries(condMap).sort((a, b) => b[1] - a[1])

    return { topBrands, topCategories, conditionBreakdown }
  }, [available])

  /* Recent RFQs */
  const recentRfqs = useMemo(() =>
    [...rfqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [rfqs]
  )

  const maxBrand = topBrands[0]?.[1] || 1

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-primary">Дашборд</h2>
          <p className="mt-1 text-neutral-600 text-xs sm:text-sm">
            Сводка по витрине, заявкам и управлению.
          </p>
        </div>
        {lastUpdated && (
          <span className="text-[10px] sm:text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 sm:px-3 py-1 shrink-0">
            {formatDate(lastUpdated)}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard
          label="На витрине"
          value={stats.availableCount}
          sub={`из ${stats.totalCount} позиций`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          accent
        />
        <KpiCard
          label="Стоимость"
          value={`€${formatCurrency(stats.totalValue)}`}
          sub={`${stats.brands} бренд. · ${stats.categories} кат.`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Заявки"
          value={stats.rfqTotal}
          sub={stats.rfqPending > 0 ? `${stats.rfqPending} ожидают` : 'все обработаны'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          accent={stats.rfqPending > 0}
        />
        <KpiCard
          label="Покупатели"
          value={stats.buyerUsers}
          sub={`${stats.activeBatches} партий`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
      </div>

      {/* RFQ funnel */}
      {stats.rfqTotal > 0 && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-neutral-700">Воронка заявок</h3>
            <Link to="/my/rfqs" className="text-xs text-accent hover:underline">Все запросы &rarr;</Link>
          </div>
          <div className="flex gap-1.5 h-3 rounded-full overflow-hidden bg-neutral-200">
            {stats.rfqDraft > 0 && <div className="bg-neutral-400 transition-all" style={{ width: `${(stats.rfqDraft / stats.rfqTotal) * 100}%` }} title={`Черновики: ${stats.rfqDraft}`} />}
            {stats.rfqSent > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(stats.rfqSent / stats.rfqTotal) * 100}%` }} title={`Отправлены: ${stats.rfqSent}`} />}
            {stats.rfqReview > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(stats.rfqReview / stats.rfqTotal) * 100}%` }} title={`На рассмотрении: ${stats.rfqReview}`} />}
            {stats.rfqQuoted > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(stats.rfqQuoted / stats.rfqTotal) * 100}%` }} title={`Предложения: ${stats.rfqQuoted}`} />}
            {stats.rfqApproved > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.rfqApproved / stats.rfqTotal) * 100}%` }} title={`Утверждены: ${stats.rfqApproved}`} />}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <FunnelLabel color="bg-neutral-400" label="Черновики" count={stats.rfqDraft} />
            <FunnelLabel color="bg-blue-500" label="Отправлены" count={stats.rfqSent} />
            <FunnelLabel color="bg-amber-500" label="На рассмотрении" count={stats.rfqReview} />
            <FunnelLabel color="bg-green-500" label="Предложения" count={stats.rfqQuoted} />
            <FunnelLabel color="bg-emerald-500" label="Утверждены" count={stats.rfqApproved} />
          </div>
        </div>
      )}

      {/* Alert for pending */}
      {stats.rfqPending > 0 && (
        <Link to="/my/rfqs" className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700 text-lg font-bold">!</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">{stats.rfqPending} заявок ожидают обработки</p>
            <p className="text-xs text-amber-600 mt-0.5">Нажмите, чтобы перейти к управлению запросами</p>
          </div>
        </Link>
      )}

      {/* Charts: Brands + Categories + Condition side by side */}
      {available.length > 0 && (
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Top brands bar chart */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Топ бренды</h3>
            <div className="space-y-2.5">
              {topBrands.map(([brand, count]) => (
                <div key={brand}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-700 font-medium truncate mr-2">{brand}</span>
                    <span className="text-neutral-400 shrink-0">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent/70 transition-all"
                      style={{ width: `${(count / maxBrand) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topBrands.length === 0 && <p className="text-xs text-neutral-400">Нет данных</p>}
            </div>
          </div>

          {/* Categories */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Категории</h3>
            <div className="space-y-2.5">
              {topCategories.map(([cat, count]) => {
                const pct = available.length > 0 ? Math.round((count / available.length) * 100) : 0
                return (
                  <div key={cat} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-neutral-700 font-medium truncate">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-neutral-400 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
              {topCategories.length === 0 && <p className="text-xs text-neutral-400">Нет данных</p>}
            </div>
          </div>

          {/* Condition breakdown */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Состояние товаров</h3>
            {conditionBreakdown.length > 0 ? (
              <>
                <div className="flex h-4 rounded-full overflow-hidden bg-neutral-100 mb-4">
                  {conditionBreakdown.map(([cond, count]) => (
                    <div
                      key={cond}
                      className={`${CONDITION_COLORS[cond] || 'bg-neutral-300'} transition-all`}
                      style={{ width: `${(count / available.length) * 100}%` }}
                      title={`${CONDITION_LABELS[cond] || cond}: ${count}`}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {conditionBreakdown.map(([cond, count]) => (
                    <div key={cond} className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-neutral-600">
                        <span className={`w-2.5 h-2.5 rounded-full ${CONDITION_COLORS[cond] || 'bg-neutral-300'}`} />
                        {CONDITION_LABELS[cond] || cond}
                      </span>
                      <span className="text-neutral-500">{count} ({Math.round((count / available.length) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-neutral-400">Нет данных</p>
            )}
          </div>
        </div>
      )}

      {/* Recent RFQs preview */}
      {recentRfqs.length > 0 && (
        <div className="mt-4 sm:mt-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-700">Последние заявки</h3>
            <Link to="/my/rfqs" className="text-xs text-accent hover:underline">Все &rarr;</Link>
          </div>
          <div className="space-y-2">
            {recentRfqs.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:bg-neutral-50 transition-colors">
                <RfqStatusDot status={r.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 font-medium truncate">{r.title}</p>
                  <p className="text-xs text-neutral-400">{r.items.length} поз. · {new Date(r.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
                <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RFQ_STATUS_STYLES[r.status] || 'bg-neutral-100 text-neutral-600'}`}>
                  {RFQ_STATUS_SHORT[r.status] || r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 border-t border-neutral-200 pt-6">
        <h3 className="text-base font-semibold text-primary">Быстрые действия</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction to="/my/inventory" icon={<IconUpload />} color="accent" title="Прайс и остатки" desc="Импорт Excel/CSV, маппинг колонок" />
          <QuickAction to="/my/rfqs" icon={<IconFileText />} color="accent" title="Заявки" desc={stats.rfqPending > 0 ? `${stats.rfqPending} ожидают обработки` : 'Управление запросами'} />
          <QuickAction to="/my/users" icon={<IconUser />} color="neutral" title="Пользователи" desc={`${stats.buyerUsers} покупателей`} />
          <QuickAction to="/my/activity" icon={<IconActivity />} color="neutral" title="Активность" desc="Журнал действий и изменений" />
          <QuickAction to="/my/settings" icon={<IconSettings />} color="neutral" title="Настройки" desc="Профиль, уведомления" />
        </div>
      </div>
    </>
  )
}

/* ─────── Sub components ─────── */

const RFQ_STATUS_SHORT: Record<string, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  UNDER_REVIEW: 'В работе',
  QUOTED: 'Предложение',
  APPROVED_BY_BUYER: 'Утверждён',
  REJECTED_BY_BUYER: 'Отклонён',
  CLOSED: 'Закрыт',
  CANCELLED: 'Отменён',
}

const RFQ_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  SENT: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  QUOTED: 'bg-green-100 text-green-700',
  APPROVED_BY_BUYER: 'bg-emerald-100 text-emerald-700',
  REJECTED_BY_BUYER: 'bg-red-100 text-red-700',
  CLOSED: 'bg-neutral-100 text-neutral-500',
  CANCELLED: 'bg-neutral-100 text-neutral-400',
}

const RFQ_DOT_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-400',
  SENT: 'bg-blue-500',
  UNDER_REVIEW: 'bg-amber-500',
  QUOTED: 'bg-green-500',
  APPROVED_BY_BUYER: 'bg-emerald-500',
  REJECTED_BY_BUYER: 'bg-red-500',
  CLOSED: 'bg-neutral-400',
  CANCELLED: 'bg-neutral-300',
}

function RfqStatusDot({ status }: { status: string }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 ${RFQ_DOT_COLORS[status] || 'bg-neutral-300'}`} />
}

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 md:p-5 ${accent ? 'border-accent/30 bg-accent/5' : 'border-neutral-200 bg-neutral-50'}`}>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <p className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
        <span className={`hidden sm:block ${accent ? 'text-accent/60' : 'text-neutral-300'}`}>{icon}</span>
      </div>
      <p className={`text-lg sm:text-xl md:text-2xl font-bold ${accent ? 'text-accent' : 'text-primary'}`}>{value}</p>
      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-neutral-400 truncate">{sub}</p>
    </div>
  )
}

function FunnelLabel({ color, label, count }: { color: string; label: string; count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-neutral-600">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label}: {count}
    </span>
  )
}

function QuickAction({ to, icon, color, title, desc }: { to: string; icon: React.ReactNode; color: 'accent' | 'neutral'; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className={`flex items-start gap-3 rounded-xl border p-4 hover:shadow-md transition-all ${
        color === 'accent' ? 'border-accent/20 hover:border-accent/40 bg-white' : 'border-neutral-200 hover:border-neutral-300 bg-white'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        color === 'accent' ? 'bg-accent/10 text-accent' : 'bg-neutral-100 text-neutral-600'
      }`}>
        {icon}
      </span>
      <div className="min-w-0">
        <span className="font-medium text-sm text-primary">{title}</span>
        <p className="mt-0.5 text-xs text-neutral-500 truncate">{desc}</p>
      </div>
    </Link>
  )
}
