import { useState, useCallback } from 'react'
import { IconSettings } from '../../components/CabinetIcons'

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

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export default function MySettings() {
  const [profile, setProfile] = useState<MyProfileData>(() => loadJson(PROFILE_KEY, defaultProfile))
  const [notifications, setNotifications] = useState<MyNotificationsData>(() => loadJson(NOTIF_KEY, defaultNotifications))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')

  const showSaved = useCallback(() => {
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [])

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    showSaved()
  }

  const saveNotifications = () => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications))
    showSaved()
  }

  const handleClearData = () => {
    if (!window.confirm('Очистить все данные кабинета (инвентарь, настройки, пользователи)? Это действие нельзя отменить.')) return
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
        <IconSettings className="shrink-0" /> Настройки
      </h2>
      <p className="mt-2 text-neutral-600 leading-relaxed">
        Профиль компании, уведомления и конфигурация.
      </p>

      {saveStatus === 'saved' && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 font-medium">
          ✓ Сохранено
        </div>
      )}

      {/* Profile */}
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-base font-semibold text-primary">Профиль компании</h3>
        <p className="mt-1 text-sm text-neutral-500">Контактные данные, название компании.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm text-neutral-600">Компания</span>
            <input value={profile.companyName} onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))} placeholder="Название компании" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Контактное лицо</span>
            <input value={profile.contactName} onChange={(e) => setProfile((p) => ({ ...p, contactName: e.target.value }))} placeholder="ФИО" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Email</span>
            <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="admin@company.com" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Телефон</span>
            <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+49 ..." className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Сайт</span>
            <input value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} placeholder="https://company.com" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Основная валюта</span>
            <select value={profile.currency} onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="UAH">UAH (₴)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Часовой пояс</span>
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
          Сохранить профиль
        </button>
      </section>

      {/* Notifications */}
      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-base font-semibold text-primary">Уведомления</h3>
        <p className="mt-1 text-sm text-neutral-500">Оповещения о новых заявках от покупателей.</p>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notifications.rfqCreated} onChange={(e) => setNotifications((n) => ({ ...n, rfqCreated: e.target.checked }))} className="h-4 w-4 rounded border-neutral-300" />
            <span className="text-sm text-neutral-700">Email при новой заявке</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notifications.rfqUpdated} onChange={(e) => setNotifications((n) => ({ ...n, rfqUpdated: e.target.checked }))} className="h-4 w-4 rounded border-neutral-300" />
            <span className="text-sm text-neutral-700">Напоминание о необработанных запросах</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={notifications.messages} onChange={(e) => setNotifications((n) => ({ ...n, messages: e.target.checked }))} className="h-4 w-4 rounded border-neutral-300" />
            <span className="text-sm text-neutral-700">Сообщения в чате запроса</span>
          </label>
          <label className="block mt-4">
            <span className="text-sm text-neutral-600">Email-дайджест</span>
            <select value={notifications.emailDigest} onChange={(e) => setNotifications((n) => ({ ...n, emailDigest: e.target.value as 'off' | 'daily' | 'weekly' }))} className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
              <option value="off">Выключен</option>
              <option value="daily">Ежедневный</option>
              <option value="weekly">Еженедельный</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={saveNotifications} className="btn-primary mt-4 py-2.5 px-4 rounded-lg text-sm">
          Сохранить уведомления
        </button>
      </section>

      {/* Danger zone */}
      <section className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-base font-semibold text-red-700">Опасная зона</h3>
        <p className="mt-1 text-sm text-neutral-600">Необратимые действия, которые очистят все данные.</p>
        <button type="button" onClick={handleClearData} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">
          Очистить все данные кабинета
        </button>
      </section>
    </>
  )
}
