import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import QuoteForm from '../components/QuoteForm'
import CallbackForm from '../components/CallbackForm'

export default function Contacts() {
  return (
    <>
      <PageHero title="Contacts" subtitle="We are here to assist you. Every query is our priority." />
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-semibold text-primary">Get in touch</h2>
              <p className="mt-2 text-neutral-600 leading-relaxed">
                Headquarters: Hansaring 61, Cologne (Köln), Germany. Reach us by email or phone during business hours.
              </p>
              <p className="mt-4 text-neutral-700 font-medium">Hansaring 61, 50670 Köln, Germany</p>
              <a href="mailto:info@restartsp.com" className="block mt-2 text-accent hover:underline font-medium">
                info@restartsp.com
              </a>
              <a href="tel:+492211612489" className="block mt-2 text-accent hover:underline font-medium">
                +49 221-16-12-489
              </a>
              <p className="mt-4 text-sm text-neutral-500">Also: +49/221/16 12 – 0</p>
              <Link
                to="/offices"
                className="inline-block mt-6 text-accent font-medium hover:underline"
              >
                View all offices →
              </Link>
            </div>
            <div className="p-6 bg-neutral-50 rounded-xl space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-primary">Get a Quote</h2>
                <p className="mt-2 text-sm text-neutral-600">Name, email, phone, comment.</p>
                <div className="mt-4">
                  <QuoteForm />
                </div>
              </div>
              <div className="pt-6 border-t border-neutral-200">
                <h2 className="text-lg font-semibold text-primary">Request a callback</h2>
                <p className="mt-2 text-sm text-neutral-600">We will call you back.</p>
                <div className="mt-4">
                  <CallbackForm />
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                By providing your phone number, you agree to receive SMS messages from Restart USA Inc related to your request. Message and data rates may apply. Reply STOP to opt out.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
