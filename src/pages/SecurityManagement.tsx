import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'

const points = [
  {
    title: 'Effective MDM solutions',
    text: 'Will make your company\'s equipment manageable and your information more secure. We provide MDM solutions depending on your company\'s tasks and partner with various integrators for MDM solutions.',
  },
  {
    title: 'Improving hardware manageability',
    items: [
      'Prohibits the use of untrusted applications and services.',
      'Allows remote configuration of the device according to company policies.',
    ],
  },
  {
    title: 'Ensures equipment security',
    items: [
      'Our solutions allow you to encrypt data on the device.',
      'We provide work with lost devices: search for their location, blocking, destruction of confidential data in memory.',
    ],
  },
  {
    title: 'Microsoft Intune',
    text: 'We work with Microsoft Intune cloud services that allow you to manage Microsoft endpoints.',
  },
  {
    title: 'Apple equipment in ABM',
    text: 'Adding Apple equipment to ABM for even more comfortable management and unconditional status of the owner under any circumstances.',
  },
]

export default function SecurityManagement() {
  return (
    <>
      <PageHero
        title="MDM Solutions & Security Management — Microsoft Intune, Apple ABM"
        subtitle="Security & Management is our main priority. We do not compromise on this sector. We will assure this from our end."
      />
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none space-y-12">
            {points.map((p) => (
              <div key={p.title}>
                <h2 className="text-xl font-semibold text-primary">{p.title}</h2>
                {p.text && <p className="mt-2 text-neutral-600 leading-relaxed">{p.text}</p>}
                {p.items && (
                  <ul className="mt-2 list-disc list-inside text-neutral-600 space-y-1 leading-relaxed">
                    {p.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              to="/#quote"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover"
            >
              Get Quote
            </Link>
            <span className="text-neutral-500 text-sm">Related:</span>
            <Link to="/equipment-support" className="text-accent hover:underline text-sm font-medium">Equipment Support</Link>
            <Link to="/global-logistics" className="text-accent hover:underline text-sm font-medium">Global Logistics</Link>
          </div>
        </div>
      </section>
    </>
  )
}
