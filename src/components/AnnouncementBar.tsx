import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, ArrowRight, Globe2, Clock, Shield } from 'lucide-react'

/**
 * Slim announcement bar above the header.
 * Cycles through value propositions with a smooth fade transition.
 * Dismissible — hidden state persists via sessionStorage.
 */
export default function AnnouncementBar() {
  const { t } = useTranslation('common')
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('announcement_bar_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [activeIdx, setActiveIdx] = useState(0)
  const [fading, setFading] = useState(false)

  const messages = [
    {
      icon: Globe2,
      text: t('bar.msg1', '6 offices across Europe, USA & LATAM'),
      link: '/offices',
    },
    {
      icon: Clock,
      text: t('bar.msg2', 'Average delivery in 48 hours'),
      link: '/#quote',
    },
    {
      icon: Shield,
      text: t('bar.msg3', 'Free consultation — no obligations'),
      link: '/#quote',
    },
  ]

  const cycle = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setActiveIdx((i) => (i + 1) % messages.length)
      setFading(false)
    }, 300)
  }, [messages.length])

  useEffect(() => {
    if (dismissed) return
    const iv = setInterval(cycle, 4500)
    return () => clearInterval(iv)
  }, [dismissed, cycle])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('announcement_bar_dismissed', '1')
    } catch { /* */ }
  }

  if (dismissed) return null

  const current = messages[activeIdx]
  const Icon = current.icon

  return (
    <div className="relative z-[1001] bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-center h-9 sm:h-10 gap-2 text-xs sm:text-[13px] font-medium overflow-hidden">
        <Link
          to={current.link}
          className={`inline-flex items-center gap-2 transition-all duration-300 hover:opacity-80 ${
            fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0 text-accent-light" />
          <span>{current.text}</span>
          <ArrowRight className="w-3 h-3 shrink-0 opacity-60" />
        </Link>

        {/* Dots indicator */}
        <div className="hidden sm:flex items-center gap-1 ml-4">
          {messages.map((_, idx) => (
            <span
              key={idx}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                idx === activeIdx ? 'bg-white w-3' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
