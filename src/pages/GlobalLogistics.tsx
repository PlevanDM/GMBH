import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'

const features = [
  'Quality packaging',
  'Insurance',
  'Cooperation with delivery services with a proven track record in the delivery market',
  'The recipient of the equipment receives a track for a clear understanding of the delivery time',
]

export default function GlobalLogistics() {
  return (
    <>
      <PageHero
        title="Global Logistics — International Equipment Delivery & Tracking"
        subtitle="Our efficient global logistics network ensures your equipment reaches its destination safely and on time, saving you valuable resources."
      />
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-primary">We ensure your equipment is cared for with the following:</h2>
          <ul className="mt-6 space-y-3 text-neutral-600 list-disc list-inside leading-relaxed">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              to="/#quote"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover"
            >
              Get a Quote
            </Link>
            <span className="text-neutral-500 text-sm">Related:</span>
            <Link to="/equipment-support" className="text-accent hover:underline text-sm font-medium">Equipment Support</Link>
            <Link to="/security-management" className="text-accent hover:underline text-sm font-medium">Security & Management</Link>
          </div>
        </div>
      </section>
    </>
  )
}
