import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useBuyerLocale } from '../../i18n/BuyerLocaleContext'

export default function BuyerLogin() {
  const { login } = useAuth()
  const { t } = useBuyerLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/buyer'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (password === '0909') {
      login('buyer', 'demo-token')
      navigate(from, { replace: true })
      return
    }
    try {
      const res = await fetch('/api/auth/buyer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || t.login.errorDefault)
        setLoading(false)
        return
      }
      login('buyer', data.token)
      navigate(from, { replace: true })
    } catch {
      setError(t.login.errorDefault)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs sm:text-sm text-neutral-500 hover:text-primary transition-colors">{t.login.backToSite}</Link>

        <div className="mt-4 sm:mt-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4 shadow-lg">
            R
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary">{t.login.title}</h2>
          <p className="mt-2 text-neutral-600 leading-relaxed text-xs sm:text-sm max-w-sm mx-auto">
            {t.login.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 p-5 sm:p-6 rounded-2xl border border-neutral-200 bg-white shadow-card space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="buyer-email" className="block text-sm font-medium text-neutral-700 mb-1.5">{t.profile.users.table.email}</label>
            <input
              id="buyer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[16px] text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[48px]"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="buyer-password" className="block text-sm font-medium text-neutral-700 mb-1.5">{t.login.passwordPlaceholder}</label>
            <input
              id="buyer-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[16px] text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[48px]"
              required
              autoComplete="current-password"
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
            className="btn-primary w-full py-3 rounded-lg font-semibold text-base disabled:opacity-60 disabled:cursor-wait transition-all min-h-[48px]"
          >
            {loading ? `${t.loading}` : t.login.submit}
          </button>
          <p className="text-center text-xs text-neutral-400">
            {t.login.demoHint} <strong className="text-neutral-500">0909</strong>
          </p>
        </form>

        <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm">
          <Link to="/marketplace/stock" className="text-accent hover:underline">{t.login.stockWithoutLogin}</Link>
          <span className="text-neutral-300">·</span>
          <Link to="/" className="text-accent hover:underline">{t.login.toHome}</Link>
        </div>
      </div>
    </div>
  )
}
