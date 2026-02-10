type Props = { title: string; subtitle?: string }

export default function PageHero({ title, subtitle }: Props) {
  return (
    <section className="bg-primary text-white py-16 lg:py-20 shadow-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-4 text-neutral-300 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  )
}
