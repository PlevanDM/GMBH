import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { IconDashboard, IconPackage, IconSettings, IconCpu, IconUser, IconFileText, IconActivity } from '../../components/CabinetIcons'

const tabs = [
  { label: 'Дашборд', to: '/my', Icon: IconDashboard, exact: true },
  { label: 'Запросы', to: '/my/rfqs', Icon: IconFileText, exact: false },
  { label: 'Пользователи', to: '/my/users', Icon: IconUser, exact: false },
  { label: 'Прайс', to: '/my/inventory', Icon: IconPackage, exact: false },
  { label: 'Скаут цен', to: '/my/laptops', Icon: IconCpu, exact: false },
  { label: 'Активность', to: '/my/activity', Icon: IconActivity, exact: false },
  { label: 'Настройки', to: '/my/settings', Icon: IconSettings, exact: false },
]

function useIsSmallScreen(breakpoint = 640) {
  const [isSmall, setIsSmall] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches)
    setIsSmall(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isSmall
}

export default function MyLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const isMobile = useIsSmallScreen(640)

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const handleLogout = () => {
    logout()
    navigate('/my/login', { replace: true })
  }

  const currentTab = tabs.find((t) => isActive(t.to, t.exact)) ?? tabs[0]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-light text-white py-4 sm:py-6 shadow-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link to="/" className="text-xs sm:text-sm text-white/70 hover:text-white transition-colors">← На сайт</Link>
            <h1 className="mt-1 text-lg sm:text-xl md:text-2xl font-bold truncate">Мой кабинет</h1>
            <p className="mt-0.5 text-white/60 text-xs sm:text-sm hidden sm:block">Управление, прайс, остатки, заявки</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs sm:text-sm text-white/70 hover:text-white border border-white/30 hover:border-white/60 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 transition-colors whitespace-nowrap min-h-[36px] sm:min-h-[40px] shrink-0"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Navigation tabs — dropdown on mobile, scrollable pills on tablet+ */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          {isMobile ? (
            /* Mobile: compact dropdown */
            <div className="relative">
              <select
                value={currentTab.to}
                onChange={(e) => navigate(e.target.value)}
                className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-neutral-800 shadow-card focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[48px]"
                aria-label="Разделы кабинета"
              >
                {tabs.map(({ label, to }) => (
                  <option key={to} value={to}>{label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            /* Tablet / Desktop: scrollable pill tabs */
            <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-hide">
              <nav className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap" aria-label="Разделы кабинета">
                {tabs.map(({ label, to, Icon, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[40px] md:min-h-[44px] ${
                      isActive(to, exact)
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
          )}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-3 sm:p-5 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
