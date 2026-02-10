import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ExternalLink } from 'lucide-react'

const navLinks = [
  { labelKey: 'stock' as const, to: '/marketplace/stock' },
  { labelKey: 'applicableSolutions' as const, to: '/solutions/applicable' },
  { labelKey: 'innovativeSolutions' as const, to: '/solutions/innovative' },
  { labelKey: 'securityManagement' as const, to: '/security-management' },
  { labelKey: 'equipmentSupport' as const, to: '/equipment-support' },
  { labelKey: 'globalLogistics' as const, to: '/global-logistics' },
  { labelKey: 'faqs' as const, to: '/faq' },
  { labelKey: 'offices' as const, to: '/offices' },
  { labelKey: 'contacts' as const, to: '/contacts' },
]

export default function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className="text-neutral-400 border-t border-white/5" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)' }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12">
        {/* Grid — 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 lg:gap-16">
          {/* Company info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/restart-logo.svg" alt="Restart" className="h-7 brightness-200 contrast-0 invert" loading="lazy" />
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">{t('footer.address')}</p>
            <a href="mailto:info@restartsp.com" className="group inline-flex items-center gap-1.5 text-sm text-accent hover:text-white mt-3 transition-colors duration-200">
              <Mail className="w-3.5 h-3.5" />
              info@restartsp.com
            </a>
            <div className="mt-4 flex flex-wrap gap-x-1 gap-y-1 text-sm">
              {[
                { to: '/offices', key: 'offices' },
                { to: '/contacts', key: 'contacts' },
                { to: '/impressum', key: 'impressum' },
                { to: '/privacy', key: 'privacyPolicy' },
              ].map(({ to, key }) => (
                <Link
                  key={to}
                  to={to}
                  className="group inline-flex items-center px-2.5 py-1.5 rounded-md hover:bg-white/5 hover:text-white transition-all duration-200 text-neutral-400"
                >
                  {t(`footer.${key}`)}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg mb-4">{t('footer.navigation')}</h3>
            <ul className="space-y-0.5 text-sm">
              {navLinks.map(({ labelKey, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-1 px-2.5 py-1.5 -ml-2.5 rounded-md hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    <span className="w-0 group-hover:w-4 overflow-hidden transition-all duration-200">
                      <ExternalLink className="w-3 h-3 text-accent" />
                    </span>
                    {t(`footer.${labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 sm:mt-16 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-neutral-500">
          <span>© {new Date().getFullYear()} Restart GmbH. All rights reserved.</span>
          <span className="text-neutral-600">IT Equipment Lifecycle Management</span>
        </div>
      </div>
    </footer>
  )
}
