import PageHero from '../components/PageHero'

export default function Impressum() {
  return (
    <>
      <PageHero title="Impressum" />
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-neutral">
          <p className="text-neutral-600 leading-relaxed">
            <strong>Information in accordance with § 5 TMG (Telemediengesetz)</strong>
          </p>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            Restart<br />
            Hansaring 61<br />
            50670 Köln<br />
            Germany
          </p>
          <p className="mt-6 text-neutral-600 leading-relaxed">
            <strong>Contact</strong><br />
            Email: info@restartsp.com<br />
            Phone: +49 221-16-12-489
          </p>
          <p className="mt-6 text-neutral-600 leading-relaxed text-sm">
            Responsible for content in accordance with § 55 Abs. 2 RStV: Restart (address as above).
            If you have questions regarding this website or our services, please use the contact details above or the contact form.
          </p>
        </div>
      </section>
    </>
  )
}
