import { useState, useCallback, useEffect, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PARTNERS, type Partner } from '../data/partners'
import FeatureSection from '../components/FeatureSection'
import { BeamsBackground } from '../components/BeamsBackground'
import QuoteCallbackBlock from '../components/QuoteCallbackBlock'
import { Settings, Zap, Package, BarChart3, ArrowRight, ShieldCheck, Globe2, Truck, ExternalLink, Users, Building2, Monitor, X as XIcon } from 'lucide-react'
import { useInView } from '../hooks/useInView'
import { useCountUp } from '../hooks/useCountUp'

export default function Home() {
  const { t } = useTranslation('common')
  // Scroll reveal refs
  const [statsRef, statsInView] = useInView<HTMLDivElement>()
  const [howRef, howInView] = useInView<HTMLDivElement>()
  const [partnersRef, partnersInView] = useInView<HTMLDivElement>()

  return (
    <>
      {/* ═══════════════ Hero ═══════════════ */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen text-white overflow-hidden min-h-[420px] sm:min-h-[500px] md:min-h-[520px] lg:min-h-[600px] xl:min-h-[700px] flex flex-col justify-center pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20 xl:pt-28 xl:pb-24" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f172a 40%, #162544 70%, #1a2b4a 100%)' }}>
        {/* Particle network background — interactive */}
        <BeamsBackground className="absolute inset-0 opacity-70" intensity="medium" />

        {/* Subtle decorative glow orbs */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-accent/6 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-full max-w-2xl h-64 bg-accent/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" aria-hidden="true" />

        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-6 md:gap-8 lg:gap-12 items-center">
            <div className="animate-fade-in-up">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-sm px-4 py-2 text-xs sm:text-sm font-medium text-white/90 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {t('home.badge')}
              </span>

              {/* Title */}
              <h1 className="mt-6 sm:mt-7 text-[1.75rem] leading-[1.2] sm:text-[2rem] sm:leading-tight md:text-[2.15rem] lg:text-[2.5rem] xl:text-[2.85rem] xl:leading-[1.15] font-bold tracking-tight max-w-[640px]">
                {t('home.title1')}{' '}
                <span className="relative text-accent-light">
                  {t('home.title2')}
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full bg-accent-light/40" aria-hidden />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 sm:mt-6 mb-8 sm:mb-10 text-sm sm:text-base lg:text-lg text-neutral-300 max-w-[560px] leading-relaxed">
                {t('home.subtitle')}
              </p>

              {/* Hero check marks */}
              <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-2.5 mb-8">
                {[
                  { icon: <Users className="w-3.5 h-3.5" />, text: t('home.heroCheck1') },
                  { icon: <Package className="w-3.5 h-3.5" />, text: t('home.heroCheck2') },
                  { icon: <Settings className="w-3.5 h-3.5" />, text: t('home.heroCheck3') },
                  { icon: <Globe2 className="w-3.5 h-3.5" />, text: t('home.heroCheck4') },
                ].map(({ icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-2 text-sm text-white/85 bg-white/[0.05] backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                    <span className="text-accent-light">{icon}</span>
                    {text}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  to="/#quote"
                  className="group btn-primary cta-hover px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl min-h-[48px] w-full sm:w-auto text-center text-sm sm:text-base font-semibold shadow-lg shadow-accent/25"
                >
                  {t('home.getQuote')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/contacts"
                  className="btn-secondary cta-hover px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl min-h-[48px] border-white/20 bg-white/[0.06] backdrop-blur-sm text-white hover:bg-white/[0.12] hover:border-white/30 text-inherit w-full sm:w-auto text-center text-sm sm:text-base"
                >
                  {t('home.contactUs')}
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="hidden md:block relative animate-slide-in-right" aria-hidden>
              <div className="relative h-56 md:h-64 lg:h-72 xl:h-80 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl shadow-black/20">
                <img
                  src="/images/hero-illustration.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="eager"
                  width={480}
                  height={320}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
              </div>
              {/* Floating decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-xl border border-accent/20 bg-accent/5 animate-float" style={{ animationDelay: '2s' }} />
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/[0.02] to-transparent" aria-hidden />
      </section>

      {/* ═══════════════ Stats ═══════════════ */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white border-b border-neutral-100">
        <div ref={statsRef} className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className={`text-center mb-8 sm:mb-10 ${statsInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-accent mb-2">{t('home.statsLabel')}</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{t('home.statsTitle')}</h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-500 max-w-xl mx-auto">{t('home.statsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
            <StatCard value={t('home.stat1Value')} label={t('home.stat1Label')} icon={<BarChart3 className="w-5 h-5" />} color="blue" index={0} inView={statsInView} />
            <StatCard value={t('home.stat2Value')} label={t('home.stat2Label')} icon={<ShieldCheck className="w-5 h-5" />} color="indigo" index={1} inView={statsInView} />
            <StatCard value={t('home.stat3Value')} label={t('home.stat3Label')} icon={<Truck className="w-5 h-5" />} color="violet" index={2} inView={statsInView} />
            <StatCard value={t('home.stat4Value')} label={t('home.stat4Label')} icon={<Package className="w-5 h-5" />} color="amber" index={3} inView={statsInView} />
          </div>
        </div>
      </section>

      <FeatureSection />

      {/* ═══════════════ How It Works ═══════════════ */}
      <section className="py-14 sm:py-20 lg:py-28" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)' }}>
        <div ref={howRef} className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className={`text-center mb-10 sm:mb-14 ${howInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-accent mb-2">{t('home.howLabel')}</p>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{t('home.howItWorksTitle')}</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-500 max-w-xl mx-auto">{t('home.howItWorksSubtitle')}</p>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Connector line on desktop */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20" aria-hidden />
            <StepCard step={1} title={t('home.step1Title')} desc={t('home.step1Desc')} icon={<Monitor className="w-5 h-5" />} inView={howInView} index={0} />
            <StepCard step={2} title={t('home.step2Title')} desc={t('home.step2Desc')} icon={<Zap className="w-5 h-5" />} inView={howInView} index={1} />
            <StepCard step={3} title={t('home.step3Title')} desc={t('home.step3Desc')} icon={<Truck className="w-5 h-5" />} inView={howInView} index={2} />
            <StepCard step={4} title={t('home.step4Title')} desc={t('home.step4Desc')} icon={<ShieldCheck className="w-5 h-5" />} inView={howInView} index={3} />
          </div>
        </div>
      </section>

      {/* ═══════════════ Partners ═══════════════ */}
      <PartnersSection inView={partnersInView} ref={partnersRef} t={t} />

      {/* ═══════════════ Quote / Callback ═══════════════ */}
      <section id="quote" className="scroll-mt-20 py-14 sm:py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50">
        <span id="callback" aria-hidden="true" className="absolute top-0 left-0 pointer-events-none" />
        {/* Subtle pattern dots */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden />
        <div className="max-w-[1100px] mx-auto px-4 sm:px-5 lg:px-8 relative z-10">
          <QuoteCallbackBlock />
        </div>
      </section>
    </>
  )
}

/* ─── Sub-components ─── */

const STAT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   ring: 'ring-blue-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  ring: 'ring-amber-100' },
}

function StatCard({ value, label, icon, color, index, inView }: {
  value: string; label: string; icon: React.ReactNode; color: string; index: number; inView: boolean
}) {
  const animated = useCountUp(value, inView, 1600)
  const c = STAT_COLORS[color] || STAT_COLORS.blue
  return (
    <div
      className={`text-center p-5 sm:p-6 rounded-2xl bg-white border border-neutral-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ${inView ? `animate-fade-in-up stagger-${index + 1}` : 'opacity-0'}`}
    >
      <div className={`inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tabular-nums tracking-tight">{animated}</p>
      <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 font-medium">{label}</p>
    </div>
  )
}

const STEP_ICONS_BG = [
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-violet-500 to-violet-600',
  'from-accent to-accent-hover',
]

function StepCard({ step, title, desc, icon, inView, index }: {
  step: number; title: string; desc: string; icon: React.ReactNode; inView: boolean; index: number
}) {
  return (
    <div
      className={`relative rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ${inView ? `animate-fade-in-up stagger-${index + 1}` : 'opacity-0'}`}
    >
      <div className={`relative z-10 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${STEP_ICONS_BG[index]} text-white text-sm font-bold shadow-lg mb-4`}>
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Step {step}</span>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  )
}

/* ─── Partners Section ─── */

const PartnersSection = forwardRef<HTMLDivElement, { inView: boolean; t: (key: string) => string }>(
  function PartnersSection({ inView, t }, ref) {
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

    const closeModal = useCallback(() => setSelectedPartner(null), [])

    return (
      <section className="py-14 sm:py-20 lg:py-28" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)' }}>
        <div ref={ref} className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8">
          {/* Header */}
          <div className={`text-center mb-10 sm:mb-14 ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-accent mb-2">{t('home.partnersLabel')}</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{t('home.trustedBy')}</h2>
            <p className="mt-2 sm:mt-3 text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">
              {t('home.partnersIntro')}
            </p>
          </div>

          {/* Partner cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {PARTNERS.map((partner, i) => (
              <button
                key={partner.name}
                type="button"
                onClick={() => setSelectedPartner(partner)}
                className={`group relative text-left rounded-2xl bg-white border border-neutral-200/80 p-4 sm:p-5 hover:border-accent/30 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)] transition-all duration-300 hover:-translate-y-1 cursor-pointer ${inView ? `animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)}` : 'opacity-0'}`}
              >
                {/* Logo */}
                <div className="flex items-center justify-center h-16 sm:h-20 mb-3 sm:mb-4">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-[64px] sm:max-h-[72px] max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                    loading="lazy"
                    decoding="async"
                    width="140"
                    height="72"
                  />
                </div>
                {/* Info */}
                <h3 className="text-xs sm:text-sm font-semibold text-primary group-hover:text-accent transition-colors">{partner.name}</h3>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5 leading-tight">{partner.industry}</p>
                {/* Scale badge */}
                <div className="flex items-center gap-1 mt-2">
                  <Users className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-neutral-500">{partner.scale}</span>
                </div>
                {/* Hover arrow */}
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-accent/0 group-hover:bg-accent/10 flex items-center justify-center transition-all duration-200">
                  <ArrowRight className="w-3.5 h-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Partner detail modal */}
        {selectedPartner && (
          <PartnerModal partner={selectedPartner} onClose={closeModal} />
        )}
      </section>
    )
  }
)

function PartnerModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const { t } = useTranslation('common')
  // Close on Escape + lock body scroll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={partner.name}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '150ms' }} onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in-scale" style={{ animationDuration: '200ms' }}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center h-16 sm:h-20 mb-5 sm:mb-6 bg-neutral-50 rounded-xl border border-neutral-100 p-4">
          <img
            src={partner.logo}
            alt={partner.name}
            className="max-h-[56px] max-w-[200px] object-contain"
            width="200"
            height="56"
          />
        </div>

        {/* Name & Industry */}
        <h3 className="text-xl sm:text-2xl font-bold text-primary">{partner.name}</h3>
        <p className="text-sm text-accent font-medium mt-1">{partner.industry}</p>

        {/* Description */}
        <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
          {partner.description}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-5 sm:mt-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{partner.scale}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 text-violet-700">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{partner.industry.split('&')[0].trim()}</span>
          </div>
        </div>

        {/* Visit website */}
        {partner.url && (
          <a
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
            aria-label={`${t('home.visitWebsite')} — ${partner.name}`}
          >
            {t('home.visitWebsite')}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
