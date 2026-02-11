import { useState, useCallback } from 'react'
import { IconSettings } from '../../components/CabinetIcons'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'
import { storageAdapter } from '../../api/storageAdapter'
import ConfirmDialog from '../../components/ConfirmDialog'

type MyProfileData = {
  companyName: string
  phone: string
  contactName: string
  email: string
  website: string
  currency: string
  timezone: string
}

type MyNotificationsData = {
  rfqCreated: boolean
  rfqUpdated: boolean
  messages: boolean
  emailDigest: 'off' | 'daily' | 'weekly'
}

const PROFILE_KEY = 'restart-my-profile'
const NOTIF_KEY = 'restart-my-notifications'

const defaultProfile: MyProfileData = {
  companyName: '', phone: '', contactName: '', email: '', website: '', currency: 'EUR', timezone: 'Europe/Berlin',
}
const defaultNotifications: MyNotificationsData = { rfqCreated: true, rfqUpdated: true, messages: true, emailDigest: 'daily' }

export default function MySettings() {
  const { t } = useSellerLocale()
  const [profile, setProfile] = useState<MyProfileData>(() => storageAdapter.getItem(PROFILE_KEY, defaultProfile))
  const [notifications, setNotifications] = useState<MyNotificationsData>(() => storageAdapter.getItem(NOTIF_KEY, defaultNotifications))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const showSaved = useCallback(() => {
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [])

  const saveProfile = () => {
    storageAdapter.setItem(PROFILE_KEY, profile)
    showSaved()
  }

  const saveNotifications = () => {
    storageAdapter.setItem(NOTIF_KEY, notifications)
    showSaved()
  }

  const handleClearData = () => {
    const keysToRemove = [
      'restart-inventory', 'restart-inventory-meta', 'restart-inventory-batches',
      'restart-my-profile', 'restart-my-notifications', 'restart-my-buyer-users',
    ]
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
        <IconSettings className="shrink-0" /> {t.settings.title}
      </h2>
      <p className="mt-2 text-neutral-600 leading-relaxed">
        {t.settings.subtitle}
      </p>

      {saveStatus === 'saved' && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 font-medium">
          ✓ {t.settings.saved}
        </div>
      )}

      {/* Profile */}
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-base font-semibold text-primary">{t.settings.profile}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t.settings.profileDesc}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm text-neutral-600">{t.settings.company}</span>
            <input value={profile.companyName} onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))} placeholder={t.settings.company} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">{t.settings.contactPerson}</span>
            <input value={profile.contactName} onChange={(e) => setProfile((p) => ({ ...p, contactName: e.target.value }))} placeholder={t.settings.contactPerson} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">{t.settings.email}</span>
            <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="admin@company.com" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">{t.settings.phone}</span>
            <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+49 ..." className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">{t.settings.website}</span>
            <input value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} placeholder="https://company.com" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">{t.settings.currency}</span>
            <select value={profile.currency} onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="UAH">UAH (₴)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">{t.settings.timezone}</span>
            <select value={profile.timezone} onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Europe/Kiev">Europe/Kyiv (EET)</option>
              <option value="Europe/Warsaw">Europe/Warsaw (CET)</option>
              <option value="Europe/Bucharest">Europe/Bucharest (EET)</option>
              <option value="Europe/Madrid">Europe/Madrid (CET)</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={saveProfile} className="btn-primary mt-4 py-2.5 px-4 rounded-lg text-sm">
          {t.settings.saveProfile}
        </button>
      </section>

      {/* Notifications */}
      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-base font-semibold text-primary">{t.settings.notifications}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t.settings.notifDesc}</p>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notifications.rfqCreated} onChange={(e) => setNotifications((n) => ({ ...n, rfqCreated: e.target.checked }))} className="h-4 w-4 rounded border-neutral-300" />
            <span className="text-sm text-neutral-700">{t.settings.emailOnRfq}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notifications.rfqUpdated} onChange={(e) => setNotifications((n) => ({ ...n, rfqUpdated: e.target.checked }))} className="h-4 w-4 rounded border-neutral-300" />
            <span className="text-sm text-neutral-700">{t.settings.reminders}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notifications.messages} onChange={(e) => setNotifications((n) => ({ ...n, messages: e.target.checked }))} className="h-4 w-4 rounded border-neutral-300" />
            <span className="text-sm text-neutral-700">{t.settings.chatMessages}</span>
          </label>
          <label className="block mt-4">
            <span className="text-sm text-neutral-600">{t.settings.emailDigest}</span>
            <select value={notifications.emailDigest} onChange={(e) => setNotifications((n) => ({ ...n, emailDigest: e.target.value as 'off' | 'daily' | 'weekly' }))} className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
              <option value="off">{t.settings.digestOff}</option>
              <option value="daily">{t.settings.digestDaily}</option>
              <option value="weekly">{t.settings.digestWeekly}</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={saveNotifications} className="btn-primary mt-4 py-2.5 px-4 rounded-lg text-sm">
          {t.settings.saveNotif}
        </button>
      </section>

      {/* Danger zone */}
      <section className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-base font-semibold text-red-700">{t.settings.dangerZone}</h3>
        <p className="mt-1 text-sm text-neutral-600">{t.settings.dangerDesc}</p>
        <button type="button" onClick={() => setShowClearConfirm(true)} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">
          {t.settings.clearData}
        </button>
      </section>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title={t.settings.clearData}
        message={t.settings.clearConfirm}
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
        isDestructive
      />
    </>
  )
}
