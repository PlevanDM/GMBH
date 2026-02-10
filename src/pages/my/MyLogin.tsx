import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function MyLogin() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/my'
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (pin === '0909') {
      login('my', 'demo-token')
      navigate(from, { replace: true })
      return
    }
    try {
      const res = await fetch('/api/auth/my/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Ошибка входа. Для демо: PIN 0909.')
        setLoading(false)
        return
      }
      login('my', data.token)
      navigate(from, { replace: true })
    } catch {
      setError('Ошибка входа. Для демо: PIN 0909.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-sm text-neutral-500 hover:text-primary transition-colors">← На сайт</Link>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white text-2xl font-bold mb-4 shadow-lg">
            M
          </div>
          <h2 className="text-2xl font-bold text-primary">Мой кабинет</h2>
          <p className="mt-2 text-neutral-600 leading-relaxed text-sm max-w-sm mx-auto">
            Для партнёров и сотрудников. Управление прайсом, остатками, заявками.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 p-6 rounded-2xl border border-neutral-200 bg-white shadow-card space-y-5">
          <div>
            <label htmlFor="my-pin" className="block text-sm font-medium text-neutral-700 mb-1.5">PIN-код</label>
            <input
              id="my-pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-primary text-center text-xl tracking-[0.3em] focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              required
              maxLength={10}
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-lg font-semibold text-base disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            {loading ? '...' : 'Войти'}
          </button>
          <p className="text-center text-xs text-neutral-400">
            Демо: PIN <strong className="text-neutral-500">0909</strong>
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-accent hover:underline">На главную</Link>
        </div>
      </div>
    </div>
  )
}
