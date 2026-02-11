import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'

export default function ToolsLogin() {
  const { t } = useSellerLocale()
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/tools'
  const [loginField, setLoginField] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/tools/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginField, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || t.tools.error)
      return
    }
    login('tools', data.token)
    navigate(from, { replace: true })
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Link to="/" className="text-sm text-neutral-500 hover:text-primary transition-colors">← {t.tools.backToSite}</Link>
      <h2 className="mt-4 text-2xl font-bold text-primary">{t.tools.loginTitle}</h2>
      <p className="mt-2 text-neutral-600 leading-relaxed">
        {t.tools.loginSubtitle}
      </p>
      <p className="mt-4 text-xs text-neutral-500">{t.tools.demoHint}</p>
      <form onSubmit={handleSubmit} className="mt-8 p-6 rounded-xl border border-neutral-200 bg-neutral-50 shadow-card space-y-4">
        <input
          value={loginField}
          onChange={(e) => setLoginField(e.target.value)}
          placeholder={t.tools.loginPlaceholder}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-primary"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.tools.passwordPlaceholder}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-primary"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full py-2.5 rounded-lg">
          {t.tools.loginButton}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-neutral-500">
        <Link to="/" className="text-accent hover:underline">{t.tools.backToHome}</Link>
      </p>
    </div>
  )
}
