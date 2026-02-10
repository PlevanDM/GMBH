import { Outlet, Link, useLocation } from 'react-router-dom'
import { IconBook, IconGrid, IconPackage } from '../../components/CabinetIcons'

const tabs = [
  { label: 'База знаний', to: '/tools/knowledge', Icon: IconBook },
  { label: 'Справочники NEXX', to: '/tools/references', Icon: IconGrid },
  { label: 'Обновление прайса', to: '/my/inventory', Icon: IconPackage },
]

export default function ToolsLayout() {
  const location = useLocation()
  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-br from-primary to-primary-light text-white py-8 shadow-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors">
            ← На сайт
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Инструменты</h1>
          <p className="mt-1 text-neutral-300 text-sm">
            База знаний (по аналогии с NEXX), обновление прайса и остатков.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Разделы инструментов">
          {tabs.map(({ label, to, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? 'bg-accent text-white shadow-button'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 shadow-card'
              }`}
            >
              <Icon className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
