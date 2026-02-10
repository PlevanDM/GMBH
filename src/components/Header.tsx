import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IconStore, IconUserCircle, IconGlobe } from './CabinetIcons'
import { Phone, Download, Menu, X, Search } from 'lucide-react'
import { BUYER_PORTAL_LOCALE_KEYS, buyerPortalLocales, type BuyerPortalLocaleKey } from '../i18n'
import { useBuyerLocale } from '../i18n/BuyerLocaleContext'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { createPortal } from 'react-dom'
import AnnouncementBar from './AnnouncementBar'
import SearchOverlay from './SearchOverlay'

type NavItemChild = { labelKey: string; href: string }
type NavItem =
  | { labelKey: string; href: string; icon?: undefined; children?: undefined }
  | { labelKey: string; href: string; icon: React.ComponentType<{ className?: string }>; children?: undefined }
  | { labelKey: string; href: string; children: NavItemChild[]; icon?: undefined }

const navConfig: NavItem[] = [
  {
    labelKey: 'solutions',
    href: '/solutions',
    children: [
      { labelKey: 'applicableSolutions', href: '/solutions/applicable' },
      { labelKey: 'innovativeSolutions', href: '/solutions/innovative' },
    ],
  },
  {
    labelKey: 'navServices',
    href: '/security-management',
    children: [
      { labelKey: 'securityManagement', href: '/security-management' },
      { labelKey: 'equipmentSupport', href: '/equipment-support' },
      { labelKey: 'globalLogistics', href: '/global-logistics' },
    ],
  },
  { labelKey: 'stock', href: '/marketplace/stock' },
  { labelKey: 'faq', href: '/faq' },
  { labelKey: 'contacts', href: '/contacts' },
  { labelKey: 'buyerCabinet', href: '/buyer', icon: IconStore },
  { labelKey: 'myCabinet', href: '/my', icon: IconUserCircle },
]

