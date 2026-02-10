/**
 * SEO config: titles, descriptions, Open Graph, Twitter Card.
 * Base URL for canonical and og:url (override via env in production).
 */
const env = typeof import.meta !== 'undefined' ? (import.meta as { env?: { VITE_SITE_URL?: string } }).env : undefined
export const SITE_URL = env?.VITE_SITE_URL || 'https://restartsp.com'

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`

export interface PageSEO {
  title: string
  description: string
  keywords?: string
  ogImage?: string
}

const SEO: Record<string, PageSEO> = {
  '/': {
    title: 'Restart — B2B Equipment & Solutions | MDM, Security Management, Global Logistics',
    description:
      'Restart - B2B supplier of equipment and solutions for mobile device management. MDM solutions, global logistics, equipment support. Offices in Germany, Poland, Ukraine, USA, UK, Mexico.',
    keywords:
      'B2B equipment, MDM solutions, device management, corporate smartphones, business laptops, enterprise mobility, equipment lifecycle, global logistics',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/solutions': {
    title: 'Solutions — B2B Equipment & Services for Your Business | Restart',
    description: 'Applicable and innovative B2B solutions: tailored equipment, MDM integration, security management, and scalable processes.',
    keywords: 'B2B solutions, corporate equipment, applicable solutions, innovative solutions',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/solutions/applicable': {
    title: 'Applicable Solutions — Tailored B2B Equipment for Your Business | Restart',
    description:
      'Equipment and services adapted to your workflows: bulk procurement, standardized configurations, MDM and security policy integration. Applicable solutions that work from day one.',
    keywords: 'applicable solutions, B2B equipment, bulk procurement, MDM integration',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/solutions/innovative': {
    title: 'Innovative Solutions — Latest Technology & Processes | Restart',
    description:
      'Modern tools and practices for efficiency, security, and scalability. Cloud-based device management, automated lifecycle processes. Stay competitive with Restart.',
    keywords: 'innovative solutions, device management, cloud MDM, lifecycle management',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/security-management': {
    title: 'MDM Solutions & Security Management | Microsoft Intune, Apple ABM | Restart',
    description:
      'Mobile Device Management and security: Microsoft Intune, Apple ABM, MDM solutions. Secure and manage your corporate devices with Restart.',
    keywords: 'MDM, Microsoft Intune, Apple ABM, security management, device management',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/equipment-support': {
    title: 'Equipment Support Services — Lifecycle Management & Service Centers | Restart',
    description:
      'Equipment support, lifecycle management, authorized service centers. Support for your business equipment. Purchase to trade-in.',
    keywords: 'equipment support, lifecycle management, service centers, support',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/global-logistics': {
    title: 'Global Logistics — International Equipment Delivery & Tracking | Restart',
    description:
      'International equipment delivery, packaging, insurance, tracking. Restart offices and warehouses in Germany, Poland, Ukraine, USA, UK, Mexico.',
    keywords: 'global logistics, international delivery, equipment shipping, tracking',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/offices': {
    title: 'Offices — Global Locations | Restart B2B',
    description: 'Restart offices: Cologne (Germany), Wroclaw (Poland), Odesa (Ukraine), St. Petersburg FL (USA), Hayes (UK), CDMX (Mexico).',
    keywords: 'Restart offices, Germany, Poland, Ukraine, USA, UK, Mexico',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/faq': {
    title: 'FAQ — Frequently Asked Questions | Restart B2B Equipment',
    description: 'Frequently asked questions about Restart B2B equipment, solutions, ordering, and support.',
    keywords: 'FAQ, Restart, B2B equipment, questions',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/contacts': {
    title: 'Contact Us — Global Offices in Germany, Poland, Ukraine, USA, UK, Mexico | Restart',
    description: 'Contact Restart: phone, email, offices in Cologne, Wroclaw, Odesa, St. Petersburg FL, Hayes, CDMX. Get a quote or request a callback.',
    keywords: 'contact Restart, B2B contact, get quote, offices',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/impressum': {
    title: 'Impressum — Restart',
    description: 'Impressum and legal information for Restart.',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/privacy': {
    title: 'Privacy Policy — Restart',
    description: 'Privacy Policy and data protection information for Restart B2B.',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/marketplace/stock': {
    title: 'Витрина продаж — Наличие на складе | Restart',
    description: 'Актуальное наличие оборудования на складе. Запросите коммерческое предложение.',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/buyer': {
    title: 'Кабинет покупателя — Restart',
    description: 'Кабинет оптового покупателя: витрина, заявки, профиль.',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/my': {
    title: 'Мой кабинет — Restart',
    description: 'Мой кабинет: обновление прайса, настройки.',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/tools/knowledge': {
    title: 'База знаний — Restart',
    description: 'База знаний для партнёров и сотрудников: оборудование, логистика, процессы.',
    ogImage: DEFAULT_OG_IMAGE,
  },
  '/tools/references': {
    title: 'Справочники NEXX — Restart',
    description: 'Перенесённые данные NEXX: зарядні станції (EcoFlow, BLUETTI, DJI), Apple PMIC, ціни та мікросхеми.',
    ogImage: DEFAULT_OG_IMAGE,
  },
}

function getSEO(pathname: string): PageSEO {
  if (SEO[pathname]) return SEO[pathname]
  if (pathname === '/solutions/innovative') return SEO['/solutions/innovative']
  if (pathname.startsWith('/solutions/')) return SEO['/solutions/applicable'] ?? SEO['/solutions']
  if (pathname.startsWith('/buyer')) return SEO['/buyer']
  if (pathname.startsWith('/my')) return SEO['/my']
  if (pathname.startsWith('/tools/references')) return SEO['/tools/references']
  if (pathname.startsWith('/tools')) return SEO['/tools/knowledge']
  return {
    title: 'Restart — B2B Equipment & Solutions',
    description: 'B2B supplier of equipment and solutions. MDM, security management, global logistics.',
    ogImage: DEFAULT_OG_IMAGE,
  }
}

export function getPageSEO(pathname: string): PageSEO & { canonical: string } {
  const page = getSEO(pathname)
  const canonical = pathname === '/' ? SITE_URL : `${SITE_URL}${pathname}`
  return { ...page, canonical }
}
