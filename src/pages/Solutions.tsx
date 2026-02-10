import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHero from '../components/PageHero'

export default function Solutions() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation('common')

  const solutionKeys = ['applicable', 'innovative'] as const
  const solutionKey = slug as (typeof solutionKeys)[number] | undefined
  const isSolution = solutionKey && solutionKeys.includes(solutionKey)

  if (isSolution) {
    const title = t(`pages.solutions.${solutionKey}.title`)
    const subtitle = t(`pages.solutions.${solutionKey}.subtitle`)
    const body1 = t(`pages.solutions.${solutionKey}.body1`)
    const body2 = t(`pages.solutions.${solutionKey}.body2`)

    return (
      <>
        <PageHero title={title} subtitle={subtitle} />
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4 text-neutral-600 leading-relaxed">
              <p>{body1}</p>
              <p>{body2}</p>
            </div>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                to="/#quote"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover"
              >
                {t('cta.getQuote')}
              </Link>
              <span className="text-neutral-500 text-sm self-center">{t('pages.solutions.related')}</span>
              <Link to="/security-management" className="text-accent hover:underline text-sm font-medium">{t('nav.securityManagement')}</Link>
              <Link to="/equipment-support" className="text-accent hover:underline text-sm font-medium">{t('nav.equipmentSupport')}</Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHero title={t('pages.solutions.title')} subtitle={t('pages.solutions.subtitle')} />
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="max-w-2xl text-neutral-600 leading-relaxed mb-12">
            {t('pages.solutions.description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutionKeys.map((key) => (
              <Link
                key={key}
                to={`/solutions/${key}`}
                className="p-6 rounded-xl border border-neutral-200 bg-white hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-primary">{t(`pages.solutions.${key}.title`)}</h2>
                <p className="mt-2 text-neutral-600 text-sm leading-relaxed">{t(`pages.solutions.${key}.subtitle`)}</p>
                <span className="mt-4 inline-block text-accent font-medium">{t('pages.solutions.learnMore')}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
