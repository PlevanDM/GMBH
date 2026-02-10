import { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { sanitizeInput, isValidPhone, rateLimit, rateLimitRemaining, secureFetch } from '@/lib/security'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited'

const CallbackForm = memo(function CallbackForm({
  onSuccess,
}: {
  onSuccess?: (title: string, message?: string) => void
}) {
  const { t } = useTranslation('common')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rateLimit('callback-form', 3, 60_000)) {
      setStatus('rate-limited')
      return
    }

    const cleanPhone = sanitizeInput(phone, 20)
    if (!cleanPhone || !isValidPhone(cleanPhone)) return

    setStatus('sending')
    try {
      const res = await secureFetch('/api/public/callback', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone }),
        timeoutMs: 10_000,
      })
      if (res.ok) {
        setStatus('sent')
        onSuccess?.(t('form.weWillCall'), undefined)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [phone, onSuccess, t])

  return (
    <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
      {/* Friendly prompt */}
      <div className="flex items-start gap-3 rounded-xl bg-accent/[0.04] border border-accent/10 p-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 shrink-0 mt-0.5">
          <Phone className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">{t('home.requestCallback')}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{t('home.weAssist')}</p>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="callback-phone" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          {t('form.placeholderPhone')}
        </label>
        <input
          id="callback-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+49 XXX-XXX-XXXX"
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 min-h-[48px] text-primary text-[16px] placeholder:text-neutral-400 transition-colors duration-200 focus:bg-white focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
          required
          maxLength={20}
          autoComplete="tel"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="group w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/25 active:scale-[0.98] transition-all duration-200 min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={status === 'sending' || status === 'rate-limited'}
      >
        {status === 'sending' ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t('form.sending')}
          </>
        ) : (
          <>
            <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {t('form.requestCallback')}
          </>
        )}
      </button>

      {/* Status messages */}
      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{t('form.errorTry')}</p>
      )}
      {status === 'rate-limited' && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {t('form.tooManyRequests', { seconds: rateLimitRemaining('callback-form') })}
        </p>
      )}
    </form>
  )
})

export default CallbackForm
