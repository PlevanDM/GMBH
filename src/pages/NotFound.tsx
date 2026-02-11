import { Link } from 'react-router-dom'
import { useBuyerLocale } from '../i18n/BuyerLocaleContext'

export default function NotFound() {
  const { t } = useBuyerLocale()
  return (
    <section className="py-24 text-center">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-bold text-neutral-800 mt-2">{t.notFound.title}</h2>
        <p className="mt-4 text-neutral-600">
          {t.notFound.subtitle}
        </p>
        <Link to="/" className="btn-primary mt-8 inline-block">
          {t.notFound.back}
        </Link>
      </div>
    </section>
  )
}
