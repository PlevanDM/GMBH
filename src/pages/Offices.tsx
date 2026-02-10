import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'
import PageHero from '../components/PageHero'
import OfficeMap, { offices, type OfficeId } from '../components/OfficeMap'

export default function Offices() {
  const { t } = useTranslation('common')
  const [hoveredOffice, setHoveredOffice] = useState<OfficeId | null>(null)

  return (
    <>
      <PageHero
        title={t('footer.offices')}
        subtitle={t('footer.address')}
      />

      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Interactive Map */}
          <div className="mb-10">
            <OfficeMap
              hoveredOffice={hoveredOffice}
              setHoveredOffice={setHoveredOffice}
              t={t}
              theme="light"
            />
          </div>

          {/* Office cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {offices.map((o) => {
              const isHovered = hoveredOffice === o.id
              return (
                <div
                  key={o.id}
                  className={`group relative rounded-xl p-5 sm:p-6 border bg-white transition-all duration-300 ${
                    isHovered
                      ? 'border-accent/40 shadow-lg shadow-accent/5 scale-[1.01]'
                      : 'border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300'
                  }`}
                  onMouseEnter={() => setHoveredOffice(o.id)}
                  onMouseLeave={() => setHoveredOffice(null)}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl leading-none" aria-hidden>{o.flag}</span>
                      <div>
                        <h3 className="font-semibold text-primary text-base leading-tight">
                          {t(`footerOffice.${o.id}.country`)}
                        </h3>
                        <p className="text-neutral-500 text-sm">{t(`footerOffice.${o.id}.city`)}</p>
                      </div>
                    </div>
                    <a
                      href={o.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                        isHovered
                          ? 'bg-accent/10 text-accent'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600'
                      }`}
                      title="Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-neutral-600 pl-[42px]">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-400" />
                    <span>{o.address}</span>
                  </div>

                  <a
                    href={`tel:${o.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 text-accent hover:text-accent-hover text-sm font-medium mt-3 transition-colors pl-[42px]"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {o.phone}
                  </a>

                  {/* Accent bottom bar */}
                  <div className={`absolute bottom-0 left-5 right-5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-accent/50 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              )
            })}
          </div>

          {/* General contact */}
          <div className="mt-10 rounded-xl bg-gradient-to-r from-primary to-primary-light p-6 sm:p-8 text-white">
            <h3 className="text-lg font-bold">General contact</h3>
            <p className="mt-2 text-white/80 text-sm">Hansaring 61, Cologne, Germany</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <a href="mailto:info@restartsp.com" className="inline-flex items-center gap-1.5 text-white/90 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                info@restartsp.com
              </a>
              <a href="tel:+492211612489" className="inline-flex items-center gap-1.5 text-white/90 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                +49/221/16 12 – 0
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