export default function Header() {
  const { t, i18n } = useTranslation('common')
  const { locale, setLocale } = useBuyerLocale()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const { canInstall, triggerInstall } = usePwaInstall()

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1280px)')
    const handler = () => { if (mql.matches) setMobileOpen(false) }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const setLocaleAndSave = (key: BuyerPortalLocaleKey) => {
    i18n.changeLanguage(key)
    setLocale(key)
    setLangOpen(false)
  }

  const getNavLabel = (key: string) => t(`nav.${key}`)

  /* ═══ Mobile menu rendered via portal to avoid stacking context issues ═══ */
  const mobileMenu = mobileOpen
    ? createPortal(
        <div className="xl:hidden z-[1050]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-[1050] bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          {/* Slide-over panel */}
          <div className="fixed right-0 top-16 bottom-0 z-[1051] w-full max-w-[340px] sm:max-w-[380px] bg-white shadow-2xl overflow-y-auto overscroll-contain animate-slide-in-right duration-200">
            {/* Language switcher — compact codes */}
            <div className="flex items-center gap-1.5 px-5 py-3 border-b border-neutral-100 bg-neutral-50">
              <IconGlobe className="w-4 h-4 text-neutral-400 shrink-0 mr-1" />
              {BUYER_PORTAL_LOCALE_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLocaleAndSave(key)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg transition-colors uppercase ${locale === key ? 'bg-accent text-white shadow-sm' : 'bg-white text-neutral-600 hover:bg-neutral-200 border border-neutral-200'}`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Nav links */}
            <nav className="flex flex-col py-2 bg-white" aria-label="Mobile menu">
              {navConfig.map((item) =>
                item.children ? (
                  <div key={item.labelKey} className="border-b border-neutral-100">
                    <Link
                      to={item.href}
                      className="flex items-center px-5 py-4 text-base font-semibold text-primary"
                      onClick={() => setMobileOpen(false)}
                    >
                      {getNavLabel(item.labelKey)}
                    </Link>
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        to={c.href}
                        className="flex items-center py-3 pl-8 pr-5 text-[15px] text-neutral-600 hover:bg-neutral-50 hover:text-primary font-medium min-h-[48px]"
                        onClick={() => setMobileOpen(false)}
                      >
                        {getNavLabel(c.labelKey)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 px-5 py-4 text-base text-neutral-700 hover:bg-neutral-50 hover:text-primary font-medium min-h-[52px] border-b border-neutral-100"
                    onClick={() => setMobileOpen(false)}
                    aria-label={getNavLabel(item.labelKey)}
                  >
                    {item.icon && <item.icon className="shrink-0 w-5 h-5 text-neutral-500" />}
                    {getNavLabel(item.labelKey)}
                  </Link>
                )
              )}
            </nav>

            {/* Mobile CTA + Phone + Install */}
            <div className="px-5 py-5 border-t border-neutral-100 space-y-3">
              <Link
                to="/#quote"
                className="flex items-center justify-center rounded-lg bg-accent px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors w-full min-h-[48px]"
                onClick={() => setMobileOpen(false)}
              >
                {t('cta.getQuote')}
              </Link>
              <a
                href="tel:+492211612489"
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 w-full min-h-[48px]"
              >
                <Phone className="w-4 h-4 shrink-0" />
                +49 221-16-12-489
              </a>
              {canInstall && (
                <button
                  type="button"
                  onClick={() => { triggerInstall(); setMobileOpen(false) }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-5 py-3 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors w-full min-h-[48px]"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  {t('pwa.install')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      {/* Announcement bar — above the header */}
      <AnnouncementBar />

      <header className="sticky top-0 z-[1000] h-16 xl:h-[72px] bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-full w-full max-w-[1280px] mx-auto px-4 sm:px-5 xl:px-6 flex items-center justify-between gap-3 min-w-0">
          {/* Logo */}
          <Link
            to="/"
            className="flex shrink-0 items-center py-1 h-full min-h-[44px] min-w-[90px] overflow-visible"
            aria-label="Restart — home"
          >
            <img
              src="/images/restart-logo.svg"
              alt="Restart"
              className="h-8 sm:h-9 xl:h-10 w-auto max-h-[44px] object-contain object-left"
              loading="eager"
              width={180}
              height={44}
            />
          </Link>

          {/* Desktop navigation — xl (1280px+) */}
          <nav className="hidden xl:flex items-center justify-center flex-1 min-w-0 overflow-visible" aria-label="Main menu">
            <div className="flex items-center gap-3 2xl:gap-4 flex-nowrap">
              {navConfig.map((item) =>
                item.children ? (
                  <div key={item.labelKey} className="relative group flex-shrink-0">
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-0.5 py-2 px-2 text-[13px] 2xl:text-sm font-medium text-neutral-500 hover:text-primary rounded-lg hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
                    >
                      {getNavLabel(item.labelKey)}
                      <svg className="w-3 h-3 ml-0.5 text-neutral-400 group-hover:text-primary transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <div className="absolute left-0 top-full z-[100] pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200">
                      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200/80 py-1.5 min-w-[220px] ring-1 ring-black/5">
                        {item.children.map((c) => (
                          <Link
                            key={c.href}
                            to={c.href}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-accent/5 hover:text-accent rounded-lg mx-1.5 transition-colors duration-150"
                          >
                            <span className="w-1 h-1 rounded-full bg-neutral-300" />
                            {getNavLabel(c.labelKey)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`inline-flex items-center justify-center py-2 px-2 text-[13px] 2xl:text-sm font-medium text-neutral-500 hover:text-primary rounded-lg hover:bg-neutral-50 transition-all duration-200 flex-shrink-0 min-h-[2.25rem] whitespace-nowrap ${item.icon ? 'w-9 hover:bg-accent/5 hover:text-accent' : ''}`}
                    title={item.icon ? getNavLabel(item.labelKey) : undefined}
                    aria-label={getNavLabel(item.labelKey)}
                  >
                    {item.icon ? (
                      <item.icon className="shrink-0 w-5 h-5 text-current" />
                    ) : (
                      getNavLabel(item.labelKey)
                    )}
                  </Link>
                )
              )}
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 xl:gap-2">
            {/* Search — opens overlay */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center rounded-lg px-2 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors min-h-[40px] min-w-[40px] shrink-0"
              title={t('bar.search', 'Search')}
              aria-label={t('bar.search', 'Search')}
            >
              <Search className="w-[18px] h-[18px] shrink-0" />
            </button>

            {/* Language selector */}
            <div className="relative flex items-center" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors min-h-[40px] min-w-[40px] justify-center"
                title={t('pages.selectLanguage')}
                aria-label={t('pages.selectLanguage')}
                aria-expanded={langOpen}
              >
                <IconGlobe className="w-[18px] h-[18px] shrink-0 text-neutral-600" aria-hidden />
                <span className="hidden xl:inline text-xs font-semibold uppercase tracking-wide">{locale}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 py-1.5 min-w-[11rem] rounded-xl bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-2xl ring-1 ring-black/5 animate-fade-in duration-150">
                  {BUYER_PORTAL_LOCALE_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLocaleAndSave(key)}
                      className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${locale === key ? 'bg-accent/10 text-accent' : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary'}`}
                    >
                      {locale === key && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                      {buyerPortalLocales[key].languageName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PWA Install — desktop */}
            {canInstall && (
              <button
                type="button"
                onClick={triggerInstall}
                className="hidden sm:flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-neutral-600 hover:bg-accent/10 hover:text-accent transition-colors min-h-[40px] shrink-0 group"
                title={t('pwa.install')}
                aria-label={t('pwa.install')}
              >
                <Download className="w-[18px] h-[18px] shrink-0 group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* Phone */}
            <a
              href="tel:+492211612489"
              title="+49 221-16-12-489"
              aria-label="Call us"
              className="hidden sm:flex items-center justify-center w-10 h-10 min-w-[40px] rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors shrink-0"
            >
              <Phone className="w-[18px] h-[18px] shrink-0" />
            </a>

            {/* CTA */}
            <Link
              to="/#quote"
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-accent px-3 py-2 md:px-4 md:py-2.5 xl:px-5 xl:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-accent-hover transition-colors shrink-0 whitespace-nowrap shadow-sm"
            >
              {t('cta.getQuote')}
            </Link>

            {/* Burger — below xl */}
            <button
              type="button"
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg xl:hidden transition-colors z-[1060]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — rendered via portal to document.body */}
      {mobileMenu}

      {/* Search overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
