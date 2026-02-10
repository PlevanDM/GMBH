import { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeInput, isValidEmail, isValidPhone, rateLimit, rateLimitRemaining, secureFetch } from '@/lib/security'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited'

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 min-h-[48px] text-primary text-[16px] placeholder:text-neutral-400 transition-colors duration-200 focus:bg-white focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none'

const QuoteForm = memo(function QuoteForm({
  onSuccess,
}: {
  onSuccess?: (title: string, message?: string) => void
}) {
  const { t } = useTranslation('common')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [emailTouched, setEmailTouched] = useState(false)
  const emailValid = !email ? null : isValidEmail(email)
  const showEmailError = emailTouched && email.length > 0 && emailValid === false

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rateLimit('quote-form', 3, 60_000)) {
      setStatus('rate-limited')
      return
    }

    const cleanName = sanitizeInput(name, 100)
    const cleanEmail = email.trim()
    const cleanPhone = sanitizeInput(phone, 20)
    const cleanMessage = sanitizeInput(message, 2000)

    if (!cleanName || !isValidEmail(cleanEmail)) return
    if (cleanPhone && !isValidPhone(cleanPhone)) return

    setStatus('sending')
    try {
      const res = await secureFetch('/api/public/quote', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: cleanMessage,
        }),
        timeoutMs: 10_000,
      })
      if (res.ok) {
        setStatus('sent')
        onSuccess?.(t('form.thankYou'), undefined)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [name, email, phone, message, onSuccess, t])

  return (
    <form id="quote" onSubmit={submit} className="mt-5 text-left space-y-4" noValidate>
      {/* Name + Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quote-name" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            {t('form.placeholderName')}
          </label>
          <input
            id="quote-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.placeholderName')}
            className={inputClass}
            required
            maxLength={100}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="quote-email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            {t('form.placeholderEmail')}
          </label>
          <div className="relative">
            <input
              id="quote-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder={t('form.placeholderEmail')}
              className={cn(
                inputClass,
                'pr-10',
                showEmailError && 'border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-red-100',
                !showEmailError && emailValid === true && 'border-green-400 focus:border-green-400 focus:ring-green-100',
              )}
              required
              maxLength={254}
              autoComplete="email"
              aria-invalid={showEmailError}
              aria-describedby={showEmailError ? 'quote-email-error' : undefined}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {showEmailError && <X className="h-4.5 w-4.5 text-red-500" aria-hidden />}
              {emailValid === true && <Check className="h-4.5 w-4.5 text-green-600" aria-hidden />}
            </span>
          </div>
          {showEmailError && (
            <p id="quote-email-error" className="mt-1 text-xs text-red-600" role="alert">
              {t('form.invalidEmail')}
            </p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="quote-phone" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          {t('form.placeholderPhone')}
        </label>
        <input
          id="quote-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('form.placeholderPhone')}
          className={inputClass}
          maxLength={20}
          autoComplete="tel"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="quote-message" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
          {t('form.placeholderComment')}
        </label>
        <textarea
          id="quote-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('form.placeholderComment')}
          rows={3}
          className={cn(inputClass, 'resize-y min-h-[100px]')}
          maxLength={2000}
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
            <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            {t('form.getQuote')}
          </>
        )}
      </button>

      {/* Status messages */}
      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{t('form.error')}</p>
      )}
      {status === 'rate-limited' && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {t('form.tooManyRequests', { seconds: rateLimitRemaining('quote-form') })}
        </p>
      )}
    </form>
  )
})

export default QuoteForm
