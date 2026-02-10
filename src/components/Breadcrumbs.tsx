import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBuyerLocale } from '../i18n/BuyerLocaleContext'

/** Сегменты пути → ключи перевода для заголовков (или явные названия) */
const PATH_LABELS: Record<string, string> = {
  solutions: 'nav.solutions',
  'security-management': 'Security & Management',
  'equipment-support': 'Equipment Support',
  'global-logistics': 'Global Logistics',
  offices: 'nav.contacts',
  faq: 'nav.faq',
  contacts: 'nav.contacts',
  impressum: 'nav.impressum',
  privacy: 'footer.privacyPolicy',
  marketplace: 'marketplace',
  partners: 'partners',
  my: 'nav.myCabinet',
  tools: 'tools',
  knowledge: 'knowledge',
  references: 'references',
}

/** Buyer-specific segment labels resolved from buyer locale */
const BUYER_SEGMENTS = ['buyer', 'stock', 'requests', 'profile', 'login'] as const

interface BreadcrumbItem {
  label: string
  path: string
}

function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()
  const { t: tCommon } = useTranslation('common')
  const { t: tBuyer } = useBuyerLocale()
  if (pathname === '/') return []

  const segments = pathname.split('/').filter(Boolean)
  const isBuyerRoute = segments[0] === 'buyer'
  const items: BreadcrumbItem[] = [{ label: tCommon('breadcrumbs.home'), path: '/' }]

  let path = ''
  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`
    const key = segments[i]
    let label: string | undefined

    if (isBuyerRoute && (BUYER_SEGMENTS as readonly string[]).includes(key)) {
      // Use buyer locale for buyer-specific segments
      if (key === 'buyer') label = tBuyer.buyerCabinet
      else if (key === 'stock') label = tBuyer.nav.stock
      else if (key === 'requests') label = tBuyer.nav.requests
      else if (key === 'profile') label = tBuyer.nav.profile
      else if (key === 'login') label = key
    } else {
      label = PATH_LABELS[key]
      if (label?.startsWith('nav.') || label?.startsWith('footer.')) {
        label = tCommon(label as 'nav.solutions')
      }
    }

    if (!label) label = key
    items.push({ label, path })
  }
  return items
}

export default function Breadcrumbs() {
  const items = useBreadcrumbs()
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-x-2">
            {i > 0 && <span className="text-neutral-400" aria-hidden>/</span>}
            {i === items.length - 1 ? (
              <span className="font-medium text-primary" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link to={item.path} className="hover:text-accent hover:underline">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
