import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <p className="mt-4 text-neutral-600">
          Страница не найдена.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-block">
          На главную
        </Link>
      </div>
    </section>
  )
}
