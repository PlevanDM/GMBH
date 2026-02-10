import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'

interface SuccessModalProps {
  open: boolean
  onClose: () => void
  title: string
  message?: string
}

export default function SuccessModal({ open, onClose, title, message }: SuccessModalProps) {
  const { t } = useTranslation('common')

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center transition-transform duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h2 id="success-modal-title" className="mt-4 text-xl font-bold text-primary">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm text-neutral-600">{message}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full btn-primary py-3 rounded-xl"
        >
          {t('form.close')}
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label={t('form.close')}
      />
    </div>
  )
}
