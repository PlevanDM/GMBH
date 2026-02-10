import { useState, useCallback, useMemo } from 'react'
import { IconUser } from '../../components/CabinetIcons'

type BuyerUser = {
  id: string
  email: string
  name: string
  company: string
  createdAt: string
  active: boolean
}

const STORAGE_KEY = 'restart-my-buyer-users'

function loadUsers(): BuyerUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

function saveUsers(users: BuyerUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export default function MyUsers() {
  const [users, setUsers] = useState<BuyerUser[]>(() => loadUsers())
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', name: '', company: '' })
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const PAGE_SIZE = 10
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.trim().toLowerCase()
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.company.toLowerCase().includes(q)
    )
  }, [users, search])
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const persist = useCallback((next: BuyerUser[]) => {
    setUsers(next)
    saveUsers(next)
  }, [])

  const resetForm = () => { setForm({ email: '', name: '', company: '' }); setEditId(null); setShowForm(false) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) { setMessage({ type: 'error', text: 'Email обязателен.' }); return }
    setMessage(null)

    if (editId) {
      const next = users.map((u) => u.id === editId ? { ...u, email: form.email.trim(), name: form.name.trim(), company: form.company.trim() } : u)
      persist(next)
      setMessage({ type: 'ok', text: 'Пользователь обновлён.' })
      resetForm()
    } else {
      if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
        setMessage({ type: 'error', text: 'Пользователь с таким email уже существует.' })
        return
      }
      const newUser: BuyerUser = {
        id: crypto.randomUUID(),
        email: form.email.trim(),
        name: form.name.trim(),
        company: form.company.trim(),
        createdAt: new Date().toISOString(),
        active: true,
      }
      persist([newUser, ...users])
      setMessage({ type: 'ok', text: 'Пользователь создан. Можно отправить ему данные для входа.' })
      resetForm()
    }
  }

  const handleEdit = (u: BuyerUser) => {
    setForm({ email: u.email, name: u.name, company: u.company })
    setEditId(u.id)
    setShowForm(true)
  }

  const handleToggleActive = (id: string) => {
    persist(users.map((u) => u.id === id ? { ...u, active: !u.active } : u))
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Удалить пользователя? Это действие нельзя отменить.')) return
    persist(users.filter((u) => u.id !== id))
    setMessage({ type: 'ok', text: 'Пользователь удалён.' })
  }

  return (
    <>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
        <IconUser className="shrink-0" /> Управление пользователями
      </h2>
      <p className="mt-2 text-neutral-600 leading-relaxed">
        Создание и управление учётными записями оптовых покупателей. Всего: <strong>{users.length}</strong>, активных: <strong>{users.filter((u) => u.active).length}</strong>.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { resetForm(); setShowForm((v) => !v) }} className="btn-primary rounded-lg px-4 py-2.5 text-sm">
          {showForm && !editId ? 'Отмена' : 'Создать пользователя'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-base font-semibold text-primary">{editId ? 'Редактировать пользователя' : 'Новый пользователь'}</h3>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Email (логин) *</span>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="buyer@company.com" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Имя контакта</span>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Иван Иванов" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Компания</span>
              <input type="text" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="ООО «Компания»" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="btn-primary rounded-lg px-4 py-2.5 text-sm">{editId ? 'Сохранить' : 'Создать'}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100">Отмена</button>
          </div>
        </form>
      )}

      {message && (
        <p className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
      )}

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-primary">Пользователи кабинета покупателя</h3>
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по email, имени, компании..."
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full sm:w-72"
          />
        </div>
        {filteredUsers.length === 0 ? (
          <p className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
            {search ? 'Ничего не найдено.' : 'Пока нет созданных пользователей. Нажмите «Создать пользователя», чтобы добавить учётную запись.'}
          </p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 font-semibold text-neutral-700">Email / Имя</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Компания</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Создан</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Статус</th>
                    <th className="px-4 py-3 font-semibold text-neutral-700">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u, idx) => (
                    <tr key={u.id} className={`border-b border-neutral-100 last:border-0 ${idx % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-800">{u.email}</span>
                        {u.name && <span className="text-neutral-500 block text-xs">{u.name}</span>}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.company || '—'}</td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => handleToggleActive(u.id)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer ${u.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>
                          {u.active ? 'Активен' : 'Неактивен'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEdit(u)} className="text-accent hover:underline text-sm">Ред.</button>
                          <button type="button" onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline text-sm">Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">Назад</button>
                <span className="text-sm text-neutral-600">{page + 1} из {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">Вперёд</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
