import { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MessageSquareText, PhoneCall, Gift, Zap, UserCheck } from 'lucide-react'
import QuoteForm from './QuoteForm'
import CallbackForm from './CallbackForm'
import SuccessModal from './SuccessModal'

type Tab = 'quote' | 'callback'

const QuoteCallbackBlock = memo(function QuoteCallbackBlock() {
  const { t } = useTranslation('common')
  const [tab, setTab] = useState<Tab>('quote')
  const [successModal, setSuccessModal] = useState<{ title: string; message?: string } | null>(null)

  const handleSuccess = useCallback((title: string, message?: string) => {
    setSuccessModal({ title, message })
  }, [])

  const handleCloseModal = useCallback(() => {
    setSuccessModal(null)
  }, [])

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.10)]">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* ── Left column: trust signals ── */}
        <div className="lg:col-span-2 relative bg-gradient-to-br from-primary via-[#1a3a5c] to-[#0f2440] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/10 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" aria-hidden />

          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl lg:text-[1.7rem] font-bold leading-tight tracking-tight">
              {t('home.letRestartPartner')}
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] text-white/60 leading-relaxed">
              {t('home.weAssist')}
            </p>

            {/* Benefits of contacting */}
            <div className="mt-6 lg:mt-8 space-y-3">
              {[
                { icon: Gift, text: t('home.formBenefit1') },
                { icon: Zap, text: t('home.formBenefit2') },
                { icon: UserCheck, text: t('home.formBenefit3') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.06]">
                    <Icon className="w-4 h-4 text-accent-light" />
                  </div>
                  <span className="text-sm text-white/75 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence note */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/[0.08]">
            <p className="text-xs text-white/40 leading-relaxed">
              {t('home.workingHours')}
            </p>
          </div>
        </div>

        {/* ── Right column: form ── */}
        <div className="lg:col-span-3 bg-white p-5 sm:p-8 lg:p-10">
          {/* Tab pills */}
          <div className="flex rounded-xl bg-neutral-100 p-1 mb-1" role="tablist" aria-label={t('home.getQuote')}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'quote'}
              onClick={() => setTab('quote')}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-3 px-3 sm:px-4 text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                tab === 'quote'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/[0.04]'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <MessageSquareText className="w-4 h-4 shrink-0" />
              {t('home.getQuote')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'callback'}
              onClick={() => setTab('callback')}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-3 px-3 sm:px-4 text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                tab === 'callback'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/[0.04]'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              {t('home.requestCallback')}
            </button>
          </div>

          {/* Form panel */}
          <div role="tabpanel">
            {tab === 'quote' ? (
              <QuoteForm onSuccess={handleSuccess} />
            ) : (
              <CallbackForm onSuccess={handleSuccess} />
            )}
          </div>

          {/* Legal text */}
          <p className="mt-6 text-[11px] text-neutral-400 leading-relaxed max-w-[540px]">
            {t('form.smsConsentText')}
            <Link to="/privacy" className="text-accent hover:underline">{t('form.privacyPolicy')}</Link>.
          </p>
        </div>
      </div>

      <SuccessModal
        open={successModal !== null}
        onClose={handleCloseModal}
        title={successModal?.title ?? ''}
        message={successModal?.message}
      />
    </div>
  )
})

export default QuoteCallbackBlock
