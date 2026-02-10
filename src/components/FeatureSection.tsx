import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { RefreshCw, Zap, Shield, ArrowRightLeft, Globe, Gift } from 'lucide-react'
import { useInView } from '../hooks/useInView'

const FEATURE_KEYS = [
  'lifecycle',
  'onboarding',
  'security',
  'tradeIn',
  'logistics',
  'corporate',
] as const

const FEATURE_ICONS = [RefreshCw, Zap, Shield, ArrowRightLeft, Globe, Gift]

const FEATURE_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100', hover: 'group-hover:bg-blue-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', hover: 'group-hover:bg-amber-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', hover: 'group-hover:bg-emerald-100' },
  { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100', hover: 'group-hover:bg-violet-100' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100', hover: 'group-hover:bg-cyan-100' },
  { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100', hover: 'group-hover:bg-rose-100' },
]

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  colorIndex: number
  className?: string
}

const FeatureCard = memo(function FeatureCard({ icon, title, description, colorIndex, className }: FeatureCardProps) {
  const c = FEATURE_COLORS[colorIndex % FEATURE_COLORS.length]
  return (
    <div
      className={cn(
        'group rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left',
        className
      )}
    >
      <div className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring} ${c.hover} transition-colors duration-300 mb-4`}>
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-500">
        {description}
      </p>
    </div>
  )
})

export interface FeatureItem {
  title: string
  description: string
  icon: React.ReactNode
}

interface FeatureSectionProps {
  title?: string
  subtitle?: string
}

export default function FeatureSection({ title, subtitle }: FeatureSectionProps) {
  const { t } = useTranslation('common')
  const sectionTitle = title ?? t('whyChooseUs.title')
  const sectionSubtitle = subtitle ?? t('whyChooseUs.subtitle')
  // Триггер раньше (rootMargin 150px вниз) — контент появляется до пустоты при скролле
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '0px 0px 150px 0px', threshold: 0.08 })

  return (
    <section className="py-14 sm:py-20 md:py-24 lg:py-32 bg-white">
      <div ref={ref} className="max-w-landing mx-auto px-5 sm:px-6 lg:px-8 xl:px-20 text-center">
        <div className={inView ? 'animate-fade-in-up' : 'opacity-0'}>
          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-accent mb-2">{t('whyChooseUs.label', 'Why us')}</p>
          <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary">{sectionTitle}</h2>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-neutral-500 max-w-[720px] mx-auto leading-relaxed">{sectionSubtitle}</p>
        </div>

        {/* Hero image with overlay */}
        <div className={`mt-10 sm:mt-12 mx-auto max-w-3xl rounded-2xl overflow-hidden border border-neutral-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ${inView ? 'animate-fade-in-scale stagger-3' : 'opacity-0'}`}>
          <div className="relative">
            <img src="/images/why-choose-us-section.png" alt="" className="w-full h-auto object-cover" width={800} height={400} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          </div>
        </div>

        {/* Feature cards grid */}
        <div className="mt-10 sm:mt-12 lg:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = FEATURE_ICONS[i]
            return (
              <div key={key} className={inView ? `animate-fade-in-up stagger-${i + 1}` : 'opacity-0'}>
                <FeatureCard
                  icon={<Icon className="h-6 w-6 lg:h-7 lg:w-7" />}
                  title={t(`whyChooseUs.features.${key}.title`)}
                  description={t(`whyChooseUs.features.${key}.description`)}
                  colorIndex={i}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
