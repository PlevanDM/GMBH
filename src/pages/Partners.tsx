import PageHero from '../components/PageHero'
import { useTranslation } from 'react-i18next'

const PARTNERS = [
  { name: 'EPAM Systems', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/EPAM_logo.svg' },
  { name: 'SoftServe', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/SoftServe_Logo.svg' },
  { name: 'Ciklum', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Ciklum_logo.svg' },
  { name: 'Luxoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Luxoft_logo.svg' },
  { name: 'EPAM Anywhere', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/EPAM_logo.svg' },
  { name: 'In_drive', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/InDrive_Logo.svg' },
]

export default function PartnersPage() {
  const { t } = useTranslation('common')

  return (
    <>
      <PageHero title={t('home.partnersLabel')} subtitle={t('home.partnersIntro')} />

      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {PARTNERS.map(p => (
              <div key={p.name} className="flex flex-col items-center gap-4 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
                <img src={p.logo} alt={p.name} className="h-10 sm:h-12 w-auto object-contain" />
                <span className="text-xs font-semibold text-neutral-400">{p.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-24 rounded-3xl bg-neutral-50 p-8 sm:p-12 border border-neutral-200">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-primary mb-6">{t('home.letRestartPartner')}</h2>
              <p className="text-lg text-neutral-600 mb-8">{t('home.weAssist')}</p>
              <a href="/#quote" className="btn-primary px-8 py-4 text-lg inline-flex items-center gap-2">
                {t('home.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
