import PageHero from '../components/PageHero'

export default function Privacy() {
  return (
    <>
      <PageHero title="Privacy Policy" />
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-neutral">
          <p className="text-neutral-600 leading-relaxed">
            Restart (“we”, “our”) respects your privacy. This policy describes how we collect, use, and protect your information when you use our website and services.
          </p>

          <h2 className="text-xl font-semibold text-primary mt-10">Who we are</h2>
          <p className="text-neutral-600 leading-relaxed">
            Restart, Hansaring 61, 50670 Köln, Germany. Contact: info@restartsp.com, +49 221-16-12-489.
          </p>

          <h2 className="text-xl font-semibold text-primary mt-8">Data we collect</h2>
          <p className="text-neutral-600 leading-relaxed">
            When you request a quote, request a callback, or contact us, we may collect your name, email, phone number, company name, and message content. We use this only to respond to your request and provide our services.
          </p>

          <h2 className="text-xl font-semibold text-primary mt-8">SMS (callback requests)</h2>
          <p className="text-neutral-600 leading-relaxed">
            By providing your phone number for a callback, you agree to receive SMS messages from Restart USA Inc related to your request. Message and data rates may apply. Reply STOP to opt out, HELP for help. Your information will not be shared with third parties or used for marketing.
          </p>

          <h2 className="text-xl font-semibold text-primary mt-8">Cookies and usage</h2>
          <p className="text-neutral-600 leading-relaxed">
            We may use essential cookies for site operation. We do not sell your data to third parties.
          </p>

          <h2 className="text-xl font-semibold text-primary mt-8">Your rights</h2>
          <p className="text-neutral-600 leading-relaxed">
            You may request access, correction, or deletion of your data by contacting us at info@restartsp.com. If you are in the EU, you have the right to lodge a complaint with a supervisory authority.
          </p>

          <p className="mt-10 text-neutral-500 text-sm leading-relaxed">
            Last updated: 2026. For questions about this policy, contact info@restartsp.com.
          </p>
        </div>
      </section>
    </>
  )
}
