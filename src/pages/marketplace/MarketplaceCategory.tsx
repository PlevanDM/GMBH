import { useParams } from 'react-router-dom'

export default function MarketplaceCategory() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-bold text-primary">Marketplace category</h1>
      <p className="mt-2 text-neutral-600">Категория: {slug ?? '—'} (заглушка).</p>
    </div>
  )
}
