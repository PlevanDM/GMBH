import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'

const points = [
  'Full lifecycle support: from purchase and deployment to trade-in and disposal.',
  'Authorized centers: our highly skilled specialists provide top-quality service so your equipment receives the care it needs.',
  'Remote management: we manage equipment remotely in various regions around the world, reducing downtime and cost.',
  'Consistent quality and processes across our global offices and partner network.',
]

export default function EquipmentSupport() {
  return (
    <>
      <PageHero
        title="Equipment Support Services — Lifecycle Management & Service Centers"
        subtitle="Our highly skilled specialists provide top-quality services through our authorized centers, ensuring that your equipment receives the care and attention it needs."
      />
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-neutral-600 max-w-2xl leading-relaxed">
            We cover the entire lifecycle of your equipment — from purchase to trade-in — and manage equipment remotely in various regions around the world.
          </p>
          <ul className="mt-8 space-y-3 text-neutral-600 list-disc list-inside leading-relaxed max-w-2xl">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              to="/#quote"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover"
            >
              Get Quote
            </Link>
            <span className="text-neutral-500 text-sm">Related:</span>
            <Link to="/security-management" className="text-accent hover:underline text-sm font-medium">Security & Management</Link>
            <Link to="/global-logistics" className="text-accent hover:underline text-sm font-medium">Global Logistics</Link>
          </div>
        </div>
      </section>
    </>
  )
}
