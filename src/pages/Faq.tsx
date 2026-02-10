import PageHero from '../components/PageHero'

const faqs = [
  {
    q: 'What regions do you cover?',
    a: 'We have offices and warehouses in Germany, Poland, Ukraine, USA, UK, and Mexico, and manage equipment remotely in various regions worldwide.',
  },
  {
    q: 'Do you provide MDM and security solutions?',
    a: 'Yes. We partner with integrators for MDM solutions, work with Microsoft Intune for Microsoft endpoints, and support adding Apple equipment to ABM for management and clear ownership.',
  },
  {
    q: 'How can I get a quote?',
    a: 'Use the "Get Quote" or "Request a callback" button on the site, or contact us at info@restartsp.com or +49 221-16-12-489. We respond during business hours.',
  },
  {
    q: 'Do you offer global logistics?',
    a: 'Yes. We ensure quality packaging, insurance, cooperation with proven delivery services, and tracking so the recipient knows the delivery time.',
  },
  {
    q: 'What is your loyalty program?',
    a: 'We value our partners and their employees. Our loyalty program rewards individuals with personalized benefits when purchasing computer equipment and smartphones.',
  },
  {
    q: 'What types of equipment do you support?',
    a: 'We cover the full lifecycle of IT equipment: computers, laptops, smartphones, and related devices — from purchase to trade-in, including authorized service and remote management.',
  },
]

export default function Faq() {
  return (
    <>
      <PageHero title="FAQ" subtitle="Frequently asked questions." />
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="space-y-8">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <dt className="text-lg font-semibold text-primary">{q}</dt>
                <dd className="mt-2 text-neutral-600 leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  )
}
