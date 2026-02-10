import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { IconGrid, IconFileText, IconUser } from '../../components/CabinetIcons'
import { useBuyerLocale, BUYER_PORTAL_LOCALE_KEYS } from '../../i18n/BuyerLocaleContext'
import { useAuth } from '../../auth/AuthContext'

export default function BuyerLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, locale, setLocale } = useBuyerLocale()
  const { logout } = useAuth()

  const tabs = [
    { label: t.nav.stock, to: '/buyer', Icon: IconGrid },
    { label: t.nav.requests, to: '/buyer/requests', Icon: IconFileText },
    { label: t.nav.profile, to: '/buyer/profile', Icon: IconUser },
  ]

  const handleLogout = () => {
    logout()
    navigate('/buyer/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-light text-white py-4 sm:py-6 shadow-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: compact row with shortened labels */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <Link to="/" className="text-[11px] sm:text-sm text-white/70 hover:text-white transition-colors">← {t.layout.backToSite}</Link>
              <h1 className="mt-0.5 sm:mt-1 text-base sm:text-xl md:text-2xl font-bold truncate">{t.buyerCabinet}</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="rounded-lg border border-white/30 bg-white/10 text-white py-1.5 sm:py-2 px-1.5 sm:px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer min-h-[36px] sm:min-h-[40px] w-[52px] sm:w-auto"
                aria-label={t.layout.langLabel}
              >
                {BUYER_PORTAL_LOCALE_KEYS.map((key) => (
                  <option key={key} value={key} className="text-primary">
                    {key.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs sm:text-sm text-white/70 hover:text-white border border-white/30 hover:border-white/60 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors whitespace-nowrap min-h-[36px] sm:min-h-[40px]"
                title={t.layout.logout}
              >
                <span className="hidden sm:inline">{t.layout.logout}</span>
                <svg className="sm:hidden w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tabs — scrollable on small screens */}
        <div className="mb-4 sm:mb-6 lg:mb-8 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap" aria-label={t.layout.navLabel}>
            {tabs.map(({ label, to, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[40px] sm:min-h-[44px] ${
                  (to === '/buyer/requests' ? location.pathname.startsWith('/buyer/requests') : location.pathname === to)
                    ? 'bg-accent text-white shadow-button'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 shadow-card'
                }`}
              >
                <Icon className="shrink-0 w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-3 sm:p-5 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
