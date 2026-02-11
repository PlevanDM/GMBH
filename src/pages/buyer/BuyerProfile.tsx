import { useState } from 'react'
import { useBuyer } from '../../store/buyerStore'
import { useBuyerLocale } from '../../i18n/BuyerLocaleContext'
import type { BuyerCompany, BuyerUserRole, NotificationChannel } from '../../types/buyer'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function BuyerProfile() {
  const { t, locale } = useBuyerLocale()
  const { company, users, notificationSettings, updateCompany, updateNotificationSettings, addUser, updateUser, deleteUser } = useBuyer()

  const roleLabels: Record<BuyerUserRole, string> = {
    OWNER: t.profile.users.roles.OWNER,
    BUYER: t.profile.users.roles.BUYER,
    FINANCE: t.profile.users.roles.FINANCE,
  }

  const [form, setForm] = useState<Partial<BuyerCompany>>({
    name: company.name,
    legalName: company.legalName ?? '',
    vatNumber: company.vatNumber ?? '',
    registrationNumber: company.registrationNumber ?? '',
    legalAddress: company.legalAddress ?? '',
    billingAddress: company.billingAddress ?? '',
    logisticsContact: company.logisticsContact ?? '',
    logisticsPhone: company.logisticsPhone ?? '',
    billingEmail: company.billingEmail ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<BuyerUserRole>('BUYER')
  const [error, setError] = useState<string | null>(null)
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

  const handleSaveCompany = () => {
    updateCompany({
      name: form.name ?? company.name,
      legalName: form.legalName || null,
      vatNumber: form.vatNumber || null,
      registrationNumber: form.registrationNumber || null,
      legalAddress: form.legalAddress || null,
      billingAddress: form.billingAddress || null,
      logisticsContact: form.logisticsContact || null,
      logisticsPhone: form.logisticsPhone || null,
      billingEmail: form.billingEmail || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleInvite = () => {
    setError(null)
    const email = inviteEmail.trim()
    if (!email) {
      setError(t.errors.required)
      return
    }
    if (!email.includes('@')) {
      setError(t.errors.invalidEmail)
      return
    }

    addUser({
      email: inviteEmail.trim(),
      fullName: inviteName.trim() || inviteEmail.trim(),
      phone: null,
      role: inviteRole,
      isActive: true,
    })
    setInviteEmail('')
    setInviteName('')
    setInviteRole('BUYER')
    setInviteOpen(false)
  }

  const handleDeleteUser = (id: string, email: string) => {
    setConfirmState({
      isOpen: true,
      title: t.delete,
      message: `${t.profile.users.removeUser}: ${email}?`,
      onConfirm: () => {
        deleteUser(id)
        closeConfirm()
      }
    })
  }

  return (
    <>
      <h2 className="text-base sm:text-lg font-semibold text-primary">{t.profile.title}</h2>
      <p className="mt-2 text-neutral-600 text-sm sm:text-base leading-relaxed">
        {t.profile.company.title}, {t.profile.users.title.toLowerCase()}, {t.profile.notifications.title.toLowerCase()}.
      </p>

      {/* 1. Company details */}
      <section className="mt-6 sm:mt-8">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-800 border-b border-neutral-200 pb-2">{t.profile.company.title}</h3>
        <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.name}</span>
            <input type="text" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.legalName}</span>
            <input type="text" value={form.legalName ?? ''} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.vatNumber}</span>
            <input type="text" value={form.vatNumber ?? ''} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.legalAddress}</span>
            <input type="text" value={form.legalAddress ?? ''} onChange={(e) => setForm((f) => ({ ...f, legalAddress: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.billingAddress}</span>
            <input type="text" value={form.billingAddress ?? ''} onChange={(e) => setForm((f) => ({ ...f, billingAddress: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.billingEmail}</span>
            <input type="email" value={form.billingEmail ?? ''} onChange={(e) => setForm((f) => ({ ...f, billingEmail: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.logisticsContact}</span>
            <input type="text" value={form.logisticsContact ?? ''} onChange={(e) => setForm((f) => ({ ...f, logisticsContact: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t.profile.company.logisticsPhone}</span>
            <input type="text" value={form.logisticsPhone ?? ''} onChange={(e) => setForm((f) => ({ ...f, logisticsPhone: e.target.value }))} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={handleSaveCompany} className="btn-primary text-sm py-2.5 sm:py-2 px-5 sm:px-4 min-h-[44px] sm:min-h-0 w-full sm:w-auto">{t.save}</button>
          {saved && <span className="text-sm text-green-600">✓</span>}
        </div>
      </section>

      {/* 2. Users */}
      <section className="mt-8 sm:mt-10">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-800 border-b border-neutral-200 pb-2">{t.profile.users.title}</h3>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => setInviteOpen(true)} className="btn-secondary text-sm py-2 px-4 min-h-[44px] sm:min-h-0">{t.profile.users.inviteUser}</button>
        </div>

        {/* Desktop: table */}
        <div className="mt-2 hidden sm:block overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.profile.users.table.email} / {t.profile.users.table.name}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.profile.users.table.role}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.profile.users.table.status}</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">{t.rfqList.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-800">{u.email}</span>
                    <span className="text-neutral-500 block text-xs">{u.fullName}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{roleLabels[u.role]}</td>
                  <td className="px-4 py-3">
                    <span className={u.isActive ? 'text-green-600' : 'text-neutral-500'}>
                      {u.isActive ? t.profile.users.statusValues.active : t.profile.users.statusValues.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => updateUser(u.id, { isActive: !u.isActive })} className="text-accent hover:underline text-sm mr-2">
                      {u.isActive ? t.profile.users.deactivateUser : t.profile.users.editUser}
                    </button>
                    {users.length > 1 && (
                      <button type="button" onClick={() => handleDeleteUser(u.id, u.email)} className="text-red-600 hover:underline text-sm">{t.delete}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: card view */}
        <div className="mt-2 sm:hidden space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-neutral-800 text-sm break-all">{u.email}</span>
                  <span className="text-neutral-500 block text-xs mt-0.5">{u.fullName}</span>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {u.isActive ? t.profile.users.statusValues.active : t.profile.users.statusValues.inactive}
                </span>
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                {t.profile.users.table.role}: <span className="font-medium text-neutral-700">{roleLabels[u.role]}</span>
              </div>
              <div className="mt-3 flex gap-3 border-t border-neutral-100 pt-3">
                <button type="button" onClick={() => updateUser(u.id, { isActive: !u.isActive })} className="text-accent font-medium text-sm hover:underline">
                  {u.isActive ? t.profile.users.deactivateUser : t.profile.users.editUser}
                </button>
                {users.length > 1 && (
                  <button type="button" onClick={() => handleDeleteUser(u.id, u.email)} className="text-red-600 text-sm hover:underline">{t.delete}</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {inviteOpen && (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:max-w-md">
            <h4 className="text-sm font-semibold text-neutral-800">{t.profile.users.inviteUser}</h4>
            <label className="mt-3 block">
              <span className="text-sm text-neutral-700">Email</span>
              <input type="email" value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); setError(null) }} className={`mt-1 block w-full rounded-lg border ${error ? 'border-red-500' : 'border-neutral-300'} px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0`} />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </label>
            <label className="mt-2 block">
              <span className="text-sm text-neutral-700">{t.profile.users.table.name}</span>
              <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0" />
            </label>
            <label className="mt-2 block">
              <span className="text-sm text-neutral-700">{t.profile.users.table.role}</span>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as BuyerUserRole)} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 sm:py-2 text-[16px] sm:text-sm min-h-[44px] sm:min-h-0">
                {(Object.keys(roleLabels) as BuyerUserRole[]).map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </label>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={handleInvite} className="btn-primary text-sm py-2.5 sm:py-2 px-4 min-h-[44px] sm:min-h-0 w-full sm:w-auto">{t.create}</button>
              <button type="button" onClick={() => setInviteOpen(false)} className="btn-secondary text-sm py-2.5 sm:py-2 px-4 min-h-[44px] sm:min-h-0 w-full sm:w-auto">{t.cancel}</button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Notifications */}
      <section className="mt-8 sm:mt-10">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-800 border-b border-neutral-200 pb-2">{t.profile.notifications.title}</h3>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 min-h-[44px] sm:min-h-0 cursor-pointer">
            <input type="checkbox" checked={notificationSettings.notifyOnNewStock} onChange={(e) => updateNotificationSettings({ notifyOnNewStock: e.target.checked })} className="rounded border-neutral-400 w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-sm text-neutral-700">{t.profile.notifications.newStock}</span>
          </label>
          <label className="flex items-center gap-3 min-h-[44px] sm:min-h-0 cursor-pointer">
            <input type="checkbox" checked={notificationSettings.notifyOnRequestStatusChange} onChange={(e) => updateNotificationSettings({ notifyOnRequestStatusChange: e.target.checked })} className="rounded border-neutral-400 w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-sm text-neutral-700">{t.profile.notifications.requestStatusChange}</span>
          </label>
          <label className="flex items-center gap-3 min-h-[44px] sm:min-h-0 cursor-pointer">
            <input type="checkbox" checked={notificationSettings.notifyOnQuoteExpiring} onChange={(e) => updateNotificationSettings({ notifyOnQuoteExpiring: e.target.checked })} className="rounded border-neutral-400 w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-sm text-neutral-700">{t.profile.notifications.quoteExpiring}</span>
          </label>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
          <span className="text-sm font-medium text-neutral-700">{t.profile.notifications.channels}: </span>
          <div className="flex gap-4 sm:ml-2">
            <label className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-0 cursor-pointer">
              <input type="checkbox" checked={notificationSettings.channels.includes('EMAIL')} onChange={(e) => { const ch: NotificationChannel[] = e.target.checked ? [...notificationSettings.channels, 'EMAIL'] : notificationSettings.channels.filter((c) => c !== 'EMAIL'); updateNotificationSettings({ channels: ch }) }} className="rounded border-neutral-400 w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-sm">{t.profile.notifications.email}</span>
            </label>
            <label className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-0 cursor-pointer">
              <input type="checkbox" checked={notificationSettings.channels.includes('TELEGRAM')} onChange={(e) => { const ch: NotificationChannel[] = e.target.checked ? [...notificationSettings.channels, 'TELEGRAM'] : notificationSettings.channels.filter((c) => c !== 'TELEGRAM'); updateNotificationSettings({ channels: ch }) }} className="rounded border-neutral-400 w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-sm">{t.profile.notifications.telegram}</span>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Finance */}
      <section className="mt-8 sm:mt-10">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-800 border-b border-neutral-200 pb-2">{t.profile.finance.title}</h3>
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 sm:max-w-md">
          <div className="flex justify-between text-sm gap-2">
            <span className="text-neutral-600">{t.profile.finance.creditLimit}</span>
            <span className="font-medium text-neutral-800 shrink-0">{company.creditLimit != null ? company.creditLimit.toLocaleString(locale, { style: 'currency', currency: 'EUR' }) : '—'}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm gap-2">
            <span className="text-neutral-600">{t.profile.finance.creditUsed}</span>
            <span className="font-medium text-neutral-800 shrink-0">{company.currentCreditUsed != null ? company.currentCreditUsed.toLocaleString(locale, { style: 'currency', currency: 'EUR' }) : '—'}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm gap-2">
            <span className="text-neutral-600">{t.profile.finance.paymentTerms}</span>
            <span className="text-neutral-800 shrink-0">{company.paymentTerms ?? '—'}</span>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
        confirmLabel={t.yes}
        cancelLabel={t.no}
        isDestructive
      />
    </>
  )
}
